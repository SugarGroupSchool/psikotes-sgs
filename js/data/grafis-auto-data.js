/* ============================================================
   MERGER — GRAFIS AUTO DATA
   ------------------------------------------------------------
   Menggabungkan BAUM, DAP, HTP dari file terpisah.
   ============================================================ */

window.GRAFIS_AUTO_DATA = {
  baum: (typeof window.GRAFIS_AUTO_DATA_BAUM !== 'undefined')
    ? window.GRAFIS_AUTO_DATA_BAUM
    : { title: 'BAUM', icon: '🌳', slides: [] },

  dap: (typeof window.GRAFIS_AUTO_DATA_DAP !== 'undefined')
    ? window.GRAFIS_AUTO_DATA_DAP
    : { title: 'DAP', icon: '👤', slides: [] },

  htp: (typeof window.GRAFIS_AUTO_DATA_HTP !== 'undefined')
    ? window.GRAFIS_AUTO_DATA_HTP
    : { title: 'HTP', icon: '🏠 🌳 👤', slides: [] }
};

console.log('[GRAFIS-AUTO-DATA] ✓ Merger loaded — BAUM, DAP, HTP');
