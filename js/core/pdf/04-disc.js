/* =========================================================
   js/core/pdf/04-disc.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — 2026-10-06
   Section: disc
   ========================================================= */

window.PDF_SECTIONS = window.PDF_SECTIONS || {};

window.PDF_SECTIONS.disc = async function(doc, pageWidth, startY, appState) {
  let ySection = startY;

  /* ============================================================
         DISC
         ============================================================ */
      if (appState.completed.DISC) {
        ySection += 2;
        ySection = ensurePage(doc, ySection);
    
        setTypewriter(doc, 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(
          `HASIL DISC ${appState.identity?.nickname || ''}`,
          pageWidth / 2, ySection, { align: 'center' }
        );
        ySection += 6;
        doc.setTextColor(44, 62, 80);
    
        setTypewriter(doc, 'bold');
        doc.setFontSize(7);
        doc.text('JAWABAN TES DISC', pageWidth / 2, ySection, { align: 'center' });
    
        setTypewriter(doc, 'normal');
        ySection += 2;
    
        const jawabanDISC = (appState.answers.DISC || []).map((ans, idx) => ({
          no: (idx + 1).toString(),
          p: (ans.p + 1).toString(),
          k: (ans.k + 1).toString()
        }));
    
        const barisDISC = Math.ceil(jawabanDISC.length / 4);
        const cols = [[], [], [], []];
        for (let i = 0; i < jawabanDISC.length; i++) {
          const colIndex = i % 4;
          cols[colIndex].push(jawabanDISC[i]);
        }
    
        const colX = [29, 67, 105, 143];
        let colY = ySection + 0.5;
    
        for (let r = 0; r < barisDISC; r++) {
          colY += 2.3;
          if (colY > 280) { doc.addPage(); colY = 20; }
          for (let c = 0; c < 4; c++) {
            const ans = cols[c][r];
            if (ans) {
              doc.text(`${ans.no}. [P]=${ans.p} ; [K]=${ans.k}`, colX[c], colY);
            }
          }
        }
    
        ySection = colY + 2;
    
        if (ySection > 220) {
          doc.addPage();
          ySection = 20;
        }
    
        const hasilDISC = countDISC(appState.answers.DISC, tests.DISC.questions);
    
        if (typeof drawDISCClassic === "function") {
          drawDISCClassic('discMost',   'most',   hasilDISC.most.D,   hasilDISC.most.I,   hasilDISC.most.S,   hasilDISC.most.C,   "#2176C7");
          drawDISCClassic('discLeast',  'least',  hasilDISC.least.D,  hasilDISC.least.I,  hasilDISC.least.S,  hasilDISC.least.C,  "#DE9000");
          drawDISCClassic('discChange', 'change', hasilDISC.change.D, hasilDISC.change.I, hasilDISC.change.S, hasilDISC.change.C, "#18b172");
          await new Promise(r => setTimeout(r, 80));
        }
    
        // GRAFIK DISC
        try {
          const imgMost   = document.getElementById('discMost')?.toDataURL('image/png') || null;
          const imgLeast  = document.getElementById('discLeast')?.toDataURL('image/png') || null;
          const imgChange = document.getElementById('discChange')?.toDataURL('image/png') || null;
    
          const imgWidth = 28, imgHeight = 60;
          const gapImg = 3;
          const totalWidth = imgWidth * 3 + gapImg * 2;
          const xStart = pageWidth / 2 - totalWidth / 2;
    
          if (imgMost)   doc.addImage(imgMost,   'PNG', xStart, ySection, imgWidth, imgHeight);
          if (imgLeast)  doc.addImage(imgLeast,  'PNG', xStart + imgWidth + gapImg, ySection, imgWidth, imgHeight);
          if (imgChange) doc.addImage(imgChange, 'PNG', xStart + (imgWidth + gapImg) * 2, ySection, imgWidth, imgHeight);
    
          doc.setFontSize(7);
          doc.setTextColor(33, 118, 199);
          doc.text('Most (P)', xStart + imgWidth / 2, ySection + imgHeight + 6, { align: 'center' });
          doc.setTextColor(222, 144, 0);
          doc.text('Least (K)', xStart + imgWidth + gapImg + imgWidth / 2, ySection + imgHeight + 6, { align: 'center' });
          doc.setTextColor(24, 177, 114);
          doc.text('Change', xStart + (imgWidth + gapImg) * 2 + imgWidth / 2, ySection + imgHeight + 6, { align: 'center' });
    
          doc.setTextColor(44, 62, 80);
          ySection += imgHeight + 12;
          if (ySection > 265) { doc.addPage(); ySection = 20; }
        } catch (e) {}
    
        // TABEL NILAI
        doc.setFontSize(8.5);
        const tableX = pageWidth / 2 - 54;
        let tY = ySection;
    
        doc.setFont(undefined, 'bold');
        doc.text('Line',    tableX,     tY);
        doc.text('D',       tableX + 22, tY);
        doc.text('I',       tableX + 33, tY);
        doc.text('S',       tableX + 44, tY);
        doc.text('C',       tableX + 55, tY);
        doc.text('*',       tableX + 66, tY);
        doc.text('Total',   tableX + 77, tY);
        doc.setFont(undefined, 'normal');
        tY += 4;
    
        // Most row
        doc.text('Most (P)', tableX, tY);
        doc.text(`${hasilDISC.most.D || 0}`,          tableX + 22, tY);
        doc.text(`${hasilDISC.most.I || 0}`,          tableX + 33, tY);
        doc.text(`${hasilDISC.most.S || 0}`,          tableX + 44, tY);
        doc.text(`${hasilDISC.most.C || 0}`,          tableX + 55, tY);
        doc.text(`${hasilDISC.most['*'] || 0}`,       tableX + 66, tY);
        doc.text(
          `${(hasilDISC.most.D || 0) + (hasilDISC.most.I || 0) + (hasilDISC.most.S || 0) + (hasilDISC.most.C || 0) + (hasilDISC.most['*'] || 0)}`,
          tableX + 77, tY
        );
        tY += 4;
    
        // Least row
        doc.text('Least (K)', tableX, tY);
        doc.text(`${hasilDISC.least.D || 0}`,         tableX + 22, tY);
        doc.text(`${hasilDISC.least.I || 0}`,         tableX + 33, tY);
        doc.text(`${hasilDISC.least.S || 0}`,         tableX + 44, tY);
        doc.text(`${hasilDISC.least.C || 0}`,         tableX + 55, tY);
        doc.text(`${hasilDISC.least['*'] || 0}`,      tableX + 66, tY);
        doc.text(
          `${(hasilDISC.least.D || 0) + (hasilDISC.least.I || 0) + (hasilDISC.least.S || 0) + (hasilDISC.least.C || 0) + (hasilDISC.least['*'] || 0)}`,
          tableX + 77, tY
        );
        tY += 4;
    
        // Change row
        doc.text('Change', tableX, tY);
        doc.text(`${hasilDISC.change.D >= 0 ? '+' : ''}${hasilDISC.change.D || 0}`, tableX + 22, tY);
        doc.text(`${hasilDISC.change.I >= 0 ? '+' : ''}${hasilDISC.change.I || 0}`, tableX + 33, tY);
        doc.text(`${hasilDISC.change.S >= 0 ? '+' : ''}${hasilDISC.change.S || 0}`, tableX + 44, tY);
        doc.text(`${hasilDISC.change.C >= 0 ? '+' : ''}${hasilDISC.change.C || 0}`, tableX + 55, tY);
        doc.text(`${hasilDISC.change['*'] >= 0 ? '+' : ''}${hasilDISC.change['*'] || 0}`, tableX + 66, tY);
        doc.text(
          `${(hasilDISC.change.D || 0) + (hasilDISC.change.I || 0) + (hasilDISC.change.S || 0) + (hasilDISC.change.C || 0) + (hasilDISC.change['*'] || 0)}`,
          tableX + 77, tY
        );
    
        ySection = tY + 8;
        if (ySection > 265) { doc.addPage(); ySection = 20; }
    
       // ========== CEK INVALID DULU ==========
    const starMost = Number(hasilDISC.most['*'] || 0);
    const starLeast = Number(hasilDISC.least['*'] || 0);
    const totalStar = starMost + starLeast;
    const identity = appState.identity || {};
    let blokX = 16;
    let blokW = 82;
  
   if (totalStar >= 13) {
    if (identity.position) {
      blokHeading(doc, `Analisis Posisi: ${identity.position}`, [33,33,33], blokX, ySection);
      ySection += 10;
      doc.setFontSize(16);
      doc.setTextColor(200,24,44);
      doc.text("❌ INVALID", blokX+2, ySection);
      doc.setTextColor(44,62,80);
      doc.setFontSize(8.2);
      ySection += 14;
      if (ySection > 265) { doc.addPage(); ySection = 20; }
    }
    // Tambahkan paragraf penjelasan detail, jangan menyebut bintang!
    const invalidMsg = [
      "Berdasarkan analisis terhadap pola jawaban yang Anda berikan pada tes DISC, hasil tes ini dinyatakan tidak valid untuk digunakan dalam penilaian kepribadian. Ketidaksesuaian ini menunjukkan bahwa respons yang diberikan tidak merefleksikan kecenderungan kepribadian Anda yang sebenarnya, sehingga analisis lebih lanjut tidak dapat dilakukan secara objektif.",
      "Perlu ditekankan bahwa setiap alat psikotes, termasuk DISC, telah didesain dengan prinsip validitas dan reliabilitas yang tinggi sehingga tidak dapat dimanipulasi. Mengisi tes dengan mencoba menampilkan citra tertentu atau menyesuaikan jawaban dengan ekspektasi hasil hanya akan menghasilkan data yang bias dan tidak mencerminkan diri Anda yang sesungguhnya.",
      "Integritas dalam mengisi tes kepribadian sangat penting untuk memperoleh gambaran yang akurat mengenai potensi, pola perilaku, serta area pengembangan diri. Jawaban yang jujur dan sesuai kondisi diri sendiri merupakan kunci agar hasil analisis benar-benar dapat digunakan untuk tujuan pengembangan, penempatan posisi, atau konsultasi psikologi secara efektif.",
      "Apabila Anda merasa hasil ini tidak mencerminkan diri Anda, penting untuk merenungkan kembali cara pengisian tes di masa mendatang. Isilah setiap tes psikologi dengan kejujuran, spontanitas, dan sesuai instruksi, tanpa upaya untuk mengarahkan hasil, demi memperoleh manfaat yang utuh dari proses psikotes yang Anda jalani."
    ];
    invalidMsg.forEach(par => {
      const lines = doc.splitTextToSize(par, 152);
      lines.forEach(line => {
        doc.text(line, blokX+2, ySection);
        ySection += 3.1;
      });
      ySection += 1.5;
    });
    // Tetap lanjut ke proses jawaban (tidak usah break, biar selesai bagian jawaban)
  } else {
    // ================= ANALISIS DISC (Most / Least / Change) =================
    const most   = analisa2DominanDISC(hasilDISC.most.D,  hasilDISC.most.I,  hasilDISC.most.S,  hasilDISC.most.C,  'most',  getPixelY);
    const least  = analisa2DominanDISC(hasilDISC.least.D, hasilDISC.least.I, hasilDISC.least.S, hasilDISC.least.C, 'least', getPixelY);
   const change = analisa2DominanDISC(hasilDISC.change.D,hasilDISC.change.I,hasilDISC.change.S,hasilDISC.change.C,'change',getPixelY);
  
  
  
    // ============== Helper: AMBIL REKOMENDASI HANYA DARI KUNCI EXACT ==============
    function pickRolesFromDominan(dom) {
      const d = (dom || []).filter(Boolean).slice(0, 3);
      const key = d.join('').toUpperCase();   // contoh: ['S','I','C'] -> "SIC"
      const arr = (typeof DISC_ROLES_MAP !== 'undefined' && DISC_ROLES_MAP.hasOwnProperty(key))
        ? DISC_ROLES_MAP[key] : [];
      return Array.isArray(arr) ? arr : [];
    }
  
    // ================= Ambil rekomendasi TERPISAH per grafik =================
    const rolesMost   = pickRolesFromDominan(most.dominan);
    const rolesLeast  = pickRolesFromDominan(least.dominan);
    const rolesChange = pickRolesFromDominan(change.dominan);
      
  (function renderThreeColumns() {
    const left = blokX;                                       // margin kiri area tulis
    const topMargin = 20, bottomMargin = 20;
    const pageH = doc.internal.pageSize.getHeight ? doc.internal.pageSize.getHeight() : 297;
    const yLimit = pageH - bottomMargin;
  
    const gap    = 10;                                        // jarak antar kolom (lebih besar biar jelas terpisah)
    const lineH  = 3.4;
    const subHeadH = 6;                                       // tinggi subjudul kolom (tanpa bar background)
    const subHeadGap = 5;                                     // jarak subjudul -> isi
    const sectionHeadH = 10;                                  // tinggi banner section
    const sectionHeadGap = 8;                                 // jarak banner -> subjudul kolom
    const gutter = 2;                                         // gutter dalam kolom (kiri/kanan)
  
    const blokW = pageWidth - 2 * left;
    const colW  = (blokW - 2 * gap) / 3;
  
    doc.setFontSize(8);
  
    function measureColHeight(list) {
      let h = 0;
      list.forEach(role => {
        const lines = doc.splitTextToSize('- ' + role, colW - 2 * gutter);
        h += lines.length * lineH;
      });
      return h;
    }
  
    const hMost   = measureColHeight(rolesMost);
    const hLeast  = measureColHeight(rolesLeast);
    const hChange = measureColHeight(rolesChange);
  
    // total tinggi yang dibutuhkan untuk SELURUH paket
    const contentH = Math.max(hMost, hLeast, hChange);
    const needH = sectionHeadH + sectionHeadGap +           // banner
                  subHeadH + subHeadGap +                   // baris subjudul kolom
                  contentH + 4;                             // isi + padding bawah
  
    // keep-together
    if (ySection + needH > yLimit) {
      doc.addPage();
      ySection = topMargin;
    }
  
    // ===== Banner section (satu, lebar penuh) =====
    doc.setFillColor(61,131,223);
    doc.rect(left - 2, ySection - 4, blokW, sectionHeadH, 'F');
    doc.setTextColor(255,255,255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text("REKOMENDASI KARIR", left + 2, ySection + 2);
  
    // reset style untuk isi
    ySection += sectionHeadH + sectionHeadGap;
    doc.setTextColor(0,0,0);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
  
    // koordinat kolom
    const xMost   = left;
    const xLeast  = left + colW + gap;
    const xChange = left + 2 * (colW + gap);
  
    // ===== Subjudul kolom (tanpa bar background supaya tidak “menyatu”) =====
    doc.text("Most (P)",   xMost + gutter,   ySection);
    doc.text("Least (K)",  xLeast + gutter,  ySection);
    doc.text("Change (P-K)", xChange + gutter, ySection);
  
    // garis tipis di bawah subjudul agar tegas terpisah
    doc.setDrawColor(200,200,200);
    doc.line(xMost,   ySection + 1.5, xMost   + colW, ySection + 1.5);
    doc.line(xLeast,  ySection + 1.5, xLeast  + colW, ySection + 1.5);
    doc.line(xChange, ySection + 1.5, xChange + colW, ySection + 1.5);
  
    // jarak aman ke isi
    ySection += subHeadGap;
    doc.setFont(undefined, 'normal');
  
    function printCol(list, x, y) {
      let yy = y;
      list.forEach(role => {
        const lines = doc.splitTextToSize('- ' + role, colW - 2 * gutter);
        lines.forEach(line => {
          doc.text(line, x + gutter, yy);
          yy += lineH;
        });
      });
      return yy;
    }
  
    const yEndMost   = printCol(rolesMost,   xMost,   ySection);
    const yEndLeast  = printCol(rolesLeast,  xLeast,  ySection);
    const yEndChange = printCol(rolesChange, xChange, ySection);
  
    // garis pemisah vertikal samar (opsional; membantu persepsi tidak "menyatu")
    doc.setDrawColor(235,235,235);
    const colTop = ySection - subHeadGap + 1.5;             // sedikit di atas isi (tepat setelah garis subjudul)
    const colBottom = Math.max(yEndMost, yEndLeast, yEndChange);
    doc.line(xLeast - gap/2,  colTop, xLeast - gap/2,  colBottom);
    doc.line(xChange - gap/2, colTop, xChange - gap/2, colBottom);
  
    ySection = colBottom + 4;
  })();
  
  
    // ===================== Kecocokan POSISI (opsional, pakai Most) =====================
    let simbol = "-";
    let detail = "";
    if (identity.position) {
     const persyaratan = {
    "Administrator": {
      sangat: ["SC","DC"],
      cocok:  ["CS","CD"],
      cukup:  ["SD","IS"]
    },
    
    "Dosen/Guru": {
      sangat: ["IS","IC","SI","SC"],
      cocok:  ["ID","SD"],
      cukup:  ["CS","CI"]
    },
  
    "Technical Staff": {
      sangat: ["DC","SC"],
      cocok:  ["CD","CS"],
      cukup:  ["DS","SD"]
    },
  
    "IT Staff": {
      sangat: ["DC","CD"], 
      cocok:  ["SC","CS"],
      cukup:  ["SD","DS"]
    },
  
    "Manajer": {
      sangat: ["DI","ID","DC","CD"],
      cocok:  ["DS","IS"],
      cukup:  ["SC","CS"]
    },
  
    "Housekeeping": {
      sangat: ["SC","CS"],
      cocok:  ["SI","IC"],
      cukup:  ["SD","DS"]
    }
  };
  
  
      function makePairs(dom) {
        const d = (dom||[]).slice(0,3);
        const out = [];
        for (let i=0;i<d.length;i++) for (let j=i+1;j<d.length;j++) {
          out.push(d[i]+d[j], d[j]+d[i]); // di bagian posisi ini memang dua arah
        }
        return out;
      }
      const pairSet = makePairs(most.dominan);
    const posReq = persyaratan[identity.position];
  
  if (posReq) {
    if (posReq.sangat.some(code => pairSet.includes(code))) {
      simbol = "SS";     // Sangat Sesuai
    } else if (posReq.cocok.some(code => pairSet.includes(code))) {
      simbol = "C";      // Cocok
    } else if (posReq.cukup.some(code => pairSet.includes(code))) {
      simbol = "CC";     // Cukup Cocok
    } else {
      simbol = "K";      // Kurang / Tidak Sesuai
    }
  }
  
  
      if (identity.teacherLevel) {
        if (identity.teacherLevel === "SD"  && most.dominan.includes("I")) detail += "Sangat cocok untuk mengajar anak-anak.";
        if (identity.teacherLevel === "SMA" && most.dominan.includes("C")) detail += (detail ? " " : "") + "Cocok untuk mata pelajaran eksakta.";
      }
  
      let tinggiPos = 13 + (detail ? doc.splitTextToSize(detail, pageWidth-36).length*3.2 : 0);
      ySection = ensureSpace(doc, ySection, tinggiPos);
     blokHeading(doc, `Analisis Posisi: ${identity.position}`, [33,33,33], blokX, ySection);
      ySection += 10;
      doc.setFontSize(16);
      doc.text(simbol, blokX+2, ySection);
      doc.setFontSize(8.2);
      ySection += 5;
      if (detail) {
        let detLines = doc.splitTextToSize(detail, pageWidth-36);
        doc.text(detLines, blokX+2, ySection); ySection += detLines.length*3.2 + 2;
      }
      ySection += 5;
      if (ySection > 265) { doc.addPage(); ySection = 20; }
    }
  
   // ========== KESIMPULAN 3 GRAFIK + KECOCOKAN POSISI ==========
  
  if (identity.position) {
    const nickname = identity.nickname || "Peserta";
    const posisi = identity.position;
  
    const gabunganAnalisis = (() => {
      const introMost  = `• Grafik Most (P): Menunjukkan kepribadian alami ${nickname} dalam kondisi nyaman.`;
      const mostDetails = [
        `  - Tipe Dominan: ${most.dominan.join(' dan ')} (${most.ranking})`,
        `  - Deskripsi: ${stripHTML(most.deskripsi)}`,
        `  - Implikasi: ${getImplication(most.dominan.join(""), 'most', posisi)}`
      ].join('\n');
  
      const introLeast  = `• Grafik Least (K): Menggambarkan respons ${nickname} terhadap tekanan dan tantangan.`;
      const leastDetails = [
        `  - Tipe Dominan: ${least.dominan.join(' dan ')} (${least.ranking})`,
        `  - Deskripsi: ${stripHTML(least.deskripsi)}`,
        `  - Implikasi: ${getImplication(least.dominan.join(""), 'least', posisi)}`
      ].join('\n');
  
      const introChange  = `• Grafik Change (P-K): Merefleksikan kemampuan adaptasi ${nickname} antara situasi normal dan tekanan.`;
      const changeDetails = [
        `  - Kombinasi Dominan: ${change.dominan.join(' dan ')} (${change.ranking})`,
        `  - Deskripsi: ${stripHTML(change.deskripsi)}`,
        `  - Implikasi: ${getImplication(change.dominan.join(""), 'change', posisi)}`
      ].join('\n');
  
      return [
        introMost, mostDetails, "",
        introLeast, leastDetails, "",
        introChange, changeDetails
      ].join('\n');
    })();
  
  
    // ===================== SIMBOL KE TEKS =====================
    const cocokStr = (
      simbol === "SS" ? "SANGAT SESUAI" :
      simbol === "C"  ? "COCOK" :
      simbol === "CC" ? "CUKUP COCOK" :
      simbol === "K"  ? "KURANG SESUAI" :
                        "TIDAK SESUAI"
    );
  
  
    // ===================== TEKS UTAMA =====================
    const kalimatCocok = `
  
  TINGKAT KECOCOKAN:
  • Posisi: ${posisi}
  • ${simbol}
  • Alasan: ${getCompatibilityReason(simbol, most.dominan[0], posisi)}
  `;
  
  
    // ===================== CATATAN LEVEL (OPSIONAL) =====================
    let levelNote = "";
    if (identity.teacherLevel) {
      if (identity.teacherLevel === "SD" && most.dominan.includes("I")) {
        levelNote = "\n• Catatan Khusus: Gaya interpersonal yang hangat mendukung pembelajaran tingkat dasar.";
      }
      if (identity.teacherLevel === "SMA" && most.dominan.includes("C")) {
        levelNote = "\n• Catatan Khusus: Pendekatan analitis mendukung pengajaran eksakta tingkat menengah atas.";
      }
    }
  
  
    const kalimatAkhir = `
  
  POTENSI PENGEMBANGAN:
  ${nickname} memiliki potensi untuk:
  - Beradaptasi secara efektif dalam lingkungan kerja baru
  - Berkontribusi positif melalui ${getStrengthArea(most.dominan[0])}
  - Mengembangkan diri dalam peran ${posisi} melalui ${getDevelopmentArea(least.dominan[0])}`;
  
    const marginLR = 18;
    const blokW = pageWidth - 2 * marginLR;
  
    const sectionTitle = "KESIMPULAN ANALISIS DISC";
    ySection = ensureSpace(doc, ySection, 20);
  
    doc.setFillColor(61, 131, 223);
    doc.rect(blokX - 2, ySection - 4, blokW, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(sectionTitle, blokX + 2, ySection + 2);
  
    ySection += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'normal');
  
    // Cetak gabungan analisis Most/Least/Change
    const lines = gabunganAnalisis.split('\n');
    lines.forEach(line => {
      if (!line.trim()) { ySection += 2; return; }
      const wrapLines = doc.splitTextToSize(line, blokW - 8);
      wrapLines.forEach(wrapLine => {
        ySection = ensureSpace(doc, ySection, 4);
        doc.text(wrapLine, blokX + 2, ySection);
        ySection += 4;
      });
    });
  
    // Cetak kecocokan posisi + catatan level + potensi pengembangan
    [kalimatCocok, levelNote, kalimatAkhir].forEach(chunk => {
      if (!chunk) return;
      ySection += 6;
      const wraps = doc.splitTextToSize(chunk, blokW - 8);
      wraps.forEach(w => { ySection = ensureSpace(doc, ySection, 4); doc.text(w, blokX + 2, ySection); ySection += 4; });
    });
  
    ySection += 8;
    if (ySection > 265) { doc.addPage(); ySection = 20; }
  
    // ====================== BERADAPTASI DENGAN LINGKUNGAN BERBEDA ======================
    // Catatan: Graph 1 = Most (P), Graph 2 = Least (K). Perubahan diukur berbasis Y-pixel.
    // Pada kanvas PDF: y lebih kecil = titik lebih ATAS (lebih dominan secara visual).
  
    // Helper untuk mengambil nilai {D,I,S,C} baik dari struktur {nilai:{...}} maupun langsung {...}
    const getAxisVals = (obj) => (obj && obj.nilai) ? obj.nilai : obj || {};
    const mVals = getAxisVals(most);
    const lVals = getAxisVals(least);
  
    // Y pixel pada masing-masing grafik (Most & Least)
    const yMost = {
      D: getPixelY('most',  'D', +(mVals.D ?? 0)),
      I: getPixelY('most',  'I', +(mVals.I ?? 0)),
      S: getPixelY('most',  'S', +(mVals.S ?? 0)),
      C: getPixelY('most',  'C', +(mVals.C ?? 0)),
    };
    const yLeast = {
      D: getPixelY('least', 'D', +(lVals.D ?? 0)),
      I: getPixelY('least', 'I', +(lVals.I ?? 0)),
      S: getPixelY('least', 'S', +(lVals.S ?? 0)),
      C: getPixelY('least', 'C', +(lVals.C ?? 0)),
    };
  
    // Delta pixel (Least - Most). Ingat: delta < 0 = naik (lebih atas, cenderung lebih terekspresikan); delta > 0 = turun.
    const dPx = {
      D: yLeast.D - yMost.D,
      I: yLeast.I - yMost.I,
      S: yLeast.S - yMost.S,
      C: yLeast.C - yMost.C,
    };
  
    // Formatter teks delta pixel
    const fmtPx = (v) => `${Math.abs(Math.round(v))} px`;
  
    // Klasifikasi signifikansi berbasis jarak pixel
    // 18px+ signifikan (tampak jelas); 10–17px moderat; <10px minor.
    const klasifikasi = (px) => {
      const a = Math.abs(Math.round(px));
      if (a >= 18) return { tingkat: "signifikan", penjelasan: "perubahan kuat & tampak dalam perilaku" };
      if (a >= 10) return { tingkat: "moderat",    penjelasan: "perubahan terasa pada situasi tertentu" };
      return         { tingkat: "minor",      penjelasan: "perubahan halus/nuansa" };
    };
  
    // Cek lintas midline (zona dominansi) untuk masing-masing faktor
    const isAbove = (tipe, axis, val) => {
      const mid = getMidline(tipe);
      const y   = getPixelY(tipe, axis, val);
      return Number.isFinite(y) ? (y <= mid) : false; // true = di atas midline (lebih menonjol)
    };
    const crossMid = (axis) => {
      const aMost  = isAbove('most',  axis, +(mVals[axis] ?? 0));
      const aLeast = isAbove('least', axis, +(lVals[axis] ?? 0));
      return aMost !== aLeast;
    };
  
    // Header section adaptasi
    ySection = ensureSpace(doc, ySection, 20);
    const blokXSafe = (typeof blokX !== 'undefined') ? blokX : marginLR;
    const blokW2    = pageWidth - 2 * marginLR;
  
    doc.setFillColor(61, 131, 223);
    doc.rect(blokXSafe - 2, ySection - 4, blokW2, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("BERADAPTASI DENGAN LINGKUNGAN BERBEDA", blokXSafe + 2, ySection + 2);
  
    // Paragraf pembuka
    ySection += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'normal');
  
    const pembuka = [
      `Pada lembar ini, ${nickname} diminta melihat ketiga grafik dan materi profil secara utuh.`,
      `Perubahan dari Grafik 1 (Most) ke Grafik 2 (Least) sering merefleksikan respons terhadap stres/lingkungan.`,
      `Perubahan dapat membantu ${nickname} mengatasi tuntutan situasi atau menjadi sinyal untuk menata strategi adaptasi.`,
      `Dengan personal feedback, ${nickname} dapat melakukan self-monitor dan menggunakan informasi ini secara positif.`,
      "",
      "Bandingkan Grafik 1 dan 2. Saat berada pada Grafik 2 (Least), perhatikan pergeseran tiap faktor (naik/turun/konstan) dibandingkan Grafik 1 (Most):"
    ];
  
    pembuka.forEach(line => {
      if (!line.trim()) { ySection += 2; return; }
      const wraps = doc.splitTextToSize(line, blokW2 - 8);
      wraps.forEach(w => { ySection = ensureSpace(doc, ySection, 4); doc.text(w, blokXSafe + 2, ySection); ySection += 4; });
    });
  
    // Narasi per faktor (berbasis pixel, lintas midline, dan kaidah psikologi DISC)
    function barisFaktor(axis, dp, naikMsg, turunMsg, konstanMsg) {
      if (!Number.isFinite(dp)) return `- Faktor "${axis}": data tidak tersedia.`;
      const arah = (dp < 0) ? "naik" : (dp > 0) ? "turun" : "tetap";
      if (arah === "tetap") return `- Faktor "${axis}" tetap — ${konstanMsg}`;
      const kelas = klasifikasi(dp);
      const lintas = crossMid(axis) ? "; **melintasi midline** (zona dominansi berubah)" : "";
      const makna  = (dp < 0) ? naikMsg : turunMsg;
      return `- Faktor "${axis}" ${arah} ~${fmtPx(dp)} (${kelas.tingkat}${lintas}) — ${makna} (${kelas.penjelasan}).`;
    }
  
    const bulletD = barisFaktor(
      "D", dPx.D,
      `${nickname} menambah kontrol/asertivitas untuk menjaga arah & hasil saat tekanan meningkat.`,
      `${nickname} relatif melepas kontrol; lebih menerima arahan orang lain dalam situasi tertekan.`,
      "preferensi kontrol relatif stabil di berbagai konteks."
    );
  
    const bulletI = barisFaktor(
      "I", dPx.I,
      `${nickname} menguatkan komunikasi/persuasi dan menggalang dukungan sosial untuk menyelesaikan tugas.`,
      `${nickname} menahan komunikasi; interaksi dibuat lebih selektif & fungsional.`,
      "gaya interaksi sosial cenderung konstan (tidak banyak berubah)."
    );
  
    const bulletS = barisFaktor(
      "S", dPx.S,
      `${nickname} mencari kestabilan & rasa aman; cenderung menghindari konflik dan menunggu timing yang tepat.`,
      `${nickname} bergerak lebih cepat; pengambilan keputusan cenderung lebih cepat/impulsif.`,
      "kebutuhan stabilitas/ketekunan relatif tidak berubah."
    );
  
    const bulletC = barisFaktor(
      "C", dPx.C,
      `${nickname} meningkatkan kebutuhan data/aturan; keputusan diambil setelah informasi memadai.`,
      `${nickname} lebih pragmatis; keputusan lebih mengandalkan pertimbangan praktis/"gut feeling".`,
      "kebutuhan ketelitian/kepatuhan relatif tetap."
    );
  
    [bulletD, bulletI, bulletS, bulletC].forEach(line => {
      const wraps = doc.splitTextToSize(line, blokW2 - 8);
      wraps.forEach(w => { ySection = ensureSpace(doc, ySection, 4); doc.text(w, blokXSafe + 2, ySection); ySection += 4; });
    });
  
    ySection += 8;
    if (ySection > 265) { doc.addPage(); ySection = 20; }
  
    // ====================== ANALISIS SIGNIFIKANSI & POLA PSIKOLOGIS (Most vs Least) ======================
    {
      // Dominansi atas-midline di masing-masing grafik
      const domMost  = getDominantByMidline('most',  +(mVals.D??0), +(mVals.I??0), +(mVals.S??0), +(mVals.C??0));
      const domLeast = getDominantByMidline('least', +(lVals.D??0), +(lVals.I??0), +(lVals.S??0), +(lVals.C??0));
  
      // Skor arah adaptasi agregat:
      // Faktor yang "naik" (Δy<0) dianggap makin diaktifkan saat tekanan.
      const asertifAktif = (dPx.D < 0 ? 1 : 0) + (dPx.I < 0 ? 1 : 0); // D/I → eksekusi & pengaruh
      const stabilAktif  = (dPx.S < 0 ? 1 : 0) + (dPx.C < 0 ? 1 : 0); // S/C → stabilitas & akurasi
  
      let arahAdaptasi = "";
      if (asertifAktif > stabilAktif) {
        arahAdaptasi = "Di bawah tekanan, pola bergerak ke **lebih asertif/eksekutif (D/I)**: menambah kontrol, mempercepat keputusan, dan/atau meningkatkan komunikasi pengaruh.";
      } else if (stabilAktif > asertifAktif) {
        arahAdaptasi = "Di bawah tekanan, pola bergerak ke **lebih stabil/akurasi (S/C)**: mencari kepastian proses, data, dan suasana yang aman sebelum melangkah.";
      } else {
        arahAdaptasi = "Di bawah tekanan, pola **seimbang** antara dorongan asertif (D/I) dan kebutuhan stabil-akurasi (S/C); penyesuaian bersifat kontekstual.";
      }
  
      const domMostStr  = domMost.join("-");
      const domLeastStr = domLeast.join("-");
      const ringkasDominansi = (domMostStr !== domLeastStr)
        ? `Dominansi bergeser: **Most:** ${domMostStr || "—"} → **Least:** ${domLeastStr || "—"}`
        : `Dominansi relatif **konsisten** antara Most & Least (${domMostStr || "—"})`;
  
      // Subjudul kotak tip
      ySection = ensureSpace(doc, ySection, 18);
      const blokW3 = pageWidth - 2 * marginLR;
  
      doc.setFillColor(230, 241, 255);
      doc.rect(blokXSafe - 2, ySection - 3, blokW3, 8, 'F');
      doc.setTextColor(0, 84, 153);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text("Analisis Signifikansi Perubahan & Pola Psikologis", blokXSafe + 2, ySection + 2);
  
      // Narasi psikologis makro + catatan etis
      ySection += 12;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8.5);
      doc.setFont(undefined, 'normal');
  
      const narasi = [
        ringkasDominansi,
        arahAdaptasi,
        "Catatan interpretatif (kaidah psikologi DISC):",
        "• D (Dominance): terkait kontrol, keberanian mengambil keputusan, orientasi hasil.",
        "• I (Influence): terkait komunikasi, persuasi, jejaring sosial, optimisme.",
        "• S (Steadiness): terkait kestabilan, kesabaran, konsistensi ritme kerja.",
        "• C (Conscientiousness): terkait ketelitian, kepatuhan, akurasi berbasis data.",
        "",
        "Peringatan interpretasi: Hasil ini adalah gambaran preferensi perilaku dalam konteks kerja/tekanan; bukan diagnosis klinis.",
        "Gunakan bersama observasi lapangan dan umpan balik rekan/atasan untuk keputusan pengembangan yang proporsional."
      ];
  
      narasi.forEach(line => {
        const wraps = doc.splitTextToSize(line, blokW3 - 8);
        wraps.forEach(w => { ySection = ensureSpace(doc, ySection, 4); doc.text(w, blokXSafe + 2, ySection); ySection += 4; });
      });
  
      ySection += 8;
      if (ySection > 265) { doc.addPage(); ySection = 20; }
    }
  
      } // endif identity.position
    }   // tutup else (totalStar >= 13)
  }     // tutup if (appState.completed.DISC)
  
  
  
  
  

  return ySection;
};

console.log('[PDF-DISC] ✓ Loaded');
