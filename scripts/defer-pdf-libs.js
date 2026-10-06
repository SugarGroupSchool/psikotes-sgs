#!/usr/bin/env node
/* ============================================================
   scripts/defer-pdf-libs.js
   ------------------------------------------------------------
   Fase 1.4 — Performance
   1. Hapus jsPDF + JSZip dari index.html
   2. Tambah fungsi loadPdfLibs() ke libs-loader.js
   3. Wrap generatePDFBlob + downloadCandidateZip
   4. Auto-preload di mode admin/interview/grafindo
   
   Usage:
     node scripts/defer-pdf-libs.js --dry-run   (preview)
     node scripts/defer-pdf-libs.js             (apply)
     node scripts/defer-pdf-libs.js --revert    (restore)
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const REVERT  = process.argv.includes('--revert');

const ROOT      = path.resolve(__dirname, '..');
const HTML      = path.join(ROOT, 'index.html');
const LOADER_JS = path.join(ROOT, 'js', 'core', 'libs-loader.js');

/* ============================================================
   REVERT
   ============================================================ */
if (REVERT) {
  let count = 0;
  for (const file of [HTML, LOADER_JS]) {
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

if (!fs.existsSync(HTML)) {
  console.error('❌ index.html tidak ditemukan.');
  process.exit(1);
}
if (!fs.existsSync(LOADER_JS)) {
  console.error('❌ libs-loader.js tidak ditemukan. Jalankan Fase 1.3 dulu.');
  process.exit(1);
}

let html = fs.readFileSync(HTML, 'utf8');
const originalHtml = html;
let loader = fs.readFileSync(LOADER_JS, 'utf8');
const originalLoader = loader;

const changes = [];

/* ============================================================
   1. HAPUS jsPDF + JSZip DARI index.html
   ============================================================ */
const removePatterns = [
  {
    name: 'jsPDF',
    regex: /\s*<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/jspdf\/2\.5\.1\/jspdf\.umd\.min\.js" defer><\/script>/g
  },
  {
    name: 'JSZip',
    regex: /\s*<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/jszip\/3\.10\.1\/jszip\.min\.js" defer><\/script>/g
  }
];

for (const p of removePatterns) {
  const matches = html.match(p.regex);
  if (matches && matches.length > 0) {
    html = html.replace(p.regex, '');
    changes.push('✅ Hapus ' + p.name + ' dari index.html');
  } else {
    changes.push('⏭  Skip ' + p.name + ' (tidak ditemukan / sudah dihapus)');
  }
}

/* ============================================================
   2. TAMBAH loadPdfLibs() KE libs-loader.js
   ============================================================ */
if (!loader.includes('loadPdfLibs')) {
  // Sisipkan sebelum "console.log('[LIBS-LOADER] ✓ Loaded"
  const pdfBlock = `
  /* ============================================================
     PDF LIBS — jsPDF + JSZip (Fase 1.4)
     ============================================================ */
  const PDF_LIBS = {
    scripts: [
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
    ]
  };

  let _pdfPromise = null;

  window.loadPdfLibs = function () {
    if (_pdfPromise) return _pdfPromise;
    _pdfPromise = (async () => {
      // Kalau sudah ada, skip
      const needsJspdf = (typeof window.jspdf === 'undefined');
      const needsJszip = (typeof window.JSZip === 'undefined');
      if (!needsJspdf && !needsJszip) return true;

      console.log('[LIBS-LOADER] Memuat jsPDF + JSZip…');
      const t0 = performance.now();
      for (const src of PDF_LIBS.scripts) {
        await loadJs(src);
      }
      const t1 = performance.now();
      console.log('[LIBS-LOADER] ✓ PDF libs selesai dalam ' + Math.round(t1 - t0) + 'ms');
      return true;
    })();
    return _pdfPromise;
  };

`;
  loader = loader.replace(
    /(\n\s*console\.log\('\[LIBS-LOADER\] ✓ Loaded)/,
    pdfBlock + '$1'
  );

  // Wrap generatePDFBlob + downloadCandidateZip
  const wrapBlock = `
  /* ============================================================
     AUTO-WRAP — Pastikan PDF libs ke-load sebelum dipakai
     ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    // Wrap generatePDFBlob
    const _origPdf = window.generatePDFBlob;
    if (typeof _origPdf === 'function') {
      window.generatePDFBlob = async function () {
        await window.loadPdfLibs();
        return _origPdf.apply(this, arguments);
      };
      console.log('[LIBS-LOADER] ✓ generatePDFBlob wrapped');
    }

    // Wrap downloadCandidateZip (butuh JSZip)
    const _origZip = window.downloadCandidateZip;
    if (typeof _origZip === 'function') {
      window.downloadCandidateZip = async function () {
        await window.loadPdfLibs();
        return _origZip.apply(this, arguments);
      };
      console.log('[LIBS-LOADER] ✓ downloadCandidateZip wrapped');
    }

    // Pre-load PDF libs kalau di mode khusus
    try {
      const url = new URL(location.href);
      const params = url.searchParams;
      const isSpecialMode =
        params.get('interview') === '1' ||
        params.get('grafindo') === '1' ||
        params.has('admin');

      if (isSpecialMode) {
        console.log('[LIBS-LOADER] Mode khusus terdeteksi → preload PDF libs');
        setTimeout(() => window.loadPdfLibs(), 1500);
      }
    } catch (e) {}
  });

`;
  loader = loader.replace(
    /(\n\s*console\.log\('\[LIBS-LOADER\] ✓ Loaded)/,
    wrapBlock + '$1'
  );

  changes.push('✅ loadPdfLibs() ditambahkan ke libs-loader.js');
  changes.push('✅ Auto-wrap generatePDFBlob + downloadCandidateZip');
  changes.push('✅ Auto-preload di mode admin/interview/grafindo');
} else {
  changes.push('⏭  loadPdfLibs sudah ada di libs-loader.js');
}

/* ============================================================
   WRITE
   ============================================================ */
console.log('====================================================');
console.log('  DEFER PDF LIBS — Fase 1.4');
console.log('====================================================');
console.log('  Mode: ' + (DRY_RUN ? 'DRY-RUN (preview)' : 'LIVE'));
console.log('');
console.log('  Perubahan:');
changes.forEach(c => console.log('    ' + c));
console.log('');

if (DRY_RUN) {
  console.log('💡 Preview selesai. Untuk apply:');
  console.log('   node scripts/defer-pdf-libs.js');
  process.exit(0);
}

// Backup
fs.writeFileSync(HTML + '.bak', originalHtml, 'utf8');
fs.writeFileSync(LOADER_JS + '.bak', originalLoader, 'utf8');

// Write
fs.writeFileSync(HTML, html, 'utf8');
fs.writeFileSync(LOADER_JS, loader, 'utf8');

console.log('💾 2 file diupdate:');
console.log('   - index.html');
console.log('   - js/core/libs-loader.js');
console.log('');
console.log('   Backup: *.bak');
console.log('   Revert: node scripts/defer-pdf-libs.js --revert');