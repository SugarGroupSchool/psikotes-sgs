/* ============================================================
   js/00g-chat-sync.js
   - Reliable chat sender with queue + retry + offline
   - Optimistic UI: pesan tampil langsung, kirim di background
   ============================================================ */

const CHAT_QUEUE_KEY    = '_sgs_chat_queue';
const CHAT_RETRY_MAX    = 5;
const CHAT_RETRY_BASE   = 1500;   // 1.5s, 3s, 6s, 12s, 24s

let __chatQueue       = [];
let __chatSending     = false;
let __chatConnStatus  = 'unknown';
let __chatConnListeners = [];

/* ============================================================
   QUEUE STORAGE
   ============================================================ */
function __chatLoadQueue() {
  try {
    const raw = localStorage.getItem(CHAT_QUEUE_KEY);
    __chatQueue = raw ? (JSON.parse(raw) || []) : [];
  } catch (e) {
    __chatQueue = [];
  }
}

function __chatSaveQueue() {
  try {
    localStorage.setItem(CHAT_QUEUE_KEY, JSON.stringify(__chatQueue));
  } catch (e) {}
}

function __chatGenId() {
  return 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

/* ============================================================
   GET DEVICE ID
   ============================================================ */
function __chatSyncGetDeviceId() {
  // 🔒 I2 FIX: Delegasi ke sumber tunggal (00e-presence.js)
  if (typeof window.getOrCreateDeviceId === 'function') {
    return window.getOrCreateDeviceId();
  }
  // Fallback darurat
  try {
    let id = localStorage.getItem('_sgs_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem('_sgs_device_id', id);
    }
    return id;
  } catch (e) {
    return 'dev_anon_' + Math.random().toString(36).slice(2, 10);
  }
}

/* ============================================================
   MONITOR KONEKSI FIREBASE
   ============================================================ */
function __chatInitConnMonitor() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  const connRef = firebase.database().ref('.info/connected');
  connRef.on('value', snap => {
    const connected = snap.val() === true;
    __chatConnStatus = connected ? 'online' : 'offline';
    __chatConnListeners.forEach(cb => {
      try { cb(__chatConnStatus); } catch (e) {}
    });
    if (connected) __chatProcessQueue();
  });
}

function onChatConnectionChange(cb) {
  if (typeof cb !== 'function') return () => {};
  __chatConnListeners.push(cb);
  cb(__chatConnStatus);
  return () => {
    __chatConnListeners = __chatConnListeners.filter(x => x !== cb);
  };
}

function getChatConnectionStatus() {
  return __chatConnStatus;
}

/* ============================================================
   ENABLE OFFLINE PERSISTENCE
   ============================================================ */
function __chatEnableOffline() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  try {
    // 🔒 O5 FIX: Cek apakah mode admin
    const isAdmin = (typeof window.isAdminUrl === 'function' && window.isAdminUrl());

    let ref;
    if (isAdmin) {
      // Admin perlu lihat semua room
      ref = firebase.database().ref('sgs_state/chats');
      console.log('[CHAT-SYNC] ✓ Offline persistence: admin mode (all rooms)');
    } else {
      // Kandidat: hanya room sendiri — hemat bandwidth & storage
      const myId = __chatSyncGetDeviceId();
      ref = firebase.database().ref('sgs_state/chats/' + myId);
      console.log('[CHAT-SYNC] ✓ Offline persistence: candidate mode (own room only)');
    }

    if (typeof ref.keepSynced === 'function') {
      ref.keepSynced(true);
    } else {
      console.log('[CHAT-SYNC] ℹ️ keepSynced tidak tersedia di SDK ini (offline queue bawaan tetap aktif)');
    }
  } catch (e) {
    console.warn('[CHAT-SYNC] Offline persistence gagal:', e);
  }
}

/* ============================================================
   ENQUEUE PESAN
   ============================================================ */
function enqueueChatMessage({ from, text, image, roomId }) {
  return new Promise((resolve, reject) => {
    let rid = roomId;
    if (!rid) {
      rid = __chatSyncGetDeviceId();
    }

    const t = (text || '').trim().slice(0, 2000);
    if (!t && !image) { reject(new Error('Pesan kosong')); return; }

    const localId = __chatGenId();
    const msg = {
      localId,
      from,
      roomId: rid,
      text: t || '',
      image: image || null,
      clientTs: Date.now(),
      retries: 0
    };

    __chatQueue.push(msg);
    __chatSaveQueue();

    resolve({ localId, msg });

    setTimeout(__chatProcessQueue, 50);
  });
}

/* ============================================================
   PROCESS QUEUE
   ============================================================ */
