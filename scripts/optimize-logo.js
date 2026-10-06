#!/usr/bin/env node
/* ============================================================
   scripts/optimize-logo.js
   ------------------------------------------------------------
   Fase 1.5 — Optimasi logo via wsrv.nl (image proxy gratis)
   
   - Resize: 440x360 (retina 2x dari displayed 220x180)
   - Format: WebP
   - Quality: 85
   - Est: 63 KiB → ~6-8 KiB
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const REVERT  = process.argv.includes('--revert');

const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');

const OLD_URL = 'https://cdn.jsdelivr.net/gh/Pragas123/assets@main/nmqo6a.png';
const NEW_URL = 'https://wsrv.nl/?url=cdn.jsdelivr.net/gh/Pragas123/assets@main/nmqo6a.png&w=440&h=360&output=webp&q=85';

/* ---------- REVERT ---------- */
if (REVERT) {
  const bak = HTML + '.bak';
  if (fs.existsSync(bak)) {
    fs.writeFileSync(HTML, fs.readFileSync(bak, 'utf8'));
    fs.unlinkSync(bak);
    console.log('✅ Reverted: index.html');
  }
  console.log('\n✅ Revert selesai.');
  process.exit(0);
}

/* ---------- READ ---------- */
if (!fs.existsSync(HTML)) {
  console.error('❌ index.html tidak ditemukan.');
  process.exit(1);
}

let html = fs.readFileSync(HTML, 'utf8');
const original = html;

/* ---------- REPLACE ---------- */
const rx = new RegExp(OLD_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
const matches = html.match(rx);
const count = matches ? matches.length : 0;

html = html.replace(rx, NEW_URL);

/* ---------- REPORT ---------- */
console.log('====================================================');
console.log('  OPTIMIZE LOGO — Fase 1.5');
console.log('====================================================');
console.log('  Mode: ' + (DRY_RUN ? 'DRY-RUN (preview)' : 'LIVE'));
console.log('');
console.log('  Old URL: ' + OLD_URL);
console.log('  New URL: wsrv.nl (WebP, 440x360, q=85)');
console.log('');
console.log('  Replacements: ' + count);
console.log('  Est. savings: ~57 KiB (logo file)');
console.log('  Est. LCP gain: -500ms s/d -1s');
console.log('');

if (DRY_RUN) {
  console.log('💡 Preview selesai. Untuk apply:');
  console.log('   node scripts/optimize-logo.js');
  process.exit(0);
}

if (count === 0) {
  console.log('⚠️  Tidak ada URL lama ditemukan. Mungkin sudah dioptimasi?');
  process.exit(0);
}

fs.writeFileSync(HTML + '.bak', original, 'utf8');
fs.writeFileSync(HTML, html, 'utf8');

console.log('💾 index.html diupdate.');
console.log('   Backup: index.html.bak');
console.log('   Revert: node scripts/optimize-logo.js --revert');