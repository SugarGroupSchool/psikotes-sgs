/* =========================================================
   KONFIGURASI GLOBAL — Admin Control System
   ========================================================= */

if (typeof window !== 'undefined' && window.jspdf && window.jspdf.jsPDF) {
  window.jsPDF = window.jspdf.jsPDF;
} else {
  console.warn('[CONFIG] jsPDF belum ke-load');
}

const APP_CONFIG = {
  ASSETS: 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main',
  LOGO:   'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png',

  /* ============================================================
     DEFAULT PASSWORDS (dipakai kalau belum ada di localStorage)
     ============================================================ */
  DEFAULT_FRESH_PWD: 'SGS-REC-Assessment84',
  DEFAULT_USED_PWD:  'SGS-HC-Talent27',

  /* ============================================================
     STORAGE KEYS
     ============================================================ */
  STORAGE_KEYS: {
    USED_PRAGAS:   'usedPragas',
    IDENTITY:      'identity',
    COMPLETED:     'completed',
    SELECTED_TESTS:'selectedTests',
    DL_CLICK:      'dlClick',
    DEVICE_FINISHED: '_sgs_finished',
    // 🔐 Admin control
    LOCK_ALL:      '_sgs_lock',         // "1" = semua login ditolak
    PWD_FRESH:     '_sgs_pwd_fresh',    // password untuk kandidat baru
    PWD_USED:      '_sgs_pwd_used',     // password setelah logout/disqualified
  },

  ADMIN_KEY: 'sgsadm-gldIgrwRYqHUHBY0',
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

  /* ============================================================
     GENERATOR PASSWORD ACAK
     ============================================================ */
  generateRandomPassword(prefix) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 8; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + out;
  },
};

window.__inTestView = false;

console.log('[CONFIG] ✓ Loaded');
