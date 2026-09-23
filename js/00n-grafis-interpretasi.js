/* ============================================================
   js/00n-grafis-interpretasi.js — Form Interpretasi Grafis
   ------------------------------------------------------------
   URL TRIGGER: ?grafindo=1&n=<nama>&p=<posisi>
   - Isi DAP/BAUM/HTP items
   - Skor 7 kategori → narrative AUTO
   - Tingkat Rekomendasi AUTO
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     KONFIGURASI
     ============================================================ */
  const ASSESSOR_LIST = ['NUG', 'GUN', 'DED', 'DEF', 'NET', 'YAC', 'ALF'];

  // 7 kategori kesimpulan
  const CATEGORIES = [
    'KEMAMPUAN BERPIKIR & PROBLEM SOLVING',
    'EMPATHY, INTERPERSONAL SKILL & TEAMWORK',
    'STABILITAS EMOSI & KONTROL IMPULS',
    'MOTIVATION & ACHIEVEMENT DRIVE',
    'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY',
    'INTEGRITY & RULE COMPLIANCE',
    'TEACHING CREATIVITY'
  ];

  // Narrative auto per kategori per skor (1-4)
  const NARRATIVES = {
    0: {
      1: 'Data menunjukkan kemampuan berpikir dan problem solving yang sangat terbatas. Subjek cenderung mengalami kesulitan dalam memahami situasi kompleks, mengambil keputusan, dan menemukan solusi yang efektif. Diperlukan pendampingan intensif dan pengembangan terstruktur.',
      2: 'Data menunjukkan kemampuan berpikir dan problem solving yang masih perlu dikembangkan. Terdapat beberapa modal positif seperti pemahaman empiris dan adaptasi dasar, namun fokus yang sempit, kurangnya insight, dan kesulitan mengambil keputusan dapat menghambat efektivitas.',
      3: 'Data menunjukkan kemampuan berpikir dan problem solving yang cukup baik. Subjek mampu memahami situasi secara realistis, menyinkronkan pengalaman masa lalu dengan kebutuhan masa depan, serta beradaptasi terhadap lingkungan. Namun efektivitas dapat menurun pada situasi ambigu atau yang membutuhkan pemahaman menyeluruh.',
      4: 'Data menunjukkan kemampuan berpikir dan problem solving yang sangat baik. Subjek mampu menganalisis situasi secara menyeluruh, mengambil keputusan tepat, dan mengembangkan solusi efektif bahkan dalam kondisi ambigu atau kompleks.'
    },
    1: {
      1: 'Data menunjukkan kemampuan interpersonal yang sangat terbatas. Subjek cenderung mengalami hambatan besar dalam membangun relasi, bekerja sama, dan memahami perspektif orang lain. Diperlukan pengembangan intensif pada aspek sosial-emosional.',
      2: 'Data menunjukkan kemampuan interpersonal dasar yang tersedia, namun kedalaman relasi, sensitivitas terhadap perspektif orang lain, dan fleksibilitas kerja sama masih perlu diperkuat. Terdapat modal positif seperti keramahan dan dukungan keluarga.',
      3: 'Data menunjukkan kemampuan interpersonal yang cukup baik. Subjek mampu membangun hubungan yang sehat, bekerja sama dalam tim, dan menunjukkan empati. Masih terdapat ruang untuk penguatan pada aspek sensitivitas dan fleksibilitas.',
      4: 'Data menunjukkan kemampuan interpersonal yang sangat baik. Subjek mampu membangun relasi yang dalam, berempati secara tulus, serta menjadi penggerak kerja sama tim yang efektif dan harmonis.'
    },
    2: {
      1: 'Data menunjukkan stabilitas emosi dan kontrol impuls yang sangat terbatas. Subjek mudah mengalami kecemasan, ketegangan, dan kesulitan mengendalikan diri di bawah tekanan. Diperlukan intervensi dan pendampingan pada aspek regulasi emosi.',
      2: 'Data menunjukkan adanya kontrol emosional dan kemampuan adaptasi, namun kestabilan belum konsisten. Terdapat indikator kecemasan, ketegangan internal, perasaan insecure, mudah marah, serta penumpukan emosi yang berpotensi terganggu saat berada dalam tekanan.',
      3: 'Data menunjukkan stabilitas emosi dan kontrol impuls yang cukup baik. Subjek mampu menampilkan ketenangan dan keseimbangan secara eksternal serta mengelola stres dengan baik. Perlu penguatan konsistensi dalam situasi yang penuh tekanan.',
      4: 'Data menunjukkan stabilitas emosi dan kontrol impuls yang sangat baik. Subjek tetap tenang, terkontrol, dan mampu mengambil keputusan rasional bahkan di bawah tekanan tinggi.'
    },
    3: {
      1: 'Data menunjukkan motivasi dan dorongan pencapaian yang sangat rendah. Subjek cenderung pasif, mudah menyerah, dan kurang memiliki inisiatif. Diperlukan intervensi untuk membangun kembali dorongan intrinsik.',
      2: 'Data menunjukkan motivasi dan dorongan pencapaian yang masih perlu diarahkan. Terdapat energi dan kemauan, namun kurangnya arah tujuan dan kesulitan mengambil keputusan dapat menghambat konsistensi.',
      3: 'Data menunjukkan motivasi dan dorongan pencapaian yang cukup kuat. Subjek memiliki kemauan, ketekunan, serta keinginan mencapai standar tinggi. Perlu diarahkan agar motivasi menjadi terstruktur, realistis, dan tidak terlalu berorientasi pada kontrol atau pengakuan eksternal.',
      4: 'Data menunjukkan motivasi dan dorongan pencapaian yang sangat kuat. Subjek memiliki semangat tinggi, tidak mudah menyerah, dan mampu menetapkan serta mencapai target secara konsisten dan realistis.'
    },
    4: {
      1: 'Data menunjukkan fleksibilitas, adaptasi, dan learning agility yang sangat terbatas. Subjek cenderung kaku, sulit beradaptasi dengan perubahan, dan lambat dalam mempelajari hal baru. Diperlukan pendampingan khusus.',
      2: 'Data menunjukkan kemampuan adaptasi dasar, namun fleksibilitas masih terhambat oleh rasa tidak aman, kesulitan menentukan pilihan, dan kurangnya arah tujuan. Membutuhkan struktur dan lingkungan yang memberikan kepastian.',
      3: 'Data menunjukkan kemampuan adaptasi dan learning agility yang cukup baik. Subjek mudah menyesuaikan diri pada hal nyata, mampu menghubungkan pengalaman masa lalu dengan masa depan, serta merespons perubahan dengan fleksibilitas. Masih membutuhkan struktur dan tujuan jelas untuk berkembang optimal.',
      4: 'Data menunjukkan fleksibilitas, adaptasi, dan learning agility yang sangat baik. Subjek cepat menyesuaikan diri pada situasi baru, proaktif mempelajari hal baru, dan mampu bertahan di lingkungan yang dinamis.'
    },
    5: {
      1: 'Data menunjukkan integritas dan kepatuhan aturan yang sangat lemah. Subjek cenderung mengabaikan norma, sulit menerima otoritas, dan rentan melanggar aturan. Diperlukan pendampingan intensif pada aspek kontrol moral.',
      2: 'Data menunjukkan dasar kontrol moral cukup baik, namun kepatuhan terhadap aturan dan penerimaan otoritas perlu diverifikasi melalui perilaku aktual. Terdapat indikator menentang kekuasaan, mempertahankan otonomi, dan sifat keras hati.',
      3: 'Data menunjukkan integritas dan kepatuhan aturan yang cukup baik. Subjek memahami norma, menunjukkan tanggung jawab, dan mampu bekerja dalam sistem. Perlu penguatan pada aspek penerimaan otoritas dan fleksibilitas terhadap aturan.',
      4: 'Data menunjukkan integritas dan kepatuhan aturan yang sangat baik. Subjek menjunjung tinggi norma, patuh pada otoritas secara sehat, serta menjadi teladan dalam tanggung jawab dan etika kerja.'
    },
    6: {
      1: 'Data menunjukkan potensi kreativitas yang sangat terbatas. Subjek kurang memiliki rasa ingin tahu, ide baru, dan inisiatif kreatif. Diperlukan stimulasi dan pengembangan terstruktur.',
      2: 'Data menunjukkan adanya potensi kreativitas, namun masih belum stabil. Daya cipta yang belum kokoh, kurangnya arah tujuan, dan fokus yang sempit dapat menghambat pengembangan kreativitas.',
      3: 'Data menunjukkan potensi kreativitas yang cukup baik. Subjek memiliki rasa ingin tahu, keinginan mencoba pengalaman baru, energi aktif, serta dorongan memberi pengaruh. Kreativitas masih perlu diarahkan agar relevan dengan tujuan pembelajaran.',
      4: 'Data menunjukkan kreativitas yang sangat baik. Subjek memiliki daya cipta tinggi, aktif mencari ide baru, dan mampu mengembangkan metode inovatif yang efektif dan relevan dengan kebutuhan.'
    }
  };

  // Rekomendasi akhir dari rata-rata
  const RECOMMENDATION_LEVELS = [
    { min: 3.5, label: 'Highly Recommended',        emoji: '🌟', color: [22, 101, 52] },
    { min: 2.5, label: 'Recommended',               emoji: '✅', color: [22, 163, 74] },
    { min: 1.5, label: 'Fairly Recommended / Dipertimbangkan dengan Catatan', emoji: '⚠️', color: [217, 119, 6] },
    { min: 0,   label: 'Not Recommended',           emoji: '❌', color: [220, 38, 38] }
  ];

  function getRecommendation(avg) {
    for (const r of RECOMMENDATION_LEVELS) {
      if (avg >= r.min) return r;
    }
    return RECOMMENDATION_LEVELS[RECOMMENDATION_LEVELS.length - 1];
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function cleanForPDF(s) {
    return String(s || '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim();
  }

  /* ============================================================
     MODAL LINK UNTUK ADMIN
     ============================================================ */
  window.openGrafisInterpLink = function (candidateName, candidatePosition) {
    const base = window.location.origin + window.location.pathname;
    const url = base + '?grafindo=1'
      + '&n=' + encodeURIComponent(candidateName)
      + '&p=' + encodeURIComponent(candidatePosition || '');

    const old = document.getElementById('giLinkModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'giLinkModal';
    modal.style.cssText = `position: fixed; inset: 0; z-index: 2147483647;
      background: rgba(10,20,35,.85); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; padding: 20px;
      font-family: Inter, system-ui, -apple-system, sans-serif;`;

    modal.innerHTML = `
      <div style="width: min(560px, 100%); background: #fff; border-radius: 22px;
        overflow: hidden; box-shadow: 0 30px 90px rgba(0,0,0,.5);">
        <div style="padding: 24px 26px; background: linear-gradient(135deg, #6d28d9, #a855f7); color: #fff;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; opacity: .85; margin-bottom: 6px;">
            INTERPRETASI GRAFIS
          </div>
          <div style="font-size: 20px; font-weight: 900;">🧠 Buka Form Interpretasi</div>
        </div>
        <div style="padding: 22px 26px;">
          <div style="padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0;
            border-radius: 12px; margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1px; margin-bottom: 6px;">
              KANDIDAT
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #1e293b;">${escapeHtml(candidateName)}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
              💼 ${escapeHtml(candidatePosition || '(tanpa posisi)')}
            </div>
          </div>

          <div style="font-size: 12px; color: #475569; line-height: 1.65; margin-bottom: 14px;">
            Klik <b>Buka Form</b> untuk mengisi interpretasi DAP / BAUM / HTP.<br>
            Anda juga bisa copy link di bawah untuk assessor lain.
          </div>

          <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1px; margin-bottom: 6px;">
            LINK FORM
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <input type="text" id="giLinkInput" readonly value="${url}"
              style="flex: 1; padding: 12px 14px; background: #f8fafc;
                border: 2px solid #e2e8f0; border-radius: 10px;
                font-family: 'Courier New', monospace; font-size: 11px; color: #334155;
                outline: none; box-sizing: border-box;">
            <button id="giCopyBtn" style="padding: 12px 20px; border: 0; border-radius: 10px;
              background: linear-gradient(135deg, #16a34a, #059669); color: #fff;
              font-family: inherit; font-size: 13px; font-weight: 800; cursor: pointer;">
              📋 Copy
            </button>
          </div>

          <div style="display: flex; gap: 10px;">
            <button id="giOpenBtn" style="flex: 2; padding: 14px; border: 0; border-radius: 12px;
              background: linear-gradient(135deg, #6d28d9, #a855f7); color: #fff;
              font-family: inherit; font-size: 14px; font-weight: 900; cursor: pointer;
              box-shadow: 0 10px 24px rgba(109,40,217,.28);">
              🧠 Buka Form Interpretasi
            </button>
            <button id="giCloseBtn" style="flex: 1; padding: 14px; border: 0; border-radius: 12px;
              background: #f1f5f9; color: #475569;
              font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer;">
              Tutup
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('giCopyBtn').onclick = () => {
      try {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(() => {
            const btn = document.getElementById('giCopyBtn');
            btn.textContent = '✅ Tersalin';
            setTimeout(() => btn.textContent = '📋 Copy', 1500);
          });
        }
      } catch (e) {}
    };
    document.getElementById('giOpenBtn').onclick = () => window.open(url, '_blank');
    document.getElementById('giCloseBtn').onclick = () => modal.remove();
  };

  /* ============================================================
     CEK MODE
     ============================================================ */
  const urlObj = new URL(window.location.href);
  const isGrafisMode = urlObj.searchParams.get('grafindo') === '1';

  if (!isGrafisMode) return;

  const candidateName     = urlObj.searchParams.get('n') || '(tanpa nama)';
  const candidatePosition = urlObj.searchParams.get('p') || '';

  console.log('[GRAFIS-INTERP] Mode aktif —', { candidateName, candidatePosition });

  /* ============================================================
     STATE
     ============================================================ */
  const state = {
    dap:   [{ text: '' }],
    baum:  [{ text: '' }],
    htp:   [{ text: '' }],
    scores: {}  // { catIdx: 1..4 }
  };

  /* ============================================================
     BUILD UI
     ============================================================ */
  function buildUI() {
    const root = document.createElement('div');
    root.id = 'grafindoRoot';
    root.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483647;
      background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
      overflow-y: auto; font-family: Inter, system-ui, -apple-system, sans-serif;
      padding: 20px;
    `;
    document.body.appendChild(root);

    root.innerHTML = `
      <div style="max-width: 880px; margin: 0 auto 40px;">

        <!-- HEADER -->
        <div style="background: linear-gradient(135deg, #6d28d9, #a855f7);
          border-radius: 20px 20px 0 0; padding: 26px 30px;
          display: flex; align-items: center; gap: 16px;">
          <div style="width: 60px; height: 60px; flex: 0 0 60px; background: #fff; border-radius: 16px;
            display: grid; place-items: center; padding: 8px; overflow: hidden;">
            <img src="${(typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO) || 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png'}"
              alt="Logo" style="width: 100%; height: 100%; object-fit: contain;"
              onerror="this.style.display='none';this.parentElement.textContent='SGS';">
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: rgba(255,255,255,.75); margin-bottom: 4px;">
              SUGAR GROUP SCHOOLS
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #fff;">
              🧠 Interpretasi Grafis (DAP / BAUM / HTP)
            </h1>
          </div>
        </div>

        <!-- KANDIDAT -->
        <div style="background: #fff; padding: 22px 30px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1.5px; margin-bottom: 10px;">
            KANDIDAT
          </div>
          <div style="font-size: 20px; font-weight: 900; color: #1e293b; margin-bottom: 4px;">
            ${escapeHtml(candidateName)}
          </div>
          <div style="font-size: 13px; color: #64748b;">
            💼 ${escapeHtml(candidatePosition || '(tanpa posisi)')}
          </div>
        </div>

        <!-- FORM -->
        <form id="giForm" style="background: #fff; padding: 26px 30px 30px; border-radius: 0 0 20px 20px;
          box-shadow: 0 20px 50px rgba(15,23,42,.08);">

          <!-- ASSESSOR -->
          <div style="margin-bottom: 24px;">
            <label style="display: block; font-size: 12px; font-weight: 800; color: #475569;
              letter-spacing: 1px; margin-bottom: 8px;">
              NAMA ASSESSOR <span style="color: #dc2626;">*</span>
            </label>
            <select id="giAssessor" required
              style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px;
                font-size: 15px; font-family: inherit; background: #fff; outline: none; cursor: pointer;">
              <option value="">— Pilih Assessor —</option>
              ${ASSESSOR_LIST.map(n => `<option value="${n}">${n}</option>`).join('')}
            </select>
          </div>

          <!-- DAP -->
          <div style="margin-bottom: 24px; padding: 18px 20px; background: #f8fafc;
            border: 2px solid #e2e8f0; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;
              margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div style="font-size: 14px; font-weight: 900; color: #1e293b;">
                🎨 DAP — Draw A Person
              </div>
              <button type="button" class="gi-add-btn" data-target="dap"
                style="padding: 6px 12px; border: 0; border-radius: 8px;
                  background: #a855f7; color: #fff; font-family: inherit;
                  font-size: 11px; font-weight: 800; cursor: pointer;">
                + Tambah Item
              </button>
            </div>
            <div id="dap-list"></div>
          </div>

          <!-- BAUM -->
          <div style="margin-bottom: 24px; padding: 18px 20px; background: #f8fafc;
            border: 2px solid #e2e8f0; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;
              margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div style="font-size: 14px; font-weight: 900; color: #1e293b;">
                🌳 BAUM — Tree Test
              </div>
              <button type="button" class="gi-add-btn" data-target="baum"
                style="padding: 6px 12px; border: 0; border-radius: 8px;
                  background: #a855f7; color: #fff; font-family: inherit;
                  font-size: 11px; font-weight: 800; cursor: pointer;">
                + Tambah Item
              </button>
            </div>
            <div id="baum-list"></div>
          </div>

          <!-- HTP -->
          <div style="margin-bottom: 24px; padding: 18px 20px; background: #f8fafc;
            border: 2px solid #e2e8f0; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;
              margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div style="font-size: 14px; font-weight: 900; color: #1e293b;">
                🏠 HTP — House Tree Person
              </div>
              <button type="button" class="gi-add-btn" data-target="htp"
                style="padding: 6px 12px; border: 0; border-radius: 8px;
                  background: #a855f7; color: #fff; font-family: inherit;
                  font-size: 11px; font-weight: 800; cursor: pointer;">
                + Tambah Item
              </button>
            </div>
            <div id="htp-list"></div>
          </div>

          <!-- KESIMPULAN -->
          <div style="margin-bottom: 24px; padding: 20px 22px; background: #f0f9ff;
            border: 2px solid #bae6fd; border-radius: 16px;">
            <div style="font-size: 14px; font-weight: 900; color: #075985; margin-bottom: 6px;">
              📊 KESIMPULAN (Auto-Generate)
            </div>
            <div style="font-size: 12px; color: #0369a1; margin-bottom: 16px; line-height: 1.6;">
              Isi <b>skor 1-4</b> untuk tiap kategori. Narrative akan otomatis ditulis oleh sistem.
            </div>
            <div id="cat-list"></div>

            <!-- Rekomendasi Akhir -->
            <div id="reco-box" style="margin-top: 18px; padding: 16px 18px;
              background: #fff; border: 2px solid #e2e8f0; border-radius: 12px;
              transition: all .25s ease;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                  <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1.5px; margin-bottom: 4px;">
                    RATA-RATA
                  </div>
                  <div id="recoAvg" style="font-size: 28px; font-weight: 900; color: #1e293b; line-height: 1;">
                    —,——
                  </div>
                  <div id="recoProgress" style="font-size: 11.5px; color: #64748b; margin-top: 4px;">
                    0 dari ${CATEGORIES.length} kategori
                  </div>
                </div>
                <div id="recoChip" style="padding: 10px 18px; border-radius: 12px;
                  background: #f1f5f9; border: 1px solid #cbd5e1;
                  font-size: 12px; font-weight: 900; color: #64748b; white-space: nowrap;">
                  ⏳ Menunggu input
                </div>
              </div>
            </div>
          </div>

          <!-- SUBMIT -->
          <button type="submit" id="giSubmitBtn"
            style="width: 100%; padding: 16px; border: 0; border-radius: 14px;
              background: linear-gradient(135deg, #6d28d9, #a855f7);
              color: #fff; font-size: 16px; font-weight: 900; font-family: inherit;
              cursor: pointer; box-shadow: 0 10px 24px rgba(109,40,217,.28);">
            📤 Kirim Interpretasi Grafis
          </button>

          <div style="margin-top: 14px; text-align: center; font-size: 11.5px; color: #94a3b8;">
            PDF akan otomatis dibuat & terkirim ke panel admin.
          </div>
        </form>
      </div>
    `;

    // Render DAP/BAUM/HTP
    renderItemList('dap');
    renderItemList('baum');
    renderItemList('htp');

    // Render kategori
    renderCategories();

    // Attach add buttons
    root.querySelectorAll('.gi-add-btn').forEach(btn => {
      btn.onclick = () => {
        const target = btn.getAttribute('data-target');
        state[target].push({ text: '' });
        renderItemList(target);
      };
    });

    document.getElementById('giForm').onsubmit = handleSubmit;
  }

  /* ============================================================
     RENDER ITEM LIST (DAP/BAUM/HTP)
     ============================================================ */
  function renderItemList(target) {
    const container = document.getElementById(target + '-list');
    if (!container) return;

    container.innerHTML = state[target].map((item, idx) => `
      <div class="gi-item" data-target="${target}" data-idx="${idx}"
        style="display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start;">
        <div style="
          width: 32px; height: 32px; flex: 0 0 32px; margin-top: 4px;
          display: grid; place-items: center;
          background: #ede9fe; color: #6d28d9;
          font-size: 12px; font-weight: 900; border-radius: 8px;
        ">${idx + 1}</div>
        <textarea
          class="gi-item-input" data-target="${target}" data-idx="${idx}"
          placeholder="Tulis interpretasi item ${idx + 1}..."
          rows="2"
          style="flex: 1; padding: 10px 12px;
            border: 2px solid #e2e8f0; border-radius: 10px;
            font-family: inherit; font-size: 13.5px; line-height: 1.5;
            outline: none; resize: vertical; box-sizing: border-box;
            transition: border-color .15s ease;"
        >${escapeHtml(item.text)}</textarea>
        <button type="button" class="gi-remove-btn" data-target="${target}" data-idx="${idx}"
          style="width: 32px; height: 32px; flex: 0 0 32px; margin-top: 4px;
            border: 1.5px solid #fca5a5; background: #fff; color: #dc2626;
            border-radius: 8px; cursor: pointer; font-size: 14px;
            font-family: inherit; font-weight: 900; padding: 0;"
          title="Hapus item">×</button>
      </div>
    `).join('');

    // Attach events
    container.querySelectorAll('.gi-item-input').forEach(ta => {
      ta.addEventListener('input', (e) => {
        const t = e.target.getAttribute('data-target');
        const i = Number(e.target.getAttribute('data-idx'));
        state[t][i].text = e.target.value;
        e.target.style.borderColor = e.target.value.trim() ? '#86efac' : '#e2e8f0';
      });
      ta.addEventListener('focus', (e) => {
        e.target.style.borderColor = '#a855f7';
        e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,.12)';
      });
      ta.addEventListener('blur', (e) => {
        e.target.style.boxShadow = 'none';
        e.target.style.borderColor = e.target.value.trim() ? '#86efac' : '#e2e8f0';
      });
    });

    container.querySelectorAll('.gi-remove-btn').forEach(btn => {
      btn.onclick = () => {
        const t = btn.getAttribute('data-target');
        const i = Number(btn.getAttribute('data-idx'));
        if (state[t].length <= 1) {
          // Reset saja
          state[t][0].text = '';
        } else {
          state[t].splice(i, 1);
        }
        renderItemList(t);
      };
    });
  }

  /* ============================================================
     RENDER KATEGORI + AUTO NARRATIVE
     ============================================================ */
  function renderCategories() {
    const container = document.getElementById('cat-list');
    if (!container) return;

    container.innerHTML = CATEGORIES.map((cat, idx) => `
      <div class="gi-cat" data-idx="${idx}"
        style="margin-bottom: 12px; padding: 14px 16px; background: #fff;
          border: 1.5px solid #e2e8f0; border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;
          gap: 12px; flex-wrap: wrap; margin-bottom: 10px;">
          <div style="flex: 1; min-width: 200px; font-size: 13px; font-weight: 900; color: #1e293b;
            line-height: 1.4;">
            ${idx + 1}. ${escapeHtml(cat)}
          </div>
          <div style="display: flex; align-items: center; gap: 6px; flex: 0 0 auto;">
            <select class="gi-cat-score" data-idx="${idx}"
              style="padding: 8px 12px; border: 2px solid #e2e8f0; border-radius: 8px;
                font-family: inherit; font-size: 13px; font-weight: 800;
                color: #1e293b; background: #fff; cursor: pointer; outline: none;">
              <option value="">-- Skor --</option>
              <option value="1">1 — Sangat Kurang</option>
              <option value="2">2 — Kurang</option>
              <option value="3">3 — Cukup</option>
              <option value="4">4 — Baik</option>
            </select>
            <span style="font-size: 11px; color: #94a3b8; font-weight: 800;">/4</span>
          </div>
        </div>
        <div class="gi-cat-narrative" data-idx="${idx}"
          style="padding: 10px 12px; background: #f8fafc;
            border: 1px dashed #cbd5e1; border-radius: 10px;
            font-size: 12.5px; line-height: 1.65; color: #64748b;
            font-style: italic; transition: all .25s ease;">
          Pilih skor di atas untuk melihat narrative otomatis.
        </div>
      </div>
    `).join('');

    // Attach score change
    container.querySelectorAll('.gi-cat-score').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        const val = Number(e.target.value);
        if (val >= 1 && val <= 4) {
          state.scores[idx] = val;
        } else {
          delete state.scores[idx];
        }
        updateNarrative(idx);
        updateRecommendation();
      });
    });
  }

  function updateNarrative(idx) {
    const narrativeEl = document.querySelector(`.gi-cat-narrative[data-idx="${idx}"]`);
    if (!narrativeEl) return;

    const val = state.scores[idx];
    if (!val) {
      narrativeEl.textContent = 'Pilih skor di atas untuk melihat narrative otomatis.';
      narrativeEl.style.color = '#64748b';
      narrativeEl.style.background = '#f8fafc';
      narrativeEl.style.borderColor = '#cbd5e1';
      narrativeEl.style.fontStyle = 'italic';
      return;
    }

    const txt = (NARRATIVES[idx] && NARRATIVES[idx][val]) || '-';
    narrativeEl.textContent = txt;
    narrativeEl.style.fontStyle = 'normal';
    narrativeEl.style.color = '#1e293b';
    narrativeEl.style.background = '#f0fdf4';
    narrativeEl.style.borderColor = '#86efac';
  }

  function updateRecommendation() {
    const filled = Object.keys(state.scores).length;
    const total = CATEGORIES.length;

    const avgEl = document.getElementById('recoAvg');
    const progEl = document.getElementById('recoProgress');
    const chipEl = document.getElementById('recoChip');
    const boxEl = document.getElementById('reco-box');

    if (!avgEl || !chipEl || !boxEl) return;

    if (filled === total) {
      const vals = Object.values(state.scores);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const rec = getRecommendation(avg);
      const avgStr = avg.toFixed(2).replace('.', ',');

      avgEl.textContent = avgStr;
      progEl.textContent = `${filled} dari ${total} kategori terisi`;
      chipEl.textContent = rec.emoji + ' ' + rec.label;
      chipEl.style.background = `rgba(${rec.color[0]}, ${rec.color[1]}, ${rec.color[2]}, .12)`;
      chipEl.style.border = `1px solid rgba(${rec.color[0]}, ${rec.color[1]}, ${rec.color[2]}, .4)`;
      chipEl.style.color = `rgb(${rec.color[0]}, ${rec.color[1]}, ${rec.color[2]})`;
      chipEl.style.whiteSpace = 'normal';
      boxEl.style.border = `2px solid rgba(${rec.color[0]}, ${rec.color[1]}, ${rec.color[2]}, .35)`;
      boxEl.style.background = `linear-gradient(135deg, #fff, rgba(${rec.color[0]}, ${rec.color[1]}, ${rec.color[2]}, .04))`;
    } else {
      const vals = Object.values(state.scores);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      avgEl.textContent = vals.length ? avg.toFixed(2).replace('.', ',') : '—,——';
      progEl.textContent = `${filled} dari ${total} kategori terisi`;
      chipEl.textContent = `⏳ ${filled}/${total}`;
      chipEl.style.background = '#fef3c7';
      chipEl.style.border = '1px solid #fde68a';
      chipEl.style.color = '#92400e';
      chipEl.style.whiteSpace = 'nowrap';
      boxEl.style.border = '2px solid #e2e8f0';
      boxEl.style.background = '#fff';
    }
  }

  /* ============================================================
     SUBMIT
     ============================================================ */
  async function handleSubmit(e) {
    e.preventDefault();

    const assessor = document.getElementById('giAssessor').value.trim();
    if (!assessor) { alert('Pilih assessor dulu.'); return; }

    // Cek item terisi
    const dapValid = state.dap.filter(x => x.text.trim());
    const baumValid = state.baum.filter(x => x.text.trim());
    const htpValid = state.htp.filter(x => x.text.trim());

    if (!dapValid.length && !baumValid.length && !htpValid.length) {
      alert('Isi minimal 1 item DAP/BAUM/HTP.'); return;
    }

    if (Object.keys(state.scores).length !== CATEGORIES.length) {
      alert('Isi skor untuk semua 7 kategori kesimpulan.'); return;
    }

    const btn = document.getElementById('giSubmitBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Mengirim...';

    try {
      await saveToFirebase(assessor);

      btn.textContent = '📄 Membuat PDF...';
      const pdfBlob = await generatePDF(assessor);

      btn.textContent = '📤 Mengupload...';
      await uploadToGAS(pdfBlob, assessor);

      showSuccess(assessor);

    } catch (err) {
      console.error('[GRAFIS-INTERP] Gagal:', err);
      alert('❌ Gagal: ' + (err.message || 'Coba lagi'));
      btn.disabled = false;
      btn.textContent = '📤 Kirim Interpretasi Grafis';
    }
  }

  /* ============================================================
     SAVE FIREBASE
     ============================================================ */
  async function saveToFirebase(assessor) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    const slug = candidateName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

    const avg = Object.values(state.scores).reduce((a, b) => a + b, 0) / Object.values(state.scores).length;
    const rec = getRecommendation(avg);

    await firebase.database()
      .ref('sgs_grafis_interp/' + slug + '/' + assessor)
      .set({
        candidateName,
        candidatePosition,
        assessor,
        dap: state.dap.filter(x => x.text.trim()).map(x => x.text.trim()),
        baum: state.baum.filter(x => x.text.trim()).map(x => x.text.trim()),
        htp: state.htp.filter(x => x.text.trim()).map(x => x.text.trim()),
        scores: state.scores,
        average: Number(avg.toFixed(2)),
        recommendation: rec.label,
        ts: firebase.database.ServerValue.TIMESTAMP
      });

    console.log('[GRAFIS-INTERP] ✅ Saved');
  }

  /* ============================================================
     GENERATE PDF
     ============================================================ */
  async function generatePDF(assessor) {
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF belum siap');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Logo
    try {
      const logoUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO)
        || 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png';
      const imgData = await fetchImageAsDataURL(logoUrl);
      doc.addImage(imgData, 'PNG', pageW / 2 - 12, 10, 24, 20);
    } catch (e) {}

    let y = 38;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('INTERPRETASI GRAFIS', pageW / 2, y, { align: 'center' });
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('SUGAR GROUP SCHOOLS', pageW / 2, y, { align: 'center' });
    y += 10;

    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    // Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMASI KANDIDAT', 15, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);

    const tanggal = new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    const infoRows = [
      ['Nama Kandidat', cleanForPDF(candidateName)],
      ['Posisi Dilamar', cleanForPDF(candidatePosition) || '-'],
      ['Assessor', cleanForPDF(assessor)],
      ['Tanggal', cleanForPDF(tanggal)]
    ];

    infoRows.forEach(([label, val]) => {
      doc.text(label + ' :', 18, y);
      doc.text(String(val), 65, y);
      y += 5.5;
    });

    y += 3;
    doc.setDrawColor(220);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    // Helper section
    function addSection(title, items) {
      if (!items.length) return;

      if (y > pageH - 30) { doc.addPage(); y = 20; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(cleanForPDF(title), 15, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      items.forEach((txt, idx) => {
        const cleanTxt = cleanForPDF(txt);
        const wrapped = doc.splitTextToSize(`${idx + 1}. ${cleanTxt}`, pageW - 36);

        for (const line of wrapped) {
          if (y > pageH - 30) { doc.addPage(); y = 20; }
          doc.text(line, 18, y);
          y += 4.5;
        }
        y += 1.5;
      });

      y += 4;
    }

    addSection('DAP — Draw A Person', state.dap.filter(x => x.text.trim()).map(x => x.text.trim()));
    addSection('BAUM — Tree Test', state.baum.filter(x => x.text.trim()).map(x => x.text.trim()));
    addSection('HTP — House Tree Person', state.htp.filter(x => x.text.trim()).map(x => x.text.trim()));

    // KESIMPULAN
    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setDrawColor(220);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('KESIMPULAN', 15, y);
    y += 8;

    CATEGORIES.forEach((cat, idx) => {
      const score = state.scores[idx];
      if (!score) return;

      if (y > pageH - 50) { doc.addPage(); y = 20; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${idx + 1}. ${cleanForPDF(cat)}`, 18, y);
      y += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`SKOR: ${score}/4`, 18, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const txt = (NARRATIVES[idx] && NARRATIVES[idx][score]) || '-';
      const wrapped = doc.splitTextToSize(cleanForPDF(txt), pageW - 36);
      wrapped.forEach(line => {
        if (y > pageH - 30) { doc.addPage(); y = 20; }
        doc.text(line, 18, y);
        y += 4.5;
      });
      y += 4;
    });

    // Rekomendasi
    const vals = Object.values(state.scores);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const rec = getRecommendation(avg);

    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setDrawColor(200);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TINGKAT REKOMENDASI', 15, y);
    y += 8;

    doc.setFontSize(13);
    doc.setTextColor(rec.color[0], rec.color[1], rec.color[2]);
    doc.text(cleanForPDF(rec.label), 18, y);
    doc.setTextColor(0, 0, 0);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Rata-rata: ${avg.toFixed(2).replace('.', ',')}`, 18, y);
    y += 14;

    // Tanda tangan
    if (y > pageH - 50) { doc.addPage(); y = 20; }

    doc.setFontSize(9);
    doc.text('Assessor,', pageW - 60, y);
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(cleanForPDF(assessor), pageW - 60, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('(Assessor)', pageW - 60, y + 4);

    return doc.output('blob');
  }

  async function fetchImageAsDataURL(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const blob = await r.blob();
    return await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(blob);
    });
  }

  /* ============================================================
     UPLOAD KE GAS
     ============================================================ */
  async function uploadToGAS(pdfBlob, assessor) {
    const GAS_URL = (typeof GAS_UPLOAD_URL !== 'undefined' && GAS_UPLOAD_URL)
      || 'https://script.google.com/macros/s/AKfycbxCryXLdQXXbB2k6qxkmbZJF-L2ltL-QgTUygKLFAg0UNVm3NfKHDgso9nB-NomM4en/exec';

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });

    const cleanName = candidateName.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${cleanName}-Grafis-${assessor}.pdf`;

    const payload = {
      action: 'upload',
      deviceId: 'grafindo_' + Date.now(),
      filename: filename,
      name: candidateName,
      position: candidatePosition,
      email: '',
      pdfBase64: base64,
      pdfPassword: '-'
    };

    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    await new Promise(r => setTimeout(r, 1500));
    console.log('[GRAFIS-INTERP] ✅ Uploaded to GAS');
  }

  /* ============================================================
     SUCCESS
     ============================================================ */
  function showSuccess(assessor) {
    const vals = Object.values(state.scores);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const rec = getRecommendation(avg);

    document.body.innerHTML = `
      <div style="position: fixed; inset: 0; z-index: 2147483647;
        background: linear-gradient(135deg, #065f46, #16a34a);
        display: flex; align-items: center; justify-content: center; padding: 20px;
        font-family: Inter, system-ui, -apple-system, sans-serif;">
        <div style="max-width: 520px; width: 100%; background: #fff;
          border-radius: 24px; padding: 40px 32px; text-align: center;
          box-shadow: 0 30px 90px rgba(0,0,0,.5);">
          <div style="width: 80px; height: 80px; margin: 0 auto 20px;
            display: grid; place-items: center; background: linear-gradient(135deg, #d1fae5, #ecfdf5);
            border: 3px solid #86efac; border-radius: 24px; font-size: 40px;">✅</div>
          <h1 style="margin: 0 0 12px; color: #065f46; font-size: 22px; font-weight: 900;">
            Terima Kasih!
          </h1>
          <p style="margin: 0 0 20px; color: #475569; font-size: 14.5px; line-height: 1.65;">
            Interpretasi grafis sudah terkirim ke admin.<br>
            PDF otomatis dibuat & tersimpan.
          </p>
          <div style="padding: 16px 18px; background: #f0fdf4; border: 1px solid #bbf7d0;
            border-radius: 14px; text-align: left; font-size: 13px; color: #166534; line-height: 1.9;">
            <div><b>Assessor:</b> ${escapeHtml(assessor)}</div>
            <div><b>Kandidat:</b> ${escapeHtml(candidateName)}</div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #86efac;">
              <div><b>Rata-rata:</b> <span style="font-size: 18px; font-weight: 900;">${avg.toFixed(2).replace('.', ',')}</span></div>
              <div style="color: rgb(${rec.color[0]}, ${rec.color[1]}, ${rec.color[2]});
                font-weight: 900; font-size: 13px; margin-top: 4px;">
                ${rec.emoji} ${rec.label}
              </div>
            </div>
          </div>
          <button onclick="window.close()" style="margin-top: 22px; width: 100%; padding: 14px;
            background: linear-gradient(135deg, #6d28d9, #a855f7);
            color: #fff; border: 0; border-radius: 12px;
            font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer;">
            Tutup Halaman
          </button>
        </div>
      </div>
    `;
  }

  buildUI();

})();
