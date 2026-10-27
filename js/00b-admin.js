/* ============================================================
   js/00b-admin.js — SECURED + REAL-TIME SIGNAL
   ------------------------------------------------------------
   ✅ [2026-10-27] POSITION GATING FINAL:
   - Grafis untuk semua posisi.
   - FGD & Subjek hanya untuk Guru/Dosen.
   - Excel & Typing hanya untuk Admin/Staff (non-Guru, non-Tech).
   - Teknis hanya untuk Technical/Welder/HK/IT.
   - Pengumuman dipindah ke bawah (full-width).
   - Cleanup FGD defensive jika terinjeksi script lain.
   ============================================================ */

const ADMIN_SESSION_KEY = '_sgs_admin_logged_in';
const ADMIN_KEY_OK_KEY  = '_sgs_admin_key_ok';

const GAS_ADMIN_URL =
  'https://script.google.com/macros/s/AKfycbzsdy_aGU5vN6mrkXvNbKBO4nHym6xIGhDNT0u_Urz3qQ2w3jFjwMzjfv0ipQxmqyBG/exec';

const CHAT_CLEANUP_ENABLED        = true;
const CHAT_CLEANUP_AGE_MS         = 60 * 60 * 1000;
const CHAT_CLEANUP_DELETE_SESSION = true;

const RESULT_CACHE_TTL_MS         = 10000;
const RECENTLY_DELETED_TTL_MS     = 10000;
const DRIVE_PROPAGATION_DELAY_MS  = 2000;

const REQUEST_CLEANUP_APPROVED_MS = 5 * 60 * 1000;
const REQUEST_CLEANUP_REJECTED_MS = 1 * 60 * 1000;

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
  copyTextSafe(text).then(result => {
    if (result === true || result === null) done();
  }).catch(() => done());
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = String(text || '');
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:none;outline:none;box-shadow:none;background:transparent;opacity:0.01;z-index:2147483647;';
    document.body.appendChild(ta);

    const activeEl = document.activeElement;
    const selection = window.getSelection();
    const savedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    try { window.focus(); } catch (e) {}
    ta.focus();
    ta.select();
    try { ta.setSelectionRange(0, text.length); } catch (e) {}

    let success = false;
    try { success = document.execCommand('copy'); } catch (e) {}

    document.body.removeChild(ta);

    try {
      if (activeEl && typeof activeEl.focus === 'function') activeEl.focus();
    } catch (e) {}
    try {
      if (savedRange && selection) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }
    } catch (e) {}

    return success;
  } catch (e) {
    return false;
  }
}

/* ============================================================
   COPY SAFE — coba clipboard API → execCommand → manual dialog
   ============================================================ */
async function copyTextSafe(text, opts) {
  opts = opts || {};
  const value = String(text || '');
  if (!value) return false;

  /* 1) Coba modern clipboard API */
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { window.focus(); } catch (e) {}
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (e) {
    console.log('[COPY] clipboard.writeText gagal:', e.name, '—', e.message);
  }

  /* 2) Coba fallback execCommand */
  const ok = fallbackCopy(value);
  if (ok) return true;

  /* 3) Last resort: manual dialog */
  showManualCopyDialog(value, opts.title || 'Copy Manual');
  return null;
}

