/* ============================================================
   js/00b-admin.js — SECURED + REAL-TIME SIGNAL
   ------------------------------------------------------------
   🆕 REALTIME FIX [2026-09-22]:
   - R1: startSignalListeners() dengar sgs_state/lastUpload & lastDelete
   - R2: deleteResultFile() kirim sinyal lastDelete ke admin lain
   - R3: startSignalListeners() dipanggil di renderAdminPanel()
   - R4: stopSignalListeners() dipanggil di adminLogout() + close button
   ------------------------------------------------------------
   🔒 SECURITY FIX [2026-09-22]:
   - P0-1: fetchResultFiles() kirim Firebase ID Token ke GAS
   ============================================================ */

/* ============================================================
   KONFIGURASI
   ============================================================ */
const ADMIN_SESSION_KEY = '_sgs_admin_logged_in';
const ADMIN_KEY_OK_KEY  = '_sgs_admin_key_ok';

const GAS_ADMIN_URL =
  'https://script.google.com/macros/s/AKfycbxCryXLdQXXbB2k6qxkmbZJF-L2ltL-QgTUygKLFAg0UNVm3NfKHDgso9nB-NomM4en/exec';

const CHAT_CLEANUP_ENABLED        = true;
const CHAT_CLEANUP_AGE_MS         = 60 * 60 * 1000;
const CHAT_CLEANUP_DELETE_SESSION = true;

const RESULT_CACHE_TTL_MS         = 10000;
const RECENTLY_DELETED_TTL_MS     = 10000;
const DRIVE_PROPAGATION_DELAY_MS  = 2000;

/* ============================================================
   HELPER: Firebase ID Token
   ============================================================ */
async function __getFirebaseIdToken() {
  try {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return '';
    const user = firebase.auth().currentUser;
    if (!user) return '';
    return await user.getIdToken();
  } catch (e) {
    console.warn('[ADMIN] Gagal ambil ID token:', e.message);
    return '';
  }
}

/* ============================================================
   MODAL WRAPPERS
   ============================================================ */
function __alert(text, title) {
  if (typeof window.sgsAlert === 'function') return window.sgsAlert(text, title);
  return Promise.resolve(alert(text));
}
function __confirm(text, opts) {
  if (typeof window.sgsConfirm === 'function') return window.sgsConfirm(text, opts);
  return Promise.resolve(confirm(text));
}
function __confirmDanger(text, opts) {
  if (typeof window.sgsConfirmDanger === 'function') return window.sgsConfirmDanger(text, opts);
  return Promise.resolve(confirm(text));
}

/* ============================================================
   ADMIN UNREAD TRACKER
   ============================================================ */
window.__adminUnreadMap = {};
let __adminUnreadRefs = [];

function startAdminUnreadTracker() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  if (__adminUnreadRefs.length > 0) return;

  const chatsRef = firebase.database().ref('sgs_state/chats');
  const onRoomAdded = (roomSnap) => {
    const deviceId = roomSnap.key;
    const queryRef = roomSnap.ref.child('messages')
      .orderByChild('from').equalTo('candidate');
    const onMsgsChange = (snap) => {
      let count = 0;
      snap.forEach(ch => { if (!ch.val()?.read) count++; });
      window.__adminUnreadMap[deviceId] = count;
    };
    queryRef.on('value', onMsgsChange);
    __adminUnreadRefs.push({ ref: queryRef, cb: onMsgsChange, type: 'value' });
  };
  chatsRef.on('child_added', onRoomAdded);
  __adminUnreadRefs.push({ ref: chatsRef, cb: onRoomAdded, type: 'child_added' });
}

function stopAdminUnreadTracker() {
  __adminUnreadRefs.forEach(({ ref, cb, type }) => {
    try {
      if (type === 'child_added') ref.off('child_added', cb);
      else ref.off('value', cb);
    } catch (e) {}
  });
  __adminUnreadRefs = [];
}

/* ============================================================
   ADMIN TIMER TICK
   ============================================================ */
let __adminTimerTickInterval = null;

function startAdminTimerTick() {
  if (__adminTimerTickInterval) clearInterval(__adminTimerTickInterval);
  __adminTimerTickInterval = setInterval(() => {
    const timers = document.querySelectorAll('[data-timer-id]');
    const now = Date.now();
    timers.forEach(el => {
      const timeLeftInit = parseInt(el.dataset.timeLeft || '0', 10);
      const lastUpdate = parseInt(el.dataset.lastUpdate || '0', 10);
      const elapsed = Math.floor((now - lastUpdate) / 1000);
      const remaining = Math.max(0, timeLeftInit - elapsed);
      const textEl = el.querySelector('.timer-text');
      if (textEl) textEl.textContent = __formatTimeAdmin(remaining);
      if (remaining <= 30) { el.style.background = '#fee2e2'; el.style.color = '#991b1b'; }
      else { el.style.background = '#dbeafe'; el.style.color = '#1e40af'; }
      if (remaining <= 0 && textEl) textEl.textContent = '00:00';
    });
  }, 1000);
}

function stopAdminTimerTick() {
  if (__adminTimerTickInterval) {
    clearInterval(__adminTimerTickInterval);
    __adminTimerTickInterval = null;
  }
}

