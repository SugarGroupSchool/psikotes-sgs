/* =========================================================
   SUBJECT DATA — Mata Pelajaran
   ========================================================= */

   const ASSET = 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main';

   const SUBJECT_DATA = {
     name: "Tes Subjek",
     description: "Tes kemampuan akademik sesuai mata pelajaran pilihan Anda.",
     instruction: "Pilih salah satu subjek di bawah, lalu kerjakan soal yang muncul.",
     subjects: [
       {
         id: "LAMPUNG",
         name: "Bahasa Lampung",
         time: 2700,
         instruction: `
           <div style="margin-bottom:10px;font-size:1.1em;font-weight:600;">
             SOAL REKRUTMEN GURU BAHASA LAMPUNG
           </div>
           <ul style="text-align:left;margin-left:18px;">
             <li>Jawablah setiap pertanyaan dengan jelas dan sistematis.</li>
             <li>Gunakan contoh konkret atau pengalaman yang relevan jika memungkinkan.</li>
             <li><b>Total waktu pengerjaan: 45 menit.</b></li>
           </ul>
           <div style="margin-top:8px;font-weight:600;color:#278d28;">Selamat mengerjakan!</div>
         `,
         questions: [{
           type: "essay",
           question: `<div style="line-height:1.7;text-align:center;">
             <img src="${ASSET}/lampung.png" loading="lazy" decoding="async" width="1200"
                  alt="Soal Rekrutmen Guru Bahasa Lampung"
                  style="max-width:100%;height:auto;border-radius:8px;">
           </div>`
         }]
       },
       {
         id: "BIOLOGI",
         name: "Biologi",
         time: 2700,
         instruction: `
           <div style="margin-bottom:10px;font-size:1.1em;font-weight:600;">
             SOAL REKRUTMEN GURU BIOLOGI
           </div>
           <ul style="text-align:left;margin-left:18px;">
             <li>Jawablah setiap pertanyaan dengan jelas dan sistematis.</li>
             <li>Gunakan contoh konkret atau pengalaman yang relevan jika memungkinkan.</li>
             <li><b>Total waktu pengerjaan: 45 menit.</b></li>
           </ul>
           <div style="margin-top:8px;font-weight:600;color:#278d28;">Selamat mengerjakan!</div>
         `,
         questions: [{
           type: "essay",
           question: `<div style="line-height:1.7;text-align:center;">
             <img src="${ASSET}/aabiologi.png" loading="lazy" decoding="async" width="1200"
                  alt="Soal Rekrutmen Guru Biologi"
                  style="max-width:100%;height:auto;border-radius:8px;">
           </div>`
         }]
       },
       {
         id: "KIMIA",
         name: "Kimia",
         time: 2700,
         instruction: `
           <div style="margin-bottom:10px;font-size:1.1em;font-weight:600;">
             SOAL REKRUTMEN GURU KIMIA SMA
           </div>
           <ul style="text-align:left;margin-left:18px;">
             <li>Jawablah setiap pertanyaan dengan jelas dan sistematis.</li>
             <li>Gunakan contoh konkret atau pengalaman yang relevan jika memungkinkan.</li>
             <li><b>Total waktu pengerjaan: 45 menit.</b></li>
           </ul>
           <div style="margin-top:8px;font-weight:600;color:#278d28;">Selamat mengerjakan!</div>
         `,
         questions: [{
           type: "essay",
           question: `<div style="line-height:1.7;text-align:center;">
             <img src="${ASSET}/aakimia.png" loading="lazy" decoding="async" width="1200"
                  alt="Soal Rekrutmen Guru Kimia"
                  style="max-width:100%;height:auto;border-radius:8px;">
           </div>`
         }]
       },
       {
         id: "MATH",
         name: "Matematika",
         time: 2700,
         instruction: `
           <div style="margin-bottom:10px;font-size:1.1em;font-weight:600;">
             SOAL REKRUTMEN GURU MATEMATIKA
           </div>
           <ul style="text-align:left;margin-left:18px;">
             <li>Jawablah setiap pertanyaan dengan jelas dan sistematis.</li>
             <li>Gunakan contoh konkret atau pengalaman yang relevan jika memungkinkan.</li>
             <li><b>Total waktu pengerjaan: 45 menit.</b></li>
           </ul>
           <div style="margin-top:8px;font-weight:600;color:#278d28;">Selamat mengerjakan!</div>
         `,
         questions: [{
           type: "essay",
           question: `<div style="line-height:1.7;text-align:center;">
             <img src="${ASSET}/MATHe.png" loading="lazy" decoding="async" width="1200"
                  alt="Soal Rekrutmen Guru Matematika"
                  style="max-width:100%;height:auto;border-radius:8px;">
           </div>`
         }]
       },
       {
         id: "TIK",
         name: "TIK",
         time: 2700,
         instruction: `
           <div style="margin-bottom:10px;font-size:1.1em;font-weight:600;">
             SOAL REKRUTMEN GURU TIK / KOMPUTER
           </div>
           <ul style="text-align:left;margin-left:18px;">
             <li>Jawablah setiap pertanyaan dengan jelas dan sistematis.</li>
             <li>Gunakan contoh konkret atau pengalaman yang relevan jika memungkinkan.</li>
             <li><b>Total waktu pengerjaan: 45 menit.</b></li>
           </ul>
           <div style="margin-top:8px;font-weight:600;color:#278d28;">Selamat mengerjakan!</div>
         `,
         questions: [{
           type: "essay",
           question: `<div style="line-height:1.7;text-align:center;">
             <img src="${ASSET}/aatik.png" loading="lazy" decoding="async" width="1200"
                  alt="Soal Rekrutmen Guru TIK"
                  style="max-width:100%;height:auto;border-radius:8px;">
           </div>`
         }]
       },
       {
         id: "OLAHRAGA",
         name: "Olahraga",
         time: 2700,
         instruction: `
           <div style="margin-bottom:10px;font-size:1.1em;font-weight:600;">
             TES TERTULIS SELEKSI GURU OLAHRAGA SEKOLAH SUGAR GROUP
           </div>
           <ul style="text-align:left;margin-left:18px;">
             <li>Waktu Pengerjaan: 45 menit</li>
             <li>Jawablah setiap pertanyaan dengan jelas dan sistematis.</li>
             <li>Gunakan contoh konkret atau pengalaman yang relevan jika memungkinkan.</li>
           </ul>
           <div style="margin-top:8px;font-weight:600;color:#278d28;">Selamat mengerjakan!</div>
         `,
         questions: [{
           type: "essay",
           question: `<div style="line-height:1.7;text-align:center;">
             <img src="${ASSET}/olahraga.png" loading="lazy" decoding="async" width="1200"
                  alt="Tes Tertulis Seleksi Guru Olahraga"
                  style="max-width:100%;height:auto;border-radius:8px;">
           </div>`
         }]
       },
       {
         id: "VISUALART",
         name: "Visual Art",
         time: 2700,
         instruction: `
           <div style="margin-bottom:10px;font-size:1.1em;font-weight:600;">
             SOAL SELEKSI GURU VISUAL ART
           </div>
           <ul style="text-align:left;margin-left:18px;">
             <li>Jawablah setiap pertanyaan dengan jelas dan sistematis.</li>
             <li>Gunakan contoh konkret atau pengalaman yang relevan jika memungkinkan.</li>
             <li><b>Total waktu pengerjaan: 45 menit.</b></li>
           </ul>
           <div style="margin-top:8px;font-weight:600;color:#278d28;">Selamat mengerjakan!</div>
         `,
         questions: [{
           type: "essay",
           question: `<div style="line-height:1.7;text-align:center;">
             <img src="${ASSET}/art.png" loading="lazy" decoding="async"
                  alt="Soal Seleksi Guru Visual Art"
                  style="display:block;width:100%;max-width:794px;height:auto;margin:0 auto;border-radius:8px;">
           </div>`
         }]
       },
       {
         id: "PRIMARY",
         name: "Primary",
         time: 2700,
         instruction: `
           <div style="margin-bottom:10px;font-size:1.1em;font-weight:600;">
             TES TERTULIS SELEKSI GURU SD (GURU KELAS)
           </div>
           <ul style="text-align:left;margin-left:18px;">
             <li>Jawablah setiap pertanyaan dengan jelas dan sistematis.</li>
             <li>Gunakan contoh konkret atau pengalaman yang relevan jika memungkinkan.</li>
             <li><b>Total waktu pengerjaan: 45 menit.</b></li>
           </ul>
           <div style="margin-top:8px;font-weight:600;color:#278d28;">Selamat mengerjakan!</div>
         `,
         questions: [{
           type: "essay",
           question: `<div style="line-height:1.7;text-align:center;">
             <img src="${ASSET}/bsd.png" loading="lazy" decoding="async"
                  alt="Soal Tes Tertulis Seleksi Guru SD"
                  style="display:block;width:100%;max-width:794px;height:auto;margin:0 auto;border-radius:8px;">
           </div>`
         }]
       },
       {
         id: "KINDERGARTEN",
         name: "Kindergarten",
         time: 2700,
         instruction: `
           <div style="margin-bottom:10px;font-size:1.1em;font-weight:600;">
             TES TERTULIS SELEKSI GURU TAMAN KANAK-KANAK (TK)
           </div>
           <ul style="text-align:left;margin-left:18px;">
             <li>Jawablah setiap pertanyaan dengan jelas dan sistematis.</li>
             <li>Gunakan contoh konkret atau pengalaman yang relevan jika memungkinkan.</li>
             <li><b>Total waktu pengerjaan: 45 menit.</b></li>
           </ul>
           <div style="margin-top:8px;font-weight:600;color:#278d28;">Selamat mengerjakan!</div>
         `,
         questions: [{
           type: "essay",
           question: `<div style="line-height:1.7;text-align:center;">
             <img src="${ASSET}/ctk.png" loading="lazy" decoding="async"
                  alt="Soal Tes Tertulis Seleksi Guru TK"
                  style="display:block;width:100%;max-width:794px;height:auto;margin:0 auto;border-radius:8px;">
           </div>`
         }]
       },
       {
         id: "INDO",
         name: "Bahasa Indonesia",
         time: 2700,
         instruction: `
           <div style="margin-bottom:10px;font-size:1.1em;font-weight:600;">
             TES TERTULIS SELEKSI GURU BAHASA INDONESIA
           </div>
           <ul style="text-align:left;margin-left:18px;">
             <li>Bacalah kasus yang disajikan dan jawablah dengan jelas!</li>
             <li>Gunakan contoh konkret atau pengalaman yang relevan jika memungkinkan.</li>
             <li><b>Total waktu pengerjaan: 45 menit.</b></li>
           </ul>
           <div style="margin-top:8px;font-weight:600;color:#278d28;">Selamat mengerjakan!</div>
         `,
         questions: [{
           type: "essay",
           question: `<div style="line-height:1.7;text-align:center;">
             <img src="${ASSET}/dindo.png" loading="lazy" decoding="async"
                  alt="Soal Tes Tertulis Seleksi Guru Bahasa Indonesia"
                  style="display:block;width:100%;max-width:794px;height:auto;margin:0 auto;border-radius:8px;">
           </div>`
         }]
       },
       {
         id: "FISIKA",
         name: "Fisika",
         time: 2700,
         instruction: `
           <div style="margin-bottom:10px;font-size:1.1em;font-weight:600;">
             TERUNTUK GURU FISIKA YANG BIASANYA LUCU DAN DIRINDUKAN SISWA
           </div>
           <ul style="text-align:left;margin-left:18px;">
             <li>Bagaimana kabar anda pak guru / bu guru? Semoga sebahagia kami yang membagikan lembar kertas ini.</li>
             <li>Oiya, nanti anda akan bertemu pertanyaan-pertanyaan, nah… anda tidak perlu menulis ulang pertanyaannya, maka sebaiknya anda jawab semua, yaa 😊</li>
             <li>Supaya potensi anda muncul maksimal, anda tidak perlu menggunakan HP untuk menjawab pertanyaan ini, yang pasti gunakan tangan dan pena/pulpen/pensil…😁 (eits…. Gabawa? Waduuh)</li>
             <li>Supaya mas dan mbak penilai bisa yakin, dan akhirnya memilih anda untuk diterima, tambahkan berbagai pengalaman yang pernah anda lakukan sesuai pertanyaan yang ada….</li>
             <li>Nah, sampai disini ada pertanyaan? ………….JANGAN! ……kami yang Tanya… kan ini ..tes.. 😊</li>
             <li><b>Total waktu pengerjaan: 45 menit.</b></li>
           </ul>
           <div style="margin-top:8px;font-weight:600;color:#278d28;">Selamat mengerjakan!</div>
           <div style="margin-top:10px;font-size:0.97em;color:#888;font-style:italic;">
             "Cahaya tetap berdifraksi dan berinterferensi, walau Snellius dan Huygens tidak menceritakan Alhazen" ~ Nur
           </div>
         `,
         questions: [{
           type: "essay",
           question: `<div style="line-height:1.7;text-align:center;">
             <img src="${ASSET}/efisika.png" loading="lazy" decoding="async"
                  alt="Soal Seleksi Guru Fisika"
                  style="display:block;width:100%;max-width:794px;height:auto;margin:0 auto;border-radius:8px;">
           </div>`
         }]
       },
       {
         id: "ISLAM",
         name: "Agama Islam",
         time: 2700,
         instruction: `
           <div style="margin-bottom:10px;font-size:1.1em;font-weight:600;">
             SOAL REKRUTMEN GURU AGAMA ISLAM
           </div>
           <ul style="text-align:left;margin-left:18px;">
             <li>Jawablah setiap pertanyaan dengan jelas dan sistematis.</li>
             <li>Gunakan contoh konkret atau pengalaman yang relevan jika memungkinkan.</li>
             <li><b>Total waktu pengerjaan: 45 menit.</b></li>
           </ul>
           <div style="margin-top:8px;font-weight:600;color:#278d28;">Selamat mengerjakan!</div>
         `,
         questions: [{
           type: "essay",
           question: `<div style="line-height:1.7;text-align:center;">
             <img src="${ASSET}/islam.png" loading="lazy" decoding="async" width="1200"
                  alt="Soal Rekrutmen Guru Agama Islam"
                  style="max-width:100%;height:auto;border-radius:8px;">
           </div>`
         }]
       },
       { id: "KRISTEN",    name: "Agama Kristen",   time: 900, questions: [] },
       { id: "KATHOLIK",   name: "Agama Katholik",  time: 900, questions: [] },
       { id: "HINDU",      name: "Agama Hindu",     time: 900, questions: [] },
       { id: "SOSIAL",     name: "Sosial",          time: 900, questions: [] },
       { id: "SEJARAH",    name: "Sejarah",         time: 900, questions: [] },
       { id: "IPA",        name: "IPA",             time: 900, questions: [] },
       {
         id: "KONSELOR",
         name: "KONSELOR",
         time: 900,
         instruction: `
           <div style="margin-bottom:10px; font-size:1.2em; font-weight:700;">
             SOAL REKRUTMEN KONSELOR
           </div>
           <ul style="text-align:left; margin-left:18px; line-height:1.6;">
             <li>Read all questions carefully before answering.</li>
             <li>Answer clearly, systematically, and based on professional understanding.</li>
             <li><b>Total waktu pengerjaan: 15 menit.</b></li>
           </ul>
           <div style="margin-top:10px; font-weight:600; color:#278d28;">Good luck!</div>
         `,
         questions: [{
           type: "essay",
           question: `<div style="line-height:1.7; text-align:center;">
             <img src="${ASSET}/akonselor.png" loading="lazy" decoding="async" width="900"
                  alt="Counselor Recruitment Test"
                  style="max-width:100%; height:auto; border-radius:8px;">
           </div>`
         }]
       },
       {
         id: "INGGRIS",
         name: "Bahasa Inggris",
         time: 2700,
         instruction: `
           <div style="margin-bottom:10px; font-size:1.2em; font-weight:700;">
             SOAL REKRUTMEN GURU BAHASA INGGRIS
           </div>
           <ul style="text-align:left; margin-left:18px; line-height:1.6;">
             <li>Read the passage carefully before answering the questions.</li>
             <li>Answer all questions clearly and systematically.</li>
             <li><b>Total waktu pengerjaan: 45 menit.</b></li>
           </ul>
           <div style="margin-top:10px; font-weight:600; color:#278d28;">Good luck!</div>
         `,
         questions: [{
           type: "essay",
           question: `<div style="line-height:1.7; text-align:center;">
             <img src="${ASSET}/1english.png" loading="lazy" decoding="async" width="900"
                  alt="English Recruitment Page 1"
                  style="max-width:100%; height:auto; margin-bottom:30px; border-radius:8px;">
             <img src="${ASSET}/2english.png" loading="lazy" decoding="async" width="900"
                  alt="English Recruitment Page 2"
                  style="max-width:100%; height:auto; margin-bottom:30px; border-radius:8px;">
             <img src="${ASSET}/3english.png" loading="lazy" decoding="async" width="900"
                  alt="English Recruitment Page 3"
                  style="max-width:100%; height:auto; border-radius:8px;">
           </div>`
         }]
       }
     ]
   };
   
   console.log('[DATA-SUBJECT] ✓ Loaded — ' + SUBJECT_DATA.subjects.length + ' subjek');