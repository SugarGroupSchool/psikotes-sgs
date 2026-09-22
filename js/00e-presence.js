/* ============================================================
   js/00e-presence.js
   - Heartbeat kandidat aktif ke Firebase (dynamic 5s/20s)
   - Listen sinyal admin
   - 🔒 SECURITY FIX [2026-09-22]:
     * P1-3: Heartbeat dynamic (5s saat tes, 20s idle)
     * P1-7: Auto-register device ownership sebelum write
     * P1-8: Handle error rule dengan pesan jelas
   ============================================================ */

const PRESENCE_DEVICE_KEY       = '_sgs_device_id';
const PRESENCE_HEARTBEAT_ACTIVE = 5000;   // saat tes
const PRESENCE_HEARTBEAT_IDLE   = 20000;  // idle / di home
const PRESENCE_STALE_MS         = 3 * 60 * 1000;

let __presenceTimer       = null;
let __presenceDeviceId    = null;
let __presenceRef         = null;
let __presenceListenRef   = null;
let __presenceListenCb    = null;
let __presenceIP          = null;
let __presenceIPFetching  = false;
let __presenceOwnershipOk = false;

/* ============================================================
   IP PUBLIK
   ============================================================ */
async function __fetchPublicIP() {
  if (__presenceIP) return __presenceIP;
  if (__presenceIPFetching) return null;
  __presenceIPFetching = true;

  try {
    const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
    const data = await res.json();
    if (data && data.ip) { __presenceIP = data.ip; return __presenceIP; }
  } catch (e) {}

  try {
    const res2 = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    const data2 = await res2.json();
    if (data2 && data2.ip) { __presenceIP = data2.ip; return __presenceIP; }
  } catch (e) {}

  __presenceIPFetching = false;
  return null;
}

/* ============================================================
   DEVICE ID
   ============================================================ */
function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(PRESENCE_DEVICE_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(PRESENCE_DEVICE_KEY, id);
      console.log('[PRESENCE] 🆕 Device ID baru:', id);
    }
    return id;
  } catch (e) {
    return 'dev_anon_' + Math.random().toString(36).slice(2, 10);
  }
}

/* ============================================================
   🔒 Dynamic heartbeat interval
   ============================================================ */
function __getHeartbeatMs() {
  return (window.__inTestView === true)
    ? PRESENCE_HEARTBEAT_ACTIVE
    : PRESENCE_HEARTBEAT_IDLE;
}

/* ============================================================
   INIT
   ============================================================ */
async function initPresence() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    setTimeout(initPresence, 500);
    return;
  }

  __presenceDeviceId = getOrCreateDeviceId();

  // 🔒 WAJIB: register ownership sebelum menulis apa pun
  const ownerOk = await ensureDeviceOwnership(__presenceDeviceId);
  if (!ownerOk) {
    console.warn('[PRESENCE] ⚠️ Device ownership tidak ter-register. Presence mungkin gagal write.');
  } else {
    __presenceOwnershipOk = true;
    console.log('[PRESENCE] ✅ Ownership OK');
  }

  __fetchPublicIP();

  const db = firebase.database();
  __presenceRef = db.ref('sgs_state/sessions/' + __presenceDeviceId);

  __presenceRef.onDisconnect().update({
    status: 'offline',
    lastSeen: firebase.database.ServerValue.TIMESTAMP
  });

  pushPresence('active');

  __scheduleNextHeartbeat();

  console.log('[PRESENCE] ✓ device:', __presenceDeviceId,
    '— heartbeat:', __getHeartbeatMs() + 'ms');

  startListeningAllowRetake();
  startListeningAdminSignals();
}

function __scheduleNextHeartbeat() {
  if (__presenceTimer) clearTimeout(__presenceTimer);
  const interval = __getHeartbeatMs();
  __presenceTimer = setTimeout(() => {
    pushPresence('active');
    __scheduleNextHeartbeat();
  }, interval);
}

/* ============================================================
   PUSH PRESENCE
   ============================================================ */
