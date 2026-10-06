#!/usr/bin/env node
/* ============================================================
   scripts/optimize-html.js
   ------------------------------------------------------------
   Optimasi index.html untuk performance:
   1. Tambah preconnect + dns-prefetch
   2. Optimasi Google Fonts (preload + async load)
   3. Tambah defer ke semua <script src="...">
   
   Usage:
     node scripts/optimize-html.js --dry-run   (preview)
     node scripts/optimize-html.js             (apply)
     node scripts/optimize-html.js --revert    (restore backup)
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const REVERT  = process.argv.includes('--revert');

const ROOT_DIR  = path.resolve(__dirname, '..');
const HTML_FILE = path.join(ROOT_DIR, 'index.html');
const BAK_FILE  = HTML_FILE + '.bak';

/* ---------- REVERT ---------- */
if (REVERT) {
  if (!fs.existsSync(BAK_FILE)) {
    console.error('❌ Tidak ada backup file. Tidak bisa revert.');
    process.exit(1);
  }
  fs.writeFileSync(HTML_FILE, fs.readFileSync(BAK_FILE, 'utf8'));
  fs.unlinkSync(BAK_FILE);
  console.log('✅ Reverted index.html from backup.');
  process.exit(0);
}

if (!fs.existsSync(HTML_FILE)) {
  console.error('❌ index.html tidak ditemukan di ' + HTML_FILE);
  process.exit(1);
}

let html = fs.readFileSync(HTML_FILE, 'utf8');
const original = html;
const changes = [];

/* ============================================================
   1. PRECONNECT + DNS-PREFETCH
   ============================================================ */
if (!html.includes('rel="preconnect"')) {
  const preconnect = `  <!-- ============================================================
       ⚡ PERFORMANCE: Preconnect & DNS-prefetch
       ============================================================ -->
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://sgs-psikotes-default-rtdb.asia-southeast1.firebasedatabase.app" crossorigin>
  <link rel="dns-prefetch" href="https://cdn.sheetjs.com">
  <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
  <link rel="dns-prefetch" href="https://www.gstatic.com">
  <link rel="dns-prefetch" href="https://fonts.googleapis.com">

`;
  html = html.replace(/(<meta charset="UTF-8">\s*\n)/, '$1\n' + preconnect);
  changes.push('✅ Preconnect + dns-prefetch ditambahkan');
} else {
  changes.push('⏭  Preconnect sudah ada, skip');
}

/* ============================================================
   2. OPTIMASI GOOGLE FONTS
   ============================================================ */
const fontRegex = /<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+"\s+rel="stylesheet"\s*>/;
const fontNewURL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Poppins:wght@400;500;600;700&display=swap';

if (fontRegex.test(html)) {
  const fontBlock = `<link rel="preload" as="style" href="${fontNewURL}">
  <link rel="stylesheet" href="${fontNewURL}" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="${fontNewURL}"></noscript>`;
  html = html.replace(fontRegex, fontBlock);
  changes.push('✅ Google Fonts dioptimasi (preload + async + kurangi weight)');
} else {
  changes.push('⏭  Google Fonts link tidak ditemukan / sudah dioptimasi');
}

/* ============================================================
   3. TAMBAH defer KE SEMUA <script src="...">
   ------------------------------------------------------------
   - Skip yang sudah punya defer/async
   - Hanya match external script (ada src="...")
   - Inline script (tanpa src) TIDAK disentuh
   ============================================================ */
let deferCount = 0;
const scriptRegex = /<script\s+src="([^"]+)"(?![^>]*\bdefer\b)(?![^>]*\basync\b)([^>]*)><\/script>/g;

html = html.replace(scriptRegex, (match, src, rest) => {
  const trimmed = rest.trim();
  const extra = trimmed ? ' ' + trimmed : '';
  deferCount++;
  return `<script src="${src}" defer${extra}></script>`;
});

changes.push('✅ ' + deferCount + ' script tag diberi "defer"');

/* ============================================================
   WRITE
   ============================================================ */
console.log('====================================================');
console.log('  OPTIMIZE HTML — Performance Fase 1.2');
console.log('====================================================');
console.log('  Mode: ' + (DRY_RUN ? 'DRY-RUN (preview)' : 'LIVE'));
console.log('  File: ' + HTML_FILE);
console.log('');
console.log('  Perubahan:');
changes.forEach(c => console.log('    ' + c));
console.log('');

if (DRY_RUN) {
  console.log('💡 Ini preview. Untuk apply:');
  console.log('   node scripts/optimize-html.js');
} else {
  fs.writeFileSync(BAK_FILE, original, 'utf8');
  fs.writeFileSync(HTML_FILE, html, 'utf8');
  console.log('💾 index.html diupdate.');
  console.log('   Backup: index.html.bak');
  console.log('   Revert: node scripts/optimize-html.js --revert');
}