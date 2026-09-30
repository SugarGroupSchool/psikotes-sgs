/* ============================================================
   HTP — 1. Rumah
   ============================================================ */
window.GRAFIS_AUTO_DATA_HTP_SLIDES = window.GRAFIS_AUTO_DATA_HTP_SLIDES || [];

window.GRAFIS_AUTO_DATA_HTP_SLIDES.push({
  id: 'htp-01',
  title: '1. Rumah',
  sections: [

    /* ==========================================================
       1. PROPORSI — UKURAN
       ========================================================== */
    {
      id: 'proporsi_ukuran',
      title: '1. Proporsi — Ukuran',
      type: 'checkbox',
      items: [
        {
          id: 'ukuran_sangat_kecil',
          label: 'Sangat Kecil',
          ciri: 'Rumah digambar sangat kecil · menempati area minimal di kertas · sering di sudut',
          interpret: 'Simbol bahwa subjek merasa kurang berperan dalam keluarga. Adanya kecenderungan untuk menarik diri dari lingkungan keluarga, hal ini kemungkinan disebabkan oleh perasaan tak mampu atau penolakan terhadap situasi keluarga. Adapun dampaknya adalah kecenderungan regresi, di mana subjek kembali ke tingkah laku yang lebih primitif atau lebih muda secara emosional.'
        },
        {
          id: 'ukuran_sedang',
          label: 'Sedang',
          ciri: 'Rumah digambar dengan ukuran proporsional · wajar · tidak terlalu besar atau kecil',
          interpret: 'Ukuran rumah yang sedang mengindikasikan bahwa keluarga tidak terlalu membatasi subjek. Subjek memiliki ruang untuk berkembang tanpa adanya agresi atau permusuhan dalam keluarga, serta tanpa merasakan tekanan yang berlebihan.'
        },
        {
          id: 'ukuran_besar',
          label: 'Besar',
          ciri: 'Rumah digambar lebih besar dari ukuran rata-rata · memenuhi sebagian besar kertas',
          interpret: 'Rumah besar mencerminkan kemampuan subjek untuk mengatasi dan menghadapi kehidupan dengan lebih luas. Subjek memiliki kapasitas untuk mengatasi tantangan dan memiliki ruang yang cukup untuk berkembang.'
        },
        {
          id: 'ukuran_sangat_besar',
          label: 'Sangat Besar',
          ciri: 'Rumah digambar sangat besar · memenuhi hampir seluruh kertas · mendominasi',
          interpret: 'Rumah sangat besar dapat diartikan sebagai kontrol yang kuat dan pembatasan oleh keluarga terhadap subjek. Hal ini menyebabkan frustasi mendalam karena pembatasan lingkungan yang dapat menghasilkan iritabilitas, permusuhan, dan kecenderungan agresi terhadap keluarga. Subjek merasakan tekanan yang signifikan dari keluarganya, yang dapat memunculkan reaksi emosional negatif.'
        }
      ]
    },

    /* ==========================================================
       2. PROPORSI — JARAK
       ========================================================== */
    {
      id: 'proporsi_jarak',
      title: '2. Proporsi — Jarak',
      type: 'checkbox',
      items: [
        {
          id: 'jarak_sangat_jauh',
          label: 'Sangat Jauh',
          ciri: 'Rumah digambar jauh dari pengamat · jauh di kejauhan kertas · sering dikecilkan',
          interpret: 'Kesannya adalah subjek merasakan adanya jarak emosional atau fisik dengan keluarganya. Dapat disebabkan oleh perasaan ditolak atau ketidakmampuan menghadapi situasi rumah, yang mengakibatkan kecenderungan subjek untuk menarik diri dari keluarganya. Alhasil, subjek cenderung merasa kesepian atau terisolasi.'
        },
        {
          id: 'jarak_sangat_dekat',
          label: 'Sangat Dekat',
          ciri: 'Rumah digambar sangat dekat dengan pengamat · besar · mendetail',
          interpret: 'Hubungan antar anggota keluarga dirasakan sangat dekat, diwarnai dengan sikap hangat satu sama lain. Subjek dapat merasakan dukungan dan keterlibatan yang tinggi dalam keluarga, menciptakan ikatan interpersonal yang positif seperti perasaan keamanan dan kenyamanan.'
        }
      ]
    },

    /* ==========================================================
       3. PROPORSI — ATAP
       ========================================================== */
    {
      id: 'proporsi_atap',
      title: '3. Proporsi — Atap',
      type: 'checkbox',
      items: [
        {
          id: 'atap_terlalu_besar',
          label: 'Atap Terlalu Besar',
          ciri: 'Atap digambar jauh lebih besar dari proporsi rumah · mendominasi gambar',
          interpret: 'Atap rumah diartikan sebagai representasi dari superego — bagian kepribadian yang bertanggung jawab menginternalisasi norma-norma sosial, nilai-nilai, dan moralitas. Atap terlalu besar = simbol dari preferensi subjek untuk menghabiskan sebagian besar waktunya dalam dunia fantasi, menciptakan dan menjalani pengalaman-pengalaman yang tidak terbatas oleh keterbatasan realitas fisik.'
        },
        {
          id: 'atap_tidak_digambar',
          label: 'Rumah Digambar Tanpa Atap',
          ciri: 'Rumah tidak memiliki atap · langsung dinding · terbuka di atas',
          interpret: 'Ketika rumah digambar tanpa atap, dapat disimpulkan bahwa fungsi super ego subjek cenderung lemah atau belum sepenuhnya terbentuk. Ini mencerminkan kurangnya kendali internal terhadap norma dan moralitas.'
        },
        {
          id: 'atap_biasa',
          label: 'Digambar Biasa Tanpa Hiasan atau Penekanan Apapun',
          ciri: 'Atap digambar sederhana · tanpa hiasan · tanpa penekanan khusus',
          interpret: 'Jika rumah digambar tanpa hiasan atau penekanan khusus, hal ini menunjukkan bahwa fungsi super ego berjalan dengan normal. Subjek memiliki kontrol internal yang memadai terhadap norma dan nilai-nilai sosial.'
        },
        {
          id: 'atap_berlebihan',
          label: 'Atap Dibuat Berlebihan (Hiasan Ayam Jago, Genteng Satu per Satu)',
          ciri: 'Atap digambar detail berlebihan · hiasan ayam jago · genteng digambar satu per satu',
          interpret: 'Fokus yang berlebihan pada norma dan moralitas, namun perlu dipastikan melalui anamnesis atau wawancara lebih lanjut.'
        },
        {
          id: 'atap_kreatif',
          label: 'Atap yang Digambar Secara Kreatif',
          ciri: 'Atap digambar dengan elemen kreatif · unik · tidak konvensional',
          interpret: 'Mencerminkan kekayaan dan keragaman impian subjek. Setiap elemen pada atap menjadi simbol harapan, tujuan, dan kreativitas, menunjukkan pandangan kompleks, kreatif, kemungkinan pemenuhan impian dan ekspresi unik dalam merangkai harapan masa depan.'
        },
        {
          id: 'atap_terbakar_kecil',
          label: 'Atap Terbakar atau Atap Kecil dan Tidak Lengkap',
          ciri: 'Atap tampak terbakar · atau digambar kecil · tidak lengkap · tidak menutup rumah',
          interpret: 'Mencerminkan fantasi yang intens dan mungkin menakutkan bagi subjek. Ini dapat menjadi indikator ketegangan atau kecemasan yang terpendam.'
        }
      ]
    },

    /* ==========================================================
       4. PROPORSI — CEROBONG ASAP / PERAPIAN
       ========================================================== */
    {
      id: 'proporsi_cerobong',
      title: '4. Proporsi — Cerobong Asap / Perapian',
      type: 'checkbox',
      items: [
        {
          id: 'cerobong_terlalu_besar',
          label: 'Cerobong Asap yang Terlalu Besar',
          ciri: 'Cerobong asap digambar jauh lebih besar dari proporsi wajar · menonjol',
          interpret: 'Mencerminkan keasyikan seksual dan kecenderungan eksibisionisme. Subjek berupaya untuk menarik perhatian seksual atau keinginan untuk mengekspresikan secara terbuka sisi sensual atau eksibisionis dari diri seseorang.'
        },
        {
          id: 'perapian_kecil_tidak_proporsional',
          label: 'Perapian Kecil yang Tidak Proporsional',
          ciri: 'Perapian digambar kecil · tidak proporsional dengan rumah',
          interpret: 'Mencerminkan perasaan kekurangan kehangatan atau kenyamanan di rumah dan keraguan pria terhadap identitas kejantanannya.'
        }
      ]
    },

    /* ==========================================================
       5. PROPORSI — DINDING
       ========================================================== */
    {
      id: 'proporsi_dinding',
      title: '5. Proporsi — Dinding',
      type: 'checkbox',
      items: [
        {
          id: 'dinding_tidak_digambar',
          label: 'Rumah Digambar Tanpa Dinding',
          ciri: 'Rumah tidak memiliki dinding · hanya atap & pintu/jendela',
          interpret: 'Dinding rumah menjadi representasi visual dari kekuatan atau kelemahan fungsi ego dan identitas diri subjek. Jika rumah digambar tanpa dinding, ini dapat diartikan sebagai indikasi bahwa fungsi ego kurang berfungsi secara optimal. Absennya dinding mencerminkan kelemahan dalam menjaga batas dan perlindungan terhadap dunia luar.'
        },
        {
          id: 'dinding_dihias_dirusak',
          label: 'Rumah dengan Dinding Dihias atau Dirusak',
          ciri: 'Dinding dihiasi berlebihan · atau digambar rusak · retak · batu bata terlihat · runtuh',
          interpret: 'Subjek yang terlalu menitikberatkan perhatian pada dinding, baik dengan menghiasi atau merusaknya (retak, kelihatan batu batanya, atau bahkan runtuh), ini menandakan fokus subjek pada fungsi ego. Dekorasi atau kerusakan dinding menjadi refleksi dari bagaimana individu melihat dan mengelola perlindungan dirinya, menjaga batas diri atau melibatkan diri dalam perlindungan yang berlebihan atau tidak memadai.'
        }
      ]
    },

    /* ==========================================================
       6. PROPORSI — PINTU, JENDELA, TROTOAR
       ========================================================== */
    {
      id: 'proporsi_pintu_jendela',
      title: '6. Proporsi — Pintu, Jendela, Trotoar',
      type: 'checkbox',
      items: [
        {
          id: 'dinding_luas_pintu_kecil',
          label: 'Dinding Luas Namun Pintu Kecil',
          ciri: 'Dinding besar & luas · tapi pintu digambar kecil · akses terbatas',
          interpret: 'Pintu mencerminkan sejauh mana individu terlibat atau terbatas dalam interaksi dengan dunia di sekitarnya. Dinding luas mencerminkan dorongan untuk melindungi diri dari lingkungan luar atau menciptakan batasan yang kuat. Pintu kecil menunjukkan individu memiliki keinginan untuk berinteraksi dengan dunia luar, akses atau kemampuan untuk melakukannya mungkin terbatas atau sulit. Batasan-batasan ini dapat disebabkan oleh faktor keluarga, seperti kontrol yang ketat atau ketergantungan pada keluarga. Buck melihat bahwa pintu yang sangat kecil menunjukkan perasaan tidak mampu dan penolakan untuk menjalin kontak.'
        },
        {
          id: 'pintu_ukuran_sesuai',
          label: 'Pintu Sesuai dengan Ukuran Rumah',
          ciri: 'Pintu digambar proporsional · sesuai ukuran rumah',
          interpret: 'Mengindikasikan keseimbangan yang sehat antara privasi dan interaksi sosial dalam kehidupan subjek. Keluarga memberikan kesempatan pada subjek untuk bergaul dan berinteraksi dengan lingkungan luar rumah tanpa memberikan tekanan yang berlebihan pada privasi. Ini dapat mencerminkan adanya dukungan sosial dan kemungkinan pembentukan hubungan positif di luar lingkungan rumah.'
        },
        {
          id: 'pintu_lebih_dari_satu',
          label: 'Pintu Lebih dari Satu',
          ciri: 'Ada beberapa pintu pada rumah · lebih dari satu akses',
          interpret: 'Keluarga memberikan subjek kebebasan dan kesempatan luas untuk bergaul dan berinteraksi dengan lingkungan luar rumah. Variasi pintu mencerminkan fleksibilitas dalam pengambilan keputusan subjek dan kebebasan untuk mengeksplorasi berbagai aspek kehidupan di luar batas rumah. Keluarga cenderung mendorong subjek untuk tumbuh dan berkembang melalui interaksi yang beragam di masyarakat.'
        },
        {
          id: 'pintu_besar',
          label: 'Pintu Besar',
          ciri: 'Pintu digambar terlalu besar · melebihi proporsi wajar',
          interpret: 'Pintu yang terlalu besar menunjukkan keterangantungan yang berlebihan pada orang lain.'
        },
        {
          id: 'jendela_banyak',
          label: 'Rumah Digambar dengan Banyak Jendela',
          ciri: 'Jendela banyak · tersebar di seluruh rumah · beberapa jendela di setiap sisi',
          interpret: 'Jendela dapat dianggap sebagai elemen sekunder jika dibandingkan dengan pintu, namun tetap penting dalam memberikan gambaran tentang sejauh mana individu ingin berinteraksi dengan dunia luar. Jumlah jendela yang banyak sebagai indikator adanya dukungan dari keluarga, keterbukaan dan keinginan subjek untuk mengakses pengalaman yang beragam seperti menerima informasi dari luar, serta memberikan kesempatan untuk observasi dan interaksi visual dengan dunia di sekitar.'
        },
        {
          id: 'jendela_penutup_berkelok',
          label: 'Jendela dengan Penutup atau Jalan Berkelok-kelok',
          ciri: 'Jendela diberi penutup / kerai / gorden · atau ada jalan berkelok menuju jendela',
          interpret: 'Menciptakan gambaran simbolis tentang keterbatasan atau keengganan subjek untuk membuka diri. Penutup pada jendela dapat mengindikasikan rasa takut atau keinginan untuk melindungi privasi, sedangkan jalur berkelok-kelok mencerminkan adanya hambatan psikologis atau emosional terhadap interaksi sosial seperti kesulitan atau kompleksitas dalam berinteraksi atau mengekspresikan diri.'
        },
        {
          id: 'jendela_kamar_mandi_besar',
          label: 'Jendela Besar di Kamar Mandi',
          ciri: 'Jendela kamar mandi digambar besar · lebih besar dari jendela lain',
          interpret: 'Menciptakan gambaran eksibisionisme, adanya keinginan untuk eksposur dan ekspresi diri secara terbuka. Ukuran besar jendela menyoroti ketertarikan subjek pada aspek-aspek intim atau pribadi dari diri mereka sendiri yang ingin subjek bagikan atau perlihatkan kepada publik. Sedangkan Buck, bila jendela kamar mandi paling besar, diasumsikan fungsi kamar mandi mengganggu subjek. Konflik yang berkaitan dengan fungsi seksual atau ekskresi harus dicurigai.'
        },
        {
          id: 'jendela_ruang_tamu_kecil',
          label: 'Jendela Ruang Tamu Lebih Kecil dari yang Lain',
          ciri: 'Jendela ruang tamu digambar kecil · lebih kecil dari jendela ruangan lain',
          interpret: 'Menunjukkan ketidaksukaan terhadap interaksi sosial atau keterbatasan dalam membuka diri terhadap orang lain. Kecilnya jendela bisa diartikan sebagai penghalang yang menciptakan keterbatasan dalam membangun hubungan dengan dunia luar. Subjek mungkin merasa lebih nyaman atau aman dengan batasan tersebut, mengindikasikan preferensi terhadap privasi atau mungkin adanya ketidaknyamanan terkait dengan situasi sosial.'
        }
      ]
    },

    /* ==========================================================
       7. PROPORSI — RUANGAN
       ========================================================== */
    {
      id: 'proporsi_ruangan',
      title: '7. Proporsi — Ruangan',
      type: 'checkbox',
      items: [
        {
          id: 'ruangan_tembok_transparan',
          label: 'Ruangan dengan Tembok yang Transparan',
          ciri: 'Tembok ruangan digambar transparan · bagian dalam terlihat dari luar',
          interpret: 'Subjek menunjukkan kompleksitas hubungan antara keterbukaan dan batasan dalam interaksi sosial subjek.'
        },
        {
          id: 'ruang_keluarga',
          label: 'Ruang Keluarga',
          ciri: 'Ada penggambaran ruang keluarga · tempat berkumpul · sofa · meja keluarga',
          interpret: 'Pemilihan dan penggambaran ruang ini menyoroti pentingnya hubungan keluarga dalam kehidupan subjek. Ruang keluarga menjadi simbol tempat berkumpul, berbagi, dan menjalin interaksi yang mendalam dengan anggota keluarga, menciptakan ruang psikologis yang kaya akan nilai-nilai keluarga.'
        },
        {
          id: 'ruang_makan',
          label: 'Ruang Makan',
          ciri: 'Ada penggambaran ruang makan · meja makan · kursi makan',
          interpret: 'Menggambarkan kebutuhan dasar oral dan kebutuhan akan afek. Ruang makan mencerminkan kebutuhan biologis dasar subjek. Aspek afektif terkait dengan ruang makan mencerminkan kepentingan subjek terhadap hubungan sosial dan interaksi yang hangat selama saat makan.'
        },
        {
          id: 'ruang_tidur_pria_ibu',
          label: 'Ruang Tidur — Laki-laki Ingin Dekat dengan Ibu',
          ciri: 'Subjek pria · menggambar ruang tidur · sering dengan figur ibu di dalamnya',
          interpret: 'Subjek mengekspresikan keinginan atau kebutuhan untuk mendapatkan perhatian, dukungan, atau keamanan dari figur ibu sebagai simbol feminin dan sumber kasih sayang.'
        },
        {
          id: 'ruang_tidur_wanita_ayah',
          label: 'Ruang Tidur — Perempuan Ingin Dekat dengan Ayah',
          ciri: 'Subjek wanita · menggambar ruang tidur · sering dengan figur ayah di dalamnya',
          interpret: 'Mencerminkan keinginan subjek untuk mendapatkan persetujuan atau dukungan dari figur ayah sebagai simbol maskulin, menciptakan hubungan yang erat dengan aspek maskulin dalam diri.'
        },
        {
          id: 'kamar_mandi',
          label: 'Kamar Mandi',
          ciri: 'Ada penggambaran kamar mandi · biasanya dengan toilet atau bak mandi',
          interpret: 'Dikaitkan dengan fase anal. Menunjukkan adanya hubungan dengan fase perkembangan psikoseksual yang berkaitan dengan kontrol dan eliminasi. Subjek sedang mengalami ketegangan atau perasaan ambivalen terkait dengan kontrol diri atau kebutuhan untuk mengontrol lingkungan sekitar.'
        }
      ]
    },

    /* ==========================================================
       8. SUDUT PANDANG
       ========================================================== */
    {
      id: 'sudut_pandang',
      title: '8. Sudut Pandang',
      type: 'checkbox',
      items: [
        {
          id: 'perspektif_ganda',
          label: 'Perspektif Ganda (Dinding Utama Diapit Dua Dinding Terminal)',
          ciri: 'Dinding utama diapit dua dinding terminal · dinding ujung lebih kecil dari dinding utama',
          interpret: 'Penderita keterbelakangan mental sering menggambar rumah dengan "perspektif ganda", yang menunjukkan tembok utama diapit oleh dua tembok terminal. Dinding ujung biasanya lebih kecil dari dinding utama. Anak-anak kecil juga menghasilkan gambar jenis ini.'
        },
        {
          id: 'dinding_terminal_besar',
          label: 'Dinding Terminal Lebih Besar dari Dinding Utama',
          ciri: 'Dinding ujung / terminal digambar lebih besar dari dinding utama',
          interpret: 'Penderita skizofrenia menggambar dinding terminal lebih besar dari dinding utama. Rupanya penderita skizofrenia menganggap dinding samping sebagai pelindung dinding utama rumah.'
        },
        {
          id: 'kehilangan_perspektif',
          label: 'Kehilangan Perspektif',
          ciri: 'Perspektif tidak konsisten · satu ujung menunjukkan kedalaman · ujung lain terpotong tiba-tiba',
          interpret: 'Penderita skizoid mungkin benar-benar kehilangan perspektif terhadap gambar rumah. Misalnya, Anda dapat menggambar dinding samping dan atap di salah satu ujung rumah dan, di ujung lainnya, menggambar garis tegak lurus dengan garis dasar dinding dan atap. Hasilnya tidak sesuai. Salah satu ujungnya menunjukkan kedalaman sementara ujung lainnya tampak terpotong secara tiba-tiba. Hal ini tampaknya menunjukkan permulaan masalah dalam organisasi dan mungkin penyumbatan sementara.'
        },
        {
          id: 'empat_sisi',
          label: 'Memperlihatkan Keempat Sisi Rumah Secara Bersamaan',
          ciri: 'Rumah digambar memperlihatkan keempat sisinya sekaligus · tidak wajar',
          interpret: 'Seseorang yang merasa tidak berdaya karena tekanan lingkungan dan terlalu peduli dengan apa yang dipikirkan orang lain terkadang akan menggambar sebuah rumah yang memperlihatkan keempat sisinya secara bersamaan.'
        },
        {
          id: 'hanya_denah',
          label: 'Hanya Menggambar Denah Rumah',
          ciri: 'Rumah digambar sebagai denah / floor plan · bukan tampak depan',
          interpret: 'Subjek yang mengalami konflik serius di rumahnya mungkin hanya menggambar denah rumahnya, yang mencerminkan upaya untuk menyusun situasi. Kecenderungan orang-orang ini untuk mengilustrasikan perasaan mereka terhadap masalah dengan menampilkan ruangan atau penghuninya dengan mengubah ukuran atau lokasi sebenarnya sangatlah mencolok.'
        },
        {
          id: 'tepi_lembaran',
          label: 'Tepi Lembaran',
          ciri: 'Langit-langit terkoyak di tepi atas kertas · atau tepi sisi halaman dipakai sebagai garis dinding',
          interpret: 'Langit-langit yang terkoyak di tepi atas kertas menunjukkan kebutuhan patologis untuk mencari kepuasan dalam fantasi. Menggunakan tepi sisi halaman sebagai garis dinding sisi rumah menunjukkan ketidakamanan umum.'
        },
        {
          id: 'pandangan_mata_cacing',
          label: 'Hubungan dengan Pengamat — Pandangan Mata Cacing',
          ciri: 'Rumah digambar dari sudut pandang rendah · seperti dilihat dari bawah',
          interpret: 'Terkadang rumah digambar dengan pandangan mata cacing. Ini menunjukkan perasaan penolakan di rumah, atau perjuangan untuk situasi yang tidak berkelanjutan. Itu juga bisa mewakili keinginan untuk melarikan diri.'
        },
        {
          id: 'jarak_jauh_nyata',
          label: 'Jarak Nyata dari Pengamat',
          ciri: 'Rumah digambar jauh dari pengamat · ada detail di antaranya · mungkin pohon, sungai, jalan setapak',
          interpret: 'Rumah lebih cenderung digambarkan sebagai jarak yang jauh bagi pengamat dibandingkan dengan pohon atau orangnya, terutama bila jarak ditunjukkan dengan detail antara keseluruhan dan pengamat. Misalnya, seorang pecandu alkohol kronis, tidak puas dengan menggambar sebuah kabin kecil, menggambar pohon-pohon di dekatnya, sebuah sungai (dengan seorang India mengayuh sungai dengan kano), dan akhirnya sebuah jalan setapak antara rumah dan para pengamat. Hal ini ditafsirkan sebagai ekspresi keinginan kuat untuk menyimpang sejauh mungkin dari konvensi sosial, untuk hidup di tempat yang memungkinkan seseorang berpakaian dan bertindak sesukanya tanpa takut dikritik.'
        },
        {
          id: 'posisi_profil_sebagian',
          label: 'Posisi — Sebagian Profilnya (Dinding Samping + Dinding Utama)',
          ciri: 'Rumah digambar sebagian profil · menampilkan dinding samping & dinding utama',
          interpret: 'Rumah yang digambar sebagian profilnya, dengan dinding samping dan dinding utama, umumnya menunjukkan kecenderungan untuk berperilaku sensitif dan fleksibel.'
        },
        {
          id: 'posisi_profil_penuh',
          label: 'Posisi — Sepenuhnya Diprofilkan',
          ciri: 'Rumah digambar sepenuhnya dari samping · hanya satu sisi terlihat',
          interpret: 'Rumah yang sepenuhnya diprofilkan menunjukkan kecenderungan isolasi dan oposisi.'
        },
        {
          id: 'transparansi',
          label: 'Transparansi (Dinding Transparan, Cerobong Terlihat dari Belakang)',
          ciri: 'Dinding rumah transparan · cerobong di belakang terlihat melalui fasad & dinding belakang',
          interpret: 'Hanya subjek dengan gangguan serius atau keterbelakangan yang menggambar rumah tersebut dengan dinding transparan. Jika cerobong asap di bagian belakang rumah terlihat melalui fasad dan dinding belakang, subjek mungkin mengalami keasyikan lingga yang luar biasa dan merasa bahwa keasyikan ini terlihat jelas bagi orang lain. Jika cerobongnya transparan atau tidak memiliki kedalaman, penolakan lingga dapat ditemukan, yang mewakili perasaan tidak berdaya, takut dikebiri, atau keduanya.'
        },
        {
          id: 'gerakan_patologis',
          label: 'Gerakan — Atap Terbang, Dinding Runtuh, dll',
          ciri: 'Rumah digambar bergerak · atap terbang · dinding runtuh · tidak stabil',
          interpret: 'Rumah biasanya digambar berdiri dan utuh. Indikasi pergerakan apa pun, seperti atap yang terbang, dinding yang runtuh, dll., bersifat patologis dan menunjukkan keruntuhan ego yang akan segera terjadi di bawah tekanan ekstrapersonal, tekanan intrapersonal, atau keduanya, bergantung pada penjelasan subjek tentang runtuhnya rumah. Seorang pasien skizoid menggambar sebuah rumah sederhana dengan cerobong asap dan atap di atas tanah, yang diledakkan oleh angin puting beliung, katanya. Beberapa minggu kemudian dia mengalami kondisi katatonik.'
        },
        {
          id: 'asap_miring',
          label: 'Asap yang Miring ke Satu Sisi (Ada Tekanan Lingkungan)',
          ciri: 'Asap keluar dari cerobong tidak naik ke atas · miring ke satu sisi · biasanya kiri ke kanan',
          interpret: 'Perasaan terhadap tekanan lingkungan dapat diungkapkan secara simbolis melalui asap, yang bukannya naik dari cerobong asap, malah melayang ke satu sisi, menandakan bahwa angin sedang bertiup. Besarnya tegangan dapat dinyatakan dengan derajat pembelokan asap dari arah ke atas. Umumnya asap diambil dari kiri ke kanan.'
        },
        {
          id: 'asap_kanan_kiri',
          label: 'Asap Menandakan Angin dari Kanan ke Kiri',
          ciri: 'Asap mengarah ke kiri · menandakan angin dari kanan',
          interpret: 'Jika asap menandakan angin bertiup dari kanan ke kiri, maka individu tersebut diasumsikan memandang masa depan dengan pesimis.'
        },
        {
          id: 'asap_dua_arah',
          label: 'Asap Muncul ke Dua Arah',
          ciri: 'Asap keluar dari cerobong ke dua arah sekaligus · tidak wajar',
          interpret: 'Asap sangat jarang muncul ke dua arah. Presentasi ini berlebihan dan hanya dibuat oleh individu psikotik. Besarnya perasaan subjek sering kali terungkap dari banyaknya asap.'
        }
      ]
    },

    /* ==========================================================
       9. DETAIL PENTING
       ========================================================== */
    {
      id: 'detail_penting',
      title: '9. Detail Penting',
      type: 'checkbox',
      items: [
        {
          id: 'detail_wajib',
          label: 'Detail Wajib (Pintu, Jendela, Atap, Dinding, Cerobong)',
          ciri: 'Rumah harus memiliki minimal 1 pintu · jendela · dinding · atap · cerobong asap',
          interpret: 'Rumah harus memiliki setidaknya satu pintu (kecuali hanya dinding samping yang ditampilkan, yang menunjukkan adanya patologi). Tempat tersebut harus mempunyai pintu, jendela, dinding atap (kecuali jika diidentifikasi sebagai penginapan tropis atau jenis tempat tinggal tanpa atap lainnya) dan harus mempunyai cerobong asap atau alat untuk mengeluarkan asap.'
        },
        {
          id: 'penekanan_garis_periferal',
          label: 'Penekanan Berlebihan pada Garis Periferal / Garis Penahan',
          ciri: 'Garis tepi rumah (atap & dinding) ditebalkan · dipertegas berlebihan',
          interpret: 'Rupa atap dan dinding rumah secara kasar mewakili diri subjek: batas periferal kepribadian diwakili oleh batas periferal atap dan dinding. Penekanan yang berlebihan pada garis periferal atau garis "penahan" ini tampaknya menunjukkan upaya sadar untuk mempertahankan kendali.'
        },
        {
          id: 'garis_kontur_lemah',
          label: 'Garis Kontur Tidak Memadai atau Lemah',
          ciri: 'Garis tepi rumah tipis · lemah · tidak jelas · tidak tegas',
          interpret: 'Garis kontur yang tidak memadai atau lemah menunjukkan perasaan keruntuhan yang tak terhindarkan dan kontrol ego yang buruk.'
        },
        {
          id: 'atap_hingga_lantai',
          label: 'Atap Memanjang Hingga ke Lantai',
          ciri: 'Atap rumah memanjang hingga ke lantai · menjadi dinding & langit-langit',
          interpret: 'Jika rumah dianggap sebagai potret diri psikologis, atap melambangkan bahtera pemikiran dan fantasi. Atapnya bisa memanjang hingga ke lantai dan menjadi dinding dan langit-langit. Jenis rumah ini digambar oleh penderita skizofrenia yang tampaknya secara simbolis menekankan fakta bahwa dunia mereka sebagian besar hanyalah fantasi.'
        },
        {
          id: 'penekanan_atap_defensif',
          label: 'Penekanan pada Bagian Atap (Penguatan atau Perluasan Melampaui Dinding)',
          ciri: 'Atap ditebalkan · atau diperluas melampaui dinding rumah',
          interpret: 'Penekanan pada bagian atap, melalui penguatan atau perluasan melampaui dinding, menyiratkan sikap defensif yang berlebihan dan umumnya mencurigakan.'
        },
        {
          id: 'pintu_belakang_samping',
          label: 'Pintu Belakang dan Samping (Sikap Melarikan Diri)',
          ciri: 'Ada pintu belakang · atau pintu samping · di samping pintu utama',
          interpret: 'Pintu dan jendela biasanya mewakili aksesibilitas. Pintu belakang dan samping rupanya menekankan sikap melarikan diri.'
        },
        {
          id: 'penekanan_pintu_kunci',
          label: 'Penekanan pada Pintu, Kunci, atau Engsel',
          ciri: 'Pintu · kunci · atau engsel digambar dengan penekanan khusus · detail',
          interpret: 'Penekanan pada pintu, kunci atau engsel menunjukkan kepekaan defensif.'
        },
        {
          id: 'penekanan_kenop',
          label: 'Penekanan pada Kenop Pintu',
          ciri: 'Kenop pintu digambar detail · menonjol · dipertegas',
          interpret: 'Menekankan pada kenop pintu menunjukkan terlalu banyak kesadaran tentang fungsi pintu atau keasyikan lingga.'
        },
        {
          id: 'jendela_tanpa_kaca',
          label: 'Jendela Tanpa Kaca / Celah',
          ciri: 'Jendela tidak diberi kaca · atau ada celah tanpa indikasi kaca',
          interpret: 'Jendela rumah memberikan bentuk interaksi yang kurang langsung dan tidak langsung dibandingkan pintu. Sebuah jendela tanpa kaca, celah, atau indikasi kaca apa pun sering kali digambar oleh subjek yang cenderung menentang, yang, pada dasarnya, mengatakan, "Saya akan membuat Anda mustahil melihat ke dalam".'
        },
        {
          id: 'jendela_banyak_celah',
          label: 'Terlalu Banyak Celah pada Jendela',
          ciri: 'Jendela dengan banyak celah · teralis berlebihan · seperti penjara',
          interpret: 'Terlalu banyak celah dapat mengungkapkan perasaan bahwa ruangan di balik jendela itu adalah penjara.'
        },
        {
          id: 'kunci_jendela',
          label: 'Kunci pada Jendela',
          ciri: 'Jendela diberi kunci · atau indikasi terkunci',
          interpret: 'Kunci pada jendela menunjukkan sikap defensif yang berlebihan.'
        },
        {
          id: 'banyak_jendela_terbuka',
          label: 'Banyaknya Jendela yang Tidak Tertutup',
          ciri: 'Banyak jendela terbuka · tanpa penutup · tanpa kerai',
          interpret: 'Banyaknya jendela yang tidak tertutup menyiratkan bahwa subjek cenderung berperilaku jujur dan terus terang.'
        },
        {
          id: 'jendela_pintu_oral_vagina',
          label: 'Jendela & Pintu Sebagai Pengganti Oral / Vagina / Dubur',
          ciri: 'Jendela & pintu digambar dengan bentuk / penekanan khusus pada area tersebut',
          interpret: 'Subjek yang mengalami maladaptasi seksual cenderung melihat jendela dan pintu sebagai pengganti oral, vagina, atau dubur. Jendela di lantai dasar lebih sering dihilangkan atau diubah ukuran atau lokasinya dibandingkan jendela di lantai atas.'
        },
        {
          id: 'rumah_berpenghuni',
          label: 'Rumah Digambar Berpenghuni',
          ciri: 'Ada indikasi rumah dihuni · cahaya · aktivitas · orang di dalam',
          interpret: 'Kadang-kadang, jendela dan pintu rumah dibuka. Menggambarkan rumah sebagai rumah berpenghuni berarti tingkat aksesibilitas yang tinggi dan santai. Jika dikatakan rumah tersebut tidak berpenghuni, maka dapat diasumsikan kurangnya pertahanan ego. Dalam setiap kasus, penafsirannya dapat dimodifikasi tergantung pada deskripsi subjek tentang cuaca.'
        },
        {
          id: 'cerobong_mudah',
          label: 'Cerobong Asap Digambar dengan Mudah (Tanpa Distorsi atau Penekanan)',
          ciri: 'Cerobong digambar natural · mudah · tanpa distorsi · tanpa penekanan',
          interpret: 'Ketika cerobong asap ditarik dengan mudah tanpa distorsi atau penekanan, ini menyiratkan bahwa individu tersebut memiliki kematangan dan keseimbangan sensual yang memuaskan.'
        },
        {
          id: 'cerobong_dihilangkan',
          label: 'Penghilangan Cerobong Asap',
          ciri: 'Cerobong asap tidak digambar · rumah tanpa cerobong',
          interpret: 'Penghilangan cerobong asap tidak menunjukkan ketidaksesuaian yang serius seperti penekanannya yang berlebihan. Individu yang mengalami maladaptasi seksual cenderung memperlakukan perapian sebagai simbol lingga.'
        },
        {
          id: 'asap_banyak',
          label: 'Banyaknya Asap yang Keluar dari Cerobong',
          ciri: 'Asap keluar sangat banyak dari cerobong · mengepul · menumpuk',
          interpret: 'Banyaknya asap yang keluar dari cerobong asap menunjukkan ketegangan internal yang kuat, kemungkinan disebabkan oleh hubungan yang tidak memuaskan dengan orang-orang yang tinggal bersama subjek. Anak kecil biasanya menggambar cerobong asap dengan sudut siku-siku pada atap segitiga. Anak-anak kecil dan subjek regresif dapat menyusun detail-detail penting secara antropomorfik, sehingga tampak seperti manusia.'
        }
      ]
    },

    /* ==========================================================
       10. DETAIL TIDAK PENTING
       ========================================================== */
    {
      id: 'detail_tidak_penting',
      title: '10. Detail Tidak Penting',
      type: 'checkbox',
      items: [
        {
          id: 'tirai_gorden',
          label: 'Tirai, Kerai, Gorden yang Tidak Tertutup Sempurna',
          ciri: 'Jendela diberi tirai · kerai · gorden · tapi tidak tertutup sempurna',
          interpret: 'Detail rumah yang paling umum dan tidak penting adalah tirai dan indikator bahan konstruksi. Daun jendela, kerai, gorden yang tidak tertutup sempurna menunjukkan interaksi yang dikontrol secara sadar dengan lingkungan dan disertai sedikit rasa cemas. Jika ketiga detail tersebut digambar, kemungkinan besar subjeknya sangat defensif.'
        },
        {
          id: 'beberapa_jendela_tertutup',
          label: 'Beberapa Jendela Tertutup, Beberapa Tidak',
          ciri: 'Ada jendela tertutup kerai/gorden · ada yang terbuka',
          interpret: 'Jika beberapa jendela ditutup dengan kerai, gorden atau kaca, sementara yang lain tidak, pada pemeriksaan selanjutnya hendaknya menyelidiki ruangan di belakang jendela yang berbeda: siapa yang menempatinya dan ruangan seperti apa. Sikap individu terhadap penghuni ruangan atau terhadap fungsinya dapat menjelaskan penyimpangan tersebut.'
        },
        {
          id: 'banyak_gorden',
          label: 'Banyaknya Jendela dengan Gorden atau Kerai',
          ciri: 'Hampir semua jendela diberi gorden / kerai',
          interpret: 'Banyaknya jendela dengan gorden atau kerai menunjukkan terlalu banyaknya perhatian terhadap interaksi dengan lingkungan.'
        },
        {
          id: 'bahan_atap_mudah',
          label: 'Bahan Atap Digambar dengan Mudah',
          ciri: 'Bahan atap digambar sederhana · beberapa guratan · tanpa detail berlebihan',
          interpret: 'Bahan atap biasanya diwakili dengan metode mulai dari menguraikan setiap sirap dengan cermat hingga menunjukkan keberadaan bahan dengan beberapa guratan. Materi yang digambar dengan mudah dan tanpa paksaan nampaknya menunjukkan sedikit kesadaran akan diferensiasi antar permukaan dan kemampuan berinteraksi secara seimbang dengan lingkungan.'
        },
        {
          id: 'bahan_atap_detail',
          label: 'Bahan Atap Digambar Sangat Rinci',
          ciri: 'Atap digambar detail · setiap genteng · sirap · tekstur jelas',
          interpret: 'Materi yang sangat rinci menyiratkan kecenderungan obsesif-kompulsif. Material dinding lebih jarang digambar dibandingkan bagian rumah lainnya, sedangkan material cerobong paling banyak digambar.'
        },
        {
          id: 'talang_pipa_hujan',
          label: 'Talang dan Pipa Hujan',
          ciri: 'Ada talang air · pipa hujan · saluran air pada atap / dinding',
          interpret: 'Menggambar talang dan pipa hujan mengandung arti sikap defensif yang kuat (dan umumnya curiga) disertai upaya untuk menyalurkan rangsangan yang tidak menyenangkan.'
        }
      ]
    },

    /* ==========================================================
       11. DETAIL TIDAK RELEVAN
       ========================================================== */
    {
      id: 'detail_tidak_relevan',
      title: '11. Detail Tidak Relevan',
      type: 'checkbox',
      items: [
        {
          id: 'semak_semak',
          label: 'Semak-semak',
          ciri: 'Ada semak-semak digambar di dekat rumah',
          interpret: 'Detail paling umum yang tidak relevan untuk rumah adalah semak-semak dan jalan setapak. Semak-semak yang digambar di dekat rumah melambangkan kebutuhan untuk mendirikan penghalang pertahanan atau melakukan kontak dengan orang lain dengan gaya yang agak formal. Semak juga dapat mewakili orang-orang dalam lingkungan subjek.'
        },
        {
          id: 'pohon_dekat_rumah',
          label: 'Pohon Dekat Rumah',
          ciri: 'Ada pohon digambar di dekat rumah',
          interpret: 'Pohon umumnya mewakili orang-orang yang mempunyai nilai positif atau negatif yang kuat terhadap individu. Psikolog harus mengidentifikasi orang-orang tersebut selama interogasi berikutnya. Pohon tidak relevan yang digambar di dekat rumah biasanya mewakili individu dan dapat menunjukkan perasaan penolakannya oleh orang tua dan kebutuhan akan kasih sayang. Letak pohon di dekat rumah dan dekat semak-semak, yang kemudian diidentifikasikan sebagai saudara, dapat mengungkapkan kebutuhan untuk diterima oleh mereka.'
        },
        {
          id: 'bunga_tulip_daisy',
          label: 'Bunga Tulip / Bunga Aster di Sekitar Rumah',
          ciri: 'Ada bunga tulip / bunga aster digambar di sekitar rumah · biasanya oleh anak / skizofrenia',
          interpret: 'Terkadang anak kecil atau penderita skizofrenia menggambar bunga tulip atau bunga seperti bunga aster di sekitar rumah.'
        },
        {
          id: 'jalan_proporsional',
          label: 'Jalan Setapak yang Proporsional',
          ciri: 'Ada jalan setapak · proporsional · mudah ditarik · mengarah ke pintu',
          interpret: 'Jalan yang proporsional dan mudah ditarik tampaknya menyiratkan bahwa individu menjalankan kendali dan kebijaksanaan dalam hubungannya dengan orang lain.'
        },
        {
          id: 'jalan_sangat_panjang',
          label: 'Jalur yang Sangat Panjang',
          ciri: 'Jalan setapak digambar sangat panjang · berkelok · jauh',
          interpret: 'Jalur yang sangat panjang menunjukkan berkurangnya aksesibilitas.'
        },
        {
          id: 'garis_tengah_dua_lantai',
          label: 'Garis di Tengah Dinding (Menunjukkan Dua Lantai)',
          ciri: 'Ada garis horizontal di tengah dinding · seperti pemisah lantai',
          interpret: 'Kadang-kadang sebuah garis ditarik di tengah-tengah dinding untuk menunjukkan bahwa rumah itu mempunyai dua lantai. Hal ini menunjukkan perpecahan kepribadian yang tidak diinginkan dengan penekanan somatik.'
        },
        {
          id: 'tangga_tembok_kosong',
          label: 'Tangga yang Mengarah ke Tembok Kosong',
          ciri: 'Ada tangga digambar · tapi mengarah ke tembok kosong · tidak ada pintu',
          interpret: 'Ketika langkah-langkah diambil, terkadang langkah-langkah tersebut mengarah ke tembok kosong, yang berarti terdapat ambivalensi yang kuat dalam menjalin kontak dengan orang-orang di lingkungan terdekat.'
        },
        {
          id: 'toilet_tempat_sampah',
          label: 'Toilet atau Tempat Sampah di Dekat Rumah',
          ciri: 'Ada toilet · atau tempat sampah digambar di dekat rumah besar',
          interpret: 'Detail yang merendahkan martabat, seperti toilet atau tempat sampah, terkadang digambar di dekat rumah yang terlihat seperti rumah besar untuk menunjukkan perasaan permusuhan yang agresif.'
        },
        {
          id: 'tanpa_garis_dasar',
          label: 'Tidak Ada Garis Dasar / Rumah Menggantung',
          ciri: 'Rumah tidak diberi garis dasar · atau tergantung di udara',
          interpret: 'Jika tidak ada garis dasar atau rumah tergantung di atasnya, kontak dengan kenyataan mungkin sangat lemah.'
        },
        {
          id: 'awan',
          label: 'Awan',
          ciri: 'Ada awan digambar di langit sekitar rumah',
          interpret: 'Awan menunjukkan kecemasan umum.'
        },
        {
          id: 'gunung_latar',
          label: 'Gunung-gunung Sebagai Latar Belakang',
          ciri: 'Ada gunung digambar sebagai latar belakang rumah',
          interpret: 'Gunung-gunung yang kadang-kadang digambarkan sebagai latar belakang menyiratkan kebutuhan yang kuat akan ketergantungan dan sikap defensif.'
        },
        {
          id: 'salju_hujan',
          label: 'Salju dan Hujan',
          ciri: 'Ada salju / hujan digambar pada gambar rumah',
          interpret: 'Meskipun jarang terjadi, salju dan hujan menyiratkan kebutuhan yang besar bagi individu untuk mengekspresikan perasaannya karena tekanan lingkungan yang kuat dan menindas. Salju memiliki implikasi patologis yang lebih besar dibandingkan hujan.'
        }
      ]
    },

    /* ==========================================================
       12. DIMENSI, BAYANGAN & URUTAN DETAIL
       ========================================================== */
    {
      id: 'dimensi_bayangan_urutan',
      title: '12. Dimensi, Bayangan & Urutan Detail',
      type: 'checkbox',
      items: [
        {
          id: 'dimensi_berubah',
          label: 'Dimensi yang Berubah (3D Jadi Denah)',
          ciri: 'Rumah dimulai sebagai gambar 3D · tapi akhirnya jadi denah 2D',
          interpret: 'Rumah sangat jarang memiliki fitur satu dimensi. Kerusakan organik diindikasikan jika subjek memulai rumahnya seolah-olah itu adalah gambar tiga dimensi konvensional tetapi akhirnya menghasilkan denah yang setara.'
        },
        {
          id: 'bayangan_material',
          label: 'Bayangan Material Dinding & Garis Kaca',
          ciri: 'Ada bayangan untuk material dinding · garis melintasi jendela untuk menyiratkan kaca',
          interpret: 'Peneduh rumah yang normal mencakup representasi material dinding dan garis-garis melintasi jendela untuk menyiratkan kaca.'
        },
        {
          id: 'bayangan_spontan',
          label: 'Bayangan yang Tergambar Spontan Sebelum Menggambar Matahari',
          ciri: 'Ada shading digambar lebih dulu · sebelum menggambar elemen lain seperti matahari',
          interpret: 'Bayangan yang tergambar secara spontan sebelum menggambar matahari melambangkan situasi konflik di mana kecemasan dialami pada tingkat sadar.'
        },
        {
          id: 'urutan_umum',
          label: 'Urutan Menggambar Umum (Atap → Dinding → Pintu → Jendela)',
          ciri: 'Subjek memulai dengan atap · lalu dinding · pintu · jendela · atau mulai dari garis dasar → dinding → atap',
          interpret: 'Kebanyakan subjek memulai rumah dengan menggambar atap, dinding, pintu dan jendela; atau menggambar garis dasar, dinding dan atap.'
        },
        {
          id: 'urutan_simetris',
          label: 'Menggambar Secara Simetris (Dua Cerobong, Dua Jendela, Dua Pintu)',
          ciri: 'Semua elemen digambar berpasangan · simetris · dua-dua',
          interpret: 'Individu yang merasa tidak aman terkadang menggambar secara simetris (dua cerobong asap, dua jendela, dua pintu, dll.).'
        },
        {
          id: 'urutan_segmen',
          label: 'Menggambar Segmen-segmen (Detail demi Detail Tanpa Hubungan)',
          ciri: 'Menggambar detail satu per satu · tanpa mempertimbangkan hubungan antar detail atau dengan keseluruhan',
          interpret: 'Individu yang mengalami maladaptasi berat kadang-kadang menggambar segmen-segmen (detail demi detail, tanpa mempertimbangkan hubungan detail satu sama lain atau dengan keseluruhan).'
        }
      ]
    }

  ]
});