function __formatTimeAdmin(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec2 = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec2}`;
}

/* ============================================================
   DETEKSI URL ADMIN
   ============================================================ */
function isAdminUrl() {
  try {
    if (sessionStorage.getItem(ADMIN_KEY_OK_KEY) === '1') return true;
    const url = new URL(window.location.href);
    if (url.searchParams.get('admin')) return true;
    if (url.hash && url.hash.length > 5) return true;
    return false;
  } catch (e) { return false; }
}

async function verifyAdminKeyFromUrl() {
  try {
    const url = new URL(window.location.href);
    const key = url.searchParams.get('admin') || (url.hash || '').replace(/^#/, '');
    if (!key) return false;
    if (typeof APP_CONFIG === 'undefined' || typeof APP_CONFIG.isAdminKey !== 'function') {
      console.warn('[ADMIN] APP_CONFIG.isAdminKey tidak tersedia');
      return false;
    }
    const ok = await APP_CONFIG.isAdminKey(key);
    if (ok) {
      sessionStorage.setItem(ADMIN_KEY_OK_KEY, '1');
      console.log('[ADMIN] 🔓 Admin key verified');
    } else {
      console.warn('[ADMIN] ⚠️ Admin key tidak cocok');
    }
    return ok;
  } catch (e) {
    console.warn('[ADMIN] verifyAdminKeyFromUrl error:', e.message);
    return false;
  }
}

/* ============================================================
   SAFE ACCESSORS — fail-closed
   ============================================================ */
function __safeGetLockState() {
  if (typeof window.isCloudReady === 'function' && !window.isCloudReady()) return true;
  return (typeof window.getLockState === 'function') ? window.getLockState() : true;
}

function __safeGetFreshPwd() {
  if (typeof window.getFreshPwd === 'function') {
    const p = window.getFreshPwd();
    if (p) return p;
  }
  return '— (belum tersedia)';
}

function __safeGetUsedPwd() {
  if (typeof window.getUsedPwd === 'function') {
    const p = window.getUsedPwd();
    if (p) return p;
  }
  return '— (belum tersedia)';
}

/* ============================================================
   CLIPBOARD
   ============================================================ */
function copyToClipboard(text, btnEl) {
  if (!text) return;
  const done = () => {
    if (!btnEl) return;
    const prev = btnEl.textContent;
    btnEl.textContent = '✓';
    setTimeout(() => { btnEl.textContent = prev; }, 1200);
  };
  try {
    navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
  } catch (e) { fallbackCopy(text); done(); }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
}

/* ============================================================
   HTML ESCAPE & URL SAFETY
   ============================================================ */
function __adminEscape(str) {
  if (typeof window.escapeHTML === 'function') return window.escapeHTML(str);
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function __safeUrl(url) {
  const u = String(url || '').trim();
  if (!u) return '#';
  if (/^https?:\/\//i.test(u)) return u.replace(/"/g, '%22').replace(/'/g, '%27');
  if (/^[.\/]/.test(u)) return u.replace(/"/g, '%22').replace(/'/g, '%27');
  return '#';
}

/* ============================================================
   RESET / UNLOCK DEVICE
   ============================================================ */
async function adminResetThisDevice() {
  const ok = await __confirmDanger(
    'Reset state device ini?\n\n• identity\n• completed\n• selectedTests\n• usedPragas',
    { title: '⚠️ Reset Device', okText: 'Ya, Reset' }
  );
  if (!ok) return;
  try {
    localStorage.removeItem('identity');
    localStorage.removeItem('completed');
    localStorage.removeItem('selectedTests');
    localStorage.removeItem('usedPragas');
    await __alert('Device berhasil di-reset', '✅ Sukses');
    renderAdminPanel();
  } catch (e) { await __alert('Gagal reset: ' + e.message, '❌ Error'); }
}

async function adminUnlockDevice() {
  const ok = await __confirm(
    'Unlock device ini?\n\nKandidat bisa login lagi setelah selesai.',
    { title: '🔓 Unlock Device', okText: 'Ya, Unlock' }
  );
  if (!ok) return;
  try {
    localStorage.removeItem('_sgs_finished');
    localStorage.removeItem('_sgs_disqualified');
    await __alert('Device berhasil di-unlock', '✅ Sukses');
    renderAdminPanel();
  } catch (e) { await __alert('Gagal unlock: ' + e.message, '❌ Error'); }
}

/* ============================================================
   IZINKAN TES LAGI
   ============================================================ */
async function adminAllowRetake(deviceId, candidateName) {
  const name = candidateName || 'kandidat';
  const ok = await __confirm(
    'Izinkan "' + name + '" untuk mengerjakan tes lagi?\n\n' +
    '• Device akan di-reset (hapus history tes)\n' +
    '• Kandidat harus login ulang dengan password dari admin\n' +
    '• Semua hasil tes sebelumnya tetap ada di Firebase\n\n' +
    'Lanjutkan?',
    { title: '🔄 Izinkan Tes Lagi', okText: 'Ya, Izinkan' }
  );
  if (!ok) return;

  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    await __alert('Firebase belum siap', '❌ Error');
    return;
  }

  const ref = firebase.database().ref('sgs_state/sessions/' + deviceId);
  ref.update({
    allow_retake: true,
    allow_retake_at: firebase.database.ServerValue.TIMESTAMP,
    allow_retake_by: 'admin',
    finished: false,
    disqualified: false,
    lastSeen: firebase.database.ServerValue.TIMESTAMP
  })
  .then(async () => {
    await __alert('Sinyal terkirim ke device "' + name + '".', '✅ Terkirim');
    setTimeout(() => renderAdminPanel(), 500);
  })
  .catch(async (e) => { await __alert('Gagal kirim sinyal: ' + e.message, '❌ Error'); });
}

/* ============================================================
   AUTO-CLEANUP CHAT
   ============================================================ */
async function cleanupInactiveChatRooms(options = {}) {
  const { silent = false, minAgeMs = CHAT_CLEANUP_AGE_MS, alsoDeleteSessions = CHAT_CLEANUP_DELETE_SESSION } = options;
  if (typeof firebase === 'undefined' || !firebase.apps.length) return { removed: 0, deviceIds: [] };

  const now = Date.now();
  const myDeviceId = localStorage.getItem('_sgs_device_id');

  try {
    const sessionsSnap = await firebase.database().ref('sgs_state/sessions').once('value');
    const chatsSnap    = await firebase.database().ref('sgs_state/chats').once('value');
    const sessions = sessionsSnap.val() || {};
    const chats    = chatsSnap.val() || {};
    const toDelete = [];

    Object.keys(chats).forEach(deviceId => {
      if (deviceId === myDeviceId) return;
      const session = sessions[deviceId] || {};
      const lastSeen = session.lastSeen || 0;
      const status = session.status;
      if (session.finished === true) return;
      if (status === 'active' && (now - lastSeen) < minAgeMs) return;
      if (status === 'offline' || (now - lastSeen) >= minAgeMs) toDelete.push(deviceId);
    });

    let removed = 0;
    for (const deviceId of toDelete) {
      try {
        await firebase.database().ref('sgs_state/chats/' + deviceId).remove();
        if (alsoDeleteSessions) await firebase.database().ref('sgs_state/sessions/' + deviceId).remove();
        removed++;
      } catch (e) {}
    }
    return { removed, deviceIds: toDelete };
  } catch (e) { return { removed: 0, deviceIds: [], error: e.message }; }
}

async function adminCleanupInactive() {
  const ok = await __confirmDanger(
    'Bersihkan chat dari kandidat yang tidak aktif?',
    { title: '🧹 Cleanup Chat', okText: 'Ya, Bersihkan' }
  );
  if (!ok) return;
  const result = await cleanupInactiveChatRooms({ silent: false });
  if (result.removed === 0) await __alert('Tidak ada chat yang perlu dibersihkan.', '✨ Bersih');
  else await __alert(result.removed + ' chat room berhasil dibersihkan.', '✅ Sukses');
  setTimeout(() => renderAdminPanel(), 300);
}

/* ============================================================
   🆕 REAL-TIME SIGNAL LISTENER
   - Kandidat upload → admin langsung refresh
   - Admin lain delete → admin ini langsung refresh
   ============================================================ */
let __lastUploadTs = null;
let __lastDeleteTs = null;
let __uploadSignalRef = null;
let __deleteSignalRef = null;

function startSignalListeners() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  if (__uploadSignalRef) return;

  /* 🆕 Debounce: tunda refresh 500ms biar tidak spam */
  let __signalRefreshTimer = null;
  function __scheduleRefresh(reason) {
    clearTimeout(__signalRefreshTimer);
    __signalRefreshTimer = setTimeout(() => {
      console.log('[REALTIME] Refresh karena:', reason);
      if (typeof __invalidateResultCache === 'function') __invalidateResultCache();
      fetchResultFiles(true).then(files => {
        window.__resultFilesCache = files;
        if (document.getElementById('resultFilesPageOverlay')) __renderResultPageContent();
        if (typeof __updateAdminResultCounter === 'function') __updateAdminResultCounter();
      }).catch(() => {});
    }, 500);
  }

  __lastUploadTs = null;
  __uploadSignalRef = firebase.database().ref('sgs_state/lastUpload');
  __uploadSignalRef.on('value', (snap) => {
    const data = snap.val();
    if (!data || !data.ts) return;
    if (__lastUploadTs === null) { __lastUploadTs = data.ts; return; }
    if (data.ts <= __lastUploadTs) return;
    __lastUploadTs = data.ts;

    //console.log('[REALTIME] 📥 Upload baru:', data.type, 'dari', data.name);

    const icon = data.type === 'excel' ? '📊' : '📄';
    const label = data.type === 'excel' ? 'Excel' : 'PDF';
    if (typeof showResultToast === 'function') {
      showResultToast(icon, `${label} baru dari ${data.name}`, data.position || '');
    }
    try {
      if (typeof window.__sgsPlayNotifySound === 'function') window.__sgsPlayNotifySound();
    } catch (e) {}

    __scheduleRefresh('upload baru');
  });

  __lastDeleteTs = null;
  __deleteSignalRef = firebase.database().ref('sgs_state/lastDelete');
  __deleteSignalRef.on('value', (snap) => {
    const data = snap.val();
    if (!data || !data.ts) return;
    if (__lastDeleteTs === null) { __lastDeleteTs = data.ts; return; }
    if (data.ts <= __lastDeleteTs) return;
    __lastDeleteTs = data.ts;

    //console.log('[REALTIME] 🗑️ Delete terjadi');
    __scheduleRefresh('delete');
  });

  console.log('[REALTIME] ✓ Signal listeners aktif (debounced 500ms)');
}

function stopSignalListeners() {
  if (__uploadSignalRef) { try { __uploadSignalRef.off(); } catch(e){} __uploadSignalRef = null; }
  if (__deleteSignalRef) { try { __deleteSignalRef.off(); } catch(e){} __deleteSignalRef = null; }
  __lastUploadTs = null;
  __lastDeleteTs = null;
  console.log('[REALTIME] 🔇 Signal listeners stopped');
}

/* ============================================================
   REAL-TIME RESULT LISTENER (legacy — keep)
   ============================================================ */
window.__sgsResultsRef       = null;
window.__sgsResultsAddedCb   = null;
window.__sgsResultsChangedCb = null;
window.__sgsResultsRemovedCb = null;
window.__sgsResultsFirstLoad = true;

function startResultsRealtimeListener() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  if (window.__sgsResultsRef) return;

  window.__sgsResultsFirstLoad = true;
  window.__sgsResultsRef = firebase.database().ref('sgs_results');

  const makeCb = (eventType) => (snap) => {
    const val = snap.val();
    if (window.__sgsResultsFirstLoad) return;
    if (typeof __invalidateResultCache === 'function') __invalidateResultCache();
    fetchResultFiles(true).then(files => {
      window.__resultFilesCache = files;
      if (document.getElementById('resultFilesPageOverlay')) __renderResultPageContent();
      if (typeof __updateAdminResultCounter === 'function') __updateAdminResultCounter();
    }).catch(() => {});
  };

  window.__sgsResultsAddedCb   = makeCb('child_added');
  window.__sgsResultsChangedCb = makeCb('child_changed');
  window.__sgsResultsRemovedCb = makeCb('child_removed');

  window.__sgsResultsRef.on('child_added',   window.__sgsResultsAddedCb);
  window.__sgsResultsRef.on('child_changed', window.__sgsResultsChangedCb);
  window.__sgsResultsRef.on('child_removed', window.__sgsResultsRemovedCb);

  setTimeout(() => { window.__sgsResultsFirstLoad = false; }, 2000);
}

function stopResultsRealtimeListener() {
  if (window.__sgsResultsRef) {
    try {
      if (window.__sgsResultsAddedCb)   window.__sgsResultsRef.off('child_added', window.__sgsResultsAddedCb);
      if (window.__sgsResultsChangedCb) window.__sgsResultsRef.off('child_changed', window.__sgsResultsChangedCb);
      if (window.__sgsResultsRemovedCb) window.__sgsResultsRef.off('child_removed', window.__sgsResultsRemovedCb);
    } catch (e) {}
  }
  window.__sgsResultsRef = null;
  window.__sgsResultsAddedCb = null;
  window.__sgsResultsChangedCb = null;
  window.__sgsResultsRemovedCb = null;
  window.__sgsResultsFirstLoad = true;
}

/* ============================================================
   TOAST
   ============================================================ */
function showResultToast(icon, title, subtitle) {
  let container = document.getElementById('sgsResultToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'sgsResultToastContainer';
    container.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 2147483647;
      display: flex; flex-direction: column; gap: 10px; max-width: 380px; pointer-events: none;`;
    document.body.appendChild(container);
    if (!document.getElementById('sgsResultToastStyle')) {
      const style = document.createElement('style');
      style.id = 'sgsResultToastStyle';
      style.textContent = `
        @keyframes sgsToastSlideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes sgsToastSlideOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(40px); } }
        @keyframes sgsToastProgress { from { width: 100%; } to { width: 0%; } }`;
      document.head.appendChild(style);
    }
  }
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border: 1px solid rgba(34,197,94,.35); color: #e2e8f0;
    padding: 14px 16px 12px 16px; border-radius: 14px;
    font-family: Inter, system-ui, -apple-system, sans-serif; font-size: 13px;
    box-shadow: 0 20px 50px rgba(0,0,0,.5), 0 0 0 1px rgba(34,197,94,.08), inset 0 1px 0 rgba(255,255,255,.04);
    display: flex; align-items: center; gap: 12px;
    animation: sgsToastSlideIn .35s cubic-bezier(.2,.8,.2,1);
    pointer-events: auto; position: relative; overflow: hidden;`;
  toast.innerHTML = `
    <div style="width: 38px; height: 38px; flex: 0 0 38px; display: grid; place-items: center;
      background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 10px; font-size: 19px;
      box-shadow: 0 6px 16px rgba(34,197,94,.35), inset 0 1px 0 rgba(255,255,255,.2);">${icon}</div>
    <div style="flex: 1; min-width: 0;">
      <div style="font-weight: 800; color: #fff; margin-bottom: 2px; line-height: 1.3; word-break: break-word;">${__adminEscape(title)}</div>
      ${subtitle ? `<div style="font-size: 11px; color: #94a3b8; line-height: 1.3; word-break: break-word;">📍 ${__adminEscape(subtitle)}</div>` : ''}
    </div>
    <button type="button" style="width: 22px; height: 22px; display: grid; place-items: center;
      background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 6px;
      color: #94a3b8; font-size: 12px; font-weight: 800; cursor: pointer; font-family: inherit; flex: 0 0 auto; padding: 0;"
      title="Tutup">✕</button>
    <div style="position: absolute; left: 0; bottom: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, #22c55e, #16a34a); border-radius: 0 0 14px 14px;
      animation: sgsToastProgress 6s linear forwards; transform-origin: left;"></div>`;
  toast.querySelector('button').onclick = () => {
    toast.style.animation = 'sgsToastSlideOut .25s ease forwards';
    setTimeout(() => toast.remove(), 250);
  };
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'sgsToastSlideOut .3s ease forwards';
      setTimeout(() => {
        try { toast.remove(); } catch (e) {}
        if (container.children.length === 0) container.remove();
      }, 300);
    }
  }, 6000);
}

/* ============================================================
   CACHE MANAGEMENT
   ============================================================ */
window.__resultFilesCacheData    = null;
window.__resultFilesCacheTime    = 0;
window.__resultFilesFetchPromise = null;
window.__resultFilesCache        = [];
window.__recentlyDeletedFileIds  = new Set();

function __removeFileFromCache(fileId) {
  if (!fileId) return;
  if (Array.isArray(window.__resultFilesCacheData)) {
    window.__resultFilesCacheData = window.__resultFilesCacheData.filter(f => f.id !== fileId);
  }
  if (Array.isArray(window.__resultFilesCache)) {
    window.__resultFilesCache = window.__resultFilesCache.filter(f => f.id !== fileId);
  }
}

/* ============================================================
   fetchResultFiles — mutex + cache + ID token
   🔒 P0-1: Kirim Firebase ID Token ke GAS (wajib untuk action=list)
   ============================================================ */
async function fetchResultFiles(forceRefresh = false) {
  const now = Date.now();
  const cacheAge = now - (window.__resultFilesCacheTime || 0);

  if (!forceRefresh && window.__resultFilesCacheData && cacheAge < RESULT_CACHE_TTL_MS) {
    return window.__resultFilesCacheData;
  }
  if (window.__resultFilesFetchPromise) {
    return window.__resultFilesFetchPromise;
  }

  window.__resultFilesFetchPromise = (async () => {
    const maxRetry = 3;
    let lastErr = null;

    /* 🔒 Ambil ID token FRESH dari Firebase Auth */
    const idToken = await __getFirebaseIdToken();
    if (!idToken) {
      console.warn('[PDF-LIST] ⚠️ Tidak ada ID token — admin belum login Firebase');
      return window.__resultFilesCacheData || [];
    }

    for (let attempt = 1; attempt <= maxRetry; attempt++) {
      try {
        const res = await fetch(GAS_ADMIN_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({
    action: 'list',
    idToken: idToken,
    _t: Date.now() + '_' + attempt
  })
});

        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();

        if (text.trim().startsWith('<')) throw new Error('Respon HTML, bukan JSON');

        const data = JSON.parse(text);

        if (data && data.success) {
          const allFiles = data.files || [];
          const filtered = allFiles.filter(f => !window.__recentlyDeletedFileIds.has(f.id));

          /* 🆕 Update cache HANYA kalau berhasil */
          window.__resultFilesCacheData = filtered;
          window.__resultFilesCacheTime = Date.now();

          if (attempt > 1) {
            console.log('[PDF-LIST] ✅', filtered.length, 'file (attempt ' + attempt + ')');
          } else {
            console.log('[PDF-LIST] ✅', filtered.length, 'file');
          }
          return window.__resultFilesCacheData;
        }

        console.warn('[PDF-LIST] Gagal:', data?.error);
      } catch (e) {
        lastErr = e;
        /* 🆕 Log lebih tenang — jangan warn merah tiap attempt */
        if (attempt === maxRetry) {
          console.warn(`[PDF-LIST] Attempt ${attempt}/${maxRetry} gagal:`, e.message);
        } else {
          // console.log(`[PDF-LIST] Retry ${attempt}/${maxRetry}...`);
        }

        if (attempt < maxRetry) {
          await new Promise(r => setTimeout(r, 800));
        }
      }
    }

    /* Semua attempt gagal → pakai cache lama (JANGAN kosongkan) */
    console.warn('[PDF-LIST] Semua retry gagal, pakai cache lama');
    return window.__resultFilesCacheData || [];
  })();

  try {
    return await window.__resultFilesFetchPromise;
  } finally {
    window.__resultFilesFetchPromise = null;
  }
}

