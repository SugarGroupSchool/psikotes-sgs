#!/usr/bin/env node
/* ============================================================
   scripts/defer-excel-libs.js
   ------------------------------------------------------------
   Fase 1.3 — Performance
   1. Buat libs-loader.js (dynamic loader)
   2. Hapus Luckysheet + SheetJS dari index.html
   3. Tambah preload logo
   4. Wrap tests/excel.js untuk load on-demand
   
   Usage:
     node scripts/defer-excel-libs.js --dry-run   (preview)
     node scripts/defer-excel-libs.js             (apply)
     node scripts/defer-excel-libs.js --revert    (restore)
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const REVERT  = process.argv.includes('--revert');

const ROOT      = path.resolve(__dirname, '..');
const HTML      = path.join(ROOT, 'index.html');
const EXCEL_JS  = path.join(ROOT, 'js', 'tests', 'excel.js');
const LOADER_JS = path.join(ROOT, 'js', 'core', 'libs-loader.js');

/* ============================================================
   REVERT
   ============================================================ */
if (REVERT) {
  let count = 0;
  for (const file of [HTML, EXCEL_JS]) {
    const bak = file + '.bak';
    if (fs.existsSync(bak)) {
      fs.writeFileSync(file, fs.readFileSync(bak, 'utf8'));
      fs.unlinkSync(bak);
      console.log('✅ Reverted: ' + path.relative(ROOT, file));
      count++;
    }
  }
  if (fs.existsSync(LOADER_JS)) {
    fs.unlinkSync(LOADER_JS);
    console.log('✅ Deleted: js/core/libs-loader.js');
    count++;
  }
  console.log('\nTotal: ' + count + ' item(s) reverted.');
  process.exit(0);
}

/* ============================================================
   BACA FILE
   ============================================================ */
let html = fs.readFileSync(HTML, 'utf8');
const originalHtml = html;
let excelJs = fs.readFileSync(EXCEL_JS, 'utf8');
const originalExcelJs = excelJs;

const changes = [];

/* ============================================================
   1. REMOVE LUCKYSHEET + SHEETJS DARI index.html
   ============================================================ */
const removePatterns = [
  {
    name: 'Luckysheet CSS (pluginsCss)',
    regex: /\s*<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/luckysheet@2\.1\.13\/dist\/plugins\/css\/pluginsCss\.css">/g
  },
  {
    name: 'Luckysheet CSS (plugins)',
    regex: /\s*<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/luckysheet@2\.1\.13\/dist\/plugins\/plugins\.css">/g
  },
  {
    name: 'Luckysheet CSS (main)',
    regex: /\s*<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/luckysheet@2\.1\.13\/dist\/css\/luckysheet\.css">/g
  },
  {
    name: 'Luckysheet CSS (iconfont)',
    regex: /\s*<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/luckysheet@2\.1\.13\/dist\/assets\/iconfont\/iconfont\.css">/g
  },
  {
    name: 'Luckysheet JS (plugin.js)',
    regex: /\s*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/luckysheet@2\.1\.13\/dist\/plugins\/js\/plugin\.js" defer><\/script>/g
  },
  {
    name: 'Luckysheet JS (umd)',
    regex: /\s*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/luckysheet@2\.1\.13\/dist\/luckysheet\.umd\.js" defer><\/script>/g
  },
  {
    name: 'SheetJS',
    regex: /\s*<script src="https:\/\/cdn\.sheetjs\.com\/xlsx-0\.20\.2\/package\/dist\/xlsx\.full\.min\.js" defer><\/script>/g
  }
];

for (const p of removePatterns) {
  const matches = html.match(p.regex);
  if (matches && matches.length > 0) {
    html = html.replace(p.regex, '');
    changes.push('✅ Hapus ' + p.name);
  } else {
    changes.push('⏭  Skip ' + p.name + ' (tidak ditemukan)');
  }
}

/* ============================================================
   2. TAMBAH PRELOAD LOGO + REVISI KOMENTAR
   ============================================================ */
const preloadLogo = `  <link rel="preload" as="image" fetchpriority="high"
        href="https://cdn.jsdelivr.net/gh/Pragas123/assets@main/nmqo6a.png">\n`;

