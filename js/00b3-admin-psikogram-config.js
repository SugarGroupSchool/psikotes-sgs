/* ============================================================
   js/00b3-admin-psikogram-config.js
   ------------------------------------------------------------
   Admin UI: edit aspek psikogram per posisi
   Simpan ke Firebase: sgs_config/psikogram_config/{category}
   Priority: Firebase override > JS defaults (psikogram-config.js)
   ============================================================ */
(function () {
  'use strict';

  const SOURCES = ['IST', 'PAPI', 'BigFive', 'Wawancara', 'FGD', 'Grafis', 'SubjectTest'];
  const IST_SUBTES = ['SE','WA','AN','GE','ME','RA','ZR','FA','WU'];
  const PAPI_DIMS = ['A','N','G','T','V','W','F','C','L','P','I','E','K','O','S','B','X','Z','D','R'];
  const BIGFIVE_DIMS = ['O','C','E','A','N'];
  const GRAFIS_CATS = [
    'KEMAMPUAN BERPIKIR & PROBLEM SOLVING',
    'EMPATHY, INTERPERSONAL SKILL & TEAMWORK',
    'STABILITAS EMOSI & KONTROL IMPULS',
    'MOTIVATION & ACHIEVEMENT DRIVE',
    'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY',
    'INTEGRITY & RULE COMPLIANCE',
    'TEACHING CREATIVITY'
  ];
  const POSITIONS = [
    { key: 'guru',         label: 'Guru / Dosen',   icon: '📚' },
    { key: 'admin',        label: 'Administrator',  icon: '💼' },
    { key: 'it',           label: 'IT Staff',       icon: '💻' },
    { key: 'welder',       label: 'Welder',         icon: '🔧' },
    { key: 'technical',    label: 'Technical',      icon: '⚙️' },
    { key: 'housekeeping', label: 'Housekeeping',   icon: '🧹' }
  ];

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function fbReady() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
  }

  const __state = {
    category: 'guru',
    aspects: [],
    isOverride: false,
    fbConfig: null,
    dirty: false
  };

  async function __loadFbConfig() {
    if (!fbReady()) return {};
    try {
      const snap = await firebase.database().ref('sgs_config/psikogram_config').once('value');
      return snap.val() || {};
    } catch (e) {
      console.warn('[PGCFG] Load gagal:', e.message);
      return {};
    }
  }

  function __getDefaultAspects(category) {
    const cfg = window.PSIKOGRAM_CONFIG || {};
    const pos = cfg[category];
    return (pos && Array.isArray(pos.aspects)) ? JSON.parse(JSON.stringify(pos.aspects)) : [];
  }

  function __loadCategory(category) {
    const fbCat = __state.fbConfig && __state.fbConfig[category];
    const fbAspects = fbCat && Array.isArray(fbCat.aspects) ? fbCat.aspects : null;
    if (fbAspects && fbAspects.length > 0) {
      __state.aspects = JSON.parse(JSON.stringify(fbAspects));
      __state.isOverride = true;
    } else {
      __state.aspects = __getDefaultAspects(category);
      __state.isOverride = false;
    }
    __state.category = category;
    __state.dirty = false;
  }

  function __totalWeight(a) {
    return Object.values(a.weights || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  }

  async function __saveConfig() {
    if (!fbReady()) throw new Error('Firebase belum siap');
    const seen = new Set();
    for (const a of __state.aspects) {
      if (!a.id || !String(a.id).trim()) throw new Error('Ada aspek tanpa ID');
      if (seen.has(a.id)) throw new Error('ID aspek duplikat: ' + a.id);
      seen.add(a.id);
    }
    const clean = __state.aspects.map(a => ({
      id: String(a.id || '').trim(),
      label: String(a.label || '').trim(),
      weights: a.weights || {},
      ist: Array.isArray(a.ist) ? a.ist : [],
      papi: Array.isArray(a.papi) ? a.papi : [],
      bigfive: Array.isArray(a.bigfive) ? a.bigfive : [],
      grafisCat: a.grafisCat || '',
      subjectTest: !!a.subjectTest
    }));
    await firebase.database().ref('sgs_config/psikogram_config/' + __state.category).update({
      aspects: clean,
      label: (window.PSIKOGRAM_CONFIG && window.PSIKOGRAM_CONFIG[__state.category] && window.PSIKOGRAM_CONFIG[__state.category].label) || __state.category,
      updatedAt: firebase.database.ServerValue.TIMESTAMP,
      updatedBy: 'admin'
    });
    if (typeof window.__invalidatePsikogramConfigCache === 'function') {
      window.__invalidatePsikogramConfigCache();
    }
    __state.isOverride = true;
    __state.dirty = false;
    __state.fbConfig = __state.fbConfig || {};
    __state.fbConfig[__state.category] = { aspects: clean };
  }

  async function __resetToDefault() {
    if (!fbReady()) throw new Error('Firebase belum siap');
    await firebase.database().ref('sgs_config/psikogram_config/' + __state.category).remove();
    if (typeof window.__invalidatePsikogramConfigCache === 'function') {
      window.__invalidatePsikogramConfigCache();
    }
    if (__state.fbConfig) delete __state.fbConfig[__state.category];
    __loadCategory(__state.category);
  }

  /* ============================================================
     RENDER SHELL
     ============================================================ */
  function __renderShell(ov) {
    ov.innerHTML = `
      <style>
        .pgcfg-tabs-bar { padding: 0 24px; display: flex; gap: 4px; overflow-x: auto; background: rgba(0,0,0,.15); border-bottom: 1px solid rgba(255,255,255,.08); }
        .pgcfg-tab { padding: 12px 18px; border: 0; background: transparent; color: #94a3b8; font-family: inherit; font-size: 13px; font-weight: 800; cursor: pointer; border-bottom: 3px solid transparent; white-space: nowrap; }
        .pgcfg-tab.active { color: #fff; border-bottom-color: #6366f1; }
        .pgcfg-tab:hover { color: #e2e8f0; }
        .pgcfg-aspect { padding: 14px 16px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 12px; margin-bottom: 10px; }
        .pgcfg-aspect-head { display: flex; gap: 12px; align-items: flex-start; }
        .pgcfg-idx { width: 28px; height: 28px; flex: 0 0 28px; display: grid; place-items: center; background: rgba(99,102,241,.2); border: 1px solid rgba(99,102,241,.4); border-radius: 7px; font-size: 12px; font-weight: 900; color: #a5b4fc; }
        .pgcfg-aspect-title { flex: 1; min-width: 0; }
        .pgcfg-aspect-label { font-size: 13.5px; font-weight: 800; color: #fff; margin-bottom: 3px; }
        .pgcfg-aspect-meta { font-size: 11px; color: #94a3b8; line-height: 1.5; }
        .pgcfg-btn { padding: 8px 14px; border: 0; border-radius: 9px; font-family: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }
        .pgcfg-btn-edit { background: rgba(99,102,241,.18); color: #a5b4fc; border: 1px solid rgba(99,102,241,.4); }
        .pgcfg-btn-del { background: rgba(239,68,68,.15); color: #fca5a5; border: 1px solid rgba(239,68,68,.4); }
        .pgcfg-input { width: 100%; padding: 10px 12px; background: rgba(255,255,255,.06); border: 1.5px solid rgba(255,255,255,.14); border-radius: 9px; color: #fff; font-family: inherit; font-size: 13px; outline: none; box-sizing: border-box; }
        .pgcfg-input:focus { border-color: #6366f1; background: rgba(255,255,255,.1); }
        .pgcfg-chk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 6px; }
        .pgcfg-chk { display: flex; align-items: center; gap: 6px; padding: 7px 10px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 7px; font-size: 12px; cursor: pointer; user-select: none; }
        .pgcfg-chk input { margin: 0; cursor: pointer; }
        .pgcfg-chk.checked { background: rgba(99,102,241,.18); border-color: rgba(99,102,241,.5); color: #c7d2fe; }
      </style>

      <div style="padding: 20px 24px; background: linear-gradient(180deg, rgba(0,0,0,.25), transparent); border-bottom: 1px solid rgba(255,255,255,.08); display: flex; align-items: center; gap: 14px;">
        <button id="pgcfgBackBtn" style="width: 42px; height: 42px; flex: 0 0 42px; display: grid; place-items: center; background: rgba(255,255,255,.08); border: 1.5px solid rgba(255,255,255,.14); border-radius: 12px; color: #fff; font-size: 18px; cursor: pointer; font-family: inherit;">←</button>
        <div style="flex: 1;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #a5b4fc; margin-bottom: 4px;">ADMIN PANEL · KONFIGURASI</div>
          <div style="font-size: 22px; font-weight: 900; color: #fff;">📊 Psikogram per Posisi</div>
        </div>
        <button id="pgcfgSaveBtn" style="padding: 11px 22px; background: linear-gradient(135deg,#16a34a,#059669); border: 0; border-radius: 11px; color: #fff; font-family: inherit; font-size: 13px; font-weight: 900; cursor: pointer;">💾 Simpan</button>
        <button id="pgcfgResetBtn" style="padding: 11px 18px; background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.4); border-radius: 11px; color: #fca5a5; font-family: inherit; font-size: 13px; font-weight: 800; cursor: pointer;">↺ Reset Default</button>
      </div>

      <div class="pgcfg-tabs-bar" id="pgcfgTabs"></div>
      <div id="pgcfgBanner" style="padding: 10px 24px;"></div>
      <div id="pgcfgContent" style="flex: 1; overflow-y: auto; padding: 20px 24px 100px;"></div>

      <div style="padding: 14px 24px; background: rgba(0,0,0,.4); border-top: 1px solid rgba(255,255,255,.08); display: flex; gap: 10px; align-items: center; justify-content: space-between;">
        <button id="pgcfgAddBtn" style="padding: 11px 22px; background: linear-gradient(135deg,#6366f1,#8b5cf6); border: 0; border-radius: 11px; color: #fff; font-family: inherit; font-size: 13px; font-weight: 900; cursor: pointer;">➕ Tambah Aspek</button>
        <div id="pgcfgStatus" style="font-size: 12px; color: #94a3b8;"></div>
      </div>
    `;

    document.getElementById('pgcfgBackBtn').onclick = () => ov.remove();
    document.getElementById('pgcfgSaveBtn').onclick = __handleSave;
    document.getElementById('pgcfgResetBtn').onclick = __handleReset;
    document.getElementById('pgcfgAddBtn').onclick = () => __openAspectEditor(-1);

    __renderTabs();
    __renderContent();
  }

  function __renderTabs() {
    const bar = document.getElementById('pgcfgTabs');
    if (!bar) return;
    bar.innerHTML = POSITIONS.map(p => {
      const active = __state.category === p.key;
      return `<button class="pgcfg-tab${active ? ' active' : ''}" data-cat="${p.key}">${p.icon} ${esc(p.label)}</button>`;
    }).join('');
    bar.querySelectorAll('.pgcfg-tab').forEach(btn => {
      btn.onclick = () => {
        if (__state.dirty) {
          if (!confirm('Ada perubahan yang belum disimpan. Ganti tab dan buang perubahan?')) return;
        }
        __loadCategory(btn.getAttribute('data-cat'));
        __renderTabs();
        __renderBanner();
        __renderContent();
      };
    });
    __renderBanner();
  }

  function __renderBanner() {
    const el = document.getElementById('pgcfgBanner');
    if (!el) return;
    if (__state.isOverride) {
      el.innerHTML = `<div style="padding: 9px 14px; background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.4); border-radius: 10px; font-size: 12px; color: #86efac;">✅ Menggunakan <b>config dari Firebase</b> — perubahan tersimpan permanen.</div>`;
    } else {
      el.innerHTML = `<div style="padding: 9px 14px; background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.4); border-radius: 10px; font-size: 12px; color: #fcd34d;">📋 Menampilkan <b>default dari JS</b>. Klik 💾 Simpan untuk override ke Firebase.</div>`;
    }
  }

  function __renderContent() {
    const content = document.getElementById('pgcfgContent');
    if (!content) return;
    const aspects = __state.aspects;

    if (aspects.length === 0) {
      content.innerHTML = `<div style="padding: 60px 20px; text-align: center; color: #64748b; font-size: 14px;">
        <div style="font-size: 52px; margin-bottom: 14px; opacity: .5;">📊</div>
        <div style="font-weight: 700; color: #94a3b8; margin-bottom: 8px;">Belum ada aspek untuk posisi ini</div>
        <div style="font-size: 12px;">Klik <b style="color:#a5b4fc;">➕ Tambah Aspek</b> di bawah untuk mulai.</div>
      </div>`;
      return;
    }

    content.innerHTML = aspects.map((a, i) => {
      const total = __totalWeight(a);
      const weightChips = Object.entries(a.weights || {})
        .filter(([k, v]) => Number(v) > 0)
        .map(([k, v]) => `<span style="padding: 2px 8px; background: rgba(255,255,255,.06); border-radius: 999px; font-size: 10.5px; font-weight: 700; color: #cbd5e1; display:inline-block; margin: 2px 3px 2px 0;">${esc(k)}=${v}</span>`)
        .join('');
      const istChips = Array.isArray(a.ist) && a.ist.length ? `📐 IST: ${a.ist.join(', ')}` : '';
      const papiChips = Array.isArray(a.papi) && a.papi.length ? `📊 PAPI: ${a.papi.join(', ')}` : '';
      const bfChips = Array.isArray(a.bigfive) && a.bigfive.length ? `🧠 BigFive: ${a.bigfive.join(', ')}` : '';
      const grafisChip = a.grafisCat ? `🎨 Grafis: ${a.grafisCat.slice(0, 30)}…` : '';
      const subjChip = a.subjectTest ? '📚 SubjectTest' : '';
      const detailChips = [istChips, papiChips, bfChips, grafisChip, subjChip].filter(Boolean).join(' · ');
      return `
        <div class="pgcfg-aspect">
          <div class="pgcfg-aspect-head">
            <div class="pgcfg-idx">${i + 1}</div>
            <div class="pgcfg-aspect-title">
              <div class="pgcfg-aspect-label">${esc(a.label || a.id)}</div>
              <div class="pgcfg-aspect-meta" style="margin-top: 4px;">${weightChips} <span style="color: ${total === 100 ? '#86efac' : '#fca5a5'}; font-weight: 800; margin-left: 6px;">(Total ${total}%)</span></div>
            </div>
            <button class="pgcfg-btn pgcfg-btn-edit" data-idx="${i}" title="Edit">✎</button>
            <button class="pgcfg-btn pgcfg-btn-del" data-idx="${i}" title="Hapus">🗑</button>
          </div>
          ${detailChips ? `<div style="margin-top: 8px; padding-left: 40px; font-size: 10.5px; color: #94a3b8; line-height: 1.6;">${detailChips}</div>` : ''}
        </div>
      `;
    }).join('');

    content.querySelectorAll('.pgcfg-btn-edit').forEach(btn => {
      btn.onclick = () => __openAspectEditor(Number(btn.getAttribute('data-idx')));
    });
    content.querySelectorAll('.pgcfg-btn-del').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute('data-idx'));
        if (!confirm('Hapus aspek "' + (__state.aspects[idx].label || __state.aspects[idx].id) + '"?')) return;
        __state.aspects.splice(idx, 1);
        __state.dirty = true;
        __renderContent();
      };
    });
  }

  /* ============================================================
     ASPECT EDITOR MODAL
     ============================================================ */
  function __openAspectEditor(idx) {
    const isNew = idx < 0;
    const a = isNew
      ? { id: '', label: '', weights: {}, ist: [], papi: [], bigfive: [], grafisCat: '', subjectTest: false }
      : JSON.parse(JSON.stringify(__state.aspects[idx]));

    const old = document.getElementById('pgcfgEditorModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'pgcfgEditorModal';
    modal.style.cssText = `position:fixed;inset:0;z-index:2147483646;background:rgba(10,20,35,.9);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;font-family:Inter,system-ui,sans-serif;`;

    modal.innerHTML = `
      <div style="width:min(780px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.4);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.7);color:#e2e8f0;">
        <div style="padding:16px 22px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;gap:12px;">
          <div style="font-size:20px;">${isNew ? '➕' : '✎'}</div>
          <div style="flex:1;font-size:16px;font-weight:900;color:#fff;">${isNew ? 'Tambah Aspek Baru' : 'Edit Aspek'}</div>
          <button id="pgcfgEdClose" style="width:34px;height:34px;display:grid;place-items:center;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:9px;color:#fff;font-size:15px;cursor:pointer;font-family:inherit;">✕</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:20px 22px;" id="pgcfgEdBody"></div>
        <div style="padding:14px 22px;background:rgba(0,0,0,.32);border-top:1px solid rgba(255,255,255,.06);display:flex;gap:10px;justify-content:flex-end;">
          <button id="pgcfgEdCancel" style="padding:11px 20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Batal</button>
          <button id="pgcfgEdSave" style="padding:11px 24px;background:linear-gradient(135deg,#16a34a,#059669);border:0;border-radius:10px;color:#fff;font-family:inherit;font-size:13px;font-weight:900;cursor:pointer;">✓ Simpan Aspek</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    function renderBody() {
      const body = document.getElementById('pgcfgEdBody');
      if (!body) return;
      const totalW = __totalWeight(a);
      body.innerHTML = `
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#94a3b8;letter-spacing:1px;margin-bottom:6px;">ID (unik, tanpa spasi)</label>
          <input type="text" id="pgcfgEdId" class="pgcfg-input" value="${esc(a.id)}" placeholder="contoh: cognitive_ability" ${!isNew ? 'readonly style="opacity:.6;cursor:not-allowed;"' : ''}>
          <div style="font-size:10.5px;color:#64748b;margin-top:4px;">Huruf, angka, underscore. Wajib unik.</div>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#94a3b8;letter-spacing:1px;margin-bottom:6px;">LABEL</label>
          <input type="text" id="pgcfgEdLabel" class="pgcfg-input" value="${esc(a.label)}" placeholder="contoh: Cognitive Ability & Problem Solving">
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#94a3b8;letter-spacing:1px;margin-bottom:8px;">
            BOBOT SUMBER <span id="pgcfgEdTotal" style="color:${totalW === 100 ? '#86efac' : '#fca5a5'};font-size:12px;margin-left:8px;">Total: ${totalW}%</span>
          </label>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;">
            ${SOURCES.map(src => `
              <div style="display:flex;align-items:center;gap:8px;">
                <label style="flex:0 0 100px;font-size:12px;font-weight:700;color:#cbd5e1;">${src}</label>
                <input type="number" class="pgcfg-input pgcfg-weight" data-src="${src}" value="${Number(a.weights?.[src]) || 0}" min="0" max="100" step="1" style="flex:1;">
              </div>
            `).join('')}
          </div>
          <div style="font-size:10.5px;color:#64748b;margin-top:4px;">Total harus 100. Kosong = 0 = tidak dipakai.</div>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#94a3b8;letter-spacing:1px;margin-bottom:8px;">SUBTES IST</label>
          <div class="pgcfg-chk-grid">
            ${IST_SUBTES.map(s => `
              <label class="pgcfg-chk ${a.ist.includes(s) ? 'checked' : ''}" data-group="ist" data-val="${s}">
                <input type="checkbox" ${a.ist.includes(s) ? 'checked' : ''}> ${s}
              </label>
            `).join('')}
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#94a3b8;letter-spacing:1px;margin-bottom:8px;">DIMENSI PAPI</label>
          <div class="pgcfg-chk-grid">
            ${PAPI_DIMS.map(s => `
              <label class="pgcfg-chk ${a.papi.includes(s) ? 'checked' : ''}" data-group="papi" data-val="${s}">
                <input type="checkbox" ${a.papi.includes(s) ? 'checked' : ''}> ${s}
              </label>
            `).join('')}
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#94a3b8;letter-spacing:1px;margin-bottom:8px;">DIMENSI BIG FIVE <span style="font-size:10px;color:#64748b;font-weight:600;">(⇄ = reverse scoring)</span></label>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;">
            ${BIGFIVE_DIMS.map(s => `
              <div style="display:flex;gap:4px;">
                <label class="pgcfg-chk ${a.bigfive.includes(s) ? 'checked' : ''}" data-group="bigfive" data-val="${s}" style="flex:1;">
                  <input type="checkbox" ${a.bigfive.includes(s) ? 'checked' : ''}> ${s}
                </label>
                <label class="pgcfg-chk ${a.bigfive.includes(s + '_rev') ? 'checked' : ''}" data-group="bigfive" data-val="${s}_rev" title="Reverse">
                  <input type="checkbox" ${a.bigfive.includes(s + '_rev') ? 'checked' : ''}> ⇄
                </label>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#94a3b8;letter-spacing:1px;margin-bottom:6px;">KATEGORI GRAFIS</label>
          <select id="pgcfgEdGrafis" class="pgcfg-input">
            <option value="">— Tidak pakai Grafis —</option>
            ${GRAFIS_CATS.map(c => `<option value="${esc(c)}" ${a.grafisCat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
          </select>
        </div>
        <div style="margin-bottom:16px;">
          <label class="pgcfg-chk ${a.subjectTest ? 'checked' : ''}" style="display:inline-flex;padding:10px 14px;">
            <input type="checkbox" id="pgcfgEdSubj" ${a.subjectTest ? 'checked' : ''}>
            📚 Pakai nilai Subject Test untuk aspek ini
          </label>
        </div>
      `;

      const idInput = body.querySelector('#pgcfgEdId');
      if (idInput) idInput.oninput = () => { a.id = idInput.value; };
      const labelInput = body.querySelector('#pgcfgEdLabel');
      if (labelInput) labelInput.oninput = () => { a.label = labelInput.value; };

      body.querySelectorAll('.pgcfg-weight').forEach(inp => {
        inp.oninput = () => {
          const src = inp.getAttribute('data-src');
          const v = Number(inp.value) || 0;
          a.weights = a.weights || {};
          if (v > 0) a.weights[src] = v;
          else delete a.weights[src];
          const t = __totalWeight(a);
          const totalEl = document.getElementById('pgcfgEdTotal');
          if (totalEl) {
            totalEl.textContent = 'Total: ' + t + '%';
            totalEl.style.color = t === 100 ? '#86efac' : '#fca5a5';
          }
        };
      });

      body.querySelectorAll('.pgcfg-chk').forEach(chk => {
        const inp = chk.querySelector('input');
        if (!inp) return;
        const group = chk.getAttribute('data-group');
        const val = chk.getAttribute('data-val');
        if (!group || !val) return;
        inp.onchange = () => {
          const arr = a[group] || [];
          if (inp.checked) {
            if (!arr.includes(val)) arr.push(val);
            chk.classList.add('checked');
          } else {
            const ix = arr.indexOf(val);
            if (ix >= 0) arr.splice(ix, 1);
            chk.classList.remove('checked');
          }
          a[group] = arr;
        };
      });

      const grafisSel = body.querySelector('#pgcfgEdGrafis');
      if (grafisSel) grafisSel.onchange = () => { a.grafisCat = grafisSel.value; };
      const subjChk = body.querySelector('#pgcfgEdSubj');
      if (subjChk) subjChk.onchange = () => { a.subjectTest = subjChk.checked; };
    }

    renderBody();

    document.getElementById('pgcfgEdClose').onclick = () => modal.remove();
    document.getElementById('pgcfgEdCancel').onclick = () => modal.remove();
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    document.getElementById('pgcfgEdSave').onclick = () => {
      if (!a.id || !String(a.id).trim()) { alert('ID wajib diisi'); return; }
      if (!a.label || !String(a.label).trim()) { alert('Label wajib diisi'); return; }
      const newId = a.id.trim();
      const conflict = __state.aspects.some((x, i) => i !== idx && x.id === newId);
      if (conflict) { alert('ID sudah dipakai aspek lain: ' + newId); return; }
      a.id = newId;
      a.label = a.label.trim();
      if (isNew) __state.aspects.push(a);
      else __state.aspects[idx] = a;
      __state.dirty = true;
      modal.remove();
      __renderContent();
    };
  }

  /* ============================================================
     SAVE / RESET
     ============================================================ */
  async function __handleSave() {
    const btn = document.getElementById('pgcfgSaveBtn');
    const status = document.getElementById('pgcfgStatus');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = '⏳ Menyimpan...';
    if (status) { status.style.color = '#93c5fd'; status.textContent = 'Menyimpan ke Firebase...'; }
    try {
      await __saveConfig();
      if (status) { status.style.color = '#86efac'; status.textContent = '✅ Tersimpan — config aktif sekarang.'; }
      __renderBanner();
    } catch (e) {
      if (status) { status.style.color = '#fca5a5'; status.textContent = '❌ ' + e.message; }
      alert('Gagal simpan: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Simpan';
    }
  }

  async function __handleReset() {
    if (!confirm('Reset config posisi ini ke default dari JS?\n\nSemua perubahan di Firebase akan dihapus, dan aspek kembali ke default.')) return;
    const status = document.getElementById('pgcfgStatus');
    try {
      await __resetToDefault();
      __renderBanner();
      __renderContent();
      if (status) { status.style.color = '#86efac'; status.textContent = '✅ Reset ke default JS.'; }
    } catch (e) {
      if (status) { status.style.color = '#fca5a5'; status.textContent = '❌ ' + e.message; }
      alert('Gagal reset: ' + e.message);
    }
  }

  /* ============================================================
     PUBLIC ENTRY
     ============================================================ */
  window.openPsikogramConfigPage = async function () {
    const old = document.getElementById('psikogramConfigOverlay');
    if (old) old.remove();

    __state.fbConfig = await __loadFbConfig();
    __loadCategory('guru');

    const ov = document.createElement('div');
    ov.id = 'psikogramConfigOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);display:flex;flex-direction:column;font-family:Inter,system-ui,sans-serif;color:#e2e8f0;overflow:hidden;';
    document.body.appendChild(ov);

    __renderShell(ov);
  };

  console.log('[PGCFG-ADMIN] ✓ Loaded');
})();