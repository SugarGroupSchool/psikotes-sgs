/* =========================================================
   KONFIGURASI GLOBAL — Admin Control System
   ---------------------------------------------------------
   🔒 SECURITY FIX [2026-09-22]:
   - P1-1: Hapus DEFAULT_FRESH_PWD & DEFAULT_USED_PWD (fail-closed)
   - P1-2: ADMIN_KEY di-hash (tidak plain text)
   - P1-3: Tambah flag REQUIRE_CLOUD_READY
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
     🔒 PASSWORDS — TIDAK ADA DEFAULT!
     Password WAJIB datang dari Firebase /sgs_state/freshPwd
     Kalau Firebase offline → login DITOLAK (fail-closed).
     ============================================================ */

  /* 🔒 REQUIRE_CLOUD_READY: kalau true, kandidat tidak bisa login
     sampai Firebase cloud state (lock + password) ter-load. */
  REQUIRE_CLOUD_READY: true,

  STORAGE_KEYS: {
    USED_PRAGAS:   'usedPragas',
    IDENTITY:      'identity',
    COMPLETED:     'completed',
    SELECTED_TESTS:'selectedTests',
    DL_CLICK:      'dlClick',
    DEVICE_FINISHED: '_sgs_finished',
    LOCK_ALL:      '_sgs_lock',
    PWD_FRESH:     '_sgs_pwd_fresh',
    PWD_USED:      '_sgs_pwd_used',
    DEVICE_ID:     '_sgs_device_id',
  },

  /* ============================================================
     🔒 ADMIN KEY — disimpan sebagai hash SHA-256.
     Cara generate: buka console browser → jalankan
       crypto.subtle.digest('SHA-256', new TextEncoder().encode('KEY-BARU-ANDA'))
         .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
     Ganti nilai di bawah dengan hasil hash.
     ============================================================ */
  ADMIN_KEY_HASH: 'f4a5b8e2c9d6f1a3b7e4c2d5f8a1b6e3c7d9f2a4b5e8c1d6f3a7b4e9c2d5f8a1',

  /* URL fallback Google Form */
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

  generateRandomPassword(prefix) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 8; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + out;
  },

  /* 🔒 Helper: cek admin URL (pakai hash) */
  async isAdminKey(key) {
    if (!key || typeof key !== 'string') return false;
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
      const hex = [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
      return hex === APP_CONFIG.ADMIN_KEY_HASH;
    } catch (e) {
      return false;
    }
  },
};

window.__inTestView = false;

console.log('[CONFIG] ✓ Loaded — secured mode');
