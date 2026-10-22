/* ============================================================
   js/data/psikogram-config.js
   ------------------------------------------------------------
   KONFIGURASI ASPEK PSIKOGRAM PER POSISI
   
   ✅ Edit file ini kalau mau ubah:
      - aspek apa saja per posisi
      - bobot tiap sumber (IST, PAPI, BigFive, Wawancara, FGD, Grafis, SubjectTest)
      - dimensi/subtes yang dipakai tiap aspek
   
   📖 CARA BACA SATU ASPEK:
   
     {
       id: 'cognitive_ability',              ← ID unik, jangan ada spasi/simbol
       label: 'Cognitive Ability & ...',     ← Label yang muncul di UI
       weights: {                            ← BOBOT sumber (total harus 100)
         IST: 40,          → 40% dari IST
         Wawancara: 30,    → 30% dari Wawancara
         FGD: 20,          → 20% dari FGD
         Grafis: 10        → 10% dari Grafis
       },
       ist: ['AN', 'RA', 'ZR', 'FA', 'WU'],  ← subtes IST yang dipakai
       papi: [],                              ← dimensi PAPI (A-W), kosong = tidak pakai
       bigfive: [],                           ← dimensi BigFive (O/C/E/A/N), '_rev' untuk inversi
       grafisCat: 'KEMAMPUAN BERPIKIR & PROBLEM SOLVING',  ← kategori Grafis (opsional)
       subjectTest: true                      ← (opsional) true kalau pakai nilai Subject Test
     }
   
   📌 SUMBER YANG TERSEDIA (pakai nama persis ini di `weights`):
      IST, PAPI, BigFive, Wawancara, FGD, Grafis, SubjectTest
   
   📌 SUBTES IST: SE, WA, AN, GE, ME, RA, ZR, FA, WU
   📌 DIMENSI PAPI: A, N, G, T, V, W, F, C, L, P, I, E, K, O, S, B, X, Z, D, R
   📌 DIMENSI BIGFIVE: O, C, E, A, N (+ '_rev' untuk reverse scoring, contoh: 'N_rev')
   📌 KATEGORI GRAFIS (harus persis):
      - 'KEMAMPUAN BERPIKIR & PROBLEM SOLVING'
      - 'EMPATHY, INTERPERSONAL SKILL & TEAMWORK'
      - 'STABILITAS EMOSI & KONTROL IMPULS'
      - 'MOTIVATION & ACHIEVEMENT DRIVE'
      - 'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY'
      - 'INTEGRITY & RULE COMPLIANCE'
      - 'TEACHING CREATIVITY'
   
   🔍 VALIDASI: total `weights` per aspek HARUS = 100.
      Kalau tidak, sistem tetap jalan (dihitung proporsional) tapi hasil kurang akurat.
   ============================================================ */

window.PSIKOGRAM_CONFIG_VERSION = '2026-10-22-v1';

