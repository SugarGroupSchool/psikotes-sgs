/* ============================================================
   js/00e-presence.js
   - Heartbeat kandidat aktif ke Firebase (30 detik)
   - Admin bisa lihat list real-time
   - getOrCreateDeviceId() = sumber tunggal device ID
   - FITUR BARU: listen sinyal allow_retake dari admin
   ============================================================ */

const PRESENCE_DEVICE_KEY   = '_sgs_device_id';
const PRESENCE_HEARTBEAT_MS = 30000;         // 30 detik
const PRESENCE_STALE_MS     = 3 * 60 * 1000; // 3 menit

let __presenceTimer       = null;
let __presenceDeviceId    = null;
let __presenceRef         = null;
let __presenceListenRef   = null;
let __presenceListenCb    = null;

/* ------------------------------------------------------------
   DEVICE ID — SUMBER TUNGGAL
   ------------------------------------------------------------ */
function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(PRESENCE_DEVICE_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(PRESENCE_DEVICE_KEY, id);
      console.log('[PRESENCE] 🆕 Device ID baru dibuat:', id);
    }
    return id;
  } catch (e) {
    const fallback = 'dev_anon_' + Math.random().toString(36).slice(2, 10);
    console.warn('[PRESENCE] localStorage gagal, pakai fallback:', fallback);
    return fallback;
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

  __presenceRef.onDisconnect().update({
    status: 'offline',
    lastSeen: firebase.database.ServerValue.TIMESTAMP
  });

  pushPresence('active');

  if (__presenceTimer) clearInterval(__presenceTimer);
  __presenceTimer = setInterval(() => pushPresence('active'), PRESENCE_HEARTBEAT_MS);

  console.log('[PRESENCE] ✓ device:', __presenceDeviceId);

  // Mulai dengarkan sinyal allow_retake dari admin
  startListeningAllowRetake();
}

/* ------------------------------------------------------------
   PUSH PRESENCE (heartbeat)
   ------------------------------------------------------------ */
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

  // Cek status device
  let isFinished = false;
  let isDisqualified = false;
  try {
    isFinished = localStorage.getItem('_sgs_finished') === '1';
    isDisqualified = localStorage.getItem('_sgs_disqualified') === '1';
  } catch (e) {}

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
    finished:        isFinished,
    disqualified:    isDisqualified,    // ← BARU
    lastSeen:        firebase.database.ServerValue.TIMESTAMP
  };

  __presenceRef.once('value').then(snap => {
    if (!snap.exists() || !snap.val()?.startedAt) {
      payload.startedAt = firebase.database.ServerValue.TIMESTAMP;
    }
    __presenceRef.update(payload);
  }).catch(() => __presenceRef.update(payload));
}

/* ------------------------------------------------------------
   MARK DONE / OFFLINE
   ------------------------------------------------------------ */
function markPresenceDone() {
  pushPresence('done');
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
   LISTEN SINYAL allow_retake DARI ADMIN
   - Kalau admin klik "Izinkan Tes Lagi"
   - Device otomatis hapus _sgs_finished & reload
   ------------------------------------------------------------ */
let __allowRetakeListenRef = null;
let __allowRetakeListenCb  = null;

function startListeningAllowRetake() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  if (!__presenceDeviceId) return;

  // Bersihkan listener lama
  if (__allowRetakeListenRef && __allowRetakeListenCb) {
    try { __allowRetakeListenRef.off('value', __allowRetakeListenCb); } catch (e) {}
  }

  __allowRetakeListenRef = firebase.database()
    .ref('sgs_state/sessions/' + __presenceDeviceId + '/allow_retake');

  __allowRetakeListenCb = (snap) => {
    const allow = snap.val() === true;
    if (!allow) return;

    // Cegah loop: kalau flag sudah pernah diproses di sesi ini, skip
    if (sessionStorage.getItem('_sgs_retake_processed') === '1') return;

    console.log('[PRESENCE] 🔓 Admin izinkan tes lagi — reset device...');

    // Tandai sudah diproses (biar tidak loop)
    try { sessionStorage.setItem('_sgs_retake_processed', '1'); } catch (e) {}

        // Hapus flag device finished & lock & diskualifikasi
    try {
      localStorage.removeItem('_sgs_finished');
      localStorage.removeItem('_sgs_lock');
      localStorage.removeItem('_sgs_disqualified');   // ← BARU
    } catch (e) {}
    // Hapus data kandidat lama
       // Hapus data kandidat lama
    try {
      localStorage.removeItem('identity');
      localStorage.removeItem('completed');
      localStorage.removeItem('selectedTests');
      localStorage.removeItem('usedPragas');   // ← BARU: reset ke FRESH mode
      sessionStorage.removeItem('dlClick');
    } catch (e) {}

    // Reset flag allow_retake di Firebase (biar tidak trigger lagi)
    firebase.database()
      .ref('sgs_state/sessions/' + __presenceDeviceId + '/allow_retake')
      .set(false)
      .catch(() => {});

     // Notif in-page (bukan popup)
    showRetakeBanner();
  };

  __allowRetakeListenRef.on('value', __allowRetakeListenCb);
  console.log('[PRESENCE] 👂 Listening allow_retake untuk device:', __presenceDeviceId);
}

