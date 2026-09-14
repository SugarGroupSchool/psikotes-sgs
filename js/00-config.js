/* =========================================================
   KONFIGURASI GLOBAL
   ========================================================= */

// Shim jsPDF — expose window.jsPDF dari window.jspdf.jsPDF
(function () {
  if (typeof window !== 'undefined' && window.jspdf && window.jspdf.jsPDF) {
    window.jsPDF = window.jspdf.jsPDF;
  } else {
    console.warn('[CONFIG] jsPDF belum ke-load — cek CDN di index.html');
  }
})();

const APP_CONFIG = {
    ASSETS: 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main',
    LOGO:   'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png',
  
    PASSWORDS: {
      FRESH: 'SGS-REC-Assessment84',
      USED:  'SGS-HC-Talent27',
    },
  
    STORAGE_KEYS: {
      USED_PRAGAS:   'usedPragas',
      IDENTITY:      'identity',
      COMPLETED:     'completed',
      SELECTED_TESTS:'selectedTests',
      DL_CLICK:      'dlClick',
    },
  
    FORM_FINAL_URL: 'https://forms.gle/G69K56TRfxNnBXtr9',
  
    KRAEPLIN: {
      TIME_PER_COLUMN: 15,
      TRIAL_COLUMNS:   4,
      REAL_COLUMNS:    50,
      ROWS_PER_COLUMN: 28,
    },
  
    TIMING: {
      SPLASH_DELAY:    1500,
      AUTH_SOUND_MS:   950,
      MODAL_ANIM_MS:   300,
      AUTO_SCROLL_MS:  200,
    },
  };
  
  window.__inTestView = false;
  
  console.log('[CONFIG] ✓ Loaded');