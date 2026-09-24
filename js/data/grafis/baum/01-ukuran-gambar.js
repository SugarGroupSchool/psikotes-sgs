/* BAUM — Bagian 1: Ukuran Gambar */
window.GRAFIS_AUTO_DATA_BAUM_SLIDES = window.GRAFIS_AUTO_DATA_BAUM_SLIDES || [];

window.GRAFIS_AUTO_DATA_BAUM_SLIDES.push({
  id: 'baum-01',
  title: '1. Ukuran Gambar',
  image: 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png',
  sections: [
    {
      id: 'ukuran_kertas',
      title: 'Perbandingan dengan Ukuran Kertas dan Besar Gambar',
      type: 'radio',
      items: [
        {
          id: 'normal',
          label: 'Normal (± 2/3 folio)',
          interpret: 'Sebagian besar orang dewasa cenderung menggambar pohon sekitar 2/3 dari ukuran kertas folio. Ukuran gambar proporsional terhadap kertas. Menunjukkan perencanaan yang memadai dalam mengisi ruang, kemampuan mengukur realitas secara wajar, serta kontrol ego yang cukup.'
        },
        {
          id: 'terlalu_besar',
          label: 'Terlalu besar / sangat besar',
          interpret: 'Deviasi dari ukuran ini dapat menjadi indikator tertentu, menunjukkan gambar yang terlalu besar dalam konteks kertas yang digunakan. Gambar Sangat Besar menunjukkan: Agresivitas dan kecenderungan untuk bertindak secara eksternal. Sikap ekspansif, fantasi tinggi dan grandiositas (keyakinan berlebihan tentang pentingnya diri sendiri, kemampuan luar biasa, atau superioritas yang tidak realistis). Aktivitas emosional berlebihan, bahkan cenderung manik. Perasaan tidak mampu yang tidak disadari. Dugaan gangguan organik, efek alkohol, atau masalah neuropsikologis. Kesadaran moral yang lemah, potensi sifat antisosial. Kecurigaan berlebih dan kecenderungan paranoid. Jika gambar jelek atau kosong terdapat indikasi kekurangan mental. Ini bisa menandakan adanya kesulitan atau keterbatasan dalam perkembangan kognitif (gambar ini umumnya dibuat oleh anak-anak).',
          subItems: [
            {
              id: 'garis_tepi_sangat_besar',
              label: 'Garis tepi sangat besar (Ciri Manik)',
              dependsOn: 'terlalu_besar',
              optional: true,
              interpret: 'Terkadang, jika gambar dibuat dengan garis tepi yang sangat besar, ini menunjukkan ciri-ciri manik, yaitu periode emosi yang tinggi, energik, dan terkadang terlampau euforik yang dapat mengindikasikan gangguan bipolar atau episode mania. Catatan: item ini hanya relevan bila kandidat memang menggambar garis tepi; jika tidak ada garis tepi, boleh dilewati.'
            }
          ]
        },
        {
          id: 'terlalu_kecil',
          label: 'Terlalu kecil',
          interpret: 'Deviasi dari ukuran ini dapat menjadi indikator tertentu, menunjukkan gambar yang terlalu kecil dalam konteks kertas yang digunakan. Gambar Lebih Kecil dari Rata-Rata mengindikasikan: Rasa tidak aman, harga diri rendah, perasaan inferior. Kecemasan, depresi, atau penarikan diri. Ketergantungan berlebih dan perilaku kekanak-kanakan. Kekuatan ego yang rendah, kecenderungan kompulsif atau neurotik. Hambatan dalam interaksi sosial, pemalu, atau defensif. Reaksi menarik diri saat menghadapi stres. Kurang bersemangat atau kurangnya motivasi dalam mengejar tujuan atau menyelesaikan masalah. Subjek tidak merasa terpacu untuk mengatasi hambatan-hambatan yang ada.'
        },
        {
          id: 'keluar_kertas',
          label: 'Gambar yang keluar dari kertas',
          interpret: 'Kesulitan merencanakan sesuatu atau menata sesuatu secara terstruktur. Tendensi manik atau over-aktif di mana mereka cenderung terlalu aktif secara fisik atau mental.'
        },
        {
          id: 'normal_7inci',
          label: 'Normal (ukuran mendekati rata-rata ± 7 inci)',
          interpret: 'Ukuran rata-rata gambar sekitar 7 inci. Gambar dengan ukuran mendekati rata-rata (± 7 inci) tidak selalu berarti sehat secara psikologis. Ukuran "normal" tetap perlu ditelaah lebih dalam berdasarkan kualitas ekspresi, detail, dan konteks emosional subjek. Ini menunjukkan beberapa hal: (1) Energi yang Biasa Saja — subjek menunjukkan tingkat energi yang cukup untuk berfungsi sehari-hari, tetapi tidak menunjukkan dorongan atau gairah emosional yang kuat. Bisa mencerminkan keadaan psikologis yang datar atau stabil, tergantung konteks lainnya. (2) Kurang Insight (Wawasan Diri Rendah) — subjek mungkin tidak sepenuhnya menyadari dinamika internal, cenderung kurang reflektif, atau tidak terlalu mengenali konflik batin yang dialaminya. (3) Optimisme Superfisial — sikap positif yang ditampilkan bisa jadi hanya di permukaan. Ada kemungkinan subjek menyangkal atau menekan perasaan negatif, sehingga tampak optimis secara luar tapi tidak disertai pemahaman mendalam terhadap masalah yang dihadapi.'
        }
      ]
    },
    {
      id: 'mahkota_batang',
      title: 'Perbandingan antara Mahkota dan Batang',
      type: 'radio',
      items: [
        { id: 'normal_mb', label: 'Normal (mahkota ≈ 2/3 batang)', interpret: 'Orang dewasa umumnya menggambar mahkota sekitar 2/3 dari panjang batang pohon. Proporsi mahkota dan batang seimbang. Menunjukkan keseimbangan antara kehidupan berpikir/fantasi dengan fungsi praktis dan kemampuan mengakar pada realitas.' },
        { id: 'mahkota_besar', label: 'Mahkota lebih besar', interpret: 'Dalam perbandingan ini dapat mengungkapkan berbagai hal, seperti gambar dengan mahkota yang lebih besar. Mengindikasikan dominasi dunia ide, fantasi, aspirasi, dan pemikiran abstrak dibanding aspek praktis dan realitas.' },
        { id: 'batang_besar', label: 'Batang lebih besar', interpret: 'Dalam perbandingan ini dapat mengungkapkan berbagai hal, seperti gambar dengan batang yang lebih besar. Mengindikasikan dominasi fungsi praktis, dorongan primitif, atau kekakuan. Menekankan pada kekuatan dan stabilitas konkret.' },
        { id: 'batang_besar_seimbang', label: 'Batang lebih besar atau seimbang', interpret: 'Dalam perbandingan ini dapat mengungkapkan berbagai hal, seperti gambar dengan batang yang lebih besar atau seimbang.' }
      ]
    }
  ]
});
