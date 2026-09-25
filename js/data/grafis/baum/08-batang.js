/* ============================================================
   BAUM — 8. Bentuk Batang
   ============================================================ */
window.GRAFIS_AUTO_DATA_BAUM_SLIDES = window.GRAFIS_AUTO_DATA_BAUM_SLIDES || [];

/* 🖼️ Base URL folder gambar */
const BASE_BATANG = 'https://raw.githubusercontent.com/SugarGroupSchool/psikotes-sgs/refs/heads/main/js/data/grafis/assets/';

window.GRAFIS_AUTO_DATA_BAUM_SLIDES.push({
  id: 'baum-08-batang',
  title: '8. Bentuk Batang',
  image: BASE_BATANG + '4-batang%20t.png',
  sections: [

    /* ==========================================================
       1. BENTUK DASAR BATANG
       ========================================================== */
    {
      id: 'bentuk_dasar',
      title: '1. Bentuk Dasar Batang',
      type: 'checkbox',
      items: [
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: dua garis sejajar
          id: 'dua_garis_sejajar',
          label: 'Dua Garis Sejajar (Umum / Normal)',
          interpret: 'Pada umumnya, batang pohon diilustrasikan dengan dua garis sejajar yang mencerminkan keselarasan dan bentuk umumnya. Gambaran ini dianggap normal dan wajar pada semua usia.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: batang satu garis
          id: 'satu_garis',
          label: 'Satu Garis (Anak-anak)',
          interpret: 'Anak-anak seringkali menggambarkan batang pohon hanya dengan satu garis — hal ini wajar dalam tahap perkembangan. Kecenderungan ini biasanya berkurang atau hilang seiring bertambahnya usia (sekitar usia 5 tahun gambar batang satu garis mulai berkurang). Pada anak dengan keterbelakangan, kecenderungan ini berlanjut hingga usia 8 tahun. Data statistik: sekitar 42% anak dengan keterbelakangan masih menggambar batang satu garis hingga usia tertentu, dan sekitar 72% orang dewasa yang mengalami keterbelakangan masih menggunakan satu garis saat menggambarkan batang.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',
          id: 'bentuk_t',
          label: 'Bentuk T',
          interpret: 'Bentuk T adalah bentuk awal pada gambaran anak-anak. Ini mencerminkan: (1) Kurang Cerdas — bentuk T yang kurang cemerlang atau tidak menunjukkan kompleksitas yang diharapkan dapat mengindikasikan keterbatasan kapasitas kognitif anak-anak dan mencerminkan tingkat kecerdasan yang masih dalam tahap perkembangan awalnya. (2) Cenderung Dikendalikan oleh Dorongan — jika anak menunjukkan kecenderungan menghasilkan gambar batang yang lebih didasarkan pada dorongan daripada pemikiran terencana, ini bisa mencerminkan dominasi instingual yang kuat. Respon terhadap instruksi tes lebih dipengaruhi oleh dorongan alami daripada proses kognitif yang lebih kompleks.'
        }
      ]
    },

    /* ==========================================================
       2. BENTUK KHUSUS BATANG
       ========================================================== */
    {
      id: 'bentuk_khusus',
      title: '2. Bentuk Khusus Batang',
      type: 'checkbox',
      items: [
        {
          image: BASE_BATANG + '5-batang%20membengkak.png',
          id: 'membengkak',
          label: 'Batang Membengkak',
          interpret: 'Mencerminkan beberapa hal: (1) Adanya hambatan dalam pengungkapan atau pengelolaan afeksi — anak atau subjek kesulitan mengekspresikan perasaan secara tepat terhadap lingkungan atau hubungan interpersonal. (2) Adanya kebutuhan yang tidak tersalurkan — seseorang memiliki kebutuhan emosional dan psikologis tetapi kurang mendapat perhatian atau pemahaman yang memadai. Dampaknya melibatkan ketidaknyamanan emosional, ketidakseimbangan psikologis, dan kesulitan dalam berinteraksi sosial. (3) Dorongan kuat tanpa kemampuan yang memadai — ada ketidakseimbangan antara intensitas dorongan emosional dan keterbatasan dalam mengelola atau menyalurkannya secara sehat. Dampaknya dapat mencakup frustrasi, ketegangan emosional, dan kesulitan menjalin hubungan interpersonal yang seimbang.'
        },
        {
          image: BASE_BATANG + '6-keroak.png',
          id: 'keroak',
          label: 'Batang Keroak',
          interpret: 'Mencerminkan: (1) Rasa bersalah yang besar dan kecenderungan rasa minder — subjek mengalami beban emosional yang berat, dapat menghasilkan rasa minder atau rendah diri. Perasaan bersalah yang signifikan dapat menjadi beban berat secara emosional, membentuk citra diri yang negatif, dan mempengaruhi kemampuan individu untuk berhubungan dengan orang lain dengan cara yang sehat. (2) Pernah mengalami trauma — indikasi subjek pernah mengalami trauma yang tidak hanya memengaruhi pemikiran tetapi juga merasuk ke respons emosional, menciptakan citra visual yang kuat sebagai wujud dari dampak yang dirasakan. Penggunaan simbol seperti gambar batang keroak menggambarkan kompleksitas dan kedalaman pengaruh trauma. Catatan: kejadian ini jarang ditemui — bisa dianggap sebagai petunjuk yang cukup spesifik terkait kondisi emosional subjek.'
        },
        {
          image: BASE_BATANG + '7-kerucut.png',
          id: 'kerucut',
          label: 'Batang Kerucut',
          interpret: 'Mencerminkan: (1) Konkrit dalam menghadapi sesuatu — subjek lebih suka menghadapi hal-hal dengan cara yang jelas dan langsung, tidak terlalu suka berspekulasi atau memikirkan hal-hal abstrak, lebih suka fokus pada hal yang nyata dan membuat keputusan berdasarkan fakta konkret. (2) Cenderung statis — tidak suka perubahan dan lebih suka menjalani kehidupan dengan cara yang tetap dan teratur. (3) Gejala retardasi — perkembangan kognitif atau intelektual subjek tidak sesuai dengan tingkat usianya. (4) Kemungkinan lambat belajar — memerlukan lebih banyak waktu atau pendekatan pengajaran yang lebih konkret untuk mengatasi konsep-konsep abstrak. (5) Lebih praktis tetapi motorik agak kasar — kesulitan dalam mengkoordinasikan gerakan fisik atau kurangnya kehalusan motorik. Catatan: anak yang baru memasuki sekolah umumnya menghasilkan gambaran ini (normal pada usia 8–9 tahun) dan lazim pada anak dengan keterbelakangan. Pada orang dewasa → indikasi regresi, lebih praktis daripada teoritis, suka pekerjaan kasar/konkret seperti tukang.'
        },
        {
          image: BASE_BATANG + '8-nembus.png',
          id: 'menerobos_mahkota',
          label: 'Batang Menerobos Mahkota',
          interpret: 'Mencerminkan: (1) Primitif dan rigid — kecenderungan mengadopsi pendekatan sederhana dan kurang fleksibel. (2) Vitalitas kuat tetapi kurang "go different" — meski vitalitas tinggi, ada keterbatasan berpikir secara berbeda. (3) Sangat instingtif — lebih cenderung merespons secara spontan dan alami, mengandalkan insting daripada pemikiran mendalam. (4) Lebih bersifat praktis — pendekatan langsung dan sederhana dalam menyelesaikan tugas. (5) Ada gejala retardasi — potensi keterlambatan dalam perkembangan intelektual. (6) Remming untuk mengembangkan bakat — hambatan atau kekakuan dalam mengembangkan bakat. (7) Kurang mampu mengobjektifkan yang primitif — lebih cenderung melihat dunia melalui lensa pengalaman pribadi atau naluri alamiah.'
        }
      ]
    },

    /* ==========================================================
       3. VARIASI & MODIFIKASI BATANG
       ========================================================== */
    {
      id: 'variasi_modifikasi',
      title: '3. Variasi & Modifikasi Batang',
      type: 'checkbox',
      items: [
        {
          image: BASE_BATANG + '9-nonjol.png',
          id: 'menonjol',
          label: 'Batang Menonjol',
          interpret: 'Mencerminkan: (1) Trauma atau kesukaran yang benar-benar dirasakan — pengalaman emosional yang sangat kuat, baik dalam bentuk trauma atau kesukaan yang dirasakan secara mendalam. (2) Biasanya sesudah sakit atau kecelakaan (dirasakan subjektif) — proses menonjolnya batang sering terjadi setelah subjek mengalami kejadian menyakitkan atau mengancam. Pengalaman ini bersifat subjektif, artinya persepsi dan interpretasi subjek terhadap peristiwa tersebut dapat bervariasi tergantung sejarah hidup, nilai-nilai, dan kondisi psikologis.'
        },
        {
          image: BASE_BATANG + '10-meliuk.png',
          id: 'meliuk',
          label: 'Batang Meliuk',
          interpret: 'Mencerminkan: (1) Hidup dan lincah — vitalitas dan kehidupan yang kuat dalam kepribadian. (2) Dinamis — terbuka terhadap perubahan, kemampuan beradaptasi, menghadapi tantangan dengan keberanian. (3) Mudah menyesuaikan diri dan mudah terpengaruh — kemampuan menyesuaikan diri dengan lingkungan, tetapi juga bisa menandakan kecenderungan mudah terpengaruh faktor eksternal. (4) Diplomatis — kemampuan berkomunikasi secara efektif, menangani konflik dengan bijaksana, menciptakan hubungan sosial harmonis.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: scribbling
          id: 'scribbling',
          label: 'Scribbling / Garis Berantakan',
          interpret: 'Mencerminkan: (1) Sensibel, sensitif, dapat ikut merasakan suka dan duka — garis acak sebagai tanda kepekaan emosional; kemampuan merasakan dan memahami perasaan orang lain dengan intensitas tinggi. (2) Tidak mengetahui batas antara aku dan dia (kehilangan pribadi sendiri) — kesulitan memahami atau mempertahankan batas antara diri sendiri dan orang lain. Bisa mencerminkan kecenderungan "kehilangan diri sendiri" atau kesulitan memahami batas interpersonal yang sehat.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: berbelok-belok
          id: 'berbelok_belok',
          label: 'Batang Berbelok-belok',
          interpret: 'Mencerminkan: (1) Berpegang teguh pada prinsip — kekuatan memegang teguh prinsip atau nilai-nilai tertentu (integritas dan konsistensi). (2) Sering menentang hatinya sendiri — konflik internal antara keputusan/tindakan dengan apa yang dirasakan secara emosional. (3) Mempunyai sifat malu-malu — kurang percaya diri dalam interaksi sosial. (4) Kemauan yang tegang — tekad kuat namun dengan tingkat stres atau ketegangan tinggi. Catatan patologis: mengarah ke neurosis obsesi — (a) tertekan, (b) tegang, (c) tertutup, (d) tak dapat menyesuaikan diri, (e) rasa takut yang benar, (f) regresi.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: terbuka ujungnya
          id: 'terbuka_ujungnya',
          label: 'Batang Terbuka Ujungnya',
          interpret: 'Mencerminkan: (1) Serba ingin tahu — tingkat keingintahuan tinggi terhadap lingkungan. (2) Tidak terarah tujuannya — kurang fokus atau arah dalam mencapai tujuan hidup. (3) Tidak dapat memutuskan sesuatu — kesulitan mengelola konflik internal dan memilih opsi. (4) Tidak mau mengikat diri — ketidaknyamanan terhadap komitmen jangka panjang. (5) Daya cipta kurang — kesulitan mengembangkan ide kreatif atau solusi inovatif. (6) Mudah marah — kurangnya kontrol emosional. (7) Kurang stabil — kestabilan emosional yang rendah. (8) Sugestibel — mudah dipengaruhi orang lain atau lingkungan.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: ditumpuk-tumpuk
          id: 'ditumpuk_tumpuk',
          label: 'Batang Ditumpuk-tumpuk',
          interpret: 'Mencerminkan: Sampai umur 13 tahun → NORMAL. Lebih dari 13 tahun → ke arah debil. Ciri-ciri: (1) Daya kombinasi kurang — kesulitan memproses informasi dan menghubungkan konsep. (2) Tak logis — kesenjangan dalam logika. (3) Tak ada pertimbangan — kurang kemampuan menilai konsekuensi. (4) Kurang abstraksi — keterbatasan berpikir abstrak. (5) Ganti-ganti pekerjaan — ketidakstabilan komitmen. (6) Tanda nervous — kegelisahan atau ketegangan saraf. (7) Jiwa belum dewasa — keterlambatan perkembangan psikososial/emosional. (8) Tidak terbuka — hambatan dalam berinteraksi sosial.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: batang 3 dimensi
          id: 'tiga_dimensi',
          label: 'Batang 3 Dimensi',
          interpret: 'Mencerminkan: (1) Memiliki potensi bakat — potensi atau bakat luar biasa. (2) Mempunyai ide yang baik — kreativitas dan kemampuan menghasilkan ide. (3) Orisinil — mampu menghasilkan ide atau tindakan yang tidak umum. (4) Percaya pada diri sendiri — keyakinan terhadap kemampuan sendiri. (5) Dapat berdiri sendiri — independensi dan kemandirian.'
        }
      ]
    },

    /* ==========================================================
       4. KONTINUITAS & STRUKTUR BATANG
       ========================================================== */
    {
      id: 'kontinuitas_struktur',
      title: '4. Kontinuitas & Struktur Batang',
      type: 'checkbox',
      items: [
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: discontinuous
          id: 'tidak_bersambung',
          label: 'Batang Tidak Bersambung / Discontinuous',
          interpret: 'Gambaran batang yang sering dipertegas dengan coretan-coretan pendek mencerminkan keragu-raguan dan ketidakpastian dalam tindakan. Jika coretan diulangi atau dipertebal, mungkin mencerminkan usaha menampilkan sikap tegas meski esensinya masih penuh keraguan. Garis sangat halus, tipis, dan coretan pendek mengindikasikan vitalitas rendah, ketidakpastian, serta rentan terhadap serangan kelemahan. Pola sikap defensif, selalu waspada, merasa akan dihakimi setiap saat, kecemasan berlebih, kurang kesabaran, mudah tersinggung. Pada bagian kiri batang dengan garis tidak teratur → keraguan dan masalah dalam interaksi sosial di masa lalu. Pada sisi kanan yang ragu-ragu → sikap sosial tampak ragu, kesulitan beradaptasi dan berinteraksi sosial. Gelombang sejajar pada batang → kemampuan baik menyesuaikan diri secara sosial, sikap tidak mencari konflik, sifat diplomatis.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: penebalan/penyempitan
          id: 'penebalan_penyempitan',
          label: 'Penebalan / Penyempitan pada Batang atau Dahan',
          interpret: 'Bayangkan batang/dahan sebagai aliran materi (seperti usus): penyempitan menghambat aliran, penebalan menciptakan penimbunan. Pada gambar batang yang mengalami penebalan di atas → energi tidak bisa keluar. Penimbunan afek yang sangat kuat menunjukkan hambatan — afek tidak dapat terungkap secara bebas, subjek mengalami kondisi stupor. Dalam keadaan stupor, banyak afek yang ditekan → bisa termanifestasi dalam bentuk kelainan organik (mis. kesulitan berbicara atau mengekspresikan diri). Gambar dengan penebalan dan luka-luka → penimbunan afek yang bisa menyebabkan ledakan emosi (kemarahan, celaan terhadap diri sendiri atau orang lain). Pada masa pubertas, tonjolan pada batang dapat menunjukkan penekanan perasaan, hambatan dan frustrasi dalam pengalaman emosional.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: terputus-putus
          id: 'terputus_putus',
          label: 'Batang Terputus-putus',
          interpret: 'Menandakan adanya nervousitas yang bersifat laten, mengakibatkan ketidaktenangan dalam kehidupan sehari-hari. Juga menandakan: (1) Tidak konsisten — sering bertindak sesuai keinginan hati. (2) Impulsif — hambatan dalam berpikir dan kurang kemampuan merencanakan jangka panjang. (3) Kurang kemampuan berpikir abstrak — cenderung berpikir asosiatif dan kurang dalam analisis logis. (4) Naif — kurangnya pertimbangan dan analisis mendalam terhadap situasi atau keputusan.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: garis lurus sejajar
          id: 'garis_lurus_sejajar_dewasa',
          label: 'Garis Lurus & Sejajar (digambar oleh Orang Dewasa)',
          interpret: 'Gambaran umum pada anak hingga usia sekitar 10 tahun — jika orang dewasa menggambar batang dengan karakteristik serupa, ini mencerminkan pengaruh kuat dari pendidikan formal yang diterima di masa sekolah (mirip cap atau cetakan yang terbentuk sangat kental). Hal ini dapat membuat seseorang sulit berkembang dan beradaptasi. Mencerminkan sikap dan perilaku anak di lingkungan sekolah: terlalu terstruktur, kaku, kurang fleksibel dalam menyesuaikan diri. Kesulitan menerima dan mempelajari hal-hal baru, cenderung serius dan formal, kemampuan berpikir abstrak mungkin kurang berkembang.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: berlubang/terkelupas
          id: 'berlubang_terkelupas',
          label: 'Batang Berlubang / Terkelupas Kulitnya',
          interpret: 'Mencerminkan: (1) Traumatik — indikator kejadian traumatis, pengalaman yang mengancam keselamatan atau kesejahteraan subjek. (2) Tendensi menarik diri dari lingkungan — kecenderungan menghindari atau menarik diri dari lingkungan sosial atau situasi tertentu. (3) Cepat cemas — tingkat kecemasan tinggi, cenderung merasa gelisah atau tegang dalam situasi tertentu.'
        }
      ]
    },

    /* ==========================================================
       5. ARAH KEMIRINGAN BATANG
       ========================================================== */
    {
      id: 'arah_kemiringan',
      title: '5. Arah Kemiringan Batang',
      type: 'checkbox',
      items: [
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: condong ke kiri
          id: 'condong_kiri',
          label: 'Batang Condong ke Kiri',
          interpret: 'Mencerminkan: (1) Tidak secara terang-terangan — kecenderungan tidak mengekspresikan perasaan secara terbuka. (2) Tertekan — tekanan atau beban psikologis yang dirasakan. (3) Menahan perasaannya sendiri — kecenderungan menahan atau menyembunyikan perasaan. (4) Terikat pada masa lalu — kesulitan melepaskan atau bergerak maju dari pengalaman atau kenangan masa lalu. (5) Keras kepala — sulit diubah, mempertahankan pendirian. (6) Kadang-kadang malas — tingkat motivasi yang bervariasi. (7) Sikap defensif — respons protektif atau hati-hati terhadap situasi atau masalah tertentu.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: condong ke kanan
          id: 'condong_kanan',
          label: 'Batang Condong ke Kanan',
          interpret: 'Mencerminkan: (1) Ekstrovert — tingkat energi dan minat lebih besar terhadap interaksi sosial. (2) Penyesuaian baik — kemampuan adaptif menciptakan keseimbangan antara kebutuhan subjek dan tuntutan lingkungan. (3) Suggestible — mudah menerima saran atau pendapat orang lain. (4) Mudah dipermainskan — santai dan fleksibel dalam menghadapi situasi, tidak tegang atau defensif. (5) Suka menolong — sifat empati dan perhatian terhadap kebutuhan orang lain, terdorong secara intrinsik untuk memberikan dukungan dan bantuan.'
        }
      ]
    },

    /* ==========================================================
       6. PERMUKAAN & TEKSTUR BATANG
       ========================================================== */
    {
      id: 'permukaan_tekstur',
      title: '6. Permukaan & Tekstur Batang',
      type: 'checkbox',
      items: [
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: permukaan umum
          id: 'permukaan_umum',
          label: 'Permukaan Batang (Makna Umum)',
          interpret: 'Permukaan batang pada gambar pohon secara fisiognomis memiliki makna yang terkait dengan hubungan subjek dengan lingkungannya dari segi emosional dan afektif. Meliputi: (1) Penyesuaian diri — seberapa baik seseorang dapat menyesuaikan diri dengan lingkungan sekitarnya, termasuk pengalaman masa lalu dan cara menangani peristiwa dan tekanan emosional. (2) Keadaan masa lalu — gambaran pengalaman masa lalu subjek yang memengaruhi cara menanggapi situasi saat ini. (3) Kehidupan emosional — bagaimana subjek merespons perasaan atau afeksi terhadap lingkungannya. (4) Mekanisme pertahanan diri — ciri-ciri yang muncul dapat mengindikasikan mekanisme pertahanan diri yang dimiliki seseorang.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: tekstur kasar
          id: 'tekstur_kasar',
          label: 'Tekstur Kasar / Berparut / Bersisik / Berbintik',
          interpret: 'Variasi tekstur seperti halus, berparut, bersisik, berbintik, atau memiliki bayangan tertentu menunjukkan sifat kemauan yang kuat namun tanpa memperhatikan perasaan orang lain. Sifat keras seperti benda keras yang tahan terhadap tekanan, namun tekanan berlebihan dapat menyebabkan keretakan. Subjek cenderung memiliki kritik yang tajam dan pedas terhadap lingkungannya, menunjukkan sifat mudah marah, bersikap galak, bawel, seringkali kritis. Orang semacam ini juga dapat menjadi sangat peka terhadap kritik yang diberikan orang lain.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: gelombang batang
          id: 'gelombang_batang',
          label: 'Coretan Bergelombang pada Permukaan Batang',
          interpret: 'Sikap kontak emosional: coretan bergelombang pada permukaan batang sering diartikan sebagai penunjuk sikap subjek terhadap kontak emosional. Gelombang-gelombang ini menggambarkan pentingnya interaksi emosional dan perasaan dalam kehidupan subjek — dihubungkan dengan rasa sensitif dan kebutuhan akan perhatian emosional yang besar. Penyesuaian diri: gelombang yang lancar = penyesuaian diri mudah; gelombang yang lebih bercabang atau tidak teratur = kesulitan menyesuaikan diri atau kebutuhan besar akan perhatian emosional. Lingkaran tertutup pada permukaan batang → subjek tidak terlalu membutuhkan kontak emosional tetapi mampu memberikan hubungan emosional kepada orang lain (simbol simpati, kemampuan memberi dukungan emosional tanpa banyak membutuhkan perhatian serupa).'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: noda batang
          id: 'noda_batang',
          label: 'Noda-noda pada Permukaan Batang',
          interpret: 'Penampilannya menyerupai gangguan pada kulit manusia, seperti eksim yang bersifat psikosomatis. Menggambarkan adanya gangguan dalam interaksi atau hubungan dengan sesama manusia. Bayangan pada gambar pohon diartikan sebagai indikasi ketidakmampuan seseorang menjalin kontak sosial secara harmonis — menunjukkan ambivalensi di mana orang tersebut ingin mendapat perhatian namun secara bersamaan menolak atau kesulitan dalam membangun hubungan sosial yang berarti.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: bercak batang
          id: 'bercak_batang',
          label: 'Bercak-bercak pada Batang (Catatan Koch)',
          interpret: 'Menurut penelitian Koch, keberadaan bercak-bercak pada batang sering dihubungkan dengan gejala-gejala masturbasi. Keadaan semacam ini sering ditemukan pada gambar-gambar anak pubertas. Penting ditekankan bahwa bercak-bercak ini tidak dihasilkan pada bagian akar, melainkan pada batangnya. Lebih tepatnya, dapat diinterpretasikan sebagai penanda dari suatu narsisme — ketika segala perasaan emosi cenderung dipusatkan pada diri sendiri. Catatan: meskipun Koch menyajikan pandangan tersebut, penting berhati-hati dalam membuat interpretasi karena seseorang yang mahir menggambar bisa menggunakan shading untuk tujuan estetika. Nilai konteks dan motif di balik penggunaan bercak-bercak pada gambar pohon.'
        }
      ]
    },

    /* ==========================================================
       7. BAYANGAN (SHADING) PADA BATANG
       ========================================================== */
    {
      id: 'shading',
      title: '7. Bayangan (Shading) pada Batang',
      type: 'checkbox',
      items: [
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: shading kiri
          id: 'shading_kiri',
          label: 'Bayangan di Bagian Kiri Batang',
          interpret: 'Mencerminkan suasana hati yang berasal dari situasi masa lalu atau refleksi terhadap diri sendiri. Menandakan kecenderungan introversi, subjek cenderung memusatkan perhatian pada dirinya sendiri. Adanya hambatan menunjukkan suasana hati menghambat kemampuan beraktivitas atau bereaksi terhadap rangsangan eksternal. Bayangan di sebelah kiri juga mengindikasikan kurangnya inisiatif atau sukar merespons rangsangan dari luar.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: batang kaku
          id: 'kekakuan',
          label: 'Batang yang Menggambarkan Kekakuan',
          interpret: 'Mencerminkan adanya keterbatasan dalam mobilitas atau fleksibilitas. Kekakuan menunjukkan seseorang cenderung kaku, sulit beradaptasi dengan situasi yang berubah, atau kesulitan menyesuaikan diri dengan lingkungan baru. Secara visual, kekakuan dapat menunjukkan kesulitan subjek menyesuaikan diri secara emosional, sosial, atau dalam menghadapi hal-hal baru terkait lingkungan sekitarnya.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: shading kanan
          id: 'shading_kanan',
          label: 'Bayangan di Bagian Kanan Batang',
          interpret: 'Mengaitkan bayangan di sisi kanan dengan kehidupan masa depan seseorang — perasaan subjek terkait dengan masa depan atau prospek sosialnya. Jika bayangan di sisi kanan tampak intens, itu mengindikasikan subjek memiliki perasaan yang kuat terkait dengan apa yang akan terjadi, situasi yang akan dihadapi, atau harapan di masa depan. Intensitas perasaan ini dapat membantu subjek lebih mudah beradaptasi dengan peristiwa atau tantangan yang akan datang.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: seluruh batang hitam
          id: 'seluruh_batang_hitam',
          label: 'Seluruh Batang Dihitamkan',
          interpret: 'Menunjukkan suasana hati subjek sangat terbebani sehingga aktivitas atau gerakannya menjadi terhambat. Subjek selalu membawa beban emosional yang berat, baik terkait masalah internal pribadi maupun dinamika lingkungannya. Intensitas bayangan menjadi tanda bahwa subjek terus-menerus merasakan beban emosional yang signifikan, memengaruhi cara mereka melihat dan merespons situasi sehari-hari. Jika dihitamkan dengan lebih agresif, menandakan suasana hati menjadi lebih menekan dan mendominasi — proses ini menggambarkan suasana hati yang lebih intens, kemungkinan dipicu oleh rasa kecemasan.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: tekanan kuat
          id: 'tekanan_kuat',
          label: 'Batang Dihitamkan dengan Tekanan Kuat',
          interpret: 'Menunjukkan adanya kecemasan yang kuat. Mencerminkan orang yang membuat gambar ingin menutupi atau menyembunyikan sesuatu, baik secara sadar maupun tidak sadar. Kemungkinan ada upaya menekan atau menutupi kecemasan yang sangat kuat yang berasal dari reaksi tidak sadar (represi) terhadap sesuatu yang tidak ingin diekspresikan.'
        },
        {
          image: BASE_BATANG + '4-batang%20t.png',   // ← GANTI nanti: latar belakang hitam
          id: 'latar_belakang_hitam',
          label: 'Latar Belakang Dihitamkan',
          interpret: 'Dapat diinterpretasikan sebagai depresi. Warna hitam menggambarkan suasana hati yang sangat gelap dan mengindikasikan unsur neurotik. Pada umumnya, gambar yang menampilkan latar belakang sangat gelap atau hitam menunjukkan indikasi ke arah skizofrenia yang menandakan regresi dalam perkembangannya — orang dengan skizofrenia cenderung hidup dalam dunia yang tidak nyata atau gelap. Pada subjek yang bukan skizofrenia, hal ini menunjukkan bahwa emosi yang sangat kuat menguasai tubuh dan pikirannya, sehingga mereka merasa hidup dalam kegelapan atau keadaan yang sangat gelap secara emosional.'
        }
      ]
    }

  ]
});
