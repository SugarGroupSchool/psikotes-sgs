/* =========================================================
   js/core/pdf/04-papi.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — 2026-10-06
   Section: papi
   ========================================================= */

window.PDF_SECTIONS = window.PDF_SECTIONS || {};

window.PDF_SECTIONS.papi = async function(doc, pageWidth, startY, appState) {
  let ySection = startY;

  // ========== PAPI ==========
  if (appState.completed.PAPI) {
        ySection += 8;
        if (ySection > 265) { doc.addPage(); ySection = 20; }
    
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('JAWABAN TES PAPI', 105, ySection, { align: 'center' });
        ySection += 7;
    
        doc.setFontSize(7.2);
        doc.setFont(undefined, 'normal');
    
        const kolom = 18, baris = 5;
        const xStart = 17;
        const kolGap = 10;
    
        for (let i = 0; i < baris; i++) {
          let x = xStart;
          for (let j = 0; j < kolom; j++) {
            const idx = i + j * baris;
            if (idx < appState.answers.PAPI.length) {
              const ans = appState.answers.PAPI[idx];
              const txt = `${String(idx + 1).padStart(2, '0')}.${ans.answer || '-'}`;
              doc.text(txt, x, ySection);
              x += kolGap;
            }
          }
          ySection += 3.1;
          if (ySection > 275) { doc.addPage(); ySection = 22; }
        }
    
        ySection += 3;
        if (ySection > 265) { doc.addPage(); ySection = 20; }
    
        // SKOR PAPI
        doc.setFont(undefined, 'bold');
        doc.text('Skor PAPI:', 25, ySection);
        ySection += 2.2;
        doc.setFont(undefined, 'normal');
    
        function gabungSkorKelompok() {
          const bagian = [
            ['Arah Kerja',      appState.skorPAPIArahKerja],
            ['Kepemimpinan',    appState.skorPAPIKepemimpinan],
            ['Aktivitas',       appState.skorPAPIAktivitas],
            ['Pergaulan',       appState.skorPAPIPergaulan],
            ['Gaya Kerja',      appState.skorPAPIGayaKerja],
            ['Sifat',           appState.skorPAPISifat],
            ['Ketaatan',        appState.skorPAPIKetaatan]
          ];
          return bagian.map(([judul, obj]) => {
            if (!obj) return '';
            const skor = Object.entries(obj).map(([k, v]) => `${k}=${v}`).join(' | ');
            return `${judul}: ${skor}`;
          });
        }
    
        const skorKelompokArr = gabungSkorKelompok();
        const MAX_KOLOM_PER_BARIS = 3;
    
        for (let i = 0; i < skorKelompokArr.length; i += MAX_KOLOM_PER_BARIS) {
          const slice = skorKelompokArr.slice(i, i + MAX_KOLOM_PER_BARIS).join('   |   ');
          doc.text(slice, 25, ySection);
          ySection += 2.3;
          if (ySection > 265) { doc.addPage(); ySection = 20; }
        }
    
        /* =========================================================
           RANGKUMAN SKOR & INTERPRETASI PAPI
           ========================================================= */
        ySection += 4;
        if (ySection > 265) { doc.addPage(); ySection = 20; }
    
        doc.setFont(undefined, 'bold');
        doc.text('Rangkuman Skor dan Deskripsi:', 25, ySection);
        ySection += 3;
        doc.setFont(undefined, 'normal');
    
        // Rangkuman menggunakan kamusPAPI (dari data/papi-kamus.js)
        const urutanPAPI = [
          'N','G','A','L','P','I','T','V',
          'X','S','B','O','R','D','C',
          'Z','E','K','F','W'
        ];
    
        const allScores = {
          ...appState.skorPAPIArahKerja,
          ...appState.skorPAPIKepemimpinan,
          ...appState.skorPAPIAktivitas,
          ...appState.skorPAPIPergaulan,
          ...appState.skorPAPIGayaKerja,
          ...appState.skorPAPISifat,
          ...appState.skorPAPIKetaatan
        };
    
        const entries = urutanPAPI.map(kode => [kode, allScores[kode]]).filter(([k, v]) => v !== undefined);
    
        function hitungTinggiKolom(pasangan, fontSize = 6.2) {
          let totalY = 0;
          pasangan.forEach(([kode, nilai]) => {
            if (nilai == null) return;
            const interpretasi = getInterpretasiPAPI(kode, nilai);
            const lines = doc.splitTextToSize(interpretasi, 72);
            totalY += 4.6 + (lines.length - 1) * 2.3;
          });
          return totalY;
        }
    
        function drawKolom(pasangan, xStart, yStart) {
          let y = yStart;
          pasangan.forEach(([kode, nilai]) => {
            if (nilai == null) return;
            doc.setFont(undefined, 'bold');
            doc.text(`${kode} = ${nilai}`, xStart, y);
            doc.setFont(undefined, 'normal');
            const interpretasi = getInterpretasiPAPI(kode, nilai);
            const lines = doc.splitTextToSize(interpretasi, 72);
            lines.forEach((line, i) => {
              doc.text(line, xStart + 12, y + (i * 2.3));
            });
            y += 4.6 + (lines.length - 1) * 2.3;
            if (y > 265) { doc.addPage(); y = 20; }
          });
          return y;
        }
    
        const nHalf = Math.ceil(entries.length / 2);
        const kolomKiri = entries.slice(0, nHalf);
        const kolomKanan = entries.slice(nHalf);
    
        const tinggiKiri = hitungTinggiKolom(kolomKiri);
        const tinggiKanan = hitungTinggiKolom(kolomKanan);
        const tinggiMax = Math.max(tinggiKiri, tinggiKanan);
    
        if (ySection + tinggiMax > 275) {
          doc.addPage();
          ySection = 20;
        }
    
        doc.setFontSize(6.2);
        const yL = drawKolom(kolomKiri, 25, ySection);
        const yR = drawKolom(kolomKanan, 112, ySection);
        ySection = Math.max(yL, yR) + 6;
    
        /* =========================================================
           ANALISIS KECOCOKAN POSISI PAPI
           ========================================================= */
        const posisi = appState.identity?.position || "Unknown";
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.text(`Analisis Kecocokan untuk Posisi: ${posisi}`, 25, ySection);
        ySection += 3;
        doc.setFont(undefined, 'normal');
    
        const nama = appState.identity?.name || "Kandidat";
        const hasilAnalisisDetail = analisisKecocokanPAPIDetail(allScores, posisi, nama);
    
        doc.setFontSize(8.5);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(61, 131, 223);
        doc.text(`Analisis Kecocokan untuk Posisi: ${posisi}`, 20, ySection);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        ySection += 4;
    
        hasilAnalisisDetail.split('\n').forEach(baris => {
          const wrapLines = doc.splitTextToSize(baris, 160);
          wrapLines.forEach(wrapLine => {
            if (ySection > 275) { doc.addPage(); ySection = 20; }
            const xPos = (baris.startsWith('-') || baris.startsWith('*')) ? 27 : 20;
            doc.text(wrapLine, xPos, ySection);
            ySection += 3;
          });
        });
        ySection += 5;
      }
    
      

  return ySection;
};

console.log('[PDF-PAPI] ✓ Loaded');
