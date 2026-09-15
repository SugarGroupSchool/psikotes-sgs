/* ============================================================
   js/00b-admin.js
   - Admin panel: LOCK kontrol + 2 password (Fresh & Used)
   - Login gate: butuh password untuk akses panel
   - Monitoring kandidat aktif (real-time)
   - Chat per kandidat
   - Unread tracker (badge + blink)
   - Tombol "Izinkan Tes Lagi" untuk device finished
   - Auto-cleanup chat device tidak aktif
   ============================================================ */

/* ============================================================
   KONFIGURASI LOGIN ADMIN
   ============================================================ */
const ADMIN_PANEL_PASSWORD = 'pragas ganteng 191225';
const ADMIN_SESSION_KEY     = '_sgs_admin_logged_in';

/* ============================================================
   KONFIGURASI AUTO-CLEANUP CHAT
   ============================================================ */
const CHAT_CLEANUP_ENABLED        = true;
const CHAT_CLEANUP_AGE_MS         = 60 * 60 * 1000;  // 1 jam tidak aktif → hapus
const CHAT_CLEANUP_DELETE_SESSION = true;

/* ============================================================
   ADMIN UNREAD TRACKER (global per device)
   ============================================================ */
window.__adminUnreadMap = {};
window.__adminLastSessions = [];

let __adminUnreadRefs = [];
let __adminRefreshTimer = null;

function startAdminUnreadTracker() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;

  // ✅ Skip kalau sudah jalan — jangan restart
  if (__adminUnreadRefs.length > 0) {
    console.log('[ADMIN] 👂 Unread tracker sudah jalan, skip restart');
    return;
  }

  const chatsRef = firebase.database().ref('sgs_state/chats');

  const onRoomAdded = (roomSnap) => {
    const deviceId = roomSnap.key;
    const queryRef = roomSnap.ref.child('messages')
      .orderByChild('from').equalTo('candidate');

    const onMsgsChange = (snap) => {
      let count = 0;
      snap.forEach(ch => { if (!ch.val()?.read) count++; });
      window.__adminUnreadMap[deviceId] = count;
      scheduleAdminRefresh();
    };

    queryRef.on('value', onMsgsChange);
    __adminUnreadRefs.push({ ref: queryRef, cb: onMsgsChange, type: 'value' });
  };

  chatsRef.on('child_added', onRoomAdded);
  __adminUnreadRefs.push({ ref: chatsRef, cb: onRoomAdded, type: 'child_added' });

  console.log('[ADMIN] 👂 Unread tracker started');
}

function stopAdminUnreadTracker() {
  __adminUnreadRefs.forEach(({ ref, cb, type }) => {
    try {
      if (type === 'child_added') ref.off('child_added', cb);
      else ref.off('value', cb);
    } catch (e) {}
  });
  __adminUnreadRefs = [];
  console.log('[ADMIN] 🔇 Unread tracker stopped');
}

function scheduleAdminRefresh() {
  clearTimeout(__adminRefreshTimer);
  __adminRefreshTimer = setTimeout(() => {
    const container = document.getElementById('adminActiveSessions');
    if (!container) return;
    if (window.__adminLastSessions) {
      container.innerHTML = renderActiveSessionsHTML(window.__adminLastSessions);
    }
  }, 200);
}

/* ============================================================
   STORAGE HELPERS
   ============================================================ */
function getLockState() {
  return localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LOCK_ALL) === '1';
}

function setLockState(locked) {
  try {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.LOCK_ALL, locked ? '1' : '0');
  } catch (e) {}
}

function getFreshPwd() {
  return localStorage.getItem(APP_CONFIG.STORAGE_KEYS.PWD_FRESH) || APP_CONFIG.DEFAULT_FRESH_PWD;
}

function getUsedPwd() {
  return localStorage.getItem(APP_CONFIG.STORAGE_KEYS.PWD_USED) || APP_CONFIG.DEFAULT_USED_PWD;
}

function setFreshPwd(pwd) {
  try { localStorage.setItem(APP_CONFIG.STORAGE_KEYS.PWD_FRESH, pwd); } catch (e) {}
}

function setUsedPwd(pwd) {
  try { localStorage.setItem(APP_CONFIG.STORAGE_KEYS.PWD_USED, pwd); } catch (e) {}
}

/* ============================================================
   DETEKSI URL ADMIN
   ============================================================ */
function isAdminUrl() {
  try {
    const url = new URL(window.location.href);
    const key = APP_CONFIG.ADMIN_KEY;
    return (
      url.searchParams.get('admin') === key ||
      url.hash === '#' + key
    );
  } catch (e) {
    return false;
  }
}

/* ============================================================
   TOGGLE LOCK
   ============================================================ */
function toggleLockState() {
  const cb = document.getElementById('adminLockCheckbox');
  if (!cb) return;
  const locked = cb.checked;
  setLockState(locked);
  console.log('[ADMIN] Lock state:', locked ? 'LOCKED' : 'UNLOCKED');
  renderAdminPanel();
}

