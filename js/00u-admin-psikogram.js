/* ============================================================
   js/00u-admin-psikogram.js — v4 (Editable Bobot Per Aspek)
   ------------------------------------------------------------
   - Tombol 📊 buka modal psikogram
   - Auto-compute per aspek dari data tes kandidat
   - ⚙️ Edit bobot proporsi tiap aspek (IST/Wawancara/FGD/dll)
   - ✎ Edit skor final (override)
   - Bobot custom per kandidat di Firebase: sgs_psikogram_weights/{slug}
   - 📄 Download PDF
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     DEFAULT BOBOT
     ============================================================ */
  const GRAFIS_CAT = {
    cognitive:   'KEMAMPUAN BERPIKIR & PROBLEM SOLVING',
    empathy:     'EMPATHY, INTERPERSONAL SKILL & TEAMWORK',
    emotional:   'STABILITAS EMOSI & KONTROL IMPULS',
    motivation:  'MOTIVATION & ACHIEVEMENT DRIVE',
    flexibility: 'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY',
    integrity:   'INTEGRITY & RULE COMPLIANCE',
    creativity:  'TEACHING CREATIVITY'
  };

  const DEFAULT_ASPECTS = [
    { id: 'cognitive_ability', label: 'Cognitive Ability & Problem Solving',
      weights: { IST: 40, Wawancara: 30, FGD: 20, Grafis: 10 },
      ist: ['AN','RA','ZR','FA','WU'], papi: [], bigfive: [], grafisCat: GRAFIS_CAT.cognitive },

    { id: 'verbal_communication', label: 'Verbal Communication & Material Explanation',
      weights: { IST: 25, BigFive: 15, Wawancara: 35, FGD: 25 },
      ist: ['WA','GE','AN'], papi: [], bigfive: ['E','A'] },

    { id: 'classroom_management', label: 'Classroom Management & Instructional Leadership',
      weights: { IST: 5, PAPI: 20, BigFive: 10, Wawancara: 35, FGD: 30 },
      ist: ['SE','GE','AN','WA'], papi: ['L','P','I'], bigfive: ['C','N_rev'] },

    { id: 'empathy_interpersonal', label: 'Empathy & Interpersonal Skills',
      weights: { IST: 5, PAPI: 10, BigFive: 30, Wawancara: 30, Grafis: 5, FGD: 20 },
      ist: ['WA'], papi: ['O','S','B','X'], bigfive: ['A','E'], grafisCat: GRAFIS_CAT.empathy },

    { id: 'emotional_stability', label: 'Emotional Stability & Impulse Control',
      weights: { PAPI: 20, BigFive: 35, Grafis: 30, Wawancara: 15 },
      ist: [], papi: ['E','K'], bigfive: ['N_rev'], grafisCat: GRAFIS_CAT.emotional },

    { id: 'motivation_drive', label: 'Motivation & Achievement Drive',
      weights: { PAPI: 40, Wawancara: 30, BigFive: 20, Grafis: 10 },
      ist: [], papi: ['A','N','G','T','V'], bigfive: ['C'], grafisCat: GRAFIS_CAT.motivation },

    { id: 'work_discipline', label: 'Work Discipline & Reliability',
      weights: { PAPI: 35, BigFive: 45, Wawancara: 20 },
      ist: [], papi: ['G','W','F','C'], bigfive: ['C'] },

    { id: 'flexibility_adaptability', label: 'Flexibility, Adaptability & Learning Agility',
      weights: { IST: 5, PAPI: 20, BigFive: 25, Grafis: 10, FGD: 15, Wawancara: 25 },
      ist: ['AN'], papi: ['Z','V'], bigfive: ['O','N_rev'], grafisCat: GRAFIS_CAT.flexibility },

    { id: 'integrity_compliance', label: 'Integrity & Rule Compliance',
      weights: { PAPI: 40, Grafis: 20, Wawancara: 40 },
      ist: [], papi: ['W','F','C','G'], bigfive: [], grafisCat: GRAFIS_CAT.integrity },

    { id: 'teaching_creativity', label: 'Teaching Creativity',
      weights: { IST: 10, BigFive: 35, Wawancara: 35, Grafis: 20 },
      ist: ['FA','WU','AN'], papi: [], bigfive: ['O'], grafisCat: GRAFIS_CAT.creativity },

    { id: 'teaching_practice', label: 'Teaching Practice Skills',
      weights: { Wawancara: 40, SubjectTest: 60 },
      ist: [], papi: [], bigfive: [], subjectTest: true }
  ];

  const PAPI_CONFIG = {
    A:{inv:false}, N:{inv:false}, G:{inv:false}, T:{inv:false}, V:{inv:false},
    W:{inv:false}, F:{inv:false}, C:{inv:false}, L:{inv:false}, P:{inv:false},
    I:{inv:false}, E:{inv:false}, K:{inv:true},  O:{inv:false}, S:{inv:false},
    B:{inv:false}, X:{inv:false}, Z:{inv:false}, D:{inv:false}, R:{inv:false}
  };

  /* ============================================================
     NORMALIZERS
     ============================================================ */
  function clamp04(v){ return Math.max(0, Math.min(4, v)); }
  function normIST(sw){ return typeof sw==='number' ? clamp04((sw - 75) / 12.5) : null; }
  function normWawancara(s){ return typeof s==='number' ? clamp04(s - 1) : null; }
  function normFGD(s){ return typeof s==='number' ? clamp04(s) : null; }
  function normGrafis(s){ return typeof s==='number' ? clamp04(s) : null; }
  function normPAPI(s, inv){ if(typeof s!=='number')return null; return clamp04(((inv?9-s:s)/9)*4); }
  function normBigFive(s, inv){ if(typeof s!=='number')return null; return clamp04(((inv?100-s:s)/100)*4); }
  function normSubject(s){ if(typeof s!=='number'||s<=0)return null; return clamp04(s); }

  /* ============================================================
     HELPERS
     ============================================================ */
  function detectCategory(p) {
    if (!p) return null;
    return /guru|dosen|teacher|pengajar|kindergarten|primary|math|biology|english/i.test(String(p)) ? 'guru' : null;
  }
  function scoreToKet(s) {
    const v = Number(s) || 0;
    if (v >= 3.5) return { label: 'BAIK',          color: '#86efac', bg: 'rgba(34,197,94,.15)',  border: 'rgba(34,197,94,.45)',  pdfColor: [22, 101, 52] };
    if (v >= 2.5) return { label: 'CUKUP',         color: '#fcd34d', bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.45)', pdfColor: [161, 98, 7]  };
    if (v >= 1.5) return { label: 'KURANG',        color: '#fca5a5', bg: 'rgba(239,68,68,.15)',  border: 'rgba(239,68,68,.45)',  pdfColor: [185, 28, 28] };
    return         { label: 'SANGAT KURANG', color: '#fca5a5', bg: 'rgba(239,68,68,.22)',  border: 'rgba(239,68,68,.55)',  pdfColor: [153, 27, 27] };
  }
  function barGradient(p) {
    if (p >= 87.5) return 'linear-gradient(90deg,#16a34a,#22c55e)';
    if (p >= 75)   return 'linear-gradient(90deg,#f59e0b,#fbbf24)';
    if (p >= 50)   return 'linear-gradient(90deg,#ea580c,#f97316)';
    return                  'linear-gradient(90deg,#dc2626,#ef4444)';
  }
  function escHtml(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function fbReady(){ return typeof firebase!=='undefined' && firebase.apps && firebase.apps.length>0; }

  /* ============================================================
     FETCH RAW
     ============================================================ */
  async function fetchRawData(slug) {
    const raw = { IST:{}, PAPI:{}, BigFive:{}, Grafis:{}, Wawancara:null, FGD:null, Subject:null,
      _sources: { IST:false, PAPI:false, BigFive:false, Wawancara:false, FGD:false, Grafis:false, Subject:false } };
    if (!fbReady()) return raw;

    try {
      const snap = await firebase.database().ref('sgs_psikogram_raw/' + slug).once('value');
      const d = snap.val() || {};
      if (d.IST && Object.keys(d.IST).length)      { raw.IST = d.IST;      raw._sources.IST = true; }
      if (d.PAPI && Object.keys(d.PAPI).length)    { raw.PAPI = d.PAPI;    raw._sources.PAPI = true; }
      if (d.BigFive && Object.keys(d.BigFive).length) { raw.BigFive = d.BigFive; raw._sources.BigFive = true; }
      if (d.Subject && typeof d.Subject === 'number' && d.Subject > 0) { raw.Subject = d.Subject; raw._sources.Subject = true; }
    } catch (e) {}

    try {
      const snap = await firebase.database().ref('sgs_interviews/' + slug).once('value');
      const d = snap.val() || {};
      const avgs = Object.values(d).map(x => x && Number(x.average)).filter(v => !isNaN(v) && v > 0);
      if (avgs.length) { raw.Wawancara = avgs.reduce((a,b)=>a+b,0)/avgs.length; raw._sources.Wawancara = true; }
    } catch (e) {}

    try {
      const snap = await firebase.database().ref('sgs_fgd/' + slug).once('value');
      const d = snap.val() || {};
      const avgs = Object.values(d).map(x => x && Number(x.average)).filter(v => !isNaN(v) && v > 0);
      if (avgs.length) { raw.FGD = avgs.reduce((a,b)=>a+b,0)/avgs.length; raw._sources.FGD = true; }
    } catch (e) {}

    try {
      const snap = await firebase.database().ref('sgs_grafis_interp/' + slug).once('value');
      const d = snap.val() || {};
      for (const assessor of Object.keys(d)) {
        const a = d[assessor];
        if (a && a.autoScoring && Array.isArray(a.autoScoring.perKategori)) {
          a.autoScoring.perKategori.forEach(pk => { raw.Grafis[pk.kategori] = pk.skor; });
        }
      }
      if (Object.keys(raw.Grafis).length) raw._sources.Grafis = true;
    } catch (e) {}

    if (!raw.Subject) {
      try {
        const snap = await firebase.database().ref('sgs_subject_ratings/' + slug + '/rating').once('value');
        const r = Number(snap.val());
        if (r > 0) { raw.Subject = r; raw._sources.Subject = true; }
      } catch (e) {}
    }
    return raw;
  }

  /* ============================================================
     FIREBASE: WEIGHTS + OVERRIDES
     ============================================================ */
  async function loadWeights(slug) {
    if (!fbReady()) return {};
    try {
      const snap = await firebase.database().ref('sgs_psikogram_weights/' + slug).once('value');
      return snap.val() || {};
    } catch (e) { return {}; }
  }
  async function saveWeights(slug, weights) {
    if (!fbReady()) throw new Error('Firebase belum siap');
    await firebase.database().ref('sgs_psikogram_weights/' + slug).update({
      weights, updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
  }
  async function loadOverrides(slug) {
    if (!fbReady()) return {};
    try {
      const snap = await firebase.database().ref('sgs_psikogram/' + slug + '/overrides').once('value');
      return snap.val() || {};
    } catch (e) { return {}; }
  }
  async function saveOverrides(slug, overrides) {
    if (!fbReady()) throw new Error('Firebase belum siap');
    await firebase.database().ref('sgs_psikogram/' + slug).update({
      category: 'guru', overrides, updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
  }
  async function saveRaw(slug, raw) {
    if (!fbReady()) throw new Error('Firebase belum siap');
    await firebase.database().ref('sgs_psikogram_raw/' + slug).update({
      IST: raw.IST || {}, PAPI: raw.PAPI || {}, BigFive: raw.BigFive || {},
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
  }

  /* ============================================================
     GET EFFECTIVE WEIGHTS (custom || default)
     ============================================================ */
  function getEffectiveWeights(aspect, customWeights) {
    const w = customWeights && customWeights[aspect.id];
    if (w && typeof w === 'object') return w;
    return aspect.weights || {};
  }

  /* ============================================================
     COMPUTE ASPECT (dengan effective weights)
     ============================================================ */
  function computeAspect(aspect, raw, effectiveWeights) {
    const parts = [];
    const W = effectiveWeights || {};

    if (aspect.ist && aspect.ist.length && raw._sources.IST && W.IST) {
      const vals = aspect.ist.map(c => normIST(raw.IST[c])).filter(v => v !== null);
      if (vals.length) parts.push({ src:'IST', val: vals.reduce((a,b)=>a+b,0)/vals.length, w: W.IST });
    }
    if (aspect.papi && aspect.papi.length && raw._sources.PAPI && W.PAPI) {
      const vals = aspect.papi.map(c => normPAPI(raw.PAPI[c], (PAPI_CONFIG[c]||{}).inv)).filter(v => v !== null);
      if (vals.length) parts.push({ src:'PAPI', val: vals.reduce((a,b)=>a+b,0)/vals.length, w: W.PAPI });
    }
    if (aspect.bigfive && aspect.bigfive.length && raw._sources.BigFive && W.BigFive) {
      const vals = aspect.bigfive.map(c => {
        const inv = /_rev$/i.test(c);
        return normBigFive(raw.BigFive[c.replace(/_rev$/i,'')], inv);
      }).filter(v => v !== null);
      if (vals.length) parts.push({ src:'BigFive', val: vals.reduce((a,b)=>a+b,0)/vals.length, w: W.BigFive });
    }
    if (raw._sources.Wawancara && W.Wawancara) {
      const v = normWawancara(raw.Wawancara);
      if (v !== null) parts.push({ src:'Wawancara', val: v, w: W.Wawancara });
    }
    if (raw._sources.FGD && W.FGD) {
      const v = normFGD(raw.FGD);
      if (v !== null) parts.push({ src:'FGD', val: v, w: W.FGD });
    }
    if (aspect.grafisCat && raw._sources.Grafis && raw.Grafis[aspect.grafisCat] !== undefined && W.Grafis) {
      const v = normGrafis(raw.Grafis[aspect.grafisCat]);
      if (v !== null) parts.push({ src:'Grafis', val: v, w: W.Grafis });
    }
    if (aspect.subjectTest && raw._sources.Subject && W.SubjectTest) {
      const v = normSubject(raw.Subject);
      if (v !== null) parts.push({ src:'SubjectTest', val: v, w: W.SubjectTest });
    }

    const totalW = parts.reduce((a,p)=>a+p.w, 0);
    if (totalW === 0) return { score: null, parts };
    return { score: parts.reduce((a,p)=>a+p.val*p.w, 0) / totalW, parts, totalW };
  }

  function computeAll(raw, overrides, customWeights) {
    overrides = overrides || {};
    customWeights = customWeights || {};
    return DEFAULT_ASPECTS.map(a => {
      const effW = getEffectiveWeights(a, customWeights);
      const c = computeAspect(a, raw, effW);
      const autoScore = c.score !== null ? Math.round(c.score * 100) / 100 : null;
      const override = overrides[a.id] !== undefined && overrides[a.id] !== null ? Number(overrides[a.id]) : null;
      const finalScore = override !== null ? override : autoScore;
      return { aspect: a, parts: c.parts, totalW: c.totalW, autoScore, override, finalScore, effectiveWeights: effW, isCustomWeight: !!customWeights[a.id] };
    });
  }

  /* ============================================================
     RENDER TABLE
     ============================================================ */
  function renderTable(computed) {
    return computed.map((item, idx) => {
      const { aspect, parts, finalScore, override, effectiveWeights, isCustomWeight } = item;
      const score = finalScore !== null ? finalScore : 0;
      const pct = Math.round((score/4)*1000)/10;
      const ket = scoreToKet(score);
      const isOverridden = override !== null;

      // Badge bobot aktif
      const wBadge = Object.entries(effectiveWeights || {})
        .filter(([k,v]) => v > 0)
        .map(([k,v]) => `${k}=${v}%`)
        .join(' · ');

      const partsHTML = parts.length
        ? parts.map(p => `
            <div style="display:flex;justify-content:space-between;font-size:9.5px;color:#94a3b8;padding:2px 0;">
              <span>• ${escHtml(p.src)}${p.w?' (w='+p.w+')':''}</span>
              <span style="font-family:monospace;color:#cbd5e1;">${p.val.toFixed(2)} → ${Math.round(p.val/4*100)}%</span>
            </div>`).join('')
        : '<div style="font-size:9.5px;color:#fca5a5;padding:2px 0;">⚠️ Tidak ada data</div>';

      return `
        <div class="psiko-row" data-aspect-id="${aspect.id}" data-auto="${item.autoScore!==null?item.autoScore.toFixed(2):''}" style="
          display:grid;grid-template-columns:30px minmax(0,1fr) 62px 78px 62px 70px;gap:10px;align-items:center;
          padding:10px 14px;background:rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.05);">
          <div style="font-size:10px;font-weight:800;color:#64748b;text-align:center;">${String(idx+1).padStart(2,'0')}</div>
          <div style="min-width:0;">
            <div style="font-size:11.5px;font-weight:700;color:#e2e8f0;line-height:1.35;margin-bottom:5px;">
              ${escHtml(aspect.label)}
              ${isOverridden ? '<span style="margin-left:6px;font-size:9px;color:#fbbf24;">✎ manual</span>' : ''}
              ${isCustomWeight ? '<span style="margin-left:6px;font-size:9px;color:#a78bfa;">⚙️ custom</span>' : ''}
            </div>
            <div style="height:5px;background:rgba(255,255,255,.07);border-radius:999px;overflow:hidden;margin-bottom:6px;">
              <div class="psiko-bar" style="width:${pct}%;height:100%;background:${barGradient(pct)};border-radius:inherit;"></div>
            </div>
            <details style="cursor:pointer;">
              <summary style="font-size:9px;color:#64748b;font-weight:700;outline:none;">▸ breakdown · bobot: ${escHtml(wBadge||'-')}</summary>
              <div style="margin-top:4px;padding:6px 8px;background:rgba(0,0,0,.22);border-radius:6px;">${partsHTML}</div>
            </details>
          </div>
          <div class="psiko-pct" style="font-size:13px;font-weight:800;color:#a5b4fc;text-align:right;font-variant-numeric:tabular-nums;">${pct.toFixed(1)}%</div>
          <div class="psiko-score" style="font-size:11.5px;font-weight:800;color:#e2e8f0;text-align:center;font-variant-numeric:tabular-nums;">${score.toFixed(2)} / 4</div>
          <div style="text-align:center;">
            <span class="psiko-ket" style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:9px;font-weight:900;background:${ket.bg};border:1px solid ${ket.border};color:${ket.color};white-space:nowrap;">${ket.label}</span>
          </div>
          <div style="display:flex;gap:4px;justify-content:center;">
            <button class="psiko-weight-btn" data-aspect-id="${aspect.id}" title="Edit bobot" style="
              width:30px;height:30px;display:grid;place-items:center;
              background:rgba(167,139,250,.18);border:1px solid rgba(167,139,250,.45);
              border-radius:7px;color:#c4b5fd;font-size:13px;cursor:pointer;font-family:inherit;padding:0;">⚙️</button>
            <button class="psiko-edit-btn" data-aspect-id="${aspect.id}" title="Edit skor" style="
              width:30px;height:30px;display:grid;place-items:center;
              background:rgba(99,102,241,.18);border:1px solid rgba(99,102,241,.45);
              border-radius:7px;color:#a5b4fc;font-size:13px;cursor:pointer;font-family:inherit;padding:0;">✎</button>
          </div>
        </div>`;
    }).join('');
  }

  /* ============================================================
     OPEN MODAL PSIKOGRAM
     ============================================================ */
  async function openPsikogramModal(slug, candidateName, position) {
    const old = document.getElementById('psikoModal'); if (old) old.remove();

    const [raw, overrides, customWeights] = await Promise.all([
      fetchRawData(slug), loadOverrides(slug), loadWeights(slug)
    ]);
    const computed = computeAll(raw, overrides, customWeights);

    const valid = computed.map(c => c.finalScore).filter(s => s !== null);
    const avg = valid.length ? valid.reduce((a,b)=>a+b,0)/valid.length : 0;
    const avgPct = (avg/4)*100;
    const avgKet = scoreToKet(avg);

    const srcChips = [
      ['IST', raw._sources.IST], ['PAPI', raw._sources.PAPI], ['BigFive', raw._sources.BigFive],
      ['Wawancara', raw._sources.Wawancara], ['FGD', raw._sources.FGD],
      ['Grafis', raw._sources.Grafis], ['Subject', raw._sources.Subject]
    ].map(([n, ok]) => `
      <span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:800;
        background:${ok?'rgba(34,197,94,.15)':'rgba(148,163,184,.1)'};
        border:1px solid ${ok?'rgba(34,197,94,.4)':'rgba(148,163,184,.25)'};
        color:${ok?'#86efac':'#94a3b8'};white-space:nowrap;">
        ${ok?'✓':'×'} ${n}
      </span>`).join('');

    const ov = document.createElement('div');
    ov.id = 'psikoModal';
    ov.setAttribute('data-slug', slug);
    ov.setAttribute('data-name', candidateName);
    ov.setAttribute('data-position', position || '');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

    ov.innerHTML = `
      <div style="width:min(920px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;
        background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.4);
        border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;">

        <div style="padding:16px 20px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <div style="width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:11px;font-size:20px;">📊</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">PSIKOGRAM · POSISI GURU/DOSEN</div>
            <div style="font-size:16px;font-weight:900;color:#fff;margin-top:2px;word-break:break-word;">${escHtml(candidateName)}</div>
            <div style="font-size:11px;opacity:.85;margin-top:2px;">💼 ${escHtml(position||'-')}</div>
          </div>
          <button id="psikoCloseBtn" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>
        </div>

        <div style="padding:12px 20px;background:rgba(0,0,0,.28);border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:9px;font-weight:800;color:#64748b;letter-spacing:1px;">SUMBER:</span>
            ${srcChips}
          </div>
          <div class="psiko-avg-chip" style="padding:6px 12px;background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.4);border-radius:999px;font-size:11px;font-weight:800;color:#a5b4fc;display:flex;align-items:center;gap:8px;">
            <span>Rata-rata: <b style="color:#fff;">${avg.toFixed(2)}/4</b> · ${avgPct.toFixed(1)}%</span>
            <span style="padding:2px 8px;background:${avgKet.bg};border:1px solid ${avgKet.border};color:${avgKet.color};border-radius:999px;font-size:9.5px;font-weight:900;">${avgKet.label}</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:30px minmax(0,1fr) 62px 78px 62px 70px;gap:10px;
          padding:8px 14px;background:rgba(0,0,0,.32);border-bottom:1px solid rgba(255,255,255,.05);
          font-size:9.5px;font-weight:900;letter-spacing:.8px;color:#64748b;">
          <div style="text-align:center;">#</div>
          <div>ASPEK</div>
          <div style="text-align:right;">%</div>
          <div style="text-align:center;">SKOR</div>
          <div style="text-align:center;">KET</div>
          <div style="text-align:center;">AKSI</div>
        </div>

        <div class="psiko-modal-body" style="flex:1;overflow-y:auto;">
          <div class="psiko-rows">${renderTable(computed)}</div>
        </div>

        <div style="padding:12px 20px;background:rgba(0,0,0,.32);border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div class="psiko-status" style="color:#94a3b8;font-size:10.5px;font-weight:600;">ℹ️ ⚙️ = edit bobot · ✎ = edit skor</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="js-psiko-input-raw" style="padding:8px 14px;background:rgba(59,130,246,.18);border:1px solid rgba(59,130,246,.45);border-radius:9px;color:#93c5fd;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;">📥 Input Raw</button>
            <button class="js-psiko-reset" style="padding:8px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:9px;color:#cbd5e1;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;">↺ Reset Skor</button>
            <button class="js-psiko-reset-weights" style="padding:8px 14px;background:rgba(167,139,250,.15);border:1px solid rgba(167,139,250,.4);border-radius:9px;color:#c4b5fd;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;">⚙️ Reset Bobot</button>
            <button class="js-psiko-pdf" style="padding:8px 16px;background:linear-gradient(135deg,#10b981,#059669);border:0;border-radius:9px;color:#fff;font-family:inherit;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,.35);">📄 Download PDF</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(ov);
    ov.querySelector('#psikoCloseBtn').onclick = () => ov.remove();
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
  }

  /* ============================================================
     MODAL EDIT BOBOT
     ============================================================ */
  function openWeightModal(aspect, currentWeights, onSave) {
    const old = document.getElementById('psikoWeightModal'); if (old) old.remove();

    // Tentukan sumber valid berdasarkan aspect
    const sources = [];
    if (aspect.ist && aspect.ist.length) sources.push('IST');
    if (aspect.papi && aspect.papi.length) sources.push('PAPI');
    if (aspect.bigfive && aspect.bigfive.length) sources.push('BigFive');
    if (aspect.grafisCat) sources.push('Grafis');
    if (aspect.subjectTest) sources.push('SubjectTest');
    // Wawancara & FGD selalu bisa dipakai kalau aspek punya bobot defaultnya
    if ((currentWeights || aspect.weights || {}).Wawancara !== undefined) sources.push('Wawancara');
    if ((currentWeights || aspect.weights || {}).FGD !== undefined) sources.push('FGD');

    const uniqueSources = [...new Set(sources)];
    const w = Object.assign({}, aspect.weights || {}, currentWeights || {});

    function inputRow(src) {
      const v = w[src] !== undefined ? w[src] : 0;
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(255,255,255,.04);border-radius:8px;margin-bottom:6px;">
          <label style="flex:1;font-size:12px;font-weight:800;color:#e2e8f0;">${src}</label>
          <input type="number" class="psiko-weight-input" data-src="${src}" value="${v}" min="0" max="100" step="1"
            style="width:80px;padding:8px 10px;background:rgba(255,255,255,.08);border:1px solid rgba(99,102,241,.4);border-radius:8px;color:#fff;font-family:inherit;font-size:14px;font-weight:800;text-align:center;outline:none;">
          <span style="font-size:12px;color:#94a3b8;font-weight:700;">%</span>
        </div>`;
    }

    const ov = document.createElement('div');
    ov.id = 'psikoWeightModal';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483648;background:rgba(10,20,35,.92);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

    ov.innerHTML = `
      <div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(167,139,250,.45);border-radius:18px;padding:24px;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;">
        <div style="font-size:10.5px;font-weight:900;color:#c4b5fd;letter-spacing:1.8px;margin-bottom:8px;">⚙️ EDIT BOBOT PROPORSI</div>
        <div style="font-size:13.5px;font-weight:800;color:#fff;margin-bottom:14px;line-height:1.4;">${escHtml(aspect.label)}</div>
        <div style="font-size:11px;color:#94a3b8;margin-bottom:14px;line-height:1.5;">
          Atur proporsi tiap tes. Total harus 100%. Kosongkan (=0) untuk menonaktifkan sumber.
        </div>
        <div>${uniqueSources.map(inputRow).join('')}</div>
        <div class="psiko-weight-total" style="margin-top:10px;padding:10px 12px;background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.4);border-radius:10px;font-size:13px;font-weight:800;text-align:center;color:#c4b5fd;">
          Total: 0%
        </div>
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button id="psikoWeightCancel" style="flex:1;padding:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Batal</button>
          <button id="psikoWeightSave" style="flex:2;padding:13px;background:linear-gradient(135deg,#8b5cf6,#a78bfa);border:0;border-radius:10px;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">✓ Simpan Bobot</button>
        </div>
      </div>`;

    document.body.appendChild(ov);

    const totalEl = ov.querySelector('.psiko-weight-total');
    const inputs = ov.querySelectorAll('.psiko-weight-input');

    function updateTotal() {
      let total = 0;
      inputs.forEach(i => { const v = parseFloat(i.value) || 0; total += v; });
      const ok = total === 100;
      totalEl.textContent = 'Total: ' + total + '%' + (ok ? ' ✅' : (total > 100 ? ' ⚠️ lebih dari 100' : ' ⚠️ kurang dari 100'));
      totalEl.style.background = ok ? 'rgba(34,197,94,.15)' : (total > 100 ? 'rgba(239,68,68,.15)' : 'rgba(245,158,11,.15)');
      totalEl.style.borderColor = ok ? 'rgba(34,197,94,.4)' : (total > 100 ? 'rgba(239,68,68,.4)' : 'rgba(245,158,11,.4)');
      totalEl.style.color = ok ? '#86efac' : (total > 100 ? '#fca5a5' : '#fcd34d');
      return ok;
    }
    inputs.forEach(i => i.addEventListener('input', updateTotal));
    updateTotal();

    ov.querySelector('#psikoWeightCancel').onclick = () => ov.remove();
    ov.querySelector('#psikoWeightSave').onclick = () => {
      const newW = {};
      inputs.forEach(i => {
        const v = parseFloat(i.value) || 0;
        if (v > 0) newW[i.dataset.src] = v;
      });
      const total = Object.values(newW).reduce((a,b)=>a+b,0);
      if (total !== 100) {
        if (!confirm('Total bobot ' + total + '% (bukan 100%). Tetap simpan? Sistem akan menormalkan otomatis.')) return;
      }
      ov.remove();
      onSave(newW);
    };

    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  }

  /* ============================================================
     MODAL EDIT SKOR (override)
     ============================================================ */
  function openEditModal(aspectId, aspectLabel, currentScore, autoScore, onSave) {
    const old = document.getElementById('psikoEditModal'); if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'psikoEditModal';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483648;background:rgba(10,20,35,.9);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';
    ov.innerHTML = `
      <div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.35);border-radius:18px;padding:24px;box-shadow:0 30px 90px rgba(0,0,0,.6);color:#e2e8f0;">
        <div style="font-size:10.5px;font-weight:900;color:#a5b4fc;letter-spacing:1.8px;margin-bottom:8px;">✎ OVERRIDE SKOR</div>
        <div style="font-size:13.5px;font-weight:800;color:#fff;margin-bottom:12px;line-height:1.4;">${escHtml(aspectLabel)}</div>
        ${autoScore !== null ? `<div style="padding:10px 12px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.3);border-radius:10px;font-size:11.5px;color:#c4b5fd;margin-bottom:14px;">🤖 Auto: <b style="color:#fff;">${Number(autoScore).toFixed(2)}/4</b></div>` : `<div style="padding:10px 12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:10px;font-size:11.5px;color:#fca5a5;margin-bottom:14px;">⚠️ Data tes tidak tersedia</div>`}
        <input id="psikoEditInput" type="number" min="0" max="4" step="0.01" value="${Number(currentScore).toFixed(2)}"
          style="width:100%;padding:14px 16px;background:rgba(255,255,255,.06);border:2px solid rgba(99,102,241,.45);border-radius:12px;color:#fff;font-family:inherit;font-size:22px;font-weight:800;text-align:center;outline:none;box-sizing:border-box;">
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button id="psikoEditReset" style="flex:1;padding:13px;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.4);border-radius:10px;color:#fcd34d;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;">↺ Pakai Auto</button>
          <button id="psikoEditSave" style="flex:2;padding:13px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;border-radius:10px;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">✓ Simpan</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const inp = ov.querySelector('#psikoEditInput');
    setTimeout(() => { inp.focus(); inp.select(); }, 100);
    function save() { let v = parseFloat(inp.value); if (isNaN(v)) v = 0; v = Math.max(0, Math.min(4, v)); ov.remove(); onSave(v); }
    function useAuto() { ov.remove(); onSave(null); }
    ov.querySelector('#psikoEditSave').onclick = save;
    ov.querySelector('#psikoEditReset').onclick = useAuto;
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); save(); } if (e.key === 'Escape') ov.remove(); });
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  }

  /* ============================================================
     MODAL INPUT RAW
     ============================================================ */
  function openRawModal(slug, raw, onSave) {
    const old = document.getElementById('psikoRawModal'); if (old) old.remove();
    const IST_CODES = ['SE','WA','AN','GE','ME','RA','ZR','FA','WU'];
    const PAPI_CODES = ['A','N','G','T','V','W','F','C','L','P','I','E','K','O','S','B','X','Z','D','R'];
    const BF_DIMS = ['O','C','E','A','N'];

    function istInput(c,v){ return `<div style="display:flex;gap:6px;align-items:center;"><label style="width:36px;font-size:10px;font-weight:800;color:#cbd5e1;">${c}</label><input type="number" class="psiko-raw-ist" data-code="${c}" value="${v!==undefined?v:''}" min="60" max="140" placeholder="SW" style="flex:1;padding:6px 8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:6px;color:#fff;font-family:inherit;font-size:11px;outline:none;box-sizing:border-box;"></div>`; }
    function papiInput(c,v){ return `<div style="display:flex;gap:6px;align-items:center;"><label style="width:32px;font-size:10px;font-weight:800;color:#cbd5e1;">${c}${(PAPI_CONFIG[c]||{}).inv?'*':''}</label><input type="number" class="psiko-raw-papi" data-code="${c}" value="${v!==undefined?v:''}" min="0" max="9" placeholder="0-9" style="flex:1;padding:6px 8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:6px;color:#fff;font-family:inherit;font-size:11px;outline:none;box-sizing:border-box;"></div>`; }
    function bfInput(c,v){ return `<div style="display:flex;gap:6px;align-items:center;"><label style="width:130px;font-size:10px;font-weight:800;color:#cbd5e1;">${{O:'Openness',C:'Conscientiousness',E:'Extraversion',A:'Agreeableness',N:'Neuroticism (dibalik)'}[c]}</label><input type="number" class="psiko-raw-bf" data-code="${c}" value="${v!==undefined?v:''}" min="0" max="100" placeholder="0-100" style="flex:1;padding:6px 8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:6px;color:#fff;font-family:inherit;font-size:11px;outline:none;box-sizing:border-box;"></div>`; }

    const ov = document.createElement('div');
    ov.id = 'psikoRawModal';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483648;background:rgba(10,20,35,.95);backdrop-filter:blur(8px);display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;font-family:Inter,system-ui,sans-serif;';
    ov.innerHTML = `
      <div style="width:min(720px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.35);border-radius:18px;padding:24px;box-shadow:0 30px 90px rgba(0,0,0,.6);color:#e2e8f0;margin:20px auto;">
        <div style="font-size:10.5px;font-weight:900;color:#a5b4fc;letter-spacing:1.8px;margin-bottom:8px;">📥 INPUT DATA MENTAH</div>
        <div style="font-size:13.5px;font-weight:800;color:#fff;margin-bottom:6px;">IST / PAPI / BigFive</div>
        <div style="font-size:11px;color:#94a3b8;margin-bottom:16px;">Isi manual dari laporan PDF kandidat. <span style="color:#fbbf24;">* = PAPI inversi</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
          <div><div style="font-size:10.5px;font-weight:900;color:#93c5fd;margin-bottom:8px;">IST (SW)</div><div style="display:flex;flex-direction:column;gap:6px;">${IST_CODES.map(c=>istInput(c,raw.IST[c])).join('')}</div></div>
          <div><div style="font-size:10.5px;font-weight:900;color:#86efac;margin-bottom:8px;">BIG FIVE (0-100)</div><div style="display:flex;flex-direction:column;gap:6px;">${BF_DIMS.map(c=>bfInput(c,raw.BigFive[c])).join('')}</div></div>
        </div>
        <div style="margin-bottom:16px;"><div style="font-size:10.5px;font-weight:900;color:#fcd34d;margin-bottom:8px;">PAPI (0-9)</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px;">${PAPI_CODES.map(c=>papiInput(c,raw.PAPI[c])).join('')}</div></div>
        <div style="display:flex;gap:10px;">
          <button id="psikoRawCancel" style="flex:1;padding:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Batal</button>
          <button id="psikoRawSave" style="flex:2;padding:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;border-radius:10px;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">✓ Simpan</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('#psikoRawCancel').onclick = () => ov.remove();
    ov.querySelector('#psikoRawSave').onclick = () => {
      const newRaw = { IST:{}, PAPI:{}, BigFive:{} };
      ov.querySelectorAll('.psiko-raw-ist').forEach(i => { const v = parseFloat(i.value); if (!isNaN(v)) newRaw.IST[i.dataset.code] = v; });
      ov.querySelectorAll('.psiko-raw-papi').forEach(i => { const v = parseFloat(i.value); if (!isNaN(v)) newRaw.PAPI[i.dataset.code] = v; });
      ov.querySelectorAll('.psiko-raw-bf').forEach(i => { const v = parseFloat(i.value); if (!isNaN(v)) newRaw.BigFive[i.dataset.code] = v; });
      ov.remove(); onSave(newRaw);
    };
  }

  /* ============================================================
     PDF
     ============================================================ */
  async function generatePsikogramPDF(candidateName, position, computed) {
    if (typeof window.loadPdfLibs === 'function') await window.loadPdfLibs();
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF tidak tersedia');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 15, CW = PW - 2 * M;
    let y = M;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.text('PSIKOGRAM - POSISI GURU/DOSEN', PW / 2, y, { align: 'center' });
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Sugar Group Schools', PW / 2, y, { align: 'center' });
    y += 5;
    doc.setDrawColor(200);
    doc.line(M, y, PW - M, y);
    y += 8;

    const tanggal = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });
    [['Nama', candidateName || '-'], ['Posisi', position || '-'], ['Tanggal', tanggal]].forEach(([k, v]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.text(k + ' :', M, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(v), M + 30, y);
      y += 5.5;
    });
    y += 3;

    const valid = computed.map(c => c.finalScore).filter(s => s !== null);
    const avg = valid.length ? valid.reduce((a,b)=>a+b,0)/valid.length : 0;
    const avgPct = (avg / 4) * 100;
    const avgKet = scoreToKet(avg);

    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(99, 102, 241);
    doc.rect(M, y, CW, 16, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(67, 56, 202);
    doc.text('RATA-RATA: ' + avg.toFixed(2) + ' / 4.00  (' + avgPct.toFixed(1) + '%)', M + 4, y + 6);
    doc.setFontSize(10);
    doc.text('KATEGORI: ' + avgKet.label, M + 4, y + 12);
    y += 20;

    doc.setFillColor(59, 130, 246);
    doc.rect(M, y, CW, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('#', M + 2, y + 5);
    doc.text('ASPEK', M + 12, y + 5);
    doc.text('PERSEN', M + 130, y + 5, { align: 'right' });
    doc.text('SKOR', M + 155, y + 5, { align: 'center' });
    doc.text('KATEGORI', M + CW - 4, y + 5, { align: 'right' });
    y += 7;

    computed.forEach((item, i) => {
      if (y > PH - 25) { doc.addPage(); y = M; }
      const { aspect, finalScore } = item;
      const score = finalScore !== null ? finalScore : 0;
      const pct = (score / 4) * 100;
      const ket = scoreToKet(score);

      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(M, y, CW, 7, 'F'); }
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(String(i + 1).padStart(2, '0'), M + 2, y + 5);
      const wrapped = doc.splitTextToSize(aspect.label, 115);
      doc.text(wrapped[0] + (wrapped.length > 1 ? '…' : ''), M + 12, y + 5);
      doc.text(pct.toFixed(1) + '%', M + 130, y + 5, { align: 'right' });
      doc.text(score.toFixed(2) + ' / 4', M + 155, y + 5, { align: 'center' });
      const k = ket.pdfColor;
      doc.setTextColor(k[0], k[1], k[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(ket.label, M + CW - 4, y + 5, { align: 'right' });
      y += 7;
    });

    y += 12;
    if (y > PH - 25) { doc.addPage(); y = M; }
    doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 5;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
    doc.text('Dibuat: ' + new Date().toLocaleString('id-ID'), M, y);
    doc.text('Halaman ' + doc.internal.getNumberOfPages(), PW - M, y, { align: 'right' });
    return doc;
  }

  async function downloadPsikogramPDF(slug, candidateName, position) {
    const [raw, overrides, customWeights] = await Promise.all([
      fetchRawData(slug), loadOverrides(slug), loadWeights(slug)
    ]);
    const computed = computeAll(raw, overrides, customWeights);
    const doc = await generatePsikogramPDF(candidateName, position, computed);
    doc.save('Psikogram-' + String(candidateName || 'Kandidat').replace(/[^a-zA-Z0-9]/g, '-') + '.pdf');
  }

  /* ============================================================
     RENDER BUTTON (dipanggil dari 00t)
     ============================================================ */
  window.renderPsikogramBox = async function (slug, candidateName, position) {
    const category = detectCategory(position);
    if (!category) return '';
    return `
      <button class="js-psikogram-open" data-slug="${escHtml(slug)}" data-name="${escHtml(candidateName)}" data-position="${escHtml(position||'')}"
        style="width:100%;padding:11px 14px;margin-top:10px;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          border:0;border-radius:10px;color:#fff;
          font-family:inherit;font-size:13px;font-weight:900;
          cursor:pointer;box-shadow:0 4px 12px rgba(99,102,241,.35);
          display:flex;align-items:center;justify-content:center;gap:8px;">
        📊 Lihat Psikogram (11 Aspek)
      </button>`;
  };

  /* ============================================================
     EVENT DELEGATION
     ============================================================ */
  if (!window.__psikoDelegationAttached) {
    window.__psikoDelegationAttached = true;

    document.addEventListener('click', async function (e) {

      /* OPEN PSIKOGRAM */
      const openBtn = e.target.closest('.js-psikogram-open');
      if (openBtn) {
        e.preventDefault(); e.stopPropagation();
        openPsikogramModal(
          openBtn.getAttribute('data-slug'),
          openBtn.getAttribute('data-name'),
          openBtn.getAttribute('data-position')
        );
        return;
      }

      /* EDIT BOBOT */
      const wBtn = e.target.closest('.psiko-weight-btn');
      if (wBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = wBtn.closest('#psikoModal'); if (!modal) return;
        const slug = modal.getAttribute('data-slug');
        const name = modal.getAttribute('data-name');
        const position = modal.getAttribute('data-position');
        const aspectId = wBtn.getAttribute('data-aspect-id');
        const aspect = DEFAULT_ASPECTS.find(a => a.id === aspectId); if (!aspect) return;

        // Load current weights
        const customWeights = await loadWeights(slug);
        const currentW = customWeights[aspectId] || null;

        openWeightModal(aspect, currentW, async (newW) => {
          try {
            const w = await loadWeights(slug);
            w[aspectId] = newW;
            await saveWeights(slug, w);
            modal.remove();
            openPsikogramModal(slug, name, position);
          } catch (err) { alert('Gagal simpan bobot: ' + err.message); }
        });
        return;
      }

      /* EDIT SKOR */
      const editBtn = e.target.closest('.psiko-edit-btn');
      if (editBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = editBtn.closest('#psikoModal'); if (!modal) return;
        const slug = modal.getAttribute('data-slug');
        const name = modal.getAttribute('data-name');
        const position = modal.getAttribute('data-position');
        const aspectId = editBtn.getAttribute('data-aspect-id');
        const asp = DEFAULT_ASPECTS.find(a => a.id === aspectId); if (!asp) return;
        const row = editBtn.closest('.psiko-row');
        const autoScore = row.dataset.auto ? Number(row.dataset.auto) : null;
        const currentScore = parseFloat(row.querySelector('.psiko-score').textContent) || 0;

        openEditModal(aspectId, asp.label, currentScore, autoScore, async (v) => {
          try {
            const overrides = await loadOverrides(slug);
            if (v === null) delete overrides[aspectId];
            else overrides[aspectId] = v;
            await saveOverrides(slug, overrides);
            modal.remove();
            openPsikogramModal(slug, name, position);
          } catch (err) { alert('Gagal: ' + err.message); }
        });
        return;
      }

      /* INPUT RAW */
      const rawBtn = e.target.closest('.js-psiko-input-raw');
      if (rawBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = rawBtn.closest('#psikoModal'); if (!modal) return;
        const slug = modal.getAttribute('data-slug');
        const name = modal.getAttribute('data-name');
        const position = modal.getAttribute('data-position');
        const raw = await fetchRawData(slug);
        openRawModal(slug, raw, async (newRaw) => {
          try {
            await saveRaw(slug, newRaw);
            modal.remove();
            openPsikogramModal(slug, name, position);
          } catch (err) { alert('Gagal: ' + err.message); }
        });
        return;
      }

      /* RESET SKOR (override) */
      const resetBtn = e.target.closest('.js-psiko-reset');
      if (resetBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = resetBtn.closest('#psikoModal'); if (!modal) return;
        if (!confirm('Hapus semua override skor?')) return;
        const slug = modal.getAttribute('data-slug');
        const name = modal.getAttribute('data-name');
        const position = modal.getAttribute('data-position');
        try {
          await saveOverrides(slug, {});
          modal.remove();
          openPsikogramModal(slug, name, position);
        } catch (err) { alert('Gagal: ' + err.message); }
        return;
      }

      /* RESET BOBOT */
      const resetWBtn = e.target.closest('.js-psiko-reset-weights');
      if (resetWBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = resetWBtn.closest('#psikoModal'); if (!modal) return;
        if (!confirm('Kembalikan semua bobot ke default?')) return;
        const slug = modal.getAttribute('data-slug');
        const name = modal.getAttribute('data-name');
        const position = modal.getAttribute('data-position');
        try {
          await saveWeights(slug, {});
          modal.remove();
          openPsikogramModal(slug, name, position);
        } catch (err) { alert('Gagal: ' + err.message); }
        return;
      }

      /* PDF */
      const pdfBtn = e.target.closest('.js-psiko-pdf');
      if (pdfBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = pdfBtn.closest('#psikoModal'); if (!modal) return;
        const slug = modal.getAttribute('data-slug');
        const name = modal.getAttribute('data-name');
        const position = modal.getAttribute('data-position');
        const prev = pdfBtn.textContent;
        pdfBtn.textContent = '⏳ PDF...'; pdfBtn.disabled = true;
        try {
          await downloadPsikogramPDF(slug, name, position);
          pdfBtn.textContent = '✓ Terunduh';
          setTimeout(() => { pdfBtn.textContent = prev; pdfBtn.disabled = false; }, 1800);
        } catch (err) {
          alert('Gagal PDF: ' + err.message);
          pdfBtn.textContent = prev; pdfBtn.disabled = false;
        }
        return;
      }
    }, true);
  }

  console.log('[PSIKOGRAM] ✓ Loaded v4 — editable bobot');
})();