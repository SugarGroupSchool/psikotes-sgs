/* =========================================================
   CUSTOM MODAL — pengganti alert() / confirm() / prompt()
   ---------------------------------------------------------
   🔒 P1-5 FIX: Hilangkan ketergantungan pada alert/confirm native
   - Promise-based
   - Mobile-friendly
   - Konsisten dengan tema aplikasi
   - Tidak bisa di-dismiss otomatis oleh browser

   USAGE:
     await sgsAlert('Pesan Anda');
     const ok = await sgsConfirm('Yakin?');
     const val = await sgsPrompt('Nama Anda:', 'default');
   ========================================================= */

(function() {
  'use strict';

  const MODAL_STYLE_ID = 'sgsModalStyles';
  const MODAL_OVERLAY_ID = 'sgsModalOverlay';

  function injectStyles() {
    if (document.getElementById(MODAL_STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = MODAL_STYLE_ID;
    st.textContent = `
      @keyframes sgsModalIn {
        from { opacity: 0; transform: translateY(20px) scale(.96); }
        to   { opacity: 1; transform: translateY(0)   scale(1); }
      }
      @keyframes sgsModalFade {
        from { opacity: 0; } to { opacity: 1; }
      }
      .sgs-modal-overlay {
        position: fixed; inset: 0; z-index: 2147483647;
        display: flex; align-items: center; justify-content: center;
        padding: 20px; overflow-y: auto;
        background: rgba(10,20,35,.72);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        animation: sgsModalFade .18s ease;
        font-family: Inter, system-ui, -apple-system, sans-serif;
      }
      .sgs-modal-card {
        width: min(480px, 100%);
        background: #fff;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 30px 90px rgba(0,0,0,.45);
        animation: sgsModalIn .28s cubic-bezier(.2,.8,.2,1);
      }
      .sgs-modal-body { padding: 26px 26px 22px; }
      .sgs-modal-title { margin: 0 0 10px; font-size: 17px; font-weight: 850; color: #1e293b; }
      .sgs-modal-text  { margin: 0; color: #475569; font-size: 14.5px; line-height: 1.65; white-space: pre-line; }
      .sgs-modal-input {
        width: 100%; margin-top: 14px; padding: 12px 14px;
        border: 2px solid #e2e8f0; border-radius: 10px;
        font-family: inherit; font-size: 14.5px; outline: none;
        box-sizing: border-box;
      }
      .sgs-modal-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,.12); }
      .sgs-modal-actions {
        display: flex; gap: 10px; padding: 0 26px 22px;
        justify-content: flex-end; flex-wrap: wrap;
      }
      .sgs-modal-btn {
        padding: 12px 22px; border-radius: 10px; border: 0;
        font-family: inherit; font-size: 14px; font-weight: 800;
        cursor: pointer; transition: transform .15s, filter .15s, box-shadow .15s;
        min-width: 100px;
      }
      .sgs-modal-btn:hover { transform: translateY(-1px); filter: brightness(1.05); }
      .sgs-modal-btn:active { transform: translateY(0); }
      .sgs-modal-btn-primary   { background: linear-gradient(135deg,#3b82f6,#1e40af); color: #fff; box-shadow: 0 6px 16px rgba(59,130,246,.3); }
      .sgs-modal-btn-danger    { background: linear-gradient(135deg,#dc2626,#991b1b); color: #fff; box-shadow: 0 6px 16px rgba(220,38,38,.3); }
      .sgs-modal-btn-success   { background: linear-gradient(135deg,#16a34a,#059669); color: #fff; box-shadow: 0 6px 16px rgba(22,163,74,.3); }
      .sgs-modal-btn-secondary { background: #f1f5f9; color: #475569; }
    `;
    document.head.appendChild(st);
  }

  function buildOverlay() {
    const existing = document.getElementById(MODAL_OVERLAY_ID);
    if (existing) existing.remove();
    const ov = document.createElement('div');
    ov.id = MODAL_OVERLAY_ID;
    ov.className = 'sgs-modal-overlay';
    document.body.appendChild(ov);
    return ov;
  }

  function closeOverlay() {
    const ov = document.getElementById(MODAL_OVERLAY_ID);
    if (ov) ov.remove();
  }

  /**
   * Core modal builder
   * @param {Object} opts
   *  - title: string
   *  - text: string
   *  - type: 'alert' | 'confirm' | 'prompt'
   *  - defaultValue: string (untuk prompt)
   *  - okText, cancelText
   *  - okStyle: 'primary' | 'danger' | 'success'
   *  - inputType: 'text' | 'password' | 'number'
   * @returns {Promise<string|boolean|null>}
   */
  function showModal(opts = {}) {
    injectStyles();
    return new Promise((resolve) => {
      const ov = buildOverlay();
      const {
        title = 'Konfirmasi',
        text = '',
        type = 'alert',
        defaultValue = '',
        okText = (type === 'confirm' ? 'Ya, Lanjutkan' : 'OK'),
        cancelText = 'Batal',
        okStyle = 'primary',
        inputType = 'text'
      } = opts;

      const inputHTML = (type === 'prompt')
        ? `<input type="${inputType}" class="sgs-modal-input" id="sgsModalInput" value="${String(defaultValue).replace(/"/g,'&quot;')}" autocomplete="off">`
        : '';

      const cancelBtnHTML = (type !== 'alert')
        ? `<button class="sgs-modal-btn sgs-modal-btn-secondary" data-act="cancel">${cancelText}</button>`
        : '';

      const okCls = 'sgs-modal-btn sgs-modal-btn-' + (okStyle === 'danger' ? 'danger' : (okStyle === 'success' ? 'success' : 'primary'));

      ov.innerHTML = `
        <div class="sgs-modal-card" role="dialog" aria-modal="true">
          <div class="sgs-modal-body">
            <h3 class="sgs-modal-title">${String(title).replace(/</g,'&lt;')}</h3>
            <p class="sgs-modal-text">${String(text).replace(/</g,'&lt;')}</p>
            ${inputHTML}
          </div>
          <div class="sgs-modal-actions">
            ${cancelBtnHTML}
            <button class="${okCls}" data-act="ok">${okText}</button>
          </div>
        </div>
      `;

      const inputEl = ov.querySelector('#sgsModalInput');
      if (inputEl) setTimeout(() => { inputEl.focus(); inputEl.select(); }, 80);

      /* =========================================================
         FINISH — dipanggil saat modal ditutup (OK / Cancel / Esc / Overlay)
         Memastikan listener keyHandler SELALU dihapus
         ========================================================= */
      let __finished = false;
      function finish(value) {
        if (__finished) return;
        __finished = true;
        document.removeEventListener('keydown', keyHandler);
        closeOverlay();
        resolve(value);
      }

      /* =========================================================
         KEY HANDLER — Enter = OK, Escape = Cancel
         Dideklarasikan SEKALI saja
         ========================================================= */
      function keyHandler(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (type === 'prompt') finish(inputEl ? inputEl.value : null);
          else finish(true);
        } else if (e.key === 'Escape' && type !== 'alert') {
          if (type === 'prompt') finish(null);
          else finish(false);
        }
      }
      document.addEventListener('keydown', keyHandler);

      /* ---------- OK BUTTON ---------- */
      ov.querySelector('[data-act="ok"]').onclick = () => {
        if (type === 'prompt') finish(inputEl ? inputEl.value : null);
        else finish(true);
      };

      /* ---------- CANCEL BUTTON ---------- */
      const cancelBtn = ov.querySelector('[data-act="cancel"]');
      if (cancelBtn) cancelBtn.onclick = () => {
        if (type === 'prompt') finish(null);
        else finish(false);
      };

      /* ---------- OVERLAY CLICK → CANCEL (kecuali alert) ---------- */
      ov.addEventListener('click', (e) => {
        if (e.target === ov && type !== 'alert') {
          if (type === 'prompt') finish(null);
          else finish(false);
        }
      });
    });
  }

  /* ============================================================
     PUBLIC API — drop-in replacement
     ============================================================ */

  window.sgsAlert = (text, title = 'Informasi') =>
    showModal({ type: 'alert', title, text, okText: 'OK' });

  window.sgsConfirm = (text, opts = {}) =>
    showModal({
      type: 'confirm',
      title: opts.title || 'Konfirmasi',
      text,
      okText: opts.okText || 'Ya, Lanjutkan',
      cancelText: opts.cancelText || 'Batal',
      okStyle: opts.okStyle || 'primary'
    });

  window.sgsConfirmDanger = (text, opts = {}) =>
    showModal({
      type: 'confirm',
      title: opts.title || '⚠️ Konfirmasi',
      text,
      okText: opts.okText || 'Ya, Hapus',
      cancelText: opts.cancelText || 'Batal',
      okStyle: 'danger'
    });

  window.sgsPrompt = (text, defaultValue = '', opts = {}) =>
    showModal({
      type: 'prompt',
      title: opts.title || 'Input',
      text,
      defaultValue,
      okText: opts.okText || 'Simpan',
      cancelText: opts.cancelText || 'Batal',
      inputType: opts.inputType || 'text'
    });

  /* ============================================================
     TOAST — notifikasi kecil di kanan bawah
     Dipanggil oleh: 00m-interview.js, 00t-admin-candidate-panel.js
     ============================================================ */
  window.__showToast = function(msg, type) {
    type = type || 'info';
    const colors = {
      success: '#16a34a',
      error:   '#dc2626',
      warn:    '#f59e0b',
      info:    '#3b82f6'
    };
    const color = colors[type] || colors.info;

    let container = document.getElementById('sgsToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'sgsToastContainer';
      container.style.cssText =
        'position:fixed;bottom:24px;right:24px;z-index:2147483647;' +
        'display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(container);
    }

    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText =
      'padding:12px 18px;border-radius:10px;' +
      'background:' + color + ';color:#fff;font-weight:800;font-size:13px;' +
      'font-family:Inter,system-ui,sans-serif;' +
      'box-shadow:0 10px 26px ' + color + '55;' +
      'pointer-events:auto;' +
      'opacity:0;transform:translateX(20px);' +
      'transition:opacity .22s ease,transform .22s ease;';
    container.appendChild(t);

    requestAnimationFrame(() => {
      t.style.opacity = '1';
      t.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(20px)';
      setTimeout(() => t.remove(), 250);
    }, 2500);
  };

  console.log('[MODAL] ✓ Loaded — sgsAlert(), sgsConfirm(), sgsConfirmDanger(), sgsPrompt(), __showToast()');
})();