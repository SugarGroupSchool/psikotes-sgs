/* ============================================================
   js/00n-grafis-interpretasi.js — Form Interpretasi Grafis v7.1
   ------------------------------------------------------------
   v7.1 [2026-09-25]:
   - 🐛 FIX: data.groups → data.slides (sesuai struktur baru)
   - 🆕 LAYOUT 2-KOLOM: gambar kandidat (kiri) + pilihan (kanan)
   - 🆕 PANEL GAMBAR: upload / drag / paste / URL + zoom / ganti / hapus
   - 🆕 AUTO-LOAD gambar dari Firebase (sgs_grafis_images)
   - 🆕 STEPPER: 1 slide per layar
   - 🆕 NOTES GABUNGAN
   ============================================================ */

(function () {
  'use strict';

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
     AUTO-LOAD GAMBAR DARI FIREBASE
     ============================================================ */
  async function loadCandidateImagesFromFirebase(retryCount) {
    retryCount = retryCount || 0;

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      if (retryCount < 6) {
        await new Promise(r => setTimeout(r, 500));
        return loadCandidateImagesFromFirebase(retryCount + 1);
      }
      console.warn('[GRAFIS-INTERP] Firebase belum siap, skip auto-load');
      return;
    }

    const slug = candidateSlug(candidateName);
    if (!slug) return;

    try {
      const snap = await firebase.database()
        .ref('sgs_grafis_images/' + slug)
        .once('value');

      const data = snap.val();
      if (!data || !data.images) {
        console.log('[GRAFIS-INTERP] Tidak ada gambar tersimpan untuk:', slug);
        return;
      }

      const imgs = data.images;
      if (imgs.dap  && imgs.dap.dataUrl  && !state.candidateImages.dap)  state.candidateImages.dap  = imgs.dap.dataUrl;
      if (imgs.baum && imgs.baum.dataUrl && !state.candidateImages.baum) state.candidateImages.baum = imgs.baum.dataUrl;
      if (imgs.htp  && imgs.htp.dataUrl  && !state.candidateImages.htp)  state.candidateImages.htp  = imgs.htp.dataUrl;

      console.log('[GRAFIS-INTERP] ✅ Gambar kandidat berhasil dimuat dari Firebase');
    } catch (e) {
      console.warn('[GRAFIS-INTERP] Gagal load gambar:', e.message);
    }
  }

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
     DRAFT KEY & STATE
     ============================================================ */
  const DRAFT_KEY = 'grafis_interp_draft_' + candidateSlug(candidateName);

  const state = {
    activePage: 'landing',
    selectedItems: { dap: {}, baum: {}, htp: {} },
    candidateImages: { dap: '', baum: '', htp: '' },
candidateImageZoom: { dap: 1, baum: 1, htp: 1 },   // 🆕 zoom level (1 = 100%)
currentStep: { dap: 0, baum: 0, htp: 0 },
    categories: KATEGORI.map(name => ({ name, score: '', narrative: '' })),
    conclusion: '',
    recommendation: '',
    reasons: '',
    development: ''
  };

  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const draft = JSON.parse(raw);
      if (draft.selectedItems)   state.selectedItems   = Object.assign(state.selectedItems, draft.selectedItems);
      if (draft.candidateImages) state.candidateImages = Object.assign(state.candidateImages, draft.candidateImages);
      if (draft.candidateImageZoom) state.candidateImageZoom = Object.assign(state.candidateImageZoom, draft.candidateImageZoom);
      if (draft.currentStep)     state.currentStep     = Object.assign(state.currentStep, draft.currentStep);
      if (draft.categories)      state.categories      = draft.categories;
      if (draft.conclusion)      state.conclusion      = draft.conclusion;
      if (draft.recommendation)  state.recommendation  = draft.recommendation;
      if (draft.reasons)         state.reasons         = draft.reasons;
      if (draft.development)     state.development     = draft.development;
      console.log('[GRAFIS-INTERP] Draft dimuat');
    }
  } catch (e) {}

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        selectedItems:       state.selectedItems,
candidateImages:     state.candidateImages,
candidateImageZoom:  state.candidateImageZoom,
currentStep:         state.currentStep,
        categories:      state.categories,
        conclusion:      state.conclusion,
        recommendation:  state.recommendation,
        reasons:         state.reasons,
        development:     state.development
      }));
    } catch (e) {}
  }

  /* ============================================================
     AUTO-GENERATE INTERPRETASI
     ============================================================ */
  function generateAutoText(testKey) {
    const data = (window.GRAFIS_AUTO_DATA || {})[testKey];
    if (!data || !Array.isArray(data.slides)) return '';           /* ← FIX */
    const selected = state.selectedItems[testKey] || {};
    const lines = [];

    data.slides.forEach(group => {                                  /* ← FIX */
      const groupLines = [];
      (group.sections || []).forEach(section => {
        const val = selected[section.id];
        if (!val) return;
        const itemIds = Array.isArray(val) ? val : [val];
        itemIds.forEach(itemId => {
          const item = (section.items || []).find(i => i.id === itemId);
          if (!item) return;
          groupLines.push(`  • ${item.label}:\n    ${item.interpret}`);
          (item.subItems || []).forEach(sub => {
            const subKey = section.id + '::' + sub.id;
            if (selected[subKey]) {
              groupLines.push(`    ◦ ${sub.label}:\n      ${sub.interpret}`);
            }
          });
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
     NOTES GABUNGAN
     ============================================================ */
  function generateCombinedNotes() {
    const autoData = window.GRAFIS_AUTO_DATA || {};
    const testKeys = ['dap', 'baum', 'htp'];
    const lines = [];

    testKeys.forEach(key => {
      const data = autoData[key];
      if (!data || !data.slides) return;                            /* ← FIX */

      const selected = state.selectedItems[key] || {};
      const selectedLines = [];

      data.slides.forEach(group => {                                /* ← FIX */
        (group.sections || []).forEach(section => {
          const val = selected[section.id];
          if (!val) return;

          const itemIds = Array.isArray(val) ? val : [val];
          itemIds.forEach(itemId => {
            const item = (section.items || []).find(i => i.id === itemId);
            if (!item) return;

            if (!selectedLines.some(l => l.text === item.interpret)) {
              selectedLines.push({ label: item.label, text: item.interpret, group: group.title });
            }

            (item.subItems || []).forEach(sub => {
              const subKey = section.id + '::' + sub.id;
              if (selected[subKey] && !selectedLines.some(l => l.text === sub.interpret)) {
                selectedLines.push({ label: '↳ ' + sub.label, text: sub.interpret, group: group.title });
              }
            });
          });
        });

        (group.sections || []).forEach(section => {
          Object.keys(selected).forEach(k => {
            if (!k.startsWith(section.id + '::')) return;
            const subId = k.slice(section.id.length + 2);
            if (!selected[k]) return;
            (section.items || []).forEach(parent => {
              (parent.subItems || []).forEach(sub => {
                if (sub.id !== subId) return;
                if (selectedLines.some(l => l.text === sub.interpret)) return;
                selectedLines.push({ label: '↳ ' + sub.label, text: sub.interpret, group: group.title });
              });
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

    if (notesData.length === 0) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #94a3b8;
          font-size: 13px; border: 2px dashed #e2e8f0; border-radius: 12px;
          background: #f8fafc;">
          📝 Belum ada pilihan. Klik kotak DAP / BAUM / HTP di atas untuk memilih bagian.
          <br><span style="font-size: 11.5px; opacity: .7;">Notes akan otomatis muncul di sini.</span>
        </div>`;
      return;
    }

    const plainText = notesData.map(t => {
      const header = `═══ ${t.title} ═══`;
      const items = t.items.map(i => `• ${i.label}:\n  ${i.text}`).join('\n\n');
      return `${header}\n\n${items}`;
    }).join('\n\n\n');

    const totalItems = notesData.reduce((sum, t) => sum + t.items.length, 0);

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
        <div>
          <div style="font-size: 14px; font-weight: 900; color: #1e293b;">📝 Notes Gabungan</div>
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
          white-space: pre-wrap; word-break: break-word; scrollbar-width: thin;">
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
        <b>Kesimpulan Keseluruhan</b> di bawah.
      </div>
    `;

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
        } catch (e) { fallbackCopyText(plainText); }
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
     ROOT
     ============================================================ */
  function getRoot() {
    return document.getElementById('grafindoRoot');
  }

  /* ============================================================
     LANDING PAGE
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

        <div style="background: #fff; padding: 26px 30px 30px; border-radius: 0 0 18px 18px;
          box-shadow: 0 20px 50px rgba(15,23,42,.08);">

          <div style="margin-bottom: 28px;">
            <div style="font-size: 15px; font-weight: 900; color: #1e293b; margin-bottom: 6px;">
              🖼️ Interpretasi Per Tes
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 16px; line-height: 1.6;">
              Klik salah satu kotak di bawah untuk memilih bagian / karakteristik gambar.
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;">
              ${testKeys.map(key => {
                const data = autoData[key] || {};
                const theme = data.theme || { primary: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' };
                const count = countSelectedItems(key);
                const hasData = (data.slides || []).length > 0;      /* ← FIX */
                return `
                  <button type="button" class="js-open-test" data-test="${key}"
                    style="text-align: left; padding: 18px 20px;
                      background: ${hasData ? theme.bg : '#f8fafc'};
                      border: 2px solid ${hasData ? theme.border : '#e2e8f0'};
                      border-radius: 16px; cursor: pointer;
                      font-family: inherit; transition: all .18s ease;
                      position: relative; min-height: 150px;
                      display: flex; flex-direction: column;"
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
                        ${hasData ? (count > 0 ? `✓ ${count} item dipilih` : 'Belum diisi') : 'Segera hadir'}
                      </span>
                      ${hasData ? `<span style="font-size: 18px; color: ${theme.primary};">→</span>` : ''}
                    </div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div style="margin-bottom: 28px; padding: 20px 22px;
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            border: 2px solid #7dd3fc; border-radius: 16px;">
            <div id="giCombinedNotes"></div>
          </div>

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

    root.querySelectorAll('.js-open-test').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const test = btn.getAttribute('data-test');
        renderTestDetail(test);
      });
    });

    renderCombinedNotes();
    renderCategories();

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
     DETAIL PAGE — 2-KOLOM + STEPPER + PANEL GAMBAR
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
   const currentZoom = state.candidateImageZoom[testKey] || 1;
const zoomPct = Math.round(currentZoom * 100);

    /* ===== Konten pilihan interpretasi (per slide) ===== */
    const sectionsHTML = (data.slides || []).map((group, stepIdx) => {    /* ← FIX */
      const sectionsInner = (group.sections || []).map(section => {
        const val = selected[section.id];
        const isRadio = section.type === 'radio';
        const itemsHTML = (section.items || []).map(item => {
          let isChecked = false;
          if (isRadio) isChecked = (val === item.id);
          else isChecked = Array.isArray(val) && val.includes(item.id);

          let subItemsHTML = '';
          if (item.subItems && item.subItems.length && isChecked) {
            subItemsHTML = item.subItems.map(sub => {
              const subKey = section.id + '::' + sub.id;
              const subChecked = !!selected[subKey];
              return `
                <label class="js-subitem" data-key="${subKey}"
                  style="display: flex; align-items: flex-start; gap: 12px;
                    padding: 10px 14px; margin: 6px 0 8px 32px;
                    background: ${subChecked ? '#fff' : '#f8fafc'};
                    border: 2px dashed ${subChecked ? theme.primary : '#cbd5e1'};
                    border-radius: 10px; cursor: pointer;
                    transition: all .18s ease; user-select: none;">
                  <div style="width: 18px; height: 18px; flex: 0 0 18px; margin-top: 1px;
                    border: 2px solid ${subChecked ? theme.primary : '#cbd5e1'};
                    background: ${subChecked ? theme.primary : '#fff'};
                    border-radius: 5px; display: grid; place-items: center;">
                    ${subChecked ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/></svg>` : ''}
                  </div>
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 12.5px; font-weight: 800;
                      color: ${subChecked ? theme.primaryDark : '#334155'};
                      line-height: 1.4; margin-bottom: 3px;">
                      ↳ ${escapeHtml(sub.label)}
                      ${sub.optional ? `<span style="font-size: 10px; font-weight: 700; color: #94a3b8; margin-left: 4px;">(opsional)</span>` : ''}
                    </div>
                    <div style="font-size: 11px; color: #64748b; line-height: 1.5;">
                      ${escapeHtml(sub.interpret)}
                    </div>
                  </div>
                </label>
              `;
            }).join('');
          }

          return `
            <div>
              <label class="js-option-item" data-section="${section.id}" data-item="${item.id}" data-type="${section.type}"
                style="display: flex; align-items: flex-start; gap: 12px;
                  padding: 12px 14px; margin-bottom: 8px;
                  background: ${isChecked ? '#fff' : '#fbfdff'};
                  border: 2px solid ${isChecked ? theme.primary : '#e2e8f0'};
                  border-radius: 12px; cursor: pointer;
                  transition: all .18s ease; user-select: none;">
                <div style="
                  width: 20px; height: 20px; flex: 0 0 20px; margin-top: 1px;
                  border: 2px solid ${isChecked ? theme.primary : '#cbd5e1'};
                  background: ${isChecked ? theme.primary : '#fff'};
                  ${isRadio ? 'border-radius: 50%;' : 'border-radius: 5px;'}
                  display: grid; place-items: center;">
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
              ${subItemsHTML}
            </div>
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
        <div class="gi-step" data-step="${stepIdx}"
          style="margin-bottom: 28px; padding: 20px 22px;
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

    /* ===== Panel kiri: gambar kandidat ===== */
  const candidatePanelHTML = currentImg
  ? `
    <div style="position: relative;">
      <div id="giImageScrollWrap"
        style="overflow: auto; max-height: 82vh; background: #f8fafc;
          border: 1.5px solid #e2e8f0; border-radius: 12px;
          scrollbar-width: thin;">
        <img id="giCandidateImg" src="${currentImg}" alt="Gambar Kandidat"
          style="display: block; width: ${zoomPct}%; max-width: none;
            height: auto; background: #fff; margin: 0 auto;
            transition: width .18s ease;">
      </div>
      <div style="position: absolute; top: 8px; right: 8px;
        display: flex; gap: 6px; z-index: 5;">
        <button type="button" id="giImageFullscreenBtn" title="Fullscreen"
          style="width: 34px; height: 34px; border-radius: 8px;
            background: rgba(15,23,42,.75); color: #fff; border: 0;
            font-size: 16px; cursor: pointer;">🔍</button>
        <button type="button" id="giImageReplaceBtn" title="Ganti"
          style="width: 34px; height: 34px; border-radius: 8px;
            background: rgba(15,23,42,.75); color: #fff; border: 0;
            font-size: 16px; cursor: pointer;">🔄</button>
        <button type="button" id="giImageRemoveBtn" title="Hapus"
          style="width: 34px; height: 34px; border-radius: 8px;
            background: rgba(220,38,38,.85); color: #fff; border: 0;
            font-size: 16px; cursor: pointer;">🗑️</button>
      </div>
    </div>

    <!-- 🆕 Kontrol Zoom -->
    <div style="display: flex; align-items: center; justify-content: center;
      gap: 8px; margin-top: 12px; padding: 8px;
      background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px;">
      <button type="button" id="giZoomOutBtn" title="Perkecil"
        style="width: 38px; height: 38px; border-radius: 9px;
          background: #fff; color: #334155;
          border: 1.5px solid #cbd5e1;
          font-size: 20px; font-weight: 900;
          cursor: pointer; font-family: inherit; line-height: 1;">
        −
      </button>
      <button type="button" id="giZoomResetBtn" title="Reset"
        style="min-width: 70px; height: 38px; padding: 0 14px;
          border-radius: 9px; background: #fff; color: ${theme.primaryDark};
          border: 1.5px solid ${theme.border};
          font-size: 13px; font-weight: 900; cursor: pointer;
          font-family: inherit;">
        ${zoomPct}%
      </button>
      <button type="button" id="giZoomInBtn" title="Perbesar"
        style="width: 38px; height: 38px; border-radius: 9px;
          background: ${theme.primary}; color: #fff;
          border: 0; font-size: 20px; font-weight: 900;
          cursor: pointer; font-family: inherit; line-height: 1;">
        +
      </button>
    </div>

    <div style="margin-top: 8px; font-size: 11px; color: #64748b;
      text-align: center; line-height: 1.5;">
      🔍 Fullscreen · 🔄 Ganti · 🗑️ Hapus · Ctrl+V paste<br>
      <span style="opacity:.75;">Gunakan tombol + / − untuk zoom gambar</span>
    </div>
  `
  : `
        <div id="giImageDropZone"
          style="padding: 26px 18px; text-align: center;
            background: #f8fafc; border: 2px dashed #cbd5e1;
            border-radius: 12px; cursor: pointer; transition: all .18s ease;">
          <div style="font-size: 40px; line-height: 1; margin-bottom: 10px; opacity: .55;">📷</div>
          <div style="font-size: 13px; font-weight: 800; color: #475569; margin-bottom: 6px;">
            Upload Gambar Kandidat
          </div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin-bottom: 14px;">
            Klik / drag ke sini.<br>Bisa juga paste screenshot (Ctrl+V).
          </div>
          <button type="button" id="giImagePickBtn"
            style="padding: 9px 18px;
              background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark});
              color: #fff; border: 0; border-radius: 9px;
              font-family: inherit; font-size: 12px; font-weight: 800;
              cursor: pointer;">
            📁 Pilih File
          </button>
          <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed #e2e8f0;">
            <div style="font-size: 10.5px; font-weight: 700; color: #94a3b8; margin-bottom: 6px;">
              ATAU PASTE URL GAMBAR
            </div>
            <input type="text" id="giImageUrlInput" placeholder="https://..."
              style="width: 100%; padding: 9px 12px; border: 1.5px solid #e2e8f0;
                border-radius: 8px; font-family: inherit; font-size: 11.5px;
                outline: none; box-sizing: border-box; background: #fff;">
            <button type="button" id="giImageUrlBtn"
              style="margin-top: 6px; width: 100%; padding: 8px;
                background: #f1f5f9; color: #475569; border: 0;
                border-radius: 8px; font-family: inherit; font-size: 11px;
                font-weight: 800; cursor: pointer;">
              Terapkan URL
            </button>
          </div>
        </div>
        <input type="file" id="giImageFileInput" accept="image/*" style="display: none;">
      `;

    /* ===== Render halaman ===== */
    root.innerHTML = `
      <style>
       .gi-detail-layout {
  display: grid;
  grid-template-columns: minmax(420px, 1.6fr) minmax(300px, 1fr);
  gap: 20px;
  align-items: start;
}
        .gi-detail-left-sticky {
          position: sticky;
          top: 20px;
        }
        .gi-drop-active {
          background: ${theme.bg} !important;
          border-color: ${theme.primary} !important;
        }
        .gi-step { display: none; }
        .gi-step.is-active { display: block; }
        .gi-nav {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin-top: 24px; padding-top: 20px;
          border-top: 1.5px dashed #e2e8f0;
        }
        .gi-nav button {
          padding: 11px 22px; border-radius: 10px; font-family: inherit;
          font-size: 13px; font-weight: 800; cursor: pointer;
          transition: opacity .15s ease;
        }
        .gi-prev { border: 1.5px solid #cbd5e1; background: #fff; color: #334155; }
        .gi-next { border: 0; background: ${theme.primary}; color: #fff; }
        .gi-nav button:disabled { opacity: .35; cursor: not-allowed; }
        @media (max-width: 900px) {
          .gi-detail-layout { grid-template-columns: 1fr; }
          .gi-detail-left-sticky { position: relative; top: auto; }
        }
        #giLightbox {
          position: fixed; inset: 0; z-index: 2147483647;
          background: rgba(0,0,0,.92);
          display: flex; align-items: center; justify-content: center;
          padding: 30px; cursor: zoom-out;
        }
        #giLightbox img {
          max-width: 100%; max-height: 100%;
          border-radius: 8px;
          box-shadow: 0 30px 90px rgba(0,0,0,.7);
        }
      </style>

      <div style="max-width: 1400px; margin: 0 auto 60px;">

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
            <div style="font-size: 19px; font-weight: 900; color: #1e293b;">
              ${escapeHtml(data.title)}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
              ${escapeHtml(data.subtitle || '')}
            </div>
          </div>
        </div>

        <div class="gi-detail-layout">

          <div class="gi-detail-left-sticky">
            <div style="background: #fff; border-radius: 18px; padding: 16px;
              box-shadow: 0 10px 30px rgba(15,23,42,.08);">
              <div style="display: flex; align-items: center; justify-content: space-between;
                margin-bottom: 12px;">
                <div style="font-size: 13px; font-weight: 900; color: #1e293b;">
                  📷 Gambar Kandidat
                </div>
                <div style="font-size: 10px; font-weight: 800; color: #94a3b8;
                  letter-spacing: 1px;">
                  ${escapeHtml(testKey.toUpperCase())}
                </div>
              </div>
              ${candidatePanelHTML}
            </div>
          </div>

          <div>
            <div style="background: #fff; padding: 22px 26px 26px;
              border-radius: 18px; box-shadow: 0 20px 50px rgba(15,23,42,.08);">
              ${sectionsHTML || '<div style="text-align:center;padding:40px;color:#94a3b8;">Belum ada data untuk tes ini.</div>'}

              <div class="gi-nav">
                <button type="button" class="gi-prev">← Sebelumnya</button>
                <div class="gi-step-info"
                  style="font-size: 12px; font-weight: 800; color: #64748b;"></div>
                <button type="button" class="gi-next">Selanjutnya →</button>
              </div>

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

        </div>
      </div>
    `;

    /* ===== Stepper ===== */
    const steps   = root.querySelectorAll('.gi-step');
    const navInfo = root.querySelector('.gi-step-info');
    const btnPrev = root.querySelector('.gi-prev');
    const btnNext = root.querySelector('.gi-next');
    const TOTAL   = steps.length;

    if (typeof state.currentStep[testKey] !== 'number') state.currentStep[testKey] = 0;
    let currentStep = Math.min(state.currentStep[testKey], Math.max(0, TOTAL - 1));

    function renderStep() {
      steps.forEach((el, i) => el.classList.toggle('is-active', i === currentStep));
      if (navInfo) navInfo.textContent = `${currentStep + 1} / ${TOTAL}`;
      if (btnPrev) btnPrev.disabled = currentStep === 0;
      if (btnNext) {
        btnNext.disabled = currentStep === TOTAL - 1;
        btnNext.textContent = currentStep === TOTAL - 1 ? 'Selesai ✓' : 'Selanjutnya →';
      }
      state.currentStep[testKey] = currentStep;
    }

    if (btnPrev) btnPrev.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentStep > 0) { currentStep--; renderStep(); }
    });
    if (btnNext) btnNext.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentStep < TOTAL - 1) { currentStep++; renderStep(); }
    });

    renderStep();

    /* ===== Option & Subitem click ===== */
    root.querySelectorAll('.js-option-item').forEach(label => {
      label.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = label.getAttribute('data-section');
        const itemId = label.getAttribute('data-item');
        const type = label.getAttribute('data-type');

        const section = (data.slides || [])                            /* ← FIX */
          .flatMap(g => g.sections || [])
          .find(s => s.id === sectionId);

        const clearSubItems = (parentItemId) => {
          const parentItem = (section?.items || []).find(i => i.id === parentItemId);
          (parentItem?.subItems || []).forEach(sub => {
            delete state.selectedItems[testKey][sectionId + '::' + sub.id];
          });
        };

        if (type === 'radio') {
          const oldVal = state.selectedItems[testKey][sectionId];
          if (oldVal && oldVal !== itemId) clearSubItems(oldVal);
          state.selectedItems[testKey][sectionId] = itemId;
        } else {
          let arr = state.selectedItems[testKey][sectionId];
          if (!Array.isArray(arr)) arr = [];
          const idx = arr.indexOf(itemId);
          if (idx >= 0) { arr.splice(idx, 1); clearSubItems(itemId); }
          else arr.push(itemId);
          state.selectedItems[testKey][sectionId] = arr.length ? arr : undefined;
        }
        saveDraft();
        renderTestDetail(testKey);
      });
    });

    root.querySelectorAll('.js-subitem').forEach(label => {
      label.addEventListener('click', (e) => {
        e.preventDefault();
        const key = label.getAttribute('data-key');
        const cur = state.selectedItems[testKey][key];
        if (cur) delete state.selectedItems[testKey][key];
        else state.selectedItems[testKey][key] = 'checked';
        saveDraft();
        renderTestDetail(testKey);
      });
    });

    /* ===== Tombol bawah ===== */
    document.getElementById('giBackBtn').addEventListener('click', () => {
      saveDraft(); renderLanding();
    });
    document.getElementById('giClearBtn').addEventListener('click', () => {
      if (!confirm('Hapus semua pilihan untuk ' + data.title + '?')) return;
      state.selectedItems[testKey] = {};
      state.currentStep[testKey] = 0;
      saveDraft();
      renderTestDetail(testKey);
    });
    document.getElementById('giSaveBtn').addEventListener('click', () => {
      saveDraft(); renderLanding();
    });

    /* ===== Handler gambar ===== */
    __attachCandidateImageHandlers(testKey, theme);
  }

  /* ============================================================
     Handler gambar kandidat
     ============================================================ */
  function __attachCandidateImageHandlers(testKey, theme) {

    function setImage(src) {
      state.candidateImages[testKey] = src || '';
      saveDraft();
      renderTestDetail(testKey);
    }

    function readFile(file) {
      if (!file || !file.type.startsWith('image/')) {
        alert('File harus gambar (JPG / PNG / WEBP).');
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        alert('Ukuran maksimal 8 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target.result);
      reader.onerror = () => alert('Gagal membaca file.');
      reader.readAsDataURL(file);
    }

    const dropZone  = document.getElementById('giImageDropZone');
    const pickBtn   = document.getElementById('giImagePickBtn');
    const fileInput = document.getElementById('giImageFileInput');
    const urlInput  = document.getElementById('giImageUrlInput');
    const urlBtn    = document.getElementById('giImageUrlBtn');

    if (dropZone) {
      dropZone.addEventListener('click', (e) => {
        if (e.target.closest('#giImagePickBtn') ||
            e.target.closest('#giImageUrlInput') ||
            e.target.closest('#giImageUrlBtn')) return;
        fileInput.click();
      });
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('gi-drop-active');
      });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('gi-drop-active'));
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('gi-drop-active');
        const f = e.dataTransfer.files?.[0];
        if (f) readFile(f);
      });
    }

    if (pickBtn && fileInput) pickBtn.addEventListener('click', () => fileInput.click());
    if (fileInput) fileInput.addEventListener('change', (e) => {
      const f = e.target.files?.[0];
      if (f) readFile(f);
    });

    if (urlBtn && urlInput) {
      urlBtn.addEventListener('click', () => {
        const url = (urlInput.value || '').trim();
        if (!url) { alert('URL kosong.'); return; }
        if (!/^https?:\/\//i.test(url) && !url.startsWith('data:')) {
          alert('URL harus diawali http:// atau https://');
          return;
        }
        setImage(url);
      });
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); urlBtn.click(); }
      });
    }

 const fullscreenBtn = document.getElementById('giImageFullscreenBtn');
const replaceBtn    = document.getElementById('giImageReplaceBtn');
const removeBtn     = document.getElementById('giImageRemoveBtn');
const img           = document.getElementById('giCandidateImg');

// 🆕 Zoom controls
function setZoom(newZoom) {
  newZoom = Math.max(0.4, Math.min(4, Number(newZoom.toFixed(2))));
  state.candidateImageZoom[testKey] = newZoom;
  saveDraft();
  renderTestDetail(testKey);
}

const zoomInBtn    = document.getElementById('giZoomInBtn');
const zoomOutBtn   = document.getElementById('giZoomOutBtn');
const zoomResetBtn = document.getElementById('giZoomResetBtn');

if (zoomInBtn)  zoomInBtn.addEventListener('click',  () => setZoom((state.candidateImageZoom[testKey] || 1) + 0.2));
if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => setZoom((state.candidateImageZoom[testKey] || 1) - 0.2));
if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => setZoom(1));

// 🆕 Scroll-zoom pakai Ctrl + wheel
const scrollWrap = document.getElementById('giImageScrollWrap');
if (scrollWrap && img) {
  scrollWrap.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const dir = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((state.candidateImageZoom[testKey] || 1) + dir);
  }, { passive: false });
}

if (fullscreenBtn && img) {
  fullscreenBtn.addEventListener('click', () => {
    const old = document.getElementById('giLightbox');
    if (old) old.remove();
    const lb = document.createElement('div');
    lb.id = 'giLightbox';
    lb.innerHTML = `<img src="${img.src}" alt="Preview">`;
    lb.onclick = () => lb.remove();
    document.body.appendChild(lb);
  });
}

    if (replaceBtn) {
      replaceBtn.addEventListener('click', () => {
        const tmp = document.createElement('input');
        tmp.type = 'file';
        tmp.accept = 'image/*';
        tmp.onchange = (e) => {
          const f = e.target.files?.[0];
          if (f) readFile(f);
        };
        tmp.click();
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        if (!confirm('Hapus gambar kandidat?')) return;
        setImage('');
      });
    }

    const pasteHandler = (e) => {
      if (state.activePage !== testKey) {
        document.removeEventListener('paste', pasteHandler);
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.type?.startsWith('image/')) {
          const f = it.getAsFile();
          if (f) { e.preventDefault(); readFile(f); return; }
        }
      }
    };
    document.addEventListener('paste', pasteHandler);
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
    const dapCount  = countSelectedItems('dap');
    const baumCount = countSelectedItems('baum');
    const htpCount  = countSelectedItems('htp');
    const hasAnyTest = dapCount > 0 || baumCount > 0 || htpCount > 0;
    if (!hasAnyTest) { alert('Pilih minimal 1 item di DAP/BAUM/HTP.'); return; }

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

    function printParagraph(text, indent = 18, fontSize = 9) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(fontSize);
      const wrapped = doc.splitTextToSize(cleanForPDF(text), pageW - 36);
      wrapped.forEach(line => {
        if (y > pageH - 25) { doc.addPage(); y = 20; }
        doc.text(line, indent, y);
        y += 4.5;
      });
    }

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

    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setDrawColor(220); doc.line(15, y, pageW - 15, y); y += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('KESIMPULAN KESELURUHAN', 15, y); y += 7;
    printParagraph(state.conclusion, 18, 9);
    y += 8;

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

    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('ALASAN REKOMENDASI', 15, y); y += 7;
    printParagraph(state.reasons, 18, 9);
    y += 8;

    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('REKOMENDASI PENGEMBANGAN', 15, y); y += 7;
    printParagraph(state.development, 18, 9);
    y += 12;

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

  async function run() {
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

    await loadCandidateImagesFromFirebase();

    renderLanding();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { run(); });
  } else {
    setTimeout(run, 200);
  }

})();
