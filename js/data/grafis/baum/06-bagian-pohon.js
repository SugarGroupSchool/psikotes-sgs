/* ============================================================
   BAUM — 5. Akar (sesuai buku hal. 137–142)
   ============================================================ */
window.GRAFIS_AUTO_DATA_BAUM_SLIDES = window.GRAFIS_AUTO_DATA_BAUM_SLIDES || [];

const LOGO_PLACEHOLDER = 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png';

window.GRAFIS_AUTO_DATA_BAUM_SLIDES.push({
  id: 'baum-05-akar',
  title: '5. Akar',
  image: LOGO_PLACEHOLDER,
  sections: [
    {
      id: 'akar_items',
      title: 'Pilih sesuai yang digambarkan oleh subjek',
      type: 'checkbox',
      items: [
        {
          id: 'akar_satu_garis',
          label: 'Akar dengan Satu Garis',
          image: LOGO_PLACEHOLDER,   // ← ganti nanti
          interpret: 'Karakteristik: hanya terdiri dari satu garis tunggal. Umumnya ditemukan pada anak-anak usia dini (hingga kelas 2 SD). Menunjukkan aspek primitif, serta adanya dunia magis atau hal-hal tak terlihat yang masih ada dalam pikiran mereka. Pada orang dewasa, ini bisa ditemukan pada mereka dengan kecenderungan kekurangan intelektual atau taraf primitivitas serta kehidupan magis yang masih terpapar secara tidak sadar.'
        },
        {
          id: 'akar_dua_garis',
          label: 'Akar dengan Dua Garis (Normal)',
          image: LOGO_PLACEHOLDER,   // ← ganti nanti
          interpret: 'Jenis ini dibagi lagi menjadi dua berdasarkan bentuknya: akar tertutup dan akar terbuka. Masing-masing mencerminkan cara subjek mengelola dorongan-dorongan internalnya — apakah melalui proses seleksi (tertutup) atau tanpa filter (terbuka).',
          subItems: [
            {
              id: 'akar_tertutup',
              label: 'Akar Tertutup (hal. 141)',
              image: LOGO_PLACEHOLDER,   // ← ganti nanti
              dependsOn: 'akar_dua_garis',
              optional: true,
              interpret: 'Karakteristik: ujung akar tertutup, seperti kulit akar yang bertindak sebagai filter. Interpretasi: subjek masih mampu menyelesaikan dan mengelola dorongan-dorongan yang muncul. Menggambarkan kemampuan untuk menyeleksi dan memproses dorongan secara hati-hati sebelum bertindak. Individu memiliki kontrol diri yang baik dan tidak impulsif.'
            },
            {
              id: 'akar_terbuka',
              label: 'Akar Terbuka (hal. 141–142)',
              image: LOGO_PLACEHOLDER,   // ← ganti nanti
              dependsOn: 'akar_dua_garis',
              optional: true,
              interpret: 'Karakteristik: ujung akar terbuka, menerima segala sesuatu tanpa proses seleksi atau penyaringan. Interpretasi: segala sesuatu diterima tanpa proses evaluasi, seolah-olah ada kebutuhan mendesak untuk menerima sebanyak mungkin tanpa mempertimbangkan dampak atau konsekuensinya. Menandakan impulsivitas, kelemahan struktur kepribadian, dan ambisi besar yang tidak diimbangi oleh rasa mampu. Struktur dorongan tidak selektif: impuls langsung menjadi sikap/tindakan. Struktur kepribadian sangat lemah (neurastenik): rentan terhadap tekanan, kelelahan emosional, toleransi rendah terhadap stres, kecemasan berlebihan, dan sulit menyesuaikan diri dengan perubahan. Kesenjangan idealisme vs realitas: merasa diri kurang mampu tetapi memiliki ambisi/aspirasi yang tinggi. Individu bermimpi besar, namun merasa tidak memiliki kapasitas untuk mencapainya.'
            }
          ]
        }
      ]
    }
  ]
});