/* ============================================================
   COPY KE CLIPBOARD
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
    navigator.clipboard.writeText(text).then(done).catch(() => {
      fallbackCopy(text); done();
    });
  } catch (e) {
    fallbackCopy(text); done();
  }
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
   HTML ESCAPE
   ============================================================ */
function __adminEscape(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ============================================================
   REGENERATE PASSWORDS
   ============================================================ */
function regenFreshPwd() {
  if (!confirm('Generate password FRESH baru? Password lama hangus.')) return;
  const newPwd = APP_CONFIG.generateRandomPassword('SGS-F-');
  setFreshPwd(newPwd);
  console.log('[ADMIN] Fresh pwd baru:', newPwd);
  renderAdminPanel();
}

function regenUsedPwd() {
  if (!confirm('Generate password USED baru? Password lama hangus.')) return;
  const newPwd = APP_CONFIG.generateRandomPassword('SGS-U-');
  setUsedPwd(newPwd);
  console.log('[ADMIN] Used pwd baru:', newPwd);
  renderAdminPanel();
}

/* ============================================================
   SET PASSWORD MANUAL
   ============================================================ */
function setFreshPwdManual() {
  const input = document.getElementById('adminFreshInput');
  if (!input) return;
  const val = (input.value || '').trim();
  if (val.length < 6) {
    alert('Password minimal 6 karakter');
    return;
  }
  if (!confirm('Set password FRESH ke: "' + val + '"? Password lama hangus.')) return;
  setFreshPwd(val);
  alert('✅ Password FRESH diganti');
  renderAdminPanel();
}

function setUsedPwdManual() {
  const input = document.getElementById('adminUsedInput');
  if (!input) return;
  const val = (input.value || '').trim();
  if (val.length < 6) {
    alert('Password minimal 6 karakter');
    return;
  }
  if (!confirm('Set password USED ke: "' + val + '"? Password lama hangus.')) return;
  setUsedPwd(val);
  alert('✅ Password USED diganti');
  renderAdminPanel();
}

/* ============================================================
   RESET / UNLOCK DEVICE
   ============================================================ */
function adminResetThisDevice() {
  if (!confirm('Reset state device ini? (identity, completed, selectedTests, usedPragas)')) return;
  try {
    localStorage.removeItem('identity');
    localStorage.removeItem('completed');
    localStorage.removeItem('selectedTests');
    localStorage.removeItem('usedPragas');
    alert('✅ Device di-reset');
    renderAdminPanel();
  } catch (e) {
    alert('❌ ' + e.message);
  }
}

function adminUnlockDevice() {
  if (!confirm('Unlock device ini? (bisa login lagi setelah selesai)')) return;
  try {
    localStorage.removeItem('_sgs_finished');
    alert('✅ Device di-unlock');
    renderAdminPanel();
  } catch (e) {
    alert('❌ ' + e.message);
  }
}

/* ============================================================
   IZINKAN TES LAGI (untuk device tertentu)
   ============================================================ */
function adminAllowRetake(deviceId, candidateName) {
  const name = candidateName || 'kandidat';

  const ok = confirm(
    'Izinkan "' + name + '" untuk mengerjakan tes lagi?\n\n' +
    '• Device akan di-reset (hapus history tes)\n' +
    '• Kandidat harus login ulang dengan password dari admin\n' +
    '• Semua hasil tes sebelumnya tetap ada di Firebase\n\n' +
    'Lanjutkan?'
  );
  if (!ok) return;

  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    alert('❌ Firebase belum siap');
    return;
  }

  const ref = firebase.database().ref('sgs_state/sessions/' + deviceId);
  ref.update({
    allow_retake: true,
    allow_retake_at: firebase.database.ServerValue.TIMESTAMP,
    allow_retake_by: 'admin'
  })
  .then(() => {
    console.log('[ADMIN] ✅ allow_retake=true untuk:', deviceId);

    alert(
      '✅ Sinyal terkirim ke device "' + name + '".\n\n' +
      'Kandidat akan otomatis logout & bisa tes lagi dalam beberapa detik.\n\n' +
      '(Jika device kandidat sedang offline, sinyal akan diproses saat online.)'
    );

    setTimeout(() => renderAdminPanel(), 500);
  })
  .catch(e => {
    console.error('[ADMIN] ❌ Gagal allow_retake:', e);
    alert('❌ Gagal kirim sinyal: ' + e.message);
  });
}

/* ============================================================
   AUTO-CLEANUP CHAT UNTUK DEVICE TIDAK AKTIF
   ============================================================ */