function pushPresence(status) {
  if (!__presenceRef) return;

  let identity = {};
  try {
    const raw = localStorage.getItem('identity');
    if (raw) identity = JSON.parse(raw) || {};
  } catch (e) {}

  let completedCount = 0, totalTests = 0;
  let completedObj = {}, selectedArr = [];
  try {
    completedObj = JSON.parse(localStorage.getItem('completed') || '{}') || {};
    completedCount = Object.values(completedObj).filter(v => v === true).length;
    selectedArr = JSON.parse(localStorage.getItem('selectedTests') || '[]') || [];
    if (Array.isArray(selectedArr)) totalTests = selectedArr.length;
    else selectedArr = [];
  } catch (e) {}

  const st = (typeof appState !== 'undefined' && appState) ? appState : {};

  let isFinished = false, isDisqualified = false;
  try {
    isFinished = localStorage.getItem('_sgs_finished') === '1';
    isDisqualified = localStorage.getItem('_sgs_disqualified') === '1';
  } catch (e) {}

  const currentTest     = st.currentTest || null;
  const timeLeft        = (typeof st.timeLeft === 'number') ? st.timeLeft : null;
  const currentSubtest  = (st.currentSubtest !== undefined) ? st.currentSubtest : null;
  const currentColumn   = (st.currentColumn !== undefined) ? st.currentColumn : null;
  const currentQuestion = (st.currentQuestion !== undefined) ? st.currentQuestion : null;

  let progressPercent = 0, questionLabel = null;
  let testTotalSubtests = null, testTotalColumns = null;

  try {
    if (currentTest === 'IST' && typeof tests !== 'undefined' && tests.IST) {
      const subtests = tests.IST.subtests || [];
      testTotalSubtests = subtests.length;
      if (currentSubtest !== null && subtests[currentSubtest]) {
        const totalQ = subtests[currentSubtest].questions?.length || 0;
        if (currentQuestion !== null && totalQ > 0) {
          questionLabel = `${currentQuestion + 1}/${totalQ}`;
          progressPercent = Math.round(((currentSubtest + (currentQuestion / totalQ)) / subtests.length) * 100);
        }
      }
    } else if (currentTest === 'KRAEPLIN' && typeof tests !== 'undefined' && tests.KRAEPLIN) {
      const cols = tests.KRAEPLIN.columns || [];
      testTotalColumns = cols.length;
      if (currentColumn !== null && cols.length > 0) {
        questionLabel = `Kolom ${currentColumn + 1}/${cols.length}`;
        progressPercent = Math.round((currentColumn / cols.length) * 100);
      }
    } else if (currentTest === 'DISC' && typeof tests !== 'undefined' && tests.DISC) {
      const totalQ = tests.DISC.questions?.length || 0;
      if (currentQuestion !== null && totalQ > 0) {
        questionLabel = `${currentQuestion + 1}/${totalQ}`;
        progressPercent = Math.round((currentQuestion / totalQ) * 100);
      }
    } else if (currentTest === 'PAPI' && typeof tests !== 'undefined' && tests.PAPI) {
      const totalQ = tests.PAPI.questions?.length || 0;
      if (currentQuestion !== null && totalQ > 0) {
        questionLabel = `${currentQuestion + 1}/${totalQ}`;
        progressPercent = Math.round((currentQuestion / totalQ) * 100);
      }
    } else if (currentTest === 'BIGFIVE' && typeof tests !== 'undefined' && tests.BIGFIVE) {
      const totalQ = tests.BIGFIVE.questions?.length || 0;
      if (currentQuestion !== null && totalQ > 0) {
        questionLabel = `${currentQuestion + 1}/${totalQ}`;
        progressPercent = Math.round((currentQuestion / totalQ) * 100);
      }
    }
  } catch (e) {}

  let displayName = identity.name && identity.name.trim();
  if (!displayName) {
    displayName = __presenceIP ? ('IP: ' + __presenceIP) : 'IP: (memuat...)';
  }

  const payload = {
    deviceId:          __presenceDeviceId,
    name:              displayName,
    ip:                __presenceIP || '',
    nickname:          identity.nickname || '',
    position:          identity.position || '',
    currentTest:       currentTest,
    currentSubtest:    currentSubtest,
    currentQuestion:   currentQuestion,
    currentColumn:     currentColumn,
    timeLeft:          timeLeft,
    progressPercent:   progressPercent,
    questionLabel:     questionLabel,
    testTotalSubtests: testTotalSubtests,
    testTotalColumns:  testTotalColumns,
    completedCount,
    totalTests,
    completed:         completedObj,
    selectedTests:     selectedArr,
    status:            status || 'active',
    inTestView:        (typeof window !== 'undefined' && window.__inTestView === true),
    finished:          isFinished,
    disqualified:      isDisqualified,
    lastSeen:          firebase.database.ServerValue.TIMESTAMP
  };

  __presenceRef.once('value').then(snap => {
    if (!snap.exists() || !snap.val()?.startedAt) {
      payload.startedAt = firebase.database.ServerValue.TIMESTAMP;
    }
    return __presenceRef.update(payload);
  }).catch(err => {
    if (err.message && err.message.includes('PERMISSION_DENIED')) {
      console.warn('[PRESENCE] ⚠️ Permission denied — coba register ownership ulang');
      ensureDeviceOwnership(__presenceDeviceId).then(ok => {
        if (ok) __presenceRef.update(payload).catch(() => {});
      });
    }
  });
}

