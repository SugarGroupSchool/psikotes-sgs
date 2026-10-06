#!/usr/bin/env node
/* ============================================================
   scripts/combine-css.js
   ------------------------------------------------------------
   Fase 2 — Combine CSS untuk performance
   
   - CSS #1-3 (variables + global + auth) → INLINE di <head>
   - CSS #4-14 → bundle jadi 1 file css/deferred-bundle.css
   
   Usage:
     node scripts/combine-css.js --dry-run   (preview)
     node scripts/combine-css.js             (apply)
     node scripts/combine-css.js --revert    (restore)
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const REVERT  = process.argv.includes('--revert');

const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const CSS_DIR = path.join(ROOT, 'css');

const CRITICAL = [
  '01-variables.css',
  '02-global.css',
  '03-auth.css'
];

const DEFERRED = [
  '04-identity.css',
  '05-home.css',
  '06-ist.css',
  '07-kraeplin.css',
  '08-disc.css',
  '09-papi.css',
  '10-bigfive.css',
  '11-grafis.css',
  '12-subject.css',
  '13-admin.css',
  '14-utilities.css'
];

/* ---------- REVERT ---------- */
if (REVERT) {
  const bak = HTML + '.bak';
  if (fs.existsSync(bak)) {
    fs.writeFileSync(HTML, fs.readFileSync(bak, 'utf8'));
    fs.unlinkSync(bak);
    console.log('✅ Reverted: index.html');
  }
  const bundle = path.join(CSS_DIR, 'deferred-bundle.css');
  if (fs.existsSync(bundle)) {
    fs.unlinkSync(bundle);
    console.log('✅ Deleted: css/deferred-bundle.css');
  }
  console.log('\n✅ Revert selesai.');
  process.exit(0);
}

/* ---------- BACA SEMUA CSS ---------- */
function readCss(name) {
  const p = path.join(CSS_DIR, name);
  if (!fs.existsSync(p)) {
    console.error('❌ CSS tidak ditemukan: ' + name);
    process.exit(1);
  }
  return fs.readFileSync(p, 'utf8');
}

const criticalCss = CRITICAL.map(readCss).join('\n\n/* ===== NEXT FILE ===== */\n\n');
const deferredCss = DEFERRED.map(readCss).join('\n\n/* ===== NEXT FILE ===== */\n\n');

/* ---------- BACA HTML ---------- */
let html = fs.readFileSync(HTML, 'utf8');
const originalHtml = html;

/* ---------- HAPUS SEMUA <link> CSS LAMA ---------- */
const allCssFiles = CRITICAL.concat(DEFERRED);
let removed = 0;
for (const f of allCssFiles) {
  const rx = new RegExp('\\s*<link rel="stylesheet" href="\\./css\\/' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '">', 'g');
  const before = html.length;
  html = html.replace(rx, '');
  if (html.length !== before) removed++;
}

/* ---------- INSERT INLINE CRITICAL + ASYNC DEFERRED ---------- */
const injection = `  <!-- ============================================================
       ⚡ PERFORMANCE: Critical CSS inline + deferred bundle (Fase 2)
       ============================================================ -->
  <style id="critical-css">
${criticalCss}
  </style>

  <link rel="stylesheet" href="./css/deferred-bundle.css" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="./css/deferred-bundle.css"></noscript>
`;

// Cari placeholder: setelah <noscript> google fonts, sebelum <style> inline pertama
const anchorRegex = /(<noscript><link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]+><\/noscript>\n)/;
if (anchorRegex.test(html)) {
  html = html.replace(anchorRegex, '$1\n' + injection);
} else {
  // Fallback: setelah CSS lama dihapus, cari komentar CSS
  html = html.replace(
    /(<!-- =+[\s\S]*?CSS[^\n]*\n\s*={3,}\s*-->)/,
    '$1\n' + injection
  );
}

/* ---------- WRITE ---------- */
console.log('====================================================');
console.log('  COMBINE CSS — Fase 2');
console.log('====================================================');
console.log('  Mode: ' + (DRY_RUN ? 'DRY-RUN (preview)' : 'LIVE'));
console.log('');
console.log('  Critical (inline):');
CRITICAL.forEach(f => console.log('    • ' + f));
console.log('    → ' + (criticalCss.length / 1024).toFixed(1) + ' KB inline');
console.log('');
console.log('  Deferred (bundle):');
DEFERRED.forEach(f => console.log('    • ' + f));
console.log('    → ' + (deferredCss.length / 1024).toFixed(1) + ' KB bundled');
console.log('');
console.log('  Link tags dihapus: ' + removed + '/' + allCssFiles.length);
console.log('');

if (DRY_RUN) {
  console.log('💡 Preview selesai. Untuk apply:');
  console.log('   node scripts/combine-css.js');
  process.exit(0);
}

// Backup
fs.writeFileSync(HTML + '.bak', originalHtml, 'utf8');

// Write HTML + bundle
fs.writeFileSync(HTML, html, 'utf8');
fs.writeFileSync(path.join(CSS_DIR, 'deferred-bundle.css'), deferredCss, 'utf8');

console.log('💾 Dua file diupdate:');
console.log('   - index.html (inline critical CSS)');
console.log('   - css/deferred-bundle.css (bundle deferred)');
console.log('');
console.log('   Backup: index.html.bak');
console.log('   Revert: node scripts/combine-css.js --revert');