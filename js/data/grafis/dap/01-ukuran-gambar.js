/* ============================================================
   DAP — Ukuran Gambar (3 Slide)
   ============================================================ */
window.GRAFIS_AUTO_DATA_DAP_SLIDES = window.GRAFIS_AUTO_DATA_DAP_SLIDES || [];

/* ============================================================
   SLIDE 1 — UKURAN FIGUR ORANG
   ============================================================ */
window.GRAFIS_AUTO_DATA_DAP_SLIDES.push({
  id: 'dap-ukuran-figur',
  title: 'Ukuran Figur Orang',
  sections: [
    {
      id: 'ukuran_figur',
      title: 'Ukuran Figur Orang',
      type: 'checkbox',
      items: [
        {
          id: 'sangat_besar',
          label: 'Gambar Sangat Besar',
          ciri: 'Figur orang jauh lebih besar dari ukuran rata-rata · memenuhi sebagian besar kertas · proporsi tidak wajar · tinggi figur melebihi 23 cm / 9 inci · figur mendominasi seluruh halaman · kepala bisa mendekati tepi atas · kaki mendekati tepi bawah · kedua tangan melebar hampir menyentuh sisi kertas · tidak ada margin yang cukup · figur tampak "meluber" keluar bidang · bagian tubuh bisa terpotong ringan oleh tepi · detail berlebihan pada bagian tertentu · garis tepi hampir menyentuh pinggir kertas · ruang kosong di sekeliling sangat sedikit',
          interpret: 'Mencerminkan: (1) Agresivitas dan kecenderungan bertindak secara eksternal. (2) Sikap ekspansif, fantasi tinggi, dan grandiositas — keyakinan berlebihan tentang pentingnya diri sendiri, kemampuan luar biasa, atau superioritas yang tidak realistis. (3) Aktivitas emosional berlebihan, bahkan cenderung manik. (4) Perasaan tidak mampu yang tidak disadari. (5) Dugaan gangguan organik, efek alkohol, atau masalah neuropsikologis. (6) Kesadaran moral yang lemah, potensi sifat antisosial. (7) Kecurigaan berlebih dan kecenderungan paranoid.',
          subItems: [
            {
              id: 'gambar_jelek_kosong',
              label: 'Jika Gambar Jelek atau Kosong',
              dependsOn: 'sangat_besar',
              optional: true,
              ciri: 'Garis tidak teratur · banyak area kosong tanpa detail · coretan sembarangan · tidak ada usaha memperindah · bentuk tubuh tidak dikenali · proporsi kacau · kepala/badan/tangan tidak jelas · kualitas gambar tampak regresif · detail minim · garis ragu-ragu atau kacau',
              interpret: 'Terdapat indikasi kekurangan mental. Bisa menandakan adanya kesulitan atau keterbatasan dalam perkembangan kognitif — gambar ini umumnya dibuat oleh anak-anak.'
            },
            {
              id: 'ciri_manik',
              label: 'Jika Digambar dengan Garis Tepi Sangat Besar (Ciri Manik)',
              dependsOn: 'sangat_besar',
              optional: true,
              ciri: 'Garis luar figur sangat tebal dan menonjol · mengelilingi seluruh gambar · seperti bingkai besar · kontras dengan isi gambar · garis tepi lebih dominan daripada bagian dalam · bisa berlapis atau ditebalkan berulang · detail di dalam figur tertutup atau kalah oleh garis tepi',
              interpret: 'Menunjukkan ciri-ciri manik, yaitu periode emosi yang tinggi, energik, dan kadang terlampau euforik yang dapat mengindikasikan gangguan bipolar atau episode mania.'
            }
          ]
        },
        {
          id: 'lebih_kecil',
          label: 'Gambar Lebih Kecil dari Rata-Rata',
          ciri: 'Figur orang jauh lebih kecil dari ukuran rata-rata · berada di sudut kertas · detail minim · tinggi figur kurang dari 5 cm / 2 inci · figur hanya menempati area kecil di kertas · banyak ruang kosong di sekeliling · garis tipis dan ragu-ragu · proporsi mini · figur tampak "tenggelam" di halaman · tidak memanfaatkan bidang kertas · margin sangat lebar di semua sisi',
          interpret: 'Mengindikasikan: (1) Rasa tidak aman, harga diri rendah, perasaan inferior. (2) Kecemasan, depresi, atau penarikan diri. (3) Ketergantungan berlebih dan perilaku kekanak-kanakan. (4) Kekuatan ego yang rendah, kecenderungan kompulsif atau neurotik. (5) Hambatan dalam interaksi sosial, pemalu, atau defensif. (6) Reaksi menarik diri saat menghadapi stres. (7) Kurang bersemangat atau kurangnya motivasi dalam mengejar tujuan atau menyelesaikan masalah.'
        },
        {
          id: 'keluar_kertas',
          label: 'Gambar yang Keluar dari Kertas',
          ciri: 'Bagian figur melewati batas kertas · gambar tidak muat di halaman · kepala / tangan / kaki terpotong tepi kertas · ada bagian tubuh yang hilang karena terpotong · garis berhenti tepat di tepi · figur tampak dipaksa masuk ke dalam kertas · bagian luar figur tidak selesai atau tidak terlihat · ada garis yang mengarah ke luar kertas · posisi figur terlalu dekat dengan tepi',
          interpret: 'Mencerminkan: (1) Kesulitan merencanakan sesuatu atau menata sesuatu secara terstruktur. (2) Tendensi manik atau over-aktif — cenderung terlalu aktif secara fisik atau mental.'
        },
        {
          id: 'normal',
          label: 'Normal (≈ 7 Inci)',
          ciri: 'Figur berukuran sekitar 7 inci · proporsional dengan kertas · detail wajar · tinggi figur sekitar 17–18 cm · figur memiliki margin yang cukup di sekeliling · kepala, badan, tangan, kaki tampak utuh · tidak ada bagian yang terpotong · proporsi tubuh wajar · garis terkendali · detail cukup, tidak berlebihan dan tidak minim · tekanan garis wajar · posisi figur di tengah atau sedikit bergeser · seluruh figur terlihat selesai',
          interpret: 'Gambar dengan ukuran mendekati rata-rata (± 7 inci) tidak selalu berarti sehat secara psikologis. Menunjukkan: (1) Energi yang Biasa Saja — tingkat energi cukup untuk berfungsi sehari-hari, tetapi tidak menunjukkan dorongan atau gairah emosional kuat. (2) Kurang Insight — subjek mungkin tidak sepenuhnya menyadari dinamika internal, cenderung kurang reflektif. (3) Optimisme Superfisial — sikap positif bisa jadi hanya di permukaan; subjek menyangkal atau menekan perasaan negatif.'
        }
      ]
    }
  ]
});

