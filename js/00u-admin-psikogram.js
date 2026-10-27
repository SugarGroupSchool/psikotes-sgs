/* ============================================================
   js/00u-admin-psikogram.js — v4.2 (Layout v4.2 + Asesor Sig)
   🆕 v4.2 [2026-10-26]:
   - Fix layout overlap header (POSITION/AGE/NAME/DATE/EDUCATION + Photo)
   - Tabel: NO | ASPEK | SKOR | KATEGORI
   - KESIMPULAN auto-generated (atau override)
   - AREA: Modal / Perlu Diperkuat / Risiko (auto-classified)
   - Signature: Asesor / Human Capital Recruitment Staff / SGS
   - opts.contentOnly → skip header & signature (untuk unified report)
   ============================================================ */
(function () {
  'use strict';

  let __psikoConfigCache = null;

  async function __ensurePsikogramConfigLoaded() {
    if (__psikoConfigCache !== null) return __psikoConfigCache;
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      __psikoConfigCache = {};
      return __psikoConfigCache;
    }
    try {
      const snap = await firebase.database().ref('sgs_config/psikogram_config').once('value');
      __psikoConfigCache = snap.val() || {};
    } catch (e) {
      __psikoConfigCache = {};
    }
    return __psikoConfigCache;
  }

  window.__invalidatePsikogramConfigCache = function () {
    __psikoConfigCache = null;
  };

  function getAspectConfig(category) {
    if (__psikoConfigCache && __psikoConfigCache[category]) {
      const fbAspects = __psikoConfigCache[category].aspects;
      if (Array.isArray(fbAspects) && fbAspects.length > 0) return fbAspects;
    }
    const jsCfg = window.PSIKOGRAM_CONFIG || {};
    const pos = jsCfg[category];
    return (pos && Array.isArray(pos.aspects)) ? pos.aspects : [];
  }

  function getCategoryLabel(category) {
    if (__psikoConfigCache && __psikoConfigCache[category] && __psikoConfigCache[category].label) {
      return __psikoConfigCache[category].label;
    }
    const jsCfg = window.PSIKOGRAM_CONFIG || {};
    return (jsCfg[category] && jsCfg[category].label) ? jsCfg[category].label : category;
  }

  const DEFAULT_ASPECTS = getAspectConfig('guru');

  const PAPI_CONFIG = { A:{inv:false}, N:{inv:false}, G:{inv:false}, T:{inv:false}, V:{inv:false}, W:{inv:false}, F:{inv:false}, C:{inv:false}, L:{inv:false}, P:{inv:false}, I:{inv:false}, E:{inv:false}, K:{inv:true}, O:{inv:false}, S:{inv:false}, B:{inv:false}, X:{inv:false}, Z:{inv:false}, D:{inv:false}, R:{inv:false} };

  function clamp05(v){ return Math.max(0, Math.min(5, v)); }

  const AUTO_REVERSE_DIMS = {
    bigfive:  ['n'],
    papi:     [],
    kraeplin: ['tianker', 'janker'],
    typing:   ['salah', 'belum']
  };

  function __shouldReverse(source, dim) {
    const d = String(dim || '').toLowerCase();
    if (/_rev$/.test(d)) return true;
    const base = d.replace(/_rev$/, '');
    return (AUTO_REVERSE_DIMS[source] || []).includes(base);
  }

  function normIST(sw){ return typeof sw==='number' ? clamp05((sw - 75) / 10) : null; }
  function normWawancara(s){ return typeof s==='number' ? clamp05(s) : null; }
  function normFGD(s){ return typeof s==='number' ? clamp05(s * 1.25) : null; }
  function normGrafis(s){ return typeof s==='number' ? clamp05(s * 1.25) : null; }
  function normPAPI(s, inv){ if(typeof s!=='number')return null; return clamp05(((inv?9-s:s)/9)*5); }
  function normBigFive(s, inv){ if(typeof s!=='number')return null; return clamp05(((inv?100-s:s)/100)*5); }
  function normSubject(s){ if(typeof s!=='number'||s<=0)return null; return clamp05(s * 1.25); }

     function detectCategory(p) {
    if (!p) return null;
    const s = String(p).toLowerCase().trim();
    const jsCfg = window.PSIKOGRAM_CONFIG || {};
    const fbCfg = __psikoConfigCache || {};
    const allKeys = new Set([...Object.keys(jsCfg), ...Object.keys(fbCfg)]);

    const FALLBACK_KW = {
      guru:         ['guru', 'dosen', 'teacher', 'pengajar', 'lecturer', 'pendidik'],
      admin:        ['admin', 'administrator', 'sekretaris', 'tata usaha', 'office', 'klerk', 'administrasi'],
      it:           ['it staff', 'it support', 'programmer', 'developer', 'software', 'network', 'staff it'],
      welder:       ['welder', 'welding', ' las '],
      technical:    ['technical', 'technical staff', 'teknis', 'teknisi', 'operator', 'maintenance', 'baker', 'wood'],
      housekeeping: ['housekeeping', 'cleaning', 'kebersihan', 'gardener', 'kebun'],
      security:     ['security', 'satpam', 'keamanan'],
      driver:       ['driver', 'pengemudi', 'sopir']
    };

    for (const key of allKeys) {
      const jsPos = jsCfg[key] || {};

      /* Priority 1: explicit matchKeywords */
      const kws = Array.isArray(jsPos.matchKeywords) ? jsPos.matchKeywords : [];
      for (const kw of kws) {
        if (s.includes(String(kw).toLowerCase())) return key;
      }

      /* Priority 2: fallback keywords per category */
      const fkws = FALLBACK_KW[key] || [];
      for (const kw of fkws) {
        if (s.includes(kw)) return key;
      }

      /* Priority 3: exact key name in position */
      if (s.includes(key.toLowerCase())) return key;
    }
    return null;
  }

  function scoreToKet(s) {
    const v = Number(s) || 0;
    if (v >= 4.5) return { label: 'SANGAT BAIK', color: '#6ee7b7', bg: 'rgba(16,185,129,.18)', border: 'rgba(16,185,129,.55)', pdfColor: [15, 118, 110] };
    if (v >= 3.4) return { label: 'BAIK',        color: '#86efac', bg: 'rgba(34,197,94,.15)',  border: 'rgba(34,197,94,.45)',  pdfColor: [22, 101, 52] };
    if (v >= 2.5) return { label: 'CUKUP',       color: '#fcd34d', bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.45)', pdfColor: [161, 98, 7]  };
    if (v >= 1.5) return { label: 'KURANG',      color: '#fca5a5', bg: 'rgba(239,68,68,.15)',  border: 'rgba(239,68,68,.45)',  pdfColor: [185, 28, 28] };
    return { label: 'SANGAT KURANG', color: '#fca5a5', bg: 'rgba(239,68,68,.22)', border: 'rgba(239,68,68,.55)', pdfColor: [153, 27, 27] };
  }

  function barGradient(p) {
    if (p >= 87.5) return 'linear-gradient(90deg,#16a34a,#22c55e)';
    if (p >= 75)   return 'linear-gradient(90deg,#f59e0b,#fbbf24)';
    if (p >= 50)   return 'linear-gradient(90deg,#ea580c,#f97316)';
    return 'linear-gradient(90deg,#dc2626,#ef4444)';
  }

  function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function fbReady(){ return typeof firebase!=='undefined' && firebase.apps && firebase.apps.length>0; }

  async function fetchRawData(slug) {
    const raw = { IST:{}, PAPI:{}, BigFive:{}, Grafis:{}, Wawancara:null, FGD:null, Subject:null, _sources: { IST:false, PAPI:false, BigFive:false, Wawancara:false, FGD:false, Grafis:false, Subject:false } };
    if (!fbReady()) return raw;
    const dashed = String(slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
    const candidates = [slug, dashed].filter((v, i, a) => v && a.indexOf(v) === i);
    async function _fetchFirst(path) {
      for (const s of candidates) {
        try { const snap = await firebase.database().ref(path + '/' + s).once('value'); const val = snap.val(); if (val) return val; } catch (e) {}
      }
      return null;
    }
    try {
      const d = await _fetchFirst('sgs_psikogram_raw');
      if (d) {
        if (d.IST && Object.keys(d.IST).length) { raw.IST = d.IST; raw._sources.IST = true; }
        if (d.PAPI && Object.keys(d.PAPI).length) { raw.PAPI = d.PAPI; raw._sources.PAPI = true; }
        if (d.BigFive && Object.keys(d.BigFive).length) { raw.BigFive = d.BigFive; raw._sources.BigFive = true; }
        if (d.Subject && typeof d.Subject === 'number' && d.Subject > 0) { raw.Subject = d.Subject; raw._sources.Subject = true; }
      }
    } catch (e) {}
    try {
      const d = await _fetchFirst('sgs_scores');
      if (d) {
        if (!raw._sources.IST && d.IST && Object.keys(d.IST).length) { raw.IST = d.IST; raw._sources.IST = true; }
        if (!raw._sources.PAPI && d.PAPI && Object.keys(d.PAPI).length) { raw.PAPI = d.PAPI; raw._sources.PAPI = true; }
        if (!raw._sources.BigFive && d.BigFive && Object.keys(d.BigFive).length) { raw.BigFive = d.BigFive; raw._sources.BigFive = true; }
        if (!raw._sources.Subject) { const subVal = Number(d.Subject ?? d.SUBJECT ?? d.subject); if (subVal > 0) { raw.Subject = subVal; raw._sources.Subject = true; } }
      }
    } catch (e) {}
    try { const d = await _fetchFirst('sgs_interviews'); if (d) { raw.WawancaraDetails = {}; let totalAvg = 0, count = 0; for (const iv of Object.keys(d)) { const item = d[iv]; if (item.scores) { for (const [kriteria, skor] of Object.entries(item.scores)) { const key = String(kriteria).toUpperCase().trim(); if (!raw.WawancaraDetails[key]) raw.WawancaraDetails[key] = []; raw.WawancaraDetails[key].push(Number(skor)); } } if (item.average) { totalAvg += Number(item.average); count++; } } for (const key in raw.WawancaraDetails) { const arr = raw.WawancaraDetails[key]; raw.WawancaraDetails[key] = arr.reduce((a,b)=>a+b,0)/arr.length; } if (count > 0) { raw.Wawancara = totalAvg / count; raw._sources.Wawancara = true; } } } catch (e) {}
    try { const d = await _fetchFirst('sgs_fgd'); if (d) { const avgs = Object.values(d).map(x => x && Number(x.average)).filter(v => !isNaN(v) && v > 0); if (avgs.length) { raw.FGD = avgs.reduce((a,b)=>a+b,0)/avgs.length; raw._sources.FGD = true; } } } catch (e) {}
    try {
      const d = await _fetchFirst('sgs_grafis_interp');
      if (d) {
        const katScores = {};
        for (const assessor of Object.keys(d)) { const a = d[assessor]; if (a && a.autoScoring && Array.isArray(a.autoScoring.perKategori)) { a.autoScoring.perKategori.forEach(pk => { if (pk && pk.kategori && typeof pk.skor === 'number' && !isNaN(pk.skor)) { if (!katScores[pk.kategori]) katScores[pk.kategori] = []; katScores[pk.kategori].push(pk.skor); } }); } }
        for (const [kat, arr] of Object.entries(katScores)) { raw.Grafis[kat] = arr.reduce((a,b)=>a+b,0) / arr.length; }
        if (Object.keys(raw.Grafis).length) raw._sources.Grafis = true;
      }
    } catch (e) {}
    try {
      const d = await _fetchFirst('sgs_subject_assessments');
      if (d && d.assessments) {
        const ratings = Object.values(d.assessments).map(a => Number(a && a.rating)).filter(r => !isNaN(r) && r >= 1 && r <= 4);
        if (ratings.length > 0) { raw.Subject = ratings.reduce((a, b) => a + b, 0) / ratings.length; raw._sources.Subject = true; raw._subjectSource = 'korektor'; raw._subjectCount = ratings.length; }
      }
    } catch (e) {}
    if (!raw.Subject) { try { const r = await _fetchFirst('sgs_subject_ratings'); if (r) { const rating = Number(r.rating ?? r); if (rating > 0) { raw.Subject = rating; raw._sources.Subject = true; raw._subjectSource = 'admin'; raw._subjectCount = 1; } } } catch (e) {} }
    return raw;
  }

  async function loadWeights(slug) {
    if (!fbReady()) return {};
    try {
      const snap = await firebase.database().ref('sgs_psikogram_weights/' + slug).once('value');
      const val = snap.val();
      return (val && val.weights) ? val.weights : {};
    } catch (e) { return {}; }
  }

  async function saveWeights(slug, weights) {
    if (!fbReady()) throw new Error('Firebase belum siap');
    await firebase.database().ref('sgs_psikogram_weights/' + slug).update({ weights, updatedAt: firebase.database.ServerValue.TIMESTAMP });
  }

  async function loadOverrides(slug) { if (!fbReady()) return {}; try { const snap = await firebase.database().ref('sgs_psikogram/' + slug + '/overrides').once('value'); return snap.val() || {}; } catch (e) { return {}; } }
  async function saveOverrides(slug, overrides, category) { if (!fbReady()) throw new Error('Firebase belum siap'); await firebase.database().ref('sgs_psikogram/' + slug).update({ category: category || 'guru', overrides, updatedAt: firebase.database.ServerValue.TIMESTAMP }); }
  async function saveRaw(slug, raw) { if (!fbReady()) throw new Error('Firebase belum siap'); await firebase.database().ref('sgs_psikogram_raw/' + slug).update({ IST: raw.IST || {}, PAPI: raw.PAPI || {}, BigFive: raw.BigFive || {}, updatedAt: firebase.database.ServerValue.TIMESTAMP }); }

  function getEffectiveWeights(aspect, customWeights) { const w = customWeights && customWeights[aspect.id]; if (w && typeof w === 'object') return w; return aspect.weights || {}; }

  function computeAspect(aspect, raw, effectiveWeights) {
    const parts = [];
    const W = effectiveWeights || {};
    if (aspect.ist && aspect.ist.length && raw._sources.IST && W.IST) { const vals = aspect.ist.map(c => normIST(raw.IST[c])).filter(v => v !== null); if (vals.length) parts.push({ src:'IST', val: vals.reduce((a,b)=>a+b,0)/vals.length, w: W.IST }); }
    if (aspect.papi && aspect.papi.length && raw._sources.PAPI && W.PAPI) { const vals = aspect.papi.map(c => normPAPI(raw.PAPI[c], (PAPI_CONFIG[c]||{}).inv)).filter(v => v !== null); if (vals.length) parts.push({ src:'PAPI', val: vals.reduce((a,b)=>a+b,0)/vals.length, w: W.PAPI }); }
    if (aspect.bigfive && aspect.bigfive.length && raw._sources.BigFive && W.BigFive) { const vals = aspect.bigfive.map(c => {
  const base = c.replace(/_rev$/i, '');
  const inv = __shouldReverse('bigfive', c);
  return normBigFive(raw.BigFive[base], inv);
}).filter(v => v !== null); if (vals.length) parts.push({ src:'BigFive', val: vals.reduce((a,b)=>a+b,0)/vals.length, w: W.BigFive }); }
    if (raw._sources.Wawancara && W.Wawancara) { let valToUse = raw.Wawancara; if (raw.WawancaraDetails) { const searchKey = aspect.label.toUpperCase().trim(); if (raw.WawancaraDetails[searchKey] !== undefined) { valToUse = raw.WawancaraDetails[searchKey]; } else { for (const key in raw.WawancaraDetails) { if (key.includes(searchKey) || searchKey.includes(key)) { valToUse = raw.WawancaraDetails[key]; break; } } } } const v = normWawancara(valToUse); if (v !== null) parts.push({ src:'Wawancara', val: v, w: W.Wawancara }); }
    if (raw._sources.FGD && W.FGD) { const v = normFGD(raw.FGD); if (v !== null) parts.push({ src:'FGD', val: v, w: W.FGD }); }
        if (aspect.grafisCat && raw._sources.Grafis && W.Grafis) {
      // Pencocokan pintar: cari key di raw.Grafis yang mirip dengan aspect.grafisCat
      const normalizeStr = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const targetKey = normalizeStr(aspect.grafisCat);
      
      let foundVal = null;
      for (const [rawKey, rawVal] of Object.entries(raw.Grafis)) {
        if (normalizeStr(rawKey) === targetKey) { foundVal = rawVal; break; }
      }
      
      if (foundVal !== null) {
        const v = normGrafis(foundVal);
        if (v !== null) parts.push({ src:'Grafis', val: v, w: W.Grafis });
      }
    }
    if (aspect.subjectTest && raw._sources.Subject && W.SubjectTest) {
      const v = normSubject(raw.Subject);
      if (v !== null) { const srcLabel = raw._subjectSource === 'korektor' ? `SubjectTest (${raw._subjectCount} korektor)` : 'SubjectTest (admin)'; parts.push({ src: srcLabel, val: v, w: W.SubjectTest }); }
    }
    const totalW = parts.reduce((a,p)=>a+p.w, 0);
    if (totalW === 0) return { score: null, parts };
    return { score: parts.reduce((a,p)=>a+p.val*p.w, 0) / totalW, parts, totalW };
  }

  function computeAll(raw, overrides, customWeights, category) {
    overrides = overrides || {};
    customWeights = customWeights || {};
    const aspects = getAspectConfig(category) || DEFAULT_ASPECTS;
    return aspects.map(a => {
      const effW = getEffectiveWeights(a, customWeights);
      const c = computeAspect(a, raw, effW);
      const autoScore = c.score !== null ? Math.round(c.score * 100) / 100 : null;
      const override = overrides[a.id] !== undefined && overrides[a.id] !== null ? Number(overrides[a.id]) : null;
      const finalScore = override !== null ? override : autoScore;
      return { aspect: a, parts: c.parts, totalW: c.totalW, autoScore, override, finalScore, effectiveWeights: effW, isCustomWeight: !!customWeights[a.id] };
    });
  }

  function renderTable(computed) {
    return computed.map((item, idx) => {
      const { aspect, parts, finalScore, override, effectiveWeights, isCustomWeight } = item;
      const score = finalScore !== null ? finalScore : 0;
      const pct = Math.round((score/5)*1000)/10;
      const ket = scoreToKet(score);
      const isOverridden = override !== null;
      const wBadge = Object.entries(effectiveWeights || {}).filter(([k,v]) => v > 0).map(([k,v]) => `${k}=${v}%`).join(' · ');
      const partsHTML = parts.length ? parts.map(p => `<div style="display:flex;justify-content:space-between;font-size:9.5px;color:#94a3b8;padding:2px 0;"><span>• ${escHtml(p.src)}${p.w?' (w='+p.w+')':''}</span><span style="font-family:monospace;color:#cbd5e1;">${p.val.toFixed(2)} → ${Math.round(p.val/4*100)}%</span></div>`).join('') : '<div style="font-size:9.5px;color:#fca5a5;padding:2px 0;">⚠️ Tidak ada data</div>';
      return `
        <div class="psiko-row" data-aspect-id="${aspect.id}" data-auto="${item.autoScore!==null?item.autoScore.toFixed(2):''}" style="display:grid;grid-template-columns:30px minmax(0,1fr) 62px 78px 62px 70px;gap:10px;align-items:center;padding:10px 14px;background:rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.05);">
          <div style="font-size:10px;font-weight:800;color:#64748b;text-align:center;">${String(idx+1).padStart(2,'0')}</div>
          <div style="min-width:0;">
            <div style="font-size:11.5px;font-weight:700;color:#e2e8f0;line-height:1.35;margin-bottom:5px;">${escHtml(aspect.label)} ${isOverridden ? '<span style="margin-left:6px;font-size:9px;color:#fbbf24;">✎ manual</span>' : ''} ${isCustomWeight ? '<span style="margin-left:6px;font-size:9px;color:#a78bfa;">⚙️ custom</span>' : ''}</div>
            <div style="height:5px;background:rgba(255,255,255,.07);border-radius:999px;overflow:hidden;margin-bottom:6px;"><div class="psiko-bar" style="width:${pct}%;height:100%;background:${barGradient(pct)};border-radius:inherit;"></div></div>
            <details style="cursor:pointer;"><summary style="font-size:9px;color:#64748b;font-weight:700;outline:none;">▸ breakdown · bobot: ${escHtml(wBadge||'-')}</summary><div style="margin-top:4px;padding:6px 8px;background:rgba(0,0,0,.22);border-radius:6px;">${partsHTML}</div></details>
          </div>
          <div class="psiko-pct" style="font-size:13px;font-weight:800;color:#a5b4fc;text-align:right;font-variant-numeric:tabular-nums;">${pct.toFixed(1)}%</div>
          <div class="psiko-score" style="font-size:11.5px;font-weight:800;color:#e2e8f0;text-align:center;font-variant-numeric:tabular-nums;">${score.toFixed(2)} / 5</div>
          <div style="text-align:center;"><span class="psiko-ket" style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:9px;font-weight:900;background:${ket.bg};border:1px solid ${ket.border};color:${ket.color};white-space:nowrap;">${ket.label}</span></div>
          <div style="display:flex;gap:4px;justify-content:center;">
            <button class="psiko-weight-btn" data-aspect-id="${aspect.id}" title="Edit bobot" style="width:30px;height:30px;display:grid;place-items:center;background:rgba(167,139,250,.18);border:1px solid rgba(167,139,250,.45);border-radius:7px;color:#c4b5fd;font-size:13px;cursor:pointer;font-family:inherit;padding:0;">⚙️</button>
            <button class="psiko-edit-btn" data-aspect-id="${aspect.id}" title="Edit skor" style="width:30px;height:30px;display:grid;place-items:center;background:rgba(99,102,241,.18);border:1px solid rgba(99,102,241,.45);border-radius:7px;color:#a5b4fc;font-size:13px;cursor:pointer;font-family:inherit;padding:0;">✎</button>
          </div>
        </div>`;
    }).join('');
  }

  async function openPsikogramModal(slug, candidateName, position) {
    await __ensurePsikogramConfigLoaded();
    const old = document.getElementById('psikoModal'); if (old) old.remove();
    const [raw, overrides, customWeights] = await Promise.all([fetchRawData(slug), loadOverrides(slug), loadWeights(slug)]);
    const __cat = detectCategory(position) || 'guru';
    const computed = computeAll(raw, overrides, customWeights, __cat);
    const valid = computed.map(c => c.finalScore).filter(s => s !== null);
    const avg = valid.length ? valid.reduce((a,b)=>a+b,0)/valid.length : 0;
    const avgPct = (avg/5)*100;
    const avgKet = scoreToKet(avg);
    const subjectLabel = raw._subjectSource === 'korektor' ? `Subject (${raw._subjectCount || 1} korektor)` : 'Subject (admin)';
    const srcChips = [['IST', raw._sources.IST], ['PAPI', raw._sources.PAPI], ['BigFive', raw._sources.BigFive], ['Wawancara', raw._sources.Wawancara], ['FGD', raw._sources.FGD], ['Grafis', raw._sources.Grafis], [subjectLabel, raw._sources.Subject]].map(([n, ok]) => `<span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:800;background:${ok?'rgba(34,197,94,.15)':'rgba(148,163,184,.1)'};border:1px solid ${ok?'rgba(34,197,94,.4)':'rgba(148,163,184,.25)'};color:${ok?'#86efac':'#94a3b8'};white-space:nowrap;">${ok?'✓':'×'} ${n}</span>`).join('');

    const ov = document.createElement('div');
    ov.id = 'psikoModal';
    ov.setAttribute('data-slug', slug);
    ov.setAttribute('data-name', candidateName);
    ov.setAttribute('data-position', position || '');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';
    ov.innerHTML = `
      <div style="width:min(920px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.4);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;">
        <div style="padding:16px 20px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <div style="width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:11px;font-size:20px;">📊</div>
          <div style="flex:1;min-width:0;"><div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">PSIKOGRAM · POSISI GURU/DOSEN</div><div style="font-size:16px;font-weight:900;color:#fff;margin-top:2px;word-break:break-word;">${escHtml(candidateName)}</div><div style="font-size:11px;opacity:.85;margin-top:2px;">💼 ${escHtml(position||'-')}</div></div>
          <button id="psikoCloseBtn" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>
        </div>
        <div style="padding:12px 20px;background:rgba(0,0,0,.28);border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><span style="font-size:9px;font-weight:800;color:#64748b;letter-spacing:1px;">SUMBER:</span>${srcChips}</div>
          <div class="psiko-avg-chip" style="padding:6px 12px;background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.4);border-radius:999px;font-size:11px;font-weight:800;color:#a5b4fc;display:flex;align-items:center;gap:8px;"><span>Rata-rata: <b style="color:#fff;">${avg.toFixed(2)}/5</b> · ${avgPct.toFixed(1)}%</span><span style="padding:2px 8px;background:${avgKet.bg};border:1px solid ${avgKet.border};color:${avgKet.color};border-radius:999px;font-size:9.5px;font-weight:900;">${avgKet.label}</span></div>
        </div>
        <div style="display:grid;grid-template-columns:30px minmax(0,1fr) 62px 78px 62px 70px;gap:10px;padding:8px 14px;background:rgba(0,0,0,.32);border-bottom:1px solid rgba(255,255,255,.05);font-size:9.5px;font-weight:900;letter-spacing:.8px;color:#64748b;"><div style="text-align:center;">#</div><div>ASPEK</div><div style="text-align:right;">%</div><div style="text-align:center;">SKOR</div><div style="text-align:center;">KET</div><div style="text-align:center;">AKSI</div></div>
        <div class="psiko-modal-body" style="flex:1;overflow-y:auto;"><div class="psiko-rows">${renderTable(computed)}</div></div>
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

  function openWeightModal(aspect, currentWeights, onSave) {
    const old = document.getElementById('psikoWeightModal'); if (old) old.remove();
    const sources = [];
    if (aspect.ist && aspect.ist.length) sources.push('IST');
    if (aspect.papi && aspect.papi.length) sources.push('PAPI');
    if (aspect.bigfive && aspect.bigfive.length) sources.push('BigFive');
    if (aspect.grafisCat) sources.push('Grafis');
    if (aspect.subjectTest) sources.push('SubjectTest');
    if ((aspect.weights || {}).Wawancara !== undefined) sources.push('Wawancara');
    if ((aspect.weights || {}).FGD !== undefined) sources.push('FGD');
    const uniqueSources = [...new Set(sources)];
    const w = Object.assign({}, aspect.weights || {}, currentWeights || {});

    function inputRow(src) {
      const v = w[src] !== undefined ? w[src] : 0;
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(255,255,255,.04);border-radius:8px;margin-bottom:6px;"><label style="flex:1;font-size:12px;font-weight:800;color:#e2e8f0;">${src}</label><input type="number" class="psiko-weight-input" data-src="${src}" value="${v}" min="0" max="100" step="1" style="width:80px;padding:8px 10px;background:rgba(255,255,255,.08);border:1px solid rgba(99,102,241,.4);border-radius:8px;color:#fff;font-family:inherit;font-size:14px;font-weight:800;text-align:center;outline:none;"><span style="font-size:12px;color:#94a3b8;font-weight:700;">%</span></div>`;
    }

    const ov = document.createElement('div');
    ov.id = 'psikoWeightModal';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483648;background:rgba(10,20,35,.92);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';
    ov.innerHTML = `<div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(167,139,250,.45);border-radius:18px;padding:24px;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;">
      <div style="font-size:10.5px;font-weight:900;color:#c4b5fd;letter-spacing:1.8px;margin-bottom:8px;">⚙️ EDIT BOBOT PROPORSI</div>
      <div style="font-size:13.5px;font-weight:800;color:#fff;margin-bottom:14px;line-height:1.4;">${escHtml(aspect.label)}</div>
      <div style="font-size:11px;color:#94a3b8;margin-bottom:14px;line-height:1.5;">Atur proporsi tiap tes. Total harus 100%. Kosongkan (=0) untuk menonaktifkan sumber.</div>
      <div>${uniqueSources.map(inputRow).join('')}</div>
      <div class="psiko-weight-total" style="margin-top:10px;padding:10px 12px;background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.4);border-radius:10px;font-size:13px;font-weight:800;text-align:center;color:#c4b5fd;">Total: 0%</div>
      <div style="display:flex;gap:10px;margin-top:16px;">
        <button id="psikoWeightCancel" style="flex:1;padding:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Batal</button>
        <button id="psikoWeightSave" style="flex:2;padding:13px;background:linear-gradient(135deg,#8b5cf6,#a78bfa);border:0;border-radius:10px;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">✓ Simpan Bobot</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
    const totalEl = ov.querySelector('.psiko-weight-total');
    const inputs = ov.querySelectorAll('.psiko-weight-input');
    function updateTotal() {
      let total = 0; inputs.forEach(i => { const v = parseFloat(i.value) || 0; total += v; });
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
        newW[i.dataset.src] = v;
      });
      const total = Object.values(newW).reduce((a,b)=>a+b,0);
      if (total !== 100) { if (!confirm('Total bobot ' + total + '% (bukan 100%). Tetap simpan?')) return; }
      ov.remove(); onSave(newW);
    };
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  }

  function openEditModal(aspectId, aspectLabel, currentScore, autoScore, onSave) {
    const old = document.getElementById('psikoEditModal'); if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'psikoEditModal';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483648;background:rgba(10,20,35,.9);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';
    ov.innerHTML = `<div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.35);border-radius:18px;padding:24px;box-shadow:0 30px 90px rgba(0,0,0,.6);color:#e2e8f0;">
      <div style="font-size:10.5px;font-weight:900;color:#a5b4fc;letter-spacing:1.8px;margin-bottom:8px;">✎ OVERRIDE SKOR</div>
      <div style="font-size:13.5px;font-weight:800;color:#fff;margin-bottom:12px;line-height:1.4;">${escHtml(aspectLabel)}</div>
      ${autoScore !== null ? `<div style="padding:10px 12px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.3);border-radius:10px;font-size:11.5px;color:#c4b5fd;margin-bottom:14px;">🤖 Auto: <b style="color:#fff;">${Number(autoScore).toFixed(2)}/4</b></div>` : `<div style="padding:10px 12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:10px;font-size:11.5px;color:#fca5a5;margin-bottom:14px;">⚠️ Data tes tidak tersedia</div>`}
      <input id="psikoEditInput" type="number" min="0" max="4" step="0.01" value="${Number(currentScore).toFixed(2)}" style="width:100%;padding:14px 16px;background:rgba(255,255,255,.06);border:2px solid rgba(99,102,241,.45);border-radius:12px;color:#fff;font-family:inherit;font-size:22px;font-weight:800;text-align:center;outline:none;box-sizing:border-box;">
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
    ov.innerHTML = `<div style="width:min(720px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.35);border-radius:18px;padding:24px;box-shadow:0 30px 90px rgba(0,0,0,.6);color:#e2e8f0;margin:20px auto;">
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
     PDF HELPERS (v4.2)
     ============================================================ */
    async function __fetchPsikogramExtras(slug) {
    const extras = { age: null, address: null, education: null, photoDataUrl: null, conclusion: null };
    if (!fbReady()) return extras;
    const dashed = String(slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
    const candidates = [slug, dashed].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const s of candidates) {
      try {
        const snap = await firebase.database().ref('sgs_candidate_status/' + s).once('value');
        const d = snap.val();
        if (d) {
          extras.age = d.age || extras.age;
          extras.address = d.addressCurrent || d.addressKTP || extras.address;
          extras.education = d.education || extras.education;
          extras.photoDataUrl = d.photoDataUrl || d.passPhotoDataUrl || extras.photoDataUrl;
          extras.conclusion = d.conclusion || extras.conclusion;
        }
      } catch (e) {}
    }

    /* Fallback: age dari IST_age kalau belum ada */
    if (!extras.age) {
      for (const s of candidates) {
        try {
          const snap = await firebase.database().ref('sgs_scores/' + s + '/IST_age').once('value');
          const v = snap.val();
          if (v) { extras.age = v; break; }
        } catch (e) {}
      }
    }
    return extras;
  }
  window.__fetchPsikogramExtras = __fetchPsikogramExtras;

  function __classifyAspects(computed) {
    const valid = computed.filter(c => c.finalScore !== null);
    return {
      modal:     valid.filter(c => c.finalScore >= 3.4),
      penguatan: valid.filter(c => c.finalScore >= 2.5 && c.finalScore < 3.4),
      risiko:    valid.filter(c => c.finalScore < 2.5)
    };
  }

  function __buildAutoConclusion(computed, position, avg, kat) {
    const posLabel = (function() {
      try { return getCategoryLabel(detectCategory(position) || 'guru') || position || 'posisi ini'; }
      catch (e) { return position || 'posisi ini'; }
    })();
    const cls = __classifyAspects(computed);
    const modalNames = cls.modal.map(c => c.aspect.label).slice(0, 5);
    const penguatanNames = cls.penguatan.map(c => c.aspect.label).slice(0, 3);
    const risikoNames = cls.risiko.map(c => c.aspect.label).slice(0, 3);

    let text = 'Berdasarkan hasil asesmen ' + posLabel + ', kandidat memperoleh skor rata-rata ' + avg.toFixed(2) + ' dari 5 dengan kategori ' + kat + '. ';
    if (avg >= 3.4) {
      text += 'Secara umum, kesiapan kandidat dalam menjalankan peran sebagai ' + (position || 'kandidat') + ' berada pada taraf baik. ';
    } else if (avg >= 2.5) {
      text += 'Secara umum, kesiapan kandidat dalam menjalankan peran sebagai ' + (position || 'kandidat') + ' berada pada taraf cukup. ';
    } else {
      text += 'Secara umum, kesiapan kandidat dalam menjalankan peran sebagai ' + (position || 'kandidat') + ' masih perlu ditingkatkan. ';
    }
    text += 'Profil tersebut menggambarkan kapasitas kandidat dalam menjalankan tuntutan teknis, administratif, kognitif, interpersonal, dan perilaku kerja. ';
    if (modalNames.length > 0) text += 'Aspek yang menjadi modal kerja utama kandidat adalah ' + modalNames.join(', ') + '. ';
    if (penguatanNames.length > 0) text += 'Sedangkan aspek yang masih memerlukan penguatan adalah ' + penguatanNames.join(', ') + '. ';
    if (risikoNames.length > 0) {
      text += 'Terdapat aspek yang termasuk area risiko, yaitu ' + risikoNames.join(', ') + '. ';
    } else {
      text += 'Tidak terdapat aspek pada kategori Kurang atau Kurang Sekali. ';
    }
    text += 'Distribusi skor pada setiap aspek perlu diperhatikan karena nilai rata-rata dapat menutupi variasi kompetensi yang cukup besar. ';
    text += 'Hasil asesmen ini perlu digunakan untuk memahami modal kerja, kebutuhan pengembangan, dan potensi risiko kandidat secara proporsional. ';
    text += 'Keputusan akhir tetap perlu mempertimbangkan kesesuaian profil kandidat dengan tuntutan jabatan, beban kerja, sistem kerja unit, dan standar kompetensi yang ditetapkan lembaga.';
    return text;
  }

    async function generatePsikogramPDF(candidateName, position, computed, opts) {
    opts = opts || {};
    if (typeof window.loadPdfLibs === 'function') await window.loadPdfLibs();
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF tidak tersedia');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 15;
    const CW = PW - 2 * M;
    let y = M;

    const valid = computed.filter(c => c.finalScore !== null);
    const avg = valid.length ? valid.reduce((a, b) => a + (b.finalScore || 0), 0) / valid.length : 0;
    const avgKet = scoreToKet(avg);
    const classes = __classifyAspects(computed);

    function __ensurePage(need) {
      if (y + need > PH - 20) { doc.addPage(); y = M; return true; }
      return false;
    }

    /* ---- SECTION TITLE ---- */
    if (!opts.contentOnly) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(30, 58, 138);
      doc.text('PSIKOGRAM', M, y); y += 5;
      doc.setDrawColor(30, 58, 138); doc.setLineWidth(0.6);
      doc.line(M, y, M + 60, y); doc.setLineWidth(0.2); y += 6;
    } else {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(30, 58, 138);
      doc.text('HASIL PSIKOGRAM', M, y); y += 5;
      doc.setDrawColor(30, 58, 138); doc.setLineWidth(0.6);
      doc.line(M, y, M + 60, y); doc.setLineWidth(0.2); y += 6;
    }

    /* ---- COMPACT INFO KANDIDAT (½ tinggi) ---- */
    const age = opts.age;
    const address = opts.address;
    const photoDataUrl = opts.photoDataUrl;
    const hasPhoto = !!(photoDataUrl && String(photoDataUrl).length > 50);

    const photoW = 25, photoH = 33;
    const photoX = PW - M - photoW;
    const photoY = y;
    const textRightEdge = hasPhoto ? (photoX - 5) : (PW - M);
    const textWidth = textRightEdge - M;

    /* Photo */
    if (hasPhoto) {
      try {
        const imgType = /^data:image\/png/i.test(photoDataUrl) ? 'PNG' : 'JPEG';
        doc.addImage(photoDataUrl, imgType, photoX, photoY, photoW, photoH);
        doc.setDrawColor(200); doc.setLineWidth(0.3);
        doc.rect(photoX, photoY, photoW, photoH, 'S');
      } catch (e) { console.warn('[PSIKO] Photo add failed:', e.message); }
    }

    /* Row 1: POSITION | AGE */
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139);
    doc.text('POSITION', M, y);
    doc.text('AGE', M + textWidth * 0.55, y);
    y += 3.5;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 41, 59);
    doc.text(String(position || '-'), M, y);
    doc.text(age ? String(age) : '-', M + textWidth * 0.55, y);
    y += 6.5;

    /* Row 2: NAME */
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139);
    doc.text('NAME', M, y); y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(30, 41, 59);
    const nameLines = doc.splitTextToSize(String(candidateName || '-'), textWidth);
    nameLines.forEach(line => { doc.text(line, M, y); y += 6; });
    y += 1;

    /* Row 3: ADDRESS */
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139);
    doc.text('ADDRESS', M, y); y += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
    const addrLines = doc.splitTextToSize(String(address || '-'), textWidth);
    addrLines.forEach(line => { doc.text(line, M, y); y += 4.2; });

    /* Align header bottom with photo */
    y = Math.max(y, hasPhoto ? (photoY + photoH + 2) : y);
    y += 4;
    doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 5;

    /* ---- SUMMARY BOX ---- */
    doc.setFillColor(238, 242, 255); doc.setDrawColor(99, 102, 241);
    doc.rect(M, y, CW, 12, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(67, 56, 202);
    doc.text('RATA-RATA: ' + avg.toFixed(2) + ' / 5.00', M + 4, y + 5);
    doc.setFontSize(9);
    doc.text('KATEGORI: ' + avgKet.label, M + 4, y + 10);
    y += 15;

    /* ---- TABLE ---- */
    const colNO = 15, colASPEK = 85, colSKOR = 25, colKATEGORI = 55;
    const xNO = M, xASPEK = M + colNO, xSKOR = xASPEK + colASPEK, xKATEGORI = xSKOR + colSKOR;

    doc.setFillColor(59, 130, 246); doc.rect(M, y, CW, 7, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('NO', xNO + colNO / 2, y + 5, { align: 'center' });
    doc.text('ASPEK', xASPEK + 3, y + 5);
    doc.text('SKOR', xSKOR + colSKOR / 2, y + 5, { align: 'center' });
    doc.text('KATEGORI', xKATEGORI + colKATEGORI - 3, y + 5, { align: 'right' });
    y += 7;

    computed.forEach(function(item, i) {
      const score = item.finalScore !== null ? item.finalScore : 0;
      const ket = scoreToKet(score);
      const wrappedName = doc.splitTextToSize(String(item.aspect.label || '-'), colASPEK - 6);
      const rowH = Math.max(7, 3 + wrappedName.length * 4);
      if (y + rowH > PH - 25) { doc.addPage(); y = M; }
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(M, y, CW, rowH, 'F'); }
      doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      doc.text(String(i + 1).padStart(2, '0'), xNO + colNO / 2, y + 4.5, { align: 'center' });
      wrappedName.forEach(function(line, li) { doc.text(line, xASPEK + 3, y + 4.5 + li * 4); });
      doc.setFont('helvetica', 'bold');
      doc.text(score.toFixed(2), xSKOR + colSKOR / 2, y + 4.5, { align: 'center' });
      const k = ket.pdfColor;
      doc.setTextColor(k[0], k[1], k[2]);
      doc.text(ket.label, xKATEGORI + colKATEGORI - 3, y + 4.5, { align: 'right' });
      y += rowH;
    });
    y += 6;

    /* ---- KESIMPULAN ---- */
    __ensurePage(25);
    doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(30, 58, 138);
    doc.text('KESIMPULAN', M, y); y += 5;
    const conclusionText = opts.conclusion || __buildAutoConclusion(computed, position, avg, avgKet.label);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
    const conclusionLines = doc.splitTextToSize(conclusionText, CW);
    conclusionLines.forEach(function(line) {
      if (y + 4.5 > PH - 20) { doc.addPage(); y = M; }
      doc.text(line, M, y); y += 4.2;
    });
    y += 4;

    /* ---- AREA SECTIONS ---- */
    function __renderArea(title, items, color) {
      if (items.length === 0 && title !== 'KEKURANGAN/AREA RISIKO') return;
      __ensurePage(15);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(title, M, y); y += 4.5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(30, 41, 59);
      if (items.length === 0) {
        doc.text('- Tidak terdapat aspek pada kategori ini.', M + 2, y); y += 4.5; return;
      }
      items.forEach(function(item) {
        if (y + 4.5 > PH - 20) { doc.addPage(); y = M; }
        const scoreText = item.finalScore !== null ? ' (' + Number(item.finalScore).toFixed(2) + ')' : '';
        const line = '- ' + (item.aspect.label || '-') + scoreText;
        const wrapped = doc.splitTextToSize(line, CW - 4);
        wrapped.forEach(function(w) {
          if (y + 4.5 > PH - 20) { doc.addPage(); y = M; }
          doc.text(w, M + 2, y); y += 4.2;
        });
      });
      y += 2;
    }
    __renderArea('AREA YANG MASIH PERLU DIPERKUAT', classes.penguatan, [161, 98, 7]);
    __renderArea('AREA YANG MENJADI MODAL KANDIDAT', classes.modal, [22, 101, 52]);
    __renderArea('KEKURANGAN/AREA RISIKO', classes.risiko, [185, 28, 28]);

    /* ---- SIGNATURE ---- */
    const showSig = !opts.contentOnly || opts.showSignature === true;
    if (showSig) {
      __ensurePage(45);
      y = Math.max(y + 6, PH - 55);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(30, 41, 59);
      doc.text('Asesor,', PW - M - 65, y); y += 22;
      doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(148, 163, 184);
      doc.text('ttd', PW - M - 65, y); y += 10;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(30, 41, 59);
      doc.text('Deni Pragas S.P., S.Psi.', PW - M - 65, y); y += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 95, 115);
      doc.text('Human Capital Recruitment Staff', PW - M - 65, y); y += 4.5;
      doc.setFontSize(8.5); doc.setTextColor(100, 116, 139);
      doc.text('Sugar Group Schools', PW - M - 65, y);
    }

    /* ---- FOOTER ---- */
    if (!opts.contentOnly) {
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
      doc.text('Dibuat: ' + new Date().toLocaleString('id-ID'), M, PH - 10);
      doc.text('Halaman ' + doc.internal.getNumberOfPages(), PW - M, PH - 10, { align: 'right' });
    }

    return doc;
  }

    async function downloadPsikogramPDF(slug, candidateName, position) {
    await __ensurePsikogramConfigLoaded();
    const [raw, overrides, customWeights, extras] = await Promise.all([
      fetchRawData(slug), loadOverrides(slug), loadWeights(slug),
      __fetchPsikogramExtras(slug)
    ]);
    const __cat = detectCategory(position) || 'guru';
    const computed = computeAll(raw, overrides, customWeights, __cat);
    const doc = await generatePsikogramPDF(candidateName, position, computed, {
      age: extras.age,
      address: extras.address,
      photoDataUrl: extras.photoDataUrl,
      conclusion: extras.conclusion
    });
    doc.save('Psikogram-' + String(candidateName || 'Kandidat').replace(/[^a-zA-Z0-9]/g, '-') + '.pdf');
  }

    window.renderPsikogramBox = async function (slug, candidateName, position) {
    await __ensurePsikogramConfigLoaded();
    const category = detectCategory(position);
    const aspects = getAspectConfig(category);

    /* 🆕 WARNING BOX — config kosong atau posisi tidak dikenali */
    if (aspects.length === 0) {
      const posLabel = position || '(tidak diisi)';
      const catLabel = category ? (getCategoryLabel(category) || category) : null;
      const hint = catLabel
        ? `Posisi <b style="color:#fcd34d;">${escHtml(catLabel)}</b> belum punya aspek config.`
        : `Posisi <b style="color:#fca5a5;">${escHtml(posLabel)}</b> tidak dikenali atau belum punya config.`;

      return `
        <div style="margin-top:10px; padding:12px 14px;
          background:linear-gradient(135deg,rgba(245,158,11,.08),rgba(217,119,6,.05));
          border:1.5px dashed rgba(245,158,11,.45);
          border-radius:12px;">
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
            <div style="width:34px;height:34px;flex:0 0 34px;display:grid;place-items:center;
              background:rgba(245,158,11,.2);border-radius:9px;font-size:17px;">⚙️</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:12px;font-weight:900;color:#fcd34d;margin-bottom:3px;">
                Config Psikogram Kosong
              </div>
              <div style="font-size:10.5px;color:#cbd5e1;line-height:1.5;">
                ${hint} Tambahkan aspek via <b>Psikogram Config</b> untuk mengaktifkan psikogram.
              </div>
            </div>
          </div>
          <button class="js-open-psiko-config"
            data-position="${escHtml(posLabel)}"
            data-category="${escHtml(category || '')}"
            style="width:100%;padding:9px 14px;border-radius:9px;
              background:linear-gradient(135deg,#f59e0b,#d97706);
              border:0;color:#fff;font-family:inherit;font-size:11.5px;font-weight:800;
              cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;
              box-shadow:0 4px 12px rgba(245,158,11,.35);">
            ➕ Buka Psikogram Config
          </button>
        </div>`;
    }

    /* Normal — button "Lihat Psikogram" */
    const countLabel = aspects.length + ' Aspek';
    return `<button class="js-psikogram-open" data-slug="${escHtml(slug)}" data-name="${escHtml(candidateName)}" data-position="${escHtml(position||'')}" style="width:100%;padding:11px 14px;margin-top:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;border-radius:10px;color:#fff;font-family:inherit;font-size:13px;font-weight:900;cursor:pointer;box-shadow:0 4px 12px rgba(99,102,241,.35);display:flex;align-items:center;justify-content:center;gap:8px;">📊 Lihat Psikogram (${countLabel})</button>`;
  };

  if (!window.__psikoDelegationAttached) {
    window.__psikoDelegationAttached = true;
    document.addEventListener('click', async function (e) {

            /* 🆕 Button: Buka Psikogram Config */
      const cfgBtn = e.target.closest('.js-open-psiko-config');
      if (cfgBtn) {
        e.preventDefault(); e.stopPropagation();
        const targetCategory = cfgBtn.getAttribute('data-category') || '';

        if (typeof window.openPsikogramConfigPage === 'function') {
          window.openPsikogramConfigPage();
          /* Auto-select tab sesuai category kalau diketahui */
          if (targetCategory) {
            setTimeout(() => {
              const tab = document.querySelector(
                '#psikogramConfigOverlay .pgcfg-tab[data-cat="' + targetCategory + '"]'
              );
              if (tab) tab.click();
            }, 600);
          }
        } else {
          alert(
            'Admin panel Psikogram Config belum siap.\n\n' +
            'Buka via sidebar → 📊 Psikogram Config,\n' +
            'atau refresh halaman.'
          );
        }
        return;
      }

      const openBtn = e.target.closest('.js-psikogram-open');
      if (openBtn) { e.preventDefault(); e.stopPropagation(); openPsikogramModal(openBtn.getAttribute('data-slug'), openBtn.getAttribute('data-name'), openBtn.getAttribute('data-position')); return; }
      const wBtn = e.target.closest('.psiko-weight-btn');
      if (wBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = wBtn.closest('#psikoModal'); if (!modal) return;
        const slug = modal.getAttribute('data-slug'); const name = modal.getAttribute('data-name'); const position = modal.getAttribute('data-position');
        const aspectId = wBtn.getAttribute('data-aspect-id'); const aspect = DEFAULT_ASPECTS.find(a => a.id === aspectId); if (!aspect) return;
        const customWeights = await loadWeights(slug); const currentW = customWeights[aspectId] || null;
        openWeightModal(aspect, currentW, async (newW) => {
          try { const w = await loadWeights(slug); w[aspectId] = newW; await saveWeights(slug, w); modal.remove(); openPsikogramModal(slug, name, position); } catch (err) { alert('Gagal simpan bobot: ' + err.message); }
        });
        return;
      }
      const editBtn = e.target.closest('.psiko-edit-btn');
      if (editBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = editBtn.closest('#psikoModal'); if (!modal) return;
        const slug = modal.getAttribute('data-slug'); const name = modal.getAttribute('data-name'); const position = modal.getAttribute('data-position');
        const aspectId = editBtn.getAttribute('data-aspect-id'); const asp = DEFAULT_ASPECTS.find(a => a.id === aspectId); if (!asp) return;
        const row = editBtn.closest('.psiko-row'); const autoScore = row.dataset.auto ? Number(row.dataset.auto) : null;
        const currentScore = parseFloat(row.querySelector('.psiko-score').textContent) || 0;
        openEditModal(aspectId, asp.label, currentScore, autoScore, async (v) => {
          try { const overrides = await loadOverrides(slug); if (v === null) delete overrides[aspectId]; else overrides[aspectId] = v; await saveOverrides(slug, overrides, detectCategory(position) || 'guru'); modal.remove(); openPsikogramModal(slug, name, position); } catch (err) { alert('Gagal: ' + err.message); }
        });
        return;
      }
      const rawBtn = e.target.closest('.js-psiko-input-raw');
      if (rawBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = rawBtn.closest('#psikoModal'); if (!modal) return;
        const slug = modal.getAttribute('data-slug'); const name = modal.getAttribute('data-name'); const position = modal.getAttribute('data-position');
        const raw = await fetchRawData(slug);
        openRawModal(slug, raw, async (newRaw) => {
          try { await saveRaw(slug, newRaw); modal.remove(); openPsikogramModal(slug, name, position); } catch (err) { alert('Gagal: ' + err.message); }
        });
        return;
      }
      const resetBtn = e.target.closest('.js-psiko-reset');
      if (resetBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = resetBtn.closest('#psikoModal'); if (!modal) return;
        if (!confirm('Hapus semua override skor?')) return;
        const slug = modal.getAttribute('data-slug'); const name = modal.getAttribute('data-name'); const position = modal.getAttribute('data-position');
        try { await saveOverrides(slug, {}, detectCategory(position) || 'guru'); modal.remove(); openPsikogramModal(slug, name, position); } catch (err) { alert('Gagal: ' + err.message); }
        return;
      }
      const resetWBtn = e.target.closest('.js-psiko-reset-weights');
      if (resetWBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = resetWBtn.closest('#psikoModal'); if (!modal) return;
        if (!confirm('Kembalikan semua bobot ke default?')) return;
        const slug = modal.getAttribute('data-slug'); const name = modal.getAttribute('data-name'); const position = modal.getAttribute('data-position');
        try { await saveWeights(slug, {}); modal.remove(); openPsikogramModal(slug, name, position); } catch (err) { alert('Gagal: ' + err.message); }
        return;
      }
      const pdfBtn = e.target.closest('.js-psiko-pdf');
      if (pdfBtn) {
        e.preventDefault(); e.stopPropagation();
        const modal = pdfBtn.closest('#psikoModal'); if (!modal) return;
        const slug = modal.getAttribute('data-slug'); const name = modal.getAttribute('data-name'); const position = modal.getAttribute('data-position');
        const prev = pdfBtn.textContent; pdfBtn.textContent = '⏳ PDF...'; pdfBtn.disabled = true;
        try { await downloadPsikogramPDF(slug, name, position); pdfBtn.textContent = '✓ Terunduh'; setTimeout(function() { pdfBtn.textContent = prev; pdfBtn.disabled = false; }, 1800); } catch (err) { alert('Gagal PDF: ' + err.message); pdfBtn.textContent = prev; pdfBtn.disabled = false; }
        return;
      }
    }, true);
  }

  window.__computePsikogram = async function(slug, position) {
    await __ensurePsikogramConfigLoaded();
    const results = await Promise.all([
      fetchRawData(slug), loadOverrides(slug), loadWeights(slug)
    ]);
    const raw = results[0], overrides = results[1], weights = results[2];
    const category = detectCategory(position) || 'guru';
    return {
      raw: raw, overrides: overrides, weights: weights, category: category,
      computed: computeAll(raw, overrides, weights, category)
    };
  };

  window.generatePsikogramPDF = generatePsikogramPDF;
  window.downloadPsikogramPDF = downloadPsikogramPDF;

  console.log('[PSIKOGRAM] ✓ Loaded v4.2 — layout fix + Asesor sig + auto KESIMPULAN/AREA');
})();