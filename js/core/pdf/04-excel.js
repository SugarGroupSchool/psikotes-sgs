/* =========================================================
   js/core/pdf/04-excel.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — 2026-10-06
   Section: excel
   ========================================================= */

window.PDF_SECTIONS = window.PDF_SECTIONS || {};

window.PDF_SECTIONS.excel = async function(doc, pageWidth, startY, appState) {
  let ySection = startY;

  /* ============================================================
         EXCEL
         ============================================================ */
      if (appState.completed.EXCEL && appState.adminAnswers && appState.adminAnswers.EXCEL && appState.adminAnswers.EXCEL.link) {
        ySection += 5;
        if (ySection > 260) { doc.addPage(); ySection = 25; }
    
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text('Tes Admin: Excel/Spreadsheet', 20, ySection);
        ySection += 4;
    
        doc.setFont(undefined, 'normal');
        doc.setTextColor(33, 77, 170);
    
        const link = appState.adminAnswers.EXCEL.link;
        const wrapLink = doc.splitTextToSize(link, 160);
        doc.text('Link Google Sheet Jawaban:', 24, ySection);
        ySection += 4;
        doc.text(wrapLink, 24, ySection);
        ySection += 6;
        doc.setTextColor(44, 62, 80);
    
        if (ySection > 260) { doc.addPage(); ySection = 25; }
      }
    
      

  return ySection;
};

console.log('[PDF-EXCEL] ✓ Loaded');
