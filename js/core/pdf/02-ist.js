/* =========================================================
   js/core/pdf/02-ist.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — 2026-10-06
   
   Render: JAWABAN TES IST + Ringkasan + Grafik
   Call:   window.PDF_SECTIONS.ist(doc, pageWidth, startY, appState)
   Return: ySection
   ========================================================= */

window.PDF_SECTIONS = window.PDF_SECTIONS || {};

window.PDF_SECTIONS.ist = function(doc, pageWidth, startY, appState) {
    let ySection = startY;
  /* ============================================================
         IST
         ============================================================ */
      if (
        appState.answers.IST &&
        Array.isArray(appState.answers.IST) &&
        appState.answers.IST.some(subtest => Array.isArray(subtest.answers) && subtest.answers.length > 0)
      ) {
        try { applyAllKeysIntoQuestions(); } catch {}
    
        ySection += 2;
        ySection = ensurePage(doc, ySection);
    
        setTypewriter(doc, 'bold');
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text('JAWABAN TES IST', pageWidth / 2, ySection, { align: 'center' });
    
        setTypewriter(doc, 'normal');
        ySection += 2;
        doc.setTextColor(44, 62, 80);
    
        /* Format ringkas per subtes */
        function _pickAnswer(a) {
          if (a == null) return '';
          if (typeof a === 'string' || typeof a === 'number') return String(a);
          if (typeof a === 'object') {
            const cand = a.answer ?? a.text ?? a.value ?? a.label ?? a.choice ?? '';
            return cand == null ? '' : String(cand);
          }
          return String(a);
        }
    
        function _compactToken(v) {
          if (v == null || v === '') return '-';
          let s = String(v).trim();
          if (/^[A-Ea-e]\s*$/.test(s)) return s[0].toLowerCase();
          if (/^[A-Ea-e][.)](?:\s*\S.*)?$/.test(s)) return s[0].toLowerCase();
          if (/^[+-]?\d+(?:[.,]\d+)?$/.test(s)) return s.replace(',', '.');
          return s.replace(/[\[\]]/g, '').replace(/,/g, ' ');
        }
    
        const SUB_LABEL = {
          SE: 'SE (Satzergänzung)',
          WA: 'WA (Wortauswahl)',
          AN: 'AN (Analogien)',
          GE: 'GE (Gemeinsamkeiten Finden)',
          RA: 'RA (Rechenaufgaben)',
          ZR: 'ZR (Zahlenreihen)',
          FA: 'FA (Figurenauswahl)',
          WU: 'WU (Würfelaufgaben)',
          ME: 'ME (Memori)'
        };
    
        function _inferCode(name = '') {
          const s = String(name).toUpperCase();
          const two = s.replace(/[^A-Z]/g, '').slice(0, 2);
          if (SUB_LABEL[two]) return two;
          for (const k of Object.keys(SUB_LABEL)) {
            if (s.includes(k)) return k;
          }
          return two || s.slice(0, 2) || 'SE';
        }
    
        function _formatSubtestLine(subtest) {
          const code = _inferCode(subtest?.name || '');
          const label = SUB_LABEL[code] || (code + ' (' + (subtest?.name || code) + ')');
          const answersArr = Array.isArray(subtest?.answers) ? subtest.answers : [];
          const tokens = answersArr.map(a => _compactToken(_pickAnswer(a)));
          if (!tokens.length) return `${label}  [-]`;
          const groups = [];
          for (let i = 0; i < tokens.length; i += 5) {
            const chunk = tokens.slice(i, i + 5);
            groups.push(`[${chunk.join(', ')}]`);
          }
          return `${label}  ${groups.join(', ')}`;
        }
    
        const linesPerSub = appState.answers.IST.map(st => _formatSubtestLine(st));
        const flow = linesPerSub.join(' ||| ');
    
        const LM = 16, RM = 16, MAXY = Y_MAX;
        const TEXT_W = pageWidth - (LM + RM);
    
        doc.setFontSize(7);
        setTypewriter(doc, 'normal');
        doc.setTextColor(44, 62, 80);
    
        const chunks = doc.splitTextToSize(safeStr(flow), TEXT_W);
        for (let i = 0; i < chunks.length; i++) {
          ySection += 2.4;
          if (ySection > MAXY) { doc.addPage(); ySection = 20; }
          doc.text(chunks[i], LM, ySection);
        }
        ySection += 2;
    
        // Ringkasan IST
        try {
          ySection = renderISTSummaryToPDF(doc, pageWidth, ySection);
          const summary = computeISTPerSubtestScores();
          ySection = renderISTScoresToPDF(doc, pageWidth, ySection, summary);
          ySection = renderISTIQToPDF(doc, pageWidth, ySection, summary);
          ySection = renderISTDescriptionsToPDF(doc, pageWidth, ySection, summary);
          ySection = renderISTThinkingDimensionToPDF(doc, pageWidth, ySection, summary);
          ySection = renderISTSWChartToPDF(doc, pageWidth, ySection, summary);
          ySection = renderISTMWAnalysisToPDF(doc, pageWidth, ySection, summary);
        } catch (e) {
          console.error('IST summary/render error', e);
        }
      }
    
      
  return ySection;
};

console.log('[PDF-IST] ✓ Loaded');
