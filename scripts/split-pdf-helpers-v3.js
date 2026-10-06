#!/usr/bin/env node
/* ============================================================
   scripts/split-pdf-helpers-v3.js
   ------------------------------------------------------------
   Split pdf.js — PENDEKATAN BARU (simple & aman)
   
   Prinsip:
   - Semua helper ada di AWAL file sebelum "async function generatePDF"
   - Cukup potong 1 blok di titik itu. Tidak ada parsing kompleks.
   - Verify sebelum write. Kalau verify gagal, tidak ubah apapun.
   ============================================================ */

'use strict';
const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const REVERT  = process.argv.includes('--revert');

const ROOT     = path.resolve(__dirname, '..');
const PDF_JS   = path.join(ROOT, 'js', 'core', 'pdf.js');
const OUT_DIR  = path.join(ROOT, 'js', 'core', 'pdf');
const OUT_FILE = path.join(OUT_DIR, '00-helpers.js');
const HTML     = path.join(ROOT, 'index.html');

/* ============================================================
   REVERT
   ============================================================ */
if (REVERT) {
  let count = 0;
  for (const f of [PDF_JS, HTML]) {
    const bak = f + '.bak';
    if (fs.existsSync(bak)) {
      fs.writeFileSync(f, fs.readFileSync(bak, 'utf8'));
      fs.unlinkSync(bak);
      console.log('✅ Reverted: ' + path.relative(ROOT, f));
      count++;
    }
  }
  if (fs.existsSync(OUT_FILE)) {
    fs.unlinkSync(OUT_FILE);
    console.log('✅ Deleted: js/core/pdf/00-helpers.js');
  }
  console.log('\nReverted ' + count + ' file(s).');
  process.exit(0);
}

/* ============================================================
   MAIN
   ============================================================ */
if (!fs.existsSync(PDF_JS)) {
  console.error('❌ js/core/pdf.js tidak ditemukan.');
  process.exit(1);
}

const src = fs.readFileSync(PDF_JS, 'utf8');
const original = src;

console.log('====================================================');
console.log('  SPLIT PDF HELPERS v3 — Simple block split');
console.log('====================================================');
console.log('  Mode: ' + (DRY_RUN ? 'DRY-RUN (preview)' : 'LIVE'));
console.log('');

/* ------------------------------------------------------------
   1. Cari titik potong
   ------------------------------------------------------------ */
const marker = 'async function generatePDF';
const idx = src.indexOf(marker);

if (idx === -1) {
  console.error('❌ Tidak menemukan "' + marker + '" di pdf.js');
  console.error('   Pastikan file pdf.js utuh.');
  process.exit(1);
}

console.log('  📍 Titik potong: index ' + idx + ' (line ~' + src.slice(0, idx).split('\n').length + ')');
console.log('');

const helperBlock = src.slice(0, idx);
const pdfBody = src.slice(idx);

/* ------------------------------------------------------------
   2. Verify helper block berisi helper yang diharapkan
   ------------------------------------------------------------ */
const EXPECTED_HELPERS = [
  'setCharSpaceSafe', 'normalizeSpaces', 'sanitizePDFText', 'safeStr',
  'textSafe', 'encodeScoreCode', 'decodeScoreCode', 'toNumFlexible',
  'ensurePage', 'ensureSpace', 'setTypewriter', 'blokHeading',
  'drawLabelValueFix', 'printLineWrap', 'addDiagonalWatermark',
  '__compressImageForPDF'
];

const missing = EXPECTED_HELPERS.filter(name => {
  const rx = new RegExp('function\\s+' + name + '\\b');
  return !rx.test(helperBlock);
});

if (missing.length > 0) {
  console.error('❌ Helper berikut tidak ditemukan di block sebelum generatePDF:');
  missing.forEach(n => console.error('   - ' + n));
  console.error('');
  console.error('   Tidak melanjutkan — file tidak diubah.');
  process.exit(1);
}
console.log('  ✅ Semua ' + EXPECTED_HELPERS.length + ' helper ada di block');

/* ------------------------------------------------------------
   3. Verify: Y_MAX & Y_PB ada di block
   ------------------------------------------------------------ */
const hasYMax = /const\s+Y_MAX\s*=\s*280/.test(helperBlock);
const hasYPB  = /const\s+Y_PB\s*=\s*265/.test(helperBlock);
console.log('  ' + (hasYMax ? '✅' : '⚠️ ') + ' const Y_MAX');
console.log('  ' + (hasYPB  ? '✅' : '⚠️ ') + ' const Y_PB');
console.log('');

/* ------------------------------------------------------------
   4. Verify: block tidak berisi fungsi lain (suspect)
   ------------------------------------------------------------ */