/* ============================================================
   INVALIDATE CACHE
   ============================================================ */
function __invalidateResultCache() {
  window.__resultFilesCacheData = null;
  window.__resultFilesCacheTime = 0;
  window.__resultFilesFetchPromise = null;
}

/* ============================================================
   🆕 deleteResultFile — kirim sinyal delete
   ============================================================ */
/* ============================================================
   deleteResultFile — POST + retry + robust JSON parsing
   ============================================================ */
async function deleteResultFile(fileId, fileName) {
  const name = fileName || 'file ini';

  const ok = await __confirmDanger(
    'Hapus "' + name + '" dari Google Drive?\n\nFile akan dipindah ke Trash.',
    { title: '🗑️ Hapus File', okText: 'Ya, Hapus' }
  );
  if (!ok) return;

  if (!fileId) {
    await __alert('File ID tidak valid', '❌ Error');
    return;
  }

  const idToken = await __getFirebaseIdToken();
  if (!idToken) {
    await __alert('Sesi admin berakhir. Login ulang.', '⚠️ Error');
    return;
  }

  const maxRetry = 3;
  let lastErr = null;

  for (let attempt = 1; attempt <= maxRetry; attempt++) {
    try {
      const res = await fetch(GAS_ADMIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', fileId, idToken })
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      const text = await res.text();

      /* Guard: kalau GAS balas HTML (redirect), retry */
      if (text.trim().startsWith('<')) {
        throw new Error('Respon HTML (GAS redirect)');
      }

      const data = JSON.parse(text);

      if (!data || !data.success) {
        // Server balas JSON tapi gagal → tidak perlu retry
        await __alert('Gagal hapus: ' + (data?.error || 'Unknown error'), '❌ Error');
        return;
      }

      /* ===== SUKSES ===== */
      window.__recentlyDeletedFileIds.add(fileId);
      setTimeout(() => window.__recentlyDeletedFileIds.delete(fileId), RECENTLY_DELETED_TTL_MS);
      __removeFileFromCache(fileId);

      if (document.getElementById('resultFilesPageOverlay')) __renderResultPageContent();
      if (typeof __updateAdminResultCounter === 'function') __updateAdminResultCounter();

      /* 🆕 Kirim sinyal delete ke admin lain */
      try {
        firebase.database().ref('sgs_state/lastDelete').set({
          ts: firebase.database.ServerValue.TIMESTAMP,
          fileId: fileId
        }).catch(() => {});
      } catch (e) {}

      await __alert('File berhasil dihapus dari Drive', '✅ Sukses');

      /* Refresh cache setelah Drive propagation */
      setTimeout(async () => {
        __invalidateResultCache();
        try {
          const files = await fetchResultFiles(true);
          window.__resultFilesCache = files;
          if (document.getElementById('resultFilesPageOverlay')) __renderResultPageContent();
          if (typeof __updateAdminResultCounter === 'function') __updateAdminResultCounter();
        } catch (err) {}
      }, DRIVE_PROPAGATION_DELAY_MS);

      return; // ✅ Keluar dari fungsi setelah sukses

    } catch (e) {
      lastErr = e;
      if (attempt === maxRetry) {
        console.warn(`[DELETE] Attempt ${attempt}/${maxRetry} gagal:`, e.message);
      } else {
        //console.log(`[DELETE] Retry ${attempt}/${maxRetry}...`, e.message);
        await new Promise(r => setTimeout(r, 800));
      }
    }
  }

  /* Semua attempt gagal */
  console.error('[DELETE] Semua retry gagal:', lastErr?.message);
  await __alert('Gagal hapus: ' + (lastErr?.message || 'Koneksi bermasalah'), '❌ Error');
}
/* ============================================================
   HELPER
   ============================================================ */
function __extractCandidateInfo(file) {
  let name = '-', position = '-', password = '-';
  try {
    String(file.description || '').split('\n').forEach(l => {
      const t = l.trim();
      if (t.startsWith('Nama:'))         name     = t.replace('Nama:', '').trim();
      if (t.startsWith('Posisi:'))       position = t.replace('Posisi:', '').trim();
      if (t.startsWith('Password PDF:')) password = t.replace('Password PDF:', '').trim();
    });
  } catch (e) {}
  if (name === '-' && file.name) {
    const m = String(file.name).match(/^(.+?)-(?:Psikotes-SGSchools|Excel-\d{4}-\d{2}-\d{2})/i);
    if (m) name = m[1].replace(/-/g, ' ').trim();
  }
  return { name, position, password };
}

function __detectFileKind(file) {
  const n = String(file.name || '').toLowerCase();
  if (/\.pdf$/.test(n))       return 'pdf';
  if (/\.xlsx?$/.test(n))     return 'excel';
  if (/\.(csv|ods)$/.test(n)) return 'excel';
  return 'other';
}

/* ============================================================
   RENDER — 1 kandidat = 1 kartu
   ============================================================ */
function renderResultFilesHTML(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return `<div style="padding: 20px 14px; text-align: center; color: #94a3b8; font-size: 12px; background: #fff; border-radius: 10px;">📭 Belum ada PDF yang dikirim kandidat</div>`;
  }

  const groups = new Map();
  files.forEach(f => {
    const info = __extractCandidateInfo(f);
    const key = (info.name || 'tanpa-nama').toLowerCase().trim() || 'tanpa-nama';
    if (!groups.has(key)) {
      groups.set(key, { name: info.name, position: info.position, password: info.password, files: [] });
    }
    const g = groups.get(key);
    if (info.position !== '-' && g.position === '-') g.position = info.position;
    if (info.password !== '-' && g.password === '-') g.password = info.password;
    g.files.push(f);
  });

  const groupArr = Array.from(groups.values()).sort((a, b) => {
    const la = Math.max(...a.files.map(f => f.date || 0));
    const lb = Math.max(...b.files.map(f => f.date || 0));
    return lb - la;
  });

  function renderFileRow(f, kind) {
    const sizeMB = f.size ? (f.size / 1024 / 1024).toFixed(2) + ' MB' : '-';
    const styleMap = {
      pdf:   { icon: '📄', label: 'Hasil Tes (PDF)', bg: '#eff6ff', br: '#bfdbfe', iconBg: '#dbeafe', text: '#1e40af' },
      excel: { icon: '📊', label: 'Jawaban Excel',    bg: '#ecfdf5', br: '#86efac', iconBg: '#d1fae5', text: '#15803d' },
      other: { icon: '📁', label: 'File Lain',         bg: '#f8fafc', br: '#cbd5e1', iconBg: '#e2e8f0', text: '#475569' }
    };
    const s = styleMap[kind] || styleMap.other;
    const shortName = (f.name || '').length > 42 ? (f.name || '').slice(0, 42) + '...' : (f.name || '');

    let pdfPassword = '-';
    if (kind === 'pdf') {
      try {
        String(f.description || '').split('\n').forEach(l => {
          const t = l.trim();
          if (t.startsWith('Password PDF:')) pdfPassword = t.replace('Password PDF:', '').trim();
        });
      } catch (e) {}
    }

    const passwordRow = (kind === 'pdf' && pdfPassword && pdfPassword !== '-')
      ? `<div style="margin-top: 6px; padding: 6px 10px; display: inline-flex; align-items: center; gap: 8px;
          background: #fef9c3; border: 1px solid #fde047; border-radius: 6px; font-size: 10.5px;">
          <span style="font-weight: 800; color: #713f12; white-space: nowrap;">🔑 Password PDF:</span>
          <code style="font-family: 'Courier New', monospace; font-weight: 800; color: #1e3a8a;
            background: #fff; padding: 3px 8px; border-radius: 4px; font-size: 11px; word-break: break-all;">${__adminEscape(pdfPassword)}</code>
          <button class="js-copy-pdf-password" data-password="${__adminEscape(pdfPassword)}"
            style="padding: 3px 8px; border: 1px solid #fde047; background: #fff; border-radius: 4px;
            cursor: pointer; font-size: 11px; font-family: inherit; font-weight: 800; color: #713f12;"
            title="Copy password">📋</button>
        </div>` : '';

    const safeFileUrl = __safeUrl(f.url);

    return `
      <div style="display: flex; align-items: flex-start; gap: 9px; padding: 8px 10px;
        background: ${s.bg}; border: 1px solid ${s.br}; border-radius: 9px;">
        <div style="width: 30px; height: 30px; flex: 0 0 30px; display: grid; place-items: center;
          background: ${s.iconBg}; border-radius: 8px; font-size: 15px;">${s.icon}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 800; color: ${s.text}; font-size: 11.5px; margin-bottom: 2px;">${s.label}</div>
          <div style="color: #64748b; font-size: 10px; word-break: break-all; line-height: 1.35;">
            ${__adminEscape(shortName)} &nbsp;·&nbsp; ${sizeMB}</div>
          ${passwordRow}
        </div>
        <div style="display: flex; gap: 5px; flex: 0 0 auto;">
          <a href="${safeFileUrl}" target="_blank" rel="noopener" style="padding: 5px 10px;
            background: linear-gradient(135deg, #3b82f6, #1e40af); color: #fff; border: 0; border-radius: 7px;
            font-size: 10px; font-weight: 800; text-decoration: none; white-space: nowrap;">⬇️ Buka</a>
          <button class="js-delete-file" data-file-id="${__adminEscape(f.id)}" data-file-name="${__adminEscape(f.name)}"
            style="padding: 5px 9px; background: #fff; color: #dc2626; border: 1.5px solid #fca5a5;
            border-radius: 7px; font-size: 10px; font-weight: 800; cursor: pointer; font-family: inherit;">🗑️</button>
        </div>
      </div>`;
  }

  return groupArr.map(g => {
    const pdfs   = g.files.filter(f => __detectFileKind(f) === 'pdf');
    const excels = g.files.filter(f => __detectFileKind(f) === 'excel');
    const others = g.files.filter(f => __detectFileKind(f) === 'other');

    const latestDate = Math.max(...g.files.map(f => f.date || 0));
    const dateStr = latestDate ? new Date(latestDate).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }) : '-';

    let badge;
    if (pdfs.length > 0 && excels.length > 0) {
      badge = `<span style="display: inline-flex; align-items: center; gap: 5px; font-size: 10px; color: #15803d;
        font-weight: 800; background: #dcfce7; padding: 3px 9px; border-radius: 999px; border: 1px solid #86efac;">✓ Lengkap (${g.files.length})</span>`;
    } else if (pdfs.length > 0) {
      badge = `<span style="display: inline-flex; align-items: center; gap: 5px; font-size: 10px; color: #1e40af;
        font-weight: 800; background: #eff6ff; padding: 3px 9px; border-radius: 999px; border: 1px solid #bfdbfe;">📄 PDF</span>`;
    } else if (excels.length > 0) {
      badge = `<span style="display: inline-flex; align-items: center; gap: 5px; font-size: 10px; color: #15803d;
        font-weight: 800; background: #dcfce7; padding: 3px 9px; border-radius: 999px; border: 1px solid #86efac;">📊 Excel</span>`;
    } else {
      badge = `<span style="font-size: 10px; color: #475569; font-weight: 800; background: #f1f5f9;
        padding: 3px 9px; border-radius: 999px; border: 1px solid #cbd5e1;">📁 ${g.files.length} file</span>`;
    }

    return `
      <div style="padding: 12px 14px; background: linear-gradient(180deg, #ffffff, #fbfdff);
        border: 1px solid #dbeafe; border-radius: 12px; box-shadow: 0 2px 8px rgba(30,64,175,.04);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;
          margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed #e2e8f0;">
          <div style="min-width: 0;">
            <div style="font-weight: 800; color: #1e293b; font-size: 13px; word-break: break-word;">👤 ${__adminEscape(g.name)}</div>
            <div style="color: #64748b; font-size: 11px; margin-top: 3px;">
              ${g.position !== '-' ? `📍 ${__adminEscape(g.position)} &nbsp;·&nbsp; ` : ''}🕐 ${dateStr}</div>
          </div>
          ${badge}
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${pdfs.map(f => renderFileRow(f, 'pdf')).join('')}
          ${excels.map(f => renderFileRow(f, 'excel')).join('')}
          ${others.map(f => renderFileRow(f, 'other')).join('')}
        </div>
      </div>`;
  }).join('');
}

