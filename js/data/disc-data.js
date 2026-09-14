/* =========================================================
   DATA TES DISC
   ========================================================= */

   const DISC_DATA = {
    name: "Tes DISC",
    description: "Tes kepribadian yang mengukur Dominance, Influence, Steadiness, dan Compliance",
    instruction: "Untuk setiap pernyataan, pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda",
    example: {
      question: "Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:",
      options: ["Disiplin","Kreatif","Sabar","Teliti"],
      p: "Disiplin",
      k: "Kreatif",
      explanation: "Pilih 1 untuk Paling dan 1 untuk Kurang menggambarkan Anda"
    },
    questions: [
      { id:1,  text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Gampangan, Mudah setuju", P:'S', K:'S' },
          { text:"Percaya, Mudah percaya pada orang", P:'I', K:'I' },
          { text:"Petualang, Mengambil resiko", P:'*', K:'D' },
          { text:"Toleran, Menghormati", P:'C', K:'C' }
      ]},
      { id:2,  text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Lembut suara, Pendiam", P:'C', K:'*' },
          { text:"Optimistik, Visioner", P:'D', K:'D' },
          { text:"Pusat perhatian, Suka gaul", P:'*', K:'I' },
          { text:"Pendamai, Membawa Harmoni", P:'S', K:'S' }
      ]},
      { id:3,  text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Menyemangati orang", P:'I', K:'I' },
          { text:"Berusaha sempurna", P:'*', K:'C' },
          { text:"Bagian dari kelompok", P:'*', K:'S' },
          { text:"Ingin membuat tujuan", P:'D', K:'*' }
      ]},
      { id:4,  text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Menjadi frustrasi", P:'C', K:'C' },
          { text:"Menyimpan perasaan saya", P:'S', K:'S' },
          { text:"Menceritakan sisi saya", P:'*', K:'I' },
          { text:"Siap beroposisi", P:'D', K:'D' }
      ]},
      { id:5,  text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Hidup, Suka bicara", P:'I', K:'*' },
          { text:"Gerak cepat, Tekun", P:'D', K:'D' },
          { text:"Usaha menjaga keseimbangan", P:'S', K:'S' },
          { text:"Usaha mengikuti aturan", P:'*', K:'C' }
      ]},
      { id:6,  text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Kelola waktu secara efisien", P:'C', K:'*' },
          { text:"Sering terburu-buru, Merasa tertekan", P:'D', K:'D' },
          { text:"Masalah sosial itu penting", P:'I', K:'I' },
          { text:"Suka selesaikan apa yang saya mulai", P:'S', K:'S' }
      ]},
      { id:7,  text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Tolak perubahan mendadak", P:'S', K:'*' },
          { text:"Cenderung janji berlebihan", P:'I', K:'I' },
          { text:"Tarik diri di tengah tekanan", P:'*', K:'C' },
          { text:"Tidak takut bertempur", P:'*', K:'D' }
      ]},
      { id:8,  text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Penyemangat yang baik", P:'I', K:'I' },
          { text:"Pendengar yang baik", P:'S', K:'S' },
          { text:"Penganalisa yang baik", P:'C', K:'C' },
          { text:"Delegator yang baik", P:'D', K:'D' }
      ]},
      { id:9,  text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Hasil adalah penting", P:'D', K:'D' },
          { text:"Lakukan dengan benar, Akurasi penting", P:'C', K:'C' },
          { text:"Dibuat menyenangkan", P:'*', K:'I' },
          { text:"Mari kerjakan bersama", P:'*', K:'S' }
      ]},
      { id:10, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Akan berjalan terus tanpa kontrol diri", P:'*', K:'C' },
          { text:"Akan membeli sesuai dorongan hati", P:'D', K:'D' },
          { text:"Akan menunggu, Tanpa tekanan", P:'S', K:'S' },
          { text:"Akan mengusahakan yang kuinginkan", P:'I', K:'*' }
      ]},
      { id:11, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Ramah, Mudah bergabung", P:'S', K:'*' },
          { text:"Unik, Bosan rutinitas", P:'*', K:'I' },
          { text:"Aktif mengubah sesuatu", P:'D', K:'D' },
          { text:"Ingin hal-hal yang pasti", P:'C', K:'C' }
      ]},
      { id:12, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Non-konfrontasi, Menyerah", P:'*', K:'S' },
          { text:"Dipenuhi hal detail", P:'C', K:'*' },
          { text:"Perubahan pada menit terakhir", P:'I', K:'I' },
          { text:"Menuntut, Kasar", P:'D', K:'D' }
      ]},
      { id:13, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Ingin kemajuan", P:'D', K:'D' },
          { text:"Puas dengan segalanya", P:'S', K:'*' },
          { text:"Terbuka memperlihatkan perasaan", P:'I', K:'*' },
          { text:"Rendah hati, Sederhana", P:'*', K:'C' }
      ]},
      { id:14, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Tenang, Pendiam", P:'C', K:'C' },
          { text:"Bahagia, Tanpa beban", P:'I', K:'I' },
          { text:"Menyenangkan, Baik hati", P:'S', K:'*' },
          { text:"Tak gentar, Berani", P:'D', K:'D' }
      ]},
      { id:15, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Menggunakan waktu berkualitas dengan teman", P:'S', K:'S' },
          { text:"Rencanakan masa depan, Bersiap", P:'C', K:'*' },
          { text:"Bepergian demi petualangan baru", P:'I', K:'I' },
          { text:"Menerima ganjaran atas tujuan yang dicapai", P:'D', K:'D' }
      ]},
      { id:16, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Aturan perlu dipertanyakan", P:'*', K:'D' },
          { text:"Aturan membuat adil", P:'C', K:'*' },
          { text:"Aturan membuat bosan", P:'I', K:'I' },
          { text:"Aturan membuat aman", P:'S', K:'S' }
      ]},
      { id:17, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Pendidikan, Kebudayaan", P:'*', K:'C' },
          { text:"Prestasi, Ganjaran", P:'D', K:'D' },
          { text:"Keselamatan, Keamanan", P:'S', K:'S' },
          { text:"Sosial, Perkumpulan kelompok", P:'I', K:'*' }
      ]},
      { id:18, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Memimpin, pendekatan langsung", P:'D', K:'D' },
          { text:"Suka bergaul, antusias", P:'*', K:'I' },
          { text:"Dapat ditebak (konsisten)", P:'*', K:'S' },
          { text:"Waspada, hati-hati", P:'C', K:'*' }
      ]},
      { id:19, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Tak mudah dikalahkan", P:'D', K:'D' },
          { text:"Kerjakan sesuai perintah, ikut pimpinan", P:'S', K:'*' },
          { text:"Mudah terangsang, riang", P:'I', K:'I' },
          { text:"Ingin segalanya teratur, rapi", P:'*', K:'C' }
      ]},
      { id:20, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Saya akan pimpin mereka", P:'D', K:'*' },
          { text:"Saya akan melaksanakan", P:'S', K:'S' },
          { text:"Saya akan meyakinkan mereka", P:'I', K:'I' },
          { text:"Saya dapatkan fakta", P:'C', K:'*' }
      ]},
      { id:21, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Memikirkan orang dahulu", P:'S', K:'S' },
          { text:"Kompetitif, suka tantangan", P:'D', K:'D' },
          { text:"Optimis, positif", P:'I', K:'I' },
          { text:"Pemikir logis, sistematik", P:'*', K:'C' }
      ]},
      { id:22, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Menyenangkan orang, mudah setuju", P:'S', K:'S' },
          { text:"Tertawa lepas, hidup", P:'*', K:'I' },
          { text:"Berani, tak gentar", P:'D', K:'D' },
          { text:"Tenang, pendiam", P:'C', K:'C' }
      ]},
      { id:23, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Ingin otoritas lebih", P:'*', K:'D' },
          { text:"Ingin kesempatan baru", P:'I', K:'*' },
          { text:"Menghindari konflik", P:'S', K:'S' },
          { text:"Ingin petunjuk, ingin jelas", P:'*', K:'C' }
      ]},
      { id:24, text:"Pilih yang PALING (P) dan KURANG (K) menggambarkan diri Anda:", options:[
          { text:"Dapat diandalkan, Dapat dipercaya", P:'*', K:'S' },
          { text:"Kreatif, Unik", P:'I', K:'I' },
          { text:"Garis dasar, Orientasi hasil", P:'D', K:'*' },
          { text:"Jalankan standar yang tinggi, Akurat", P:'C', K:'*' }
      ]}
    ]
  };
  
  console.log('[DATA-DISC] ✓ Loaded — ' + DISC_DATA.questions.length + ' soal');