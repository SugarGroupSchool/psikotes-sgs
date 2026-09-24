/* ============================================================
   MERGER — GRAFIS AUTO DATA
   ------------------------------------------------------------
   Menggabungkan BAUM, DAP, HTP dari file terpisah.
   WAJIB dimuat SETELAH folder grafis/baum, grafis/dap, grafis/htp.
   ============================================================ */

window.GRAFIS_AUTO_DATA = {
  baum: (typeof window.GRAFIS_AUTO_DATA_BAUM !== 'undefined')
    ? window.GRAFIS_AUTO_DATA_BAUM
    : { title: 'BAUM', subtitle: 'Data belum dimuat', icon: '🌳', slides: [] },

  dap: (typeof window.GRAFIS_AUTO_DATA_DAP !== 'undefined')
    ? window.GRAFIS_AUTO_DATA_DAP
    : { title: 'DAP', subtitle: 'Data belum dimuat', icon: '🎨', slides: [] },

  htp: (typeof window.GRAFIS_AUTO_DATA_HTP !== 'undefined')
    ? window.GRAFIS_AUTO_DATA_HTP
    : { title: 'HTP', subtitle: 'Data belum dimuat', icon: '🏠', slides: [] }
};

console.log('[GRAFIS-AUTO-DATA] ✓ Merger loaded — DAP, BAUM, HTP');
