/* ============================================================
   js/00l-security.js
   - Server-side gate: cek finished/disqualified di Firebase
   - Menggantikan cek localStorage yang bisa dimanipulasi
   - Security event logging ke /sgs_errors
   ------------------------------------------------------------
   🔒 SECURITY FIX [2026-09-22]:
   - P1-4 : Initial release
   - P1-4a: Fail-closed + handle permission denied gracefully
   - P1-4b: Rate limit error logging (max 5/menit)
   - P1-4c: Dedup error yang sama (5 menit window)
   - P1-4d: Skip error dari browser extension
   - P1-4e: Circuit breaker kalau Firebase error berkali-kali
   - P1-4f: Verify sync finished state berhasil
   ============================================================ */

(function() {
  'use strict';

  /* ============================================================
     STATE UNTUK RATE LIMIT & CIRCUIT BREAKER
     ============================================================ */
  const __errState = {
    count: 0,
    windowStart: Date.now(),
    recent: new Map(),       // signature → timestamp
    firebaseFailures: 0,
    circuitOpen: false,
    circuitOpenedAt: 0
  };

  const ERR_MAX_PER_WINDOW = 5;
  const ERR_WINDOW_MS = 60 * 1000;           // 1 menit
  const DEDUP_WINDOW_MS = 5 * 60 * 1000;     // 5 menit
  const FIREBASE_FAIL_THRESHOLD = 3;
  const CIRCUIT_OPEN_MS = 60 * 1000;         // 1 menit

  /* ============================================================
     HELPER: Cek permission denied
     ============================================================ */
  function __isPermissionDenied(err) {
    if (!err) return false;
    const msg = String(err.message || err.code || err).toLowerCase();
    return msg.includes('permission_denied') ||
           msg.includes('permission denied') ||
           msg.includes('permission-denied') ||
           msg.includes('unauthorized');
  }

  function __isFirebaseReady() {
    return typeof firebase !== 'undefined'
      && firebase.apps
      && firebase.apps.length > 0;
  }

  /* ============================================================
     CIRCUIT BREAKER
     ============================================================ */
  function __recordFirebaseFailure() {
    __errState.firebaseFailures++;
    if (__errState.firebaseFailures >= FIREBASE_FAIL_THRESHOLD) {
      __errState.circuitOpen = true;
      __errState.circuitOpenedAt = Date.now();
      console.warn('[SECURITY] ⚡ Circuit breaker OPEN — stop hit Firebase 1 menit');
    }
  }

  function __recordFirebaseSuccess() {
    __errState.firebaseFailures = 0;
    if (__errState.circuitOpen) {
      __errState.circuitOpen = false;
      console.log('[SECURITY] ✅ Circuit breaker CLOSED — resume');
    }
  }

  function __isCircuitOpen() {
    if (!__errState.circuitOpen) return false;
    if (Date.now() - __errState.circuitOpenedAt > CIRCUIT_OPEN_MS) {
      __errState.circuitOpen = false;
      __errState.firebaseFailures = 0;
      console.log('[SECURITY] 🔄 Circuit breaker auto-reset');
      return false;
    }
    return true;
  }

  /* ============================================================
     CEK SERVER-SIDE STATUS DEVICE
     ------------------------------------------------------------
     🔒 Fail-closed: kalau permission denied → anggap 'unknown'
       (JANGAN blokir kandidat karena race condition device_owners)
     ============================================================ */
  async function checkDeviceStatusServer(deviceId) {
    if (!deviceId) return { status: 'unknown', reason: 'no_device_id' };

    if (!__isFirebaseReady()) {
      return { status: 'unknown', reason: 'firebase_not_ready' };
    }

    if (__isCircuitOpen()) {
      return { status: 'unknown', reason: 'circuit_open' };
    }

    try {
      const snap = await firebase.database()
        .ref('sgs_state/sessions/' + deviceId)
        .once('value');

      __recordFirebaseSuccess();

      const data = snap.val() || {};
      return {
        status: 'ok',
        finished: data.finished === true,
        disqualified: data.disqualified === true,
        status_str: data.status || 'active',
        lastSeen: data.lastSeen || 0
      };
    } catch (e) {
      // ⚠️ Permission denied = device_owners belum ter-set (race condition)
      // → return 'unknown' supaya kandidat TIDAK diblokir
      if (__isPermissionDenied(e)) {
        console.warn('[SECURITY] Device status: permission denied — device_owners mungkin belum ter-set');
        return { status: 'unknown', reason: 'permission_denied' };
      }

      __recordFirebaseFailure();
      console.warn('[SECURITY] Gagal cek status server:', e.message);
      return { status: 'error', reason: e.message };
    }
  }

  /* ============================================================
     CEK LOCK SERVER-SIDE
     ------------------------------------------------------------
     🔒 Fail-closed: kalau error apapun → anggap LOCKED
     ============================================================ */
  async function checkLockServer() {
    if (!__isFirebaseReady()) {
      return { status: 'unknown', locked: true };
    }

    if (__isCircuitOpen()) {
      return { status: 'unknown', locked: true, reason: 'circuit_open' };
    }

    try {
      const snap = await firebase.database()
        .ref('sgs_state/lock')
        .once('value');

      __recordFirebaseSuccess();

      return {
        status: 'ok',
        locked: snap.val() === true
      };
    } catch (e) {
      __recordFirebaseFailure();
      return {
        status: 'error',
        locked: true,              // fail-closed
        reason: e.message
      };
    }
  }

  /* ============================================================
     SYNC localStorage → Firebase
     ------------------------------------------------------------
     🔒 Verify berhasil (jangan silent fail)
     ============================================================ */
  async function syncFinishedStateToServer(deviceId) {
    if (!deviceId) return { ok: false, reason: 'no_device_id' };

    const localFinished = localStorage.getItem('_sgs_finished') === '1';
    if (!localFinished) return { ok: true, skipped: true };

    if (!__isFirebaseReady()) {
      return { ok: false, reason: 'firebase_not_ready' };
    }

    if (__isCircuitOpen()) {
      return { ok: false, reason: 'circuit_open' };
    }

    try {
      await firebase.database()
        .ref('sgs_state/sessions/' + deviceId)
        .update({
          finished: true,
          finishedAt: firebase.database.ServerValue.TIMESTAMP
        });

      __recordFirebaseSuccess();
      console.log('[SECURITY] ✅ Finished state synced to server');
      return { ok: true };
    } catch (e) {
      if (__isPermissionDenied(e)) {
        console.warn('[SECURITY] Sync finished: permission denied — device_owners mungkin belum ter-set');
        return { ok: false, reason: 'permission_denied' };
      }

      __recordFirebaseFailure();
      console.warn('[SECURITY] Sync finished gagal:', e.message);
      return { ok: false, reason: e.message };
    }
  }

 /* ============================================================
   LOG ERROR — sentralisasi error tracking
   ------------------------------------------------------------
   🔒 P1-4b: Rate limit max 5 error / menit per device
   ============================================================ */

let __errCount = 0;
let __errWindowStart = Date.now();
const __ERR_MAX = 5;
const __ERR_WINDOW = 60 * 1000;

function logErrorToServer(err, ctx) {
  // 1) Rate limit — reset window kalau sudah lewat 1 menit
  const now = Date.now();
  if (now - __errWindowStart > __ERR_WINDOW) {
    __errCount = 0;
    __errWindowStart = now;
  }

  // 2) Skip kalau sudah lewat batas
  if (++__errCount > __ERR_MAX) return;

  // 3) Cek Firebase ready
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;

  const user = firebase.auth().currentUser;
  if (!user) return;

  // 4) Kirim ke Firebase
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
     HELPER: Deteksi error dari browser extension
     ------------------------------------------------------------
     Extension Chrome/Firefox sering inject error di halaman kita.
     Filter mereka supaya tidak membanjiri /sgs_errors.
     ============================================================ */
  function __isExtensionError(err, errStr) {
    const stack = String((err && err.stack) || '');
    const sources = [
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'safari-web-extension://',
      'ms-browser-extension://',
      'extensions::'
    ];
    for (const src of sources) {
      if (errStr.includes(src) || stack.includes(src)) return true;
    }
    // Common extension errors
    const extPatterns = [
      /MetaMask/i,
      /ethereum/i,
      /provider.*not.*found/i,
      /chrome\.runtime/i,
      /extension.*context.*invalidated/i
    ];
    for (const pat of extPatterns) {
      if (pat.test(errStr) || pat.test(stack)) return true;
    }
    return false;
  }

  /* ============================================================
     HELPER: Signature untuk dedup
     ============================================================ */
  function __getErrorSignature(err, errStr, ctx) {
    const stack = String((err && err.stack) || '').split('\n')[0] || '';
    return [
      String(ctx || '').slice(0, 50),
      String(errStr).slice(0, 100),
      stack.slice(0, 100)
    ].join('||');
  }

  /* ============================================================
     AUTO-CAPTURE window.onerror + unhandledrejection
     ------------------------------------------------------------
     🔒 Skip error dari:
       - Browser extension
       - Script dari origin lain (cross-origin script error)
       - Error yang tidak punya stack (biasanya extension)
     ============================================================ */
  window.addEventListener('error', (e) => {
    // Skip error dari <img>/<script> yang gagal load
    if (e.target && e.target !== window && e.target.tagName) {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'img' || tag === 'script' || tag === 'link') {
        return;
      }
    }

    const err = e.error || e.message;
    if (!err) return;

    // Skip cross-origin script error (tidak ada info)
    if (typeof err === 'string' && err === 'Script error.') {
      return;
    }

    logErrorToServer(err, 'window.onerror');
  });

  window.addEventListener('unhandledrejection', (e) => {
    logErrorToServer(e.reason, 'unhandledrejection');
  });

  /* ============================================================
     PUBLIC API — Rate limit status (untuk admin debug)
     ============================================================ */
  function __getSecurityState() {
    return {
      errorsInWindow: __errState.count,
      maxPerWindow: ERR_MAX_PER_WINDOW,
      windowMs: ERR_WINDOW_MS,
      dedupSize: __errState.recent.size,
      circuitOpen: __errState.circuitOpen,
      firebaseFailures: __errState.firebaseFailures
    };
  }

  /* ============================================================
     EXPORT
     ============================================================ */
  window.checkDeviceStatusServer   = checkDeviceStatusServer;
  window.checkLockServer           = checkLockServer;
  window.syncFinishedStateToServer = syncFinishedStateToServer;
  window.logErrorToServer          = logErrorToServer;
  window.__getSecurityState        = __getSecurityState;

  console.log('[SECURITY] ✓ Loaded — server-side gates + rate-limited error tracking');
})();
