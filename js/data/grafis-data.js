/* =========================================================
   DATA TES GRAFIS (DAP, HTP, BAUM)
   ========================================================= */

   const GRAFIS_DATA = {
    subtests: [
      {
        key: "orang",
        kode: "DAP",
        title: "Tes DAP — Gambar Orang",
        subtitle: "Baca petunjuk dengan teliti sebelum mulai menggambar.",
        waktuGambar: 600,
        waktuUpload: 180,
        alat: `
          <ul class="grafis-detail-list">
            <li><b>1 lembar kertas A4 polos</b>, tidak bergaris atau bergambar.</li>
            <li>Posisi kertas <b>portrait / berdiri</b>.</li>
            <li>Gunakan <b>pensil HB atau 2B</b>.</li>
            <li>Siapkan <b>HP atau kamera</b> untuk memfoto hasil gambar.</li>
          </ul>
        `,
        instruksi: `
          <ol class="grafis-detail-list">
            <li>Gambarlah <b>satu orang lengkap</b>, mulai dari kepala hingga kaki.</li>
            <li>Usahakan seluruh bagian tubuh terlihat dalam satu gambar.</li>
            <li>Gambarkan wajah, rambut, tubuh, tangan, kaki, pakaian, dan bagian lain yang relevan secara wajar.</li>
            <li>Anda bebas menentukan apakah orang yang digambar laki-laki atau perempuan.</li>
            <li>Anda bebas menentukan posisi atau aktivitas orang tersebut.</li>
            <li>Kerjakan sendiri sesuai pemahaman Anda. <b>Tidak perlu meniru contoh gambar.</b></li>
            <li>Setelah selesai, pada halaman yang sama tuliskan <b>nama dan usia</b> orang yang Anda gambar.</li>
            <li>Gunakan hanya <b>pensil HB / 2B</b> pada kertas yang telah disediakan.</li>
          </ol>
        `,
        contoh: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkQN708-vQz0R7uuwehFFlbEJDRzsHT9mhEw&s"
      },
      {
        key: "rumah",
        kode: "HTP",
        title: "Tes HTP — Rumah, Pohon, Orang",
        subtitle: "Baca petunjuk dengan teliti sebelum mulai menggambar.",
        waktuGambar: 900,
        waktuUpload: 180,
        alat: `
          <ul class="grafis-detail-list">
            <li><b>1 lembar kertas A4 polos</b>, tidak bergaris atau bergambar.</li>
            <li>Posisi kertas <b>landscape / mendatar</b>.</li>
            <li>Gunakan <b>pensil HB atau 2B</b>.</li>
            <li>Siapkan <b>HP atau kamera</b> untuk memfoto hasil gambar.</li>
          </ul>
        `,
        instruksi: `
          <ol class="grafis-detail-list">
            <li>Gambarlah <b>rumah, pohon, dan orang</b> pada <b>satu lembar kertas</b>.</li>
            <li>Ketiga objek harus berada pada halaman yang sama.</li>
            <li>Anda bebas menentukan bentuk dan model rumah, pohon, serta orang.</li>
            <li>Gambarkan objek sesuai dengan apa yang Anda bayangkan dan pahami.</li>
            <li>Usahakan gambar dibuat secara lengkap dan tidak sekadar berupa simbol sederhana.</li>
            <li>Setelah selesai menggambar, tuliskan <b>deskripsi singkat mengenai gambar tersebut</b> pada halaman yang sama.</li>
            <li>Deskripsi dapat menjelaskan isi gambar atau hal yang menurut Anda relevan mengenai gambar tersebut.</li>
            <li>Kerjakan sendiri. <b>Tidak perlu meniru contoh gambar.</b></li>
          </ol>
        `,
        contoh: "https://tse2.mm.bing.net/th/id/OIP.98wasfICBNXXEoaGoC1l5gAAAA?pid=Api&P=0&h=180"
      },
      {
        key: "pohon",
        kode: "BAUM",
        title: "Tes BAUM — Gambar Pohon",
        subtitle: "Baca petunjuk dengan teliti sebelum mulai menggambar.",
        waktuGambar: 600,
        waktuUpload: 180,
        alat: `
          <ul class="grafis-detail-list">
            <li><b>1 lembar kertas A4 polos</b>, tidak bergaris atau bergambar.</li>
            <li>Posisi kertas <b>portrait / berdiri</b>.</li>
            <li>Gunakan <b>pensil HB atau 2B</b>.</li>
            <li>Siapkan <b>HP atau kamera</b> untuk memfoto hasil gambar.</li>
          </ul>
        `,
        instruksi: `
          <ol class="grafis-detail-list">
            <li>Gambarlah <b>satu pohon lengkap</b> pada kertas yang telah disediakan.</li>
            <li>Gambarkan pohon dengan bagian-bagian yang menurut Anda diperlukan agar terlihat sebagai sebuah pohon yang lengkap.</li>
            <li>Anda bebas memilih <b>jenis pohon</b> yang ingin digambar.</li>
            <li>Kerjakan berdasarkan pemahaman dan gambaran Anda sendiri.</li>
            <li><b>Tidak perlu meniru contoh gambar.</b></li>
            <li>Setelah selesai, tuliskan <b>nama jenis pohon</b> yang Anda gambar.</li>
          </ol>
        `,
        contoh: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5LeXM9AL4dNiCt0UfWv1XRGFsSrHEqwbL9rzM8odSOjVZRRVLgFf7rap6yJmjpvhaHosA3ITPgJv-KEe3tc-Aan9qJ-3tB6MuHgbsHesZjXkjenn1fuL8QhW5bWqzyNhoeSjhwBZw0RgL/s400/pohon-pepaya-contoh-gambar-mewarnai-di-beringin.gif"
      }
    ]
  };
  
  console.log('[DATA-GRAFIS] ✓ Loaded — ' + GRAFIS_DATA.subtests.length + ' subtes');