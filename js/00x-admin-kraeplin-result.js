/* ============================================================
   js/00x-admin-kraeplin-result.js — v1 (Admin Web View Kraeplin)
   ------------------------------------------------------------
   - Baca data dari sgs_scores/{slug} (auto-push dari kandidat)
   - renderKRAEPLINSectionHTML() → card di area "Hasil Tes"
   - openKRAEPLINModal()        → modal grafik + analisis fase
   - generateKRAEPLINPDF()      → PDF ringkas on-demand
   - UGM norms + slope + deltaEL
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

  /* UGM bands — konsisten dengan 03-kraeplin.js */
  const UGM_BANDS = {
    PANKER:  [10, 14, 18, 22],
    TIANKER: [5, 10, 15, 20],
    JANKER:  [1.5, 2.5, 4, 6],
    HANKER:  [-3, -1, 1, 3]
  };
  const LABELS5 = ["Rendah Sekali", "Rendah", "Cukup", "Tinggi", "Sangat Tinggi"];

  function catFixedAsc(value, bandsAsc, invert) {
    const [b1, b2, b3, b4] = bandsAsc;
    let idx = 0;
    if (value <= b1) idx = 0;
    else if (value <= b2) idx = 1;
    else if (value <= b3) idx = 2;
    else if (value <= b4) idx = 3;
    else idx = 4;
    return invert ? LABELS5[4 - idx] : LABELS5[idx];
  }

  function catColor(ket) {
    const map = {
      'Rendah Sekali': { bg:'rgba(239,68,68,.18)',  br:'rgba(239,68,68,.5)',  tx:'#fca5a5' },
      'Rendah':        { bg:'rgba(249,115,22,.18)', br:'rgba(249,115,22,.5)', tx:'#fdba74' },
      'Cukup':         { bg:'rgba(245,158,11,.18)', br:'rgba(245,158,11,.5)', tx:'#fcd34d' },
      'Tinggi':        { bg:'rgba(34,197,94,.18)',  br:'rgba(34,197,94,.5)',  tx:'#86efac' },
      'Sangat Tinggi': { bg:'rgba(16,185,129,.22)', br:'rgba(16,185,129,.55)',tx:'#6ee7b7' }
    };
    return map[ket] || { bg:'rgba(148,163,184,.15)', br:'rgba(148,163,184,.4)', tx:'#cbd5e1' };
  }

  /* ============================================================
     FETCH
     ============================================================ */
  async function fetchKRAEPLINData(slug) {
    if (!fbReady()) return null;
    const dashed = slugifyDashed(slug);
    const candidates = [slug, dashed].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const s of candidates) {
      try {
        const snap = await firebase.database().ref('sgs_scores/' + s).once('value');
        const d = snap.val();
        if (d && Array.isArray(d.KRAEPLIN_answers) && d.KRAEPLIN_answers.length > 0
            && Array.isArray(d.KRAEPLIN_key) && d.KRAEPLIN_key.length > 0) {
          return {
            answers:           d.KRAEPLIN_answers,
            key:               d.KRAEPLIN_key,
            expectedPerCol:    Array.isArray(d.KRAEPLIN_expectedPerCol) ? d.KRAEPLIN_expectedPerCol : null,
            completed:         d.KRAEPLIN_completed === true,
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
     COMPUTE — mirror 03-kraeplin.js, self-contained
     ============================================================ */
  function computeKraeplinResults(answers, key, expectedPerColOverride) {
    if (!Array.isArray(answers) || !Array.isArray(key)) return null;

    const expectedPerCol = (Array.isArray(expectedPerColOverride) && expectedPerColOverride.length)
      ? expectedPerColOverride.slice()
      : key.map(k => Array.isArray(k) ? k.length : 0);
    const expectedTotal = expectedPerCol.reduce((a, b) => a + (Number(b) || 0), 0);

    const colStats = expectedPerCol.map((exp, cIdx) => {
      const jaw = Array.isArray(answers[cIdx]) ? answers[cIdx] : [];
      const k   = Array.isArray(key[cIdx]) ? key[cIdx] : [];
      let isi = 0, benar = 0, salah = 0;
      for (let r = 0; r < Math.min(jaw.length, k.length); r++) {
        const v = jaw[r];
        if (typeof v === 'number' && v >= 0 && !Number.isNaN(v)) {
          isi++;
          if (v === k[r]) benar++; else salah++;
        }
      }
      const kosong = Math.max(0, (Number(exp) || 0) - isi);
      return { exp, isi, benar, salah, kosong };
    });

    const isiPerKolom     = colStats.map(s => s.isi);
    const benarPerKolom   = colStats.map(s => s.benar);
    const salahPerKolom   = colStats.map(s => s.salah);
    const kosongPerKolom  = colStats.map(s => s.kosong);
    const akurasiPerKolom = colStats.map(s => s.isi > 0 ? (s.benar / s.isi * 100) : 0);

    const totalIsi    = isiPerKolom.reduce((a, b) => a + b, 0);
    const totalBenar  = benarPerKolom.reduce((a, b) => a + b, 0);
    const totalSalah  = salahPerKolom.reduce((a, b) => a + b, 0);
    const totalKosong = Math.max(0, expectedTotal - totalIsi);

    const kolomDikerjakan = isiPerKolom.filter(v => v > 0).length || 0;

    const panker      = kolomDikerjakan > 0 ? (totalIsi / kolomDikerjakan) : 0;
    const tianker_abs = totalSalah;
    const tianker_pct = totalIsi > 0 ? (totalSalah / totalIsi * 100) : 0;

    /* JANKER — rata-rata deviasi antar kolom */
    const jDif = [];
    for (let i = 1; i < isiPerKolom.length; i++) {
      if (isiPerKolom[i] > 0 || isiPerKolom[i - 1] > 0) {
        jDif.push(Math.abs(isiPerKolom[i] - isiPerKolom[i - 1]));
      }
    }
    const jankerAvgDev = jDif.length ? (jDif.reduce((a, b) => a + b, 0) / jDif.length) : 0;
    const jankerRange  = isiPerKolom.length
      ? (Math.max(...isiPerKolom) - Math.min(...isiPerKolom))
      : 0;

    /* HANKER — selisih kolom terakhir vs pertama (max 50) */
    const lastIdx  = Math.min(50, isiPerKolom.length) - 1;
    const firstIdx = 0;
    const hanker = (lastIdx >= 0 && isiPerKolom.length > 0)
      ? (isiPerKolom[lastIdx] - isiPerKolom[firstIdx])
      : 0;

    /* Early vs Late */
    const takeAvg = (arr, from, to) => {
      const seg = arr.slice(from, to);
      const valid = seg.filter(x => x > 0);
      return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
    };
    const n = isiPerKolom.length;
    const blk = 10;
    const earlyAvg = takeAvg(isiPerKolom, 0, Math.min(blk, n));
    const lateAvg  = takeAvg(isiPerKolom, Math.max(0, Math.min(50, n) - blk), Math.min(50, n));
    const deltaEL  = lateAvg - earlyAvg;

    /* Linear regression slope */
    const linRegSlope = (yFix) => {
      const x = yFix.map((_, i) => i + 1);
      const m = x.length;
      if (!m) return 0;
      const meanX = x.reduce((a, b) => a + b, 0) / m;
      const meanY = yFix.reduce((a, b) => a + b, 0) / m;
      let num = 0, den = 0;
      for (let i = 0; i < m; i++) {
        num += (x[i] - meanX) * (yFix[i] - meanY);
        den += (x[i] - meanX) * (x[i] - meanX);
      }
      return den ? (num / den) : 0;
    };
    const slope = +linRegSlope(isiPerKolom).toFixed(3);

    const TH_SLOPE = 0.15, TH_DELTA = 1.00;
    let trenText;
    if (slope <= -TH_SLOPE && deltaEL < -TH_DELTA)      trenText = "Menurun (indikasi kelelahan)";
    else if (slope >= +TH_SLOPE && deltaEL > +TH_DELTA) trenText = "Meningkat (indikasi pemanasan/ketahanan)";
    else                                                trenText = "Relatif stabil";

    const pScore = +panker.toFixed(1);
    const tScore = +tianker_abs;
    const jScore = +jankerAvgDev.toFixed(2);
    const hScore = +hanker.toFixed(2);

    const catP = catFixedAsc(pScore, UGM_BANDS.PANKER, false);
    const catT = catFixedAsc(tScore, UGM_BANDS.TIANKER, true);
    const catJ = catFixedAsc(jScore, UGM_BANDS.JANKER, true);
    const catH = catFixedAsc(hScore, UGM_BANDS.HANKER, false);

    return {
      panker: pScore, tianker: tScore, tianker_pct, janker: jScore,
      jankerRange, hanker: hScore, slope, deltaEL, earlyAvg, lateAvg, trenText,
      catP, catT, catJ, catH,
      totalIsi, totalBenar, totalSalah, totalKosong, expectedTotal, kolomDikerjakan,
      isiPerKolom, benarPerKolom, salahPerKolom, kosongPerKolom, akurasiPerKolom
    };
  }

  /* ============================================================
     CHART DRAWING — native canvas, line + point
     ============================================================ */
  function drawKraeplinLineChart(canvas, data, opts) {
    if (!canvas || !Array.isArray(data) || !data.length) return;
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    const padL = 32, padR = 12, padT = 22, padB = 26;
    const pw = W - padL - padR;
    const ph = H - padT - padB;

    const yMin = (opts.yMin != null) ? opts.yMin : 0;
    const yMax = (opts.yMax != null) ? opts.yMax : Math.max(...data, 1);

    ctx.clearRect(0, 0, W, H);

    /* Title */
    if (opts.title) {
      ctx.fillStyle = '#c7d2fe';
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(opts.title, W / 2, 14);
    }

    /* Plot area background */
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.fillRect(padL, padT, pw, ph);

    /* Y gridlines */
    const yTicks = 5;
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.lineWidth = 1;
    ctx.font = '9px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    for (let i = 0; i <= yTicks; i++) {
      const v = yMin + (yMax - yMin) * (i / yTicks);
      const y = padT + ph - ((v - yMin) / (yMax - yMin)) * ph;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + pw, y);
      ctx.stroke();
      ctx.fillText(String(Math.round(v)), padL - 4, y + 3);
    }

    /* X-axis labels */
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    const stepX = data.length > 1 ? pw / (data.length - 1) : pw;
    const everyX = Math.max(1, Math.ceil(data.length / 12));
    for (let i = 0; i < data.length; i += everyX) {
      const x = padL + i * stepX;
      ctx.fillText(String(i + 1), x, padT + ph + 14);
    }

    /* Line */
    ctx.strokeStyle = opts.lineColor || '#a78bfa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = padL + i * stepX;
      const y = padT + ph - ((data[i] - yMin) / (yMax - yMin)) * ph;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    /* Points */
    ctx.fillStyle = opts.pointColor || '#c4b5fd';
    for (let i = 0; i < data.length; i++) {
      const x = padL + i * stepX;
      const y = padT + ph - ((data[i] - yMin) / (yMax - yMin)) * ph;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ============================================================
     RENDER: Section Card
     ============================================================ */
  function renderKRAEPLINSectionHTML(data, slug, name, position) {
    if (!data) return '';

    const hasil = computeKraeplinResults(data.answers, data.key, data.expectedPerCol);
    if (!hasil) {
      return `
        <div style="margin-bottom: 12px; padding: 14px 16px; background: rgba(239,68,68,.06); border: 1px dashed rgba(239,68,68,.3); border-radius: 11px;">
          <div style="font-size: 11.5px; color: #fca5a5; font-weight: 800;">⚠️ Data Kraeplin ada tapi gagal dihitung</div>
        </div>`;
    }

    const safeSlug     = escHtml(slug || data._slug || '');
    const safeName     = escHtml(name || data.candidateName || '');
    const safePosition = escHtml(position || data.candidatePosition || '');

    const chip = (label, value, ket, color) => `
      <div style="padding: 8px 10px; background: rgba(0,0,0,.28); border-radius: 9px; border: 1px solid rgba(255,255,255,.06);">
        <div style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #64748b;">${label}</div>
        <div style="font-size: 16px; font-weight: 900; color: ${color}; margin-top: 3px; font-variant-numeric: tabular-nums;">${value}</div>
        <div style="font-size: 9.5px; font-weight: 700; color: #94a3b8; margin-top: 2px;">${ket}</div>
      </div>`;

    return `
      <div style="margin-bottom: 12px; padding: 14px 16px; background: linear-gradient(135deg, rgba(99,102,241,.12), rgba(139,92,246,.08)); border: 1.5px solid rgba(99,102,241,.4); border-radius: 12px; box-shadow: 0 0 0 1px rgba(99,102,241,.1), 0 0 20px rgba(99,102,241,.12);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap;">
          <div style="width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 10px; font-size: 20px; box-shadow: 0 4px 12px rgba(99,102,241,.35);">🧮</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 12.5px; font-weight: 900; color: #c7d2fe; letter-spacing: .3px;">Hasil Tes Kraeplin</div>
            <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">
              ${hasil.kolomDikerjakan} kolom · Total isi: <b style="color:#a5b4fc;">${hasil.totalIsi}</b>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 6px; margin-bottom: 10px;">
          ${chip('PANKER', hasil.panker.toFixed(1), hasil.catP, '#93c5fd')}
          ${chip('TIANKER', hasil.tianker, hasil.catT, '#fcd34d')}
          ${chip('JANKER', hasil.janker.toFixed(2), hasil.catJ, '#6ee7b7')}
          ${chip('HANKER', (hasil.hanker >= 0 ? '+' : '') + hasil.hanker.toFixed(2), hasil.catH, '#c4b5fd')}
        </div>

        <div style="padding: 8px 12px; background: rgba(0,0,0,.22); border-radius: 8px; font-size: 10.5px; color: #cbd5e1; margin-bottom: 10px;">
          <b style="color:#a5b4fc;">Tren:</b> ${escHtml(hasil.trenText)} &nbsp;·&nbsp;
          <b style="color:#a5b4fc;">Slope:</b> ${hasil.slope} &nbsp;·&nbsp;
          <b style="color:#a5b4fc;">Δ awal–akhir:</b> ${hasil.deltaEL >= 0 ? '+' : ''}${hasil.deltaEL.toFixed(1)}
        </div>

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="js-kraeplin-open"
            data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePosition}"
            style="flex: 1; min-width: 130px; padding: 9px 14px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: 0; border-radius: 9px; color: #fff; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(99,102,241,.35);">
            👁 Lihat Detail
          </button>
          <button class="js-kraeplin-pdf"
            data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePosition}"
            style="padding: 9px 16px; background: rgba(16,185,129,.18); border: 1px solid rgba(16,185,129,.5); border-radius: 9px; color: #6ee7b7; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
            📄 PDF
          </button>
        </div>
      </div>`;
  }

  /* ============================================================
     RENDER: Totals Table
     ============================================================ */
  function renderTotalsTableHTML(h) {
    const rows = [
      ['Jawaban Benar', h.totalBenar, '#86efac'],
      ['Jawaban Salah', h.totalSalah, '#fca5a5'],
      ['Jawaban Kosong', h.totalKosong, '#94a3b8'],
      ['Total Diisi', h.totalIsi, '#93c5fd'],
      ['Total Seharusnya', h.expectedTotal, '#c4b5fd'],
      ['Kolom Dikerjakan', h.kolomDikerjakan, '#fcd34d']
    ];
    return `
      <div style="background: rgba(0,0,0,.28); border: 1px solid rgba(255,255,255,.08); border-radius: 11px; overflow: hidden;">
        <div style="padding: 10px 14px; background: rgba(0,0,0,.3); font-size: 10px; font-weight: 900; letter-spacing: 1px; color: #64748b;">
          RINGKASAN TOTAL
        </div>
        ${rows.map(([label, val, color], i) => `
          <div style="display: flex; justify-content: space-between; padding: 9px 14px; ${i > 0 ? 'border-top: 1px solid rgba(255,255,255,.05);' : ''} font-size: 12px;">
            <span style="color: #cbd5e1; font-weight: 600;">${label}</span>
            <span style="color: ${color}; font-weight: 900; font-variant-numeric: tabular-nums;">${val}</span>
          </div>`).join('')}
      </div>`;
  }

  /* ============================================================
     MODAL
     ============================================================ */
  async function openKRAEPLINModal(slug, name, position) {
    const old = document.getElementById('kraeplinAdminModal'); if (old) old.remove();
    const data = await fetchKRAEPLINData(slug);

    const overlay = document.createElement('div');
    overlay.id = 'kraeplinAdminModal';
    overlay.setAttribute('data-slug', slug);
    overlay.setAttribute('data-name', name);
    overlay.setAttribute('data-position', position || '');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

    if (!data) {
      overlay.innerHTML = `
        <div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.4);border-radius:18px;padding:32px;text-align:center;color:#e2e8f0;box-shadow:0 30px 90px rgba(0,0,0,.65);">
          <div style="font-size:52px;margin-bottom:12px;">📭</div>
          <div style="font-size:16px;font-weight:900;color:#fff;margin-bottom:8px;">Belum Ada Data Kraeplin</div>
          <div style="font-size:13px;color:#94a3b8;line-height:1.65;margin-bottom:22px;">
            Kandidat <b style="color:#c7d2fe;">${escHtml(name)}</b> belum menyelesaikan tes Kraeplin atau datanya belum tersinkron.
          </div>
          <button id="kraeplinCloseEmpty" style="width:100%;padding:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Tutup</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#kraeplinCloseEmpty').onclick = () => overlay.remove();
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      return;
    }

    const h = computeKraeplinResults(data.answers, data.key, data.expectedPerCol);
    const finalName = name || data.candidateName || 'Kandidat';
    const finalPos  = position || data.candidatePosition || '-';

    overlay.innerHTML = `
      <div style="width:min(960px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.4);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;">

        <div style="padding:16px 20px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <div style="width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:11px;font-size:20px;">🧮</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">HASIL TES KRAEPLIN</div>
            <div style="font-size:16px;font-weight:900;color:#fff;margin-top:2px;word-break:break-word;">${escHtml(finalName)}</div>
            <div style="font-size:11px;opacity:.85;margin-top:2px;">💼 ${escHtml(finalPos)}</div>
          </div>
          <button id="kraeplinCloseBtn" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>
        </div>

        <div style="flex:1;overflow-y:auto;padding:16px 20px 20px;">

          <!-- Skor utama -->
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:14px;">
            ${(() => {
              const card = (label, value, ket) => {
                const c = catColor(ket);
                return `<div style="padding:12px;background:${c.bg};border:1px solid ${c.br};border-radius:11px;">
                  <div style="font-size:9.5px;font-weight:900;letter-spacing:1px;color:#94a3b8;">${label}</div>
                  <div style="font-size:22px;font-weight:900;color:${c.tx};margin-top:4px;font-variant-numeric:tabular-nums;line-height:1;">${value}</div>
                  <div style="font-size:10.5px;font-weight:800;color:${c.tx};margin-top:4px;letter-spacing:.3px;">${ket}</div>
                </div>`;
              };
              return card('PANKER', h.panker.toFixed(1), h.catP)
                   + card('TIANKER', h.tianker, h.catT)
                   + card('JANKER', h.janker.toFixed(2), h.catJ)
                   + card('HANKER', (h.hanker >= 0 ? '+' : '') + h.hanker.toFixed(2), h.catH);
            })()}
          </div>

          <!-- Totals table -->
          <div style="margin-bottom:14px;">
            ${renderTotalsTableHTML(h)}
          </div>

          <!-- Tren & Fase -->
          <div style="padding:14px;background:linear-gradient(135deg, rgba(99,102,241,.12), rgba(139,92,246,.08));border:1px solid rgba(99,102,241,.4);border-radius:12px;margin-bottom:14px;">
            <div style="font-size:11px;font-weight:900;letter-spacing:1px;color:#a5b4fc;margin-bottom:10px;">📈 ANALISIS TREN & FASE</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;">
              <div style="padding:8px 10px;background:rgba(0,0,0,.28);border-radius:8px;">
                <div style="font-size:9px;font-weight:900;letter-spacing:1px;color:#64748b;">TREN</div>
                <div style="font-size:11.5px;font-weight:800;color:#e2e8f0;margin-top:3px;">${escHtml(h.trenText)}</div>
              </div>
              <div style="padding:8px 10px;background:rgba(0,0,0,.28);border-radius:8px;">
                <div style="font-size:9px;font-weight:900;letter-spacing:1px;color:#64748b;">SLOPE</div>
                <div style="font-size:14px;font-weight:900;color:#93c5fd;margin-top:3px;font-variant-numeric:tabular-nums;">${h.slope}</div>
              </div>
              <div style="padding:8px 10px;background:rgba(0,0,0,.28);border-radius:8px;">
                <div style="font-size:9px;font-weight:900;letter-spacing:1px;color:#64748b;">AWAL (10 KOLOM)</div>
                <div style="font-size:14px;font-weight:900;color:#fcd34d;margin-top:3px;font-variant-numeric:tabular-nums;">${h.earlyAvg.toFixed(1)}</div>
              </div>
              <div style="padding:8px 10px;background:rgba(0,0,0,.28);border-radius:8px;">
                <div style="font-size:9px;font-weight:900;letter-spacing:1px;color:#64748b;">AKHIR (10 KOLOM)</div>
                <div style="font-size:14px;font-weight:900;color:#fcd34d;margin-top:3px;font-variant-numeric:tabular-nums;">${h.lateAvg.toFixed(1)}</div>
              </div>
              <div style="padding:8px 10px;background:rgba(0,0,0,.28);border-radius:8px;">
                <div style="font-size:9px;font-weight:900;letter-spacing:1px;color:#64748b;">Δ AWAL→AKHIR</div>
                <div style="font-size:14px;font-weight:900;color:${h.deltaEL >= 0 ? '#86efac' : '#fca5a5'};margin-top:3px;font-variant-numeric:tabular-nums;">${h.deltaEL >= 0 ? '+' : ''}${h.deltaEL.toFixed(1)}</div>
              </div>
            </div>
          </div>

          <!-- Charts -->
          <div style="display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:14px;">
            <div style="padding:10px;background:rgba(0,0,0,.28);border-radius:11px;border:1px solid rgba(255,255,255,.08);">
              <div style="font-size:11px;font-weight:900;color:#93c5fd;letter-spacing:.5px;margin-bottom:6px;text-align:center;">ISI PER KOLOM</div>
              <canvas id="kraeplinChartIsi" width="800" height="200" style="width:100%;height:auto;display:block;"></canvas>
            </div>
            <div style="padding:10px;background:rgba(0,0,0,.28);border-radius:11px;border:1px solid rgba(255,255,255,.08);">
              <div style="font-size:11px;font-weight:900;color:#86efac;letter-spacing:.5px;margin-bottom:6px;text-align:center;">AKURASI PER KOLOM (%)</div>
              <canvas id="kraeplinChartAkurasi" width="800" height="200" style="width:100%;height:auto;display:block;"></canvas>
            </div>
          </div>

        </div>

        <div style="padding:12px 20px;background:rgba(0,0,0,.32);border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="color:#94a3b8;font-size:10.5px;font-weight:600;">ℹ️ Data dari Firebase (sgs_scores) · ${h.kolomDikerjakan} kolom</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="js-kraeplin-pdf" style="padding:8px 16px;background:linear-gradient(135deg,#10b981,#059669);border:0;border-radius:9px;color:#fff;font-family:inherit;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,.35);">📄 Download PDF</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    overlay.querySelector('#kraeplinCloseBtn').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    /* Draw charts after DOM ready */
    requestAnimationFrame(() => {
      const cIsi = document.getElementById('kraeplinChartIsi');
      const cAkr = document.getElementById('kraeplinChartAkurasi');
      const maxIsi = Math.max(...h.isiPerKolom, 30);
      drawKraeplinLineChart(cIsi, h.isiPerKolom, {
        title: '',
        yMin: 0,
        yMax: Math.ceil(maxIsi * 1.1),
        lineColor: '#93c5fd',
        pointColor: '#c7d2fe'
      });
      drawKraeplinLineChart(cAkr, h.akurasiPerKolom.map(v => +v.toFixed(1)), {
        title: '',
        yMin: 0,
        yMax: 100,
        lineColor: '#6ee7b7',
        pointColor: '#a7f3d0'
      });
    });
  }

  /* ============================================================
     PDF RINGKAS
     ============================================================ */
  async function generateKRAEPLINPDF(name, position, data) {
    if (typeof window.loadPdfLibs === 'function') await window.loadPdfLibs();
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF tidak tersedia');

    const h = computeKraeplinResults(data.answers, data.key, data.expectedPerCol);
    if (!h) throw new Error('Data Kraeplin tidak valid');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 15, CW = PW - 2 * M;
    let y = M;

    /* Header */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(79, 70, 229);
    doc.text('HASIL TES KRAEPLIN', PW / 2, y, { align: 'center' });
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
      ['Tanggal', tanggal],
      ['Kolom Dikerjakan', String(h.kolomDikerjakan)]
    ].forEach(([k, v]) => {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.setFontSize(10);
      doc.text(k + ' :', M, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(v), M + 40, y);
      y += 5.5;
    });
    y += 3;

    /* Ringkasan skor utama */
    doc.setFillColor(238, 242, 255); doc.setDrawColor(99, 102, 241);
    doc.rect(M, y, CW, 26, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(67, 56, 202);
    doc.text(`PANKER: ${h.panker.toFixed(1)} (${h.catP})    ·    TIANKER: ${h.tianker} (${h.catT})`, M + 4, y + 7);
    doc.text(`JANKER: ${h.janker.toFixed(2)} (${h.catJ})    ·    HANKER: ${(h.hanker >= 0 ? '+' : '')}${h.hanker.toFixed(2)} (${h.catH})`, M + 4, y + 14);
    doc.setFontSize(10); doc.setTextColor(67, 56, 202);
    doc.text(`Tren: ${h.trenText}  ·  Slope: ${h.slope}  ·  Δ awal-akhir: ${h.deltaEL >= 0 ? '+' : ''}${h.deltaEL.toFixed(1)}`, M + 4, y + 21);
    y += 32;

    /* Tabel totals */
    doc.setFillColor(99, 102, 241); doc.rect(M, y, CW, 7, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('RINGKASAN TOTAL', M + 4, y + 5);
    y += 7;

    const totalsRows = [
      ['Jawaban Benar', h.totalBenar],
      ['Jawaban Salah', h.totalSalah],
      ['Jawaban Kosong', h.totalKosong],
      ['Total Diisi', h.totalIsi],
      ['Total Seharusnya', h.expectedTotal],
      ['Kolom Dikerjakan', h.kolomDikerjakan]
    ];
    totalsRows.forEach((r, i) => {
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(M, y, CW, 6.5, 'F'); }
      doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.setFontSize(9);
      doc.text(r[0], M + 4, y + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.text(String(r[1]), M + CW - 4, y + 4.5, { align: 'right' });
      y += 6.5;
    });
    y += 6;

    /* Charts — draw to hidden canvas di DOM, capture PNG */
    const cIsi = document.getElementById('kraeplinChartIsi');
    const cAkr = document.getElementById('kraeplinChartAkurasi');

    let imgIsi = null, imgAkr = null;
    if (cIsi && cAkr) {
      try { imgIsi = cIsi.toDataURL('image/png'); } catch (e) {}
      try { imgAkr = cAkr.toDataURL('image/png'); } catch (e) {}
    }

    if (imgIsi) {
      if (y > PH - 70) { doc.addPage(); y = M; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(79, 70, 229);
      doc.text('ISI PER KOLOM', M, y); y += 4;
      doc.addImage(imgIsi, 'PNG', M, y, CW, 42);
      y += 46;
    }
    if (imgAkr) {
      if (y > PH - 70) { doc.addPage(); y = M; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(79, 70, 229);
      doc.text('AKURASI PER KOLOM (%)', M, y); y += 4;
      doc.addImage(imgAkr, 'PNG', M, y, CW, 42);
      y += 46;
    }

    /* Kesimpulan */
    if (y > PH - 40) { doc.addPage(); y = M; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(79, 70, 229);
    doc.text('KESIMPULAN', M, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);

    const kesimpulan = [
      `Tempo kerja (PANKER): ${h.panker.toFixed(1)} item/lajur — ${h.catP}.`,
      `Ketelitian (TIANKER): ${h.tianker} kesalahan (${h.tianker_pct.toFixed(1)}% dari total) — ${h.catT}.`,
      `Keajegan (JANKER): deviasi rata-rata ${h.janker.toFixed(2)} — ${h.catJ}.`,
      `Ketahanan (HANKER): ${(h.hanker >= 0 ? '+' : '')}${h.hanker.toFixed(2)} dari kolom awal ke kolom 50 — ${h.catH}.`,
      `Tren: ${h.trenText}.`
    ];
    kesimpulan.forEach(line => {
      if (y > PH - 15) { doc.addPage(); y = M; }
      doc.splitTextToSize(line, CW).forEach(l => { doc.text(l, M, y); y += 4.5; });
    });

    /* Footer */
    if (y > PH - 15) { doc.addPage(); y = M; }
    y += 6;
    doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 5;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
    doc.text('Dibuat: ' + new Date().toLocaleString('id-ID'), M, y);
    doc.text('Halaman ' + doc.internal.getNumberOfPages(), PW - M, y, { align: 'right' });

    return doc;
  }

  async function downloadKRAEPLINPDF(slug, name, position) {
    const data = await fetchKRAEPLINData(slug);
    if (!data) throw new Error('Data Kraeplin tidak tersedia');
    const doc = await generateKRAEPLINPDF(name, position, data);
    const safeName = String(name || 'Kandidat').replace(/[^a-zA-Z0-9]/g, '-');
    doc.save('Hasil-Kraeplin-' + safeName + '.pdf');
  }

  /* ============================================================
     EVENT DELEGATION
     ============================================================ */
  if (!window.__kraeplinDelegationAttached) {
    window.__kraeplinDelegationAttached = true;
    document.addEventListener('click', async function (e) {
      const openBtn = e.target.closest('.js-kraeplin-open');
      if (openBtn) {
        e.preventDefault(); e.stopPropagation();
        if (openBtn.disabled) return;
        const slug     = openBtn.getAttribute('data-slug');
        const name     = openBtn.getAttribute('data-name');
        const position = openBtn.getAttribute('data-position');
        if (slug) openKRAEPLINModal(slug, name, position);
        return;
      }

      const pdfBtn = e.target.closest('.js-kraeplin-pdf');
      if (pdfBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = pdfBtn.closest('#kraeplinAdminModal');
        const slug     = modal ? modal.getAttribute('data-slug')     : pdfBtn.getAttribute('data-slug');
        const name     = modal ? modal.getAttribute('data-name')     : pdfBtn.getAttribute('data-name');
        const position = modal ? modal.getAttribute('data-position') : pdfBtn.getAttribute('data-position');
        if (!slug) return;
        const prev = pdfBtn.innerHTML;
        pdfBtn.innerHTML = '⏳ PDF...'; pdfBtn.disabled = true;
        try {
          await downloadKRAEPLINPDF(slug, name, position);
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

  /* ============================================================
     EXPORT
     ============================================================ */
  window.openKRAEPLINModal          = openKRAEPLINModal;
  window.downloadKRAEPLINPDF        = downloadKRAEPLINPDF;
  window.renderKRAEPLINSectionHTML  = renderKRAEPLINSectionHTML;
  window.__fetchKRAEPLINData        = fetchKRAEPLINData;

  console.log('[KRAEPLIN-ADMIN] ✓ Loaded v1 — section + modal + PDF');
})();