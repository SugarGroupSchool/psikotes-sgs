/* ============================================================
   js/00b-admin.js
   - Admin panel: LOCK kontrol + 2 password (Fresh & Used)
   ============================================================ */

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
   RENDER PANEL ADMIN
   ============================================================ */
function renderAdminPanel() {
  const old = document.getElementById('adminPanelOverlay');
  if (old) old.remove();

  const locked = getLockState();
  const freshPwd = getFreshPwd();
  const usedPwd = getUsedPwd();

  // State device ini
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
        <button id="btnAdminClose" style="
          position: absolute; top: 16px; right: 16px;
          width: 34px; height: 34px;
          background: rgba(255,255,255,.15);
          border: 1px solid rgba(255,255,255,.3);
          border-radius: 9px; cursor: pointer;
          color: #fff; font-size: 16px; font-weight: 700;
        ">✕</button>
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

        ${locked ? `
          <!-- KALAU LOCKED, TAMPILKAN PESAN -->
          <div style="
            padding: 24px 20px;
            background: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 14px;
            text-align: center;
            color: #64748b;
            font-size: 13px;
            line-height: 1.7;
          ">
            <div style="font-size: 36px; margin-bottom: 10px;">🔒</div>
            <div style="font-weight: 800; color: #334155; margin-bottom: 6px;">
              Login sedang DIKUNCI
            </div>
            <div>Un-check kotak di atas untuk melihat & mengelola password.</div>
          </div>
        ` : `
          <!-- KALAU UNLOCKED, TAMPILKAN 2 PASSWORD -->

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
            <div style="
              display: flex; gap: 6px; margin-top: 8px;
            ">
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
            <div style="
              display: flex; gap: 6px; margin-top: 8px;
            ">
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
          <div><strong>Nama:</strong> ${identityName}</div>
          <div><strong>Tes selesai:</strong> ${completedCount}</div>
          <div><strong>Used flag:</strong> ${usedPragas ? '✅ aktif (kandidat sudah logout)' : '❌ belum'}</div>
          <div><strong>Device finished:</strong> ${deviceFinished ? '🔒 ya (tidak bisa login)' : '🔓 belum'}</div>
        </div>

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
        </div>

        <!-- FOOTER -->
        <div style="
          margin-top: 20px; padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px; color: #94a3b8;
          text-align: center;
        ">
          URL admin: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">?admin=adminsgs111</code>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = document.getElementById('btnAdminClose');
  if (closeBtn) {
    closeBtn.onclick = () => {
      overlay.remove();
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('admin');
        url.hash = '';
        window.history.replaceState({}, '', url.pathname + (url.search || ''));
      } catch (e) {}
    };
  }

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

  // Cek apakah admin sudah login (tersimpan di sessionStorage)
  const isLoggedIn = sessionStorage.getItem('_sgs_admin_logged_in') === '1';

  if (isLoggedIn) {
    // Jika sudah login, langsung tampilkan panel
    renderAdminPanel();
  } else {
    // Jika belum login, tampilkan form login
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
window.checkAdminUrlAndRender = checkAdminUrlAndRender;
window.toggleLockState = toggleLockState;
window.copyToClipboard = copyToClipboard;
window.regenFreshPwd = regenFreshPwd;
window.regenUsedPwd = regenUsedPwd;
window.setFreshPwdManual = setFreshPwdManual;
window.setUsedPwdManual = setUsedPwdManual;
window.adminResetThisDevice = adminResetThisDevice;
window.adminUnlockDevice = adminUnlockDevice;

console.log('[ADMIN] ✓ Loaded — lock control + 2 passwords');
