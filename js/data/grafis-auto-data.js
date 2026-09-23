/* ============================================================
   DATA INTERPRETASI OTOMATIS — GRAFIS (DAP, BAUM, HTP)
   ------------------------------------------------------------
   v2 [2026-09-23]: BAUM LENGKAP (13 grup)
   - Ukuran, Kesan, Penempatan, Kualitas Garis
   - Akar, Stambasis, Bentuk Batang
   - Dahan, Mahkota, Streep, Buah, Rumput, Fitur Khusus
   DAP & HTP: placeholder
   ============================================================ */

window.GRAFIS_AUTO_DATA = {

  /* ==========================================================
     BAUM — TREE TEST
     ========================================================== */
  baum: {
    title: 'BAUM — Tree Test',
    subtitle: 'Interpretasi otomatis berdasarkan pedoman Baum',
    icon: '🌳',
    theme: {
      primary: '#16a34a',
      primaryDark: '#15803d',
      bg: '#f0fdf4',
      border: '#bbf7d0'
    },
    groups: [

      /* ======================================================
         1. UKURAN GAMBAR
         ====================================================== */
      {
        id: 'ukuran',
        title: '1. Ukuran Gambar',
        sections: [
          {
            id: 'ukuran_kertas',
            title: 'Perbandingan dengan Ukuran Kertas',
            type: 'radio',
            items: [
              { id: 'normal', label: 'Normal (≈ 2/3 folio)', interpret: 'Ukuran gambar proporsional terhadap kertas. Menunjukkan perencanaan yang memadai dalam mengisi ruang, kemampuan mengukur realitas secara wajar, serta kontrol ego yang cukup.' },
              { id: 'terlalu_besar', label: 'Terlalu besar', interpret: 'Indikasi agresivitas, sikap ekspansif, fantasi tinggi, dan grandiositas. Dapat juga mencerminkan aktivitas emosional berlebihan atau perasaan tidak mampu yang tidak disadari.' },
              { id: 'terlalu_kecil', label: 'Terlalu kecil', interpret: 'Indikasi rasa tidak aman, harga diri rendah, perasaan inferior, kecemasan, depresi, ketergantungan berlebih, kekuatan ego rendah, hambatan sosial, dan reaksi menarik diri saat menghadapi stres.' },
              { id: 'keluar_kertas', label: 'Keluar dari kertas', interpret: 'Kesulitan merencanakan atau menata sesuatu secara terstruktur, tendensi manik atau over-aktif.' }
            ]
          },
          {
            id: 'mahkota_batang',
            title: 'Perbandingan Mahkota & Batang',
            type: 'radio',
            items: [
              { id: 'normal_mb', label: 'Normal (mahkota ≈ 2/3 batang)', interpret: 'Proporsi mahkota dan batang seimbang. Menunjukkan keseimbangan antara kehidupan berpikir/fantasi dengan fungsi praktis dan kemampuan mengakar pada realitas.' },
              { id: 'mahkota_besar', label: 'Mahkota lebih besar', interpret: 'Dominasi dunia ide, fantasi, aspirasi, dan pemikiran abstrak dibanding aspek praktis dan realitas.' },
              { id: 'batang_besar', label: 'Batang lebih besar', interpret: 'Dominasi fungsi praktis, dorongan primitif, atau kekakuan. Menekankan pada kekuatan dan stabilitas konkret.' }
            ]
          }
        ]
      },

      /* ======================================================
         2. KESAN GAMBAR
         ====================================================== */
      {
        id: 'kesan',
        title: '2. Kesan Gambar',
        sections: [
          {
            id: 'kesan_umum',
            title: 'Kesan Umum Gambar',
            type: 'checkbox',
            items: [
              { id: 'jelas', label: 'Jelas & mudah dimengerti', interpret: 'Keterbacaan gambar yang baik menunjukkan kemampuan menyampaikan pesan visual secara terarah dan struktur berpikir yang jelas.' },
              { id: 'abstrak', label: 'Abstrak / kurang jelas', interpret: 'Kesan abstrak dapat mencerminkan kurangnya kejelasan struktur internal atau kesulitan mengomunikasikan isi pikiran secara konkret.' },
              { id: 'hidup', label: 'Tampak hidup', interpret: 'Gambar terlihat hidup dan beraktivitas — menunjukkan energi psikis yang tersalurkan, vitalitas, dan keberlanjutan fungsi mental.' },
              { id: 'mati', label: 'Tampak mati / kaku', interpret: 'Gambar statis dan mati dapat mencerminkan pengurangan vitalitas psikis, kekakuan, atau penekanan emosi.' },
              { id: 'dinamis', label: 'Dinamis', interpret: 'Kesan dinamis menunjukkan energi dan kemampuan untuk berubah, bergerak, serta mengekspresikan pengalaman batin.' },
              { id: 'statis', label: 'Statis / rigid', interpret: 'Kesan statis dapat menunjukkan ketenangan atau kepasifan, kekakuan, dan kesulitan beradaptasi terhadap perubahan.' }
            ]
          }
        ]
      },

      /* ======================================================
         3. PENEMPATAN / LOKASI
         ====================================================== */
      {
        id: 'lokasi',
        title: '3. Penempatan / Lokasi (Simbolik Ruang)',
        sections: [
          {
            id: 'zona_utama',
            title: 'Zona Utama',
            type: 'checkbox',
            items: [
              { id: 'tengah', label: 'Cenderung di tengah', interpret: 'Kecenderungan harmonis dan seimbang; subjek berupaya mencari keseimbangan antara berbagai aspek kehidupan dan tidak terlalu condong ke arah ekstrem. Mudah beradaptasi dengan hal-hal yang nyata. Memiliki kesadaran individual dan objektif. Sphere dari ego yang empiris — mendekati kehidupan berdasarkan pengalaman dan fakta, dengan pendekatan pragmatis dan rasional.' },
              { id: 'kiri', label: 'Cenderung ke kiri', interpret: 'Ke arah aku (ego) — fokus pada diri sendiri, orientasi introspektif; dipengaruhi masa lampau; introvert; terlalu menghubungkan segala sesuatu ke dalam dirinya secara subjektif; senang menimbang diri sendiri; sukar dipengaruhi; senang menyembunyikan masalah.' },
              { id: 'kanan', label: 'Cenderung ke kanan', interpret: 'Ekstrovert; orientasi ke arah masa yang akan datang; lebih terbuka; lebih objektif dalam menilai situasi; lebih mudah dipengaruhi dunia luar dan responsif terhadap ide-ide baru.' },
              { id: 'atas', label: 'Cenderung ke atas', interpret: 'Penuh dengan dunia ide; imajinatif; intelektual; kesadaran yang over individual — lebih fokus pada pikiran, pandangan, atau pengalaman pribadi dan cenderung intro-spektif.' },
              { id: 'bawah', label: 'Cenderung ke bawah', interpret: 'Mudah didominasi oleh drive-nya (ketidaksadaran) — pengaruh signifikan dari lapisan tak sadar atau dorongan-dorongan yang tidak sepenuhnya disadari. Fokus pada pembawaan, substansi, lapisan primitif, dorongan, dan emosi.' }
            ]
          },
          {
            id: 'sudut',
            title: 'Sudut Spesifik',
            type: 'checkbox',
            items: [
              { id: 'kiri_atas', label: 'Sudut kiri atas', interpret: 'Normal bila digambar oleh anak; bila oleh orang dewasa menunjukkan tendensi regresi. Juga mengindikasikan rasa tidak aman atau cemas. Indikasi psikotik bila proporsi mahkota-batang tidak baik dan bentuk cabang/batang dipaksakan.' },
              { id: 'kanan_atas', label: 'Sudut kanan atas', interpret: 'Hasrat menekankan pada hal yang tidak menyenangkan; terlalu optimis pada hal yang berkaitan masa depan. Juga mengindikasikan keinginan menghilangkan orientasi ke depan.' },
              { id: 'kanan_bawah', label: 'Sudut kanan bawah', interpret: 'Kecenderungan timbulnya rasa tak aman, perasaan takut berdiri sendiri, dependen kuat, cemas, ada keinginan menghindari pengalaman baru dan lebih suka berorientasi pada fantasi. Indikasi depresi pada gambar yang kecil.' },
              { id: 'kiri_bawah', label: 'Sudut kiri bawah', interpret: 'Kondisi depresif karena terpengaruh masa lalu. Bila kurang proporsional, garis kurang baik, dan shading kuat — kecenderungan depresif.' }
            ]
          }
        ]
      },

      /* ======================================================
         4. KUALITAS GARIS
         ====================================================== */
      {
        id: 'garis',
        title: '4. Kualitas Garis',
        sections: [
          {
            id: 'kualitas_garis',
            title: 'Karakteristik Garis',
            type: 'checkbox',
            items: [
              { id: 'tekanan_kuat', label: 'Tekanan kuat', interpret: 'Menyiratkan dorongan, kebutuhan, atau hasrat personal yang kuat. Mencerminkan kekuatan subjek mencapai tujuan atau mengatasi ketegangan. Pada gambar besar, dapat mengindikasikan ambisi tinggi.' },
              { id: 'tebal_tidak_teratur', label: 'Garis tebal dan tidak teratur', interpret: 'Indikasi impulsivitas, reaksi cepat, kurang terkontrol, dan sifat agresif. Garis tebal menunjukkan intensitas emosional tinggi.' },
              { id: 'tekanan_lemah', label: 'Tekanan lemah', interpret: 'Menunjukkan rasa enggan atau kurang semangat, terutama pada gambar kecil dan terletak di bawah. Mencerminkan ketidakpastian atau kurangnya motivasi.' },
              { id: 'lemah_tidak_terarah', label: 'Garis lemah dan tidak terarah', interpret: 'Menunjukkan sikap ragu-ragu, ketidakpastian, atau kurangnya fokus dan tujuan yang jelas.' },
              { id: 'terputus', label: 'Garis terputus-putus dan tidak konstruktif', interpret: 'Mengindikasikan sikap ragu-ragu atau tidak konsisten. Garis terputus dengan tekanan lemah bisa menunjukkan keinginan aktivitas yang tidak terkendali atau kurangnya kendali diri.' },
              { id: 'shading', label: 'Ada shading', interpret: 'Shading dapat mencerminkan kecemasan dan mungkin menghasilkan kecenderungan neurotik sebagai manifestasi rasa tidak aman. Pada anak, shading normal dianggap sebagai respons kreatif yang wajar.' }
            ]
          }
        ]
      },

      /* ======================================================
         5. AKAR
         ====================================================== */
      {
        id: 'akar',
        title: '5. Akar',
        sections: [
          {
            id: 'jenis_akar',
            title: 'Jenis Akar',
            type: 'radio',
            items: [
              { id: 'akar_1_garis', label: 'Akar dengan satu garis', interpret: 'Akar satu garis umumnya terlihat pada anak-anak hingga kelas 2 SD. Kadang ditemukan juga pada orang dengan kecenderungan kekurangan intelektual, menandakan taraf primitivitas serta kehidupan magis yang masih terpapar secara tidak sadar.' },
              { id: 'akar_2_garis', label: 'Akar dengan dua garis (normal)', interpret: 'Akar dengan dua garis menunjukkan karakteristik normal. Bisa berupa akar tertutup atau terbuka, yang masing-masing mencerminkan kemampuan subjek mengatasi dorongan dan keterbukaan terhadap pengaruh luar.' },
              { id: 'tidak_ada_akar', label: 'Tidak ada akar', interpret: 'Orang dewasa biasanya tidak menggambar akar — dapat mengindikasikan bahwa fokus penggambaran lebih pada aspek yang lebih terlihat atau dipertimbangkan dalam konteks sosial.' }
            ]
          },
          {
            id: 'kondisi_akar',
            title: 'Kondisi Akar',
            type: 'checkbox',
            items: [
              { id: 'akar_tertutup', label: 'Akar tertutup', interpret: 'Akar tertutup seperti kulit akar yang bertindak sebagai filter — menandakan subjek masih mampu menyelesaikan dan mengelola dorongan-dorongan yang muncul. Menggambarkan kemampuan menyeleksi dan memproses dorongan secara hati-hati sebelum bertindak.' },
              { id: 'akar_terbuka', label: 'Akar terbuka', interpret: 'Akar terbuka mencerminkan situasi di mana segala sesuatu diterima tanpa proses seleksi atau penyaringan. Menunjukkan impulsivitas, kelemahan struktur kepribadian, dan ambisi besar yang tidak diimbangi rasa mampu.' },
              { id: 'akar_menonjol', label: 'Akar menonjol', interpret: 'Anak laki-laki cenderung mengekspresikan akar yang menonjol sekitar usia 12 tahun, anak perempuan sekitar 14 tahun. Ketika orang dewasa menggambarkan akar, ini mencerminkan perjuangan menemukan pegangan dalam hidup atau menunjukkan subjek belum sepenuhnya menerima tanggung jawab dewasa.' },
              { id: 'akar_gantung', label: 'Akar gantung', interpret: 'Akar gantung sebagai indikasi sifat dependen — subjek cenderung bergantung pada faktor eksternal atau orang lain untuk memenuhi kebutuhan emosional atau mendukung kesejahteraan mereka.' }
            ]
          }
        ]
      },

      /* ======================================================
         6. PANGKAL BATANG / STAMBASIS
         ====================================================== */
      {
        id: 'stambasis',
        title: '6. Pangkal Batang (Stambasis)',
        sections: [
          {
            id: 'stambasis_kiri',
            title: 'Lebar Pangkal Batang Kiri',
            type: 'radio',
            items: [
              { id: 'tidak_ada', label: 'Tidak ada penebalan', interpret: 'Pangkal batang normal tanpa penebalan di sisi kiri.' },
              { id: 'lebih_besar', label: 'Lebih besar di sisi kiri', interpret: 'Mengindikasikan hambatan atau perasaan terhambat pada subjek. Sisi kiri melambangkan masa lampau dan penekanan pada hal-hal yang telah terjadi sebelumnya — simbolisasi masa lampau dan pengalaman negatif. Menunjukkan upaya subjek memperkuat diri dari pengalaman tersebut. Perlu diperhatikan ikatan emosional dengan ibu atau figur pengganti peran ibu.' }
            ]
          },
          {
            id: 'stambasis_kanan',
            title: 'Lebar Pangkal Batang Kanan',
            type: 'radio',
            items: [
              { id: 'tidak_ada_k', label: 'Tidak ada penebalan', interpret: 'Pangkal batang normal tanpa penebalan di sisi kanan.' },
              { id: 'lebih_besar_k', label: 'Lebih besar di sisi kanan', interpret: 'Mengindikasikan hambatan emosional terhadap masa lalu dan masa depan, menandakan rasa terhambat secara menyeluruh. Anak-anak dengan gambaran batang seperti ini cenderung terjebak dalam situasi diam, enggan melangkah maju atau mundur, dan kesulitan belajar akibat rasa takut akan kegagalan.' }
            ]
          },
          {
            id: 'batas_bawah',
            title: 'Posisi Pangkal Batang',
            type: 'radio',
            items: [
              { id: 'di_atas_kertas', label: 'Di atas batas bawah kertas', interpret: 'Penggambaran pangkal batang pada batas kertas yang dianggap sebagai tanah tempat pohon berdiri. Ketika anak-anak menggambar seperti ini hingga usia 10-12 tahun, dipandang sebagai tahap perkembangan yang wajar. Namun jika orang dewasa, mengindikasikan sikap regresif dan kecenderungan keterhambatan dalam perkembangan intelektual dan kematangan emosional.' },
              { id: 'di_batas_bawah', label: 'Di batas bawah kertas', interpret: 'Anak-anak sering mulai menggambar pada batas kertas bagian bawah karena secara simbolis merespons ruang sosial yang terwakili oleh kertas. Perkembangan ini menggambarkan awal dari kematangan sosio-emosional.' }
            ]
          }
        ]
      },

      /* ======================================================
         7. BENTUK BATANG
         ====================================================== */
      {
        id: 'batang',
        title: '7. Bentuk Batang',
        sections: [
          {
            id: 'bentuk_batang_utama',
            title: 'Bentuk Batang Utama',
            type: 'checkbox',
            items: [
              { id: 'kerucut', label: 'Bentuk batang kerucut', interpret: 'Subjek lebih suka menghadapi hal dengan cara jelas dan langsung. Tidak suka berspekulasi atau memikirkan hal abstrak. Fokus pada hal nyata dan membuat keputusan berdasarkan fakta konkret. Cenderung statis (tidak suka perubahan), gejala retardasi, kemungkinan lambat belajar, lebih praktis tetapi motorik agak kasar.' },
              { id: 'membengkak', label: 'Batang membengkak', interpret: 'Menunjukkan adanya hambatan dalam pengungkapan atau pengelolaan afeksi. Ada kebutuhan yang tidak tersalurkan — subjek memiliki kebutuhan emosional dan psikologis, tetapi kurang mendapat perhatian atau pemahaman memadai. Dampaknya melibatkan ketidaknyamanan emosional, ketidakseimbangan psikologis, dan kesulitan berinteraksi sosial.' },
              { id: 'menonjol', label: 'Batang menonjol', interpret: 'Trauma atau kesukaran yang benar-benar dirasakan — pengalaman emosional sangat kuat, baik berupa trauma atau kesukaan yang dirasakan mendalam, menciptakan jejak yang dalam pada pikiran dan emosi. Biasanya sesudah sakit atau kecelakaan (dirasakan subjektif).' },
              { id: 'meliuk', label: 'Batang meliuk', interpret: 'Batang meliuk dengan lengkungan dan gerakan hidup — mencerminkan vitalitas dan kehidupan yang kuat dalam kepribadian subjek. Garis dinamis dan lincah menunjukkan energi positif, semangat, dan kemampuan bersikap dinamis dalam menghadapi situasi. Subjek terbuka terhadap perubahan, memiliki kemampuan beradaptasi, dan menghadapi tantangan dengan keberanian.' },
              { id: 'berbelok', label: 'Batang berbelok-belok', interpret: 'Subjek berpegang teguh pada prinsip meskipun gambar terkesan kurang stabil. Memiliki integritas dan konsistensi dalam keyakinan. Sering menentang hatinya sendiri — konflik internal atau pertentangan antara keputusan/tindakan dengan apa yang dirasakan. Mengindikasikan ketidakjelasan internal atau ambivalensi terus-menerus.' },
              { id: 'ditumpuk', label: 'Batang ditumpuk-tumpuk', interpret: 'Sampai umur 13 tahun dianggap normal. Lebih dari 13 tahun mengarah pada debil (perubahan perilaku dan fungsi mental menuju arah debil setelah usia 13 tahun). Daya kombinasi kurang, tak logis, tak ada pertimbangan, kurang abstraksi, ganti-ganti pekerjaan, tanda nervous.' },
              { id: 'terbuka_ujungnya', label: 'Batang terbuka ujungnya', interpret: 'Serba ingin tahu, tidak terarah tujuannya, tidak dapat memutuskan sesuatu, tidak mau mengikat diri, daya cipta kurang, mudah marah, kurang stabil, suggestible.' },
              { id: '3_dimensi', label: 'Batang 3 dimensi', interpret: 'Memiliki potensi/bakat yang luar biasa pada subjek. Bakat dapat dihubungkan dengan keunggulan dalam kemampuan tertentu atau potensi berkembang dalam suatu bidang. Mempunyai ide yang baik — indikasi kecerdasan/daya pikir kreatif. Orisinil — mampu menghasilkan ide/tindakan tidak umum. Percaya pada diri sendiri. Dapat berdiri sendiri — kemandirian, tidak terlalu bergantung pada bantuan orang lain.' },
              { id: 'condong_kiri', label: 'Batang condong ke kiri', interpret: 'Menahan perasaannya sendiri. Kondisi ini mencerminkan kecenderungan untuk menahan atau menyembunyikan perasaan. Subjek mengalami kesulitan dalam mengungkapkan rasa secara terbuka atau memiliki penghalang psikologis terhadap keterbukaan emosional.' },
              { id: 'condong_kanan', label: 'Batang condong ke kanan', interpret: 'Terikat pada masa lalu — batang condong ke kiri dapat diartikan sebagai simbol keterikatan pada masa lalu. Subjek mengalami kesulitan untuk melepaskan atau bergerak maju dari pengalaman atau kenangan masa lalu yang memiliki dampak pada kesejahteraan psikologisnya.' },
              { id: 'bergelombang', label: 'Batang bergelombang sejajar', interpret: 'Menunjukkan kemampuan yang baik dalam menyesuaikan diri secara sosial, menunjukkan sikap yang tidak selalu mencari konflik. Dapat dilihat sebagai tanda sifat diplomatis yang dimiliki subjek.' },
              { id: 'discontinuous', label: 'Batang discontinuous (tidak bersambung)', interpret: 'Keraguan dan ketidakpastian dalam tindakan. Jika coretan diulang atau dipertebal — usaha menampilkan sikap tegas meskipun penuh keraguan. Garis sangat halus, tipis, dan coretan pendek — vitalitas rendah, ketidakpastian, rentan terhadap serangan, waspada berlebihan, kurang kesabaran, mudah tersinggung.' },
              { id: 'kiri_tidak_teratur', label: 'Kiri batang tidak teratur', interpret: 'Keraguan dan masalah dalam interaksi sosial di masa lalu. Kulit batang mencerminkan cara kita berhubungan dengan lingkungan sekitar. Jika sisi kanan lurus dan teratur, itu menunjukkan sikap baik dan seimbang secara eksternal. Namun jika sisi kiri berliku-liku, itu menandakan kesulitan beradaptasi dan bersosialisasi dengan orang lain, disembunyikan dengan citra eksternal yang tampak baik.' }
            ]
          },
          {
            id: 'kondisi_batang',
            title: 'Kondisi Batang',
            type: 'checkbox',
            items: [
              { id: 'keroak', label: 'Batang keroak', interpret: 'Rasa bersalah yang besar dan kecenderungan rasa minder. Subjek mengalami beban emosional berat yang dapat menghasilkan rasa minder atau rendah diri. Perasaan bersalah yang signifikan dapat menjadi beban berat secara emosional, membentuk citra diri negatif. Kemungkinan pernah mengalami trauma yang tidak hanya memengaruhi pikiran tetapi juga meresap ke respons emosional — menciptakan citra visual kuat.' },
              { id: 'berlubang', label: 'Batang berlubang / terkelupas kulitnya', interpret: 'Kondisi batang dengan lubang dan terkelupas dianggap sebagai indikator kejadian traumatis. Kulit tidak hanya berfungsi sebagai alat fisik untuk berinteraksi, tetapi juga sebagai daya tarik atau pesona dalam berhubungan dengan orang lain. Dalam interpretasi gambar pohon, bayangan dapat diartikan sebagai indikasi adanya ketidakmampuan seseorang untuk menunjukkan ambivalensi. Ini menunjukkan bahwa subjek mengalami perasaan tidak sepenuhnya terintegrasi dengan lingkungan sekitar.' },
              { id: 'penebalan', label: 'Penebalan/penyempitan batang', interpret: 'Batang dan dahan mewakili aliran materi (seperti usus). Penyempitan menghambat aliran, penebalan menciptakan penimbunan yang menghalangi aliran. Pada penebalan, energi tidak bisa keluar — penimbunan afek kuat yang menunjukkan hambatan. Akibatnya afek tidak dapat terungkap bebas, subjek mengalami kondisi stupor. Kondisi ini bisa bermanifestasi sebagai kesulitan berbicara atau mengekspresikan diri.' },
              { id: 'garis_dasar_miring', label: 'Garis dasar miring', interpret: 'Aversi — apa yang ada di atas dianggap sebagai dunia luar, "kamu", masa depan, dan ambisi yang ingin dicapai. Aversi ini dapat tercermin dalam garis dasar yang miring.' }
            ]
          }
        ]
      },

      /* ======================================================
         8. DAHAN
         ====================================================== */
      {
        id: 'dahan',
        title: '8. Dahan',
        sections: [
          {
            id: 'bentuk_dahan',
            title: 'Bentuk Dahan',
            type: 'checkbox',
            items: [
              { id: 'pipa_tidak_tertutup', label: 'Dahan pipa tidak tertutup pada mahkota', interpret: 'Tendensi keinginan yang ingin dicapai — subjek memandang masa depan dengan ambisi dan tujuan yang ingin dikejar. Ada keinginan berprestasi dan bekerja sebanyak mungkin. Kurang dapat menentukan sikap — subjek mengalami kesulitan menentukan pendirian yang konsisten. Tidak ada kepastian menghadapi lingkungan (negatifnya).' },
              { id: 'tersebar', label: 'Dahan tersebar', interpret: 'Tidak punya ketetapan diri dalam bekerja atau berpikir — tidak memiliki rencana jelas atau tujuan terstruktur. Mudah dipengaruhi — rentan terhadap pengaruh orang lain atau faktor eksternal. Impulsif — cenderung mengambil keputusan tanpa pertimbangan matang. Oposisi — kecenderungan menjadi oposisional atau menentang ide/arahan tertentu.' },
              { id: 'tersebar_bertentangan', label: 'Dahan tersebar bertentangan', interpret: 'Dihubungkan dengan skizofrenia — gangguan mental yang ditandai gejala seperti disorganisasi pikiran, perasaan terganggu, dan ketidakmampuan membedakan realitas dari pikiran yang terdistorsi.' },
              { id: 'tersebar_tak_teratur', label: 'Dahan tersebar sekali dan tak teratur', interpret: 'Suka oposisi — cenderung menentang ide dan arahan tertentu. Eksplosif — merespons impulsif atau dengan emosi kuat. Mudah kena konflik — mudah terlibat konflik interpersonal, reaksi berlebihan terhadap konflik.' },
              { id: 'ranting_kecil', label: 'Dahan hingga ranting kecil dan halus', interpret: 'Sangat peka (sensitivity) — peka terhadap perubahan kecil di lingkungan atau hubungan interpersonal. Daya reaksi tinggi — respons cepat terhadap rangsangan atau situasi baru. Indra halus — kemampuan mengamati detail yang tidak terdeteksi orang lain.' },
              { id: 'makin_mengecil', label: 'Dahan makin mengecil', interpret: 'Mempunyai kemampuan sinkronisasi masa lalu dengan masa yang akan datang — mampu menggunakan pengalaman sebagai panduan. Mudah menyesuaikan diri pada lingkungan — sifat adaptabilitas tinggi dan mampu mengatasi perubahan atau tantangan dengan fleksibilitas.' },
              { id: 'harmonis_kecil', label: 'Dahan harmonis dan kecil', interpret: 'Ringan hati — pandangan positif terhadap kehidupan dan mudah beradaptasi dengan perubahan. Kurang dinamis — kurangnya dinamika dalam kepribadian, cenderung tidak terlalu aktif atau dinamis dalam mengejar tujuan.' },
              { id: 'tidak_teratur_kecil', label: 'Dahan tidak teratur dan kecil', interpret: 'Reaktif — respons kuat terhadap rangsangan eksternal atau situasi tidak terduga. Gelisah — merasa tidak nyaman atau khawatir menghadapi ketidakpastian. Mudah dikacau — kesulitan mengatasi situasi yang berubah-ubah atau tidak terstruktur.' },
              { id: 'sembarang_kecil', label: 'Susunan dahan sembarang (kacau) dan kecil', interpret: 'Mudah lupa, tak suka berpikir, sifat kekanak-kanakan, suka melamun, tidak dapat mengendalikan diri, sifat malu karena perasaan rendah diri atau kecemasan sosial.' },
              { id: 'kaktus', label: 'Dahan bersambung seperti pohon kaktus', interpret: 'Debil — kecenderungan debil pada beberapa aspek kesehatan mental atau fungsi kognitif. Rajin tapi tak efektif — kegigihan tanpa hasil efektif. Tidak dapat menyesuaikan diri — kesulitan beradaptasi dengan perubahan. Epilepsi (lengket) — kondisi seperti epilepsi dengan kejang atau gangguan neurologis.' },
              { id: 'dekoratif_simetris', label: 'Dahan dekoratif dan simetris', interpret: 'Sistematis, tradisional (nilai konservatif), konservatif, disiplin dan kaku, mau menangnya sendiri/kepala batu, cenderung praktis (bakat teknis), kemampuan konstruktif dalam menyelesaikan tugas praktis dan membangun solusi efisien.' },
              { id: 'berkelok', label: 'Dahan berkelok-kelok', interpret: 'Cenderung diplomatis — mampu menangani situasi dengan kebijaksanaan, mencari solusi melalui negosiasi, menghindari konflik tidak perlu. Mudah menyesuaikan diri dengan lingkungan — fleksibilitas baik. Disiplin kuat meskipun terlihat tidak langsung. Mudah tegang dan konflik diri dengan lingkungan yang dianggap musuh. Konflik diri ingin disalurkan melalui dorongan.' },
              { id: 'garis_mahkota_akar', label: 'Dahan garis-garis dalam mahkota + akar gantung', interpret: 'Gelisah — merasa resah, khawatir, sulit menenangkan diri. Mudah berubah dari sedih ke ketawa — fluktuasi emosional tinggi, ketidakstabilan emosional sulit diprediksi. Akar gantung sebagai indikasi sifat dependen — cenderung bergantung pada faktor eksternal.' },
              { id: 'terputus_putus', label: 'Dahan terputus-putus/tidak jelas', interpret: 'Tidak punya kestabilan — kesulitan mempertahankan keseimbangan emosional atau stabilitas dalam hubungan dan tindakan. Sifat ragu-ragu — sering meragukan diri sendiri atau ketidakpastian terhadap keputusan. Kurang baik dalam abstraksi dan konsentrasi/berpikirnya. Hambatan kontak sosial.' },
              { id: 'ke_bawah', label: 'Dahan mengarah ke bawah', interpret: 'Introvert — lebih suka menyendiri, interaksi terbatas. Dorongan lemah — kurang energi atau motivasi. Tidak punya daya tahan — kurang ketahanan terhadap tekanan/stres, mudah lelah atau merasa overpowered. Keinginan tapi tidak dapat dilaksanakan. Depresi dan biasanya terdapat pada orang frustasi.' },
              { id: 'tidak_bervariasi', label: 'Dahan tidak bervariasi', interpret: 'Kurang dapat menyatakan diri — kesulitan mengomunikasikan keinginan, perasaan, atau pikiran. Regresi — kembali ke tingkat perkembangan atau perilaku primitif sebagai respons terhadap stres. Retardasi dan debil — keterbatasan intelektual. Tidak self-standing dalam putusan — ketergantungan pada orang lain.' },
              { id: 'ke_atas', label: 'Dahan mengarah ke atas', interpret: 'Rajin dan tak kenal batas — kegigihan dan semangat kuat. Vital aktif — vitalitas dan keaktifan, energi tinggi, keterlibatan aktif dalam kehidupan, kemampuan tetap dinamis.' },
              { id: 'ke_kanan_semua', label: 'Dahan ke kanan semua', interpret: 'Religius sangat mempengaruhi dirinya. Adanya tendensi orang ini memiliki keterlibatan mendalam dalam praktik keagamaan, nilai-nilai moral, atau pencarian makna hidup. Nalurinya peka dan ditujukan pada hal-hal yang religius — perhatian terhadap nilai etika, keadilan, dan makna hidup yang diakui dalam keagamaan.' },
              { id: 'ke_kiri_semua', label: 'Dahan ke kiri semua', interpret: 'Pengalaman masa lampau sangat mempengaruhi diri — pengaruh traumatis, pengalaman sulit, atau kejadian signifikan. Mudah mengalami frustrasi — rentan frustrasi, kesulitan menanggapi tantangan hidup secara adaptif. Mementingkan hal bersifat materi. Bila diimbangi batang kecil — indikasi ortodoks.' },
              { id: 'ke_bawah_batang_kecil', label: 'Dahan ke bawah + batang kecil', interpret: 'Sifat ekspansif — dorongan mencapai lebih banyak, menjelajahi hal baru. Dorongan kuat dan banyak untuk menyalurkan keinginannya namun tidak disertai kemampuan yang sesuai — ketidakseimbangan dorongan dan kemampuan. Ekstrim/abnormal, adanya waham kebesaran — pandangan berlebihan tentang diri sendiri.' },
              { id: 'cacing', label: 'Seperti cacing saling menelungkup', interpret: 'Mengindikasikan psikopat — sifat antisosial, kurangnya empati, perilaku manipulatif, kecenderungan bertindak tanpa perasaan bersalah.' },
              { id: '3dimensi_diarsir', label: 'Dahan 3 dimensi + diarsir', interpret: 'Kecerdasannya tinggi — kemampuan melihat situasi dari berbagai sudut pandang. Originalitas — pikiran orisinal dan kreatif, cenderung berpikir di luar kebiasaan dan menciptakan ide-ide baru.' }
            ]
          },
          {
            id: 'dahan_dipotong',
            title: 'Dahan yang Dipotong',
            type: 'checkbox',
            items: [
              { id: 'hambatan', label: 'Hambatan perasaan (remming) karena trauma masa lalu', interpret: 'Pemotongan dahan bisa mencerminkan hambatan emosional akibat pengalaman traumatis di masa lalu. Subjek mengalami kesulitan mengekspresikan perasaan atau merasa terhambat dalam berekspresi.' },
              { id: 'kurang_pd', label: 'Kurang percaya diri', interpret: 'Tindakan pemotongan dahan dapat mencerminkan kurangnya keyakinan pada diri sendiri. Subjek merasa tidak mampu atau tidak berdaya, kemungkinan sebagai akibat dari pengalaman traumatis atau konflik internal.' },
              { id: 'regresi', label: 'Cenderung regresi', interpret: 'Pemotongan dahan dapat diartikan sebagai respons regresif — kembali ke tingkat perilaku atau pola pemikiran yang lebih primitif. Ini bisa menjadi cara subjek mengatasi stres atau kesulitan emosional.' },
              { id: 'konflik', label: 'Adanya konflik', interpret: 'Pemotongan dahan juga bisa menunjukkan adanya konflik internal atau eksternal. Mungkin ada pertentangan antara keinginan subjek untuk tumbuh dan berkembang, tetapi ada hambatan atau rintangan yang menghalanginya.' },
              { id: 'kuasa_dirugikan', label: 'Ingin berkuasa dan merasa dirugikan', interpret: 'Pemotongan dahan bisa mencerminkan dorongan untuk mendapatkan kendali atau kekuasaan atas situasi, sementara pada saat yang sama merasa dirugikan atau tidak adil.' },
              { id: 'tidak_mengerti', label: 'Merasa tidak mengerti dan tidak berterus terang', interpret: 'Pemotongan dahan dapat mencerminkan rasa tidak mengerti atau kesulitan untuk berkomunikasi terbuka. Subjek merasa sulit mengungkapkan diri atau merasa sulit dipahami oleh orang lain.' },
              { id: 'pubertas', label: 'Menarik diri dan simbol pubertas', interpret: 'Pemotongan dahan bisa menjadi simbol penarikan diri atau perlambangan dari masa pubertas. Ini menunjukkan ketidaknyamanan atau kekhawatiran terhadap perubahan diri dan peran dalam kehidupan.' },
              { id: 'nasib', label: 'Nasib yang kurang enak', interpret: 'Pemotongan dahan bisa mencerminkan perasaan ketidakpastian atau ketidakmampuan mengontrol nasib sendiri. Subjek ini merasa terjerat dalam situasi yang tidak menyenangkan.' }
            ]
          },
          {
            id: 'dahan_bersilang',
            title: 'Dahan Bersilang & Berlawanan Arah',
            type: 'checkbox',
            items: [
              { id: 'bersilang', label: 'Dahan bersilang', interpret: 'Terdapat ambivalensi atau konflik internal pada subjek yang menggambarnya. Pertama, sliingnya dahan mencerminkan pertentangan antara ekspresi emosi dan kontrol diri. Kedua, adanya kecenderungan untuk kritis bisa mengindikasikan konflik terhadap diri sendiri atau orang lain. Ketiga, gambar ini mencerminkan adanya hambatan atau rintangan dalam mencapai tujuan atau mengatasi masalah. Terakhir, kesulitan dalam membuat keputusan menunjukkan kebingungan atau ketidakmampuan mengambil keputusan.' },
              { id: 'berlawanan', label: 'Dahan digambarkan arah berlawanan', interpret: 'Mencerminkan ketidak-konsistenan, ketidakmampuan untuk menyelesaikan diri, serta kurangnya kontrol diri. Subjek mudah dipengaruhi oleh faktor eksternal, menunjukkan kesulitan dalam menghadapi kenyataan. Pola ini sering ditemukan pada gambar anak-anak dan mungkin menandakan adanya konflik dalam kepribadian.' }
            ]
          },
          {
            id: 'dahan_tebal',
            title: 'Dahan Tebal & Sejajar',
            type: 'checkbox',
            items: [
              { id: 'tebal', label: 'Dahan lebih tebal', interpret: 'Menunjukkan penumpukan emosi atau perasaan yang terpendam. Ini bisa mengindikasikan bahwa subjek menahan diri untuk mengekspresikan perasaannya secara bebas. Belum menunjukkan tingkat kedewasaan yang penuh dalam perilaku sehari-hari.' },
              { id: 'sejajar', label: 'Dahan tebal sejajar', interpret: 'Ada beberapa hal: Penyesuaian diri — permukaan batang dapat mencerminkan bagaimana seseorang dapat menyesuaikan diri dengan lingkungan. Keadaan masa lalu — gambaran pada permukaan batang bisa menggambarkan pengalaman masa lalu subjek yang memengaruhi cara subjek menanggapi situasi. Kehidupan emosional — permukaan batang juga dapat mencerminkan kehidupan emosional seseorang, seperti bagaimana subjek merespons perasaan atau afeksi terhadap lingkungan. Mekanisme pertahanan diri — ciri-ciri yang muncul pada permukaan batang bisa mengindikasikan mekanisme pertahanan diri yang dimiliki seseorang.' }
            ]
          }
        ]
      },

      /* ======================================================
         9. MAHKOTA
         ====================================================== */
      {
        id: 'mahkota',
        title: '9. Mahkota',
        sections: [
          {
            id: 'bentuk_mahkota',
            title: 'Bentuk Mahkota',
            type: 'checkbox',
            items: [
              { id: 'terbuka', label: 'Mahkota terbuka', interpret: 'Menandakan adanya kemampuan dalam membedakan, menerima ide-ide baru, serta berpotensi tumbuh dan berkembang di masa mendatang. Mencerminkan kemauan untuk mengeksplorasi, belajar, dan terbuka terhadap pengalaman baru. Produktivitas intelektual yang terus bertambah — kecenderungan subjek untuk terus berkembang dan memperluas wawasan serta keterampilan. Dari sisi negatifnya, mahkota terbuka menandakan kurangnya kestabilan dalam satu pendapat atau karakter subjek.' },
              { id: 'tertutup_gelombang', label: 'Mahkota tertutup + gelombang', interpret: 'Adanya kompleksitas dalam kehidupan batin subjek. Bayangkan sebuah pohon dengan mahkota yang tampak tertutup, namun di dalamnya terasa kosong. Interpretasi merujuk pada kurangnya struktur atau diferensiasi dalam aktivitas mental atau spiritual. Aktivitas pikiran subjek dalam geist atau aspek spiritual terlihat sibuk namun tanpa arah atau tujuan jelas. Ini bisa diartikan sebagai lamunan atau fantasi tidak terstruktur, tidak memberikan kontribusi signifikan atau tidak memiliki efek nyata dalam kenyataan. Keterbukaan dalam aktivitas intelektual menggambarkan subjek yang cenderung kurang inovatif atau kurang kreatif dalam berpikir. Pikiran rasional atau intelektual lebih tertutup dapat mengurangi potensi produktivitas yang dapat berasal dari dimensi spiritual atau jiwa.' },
              { id: 'lidah_api', label: 'Mahkota mirip lidah api + batang pendek', interpret: 'Menandakan keinginan kuat atau hasrat besar dalam mencapai sesuatu. Ditunjukkan melalui fanatisme dan antusiasme besar terhadap tujuan atau aspirasi tertentu. Sering diasosiasikan dengan sikap penuh semangat, energi tinggi, dan fokus kuat terhadap apa yang ingin dicapai.' },
              { id: 'lebih_tinggi_kiri', label: 'Mahkota lebih tinggi di bagian kiri', interpret: 'Menandakan subjek hidup dalam dunia keinginan (world of wishes). Ini mencerminkan fokusnya pada aspirasi, impian, atau keinginan, melebihi aspek yang lebih realistis atau terukur. Subjek cenderung berada dalam dunia imajinasi kreatif, di mana harapan dan keinginan memiliki peran signifikan dalam pandangannya terhadap hidup.' },
              { id: 'lebih_tinggi_kanan', label: 'Mahkota lebih tinggi di bagian kanan', interpret: 'Sebagai representasi dari ambisi intelektual seperti pengetahuan baru atau pencapaian yang berkaitan dengan kapasitas pikiran. Ada juga indikasi mencari pengakuan atau penghargaan atas kemampuan intelektual dan prestasi.' },
              { id: 'jauh_lebih_besar', label: 'Mahkota jauh lebih besar + batang pendek', interpret: 'Menandakan kepercayaan diri tinggi. Seseorang yang menggambar seperti ini cenderung memiliki keyakinan kuat pada kemampuan dan potensinya.' },
              { id: 'tidak_aktif', label: 'Intelektual sangat tidak aktif', interpret: 'Menunjukkan kurangnya aktivitas berpikir. Subjek cenderung tidak menggunakan kapasitas intelektualnya secara optimal.' },
              { id: 'banyak_fantasi', label: 'Terlalu banyak fantasi', interpret: 'Dominasi fantasi dalam kehidupan mental subjek. Subjek cenderung lebih banyak berada dalam dunia imajinasi dibandingkan menghadapi realitas.' },
              { id: 'batang_panjang', label: 'Batang panjang + mahkota kecil', interpret: 'Dalam tahap perkembangan anak pra-sekolah, gejala ini dianggap normal dari proses perkembangan kognitif. Namun jika tetap muncul pada usia dewasa, ini bisa menjadi indikasi: perkembangan terlambat (keterlambatan pencapaian atau penyesuaian diri) atau infantil (perilaku, respons, atau reaksi tidak sesuai usia atau tahap perkembangan).' },
              { id: 'kepala_jamur', label: 'Mahkota proporsional kecil (kepala jamur) + batang pendek gemuk', interpret: 'Mengindikasikan ciri-ciri seperti kecenderungan ketidakmampuan untuk berkembang atau tumbuh, atau bahkan menunjukkan kurangnya ambisi atau dorongan untuk mencapai perkembangan atau pencapaian signifikan. Ketika mahkota menyebar ke bawah, mencerminkan kurangnya agresi atau ketidaksiapan untuk membuat keputusan yang diperlukan dalam situasi tertentu.' },
              { id: 'dahan_bercabang', label: 'Mahkota tertutup + dahan bercabang', interpret: 'Mereka mengalami kesulitan dalam berinteraksi, berkomunikasi, atau berbagi pikiran dan perasaan dengan orang lain. Keterbatasan komunikatif dapat mencakup ketidakmampuan untuk secara terbuka berkomunikasi atau mengungkapkan pikiran dan perasaan dengan jelas kepada orang lain. Indikasi ketidakmampuan menunjukkan kejujuran, baik kepada orang lain maupun diri sendiri. Kesulitan memahami serta mengakui emosi atau pikiran sendiri, sehingga sulit bagi orang lain memahami atau memprediksi respons atau reaksi mereka.' },
              { id: 'terbagi', label: 'Perbedaan jelas di bagian-bagian mahkota', interpret: 'Mahkota pohon (bagian atasnya) sering terbagi menjadi beberapa bagian terpisah. Ciri ini menunjukkan adanya fragmentasi atau diferensiasi dalam cara berpikir subjek.' },
              { id: 'bola_tertutup', label: 'Mahkota bola tertutup', interpret: 'Subjek cenderung tertutup, kurang produktif, kesulitan menilai interaksi sosial. Cara berpikir tampak jelas, tetapi tujuan atau maksud tindakannya tidak terlihat, menunjukkan ketidakpastian dalam pengambilan keputusan atau tindakan.' },
              { id: 'penampang_bawang', label: 'Mahkota penampang bawang', interpret: 'Menggambarkan pola yang mengarah ke dalam, menunjukkan arah sentripetal atau menuju pusat. Sentripetal mengindikasikan subjek menginginkan keseimbangan yang diwujudkan melalui simetri dan arah menuju pusat. Subjek cenderung merasa sulit mengambil keputusan dan memiliki dorongan mandiri, tetapi kecenderungan sentripetal membuat subjek lebih suka menjaga keseimbangan dan merasa nyaman dalam keadaan harmonis.' },
              { id: 'kelapa', label: 'Mahkota seperti pohon kelapa', interpret: 'Mencerminkan sifat ekspansif dan ekstrovert, aktif dan selalu terlibat dalam kegiatan eksternal. Terdapat elemen agresi dan kesibukan konstan, sulit berdiam diri atau memusatkan pikiran. Jika tidak ada pekerjaan, mereka cenderung memikirkan hal-hal yang sebenarnya tidak perlu dipikirkan. Subjek ini memiliki inisiatif kuat dalam mengambil langkah dan tindakan.' },
              { id: 'payung', label: 'Mahkota seperti payung (jamur)', interpret: 'Mahkota meluas dan menutup seperti payung mencerminkan kebutuhan mendalam akan perasaan aman dan perlindungan, terutama dari ancaman dunia luar yang tidak terduga. Subjek mencari stabilitas emosional dan psikologis, dengan dorongan kuat menciptakan lingkungan memberi rasa aman fisik dan emosional. Subjek lebih baik dalam merespon jika keadaan tenang dan terlindungi.' },
              { id: 'arcade', label: 'Mahkota arcade', interpret: 'Menampilkan pola dan sikap sopan, ramah, dan teratur. Gaya mahkota seperti bentuk arcade menunjukkan pribadi peduli pada penampilan visual dan seni, serta menggambarkan subjek menghargai estetika dan tata krama dalam interaksi sosial. Sikap formal dalam perilaku karena memperhatikan etika dan menunjukkan minat pada aspek estetika sehari-hari.' },
              { id: 'rimbun', label: 'Mahkota rimbun ke dalam', interpret: 'Menggambarkan orang penuh energi, suka beraksi, dan suka menambah dramatisasi. Sangat terlibat secara emosional dan punya rasa humor kuat, tetapi seringkali suasana hatinya bisa berubah-ubah dengan cepat. Kurang konsisten atau tekun dalam pemikiran dan tindakan.' },
              { id: 'radiating_crown', label: 'Mahkota radiating crown (bentuk kipas)', interpret: 'Kegagalan dan ketidakpuasan — kegagalan mencapai tujuan dalam pekerjaan, hubungan, atau pencapaian pribadi, menciptakan gambaran psikologis subjek yang merasakan kekecewaan atau frustrasi mendalam. Penampilan malas dan kurangnya motivasi — kehilangan minat pada hal penting, kurang semangat dan arah. Ketidaksabaran dan kesulitan menunggu. Kurang hati-hati dan tindakan impulsif. Cenderung malas, konsentrasi kurang, kurang tenang, kurang ajar.' },
              { id: 'dissolution_form', label: 'Mahkota dissolution of form (coretan menghilangkan bentuk)', interpret: 'Indikasi kelalaian dan kurangnya perhatian terhadap rincian. Meskipun tampak serasi dengan produktivitas tinggi, kurangnya fokus pada detail menunjukkan kecenderungan mengurangi konsentrasi pada aspek kecil. Cara coretan menunjukkan subjek menggerakkan tangan seperti membuat benang kusut — ciri impulsif, tidak konsisten, kebingungan komunikasi. Pencitraan tidak teratur mencerminkan kegelisahan serta perubahan penghayatan emosi dan pikiran yang sering berubah-ubah.' },
              { id: 'bayangan', label: 'Mahkota berbentuk bayangan', interpret: 'Bakat seni dan kepekaan visual — bakat alami dalam seni menggambar, kepekaan visual, kemampuan mengamati detail, imajinasi kreatif. Ketenangan dan ketidakaktifan — memproyeksikan ketenangan melalui seni, menciptakan ruang refleksi. Imajinasi dan dunia fantasi — cenderung terbenam dalam alam impian atau dunia imajinasi, menggali pikiran, menjelajahi imajinasi. Sifat pasif — lebih suka mengamati daripada bertindak, cenderung menerima daripada memimpin. Pengaruh lingkungan dan kesulitan pengambilan keputusan — mudah dipengaruhi lingkungan, sulit mengambil keputusan karena terbuka terhadap berbagai pendapat.' },
              { id: 'bergetar', label: 'Mahkota bergetar', interpret: 'Mudah nervous — cenderung mudah merasa gugup atau gelisah, tingkat kecemasan lebih besar. Mudah terganggu perasaannya — rentan terhadap ketidakstabilan emosional, membutuhkan respons lebih cepat dan ekspresi emosional berubah-ubah, lebih rentan terhadap perubahan suasana hati.' },
              { id: 'sekip', label: 'Mahkota mirip sekip / papan sasaran tembak', interpret: 'Narsisme tercermin dalam bentuk yang menunjukkan fokus pada diri sendiri, seperti menempatkan diri sebagai pusat perhatian. Mengindikasikan seseorang yang cenderung mengedepankan kepentingan dan kepuasan pribadi. Kemudian, ada kecenderungan untuk cepat merasa bosan tercermin dalam bentuk yang kurang variasi dan kompleksitas, menunjukkan subjek mengalami kejenuhan dengan kegiatan atau hal-hal yang tidak memberikan stimulasi memadai. Tidak adanya aktivitas ke luar juga bisa menggambarkan bahwa orang ini cenderung menjaga jarak dari lingkungan luar.' },
              { id: 'kipas', label: 'Mahkota seperti kipas', interpret: 'Regresi — seseorang kembali ke tingkat perkembangan atau perilaku yang lebih primitif sebagai respons terhadap stres atau tekanan. Mudah bertindak kasar — merespons agresif atau kasar, kurang kemampuan mengelola emosi secara konstruktif. Kurang pengalaman — kurangnya pengalaman bisa memengaruhi kemampuan menanggapi tantangan efektif. Suka kebutuhan mengenakkan — cenderung mencari kepuasan dari kebutuhan yang memberikan kenyamanan sesaat, bisa mencakup perilaku impulsif atau kecenderungan menghindari tanggung jawab.' },
              { id: 'daun_pisang', label: 'Mahkota seperti daun pisang (bukan daun pisang)', interpret: 'Sifat curiga — ketidakpercayaan atau kecenderungan selalu waspada terhadap niat atau motif orang lain. Berhati-hati sekali — sangat berhati-hati dalam menilai dan merespons lingkungan, menghindari risiko atau keinginan menghindari potensi bahaya. Tertutup — simbol dari sifat tertutup. Subjek cenderung menjaga jarak emosional dan kurang terbuka terhadap orang lain, berpotensi memengaruhi hubungan interpersonal.' },
              { id: 'terlalu_rumit', label: 'Mahkota terlalu rumit', interpret: 'Kekacauan batin, identifikasi keinginan kabur, aspirasi tidak terfokus, pemancaran vitalitas tidak terstruktur, rentan pengaruh luar, rentan perasaan terombang-ambing, tidak stabil, konsentrasi kurang, tidak senang tergantung, intelegensi tinggi, retardasi.' },
              { id: 'ruwet_lokan', label: 'Mahkota ruwet seperti lokan/krul', interpret: 'Kegelisahan — ketidakstabilan emosional atau kekhawatiran terus-menerus terkait berbagai aspek kehidupan. Motorik — tingkat energi fisik tinggi atau kecenderungan melakukan gerakan ekspresif.' },
              { id: 'bergantung', label: 'Mahkota bergantung', interpret: 'Tak ada kemauan — kehilangan semangat atau dorongan internal, kehilangan minat, ketidakjelasan arah hidup. Tidak aturan, tidak punya kemauan, pikiran kacau, kurang sistematis, tidak stabil, konsentrasi kurang, tidak senang tergantung, intelegensi tinggi, retardasi.' },
              { id: 'nyala_api_tertutup', label: 'Mahkota seperti nyala api tertutup dan lebih ruwet', interpret: 'Suka menggetarkan — kecenderungan menggunakan taktik menggetarkan dalam interaksi sosial, upaya menakuti atau mengintimidasi. Suka berlagak — menonjolkan diri, sombong. Suka main sandiwara. Tendensi pikiran suka mengembara.' },
              { id: 'asap_berbelok', label: 'Mahkota seperti asap berbelok & rumit', interpret: 'Kecenderungan untuk menggetarkan/menakuti orang lain dengan dorongan menciptakan kesan kuat atau dominan, meski hanya sandiwara. Suka main sandiwara — perilaku didorong keinginan menarik perhatian atau menciptakan suasana teatrikal. Suka berlagak — berpura-pura atau berlebihan.' },
              { id: 'nyala_api_terbuka', label: 'Mahkota seperti nyala api terbuka', interpret: 'Kelemahan intelektual — tingkat kecerdasan lebih rendah, seperti Tunadaksa atau Disabilitas Intelektual kategori ringan/sedang. Mempengaruhi kemampuan subjek memahami dan merespons informasi. Kurang agresif — ketidakberanian menghadapi hal baru, enggan keluar dari zona nyaman. Tidak dapat memutuskan sendiri. Sukar menghilangkan rasa sedih. Depresi sukar diatasi.' },
              { id: 'shading_mahkota', label: 'Mahkota dengan shading', interpret: 'Tendensi pandai membentangkan sesuatu — kreativitas dan keahlian artistik tercermin dalam pemberian dimensi dan kedalaman pada karya seni, ketertarikan pada detail dan keahlian teknis. Perasaan mudah dipengaruhi — kepekaan sosial subjek, dorongan berintegrasi dengan lingkungan sekitar, kemampuan merespons pengaruh eksternal dengan kedalaman emosional.' },
              { id: 'cemara_samping', label: 'Mahkota cempaka dari samping bagian bawah tergantung', interpret: 'Tendensi tidak ada kemauan — ketidakjelasan atau kehilangan arah yang jelas. Tidak dapat membedakan. Sering lupa inti persoalan. Mudah melamun. Kontrol diri kurang. Mudah dibelokkan perhatiannya.' },
              { id: 'berat_ke_kanan', label: 'Mahkota berat ke kanan', interpret: 'Keinginan akan sensasi — subjek mencari pengalaman baru, stimulasi, atau tantangan untuk memenuhi dorongan intrinsik terhadap kehidupan yang dinamis. Ingin berkuasa — dorongan besar mengendalikan situasi, memimpin, memiliki pengaruh signifikan. Suka menyombongkan diri, bersifat besar/perlente, ekstrovert.' },
              { id: 'berat_ke_kiri', label: 'Mahkota berat ke kiri', interpret: 'Introvert — subjek cenderung menarik diri ke dalam, memperoleh energi dari kehidupan internal, interaksi sosial yang intens atau berlebihan membuat sesuatu yang menghabiskan energi. Subjek cenderung lebih suka menghabiskan waktu sendiri atau dalam lingkup kecil kelompok akrab.' },
              { id: 'centripetal', label: 'Mahkota centripetal (banyak lingkaran di dalamnya)', interpret: 'Tendensi konsentrasi baik. Cepat dalam mengambil keputusan. Keadaan diri yang tertutup. Tahan dan ulet. Sukar kontak atau cenderung menolak. Subjek cenderung menjaga jarak dan hanya membuka diri kepada sedikit orang.' },
              { id: 'centrifugal', label: 'Mahkota centrifugal (menjauh dari pusat)', interpret: 'Agresif — subjek memiliki bentuk centifugal dengan banyak elemen atau cabang yang menjauh dari titik pusat. Sifat agresif pada subjek — manifestasi dalam berbagai bentuk seperti tingkat energi tinggi, dorongan mencapai tujuan dengan cara dominan, keinginan menantang norma atau otoritas. Usaha kuat atau besar dorongan untuk bekerja, garis-garis menjauh dari pusat menunjukkan tingkat usaha dan dorongan tinggi, subjek terdorong oleh motivasi internal dan tekad kuat mencapai tujuan.' },
              { id: 'hanya_garis', label: 'Mahkota hanya terdiri dari garis-garis', interpret: 'Cenderung represi dan dangkal — representasi memberikan nuansa simbolis terhadap bagaimana subjek cenderung mengalami atau menyembunyikan aspek emosional dan intelektual. Kurang cerdas — subjek cenderung tidak memproses informasi secara mendalam dan kurang memiliki kecerdasan dalam pemahaman menjadi lebih rendah. Tingkah lakunya seperti anak dalam masa trotz (tantrum).' },
              { id: 'pohon_dilingkari', label: 'Pohon dilingkari pagar / batas', interpret: 'Menyiratkan sejumlah isyarat psikologis yang menarik. Ini mencerminkan kebutuhan mendesak seseorang akan perasaan aman dan nyaman. Gambar pohon yang dilingkari oleh pagar atau batas menunjukkan sejumlah isyarat psikologis yang menarik.' }
            ]
          },
          {
            id: 'mahkota_simetris',
            title: 'Mahkota Simetris & Dekoratif',
            type: 'checkbox',
            items: [
              { id: 'sistematis', label: 'Sistematis', interpret: 'Simetri dan dekoratif dapat mencerminkan sifat sistematis dalam kepribadian subjek. Subjek memiliki kecenderungan menjalani kehidupan dengan tata aturan dan keteraturan.' },
              { id: 'tradisional', label: 'Tradisional', interpret: 'Simetri dan unsur dekoratif sering dikaitkan dengan nilai-nilai tradisional. Subjek cenderung memegang teguh nilai-nilai konservatif dan menghormati norma-norma sosial.' },
              { id: 'konservatif', label: 'Konservatif', interpret: 'Sifat simetris dan dekoratif dapat mencerminkan pandangan konservatif dalam berpikir dan bertindak. Kurang cenderung mencoba hal-hal baru atau keluar dari norma-norma.' },
              { id: 'disiplin_kaku', label: 'Disiplin dan sikap kaku', interpret: 'Kesimetrisan dan dekorasi juga dapat mencerminkan sikap kaku dan disiplin dalam pendekatan terhadap kehidupan. Sulit melonggarkan kendali atau beradaptasi dengan perubahan.' },
              { id: 'kepala_batu', label: 'Mau menangnya sendiri / kepala batu', interpret: 'Sikap mau menangnya sendiri atau keras kepala dapat mencerminkan kemauan kuat dan keteguhan dalam mencapai tujuan, bahkan jika itu berarti menghadapi perlawanan.' },
              { id: 'bakat_teknis', label: 'Cenderung lebih praktis daripada teoritis (bakat teknis)', interpret: 'Pilihan untuk lebih memilih pendekatan praktis dan memiliki bakat teknis dapat mencerminkan orientasi pada hal-hal yang dapat diaplikasikan dalam kehidupan sehari-hari daripada fokus pada konsep teoritis.' },
              { id: 'konstruktif', label: 'Kemampuan konstruktif', interpret: 'Kemampuan untuk menciptakan atau membangun, yang bisa dilihat dari dekorasi, dapat mencerminkan kemampuan konstruktif. Subjek efektif dalam menyelesaikan tugas-tugas praktis dan membangun solusi efisien.' }
            ]
          },
          {
            id: 'mahkota_shading_tekstur',
            title: 'Mahkota Tekstur & Shading',
            type: 'checkbox',
            items: [
              { id: 'tekstur_menonjol', label: 'Tekstur menonjol pada batang pohon', interpret: 'Menunjukkan adanya hambatan dan frustrasi dalam pengalaman emosional. Ini menciptakan kompleksitas dan intensitas perasaan yang mungkin dialami oleh individu dalam menghadapi tantangan emosional pada tahap perkembangan tertentu. Bayangan (shading) merupakan teknik mengisi keras dengan pensil agar menghasilkan area yang lebih gelap. Penggunaan teknik ini menandakan adanya proses emosional yang sedang berlangsung pada subjek. Penggunaan bayangan ini terkait erat dengan suasana hati, stimung (mood), dan kondisi emosional seseorang.' },
              { id: 'berlubang', label: 'Batang yang berlubang atau terkelupas kulitnya', interpret: 'Kondisi batang yang berlubang dan terkelupas dianggap sebagai indikator kejadian traumatis. Kulit tidak hanya berfungsi sebagai alat fisik untuk berinteraksi, tetapi juga sebagai daya tarik atau pesona dalam berhubungan dengan orang lain. Dalam interpretasi gambar pohon, bayangan dapat diartikan sebagai indikasi adanya ketidakmampuan seseorang menunjukkan ambivalensi. Ini menunjukkan bahwa subjek mengalami perasaan tidak sepenuhnya terintegrasi dengan lingkungan atau komunitas mereka.' },
              { id: 'tekstur_kulit', label: 'Tekstur kulit batang (coretan, garis-garis)', interpret: 'Penyesuaian diri — permukaan batang dapat mencerminkan bagaimana seseorang dapat menyesuaikan diri dengan lingkungan. Keadaan masa lalu — gambaran pada permukaan batang bisa menggambarkan pengalaman masa lalu subjek. Kehidupan emosional — permukaan batang juga dapat mencerminkan kehidupan emosional seseorang. Mekanisme pertahanan diri — ciri-ciri yang muncul pada permukaan batang bisa mengindikasikan mekanisme pertahanan diri yang dimiliki.' }
            ]
          },
          {
            id: 'streeb_atas',
            title: 'Streep / Arah Angin',
            type: 'checkbox',
            items: [
              { id: 'streep_kanan', label: 'Streep / tertiup angin ke kanan', interpret: 'Mudah tersinggung — subjek cenderung mudah tersinggung atau rentan terhadap pengaruh luar. Subjek memiliki sensitivitas tinggi terhadap perubahan emosional atau lingkungan sekitar.' },
              { id: 'streep_kiri', label: 'Streep (garis lurus) ke kiri', interpret: 'Introvert — subjek lebih suka menghabiskan waktu sendiri atau dalam kelompok kecil. Kurang ikatan — subjek tidak terlalu aktif dalam membentuk hubungan dekat atau terikat secara emosional.' }
            ]
          }
        ]
      },

      /* ======================================================
         10. BUAH
         ====================================================== */
      {
        id: 'buah',
        title: '10. Buah',
        sections: [
          {
            id: 'buah_jenis',
            title: 'Jenis & Kondisi Buah',
            type: 'checkbox',
            items: [
              { id: 'berjatuhan', label: 'Pohon dengan buah berjatuhan', interpret: 'Kehilangan atau perasaan kehilangan — pohon dengan buah yang berjatuhan mencerminkan perasaan kehilangan atau perasaan yang berjatuhan. Kehilangan sesuatu yang penting, kehilangan yang bersifat emosional/sosial, atau bahkan material. Menciptakan gambaran kesedihan atau kekosongan dalam kehidupan.' },
              { id: 'kematangan', label: 'Buah sebagai kematangan & pertengahan masa perkembangan', interpret: 'Buah sering menjadi simbol kematangan atau pertanda pertengahan masa perkembangan. Bukan hanya sebagai gambar biasa, buah sering menjadi simbol kematangan atau pertanda pertengahan masa perkembangan. Buah yang sudah memasuki pertengahan masa perkembangan, saat anak-anak sudah memasuki masa pertengahan pada gambar orang tua.' },
              { id: 'banyak_buah', label: 'Banyak buah dalam satu lembar', interpret: 'Kecenderungan menggambarkan lebih dari satu pohon pada satu lembar kertas. Anak-anak biasanya lebih dari satu pohon pada satu lembar kertas. Meskipun hanya diminta menggambar satu pohon, ini menjadi indikasi ketidakpercayaan pada diri mereka sendiri.' },
              { id: 'kesuburan', label: 'Buah sebagai kesuburan', interpret: 'Buah sering kali menjadi simbol kesuburan, pertanda kematangan atau pertengahan masa perkembangan. Buah yang kaya dan produktif dapat mencerminkan kemampuan menghasilkan dan berkontribusi.' }
            ]
          }
        ]
      },

      /* ======================================================
         11. LINGKUNGAN / RUMPUT
         ====================================================== */
      {
        id: 'lingkungan',
        title: '11. Lingkungan / Rumput',
        sections: [
          {
            id: 'jenis_lingkungan',
            title: 'Jenis Lingkungan',
            type: 'checkbox',
            items: [
              { id: 'dikelilingi_rumput', label: 'Pohon dikelilingi rumput', interpret: 'Kurang percaya pada diri sendiri. Pohon dikelilingi rumput — menunjukkan subjek kurang percaya pada kemampuan dan potensinya, serta ketidakmampuan mengakui dan memanfaatkan kekuatan internal. Rasa tergantung — subjek cenderung bergantung pada orang lain untuk mendapat dukungan dan validasi. Kurang diakui lingkungan — subjek kurang mendapat perhatian dari lingkungan sekitar, hal ini bisa memicu perasaan terisolasi atau kurang dihargai.' },
              { id: 'berdiri_sendiri', label: 'Pohon berdiri sendiri', interpret: 'Subjek yang memiliki gambaran permukaan batang seperti ini cenderung memiliki kritik yang tajam dan pedas terhadap lingkungan, bersikap galak, bawel, dan seringkali kritis. Orang semacam ini juga dapat menjadi sangat peka terhadap kritik yang diberikan oleh orang lain.' },
              { id: 'bernahkota_matahari', label: 'Pohon bernahkota matahari / pencahayaan', interpret: 'Subjek butuh bantuan atau penerangan. Pohon yang bergantung pada matahari untuk cahaya mencerminkan ketergantungan pada dukungan eksternal untuk mengatasi ketidakpastian atau keraguan. Dalam diri mereka, mereka mengalami ketidakpastian dan kebingungan mengenai arah hidup, keputusan yang harus diambil, atau merasa mengenal jati diri mereka.' },
              { id: 'di_atas_bukit', label: 'Pohon di atas bukit / lingkungan alam', interpret: 'Pohon dikelilingi oleh pemandangan alam atau elemen seperti gunung, danau, matahari, rumput, dan bayangan di bawah pohon. Ini mencerminkan beberapa hal: kecenderungan melamun atau meditasi, individu suka melamunkan diri ke dalam dunia sendiri, mungkin karena merasa terancam atau tidak nyaman dengan realitas sekitar. Imajinasi luas — kreativitas mereka tercermin dalam kemampuan membentuk dunia imajiner yang unik.' }
            ]
          }
        ]
      },

      /* ======================================================
         12. FITUR KHUSUS
         ====================================================== */
      {
        id: 'fitur_khusus',
        title: '12. Fitur Khusus',
        sections: [
          {
            id: 'fitur_tambahan',
            title: 'Fitur Tambahan pada Gambar',
            type: 'checkbox',
            items: [
              { id: 'pagar', label: 'Ada pagar / batas', interpret: 'Menunjukkan kebutuhan mendesak seseorang akan perasaan aman dan nyaman. Gambar pohon yang dilingkari oleh pagar atau batas menunjukkan isyarat psikologis menarik tentang kebutuhan subjek.' },
              { id: 'dilingkari', label: 'Pohon dilingkari', interpret: 'Kebutuhan mendesak akan perasaan aman dan nyaman. Adanya batas atau perlindungan yang diinginkan oleh subjek.' }
            ]
          }
        ]
      },

      /* ======================================================
         13. KESAN UMUM UNTUK INTERPRETASI
         ====================================================== */
      {
        id: 'kesimpulan_baum',
        title: '13. Ringkasan & Nuansa',
        sections: [
          {
            id: 'ringkasan_ekstra',
            title: 'Observasi Ekstra',
            type: 'checkbox',
            items: [
              { id: 'pohon_berakar_cahaya', label: 'Pohon berakar dalam cahaya dan bumi', interpret: 'Menggambarkan konsep bahwa pohon memiliki hubungan erat dengan sumber cahaya (pengetahuan, spiritualitas, pencerahan) dan juga dengan koneksi ke dunia fisik (keterikatan dengan bumi, realitas fisik). Mengindikasikan polaritas, keselarasan, dan keseimbangan antara kedalaman spiritualitas dengan keterikatan pada kehidupan dunia nyata.' },
              { id: 'pohon_organik', label: 'Pohon dengan elemen organik & tambahan yang tidak berhubungan', interpret: 'Tambahan-tambahan ini biasanya mencerminkan seseorang yang menggunakan elemen artistik untuk mengekspresikan kondisi lingkungan sekitar pada fase pra-pubertas. Subjek ingin menciptakan banyak hal dan kreativitasnya muncul secara alamiah.' },
              { id: 'pohon_di_atas_tanah', label: 'Ada garis tanah di atas pangkal batang', interpret: 'Gambar ini menunjukkan kesulitan mengekspresikan emosi dan ketidaknyamanan dengan realitas sekitar. Subjek cenderung tidak memperdalam perasaan atau mengalami kesulitan beradaptasi dalam lingkungan yang menekan.' },
              { id: 'pohon_di_dalam_lingkaran', label: 'Pohon berada dalam lingkaran / batas', interpret: 'Subjek ingin menyendiri atau menghindari interaksi sosial. Sulit mengelola frustrasi dalam menghadapi tantangan atau perasaan negatif.' },
              { id: 'pohon_diatas_bukit2', label: 'Pohon di atas bukit / lingkungan khusus', interpret: 'Ada perasaan tertekan, dampak tekanan dari perkembangan. Menyembunyikan perasaan yang tidak menyenangkan dalam lingkungan sekitar atau faktor eksternal.' }
            ]
          }
        ]
      }

    ]
  },

  /* ==========================================================
     DAP — DRAW A PERSON (placeholder)
     ========================================================== */
  dap: {
    title: 'DAP — Draw A Person',
    subtitle: 'Interpretasi otomatis (data sedang dilengkapi)',
    icon: '🎨',
    theme: {
      primary: '#a855f7',
      primaryDark: '#7e22ce',
      bg: '#faf5ff',
      border: '#e9d5ff'
    },
    groups: []
  },

  /* ==========================================================
     HTP — HOUSE TREE PERSON (placeholder)
     ========================================================== */
  htp: {
    title: 'HTP — House Tree Person',
    subtitle: 'Interpretasi otomatis (data sedang dilengkapi)',
    icon: '🏠',
    theme: {
      primary: '#3b82f6',
      primaryDark: '#1e40af',
      bg: '#eff6ff',
      border: '#bfdbfe'
    },
    groups: []
  }

};

console.log('[GRAFIS-AUTO-DATA] ✓ Loaded v2 — BAUM lengkap (13 grup), DAP & HTP placeholder');
