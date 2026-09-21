/* ============================================================
   js/00i-request.js
   - Kandidat device-finished bisa minta izin akses
   - Request masuk ke panel admin
   - Admin approve → device reset + pakai FRESH password
   ============================================================ */

(function() {
  'use strict';

  let __requestDeviceId = null;
  let __requestListenerRef = null;
  let __requestListenerCb = null;

  function __getDeviceId() {
    try {
      let id = localStorage.getItem('_sgs_device_id');
      if (!id) {
        // Generate baru kalau belum ada
        id = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        try { localStorage.setItem('_sgs_device_id', id); } catch (e) {}
      }
      return id;
    } catch (e) {
      // Fallback kalau localStorage bermasalah
      return 'dev_anon_' + Math.random().toString(36).slice(2, 10);
    }
  }

  /* ============================================================
     TAMPILKAN LAYAR REQUEST
     ============================================================ */
let __requestScreenRendered = false;

function showRequestAccessScreen() {
  // ✅ FIX: izinkan re-render setelah disqualification ulang
  if (window.__sgs_requestScreenRendered === false) {
    __requestScreenRendered = false;
    window.__sgs_requestScreenRendered = undefined;
  }

  if (__requestScreenRendered) return;
  __requestScreenRendered = true;
  __requestDeviceId = __getDeviceId();

    const pwdScreen = document.getElementById('passwordScreen');
    if (pwdScreen) pwdScreen.style.display = 'none';

    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      firebase.database().ref('sgs_requests/' + __requestDeviceId).once('value')
        .then(snap => {
          const req = snap.val();
          if (req && req.status === 'pending') {
            __renderPendingScreen(req);
            __listenRequestStatus();
          } else if (req && req.status === 'approved') {
            __renderApprovedScreen();
          } else {
            __renderInitialScreen();
          }
        })
        .catch(() => __renderInitialScreen());
    } else {
      __renderInitialScreen();
    }
  }

  /* ============================================================
     RENDER: LAYAR AWAL
     ============================================================ */
  function __renderInitialScreen() {
    document.body.innerHTML = `
      <div style="
        position: fixed; inset: 0; z-index: 2147483647;
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
        font-family: Inter, system-ui, -apple-system, sans-serif;
        overflow-y: auto;
      ">
        <div style="
          max-width: 480px; width: 100%;
          padding: 40px 32px 34px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 30px 90px rgba(0,0,0,.5);
          text-align: center;
        ">
          <div style="
            width: 80px; height: 80px;
            margin: 0 auto 22px;
            display: grid; place-items: center;
            background: linear-gradient(135deg, #dbeafe, #eff6ff);
            border: 3px solid #bfdbfe;
            border-radius: 24px;
            font-size: 40px;
          ">🔒</div>

          <h1 style="
            margin: 0 0 12px;
            font-size: 24px;
            font-weight: 900;
            color: #1e3a8a;
            letter-spacing: -0.3px;
          ">Perangkat Sudah Menyelesaikan Tes</h1>

          <p style="
            margin: 0 0 22px;
            color: #475569;
            font-size: 14.5px;
            line-height: 1.65;
          ">
            Perangkat ini sudah digunakan untuk menyelesaikan tes.<br><br>
            Jika Anda ingin mengerjakan tes <b>lagi</b>, silakan kirim permintaan izin ke admin.
          </p>

          <div style="
            padding: 14px 16px;
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 12px;
            font-size: 12.5px;
            color: #78350f;
            line-height: 1.6;
            text-align: left;
            margin-bottom: 22px;
          ">
            <b>ℹ️ Info</b><br>
            • Permintaan akan diteruskan ke admin<br>
            • Admin akan meninjau dan memberi keputusan<br>
            • Anda akan dihubungi kembali jika disetujui
          </div>

          <button id="btnRequestAccess" style="
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            color: #fff; border: 0; border-radius: 14px;
            font-size: 15px; font-weight: 800;
            cursor: pointer; font-family: inherit;
            box-shadow: 0 10px 24px rgba(30,58,138,.28);
            transition: transform .18s, box-shadow .18s;
          ">📨 Minta Izin Akses</button>

          <div id="requestError" style="
            color: #dc2626; font-size: 13px;
            min-height: 18px; margin-top: 12px;
            text-align: center; font-weight: 600;
          "></div>

          <div style="
            margin-top: 22px;
            font-size: 11px;
            color: #94a3b8;
          ">ID Device: ${__requestDeviceId.slice(-8)}</div>
        </div>
      </div>
    `;

    const btn = document.getElementById('btnRequestAccess');
    if (btn) btn.onclick = __sendRequest;
  }

  /* ============================================================
     KIRIM REQUEST
     ============================================================ */
  async function __sendRequest() {
    const btn = document.getElementById('btnRequestAccess');
    const errEl = document.getElementById('requestError');

    if (!btn || btn.disabled) return;

    btn.disabled = true;
    btn.textContent = 'Mengirim...';
    if (errEl) errEl.textContent = '';

    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
      btn.disabled = false;
      btn.textContent = '📨 Minta Izin Akses';
      if (errEl) errEl.textContent = '⚠️ Koneksi bermasalah. Coba lagi.';
      return;
    }

    try {
      let name = 'Kandidat', position = '';
      try {
        const sessionSnap = await firebase.database()
          .ref('sgs_state/sessions/' + __requestDeviceId)
          .once('value');
        const session = sessionSnap.val() || {};
        name = session.name || name;
        position = session.position || position;
      } catch (e) {}

      await firebase.database().ref('sgs_requests/' + __requestDeviceId).set({
        deviceId: __requestDeviceId,
        name: name,
        position: position,
        status: 'pending',
        requestedAt: firebase.database.ServerValue.TIMESTAMP,
        userAgent: navigator.userAgent.slice(0, 200)
      });

      __renderPendingScreen({
        name: name,
        position: position,
        requestedAt: Date.now()
      });

      __listenRequestStatus();

    } catch (err) {
      console.error('[REQUEST] Gagal kirim:', err);
      btn.disabled = false;
      btn.textContent = '📨 Minta Izin Akses';
      if (errEl) errEl.textContent = '❌ Gagal kirim: ' + (err.message || 'Coba lagi');
    }
  }

  /* ============================================================
     RENDER: PENDING
     ============================================================ */
  function __renderPendingScreen(req) {
    const reqTime = req.requestedAt ? new Date(req.requestedAt).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }) : '-';

    document.body.innerHTML = `
      <div style="
        position: fixed; inset: 0; z-index: 2147483647;
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
        background: linear-gradient(135deg, #92400e 0%, #f59e0b 100%);
        font-family: Inter, system-ui, -apple-system, sans-serif;
        overflow-y: auto;
      ">
        <div style="
          max-width: 480px; width: 100%;
          padding: 40px 32px 34px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 30px 90px rgba(0,0,0,.5);
          text-align: center;
        ">
          <div style="
            width: 80px; height: 80px;
            margin: 0 auto 22px;
            display: grid; place-items: center;
            background: linear-gradient(135deg, #fef3c7, #fef9c3);
            border: 3px solid #fde68a;
            border-radius: 24px;
            font-size: 40px;
          ">⏳</div>

          <h1 style="
            margin: 0 0 12px;
            font-size: 22px;
            font-weight: 900;
            color: #92400e;
            letter-spacing: -0.3px;
          ">Menunggu Persetujuan Admin</h1>

          <p style="
            margin: 0 0 20px;
            color: #475569;
            font-size: 14.5px;
            line-height: 1.65;
          ">
            Permintaan izin Anda sudah terkirim.<br>
            Mohon tunggu admin meninjau permintaan ini.<br><br>
            <b>Halaman akan otomatis dimuat ulang setelah disetujui.</b>
          </p>

          <div style="
            padding: 14px 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            font-size: 12.5px;
            color: #475569;
            line-height: 1.7;
            text-align: left;
          ">
            <div><b>Nama:</b> ${req.name || 'Kandidat'}</div>
            ${req.position ? `<div><b>Posisi:</b> ${req.position}</div>` : ''}
            <div><b>Waktu:</b> ${reqTime}</div>
          </div>

          <div style="
            margin-top: 22px;
            display: flex; align-items: center;
            justify-content: center; gap: 10px;
            color: #94a3b8; font-size: 12.5px;
          ">
            <span style="
              width: 10px; height: 10px; border-radius: 50%;
              background: #f59e0b;
              box-shadow: 0 0 0 5px rgba(245,158,11,.2);
              animation: __waitPulse 1.4s ease-in-out infinite;
            "></span>
            Menunggu...
          </div>

          <style>
            @keyframes __waitPulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50%      { transform: scale(1.35); opacity: .7; }
            }
          </style>
        </div>
      </div>
    `;
  }

  /* ============================================================
     RENDER: APPROVED
     ============================================================ */
