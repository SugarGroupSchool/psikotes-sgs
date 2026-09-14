/* =========================================================
   KAMUS INTERPRETASI PAPI KOSTICK
   ========================================================= */

   const kamusPAPI = {
    A: [
      { range: [0, 4], desc: "Tidak kompetitif, mapan, puas. Tidak terdorong untuk menghasilkan prestasi, tdk berusaha utk mencapai sukses, membutuhkan dorongan dari luar diri, tidak berinisiatif, tidak memanfaatkan kemampuan diri secara optimal, ragu akan tujuan diri, misalnya sbg akibat promosi / perubahan struktur jabatan." },
      { range: [5, 7], desc: "Tahu akan tujuan yang ingin dicapainya dan dapat merumuskannya, realistis akan kemampuan diri, dan berusaha untuk mencapai target." },
      { range: [8, 9], desc: "Sangat berambisi utk berprestasi dan menjadi yg terbaik, menyukai tantangan, cenderung mengejar kesempurnaan, menetapkan target yg tinggi, 'self-starter', merumuskan kerja dg baik. Tdk realistis akan kemampuannya, sulit dipuaskan, mudah kecewa, harapan yg tinggi mungkin mengganggu org lain." }
    ],
    N: [
      { range: [0, 2], desc: "Tidak terlalu merasa perlu untuk menuntaskan sendiri tugas-tugasnya, senang menangani beberapa pekerjaan sekaligus, mudah mendelegasikan tugas. Komitmen rendah, cenderung meninggalkan tugas sebelum tuntas, konsentrasi mudah buyar, mungkin suka berpindah pekerjaan." },
      { range: [3, 5], desc: "Cukup memiliki komitmen untuk menuntaskan tugas, akan tetapi jika memungkinkan akan mendelegasikan sebagian dari pekerjaannya kepada orang lain." },
      { range: [6, 7], desc: "Komitmen tinggi, lebih suka menangani pekerjaan satu demi satu, akan tetapi masih dapat mengubah prioritas jika terpaksa." },
      { range: [8, 9], desc: "Memiliki komitmen yg sangat tinggi thd tugas, sangat ingin menyelesaikan tugas, tekun dan tuntas dlm menangani pekerjaan satu demi satu hingga tuntas. Perhatian terpaku pada satu tugas, sulit utk menangani beberapa pekerjaan sekaligus, sulit diinterupsi, tidak melihat masalah sampingan." }
    ],
    G: [
      { range: [0, 2], desc: "Santai, kerja adalah sesuatu yang menyenangkan-bukan beban yg membutuhkan usaha besar. Mungkin termotivasi utk mencari cara atau sistem yg dpt mempermudah dirinya dlm menyelesaikan pekerjaan, akan berusaha menghindari kerja keras, sehingga dapat memberi kesan malas." },
      { range: [3, 4], desc: "Bekerja keras sesuai tuntutan, menyalurkan usahanya untuk hal-hal yang bermanfaat / menguntungkan." },
      { range: [5, 7], desc: "Bekerja keras, tetapi jelas tujuan yg ingin dicapainya." },
      { range: [8, 9], desc: "Ingin tampil sbg pekerja keras, sangat suka bila orang lain memandangnya sbg pekerja keras. Cenderung menciptakan pekerjaan yang tidak perlu agar terlihat tetap sibuk, kadang kala tanpa tujuan yang jelas." }
    ],
    C: [
      { range: [0, 2], desc: "Lebih mementingkan fleksibilitas daripada struktur, pendekatan kerja lebih ditentukan oleh situasi daripada oleh perencanaan sebelumnya, mudah beradaptasi. Tidak mempedulikan keteraturan atau kerapihan, ceroboh." },
      { range: [3, 4], desc: "Fleksibel tapi masih cukup memperhatikan keteraturan atau sistematika kerja." },
      { range: [5, 6], desc: "Memperhatikan keteraturan dan sistematika kerja, tapi cukup fleksibel." },
      { range: [7, 9], desc: "Sistematis, bermetoda, berstruktur, rapi dan teratur, dapat menata tugas dengan baik. Cenderung kaku, tidak fleksibel." }
    ],
    D: [
      { range: [0, 1], desc: "Melihat pekerjaan scr makro, membedakan hal penting dari yg kurang penting, mendelegasikan detil pd org lain, generalis. Menghindari detail, konsekuensinya mungkin bertindak tanpa data yg cukup/akurat, bertindak ceroboh pd hal yg butuh kecermatan. Dpt mengabaikan proses yg vital dlm evaluasi data." },
      { range: [2, 3], desc: "Cukup peduli akan akurasi dan kelengkapan data." },
      { range: [4, 6], desc: "Tertarik untuk menangani sendiri detail." },
      { range: [7, 9], desc: "Sangat menyukai detail, sangat peduli akan akurasi dan kelengkapan data. Cenderung terlalu terlibat dengan detail sehingga melupakan tujuan utama." }
    ],
    R: [
      { range: [0, 3], desc: "Tipe pelaksana, praktis - pragmatis, mengandalkan pengalaman masa lalu dan intuisi. Bekerja tanpa perencanaan, mengandalkan perasaan." },
      { range: [4, 5], desc: "Pertimbangan mencakup aspek teoritis (konsep atau pemikiran baru) dan aspek praktis (pengalaman) secara berimbang." },
      { range: [6, 7], desc: "Suka memikirkan suatu problem secara mendalam, merujuk pada teori dan konsep." },
      { range: [8, 9], desc: "Tipe pemikir, sangat berminat pada gagasan, konsep, teori, mencari alternatif baru, menyukai perencanaan. Mungkin sulit dimengerti oleh orang lain, terlalu teoritis dan tidak praktis, mengawang-awang dan berbelit-belit." }
    ],
    T: [
      { range: [0, 3], desc: "Santai. Kurang peduli akan waktu, kurang memiliki rasa urgensi, membuang-buang waktu, bukan pekerja yang tepat waktu." },
      { range: [4, 6], desc: "Cukup aktif dalam segi mental, dapat menyesuaikan tempo kerjanya dengan tuntutan pekerjaan / lingkungan." },
      { range: [7, 9], desc: "Cekatan, selalu siaga, bekerja cepat, ingin segera menyelesaikan tugas. Negatifnya: Tegang, cemas, impulsif, mungkin ceroboh, banyak gerakan yang tidak perlu." }
    ],
    V: [
      { range: [0, 2], desc: "Cocok untuk pekerjaan 'di belakang meja'. Cenderung lamban, tidak tanggap, mudah lelah, daya tahan lemah." },
      { range: [3, 6], desc: "Dapat bekerja di belakang meja dan senang jika sesekali harus terjun ke lapangan atau melaksanakan tugas-tugas yang bersifat mobile." },
      { range: [7, 9], desc: "Menyukai aktifitas fisik (a.l.: olah raga), enerjik, memiliki stamina untuk menangani tugas-tugas berat, tidak mudah lelah. Tidak betah duduk lama, kurang dapat konsentrasi 'di belakang meja'." }
    ],
    W: [
      { range: [0, 3], desc: "Hanya butuh gambaran ttg kerangka tugas scr garis besar, berpatokan pd tujuan, dpt bekerja dlm suasana yg kurang berstruktur, berinsiatif, mandiri. Tdk patuh, cenderung mengabaikan/tdk paham pentingnya peraturan/prosedur, suka membuat peraturan sendiri yg bisa bertentangan dg yg telah ada." },
      { range: [4, 5], desc: "Perlu pengarahan awal dan tolok ukur keberhasilan." },
      { range: [6, 7], desc: "Membutuhkan uraian rinci mengenai tugas, dan batasan tanggung jawab serta wewenang." },
      { range: [8, 9], desc: "Patuh pada kebijaksanaan, peraturan dan struktur organisasi. Ingin segala sesuatunya diuraikan secara rinci, kurang memiliki inisiatif, tdk fleksibel, terlalu tergantung pada organisasi, berharap 'disuapi'." }
    ],
    F: [
      { range: [0, 3], desc: "Otonom, dapat bekerja sendiri tanpa campur tangan orang lain, motivasi timbul krn pekerjaan itu sendiri - bukan krn pujian dr otoritas. Mempertanyakan otoritas, cenderung tidak puas thdp atasan, loyalitas lebih didasari kepentingan pribadi." },
      { range: [4, 6], desc: "Loyal pada Perusahaan." },
      { range: [7, 7], desc: "Loyal pada pribadi atasan." },
      { range: [8, 9], desc: "Loyal, berusaha dekat dg pribadi atasan, ingin menyenangkan atasan, sadar akan harapan atasan akan dirinya. Terlalu memperhatikan cara menyenangkan atasan, tidak berani berpendirian lain, tidak mandiri." }
    ],
    L: [
      { range: [0, 1], desc: "Puas dengan peran sebagai bawahan, memberikan kesempatan pada orang lain untuk memimpin, tidak dominan. Tidak percaya diri; sama sekali tidak berminat untuk berperan sebagai pemimpin; bersikap pasif dalam kelompok." },
      { range: [2, 3], desc: "Tidak percaya diri dan tidak ingin memimpin atau mengawasi orang lain." },
      { range: [4, 4], desc: "Kurang percaya diri dan kurang berminat utk menjadi pemimpin." },
      { range: [5, 5], desc: "Cukup percaya diri, tidak secara aktif mencari posisi kepemimpinan akan tetapi juga tidak akan menghindarinya." },
      { range: [6, 7], desc: "Percaya diri dan ingin berperan sebagai pemimpin." },
      { range: [8, 9], desc: "Sangat percaya diri utk berperan sbg atasan & sangat mengharapkan posisi tersebut. Lebih mementingkan citra & status kepemimpinannya dari pada efektifitas kelompok, mungkin akan tampil angkuh atau terlalu percaya diri." }
    ],
    P: [
      { range: [0, 1], desc: "Permisif, akan memberikan kesempatan pada orang lain untuk memimpin. Tidak mau mengontrol orang lain dan tidak mau mempertanggung jawabkan hasil kerja bawahannya." },
      { range: [2, 3], desc: "Enggan mengontrol org lain & tidak mau mempertanggung jawabkan hasil kerja bawahannya, lebih memberi kebebasan kpd bawahan utk memilih cara sendiri dlm penyelesaian tugas dan meminta bawahan utk mempertanggungjawabkan hasilnya masing-masing." },
      { range: [4, 4], desc: "Cenderung enggan melakukan fungsi pengarahan, pengendalian dan pengawasan, kurang aktif memanfaatkan kapasitas bawahan secara optimal, cenderung bekerja sendiri dalam mencapai tujuan kelompok." },
      { range: [5, 5], desc: "Bertanggung jawab, akan melakukan fungsi pengarahan, pengendalian dan pengawasan, tapi tidak mendominasi." },
      { range: [6, 7], desc: "Dominan dan bertanggung jawab, akan melakukan fungsi pengarahan, pengendalian dan pengawasan." },
      { range: [8, 9], desc: "Sangat dominan, sangat mempengaruhi & mengawasi org lain, bertanggung jawab atas tindakan & hasil kerja bawahan. Posesif, tdk ingin berada di bawah pimpinan org lain, cemas bila tdk berada di posisi pemimpin, mungkin sulit utk bekerja sama dgn rekan yg sejajar kedudukannya." }
    ],
    I: [
      { range: [0, 1], desc: "Sangat berhati-hati, memikirkan langkah-langkahnya secara bersungguh-sungguh. Lamban dlm mengambil keputusan, terlalu lama merenung, cenderung menghindar mengambil keputusan." },
      { range: [2, 3], desc: "Enggan mengambil keputusan." },
      { range: [4, 5], desc: "Berhati-hati dlm pengambilan keputusan." },
      { range: [6, 7], desc: "Cukup percaya diri dlm pengambilan keputusan, mau mengambil resiko, dpt memutuskan dgn cepat, mengikuti alur logika." },
      { range: [8, 9], desc: "Sangat yakin dl mengambil keputusan, cepat tanggap thd situasi, berani mengambil resiko, mau memanfaatkan kesempatan. Impulsif, dpt membuat keputusan yg tdk praktis, cenderung lebih mementingkan kecepatan daripada akurasi, tdk sabar, cenderung meloncat pd keputusan." }
    ],
    S: [
      { range: [0, 2], desc: "Dpt. bekerja sendiri, tdk membutuhkan kehadiran org lain. Menarik diri, kaku dlm bergaul, canggung dlm situasi sosial, lebih memperhatikan hal-hal lain daripada manusia." },
      { range: [3, 4], desc: "Kurang percaya diri & kurang aktif dlm menjalin hubungan sosial." },
      { range: [5, 9], desc: "Percaya diri & sangat senang bergaul, menyukai interaksi sosial, bisa menciptakan suasana yg menyenangkan, mempunyai inisiatif & mampu menjalin hubungan & komunikasi, memperhatikan org lain. Mungkin membuang-buang waktu utk aktifitas sosial, kurang peduli akan penyelesaian tugas." }
    ],
    B: [
      { range: [0, 2], desc: "Mandiri (dari segi emosi), tdk mudah dipengaruhi oleh tekanan kelompok. Penyendiri, kurang peka akan sikap & kebutuhan kelompok, mungkin sulit menyesuaikan diri." },
      { range: [3, 5], desc: "Selektif dlm bergabung dg kelompok, hanya mau berhubungan dg kelompok di lingkungan kerja apabila bernilai & sesuai minat, tdk terlalu mudah dipengaruhi." },
      { range: [6, 9], desc: "Suka bergabung dlm kelompok, sadar akan sikap & kebutuhan kelompok, suka bekerja sama, ingin menjadi bagian dari kelompok, ingin disukai & diakui oleh lingkungan; sangat tergantung pd kelompok, lebih memperhatikan kebutuhan kelompok daripada pekerjaan." }
    ],
    O: [
      { range: [0, 2], desc: "Menjaga jarak, lebih memperhatikan hal-hal kedinasan, tdk mudah dipengaruhi oleh individu tertentu, objektif & analitis. Tampil dingin, tdk acuh, tdk ramah, suka berahasia, mungkin tdk sadar akan perasaan org lain, & mungkin sulit menyesuaikan diri." },
      { range: [3, 5], desc: "Tidak mencari atau menghindari hubungan antar pribadi di lingkungan kerja, masih mampu menjaga jarak." },
      { range: [6, 9], desc: "Peka akan kebutuhan org lain, sangat memikirkan hal-hal yg dibutuhkan org lain, suka menjalin hubungan persahabatan yg hangat & tulus. Sangat perasa, mudah tersinggung, cenderung subjektif, dpt terlibat terlalu dalam/intim dg individu tertentu dlm pekerjaan, sangat tergantung pd individu tertentu." }
    ],
    X: [
      { range: [0, 1], desc: "Sederhana, rendah hati, tulus, tidak sombong dan tidak suka menampilkan diri. Terlalu sederhana, cenderung merendahkan kapasitas diri, tidak percaya diri, cenderung menarik diri dan pemalu." },
      { range: [2, 3], desc: "Sederhana, cenderung diam, cenderung pemalu, tidak suka menonjolkan diri." },
      { range: [4, 5], desc: "Mengharapkan pengakuan lingkungan dan tidak mau diabaikan tetapi tidak mencari-cari perhatian." },
      { range: [6, 9], desc: "Bangga akan diri dan gayanya sendiri, senang menjadi pusat perhatian, mengharapkan penghargaan dari lingkungan. Mencari-cari perhatian dan suka menyombongkan diri." }
    ],
    E: [
      { range: [0, 1], desc: "Sangat terbuka, terus terang, mudah terbaca (dari air muka, tindakan, perkataan, sikap). Tidak dapat mengendalikan emosi, cepat bereaksi, kurang mengindahkan/tidak mempunyai 'nilai' yg mengharuskannya menahan emosi." },
      { range: [2, 3], desc: "Terbuka, mudah mengungkap pendapat atau perasaannya mengenai suatu hal kepada org lain." },
      { range: [4, 6], desc: "Mampu mengungkap atau menyimpan perasaan, dapat mengendalikan emosi." },
      { range: [7, 9], desc: "Mampu menyimpan pendapat atau perasaannya, tenang, dapat mengendalikan emosi, menjaga jarak. Tampil pasif dan tidak acuh, mungkin sulit mengungkapkan emosi/perasaan/pandangan." }
    ],
    K: [
      { range: [0, 1], desc: "Sabar, tidak menyukai konflik. Mengelak atau menghindar dari konflik, pasif, menekan atau menyembunyikan perasaan sesungguhnya, menghindari konfrontasi, lari dari konflik, tidak mau mengakui adanya konflik." },
      { range: [2, 3], desc: "Lebih suka menghindari konflik, akan mencari rasionalisasi untuk dapat menerima situasi dan melihat permasalahan dari sudut pandang orang lain." },
      { range: [4, 5], desc: "Tidak mencari atau menghindari konflik, mau mendengarkan pandangan orang lain tetapi dapat menjadi keras kepala saat mempertahankan pandangannya." },
      { range: [6, 7], desc: "Akan menghadapi konflik, mengungkapkan serta memaksakan pandangan dengan cara positif." },
      { range: [8, 9], desc: "Terbuka, jujur, terus terang, asertif, agresif, reaktif, mudah tersinggung, mudah meledak, curiga, berprasangka, suka berkelahi atau berkonfrontasi, berpikir negatif." }
    ],
    Z: [
      { range: [0, 1], desc: "Mudah beradaptasi dg pekerjaan rutin tanpa merasa bosan, tidak membutuhkan variasi, menyukai lingkungan stabil dan tidak berubah. Konservatif, menolak perubahan, sulit menerima hal-hal baru, tidak dapat beradaptasi dengan situasi yg berbeda-beda." },
      { range: [2, 3], desc: "Enggan berubah, tidak siap untuk beradaptasi, hanya mau menerima perubahan jika alasannya jelas dan meyakinkan." },
      { range: [4, 5], desc: "Mudah beradaptasi, cukup menyukai perubahan." },
      { range: [6, 7], desc: "Antusias terhadap perubahan dan akan mencari hal-hal baru, tetapi masih selektif (menilai kemanfaatannya)." },
      { range: [8, 9], desc: "Sangat menyukai perubahan, gagasan baru/variasi, aktif mencari perubahan, antusias dg hal-hal baru, fleksibel dlm berpikir, mudah beradaptasi pd situasi yg berbeda-beda. Gelisah, frustasi, mudah bosan, sangat membutuhkan variasi, tidak menyukai tugas/situasi yg rutin-monoton." }
    ]
  };
  
  function getInterpretasiPAPI(aspek, nilai) {
    if (!kamusPAPI[aspek]) return '-';
    const entry = kamusPAPI[aspek].find(r => nilai >= r.range[0] && nilai <= r.range[1]);
    return entry ? entry.desc : '-';
  }
  
  /* Mapping arah kerja PAPI */
  const mappingPAPI = {
    ArahKerja: {
      N: { tipe: 'B', nomor: [2, 13, 24, 35, 46, 57, 68, 79, 90] },
      G: { tipe: 'A', nomor: [1, 11, 21, 31, 41, 51, 61, 71, 81] },
      A: [
        { tipe: 'A', nomor: [2] },
        { tipe: 'B', nomor: [3, 14, 25, 36, 47, 58, 69, 80] }
      ]
    },
    Kepemimpinan: {
      L: [
        { tipe: 'A', nomor: [12, 22, 32, 42, 52, 62, 72, 82] },
        { tipe: 'B', nomor: [81] }
      ],
      P: [
        { tipe: 'A', nomor: [3, 13] },
        { tipe: 'B', nomor: [4, 15, 26, 37, 48, 59, 70] }
      ],
      I: [
        { tipe: 'A', nomor: [23, 33, 43, 53, 63, 73, 83] },
        { tipe: 'B', nomor: [71, 82] }
      ]
    },
    Aktivitas: {
      T: [
        { tipe: 'A', nomor: [34, 44, 54, 64, 74, 84] },
        { tipe: 'B', nomor: [61, 72, 83] }
      ],
      V: [
        { tipe: 'A', nomor: [45, 55, 65, 75, 85] },
        { tipe: 'B', nomor: [51, 62, 73, 84] }
      ]
    },
    Pergaulan: {
      X: [
        { tipe: 'A', nomor: [4, 14, 24] },
        { tipe: 'B', nomor: [5, 16, 27, 38, 49, 60] }
      ],
      S: [
        { tipe: 'A', nomor: [56, 66, 76, 86] },
        { tipe: 'B', nomor: [41, 52, 63, 74, 85] }
      ],
      B: [
        { tipe: 'A', nomor: [5, 15, 25, 35] },
        { tipe: 'B', nomor: [6, 17, 28, 39, 50] }
      ],
      O: [
        { tipe: 'A', nomor: [6, 16, 26, 36, 46] },
        { tipe: 'B', nomor: [7, 18, 29, 40] }
      ]
    },
    GayaKerja: {
      R: [
        { tipe: 'A', nomor: [67, 77, 87] },
        { tipe: 'B', nomor: [31, 42, 53, 64, 75, 86] }
      ],
      D: [
        { tipe: 'A', nomor: [78, 88] },
        { tipe: 'B', nomor: [21, 32, 43, 54, 65, 76, 87] }
      ],
      C: [
        { tipe: 'A', nomor: [89] },
        { tipe: 'B', nomor: [11, 22, 33, 44, 55, 66, 77, 88] }
      ]
    },
    Sifat: {
      Z: [
        { tipe: 'A', nomor: [7, 17, 27, 37, 47, 57] },
        { tipe: 'B', nomor: [8, 19, 30] }
      ],
      E: { tipe: 'B', nomor: [1, 12, 23, 34, 45, 56, 67, 78, 89] },
      K: [
        { tipe: 'A', nomor: [8, 18, 28, 38, 48, 58, 68] },
        { tipe: 'B', nomor: [9, 20] }
      ]
    },
    Ketaatan: {
      F: [
        { tipe: 'A', nomor: [9, 19, 29, 39, 49, 59, 69, 79] },
        { tipe: 'B', nomor: [10] }
      ],
      W: { tipe: 'A', nomor: [10, 20, 30, 40, 50, 60, 70, 80, 90] }
    }
  };
  
  console.log('[DATA-PAPI-KAMUS] ✓ Loaded');