function markPresenceDone() { pushPresence('done'); }

function markPresenceOffline() {
  if (!__presenceRef) return;
  __presenceRef.update({
    status: 'offline',
    lastSeen: firebase.database.ServerValue.TIMESTAMP
  }).catch(() => {});
}

window.addEventListener('beforeunload', markPresenceOffline);

/* ============================================================
   LISTEN allow_retake
   ============================================================ */
let __allowRetakeListenRef = null;
let __allowRetakeListenCb  = null;

function startListeningAllowRetake() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  if (!__presenceDeviceId) return;

  if (__allowRetakeListenRef && __allowRetakeListenCb) {
    try { __allowRetakeListenRef.off('value', __allowRetakeListenCb); } catch (e) {}
  }

  __allowRetakeListenRef = firebase.database()
    .ref('sgs_state/sessions/' + __presenceDeviceId + '/allow_retake');

  __allowRetakeListenCb = (snap) => {
    const allow = snap.val() === true;
    if (!allow) return;
    if (sessionStorage.getItem('_sgs_retake_processed') === '1') return;
    try { sessionStorage.setItem('_sgs_retake_processed', '1'); } catch (e) {}

    const wasDisqualified = localStorage.getItem('_sgs_disqualified') === '1';

    console.log('[PRESENCE] 🔓 Admin izinkan tes lagi.');

    try {
      localStorage.removeItem('_sgs_finished');
      localStorage.removeItem('_sgs_lock');
      localStorage.removeItem('_sgs_disqualified');
      localStorage.removeItem('_sgs_device_id');   // reset device ID
    } catch (e) {}

    if (!wasDisqualified) {
      try {
        localStorage.removeItem('identity');
        localStorage.removeItem('completed');
        localStorage.removeItem('selectedTests');
        localStorage.removeItem('usedPragas');
        sessionStorage.removeItem('dlClick');
      } catch (e) {}
    }

    firebase.database()
      .ref('sgs_state/sessions/' + __presenceDeviceId + '/allow_retake')
      .set(false).catch(() => {});

    if (typeof showRetakeBanner === 'function') showRetakeBanner();
    else setTimeout(() => window.location.reload(), 1500);
  };

  __allowRetakeListenRef.on('value', __allowRetakeListenCb);
}

function stopListeningAllowRetake() {
  if (__allowRetakeListenRef && __allowRetakeListenCb) {
    try { __allowRetakeListenRef.off('value', __allowRetakeListenCb); } catch (e) {}
    __allowRetakeListenRef = null;
    __allowRetakeListenCb = null;
  }
}

/* ============================================================
   LISTEN SEMUA SINYAL ADMIN (tetap seperti aslinya)
   ============================================================ */
let __adminSignalsRef = null;
let __adminSignalCb = null;
let __adminLastValues = null;

