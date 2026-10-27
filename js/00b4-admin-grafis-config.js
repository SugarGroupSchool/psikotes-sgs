/* ============================================================
   js/00b4-admin-grafis-config.js — Grafis Config Admin UI
   ------------------------------------------------------------
   v1.0.0 [2026-10-23] — BATCH 2: Full CRUD
   ------------------------------------------------------------
   - Edit kategori GRAFIS per posisi (6 posisi)
   - Simpan ke Firebase: sgs_config/grafis_config/{position}
   - Priority: Firebase override > JS default (window.GRAFIS_CONFIG)
   - Light theme konsisten dengan 00b3-admin-psikogram-config.js
   ============================================================ */
(function () {
  'use strict';

  if (window.__grafisConfigPageFull) return;
  window.__grafisConfigPageFull = true;

   const POSITIONS = window.MASTER_POSITIONS || [
    { key: 'guru', label: 'Guru / Dosen', icon: '📚' },
    { key: 'admin', label: 'Administrator', icon: '💼' },
    { key: 'it', label: 'IT Staff', icon: '💻' },
    { key: 'welder', label: 'Welder', icon: '🔧' },
    { key: 'technical', label: 'Technical', icon: '⚙️' },
    { key: 'housekeeping', label: 'Housekeeping', icon: '🧹' }
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
    position: 'guru',
    aspects: [],
    isOverride: false,
    fbConfig: null,
    dirty: false
  };

  /* ============================================================
     DATA LAYER
     ============================================================ */
  async function __loadFbConfig() {
    if (!fbReady()) return {};
    try {
      const snap = await firebase.database().ref('sgs_config/grafis_config').once('value');
      return snap.val() || {};
    } catch (e) {
      console.warn('[GRAFIS-CFG] Load FB gagal:', e.message);
      return {};
    }
  }

  function __getDefaultAspects(position) {
    if (window.GRAFIS_CONFIG && window.GRAFIS_CONFIG[position] && Array.isArray(window.GRAFIS_CONFIG[position].aspects)) {
      return JSON.parse(JSON.stringify(window.GRAFIS_CONFIG[position].aspects));
    }
    if (window.GRAFIS_CONFIG && window.GRAFIS_CONFIG.default && Array.isArray(window.GRAFIS_CONFIG.default.aspects)) {
      return JSON.parse(JSON.stringify(window.GRAFIS_CONFIG.default.aspects));
    }
    if (window.GRAFIS_SCORING && window.GRAFIS_SCORING.CONFIG && Array.isArray(window.GRAFIS_SCORING.CONFIG.KATEGORI)) {
      return window.GRAFIS_SCORING.CONFIG.KATEGORI.map((name, i) => ({
        id: 'legacy-' + i,
        label: name,
        description: ''
      }));
    }
    return [];
  }

  function __loadPosition(position) {
    const fbPos = __state.fbConfig && __state.fbConfig[position];
    const fbAspects = fbPos && Array.isArray(fbPos.aspects) ? fbPos.aspects : null;
    if (fbAspects && fbAspects.length > 0) {
      __state.aspects = JSON.parse(JSON.stringify(fbAspects));
      __state.isOverride = true;
    } else {
      __state.aspects = __getDefaultAspects(position);
      __state.isOverride = false;
    }
    __state.position = position;
    __state.dirty = false;
  }

  function _slugFromLabel(label) {
    return String(label || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  }

  async function __saveConfig() {
    if (!fbReady()) throw new Error('Firebase belum siap');
    const seen = new Set();
    for (const a of __state.aspects) {
      if (!a.id || !String(a.id).trim()) throw new Error('Ada kategori tanpa ID');
      if (seen.has(a.id)) throw new Error('ID kategori duplikat: ' + a.id);
      seen.add(a.id);
    }
    const clean = __state.aspects.map(a => ({
      id: String(a.id || '').trim(),
      label: String(a.label || '').trim(),
      description: String(a.description || '').trim()
    }));
       // 🆕 TRIK: Jika array kosong, kirim {} agar Firebase tidak menganggapnya delete
    const payloadAspects = clean.length > 0 ? clean : {};
    
    await firebase.database().ref('sgs_config/grafis_config/' + __state.position).update({
      aspects: payloadAspects,
      label: (window.GRAFIS_CONFIG && window.GRAFIS_CONFIG[__state.position] && window.GRAFIS_CONFIG[__state.position].label) || __state.position,
      updatedAt: firebase.database.ServerValue.TIMESTAMP,
      updatedBy: 'admin'
    });
    __state.isOverride = true;
    __state.dirty = false;
    __state.fbConfig = __state.fbConfig || {};
    __state.fbConfig[__state.position] = { aspects: clean };
  }

  async function __resetToDefault() {
    if (!fbReady()) throw new Error('Firebase belum siap');
    await firebase.database().ref('sgs_config/grafis_config/' + __state.position).remove();
    if (__state.fbConfig) delete __state.fbConfig[__state.position];
    __loadPosition(__state.position);
  }

  /* ============================================================
     RENDER SHELL
     ============================================================ */
  function __renderShell(ov) {
    ov.innerHTML = `
      <style>
        #grafisConfigOverlay .grcfg-tabs-bar {
          padding: 0 24px; display: flex; gap: 4px; overflow-x: auto;
          background: #f8fafc; border-bottom: 1px solid #e5e7eb;
        }
        #grafisConfigOverlay .grcfg-tab {
          padding: 12px 18px; border: 0; background: transparent;
          color: #6b7280; font-family: inherit; font-size: 13px; font-weight: 800;
          cursor: pointer; border-bottom: 3px solid transparent; white-space: nowrap;
          transition: all .15s ease;
        }
        #grafisConfigOverlay .grcfg-tab:hover { color: #0ea5e9; }
        #grafisConfigOverlay .grcfg-tab.active { color: #0ea5e9; border-bottom-color: #0ea5e9; }

        #grafisConfigOverlay .grcfg-aspect {
          padding: 14px 16px; background: #ffffff; border: 1px solid #e5e7eb;
          border-radius: 12px; margin-bottom: 10px;
          box-shadow: 0 1px 3px rgba(15,23,42,.04);
          transition: all .18s ease;
        }
        #grafisConfigOverlay .grcfg-aspect:hover {
          box-shadow: 0 4px 14px rgba(15,23,42,.08);
          border-color: #bae6fd;
        }
        #grafisConfigOverlay .grcfg-aspect-head { display: flex; gap: 12px; align-items: flex-start; }
        #grafisConfigOverlay .grcfg-idx {
          width: 28px; height: 28px; flex: 0 0 28px; display: grid; place-items: center;
          background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 7px;
          font-size: 12px; font-weight: 900; color: #0369a1;
        }
        #grafisConfigOverlay .grcfg-aspect-title { flex: 1; min-width: 0; }
        #grafisConfigOverlay .grcfg-aspect-label {
          font-size: 13.5px; font-weight: 800; color: #111827; margin-bottom: 3px;
        }
        #grafisConfigOverlay .grcfg-aspect-meta {
          font-size: 11px; color: #6b7280; line-height: 1.5;
        }
        #grafisConfigOverlay .grcfg-btn {
          padding: 8px 14px; border: 0; border-radius: 9px;
          font-family: inherit; font-size: 12px; font-weight: 800; cursor: pointer;
          transition: all .15s ease;
        }
        #grafisConfigOverlay .grcfg-btn-edit {
          background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;
        }
        #grafisConfigOverlay .grcfg-btn-edit:hover { background: #bae6fd; border-color: #7dd3fc; }
        #grafisConfigOverlay .grcfg-btn-del {
          background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
        }
        #grafisConfigOverlay .grcfg-btn-del:hover { background: #fee2e2; border-color: #fca5a5; }
      </style>

      <div style="padding: 18px 24px; background: #ffffff; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
        <button id="grcfgBackBtn" style="width: 42px; height: 42px; flex: 0 0 42px; display: grid; place-items: center; background: #f8fafc; border: 1.5px solid #e5e7eb; border-radius: 12px; color: #4b5563; font-size: 18px; cursor: pointer; font-family: inherit; transition: all .15s ease;" onmouseover="this.style.background='#f3f4f6';this.style.color='#0ea5e9';" onmouseout="this.style.background='#f8fafc';this.style.color='#4b5563';">←</button>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #0ea5e9; margin-bottom: 4px;">ADMIN PANEL · KONFIGURASI</div>
          <div style="font-size: 22px; font-weight: 900; color: #111827;">🎨 Grafis Config</div>
        </div>
        <button id="grcfgSaveBtn" style="padding: 11px 22px; background: linear-gradient(135deg,#16a34a,#059669); border: 0; border-radius: 11px; color: #fff; font-family: inherit; font-size: 13px; font-weight: 900; cursor: pointer; box-shadow: 0 4px 14px rgba(22,163,74,.25); transition: all .15s ease;">💾 Simpan</button>
<button id="grcfgMoveBtn" style="padding: 11px 18px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 11px; color: #0ea5e9; font-family: inherit; font-size: 13px; font-weight: 800; cursor: pointer; transition: all .15s ease;">🔄 Pindah Posisi</button>
        <button id="grcfgResetBtn" style="padding: 11px 18px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 11px; color: #dc2626; font-family: inherit; font-size: 13px; font-weight: 800; cursor: pointer; transition: all .15s ease;">↺ Reset Default</button>
      </div>

      <div class="grcfg-tabs-bar" id="grcfgTabs"></div>
      <div id="grcfgBanner" style="padding: 12px 24px;"></div>
      <div id="grcfgContent" style="flex: 1; overflow-y: auto; padding: 16px 24px 100px;"></div>

      <div style="padding: 14px 24px; background: #ffffff; border-top: 1px solid #e5e7eb; display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
        <button id="grcfgAddBtn" style="padding: 11px 22px; background: linear-gradient(135deg,#0ea5e9,#0284c7); border: 0; border-radius: 11px; color: #fff; font-family: inherit; font-size: 13px; font-weight: 900; cursor: pointer; box-shadow: 0 4px 14px rgba(14,165,233,.25); transition: all .15s ease;">➕ Tambah Kategori</button>
        <div id="grcfgStatus" style="font-size: 12px; color: #6b7280; font-weight: 600;"></div>
      </div>
    `;

    document.getElementById('grcfgBackBtn').onclick = () => {
      if (__state.dirty) {
        if (!confirm('Ada perubahan yang belum disimpan. Tutup dan buang perubahan?')) return;
      }
      ov.remove();
    };
    document.getElementById('grcfgSaveBtn').onclick = __handleSave;
    document.getElementById('grcfgResetBtn').onclick = __handleReset;
    document.getElementById('grcfgMoveBtn').onclick = __handleMovePosition;
    document.getElementById('grcfgAddBtn').onclick = () => __openAspectEditor(-1);

    __renderTabs();
    __renderContent();
  }

  function __renderTabs() {
    const bar = document.getElementById('grcfgTabs');
    if (!bar) return;
    bar.innerHTML = POSITIONS.map(p => {
      const active = __state.position === p.key;
      return `<button class="grcfg-tab${active ? ' active' : ''}" data-pos="${p.key}">${p.icon} ${esc(p.label)}</button>`;
    }).join('');
    bar.querySelectorAll('.grcfg-tab').forEach(btn => {
      btn.onclick = () => {
        if (__state.dirty) {
          if (!confirm('Ada perubahan yang belum disimpan. Ganti tab dan buang perubahan?')) return;
        }
        __loadPosition(btn.getAttribute('data-pos'));
        __renderTabs();
        __renderBanner();
        __renderContent();
      };
    });
    __renderBanner();
  }

  function __renderBanner() {
    const el = document.getElementById('grcfgBanner');
    if (!el) return;
    if (__state.isOverride) {
      el.innerHTML = `<div style="padding: 9px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; font-size: 12px; color: #15803d; font-weight: 600;">✅ Menggunakan <b style="color:#166534;">config dari Firebase</b> — perubahan tersimpan permanen.</div>`;
    } else {
      el.innerHTML = `<div style="padding: 9px 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; font-size: 12px; color: #a16207; font-weight: 600;">📋 Menampilkan <b style="color:#92400e;">default dari JS</b>. Klik 💾 Simpan untuk override ke Firebase.</div>`;
    }
  }

  function __renderContent() {
    const content = document.getElementById('grcfgContent');
    if (!content) return;
    const aspects = __state.aspects;

    if (aspects.length === 0) {
      content.innerHTML = `<div style="padding: 60px 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <div style="font-size: 52px; margin-bottom: 14px; opacity: .5;">🎨</div>
        <div style="font-weight: 800; color: #374151; margin-bottom: 8px;">Belum ada kategori untuk posisi ini</div>
        <div style="font-size: 12px;">Klik <b style="color:#0ea5e9;">➕ Tambah Kategori</b> di bawah untuk mulai.</div>
      </div>`;
      return;
    }

    content.innerHTML = aspects.map((a, i) => {
      return `
        <div class="grcfg-aspect">
          <div class="grcfg-aspect-head">
            <div class="grcfg-idx">${i + 1}</div>
            <div class="grcfg-aspect-title">
              <div class="grcfg-aspect-label">${esc(a.label || a.id)}</div>
              <div class="grcfg-aspect-meta" style="margin-top: 4px;">
                <span style="display: inline-block; padding: 2px 8px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 999px; font-size: 10.5px; font-weight: 700; color: #374151;">ID: ${esc(a.id)}</span>
                ${a.description ? `<span style="margin-left: 6px;">${esc(a.description).slice(0, 100)}${a.description.length > 100 ? '…' : ''}</span>` : ''}
              </div>
            </div>
            <button class="grcfg-btn grcfg-btn-edit" data-idx="${i}" title="Edit">✎</button>
            <button class="grcfg-btn grcfg-btn-del" data-idx="${i}" title="Hapus">🗑</button>
          </div>
        </div>
      `;
    }).join('');

    content.querySelectorAll('.grcfg-btn-edit').forEach(btn => {
      btn.onclick = () => __openAspectEditor(Number(btn.getAttribute('data-idx')));
    });
    content.querySelectorAll('.grcfg-btn-del').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute('data-idx'));
        if (!confirm('Hapus kategori "' + (__state.aspects[idx].label || __state.aspects[idx].id) + '"?')) return;
        __state.aspects.splice(idx, 1);
        __state.dirty = true;
        __renderContent();
      };
    });
  }

  /* ============================================================
     EDITOR MODAL — LIGHT THEME
     ============================================================ */
  function __openAspectEditor(idx) {
    const isNew = idx < 0;
    const a = isNew
      ? { id: '', label: '', description: '' }
      : JSON.parse(JSON.stringify(__state.aspects[idx]));

    const old = document.getElementById('grcfgEditorModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'grcfgEditorModal';
    modal.style.cssText = `position:fixed;inset:0;z-index:2147483646;background:rgba(15,23,42,.55);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;font-family:Inter,system-ui,sans-serif;`;

    modal.innerHTML = `
      <style>
        #grcfgEditorModal .grcfg-input {
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
        #grcfgEditorModal .grcfg-input::placeholder { color: #9ca3af; font-weight: 400; }
        #grcfgEditorModal .grcfg-input:focus {
          border-color: #0ea5e9;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(14,165,233,.15);
        }
        #grcfgEditorModal .grcfg-input:read-only {
          background: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }
        #grcfgEditorModal textarea.grcfg-input {
          min-height: 80px;
          resize: vertical;
          font-family: inherit;
          line-height: 1.5;
        }
      </style>

      <div style="width:min(560px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(15,23,42,.35);">
        <div style="padding:16px 22px;background:linear-gradient(135deg,#0ea5e9,#0284c7);display:flex;align-items:center;gap:12px;">
          <div style="font-size:20px;">${isNew ? '➕' : '✎'}</div>
          <div style="flex:1;font-size:16px;font-weight:900;color:#fff;">${isNew ? 'Tambah Kategori Baru' : 'Edit Kategori'}</div>
          <button id="grcfgEdClose" style="width:34px;height:34px;display:grid;place-items:center;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35);border-radius:9px;color:#fff;font-size:15px;cursor:pointer;font-family:inherit;">✕</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:20px 22px;background:#ffffff;" id="grcfgEdBody"></div>
        <div style="padding:14px 22px;background:#f8fafc;border-top:1px solid #e5e7eb;display:flex;gap:10px;justify-content:flex-end;">
          <button id="grcfgEdCancel" style="padding:11px 20px;background:#ffffff;border:1.5px solid #d1d5db;border-radius:10px;color:#374151;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;transition:all .15s ease;">Batal</button>
          <button id="grcfgEdSave" style="padding:11px 24px;background:linear-gradient(135deg,#16a34a,#059669);border:0;border-radius:10px;color:#fff;font-family:inherit;font-size:13px;font-weight:900;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,.25);transition:all .15s ease;">✓ Simpan</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    function renderBody() {
      const body = document.getElementById('grcfgEdBody');
      if (!body) return;
      body.innerHTML = `
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#4b5563;letter-spacing:.5px;margin-bottom:6px;">ID <span style="color:#dc2626;">*</span> <span style="font-weight:600;color:#9ca3af;letter-spacing:0;">(unik, tanpa spasi)</span></label>
          <input type="text" id="grcfgEdId" class="grcfg-input" value="${esc(a.id)}" placeholder="contoh: kemampuan-berpikir" ${!isNew ? 'readonly' : ''}>
          <div style="font-size:10.5px;color:#9ca3af;margin-top:4px;">Auto-generate dari label jika kosong. Huruf kecil, angka, dash.</div>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#4b5563;letter-spacing:.5px;margin-bottom:6px;">LABEL <span style="color:#dc2626;">*</span></label>
          <input type="text" id="grcfgEdLabel" class="grcfg-input" value="${esc(a.label)}" placeholder="contoh: KEMAMPUAN BERPIKIR & PROBLEM SOLVING">
        </div>
        <div style="margin-bottom:8px;">
          <label style="display:block;font-size:11px;font-weight:800;color:#4b5563;letter-spacing:.5px;margin-bottom:6px;">DESKRIPSI <span style="font-weight:600;color:#9ca3af;letter-spacing:0;">(opsional)</span></label>
          <textarea id="grcfgEdDesc" class="grcfg-input" placeholder="Keterangan singkat kategori (opsional)...">${esc(a.description || '')}</textarea>
        </div>
      `;

      const idInput = body.querySelector('#grcfgEdId');
      const labelInput = body.querySelector('#grcfgEdLabel');
      const descInput = body.querySelector('#grcfgEdDesc');

      if (idInput) idInput.oninput = () => { a.id = idInput.value; };
      if (labelInput) {
        labelInput.oninput = () => {
          a.label = labelInput.value;
          if (isNew && (!a.id || !a.id.trim())) {
            const slug = _slugFromLabel(labelInput.value);
            if (slug && idInput) idInput.value = slug;
            a.id = slug;
          }
        };
      }
      if (descInput) descInput.oninput = () => { a.description = descInput.value; };
    }

    renderBody();

    document.getElementById('grcfgEdClose').onclick = () => modal.remove();
    document.getElementById('grcfgEdCancel').onclick = () => modal.remove();
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    document.getElementById('grcfgEdSave').onclick = () => {
      const finalId = (a.id || '').trim() || _slugFromLabel(a.label || '');
      if (!finalId) { alert('ID wajib diisi'); return; }
      if (!a.label || !String(a.label).trim()) { alert('Label wajib diisi'); return; }
      const conflict = __state.aspects.some((x, i) => i !== idx && x.id === finalId);
      if (conflict) { alert('ID sudah dipakai kategori lain: ' + finalId); return; }
      a.id = finalId;
      a.label = a.label.trim();
      a.description = String(a.description || '').trim();
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
    const btn = document.getElementById('grcfgSaveBtn');
    const status = document.getElementById('grcfgStatus');
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
    if (!confirm('Reset config posisi ini ke default dari JS?\n\nSemua perubahan di Firebase akan dihapus.')) return;
    const status = document.getElementById('grcfgStatus');
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
    
    // Buat list pilihan posisi selain posisi saat ini
    const otherPos = POSITIONS.filter(p => p.key !== __state.position).map(p => `${p.key} (${p.label})`).join('\n');
    const target = prompt(`Pindahkan ${__state.aspects.length} aspek dari "${__state.position}" ke posisi mana?\n\nKetik key posisi tujuan:\n${otherPos}`);
    
    if (!target || target === __state.position) return;
    const validKeys = POSITIONS.map(p => p.key);
    if (!validKeys.includes(target)) return alert('Posisi tujuan tidak valid!');

    if (!confirm(`Yakin pindahkan SEMUA aspek dari ${__state.position} ke ${target}?`)) return;

    const btn = document.getElementById('grcfgMoveBtn');
    btn.textContent = '⏳ Memindahkan...'; btn.disabled = true;

    try {
      // 1. Simpan ke posisi tujuan
      await firebase.database().ref('sgs_config/grafis_config/' + target).update({
        aspects: __state.aspects,
        label: (window.GRAFIS_CONFIG[target] && window.GRAFIS_CONFIG[target].label) || target,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        updatedBy: 'admin'
      });
      
      // 2. Hapus dari posisi asal
      await firebase.database().ref('sgs_config/grafis_config/' + __state.position).remove();
      
      alert(`Berhasil memindahkan aspek ke ${target}. Halaman akan dimuat ulang.`);
      window.location.reload();
    } catch (e) {
      alert('Gagal memindahkan: ' + e.message);
      btn.textContent = '🔄 Pindah Posisi'; btn.disabled = false;
    }
  }

  /* ============================================================
     PUBLIC ENTRY
     ============================================================ */
  window.openGrafisConfigPage = async function () {
    const old = document.getElementById('grafisConfigOverlay');
    if (old) old.remove();

    __state.fbConfig = await __loadFbConfig();
    __loadPosition('guru');

    const ov = document.createElement('div');
    ov.id = 'grafisConfigOverlay';
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

    const resizeHandler = () => {
      if (!document.getElementById('grafisConfigOverlay')) {
        window.removeEventListener('resize', resizeHandler);
        return;
      }
      ov.style.left = __getSidebarOffset() + 'px';
    };
    window.addEventListener('resize', resizeHandler);

    const observer = new MutationObserver(() => {
      if (!document.getElementById('grafisConfigOverlay')) {
        window.removeEventListener('resize', resizeHandler);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true });
  };

  console.log('[GRAFIS-CONFIG-ADMIN] ✓ Loaded v1.0.0 — full UI (Batch 2)');
})();