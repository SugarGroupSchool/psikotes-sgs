/* ============================================================
   js/00r-admin-assessors.js
   ------------------------------------------------------------
   Admin panel: kelola 2 daftar asesor (FGD & Interview) — TAB
   ============================================================ */

(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(msg, color) {
    color = color || '#16a34a';
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:12px 18px;border-radius:10px;background:' + color + ';color:#fff;font-weight:800;font-size:13px;z-index:2147483647;font-family:Inter,system-ui,sans-serif;box-shadow:0 10px 26px ' + color + '55;';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  window.openAssessorSettingsPage = function () {
    if (typeof window.ASSESSORS === 'undefined') {
      alert('Modul asesor belum siap. Refresh halaman.');
      return;
    }

    const old = document.getElementById('assessorSettingsPageOverlay');
    if (old) old.remove();

    let activeTab = 'fgd'; // 'fgd' | 'interview'

    const overlay = document.createElement('div');
    overlay.id = 'assessorSettingsPageOverlay';
    overlay.style.cssText = `position: fixed; inset: 0; z-index: 100002;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      display: flex; flex-direction: column;
      font-family: Inter, system-ui, -apple-system, sans-serif;
      color: #e2e8f0; overflow: hidden;`;

    overlay.innerHTML = `
      <div style="padding: 20px 28px; background: linear-gradient(180deg, rgba(0,0,0,.25), transparent);
        border-bottom: 1px solid rgba(255,255,255,.08); display: flex; align-items: center; gap: 18px;">
        <button id="asBackBtn" style="width: 42px; height: 42px; flex: 0 0 42px;
          display: grid; place-items: center; background: rgba(255,255,255,.08);
          border: 1.5px solid rgba(255,255,255,.14); border-radius: 12px; color: #fff;
          font-size: 18px; cursor: pointer; font-family: inherit;">←</button>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #a5b4fc; margin-bottom: 4px;">
            ADMIN PANEL · KONFIGURASI
          </div>
          <div style="font-size: 22px; font-weight: 900; color: #fff;">👥 Kelola Asesor</div>
        </div>
      </div>

      <div style="padding: 0 28px; background: rgba(0,0,0,.15); border-bottom: 1px solid rgba(255,255,255,.08);">
        <div style="display: flex; gap: 4px; padding: 12px 0 0 0;">
          <button class="as-tab" data-tab="fgd"
            style="padding: 12px 22px; border: 0; background: transparent; color: #94a3b8;
              font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer;
              border-bottom: 3px solid transparent; border-radius: 0; transition: all .18s ease;">
            🎯 Asesor FGD
          </button>
          <button class="as-tab" data-tab="interview"
            style="padding: 12px 22px; border: 0; background: transparent; color: #94a3b8;
              font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer;
              border-bottom: 3px solid transparent; border-radius: 0; transition: all .18s ease;">
            🎤 Interviewer
          </button>
        </div>
      </div>

      <div class="as-scroll" style="flex: 1; overflow-y: auto; padding: 24px 28px 40px;">
        <div style="max-width: 720px; margin: 0 auto;">

          <div id="asInfoBox" style="padding: 16px 18px; background: rgba(59,130,246,.1);
            border: 1px solid rgba(59,130,246,.3); border-radius: 14px;
            font-size: 13px; color: #bfdbfe; line-height: 1.7; margin-bottom: 22px;"></div>

          <div style="display: flex; gap: 8px; margin-bottom: 18px;">
            <input id="asNewInput" type="text" placeholder="Tambah nama baru..."
              autocomplete="off" maxlength="20"
              style="flex: 1; padding: 14px 16px; border: 2px solid rgba(255,255,255,.15);
                border-radius: 12px; background: rgba(255,255,255,.05); color: #fff;
                font-family: inherit; font-size: 14px; outline: none; text-transform: uppercase;">
            <button id="asAddBtn" style="padding: 14px 22px; background: linear-gradient(135deg, #16a34a, #059669);
              color: #fff; border: 0; border-radius: 12px; font-family: inherit;
              font-size: 14px; font-weight: 800; cursor: pointer; white-space: nowrap;">
              ➕ Tambah
            </button>
          </div>

          <div id="asList" style="display: flex; flex-direction: column; gap: 10px;"></div>

          <div style="margin-top: 24px; padding: 16px 18px; background: rgba(239,68,68,.08);
            border: 1px solid rgba(239,68,68,.25); border-radius: 14px;">
            <div style="font-size: 12px; font-weight: 800; color: #fca5a5; margin-bottom: 10px;">
              ⚠️ Zona Bahaya
            </div>
            <button id="asResetBtn" style="padding: 10px 18px; background: transparent;
              border: 1.5px solid rgba(239,68,68,.4); color: #fca5a5; border-radius: 10px;
              font-family: inherit; font-size: 12px; font-weight: 800; cursor: pointer;">
              🔄 Reset ke Daftar Default
            </button>
          </div>
        </div>
      </div>

      <style>
        .as-scroll::-webkit-scrollbar { width: 8px; }
        .as-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 4px; }
        #asNewInput:focus { border-color: #3b82f6; background: rgba(255,255,255,.08); }
        .as-tab:hover { color: #e2e8f0 !important; }
        .as-tab.active { color: #fff !important; border-bottom-color: #3b82f6 !important; }
      </style>
    `;

    document.body.appendChild(overlay);

    document.getElementById('asBackBtn').onclick = () => overlay.remove();

    // Tab handling
    const tabs = overlay.querySelectorAll('.as-tab');
    tabs.forEach(t => {
      t.onclick = () => {
        activeTab = t.getAttribute('data-tab');
        tabs.forEach(x => x.classList.toggle('active', x === t));
        renderInfo();
        renderList();
        document.getElementById('asNewInput').value = '';
      };
    });
    tabs[0].classList.add('active');

    renderInfo();
    renderList();

    document.getElementById('asAddBtn').onclick = () => addAssessor();
    document.getElementById('asNewInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); addAssessor(); }
    });

    document.getElementById('asResetBtn').onclick = () => {
      const label = activeTab === 'fgd' ? 'Asesor FGD' : 'Interviewer';
      if (!confirm('Reset daftar ' + label + ' ke default?')) return;
      window.ASSESSORS.reset(activeTab).then(() => {
        toast('✅ Reset ke default');
        renderList();
      }).catch(e => alert('Gagal: ' + e.message));
    };

    function renderInfo() {
      const box = document.getElementById('asInfoBox');
      const isFgd = activeTab === 'fgd';
      box.innerHTML = isFgd
        ? `<b style="color:#93c5fd;">ℹ️ Asesor FGD</b><br>
           • Daftar ini <b>hanya</b> muncul di <b>Form Penilaian FGD</b><br>
           • Tidak mempengaruhi daftar Interviewer<br>
           • Perubahan real-time (tanpa refresh)`
        : `<b style="color:#93c5fd;">ℹ️ Interviewer</b><br>
           • Daftar ini <b>hanya</b> muncul di <b>Form Wawancara</b><br>
           • Tidak mempengaruhi daftar Asesor FGD<br>
           • Perubahan real-time (tanpa refresh)`;
    }

    function renderList() {
      const listEl = document.getElementById('asList');
      const list = window.ASSESSORS.getList(activeTab);

      if (!list || list.length === 0) {
        listEl.innerHTML = '<div style="padding: 30px; text-align: center; color: #64748b; font-size: 13px;">Belum ada. Tambahkan di atas.</div>';
        return;
      }

      const tabLabel = activeTab === 'fgd' ? 'Asesor FGD' : 'Interviewer';

      listEl.innerHTML = list.map((name, idx) => `
        <div style="display: flex; align-items: center; gap: 12px; padding: 14px 16px;
          background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
          border: 1px solid rgba(255,255,255,.08); border-radius: 12px;">
          <div style="width: 38px; height: 38px; flex: 0 0 38px; display: grid; place-items: center;
            background: linear-gradient(135deg, ${activeTab === 'fgd' ? '#3b82f6, #1e40af' : '#8b5cf6, #6d28d9'});
            color: #fff; border-radius: 10px; font-weight: 900; font-size: 13px;">
            ${idx + 1}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 15px; font-weight: 900; color: #fff; letter-spacing: .5px;">
              ${escapeHtml(name)}
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${tabLabel}</div>
          </div>
          <button class="as-del-btn" data-name="${escapeHtml(name)}"
            style="padding: 6px 14px; background: rgba(239,68,68,.15); color: #fca5a5;
              border: 1px solid rgba(239,68,68,.35); border-radius: 8px;
              font-family: inherit; font-size: 11px; font-weight: 800; cursor: pointer;">
            🗑 Hapus
          </button>
        </div>
      `).join('');

      listEl.querySelectorAll('.as-del-btn').forEach(btn => {
        btn.onclick = () => {
          const name = btn.getAttribute('data-name');
          if (!confirm('Hapus "' + name + '" dari daftar ' + tabLabel + '?')) return;
          const newList = window.ASSESSORS.getList(activeTab).filter(n => n !== name);
          if (newList.length === 0) {
            alert('Minimal 1 harus ada.');
            return;
          }
          window.ASSESSORS.save(activeTab, newList).then(() => {
            toast('🗑 Dihapus: ' + name, '#dc2626');
            renderList();
          }).catch(e => alert('Gagal: ' + e.message));
        };
      });
    }

    function addAssessor() {
      const input = document.getElementById('asNewInput');
      const raw = (input.value || '').trim().toUpperCase();

      if (!raw) {
        toast('Isi nama dulu', '#dc2626');
        return;
      }

      if (!/^[A-Z0-9 ]+$/.test(raw)) {
        toast('Hanya huruf, angka, spasi', '#dc2626');
        return;
      }

      const list = window.ASSESSORS.getList(activeTab);
      if (list.indexOf(raw) !== -1) {
        toast('Sudah ada: ' + raw, '#f59e0b');
        return;
      }

      const newList = list.concat([raw]);
      window.ASSESSORS.save(activeTab, newList).then(() => {
        toast('✅ Ditambahkan: ' + raw);
        input.value = '';
        renderList();
      }).catch(e => alert('Gagal: ' + e.message));
    }
  };

  console.log('[ADMIN-ASSESSORS] ✓ Loaded (2 kategori)');
})();