// Sisipkan setelah preconnect
if (!html.includes('rel="preload" as="image"')) {
  html = html.replace(
    /(<link rel="dns-prefetch" href="https:\/\/fonts\.googleapis\.com">\n)/,
    '$1\n  <!-- ⚡ Preload LCP element (logo) -->\n' + preloadLogo
  );
  changes.push('✅ Preload logo ditambahkan');
} else {
  changes.push('⏭  Preload logo sudah ada');
}

// Tambahkan loader script sebelum core utils
const loaderTag = `  <!-- 🆕 LAZY LOADER — Libs besar (Luckysheet, SheetJS) -->\n  <script src="./js/core/libs-loader.js" defer></script>\n\n`;
if (!html.includes('libs-loader.js')) {
  html = html.replace(
    /(\s*<!-- ============================================================\n\s*CORE UTILITIES)/,
    '\n' + loaderTag + '$1'
  );
  changes.push('✅ Script libs-loader.js ditambahkan ke index.html');
} else {
  changes.push('⏭  libs-loader.js sudah ada');
}

/* ============================================================
   3. WRAP tests/excel.js — LOAD ON-DEMAND
   ============================================================ */
const wrapperBlock = `

/* ============================================================
   🆕 LAZY LOAD WRAPPER — Load Luckysheet + SheetJS on-demand
   ============================================================ */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.__excelLazyWrapApplied) return;
  window.__excelLazyWrapApplied = true;

  const _original = window.renderAdminExcelSheet;
  if (typeof _original !== 'function') {
    console.warn('[EXCEL-LOADER] renderAdminExcelSheet tidak ditemukan');
    return;
  }

  window.renderAdminExcelSheet = async function () {
    const needsLuckysheet = (typeof window.luckysheet === 'undefined');
    const needsXLSX = (typeof window.XLSX === 'undefined');

    if (needsLuckysheet || needsXLSX) {
      // Tampilkan loading screen
      const appEl = document.getElementById('app');
      if (appEl) {
        appEl.innerHTML = [
          '<div style="display:flex;align-items:center;justify-content:center;',
          'min-height:60vh;flex-direction:column;gap:18px;',
          'font-family:Inter,system-ui,sans-serif;">',
          '  <div style="width:54px;height:54px;border:4px solid #e2e8f0;',
          '    border-top-color:#3b82f6;border-radius:50%;',
          '    animation:excelSpin .8s linear infinite;"></div>',
          '  <div style="font-size:14px;font-weight:700;color:#475569;">',
          '    Memuat library Excel…</div>',
          '  <style>@keyframes excelSpin{to{transform:rotate(360deg)}}</style>',
          '</div>'
        ].join('');
      }

      try {
        if (typeof window.loadExcelLibs === 'function') {
          await window.loadExcelLibs();
        } else {
          throw new Error('libs-loader.js tidak ter-load');
        }
      } catch (err) {
        console.error('[EXCEL-LOADER] Gagal load library:', err);
        if (appEl) {
          appEl.innerHTML = [
            '<div style="padding:40px;text-align:center;color:#dc2626;',
            'font-family:Inter,system-ui,sans-serif;">',
            '  <div style="font-size:48px;margin-bottom:14px;">❌</div>',
            '  <div style="font-size:16px;font-weight:800;margin-bottom:8px;">',
            '    Gagal memuat library Excel</div>',
            '  <div style="font-size:13px;color:#64748b;">' + (err.message || '') + '</div>',
            '  <button onclick="location.reload()" style="',
            '    margin-top:20px;padding:12px 24px;background:#3b82f6;',
            '    color:#fff;border:0;border-radius:10px;font-weight:800;',
            '    cursor:pointer;font-family:inherit;font-size:14px;">',
            '    🔄 Coba Lagi</button>',
            '</div>'
          ].join('');
        }
        return;
      }
    }

    return _original.apply(this, arguments);
  };

  console.log('[EXCEL-LOADER] ✓ renderAdminExcelSheet wrapped for lazy load');
})();
`;

