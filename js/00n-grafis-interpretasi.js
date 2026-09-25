/* ============================================================
   js/00n-grafis-interpretasi.js — Form Interpretasi Grafis v8.0
   ------------------------------------------------------------
   v8.0 [2026-09-25] — ULTIMATE EDITION
   🎨 IMAGE VIEWER:
   - Unified Pointer Events (mouse + touch + pen)
   - Pinch-to-zoom (2 jari)
   - Wheel zoom tanpa Ctrl
   - Momentum / inertia scroll
   - Auto-fit & auto-center saat load
   - Flip horizontal + vertical
   - Filters: brightness / contrast / invert / grayscale
   - Undo / Redo (10 langkah)
   - Keyboard shortcuts lengkap
   - Grid overlay (rule of thirds)
   - Rotation snap 90° + free rotate
   - Toast feedback

   🖥️ UI:
   - Search items dalam panel
   - Compact / dense mode
   - Progress bar
   - Sticky toolbar
   - Auto-save debounced
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

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function debounce(fn, wait) {
    let t;
    return function() {
      const ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(ctx, args), wait);
    };
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

  console.log('[GRAFIS-INTERP] v8.0 —', { candidateName, candidatePosition });

  /* ============================================================
     TOAST SYSTEM
     ============================================================ */
  function ensureToastContainer() {
    let c = document.getElementById('giToastContainer');
    if (c) return c;
    c = document.createElement('div');
    c.id = 'giToastContainer';
    c.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 2147483647;
      display: flex; flex-direction: column; gap: 8px; pointer-events: none;
      max-width: 340px;`;
    document.body.appendChild(c);
    return c;
  }

  function toast(msg, type) {
    type = type || 'info';
    const colors = {
      info:    { bg: '#1e293b', br: '#3b82f6', icon: 'ℹ️' },
      success: { bg: '#065f46', br: '#10b981', icon: '✅' },
      warn:    { bg: '#78350f', br: '#f59e0b', icon: '⚠️' },
      error:   { bg: '#7f1d1d', br: '#ef4444', icon: '❌' }
    };
    const c = colors[type] || colors.info;
    const el = document.createElement('div');
    el.style.cssText = `padding: 10px 14px; background: ${c.bg}; color: #fff;
      border-left: 4px solid ${c.br}; border-radius: 10px;
      font-family: Inter, system-ui, sans-serif; font-size: 12.5px;
      font-weight: 700; box-shadow: 0 10px 30px rgba(0,0,0,.4);
      display: flex; align-items: center; gap: 8px;
      opacity: 0; transform: translateX(20px);
      transition: opacity .22s ease, transform .22s ease; pointer-events: auto;`;
    el.innerHTML = `<span style="font-size: 14px;">${c.icon}</span><span>${escapeHtml(msg)}</span>`;
    ensureToastContainer().appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateX(0)';
    });
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      setTimeout(() => el.remove(), 250);
    }, 2600);
  }

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

      console.log('[GRAFIS-INTERP] ✅ Gambar kandidat dimuat dari Firebase');
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
      document.body.style.overflow = 'hidden';
    }
  }
  hideDefaultUI();
  setTimeout(hideDefaultUI, 100);
  setTimeout(hideDefaultUI, 500);

  /* ============================================================
     DRAFT KEY & STATE
     ============================================================ */
  const DRAFT_KEY = 'grafis_interp_draft_' + candidateSlug(candidateName);

  function defaultImageState() {
    return { zoom: 1, rotate: 0, panX: 0, panY: 0, flipH: false, flipV: false,
             brightness: 100, contrast: 100, invert: false, grayscale: false };
  }

  const state = {
    activePage: 'landing',
    selectedItems: { dap: {}, baum: {}, htp: {} },
    candidateImages: { dap: '', baum: '', htp: '' },
    imageState: {
      dap:  defaultImageState(),
      baum: defaultImageState(),
      htp:  defaultImageState()
    },
    currentStep: { dap: 0, baum: 0, htp: 0 },
    categories: KATEGORI.map(name => ({ name, score: '', narrative: '' })),
    conclusion: '',
    recommendation: '',
    reasons: '',
    development: '',
    compactMode: false,
    gridOverlay: false,
    searchQuery: ''
  };

  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const draft = JSON.parse(raw);
      ['selectedItems','candidateImages','currentStep','categories',
       'conclusion','recommendation','reasons','development'].forEach(k => {
        if (draft[k] !== undefined) state[k] = Object.assign(state[k], draft[k]);
      });
      // Kompatibilitas dengan draft versi lama (zoom / rotate / pan flat)
      const legacyMap = { dap: 'dap', baum: 'baum', htp: 'htp' };
      Object.keys(legacyMap).forEach(k => {
        if (draft.candidateImageZoom   && draft.candidateImageZoom[k])   state.imageState[k].zoom   = draft.candidateImageZoom[k];
        if (draft.candidateImageRotate && draft.candidateImageRotate[k]) state.imageState[k].rotate = draft.candidateImageRotate[k];
        if (draft.candidateImagePan    && draft.candidateImagePan[k]) {
          state.imageState[k].panX = draft.candidateImagePan[k].x || 0;
          state.imageState[k].panY = draft.candidateImagePan[k].y || 0;
        }
      });
      if (draft.imageState) {
        Object.keys(draft.imageState).forEach(k => {
          if (state.imageState[k]) Object.assign(state.imageState[k], draft.imageState[k]);
        });
      }
      if (typeof draft.compactMode === 'boolean') state.compactMode = draft.compactMode;
      if (typeof draft.gridOverlay === 'boolean') state.gridOverlay = draft.gridOverlay;
      console.log('[GRAFIS-INTERP] Draft dimuat');
    }
  } catch (e) {}

  const saveDraftDebounced = debounce(function() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        selectedItems:  state.selectedItems,
        candidateImages: state.candidateImages,
        imageState:      state.imageState,
        currentStep:     state.currentStep,
        categories:      state.categories,
        conclusion:      state.conclusion,
        recommendation:  state.recommendation,
        reasons:         state.reasons,
        development:     state.development,
        compactMode:     state.compactMode,
        gridOverlay:     state.gridOverlay
      }));
    } catch (e) {}
  }, 400);

  function saveDraft() { saveDraftDebounced(); }

  /* ============================================================
     AUTO-GENERATE INTERPRETASI
     ============================================================ */
  function generateAutoText(testKey) {
    const data = (window.GRAFIS_AUTO_DATA || {})[testKey];
    if (!data || !Array.isArray(data.slides)) return '';
    const selected = state.selectedItems[testKey] || {};
    const lines = [];

    data.slides.forEach(group => {
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
    const out = [];

    testKeys.forEach(key => {
      const data = autoData[key];
      if (!data || !data.slides) return;

      const selected = state.selectedItems[key] || {};
      const selectedLines = [];

      data.slides.forEach(group => {
        (group.sections || []).forEach(section => {
          const val = selected[section.id];
          if (!val) return;
          const itemIds = Array.isArray(val) ? val : [val];
          itemIds.forEach(itemId => {
            const item = (section.items || []).find(i => i.id === itemId);
            if (!item) return;
            if (!selectedLines.some(l => l.text === item.interpret)) {
              selectedLines.push({ label: item.label, text: item.interpret });
            }
            (item.subItems || []).forEach(sub => {
              const subKey = section.id + '::' + sub.id;
              if (selected[subKey] && !selectedLines.some(l => l.text === sub.interpret)) {
                selectedLines.push({ label: '↳ ' + sub.label, text: sub.interpret });
              }
            });
          });
        });
      });

      if (selectedLines.length > 0) {
        out.push({
          key,
          title: data.title || key.toUpperCase(),
          icon: data.icon || '📄',
          items: selectedLines
        });
      }
    });

    return out;
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
              toast('Notes tersalin ke clipboard', 'success');
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
    try { document.execCommand('copy'); toast('Tersalin', 'success'); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ============================================================
     IMAGE VIEWER — Unified Pointer Events + Pinch + Wheel + Filters
     ============================================================ */
  function createImageViewer(opts) {
    const { viewport, img, testKey } = opts;
    if (!viewport || !img) return null;

    const imgState = state.imageState[testKey];
    const history = { stack: [], index: -1 };
    let isDragging = false;
    let pointerId = null;
    let startX = 0, startY = 0, startPanX = 0, startPanY = 0;
    let lastMoveX = 0, lastMoveY = 0, velocityX = 0, velocityY = 0;
    let rafId = null;
    let pinchStartDist = 0, pinchStartZoom = 1;

    function applyTransform() {
      const t =
        `translate(-50%, -50%) translate(${imgState.panX}px, ${imgState.panY}px) ` +
        `rotate(${imgState.rotate}deg) ` +
        `scale(${imgState.flipH ? -1 : 1}, ${imgState.flipV ? -1 : 1}) ` +
        `scale(${imgState.zoom})`;
      img.style.transform = t;

      let filters = [];
      if (imgState.brightness !== 100) filters.push(`brightness(${imgState.brightness}%)`);
      if (imgState.contrast   !== 100) filters.push(`contrast(${imgState.contrast}%)`);
      if (imgState.grayscale)          filters.push(`grayscale(100%)`);
      if (imgState.invert)             filters.push(`invert(100%)`);
      img.style.filter = filters.join(' ');
    }

    function pushHistory() {
      // Snapshot hanya field yang di-track
      const snapshot = JSON.stringify({
        zoom: imgState.zoom, rotate: imgState.rotate,
        panX: imgState.panX, panY: imgState.panY,
        flipH: imgState.flipH, flipV: imgState.flipV,
        brightness: imgState.brightness, contrast: imgState.contrast,
        invert: imgState.invert, grayscale: imgState.grayscale
      });
      // Buang redo future
      history.stack = history.stack.slice(0, history.index + 1);
      if (history.stack[history.stack.length - 1] === snapshot) return;
      history.stack.push(snapshot);
      if (history.stack.length > 20) history.stack.shift();
      history.index = history.stack.length - 1;
    }

    function undo() {
      if (history.index <= 0) return toast('Tidak ada yang bisa di-undo', 'warn');
      history.index--;
      applySnapshot(history.stack[history.index]);
      toast('Undo', 'info');
    }
    function redo() {
      if (history.index >= history.stack.length - 1) return toast('Tidak ada yang bisa di-redo', 'warn');
      history.index++;
      applySnapshot(history.stack[history.index]);
      toast('Redo', 'info');
    }
    function applySnapshot(snapStr) {
      const s = JSON.parse(snapStr);
      Object.assign(imgState, s);
      applyTransform();
      updateToolbarUI();
      saveDraft();
    }

    function updateToolbarUI() {
      const zr = document.getElementById('giZoomResetBtn');
      if (zr) zr.textContent = Math.round(imgState.zoom * 100) + '%';
      const rr = document.getElementById('giRotateResetBtn');
      if (rr) rr.textContent = imgState.rotate + '°';
    }

    /* ===== Auto-fit & center ===== */
    function autoFit() {
      imgState.zoom = 1;
      imgState.panX = 0;
      imgState.panY = 0;
      applyTransform();
      updateToolbarUI();
      saveDraft();
    }

    /* ===== Zoom ===== */
    function setZoom(z, fromWheel) {
      z = clamp(z, 0.15, 8);
      imgState.zoom = Number(z.toFixed(3));
      applyTransform();
      updateToolbarUI();
      if (!fromWheel) pushHistory();
      saveDraft();
    }

    /* ===== Rotate ===== */
    function setRotate(deg) {
      imgState.rotate = ((deg % 360) + 360) % 360;
      applyTransform();
      updateToolbarUI();
      pushHistory();
      saveDraft();
    }

    /* ===== Flip ===== */
    function toggleFlipH() {
      imgState.flipH = !imgState.flipH;
      applyTransform();
      pushHistory();
      saveDraft();
      toast(imgState.flipH ? 'Flip horizontal aktif' : 'Flip horizontal nonaktif', 'info');
    }
    function toggleFlipV() {
      imgState.flipV = !imgState.flipV;
      applyTransform();
      pushHistory();
      saveDraft();
      toast(imgState.flipV ? 'Flip vertikal aktif' : 'Flip vertikal nonaktif', 'info');
    }

    /* ===== Filters ===== */
    function setBrightness(v) { imgState.brightness = clamp(v, 20, 250); applyTransform(); saveDraft(); }
    function setContrast(v)   { imgState.contrast   = clamp(v, 20, 250); applyTransform(); saveDraft(); }
    function toggleInvert()   { imgState.invert = !imgState.invert; applyTransform(); pushHistory(); saveDraft(); }
    function toggleGray()     { imgState.grayscale = !imgState.grayscale; applyTransform(); pushHistory(); saveDraft(); }

    /* ===== Pointer Events (unified) ===== */
    const pointers = new Map();

    function onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      viewport.setPointerCapture && viewport.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 1) {
        isDragging = true;
        pointerId = e.pointerId;
        startX = e.clientX; startY = e.clientY;
        startPanX = imgState.panX; startPanY = imgState.panY;
        lastMoveX = e.clientX; lastMoveY = e.clientY;
        velocityX = 0; velocityY = 0;
        viewport.classList.add('dragging');
        if (rafId) cancelAnimationFrame(rafId);
        img.style.transition = 'none';
      } else if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStartZoom = imgState.zoom;
        isDragging = false;
      }
    }

    function onPointerMove(e) {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        // Pinch
        const pts = [...pointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinchStartDist > 0) {
          const newZoom = (dist / pinchStartDist) * pinchStartZoom;
          setZoom(newZoom, true);
        }
        return;
      }

      if (!isDragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      imgState.panX = startPanX + dx;
      imgState.panY = startPanY + dy;
      velocityX = e.clientX - lastMoveX;
      velocityY = e.clientY - lastMoveY;
      lastMoveX = e.clientX; lastMoveY = e.clientY;
      applyTransform();
    }

    function momentum() {
      if (Math.abs(velocityX) < 0.5 && Math.abs(velocityY) < 0.5) return;
      imgState.panX += velocityX;
      imgState.panY += velocityY;
      velocityX *= 0.92;
      velocityY *= 0.92;
      applyTransform();
      rafId = requestAnimationFrame(momentum);
    }

    function onPointerUp(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStartDist = 0;
      if (e.pointerId !== pointerId) return;
      isDragging = false;
      pointerId = null;
      viewport.classList.remove('dragging');
      img.style.transition = 'transform .18s ease';
      pushHistory();
      saveDraft();
      // Momentum
      if (Math.abs(velocityX) > 1 || Math.abs(velocityY) > 1) {
        rafId = requestAnimationFrame(momentum);
      }
    }

    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('pointercancel', onPointerUp);

    /* ===== Wheel zoom (tanpa Ctrl) ===== */
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      setZoom(imgState.zoom * factor, true);
      clearTimeout(viewport._zoomCommit);
      viewport._zoomCommit = setTimeout(() => pushHistory(), 300);
    }, { passive: false });

    /* ===== Keyboard shortcuts ===== */
    function onKey(e) {
      if (state.activePage !== testKey) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const step = e.shiftKey ? 60 : 20;

      switch (e.key) {
        case 'ArrowUp':    imgState.panY -= step; applyTransform(); e.preventDefault(); break;
        case 'ArrowDown':  imgState.panY += step; applyTransform(); e.preventDefault(); break;
        case 'ArrowLeft':  imgState.panX -= step; applyTransform(); e.preventDefault(); break;
        case 'ArrowRight': imgState.panX += step; applyTransform(); e.preventDefault(); break;
        case '+': case '=': setZoom(imgState.zoom + 0.15); e.preventDefault(); break;
        case '-': case '_': setZoom(imgState.zoom - 0.15); e.preventDefault(); break;
        case 'r': case 'R':
          setRotate(imgState.rotate + (e.shiftKey ? -90 : 90));
          e.preventDefault(); break;
        case 'f': case 'F': autoFit(); e.preventDefault(); break;
        case 'h': case 'H': toggleFlipH(); e.preventDefault(); break;
        case 'v': case 'V': toggleFlipV(); e.preventDefault(); break;
        case 'g': case 'G': toggleGrid(); e.preventDefault(); break;
        case 'i': case 'I': toggleInvert(); e.preventDefault(); break;
        case '0': setZoom(1); imgState.panX = 0; imgState.panY = 0;
                  imgState.rotate = 0; applyTransform();
                  updateToolbarUI(); pushHistory(); e.preventDefault(); break;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { undo(); e.preventDefault(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { redo(); e.preventDefault(); }
    }
    document.addEventListener('keydown', onKey);

    /* ===== Grid overlay ===== */
    function toggleGrid() {
      state.gridOverlay = !state.gridOverlay;
      const g = document.getElementById('giGridOverlay');
      if (g) g.style.display = state.gridOverlay ? 'block' : 'none';
      saveDraft();
      toast(state.gridOverlay ? 'Grid aktif' : 'Grid nonaktif', 'info');
    }

    /* ===== Binding tombol toolbar ===== */
    function bind(id, fn) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    }
    bind('giZoomInBtn',  () => setZoom(imgState.zoom + 0.2));
    bind('giZoomOutBtn', () => setZoom(imgState.zoom - 0.2));
    bind('giZoomResetBtn', () => setZoom(1));
    bind('giRotateLeftBtn',  () => setRotate(imgState.rotate - 90));
    bind('giRotateRightBtn', () => setRotate(imgState.rotate + 90));
    bind('giRotateResetBtn', () => setRotate(0));
    bind('giPanResetBtn', () => {
      imgState.panX = 0; imgState.panY = 0;
      applyTransform(); pushHistory(); saveDraft();
      toast('Posisi direset', 'info');
    });
    bind('giFlipHBtn', toggleFlipH);
    bind('giFlipVBtn', toggleFlipV);
    bind('giInvertBtn', toggleInvert);
    bind('giGrayBtn', toggleGray);
    bind('giGridBtn', toggleGrid);
    bind('giUndoBtn', undo);
    bind('giRedoBtn', redo);
    bind('giFitBtn', autoFit);
    bind('giFullscreenBtn', () => openLightbox(img.src, imgState));
    bind('giReplaceBtn', () => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          state.candidateImages[testKey] = ev.target.result;
          Object.assign(imgState, defaultImageState());
          saveDraft();
          renderTestDetail(testKey);
          toast('Gambar diganti', 'success');
        };
        reader.readAsDataURL(f);
      };
      inp.click();
    });
    bind('giRemoveBtn', () => {
      if (!confirm('Hapus gambar kandidat?')) return;
      state.candidateImages[testKey] = '';
      Object.assign(imgState, defaultImageState());
      saveDraft();
      renderTestDetail(testKey);
      toast('Gambar dihapus', 'warn');
    });

    // Filter sliders (brightness & contrast)
    const brightnessSlider = document.getElementById('giBrightness');
    if (brightnessSlider) {
      brightnessSlider.value = imgState.brightness;
      brightnessSlider.addEventListener('input', (e) => setBrightness(Number(e.target.value)));
    }
    const contrastSlider = document.getElementById('giContrast');
    if (contrastSlider) {
      contrastSlider.value = imgState.contrast;
      contrastSlider.addEventListener('input', (e) => setContrast(Number(e.target.value)));
    }

    // Push initial state
    pushHistory();
    applyTransform();
    updateToolbarUI();

    // Auto-fit on first load if image exists
    img.onload = () => { applyTransform(); };

    return { applyTransform, pushHistory };
  }

  function openLightbox(src, imgState) {
    const old = document.getElementById('giLightbox');
    if (old) old.remove();
    const lb = document.createElement('div');
    lb.id = 'giLightbox';
    lb.style.cssText = `position: fixed; inset: 0; z-index: 2147483647;
      background: rgba(0,0,0,.94); display: flex; align-items: center;
      justify-content: center; padding: 30px; cursor: zoom-out;`;
    const filters = [];
    if (imgState.brightness !== 100) filters.push(`brightness(${imgState.brightness}%)`);
    if (imgState.contrast !== 100) filters.push(`contrast(${imgState.contrast}%)`);
    if (imgState.grayscale) filters.push(`grayscale(100%)`);
    if (imgState.invert) filters.push(`invert(100%)`);

    lb.innerHTML = `<img src="${src}" alt="Preview"
      style="max-width: 100%; max-height: 100%;
        transform: rotate(${imgState.rotate}deg)
                   scale(${imgState.flipH ? -1 : 1}, ${imgState.flipV ? -1 : 1});
        filter: ${filters.join(' ')};
        border-radius: 8px;
        box-shadow: 0 30px 90px rgba(0,0,0,.7);">`;
    lb.onclick = () => lb.remove();
    document.body.appendChild(lb);
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
    root.style.overflowY = 'auto';

    const logoUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO)
      || 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png';

    const autoData = window.GRAFIS_AUTO_DATA || {};
    const testKeys = ['dap', 'baum', 'htp'];
    const totalSelected = testKeys.reduce((s, k) => s + countSelectedItems(k), 0);

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
          ${totalSelected > 0 ? `
            <div style="margin-top: 14px; padding: 10px 14px;
              background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px;
              font-size: 12.5px; color: #166534; font-weight: 700;">
              ✓ Progress: ${totalSelected} item dipilih dari 3 tes
            </div>
          ` : ''}
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
                const hasData = (data.slides || []).length > 0;
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
                        ${hasData ? (count > 0 ? `✓ ${count} item` : 'Belum diisi') : 'Segera hadir'}
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
        renderTestDetail(btn.getAttribute('data-test'));
      });
    });

    renderCombinedNotes();
    renderCategories();

    const bindInput = (id, prop) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', (e) => { state[prop] = e.target.value; saveDraft(); });
    };
    bindInput('giConclusion', 'conclusion');
    bindInput('giReasons', 'reasons');
    bindInput('giDevelopment', 'development');

    const rec = document.getElementById('giRecommendation');
    if (rec) rec.addEventListener('change', (e) => { state.recommendation = e.target.value; saveDraft(); });

    const submit = document.getElementById('giSubmitBtn');
    if (submit) submit.addEventListener('click', handleSubmit);
  }

  /* ============================================================
     DETAIL PAGE — SATU LAYAR + IMAGE VIEWER CANGGIH
     ============================================================ */
  function renderTestDetail(testKey) {
    const root = getRoot();
    if (!root) return;

    const data = (window.GRAFIS_AUTO_DATA || {})[testKey];
    if (!data) { alert('Data untuk ' + testKey + ' belum tersedia.'); return; }

    root.style.overflowY = 'hidden';
    state.activePage = testKey;
    state.searchQuery = '';

    const theme = data.theme || { primary: '#6d28d9', primaryDark: '#5b21b6', bg: '#f5f3ff', border: '#ddd6fe' };
    const selected    = state.selectedItems[testKey] || {};
    const currentImg  = state.candidateImages[testKey] || '';
    const imgState    = state.imageState[testKey];

    /* ===== Konten pilihan ===== */
    const sectionsHTML = (data.slides || []).map((group, stepIdx) => {
      const sectionsInner = (group.sections || []).map(section => {
        const val = selected[section.id];
        const isRadio = section.type === 'radio';
       const itemsHTML = (section.items || []).map(item => {
  let isChecked = false;
  if (isRadio) isChecked = (val === item.id);
  else isChecked = Array.isArray(val) && val.includes(item.id);

  /* 🆕 Gambar item — muncul saat dicentang */
  let itemImageHTML = '';
  if (item.image && isChecked) {
    itemImageHTML = `
      <div style="margin: 6px 0 10px 28px; padding: 8px;
        background: #fff; border: 1.5px solid ${theme.border};
        border-radius: 10px; text-align: center;">
        <img src="${item.image}" alt="${escapeHtml(item.label)}"
          style="max-width: 100%; max-height: 220px; border-radius: 6px; display: block; margin: 0 auto;"
          onerror="this.parentElement.style.display='none';">
      </div>
    `;
  }

  let subItemsHTML = '';
          if (item.subItems && item.subItems.length && isChecked) {
            subItemsHTML = item.subItems.map(sub => {
              const subKey = section.id + '::' + sub.id;
              const subChecked = !!selected[subKey];
              return `
                <label class="js-subitem" data-key="${subKey}"
                  style="display: flex; align-items: flex-start; gap: 10px;
                    padding: 8px 12px; margin: 4px 0 6px 28px;
                    background: ${subChecked ? '#fff' : '#f8fafc'};
                    border: 2px dashed ${subChecked ? theme.primary : '#cbd5e1'};
                    border-radius: 10px; cursor: pointer;
                    transition: all .15s ease; user-select: none;">
                  <div style="width: 16px; height: 16px; flex: 0 0 16px; margin-top: 1px;
                    border: 2px solid ${subChecked ? theme.primary : '#cbd5e1'};
                    background: ${subChecked ? theme.primary : '#fff'};
                    border-radius: 4px; display: grid; place-items: center;">
                    ${subChecked ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/></svg>` : ''}
                  </div>
                  <div style="flex: 1; min-width: 0; font-size: 12px; font-weight: 800;
                    color: ${subChecked ? theme.primaryDark : '#334155'}; line-height: 1.35;">
                    ↳ ${escapeHtml(sub.label)}
                    ${sub.optional ? `<span style="font-size: 10px; color: #94a3b8; font-weight: 700; margin-left: 4px;">(opsional)</span>` : ''}
                  </div>
                </label>
              `;
            }).join('');
          }

          return `
            <div>
              <label class="js-option-item" data-section="${section.id}" data-item="${item.id}" data-type="${section.type}"
                style="display: flex; align-items: flex-start; gap: 10px;
                  padding: 9px 12px; margin-bottom: 6px;
                  background: ${isChecked ? '#fff' : '#fbfdff'};
                  border: 2px solid ${isChecked ? theme.primary : '#e2e8f0'};
                  border-radius: 10px; cursor: pointer;
                  transition: all .15s ease; user-select: none;">
                <div style="width: 18px; height: 18px; flex: 0 0 18px; margin-top: 1px;
                  border: 2px solid ${isChecked ? theme.primary : '#cbd5e1'};
                  background: ${isChecked ? theme.primary : '#fff'};
                  ${isRadio ? 'border-radius: 50%;' : 'border-radius: 4px;'}
                  display: grid; place-items: center;">
                  ${isChecked ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/></svg>` : ''}
                </div>
                <div style="flex: 1; min-width: 0; font-size: 12.5px; font-weight: 800;
                  color: ${isChecked ? theme.primaryDark : '#1e293b'}; line-height: 1.35;">
                  ${escapeHtml(item.label)}
                </div>
              </label>
              ${subItemsHTML}
            </div>
          `;
        }).join('');

return `
  <div style="margin-bottom: 16px;">
    <div style="font-size: 11.5px; font-weight: 900; color: #334155;
      margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
      ${escapeHtml(section.title)}
    </div>
    ${itemsHTML}
  </div>
`;
      }).join('');

      return `
        <div class="gi-step" data-step="${stepIdx}"
          style="margin-bottom: 16px; padding: 14px 16px;
          background: ${theme.bg}; border: 2px solid ${theme.border};
          border-radius: 14px;">
          <div style="font-size: 14px; font-weight: 900; color: ${theme.primaryDark};
            margin-bottom: 12px; padding-bottom: 8px;
            border-bottom: 1px dashed ${theme.border};">
            ${escapeHtml(group.title)}
          </div>
          ${sectionsInner}
        </div>
      `;
    }).join('');

    /* ===== Render ===== */
    const gridVisible = state.gridOverlay ? 'block' : 'none';

    root.innerHTML = `
      <style>
        .gi-page { display: flex; flex-direction: column;
          height: calc(100vh - 40px); max-width: 1600px; margin: 0 auto; gap: 8px; }

        .gi-header { flex-shrink: 0; background: ${theme.bg};
          border: 2px solid ${theme.border}; border-radius: 14px;
          padding: 10px 16px; display: flex; align-items: center; gap: 12px; }

        .gi-detail-layout { flex: 1; min-height: 0; display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(320px, 1fr); gap: 10px; }

        .gi-detail-left, .gi-detail-right { height: 100%; min-height: 0;
          background: #fff; border-radius: 16px;
          box-shadow: 0 10px 30px rgba(15,23,42,.08); }

        .gi-detail-left { padding: 10px; display: flex;
          flex-direction: column; gap: 6px; position: relative; }

        .gi-detail-left-header { flex-shrink: 0; display: flex;
          align-items: center; justify-content: space-between;
          font-size: 12px; font-weight: 900; color: #1e293b; }

        .gi-detail-left-viewport { flex: 1; min-height: 0; position: relative;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          background: #f8fafc; overflow: hidden; }

        .gi-img-viewport { position: absolute; inset: 0; overflow: hidden;
          cursor: grab; touch-action: none; user-select: none; }
        .gi-img-viewport.dragging { cursor: grabbing; }

        #giCandidateImg { position: absolute; top: 50%; left: 50%;
          max-width: 96%; max-height: 96%;
          transform-origin: center center;
          pointer-events: none; -webkit-user-drag: none;
          background: #fff; border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,.08);
          transition: transform .15s ease; }

  .gi-grid-overlay { position: absolute; inset: 0;
  pointer-events: none; display: ${gridVisible}; z-index: 3;
  background-image:
    linear-gradient(to right, rgba(59,130,246,.22) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(59,130,246,.22) 1px, transparent 1px);
  background-size: 10% 10%; }
.gi-grid-overlay .gi-grid-thirds { position: absolute; inset: 0;
  background-image:
    linear-gradient(to right, rgba(234,179,8,.65) 1.5px, transparent 1.5px),
    linear-gradient(to bottom, rgba(234,179,8,.65) 1.5px, transparent 1.5px);
  background-size: 33.333% 33.333%; }
.gi-grid-overlay .gi-grid-center-h { position: absolute;
  left: 0; right: 0; top: 50%; height: 2px;
  background: rgba(239,68,68,.75); transform: translateY(-1px); }
.gi-grid-overlay .gi-grid-center-v { position: absolute;
  top: 0; bottom: 0; left: 50%; width: 2px;
  background: rgba(239,68,68,.75); transform: translateX(-1px); }

/* ===== Hint shortcut di dalam gambar ===== */
.gi-img-hint {
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 6px 12px;
  background: rgba(15,23,42,.72);
  border-radius: 999px;
  font-family: Inter, system-ui, sans-serif;
  font-size: 10.5px;
  font-weight: 700;
  color: #e2e8f0;
  pointer-events: none;
  z-index: 4;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 6px 18px rgba(0,0,0,.35);
  max-width: calc(100% - 20px);
  white-space: nowrap;
}
.gi-img-hint .gi-kbd {
  display: inline-block;
  padding: 1px 6px;
  font-family: monospace;
  font-size: 10px;
  background: rgba(255,255,255,.14);
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 4px;
  color: #fff;
  font-weight: 800;
}
.gi-img-hint .gi-hint-dot {
  opacity: .45;
  font-weight: 900;
}

/* Sembunyikan hint kalau layar terlalu kecil */
@media (max-width: 600px) {
  .gi-img-hint {
    font-size: 9.5px;
    padding: 5px 10px;
    gap: 4px;
  }
}
        .gi-toolbar { flex-shrink: 0; display: flex; flex-direction: column;
          gap: 4px; padding: 6px 8px; background: #f8fafc;
          border: 1.5px solid #e2e8f0; border-radius: 10px; }

        .gi-toolbar-row { display: flex; align-items: center;
          justify-content: center; gap: 4px; flex-wrap: wrap; }

        .gi-tbtn { min-width: 30px; height: 30px; padding: 0 8px;
          border-radius: 7px; cursor: pointer; font-family: inherit;
          font-size: 14px; font-weight: 900; line-height: 1;
          background: #fff; color: #334155; border: 1.5px solid #cbd5e1;
          transition: all .12s ease; display: inline-flex;
          align-items: center; justify-content: center; }
        .gi-tbtn:hover { background: #f1f5f9; border-color: #94a3b8; }
        .gi-tbtn.primary { background: ${theme.primary}; color: #fff; border-color: ${theme.primary}; }
        .gi-tbtn.active { background: ${theme.primary}; color: #fff; border-color: ${theme.primary}; }
        .gi-tbtn.small { font-size: 12px; }
        .gi-tseparator { width: 1px; height: 20px; background: #cbd5e1; margin: 0 2px; }

        .gi-filter-row { display: flex; align-items: center; gap: 8px;
          padding: 4px 8px; font-size: 10.5px; color: #64748b; }
        .gi-filter-row input[type=range] { flex: 1; height: 4px; accent-color: ${theme.primary}; }
        .gi-filter-label { font-weight: 800; min-width: 48px; }

        .gi-detail-right { padding: 12px 14px; overflow-y: auto; scrollbar-width: thin; }

        .gi-drop-active { background: ${theme.bg} !important;
          border-color: ${theme.primary} !important; }

        .gi-step { display: none; }
        .gi-step.is-active { display: block; }

        .gi-nav { display: flex; align-items: center; justify-content: space-between;
          gap: 10px; margin-top: 14px; padding-top: 14px;
          border-top: 1.5px dashed #e2e8f0; }
        .gi-nav button { padding: 9px 18px; border-radius: 10px;
          font-family: inherit; font-size: 12.5px; font-weight: 800;
          cursor: pointer; transition: opacity .15s ease; }
        .gi-prev { border: 1.5px solid #cbd5e1; background: #fff; color: #334155; }
        .gi-next { border: 0; background: ${theme.primary}; color: #fff; }
        .gi-nav button:disabled { opacity: .35; cursor: not-allowed; }

        .gi-search-box { position: relative; margin-bottom: 10px; }
        .gi-search-box input { width: 100%; padding: 8px 12px 8px 32px;
          border: 1.5px solid #e2e8f0; border-radius: 9px;
          font-family: inherit; font-size: 12.5px; outline: none;
          box-sizing: border-box; }
        .gi-search-box input:focus { border-color: ${theme.primary}; }
       .gi-search-box::before { content: '🔍'; position: absolute;
  left: 10px; top: 50%; transform: translateY(-50%);
  font-size: 13px; pointer-events: none; }

/* ===== Justified text ===== */
.gi-detail-right .js-option-item > div:last-child,
.gi-detail-right .js-subitem > div:last-child,
.gi-notes-content,
.gi-cat-narrative,
#giConclusion,
#giReasons,
#giDevelopment {
  text-align: justify;
  text-justify: inter-word;
  hyphens: auto;
  -webkit-hyphens: auto;
  word-break: break-word;
}

/* Jangan justify di tombol & label pendek */
.gi-tbtn,
.gi-nav button,
.gi-detail-right .gi-search-box input {
  text-align: center;
}
        .gi-kbd { display: inline-block; padding: 1px 5px; font-family: monospace;
          font-size: 10px; background: #f1f5f9; border: 1px solid #cbd5e1;
          border-radius: 4px; color: #475569; font-weight: 700; }

        @media (max-width: 900px) {
          .gi-page { height: auto; }
          .gi-detail-layout { grid-template-columns: 1fr; height: auto; }
          .gi-detail-left { height: 55vh; }
          .gi-detail-right { height: auto; max-height: none; }
        }

        #giLightbox { position: fixed; inset: 0; z-index: 2147483647;
          background: rgba(0,0,0,.94); display: flex;
          align-items: center; justify-content: center;
          padding: 30px; cursor: zoom-out; }
      </style>

      <div class="gi-page">

        <!-- Header -->
        <div class="gi-header">
          <button type="button" id="giBackBtn"
            style="width: 38px; height: 38px; flex: 0 0 38px;
              display: grid; place-items: center;
              background: #fff; border: 1.5px solid ${theme.border};
              border-radius: 10px; color: ${theme.primaryDark};
              font-size: 18px; cursor: pointer; font-family: inherit;">
            ←
          </button>
          <div style="font-size: 26px; line-height: 1;">${data.icon || '📄'}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 9.5px; font-weight: 800; letter-spacing: 1.5px;
              color: ${theme.primary}; margin-bottom: 2px;">
              INTERPRETASI OTOMATIS · v8.0
            </div>
            <div style="font-size: 15px; font-weight: 900; color: #1e293b;">
              ${escapeHtml(data.title)}
            </div>
          </div>
<div style="font-size: 10px; color: #94a3b8; font-weight: 700;
  text-align: right; line-height: 1.4;">
  <div style="font-weight: 800; color: ${theme.primary}; letter-spacing: 1px;">v8.0</div>
</div>
        </div>

        <div class="gi-detail-layout">

          <!-- Kolom kiri: gambar -->
          <div class="gi-detail-left">
            <div class="gi-detail-left-header">
              <div>📷 Gambar Kandidat</div>
              <div style="font-size: 10px; color: #94a3b8; letter-spacing: 1px;">
                ${escapeHtml(testKey.toUpperCase())}
              </div>
            </div>

            <div class="gi-detail-left-viewport">
              ${currentImg ? `
<div class="gi-img-viewport" id="giViewport">
  <img id="giCandidateImg" src="${currentImg}" alt="Gambar Kandidat" draggable="false">
  <div class="gi-grid-overlay" id="giGridOverlay">
    <div class="gi-grid-thirds"></div>
    <div class="gi-grid-center-h"></div>
    <div class="gi-grid-center-v"></div>
  </div>

  <!-- 🆕 Hint shortcut di dalam gambar -->
  <div class="gi-img-hint">
    <span class="gi-kbd">Wheel</span> zoom
    <span class="gi-hint-dot">·</span>
    <span class="gi-kbd">Drag</span> geser
    <span class="gi-hint-dot">·</span>
    <span class="gi-kbd">R</span> rotate
    <span class="gi-hint-dot">·</span>
    <span class="gi-kbd">F</span> fit
    <span class="gi-hint-dot">·</span>
    <span class="gi-kbd">0</span> reset
  </div>
</div>
              ` : `
                <div id="giImageDropZone"
                  style="position: absolute; inset: 0; display: flex;
                    flex-direction: column; align-items: center; justify-content: center;
                    padding: 24px 20px; text-align: center;
                    background: #f8fafc; cursor: pointer; transition: all .18s ease;">
                  <div style="font-size: 42px; line-height: 1; margin-bottom: 10px; opacity: .5;">📷</div>
                  <div style="font-size: 13px; font-weight: 800; color: #475569; margin-bottom: 6px;">
                    Upload Gambar Kandidat
                  </div>
                  <div style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin-bottom: 12px;">
                    Klik / drag ke sini · Paste screenshot (<span class="gi-kbd">Ctrl</span>+<span class="gi-kbd">V</span>)
                  </div>
                  <button type="button" id="giImagePickBtn"
                    style="padding: 8px 16px;
                      background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark});
                      color: #fff; border: 0; border-radius: 8px;
                      font-family: inherit; font-size: 12px; font-weight: 800;
                      cursor: pointer;">
                    📁 Pilih File
                  </button>
                  <div style="margin-top: 12px; padding-top: 12px;
                    border-top: 1px dashed #e2e8f0; width: 100%; max-width: 320px;">
                    <div style="font-size: 10px; font-weight: 700; color: #94a3b8; margin-bottom: 6px;">
                      ATAU PASTE URL
                    </div>
                    <input type="text" id="giImageUrlInput" placeholder="https://..."
                      style="width: 100%; padding: 8px 12px; border: 1.5px solid #e2e8f0;
                        border-radius: 8px; font-family: inherit; font-size: 11.5px;
                        outline: none; box-sizing: border-box; background: #fff;">
                    <button type="button" id="giImageUrlBtn"
                      style="margin-top: 6px; width: 100%; padding: 7px;
                        background: #f1f5f9; color: #475569; border: 0;
                        border-radius: 8px; font-family: inherit; font-size: 11px;
                        font-weight: 800; cursor: pointer;">
                      Terapkan URL
                    </button>
                  </div>
                </div>
                <input type="file" id="giImageFileInput" accept="image/*" style="display: none;">
              `}
            </div>

            ${currentImg ? `
            <!-- Toolbar canggih -->
            <div class="gi-toolbar">
              <!-- Baris 1: Zoom + Rotate + Flip -->
              <div class="gi-toolbar-row">
                <button type="button" class="gi-tbtn" id="giZoomOutBtn" title="Perkecil (−)">−</button>
                <button type="button" class="gi-tbtn small" id="giZoomResetBtn" title="Reset zoom">100%</button>
                <button type="button" class="gi-tbtn primary" id="giZoomInBtn" title="Perbesar (+)">+</button>
                <span class="gi-tseparator"></span>
                <button type="button" class="gi-tbtn" id="giRotateLeftBtn" title="Putar kiri (Shift+R)">⟲</button>
                <button type="button" class="gi-tbtn small" id="giRotateResetBtn" title="Reset rotasi">0°</button>
                <button type="button" class="gi-tbtn primary" id="giRotateRightBtn" title="Putar kanan (R)">⟳</button>
                <span class="gi-tseparator"></span>
                <button type="button" class="gi-tbtn" id="giFlipHBtn" title="Flip horizontal (H)">⇋</button>
                <button type="button" class="gi-tbtn" id="giFlipVBtn" title="Flip vertikal (V)">⇅</button>
              </div>

              <!-- Baris 2: Filters + Undo/Redo + Tools -->
              <div class="gi-toolbar-row">
                <button type="button" class="gi-tbtn small" id="giUndoBtn" title="Undo (Ctrl+Z)">↶</button>
                <button type="button" class="gi-tbtn small" id="giRedoBtn" title="Redo (Ctrl+Y)">↷</button>
                <span class="gi-tseparator"></span>
                <button type="button" class="gi-tbtn small" id="giInvertBtn" title="Invert warna (I)">🎨</button>
                <button type="button" class="gi-tbtn small" id="giGrayBtn" title="Grayscale">⬛</button>
                <button type="button" class="gi-tbtn small" id="giGridBtn" title="Grid overlay (G)">⊞</button>
                <span class="gi-tseparator"></span>
                <button type="button" class="gi-tbtn small" id="giFitBtn" title="Auto-fit (F)">⤢</button>
                <button type="button" class="gi-tbtn small" id="giPanResetBtn" title="Reset posisi">⌖</button>
                <span class="gi-tseparator"></span>
                <button type="button" class="gi-tbtn small" id="giFullscreenBtn" title="Fullscreen">🔍</button>
                <button type="button" class="gi-tbtn small" id="giReplaceBtn" title="Ganti gambar">🔄</button>
                <button type="button" class="gi-tbtn small" id="giRemoveBtn" title="Hapus gambar">🗑️</button>
              </div>

              <!-- Baris 3: Brightness + Contrast -->
              <div class="gi-filter-row">
                <span class="gi-filter-label">☀️ Terang</span>
                <input type="range" id="giBrightness" min="20" max="200" value="100">
                <span class="gi-filter-label">🌗 Kontras</span>
                <input type="range" id="giContrast" min="20" max="200" value="100">
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Kolom kanan: pilihan -->
          <div class="gi-detail-right">
            <div class="gi-search-box">
              <input type="text" id="giSearchInput"
                placeholder="Cari item interpretasi..."
                value="${escapeHtml(state.searchQuery || '')}">
            </div>

            ${sectionsHTML || '<div style="text-align:center;padding:40px;color:#94a3b8;">Belum ada data untuk tes ini.</div>'}

            <div class="gi-nav">
              <button type="button" class="gi-prev">← Sebelumnya</button>
              <div class="gi-step-info"
                style="font-size: 12px; font-weight: 800; color: #64748b;"></div>
              <button type="button" class="gi-next">Selanjutnya →</button>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 14px;
              padding-top: 14px; border-top: 1px solid #e2e8f0;">
              <button type="button" id="giClearBtn"
                style="flex: 1; padding: 10px; border: 2px solid #fca5a5;
                  background: #fff; color: #dc2626; border-radius: 10px;
                  font-family: inherit; font-size: 12.5px; font-weight: 800;
                  cursor: pointer;">
                🗑️ Hapus
              </button>
              <button type="button" id="giSaveBtn"
                style="flex: 2; padding: 10px; border: 0;
                  background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark});
                  color: #fff; border-radius: 10px;
                  font-family: inherit; font-size: 13px; font-weight: 900;
                  cursor: pointer;">
                💾 Simpan & Kembali
              </button>
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
    if (btnPrev) btnPrev.addEventListener('click', () => {
      if (currentStep > 0) { currentStep--; renderStep(); }
    });
    if (btnNext) btnNext.addEventListener('click', () => {
      if (currentStep < TOTAL - 1) { currentStep++; renderStep(); }
    });
    renderStep();

