/* =========================================================
   KUNCI JAWABAN IST
   ========================================================= */

   const IST_KEYS = {
    SE: ['E','C','D','D',['E','D'],'B','C','A','E','B','C','D','D','E','C','A','B','B','C','B'],
    WA: ['A','B','D','C','C','C','C','D','D','A','E','A','A','B','C','A','D','E','B','C'],
    AN: ['C','E','D','D','D','B','D','B','E','D','C','C','C','C','E','C','C','E','E','E'],
    FA: ['B','D','C','B','E','C','D','A','A','E','A','C','D','C','B','A','B','D','C','C'],
    WU: ['A','C','D','E','A','C','D','C','E','A','B','D','E','B','D','B','A','E','B','C'],
    ME: ['D','E','B','A','C','A','D','E','C','B','B','A','E','C','D','B','E','A','C','D']
  };
  
  const RA_KEYS = [35,280,250,26,30,70,45,50,48,78,19,6,57,90,120,17,24,5,48,3];
  const ZR_KEYS = [27,25,27,15,46,10,24,7,5,14,8,14,45,36,12,80,14,12,36,10];
  
  const IST_DESCRIPTIONS = {
    SE:"Pembentukan keputusan, memanfaatkan pengalaman masa lalu, penekanan pada praktis-konkrit, pemaknaan realitas, dan berpikir secara mandiri",
    WA:"Kemampuan bahasa, perasaan empati, berpikir induktif menggunakan bahasa, dan memahami pengertian bahasa",
    AN:"Kemampuan fleksibilitas dalam berpikir, daya mengkombinasikan, mendeteksi, dan memindahkan hubungan-hubungan, serta kejelasan dan konsekuensi dalam berpikir",
    GE:"Kemampuan abstraksi verbal, menyatakan pengertian dalam bahasa, membentuk pengertian atau mencari inti persoalan, serta berpikir logis dalam bahasa",
    RA:"Kemampuan berpikir praktis dalam berhitung, berpikir induktif, reasoning, dan mengambil kesimpulan",
    ZR:"Cara berpikir teoritis dengan hitungan, berpikir induktif dengan angka-angka, serta kelincahan berpikir",
    FA:"Kemampuan membayangkan, mengkonstruksi (sintesa & analisa), berpikir konkret menyeluruh, serta memasukkan bagian ke suatu keseluruhan",
    WU:"Daya bayang ruang, kemampuan tiga dimensi, analitis, serta kemampuan konstruktif teknis",
    ME:"Daya ingat: pengenalan item setelah fase hafalan"
  };
  
  /* Kunci GE (2/1/0) */
  const GE_SCORING = [
    { s2:['bunga','kembang','perdu'], s1:['tumbuh-tumbuhan','tumbuhan','tanaman','tangkai','harum'] },
    { s2:['alat indra','indra','panca indra'], s1:['organ','organ tubuh','alat tubuh','bagian tubuh'] },
    { s2:['hablur','kristal','zat arang'], s1:['berkilau','berkilauanan','mengkilat','bening'] },
    { s2:['cuaca','musim'], s1:['air','basah','gejala alam'] },
    { s2:['pembawa berita','alat perhubungan','alat komunikasi'], s1:['pos','p.t.t','telekomunikasi','perhubungan','komunikasi'] },
    { s2:['alat optik','optik'], s1:['lensa'] },
    { s2:['alat pencernaan'], s1:['jalan makanan','perut','isi perut','pencernaan','pencernaan makanan'] },
    { s2:['penyebut jumlah','pengertian jumlah','jumlah','kuantitas'], s1:['mengukur','ukuran','ukur'] },
    { s2:['bibit','bakal','alat pembiak','permulaan kehidupan'], s1:['sel','pembiakan','perkembangbiak','berkembangbiak'] },
    { s2:['simbol','lambang','tanda'], s1:['nama','pengenal','tanda pengenal'] },
    { s2:['makhluk','makhluk hidup','organisme'], s1:['tumbuh','biologi','ilmu hayat','ilmu hayati'] },
    { s2:['wadah','tempat mengisi','tempat penyimpan','tempat penyimpanan'], s1:['tempat sesuatu','alat','tempat','benda'] },
    { s2:['pengertian waktu','batas','batas waktu'], s1:['waktu','masa','saat','lamanya','lama'] },
    { s2:['sifat-watak','sifat-karakter','karakter','watak'], s1:['sifat'] },
    { s2:['regulator harga','regulasi harga','pengertian ekonomi'], s1:['dagang','niaga','penjualan','pembelian','jual beli'] },
    { s2:['pengertian ruang','penyebut ruang'], s1:['arah','letak','penentuan daerah','tempat','ruang','penunjuk tempat'] }
  ];
  
  console.log('[DATA-IST-KEYS] ✓ Loaded');