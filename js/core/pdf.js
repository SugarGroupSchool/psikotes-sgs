/* =========================================================
   js/core/pdf.js — PDF Generation
   ---------------------------------------------------------
   ⚡ HELPERS DIPINDAH KE: js/core/pdf/00-helpers.js
   File ini sekarang hanya berisi: generatePDF(), generatePDFBlob()
   
   Urutan load (index.html):
     1. js/core/pdf/00-helpers.js  → helpers dulu
     2. js/core/pdf.js             → main logic
   ========================================================= */

async function generatePDF() {
// ============================================
// PDF PASSWORD DINAMIS
// Format: SGS-[6hurufNama]-[3akhirDeviceId]
// Contoh: SGS-AhmadF-9p3
// ============================================
const _pdfName = (appState?.identity?.name || 'Peserta')
  .replace(/[^a-zA-Z]/g, '')
  .slice(0, 6) || 'Peserta';
const _pdfDevice = (localStorage.getItem('_sgs_device_id') || 'xxx')
  .slice(-3);
function __genPdfPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let p = 'SGS-';
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 8; i++) p += chars[buf[i] % chars.length];
  return p;
}
const _pdfPassword = __genPdfPassword();
window.__lastPdfPassword = _pdfPassword;  // ← TAMBAHAN
     
