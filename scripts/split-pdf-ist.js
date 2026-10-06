#!/usr/bin/env node
/* ============================================================
   scripts/split-pdf-ist.js
   ------------------------------------------------------------
   Extract section IST dari pdf.js → pdf/02-ist.js
   
   Robustness:
   - Handle CRLF / LF
   - Handle duplicate `let ySection`
   - Auto-add `window.PDF_SECTIONS = window.PDF_SECTIONS || {};`
   - Verify syntax sebelum write
   ============================================================ */

'use strict';
const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const REVERT  = process.argv.includes('--revert');

const ROOT      = path.resolve(__dirname, '..');
const PDF_JS    = path.join(ROOT, 'js', 'core', 'pdf.js');
const OUT_DIR   = path.join(ROOT, 'js', 'core', 'pdf');
const OUT_FILE  = path.join(OUT_DIR, '02-ist.js');
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
    console.log('✅ Deleted: js/core/pdf/02-ist.js');
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
console.log('  SPLIT PDF SECTION — IST');
console.log('====================================================');
console.log('  Mode: ' + (DRY_RUN ? 'DRY-RUN (preview)' : 'LIVE'));
console.log('');

const startIdx = findMarker(src, 'IST');
const endIdx   = findMarker(src, 'KRAEPLIN');

if (startIdx === -1) {
  console.error('❌ Marker IST tidak ditemukan.');
  process.exit(1);
}
if (endIdx === -1 || endIdx <= startIdx) {
  console.error('❌ Marker KRAEPLIN tidak ditemukan setelah IST.');
  process.exit(1);
}

const sectionText = src.slice(startIdx, endIdx);

console.log('  📍 Section range: ' + startIdx + ' → ' + endIdx);
console.log('     Size: ' + sectionText.length + ' bytes / ~' + sectionText.split('\n').length + ' lines');
console.log('');

/* Verify isi section */
const checks = [
  ['JAWABAN TES IST', sectionText.includes('JAWABAN TES IST')],
  ['applyAllKeysIntoQuestions', sectionText.includes('applyAllKeysIntoQuestions')],
  ['_formatSubtestLine', sectionText.includes('_formatSubtestLine')],
  ['renderISTSummaryToPDF', sectionText.includes('renderISTSummaryToPDF')],
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
// Cek apakah section mulai dengan `let ySection = ...`
// Kalau iya, kita ganti jadi dari parameter startY
let innerCode = sectionText;

// Kalau ada "let ySection = <number>;" di awal section, replace jadi "let ySection = startY;"
innerCode = innerCode.replace(
  /let\s+ySection\s*=\s*\d+\s*;/,
  'let ySection = startY;'
);

// Kalau tidak ada, tambahkan di awal
if (!/let\s+ySection\s*=/.test(innerCode)) {
  innerCode = '  let ySection = startY;\n' + innerCode;
}

/* ---------- BUILD 02-ist.js ---------- */
const istContent = `/* =========================================================
   js/core/pdf/02-ist.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — ${new Date().toISOString().slice(0, 10)}
   
   Render: JAWABAN TES IST + Ringkasan + Grafik
   Call:   window.PDF_SECTIONS.ist(doc, pageWidth, startY, appState)
   Return: ySection
   ========================================================= */

window.PDF_SECTIONS = window.PDF_SECTIONS || {};

window.PDF_SECTIONS.ist = function(doc, pageWidth, startY, appState) {
${innerCode.split('\n').map(l => '  ' + l).join('\n')}
  return ySection;
};

console.log('[PDF-IST] ✓ Loaded');
`;

/* ---------- BUILD pdf.js BARU ---------- */
const replacement = `/* ============================================================
   IST — [MOVED to pdf/02-ist.js]
   ============================================================ */
if (window.PDF_SECTIONS && typeof window.PDF_SECTIONS.ist === 'function') {
  ySection = window.PDF_SECTIONS.ist(doc, pageWidth, ySection, appState);
} else {
  console.warn('[PDF] PDF_SECTIONS.ist tidak tersedia');
}

`;

const newSrc = src.slice(0, startIdx) + replacement + src.slice(endIdx);

/* ---------- VERIFY SYNTAX ---------- */
try {
  new Function(istContent);
  console.log('\n  ✅ Syntax 02-ist.js: OK');
} catch (e) {
  console.error('\n  ❌ Syntax error di 02-ist.js: ' + e.message);
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
  console.log('   node scripts/split-pdf-ist.js');
  process.exit(0);
}

/* ---------- WRITE ---------- */
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

fs.writeFileSync(PDF_JS + '.bak', original, 'utf8');
fs.writeFileSync(OUT_FILE, istContent, 'utf8');
fs.writeFileSync(PDF_JS, newSrc, 'utf8');

let html = fs.readFileSync(HTML, 'utf8');
if (!html.includes('pdf/02-ist.js')) {
  fs.writeFileSync(HTML + '.bak', html, 'utf8');
  html = html.replace(
    /(\s*)(<script src="\.\/js\/core\/pdf\.js" defer><\/script>)/,
    '\n$1<!-- PDF SECTION: IST -->\n$1<script src="./js/core/pdf/02-ist.js" defer></script>\n$1$2'
  );
  fs.writeFileSync(HTML, html, 'utf8');
  console.log('  ✅ index.html updated');
}

console.log('');
console.log('💾 Selesai!');
console.log('   - js/core/pdf/02-ist.js  (' + (istContent.length / 1024).toFixed(1) + ' KB)');
console.log('   - js/core/pdf.js updated');
console.log('   - index.html updated');
console.log('');
console.log('   Revert: node scripts/split-pdf-ist.js --revert');