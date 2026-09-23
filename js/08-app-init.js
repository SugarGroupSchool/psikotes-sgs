/* ============================================================
   js/08-app-init.js
   - Bootstrap aplikasi
   - Auto focus password, Enter submit
   - Cek state "sudah pernah logout" → ganti password
   - Init appState + auto-cleanup state tidak konsisten
   - Handle URL ?fresh=1 → paksa reset semua state
   - Listener global (blur, visibilitychange, beforeunload)
   - 🆕 Resume state: clear saat device finished / fresh
   ============================================================ */

(function bootstrapApp() {

  /* ============================================================
     0. HANDLE URL ?fresh=1 — PALING ATAS

     Kalau URL punya ?fresh=1:
     - Clear localStorage & sessionStorage
     - Bersihkan URL (hapus parameter) supaya refresh berikutnya
       tidak clear lagi

     Cara pakai untuk kandidat baru:
       https://site.com/?fresh=1
     ============================================================ */
  (function handleFreshParam() {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('fresh') === '1') {
        const finishedFlag = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DEVICE_FINISHED);
        const lockState    = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LOCK_ALL);
        const freshPwd     = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.PWD_FRESH);
        const usedPwd      = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.PWD_USED);

        // 🆕 Clear resume state juga (localStorage)
        try { localStorage.removeItem('_sgs_resume'); } catch (e) {}

        localStorage.clear();
        sessionStorage.clear();

        // Restore admin & device state (jangan hilang)
        if (finishedFlag) localStorage.setItem(APP_CONFIG.STORAGE_KEYS.DEVICE_FINISHED, finishedFlag);
        if (lockState)    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.LOCK_ALL, lockState);
        if (freshPwd)     localStorage.setItem(APP_CONFIG.STORAGE_KEYS.PWD_FRESH, freshPwd);
        if (usedPwd)      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.PWD_USED, usedPwd);

        // 🆕 Clear resume di Firebase juga
        if (typeof window.__resumeClear === 'function') {
          try { window.__resumeClear(); } catch (e) {}
        }

        console.log('[INIT] ?fresh=1 → state direset (admin & device tetap)');

        const cleanPath = url.pathname.replace(/^\/+/, '/');
        url.searchParams.delete('fresh');
        const cleanSearch = url.searchParams.toString() ? '?' + url.searchParams.toString() : '';
        const cleanUrl = cleanPath + cleanSearch + (url.hash || '');
        window.history.replaceState({}, '', cleanUrl);
      }
    } catch (e) {
      console.warn('[INIT] Gagal ?fresh=1:', e);
    }
  })();

  /* ============================================================
     1. AUTO FOCUS PASSWORD SAAT PAGE LOAD
     ============================================================ */
  function autoFocusPassword() {
    const input = document.getElementById('passwordInput');
    if (input) {
      input.focus();
      try { input.select(); } catch (e) {}
    }
  }

  /* ============================================================
     2. ENTER KEY → SUBMIT PASSWORD
     ============================================================ */
  function attachPasswordEnter() {
    const input = document.getElementById('passwordInput');
    if (!input || input.__enterBound) return;
    input.__enterBound = true;

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (typeof checkPassword === 'function') {
          checkPassword();
        }
      }
    });
  }

  /* ============================================================
     3. CEK STATE "SUDAH LOGOUT" (usedPragas === '1')
     → kalau iya, ganti password aktif ke SGS-HC-Talent27
     ============================================================ */
  function refreshActivePassword() {
    const used = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USED_PRAGAS) === '1';
    if (used) {
      window.PASSWORD = (typeof window.getUsedPwd === 'function')
        ? window.getUsedPwd()
        : APP_CONFIG.DEFAULT_USED_PWD;
    } else {
      window.PASSWORD = (typeof window.getFreshPwd === 'function')
        ? window.getFreshPwd()
        : APP_CONFIG.DEFAULT_FRESH_PWD;
    }
  }

  /* ============================================================
     4. HELPER: BLANK COMPLETED STATE
     ============================================================ */
  function blankCompleted() {
    return {
      IST: false, KRAEPLIN: false, DISC: false, PAPI: false,
      BIGFIVE: false, GRAFIS: false, EXCEL: false, TYPING: false, SUBJECT: false
    };
  }

  function resetCompletedState() {
    const blank = blankCompleted();
    if (window.appState) {
      window.appState.completed = blank;
      window.appState.selectedTests = [];
      window.appState.showTestCards = false;
    }
    return blank;
  }

  /* ============================================================
     5. INIT APP STATE + AUTO-CLEANUP

     LOGIKA:
     - Ambil `identity` dari localStorage
     - Validasi: harus ada `name` yang tidak kosong
     - Kalau TIDAK valid → FRESH MODE:
         * Hapus identity, completed, selectedTests
         * Reset appState ke blank
     - Kalau VALID → RESUME MODE:
         * Load identity, completed, selectedTests dari localStorage
         * Set ke appState
     ============================================================ */
  function initAppState() {
    window.appState = window.appState || {};

    /* --- Pastikan showTestCards boolean --- */
    window.appState.showTestCards =
      typeof window.appState.showTestCards === 'boolean'
        ? window.appState.showTestCards
        : false;

    /* --- Baca identity dari localStorage --- */
    let identitySaved = null;
    try {
      const rawId = localStorage.getItem('identity');
      if (rawId) identitySaved = JSON.parse(rawId);
    } catch (e) {
      identitySaved = null;
    }

    /* --- Validasi identity: harus ada `name` yang valid --- */
    const hasValidIdentity =
      identitySaved &&
      typeof identitySaved === 'object' &&
      typeof identitySaved.name === 'string' &&
      identitySaved.name.trim().length > 0;

    /* --- FRESH MODE: tidak ada identity valid → reset semua --- */
    if (!hasValidIdentity) {
      try {
        localStorage.removeItem('identity');
        localStorage.removeItem('completed');
        localStorage.removeItem('selectedTests');
        // 🆕 Clear resume state juga
        localStorage.removeItem('_sgs_resume');
      } catch (e) {}

      window.appState.identity = {};
      window.appState.completed = resetCompletedState();
      window.appState.selectedTests = [];
      window.appState.showTestCards = false;

      console.log('[INIT] 🆕 FRESH MODE — tidak ada identity valid, state direset');
      return;
    }

    /* --- RESUME MODE: identity valid → load semua state --- */

    // Baca completed
    let completedSaved = {};
    try {
      const rawComp = localStorage.getItem('completed');
      if (rawComp) completedSaved = JSON.parse(rawComp) || {};
    } catch (e) {
      completedSaved = {};
    }

    // Baca selectedTests
    let selectedSaved = [];
    try {
      const rawSel = localStorage.getItem('selectedTests');
      if (rawSel) {
        const parsed = JSON.parse(rawSel);
        if (Array.isArray(parsed)) selectedSaved = parsed;
      }
    } catch (e) {
      selectedSaved = [];
    }

    // Set ke appState
    window.appState.identity = identitySaved;
    window.appState.completed = Object.assign(blankCompleted(), completedSaved);
    window.appState.selectedTests = selectedSaved;

    const completedCount = Object.values(window.appState.completed).filter(v => v === true).length;
    console.log('[INIT] ♻️ RESUME MODE —', {
      name: identitySaved.name,
      completed: completedCount + ' tes',
      selected: selectedSaved.length + ' tes'
    });
  }

  /* ============================================================
     6. ANTI-CHEAT GLOBAL (SUBJECT)
     - Hanya aktif saat appState.subjectSelected diisi
     - Blur / tab switch → diskualifikasi
     ============================================================ */
  function attachAntiCheat() {
    window.addEventListener('blur', function () {
      if (typeof onSubjectBlur === 'function') {
        onSubjectBlur();
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && typeof onSubjectBlur === 'function') {
        onSubjectBlur();
      }
    });
  }

  /* ============================================================
     7. (removed) attachCopyGuards — tidak dipakai, context menu
        sudah di-disable global di 04-auth.js
     ============================================================ */
  function attachCopyGuards() { /* no-op */ }

  /* ============================================================
     8. HANDLE SEBELUM UNLOAD (peringatan kalau tes sedang jalan)
     ============================================================ */
  function attachBeforeUnload() {
    window.addEventListener('beforeunload', function (e) {
      // 🔥 Skip kalau ada flag khusus (misal: admin paksa reload)
      if (window.__skipBeforeUnload === true) return;

      if (window.__inTestView === true) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    });
  }

  /* ============================================================
     9. HELPER DEBUG: TAMPILKAN STATUS STATE
     Panggil via console: __debugState()
     ============================================================ */
  function debugState() {
    const id   = localStorage.getItem('identity');
    const comp = localStorage.getItem('completed');
    const sel  = localStorage.getItem('selectedTests');
    const used = localStorage.getItem('usedPragas');
    const res  = localStorage.getItem('_sgs_resume');

    let parsedId = null;
    try { parsedId = id ? JSON.parse(id) : null; } catch (e) {}

    let parsedRes = null;
    try { parsedRes = res ? JSON.parse(res) : null; } catch (e) {}

    console.group('[DEBUG STATE]');
    console.log('Password aktif   :', window.PASSWORD);
    console.log('usedPragas       :', used || '(kosong = fresh)');
    console.log('identity exists? :', id ? '✅ ADA' : '❌ kosong');
    console.log('  name           :', parsedId?.name || '(kosong)');
    console.log('  position       :', parsedId?.position || '(kosong)');
    console.log('completed        :', comp || '(kosong)');
    console.log('selectedTests    :', sel || '(kosong)');
    console.log('__inTestView     :', window.__inTestView);
    console.log('resume state     :', parsedRes
      ? `✅ ${parsedRes.currentTest} @ soal ${(parsedRes.currentQuestion || 0) + 1}`
      : '(kosong)');
    console.log('appState.identity:', window.appState?.identity);
    console.log('appState.completed:', window.appState?.completed);
    console.log('appState.selectedTests:', window.appState?.selectedTests);
    console.groupEnd();
  }

  /* ============================================================
     10. HELPER: FORCE RESET (untuk admin / testing)
     Panggil via console: __forceReset()
     ============================================================ */
  function forceReset() {
    if (!confirm('Reset SEMUA state? (identity, completed, selectedTests, usedPragas, resume)')) return;
    try {
      localStorage.removeItem('identity');
      localStorage.removeItem('completed');
      localStorage.removeItem('selectedTests');
      localStorage.removeItem('usedPragas');
      // 🆕 Clear resume juga
      localStorage.removeItem('_sgs_resume');
      sessionStorage.removeItem('dlClick');
    } catch (e) {}

    // 🆕 Clear resume di Firebase
    if (typeof window.__resumeClear === 'function') {
      try { window.__resumeClear(); } catch (e) {}
    }

    location.reload();
  }

  /* ============================================================
     11. HELPER: FORCE FRESH (via URL ?fresh=1)
     Panggil via console: __forceFresh()
     ============================================================ */
  function forceFresh() {
    const url = new URL(window.location.href);
    url.searchParams.set('fresh', '1');
    window.location.href = url.toString();
  }

  /* ============================================================
     12. RUN BOOTSTRAP
     ============================================================ */