/* ============================================================
   REFRESH DAFTAR PDF
   ============================================================ */
async function refreshResultFilesList() {
  const container = document.getElementById('adminResultFiles');
  const countEl = document.getElementById('adminResultCount');
  if (!container) return;
  container.innerHTML = `<div style="padding: 20px 14px; text-align: center; color: #94a3b8; font-size: 12px;">⏳ Memuat daftar PDF...</div>`;
  const files = await fetchResultFiles();
  const uniqueNames = new Set();
  files.forEach(f => uniqueNames.add((__extractCandidateInfo(f).name || 'tanpa-nama').toLowerCase().trim()));
  if (countEl) {
    const c = uniqueNames.size;
    const fCount = files.length;
    if (fCount === 0) { countEl.textContent = '0 file'; countEl.style.color = '#94a3b8'; }
    else { countEl.textContent = `${c} kandidat · ${fCount} file`; countEl.style.color = '#1e40af'; }
  }
  container.innerHTML = renderResultFilesHTML(files);
}

/* ============================================================
   ADMIN LOGIN PROMPT
   ============================================================ */
function renderAdminLoginPrompt() {
  const old = document.getElementById('adminLoginOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'adminLoginOverlay';
  overlay.style.cssText = `position: fixed; inset: 0; z-index: 99999;
    background: rgba(10,20,35,0.95); backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; font-family: Inter, system-ui, -apple-system, sans-serif;`;

  overlay.innerHTML = `
    <div style="width: min(420px, 100%); background: linear-gradient(180deg, #ffffff 0%, #f7fafd 100%);
      border-radius: 22px; box-shadow: 0 30px 90px rgba(0,0,0,.60); overflow: hidden;">
      <div style="padding: 26px 28px 22px; background: linear-gradient(135deg, #1e3a8a, #3b82f6);
        color: #fff; text-align: center;">
        <div style="width: 62px; height: 62px; margin: 0 auto 12px; display: grid; place-items: center;
          background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3);
          border-radius: 18px; font-size: 28px;">🔒</div>
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; opacity: .85;">ADMIN PANEL</div>
        <div style="font-size: 22px; font-weight: 900; margin-top: 6px;">Login Admin</div>
        <div style="font-size: 13px; opacity: .85; margin-top: 6px;">Masukkan email & password</div>
      </div>
      <div style="padding: 26px 28px 28px;">
        <input type="email" id="adminLoginEmail" placeholder="Email admin..." autocomplete="off"
          style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px;
          font-size: 15px; outline: none; font-family: inherit; background: #fff; box-sizing: border-box; margin-bottom: 10px;">
        <input type="password" id="adminLoginPassword" placeholder="Password..." autocomplete="off"
          style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px;
          font-size: 15px; outline: none; font-family: inherit; background: #fff; box-sizing: border-box;">
        <div id="adminLoginError" style="color: #dc2626; font-size: 13px; min-height: 20px;
          margin-top: 10px; text-align: center; font-weight: 600;"></div>
        <button id="adminLoginBtn" style="width: 100%; padding: 14px;
          background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; border: 0; border-radius: 12px;
          font-size: 15px; font-weight: 800; cursor: pointer; font-family: inherit; margin-top: 6px;">🔓 Masuk</button>
        <div style="margin-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">Akses hanya untuk administrator</div>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const emailEl = document.getElementById('adminLoginEmail');
  const pwdEl = document.getElementById('adminLoginPassword');
  const btn = document.getElementById('adminLoginBtn');
  const errorEl = document.getElementById('adminLoginError');

  const attemptLogin = async () => {
    const email = (emailEl.value || '').trim();
    const pwd = pwdEl.value || '';
    if (!email || !pwd) { errorEl.textContent = '⚠️ Isi email dan password'; return; }
    btn.disabled = true;
    btn.textContent = 'Memeriksa...';
    errorEl.textContent = '';
    try {
      const cred = await firebase.auth().signInWithEmailAndPassword(email, pwd);
      const snap = await firebase.database().ref('admins/' + cred.user.uid).once('value');
      if (!snap.exists() || snap.val() !== true) {
        await firebase.auth().signOut();
        throw new Error('Akun ini bukan admin');
      }
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      errorEl.style.color = '#16a34a';
      errorEl.textContent = '✅ Berhasil...';
      setTimeout(() => { overlay.remove(); renderAdminPanel(); }, 200);
    } catch (err) {
      let msg = err.message || 'Login gagal';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) msg = 'Email atau password salah';
      else if (msg.includes('too-many-requests')) msg = 'Terlalu banyak percobaan.';
      else if (msg.includes('network')) msg = 'Koneksi bermasalah.';
      errorEl.style.color = '#dc2626';
      errorEl.textContent = '❌ ' + msg;
      pwdEl.value = '';
      pwdEl.focus();
      btn.disabled = false;
      btn.textContent = '🔓 Masuk';
    }
  };

  btn.onclick = attemptLogin;
  emailEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); pwdEl.focus(); } });
  pwdEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); attemptLogin(); } });
  setTimeout(() => emailEl.focus(), 120);
}

/* ============================================================
   ADMIN LOGOUT
   ============================================================ */
async function adminLogout(skipConfirm) {
  if (!skipConfirm) {
    const ok = await __confirm('Keluar dari panel admin?', { title: '🚪 Logout', okText: 'Ya, Logout' });
    if (!ok) return;
  }

  if (typeof __stopAdminIdleTracking === 'function') __stopAdminIdleTracking();

  /* 🆕 Stop ALL listeners */
  if (typeof stopResultsRealtimeListener === 'function') { try { stopResultsRealtimeListener(); } catch (e) {} }
  if (typeof stopSignalListeners === 'function') { try { stopSignalListeners(); } catch (e) {} }

  try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch (e) {}
  try { sessionStorage.removeItem(ADMIN_KEY_OK_KEY); } catch (e) {}
  try { firebase.auth().signOut(); } catch (e) {}

  if (typeof window.stopListeningActiveSessions === 'function') { try { window.stopListeningActiveSessions(); } catch (e) {} }
  if (typeof stopAdminUnreadTracker === 'function') { try { stopAdminUnreadTracker(); } catch (e) {} }
  if (typeof stopAdminTimerTick === 'function') { try { stopAdminTimerTick(); } catch (e) {} }
  if (window.__pdfAutoRefreshTimer) { clearInterval(window.__pdfAutoRefreshTimer); window.__pdfAutoRefreshTimer = null; }
  if (typeof stopListeningAccessRequests === 'function') { try { stopListeningAccessRequests(); } catch (e) {} }

  const toastContainer = document.getElementById('sgsResultToastContainer');
  if (toastContainer) toastContainer.remove();

  const panel = document.getElementById('adminPanelOverlay');
  if (panel) panel.remove();
  const login = document.getElementById('adminLoginOverlay');
  if (login) login.remove();

  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    url.hash = '';
    window.history.replaceState({}, '', url.pathname + (url.search || ''));
  } catch (e) {}

  console.log('[ADMIN] Logged out');
}

/* ============================================================
   ACCORDION
   ============================================================ */
window.__adminSectionOpen = window.__adminSectionOpen || { active: false, result: false, request: false };

function toggleAdminSection(key) {
  window.__adminSectionOpen[key] = !window.__adminSectionOpen[key];
  const body = document.getElementById('adminSectionBody_' + key);
  const arrow = document.getElementById('adminSectionArrow_' + key);
  if (body) body.style.display = window.__adminSectionOpen[key] ? 'block' : 'none';
  if (arrow) arrow.textContent = window.__adminSectionOpen[key] ? '▼' : '▶';
}

/* ============================================================
   ACCESS REQUESTS
   ============================================================ */
let __adminRequestRef = null;
let __adminRequestCb = null;
window.__adminAccessRequests = [];

function listenAccessRequests(callback) {
  if (typeof firebase === 'undefined' || !firebase.apps.length) { callback([]); return; }
  if (__adminRequestRef && __adminRequestCb) { try { __adminRequestRef.off('value', __adminRequestCb); } catch (e) {} }
  __adminRequestRef = firebase.database().ref('sgs_requests');
  __adminRequestCb = (snap) => {
    const data = snap.val() || {};
    const requests = Object.entries(data).map(([deviceId, req]) => ({ deviceId, ...req }))
      .filter(r => r.status === 'pending').sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
    window.__adminAccessRequests = requests;
    callback(requests);
  };
  __adminRequestRef.on('value', __adminRequestCb);
}

function stopListeningAccessRequests() {
  if (__adminRequestRef && __adminRequestCb) {
    try { __adminRequestRef.off('value', __adminRequestCb); } catch (e) {}
    __adminRequestRef = null;
    __adminRequestCb = null;
  }
}

function renderAccessRequestsHTML(requests) {
  if (!Array.isArray(requests) || requests.length === 0) {
    return `<div style="padding: 14px; text-align: center; color: #94a3b8; font-size: 12px; background: #fff; border-radius: 10px;">📭 Belum ada request izin akses</div>`;
  }
  return requests.map(r => {
    const ago = r.requestedAt ? Math.round((Date.now() - r.requestedAt) / 1000) : null;
    const agoStr = ago === null ? '-' : ago < 60 ? ago + 's lalu' : ago < 3600 ? Math.floor(ago / 60) + 'm lalu' : ago < 86400 ? Math.floor(ago / 3600) + 'j lalu' : Math.floor(ago / 86400) + 'h lalu';
    return `
      <div style="padding: 12px 14px; background: #fff; border: 1px solid #fde68a; border-radius: 10px; font-size: 12px; line-height: 1.5;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
          <div style="font-weight: 800; color: #1e293b; min-width:0;">${__adminEscape(r.name || '(tanpa nama)')}</div>
          <div style="font-size: 10px; color: #92400e; font-weight: 800; white-space: nowrap; background: #fef3c7; padding: 3px 8px; border-radius: 999px;">⏳ Menunggu</div>
        </div>
        <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">
          ${r.position ? '📍 ' + __adminEscape(r.position) + ' &nbsp;·&nbsp; ' : ''}🕐 ${agoStr}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; padding-top: 6px; border-top: 1px dashed #fde68a;">
          <div style="color: #94a3b8; font-size: 10px;">ID: ${__adminEscape(String(r.deviceId || '').slice(-8))}</div>
          <div style="display: flex; gap: 6px;">
            <button class="js-reject-request" data-device-id="${__adminEscape(r.deviceId)}"
              style="padding: 5px 12px; background: #fff; color: #dc2626; border: 1.5px solid #fca5a5;
              border-radius: 7px; font-size: 11px; font-weight: 800; cursor: pointer; font-family: inherit;">✕ Tolak</button>
            <button class="js-approve-request" data-device-id="${__adminEscape(r.deviceId)}" data-name="${__adminEscape(r.name || '')}"
              style="padding: 5px 12px; background: linear-gradient(135deg, #16a34a, #059669); color: #fff;
              border: 0; border-radius: 7px; font-size: 11px; font-weight: 800; cursor: pointer; font-family: inherit;">✓ Setujui</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

async function approveAccessRequest(deviceId, name) {
  const n = name || 'kandidat';
  const ok = await __confirm(
    'Setujui izin akses untuk "' + n + '"?\n\n• Device akan di-reset\n• Kandidat pakai password FRESH\n• Kandidat harus login ulang',
    { title: '✓ Setujui Akses', okText: 'Ya, Setujui', okStyle: 'success' }
  );
  if (!ok) return;
  try {
    await firebase.database().ref('sgs_state/sessions/' + deviceId).update({
      allow_retake: true,
      allow_retake_at: firebase.database.ServerValue.TIMESTAMP,
      allow_retake_by: 'admin',
      finished: false,
      disqualified: false,
      lastSeen: firebase.database.ServerValue.TIMESTAMP
    });
    await firebase.database().ref('sgs_requests/' + deviceId).update({
      status: 'approved',
      respondedAt: firebase.database.ServerValue.TIMESTAMP,
      respondedBy: 'admin'
    });
    await __alert('Izin akses diberikan untuk "' + n + '".', '✅ Sukses');
  } catch (e) { await __alert('Gagal: ' + e.message, '❌ Error'); }
}

async function rejectAccessRequest(deviceId) {
  const ok = await __confirmDanger('Tolak request izin ini?', { title: '✕ Tolak Request', okText: 'Ya, Tolak' });
  if (!ok) return;
  try {
    await firebase.database().ref('sgs_requests/' + deviceId).update({
      status: 'rejected',
      respondedAt: firebase.database.ServerValue.TIMESTAMP,
      respondedBy: 'admin'
    });
    await __alert('Request ditolak.', '✅ Sukses');
  } catch (e) { await __alert('Gagal: ' + e.message, '❌ Error'); }
}

/* ============================================================
   HALAMAN HASIL TES TERKIRIM
   ============================================================ */
window.__resultFilterPosition = 'all';
window.__resultSearchQuery = '';
window.__resultFilesPageOpen = false;

function openResultFilesPage() {
  const existing = document.getElementById('resultFilesPageOverlay');
  if (existing) existing.remove();
  window.__resultFilesPageOpen = false;
  try {
    window.__resultFilesPageOpen = true;
    const overlay = document.createElement('div');
    overlay.id = 'resultFilesPageOverlay';
    overlay.style.cssText = `position: fixed; inset: 0; z-index: 100000;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      display: flex; flex-direction: column;
      font-family: Inter, system-ui, -apple-system, sans-serif;
      color: #e2e8f0; animation: resultPageIn .3s cubic-bezier(.2,.8,.2,1);`;

    overlay.innerHTML = `
      <style>
        @keyframes resultPageIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes resultCardIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes resultSpinner { to { transform: rotate(360deg); } }
        #resultFilesPageOverlay ::-webkit-scrollbar { width: 8px; height: 8px; }
        #resultFilesPageOverlay ::-webkit-scrollbar-track { background: rgba(255,255,255,.03); }
        #resultFilesPageOverlay ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 4px; }
        .rf-chip { padding: 8px 16px; border-radius: 999px; background: rgba(255,255,255,.06);
          border: 1.5px solid rgba(255,255,255,.1); color: #cbd5e1; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all .18s ease; font-family: inherit; white-space: nowrap; }
        .rf-chip:hover { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.2); color: #fff; }
        .rf-chip.active { background: linear-gradient(135deg, #3b82f6, #6366f1);
          border-color: transparent; color: #fff; box-shadow: 0 4px 14px rgba(59,130,246,.4); }
        .rf-card { background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
          border: 1px solid rgba(255,255,255,.08); border-radius: 18px; padding: 20px;
          transition: all .22s ease; backdrop-filter: blur(10px); animation: resultCardIn .35s ease both; }
        .rf-card:hover { border-color: rgba(99,102,241,.4); transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,.3), 0 0 0 1px rgba(99,102,241,.2); }
        .rf-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px;
          border-radius: 9px; font-size: 12px; font-weight: 800; cursor: pointer;
          transition: all .18s ease; font-family: inherit; text-decoration: none; border: 0; }
        .rf-btn:hover { transform: translateY(-1px); }
        .rf-btn-primary { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; box-shadow: 0 4px 12px rgba(59,130,246,.3); }
        .rf-btn-danger { background: rgba(239,68,68,.12); color: #fca5a5; border: 1px solid rgba(239,68,68,.3); }
      </style>

      <div style="padding: 20px 28px; background: linear-gradient(180deg, rgba(0,0,0,.25), transparent);
        border-bottom: 1px solid rgba(255,255,255,.08); display: flex; align-items: center; gap: 18px; flex-wrap: wrap;">
        <button id="rfBackBtn" style="width: 42px; height: 42px; flex: 0 0 42px; display: grid; place-items: center;
          background: rgba(255,255,255,.08); border: 1.5px solid rgba(255,255,255,.14); border-radius: 12px;
          color: #fff; font-size: 18px; cursor: pointer; font-family: inherit;">←</button>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #818cf8; margin-bottom: 4px;">ADMIN PANEL · HASIL TES</div>
          <div style="font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -.3px;">📄 Hasil Tes Terkirim</div>
        </div>
        <div id="rfStats" style="display: flex; gap: 12px; flex-wrap: wrap;"></div>
        <button id="rfRefreshBtn" style="padding: 10px 18px; background: linear-gradient(135deg, #16a34a, #059669);
          border: 0; border-radius: 11px; color: #fff; font-size: 13px; font-weight: 800;
          cursor: pointer; font-family: inherit;">🔄 Refresh</button>
      </div>

      <div style="padding: 18px 28px; background: rgba(0,0,0,.15); border-bottom: 1px solid rgba(255,255,255,.06);">
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 14px;">
          <div style="flex: 1; min-width: 240px; position: relative;">
            <input id="rfSearchInput" type="text" placeholder="Cari nama kandidat atau posisi..." autocomplete="off"
              style="width: 100%; padding: 12px 16px 12px 42px; background: rgba(255,255,255,.06);
              border: 1.5px solid rgba(255,255,255,.1); border-radius: 12px; color: #fff; font-size: 14px;
              font-family: inherit; outline: none; box-sizing: border-box;">
            <span style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%);
              font-size: 16px; color: #64748b; pointer-events: none;">🔍</span>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <span style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #64748b; margin-right: 4px;">FILTER POSISI:</span>
          <div id="rfPositionChips" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
        </div>
      </div>

      <div id="rfContent" style="flex: 1; overflow-y: auto; padding: 24px 28px 40px;">
        <div style="display: flex; align-items: center; justify-content: center; padding: 60px 20px;
          color: #64748b; font-size: 14px; flex-direction: column; gap: 14px;">
          <div style="width: 40px; height: 40px; border: 3px solid rgba(255,255,255,.1);
            border-top-color: #6366f1; border-radius: 50%; animation: resultSpinner 0.8s linear infinite;"></div>
          Memuat daftar hasil tes...
        </div>
      </div>`;

    document.body.appendChild(overlay);
    document.getElementById('rfBackBtn').onclick = closeResultFilesPage;
    document.getElementById('rfRefreshBtn').onclick = async (e) => {
      const btn = e.currentTarget;
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '⏳ Memuat...';
      try {
        if (typeof __invalidateResultCache === 'function') __invalidateResultCache();
        const files = await fetchResultFiles(true);
        window.__resultFilesCache = files;
        __renderResultPageContent();
      } catch (err) {} finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    };
    const searchInput = document.getElementById('rfSearchInput');
    let __searchDebounceTimer = null;
    searchInput.addEventListener('input', (e) => {
      window.__resultSearchQuery = (e.target.value || '').toLowerCase().trim();
      clearTimeout(__searchDebounceTimer);
      __searchDebounceTimer = setTimeout(() => __renderResultPageContent(), 250);
    });
    loadResultFilesForPage();
  } catch (err) {
    window.__resultFilesPageOpen = false;
    __alert('Gagal membuka halaman hasil tes: ' + err.message, '❌ Error');
  }
}

function closeResultFilesPage() {
  const overlay = document.getElementById('resultFilesPageOverlay');
  if (overlay) overlay.remove();
  window.__resultFilesPageOpen = false;
  if (typeof __updateAdminResultCounter === 'function') __updateAdminResultCounter();
}

async function loadResultFilesForPage() {
  const content = document.getElementById('rfContent');
  if (!content) return;
  if (Array.isArray(window.__resultFilesCacheData)) {
    window.__resultFilesCache = window.__resultFilesCacheData;
    __renderResultPageContent();
    const cacheAge = Date.now() - (window.__resultFilesCacheTime || 0);
    if (cacheAge > 10000) {
      fetchResultFiles(true).then(files => {
        window.__resultFilesCache = files;
        __renderResultPageContent();
      });
    }
    return;
  }
  content.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; padding: 60px 20px;
    color: #64748b; font-size: 14px; flex-direction: column; gap: 14px;">
    <div style="width: 40px; height: 40px; border: 3px solid rgba(255,255,255,.1);
      border-top-color: #6366f1; border-radius: 50%; animation: resultSpinner 0.8s linear infinite;"></div>
    Memuat daftar hasil tes...</div>`;
  const files = await fetchResultFiles();
  window.__resultFilesCache = files;
  __renderResultPageContent();
}

function __renderResultPageContent() {
  const content = document.getElementById('rfContent');
  const chipsContainer = document.getElementById('rfPositionChips');
  const statsContainer = document.getElementById('rfStats');
  if (!content || !chipsContainer || !statsContainer) return;

  const files = window.__resultFilesCache || [];

  /* 🆕 Cegah flicker: kalau data sama, skip render */
  const signature = JSON.stringify(files.map(f => f.id).sort());
  if (window.__lastRenderedSignature === signature) {
    return;  // Data tidak berubah → skip render
  }
  window.__lastRenderedSignature = signature;
  const groups = new Map();
  files.forEach(f => {
    const info = __extractCandidateInfo(f);
    const key = (info.name || 'tanpa-nama').toLowerCase().trim() || 'tanpa-nama';
    if (!groups.has(key)) groups.set(key, { name: info.name, position: info.position, files: [] });
    const g = groups.get(key);
    if (info.position !== '-' && g.position === '-') g.position = info.position;
    g.files.push(f);
  });

  let groupArr = Array.from(groups.values());
  groupArr.sort((a, b) => {
    const la = Math.max(...a.files.map(f => f.date || 0));
    const lb = Math.max(...b.files.map(f => f.date || 0));
    return lb - la;
  });

  const positionSet = new Set();
  groupArr.forEach(g => { if (g.position && g.position !== '-') positionSet.add(g.position); });
  const positions = Array.from(positionSet).sort();

  const currentFilter = window.__resultFilterPosition || 'all';
  let chipsHTML = `<button class="rf-chip ${currentFilter === 'all' ? 'active' : ''}"
    onclick="__setResultFilter('all')">Semua (${groupArr.length})</button>`;
  positions.forEach(p => {
    const count = groupArr.filter(g => g.position === p).length;
    const safeP = String(p).replace(/'/g, "\\'");
    chipsHTML += `<button class="rf-chip ${currentFilter === p ? 'active' : ''}"
      onclick="__setResultFilter('${safeP}')">${__adminEscape(p)} (${count})</button>`;
  });
  const noPosCount = groupArr.filter(g => !g.position || g.position === '-').length;
  if (noPosCount > 0) {
    chipsHTML += `<button class="rf-chip ${currentFilter === '__no_position__' ? 'active' : ''}"
      onclick="__setResultFilter('__no_position__')">Tanpa Posisi (${noPosCount})</button>`;
  }
  chipsContainer.innerHTML = chipsHTML;

  const totalFiles = groupArr.reduce((acc, g) => acc + g.files.length, 0);
  statsContainer.innerHTML = `
    <div style="padding: 8px 14px; border-radius: 10px; background: rgba(99,102,241,.12);
      border: 1px solid rgba(99,102,241,.3); font-size: 12px; font-weight: 800; color: #a5b4fc;">
      👥 ${groupArr.length} kandidat</div>
    <div style="padding: 8px 14px; border-radius: 10px; background: rgba(34,197,94,.12);
      border: 1px solid rgba(34,197,94,.3); font-size: 12px; font-weight: 800; color: #86efac;">
      📎 ${totalFiles} file</div>`;

  const search = window.__resultSearchQuery || '';
  const filterPos = window.__resultFilterPosition || 'all';
  let filtered = groupArr;
  if (filterPos === '__no_position__') filtered = filtered.filter(g => !g.position || g.position === '-');
  else if (filterPos !== 'all') filtered = filtered.filter(g => g.position === filterPos);
  if (search) filtered = filtered.filter(g =>
    (g.name || '').toLowerCase().includes(search) || (g.position || '').toLowerCase().includes(search));

  if (filtered.length === 0) {
    content.innerHTML = `<div style="display: flex; align-items: center; justify-content: center;
      padding: 80px 20px; color: #64748b; font-size: 14px; flex-direction: column; gap: 12px; text-align: center;">
      <div style="font-size: 52px; opacity: .5;">📭</div>
      <div style="font-weight: 700; color: #94a3b8;">
        ${files.length === 0 ? 'Belum ada hasil tes yang terkirim' : 'Tidak ada kandidat yang cocok dengan filter'}</div>
      ${files.length > 0 ? `<button onclick="__resetResultFilter()" style="margin-top: 8px; padding: 9px 20px;
        background: rgba(99,102,241,.15); border: 1px solid rgba(99,102,241,.4);
        color: #a5b4fc; border-radius: 9px; font-family: inherit; font-size: 13px; font-weight: 800;
        cursor: pointer;">Reset Filter</button>` : ''}</div>`;
    return;
  }

  const cardsHTML = filtered.map(g => {
    const pdfs = g.files.filter(f => __detectFileKind(f) === 'pdf');
    const excels = g.files.filter(f => __detectFileKind(f) === 'excel');
    const others = g.files.filter(f => __detectFileKind(f) === 'other');
    const latestDate = Math.max(...g.files.map(f => f.date || 0));
    const dateStr = latestDate ? new Date(latestDate).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
    const initials = (g.name || '?').split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
    const hash = (g.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const avatarColors = [['#3b82f6','#1e40af'],['#8b5cf6','#6d28d9'],['#10b981','#047857'],['#f59e0b','#b45309'],['#ec4899','#be185d'],['#06b6d4','#0e7490']];
    const [c1, c2] = avatarColors[hash % avatarColors.length];

    let badge, badgeColor;
    if (pdfs.length > 0 && excels.length > 0) { badge = '✓ Lengkap'; badgeColor = { bg: 'rgba(34,197,94,.15)', br: 'rgba(34,197,94,.4)', text: '#86efac' }; }
    else if (pdfs.length > 0) { badge = '📄 PDF'; badgeColor = { bg: 'rgba(59,130,246,.15)', br: 'rgba(59,130,246,.4)', text: '#93c5fd' }; }
    else if (excels.length > 0) { badge = '📊 Excel'; badgeColor = { bg: 'rgba(34,197,94,.15)', br: 'rgba(34,197,94,.4)', text: '#86efac' }; }
    else { badge = `📁 ${g.files.length} file`; badgeColor = { bg: 'rgba(148,163,184,.15)', br: 'rgba(148,163,184,.4)', text: '#cbd5e1' }; }

    function fileRow(f, kind) {
      const sizeMB = f.size ? (f.size / 1024 / 1024).toFixed(2) + ' MB' : '-';
      const iconMap = { pdf: '📄', excel: '📊', other: '📁' };
      const labelMap = { pdf: 'Hasil Tes (PDF)', excel: 'Jawaban Excel', other: 'File Lain' };
      let pdfPassword = '-';
      if (kind === 'pdf') {
        try {
          String(f.description || '').split('\n').forEach(l => {
            const t = l.trim();
            if (t.startsWith('Password PDF:')) pdfPassword = t.replace('Password PDF:', '').trim();
          });
        } catch (e) {}
      }
      const passwordRow = (kind === 'pdf' && pdfPassword && pdfPassword !== '-')
        ? `<div style="margin-top: 8px; padding: 8px 10px; display: inline-flex; align-items: center; gap: 8px;
            background: rgba(250,204,21,.15); border: 1px solid rgba(250,204,21,.4); border-radius: 7px;
            font-size: 11px; flex-wrap: wrap;">
            <span style="font-weight: 800; color: #fde047; white-space: nowrap;">🔑 Password PDF:</span>
            <code style="font-family: 'Courier New', monospace; font-weight: 800; color: #fff;
              background: rgba(0,0,0,.35); padding: 3px 9px; border-radius: 4px; font-size: 11.5px;
              word-break: break-all;">${__adminEscape(pdfPassword)}</code>
            <button class="js-copy-pdf-password" data-password="${__adminEscape(pdfPassword)}"
              style="padding: 3px 9px; border: 1px solid rgba(250,204,21,.5); background: rgba(255,255,255,.08);
              border-radius: 5px; cursor: pointer; font-size: 11px; font-family: inherit;
              font-weight: 800; color: #fde047;">📋</button></div>` : '';
      const safeFileUrl = __safeUrl(f.url);
      return `
        <div style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px;
          background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); border-radius: 11px;">
          <div style="width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center;
            background: rgba(255,255,255,.06); border-radius: 9px; font-size: 16px;">${iconMap[kind] || iconMap.other}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 800; color: #e2e8f0; font-size: 12px; margin-bottom: 3px;">${labelMap[kind] || labelMap.other}</div>
            <div style="color: #64748b; font-size: 10.5px; word-break: break-all; line-height: 1.4;">
              ${__adminEscape((f.name || '').slice(0, 45))}${(f.name || '').length > 45 ? '...' : ''} · ${sizeMB}</div>
            ${passwordRow}
          </div>
          <div style="display: flex; gap: 6px; flex: 0 0 auto;">
            <a href="${safeFileUrl}" target="_blank" rel="noopener" class="rf-btn rf-btn-primary">⬇ Buka</a>
            <button class="js-delete-file rf-btn rf-btn-danger" data-file-id="${__adminEscape(f.id)}"
              data-file-name="${__adminEscape(f.name)}">🗑</button>
          </div>
        </div>`;
    }

    return `
      <div class="rf-card">
        <div style="display: flex; align-items: flex-start; gap: 14px; margin-bottom: 14px;
          padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,.06);">
          <div style="width: 48px; height: 48px; flex: 0 0 48px; display: grid; place-items: center;
            background: linear-gradient(135deg, ${c1}, ${c2}); border-radius: 14px; font-size: 17px;
            font-weight: 900; color: #fff; letter-spacing: -.5px; box-shadow: 0 6px 16px ${c1}55;">${initials}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px;">
              <div style="font-size: 15px; font-weight: 900; color: #fff; letter-spacing: -.2px;
                word-break: break-word;">${__adminEscape(g.name)}</div>
              <span style="padding: 3px 10px; border-radius: 999px; background: ${badgeColor.bg};
                border: 1px solid ${badgeColor.br}; color: ${badgeColor.text}; font-size: 10px;
                font-weight: 800; white-space: nowrap;">${badge}</span>
            </div>
            <div style="color: #94a3b8; font-size: 12px; font-weight: 600;">
              ${g.position !== '-' ? `💼 ${__adminEscape(g.position)}` : '💼 <span style="opacity:.6">Tanpa posisi</span>'}
              <span style="opacity:.4; margin: 0 8px;">•</span>🕐 ${dateStr}</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${pdfs.map(f => fileRow(f, 'pdf')).join('')}
          ${excels.map(f => fileRow(f, 'excel')).join('')}
          ${others.map(f => fileRow(f, 'other')).join('')}
        </div>
      </div>`;
  }).join('');

  content.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px;">${cardsHTML}</div>`;
}

