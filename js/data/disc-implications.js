/* =========================================================
   DISC IMPLICATIONS & ROLE RECOMMENDATIONS
   ========================================================= */

   const DISC_IMPLICATIONS = {
    D: {
      Administrator: {
        most: `Sebagai pribadi bertipe Dominan, ${appState.identity?.nickname || 'Peserta'} menunjukkan peran yang sangat kuat dalam mengatur dan memimpin tim administrasi. Sigap mengambil inisiatif, berani mengusulkan perbaikan sistem kerja, dan tidak segan menegakkan aturan demi menjaga ketertiban administrasi. Karakter ini penting ketika institusi membutuhkan ketegasan, percepatan, dan hasil nyata di bidang tata kelola administrasi.`,
        least: `Saat menghadapi tekanan besar atau perubahan mendadak, karakter Dominan dapat berubah menjadi kekakuan berlebihan dalam menjalankan aturan. Penting untuk selalu membuka komunikasi dua arah, meningkatkan empati, dan memperkuat kerja sama tim.`,
        change: `Dalam menghadapi tekanan deadline administrasi, tetap mampu menjaga kendali dan memberikan arahan yang jelas. Tantangannya adalah membuka diri pada masukan rekan sejawat dan meningkatkan fleksibilitas.`
      },
      Guru: {
        most: `Sebagai sosok Dominan, tampil sebagai pemimpin kelas yang tegas dan mampu mengambil keputusan cepat. Karakter ini sangat mendukung pengelolaan kelas aktif, terutama ketika dibutuhkan tindakan tegas menjaga disiplin siswa.`,
        least: `Saat tekanan atau konflik muncul di kelas, sisi Dominan bisa berubah menjadi kecenderungan otoriter, kurang sabar, bahkan terlalu menuntut siswa. Seimbangkan ketegasan dan empati.`,
        change: `Menghadapi perubahan kurikulum atau tekanan di kelas, tetap dapat menjaga peran pemimpin dan memastikan kelas berjalan sesuai rencana.`
      },
      "Technical Staff": {
        most: `Dalam peran sebagai tenaga teknis, sangat sigap mengatasi masalah, berani mengambil keputusan perbaikan, dan mampu memimpin pelaksanaan solusi di lapangan.`,
        least: `Pada situasi tekanan, kecenderungan Dominan dapat membuatnya bertindak tergesa-gesa atau menuntut hasil sempurna dari tim.`,
        change: `Ketika terjadi perubahan mendadak, tetap mampu bertahan dan bergerak cepat mengambil keputusan.`
      },
      Housekeeping: {
        most: `Sebagai pribadi Dominan, sangat cepat dan tegas dalam mengambil keputusan untuk memastikan area kerja selalu bersih, rapi, serta memenuhi standar tinggi yang ditetapkan perusahaan.`,
        least: `Ketika menghadapi tekanan tinggi, karakter Dominan bisa muncul sebagai kecenderungan terlalu keras menegakkan aturan kebersihan.`,
        change: `Pada saat beban kerja meningkat, tetap mampu menyesuaikan strategi dengan cepat dan mengambil alih kendali situasi.`
      }
    },
    DI: {
      Administrator: {
        most: `Sebagai kombinasi Dominan–Influencer, memadukan ketegasan eksekusi dengan kemampuan memobilisasi orang. Menetapkan standar tinggi, menuntut kejelasan otoritas, dan cepat mendorong perbaikan proses.`,
        least: `Di bawah tekanan, sisi D-I bisa tampak kaku, dingin, dan terlalu menuntut standar sempurna, membuat koordinasi top-down dan komunikasi terpotong.`,
        change: `Saat terjadi perubahan sistem atau target baru, bergerak cepat mengambil keputusan dan mendefinisikan arah.`
      },
      Guru: {
        most: `Sebagai pendidik D-I, karismatik, tegas, dan mampu menggerakkan kelas menuju sasaran yang jelas. Progresif dalam metode, berani mencoba hal baru, serta pandai memotivasi siswa.`,
        least: `Dalam tekanan (konflik kelas, tenggat kurikulum), dapat menjadi terlalu direktif dan kurang memberi ruang suara siswa.`,
        change: `Ketika kurikulum/penilaian berubah, sigap menstrukturkan implementasi dan mengajak siswa mengikuti ritme baru.`
      },
      "Technical Staff": {
        most: `Dalam konteks teknis, bergerak cepat melakukan triase masalah, menentukan prioritas, dan memimpin eksekusi perbaikan. Kritis–logis saat menganalisis akar masalah dan imajinatif merancang solusi.`,
        least: `Di tekanan insiden, berisiko mengambil jalan pintas, menekan tim untuk "sempurna sekarang", atau kurang sabar pada proses.`,
        change: `Saat migrasi teknologi/perubahan arsitektur, efektif sebagai champion: menetapkan milestone, membagi peran, dan menggerakkan adopsi.`
      },
      Housekeeping: {
        most: `Sebagai pemimpin shift D-I, tegas menjaga standar kebersihan, rute kerja, dan SLA area. Mampu memotivasi anggota, mengoordinasikan lintas area, dan cepat menindak temuan.`,
        least: `Di beban puncak, bisa terdengar keras, kurang sabar pada pelanggaran kecil, dan menekan tim untuk "zero defect" seketika.`,
        change: `Ketika metode kerja atau layout area berubah, cekatan merancang ulang rute, menetapkan standar baru, dan melatih tim.`
      }
    },
    DS: {
      Administrator: {
        most: `Sebagai kombinasi Dominan–Steady, menggabungkan ketegasan target dengan kestabilan proses. Objektif, analitis, dan konsisten menjaga SLA administrasi, seraya memberi dukungan pada otoritas yang dihormati.`,
        least: `Di bawah tekanan, dapat menjadi terlalu kaku pada prosedur dan enggan mengubah rute kerja yang sudah mapan.`,
        change: `Saat perubahan kebijakan/sistem, efektif memimpin transisi bertahap: pilot kecil, jadwal jelas, dan checklist implementasi.`
      },
      Guru: {
        most: `Sebagai pendidik |D-S|, tegas namun menenangkan. Menata kelas yang disiplin, konsisten pada aturan, dan memiliki tindak lanjut tugas yang rapi.`,
        least: `Dalam tekanan, bisa menjadi kaku pada rencana, enggan mencoba metode baru, dan kurang memberi ruang spontanitas siswa.`,
        change: `Saat kurikulum berubah, menyusun adaptasi bertahap: rubrik jelas, contoh pekerjaan, dan penjadwalan ulang beban tugas.`
      },
      "Technical Staff": {
        most: `Dalam konteks teknis, tenang–tegas: cepat menetapkan prioritas, lalu eksekusi terstruktur dengan SOP.`,
        least: `Di puncak tekanan, cenderung bertahan pada cara yang sudah aman, menunda eskalasi, atau menghindari eksperimen solusi.`,
        change: `Saat migrasi/perubahan arsitektur, unggul dengan rollout bertahap (canary/blue–green), runbook, serta checklist validasi.`
      },
      Housekeeping: {
        most: `Sebagai pemimpin tim kebersihan, menjaga standar tinggi dengan ritme kerja stabil. Rute, jadwal, dan inspeksi konsisten.`,
        least: `Di beban puncak, bisa terjebak pada jadwal kaku, lambat menukar prioritas area, dan menuntut ketuntasan penuh sebelum pindah tugas.`,
        change: `Ketika layout/SOP berubah, menjalankan perubahan lewat simulasi rute, briefing singkat di lapangan, dan buddy system.`
      }
    },
    DC: {
      Administrator: {
        most: `Kombinasi Dominan–Conscientious membuat tegas sekaligus presisi. Menetapkan target yang terukur, menjaga kepatuhan kebijakan, dan memperkuat dokumentasi serta kontrol mutu.`,
        least: `Di bawah tekanan, perfeksionisme dapat memicu micromanagement, kritik tajam, atau jeda keputusan karena "mencari opsi terbaik".`,
        change: `Dalam perubahan sistem/struktur, efektif bila kriteria sukses jelas, RACI tegas, dan ada "minimum viable process" untuk go-live.`
      },
      Guru: {
        most: `Sebagai guru |D-C|, menyusun pembelajaran yang sangat terstruktur dengan standar tinggi.`,
        least: `Dalam tekanan, bisa terlalu banyak aturan, nada umpan balik menjadi kritis, dan spontanitas belajar berkurang.`,
        change: `Saat ada perubahan kurikulum/asesmen, menyiapkan checklist, contoh tugas, dan rubrik baru.`
      },
      "Technical Staff": {
        most: `Dalam peran teknis, memimpin RCA dengan tajam, menetapkan kontrol perubahan ketat, dan mengeksekusi perbaikan yang presisi.`,
        least: `Di tekanan insiden, bisa jatuh ke "analysis paralysis" atau sebaliknya memutuskan cepat namun kritis pada tim.`,
        change: `Pada perubahan arsitektur, unggul bila ada RFC, test plan, rollback, dan metrik kualitas yang disepakati.`
      },
      Housekeeping: {
        most: `Menegakkan standar kebersihan secara tegas sekaligus rinci. Audit rutin, SOP detail, dan pelatihan terukur memastikan kualitas konsisten.`,
        least: `Di beban puncak, kecenderungan perfeksionis bisa memicu kritik berlebihan dan waktu tersita pada detail minor.`,
        change: `Saat metode/peralatan baru diterapkan, menyusun standar kerja, daftar cek, dan metrik hasil.`
      }
    },
    DIS: {
      Administrator: {
        most: `Sebagai kombinasi Dominan–Influencer–Steady, unggul menggerakkan orang dan pekerjaan sekaligus menjaga ritme tim.`,
        least: `Di bawah tekanan, cenderung melepas detail berlebihan, over-optimistic pada timeline, dan mengandalkan persuasi menggantikan kontrol mutu.`,
        change: `Saat perubahan kebijakan/sistem, efektif sebagai motor peluncuran: sosialisasi cepat, koordinasi lintas fungsi, dan pengaturan ritme adopsi.`
      },
      Guru: {
        most: `Sebagai pendidik |D-I-S|, karismatik, energik, dan konsisten mendorong kelas pada tujuan yang jelas.`,
        least: `Dalam tekanan, bisa kurang teliti pada detail penilaian, terlalu cepat mengganti pendekatan, atau memberi tugas berlebih.`,
        change: `Saat kurikulum/asesmen berubah, cepat memetakan tujuan akhir dan menggerakkan keterlibatan siswa–orang tua.`
      },
      "Technical Staff": {
        most: `Dalam konteks teknis, sigap men-set prioritas, mengoordinasikan respon, dan menjaga tim tetap bergerak hingga insiden/pekerjaan tuntas.`,
        least: `Di puncak tekanan, berisiko melewatkan dokumentasi, QA, atau verifikasi akhir karena fokus pada penyelesaian cepat.`,
        change: `Saat migrasi/perubahan arsitektur, unggul menggalang dukungan dan menjaga momentum rollout.`
      },
      Housekeeping: {
        most: `Sebagai pimpinan shift, tegas menjaga target kebersihan area, mengatur rute kerja, dan memotivasi tim dengan energi tinggi.`,
        least: `Di beban puncak, bisa kehilangan detail (sudut/spot kecil), mengubah prioritas terlalu cepat, atau menambah tugas tanpa perhitungan beban.`,
        change: `Ketika layout/SOP berubah, efektif melakukan briefing massal, demo lapangan, dan coaching on-the-spot.`
      }
    },
    DIC: {
      Administrator: {
        most: `Kombinasi Dominan–Influencer–Conscientious membuat mampu menyatukan relasi, kecepatan, dan ketepatan.`,
        least: `Di bawah tekanan, berisiko lompat ke proyek baru sebelum perencanaan matang, multitasking berlebihan, atau terlalu perfeksionis pada detail minor.`,
        change: `Dalam perubahan sistem/struktur, andal membangun buy-in dan menyusun SOP minimal agar cepat go-live.`
      },
      Guru: {
        most: `Sebagai guru |D-I-C|, memadukan kelas yang hidup, arahan tegas, dan akurasi evaluasi.`,
        least: `Dalam tekanan, kecenderungan berpindah topik/proyek atau "over-engineer" materi dapat membuat waktu habis pada detail tidak kritis.`,
        change: `Saat kurikulum/asesmen berubah, mengkomunikasikan alasan perubahan dengan baik.`
      },
      "Technical Staff": {
        most: `Dalam peran teknis, mampu berjejaring lintas tim, bergerak cepat, sekaligus menyelam ke detail ketika dibutuhkan.`,
        least: `Di insiden atau proyek paralel, bisa melompat konteks, melemahkan rencana, atau terjebak pada detail non-kritis.`,
        change: `Dalam perubahan arsitektur, efektif memimpin RFC, menyelaraskan stakeholder, dan menjaga presisi eksekusi.`
      },
      Housekeeping: {
        most: `Ramah dan persuasif dalam memimpin tim, menegakkan standar secara detail ketika diperlukan.`,
        least: `Di beban puncak, dapat terlalu lama pada detail kecil atau berpindah tugas sebelum rute selesai.`,
        change: `Saat metode/alat baru diterapkan, mampu melatih tim dengan pendekatan komunikatif.`
      }
    },
    DSI: {
      Administrator: {
        most: `Sebagai kombinasi |D-S-I|, menyeimbangkan ketegasan target, ritme kerja stabil, dan kemampuan memobilisasi orang.`,
        least: `Di bawah tekanan, cenderung mempertahankan cara aman (S), menunda konfrontasi, atau melebarkan komitmen.`,
        change: `Saat ada perubahan kebijakan/sistem, efektif melakukan transisi bertahap: pilot kecil, jadwal implementasi jelas.`
      },
      Guru: {
        most: `Sebagai pendidik |D-S-I|, tegas namun menenangkan: tujuan belajar jelas, struktur kelas stabil.`,
        least: `Dalam tekanan, bisa menjadi kaku pada rencana, kurang spontan, atau memberi beban tugas berlebih.`,
        change: `Saat kurikulum/asesmen berubah, menyusun peta transisi: apa yang tetap–berubah–dihapus.`
      },
      "Technical Staff": {
        most: `Dalam konteks teknis, tenang–tegas: menetapkan prioritas, mengoordinasikan respons, dan menutup loop.`,
        least: `Di puncak tekanan, bisa bertahan pada metode lama yang aman (S), menunda eskalasi, atau melewatkan dokumentasi.`,
        change: `Saat migrasi/perubahan arsitektur, unggul pada rollout bertahap.`
      },
      Housekeeping: {
        most: `Sebagai pimpinan shift, menjaga standar area dengan rute kerja stabil, inspeksi rutin, dan dorongan motivasional.`,
        least: `Di beban puncak, jadwal bisa terlalu kaku, prioritas sulit ditukar, dan tugas baru ditambahkan tanpa hitung beban.`,
        change: `Saat layout/SOP berubah, menjalankan simulasi rute, briefing lapangan, dan buddy system.`
      }
    },
    DSC: {
      Administrator: {
        most: `Kombinasi |D-S-C| membuat tegas pada target, stabil dalam eksekusi, dan teliti pada kepatuhan.`,
        least: `Di bawah tekanan, perfeksionisme (C) dan preferensi stabil (S) dapat memperlambat keputusan.`,
        change: `Dalam perubahan sistem, efektif jika ada governance jelas: RACI, RFC, checklist go-live.`
      },
      Guru: {
        most: `Sebagai guru |D-S-C|, menyusun kelas yang sangat terstruktur, konsisten, dan berstandar tinggi.`,
        least: `Dalam tekanan, bisa terlalu banyak aturan, fokus detail minor, dan mengurangi ruang eksplorasi siswa.`,
        change: `Saat kurikulum/asesmen berubah, menyiapkan contoh tugas, rubrik baru, dan jadwal bertahap.`
      },
      "Technical Staff": {
        most: `Dalam peran teknis, memimpin dengan SOP yang kuat, dokumentasi presisi, dan kontrol perubahan ketat.`,
        least: `Di insiden, berisiko masuk "analysis paralysis" atau menunda rilis demi kesempurnaan.`,
        change: `Pada perubahan arsitektur, mengandalkan RFC, test plan, rollback, dan metrik kesehatan.`
      },
      Housekeeping: {
        most: `Menegakkan standar kebersihan melalui SOP rinci, inspeksi rutin, dan jadwal stabil.`,
        least: `Di beban puncak, perhatian pada detail minor bisa menurunkan throughput dan moral tim.`,
        change: `Saat metode/alat baru diterapkan, menyusun standar kerja, daftar cek, dan pelatihan bertahap.`
      }
    },
    DCI: {
      Administrator: {
        most: `Sebagai |D-C-I|, menyatukan ketegasan target, presisi proses, dan komunikasi yang membangun buy-in.`,
        least: `Di tekanan tinggi, bisa terjebak perfeksionisme (C) atau melompat konteks ke proyek baru (I).`,
        change: `Dalam perubahan sistem/struktur, efektif memimpin RFC, menetapkan CTQ, dan menyosialisasikan rencana.`
      },
      Guru: {
        most: `Sebagai guru |D-C-I|, mengelola kelas yang hidup namun presisi: arahan jelas, rubrik akurat.`,
        least: `Dalam tekanan, bisa over-engineer materi/penilaian atau berpindah topik terlalu cepat.`,
        change: `Saat kurikulum/asesmen berubah, menjelaskan alasan perubahan dengan baik.`
      },
      "Technical Staff": {
        most: `Dalam peran teknis, memadukan keputusan cepat (D), QA presisi (C), dan koordinasi lintas tim (I).`,
        least: `Di insiden atau proyek paralel, bisa bergeser ke kritik tajam atau multitasking berlebih.`,
        change: `Dalam perubahan arsitektur, memimpin penyelarasan stakeholder.`
      },
      Housekeeping: {
        most: `Mendorong standar tinggi yang detail saat diperlukan, sambil menjaga semangat tim.`,
        least: `Di beban puncak, berisiko teralihkan oleh detail non-kritis.`,
        change: `Ketika metode/alat baru diluncurkan, melatih tim secara komunikatif.`
      }
    },
    DCS: {
      Administrator: {
        most: `Kombinasi |D-C-S| membuat menetapkan target tegas, mengeksekusi presisi, dan menjaga ritme kerja stabil.`,
        least: `Di bawah tekanan, perfeksionisme (C) dan preferensi stabil (S) dapat memperlambat keputusan.`,
        change: `Dalam perubahan sistem/struktur, efektif bila governance jelas.`
      },
      Guru: {
        most: `Sebagai guru |D-C-S|, membangun kelas yang sangat terstruktur, standar tinggi, dan konsisten.`,
        least: `Dalam tekanan, bisa terlalu banyak aturan, fokus pada detail minor, dan mengurangi ruang eksplorasi siswa.`,
        change: `Saat kurikulum/asesmen berubah, menyiapkan contoh tugas, rubrik baru, dan kalender evaluasi bertahap.`
      },
      "Technical Staff": {
        most: `Dalam peran teknis, memimpin RCA tajam, menjaga kontrol perubahan ketat, dan mengeksekusi perbaikan presisi.`,
        least: `Di insiden, berisiko masuk "analysis paralysis" atau menghabiskan waktu pada detail non-kritis.`,
        change: `Pada migrasi/rekayasa ulang, unggul jika ada RFC, test plan, rollback, dan metrik kesehatan.`
      },
      Housekeeping: {
        most: `Menegakkan standar kebersihan tegas sekaligus rinci, dengan jadwal dan rute kerja yang stabil.`,
        least: `Di beban puncak, perhatian pada detail minor dapat menurunkan throughput dan moral tim.`,
        change: `Saat metode/peralatan baru diterapkan, menyusun SOP, daftar cek, dan pelatihan bertahap.`
      }
    },
    I: {
      Administrator: {
        most: `Sebagai tipe Influencer, mahir membangun komunikasi efektif. Sering menjadi sumber inspirasi dan motivasi di lingkungan kerja.`,
        least: `Ketika beban kerja tinggi, cenderung terdistraksi oleh percakapan atau kegiatan non-prioritas.`,
        change: `Di bawah tekanan, tetap mampu membangun sinergi tim, menjaga suasana kerja tetap positif.`
      },
      Guru: {
        most: `Sebagai Guru Influencer, sangat pandai membangun hubungan hangat dengan siswa.`,
        least: `Saat menghadapi tekanan di kelas, mungkin cenderung terlalu larut dalam interaksi sosial.`,
        change: `Dalam menghadapi tantangan, tetap dapat menjaga suasana kelas tetap positif.`
      },
      "Technical Staff": {
        most: `Sebagai tenaga teknis Influencer, unggul dalam membangun komunikasi dan koordinasi yang baik antaranggota tim.`,
        least: `Saat menghadapi kendala teknis, kecenderungan terlalu santai atau kurang tegas dapat membuat solusi berjalan lebih lambat.`,
        change: `Di bawah tekanan kerja teknis, mampu menjaga suasana tim tetap kooperatif.`
      },
      Housekeeping: {
        most: `Sebagai Influencer di Housekeeping, menjadi sumber semangat dan motivasi bagi seluruh tim.`,
        least: `Dalam tekanan, kadang lebih memprioritaskan suasana hati tim dibandingkan pencapaian standar kerja.`,
        change: `Dalam masa sibuk atau deadline mendesak, tetap mampu menjaga motivasi dan semangat tim.`
      }
    },
    ID: {
      Administrator: {
        most: `Sebagai |I-D|, pemimpin integratif yang mobilisasi orang "melalui" relasi.`,
        least: `Di bawah tekanan, bisa impulsif, terlalu optimistis, banyak bicara, dan melewati detail/prosedur.`,
        change: `Saat perubahan kebijakan/sistem, kuat di kampanye perubahan.`
      },
      Guru: {
        most: `Sebagai guru |I-D|, karismatik, komunikatif, dan pandai memotivasi kelas menuju target.`,
        least: `Dalam tekanan, berisiko impulsif, berganti metode terlalu cepat, atau meluberkan tugas.`,
        change: `Saat kurikulum berganti, mahir menjelaskan alasan perubahan.`
      },
      "Technical Staff": {
        most: `Dalam konteks teknis, efektif sebagai incident coordinator/liaison.`,
        least: `Di insiden, risiko melewatkan dokumentasi/QA, "mengejar solusi" tanpa verifikasi, atau overpromising.`,
        change: `Pada migrasi/perubahan, champion adopsi.`
      },
      Housekeeping: {
        most: `Sebagai leader lapangan, memotivasi tim, menjaga suasana positif, dan mendorong capaian area.`,
        least: `Di beban puncak, bisa terlalu banyak komunikasi, kurang fokus CTQ.`,
        change: `Saat SOP/layout berubah, unggul melakukan briefing massal.`
      }
    },
    IS: {
      Administrator: {
        most: `Sebagai |I-S|, hangat, suportif, dan kuat membangun harmoni tim.`,
        least: `Risiko: menghindari konfrontasi, terlalu toleran pada kinerja rendah.`,
        change: `Dalam perubahan, efektif menenangkan kekhawatiran dan memfasilitasi pelatihan.`
      },
      Guru: {
        most: `Sebagai guru |I-S|, menciptakan kelas yang hangat, aman, dan suportif.`,
        least: `Risiko: kurang tegas pada aturan, terlalu memaklumi, dan tersinggung oleh kritik.`,
        change: `Saat kurikulum berubah, menyampaikan perubahan dengan empatik dan bertahap.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, andal di perawatan rutin, dukungan pengguna, dan dokumentasi.`,
        least: `Risiko: enggan eskalasi/konfrontasi saat ada blocking issue.`,
        change: `Pada perubahan, membantu pelatihan penggunaan dan adopsi.`
      },
      Housekeeping: {
        most: `Menjaga moral tim, rutin, dan stabilitas area.`,
        least: `Risiko: sulit menegur pelanggaran, toleran terhadap ketidakefektifan.`,
        change: `Saat SOP baru, memperkenalkan perubahan secara bertahap.`
      }
    },
    IC: {
      Administrator: {
        most: `Sebagai |I-C|, sosial namun presisi saat diperlukan.`,
        least: `Risiko: optimisme membuat salah menilai kemampuan orang/deadline.`,
        change: `Dalam perubahan, komunikator andal yang menyediakan panduan rinci.`
      },
      Guru: {
        most: `Sebagai guru |I-C|, menyeimbangkan kelas yang engaging dengan ketelitian rubrik.`,
        least: `Risiko: menilai terlalu optimistis kemampuan siswa.`,
        change: `Saat kurikulum/asesmen berubah, mahir menjelaskan dan memberi contoh konkret.`
      },
      "Technical Staff": {
        most: `Dalam peran teknis, menjadi jembatan sains–stakeholder.`,
        least: `Risiko: perfeksionisme memperlambat rilis.`,
        change: `Pada perubahan, unggul menulis RFC, panduan, dan materi sosialisasi.`
      },
      Housekeeping: {
        most: `Ramah dalam memimpin tim dan mampu mengawal detail SOP saat diperlukan.`,
        least: `Risiko: terlalu optimistis pada kemampuan tim.`,
        change: `Saat metode/alat baru diterapkan, komunikatif melatih tim.`
      }
    },
    IDS: {
      Administrator: {
        most: `Sebagai |I-D-S|, memimpin lewat relasi yang kuat, eksekusi cepat, dan ritme kerja stabil.`,
        least: `Di bawah tekanan, bisa mengejar popularitas, melebarkan komitmen, atau terlalu bergantung pada bantuan.`,
        change: `Dalam perubahan kebijakan/sistem, unggul sebagai duta perubahan.`
      },
      Guru: {
        most: `Sebagai guru |I-D-S|, karismatik, suportif, dan tegas mengarahkan kelas.`,
        least: `Dalam tekanan, berisiko terlalu banyak aktivitas sosial.`,
        change: `Saat kurikulum/asesmen berubah, menjelaskan alasan perubahan dengan bahasa yang membangun buy-in.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, efektif sebagai koordinator insiden dan penggerak eksekusi.`,
        least: `Di puncak tekanan, bisa melewatkan dokumentasi/QA.`,
        change: `Saat migrasi/perubahan arsitektur, kuat di sosialisasi dan pendampingan.`
      },
      Housekeeping: {
        most: `Sebagai leader lapangan, menjaga semangat tim, mengatur rute kerja efisien.`,
        least: `Risiko: menunda teguran demi suasana.`,
        change: `Ketika SOP/layout berubah, menjalankan briefing massal.`
      }
    },
    IDC: {
      Administrator: {
        most: `Sebagai |I-D-C|, menggabungkan jejaring kuat, dorongan eksekusi, dan ketepatan.`,
        least: `Risiko: tampak dingin/dominan, terlalu fokus tugas hingga mengabaikan kebutuhan orang.`,
        change: `Dalam perubahan sistem/struktur, kuat sebagai frontman.`
      },
      Guru: {
        most: `Sebagai guru |I-D-C|, menghadirkan kelas engaging dengan standar yang jelas.`,
        least: `Risiko: terlalu menekan target hingga relasi siswa terabaikan.`,
        change: `Saat kurikulum berganti, mengomunikasikan perubahan dengan baik.`
      },
      "Technical Staff": {
        most: `Dalam peran teknis, luwes mengoordinasi lintas fungsi, bergerak cepat.`,
        least: `Di insiden/proyek paralel, risiko konteks lompat, overpromising.`,
        change: `Pada perubahan arsitektur, efektif menyatukan stakeholder.`
      },
      Housekeeping: {
        most: `Persuasif merekrut/menyatukan tim, menetapkan standar yang jelas.`,
        least: `Risiko: mendorong tugas "harus benar" namun kurang mendengar kebutuhan lapangan.`,
        change: `Ketika metode/alat baru diterapkan, melatih secara interaktif.`
      }
    },
    ISD: {
      Administrator: {
        most: `Sebagai |I-S-D|, menjaga harmoni dan layanan internal sambil tetap mendorong target tercapai.`,
        least: `Risiko: menghindari konfrontasi, mencari pengakuan, atau menunda keputusan sulit.`,
        change: `Dalam perubahan, menenangkan kekhawatiran dan memfasilitasi pelatihan.`
      },
      Guru: {
        most: `Sebagai guru |I-S-D|, menghadirkan kelas hangat, komunikatif, dan efisien.`,
        least: `Risiko: terlalu toleran pada kinerja rendah.`,
        change: `Saat kurikulum/asesmen berubah, kuat pada komunikasi dan dukungan siswa.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, adalah liaison yang ramah, stabil dalam eksekusi.`,
        least: `Risiko: menunda konfrontasi pada blocking issue.`,
        change: `Pada perubahan, membantu onboarding dan adopsi pengguna.`
      },
      Housekeeping: {
        most: `Menjaga moral tim, ritme kerja stabil, dan penyelesaian tugas cepat.`,
        least: `Risiko: sulit menegur pelanggaran atau over-focus pada pengakuan.`,
        change: `Saat SOP/layout baru, memperkenalkan perubahan secara komunikatif.`
      }
    },
    ISC: {
      Administrator: {
        most: `Sebagai |I-S-C|, mengandalkan hubungan yang hangat, ritme kerja stabil, dan standar kualitas yang jelas.`,
        least: `Di bawah tekanan, dapat terlalu peduli pada opini orang.`,
        change: `Dalam perubahan kebijakan/sistem, efektif menenangkan kekhawatiran.`
      },
      Guru: {
        most: `Sebagai guru |I-S-C|, membangun kelas hangat dan terstruktur.`,
        least: `Risiko: kurang tegas menegakkan aturan.`,
        change: `Saat kurikulum/asesmen berubah, menjelaskan perubahan secara empatik.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, kuat di dukungan pengguna, dokumentasi langkah-demi-langkah.`,
        least: `Risiko: perfeksionisme administrasi, sulit menolak permintaan.`,
        change: `Pada perubahan, membantu adopsi lewat panduan rinci.`
      },
      Housekeeping: {
        most: `Menjaga moral tim, komunikasi ramah, dan konsistensi SOP.`,
        least: `Risiko: enggan menegur pelanggaran kecil.`,
        change: `Saat SOP/layout baru, mengedukasi tim via demo lapangan.`
      }
    },
    ICD: {
      Administrator: {
        most: `Sebagai |I-C-D|, memadukan keramahan yang membangun jejaring, presisi kebijakan, dan dorongan menyelesaikan tugas.`,
        least: `Di tekanan tinggi, cenderung perfeksionis lalu mengisolasi diri.`,
        change: `Dalam perubahan, efektif bila rencana jelas tanpa kejutan.`
      },
      Guru: {
        most: `Sebagai guru |I-C-D|, menghadirkan kelas engaging namun presisi.`,
        least: `Risiko: over-detail hingga waktu habis.`,
        change: `Saat kurikulum/asesmen berubah, menyiapkan panduan rinci dan contoh penilaian.`
      },
      "Technical Staff": {
        most: `Dalam peran teknis, unggul pada QA, dokumentasi presisi, dan pengendalian perubahan.`,
        least: `Risiko: analisis berlarut, resistensi pada perubahan mendadak.`,
        change: `Pada perubahan arsitektur, menulis RFC, menetapkan CTQ.`
      },
      Housekeeping: {
        most: `Ramah dalam memimpin, namun sangat berorientasi pada kualitas.`,
        least: `Risiko: lambat beradaptasi saat ritme berubah.`,
        change: `Saat metode/alat baru diterapkan, menyiapkan standar kerja.`
      }
    },
    ICS: {
      Administrator: {
        most: `Sebagai |I-C-S|, mengutamakan layanan empatik, kepastian standar, dan stabilitas proses.`,
        least: `Di bawah tekanan, bisa terlalu khawatir pada opini.`,
        change: `Dalam perubahan, efektif sebagai fasilitator adopsi.`
      },
      Guru: {
        most: `Sebagai guru |I-C-S|, menghadirkan kelas hangat, terstruktur, dan adil.`,
        least: `Risiko: terlalu memikirkan penerimaan sosial.`,
        change: `Saat kurikulum/asesmen berubah, menyusun contoh tugas, rubrik baru.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, kuat di layanan pengguna, dokumentasi, dan QA praktis.`,
        least: `Risiko: perfeksionisme dokumentasi, menunda eskalasi.`,
        change: `Pada perubahan, menyusun panduan praktis.`
      },
      Housekeeping: {
        most: `Ramah dan telaten menjaga SOP.`,
        least: `Risiko: sulit menegur pelanggaran.`,
        change: `Saat SOP/layout baru, melakukan briefing komunikatif.`
      }
    },
    SD: {
      Administrator: {
        most: `Sebagai |S-D|, menggabungkan stabilitas proses dengan dorongan hasil.`,
        least: `Di bawah tekanan, bisa menjadi tidak ramah/terkesan dingin.`,
        change: `Pada perubahan kebijakan/sistem, efektif dengan transisi bertahap.`
      },
      Guru: {
        most: `Sebagai guru |S-D|, tenang–tegas.`,
        least: `Dalam tekanan, bisa kaku pada rencana, kurang spontan.`,
        change: `Saat kurikulum/asesmen berubah, menyusun peta transisi.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, unggul pada prioritisasi tenang, eksekusi terstruktur.`,
        least: `Di puncak tekanan, cenderung menunda eskalasi/konfrontasi.`,
        change: `Saat migrasi/perubahan arsitektur, cocok memimpin rollout bertahap.`
      },
      Housekeeping: {
        most: `Sebagai leader area, menjaga ritme kerja stabil.`,
        least: `Di beban puncak atau situasi tidak nyaman, bisa tampak dingin.`,
        change: `Ketika SOP/layout berubah, menjalankan simulasi rute.`
      }
    },
    SI: {
      Administrator: {
        most: `Sebagai |S-I|, hangat, stabil, dan menjaga harmoni tim serta layanan internal.`,
        least: `Risiko: menghindari konfrontasi, menerima kritik sebagai serangan pribadi.`,
        change: `Dalam perubahan, menenangkan kekhawatiran dan memfasilitasi pelatihan.`
      },
      Guru: {
        most: `Sebagai guru |S-I|, menciptakan kelas hangat, aman, dan suportif.`,
        least: `Risiko: kurang tegas, terlalu memaklumi.`,
        change: `Saat kurikulum/asesmen berubah, menyampaikan perubahan secara empatik.`
      },
      "Technical Staff": {
        most: `Dalam peran teknis, kuat di layanan pengguna, perawatan rutin.`,
        least: `Risiko: menunda eskalasi demi harmoni.`,
        change: `Pada perubahan, membantu onboarding dan adopsi pengguna.`
      },
      Housekeeping: {
        most: `Menjaga moral tim, komunikasi ramah, dan rutinitas stabil.`,
        least: `Risiko: enggan menegur pelanggaran.`,
        change: `Saat SOP/layout baru, memperkenalkan perubahan secara komunikatif.`
      }
    },
    SC: {
      Administrator: {
        most: `Sebagai |S-C|, ramah–teliti: menjaga stabilitas proses, kepatuhan, dan detail operasional.`,
        least: `Risiko: terlalu hati-hati, menunda keputusan.`,
        change: `Dalam perubahan, efektif dengan rencana tanpa kejutan.`
      },
      Guru: {
        most: `Sebagai guru |S-C|, menghadirkan kelas stabil, rapi, dan teliti.`,
        least: `Risiko: terlalu hati-hati, ruang eksplorasi sempit.`,
        change: `Saat kurikulum/asesmen berubah, menyiapkan panduan rinci dan bertahap.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, kuat pada QA, SOP terperinci, dan dokumentasi.`,
        least: `Risiko: kehati-hatian berlebih memperlambat rilis.`,
        change: `Pada perubahan arsitektur, menyusun RFC, checklist verifikasi.`
      },
      Housekeeping: {
        most: `Menjaga SOP rinci, rute kerja stabil, dan inspeksi yang telaten.`,
        least: `Jika merasa ada yang "memanfaatkan", dapat melambat untuk mengamati.`,
        change: `Saat metode/alat baru diterapkan, menyiapkan standar kerja, pelatihan.`
      }
    },
    SDI: {
      Administrator: {
        most: `Sebagai |S-D-I|, menyeimbangkan ritme kerja stabil (S), ketegasan target (D), dan komunikasi yang memobilisasi (I).`,
        least: `Di bawah tekanan, cenderung menghindari konfrontasi pada isu tidak nyaman.`,
        change: `Saat perubahan kebijakan/sistem, efektif menjalankan transisi bertahap.`
      },
      Guru: {
        most: `Sebagai guru |S-D-I|, menata kelas stabil dan suportif.`,
        least: `Dalam tekanan, bisa ragu menegakkan aturan di awal.`,
        change: `Saat kurikulum/asesmen berubah, memetakan "apa tetap–berubah–dihapus".`
      },
      "Technical Staff": {
        most: `Dalam konteks teknis, tenang–tegas.`,
        least: `Di puncak tekanan, bisa menunda eskalasi.`,
        change: `Saat migrasi/perubahan arsitektur, unggul dengan rollout bertahap.`
      },
      Housekeeping: {
        most: `Sebagai leader area, menjaga ritme kerja stabil.`,
        least: `Di beban puncak, bisa menunda teguran demi suasana.`,
        change: `Ketika SOP/layout berubah, melakukan simulasi rute.`
      }
    },
    SDC: {
      Administrator: {
        most: `Sebagai |S-D-C|, sabar–terkontrol, menggali fakta, dan mengeksekusi konsisten.`,
        least: `Risiko: terlalu hati-hati dan lambat memutuskan.`,
        change: `Dalam perubahan sistem, efektif jika governance jelas.`
      },
      Guru: {
        most: `Sebagai guru |S-D-C|, menyiapkan kelas rapi, stabil, dan berbasis bukti.`,
        least: `Dalam tekanan, bisa terlalu hati-hati, membatasi spontanitas.`,
        change: `Saat kurikulum/asesmen berubah, menyiapkan panduan rinci, contoh penilaian.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, kuat pada fact-finding, SOP, dan eksekusi konsisten.`,
        least: `Risiko: analysis paralysis, menunda eskalasi.`,
        change: `Pada perubahan arsitektur, mengandalkan RFC, test plan, rollback.`
      },
      Housekeeping: {
        most: `Telaten, ramah, dan konsisten menolong tim.`,
        least: `Jika ritme berubah, bisa melambat untuk mengamati.`,
        change: `Saat metode/alat baru diterapkan, menyiapkan daftar cek, pelatihan.`
      }
    },
    SID: {
      Administrator: {
        most: `Sebagai |S-I-D|, hangat–stabil dan komunikatif, namun siap memimpin ketika tujuan jelas.`,
        least: `Risiko: menghindari konfrontasi, menerima kritik secara pribadi.`,
        change: `Dalam perubahan, menenangkan kekhawatiran dan menggalang dukungan.`
      },
      Guru: {
        most: `Sebagai guru |S-I-D|, menciptakan kelas hangat dan suportif.`,
        least: `Risiko: kurang tegas di awal, terlalu memaklumi.`,
        change: `Saat kurikulum/asesmen berubah, menyampaikan alasan perubahan secara empatik.`
      },
      "Technical Staff": {
        most: `Dalam peran teknis, andal pada layanan pengguna, dokumentasi.`,
        least: `Risiko: menunda eskalasi atau teguran demi harmoni.`,
        change: `Pada perubahan, membantu onboarding dan adopsi pengguna.`
      },
      Housekeeping: {
        most: `Menjaga moral tim, ritme stabil, dan siap memimpin.`,
        least: `Risiko: enggan menegur pelanggaran kecil.`,
        change: `Saat SOP/layout baru, memperkenalkan perubahan secara komunikatif.`
      }
    },
    SIC: {
      Administrator: {
        most: `Sebagai |S-I-C|, stabil, ramah, dan loyal dalam membangun hubungan pemangku kepentingan.`,
        least: `Di bawah tekanan, bisa terlalu peduli pada opini, enggan konfrontasi.`,
        change: `Dalam perubahan kebijakan/sistem, efektif sebagai fasilitator.`
      },
      Guru: {
        most: `Sebagai guru |S-I-C|, menciptakan kelas hangat dan terstruktur.`,
        least: `Risiko: sulit tegas di awal.`,
        change: `Saat kurikulum/asesmen berubah, menjelaskan alasan perubahan secara empatik.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, kuat di dukungan pengguna, dokumentasi, dan QA praktis.`,
        least: `Risiko: menunda eskalasi demi harmoni.`,
        change: `Pada perubahan, menyusun panduan praktis, pelatihan komunikatif.`
      },
      Housekeeping: {
        most: `Ramah, telaten, dan menjaga SOP berjalan konsisten.`,
        least: `Risiko: enggan menegur pelanggaran kecil.`,
        change: `Saat SOP/layout baru, melakukan demo lapangan.`
      }
    },
    SCD: {
      Administrator: {
        most: `Sebagai |S-C-D|, stabil, teliti, dan berorientasi kualitas.`,
        least: `Risiko: terlalu hati-hati, memperlambat kerja.`,
        change: `Dalam perubahan sistem, unggul jika governance jelas.`
      },
      Guru: {
        most: `Sebagai guru |S-C-D|, menghadirkan kelas stabil, rapi, dan teliti.`,
        least: `Risiko: kehati-hatian berlebih menyempitkan eksplorasi.`,
        change: `Saat kurikulum/asesmen berubah, menyiapkan panduan rinci.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, kuat pada QA, dokumentasi presisi, dan kontrol perubahan.`,
        least: `Risiko: analysis paralysis, lambat beradaptasi.`,
        change: `Pada perubahan arsitektur, menyiapkan RFC, test plan, rollback.`
      },
      Housekeeping: {
        most: `Menjaga SOP rinci, rute stabil, dan inspeksi telaten.`,
        least: `Jika merasa ada pihak "memanfaatkan", dapat memperlambat kerja.`,
        change: `Saat metode/alat baru diterapkan, menyusun standar kerja.`
      }
    },
    SCI: {
      Administrator: {
        most: `Sebagai |S-C-I|, mengutamakan stabilitas proses, kepastian standar, dan komunikasi yang hangat.`,
        least: `Risiko: keras kepala pada keputusan yang sudah diambil.`,
        change: `Dalam perubahan, efektif sebagai fasilitator adopsi.`
      },
      Guru: {
        most: `Sebagai guru |S-C-I|, menghadirkan kelas hangat, terstruktur, dan adil.`,
        least: `Risiko: sulit mengubah pendirian.`,
        change: `Saat kurikulum/asesmen berubah, menyusun contoh tugas, rubrik baru.`
      },
      "Technical Staff": {
        most: `Dalam peran teknis, andal di layanan pengguna, dokumentasi, dan QA praktis.`,
        least: `Risiko: menunda eskalasi demi harmoni.`,
        change: `Pada perubahan, menyusun panduan rinci dan pelatihan komunikatif.`
      },
      Housekeeping: {
        most: `Menjaga SOP konsisten, komunikasi ramah, dan rute kerja stabil.`,
        least: `Risiko: enggan menegur pelanggaran kecil.`,
        change: `Saat SOP/layout baru, melakukan briefing komunikatif.`
      }
    },
    S: {
      Administrator: {
        most: `Sebagai tipe Steadiness, sangat teratur, teliti, dan andal dalam memastikan proses administrasi berjalan lancar.`,
        least: `Ketika menghadapi perubahan prosedur atau sistem baru, cenderung resisten atau lambat beradaptasi.`,
        change: `Saat beban kerja meningkat, tetap mampu menjaga konsistensi dan kualitas pekerjaan.`
      },
      Guru: {
        most: `Sebagai guru tipe Steadiness, sangat konsisten, sabar, dan mampu menciptakan lingkungan belajar yang stabil.`,
        least: `Saat menghadapi perubahan kurikulum, cenderung kurang fleksibel.`,
        change: `Ketika tekanan pekerjaan meningkat, tetap bisa menjaga stabilitas dan ketenangan kelas.`
      },
      "Technical Staff": {
        most: `Sebagai tenaga teknis Steadiness, memastikan setiap pekerjaan dilakukan dengan teliti.`,
        least: `Ketika dihadapkan pada perubahan alat, cenderung butuh waktu lebih lama.`,
        change: `Dalam tekanan kerja teknis, mampu menjaga standar kualitas.`
      },
      Housekeeping: {
        most: `Sebagai Steadiness di Housekeeping, sangat menjaga standar kebersihan secara konsisten.`,
        least: `Saat terjadi perubahan pola kerja, cenderung sulit beradaptasi.`,
        change: `Ketika tekanan meningkat, tetap stabil, teliti, dan tidak mudah panik.`
      }
    },
    CD: {
      Administrator: {
        most: `Sebagai |C-D|, sangat berorientasi tugas, faktual, dan tegas pada standar.`,
        least: `Risiko: tampak dingin/berjarak, micromanagement pada detail.`,
        change: `Dalam perubahan sistem/struktur, efektif jika ada governance jelas.`
      },
      Guru: {
        most: `Sebagai guru |C-D|, menyusun pembelajaran presisi dengan rubrik ketat.`,
        least: `Risiko: umpan balik terasa keras, ruang eksplorasi sempit.`,
        change: `Saat kurikulum/asesmen berubah, menyiapkan kriteria inti, contoh penilaian.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, unggul pada RCA tajam, kontrol perubahan ketat.`,
        least: `Risiko: mengabaikan dimensi relasi, sulit mempercayai tim.`,
        change: `Pada migrasi/rekayasa ulang, memastikan RFC, test plan, rollback.`
      },
      Housekeeping: {
        most: `Menegakkan standar kebersihan dengan SOP rinci, checklist lengkap.`,
        least: `Risiko: gaya dingin, fokus berlebih pada detail minor.`,
        change: `Saat metode/alat baru diterapkan, menyusun standar kerja terukur.`
      }
    },
    CI: {
      Administrator: {
        most: `Sebagai |C-I|, menggabungkan akurasi kebijakan dengan kemampuan membangun hubungan.`,
        least: `Risiko: perfeksionisme hingga isolasi kerja.`,
        change: `Dalam perubahan, efektif bila ada rencana tanpa kejutan.`
      },
      Guru: {
        most: `Sebagai guru |C-I|, menghadirkan kelas rapi dan adil.`,
        least: `Risiko: waktu tersita pada detail non-kritis.`,
        change: `Saat kurikulum/asesmen berubah, menyediakan template sederhana.`
      },
      "Technical Staff": {
        most: `Dalam peran teknis, kuat pada QA, dokumentasi, dan koordinasi.`,
        least: `Risiko: analisis berlarut atau "menunggu kepastian".`,
        change: `Pada perubahan arsitektur, menulis RFC, menyiapkan panduan adopsi.`
      },
      Housekeeping: {
        most: `Teliti namun tetap ramah.`,
        least: `Risiko: terjebak detail minor atau bekerja sendiri terlalu lama.`,
        change: `Saat SOP/alat baru, menyiapkan panduan dan pelatihan singkat.`
      }
    },
    CS: {
      Administrator: {
        most: `Sebagai |C-S|, sistematis, patuh prosedur, dan teliti.`,
        least: `Risiko: analysis paralysis, menghindari konflik.`,
        change: `Dalam perubahan kebijakan/sistem, efektif jika transisi terstruktur.`
      },
      Guru: {
        most: `Sebagai guru |C-S|, menjaga kelas teratur dan akurat.`,
        least: `Risiko: terlalu berhati-hati hingga ruang eksplorasi menyempit.`,
        change: `Saat kurikulum/asesmen berubah, menyiapkan panduan rinci dan jadwal bertahap.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, andal pada SOP, QA, dan dokumentasi presisi.`,
        least: `Risiko: resistensi pada perubahan mendadak.`,
        change: `Pada perubahan arsitektur, menyiapkan RFC, checklist verifikasi.`
      },
      Housekeeping: {
        most: `Menjaga standar kebersihan melalui SOP rinci, rute stabil.`,
        least: `Risiko: terlalu lama pada detail kecil.`,
        change: `Saat metode/alat baru diterapkan, menyusun standar kerja.`
      }
    },
    CDI: {
      Administrator: {
        most: `Sebagai |C-D-I|, sangat berorientasi tugas dan faktual.`,
        least: `Risiko: terkesan dingin/berjarak, micromanagement pada detail.`,
        change: `Dalam perubahan sistem/struktur, unggul bila governance tegas.`
      },
      Guru: {
        most: `Sebagai guru |C-D-I|, menegakkan standar akademik tinggi.`,
        least: `Risiko: umpan balik terasa keras, jarak emosional.`,
        change: `Saat kurikulum/asesmen berubah, menurunkan kriteria inti, contoh penilaian.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, memimpin RCA tajam, change control ketat.`,
        least: `Risiko: overcontrol, skeptis terhadap input tim.`,
        change: `Pada migrasi/rekayasa ulang, mengawal RFC, test plan, rollback.`
      },
      Housekeeping: {
        most: `Menegakkan SOP rinci, checklist lengkap, dan audit disiplin.`,
        least: `Risiko: kesan dingin, fokus pada detail minor.`,
        change: `Saat metode/alat baru, menyusun standar kerja terukur.`
      }
    },
    CDS: {
      Administrator: {
        most: `Sebagai |C-D-S|, detail–logis dengan standar tinggi.`,
        least: `Risiko: analysis paralysis, terlalu kompetitif pada kualitas minor.`,
        change: `Dalam perubahan, efektif dengan transisi bertahap.`
      },
      Guru: {
        most: `Sebagai guru |C-D-S|, menghadirkan kelas sangat terstruktur, rubrik detail.`,
        least: `Risiko: perfeksionisme menyempitkan kreativitas.`,
        change: `Saat kurikulum/asesmen berubah, menyiapkan paket adaptasi lengkap.`
      },
      "Technical Staff": {
        most: `Dalam peran teknis, kuat pada QA presisi, dokumentasi.`,
        least: `Risiko: menunda rilis karena mengejar kesempurnaan.`,
        change: `Pada migrasi/arsitektur baru, menyusun test plan, rollback.`
      },
      Housekeeping: {
        most: `Telaten, fokus detail, dan ritme kerja stabil.`,
        least: `Risiko: terlalu lama di detail minor.`,
        change: `Saat metode/alat baru, menggelar pelatihan bertahap.`
      }
    },
    CID: {
      Administrator: {
        most: `Sebagai |C-I-D|, memadukan akurasi kebijakan, komunikasi yang ramah.`,
        least: `Risiko: perfeksionisme → isolasi kerja.`,
        change: `Dalam perubahan, efektif bila rencana tanpa kejutan.`
      },
      Guru: {
        most: `Sebagai guru |C-I-D|, menghadirkan kelas rapi dan adil.`,
        least: `Risiko: waktu habis pada detail.`,
        change: `Saat kurikulum/asesmen berubah, menyediakan template sederhana.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, unggul di QA/dokumentasi presisi.`,
        least: `Risiko: analisis berlarut, menunda keputusan.`,
        change: `Pada perubahan arsitektur, menulis RFC, menyiapkan panduan adopsi.`
      },
      Housekeeping: {
        most: `Ramah seperlunya namun detail.`,
        least: `Risiko: tenggelam pada detail, lambat berubah.`,
        change: `Saat SOP/alat baru, menyiapkan panduan rinci, pelatihan.`
      }
    },
    CIS: {
      Administrator: {
        most: `Sebagai |C-I-S|, menggabungkan ketepatan (C), komunikasi hangat (I), dan stabilitas proses (S).`,
        least: `Di bawah tekanan, bisa terlalu peduli pada opini.`,
        change: `Dalam perubahan kebijakan/sistem, efektif sebagai fasilitator.`
      },
      Guru: {
        most: `Sebagai guru |C-I-S|, menghadirkan kelas hangat, terstruktur, dan adil.`,
        least: `Risiko: terlalu cemas dengan penerimaan sosial.`,
        change: `Saat kurikulum/asesmen berubah, menyajikan contoh tugas.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, kuat pada QA/dokumentasi, dukungan pengguna.`,
        least: `Risiko: menunda eskalasi demi harmoni.`,
        change: `Pada perubahan, menulis panduan praktis.`
      },
      Housekeeping: {
        most: `Menjaga SOP konsisten, komunikasi ramah, dan rute kerja stabil.`,
        least: `Risiko: sulit menegur.`,
        change: `Saat SOP/layout baru, melakukan briefing komunikatif.`
      }
    },
    CSD: {
      Administrator: {
        most: `Sebagai |C-S-D|, sistematis, teliti, dan stabil.`,
        least: `Risiko: analysis paralysis, alergi perubahan mendadak.`,
        change: `Dalam perubahan sistem, efektif jika ada governance tegas.`
      },
      Guru: {
        most: `Sebagai guru |C-S-D|, menghadirkan kelas sangat terstruktur, rubrik presisi.`,
        least: `Risiko: ruang eksplorasi sempit.`,
        change: `Saat kurikulum/asesmen berubah, menyiapkan paket adaptasi lengkap.`
      },
      "Technical Staff": {
        most: `Dalam peran teknis, unggul pada QA presisi, dokumentasi.`,
        least: `Risiko: lambat beradaptasi.`,
        change: `Pada migrasi/arsitektur baru, menyusun test plan, rollback.`
      },
      Housekeeping: {
        most: `Telaten, fokus detail, dan ritme kerja stabil.`,
        least: `Risiko: terlalu lama di detail minor.`,
        change: `Saat metode/alat baru, menggelar pelatihan bertahap.`
      }
    },
    CSI: {
      Administrator: {
        most: `Sebagai |C-S-I|, mengutamakan ketepatan standar (C), stabilitas proses (S), dan komunikasi yang hangat (I).`,
        least: `Risiko: keras pada keputusan yang sudah diambil.`,
        change: `Dalam perubahan, efektif sebagai fasilitator adopsi.`
      },
      Guru: {
        most: `Sebagai guru |C-S-I|, menghadirkan kelas hangat, terstruktur, dan adil.`,
        least: `Risiko: keputusan lambat.`,
        change: `Saat kurikulum/asesmen berubah, menyusun contoh tugas, rubrik baru.`
      },
      "Technical Staff": {
        most: `Dalam tim teknis, andal pada QA/dokumentasi, layanan pengguna.`,
        least: `Risiko: menunda eskalasi demi harmoni.`,
        change: `Pada perubahan, menulis panduan rinci.`
      },
      Housekeeping: {
        most: `Menjaga SOP konsisten, komunikasi ramah, dan rute kerja stabil.`,
        least: `Risiko: enggan menegur pelanggaran kecil.`,
        change: `Saat SOP/layout baru, melakukan briefing komunikatif.`
      }
    },
    C: {
      Administrator: {
        most: `Sebagai tipe Compliance, sangat teliti dan sistematis dalam pengelolaan data.`,
        least: `Kecenderungan untuk terlalu banyak pengecekan, kadang membuat proses kerja menjadi lambat.`,
        change: `Di bawah tekanan, tetap menjaga kualitas hasil kerja, namun kadang menjadi terlalu kaku.`
      },
      Guru: {
        most: `Sebagai guru tipe Compliance, sangat teliti, terorganisir, dan mampu menyusun rencana pembelajaran sistematis.`,
        least: `Terkadang, bisa terlalu kaku atau perfeksionis.`,
        change: `Ketika beban kerja meningkat, tetap menjaga kualitas pembelajaran.`
      },
      "Technical Staff": {
        most: `Sebagai tenaga teknis Compliance, sangat analitis dan detail.`,
        least: `Kecenderungan perfeksionis terkadang membuat troubleshooting berjalan lebih lama.`,
        change: `Dalam kondisi tertekan, tetap menjaga kualitas dan keamanan kerja.`
      },
      Housekeeping: {
        most: `Sebagai Compliance di Housekeeping, sangat teliti, rapi, dan disiplin.`,
        least: `Kecenderungan terlalu fokus pada detail kecil kadang membuat efisiensi kerja tim menurun.`,
        change: `Ketika tekanan kerja meningkat, tetap menjaga standar kebersihan dan teliti pada detail.`
      }
    }
  };
  
  function getImplication(dominantType, graphType, position, nickname) {
    const pos = position;
    const key = dominantType || '';
    nickname = nickname || (appState.identity?.nickname || "Peserta");
  
    let txt = null;
  
    // Coba key lengkap dulu (mis. "DI", "DIS")
    if (DISC_IMPLICATIONS[key]?.[pos]?.[graphType]) {
      txt = DISC_IMPLICATIONS[key][pos][graphType];
    }
    // Fallback ke huruf pertama
    else if (DISC_IMPLICATIONS[key[0]]?.[pos]?.[graphType]) {
      txt = DISC_IMPLICATIONS[key[0]][pos][graphType];
    }
  
    if (txt) {
      return txt.replace(/\$\{nickname\}/g, nickname);
    }
    return "Deskripsi implikasi khusus untuk posisi ini belum tersedia.";
  }
  
  function getCompatibilityReason(symbol, dominantType, position) {
    const pos = position;
    const reasons = {
      Administrator: {
        SS: `Profil ${dominantType} sangat kuat untuk Administrator — teliti, rapi, konsisten, dan nyaman dengan SOP.`,
        C:  `Profil ${dominantType} cukup cocok untuk Administrator, hanya perlu peningkatan efisiensi dan koordinasi.`,
        CC: `Ada kecocokan dasar, namun beberapa aspek penting administrasi belum sepenuhnya kuat pada profil ${dominantType}.`,
        K:  `Beberapa tuntutan administrasi kurang selaras dengan karakter ${dominantType}. Perlu pendampingan.`,
        default: `Profil memiliki gap besar dengan kebutuhan pekerjaan Administrasi.`
      },
      "Dosen/Guru": {
        SS: `Profil ${dominantType} sangat selaras dengan kebutuhan Guru — stabil, komunikatif, dan konsisten.`,
        C:  `Cocok untuk mengajar, meski butuh penguatan adaptasi kelas atau manajemen dinamika siswa.`,
        CC: `Masih cukup cocok, namun beberapa aspek pedagogis tidak muncul kuat dari karakter ${dominantType}.`,
        K:  `Sebagian besar tuntutan mengajar tidak selaras dengan profil ${dominantType}.`,
        default: `Gap signifikan antara profil kepribadian dan tuntutan profesi Guru.`
      },
      "Technical Staff": {
        SS: `Profil ${dominantType} sangat sesuai untuk Technical Staff — stabil, teliti, dan tekun menyelesaikan masalah teknis.`,
        C:  `Cocok untuk peran teknis, meski perlu peningkatan kecepatan respon atau adaptasi alat baru.`,
        CC: `Cukup cocok, namun beberapa aspek troubleshooting tidak dominan.`,
        K:  `Beberapa tuntutan teknis kurang selaras dengan karakter ${dominantType}.`,
        default: `Profil memiliki gap besar dengan kebutuhan Technical Staff.`
      },
      "IT Staff": {
        SS: `Profil ${dominantType} sangat sesuai untuk IT Staff — analitis, stabil, dan sistematis.`,
        C:  `Cocok untuk IT, hanya perlu peningkatan pada respons cepat atau kolaborasi lintas unit.`,
        CC: `Masih cukup cocok, namun ketelitian atau troubleshooting belum optimal.`,
        K:  `Sejumlah kemampuan inti IT kurang tercermin pada profil ${dominantType}.`,
        default: `Profil memiliki gap besar dengan kebutuhan teknis IT.`
      },
      Housekeeping: {
        SS: `Profil ${dominantType} sangat cocok — stabil, rapi, teliti, dan konsisten menjaga standar kebersihan.`,
        C:  `Cocok, namun perlu sedikit peningkatan efisiensi atau tempo kerja.`,
        CC: `Cukup cocok, namun aspek ketelitian atau konsistensi belum kuat.`,
        K:  `Beberapa tuntutan pekerjaan Housekeeping kurang selaras dengan karakter ${dominantType}.`,
        default: `Profil memiliki gap besar untuk pekerjaan Housekeeping.`
      }
    };
  
    return reasons[pos]?.[symbol] || reasons[pos]?.default || `Deskripsi belum tersedia untuk posisi ${position}.`;
  }
  
  function getStrengthArea(dominantType, position) {
    const pos = position;
    const strengths = {
      D: {
        Administrator: "mengambil keputusan cepat dan mendorong perbaikan sistem administrasi",
        Guru: "mengelola kelas dengan tegas dan memberi arahan jelas",
        "Technical Staff": "menangani masalah teknis dengan cepat dan langsung pada inti masalah",
        "IT Staff": "berani mengambil keputusan saat troubleshooting kritikal",
        Housekeeping: "mengatur tim dan memastikan standar kebersihan terpenuhi dengan tegas"
      },
      I: {
        Administrator: "membangun hubungan kerja positif dan mempermudah komunikasi antar divisi",
        Guru: "meningkatkan motivasi belajar siswa dan membangun interaksi positif",
        "Technical Staff": "memudahkan koordinasi lapangan dan kerja sama teknis",
        "IT Staff": "mempermudah komunikasi user–IT",
        Housekeeping: "menjaga kekompakan dan semangat tim"
      },
      S: {
        Administrator: "menjaga kestabilan, konsistensi, dan alur administrasi yang rapi",
        Guru: "menyediakan pendampingan stabil yang dibutuhkan siswa",
        "Technical Staff": "bekerja konsisten, sabar, dan teliti mengikuti SOP teknis",
        "IT Staff": "mengelola support harian dengan sabar, stabil",
        Housekeeping: "menjaga standar kebersihan harian secara konsisten"
      },
      C: {
        Administrator: "mengelola dokumen dan data dengan presisi tinggi",
        Guru: "menyusun materi dan evaluasi secara sistematis",
        "Technical Staff": "melakukan pengecekan teknis detail dan meminimalkan kesalahan",
        "IT Staff": "analisis error detail, debugging presisi",
        Housekeeping: "menjalankan pekerjaan dengan teliti dan memperhatikan detail kecil"
      }
    };
    return strengths[dominantType]?.[pos] || "kekuatan spesifik sesuai posisi";
  }
  
  function getDevelopmentArea(dominantType) {
    const areas = {
      D: "pelatihan manajemen konflik",
      I: "pengembangan fokus dan disiplin",
      S: "pelatihan adaptasi perubahan",
      C: "pengelolaan ekspektasi realistis"
    };
    return areas[dominantType] || "pengembangan kompetensi";
  }
  
  function formatBulletPoints(lines) {
    const formatted = [];
    let isNewSection = true;
  
    lines.forEach(line => {
      if (line.match(/^(ANALISIS|TINGKAT|POTENSI)/)) {
        formatted.push("");
        formatted.push("• " + line);
        isNewSection = true;
      } else if (line.startsWith("-") || isNewSection) {
        formatted.push("• " + line);
        isNewSection = false;
      } else {
        formatted[formatted.length - 1] += " " + line.trim();
      }
    });
  
    return formatted;
  }
  
  console.log('[DATA-DISC-IMPLICATIONS] ✓ Loaded');