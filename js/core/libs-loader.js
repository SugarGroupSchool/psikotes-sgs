/* ============================================================
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