function startListeningAdminSignals() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  if (!__presenceDeviceId) return;

  if (__adminSignalsRef && __adminSignalCb) {
    try { __adminSignalsRef.off('value', __adminSignalCb); } catch(e) {}
  }

  __adminSignalsRef = firebase.database().ref('sgs_state/sessions/' + __presenceDeviceId);
  __adminLastValues = null;

  __adminSignalCb = function(snap) {
    var s = snap.val() || {};
    var cur = {
      force_refresh:   s.force_refresh   || null,
      force_logout:    s.force_logout    || null,
      disqualified:    s.disqualified === true ? true : null,
      reset_progress:  s.reset_progress  || null
    };

    if (__adminLastValues === null) {
      __adminLastValues = cur;
      return;
    }

    if (cur.force_refresh && cur.force_refresh !== __adminLastValues.force_refresh) {
      __adminLastValues.force_refresh = cur.force_refresh;
      var frKey = '_sgs_fr_' + cur.force_refresh;
      if (sessionStorage.getItem(frKey) === '1') return;
      sessionStorage.setItem(frKey, '1');
      showAdminSignalBanner('🔄', 'Memuat Ulang', 'Admin meminta halaman dimuat ulang.', 2, '#3b82f6');
      return;
    }

    if (cur.force_logout && cur.force_logout !== __adminLastValues.force_logout) {
      __adminLastValues.force_logout = cur.force_logout;
      var flKey = '_sgs_fl_' + cur.force_logout;
      if (sessionStorage.getItem(flKey) === '1') return;
      sessionStorage.setItem(flKey, '1');
      try {
        localStorage.setItem('_sgs_finished', '1');
        localStorage.setItem('usedPragas', '1');
      } catch(e) {}
      showAdminSignalBanner('🚪', 'Sesi Diakhiri', 'Admin telah mengakhiri sesi Anda.', 3, '#dc2626');
      return;
    }

    if (cur.disqualified && !__adminLastValues.disqualified) {
      __adminLastValues.disqualified = cur.disqualified;
      if (sessionStorage.getItem('_sgs_dq_processed') === '1') return;
      sessionStorage.setItem('_sgs_dq_processed', '1');
      try {
        localStorage.setItem('_sgs_finished', '1');
        localStorage.setItem('usedPragas', '1');
        localStorage.setItem('_sgs_disqualified', '1');
      } catch(e) {}
      showAdminSignalBanner('⚠️', 'Diskualifikasi', 'Anda telah didiskualifikasi oleh admin.', 3, '#dc2626');
      return;
    }

    if (cur.reset_progress && cur.reset_progress !== __adminLastValues.reset_progress) {
      __adminLastValues.reset_progress = cur.reset_progress;
      var rpKey = '_sgs_rp_' + cur.reset_progress;
      if (sessionStorage.getItem(rpKey) === '1') return;
      sessionStorage.setItem(rpKey, '1');
      try {
        localStorage.removeItem('completed');
        localStorage.removeItem('selectedTests');
      } catch(e) {}
      showAdminSignalBanner('🗑️', 'Progres Direset', 'Admin telah me-reset progres tes Anda.', 3, '#f59e0b');
      return;
    }
  };

  __adminSignalsRef.on('value', __adminSignalCb);
}

function stopListeningAdminSignals() {
  if (__adminSignalsRef && __adminSignalCb) {
    try { __adminSignalsRef.off('value', __adminSignalCb); } catch(e) {}
    __adminSignalsRef = null;
    __adminSignalCb = null;
    __adminLastValues = null;
  }
}

/* ============================================================
   BANNER (fungsi asli tidak berubah — bisa reuse)
   ============================================================ */
function showAdminSignalBanner(icon, title, message, countdownSec, color) {
  var old = document.getElementById('adminSignalBanner');
  if (old) old.remove();

  if (!document.getElementById('adminSignalStyle')) {
    var st = document.createElement('style');
    st.id = 'adminSignalStyle';
    st.textContent =
      '@keyframes adminSigSlide { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }' +
      '@keyframes adminSigBounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }';
    document.head.appendChild(st);
  }

  var banner = document.createElement('div');
  banner.id = 'adminSignalBanner';
  banner.style.cssText = [
    'position: fixed', 'top: 0', 'left: 0', 'right: 0',
    'z-index: 2147483647',
    'background: ' + color,
    'color: #fff',
    'padding: 26px 20px 22px',
    'text-align: center',
    'box-shadow: 0 12px 40px rgba(0,0,0,.35)',
    'font-family: Inter, system-ui, -apple-system, sans-serif',
    'animation: adminSigSlide .45s cubic-bezier(.2,.8,.2,1)',
    'border-bottom: 3px solid rgba(255,255,255,.35)'
  ].join(';');

  banner.innerHTML = [
    '<div style="font-size:42px;line-height:1;margin-bottom:10px;animation:adminSigBounce 1.4s ease-in-out infinite;">' + icon + '</div>',
    '<div style="font-size:20px;font-weight:900;letter-spacing:-.3px;margin-bottom:6px;">' + title + '</div>',
    '<div style="font-size:14px;opacity:.95;line-height:1.55;max-width:520px;margin:0 auto;">' +
      message + '<br>Halaman akan dimuat ulang dalam <b><span id="adminSigCountdown">' + countdownSec + '</span></b> detik...' +
    '</div>'
  ].join('');

  document.body.appendChild(banner);

  var remaining = countdownSec;
  var countdownEl = document.getElementById('adminSigCountdown');
  var interval = setInterval(function() {
    remaining--;
    if (countdownEl) countdownEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(interval);
      try {
        window.__inTestView = false;
        window.__skipBeforeUnload = true;
        window.__submitBeforeUnload = null;
      } catch(e) {}
      try { window.location.reload(); } catch(e) {}
    }
  }, 1000);
}