/* ============================================================
   Helper: re-render sambil menjaga posisi scroll
   ============================================================ */
function __rerenderPreserveScroll(testKey) {
  const root = getRoot();
  const rightPanel = root ? root.querySelector('.gi-detail-right') : null;

  // Simpan posisi scroll SEBELUM re-render
  const savedRootScroll  = root ? root.scrollTop : 0;
  const savedPanelScroll = rightPanel ? rightPanel.scrollTop : 0;

  renderTestDetail(testKey);

  // Restore posisi scroll SETELAH re-render
  const newRoot = getRoot();
  const newRightPanel = newRoot ? newRoot.querySelector('.gi-detail-right') : null;
  if (newRoot)       newRoot.scrollTop = savedRootScroll;
  if (newRightPanel) newRightPanel.scrollTop = savedPanelScroll;
}

/* ============================================================
   Item click — pakai helper preserve scroll
   ============================================================ */
root.querySelectorAll('.js-option-item').forEach(label => {
  label.addEventListener('click', (e) => {
    e.preventDefault();
    const sectionId = label.getAttribute('data-section');
    const itemId = label.getAttribute('data-item');
    const type = label.getAttribute('data-type');

    const section = (data.slides || [])
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
    __rerenderPreserveScroll(testKey);   // ← ganti dari renderTestDetail(testKey)
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
    __rerenderPreserveScroll(testKey);   // ← pakai helper
  });
});

    /* ===== Search ===== */
    const searchInput = document.getElementById('giSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        const items = root.querySelectorAll('.js-option-item');
        items.forEach(el => {
          const label = (el.textContent || '').toLowerCase();
          el.parentElement.style.display =
            (!state.searchQuery || label.includes(state.searchQuery)) ? '' : 'none';
        });
      }, 200));
    }

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
      toast('Pilihan dihapus', 'warn');
    });
    document.getElementById('giSaveBtn').addEventListener('click', () => {
      saveDraft(); renderLanding();
    });

    /* ===== Image Viewer Init ===== */
    if (currentImg) {
      const viewport = document.getElementById('giViewport');
      const img = document.getElementById('giCandidateImg');
      createImageViewer({ viewport, img, testKey });
    }

    /* ===== Image Upload Handlers ===== */
    __attachImageUploadHandlers(testKey, theme);
  }

  /* ============================================================
     Upload handler (drag / paste / url)
     ============================================================ */
  function __attachImageUploadHandlers(testKey, theme) {
    function setImage(src) {
      state.candidateImages[testKey] = src || '';
      Object.assign(state.imageState[testKey], defaultImageState());
      saveDraft();
      renderTestDetail(testKey);
      toast('Gambar diupload', 'success');
    }

    function readFile(file) {
      if (!file || !file.type.startsWith('image/')) {
        toast('File harus gambar', 'error'); return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast('Ukuran maksimal 10 MB', 'error'); return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target.result);
      reader.onerror = () => toast('Gagal baca file', 'error');
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
        if (fileInput) fileInput.click();
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
        if (!url) return toast('URL kosong', 'warn');
        if (!/^https?:\/\//i.test(url) && !url.startsWith('data:')) {
          return toast('URL harus http(s)://', 'error');
        }
        setImage(url);
      });
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); urlBtn.click(); }
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
     KATEGORI
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
    if (dapCount + baumCount + htpCount === 0) {
      toast('Pilih minimal 1 item di DAP/BAUM/HTP', 'error'); return;
    }

    for (let i = 0; i < state.categories.length; i++) {
      const c = state.categories[i];
      if (!c.score) { toast(`Kategori ${i+1} (${c.name}) belum diisi skor`, 'error'); return; }
      if (!c.narrative.trim()) { toast(`Kategori ${i+1} (${c.name}) belum diisi narasi`, 'error'); return; }
    }

    state.conclusion = (document.getElementById('giConclusion')?.value || '').trim();
    if (!state.conclusion) { toast('Kesimpulan keseluruhan wajib diisi', 'error'); return; }

    state.recommendation = document.getElementById('giRecommendation')?.value || '';
    if (!state.recommendation) { toast('Pilih tingkat rekomendasi', 'error'); return; }

    state.reasons = (document.getElementById('giReasons')?.value || '').trim();
    if (!state.reasons) { toast('Alasan rekomendasi wajib diisi', 'error'); return; }

    state.development = (document.getElementById('giDevelopment')?.value || '').trim();
    if (!state.development) { toast('Rekomendasi pengembangan wajib diisi', 'error'); return; }

    const btn = document.getElementById('giSubmitBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Mengirim...';

    try {
      toast('Menyimpan ke Firebase...', 'info');
      await saveToFirebase();
      btn.textContent = '📄 Membuat PDF...';
      const pdfBlob = await generatePDF();
      btn.textContent = '📤 Mengupload...';
      await uploadToGAS(pdfBlob);
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      showSuccess();
    } catch (err) {
      console.error('[GRAFIS-INTERP] Gagal:', err);
      toast('Gagal: ' + (err.message || 'Coba lagi'), 'error');
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
