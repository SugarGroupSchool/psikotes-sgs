/* ============================================================
   js/00n-grafis-interpretasi.js — Form Interpretasi Grafis v2
   ------------------------------------------------------------
   🔄 v2 [2026-09-23]:
   - Dropdown hasil wawancara (fetch dari Firebase sgs_interviews)
   - Kesimpulan MANUAL (textarea) — hapus auto-generate narrative
   - Tingkat rekomendasi MANUAL (dropdown)
   - PDF report: tampilkan dropdown wawancara + kesimpulan manual
   ============================================================ */

(function () {
  'use strict';

  const ASSESSOR_LIST = ['NUG', 'GUN', 'DED', 'DEF', 'NET', 'YAC', 'ALF'];

  const RECOMMENDATION_OPTIONS = [
    { value: 'HIGHLY_RECOMMENDED', label: '🌟 HIGHLY RECOMMENDED' },
    { value: 'RECOMMENDED',        label: '✅ RECOMMENDED' },
    { value: 'FAIRLY_RECOMMENDED', label: '⚠️ FAIRLY RECOMMENDED' },
    { value: 'NOT_RECOMMENDED',    label: '❌ NOT RECOMMENDED' }
  ];

  const RECOMMENDATION_COLORS = {
    HIGHLY_RECOMMENDED: [22, 101, 52],
    RECOMMENDED:        [22, 163, 74],
    FAIRLY_RECOMMENDED: [217, 119, 6],
    NOT_RECOMMENDED:    [220, 38, 38]
  };

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

  function candidateSlug(name) {
    return String(name || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
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
    conclusion: '',
    recommendation: '',
    selectedInterview: ''   // interviewer name
  };

  let __availableInterviews = [];   // dari Firebase

  /* ============================================================
     FETCH HASIL WAWANCARA DARI FIREBASE
     ============================================================ */
  async function fetchInterviewsFromFirebase() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return [];

    try {
      const slug = candidateSlug(candidateName);
      const snap = await firebase.database()
        .ref('sgs_interviews/' + slug)
        .once('value');

      const data = snap.val() || {};
      const list = Object.entries(data).map(([key, val]) => ({
        key,
        interviewer: val.interviewerName || key,
        average: val.average,
        conclusion: val.conclusion,
        notes: val.notes || '',
        category: val.category || ''
      }));

      list.sort((a, b) => (b.average || 0) - (a.average || 0));
      return list;
    } catch (e) {
      console.warn('[GRAFIS-INTERP] Gagal fetch interview:', e.message);
      return [];
    }
  }

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

          <!-- 🆕 DROPDOWN HASIL WAWANCARA -->
          <div style="margin-bottom: 24px; padding: 16px 18px; background: #fffbeb;
            border: 2px solid #fde68a; border-radius: 14px;">
            <label style="display: block; font-size: 12px; font-weight: 800; color: #92400e;
              letter-spacing: 1px; margin-bottom: 8px;">
              🎤 HASIL WAWANCARA TERKAIT (opsional)
            </label>
            <select id="giInterviewSelect"
              style="width: 100%; padding: 12px 14px; border: 2px solid #fcd34d; border-radius: 10px;
                font-size: 14px; font-family: inherit; background: #fff; outline: none; cursor: pointer;">
              <option value="">— Memuat hasil wawancara... —</option>
            </select>
            <div id="giInterviewDetail" style="display: none; margin-top: 12px; padding: 12px 14px;
              background: #fff; border: 1px solid #fde68a; border-radius: 10px;
              font-size: 12.5px; line-height: 1.65; color: #475569;">
            </div>
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

          <!-- 🆕 KESIMPULAN MANUAL -->
          <div style="margin-bottom: 24px; padding: 20px 22px; background: #f0f9ff;
            border: 2px solid #bae6fd; border-radius: 16px;">
            <div style="font-size: 14px; font-weight: 900; color: #075985; margin-bottom: 6px;">
              📝 KESIMPULAN & REKOMENDASI (Manual)
            </div>
            <div style="font-size: 12px; color: #0369a1; margin-bottom: 16px; line-height: 1.6;">
              Tulis kesimpulan interpretasi grafis secara manual berdasarkan analisis Anda.
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 12px; font-weight: 800; color: #0c4a6e;
                letter-spacing: 1px; margin-bottom: 8px;">
                KESIMPULAN <span style="color: #dc2626;">*</span>
              </label>
              <textarea id="giConclusion" rows="8" required
                placeholder="Tulis kesimpulan interpretasi grafis di sini...

Contoh: Berdasarkan hasil DAP, BAUM, dan HTP, subjek menunjukkan..."
                style="width: 100%; padding: 14px 16px; border: 2px solid #7dd3fc;
                  border-radius: 12px; font-size: 14.5px; font-family: inherit;
                  resize: vertical; outline: none; box-sizing: border-box;
                  line-height: 1.6; min-height: 160px;"></textarea>
            </div>

            <div>
              <label style="display: block; font-size: 12px; font-weight: 800; color: #0c4a6e;
                letter-spacing: 1px; margin-bottom: 8px;">
                TINGKAT REKOMENDASI <span style="color: #dc2626;">*</span>
              </label>
              <select id="giRecommendation" required
                style="width: 100%; padding: 14px 16px; border: 2px solid #7dd3fc;
                  border-radius: 12px; font-size: 15px; font-family: inherit;
                  background: #fff; outline: none; cursor: pointer;">
                <option value="">— Pilih Rekomendasi —</option>
                ${RECOMMENDATION_OPTIONS.map(o =>
                  `<option value="${o.value}">${o.label}</option>`
                ).join('')}
              </select>
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

    // Attach add buttons
    root.querySelectorAll('.gi-add-btn').forEach(btn => {
      btn.onclick = () => {
        const target = btn.getAttribute('data-target');
        state[target].push({ text: '' });
        renderItemList(target);
      };
    });

    // Interview dropdown
    const interviewSelect = document.getElementById('giInterviewSelect');
    interviewSelect.onchange = () => {
      state.selectedInterview = interviewSelect.value;
      renderInterviewDetail();
    };

    // Load interviews async
    fetchInterviewsFromFirebase().then(list => {
      __availableInterviews = list;
      populateInterviewDropdown(list);
    });

    document.getElementById('giForm').onsubmit = handleSubmit;
  }

  /* ============================================================
     POPULATE DROPDOWN WAWANCARA
     ============================================================ */
  function populateInterviewDropdown(list) {
    const sel = document.getElementById('giInterviewSelect');
    if (!sel) return;

    if (!list || list.length === 0) {
      sel.innerHTML = '<option value="">— Tidak ada hasil wawancara —</option>';
      sel.disabled = true;
      return;
    }

    sel.innerHTML = '<option value="">— Pilih pewawancara (opsional) —</option>' +
      list.map(iv => {
        const avg = iv.average != null ? ` (${iv.average.toFixed(2).replace('.', ',')})` : '';
        return `<option value="${escapeHtml(iv.interviewer)}">${escapeHtml(iv.interviewer)} — ${escapeHtml(iv.conclusion || '-')}${avg}</option>`;
      }).join('');
  }

  function renderInterviewDetail() {
    const box = document.getElementById('giInterviewDetail');
    if (!box) return;

    const iv = __availableInterviews.find(x => x.interviewer === state.selectedInterview);
    if (!iv) {
      box.style.display = 'none';
      return;
    }

    const avg = iv.average != null ? iv.average.toFixed(2).replace('.', ',') : '-';
    const notes = iv.notes ? cleanForPDF(iv.notes) : '(tidak ada catatan)';

    box.style.display = 'block';
    box.innerHTML = `
      <div style="font-weight: 800; color: #92400e; margin-bottom: 6px;">
        👤 ${escapeHtml(iv.interviewer)} — ${escapeHtml(iv.conclusion || '-')}
      </div>
      <div style="margin-bottom: 8px;">
        <b>Rata-rata:</b> ${avg} / 5.00
      </div>
      <div style="padding-top: 8px; border-top: 1px dashed #fde68a;">
        <b>Catatan pewawancara:</b><br>
        <span style="white-space: pre-wrap;">${escapeHtml(notes)}</span>
      </div>
    `;
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
          state[t][0].text = '';
        } else {
          state[t].splice(i, 1);
        }
        renderItemList(t);
      };
    });
  }

  /* ============================================================
     SUBMIT
     ============================================================ */
  async function handleSubmit(e) {
    e.preventDefault();

    const assessor = document.getElementById('giAssessor').value.trim();
    if (!assessor) { alert('Pilih assessor dulu.'); return; }

    const conclusion = document.getElementById('giConclusion').value.trim();
    if (!conclusion) { alert('Kesimpulan wajib diisi.'); return; }

    const recommendation = document.getElementById('giRecommendation').value;
    if (!recommendation) { alert('Pilih tingkat rekomendasi.'); return; }

    const dapValid  = state.dap.filter(x => x.text.trim());
    const baumValid = state.baum.filter(x => x.text.trim());
    const htpValid  = state.htp.filter(x => x.text.trim());

    if (!dapValid.length && !baumValid.length && !htpValid.length) {
      alert('Isi minimal 1 item DAP/BAUM/HTP.'); return;
    }

    state.conclusion = conclusion;
    state.recommendation = recommendation;

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

    const slug = candidateSlug(candidateName);
    const recLabel = RECOMMENDATION_OPTIONS.find(o => o.value === state.recommendation)?.label || '-';

    await firebase.database()
      .ref('sgs_grafis_interp/' + slug + '/' + assessor)
      .set({
        candidateName,
        candidatePosition,
        assessor,
        dap: state.dap.filter(x => x.text.trim()).map(x => x.text.trim()),
        baum: state.baum.filter(x => x.text.trim()).map(x => x.text.trim()),
        htp: state.htp.filter(x => x.text.trim()).map(x => x.text.trim()),
        conclusion: state.conclusion,
        recommendation: state.recommendation,
        recommendationLabel: recLabel,
        relatedInterview: state.selectedInterview || null,
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

    if (state.selectedInterview) {
      infoRows.push(['Ref. Wawancara', cleanForPDF(state.selectedInterview)]);
    }

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

    // KESIMPULAN MANUAL
    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setDrawColor(220);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('KESIMPULAN', 15, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const conclusionLines = doc.splitTextToSize(cleanForPDF(state.conclusion), pageW - 36);
    conclusionLines.forEach(line => {
      if (y > pageH - 30) { doc.addPage(); y = 20; }
      doc.text(line, 18, y);
      y += 4.5;
    });
    y += 8;

    // REKOMENDASI
    const recOpt = RECOMMENDATION_OPTIONS.find(o => o.value === state.recommendation);
    const recLabel = recOpt ? recOpt.label : '-';
    const recColor = RECOMMENDATION_COLORS[state.recommendation] || [0, 0, 0];

    if (y > pageH - 40) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TINGKAT REKOMENDASI', 15, y);
    y += 8;

    doc.setFontSize(13);
    doc.setTextColor(recColor[0], recColor[1], recColor[2]);
    doc.text(cleanForPDF(recLabel), 18, y);
    doc.setTextColor(0, 0, 0);
    y += 16;

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

    // 🆕 Ambil ID token
    let idToken = '';
    try {
      const user = firebase.auth().currentUser;
      if (user) idToken = await user.getIdToken();
    } catch (e) {}

    const payload = {
      idToken: idToken,
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

    // 🆕 Kirim sinyal real-time ke admin
    try {
      if (typeof firebase !== 'undefined' && firebase.apps.length) {
        firebase.database().ref('sgs_state/lastUpload').set({
          ts: firebase.database.ServerValue.TIMESTAMP,
          type: 'pdf',
          name: candidateName,
          position: candidatePosition,
          deviceId: 'grafindo'
        }).catch(() => {});
      }
    } catch (e) {}

    console.log('[GRAFIS-INTERP] ✅ Uploaded to GAS');
  }

  /* ============================================================
     SUCCESS
     ============================================================ */
  function showSuccess(assessor) {
    const recOpt = RECOMMENDATION_OPTIONS.find(o => o.value === state.recommendation);
    const recLabel = recOpt ? recOpt.label : '-';
    const recColor = RECOMMENDATION_COLORS[state.recommendation] || [0, 0, 0];

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
            ${state.selectedInterview ? `<div><b>Ref. Wawancara:</b> ${escapeHtml(state.selectedInterview)}</div>` : ''}
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #86efac;">
              <div style="color: rgb(${recColor[0]}, ${recColor[1]}, ${recColor[2]});
                font-weight: 900; font-size: 14px;">
                ${escapeHtml(recLabel)}
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
