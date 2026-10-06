#!/usr/bin/env node
/* ============================================================
   scripts/defer-grafis-data.js
   ------------------------------------------------------------
   Fase 4 — Lazy load DAP/BAUM/HTP data
   
   Data grafis hanya dipakai di mode ?grafindo=1 (admin form).
   Hapus dari index.html, load on-demand via libs-loader.
   
   Files yang dihapus dari index.html (26 file):
   - grafis-auto-data.js
   - grafis/baum/01-11.js + index.js
   - grafis/dap/01-07.js + index.js
   - grafis/htp/01-04.js + index.js
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const REVERT  = process.argv.includes('--revert');

const ROOT      = path.resolve(__dirname, '..');
const HTML      = path.join(ROOT, 'index.html');
const LOADER_JS = path.join(ROOT, 'js', 'core', 'libs-loader.js');
const INTERP_JS = path.join(ROOT, 'js', '00n-grafis-interpretasi.js');

/* ---------- REVERT ---------- */
if (REVERT) {
  let count = 0;
  for (const file of [HTML, LOADER_JS, INTERP_JS]) {
    const bak = file + '.bak';
    if (fs.existsSync(bak)) {
      fs.writeFileSync(file, fs.readFileSync(bak, 'utf8'));
      fs.unlinkSync(bak);
      console.log('✅ Reverted: ' + path.relative(ROOT, file));
      count++;
    }
  }
  console.log('\nTotal: ' + count + ' file(s) reverted.');
  process.exit(0);
}

/* ---------- READ ---------- */
let html     = fs.readFileSync(HTML, 'utf8');
const html0  = html;
let loader   = fs.readFileSync(LOADER_JS, 'utf8');
const loader0 = loader;
let interp   = fs.readFileSync(INTERP_JS, 'utf8');
const interp0 = interp;

const changes = [];

/* ============================================================
   1. HAPUS 26 SCRIPT TAG DARI index.html
   ============================================================ */
const patterns = [
  /<script src="\.\/js\/data\/grafis-auto-data\.js" defer><\/script>\s*/g,
  /<script src="\.\/js\/data\/grafis\/baum\/[^"]+\.js" defer><\/script>\s*/g,
  /<script src="\.\/js\/data\/grafis\/dap\/[^"]+\.js" defer><\/script>\s*/g,
  /<script src="\.\/js\/data\/grafis\/htp\/[^"]+\.js" defer><\/script>\s*/g
];

let removedCount = 0;
for (const rx of patterns) {
  const matches = html.match(rx);
  if (matches) removedCount += matches.length;
  html = html.replace(rx, '');
}

// Bersihkan komentar sisa
html = html.replace(/\s*<!-- Merger — WAJIB paling bawah -->\s*/g, '\n');
html = html.replace(/\s*<!-- BAUM -->\s*/g, '\n');
html = html.replace(/\s*<!-- DAP -->\s*/g, '\n');
html = html.replace(/\s*<!-- HTP -->\s*/g, '\n');
html = html.replace(/\s*<!-- =+\s*GRAFIS DATA[^>]*-->\s*/g, '\n');

changes.push('✅ Hapus ' + removedCount + ' script tag data grafis dari index.html');

/* ============================================================
   2. TAMBAH loadGrafisAutoData() KE libs-loader.js
   ============================================================ */
