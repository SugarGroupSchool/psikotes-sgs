#!/usr/bin/env node
/* ============================================================
   scripts/split-pdf-kraeplin.js
   ------------------------------------------------------------
   Extract section KRAEPLIN dari pdf.js → pdf/03-kraeplin.js
   
   Robustness v3 (perbaikan dari Step 2 & 3):
   - Handle CRLF / LF
   - Auto-strip "let ySection = ...;" dari section
   - Auto-add "let ySection = startY;" di wrapper
   - Verify markers + syntax sebelum write
   ============================================================ */

'use strict';
const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const REVERT  = process.argv.includes('--revert');

const ROOT      = path.resolve(__dirname, '..');
const PDF_JS    = path.join(ROOT, 'js', 'core', 'pdf.js');
const OUT_DIR   = path.join(ROOT, 'js', 'core', 'pdf');
const OUT_FILE  = path.join(OUT_DIR, '03-kraeplin.js');
const HTML      = path.join(ROOT, 'index.html');

/* ---------- REVERT ---------- */
if (REVERT) {
  let n = 0;
  for (const f of [PDF_JS, HTML]) {
    const bak = f + '.bak';
    if (fs.existsSync(bak)) {
      fs.writeFileSync(f, fs.readFileSync(bak, 'utf8'));
      fs.unlinkSync(bak);
      console.log('✅ Reverted: ' + path.relative(ROOT, f));
      n++;
    }
  }
  if (fs.existsSync(OUT_FILE)) {
    fs.unlinkSync(OUT_FILE);
    console.log('✅ Deleted: js/core/pdf/03-kraeplin.js');
  }
  console.log('\nReverted ' + n + ' file(s).');
  process.exit(0);
}

/* ---------- MARKER FINDER (CRLF-safe) ---------- */
function findMarker(text, name) {
  const rx = new RegExp('/\\*[ \\t]*={3,}[ \\t]*\\r?\\n[ \\t]*' + name + '[ \\t]*\\r?\\n[ \\t]*={3,}[ \\t]*\\*/');
  const m = rx.exec(text);
  return m ? m.index : -1;
}

/* ---------- MAIN ---------- */
if (!fs.existsSync(PDF_JS)) {
  console.error('❌ js/core/pdf.js tidak ditemukan.');
  process.exit(1);
}

const src = fs.readFileSync(PDF_JS, 'utf8');
const original = src;

console.log('====================================================');
console.log('  SPLIT PDF SECTION — KRAEPLIN');
console.log('====================================================');
console.log('  Mode: ' + (DRY_RUN ? 'DRY-RUN (preview)' : 'LIVE'));
console.log('');

const startIdx = findMarker(src, 'KRAEPLIN');
const endIdx   = findMarker(src, 'DISC');

if (startIdx === -1) {
  console.error('❌ Marker KRAEPLIN tidak ditemukan. Mungkin sudah di-split sebelumnya.');
  process.exit(1);
}
if (endIdx === -1 || endIdx <= startIdx) {
  console.error('❌ Marker DISC tidak ditemukan setelah KRAEPLIN.');
  process.exit(1);
}

const sectionText = src.slice(startIdx, endIdx);

console.log('  📍 Section range: ' + startIdx + ' → ' + endIdx);
console.log('     Size: ' + sectionText.length + ' bytes / ~' + sectionText.split('\n').length + ' lines');
console.log('');

/* Verify isi section */
const checks = [
  ['HASIL TES KRAEPLIN', sectionText.includes('HASIL TES KRAEPLIN')],
  ['PANKER', sectionText.includes('PANKER')],
  ['TIANKER', sectionText.includes('TIANKER')],
  ['renderKraeplinChartToPDF', sectionText.includes('renderKraeplinChartToPDF')],
  ['ySection', sectionText.includes('ySection')]
];
checks.forEach(([name, ok]) => {
  console.log('  ' + (ok ? '✅' : '⚠️ ') + ' ' + name);
});

