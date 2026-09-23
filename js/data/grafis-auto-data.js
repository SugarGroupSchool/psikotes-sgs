/* ============================================================
   DATA INTERPRETASI OTOMATIS — GRAFIS (DAP, BAUM, HTP)
   ------------------------------------------------------------
   - Setiap test punya groups > sections > items
   - type: 'radio' (single) atau 'checkbox' (multi)
   - Setiap item punya `interpret` (auto-text)
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

      /* ===================== 1. UKURAN GAMBAR ===================== */
      {
        id: 'ukuran',
        title: '1. Ukuran Gambar',
        sections: [
          {
            id: 'ukuran_kertas',
            title: 'Perbandingan dengan Ukuran Kertas',
            type: 'radio',
            items: [
              {
                id: 'normal',
                label: 'Normal (≈ 2/3 folio)',
                interpret: 'Ukuran gambar proporsional terhadap kertas. Menunjukkan perencanaan yang memadai dalam mengisi ruang, kemampuan mengukur realitas secara wajar, serta kontrol ego yang cukup.'
              },
              {
                id: 'terlalu_besar',
                label: 'Terlalu besar',
                interpret: 'Indikasi agresivitas, sikap ekspansif, fantasi tinggi, dan grandiositas. Dapat juga mencerminkan aktivitas emosional berlebihan atau perasaan tidak mampu yang tidak disadari.'
              },
              {
                id: 'terlalu_kecil',
                label: 'Terlalu kecil',
                interpret: 'Indikasi rasa tidak aman, harga diri rendah, perasaan inferior, kecemasan, depresi, ketergantungan berlebih, kekuatan ego rendah, hambatan sosial, dan reaksi menarik diri saat menghadapi stres.'
              },
              {
                id: 'keluar_kertas',
                label: 'Keluar dari kertas',
                interpret: 'Kesulitan merencanakan atau menata sesuatu secara terstruktur, tendensi manik atau over-aktif.'
              }
            ]
          },
          {
            id: 'mahkota_batang',
            title: 'Perbandingan Mahkota & Batang',
            type: 'radio',
            items: [
              {
                id: 'normal',
                label: 'Normal (mahkota ≈ 2/3 batang)',
                interpret: 'Proporsi mahkota dan batang seimbang. Menunjukkan keseimbangan antara kehidupan berpikir/fantasi dengan fungsi praktis dan kemampuan mengakar pada realitas.'
              },
              {
                id: 'mahkota_besar',
                label: 'Mahkota lebih besar',
                interpret: 'Dominasi dunia ide, fantasi, aspirasi, dan pemikiran abstrak dibanding aspek praktis dan realitas.'
              },
              {
                id: 'batang_besar',
                label: 'Batang lebih besar',
                interpret: 'Dominasi fungsi praktis, dorongan primitif, atau kekakuan. Menekankan pada kekuatan dan stabilitas konkret.'
              }
            ]
          },
          {
            id: 'ukuran_pohon',
            title: 'Kategori Ukuran Pohon (bisa pilih lebih dari satu)',
            type: 'checkbox',
            items: [
              {
                id: 'sangat_besar',
                label: 'Sangat besar',
                interpret: 'Agresivitas dan kecenderungan bertindak secara eksternal; sikap ekspansif, fantasi tinggi, dan grandiositas; aktivitas emosional berlebihan; perasaan tidak mampu yang tidak disadari; dugaan gangguan organik, efek alkohol, atau masalah neuropsikologis; kesadaran moral yang lemah dan potensi sifat antisosial; kecurigaan berlebih dan kecenderungan paranoid.'
              },
              {
                id: 'ciri_manik',
                label: 'Ciri manik (garis tepi sangat besar)',
                interpret: 'Menunjukkan ciri-ciri manik — periode emosi tinggi, energik, dan terkadang terlampau euforik yang dapat mengindikasikan gangguan bipolar atau episode mania.'
              },
              {
                id: 'lebih_kecil',
                label: 'Lebih kecil dari rata-rata',
                interpret: 'Rasa tidak aman, harga diri rendah, perasaan inferior; kecemasan, depresi, atau penarikan diri; ketergantungan berlebih dan perilaku kekanak-kanakan; kekuatan ego yang rendah, kecenderungan kompulsif atau neurotik; hambatan dalam interaksi sosial, pemalu, atau defensif; reaksi menarik diri saat menghadapi stres; kurang bersemangat atau kurangnya motivasi dalam mengejar tujuan.'
              },
              {
                id: 'keluar_kertas_2',
                label: 'Keluar dari kertas',
                interpret: 'Kesulitan merencanakan sesuatu atau menata sesuatu secara terstruktur; tendensi manik atau over-aktif di mana subjek cenderung terlalu aktif secara fisik atau mental.'
              },
              {
                id: 'normal_ukuran',
                label: 'Normal (≈ 7 inci)',
                interpret: 'Energi yang biasa saja — tingkat energi cukup untuk berfungsi sehari-hari namun tidak menunjukkan dorongan atau gairah emosional yang kuat; kurang insight atau wawasan diri rendah; optimisme superfisial — sikap positif yang ditampilkan bisa jadi hanya di permukaan, ada kemungkinan subjek menyangkal atau menekan perasaan negatif.'
              }
            ]
          }
        ]
      },

      /* ===================== 2. KESAN GAMBAR ===================== */
      {
        id: 'kesan',
        title: '2. Kesan Gambar',
        sections: [
          {
            id: 'kesan_umum',
            title: 'Kesan Umum Gambar',
            type: 'checkbox',
            items: [
              {
                id: 'jelas',
                label: 'Jelas & mudah dimengerti',
                interpret: 'Keterbacaan gambar yang baik menunjukkan kemampuan menyampaikan pesan visual secara terarah dan struktur berpikir yang jelas.'
              },
              {
                id: 'abstrak',
                label: 'Abstrak / kurang jelas',
                interpret: 'Kesan gambar yang abstrak dapat mencerminkan kurangnya kejelasan struktur internal atau kesulitan dalam mengomunikasikan isi pikiran secara konkret.'
              },
              {
                id: 'hidup',
                label: 'Tampak hidup (bergerak, ditiup angin, dll.)',
                interpret: 'Gambar terlihat hidup dan beraktivitas — menunjukkan energi psikis yang tersalurkan, vitalitas, dan keberlanjutan fungsi mental.'
              },
              {
                id: 'mati',
                label: 'Tampak mati / kaku',
                interpret: 'Gambar terkesan statis dan mati dapat mencerminkan pengurangan vitalitas psikis, kekakuan, atau penekanan emosi.'
              },
              {
                id: 'dinamis',
                label: 'Dinamis',
                interpret: 'Kesan dinamis menunjukkan energi dan kemampuan untuk berubah, bergerak, serta mengekspresikan pengalaman batin.'
              },
              {
                id: 'statis',
                label: 'Statis / rigid',
                interpret: 'Kesan statis dapat menunjukkan ketenangan atau kepasifan, kekakuan, dan kesulitan beradaptasi terhadap perubahan.'
              }
            ]
          }
        ]
      },

      /* ===================== 3. PENEMPATAN / LOKASI ===================== */
      {
        id: 'lokasi',
        title: '3. Penempatan / Lokasi (Simbolik Ruang)',
        sections: [
          {
            id: 'zona_utama',
            title: 'Zona Utama (bisa pilih lebih dari satu)',
            type: 'checkbox',
            items: [
              {
                id: 'tengah',
                label: 'Cenderung di tengah',
                interpret: 'Kecenderungan harmonis dan seimbang; subjek berupaya mencari keseimbangan antara berbagai aspek kehidupan dan tidak terlalu condong ke arah ekstrem. Mudah beradaptasi dengan hal-hal yang nyata. Memiliki kesadaran individual dan objektif. Sphere dari ego yang empiris — mendekati kehidupan berdasarkan pengalaman dan fakta yang dapat diobservasi, dengan pendekatan pragmatis dan rasional.'
              },
              {
                id: 'kiri',
                label: 'Cenderung ke kiri',
                interpret: 'Ke arah aku (ego) — fokus pada diri sendiri, orientasi introspektif; dipengaruhi oleh masa lampau; introvert; terlalu menghubungkan segala sesuatu ke dalam dirinya secara subjektif; senang menimbang diri sendiri; sukar dipengaruhi; senang menyembunyikan masalah.'
              },
              {
                id: 'kanan',
                label: 'Cenderung ke kanan',
                interpret: 'Ekstrovert; orientasi ke arah masa yang akan datang; lebih terbuka; lebih objektif dalam menilai situasi; lebih mudah dipengaruhi dunia luar dan responsif terhadap ide-ide baru.'
              },
              {
                id: 'atas',
                label: 'Cenderung ke atas',
                interpret: 'Penuh dengan dunia ide; imajinatif; intelektual; kesadaran yang over individual — lebih fokus pada pikiran, pandangan, atau pengalaman pribadi dan cenderung intro-spektif.'
              },
              {
                id: 'bawah',
                label: 'Cenderung ke bawah',
                interpret: 'Mudah didominasi oleh drive-nya (ketidaksadaran) — pengaruh yang signifikan dari lapisan tak sadar atau dorongan-dorongan yang tidak sepenuhnya disadari. Fokus pada pembawaan, substansi, lapisan primitif, dorongan, dan emosi.'
              }
            ]
          },
          {
            id: 'sudut',
            title: 'Sudut Spesifik (bisa pilih lebih dari satu)',
            type: 'checkbox',
            items: [
              {
                id: 'kiri_atas',
                label: 'Sudut kiri atas',
                interpret: 'Normal bila digambar oleh anak-anak; bila digambar oleh orang dewasa menunjukkan tendensi regresi (diperjelas dengan detail dan kombinasi lain). Juga mengindikasikan rasa tidak aman atau cemas. Indikasi psikotik dijumpai bila ada proporsi tidak baik antara mahkota dan batang, bentuk cabang dan batang yang dipaksakan.'
              },
              {
                id: 'kanan_atas',
                label: 'Sudut kanan atas',
                interpret: 'Hasrat untuk menekankan pada hal-hal yang tidak menyenangkan; terlalu optimis pada hal-hal yang berkaitan dengan masa depan. Juga mengindikasikan keinginan untuk menghilangkan orientasi ke depan.'
              },
              {
                id: 'kanan_bawah',
                label: 'Sudut kanan bawah',
                interpret: 'Kecenderungan timbulnya rasa tak aman, perasaan takut berdiri sendiri, rasa dependen yang kuat, cemas, ada keinginan untuk menghindari pengalaman baru dan lebih suka berorientasi pada fantasi. Indikasi depresi dijumpai pada gambar yang kecil.'
              },
              {
                id: 'kiri_bawah',
                label: 'Sudut kiri bawah',
                interpret: 'Kondisi depresif karena terpengaruh pada masa lalunya. Bila digambar tampak kurang proporsional, garis kurang baik, dan shading yang kuat, menunjukkan kecenderungan depresif.'
              }
            ]
          }
        ]
      },

      /* ===================== 4. KUALITAS GARIS ===================== */
      {
        id: 'garis',
        title: '4. Kualitas Garis',
        sections: [
          {
            id: 'kualitas_garis',
            title: 'Karakteristik Garis (bisa pilih lebih dari satu)',
            type: 'checkbox',
            items: [
              {
                id: 'tekanan_kuat',
                label: 'Tekanan kuat',
                interpret: 'Menyiratkan dorongan, kebutuhan, atau hasrat personal yang kuat. Mencerminkan kekuatan subjek dalam mencapai tujuan atau mengatasi ketegangan. Pada gambar besar, dapat mengindikasikan ambisi yang tinggi.'
              },
              {
                id: 'tebal_tidak_teratur',
                label: 'Garis tebal dan tidak teratur',
                interpret: 'Indikasi impulsivitas, reaksi cepat, kurang terkontrol, dan sifat agresif. Garis tebal menunjukkan intensitas emosional yang tinggi.'
              },
              {
                id: 'tekanan_lemah',
                label: 'Tekanan lemah',
                interpret: 'Menunjukkan rasa enggan atau kurang semangat, terutama pada gambar kecil dan terletak di bawah. Mencerminkan ketidakpastian atau kurangnya motivasi.'
              },
              {
                id: 'lemah_tidak_terarah',
                label: 'Garis lemah dan tidak terarah',
                interpret: 'Menunjukkan sikap ragu-ragu, ketidakpastian, atau kurangnya fokus dan tujuan yang jelas.'
              },
              {
                id: 'terputus',
                label: 'Garis terputus-putus dan tidak konstruktif',
                interpret: 'Mengindikasikan sikap ragu-ragu atau tidak konsisten. Garis terputus dengan tekanan lemah bisa menunjukkan keinginan aktivitas yang tidak terkendali atau kurangnya kendali diri.'
              },
              {
                id: 'shading',
                label: 'Ada shading',
                interpret: 'Shading dapat mencerminkan kecemasan dan mungkin menghasilkan kecenderungan neurotik sebagai manifestasi dari rasa tidak aman. Pada anak, shading yang normal dianggap sebagai respons kreatif yang wajar.'
              }
            ]
          }
        ]
      }

    ]
  },

  /* ==========================================================
     DAP — DRAW A PERSON (placeholder — menunggu data)
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
     HTP — HOUSE TREE PERSON (placeholder — menunggu data)
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

console.log('[GRAFIS-AUTO-DATA] ✓ Loaded — BAUM, DAP (placeholder), HTP (placeholder)');
