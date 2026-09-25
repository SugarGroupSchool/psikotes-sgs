/* BAUM — Bagian 1: Ukuran Gambar */
window.GRAFIS_AUTO_DATA_BAUM_SLIDES = window.GRAFIS_AUTO_DATA_BAUM_SLIDES || [];

window.GRAFIS_AUTO_DATA_BAUM_SLIDES.push({
  id: 'baum-01',
  title: '1. Ukuran Gambar',
  image: 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png',
  sections: [
    {
      id: 'ukuran_gambar',
      title: 'Ukuran Gambar',
      type: 'checkbox',
      items: [
        {
          id: 'terlalu_besar',
          label: 'Gambar sangat besar',
          interpret: 'Agresivitas dan kecenderungan untuk bertindak secara eksternal. Sikap ekspansif, fantasi tinggi dan grandiositas (keyakinan berlebihan tentang pentingnya diri sendiri, kemampuan luar biasa, atau superioritas yang tidak realistis). Aktivitas emosional berlebihan, bahkan cenderung manik. Perasaan tidak mampu yang tidak disadari. Dugaan gangguan organik, efek alkohol, atau masalah neuropsikologis. Kesadaran moral yang lemah, potensi sifat antisosial. Kecurigaan berlebih dan kecenderungan paranoid.',
          subItems: [
            {
              id: 'gambar_jelek_kosong',
              label: 'Digambar jelek atau kosong',
              dependsOn: 'terlalu_besar',
              optional: true,
              interpret: 'Terdapat indikasi kekurangan mental. Bisa menandakan adanya kesulitan atau keterbatasan dalam perkembangan kognitif (umumnya dibuat oleh anak-anak).'
            },
            {
              id: 'garis_tepi_besar',
              label: 'Dibuat dengan garis tepi yang sangat besar',
              dependsOn: 'terlalu_besar',
              optional: true,
              interpret: 'Menunjukkan ciri-ciri manik, yaitu periode emosi yang tinggi, energik, dan terkadang terlampau euforik yang dapat mengindikasikan gangguan bipolar atau episode mania.'
            }
          ]
        },
        {
          id: 'lebih_kecil',
          label: 'Lebih kecil dari rata-rata',
          interpret: 'Rasa tidak aman, harga diri rendah, perasaan inferior. Kecemasan, depresi, atau penarikan diri. Ketergantungan berlebih dan perilaku kekanak-kanakan. Kekuatan ego yang rendah, kecenderungan kompulsif atau neurotik. Hambatan dalam interaksi sosial, pemalu atau defensif. Reaksi menarik diri saat menghadapi stres. Kurang bersemangat atau kurangnya motivasi dalam mengejar tujuan atau menyelesaikan masalah. Subjek tidak merasa terpacu untuk mengatasi hambatan yang ada.'
        },
        {
          id: 'keluar_kertas',
          label: 'Keluar dari kertas',
          interpret: 'Kesulitan merencanakan sesuatu atau menata sesuatu secara terstruktur. Tendensi manik atau overaktif di mana mereka cenderung terlalu aktif secara fisik atau mental.'
        },
        {
          id: 'normal',
          label: 'Normal',
          interpret: 'Tidak selalu berarti sehat secara psikologis, dapat ditelaah lebih dalam berdasarkan kualitas ekspresi, detail, dan konteks emosional. Menunjukkan tingkat energi yang cukup untuk berfungsi sehari-hari, tetapi tidak menunjukkan dorongan atau gairah emosional yang kuat. Bisa mencerminkan keadaan psikologis yang datar atau stabil, tergantung konteks lainnya. Mungkin tidak sepenuhnya menyadari dinamika internal, cenderung kurang reflektif, atau tidak terlalu mengenali konflik batin yang dialaminya. Sikap optimis yang ditampilkan bisa jadi hanya di permukaan. Ada kemungkinan subjek menyangkal atau menekan perasaan negatif, sehingga tampak optimis secara luar, tapi tidak disertai pemahaman mendalam terhadap masalah yang dihadapi.'
        }
      ]
    }
  ]
});
