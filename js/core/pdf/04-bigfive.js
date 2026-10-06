/* =========================================================
   js/core/pdf/04-bigfive.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — 2026-10-06
   Section: bigfive
   ========================================================= */

window.PDF_SECTIONS = window.PDF_SECTIONS || {};

window.PDF_SECTIONS.bigfive = async function(doc, pageWidth, startY, appState) {
  let ySection = startY;

  /* ============================================================
         BIG FIVE
         ============================================================ */
      if (appState.completed.BIGFIVE) {
        ySection += 6;
        if (ySection > 265) { doc.addPage(); ySection = 20; }
    
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Tes Big Five', 105, ySection, { align: 'center' });
        ySection += 4;
    
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.text('Jawaban:', 20, ySection);
        ySection += 3;
    
        const total = tests.BIGFIVE.questions.length;
        const col_x = [18, 63, 108, 153];
        const rowsPerCol = Math.ceil(total / 4);
    
        let row = 0, col = 0, maxRow = 0;
    
        for (let i = 0; i < total; i++) {
          if ((ySection + row * 3) > 275) {
            doc.addPage();
            ySection = 22;
            row = 0;
            col++;
            if (col > 3) { col = 0; }
          }
          if (row >= rowsPerCol) { row = 0; col++; }
          if (col > 3) { doc.addPage(); ySection = 22; col = 0; row = 0; }
    
          const ans = appState.answers.BIGFIVE[i];
          let jawaban = "Tidak dijawab";
    
          if (typeof ans === 'number' && ans > 0) {
            if (ans === 1)      jawaban = "1 (Sangat Tidak Sesuai)";
            else if (ans === 2) jawaban = "2 (Tidak Sesuai)";
            else if (ans === 3) jawaban = "3 (Netral)";
            else if (ans === 4) jawaban = "4 (Sesuai)";
            else if (ans === 5) jawaban = "5 (Sangat Sesuai)";
            else                jawaban = ans.toString();
          }
    
          doc.text(
            `${(i + 1).toString().padStart(3, '0')}. ${jawaban}`,
            col_x[col], ySection + row * 3
          );
    
          row++;
          maxRow = Math.max(maxRow, row);
        }
    
        ySection += maxRow * 3 + 3;
    
        /* Ringkasan OCEAN */
        if (appState.hasilOCEAN) {
          if (ySection > 255) { doc.addPage(); ySection = 20; }
    
          doc.setFont(undefined, 'bold');
          doc.text('Ringkasan Hasil OCEAN:', 20, ySection);
          ySection += 3;
          doc.setFont(undefined, 'normal');
    
          Object.entries(appState.hasilOCEAN).forEach(([dim, val]) => {
            if (ySection > 280) { doc.addPage(); ySection = 20; }
    
            const splitText = doc.splitTextToSize(
              `${val.name.padEnd(15)} | Skor: ${val.percent.toString().padStart(2, ' ')}% | ${val.desc}`,
              170
            );
    
            splitText.forEach(part => {
              if (ySection > 280) { doc.addPage(); ySection = 20; }
              doc.text(part, 25, ySection);
              ySection += 3.1;
            });
          });
          ySection += 2;
        }
    
        /* Tabel Kecocokan OCEAN */
        if (appState.hasilOCEAN && appState.identity && appState.identity.position) {
          let posisiKey = appState.identity.position;
          if (posisiKey === "Dosen/Guru" && appState.identity.teacherLevel && bigFivePositionAnalysis[appState.identity.teacherLevel]) {
            posisiKey = appState.identity.teacherLevel;
          }
          if (posisiKey === "Technical Staff" && appState.identity.techRole && bigFivePositionAnalysis[appState.identity.techRole]) {
            posisiKey = appState.identity.techRole;
          }
    
          const aspekList = ['O', 'C', 'E', 'A', 'N'];
          const aspekLabel = {
            O: 'Openness',
            C: 'Conscientiousness',
            E: 'Extraversion',
            A: 'Agreeableness',
            N: 'Neuroticism'
          };
    
          let aspekHasil = [];
    
          if (ySection > 250) { doc.addPage(); ySection = 20; }
    
          doc.setFont(undefined, 'bold');
          doc.text("Tabel Kecocokan Big Five dengan Posisi:", 20, ySection);
          ySection += 3;
    
          doc.setFont(undefined, 'normal');
          doc.text("Aspek             | Skor (%) | Kecocokan", 25, ySection);
          ySection += 3;
    
          aspekList.forEach(dim => {
            const val = appState.hasilOCEAN[dim];
            if (!val) return;
    
            let label = getBigFiveSuitabilityLabel(val.percent, dim);
            aspekHasil.push({ dim, label, percent: val.percent });
    
            let line = `${aspekLabel[dim].padEnd(15)} | ${val.percent.toString().padStart(3)}%    | ${label}`;
            doc.text(line, 25, ySection);
            ySection += 2.6;
          });
          ySection += 1.8;
    
          const count = { 'Cocok sekali': 0, 'Cocok': 0, 'Kurang cocok': 0, 'Tidak cocok': 0 };
          aspekHasil.forEach(a => count[a.label]++);
    
          let urutan = ["Tidak cocok", "Kurang cocok", "Cocok", "Cocok sekali"];
          let overall = urutan.find(label => count[label] === Math.max(...Object.values(count))) || "Kurang cocok";
    
          doc.setFont(undefined, 'bold');
          doc.text("Kesimpulan Akhir Kecocokan:", 25, ySection);
          ySection += 2.7;
    
          doc.setFont(undefined, 'normal');
          doc.text(`${overall.toUpperCase()}`, 90, ySection - 0.2);
    
          const strongest = aspekHasil.filter(a => a.label === "Cocok sekali" || a.label === "Cocok").sort((a, b) => b.percent - a.percent)[0];
          const weakest = aspekHasil.filter(a => a.label === "Tidak cocok" || a.label === "Kurang cocok").sort((a, b) => a.percent - b.percent)[0];
    
          ySection += 2.6;
          doc.setFont(undefined, 'bold');
          doc.text("Alasan:", 25, ySection);
          ySection += 2.2;
          doc.setFont(undefined, 'normal');
    
          let alasan;
          if (overall === "Cocok sekali") {
            alasan = `Seluruh aspek kepribadian kandidat sangat sesuai dengan tuntutan posisi. Aspek paling menonjol adalah ${strongest ? aspekLabel[strongest.dim] + " (" + strongest.percent + "%)" : "-"}, yang menjadi kekuatan utama dalam menunjang kinerja dan adaptasi pada posisi ini. Tidak ditemukan aspek yang menghambat secara signifikan.`;
          } else if (overall === "Cocok") {
            alasan = `Sebagian besar aspek kepribadian kandidat sesuai dengan tuntutan posisi. Aspek yang paling mendukung adalah ${strongest ? aspekLabel[strongest.dim] + " (" + strongest.percent + "%)" : "-"}, yang sangat menunjang kebutuhan utama pada posisi ini. Namun, terdapat beberapa aspek yang perlu dikembangkan, yaitu ${weakest ? aspekLabel[weakest.dim] + " (" + weakest.percent + "%)" : "-"}, agar kinerja dan adaptasi kandidat dapat semakin optimal.`;
          } else if (overall === "Kurang cocok") {
            alasan = `Beberapa aspek kepribadian kandidat belum memenuhi kriteria utama posisi ini, terutama pada aspek ${weakest ? aspekLabel[weakest.dim] + " (" + weakest.percent + "%)" : "-"} yang menjadi area penghambat utama. Penguatan pada aspek ini sangat disarankan agar kandidat dapat menyesuaikan diri secara lebih efektif. Meski demikian, ada pula aspek yang sudah sesuai yaitu ${strongest ? aspekLabel[strongest.dim] + " (" + strongest.percent + "%)" : "-"}, yang dapat dijadikan modal awal pengembangan.`;
          } else {
            alasan = `Sebagian besar aspek kepribadian kandidat tidak sesuai dengan tuntutan posisi, terutama pada aspek ${weakest ? aspekLabel[weakest.dim] + " (" + weakest.percent + "%)" : "-"}, yang berpotensi menjadi hambatan besar dalam pelaksanaan tugas. Diperlukan pengembangan menyeluruh dan penyesuaian pada hampir seluruh aspek agar dapat mencapai kecocokan yang dibutuhkan pada posisi ini.`;
          }
    
          const alasanLines = doc.splitTextToSize(alasan, 170);
          alasanLines.forEach(line => {
            if (ySection > 280) { doc.addPage(); ySection = 20; }
            doc.text(line, 25, ySection);
            ySection += 2.7;
          });
          ySection += 2.5;
        }
    
        /* Analisa Kepribadian & Kecocokan Posisi */
        if (appState.identity && appState.identity.position) {
          let posisiKey = appState.identity.position;
          if (posisiKey === "Dosen/Guru" && appState.identity.teacherLevel && bigFivePositionAnalysis[appState.identity.teacherLevel]) {
            posisiKey = appState.identity.teacherLevel;
          }
          if (posisiKey === "Technical Staff" && appState.identity.techRole && bigFivePositionAnalysis[appState.identity.techRole]) {
            posisiKey = appState.identity.techRole;
          }
    
          const analisa = bigFivePositionAnalysis[posisiKey];
          if (analisa && analisa.length > 0) {
            if (ySection > 255) { doc.addPage(); ySection = 20; }
            doc.setFont(undefined, 'normal');
    
            analisa.forEach(line => {
              const splitText = doc.splitTextToSize(line, 170);
              splitText.forEach(part => {
                if (ySection > 280) { doc.addPage(); ySection = 20; }
                doc.text(part, 25, ySection);
                ySection += 3.3;
              });
            });
            ySection += 2;
          }
        }
      }
    
      

  return ySection;
};

console.log('[PDF-BIGFIVE] ✓ Loaded');
