/* ============================================================
   BAUM — 5. Akar
   ============================================================ */
window.GRAFIS_AUTO_DATA_BAUM_SLIDES = window.GRAFIS_AUTO_DATA_BAUM_SLIDES || [];

/* 🖼️ Base URL folder gambar */
const BASE_AKAR = 'https://raw.githubusercontent.com/SugarGroupSchool/psikotes-sgs/refs/heads/main/js/data/grafis/assets/';

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
          image: BASE_AKAR + '1akar%20single.png',
          id: 'akar_satu_garis',
          label: 'Akar dengan Satu Garis',
          ciri: 'Hanya 1 garis tunggal sebagai akar · tidak ada pembatas / dua sisi · garis lurus sederhana di bawah batang · tanpa detail · umum pada anak kecil',
          interpret: 'Karakteristik: hanya terdiri dari satu garis tunggal. Umumnya ditemukan pada anak-anak usia dini (hingga kelas 2 SD). Menunjukkan aspek primitif, serta adanya dunia magis atau hal-hal tak terlihat yang masih ada dalam pikiran mereka. Pada orang dewasa, ini bisa ditemukan pada mereka dengan kecenderungan kekurangan intelektual atau taraf primitivitas serta kehidupan magis yang masih terpapar secara tidak sadar.'
        },
        {
          image: BASE_AKAR + '2akar%20dobel.png',
          id: 'akar_dua_garis',
          label: 'Akar dengan Dua Garis (Normal)',
          ciri: 'Ada 2 garis yang membentuk area akar (kiri & kanan) · bukan garis tunggal · ada "ruang" di antara dua garis · bisa tertutup atau terbuka di ujungnya',
          interpret: 'Jenis ini dibagi lagi menjadi dua berdasarkan bentuknya: akar tertutup dan akar terbuka. Masing-masing mencerminkan cara subjek mengelola dorongan-dorongan internalnya — apakah melalui proses seleksi (tertutup) atau tanpa filter (terbuka).',
          subItems: [
            {
              image: BASE_AKAR + '3akar%20tertutup.png',
              id: 'akar_tertutup',
              label: 'Akar Tertutup',
              dependsOn: 'akar_dua_garis',
              optional: true,
              ciri: 'Ujung akar tertutup rapat · garis bawah melengkung & menyatu · seperti kulit akar · tidak ada celah terbuka di ujung',
              interpret: 'Karakteristik: ujung akar tertutup, seperti kulit akar yang bertindak sebagai filter. Interpretasi: subjek masih mampu menyelesaikan dan mengelola dorongan-dorongan yang muncul. Menggambarkan kemampuan untuk menyeleksi dan memproses dorongan secara hati-hati sebelum bertindak. Individu memiliki kontrol diri yang baik dan tidak impulsif.'
            },
            {
              image: BASE_AKAR + '4akar%20terbuka.png',
              id: 'akar_terbuka',
              label: 'Akar Terbuka',
              dependsOn: 'akar_dua_garis',
              optional: true,
              ciri: 'Ujung akar terbuka · dua garis tidak menyatu di bawah · ada celah di ujung bawah · seperti corong terbuka',
              interpret: 'Karakteristik: ujung akar terbuka, menerima segala sesuatu tanpa proses seleksi atau penyaringan. Interpretasi: segala sesuatu diterima tanpa proses evaluasi, seolah-olah ada kebutuhan mendesak untuk menerima sebanyak mungkin tanpa mempertimbangkan dampak atau konsekuensinya. Menandakan impulsivitas, kelemahan struktur kepribadian, dan ambisi besar yang tidak diimbangi oleh rasa mampu. Struktur dorongan tidak selektif: impuls langsung menjadi sikap/tindakan. Struktur kepribadian sangat lemah (neurastenik): rentan terhadap tekanan, kelelahan emosional, toleransi rendah terhadap stres, kecemasan berlebihan, dan sulit menyesuaikan diri dengan perubahan. Kesenjangan idealisme vs realitas: merasa diri kurang mampu tetapi memiliki ambisi/aspirasi yang tinggi. Individu bermimpi besar, namun merasa tidak memiliki kapasitas untuk mencapainya.'
            }
          ]
        }
      ]
    }
  ]
});