function __setResultFilter(pos) {
  window.__resultFilterPosition = pos;
  __renderResultPageContent();
}

function __resetResultFilter() {
  window.__resultFilterPosition = 'all';
  window.__resultSearchQuery = '';
  const input = document.getElementById('rfSearchInput');
  if (input) input.value = '';
  __renderResultPageContent();
}

async function __updateAdminResultCounter() {
  const countEl = document.getElementById('adminResultCount');
  if (!countEl) return;
  const files = await fetchResultFiles();
  __renderCounterFromData(files);
}

function __renderCounterFromData(files) {
  const countEl = document.getElementById('adminResultCount');
  if (!countEl) return;
  if (!files || !files.length) {
    countEl.textContent = 'Belum ada hasil tes';
    countEl.style.color = '#94a3b8';
    return;
  }
  const uniqueNames = new Set();
  files.forEach(f => uniqueNames.add((__extractCandidateInfo(f).name || 'tanpa-nama').toLowerCase().trim()));
  countEl.textContent = `${uniqueNames.size} kandidat · ${files.length} file`;
  countEl.style.color = '#15803d';
}

/* ============================================================
   RENDER ADMIN PANEL
   ============================================================ */
function renderAdminPanel() {
  const old = document.getElementById('adminPanelOverlay');
  if (old) old.remove();

  const locked = __safeGetLockState();
  const deviceFinished = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DEVICE_FINISHED) === '1';
  const usedPragas = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USED_PRAGAS) === '1';

  let identityName = '(belum ada)';
  try {
    const raw = localStorage.getItem('identity');
    if (raw) identityName = (JSON.parse(raw).name) || '(kosong)';
  } catch (e) {}

  let completedCount = 0;
  try {
    const raw = localStorage.getItem('completed');
    if (raw) completedCount = Object.values(JSON.parse(raw)).filter(v => v === true).length;
  } catch (e) {}

  const myDeviceId = localStorage.getItem('_sgs_device_id') || '';

  const overlay = document.createElement('div');
  overlay.id = 'adminPanelOverlay';
  overlay.style.cssText = `position: fixed; inset: 0; z-index: 99999;
    background: rgba(10,20,35,0.90); backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; overflow-y: auto;`;

  overlay.innerHTML = `
    <div style="width: min(720px, 100%); max-height: calc(100vh - 40px); overflow-y: auto;
      background: linear-gradient(180deg, #ffffff 0%, #f7fafd 100%); border-radius: 22px;
      box-shadow: 0 30px 90px rgba(0,0,0,.55);
      font-family: Inter, system-ui, -apple-system, sans-serif; color: #1a2332;">

      <div style="padding: 24px 28px 20px;
        background: linear-gradient(135deg, ${locked ? '#7f1d1d' : '#1e3a8a'}, ${locked ? '#dc2626' : '#3b82f6'});
        border-radius: 22px 22px 0 0; color: #fff; position: relative;">
        <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 6px;">
          <button id="btnAdminLogout" title="Logout" style="height: 34px; padding: 0 12px;
            background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3);
            border-radius: 9px; cursor: pointer; color: #fff; font-size: 12px; font-weight: 800;
            font-family: inherit;">🚪 Logout</button>
          <button id="btnAdminClose" title="Tutup" style="width: 34px; height: 34px;
            background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3);
            border-radius: 9px; cursor: pointer; color: #fff; font-size: 16px; font-weight: 700;
            font-family: inherit;">✕</button>
        </div>
        <div style="font-size: 12px; font-weight: 800; letter-spacing: 2px; opacity: .85;">ADMIN PANEL</div>
        <div style="font-size: 24px; font-weight: 900; margin-top: 6px;">🔐 Login Control</div>
        <div style="font-size: 13px; opacity: .85; margin-top: 6px;">
          ${locked ? '🔒 SEMUA LOGIN DITOLAK' : '🔓 Kandidat bisa login'}</div>
      </div>

      <div style="padding: 24px 28px 28px;">

        <div style="padding: 18px 20px; background: ${locked ? '#fef2f2' : '#f0fdf4'};
          border: 2px solid ${locked ? '#fca5a5' : '#86efac'}; border-radius: 16px; margin-bottom: 22px;">
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; user-select: none;">
            <input type="checkbox" id="adminLockCheckbox" ${locked ? 'checked' : ''} onchange="toggleLockState()"
              style="width: 22px; height: 22px; cursor: pointer; accent-color: ${locked ? '#dc2626' : '#16a34a'};">
            <div>
              <div style="font-size: 16px; font-weight: 900; color: ${locked ? '#991b1b' : '#166534'};">
                ${locked ? '🔒 LOCK AKTIF — semua login ditolak' : '🔓 UNLOCKED — kandidat bisa login'}</div>
              <div style="font-size: 12px; color: ${locked ? '#b91c1c' : '#15803d'}; margin-top: 4px; line-height: 1.5;">
                ${locked ? 'Kandidat tidak bisa login dengan password apapun.' : 'Centang untuk memblokir semua login kandidat.'}</div>
            </div>
          </label>
        </div>

        <div style="padding: 18px 20px; background: linear-gradient(135deg, #fef3c7, #fffbeb);
          border: 2px solid #fde68a; border-radius: 14px; margin-bottom: 16px;">
          <div onclick="toggleAdminSection('request')" style="cursor: pointer; user-select: none;
            display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div style="font-size: 14px; font-weight: 900; color: #92400e; display: flex; align-items: center; gap: 8px;">
              <span id="adminSectionArrow_request" style="font-size: 11px; color: #92400e; width: 12px;">
                ${window.__adminSectionOpen.request ? '▼' : '▶'}</span>
              <span style="font-size: 16px;">📨</span>
              Request Izin Akses
            </div>
            <div id="adminRequestCount" style="font-size: 12px; font-weight: 800; color: #94a3b8;
              background: #fff; padding: 4px 10px; border-radius: 999px; border: 1px solid #fde68a;">0 request</div>
          </div>
          <div id="adminSectionBody_request" style="display: ${window.__adminSectionOpen.request ? 'block' : 'none'}; margin-top: 14px;">
            <div id="adminAccessRequests" style="display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto;">
              <div style="padding: 14px; text-align: center; color: #94a3b8; font-size: 12px;">⏳ Memuat...</div>
            </div>
          </div>
        </div>

        <button onclick="openActiveCandidatesPage()" style="width: 100%; padding: 20px 22px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 2px solid #93c5fd;
          border-radius: 14px; margin-bottom: 16px; cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: space-between; gap: 14px; text-align: left;">
          <div style="display: flex; align-items: center; gap: 14px; min-width: 0;">
            <div style="width: 48px; height: 48px; flex: 0 0 48px; display: grid; place-items: center;
              background: linear-gradient(135deg, #3b82f6, #1e40af); border-radius: 14px; font-size: 22px;">📊</div>
            <div style="min-width: 0;">
              <div style="font-size: 15px; font-weight: 900; color: #1e3a8a; margin-bottom: 4px;">Kandidat Aktif</div>
              <div id="adminActiveCount" style="font-size: 12px; font-weight: 700; color: #1e40af;">Memuat...</div>
            </div>
          </div>
          <div style="padding: 10px 18px; background: linear-gradient(135deg, #3b82f6, #1e40af); color: #fff;
            border-radius: 11px; font-size: 13px; font-weight: 800; white-space: nowrap; flex: 0 0 auto;">Buka →</div>
        </button>

        <button onclick="openResultFilesPage()" style="width: 100%; padding: 20px 22px;
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border: 2px solid #86efac;
          border-radius: 14px; margin-bottom: 16px; cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: space-between; gap: 14px; text-align: left;">
          <div style="display: flex; align-items: center; gap: 14px; min-width: 0;">
            <div style="width: 48px; height: 48px; flex: 0 0 48px; display: grid; place-items: center;
              background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 14px; font-size: 22px;">📄</div>
            <div style="min-width: 0;">
              <div style="font-size: 15px; font-weight: 900; color: #14532d; margin-bottom: 4px;">Hasil Tes Terkirim</div>
              <div id="adminResultCount" style="font-size: 12px; font-weight: 700; color: #15803d;">Memuat...</div>
            </div>
          </div>
          <div style="padding: 10px 18px; background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff;
            border-radius: 11px; font-size: 13px; font-weight: 800; white-space: nowrap; flex: 0 0 auto;">Buka →</div>
        </button>

        <button onclick="openPasswordSettingsPage()" style="width: 100%; padding: 20px 22px;
          background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #fcd34d;
          border-radius: 14px; margin-bottom: 16px; cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: space-between; gap: 14px; text-align: left;">
          <div style="display: flex; align-items: center; gap: 14px; min-width: 0;">
            <div style="width: 48px; height: 48px; flex: 0 0 48px; display: grid; place-items: center;
              background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 14px; font-size: 22px;">🔑</div>
            <div style="min-width: 0;">
              <div style="font-size: 15px; font-weight: 900; color: #78350f; margin-bottom: 4px;">Pengaturan Password</div>
              <div style="font-size: 12px; font-weight: 700; color: #92400e;">
                ${locked ? '🔒 Login sedang dikunci' : '🔓 Kelola FRESH &amp; USED'}</div>
            </div>
          </div>
          <div style="padding: 10px 18px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;
            border-radius: 11px; font-size: 13px; font-weight: 800; white-space: nowrap; flex: 0 0 auto;">Buka →</div>
        </button>

        <div style="padding: 16px 18px; background: #f1f5f9; border-radius: 12px; margin-bottom: 16px;
          font-size: 13px; color: #334155; line-height: 1.9;">
          <div style="font-weight: 800; margin-bottom: 8px; color: #1e293b;">📱 Device ini</div>
          <div><strong>Nama:</strong> ${__adminEscape(identityName)}</div>
          <div><strong>Tes selesai:</strong> ${completedCount}</div>
          <div><strong>Used flag:</strong> ${usedPragas ? '✅ aktif' : '❌ belum'}</div>
          <div><strong>Device finished:</strong> ${deviceFinished ? '🔒 ya' : '🔓 belum'}</div>
        </div>

        ${myDeviceId ? `<div style="margin-bottom: 12px;">
          <button class="js-test-chat" data-device-id="${__adminEscape(myDeviceId)}" data-name="${__adminEscape(identityName)}"
            style="width: 100%; padding: 12px 16px; background: linear-gradient(135deg, #64748b, #334155);
            color: #fff; border: 0; border-radius: 10px; font-family: inherit; font-size: 13px;
            font-weight: 800; cursor: pointer;">🧪 Test Chat (Device Sendiri)</button></div>` : ''}

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button onclick="adminResetThisDevice()" style="flex: 1; min-width: 140px; padding: 12px 16px;
            background: #f59e0b; color: #fff; border: 0; border-radius: 10px; font-family: inherit;
            font-size: 13px; font-weight: 800; cursor: pointer;">🔄 Reset Device</button>
          <button onclick="adminUnlockDevice()" style="flex: 1; min-width: 140px; padding: 12px 16px;
            background: #fff; color: #dc2626; border: 2px solid #fca5a5; border-radius: 10px;
            font-family: inherit; font-size: 13px; font-weight: 800; cursor: pointer;">🔓 Unlock Device</button>
          <button onclick="adminCleanupInactive()" style="flex: 1; min-width: 140px; padding: 12px 16px;
            background: #fff; color: #7c3aed; border: 2px solid #c4b5fd; border-radius: 10px;
            font-family: inherit; font-size: 13px; font-weight: 800; cursor: pointer;">🧹 Bersihkan Chat</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  if (typeof __startAdminIdleTracking === 'function') __startAdminIdleTracking();

  setTimeout(() => {
    const countEl = document.getElementById('adminActiveCount');
    if (!countEl || typeof window.listenActiveSessions !== 'function') return;

    window.listenActiveSessions((sessions) => {
      if (countEl) {
        countEl.textContent = sessions.length + ' kandidat';
        countEl.style.color = sessions.length > 0 ? '#1e40af' : '#94a3b8';
      }
    });

    if (typeof startAdminUnreadTracker === 'function') startAdminUnreadTracker();
    if (typeof startAdminTimerTick === 'function') startAdminTimerTick();
    if (typeof __updateAdminResultCounter === 'function') __updateAdminResultCounter();

    /* 🆕 Auto-refresh 10 detik */
    if (window.__pdfAutoRefreshTimer) clearInterval(window.__pdfAutoRefreshTimer);
    window.__pdfAutoRefreshTimer = setInterval(() => {
      if (!document.getElementById('adminPanelOverlay')) return;
      if (document.getElementById('adminResultCount')) __updateAdminResultCounter();
      if (document.getElementById('resultFilesPageOverlay')) {
        __invalidateResultCache();
        fetchResultFiles(true).then(files => {
          window.__resultFilesCache = files;
          __renderResultPageContent();
        }).catch(() => {});
      }
    }, 10000);

    /* 🆕 REAL-TIME SIGNAL LISTENER */
    if (typeof startSignalListeners === 'function') startSignalListeners();

    if (CHAT_CLEANUP_ENABLED && typeof cleanupInactiveChatRooms === 'function') {
      setTimeout(() => {
        cleanupInactiveChatRooms({ silent: true }).then(r => {
          if (r.removed > 0) console.log('[AUTO-CLEANUP] 🧹 ' + r.removed + ' chat lama dibersihkan');
        });
      }, 500);
    }

    if (typeof listenAccessRequests === 'function') {
      const reqContainer = document.getElementById('adminAccessRequests');
      const reqCountEl = document.getElementById('adminRequestCount');
      listenAccessRequests((requests) => {
        if (reqCountEl) {
          reqCountEl.textContent = requests.length + ' request';
          reqCountEl.style.color = requests.length > 0 ? '#92400e' : '#94a3b8';
          reqCountEl.style.animation = requests.length > 0 ? 'adminPulseDot 1.4s ease-in-out infinite' : '';
        }
        if (reqContainer) reqContainer.innerHTML = renderAccessRequestsHTML(requests);
      });
    }
  }, 200);

  const closeBtn = document.getElementById('btnAdminClose');
  if (closeBtn) {
    closeBtn.onclick = () => {
      if (typeof window.stopListeningActiveSessions === 'function') { try { window.stopListeningActiveSessions(); } catch (e) {} }
      if (typeof stopAdminUnreadTracker === 'function') { try { stopAdminUnreadTracker(); } catch (e) {} }
      if (typeof stopAdminTimerTick === 'function') { try { stopAdminTimerTick(); } catch (e) {} }
      if (typeof stopResultsRealtimeListener === 'function') { try { stopResultsRealtimeListener(); } catch (e) {} }
      /* 🆕 Stop signal listeners */
      if (typeof stopSignalListeners === 'function') { try { stopSignalListeners(); } catch (e) {} }

      overlay.remove();
      if (typeof stopListeningAccessRequests === 'function') { try { stopListeningAccessRequests(); } catch (e) {} }
      if (window.__pdfAutoRefreshTimer) { clearInterval(window.__pdfAutoRefreshTimer); window.__pdfAutoRefreshTimer = null; }
      const toastContainer = document.getElementById('sgsResultToastContainer');
      if (toastContainer) toastContainer.remove();
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('admin');
        url.hash = '';
        window.history.replaceState({}, '', url.pathname + (url.search || ''));
      } catch (e) {}
    };
  }

  const logoutBtn = document.getElementById('btnAdminLogout');
  if (logoutBtn) logoutBtn.onclick = () => adminLogout();

  document.addEventListener('keydown', function adminEsc(e) {
    if (e.key === 'Escape') {
      closeBtn && closeBtn.click();
      document.removeEventListener('keydown', adminEsc);
    }
  }, { once: true });
}

