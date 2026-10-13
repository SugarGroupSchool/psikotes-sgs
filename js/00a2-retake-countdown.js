/* ============================================================
   js/00a2-retake-countdown.js
   - Overlay countdown full-screen untuk retake terjadwal
   - Auto-unlock saat waktunya tiba
   ============================================================ */
(function () {
  'use strict';

  window.__showRetakeCountdown = function (startAtSec, onUnlock) {
    const old = document.getElementById('retakeCountdownOverlay');
    if (old) old.remove();

    const targetMs = startAtSec * 1000;
    const targetDate = new Date(targetMs);
    const fmtDate = targetDate.toLocaleDateString('id-ID', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
    const fmtTime = targetDate.toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit'
    });

    const overlay = document.createElement('div');
    overlay.id = 'retakeCountdownOverlay';
    overlay.style.cssText = [
      'position: fixed', 'inset: 0', 'z-index: 2147483646',
      'background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
      'display: flex', 'align-items: center', 'justify-content: center',
      'padding: 20px', 'font-family: Inter, system-ui, sans-serif'
    ].join(';');

    overlay.innerHTML = `
      <div style="width: min(560px, 100%); text-align: center; color: #fff;">
        <div style="font-size: 64px; line-height: 1; margin-bottom: 16px;
          animation: __pulseCD 2s ease-in-out infinite;">⏳</div>
        <div style="font-size: 12px; font-weight: 900; letter-spacing: 4px;
          opacity: .7; margin-bottom: 8px;">TES BELUM DIBUKA</div>
        <div style="font-size: 22px; font-weight: 900; letter-spacing: -.3px;
          margin-bottom: 8px;">Tes Tahap Anda Terjadwal</div>
        <div style="font-size: 14px; opacity: .8; margin-bottom: 28px;
          line-height: 1.6;">
          Dibuka: <b style="color:#fbbf24;">${fmtDate}</b><br>
          Pukul <b style="color:#fbbf24;">${fmtTime} WIB</b>
        </div>

        <div style="display: flex; gap: 10px; justify-content: center;
          flex-wrap: wrap; margin-bottom: 28px;">
          ${['Hari', 'Jam', 'Menit', 'Detik'].map((label, i) => `
            <div style="min-width: 80px; padding: 14px 10px;
              background: rgba(255,255,255,.1);
              border: 1px solid rgba(255,255,255,.2);
              border-radius: 14px; backdrop-filter: blur(8px);">
              <div id="cdVal${i}" style="font-size: 32px; font-weight: 900;
                font-variant-numeric: tabular-nums; letter-spacing: -1px;">
                ${i === 0 ? '0' : '00'}
              </div>
              <div style="font-size: 10px; font-weight: 800;
                letter-spacing: 2px; opacity: .7; margin-top: 4px;">
                ${label.toUpperCase()}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="font-size: 12.5px; opacity: .7; line-height: 1.6;
          padding: 14px 18px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 12px; margin-bottom: 20px;">
          Anda bisa menutup halaman ini. <b>Buka kembali link di email</b>
          saat jadwalnya tiba.<br>
          Halaman ini akan <b>otomatis masuk</b> ke tes saat waktunya tiba.
        </div>

        <button id="cdRefreshBtn" style="
          padding: 12px 24px; border-radius: 12px;
          background: rgba(255,255,255,.15);
          border: 1px solid rgba(255,255,255,.3);
          color: #fff; font-family: inherit; font-size: 13px;
          font-weight: 800; cursor: pointer;">
          🔄 Cek Ulang
        </button>
      </div>

      <style>
        @keyframes __pulseCD {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: .85; }
        }
      </style>
    `;

    document.body.appendChild(overlay);

    let unlocked = false;
    function __unlock() {
      if (unlocked) return;
      unlocked = true;
      overlay.remove();
      clearInterval(timer);
      if (typeof onUnlock === 'function') onUnlock();
    }

    function __tick() {
      const now = Date.now();
      const diff = targetMs - now;
      if (diff <= 0) { __unlock(); return; }

      const days  = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins  = Math.floor((diff % 3600000) / 60000);
      const secs  = Math.floor((diff % 60000) / 1000);
      const pad = n => String(n).padStart(2, '0');

      const els = [
        document.getElementById('cdVal0'),
        document.getElementById('cdVal1'),
        document.getElementById('cdVal2'),
        document.getElementById('cdVal3')
      ];
      if (els[0]) els[0].textContent = days;
      if (els[1]) els[1].textContent = pad(hours);
      if (els[2]) els[2].textContent = pad(mins);
      if (els[3]) els[3].textContent = pad(secs);
    }

    __tick();
    const timer = setInterval(__tick, 1000);

    const refBtn = document.getElementById('cdRefreshBtn');
    if (refBtn) {
      refBtn.onclick = () => {
        const now = Date.now();
        if (now >= targetMs) {
          __unlock();
        } else {
          refBtn.textContent = '⏳ Belum waktunya';
          setTimeout(() => { refBtn.textContent = '🔄 Cek Ulang'; }, 1500);
        }
      };
    }
  };

  console.log('[RETAKE-COUNTDOWN] ✓ Loaded');
})();