if (!excelJs.includes('__excelLazyWrapApplied')) {
  excelJs = excelJs + wrapperBlock;
  changes.push('✅ Wrapper lazy load ditambahkan ke tests/excel.js');
} else {
  changes.push('⏭  Wrapper sudah ada di tests/excel.js');
}

/* ============================================================
   4. ISI libs-loader.js
   ============================================================ */
const loaderJsContent = `/* ============================================================
   js/core/libs-loader.js
   ------------------------------------------------------------
   Dynamic loader untuk library besar:
   - Luckysheet (Excel engine)
   - SheetJS (XLSX export)
   
   Hanya dimuat saat dibutuhkan → hemat ~1 MB dari initial load.
   ============================================================ */
(function () {
  'use strict';

  const LIBS = {
    styles: [
      'https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/css/pluginsCss.css',
      'https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/plugins.css',
      'https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/css/luckysheet.css',
      'https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/assets/iconfont/iconfont.css'
    ],
    scripts: [
      'https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/js/plugin.js',
      'https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/luckysheet.umd.js',
      'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js'
    ]
  };

  function loadCss(href) {
    return new Promise((resolve) => {
      if (document.querySelector('link[href="' + href + '"]')) return resolve();
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => resolve();
      document.head.appendChild(link);
    });
  }

  function loadJs(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="' + src + '"]');
      if (existing && existing.dataset.loaded === '1') return resolve();
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Load gagal: ' + src)));
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => { s.dataset.loaded = '1'; resolve(); };
      s.onerror = () => reject(new Error('Load gagal: ' + src));
      document.head.appendChild(s);
    });
  }

  let _promise = null;

  window.loadExcelLibs = function () {
    if (_promise) return _promise;
    _promise = (async () => {
      console.log('[LIBS-LOADER] Memuat library Excel…');
      const t0 = performance.now();

      // CSS dulu (paralel)
      await Promise.all(LIBS.styles.map(loadCss));

      // JS urut (karena luckysheet umd butuh plugin)
      for (const src of LIBS.scripts) {
        await loadJs(src);
      }

      const t1 = performance.now();
      console.log('[LIBS-LOADER] ✓ Selesai dalam ' + Math.round(t1 - t0) + 'ms');
      return true;
    })();
    return _promise;
  };

  console.log('[LIBS-LOADER] ✓ Loaded — libs besar siap di-load on-demand');
})();
`;

if (DRY_RUN) {
  console.log('====================================================');
  console.log('  DEFER EXCEL LIBS — Fase 1.3');
  console.log('====================================================');
  console.log('  Mode: DRY-RUN (preview)');
  console.log('');
  console.log('  Perubahan:');
  changes.forEach(c => console.log('    ' + c));
  console.log('');
  console.log('💡 Preview selesai. Untuk apply:');
  console.log('   node scripts/defer-excel-libs.js');
  process.exit(0);
}

/* ============================================================
   APPLY
   ============================================================ */
console.log('====================================================');
console.log('  DEFER EXCEL LIBS — Fase 1.3');
console.log('====================================================');
console.log('  Mode: LIVE');
console.log('');
console.log('  Perubahan:');
changes.forEach(c => console.log('    ' + c));
console.log('');

// Backup
fs.writeFileSync(HTML + '.bak', originalHtml, 'utf8');
fs.writeFileSync(EXCEL_JS + '.bak', originalExcelJs, 'utf8');

// Write
fs.writeFileSync(HTML, html, 'utf8');
fs.writeFileSync(EXCEL_JS, excelJs, 'utf8');

// Pastikan folder js/core ada
const coreDir = path.join(ROOT, 'js', 'core');
if (!fs.existsSync(coreDir)) fs.mkdirSync(coreDir, { recursive: true });
fs.writeFileSync(LOADER_JS, loaderJsContent, 'utf8');

console.log('💾 3 file diupdate:');
console.log('   - index.html');
console.log('   - js/tests/excel.js');
console.log('   - js/core/libs-loader.js (baru)');
console.log('');
console.log('   Backup: *.bak');
console.log('   Revert: node scripts/defer-excel-libs.js --revert');