async function __chatProcessQueue() {
  if (__chatSending) return;
  if (__chatQueue.length === 0) return;
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  if (__chatConnStatus === 'offline') {
    console.log('[CHAT-SYNC] Offline, queue tersimpan:', __chatQueue.length);
    return;
  }

  __chatSending = true;

  while (__chatQueue.length > 0) {
    const msg = __chatQueue[0];

    try {
      await __chatSendToFirebase(msg);

      __chatQueue.shift();
      __chatSaveQueue();

      window.dispatchEvent(new CustomEvent('chat-msg-sent', {
        detail: { localId: msg.localId }
      }));

    } catch (err) {
      msg.retries = (msg.retries || 0) + 1;
      console.warn('[CHAT-SYNC] Send failed (retry ' + msg.retries + '):', err.message);

      if (msg.retries >= CHAT_RETRY_MAX) {
        __chatQueue.shift();
        __chatSaveQueue();
        window.dispatchEvent(new CustomEvent('chat-msg-failed', {
          detail: { localId: msg.localId, error: err.message }
        }));
      } else {
        __chatSaveQueue();
        const delay = CHAT_RETRY_BASE * Math.pow(2, msg.retries - 1);
        __chatSending = false;
        setTimeout(__chatProcessQueue, delay);
        return;
      }
    }
  }

  __chatSending = false;
}

/* ============================================================
   SEND TO FIREBASE
   ============================================================ */
function __chatSendToFirebase(msg) {
  return new Promise((resolve, reject) => {
    const roomRef = firebase.database().ref('sgs_state/chats/' + msg.roomId);
    const msgsRef = roomRef.child('messages');

    const payload = {
      from: msg.from,
      ts: firebase.database.ServerValue.TIMESTAMP,
      clientTs: msg.clientTs,
      localId: msg.localId,
      read: false
    };
    if (msg.text)  payload.text  = msg.text;
    if (msg.image) payload.image = msg.image;

    const timeout = setTimeout(() => {
      reject(new Error('Timeout 15s'));
    }, 15000);

    msgsRef.push(payload).then(ref => {
      clearTimeout(timeout);

      const meta = {
        lastFrom: msg.from,
        lastTs: firebase.database.ServerValue.TIMESTAMP,
        lastMessage: msg.text ? msg.text.slice(0, 60) : '📷 Gambar'
      };
      if (msg.from === 'candidate') {
        try {
          const id = JSON.parse(localStorage.getItem('identity') || '{}');
          meta.name = id.name || '';
          meta.position = id.position || '';
        } catch (e) {}
      }
      return roomRef.update(meta);
    }).then(() => {
      resolve();
    }).catch(err => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/* ============================================================
   AMBIL PENDING
   ============================================================ */
function getPendingMessagesForRoom(roomId) {
  return __chatQueue.filter(m => m.roomId === roomId);
}

function getPendingMessageById(localId) {
  return __chatQueue.find(m => m.localId === localId) || null;
}

/* ============================================================
   INIT
   ============================================================ */
function __chatSyncInit() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    setTimeout(__chatSyncInit, 500);
    return;
  }
  __chatLoadQueue();
  __chatEnableOffline();
  __chatInitConnMonitor();
  setTimeout(__chatProcessQueue, 1000);
  console.log('[CHAT-SYNC] ✓ Ready — pending:', __chatQueue.length);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(__chatSyncInit, 800));
} else {
  setTimeout(__chatSyncInit, 800);
}

/* ============================================================
   EXPORT
   ============================================================ */
window.enqueueChatMessage         = enqueueChatMessage;
window.onChatConnectionChange     = onChatConnectionChange;
window.getChatConnectionStatus    = getChatConnectionStatus;
window.getPendingMessagesForRoom  = getPendingMessagesForRoom;
window.getPendingMessageById      = getPendingMessageById;
window.__chatFlushQueue           = __chatProcessQueue;

window.__getChatQueue = () => __chatQueue.slice();
window.__chatQueueDebug = () => {
  if (!__chatQueue.length) {
    console.log('%cQueue kosong (semua pesan terkirim)', 'color:#22c55e;font-weight:bold;');
    return 0;
  }
  console.table(__chatQueue.map(m => ({
    localId: m.localId,
    from: m.from,
    roomId: m.roomId,
    text: (m.text || '').slice(0, 30),
    image: m.image ? '📷' : '',
    retries: m.retries || 0,
    age: Math.round((Date.now() - m.clientTs) / 1000) + 's'
  })));
  return __chatQueue.length;
};

console.log('[CHAT-SYNC] ✓ Loaded');