/* ============================================================
   CEK URL ADMIN
   ============================================================ */
async function checkAdminUrlAndRender() {
  if (!isAdminUrl()) return false;

  const loading = document.createElement('div');
  loading.id = 'adminAuthLoading';
  loading.style.cssText = `position: fixed; inset: 0; z-index: 99999;
    background: rgba(10,20,35,0.95); display: flex; align-items: center; justify-content: center;
    color: #fff; font-family: Inter, system-ui, sans-serif; font-size: 15px; font-weight: 700;`;
  loading.innerHTML = '⏳ Memverifikasi akses admin...';
  document.body.appendChild(loading);

  const keyOk = await verifyAdminKeyFromUrl();
  if (!keyOk) {
    loading.remove();
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      url.hash = '';
      window.history.replaceState({}, '', url.pathname + (url.search || ''));
    } catch (e) {}
    if (typeof window.__reinitApp === 'function') window.__reinitApp();
    else window.location.reload();
    return true;
  }

  let resolved = false;
  const timeout = setTimeout(() => {
    if (resolved) return;
    resolved = true;
    loading.remove();
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    renderAdminLoginPrompt();
  }, 3000);

  const unsubscribe = firebase.auth().onAuthStateChanged(user => {
    if (resolved) return;
    resolved = true;
    clearTimeout(timeout);
    if (unsubscribe) unsubscribe();
    loading.remove();

    if (!user) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      renderAdminLoginPrompt();
      return;
    }

    firebase.database().ref('admins/' + user.uid).once('value')
      .then(snap => {
        if (snap.exists() && snap.val() === true) {
          sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
          renderAdminPanel();
        } else {
          firebase.auth().signOut();
          sessionStorage.removeItem(ADMIN_SESSION_KEY);
          renderAdminLoginPrompt();
        }
      })
      .catch(() => {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        renderAdminLoginPrompt();
      });
  });

  return true;
}

