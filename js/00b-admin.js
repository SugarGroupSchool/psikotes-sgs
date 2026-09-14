/* ============================================================
   js/00b-admin.js
   - Generator password acak
   - Panel admin (via URL ?admin=adminsgs111 / #adminsgs111)
   ============================================================ */

/* ============================================================
   1. PASTIKAN PASSWORD ACAK SUDAH DI-GENERATE
   Dipanggil saat init, sekali saja per browser
   ============================================================ */
function ensureRandomPasswords() {
  const K = APP_CONFIG.STORAGE_KEYS;

  const hasFresh = !!localStorage.getItem(K.PWD_FRESH);
  const hasUsed  = !!localStorage.getItem(K.PWD_USED);

  if (hasFresh && hasUsed) return;

  const fresh = APP_CONFIG.generateRandomPassword('SGS-F-');
  const used  = APP_CONFIG.generateRandomPassword('SGS-U-');

  try {
    localStorage.setItem(K.PWD_FRESH, fresh);
    localStorage.setItem(K.PWD_USED, used);
    localStorage.setItem(K.PWD_CREATED, String(Date.now()));
    console.log('[ADMIN] 🔐 Password acak baru dibuat:');
    console.log('  Fresh:', fresh);
    console.log('  Used :', used);
  } catch (e) {
    console.warn('[ADMIN] Gagal simpan password acak:', e);
  }
}

/* ============================================================
   2. AMBIL PASSWORD AKTIF
   ============================================================ */
function getFreshPassword() {
  const K = APP_CONFIG.STORAGE_KEYS;
  return localStorage.getItem(K.PWD_FRESH) || APP_CONFIG.PASSWORDS.FRESH;
}

function getUsedPassword() {
  const K = APP_CONFIG.STORAGE_KEYS;
  return localStorage.getItem(K.PWD_USED) || APP_CONFIG.PASSWORDS.USED;
}

function getActivePassword() {
  const K = APP_CONFIG.STORAGE_KEYS;
  const used = localStorage.getItem(K.USED_PRAGAS) === '1';
  return used ? getUsedPassword() : getFreshPassword();
}

/* ============================================================
   3. DETEKSI ADMIN URL
   Support 3 format:
   - ?admin=adminsgs111
   - #adminsgs111
   - /adminsgs111 (kalau di-host di server yang support routing)
   ============================================================ */
function isAdminUrl() {
  try {
    const url = new URL(window.location.href);
    const key = APP_CONFIG.ADMIN_KEY;
    return (
      url.searchParams.get('admin') === key ||
      url.hash === '#' + key ||
      url.pathname.endsWith('/' + key) ||
      url.pathname.endsWith('/' + key + '/')
    );
  } catch (e) {
    return false;
  }
}

/* ============================================================
   4. REGENERATE PASSWORD
   ============================================================ */
function regeneratePasswords() {
  if (!confirm('Generate password baru? Password lama akan hangus.')) return;

  const K = APP_CONFIG.STORAGE_KEYS;
  const fresh = APP_CONFIG.generateRandomPassword('SGS-F-');
  const used  = APP_CONFIG.generateRandomPassword('SGS-U-');

  try {
    localStorage.setItem(K.PWD_FRESH, fresh);
    localStorage.setItem(K.PWD_USED, used);
    localStorage.setItem(K.PWD_CREATED, String(Date.now()));
    alert('✅ Password baru berhasil dibuat!');
    renderAdminPanel(); // Refresh panel
  } catch (e) {
    alert('❌ Gagal generate password: ' + e.message);
  }
}

/* ============================================================
   5. COPY KE CLIPBOARD
   ============================================================ */
function copyToClipboard(text, btnEl) {
  try {
    navigator.clipboard.writeText(text).then(() => {
      const prev = btnEl.textContent;
      btnEl.textContent = '✓ Copied!';
      setTimeout(() => { btnEl.textContent = prev; }, 1200);
    }).catch(() => {
      fallbackCopy(text, btnEl);
    });
  } catch (e) {
    fallbackCopy(text, btnEl);
  }
}

function fallbackCopy(text, btnEl) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    if (btnEl) {
      const prev = btnEl.textContent;
      btnEl.textContent = '✓ Copied!';
      setTimeout(() => { btnEl.textContent = prev; }, 1200);
    }
  } catch (e) {
    alert('Gagal copy. Silakan salin manual: ' + text);
  }
  document.body.removeChild(ta);
}

