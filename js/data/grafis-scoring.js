/* ============================================================
   js/data/grafis-scoring.js — GRAFIS SCORING ENGINE v9.0
   ------------------------------------------------------------
   SINGLE SOURCE OF TRUTH untuk auto-scoring DAP / BAUM / HTP.
   
   Dipakai oleh:
   - js/00n-grafis-interpretasi.js (form admin)
   - js/tests/grafis.js (preview kandidat, opsional)
   
   Basis literatur:
   - Machover (1949)  — Personality Projection in DAP
   - Buck (1948)      — HTP Manual
   - Koch (1952)      — Der Baumtest
   - Hammer (1958)    — The Clinical Application of Projective Drawings
   - Groth-Marnat (2009) — Handbook of Psychological Assessment
   
   Prinsip desain:
   1. Delta-based scoring (proporsi +/− dengan bobot)
   2. Confidence level berbasis kekayaan data (total bobot)
   3. Konvergensi minimal 2 indikator searah (no single-sign)
   4. Red flag dipisah, TIDAK di-average ke skor
   5. Override table untuk tuning manual per item
   6. Trace logging untuk audit & debugging
   7. Disclaimer jelas: screening, bukan diagnosis klinis
   ============================================================ */

(function (global) {
  'use strict';

  /* ============================================================
     VERSI & KONFIGURASI
     ============================================================ */
  const VERSION = '9.0.0';
  const RELEASED = '2026-10-02';

  const CONFIG = Object.freeze({
    VERSION,
    RELEASED,

    KATEGORI: [
      'KEMAMPUAN BERPIKIR & PROBLEM SOLVING',
      'EMPATHY, INTERPERSONAL SKILL & TEAMWORK',
      'STABILITAS EMOSI & KONTROL IMPULS',
      'MOTIVATION & ACHIEVEMENT DRIVE',
      'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY',
      'INTEGRITY & RULE COMPLIANCE',
      'TEACHING CREATIVITY'
    ],

    SKOR_BASE: 3.0,
    SKOR_MIN: 1.0,
    SKOR_MAX: 4.0,
    DELTA_SCALE: 1.2,

    MIN_BOBOT_CONFIDENCE: 6,
    MIN_KONVERGENSI: 2,

    THRESHOLD: {
      SANGAT_BAIK: 3.5,
      BAIK: 3.0,
      CUKUP: 2.5
    },

    FIT_THRESHOLD: {
      HIGHLY: 85,
      RECO: 70,
      FAIRLY: 50
    },

    RED_FLAG_BOBOT: 3,
    MAX_TRACE_ENTRIES: 500
  });

  /* ============================================================
     BOBOT & RED FLAG RULES
     ============================================================ */
  const BOBOT_RULES = Object.freeze({
    RED_FLAG: [
      /mutilasi/i, /dipotong/i, /terpotong/i, /terputus/i,
      /terbakar/i, /runtuh/i, /tumbang/i, /kematian/i, /\bmati\b/i,
      /mayat/i, /hantu/i, /kuburan/i, /bunuh/i, /kastrasi/i,
      /organ.*hilang/i, /x.?ray/i, /kerangka/i,
      /menembus.*kepala/i
    ],
    BERAT: [
      /agresif/i, /bermusuhan/i, /marah/i, /meledak/i,
      /depresi/i, /psikosis/i, /skizo/i, /paranoid/i, /manik/i,
      /\bkacau\b/i, /histeris/i, /destruktif/i,
      /bunuh diri/i, /suicid/i, /curiga/i, /antisosial/i, /psikopat/i
    ],
    SEDANG: [
      /cemas/i, /takut/i, /sedih/i, /murung/i, /gelisah/i,
      /tegang/i, /impulsif/i, /\bkaku\b/i, /regres/i, /infantil/i,
      /defensif/i, /menarik diri/i, /insecure/i, /rendah diri/i,
      /tertekan/i, /neurotik/i, /kompulsif/i, /obsesif/i
    ]
  });

  /* ============================================================
     KEYWORD → KATEGORI & POLARITAS
     ============================================================ */
  const KEYWORD_RULES = Object.freeze({
    'KEMAMPUAN BERPIKIR & PROBLEM SOLVING': {
      positif: [
        /jelas/i, /teratur/i, /sistematis/i, /logis/i, /konsisten/i,
        /terorganisir/i, /fokus/i, /analitis/i, /cerdas/i,
        /intelektual/i, /kreatif.*berpikir/i
      ],
      negatif: [
        /kebingungan/i, /\bbingung\b/i, /tidak jelas/i, /kabur/i,
        /tidak logis/i, /tidak teratur/i, /\bkacau\b/i, /disorientasi/i,
        /tidak mampu/i, /kesulitan berpikir/i, /retardasi/i,
        /\bdebil\b/i, /gangguan kognitif/i, /tidak fokus/i,
        /konsentrasi kurang/i, /pelupa/i, /tidak konsisten/i,
        /tidak sistematis/i, /berpikir asosiatif/i, /kekacauan/i,
        /primitif/i, /persepsi.*terdistorsi/i, /keterbatasan berpikir/i
      ]
    },
    'EMPATHY, INTERPERSONAL SKILL & TEAMWORK': {
      positif: [
        /empati/i, /hangat/i, /ramah/i, /kooperatif/i,
        /bersahabat/i, /peduli/i, /suka membantu/i, /sosial.*baik/i,
        /mudah bergaul/i, /interpersonal.*baik/i, /terbuka/i,
        /kolaboratif/i, /peka.*orang lain/i, /diplomatis/i
      ],
      negatif: [
        /menarik diri/i, /isolasi/i, /penyendiri/i, /tidak bergaul/i,
        /kesulitan.*sosial/i, /hambatan.*interaksi/i, /permusuhan/i,
        /bermusuhan/i, /agresif.*sosial/i, /tidak percaya/i,
        /curiga/i, /sulit.*berhubungan/i, /\bdingin\b/i, /\bcuek\b/i,
        /tidak peduli/i, /\bego\b/i, /individualis/i, /terisolasi/i,
        /kesepian/i, /canggung/i, /pemalu/i, /menghindar/i,
        /menghina/i, /menyerang verbal/i, /manipulasi/i, /eksploitasi/i
      ]
    },
    'STABILITAS EMOSI & KONTROL IMPULS': {
      positif: [
        /tenang/i, /stabil/i, /damai/i, /terkendali/i, /seimbang/i,
        /sabar/i, /kalem/i, /harmonis/i, /matang.*emosi/i,
        /kontrol.*baik/i, /dapat mengendalikan/i, /relaks/i
      ],
      negatif: [
        /agresif/i, /marah/i, /impulsif/i, /cemas/i, /takut/i,
        /depresi/i, /sedih/i, /murung/i, /\bkacau\b/i, /gelisah/i,
        /tegang/i, /panik/i, /nervous/i, /manik/i, /meledak/i,
        /kontrol.*lemah/i, /tidak stabil/i, /emosional/i,
        /histeris/i, /frustrasi/i, /putus asa/i, /melankolis/i,
        /labilitas/i, /moody/i, /sensitif/i, /mudah tersinggung/i,
        /mudah marah/i, /\bstres\b/i, /ketegangan/i, /psikotik/i
      ]
    },
    'MOTIVATION & ACHIEVEMENT DRIVE': {
      positif: [
        /ambisi/i, /berprestasi/i, /termotivasi/i, /semangat/i,
        /vitalitas/i, /energi.*tinggi/i, /rajin/i, /tekun/i,
        /gigih/i, /berusaha keras/i, /optimis/i, /aspirasi/i,
        /produktif/i, /inisiatif/i, /berusaha mencapai tujuan/i,
        /aktif/i, /dinamis/i, /vital aktif/i
      ],
      negatif: [
        /tidak termotivasi/i, /kurang semangat/i, /pasif/i,
        /malas/i, /tidak ambisi/i, /kurang dorongan/i,
        /mudah menyerah/i, /lemah.*kemauan/i, /tidak ada tujuan/i,
        /stagnan/i, /tidak produktif/i, /\bloyo\b/i, /lemas/i,
        /tidak bertenaga/i, /energi.*lemah/i, /lesu/i,
        /kurangnya usaha/i, /tidak ada kemauan/i, /hampa/i
      ]
    },
    'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY': {
      positif: [
        /fleksibel/i, /adaptif/i, /dinamis/i, /mudah menyesuaikan/i,
        /terbuka/i, /mengeksplorasi/i, /mencoba.*baru/i,
        /inovatif/i, /kreatif/i, /cepat belajar/i, /inisiatif/i,
        /responsif/i, /spontan/i, /berani tampil beda/i
      ],
      negatif: [
        /\bkaku\b/i, /rigid/i, /tidak fleksibel/i, /sulit beradaptasi/i,
        /stagnan/i, /monoton/i, /tidak bisa berubah/i, /resistensi/i,
        /menolak perubahan/i, /tidak dinamis/i, /statis/i,
        /menentang/i, /keras kepala/i, /kepala batu/i, /defensif/i,
        /tertutup.*pengalaman baru/i, /tidak inisiatif/i
      ]
    },
    'INTEGRITY & RULE COMPLIANCE': {
      positif: [
        /integritas/i, /jujur/i, /bertanggung jawab/i, /disiplin/i,
        /patuh.*aturan/i, /moral.*baik/i, /etis/i, /dapat dipercaya/i,
        /dedikasi/i, /loyal/i, /amanah/i, /konsisten.*nilai/i
      ],
      negatif: [
        /curang/i, /manipulasi/i, /eksploitasi/i, /melanggar/i,
        /antisosial/i, /psikopat/i, /tidak jujur/i, /menyembunyikan/i,
        /berbohong/i, /mengelak/i, /menentang aturan/i, /melawan.*otoritas/i,
        /tidak bertanggung jawab/i, /otoriter/i, /narsis/i, /narsistik/i
      ]
    },
    'TEACHING CREATIVITY': {
      positif: [
        /kreatif/i, /inovatif/i, /imajinatif/i, /ide.*baru/i,
        /ekspresif/i, /artistik/i, /orisinil/i, /variatif/i,
        /mengeksplorasi/i, /inventif/i, /kaya ide/i
      ],
      negatif: [
        /tidak kreatif/i, /monoton/i, /\bkaku\b.*mengajar/i,
        /tidak inovatif/i, /repetitif/i, /tidak imajinatif/i,
        /kurang ide/i, /tidak variatif/i, /daya cipta kurang/i
      ]
    }
  });

  /* ============================================================
     OVERRIDE TABLE — tuning manual per item
     ------------------------------------------------------------
     Format key: 'testKey::sectionId::itemId'
     
     CONTOH pemakaian (buka comment & isi saat perlu):
     
     const OVERRIDE_TABLE = {
       'baum::ukuran_gambar::terlalu_besar': {
         kategori: ['STABILITAS EMOSI & KONTROL IMPULS'],
         polaritas: '-',
         bobot: 2,
         redFlag: false
       }
     };
     ============================================================ */
  const OVERRIDE_TABLE = {
    // Kosongkan dulu — isi bertahap sesuai tuning psikolog
  };

  /* ============================================================
     POSITION PROFILES — kebutuhan per posisi
     Konsisten dengan bigfive-position-analysis.js
     ============================================================ */
  const POSITION_PROFILES = Object.freeze({
    guru_mapel: {
      label: 'Guru Mata Pelajaran',
      matcher: /guru|dosen|pengajar|teacher|biologi|kimia|fisika|matematika|math|bahasa|inggris|indonesia|lampung|sejarah|sosial|\bipa\b|islam|kristen|katholik|katolik|hindu|\btik\b|visual|art|olahraga|olah\s*raga/i,
      needs: {
        'KEMAMPUAN BERPIKIR & PROBLEM SOLVING': 3.5,
        'EMPATHY, INTERPERSONAL SKILL & TEAMWORK': 3.2,
        'STABILITAS EMOSI & KONTROL IMPULS': 3.2,
        'MOTIVATION & ACHIEVEMENT DRIVE': 3.0,
        'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY': 3.2,
        'INTEGRITY & RULE COMPLIANCE': 3.3,
        'TEACHING CREATIVITY': 3.2
      },
      priority: [
        'KEMAMPUAN BERPIKIR & PROBLEM SOLVING',
        'INTEGRITY & RULE COMPLIANCE',
        'EMPATHY, INTERPERSONAL SKILL & TEAMWORK'
      ],
      nama_field: 'mata pelajaran'
    },

    guru_kelas: {
      label: 'Guru Kelas / TK / SD',
      matcher: /kindergarten|\btk\b|primary|\bsd\b|guru\s*kelas/i,
      needs: {
        'KEMAMPUAN BERPIKIR & PROBLEM SOLVING': 3.2,
        'EMPATHY, INTERPERSONAL SKILL & TEAMWORK': 3.6,
        'STABILITAS EMOSI & KONTROL IMPULS': 3.5,
        'MOTIVATION & ACHIEVEMENT DRIVE': 3.0,
        'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY': 3.2,
        'INTEGRITY & RULE COMPLIANCE': 3.3,
        'TEACHING CREATIVITY': 3.5
      },
      priority: [
        'EMPATHY, INTERPERSONAL SKILL & TEAMWORK',
        'STABILITAS EMOSI & KONTROL IMPULS',
        'TEACHING CREATIVITY'
      ],
      nama_field: 'pendidikan anak'
    },

    administrator: {
      label: 'Administrator / Staff',
      matcher: /administrator|admin|staff|sekretaris|klerk|office|kantor|tata\s*usaha/i,
      needs: {
        'KEMAMPUAN BERPIKIR & PROBLEM SOLVING': 3.2,
        'EMPATHY, INTERPERSONAL SKILL & TEAMWORK': 3.0,
        'STABILITAS EMOSI & KONTROL IMPULS': 3.0,
        'MOTIVATION & ACHIEVEMENT DRIVE': 3.2,
        'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY': 3.0,
        'INTEGRITY & RULE COMPLIANCE': 3.5,
        'TEACHING CREATIVITY': 2.5
      },
      priority: [
        'INTEGRITY & RULE COMPLIANCE',
        'MOTIVATION & ACHIEVEMENT DRIVE'
      ],
      nama_field: 'administrasi & pelayanan'
    },

    technical: {
      label: 'Technical Staff / Operator',
      matcher: /technical|teknisi|welder|las\b|wood|maintenance|baker|operator|produksi|engineering|it\s*staff/i,
      needs: {
        'KEMAMPUAN BERPIKIR & PROBLEM SOLVING': 3.2,
        'EMPATHY, INTERPERSONAL SKILL & TEAMWORK': 3.0,
        'STABILITAS EMOSI & KONTROL IMPULS': 3.5,
        'MOTIVATION & ACHIEVEMENT DRIVE': 3.2,
        'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY': 3.0,
        'INTEGRITY & RULE COMPLIANCE': 3.5,
        'TEACHING CREATIVITY': 2.5
      },
      priority: [
        'STABILITAS EMOSI & KONTROL IMPULS',
        'INTEGRITY & RULE COMPLIANCE'
      ],
      nama_field: 'kerja teknis & keselamatan'
    },

    konselor: {
      label: 'Konselor / BK',
      matcher: /konselor|counselor|\bbk\b|bimbingan/i,
      needs: {
        'KEMAMPUAN BERPIKIR & PROBLEM SOLVING': 3.3,
        'EMPATHY, INTERPERSONAL SKILL & TEAMWORK': 3.8,
        'STABILITAS EMOSI & KONTROL IMPULS': 3.6,
        'MOTIVATION & ACHIEVEMENT DRIVE': 3.2,
        'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY': 3.3,
        'INTEGRITY & RULE COMPLIANCE': 3.5,
        'TEACHING CREATIVITY': 3.2
      },
      priority: [
        'EMPATHY, INTERPERSONAL SKILL & TEAMWORK',
        'STABILITAS EMOSI & KONTROL IMPULS',
        'INTEGRITY & RULE COMPLIANCE'
      ],
      nama_field: 'bimbingan & konseling'
    },

    housekeeping: {
      label: 'Housekeeping',
      matcher: /housekeeping|cleaning|kebersihan|kebun|gardener/i,
      needs: {
        'KEMAMPUAN BERPIKIR & PROBLEM SOLVING': 2.8,
        'EMPATHY, INTERPERSONAL SKILL & TEAMWORK': 3.0,
        'STABILITAS EMOSI & KONTROL IMPULS': 3.0,
        'MOTIVATION & ACHIEVEMENT DRIVE': 3.3,
        'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY': 3.0,
        'INTEGRITY & RULE COMPLIANCE': 3.5,
        'TEACHING CREATIVITY': 2.0
      },
      priority: [
        'INTEGRITY & RULE COMPLIANCE',
        'MOTIVATION & ACHIEVEMENT DRIVE'
      ],
      nama_field: 'kebersihan & ketertiban'
    },

    default: {
      label: 'Umum',
      matcher: /.*/,
      needs: {
        'KEMAMPUAN BERPIKIR & PROBLEM SOLVING': 3.0,
        'EMPATHY, INTERPERSONAL SKILL & TEAMWORK': 3.0,
        'STABILITAS EMOSI & KONTROL IMPULS': 3.0,
        'MOTIVATION & ACHIEVEMENT DRIVE': 3.0,
        'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY': 3.0,
        'INTEGRITY & RULE COMPLIANCE': 3.0,
        'TEACHING CREATIVITY': 3.0
      },
      priority: [],
      nama_field: 'kompetensi umum'
    }
  });

  /* ============================================================
     INTERPRETASI KLINIS PER KATEGORI PER BAND
     ============================================================ */
  const SCORING_INTERPRETATION = Object.freeze({
    'KEMAMPUAN BERPIKIR & PROBLEM SOLVING': {
      SANGAT_BAIK: 'Kandidat menunjukkan kapasitas kognitif yang kuat — mampu berpikir sistematis, menganalisis masalah secara mendalam, dan menyusun strategi pemecahan yang efektif. Struktur berpikir terorganisir dan stabil di bawah tekanan.',
      BAIK: 'Kandidat memiliki kemampuan berpikir yang baik — dapat memahami konsep dan menyelesaikan masalah secara terstruktur, meski pada kasus yang sangat kompleks mungkin memerlukan waktu lebih untuk analisis.',
      CUKUP: 'Kandidat menunjukkan kemampuan berpikir pada taraf memadai — mampu menangani tugas rutin dan masalah sederhana, namun masih memerlukan pendampingan untuk analisis masalah kompleks dan perencanaan strategis.',
      PERHATIAN: 'Kandidat menunjukkan hambatan pada kemampuan berpikir terstruktur — kesulitan menganalisis masalah, cenderung kebingungan pada situasi kompleks, dan butuh pendampingan intensif untuk menyusun kerangka pemecahan masalah.'
    },
    'EMPATHY, INTERPERSONAL SKILL & TEAMWORK': {
      SANGAT_BAIK: 'Kandidat sangat empatik, hangat, dan kooperatif — mudah membangun hubungan interpersonal yang sehat, mampu membaca kebutuhan orang lain, dan menjadi penggerak harmoni dalam tim.',
      BAIK: 'Kandidat memiliki kemampuan interpersonal yang baik — mampu bekerja sama, berkomunikasi efektif, dan menjaga relasi kerja yang positif dengan rekan maupun atasan.',
      CUKUP: 'Kandidat memiliki kemampuan interpersonal yang cukup — mampu bekerja dalam tim, namun kadang perlu waktu untuk menyesuaikan diri dalam interaksi sosial yang intens atau situasi konflik.',
      PERHATIAN: 'Kandidat menunjukkan hambatan dalam relasi interpersonal — cenderung menarik diri, sulit membangun kedekatan emosional, dan bisa mengalami kesulitan dalam kolaborasi tim.'
    },
    'STABILITAS EMOSI & KONTROL IMPULS': {
      SANGAT_BAIK: 'Kandidat sangat stabil secara emosional — tenang di bawah tekanan, mampu mengendalikan impuls dengan baik, dan menjadi penyeimbang suasana di lingkungan kerja.',
      BAIK: 'Kandidat memiliki kestabilan emosi yang baik — mampu mengelola stres dan tekanan kerja dengan wajar, meski pada kondisi ekstrem mungkin sesekali memerlukan waktu untuk pulih.',
      CUKUP: 'Kandidat memiliki kestabilan emosi pada taraf memadai — mampu menangani tekanan sehari-hari, namun pada kondisi tekanan tinggi cenderung menunjukkan reaksi emosional yang lebih intens.',
      PERHATIAN: 'Kandidat menunjukkan kerentanan emosional — mudah terpengaruh tekanan, impulsif, dan rentan mengalami fluktuasi mood yang dapat mengganggu produktivitas serta hubungan kerja.'
    },
    'MOTIVATION & ACHIEVEMENT DRIVE': {
      SANGAT_BAIK: 'Kandidat sangat termotivasi dan berorientasi prestasi — memiliki dorongan internal yang kuat, tekun, gigih, dan tidak mudah menyerah dalam mencapai tujuan.',
      BAIK: 'Kandidat memiliki motivasi kerja yang baik — menunjukkan inisiatif, tekun dalam menyelesaikan tugas, dan memiliki dorongan untuk berkembang.',
      CUKUP: 'Kandidat memiliki motivasi kerja pada taraf memadai — mampu menyelesaikan tugas rutin, namun pada tugas-tugas menantang mungkin memerlukan dukungan atau dorongan eksternal.',
      PERHATIAN: 'Kandidat menunjukkan motivasi kerja yang rendah — kurang bersemangat, mudah menyerah, pasif, dan cenderung tidak memiliki dorongan kuat untuk mencapai hasil optimal.'
    },
    'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY': {
      SANGAT_BAIK: 'Kandidat sangat adaptif dan fleksibel — cepat belajar hal baru, terbuka pada perubahan, dan mampu menyesuaikan diri dengan cepat di berbagai situasi.',
      BAIK: 'Kandidat memiliki kemampuan adaptasi yang baik — mampu menyesuaikan diri pada perubahan, terbuka pada ide baru, dan memiliki kemauan belajar yang baik.',
      CUKUP: 'Kandidat memiliki kemampuan adaptasi pada taraf memadai — mampu menyesuaikan diri pada perubahan bertahap, namun pada perubahan mendadak mungkin memerlukan waktu lebih.',
      PERHATIAN: 'Kandidat menunjukkan kekakuan dalam beradaptasi — sulit menerima perubahan, cenderung bertahan pada cara lama, dan rentan mengalami kesulitan saat lingkungan kerja dinamis.'
    },
    'INTEGRITY & RULE COMPLIANCE': {
      SANGAT_BAIK: 'Kandidat menunjukkan integritas yang sangat kuat — jujur, bertanggung jawab, patuh aturan, dan dapat dipercaya dalam menjalankan tugas maupun menjaga amanah.',
      BAIK: 'Kandidat memiliki integritas yang baik — menunjukkan tanggung jawab, disiplin, dan kemampuan menjaga nilai-nilai etika dalam pekerjaan.',
      CUKUP: 'Kandidat memiliki integritas pada taraf memadai — memahami aturan dan nilai kerja, namun pada situasi tertentu mungkin memerlukan pengingat atau penguatan terkait kepatuhan.',
      PERHATIAN: 'Kandidat menunjukkan kerentanan pada aspek integritas — cenderung mengelak, sulit mematuhi aturan, dan berpotensi menghadapi masalah kedisiplinan jika tidak diperkuat.'
    },
    'TEACHING CREATIVITY': {
      SANGAT_BAIK: 'Kandidat sangat kreatif dan imajinatif — menghasilkan banyak ide baru, ekspresif, dan mampu menciptakan metode atau pendekatan yang unik dalam pekerjaannya.',
      BAIK: 'Kandidat memiliki kreativitas yang baik — mampu berpikir orisinal, terbuka pada eksperimen, dan mencari cara-cara variatif dalam menyelesaikan tugas.',
      CUKUP: 'Kandidat memiliki kreativitas pada taraf memadai — mampu mengikuti metode yang ada, namun belum menonjol dalam menghasilkan ide-ide baru atau pendekatan inovatif.',
      PERHATIAN: 'Kandidat menunjukkan keterbatasan pada aspek kreativitas — cenderung monoton, kurang ide baru, dan kesulitan mengembangkan pendekatan inovatif dalam pekerjaan.'
    }
  });

  /* ============================================================
     DEVELOPMENT KAMUS
     ============================================================ */
  const DEVELOPMENT_KAMUS = Object.freeze({
    'KEMAMPUAN BERPIKIR & PROBLEM SOLVING':
      'Latih kemampuan analisis melalui studi kasus, brainstorming terstruktur, dan problem-solving exercise. ' +
      'Rekomendasi: pelatihan critical thinking, mind mapping, dan latihan pengambilan keputusan berbasis data.',
    'EMPATHY, INTERPERSONAL SKILL & TEAMWORK':
      'Kembangkan empati melalui active listening, role-play, dan feedback 360°. ' +
      'Rekomendasi: pelatihan komunikasi interpersonal, team building, dan mentoring sebaya.',
    'STABILITAS EMOSI & KONTROL IMPULS':
      'Pelatihan manajemen emosi, mindfulness, dan teknik regulasi stres. ' +
      'Rekomendasi: konseling rutin, journaling emosi, dan teknik relaksasi (breathing exercise).',
    'MOTIVATION & ACHIEVEMENT DRIVE':
      'Bantu tetapkan tujuan SMART, bangun sistem reward, dan mentoring rutin. ' +
      'Rekomendasi: coaching motivasi, perencanaan karier, dan umpan balik positif berkala.',
    'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY':
      'Ekspos ke situasi baru, dorong learning by doing, dan rotasi tugas. ' +
      'Rekomendasi: pelatihan adaptability, project-based learning, dan exposure lintas fungsi.',
    'INTEGRITY & RULE COMPLIANCE':
      'Perkuat pemahaman nilai, studi kasus etika, dan konsistensi konsekuensi. ' +
      'Rekomendasi: workshop integritas, mentoring etika, dan penegakan aturan yang konsisten.',
    'TEACHING CREATIVITY':
      'Latih metode kreatif (mind mapping, project-based, gamifikasi) dan apresiasi inovasi. ' +
      'Rekomendasi: workshop kreativitas, peer teaching, dan observasi kelas inovatif.'
  });

  /* ============================================================
     TRACE LOGGER
     ============================================================ */
  const _trace = {
    entries: [],
    enabled: false,
    enable()  { this.enabled = true; },
    disable() { this.enabled = false; },
    clear()   { this.entries = []; },
    log(type, payload) {
      if (!this.enabled) return;
      if (this.entries.length >= CONFIG.MAX_TRACE_ENTRIES) this.entries.shift();
      this.entries.push({ ts: Date.now(), type, payload });
    },
    dump() { return this.entries.slice(); }
  };

  /* ============================================================
     UTIL
     ============================================================ */
  function _detectBobot(text) {
    if (!text) return 1;
    for (const rx of BOBOT_RULES.RED_FLAG) if (rx.test(text)) return CONFIG.RED_FLAG_BOBOT;
    for (const rx of BOBOT_RULES.BERAT)    if (rx.test(text)) return 3;
    for (const rx of BOBOT_RULES.SEDANG)   if (rx.test(text)) return 2;
    return 1;
  }

  function _detectRedFlag(text) {
    if (!text) return false;
    for (const rx of BOBOT_RULES.RED_FLAG) if (rx.test(text)) return true;
    return false;
  }

  function _autoMap(text) {
    const katPos = new Set();
    const katNeg = new Set();
    Object.entries(KEYWORD_RULES).forEach(([kat, rules]) => {
      rules.positif.forEach(rx => { if (rx.test(text)) katPos.add(kat); });
      rules.negatif.forEach(rx => { if (rx.test(text)) katNeg.add(kat); });
    });
    const katNegArr = [...katNeg];
    const katPosArr = [...katPos].filter(k => !katNeg.has(k));
    if (katNegArr.length > 0) return { kategori: katNegArr, polaritas: '-' };
    if (katPosArr.length > 0) return { kategori: katPosArr, polaritas: '+' };
    return { kategori: [], polaritas: null };
  }

  /* ============================================================
     RESOLVE META
     ============================================================ */
  function resolveMeta(item, testKey, sectionId) {
    if (!item) return null;
    const itemId = item.id || 'sub';
    const overrideKey = `${testKey}::${sectionId}::${itemId}`;

    if (OVERRIDE_TABLE[overrideKey]) {
      _trace.log('meta_override', { key: overrideKey });
      return { ...OVERRIDE_TABLE[overrideKey], _source: 'override' };
    }

    const fullText = [item.label || '', item.ciri || '', item.interpret || ''].join(' \n ');
    const { kategori, polaritas } = _autoMap(fullText);
    if (!kategori || kategori.length === 0) {
      _trace.log('meta_skip', { itemId, reason: 'no_kategori' });
      return null;
    }

    const bobot = _detectBobot(fullText);
    const redFlag = _detectRedFlag(fullText);
    _trace.log('meta_auto', { itemId, kategori, polaritas, bobot, redFlag });
    return { kategori, polaritas, bobot, redFlag, _source: 'auto' };
  }

  function _applyMeta(acc, meta, item) {
    const bobot = Number(meta.bobot) || 1;
    meta.kategori.forEach(kat => {
      const kd = acc[kat];
      if (!kd) return;
      kd.totalBobot += bobot;
      const entry = { label: item.label || item.id || 'item', bobot, redFlag: !!meta.redFlag };
      if (meta.polaritas === '+') {
        kd.nPos += bobot;
        kd.itemsPos.push(entry);
      } else if (meta.polaritas === '-') {
        kd.nNeg += bobot;
        kd.itemsNeg.push(entry);
        if (meta.redFlag) kd.redFlags.push(entry.label);
      }
    });
  }

  /* ============================================================
     CORE: hitungSkorKategori
     ============================================================ */
  function hitungSkorKategori(selectedItems) {
    _trace.clear();
    if (!selectedItems || typeof selectedItems !== 'object') selectedItems = {};

    const acc = {};
    CONFIG.KATEGORI.forEach(k => {
      acc[k] = {
        kategori: k, nPos: 0, nNeg: 0,
        itemsPos: [], itemsNeg: [], redFlags: [],
        totalBobot: 0, skor: CONFIG.SKOR_BASE,
        confidence: 0, status: 'NO_DATA'
      };
    });

    const autoData = window.GRAFIS_AUTO_DATA || {};
    ['dap', 'baum', 'htp'].forEach(testKey => {
      const data = autoData[testKey];
      if (!data || !Array.isArray(data.slides)) return;
      const selected = selectedItems[testKey] || {};

      data.slides.forEach(slide => {
        (slide.sections || []).forEach(section => {
          const sectionId = section.id;
          const val = selected[sectionId];
          if (!val) return;
          const itemIds = Array.isArray(val) ? val : [val];

          itemIds.forEach(itemId => {
            const item = (section.items || []).find(i => i.id === itemId);
            if (!item) return;
            const meta = resolveMeta(item, testKey, sectionId);
            if (!meta) return;
            _applyMeta(acc, meta, item);

            (item.subItems || []).forEach(sub => {
              const subKey = sectionId + '::' + sub.id;
              if (!selected[subKey]) return;
              const subMeta = resolveMeta(sub, testKey, subKey);
              if (!subMeta) return;
              _applyMeta(acc, subMeta, sub);
            });
          });
        });
      });
    });

    CONFIG.KATEGORI.forEach(k => {
      const kd = acc[k];
      const total = kd.nPos + kd.nNeg;
      if (total === 0) {
        kd.skor = CONFIG.SKOR_BASE;
        kd.confidence = 0;
        kd.status = 'NO_DATA';
        return;
      }
      const delta = (kd.nPos - kd.nNeg) / total;
      const skorRaw = CONFIG.SKOR_BASE + delta * CONFIG.DELTA_SCALE;
      const confidence = Math.min(1.0, total / CONFIG.MIN_BOBOT_CONFIDENCE);
      const skorAkhir = CONFIG.SKOR_BASE + (skorRaw - CONFIG.SKOR_BASE) * confidence;
      kd.skor = Math.max(CONFIG.SKOR_MIN, Math.min(CONFIG.SKOR_MAX, skorAkhir));
      kd.confidence = confidence;

      if (kd.skor >= CONFIG.THRESHOLD.SANGAT_BAIK)      kd.status = 'SANGAT_BAIK';
      else if (kd.skor >= CONFIG.THRESHOLD.BAIK)        kd.status = 'BAIK';
      else if (kd.skor >= CONFIG.THRESHOLD.CUKUP)       kd.status = 'CUKUP';
      else                                              kd.status = 'PERHATIAN';
    });

    return acc;
  }

  /* ============================================================
     POSITION FIT
     ============================================================ */
  function detectPositionProfile(position) {
    const pos = String(position || '').toLowerCase().trim();
    if (!pos) return { ...POSITION_PROFILES.default, key: 'default' };
    const order = ['konselor', 'guru_kelas', 'housekeeping', 'technical', 'guru_mapel', 'administrator'];
    for (const key of order) {
      if (POSITION_PROFILES[key].matcher.test(pos)) {
        return { ...POSITION_PROFILES[key], key };
      }
    }
    return { ...POSITION_PROFILES.default, key: 'default' };
  }

  function computePositionFit(scoring, profile) {
    const perKategori = [];
    let weightedSum = 0, weightTotal = 0;
    let fitCount = 0, partialCount = 0, notFitCount = 0;
    const priorityIssues = [];
    const gaps = [];

    CONFIG.KATEGORI.forEach(kat => {
      const k = scoring[kat];
      const need = profile.needs[kat] ?? 3.0;
      const isPriority = profile.priority.includes(kat);
      const weight = isPriority ? 2 : 1;

      if (!k || k.status === 'NO_DATA') {
        perKategori.push({ kategori: kat, skor: null, need, gap: null, status: 'NO_DATA', isPriority, weight, catFitScore: null });
        return;
      }

      const gap = k.skor - need;
      let status;
      if (gap >= 0) status = 'MEMENUHI';
      else if (gap >= -0.4) status = 'HAMPIR';
      else status = 'KURANG';

      let catFitScore;
      if (gap >= 0) catFitScore = 100;
      else if (gap >= -0.5) catFitScore = 75 + (gap + 0.5) * 50;
      else if (gap >= -1.0) catFitScore = 40 + (gap + 1.0) * 70;
      else catFitScore = Math.max(0, 40 + (gap + 1.0) * 40);

      weightedSum += catFitScore * weight;
      weightTotal += weight;

      if (status === 'MEMENUHI') fitCount++;
      else if (status === 'HAMPIR') partialCount++;
      else { notFitCount++; if (isPriority) priorityIssues.push(kat); }

      gaps.push({ kategori: kat, gap, isPriority });
      perKategori.push({
        kategori: kat, skor: k.skor, need, gap, status,
        isPriority, weight, catFitScore: Math.round(catFitScore)
      });
    });

    return {
      profile, perKategori, fitCount, partialCount, notFitCount,
      priorityIssues, gaps,
      fitScore: weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0
    };
  }

  /* ============================================================
     GENERATOR KESIMPULAN
     ============================================================ */
  function generateKesimpulan(scoring, identity) {
    identity = identity || (window.appState && window.appState.identity) || {};
    const posisi = identity.position || '';
    const profile = detectPositionProfile(posisi);
    const fitData = computePositionFit(scoring, profile);

    const kategoriArr = Object.values(scoring);
    const kategoriValid = kategoriArr.filter(k => k.status !== 'NO_DATA');

    if (kategoriValid.length === 0) {
      return {
        version: VERSION, rataRata: 0,
        overallLabel: 'TIDAK CUKUP DATA', overallColor: '#94a3b8',
        overallConfidence: 'RENDAH', totalBobot: 0,
        posisiLabel: profile.label, fitScore: 0, fitData: null,
        strengths: [], weaknesses: [], allRedFlags: [], perKategoriNarasi: [],
        text: 'Tidak cukup indikator terpilih untuk menghasilkan kesimpulan yang valid. ' +
              'Mohon lengkapi checklist interpretasi terlebih dahulu.'
      };
    }

    const rataRata = kategoriValid.reduce((a, k) => a + k.skor, 0) / kategoriValid.length;
    const totalBobot = kategoriArr.reduce((s, k) => s + k.totalBobot, 0);

    let overallConfidence = 'RENDAH';
    if (totalBobot >= 18)      overallConfidence = 'TINGGI';
    else if (totalBobot >= 10) overallConfidence = 'SEDANG';

    const fitScore = fitData.fitScore;
    const hasPriorityIssue = fitData.priorityIssues.length > 0;
    const lowKategoriCount = fitData.notFitCount;

    let overallLabel, overallColor;
    if (fitScore >= CONFIG.FIT_THRESHOLD.HIGHLY && !hasPriorityIssue && lowKategoriCount <= 1) {
      overallLabel = 'HIGHLY RECOMMENDED'; overallColor = '#166534';
    } else if (fitScore >= CONFIG.FIT_THRESHOLD.RECO && !hasPriorityIssue) {
      overallLabel = 'RECOMMENDED'; overallColor = '#16a34a';
    } else if (fitScore >= CONFIG.FIT_THRESHOLD.FAIRLY) {
      overallLabel = 'FAIRLY RECOMMENDED'; overallColor = '#d97706';
    } else {
      overallLabel = 'NOT RECOMMENDED'; overallColor = '#dc2626';
    }

    const sorted = [...kategoriArr].sort((a, b) => b.skor - a.skor);
    const strengths = sorted.filter(k => k.skor >= 3.0 && k.itemsPos.length >= CONFIG.MIN_KONVERGENSI).slice(0, 3);
    const weaknesses = sorted.filter(k => k.skor < 3.0 && k.itemsNeg.length >= CONFIG.MIN_KONVERGENSI).reverse().slice(0, 3);

    const allRedFlags = [];
    kategoriArr.forEach(k => {
      if (k.redFlags.length > 0 && k.skor < 2.5) {
        allRedFlags.push({ kategori: k.kategori, skor: k.skor, items: k.redFlags });
      }
    });

    const perKategoriNarasi = CONFIG.KATEGORI.map(kat => {
      const k = scoring[kat];
      const fitItem = fitData.perKategori.find(f => f.kategori === kat);
      const interp = SCORING_INTERPRETATION[kat];

      if (!k || k.status === 'NO_DATA') {
        return {
          kategori: kat, skor: null, status: 'NO_DATA',
          need: fitItem?.need || 3.0, gap: null, fitStatus: 'NO_DATA',
          isPriority: fitItem?.isPriority || false,
          narasi: 'Belum ada indikator yang cukup untuk menilai kategori ini. ' +
                  'Disarankan untuk melengkapi checklist interpretasi pada DAP/BAUM/HTP.'
        };
      }

      const parts = [`SKOR ${k.skor.toFixed(2)} / 4.00 (${k.status.replace('_', ' ')}).`];
      if (interp && interp[k.status]) parts.push(interp[k.status]);

      if (k.itemsPos.length > 0) {
        const labels = k.itemsPos.slice(0, 5).map(x => `"${x.label}"`).join(', ');
        const more = k.itemsPos.length > 5 ? ` (+${k.itemsPos.length - 5} lain)` : '';
        parts.push(`Indikator positif (${k.itemsPos.length}): ${labels}${more}.`);
      }
      if (k.itemsNeg.length > 0) {
        const labels = k.itemsNeg.slice(0, 5).map(x => `"${x.label}"`).join(', ');
        const more = k.itemsNeg.length > 5 ? ` (+${k.itemsNeg.length - 5} lain)` : '';
        parts.push(`Indikator negatif (${k.itemsNeg.length}): ${labels}${more}.`);
      }
      if (k.redFlags.length > 0) {
        parts.push(`⚠️ RED FLAG (${k.redFlags.length}): ${k.redFlags.slice(0, 3).join(', ')}${k.redFlags.length > 3 ? '...' : ''}.`);
      }

      let fitStatus = 'NO_DATA';
      if (fitItem && fitItem.status !== 'NO_DATA') {
        fitStatus = fitItem.status;
        const needStr = fitItem.need.toFixed(2);
        const gapStr = (fitItem.gap >= 0 ? '+' : '') + fitItem.gap.toFixed(2);
        const priorityTag = fitItem.isPriority ? ' [⚡ PRIORITAS POSISI]' : '';
        if (fitItem.status === 'MEMENUHI') {
          parts.push(`Konteks posisi ${profile.label}${priorityTag}: skor kandidat ${fitItem.skor.toFixed(2)} ≥ kebutuhan ${needStr} — MEMENUHI dengan surplus ${gapStr}.`);
        } else if (fitItem.status === 'HAMPIR') {
          parts.push(`Konteks posisi ${profile.label}${priorityTag}: skor kandidat ${fitItem.skor.toFixed(2)} vs kebutuhan ${needStr} — HAMPIR memenuhi, gap ${gapStr}. Perlu penguatan ringan.`);
        } else {
          parts.push(`Konteks posisi ${profile.label}${priorityTag}: skor kandidat ${fitItem.skor.toFixed(2)} vs kebutuhan ${needStr} — KURANG memenuhi, gap ${gapStr}. Disarankan pendampingan / pelatihan.`);
        }
      }

      return {
        kategori: kat, skor: k.skor, status: k.status,
        need: fitItem?.need || 3.0, gap: fitItem?.gap ?? null,
        fitStatus, isPriority: fitItem?.isPriority || false,
        narasi: parts.join('\n\n')
      };
    });

    /* Bangun teks kesimpulan */
    const lines = [];
    const sep = '─'.repeat(60);

    lines.push('KESIMPULAN INTERPRETASI GRAFIS (DAP · BAUM · HTP)');
    lines.push(sep); lines.push('');
    lines.push(`Kandidat            : ${identity.name || '-'}`);
    lines.push(`Posisi Dilamar      : ${posisi || '(tidak disebutkan)'}`);
    lines.push(`Kategori Posisi     : ${profile.label}`);
    lines.push(`Tanggal             : ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`);
    lines.push('');
    lines.push(sep); lines.push('RINGKASAN SKOR'); lines.push(sep); lines.push('');
    lines.push(`Skor rata-rata              : ${rataRata.toFixed(2)} / 4.00`);
    lines.push(`Skor kecocokan posisi       : ${fitScore} / 100`);
    lines.push(`Tingkat kecocokan           : ${overallLabel}`);
    lines.push(`Tingkat keyakinan data      : ${overallConfidence} (total bobot: ${totalBobot})`);
    lines.push(`Kategori terukur            : ${kategoriValid.length} dari ${CONFIG.KATEGORI.length}`);
    lines.push('');
    lines.push(`Kategori MEMENUHI kebutuhan : ${fitData.fitCount}`);
    lines.push(`Kategori HAMPIR memenuhi    : ${fitData.partialCount}`);
    lines.push(`Kategori KURANG memenuhi    : ${fitData.notFitCount}`);
    if (fitData.priorityIssues.length > 0) {
      lines.push(`⚡ PRIORITAS yang bermasalah : ${fitData.priorityIssues.length} — ${fitData.priorityIssues.join(', ')}`);
    }
    lines.push('');
    lines.push(sep); lines.push('◆ INTERPRETASI PER KATEGORI'); lines.push(sep); lines.push('');

    perKategoriNarasi.forEach((pn, i) => {
      const priorityTag = pn.isPriority ? ' ⚡' : '';
      lines.push(`${i + 1}. ${pn.kategori}${priorityTag}`);
      if (pn.skor !== null) {
        lines.push(`   Skor: ${pn.skor.toFixed(2)} / 4.00  (kebutuhan posisi: ${pn.need.toFixed(2)}, gap: ${pn.gap >= 0 ? '+' : ''}${pn.gap.toFixed(2)}, status: ${pn.fitStatus})`);
      } else {
        lines.push(`   Skor: (tidak terukur) — kebutuhan posisi: ${pn.need.toFixed(2)}`);
      }
      lines.push('');
      lines.push(pn.narasi.split('\n\n').map(p => '   ' + p).join('\n   '));
      lines.push('');
    });
    lines.push(sep); lines.push('');

    if (strengths.length > 0) {
      lines.push('◆ KEKUATAN UTAMA (KONVERGENSI ≥ 2 INDIKATOR POSITIF)'); lines.push('');
      strengths.forEach((k, i) => {
        lines.push(`${i + 1}. ${k.kategori}`);
        lines.push(`   Skor: ${k.skor.toFixed(2)} / 4.00  (${k.itemsPos.length} indikator positif)`);
        const c = k.itemsPos.sort((a, b) => b.bobot - a.bobot).slice(0, 3).map(x => `"${x.label}"`).join(', ');
        if (c) lines.push(`   Indikator: ${c}`);
        lines.push('');
      });
      lines.push(sep); lines.push('');
    }

    if (weaknesses.length > 0) {
      lines.push('◆ AREA YANG PERLU PERHATIAN (KONVERGENSI ≥ 2 INDIKATOR NEGATIF)'); lines.push('');
      weaknesses.forEach((k, i) => {
        lines.push(`${i + 1}. ${k.kategori}`);
        lines.push(`   Skor: ${k.skor.toFixed(2)} / 4.00  (${k.itemsNeg.length} indikator negatif)`);
        const c = k.itemsNeg.sort((a, b) => b.bobot - a.bobot).slice(0, 3).map(x => `"${x.label}"`).join(', ');
        if (c) lines.push(`   Indikator: ${c}`);
        lines.push('');
      });
      lines.push(sep); lines.push('');
    }

    if (allRedFlags.length > 0) {
      lines.push('⚠️  INDIKATOR KRITIS — PERLU PENELAAHAN LANJUT'); lines.push('');
      allRedFlags.forEach((rf, i) => {
        lines.push(`${i + 1}. ${rf.kategori} (skor: ${rf.skor.toFixed(2)})`);
        rf.items.forEach(it => lines.push(`   • ${it}`));
        lines.push('');
      });
      lines.push('Catatan: red flag TIDAK otomatis menggugurkan kandidat, namun');
      lines.push('memerlukan wawancara klinis dan/atau asesmen tambahan.');
      lines.push('');
      lines.push(sep); lines.push('');
    }

    const devKategori = fitData.perKategori
      .filter(f => f.status === 'KURANG' || f.status === 'HAMPIR')
      .sort((a, b) => (a.isPriority === b.isPriority ? a.gap - b.gap : (a.isPriority ? -1 : 1)));

    if (devKategori.length > 0) {
      lines.push('◆ REKOMENDASI PENGEMBANGAN (SESUAI KEBUTUHAN POSISI)'); lines.push('');
      devKategori.forEach((f, i) => {
        const dev = DEVELOPMENT_KAMUS[f.kategori];
        if (!dev) return;
        const priorityTag = f.isPriority ? ' [⚡ PRIORITAS]' : '';
        lines.push(`${i + 1}. ${f.kategori}${priorityTag}`);
        lines.push(`   Skor ${f.skor.toFixed(2)} vs kebutuhan ${f.need.toFixed(2)} (gap ${f.gap.toFixed(2)})`);
        lines.push(`   ${dev}`);
        lines.push('');
      });
      lines.push(sep); lines.push('');
    }

    lines.push('CATATAN PENTING'); lines.push('');
    lines.push('1. Skor dihasilkan dari analisis checklist indikator visual pada tes');
    lines.push('   grafis (DAP, BAUM, HTP) dengan bobot berdasarkan tingkat keparahan');
    lines.push('   klinis dari literatur (Machover, Buck, Koch, Hammer).');
    lines.push('');
    lines.push('2. Interpretasi ini bersifat SCREENING, BUKAN diagnosis klinis.');
    lines.push('   Keputusan akhir seleksi harus mempertimbangkan: wawancara,');
    lines.push('   tes objektif lain (IST, DISC, PAPI, Big Five), referensi kerja,');
    lines.push('   dan pertimbangan profesional psikolog.');
    lines.push('');
    lines.push('3. Prinsip interpretasi: konvergensi minimal 2 indikator searah —');
    lines.push('   tidak menggunakan single-sign interpretation.');
    lines.push('');
    lines.push('4. Kebutuhan posisi ("needs") disusun berdasarkan turunan dari');
    lines.push('   bigfive-position-analysis.js dan DISC roles.');
    lines.push('');
    lines.push(`Engine version: ${VERSION} (${RELEASED})`);
    lines.push(`Dokumen ini dihasilkan otomatis pada ${new Date().toLocaleString('id-ID')}.`);

    return {
      version: VERSION,
      rataRata: Number(rataRata.toFixed(2)),
      overallLabel, overallColor, overallConfidence, totalBobot,
      kategoriValidCount: kategoriValid.length,
      posisiLabel: profile.label,
      fitScore, fitData, perKategoriNarasi,
      strengths, weaknesses, allRedFlags,
      text: lines.join('\n')
    };
  }

  /* ============================================================
     EXPORT
     ============================================================ */
  const GRAFIS_SCORING = {
    VERSION, RELEASED, CONFIG, BOBOT_RULES, KEYWORD_RULES,
    OVERRIDE_TABLE, DEVELOPMENT_KAMUS, POSITION_PROFILES, SCORING_INTERPRETATION,

    resolveMeta, hitungSkorKategori, generateKesimpulan,
    detectPositionProfile, computePositionFit,

    enableTrace:  () => _trace.enable(),
    disableTrace: () => _trace.disable(),
    clearTrace:   () => _trace.clear(),
    dumpTrace:    () => _trace.dump(),

    _debugAutoMap(text) { return _autoMap(text); },
    _debugBobot(text)   { return { bobot: _detectBobot(text), redFlag: _detectRedFlag(text) }; }
  };

  global.GRAFIS_SCORING = GRAFIS_SCORING;
  global.__GRAFIS_SCORING_VERSION = VERSION;

  console.log(`[GRAFIS-SCORING] ✓ Loaded v${VERSION} (${RELEASED})`);
})(window);
