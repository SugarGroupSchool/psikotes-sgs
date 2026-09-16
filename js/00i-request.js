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
      return localStorage.getItem('_sgs_device_id') || 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  /* ============================================================
     TAMPILKAN LAYAR REQUEST
     ============================================================ */
  function showRequestAccessScreen() {
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
            margin: 0;
            color: #475569;
            font-size: 14.5px;
            line-height: 1.65;
          ">
            Admin sudah menyetujui permintaan Anda.<br>
            Halaman akan dimuat ulang otomatis...
          </p>
        </div>
      </div>
    `;

    setTimeout(() => {
      try { window.location.reload(); } catch (e) {}
    }, 2000);
  }

  /* ============================================================
     RENDER: REJECTED
     ============================================================ */
  function __renderRejectedScreen(req) {
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
