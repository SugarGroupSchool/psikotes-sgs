/* ============================================================
   DAP — 1. Ukuran Gambar (Ukuran Figur Orang & Proporsi)
   ============================================================ */
window.GRAFIS_AUTO_DATA_DAP_SLIDES = window.GRAFIS_AUTO_DATA_DAP_SLIDES || [];

/* 🖼️ Placeholder gambar — pakai logo dulu, ganti nanti */
const IMG_DAP_UKURAN = 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png';

window.GRAFIS_AUTO_DATA_DAP_SLIDES.push({
  id: 'dap-01',
  title: '1. Ukuran Gambar',
  image: IMG_DAP_UKURAN,
  sections: [

    /* ==========================================================
       1. UKURAN FIGUR ORANG
       ========================================================== */
    {
      id: 'ukuran_figur',
      title: '1. Ukuran Figur Orang',
      type: 'checkbox',
      items: [
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: gambar sangat besar
          id: 'sangat_besar',
          label: 'Gambar Sangat Besar',
          ciri: 'Figur orang jauh lebih besar dari ukuran rata-rata · memenuhi sebagian besar kertas · proporsi tidak wajar',
          interpret: 'Mencerminkan: (1) Agresivitas dan kecenderungan bertindak secara eksternal. (2) Sikap ekspansif, fantasi tinggi, dan grandiositas — keyakinan berlebihan tentang pentingnya diri sendiri, kemampuan luar biasa, atau superioritas yang tidak realistis. (3) Aktivitas emosional berlebihan, bahkan cenderung manik. (4) Perasaan tidak mampu yang tidak disadari. (5) Dugaan gangguan organik, efek alkohol, atau masalah neuropsikologis. (6) Kesadaran moral yang lemah, potensi sifat antisosial. (7) Kecurigaan berlebih dan kecenderungan paranoid.',
          subItems: [
            {
              image: IMG_DAP_UKURAN,   // ← GANTI nanti: gambar jelek/kosong
              id: 'gambar_jelek_kosong',
              label: 'Jika Gambar Jelek atau Kosong',
              dependsOn: 'sangat_besar',
              optional: true,
              interpret: 'Terdapat indikasi kekurangan mental. Bisa menandakan adanya kesulitan atau keterbatasan dalam perkembangan kognitif — gambar ini umumnya dibuat oleh anak-anak.'
            },
            {
              image: IMG_DAP_UKURAN,   // ← GANTI nanti: ciri manik
              id: 'ciri_manik',
              label: 'Jika Digambar dengan Garis Tepi Sangat Besar (Ciri Manik)',
              dependsOn: 'sangat_besar',
              optional: true,
              interpret: 'Menunjukkan ciri-ciri manik, yaitu periode emosi yang tinggi, energik, dan kadang terlampau euforik yang dapat mengindikasikan gangguan bipolar atau episode mania.'
            }
          ]
        },
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: gambar lebih kecil
          id: 'lebih_kecil',
          label: 'Gambar Lebih Kecil dari Rata-Rata',
          ciri: 'Figur orang jauh lebih kecil dari ukuran rata-rata · berada di sudut kertas · detail minim',
          interpret: 'Mengindikasikan: (1) Rasa tidak aman, harga diri rendah, perasaan inferior. (2) Kecemasan, depresi, atau penarikan diri. (3) Ketergantungan berlebih dan perilaku kekanak-kanakan. (4) Kekuatan ego yang rendah, kecenderungan kompulsif atau neurotik. (5) Hambatan dalam interaksi sosial, pemalu, atau defensif. (6) Reaksi menarik diri saat menghadapi stres. (7) Kurang bersemangat atau kurangnya motivasi dalam mengejar tujuan atau menyelesaikan masalah. Subjek tidak merasa terpacu untuk mengatasi hambatan-hambatan yang ada.'
        },
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: gambar keluar kertas
          id: 'keluar_kertas',
          label: 'Gambar yang Keluar dari Kertas',
          ciri: 'Bagian figur (kepala, tangan, kaki) melewati batas kertas · gambar tidak muat di halaman',
          interpret: 'Mencerminkan: (1) Kesulitan merencanakan sesuatu atau menata sesuatu secara terstruktur. (2) Tendensi manik atau over-aktif — cenderung terlalu aktif secara fisik atau mental.'
        },
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: gambar normal
          id: 'normal',
          label: 'Normal (≈ 7 Inci)',
          ciri: 'Figur orang berukuran sekitar 7 inci · proporsional dengan kertas · detail wajar',
          interpret: 'Gambar dengan ukuran mendekati rata-rata (± 7 inci) tidak selalu berarti sehat secara psikologis. Ukuran "normal" tetap perlu ditelaah lebih dalam berdasarkan kualitas ekspresi, detail, dan konteks emosional subjek. Menunjukkan beberapa hal: (1) Energi yang Biasa Saja — tingkat energi yang cukup untuk berfungsi sehari-hari, tetapi tidak menunjukkan dorongan atau gairah emosional yang kuat; bisa mencerminkan keadaan psikologis yang datar atau stabil, tergantung konteks. (2) Kurang Insight (Wawasan Diri Rendah) — subjek mungkin tidak sepenuhnya menyadari dinamika internal, cenderung kurang reflektif, atau tidak terlalu mengenali konflik batin yang dialaminya. (3) Optimisme Superfisial — sikap positif yang ditampilkan bisa jadi hanya di permukaan; ada kemungkinan subjek menyangkal atau menekan perasaan negatif, sehingga tampak optimis secara luar tapi tidak disertai pemahaman mendalam terhadap masalah yang dihadapi.'
        }
      ]
    },

    /* ==========================================================
       2. UKURAN TOKOH SIMBOLIK — CITRA ORANG TUA VS IDEAL-EGO
       ========================================================== */
    {
      id: 'tokoh_simbolik',
      title: '2. Ukuran Tokoh Simbolik — Citra Orang Tua vs Ideal-Ego',
      type: 'checkbox',
      items: [
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: citra orang tua besar
          id: 'orang_tua_besar',
          label: 'Citra Orang Tua Digambar dalam Skala Besar',
          ciri: 'Tokoh yang digambar adalah ayah/ibu atau figur otoritas dominan · digambar lebih besar dari figur lain · biasanya dengan atribut otoritas',
          interpret: 'Mencerminkan: (1) Ketergantungan emosional atau tekanan psikologis terhadap figur tersebut. (2) Mungkin mencerminkan dominasi atau pengaruh kuat orang tua dalam pembentukan konsep diri subjek.'
        },
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: ideal-ego besar
          id: 'ideal_ego_besar',
          label: 'Ideal-Ego Digambarkan Besar',
          ciri: 'Tokoh yang digambar adalah figur netral / imajinatif / superhero / proyeksi diri sendiri · digambar dalam skala besar & ideal',
          interpret: 'Menandakan: (1) Aspirasi tinggi dan keinginan kuat menjadi versi ideal diri. (2) Merupakan bentuk kompensasi atas rasa rendah diri atau kegagalan aktual. (3) Subjek membangun tokoh "sempurna" sebagai pelarian fantasi dari kenyataan.'
        }
      ]
    },

    /* ==========================================================
       3. PROPORSI
       ========================================================== */
    {
      id: 'proporsi',
      title: '3. Proporsi',
      type: 'checkbox',
      items: [
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: gambar makin kecil
          id: 'makin_kecil',
          label: 'Gambaran yang Ukurannya Makin Lama Makin Kecil',
          ciri: 'Dimulai dari figur besar, lalu figur berikutnya makin kecil · biasanya digambar bertahap dari atas ke bawah',
          interpret: 'Menurut Hammer-Lehner dan Anderson, gambaran ini lebih umum pada pria yang berusia 30 tahun dan pada wanita berusia di atas 40 tahun.'
        },
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: memenuhi halaman
          id: 'penuh_halaman',
          label: 'Gambaran yang Memenuhi Seluruh Halaman Kertas',
          ciri: 'Figur orang memenuhi hampir seluruh area kertas · nyaris tidak ada ruang kosong di sekitar',
          interpret: 'Bagi Hammer, ini menunjukkan kompensasi dari fantasi kebebasan atau fantasi kekuasaan.'
        },
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: terlalu besar
          id: 'terlalu_besar_kertas',
          label: 'Gambar yang Terlalu Besar dari Kertasnya',
          ciri: 'Figur orang melampaui batas kertas · melebihi area yang tersedia secara signifikan',
          interpret: 'Dalam pandangan Hammer-Machover, subjek menunjukkan aspirasi yang melebihi kesempatan yang ada. Lingkungan dipandangnya sebagai terlalu mendesaknya.'
        },
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: amat besar
          id: 'amat_besar',
          label: 'Gambar yang Amat Besar',
          ciri: 'Figur digambar sangat besar · mendekati batas fisik kertas · intensional secara berlebihan',
          interpret: 'Menurut Machover, ini merupakan tanda dari harga diri yang besar, namun terkadang juga menunjukkan tanda paranoid.'
        },
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: besar & sesama jenis
          id: 'besar_seks_sama',
          label: 'Gambar Besar dengan Seks yang Sama dengan Subjek',
          ciri: 'Figur besar · jenis kelamin sama dengan subjek (pria gambar pria / wanita gambar wanita)',
          interpret: 'Menurut Hammer-Levy, ini mengarah pada agresi dan kecenderungan untuk menguasai orang lain.'
        },
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: besar & beda jenis
          id: 'besar_seks_berlawanan',
          label: 'Gambar Besar dengan Seks yang Berlawanan dengan Subjek',
          ciri: 'Figur besar · jenis kelamin berlawanan dengan subjek (pria gambar wanita / wanita gambar pria)',
          interpret: 'Menurut Hammer-Levy dan Machover, ini menunjukkan kecenderungan kepasifan dan seks yang berlawanan dipandang lebih berkuasa atau lebih kuat.'
        },
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: obesitas gambar kurus
          id: 'obesitas_kurus',
          label: 'Subjek Obesitas dengan Gambar Kurus',
          ciri: 'Subjek nyata memiliki tubuh gemuk · tapi gambar yang dibuat adalah figur sangat kurus',
          interpret: 'Bagi Hammer, ini adalah tanda yang membuktikan prognosa yang berhasil untuk penyembuhan atas kegemukan.'
        },
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: amat kecil
          id: 'amat_kecil',
          label: 'Gambar yang Amat Kecil',
          ciri: 'Figur sangat kecil · menempati area minimal di kertas · sering di sudut · detail terkadang minim',
          interpret: 'Dalam pandangan Hammer-Wachner, Harrowick, Elkisch, ini menunjukkan kecemasan dan ketergantungan secara emosional. Ada perasaan yang tidak nyaman dan merasa adanya pembatasan, serta ingin melarikan diri.'
        },
        {
          image: IMG_DAP_UKURAN,   // ← GANTI nanti: kecil & sesama jenis
          id: 'kecil_seks_sama',
          label: 'Gambar Kecil dengan Seks yang Sama dengan Subjek',
          ciri: 'Figur kecil · jenis kelamin sama dengan subjek · biasanya di sudut kertas',
          interpret: 'Menurut Hammer-Levy, ini mewakili perasaan-perasaan yang tidak sesuai atau tidak cocok.'
        }
      ]
    }

  ]
});
