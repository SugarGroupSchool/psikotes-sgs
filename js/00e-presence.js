/* ============================================================
   js/00e-presence.js
   - Heartbeat kandidat aktif ke Firebase (30 detik)
   - Admin bisa lihat list real-time
   ============================================================ */

const PRESENCE_DEVICE_KEY   = '_sgs_device_id';
const PRESENCE_HEARTBEAT_MS = 30000;         // 30 detik
const PRESENCE_STALE_MS     = 3 * 60 * 1000; // 3 menit = dianggap offline

let __presenceTimer       = null;
let __presenceDeviceId    = null;
let __presenceRef         = null;
let __presenceListenRef   = null;
let __presenceListenCb    = null;

/* ------------------------------------------------------------
   DEVICE ID
   ------------------------------------------------------------ */
function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(PRESENCE_DEVICE_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(PRESENCE_DEVICE_KEY, id);
    }
    return id;
  } catch (e) {
    return 'dev_anon_' + Math.random().toString(36).slice(2, 10);
  }
}

/* ------------------------------------------------------------
   INIT + HEARTBEAT
   ------------------------------------------------------------ */
function initPresence() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    setTimeout(initPresence, 500);
    return;
  }
  __presenceDeviceId = getOrCreateDeviceId();
  const db = firebase.database();
  __presenceRef = db.ref('sgs_state/sessions/' + __presenceDeviceId);

  // Auto-mark offline saat koneksi putus / tab ditutup
  __presenceRef.onDisconnect().update({
    status: 'offline',
    lastSeen: firebase.database.ServerValue.TIMESTAMP
  });

  pushPresence('active');

  if (__presenceTimer) clearInterval(__presenceTimer);
  __presenceTimer = setInterval(() => pushPresence('active'), PRESENCE_HEARTBEAT_MS);

  console.log('[PRESENCE] ✓ device:', __presenceDeviceId);
}

function pushPresence(status) {
  if (!__presenceRef) return;

  let identity = {};
  try {
    const raw = localStorage.getItem('identity');
    if (raw) identity = JSON.parse(raw) || {};
  } catch (e) {}

  let completedCount = 0, totalTests = 0;
  try {
    const c = JSON.parse(localStorage.getItem('completed') || '{}');
    completedCount = Object.values(c || {}).filter(v => v === true).length;
    const sel = JSON.parse(localStorage.getItem('selectedTests') || '[]');
    if (Array.isArray(sel)) totalTests = sel.length;
  } catch (e) {}

  const st = (typeof appState !== 'undefined' && appState) ? appState : {};

  const payload = {
    deviceId:        __presenceDeviceId,
    name:            identity.name || '(belum isi identitas)',
    nickname:        identity.nickname || '',
    position:        identity.position || '',
    currentTest:     st.currentTest || null,
    currentSubtest:  (st.currentSubtest !== undefined) ? st.currentSubtest : null,
    currentQuestion: (st.currentQuestion !== undefined) ? st.currentQuestion : null,
    completedCount,
    totalTests,
    status:          status || 'active',
    inTestView:      (typeof window !== 'undefined' && window.__inTestView === true),
    lastSeen:        firebase.database.ServerValue.TIMESTAMP
  };

  __presenceRef.once('value').then(snap => {
    if (!snap.exists() || !snap.val()?.startedAt) {
      payload.startedAt = firebase.database.ServerValue.TIMESTAMP;
    }
    __presenceRef.update(payload);
  }).catch(() => __presenceRef.update(payload));
}

function markPresenceOffline() {
  if (!__presenceRef) return;
  __presenceRef.update({
    status: 'offline',
    lastSeen: firebase.database.ServerValue.TIMESTAMP
  }).catch(() => {});
}
window.addEventListener('beforeunload', markPresenceOffline);

/* ------------------------------------------------------------
   READ — untuk admin panel
   ------------------------------------------------------------ */
function __presenceFilterFresh(data) {
  const now = Date.now();
  return Object.keys(data || {})
    .map(k => ({ deviceId: k, ...data[k] }))
    .filter(s => s.lastSeen && s.status !== 'offline' && (now - s.lastSeen) < PRESENCE_STALE_MS)
    .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
}

function listenActiveSessions(callback) {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    callback([]);
    return;
  }
  if (__presenceListenRef && __presenceListenCb) {
    __presenceListenRef.off('value', __presenceListenCb);
  }
  __presenceListenCb = snap => callback(__presenceFilterFresh(snap.val()));
  __presenceListenRef = firebase.database().ref('sgs_state/sessions');
  __presenceListenRef.on('value', __presenceListenCb);
}

function stopListeningActiveSessions() {
  if (__presenceListenRef && __presenceListenCb) {
    __presenceListenRef.off('value', __presenceListenCb);
    __presenceListenRef = null;
    __presenceListenCb = null;
  }
}

/* ------------------------------------------------------------
   AUTO-INIT
   ------------------------------------------------------------ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initPresence, 800));
} else {
  setTimeout(initPresence, 800);
}

/* ------------------------------------------------------------
   EXPORT
   ------------------------------------------------------------ */
window.initPresence              = initPresence;
window.pushPresence              = pushPresence;
window.markPresenceOffline       = markPresenceOffline;
window.listenActiveSessions      = listenActiveSessions;
window.stopListeningActiveSessions = stopListeningActiveSessions;
window.getOrCreateDeviceId       = getOrCreateDeviceId;

console.log('[PRESENCE] ✓ Loaded');
