/* ============================================================
   js/00b3-admin-psikogram-config.js — v2 LIGHT THEME + FIXES
   ------------------------------------------------------------
   - Sidebar tidak tertutup overlay (left offset responsif)
   - Editor modal LIGHT theme (input & text visible)
   - Grafis kategori free-text + position-specific suggestions
   Simpan ke Firebase: sgs_config/psikogram_config/{category}
   Priority: Firebase override > JS defaults (psikogram-config.js)
   ============================================================ */
(function () {
  'use strict';

  const SOURCES = ['IST', 'PAPI', 'BigFive', 'Wawancara', 'FGD', 'Grafis', 'SubjectTest', 'Excel', 'Typing', 'TechnicalTest'];
  const IST_SUBTES = ['SE','WA','AN','GE','ME','RA','ZR','FA','WU'];
  const PAPI_DIMS = ['A','N','G','T','V','W','F','C','L','P','I','E','K','O','S','B','X','Z','D','R'];
  const BIGFIVE_DIMS = ['O','C','E','A','N'];

  const GRAFIS_SUGGESTIONS_BASE = [
    'KEMAMPUAN BERPIKIR & PROBLEM SOLVING',
    'EMPATHY, INTERPERSONAL SKILL & TEAMWORK',
    'STABILITAS EMOSI & KONTROL IMPULS',
    'MOTIVATION & ACHIEVEMENT DRIVE',
    'FLEKSIBILITAS, ADAPTASI & LEARNING AGILITY',
    'INTEGRITY & RULE COMPLIANCE',
    'TEACHING CREATIVITY'
  ];

  const GRAFIS_SUGGESTIONS_POSITION = {
    guru:         ['TEACHING CREATIVITY'],
    admin:        ['SERVICE ORIENTATION', 'DETAIL ORIENTATION', 'ADMINISTRATIVE ACCURACY'],
    it:           ['TECHNICAL SKILL & PRECISION', 'LOGICAL THINKING', 'DEBUGGING MINDSET'],
    welder:       ['SAFETY AWARENESS', 'PHYSICAL ENDURANCE & STAMINA', 'MANUAL PRECISION'],
    technical:    ['TECHNICAL SKILL & PRECISION', 'SAFETY AWARENESS', 'EQUIPMENT HANDLING'],
    housekeeping: ['PHYSICAL ENDURANCE & STAMINA', 'CLEANLINESS DISCIPLINE', 'RESPONSIBILITY']
  };

  const POSITIONS = window.MASTER_POSITIONS || [
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
  function __getSidebarOffset() {
    const w = window.innerWidth;
    if (w <= 640) return 70;
    if (w <= 900) return 220;
    return 260;
  }

  const __state = {
    category: 'guru',
    aspects: [],
    isOverride: false,
    fbConfig: null,
    dirty: false
  };

  function __getGrafisSuggestions() {
    const all = new Set(GRAFIS_SUGGESTIONS_BASE);
    const extra = GRAFIS_SUGGESTIONS_POSITION[__state.category] || [];
    extra.forEach(c => all.add(c));
    __state.aspects.forEach(asp => {
      if (asp.grafisCat && String(asp.grafisCat).trim()) {
        all.add(String(asp.grafisCat).trim());
      }
    });
    return Array.from(all).sort();
  }

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

    async function __loadCategory(category) {
    const fbCat = __state.fbConfig && __state.fbConfig[category];
    const fbAspects = fbCat && Array.isArray(fbCat.aspects) ? fbCat.aspects : null;
    if (fbAspects && fbAspects.length > 0) {
      __state.aspects = JSON.parse(JSON.stringify(fbAspects));
      __state.isOverride = true;
    } else {
      __state.aspects = __getDefaultAspects(category);
      __state.isOverride = false;
    }
    
       // 🆕 AUTO-SYNC DARI GRAFIS CONFIG (SINKRONISASI NAMA PERSIS)
    try {
      if (fbReady()) {
        const snap = await firebase.database().ref('sgs_config/grafis_config/' + category).once('value');
        const gData = snap.val();
        if (gData && Array.isArray(gData.aspects)) {
          gData.aspects.forEach(gAsp => {
            const gLabel = String(gAsp.label || '').trim();
            // Cek apakah aspek dengan nama ini sudah ada di Psikogram
            const exists = __state.aspects.some(a => String(a.label).trim().toUpperCase() === gLabel.toUpperCase());
            if (!exists && gLabel) {
              __state.aspects.push({
                id: gAsp.id || _slugFromLabel(gLabel),
                label: gLabel,
                weights: { Grafis: 100 }, // Set bobot default 100% Grafis (bisa diubah admin)
                ist: [], papi: [], bigfive: [],
                grafisCat: gLabel, // Harus sama persis dengan label Grafis
                subjectTest: false
              });
            }
          });
        }
      }
    } catch(e) { console.warn('Sync Grafis Error', e); }

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
      grafisCat: String(a.label || '').trim(),
      subjectTest: !!a.subjectTest
    }));
        // 🆕 TRIK: Jika array kosong, kirim {} agar Firebase tidak menganggapnya delete
    const payloadAspects = clean.length > 0 ? clean : {};
    
    await firebase.database().ref('sgs_config/psikogram_config/' + __state.category).update({
      aspects: payloadAspects,
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
     RENDER SHELL — LIGHT THEME
     ============================================================ */
  function __renderShell(ov) {
    ov.innerHTML = `
      <style>
        #psikogramConfigOverlay .pgcfg-tabs-bar {
          padding: 0 24px; display: flex; gap: 4px; overflow-x: auto;
          background: #f8fafc; border-bottom: 1px solid #e5e7eb;
        }
        #psikogramConfigOverlay .pgcfg-tab {
          padding: 12px 18px; border: 0; background: transparent;
          color: #6b7280; font-family: inherit; font-size: 13px; font-weight: 800;
          cursor: pointer; border-bottom: 3px solid transparent; white-space: nowrap;
          transition: all .15s ease;
        }
        #psikogramConfigOverlay .pgcfg-tab:hover { color: #4f46e5; }
        #psikogramConfigOverlay .pgcfg-tab.active { color: #4f46e5; border-bottom-color: #4f46e5; }

        #psikogramConfigOverlay .pgcfg-aspect {
          padding: 14px 16px; background: #ffffff; border: 1px solid #e5e7eb;
          border-radius: 12px; margin-bottom: 10px;
          box-shadow: 0 1px 3px rgba(15,23,42,.04);
          transition: all .18s ease;
        }
        #psikogramConfigOverlay .pgcfg-aspect:hover {
          box-shadow: 0 4px 14px rgba(15,23,42,.08);
          border-color: #c7d2fe;
        }
        #psikogramConfigOverlay .pgcfg-aspect-head { display: flex; gap: 12px; align-items: flex-start; }
        #psikogramConfigOverlay .pgcfg-idx {
          width: 28px; height: 28px; flex: 0 0 28px; display: grid; place-items: center;
          background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 7px;
          font-size: 12px; font-weight: 900; color: #4f46e5;
        }
        #psikogramConfigOverlay .pgcfg-aspect-title { flex: 1; min-width: 0; }
        #psikogramConfigOverlay .pgcfg-aspect-label {
          font-size: 13.5px; font-weight: 800; color: #111827; margin-bottom: 3px;
        }
        #psikogramConfigOverlay .pgcfg-aspect-meta {
          font-size: 11px; color: #6b7280; line-height: 1.5;
        }
        #psikogramConfigOverlay .pgcfg-btn {
          padding: 8px 14px; border: 0; border-radius: 9px;
          font-family: inherit; font-size: 12px; font-weight: 800; cursor: pointer;
          transition: all .15s ease;
        }
        #psikogramConfigOverlay .pgcfg-btn-edit {
          background: #eef2ff; color: #4f46e5; border: 1px solid #c7d2fe;
        }
        #psikogramConfigOverlay .pgcfg-btn-edit:hover { background: #e0e7ff; border-color: #a5b4fc; }
        #psikogramConfigOverlay .pgcfg-btn-del {
          background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
        }
        #psikogramConfigOverlay .pgcfg-btn-del:hover { background: #fee2e2; border-color: #fca5a5; }
      </style>

      <div style="padding: 18px 24px; background: #ffffff; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
        <button id="pgcfgBackBtn" style="width: 42px; height: 42px; flex: 0 0 42px; display: grid; place-items: center; background: #f8fafc; border: 1.5px solid #e5e7eb; border-radius: 12px; color: #4b5563; font-size: 18px; cursor: pointer; font-family: inherit; transition: all .15s ease;" onmouseover="this.style.background='#f3f4f6';this.style.color='#4f46e5';" onmouseout="this.style.background='#f8fafc';this.style.color='#4b5563';">←</button>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #6366f1; margin-bottom: 4px;">ADMIN PANEL · KONFIGURASI</div>
          <div style="font-size: 22px; font-weight: 900; color: #111827;">📊 Psikogram per Posisi</div>
        </div>
        <button id="pgcfgSaveBtn" style="padding: 11px 22px; background: linear-gradient(135deg,#16a34a,#059669); border: 0; border-radius: 11px; color: #fff; font-family: inherit; font-size: 13px; font-weight: 900; cursor: pointer; box-shadow: 0 4px 14px rgba(22,163,74,.25); transition: all .15s ease;">💾 Simpan</button>
        <button id="pgcfgMoveBtn" style="padding: 11px 18px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 11px; color: #0ea5e9; font-family: inherit; font-size: 13px; font-weight: 800; cursor: pointer; transition: all .15s ease;">🔄 Pindah Posisi</button>
        
        <button id="pgcfgResetBtn" style="padding: 11px 18px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 11px; color: #dc2626; font-family: inherit; font-size: 13px; font-weight: 800; cursor: pointer; transition: all .15s ease;">↺ Reset Default</button>
      </div>

      <div class="pgcfg-tabs-bar" id="pgcfgTabs"></div>
      <div id="pgcfgBanner" style="padding: 12px 24px;"></div>
      <div id="pgcfgContent" style="flex: 1; overflow-y: auto; padding: 16px 24px 100px;"></div>

      <div style="padding: 14px 24px; background: #ffffff; border-top: 1px solid #e5e7eb; display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
        <button id="pgcfgAddBtn" style="padding: 11px 22px; background: linear-gradient(135deg,#6366f1,#8b5cf6); border: 0; border-radius: 11px; color: #fff; font-family: inherit; font-size: 13px; font-weight: 900; cursor: pointer; box-shadow: 0 4px 14px rgba(99,102,241,.25); transition: all .15s ease;">➕ Tambah Aspek</button>
        <div id="pgcfgStatus" style="font-size: 12px; color: #6b7280; font-weight: 600;"></div>
      </div>
    `;

    document.getElementById('pgcfgBackBtn').onclick = () => {
      if (__state.dirty) {
        if (!confirm('Ada perubahan yang belum disimpan. Tutup dan buang perubahan?')) return;
      }
      ov.remove();
    };
    document.getElementById('pgcfgSaveBtn').onclick = __handleSave;
    document.getElementById('pgcfgResetBtn').onclick = __handleReset;
    document.getElementById('pgcfgMoveBtn').onclick = __handleMovePosition;
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
      btn.onclick = async () => { // 🆕 Tambahkan async
        if (__state.dirty) {
          if (!confirm('Ada perubahan yang belum disimpan. Ganti tab dan buang perubahan?')) return;
        }
        
        // 🆕 Tampilkan loading agar tidak terasa "ngelag"
        const content = document.getElementById('pgcfgContent');
        if (content) content.innerHTML = `<div style="padding: 60px 20px; text-align: center; color: #0ea5e9; font-size: 14px; font-weight: 800;"><div class="spinner" style="width:30px;height:30px;border:3px solid #bae6fd;border-top-color:#0ea5e9;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 10px;"></div>Memuat Aspek & Sinkronisasi Grafis...</div>`;
        
        const cat = btn.getAttribute('data-cat');
        await __loadCategory(cat); // 🆕 Tunggu data Grafis selesai diambil
        
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
      el.innerHTML = `<div style="padding: 9px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; font-size: 12px; color: #15803d; font-weight: 600;">✅ Menggunakan <b style="color:#166534;">config dari Firebase</b> — perubahan tersimpan permanen.</div>`;
    } else {
      el.innerHTML = `<div style="padding: 9px 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; font-size: 12px; color: #a16207; font-weight: 600;">📋 Menampilkan <b style="color:#92400e;">default dari JS</b>. Klik 💾 Simpan untuk override ke Firebase.</div>`;
    }
  }

  function __renderContent() {
    const content = document.getElementById('pgcfgContent');
    if (!content) return;
    const aspects = __state.aspects;

    if (aspects.length === 0) {
      content.innerHTML = `<div style="padding: 60px 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <div style="font-size: 52px; margin-bottom: 14px; opacity: .5;">📊</div>
        <div style="font-weight: 800; color: #374151; margin-bottom: 8px;">Belum ada aspek untuk posisi ini</div>
        <div style="font-size: 12px;">Klik <b style="color:#4f46e5;">➕ Tambah Aspek</b> di bawah untuk mulai.</div>
      </div>`;
      return;
    }

    content.innerHTML = aspects.map((a, i) => {
      const total = __totalWeight(a);
      const weightChips = Object.entries(a.weights || {})
        .filter(([k, v]) => Number(v) > 0)
        .map(([k, v]) => `<span style="padding: 2px 8px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 999px; font-size: 10.5px; font-weight: 700; color: #374151; display:inline-block; margin: 2px 3px 2px 0;">${esc(k)}=${v}</span>`)
        .join('');
      const istChips = Array.isArray(a.ist) && a.ist.length ? `📐 IST: ${a.ist.join(', ')}` : '';
      const papiChips = Array.isArray(a.papi) && a.papi.length ? `📊 PAPI: ${a.papi.join(', ')}` : '';
      const bfChips = Array.isArray(a.bigfive) && a.bigfive.length ? `🧠 BigFive: ${a.bigfive.join(', ')}` : '';
      const grafisChip = a.grafisCat ? `🎨 Grafis: ${a.grafisCat.slice(0, 40)}${a.grafisCat.length > 40 ? '…' : ''}` : '';
      const subjChip = a.subjectTest ? '📚 SubjectTest' : '';
      const detailChips = [istChips, papiChips, bfChips, grafisChip, subjChip].filter(Boolean).join(' · ');
      const totalColor = total === 100 ? '#15803d' : '#dc2626';
      return `
        <div class="pgcfg-aspect">
          <div class="pgcfg-aspect-head">
            <div class="pgcfg-idx">${i + 1}</div>
            <div class="pgcfg-aspect-title">
              <div class="pgcfg-aspect-label">${esc(a.label || a.id)}</div>
              <div class="pgcfg-aspect-meta" style="margin-top: 4px;">${weightChips} <span style="color: ${totalColor}; font-weight: 800; margin-left: 6px;">(Total ${total}%)</span></div>
            </div>
            <button class="pgcfg-btn pgcfg-btn-edit" data-idx="${i}" title="Edit">✎</button>
            <button class="pgcfg-btn pgcfg-btn-del" data-idx="${i}" title="Hapus">🗑</button>
          </div>
          ${detailChips ? `<div style="margin-top: 8px; padding-left: 40px; font-size: 10.5px; color: #6b7280; line-height: 1.6;">${detailChips}</div>` : ''}
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
     ASPECT EDITOR MODAL — LIGHT THEME
     ============================================================ */
   function __openAspectEditor(idx) {
    const isNew = idx < 0;
    const a = isNew
      ? { id: '', label: '', weights: {}, ist: [], papi: [], bigfive: [], grafisCat: '', subjectTest: false }
      : JSON.parse(JSON.stringify(__state.aspects[idx]));

    /* 🆕 Sanitasi: pastikan semua field array/object ada (fix 'includes' error) */
    a.ist = Array.isArray(a.ist) ? a.ist : [];
    a.papi = Array.isArray(a.papi) ? a.papi : [];
    a.bigfive = Array.isArray(a.bigfive) ? a.bigfive : [];
    a.weights = (a.weights && typeof a.weights === 'object') ? a.weights : {};
    a.grafisCat = String(a.grafisCat || '');
    a.subjectTest = !!a.subjectTest;

    const old = document.getElementById('pgcfgEditorModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'pgcfgEditorModal';
    modal.style.cssText = `position:fixed;inset:0;z-index:2147483646;background:rgba(15,23,42,.55);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;font-family:Inter,system-ui,sans-serif;`;

    modal.innerHTML = `
      <style>
        #pgcfgEditorModal .pgcfg-input,
        #pgcfgEditorModal .pgcfg-weight {
          width: 100%;
          padding: 10px 12px;
          background: #ffffff;
          border: 1.5px solid #d1d5db;
          border-radius: 9px;
          color: #111827;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          outline: none;
          box-sizing: border-box;
          transition: all .15s ease;
        }
        #pgcfgEditorModal .pgcfg-input::placeholder { color: #9ca3af; font-weight: 400; }
        #pgcfgEditorModal .pgcfg-input:focus,
        #pgcfgEditorModal .pgcfg-weight:focus {
          border-color: #6366f1;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(99,102,241,.15);
        }
        #pgcfgEditorModal .pgcfg-input:read-only {
          background: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }
        #pgcfgEditorModal .pgcfg-chk-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
          gap: 6px;
        }
        #pgcfgEditorModal .pgcfg-chk {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 700;
          color: #4b5563;
          cursor: pointer;
          user-select: none;
          transition: all .15s ease;
        }
        #pgcfgEditorModal .pgcfg-chk:hover {
          background: #f3f4f6;
          border-color: #c7d2fe;
        }
        #pgcfgEditorModal .pgcfg-chk.checked {
          background: #eef2ff;
          border-color: #818cf8;
          color: #4338ca;
        }
        #pgcfgEditorModal .pgcfg-chk input { margin: 0; cursor: pointer; accent-color: #6366f1; }
      </style>

      <div style="width:min(780px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(15,23,42,.35);">
        <div style="padding:16px 22px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;gap:12px;">
          <div style="font-size:20px;">${isNew ? '➕' : '✎'}</div>
          <div style="flex:1;font-size:16px;font-weight:900;color:#fff;">${isNew ? 'Tambah Aspek Baru' : 'Edit Aspek'}</div>
          <button id="pgcfgEdClose" style="width:34px;height:34px;display:grid;place-items:center;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35);border-radius:9px;color:#fff;font-size:15px;cursor:pointer;font-family:inherit;">✕</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:20px 22px;background:#ffffff;" id="pgcfgEdBody"></div>
        <div style="padding:14px 22px;background:#f8fafc;border-top:1px solid #e5e7eb;display:flex;gap:10px;justify-content:flex-end;">
          <button id="pgcfgEdCancel" style="padding:11px 20px;background:#ffffff;border:1.5px solid #d1d5db;border-radius:10px;color:#374151;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;transition:all .15s ease;">Batal</button>
          <button id="pgcfgEdSave" style="padding:11px 24px;background:linear-gradient(135deg,#16a34a,#059669);border:0;border-radius:10px;color:#fff;font-family:inherit;font-size:13px;font-weight:900;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,.25);transition:all .15s ease;">✓ Simpan Aspek</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

       function renderBody() {
      const body = document.getElementById('pgcfgEdBody');
      if (!body) return;

      /* 🆕 Defensive: pastikan array sebelum dipakai di template */
      const __istArr = Array.isArray(a.ist) ? a.ist : (a.ist = []);
      const __papiArr = Array.isArray(a.papi) ? a.papi : (a.papi = []);
      const __bfArr = Array.isArray(a.bigfive) ? a.bigfive : (a.bigfive = []);

      const totalW = __totalWeight(a);
      const totalColor = totalW === 100 ? '#059669' : '#dc2626';
      const suggestions = __getGrafisSuggestions();

      body.innerHTML = `
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#4b5563;letter-spacing:.5px;margin-bottom:6px;">ID <span style="color:#dc2626;">*</span> <span style="font-weight:600;color:#9ca3af;letter-spacing:0;">(unik, tanpa spasi)</span></label>
          <input type="text" id="pgcfgEdId" class="pgcfg-input" value="${esc(a.id)}" placeholder="contoh: cognitive_ability" ${!isNew ? 'readonly' : ''}>
          <div style="font-size:10.5px;color:#9ca3af;margin-top:4px;">Huruf kecil, angka, underscore. Wajib unik.</div>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#4b5563;letter-spacing:.5px;margin-bottom:6px;">LABEL <span style="color:#dc2626;">*</span></label>
          <input type="text" id="pgcfgEdLabel" class="pgcfg-input" value="${esc(a.label)}" placeholder="contoh: Cognitive Ability & Problem Solving">
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#4b5563;letter-spacing:.5px;margin-bottom:8px;">
            BOBOT SUMBER <span id="pgcfgEdTotal" style="color:${totalColor};font-size:12px;margin-left:8px;">Total: ${totalW}%</span>
          </label>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;">
            ${SOURCES.map(src => `
              <div style="display:flex;align-items:center;gap:8px;">
                <label style="flex:0 0 100px;font-size:12px;font-weight:700;color:#374151;">${src}</label>
                <input type="number" class="pgcfg-input pgcfg-weight" data-src="${src}" value="${Number(a.weights?.[src]) || 0}" min="0" max="100" step="1" style="flex:1;">
              </div>
            `).join('')}
          </div>
          <div style="font-size:10.5px;color:#9ca3af;margin-top:4px;">Total sebaiknya 100. Kosong = 0 = tidak dipakai.</div>
        </div>
                <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#4b5563;letter-spacing:.5px;margin-bottom:8px;">SUBTES IST</label>
          <div class="pgcfg-chk-grid">
            ${IST_SUBTES.map(s => `
              <label class="pgcfg-chk ${__istArr.includes(s) ? 'checked' : ''}" data-group="ist" data-val="${s}">
                <input type="checkbox" ${__istArr.includes(s) ? 'checked' : ''}> ${s}
              </label>
            `).join('')}
          </div>
        </div>
               <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#4b5563;letter-spacing:.5px;margin-bottom:8px;">DIMENSI PAPI</label>
          <div class="pgcfg-chk-grid">
            ${PAPI_DIMS.map(s => `
              <label class="pgcfg-chk ${__papiArr.includes(s) ? 'checked' : ''}" data-group="papi" data-val="${s}">
                <input type="checkbox" ${__papiArr.includes(s) ? 'checked' : ''}> ${s}
              </label>
            `).join('')}
          </div>
        </div>
                <div style="margin-bottom:16px;">
  <label style="display:block;font-size:11px;font-weight:800;color:#4b5563;letter-spacing:.5px;margin-bottom:8px;">
    DIMENSI BIG FIVE
    <span style="font-size:10px;color:#9ca3af;font-weight:600;">— N (Neuroticism) otomatis di-reverse oleh sistem</span>
  </label>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:6px;">
    ${BIGFIVE_DIMS.map(s => `
      <label class="pgcfg-chk ${(__bfArr.includes(s) || __bfArr.includes(s + '_rev')) ? 'checked' : ''}" data-group="bigfive" data-val="${s}">
        <input type="checkbox" ${(__bfArr.includes(s) || __bfArr.includes(s + '_rev')) ? 'checked' : ''}> ${s}
      </label>
    `).join('')}
  </div>
</div>
                <!-- 🆕 Checkbox Khusus -->
        <div style="margin-bottom:16px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9px;">
          <div style="font-size:11px;font-weight:800;color:#4b5563;margin-bottom:10px;">SUMBER NILAI TAMBAHAN (KHUSUS POSISI INI)</div>
          ${(() => {
            const POS_EXTRA = {
              'admin': [{ key: 'Excel', label: 'Pakai nilai Excel untuk aspek ini' }, { key: 'Typing', label: 'Pakai nilai Ketik untuk aspek ini' }],
              'guru': [{ key: 'FGD', label: 'Pakai nilai FGD untuk aspek ini' }, { key: 'SubjectTest', label: 'Pakai nilai Subjek untuk aspek ini' }],
              'welder': [{ key: 'TechnicalTest', label: 'Pakai Kemampuan Teknis untuk aspek ini' }],
              'technical': [{ key: 'TechnicalTest', label: 'Pakai Kemampuan Teknis untuk aspek ini' }],
              'housekeeping': [{ key: 'TechnicalTest', label: 'Pakai Kemampuan Teknis untuk aspek ini' }]
            };
            const extras = POS_EXTRA[__state.category] || [];
            if (extras.length === 0) return '<div style="font-size:12px;color:#94a3b8;font-style:italic;">Tidak ada sumber tambahan untuk posisi ini.</div>';
            return extras.map(ex => `
              <label class="pgcfg-chk ${a.weights[ex.key] > 0 ? 'checked' : ''}" data-src="${ex.key}" style="display:flex;margin-bottom:6px;padding:10px 14px;">
                <input type="checkbox" ${a.weights[ex.key] > 0 ? 'checked' : ''}>
                ${ex.label}
              </label>
            `).join('');
          })()}
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
            totalEl.style.color = t === 100 ? '#059669' : '#dc2626';
          }
        };
      });

     body.querySelectorAll('.pgcfg-chk[data-group]').forEach(chk => {
  const inp = chk.querySelector('input');
  if (!inp) return;
  const group = chk.getAttribute('data-group');
  const val = chk.getAttribute('data-val');
  if (!group || !val) return;
  inp.onchange = () => {
    let arr = (a[group] || []).filter(x => x !== val && x !== (val + '_rev'));
    if (inp.checked) arr.push(val);   // selalu simpan tanpa suffix — auto-reverse handle
    chk.classList.toggle('checked', inp.checked);
    a[group] = arr;
  };
});

            // 🆕 Event Listener Checkbox Ekstra
      body.querySelectorAll('.pgcfg-chk[data-src]').forEach(chk => {
        const inp = chk.querySelector('input');
        const src = chk.getAttribute('data-src');
        inp.onchange = () => {
          chk.classList.toggle('checked', inp.checked);
          if (inp.checked) a.weights[src] = 10; // Default bobot 10 jika dicentang
          else delete a.weights[src];
          const totalEl = document.getElementById('pgcfgEdTotal');
          if (totalEl) {
            const t = __totalWeight(a);
            totalEl.textContent = 'Total: ' + t + '%';
            totalEl.style.color = t === 100 ? '#059669' : '#dc2626';
          }
        };
      });

      const subjChk = body.querySelector('#pgcfgEdSubj');
      if (subjChk) {
        const subjLabel = subjChk.closest('.pgcfg-chk');
        subjChk.onchange = () => {
          a.subjectTest = subjChk.checked;
          if (subjLabel) {
            if (subjChk.checked) subjLabel.classList.add('checked');
            else subjLabel.classList.remove('checked');
          }
        };
      }
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
      a.grafisCat = String(a.grafisCat || '').trim();
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
    if (status) { status.style.color = '#1e40af'; status.textContent = 'Menyimpan ke Firebase...'; }
    try {
      await __saveConfig();
      if (status) { status.style.color = '#15803d'; status.textContent = '✅ Tersimpan — config aktif sekarang.'; }
      __renderBanner();
    } catch (e) {
      if (status) { status.style.color = '#dc2626'; status.textContent = '❌ ' + e.message; }
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
      if (status) { status.style.color = '#15803d'; status.textContent = '✅ Reset ke default JS.'; }
    } catch (e) {
      if (status) { status.style.color = '#dc2626'; status.textContent = '❌ ' + e.message; }
      alert('Gagal reset: ' + e.message);
    }
  }

  async function __handleMovePosition() {
    if (__state.aspects.length === 0) return alert('Tidak ada aspek untuk dipindah.');
    
    const otherPos = POSITIONS.filter(p => p.key !== __state.category).map(p => `${p.key} (${p.label})`).join('\n');
    const target = prompt(`Pindahkan ${__state.aspects.length} aspek dari "${__state.category}" ke posisi mana?\n\nKetik key posisi tujuan:\n${otherPos}`);
    
    if (!target || target === __state.category) return;
    const validKeys = POSITIONS.map(p => p.key);
    if (!validKeys.includes(target)) return alert('Posisi tujuan tidak valid!');

    if (!confirm(`Yakin pindahkan SEMUA aspek dari ${__state.category} ke ${target}?`)) return;

    const btn = document.getElementById('pgcfgMoveBtn');
    btn.textContent = '⏳ Memindahkan...'; btn.disabled = true;

    try {
      await firebase.database().ref('sgs_config/psikogram_config/' + target).update({
        aspects: __state.aspects,
        label: (window.PSIKOGRAM_CONFIG[target] && window.PSIKOGRAM_CONFIG[target].label) || target,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        updatedBy: 'admin'
      });
      
      await firebase.database().ref('sgs_config/psikogram_config/' + __state.category).remove();
      
      alert(`Berhasil memindahkan aspek ke ${target}. Halaman akan dimuat ulang.`);
      window.location.reload();
    } catch (e) {
      alert('Gagal memindahkan: ' + e.message);
      btn.textContent = '🔄 Pindah Posisi'; btn.disabled = false;
    }
  }

  /* ============================================================
     PUBLIC ENTRY — Sidebar tidak tertutup
     ============================================================ */
  window.openPsikogramConfigPage = async function () {
    const old = document.getElementById('psikogramConfigOverlay');
    if (old) old.remove();

    __state.fbConfig = await __loadFbConfig();
    __loadCategory('guru');

    const ov = document.createElement('div');
    ov.id = 'psikogramConfigOverlay';
    ov.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: ${__getSidebarOffset()}px;
      z-index: 100001;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      display: flex;
      flex-direction: column;
      font-family: Inter, system-ui, sans-serif;
      color: #111827;
      overflow: hidden;
      transition: left .2s ease;
    `;
    document.body.appendChild(ov);

    __renderShell(ov);

    /* Resize handling — update left offset saat window di-resize */
    const resizeHandler = () => {
      if (!document.getElementById('psikogramConfigOverlay')) {
        window.removeEventListener('resize', resizeHandler);
        return;
      }
      ov.style.left = __getSidebarOffset() + 'px';
    };
    window.addEventListener('resize', resizeHandler);

    /* MutationObserver — cleanup listener saat overlay ditutup */
    const observer = new MutationObserver(() => {
      if (!document.getElementById('psikogramConfigOverlay')) {
        window.removeEventListener('resize', resizeHandler);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true });
  };

  console.log('[PGCFG-ADMIN] ✓ Loaded v2 — light theme + sidebar offset + grafis free-text');
})();