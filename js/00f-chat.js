/* ============================================================
   js/00f-chat.js
   - Chat real-time admin <-> kandidat
   - Anti-cheat SAFE: semua UI di overlay internal (tidak trigger blur)
   - Support text + image (paste Ctrl+V, drag, picker)
   - Reliable send via 00g-chat-sync.js (queue + retry + optimistic UI)
   - FIX: device ID konsisten + expose window.__chatRoomId + FAB selalu muncul
   ============================================================ */

const CHAT_MAX_IMAGE_DIM = 900;
const CHAT_JPEG_QUALITY   = 0.65;
const CHAT_MAX_IMAGE_KB   = 500;
const CHAT_MAX_KEEP       = 60;

let __chatUnsub    = null;
let __chatRoomId   = null;
let __chatRole     = null;   // 'admin' | 'candidate'
let __chatAudioCtx = null;

/* ------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------ */
function __chatMyDeviceId() {
  if (typeof getOrCreateDeviceId === 'function') {
    return getOrCreateDeviceId();
  }
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

function __chatNow() {
  return (typeof firebase !== 'undefined' && firebase.database)
    ? firebase.database.ServerValue.TIMESTAMP : Date.now();
}

function __chatEscape(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function __chatTimeHM(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

/* ------------------------------------------------------------
   SOUND — soft ding 2 nada
   ------------------------------------------------------------ */
function __chatPlayDing() {
  try {
    if (!__chatAudioCtx) {
      __chatAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      window.__chatAudioCtx = __chatAudioCtx;   // ✅ expose
    }
    const ctx = __chatAudioCtx;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
      if (ctx.state === 'suspended') return;   // ✅ skip kalau masih suspended
    }
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.15, now + i * 0.08 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.28);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.32);
    });
  } catch (e) {}
}

/* ------------------------------------------------------------
   KOMPRESI GAMBAR
   ------------------------------------------------------------ */
