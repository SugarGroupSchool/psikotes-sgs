/* ============================================================
   BAUM — 6. Pangkal Batang / Stambasis (hal. 3.5.6.2)
   ============================================================ */
window.GRAFIS_AUTO_DATA_BAUM_SLIDES = window.GRAFIS_AUTO_DATA_BAUM_SLIDES || [];

/* 🖼️ Placeholder gambar — ganti satu per satu nanti */
const IMG_STAMBASIS = 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png';

window.GRAFIS_AUTO_DATA_BAUM_SLIDES.push({
  id: 'baum-06-stambasis',
  title: '6. Pangkal Batang (Stambasis)',
  image: IMG_STAMBASIS,
  sections: [
    {
      id: 'stambasis_items',
      title: 'Pilih sesuai yang digambarkan oleh subjek',
      type: 'checkbox',
      items: [
        {
          image: 'https://raw.githubusercontent.com/SugarGroupSchool/psikotes-sgs/refs/heads/main/js/data/grafis/assets/1-pangkal%20nempel.png'
          id: 'pangkal_batas_kertas',
          label: 'Posisi Pangkal Batang di Batas Kertas (Garis Tanah)',
          interpret: 'Menggambar pangkal batang tepat di batas bawah kertas (yang dianggap sebagai tanah) memiliki arti berbeda tergantung usia subjek. Pada anak-anak (usia 10–12 tahun): hal ini wajar — menandakan tahap perkembangan kreativitas dan imajinasi mereka. Secara simbolis, anak merespons ruang sosial yang terwakili oleh kertas itu sendiri. Pada orang dewasa: jika pangkal batang digambar berada di bagian bawah kertas, ini mengindikasikan sikap yang regresif (kembali ke perilaku masa kanak-kanak) dan menunjukkan adanya keterhambatan dalam perkembangan intelektual serta kematangan emosional.',
          subItems: [
            {
              image: IMG_STAMBASIS,   // ← GANTI: contoh anak 10-12 tahun
              id: 'anak_wajar',
              label: 'Pada Anak-anak (usia 10–12 tahun) — Wajar',
              dependsOn: 'pangkal_batas_kertas',
              optional: true,
              interpret: 'Menggambar pangkal batang tepat di batas bawah kertas (yang dianggap sebagai tanah) adalah hal yang wajar pada anak usia 10–12 tahun. Ini menandakan tahap perkembangan kreativitas dan imajinasi mereka. Secara simbolis, anak merespons ruang sosial yang terwakili oleh kertas itu sendiri.'
            },
            {
              image: IMG_STAMBASIS,   // ← GANTI: contoh orang dewasa
              id: 'dewasa_regresif',
              label: 'Pada Orang Dewasa — Indikasi Regresif',
              dependsOn: 'pangkal_batas_kertas',
              optional: true,
              interpret: 'Jika orang dewasa menggambar dengan posisi pangkal batang berada di bagian bawah kertas, ini mengindikasikan sikap yang regresif (kembali ke perilaku masa kanak-kanak) dan menunjukkan adanya keterhambatan dalam perkembangan intelektual serta kematangan emosional.'
            }
          ]
        },
        {
          image: IMG_STAMBASIS,   // ← GANTI: gambar pangkal lebar di kiri
          id: 'lebar_kiri',
          label: 'Lebar Pangkal Batang di Sisi Kiri',
          interpret: 'Jika pangkal batang lebih lebar di sisi kiri, ini mengindikasikan adanya hambatan atau perasaan terhambat pada subjek. Sisi kiri melambangkan masa lampau dan penekanan pada hal-hal yang telah terjadi sebelumnya. Hal ini menunjukkan upaya subjek untuk memperkuat diri dari pengalaman negatif di masa lalu. Perlu diperhatikan lebih lanjut terkait konteks ikatan emosional dengan ibu atau figur yang menggantikan peran ibu — subjek masih terikat secara emosional pada peristiwa yang melibatkan figur tersebut di masa lalu. Mengapa ibu? Sejak awal kehidupan, hubungan bayi dan ibu sangat kuat karena ketergantungan fisik, emosional, dan psikologis. Ibu adalah sumber utama kasih sayang dan perawatan di tahun-tahun formatif pertama (sesuai teori Freud). Peran ayah baru mulai menonjol saat anak berusia 3–4 tahun pada fase phallus.'
        },
        {
          image: IMG_STAMBASIS,   // ← GANTI: gambar pangkal lebar di kedua sisi
          id: 'lebar_kedua_sisi',
          label: 'Lebar Pangkal Batang di Kedua Sisi (Kanan & Kiri)',
          interpret: 'Jika pangkal batang lebar di kedua sisi, ini mencerminkan adanya hambatan emosional terhadap masa lalu dan masa depan, yang menandakan rasa terhambat secara menyeluruh. Anak dengan gambaran seperti ini cenderung terjebak dalam situasi diam, enggan untuk melangkah maju atau mundur, serta mengalami kesulitan belajar akibat rasa takut akan kegagalan. Dampak perilaku: terlihat dari kesulitan belajar yang mereka alami, di mana rasa takut gagal membuat mereka enggan maju. Kinerja sekolah menjadi kurang optimal. Kondisi ini tidak selalu mencerminkan kurangnya kecerdasan, melainkan adanya hambatan emosional yang memengaruhi kemampuan mereka.'
        }
      ]
    }
    // Bagian "Bentuk Batang (Tambahan — 3.5.6.3)" telah dihapus sepenuhnya dari sini
  ]
});
