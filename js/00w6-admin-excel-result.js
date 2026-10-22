/* ============================================================
   js/00w6-admin-excel-result.js — Excel Test Admin Result
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
        const snap = await firebase.database().ref('sgs_scores/' + s).once('value');
        const d = snap.val();
        if (d && d.EXCEL_completed === true) {
          return {
            EXCEL_completed: true,
            EXCEL_filename: d.EXCEL_filename || '',
            EXCEL_size: d.EXCEL_size || 0,
            EXCEL_uploadedAt: d.EXCEL_uploadedAt || null,
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
    // Fallback: kalau tidak ada metadata dari Firebase tapi ada file di Drive
    const hasMeta = !!data;
    const hasDrive = !!driveFile;
    if (!hasMeta && !hasDrive) return '';

    const filename = (data && data.EXCEL_filename) || (driveFile && driveFile.name) || 'Excel.xlsx';
    const sizeBytes = (data && data.EXCEL_size) || (driveFile && driveFile.size) || 0;
    const uploadedAt = (data && data.EXCEL_uploadedAt) || (driveFile && driveFile.date) || null;
    const uploadedStr = uploadedAt
      ? new Date(uploadedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '-';

    const fileUrl = driveFile && driveFile.url
      ? String(driveFile.url).replace(/"/g, '%22').replace(/'/g, '%27')
      : '';

    const safeSlug = escHtml(slug);
    const safeName = escHtml(name || (data && data.candidateName) || '');
    const safePos  = escHtml(position || (data && data.candidatePosition) || '');

    return `
      <div style="margin-bottom: 12px; padding: 14px 16px; background: linear-gradient(135deg, rgba(34,197,94,.12), rgba(16,185,129,.08)); border: 1.5px solid rgba(34,197,94,.4); border-radius: 12px; box-shadow: 0 0 0 1px rgba(34,197,94,.1), 0 0 20px rgba(34,197,94,.12);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap;">
          <div style="width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 10px; font-size: 20px; box-shadow: 0 4px 12px rgba(34,197,94,.35);">📊</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 12.5px; font-weight: 900; color: #86efac; letter-spacing: .3px;">Hasil Tes Excel</div>
            <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">
              ✅ File .xlsx terkirim · ${escHtml(fmtSize(sizeBytes))}
            </div>
          </div>
        </div>

        <div style="padding: 10px 12px; background: rgba(0,0,0,.28); border: 1px solid rgba(34,197,94,.25); border-radius: 9px; margin-bottom: 10px;">
          <div style="font-size: 9.5px; font-weight: 900; letter-spacing: 1px; color: #64748b; margin-bottom: 4px;">📄 FILE</div>
          <div style="font-size: 11.5px; font-weight: 800; color: #e2e8f0; word-break: break-all; line-height: 1.4;">
            ${escHtml(filename)}
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 3px;">
            🕐 ${escHtml(uploadedStr)}
          </div>
        </div>

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${fileUrl ? `
            <a href="${fileUrl}" target="_blank" rel="noopener"
              style="flex: 1; min-width: 130px; padding: 9px 14px; background: linear-gradient(135deg, #22c55e, #16a34a); border: 0; border-radius: 9px; color: #fff; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(34,197,94,.35); text-decoration: none;">
              ⬇ Buka File Excel
            </a>
          ` : `
            <div style="flex: 1; padding: 9px 14px; background: rgba(148,163,184,.15); border: 1px dashed rgba(148,163,184,.4); border-radius: 9px; color: #94a3b8; font-size: 11.5px; font-weight: 800; text-align: center;">
              ⚠️ File tidak ditemukan di Drive
            </div>
          `}
        </div>
      </div>`;
  }

  window.renderEXCELSectionHTML = renderEXCELSectionHTML;
  window.__fetchEXCELData       = fetchEXCELData;

  console.log('[EXCEL-ADMIN] ✓ Loaded — section');
})();