if (!checks.every(c => c[1])) {
  console.error('\n❌ Verifikasi gagal. Tidak melanjutkan.');
  process.exit(1);
}

/* ---------- PREPARE SECTION CODE ---------- */
let innerCode = sectionText;

// Auto-strip `let ySection = ...;` dari section (biar tidak duplicate)
// Format: hanya strip kalau di awal baris
innerCode = innerCode.replace(/^\s*let\s+ySection\s*=\s*[^;\n]+;/gm, '/* [removed ySection declaration — di-handle wrapper] */');

/* ---------- BUILD 03-kraeplin.js ---------- */
const kraeplinContent = `/* =========================================================
   js/core/pdf/03-kraeplin.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — ${new Date().toISOString().slice(0, 10)}
   
   Render: HASIL TES KRAEPLIN + analisis + grafik
   Call:   window.PDF_SECTIONS.kraeplin(doc, pageWidth, startY, appState)
   Return: ySection
   ========================================================= */

window.PDF_SECTIONS = window.PDF_SECTIONS || {};

window.PDF_SECTIONS.kraeplin = function(doc, pageWidth, startY, appState) {
  let ySection = startY;

${innerCode.split('\n').map(l => '  ' + l).join('\n')}

  return ySection;
};

console.log('[PDF-KRAEPLIN] ✓ Loaded');
`;

/* ---------- BUILD pdf.js BARU ---------- */
const replacement = `/* ============================================================
   KRAEPLIN — [MOVED to pdf/03-kraeplin.js]
   ============================================================ */
if (window.PDF_SECTIONS && typeof window.PDF_SECTIONS.kraeplin === 'function') {
  ySection = window.PDF_SECTIONS.kraeplin(doc, pageWidth, ySection, appState);
} else {
  console.warn('[PDF] PDF_SECTIONS.kraeplin tidak tersedia');
}

`;

const newSrc = src.slice(0, startIdx) + replacement + src.slice(endIdx);

/* ---------- VERIFY SYNTAX ---------- */
try {
  new Function(kraeplinContent);
  console.log('\n  ✅ Syntax 03-kraeplin.js: OK');
} catch (e) {
  console.error('\n  ❌ Syntax error di 03-kraeplin.js: ' + e.message);
  process.exit(1);
}

try {
  new Function(newSrc);
  console.log('  ✅ Syntax pdf.js: OK');
} catch (e) {
  console.error('  ❌ Syntax error di pdf.js baru: ' + e.message);
  process.exit(1);
}

console.log('');

/* ---------- DRY RUN ---------- */
if (DRY_RUN) {
  console.log('💡 Preview selesai. Untuk apply:');
  console.log('   node scripts/split-pdf-kraeplin.js');
  process.exit(0);
}

/* ---------- WRITE ---------- */
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

fs.writeFileSync(PDF_JS + '.bak', original, 'utf8');
fs.writeFileSync(OUT_FILE, kraeplinContent, 'utf8');
fs.writeFileSync(PDF_JS, newSrc, 'utf8');

let html = fs.readFileSync(HTML, 'utf8');
if (!html.includes('pdf/03-kraeplin.js')) {
  fs.writeFileSync(HTML + '.bak', html, 'utf8');
  html = html.replace(
    /(\s*)(<script src="\.\/js\/core\/pdf\.js" defer><\/script>)/,
    '\n$1<!-- PDF SECTION: KRAEPLIN -->\n$1<script src="./js/core/pdf/03-kraeplin.js" defer></script>\n$1$2'
  );
  fs.writeFileSync(HTML, html, 'utf8');
  console.log('  ✅ index.html updated');
}

console.log('');
console.log('💾 Selesai!');
console.log('   - js/core/pdf/03-kraeplin.js  (' + (kraeplinContent.length / 1024).toFixed(1) + ' KB)');
console.log('   - js/core/pdf.js updated');
console.log('   - index.html updated');
console.log('');
console.log('   Revert: node scripts/split-pdf-kraeplin.js --revert');