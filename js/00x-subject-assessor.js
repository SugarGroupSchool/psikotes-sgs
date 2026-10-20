/* ============================================================
   js/00x-subject-assessor.js — Form Koreksi Subject Test
   ------------------------------------------------------------
   URL korektor: ?subjectdo=1&n=NamaKandidat&p=Posisi&kode=KODE
   
   Fitur:
   - Form koreksi MURNI (bukan perilaku/FGD) — nilai akurasi jawaban
   - Lihat foto jawaban kandidat (dari sgs_subject_images/{slug})
   - Input catatan koreksi (textarea)
   - Upload foto catatan (opsional, via GAS)
   - Rating: 1=Not Rec, 2=Fairly, 3=Rec, 4=Highly
   - Edit mode: korektor boleh edit submit mereka sendiri
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     MODE CHECK
     ============================================================ */
  const url = new URL(window.location.href);
  const isSubjectMode = url.searchParams.get('subjectdo') === '1';
  if (!isSubjectMode) return;

  window.__SUBJECT_MODE_ACTIVE = true;

  const candidateName = url.searchParams.get('n') || '(tanpa nama)';
  const candidatePosition = url.searchParams.get('p') || '';
  const prefilledKode = url.searchParams.get('kode') || '';

  console.log('[SUBJECT-KOREKTOR] Mode aktif —', { candidateName, candidatePosition, prefilledKode });

  /* ============================================================
     KONFIGURASI
     ============================================================ */
  const RATING_OPTIONS = [
    { value: 1, label: 'Not Recommended',          short: 'Not Rec', color: '#dc2626', bg: '#fef2f2', br: '#fecaca' },
    { value: 2, label: 'Fairly Recommended',       short: 'Fairly',  color: '#d97706', bg: '#fffbeb', br: '#fde68a' },
    { value: 3, label: 'Recommended',              short: 'Rec',     color: '#16a34a', bg: '#f0fdf4', br: '#bbf7d0' },
    { value: 4, label: 'Highly Recommended',       short: 'Highly',  color: '#0d9488', bg: '#f0fdfa', br: '#5eead4' }
  ];

  let ASSESSOR_LIST = [];
  let __retry = 0;
  function __initAssessors() {
    if (typeof window.ASSESSORS === 'undefined') {
      if (++__retry > 20) { console.warn('[SUBJECT-KOREKTOR] ASSESSORS unavailable'); return; }
      setTimeout(__initAssessors, 500);
      return;
    }
    window.ASSESSORS.load('subject').then(list => {
      if (Array.isArray(list) && list.length > 0) ASSESSOR_LIST = list;
    });
    window.ASSESSORS.onChange('subject', list => { ASSESSOR_LIST = list; });
  }
  __initAssessors();

  const GAS_URL = (typeof window.GAS_ADMIN_URL === 'string' && window.GAS_ADMIN_URL)
    || 'https://script.google.com/macros/s/AKfycbzsdy_aGU5vN6mrkXvNbKBO4nHym6xIGhDNT0u_Urz3qQ2w3jFjwMzjfv0ipQxmqyBG/exec';

  /* ============================================================
     HELPERS
     ============================================================ */
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function candidateSlug(name) {
    return String(name || 'tanpa-nama').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'tanpa-nama';
  }

  /* ============================================================
     STATE
     ============================================================ */
  const slug = candidateSlug(candidateName);
  const state = {
    kode: prefilledKode || null,
    assessorName: '',
    notes: '',
    rating: 0,
    notePhotoBase64: null,
    notePhotoUrl: '',
    candidateImages: [],
    existingData: null
  };

  /* ============================================================
     HIDE UI BAWAAN
     ============================================================ */
  function hideDefaultUI() {
    const pwd = document.getElementById('passwordScreen');
    if (pwd) pwd.style.display = 'none';
    const app = document.getElementById('app');
    if (app) { app.style.display = 'none'; app.innerHTML = ''; }
    if (document.body) {
      document.body.style.background = '#f0fdfa';
      document.body.style.overflow = 'auto';
    }
  }
  hideDefaultUI();
  setTimeout(hideDefaultUI, 100);
  setTimeout(hideDefaultUI, 500);

  /* ============================================================
     LOAD CANDIDATE IMAGES
     ============================================================ */
  async function loadCandidateImages() {
    let wait = 0;
    while ((typeof firebase === 'undefined' || !firebase.apps.length) && wait < 30) {
      await new Promise(r => setTimeout(r, 200));
      wait++;
    }
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    try {
      const snap = await firebase.database().ref('sgs_subject_images/' + slug).once('value');
      const data = snap.val();
      if (data && data.images) {
        state.candidateImages = Object.keys(data.images)
          .sort((a, b) => Number(a) - Number(b))
          .map(k => data.images[k] && data.images[k].dataUrl)
          .filter(Boolean);
        console.log('[SUBJECT-KOREKTOR] Loaded', state.candidateImages.length, 'images');
      }
    } catch (e) {
      console.warn('[SUBJECT-KOREKTOR] Gagal load images:', e.message);
    }
  }

  /* ============================================================
     LOAD EXISTING ASSESSMENT (edit mode)
     ============================================================ */
  async function loadExisting() {
    if (!state.kode) return;
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;
    try {
      const snap = await firebase.database()
        .ref('sgs_subject_assessments/' + slug + '/assessments/' + state.kode)
        .once('value');
      const data = snap.val();
      if (!data) return;
      state.existingData = data;
      state.assessorName = data.assessorName || '';
      state.notes = data.notes || '';
      state.rating = Number(data.rating) || 0;
      state.notePhotoUrl = data.notePhotoUrl || '';
      console.log('[SUBJECT-KOREKTOR] Existing loaded');
    } catch (e) {
      console.warn('[SUBJECT-KOREKTOR] Gagal load existing:', e.message);
    }
  }

  /* ============================================================
     ROOT
     ============================================================ */
  function getRoot() {
    let root = document.getElementById('subjectKorektorRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'subjectKorektorRoot';
      root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:linear-gradient(135deg,#f0fdfa 0%,#ccfbf1 100%);overflow-y:auto;font-family:Inter,system-ui,-apple-system,sans-serif;padding:20px;';
      document.body.appendChild(root);
    }
    return root;
  }

  /* ============================================================
     RENDER: PICKER (jika kode kosong)
     ============================================================ */
  function renderPicker() {
    const root = getRoot();
    root.innerHTML = `
      <div style="max-width:560px;margin:60px auto;padding:40px 32px;background:#fff;
        border-radius:20px;box-shadow:0 20px 50px rgba(15,23,42,.12);text-align:center;">
        <div style="width:72px;height:72px;margin:0 auto 16px;display:grid;place-items:center;
          background:linear-gradient(135deg,#0d9488,#14b8a6);border-radius:18px;font-size:32px;">📚</div>
        <h1 style="margin:0 0 12px;color:#134e4a;font-size:22px;font-weight:900;">Form Koreksi Subject</h1>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
          Kandidat: <b style="color:#134e4a;">${esc(candidateName)}</b><br>
          Posisi: ${esc(candidatePosition || '-')}
        </p>
        <div style="font-size:11px;font-weight:800;color:#0f766e;letter-spacing:1px;
          margin-bottom:12px;">PILIH NAMA ANDA SEBAGAI KOREKTOR</div>
        <div id="korPicker" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));
          gap:10px;">
          ${ASSESSOR_LIST.length === 0
            ? '<div style="grid-column:1/-1;padding:20px;text-align:center;color:#94a3b8;font-size:13px;">⏳ Memuat daftar korektor...</div>'
            : ASSESSOR_LIST.map(k => `
              <button class="js-pick-kor" data-kode="${esc(k)}"
                style="padding:14px 10px;border:2px solid #5eead4;border-radius:12px;background:#fff;
                  color:#134e4a;font-family:inherit;font-weight:900;font-size:14px;cursor:pointer;
                  transition:all .15s ease;">${esc(k)}</button>
            `).join('')
          }
        </div>
      </div>
    `;

    root.querySelectorAll('.js-pick-kor').forEach(btn => {
      btn.onclick = async () => {
        state.kode = btn.getAttribute('data-kode');
        state.assessorName = state.kode;
        await loadExisting();
        renderForm();
      };
      btn.onmouseenter = () => { btn.style.background = '#f0fdfa'; btn.style.borderColor = '#0d9488'; };
      btn.onmouseleave = () => { btn.style.background = '#fff'; btn.style.borderColor = '#5eead4'; };
    });
  }

  /* ============================================================
     RENDER: FORM KOREKSI
     ============================================================ */
  function renderForm() {
    const root = getRoot();

    const imagesHTML = state.candidateImages.length > 0
      ? state.candidateImages.map((src, i) => `
          <div style="position:relative;border-radius:12px;overflow:hidden;background:#fff;
            border:1.5px solid #5eead4;box-shadow:0 2px 8px rgba(13,148,136,.1);">
            <img src="${src}" alt="Jawaban ${i+1}"
              style="width:100%;height:auto;display:block;cursor:zoom-in;"
              onclick="window.__viewFullImage(this.src)">
            <div style="position:absolute;top:6px;left:6px;padding:3px 9px;
              background:rgba(13,148,136,.9);color:#fff;border-radius:6px;
              font-size:10px;font-weight:900;">#${i+1}</div>
          </div>
        `).join('')
      : '<div style="grid-column:1/-1;padding:24px;text-align:center;color:#94a3b8;font-size:13px;background:#f8fafc;border-radius:12px;border:2px dashed #cbd5e1;">📷 Belum ada foto jawaban yang diupload kandidat</div>';

    const existingWarn = state.existingData
      ? `<div style="margin-bottom:16px;padding:12px 14px;background:#fef3c7;
          border:1px solid #fde68a;border-radius:10px;font-size:12px;color:#78350f;line-height:1.5;">
          <b>✎ Mode Edit</b> — Anda sudah pernah submit untuk kandidat ini.
          Perubahan akan menimpa data sebelumnya.
        </div>`
      : '';

    const photoPreview = state.notePhotoUrl
      ? `<div style="margin-top:10px;padding:10px;background:#f0fdfa;border:1px solid #5eead4;border-radius:10px;">
          <div style="font-size:11px;font-weight:800;color:#0f766e;margin-bottom:6px;">📎 Foto catatan saat ini:</div>
          <img src="${esc(state.notePhotoUrl)}" alt="Catatan"
            style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid #5eead4;"
            onclick="window.__viewFullImage(this.src)">
        </div>`
      : '';

    root.innerHTML = `
      <div style="max-width:900px;margin:0 auto 40px;">
        <div style="background:linear-gradient(135deg,#0d9488,#14b8a6);border-radius:20px 20px 0 0;
          padding:24px 28px;color:#fff;display:flex;align-items:center;gap:14px;">
          <div style="width:56px;height:56px;flex:0 0 56px;display:grid;place-items:center;
            background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);
            border-radius:14px;font-size:26px;">📚</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10.5px;font-weight:900;letter-spacing:2px;opacity:.85;">KOREKSI SUBJECT TEST</div>
            <div style="font-size:20px;font-weight:900;margin-top:4px;">Form Koreksi Jawaban</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;opacity:.8;">KOREKTOR</div>
            <div style="font-size:15px;font-weight:900;margin-top:2px;">${esc(state.kode)}</div>
          </div>
        </div>

        <div style="background:#fff;padding:20px 28px;border-bottom:1px solid #e2e8f0;">
          <div style="font-size:10.5px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:6px;">KANDIDAT</div>
          <div style="font-size:17px;font-weight:900;color:#134e4a;">${esc(candidateName)}</div>
          <div style="font-size:12px;color:#0f766e;margin-top:3px;">💼 ${esc(candidatePosition || '(tanpa posisi)')}</div>
        </div>

        <div style="background:#fff;padding:24px 28px 28px;border-radius:0 0 20px 20px;
          box-shadow:0 20px 50px rgba(15,23,42,.08);">

          ${existingWarn}

          <div style="margin-bottom:22px;">
            <div style="font-size:13px;font-weight:900;color:#134e4a;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
              <span style="font-size:16px;">📷</span> Foto Jawaban Kandidat
              <span style="font-size:10.5px;font-weight:700;color:#64748b;">(${state.candidateImages.length} gambar — klik untuk zoom)</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;">
              ${imagesHTML}
            </div>
          </div>

          <div style="margin-bottom:20px;">
            <label style="display:block;font-size:12px;font-weight:900;color:#134e4a;letter-spacing:.5px;margin-bottom:8px;">
              📝 CATATAN KOREKSI <span style="color:#dc2626;">*</span>
            </label>
            <textarea id="subjNotes" rows="6"
              placeholder="Contoh: Soal 1 benar (3/3), Soal 2 salah konsep integral, Soal 3 langkah benar tapi hasil akhir kurang teliti. Saran: perbanyak latihan soal..."
              style="width:100%;padding:14px 16px;border:2px solid #5eead4;border-radius:12px;
                font-family:inherit;font-size:14px;line-height:1.6;resize:vertical;outline:none;
                box-sizing:border-box;background:#fff;color:#134e4a;">${esc(state.notes)}</textarea>
          </div>

          <div style="margin-bottom:20px;">
            <label style="display:block;font-size:12px;font-weight:900;color:#134e4a;letter-spacing:.5px;margin-bottom:8px;">
              📎 FOTO CATATAN KOREKSI <span style="font-size:10.5px;font-weight:700;color:#64748b;">(opsional — misal foto lembar coretan benar/salah)</span>
            </label>
            <input type="file" id="subjNotePhoto" accept="image/*"
              style="width:100%;padding:12px;border:2px dashed #5eead4;border-radius:12px;
                font-family:inherit;font-size:12px;background:#f0fdfa;cursor:pointer;box-sizing:border-box;">
            ${photoPreview}
            <div id="subjPhotoPreview" style="margin-top:10px;"></div>
          </div>

          <div style="margin-bottom:22px;">
            <label style="display:block;font-size:12px;font-weight:900;color:#134e4a;letter-spacing:.5px;margin-bottom:10px;">
              ⭐ TINGKAT REKOMENDASI <span style="color:#dc2626;">*</span>
            </label>
            <div id="subjRatingGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">
              ${RATING_OPTIONS.map(r => `
                <label class="js-rating-opt" data-val="${r.value}"
                  style="display:flex;flex-direction:column;align-items:center;gap:6px;
                    padding:14px 10px;border:2px solid ${state.rating === r.value ? r.color : '#e2e8f0'};
                    background:${state.rating === r.value ? r.bg : '#fff'};
                    border-radius:12px;cursor:pointer;transition:all .15s ease;user-select:none;">
                  <input type="radio" name="subjRating" value="${r.value}"
                    ${state.rating === r.value ? 'checked' : ''}
                    style="width:16px;height:16px;accent-color:${r.color};cursor:pointer;">
                  <div style="font-size:18px;font-weight:900;color:${r.color};">${r.value}</div>
                  <div style="font-size:10.5px;font-weight:800;color:#1e293b;text-align:center;line-height:1.3;">${r.short}</div>
                </label>
              `).join('')}
            </div>
          </div>

          <button id="subjSubmitBtn"
            style="width:100%;padding:16px;border:0;border-radius:14px;
              background:linear-gradient(135deg,#0d9488,#14b8a6);
              color:#fff;font-family:inherit;font-size:16px;font-weight:900;
              cursor:pointer;box-shadow:0 10px 24px rgba(13,148,136,.3);">
            📤 Kirim Hasil Koreksi
          </button>
          <div style="margin-top:12px;text-align:center;font-size:11px;color:#94a3b8;">
            Hasil akan otomatis muncul di panel admin &amp; psikogram kandidat.
          </div>
        </div>
      </div>

      <style>
        @keyframes subjKorSpin { to { transform: rotate(360deg); } }
      </style>
    `;

    attachFormEvents();
  }

  /* ============================================================
     FORM EVENTS
     ============================================================ */
  function attachFormEvents() {
    const notesEl = document.getElementById('subjNotes');
    if (notesEl) notesEl.oninput = (e) => { state.notes = e.target.value; };

    document.querySelectorAll('.js-rating-opt').forEach(lbl => {
      const radio = lbl.querySelector('input');
      const val = Number(lbl.getAttribute('data-val'));
      const opt = RATING_OPTIONS.find(o => o.value === val);

      function applyStyle() {
        const active = radio.checked;
        lbl.style.borderColor = active ? opt.color : '#e2e8f0';
        lbl.style.background = active ? opt.bg : '#fff';
      }
      radio.addEventListener('change', () => {
        state.rating = Number(radio.value);
        document.querySelectorAll('.js-rating-opt').forEach(o => {
          const r = o.querySelector('input');
          const v = Number(o.getAttribute('data-val'));
          const op = RATING_OPTIONS.find(x => x.value === v);
          o.style.borderColor = r.checked ? op.color : '#e2e8f0';
          o.style.background = r.checked ? op.bg : '#fff';
        });
      });
      applyStyle();
    });

    const photoInput = document.getElementById('subjNotePhoto');
    if (photoInput) {
      photoInput.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { alert('File harus gambar'); return; }
        if (file.size > 5 * 1024 * 1024) { alert('Maks 5 MB'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
          state.notePhotoBase64 = ev.target.result;
          const prev = document.getElementById('subjPhotoPreview');
          if (prev) prev.innerHTML = `
            <div style="padding:10px;background:#f0fdfa;border:1px solid #5eead4;border-radius:10px;">
              <div style="font-size:11px;font-weight:800;color:#0f766e;margin-bottom:6px;">✓ Foto baru dipilih (akan diupload saat submit):</div>
              <img src="${ev.target.result}" style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid #5eead4;">
            </div>`;
        };
        reader.readAsDataURL(file);
      };
    }

    const btn = document.getElementById('subjSubmitBtn');
    if (btn) btn.onclick = handleSubmit;
  }

  /* ============================================================
     UPLOAD NOTE PHOTO TO GAS
     ============================================================ */
  async function uploadNotePhoto() {
    if (!state.notePhotoBase64) return state.notePhotoUrl || '';

    const base64Only = state.notePhotoBase64.split(',')[1] || '';
    if (!base64Only) return state.notePhotoUrl || '';

    let idToken = '';
    try {
      if (typeof firebase !== 'undefined' && firebase.apps.length) {
        const u = firebase.auth().currentUser;
        if (u) idToken = await u.getIdToken();
      }
    } catch (e) {}

    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'upload_subject_note_photo',
          idToken: idToken,
          slug: slug,
          kode: state.kode,
          base64: base64Only
        })
      });
      const data = await res.json();
      if (data && data.success && data.fileUrl) return data.fileUrl;
      console.warn('[SUBJECT-KOREKTOR] Upload photo response:', data);
      return state.notePhotoUrl || '';
    } catch (e) {
      console.warn('[SUBJECT-KOREKTOR] Upload photo error:', e.message);
      return state.notePhotoUrl || '';
    }
  }

  /* ============================================================
     SUBMIT
     ============================================================ */
  async function handleSubmit() {
    const notesEl = document.getElementById('subjNotes');
    if (notesEl) state.notes = notesEl.value.trim();

    if (!state.notes) { alert('⚠️ Catatan koreksi wajib diisi.'); return; }
    if (!state.rating) { alert('⚠️ Pilih tingkat rekomendasi dulu.'); return; }
    if (!state.kode) { alert('⚠️ Kode korektor tidak valid.'); return; }

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      alert('❌ Firebase belum siap — coba refresh halaman.');
      return;
    }

    const btn = document.getElementById('subjSubmitBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Mengirim...';

    try {
      let photoUrl = state.notePhotoUrl;
      if (state.notePhotoBase64) {
        btn.textContent = '⏳ Upload foto...';
        photoUrl = await uploadNotePhoto();
      }

      btn.textContent = '⏳ Menyimpan...';

      const payload = {
        assessorName: state.assessorName || state.kode,
        notes: state.notes,
        notePhotoUrl: photoUrl || '',
        rating: Number(state.rating),
        ts: firebase.database.ServerValue.TIMESTAMP
      };

      // Update candidateName/position di parent
      await firebase.database()
        .ref('sgs_subject_assessments/' + slug)
        .update({
          candidateName: candidateName,
          candidatePosition: candidatePosition || ''
        });

      await firebase.database()
        .ref('sgs_subject_assessments/' + slug + '/assessments/' + state.kode)
        .set(payload);

      console.log('[SUBJECT-KOREKTOR] ✓ Saved:', slug, '/', state.kode);
      renderSuccess();
    } catch (e) {
      console.error('[SUBJECT-KOREKTOR] Gagal:', e);
      alert('❌ Gagal menyimpan: ' + (e.message || 'Coba lagi'));
      btn.disabled = false;
      btn.textContent = '📤 Kirim Hasil Koreksi';
    }
  }

  /* ============================================================
     SUCCESS SCREEN
     ============================================================ */
  function renderSuccess() {
    const opt = RATING_OPTIONS.find(r => r.value === Number(state.rating));
    const root = getRoot();
    root.innerHTML = `
      <div style="max-width:520px;margin:60px auto;padding:40px 32px;background:#fff;
        border-radius:24px;box-shadow:0 30px 90px rgba(0,0,0,.15);text-align:center;">
        <div style="width:80px;height:80px;margin:0 auto 20px;display:grid;place-items:center;
          background:linear-gradient(135deg,#d1fae5,#ecfdf5);border:3px solid #86efac;
          border-radius:24px;font-size:40px;">✅</div>
        <h1 style="margin:0 0 12px;color:#065f46;font-size:22px;font-weight:900;">Terima Kasih!</h1>
        <p style="margin:0 0 20px;color:#475569;font-size:14.5px;line-height:1.65;">
          Hasil koreksi Anda untuk <b>${esc(candidateName)}</b> sudah tersimpan.<br>
          Admin akan melihat hasil gabungan dari semua korektor.
        </p>
        <div style="padding:16px 18px;background:#f0fdfa;border:1px solid #5eead4;
          border-radius:14px;text-align:left;font-size:13px;color:#134e4a;line-height:1.9;">
          <div><b>Korektor:</b> ${esc(state.assessorName)}</div>
          <div><b>Kandidat:</b> ${esc(candidateName)}</div>
          <div><b>Rating:</b> <span style="color:${opt.color};font-weight:900;">${opt.value} — ${opt.label}</span></div>
          <div><b>Waktu:</b> ${new Date().toLocaleString('id-ID')}</div>
        </div>
        <div style="margin-top:22px;padding:14px;background:#f0fdfa;border:1px solid #5eead4;
          border-radius:12px;font-size:13px;font-weight:700;color:#0f766e;line-height:1.5;">
          ✅ Selesai — Anda bisa menutup tab ini
        </div>
        <button onclick="window.close();setTimeout(()=>{window.location.href=window.location.origin+window.location.pathname;},200)"
          style="margin-top:12px;width:100%;padding:14px;background:linear-gradient(135deg,#0d9488,#14b8a6);
            color:#fff;border:0;border-radius:12px;font-family:inherit;font-size:14px;
            font-weight:800;cursor:pointer;">🏠 Tutup Halaman</button>
      </div>
    `;
  }

  /* ============================================================
     IMAGE FULL VIEW
     ============================================================ */
  window.__viewFullImage = function (src) {
    const old = document.getElementById('subjFullImgOverlay');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'subjFullImgOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483648;background:rgba(0,0,0,.94);display:flex;align-items:center;justify-content:center;padding:30px;cursor:zoom-out;';
    ov.innerHTML = `<img src="${src}" style="max-width:100%;max-height:100%;border-radius:8px;box-shadow:0 30px 90px rgba(0,0,0,.7);">`;
    ov.onclick = () => ov.remove();
    document.body.appendChild(ov);
  };

  /* ============================================================
     INIT
     ============================================================ */
  async function init() {
    await loadCandidateImages();
    if (state.kode) {
      await loadExisting();
      renderForm();
    } else {
      renderPicker();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

  console.log('[SUBJECT-KOREKTOR] ✓ Loaded');
})();