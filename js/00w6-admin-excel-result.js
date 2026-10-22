/* ============================================================
   js/00w6-admin-excel-result.js — Excel Test Admin Result
   ------------------------------------------------------------
   Baca dari sgs_excel_assessments/{slug}/assessments/ADMIN
   Tampilkan skor + rating + edit button
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
  function fmtSize(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }

  async function fetchEXCELData(slug) {
    if (!fbReady()) return null;
    const dashed = slugifyDashed(slug);
    const candidates = [slug, dashed].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const s of candidates) {
      try {
        const snap = await firebase.database().ref('sgs_excel_assessments/' + s).once('value');
        const d = snap.val();
        if (d && d.assessments && d.assessments.ADMIN) {
          return {
            assessment: d.assessments.ADMIN,
            candidateName: d.candidateName || '',
            candidatePosition: d.candidatePosition || '',
            _slug: s
          };
        }
      } catch (e) {}
    }
    return null;
  }

  function renderEXCELSectionHTML(data, slug, name, position, driveFile) {
    const hasAssessment = !!(data && data.assessment);
    const hasDrive = !!driveFile;
    if (!hasAssessment && !hasDrive) return '';

    const a = hasAssessment ? data.assessment : null;
    const fileName = (driveFile && driveFile.name) || 'File tidak tersedia';
    const fileSize = (driveFile && driveFile.size) || 0;
    const fileUrl = driveFile && driveFile.url
      ? String(driveFile.url).replace(/"/g, '%22').replace(/'/g, '%27')
      : '';

    const finalScore = a ? Number(a.finalScore) : null;
    const avgScore = a ? Number(a.averageScore) : null;
    const cat = finalScore !== null && typeof window.__excelGetRatingCategory === 'function'
      ? window.__excelGetRatingCategory(finalScore)
      : null;

    const safeSlug = escHtml(slug);
    const safeName = escHtml(name || (data && data.candidateName) || '');
    const safePos  = escHtml(position || (data && data.candidatePosition) || '');

    const assessedBadge = cat
      ? `<div style="padding: 4px 12px; border-radius: 999px; font-size: 10.5px; font-weight: 900; background: ${cat.bg}; border: 1px solid ${cat.border}; color: ${cat.color}; white-space: nowrap;">${cat.icon} ${cat.short}</div>`
      : `<div style="padding: 4px 12px; border-radius: 999px; font-size: 10.5px; font-weight: 900; background: rgba(245,158,11,.15); border: 1px solid rgba(245,158,11,.5); color: #fcd34d; white-space: nowrap;">⏳ Belum Dinilai</div>`;

    const scoreDisplay = a
      ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:6px;margin:10px 0;">
          <div style="padding:8px 10px;background:rgba(0,0,0,.28);border-radius:9px;border:1px solid rgba(255,255,255,.06);">
            <div style="font-size:9px;font-weight:900;letter-spacing:1px;color:#64748b;">NILAI AKHIR</div>
            <div style="font-size:18px;font-weight:900;color:${cat.color};margin-top:3px;font-variant-numeric:tabular-nums;">${finalScore.toFixed(2)}</div>
            <div style="font-size:9px;color:#94a3b8;margin-top:2px;">0–100</div>
          </div>
          <div style="padding:8px 10px;background:rgba(0,0,0,.28);border-radius:9px;border:1px solid rgba(255,255,255,.06);">
            <div style="font-size:9px;font-weight:900;letter-spacing:1px;color:#64748b;">RATA-RATA</div>
            <div style="font-size:16px;font-weight:900;color:#a5b4fc;margin-top:3px;font-variant-numeric:tabular-nums;">${avgScore.toFixed(2)}</div>
            <div style="font-size:9px;color:#94a3b8;margin-top:2px;">/ 5.00</div>
          </div>
          <div style="padding:8px 10px;background:rgba(0,0,0,.28);border-radius:9px;border:1px solid rgba(255,255,255,.06);">
            <div style="font-size:9px;font-weight:900;letter-spacing:1px;color:#64748b;">DINILAI</div>
            <div style="font-size:11px;font-weight:800;color:#cbd5e1;margin-top:3px;">${new Date(a.ts).toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
          </div>
        </div>`
      : `<div style="padding:12px;margin:10px 0;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.35);border-radius:9px;font-size:11.5px;color:#fcd34d;line-height:1.5;">⚠️ Kandidat sudah upload file Excel. Klik <b>Nilai Sekarang</b> untuk memberi skor.</div>`;

    return `
      <div style="margin-bottom: 12px; padding: 14px 16px; background: linear-gradient(135deg, rgba(34,197,94,.12), rgba(16,185,129,.08)); border: 1.5px solid rgba(34,197,94,.4); border-radius: 12px; box-shadow: 0 0 0 1px rgba(34,197,94,.1), 0 0 20px rgba(34,197,94,.12);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap;">
          <div style="width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 10px; font-size: 20px; box-shadow: 0 4px 12px rgba(34,197,94,.35);">📊</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 12.5px; font-weight: 900; color: #86efac; letter-spacing: .3px;">Hasil Tes Excel</div>
            <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">
              ${hasDrive ? '✅ File .xlsx terkirim · ' + escHtml(fmtSize(fileSize)) : '⚠️ File tidak ada'}
              ${a ? ' · Sudah dinilai' : ''}
            </div>
          </div>
          ${assessedBadge}
        </div>

        <div style="padding: 10px 12px; background: rgba(0,0,0,.28); border: 1px solid rgba(34,197,94,.25); border-radius: 9px; margin-bottom: 10px;">
          <div style="font-size: 9.5px; font-weight: 900; letter-spacing: 1px; color: #64748b; margin-bottom: 4px;">📄 FILE</div>
          <div style="font-size: 11.5px; font-weight: 800; color: #e2e8f0; word-break: break-all; line-height: 1.4;">${escHtml(fileName)}</div>
        </div>

        ${scoreDisplay}

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${fileUrl ? `
            <a href="${fileUrl}" target="_blank" rel="noopener"
              style="flex: 1; min-width: 110px; padding: 9px 14px; background: linear-gradient(135deg, #22c55e, #16a34a); border: 0; border-radius: 9px; color: #fff; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(34,197,94,.35); text-decoration: none;">
              ⬇ Buka File
            </a>
          ` : ''}
          <button class="js-excel-score"
            data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePos}"
            style="flex: 1; min-width: 130px; padding: 9px 14px; background: ${a ? 'rgba(99,102,241,.18)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)'}; border: ${a ? '1px solid rgba(99,102,241,.5)' : '0'}; border-radius: 9px; color: ${a ? '#a5b4fc' : '#fff'}; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; ${!a ? 'box-shadow: 0 4px 12px rgba(99,102,241,.35);' : ''}">
            ${a ? '✎ Edit Nilai' : '📝 Nilai Sekarang'}
          </button>
        </div>
      </div>`;
  }

  window.renderEXCELSectionHTML = renderEXCELSectionHTML;
  window.__fetchEXCELData       = fetchEXCELData;

  console.log('[EXCEL-ADMIN] ✓ Loaded — assessment model');
})();