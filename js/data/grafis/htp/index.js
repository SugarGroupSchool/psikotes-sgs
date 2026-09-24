window.GRAFIS_AUTO_DATA_HTP = {
  title: 'HTP — House Tree Person',
  subtitle: 'Interpretasi otomatis (data sedang dilengkapi)',
  icon: '🏠 🌳 👤',
  theme: {
    primary: '#3b82f6', primaryDark: '#1e40af',
    bg: '#eff6ff', border: '#bfdbfe'
  },
  defaultImage: 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png',
  slides: window.GRAFIS_AUTO_DATA_HTP_SLIDES || []
};

console.log('[GRAFIS-AUTO-HTP] ✓ Loaded —', window.GRAFIS_AUTO_DATA_HTP.slides.length, 'slide');