function __renderApprovedScreen() {
  // ⛔ STOP listener biar tidak kelap-kelip
  if (__requestListenerRef && __requestListenerCb) {
    try { __requestListenerRef.off('value', __requestListenerCb); } catch (e) {}
    __requestListenerRef = null;
    __requestListenerCb = null;
  }

  // 🧹 RESET device state (supaya bisa login ulang dengan FRESH)
  try {
    localStorage.removeItem('_sgs_finished');
    localStorage.removeItem('_sgs_disqualified');
    localStorage.removeItem('usedPragas');
    localStorage.removeItem('identity');
    localStorage.removeItem('completed');
    localStorage.removeItem('selectedTests');
    sessionStorage.removeItem('_sgs_retake_processed');
    sessionStorage.removeItem('dlClick');
  } catch (e) {}

  // 🗑️ Hapus request dari Firebase (biar bersih)
  try {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      firebase.database().ref('sgs_requests/' + __requestDeviceId).remove();
    }
  } catch (e) {}

  // 🖥️ Tampilkan layar
  document.body.innerHTML = `
    <div style="
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      background: linear-gradient(135deg, #065f46 0%, #16a34a 100%);
      font-family: Inter, system-ui, -apple-system, sans-serif;
    ">
      <div style="
        max-width: 440px; width: 100%;
        padding: 40px 32px 34px;
        background: #ffffff;
        border-radius: 24px;
        box-shadow: 0 30px 90px rgba(0,0,0,.5);
        text-align: center;
      ">
        <div style="
          width: 80px; height: 80px;
          margin: 0 auto 22px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #d1fae5, #ecfdf5);
          border: 3px solid #86efac;
          border-radius: 24px;
          font-size: 40px;
        ">✅</div>

        <h1 style="
          margin: 0 0 12px;
          font-size: 22px;
          font-weight: 900;
          color: #065f46;
        ">Disetujui!</h1>

        <p style="
          margin: 0 0 16px;
          color: #475569;
          font-size: 14.5px;
          line-height: 1.65;
        ">
          Admin sudah menyetujui permintaan Anda.<br>
          Silakan login dengan <b>password FRESH</b> yang diberikan admin.
        </p>

        <div style="
          padding: 12px 14px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 12px;
          font-size: 12.5px;
          color: #78350f;
          line-height: 1.6;
          text-align: left;
          margin-bottom: 20px;
        ">
          <b>⚠️ Penting</b><br>
          Password FRESH akan diberikan oleh admin.<br>
          Login dengan password USED akan <b>gagal</b>.
        </div>

        <div style="
          font-size: 13px;
          color: #94a3b8;
        ">
          Memuat ulang halaman...
        </div>

        <div style="
          width: 100%; height: 4px;
          background: #e2e8f0; border-radius: 999px;
          margin-top: 12px; overflow: hidden;
        ">
          <div id="__approvedProgress" style="
            width: 0%; height: 100%;
            background: linear-gradient(90deg, #22c55e, #16a34a);
            border-radius: inherit;
            transition: width 2s linear;
          "></div>
        </div>
      </div>
    </div>
  `;

  // Animasi progress bar
  setTimeout(() => {
    const bar = document.getElementById('__approvedProgress');
    if (bar) bar.style.width = '100%';
  }, 100);

  // Reload setelah 2 detik (sekali saja)
  setTimeout(() => {
    try { window.location.reload(); } catch (e) {
      window.location.href = window.location.href;
    }
  }, 2000);
}
  /* ============================================================
     RENDER: REJECTED
     ============================================================ */