async function cleanupInactiveChatRooms(options = {}) {
  const {
    silent = false,
    minAgeMs = CHAT_CLEANUP_AGE_MS,
    alsoDeleteSessions = CHAT_CLEANUP_DELETE_SESSION
  } = options;

  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    return { removed: 0, deviceIds: [] };
  }

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
      const status   = session.status;

      // Skip device yang sudah selesai
      if (session.finished === true) return;

      // Skip device yang aktif & baru
      if (status === 'active' && (now - lastSeen) < minAgeMs) return;

      // Hapus kalau offline atau stale
      if (status === 'offline' || (now - lastSeen) >= minAgeMs) {
        toDelete.push(deviceId);
      }
    });

    let removed = 0;
    for (const deviceId of toDelete) {
      try {
        await firebase.database().ref('sgs_state/chats/' + deviceId).remove();
        if (alsoDeleteSessions) {
          await firebase.database().ref('sgs_state/sessions/' + deviceId).remove();
        }
        removed++;
      } catch (e) {
        console.warn('[CLEANUP] Gagal hapus room:', deviceId, e);
      }
    }

    if (!silent) {
      console.log('[CLEANUP] 🧹 Removed', removed, 'chat rooms:', toDelete.map(d => d.slice(-8)).join(', '));
    }

    return { removed, deviceIds: toDelete };
  } catch (e) {
    console.error('[CLEANUP] Error:', e);
    return { removed: 0, deviceIds: [], error: e.message };
  }
}

async function adminCleanupInactive() {
  if (!confirm(
    'Bersihkan chat dari kandidat yang tidak aktif?\n\n' +
    '• Chat room device offline / tidak aktif > ' +
    Math.round(CHAT_CLEANUP_AGE_MS / 60000) + ' menit akan dihapus\n' +
    '• Device yang masih aktif tidak terpengaruh\n' +
    '• Device yang sudah selesai tes juga tidak terpengaruh\n\n' +
    'Lanjutkan?'
  )) return;

  const result = await cleanupInactiveChatRooms({ silent: false });

  if (result.removed === 0) {
    alert('✨ Tidak ada chat yang perlu dibersihkan.');
  } else {
    alert('✅ ' + result.removed + ' chat room berhasil dibersihkan.');
  }

  setTimeout(() => renderAdminPanel(), 300);
}

/* ============================================================
   ADMIN LOGIN PROMPT
   ============================================================ */
