/* =========================================================
   OBJEK GLOBAL `tests` — Penggabung semua data
   WAJIB dimuat SETELAH semua file data individual
   dan SEBELUM file tests/*.js
   ========================================================= */

   window.tests = {
    IST: {
      name: "Intelligenz Struktur Test (IST)",
      description: "Tes kemampuan intelektual yang mengukur berbagai aspek kecerdasan",
      subtests: (typeof IST_DATA !== 'undefined') ? IST_DATA : []
    },
  
    KRAEPLIN: (typeof KRAEPLIN_DATA !== 'undefined') ? KRAEPLIN_DATA : {
      name: "Tes Kraeplin",
      description: "Hitung cepat dan teliti, isi satu kolom dalam 15 detik.",
      columns: [],
      timePerColumn: 15
    },
  
    DISC: (typeof DISC_DATA !== 'undefined') ? DISC_DATA : {},
  
    PAPI: (typeof PAPI_DATA !== 'undefined') ? PAPI_DATA : {},
  
    BIGFIVE: (typeof BIGFIVE_DATA !== 'undefined') ? BIGFIVE_DATA : {},
  
    SUBJECT: (typeof SUBJECT_DATA !== 'undefined') ? SUBJECT_DATA : {},
  
    GRAFIS: (typeof GRAFIS_DATA !== 'undefined') ? GRAFIS_DATA : { subtests: [] }
  };
  
  // === Alias untuk kompatibilitas kode asli ===
  // (kode asli kadang merujuk ke `tests.SUBJECT.subjects`)
  if (!window.tests.SUBJECT.subjects) {
    window.tests.SUBJECT.subjects = [];
  }
  
  console.log('[GLOBAL-TESTS] ✓ Loaded');
  console.log('  → IST     :', window.tests.IST.subtests.length, 'subtes');
  console.log('  → DISC    :', window.tests.DISC.questions?.length || 0, 'soal');
  console.log('  → PAPI    :', window.tests.PAPI.questions?.length || 0, 'soal');
  console.log('  → BIGFIVE :', window.tests.BIGFIVE.questions?.length || 0, 'soal');
  console.log('  → SUBJECT :', window.tests.SUBJECT.subjects?.length || 0, 'subjek');