function showManualCopyDialog(text, title) {
  const old = document.getElementById('manualCopyModal');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'manualCopyModal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

  overlay.innerHTML = `
    <div style="width:min(520px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.4);border-radius:18px;padding:24px;color:#e2e8f0;box-shadow:0 30px 90px rgba(0,0,0,.7);">
      <div style="font-size:11px;font-weight:900;letter-spacing:2px;color:#a5b4fc;margin-bottom:8px;">📋 COPY MANUAL</div>
      <div style="font-size:15px;font-weight:900;color:#fff;margin-bottom:6px;">${__adminEscape(title || 'Copy Manual')}</div>
      <div style="font-size:11.5px;color:#94a3b8;line-height:1.6;margin-bottom:14px;">
        Browser menolak copy otomatis (document tidak fokus). Silakan <b>klik teks di bawah</b> lalu tekan <b>Ctrl+C</b> (Windows) atau <b>Cmd+C</b> (Mac).
      </div>
      <textarea id="manualCopyText" readonly
        style="width:100%;padding:14px;background:rgba(0,0,0,.4);border:1.5px solid rgba(99,102,241,.4);border-radius:10px;color:#fff;font-family:'Courier New',monospace;font-size:13px;font-weight:800;letter-spacing:.5px;box-sizing:border-box;resize:none;min-height:80px;outline:none;">${__adminEscape(text)}</textarea>
      <div style="display:flex;gap:8px;margin-top:14px;">
        <button id="manualCopyClose" style="flex:1;padding:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Tutup</button>
        <button id="manualCopySelect" style="flex:2;padding:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;border-radius:10px;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">📋 Pilih Semua & Copy</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const ta = overlay.querySelector('#manualCopyText');
  setTimeout(() => {
    try { ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); } catch (e) {}
  }, 100);

  overlay.querySelector('#manualCopyClose').onclick = () => overlay.remove();
  overlay.querySelector('#manualCopySelect').onclick = () => {
    try { ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); } catch (e) {}
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    const btn = overlay.querySelector('#manualCopySelect');
    btn.textContent = ok ? '✓ Ter-copy' : '⚠️ Ctrl+C manual';
    setTimeout(() => { btn.textContent = '📋 Pilih Semua & Copy'; }, 1600);
  };

  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
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
   HELPER: Normalize candidate key
   ============================================================ */
function __normalizeCandidateKey(name) {
  return String(name || 'tanpa-nama').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'tanpa-nama';
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
   REAL-TIME SIGNAL LISTENER
   ============================================================ */
let __lastUploadTs = null;
let __lastDeleteTs = null;
let __uploadSignalRef = null;
let __deleteSignalRef = null;

function startSignalListeners() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  if (__uploadSignalRef) return;

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

    console.log('[REALTIME] 📥 Upload baru:', data.type, 'dari', data.name);

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

    console.log('[REALTIME] 🗑️ Delete terjadi');
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
   REAL-TIME RESULT LISTENER (legacy)
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

/* ============================================================
   Sinkronisasi delete file Drive → Firebase
   ============================================================ */
function __slugifyName(name) {
  return String(name || 'tanpa-nama').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'tanpa-nama';
}

function __syncDeleteToFirebase(fileName, fileId) {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  const n = String(fileName || '');
  if (!n) return;

  console.log('[ADMIN] 🔄 Sync delete ke Firebase:', n);

  let m = n.match(/^(.+)-Wawancara-COMBINED\.pdf$/i);
  if (m) {
    const slug = __slugifyName(m[1]);
    firebase.database().ref('sgs_interviews/' + slug).remove()
      .then(() => console.log('[ADMIN] 🧹 Firebase: sgs_interviews/' + slug + ' (combined) dihapus'))
      .catch(e => console.warn('[ADMIN] Gagal hapus combined:', e.message));
    return;
  }

  m = n.match(/^(.+)-Wawancara-([A-Z0-9]+)\.pdf$/i);
  if (m) {
    const slug = __slugifyName(m[1]);
    const interviewer = m[2].toUpperCase();
    firebase.database().ref('sgs_interviews/' + slug + '/' + interviewer).remove()
      .then(() => console.log('[ADMIN] 🧹 Firebase: sgs_interviews/' + slug + '/' + interviewer + ' dihapus'))
      .catch(e => console.warn('[ADMIN] Gagal hapus individual:', e.message));
    return;
  }

  m = n.match(/^(.+)-Grafis-([A-Z0-9]+)\.pdf$/i);
  if (m) {
    const slug = __slugifyName(m[1]);
    const assessor = m[2].toUpperCase();
    firebase.database().ref('sgs_grafis_interp/' + slug + '/' + assessor).remove()
      .then(() => console.log('[ADMIN] 🧹 Firebase: sgs_grafis_interp/' + slug + '/' + assessor + ' dihapus'))
      .catch(e => console.warn('[ADMIN] Gagal hapus grafis:', e.message));
    return;
  }

  console.log('[ADMIN] File tidak ada mapping ke Firebase:', n);
}

/* ============================================================
   CASCADE DELETE WAWANCARA
   ============================================================ */
function __isWawancaraFile(name) {
  return /-Wawancara-(?:COMBINED|[A-Z0-9]+)\.pdf$/i.test(String(name || ''));
}

function __extractWawancaraBase(name) {
  const n = String(name || '');
  const m1 = n.match(/^\[([^\]]+)\]/);
  if (m1) return m1[1].replace(/-/g, ' ').trim();
  const m2 = n.match(/^(.+?)-Wawancara-(?:COMBINED|[A-Z0-9]+)\.pdf$/i);
  return m2 ? m2[1].trim() : null;
}

async function __cascadeDeleteWawancara(baseName, keepFileId) {
  if (!baseName) return;
  keepFileId = keepFileId || null;

  console.log('[ADMIN] 🔄 Cascade delete wawancara untuk:', baseName);

  const slug = __slugifyName(baseName);
  try {
    await firebase.database().ref('sgs_interviews/' + slug).remove();
    console.log('[ADMIN] 🧹 Firebase dihapus: sgs_interviews/' + slug);
  } catch (e) {
    console.warn('[ADMIN] Gagal hapus Firebase:', e.message);
  }

  const allFiles = Array.isArray(window.__resultFilesCache) ? window.__resultFilesCache : [];
  const siblings = allFiles.filter(f =>
    f.id !== keepFileId &&
    __isWawancaraFile(f.name) &&
    __extractWawancaraBase(f.name) === baseName
  );

  if (siblings.length === 0) {
    console.log('[ADMIN] Tidak ada file wawancara lain untuk dihapus');
    return;
  }

  const idToken = await __getFirebaseIdToken();
  if (!idToken) {
    console.warn('[ADMIN] Tidak ada ID token, skip hapus file Drive');
    return;
  }

  let deletedCount = 0;
  for (const f of siblings) {
    try {
      const res = await fetch(GAS_ADMIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', fileId: f.id, idToken })
      });
      if (res.ok) {
        window.__recentlyDeletedFileIds.add(f.id);
        __removeFileFromCache(f.id);
        console.log('[ADMIN] 🗑️ Cascade hapus:', f.name);
        deletedCount++;
      }
    } catch (e) {
      console.warn('[ADMIN] Gagal hapus cascade:', f.name, e.message);
    }
  }
  console.log('[ADMIN] ✅ Cascade selesai —', deletedCount, 'file tambahan dihapus');
}

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
   fetchResultFiles
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

    for (let attempt = 1; attempt <= maxRetry; attempt++) {
      try {
        const url = GAS_ADMIN_URL + '?action=list&_t=' + Date.now() + '_' + attempt;
        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();

        if (text.trim().startsWith('<')) throw new Error('Respon HTML, bukan JSON');

        const data = JSON.parse(text);

        if (data && data.success) {
          const allFiles = data.files || [];
          const filtered = allFiles.filter(f => {
            if (window.__recentlyDeletedFileIds.has(f.id)) return false;
            const n = String(f.name || '');
            if (n.startsWith('SubjectNote-') || n === '-' || n === '') return false;
            return true;
          });

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
        if (attempt === maxRetry) {
          console.warn(`[PDF-LIST] Attempt ${attempt}/${maxRetry} gagal:`, e.message);
        } else {
          console.log(`[PDF-LIST] Retry ${attempt}/${maxRetry}...`);
        }

        if (attempt < maxRetry) {
          await new Promise(r => setTimeout(r, 800));
        }
      }
    }

    console.warn('[PDF-LIST] Semua retry gagal, pakai cache lama');
    return window.__resultFilesCacheData || [];
  })();

  try {
    return await window.__resultFilesFetchPromise;
  } finally {
    window.__resultFilesFetchPromise = null;
  }
}

function __invalidateResultCache() {
  window.__resultFilesCacheData = null;
  window.__resultFilesCacheTime = 0;
  window.__resultFilesFetchPromise = null;
}

/* ============================================================
   deleteResultFile
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

  try {
    await fetch(GAS_ADMIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'delete', fileId: fileId, idToken: idToken })
    });
  } catch (e) {
    console.warn('[DELETE] Fetch error (mungkin CORS):', e.message);
  }

  window.__recentlyDeletedFileIds.add(fileId);
  setTimeout(() => window.__recentlyDeletedFileIds.delete(fileId), RECENTLY_DELETED_TTL_MS);
  __removeFileFromCache(fileId);

  if (__isWawancaraFile(fileName)) {
    const base = __extractWawancaraBase(fileName);
    if (base) {
      try { await __cascadeDeleteWawancara(base, fileId); }
      catch (e) { console.warn('[ADMIN] Cascade error:', e.message); }
    }
  }

  if (document.getElementById('resultFilesPageOverlay')) __renderResultPageContent();
  if (typeof __updateAdminResultCounter === 'function') __updateAdminResultCounter();

  try {
    firebase.database().ref('sgs_state/lastDelete').set({
      ts: firebase.database.ServerValue.TIMESTAMP,
      fileId: fileId
    }).catch(() => {});
  } catch (e) {}

  await __alert('File dihapus dari Drive', '✅ Sukses');

  await new Promise(r => setTimeout(r, 2500));

  __invalidateResultCache();
  try {
    const files = await fetchResultFiles(true);
    window.__resultFilesCache = files;
    if (document.getElementById('resultFilesPageOverlay')) __renderResultPageContent();
    if (typeof __updateAdminResultCounter === 'function') __updateAdminResultCounter();
  } catch (err) {
    console.warn('[DELETE] Refresh gagal:', err.message);
  }
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
    const fileName = String(file.name);
    let m;

    m = fileName.match(/^\[([^\]]+)\]-/);
    if (m) {
      name = m[1].replace(/-/g, ' ').trim();
    }

    if (name === '-' || !name) {
      m = fileName.match(/^(.+?)-(?:Psikotes-SGSchools|Excel-\d{4}-\d{2}-\d{2}|Wawancara-(?:COMBINED|[A-Z0-9]+)|Grafis-[A-Z0-9]+|FGD-[A-Z0-9]+)/i);
      if (m) name = m[1].replace(/-/g, ' ').trim();
    }
  }
  return { name, position, password };
}

function __detectFileKind(file) {
  const n = String(file.name || '').toLowerCase();
  if (/^subjectnote-/i.test(n)) return 'subjectnote';
  if (/-wawancara-combined\.pdf$/i.test(n)) return 'wawancara-combined';
  if (/-wawancara-/.test(n))  return 'wawancara';
  if (/-fgd-combined\.pdf$/i.test(n)) return 'fgd-combined';
  if (/-fgd-/.test(n))        return 'fgd';
  if (/-grafis-/.test(n))     return 'grafis';
  if (/\.pdf$/.test(n))       return 'pdf';
  if (/\.xlsx?$/.test(n))     return 'excel';
  if (/\.(csv|ods)$/.test(n)) return 'excel';
  return 'other';
}

function __extractInterviewer(file) {
  const n = String(file.name || '');
  const m = n.match(/-Wawancara-([A-Z0-9]+)\.pdf$/i);
  return m ? m[1].toUpperCase() : '?';
}

function __extractAssessorGrafis(file) {
  const n = String(file.name || '');
  const m = n.match(/-Grafis-([A-Z0-9]+)\.pdf$/i);
  return m ? m[1].toUpperCase() : '?';
}

/* ============================================================
   🆕 Wawancara Stats — rata-rata & kesimpulan per pewawancara
   ============================================================ */
async function __fetchInterviewStats(slug) {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return null;
  try {
    const snap = await firebase.database().ref('sgs_interviews/' + slug).once('value');
    const data = snap.val();
    if (!data || typeof data !== 'object') return null;

    const interviewers = Object.keys(data).filter(k => {
      const d = data[k];
      return d && typeof d.average === 'number';
    });
    if (interviewers.length === 0) return null;

    let sum = 0;
    const perInterviewer = [];
    interviewers.forEach(iv => {
      const d = data[iv] || {};
      const avg = Number(d.average) || 0;
      sum += avg;
      perInterviewer.push({
        name: iv,
        average: avg,
        conclusion: d.conclusion || '-'
      });
    });

    return {
      count: interviewers.length,
      overallAverage: sum / interviewers.length,
      perInterviewer: perInterviewer.sort((a, b) => (b.average || 0) - (a.average || 0))
    };
  } catch (e) {
    console.warn('[INTERVIEW-STATS] Fetch gagal:', e.message);
    return null;
  }
}

function __conclusionChipStyle(conclusion) {
  const c = String(conclusion || '').toUpperCase();
  if (c.includes('HIGHLY')) return { bg: 'rgba(34,197,94,.2)',   br: 'rgba(34,197,94,.55)',  tx: '#86efac', short: '🌟 Highly' };
  if (c.includes('NOT'))    return { bg: 'rgba(239,68,68,.18)',  br: 'rgba(239,68,68,.5)',   tx: '#fca5a5', short: '❌ Not Rec' };
  if (c.includes('FAIRLY')) return { bg: 'rgba(245,158,11,.18)', br: 'rgba(245,158,11,.5)',  tx: '#fcd34d', short: '⚠️ Fairly' };
  return                          { bg: 'rgba(34,197,94,.15)',  br: 'rgba(34,197,94,.45)',  tx: '#86efac', short: '✅ Rec' };
}

function __renderInterviewStatsHTML(stats) {
  if (!stats) return '';

  const rowsHTML = stats.perInterviewer.map(p => {
    const chip = __conclusionChipStyle(p.conclusion);
    return `
      <div style="display: flex; align-items: center; gap: 8px; padding: 6px 10px;
        background: rgba(250,204,21,.05); border: 1px solid rgba(250,204,21,.2);
        border-radius: 7px; margin-top: 4px;">
        <div style="width: 26px; height: 26px; flex: 0 0 26px; display: grid; place-items: center;
          background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;
          border-radius: 6px; font-size: 9px; font-weight: 900;">
          ${__adminEscape(String(p.name).slice(0, 3).toUpperCase())}
        </div>
        <div style="flex: 1; min-width: 0; font-size: 11px; font-weight: 800; color: #fde047;">
          ${__adminEscape(p.name)}
        </div>
        <div style="font-size: 12px; font-weight: 900; color: #fbbf24; font-variant-numeric: tabular-nums;">
          ${p.average.toFixed(2)}
        </div>
        <span style="padding: 2px 8px; border-radius: 999px; font-size: 9.5px;
          font-weight: 800; background: ${chip.bg}; border: 1px solid ${chip.br}; color: ${chip.tx};
          white-space: nowrap;">
          ${chip.short}
        </span>
      </div>`;
  }).join('');

  return `
    <div style="margin-top: 10px; padding: 10px 12px;
      background: rgba(250,204,21,.08); border: 1px solid rgba(250,204,21,.3);
      border-radius: 10px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
        <div style="font-size: 10.5px; font-weight: 900; color: #fde047; letter-spacing: .5px;">
          ⭐ RATA-RATA KESELURUHAN
        </div>
        <div style="padding: 3px 10px; background: rgba(34,197,94,.15);
          border: 1px solid rgba(34,197,94,.45); border-radius: 999px;
          font-size: 13px; font-weight: 900; color: #86efac; font-variant-numeric: tabular-nums;">
          ${stats.overallAverage.toFixed(2)} / 5.00
        </div>
      </div>
      <div style="font-size: 10px; color: #94a3b8; font-weight: 600; margin-bottom: 4px;">
        Dari ${stats.count} pewawancara:
      </div>
      ${rowsHTML}
    </div>`;
}

/* ============================================================
   Render box Wawancara
   ============================================================ */
function __renderWawancaraBox(files) {
  if (!Array.isArray(files) || files.length === 0) return '';

  const combined = files.filter(f => /-wawancara-combined\.pdf$/i.test(f.name || ''));
  const individual = files.filter(f => !/-wawancara-combined\.pdf$/i.test(f.name || ''));

  if (combined.length > 0) {
    return __renderWawancaraCombinedBox(combined, individual);
  }
  return __renderWawancaraIndividualBox(files);
}

function __renderWawancaraCombinedBox(combinedFiles, individualFiles) {
  const file = combinedFiles[0];
  const safeUrl = __safeUrl(file.url);
  const sizeMB = file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : '-';
  const individualCount = individualFiles.length;

  const assessors = individualFiles.map(f => __extractInterviewer(f)).filter(x => x !== '?');
  const uniqueList = [...new Set(assessors)].join(', ') || '(semua)';

  return `
    <div style="padding: 12px 14px;
      background: linear-gradient(135deg, rgba(250,204,21,.12), rgba(245,158,11,.08));
      border: 1.5px solid rgba(250,204,21,.5);
      border-radius: 11px;
      box-shadow: 0 0 0 1px rgba(250,204,21,.15), 0 0 20px rgba(250,204,21,.2);">

      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
        <div style="width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border-radius: 9px; font-size: 16px;">🎤</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 800; color: #fde047; font-size: 12px; margin-bottom: 2px;">
            Hasil Wawancara Gabungan
          </div>
          <div style="color: #94a3b8; font-size: 10.5px;">
            Gabungan dari <b style="color: #fde047;">${individualCount} pewawancara</b>: ${__adminEscape(uniqueList)}
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 8px; padding: 10px 12px;
        background: rgba(0,0,0,.3); border: 1px solid rgba(250,204,21,.3); border-radius: 8px;">
        <div style="width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border-radius: 9px; font-size: 16px;">📄</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 800; color: #fde047; font-size: 11.5px; margin-bottom: 2px;">
            📄 Laporan Lengkap (Combined)
          </div>
          <div style="color: #64748b; font-size: 10px; word-break: break-all;">
            ${__adminEscape((file.name || '').slice(0, 50))} · ${sizeMB}
          </div>
        </div>
        <div style="display: flex; gap: 6px; flex: 0 0 auto;">
          <a href="${safeUrl}" target="_blank" rel="noopener" class="rf-btn rf-btn-primary"
             style="background: linear-gradient(135deg,#f59e0b,#d97706);">⬇ Buka</a>
          <button class="js-delete-file rf-btn rf-btn-danger"
            data-file-id="${__adminEscape(file.id)}"
            data-file-name="${__adminEscape(file.name)}">🗑</button>
        </div>
      </div>

      ${individualCount > 0 ? `
        <details style="margin-top: 10px;">
          <summary style="cursor: pointer; color: #94a3b8; font-size: 10.5px;
            padding: 6px 8px; border-radius: 6px; background: rgba(0,0,0,.2); user-select: none;">
            ▸ Lihat ${individualCount} file individual per pewawancara
          </summary>
          <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
            ${individualFiles.map(f => {
              const iv = __extractInterviewer(f);
              const fUrl = __safeUrl(f.url);
              const fSize = f.size ? (f.size / 1024 / 1024).toFixed(2) + ' MB' : '-';
              return `
                <div style="display: flex; align-items: center; gap: 8px;
                  padding: 6px 10px; background: rgba(0,0,0,.2);
                  border: 1px solid rgba(250,204,21,.15); border-radius: 6px;">
                  <div style="width: 24px; height: 24px; flex: 0 0 24px; display: grid; place-items: center;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    border-radius: 6px; font-size: 9px; font-weight: 900; color: #fff;">
                    ${__adminEscape(iv.slice(0, 3))}
                  </div>
                  <div style="flex: 1; min-width: 0; font-size: 10.5px; color: #cbd5e1;">
                    <b>${__adminEscape(iv)}</b> · ${fSize}
                  </div>
                  <a href="${fUrl}" target="_blank" rel="noopener"
                     style="padding: 4px 8px; background: rgba(245,158,11,.3); color: #fde047;
                     border-radius: 5px; font-size: 9.5px; text-decoration: none; font-weight: 800;">⬇</a>
                  <button class="js-delete-file"
                    data-file-id="${__adminEscape(f.id)}"
                    data-file-name="${__adminEscape(f.name)}"
                    style="padding: 4px 8px; background: rgba(239,68,68,.15); color: #fca5a5;
                    border: 1px solid rgba(239,68,68,.3); border-radius: 5px; font-size: 9.5px;
                    font-weight: 800; cursor: pointer; font-family: inherit;">🗑</button>
                </div>
              `;
            }).join('')}
          </div>
        </details>
      ` : ''}
    </div>
  `;
}

function __renderWawancaraIndividualBox(files) {
  if (!Array.isArray(files) || files.length === 0) return '';

  const interviewers = files.map(f => __extractInterviewer(f));
  const uniqueList = [...new Set(interviewers)].join(', ');

  return `
    <div style="padding: 12px 14px;
      background: linear-gradient(135deg, rgba(250,204,21,.12), rgba(245,158,11,.08));
      border: 1.5px solid rgba(250,204,21,.5); border-radius: 11px;
      box-shadow: 0 0 0 1px rgba(250,204,21,.15), 0 0 20px rgba(250,204,21,.2);">

      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
        <div style="width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border-radius: 9px; font-size: 16px;">🎤</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 800; color: #fde047; font-size: 12px; margin-bottom: 2px;">
            Hasil Wawancara (${files.length})
          </div>
          <div style="color: #94a3b8; font-size: 10.5px;">
            Pewawancara: <b style="color: #fde047;">${__adminEscape(uniqueList)}</b>
          </div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${files.map(f => {
          const iv = __extractInterviewer(f);
          const safeUrl = __safeUrl(f.url);
          const sizeMB = f.size ? (f.size / 1024 / 1024).toFixed(2) + ' MB' : '-';
          return `
            <div style="display: flex; align-items: center; gap: 8px; padding: 8px 10px;
              background: rgba(0,0,0,.3); border: 1px solid rgba(250,204,21,.25); border-radius: 8px;">
              <div style="width: 30px; height: 30px; flex: 0 0 30px; display: grid; place-items: center;
                background: linear-gradient(135deg, #f59e0b, #d97706);
                border-radius: 8px; font-size: 11px; font-weight: 900; color: #fff;">
                ${__adminEscape(iv.slice(0, 3))}
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 800; color: #fde047; font-size: 11.5px; margin-bottom: 2px;">
                  👤 ${__adminEscape(iv)}
                </div>
                <div style="color: #64748b; font-size: 10px; word-break: break-all;">
                  ${__adminEscape((f.name || '').slice(0, 42))} · ${sizeMB}
                </div>
              </div>
              <div style="display: flex; gap: 6px; flex: 0 0 auto;">
                <a href="${safeUrl}" target="_blank" rel="noopener" class="rf-btn rf-btn-primary"
                   style="background: linear-gradient(135deg,#f59e0b,#d97706);">⬇ Buka</a>
                <button class="js-delete-file rf-btn rf-btn-danger"
                  data-file-id="${__adminEscape(f.id)}"
                  data-file-name="${__adminEscape(f.name)}">🗑</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/* ============================================================
   Render box Grafis
   ============================================================ */
function __renderGrafisBox(files) {
  if (!Array.isArray(files) || files.length === 0) return '';

  const assessors = files.map(f => __extractAssessorGrafis(f));
  const uniqueList = [...new Set(assessors)].join(', ');

  return `
    <div class="rf-grafis-box" style="
      padding: 12px 14px;
      background: linear-gradient(135deg, rgba(16,185,129,.12), rgba(6,182,212,.08));
      border: 1.5px solid rgba(16,185,129,.5);
      border-radius: 12px;
      box-shadow:
        0 0 0 1px rgba(16,185,129,.15),
        0 0 20px rgba(16,185,129,.2),
        inset 0 1px 0 rgba(255,255,255,.05);
      animation: rfGrafisGlow 3s ease-in-out infinite;
    ">
      <style>
        @keyframes rfGrafisGlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(16,185,129,.15), 0 0 18px rgba(16,185,129,.18), inset 0 1px 0 rgba(255,255,255,.05); }
          50%      { box-shadow: 0 0 0 1px rgba(16,185,129,.3),  0 0 28px rgba(16,185,129,.35), inset 0 1px 0 rgba(255,255,255,.08); }
        }
        @keyframes rfGrafisPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.15); opacity: .85; }
        }
      </style>

      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
        <div style="
          width: 34px; height: 34px; flex: 0 0 34px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #10b981, #06b6d4);
          border-radius: 9px; font-size: 16px;
          box-shadow: 0 0 12px rgba(16,185,129,.45), inset 0 1px 0 rgba(255,255,255,.2);
        ">🎨</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 800; color: #6ee7b7; font-size: 12px; margin-bottom: 2px;
            text-shadow: 0 0 8px rgba(110,231,183,.5);">
            Interpretasi Grafis (${files.length})
          </div>
          <div style="color: #94a3b8; font-size: 10.5px; line-height: 1.3;">
            Assessor: <b style="color: #6ee7b7;">${__adminEscape(uniqueList)}</b>
          </div>
        </div>
        <div style="
          width: 8px; height: 8px; border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981, 0 0 16px #10b981;
          animation: rfGrafisPulse 1.8s ease-in-out infinite;
        "></div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${files.map(f => {
          const a = __extractAssessorGrafis(f);
          const safeUrl = __safeUrl(f.url);
          const sizeMB = f.size ? (f.size / 1024 / 1024).toFixed(2) + ' MB' : '-';
          return `
            <div style="
              display: flex; align-items: center; gap: 8px;
              padding: 8px 10px;
              background: rgba(0,0,0,.3);
              border: 1px solid rgba(16,185,129,.25);
              border-radius: 8px;
              transition: all .18s ease;
            " onmouseover="this.style.borderColor='rgba(16,185,129,.55)';this.style.background='rgba(16,185,129,.08)';"
               onmouseout="this.style.borderColor='rgba(16,185,129,.25)';this.style.background='rgba(0,0,0,.3)';">
              <div style="
                width: 30px; height: 30px; flex: 0 0 30px;
                display: grid; place-items: center;
                background: linear-gradient(135deg, #10b981, #059669);
                border-radius: 8px;
                font-size: 11px; font-weight: 900; color: #fff; letter-spacing: -.3px;
                box-shadow: 0 0 8px rgba(16,185,129,.4);
              ">
                ${__adminEscape(a.slice(0, 3))}
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 800; color: #6ee7b7; font-size: 11.5px; margin-bottom: 2px;">
                  🎨 ${__adminEscape(a)}
                </div>
                <div style="color: #64748b; font-size: 10px; word-break: break-all; line-height: 1.3;">
                  ${__adminEscape((f.name || '').slice(0, 42))}${(f.name || '').length > 42 ? '...' : ''} · ${sizeMB}
                </div>
              </div>
              <div style="display: flex; gap: 6px; flex: 0 0 auto;">
                <a href="${safeUrl}" target="_blank" rel="noopener" class="rf-btn rf-btn-primary"
                   style="background: linear-gradient(135deg,#10b981,#059669);">⬇ Buka</a>
                <button class="js-delete-file rf-btn rf-btn-danger"
                  data-file-id="${__adminEscape(f.id)}"
                  data-file-name="${__adminEscape(f.name)}">🗑</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/* ============================================================
   DOWNLOAD ZIP
   ============================================================ */
function __extractDriveId(url) {
  if (!url) return null;
  let m = String(url).match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = String(url).match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  return null;
}

function __base64ToBlob(base64, mime) {
  const bin = atob(base64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime || 'application/pdf' });
}

async function __fetchViaGASProxy(fileId) {
  if (!window.GAS_ADMIN_URL) throw new Error('GAS URL tidak tersedia');
  const idToken = (typeof __getFirebaseIdToken === 'function')
    ? await __getFirebaseIdToken() : '';
  const res = await fetch(GAS_ADMIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getFileBase64', fileId, idToken })
  });
  if (!res.ok) throw new Error('GAS HTTP ' + res.status);
  const data = await res.json();
  if (!data.success || !data.base64) throw new Error(data.error || 'GAS gagal');
  return __base64ToBlob(data.base64, data.mimeType || 'application/pdf');
}

async function downloadCandidateZip(candidateKey) {
  const files = window.__candidateFilesMap[candidateKey] || [];
  if (files.length === 0) {
    await __alert('Tidak ada file untuk kandidat ini.', '⚠️ Kosong');
    return;
  }

  if (!window.JSZip) {
    await __alert('Library ZIP belum siap. Refresh halaman lalu coba lagi.', '⚠️ Error');
    return;
  }

  showResultToast('📦', 'Menyiapkan ZIP…', files.length + ' file dari ' + candidateKey);

  const zip = new JSZip();
  let okCount = 0;
  let proxyCount = 0;
  let failCount = 0;
  const failedFiles = [];

  for (const f of files) {
    try {
      const safeName = String(f.name || ('file_' + (okCount + 1) + '.pdf'))
        .replace(/[\\/:*?"<>|]/g, '_').slice(0, 100);

      let blob = null;

      try {
        const driveId = __extractDriveId(f.url);
        const directUrl = driveId
          ? 'https://drive.google.com/uc?export=download&id=' + driveId + '&confirm=t'
          : f.url;
        const res = await fetch(directUrl, {
          cache: 'no-store',
          mode: 'cors',
          credentials: 'omit'
        });
        if (res.ok) {
          const tmp = await res.blob();
          if (!tmp.type.includes('text/html') && tmp.size > 100) {
            blob = tmp;
          }
        }
      } catch (e) {}

      if (!blob && f.id) {
        try {
          blob = await __fetchViaGASProxy(f.id);
          if (blob) proxyCount++;
        } catch (e) {
          console.warn('[ZIP] GAS proxy gagal:', f.name, e.message);
        }
      }

      if (blob) {
        zip.file(safeName, blob);
        okCount++;
      } else {
        failedFiles.push(f);
        failCount++;
      }

    } catch (e) {
      console.warn('[ZIP] Gagal total:', f.name, e.message);
      failedFiles.push(f);
      failCount++;
    }
  }

  if (okCount === 0) {
    const ok = await __confirm(
      'Semua file (' + failCount + ') tidak bisa di-bundle otomatis.\n\n' +
      'Ini karena Google Drive tidak mengizinkan akses langsung dari browser (CORS).\n\n' +
      'Mau buka ' + failCount + ' file di tab baru satu per satu?\n' +
      '(Izinkan popup untuk domain ini)',
      { title: '📂 Buka Manual', okText: 'Ya, Buka Semua Tab' }
    );
    if (ok) {
      failedFiles.forEach((f, i) => {
        setTimeout(() => window.open(f.url, '_blank', 'noopener,noreferrer'), i * 300);
      });
    }
    return;
  }

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Hasil_' + candidateKey.replace(/[^a-zA-Z0-9]/g, '_') + '.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  let msg = '✅ ' + okCount + ' file berhasil';
  if (proxyCount > 0) msg += ' (' + proxyCount + ' via GAS)';
  if (failCount > 0) {
    msg += '\n⚠️ ' + failCount + ' file gagal';
    showResultToast('⚠️', 'ZIP Selesai (Sebagian)', msg);

    setTimeout(async () => {
      const openRest = await __confirm(
        failCount + ' file tidak bisa di-bundle.\n\n' +
        'Buka ' + failCount + ' file sisa di tab baru?',
        { title: '📂 Buka Sisa File', okText: 'Ya, Buka' }
      );
      if (openRest) {
        failedFiles.forEach((f, i) => {
          setTimeout(() => window.open(f.url, '_blank', 'noopener,noreferrer'), i * 300);
        });
      }
    }, 800);
  } else {
    showResultToast('✅', 'ZIP Siap', msg);
  }
}

/* ============================================================
   RENDER — 1 kandidat = 1 kartu (untuk halaman utama admin)
   ============================================================ */
function renderResultFilesHTML(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return `<div style="padding: 20px 14px; text-align: center; color: #94a3b8; font-size: 12px; background: #fff; border-radius: 10px;">📭 Belum ada PDF yang dikirim kandidat</div>`;
  }

  const groups = new Map();
  files.forEach(f => {
    const n = String(f.name || '');
    if (n.startsWith('SubjectNote-') || n === '-' || n === '') return;
    
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

  window.__candidateFilesMap = window.__candidateFilesMap || {};
  groupArr.forEach(g => {
    const k = __normalizeCandidateKey(g.name);
    window.__candidateFilesMap[k] = g.files;
  });

  function renderFileRow(f, kind) {
    const sizeMB = f.size ? (f.size / 1024 / 1024).toFixed(2) + ' MB' : '-';
        const styleMap = {
      pdf:   { icon: '📄', label: 'Hasil Tes (PDF)', bg: '#eff6ff', br: '#bfdbfe', iconBg: '#dbeafe', text: '#1e40af' },
      excel: { icon: '📊', label: 'Jawaban Excel',    bg: '#ecfdf5', br: '#86efac', iconBg: '#d1fae5', text: '#15803d' },
      other: { icon: '📁', label: 'File Lain',         bg: '#f8fafc', br: '#cbd5e1', iconBg: '#e2e8f0', text: '#475569' },
      subjectnote: { icon: '📚', label: 'Lampiran Koreksi Subject', bg: '#f0fdfa', br: '#5eead4', iconBg: '#ccfbf1', text: '#0f766e' }
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
        const pdfs     = g.files.filter(f => __detectFileKind(f) === 'pdf');
    const excels   = g.files.filter(f => __detectFileKind(f) === 'excel');
    const wawancara = g.files.filter(f => {
      const k = __detectFileKind(f);
      return k === 'wawancara' || k === 'wawancara-combined';
    });
    const grafis   = g.files.filter(f => __detectFileKind(f) === 'grafis');
    const subjectnotes = g.files.filter(f => __detectFileKind(f) === 'subjectnote');
    const others   = g.files.filter(f => {
      const k = __detectFileKind(f);
      return k === 'other' || k === 'fgd-combined' || k === 'fgd';
    });

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

    const candidateKey = __normalizeCandidateKey(g.name);

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
          ${wawancara.length > 0 ? __renderWawancaraBox(wawancara) : ''}
          ${grafis.length > 0 ? __renderGrafisBox(grafis) : ''}
          ${subjectnotes.map(f => renderFileRow(f, 'subjectnote')).join('')}
          ${others.map(f => renderFileRow(f, 'other')).join('')}
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
          <button class="js-download-zip" data-candidate-key="${__adminEscape(candidateKey)}"
            style="padding: 6px 14px; border-radius: 999px;
              border: 1.5px solid rgba(16,185,129,.55);
              background: linear-gradient(135deg, rgba(16,185,129,.15), rgba(6,182,212,.1));
              color: #047857; font-size: 11px; font-weight: 800;
              cursor: pointer; font-family: inherit; white-space: nowrap;
              box-shadow: 0 0 12px rgba(16,185,129,.15);">
            📦 Download ZIP (${g.files.length})
          </button>
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

  const reasonMap = {
    'diskualifikasi_subject': { label: '📚 Diskualifikasi SUBJECT', bg: '#fef3c7', br: '#fde68a', text: '#92400e' },
    'diskualifikasi_excel':   { label: '📊 Diskualifikasi EXCEL',   bg: '#fef3c7', br: '#fde68a', text: '#92400e' }
  };

  return requests.map(r => {
    const ago = r.requestedAt ? Math.round((Date.now() - r.requestedAt) / 1000) : null;
    const agoStr = ago === null ? '-' : ago < 60 ? ago + 's lalu' : ago < 3600 ? Math.floor(ago / 60) + 'm lalu' : ago < 86400 ? Math.floor(ago / 3600) + 'j lalu' : Math.floor(ago / 86400) + 'h lalu';

    const reason = reasonMap[r.reason] || null;
    const reasonBadge = reason
      ? `<span style="display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 10px;
           font-weight: 800; background: ${reason.bg}; border: 1px solid ${reason.br}; color: ${reason.text};
           margin-left: 6px; white-space: nowrap;">${reason.label}</span>`
      : '';

    return `
      <div style="padding: 12px 14px; background: #fff; border: 1px solid #fde68a; border-radius: 10px; font-size: 12px; line-height: 1.5;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
          <div style="font-weight: 800; color: #1e293b; min-width:0;">${__adminEscape(r.name || '(tanpa nama)')}</div>
          <div style="font-size: 10px; color: #92400e; font-weight: 800; white-space: nowrap; background: #fef3c7; padding: 3px 8px; border-radius: 999px;">⏳ Menunggu</div>
        </div>
        <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">
          ${r.position ? '📍 ' + __adminEscape(r.position) + ' &nbsp;·&nbsp; ' : ''}🕐 ${agoStr}</div>
        ${reason ? `<div style="margin-bottom: 8px;">${reasonBadge}</div>` : ''}
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
    'Setujui izin akses untuk "' + n + '"?\n\n' +
    '• Device akan di-reset\n' +
    '• Kandidat pakai password USED\n' +
    '• Kandidat harus login ulang',
    { title: '✓ Setujui Akses', okText: 'Ya, Setujui', okStyle: 'success' }
  );
  if (!ok) return;

  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    await __alert('Firebase belum siap', '❌ Error');
    return;
  }

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

    setTimeout(() => {
      try {
        firebase.database().ref('sgs_requests/' + deviceId).remove()
          .then(() => console.log('[ADMIN] 🧹 Request approved dibersihkan:', deviceId.slice(-8)))
          .catch(() => {});
      } catch (e) {}
    }, REQUEST_CLEANUP_APPROVED_MS);

    await __alert('Izin akses diberikan untuk "' + n + '".', '✅ Sukses');
  } catch (e) {
    await __alert('Gagal: ' + e.message, '❌ Error');
  }
}

async function rejectAccessRequest(deviceId) {
  const ok = await __confirmDanger('Tolak request izin ini?', { title: '✕ Tolak Request', okText: 'Ya, Tolak' });
  if (!ok) return;

  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    await __alert('Firebase belum siap', '❌ Error');
    return;
  }

  try {
    await firebase.database().ref('sgs_requests/' + deviceId).update({
      status: 'rejected',
      respondedAt: firebase.database.ServerValue.TIMESTAMP,
      respondedBy: 'admin'
    });

    setTimeout(() => {
      try {
        firebase.database().ref('sgs_requests/' + deviceId).remove()
          .then(() => console.log('[ADMIN] 🧹 Request rejected dibersihkan:', deviceId.slice(-8)))
          .catch(() => {});
      } catch (e) {}
    }, REQUEST_CLEANUP_REJECTED_MS);

    await __alert('Request ditolak.', '✅ Sukses');
  } catch (e) {
    await __alert('Gagal: ' + e.message, '❌ Error');
  }
}

/* ============================================================
   HALAMAN HASIL TES TERKIRIM
   ============================================================ */
window.__resultFilterPosition = 'all';
window.__resultSearchQuery = '';
window.__resultFilesPageOpen = false;
window.__candidateStatusMap = {};
window.__candidateShowArchived = false;

function openResultFilesPage() {
  const existing = document.getElementById('resultFilesPageOverlay');
  if (existing) existing.remove();
  window.__resultFilesPageOpen = false;
    try {
    window.__resultFilesPageOpen = true;
    window.__lastRenderedSignature = null;
    if (typeof startSignalListeners === 'function') {
      try { startSignalListeners(); } catch (e) {}
    }
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
  /* 🆕 Fetch status semua kandidat dulu */
  try { await __fetchAllCandidateStatus(); } catch (e) {}
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

/* ============================================================
   🆕 CANDIDATE STATUS HELPERS
   ============================================================ */
async function __fetchAllCandidateStatus() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return {};
  try {
    const snap = await firebase.database().ref('sgs_candidate_status').once('value');
    window.__candidateStatusMap = snap.val() || {};
    return window.__candidateStatusMap;
  } catch (e) {
    console.warn('[STATUS] Gagal fetch:', e.message);
    return {};
  }
}

function __getStatusBadge(status) {
  const map = {
    'lolos':           { label: '✅ Lolos',            bg: 'rgba(34,197,94,.18)',   br: 'rgba(34,197,94,.55)',   text: '#86efac', color: '#16a34a' },
    'tidak_lolos':     { label: '❌ Tidak Lolos',      bg: 'rgba(239,68,68,.18)',   br: 'rgba(239,68,68,.55)',   text: '#fca5a5', color: '#dc2626' },
    'dipertimbangkan': { label: '⭐ Dipertimbangkan',   bg: 'rgba(245,158,11,.18)',  br: 'rgba(245,158,11,.55)',  text: '#fcd34d', color: '#d97706' },
    '':                { label: '⏳ Pending',           bg: 'rgba(148,163,184,.15)', br: 'rgba(148,163,184,.4)',  text: '#cbd5e1', color: '#94a3b8' }
  };
  return map[status] || map[''];
}

function __getPengumumanBadge(statusData) {
  const sent = statusData && statusData.emailSentAt;
  const sentStatus = statusData && statusData.emailSentStatus;
  if (sent && sentStatus) {
    const label = sentStatus === 'lolos' ? 'Lolos'
                : sentStatus === 'tidak_lolos' ? 'Tidak Lolos'
                : sentStatus === 'dipertimbangkan' ? 'Dipertimbangkan'
                : sentStatus;
    return {
      label: '📢 Sudah Diinfokan (' + label + ')',
      bg: 'rgba(59,130,246,.18)',
      br: 'rgba(59,130,246,.5)',
      text: '#93c5fd'
    };
  }
  return {
    label: '🔕 Belum Diinfokan',
    bg: 'rgba(148,163,184,.12)',
    br: 'rgba(148,163,184,.35)',
    text: '#94a3b8'
  };
}


/* ============================================================
   FOLDER VIEW — grid folder arsip (klik → overlay)
   ============================================================ */
function __renderResultPageContent() {
  const content = document.getElementById('rfContent');
  const chipsContainer = document.getElementById('rfPositionChips');
  const statsContainer = document.getElementById('rfStats');
  if (!content || !chipsContainer || !statsContainer) return;

  /* CSS folder grid */
  if (!document.getElementById('rf-folder-css')) {
    const st = document.createElement('style');
    st.id = 'rf-folder-css';
    st.textContent = `
      .rf-folder-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 14px;
        align-items: start;
      }
      @media (max-width: 900px) {
        .rf-folder-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
      }
      @media (max-width: 640px) {
        .rf-folder-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      }
      @media (max-width: 380px) {
        .rf-folder-grid { grid-template-columns: 1fr; }
      }

      .rf-folder {
        background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02));
        border: 1.5px solid rgba(255,255,255,.08);
        border-radius: 14px;
        overflow: hidden;
        transition: all .25s ease;
        backdrop-filter: blur(8px);
        cursor: pointer;
      }
      .rf-folder:hover {
        border-color: rgba(99,102,241,.4);
        transform: translateY(-3px);
        box-shadow: 0 12px 32px rgba(0,0,0,.35), 0 0 0 1px rgba(99,102,241,.15);
      }
      .rf-folder:active { transform: translateY(-1px); }

      .rf-folder-header {
        padding: 16px 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        user-select: none;
      }
      .rf-folder-icon {
        width: 52px;
        height: 52px;
        flex: 0 0 52px;
        display: grid;
        place-items: center;
        font-size: 28px;
        background: linear-gradient(135deg, rgba(99,102,241,.25), rgba(59,130,246,.15));
        border: 1px solid rgba(99,102,241,.35);
        border-radius: 12px;
      }
      .rf-folder-info { flex: 1; min-width: 0; }
      .rf-folder-name {
        font-size: 14px;
        font-weight: 900;
        color: #fff;
        margin-bottom: 3px;
        letter-spacing: -.2px;
        word-break: break-word;
        line-height: 1.25;
      }
      .rf-folder-meta {
        font-size: 11px;
        color: #94a3b8;
        font-weight: 600;
        line-height: 1.3;
      }
      .rf-folder-position {
        font-size: 10.5px;
        color: #a5b4fc;
        font-weight: 700;
        margin-top: 3px;
      }
      .rf-folder-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 6px;
      }
      .rf-folder-badge {
        display: inline-block;
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
      }
      .rf-folder-chevron {
        font-size: 16px;
        color: #64748b;
        flex: 0 0 auto;
      }
      .rf-folder:hover .rf-folder-chevron { color: #a5b4fc; }
    `;
    document.head.appendChild(st);
  }

  /* 🆕 Fetch status semua kandidat dulu */
  const files = window.__resultFilesCache || [];

  const signature = JSON.stringify(files.map(f => f.id).sort()) + '|' + JSON.stringify(Object.keys(window.__candidateStatusMap || {}));
    const __stillLoading = !!content.querySelector('[style*="resultSpinner"]');
  if (window.__lastRenderedSignature === signature && !__stillLoading) return;
  window.__lastRenderedSignature = signature;

   const groups = new Map();
  files.forEach(f => {
    const n = String(f.name || '');
    if (n.startsWith('SubjectNote-') || n === '-' || n === '') return;
    
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

  window.__candidateFilesMap = window.__candidateFilesMap || {};
  groupArr.forEach(g => {
    const k = __normalizeCandidateKey(g.name);
    window.__candidateFilesMap[k] = g.files;
  });

  /* Filter posisi chips */
  const positionSet = new Set();
  groupArr.forEach(g => { if (g.position && g.position !== '-') positionSet.add(g.position); });
  const positions = Array.from(positionSet).sort();

  const currentFilter = window.__resultFilterPosition || 'all';
  const showArchived = window.__candidateShowArchived === true;

  /* Filter arsip */
  function isArchived(g) {
    const slug = __normalizeCandidateKey(g.name);
    const s = window.__candidateStatusMap[slug] || {};
    return s.status === 'tidak_lolos' || s._archived === true;
  }

  function isLolos(g) {
    const slug = __normalizeCandidateKey(g.name);
    const s = window.__candidateStatusMap[slug] || {};
    return s.status === 'lolos';
  }

  /* Data berdasarkan mode */
  const sourceArr = showArchived
    ? groupArr.filter(isArchived)
    : groupArr.filter(g => !isArchived(g));

  let chipsHTML = `<button class="rf-chip ${currentFilter === 'all' ? 'active' : ''}"
    onclick="__setResultFilter('all')">Semua (${sourceArr.length})</button>`;
  positions.forEach(p => {
    const count = sourceArr.filter(g => g.position === p).length;
    if (count === 0) return;
    const safeP = String(p).replace(/'/g, "\\'");
    chipsHTML += `<button class="rf-chip ${currentFilter === p ? 'active' : ''}"
      onclick="__setResultFilter('${safeP}')">${__adminEscape(p)} (${count})</button>`;
  });
  const noPosCount = sourceArr.filter(g => !g.position || g.position === '-').length;
  if (noPosCount > 0) {
    chipsHTML += `<button class="rf-chip ${currentFilter === '__no_position__' ? 'active' : ''}"
      onclick="__setResultFilter('__no_position__')">Tanpa Posisi (${noPosCount})</button>`;
  }

  /* 🆕 Chip Arsip */
  const archivedCount = groupArr.filter(isArchived).length;
  chipsHTML += `<button class="rf-chip ${showArchived ? 'active' : ''}"
    onclick="__toggleArsipFilter()" style="border-color: rgba(220,38,38,.5); color: ${showArchived ? '#fff' : '#fca5a5'};">
    📦 ${showArchived ? 'Keluar dari Arsip' : 'Arsip'} (${archivedCount})
  </button>`;

  chipsContainer.innerHTML = chipsHTML;

  /* Stats */
  const totalFiles = sourceArr.reduce((acc, g) => acc + g.files.length, 0);
  const lolosCount = sourceArr.filter(isLolos).length;
  statsContainer.innerHTML = `
    <div style="padding: 8px 14px; border-radius: 10px; background: rgba(99,102,241,.12);
      border: 1px solid rgba(99,102,241,.3); font-size: 12px; font-weight: 800; color: #a5b4fc;">
      👥 ${sourceArr.length} kandidat</div>
    <div style="padding: 8px 14px; border-radius: 10px; background: rgba(34,197,94,.12);
      border: 1px solid rgba(34,197,94,.3); font-size: 12px; font-weight: 800; color: #86efac;">
      ✅ ${lolosCount} lolos</div>
    <div style="padding: 8px 14px; border-radius: 10px; background: rgba(59,130,246,.12);
      border: 1px solid rgba(59,130,246,.3); font-size: 12px; font-weight: 800; color: #93c5fd;">
      📎 ${totalFiles} file</div>`;

  /* Filter posisi + search */
  const search = window.__resultSearchQuery || '';
  const filterPos = window.__resultFilterPosition || 'all';
  let filtered = sourceArr;
  if (filterPos === '__no_position__') filtered = filtered.filter(g => !g.position || g.position === '-');
  else if (filterPos !== 'all') filtered = filtered.filter(g => g.position === filterPos);
  if (search) filtered = filtered.filter(g =>
    (g.name || '').toLowerCase().includes(search) || (g.position || '').toLowerCase().includes(search));

  if (filtered.length === 0) {
    content.innerHTML = `<div style="display: flex; align-items: center; justify-content: center;
      padding: 80px 20px; color: #64748b; font-size: 14px; flex-direction: column; gap: 12px; text-align: center;">
      <div style="font-size: 52px; opacity: .5;">📭</div>
      <div style="font-weight: 700; color: #94a3b8;">
        ${showArchived ? 'Belum ada kandidat di arsip' :
          (files.length === 0 ? 'Belum ada hasil tes yang terkirim' : 'Tidak ada kandidat yang cocok dengan filter')}</div>
      ${files.length > 0 ? `<button onclick="__resetResultFilter()" style="margin-top: 8px; padding: 9px 20px;
        background: rgba(99,102,241,.15); border: 1px solid rgba(99,102,241,.4);
        color: #a5b4fc; border-radius: 9px; font-family: inherit; font-size: 13px; font-weight: 800;
        cursor: pointer;">Reset Filter</button>` : ''}</div>`;
    return;
  }

  const avatarColors = [
    ['#3b82f6','#1e40af'], ['#8b5cf6','#6d28d9'], ['#10b981','#047857'],
    ['#f59e0b','#b45309'], ['#ec4899','#be185d'], ['#06b6d4','#0e7490']
  ];

  const foldersHTML = filtered.map(g => {
    const slug = __normalizeCandidateKey(g.name);
    const statusData = window.__candidateStatusMap[slug] || {};
    const statusBadge = __getStatusBadge(statusData.status);
    const pengumumanBadge = __getPengumumanBadge(statusData);

    const pdfs      = g.files.filter(f => __detectFileKind(f) === 'pdf');
    const excels    = g.files.filter(f => __detectFileKind(f) === 'excel');

    const latestDate = Math.max(...g.files.map(f => f.date || 0));
    const dateStr = latestDate ? new Date(latestDate).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    let filesBadge;
    if (pdfs.length > 0 && excels.length > 0) {
      filesBadge = { bg: 'rgba(34,197,94,.15)', br: 'rgba(34,197,94,.4)', text: '#86efac', label: '✓ Lengkap' };
    } else if (pdfs.length > 0) {
      filesBadge = { bg: 'rgba(59,130,246,.15)', br: 'rgba(59,130,246,.4)', text: '#93c5fd', label: '📄 PDF' };
    } else if (excels.length > 0) {
      filesBadge = { bg: 'rgba(34,197,94,.15)', br: 'rgba(34,197,94,.4)', text: '#86efac', label: '📊 Excel' };
    } else {
      filesBadge = { bg: 'rgba(148,163,184,.15)', br: 'rgba(148,163,184,.4)', text: '#cbd5e1', label: `📁 ${g.files.length} file` };
    }

    const hash = (g.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const [c1, c2] = avatarColors[hash % avatarColors.length];

    return `
      <div class="rf-folder js-open-folder" data-candidate-key="${__adminEscape(slug)}">
        <div class="rf-folder-header">
          <div class="rf-folder-icon" style="background: linear-gradient(135deg, ${c1}25, ${c2}15); border-color: ${c1}55;">
            📁
          </div>
          <div class="rf-folder-info">
            <div class="rf-folder-name">${__adminEscape(g.name)}</div>
            ${g.position && g.position !== '-' ? `<div class="rf-folder-position">💼 ${__adminEscape(g.position)}</div>` : ''}
            <div class="rf-folder-meta">📎 ${g.files.length} file · 🕐 ${dateStr}</div>
            <div class="rf-folder-badges">
              <span class="rf-folder-badge" style="background:${statusBadge.bg};border:1px solid ${statusBadge.br};color:${statusBadge.text};">
                ${statusBadge.label}
              </span>
              <span class="rf-folder-badge" style="background:${pengumumanBadge.bg};border:1px solid ${pengumumanBadge.br};color:${pengumumanBadge.text};">
                ${pengumumanBadge.label}
              </span>
              <span class="rf-folder-badge" style="background:${filesBadge.bg};border:1px solid ${filesBadge.br};color:${filesBadge.text};">
                ${filesBadge.label}
              </span>
            </div>
          </div>
          <div class="rf-folder-chevron">→</div>
        </div>
      </div>`;
  }).join('');

  content.innerHTML = `<div class="rf-folder-grid">${foldersHTML}</div>`;
}

window.__toggleArsipFilter = function() {
  window.__candidateShowArchived = !window.__candidateShowArchived;
  window.__lastRenderedSignature = null;
  __renderResultPageContent();
};

/* ============================================================
   🆕 OVERLAY: Buka Folder Kandidat (Responsive)
   ============================================================ */
window.__openCandidateFolder = function(candidateKey) {
  const files = window.__candidateFilesMap[candidateKey] || [];
  if (files.length === 0) {
    if (typeof __alert === 'function') __alert('Tidak ada file untuk kandidat ini.', '⚠️ Kosong');
    return;
  }

  let name = candidateKey;
  let position = '';
  for (const f of files) {
    const _info = __extractCandidateInfo(f);
    if (_info.name && _info.name !== '-') name = _info.name;
    if (_info.position && _info.position !== '-') { position = _info.position; break; }
  }
  const slug = candidateKey;

  const statusData = window.__candidateStatusMap[slug] || {};
  const statusBadge = __getStatusBadge(statusData.status);
  const pengumumanBadge = __getPengumumanBadge(statusData);

  const old = document.getElementById('rfFolderOverlay');
  if (old) old.remove();

  if (!document.getElementById('rf-folder-overlay-style')) {
    const st = document.createElement('style');
    st.id = 'rf-folder-overlay-style';
    st.textContent = `
      @keyframes rfFolderFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes rfFolderSlideIn {
        from { opacity: 0; transform: translateY(20px) scale(.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .rf-folder-overlay-card { animation: rfFolderSlideIn .28s cubic-bezier(.2,.8,.2,1); }
      .rf-folder-overlay-scroll::-webkit-scrollbar { width: 6px; }
      .rf-folder-overlay-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,.03); border-radius: 3px; }
      .rf-folder-overlay-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.18); border-radius: 3px; }

      @media (max-width: 720px) {
        .rf-folder-overlay-card {
          width: 100% !important;
          max-width: 100% !important;
          height: calc(100vh - 20px) !important;
          max-height: calc(100vh - 20px) !important;
          border-radius: 16px !important;
        }
        .rf-folder-actions {
          grid-template-columns: repeat(2, 1fr) !important;
        }
      }
      @media (max-width: 380px) {
        .rf-folder-overlay-btn-label { display: none; }
      }
    `;
    document.head.appendChild(st);
  }

  const overlay = document.createElement('div');
  overlay.id = 'rfFolderOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 2147483640;
    background: rgba(10,20,35,.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px; overflow-y: auto;
    font-family: Inter, system-ui, -apple-system, sans-serif;
    animation: rfFolderFadeIn .2s ease;
  `;

  const pdfs      = files.filter(f => __detectFileKind(f) === 'pdf');
  const excels    = files.filter(f => __detectFileKind(f) === 'excel');
  const wawancara = files.filter(f => { const k = __detectFileKind(f); return k === 'wawancara' || k === 'wawancara-combined'; });
  const grafis    = files.filter(f => __detectFileKind(f) === 'grafis');
  const others    = files.filter(f => { const k = __detectFileKind(f); return k === 'other' || k === 'fgd-combined' || k === 'fgd'; });

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
      ? `<div style="margin-top: 8px; padding: 8px 10px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          background: rgba(250,204,21,.15); border: 1px solid rgba(250,204,21,.4); border-radius: 7px;
          font-size: 11px;">
          <span style="font-weight: 800; color: #fde047; white-space: nowrap;">🔑 Password:</span>
          <code style="font-family: 'Courier New', monospace; font-weight: 800; color: #fff;
            background: rgba(0,0,0,.35); padding: 3px 9px; border-radius: 4px; font-size: 11.5px;
            word-break: break-all; flex: 1; min-width: 0;">${__adminEscape(pdfPassword)}</code>
          <button class="js-copy-pdf-password" data-password="${__adminEscape(pdfPassword)}"
            style="padding: 4px 10px; border: 1px solid rgba(250,204,21,.5); background: rgba(255,255,255,.08);
            border-radius: 5px; cursor: pointer; font-size: 11px; font-family: inherit;
            font-weight: 800; color: #fde047; flex: 0 0 auto;">📋 Copy</button></div>` : '';
    const safeFileUrl = __safeUrl(f.url);
    return `
      <div style="display: flex; align-items: flex-start; gap: 10px; padding: 12px;
        background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
        border-radius: 11px; margin-bottom: 8px; flex-wrap: wrap;">
        <div style="width: 36px; height: 36px; flex: 0 0 36px; display: grid; place-items: center;
          background: rgba(255,255,255,.06); border-radius: 9px; font-size: 17px;">${iconMap[kind] || iconMap.other}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 800; color: #e2e8f0; font-size: 12.5px; margin-bottom: 3px;">${labelMap[kind] || labelMap.other}</div>
          <div style="color: #64748b; font-size: 10.5px; word-break: break-all; line-height: 1.4;">
            ${__adminEscape((f.name || '').slice(0, 80))}${(f.name || '').length > 80 ? '...' : ''} · ${sizeMB}</div>
          ${passwordRow}
        </div>
        <div style="display: flex; gap: 6px; flex: 0 0 auto;">
          <a href="${safeFileUrl}" target="_blank" rel="noopener" class="rf-btn rf-btn-primary"
             style="padding: 8px 14px;">⬇ Buka</a>
          <button class="js-delete-file rf-btn rf-btn-danger"
            data-file-id="${__adminEscape(f.id)}"
            data-file-name="${__adminEscape(f.name)}"
            style="padding: 8px 12px;">🗑</button>
        </div>
      </div>`;
  }

  const isGuru = /guru|dosen|teacher|pengajar|lecturer/i.test(position || '');
  const isTechnical = /technical|teknisi|welder|\blas\b|housekeeping|kebersihan|gardener|kebun|\bit\b|programmer|developer|software|network/i.test(position || '');
  const isAdmin = !isTechnical && !isGuru && /admin|staff|sekretaris|office|kantor|tata\s*usaha|administrasi/i.test(position || '');

  const contentHTML = `
    <div class="rf-ist-section" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}"></div>
    <div class="rf-disc-section" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}"></div>
    <div class="rf-kraeplin-section" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}"></div>
    <div class="rf-papi-section" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}"></div>
    <div class="rf-bigfive-section" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}"></div>
    <div class="rf-grafis-result-section" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}"></div>
    
    ${isGuru ? `<div class="rf-fgd-result-section" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}"></div>` : ''}
    ${isGuru ? `<div class="rf-subject-result-section" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}"></div>` : ''}
    
    ${isTechnical ? `<div class="rf-technical-result-section" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}"></div>` : ''}
    
    ${wawancara.length > 0 ? `<div class="js-wawancara-unified-section" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}"></div>` : ''}
    
    ${isAdmin ? `<div class="rf-typing-section" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}"></div>` : ''}
    ${isAdmin ? `<div class="rf-excel-section" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}"></div>` : ''}
    
    ${others.map(f => fileRow(f, 'other')).join('')}
    <div class="rf-psikogram-section" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}"></div>
  `;

  const topActionsHTML = `
    <button class="js-retake-open" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}" style="padding: 12px 8px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #1e40af); border: 0; color: #fff; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(59,130,246,.3);">
      <span style="font-size: 20px;">📤</span>
      <span class="rf-folder-overlay-btn-label">KIRIM LINK TES</span>
    </button>

    <button class="js-interview-link" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}" style="padding: 12px 8px; border-radius: 10px; background: rgba(250,204,21,.15); border: 1px solid rgba(250,204,21,.5); color: #fde047; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 4px;">
      <span style="font-size: 20px;">🎤</span>
      <span class="rf-folder-overlay-btn-label">WAWANCARA</span>
    </button>

    <button class="js-grafindo-link" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}" style="padding: 12px 8px; border-radius: 10px; background: rgba(168,85,247,.15); border: 1px solid rgba(168,85,247,.5); color: #d8b4fe; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 4px;">
      <span style="font-size: 20px;">✍</span>
      <span class="rf-folder-overlay-btn-label">GRAFIS</span>
    </button>

    ${isGuru ? `
    <button class="js-fgd-link" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}" style="padding: 12px 8px; border-radius: 10px; background: rgba(139,92,246,.15); border: 1px solid rgba(139,92,246,.5); color: #c4b5fd; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 4px;">
      <span style="font-size: 20px;">🎯</span>
      <span class="rf-folder-overlay-btn-label">FGD</span>
    </button>
    <button class="js-subject-link" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}" style="padding: 12px 8px; border-radius: 10px; background: rgba(13,148,136,.15); border: 1px solid rgba(13,148,136,.5); color: #5eead4; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 4px;">
      <span style="font-size: 20px;">📚</span>
      <span class="rf-folder-overlay-btn-label">SUBJEK</span>
    </button>
    ` : ''}

    ${isAdmin ? `
    <button class="js-excel-score" data-slug="${__adminEscape(slug)}" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}" style="padding: 12px 8px; border-radius: 10px; background: rgba(34,197,94,.15); border: 1px solid rgba(34,197,94,.5); color: #86efac; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 4px;">
      <span style="font-size: 20px;">📊</span>
      <span class="rf-folder-overlay-btn-label">NILAI EXCEL</span>
    </button>
    ` : ''}

    ${isTechnical ? `
    <button class="js-technical-link" data-name="${__adminEscape(name)}" data-position="${__adminEscape(position)}" style="padding: 12px 8px; border-radius: 10px; background: rgba(99,102,241,.15); border: 1px solid rgba(99,102,241,.5); color: #c7d2fe; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 4px;">
      <span style="font-size: 20px;">🔧</span>
      <span class="rf-folder-overlay-btn-label">TEKNIS</span>
    </button>
    ` : ''}

        <button id="rfFolderDeleteBtn" style="padding: 12px 8px; border-radius: 10px; background: linear-gradient(135deg, #dc2626, #991b1b); border: 0; color: #fff; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(220,38,38,.35);">
      <span style="font-size: 20px;">🗑️</span>
      <span class="rf-folder-overlay-btn-label">HAPUS</span>
    </button>`;

  overlay.innerHTML = `
    <style>
      /* 🆕 Fix Mutlak: Sembunyikan FGD via CSS agar tidak infinite loop */
      #rfFolderOverlay .js-fgd-link { display: ${isGuru ? 'flex' : 'none'} !important; }
    </style>
    <div class="rf-folder-overlay-card" style="
      width: min(820px, 100%);
      max-height: calc(100vh - 32px);
      background: linear-gradient(180deg, #1e293b, #0f172a);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 20px;
      box-shadow: 0 30px 90px rgba(0,0,0,.65);
      display: flex; flex-direction: column; overflow: hidden;
      color: #e2e8f0;
    ">
      <div style="
        padding: 18px 20px;
        background: linear-gradient(135deg, #1e3a8a, #3b82f6);
        display: flex; align-items: center; gap: 14px;
        flex-wrap: wrap;
      ">
        <div style="
          width: 52px; height: 52px; flex: 0 0 52px;
          display: grid; place-items: center;
          background: rgba(255,255,255,.15);
          border: 1px solid rgba(255,255,255,.25);
          border-radius: 13px; font-size: 26px;
        ">📁</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 10.5px; font-weight: 800; letter-spacing: 2px; opacity: .75; margin-bottom: 3px;">
            HASIL TES · ${files.length} FILE
          </div>
          <div style="font-size: 19px; font-weight: 900; color: #fff; letter-spacing: -.2px;
            word-break: break-word; line-height: 1.25;">
            ${__adminEscape(name)}
          </div>
          ${position && position !== '-' ? `<div style="font-size: 12px; opacity: .85; margin-top: 3px;">💼 ${__adminEscape(position)}</div>` : ''}
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;">
            <span style="padding: 4px 11px; border-radius: 999px; font-size: 11px; font-weight: 800;
              background:${statusBadge.bg}; border:1px solid ${statusBadge.br}; color:${statusBadge.text};">
              ${statusBadge.label}
            </span>
            <span style="padding: 4px 11px; border-radius: 999px; font-size: 11px; font-weight: 800;
              background:${pengumumanBadge.bg}; border:1px solid ${pengumumanBadge.br}; color:${pengumumanBadge.text};">
              ${pengumumanBadge.label}
            </span>
          </div>
        </div>
        <button id="rfFolderCloseBtn" style="
          width: 40px; height: 40px; flex: 0 0 40px;
          display: grid; place-items: center;
          background: rgba(255,255,255,.15);
          border: 1px solid rgba(255,255,255,.25);
          border-radius: 10px; color: #fff; font-size: 17px;
          cursor: pointer; font-family: inherit; font-weight: 800;
        ">✕</button>
      </div>

      <div class="rf-folder-actions" style="
        padding: 14px 20px;
        background: rgba(0,0,0,.3);
        border-bottom: 1px solid rgba(255,255,255,.08);
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
        gap: 8px;
      ">
        ${topActionsHTML}
      </div>

      <div class="rf-folder-overlay-scroll" style="
        flex: 1;
        padding: 16px 20px 20px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      ">
        ${contentHTML}
      </div>

    </div>
  `;

   document.body.appendChild(overlay);

  /* 🆕 Pindahkan PENGUMUMAN ke paling bawah (setelah LAPORAN LENGKAP) */
  setTimeout(() => {
    const actionBar = overlay.querySelector('.rf-folder-actions');
    if (actionBar && !actionBar.querySelector('.js-pengumuman-open')) {
      const pengBtn = document.createElement('button');
      pengBtn.className = 'js-pengumuman-open';
      pengBtn.setAttribute('data-slug', slug);
      pengBtn.setAttribute('data-name', name);
      pengBtn.setAttribute('data-position', position);
      pengBtn.style.cssText = 'grid-column: 1 / -1; padding: 12px 8px; border-radius: 10px; background: linear-gradient(135deg, #16a34a, #059669); border: 0; color: #fff; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; white-space: nowrap; display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(22,163,74,.3); margin-top: 4px;';
      pengBtn.innerHTML = '<span style="font-size: 18px;">📢</span><span class="rf-folder-overlay-btn-label">PENGUMUMAN</span>';
      actionBar.appendChild(pengBtn);
    }
  }, 300);

  /* 🔑 Cleanup listener saat close */
  const closeOverlay = () => {
    try { __detachSubjectRealtime(slug); } catch (e) {}
    try { if (typeof __detachFGDRealtime === 'function') __detachFGDRealtime(slug); } catch (e) {}
    try { if (typeof __detachTechnicalRealtime === 'function') __detachTechnicalRealtime(slug); } catch (e) {}
    overlay.remove();
  };

  const closeBtn = document.getElementById('rfFolderCloseBtn');
  if (closeBtn) closeBtn.onclick = closeOverlay;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });

  const __sectionTasks = [
    { selector: '.rf-ist-section', fn: async (s) => { if(typeof window.__fetchISTData==='function'&&typeof window.renderISTSectionHTML==='function'){ const d = await window.__fetchISTData(slug); s.innerHTML = window.renderISTSectionHTML(d, slug, name, position); } } },
    { selector: '.rf-disc-section', fn: async (s) => { if(typeof window.__fetchDISCData==='function'&&typeof window.renderDISCSectionHTML==='function'){ const d = await window.__fetchDISCData(slug); s.innerHTML = window.renderDISCSectionHTML(d, slug, name, position); } } },
    { selector: '.rf-kraeplin-section', fn: async (s) => { if(typeof window.__fetchKRAEPLINData==='function'&&typeof window.renderKRAEPLINSectionHTML==='function'){ const d = await window.__fetchKRAEPLINData(slug); s.innerHTML = window.renderKRAEPLINSectionHTML(d, slug, name, position); } } },
    { selector: '.rf-papi-section', fn: async (s) => { if(typeof window.__fetchPAPIData==='function'&&typeof window.renderPAPISectionHTML==='function'){ const d = await window.__fetchPAPIData(slug); s.innerHTML = window.renderPAPISectionHTML(d, slug, name, position); } } },
    { selector: '.rf-bigfive-section', fn: async (s) => { if(typeof window.__fetchBIGFIVEData==='function'&&typeof window.renderBIGFIVESectionHTML==='function'){ const d = await window.__fetchBIGFIVEData(slug); s.innerHTML = window.renderBIGFIVESectionHTML(d, slug, name, position); } } },
    { selector: '.rf-grafis-result-section', fn: async (s) => { if(typeof window.__attachGrafisRealtime==='function'){ window.__attachGrafisRealtime(slug, name, position, s, overlay); } else if(typeof window.__fetchGrafisData==='function'&&typeof window.renderGrafisSectionHTML==='function'){ const d = await window.__fetchGrafisData(slug); s.innerHTML = window.renderGrafisSectionHTML(d, slug, name, position); } } },
    { selector: '.rf-fgd-result-section', fn: async (s) => { if(typeof window.__attachFGDRealtime==='function'){ window.__attachFGDRealtime(slug, s, files); } } },
    { selector: '.rf-subject-result-section', fn: async (s) => { if(typeof window.__attachSubjectRealtime==='function'){ window.__attachSubjectRealtime(slug, s, name, position); setTimeout(() => { if (s.innerHTML.trim() === '') s.innerHTML = `<div style="padding:12px;background:rgba(13,148,136,.08);border:1px dashed rgba(13,148,136,.3);border-radius:11px;text-align:center;font-size:11.5px;color:#5eead4;">📚 Belum mengerjakan Subject Test. <br><span style="font-size:10px;color:#94a3b8;">Kandidat belum mengumpulkan jawaban atau belum dinilai.</span></div>`; }, 800); } } },
    { selector: '.rf-technical-result-section', fn: async (s) => { if(typeof window.__attachTechnicalRealtime==='function'){ window.__attachTechnicalRealtime(slug, s, name, position); setTimeout(() => { if (s.innerHTML.trim() === '') s.innerHTML = `<div style="padding:12px;background:rgba(99,102,241,.08);border:1px dashed rgba(99,102,241,.3);border-radius:11px;text-align:center;font-size:11.5px;color:#c7d2fe;">🔧 Belum mengerjakan Kemampuan Teknis. <br><span style="font-size:10px;color:#94a3b8;">Kandidat belum mengumpulkan jawaban atau belum dinilai.</span></div>`; }, 800); } } },
    { selector: '.js-wawancara-unified-section', fn: async (s) => { if(typeof window.__attachWawancaraUnified==='function'){ await window.__attachWawancaraUnified(slug, name, position, wawancara, s); } } },
    { selector: '.rf-psikogram-section', fn: async (s) => { if(typeof window.renderPsikogramBox==='function'){ const html = await window.renderPsikogramBox(slug, name, position); s.innerHTML = html || ''; } } },
    { selector: '.rf-typing-section', fn: async (s) => { if(typeof window.__fetchTYPINGData==='function'){ const d = await window.__fetchTYPINGData(slug); if (!d) { s.innerHTML = `<div style="padding:12px;background:rgba(14,165,233,.08);border:1px dashed rgba(14,165,233,.3);border-radius:11px;text-align:center;font-size:11.5px;color:#7dd3fc;">⌨️ Belum mengerjakan Tes Mengetik. <br><span style="font-size:10px;color:#94a3b8;">Kandidat belum menyelesaikan tes mengetik.</span></div>`; return; } s.innerHTML = window.renderTYPINGSectionHTML(d, slug, name, position); } } },
    { selector: '.rf-excel-section', fn: async (s) => { if(typeof window.__fetchEXCELData==='function'){ const d = await window.__fetchEXCELData(slug); const excelFile = files.filter(f => __detectFileKind(f) === 'excel')[0] || null; if (!d && !excelFile) { s.innerHTML = `<div style="padding:12px;background:rgba(34,197,94,.08);border:1px dashed rgba(34,197,94,.3);border-radius:11px;text-align:center;font-size:11.5px;color:#86efac;">📊 Belum mengerjakan Tes Excel. <br><span style="font-size:10px;color:#94a3b8;">Kandidat belum mengumpulkan file atau belum dinilai.</span></div>`; return; } s.innerHTML = window.renderEXCELSectionHTML(d, slug, name, position, excelFile); } } }
  ];

  let __taskIndex = 0;
  function __processNextTask() {
    if (__taskIndex >= __sectionTasks.length) return;
    if (!document.body.contains(overlay)) return;
    
    const task = __sectionTasks[__taskIndex++];
    const sectionEl = overlay.querySelector(task.selector);
    
    if (sectionEl) {
      Promise.resolve()
        .then(() => task.fn(sectionEl))
        .catch(e => console.warn(`[${task.selector}] render gagal:`, e.message))
        .finally(() => {
          setTimeout(__processNextTask, 15);
        });
    } else {
      setTimeout(__processNextTask, 0);
    }
  }
  __processNextTask();

  /* Delete button */
  const deleteBtn = document.getElementById('rfFolderDeleteBtn');
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      const ok1 = (typeof window.sgsConfirmDanger === 'function')
        ? await window.sgsConfirmDanger(
            '⚠️ HAPUS TOTAL KANDIDAT\n\n' +
            '👤 ' + name + '\n' +
            '💼 ' + (position || '-') + '\n\n' +
            'Semua file Drive dan data Firebase akan dihapus permanen.\n' +
            'Tindakan ini tidak bisa dibatalkan!',
            { title: '🗑️ Hapus Kandidat', okText: 'Ya, Hapus' }
          )
        : confirm('Hapus total kandidat ' + name + '?');
      if (!ok1) return;

      const loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'deleteLoadingOverlay';
      loadingOverlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.85);backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:Inter,system-ui,sans-serif;';
      
      loadingOverlay.innerHTML = `
        <style>@keyframes spinDelete { to { transform: rotate(360deg); } }</style>
        <div style="width:60px;height:60px;border:6px solid rgba(255,255,255,.1);border-top-color:#ef4444;border-radius:50%;animation:spinDelete 1s linear infinite;margin-bottom:20px;"></div>
        <div style="font-size:18px;font-weight:900;color:#fca5a5;">Menghapus Kandidat...</div>
        <div style="font-size:13px;color:#94a3b8;margin-top:8px;text-align:center;max-width:300px;">Mohon tunggu, sedang menghapus file Drive dan data Firebase.</div>
      `;
      
      document.body.appendChild(loadingOverlay);

      deleteBtn.disabled = true;
      deleteBtn.textContent = '⏳ Menghapus...';
      
      try { __detachSubjectRealtime(slug); } catch (e) {}
      
      let fbDeleted = 0;
      let driveDeleted = 0;
      
      try {
        const files = (typeof fetchResultFiles === 'function') ? await fetchResultFiles(true) : [];
        const nameLower = String(name).toLowerCase().trim();
        const targets = files.filter(f => {
          const n = String(f.name || '').toLowerCase();
          const desc = String(f.description || '').toLowerCase();
          const descMatch = desc.match(/nama:\s*(.+)/i);
          if (descMatch && descMatch[1].trim() === nameLower) return true;
          if (n.includes('[' + nameLower.replace(/\s+/g, '-') + ']')) return true;
          if (n.startsWith(slug + '-')) return true;
          return false;
        });

        if (targets.length > 0 && typeof GAS_ADMIN_URL === 'string') {
          const idToken = await __getFirebaseIdToken();
          for (const f of targets) {
            try {
              await fetch(GAS_ADMIN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'delete', fileId: f.id, idToken })
              });
              if (window.__recentlyDeletedFileIds) window.__recentlyDeletedFileIds.add(f.id);
              __removeFileFromCache(f.id);
              driveDeleted++;
              await new Promise(r => setTimeout(r, 200));
            } catch (e) {}
          }
        }
      } catch (e) { console.warn('[DELETE] Drive error:', e.message); }
      
      const paths = [
        'sgs_interviews/' + slug,
        'sgs_grafis_interp/' + slug,
        'sgs_grafis_images/' + slug,
        'sgs_fgd/' + slug,
        'sgs_subject_ratings/' + slug,
        'sgs_subject_images/' + slug,
        'sgs_subject_assessments/' + slug,
        'sgs_candidate_status/' + slug,
        'sgs_scores/' + slug,
        'sgs_psikogram/' + slug,
        'sgs_psikogram_raw/' + slug,
        'sgs_psikogram_weights/' + slug
      ];
      
      for (const path of paths) {
        try {
          await firebase.database().ref(path).remove();
          fbDeleted++;
        } catch (e) {}
      }
      
      try {
        const sessionsSnap = await firebase.database().ref('sgs_state/sessions').once('value');
        const sessions = sessionsSnap.val() || {};
        const nameLower = String(name).toLowerCase().trim();
        for (const devId in sessions) {
          const s = sessions[devId] || {};
          if (s.name && String(s.name).toLowerCase().trim() === nameLower) {
            try {
              await firebase.database().ref('sgs_state/chats/' + devId).remove();
              await firebase.database().ref('sgs_state/sessions/' + devId).remove();
              await firebase.database().ref('sgs_requests/' + devId).remove();
              await firebase.database().ref('sgs_state/resume/' + devId).remove();
            } catch (e) {}
          }
        }
      } catch (e) {}
      
      window.__lastRenderedSignature = null;
      if (window.__candidateFilesMap) delete window.__candidateFilesMap[slug];
      if (typeof __invalidateResultCache === 'function') __invalidateResultCache();
      const filesAfter = await fetchResultFiles(true);
      window.__resultFilesCache = filesAfter;
      
      closeOverlay();
      await __fetchAllCandidateStatus();
      __renderResultPageContent();
      
      if (loadingOverlay) loadingOverlay.remove();
      
      if (typeof showResultToast === 'function') {
        showResultToast('🗑️', 'Kandidat dihapus', name + ' (' + fbDeleted + ' FB · ' + driveDeleted + ' file)');
      } else {
        alert('✅ Hapus total selesai:\n• Firebase: ' + fbDeleted + '\n• Drive: ' + driveDeleted);
      }
    };
  }

  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeOverlay();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  const observer = new MutationObserver(() => {
    if (!document.getElementById('rfFolderOverlay')) {
      document.removeEventListener('keydown', escHandler);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true });
};

/* ============================================================
   🆕 ARSIP KANDIDAT
   ============================================================ */
window.__archiveCandidate = async function(slug, overlayEl) {
  const ok = await __confirmDanger(
    'Arsipkan kandidat ini?\n\nKandidat akan dipindah ke folder arsip.\nBisa dikembalikan kapan saja.',
    { title: '📦 Arsipkan', okText: 'Ya, Arsipkan' }
  );
  if (!ok) return;

  try {
    await firebase.database()
      .ref('sgs_candidate_status/' + slug)
      .update({ _archived: true, _archivedAt: firebase.database.ServerValue.TIMESTAMP });
    if (overlayEl) overlayEl.remove();
    window.__lastRenderedSignature = null;
    await __fetchAllCandidateStatus();
    __renderResultPageContent();
    showResultToast('📦', 'Kandidat diarsipkan', slug);
  } catch (e) {
    await __alert('Gagal: ' + e.message, '❌ Error');
  }
};

window.__unarchiveCandidate = async function(slug, overlayEl) {
  const ok = await __confirm(
    'Kembalikan kandidat dari arsip?',
    { title: '📤 Keluar dari Arsip', okText: 'Ya, Kembalikan', okStyle: 'success' }
  );
  if (!ok) return;

  try {
    await firebase.database()
      .ref('sgs_candidate_status/' + slug)
      .update({ _archived: null, _unarchivedAt: firebase.database.ServerValue.TIMESTAMP });
    if (overlayEl) overlayEl.remove();
    window.__lastRenderedSignature = null;
    await __fetchAllCandidateStatus();
    __renderResultPageContent();
    showResultToast('📤', 'Kandidat dikembalikan', slug);
  } catch (e) {
    await __alert('Gagal: ' + e.message, '❌ Error');
  }
};

/* ============================================================
   🆕 PENGUMUMAN HASIL SELEKSI
   ============================================================ */
window.__openPengumumanModal = async function(slug, name, position) {
  const old = document.getElementById('rfPengumumanOverlay');
  if (old) old.remove();

  const statusData = window.__candidateStatusMap[slug] || {};
  const currentStatus = statusData.status || '';
  const currentEmailSentAt = statusData.emailSentAt;

  const overlay = document.createElement('div');
  overlay.id = 'rfPengumumanOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 2147483650;
    background: rgba(10,20,35,.92);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; overflow-y: auto;
    font-family: Inter, system-ui, sans-serif;
  `;

  const opt = (val, label, color, desc) => `
    <label style="display: flex; align-items: center; gap: 12px; padding: 14px 16px;
      background: ${currentStatus === val ? color.bg : 'rgba(255,255,255,.04)'};
      border: 2px solid ${currentStatus === val ? color.br : 'rgba(255,255,255,.1)'};
      border-radius: 12px; cursor: pointer; transition: all .15s ease; user-select: none;">
      <input type="radio" name="rfPengumumanStatus" value="${val}" ${currentStatus === val ? 'checked' : ''}
        style="width: 18px; height: 18px; accent-color: ${color.accent}; cursor: pointer; flex: 0 0 auto;">
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 14px; font-weight: 900; color: #fff; margin-bottom: 3px;">${label}</div>
        <div style="font-size: 11.5px; color: #94a3b8; line-height: 1.4;">${desc}</div>
      </div>
    </label>
  `;

  const hasEmail = currentEmailSentAt;

  overlay.innerHTML = `
    <div style="
      width: min(560px, 100%);
      background: linear-gradient(180deg, #1e293b, #0f172a);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 30px 90px rgba(0,0,0,.7);
      color: #e2e8f0;
    ">
      <div style="padding: 20px 24px;
        background: linear-gradient(135deg, #16a34a, #059669);
        color: #fff; display: flex; align-items: center; gap: 14px;">
        <div style="width: 44px; height: 44px; flex: 0 0 44px; display: grid; place-items: center;
          background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.3);
          border-radius: 12px; font-size: 22px;">📢</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 10.5px; font-weight: 800; letter-spacing: 2px; opacity: .85; margin-bottom: 2px;">
            PENGUMUMAN HASIL SELEKSI
          </div>
          <div style="font-size: 16px; font-weight: 900; letter-spacing: -.2px; word-break: break-word;">
            ${__adminEscape(name)}
          </div>
          ${position && position !== '-' ? `<div style="font-size: 11.5px; opacity: .85; margin-top: 2px;">💼 ${__adminEscape(position)}</div>` : ''}
        </div>
        <button id="rfPengumumanCloseBtn" style="
          width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center;
          background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3);
          border-radius: 9px; color: #fff; font-size: 15px; cursor: pointer; font-family: inherit; font-weight: 800;
        ">✕</button>
      </div>

      <div style="padding: 20px 24px 24px;">
        ${hasEmail ? `
          <div style="margin-bottom: 16px; padding: 12px 14px;
            background: rgba(59,130,246,.15); border: 1px solid rgba(59,130,246,.4);
            border-radius: 10px; font-size: 12px; color: #93c5fd; line-height: 1.5;">
            📢 <b>Pengumuman terakhir dikirim:</b><br>
            ${new Date(currentEmailSentAt).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            · status: <b>${statusData.emailSentStatus || '-'}</b>
          </div>
        ` : ''}

        <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px;
          color: #64748b; margin-bottom: 10px;">
          PILIH STATUS KELULUSAN
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px;">
          ${opt('lolos', '✅ Lolos', { bg: 'rgba(34,197,94,.15)', br: 'rgba(34,197,94,.6)', accent: '#16a34a' }, 'Kandidat lolos seleksi — email/WA berisi ucapan selamat + langkah selanjutnya.')}
          ${opt('tidak_lolos', '❌ Tidak Lolos', { bg: 'rgba(239,68,68,.15)', br: 'rgba(239,68,68,.6)', accent: '#dc2626' }, 'Tidak lolos — email/WA berisi pemberitahuan sopan. Kandidat otomatis diarsipkan.')}
          ${opt('dipertimbangkan', '⭐ Dipertimbangkan', { bg: 'rgba(245,158,11,.15)', br: 'rgba(245,158,11,.6)', accent: '#d97706' }, 'Berkas masih dipertimbangkan — kandidat dapat notifikasi untuk tunggu.')}
          ${opt('', '⏳ Pending (Belum Diputuskan)', { bg: 'rgba(148,163,184,.15)', br: 'rgba(148,163,184,.5)', accent: '#94a3b8' }, 'Belum ada keputusan — tidak ada notifikasi dikirim.')}
        </div>

        <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px;
          color: #64748b; margin-bottom: 10px;">
          KIRIM VIA
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 18px;">
          <label style="display: flex; align-items: center; gap: 10px; padding: 12px 14px;
            background: rgba(139,92,246,.1); border: 1.5px solid rgba(139,92,246,.4);
            border-radius: 10px; cursor: pointer; user-select: none;">
            <input type="checkbox" id="rfSendEmail" checked
              style="width: 16px; height: 16px; accent-color: #8b5cf6; cursor: pointer;">
            <span style="font-size: 13px; font-weight: 800; color: #c4b5fd;">📧 Email</span>
          </label>
          <label style="display: flex; align-items: center; gap: 10px; padding: 12px 14px;
            background: rgba(37,211,102,.1); border: 1.5px solid rgba(37,211,102,.4);
            border-radius: 10px; cursor: pointer; user-select: none;">
            <input type="checkbox" id="rfSendWA"
              style="width: 16px; height: 16px; accent-color: #25d366; cursor: pointer;">
            <span style="font-size: 13px; font-weight: 800; color: #86efac;">📱 WhatsApp</span>
          </label>
        </div>

        <div id="rfPengumumanStatus" style="min-height: 18px; font-size: 12px; color: #94a3b8;
          margin-bottom: 12px; line-height: 1.5;"></div>

        <div style="display: flex; gap: 10px;">
          <button id="rfPengumumanCancel" style="flex: 1; padding: 13px; border-radius: 11px;
            background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.15);
            color: #cbd5e1; font-family: inherit; font-size: 13px; font-weight: 800; cursor: pointer;">
            Batal
          </button>
          <button id="rfPengumumanSend" style="flex: 2; padding: 13px; border-radius: 11px;
            background: linear-gradient(135deg, #16a34a, #059669); border: 0;
            color: #fff; font-family: inherit; font-size: 13px; font-weight: 900; cursor: pointer;
            box-shadow: 0 6px 20px rgba(22,163,74,.35);">
            📢 Kirim Pengumuman
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeFn = () => overlay.remove();
  document.getElementById('rfPengumumanCloseBtn').onclick = closeFn;
  document.getElementById('rfPengumumanCancel').onclick = closeFn;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeFn(); });

  document.getElementById('rfPengumumanSend').onclick = async () => {
    const selectedStatus = overlay.querySelector('input[name="rfPengumumanStatus"]:checked')?.value;
    const sendEmail = document.getElementById('rfSendEmail').checked;
    const sendWA = document.getElementById('rfSendWA').checked;
    const statusEl = document.getElementById('rfPengumumanStatus');

    if (selectedStatus === undefined) {
      statusEl.style.color = '#fca5a5';
      statusEl.textContent = '⚠️ Pilih status kelulusan dulu';
      return;
    }
    if (!sendEmail && !sendWA) {
      statusEl.style.color = '#fca5a5';
      statusEl.textContent = '⚠️ Pilih minimal 1 cara kirim (Email atau WA)';
      return;
    }

    const sendBtn = document.getElementById('rfPengumumanSend');
    sendBtn.disabled = true;
    sendBtn.textContent = '⏳ Mengirim...';
    statusEl.style.color = '#93c5fd';
    statusEl.textContent = 'Memproses...';

    try {
      /* 1. Simpan status ke Firebase */
      await firebase.database()
        .ref('sgs_candidate_status/' + slug)
        .update({
          status: selectedStatus,
          candidateName: name,
          candidatePosition: position || '',
          ts: firebase.database.ServerValue.TIMESTAMP,
          updatedBy: 'admin'
        });

      /* 2. Auto arsip kalau tidak lolos */
      if (selectedStatus === 'tidak_lolos') {
        await firebase.database()
          .ref('sgs_candidate_status/' + slug)
          .update({ _archived: true, _archivedAt: firebase.database.ServerValue.TIMESTAMP });
      } else if (selectedStatus === 'lolos') {
        await firebase.database()
          .ref('sgs_candidate_status/' + slug)
          .update({ _archived: null });
      }

      /* 3. Kirim Email */
      if (sendEmail && selectedStatus) {
        statusEl.textContent = '📧 Mencari email kandidat...';
        const email = await (window.__findEmail ? window.__findEmail(slug, name) : Promise.resolve(null));
        if (!email) {
          statusEl.style.color = '#fbbf24';
          statusEl.innerHTML = '⚠️ Email kandidat tidak ditemukan — email dilewati.<br>Lanjut kirim via WA...';
        } else if (typeof window.__sendStatusEmail === 'function') {
          statusEl.textContent = '📧 Mengirim email ke ' + email + '...';
          const okEmail = await window.__sendStatusEmail(slug, name, position, selectedStatus, email);
          if (okEmail) {
            statusEl.style.color = '#86efac';
            statusEl.textContent = '✅ Email terkirim ke ' + email;
          } else {
            statusEl.style.color = '#fca5a5';
            statusEl.textContent = '❌ Gagal kirim email';
          }
        }
      }

      /* 4. Kirim WA */
      if (sendWA && selectedStatus) {
        statusEl.textContent = '📱 Mencari nomor WA kandidat...';
        let phone = await (window.__findPhone ? window.__findPhone(slug, name) : Promise.resolve(null));
        if (!phone) {
          const input = (typeof window.sgsPrompt === 'function')
            ? await window.sgsPrompt('Nomor WA tidak ditemukan. Masukkan manual (08xxx):', '', { title: '📱 Nomor WA', okText: 'Kirim WA' })
            : prompt('Nomor WA (08xxx):');
          if (input) {
            phone = String(input).trim();
            try {
              await firebase.database().ref('sgs_candidate_status/' + slug).update({ phone });
            } catch (e) {}
          }
        }
        if (phone) {
          const norm = window.__normalizePhoneWA ? window.__normalizePhoneWA(phone) : phone;
          const msg = window.__buildWAMessage ? window.__buildWAMessage(selectedStatus, name, position) : '';
          if (norm && msg) {
            const waUrl = 'https://wa.me/' + norm + '?text=' + encodeURIComponent(msg);
            window.open(waUrl, '_blank', 'noopener,noreferrer');
            statusEl.style.color = '#86efac';
            statusEl.textContent = '✅ WhatsApp dibuka di tab baru';
          }
        } else {
          statusEl.style.color = '#fbbf24';
          statusEl.textContent = '⚠️ WA dilewati (nomor tidak tersedia)';
        }
      }

      /* 5. Refresh cache status + UI */
      await __fetchAllCandidateStatus();
      window.__lastRenderedSignature = null;

      setTimeout(() => {
        overlay.remove();
        __renderResultPageContent();
        showResultToast('📢', 'Pengumuman terkirim untuk ' + name, selectedStatus.toUpperCase().replace('_',' '));
      }, 1200);

    } catch (err) {
      sendBtn.disabled = false;
      sendBtn.textContent = '📢 Kirim Pengumuman';
      statusEl.style.color = '#fca5a5';
      statusEl.textContent = '❌ Gagal: ' + err.message;
    }
  };
};

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

        <button onclick="openAssessorSettingsPage()" style="width: 100%; padding: 20px 22px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 2px solid #93c5fd;
          border-radius: 14px; margin-bottom: 16px; cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: space-between; gap: 14px; text-align: left;">
          <div style="display: flex; align-items: center; gap: 14px; min-width: 0;">
            <div style="width: 48px; height: 48px; flex: 0 0 48px; display: grid; place-items: center;
              background: linear-gradient(135deg, #3b82f6, #1e40af); border-radius: 14px; font-size: 22px;">👥</div>
            <div style="min-width: 0;">
              <div style="font-size: 15px; font-weight: 900; color: #1e3a8a; margin-bottom: 4px;">Kelola Asesor</div>
              <div style="font-size: 12px; font-weight: 700; color: #1e40af;">Daftar nama untuk Interview &amp; FGD</div>
            </div>
          </div>
          <div style="padding: 10px 18px; background: linear-gradient(135deg, #3b82f6, #1e40af); color: #fff;
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

  let waited = 0;
  while ((typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) && waited < 30) {
    await new Promise(r => setTimeout(r, 100));
    waited++;
  }
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    console.error('[ADMIN] Firebase tidak siap setelah 3s — abort');
    return false;
  }
  console.log('[ADMIN] Firebase ready setelah ' + (waited * 100) + 'ms');

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
   🆕 SUBJECT TEST — Hasil Koreksi (realtime)
   ============================================================ */
const __subjectRealtimeListeners = new Map();

const SUBJECT_RATING_MAP = {
  1: { label: '❌ Not Rec', color: '#fca5a5', bg: 'rgba(239,68,68,.15)',  border: 'rgba(239,68,68,.45)' },
  2: { label: '⚠️ Fairly',  color: '#fcd34d', bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.45)' },
  3: { label: '✅ Rec',     color: '#86efac', bg: 'rgba(34,197,94,.15)',  border: 'rgba(34,197,94,.45)' },
  4: { label: '🌟 Highly',  color: '#5eead4', bg: 'rgba(13,148,136,.2)',  border: 'rgba(13,148,136,.55)' }
};

function __renderSubjectBox(assessData, imagesData, slug, name, position) {
  const assessments = (assessData && assessData.assessments) || {};
  const imagesMap = (imagesData && imagesData.images) || {};
  const imageKeys = Object.keys(imagesMap);
  const hasImages = imageKeys.length > 0;

  const keys = Object.keys(assessments).filter(k => {
    const a = assessments[k];
    return a && typeof a.rating === 'number' && a.rating >= 1 && a.rating <= 4;
  });

  /* Card hilang jika TIDAK ada korektor submit DAN TIDAK ada foto jawaban */
  if (keys.length === 0 && !hasImages) return '';

  const ratings = keys.map(k => Number(assessments[k].rating)).filter(v => v >= 1 && v <= 4);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  const rowsHTML = keys.map(k => {
    const a = assessments[k] || {};
    const rating = Number(a.rating) || 0;
    const rMap = SUBJECT_RATING_MAP[rating] || SUBJECT_RATING_MAP[1];
    const hasNotes = a.notes && String(a.notes).trim().length > 0;
    const hasPhoto = a.notePhotoUrl && String(a.notePhotoUrl).length > 0;
    return `
      <div class="js-subject-row" data-kode="${__adminEscape(k)}"
        style="display:flex;align-items:center;gap:8px;padding:8px 10px;
          background:rgba(255,255,255,.03);border:1px solid rgba(13,148,136,.25);
          border-radius:9px;margin-bottom:6px;flex-wrap:wrap;">
        <div style="width:30px;height:30px;flex:0 0 30px;display:grid;place-items:center;
          background:linear-gradient(135deg,#0d9488,#14b8a6);color:#fff;border-radius:8px;
          font-weight:900;font-size:10px;letter-spacing:.5px;">
          ${__adminEscape(String(k).slice(0,3).toUpperCase())}
        </div>
        <div style="flex:1;min-width:100px;">
          <div style="font-weight:900;font-size:12.5px;color:#fff;line-height:1.2;">
            ${__adminEscape(a.assessorName || k)}
          </div>
          <div style="font-size:10.5px;color:#94a3b8;margin-top:1px;">
            ⭐ ${rating.toFixed(1)}${hasNotes ? ' · 📝 catatan' : ''}${hasPhoto ? ' · 📷' : ''}
          </div>
        </div>
        <span style="padding:2px 8px;border-radius:999px;font-size:9.5px;font-weight:800;
          background:${rMap.bg};border:1px solid ${rMap.border};color:${rMap.color};
          white-space:nowrap;">${rMap.label}</span>
      </div>`;
  }).join('');

  return `
    <div class="js-subject-box" data-slug="${__adminEscape(slug)}"
      style="padding:12px;margin-bottom:12px;
        background:linear-gradient(135deg,rgba(13,148,136,.08),rgba(20,184,166,.05));
        border:1.5px solid rgba(13,148,136,.35);border-radius:14px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
        <div style="width:32px;height:32px;flex:0 0 32px;display:grid;place-items:center;
          background:linear-gradient(135deg,#0d9488,#14b8a6);border-radius:9px;font-size:16px;">📚</div>
        <div style="flex:1;min-width:100px;">
          <div style="font-size:12px;font-weight:900;color:#5eead4;">Hasil Tes Subject</div>
          <div style="font-size:10px;color:#94a3b8;">
            ${keys.length} korektor submit${hasImages ? ' · ' + imageKeys.length + ' foto jawaban' : ''}
          </div>
        </div>
        ${hasImages ? `
        <button class="js-subject-images"
          data-slug="${__adminEscape(slug)}"
          data-name="${__adminEscape(name)}"
          style="padding:5px 12px;background:rgba(59,130,246,.2);
            border:1px solid rgba(59,130,246,.5);border-radius:8px;
            color:#93c5fd;font-family:inherit;font-size:10.5px;font-weight:800;
            cursor:pointer;white-space:nowrap;">
          📷 Lihat Foto
        </button>
        ` : ''}
        ${keys.length > 0 ? `
        <button class="js-subject-detail"
          data-slug="${__adminEscape(slug)}"
          data-name="${__adminEscape(name)}"
          data-position="${__adminEscape(position)}"
          style="padding:5px 12px;background:rgba(13,148,136,.2);
            border:1px solid rgba(13,148,136,.5);border-radius:8px;
            color:#5eead4;font-family:inherit;font-size:10.5px;font-weight:800;
            cursor:pointer;white-space:nowrap;">
          👁️ Lihat Koreksi
        </button>
        ` : ''}
        ${keys.length > 0 ? `
        <div style="padding:5px 10px;background:rgba(34,197,94,.15);
          border:1px solid rgba(34,197,94,.4);border-radius:999px;
          font-size:10.5px;font-weight:900;color:#86efac;
          white-space:nowrap;font-variant-numeric:tabular-nums;">
          ⭐ ${avg.toFixed(2)}
        </div>
        ` : ''}
      </div>
      ${rowsHTML}
    </div>`;
}

function __attachSubjectRealtime(slug, wrapper, name, position) {
  __detachSubjectRealtime(slug);
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    wrapper.innerHTML = '<div style="padding:14px;text-align:center;color:#f87171;font-size:11.5px;">❌ Firebase belum siap</div>';
    return;
  }
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const refAssess = firebase.database().ref('sgs_subject_assessments/' + safeSlug);
  const refImages = firebase.database().ref('sgs_subject_images/' + safeSlug);

  let assessData = null;
  let imgData = null;

  const render = () => {
    if (!wrapper.isConnected) { __detachSubjectRealtime(slug); return; }
    try {
      wrapper.innerHTML = __renderSubjectBox(assessData, imgData, slug, name, position);
    } catch (e) {
      console.warn('[SUBJECT-REALTIME] render error:', e.message);
    }
  };

  const cbAssess = (snap) => { assessData = snap.val(); render(); };
  const cbImages = (snap) => { imgData = snap.val(); render(); };

  refAssess.on('value', cbAssess);
  refImages.on('value', cbImages);

  __subjectRealtimeListeners.set(slug, {
    ref: {
      off: () => {
        try { refAssess.off('value', cbAssess); } catch (e) {}
        try { refImages.off('value', cbImages); } catch (e) {}
      }
    },
    cb: null
  });
}

function __detachSubjectRealtime(slug) {
  if (!slug) return;
  const item = __subjectRealtimeListeners.get(slug);
  if (!item) return;
  try {
    if (item.ref && typeof item.ref.off === 'function') item.ref.off();
  } catch (e) {}
  __subjectRealtimeListeners.delete(slug);
}

function __detachAllSubjectRealtime() {
  __subjectRealtimeListeners.forEach((item) => {
    try { item.ref.off('value', item.cb); } catch (e) {}
  });
  __subjectRealtimeListeners.clear();
}

/* Modal detail: tab per korektor */
window.__openSubjectDetailModal = async function (slug, name, position) {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    await __alert('Firebase belum siap', '❌ Error');
    return;
  }

  let data;
  try {
    const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const snap = await firebase.database().ref('sgs_subject_assessments/' + safeSlug).once('value');
    data = snap.val() || {};
  } catch (e) {
    await __alert('Gagal ambil data: ' + e.message, '❌ Error');
    return;
  }

  const assessments = data.assessments || {};
  const keys = Object.keys(assessments).filter(k => assessments[k] && typeof assessments[k].rating === 'number');
  if (keys.length === 0) {
    await __alert('Belum ada korektor submit.', '⚠️ Kosong');
    return;
  }

  const old = document.getElementById('subjectDetailModal');
  if (old) old.remove();

  let activeKode = keys[0];

  const ov = document.createElement('div');
  ov.id = 'subjectDetailModal';
  ov.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

  function renderTabs() {
    return keys.map(k => {
      const a = assessments[k];
      const rMap = SUBJECT_RATING_MAP[Number(a.rating)] || SUBJECT_RATING_MAP[1];
      const active = k === activeKode;
      return `
        <button class="js-subj-tab" data-kode="${__adminEscape(k)}"
          style="padding:10px 16px;border:0;border-radius:10px;
            background:${active ? 'linear-gradient(135deg,#0d9488,#14b8a6)' : 'rgba(255,255,255,.06)'};
            color:${active ? '#fff' : '#cbd5e1'};font-family:inherit;
            font-size:12px;font-weight:900;cursor:pointer;
            white-space:nowrap;display:inline-flex;align-items:center;gap:6px;">
          ${__adminEscape(String(k).slice(0,3).toUpperCase())}
          <span style="padding:1px 6px;border-radius:999px;font-size:9px;
            background:${rMap.bg};border:1px solid ${rMap.border};color:${rMap.color};">
            ${a.rating}
          </span>
        </button>`;
    }).join('');
  }

  function renderContent() {
    const a = assessments[activeKode] || {};
    const rating = Number(a.rating) || 0;
    const rMap = SUBJECT_RATING_MAP[rating] || SUBJECT_RATING_MAP[1];
    const notes = String(a.notes || '').trim() || '(tidak ada catatan)';
    const photoUrl = String(a.notePhotoUrl || '').trim();
    const noteMime = String(a.noteFileMime || '').trim();
    const noteName = String(a.noteFileName || '').trim();
    const isImageFile = /^image\//i.test(noteMime) || /\.(jpg|jpeg|png|webp|gif)$/i.test(photoUrl);
    const ts = a.ts ? new Date(a.ts).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '-';

    return `
      <div style="padding:20px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
          <div style="width:44px;height:44px;flex:0 0 44px;display:grid;place-items:center;
            background:linear-gradient(135deg,#0d9488,#14b8a6);border-radius:11px;
            color:#fff;font-weight:900;font-size:13px;">${__adminEscape(String(activeKode).slice(0,3).toUpperCase())}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:16px;font-weight:900;color:#fff;">${__adminEscape(a.assessorName || activeKode)}</div>
            <div style="font-size:11.5px;color:#94a3b8;margin-top:2px;">📅 ${ts}</div>
          </div>
          <span style="padding:6px 14px;border-radius:999px;font-size:11px;font-weight:900;
            background:${rMap.bg};border:1.5px solid ${rMap.border};color:${rMap.color};">
            ${rating} — ${rMap.label}
          </span>
        </div>

        <div style="padding:14px;background:rgba(13,148,136,.08);
          border:1px solid rgba(13,148,136,.3);border-radius:12px;margin-bottom:14px;">
          <div style="font-size:10.5px;font-weight:900;color:#5eead4;letter-spacing:1px;margin-bottom:8px;">
            📝 CATATAN KOREKSI
          </div>
          <div style="font-size:13.5px;color:#e2e8f0;line-height:1.7;white-space:pre-wrap;word-break:break-word;">
            ${__adminEscape(notes)}
          </div>
        </div>

                ${photoUrl ? (isImageFile ? `
          <div style="padding:14px;background:rgba(13,148,136,.08);
            border:1px solid rgba(13,148,136,.3);border-radius:12px;">
            <div style="font-size:10.5px;font-weight:900;color:#5eead4;letter-spacing:1px;margin-bottom:8px;">
              📷 FOTO CATATAN
            </div>
            <img src="${__adminEscape(photoUrl)}" alt="Catatan korektor"
              style="width:100%;max-height:420px;object-fit:contain;border-radius:10px;
                background:#fff;cursor:zoom-in;"
              onclick="window.open(this.src,'_blank','noopener,noreferrer')">
            ${noteName ? `<div style="font-size:10.5px;color:#64748b;margin-top:8px;word-break:break-all;">📎 ${__adminEscape(noteName)}</div>` : ''}
          </div>
        ` : `
          <div style="padding:14px;background:rgba(13,148,136,.08);
            border:1px solid rgba(13,148,136,.3);border-radius:12px;">
            <div style="font-size:10.5px;font-weight:900;color:#5eead4;letter-spacing:1px;margin-bottom:8px;">
              📎 LAMPIRAN DOKUMEN CATATAN
            </div>
            <a href="${__adminEscape(photoUrl)}" target="_blank" rel="noopener noreferrer"
              style="display:flex;align-items:center;gap:12px;padding:14px;
                background:#fff;border:1px solid #5eead4;border-radius:10px;
                text-decoration:none;color:#0f766e;">
              <div style="font-size:32px;line-height:1;">
                ${(/pdf/i.test(noteMime) || /\.pdf$/i.test(photoUrl)) ? '📄' : '📝'}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:900;color:#0f766e;word-break:break-all;">
                  ${__adminEscape(noteName || ((/pdf/i.test(noteMime) || /\.pdf$/i.test(photoUrl)) ? 'Dokumen PDF' : 'Dokumen Word'))}
                </div>
                <div style="font-size:11px;color:#64748b;margin-top:3px;">
                  Klik untuk membuka di tab baru
                </div>
              </div>
              <div style="font-size:18px;color:#0d9488;">↗</div>
            </a>
          </div>
        `) : `
          <div style="padding:14px;background:rgba(148,163,184,.08);
            border:1px solid rgba(148,163,184,.25);border-radius:12px;
            text-align:center;font-size:12px;color:#94a3b8;">
            📷 Tidak ada lampiran catatan
          </div>
        `}
      </div>`;
  }

  function renderAll() {
    ov.innerHTML = `
      <div style="width:min(720px,100%);max-height:calc(100vh - 40px);
        background:linear-gradient(180deg,#1e293b,#0f172a);
        border:1.5px solid rgba(13,148,136,.4);border-radius:18px;
        overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);
        color:#e2e8f0;display:flex;flex-direction:column;">
        <div style="padding:16px 20px;background:linear-gradient(135deg,#0d9488,#14b8a6);
          display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;display:grid;place-items:center;
            background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);
            border-radius:11px;font-size:20px;">📚</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">HASIL KOREKSI SUBJECT</div>
            <div style="font-size:15px;font-weight:900;color:#fff;margin-top:2px;word-break:break-word;">
              ${__adminEscape(name)}
            </div>
            ${position && position !== '-' ? `<div style="font-size:11px;opacity:.85;margin-top:2px;">💼 ${__adminEscape(position)}</div>` : ''}
          </div>
          <button id="subjDetailClose"
            style="width:36px;height:36px;display:grid;place-items:center;
              background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);
              border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>
        </div>

        <div style="padding:12px 20px;background:rgba(0,0,0,.28);
          border-bottom:1px solid rgba(255,255,255,.06);display:flex;gap:8px;
          flex-wrap:wrap;overflow-x:auto;">
          ${renderTabs()}
        </div>

        <div class="subj-detail-scroll" style="flex:1;overflow-y:auto;">
          ${renderContent()}
        </div>
      </div>
    `;

    ov.querySelector('#subjDetailClose').onclick = () => ov.remove();
    ov.querySelectorAll('.js-subj-tab').forEach(btn => {
      btn.onclick = () => {
        activeKode = btn.getAttribute('data-kode');
        renderAll();
      };
    });
  }

  renderAll();
  document.body.appendChild(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
};

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
        const prev = copyBtn.textContent;
        copyBtn.textContent = '⏳';
        copyBtn.disabled = true;
        copyTextSafe(password, { title: 'Password PDF' }).then(result => {
          copyBtn.disabled = false;
          if (result === true) {
            copyBtn.textContent = '✓';
          } else if (result === null) {
            copyBtn.textContent = '📋';
          } else {
            copyBtn.textContent = '⚠️';
          }
          setTimeout(() => { copyBtn.textContent = prev; }, 1400);
        }).catch(() => {
          copyBtn.disabled = false;
          copyBtn.textContent = prev;
        });
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

    /* 🆕 Folder click → open overlay */
    const folderEl = e.target.closest('.js-open-folder');
    if (folderEl) {
      e.preventDefault(); e.stopPropagation();
      const candidateKey = folderEl.getAttribute('data-candidate-key');
      if (candidateKey && typeof window.__openCandidateFolder === 'function') {
        window.__openCandidateFolder(candidateKey);
      }
      return;
    }

    /* 🆕 Tombol Pengumuman di overlay */
    const pengumumanBtn = e.target.closest('.js-pengumuman-open');
    if (pengumumanBtn) {
      e.preventDefault(); e.stopPropagation();
      const slug = pengumumanBtn.getAttribute('data-slug');
      const name = pengumumanBtn.getAttribute('data-name');
      const position = pengumumanBtn.getAttribute('data-position');
      if (slug && name && typeof window.__openPengumumanModal === 'function') {
        window.__openPengumumanModal(slug, name, position);
      }
      return;
    }

    const zipBtn = e.target.closest('.js-download-zip');
    if (zipBtn) {
      e.preventDefault(); e.stopPropagation();
      const key = zipBtn.getAttribute('data-candidate-key');
      if (key && typeof downloadCandidateZip === 'function') downloadCandidateZip(key);
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

    const interviewBtn = e.target.closest('.js-interview-link');
    if (interviewBtn) {
      e.preventDefault(); e.stopPropagation();
      const name = interviewBtn.getAttribute('data-name');
      const position = interviewBtn.getAttribute('data-position');
      if (name && typeof window.openInterviewLink === 'function') {
        window.openInterviewLink(name, position);
      }
      return;
    }

    const grafindoBtn = e.target.closest('.js-grafindo-link');
    if (grafindoBtn) {
      e.preventDefault(); e.stopPropagation();
      const name = grafindoBtn.getAttribute('data-name');
      const position = grafindoBtn.getAttribute('data-position');
      if (name && typeof window.openGrafisInterpLink === 'function') {
        window.openGrafisInterpLink(name, position);
      }
      return;
    }

       /* 🆕 Technical Link */
    const technicalLinkBtn = e.target.closest('.js-technical-link');
    if (technicalLinkBtn) {
      e.preventDefault(); e.stopPropagation();
      const name = technicalLinkBtn.getAttribute('data-name');
      const position = technicalLinkBtn.getAttribute('data-position');
      if (name && typeof window.openTechnicalLink === 'function') {
        window.openTechnicalLink(name, position);
      }
      return;
    }

    /* 🆕 Subject Link */
    const subjectLinkBtn = e.target.closest('.js-subject-link');
    if (subjectLinkBtn) {
      e.preventDefault(); e.stopPropagation();
      const name = subjectLinkBtn.getAttribute('data-name');
      const position = subjectLinkBtn.getAttribute('data-position');
      if (name && typeof window.openSubjectLink === 'function') {
        window.openSubjectLink(name, position);
      }
      return;
    }

    /* 🆕 Subject Images Viewer */
    const subjImagesBtn = e.target.closest('.js-subject-images');
    if (subjImagesBtn) {
      e.preventDefault(); e.stopPropagation();
      const slug = subjImagesBtn.getAttribute('data-slug');
      const name = subjImagesBtn.getAttribute('data-name');
      if (slug && typeof window.__openSubjectImagesModal === 'function') {
        window.__openSubjectImagesModal(slug, name);
      }
      return;
    }
    /* 🆕 Subject Detail modal */
    const subjectDetailBtn = e.target.closest('.js-subject-detail');
    if (subjectDetailBtn) {
      e.preventDefault();
      e.stopPropagation();
      const slug = subjectDetailBtn.getAttribute('data-slug');
      const name = subjectDetailBtn.getAttribute('data-name');
      const position = subjectDetailBtn.getAttribute('data-position');
      if (slug && name && typeof window.__openSubjectDetailModal === 'function') {
        window.__openSubjectDetailModal(slug, name, position);
      }
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

window.__extractInterviewer = __extractInterviewer;
window.__extractAssessorGrafis = __extractAssessorGrafis;
window.__renderWawancaraBox = __renderWawancaraBox;
window.__renderGrafisBox = __renderGrafisBox;
window.downloadCandidateZip = downloadCandidateZip;
window.__normalizeCandidateKey = __normalizeCandidateKey;
window.__openCandidateFolder = window.__openCandidateFolder;

/* 🆕 Subject Test exports */
window.__renderSubjectBox = __renderSubjectBox;
window.__attachSubjectRealtime = __attachSubjectRealtime;
window.__detachSubjectRealtime = __detachSubjectRealtime;
window.__detachAllSubjectRealtime = __detachAllSubjectRealtime;

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
window.addEventListener('beforeunload', () => {
  try {
    if (typeof window.__detachAllSubjectRealtime === 'function') {
      window.__detachAllSubjectRealtime();
    }
  } catch (e) {}
});
/* ============================================================
   🆕 MODAL KIRIM LINK SUBJEK
   ============================================================ */
window.openSubjectLink = function (candidateName, candidatePosition) {
  const base = window.location.origin + window.location.pathname;
  const url = base + '?subjectdo=1&n=' + encodeURIComponent(candidateName) + '&p=' + encodeURIComponent(candidatePosition);

  const old = document.getElementById('subjLinkModal');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'subjLinkModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

  modal.innerHTML = `
    <div style="width:min(480px,100%);background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.5);">
      <div style="padding:24px 26px;background:linear-gradient(135deg,#0d9488,#14b8a6);color:#fff;">
        <div style="font-size:11px;font-weight:800;letter-spacing:2px;opacity:.85;margin-bottom:6px;">KOREKSI SUBJECT · LINK UMUM</div>
        <div style="font-size:20px;font-weight:900;">📚 Link Korektor</div>
      </div>
      <div style="padding:22px 26px;">
        <div style="padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:16px;">
          <div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:6px;">KANDIDAT</div>
          <div style="font-size:14px;font-weight:800;color:#1e293b;">${__adminEscape(candidateName)}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">💼 ${__adminEscape(candidatePosition || '(tanpa posisi)')}</div>
        </div>
        <div style="margin-bottom:18px;font-size:12px;color:#475569;line-height:1.6;">
          Bagikan link ini ke grup korektor. Saat dibuka, mereka akan diminta <b>memilih nama mereka sendiri</b> dari daftar.
        </div>
        <div style="display:flex;gap:10px;">
          <button id="subjGenBtn" style="flex:2;padding:14px;border:0;border-radius:12px;background:linear-gradient(135deg,#0d9488,#14b8a6);color:#fff;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer;">📋 Copy Link</button>
          <button id="subjLinkClose" style="flex:1;padding:14px;border:0;border-radius:12px;background:#f1f5f9;color:#475569;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer;">Tutup</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById('subjLinkClose').onclick = () => modal.remove();

  document.getElementById('subjGenBtn').onclick = async () => {
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(url);
      else prompt('Copy link manual:', url);
      const btn = document.getElementById('subjGenBtn');
      btn.innerHTML = '✅ Tersalin!';
      btn.style.background = '#dcfce7';
      btn.style.color = '#166534';
      setTimeout(() => { btn.innerHTML = '📋 Copy Link'; btn.style.background = 'linear-gradient(135deg,#0d9488,#14b8a6)'; btn.style.color = '#fff'; }, 2000);
    } catch (e) { prompt('Copy link manual:', url); }
  };
};

/* ============================================================
   🆕 MODAL LIHAT FOTO JAWABAN SUBJECT
   ============================================================ */
window.__openSubjectImagesModal = async function (slug, candidateName) {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    await __alert('Firebase belum siap', '❌ Error'); return;
  }

  let data;
  try {
    const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const snap = await firebase.database().ref('sgs_subject_images/' + safeSlug).once('value');
    data = snap.val();
  } catch (e) {
    await __alert('Gagal ambil foto: ' + e.message, '❌ Error'); return;
  }

  if (!data || !data.images) {
    await __alert('Kandidat belum mengupload foto jawaban.', '⚠️ Kosong'); return;
  }

  const images = Object.values(data.images);
  const old = document.getElementById('subjImagesModal');
  if (old) old.remove();

  const ov = document.createElement('div');
  ov.id = 'subjImagesModal';
  ov.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.94);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

  ov.innerHTML = `
    <div style="width:min(920px,100%);max-height:calc(100vh - 40px);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(59,130,246,.4);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;display:flex;flex-direction:column;">
      <div style="padding:16px 20px;background:linear-gradient(135deg,#1e40af,#3b82f6);display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.18);border-radius:11px;font-size:20px;">📷</div>
        <div style="flex:1;">
          <div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">FOTO JAWABAN SUBJECT</div>
          <div style="font-size:15px;font-weight:900;color:#fff;margin-top:2px;">${__adminEscape(candidateName)}</div>
        </div>
        <button id="subjImgClose" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;">
        ${images.map((img, i) => `
          <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;overflow:hidden;cursor:zoom-in;" onclick="window.open('${img.dataUrl}','_blank')">
            <img src="${img.dataUrl}" style="width:100%;height:260px;object-fit:contain;background:#000;">
            <div style="padding:10px;text-align:center;font-size:12px;font-weight:800;color:#93c5fd;">📄 Halaman ${i + 1}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(ov);
  document.getElementById('subjImgClose').onclick = () => ov.remove();
  ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
};