function renderAdminLoginPrompt() {
  const old = document.getElementById('adminLoginOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'adminLoginOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(10,20,35,0.95);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    font-family: Inter, system-ui, -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="
      width: min(420px, 100%);
      background: linear-gradient(180deg, #ffffff 0%, #f7fafd 100%);
      border-radius: 22px;
      box-shadow: 0 30px 90px rgba(0,0,0,.60);
      overflow: hidden;
    ">
      <div style="
        padding: 26px 28px 22px;
        background: linear-gradient(135deg, #1e3a8a, #3b82f6);
        color: #fff; text-align: center;
      ">
        <div style="
          width: 62px; height: 62px;
          margin: 0 auto 12px;
          display: grid; place-items: center;
          background: rgba(255,255,255,.15);
          border: 1px solid rgba(255,255,255,.3);
          border-radius: 18px; font-size: 28px;
        ">🔒</div>
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; opacity: .85;">
          ADMIN PANEL
        </div>
        <div style="font-size: 22px; font-weight: 900; margin-top: 6px;">
          Akses Terbatas
        </div>
        <div style="font-size: 13px; opacity: .85; margin-top: 6px;">
          Masukkan password untuk melanjutkan
        </div>
      </div>

      <div style="padding: 26px 28px 28px;">
        <input
          type="password"
          id="adminLoginPassword"
          placeholder="Password admin..."
          autocomplete="off"
          style="
            width: 100%; padding: 14px 16px;
            border: 2px solid #e2e8f0; border-radius: 12px;
            font-size: 15px; outline: none;
            font-family: inherit; background: #fff;
            box-sizing: border-box;
            transition: border-color .18s, box-shadow .18s;
          "
        >
        <div id="adminLoginError" style="
          color: #dc2626; font-size: 13px;
          min-height: 20px; margin-top: 10px;
          text-align: center; font-weight: 600;
        "></div>
        <button id="adminLoginBtn" style="
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #1e3a8a, #3b82f6);
          color: #fff; border: 0; border-radius: 12px;
          font-size: 15px; font-weight: 800;
          cursor: pointer; font-family: inherit;
          margin-top: 6px;
          box-shadow: 0 10px 24px rgba(30,58,138,.24);
          transition: transform .18s, box-shadow .18s, filter .18s;
        ">🔓 Masuk</button>

        <div style="margin-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
          Akses hanya untuk administrator
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const input = document.getElementById('adminLoginPassword');
  const btn = document.getElementById('adminLoginBtn');
  const errorEl = document.getElementById('adminLoginError');

  input.addEventListener('focus', () => {
    input.style.borderColor = '#3b82f6';
    input.style.boxShadow = '0 0 0 4px rgba(59,130,246,.12)';
  });
  input.addEventListener('blur', () => {
    input.style.borderColor = '#e2e8f0';
    input.style.boxShadow = 'none';
  });

  const attemptLogin = () => {
    const pwd = (input.value || '').trim();
    if (!pwd) {
      errorEl.textContent = '⚠️ Password tidak boleh kosong';
      input.focus();
      return;
    }
    if (pwd === ADMIN_PANEL_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      errorEl.style.color = '#16a34a';
      errorEl.textContent = '✅ Berhasil...';
      setTimeout(() => {
        overlay.remove();
        renderAdminPanel();
      }, 200);
    } else {
      errorEl.style.color = '#dc2626';
      errorEl.textContent = '❌ Password salah!';
      input.value = '';
      input.focus();
      const card = overlay.querySelector('div > div');
      if (card) {
        card.style.animation = 'adminShake .4s ease';
        setTimeout(() => { card.style.animation = ''; }, 450);
      }
    }
  };

  btn.onclick = attemptLogin;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); attemptLogin(); }
  });

  if (!document.getElementById('adminShakeStyle')) {
    const style = document.createElement('style');
    style.id = 'adminShakeStyle';
    style.textContent = `
      @keyframes adminShake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-10px); }
        40% { transform: translateX(10px); }
        60% { transform: translateX(-6px); }
        80% { transform: translateX(6px); }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => input.focus(), 120);
}

/* ============================================================
   ADMIN LOGOUT
   ============================================================ */
function adminLogout() {
  if (!confirm('Keluar dari panel admin?')) return;
  try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch (e) {}

  if (typeof window.stopListeningActiveSessions === 'function') {
    try { window.stopListeningActiveSessions(); } catch (e) {}
  }
  if (typeof stopAdminUnreadTracker === 'function') {
    try { stopAdminUnreadTracker(); } catch (e) {}
  }

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
   RENDER DAFTAR KANDIDAT AKTIF + FINISHED
   ============================================================ */
function renderActiveSessionsHTML(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return `
      <div style="
        padding: 14px; text-align: center;
        color: #94a3b8; font-size: 12px;
        background: #fff; border-radius: 10px;
      ">🌙 Belum ada kandidat yang aktif</div>`;
  }

  return sessions.map(s => {
    const ago = s.lastSeen ? Math.round((Date.now() - s.lastSeen) / 1000) : null;
    const agoStr = ago === null ? '-' :
                   ago < 60 ? `${ago}s lalu` :
                   ago < 3600 ? `${Math.floor(ago / 60)}m lalu` :
                   ago < 86400 ? `${Math.floor(ago / 3600)}j lalu` :
                   `${Math.floor(ago / 86400)}h lalu`;

    const testLabel = s.currentTest ? s.currentTest : '—';
    const subLabel = s.currentTest === 'IST' && s.currentSubtest !== null
      ? ` (subtes ${(s.currentSubtest || 0) + 1})` : '';
    const progress = s.totalTests > 0
      ? `${s.completedCount}/${s.totalTests} tes`
      : '—';

    const isFinished = s.finished === true;
    const statusColor = isFinished ? '#94a3b8'
                      : s.inTestView ? '#16a34a' : '#f59e0b';
    const statusLabel = isFinished ? '✅ Selesai (Terkunci)'
                      : s.inTestView ? '🟢 Mengerjakan' : '🟡 Idle';

    const safeName = String(s.name || '(tanpa nama)')
      .replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    const deviceIdShort = s.deviceId.slice(-8);

    const allowRetakeBtn = isFinished ? `
      <button onclick="adminAllowRetake('${s.deviceId}', '${safeName}')" style="
        padding: 5px 12px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #fff; border: 0; border-radius: 7px;
        font-size: 11px; font-weight: 800;
        cursor: pointer; font-family: inherit;
        box-shadow: 0 3px 8px rgba(245,158,11,.25);
        white-space: nowrap;
      ">🔓 Izinkan Tes Lagi</button>
    ` : '';

    const unreadCount = (window.__adminUnreadMap && window.__adminUnreadMap[s.deviceId]) || 0;
    const hasUnread = unreadCount > 0;

    const chatBtn = isFinished ? `
      <button disabled title="Kandidat sudah selesai" style="
        padding: 5px 12px;
        background: #e2e8f0; color: #94a3b8;
        border: 0; border-radius: 7px;
        font-size: 11px; font-weight: 800;
        cursor: not-allowed; font-family: inherit;
        white-space: nowrap;
      ">💬 Chat</button>
    ` : `
      <button onclick="openChatForAdmin('${s.deviceId}', '${safeName}')"
              class="${hasUnread ? 'chat-btn-blink' : ''}"
              style="
        padding: 5px 12px;
        background: linear-gradient(135deg, #3b82f6, #1e40af);
        color: #fff; border: 0; border-radius: 7px;
        font-size: 11px; font-weight: 800;
        cursor: pointer; font-family: inherit;
        box-shadow: 0 3px 8px rgba(59,130,246,.25);
        white-space: nowrap;
      ">💬 ${hasUnread ? 'Chat (' + unreadCount + ')' : 'Chat'}</button>
    `;

    const cardBg = isFinished
      ? 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
      : '#fff';
    const cardBorder = isFinished ? '#cbd5e1' : '#dbeafe';

    return `
      <div style="
        padding: 12px 14px; background: ${cardBg};
        border: 1px solid ${cardBorder}; border-radius: 10px;
        font-size: 12px; line-height: 1.5;
      ">
        <div style="
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 8px; margin-bottom: 6px;
        ">
          <div style="font-weight: 800; color: #1e293b; min-width:0;">
            ${__adminEscape(s.name || '(tanpa nama)')}
          </div>
          <div style="
            font-size: 10px; color: ${statusColor};
            font-weight: 800; white-space: nowrap;
          ">${statusLabel}</div>
        </div>

        <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
          ${s.position ? `📍 ${__adminEscape(s.position)} &nbsp;·&nbsp; ` : ''}
          📝 <b>${testLabel}</b>${subLabel} &nbsp;·&nbsp;
          ✅ ${progress}
        </div>

        <div style="
          display: flex; justify-content: space-between;
          align-items: center; gap: 8px; padding-top: 6px;
          border-top: 1px dashed #e2e8f0; flex-wrap: wrap;
        ">
          <div style="color: #94a3b8; font-size: 10px;">
            ID: ${deviceIdShort} &nbsp;·&nbsp; 👁 ${agoStr}
          </div>
          <div style="display: flex; gap: 6px;">
            ${allowRetakeBtn}
            ${chatBtn}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   RENDER PANEL ADMIN
   ============================================================ */
function renderAdminPanel() {
  const old = document.getElementById('adminPanelOverlay');
  if (old) old.remove();

  const locked = getLockState();
  const freshPwd = getFreshPwd();
  const usedPwd = getUsedPwd();

  const deviceFinished = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DEVICE_FINISHED) === '1';
  const usedPragas = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USED_PRAGAS) === '1';

  let identityName = '(belum ada)';
  try {
    const raw = localStorage.getItem('identity');
    if (raw) {
      const id = JSON.parse(raw);
      identityName = id.name || '(kosong)';
    }
  } catch (e) {}

  let completedCount = 0;
  try {
    const raw = localStorage.getItem('completed');
    if (raw) {
      const c = JSON.parse(raw);
      completedCount = Object.values(c).filter(v => v === true).length;
    }
  } catch (e) {}

  const myDeviceId = localStorage.getItem('_sgs_device_id') || '';

  const overlay = document.createElement('div');
  overlay.id = 'adminPanelOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(10,20,35,0.90);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; overflow-y: auto;
  `;

  overlay.innerHTML = `
    <div style="
      width: min(720px, 100%);
      max-height: calc(100vh - 40px);
      overflow-y: auto;
      background: linear-gradient(180deg, #ffffff 0%, #f7fafd 100%);
      border-radius: 22px;
      box-shadow: 0 30px 90px rgba(0,0,0,.55);
      font-family: Inter, system-ui, -apple-system, sans-serif;
      color: #1a2332;
    ">
      <!-- HEADER -->
      <div style="
        padding: 24px 28px 20px;
        background: linear-gradient(135deg, ${locked ? '#7f1d1d' : '#1e3a8a'}, ${locked ? '#dc2626' : '#3b82f6'});
        border-radius: 22px 22px 0 0;
        color: #fff; position: relative;
      ">
        <div style="
          position: absolute; top: 16px; right: 16px;
          display: flex; gap: 6px;
        ">
          <button id="btnAdminLogout" title="Logout" style="
            height: 34px; padding: 0 12px;
            background: rgba(255,255,255,.15);
            border: 1px solid rgba(255,255,255,.3);
            border-radius: 9px; cursor: pointer;
            color: #fff; font-size: 12px; font-weight: 800;
            font-family: inherit;
          ">🚪 Logout</button>
          <button id="btnAdminClose" title="Tutup" style="
            width: 34px; height: 34px;
            background: rgba(255,255,255,.15);
            border: 1px solid rgba(255,255,255,.3);
            border-radius: 9px; cursor: pointer;
            color: #fff; font-size: 16px; font-weight: 700;
            font-family: inherit;
          ">✕</button>
        </div>
        <div style="font-size: 12px; font-weight: 800; letter-spacing: 2px; opacity: .85;">
          ADMIN PANEL
        </div>
        <div style="font-size: 24px; font-weight: 900; margin-top: 6px;">
          🔐 Login Control
        </div>
        <div style="font-size: 13px; opacity: .85; margin-top: 6px;">
          ${locked ? '🔒 SEMUA LOGIN DITOLAK' : '🔓 Kandidat bisa login'}
        </div>
      </div>

      <!-- BODY -->
      <div style="padding: 24px 28px 28px;">

        <!-- LOCK TOGGLE -->
        <div style="
          padding: 18px 20px;
          background: ${locked ? '#fef2f2' : '#f0fdf4'};
          border: 2px solid ${locked ? '#fca5a5' : '#86efac'};
          border-radius: 16px;
          margin-bottom: 22px;
        ">
          <label style="
            display: flex; align-items: center; gap: 12px;
            cursor: pointer; user-select: none;
          ">
            <input type="checkbox" id="adminLockCheckbox" ${locked ? 'checked' : ''}
                   onchange="toggleLockState()"
                   style="
                     width: 22px; height: 22px;
                     cursor: pointer;
                     accent-color: ${locked ? '#dc2626' : '#16a34a'};
                   ">
            <div>
              <div style="
                font-size: 16px; font-weight: 900;
                color: ${locked ? '#991b1b' : '#166534'};
              ">
                ${locked ? '🔒 LOCK AKTIF — semua login ditolak' : '🔓 UNLOCKED — kandidat bisa login'}
              </div>
              <div style="
                font-size: 12px; color: ${locked ? '#b91c1c' : '#15803d'};
                margin-top: 4px; line-height: 1.5;
              ">
                ${locked
                  ? 'Kandidat tidak bisa login dengan password apapun.'
                  : 'Centang untuk memblokir semua login kandidat.'}
              </div>
            </div>
          </label>
        </div>

        <!-- =========================================
             MONITORING KANDIDAT AKTIF
             ========================================= -->
        <div style="
          padding: 18px 20px;
          background: linear-gradient(135deg, #eff6ff, #f0f9ff);
          border: 2px solid #bfdbfe;
          border-radius: 14px;
          margin-bottom: 16px;
        ">
          <div style="
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 14px; flex-wrap: wrap; gap: 8px;
          ">
            <div style="
              font-size: 14px; font-weight: 900; color: #1e40af;
              display: flex; align-items: center; gap: 8px;
            ">
              <span style="
                width: 10px; height: 10px; border-radius: 50%;
                background: #22c55e;
                box-shadow: 0 0 0 4px rgba(34,197,94,.2);
                animation: adminPulseDot 1.4s ease-in-out infinite;
              "></span>
              Kandidat Aktif & Selesai
            </div>
            <div id="adminActiveCount" style="
              font-size: 12px; font-weight: 800; color: #94a3b8;
              background: #fff; padding: 4px 10px; border-radius: 999px;
              border: 1px solid #bfdbfe;
            ">0 kandidat</div>
          </div>

          <div id="adminActiveSessions" style="
            display: flex; flex-direction: column; gap: 8px;
            max-height: 400px; overflow-y: auto;
          ">
            <div style="
              padding: 14px; text-align: center;
              color: #94a3b8; font-size: 12px;
            ">⏳ Memuat data...</div>
          </div>
        </div>

        <style>
          @keyframes adminPulseDot {
            0%, 100% { transform: scale(1); opacity: 1; }
            50%      { transform: scale(1.35); opacity: .7; }
          }
        </style>

        ${locked ? `
          <!-- KALAU LOCKED -->
          <div style="
            padding: 24px 20px;
            background: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 14px;
            text-align: center;
            color: #64748b;
            font-size: 13px;
            line-height: 1.7;
            margin-bottom: 16px;
          ">
            <div style="font-size: 36px; margin-bottom: 10px;">🔒</div>
            <div style="font-weight: 800; color: #334155; margin-bottom: 6px;">
              Login sedang DIKUNCI
            </div>
            <div>Un-check kotak di atas untuk melihat & mengelola password.</div>
          </div>
        ` : `
          <!-- PASSWORD FRESH -->
          <div style="margin-bottom: 20px;">
            <div style="
              font-size: 11px; font-weight: 800; letter-spacing: 1.5px;
              color: #16a34a; margin-bottom: 8px;
              display: flex; align-items: center; gap: 8px;
            ">
              <span style="
                width: 8px; height: 8px; border-radius: 50%;
                background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,.15);
              "></span>
              PASSWORD FRESH — untuk kandidat baru
            </div>
            <div style="
              padding: 16px 20px;
              background: #f0fdf4;
              border: 2px solid #86efac;
              border-radius: 12px 12px 0 0;
              font-family: 'Courier New', monospace;
              font-size: 20px; font-weight: 900;
              color: #14532d; letter-spacing: 1.5px;
              text-align: center;
              word-break: break-all;
            ">${freshPwd}</div>
            <div style="
              display: flex; gap: 6px;
              background: #f0fdf4;
              border: 2px solid #86efac;
              border-top: 0;
              border-radius: 0 0 12px 12px;
              padding: 8px;
            ">
              <button onclick="copyToClipboard('${freshPwd}', this)" style="
                flex: 1; padding: 8px 12px;
                background: #16a34a; color: #fff;
                border: 0; border-radius: 8px;
                font-family: inherit; font-size: 12px; font-weight: 800;
                cursor: pointer;
              ">📋 Copy</button>
              <button onclick="regenFreshPwd()" style="
                flex: 1; padding: 8px 12px;
                background: #fff; color: #16a34a;
                border: 1px solid #86efac; border-radius: 8px;
                font-family: inherit; font-size: 12px; font-weight: 800;
                cursor: pointer;
              ">🔄 Random</button>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 8px;">
              <input type="text" id="adminFreshInput" placeholder="Atau ketik manual..." style="
                flex: 1; padding: 8px 12px;
                border: 1px solid #d1fae5; border-radius: 8px;
                font-family: inherit; font-size: 12px;
                outline: none;
              ">
              <button onclick="setFreshPwdManual()" style="
                padding: 8px 16px;
                background: #16a34a; color: #fff;
                border: 0; border-radius: 8px;
                font-family: inherit; font-size: 12px; font-weight: 800;
                cursor: pointer;
              ">Set</button>
            </div>
          </div>

          <!-- PASSWORD USED -->
          <div style="margin-bottom: 22px;">
            <div style="
              font-size: 11px; font-weight: 800; letter-spacing: 1.5px;
              color: #dc2626; margin-bottom: 8px;
              display: flex; align-items: center; gap: 8px;
            ">
              <span style="
                width: 8px; height: 8px; border-radius: 50%;
                background: #ef4444; box-shadow: 0 0 0 4px rgba(239,68,68,.15);
              "></span>
              PASSWORD USED — setelah logout / diskualifikasi
            </div>
            <div style="
              padding: 16px 20px;
              background: #fef2f2;
              border: 2px solid #fca5a5;
              border-radius: 12px 12px 0 0;
              font-family: 'Courier New', monospace;
              font-size: 20px; font-weight: 900;
              color: #7f1d1d; letter-spacing: 1.5px;
              text-align: center;
              word-break: break-all;
            ">${usedPwd}</div>
            <div style="
              display: flex; gap: 6px;
              background: #fef2f2;
              border: 2px solid #fca5a5;
              border-top: 0;
              border-radius: 0 0 12px 12px;
              padding: 8px;
            ">
              <button onclick="copyToClipboard('${usedPwd}', this)" style="
                flex: 1; padding: 8px 12px;
                background: #dc2626; color: #fff;
                border: 0; border-radius: 8px;
                font-family: inherit; font-size: 12px; font-weight: 800;
                cursor: pointer;
              ">📋 Copy</button>
              <button onclick="regenUsedPwd()" style="
                flex: 1; padding: 8px 12px;
                background: #fff; color: #dc2626;
                border: 1px solid #fca5a5; border-radius: 8px;
                font-family: inherit; font-size: 12px; font-weight: 800;
                cursor: pointer;
              ">🔄 Random</button>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 8px;">
              <input type="text" id="adminUsedInput" placeholder="Atau ketik manual..." style="
                flex: 1; padding: 8px 12px;
                border: 1px solid #fee2e2; border-radius: 8px;
                font-family: inherit; font-size: 12px;
                outline: none;
              ">
              <button onclick="setUsedPwdManual()" style="
                padding: 8px 16px;
                background: #dc2626; color: #fff;
                border: 0; border-radius: 8px;
                font-family: inherit; font-size: 12px; font-weight: 800;
                cursor: pointer;
              ">Set</button>
            </div>
          </div>

          <!-- PANDUAN -->
          <div style="
            padding: 14px 16px;
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 12px;
            font-size: 12px; color: #78350f;
            line-height: 1.7;
            margin-bottom: 20px;
          ">
            <b>Cara pakai:</b><br>
            • <b>FRESH</b> — share ke kandidat yang belum pernah tes<br>
            • <b>USED</b> — share ke kandidat setelah logout / diskualifikasi<br>
            • Centang LOCK untuk memblokir semua login sementara
          </div>
        `}

        <!-- INFO DEVICE -->
        <div style="
          padding: 16px 18px;
          background: #f1f5f9;
          border-radius: 12px;
          margin-bottom: 16px;
          font-size: 13px; color: #334155;
          line-height: 1.9;
        ">
          <div style="font-weight: 800; margin-bottom: 8px; color: #1e293b;">
            📱 Device ini
          </div>
          <div><strong>Nama:</strong> ${__adminEscape(identityName)}</div>
          <div><strong>Tes selesai:</strong> ${completedCount}</div>
          <div><strong>Used flag:</strong> ${usedPragas ? '✅ aktif (kandidat sudah logout)' : '❌ belum'}</div>
          <div><strong>Device finished:</strong> ${deviceFinished ? '🔒 ya (tidak bisa login)' : '🔓 belum'}</div>
        </div>

        <!-- TEST CHAT (Device Sendiri) -->
        ${myDeviceId ? `
        <div style="margin-bottom: 12px;">
          <button onclick="openChatForAdmin('${myDeviceId}', '${String(identityName).replace(/'/g, "\\'")}')" style="
            width: 100%;
            padding: 12px 16px;
            background: linear-gradient(135deg, #64748b, #334155);
            color: #fff; border: 0; border-radius: 10px;
            font-family: inherit; font-size: 13px; font-weight: 800;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(51,65,85,.28);
          ">🧪 Test Chat (Device Sendiri)</button>
        </div>
        ` : ''}

        <!-- ACTIONS -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button onclick="adminResetThisDevice()" style="
            flex: 1; min-width: 140px;
            padding: 12px 16px;
            background: #f59e0b; color: #fff;
            border: 0; border-radius: 10px;
            font-family: inherit; font-size: 13px; font-weight: 800;
            cursor: pointer;
          ">🔄 Reset Device</button>
          <button onclick="adminUnlockDevice()" style="
            flex: 1; min-width: 140px;
            padding: 12px 16px;
            background: #fff; color: #dc2626;
            border: 2px solid #fca5a5; border-radius: 10px;
            font-family: inherit; font-size: 13px; font-weight: 800;
            cursor: pointer;
          ">🔓 Unlock Device</button>
          <button onclick="adminCleanupInactive()" style="
            flex: 1; min-width: 140px;
            padding: 12px 16px;
            background: #fff; color: #7c3aed;
            border: 2px solid #c4b5fd; border-radius: 10px;
            font-family: inherit; font-size: 13px; font-weight: 800;
            cursor: pointer;
          ">🧹 Bersihkan Chat Tidak Aktif</button>
        </div>

        <!-- FOOTER -->
        <div style="
          margin-top: 20px; padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px; color: #94a3b8;
          text-align: center;
        ">
          URL admin: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">?admin=${APP_CONFIG.ADMIN_KEY}</code>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  /* ---- Listen kandidat aktif (real-time) ---- */
  setTimeout(() => {
    const container = document.getElementById('adminActiveSessions');
    const countEl   = document.getElementById('adminActiveCount');
    if (!container || typeof window.listenActiveSessions !== 'function') {
      if (container) {
        container.innerHTML = `
          <div style="
            padding: 14px; text-align: center;
            color: #94a3b8; font-size: 11px;
            background: #fff; border-radius: 10px;
          ">⚠️ Modul monitoring belum siap</div>`;
      }
      return;
    }

    window.listenActiveSessions((sessions) => {
      window.__adminLastSessions = sessions;

      if (countEl) {
        countEl.textContent = sessions.length + ' kandidat';
        countEl.style.color = sessions.length > 0 ? '#1e40af' : '#94a3b8';
      }
      container.innerHTML = renderActiveSessionsHTML(sessions);
    });

    // Mulai unread tracker
    if (typeof startAdminUnreadTracker === 'function') {
      startAdminUnreadTracker();
    }

    // 🔄 AUTO-CLEANUP: hapus chat kandidat yang sudah lama tidak aktif
    if (CHAT_CLEANUP_ENABLED && typeof cleanupInactiveChatRooms === 'function') {
      setTimeout(() => {
        cleanupInactiveChatRooms({ silent: true }).then(r => {
          if (r.removed > 0) {
            console.log('[AUTO-CLEANUP] 🧹 ' + r.removed + ' chat lama dibersihkan');
          }
        });
      }, 500);
    }
  }, 200);

  const closeBtn = document.getElementById('btnAdminClose');
  if (closeBtn) {
    closeBtn.onclick = () => {
      if (typeof window.stopListeningActiveSessions === 'function') {
        try { window.stopListeningActiveSessions(); } catch (e) {}
      }
      if (typeof stopAdminUnreadTracker === 'function') {
        try { stopAdminUnreadTracker(); } catch (e) {}
      }
      overlay.remove();
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('admin');
        url.hash = '';
        window.history.replaceState({}, '', url.pathname + (url.search || ''));
      } catch (e) {}
    };
  }

  /* ---- Tombol logout ---- */
  const logoutBtn = document.getElementById('btnAdminLogout');
  if (logoutBtn) {
    logoutBtn.onclick = adminLogout;
  }

  /* ---- ESC untuk tutup ---- */
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
function checkAdminUrlAndRender() {
  if (!isAdminUrl()) return false;

  const isLoggedIn = sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';

  if (isLoggedIn) {
    renderAdminPanel();
  } else {
    renderAdminLoginPrompt();
  }
  return true;
}

