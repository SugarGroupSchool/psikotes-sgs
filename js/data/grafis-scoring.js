/* ============================================================
   GRAFIS AUTO-SCORING & CONCLUSION ENGINE v1.0
   ------------------------------------------------------------
   Prinsip profesional:
   - Delta-based scoring (proporsi +/−), bukan jumlah mentah
   - Confidence level berdasarkan kekayaan data (total bobot)
   - Konvergensi minimal 2 indikator searah (no single-sign)
   - Red flags dipisah, TIDAK di-average ke skor
   - Disclaimer jelas: screening, bukan diagnosis klinis

   Basis literatur:
   - Machover (1949) — Personality Projection in DAP
   - Buck (1948) — HTP Manual
   - Koch (1952) — Der Baumtest
   - Hammer (1958) — The Clinical Application of Projective Drawings
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     KONFIGURASI
     ============================================================ */
  const CONFIG = {
    KATEGORI: [
      'KEMAMPUAN BERPIKIR & PROBLEM SOLVING',
      'EMPATHY, INTERPERSONAL SKILL & TEAMWORK',
      'STABILITAS EMOSI & KONTROL IMPULS',
      'MOTIVATION & ACHIEVEMENT DRIVE',
      'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY',
      'INTEGRITY & RULE COMPLIANCE',
      'TEACHING CREATIVITY'
    ],

    // Skala 1.00 – 4.00 (base = 3.00)
    SKOR_BASE: 3.0,
    SKOR_MIN: 1.0,
    SKOR_MAX: 4.0,
    DELTA_SCALE: 1.2,

    // Confidence: butuh ≥ 6 total bobot untuk confidence penuh
    MIN_BOBOT_CONFIDENCE: 6,

    // Konvergensi: minimal 2 item searah untuk klaim kuat
    MIN_KONVERGENSI: 2,

    // Threshold kesimpulan
    THRESHOLD: {
      SANGAT_BAIK: 3.5,
      BAIK: 3.0,
      CUKUP: 2.5
    }
  };

  /* ============================================================
     BOBOT & RED FLAG DEFAULT
     Berdasarkan tingkat keparahan klinis dari literatur
     ============================================================ */
  const BOBOT_RULES = {
    // Red flag: bobot 3, masuk daftar khusus
    RED_FLAG: [
      /mutilasi/i, /dipotong/i, /terpotong/i, /terputus/i,
      /terbakar/i, /runtuh/i, /tumbang/i, /kematian/i, /mati/i,
      /mayat/i, /hantu/i, /kuburan/i, /bunuh/i, /kastrasi/i,
      /kehilangan organ/i, /organ.*hilang/i, /transparan/i,
      /x.?ray/i, /kerangka/i, /menembus/i
    ],
    // Bobot 3: indikator klinis kuat
    BERAT: [
      /agresif/i, /bermusuhan/i, /marah/i, /meledak/i,
      /depresi/i, /psikosis/i, /skizo/i, /paranoid/i, /manik/i,
      /kacau/i, /schizo/i, /histeris/i, /destruktif/i,
      /bunuh diri/i, /suicid/i, /curiga/i, /cemas.*berat/i
    ],
    // Bobot 2: indikator sedang
    SEDANG: [
      /cemas/i, /takut/i, /sedih/i, /murung/i, /gelisah/i,
      /tegang/i, /impulsif/i, /kaku/i, /regres/i, /infantil/i,
      /defensif/i, /menarik diri/i, /insecure/i, /rendah diri/i,
      /tertekan/i, /neurotik/i, /kompulsif/i, /obsesif/i
    ]
    // Sisanya: bobot 1 (ringan)
  };

  /* ============================================================
     AUTO-MAPPER: keyword → kategori & polaritas
     ------------------------------------------------------------
     PENTING: ini baseline otomatis. Untuk akurasi maksimal,
     isi OVERRIDE_TABLE di bawah untuk item spesifik.
     ============================================================ */
  const KEYWORD_RULES = {
    'KEMAMPUAN BERPIKIR & PROBLEM SOLVING': {
      negatif: [
        /kebingungan/i, /bingung/i, /tidak jelas/i, /kabur/i,
        /tidak logis/i, /tidak teratur/i, /kacau/i, /disorientasi/i,
        /tidak mampu/i, /kesulitan berpikir/i, /retardasi/i,
        /debil/i, /gangguan kognitif/i, /tidak fokus/i,
        /konsentrasi kurang/i, /pelupa/i, /tidak konsisten/i,
        /tidak sistematis/i, /berpikir asosiatif/i, /kekacauan/i
      ],
      positif: [
        /jelas/i, /teratur/i, /sistematis/i, /logis/i,
        /konsisten/i, /terorganisir/i, /fokus/i, /detail/i,
        /analitis/i, /kemampuan.*baik/i, /intelegensi tinggi/i,
        /cerdas/i, /kreatif.*berpikir/i
      ]
    },
    'EMPATHY, INTERPERSONAL SKILL & TEAMWORK': {
      negatif: [
        /menarik diri/i, /isolasi/i, /penyendiri/i, /tidak bergaul/i,
        /kesulitan.*sosial/i, /hambatan.*interaksi/i, /permusuhan/i,
        /bermusuhan/i, /agresif.*sosial/i, /tidak percaya/i,
        /curiga/i, /sulit.*berhubungan/i, /dingin/i, /cuek/i,
        /tidak peduli/i, /ego/i, /individualis/i, /terisolasi/i,
        /kesepian/i, /canggung/i, /pemalu/i, /menghindar/i
      ],
      positif: [
        /empati/i, /hangat/i, /ramah/i, /kooperatif/i,
        /bersahabat/i, /peduli/i, /suka membantu/i, /sosial.*baik/i,
        /mudah bergaul/i, /interpersonal.*baik/i, /terbuka/i,
        /kolaboratif/i, /peka.*orang lain/i
      ]
    },
    'STABILITAS EMOSI & KONTROL IMPULS': {
      negatif: [
        /agresif/i, /marah/i, /impulsif/i, /cemas/i, /takut/i,
        /depresi/i, /sedih/i, /murung/i, /kacau/i, /gelisah/i,
        /tegang/i, /panik/i, /nervous/i, /manik/i, /meledak/i,
        /kontrol.*lemah/i, /tidak stabil/i, /emosional/i,
        /histeris/i, /frustrasi/i, /kecewa/i, /putus asa/i,
        /melankolis/i, /murung/i, /labilitas/i, /moody/i,
        /sensitif/i, /mudah tersinggung/i, /mudah marah/i
      ],
      positif: [
        /tenang/i, /stabil/i, /damai/i, /terkendali/i, /seimbang/i,
        /sabar/i, /kalem/i, /harmonis/i, /matang.*emosi/i,
        /kontrol.*baik/i, /dapat mengendalikan/i
      ]
    },
    'MOTIVATION & ACHIEVEMENT DRIVE': {
      negatif: [
        /tidak termotivasi/i, /kurang semangat/i, /pasif/i,
        /malas/i, /tidak ambisi/i, /kurang dorongan/i,
        /mudah menyerah/i, /lemah.*kemauan/i, /tidak ada tujuan/i,
        /stagnan/i, /tidak produktif/i, /loyo/i, /lemas/i,
        /tidak bertenaga/i, /energi.*lemah/i, /lesu/i
      ],
      positif: [
        /ambisi/i, /berprestasi/i, /termotivasi/i, /semangat/i,
        /vitalitas/i, /energi.*tinggi/i, /rajin/i, /tekun/i,
        /gigih/i, /berusaha keras/i, /optimis/i, /aspirasi/i,
        /produktif/i, /inisiatif/i, /dorongan.*kuat/i
      ]
    },
    'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY': {
      negatif: [
        /kaku/i, /rigid/i, /tidak fleksibel/i, /sulit beradaptasi/i,
        /stagnan/i, /monoton/i, /tidak bisa berubah/i, /resistensi/i,
        /menolak perubahan/i, /tidak dinamis/i, /statis/i,
        /menentang/i, /keras kepala/i, /kepala batu/i, /defensif/i,
        /tertutup.*pengalaman baru/i, /tidak inisiatif/i
      ],
      positif: [
        /fleksibel/i, /adaptif/i, /dinamis/i, /mudah menyesuaikan/i,
        /terbuka/i, /mengeksplorasi/i, /mencoba.*baru/i,
        /inovatif/i, /kreatif/i, /cepat belajar/i, /inisiatif/i,
        /belajar.*cepat/i, /responsif/i, /spontan/i
      ]
    },
    'INTEGRITY & RULE COMPLIANCE': {
      negatif: [
        /curang/i, /manipulasi/i, /eksploitasi/i, /melanggar/i,
        /antisosial/i, /psikopat/i, /tidak jujur/i, /menyembunyikan/i,
        /berbohong/i, /mengelak/i, /menentang aturan/i, /melawan.*otoritas/i,
        /agresif.*aturan/i, /impulsif.*etika/i, /tidak bertanggung jawab/i
      ],
      positif: [
        /integritas/i, /jujur/i, /bertanggung jawab/i, /disiplin/i,
        /patuh.*aturan/i, /moral.*baik/i, /etis/i, /dapat dipercaya/i,
        /konsisten.*nilai/i, /dedikasi/i, /loyal/i, /amanah/i
      ]
    },
    'TEACHING CREATIVITY': {
      negatif: [
        /tidak kreatif/i, /monoton/i, /kaku.*mengajar/i,
        /tidak inovatif/i, /repetitif/i, /tidak imajinatif/i,
        /kurang ide/i, /steril/i, /tidak variatif/i
      ],
      positif: [
        /kreatif/i, /inovatif/i, /imajinatif/i, /ide.*baru/i,
        /ekspresif/i, /artistik/i, /orisinil/i, /variatif/i,
        /mengeksplorasi/i, /inventif/i, /menghasilkan ide/i,
        /kaya ide/i, /senang bereksperimen/i
      ]
    }
  };

  /* ============================================================
     OVERRIDE TABLE — untuk tuning manual item spesifik
     ------------------------------------------------------------
     Format:
     'testKey::sectionId::itemId': {
       kategori: [...],        // bisa multi
       polaritas: '+' | '-',
       bobot: 1 | 2 | 3,
       redFlag: true | false
     }

     Contoh (akan diisi jika ada item yang butuh penyesuaian):
     'baum::ukuran_gambar::terlalu_besar': {
       kategori: ['KEMAMPUAN BERPIKIR & PROBLEM SOLVING', 'STABILITAS EMOSI & KONTROL IMPULS'],
       polaritas: '-',
       bobot: 2,
       redFlag: false
     }
     ============================================================ */
  const OVERRIDE_TABLE = {
    // Kosongkan dulu — akan diisi bertahap oleh admin/psikolog
    // Setiap entry akan MENIMPA hasil auto-mapper
  };

  /* ============================================================
     KAMUS REKOMENDASI PENGEMBANGAN PER KATEGORI
     ============================================================ */
  const DEVELOPMENT_KAMUS = {
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
  };

  /* ============================================================
     RESOLVE META: dari override table ATAU auto-mapper
     ============================================================ */
  function _detectBobot(text) {
    if (!text) return 1;
    // Red flag check dulu
    for (const rx of BOBOT_RULES.RED_FLAG) {
      if (rx.test(text)) return 3;
    }
    for (const rx of BOBOT_RULES.BERAT) {
      if (rx.test(text)) return 3;
    }
    for (const rx of BOBOT_RULES.SEDANG) {
      if (rx.test(text)) return 2;
    }
    return 1;
  }

  function _detectRedFlag(text) {
    if (!text) return false;
    for (const rx of BOBOT_RULES.RED_FLAG) {
      if (rx.test(text)) return true;
    }
    return false;
  }

  function _autoMap(text) {
    const kategoriPos = new Set();
    const kategoriNeg = new Set();

    Object.entries(KEYWORD_RULES).forEach(([kat, rules]) => {
      rules.positif.forEach(rx => {
        if (rx.test(text)) kategoriPos.add(kat);
      });
      rules.negatif.forEach(rx => {
        if (rx.test(text)) kategoriNeg.add(kat);
      });
    });

    // Kalau ada konflik (kategori sama di + dan −), prioritaskan negatif
    // (dalam tes grafis, indikator negatif lebih "menonjol" dari positif)
    const kategoriNegArr = [...kategoriNeg];
    const kategoriPosArr = [...kategoriPos].filter(k => !kategoriNeg.has(k));

    let polaritas = null;
    let kategori = [];

    if (kategoriNegArr.length > 0) {
      polaritas = '-';
      kategori = kategoriNegArr;
    } else if (kategoriPosArr.length > 0) {
      polaritas = '+';
      kategori = kategoriPosArr;
    }

    return { kategori, polaritas };
  }

  function resolveMeta(item, testKey, sectionId) {
    if (!item) return null;

    const itemId = item.id || 'sub';
    const overrideKey = `${testKey}::${sectionId}::${itemId}`;

    // 1. Cek override table dulu
    if (OVERRIDE_TABLE[overrideKey]) {
      return { ...OVERRIDE_TABLE[overrideKey], _source: 'override' };
    }

    // 2. Gabungkan teks dari label + ciri + interpret untuk analisis
    const fullText = [
      item.label || '',
      item.ciri || '',
      item.interpret || ''
    ].join(' \n ');

    // 3. Auto-map kategori & polaritas
    const { kategori, polaritas } = _autoMap(fullText);

    // Kalau tidak ada kategori terdeteksi, item di-skip (netral)
    if (!kategori || kategori.length === 0) {
      return null;
    }

    // 4. Bobot & red flag
    const bobot = _detectBobot(fullText);
    const redFlag = _detectRedFlag(fullText);

    return {
      kategori,
      polaritas,
      bobot,
      redFlag,
      _source: 'auto'
    };
  }

  /* ============================================================
     SCORER: hitung skor per kategori
     ============================================================ */
  function hitungSkorKategori(selectedItems) {
    if (!selectedItems || typeof selectedItems !== 'object') {
      selectedItems = {};
    }

    // Inisialisasi accumulator per kategori
    const acc = {};
    CONFIG.KATEGORI.forEach(k => {
      acc[k] = {
        kategori: k,
        nPos: 0,
        nNeg: 0,
        itemsPos: [],
        itemsNeg: [],
        redFlags: [],
        totalBobot: 0,
        skor: CONFIG.SKOR_BASE,
        confidence: 0,
        status: 'NO_DATA'
      };
    });

    const autoData = window.GRAFIS_AUTO_DATA || {};
    const testKeys = ['dap', 'baum', 'htp'];

    testKeys.forEach(testKey => {
      const data = autoData[testKey];
      if (!data || !Array.isArray(data.slides)) return;

      const selected = selectedItems[testKey] || {};

      data.slides.forEach(slide => {
        (slide.sections || []).forEach(section => {
          const sectionId = section.id;
          const val = selected[sectionId];
          if (!val) return;

          // val bisa string (radio) atau array (checkbox)
          const itemIds = Array.isArray(val) ? val : [val];

          itemIds.forEach(itemId => {
            const item = (section.items || []).find(i => i.id === itemId);
            if (!item) return;

            const meta = resolveMeta(item, testKey, sectionId);
            if (!meta) return;

            _applyMeta(acc, meta, item);

            // Proses subItems juga (hanya jika parent dipilih)
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

    // Hitung skor final per kategori
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
      kd.totalBobot = total;

      if (kd.skor >= CONFIG.THRESHOLD.SANGAT_BAIK)      kd.status = 'SANGAT_BAIK';
      else if (kd.skor >= CONFIG.THRESHOLD.BAIK)        kd.status = 'BAIK';
      else if (kd.skor >= CONFIG.THRESHOLD.CUKUP)       kd.status = 'CUKUP';
      else                                              kd.status = 'PERHATIAN';
    });

    return acc;
  }

  function _applyMeta(acc, meta, item) {
    const bobot = Number(meta.bobot) || 1;
    meta.kategori.forEach(kat => {
      const kd = acc[kat];
      if (!kd) return;

      kd.totalBobot += bobot;
      const entry = {
        label: item.label || item.id || 'item',
        bobot: bobot,
        redFlag: !!meta.redFlag
      };

      if (meta.polaritas === '+') {
        kd.nPos += bobot;
        kd.itemsPos.push(entry);
      } else if (meta.polaritas === '-') {
        kd.nNeg += bobot;
        kd.itemsNeg.push(entry);
        if (meta.redFlag) kd.redFlags.push(item.label || item.id);
      }
    });
  }

  /* ============================================================
     GENERATOR KESIMPULAN
     ============================================================ */
  function generateKesimpulan(scoring, identity) {
    identity = identity || (window.appState && window.appState.identity) || {};

    const kategoriArr = Object.values(scoring);
    const kategoriValid = kategoriArr.filter(k => k.status !== 'NO_DATA');

    if (kategoriValid.length === 0) {
      return {
        rataRata: 0,
        overallLabel: 'TIDAK CUKUP DATA',
        overallColor: '#94a3b8',
        overallConfidence: 'RENDAH',
        totalBobot: 0,
        strengths: [],
        weaknesses: [],
        allRedFlags: [],
        text: 'Tidak cukup indikator terpilih untuk menghasilkan kesimpulan yang valid. ' +
              'Mohon lengkapi checklist interpretasi terlebih dahulu.'
      };
    }

    // 1. Rata-rata (hanya dari kategori yang ada datanya)
    const skorArr = kategoriValid.map(k => k.skor);
    const rataRata = skorArr.reduce((a, b) => a + b, 0) / skorArr.length;

    // 2. Confidence keseluruhan
    const totalBobot = kategoriArr.reduce((s, k) => s + k.totalBobot, 0);
    let overallConfidence = 'RENDAH';
    if (totalBobot >= 18)      overallConfidence = 'TINGGI';
    else if (totalBobot >= 10) overallConfidence = 'SEDANG';

    // 3. Overall label
    let overallLabel, overallColor;
    if (rataRata >= CONFIG.THRESHOLD.SANGAT_BAIK) {
      overallLabel = 'HIGHLY RECOMMENDED';
      overallColor = '#166534';
    } else if (rataRata >= CONFIG.THRESHOLD.BAIK) {
      overallLabel = 'RECOMMENDED';
      overallColor = '#16a34a';
    } else if (rataRata >= CONFIG.THRESHOLD.CUKUP) {
      overallLabel = 'FAIRLY RECOMMENDED';
      overallColor = '#d97706';
    } else {
      overallLabel = 'NOT RECOMMENDED';
      overallColor = '#dc2626';
    }

    // 4. Strengths & weaknesses (dengan syarat konvergensi)
    const sorted = [...kategoriArr].sort((a, b) => b.skor - a.skor);

    const strengths = sorted
      .filter(k => k.skor >= 3.0 && k.itemsPos.length >= CONFIG.MIN_KONVERGENSI)
      .slice(0, 3);

    const weaknesses = sorted
      .filter(k => k.skor < 3.0 && k.itemsNeg.length >= CONFIG.MIN_KONVERGENSI)
      .reverse()
      .slice(0, 3);

    // 5. Red flags — hanya yang kategorinya skornya rendah
    const allRedFlags = [];
    kategoriArr.forEach(k => {
      if (k.redFlags.length > 0 && k.skor < 2.5) {
        allRedFlags.push({
          kategori: k.kategori,
          skor: k.skor,
          items: k.redFlags
        });
      }
    });

    // 6. Susun teks kesimpulan
    const lines = [];
    const separator = '─'.repeat(55);

    lines.push('KESIMPULAN INTERPRETASI GRAFIS');
    lines.push(separator);
    lines.push('');
    lines.push(`Kandidat   : ${identity.name || '-'}`);
    lines.push(`Posisi     : ${identity.position || '-'}`);
    lines.push(`Tanggal    : ${new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    })}`);
    lines.push('');
    lines.push(`Skor rata-rata       : ${rataRata.toFixed(2)} / 4.00`);
    lines.push(`Tingkat kecocokan    : ${overallLabel}`);
    lines.push(`Tingkat keyakinan    : ${overallConfidence} (total bobot: ${totalBobot})`);
    lines.push(`Kategori terukur     : ${kategoriValid.length} dari ${CONFIG.KATEGORI.length}`);
    lines.push('');
    lines.push(separator);
    lines.push('');

    // Kekuatan
    if (strengths.length > 0) {
      lines.push('◆ KEKUATAN UTAMA');
      lines.push('');
      strengths.forEach((k, i) => {
        lines.push(`${i + 1}. ${k.kategori}`);
        lines.push(`   Skor: ${k.skor.toFixed(2)} / 4.00  (${k.itemsPos.length} indikator positif)`);
        const contoh = k.itemsPos
          .sort((a, b) => b.bobot - a.bobot)
          .slice(0, 3)
          .map(x => `"${x.label}"`)
          .join(', ');
        if (contoh) lines.push(`   Indikator: ${contoh}`);
        lines.push('');
      });
      lines.push(separator);
      lines.push('');
    }

    // Kelemahan
    if (weaknesses.length > 0) {
      lines.push('◆ AREA YANG PERLU PERHATIAN');
      lines.push('');
      weaknesses.forEach((k, i) => {
        lines.push(`${i + 1}. ${k.kategori}`);
        lines.push(`   Skor: ${k.skor.toFixed(2)} / 4.00  (${k.itemsNeg.length} indikator negatif)`);
        const contoh = k.itemsNeg
          .sort((a, b) => b.bobot - a.bobot)
          .slice(0, 3)
          .map(x => `"${x.label}"`)
          .join(', ');
        if (contoh) lines.push(`   Indikator: ${contoh}`);
        lines.push('');
      });
      lines.push(separator);
      lines.push('');
    }

    // Red flags
    if (allRedFlags.length > 0) {
      lines.push('⚠️  INDIKATOR KRITIS (PERLU PENELAAHAN LANJUT)');
      lines.push('');
      allRedFlags.forEach((rf, i) => {
        lines.push(`${i + 1}. ${rf.kategori} (skor: ${rf.skor.toFixed(2)})`);
        rf.items.forEach(it => lines.push(`   • ${it}`));
        lines.push('');
      });
      lines.push(separator);
      lines.push('');
    }

    // Rekomendasi pengembangan
    if (weaknesses.length > 0) {
      lines.push('◆ REKOMENDASI PENGEMBANGAN');
      lines.push('');
      weaknesses.forEach((k, i) => {
        const dev = DEVELOPMENT_KAMUS[k.kategori];
        if (dev) {
          lines.push(`${i + 1}. ${k.kategori}`);
          lines.push(`   ${dev}`);
          lines.push('');
        }
      });
      lines.push(separator);
      lines.push('');
    }

    // Disclaimer
    lines.push('CATATAN PENTING');
    lines.push('');
    lines.push('Skor ini dihasilkan dari analisis checklist indikator visual pada');
    lines.push('tes grafis (DAP, BAUM, HTP). Interpretasi ini bersifat SCREENING,');
    lines.push('BUKAN diagnosis klinis. Keputusan akhir seleksi tetap harus');
    lines.push('mempertimbangkan: wawancara, tes objektif lain, referensi kerja,');
    lines.push('dan pertimbangan profesional psikolog.');
    lines.push('');
    lines.push('Prinsip interpretasi: konvergensi minimal 2 indikator searah,');
    lines.push('tidak menggunakan single-sign interpretation.');
    lines.push('');
    lines.push(`Dokumen ini dihasilkan otomatis pada ${new Date().toLocaleString('id-ID')}.`);

    return {
      rataRata: Number(rataRata.toFixed(2)),
      overallLabel,
      overallColor,
      overallConfidence,
      totalBobot,
      kategoriValidCount: kategoriValid.length,
      strengths,
      weaknesses,
      allRedFlags,
      text: lines.join('\n')
    };
  }

  /* ============================================================
     EXPORT
     ============================================================ */
  window.GRAFIS_SCORING = {
    CONFIG,
    BOBOT_RULES,
    KEYWORD_RULES,
    OVERRIDE_TABLE,
    DEVELOPMENT_KAMUS,

    resolveMeta,
    hitungSkorKategori,
    generateKesimpulan,

    // Helper untuk debug
    _debugAutoMap(text) {
      return _autoMap(text);
    },
    _debugBobot(text) {
      return {
        bobot: _detectBobot(text),
        redFlag: _detectRedFlag(text)
      };
    }
  };

  console.log('[GRAFIS-SCORING] ✓ Loaded — auto-scoring + conclusion engine');
})();