/* ============================================================
   SLIDE 2 — UKURAN TOKOH SIMBOLIK
   ============================================================ */
window.GRAFIS_AUTO_DATA_DAP_SLIDES.push({
  id: 'dap-tokoh-simbolik',
  title: 'Ukuran Tokoh Simbolik — Citra Orang Tua vs Ideal-Ego',
  sections: [
    {
      id: 'tokoh_simbolik',
      title: 'Ukuran Tokoh Simbolik',
      type: 'checkbox',
      items: [
        {
          id: 'orang_tua_besar',
          label: 'Citra Orang Tua Digambar dalam Skala Besar',
          ciri: 'Tokoh yang digambar adalah ayah/ibu atau figur otoritas dominan · digambar lebih besar dari figur lain · ukuran figur melebihi rata-rata · sering diberi detail berlebihan · figur tampak mengancam atau mendominasi · proporsi lebih besar dari figur subjek sendiri · kadang ada simbol kekuasaan (tongkat, seragam, mahkota)',
          interpret: 'Mencerminkan: (1) Ketergantungan emosional atau tekanan psikologis terhadap figur tersebut. (2) Dominasi atau pengaruh kuat orang tua dalam pembentukan konsep diri subjek.'
        },
        {
          id: 'ideal_ego_besar',
          label: 'Ideal-Ego Digambarkan Besar',
          ciri: 'Tokoh yang digambar adalah figur netral / imajinatif / superhero / proyeksi diri sendiri · digambar dalam skala besar & ideal · figur tampak sempurna · proporsi ideal · sering diberi atribut kekuatan (kostum, otot, senjata) · tidak ada kekurangan yang ditampilkan · detail berlebihan pada bagian yang dianggap unggul · figur berdiri tegak dan dominan',
          interpret: 'Menandakan: (1) Aspirasi tinggi dan keinginan kuat menjadi versi ideal diri. (2) Bentuk kompensasi atas rasa rendah diri atau kegagalan aktual. (3) Subjek membangun tokoh "sempurna" sebagai pelarian fantasi dari kenyataan.'
        }
      ]
    }
  ]
});

/* ============================================================
   SLIDE 3 — PROPORSI
   ============================================================ */
