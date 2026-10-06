/* =========================================================
   js/core/pdf/04-grafis.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — 2026-10-06
   Section: grafis
   ========================================================= */

window.PDF_SECTIONS = window.PDF_SECTIONS || {};

window.PDF_SECTIONS.grafis = async function(doc, pageWidth, startY, appState) {
  let ySection = startY;

  /* ============================================================
         GRAFIS
         ============================================================ */
  if (appState.completed.GRAFIS && appState.grafis) {
    const grafisKeys = ["orang", "rumah", "pohon"];
  
    for (const key of grafisKeys) {
      if (appState.grafis[key]) {
        // ↓ KOMPRES GAMBAR DULU sebelum masuk PDF
        const compressedImg = await __compressImageForPDF(appState.grafis[key], 1000, 0.55);
  
        await new Promise(resolve => {
          doc.addPage();
          const img = new window.Image();
  
          img.onload = function () {
            const pxToMm = px => px * 0.264583;
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
  
            let imgWmm = pxToMm(img.naturalWidth);
            let imgHmm = pxToMm(img.naturalHeight);
  
            const scale = Math.min(pageW / imgWmm, pageH / imgHmm);
            imgWmm *= scale;
            imgHmm *= scale;
  
            const x = (pageW - imgWmm) / 2;
            const y = (pageH - imgHmm) / 2;
  
            doc.addImage(compressedImg, 'JPEG', x, y, imgWmm, imgHmm);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = compressedImg;
        });
      }
    }
  
    doc.addPage();
    ySection = 25;
  }
    
      

  return ySection;
};

console.log('[PDF-GRAFIS] ✓ Loaded');