/* ============================================================
   6. RENDER PANEL ADMIN
   ============================================================ */
function renderAdminPanel() {
  // Hapus panel lama kalau ada
  const old = document.getElementById('adminPanelOverlay');
  if (old) old.remove();

  const fresh = getFreshPassword();
  const used = getUsedPassword();
  const created = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.PWD_CREATED);
  const createdStr = created
    ? new Date(parseInt(created)).toLocaleString('id-ID')
    : '-';

  const stateUsed = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USED_PRAGAS) === '1';
  const activeNow = stateUsed ? used : fresh;
  const activeLabel = stateUsed ? 'USED (kandidat sudah logout)' : 'FRESH (kandidat baru)';

  const identityRaw = localStorage.getItem('identity');
  let identityName = '(belum ada)';
  try {
    if (identityRaw) {
      const id = JSON.parse(identityRaw);
      identityName = id.name || '(kosong)';
    }
  } catch (e) {}

  const completedRaw = localStorage.getItem('completed');
  let completedCount = 0;
  try {
    if (completedRaw) {
      const c = JSON.parse(completedRaw);
      completedCount = Object.values(c).filter(v => v === true).length;
    }
  } catch (e) {}

  const overlay = document.createElement('div');
  overlay.id = 'adminPanelOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(10,20,35,0.85);
    backdrop-filter: blur(8px);
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
      box-shadow: 0 30px 80px rgba(0,0,0,.5);
      font-family: Inter, system-ui, -apple-system, sans-serif;
      color: #1a2332;
    ">
      <!-- HEADER -->
      <div style="
        padding: 24px 28px 20px;
        background: linear-gradient(135deg, #1e3a8a, #3b82f6);
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
        <div style="font-size: 24px; font-weight: 900; margin-top: 6px; letter-spacing: -.5px;">
          🔐 Password Management
        </div>
        <div style="font-size: 13px; opacity: .85; margin-top: 6px;">
          Halaman ini hanya bisa diakses via URL admin.
        </div>
      </div>

      <!-- BODY -->
      <div style="padding: 24px 28px 28px;">

        <!-- STATUS AKTIF -->
        <div style="
          padding: 14px 16px;
          background: ${stateUsed ? '#fef3c7' : '#dbeafe'};
          border: 1px solid ${stateUsed ? '#fde68a' : '#93c5fd'};
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 13px;
          color: ${stateUsed ? '#78350f' : '#1e40af'};
        ">
          <strong>Status saat ini:</strong> ${activeLabel}
        </div>

        <!-- FRESH PASSWORD -->
        <div style="margin-bottom: 20px;">
          <div style="
            font-size: 11px; font-weight: 800; letter-spacing: 1.5px;
            color: #16a34a; margin-bottom: 8px;
          ">🟢 PASSWORD FRESH (kandidat baru)</div>
          <div style="
            display: flex; gap: 10px; align-items: stretch;
          ">
            <div id="pwdFreshValue" style="
              flex: 1;
              padding: 14px 18px;
              background: #f0fdf4;
              border: 2px solid #86efac;
              border-radius: 12px;
              font-family: 'Courier New', monospace;
              font-size: 18px; font-weight: 800;
              color: #14532d; letter-spacing: 1.5px;
              display: flex; align-items: center;
            ">${fresh}</div>
            <button onclick="copyToClipboard('${fresh}', this)" style="
              padding: 0 20px;
              background: #16a34a; color: #fff;
              border: 0; border-radius: 12px;
              font-family: inherit; font-size: 13px; font-weight: 800;
              cursor: pointer; min-width: 90px;
            ">Copy</button>
          </div>
        </div>

        <!-- USED PASSWORD -->
        <div style="margin-bottom: 20px;">
          <div style="
            font-size: 11px; font-weight: 800; letter-spacing: 1.5px;
            color: #dc2626; margin-bottom: 8px;
          ">🔴 PASSWORD USED (kandidat yang sudah logout/disqualified)</div>
          <div style="display: flex; gap: 10px; align-items: stretch;">
            <div style="
              flex: 1;
              padding: 14px 18px;
              background: #fef2f2;
              border: 2px solid #fca5a5;
              border-radius: 12px;
              font-family: 'Courier New', monospace;
              font-size: 18px; font-weight: 800;
              color: #7f1d1d; letter-spacing: 1.5px;
              display: flex; align-items: center;
            ">${used}</div>
            <button onclick="copyToClipboard('${used}', this)" style="
              padding: 0 20px;
              background: #dc2626; color: #fff;
              border: 0; border-radius: 12px;
              font-family: inherit; font-size: 13px; font-weight: 800;
              cursor: pointer; min-width: 90px;
            ">Copy</button>
          </div>
        </div>

        <!-- INFO STATE KANDIDAT -->
        <div style="
          padding: 16px 18px;
          background: #f1f5f9;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 13px; color: #334155;
          line-height: 1.8;
        ">
          <div style="font-weight: 800; margin-bottom: 8px; color: #1e293b;">📋 Info State Kandidat</div>
          <div><strong>Nama:</strong> ${identityName}</div>
          <div><strong>Password dibuat:</strong> ${createdStr}</div>
          <div><strong>Tes selesai:</strong> ${completedCount} tes</div>
          <div><strong>Used flag:</strong> ${stateUsed ? 'Ya (pernah logout)' : 'Belum'}</div>
        </div>

        <!-- ACTION BUTTONS -->
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button onclick="regeneratePasswords()" style="
            flex: 1; min-width: 160px;
            padding: 14px 20px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #fff; border: 0; border-radius: 12px;
            font-family: inherit; font-size: 14px; font-weight: 800;
            cursor: pointer; box-shadow: 0 8px 20px rgba(99,102,241,.3);
          ">🔄 Generate Password Baru</button>

          <button onclick="resetKandidatState()" style="
            flex: 1; min-width: 160px;
            padding: 14px 20px;
            background: #fff; color: #dc2626;
            border: 2px solid #fca5a5; border-radius: 12px;
            font-family: inherit; font-size: 14px; font-weight: 800;
            cursor: pointer;
          ">🧹 Reset State Kandidat</button>
        </div>

        <!-- FOOTER -->
        <div style="
          margin-top: 20px; padding-top: 18px;
          border-top: 1px solid #e2e8f0;
          font-size: 12px; color: #94a3b8;
          text-align: center; line-height: 1.7;
        ">
          URL admin: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">?admin=adminsgs111</code><br>
          atau <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">#adminsgs111</code>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close handler
  const closeBtn = document.getElementById('btnAdminClose');
  if (closeBtn) {
    closeBtn.onclick = () => {
      overlay.remove();
      // Hapus param admin dari URL
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('admin');
        url.hash = '';
        const clean = url.pathname + (url.search ? url.search : '') + url.hash;
        window.history.replaceState({}, '', clean);
      } catch (e) {}
    };
  }

  // ESC untuk close
  document.addEventListener('keydown', function adminEsc(e) {
    if (e.key === 'Escape') {
      closeBtn && closeBtn.click();
      document.removeEventListener('keydown', adminEsc);
    }
  }, { once: true });
}

