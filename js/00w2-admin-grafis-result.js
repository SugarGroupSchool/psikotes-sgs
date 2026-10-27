/* ============================================================
   js/00w2-admin-grafis-result.js — v6.1 (Final Layout)
   ------------------------------------------------------------
   🆕 v6.1 [2026-10-26]: opts.contentOnly untuk unified report
   - contentOnly=true → skip Kop, Info, TTD (nama Deni di akhir)
   - expose window.generateGrafisCombinedPDF
   ============================================================ */
(function () {
  'use strict';

  function escHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function cleanText(s) { return String(s || '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/[^\x20-\x7E\n]/g, '').trim(); }
  function fbReady() { return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0; }
  function slugifyDashed(name) { return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80); }
  function safeFileName(name) { return String(name || 'Kandidat').replace(/[^a-zA-Z0-9]/g, '-'); }

  const GRF_REC_MAP = {
    'HIGHLY_RECOMMENDED': { label: '🌟 Highly Recommended', short: 'Highly', color: '#86efac', bg: 'rgba(34,197,94,.15)', br: 'rgba(34,197,94,.45)' },
    'RECOMMENDED':        { label: '✅ Recommended',        short: 'Reco',   color: '#86efac', bg: 'rgba(34,197,94,.12)', br: 'rgba(34,197,94,.35)' },
    'FAIRLY_RECOMMENDED': { label: '⚠️ Fairly Recommended', short: 'Fair',   color: '#fcd34d', bg: 'rgba(245,158,11,.15)', br: 'rgba(245,158,11,.45)' },
    'NOT_RECOMMENDED':    { label: '❌ Not Recommended',    short: 'Not',    color: '#fca5a5', bg: 'rgba(239,68,68,.15)', br: 'rgba(239,68,68,.45)' }
  };
  function getRecMeta(code) { return GRF_REC_MAP[code] || { label: '📋 ' + (code || '-'), short: '-', color: '#cbd5e1', bg: 'rgba(148,163,184,.15)', br: 'rgba(148,163,184,.4)' }; }

  const LEGACY_KATEGORI = [
    'KEMAMPUAN BERPIKIR & PROBLEM SOLVING',
    'EMPATHY, INTERPERSONAL SKILL & TEAMWORK',
    'STABILITAS EMOSI & KONTROL IMPULS',
    'MOTIVATION & ACHIEVEMENT DRIVE',
    'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY',
    'INTEGRITY & RULE COMPLIANCE',
    'TEACHING CREATIVITY'
  ];

  function statusColor(score) {
    const v = Number(score) || 0;
    if (v >= 3.5) return { bg:'rgba(34,197,94,.18)',  br:'rgba(34,197,94,.5)',  tx:'#86efac', label: 'Sangat Baik' };
    if (v >= 3.0) return { bg:'rgba(59,130,246,.18)', br:'rgba(59,130,246,.5)', tx:'#93c5fd', label: 'Baik' };
    if (v >= 2.5) return { bg:'rgba(245,158,11,.18)', br:'rgba(245,158,11,.5)', tx:'#fcd34d', label: 'Cukup' };
    return { bg:'rgba(239,68,68,.18)', br:'rgba(239,68,68,.5)', tx:'#fca5a5', label: 'Perhatian' };
  }

  function __getManualAvg(categories) {
    if (!Array.isArray(categories)) return null;
    const scores = categories
      .map(c => c && c.score != null ? Number(c.score) : null)
      .filter(v => typeof v === 'number' && !isNaN(v) && v >= 1 && v <= 4);
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  function __extractCategories(assessorData) {
    const cats = Array.isArray(assessorData && assessorData.categories) ? assessorData.categories : [];
    if (cats.length === 0) return LEGACY_KATEGORI.map(name => ({ name, score: null, narrative: '' }));
    return cats;
  }

  async function fetchGrafisData(slug) {
    if (!fbReady()) return null;
    const dashed = slugifyDashed(slug);
    const candidates = [slug, dashed].filter((v, i, a) => v && a.indexOf(v) === i);
    for (const s of candidates) {
      try {
        const snap = await firebase.database().ref('sgs_grafis_interp/' + s).once('value');
        const raw = snap.val() || {};
        const clean = {};
        Object.keys(raw).forEach(k => { if (raw[k] && typeof raw[k] === 'object' && raw[k].candidateName) clean[k] = raw[k]; });
        if (Object.keys(clean).length > 0) return clean;
      } catch (e) {}
    }
    return null;
  }

  function sortAssessors(assessors) {
    return assessors.slice().sort((a, b) => { if (a === 'ADMIN') return -1; if (b === 'ADMIN') return 1; return a.localeCompare(b); });
  }

  /* ============================================================
     RENDER: Section Header
     ============================================================ */
  function renderGrafisSectionHTML(data, slug, name, position) {
    const hasData = data && Object.keys(data).length > 0;
    if (!hasData) return '';

    const assessors = sortAssessors(Object.keys(data));
    const total = assessors.length;
    const safeSlug = escHtml(slug);
    const safeName = escHtml(name);
    const safePosition = escHtml(position);

    const chips = assessors.map(code => {
      const d = data[code];
      const rec = getRecMeta(d.recommendation);
      const emoji = rec.label.split(' ')[0];
      return `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-size:10px;font-weight:900;background:rgba(6,182,212,.15);border:1px solid rgba(6,182,212,.45);color:#67e8f9;white-space:nowrap;"><b style="font-family:'Courier New',monospace;">${escHtml(code)}</b><span>${emoji}</span></span>`;
    }).join('');

    return `
      <div style="margin-bottom: 12px; padding: 14px 16px; background: linear-gradient(135deg, rgba(6,182,212,.12), rgba(14,165,233,.08)); border: 1.5px solid rgba(6,182,212,.4); border-radius: 12px; box-shadow: 0 0 0 1px rgba(6,182,212,.1), 0 0 20px rgba(6,182,212,.12);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap;">
          <div style="width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; background: linear-gradient(135deg, #06b6d4, #0ea5e9); border-radius: 10px; font-size: 20px; box-shadow: 0 4px 12px rgba(6,182,212,.35);">🎨</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 12.5px; font-weight: 900; color: #a5f3fc; letter-spacing: .3px;">Hasil Tes Grafis (DAP · BAUM · HTP)</div>
            <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">${total} assessor · penilaian manual</div>
          </div>
        </div>

        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;">${chips}</div>

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="js-grafis-result-open" data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePosition}" style="flex: 1; min-width: 130px; padding: 9px 14px; background: linear-gradient(135deg, #06b6d4, #0ea5e9); border: 0; border-radius: 9px; color: #fff; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(6,182,212,.35);">👁 Lihat Detail</button>
          <button class="js-grafis-result-pdf" data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePosition}" data-tab="combined" style="flex: 1; min-width: 130px; padding: 9px 14px; background: rgba(16,185,129,.18); border: 1px solid rgba(16,185,129,.5); border-radius: 9px; color: #6ee7b7; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">📄 PDF</button>
        </div>
      </div>`;
  }

  /* ============================================================
     RENDER: Detail & Combined
     ============================================================ */
  function renderAssessorDetailHTML(assessorData, assessorCode) {
    if (!assessorData) return '<div style="padding:20px;text-align:center;color:#94a3b8;">Data tidak tersedia.</div>';
    const rec = getRecMeta(assessorData.recommendation);
    const categories = __extractCategories(assessorData);
    const avgManual = __getManualAvg(categories);

    const headerHTML = `
      <div style="padding: 14px; background: linear-gradient(135deg, rgba(6,182,212,.12), rgba(14,165,233,.08)); border: 1px solid rgba(6,182,212,.4); border-radius: 11px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px;">
          <div style="width: 34px; height: 34px; display: grid; place-items: center; background: rgba(6,182,212,.25); border-radius: 9px; font-family: 'Courier New', monospace; font-size: 12px; font-weight: 900; color: #67e8f9;">${escHtml(assessorCode)}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11.5px; font-weight: 900; color: #a5f3fc;">Assessor: ${escHtml(assessorCode)}</div>
            <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">${assessorData.ts ? new Date(assessorData.ts).toLocaleString('id-ID') : '-'}</div>
          </div>
          <span style="padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 900; background: ${rec.bg}; border: 1px solid ${rec.br}; color: ${rec.color}; white-space: nowrap;">${escHtml(rec.label)}</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 6px;">
          <div style="padding: 6px 10px; background: rgba(0,0,0,.28); border-radius: 8px;">
            <div style="font-size:9px;font-weight:900;color:#64748b;letter-spacing:1px;">RATA-RATA (MANUAL)</div>
            <div style="font-size:15px;font-weight:900;color:#67e8f9;margin-top:2px;font-variant-numeric:tabular-nums;">${avgManual !== null ? avgManual.toFixed(2) : '-'} / 4.00</div>
          </div>
        </div>
      </div>`;

    const categoriesHTML = categories.map((cat, idx) => {
      const score = cat.score != null && cat.score !== '' ? Number(cat.score) : null;
      const st = score !== null ? statusColor(score) : { bg:'rgba(148,163,184,.15)', br:'rgba(148,163,184,.4)', tx:'#cbd5e1', label: 'N/A' };
      return `
        <div style="padding: 12px; background: rgba(0,0,0,.22); border-radius: 11px; border: 1px solid rgba(255,255,255,.08); margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap;">
            <span style="width: 28px; height: 28px; display: grid; place-items: center; border-radius: 7px; background: linear-gradient(135deg, #06b6d4, #0ea5e9); color: #fff; font-size: 11px; font-weight: 900;">${idx + 1}</span>
            <span style="flex: 1; min-width: 100px; font-size: 11.5px; font-weight: 800; color: #e2e8f0;">${escHtml(cat.name || '-')}</span>
            ${score !== null ? `<span style="padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 900; background: ${st.bg}; border: 1px solid ${st.br}; color: ${st.tx}; font-variant-numeric: tabular-nums;">${score}/4 · ${st.label}</span>` : `<span style="padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 800; background: rgba(148,163,184,.15); border: 1px solid rgba(148,163,184,.4); color: #94a3b8;">Belum diisi</span>`}
          </div>
          ${cat.narrative ? `<div style="font-size: 10.5px; color: #cbd5e1; line-height: 1.65; white-space: pre-wrap;">${escHtml(cat.narrative)}</div>` : ''}
        </div>`;
    }).join('');

    const summaryHTML = `
      <div style="padding: 14px; background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.35); border-radius: 11px; margin-top: 12px; margin-bottom: 10px;">
        <div style="font-size: 11px; font-weight: 900; color: #fcd34d; margin-bottom: 8px;">📝 KESIMPULAN</div>
        <div style="font-size: 11.5px; color: #e2e8f0; line-height: 1.7; white-space: pre-wrap;">${escHtml(assessorData.conclusion || '-')}</div>
      </div>
      ${assessorData.reasons ? `<div style="padding: 14px; background: rgba(59,130,246,.08); border: 1px solid rgba(59,130,246,.35); border-radius: 11px; margin-bottom: 10px;"><div style="font-size: 11px; font-weight: 900; color: #93c5fd; margin-bottom: 8px;">📌 ALASAN REKOMENDASI</div><div style="font-size: 11.5px; color: #e2e8f0; line-height: 1.7; white-space: pre-wrap;">${escHtml(assessorData.reasons)}</div></div>` : ''}
      ${assessorData.development ? `<div style="padding: 14px; background: rgba(139,92,246,.08); border: 1px solid rgba(139,92,246,.35); border-radius: 11px;"><div style="font-size: 11px; font-weight: 900; color: #c4b5fd; margin-bottom: 8px;">🚀 PENGEMBANGAN</div><div style="font-size: 11.5px; color: #e2e8f0; line-height: 1.7; white-space: pre-wrap;">${escHtml(assessorData.development)}</div></div>` : ''}`;

    return headerHTML + categoriesHTML + summaryHTML;
  }

  function renderCombinedHTML(allData) {
    const assessors = sortAssessors(Object.keys(allData));
    if (assessors.length === 0) return '<div style="padding:20px;text-align:center;color:#94a3b8;">Tidak ada assessor.</div>';

    const allCatNames = [];
    const seenCat = new Set();
    assessors.forEach(code => {
      __extractCategories(allData[code]).forEach(c => {
        if (c && c.name && !seenCat.has(c.name)) {
          seenCat.add(c.name);
          allCatNames.push(c.name);
        }
      });
    });

    const comparisonHTML = `<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse; font-size: 10.5px;"><thead><tr style="background: rgba(0,0,0,.3);"><th style="padding: 8px; text-align: left; color: #94a3b8; font-size: 9.5px; font-weight: 900; letter-spacing: 1px;">KATEGORI</th>${assessors.map(c => `<th style="padding: 8px; text-align: center; color: #67e8f9; font-size: 10px; font-weight: 900;">${escHtml(c)}</th>`).join('')}</tr></thead><tbody>${allCatNames.map(katName => {
      const cells = assessors.map(c => {
        const cats = __extractCategories(allData[c]);
        const cat = cats.find(x => x.name === katName);
        const s = cat && cat.score != null && cat.score !== '' ? Number(cat.score) : null;
        if (s === null) return `<td style="padding: 6px 8px; text-align: center; color: #64748b;">-</td>`;
        const st = statusColor(s);
        return `<td style="padding: 6px 8px; text-align: center;"><span style="display: inline-block; padding: 2px 8px; border-radius: 999px; background: ${st.bg}; border: 1px solid ${st.br}; color: ${st.tx}; font-weight: 900; font-variant-numeric: tabular-nums;">${s}</span></td>`;
      }).join('');
      return `<tr style="border-top: 1px solid rgba(255,255,255,.05);"><td style="padding: 8px; color: #cbd5e1; font-weight: 700;">${escHtml(katName)}</td>${cells}</tr>`;
    }).join('')}</tbody></table></div>`;

    return `
      <div style="padding: 14px; background: rgba(0,0,0,.22); border: 1px solid rgba(255,255,255,.08); border-radius: 11px;">
        <div style="font-size: 11px; font-weight: 900; color: #a5f3fc; margin-bottom: 10px;">📋 PERBANDINGAN SKOR PER KATEGORI</div>${comparisonHTML}
      </div>`;
  }

  function renderTabContent(tab, allData, name, position) {
    if (tab === 'combined') return renderCombinedHTML(allData);
    return renderAssessorDetailHTML(allData[tab], tab);
  }

  async function openGrafisModal(slug, name, position) {
    const old = document.getElementById('grafisResultModal'); if (old) old.remove();
    const data = await fetchGrafisData(slug);
    const overlay = document.createElement('div');
    overlay.id = 'grafisResultModal';
    overlay.setAttribute('data-slug', slug); overlay.setAttribute('data-name', name); overlay.setAttribute('data-position', position || '');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

    if (!data || Object.keys(data).length === 0) {
      overlay.innerHTML = `<div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(6,182,212,.4);border-radius:18px;padding:32px;text-align:center;color:#e2e8f0;box-shadow:0 30px 90px rgba(0,0,0,.65);"><div style="font-size:52px;margin-bottom:12px;">📭</div><div style="font-size:16px;font-weight:900;color:#fff;margin-bottom:8px;">Belum Ada Interpretasi Grafis</div><div style="font-size:13px;color:#94a3b8;line-height:1.65;margin-bottom:22px;">Kandidat <b style="color:#a5f3fc;">${escHtml(name)}</b> belum diinterpretasi oleh assessor manapun.</div><button id="grafisCloseEmpty" style="width:100%;padding:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Tutup</button></div>`;
      document.body.appendChild(overlay); overlay.querySelector('#grafisCloseEmpty').onclick = () => overlay.remove(); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); return;
    }

    const assessors = sortAssessors(Object.keys(data));
    const tabs = assessors.length > 1 ? ['combined', ...assessors] : assessors;
    let currentTab = assessors.length > 1 ? 'combined' : (assessors[0] || 'combined');
    const finalName = name || data[assessors[0]]?.candidateName || 'Kandidat';
    const finalPos  = position || data[assessors[0]]?.candidatePosition || '-';

    function renderTabsHTML() {
      return tabs.map(t => {
        const isActive = t === currentTab;
        const label = t === 'combined' ? '📊 Combined' : t;
        return `<button class="js-grafis-tab ${isActive ? 'active' : ''}" data-tab="${escHtml(t)}" style="padding: 8px 16px; border: 1px solid ${isActive ? 'rgba(6,182,212,.7)' : 'rgba(255,255,255,.12)'}; border-radius: 8px; background: ${isActive ? 'rgba(6,182,212,.2)' : 'rgba(255,255,255,.04)'}; color: ${isActive ? '#67e8f9' : '#cbd5e1'}; font-family: inherit; font-size: 11.5px; font-weight: 900; cursor: pointer; white-space: nowrap;">${escHtml(label)}</button>`;
      }).join('');
    }

    overlay.innerHTML = `
      <div style="width:min(1000px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(6,182,212,.4);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;">
        <div style="padding:16px 20px;background:linear-gradient(135deg,#06b6d4,#0ea5e9);display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <div style="width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:11px;font-size:20px;">🎨</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">HASIL TES GRAFIS · DAP · BAUM · HTP</div>
            <div style="font-size:16px;font-weight:900;color:#fff;margin-top:2px;word-break:break-word;">${escHtml(finalName)}</div>
            <div style="font-size:11px;opacity:.85;margin-top:2px;">💼 ${escHtml(finalPos)}</div>
          </div>
          <button id="grafisCloseBtn" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>
        </div>
        <div id="grafisTabBar" style="padding:12px 20px;background:rgba(0,0,0,.3);border-bottom:1px solid rgba(255,255,255,.06);display:flex;gap:6px;flex-wrap:wrap;overflow-x:auto;">${renderTabsHTML()}</div>
        <div id="grafisTabContent" style="flex:1;overflow-y:auto;padding:16px 20px 20px;">${renderTabContent(currentTab, data, finalName, finalPos)}</div>
        <div style="padding:12px 20px;background:rgba(0,0,0,.32);border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="color:#94a3b8;font-size:10.5px;font-weight:600;">ℹ️ Data dari Firebase (sgs_grafis_interp) · ${assessors.length} assessor</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="js-grafis-result-pdf" id="grafisPdfBtn" data-slug="${escHtml(slug)}" data-name="${escHtml(finalName)}" data-position="${escHtml(finalPos)}" data-tab="${currentTab}" style="padding:8px 16px;background:linear-gradient(135deg,#10b981,#059669);border:0;border-radius:9px;color:#fff;font-family:inherit;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,.35);">📄 PDF</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    function bindTabs() {
      overlay.querySelectorAll('.js-grafis-tab').forEach(btn => {
        btn.onclick = () => {
          const tab = btn.getAttribute('data-tab'); if (tab === currentTab) return;
          currentTab = tab;
          overlay.querySelector('#grafisTabBar').innerHTML = renderTabsHTML(); bindTabs();
          overlay.querySelector('#grafisTabContent').innerHTML = renderTabContent(tab, data, finalName, finalPos);
        };
      });
    }
    bindTabs();
    overlay.querySelector('#grafisCloseBtn').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  /* ============================================================
     PDF HELPERS & GENERATOR
     ============================================================ */
  function __pdfJustify(doc, line, x, y, maxW, fontSize) {
    const words = line.trim().split(/\s+/); if (words.length < 2) { doc.text(line, x, y); return; }
    const textW = doc.getTextWidth(line); const gap = (maxW - textW) / (words.length - 1);
    if (gap <= 0 || gap > fontSize * 0.55) { doc.text(line, x, y); return; }
    const spaceW = doc.getTextWidth(' '); let xPos = x;
    words.forEach((w, i) => { doc.text(w, xPos, y); if (i < words.length - 1) xPos += doc.getTextWidth(w) + spaceW + gap; });
  }

  function ensurePage(doc, y, need, PH) { if (y + need > PH - 15) { doc.addPage(); return 15; } return y; }
  function printParagraph(doc, text, indent, fontSize, lineH, PW, PH, y) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(fontSize); const maxW = PW - 12 - indent; const lines = doc.splitTextToSize(cleanText(text || ''), maxW);
    lines.forEach((line, idx) => { y = ensurePage(doc, y, lineH + 2, PH); const isLast = idx === lines.length - 1; if (isLast || line.trim().length < 3) { doc.text(line, indent, y); } else { __pdfJustify(doc, line, indent, y, maxW, fontSize); } y += lineH; }); return y;
  }

  async function fetchCandidateImages(slug) {
    try {
      const snap = await firebase.database().ref('sgs_grafis_images/' + slug).once('value');
      const data = snap.val(); return (data && data.images) ? data.images : null;
    } catch (e) { return null; }
  }

  /* ============================================================
     GENERATE PDF
     🆕 opts.contentOnly = true → skip Kop, Info, TTD
     ============================================================ */
  async function generateGrafisCombinedPDF(slug, name, position, allData, opts) {
    opts = opts || {};
    if (typeof window.loadPdfLibs === 'function') await window.loadPdfLibs();
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF tidak tersedia');
    const assessors = sortAssessors(Object.keys(allData));

    const firstCode = assessors[0];
    const d = allData[firstCode];
    const rec = getRecMeta(d.recommendation);
    const categories = __extractCategories(d);

    const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth(); const PH = doc.internal.pageSize.getHeight(); const M = 15; const CW = PW - 2 * M; let y = 20;

    /* 🆕 1. KOP SURAT / SECTION TITLE */
    if (!opts.contentOnly) {
      /* KOP penuh */
      try { const logoUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO) || 'https://cdn.jsdelivr.net/gh/Pragas123/assets@main/nmqo6a.png'; const resp = await fetch(logoUrl, { cache: 'no-cache' }); if (resp.ok) { const blob = await resp.blob(); const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onloadend = () => res(r.result); r.readAsDataURL(blob); }); doc.addImage(dataUrl, 'PNG', PW / 2 - 8, 8, 16, 13); } } catch (e) {}

      y = 26;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('LAPORAN INTERPRETASI GRAFIS', PW / 2, y, { align: 'center' }); y += 4.5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text('SUGAR GROUP SCHOOLS', PW / 2, y, { align: 'center' }); y += 3.5;
      doc.setFontSize(7.5); doc.text(`DAP · BAUM · HTP — Penilaian Manual`, PW / 2, y, { align: 'center' }); y += 4;
      doc.setDrawColor(6, 182, 212); doc.setLineWidth(0.5); doc.line(M, y, PW - M, y); y += 6;

      /* 2. INFORMASI KANDIDAT */
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('INFORMASI KANDIDAT', M, y); y += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      const tanggal = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      [['Nama Kandidat', cleanText(name)], ['Posisi', cleanText(position) || '-'], ['Tanggal', tanggal], ['Jumlah Assessor', String(assessors.length)]].forEach(([k, v]) => { doc.text(k + ' :', M + 2, y); doc.text(String(v), M + 45, y); y += 4; });
      y += 3; doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 6;
    } else {
      /* Section Title mini */
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(6, 182, 212);
      doc.text('HASIL TES GRAFIS', M, y); y += 5;
      doc.setDrawColor(6, 182, 212); doc.setLineWidth(0.6);
      doc.line(M, y, M + 60, y); doc.setLineWidth(0.2); doc.setTextColor(0); y += 6;
    }

    /* 3. SKOR PER KATEGORI */
    y = ensurePage(doc, y, 30, PH);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(6, 182, 212);
    doc.text('SKOR PER KATEGORI', M, y); doc.setTextColor(0); y += 5;

    doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.setFillColor(6, 182, 212); doc.rect(M, y - 3, CW, 6, 'F');
    doc.text('KATEGORI', M + 2, y + 1); doc.text('SKOR', PW - M - 15, y + 1); doc.setTextColor(0); y += 6;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    categories.forEach((cat, idx) => {
      y = ensurePage(doc, y, 8, PH);
      if (idx % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(M, y - 3, CW, 6, 'F'); }
      doc.text(cleanText(cat.name || '').slice(0, 50), M + 2, y + 1);
      doc.text(String(cat.score || '-'), PW - M - 15, y + 1);
      y += 6;
    });
    y += 4;

    /* 4. KESIMPULAN PER KATEGORI */
    y = ensurePage(doc, y, 25, PH);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(6, 182, 212);
    doc.text('KESIMPULAN PER KATEGORI', M, y); doc.setTextColor(0); y += 5;
    categories.forEach((cat, idx) => {
      if (!cat.narrative) return;
      y = ensurePage(doc, y, 15, PH);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text(`${idx + 1}. ${cleanText(cat.name || '')} - SKOR: ${cat.score}/4`, M + 1, y); y += 4;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      y = printParagraph(doc, cat.narrative, M + 4, 7.5, 3.5, PW, PH, y);
      y += 2;
    });
    y += 2;

    /* 5. KESIMPULAN KESELURUHAN */
    if (d.conclusion) {
      y = ensurePage(doc, y, 25, PH); doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 5;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(6, 182, 212);
      doc.text('KESIMPULAN KESELURUHAN', M, y); doc.setTextColor(0); y += 5;
      y = printParagraph(doc, d.conclusion, M, 8, 3.5, PW, PH, y);
      y += 4;
    }

    /* 6. TINGKAT REKOMENDASI */
    if (d.recommendation) {
      y = ensurePage(doc, y, 15, PH);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(6, 182, 212);
      doc.text('TINGKAT REKOMENDASI', M, y); doc.setTextColor(0); y += 5;
      doc.setFontSize(10);
      doc.setTextColor(rec.color === '#86efac' ? 22 : rec.color === '#fcd34d' ? 161 : 185, rec.color === '#86efac' ? 101 : rec.color === '#fcd34d' ? 98 : 28, rec.color === '#86efac' ? 52 : rec.color === '#fcd34d' ? 7 : 28);
      doc.text(cleanText(rec.label), M, y); doc.setTextColor(0); y += 6;
    }

    /* 7. ALASAN REKOMENDASI */
    if (d.reasons) {
      y = ensurePage(doc, y, 25, PH);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(6, 182, 212);
      doc.text('ALASAN REKOMENDASI', M, y); doc.setTextColor(0); y += 5;
      y = printParagraph(doc, d.reasons, M, 8, 3.5, PW, PH, y);
      y += 4;
    }

    /* 8. REKOMENDASI PENGEMBANGAN */
    if (d.development) {
      y = ensurePage(doc, y, 25, PH);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(6, 182, 212);
      doc.text('REKOMENDASI PENGEMBANGAN', M, y); doc.setTextColor(0); y += 5;
      y = printParagraph(doc, d.development, M, 8, 3.5, PW, PH, y);
      y += 6;
    }

    /* 9. GAMBAR KANDIDAT & INTERPRETASI */
    const cImgs = await fetchCandidateImages(slug);
    const testKeys = ['dap', 'baum', 'htp'];
    const titleMap = { dap: 'DAP - Draw A Person', baum: 'BAUM - Tree Test', htp: 'HTP - House Tree Person' };

    for (const key of testKeys) {
      const imgData = cImgs && cImgs[key] ? cImgs[key].dataUrl : null;
      const textData = d[key + 'Text'] || '';

      if (!imgData && !textData) continue;

      y = ensurePage(doc, y, 30, PH);
      doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 5;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(6, 182, 212);
      doc.text(`${titleMap[key]}`, M, y); doc.setTextColor(0); y += 5;

      if (imgData) {
        try {
          const p = doc.getImageProperties(imgData);
          let w = CW;
          let h = (p.height * w) / p.width;

          if (h > PH - 60) { h = PH - 60; w = (p.width * h) / p.height; }
          if (y + h > PH - 15) { doc.addPage(); y = 15; }

          const xOffset = M + (CW - w) / 2;
          doc.addImage(imgData, 'JPEG', xOffset, y, w, h);
          y += h + 5;
        } catch (e) {}
      }

      if (textData) {
        y = ensurePage(doc, y, 20, PH);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        y = printParagraph(doc, textData, M, 8, 4, PW, PH, y);
        y += 4;
      }
    }

    /* 🆕 10. TANDA TANGAN (TTD) — hanya standalone */
    if (!opts.contentOnly) {
      y = ensurePage(doc, y, 40, PH);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(0);
      doc.text('ttd', PW - 65, y); y += 12;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('Deni Pragas Septian Pratama', PW - 65, y); y += 4;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text('(Grafis Interpreter)', PW - 65, y);
    }

    return doc;
  }

  async function downloadGrafisPDF(slug, name, position, tab) {
    const data = await fetchGrafisData(slug);
    if (!data) throw new Error('Data Grafis tidak tersedia');
    const doc = await generateGrafisCombinedPDF(slug, name, position, data);
    doc.save('Hasil-Grafis-' + safeFileName(name) + '-Lengkap.pdf');
  }

  window.__attachGrafisRealtime = function (slug, name, position, sectionEl, overlayEl) {
    if (!sectionEl) return;
    if (!fbReady()) { fetchGrafisData(slug).then(data => { sectionEl.innerHTML = renderGrafisSectionHTML(data, slug, name, position); }).catch(() => {}); return; }
    const ref = firebase.database().ref('sgs_grafis_interp/' + slug);
    const cb = (snap) => { const raw = snap.val() || {}; const clean = {}; Object.keys(raw).forEach(k => { if (raw[k] && typeof raw[k] === 'object' && raw[k].candidateName) clean[k] = raw[k]; }); sectionEl.innerHTML = renderGrafisSectionHTML(Object.keys(clean).length ? clean : null, slug, name, position); };
    ref.on('value', cb);
    const parent = overlayEl && overlayEl.parentNode ? overlayEl.parentNode : document.body;
    const mo = new MutationObserver(() => { if (!document.body.contains(overlayEl)) { try { ref.off('value', cb); } catch (e) {} mo.disconnect(); } });
    mo.observe(document.body, { childList: true });
  };

  if (!window.__grafisResultDelegationAttached) {
    window.__grafisResultDelegationAttached = true;
    document.addEventListener('click', async function (e) {
      const openBtn = e.target.closest('.js-grafis-result-open');
      if (openBtn) { e.preventDefault(); e.stopPropagation(); if (openBtn.disabled) return; const slug = openBtn.getAttribute('data-slug'); const name = openBtn.getAttribute('data-name'); const position = openBtn.getAttribute('data-position'); if (slug) openGrafisModal(slug, name, position); return; }
      const pdfBtn = e.target.closest('.js-grafis-result-pdf');
      if (pdfBtn) {
        e.preventDefault(); e.stopPropagation();
        const slug = pdfBtn.getAttribute('data-slug'); const name = pdfBtn.getAttribute('data-name'); const position = pdfBtn.getAttribute('data-position');
        if (!slug) return;
        const prev = pdfBtn.innerHTML; pdfBtn.innerHTML = '⏳ Memproses PDF...'; pdfBtn.disabled = true;
        try { await downloadGrafisPDF(slug, name, position); pdfBtn.innerHTML = '✓ Terunduh'; setTimeout(() => { pdfBtn.innerHTML = prev; pdfBtn.disabled = false; }, 1800); } catch (err) { alert('Gagal PDF: ' + err.message); pdfBtn.innerHTML = prev; pdfBtn.disabled = false; }
        return;
      }
    }, true);
  }

  window.openGrafisModal = openGrafisModal;
  window.downloadGrafisPDF = downloadGrafisPDF;
  window.generateGrafisCombinedPDF = generateGrafisCombinedPDF;  /* 🆕 unified */
  window.renderGrafisSectionHTML = renderGrafisSectionHTML;
  window.__fetchGrafisData = fetchGrafisData;

  console.log('[GRAFIS-RESULT-ADMIN] ✓ Loaded v6.1 — Final Layout + contentOnly');
})();