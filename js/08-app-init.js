/* ============================================================
   js/08-app-init.js
   - Bootstrap aplikasi
   - Auto focus password, Enter submit
   - Cek state "sudah pernah logout" → ganti password
   - Init appState + auto-cleanup state tidak konsisten
   - Listener global (blur, visibilitychange, beforeunload)
   ============================================================ */

   (function bootstrapApp() {

    /* ============================================================
       AUTO FOCUS PASSWORD SAAT PAGE LOAD
       ============================================================ */
    function autoFocusPassword() {
      const input = document.getElementById('passwordInput');
      if (input) {
        input.focus();
        try { input.select(); } catch (e) {}
      }
    }
  
    /* ============================================================
       ENTER KEY → SUBMIT PASSWORD
       ============================================================ */
    function attachPasswordEnter() {
      const input = document.getElementById('passwordInput');
      if (!input || input.__enterBound) return;
      input.__enterBound = true;
  
      input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (typeof checkPassword === 'function') {
            checkPassword();
          }
        }
      });
    }
  
    /* ============================================================
       CEK STATE "SUDAH LOGOUT" (usedPragas === '1')
       → kalau iya, ganti password aktif ke SGS-HC-Talent27
       ============================================================ */
    function refreshActivePassword() {
      const used = localStorage.getItem('usedPragas') === '1';
      if (typeof PASSWORD !== 'undefined') {
        window.PASSWORD = used ? "SGS-HC-Talent27" : "SGS-REC-Assessment84";
      }
    }
  
    /* ============================================================
       HELPER: RESET SEMUA STATE KANDIDAT (dipakai saat cleanup)
       ============================================================ */
    function resetCompletedState() {
      const blank = {
        IST: false, KRAEPLIN: false, DISC: false, PAPI: false,
        BIGFIVE: false, GRAFIS: false, EXCEL: false, TYPING: false, SUBJECT: false
      };
      if (window.appState) {
        window.appState.completed = blank;
        window.appState.selectedTests = [];
        window.appState.showTestCards = false;
      }
      return blank;
    }
  
    /* ============================================================
       INIT TEST CARDS STATE + AUTO-CLEANUP
       
       LOGIKA:
       - Kalau ada identity → kandidat sudah login → sync completed dari localStorage
       - Kalau TIDAK ada identity → berarti fresh kandidat (clear history / baru)
         → hapus sisa completed & selectedTests dari sesi sebelumnya
       ============================================================ */
    function initAppState() {
      window.appState = window.appState || {};
  
      /* --- 1. Pastikan showTestCards boolean --- */
      window.appState.showTestCards =
        typeof window.appState.showTestCards === 'boolean'
          ? window.appState.showTestCards
          : false;
  
      /* --- 2. Ambil identity dari localStorage dulu (untuk cek) --- */
      let identitySaved = null;
      try {
        const raw = localStorage.getItem('identity');
        if (raw) identitySaved = JSON.parse(raw);
      } catch (e) {
        identitySaved = null;
      }
  
      /* --- 3. Kalau TIDAK ada identity → RESET SEMUA STATE ---
         Ini menangani kandidat yang clear history / fresh,
         supaya tidak melihat "completed" sisa dari sesi sebelumnya.
      */
      if (!identitySaved) {
        try {
          localStorage.removeItem('completed');
          localStorage.removeItem('selectedTests');
        } catch (e) {}
  
        const blank = resetCompletedState();
        window.appState.completed = blank;
        window.appState.selectedTests = [];
  
        // Set identity ke objek kosong agar konsisten
        window.appState.identity = window.appState.identity || {};
  
        console.log('[INIT] Fresh state — completed & selectedTests dibersihkan');
        return;
      }
  
      /* --- 4. Ada identity → kandidat sudah login → sync state --- */
  
      // Sync selectedTests
      if (!Array.isArray(window.appState.selectedTests) || window.appState.selectedTests.length === 0) {
        try {
          const savedTests = JSON.parse(localStorage.getItem('selectedTests') || '[]');
          if (Array.isArray(savedTests)) {
            window.appState.selectedTests = savedTests;
          }
        } catch (e) {}
      }
  
      // Sync completed
      window.appState.completed = window.appState.completed || {};
      try {
        const savedCompleted = JSON.parse(localStorage.getItem('completed') || '{}');
        Object.assign(window.appState.completed, savedCompleted);
      } catch (e) {}
  
      // Sync identity ke appState
      if (!window.appState.identity || !window.appState.identity.name) {
        window.appState.identity = identitySaved;
      }
  
      console.log('[INIT] Resumed state — identity ditemukan, completed tersinkron');
    }
  
    /* ============================================================
       ANTI-CHEAT GLOBAL (SUBJECT)
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
       DISABLE CONTEXT MENU / DRAG
       - Hanya di dalam area tes (bukan seluruh halaman)
       ============================================================ */
    function attachCopyGuards() {
      document.addEventListener('contextmenu', function (e) {
        const inTestArea = e.target.closest('#app [data-no-ctx]');
        if (inTestArea) e.preventDefault();
      });
    }
  
    /* ============================================================
       HANDLE SEBELUM UNLOAD (peringatan kalau tes sedang jalan)
       ============================================================ */
    function attachBeforeUnload() {
      window.addEventListener('beforeunload', function (e) {
        if (window.__inTestView === true) {
          e.preventDefault();
          e.returnValue = '';
          return '';
        }
      });
    }
  
    /* ============================================================
       HELPER DEBUG: TAMPILKAN STATUS STATE
       (dipanggil manual via console: __debugState())
       ============================================================ */
    function debugState() {
      const id = localStorage.getItem('identity');
      const comp = localStorage.getItem('completed');
      const sel = localStorage.getItem('selectedTests');
      const used = localStorage.getItem('usedPragas');
  
      console.group('[DEBUG STATE]');
      console.log('Password aktif :', window.PASSWORD);
      console.log('usedPragas     :', used || '(kosong = fresh)');
      console.log('identity       :', id ? '✅ ada' : '(kosong)');
      console.log('completed      :', comp || '(kosong)');
      console.log('selectedTests  :', sel || '(kosong)');
      console.log('__inTestView   :', window.__inTestView);
      console.log('appState.identity', window.appState?.identity);
      console.log('appState.completed', window.appState?.completed);
      console.groupEnd();
    }
  
    /* ============================================================
       HELPER: FORCE RESET (untuk admin / testing)
       (dipanggil manual via console: __forceReset())
       ============================================================ */
    function forceReset() {
      if (!confirm('Reset SEMUA state? (identity, completed, selectedTests, usedPragas)')) return;
      try {
        localStorage.removeItem('identity');
        localStorage.removeItem('completed');
        localStorage.removeItem('selectedTests');
        localStorage.removeItem('usedPragas');
        sessionStorage.removeItem('dlClick');
      } catch (e) {}
      location.reload();
    }
  
    /* ============================================================
       RUN BOOTSTRAP
       ============================================================ */
    function runInit() {
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
       EXPOSE HELPER KE WINDOW
       ============================================================ */
    window.__refreshActivePassword = refreshActivePassword;
    window.__reinitApp = runInit;
    window.__debugState = debugState;
    window.__forceReset = forceReset;
  
    console.log('[APP-INIT] ✓ Loaded — helper: __debugState(), __forceReset()');
  
  })();