const doc = new jsPDF({
  unit: 'mm',
  format: 'a4',
  compress: true,
  encryption: {
    userPassword: _pdfPassword,
    ownerPassword: _pdfPassword
  }
});
  
    const pageWidth = doc.internal.pageSize.getWidth();
  
    /* ============================================================
       LOGO
       ============================================================ */
    const logoURL = 'https://cdn.jsdelivr.net/gh/Pragas123/assets@main/nmqo6a.png';
  
    async function loadImageAsDataURL(url) {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Gagal memuat logo (${response.status} ${response.statusText})`);
      }
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Gagal mengonversi logo ke Data URL.'));
        reader.readAsDataURL(blob);
      });
    }
  
    const logoDataURL = await loadImageAsDataURL(logoURL);
  
    doc.addImage(logoDataURL, 'PNG', pageWidth / 2 - 10, 8, 20, 16);
  
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.text('HASIL PSIKOTES', pageWidth / 2, 27, { align: 'center' });
    doc.text('SUGAR GROUP SCHOOLS', pageWidth / 2, 32, { align: 'center' });
  
    /* ============================================================
   IDENTITAS — [MOVED to pdf/01-identity.js]
   ============================================================ */
let ySection = 43;
if (window.PDF_SECTIONS && typeof window.PDF_SECTIONS.identity === 'function') {
  ySection = window.PDF_SECTIONS.identity(doc, pageWidth, ySection, appState);
} else {
  console.warn('[PDF] PDF_SECTIONS.identity tidak tersedia, fallback minimal');
  ySection = ensurePage(doc, 50);
}

/* ============================================================
   IST — [MOVED to pdf/02-ist.js]
   ============================================================ */
if (window.PDF_SECTIONS && typeof window.PDF_SECTIONS.ist === 'function') {
  ySection = window.PDF_SECTIONS.ist(doc, pageWidth, ySection, appState);
} else {
  console.warn('[PDF] PDF_SECTIONS.ist tidak tersedia');
}

/* ============================================================
   KRAEPLIN — [MOVED to pdf/03-kraeplin.js]
   ============================================================ */
if (window.PDF_SECTIONS && typeof window.PDF_SECTIONS.kraeplin === 'function') {
  ySection = window.PDF_SECTIONS.kraeplin(doc, pageWidth, ySection, appState);
} else {
  console.warn('[PDF] PDF_SECTIONS.kraeplin tidak tersedia');
}

/* ============================================================
   DISC — [MOVED to pdf/04-disc.js]
   ============================================================ */
if (window.PDF_SECTIONS && typeof window.PDF_SECTIONS.disc === 'function') {
  ySection = await window.PDF_SECTIONS.disc(doc, pageWidth, ySection, appState);
} else {
  console.warn('[PDF] PDF_SECTIONS.disc tidak tersedia');
}

/* ============================================================
   PAPI — [MOVED to pdf/04-papi.js]
   ============================================================ */
if (window.PDF_SECTIONS && typeof window.PDF_SECTIONS.papi === 'function') {
  ySection = await window.PDF_SECTIONS.papi(doc, pageWidth, ySection, appState);
} else {
  console.warn('[PDF] PDF_SECTIONS.papi tidak tersedia');
}

/* ============================================================
   BIGFIVE — [MOVED to pdf/04-bigfive.js]
   ============================================================ */
if (window.PDF_SECTIONS && typeof window.PDF_SECTIONS.bigfive === 'function') {
  ySection = await window.PDF_SECTIONS.bigfive(doc, pageWidth, ySection, appState);
} else {
  console.warn('[PDF] PDF_SECTIONS.bigfive tidak tersedia');
}

/* ============================================================
   GRAFIS — [MOVED to pdf/04-grafis.js]
   ============================================================ */
if (window.PDF_SECTIONS && typeof window.PDF_SECTIONS.grafis === 'function') {
  ySection = await window.PDF_SECTIONS.grafis(doc, pageWidth, ySection, appState);
} else {
  console.warn('[PDF] PDF_SECTIONS.grafis tidak tersedia');
}

/* ============================================================
   EXCEL — [MOVED to pdf/04-excel.js]
   ============================================================ */
if (window.PDF_SECTIONS && typeof window.PDF_SECTIONS.excel === 'function') {
  ySection = await window.PDF_SECTIONS.excel(doc, pageWidth, ySection, appState);
} else {
  console.warn('[PDF] PDF_SECTIONS.excel tidak tersedia');
}

/* ============================================================
   TYPING — [MOVED to pdf/04-typing.js]
   ============================================================ */
if (window.PDF_SECTIONS && typeof window.PDF_SECTIONS.typing === 'function') {
  ySection = await window.PDF_SECTIONS.typing(doc, pageWidth, ySection, appState);
} else {
  console.warn('[PDF] PDF_SECTIONS.typing tidak tersedia');
}

/* ============================================================
       FOOTER TANDA TANGAN
       ============================================================ */
    let footerY = 285;
    if (ySection > 245) { doc.addPage(); footerY = 285; }
  
    const footerX = pageWidth - 20;
  
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('TESTER,', footerX, footerY - 36, { align: "right" });
  
    doc.setFont(undefined, 'normal');
    doc.text('Deni Pragas Septian Pratama', footerX, footerY - 12, { align: "right" });
    doc.text('Human Capital Recruitment Staff', footerX, footerY - 6, { align: "right" });
    doc.text('Sugar Group Schools', footerX, footerY, { align: "right" });
  
    /* ============================================================
       WATERMARK
       ============================================================ */
    addDiagonalWatermark(doc, 'SANGAT RAHASIA', -35, {
      centerYOffset: 60,
      centerXOffset: 15,
      color: [200, 20, 20],
      opacity: 0.10,
      blur: true,
      blurOpacity: 0.05,
      blurPasses: 4,
      blurRadius: 0.8
    });
  
     /* ============================================================
       RETURN BLOB (bukan simpan ke file)
       ============================================================ */
    let namaFile = ((typeof id === 'object' && id && id.name) ? id.name : "Peserta")
      .replace(/[^a-zA-Z0-9]/g, "-") + "-Psikotes-SGSchools.pdf";

    const blob = doc.output('blob');

    return {
      blob: blob,
      filename: namaFile,
      size: blob.size,
      password: _pdfPassword  // ← TAMBAHAN
    };
  }
  
  /* ============================================================
     FUNGSI YANG PERLU DI-LOAD SEBELUM generatePDF() DIPANGGIL
     ============================================================
     Beberapa fungsi berikut WAJIB ADA (bisa di file terpisah):
     
     📁 js/data/ist-norms.js:
        - IST_NORMS, SW_TABLE, SW_BANDS_RAW, SW_GE_EXT, SW_CODES
        - TOTAL_SW_BY_AGE, buildSWSteps, pickTotalSWAgeBand
        - getTotalSWFromRW, IQ_BY_SW, getIQFromSW, iqCategory
        - IST_DESCRIPTIONS, GE_SCORING, RA_KEYS, ZR_KEYS
     
     📁 js/data/bigfive-position-analysis.js:
        - bigFivePositionAnalysis (objek besar)
        - getBigFiveSuitabilityLabel
        - analisaBigFiveSuitability
        - koreksiBigFive
     
     📁 js/data/disc-implications.js:
        - getImplication (objek besar)
        - getCompatibilityReason
        - getStrengthArea, getDevelopmentArea
        - formatBulletPoints
     
     📁 js/tests/ist.js:
        - applyAllKeysIntoQuestions
        - computeISTPerSubtestScores
        - renderISTSummaryToPDF
        - renderISTScoresToPDF
        - renderISTIQToPDF
        - renderISTDescriptionsToPDF
        - renderISTThinkingDimensionToPDF
        - renderISTSWChartToPDF
        - renderISTMWAnalysisToPDF
        - computeDominasi
        - drawSWLineChart
        - letterCategoryFromSw
        - computeGuruFitLetter, computeITStaffFitLetter
        - buildGuruReasons, buildITStaffReasons
        - swCategory5
        - getAgeYearsForNorms
        - clampMin21
        - pctToSWStanine, convertRWtoSW, stanineToSWx
        - defaultMaxByCode
        - getSubtestCode
        - normText
        - rwToIndex0_20, rwToSW_ViaTable
     
     📁 js/tests/kraeplin.js:
        - renderKraeplinChartToPDF
        - analyzeKraeplin
        - generateKraeplinReport
        - kraeplinKategori
     
     📁 js/tests/disc.js:
        - countDISC, analisa2DominanDISC, drawDISCClassic
        - getPixelY, getMidline, getDominantByMidline
        - getFullDISCAnalysisHTML, stripHTML
     
     📁 js/data/papi-kamus.js:
        - kamusPAPI, mappingPAPI
        - getInterpretasiPAPI
        - analisisKecocokanPAPI, analisisKecocokanPAPIDetail
        - generateAnalisaPAPI
        - skorPAPIArahKerja, skorPAPIKepemimpinan, skorPAPIAktivitas,
          skorPAPIPergaulan, skorPAPIGayaKerja, skorPAPISifat, skorPAPIKetaatan
     
     📁 js/data/disc-roles.js:
        - DISC_ROLES_MAP
     ============================================================ */
  /* ============================================================
   GENERATE PDF BLOB — return Blob + metadata
   Dipakai oleh 07-download.js untuk upload ke Google Drive
   ============================================================ */
async function generatePDFBlob() {
  return await generatePDF();
}
window.generatePDFBlob = generatePDFBlob;

console.log('[PDF] ✓ generatePDFBlob ready');
  console.log('[CORE-PDF] ✓ Loaded');
