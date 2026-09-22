/* ============================================================
   js/00l-security.js
   - Server-side gate: cek finished/disqualified di Firebase
   - Menggantikan cek localStorage yang bisa dimanipulasi
   - Juga: security event logging ke /sgs_errors
   ------------------------------------------------------------
   🔒 P1-4 FIX [2026-09-22]
   ============================================================ */

(function() {
  'use strict';

  /* ============================================================
     CEK SERVER-SIDE STATUS DEVICE
     ============================================================ */
  async function checkDeviceStatusServer(deviceId) {
    if (!deviceId) return { status: 'unknown' };
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      return { status: 'unknown', reason: 'firebase_not_ready' };
    }
    try {
      const snap = await firebase.database()
        .ref('sgs_state/sessions/' + deviceId)
        .once('value');
      const data = snap.val() || {};
      return {
        status: 'ok',
        finished: data.finished === true,
        disqualified: data.disqualified === true,
        status_str: data.status || 'active',
        lastSeen: data.lastSeen || 0
      };
    } catch (e) {
      console.warn('[SECURITY] Gagal cek status server:', e.message);
      return { status: 'error', reason: e.message };
    }
  }

  /* ============================================================
     CEK LOCK SERVER-SIDE
     ============================================================ */
  async function checkLockServer() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      return { status: 'unknown', locked: true };   // fail-closed
    }
    try {
      const snap = await firebase.database().ref('sgs_state/lock').once('value');
      return { status: 'ok', locked: snap.val() === true };
    } catch (e) {
      return { status: 'error', locked: true, reason: e.message };
    }
  }

  /* ============================================================
     SYNC localStorage → Firebase state
     (kandidat dengan flags lokal palsu akan ditolak)
     ============================================================ */
  async function syncFinishedStateToServer(deviceId) {
    if (!deviceId) return;
    const localFinished = localStorage.getItem('_sgs_finished') === '1';
    if (!localFinished) return;
    try {
      await firebase.database()
        .ref('sgs_state/sessions/' + deviceId)
        .update({ finished: true, finishedAt: firebase.database.ServerValue.TIMESTAMP });
    } catch (e) {}
  }

  /* ============================================================
     LOG ERROR — sentralisasi error tracking
     ============================================================ */
  function logErrorToServer(err, ctx) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;
    const user = firebase.auth().currentUser;
    if (!user) return;
    try {
      const ref = firebase.database().ref('sgs_errors').push();
      ref.set({
        ts: firebase.database.ServerValue.TIMESTAMP,
        uid: user.uid,
        anon: user.isAnonymous === true,
        message: String(err && err.message ? err.message : err).slice(0, 500),
        stack: String(err && err.stack ? err.stack : '').slice(0, 1000),
        ctx: String(ctx || '').slice(0, 200),
        url: location.href.slice(0, 300),
        ua: navigator.userAgent.slice(0, 200)
      }).catch(() => {});
    } catch (e) {}
  }

  /* ============================================================
     AUTO-CAPTURE window.onerror + unhandledrejection
     ============================================================ */
  window.addEventListener('error', (e) => {
    logErrorToServer(e.error || e.message, 'window.onerror');
  });
  window.addEventListener('unhandledrejection', (e) => {
    logErrorToServer(e.reason, 'unhandledrejection');
  });

  /* ============================================================
     EXPORT
     ============================================================ */
  window.checkDeviceStatusServer = checkDeviceStatusServer;
  window.checkLockServer         = checkLockServer;
  window.syncFinishedStateToServer = syncFinishedStateToServer;
  window.logErrorToServer        = logErrorToServer;

  console.log('[SECURITY] ✓ Loaded — server-side gates + error tracking');
})();
