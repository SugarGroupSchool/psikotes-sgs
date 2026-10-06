/* BAUM — Bagian 1: Ukuran Gambar */
window.GRAFIS_AUTO_DATA_BAUM_SLIDES = window.GRAFIS_AUTO_DATA_BAUM_SLIDES || [];

window.GRAFIS_AUTO_DATA_BAUM_SLIDES.push({
  id: 'baum-01',
  title: 'Ukuran Gambar',
  image: 'https://cdn.jsdelivr.net/gh/Pragas123/assets@main/nmqo6a.png',
  sections: [
    {
      id: 'ukuran_gambar',
      title: '',
      type: 'checkbox',
      items: [
        {
          id: 'terlalu_besar',
          label: 'Gambar sangat besar',
          ciri: 'Mengisi >75% area kertas · pohon mendominasi seluruh halaman · batang & mahkota jauh lebih besar dari proporsi wajar · garis tepi hampir menyentuh pinggir kertas · ruang kosong di sekeliling sangat sedikit · gambar terkesan meluber dan memenuhi bidang · proporsi batang, mahkota, dan dahan tidak seimbang · garis bisa tebal dan kuat · margin kertas hampir tidak ada',
          interpret: 'Agresivitas dan kecenderungan untuk bertindak secara eksternal. Sikap ekspansif, fantasi tinggi dan grandiositas (keyakinan berlebihan tentang pentingnya diri sendiri, kemampuan luar biasa, atau superioritas yang tidak realistis). Aktivitas emosional berlebihan, bahkan cenderung manik. Perasaan tidak mampu yang tidak disadari. Dugaan gangguan organik, efek alkohol, atau masalah neuropsikologis. Kesadaran moral yang lemah, potensi sifat antisosial. Kecurigaan berlebih dan kecenderungan paranoid.',
          subItems: [
            {
              id: 'gambar_jelek_kosong',
              label: 'Digambar jelek atau kosong',
              dependsOn: 'terlalu_besar',
              optional: true,
              ciri: 'Garis tidak teratur · banyak area kosong tanpa detail · coretan sembarangan · tidak ada usaha memperindah · bentuk tidak dikenali · proporsi kacau · kualitas gambar tampak regresif atau belum matang · detail minim · garis ragu-ragu atau kacau',
              interpret: 'Terdapat indikasi kekurangan mental. Bisa menandakan adanya kesulitan atau keterbatasan dalam perkembangan kognitif (umumnya dibuat oleh anak-anak).'
            },
            {
              id: 'garis_tepi_besar',
              label: 'Dibuat dengan garis tepi yang sangat besar',
              dependsOn: 'terlalu_besar',
              optional: true,
              ciri: 'Garis luar pohon sangat tebal & menonjol · mengelilingi seluruh gambar · seperti bingkai besar · kontras dengan isi gambar · garis tepi lebih dominan daripada isi gambar · bisa berlapis atau ditebalkan berulang · detail di dalam gambar tertutup atau kalah oleh garis tepi',
              interpret: 'Menunjukkan ciri-ciri manik, yaitu periode emosi yang tinggi, energik, dan terkadang terlampau euforik yang dapat mengindikasikan gangguan bipolar atau episode mania.'
            }
          ]
        },
        {
          id: 'lebih_kecil',
          label: 'Lebih kecil dari rata-rata',
          ciri: 'Mengisi <25% area kertas · pohon kecil di tengah atau sudut kertas · banyak ruang kosong di sekeliling · proporsi mini · tinggi pohon kurang dari seperempat tinggi halaman · lebar jauh lebih kecil dari lebar kertas · garis cenderung tipis, pendek, atau ringan · tekanan garis lemah · detail sedikit · gambar tampak sederhana, ragu-ragu, atau tidak ekspansif · margin dari tepi kertas sangat besar',
          interpret: 'Rasa tidak aman, harga diri rendah, perasaan inferior. Kecemasan, depresi, atau penarikan diri. Ketergantungan berlebih dan perilaku kekanak-kanakan. Kekuatan ego yang rendah, kecenderungan kompulsif atau neurotik. Hambatan dalam interaksi sosial, pemalu atau defensif. Reaksi menarik diri saat menghadapi stres. Kurang bersemangat atau kurangnya motivasi dalam mengejar tujuan atau menyelesaikan masalah. Subjek tidak merasa terpacu untuk mengatasi hambatan yang ada.'
        },
        {
          id: 'keluar_kertas',
          label: 'Keluar dari kertas',
          ciri: 'Ada bagian gambar terpotong tepi kertas · mahkota, dahan, atau akar melewati batas halaman · tidak bisa dilihat utuh dalam satu lembar · garis berhenti tepat di tepi kertas · ada bagian pohon hilang karena terpotong · gambar tampak dipaksa masuk ke dalam kertas · bagian luar gambar tidak selesai atau tidak terlihat · ada garis yang mengarah ke luar kertas · posisi gambar terlalu dekat dengan tepi',
          interpret: 'Kesulitan merencanakan sesuatu atau menata sesuatu secara terstruktur. Tendensi manik atau overaktif di mana mereka cenderung terlalu aktif secara fisik atau mental.'
        },
        {
          id: 'normal',
          label: 'Normal',
          ciri: 'Mengisi ±30–70% area kertas · proporsi seimbang antara batang, dahan, mahkota · posisi wajar, tidak terlalu ke tepi · seluruh bagian pohon terlihat utuh · margin dari tepi kertas cukup · tidak ada bagian yang terpotong · batang tidak terlalu besar atau terlalu kecil · mahkota tidak berlebihan · dahan tampak seimbang · akar tidak mendominasi · garis terkendali · detail cukup · tekanan garis wajar · gambar tampak selesai',
          interpret: 'Tidak selalu berarti sehat secara psikologis, dapat ditelaah lebih dalam berdasarkan kualitas ekspresi, detail, dan konteks emosional. Menunjukkan tingkat energi yang cukup untuk berfungsi sehari-hari, tetapi tidak menunjukkan dorongan atau gairah emosional yang kuat. Bisa mencerminkan keadaan psikologis yang datar atau stabil, tergantung konteks lainnya. Mungkin tidak sepenuhnya menyadari dinamika internal, cenderung kurang reflektif, atau tidak terlalu mengenali konflik batin yang dialaminya. Sikap optimis yang ditampilkan bisa jadi hanya di permukaan. Ada kemungkinan subjek menyangkal atau menekan perasaan negatif, sehingga tampak optimis secara luar, tapi tidak disertai pemahaman mendalam terhadap masalah yang dihadapi.'
        }
      ]
    }
  ]
});