window.GRAFIS_AUTO_DATA_DAP_SLIDES.push({
  id: 'dap-proporsi',
  title: 'Proporsi',
  sections: [
    {
      id: 'proporsi',
      title: 'Proporsi',
      type: 'checkbox',
      items: [
        {
          id: 'makin_kecil',
          label: 'Gambaran yang Ukurannya Makin Lama Makin Kecil',
          ciri: 'Dimulai dari figur besar, lalu figur berikutnya makin kecil · urutan figur menurun ukurannya · figur pertama paling besar · figur kedua lebih kecil · figur ketiga lebih kecil lagi · ada tren pengecilan yang jelas · proporsi antar figur tidak konsisten · jarak antar figur bisa tetap atau menyempit',
          interpret: 'Menurut Hammer-Lehner dan Anderson, gambaran ini lebih umum pada pria yang berusia 30 tahun dan pada wanita berusia di atas 40 tahun.'
        },
        {
          id: 'penuh_halaman',
          label: 'Gambaran yang Memenuhi Seluruh Halaman Kertas',
          ciri: 'Figur memenuhi hampir seluruh area kertas · nyaris tidak ada ruang kosong · figur membentang dari tepi ke tepi · semua bagian kertas terisi · baik dengan satu figur besar atau beberapa figur yang tersebar · tidak ada margin yang berarti · komposisi padat',
          interpret: 'Bagi Hammer, ini menunjukkan kompensasi dari fantasi kebebasan atau fantasi kekuasaan.'
        },
        {
          id: 'terlalu_besar_kertas',
          label: 'Gambar yang Terlalu Besar dari Kertasnya',
          ciri: 'Figur melampaui batas kertas · melebihi area yang tersedia secara signifikan · bagian tubuh terpotong tepi kertas · figur tidak bisa dilihat utuh dalam satu lembar · ada bagian yang hilang · garis keluar dari bidang gambar',
          interpret: 'Dalam pandangan Hammer-Machover, subjek menunjukkan aspirasi yang melebihi kesempatan yang ada. Lingkungan dipandangnya sebagai terlalu mendesaknya.'
        },
        {
          id: 'amat_besar',
          label: 'Gambar yang Amat Besar',
          ciri: 'Figur digambar sangat besar · mendekati batas fisik kertas · tinggi figur melebihi 25 cm / 10 inci · figur mendominasi halaman · kepala hampir menyentuh tepi atas · kaki hampir menyentuh tepi bawah · tangan melebar ke samping · tidak ada ruang kosong berarti',
          interpret: 'Menurut Machover, ini merupakan tanda dari harga diri yang besar, namun terkadang juga menunjukkan tanda paranoid.'
        },
        {
          id: 'besar_seks_sama',
          label: 'Gambar Besar dengan Seks yang Sama dengan Subjek',
          ciri: 'Figur besar · jenis kelamin sama dengan subjek · ukuran melebihi rata-rata · proporsi dominan · sering diberi atribut maskulin/feminin yang jelas · figur tampak kuat · bisa dalam posisi menantang atau menguasai',
          interpret: 'Menurut Hammer-Levy, ini mengarah pada agresi dan kecenderungan untuk menguasai orang lain.'
        },
        {
          id: 'besar_seks_berlawanan',
          label: 'Gambar Besar dengan Seks yang Berlawanan dengan Subjek',
          ciri: 'Figur besar · jenis kelamin berlawanan dengan subjek · ukuran melebihi rata-rata · proporsi dominan · figur tampak kuat atau berkuasa · sering diberi atribut kekuatan pada figur lawan jenis',
          interpret: 'Menurut Hammer-Levy dan Machover, ini menunjukkan kecenderungan kepasifan dan seks yang berlawanan dipandang lebih berkuasa atau lebih kuat.'
        },
        {
          id: 'obesitas_kurus',
          label: 'Subjek Obesitas dengan Gambar Kurus',
          ciri: 'Subjek nyata bertubuh gemuk · tapi gambar yang dibuat adalah figur sangat kurus · ada kontras jelas antara tubuh nyata dan gambar · figur digambar dengan garis ramping · tidak ada detail gemuk · proporsi kurus konsisten di seluruh tubuh',
          interpret: 'Bagi Hammer, ini adalah tanda yang membuktikan prognosa yang berhasil untuk penyembuhan atas kegemukan.'
        },
        {
          id: 'amat_kecil',
          label: 'Gambar yang Amat Kecil',
          ciri: 'Figur sangat kecil · menempati area minimal di kertas · sering di sudut · tinggi figur kurang dari 3 cm · figur hanya berupa sketsa kecil · detail sangat minim · garis tipis dan ragu · banyak ruang kosong di sekeliling · figur tampak "hilang" di halaman',
          interpret: 'Dalam pandangan Hammer-Wachner, Harrowick, Elkisch, ini menunjukkan kecemasan dan ketergantungan secara emosional. Ada perasaan yang tidak nyaman dan merasa adanya pembatasan, serta ingin melarikan diri.'
        },
        {
          id: 'kecil_seks_sama',
          label: 'Gambar Kecil dengan Seks yang Sama dengan Subjek',
          ciri: 'Figur kecil · jenis kelamin sama dengan subjek · biasanya di sudut kertas · ukuran minimal · detail sedikit · garis tipis · proporsi mini · figur tampak tidak berarti',
          interpret: 'Menurut Hammer-Levy, ini mewakili perasaan-perasaan yang tidak sesuai atau tidak cocok.'
        }
      ]
    }
  ]
});