/* ============================================================
   EXPORT
   ============================================================ */
window.getLockState = getLockState;
window.setLockState = setLockState;
window.getFreshPwd = getFreshPwd;
window.getUsedPwd = getUsedPwd;
window.isAdminUrl = isAdminUrl;
window.renderAdminPanel = renderAdminPanel;
window.renderAdminLoginPrompt = renderAdminLoginPrompt;
window.renderActiveSessionsHTML = renderActiveSessionsHTML;
window.checkAdminUrlAndRender = checkAdminUrlAndRender;
window.toggleLockState = toggleLockState;
window.copyToClipboard = copyToClipboard;
window.regenFreshPwd = regenFreshPwd;
window.regenUsedPwd = regenUsedPwd;
window.setFreshPwdManual = setFreshPwdManual;
window.setUsedPwdManual = setUsedPwdManual;
window.adminResetThisDevice = adminResetThisDevice;
window.adminUnlockDevice = adminUnlockDevice;
window.adminAllowRetake = adminAllowRetake;
window.adminCleanupInactive = adminCleanupInactive;
window.adminLogout = adminLogout;

/* ─── Unread Tracker ─── */
window.startAdminUnreadTracker = startAdminUnreadTracker;
window.stopAdminUnreadTracker = stopAdminUnreadTracker;

/* ─── Chat Cleanup ─── */
window.cleanupInactiveChatRooms = cleanupInactiveChatRooms;

console.log('[ADMIN] ✓ Loaded — lock + 2 passwords + login gate + monitoring + chat + allow_retake + unread + cleanup');