function __renderRejectedScreen(req) {
  // ⛔ STOP listener
  if (__requestListenerRef && __requestListenerCb) {
    try { __requestListenerRef.off('value', __requestListenerCb); } catch (e) {}
    __requestListenerRef = null;
    __requestListenerCb = null;
  }

  document.body.innerHTML = `
    <div style="
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%);
      font-family: Inter, system-ui, -apple-system, sans-serif;
    ">
      <div style="
        max-width: 440px; width: 100%;
        padding: 40px 32px 34px;
        background: #ffffff;
        border-radius: 24px;
        box-shadow: 0 30px 90px rgba(0,0,0,.5);
        text-align: center;
      ">
        <div style="
          width: 80px; height: 80px;
          margin: 0 auto 22px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #fee2e2, #fef2f2);
          border: 3px solid #fca5a5;
          border-radius: 24px;
          font-size: 40px;
        ">❌</div>

        <h1 style="
          margin: 0 0 12px;
          font-size: 22px;
          font-weight: 900;
          color: #991b1b;
        ">Permintaan Ditolak</h1>

        <p style="
          margin: 0 0 22px;
          color: #475569;
          font-size: 14.5px;
          line-height: 1.65;
        ">
          Admin belum menyetujui permintaan Anda.<br>
          Silakan hubungi admin untuk informasi lebih lanjut.
        </p>

        <button id="btnTryAgain" style="
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          color: #fff; border: 0; border-radius: 12px;
          font-size: 14px; font-weight: 800;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 8px 20px rgba(220,38,38,.28);
        ">🔄 Kirim Ulang Permintaan</button>
      </div>
    </div>
  `;

  const btn = document.getElementById('btnTryAgain');
  if (btn) {
    btn.onclick = async () => {
      btn.disabled = true;
      btn.textContent = 'Menghapus permintaan lama...';
      try {
        await firebase.database().ref('sgs_requests/' + __requestDeviceId).remove();
      } catch (e) {}
      __renderInitialScreen();
    };
  }
}

  /* ============================================================
     LISTEN STATUS REQUEST
     ============================================================ */
  function __listenRequestStatus() {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) return;
    if (!__requestDeviceId) return;

    if (__requestListenerRef && __requestListenerCb) {
      try { __requestListenerRef.off('value', __requestListenerCb); } catch (e) {}
    }

    __requestListenerRef = firebase.database().ref('sgs_requests/' + __requestDeviceId);
    __requestListenerCb = (snap) => {
      const req = snap.val();
      if (!req) return;

      if (req.status === 'approved') {
        __renderApprovedScreen();
      } else if (req.status === 'rejected') {
        __renderRejectedScreen(req);
      }
    };

    __requestListenerRef.on('value', __requestListenerCb);
  }

  /* ============================================================
     EXPORT
     ============================================================ */
  window.showRequestAccessScreen = showRequestAccessScreen;
  window.__listenRequestStatus = __listenRequestStatus;

  console.log('[REQUEST] ✓ Loaded');
})();
