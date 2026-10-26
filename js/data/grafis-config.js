/* ============================================================
   js/data/grafis-config.js — Default Kosong (Diisi via Admin UI)
   ============================================================ */
(function (global) {
  'use strict';

  // 🆕 DAFTAR POSISI MASTER (Bisa ditambah di sini kapan saja)
  global.MASTER_POSITIONS = [
    { key: 'guru',         label: 'Guru / Dosen',   icon: '📚' },
    { key: 'admin',        label: 'Administrator',  icon: '💼' },
    { key: 'it',           label: 'IT Staff',       icon: '💻' },
    { key: 'welder',       label: 'Welder',         icon: '🔧' },
    { key: 'technical',    label: 'Technical',      icon: '⚙️' },
    { key: 'housekeeping', label: 'Housekeeping',   icon: '🧹' },
    { key: 'security',     label: 'Security',       icon: '🛡️' }, // 🆕 Contoh nambah posisi
    { key: 'driver',       label: 'Driver',         icon: '🚗' }  // 🆕 Contoh nambah posisi
  ];

  global.GRAFIS_POSITION_MATCHERS = {
    guru:         /guru|dosen|teacher|pengajar|biologi|kimia|fisika|matematika|math|bahasa|inggris|indonesia|lampung|sejarah|sosial|\bipa\b|islam|kristen|katholik|katolik|hindu|\btik\b|visual|\bart\b|olahraga|olah\s*raga/i,
    it:           /\bit\b|programmer|developer|software|network/i,
    welder:       /welder|welding|\blas\b/i,
    technical:    /technical|teknisi|operator|maintenance|engineering|produksi|baker|wood/i,
    housekeeping: /housekeeping|cleaning|kebersihan|kebun|gardener/i,
    admin:        /admin|staff|sekretaris|klerk|office|kantor|tata\s*usaha|administrasi/i,
    security:     /security|satpam|keamanan/i,   // 🆕 Matcher untuk Security
    driver:       /driver|pengemudi|sopir/i      // 🆕 Matcher untuk Driver
  };

  global.GRAFIS_CONFIG = {
    guru:         { aspects: [] },
    admin:        { aspects: [] },
    it:           { aspects: [] },
    welder:       { aspects: [] },
    technical:    { aspects: [] },
    housekeeping: { aspects: [] },
    default:      { aspects: [] }
  };

  global.__resolveGrafisPosition = function (position) {
    const pos = String(position || '').toLowerCase().trim();
    if (!pos) return 'default';
    const order = ['guru', 'it', 'welder', 'technical', 'housekeeping', 'admin'];
    for (let i = 0; i < order.length; i++) {
      const key = order[i];
      const rx = global.GRAFIS_POSITION_MATCHERS[key];
      if (rx && rx.test(pos)) return key;
    }
    return 'default';
  };

  console.log('[GRAFIS-CONFIG] Loaded v2.0.0 — Empty Defaults (Editable via UI)');
})(window);