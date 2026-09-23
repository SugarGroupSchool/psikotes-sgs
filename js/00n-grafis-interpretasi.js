/* ============================================================
   js/00n-grafis-interpretasi.js — Form Interpretasi Grafis v5
   ------------------------------------------------------------
   🔄 v5 [2026-09-23]:
   - Flow 3 kotak (DAP/BAUM/HTP) → klik → detail otomatis
   - Auto-generate interpretasi dari GRAFIS_AUTO_DATA
   - LocalStorage draft (biar tidak hilang kalau refresh)
   - Kop logo formal
   - 7 kategori + kesimpulan + rekomendasi tetap manual
   - Assessor otomatis = ADMIN
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     HELPERS (didefinisikan dulu — selalu tersedia)
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
     CEK MODE
     ============================================================ */
  const urlObj = new URL(window.location.href);
  const isGrafisMode = urlObj.searchParams.get('grafindo') === '1';

  if (isGrafisMode) window.__GRAFIS_MODE_ACTIVE = true;
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
    { value: 'HIGHLY_RECOMMENDED', label: '🌟 HIGHLY RECOMMENDED',                                  color: [22, 101, 52] },
    { value: 'RECOMMENDED',        label: '✅ RECOMMENDED',                                          color: [22, 163, 74] },
    { value: 'FAIRLY_RECOMMENDED', label: '⚠️ Fairly Recommended / Dipertimbangkan dengan Catatan', color: [217, 119, 6]  },
    { value: 'NOT_RECOMMENDED',    label: '❌ NOT RECOMMENDED',                                      color: [220, 38, 38]  }
  ];

  const candidateName     = urlObj.searchParams.get('n') || '(tanpa nama)';
  const candidatePosition = urlObj.searchParams.get('p') || '';

  console.log('[GRAFIS-INTERP] Mode aktif —', { candidateName, candidatePosition });

  /* ============================================================
     HIDE UI BAWAAN
     ============================================================ */
  function hideDefaultUI() {
    const appEl = document.getElementById('app');
    if (appEl) { appEl.style.display = 'none'; appEl.innerHTML = ''; }
    const pwd = document.getElementById('passwordScreen');
    if (pwd) pwd.style.display = 'none';
    if (document.body) {
      document.body.style.background = '#f5f3ff';
      document.body.style.overflow = 'auto';
    }
  }
  hideDefaultUI();
  setTimeout(hideDefaultUI, 100);
  setTimeout(hideDefaultUI, 500);

  /* ============================================================
     DRAFT KEY
     ============================================================ */
  const DRAFT_KEY = 'grafis_interp_draft_' + candidateSlug(candidateName);

  /* ============================================================
     STATE
     ============================================================ */
  const state = {
    activePage: 'landing',    // 'landing' | 'dap' | 'baum' | 'htp'
    selectedItems: {           // item terpilih per test
      dap:  {},
      baum: {},
      htp:  {}
    },
    categories: KATEGORI.map(name => ({ name, score: '', narrative: '' })),
    conclusion: '',
    recommendation: '',
    reasons: '',
    development: ''
  };

  /* Load draft */
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const draft = JSON.parse(raw);
      if (draft.selectedItems) state.selectedItems = Object.assign(state.selectedItems, draft.selectedItems);
      if (draft.categories)    state.categories = draft.categories;
      if (draft.conclusion)    state.conclusion = draft.conclusion;
      if (draft.recommendation) state.recommendation = draft.recommendation;
      if (draft.reasons)       state.reasons = draft.reasons;
      if (draft.development)   state.development = draft.development;
      console.log('[GRAFIS-INTERP] Draft dimuat');
    }
  } catch (e) {}

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        selectedItems: state.selectedItems,
        categories: state.categories,
        conclusion: state.conclusion,
        recommendation: state.recommendation,
        reasons: state.reasons,
        development: state.development
      }));
    } catch (e) {}
  }

  /* ============================================================
     AUTO-GENERATE INTERPRETASI
     ============================================================ */
  function generateAutoText(testKey) {
    const data = (window.GRAFIS_AUTO_DATA || {})[testKey];
    if (!data || !Array.isArray(data.groups)) return '';
    const selected = state.selectedItems[testKey] || {};
    const lines = [];

    data.groups.forEach(group => {
      const groupLines = [];

      (group.sections || []).forEach(section => {
        const val = selected[section.id];
        if (!val) return;

        const itemIds = Array.isArray(val) ? val : [val];
        itemIds.forEach(itemId => {
          const item = (section.items || []).find(i => i.id === itemId);
          if (!item) return;
          groupLines.push(`  • ${item.label}:\n    ${item.interpret}`);
        });
      });

      if (groupLines.length > 0) {
        lines.push(`${group.title}\n${groupLines.join('\n\n')}`);
      }
    });

    return lines.join('\n\n');
  }

  function countSelectedItems(testKey) {
    const selected = state.selectedItems[testKey] || {};
    let total = 0;
    Object.values(selected).forEach(val => {
      if (Array.isArray(val)) total += val.length;
      else if (val) total += 1;
    });
    return total;
  }

  /* ============================================================
     ROOT
     ============================================================ */
  function getRoot() {
    return document.getElementById('grafindoRoot');
  }

  /* ============================================================
     LANDING PAGE — 3 KOTAK + FORM MANUAL
     ============================================================ */
  function renderLanding() {
    const root = getRoot();
    if (!root) return;
    state.activePage = 'landing';

    const logoUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO)
      || 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png';

    const autoData = window.GRAFIS_AUTO_DATA || {};
    const testKeys = ['dap', 'baum', 'htp'];

    root.innerHTML = `
      <div style="max-width: 900px; margin: 0 auto 60px;">

        <!-- KOP -->
        <div style="background: #fff; border-radius: 18px 18px 0 0;
          padding: 22px 30px; border-bottom: 3px double #6d28d9;
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

        <!-- INFO KANDIDAT -->
        <div style="background: #fff; padding: 20px 30px; border-bottom: 1px solid #e2e8f0;">
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
        </div>

        <!-- FORM MANUAL -->
        <div style="background: #fff; padding: 26px 30px 30px; border-radius: 0 0 18px 18px;
          box-shadow: 0 20px 50px rgba(15,23,42,.08);">

          <!-- 3 KOTAK -->
          <div style="margin-bottom: 28px;">
            <div style="font-size: 15px; font-weight: 900; color: #1e293b; margin-bottom: 6px;">
              🖼️ Interpretasi Per Tes
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 16px; line-height: 1.6;">
              Klik salah satu kotak di bawah untuk memilih bagian / karakteristik gambar.
              Interpretasi akan otomatis disusun.
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;">
              ${testKeys.map(key => {
                const data = autoData[key] || {};
                const theme = data.theme || { primary: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' };
                const count = countSelectedItems(key);
                const hasData = (data.groups || []).length > 0;
                return `
                  <button type="button" class="js-open-test" data-test="${key}"
                    style="text-align: left; padding: 18px 20px;
                      background: ${hasData ? theme.bg : '#f8fafc'};
                      border: 2px solid ${hasData ? theme.border : '#e2e8f0'};
                      border-radius: 16px; cursor: pointer;
                      font-family: inherit; transition: all .18s ease;
                      position: relative; min-height: 150px;
                      display: flex; flex-direction: column;
                    "
                    onmouseover="if(${hasData}){this.style.transform='translateY(-3px)';this.style.boxShadow='0 10px 28px rgba(0,0,0,.08)';}"
                    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';"
                    ${hasData ? '' : 'disabled'}>
                    <div style="font-size: 34px; line-height: 1; margin-bottom: 12px;">
                      ${data.icon || '📄'}
                    </div>
                    <div style="font-size: 14px; font-weight: 900; color: ${hasData ? theme.primaryDark : '#94a3b8'};
                      margin-bottom: 4px;">
                      ${escapeHtml(data.title || key.toUpperCase())}
                    </div>
                    <div style="font-size: 11px; color: #64748b; line-height: 1.4; margin-bottom: 10px;">
                      ${escapeHtml(data.subtitle || '')}
                    </div>
                    <div style="margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
                      <span style="font-size: 10.5px; font-weight: 800;
                        color: ${count > 0 ? theme.primary : '#94a3b8'};
                        background: ${count > 0 ? '#fff' : '#f1f5f9'};
                        padding: 4px 10px; border-radius: 999px;
                        border: 1px solid ${count > 0 ? theme.border : '#e2e8f0'};">
                        ${hasData
                          ? (count > 0 ? `✓ ${count} item dipilih` : 'Belum diisi')
                          : 'Segera hadir'}
                      </span>
                      ${hasData ? `<span style="font-size: 18px; color: ${theme.primary};">→</span>` : ''}
                    </div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- 7 KATEGORI -->
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

          <!-- KESIMPULAN KESELURUHAN -->
          <div style="margin-bottom: 22px; padding: 20px 22px; background: #fffbeb;
            border: 2px solid #fde68a; border-radius: 16px;">
            <div style="font-size: 14px; font-weight: 900; color: #92400e; margin-bottom: 14px;">
              📝 KESIMPULAN KESELURUHAN (Manual)
            </div>
            <textarea id="giConclusion" rows="6"
              placeholder="Tulis kesimpulan keseluruhan..."
              style="width: 100%; padding: 14px 16px; border: 2px solid #fcd34d;
                border-radius: 12px; font-size: 14.5px; font-family: inherit;
                resize: vertical; outline: none; box-sizing: border-box;
                line-height: 1.6; min-height: 130px;">${escapeHtml(state.conclusion)}</textarea>
          </div>

          <!-- REKOMENDASI -->
          <div style="margin-bottom: 22px; padding: 20px 22px; background: #f0f9ff;
            border: 2px solid #bae6fd; border-radius: 16px;">
            <div style="font-size: 14px; font-weight: 900; color: #075985; margin-bottom: 14px;">
              ⭐ TINGKAT REKOMENDASI
            </div>
            <select id="giRecommendation"
              style="width: 100%; padding: 14px 16px; border: 2px solid #7dd3fc;
                border-radius: 12px; font-size: 15px; font-family: inherit;
                background: #fff; outline: none; cursor: pointer;">
              <option value="">— Pilih Rekomendasi —</option>
              ${RECOMMENDATION_OPTIONS.map(o =>
                `<option value="${o.value}" ${state.recommendation === o.value ? 'selected' : ''}>${o.label}</option>`
              ).join('')}
            </select>
          </div>

          <!-- ALASAN -->
          <div style="margin-bottom: 22px; padding: 20px 22px; background: #fef2f2;
            border: 2px solid #fecaca; border-radius: 16px;">
            <div style="font-size: 14px; font-weight: 900; color: #991b1b; margin-bottom: 14px;">
              📌 ALASAN REKOMENDASI (Manual)
            </div>
            <textarea id="giReasons" rows="5"
              placeholder="Tulis alasan mengapa tingkat rekomendasi tersebut diberikan..."
              style="width: 100%; padding: 14px 16px; border: 2px solid #fca5a5;
                border-radius: 12px; font-size: 14.5px; font-family: inherit;
                resize: vertical; outline: none; box-sizing: border-box;
                line-height: 1.6; min-height: 110px;">${escapeHtml(state.reasons)}</textarea>
          </div>

          <!-- PENGEMBANGAN -->
          <div style="margin-bottom: 26px; padding: 20px 22px; background: #f5f3ff;
            border: 2px solid #ddd6fe; border-radius: 16px;">
            <div style="font-size: 14px; font-weight: 900; color: #5b21b6; margin-bottom: 14px;">
              🚀 REKOMENDASI PENGEMBANGAN (Manual)
            </div>
            <textarea id="giDevelopment" rows="5"
              placeholder="Tulis saran pengembangan untuk kandidat..."
              style="width: 100%; padding: 14px 16px; border: 2px solid #c4b5fd;
                border-radius: 12px; font-size: 14.5px; font-family: inherit;
                resize: vertical; outline: none; box-sizing: border-box;
                line-height: 1.6; min-height: 110px;">${escapeHtml(state.development)}</textarea>
          </div>

          <!-- SUBMIT -->
          <button type="button" id="giSubmitBtn"
            style="width: 100%; padding: 16px; border: 0; border-radius: 14px;
              background: linear-gradient(135deg, #6d28d9, #a855f7);
              color: #fff; font-size: 16px; font-weight: 900; font-family: inherit;
              cursor: pointer; box-shadow: 0 10px 24px rgba(109,40,217,.28);">
            📤 Kirim Interpretasi Grafis
          </button>

          <div style="margin-top: 14px; text-align: center; font-size: 11.5px; color: #94a3b8;">
            PDF akan otomatis dibuat & terkirim ke panel admin.
          </div>
        </div>
      </div>
    `;

    // Bind 3 kotak
    root.querySelectorAll('.js-open-test').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const test = btn.getAttribute('data-test');
        renderTestDetail(test);
      });
    });

    // Render kategori
    renderCategories();

    // Bind manual fields
    const concl = document.getElementById('giConclusion');
    if (concl) concl.addEventListener('input', (e) => { state.conclusion = e.target.value; saveDraft(); });

    const rec = document.getElementById('giRecommendation');
    if (rec) rec.addEventListener('change', (e) => { state.recommendation = e.target.value; saveDraft(); });

    const reasons = document.getElementById('giReasons');
    if (reasons) reasons.addEventListener('input', (e) => { state.reasons = e.target.value; saveDraft(); });

    const dev = document.getElementById('giDevelopment');
    if (dev) dev.addEventListener('input', (e) => { state.development = e.target.value; saveDraft(); });

    const submit = document.getElementById('giSubmitBtn');
    if (submit) submit.addEventListener('click', handleSubmit);
  }

  /* ============================================================
     DETAIL PAGE — per test
     ============================================================ */
  function renderTestDetail(testKey) {
    const root = getRoot();
    if (!root) return;

    const data = (window.GRAFIS_AUTO_DATA || {})[testKey];
    if (!data) {
      alert('Data untuk ' + testKey + ' belum tersedia.');
      return;
    }

    state.activePage = testKey;
    const theme = data.theme || { primary: '#6d28d9', primaryDark: '#5b21b6', bg: '#f5f3ff', border: '#ddd6fe' };
    const selected = state.selectedItems[testKey] || {};

    // Bangun HTML section per section
    const sectionsHTML = (data.groups || []).map(group => {
      const sectionsInner = (group.sections || []).map(section => {
        const val = selected[section.id];
        const isRadio = section.type === 'radio';
        const itemsHTML = (section.items || []).map(item => {
          let isChecked = false;
          if (isRadio) isChecked = (val === item.id);
          else isChecked = Array.isArray(val) && val.includes(item.id);

          return `
            <label class="js-option-item" data-section="${section.id}" data-item="${item.id}" data-type="${section.type}"
              style="display: flex; align-items: flex-start; gap: 12px;
                padding: 12px 14px; margin-bottom: 8px;
                background: ${isChecked ? '#fff' : '#fbfdff'};
                border: 2px solid ${isChecked ? theme.primary : '#e2e8f0'};
                border-radius: 12px; cursor: pointer;
                transition: all .18s ease;
                user-select: none;">
              <div style="
                width: 20px; height: 20px; flex: 0 0 20px; margin-top: 1px;
                border: 2px solid ${isChecked ? theme.primary : '#cbd5e1'};
                background: ${isChecked ? theme.primary : '#fff'};
                ${isRadio ? 'border-radius: 50%;' : 'border-radius: 5px;'}
                display: grid; place-items: center; position: relative;">
                ${isChecked
                  ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                       stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                       <polyline points="20 6 9 17 4 12"/>
                     </svg>`
                  : ''}
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 13px; font-weight: 800;
                  color: ${isChecked ? theme.primaryDark : '#1e293b'};
                  line-height: 1.4; margin-bottom: 4px;">
                  ${escapeHtml(item.label)}
                </div>
                <div style="font-size: 11px; color: #64748b; line-height: 1.5;
                  ${isChecked ? '' : 'opacity:.7;'}">
                  ${escapeHtml(item.interpret)}
                </div>
              </div>
            </label>
          `;
        }).join('');

        return `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 12.5px; font-weight: 900; color: #334155;
              margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              ${isRadio
                ? '<span style="font-size: 10px; color: #94a3b8;">(pilih satu)</span>'
                : '<span style="font-size: 10px; color: #94a3b8;">(bisa pilih lebih dari satu)</span>'}
              ${escapeHtml(section.title)}
            </div>
            ${itemsHTML}
          </div>
        `;
      }).join('');

      return `
        <div style="margin-bottom: 28px; padding: 20px 22px;
          background: ${theme.bg}; border: 2px solid ${theme.border};
          border-radius: 16px;">
          <div style="font-size: 15px; font-weight: 900; color: ${theme.primaryDark};
            margin-bottom: 16px; padding-bottom: 10px;
            border-bottom: 1px dashed ${theme.border};">
            ${escapeHtml(group.title)}
          </div>
          ${sectionsInner}
        </div>
      `;
    }).join('');

    root.innerHTML = `
      <div style="max-width: 900px; margin: 0 auto 60px;">

        <!-- HEADER DETAIL -->
        <div style="background: ${theme.bg}; border: 2px solid ${theme.border};
          border-radius: 18px; padding: 20px 26px;
          display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
          <button type="button" id="giBackBtn"
            style="width: 44px; height: 44px; flex: 0 0 44px;
              display: grid; place-items: center;
              background: #fff; border: 1.5px solid ${theme.border};
              border-radius: 12px; color: ${theme.primaryDark};
              font-size: 20px; cursor: pointer; font-family: inherit;">
            ←
          </button>
          <div style="font-size: 34px; line-height: 1;">${data.icon || '📄'}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 10.5px; font-weight: 800; letter-spacing: 1.8px;
              color: ${theme.primary}; margin-bottom: 4px;">
              INTERPRETASI OTOMATIS
            </div>
            <div style="font-size: 19px; font-weight: 900; color: #1e293b;
              letter-spacing: -.3px;">
              ${escapeHtml(data.title)}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
              ${escapeHtml(data.subtitle || '')}
            </div>
          </div>
        </div>

        <!-- SECTION -->
        <div style="background: #fff; padding: 22px 26px 26px;
          border-radius: 18px; box-shadow: 0 20px 50px rgba(15,23,42,.08);">
          ${sectionsHTML || '<div style="text-align:center;padding:40px;color:#94a3b8;">Belum ada data untuk tes ini.</div>'}

          <!-- ACTION -->
          <div style="display: flex; gap: 10px; margin-top: 20px;
            padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <button type="button" id="giClearBtn"
              style="flex: 1; padding: 14px; border: 2px solid #fca5a5;
                background: #fff; color: #dc2626; border-radius: 12px;
                font-family: inherit; font-size: 14px; font-weight: 800;
                cursor: pointer;">
              🗑️ Hapus Semua Pilihan
            </button>
            <button type="button" id="giSaveBtn"
              style="flex: 2; padding: 14px; border: 0;
                background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark});
                color: #fff; border-radius: 12px;
                font-family: inherit; font-size: 15px; font-weight: 900;
                cursor: pointer;
                box-shadow: 0 8px 20px rgba(0,0,0,.12);">
              💾 Simpan & Kembali
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind option clicks
    root.querySelectorAll('.js-option-item').forEach(label => {
      label.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = label.getAttribute('data-section');
        const itemId = label.getAttribute('data-item');
        const type = label.getAttribute('data-type');

        if (type === 'radio') {
          state.selectedItems[testKey][sectionId] = itemId;
        } else {
          let arr = state.selectedItems[testKey][sectionId];
          if (!Array.isArray(arr)) arr = [];
          const idx = arr.indexOf(itemId);
          if (idx >= 0) arr.splice(idx, 1);
          else arr.push(itemId);
          state.selectedItems[testKey][sectionId] = arr.length ? arr : undefined;
        }
        saveDraft();
        renderTestDetail(testKey); // re-render
      });
    });

    // Back
    document.getElementById('giBackBtn').addEventListener('click', () => {
      saveDraft();
      renderLanding();
    });

    // Clear
    document.getElementById('giClearBtn').addEventListener('click', () => {
      if (!confirm('Hapus semua pilihan untuk ' + data.title + '?')) return;
      state.selectedItems[testKey] = {};
      saveDraft();
      renderTestDetail(testKey);
    });

    // Save
    document.getElementById('giSaveBtn').addEventListener('click', () => {
      saveDraft();
      renderLanding();
    });
  }

   /* ============================================================
   🆕 NOTES GABUNGAN — auto-generate dari semua pilihan
   ============================================================ */
function generateCombinedNotes() {
  const autoData = window.GRAFIS_AUTO_DATA || {};
  const testKeys = ['dap', 'baum', 'htp'];
  const lines = [];

  testKeys.forEach(key => {
    const data = autoData[key];
    if (!data || !data.groups) return;

    const selected = state.selectedItems[key] || {};
    const selectedLines = [];

    data.groups.forEach(group => {
      (group.sections || []).forEach(section => {
        const val = selected[section.id];
        if (!val) return;

        const itemIds = Array.isArray(val) ? val : [val];
        itemIds.forEach(itemId => {
          const item = (section.items || []).find(i => i.id === itemId);
          if (!item) return;

          // Cek duplikat — jika interpretasi sama, skip
          if (selectedLines.some(l => l.text === item.interpret)) return;

          selectedLines.push({
            label: item.label,
            text: item.interpret,
            group: group.title
          });
        });
      });
    });

    if (selectedLines.length > 0) {
      lines.push({
        key,
        title: data.title || key.toUpperCase(),
        icon: data.icon || '📄',
        items: selectedLines
      });
    }
  });

  return lines;
}

function renderCombinedNotes() {
  const container = document.getElementById('giCombinedNotes');
  if (!container) return;

  const notesData = generateCombinedNotes();
  const hasAny = notesData.length > 0;

  if (!hasAny) {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #94a3b8;
        font-size: 13px; border: 2px dashed #e2e8f0; border-radius: 12px;
        background: #f8fafc;">
        📝 Belum ada pilihan. Klik kotak DAP / BAUM / HTP di atas untuk memilih bagian.
        <br><span style="font-size: 11.5px; opacity: .7;">Notes akan otomatis muncul di sini.</span>
      </div>`;
    return;
  }

  // Generate plain text version (untuk copy)
  const plainText = notesData.map(t => {
    const header = `═══ ${t.title} ═══`;
    const items = t.items.map(i => `• ${i.label}:\n  ${i.text}`).join('\n\n');
    return `${header}\n\n${items}`;
  }).join('\n\n\n');

  // Escape untuk JSON string di onclick
  const escaped = plainText.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/'/g, "\\'").replace(/\n/g, '\\n');

  const totalItems = notesData.reduce((sum, t) => sum + t.items.length, 0);

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
      <div>
        <div style="font-size: 14px; font-weight: 900; color: #1e293b;">
          📝 Notes Gabungan
        </div>
        <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">
          ${totalItems} item dari ${notesData.length} tes — siap copy-paste untuk kesimpulan
        </div>
      </div>
      <button type="button" id="giCopyNotesBtn"
        style="padding: 9px 16px; border: 0; border-radius: 10px;
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: #fff; font-family: inherit; font-size: 12.5px; font-weight: 800;
          cursor: pointer; box-shadow: 0 6px 16px rgba(14,165,233,.28);
          display: inline-flex; align-items: center; gap: 6px;">
        📋 Copy Semua Notes
      </button>
    </div>

    <div id="giNotesContent"
      style="max-height: 420px; overflow-y: auto; padding: 16px 18px;
        background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px;
        font-family: 'Courier New', ui-monospace, monospace;
        font-size: 12.5px; line-height: 1.7; color: #1e293b;
        white-space: pre-wrap; word-break: break-word;
        scrollbar-width: thin;">
