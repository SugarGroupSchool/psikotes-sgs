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

      // ✅ FIX: Set global jsPDF setelah load
      if (window.jspdf && window.jspdf.jsPDF) {
        window.jsPDF = window.jspdf.jsPDF;
        console.log('[LIBS-LOADER] ✓ window.jsPDF di-set');
      }

      const t1 = performance.now();
      console.log('[LIBS-LOADER] ✓ PDF libs selesai dalam ' + Math.round(t1 - t0) + 'ms');
      return true;
    })();
    return _pdfPromise;
  };
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







  console.log('[LIBS-LOADER] ✓ Loaded — libs besar siap di-load on-demand');
})();
