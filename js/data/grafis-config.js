/* ============================================================
   js/data/grafis-config.js — Grafis Config (Default per Posisi)
   ------------------------------------------------------------
   v1.0.0 [2026-10-23]
   - Default config GRAFIS per posisi (6 + fallback default)
   - Priority runtime: Firebase > JS default
   - Konsumsi: 00n-grafis-interpretasi.js, 00b4-admin-grafis-config.js
   ============================================================ */
(function (global) {
  'use strict';

  /* ============================================================
     POSITION MATCHERS — map posisi string → key
     Order matters: specific first, generic last
     ============================================================ */
  global.GRAFIS_POSITION_MATCHERS = {
    guru:         /guru|dosen|teacher|pengajar|biologi|kimia|fisika|matematika|math|bahasa|inggris|indonesia|lampung|sejarah|sosial|\bipa\b|islam|kristen|katholik|katolik|hindu|\btik\b|visual|\bart\b|olahraga|olah\s*raga/i,
    it:           /\bit\b|programmer|developer|software|network/i,
    welder:       /welder|welding|\blas\b/i,
    technical:    /technical|teknisi|operator|maintenance|engineering|produksi|baker|wood/i,
    housekeeping: /housekeeping|cleaning|kebersihan|kebun|gardener/i,
    admin:        /admin|staff|sekretaris|klerk|office|kantor|tata\s*usaha/i
  };

  /* ============================================================
     7 KATEGORI DEFAULT — basis untuk semua posisi
     (setiap posisi boleh punya kategori berbeda via Firebase)
     ============================================================ */
  const DEFAULT_7 = [
    {
      id: 'kemampuan-berpikir',
      label: 'KEMAMPUAN BERPIKIR & PROBLEM SOLVING',
      description: 'Kapasitas kognitif, analisis, dan pemecahan masalah.'
    },
    {
      id: 'empathy-interpersonal',
      label: 'EMPATHY, INTERPERSONAL SKILL & TEAMWORK',
      description: 'Empati, komunikasi, dan kerja sama tim.'
    },
    {
      id: 'stabilitas-emosi',
      label: 'STABILITAS EMOSI & KONTROL IMPULS',
      description: 'Kestabilan emosi dan pengendalian impuls.'
    },
    {
      id: 'motivation-drive',
      label: 'MOTIVATION & ACHIEVEMENT DRIVE',
      description: 'Dorongan berprestasi, ketekunan, dan inisiatif.'
    },
    {
      id: 'fleksibilitas-adaptasi',
      label: 'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY',
      description: 'Kemampuan menyesuaikan diri dan cepat belajar.'
    },
    {
      id: 'integrity-compliance',
      label: 'INTEGRITY & RULE COMPLIANCE',
      description: 'Integritas, kejujuran, dan kepatuhan aturan.'
    },
    {
      id: 'teaching-creativity',
      label: 'TEACHING CREATIVITY',
      description: 'Kreativitas dan inovasi dalam pengajaran/kerja.'
    }
  ];

  const clone = (arr) => arr.map((x) => ({ ...x }));

  /* ============================================================
     GRAFIS_CONFIG — default per posisi
     (semua posisi start dari 7 default — admin bisa edit via UI)
     ============================================================ */
  global.GRAFIS_CONFIG = {
    guru:         { aspects: clone(DEFAULT_7) },
    admin:        { aspects: clone(DEFAULT_7) },
    it:           { aspects: clone(DEFAULT_7) },
    welder:       { aspects: clone(DEFAULT_7) },
    technical:    { aspects: clone(DEFAULT_7) },
    housekeeping: { aspects: clone(DEFAULT_7) },
    default:      { aspects: clone(DEFAULT_7) }
  };

  /* ============================================================
     RESOLVE POSITION — string posisi → key matcher
     ============================================================ */
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

  console.log('[GRAFIS-CONFIG] Loaded v1.0.0 — 7 posisi');
})(window);