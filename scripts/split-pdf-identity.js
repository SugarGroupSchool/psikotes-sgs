#!/usr/bin/env node
/* ============================================================
   scripts/split-pdf-identity.js
   ------------------------------------------------------------
   Extract section IDENTITAS dari pdf.js ke pdf/01-identity.js
   
   Pendekatan MARKER-BASED:
   - Cari komentar /* === IDENTITAS === *​/ sampai /* === IST === *​/
   - Extract sebagai function
   - Replace dengan function call
   ============================================================ */

'use strict';
const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const REVERT  = process.argv.includes('--revert');

const ROOT      = path.resolve(__dirname, '..');
const PDF_JS    = path.join(ROOT, 'js', 'core', 'pdf.js');
const OUT_DIR   = path.join(ROOT, 'js', 'core', 'pdf');
const OUT_FILE  = path.join(OUT_DIR, '01-identity.js');
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
    console.log('✅ Deleted: js/core/pdf/01-identity.js');
  }
  console.log('\nReverted ' + n + ' file(s).');
  process.exit(0);
}

/* ---------- MARKER FINDER ---------- */
function findMarker(text, name) {
  // \r?\n handles both CRLF (Windows) and LF (Unix)
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
console.log('  SPLIT PDF SECTION — IDENTITY');
console.log('====================================================');
console.log('  Mode: ' + (DRY_RUN ? 'DRY-RUN (preview)' : 'LIVE'));
console.log('');

const startIdx = findMarker(src, 'IDENTITAS');
const endIdx   = findMarker(src, 'IST');

if (startIdx === -1) {
  console.error('❌ Marker IDENTITAS tidak ditemukan di pdf.js.');
  process.exit(1);
}
if (endIdx === -1 || endIdx <= startIdx) {
  console.error('❌ Marker IST tidak ditemukan setelah IDENTITAS.');
  process.exit(1);
}

const sectionText = src.slice(startIdx, endIdx);

console.log('  📍 Section range: ' + startIdx + ' → ' + endIdx);
console.log('     Size: ' + sectionText.length + ' bytes / ~' + sectionText.split('\n').length + ' lines');
console.log('');

/* Verify isi section */
const checks = [
  ['IDENTITAS PESERTA', sectionText.includes('IDENTITAS PESERTA')],
  ['col1_x', sectionText.includes('col1_x')],
  ['drawLabelValueFix', sectionText.includes('drawLabelValueFix')],
  ['alumniSGS', sectionText.includes('alumniSGS')],
  ['ySection = ensurePage', sectionText.includes('ySection = ensurePage')]
];
checks.forEach(([name, ok]) => {
  console.log('  ' + (ok ? '✅' : '⚠️ ') + ' ' + name);
});

if (!checks.every(c => c[1])) {
  console.error('\n❌ Verifikasi gagal. Tidak melanjutkan — file tidak diubah.');
  process.exit(1);
}

/* ---------- BUILD 01-identity.js ---------- */
const identityContent = `/* =========================================================
   js/core/pdf/01-identity.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — ${new Date().toISOString().slice(0, 10)}
   
   Render: IDENTITAS PESERTA + Alumni SGS
   Call:   window.PDF_SECTIONS.identity(doc, pageWidth, startY, appState)
   Return: ySection (untuk dilanjutkan section berikutnya)
   ========================================================= */

window.PDF_SECTIONS.identity = function(doc, pageWidth, startY, appState) {
${sectionText.replace(/let\s+y\s*=\s*43;/, 'let y = startY;').split('\n').map(l => '  ' + l).join('\n')}
  return ySection;
};

console.log('[PDF-IDENTITY] ✓ Loaded');
`;

/* ---------- BUILD pdf.js baru ---------- */
const replacement = `/* ============================================================
   IDENTITAS — [MOVED to pdf/01-identity.js]
   ============================================================ */
let ySection = 43;
if (window.PDF_SECTIONS && typeof window.PDF_SECTIONS.identity === 'function') {
  ySection = window.PDF_SECTIONS.identity(doc, pageWidth, ySection, appState);
} else {
  console.warn('[PDF] PDF_SECTIONS.identity tidak tersedia, fallback minimal');
  ySection = ensurePage(doc, 50);
}

`;

const newSrc = src.slice(0, startIdx) + replacement + src.slice(endIdx);

/* ---------- VERIFY SYNTAX ---------- */
try {
  new Function(identityContent);
  console.log('\n  ✅ Syntax 01-identity.js: OK');
} catch (e) {
  console.error('\n  ❌ Syntax error di 01-identity.js: ' + e.message);
  console.error('     Tidak melanjutkan.');
  process.exit(1);
}

try {
  new Function(newSrc);
  console.log('  ✅ Syntax pdf.js: OK');
} catch (e) {
  console.error('  ❌ Syntax error di pdf.js baru: ' + e.message);
  console.error('     Tidak melanjutkan.');
  process.exit(1);
}

console.log('');

/* ---------- DRY RUN ---------- */
if (DRY_RUN) {
  console.log('💡 Preview selesai. Untuk apply:');
  console.log('   node scripts/split-pdf-identity.js');
  process.exit(0);
}

/* ---------- WRITE ---------- */
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

fs.writeFileSync(PDF_JS + '.bak', original, 'utf8');
fs.writeFileSync(OUT_FILE, identityContent, 'utf8');
fs.writeFileSync(PDF_JS, newSrc, 'utf8');

let html = fs.readFileSync(HTML, 'utf8');
if (!html.includes('pdf/01-identity.js')) {
  fs.writeFileSync(HTML + '.bak', html, 'utf8');
  html = html.replace(
    /(\s*)(<script src="\.\/js\/core\/pdf\.js" defer><\/script>)/,
    '\n$1<!-- PDF SECTION: IDENTITY -->\n$1<script src="./js/core/pdf/01-identity.js" defer></script>\n$1$2'
  );
  fs.writeFileSync(HTML, html, 'utf8');
  console.log('  ✅ index.html updated');
}

console.log('');
console.log('💾 Selesai!');
console.log('   - js/core/pdf/01-identity.js  (' + (identityContent.length / 1024).toFixed(1) + ' KB)');
console.log('   - js/core/pdf.js updated');
console.log('   - index.html updated');
console.log('');
console.log('   Revert: node scripts/split-pdf-identity.js --revert');