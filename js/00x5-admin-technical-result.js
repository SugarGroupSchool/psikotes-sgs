/* ============================================================
   js/00x5-admin-technical-result.js — Admin Viewer: Technical Test
   Mirror dari 00x3-admin-subject-result.js
   ============================================================ */
(function () {
  'use strict';

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fbReady() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
  }
  function slugifyDashed(name) {
    return String(name || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  }
  function cleanText(s) {
    return String(s || '').replace(/[^\x20-\x7E\n]/g, '').trim();
  }

  const RATING_MAP = {
    1: { label: 'Not Recommended', short: 'Not Rec', icon: '❌', color: '#fca5a5', bg: 'rgba(239,68,68,.15)', br: 'rgba(239,68,68,.45)' },
    2: { label: 'Fairly Recommended', short: 'Fairly', icon: '⚠️', color: '#fcd34d', bg: 'rgba(245,158,11,.15)', br: 'rgba(245,158,11,.45)' },
    3: { label: 'Recommended', short: 'Rec', icon: '✅', color: '#86efac', bg: 'rgba(34,197,94,.15)', br: 'rgba(34,197,94,.45)' },
    4: { label: 'Highly Recommended', short: 'Highly', icon: '🌟', color: '#5eead4', bg: 'rgba(13,148,136,.2)', br: 'rgba(13,148,136,.55)' }
  };

  async function fetchTechnicalData(slug) {
    if (!fbReady()) return null;
    const dashed = slugifyDashed(slug);
    const candidates = [slug, dashed].filter((v, i, a) => v && a.indexOf(v) === i);
        let assessments = null;
    for (const s of candidates) {
      try {
        if (!assessments) {
          const snap = await firebase.database().ref('sgs_technical_assessments/' + s).once('value');
          if (snap.exists()) assessments = snap.val();
        }
      } catch (e) {}
      if (assessments) break;
    }
    if (!assessments) return null;
    return { assessments: assessments || {} };
  }

  function getAssessorList(assessmentsObj) {
    const inner = (assessmentsObj && assessmentsObj.assessments) || {};
    return Object.keys(inner)
      .filter(k => inner[k] && typeof inner[k].rating === 'number')
      .map(k => Object.assign({ kode: k }, inner[k]))
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }
  function getCandidateImages(imagesObj) {
    const inner = (imagesObj && imagesObj.images) || {};
    return Object.keys(inner)
      .sort((a, b) => Number(a) - Number(b))
      .map(k => inner[k] && inner[k].dataUrl)
      .filter(Boolean);
  }

  function renderTechnicalSectionHTML(data, slug, name, position) {
    if (!data) return '';
       const assessors = getAssessorList(data.assessments);
    const images = [];
    assessors.forEach(a => {
      if (Array.isArray(a.photoUrls)) a.photoUrls.forEach(u => { if (!images.includes(u)) images.push(u); });
    });

    if (assessors.length === 0 && images.length === 0) {
      return `
        <div style="margin-bottom:12px;padding:14px 16px;background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(139,92,246,.05));border:1.5px dashed rgba(99,102,241,.3);border-radius:12px;text-align:center;">
          <div style="font-size:24px;margin-bottom:6px;">🔧</div>
          <div style="font-size:12px;font-weight:900;color:#a5b4fc;">Belum mengerjakan Kemampuan Teknis</div>
          <div style="font-size:10.5px;color:#94a3b8;margin-top:4px;">Kandidat belum mengumpulkan jawaban atau belum dinilai.</div>
        </div>`;
    }

    const avgRating = assessors.length
      ? (assessors.reduce((s, a) => s + a.rating, 0) / assessors.length)
      : 0;

    const chips = assessors.map(a => {
      const r = RATING_MAP[a.rating] || RATING_MAP[1];
      return '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-size:10px;font-weight:900;background:' + r.bg + ';border:1px solid ' + r.br + ';color:' + r.color + ';white-space:nowrap;">'
        + '<b style="font-family:\'Courier New\',monospace;">' + escHtml(a.kode) + '</b>'
        + '<span>' + r.icon + '</span>'
        + '<span style="font-variant-numeric:tabular-nums;">' + a.rating + '</span>'
        + '</span>';
    }).join('');

    const safeSlug = escHtml(slug);
    const safeName = escHtml(name);
    const safePos = escHtml(position || '');

    let actionButtons = '';
    if (assessors.length > 0) {
      actionButtons += '<button class="js-technical-open" data-slug="' + safeSlug + '" data-name="' + safeName + '" data-position="' + safePos + '"'
        + ' style="flex:1;min-width:130px;padding:9px 14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;border-radius:9px;color:#fff;font-family:inherit;font-size:11.5px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(99,102,241,.35);">'
        + '👁 Lihat Detail' + (assessors.length > 1 ? ' (' + assessors.length + ' Assessor)' : '')
        + '</button>';
      actionButtons += '<button class="js-technical-pdf" data-slug="' + safeSlug + '" data-name="' + safeName + '" data-position="' + safePos + '"'
        + ' style="padding:9px 16px;background:rgba(16,185,129,.18);border:1px solid rgba(16,185,129,.5);border-radius:9px;color:#6ee7b7;font-family:inherit;font-size:11.5px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">'
        + '📄 PDF</button>';
    } else if (images.length > 0) {
      actionButtons += '<button class="js-technical-images" data-slug="' + safeSlug + '" data-name="' + safeName + '"'
        + ' style="flex:1;min-width:130px;padding:9px 14px;background:linear-gradient(135deg,#3b82f6,#1e40af);border:0;border-radius:9px;color:#fff;font-family:inherit;font-size:11.5px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(59,130,246,.35);">'
        + '📷 Lihat Foto Jawaban (' + images.length + ')</button>';
    }

    return '<div style="margin-bottom:12px;padding:14px 16px;background:linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.08));border:1.5px solid rgba(99,102,241,.4);border-radius:12px;box-shadow:0 0 0 1px rgba(99,102,241,.1),0 0 20px rgba(99,102,241,.12);">'
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;flex-wrap:wrap;">'
      + '<div style="width:40px;height:40px;flex:0 0 40px;display:grid;place-items:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;font-size:20px;box-shadow:0 4px 12px rgba(99,102,241,.35);">🔧</div>'
      + '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:12.5px;font-weight:900;color:#c7d2fe;letter-spacing:.3px;">Hasil Tes Kemampuan Teknis</div>'
      + '<div style="font-size:10.5px;color:#94a3b8;margin-top:2px;">'
      + assessors.length + ' assessor submit'
      + (images.length > 0 ? ' · ' + images.length + ' foto jawaban' : '')
      + (assessors.length > 0 ? ' · Rata-rata: <b style="color:#c7d2fe;">' + avgRating.toFixed(2) + '</b>/4' : '')
      + '</div></div></div>'
      + (chips ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' + chips + '</div>' : '')
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + actionButtons + '</div>'
      + '</div>';
  }

  async function openTechnicalModal(slug, name, position) {
    const old = document.getElementById('technicalResultModal');
    if (old) old.remove();
    const data = await fetchTechnicalData(slug);

    const overlay = document.createElement('div');
    overlay.id = 'technicalResultModal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

       const assessors = data ? getAssessorList(data.assessments) : [];
    const images = [];
    if (data && data.assessments) {
      assessors.forEach(a => {
        if (Array.isArray(a.photoUrls)) a.photoUrls.forEach(u => { if (!images.includes(u)) images.push(u); });
      });
    }

    if (assessors.length === 0) {
      overlay.innerHTML = '<div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.4);border-radius:18px;padding:32px;text-align:center;color:#e2e8f0;box-shadow:0 30px 90px rgba(0,0,0,.65);">'
        + '<div style="font-size:52px;margin-bottom:12px;">📭</div>'
        + '<div style="font-size:16px;font-weight:900;color:#fff;margin-bottom:8px;">Belum Ada Penilaian</div>'
        + '<div style="font-size:13px;color:#94a3b8;line-height:1.65;margin-bottom:22px;">Assessor belum submit untuk <b style="color:#c7d2fe;">' + escHtml(name) + '</b>.</div>'
        + '<button id="techCloseEmpty" style="width:100%;padding:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Tutup</button></div>';
      document.body.appendChild(overlay);
      overlay.querySelector('#techCloseEmpty').onclick = () => overlay.remove();
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      return;
    }

    let currentTab = assessors[0].kode;

    function renderTabContent(tab) {
      if (tab === 'images') {
        if (images.length === 0) return '<div style="padding:24px;text-align:center;color:#94a3b8;">Kandidat belum upload foto jawaban.</div>';
        return '<div style="padding:18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;">'
          + images.map((url, i) =>
              '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;overflow:hidden;cursor:zoom-in;" onclick="window.open(\'' + url + '\',\'_blank\')">'
              + '<img src="' + url + '" style="width:100%;height:280px;object-fit:contain;background:#000;">'
              + '<div style="padding:10px;text-align:center;font-size:12px;font-weight:800;color:#93c5fd;">📄 Halaman ' + (i + 1) + '</div></div>'
            ).join('') + '</div>';
      }
      const a = assessors.find(x => x.kode === tab);
      if (!a) return '';
      const r = RATING_MAP[a.rating] || RATING_MAP[1];
      const ts = a.ts ? new Date(a.ts).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
      return '<div style="padding:20px;">'
        + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">'
        + '<div style="width:44px;height:44px;flex:0 0 44px;display:grid;place-items:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:11px;color:#fff;font-weight:900;font-size:13px;">' + escHtml(a.kode.slice(0,3).toUpperCase()) + '</div>'
        + '<div style="flex:1;min-width:0;"><div style="font-size:16px;font-weight:900;color:#fff;">' + escHtml(a.assessorName || a.kode) + '</div>'
        + '<div style="font-size:11.5px;color:#94a3b8;margin-top:2px;">📅 ' + ts + '</div></div>'
        + '<span style="padding:6px 14px;border-radius:999px;font-size:11px;font-weight:900;background:' + r.bg + ';border:1.5px solid ' + r.br + ';color:' + r.color + ';">' + a.rating + ' — ' + r.icon + ' ' + r.label + '</span>'
        + '</div>'
        + '<div style="padding:14px;background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.3);border-radius:12px;">'
        + '<div style="font-size:10.5px;font-weight:900;color:#c7d2fe;letter-spacing:1px;margin-bottom:8px;">📝 CATATAN</div>'
        + '<div style="font-size:13.5px;color:#e2e8f0;line-height:1.7;white-space:pre-wrap;word-break:break-word;">' + escHtml(a.notes || '-') + '</div></div>'
        + '</div>';
    }

    function renderTabsHTML() {
      const imgTab = '<button class="js-tech-tab" data-tab="images" style="padding:8px 14px;border:1px solid ' + (currentTab === 'images' ? 'rgba(59,130,246,.7)' : 'rgba(255,255,255,.12)') + ';border-radius:8px;background:' + (currentTab === 'images' ? 'rgba(59,130,246,.2)' : 'rgba(255,255,255,.04)') + ';color:' + (currentTab === 'images' ? '#93c5fd' : '#cbd5e1') + ';font-family:inherit;font-size:11.5px;font-weight:900;cursor:pointer;white-space:nowrap;">📷 Foto Jawaban (' + images.length + ')</button>';
      const assessorTabs = assessors.map(a => {
        const r = RATING_MAP[a.rating] || RATING_MAP[1];
        const active = currentTab === a.kode;
        return '<button class="js-tech-tab" data-tab="' + escHtml(a.kode) + '" style="padding:8px 14px;border:1px solid ' + (active ? 'rgba(99,102,241,.7)' : 'rgba(255,255,255,.12)') + ';border-radius:8px;background:' + (active ? 'rgba(99,102,241,.2)' : 'rgba(255,255,255,.04)') + ';color:' + (active ? '#c7d2fe' : '#cbd5e1') + ';font-family:inherit;font-size:11.5px;font-weight:900;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;">' + escHtml(a.kode) + '<span style="padding:1px 6px;border-radius:999px;font-size:9px;background:' + r.bg + ';border:1px solid ' + r.br + ';color:' + r.color + ';">' + a.rating + '</span></button>';
      }).join('');
      return imgTab + assessorTabs;
    }

    const avg = assessors.reduce((s, a) => s + a.rating, 0) / assessors.length;

    overlay.innerHTML = '<div style="width:min(960px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.4);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;">'
      + '<div style="padding:16px 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;gap:14px;flex-wrap:wrap;">'
      + '<div style="width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:11px;font-size:20px;">🔧</div>'
      + '<div style="flex:1;min-width:0;"><div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">HASIL TES KEMAMPUAN TEKNIS</div>'
      + '<div style="font-size:16px;font-weight:900;color:#fff;margin-top:2px;word-break:break-word;">' + escHtml(name) + '</div>'
      + '<div style="font-size:11px;opacity:.85;margin-top:2px;">💼 ' + escHtml(position || '-') + ' · Rata-rata: ' + avg.toFixed(2) + '/4</div></div>'
      + '<button id="techCloseBtn" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>'
      + '</div>'
      + '<div id="techTabBar" style="padding:12px 20px;background:rgba(0,0,0,.3);border-bottom:1px solid rgba(255,255,255,.06);display:flex;gap:6px;flex-wrap:wrap;overflow-x:auto;">' + renderTabsHTML() + '</div>'
      + '<div id="techTabContent" style="flex:1;overflow-y:auto;">' + renderTabContent(currentTab) + '</div>'
      + '</div>';

    document.body.appendChild(overlay);

    function bindTabs() {
      overlay.querySelectorAll('.js-tech-tab').forEach(btn => {
        btn.onclick = () => {
          const tab = btn.getAttribute('data-tab');
          if (tab === currentTab) return;
          currentTab = tab;
          overlay.querySelector('#techTabBar').innerHTML = renderTabsHTML();
          bindTabs();
          overlay.querySelector('#techTabContent').innerHTML = renderTabContent(tab);
        };
      });
    }
    bindTabs();
    overlay.querySelector('#techCloseBtn').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  window.__openTechnicalImagesModal = async function (slug, candidateName) {
    if (!fbReady()) { alert('Firebase belum siap'); return; }
    let data;
    try {
      const safeSlug = slugifyDashed(slug);
      const snap = await firebase.database().ref('sgs_technical_images/' + safeSlug).once('value');
      data = snap.val();
    } catch (e) { alert('Gagal ambil foto: ' + e.message); return; }
    if (!data || !data.images) { alert('Kandidat belum upload foto jawaban.'); return; }
    const images = Object.values(data.images).map(i => i.dataUrl).filter(Boolean);
    if (!images.length) { alert('Tidak ada foto.'); return; }

    const old = document.getElementById('techImagesModal');
    if (old) old.remove();

    const ov = document.createElement('div');
    ov.id = 'techImagesModal';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.94);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';
    ov.innerHTML = '<div style="width:min(920px,100%);max-height:calc(100vh - 40px);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.4);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;display:flex;flex-direction:column;">'
      + '<div style="padding:16px 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;gap:12px;">'
      + '<div style="width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.18);border-radius:11px;font-size:20px;">📷</div>'
      + '<div style="flex:1;"><div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">FOTO JAWABAN TEKNIS</div>'
      + '<div style="font-size:15px;font-weight:900;color:#fff;margin-top:2px;">' + escHtml(candidateName) + '</div></div>'
      + '<button id="techImgClose" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>'
      + '</div>'
      + '<div style="flex:1;overflow-y:auto;padding:18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;">'
      + images.map((url, i) =>
          '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;overflow:hidden;cursor:zoom-in;" onclick="window.open(\'' + url + '\',\'_blank\')">'
          + '<img src="' + url + '" style="width:100%;height:260px;object-fit:contain;background:#000;">'
          + '<div style="padding:10px;text-align:center;font-size:12px;font-weight:800;color:#c7d2fe;">📄 Halaman ' + (i + 1) + '</div></div>'
        ).join('')
      + '</div></div>';
    document.body.appendChild(ov);
    document.getElementById('techImgClose').onclick = () => ov.remove();
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
  };

  window.generateTechnicalPDF = async function (name, position, data, opts) {
    opts = opts || {};
    if (typeof window.loadPdfLibs === 'function') await window.loadPdfLibs();
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF tidak tersedia');
        const assessors = getAssessorList(data.assessments);
    const images = [];
    assessors.forEach(a => {
      if (Array.isArray(a.photoUrls)) a.photoUrls.forEach(u => { if (!images.includes(u)) images.push(u); });
    });
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 15, CW = PW - 2 * M;
    let y = M;

        if (!opts.contentOnly) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(79, 70, 229);
    doc.text('HASIL TES KEMAMPUAN TEKNIS', PW / 2, y, { align: 'center' }); y += 7;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139);
    doc.text('Sugar Group Schools', PW / 2, y, { align: 'center' }); y += 5;
    doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 8;

    const tanggal = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    [['Nama', cleanText(name) || '-'], ['Posisi', cleanText(position) || '-'], ['Tanggal', tanggal], ['Total Assessor', String(assessors.length)]].forEach(([k, v]) => {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.setFontSize(10);
      doc.text(k + ' :', M, y); doc.setFont('helvetica', 'normal'); doc.text(String(v), M + 35, y); y += 5.5;
    });
        y += 3;
    } else {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(79, 70, 229);
      doc.text('HASIL TES KEMAMPUAN TEKNIS', M, y); y += 5;
      doc.setDrawColor(79, 70, 229); doc.setLineWidth(0.6);
      doc.line(M, y, M + 60, y); doc.setLineWidth(0.2); y += 6;
    }

    if (assessors.length > 0) {
      const avg = assessors.reduce((s, a) => s + a.rating, 0) / assessors.length;
      doc.setFillColor(238, 242, 255); doc.setDrawColor(99, 102, 241);
      doc.rect(M, y, CW, 14, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(67, 56, 202);
      doc.text('RATA-RATA RATING: ' + avg.toFixed(2) + ' / 4.00', M + 4, y + 6);
      const rl = RATING_MAP[Math.round(avg)] ? RATING_MAP[Math.round(avg)].label : '-';
      doc.setFontSize(10); doc.text('Kategori: ' + rl, M + 4, y + 11);
      y += 20;
    }

        if (images.length > 0) {
      if (y > PH - 80) { doc.addPage(); y = M; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(30, 41, 59);
      doc.text('FOTO HASIL PRAKTEK KANDIDAT', M, y); y += 6;
      const imgW = (CW - 4) / 2, imgH = 90;
      let xPos = M, rowCount = 0;
      for (let i = 0; i < images.length; i++) {
        const url = images[i];
        const fileIdMatch = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/);
        const fileId = fileIdMatch ? fileIdMatch[1] : null;
        if (!fileId) continue;
        
        try {
          let blob;
          if (typeof window.__fetchViaGASProxy === 'function') {
            blob = await window.__fetchViaGASProxy(fileId);
          } else {
            const res = await fetch('https://drive.google.com/uc?export=download&id=' + fileId);
            blob = await res.blob();
          }
          const base64Img = await new Promise((res) => { const r = new FileReader(); r.onloadend = () => res(r.result); r.readAsDataURL(blob); });
          
          if (y + imgH > PH - 20) { doc.addPage(); y = M; rowCount = 0; xPos = M; }
          if (rowCount === 2) { y += imgH + 6; xPos = M; rowCount = 0; }
          
          doc.addImage(base64Img, 'JPEG', xPos, y, imgW, imgH, undefined, 'MEDIUM');
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
          doc.text('Halaman ' + (i + 1), xPos + imgW / 2, y + imgH + 4, { align: 'center' });
          
          xPos += imgW + 4; rowCount++;
        } catch (e) { console.warn('[TECHNICAL-PDF] Gagal load gambar:', url); }
      }
      y += imgH + 8;
    }

    for (let i = 0; i < assessors.length; i++) {
      const a = assessors[i];
      if (y > PH - 40) { doc.addPage(); y = M; }
      doc.setFillColor(99, 102, 241); doc.rect(M, y, CW, 8, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text((i + 1) + '. ' + cleanText(a.assessorName || a.kode), M + 3, y + 5.5);
      doc.text('Rating: ' + a.rating + '/4', PW - M - 3, y + 5.5, { align: 'right' });
      y += 10;
      doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text('Catatan:', M + 2, y); y += 4;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      const lines = doc.splitTextToSize(cleanText(a.notes || '(tidak ada catatan)'), CW - 6);
      lines.forEach(line => { if (y > PH - 20) { doc.addPage(); y = M; } doc.text(line, M + 3, y); y += 3.5; });
      y += 5;
    }

       if (!opts.contentOnly) {
    if (y > PH - 15) { doc.addPage(); y = M; }
    doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 5;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120);
    doc.text('Dicetak: ' + new Date().toLocaleString('id-ID'), M, y);
    doc.text('Halaman ' + doc.internal.getNumberOfPages(), PW - M, y, { align: 'right' });
    }
    return doc;
  };

    const __technicalRealtimeListeners = new Map();
  window.__attachTechnicalRealtime = function (slug, wrapper, name, position) {
    const old = __technicalRealtimeListeners.get(slug);
    if (old) { try { old.ref.off(); } catch (e) {} __technicalRealtimeListeners.delete(slug); }
    if (!fbReady()) {
      fetchTechnicalData(slug).then(data => {
        if (wrapper && wrapper.isConnected) wrapper.innerHTML = renderTechnicalSectionHTML(data, slug, name, position);
      }).catch(() => {});
      return;
    }
    const safeSlug = slugifyDashed(slug);
    const refAssess = firebase.database().ref('sgs_technical_assessments/' + safeSlug);
    let assessData = null;

    const render = () => {
      if (!wrapper.isConnected) {
        try { refAssess.off(); } catch (e) {}
        __technicalRealtimeListeners.delete(slug);
        return;
      }
      try {
        wrapper.innerHTML = renderTechnicalSectionHTML(
          { assessments: assessData || {} },
          slug, name, position
        );
      } catch (e) { console.warn('[TECHNICAL-REALTIME] render error:', e.message); }
    };
    refAssess.on('value', snap => { assessData = snap.val(); render(); });
    __technicalRealtimeListeners.set(slug, {
      ref: { off: () => { try { refAssess.off(); } catch (e) {} } }
    });
  };

  window.__detachTechnicalRealtime = function(slug) {
    const old = __technicalRealtimeListeners.get(slug);
    if (old) { try { old.ref.off(); } catch (e) {} __technicalRealtimeListeners.delete(slug); }
  };

  if (!window.__technicalResultDelegationAttached) {
    window.__technicalResultDelegationAttached = true;
    document.addEventListener('click', async function (e) {
      const openBtn = e.target.closest('.js-technical-open');
      if (openBtn) {
        e.preventDefault(); e.stopPropagation();
        openTechnicalModal(openBtn.getAttribute('data-slug'), openBtn.getAttribute('data-name'), openBtn.getAttribute('data-position'));
        return;
      }
      const pdfBtn = e.target.closest('.js-technical-pdf');
      if (pdfBtn) {
        e.preventDefault(); e.stopPropagation();
        const prev = pdfBtn.innerHTML;
        pdfBtn.innerHTML = '⏳ PDF...'; pdfBtn.disabled = true;
        try {
          const slug = pdfBtn.getAttribute('data-slug');
          const name = pdfBtn.getAttribute('data-name');
          const position = pdfBtn.getAttribute('data-position');
          const data = await fetchTechnicalData(slug);
          if (!data) throw new Error('Data tidak tersedia');
          const doc = await window.generateTechnicalPDF(name, position, data);
          const safeName = String(name || 'Kandidat').replace(/[^a-zA-Z0-9]/g, '-');
          doc.save('Hasil-Teknis-' + safeName + '.pdf');
          pdfBtn.innerHTML = '✓ Terunduh';
          setTimeout(() => { pdfBtn.innerHTML = prev; pdfBtn.disabled = false; }, 1800);
        } catch (err) { alert('Gagal PDF: ' + err.message); pdfBtn.innerHTML = prev; pdfBtn.disabled = false; }
        return;
      }
      const imgBtn = e.target.closest('.js-technical-images');
      if (imgBtn) {
        e.preventDefault(); e.stopPropagation();
        window.__openTechnicalImagesModal(imgBtn.getAttribute('data-slug'), imgBtn.getAttribute('data-name'));
        return;
      }
    }, true);
  }

   window.renderTechnicalSectionHTML = renderTechnicalSectionHTML;
  window.fetchTechnicalData = fetchTechnicalData;
  window.openTechnicalModal = openTechnicalModal;

  window.__detachTechnicalRealtime = function(slug) {
    const old = __technicalRealtimeListeners.get(slug);
    if (old) { try { old.ref.off(); } catch (e) {} __technicalRealtimeListeners.delete(slug); }
  };

  console.log('[TECHNICAL-RESULT-ADMIN] ✓ Loaded');
})();