/* ============================================================
   js/00u-admin-psikogram.js — v2 (Weighted Auto-Compute)
   ------------------------------------------------------------
   - Bobot per tes per aspek (IST/PAPI/BigFive/Wawancara/FGD/Grafis/Subject)
   - Deteksi otomatis tes yang sudah dikerjakan kandidat
   - Normalisasi bobot kalau ada tes yang kosong
   - Breakdown transparan per aspek (dari tes mana saja)
   - Persentase akhir tetap bisa di-edit manual
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     KONFIGURASI ASPEK + BOBOT + MAP SUBTES
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

  const ASPECTS_GURU = [
    { id: 'cognitive_ability', label: 'Cognitive Ability & Problem Solving',
      weights: { IST: 40, Wawancara: 30, FGD: 20, Grafis: 10 },
      ist: ['AN','RA','ZR','FA','WU'], papi: [], bigfive: [],
      grafisCat: GRAFIS_CAT.cognitive },

    { id: 'verbal_communication', label: 'Verbal Communication & Material Explanation',
      weights: { IST: 25, BigFive: 15, Wawancara: 35, FGD: 25 },
      ist: ['WA','GE','AN'], papi: [], bigfive: ['E','A'],
      grafisCat: null },

    { id: 'classroom_management', label: 'Classroom Management & Instructional Leadership',
      weights: { IST: 5, PAPI: 20, BigFive: 10, Wawancara: 35, FGD: 30 },
      ist: ['SE','GE','AN','WA'], papi: ['L','P','I'], bigfive: ['C','N_rev'],
      grafisCat: null },

    { id: 'empathy_interpersonal', label: 'Empathy & Interpersonal Skills',
      weights: { IST: 5, PAPI: 10, BigFive: 30, Wawancara: 30, Grafis: 5, FGD: 20 },
      ist: ['WA'], papi: ['O','S','B','X'], bigfive: ['A','E'],
      grafisCat: GRAFIS_CAT.empathy },

    { id: 'emotional_stability', label: 'Emotional Stability & Impulse Control',
      weights: { PAPI: 20, BigFive: 35, Grafis: 30, Wawancara: 15 },
      ist: [], papi: ['E','K'], bigfive: ['N_rev'],
      grafisCat: GRAFIS_CAT.emotional, bigfiveNote: 'Neuroticism dibalik' },

    { id: 'motivation_drive', label: 'Motivation & Achievement Drive',
      weights: { PAPI: 40, Wawancara: 30, BigFive: 20, Grafis: 10 },
      ist: [], papi: ['A','N','G','T','V'], bigfive: ['C'],
      grafisCat: GRAFIS_CAT.motivation },

    { id: 'work_discipline', label: 'Work Discipline & Reliability',
      weights: { PAPI: 35, BigFive: 45, Wawancara: 20 },
      ist: [], papi: ['G','W','F','C'], bigfive: ['C'],
      grafisCat: null },

    { id: 'flexibility_adaptability', label: 'Flexibility, Adaptability & Learning Agility',
      weights: { IST: 5, PAPI: 20, BigFive: 25, Grafis: 10, FGD: 15, Wawancara: 25 },
      ist: ['AN'], papi: ['Z','V'], bigfive: ['O','N_rev'],
      grafisCat: GRAFIS_CAT.flexibility },

    { id: 'integrity_compliance', label: 'Integrity & Rule Compliance',
      weights: { PAPI: 40, Grafis: 20, Wawancara: 40 },
      ist: [], papi: ['W','F','C','G'], bigfive: [],
      grafisCat: GRAFIS_CAT.integrity },

    { id: 'teaching_creativity', label: 'Teaching Creativity',
      weights: { IST: 10, BigFive: 35, Wawancara: 35, Grafis: 20 },
      ist: ['FA','WU','AN'], papi: [], bigfive: ['O'],
      grafisCat: GRAFIS_CAT.creativity },

    { id: 'teaching_practice', label: 'Teaching Practice Skills',
      weights: { Wawancara: 40, SubjectTest: 60 },
      ist: [], papi: [], bigfive: [],
      grafisCat: null, subjectTest: true }
  ];

  /* PAPI inversion & label */
  const PAPI_CONFIG = {
    A:{inv:false}, N:{inv:false}, G:{inv:false}, T:{inv:false}, V:{inv:false},
    W:{inv:false}, F:{inv:false}, C:{inv:false}, L:{inv:false}, P:{inv:false},
    I:{inv:false}, E:{inv:false}, K:{inv:true},  O:{inv:false}, S:{inv:false},
    B:{inv:false}, X:{inv:false}, Z:{inv:false}, D:{inv:false}, R:{inv:false}
  };

  /* ============================================================
     NORMALIZERS — semua ke skala 0-4
     ============================================================ */
  function clamp04(v){ return Math.max(0, Math.min(4, v)); }
  function normIST(sw){ return typeof sw==='number' ? clamp04((sw - 75) / 12.5) : null; }
  function normWawancara(s){ return typeof s==='number' ? clamp04(s - 1) : null; }   // 1-5 → 0-4
  function normFGD(s){ return typeof s==='number' ? clamp04(s) : null; }             // 1-4 → langsung
  function normGrafis(s){ return typeof s==='number' ? clamp04(s) : null; }          // 0-4
  function normPAPI(s, inv){ if(typeof s!=='number')return null; return clamp04(((inv?9-s:s)/9)*4); }
  function normBigFive(s, inv){ if(typeof s!=='number')return null; return clamp04(((inv?100-s:s)/100)*4); }
  function normSubject(s){ if(typeof s!=='number'||s<=0)return null; return clamp04(s); } // 1-4

  /* ============================================================
     HELPERS
     ============================================================ */
  function detectCategory(p) {
    if (!p) return null;
    return /guru|dosen|teacher|pengajar|kindergarten|primary|math|biology|english/i.test(String(p)) ? 'guru' : null;
  }
  function scoreToKet(s) {
    const v = Number(s) || 0;
    if (v >= 3.5) return { label: 'BAIK',          color: '#86efac', bg: 'rgba(34,197,94,.15)',  border: 'rgba(34,197,94,.45)'  };
    if (v >= 2.5) return { label: 'CUKUP',         color: '#fcd34d', bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.45)' };
    if (v >= 1.5) return { label: 'KURANG',        color: '#fca5a5', bg: 'rgba(239,68,68,.15)',  border: 'rgba(239,68,68,.45)'  };
    return         { label: 'SANGAT KURANG', color: '#fca5a5', bg: 'rgba(239,68,68,.22)',  border: 'rgba(239,68,68,.55)'  };
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
     FETCH DATA MENTAH
     ============================================================ */
  async function fetchRawData(slug) {
    const raw = {
      IST: {}, PAPI: {}, BigFive: {}, Grafis: {},
      Wawancara: null, FGD: null, Subject: null,
      _sources: { IST:false, PAPI:false, BigFive:false, Wawancara:false, FGD:false, Grafis:false, Subject:false }
    };
    if (!fbReady()) return raw;

    // 1) Raw manual (IST/PAPI/BigFive/Subject)
    try {
      const snap = await firebase.database().ref('sgs_psikogram_raw/' + slug).once('value');
      const d = snap.val() || {};
      if (d.IST && Object.keys(d.IST).length)      { raw.IST = d.IST;      raw._sources.IST = true; }
      if (d.PAPI && Object.keys(d.PAPI).length)    { raw.PAPI = d.PAPI;    raw._sources.PAPI = true; }
      if (d.BigFive && Object.keys(d.BigFive).length) { raw.BigFive = d.BigFive; raw._sources.BigFive = true; }
      if (d.Subject && typeof d.Subject === 'number' && d.Subject > 0) { raw.Subject = d.Subject; raw._sources.Subject = true; }
    } catch (e) {}

    // 2) Wawancara (avg semua pewawancara)
    try {
      const snap = await firebase.database().ref('sgs_interviews/' + slug).once('value');
      const d = snap.val() || {};
      const avgs = Object.values(d).map(x => x && Number(x.average)).filter(v => !isNaN(v) && v > 0);
      if (avgs.length) { raw.Wawancara = avgs.reduce((a,b)=>a+b,0)/avgs.length; raw._sources.Wawancara = true; }
    } catch (e) {}

    // 3) FGD (avg semua asesor)
    try {
      const snap = await firebase.database().ref('sgs_fgd/' + slug).once('value');
      const d = snap.val() || {};
      const avgs = Object.values(d).map(x => x && Number(x.average)).filter(v => !isNaN(v) && v > 0);
      if (avgs.length) { raw.FGD = avgs.reduce((a,b)=>a+b,0)/avgs.length; raw._sources.FGD = true; }
    } catch (e) {}

    // 4) Grafis (dari assessor mana saja, ambil yang perKategori-nya lengkap)
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

    // 5) Subject rating (fallback kalau raw tidak ada)
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
     HITUNG SKOR WEIGHTED PER ASPEK
     ============================================================ */
  function computeAspect(aspect, raw) {
    const parts = [];
    const W = aspect.weights || {};

    // IST
    if (aspect.ist && aspect.ist.length && raw._sources.IST) {
      const vals = aspect.ist.map(c => normIST(raw.IST[c])).filter(v => v !== null);
      if (vals.length) parts.push({ src:'IST', val: vals.reduce((a,b)=>a+b,0)/vals.length, w: W.IST||0 });
    }
    // PAPI
    if (aspect.papi && aspect.papi.length && raw._sources.PAPI) {
      const vals = aspect.papi.map(c => normPAPI(raw.PAPI[c], (PAPI_CONFIG[c]||{}).inv)).filter(v => v !== null);
      if (vals.length) parts.push({ src:'PAPI', val: vals.reduce((a,b)=>a+b,0)/vals.length, w: W.PAPI||0 });
    }
    // BigFive
    if (aspect.bigfive && aspect.bigfive.length && raw._sources.BigFive) {
      const vals = aspect.bigfive.map(c => {
        const inv = /_rev$/i.test(c);
        const dim = c.replace(/_rev$/i,'');
        return normBigFive(raw.BigFive[dim], inv);
      }).filter(v => v !== null);
      if (vals.length) parts.push({ src:'BigFive', val: vals.reduce((a,b)=>a+b,0)/vals.length, w: W.BigFive||0 });
    }
    // Wawancara
    if (raw._sources.Wawancara) {
      const v = normWawancara(raw.Wawancara);
      if (v !== null) parts.push({ src:'Wawancara', val: v, w: W.Wawancara||0 });
    }
    // FGD
    if (raw._sources.FGD) {
      const v = normFGD(raw.FGD);
      if (v !== null) parts.push({ src:'FGD', val: v, w: W.FGD||0 });
    }
    // Grafis
    if (aspect.grafisCat && raw._sources.Grafis && raw.Grafis[aspect.grafisCat] !== undefined) {
      const v = normGrafis(raw.Grafis[aspect.grafisCat]);
      if (v !== null) parts.push({ src:'Grafis', val: v, w: W.Grafis||0 });
    }
    // Subject
    if (aspect.subjectTest && raw._sources.Subject) {
      const v = normSubject(raw.Subject);
      if (v !== null) parts.push({ src:'SubjectTest', val: v, w: W.SubjectTest||0 });
    }

    const totalW = parts.reduce((a,p)=>a+p.w, 0);
    if (totalW === 0) return { score: null, parts };
    const score = parts.reduce((a,p)=>a+p.val*p.w, 0) / totalW;
    return { score, parts, totalW };
  }

  /* ============================================================
     HITUNG SEMUA ASPEK
     ============================================================ */
  function computeAll(category, raw, overrides) {
    const aspects = category === 'guru' ? ASPECTS_GURU : [];
    overrides = overrides || {};
    return aspects.map(a => {
      const c = computeAspect(a, raw);
      const autoScore = c.score !== null ? Math.round(c.score * 100) / 100 : null;
      const override = overrides[a.id] !== undefined && overrides[a.id] !== null
        ? Number(overrides[a.id]) : null;
      const finalScore = override !== null ? override : autoScore;
      return { aspect: a, parts: c.parts, totalW: c.totalW, autoScore, override, finalScore };
    });
  }

  /* ============================================================
     RENDER ROW
     ============================================================ */
  function renderRow(item, idx) {
    const { aspect, parts, autoScore, override, finalScore } = item;
    const score = finalScore !== null ? finalScore : 0;
    const pct = score !== null ? Math.round((score/4)*1000)/10 : 0;
    const ket = scoreToKet(score);
    const isOverridden = override !== null;

    const partsHTML = parts.length
      ? parts.map(p => `
          <div style="display:flex;justify-content:space-between;font-size:9.5px;color:#94a3b8;padding:2px 0;">
            <span>• ${escHtml(p.src)} ${p.w ? '(w='+p.w+')' : ''}</span>
            <span style="font-family:monospace;color:#cbd5e1;">${p.val.toFixed(2)} → ${Math.round(p.val/4*100)}%</span>
          </div>`).join('')
      : '<div style="font-size:9.5px;color:#fca5a5;padding:2px 0;">⚠️ Tidak ada data dari sumber manapun</div>';

    return `
      <div class="psiko-row" data-aspect-id="${aspect.id}" data-auto="${autoScore!==null?autoScore.toFixed(2):''}" style="
        display:grid; grid-template-columns:30px minmax(0,1fr) 62px 78px 62px 34px; gap:10px; align-items:center;
        padding:10px 14px; background:rgba(255,255,255,.02); border-bottom:1px solid rgba(255,255,255,.05);">
        <div style="font-size:10px;font-weight:800;color:#64748b;text-align:center;">${String(idx+1).padStart(2,'0')}</div>
        <div style="min-width:0;">
          <div style="font-size:11.5px;font-weight:700;color:#e2e8f0;line-height:1.35;margin-bottom:5px;">
            ${escHtml(aspect.label)}
            ${isOverridden ? '<span title="Nilai manual override" style="margin-left:6px;font-size:9px;color:#fbbf24;">✎ manual</span>' : ''}
          </div>
          <div style="height:5px;background:rgba(255,255,255,.07);border-radius:999px;overflow:hidden;margin-bottom:6px;">
            <div class="psiko-bar" style="width:${pct}%;height:100%;background:${barGradient(pct)};border-radius:inherit;transition:width .35s ease;"></div>
          </div>
          <details style="cursor:pointer;">
            <summary style="font-size:9px;color:#64748b;font-weight:700;outline:none;">▸ breakdown (${parts.length} sumber)</summary>
            <div style="margin-top:4px;padding:6px 8px;background:rgba(0,0,0,.22);border-radius:6px;">
              ${partsHTML}
            </div>
          </details>
        </div>
        <div class="psiko-pct" style="font-size:13px;font-weight:800;color:#a5b4fc;text-align:right;font-variant-numeric:tabular-nums;">
          ${pct.toFixed(1)}%
        </div>
        <div class="psiko-score" style="font-size:11.5px;font-weight:800;color:#e2e8f0;text-align:center;font-variant-numeric:tabular-nums;">
          ${score.toFixed(2)} / 4
        </div>
        <div style="text-align:center;">
          <span class="psiko-ket" style="
            display:inline-block;padding:3px 8px;border-radius:999px;font-size:9px;font-weight:900;
            background:${ket.bg};border:1px solid ${ket.border};color:${ket.color};white-space:nowrap;
          ">${ket.label}</span>
        </div>
        <div style="text-align:center;">
          <button class="psiko-edit-btn" data-aspect-id="${aspect.id}" title="Edit manual" style="
            width:26px;height:26px;display:grid;place-items:center;
            background:rgba(99,102,241,.18);border:1px solid rgba(99,102,241,.45);
            border-radius:7px;color:#a5b4fc;font-size:11px;cursor:pointer;font-family:inherit;padding:0;">
            ✎
          </button>
        </div>
      </div>`;
  }

  /* ============================================================
     RENDER SELURUH BOX
     ============================================================ */
  function renderBox(slug, category, raw, overrides) {
    const computed = computeAll(category, raw, overrides);
    const validScores = computed.map(c => c.finalScore).filter(s => s !== null);
    const avg = validScores.length ? validScores.reduce((a,b)=>a+b,0)/validScores.length : 0;
    const avgPct = (avg/4)*100;
    const avgKet = scoreToKet(avg);

    const srcChips = [
      ['IST',       raw._sources.IST],
      ['PAPI',      raw._sources.PAPI],
      ['BigFive',   raw._sources.BigFive],
      ['Wawancara', raw._sources.Wawancara],
      ['FGD',       raw._sources.FGD],
      ['Grafis',    raw._sources.Grafis],
      ['Subject',   raw._sources.Subject]
    ].map(([name, ok]) => `
      <span style="
        padding:2px 8px;border-radius:999px;font-size:9px;font-weight:800;
        background:${ok?'rgba(34,197,94,.15)':'rgba(148,163,184,.1)'};
        border:1px solid ${ok?'rgba(34,197,94,.4)':'rgba(148,163,184,.25)'};
        color:${ok?'#86efac':'#94a3b8'};white-space:nowrap;">
        ${ok?'✓':'×'} ${name}
      </span>`).join('');

    return `
      <div class="js-psikogram-box" data-slug="${escHtml(slug)}" data-category="${category}" style="
        margin-top:14px;border-radius:14px;overflow:hidden;
        background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.015));
        border:1.5px solid rgba(99,102,241,.28);">

        <!-- HEADER -->
        <div style="padding:12px 16px;background:linear-gradient(135deg,rgba(99,102,241,.16),rgba(139,92,246,.08));
          border-bottom:1px solid rgba(99,102,241,.22);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:32px;height:32px;display:grid;place-items:center;
                background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:9px;font-size:15px;">📊</div>
              <div>
                <div style="font-size:11px;font-weight:900;color:#c4b5fd;letter-spacing:1.5px;">
                  PSIKOGRAM · POSISI GURU/DOSEN
                </div>
                <div style="font-size:10px;color:#94a3b8;margin-top:2px;">
                  ${computed.length} aspek · auto-compute dari data tes kandidat
                </div>
              </div>
            </div>
            <div class="psiko-avg-chip" style="padding:6px 12px;background:rgba(99,102,241,.15);
              border:1px solid rgba(99,102,241,.38);border-radius:999px;font-size:11px;font-weight:800;
              color:#a5b4fc;display:flex;align-items:center;gap:8px;">
              <span>Rata-rata: <b style="color:#fff;">${avg.toFixed(2)}/4</b> · ${avgPct.toFixed(1)}%</span>
              <span style="padding:2px 8px;background:${avgKet.bg};border:1px solid ${avgKet.border};
                color:${avgKet.color};border-radius:999px;font-size:9.5px;font-weight:900;">${avgKet.label}</span>
            </div>
          </div>
          <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
            <span style="font-size:9px;font-weight:800;color:#64748b;letter-spacing:1px;">SUMBER:</span>
            ${srcChips}
          </div>
        </div>

        <!-- COLUMN HEADER -->
        <div style="display:grid;grid-template-columns:30px minmax(0,1fr) 62px 78px 62px 34px;gap:10px;
          padding:8px 14px;background:rgba(0,0,0,.22);border-bottom:1px solid rgba(255,255,255,.05);
          font-size:9.5px;font-weight:900;letter-spacing:.8px;color:#64748b;">
          <div style="text-align:center;">#</div>
          <div>ASPEK</div>
          <div style="text-align:right;">%</div>
          <div style="text-align:center;">SKOR</div>
          <div style="text-align:center;">KET</div>
          <div style="text-align:center;">·</div>
        </div>

        <!-- ROWS -->
        <div class="psiko-rows">${computed.map(renderRow).join('')}</div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;background:rgba(0,0,0,.22);border-top:1px solid rgba(255,255,255,.05);
          display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div class="psiko-status" style="color:#94a3b8;font-size:10.5px;font-weight:600;">
            ℹ️ Auto-compute dari data tes · override simpan otomatis
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="js-psiko-input-raw" style="padding:6px 12px;background:rgba(59,130,246,.18);
              border:1px solid rgba(59,130,246,.4);border-radius:8px;color:#93c5fd;font-family:inherit;
              font-size:10.5px;font-weight:800;cursor:pointer;">📥 Input IST/PAPI/BigFive</button>
            <button class="js-psiko-reset" style="padding:6px 12px;background:rgba(255,255,255,.06);
              border:1px solid rgba(255,255,255,.14);border-radius:8px;color:#cbd5e1;font-family:inherit;
              font-size:10.5px;font-weight:800;cursor:pointer;">↺ Reset Override</button>
            <button class="js-psiko-copy" style="padding:6px 12px;
              background:linear-gradient(135deg,rgba(99,102,241,.28),rgba(139,92,246,.18));
              border:1px solid rgba(99,102,241,.5);border-radius:8px;color:#c4b5fd;font-family:inherit;
              font-size:10.5px;font-weight:800;cursor:pointer;">📋 Copy</button>
          </div>
        </div>
      </div>`;
  }

  /* ============================================================
     MODAL: EDIT OVERRIDE (final score)
     ============================================================ */
  function openEditModal(aspectId, aspectLabel, currentScore, autoScore, onSave) {
    const old = document.getElementById('psikoEditModal'); if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'psikoEditModal';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:rgba(10,20,35,.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

    ov.innerHTML = `
      <div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);
        border:1.5px solid rgba(99,102,241,.35);border-radius:18px;padding:24px;
        box-shadow:0 30px 90px rgba(0,0,0,.6);color:#e2e8f0;">
        <div style="font-size:10.5px;font-weight:900;color:#a5b4fc;letter-spacing:1.8px;margin-bottom:8px;">
          ✎ OVERRIDE SKOR ASPEK
        </div>
        <div style="font-size:13.5px;font-weight:800;color:#fff;margin-bottom:12px;line-height:1.4;">
          ${escHtml(aspectLabel)}
        </div>
        ${autoScore !== null ? `
          <div style="padding:10px 12px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.3);
            border-radius:10px;font-size:11.5px;color:#c4b5fd;margin-bottom:14px;">
            🤖 Skor otomatis: <b style="color:#fff;">${Number(autoScore).toFixed(2)}/4</b>
            <span style="color:#94a3b8;">(${Math.round(autoScore/4*100)}%)</span>
          </div>` : `
          <div style="padding:10px 12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);
            border-radius:10px;font-size:11.5px;color:#fca5a5;margin-bottom:14px;">
            ⚠️ Data tes tidak tersedia. Masukkan skor manual.
          </div>`}
        <input id="psikoEditInput" type="number" min="0" max="4" step="0.01"
          value="${Number(currentScore).toFixed(2)}"
          style="width:100%;padding:14px 16px;background:rgba(255,255,255,.06);
            border:2px solid rgba(99,102,241,.45);border-radius:12px;color:#fff;
            font-family:inherit;font-size:22px;font-weight:800;text-align:center;
            outline:none;box-sizing:border-box;">
        <div class="psiko-edit-preview" style="margin-top:10px;text-align:center;
          font-size:12px;color:#94a3b8;font-weight:700;">= —%</div>
        <div style="display:flex;gap:10px;margin-top:20px;">
          <button id="psikoEditReset" style="flex:1;padding:13px;background:rgba(245,158,11,.15);
            border:1px solid rgba(245,158,11,.4);border-radius:10px;color:#fcd34d;
            font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;">↺ Pakai Auto</button>
          <button id="psikoEditSave" style="flex:2;padding:13px;
            background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;border-radius:10px;
            color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">✓ Simpan</button>
        </div>
      </div>`;

    document.body.appendChild(ov);
    const inp = ov.querySelector('#psikoEditInput');
    const prev = ov.querySelector('.psiko-edit-preview');

    function upd() {
      const v = parseFloat(inp.value);
      if (isNaN(v)) { prev.textContent = '= —%'; return; }
      prev.textContent = '= ' + ((Math.max(0,Math.min(4,v))/4)*100).toFixed(1) + '%';
    }
    inp.addEventListener('input', upd); upd();
    setTimeout(() => { inp.focus(); inp.select(); }, 100);

    function close() { ov.remove(); }
    function save() {
      let v = parseFloat(inp.value);
      if (isNaN(v)) v = 0;
      v = Math.max(0, Math.min(4, v));
      close(); onSave(v);
    }
    function useAuto() { close(); onSave(null); }

    ov.querySelector('#psikoEditSave').onclick = save;
    ov.querySelector('#psikoEditReset').onclick = useAuto;
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); save(); }
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
  }

  /* ============================================================
     MODAL: INPUT RAW IST/PAPI/BIGFIVE
     ============================================================ */
  function openRawModal(slug, raw, onSave) {
    const old = document.getElementById('psikoRawModal'); if (old) old.remove();

    const IST_CODES = ['SE','WA','AN','GE','ME','RA','ZR','FA','WU'];
    const PAPI_CODES = ['A','N','G','T','V','W','F','C','L','P','I','E','K','O','S','B','X','Z','D','R'];
    const BF_DIMS = ['O','C','E','A','N'];

    function istInput(code, v) {
      return `<div style="display:flex;align-items:center;gap:8px;">
        <label style="width:44px;font-size:11px;font-weight:800;color:#cbd5e1;">${code}</label>
        <input type="number" class="psiko-raw-ist" data-code="${code}"
          value="${v!==undefined?v:''}" min="60" max="140" step="1" placeholder="SW"
          style="flex:1;padding:7px 10px;background:rgba(255,255,255,.06);
            border:1px solid rgba(255,255,255,.14);border-radius:7px;color:#fff;
            font-family:inherit;font-size:12px;outline:none;box-sizing:border-box;">
      </div>`;
    }
    function papiInput(code, v) {
      return `<div style="display:flex;align-items:center;gap:8px;">
        <label style="width:44px;font-size:11px;font-weight:800;color:#cbd5e1;">${code}${(PAPI_CONFIG[code]||{}).inv?'*':''}</label>
        <input type="number" class="psiko-raw-papi" data-code="${code}"
          value="${v!==undefined?v:''}" min="0" max="9" step="1" placeholder="0-9"
          style="flex:1;padding:7px 10px;background:rgba(255,255,255,.06);
            border:1px solid rgba(255,255,255,.14);border-radius:7px;color:#fff;
            font-family:inherit;font-size:12px;outline:none;box-sizing:border-box;">
      </div>`;
    }
    function bfInput(code, v) {
      const label = { O:'Openness', C:'Conscientiousness', E:'Extraversion', A:'Agreeableness', N:'Neuroticism (dibalik)' }[code];
      return `<div style="display:flex;align-items:center;gap:8px;">
        <label style="width:140px;font-size:11px;font-weight:800;color:#cbd5e1;">${label}</label>
        <input type="number" class="psiko-raw-bf" data-code="${code}"
          value="${v!==undefined?v:''}" min="0" max="100" step="1" placeholder="0-100"
          style="flex:1;padding:7px 10px;background:rgba(255,255,255,.06);
            border:1px solid rgba(255,255,255,.14);border-radius:7px;color:#fff;
            font-family:inherit;font-size:12px;outline:none;box-sizing:border-box;">
      </div>`;
    }

    const ov = document.createElement('div');
    ov.id = 'psikoRawModal';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(8px);display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;font-family:Inter,system-ui,sans-serif;';

    ov.innerHTML = `
      <div style="width:min(720px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);
        border:1.5px solid rgba(99,102,241,.35);border-radius:18px;padding:24px;
        box-shadow:0 30px 90px rgba(0,0,0,.6);color:#e2e8f0;margin:20px auto;">
        <div style="font-size:10.5px;font-weight:900;color:#a5b4fc;letter-spacing:1.8px;margin-bottom:8px;">
          📥 INPUT DATA MENTAH
        </div>
        <div style="font-size:13.5px;font-weight:800;color:#fff;margin-bottom:6px;">
          IST / PAPI / BigFive
        </div>
        <div style="font-size:11px;color:#94a3b8;margin-bottom:18px;line-height:1.5;">
          Data ini berasal dari laporan PDF kandidat. Isi manual untuk kandidat yang sudah menyelesaikan tes terkait.<br>
          <span style="color:#fbbf24;">* = PAPI dengan inversi otomatis</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
          <div>
            <div style="font-size:10.5px;font-weight:900;color:#93c5fd;letter-spacing:1px;margin-bottom:8px;">IST (SW)</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${IST_CODES.map(c => istInput(c, raw.IST[c])).join('')}
            </div>
          </div>
          <div>
            <div style="font-size:10.5px;font-weight:900;color:#86efac;letter-spacing:1px;margin-bottom:8px;">BIG FIVE (0-100)</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${BF_DIMS.map(c => bfInput(c, raw.BigFive[c])).join('')}
            </div>
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <div style="font-size:10.5px;font-weight:900;color:#fcd34d;letter-spacing:1px;margin-bottom:8px;">PAPI (0-9)</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px;">
            ${PAPI_CODES.map(c => papiInput(c, raw.PAPI[c])).join('')}
          </div>
        </div>

        <div style="padding:10px 12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);
          border-radius:8px;font-size:10.5px;color:#fca5a5;margin-bottom:16px;">
          Kosongkan field yang tidak ada datanya. Bobot aspek akan otomatis menyesuaikan.
        </div>

        <div style="display:flex;gap:10px;">
          <button id="psikoRawCancel" style="flex:1;padding:13px;background:rgba(255,255,255,.06);
            border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;
            font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Batal</button>
          <button id="psikoRawSave" style="flex:2;padding:13px;
            background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;border-radius:10px;
            color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;
            box-shadow:0 8px 20px rgba(99,102,241,.42);">✓ Simpan &amp; Hitung Ulang</button>
        </div>
      </div>`;

    document.body.appendChild(ov);

    ov.querySelector('#psikoRawCancel').onclick = () => ov.remove();
    ov.querySelector('#psikoRawSave').onclick = () => {
      const newRaw = { IST:{}, PAPI:{}, BigFive:{} };
      ov.querySelectorAll('.psiko-raw-ist').forEach(i => {
        const v = parseFloat(i.value); if (!isNaN(v)) newRaw.IST[i.dataset.code] = v;
      });
      ov.querySelectorAll('.psiko-raw-papi').forEach(i => {
        const v = parseFloat(i.value); if (!isNaN(v)) newRaw.PAPI[i.dataset.code] = v;
      });
      ov.querySelectorAll('.psiko-raw-bf').forEach(i => {
        const v = parseFloat(i.value); if (!isNaN(v)) newRaw.BigFive[i.dataset.code] = v;
      });
      ov.remove();
      onSave(newRaw);
    };
  }

  /* ============================================================
     FIREBASE: SAVE OVERRIDES + RAW
     ============================================================ */
  async function saveOverrides(slug, category, overrides) {
    if (!fbReady()) throw new Error('Firebase belum siap');
    await firebase.database().ref('sgs_psikogram/' + slug).update({
      category, overrides, updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
  }
  async function loadOverrides(slug) {
    if (!fbReady()) return {};
    try {
      const snap = await firebase.database().ref('sgs_psikogram/' + slug).once('value');
      const d = snap.val() || {};
      return d.overrides || {};
    } catch (e) { return {}; }
  }
  async function saveRaw(slug, raw) {
    if (!fbReady()) throw new Error('Firebase belum siap');
    await firebase.database().ref('sgs_psikogram_raw/' + slug).update({
      IST: raw.IST || {}, PAPI: raw.PAPI || {}, BigFive: raw.BigFive || {},
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
  }

  /* ============================================================
     PUBLIC: renderPsikogramBox
     ============================================================ */
  window.renderPsikogramBox = async function (slug, candidateName, position) {
    const category = detectCategory(position);
    if (!category) return '';
    const [raw, overrides] = await Promise.all([fetchRawData(slug), loadOverrides(slug)]);
    return renderBox(slug, category, raw, overrides);
  };

  /* ============================================================
     HELPERS: rebuildBox from scratch
     ============================================================ */
  async function refreshBox(box) {
    const slug = box.dataset.slug;
    const category = box.dataset.category;
    const [raw, overrides] = await Promise.all([fetchRawData(slug), loadOverrides(slug)]);
    box.outerHTML = renderBox(slug, category, raw, overrides);
  }

  function showStatus(box, msg, color) {
    const el = box.querySelector('.psiko-status');
    if (!el) return;
    const orig = el.textContent;
    el.style.color = color;
    el.textContent = msg;
    setTimeout(() => { el.style.color = '#94a3b8'; el.textContent = orig; }, 2200);
  }

  /* ============================================================
     BUILD SUMMARY TEXT (untuk Copy)
     ============================================================ */
  function buildSummaryText(box) {
    const category = box.dataset.category;
    const aspects = category === 'guru' ? ASPECTS_GURU : [];
    const scores = {};
    box.querySelectorAll('.psiko-row').forEach(row => {
      const id = row.dataset.aspectId;
      const s = parseFloat(row.querySelector('.psiko-score').textContent) || 0;
      scores[id] = s;
    });

    const card = box.closest('.rf-card') || box.closest('.ac-candidate-card');
    const nameEl = card ? card.querySelector('.js-interview-link, .js-grafindo-link, .js-fgd-link') : null;
    const name = nameEl ? nameEl.getAttribute('data-name') : '(kandidat)';
    const position = nameEl ? nameEl.getAttribute('data-position') : '';

    const lines = [
      'PSIKOGRAM — POSISI GURU/DOSEN',
      'Nama   : ' + (name || '-'),
      'Posisi : ' + (position || '-'),
      ''
    ];
    const arr = [];
    aspects.forEach((asp, i) => {
      const s = scores[asp.id] !== undefined ? scores[asp.id] : 0;
      const pct = ((s/4)*100).toFixed(1);
      const ket = scoreToKet(s);
      lines.push(String(i+1).padStart(2,'0') + '. ' + asp.label);
      lines.push('    Skor: ' + s.toFixed(2) + '/4 (' + pct + '%) — ' + ket.label);
      arr.push(s);
    });
    const avg = arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    const avgPct = ((avg/4)*100).toFixed(1);
    const avgKet = scoreToKet(avg);
    lines.push('');
    lines.push('─────────────────────────────');
    lines.push('RATA-RATA: ' + avg.toFixed(2) + '/4 (' + avgPct + '%) — ' + avgKet.label);
    lines.push('Dibuat  : ' + new Date().toLocaleString('id-ID'));
    return lines.join('\n');
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
  }

  /* ============================================================
     EVENT DELEGATION
     ============================================================ */
  if (!window.__psikoDelegationAttached) {
    window.__psikoDelegationAttached = true;

    document.addEventListener('click', async function (e) {
      /* EDIT OVERRIDE */
      const editBtn = e.target.closest('.psiko-edit-btn');
      if (editBtn) {
        e.preventDefault(); e.stopPropagation();
        const box = editBtn.closest('.js-psikogram-box'); if (!box) return;
        const slug = box.dataset.slug;
        const category = box.dataset.category;
        const aspectId = editBtn.getAttribute('data-aspect-id');
        const asp = ASPECTS_GURU.find(a => a.id === aspectId); if (!asp) return;

        const row = editBtn.closest('.psiko-row');
        const autoScore = row.dataset.auto ? Number(row.dataset.auto) : null;
        const currentScore = parseFloat(row.querySelector('.psiko-score').textContent) || 0;

        openEditModal(aspectId, asp.label, currentScore, autoScore, async (v) => {
          try {
            const snap = await firebase.database().ref('sgs_psikogram/' + slug + '/overrides').once('value');
            const overrides = snap.val() || {};
            if (v === null) delete overrides[aspectId];
            else overrides[aspectId] = v;
            await saveOverrides(slug, category, overrides);
            await refreshBox(box);
            const nb = document.querySelector('.js-psikogram-box[data-slug="' + slug + '"]');
            if (nb) showStatus(nb, v === null ? '↺ Dikembalikan ke auto' : '✓ Override tersimpan', '#86efac');
          } catch (err) {
            console.error('[PSIKOGRAM]', err);
            alert('Gagal simpan: ' + err.message);
          }
        });
        return;
      }

      /* INPUT RAW */
      const rawBtn = e.target.closest('.js-psiko-input-raw');
      if (rawBtn) {
        e.preventDefault(); e.stopPropagation();
        const box = rawBtn.closest('.js-psikogram-box'); if (!box) return;
        const slug = box.dataset.slug;
        const raw = await fetchRawData(slug);
        openRawModal(slug, raw, async (newRaw) => {
          try {
            await saveRaw(slug, newRaw);
            await refreshBox(box);
            const nb = document.querySelector('.js-psikogram-box[data-slug="' + slug + '"]');
            if (nb) showStatus(nb, '✓ Data mentah tersimpan', '#86efac');
          } catch (err) {
            alert('Gagal simpan: ' + err.message);
          }
        });
        return;
      }

      /* RESET OVERRIDE */
      const resetBtn = e.target.closest('.js-psiko-reset');
      if (resetBtn) {
        e.preventDefault(); e.stopPropagation();
        const box = resetBtn.closest('.js-psikogram-box'); if (!box) return;
        if (!confirm('Hapus semua override manual? Skor kembali ke hasil auto-compute.')) return;
        const slug = box.dataset.slug;
        const category = box.dataset.category;
        try {
          await saveOverrides(slug, category, {});
          await refreshBox(box);
          const nb = document.querySelector('.js-psikogram-box[data-slug="' + slug + '"]');
          if (nb) showStatus(nb, '↺ Override dihapus', '#86efac');
        } catch (err) { alert('Gagal: ' + err.message); }
        return;
      }

      /* COPY */
      const copyBtn = e.target.closest('.js-psiko-copy');
      if (copyBtn) {
        e.preventDefault(); e.stopPropagation();
        const box = copyBtn.closest('.js-psikogram-box'); if (!box) return;
        const text = buildSummaryText(box);
        const done = () => {
          const prev = copyBtn.textContent;
          copyBtn.textContent = '✓ Tersalin';
          copyBtn.style.color = '#86efac';
          setTimeout(() => { copyBtn.textContent = prev; copyBtn.style.color = '#c4b5fd'; }, 1500);
        };
        try {
          if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
          else { fallbackCopy(text); done(); }
        } catch (err) { fallbackCopy(text); done(); }
        return;
      }
    }, true);
  }

  console.log('[PSIKOGRAM] ✓ Loaded v2 — weighted auto-compute');
})();