/* ============================================================
   js/00a3-copy-helper.js
   - Halaman bantu copy password ke clipboard
   - URL: ?copypw=PASSWORD&next=URL_RETAKE
   - Auto copy → tampil tombol lanjut
   ============================================================ */
(function () {
  'use strict';

  try {
    const url = new URL(window.location.href);
    const pw = url.searchParams.get('copypw');
    const next = url.searchParams.get('next');

    if (!pw) return;

    const overlay = document.createElement('div');
    overlay.id = 'copyHelperOverlay';
    overlay.style.cssText = [
      'position: fixed', 'inset: 0', 'z-index: 2147483647',
      'background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
      'display: flex', 'align-items: center', 'justify-content: center',
      'padding: 20px', 'font-family: Inter, system-ui, sans-serif',
      'overflow-y: auto'
    ].join(';');

    overlay.innerHTML = `
      <div style="max-width: 500px; width: 100%; text-align: center; color: #fff;">
        <div style="font-size: 64px; line-height: 1; margin-bottom: 16px;">🔑</div>
        <div style="font-size: 12px; font-weight: 900; letter-spacing: 3px; opacity: .75; margin-bottom: 10px;">
          PASSWORD AKSES TES
        </div>
        <div style="font-size: 20px; font-weight: 900; margin-bottom: 20px;">
          Kode Anda sudah siap
        </div>

        <div style="background: rgba(255,255,255,.08); border: 2px solid rgba(255,255,255,.22); border-radius: 18px; padding: 20px; margin: 20px 0;">
          <div id="pwDisplay" style="font-family: 'Courier New', monospace; font-size: 22px; font-weight: 900; letter-spacing: 2px; padding: 16px; background: rgba(0,0,0,.4); border-radius: 12px; margin-bottom: 14px; word-break: break-all; user-select: text;">
            ${pw}
          </div>
          <button id="pwCopyBtn" style="width: 100%; padding: 14px; border-radius: 12px; background: linear-gradient(135deg,#3b82f6,#1e40af); border: 0; color: #fff; font-family: inherit; font-size: 14px; font-weight: 900; cursor: pointer; transition: all .2s;">
            📋 Salin Password
          </button>
        </div>

        <div id="pwStatus" style="font-size: 13px; opacity: .85; margin-bottom: 22px; min-height: 22px; line-height: 1.5;"></div>

        ${next ? `
          <button id="pwNextBtn" style="padding: 15px 32px; border-radius: 14px; background: linear-gradient(135deg,#16a34a,#059669); border: 0; color: #fff; font-family: inherit; font-size: 15px; font-weight: 900; cursor: pointer; box-shadow: 0 8px 24px rgba(5,150,105,.35);">
            🚀 Lanjut ke Tes
          </button>
          <div style="font-size: 11px; opacity: .6; margin-top: 10px;">
            Akan masuk otomatis dalam beberapa detik
          </div>
        ` : ''}
      </div>
    `;

    document.body.appendChild(overlay);

    let copied = false;

    function doCopy(silent) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pw).then(() => {
          copied = true;
          const st = document.getElementById('pwStatus');
          const btn = document.getElementById('pwCopyBtn');
          if (st) st.innerHTML = '✅ <b>Password tersalin ke clipboard!</b>';
          if (btn) {
            btn.textContent = '✅ Tersalin!';
            btn.style.background = 'linear-gradient(135deg,#16a34a,#059669)';
          }
        }).catch(() => {
          if (!silent) {
            const st = document.getElementById('pwStatus');
            if (st) st.textContent = '⚠️ Browser blokir auto-copy. Tekan lama password untuk salin manual.';
          }
        });
      } else {
        if (!silent) {
          const st = document.getElementById('pwStatus');
          if (st) st.textContent = '⚠️ Browser tidak support auto-copy. Tekan lama password untuk salin manual.';
        }
      }
    }

    document.getElementById('pwCopyBtn').onclick = () => doCopy(false);

    setTimeout(() => doCopy(true), 400);

    const nextBtn = document.getElementById('pwNextBtn');
    if (nextBtn && next) {
      const nextUrl = decodeURIComponent(next);
      let countdown = 3;
      const origText = '🚀 Lanjut ke Tes';

      nextBtn.onclick = () => {
        window.location.href = nextUrl;
      };

      const timer = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(timer);
          window.location.href = nextUrl;
        } else {
          nextBtn.textContent = origText + ' (' + countdown + ')';
        }
      }, 1000);
    }

    console.log('[COPY-HELPER] ✓ Loaded');
  } catch (e) {
    console.warn('[COPY-HELPER] Error:', e.message);
  }
})();