/* ============================================================
   🆕 MODAL KIRIM LINK TEKNIS
   ============================================================ */
window.openTechnicalLink = function (candidateName, candidatePosition) {
  const base = window.location.origin + window.location.pathname;

  const old = document.getElementById('techLinkModal');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'techLinkModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

  modal.innerHTML = `
    <div style="width:min(480px,100%);background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.5);">
      <div style="padding:24px 26px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;">
        <div style="font-size:11px;font-weight:800;letter-spacing:2px;opacity:.85;margin-bottom:6px;">KEMAMPUAN TEKNIS · ADMIN ONLY</div>
        <div style="font-size:20px;font-weight:900;">🔧 Kirim Link ke Assessor</div>
      </div>
      <div style="padding:22px 26px;">
        <div style="padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:16px;">
          <div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:6px;">KANDIDAT</div>
          <div style="font-size:14px;font-weight:800;color:#1e293b;">${__adminEscape(candidateName)}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">💼 ${__adminEscape(candidatePosition || '(tanpa posisi)')}</div>
        </div>
        
        <div style="margin-bottom:18px;">
          <label style="font-size:12px;font-weight:800;color:#475569;display:block;margin-bottom:8px;">MASUKKAN NAMA ASSESSOR</label>
          <input type="text" id="techAssessorName" placeholder="Contoh: Deni Pragas" autocomplete="off" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:14px;box-sizing:border-box;outline:none;transition:all .15s ease;">
        </div>

        <div style="display:flex;gap:10px;">
          <button id="techGenBtn" style="flex:2;padding:14px;border:0;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer;">🔗 Generate Link</button>
          <button id="techLinkClose" style="flex:1;padding:14px;border:0;border-radius:12px;background:#f1f5f9;color:#475569;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer;">Tutup</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const input = modal.querySelector('#techAssessorName');
  setTimeout(() => input.focus(), 100);
  
  input.addEventListener('focus', () => { input.style.borderColor = '#6366f1'; input.style.boxShadow = '0 0 0 3px rgba(99,102,241,.15)'; });
  input.addEventListener('blur', () => { input.style.borderColor = '#e2e8f0'; input.style.boxShadow = 'none'; });

  document.getElementById('techLinkClose').onclick = () => modal.remove();
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  const genBtn = document.getElementById('techGenBtn');
  
  const generateLink = async () => {
    const kode = (input.value || '').trim();
    if (!kode) {
      input.style.borderColor = '#ef4444';
      input.focus();
      return;
    }
    
    const url = base + '?technicaldo=1&n=' + encodeURIComponent(candidateName)
              + '&p=' + encodeURIComponent(candidatePosition)
              + '&kode=' + encodeURIComponent(kode);
    
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(url);
      else prompt('Copy link manual:', url);
      
      const prev = genBtn.innerHTML;
      genBtn.style.background = '#dcfce7';
      genBtn.style.color = '#166534';
      genBtn.innerHTML = '✅ Link Tersalin!';
      
      setTimeout(() => {
        genBtn.style.background = 'linear-gradient(135deg,#6366f1,#8b5cf6)';
        genBtn.style.color = '#fff';
        genBtn.innerHTML = prev;
        input.value = ''; 
        input.focus();
      }, 2000);
    } catch (e) {
      prompt('Copy link manual:', url);
    }
  };

  genBtn.onclick = generateLink;
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') generateLink(); });
};

console.log('[ADMIN] ✓ Loaded — SECURED + REAL-TIME SIGNAL + GRAFIS + ZIP + FOLDER OVERLAY + IST SECTION + SUBJECT + TECHNICAL');