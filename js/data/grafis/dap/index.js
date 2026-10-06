window.GRAFIS_AUTO_DATA_DAP = {
  title: 'DAP — Draw A Person',
  subtitle: 'Interpretasi otomatis (data sedang dilengkapi)',
  icon: '👤',
  theme: {
    primary: '#a855f7', primaryDark: '#7e22ce',
    bg: '#faf5ff', border: '#e9d5ff'
  },
  defaultImage: 'https://cdn.jsdelivr.net/gh/Pragas123/assets@main/nmqo6a.png',
  slides: window.GRAFIS_AUTO_DATA_DAP_SLIDES || []
};

console.log('[GRAFIS-AUTO-DAP] ✓ Loaded —', window.GRAFIS_AUTO_DATA_DAP.slides.length, 'slide');