/* ============================================================
   EVENT DELEGATION
   ============================================================ */
(function attachAdminEventDelegation() {
  if (window.__adminEventDelegationAttached) return;
  window.__adminEventDelegationAttached = true;

  document.addEventListener('click', function(e) {
    const deleteBtn = e.target.closest('.js-delete-file');
    if (deleteBtn) {
      e.preventDefault(); e.stopPropagation();
      const fileId = deleteBtn.getAttribute('data-file-id');
      const fileName = deleteBtn.getAttribute('data-file-name');
      if (fileId && typeof deleteResultFile === 'function') deleteResultFile(fileId, fileName);
      return;
    }

    const copyBtn = e.target.closest('.js-copy-pdf-password');
    if (copyBtn) {
      e.preventDefault(); e.stopPropagation();
      const password = copyBtn.getAttribute('data-password');
      if (password) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(password).then(() => {
            const prev = copyBtn.textContent;
            copyBtn.textContent = '✓';
            setTimeout(() => { copyBtn.textContent = prev; }, 1000);
          }).catch(() => fallbackCopy(password));
        } else fallbackCopy(password);
      }
      return;
    }

    const approveBtn = e.target.closest('.js-approve-request');
    if (approveBtn) {
      e.preventDefault(); e.stopPropagation();
      const deviceId = approveBtn.getAttribute('data-device-id');
      const name = approveBtn.getAttribute('data-name');
      if (deviceId && typeof approveAccessRequest === 'function') approveAccessRequest(deviceId, name);
      return;
    }

    const rejectBtn = e.target.closest('.js-reject-request');
    if (rejectBtn) {
      e.preventDefault(); e.stopPropagation();
      const deviceId = rejectBtn.getAttribute('data-device-id');
      if (deviceId && typeof rejectAccessRequest === 'function') rejectAccessRequest(deviceId);
      return;
    }

    const testChatBtn = e.target.closest('.js-test-chat');
    if (testChatBtn) {
      e.preventDefault(); e.stopPropagation();
      const deviceId = testChatBtn.getAttribute('data-device-id');
      const name = testChatBtn.getAttribute('data-name');
      if (deviceId && typeof window.openChatForAdmin === 'function') window.openChatForAdmin(deviceId, name);
      return;
    }
  }, true);
})();

