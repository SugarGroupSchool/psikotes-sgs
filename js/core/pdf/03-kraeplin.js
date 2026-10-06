/* =========================================================
   js/core/pdf/03-kraeplin.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — 2026-10-06
   
   Render: HASIL TES KRAEPLIN + analisis + grafik
   Call:   window.PDF_SECTIONS.kraeplin(doc, pageWidth, startY, appState)
   Return: ySection
   ========================================================= */

window.PDF_SECTIONS = window.PDF_SECTIONS || {};

window.PDF_SECTIONS.kraeplin = function(doc, pageWidth, startY, appState) {
  let ySection = startY;

  /* ============================================================
         KRAEPLIN
         ============================================================ */
      if (
        appState.answers.KRAEPLIN &&
        Array.isArray(appState.answers.KRAEPLIN) &&
        appState.answers.KRAEPLIN.some(arr => Array.isArray(arr) && arr.length > 0)
      ) {
        const USE_UGM_NORMS = true;
        const UGM_BANDS = {
          PANKER:  [10, 14, 18, 22],
          TIANKER: [5, 10, 15, 20],
          JANKER:  [1.5, 2.5, 4, 6],
          HANKER:  [-3, -1, 1, 3]
        };
    
        const LABELS5 = ["Rendah Sekali", "Rendah", "Cukup", "Tinggi", "Sangat Tinggi"];
    
        function catFixedAsc(value, bandsAsc, invert = false) {
          const [b1, b2, b3, b4] = bandsAsc;
          let idx = 0;
          if (value <= b1) idx = 0;
          else if (value <= b2) idx = 1;
          else if (value <= b3) idx = 2;
          else if (value <= b4) idx = 3;
          else idx = 4;
          return invert ? LABELS5[4 - idx] : LABELS5[idx];
        }
    
        const key = appState.kraeplinKey || [];
        const ans = appState.answers.KRAEPLIN || [];
        const colsOrigin = tests?.KRAEPLIN?.columns || [];
    
        const expectedPerCol = colsOrigin.map(col => Math.max(0, (Array.isArray(col) ? col.length : 0) - 1));
        const expectedTotal = expectedPerCol.reduce((a, b) => a + b, 0);
    
        const colStats = expectedPerCol.map((exp, cIdx) => {
          const jaw = Array.isArray(ans[cIdx]) ? ans[cIdx] : [];
          const k   = Array.isArray(key[cIdx]) ? key[cIdx] : [];
          let isi = 0, benar = 0, salah = 0;
          for (let r = 0; r < Math.min(jaw.length, k.length); r++) {
            const v = jaw[r];
            if (typeof v === 'number' && !Number.isNaN(v)) {
              isi++;
              if (v === k[r]) benar++; else salah++;
            }
          }
          const kosong = Math.max(0, exp - isi);
          return { exp, isi, benar, salah, kosong };
        });
    
        const isiPerKolom     = colStats.map(s => s.isi);
        const benarPerKolom   = colStats.map(s => s.benar);
        const salahPerKolom   = colStats.map(s => s.salah);
        const kosongPerKolom  = colStats.map(s => s.kosong);
        const akurasiPerKolom = colStats.map(s => s.isi > 0 ? (s.benar / s.isi * 100) : 0);
    
        const totalIsi    = isiPerKolom.reduce((a, b) => a + b, 0);
        const totalBenar  = benarPerKolom.reduce((a, b) => a + b, 0);
        const totalSalah  = salahPerKolom.reduce((a, b) => a + b, 0);
        const totalKosong = Math.max(0, expectedTotal - totalIsi);
    
        const kolomDikerjakan = isiPerKolom.filter(v => v > 0).length || ((appState?.currentColumn ?? -1) + 1) || 0;
    
        const panker       = kolomDikerjakan > 0 ? (totalIsi / kolomDikerjakan) : 0;
        const tianker_abs  = totalSalah;
        const tianker_pct  = totalIsi > 0 ? (totalSalah / totalIsi * 100) : 0;
    
        let jDif = [];
        for (let i = 1; i < isiPerKolom.length; i++) {
          if (isiPerKolom[i] > 0 || isiPerKolom[i - 1] > 0) {
            jDif.push(Math.abs(isiPerKolom[i] - isiPerKolom[i - 1]));
          }
        }
        const jankerAvgDev = jDif.length ? (jDif.reduce((a, b) => a + b, 0) / jDif.length) : 0;
    
        const lastIdx  = Math.min(50, isiPerKolom.length) - 1;
        const firstIdx = 0;
        const hanker   = (lastIdx >= 0 && isiPerKolom.length > 0)
          ? (isiPerKolom[lastIdx] - isiPerKolom[firstIdx])
          : 0;
    
        const takeAvg = (arr, from, to) => {
          const seg = arr.slice(from, to);
          const valid = seg.filter(x => x > 0);
          return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
        };
    
        const n = isiPerKolom.length;
        const blk = 10;
        const earlyAvg = takeAvg(isiPerKolom, 0, Math.min(blk, n));
        const lateAvg  = takeAvg(isiPerKolom, Math.max(0, Math.min(50, n) - blk), Math.min(50, n));
        const deltaEL  = (lateAvg - earlyAvg);
    
        function linRegSlope(yFix) {
          const x = yFix.map((_, i) => i + 1);
          const m = x.length;
          if (!m) return 0;
          const meanX = x.reduce((a, b) => a + b, 0) / m;
          const meanY = yFix.reduce((a, b) => a + b, 0) / m;
          let num = 0, den = 0;
          for (let i = 0; i < m; i++) {
            num += (x[i] - meanX) * (yFix[i] - meanY);
            den += (x[i] - meanX) * (x[i] - meanX);
          }
          return den ? (num / den) : 0;
        }
    
        const slope = +linRegSlope(isiPerKolom).toFixed(3);
    
        let trenText;
        const TH_SLOPE = 0.15;
        const TH_DELTA = 1.00;
        if (slope <= -TH_SLOPE && deltaEL < -TH_DELTA)      trenText = "Menurun (indikasi kelelahan)";
        else if (slope >= +TH_SLOPE && deltaEL > +TH_DELTA) trenText = "Meningkat (indikasi pemanasan/ketahanan)";
        else                                                trenText = "Relatif stabil";
    
        const pScore = +panker.toFixed(1);
        const tScore = +tianker_abs;
        const jScore = +jankerAvgDev.toFixed(2);
        const hScore = +hanker.toFixed(2);
    
        const catP = USE_UGM_NORMS ? catFixedAsc(pScore, UGM_BANDS.PANKER, false) : "Cukup";
        const catT = USE_UGM_NORMS ? catFixedAsc(tScore, UGM_BANDS.TIANKER, true)  : "Cukup";
        const catJ = USE_UGM_NORMS ? catFixedAsc(jScore, UGM_BANDS.JANKER, true)   : "Cukup";
        const catH = USE_UGM_NORMS ? catFixedAsc(hScore, UGM_BANDS.HANKER, false)  : "Cukup";
    
        ySection += 4;
        ySection = ensurePage(doc, ySection);
    
        setTypewriter(doc, 'bold');
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text('HASIL TES KRAEPLIN', pageWidth / 2, ySection, { align: 'center' });
    
        setTypewriter(doc, 'normal');
        ySection += 3.5;
        ySection = ensurePage(doc, ySection);
    
        doc.setFontSize(7);
        doc.setTextColor(44, 62, 80);
    
        const marginX  = 15;
        const contentW = pageWidth - marginX * 2;
        const gap      = 8;
    
        let xData = marginX;
        let yy = ySection;
        const rows = [
          ["Benar", totalBenar],
          ["Salah", totalSalah],
          ["Kosong", totalKosong],
          ["Total Diisi", totalIsi],
          ["Total Seharusnya", expectedTotal],
          ["Kolom Dikerjakan", kolomDikerjakan]
        ];
    
        const labelW = 50;
        rows.forEach(([label, val]) => {
          yy = ensurePage(doc, yy);
          doc.text(label + ":", xData, yy);
          doc.text(String(val), xData + labelW, yy);
          yy += 3.1;
        });
        yy += 2.0;
    
        const LINE = 3.4;
        const SAFE = 6;
    
        function wrapAt(text, maxW) {
          const w = Math.max(4, maxW | 0);
          try { return doc.splitTextToSize(String(text ?? ""), w); }
          catch { return [String(text ?? "")]; }
        }
    
        function resetCS() {
          try { doc.setCharSpace && doc.setCharSpace(0); } catch (e) {}
        }
    
        let xPerf = marginX;
        let yPerf = yy + 4;
        if (yPerf > (Y_PB - 40)) { doc.addPage(); yPerf = 20; }
    
        setTypewriter(doc, 'bold');
        doc.text('PERFORMA (Ringkas)', xPerf, yPerf);
        doc.setDrawColor(200);
        doc.setLineWidth(0.2);
        doc.line(xPerf, yPerf + 1.2, xPerf + contentW - 2, yPerf + 1.2);
        setTypewriter(doc, 'normal');
        resetCS();
        yPerf += 3.8;
    
        const perfSummary = [
          `PANKER: ${pScore.toFixed(1)} (${catP})`,
          `TIANKER: ${tScore} salah (${tianker_pct.toFixed(1)}%) — ${catT}`,
          `JANKER: ${jScore.toFixed(2)} — ${catJ}`,
          `HANKER: ${(hScore >= 0 ? "+" : "")}${hScore.toFixed(2)} — ${catH}`,
          `Tren: slope=${slope}, awal=${earlyAvg.toFixed(1)} vs akhir=${lateAvg.toFixed(1)} (Δ=${deltaEL >= 0 ? "+" : ""}${deltaEL.toFixed(1)}) — ${trenText}.`
        ];
    
        perfSummary.forEach(line => {
          const lines = wrapAt(line, contentW - 8);
          const h = lines.length * LINE;
          if (yPerf + h + SAFE > Y_PB) { doc.addPage(); yPerf = 20; }
          for (let i = 0; i < lines.length; i++) doc.text(lines[i], xPerf + 2, yPerf + i * LINE);
          yPerf += h + 0.8;
        });
    
        let afterPerfBottom = yPerf + 4;
        if (afterPerfBottom > (Y_PB - 60)) { doc.addPage(); afterPerfBottom = 20; }
    
        let chartsBottom = afterPerfBottom;
        if (isiPerKolom.length > 0) {
          const chartW = Math.floor((contentW - gap) / 2);
          const maxIsi = Math.max(...isiPerKolom);
          const chartH = 48;
          let topY = afterPerfBottom + 2;
          if (topY + chartH > Y_PB) { doc.addPage(); topY = 20; }
    
          const leftBottom = renderKraeplinChartToPDF(
            doc, marginX, topY, chartW, chartH, isiPerKolom,
            {
              title: 'Pengerjaan/kolom', xLabel: 'Kolom', yLabel: 'Jumlah',
              yMin: 0, yMax: Math.max(30, Math.ceil(maxIsi * 1.1)), yTicksExplicit: null, yTickEvery: 5,
              showPts: true, pointLabels: true, labelEveryPt: 1, markExtrema: true, showMidrange: true,
              footerNote: `Rata-rata: ${pScore.toFixed(1)} | Kolom: ${kolomDikerjakan}`,
              padL: 18, padT: 9, padB: 11
            }
          );
    
          let rightBottom = leftBottom;
          if (akurasiPerKolom.length > 0) {
            rightBottom = renderKraeplinChartToPDF(
              doc, marginX + chartW + gap, topY, chartW, chartH,
              akurasiPerKolom.map(v => +v.toFixed(1)),
              {
                title: 'Akurasi/kolom (%)', xLabel: 'Kolom', yLabel: '% benar',
                yMin: 0, yMax: 100,
                yTicksExplicit: Array.from({ length: 11 }, (_, i) => i * 10), yTickEvery: 1,
                showPts: true, pointLabels: false, markExtrema: true, showMidrange: true,
                padL: 18, padT: 9, padB: 11
              }
            );
          }
          chartsBottom = Math.max(leftBottom, rightBottom) + 2;
        }
    
        ySection = ensurePage(doc, Math.max(chartsBottom, yPerf) + 6);
      }
    
      

  return ySection;
};

console.log('[PDF-KRAEPLIN] ✓ Loaded');
