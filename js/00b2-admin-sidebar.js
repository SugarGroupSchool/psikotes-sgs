/* ============================================================
   js/00b2-admin-sidebar.js — Admin Panel: Sidebar Layout
   ------------------------------------------------------------
   Override renderAdminPanel() dengan layout sidebar + content.
   Load SETELAH 00b-admin.js.
   ============================================================ */
(function () {
  'use strict';

  if (window.__adminSidebarLoaded) return;
  window.__adminSidebarLoaded = true;

  let __currentAdminMenu = 'login';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function getLogo() {
    if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO) return APP_CONFIG.LOGO;
    return 'https://cdn.jsdelivr.net/gh/Pragas123/assets@main/nmqo6a.png';
  }

  function readLocalState() {
    let identityName = '(belum ada)';
    let completedCount = 0;
    let deviceFinished = false;
    let usedPragas = false;
    let myDeviceId = '';
    try {
      if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.STORAGE_KEYS) {
        deviceFinished = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DEVICE_FINISHED) === '1';
        usedPragas = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USED_PRAGAS) === '1';
      }
      const raw = localStorage.getItem('identity');
      if (raw) identityName = JSON.parse(raw).name || '(kosong)';
      const rawC = localStorage.getItem('completed');
      if (rawC) completedCount = Object.values(JSON.parse(rawC)).filter(v => v === true).length;
      myDeviceId = localStorage.getItem('_sgs_device_id') || '';
    } catch (e) {}
    return { identityName, completedCount, deviceFinished, usedPragas, myDeviceId };
  }

  /* ============================================================
     OVERRIDE: renderAdminPanel
     ============================================================ */
  window.renderAdminPanel = function () {
    const old = document.getElementById('adminPanelOverlay');
    if (old) old.remove();

    const locked = (typeof __safeGetLockState === 'function') ? __safeGetLockState() : true;
    const ls = readLocalState();

    const overlay = document.createElement('div');
    overlay.id = 'adminPanelOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0f172a;display:flex;font-family:Inter,system-ui,sans-serif;';

    overlay.innerHTML = `
      <aside id="adminSidebar">
        <div class="asb-header">
          <img src="${getLogo()}" alt="SGS Logo" class="asb-logo" onerror="this.style.display='none'">
          <div class="asb-title">SGS Admin</div>
          <div class="asb-subtitle">Sugar Group Schools</div>
        </div>
        <nav class="asb-nav">
          <button class="asb-menu active" data-menu="login">
            <span class="asb-icon">🔐</span><span>Login Control</span>
          </button>
          <button class="asb-menu" data-menu="kandidat">
            <span class="asb-icon">📊</span><span>Kandidat Aktif</span>
          </button>
          <button class="asb-menu" data-menu="hasil">
            <span class="asb-icon">📄</span><span>Hasil Tes</span>
          </button>
          <button class="asb-menu" data-menu="asesor">
            <span class="asb-icon">👥</span><span>Kelola Asesor</span>
          </button>
          <button class="asb-menu" data-menu="psikogram-config">
            <span class="asb-icon">📊</span><span>Psikogram Config</span>
          </button>
          <button class="asb-menu" data-menu="device">
            <span class="asb-icon">📱</span><span>Device Info</span>
          </button>
        </nav>
        <div class="asb-footer">
          <div class="asb-device-name">${esc(ls.identityName)}</div>
          <button id="asbLogoutBtn" class="asb-logout">🚪 Logout</button>
        </div>
      </aside>
      <main id="adminMainContent"></main>
    `;

    document.body.appendChild(overlay);

    overlay.querySelectorAll('.asb-menu').forEach(btn => {
      btn.onclick = () => {
        const menu = btn.getAttribute('data-menu');
        overlay.querySelectorAll('.asb-menu').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        __currentAdminMenu = menu;
        __renderMenuContent(menu, { ...readLocalState(), locked });
      };
    });

    const logoutBtn = document.getElementById('asbLogoutBtn');
    if (logoutBtn) logoutBtn.onclick = () => {
      if (typeof adminLogout === 'function') adminLogout();
    };

    __renderMenuContent('login', { ...ls, locked });

    /* Listener global (sama seperti versi lama) */
    if (typeof __startAdminIdleTracking === 'function') __startAdminIdleTracking();
    if (typeof startAdminUnreadTracker === 'function') startAdminUnreadTracker();
    if (typeof startAdminTimerTick === 'function') startAdminTimerTick();
    if (typeof startSignalListeners === 'function') startSignalListeners();
    if (typeof __updateAdminResultCounter === 'function') __updateAdminResultCounter();
  };

  /* ============================================================
     MENU DISPATCHER
     ============================================================ */
    function __renderMenuContent(menu, ctx) {
    const main = document.getElementById('adminMainContent');
    if (!main) return;

    /* ⚡ SELALU tutup overlay lama DULU — kalau tidak, menu baru
       (terutama Login Control & Device Info) render di BELAKANG
       overlay dan user pikir tidak berubah. */
    __closeAdminOverlayPages();

    if (menu === 'login')         __renderLoginControl(main, ctx);
    else if (menu === 'device')   __renderDeviceInfo(main, ctx);
    else if (menu === 'kandidat') __openOverlayMenu(main, 'openActiveCandidatesPage', '📊 Kandidat Aktif', 'kandidat');
    else if (menu === 'hasil')    __openOverlayMenu(main, 'openResultFilesPage', '📄 Hasil Tes Terkirim', 'hasil');
    else if (menu === 'psikogram-config') __openOverlayMenu(main, 'openPsikogramConfigPage', '📊 Psikogram Config', 'psikogram-config');
    else if (menu === 'asesor')   __openOverlayMenu(main, 'openAssessorSettingsPage', '👥 Kelola Asesor', 'asesor');
  }

  /* ============================================================
     🆕 CLOSE ALL ADMIN OVERLAY PAGES
     ------------------------------------------------------------
     Overlay pages (Kandidat Aktif, Hasil Tes, Kelola Asesor)
     dirender DI ATAS #adminMainContent dengan z-index tinggi.
     Kalau user pindah menu tanpa menutup overlay, konten menu
     baru render di BELAKANG overlay → user pikir tidak berubah.

     Fungsi ini MEMASTIKAN overlay lama ditutup dulu sebelum
     render menu baru (local page maupun overlay page).
     ============================================================ */
  function __closeAdminOverlayPages() {
    /* 1. Kandidat Aktif — pakai close handler agar listener cleanup */
    var cand = document.getElementById('activeCandidatesPageOverlay');
    if (cand) {
      if (typeof window.closeActiveCandidatesPage === 'function') {
        try { window.closeActiveCandidatesPage(); } catch (e) {}
      }
      var candLeft = document.getElementById('activeCandidatesPageOverlay');
      if (candLeft) candLeft.remove();
    }

    /* 2. Hasil Tes — pakai close handler */
    var res = document.getElementById('resultFilesPageOverlay');
    if (res) {
      if (typeof window.closeResultFilesPage === 'function') {
        try { window.closeResultFilesPage(); } catch (e) {}
      }
      var resLeft = document.getElementById('resultFilesPageOverlay');
      if (resLeft) resLeft.remove();
    }

    /* 3. Kelola Asesor — tidak ada close handler global, force remove */
    var ass = document.getElementById('assessorSettingsPageOverlay');
    if (ass) ass.remove();

    /* 3b. Psikogram Config — tutup overlay */
    var pgcfg = document.getElementById('psikogramConfigOverlay');
    if (pgcfg) pgcfg.remove();

    /* 4. Nested overlays (folder kandidat, detail kandidat) */
    ['rfFolderOverlay', 'candidateDetailOverlay'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.remove();
    });

    /* 5. Kosongkan area utama biar konten baru tidak bertumpuk */
    var main = document.getElementById('adminMainContent');
    if (main) main.innerHTML = '';
  }

    function __openOverlayMenu(main, fnName, label, expectedMenu) {
    main.innerHTML = `
      <div class="asb-page">
        <div class="asb-page-header"><h1>${label}</h1></div>
        <div class="asb-card info" style="text-align:center;padding:44px 20px;">
          <div style="font-size:52px;margin-bottom:14px;">📂</div>
          <div style="font-size:14px;color:#475569;line-height:1.7;">
            Halaman <b>${label}</b> sedang terbuka.<br>
            Tutup halaman tersebut (tombol ← atau ✕) untuk kembali ke sini.
          </div>
        </div>
      </div>`;
    setTimeout(() => {
      /* 🆕 GUARD: kalau user sudah pindah menu lain dalam 60ms,
         jangan buka overlay basi */
      if (expectedMenu && __currentAdminMenu !== expectedMenu) return;
      if (typeof window[fnName] === 'function') window[fnName]();
    }, 60);
  }

  /* ============================================================
     RENDER: LOGIN CONTROL
     ============================================================ */
  function __renderLoginControl(main, ctx) {
    const openReq = window.__adminSectionOpen && window.__adminSectionOpen.request;

    main.innerHTML = `
      <div class="asb-page">
        <div class="asb-page-header">
          <h1>🔐 Login Control</h1>
          <p>Kelola akses login kandidat, izin akses, dan device ini.</p>
        </div>

        <div class="asb-card ${ctx.locked ? 'danger' : 'success'}">
          <label class="asb-toggle-label">
            <input type="checkbox" id="adminLockCheckbox" ${ctx.locked ? 'checked' : ''} onchange="toggleLockState()">
            <div>
              <div class="asb-card-title">
                ${ctx.locked ? '🔒 LOCK AKTIF — semua login ditolak' : '🔓 UNLOCKED — kandidat bisa login'}
              </div>
              <div class="asb-card-desc">
                ${ctx.locked ? 'Kandidat tidak bisa login dengan password apapun.' : 'Centang untuk memblokir semua login kandidat.'}
              </div>
            </div>
          </label>
        </div>

        <div class="asb-card warning">
          <div class="asb-card-header" onclick="toggleAdminSection('request')" style="cursor:pointer;margin-bottom:${openReq ? '14px' : '0'};">
            <div>📨 Request Izin Akses</div>
            <div id="adminRequestCount" class="asb-badge">0 request</div>
          </div>
          <div id="adminSectionBody_request" style="display:${openReq ? 'block' : 'none'};">
            <div id="adminAccessRequests" class="asb-list">
              <div style="padding:14px;text-align:center;color:#94a3b8;font-size:12px;">⏳ Memuat...</div>
            </div>
          </div>
        </div>

        <div class="asb-card">
          <div class="asb-card-header"><div>⚡ Aksi Cepat</div></div>
          <div class="asb-actions">
            <button onclick="adminResetThisDevice()">🔄 Reset Device</button>
            <button onclick="adminUnlockDevice()">🔓 Unlock Device</button>
            <button onclick="adminCleanupInactive()">🧹 Bersihkan Chat</button>
          </div>
        </div>
      </div>`;

    if (typeof listenAccessRequests === 'function') {
      const reqContainer = document.getElementById('adminAccessRequests');
      const reqCountEl = document.getElementById('adminRequestCount');
      listenAccessRequests(requests => {
        if (reqCountEl) reqCountEl.textContent = requests.length + ' request';
        if (reqContainer) {
          reqContainer.innerHTML = typeof renderAccessRequestsHTML === 'function'
            ? renderAccessRequestsHTML(requests)
            : '';
        }
      });
    }
  }

  /* ============================================================
     RENDER: DEVICE INFO
     ============================================================ */
  function __renderDeviceInfo(main, ctx) {
    main.innerHTML = `
      <div class="asb-page">
        <div class="asb-page-header">
          <h1>📱 Device Info</h1>
          <p>Informasi device yang sedang Anda gunakan.</p>
        </div>

        <div class="asb-card">
          <div class="asb-card-header"><div>📋 Data Device</div></div>
          <div class="asb-info-rows">
            <div><strong>Nama:</strong> ${esc(ctx.identityName)}</div>
            <div><strong>Tes selesai:</strong> ${ctx.completedCount}</div>
            <div><strong>Used flag:</strong> ${ctx.usedPragas ? '✅ aktif' : '❌ belum'}</div>
            <div><strong>Device finished:</strong> ${ctx.deviceFinished ? '🔒 ya' : '🔓 belum'}</div>
            <div><strong>Device ID:</strong> <code>${esc(String(ctx.myDeviceId).slice(-12) || '(kosong)')}</code></div>
          </div>
        </div>

        ${ctx.myDeviceId ? `
          <div class="asb-card">
            <div class="asb-card-header"><div>🧪 Test Chat</div></div>
            <button class="js-test-chat asb-full-btn"
              data-device-id="${esc(ctx.myDeviceId)}"
              data-name="${esc(ctx.identityName)}">
              🧪 Test Chat (Device Sendiri)
            </button>
          </div>
        ` : ''}
      </div>`;
  }

  /* ============================================================
     EVENT DELEGATION untuk .js-test-chat (di dalam sidebar)
     ============================================================ */
  if (!window.__adminSidebarDelegationAttached) {
    window.__adminSidebarDelegationAttached = true;
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.js-test-chat');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const deviceId = btn.getAttribute('data-device-id');
      const name = btn.getAttribute('data-name');
      if (deviceId && typeof window.openChatForAdmin === 'function') {
        window.openChatForAdmin(deviceId, name);
      }
    }, true);
  }

  console.log('[ADMIN-SIDEBAR] ✓ Loaded — sidebar layout active');
})();