#!/usr/bin/env node
/* ============================================================
   scripts/split-section.js
   ------------------------------------------------------------
   GENERIC splitter untuk pdf.js sections.
   
   Usage:
     node scripts/split-section.js --name <n> --start <A> --end <B> [--dry-run]
     node scripts/split-section.js --revert --name <n>
   
   Contoh:
     node scripts/split-section.js --name grafis --start GRAFIS --end EXCEL --dry-run
     node scripts/split-section.js --name grafis --start GRAFIS --end EXCEL
     node scripts/split-section.js --revert --name grafis
   ============================================================ */

'use strict';
const fs = require('fs');
const path = require('path');

/* ---------- PARSE ARGS ---------- */
function getArg(name) {
  const i = process.argv.indexOf('--' + name);
  return i !== -1 ? process.argv[i + 1] : null;
}

const DRY_RUN  = process.argv.includes('--dry-run');
const REVERT   = process.argv.includes('--revert');
const NAME     = getArg('name');
const START    = getArg('start');
const END      = getArg('end');

if (!NAME) {
  console.error('❌ --name wajib. Contoh: --name grafis');
  process.exit(1);
}

const ROOT      = path.resolve(__dirname, '..');
const PDF_JS    = path.join(ROOT, 'js', 'core', 'pdf.js');
const OUT_DIR   = path.join(ROOT, 'js', 'core', 'pdf');
const OUT_FILE  = path.join(OUT_DIR, '04-' + NAME + '.js');
const HTML      = path.join(ROOT, 'index.html');

/* ---------- REVERT ---------- */
if (REVERT) {
  let n = 0;
  for (const f of [PDF_JS, HTML]) {
    const bak = f + '.bak-' + NAME;
    if (fs.existsSync(bak)) {
      fs.writeFileSync(f, fs.readFileSync(bak, 'utf8'));
      fs.unlinkSync(bak);
      console.log('✅ Reverted: ' + path.relative(ROOT, f));
      n++;
    }
  }
  if (fs.existsSync(OUT_FILE)) {
    fs.unlinkSync(OUT_FILE);
    console.log('✅ Deleted: ' + path.relative(ROOT, OUT_FILE));
  }
  console.log('\nReverted ' + n + ' file(s).');
  process.exit(0);
}

if (!START || !END) {
  console.error('❌ --start dan --end wajib.');
  console.error('   Contoh: --start GRAFIS --end EXCEL');
  process.exit(1);
}

/* ---------- MARKER FINDER ---------- */
function findMarker(text, name) {
  // Escape regex special chars di name
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp('/\\*[ \\t]*={3,}[ \\t]*\\r?\\n[ \\t]*' + escaped + '[ \\t]*\\r?\\n[ \\t]*={3,}[ \\t]*\\*/');
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
console.log('  SPLIT SECTION: ' + NAME.toUpperCase());
console.log('====================================================');
console.log('  Mode: ' + (DRY_RUN ? 'DRY-RUN (preview)' : 'LIVE'));
console.log('  Start marker: ' + START);
console.log('  End marker:   ' + END);
console.log('');

const startIdx = findMarker(src, START);
const endIdx   = findMarker(src, END);

if (startIdx === -1) {
  console.error('❌ Marker START tidak ditemukan: ' + START);
  process.exit(1);
}
if (endIdx === -1 || endIdx <= startIdx) {
  console.error('❌ Marker END tidak ditemukan setelah START: ' + END);
  process.exit(1);
}

const sectionText = src.slice(startIdx, endIdx);

console.log('  📍 Section range: ' + startIdx + ' → ' + endIdx);
console.log('     Size: ' + sectionText.length + ' bytes / ~' + sectionText.split('\n').length + ' lines');
console.log('');

/* Verify basic */
if (sectionText.length < 100) {
  console.error('❌ Section terlalu kecil. Mungkin salah marker.');
  process.exit(1);
}

/* ---------- PREPARE ---------- */
let innerCode = sectionText;

// Auto-strip `let ySection = ...;`
innerCode = innerCode.replace(/^\s*let\s+ySection\s*=\s*[^;\n]+;/gm, '/* [ySection from wrapper] */');

/* ---------- BUILD SECTION FILE ---------- */
const sectionContent = `/* =========================================================
   js/core/pdf/04-${NAME}.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — ${new Date().toISOString().slice(0, 10)}
   Section: ${NAME}
   ========================================================= */

window.PDF_SECTIONS = window.PDF_SECTIONS || {};

window.PDF_SECTIONS.${NAME} = async function(doc, pageWidth, startY, appState) {
  let ySection = startY;

${innerCode.split('\n').map(l => '  ' + l).join('\n')}

  return ySection;
};

console.log('[PDF-${NAME.toUpperCase()}] ✓ Loaded');
`;

/* ---------- BUILD pdf.js BARU ---------- */
const replacement = `/* ============================================================
   ${NAME.toUpperCase()} — [MOVED to pdf/04-${NAME}.js]
   ============================================================ */
if (window.PDF_SECTIONS && typeof window.PDF_SECTIONS.${NAME} === 'function') {
  ySection = await window.PDF_SECTIONS.${NAME}(doc, pageWidth, ySection, appState);
} else {
  console.warn('[PDF] PDF_SECTIONS.${NAME} tidak tersedia');
}

`;

const newSrc = src.slice(0, startIdx) + replacement + src.slice(endIdx);

/* ---------- VERIFY SYNTAX ---------- */
try {
  new Function(sectionContent);
  console.log('  ✅ Syntax 04-' + NAME + '.js: OK');
} catch (e) {
  console.error('\n  ❌ Syntax error di 04-' + NAME + '.js: ' + e.message);
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
  console.log('   node scripts/split-section.js --name ' + NAME + ' --start "' + START + '" --end "' + END + '"');
  process.exit(0);
}

/* ---------- WRITE ---------- */
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

fs.writeFileSync(PDF_JS + '.bak-' + NAME, original, 'utf8');
fs.writeFileSync(OUT_FILE, sectionContent, 'utf8');
fs.writeFileSync(PDF_JS, newSrc, 'utf8');

let html = fs.readFileSync(HTML, 'utf8');
const htmlMarker = 'pdf/04-' + NAME + '.js';
if (!html.includes(htmlMarker)) {
  fs.writeFileSync(HTML + '.bak-' + NAME, html, 'utf8');
  html = html.replace(
    /(\s*)(<script src="\.\/js\/core\/pdf\.js" defer><\/script>)/,
    '\n$1<!-- PDF SECTION: ' + NAME.toUpperCase() + ' -->\n$1<script src="./js/core/pdf/04-' + NAME + '.js" defer></script>\n$1$2'
  );
  fs.writeFileSync(HTML, html, 'utf8');
  console.log('  ✅ index.html updated');
}

console.log('');
console.log('💾 Selesai!');
console.log('   - js/core/pdf/04-' + NAME + '.js  (' + (sectionContent.length / 1024).toFixed(1) + ' KB)');
console.log('   - js/core/pdf.js updated');
console.log('   - index.html updated');
console.log('');
console.log('   Revert: node scripts/split-section.js --revert --name ' + NAME);