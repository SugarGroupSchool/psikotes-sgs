/* ============================================================
   js/00z-admin-bigfive-result.js — v1.1 (Admin Web View BigFive)
   ------------------------------------------------------------
   - Baca data dari sgs_scores/{slug} (auto-push dari kandidat)
   - renderBIGFIVESectionHTML() → card di area "Hasil Tes"
   - openBIGFIVEModal()        → modal 5 OCEAN + analisis posisi
   - generateBIGFIVEPDF()      → PDF ringkas on-demand
   - Reuse global: koreksiBigFive, bigFivePositionAnalysis,
                   analisaBigFiveSuitability, getBigFiveSuitabilityLabel
   🆕 v1.1 [2026-10-26]: opts.contentOnly untuk unified report
   ============================================================ */

(function () {
  'use strict';

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

  const DIM_LABELS = {
    O: 'Openness',
    C: 'Conscientiousness',
    E: 'Extraversion',
    A: 'Agreeableness',
    N: 'Neuroticism'
  };
  const DIM_ORDER = ['O', 'C', 'E', 'A', 'N'];

  function levelLabel(percent, dim) {
    const v = Number(percent) || 0;
    if (dim === 'N') {
      if (v < 40) return { label: 'Rendah',  tone: 'good' };
      if (v < 70) return { label: 'Sedang',  tone: 'mid' };
      return { label: 'Tinggi', tone: 'bad' };
    }
    if (v < 40) return { label: 'Rendah',  tone: 'bad' };
    if (v < 70) return { label: 'Sedang',  tone: 'mid' };
    return { label: 'Tinggi', tone: 'good' };
  }
  function toneColor(tone) {
    if (tone === 'good') return { bg:'rgba(34,197,94,.18)',  br:'rgba(34,197,94,.55)',  tx:'#86efac', grad:'linear-gradient(90deg,#16a34a,#22c55e)' };
    if (tone === 'mid')  return { bg:'rgba(245,158,11,.18)', br:'rgba(245,158,11,.55)', tx:'#fcd34d', grad:'linear-gradient(90deg,#f59e0b,#fbbf24)' };
    return                      { bg:'rgba(239,68,68,.18)',  br:'rgba(239,68,68,.55)',  tx:'#fca5a5', grad:'linear-gradient(90deg,#dc2626,#ef4444)' };
  }
  function barGradient(percent, dim) {
    const lv = levelLabel(percent, dim);
    return toneColor(lv.tone).grad;
  }

  async function fetchBIGFIVEData(slug) {
    if (!fbReady()) return null;
    const dashed = slugifyDashed(slug);
    const candidates = [slug, dashed].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const s of candidates) {
      try {
        const snap = await firebase.database().ref('sgs_scores/' + s).once('value');
        const d = snap.val();
        if (!d) continue;

        const hasAnswers = Array.isArray(d.BIGFIVE_answers) && d.BIGFIVE_answers.length > 0;
        const hasResult  = d.BIGFIVE_result && typeof d.BIGFIVE_result === 'object';

        if (hasAnswers || hasResult) {
          return {
            answers:           hasAnswers ? d.BIGFIVE_answers : [],
            result:            hasResult ? d.BIGFIVE_result : {},
            completed:         d.BIGFIVE_completed === true,
            candidateName:     d.candidateName || '',
            candidatePosition: d.candidatePosition || '',
            _slug:             s
          };
        }
      } catch (e) { /* silent */ }
    }
    return null;
  }

  function computeBIGFIVEResult(data) {
    if (!data) return null;

    if (Array.isArray(data.answers) && data.answers.length > 0
        && typeof koreksiBigFive === 'function'
        && typeof BIGFIVE_DATA !== 'undefined' && BIGFIVE_DATA?.questions) {
      try {
        return koreksiBigFive(data.answers, BIGFIVE_DATA.questions);
      } catch (e) { /* fallback ke result */ }
    }

    if (data.result && Object.keys(data.result).length > 0) {
      const fake = {};
      DIM_ORDER.forEach(dim => {
        const p = Number(data.result[dim]);
        if (Number.isFinite(p)) {
          fake[dim] = { name: DIM_LABELS[dim], percent: p, desc: null };
        }
      });
      return Object.keys(fake).length ? fake : null;
    }
    return null;
  }

  function renderBIGFIVESectionHTML(data, slug, name, position) {
    if (!data) return '';

    const result = computeBIGFIVEResult(data);
    if (!result) {
      return `
        <div style="margin-bottom: 12px; padding: 14px 16px; background: rgba(239,68,68,.06); border: 1px dashed rgba(239,68,68,.3); border-radius: 11px;">
          <div style="font-size: 11.5px; color: #fca5a5; font-weight: 800;">⚠️ Data Big Five ada tapi gagal dihitung</div>
        </div>`;
    }

    const safeSlug     = escHtml(slug || data._slug || '');
    const safeName     = escHtml(name || data.candidateName || '');
    const safePosition = escHtml(position || data.candidatePosition || '');

    const chipsHTML = DIM_ORDER.map(dim => {
      const r = result[dim];
      if (!r || typeof r.percent !== 'number') return '';
      const lv = levelLabel(r.percent, dim);
      const col = toneColor(lv.tone);
      return `
        <div style="padding: 8px 10px; background: rgba(0,0,0,.28); border-radius: 9px; border: 1px solid rgba(255,255,255,.06);">
          <div style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #64748b;">${dim}</div>
          <div style="font-size: 14px; font-weight: 900; color: ${col.tx}; margin-top: 3px; font-variant-numeric: tabular-nums;">${r.percent}%</div>
          <div style="font-size: 9.5px; font-weight: 800; color: ${col.tx}; margin-top: 2px;">${lv.label}</div>
        </div>`;
    }).join('');

    return `
      <div style="margin-bottom: 12px; padding: 14px 16px; background: linear-gradient(135deg, rgba(139,92,246,.12), rgba(192,38,211,.08)); border: 1.5px solid rgba(139,92,246,.4); border-radius: 12px; box-shadow: 0 0 0 1px rgba(139,92,246,.1), 0 0 20px rgba(139,92,246,.12);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap;">
          <div style="width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; background: linear-gradient(135deg, #8b5cf6, #c026d3); border-radius: 10px; font-size: 20px; box-shadow: 0 4px 12px rgba(139,92,246,.35);">📝</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 12.5px; font-weight: 900; color: #ddd6fe; letter-spacing: .3px;">Hasil Tes Big Five</div>
            <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">
              5 dimensi OCEAN · Model Lima Faktor
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 6px; margin-bottom: 10px;">
          ${chipsHTML}
        </div>

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="js-bigfive-open"
            data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePosition}"
            style="flex: 1; min-width: 130px; padding: 9px 14px; background: linear-gradient(135deg, #8b5cf6, #c026d3); border: 0; border-radius: 9px; color: #fff; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(139,92,246,.35);">
            👁 Lihat Detail (OCEAN)
          </button>
          <button class="js-bigfive-pdf"
            data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePosition}"
            style="padding: 9px 16px; background: rgba(16,185,129,.18); border: 1px solid rgba(16,185,129,.5); border-radius: 9px; color: #6ee7b7; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
            📄 PDF
          </button>
        </div>
      </div>`;
  }

  function renderModalBody(result, position) {
    const dimBlocksHTML = DIM_ORDER.map(dim => {
      const r = result[dim];
      if (!r) return '';
      const pct = Number(r.percent) || 0;
      const lv = levelLabel(pct, dim);
      const col = toneColor(lv.tone);
      const desc = r.desc || 'Deskripsi tidak tersedia.';

      return `
        <div style="padding: 14px; background: rgba(0,0,0,.22); border-radius: 11px; border: 1px solid rgba(255,255,255,.08); margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap;">
            <span style="width: 34px; font-family: 'Courier New', monospace; font-size: 16px; font-weight: 900; color: ${col.tx}; text-align: center;">${dim}</span>
            <span style="flex: 1; min-width: 100px; font-size: 12px; font-weight: 800; color: #e2e8f0;">${escHtml(DIM_LABELS[dim])}</span>
            <span style="padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 900; font-variant-numeric: tabular-nums; background: ${col.bg}; border: 1px solid ${col.br}; color: ${col.tx};">${pct}% · ${lv.label}</span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,.07); border-radius: 999px; overflow: hidden; margin-bottom: 8px;">
            <div style="width: ${pct}%; height: 100%; background: ${barGradient(pct, dim)}; border-radius: inherit;"></div>
          </div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.6;">${escHtml(desc)}</div>
        </div>`;
    }).join('');

    let posAnalysisHTML = '';
    if (position && typeof bigFivePositionAnalysis !== 'undefined' && bigFivePositionAnalysis[position]) {
      const arr = bigFivePositionAnalysis[position];
      if (Array.isArray(arr) && arr.length) {
        posAnalysisHTML += `
          <div style="margin-top: 14px; padding: 14px 16px; background: linear-gradient(135deg, rgba(139,92,246,.12), rgba(192,38,211,.08)); border: 1px solid rgba(139,92,246,.4); border-radius: 11px;">
            <div style="font-size: 11px; font-weight: 900; letter-spacing: 1px; color: #ddd6fe; margin-bottom: 10px;">🎯 ANALISIS KEPRIBADIAN UNTUK POSISI: ${escHtml(position)}</div>
            ${arr.map(p => `<div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.75; margin-bottom: 8px;">${escHtml(p)}</div>`).join('')}
          </div>`;
      }
    }

    let suitabilityHTML = '';
    if (position && typeof analisaBigFiveSuitability === 'function') {
      try {
        const lines = analisaBigFiveSuitability(result, position);
        if (Array.isArray(lines) && lines.length) {
          suitabilityHTML = `
            <div style="margin-top: 12px; padding: 14px 16px; background: rgba(0,0,0,.22); border: 1px solid rgba(255,255,255,.08); border-radius: 11px;">
              <div style="font-size: 11px; font-weight: 900; letter-spacing: 1px; color: #c4b5fd; margin-bottom: 10px;">📊 TABEL KECOCOKAN PER DIMENSI</div>
              ${lines.map(l => {
                const clean = String(l)
                  .replace(/\*\*(.+?)\*\*/g, '<b style="color:#a5b4fc;">$1</b>')
                  .replace(/\n/g, '<br>');
                return `<div style="font-size: 11px; color: #cbd5e1; line-height: 1.7; margin-bottom: 8px; padding: 8px 10px; background: rgba(0,0,0,.2); border-radius: 7px;">${clean}</div>`;
              }).join('')}
            </div>`;
        }
      } catch (e) { /* silent */ }
    }

    return dimBlocksHTML + posAnalysisHTML + suitabilityHTML;
  }

  async function openBIGFIVEModal(slug, name, position) {
    const old = document.getElementById('bigfiveAdminModal'); if (old) old.remove();
    const data = await fetchBIGFIVEData(slug);

    const overlay = document.createElement('div');
    overlay.id = 'bigfiveAdminModal';
    overlay.setAttribute('data-slug', slug);
    overlay.setAttribute('data-name', name);
    overlay.setAttribute('data-position', position || '');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

    if (!data) {
      overlay.innerHTML = `
        <div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(139,92,246,.4);border-radius:18px;padding:32px;text-align:center;color:#e2e8f0;box-shadow:0 30px 90px rgba(0,0,0,.65);">
          <div style="font-size:52px;margin-bottom:12px;">📭</div>
          <div style="font-size:16px;font-weight:900;color:#fff;margin-bottom:8px;">Belum Ada Data Big Five</div>
          <div style="font-size:13px;color:#94a3b8;line-height:1.65;margin-bottom:22px;">
            Kandidat <b style="color:#ddd6fe;">${escHtml(name)}</b> belum menyelesaikan tes Big Five atau datanya belum tersinkron.
          </div>
          <button id="bigfiveCloseEmpty" style="width:100%;padding:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Tutup</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#bigfiveCloseEmpty').onclick = () => overlay.remove();
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      return;
    }

    const result = computeBIGFIVEResult(data);
    if (!result) {
      overlay.innerHTML = `
        <div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(239,68,68,.4);border-radius:18px;padding:32px;text-align:center;color:#e2e8f0;">
          <div style="font-size:52px;margin-bottom:12px;">⚠️</div>
          <div style="font-size:16px;font-weight:900;color:#fff;margin-bottom:8px;">Gagal Hitung Hasil</div>
          <div style="font-size:13px;color:#94a3b8;line-height:1.65;margin-bottom:22px;">Data skor Big Five tidak tersedia atau tidak lengkap.</div>
          <button id="bigfiveCloseErr" style="width:100%;padding:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Tutup</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#bigfiveCloseErr').onclick = () => overlay.remove();
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      return;
    }

    const finalName = name || data.candidateName || 'Kandidat';
    const finalPos  = position || data.candidatePosition || '-';

    overlay.innerHTML = `
      <div style="width:min(960px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(139,92,246,.4);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;">

        <div style="padding:16px 20px;background:linear-gradient(135deg,#8b5cf6,#c026d3);display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <div style="width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:11px;font-size:20px;">📝</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">HASIL TES BIG FIVE · 5 DIMENSI</div>
            <div style="font-size:16px;font-weight:900;color:#fff;margin-top:2px;word-break:break-word;">${escHtml(finalName)}</div>
            <div style="font-size:11px;opacity:.85;margin-top:2px;">💼 ${escHtml(finalPos)}</div>
          </div>
          <button id="bigfiveCloseBtn" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>
        </div>

        <div style="flex:1;overflow-y:auto;padding:16px 20px 20px;">
          ${renderModalBody(result, finalPos)}
        </div>

        <div style="padding:12px 20px;background:rgba(0,0,0,.32);border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="color:#94a3b8;font-size:10.5px;font-weight:600;">ℹ️ Data dari Firebase (sgs_scores)</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="js-bigfive-pdf" style="padding:8px 16px;background:linear-gradient(135deg,#10b981,#059669);border:0;border-radius:9px;color:#fff;font-family:inherit;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,.35);">📄 Download PDF</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    overlay.querySelector('#bigfiveCloseBtn').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  /* ============================================================
     PDF
     🆕 opts.contentOnly = true → skip Kop/Info/Footer
     ============================================================ */
  async function generateBIGFIVEPDF(name, position, data, opts) {
    opts = opts || {};
    if (typeof window.loadPdfLibs === 'function') await window.loadPdfLibs();
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF tidak tersedia');

    const result = computeBIGFIVEResult(data);
    if (!result) throw new Error('Data Big Five tidak valid');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 15, CW = PW - 2 * M;
    let y = M;

    /* 🆕 Header */
    if (!opts.contentOnly) {
      /* Header (Kop penuh) */
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(139, 92, 246);
      doc.text('HASIL TES BIG FIVE', PW / 2, y, { align: 'center' });
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
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(139, 92, 246);
      doc.text('HASIL TES BIG FIVE', M, y); y += 5;
      doc.setDrawColor(139, 92, 246); doc.setLineWidth(0.6);
      doc.line(M, y, M + 60, y); doc.setLineWidth(0.2); y += 6;
    }

    /* Summary box */
    doc.setFillColor(237, 233, 254); doc.setDrawColor(139, 92, 246);
    doc.rect(M, y, CW, 8, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(91, 33, 182);
    doc.text('PROFIL OCEAN', M + 4, y + 5.5);
    y += 12;

    /* Per dimensi */
    DIM_ORDER.forEach(dim => {
      const r = result[dim];
      if (!r) return;
      if (y > PH - 40) { doc.addPage(); y = M; }

      const pct = Number(r.percent) || 0;
      const lv = levelLabel(pct, dim);

      doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.setFontSize(10);
      doc.text(dim + ' — ' + (DIM_LABELS[dim] || dim), M, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(pct + '%  ·  ' + lv.label, M + CW - 4, y, { align: 'right' });
      y += 5;

      doc.setFillColor(230, 230, 230);
      doc.rect(M, y, CW, 3, 'F');
      const fillW = Math.max(1, (pct / 100) * CW);
      const fillCol = lv.tone === 'good' ? [34, 197, 94] : lv.tone === 'mid' ? [245, 158, 11] : [239, 68, 68];
      doc.setFillColor(fillCol[0], fillCol[1], fillCol[2]);
      doc.rect(M, y, fillW, 3, 'F');
      y += 6;

      const desc = r.desc || 'Deskripsi tidak tersedia.';
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(71, 85, 105);
      doc.splitTextToSize(desc, CW).forEach(l => {
        if (y > PH - 15) { doc.addPage(); y = M; }
        doc.text(l, M, y);
        y += 3.8;
      });
      y += 5;
    });

    /* Analisis posisi */
    if (position && typeof bigFivePositionAnalysis !== 'undefined' && bigFivePositionAnalysis[position]) {
      const arr = bigFivePositionAnalysis[position];
      if (Array.isArray(arr) && arr.length) {
        if (y > PH - 40) { doc.addPage(); y = M; }
        doc.setFillColor(139, 92, 246); doc.rect(M, y, CW, 7, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text('ANALISIS UNTUK POSISI: ' + position.toUpperCase(), M + 4, y + 5);
        y += 9;

        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
        arr.forEach(p => {
          doc.splitTextToSize(String(p), CW).forEach(l => {
            if (y > PH - 15) { doc.addPage(); y = M; }
            doc.text(l, M, y);
            y += 4;
          });
          y += 3;
        });
      }
    }

    /* Kecocokan */
    if (position && typeof analisaBigFiveSuitability === 'function') {
      try {
        const lines = analisaBigFiveSuitability(result, position);
        if (Array.isArray(lines) && lines.length) {
          if (y > PH - 40) { doc.addPage(); y = M; }
          doc.setFillColor(139, 92, 246); doc.rect(M, y, CW, 7, 'F');
          doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
          doc.text('TABEL KECOCOKAN PER DIMENSI', M + 4, y + 5);
          y += 9;

          doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(30, 41, 59);
          lines.forEach(line => {
            const clean = String(line).replace(/\*\*(.+?)\*\*/g, '$1');
            clean.split('\n').forEach(part => {
              if (!part.trim()) return;
              doc.splitTextToSize(part, CW - 4).forEach(l => {
                if (y > PH - 15) { doc.addPage(); y = M; }
                doc.text(l, M + 4, y);
                y += 3.8;
              });
            });
            y += 3;
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

  async function downloadBIGFIVEPDF(slug, name, position) {
    const data = await fetchBIGFIVEData(slug);
    if (!data) throw new Error('Data Big Five tidak tersedia');
    const doc = await generateBIGFIVEPDF(name, position, data);
    const safeName = String(name || 'Kandidat').replace(/[^a-zA-Z0-9]/g, '-');
    doc.save('Hasil-BigFive-' + safeName + '.pdf');
  }

  if (!window.__bigfiveDelegationAttached) {
    window.__bigfiveDelegationAttached = true;
    document.addEventListener('click', async function (e) {
      const openBtn = e.target.closest('.js-bigfive-open');
      if (openBtn) {
        e.preventDefault(); e.stopPropagation();
        if (openBtn.disabled) return;
        const slug     = openBtn.getAttribute('data-slug');
        const name     = openBtn.getAttribute('data-name');
        const position = openBtn.getAttribute('data-position');
        if (slug) openBIGFIVEModal(slug, name, position);
        return;
      }

      const pdfBtn = e.target.closest('.js-bigfive-pdf');
      if (pdfBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = pdfBtn.closest('#bigfiveAdminModal');
        const slug     = modal ? modal.getAttribute('data-slug')     : pdfBtn.getAttribute('data-slug');
        const name     = modal ? modal.getAttribute('data-name')     : pdfBtn.getAttribute('data-name');
        const position = modal ? modal.getAttribute('data-position') : pdfBtn.getAttribute('data-position');
        if (!slug) return;
        const prev = pdfBtn.innerHTML;
        pdfBtn.innerHTML = '⏳ PDF...'; pdfBtn.disabled = true;
        try {
          await downloadBIGFIVEPDF(slug, name, position);
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

  window.openBIGFIVEModal          = openBIGFIVEModal;
  window.downloadBIGFIVEPDF        = downloadBIGFIVEPDF;
  window.generateBIGFIVEPDF        = generateBIGFIVEPDF;  /* 🆕 unified */
  window.renderBIGFIVESectionHTML  = renderBIGFIVESectionHTML;
  window.__fetchBIGFIVEData        = fetchBIGFIVEData;

  console.log('[BIGFIVE-ADMIN] ✓ Loaded v1.1 — section + modal + PDF + contentOnly');
})();