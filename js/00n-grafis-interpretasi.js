/* ============================================================
   js/00n-grafis-interpretasi.js — Form Interpretasi Grafis v4
   ------------------------------------------------------------
   🔄 v4 [2026-09-23]:
   - HAPUS dropdown wawancara
   - 7 kategori kesimpulan (skor 1-4 + narasi MANUAL)
   - Overall conclusion, recommendation, reasons, development (MANUAL)
   - Kop logo formal (letterhead)
   - Fix lag saat buka form via klik (skip heavy bootstrap)
   - Assessor otomatis = "ADMIN"
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     🆕 FIX [2026-09-23]:
     Helper & openGrafisInterpLink WAJIB didefinisikan lebih dulu
     di top-level, karena dipakai oleh admin panel meskipun halaman
     BUKAN di URL ?grafindo=1
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
     MODAL LINK UNTUK ADMIN — WAJIB SELALU TERSEDIA
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
            INTERPRETASI GRAFIS · ADMIN ONLY
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

          <div style="padding: 12px 14px; background: #f0fdf4; border: 1px solid #bbf7d0;
            border-radius: 12px; margin-bottom: 16px; font-size: 12.5px; color: #166534;
            line-height: 1.6;">
            <b>🔒 Mode Admin</b><br>
            Form ini <b>hanya untuk admin</b>. Assessor otomatis = <b>"ADMIN"</b>.
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
            <a id="giOpenBtn" href="${url}" target="_blank" rel="noopener noreferrer"
              style="flex: 2; padding: 14px; border: 0; border-radius: 12px;
                background: linear-gradient(135deg, #6d28d9, #a855f7); color: #fff;
                font-family: inherit; font-size: 14px; font-weight: 900; cursor: pointer;
                box-shadow: 0 10px 24px rgba(109,40,217,.28);
                text-decoration: none; text-align: center; display: block;">
              🧠 Buka Form Interpretasi
            </a>
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
    document.getElementById('giCloseBtn').onclick = () => modal.remove();
  };

  /* ============================================================
     CEK MODE — kalau bukan mode grafis, STOP di sini
     ============================================================ */
  const urlObj = new URL(window.location.href);
  const isGrafisMode = urlObj.searchParams.get('grafindo') === '1';

  if (isGrafisMode) {
    window.__GRAFIS_MODE_ACTIVE = true;
  }

  if (!isGrafisMode) return;

  /* ============================================================
     KONFIGURASI
     ============================================================ */
  const ADMIN_ASSESSOR = 'ADMIN';

  const KATEGORI = [
    'KEMAMPUAN BERPIKIR & PROBLEM SOLVING',
    'EMPATHY, INTERPERSONAL SKILL & TEAMWORK',
    'STABILITAS EMOSI & KONTROL IMPULS',
    'MOTIVATION & ACHIEVEMENT DRIVE',
    'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY',
    'INTEGRITY & RULE COMPLIANCE',
    'TEACHING CREATIVITY'
  ];

  const RECOMMENDATION_OPTIONS = [
    { value: 'HIGHLY_RECOMMENDED', label: '🌟 HIGHLY RECOMMENDED',                                          color: [22, 101, 52] },
    { value: 'RECOMMENDED',        label: '✅ RECOMMENDED',                                                  color: [22, 163, 74] },
    { value: 'FAIRLY_RECOMMENDED', label: '⚠️ Fairly Recommended / Dipertimbangkan dengan Catatan',         color: [217, 119, 6]  },
    { value: 'NOT_RECOMMENDED',    label: '❌ NOT RECOMMENDED',                                              color: [220, 38, 38]  }
  ];

  const candidateName     = urlObj.searchParams.get('n') || '(tanpa nama)';
  const candidatePosition = urlObj.searchParams.get('p') || '';

  console.log('[GRAFIS-INTERP] Mode aktif (ADMIN ONLY) —', { candidateName, candidatePosition });

  /* ============================================================
     HIDE UI BAWAAN SEGERA (fix flicker)
     ============================================================ */
  function hideDefaultUI() {
    const appEl = document.getElementById('app');
    if (appEl) { appEl.style.display = 'none'; appEl.innerHTML = ''; }
    const pwd = document.getElementById('passwordScreen');
    if (pwd) pwd.style.display = 'none';
    const body = document.body;
    if (body) {
      body.style.background = '#f5f3ff';
      body.style.overflow = 'auto';
    }
  }
  hideDefaultUI();
  document.addEventListener('DOMContentLoaded', hideDefaultUI);
  setTimeout(hideDefaultUI, 50);
  setTimeout(hideDefaultUI, 300);


  /* ============================================================
     STATE
     ============================================================ */
  const state = {
    dap: [{ text: '' }],
    baum: [{ text: '' }],
    htp: [{ text: '' }],
    categories: KATEGORI.map(name => ({ name, score: '', narrative: '' })),
    conclusion: '',
    recommendation: '',
    reasons: '',
    development: ''
  };

  /* ============================================================
     BUILD UI
     ============================================================ */
  function buildUI() {
    hideDefaultUI();

    const root = document.createElement('div');
    root.id = 'grafindoRoot';
    root.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483600;
      background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
      overflow-y: auto; font-family: Inter, system-ui, -apple-system, sans-serif;
      padding: 20px;
    `;
    document.body.appendChild(root);

    const logoUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO)
      || 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png';

    root.innerHTML = `
      <div style="max-width: 900px; margin: 0 auto 60px;">

        <!-- ============================================ -->
        <!-- KOP / LETTERHEAD                              -->
        <!-- ============================================ -->
        <div style="background: #fff; border-radius: 18px 18px 0 0;
          padding: 22px 30px;
          border-bottom: 3px double #6d28d9;
          box-shadow: 0 4px 20px rgba(109,40,217,.08);">
          <div style="display: flex; align-items: center; gap: 18px;">
            <div style="width: 72px; height: 72px; flex: 0 0 72px;
              background: #fff; border-radius: 14px;
              display: grid; place-items: center; padding: 8px;
              border: 1px solid #e9d5ff;
              box-shadow: 0 4px 12px rgba(109,40,217,.1);">
              <img src="${logoUrl}" alt="Logo"
                style="width: 100%; height: 100%; object-fit: contain;"
                onerror="this.style.display='none';this.parentElement.textContent='SGS';">
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 12px; font-weight: 800; letter-spacing: 2.5px;
                color: #6d28d9; margin-bottom: 4px; text-transform: uppercase;">
                Sugar Group Schools
              </div>
              <div style="font-size: 20px; font-weight: 900; color: #1e1b4b;
                letter-spacing: -.3px; line-height: 1.2; margin-bottom: 4px;">
                LAPORAN INTERPRETASI GRAFIS
              </div>
              <div style="font-size: 11.5px; color: #64748b; line-height: 1.4;">
                DAP (Draw A Person) · BAUM (Tree Test) · HTP (House Tree Person)
              </div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #94a3b8;
              line-height: 1.5; flex: 0 0 auto;">
              <div style="font-weight: 800; color: #6d28d9; letter-spacing: 1px;">CONFIDENTIAL</div>
              <div>Sangat Rahasia</div>
            </div>
          </div>
        </div>

        <!-- KANDIDAT INFO -->
        <div style="background: #fff; padding: 20px 30px;
          border-bottom: 1px solid #e2e8f0;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <div style="font-size: 10.5px; font-weight: 800; color: #94a3b8;
                letter-spacing: 1.5px; margin-bottom: 4px;">NAMA KANDIDAT</div>
              <div style="font-size: 17px; font-weight: 900; color: #1e293b;">
                ${escapeHtml(candidateName)}
              </div>
            </div>
            <div>
              <div style="font-size: 10.5px; font-weight: 800; color: #94a3b8;
                letter-spacing: 1.5px; margin-bottom: 4px;">POSISI DILAMAR</div>
              <div style="font-size: 17px; font-weight: 900; color: #1e293b;">
                ${escapeHtml(candidatePosition || '(tanpa posisi)')}
              </div>
            </div>
          </div>
          <div style="margin-top: 12px; padding: 10px 12px;
            background: #f0fdf4; border: 1px solid #bbf7d0;
            border-radius: 10px; font-size: 12px; color: #166534; line-height: 1.5;">
            🔒 <b>Admin Only</b> — Assessor otomatis = <b>"${ADMIN_ASSESSOR}"</b>
          </div>
        </div>

        <!-- FORM -->
        <form id="giForm" style="background: #fff; padding: 26px 30px 30px;
          border-radius: 0 0 18px 18px;
          box-shadow: 0 20px 50px rgba(15,23,42,.08);">

          <!-- ==================================== -->
          <!-- DAP -->
          <!-- ==================================== -->
          <div style="margin-bottom: 24px; padding: 18px 20px; background: #faf5ff;
            border: 2px solid #e9d5ff; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;
              margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div style="font-size: 14px; font-weight: 900; color: #6b21a8;">
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

          <!-- ==================================== -->
          <!-- BAUM -->
          <!-- ==================================== -->
          <div style="margin-bottom: 24px; padding: 18px 20px; background: #f0fdf4;
            border: 2px solid #bbf7d0; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;
              margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div style="font-size: 14px; font-weight: 900; color: #166534;">
                🌳 BAUM — Tree Test
              </div>
              <button type="button" class="gi-add-btn" data-target="baum"
                style="padding: 6px 12px; border: 0; border-radius: 8px;
                  background: #16a34a; color: #fff; font-family: inherit;
                  font-size: 11px; font-weight: 800; cursor: pointer;">
                + Tambah Item
              </button>
            </div>
            <div id="baum-list"></div>
          </div>

          <!-- ==================================== -->
          <!-- HTP -->
          <!-- ==================================== -->
          <div style="margin-bottom: 24px; padding: 18px 20px; background: #eff6ff;
            border: 2px solid #bfdbfe; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;
              margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div style="font-size: 14px; font-weight: 900; color: #1e40af;">
                🏠 HTP — House Tree Person
              </div>
              <button type="button" class="gi-add-btn" data-target="htp"
                style="padding: 6px 12px; border: 0; border-radius: 8px;
                  background: #3b82f6; color: #fff; font-family: inherit;
                  font-size: 11px; font-weight: 800; cursor: pointer;">
                + Tambah Item
              </button>
            </div>
            <div id="htp-list"></div>
          </div>

          <!-- ==================================== -->
          <!-- KESIMPULAN 7 KATEGORI (MANUAL) -->
          <!-- ==================================== -->
          <div style="margin-bottom: 24px; padding: 22px 22px 20px; background: #f8fafc;
            border: 2px solid #e2e8f0; border-radius: 16px;">
            <div style="font-size: 15px; font-weight: 900; color: #1e293b; margin-bottom: 6px;">
              📊 KESIMPULAN PER KATEGORI (Manual)
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 18px; line-height: 1.6;">
              Isi skor (1–4) dan tulis narasi analisis untuk setiap kategori.
            </div>

            <div id="category-list"></div>
          </div>

          <!-- ==================================== -->
          <!-- KESIMPULAN KESELURUHAN (MANUAL) -->
          <!-- ==================================== -->
          <div style="margin-bottom: 22px; padding: 20px 22px; background: #fffbeb;
            border: 2px solid #fde68a; border-radius: 16px;">
            <div style="font-size: 14px; font-weight: 900; color: #92400e; margin-bottom: 6px;">
              📝 KESIMPULAN KESELURUHAN (Manual)
            </div>
            <div style="font-size: 12px; color: #a16207; margin-bottom: 14px; line-height: 1.5;">
              Rangkuman interpretasi grafis secara menyeluruh.
            </div>
            <textarea id="giConclusion" rows="6" required
              placeholder="Tulis kesimpulan keseluruhan..."
              style="width: 100%; padding: 14px 16px; border: 2px solid #fcd34d;
                border-radius: 12px; font-size: 14.5px; font-family: inherit;
                resize: vertical; outline: none; box-sizing: border-box;
                line-height: 1.6; min-height: 130px;"></textarea>
          </div>

          <!-- ==================================== -->
          <!-- TINGKAT REKOMENDASI (MANUAL) -->
          <!-- ==================================== -->
          <div style="margin-bottom: 22px; padding: 20px 22px; background: #f0f9ff;
            border: 2px solid #bae6fd; border-radius: 16px;">
            <div style="font-size: 14px; font-weight: 900; color: #075985; margin-bottom: 14px;">
              ⭐ TINGKAT REKOMENDASI
            </div>
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

          <!-- ==================================== -->
          <!-- ALASAN REKOMENDASI (MANUAL) -->
          <!-- ==================================== -->
          <div style="margin-bottom: 22px; padding: 20px 22px; background: #fef2f2;
            border: 2px solid #fecaca; border-radius: 16px;">
            <div style="font-size: 14px; font-weight: 900; color: #991b1b; margin-bottom: 14px;">
              📌 ALASAN REKOMENDASI (Manual)
            </div>
            <textarea id="giReasons" rows="5" required
              placeholder="Tulis alasan mengapa tingkat rekomendasi tersebut diberikan..."
              style="width: 100%; padding: 14px 16px; border: 2px solid #fca5a5;
                border-radius: 12px; font-size: 14.5px; font-family: inherit;
                resize: vertical; outline: none; box-sizing: border-box;
                line-height: 1.6; min-height: 110px;"></textarea>
          </div>

          <!-- ==================================== -->
          <!-- REKOMENDASI PENGEMBANGAN (MANUAL) -->
          <!-- ==================================== -->
          <div style="margin-bottom: 26px; padding: 20px 22px; background: #f5f3ff;
            border: 2px solid #ddd6fe; border-radius: 16px;">
            <div style="font-size: 14px; font-weight: 900; color: #5b21b6; margin-bottom: 14px;">
              🚀 REKOMENDASI PENGEMBANGAN (Manual)
            </div>
            <textarea id="giDevelopment" rows="5" required
              placeholder="Tulis saran pengembangan untuk kandidat..."
              style="width: 100%; padding: 14px 16px; border: 2px solid #c4b5fd;
                border-radius: 12px; font-size: 14.5px; font-family: inherit;
                resize: vertical; outline: none; box-sizing: border-box;
                line-height: 1.6; min-height: 110px;"></textarea>
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

    // Render item list DAP/BAUM/HTP
    renderItemList('dap');
    renderItemList('baum');
    renderItemList('htp');

    // Render 7 kategori
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

    const accentMap = {
      dap:  { bg: '#ede9fe', fg: '#6d28d9', border: '#a855f7' },
      baum: { bg: '#dcfce7', fg: '#15803d', border: '#16a34a' },
      htp:  { bg: '#dbeafe', fg: '#1e40af', border: '#3b82f6' }
    };
    const ac = accentMap[target] || accentMap.dap;

    container.innerHTML = state[target].map((item, idx) => `
      <div class="gi-item" data-target="${target}" data-idx="${idx}"
        style="display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start;">
        <div style="
          width: 32px; height: 32px; flex: 0 0 32px; margin-top: 4px;
          display: grid; place-items: center;
          background: ${ac.bg}; color: ${ac.fg};
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
        e.target.style.borderColor = ac.border;
        e.target.style.boxShadow = `0 0 0 3px ${ac.bg}`;
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
     RENDER 7 KATEGORI
     ============================================================ */
  function renderCategories() {
    const container = document.getElementById('category-list');
    if (!container) return;

    container.innerHTML = state.categories.map((cat, idx) => `
      <div class="gi-category" data-idx="${idx}"
        style="margin-bottom: 14px; padding: 16px 18px; background: #fff;
          border: 1.5px solid #e2e8f0; border-radius: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;
          margin-bottom: 10px; flex-wrap: wrap;">
          <div style="
            width: 34px; height: 34px; flex: 0 0 34px;
            display: grid; place-items: center;
            background: linear-gradient(135deg, #6d28d9, #a855f7);
            color: #fff; font-size: 13px; font-weight: 900; border-radius: 9px;">
            ${idx + 1}
          </div>
          <div style="flex: 1; min-width: 200px; font-size: 13px;
            font-weight: 900; color: #1e293b; line-height: 1.4;">
            ${escapeHtml(cat.name)}
          </div>
          <div style="display: flex; align-items: center; gap: 6px; flex: 0 0 auto;">
            <span style="font-size: 11px; font-weight: 800; color: #64748b;">SKOR:</span>
            <select class="gi-cat-score" data-idx="${idx}"
              style="padding: 8px 12px; border: 2px solid #e2e8f0; border-radius: 8px;
                font-family: inherit; font-size: 13px; font-weight: 900;
                color: #1e293b; background: #fff; cursor: pointer; outline: none;">
              <option value="">-- /4</option>
              <option value="1" ${cat.score == 1 ? 'selected' : ''}>1 / 4</option>
              <option value="2" ${cat.score == 2 ? 'selected' : ''}>2 / 4</option>
              <option value="3" ${cat.score == 3 ? 'selected' : ''}>3 / 4</option>
              <option value="4" ${cat.score == 4 ? 'selected' : ''}>4 / 4</option>
            </select>
          </div>
        </div>
        <textarea class="gi-cat-narrative" data-idx="${idx}" rows="4"
          placeholder="Tulis narasi analisis untuk kategori ini..."
          style="width: 100%; padding: 12px 14px;
            border: 2px solid #e2e8f0; border-radius: 10px;
            font-family: inherit; font-size: 13.5px; line-height: 1.6;
            outline: none; resize: vertical; box-sizing: border-box;
            transition: border-color .15s ease;"
        >${escapeHtml(cat.narrative)}</textarea>
      </div>
    `).join('');

    container.querySelectorAll('.gi-cat-score').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const i = Number(e.target.getAttribute('data-idx'));
        const v = e.target.value;
        state.categories[i].score = v ? Number(v) : '';
        e.target.style.borderColor = v ? '#86efac' : '#e2e8f0';
      });
    });

    container.querySelectorAll('.gi-cat-narrative').forEach(ta => {
      ta.addEventListener('input', (e) => {
        const i = Number(e.target.getAttribute('data-idx'));
        state.categories[i].narrative = e.target.value;
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
  }

  /* ============================================================
     SUBMIT
     ============================================================ */
  async function handleSubmit(e) {
    e.preventDefault();

    const dapValid  = state.dap.filter(x => x.text.trim());
    const baumValid = state.baum.filter(x => x.text.trim());
    const htpValid  = state.htp.filter(x => x.text.trim());

    if (!dapValid.length && !baumValid.length && !htpValid.length) {
      alert('Isi minimal 1 item DAP/BAUM/HTP.'); return;
    }

    // Validasi kategori
    for (let i = 0; i < state.categories.length; i++) {
      const c = state.categories[i];
      if (!c.score) {
        alert(`Kategori ${i + 1} (${c.name}) belum diisi skor.`);
        return;
      }
      if (!c.narrative.trim()) {
        alert(`Kategori ${i + 1} (${c.name}) belum diisi narasi.`);
        return;
      }
    }

    const conclusion = document.getElementById('giConclusion').value.trim();
    if (!conclusion) { alert('Kesimpulan keseluruhan wajib diisi.'); return; }

    const recommendation = document.getElementById('giRecommendation').value;
    if (!recommendation) { alert('Pilih tingkat rekomendasi.'); return; }

    const reasons = document.getElementById('giReasons').value.trim();
    if (!reasons) { alert('Alasan rekomendasi wajib diisi.'); return; }

    const development = document.getElementById('giDevelopment').value.trim();
    if (!development) { alert('Rekomendasi pengembangan wajib diisi.'); return; }

    state.conclusion = conclusion;
    state.recommendation = recommendation;
    state.reasons = reasons;
    state.development = development;

    const btn = document.getElementById('giSubmitBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Mengirim...';

    try {
      await saveToFirebase();
      btn.textContent = '📄 Membuat PDF...';
      const pdfBlob = await generatePDF();
      btn.textContent = '📤 Mengupload...';
      await uploadToGAS(pdfBlob);
      showSuccess();
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
  async function saveToFirebase() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    const slug = candidateSlug(candidateName);
    const recLabel = RECOMMENDATION_OPTIONS.find(o => o.value === state.recommendation)?.label || '-';

    await firebase.database()
      .ref('sgs_grafis_interp/' + slug + '/' + ADMIN_ASSESSOR)
      .set({
        candidateName,
        candidatePosition,
        assessor: ADMIN_ASSESSOR,
        dap: state.dap.filter(x => x.text.trim()).map(x => x.text.trim()),
        baum: state.baum.filter(x => x.text.trim()).map(x => x.text.trim()),
        htp: state.htp.filter(x => x.text.trim()).map(x => x.text.trim()),
        categories: state.categories,
        conclusion: state.conclusion,
        recommendation: state.recommendation,
        recommendationLabel: recLabel,
        reasons: state.reasons,
        development: state.development,
        ts: firebase.database.ServerValue.TIMESTAMP
      });

    console.log('[GRAFIS-INTERP] ✅ Saved — assessor:', ADMIN_ASSESSOR);
  }

  /* ============================================================
     GENERATE PDF
     ============================================================ */
  async function generatePDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF belum siap');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    /* KOP LOGO */
    try {
      const logoUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO)
        || 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png';
      const imgData = await fetchImageAsDataURL(logoUrl);
      doc.addImage(imgData, 'PNG', pageW / 2 - 12, 10, 24, 20);
    } catch (e) {}

    let y = 38;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('LAPORAN INTERPRETASI GRAFIS', pageW / 2, y, { align: 'center' });
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('SUGAR GROUP SCHOOLS', pageW / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(8);
    doc.text('DAP (Draw A Person)  ·  BAUM (Tree Test)  ·  HTP (House Tree Person)',
      pageW / 2, y, { align: 'center' });
    y += 6;

    doc.setDrawColor(109, 40, 217);
    doc.setLineWidth(0.6);
    doc.line(15, y, pageW - 15, y);
    doc.setLineWidth(0.2);
    y += 1.5;
    doc.line(15, y, pageW - 15, y);
    y += 8;

    /* INFO KANDIDAT */
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
      ['Assessor', ADMIN_ASSESSOR],
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

    /* Helper section */
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

    /* KESIMPULAN 7 KATEGORI */
    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setDrawColor(220);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('KESIMPULAN', 15, y);
    y += 8;

    state.categories.forEach((cat, idx) => {
      if (y > pageH - 40) { doc.addPage(); y = 20; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const titleLine = `${idx + 1}. ${cleanForPDF(cat.name)} — SKOR: ${cat.score}/4`;
      const titleWrap = doc.splitTextToSize(titleLine, pageW - 36);
      titleWrap.forEach(t => {
        doc.text(t, 18, y);
        y += 5;
      });
      y += 1;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const narrWrap = doc.splitTextToSize(cleanForPDF(cat.narrative), pageW - 42);
      narrWrap.forEach(line => {
        if (y > pageH - 30) { doc.addPage(); y = 20; }
        doc.text(line, 22, y);
        y += 4.5;
      });
      y += 6;
    });

    /* KESIMPULAN KESELURUHAN */
    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setDrawColor(220);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('KESIMPULAN KESELURUHAN', 15, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const conclWrap = doc.splitTextToSize(cleanForPDF(state.conclusion), pageW - 36);
    conclWrap.forEach(line => {
      if (y > pageH - 30) { doc.addPage(); y = 20; }
      doc.text(line, 18, y);
      y += 4.5;
    });
    y += 8;

    /* TINGKAT REKOMENDASI */
    const recOpt = RECOMMENDATION_OPTIONS.find(o => o.value === state.recommendation);
    const recLabel = recOpt ? recOpt.label : '-';
    const recColor = recOpt ? recOpt.color : [0, 0, 0];

    if (y > pageH - 40) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TINGKAT REKOMENDASI', 15, y);
    y += 7;

    doc.setFontSize(12);
    doc.setTextColor(recColor[0], recColor[1], recColor[2]);
    const recWrap = doc.splitTextToSize(cleanForPDF(recLabel), pageW - 36);
    recWrap.forEach(line => {
      doc.text(line, 18, y);
      y += 6;
    });
    doc.setTextColor(0, 0, 0);
    y += 6;

    /* ALASAN REKOMENDASI */
    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ALASAN REKOMENDASI', 15, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const reasonsWrap = doc.splitTextToSize(cleanForPDF(state.reasons), pageW - 36);
    reasonsWrap.forEach(line => {
      if (y > pageH - 30) { doc.addPage(); y = 20; }
      doc.text(line, 18, y);
      y += 4.5;
    });
    y += 8;

    /* REKOMENDASI PENGEMBANGAN */
    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('REKOMENDASI PENGEMBANGAN', 15, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const devWrap = doc.splitTextToSize(cleanForPDF(state.development), pageW - 36);
    devWrap.forEach(line => {
      if (y > pageH - 30) { doc.addPage(); y = 20; }
      doc.text(line, 18, y);
      y += 4.5;
    });
    y += 12;

    /* Tanda tangan */
    if (y > pageH - 50) { doc.addPage(); y = 20; }

    doc.setFontSize(9);
    doc.text('Assessor,', pageW - 60, y);
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(ADMIN_ASSESSOR, pageW - 60, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('(Admin)', pageW - 60, y + 4);

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
  async function uploadToGAS(pdfBlob) {
    const GAS_URL = (typeof GAS_UPLOAD_URL !== 'undefined' && GAS_UPLOAD_URL)
      || 'https://script.google.com/macros/s/AKfycbxCryXLdQXXbB2k6qxkmbZJF-L2ltL-QgTUygKLFAg0UNVm3NfKHDgso9nB-NomM4en/exec';

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });

    const cleanName = candidateName.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${cleanName}-Grafis-${ADMIN_ASSESSOR}.pdf`;

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

    console.log('[GRAFIS-INTERP] ✅ Uploaded to GAS —', filename);
  }

  /* ============================================================
     SUCCESS
     ============================================================ */
  function showSuccess() {
    const recOpt = RECOMMENDATION_OPTIONS.find(o => o.value === state.recommendation);
    const recLabel = recOpt ? recOpt.label : '-';
    const recColor = recOpt ? recOpt.color : [0, 0, 0];

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
            <div><b>Assessor:</b> ${escapeHtml(ADMIN_ASSESSOR)}</div>
            <div><b>Kandidat:</b> ${escapeHtml(candidateName)}</div>
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

  /* ============================================================
     RUN
     ============================================================ */
  function run() {
    hideDefaultUI();
    buildUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  setTimeout(run, 200);

})();