async function runInit() {
  /* Cek device finished — tampilkan layar request */
    /* Cek device finished — tampilkan layar request */
    if (localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DEVICE_FINISHED) === '1') {
      // 🆕 Clear resume — device sudah selesai
      if (typeof window.__resumeClear === 'function') {
        try { window.__resumeClear(); } catch (e) {}
      }

      const pwdScreen = document.getElementById('passwordScreen');
      if (pwdScreen) pwdScreen.classList.add('hidden');
      if (typeof showRequestAccessScreen === 'function') {
        showRequestAccessScreen();
        console.log('[INIT] Device finished → layar request izin');
        return;
      }
    }

    /* Cek URL admin */
    if (typeof window.checkAdminUrlAndRender === 'function') {
      if (window.checkAdminUrlAndRender()) {
        console.log('[INIT] Mode admin — init normal di-skip');
        return;
      }
    }

    /* ✅ Login anonim Firebase untuk kandidat */
    if (typeof window.initAnonymousAuth === 'function') {
      try {
        await window.initAnonymousAuth();
      } catch (e) {
        console.warn('[INIT] Anonymous auth error:', e);
      }
    }

    /* Init normal */
    refreshActivePassword();
    initAppState();
    attachPasswordEnter();
    autoFocusPassword();
    attachAntiCheat();
    attachCopyGuards();
    attachBeforeUnload();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInit);
  } else {
    runInit();
  }

  /* ============================================================
     13. EXPOSE HELPER KE WINDOW
     ============================================================ */
  window.__refreshActivePassword = refreshActivePassword;
  window.__reinitApp = runInit;
  window.__debugState = debugState;
  window.__forceReset = forceReset;
  window.__forceFresh = forceFresh;

  console.log('[APP-INIT] ✓ Loaded — helper: __debugState(), __forceReset(), __forceFresh()');

})();
