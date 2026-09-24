/* ============================================================
   MERGER — GRAFIS AUTO DATA
   ------------------------------------------------------------
   Menggabungkan DAP, BAUM, HTP dari file terpisah.
   WAJIB dimuat SETELAH:
     - grafis/baum-data.js
     - grafis/dap-data.js
     - grafis/htp-data.js
   ============================================================ */

window.GRAFIS_AUTO_DATA = {
  baum: (typeof window.GRAFIS_AUTO_DATA_BAUM !== 'undefined')
    ? window.GRAFIS_AUTO_DATA_BAUM
    : { title: 'BAUM', subtitle: 'Data belum dimuat', icon: '🌳', groups: [] },

  dap: (typeof window.GRAFIS_AUTO_DATA_DAP !== 'undefined')
    ? window.GRAFIS_AUTO_DATA_DAP
    : { title: 'DAP', subtitle: 'Data belum dimuat', icon: '🎨', groups: [] },

  htp: (typeof window.GRAFIS_AUTO_DATA_HTP !== 'undefined')
    ? window.GRAFIS_AUTO_DATA_HTP
    : { title: 'HTP', subtitle: 'Data belum dimuat', icon: '🏠', groups: [] }
};

console.log('[GRAFIS-AUTO-DATA] ✓ Merger loaded — DAP, BAUM, HTP');