function stopListeningAllowRetake() {
  if (__allowRetakeListenRef && __allowRetakeListenCb) {
    try { __allowRetakeListenRef.off('value', __allowRetakeListenCb); } catch (e) {}
    __allowRetakeListenRef = null;
    __allowRetakeListenCb = null;
  }
}

/* ------------------------------------------------------------
   BANNER IN-PAGE — notifikasi izin retake dari admin
   (bukan alert/popup, tapi banner besar di atas halaman)
   ------------------------------------------------------------ */
function showRetakeBanner() {
  // Hapus banner lama kalau ada
  const old = document.getElementById('retakeNotification');
  if (old) old.remove();

  // Inject keyframes sekali saja
  if (!document.getElementById('retakeBannerStyle')) {
    const style = document.createElement('style');
    style.id = 'retakeBannerStyle';
    style.textContent = `
      @keyframes retakeSlideDown {
        from { transform: translateY(-100%); opacity: 0; }
        to   { transform: translateY(0);     opacity: 1; }
      }
      @keyframes retakeIconBounce {
        0%, 100% { transform: scale(1)    rotate(0); }
        25%      { transform: scale(1.15) rotate(-8deg); }
        75%      { transform: scale(1.15) rotate(8deg); }
      }
    `;
    document.head.appendChild(style);
  }

  const banner = document.createElement('div');
  banner.id = 'retakeNotification';
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0;
    z-index: 2147483647;
    background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
    color: #fff;
    padding: 26px 20px 22px;
    text-align: center;
    box-shadow: 0 12px 40px rgba(0,0,0,.35);
    font-family: Inter, system-ui, -apple-system, sans-serif;
    animation: retakeSlideDown 0.45s cubic-bezier(.2,.8,.2,1);
    border-bottom: 3px solid rgba(255,255,255,.35);
  `;
  banner.innerHTML = `
    <div style="
      font-size: 42px; line-height: 1;
      margin-bottom: 10px;
      animation: retakeIconBounce 1.4s ease-in-out infinite;
    ">🔓</div>
    <div style="
      font-size: 20px; font-weight: 900;
      letter-spacing: -0.3px; margin-bottom: 6px;
    ">
      Akses Diberikan oleh Admin
    </div>
    <div style="
      font-size: 14px; opacity: 0.95;
      line-height: 1.55; max-width: 520px; margin: 0 auto;
    ">
      Admin telah mengizinkan Anda mengerjakan tes lagi.<br>
      Halaman akan dimuat ulang dalam
      <b><span id="retakeCountdown">3</span></b> detik...
    </div>
  `;

  document.body.appendChild(banner);

  // Countdown 3 → 2 → 1 → reload
  let countdown = 3;
  const countdownEl = document.getElementById('retakeCountdown');

  const interval = setInterval(() => {
    countdown--;
    if (countdownEl) countdownEl.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(interval);
      try { window.location.reload(); } catch (e) {}
    }
  }, 1000);
}

/* ------------------------------------------------------------
   READ — untuk admin panel
   ------------------------------------------------------------ */
function __presenceFilterFresh(data) {
  const now = Date.now();

  let excludeId = null;
  try {
    if (typeof isAdminUrl === 'function' && isAdminUrl()) {
      excludeId = localStorage.getItem('_sgs_device_id');
    }
  } catch (e) {}

  return Object.keys(data || {})
    .map(k => ({ deviceId: k, ...data[k] }))
    .filter(s => {
      if (!s.lastSeen) return false;
      if (excludeId && s.deviceId === excludeId) return false;

      // Device "finished" tetap tampil meski offline — supaya admin bisa izinkan tes lagi
      if (s.finished === true) return true;

      // Device normal — filter offline & stale
      if (s.status === 'offline') return false;
      if ((now - s.lastSeen) >= PRESENCE_STALE_MS) return false;
      return true;
    })
    .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
}

function fetchActiveSessions(callback) {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    callback([]); return;
  }
  firebase.database().ref('sgs_state/sessions').once('value')
    .then(snap => callback(__presenceFilterFresh(snap.val())))
    .catch(err => {
      console.warn('[PRESENCE] fetch error:', err);
      callback([]);
    });
}

function listenActiveSessions(callback) {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    callback([]); return;
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
window.initPresence                 = initPresence;
window.pushPresence                 = pushPresence;
window.markPresenceDone             = markPresenceDone;
window.markPresenceOffline          = markPresenceOffline;
window.fetchActiveSessions          = fetchActiveSessions;
window.listenActiveSessions         = listenActiveSessions;
window.stopListeningActiveSessions  = stopListeningActiveSessions;
window.getOrCreateDeviceId          = getOrCreateDeviceId;
window.startListeningAllowRetake    = startListeningAllowRetake;
window.stopListeningAllowRetake     = stopListeningAllowRetake;
window.showRetakeBanner = showRetakeBanner;

console.log('[PRESENCE] ✓ Loaded');