const fnRegex = /(?:^|\n)\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g;
const allFns = [...helperBlock.matchAll(fnRegex)].map(m => m[1]);
const uniqueFns = [...new Set(allFns)];
const extras = uniqueFns.filter(f => !EXPECTED_HELPERS.includes(f));

if (extras.length > 0) {
  console.log('  ⚠️  Fungsi tambahan ditemukan di block:');
  extras.forEach(f => console.log('     - ' + f));
  console.log('     (Akan ikut dipindah ke 00-helpers.js)');
  console.log('');
}

console.log('  Ringkasan:');
console.log('    Helper block size: ' + helperBlock.length + ' bytes');
console.log('    PDF body size:     ' + pdfBody.length + ' bytes');
console.log('');

/* ------------------------------------------------------------
   5. Build 00-helpers.js
   ------------------------------------------------------------ */
const helpersHeader = `/* =========================================================
   js/core/pdf/00-helpers.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — ${new Date().toISOString().slice(0, 10)}
   
   Semua helper tersedia sebagai:
   - Global function (backward compat)
   - window.PDF_HELPERS.<name>
   ========================================================= */

`;

const helpersFooter = `

/* ============================================================
   EXPORT ke window.PDF_HELPERS
   ============================================================ */
window.PDF_HELPERS = {
${EXPECTED_HELPERS.map(n => '  ' + n).join(',\n')},
  Y_MAX: typeof Y_MAX !== 'undefined' ? Y_MAX : 280,
  Y_PB:  typeof Y_PB  !== 'undefined' ? Y_PB  : 265
};

console.log('[PDF-HELPERS] ✓ Loaded — ' + Object.keys(window.PDF_HELPERS).length + ' items');
`;

const helpersContent = helpersHeader + helperBlock.trimEnd() + '\n' + helpersFooter;

/* ------------------------------------------------------------
   6. Build pdf.js baru (body only + header comment)
   ------------------------------------------------------------ */
const pdfHeader = `/* =========================================================
   js/core/pdf.js — PDF Generation
   ---------------------------------------------------------
   ⚡ HELPERS DIPINDAH KE: js/core/pdf/00-helpers.js
   File ini sekarang hanya berisi: generatePDF(), generatePDFBlob()
   
   Urutan load (index.html):
     1. js/core/pdf/00-helpers.js  → helpers dulu
     2. js/core/pdf.js             → main logic
   ========================================================= */

`;

const pdfContent = pdfHeader + pdfBody.trimStart();

/* ------------------------------------------------------------
   7. Syntax check (best-effort)
   ------------------------------------------------------------ */
try {
  new Function(helpersContent);
  console.log('  ✅ Syntax check 00-helpers.js: OK');
} catch (e) {
  console.error('  ❌ Syntax error di 00-helpers.js: ' + e.message);
  console.error('     Tidak melanjutkan.');
  process.exit(1);
}

try {
  new Function(pdfContent);
  console.log('  ✅ Syntax check pdf.js: OK');
} catch (e) {
  console.error('  ❌ Syntax error di pdf.js baru: ' + e.message);
  console.error('     Tidak melanjutkan.');
  process.exit(1);
}

console.log('');

/* ------------------------------------------------------------
   8. WRITE (kalau bukan dry-run)
   ------------------------------------------------------------ */
if (DRY_RUN) {
  console.log('💡 Preview selesai. Untuk apply:');
  console.log('   node scripts/split-pdf-helpers-v3.js');
  process.exit(0);
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Backup
fs.writeFileSync(PDF_JS + '.bak', original, 'utf8');

let html = fs.readFileSync(HTML, 'utf8');
const htmlOriginal = html;
fs.writeFileSync(HTML + '.bak', htmlOriginal, 'utf8');

// Write
fs.writeFileSync(OUT_FILE, helpersContent, 'utf8');
fs.writeFileSync(PDF_JS, pdfContent, 'utf8');

// Update index.html — sisipkan 00-helpers.js SEBELUM pdf.js
if (!html.includes('pdf/00-helpers.js')) {
  html = html.replace(
    /(\s*)(<script src="\.\/js\/core\/pdf\.js" defer><\/script>)/,
    '\n$1<!-- PDF HELPERS — Fase 5 -->\n$1<script src="./js/core/pdf/00-helpers.js" defer></script>\n$1$2'
  );
  fs.writeFileSync(HTML, html, 'utf8');
  console.log('  ✅ index.html updated');
}

console.log('');
console.log('💾 Selesai!');
console.log('   - js/core/pdf/00-helpers.js  (' + (helpersContent.length / 1024).toFixed(1) + ' KB)');
console.log('   - js/core/pdf.js             (' + (pdfContent.length / 1024).toFixed(1) + ' KB)');
console.log('   - index.html updated');
console.log('');
console.log('   Backup: *.bak');
console.log('   Revert: node scripts/split-pdf-helpers-v3.js --revert');