function __chatCompress(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Bukan file gambar')); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > CHAT_MAX_IMAGE_DIM || h > CHAT_MAX_IMAGE_DIM) {
          if (w > h) { h = Math.round(h * CHAT_MAX_IMAGE_DIM / w); w = CHAT_MAX_IMAGE_DIM; }
          else       { w = Math.round(w * CHAT_MAX_IMAGE_DIM / h); h = CHAT_MAX_IMAGE_DIM; }
        }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        let q = CHAT_JPEG_QUALITY;
        let data = c.toDataURL('image/jpeg', q);
        while (data.length * 0.75 / 1024 > CHAT_MAX_IMAGE_KB && q > 0.3) {
          q -= 0.1;
          data = c.toDataURL('image/jpeg', q);
        }
        resolve(data);
      };
      img.onerror = () => reject(new Error('Gagal load gambar'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Gagal baca file'));
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------
   KIRIM PESAN — fallback
   ------------------------------------------------------------ */
function sendChatMessage({ from, text, image, roomId }) {
  return new Promise((resolve, reject) => {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      return reject(new Error('Firebase belum siap'));
    }
    const rid = roomId || __chatMyDeviceId();
    const t = (text || '').trim().slice(0, 2000);
    if (!t && !image) return reject(new Error('Pesan kosong'));

    const roomRef = firebase.database().ref('sgs_state/chats/' + rid);
    const msg = { from, ts: __chatNow(), read: false };
    if (t)     msg.text  = t;
    if (image) msg.image = image;

    roomRef.child('messages').push(msg).then(() => {
      const meta = {
        lastFrom: from,
        lastTs: __chatNow(),
        lastMessage: t ? t.slice(0, 60) : '📷 Gambar'
      };
      if (from === 'candidate') {
        try {
          const id = JSON.parse(localStorage.getItem('identity') || '{}');
          meta.name = id.name || '';
          meta.position = id.position || '';
        } catch (e) {}
      }
      roomRef.update(meta);

      const msgsRef = roomRef.child('messages');
      msgsRef.limitToLast(500).once('value').then(snap => {
        const total = snap.numChildren();
        if (total > CHAT_MAX_KEEP) {
          const del = total - CHAT_MAX_KEEP;
          Object.keys(snap.val()).slice(0, del).forEach(k => msgsRef.child(k).remove());
        }
      }).catch(() => {});

      resolve();
    }).catch(reject);
  });
}

/* ------------------------------------------------------------
   MARK AS READ
   ------------------------------------------------------------ */
function markChatRead(role, roomId) {
  const target = roomId || __chatMyDeviceId();
  const opposite = role === 'admin' ? 'candidate' : 'admin';
  const msgsRef = firebase.database().ref('sgs_state/chats/' + target + '/messages');

  msgsRef.orderByChild('from').equalTo(opposite).once('value').then(snap => {
    const updates = {};
    snap.forEach(ch => { if (!ch.val()?.read) updates[ch.key + '/read'] = true; });
    if (Object.keys(updates).length) msgsRef.update(updates);
  }).catch(() => {});
}

/* ------------------------------------------------------------
   COUNT UNREAD
   ------------------------------------------------------------ */
function countUnreadFor(role, roomId, cb) {
  const target = roomId || __chatMyDeviceId();
  const opposite = role === 'admin' ? 'candidate' : 'admin';
  const ref = firebase.database().ref('sgs_state/chats/' + target + '/messages');
  ref.orderByChild('from').equalTo(opposite).on('value', snap => {
    let n = 0;
    snap.forEach(ch => { if (!ch.val()?.read) n++; });
    cb(n);
  });
}

/* ------------------------------------------------------------
   LIGHTBOX (in-page, TIDAK trigger blur)
   ------------------------------------------------------------ */
function __chatOpenLightbox(src) {
  const old = document.getElementById('chatLightbox');
  if (old) old.remove();

  const lb = document.createElement('div');
  lb.id = 'chatLightbox';
  lb.style.cssText = `
    position: fixed; inset: 0; z-index: 100001;
    background: rgba(0,0,0,.92);
    display: flex; align-items: center; justify-content: center;
    padding: 30px; cursor: zoom-out;
  `;
  lb.innerHTML = `<img src="${src}" style="
    max-width: 100%; max-height: 100%;
    border-radius: 8px; box-shadow: 0 30px 90px rgba(0,0,0,.7);
  ">`;
  lb.onclick = () => lb.remove();
  document.body.appendChild(lb);
}

/* ------------------------------------------------------------
   RENDER CHAT WINDOW
   ------------------------------------------------------------ */
function __chatRenderWindow({ title, roomId, role, onClose }) {
  __chatRoomId = roomId;
  __chatRole   = role;

  /* ✅ PATCH 2: Expose ke window untuk debug */
  window.__chatRoomId     = roomId;
  window.__chatRole       = role;
  window.__chatMyId       = __chatMyDeviceId();
  window.__chatLastSeenTs = 0;

  const old = document.getElementById('chatWindowOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'chatWindowOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 100000;
    background: rgba(10,20,35,.55);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    font-family: Inter, system-ui, -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="
      width: min(520px, 100%);
      height: min(680px, calc(100vh - 40px));
      display: flex; flex-direction: column;
      background: #fff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 30px 90px rgba(0,0,0,.5);
    ">
      <!-- HEADER -->
      <div style="
        padding: 16px 20px;
        background: linear-gradient(135deg, #1e3a8a, #3b82f6);
        color: #fff;
        display: flex; align-items: center; gap: 12px;
      ">
        <div style="
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255,255,255,.18);
          display: grid; place-items: center;
          font-size: 20px;
        ">${role === 'admin' ? '👤' : '🎧'}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 800; font-size: 15px;">${__chatEscape(title)}</div>
          <div id="chatConnStatus" style="font-size: 11px; opacity: .85;">
            <span style="
              display: inline-block; width: 7px; height: 7px;
              border-radius: 50%; background: #94a3b8; margin-right: 5px;
            "></span><span>Menyambung...</span>
          </div>
        </div>
        <button id="chatCloseBtn" style="
          width: 34px; height: 34px;
          background: rgba(255,255,255,.15);
          border: 1px solid rgba(255,255,255,.25);
          border-radius: 9px; color: #fff;
          font-size: 16px; cursor: pointer; font-family: inherit;
        ">✕</button>
      </div>

      <!-- MESSAGES -->
      <div id="chatMessages" style="
        flex: 1; overflow-y: auto;
        padding: 16px 14px;
        background: #f6f8fb;
        display: flex; flex-direction: column; gap: 8px;
      "></div>

      <!-- INPUT -->
      <div id="chatInputArea" style="
        padding: 12px 14px;
        background: #fff;
        border-top: 1px solid #e5e7eb;
      ">
        <div id="chatPreviewWrap" style="display:none; margin-bottom: 8px;">
          <div style="position: relative; display: inline-block; padding: 6px; background: #f1f5f9; border-radius: 10px;">
            <img id="chatPreviewImg" style="max-width: 120px; max-height: 120px; border-radius: 8px; display: block;">
            <button id="chatPreviewRemove" style="
              position: absolute; top: -6px; right: -6px;
              width: 22px; height: 22px; border-radius: 50%;
              background: #ef4444; color: #fff;
              border: 2px solid #fff; cursor: pointer;
              font-size: 12px; font-weight: 800; font-family: inherit;
            ">×</button>
          </div>
        </div>

        <div style="display: flex; gap: 8px; align-items: flex-end;">
          <button id="chatImgBtn" title="Upload gambar (Ctrl+V juga bisa)" style="
            width: 40px; height: 40px; flex: 0 0 40px;
            background: #f1f5f9; border: 1px solid #e2e8f0;
            border-radius: 12px; cursor: pointer; font-size: 18px;
          ">📎</button>
          <input type="file" id="chatFileInput" accept="image/*" style="display: none;">
          <textarea id="chatTextInput" placeholder="Ketik pesan... (Ctrl+V untuk paste gambar)" style="
            flex: 1; min-height: 40px; max-height: 120px;
            padding: 10px 12px;
            border: 1px solid #e2e8f0; border-radius: 12px;
            font-family: inherit; font-size: 14px;
            resize: none; outline: none; line-height: 1.4;
          "></textarea>
          <button id="chatSendBtn" style="
            width: 40px; height: 40px; flex: 0 0 40px;
            background: linear-gradient(135deg, #3b82f6, #1e40af);
            color: #fff; border: 0; border-radius: 12px;
            cursor: pointer; font-size: 16px;
            box-shadow: 0 4px 12px rgba(59,130,246,.3);
          ">➤</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  /* ------- DOM refs ------- */
  const messagesEl = document.getElementById('chatMessages');
  const textarea   = document.getElementById('chatTextInput');
  const sendBtn    = document.getElementById('chatSendBtn');
  const imgBtn     = document.getElementById('chatImgBtn');
  const fileInput  = document.getElementById('chatFileInput');
  const previewWrap= document.getElementById('chatPreviewWrap');
  const previewImg = document.getElementById('chatPreviewImg');
  const previewRm  = document.getElementById('chatPreviewRemove');
  const closeBtn   = document.getElementById('chatCloseBtn');
  const inputArea  = document.getElementById('chatInputArea');

  let pendingImage = null;
  let __serverMessages = [];

  /* ------------------------------------------------------------
     PREVIEW GAMBAR
     ------------------------------------------------------------ */
  function updatePreview() {
    if (pendingImage) {
      previewImg.src = pendingImage;
      previewWrap.style.display = 'block';
    } else {
      previewWrap.style.display = 'none';
    }
  }

  /* ------------------------------------------------------------
     RENDER MESSAGES (server + pending)
     ------------------------------------------------------------ */
  function renderMessages() {
    const serverIds = new Set(
      __serverMessages.map(m => m.localId).filter(Boolean)
    );

    let pending = [];
    if (typeof getPendingMessagesForRoom === 'function') {
      pending = getPendingMessagesForRoom(roomId)
        .filter(p => !serverIds.has(p.localId))
        .map(p => ({
          id: 'pending_' + p.localId,
          from: p.from,
          text: p.text,
          image: p.image,
          ts: p.clientTs,
          _pending: true,
          _retries: p.retries || 0
        }));
    }

    const merged = [...__serverMessages, ...pending]
      .sort((a, b) => (a.ts || 0) - (b.ts || 0));

    if (!merged.length) {
      messagesEl.innerHTML = `
        <div style="text-align:center;color:#94a3b8;font-size:12px;padding:30px 10px;">
          <div style="font-size:36px;margin-bottom:8px;">💬</div>
          Belum ada pesan. Mulai percakapan!
        </div>`;
      return;
    }

    messagesEl.innerHTML = merged.map(m => {
      const isMe = (role === 'admin' && m.from === 'admin') ||
                   (role === 'candidate' && m.from === 'candidate');
      const bg    = isMe ? 'linear-gradient(135deg,#3b82f6,#1e40af)' : '#fff';
      const color = isMe ? '#fff' : '#1e293b';

      let body = '';
      if (m.text) {
        body += `<div style="white-space:pre-wrap;word-break:break-word;line-height:1.45;font-size:13.5px;">${__chatEscape(m.text)}</div>`;
      }
      if (m.image) {
        body += `<img src="${m.image}" data-lightbox="1" data-src="${m.image}" style="
          display:block; max-width:220px; max-height:220px;
          border-radius:8px; margin-top:${m.text ? '6px' : '0'};
          cursor: zoom-in;
        ">`;
      }

      let statusIcon = '';
      if (isMe && m._pending) {
        statusIcon = m._retries > 0
          ? `<span title="Mencoba ulang (${m._retries}×)..." style="color:#f59e0b;"> ⟳ ${m._retries}</span>`
          : `<span title="Mengirim..." style="color:#94a3b8;"> ⏳</span>`;
      }

      return `
        <div style="
          display:flex; flex-direction:column;
          align-items:${isMe ? 'flex-end' : 'flex-start'};
          gap:3px;
          ${m._pending ? 'opacity:.75;' : ''}
        ">
          <div style="
            max-width:78%; padding:9px 12px;
            background:${bg}; color:${color};
            border-radius:14px;
            box-shadow:0 2px 6px rgba(15,23,42,.06); font-size:13px;
            ${m._pending ? 'border:1px dashed rgba(148,163,184,.5);' : ''}
          ">${body}</div>
          <div style="font-size:10px;color:#94a3b8;padding:0 4px;">
            ${__chatTimeHM(m.ts)}${statusIcon}
          </div>
        </div>`;
    }).join('');

    messagesEl.querySelectorAll('img[data-lightbox]').forEach(img => {
      img.onclick = (e) => {
        e.preventDefault();
        __chatOpenLightbox(img.dataset.src);
      };
    });

    setTimeout(() => { messagesEl.scrollTop = messagesEl.scrollHeight; }, 30);
  }

  /* ------------------------------------------------------------
     HANDLE FILE
     ------------------------------------------------------------ */
  async function handleFile(file) {
    try { pendingImage = await __chatCompress(file); updatePreview(); }
    catch (e) { alert('Gagal proses gambar: ' + e.message); }
  }

  /* ------------------------------------------------------------
     KIRIM PESAN
     ------------------------------------------------------------ */
  async function doSend() {
    const text = textarea.value.trim();
    if (!text && !pendingImage) return;

    const savedImage = pendingImage;
    const savedText  = text;

    textarea.value = '';
    textarea.style.height = 'auto';
    pendingImage = null;
    updatePreview();

    if (typeof enqueueChatMessage === 'function') {
      enqueueChatMessage({
        from: role,
        text: savedText,
        image: savedImage,
        roomId
      }).catch(e => {
        console.error('[CHAT] Enqueue gagal:', e);
        if (savedImage) { pendingImage = savedImage; updatePreview(); }
        if (savedText)  { textarea.value = savedText; }
      });
    } else {
      try {
        await sendChatMessage({ from: role, text: savedText, image: savedImage, roomId });
      } catch (e) {
        if (savedImage) { pendingImage = savedImage; updatePreview(); }
        if (savedText)  { textarea.value = savedText; }
        alert('Gagal kirim: ' + e.message);
      }
    }

    markChatRead(role, roomId);
  }

  /* ------------------------------------------------------------
     EVENT BINDINGS
     ------------------------------------------------------------ */
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(120, textarea.scrollHeight) + 'px';
  });
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  });

  textarea.addEventListener('paste', async e => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.type?.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) { e.preventDefault(); await handleFile(f); return; }
      }
    }
  });

  inputArea.addEventListener('dragover', e => e.preventDefault());
  inputArea.addEventListener('drop', async e => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files?.length) {
      for (const f of files) {
        if (f.type.startsWith('image/')) { await handleFile(f); break; }
      }
    }
  });

  imgBtn.onclick = () => fileInput.click();
  fileInput.onchange = async () => {
    if (fileInput.files?.[0]) { await handleFile(fileInput.files[0]); fileInput.value = ''; }
  };
  previewRm.onclick = () => { pendingImage = null; updatePreview(); };
  sendBtn.onclick = doSend;

  /* ------------------------------------------------------------
     CONNECTION INDICATOR
     ------------------------------------------------------------ */
  const connEl = document.getElementById('chatConnStatus');
  function __updateConnUI(status) {
    if (!connEl) return;
    if (status === 'online') {
      connEl.innerHTML = `<span style="
        display:inline-block;width:7px;height:7px;border-radius:50%;
        background:#22c55e;margin-right:5px;
        box-shadow:0 0 0 3px rgba(34,197,94,.3);
      "></span><span>Terhubung</span>`;
    } else if (status === 'offline') {
      connEl.innerHTML = `<span style="
        display:inline-block;width:7px;height:7px;border-radius:50%;
        background:#f59e0b;margin-right:5px;
        box-shadow:0 0 0 3px rgba(245,158,11,.3);
      "></span><span>Menunggu koneksi...</span>`;
    } else {
      connEl.innerHTML = `<span style="
        display:inline-block;width:7px;height:7px;border-radius:50%;
        background:#94a3b8;margin-right:5px;
      "></span><span>Menyambung...</span>`;
    }
  }

  if (typeof onChatConnectionChange === 'function') {
    onChatConnectionChange(__updateConnUI);
  } else {
    __updateConnUI('online');
  }

  /* ------------------------------------------------------------
     CLEANUP + CLOSE
     ------------------------------------------------------------ */
  function __handleQueueChange() {
    renderMessages();
  }

  function __cleanup() {
    if (__chatUnsub) { try { __chatUnsub(); } catch (e) {} __chatUnsub = null; }
    window.removeEventListener('chat-msg-sent', __handleQueueChange);
    window.removeEventListener('chat-msg-failed', __handleQueueChange);
  }

  closeBtn.onclick = () => {
    __cleanup();
    overlay.remove();
    if (typeof onClose === 'function') onClose();
  };

   /* ------------------------------------------------------------
     LISTEN MESSAGES — child_added, tanpa orderByChild
     ------------------------------------------------------------ */
  const ref = firebase.database().ref('sgs_state/chats/' + roomId + '/messages');

  const onChildAdded = (snap) => {
    const m = { id: snap.key, ...snap.val() };
    if (__serverMessages.some(x => x.id === m.id)) return;

    __serverMessages.push(m);
    __serverMessages.sort((a, b) => {
      const ta = a.ts || a.clientTs || 0;
      const tb = b.ts || b.clientTs || 0;
      return ta - tb;
    });

    const opposite = role === 'admin' ? 'candidate' : 'admin';
    const msgTs = m.ts || m.clientTs || 0;
    if (m.from === opposite && msgTs > (window.__chatLastSeenTs || 0)) {
      window.__chatLastSeenTs = msgTs;
      __chatPlayDing();
      markChatRead(role, roomId);
    }

    renderMessages();
  };

  ref.on('child_added', onChildAdded);

  window.addEventListener('chat-msg-sent', __handleQueueChange);
  window.addEventListener('chat-msg-failed', __handleQueueChange);

  __chatUnsub = () => ref.off('child_added', onChildAdded);

  /* ------------------------------------------------------------
     INITIAL RENDER
     ------------------------------------------------------------ */
  renderMessages();
  setTimeout(() => { markChatRead(role, roomId); textarea.focus(); }, 300);
}