/* ============================================================
   EXPORT
   ============================================================ */
window.isAdminUrl = isAdminUrl;
window.verifyAdminKeyFromUrl = verifyAdminKeyFromUrl;
window.renderAdminPanel = renderAdminPanel;
window.renderAdminLoginPrompt = renderAdminLoginPrompt;
window.checkAdminUrlAndRender = checkAdminUrlAndRender;
window.copyToClipboard = copyToClipboard;
window.adminResetThisDevice = adminResetThisDevice;
window.adminUnlockDevice = adminUnlockDevice;
window.adminAllowRetake = adminAllowRetake;
window.adminCleanupInactive = adminCleanupInactive;
window.adminLogout = adminLogout;
window.startAdminUnreadTracker = startAdminUnreadTracker;
window.stopAdminUnreadTracker = stopAdminUnreadTracker;
window.cleanupInactiveChatRooms = cleanupInactiveChatRooms;
window.startAdminTimerTick = startAdminTimerTick;
window.stopAdminTimerTick = stopAdminTimerTick;
window.fetchResultFiles = fetchResultFiles;
window.renderResultFilesHTML = renderResultFilesHTML;
window.refreshResultFilesList = refreshResultFilesList;
window.deleteResultFile = deleteResultFile;
window.__extractCandidateInfo = __extractCandidateInfo;
window.__detectFileKind = __detectFileKind;
window.openResultFilesPage = openResultFilesPage;
window.closeResultFilesPage = closeResultFilesPage;
window.loadResultFilesForPage = loadResultFilesForPage;
window.__setResultFilter = __setResultFilter;
window.__resetResultFilter = __resetResultFilter;
window.__updateAdminResultCounter = __updateAdminResultCounter;
window.__invalidateResultCache = __invalidateResultCache;
window.__removeFileFromCache = __removeFileFromCache;
window.__recentlyDeletedFileIds = window.__recentlyDeletedFileIds;
window.listenAccessRequests = listenAccessRequests;
window.stopListeningAccessRequests = stopListeningAccessRequests;
window.approveAccessRequest = approveAccessRequest;
window.rejectAccessRequest = rejectAccessRequest;
window.renderAccessRequestsHTML = renderAccessRequestsHTML;
window.startResultsRealtimeListener = startResultsRealtimeListener;
window.stopResultsRealtimeListener = stopResultsRealtimeListener;
window.showResultToast = showResultToast;
window.startSignalListeners = startSignalListeners;
window.stopSignalListeners = stopSignalListeners;

/* ============================================================
   SESSION TIMEOUT
   ============================================================ */
const ADMIN_SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const ADMIN_WARNING_BEFORE_MS  = 60 * 1000;

var __adminIdleTimer    = null;
var __adminWarningTimer = null;
var __adminWarningShown = false;

function __resetAdminIdleTimer() {
  if (typeof isAdminUrl !== 'function' || !isAdminUrl()) return;
  const panel = document.getElementById('adminPanelOverlay');
  if (!panel) return;
  clearTimeout(__adminIdleTimer);
  clearTimeout(__adminWarningTimer);
  const warn = document.getElementById('adminIdleWarning');
  if (warn) warn.remove();
  __adminWarningShown = false;
  __adminWarningTimer = setTimeout(() => {
    if (__adminWarningShown) return;
    __adminWarningShown = true;
    __showAdminIdleWarning();
  }, ADMIN_SESSION_TIMEOUT_MS - ADMIN_WARNING_BEFORE_MS);
  __adminIdleTimer = setTimeout(async () => {
    if (typeof adminLogout === 'function') {
      const panel = document.getElementById('adminPanelOverlay');
      if (panel) {
        const warn = document.getElementById('adminIdleWarning');
        if (warn) warn.remove();
        await __alert('Sesi admin berakhir karena tidak ada aktivitas 15 menit.', '🔒 Sesi Berakhir');
        try { adminLogout(true); } catch (e) {}
      }
    }
  }, ADMIN_SESSION_TIMEOUT_MS);
}

function __showAdminIdleWarning() {
  const old = document.getElementById('adminIdleWarning');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'adminIdleWarning';
  overlay.style.cssText = `position: fixed; inset: 0; z-index: 2147483646;
    background: rgba(10,20,35,.85); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
    font-family: Inter, system-ui, -apple-system, sans-serif;`;
  overlay.innerHTML = `
    <div style="width: min(440px, 100%); background: #fff; border-radius: 22px;
      padding: 32px 28px 28px; box-shadow: 0 30px 90px rgba(0,0,0,.5); text-align: center;">
      <div style="font-size: 52px; margin-bottom: 14px;">⏰</div>
      <h2 style="margin: 0 0 12px; color: #b45309; font-size: 22px; font-weight: 900;">Sesi Hampir Berakhir</h2>
      <p style="color: #475569; font-size: 14.5px; line-height: 1.65; margin: 0 0 22px;">
        Anda tidak ada aktivitas selama 14 menit.<br>Sesi akan otomatis berakhir dalam <b>1 menit</b>.</p>
      <button id="btnAdminStay" style="width: 100%; padding: 14px;
        background: linear-gradient(135deg, #16a34a, #059669); color: #fff; border: 0; border-radius: 12px;
        font-size: 15px; font-weight: 800; cursor: pointer; font-family: inherit;">✅ Saya Masih di Sini</button>
      <button id="btnAdminLogoutNow" style="width: 100%; padding: 12px; margin-top: 10px;
        background: #f1f5f9; color: #475569; border: 0; border-radius: 12px;
        font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit;">🚪 Logout Sekarang</button>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('btnAdminStay').onclick = () => {
    overlay.remove();
    __adminWarningShown = false;
    __resetAdminIdleTimer();
  };
  document.getElementById('btnAdminLogoutNow').onclick = () => {
    overlay.remove();
    if (typeof adminLogout === 'function') { try { adminLogout(true); } catch (e) {} }
  };
}

function __startAdminIdleTracking() {
  if (typeof isAdminUrl !== 'function' || !isAdminUrl()) return;
  if (window.__adminIdleListenersAttached) return;
  window.__adminIdleListenersAttached = true;
  const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'click', 'scroll'];
  events.forEach(evt => document.addEventListener(evt, __resetAdminIdleTimer, { passive: true }));
  __resetAdminIdleTimer();
  console.log('[ADMIN] ⏰ Session timeout aktif (15 menit idle)');
}

function __stopAdminIdleTracking() {
  clearTimeout(__adminIdleTimer);
  clearTimeout(__adminWarningTimer);
  __adminIdleTimer = null;
  __adminWarningTimer = null;
  window.__adminIdleListenersAttached = false;
  const warn = document.getElementById('adminIdleWarning');
  if (warn) warn.remove();
}

window.__resetAdminIdleTimer = __resetAdminIdleTimer;
window.__startAdminIdleTracking = __startAdminIdleTracking;
window.__stopAdminIdleTracking = __stopAdminIdleTracking;

console.log('[ADMIN] ✓ Loaded — SECURED + REAL-TIME SIGNAL');
