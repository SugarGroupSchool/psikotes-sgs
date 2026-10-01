/* ============================================================
   BAUM — 5. Akar
   ============================================================ */
window.GRAFIS_AUTO_DATA_BAUM_SLIDES = window.GRAFIS_AUTO_DATA_BAUM_SLIDES || [];

/* 🖼️ Base URL folder gambar */
const BASE_AKAR = 'https://raw.githubusercontent.com/SugarGroupSchool/psikotes-sgs/refs/heads/main/js/data/grafis/assets/akar/';

window.GRAFIS_AUTO_DATA_BAUM_SLIDES.push({
  id: 'baum-05-akar',
  title: '5. Akar',
  image: BASE_AKAR + '1akar%20single.png',
  sections: [
    {
      id: 'akar_items',
      title: 'Pilih sesuai yang digambarkan oleh subjek',
      type: 'checkbox',
      items: [
        {
          image: BASE_AKAR + '1akar%20dengan%20satu%20garis.png',
          id: 'akar_satu_garis',
          label: 'Akar dengan Satu Garis',
          ciri: 'Hanya 1 garis tunggal sebagai akar · tidak ada pembatas / dua sisi · garis lurus sederhana di bawah batang · tanpa detail · umum pada anak kecil · hanya berupa satu goresan garis di bawah batang · tidak ada area atau ruang akar · tidak ada percabangan akar · tidak ada akar samping · garis bisa horizontal atau sedikit melengkung · tidak ada upaya membentuk dua sisi · tidak ada shading atau tekstur · bentuk sangat sederhana · tidak ada indikasi kedalaman · sering kali hanya garis pendek · tidak ada elemen tambahan seperti tanah atau rumput · kesan primitif dan belum berkembang',
          interpret: 'Karakteristik: hanya terdiri dari satu garis tunggal. Umumnya ditemukan pada anak-anak usia dini (hingga kelas 2 SD). Menunjukkan aspek primitif, serta adanya dunia magis atau hal-hal tak terlihat yang masih ada dalam pikiran mereka. Pada orang dewasa, ini bisa ditemukan pada mereka dengan kecenderungan kekurangan intelektual atau taraf primitivitas serta kehidupan magis yang masih terpapar secara tidak sadar.'
        },
        {
          image: BASE_AKAR + '2akar%20dengan%20dua%20garis.png',
          id: 'akar_dua_garis',
          label: 'Akar dengan Dua Garis (Normal)',
          ciri: 'Ada 2 garis yang membentuk area akar (kiri & kanan) · bukan garis tunggal · ada "ruang" di antara dua garis · bisa tertutup atau terbuka di ujungnya · dua garis sejajar atau sedikit melebar ke bawah · membentuk semacam trapesium atau corong · ada area di antara garis yang bisa diisi atau dibiarkan kosong · garis bisa lurus atau melengkung · ujung bawah bisa menyatu atau tidak · tidak ada percabangan rumit · biasanya simetris kiri-kanan · lebar area akar bervariasi · bisa diberi shading atau detail ringan · menunjukkan struktur akar yang lebih matang · tidak hanya satu goresan · ada kesan wadah atau penampung',
          interpret: 'Jenis ini dibagi lagi menjadi dua berdasarkan bentuknya: akar tertutup dan akar terbuka. Masing-masing mencerminkan cara subjek mengelola dorongan-dorongan internalnya — apakah melalui proses seleksi (tertutup) atau tanpa filter (terbuka).',
          subItems: [
            {
              image: BASE_AKAR + '3sksr%20tertutup.png',
              id: 'akar_tertutup',
              label: 'Akar Tertutup',
              dependsOn: 'akar_dua_garis',
              optional: true,
              ciri: 'Ujung akar tertutup rapat · garis bawah melengkung & menyatu · seperti kulit akar · tidak ada celah terbuka di ujung · kedua garis bertemu di bagian bawah · membentuk kurva tertutup · area akar sepenuhnya terbatas · tidak ada lubang atau celah · ujung bawah tampak rapat · seperti kantung tertutup · garis bawah kontinu · tidak ada bagian yang terbuka ke luar · bentuk akar solid · tidak ada garis yang menembus keluar · kesan terkontrol dan tertutup',
              interpret: 'Karakteristik: ujung akar tertutup, seperti kulit akar yang bertindak sebagai filter. Interpretasi: subjek masih mampu menyelesaikan dan mengelola dorongan-dorongan yang muncul. Menggambarkan kemampuan untuk menyeleksi dan memproses dorongan secara hati-hati sebelum bertindak. Individu memiliki kontrol diri yang baik dan tidak impulsif.'
            },
            {
              image: BASE_AKAR + '4akar%20terbuka.png',
              id: 'akar_terbuka',
              label: 'Akar Terbuka',
              dependsOn: 'akar_dua_garis',
              optional: true,
              ciri: 'Ujung akar terbuka · dua garis tidak menyatu di bawah · ada celah di ujung bawah · seperti corong terbuka · kedua garis berakhir tanpa bertemu · ada ruang terbuka di bagian bawah · bentuk seperti huruf U atau V terbuka · tidak ada penutup di ujung · garis bawah tidak ada · area akar terbuka ke bawah · bisa melebar ke bawah · tidak ada batas bawah · celah bisa lebar atau sempit · kesan menerima tanpa filter · tidak ada penutup atau penghalang',
              interpret: 'Karakteristik: ujung akar terbuka, menerima segala sesuatu tanpa proses seleksi atau penyaringan. Interpretasi: segala sesuatu diterima tanpa proses evaluasi, seolah-olah ada kebutuhan mendesak untuk menerima sebanyak mungkin tanpa mempertimbangkan dampak atau konsekuensinya. Menandakan impulsivitas, kelemahan struktur kepribadian, dan ambisi besar yang tidak diimbangi oleh rasa mampu. Struktur dorongan tidak selektif: impuls langsung menjadi sikap/tindakan. Struktur kepribadian sangat lemah (neurastenik): rentan terhadap tekanan, kelelahan emosional, toleransi rendah terhadap stres, kecemasan berlebihan, dan sulit menyesuaikan diri dengan perubahan. Kesenjangan idealisme vs realitas: merasa diri kurang mampu tetapi memiliki ambisi/aspirasi yang tinggi. Individu bermimpi besar, namun merasa tidak memiliki kapasitas untuk mencapainya.'
            }
          ]
        }
      ]
    }
  ]
});