/* ------------------------------------------------------------
   OPEN — Candidate
   ------------------------------------------------------------ */
function openChatForCandidate() {
  __chatRenderWindow({
    title: 'Chat dengan Admin',
    roomId: __chatMyDeviceId(),
    role: 'candidate'
  });
}

/* ------------------------------------------------------------
   OPEN — Admin
   ------------------------------------------------------------ */
function openChatForAdmin(roomId, candidateName) {
  __chatRenderWindow({
    title: candidateName ? ('Chat: ' + candidateName) : 'Chat Kandidat',
    roomId,
    role: 'admin'
  });
}

/* ------------------------------------------------------------
   FAB untuk kandidat
   ✅ PATCH 1: cek sessionStorage DIHAPUS — FAB selalu muncul
   ------------------------------------------------------------ */
function __chatInjectCandidateBubble() {
  if (document.getElementById('chatFabCandidate')) return;
  if (typeof isAdminUrl === 'function' && isAdminUrl()) return;

  const fab = document.createElement('button');
  fab.id = 'chatFabCandidate';
  fab.title = 'Chat dengan Admin';
  fab.innerHTML = `
    💬
    <span id="chatFabBadge" style="
      position: absolute; top: -4px; right: -4px;
      min-width: 18px; height: 18px; padding: 0 5px;
      background: #ef4444; color: #fff; font-size: 10px;
      border-radius: 999px; font-weight: 800;
      display: none; place-items: center;
      box-shadow: 0 0 0 3px #fff;
      font-family: system-ui, sans-serif;
    "></span>
  `;
  fab.style.cssText = `
    position: fixed; bottom: 22px; right: 22px;
    width: 54px; height: 54px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #1e40af);
    color: #fff; font-size: 24px;
    border: 0; cursor: pointer;
    box-shadow: 0 12px 28px rgba(30,64,175,.35);
    z-index: 9998;
    transition: transform .18s;
    font-family: inherit;
  `;
  fab.onmouseenter = () => fab.style.transform = 'scale(1.08)';
  fab.onmouseleave = () => fab.style.transform = 'scale(1)';
  fab.onclick = openChatForCandidate;
  document.body.appendChild(fab);

  setTimeout(() => {
    countUnreadFor('candidate', __chatMyDeviceId(), n => {
      const b = document.getElementById('chatFabBadge');
      const fabEl = document.getElementById('chatFabCandidate');
      if (!b || !fabEl) return;

      if (n > 0) {
        b.textContent = n > 99 ? '99+' : n;
        b.style.display = 'grid';
        b.classList.add('chat-badge-blink');
        fabEl.classList.add('chat-blink');
      } else {
        b.style.display = 'none';
        b.classList.remove('chat-badge-blink');
        fabEl.classList.remove('chat-blink');
      }
    });
  }, 1500);
}

/* ------------------------------------------------------------
   AUTO-INIT
   ------------------------------------------------------------ */
function __chatAutoInit() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    setTimeout(__chatAutoInit, 500);
    return;
  }
  if (typeof isAdminUrl === 'function' && isAdminUrl()) return;
  __chatInjectCandidateBubble();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(__chatAutoInit, 800));
} else {
  setTimeout(__chatAutoInit, 800);
}

/* ------------------------------------------------------------
   EXPORT
   ------------------------------------------------------------ */
window.sendChatMessage      = sendChatMessage;
window.markChatRead         = markChatRead;
window.countUnreadFor       = countUnreadFor;
window.openChatForCandidate = openChatForCandidate;
window.openChatForAdmin     = openChatForAdmin;

console.log('[CHAT] ✓ Loaded');
