/* ============================================================
   js/00w-admin-disc-result.js — v1 (Admin Web View Hasil DISC)
   ------------------------------------------------------------
   - Baca data dari sgs_scores/{slug} (auto-push dari kandidat)
   - renderDISCSectionHTML() → card di area "Hasil Tes"
   - openDISCModal()        → modal 3 grafik + interpretasi + rekomendasi
   - generateDISCPDF()      → PDF ringkas on-demand (3 chart PNG)
   - Reuse global dari disc.js: countDISC, analisa2DominanDISC,
     getPixelY, drawDISCClassic
   - Reuse data: DISC_DATA, DISC_ROLES_MAP, DISC_IMPLICATIONS
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
  // Escape tapi izinkan <br> dan <b> dari output analisa2DominanDISC
  function escapeDISCResult(str) {
    let s = String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    s = s.replace(/&lt;br\s*\/?&gt;/gi, '<br>');
    s = s.replace(/&lt;b&gt;/gi, '<b>').replace(/&lt;\/b&gt;/gi, '</b>');
    return s;
  }
  function fbReady() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
  }
  function slugifyDashed(name) {
    return String(name || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  }

  /* Threshold invalid — konsisten dengan js/core/pdf/04-disc.js */
  const DISC_INVALID_THRESHOLD = 13;

  /* Persyaratan posisi (copy dari 04-disc.js) */
  const DISC_POSITION_REQ = {
    'Administrator':   { sangat: ['SC','DC'],           cocok: ['CS','CD'],           cukup: ['SD','IS'] },
    'Dosen/Guru':      { sangat: ['IS','IC','SI','SC'], cocok: ['ID','SD'],           cukup: ['CS','CI'] },
    'Technical Staff': { sangat: ['DC','SC'],           cocok: ['CD','CS'],           cukup: ['DS','SD'] },
    'IT Staff':        { sangat: ['DC','CD'],           cocok: ['SC','CS'],           cukup: ['SD','DS'] },
    'Manajer':         { sangat: ['DI','ID','DC','CD'], cocok: ['DS','IS'],           cukup: ['SC','CS'] },
    'Housekeeping':    { sangat: ['SC','CS'],           cocok: ['SI','IC'],           cukup: ['SD','DS'] }
  };

  /* ============================================================
     FETCH: coba spaced-slug & dashed-slug
     ============================================================ */
  async function fetchDISCData(slug) {
    if (!fbReady()) return null;
    const dashed = slugifyDashed(slug);
    const candidates = [slug, dashed].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const s of candidates) {
      try {
        const snap = await firebase.database().ref('sgs_scores/' + s).once('value');
        const d = snap.val();
        if (d && Array.isArray(d.DISC_answers) && d.DISC_answers.length > 0) {
          return {
            answers:           d.DISC_answers,
            completed:         d.DISC_completed === true,
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
     COMPUTE
     ============================================================ */
  function computeDISCResults(answers) {
    if (typeof countDISC !== 'function') return null;
    const questions = (typeof DISC_DATA !== 'undefined' && DISC_DATA?.questions) || [];
    if (!questions.length) return null;
    return countDISC(answers, questions);
  }

  function checkValidity(hasil) {
    const starMost  = Number(hasil?.most?.['*']  || 0);
    const starLeast = Number(hasil?.least?.['*'] || 0);
    const totalStar = starMost + starLeast;
    return { isValid: totalStar < DISC_INVALID_THRESHOLD, totalStar, starMost, starLeast };
  }

  /* Panggil analisa2DominanDISC dengan nickname sementara (kandidat).
     Karena fungsi global baca dari appState.identity.nickname. */
  function computeAnalisaWithNickname(hasil, nickname) {
    if (typeof analisa2DominanDISC !== 'function' || typeof getPixelY !== 'function') return null;
    const originalIdentity = appState.identity;
    const originalNick = originalIdentity && originalIdentity.nickname;
    try {
      if (!appState.identity) appState.identity = {};
      appState.identity.nickname = nickname || 'Peserta';

      const most   = analisa2DominanDISC(hasil.most.D,   hasil.most.I,   hasil.most.S,   hasil.most.C,   'most',   getPixelY);
      const least  = analisa2DominanDISC(hasil.least.D,  hasil.least.I,  hasil.least.S,  hasil.least.C,  'least',  getPixelY);
      const change = analisa2DominanDISC(hasil.change.D, hasil.change.I, hasil.change.S, hasil.change.C, 'change', getPixelY);
      return { most, least, change };
    } finally {
      if (appState.identity) {
        if (originalNick !== undefined) appState.identity.nickname = originalNick;
        else delete appState.identity.nickname;
      }
    }
  }

  function pickRolesFromDominan(dominanArr) {
    if (typeof DISC_ROLES_MAP === 'undefined') return [];
    const d = (dominanArr || []).filter(Boolean).slice(0, 3);
    const key = d.join('').toUpperCase();
    if (!key) return [];
    const arr = DISC_ROLES_MAP[key];
    return Array.isArray(arr) ? arr : [];
  }

  function computePositionFit(most, position) {
    const req = DISC_POSITION_REQ[position];
    if (!req) return null;
    const dominan = (most?.dominan || []).slice(0, 3);
    if (!dominan.length) return null;

    const pairs = [];
    for (let i = 0; i < dominan.length; i++) {
      for (let j = i + 1; j < dominan.length; j++) {
        pairs.push(dominan[i] + dominan[j], dominan[j] + dominan[i]);
      }
    }

    let simbol = 'K';
    if (req.sangat.some(c => pairs.includes(c))) simbol = 'SS';
    else if (req.cocok.some(c => pairs.includes(c))) simbol = 'C';
    else if (req.cukup.some(c => pairs.includes(c))) simbol = 'CC';

    const labelMap = { SS: 'SANGAT SESUAI', C: 'COCOK', CC: 'CUKUP COCOK', K: 'KURANG SESUAI' };
    const colorMap = {
      SS: { bg: 'rgba(34,197,94,.15)',  br: 'rgba(34,197,94,.55)',  tx: '#86efac' },
      C:  { bg: 'rgba(59,130,246,.15)', br: 'rgba(59,130,246,.55)', tx: '#93c5fd' },
      CC: { bg: 'rgba(245,158,11,.15)', br: 'rgba(245,158,11,.55)', tx: '#fcd34d' },
      K:  { bg: 'rgba(239,68,68,.15)',  br: 'rgba(239,68,68,.55)',  tx: '#fca5a5' }
    };
    return { simbol, label: labelMap[simbol], color: colorMap[simbol], dominan };
  }

  /* ============================================================
     RENDER: Section Card (di area Hasil Tes)
     ============================================================ */
  function renderDISCSectionHTML(data, slug, name, position) {
    /* Kandidat belum kerjakan DISC → tidak tampil sama sekali */
    if (!data) return '';

    /* -------- DATA STATE -------- */
    const hasil = computeDISCResults(data.answers);
    if (!hasil) {
      return `
        <div style="margin-bottom: 12px; padding: 14px 16px; background: rgba(239,68,68,.06); border: 1px dashed rgba(239,68,68,.3); border-radius: 11px;">
          <div style="font-size: 11.5px; color: #fca5a5; font-weight: 800;">⚠️ Data DISC ada tapi tidak bisa dihitung (DISC_DATA belum loaded?)</div>
        </div>`;
    }

    const validity = checkValidity(hasil);
    const analisa = validity.isValid ? computeAnalisaWithNickname(hasil, name) : null;

    const domMost   = analisa?.most?.dominan   || [];
    const domLeast  = analisa?.least?.dominan  || [];
    const domChange = analisa?.change?.dominan || [];

    const safeSlug     = escHtml(slug || data._slug || '');
    const safeName     = escHtml(name || data.candidateName || '');
    const safePosition = escHtml(position || data.candidatePosition || '');

    const chipStyle = (bg, br, tx) =>
      `padding: 6px 10px; background: ${bg}; border: 1px solid ${br}; border-radius: 8px; display: flex; flex-direction: column; gap: 2px;`;

    return `
      <div style="margin-bottom: 12px; padding: 14px 16px; background: linear-gradient(135deg, rgba(217,70,239,.12), rgba(139,92,246,.08)); border: 1.5px solid rgba(217,70,239,.4); border-radius: 12px; box-shadow: 0 0 0 1px rgba(217,70,239,.1), 0 0 20px rgba(217,70,239,.12);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap;">
          <div style="width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; background: linear-gradient(135deg, #d946ef, #8b5cf6); border-radius: 10px; font-size: 20px; box-shadow: 0 4px 12px rgba(217,70,239,.35);">🎯</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 12.5px; font-weight: 900; color: #e9d5ff; letter-spacing: .3px;">Hasil Tes DISC</div>
            <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">
              ${validity.isValid ? `${data.answers.length} soal · Status: <b style="color:#86efac;">VALID</b>` : `<b style="color:#fca5a5;">⚠️ HASIL INVALID</b> (total * = ${validity.totalStar})`}
            </div>
          </div>
        </div>

        ${validity.isValid ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px; margin-bottom: 10px;">
            <div style="${chipStyle('rgba(33,118,199,.15)','rgba(33,118,199,.5)','#93c5fd')}">
              <div style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #64748b;">MOST (P)</div>
              <div style="font-size: 14px; font-weight: 900; color: #93c5fd; font-family: 'Courier New', monospace;">${domMost.join('·') || '-'}</div>
            </div>
            <div style="${chipStyle('rgba(222,144,0,.15)','rgba(222,144,0,.5)','#fcd34d')}">
              <div style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #64748b;">LEAST (K)</div>
              <div style="font-size: 14px; font-weight: 900; color: #fcd34d; font-family: 'Courier New', monospace;">${domLeast.join('·') || '-'}</div>
            </div>
            <div style="${chipStyle('rgba(24,177,114,.15)','rgba(24,177,114,.5)','#6ee7b7')}">
              <div style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #64748b;">CHANGE (P-K)</div>
              <div style="font-size: 14px; font-weight: 900; color: #6ee7b7; font-family: 'Courier New', monospace;">${domChange.join('·') || '-'}</div>
            </div>
          </div>
        ` : ''}

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="js-disc-open"
            data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePosition}"
            style="flex: 1; min-width: 130px; padding: 9px 14px; background: linear-gradient(135deg, #d946ef, #8b5cf6); border: 0; border-radius: 9px; color: #fff; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(217,70,239,.35);">
            👁 Lihat Detail
          </button>
          <button class="js-disc-pdf"
            data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePosition}"
            style="padding: 9px 16px; background: rgba(16,185,129,.18); border: 1px solid rgba(16,185,129,.5); border-radius: 9px; color: #6ee7b7; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
            📄 PDF
          </button>
        </div>
      </div>`;
  }

  /* ============================================================
     RENDER: Tabel D/I/S/C
     ============================================================ */
  function renderStatsTableHTML(hasil) {
    const rows = [
      { label: 'Most (P)', data: hasil.most,   color: '#2176C7', sign: false },
      { label: 'Least (K)', data: hasil.least, color: '#DE9000', sign: false },
      { label: 'Change',   data: hasil.change, color: '#18B172', sign: true }
    ];
    return `
      <div style="background: rgba(0,0,0,.28); border: 1px solid rgba(255,255,255,.08); border-radius: 11px; overflow: hidden;">
        <div style="display: grid; grid-template-columns: 100px repeat(5, 1fr); gap: 0; background: rgba(0,0,0,.3); padding: 8px 14px; font-size: 10px; font-weight: 900; letter-spacing: 1px; color: #64748b;">
          <div>LINE</div>
          <div style="text-align: center;">D</div>
          <div style="text-align: center;">I</div>
          <div style="text-align: center;">S</div>
          <div style="text-align: center;">C</div>
          <div style="text-align: center; color: #94a3b8;">*</div>
        </div>
        ${rows.map(r => `
          <div style="display: grid; grid-template-columns: 100px repeat(5, 1fr); gap: 0; padding: 10px 14px; border-top: 1px solid rgba(255,255,255,.05); font-size: 13px; font-variant-numeric: tabular-nums;">
            <div style="color: ${r.color}; font-weight: 900; font-size: 11.5px;">${r.label}</div>
            ${['D','I','S','C','*'].map(k => {
              const v = r.data[k] || 0;
              const disp = r.sign ? (v >= 0 ? '+' + v : String(v)) : String(v);
              const isStar = k === '*';
              return `<div style="text-align: center; color: ${isStar ? '#94a3b8' : '#e2e8f0'}; font-weight: ${isStar ? 600 : 800};">${disp}</div>`;
            }).join('')}
          </div>`).join('')}
      </div>`;
  }

  /* ============================================================
     RENDER: Chart Block (Most / Least / Change)
     ============================================================ */
  function renderChartBlockHTML(canvasId, title, color, subtitle) {
    return `
      <div style="flex: 0 1 140px; max-width: 140px; padding: 8px; background: rgba(0,0,0,.28); border-radius: 11px; border: 1px solid rgba(255,255,255,.08);">
        <div style="text-align: center; font-size: 10.5px; font-weight: 900; color: ${color}; letter-spacing: .5px; margin-bottom: 5px;">${title}</div>
        <canvas id="${canvasId}" width="170" height="420" style="width: 100%; height: auto; display: block;"></canvas>
        <div style="text-align: center; font-size: 9.5px; color: #94a3b8; margin-top: 5px; line-height: 1.3;">${subtitle}</div>
      </div>`;
  }

  function drawChartsToModal(hasil, prefix) {
    if (typeof drawDISCClassic !== 'function') return;
    try {
      drawDISCClassic(prefix + 'Most',   'most',   hasil.most.D,   hasil.most.I,   hasil.most.S,   hasil.most.C,   '#2176C7');
      drawDISCClassic(prefix + 'Least',  'least',  hasil.least.D,  hasil.least.I,  hasil.least.S,  hasil.least.C,  '#DE9000');
      drawDISCClassic(prefix + 'Change', 'change', hasil.change.D, hasil.change.I, hasil.change.S, hasil.change.C, '#18B172');
    } catch (e) { console.warn('[DISC-MODAL] drawCharts error:', e.message); }
  }

  /* ============================================================
     RENDER: Interpretasi (Most / Least / Change)
     ============================================================ */
  function renderInterpretationBlockHTML(analisa, title, color, roles) {
    if (!analisa) return '';
    const dominan = analisa.dominan || [];
    const chips = dominan.length
      ? dominan.map(d => `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${color.bg};border:1px solid ${color.br};color:${color.tx};font-family:'Courier New',monospace;font-size:14px;font-weight:900;letter-spacing:1px;margin-right:6px;">${d}</span>`).join('')
      : '<span style="color:#94a3b8;font-size:11px;">(tidak ada dominan)</span>';

    const rolesBlock = (roles && roles.length)
      ? `<div style="margin-top:12px;padding-top:10px;border-top:1px dashed ${color.br};">
           <div style="font-size: 10px; font-weight: 900; letter-spacing: 1px; color: ${color.tx}; margin-bottom: 6px;">REKOMENDASI KARIR</div>
           <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #cbd5e1; line-height: 1.65;">
             ${roles.map(r => `<li>${escHtml(r)}</li>`).join('')}
           </ul>
         </div>`
      : '';

    return `
      <div style="padding: 14px; background: ${color.bg}; border: 1px solid ${color.br}; border-radius: 11px;">
        <div style="font-size: 11px; font-weight: 900; letter-spacing: 1px; color: ${color.tx}; margin-bottom: 8px;">${title}</div>
        <div style="margin-bottom: 10px;">${chips}</div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
          <b style="color: #cbd5e1;">Urutan:</b> ${escHtml(analisa.ranking || '-')}
        </div>
        <div style="font-size: 11.5px; color: #e2e8f0; line-height: 1.7;">${escapeDISCResult(analisa.deskripsi || '')}</div>
        ${analisa.analisaPola ? `<div style="margin-top: 8px; font-size: 11px; color: #cbd5e1; line-height: 1.6;">${escapeDISCResult(analisa.analisaPola)}</div>` : ''}
        ${rolesBlock}
      </div>`;
  }

  /* ============================================================
     MODAL
     ============================================================ */
  async function openDISCModal(slug, name, position) {
    const old = document.getElementById('discModal'); if (old) old.remove();
    const data = await fetchDISCData(slug);

    const overlay = document.createElement('div');
    overlay.id = 'discModal';
    overlay.setAttribute('data-slug', slug);
    overlay.setAttribute('data-name', name);
    overlay.setAttribute('data-position', position || '');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

    /* -------- EMPTY STATE -------- */
    if (!data) {
      overlay.innerHTML = `
        <div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(217,70,239,.4);border-radius:18px;padding:32px;text-align:center;color:#e2e8f0;box-shadow:0 30px 90px rgba(0,0,0,.65);">
          <div style="font-size:52px;margin-bottom:12px;">📭</div>
          <div style="font-size:16px;font-weight:900;color:#fff;margin-bottom:8px;">Belum Ada Data DISC</div>
          <div style="font-size:13px;color:#94a3b8;line-height:1.65;margin-bottom:22px;">
            Kandidat <b style="color:#e9d5ff;">${escHtml(name)}</b> belum menyelesaikan tes DISC atau datanya belum tersinkron.
          </div>
          <button id="discCloseEmpty" style="width:100%;padding:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Tutup</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#discCloseEmpty').onclick = () => overlay.remove();
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      return;
    }

    const hasil = computeDISCResults(data.answers);
    if (!hasil) {
      overlay.innerHTML = `
        <div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(239,68,68,.4);border-radius:18px;padding:32px;text-align:center;color:#e2e8f0;">
          <div style="font-size:52px;margin-bottom:12px;">⚠️</div>
          <div style="font-size:16px;font-weight:900;color:#fff;margin-bottom:8px;">Gagal Hitung Hasil</div>
          <div style="font-size:13px;color:#94a3b8;line-height:1.65;margin-bottom:22px;">DISC_DATA belum tersedia di halaman admin.</div>
          <button id="discCloseErr" style="width:100%;padding:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Tutup</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#discCloseErr').onclick = () => overlay.remove();
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      return;
    }

    const validity  = checkValidity(hasil);
    const finalName = name || data.candidateName || 'Kandidat';
    const finalPos  = position || data.candidatePosition || '-';

    /* -------- INVALID STATE -------- */
    if (!validity.isValid) {
      overlay.innerHTML = `
        <div style="width:min(520px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(239,68,68,.5);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;">
          <div style="padding:16px 20px;background:linear-gradient(135deg,#991b1b,#dc2626);display:flex;align-items:center;gap:14px;">
            <div style="width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:11px;font-size:20px;">⚠️</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">HASIL TES DISC</div>
              <div style="font-size:16px;font-weight:900;color:#fff;margin-top:2px;">${escHtml(finalName)}</div>
              <div style="font-size:11px;opacity:.85;margin-top:2px;">💼 ${escHtml(finalPos)}</div>
            </div>
            <button id="discCloseInvalid" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>
          </div>
          <div style="padding:22px;">
            <div style="padding:16px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.4);border-radius:11px;margin-bottom:16px;">
              <div style="font-size:13px;font-weight:900;color:#fca5a5;margin-bottom:6px;">HASIL INVALID</div>
              <div style="font-size:11.5px;color:#cbd5e1;line-height:1.65;">
                Terdeteksi ${validity.totalStar} jawaban bertanda "*" (Most: ${validity.starMost}, Least: ${validity.starLeast}). Ambang batas = ${DISC_INVALID_THRESHOLD}. Pola jawaban tidak wajar — hasil tidak dapat dianalisis.
              </div>
            </div>
            <div style="font-size:11.5px;color:#94a3b8;line-height:1.65;">
              ${escapeDISCResult('Kandidat disarankan mengulang tes.')}
            </div>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#discCloseInvalid').onclick = () => overlay.remove();
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      return;
    }

    /* -------- DATA STATE -------- */
    const analisa = computeAnalisaWithNickname(hasil, finalName);
    const rolesMost   = pickRolesFromDominan(analisa?.most?.dominan   || []);
    const rolesLeast  = pickRolesFromDominan(analisa?.least?.dominan  || []);
    const rolesChange = pickRolesFromDominan(analisa?.change?.dominan || []);
    const posFit      = computePositionFit(analisa?.most, finalPos);

    overlay.innerHTML = `
      <div style="width:min(980px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(217,70,239,.4);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;">

        <div style="padding:16px 20px;background:linear-gradient(135deg,#d946ef,#8b5cf6);display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <div style="width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:11px;font-size:20px;">🎯</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">HASIL TES DISC · 3 GRAFIK</div>
            <div style="font-size:16px;font-weight:900;color:#fff;margin-top:2px;word-break:break-word;">${escHtml(finalName)}</div>
            <div style="font-size:11px;opacity:.85;margin-top:2px;">💼 ${escHtml(finalPos)}</div>
          </div>
          <button id="discCloseBtn" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>
        </div>

        <div style="flex:1;overflow-y:auto;padding:16px 20px 20px;">

          <div style="margin-bottom:14px;">
            ${renderStatsTableHTML(hasil)}
          </div>

                    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;align-items:flex-start;margin-bottom:16px;">
            ${renderChartBlockHTML('discModalMost',   'MOST (P)',   '#2176C7', 'Perilaku alami saat nyaman')}
            ${renderChartBlockHTML('discModalLeast',  'LEAST (K)',  '#DE9000', 'Respons di bawah tekanan')}
            ${renderChartBlockHTML('discModalChange', 'CHANGE (P-K)', '#18B172', 'Adaptasi diri')}
          </div>

          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
            ${renderInterpretationBlockHTML(analisa?.most,   'ANALISIS MOST (P) — Perilaku Alami', { bg:'rgba(33,118,199,.08)',  br:'rgba(33,118,199,.35)',  tx:'#93c5fd' }, rolesMost)}
            ${renderInterpretationBlockHTML(analisa?.least,  'ANALISIS LEAST (K) — Di Bawah Tekanan', { bg:'rgba(222,144,0,.08)',  br:'rgba(222,144,0,.35)',  tx:'#fcd34d' }, rolesLeast)}
            ${renderInterpretationBlockHTML(analisa?.change, 'ANALISIS CHANGE (P-K) — Adaptasi',     { bg:'rgba(24,177,114,.08)', br:'rgba(24,177,114,.35)', tx:'#6ee7b7' }, rolesChange)}
          </div>

          ${posFit ? `
            <div style="margin-top:10px;padding:16px;background:linear-gradient(135deg, rgba(217,70,239,.12), rgba(139,92,246,.08));border:1px solid rgba(217,70,239,.4);border-radius:12px;">
              <div style="font-size: 11px; font-weight: 900; letter-spacing: 1px; color: #e9d5ff; margin-bottom: 10px;">🎯 ANALISIS UNTUK POSISI: ${escHtml(finalPos)}</div>
              <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(0,0,0,.25); border-radius: 10px; margin-bottom: 10px;">
                <div style="font-size: 22px; font-weight: 900; color: #fff; padding: 8px 16px; border-radius: 10px; background: ${posFit.color.bg}; border: 1px solid ${posFit.color.br}; color: ${posFit.color.tx};">${posFit.simbol}</div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size: 13px; font-weight: 900; color: ${posFit.color.tx}; letter-spacing: .5px;">${posFit.label}</div>
                  <div style="font-size: 10.5px; color: #94a3b8; margin-top: 3px;">Dari dominan Most: <b style="color: #cbd5e1; font-family: 'Courier New', monospace;">${posFit.dominan.join('·')}</b></div>
                </div>
              </div>
              ${typeof getCompatibilityReason === 'function' ? `<div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.65;">${escapeDISCResult(getCompatibilityReason(posFit.simbol, (analisa?.most?.dominan?.[0] || ''), finalPos))}</div>` : ''}
            </div>
          ` : ''}

        </div>

        <div style="padding:12px 20px;background:rgba(0,0,0,.32);border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="color:#94a3b8;font-size:10.5px;font-weight:600;">ℹ️ Data dari Firebase (sgs_scores) · Total bintang: ${validity.totalStar}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="js-disc-pdf" style="padding:8px 16px;background:linear-gradient(135deg,#10b981,#059669);border:0;border-radius:9px;color:#fff;font-family:inherit;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,.35);">📄 Download PDF</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    overlay.querySelector('#discCloseBtn').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    /* Draw charts setelah DOM siap */
    requestAnimationFrame(() => drawChartsToModal(hasil, 'discModal'));
  }

  /* ============================================================
     PDF RINGKAS
     ============================================================ */
  async function generateDISCPDF(name, position, data) {
    if (typeof window.loadPdfLibs === 'function') await window.loadPdfLibs();
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF tidak tersedia');

    const hasil = computeDISCResults(data.answers);
    if (!hasil) throw new Error('DISC_DATA tidak tersedia');

    const validity = checkValidity(hasil);

    /* Draw ke canvas hidden dari index.html, lalu capture */
    if (typeof drawDISCClassic === 'function') {
      drawDISCClassic('discMost',   'most',   hasil.most.D,   hasil.most.I,   hasil.most.S,   hasil.most.C,   '#2176C7');
      drawDISCClassic('discLeast',  'least',  hasil.least.D,  hasil.least.I,  hasil.least.S,  hasil.least.C,  '#DE9000');
      drawDISCClassic('discChange', 'change', hasil.change.D, hasil.change.I, hasil.change.S, hasil.change.C, '#18B172');
    }
    const imgMost   = document.getElementById('discMost')?.toDataURL('image/png')   || null;
    const imgLeast  = document.getElementById('discLeast')?.toDataURL('image/png')  || null;
    const imgChange = document.getElementById('discChange')?.toDataURL('image/png') || null;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 15, CW = PW - 2 * M;
    let y = M;

    /* Header */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(139, 44, 175);
    doc.text('HASIL TES DISC', PW / 2, y, { align: 'center' });
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
      ['Total *', String(validity.totalStar) + ' (ambang ' + DISC_INVALID_THRESHOLD + ')']
    ].forEach(([k, v]) => {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.setFontSize(10);
      doc.text(k + ' :', M, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(v), M + 30, y);
      y += 5.5;
    });
    y += 3;

    /* Invalid handling */
    if (!validity.isValid) {
      doc.setFillColor(254, 226, 226); doc.setDrawColor(220, 38, 38);
      doc.rect(M, y, CW, 20, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(153, 27, 27);
      doc.text('HASIL INVALID', M + 4, y + 8);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 53, 15);
      doc.text('Pola jawaban tidak wajar. Kandidat disarankan mengulang tes.', M + 4, y + 15);
      doc.save('Hasil-DISC-' + String(name || 'Kandidat').replace(/[^a-zA-Z0-9]/g, '-') + '.pdf');
      return doc;
    }

    /* Tabel nilai */
    doc.setFillColor(217, 70, 239); doc.rect(M, y, CW, 7, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('LINE', M + 3, y + 5);
    doc.text('D', M + 40, y + 5, { align: 'center' });
    doc.text('I', M + 65, y + 5, { align: 'center' });
    doc.text('S', M + 90, y + 5, { align: 'center' });
    doc.text('C', M + 115, y + 5, { align: 'center' });
    doc.text('*', M + 140, y + 5, { align: 'center' });
    y += 7;

    const rows = [
      { label: 'Most (P)', data: hasil.most,   sign: false },
      { label: 'Least (K)', data: hasil.least, sign: false },
      { label: 'Change',   data: hasil.change, sign: true }
    ];
    rows.forEach((r, i) => {
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(M, y, CW, 7, 'F'); }
      doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.setFontSize(9);
      doc.text(r.label, M + 3, y + 5);
      doc.setFont('helvetica', 'normal');
      ['D','I','S','C','*'].forEach((k, idx) => {
        const v = r.data[k] || 0;
        const disp = r.sign ? (v >= 0 ? '+' + v : String(v)) : String(v);
        doc.text(disp, M + 40 + idx * 25, y + 5, { align: 'center' });
      });
      y += 7;
    });
    y += 6;

    /* 3 Charts */
    if (y > PH - 100) { doc.addPage(); y = M; }
    const chartW = 45, chartH = 95, gap = 6;
    const totalW = chartW * 3 + gap * 2;
    const xStart = (PW - totalW) / 2;

    if (imgMost)   doc.addImage(imgMost,   'PNG', xStart, y, chartW, chartH);
    if (imgLeast)  doc.addImage(imgLeast,  'PNG', xStart + chartW + gap, y, chartW, chartH);
    if (imgChange) doc.addImage(imgChange, 'PNG', xStart + (chartW + gap) * 2, y, chartW, chartH);

    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 118, 199);
    doc.text('Most (P)', xStart + chartW / 2, y + chartH + 5, { align: 'center' });
    doc.setTextColor(222, 144, 0);
    doc.text('Least (K)', xStart + chartW + gap + chartW / 2, y + chartH + 5, { align: 'center' });
    doc.setTextColor(24, 177, 114);
    doc.text('Change (P-K)', xStart + (chartW + gap) * 2 + chartW / 2, y + chartH + 5, { align: 'center' });

    y += chartH + 14;

    /* Interpretasi singkat */
    const analisa = computeAnalisaWithNickname(hasil, name);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
    if (analisa) {
      ['most', 'least', 'change'].forEach(k => {
        const a = analisa[k];
        if (!a) return;
        if (y > PH - 30) { doc.addPage(); y = M; }
        const titles = { most: 'MOST (P) — Perilaku Alami', least: 'LEAST (K) — Di Bawah Tekanan', change: 'CHANGE (P-K) — Adaptasi' };
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(139, 44, 175);
        doc.text(titles[k], M, y); y += 5;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
        doc.text('Dominan: ' + (a.dominan || []).join(' & ') + '  ·  Urutan: ' + (a.ranking || '-'), M, y); y += 5;
        const desc = String(a.deskripsi || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '');
        doc.splitTextToSize(desc, CW).forEach(l => {
          if (y > PH - 20) { doc.addPage(); y = M; }
          doc.text(l, M, y); y += 4.5;
        });
        y += 3;
      });
    }

    /* Kesimpulan posisi */
    const posFit = computePositionFit(analisa?.most, position);
    if (posFit) {
      if (y > PH - 30) { doc.addPage(); y = M; }
      y += 4;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(139, 44, 175);
      doc.text('KESIMPULAN UNTUK POSISI: ' + position, M, y); y += 5;
      doc.setFontSize(11);
      doc.text(posFit.simbol + ' — ' + posFit.label, M, y); y += 5;
      if (typeof getCompatibilityReason === 'function') {
        const reason = String(getCompatibilityReason(posFit.simbol, (analisa?.most?.dominan?.[0] || ''), position) || '').replace(/<[^>]+>/g, '');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
        doc.splitTextToSize(reason, CW).forEach(l => {
          if (y > PH - 20) { doc.addPage(); y = M; }
          doc.text(l, M, y); y += 4.5;
        });
      }
    }

    /* Footer */
    if (y > PH - 15) { doc.addPage(); y = M; }
    y += 6;
    doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 5;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
    doc.text('Dibuat: ' + new Date().toLocaleString('id-ID'), M, y);
    doc.text('Halaman ' + doc.internal.getNumberOfPages(), PW - M, y, { align: 'right' });

    return doc;
  }

  async function downloadDISCPDF(slug, name, position) {
    const data = await fetchDISCData(slug);
    if (!data) throw new Error('Data DISC tidak tersedia');
    const doc = await generateDISCPDF(name, position, data);
    const safeName = String(name || 'Kandidat').replace(/[^a-zA-Z0-9]/g, '-');
    doc.save('Hasil-DISC-' + safeName + '.pdf');
  }

  /* ============================================================
     EVENT DELEGATION
     ============================================================ */
  if (!window.__discDelegationAttached) {
    window.__discDelegationAttached = true;
    document.addEventListener('click', async function (e) {
      const openBtn = e.target.closest('.js-disc-open');
      if (openBtn) {
        e.preventDefault(); e.stopPropagation();
        if (openBtn.disabled) return;
        const slug     = openBtn.getAttribute('data-slug');
        const name     = openBtn.getAttribute('data-name');
        const position = openBtn.getAttribute('data-position');
        if (slug) openDISCModal(slug, name, position);
        return;
      }

      const pdfBtn = e.target.closest('.js-disc-pdf');
      if (pdfBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = pdfBtn.closest('#discModal');
        const slug     = modal ? modal.getAttribute('data-slug')     : pdfBtn.getAttribute('data-slug');
        const name     = modal ? modal.getAttribute('data-name')     : pdfBtn.getAttribute('data-name');
        const position = modal ? modal.getAttribute('data-position') : pdfBtn.getAttribute('data-position');
        if (!slug) return;
        const prev = pdfBtn.innerHTML;
        pdfBtn.innerHTML = '⏳ PDF...'; pdfBtn.disabled = true;
        try {
          await downloadDISCPDF(slug, name, position);
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
  window.openDISCModal          = openDISCModal;
  window.downloadDISCPDF        = downloadDISCPDF;
  window.renderDISCSectionHTML  = renderDISCSectionHTML;
  window.__fetchDISCData        = fetchDISCData;

  console.log('[DISC-ADMIN] ✓ Loaded v1 — section + modal + PDF');
})();