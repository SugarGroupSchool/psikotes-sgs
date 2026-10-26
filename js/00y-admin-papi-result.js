/* ============================================================
   js/00y-admin-papi-result.js — v1.1 (Admin Web View Hasil PAPI)
   ------------------------------------------------------------
   - Baca data dari sgs_scores/{slug} (auto-push dari kandidat)
   - renderPAPISectionHTML() → card di area "Hasil Tes"
   - openPAPIModal()        → modal 7 grup × 20 dimensi + interpretasi
   - generatePAPIPDF()      → PDF ringkas on-demand
   - Reuse global: getInterpretasiPAPI, skorPAPI*, analisisKecocokanPAPIDetail
   🆕 v1.1 [2026-10-26]: opts.contentOnly untuk unified report
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     HELPERS
     ============================================================ */
  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function fbReady() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
  }
  function slugifyDashed(name) {
    return String(name || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  }

  /* ============================================================
     GROUP MAP — 7 grup × 20 dimensi
     ============================================================ */
  const PAPI_GROUPS = [
    { name: 'Arah Kerja',   codes: ['N', 'G', 'A'] },
    { name: 'Kepemimpinan', codes: ['L', 'P', 'I'] },
    { name: 'Aktivitas',    codes: ['T', 'V'] },
    { name: 'Pergaulan',    codes: ['X', 'S', 'B', 'O'] },
    { name: 'Gaya Kerja',   codes: ['R', 'D', 'C'] },
    { name: 'Sifat',        codes: ['Z', 'E', 'K'] },
    { name: 'Ketaatan',     codes: ['F', 'W'] }
  ];

  const PAPI_LABELS = {
    N: 'Kebutuhan Menyelesaikan Tugas',
    G: 'Peran sebagai Pekerja Keras',
    A: 'Hasrat untuk Berprestasi',
    L: 'Peran sebagai Pemimpin',
    P: 'Kendali atas Orang Lain',
    I: 'Pengambilan Keputusan',
    T: 'Aktivitas Mental / Kesibukan',
    V: 'Aktivitas Fisik / Energi',
    X: 'Kebutuhan Mendapat Perhatian',
    S: 'Pergaulan Sosial',
    B: 'Kebutuhan Berkelompok',
    O: 'Kedekatan Emosional',
    R: 'Tipe Teoretikal',
    D: 'Detail & Akurasi',
    C: 'Keteraturan & Struktur',
    Z: 'Inovasi & Perubahan',
    E: 'Pengendalian Emosi',
    K: 'Agresivitas & Konfrontasi',
    F: 'Loyalitas pada Atasan',
    W: 'Ketaatan pada Aturan'
  };

  function scoreColor(score) {
    const v = Number(score) || 0;
    if (v >= 7) return { bg:'rgba(34,197,94,.18)',  br:'rgba(34,197,94,.55)',  tx:'#86efac' };
    if (v >= 4) return { bg:'rgba(245,158,11,.18)', br:'rgba(245,158,11,.55)', tx:'#fcd34d' };
    return           { bg:'rgba(239,68,68,.18)',   br:'rgba(239,68,68,.55)',  tx:'#fca5a5' };
  }
  function barGradient(score) {
    const v = Number(score) || 0;
    if (v >= 7) return 'linear-gradient(90deg,#16a34a,#22c55e)';
    if (v >= 4) return 'linear-gradient(90deg,#f59e0b,#fbbf24)';
    return           'linear-gradient(90deg,#dc2626,#ef4444)';
  }
  function scoreToPct(score) {
    return Math.max(0, Math.min(100, (Number(score) || 0) / 9 * 100));
  }

  /* ============================================================
     FETCH
     ============================================================ */
  async function fetchPAPIData(slug) {
    if (!fbReady()) return null;
    const dashed = slugifyDashed(slug);
    const candidates = [slug, dashed].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const s of candidates) {
      try {
        const snap = await firebase.database().ref('sgs_scores/' + s).once('value');
        const d = snap.val();
        if (!d) continue;

        const hasScores  = d.PAPI_scores && typeof d.PAPI_scores === 'object';
        const hasAnswers = Array.isArray(d.PAPI_answers) && d.PAPI_answers.length > 0;

        if (hasScores || hasAnswers) {
          return {
            answers:           hasAnswers ? d.PAPI_answers : [],
            scores:            hasScores ? d.PAPI_scores : {},
            completed:         d.PAPI_completed === true,
            candidateName:     d.candidateName || '',
            candidatePosition: d.candidatePosition || '',
            _slug:             s
          };
        }
      } catch (e) { /* silent */ }
    }
    return null;
  }

  /* ============================================================
     COMPUTE — pakai scores langsung, fallback ke skorPAPI*
     ============================================================ */
  function computePAPIScores(data) {
    if (!data) return null;

    if (data.scores && Object.keys(data.scores).length >= 10) {
      return data.scores;
    }

    if (Array.isArray(data.answers) && data.answers.length > 0
        && typeof skorPAPIArahKerja === 'function') {
      try {
        return Object.assign({},
          skorPAPIArahKerja(data.answers),
          skorPAPIKepemimpinan(data.answers),
          skorPAPIAktivitas(data.answers),
          skorPAPIPergaulan(data.answers),
          skorPAPIGayaKerja(data.answers),
          skorPAPISifat(data.answers),
          skorPAPIKetaatan(data.answers)
        );
      } catch (e) { return null; }
    }
    return null;
  }

  /* ============================================================
     RENDER: Section Card
     ============================================================ */
  function renderPAPISectionHTML(data, slug, name, position) {
    if (!data) return '';

    const scores = computePAPIScores(data);
    if (!scores) {
      return `
        <div style="margin-bottom: 12px; padding: 14px 16px; background: rgba(239,68,68,.06); border: 1px dashed rgba(239,68,68,.3); border-radius: 11px;">
          <div style="font-size: 11.5px; color: #fca5a5; font-weight: 800;">⚠️ Data PAPI ada tapi gagal dihitung</div>
        </div>`;
    }

    const safeSlug     = escHtml(slug || data._slug || '');
    const safeName     = escHtml(name || data.candidateName || '');
    const safePosition = escHtml(position || data.candidatePosition || '');

    const groupChipsHTML = PAPI_GROUPS.map(gr => `
      <div style="padding: 8px 10px; background: rgba(0,0,0,.28); border-radius: 9px; border: 1px solid rgba(255,255,255,.06);">
        <div style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #64748b; margin-bottom: 5px;">${escHtml(gr.name.toUpperCase())}</div>
        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
          ${gr.codes.map(c => {
            const v = Number(scores[c] || 0);
            const col = scoreColor(v);
            return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:800;background:${col.bg};border:1px solid ${col.br};color:${col.tx};white-space:nowrap;">
              <b style="font-family:'Courier New',monospace;">${c}</b>
              <span style="font-variant-numeric:tabular-nums;">${v}</span>
            </span>`;
          }).join('')}
        </div>
      </div>
    `).join('');

    const allVals = Object.values(scores).map(v => Number(v) || 0);
    const avg = allVals.length ? (allVals.reduce((a,b)=>a+b,0) / allVals.length) : 0;

    return `
      <div style="margin-bottom: 12px; padding: 14px 16px; background: linear-gradient(135deg, rgba(59,130,246,.12), rgba(139,92,246,.08)); border: 1.5px solid rgba(59,130,246,.4); border-radius: 12px; box-shadow: 0 0 0 1px rgba(59,130,246,.1), 0 0 20px rgba(59,130,246,.12);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap;">
          <div style="width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 10px; font-size: 20px; box-shadow: 0 4px 12px rgba(59,130,246,.35);">📊</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 12.5px; font-weight: 900; color: #bfdbfe; letter-spacing: .3px;">Hasil Tes PAPI Kostick</div>
            <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">
              20 dimensi · Rata-rata: <b style="color:#a5b4fc;">${avg.toFixed(1)}</b>/9
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 6px; margin-bottom: 10px;">
          ${groupChipsHTML}
        </div>

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="js-papi-open"
            data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePosition}"
            style="flex: 1; min-width: 130px; padding: 9px 14px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border: 0; border-radius: 9px; color: #fff; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(59,130,246,.35);">
            👁 Lihat Detail (20 Dimensi)
          </button>
          <button class="js-papi-pdf"
            data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePosition}"
            style="padding: 9px 16px; background: rgba(16,185,129,.18); border: 1px solid rgba(16,185,129,.5); border-radius: 9px; color: #6ee7b7; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
            📄 PDF
          </button>
        </div>
      </div>`;
  }

  /* ============================================================
     RENDER: Modal Body
     ============================================================ */
  function renderModalBody(scores, position) {
    const groupBlocksHTML = PAPI_GROUPS.map(gr => `
      <div style="padding: 14px; background: rgba(0,0,0,.22); border-radius: 11px; border: 1px solid rgba(255,255,255,.08); margin-bottom: 10px;">
        <div style="font-size: 11px; font-weight: 900; letter-spacing: 1px; color: #a5b4fc; margin-bottom: 10px;">${escHtml(gr.name.toUpperCase())}</div>
        ${gr.codes.map(c => {
          const v = Number(scores[c] || 0);
          const col = scoreColor(v);
          const pct = scoreToPct(v);
          const interp = (typeof getInterpretasiPAPI === 'function')
            ? getInterpretasiPAPI(c, v)
            : '-';
          return `
            <div style="padding: 10px 12px; background: rgba(255,255,255,.03); border-radius: 9px; margin-bottom: 6px; border: 1px solid rgba(255,255,255,.06);">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap;">
                <span style="width: 30px; font-family: 'Courier New', monospace; font-size: 14px; font-weight: 900; color: ${col.tx}; text-align: center;">${c}</span>
                <span style="flex: 1; min-width: 100px; font-size: 11.5px; font-weight: 800; color: #e2e8f0;">${escHtml(PAPI_LABELS[c] || c)}</span>
                <span style="padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 900; font-variant-numeric: tabular-nums; background: ${col.bg}; border: 1px solid ${col.br}; color: ${col.tx};">${v}/9</span>
              </div>
              <div style="height: 5px; background: rgba(255,255,255,.07); border-radius: 999px; overflow: hidden; margin-bottom: 8px;">
                <div style="width: ${pct}%; height: 100%; background: ${barGradient(v)}; border-radius: inherit;"></div>
              </div>
              <div style="font-size: 10.5px; color: #94a3b8; line-height: 1.55;">${escHtml(interp)}</div>
            </div>`;
        }).join('')}
      </div>
    `).join('');

    let posHTML = '';
    if (position && typeof analisisKecocokanPAPIDetail === 'function') {
      try {
        const analysis = analisisKecocokanPAPIDetail(scores, position, 'Kandidat');
        if (analysis && analysis !== '-' && !analysis.startsWith('Posisi')) {
          const lines = String(analysis).split('\n').map(l => l.trim()).filter(Boolean);
          posHTML = `
            <div style="margin-top: 12px; padding: 14px 16px; background: linear-gradient(135deg, rgba(59,130,246,.12), rgba(139,92,246,.08)); border: 1px solid rgba(59,130,246,.4); border-radius: 11px;">
              <div style="font-size: 11px; font-weight: 900; letter-spacing: 1px; color: #bfdbfe; margin-bottom: 10px;">🎯 ANALISIS UNTUK POSISI: ${escHtml(position)}</div>
              <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.7;">
                ${lines.map(l => {
                  const clean = l
                    .replace(/^\*\*(.+?)\*\*:?/, '<b style="color:#a5b4fc;">$1:</b>')
                    .replace(/\*\*(.+?)\*\*/g, '<b style="color:#a5b4fc;">$1</b>')
                    .replace(/^-\s*/, '• ');
                  return `<div style="margin-bottom: 4px;">${clean}</div>`;
                }).join('')}
              </div>
            </div>`;
        }
      } catch (e) { /* silent */ }
    }

    return groupBlocksHTML + posHTML;
  }

  /* ============================================================
     MODAL
     ============================================================ */
  async function openPAPIModal(slug, name, position) {
    const old = document.getElementById('papiModal'); if (old) old.remove();
    const data = await fetchPAPIData(slug);

    const overlay = document.createElement('div');
    overlay.id = 'papiModal';
    overlay.setAttribute('data-slug', slug);
    overlay.setAttribute('data-name', name);
    overlay.setAttribute('data-position', position || '');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

    if (!data) {
      overlay.innerHTML = `
        <div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(59,130,246,.4);border-radius:18px;padding:32px;text-align:center;color:#e2e8f0;box-shadow:0 30px 90px rgba(0,0,0,.65);">
          <div style="font-size:52px;margin-bottom:12px;">📭</div>
          <div style="font-size:16px;font-weight:900;color:#fff;margin-bottom:8px;">Belum Ada Data PAPI</div>
          <div style="font-size:13px;color:#94a3b8;line-height:1.65;margin-bottom:22px;">
            Kandidat <b style="color:#bfdbfe;">${escHtml(name)}</b> belum menyelesaikan tes PAPI atau datanya belum tersinkron.
          </div>
          <button id="papiCloseEmpty" style="width:100%;padding:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Tutup</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#papiCloseEmpty').onclick = () => overlay.remove();
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      return;
    }

    const scores = computePAPIScores(data);
    if (!scores) {
      overlay.innerHTML = `
        <div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(239,68,68,.4);border-radius:18px;padding:32px;text-align:center;color:#e2e8f0;">
          <div style="font-size:52px;margin-bottom:12px;">⚠️</div>
          <div style="font-size:16px;font-weight:900;color:#fff;margin-bottom:8px;">Gagal Hitung Hasil</div>
          <div style="font-size:13px;color:#94a3b8;line-height:1.65;margin-bottom:22px;">Data skor PAPI tidak tersedia atau tidak lengkap.</div>
          <button id="papiCloseErr" style="width:100%;padding:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Tutup</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#papiCloseErr').onclick = () => overlay.remove();
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      return;
    }

    const finalName = name || data.candidateName || 'Kandidat';
    const finalPos  = position || data.candidatePosition || '-';

    overlay.innerHTML = `
      <div style="width:min(960px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(59,130,246,.4);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;">

        <div style="padding:16px 20px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <div style="width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:11px;font-size:20px;">📊</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">HASIL TES PAPI KOSTICK · 20 DIMENSI</div>
            <div style="font-size:16px;font-weight:900;color:#fff;margin-top:2px;word-break:break-word;">${escHtml(finalName)}</div>
            <div style="font-size:11px;opacity:.85;margin-top:2px;">💼 ${escHtml(finalPos)}</div>
          </div>
          <button id="papiCloseBtn" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>
        </div>

        <div style="flex:1;overflow-y:auto;padding:16px 20px 20px;">
          ${renderModalBody(scores, finalPos)}
        </div>

        <div style="padding:12px 20px;background:rgba(0,0,0,.32);border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="color:#94a3b8;font-size:10.5px;font-weight:600;">ℹ️ Data dari Firebase (sgs_scores)</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="js-papi-pdf" style="padding:8px 16px;background:linear-gradient(135deg,#10b981,#059669);border:0;border-radius:9px;color:#fff;font-family:inherit;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,.35);">📄 Download PDF</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    overlay.querySelector('#papiCloseBtn').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  /* ============================================================
     PDF
     🆕 opts.contentOnly = true → skip Kop/Info/Footer
     ============================================================ */
  async function generatePAPIPDF(name, position, data, opts) {
    opts = opts || {};
    if (typeof window.loadPdfLibs === 'function') await window.loadPdfLibs();
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF tidak tersedia');

    const scores = computePAPIScores(data);
    if (!scores) throw new Error('Data PAPI tidak valid');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 15, CW = PW - 2 * M;
    let y = M;

    /* 🆕 Header */
    if (!opts.contentOnly) {
      /* Header (Kop penuh) */
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(59, 130, 246);
      doc.text('HASIL TES PAPI KOSTICK', PW / 2, y, { align: 'center' });
      y += 7;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139);
      doc.text('Sugar Group Schools', PW / 2, y, { align: 'center' });
      y += 5;
      doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 8;

      /* Info */
      const tanggal = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });
      [
        ['Nama', name || '-'],
        ['Posisi', position || '-'],
        ['Tanggal', tanggal]
      ].forEach(([k, v]) => {
        doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.setFontSize(10);
        doc.text(k + ' :', M, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(v), M + 30, y);
        y += 5.5;
      });
      y += 3;
    } else {
      /* Section Title mini (untuk unified report) */
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(59, 130, 246);
      doc.text('HASIL TES PAPI KOSTICK', M, y); y += 5;
      doc.setDrawColor(59, 130, 246); doc.setLineWidth(0.6);
      doc.line(M, y, M + 60, y); doc.setLineWidth(0.2); y += 6;
    }

       /* Per grup — 🆕 fix overlap: proper row height + label wrapping + spacing */
    PAPI_GROUPS.forEach(function(gr) {
      if (y > PH - 30) { doc.addPage(); y = M; }
      doc.setFillColor(59, 130, 246); doc.rect(M, y, CW, 7, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text(gr.name.toUpperCase(), M + 4, y + 5);
      y += 10;

      gr.codes.forEach(function(c) {
        const v = Number(scores[c] || 0);
        const label = PAPI_LABELS[c] || c;
        const interp = (typeof getInterpretasiPAPI === 'function') ? getInterpretasiPAPI(c, v) : '-';

        /* Wrap label & interp */
        const labelLines = doc.splitTextToSize(String(label), CW - 30);
        const interpLines = doc.splitTextToSize(String(interp), CW - 6);

        /* Row height */
        const labelH = Math.max(7, labelLines.length * 4.5 + 4);
        const interpH = interpLines.length * 3.8;
        const totalH = labelH + interpH + 4;

        if (y + totalH > PH - 20) { doc.addPage(); y = M; }

        /* Row header: kode | label (wrapped) | skor */
        doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.setFontSize(9);
        doc.text(c, M + 4, y + 4);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
        let labelY = y + 4;
        labelLines.forEach(function(line) { doc.text(line, M + 14, labelY); labelY += 4.5; });
        doc.setFont('helvetica', 'bold');
        doc.text(v + '/9', M + CW - 4, y + 4, { align: 'right' });
        y += labelH;

        /* Interpretation */
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(71, 85, 105);
        interpLines.forEach(function(line) {
          if (y + 4 > PH - 15) { doc.addPage(); y = M; }
          doc.text(line, M + 6, y);
          y += 3.8;
        });
        y += 4;
      });
      y += 3;
    });

    /* Position analysis */
    if (position && typeof analisisKecocokanPAPIDetail === 'function') {
      try {
        const analysis = analisisKecocokanPAPIDetail(scores, position, name || 'Kandidat');
        if (analysis && analysis !== '-' && !analysis.startsWith('Posisi')) {
          if (y > PH - 40) { doc.addPage(); y = M; }
          doc.setFillColor(139, 92, 246); doc.rect(M, y, CW, 7, 'F');
          doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
          doc.text('ANALISIS UNTUK POSISI: ' + position.toUpperCase(), M + 4, y + 5);
          y += 8;

          doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(30, 41, 59);
          String(analysis).split('\n').forEach(l => {
            const clean = l.replace(/\*\*(.+?)\*\*/g, '$1').trim();
            if (!clean) { y += 2; return; }
            const lines = doc.splitTextToSize(clean, CW - 4);
            lines.forEach(line => {
              if (y > PH - 15) { doc.addPage(); y = M; }
              doc.text(line, M + 4, y);
              y += 4;
            });
          });
        }
      } catch (e) { /* silent */ }
    }

    /* 🆕 Footer */
    if (!opts.contentOnly) {
      if (y > PH - 15) { doc.addPage(); y = M; }
      y += 6;
      doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 5;
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
      doc.text('Dibuat: ' + new Date().toLocaleString('id-ID'), M, y);
      doc.text('Halaman ' + doc.internal.getNumberOfPages(), PW - M, y, { align: 'right' });
    }

    return doc;
  }

  async function downloadPAPIPDF(slug, name, position) {
    const data = await fetchPAPIData(slug);
    if (!data) throw new Error('Data PAPI tidak tersedia');
    const doc = await generatePAPIPDF(name, position, data);
    const safeName = String(name || 'Kandidat').replace(/[^a-zA-Z0-9]/g, '-');
    doc.save('Hasil-PAPI-' + safeName + '.pdf');
  }

  if (!window.__papiDelegationAttached) {
    window.__papiDelegationAttached = true;
    document.addEventListener('click', async function (e) {
      const openBtn = e.target.closest('.js-papi-open');
      if (openBtn) {
        e.preventDefault(); e.stopPropagation();
        if (openBtn.disabled) return;
        const slug     = openBtn.getAttribute('data-slug');
        const name     = openBtn.getAttribute('data-name');
        const position = openBtn.getAttribute('data-position');
        if (slug) openPAPIModal(slug, name, position);
        return;
      }

      const pdfBtn = e.target.closest('.js-papi-pdf');
      if (pdfBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = pdfBtn.closest('#papiModal');
        const slug     = modal ? modal.getAttribute('data-slug')     : pdfBtn.getAttribute('data-slug');
        const name     = modal ? modal.getAttribute('data-name')     : pdfBtn.getAttribute('data-name');
        const position = modal ? modal.getAttribute('data-position') : pdfBtn.getAttribute('data-position');
        if (!slug) return;
        const prev = pdfBtn.innerHTML;
        pdfBtn.innerHTML = '⏳ PDF...'; pdfBtn.disabled = true;
        try {
          await downloadPAPIPDF(slug, name, position);
          pdfBtn.innerHTML = '✓ Terunduh';
          setTimeout(() => { pdfBtn.innerHTML = prev; pdfBtn.disabled = false; }, 1800);
        } catch (err) {
          alert('Gagal PDF: ' + err.message);
          pdfBtn.innerHTML = prev; pdfBtn.disabled = false;
        }
        return;
      }
    }, true);
  }

  window.openPAPIModal          = openPAPIModal;
  window.downloadPAPIPDF        = downloadPAPIPDF;
  window.generatePAPIPDF        = generatePAPIPDF;  /* 🆕 unified */
  window.renderPAPISectionHTML  = renderPAPISectionHTML;
  window.__fetchPAPIData        = fetchPAPIData;

  console.log('[PAPI-ADMIN] ✓ Loaded v1.1 — section + modal + PDF + contentOnly');
})();