function showRetakeBanner() {
  var old = document.getElementById('retakeNotification');
  if (old) old.remove();

  var banner = document.createElement('div');
  banner.id = 'retakeNotification';
  banner.style.cssText = [
    'position: fixed', 'top: 0', 'left: 0', 'right: 0',
    'z-index: 2147483647',
    'background: linear-gradient(135deg, #16a34a 0%, #059669 100%)',
    'color: #fff',
    'padding: 26px 20px 22px',
    'text-align: center',
    'box-shadow: 0 12px 40px rgba(0,0,0,.35)',
    'font-family: Inter, system-ui, -apple-system, sans-serif',
    'border-bottom: 3px solid rgba(255,255,255,.35)'
  ].join(';');

  banner.innerHTML = [
    '<div style="font-size:42px;line-height:1;margin-bottom:10px;">🔓</div>',
    '<div style="font-size:20px;font-weight:900;margin-bottom:6px;">Akses Diberikan oleh Admin</div>',
    '<div style="font-size:14px;opacity:.95;line-height:1.55;max-width:520px;margin:0 auto;">',
    'Admin telah mengizinkan Anda mengerjakan tes lagi.<br>',
    'Halaman akan dimuat ulang dalam <b><span id="retakeCountdown">3</span></b> detik...',
    '</div>'
  ].join('');

  document.body.appendChild(banner);

  var countdown = 3;
  var countdownEl = document.getElementById('retakeCountdown');
  var interval = setInterval(function() {
    countdown--;
    if (countdownEl) countdownEl.textContent = countdown;
    if (countdown <= 0) {
      clearInterval(interval);
      try { window.location.reload(); } catch(e) {}
    }
  }, 1000);
}

/* ============================================================
   ADMIN PANEL — fetch & listen active sessions (sama)
   ============================================================ */
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
      if (s.finished === true) return true;
      if (s.status === 'offline') return false;
      if ((now - s.lastSeen) >= PRESENCE_STALE_MS) return false;
      return true;
    })
    .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
}

function fetchActiveSessions(callback) {
  if (typeof firebase === 'undefined' || !firebase.apps.length) { callback([]); return; }
  firebase.database().ref('sgs_state/sessions').once('value')
    .then(snap => callback(__presenceFilterFresh(snap.val())))
    .catch(() => callback([]));
}

function listenActiveSessions(callback) {
  if (typeof firebase === 'undefined' || !firebase.apps.length) { callback([]); return; }
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

/* ============================================================
   AUTO-INIT
   ============================================================ */
function __shouldInitPresence() {
  if (typeof window.isAdminUrl === 'function' && window.isAdminUrl()) {
    console.log('[PRESENCE] ⏭️ Mode admin — presence dinonaktifkan');
    return false;
  }
  return true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (__shouldInitPresence()) setTimeout(initPresence, 2500);
  });
} else {
  if (__shouldInitPresence()) setTimeout(initPresence, 2500);
}

/* ============================================================
   EXPORT
   ============================================================ */
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
window.showRetakeBanner             = showRetakeBanner;
window.startListeningAdminSignals   = startListeningAdminSignals;
window.stopListeningAdminSignals    = stopListeningAdminSignals;
window.showAdminSignalBanner        = showAdminSignalBanner;

console.log('[PRESENCE] ✓ Loaded — secured + dynamic heartbeat');