if (!loader.includes('loadGrafisAutoData')) {
  const block = `
  /* ============================================================
     GRAFIS DATA — DAP/BAUM/HTP (Fase 4)
     Hanya dipakai saat ?grafindo=1 (admin form interpretasi)
     ============================================================ */
  const GRAFIS_FILES = [
    // BAUM — urut penting
    './js/data/grafis/baum/01-ukuran-gambar.js',
    './js/data/grafis/baum/02-kesan-gambar.js',
    './js/data/grafis/baum/03-penempatan-lokasi.js',
    './js/data/grafis/baum/04-kualitas-garis.js',
    './js/data/grafis/baum/06-bagian-pohon.js',
    './js/data/grafis/baum/07-stambasis.js',
    './js/data/grafis/baum/08-batang.js',
    './js/data/grafis/baum/09-dahan.js',
    './js/data/grafis/baum/10-mahkota.js',
    './js/data/grafis/baum/11-fitur-khusus.js',
    './js/data/grafis/baum/index.js',
    // DAP
    './js/data/grafis/dap/01-ukuran-gambar.js',
    './js/data/grafis/dap/02-kesan-umum.js',
    './js/data/grafis/dap/03-penempatan-lokasi.js',
    './js/data/grafis/dap/04-simbolisme-garis.js',
    './js/data/grafis/dap/05-bagian-kepala.js',
    './js/data/grafis/dap/06-bagian-tubuh.js',
    './js/data/grafis/dap/07-fitur-khusus.js',
    './js/data/grafis/dap/index.js',
    // HTP
    './js/data/grafis/htp/01-rumah.js',
    './js/data/grafis/htp/02-pohon.js',
    './js/data/grafis/htp/03-orang.js',
    './js/data/grafis/htp/04-gambar-selain-instruksi.js',
    './js/data/grafis/htp/index.js',
    // Merger — paling akhir
    './js/data/grafis-auto-data.js'
  ];

  let _grafisPromise = null;

  window.loadGrafisAutoData = function () {
    if (_grafisPromise) return _grafisPromise;
    _grafisPromise = (async () => {
      // Skip kalau sudah ada
      if (window.GRAFIS_AUTO_DATA &&
          window.GRAFIS_AUTO_DATA.baum &&
          Array.isArray(window.GRAFIS_AUTO_DATA.baum.slides) &&
          window.GRAFIS_AUTO_DATA.baum.slides.length > 0) {
        return true;
      }

      console.log('[LIBS-LOADER] Memuat data grafis (DAP/BAUM/HTP)…');
      const t0 = performance.now();

      // Load berurutan (data files push ke array global)
      for (const src of GRAFIS_FILES) {
        await loadJs(src);
      }

      const t1 = performance.now();
      console.log('[LIBS-LOADER] ✓ Data grafis siap dalam ' + Math.round(t1 - t0) + 'ms');
      return true;
    })();
    return _grafisPromise;
  };

  // Auto-load kalau di mode grafindo
  document.addEventListener('DOMContentLoaded', () => {
    try {
      if (new URLSearchParams(location.search).get('grafindo') === '1') {
        console.log('[LIBS-LOADER] Mode grafindo → preload data grafis');
        setTimeout(() => window.loadGrafisAutoData(), 300);
      }
    } catch (e) {}
  });

`;
  loader = loader.replace(
    /(\n\s*console\.log\('\[LIBS-LOADER\] ✓ Loaded)/,
    block + '$1'
  );
  changes.push('✅ loadGrafisAutoData() ditambahkan ke libs-loader.js');
} else {
  changes.push('⏭  loadGrafisAutoData sudah ada');
}

/* ============================================================
   3. PATCH 00n-grafis-interpretasi.js
   ------------------------------------------------------------
   Tambah `await loadGrafisAutoData()` sebelum render.
   ============================================================ */
if (!interp.includes('loadGrafisAutoData')) {
  // Cari titik "await __waitForScoring()" dan tambah load data setelahnya
  const oldRun = /if \(!scoringReady\) \{[\s\S]*?\}\s*\n\s*\n(\s*)const existing = document\.getElementById\('grafindoRoot'\)/;

  const newRun = `if (!scoringReady) {
      toast('⚠️ Scoring engine tidak tersedia. Refresh halaman.', 'error');
    }

    // 🆕 Fase 4: Load DAP/BAUM/HTP data on-demand
    if (typeof window.loadGrafisAutoData === 'function') {
      try {
        await window.loadGrafisAutoData();
      } catch (e) {
        console.warn('[GRAFIS-INTERP] Gagal load data grafis:', e.message);
      }
    }

    $1const existing = document.getElementById('grafindoRoot')`;

  interp = interp.replace(oldRun, newRun);
  changes.push('✅ Patch 00n-grafis-interpretasi.js — load data before render');
} else {
  changes.push('⏭  Patch 00n sudah ada');
}

/* ---------- REPORT ---------- */
console.log('====================================================');
console.log('  DEFER GRAFIS DATA — Fase 4');
console.log('====================================================');
console.log('  Mode: ' + (DRY_RUN ? 'DRY-RUN (preview)' : 'LIVE'));
console.log('');
console.log('  Perubahan:');
changes.forEach(c => console.log('    ' + c));
console.log('');
console.log('  Est. savings: ~115 KB uncompressed / ~30 KB gzip');
console.log('  Hanya load saat ?grafindo=1');
console.log('');

if (DRY_RUN) {
  console.log('💡 Preview selesai. Untuk apply:');
  console.log('   node scripts/defer-grafis-data.js');
  process.exit(0);
}

/* ---------- WRITE ---------- */
fs.writeFileSync(HTML + '.bak', html0, 'utf8');
fs.writeFileSync(LOADER_JS + '.bak', loader0, 'utf8');
fs.writeFileSync(INTERP_JS + '.bak', interp0, 'utf8');

fs.writeFileSync(HTML, html, 'utf8');
fs.writeFileSync(LOADER_JS, loader, 'utf8');
fs.writeFileSync(INTERP_JS, interp, 'utf8');

console.log('💾 3 file diupdate:');
console.log('   - index.html');
console.log('   - js/core/libs-loader.js');
console.log('   - js/00n-grafis-interpretasi.js');
console.log('');
console.log('   Backup: *.bak');
console.log('   Revert: node scripts/defer-grafis-data.js --revert');