${notesData.map(t => `
<span style="color: #6d28d9; font-weight: 900;">═══ ${t.icon} ${escapeHtml(t.title)} ═══</span>

${t.items.map(i => `<span style="color: #0369a1; font-weight: 800;">• ${escapeHtml(i.label)}:</span>
  ${escapeHtml(i.text)}`).join('\n\n')}
`).join('\n\n\n')}
    </div>

    <div style="margin-top: 10px; padding: 10px 14px;
      background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;
      font-size: 11.5px; color: #1e40af; line-height: 1.6;">
      💡 <b>Tips:</b> Klik <b>Copy Semua Notes</b> lalu paste di kolom
      <b>Kesimpulan Keseluruhan</b> di bawah — tinggal edit dan rapikan sesuai gaya Anda.
    </div>
  `;

  // Wire copy button
  const copyBtn = document.getElementById('giCopyNotesBtn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(plainText).then(() => {
            const prev = copyBtn.innerHTML;
            copyBtn.innerHTML = '✅ Tersalin!';
            copyBtn.style.background = 'linear-gradient(135deg, #16a34a, #059669)';
            setTimeout(() => {
              copyBtn.innerHTML = prev;
              copyBtn.style.background = 'linear-gradient(135deg, #0ea5e9, #0284c7)';
            }, 1800);
          }).catch(() => fallbackCopyText(plainText));
        } else {
          fallbackCopyText(plainText);
        }
      } catch (e) {
        fallbackCopyText(plainText);
      }
    };
  }
}

function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
}
   
  /* ============================================================
     7 KATEGORI
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
          <div style="width: 34px; height: 34px; flex: 0 0 34px;
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
            outline: none; resize: vertical; box-sizing: border-box;"
        >${escapeHtml(cat.narrative)}</textarea>
      </div>
    `).join('');

    container.querySelectorAll('.gi-cat-score').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const i = Number(e.target.getAttribute('data-idx'));
        const v = e.target.value;
        state.categories[i].score = v ? Number(v) : '';
        saveDraft();
      });
    });

    container.querySelectorAll('.gi-cat-narrative').forEach(ta => {
      ta.addEventListener('input', (e) => {
        const i = Number(e.target.getAttribute('data-idx'));
        state.categories[i].narrative = e.target.value;
        saveDraft();
      });
    });
  }

  /* ============================================================
     SUBMIT
     ============================================================ */
  async function handleSubmit() {
    // Validasi test
    const dapCount  = countSelectedItems('dap');
    const baumCount = countSelectedItems('baum');
    const htpCount  = countSelectedItems('htp');
    const hasAnyTest = dapCount > 0 || baumCount > 0 || htpCount > 0;
    if (!hasAnyTest) { alert('Pilih minimal 1 item di DAP/BAUM/HTP.'); return; }

    // Validasi kategori
    for (let i = 0; i < state.categories.length; i++) {
      const c = state.categories[i];
      if (!c.score) { alert(`Kategori ${i + 1} (${c.name}) belum diisi skor.`); return; }
      if (!c.narrative.trim()) { alert(`Kategori ${i + 1} (${c.name}) belum diisi narasi.`); return; }
    }

    state.conclusion = (document.getElementById('giConclusion')?.value || '').trim();
    if (!state.conclusion) { alert('Kesimpulan keseluruhan wajib diisi.'); return; }

    state.recommendation = document.getElementById('giRecommendation')?.value || '';
    if (!state.recommendation) { alert('Pilih tingkat rekomendasi.'); return; }

    state.reasons = (document.getElementById('giReasons')?.value || '').trim();
    if (!state.reasons) { alert('Alasan rekomendasi wajib diisi.'); return; }

    state.development = (document.getElementById('giDevelopment')?.value || '').trim();
    if (!state.development) { alert('Rekomendasi pengembangan wajib diisi.'); return; }

    const btn = document.getElementById('giSubmitBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Mengirim...';

    try {
      await saveToFirebase();
      btn.textContent = '📄 Membuat PDF...';
      const pdfBlob = await generatePDF();
      btn.textContent = '📤 Mengupload...';
      await uploadToGAS(pdfBlob);
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
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
        selectedItems: state.selectedItems,
        dapText: generateAutoText('dap'),
        baumText: generateAutoText('baum'),
        htpText: generateAutoText('htp'),
        categories: state.categories,
        conclusion: state.conclusion,
        recommendation: state.recommendation,
        recommendationLabel: recLabel,
        reasons: state.reasons,
        development: state.development,
        ts: firebase.database.ServerValue.TIMESTAMP
      });
    console.log('[GRAFIS-INTERP] ✅ Saved');
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

    try {
      const logoUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO)
        || 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png';
      const imgData = await fetchImageAsDataURL(logoUrl);
      doc.addImage(imgData, 'PNG', pageW / 2 - 12, 10, 24, 20);
    } catch (e) {}

    let y = 38;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('LAPORAN INTERPRETASI GRAFIS', pageW / 2, y, { align: 'center' }); y += 5.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('SUGAR GROUP SCHOOLS', pageW / 2, y, { align: 'center' }); y += 5;
    doc.setFontSize(8);
    doc.text('DAP · BAUM · HTP', pageW / 2, y, { align: 'center' }); y += 6;
    doc.setDrawColor(109, 40, 217); doc.setLineWidth(0.6);
    doc.line(15, y, pageW - 15, y); doc.setLineWidth(0.2); y += 1.5;
    doc.line(15, y, pageW - 15, y); y += 8;

    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('INFORMASI KANDIDAT', 15, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);

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
    doc.setDrawColor(220); doc.line(15, y, pageW - 15, y); y += 8;

    // Helper cetak paragraf
    function printParagraph(text, indent = 18, fontSize = 9) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(fontSize);
      const wrapped = doc.splitTextToSize(cleanForPDF(text), pageW - 36);
      wrapped.forEach(line => {
        if (y > pageH - 25) { doc.addPage(); y = 20; }
        doc.text(line, indent, y);
        y += 4.5;
      });
    }

    // Section per test
    ['dap', 'baum', 'htp'].forEach(key => {
      const count = countSelectedItems(key);
      if (count === 0) return;
      const data = (window.GRAFIS_AUTO_DATA || {})[key] || {};

      if (y > pageH - 40) { doc.addPage(); y = 20; }
      doc.setDrawColor(220); doc.line(15, y, pageW - 15, y); y += 6;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text(cleanForPDF(data.title || key.toUpperCase()), 15, y); y += 7;

      const autoText = generateAutoText(key);
      autoText.split('\n').forEach(line => {
        if (!line.trim()) { y += 2; return; }
        if (y > pageH - 25) { doc.addPage(); y = 20; }
        if (line.startsWith('  •') || line.startsWith('    ')) {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
          const wrapped = doc.splitTextToSize(cleanForPDF(line), pageW - 40);
          wrapped.forEach(w => {
            if (y > pageH - 25) { doc.addPage(); y = 20; }
            doc.text(w, 22, y); y += 4.2;
          });
        } else {
          doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
          doc.text(cleanForPDF(line), 18, y); y += 5;
        }
      });
      y += 4;
    });

    // Kategori 7
    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setDrawColor(220); doc.line(15, y, pageW - 15, y); y += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('KESIMPULAN', 15, y); y += 8;

    state.categories.forEach((cat, idx) => {
      if (y > pageH - 40) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      const titleLine = `${idx + 1}. ${cleanForPDF(cat.name)} — SKOR: ${cat.score}/4`;
      const titleWrap = doc.splitTextToSize(titleLine, pageW - 36);
      titleWrap.forEach(t => { doc.text(t, 18, y); y += 5; });
      y += 1;
      printParagraph(cat.narrative, 22, 9);
      y += 6;
    });

    // Kesimpulan keseluruhan
    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setDrawColor(220); doc.line(15, y, pageW - 15, y); y += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('KESIMPULAN KESELURUHAN', 15, y); y += 7;
    printParagraph(state.conclusion, 18, 9);
    y += 8;

    // Rekomendasi
    const recOpt = RECOMMENDATION_OPTIONS.find(o => o.value === state.recommendation);
    const recLabel = recOpt ? recOpt.label : '-';
    const recColor = recOpt ? recOpt.color : [0, 0, 0];
    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('TINGKAT REKOMENDASI', 15, y); y += 7;
    doc.setFontSize(12);
    doc.setTextColor(recColor[0], recColor[1], recColor[2]);
    doc.splitTextToSize(cleanForPDF(recLabel), pageW - 36).forEach(line => {
      doc.text(line, 18, y); y += 6;
    });
    doc.setTextColor(0, 0, 0); y += 6;

    // Alasan
    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('ALASAN REKOMENDASI', 15, y); y += 7;
    printParagraph(state.reasons, 18, 9);
    y += 8;

    // Pengembangan
    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('REKOMENDASI PENGEMBANGAN', 15, y); y += 7;
    printParagraph(state.development, 18, 9);
    y += 12;

    // Tanda tangan
    if (y > pageH - 50) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('Assessor,', pageW - 60, y); y += 20;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(ADMIN_ASSESSOR, pageW - 60, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
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

    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        idToken, action: 'upload',
        deviceId: 'grafindo_' + Date.now(),
        filename, name: candidateName, position: candidatePosition,
        email: '', pdfBase64: base64, pdfPassword: '-'
      })
    });

    await new Promise(r => setTimeout(r, 1500));

    try {
      if (typeof firebase !== 'undefined' && firebase.apps.length) {
        firebase.database().ref('sgs_state/lastUpload').set({
          ts: firebase.database.ServerValue.TIMESTAMP,
          type: 'pdf', name: candidateName, position: candidatePosition,
          deviceId: 'grafindo'
        }).catch(() => {});
      }
    } catch (e) {}
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
            display: grid; place-items: center;
            background: linear-gradient(135deg, #d1fae5, #ecfdf5);
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
  let __uiBuilt = false;
  function run() {
    if (__uiBuilt) return;
    __uiBuilt = true;

    const existing = document.getElementById('grafindoRoot');
    if (existing) existing.remove();

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

    renderLanding();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  }
  setTimeout(run, 200);

})();
