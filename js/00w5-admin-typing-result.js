/* ============================================================
   js/00w5-admin-typing-result.js — Typing Test Admin v1.1
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

  function __getTier(wpm, accuracy) {
    const w = Number(wpm) || 0;
    const a = parseFloat(accuracy) || 0;
    if (w >= 50 && a >= 97) return { label: 'SANGAT BAIK', color: '#5eead4', bg: 'rgba(13,148,136,.18)', br: 'rgba(13,148,136,.55)', pdf: [15,118,110] };
    if (w >= 40 && a >= 95) return { label: 'BAIK',        color: '#86efac', bg: 'rgba(34,197,94,.15)',  br: 'rgba(34,197,94,.45)',  pdf: [22,101,52] };
    if (w >= 25 && a >= 90) return { label: 'CUKUP',       color: '#fcd34d', bg: 'rgba(245,158,11,.15)', br: 'rgba(245,158,11,.45)', pdf: [161,98,7] };
    if (w >= 15 && a >= 80) return { label: 'KURANG',      color: '#fdba74', bg: 'rgba(249,115,22,.15)', br: 'rgba(249,115,22,.45)', pdf: [194,65,12] };
    return                        { label: 'SANGAT KURANG',color: '#fca5a5', bg: 'rgba(239,68,68,.15)',  br: 'rgba(239,68,68,.45)',  pdf: [185,28,28] };
  }

  async function fetchTYPINGData(slug) {
    if (!fbReady()) return null;
    const dashed = slugifyDashed(slug);
    const candidates = [slug, dashed].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const s of candidates) {
      try {
        const snap = await firebase.database().ref('sgs_scores/' + s).once('value');
        const d = snap.val();
        if (d && d.TYPING && typeof d.TYPING === 'object' && typeof d.TYPING.wpm === 'number') {
          return {
            TYPING: d.TYPING,
            TYPING_completed: d.TYPING_completed === true,
            candidateName:     d.candidateName || '',
            candidatePosition: d.candidatePosition || '',
            _slug: s
          };
        }
      } catch (e) {}
    }
    return null;
  }

  function renderTYPINGSectionHTML(data, slug, name, position) {
    if (!data || !data.TYPING) return '';
    const t = data.TYPING;
    const tier = __getTier(t.wpm, t.accuracy);
    const safeSlug = escHtml(slug);
    const safeName = escHtml(name || data.candidateName || '');
    const safePos  = escHtml(position || data.candidatePosition || '');

    return `
      <div style="margin-bottom: 12px; padding: 14px 16px; background: linear-gradient(135deg, rgba(99,102,241,.12), rgba(139,92,246,.08)); border: 1.5px solid rgba(99,102,241,.4); border-radius: 12px; box-shadow: 0 0 0 1px rgba(99,102,241,.1), 0 0 20px rgba(99,102,241,.12);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap;">
          <div style="width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 10px; font-size: 20px; box-shadow: 0 4px 12px rgba(99,102,241,.35);">⌨️</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 12.5px; font-weight: 900; color: #c7d2fe; letter-spacing: .3px;">Hasil Tes Mengetik</div>
            <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">
              ${t.waktu || 0}s · ${t.total || 0} kata target
            </div>
          </div>
          <div style="padding: 4px 12px; border-radius: 999px; font-size: 10.5px; font-weight: 900; background: ${tier.bg}; border: 1px solid ${tier.br}; color: ${tier.color}; white-space: nowrap;">${tier.label}</div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 6px; margin-bottom: 10px;">
          <div style="padding: 8px 10px; background: rgba(0,0,0,.28); border-radius: 9px; border: 1px solid rgba(255,255,255,.06);">
            <div style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #64748b;">WPM</div>
            <div style="font-size: 16px; font-weight: 900; color: #93c5fd; margin-top: 3px; font-variant-numeric: tabular-nums;">${t.wpm || 0}</div>
            <div style="font-size: 9.5px; color: #94a3b8; margin-top: 2px;">kata/menit</div>
          </div>
          <div style="padding: 8px 10px; background: rgba(0,0,0,.28); border-radius: 9px; border: 1px solid rgba(255,255,255,.06);">
            <div style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #64748b;">AKURASI</div>
            <div style="font-size: 16px; font-weight: 900; color: #86efac; margin-top: 3px; font-variant-numeric: tabular-nums;">${t.accuracy || '0'}%</div>
            <div style="font-size: 9.5px; color: #94a3b8; margin-top: 2px;">presisi</div>
          </div>
          <div style="padding: 8px 10px; background: rgba(0,0,0,.28); border-radius: 9px; border: 1px solid rgba(255,255,255,.06);">
            <div style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #64748b;">BENAR</div>
            <div style="font-size: 16px; font-weight: 900; color: #a3e635; margin-top: 3px; font-variant-numeric: tabular-nums;">${t.benar || 0}</div>
            <div style="font-size: 9.5px; color: #94a3b8; margin-top: 2px;">kata</div>
          </div>
          <div style="padding: 8px 10px; background: rgba(0,0,0,.28); border-radius: 9px; border: 1px solid rgba(255,255,255,.06);">
            <div style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #64748b;">SALAH</div>
            <div style="font-size: 16px; font-weight: 900; color: #fca5a5; margin-top: 3px; font-variant-numeric: tabular-nums;">${t.salah || 0}</div>
            <div style="font-size: 9.5px; color: #94a3b8; margin-top: 2px;">kata</div>
          </div>
        </div>

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="js-typing-open"
            data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePos}"
            style="flex: 1; min-width: 130px; padding: 9px 14px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: 0; border-radius: 9px; color: #fff; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(99,102,241,.35);">
            👁 Lihat Detail
          </button>
          <button class="js-typing-pdf"
            data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePos}"
            style="padding: 9px 16px; background: rgba(16,185,129,.18); border: 1px solid rgba(16,185,129,.5); border-radius: 9px; color: #6ee7b7; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
            📄 PDF
          </button>
        </div>
      </div>`;
  }

  async function openTYPINGModal(slug, name, position) {
    const old = document.getElementById('typingModal');
    if (old) old.remove();
    const data = await fetchTYPINGData(slug);
    const overlay = document.createElement('div');
    overlay.id = 'typingModal';
    overlay.setAttribute('data-slug', slug);
    overlay.setAttribute('data-name', name);
    overlay.setAttribute('data-position', position || '');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

    if (!data) {
      overlay.innerHTML = `
        <div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.4);border-radius:18px;padding:32px;text-align:center;color:#e2e8f0;box-shadow:0 30px 90px rgba(0,0,0,.65);">
          <div style="font-size:52px;margin-bottom:12px;">📭</div>
          <div style="font-size:16px;font-weight:900;color:#fff;margin-bottom:8px;">Belum Ada Data Mengetik</div>
          <div style="font-size:13px;color:#94a3b8;line-height:1.65;margin-bottom:22px;">Kandidat belum menyelesaikan tes Mengetik atau datanya belum tersinkron.</div>
          <button id="typingCloseEmpty" style="width:100%;padding:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Tutup</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#typingCloseEmpty').onclick = () => overlay.remove();
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      return;
    }

    const t = data.TYPING;
    const tier = __getTier(t.wpm, t.accuracy);
    const typedText = String(t.text || '').trim();
    const finalName = name || data.candidateName || 'Kandidat';
    const finalPos  = position || data.candidatePosition || '-';

    overlay.innerHTML = `
      <div style="width:min(880px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.4);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;">
        <div style="padding:16px 20px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <div style="width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:11px;font-size:20px;">⌨️</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">HASIL TES MENGETIK</div>
            <div style="font-size:16px;font-weight:900;color:#fff;margin-top:2px;word-break:break-word;">${escHtml(finalName)}</div>
            <div style="font-size:11px;opacity:.85;margin-top:2px;">💼 ${escHtml(finalPos)}</div>
          </div>
          <button id="typingCloseBtn" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>
        </div>

        <div style="flex:1;overflow-y:auto;padding:16px 20px 20px;">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:14px;">
            <div style="padding:14px;background:${tier.bg};border:1px solid ${tier.br};border-radius:11px;">
              <div style="font-size:9.5px;font-weight:900;letter-spacing:1px;color:#94a3b8;">WPM</div>
              <div style="font-size:26px;font-weight:900;color:${tier.color};margin-top:4px;font-variant-numeric:tabular-nums;line-height:1;">${t.wpm || 0}</div>
              <div style="font-size:10.5px;font-weight:800;color:${tier.color};margin-top:4px;">${tier.label}</div>
            </div>
            <div style="padding:14px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.08);border-radius:11px;">
              <div style="font-size:9.5px;font-weight:900;letter-spacing:1px;color:#64748b;">AKURASI</div>
              <div style="font-size:22px;font-weight:900;color:#86efac;margin-top:4px;font-variant-numeric:tabular-nums;line-height:1;">${t.accuracy || 0}%</div>
            </div>
            <div style="padding:14px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.08);border-radius:11px;">
              <div style="font-size:9.5px;font-weight:900;letter-spacing:1px;color:#64748b;">BENAR</div>
              <div style="font-size:22px;font-weight:900;color:#a3e635;margin-top:4px;font-variant-numeric:tabular-nums;line-height:1;">${t.benar || 0}</div>
            </div>
            <div style="padding:14px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.08);border-radius:11px;">
              <div style="font-size:9.5px;font-weight:900;letter-spacing:1px;color:#64748b;">SALAH</div>
              <div style="font-size:22px;font-weight:900;color:#fca5a5;margin-top:4px;font-variant-numeric:tabular-nums;line-height:1;">${t.salah || 0}</div>
            </div>
            <div style="padding:14px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.08);border-radius:11px;">
              <div style="font-size:9.5px;font-weight:900;letter-spacing:1px;color:#64748b;">BELUM</div>
              <div style="font-size:22px;font-weight:900;color:#cbd5e1;margin-top:4px;font-variant-numeric:tabular-nums;line-height:1;">${t.belum || 0}</div>
            </div>
            <div style="padding:14px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.08);border-radius:11px;">
              <div style="font-size:9.5px;font-weight:900;letter-spacing:1px;color:#64748b;">WAKTU</div>
              <div style="font-size:22px;font-weight:900;color:#93c5fd;margin-top:4px;font-variant-numeric:tabular-nums;line-height:1;">${t.waktu || 0}s</div>
            </div>
          </div>

          ${typedText ? `
            <div style="padding:14px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.08);border-radius:11px;">
              <div style="font-size:11px;font-weight:900;letter-spacing:1px;color:#a5b4fc;margin-bottom:8px;">📝 TEKS YANG DIKETIK</div>
              <div style="font-size:12px;color:#cbd5e1;line-height:1.7;white-space:pre-wrap;word-break:break-word;max-height:300px;overflow-y:auto;padding:10px;background:rgba(0,0,0,.25);border-radius:8px;">${escHtml(typedText)}</div>
            </div>` : '<div style="padding:14px;background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.25);border-radius:11px;text-align:center;font-size:12px;color:#94a3b8;">📝 Teks yang diketik tidak tersimpan</div>'}
        </div>

        <div style="padding:12px 20px;background:rgba(0,0,0,.32);border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="color:#94a3b8;font-size:10.5px;font-weight:600;">ℹ️ Data dari Firebase (sgs_scores)</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="js-typing-pdf" style="padding:8px 16px;background:linear-gradient(135deg,#10b981,#059669);border:0;border-radius:9px;color:#fff;font-family:inherit;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,.35);">📄 Download PDF</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    overlay.querySelector('#typingCloseBtn').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  /* ============================================================
     PDF
     🆕 opts.contentOnly = true → skip Kop/Info/Footer
     ============================================================ */
  async function generateTYPINGPDF(name, position, data, opts) {
    opts = opts || {};
    if (typeof window.loadPdfLibs === 'function') await window.loadPdfLibs();
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF tidak tersedia');

    const t = data.TYPING;
    const tier = __getTier(t.wpm, t.accuracy);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 15, CW = PW - 2 * M;
    let y = M;

    /* 🆕 Header */
    if (!opts.contentOnly) {
      /* Header (Kop penuh) */
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(99, 102, 241);
      doc.text('HASIL TES MENGETIK', PW / 2, y, { align: 'center' });
      y += 7;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139);
      doc.text('Sugar Group Schools', PW / 2, y, { align: 'center' });
      y += 5;
      doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 8;

      /* Info */
      const tanggal = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      [
        ['Nama', name || '-'],
        ['Posisi', position || '-'],
        ['Tanggal', tanggal],
        ['Durasi', (t.waktu || 0) + ' detik'],
        ['Status', t.status || 'Selesai']
      ].forEach(([k, v]) => {
        doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.setFontSize(10);
        doc.text(k + ' :', M, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(v), M + 35, y);
        y += 5.5;
      });
      y += 3;
    } else {
      /* Section Title mini (untuk unified report) */
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(99, 102, 241);
      doc.text('HASIL TES MENGETIK', M, y); y += 5;
      doc.setDrawColor(99, 102, 241); doc.setLineWidth(0.6);
      doc.line(M, y, M + 60, y); doc.setLineWidth(0.2); y += 6;
    }

    // Tier box
    doc.setFillColor(238, 242, 255); doc.setDrawColor(99, 102, 241);
    doc.rect(M, y, CW, 14, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.setTextColor(tier.pdf[0], tier.pdf[1], tier.pdf[2]);
    doc.text('KATEGORI: ' + tier.label, M + 4, y + 6);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text('WPM: ' + (t.wpm || 0) + '  ·  Akurasi: ' + (t.accuracy || 0) + '%', M + 4, y + 11);
    y += 20;

    // Stats table
    doc.setFillColor(59, 130, 246); doc.rect(M, y, CW, 7, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('METRIK', M + 4, y + 5);
    doc.text('NILAI', PW - M - 4, y + 5, { align: 'right' });
    y += 7;

    const stats = [
      ['WPM (Words Per Minute)', String(t.wpm || 0)],
      ['Akurasi', (t.accuracy || 0) + '%'],
      ['Kata Benar', String(t.benar || 0)],
      ['Kata Salah', String(t.salah || 0)],
      ['Belum Diketik', String(t.belum || 0)],
      ['Total Kata Target', String(t.total || 0)],
      ['Waktu Digunakan', (t.waktu || 0) + ' detik'],
      ['Waktu Sisa', (t.waktuSisa || 0) + ' detik']
    ];

    stats.forEach(([label, val], i) => {
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(M, y, CW, 6, 'F'); }
      doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.setFontSize(9);
      doc.text(label, M + 4, y + 4.2);
      doc.setFont('helvetica', 'normal');
      doc.text(val, PW - M - 4, y + 4.2, { align: 'right' });
      y += 6;
    });
    y += 6;

    // Typed text
    const typedText = String(t.text || '').trim();
    if (typedText) {
      if (y > PH - 60) { doc.addPage(); y = M; }
      doc.setFillColor(99, 102, 241); doc.rect(M, y, CW, 7, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text('TEKS YANG DIKETIK', M + 4, y + 5);
      y += 8;

      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(typedText, CW - 4);
      lines.forEach(line => {
        if (y > PH - 15) { doc.addPage(); y = M; }
        doc.text(line, M + 2, y);
        y += 4;
      });
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

  async function downloadTYPINGPDF(slug, name, position) {
    const data = await fetchTYPINGData(slug);
    if (!data) throw new Error('Data Mengetik tidak tersedia');
    const doc = await generateTYPINGPDF(name, position, data);
    const safeName = String(name || 'Kandidat').replace(/[^a-zA-Z0-9]/g, '-');
    doc.save('Hasil-Typing-' + safeName + '.pdf');
  }

  if (!window.__typingDelegationAttached) {
    window.__typingDelegationAttached = true;
    document.addEventListener('click', async function (e) {
      const openBtn = e.target.closest('.js-typing-open');
      if (openBtn) {
        e.preventDefault(); e.stopPropagation();
        if (openBtn.disabled) return;
        const slug = openBtn.getAttribute('data-slug');
        const name = openBtn.getAttribute('data-name');
        const position = openBtn.getAttribute('data-position');
        if (slug) openTYPINGModal(slug, name, position);
        return;
      }
      const pdfBtn = e.target.closest('.js-typing-pdf');
      if (pdfBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = pdfBtn.closest('#typingModal');
        const slug = modal ? modal.getAttribute('data-slug') : pdfBtn.getAttribute('data-slug');
        const name = modal ? modal.getAttribute('data-name') : pdfBtn.getAttribute('data-name');
        const position = modal ? modal.getAttribute('data-position') : pdfBtn.getAttribute('data-position');
        if (!slug) return;
        const prev = pdfBtn.innerHTML;
        pdfBtn.innerHTML = '⏳ PDF...'; pdfBtn.disabled = true;
        try {
          await downloadTYPINGPDF(slug, name, position);
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

  window.openTYPINGModal          = openTYPINGModal;
  window.downloadTYPINGPDF        = downloadTYPINGPDF;
  window.generateTYPINGPDF        = generateTYPINGPDF;  /* 🆕 unified */
  window.renderTYPINGSectionHTML  = renderTYPINGSectionHTML;
  window.__fetchTYPINGData        = fetchTYPINGData;

  console.log('[TYPING-ADMIN] ✓ Loaded v1.1 — section + modal + PDF + contentOnly');
})();