#!/usr/bin/env node
/* ============================================================
   scripts/check-markers.js
   ------------------------------------------------------------
   List semua marker /* === NAME === *​/ di pdf.js
   Untuk tahu section mana yang bisa di-split berikutnya
   ============================================================ */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PDF_JS = path.join(ROOT, 'js', 'core', 'pdf.js');

if (!fs.existsSync(PDF_JS)) {
  console.error('❌ pdf.js tidak ditemukan.');
  process.exit(1);
}

const src = fs.readFileSync(PDF_JS, 'utf8');
const lines = src.split(/\r?\n/);

console.log('====================================================');
console.log('  SCAN MARKER — js/core/pdf.js');
console.log('====================================================');
console.log('  Total lines: ' + lines.length);
console.log('');

/* Cari pola: /​* ===[=]+ ... \n ... NAME ... \n ... ===[=]+ *​/ */
const markers = [];

// Cara 1: Cari komentar dengan 3+ "="
for (let i = 0; i < lines.length - 2; i++) {
  const line1 = lines[i];
  const line2 = lines[i + 1];
  const line3 = lines[i + 2];

  if (/^\s*\/\*\s*={3,}/.test(line1) && /^\s*={3,}\s*\*\/\s*$/.test(line3)) {
    const name = line2.trim();
    markers.push({ line: i + 1, name });
  }
}

if (markers.length === 0) {
  console.log('⚠️  Tidak ada marker ditemukan.');
  console.log('   Coba cek manual dengan: notepad js\\core\\pdf.js');
  process.exit(0);
}

console.log('  Ditemukan ' + markers.length + ' marker:');
console.log('');
markers.forEach(m => {
  console.log('  Line ' + String(m.line).padStart(5) + '  →  ' + m.name);
});

console.log('');

/* Info tambahan: cari console.warn sisa dari split sebelumnya */
console.log('  Console.warn (bukti section sudah di-split):');
const warnRegex = /console\.warn\('\[PDF\] PDF_SECTIONS\.(\w+) tidak tersedia/g;
const warns = [...src.matchAll(warnRegex)].map(m => m[1]);
if (warns.length > 0) {
  warns.forEach(w => console.log('    ⚠️  ' + w));
} else {
  console.log('    (tidak ada)');
}
console.log('');

/* List file yang sudah di-split */
const pdfDir = path.join(ROOT, 'js', 'core', 'pdf');
if (fs.existsSync(pdfDir)) {
  const files = fs.readdirSync(pdfDir).sort();
  console.log('  File section yang sudah ada di js/core/pdf/:');
  files.forEach(f => {
    const fp = path.join(pdfDir, f);
    const size = (fs.statSync(fp).size / 1024).toFixed(1);
    console.log('    • ' + f.padEnd(25) + ' (' + size + ' KB)');
  });
}