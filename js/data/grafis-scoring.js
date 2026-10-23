/* ============================================================
   js/data/grafis-scoring.js — LEGACY FALLBACK v9.1.0
   ------------------------------------------------------------
   ⚠️ @deprecated — sejak 2026-10-23 (Grafis Refactor v9.1)
   ------------------------------------------------------------
   Engine SCORING sudah DIHAPUS. File ini HANYA menyimpan
   CONFIG.KATEGORI (7 kategori legacy) sebagai fallback terakhir
   kalau js/data/grafis-config.js gagal load.

   Priority fallback (di 00n-grafis-interpretasi.js):
     1. Firebase sgs_config/grafis_config/{position}
     2. window.GRAFIS_CONFIG[position]
     3. window.GRAFIS_CONFIG.default
     4. window.GRAFIS_SCORING.CONFIG.KATEGORI    ← file ini
     5. Hardcoded 7 di 00n-grafis-interpretasi.js (safety net)

   API yang DIHAPUS (dulu ada di v9.0):
     ❌ hitungSkorKategori()
     ❌ generateKesimpulan()
     ❌ computePositionFit()
     ❌ detectPositionProfile()
     ❌ resolveMeta()
     ❌ BOBOT_RULES, KEYWORD_RULES, OVERRIDE_TABLE
     ❌ POSITION_PROFILES, SCORING_INTERPRETATION, DEVELOPMENT_KAMUS
     ❌ enableTrace, disableTrace, clearTrace, dumpTrace
     ❌ _debugAutoMap, _debugBobot
   ============================================================ */
(function (global) {
  'use strict';

  const VERSION = '9.1.0';
  const RELEASED = '2026-10-23';

  const CONFIG = Object.freeze({
    VERSION,
    RELEASED,

    /* Legacy 7 kategori — fallback kalau grafis-config.js gagal load */
    KATEGORI: [
      'KEMAMPUAN BERPIKIR & PROBLEM SOLVING',
      'EMPATHY, INTERPERSONAL SKILL & TEAMWORK',
      'STABILITAS EMOSI & KONTROL IMPULS',
      'MOTIVATION & ACHIEVEMENT DRIVE',
      'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY',
      'INTEGRITY & RULE COMPLIANCE',
      'TEACHING CREATIVITY'
    ]
  });

  global.GRAFIS_SCORING = {
    VERSION,
    RELEASED,
    CONFIG
  };
  global.__GRAFIS_SCORING_VERSION = VERSION;

  console.log(`[GRAFIS-SCORING] ✓ Loaded v${VERSION} (legacy fallback — KATEGORI only)`);
})(window);