/* ============================================================
   7. RESET STATE KANDIDAT (dari panel admin)
   ============================================================ */
function resetKandidatState() {
  if (!confirm('Reset state kandidat (identity, completed, selectedTests, usedPragas)? Password tetap aman.')) return;

  try {
    localStorage.removeItem('identity');
    localStorage.removeItem('completed');
    localStorage.removeItem('selectedTests');
    localStorage.removeItem('usedPragas');
    sessionStorage.removeItem('dlClick');

    alert('✅ State kandidat direset. Password tetap sama.');
    renderAdminPanel();
  } catch (e) {
    alert('❌ Gagal reset: ' + e.message);
  }
}

/* ============================================================
   8. CEK URL ADMIN SAAT LOAD
   Return true kalau admin, supaya init normal di-skip
   ============================================================ */
function checkAdminUrlAndRender() {
  if (isAdminUrl()) {
    renderAdminPanel();
    return true;
  }
  return false;
}

/* ============================================================
   EXPORT
   ============================================================ */
window.ensureRandomPasswords = ensureRandomPasswords;
window.getFreshPassword = getFreshPassword;
window.getUsedPassword = getUsedPassword;
window.getActivePassword = getActivePassword;
window.isAdminUrl = isAdminUrl;
window.renderAdminPanel = renderAdminPanel;
window.regeneratePasswords = regeneratePasswords;
window.resetKandidatState = resetKandidatState;
window.checkAdminUrlAndRender = checkAdminUrlAndRender;
window.copyToClipboard = copyToClipboard;

console.log('[ADMIN] ✓ Loaded — panel admin + password acak');
