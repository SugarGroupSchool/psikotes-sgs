#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const REVERT  = process.argv.includes('--revert');

const ROOT_DIR = path.resolve(__dirname, '..');

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.github', 'dist', 'build', 'coverage',
  '.vscode', '.idea', 'scripts'
]);

const PROCESS_EXTS = new Set([
  '.js', '.html', '.htm', '.css', '.json', '.md', '.txt'
]);

const RULES = [
  {
    name: 'Pragas123/assets',
    from: /https:\/\/raw\.githubusercontent\.com\/Pragas123\/assets\/refs\/heads\/main/g,
    to: 'https://cdn.jsdelivr.net/gh/Pragas123/assets@main'
  },
  {
    name: 'SugarGroupSchool/psikotes-sgs',
    from: /https:\/\/raw\.githubusercontent\.com\/SugarGroupSchool\/psikotes-sgs\/refs\/heads\/main/g,
    to: 'https://cdn.jsdelivr.net/gh/SugarGroupSchool/psikotes-sgs@main'
  },
  {
    name: 'Generic fallback',
    from: /https:\/\/raw\.githubusercontent\.com\/([^/\s"'`]+)\/([^/\s"'`]+)\/refs\/heads\/([^/\s"'`]+)/g,
    to: 'https://cdn.jsdelivr.net/gh/$1/$2@$3'
  }
];

const stats = {
  filesScanned: 0,
  filesModified: 0,
  totalReplacements: 0,
  perRule: RULES.map(r => ({ name: r.name, count: 0 })),
  files: []
};

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(full, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (PROCESS_EXTS.has(ext)) files.push(full);
    }
  }
  return files;
}

function relativePath(p) {
  return path.relative(ROOT_DIR, p);
}

function migrateFile(filePath) {
  stats.filesScanned++;
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  let fileReplacements = 0;

  for (let i = 0; i < RULES.length; i++) {
    const rule = RULES[i];
    const matches = content.match(rule.from);
    if (matches && matches.length > 0) {
      content = content.replace(rule.from, rule.to);
      fileReplacements += matches.length;
      stats.perRule[i].count += matches.length;
    }
  }

  if (content === original) return;

  stats.filesModified++;
  stats.totalReplacements += fileReplacements;
  stats.files.push({ path: relativePath(filePath), count: fileReplacements });

  if (!DRY_RUN) {
    fs.writeFileSync(filePath + '.bak', original, 'utf8');
    fs.writeFileSync(filePath, content, 'utf8');
  }

  const icon = DRY_RUN ? 'OO' : 'OK';
  console.log('  ' + icon + ' ' + relativePath(filePath) + ' - ' + fileReplacements + ' URL');
}

function revertFile(filePath) {
  const bakPath = filePath + '.bak';
  if (!fs.existsSync(bakPath)) return false;
  fs.writeFileSync(filePath, fs.readFileSync(bakPath, 'utf8'), 'utf8');
  fs.unlinkSync(bakPath);
  return true;
}

function runRevert() {
  console.log('Reverting from .bak files...\n');
  const files = walk(ROOT_DIR);
  let reverted = 0;
  for (const f of files) {
    if (revertFile(f)) {
      console.log('  -> ' + relativePath(f));
      reverted++;
    }
  }
  console.log('\nReverted ' + reverted + ' file(s).');
}

function main() {
  if (REVERT) { runRevert(); return; }

  console.log('====================================================');
  console.log('  CDN MIGRATION: raw.githubusercontent -> jsDelivr');
  console.log('====================================================');
  console.log('  Mode   : ' + (DRY_RUN ? 'DRY-RUN (preview)' : 'LIVE (write files)'));
  console.log('  Root   : ' + ROOT_DIR);
  console.log('');

  const files = walk(ROOT_DIR);
  console.log('Scanned ' + files.length + ' file(s)...\n');

  for (const f of files) {
    try { migrateFile(f); }
    catch (err) { console.error('  X ' + relativePath(f) + ' - ' + err.message); }
  }

  console.log('');
  console.log('====================================================');
  console.log('  SUMMARY');
  console.log('====================================================');
  console.log('  Files scanned    : ' + stats.filesScanned);
  console.log('  Files modified   : ' + stats.filesModified);
  console.log('  Total URLs ganti : ' + stats.totalReplacements);
  console.log('');
  console.log('  Per rule:');
  for (const r of stats.perRule) {
    console.log('    - ' + r.name.padEnd(30) + ' : ' + r.count);
  }
  console.log('');

  if (DRY_RUN) {
    console.log('Ini preview. Untuk apply, jalankan tanpa --dry-run');
  } else if (stats.filesModified > 0) {
    console.log('Backup tersimpan dengan ekstensi .bak');
    console.log('Kalau perlu revert: node scripts/migrate-cdn.js --revert');
  } else {
    console.log('Tidak ada URL yang perlu diubah. Semua sudah migrasi!');
  }
}

main();