window.PSIKOGRAM_CONFIG = {

  /* ==========================================================
     GURU / DOSEN — 11 aspek (existing, tidak berubah)
     ========================================================== */
  guru: {
    label: 'Guru / Dosen',
    matchKeywords: ['guru', 'dosen', 'teacher', 'pengajar', 'kindergarten', 'primary', 'math', 'biology', 'english'],
    aspects: [
      {
        id: 'cognitive_ability',
        label: 'Cognitive Ability & Problem Solving',
        weights: { IST: 40, Wawancara: 30, FGD: 20, Grafis: 10 },
        ist: ['AN', 'RA', 'ZR', 'FA', 'WU'],
        papi: [],
        bigfive: [],
        grafisCat: 'KEMAMPUAN BERPIKIR & PROBLEM SOLVING'
      },
      {
        id: 'verbal_communication',
        label: 'Verbal Communication & Material Explanation',
        weights: { IST: 25, BigFive: 15, Wawancara: 35, FGD: 25 },
        ist: ['WA', 'GE', 'AN'],
        papi: [],
        bigfive: ['E', 'A']
      },
      {
        id: 'classroom_management',
        label: 'Classroom Management & Instructional Leadership',
        weights: { IST: 5, PAPI: 20, BigFive: 10, Wawancara: 35, FGD: 30 },
        ist: ['SE', 'GE', 'AN', 'WA'],
        papi: ['L', 'P', 'I'],
        bigfive: ['C', 'N_rev']
      },
      {
        id: 'empathy_interpersonal',
        label: 'Empathy & Interpersonal Skills',
        weights: { IST: 5, PAPI: 10, BigFive: 30, Wawancara: 30, Grafis: 5, FGD: 20 },
        ist: ['WA'],
        papi: ['O', 'S', 'B', 'X'],
        bigfive: ['A', 'E'],
        grafisCat: 'EMPATHY, INTERPERSONAL SKILL & TEAMWORK'
      },
      {
        id: 'emotional_stability',
        label: 'Emotional Stability & Impulse Control',
        weights: { PAPI: 20, BigFive: 35, Grafis: 30, Wawancara: 15 },
        ist: [],
        papi: ['E', 'K'],
        bigfive: ['N_rev'],
        grafisCat: 'STABILITAS EMOSI & KONTROL IMPULS'
      },
      {
        id: 'motivation_drive',
        label: 'Motivation & Achievement Drive',
        weights: { PAPI: 40, Wawancara: 30, BigFive: 20, Grafis: 10 },
        ist: [],
        papi: ['A', 'N', 'G', 'T', 'V'],
        bigfive: ['C'],
        grafisCat: 'MOTIVATION & ACHIEVEMENT DRIVE'
      },
      {
        id: 'work_discipline',
        label: 'Work Discipline & Reliability',
        weights: { PAPI: 35, BigFive: 45, Wawancara: 20 },
        ist: [],
        papi: ['G', 'W', 'F', 'C'],
        bigfive: ['C']
      },
      {
        id: 'flexibility_adaptability',
        label: 'Flexibility, Adaptability & Learning Agility',
        weights: { IST: 5, PAPI: 20, BigFive: 25, Grafis: 10, FGD: 15, Wawancara: 25 },
        ist: ['AN'],
        papi: ['Z', 'V'],
        bigfive: ['O', 'N_rev'],
        grafisCat: 'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY'
      },
      {
        id: 'integrity_compliance',
        label: 'Integrity & Rule Compliance',
        weights: { PAPI: 40, Grafis: 20, Wawancara: 40 },
        ist: [],
        papi: ['W', 'F', 'C', 'G'],
        bigfive: [],
        grafisCat: 'INTEGRITY & RULE COMPLIANCE'
      },
      {
        id: 'teaching_creativity',
        label: 'Teaching Creativity',
        weights: { IST: 10, BigFive: 35, Wawancara: 35, Grafis: 20 },
        ist: ['FA', 'WU', 'AN'],
        papi: [],
        bigfive: ['O'],
        grafisCat: 'TEACHING CREATIVITY'
      },
      {
        id: 'teaching_practice',
        label: 'Teaching Practice Skills',
        weights: { Wawancara: 40, SubjectTest: 60 },
        ist: [],
        papi: [],
        bigfive: [],
        subjectTest: true
      }
    ]
  },

  /* ==========================================================
     ADMINISTRATOR / STAFF — isi aspek sesuai kebutuhan
     ----------------------------------------------------------
     Sementara kosong → psikogram TIDAK muncul untuk posisi ini.
     Isi aspek di bawah ini kalau siap.
     ========================================================== */
  admin: {
    label: 'Administrator / Staff',
    matchKeywords: ['admin', 'staff', 'sekretariat', 'office'],
    aspects: [
      // ====== CONTOH (hapus komentar kalau mau pakai) ======
      // {
      //   id: 'integritas',
      //   label: 'Integritas & Kepatuhan',
      //   weights: { PAPI: 40, Wawancara: 40, Grafis: 20 },
      //   ist: [],
      //   papi: ['W', 'F', 'C', 'G'],
      //   bigfive: [],
      //   grafisCat: 'INTEGRITY & RULE COMPLIANCE'
      // },
      // {
      //   id: 'ketelitian',
      //   label: 'Akurasi & Ketelitian Kerja',
      //   weights: { IST: 30, PAPI: 40, BigFive: 30 },
      //   ist: ['FA', 'WU'],
      //   papi: ['D', 'C'],
      //   bigfive: ['C']
      // },
      // {
      //   id: 'penguasaan_apps',
      //   label: 'Penguasaan Aplikasi Administrasi',
      //   weights: { IST: 20, Wawancara: 50, SubjectTest: 30 },
      //   ist: ['ME'],
      //   papi: ['R'],
      //   bigfive: ['O'],
      //   subjectTest: true
      // }
    ]
  },

  /* ==========================================================
     IT STAFF — isi aspek sesuai kebutuhan
     ========================================================== */
  it: {
    label: 'IT Staff',
    matchKeywords: ['it ', 'programmer', 'developer', 'software', 'engineer'],
    aspects: [
      // {
      //   id: 'cognitive_ability',
      //   label: 'Cognitive Ability & Problem Solving',
      //   weights: { IST: 50, Wawancara: 30, FGD: 20 },
      //   ist: ['AN', 'RA', 'ZR', 'FA'],
      //   papi: [],
      //   bigfive: []
      // },
      // {
      //   id: 'technical_skill',
      //   label: 'Technical Skill & Tool Mastery',
      //   weights: { Wawancara: 40, SubjectTest: 60 },
      //   ist: [],
      //   papi: [],
      //   bigfive: [],
      //   subjectTest: true
      // }
    ]
  },

  /* ==========================================================
     WELDER — isi aspek sesuai kebutuhan
     ========================================================== */
  welder: {
    label: 'Welder',
    matchKeywords: ['welder', 'las', 'welding'],
    aspects: [
      // {
      //   id: 'technical_skill',
      //   label: 'Technical Skill & Welding Precision',
      //   weights: { Wawancara: 60, SubjectTest: 40 },
      //   ist: [],
      //   papi: [],
      //   bigfive: [],
      //   subjectTest: true
      // },
      // {
      //   id: 'safety_awareness',
      //   label: 'Safety Awareness & Procedure Compliance',
      //   weights: { PAPI: 40, Wawancara: 60 },
      //   ist: [],
      //   papi: ['W', 'F', 'C', 'G'],
      //   bigfive: ['C']
      // }
    ]
  },

  /* ==========================================================
     TECHNICAL STAFF — isi aspek sesuai kebutuhan
     ========================================================== */
  technical: {
    label: 'Technical Staff',
    matchKeywords: ['technical', 'teknisi', 'technician'],
    aspects: [
      // {...}
    ]
  },

  /* ==========================================================
     HOUSEKEEPING — isi aspek sesuai kebutuhan
     ========================================================== */
  housekeeping: {
    label: 'Housekeeping',
    matchKeywords: ['housekeeping', 'kebersihan', 'cleaning'],
    aspects: [
      // {...}
    ]
  }

};

console.log('[PSIKOGRAM-CONFIG] ✓ Loaded v' + window.PSIKOGRAM_CONFIG_VERSION);