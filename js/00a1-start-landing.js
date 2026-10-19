/* ============================================================
   js/00a1-start-landing.js — Tier 2 Landing Page
   ------------------------------------------------------------
   URL: ?start={tokenId}.{signature}
   - Verifikasi signedToken via GAS (HMAC + time window)
   - Countdown live (tick per detik, server-authoritative)
   - Tombol "Mulai Tes" disabled sampai scheduledAt
   - Audit log ke GAS di setiap state change
   - Tidak invalidate token saat diklik
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Cek apakah ?start= ada ---------- */
  const url = new URL(window.location.href);
  const startParam = url.searchParams.get('start');
  if (!startParam) return;

  /* 🆕 FIX [2026-10-19]: Skip landing mode kalau:
     - URL punya ?retake=1 → ini retake flow, bukan landing
     - URL punya ?token= → retake flow juga
     - startParam tidak mengandung '.' → bukan signedToken format
       (bisa jadi ?start=<unixTimestamp> dari retake scheduledAt)
     
     Format signedToken yang valid: "{tokenId}.{signature}" (ada titik) */
  if (url.searchParams.get('retake') === '1' ||
      url.searchParams.get('token') ||
      startParam.indexOf('.') === -1) {
    console.log('[START-LANDING] ⏭️ Skip — bukan signedToken URL (bukan landing mode)',
      '| start:', startParam.slice(0, 30),
      '| retake:', url.searchParams.get('retake'),
      '| has token:', !!url.searchParams.get('token'));
    return;
  }

  console.log('[START-LANDING] 🎯 Landing mode aktif — token:', startParam.slice(0, 16) + '...');

  /* ---------- Hide default UI ---------- */
  function hideDefaultUI() {
    const pwd = document.getElementById('passwordScreen');
    if (pwd) pwd.style.display = 'none';
    const app = document.getElementById('app');
    if (app) { app.style.display = 'none'; app.innerHTML = ''; }
    document.body.style.background = 'linear-gradient(135deg, #0f172a 0%, #0c1c30 50%, #0a2a3d 100%)';
    document.body.style.overflow = 'hidden';
  }
  hideDefaultUI();
  setTimeout(hideDefaultUI, 100);
  setTimeout(hideDefaultUI, 500);
  setTimeout(hideDefaultUI, 1500);

  /* ---------- Root overlay ---------- */
  const root = document.createElement('div');
  root.id = 'startLandingRoot';
  root.style.cssText = 'position:fixed;inset:0;z-index:2147483646;overflow-y:auto;font-family:Inter,system-ui,sans-serif;color:#e2e8f0;display:flex;align-items:center;justify-content:center;padding:20px;';
  document.body.appendChild(root);

  /* ---------- State ---------- */
  const state = {
    view: 'loading',       // loading | waiting | ready | expired | invalid | error
    data: null,            // { name, tahap, tests, scheduledAt, expiresAt, position }
    serverNow: 0,          // unix seconds (from GAS)
    remainingMs: 0,
    expiredInMs: 0,
    tickHandle: null,
    expireHandle: null,
    error: null
  };

  /* ---------- GAS URL ---------- */
  const GAS_URL = (typeof window.GAS_ADMIN_URL === 'string' && window.GAS_ADMIN_URL)
    || 'https://script.google.com/macros/s/AKfycbzsdy_aGU5vN6mrkXvNbKBO4nHym6xIGhDNT0u_Urz3qQ2w3jFjwMzjfv0ipQxmqyBG/exec';

  /* ---------- Helper GAS call ---------- */
  async function callGAS(payload) {
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.warn('[START-LANDING] GAS call error:', e.message);
      throw e;
    }
  }

  /* ---------- Audit (fire-and-forget) ---------- */
  function audit(action, extra) {
    try {
      callGAS({
        action: 'log_token_audit',
        signedToken: startParam,
        eventAction: action,
        meta: extra || {},
        ua: (navigator.userAgent || '').slice(0, 200),
        referrer: document.referrer ? document.referrer.slice(0, 200) : ''
      }).catch(() => {});
    } catch (e) {}
  }

  /* ---------- Utils ---------- */
  function fmtDate(unixSec) {
    const d = new Date(unixSec * 1000);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  }
  function fmtTime(unixSec) {
    const d = new Date(unixSec * 1000);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  function pad2(n) { return String(Math.max(0, Math.floor(n))).padStart(2, '0'); }
  function fmtCountdown(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h >= 24) {
      const d = Math.floor(h / 24);
      const rh = h % 24;
      return d + 'h ' + pad2(rh) + ':' + pad2(m) + ':' + pad2(s);
    }
    return pad2(h) + ':' + pad2(m) + ':' + pad2(s);
  }
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- Cleanup ---------- */
  function cleanup() {
    if (state.tickHandle) { clearInterval(state.tickHandle); state.tickHandle = null; }
    if (state.expireHandle) { clearTimeout(state.expireHandle); state.expireHandle = null; }
  }

  /* ---------- Render ---------- */
  function renderHeader() {
    return `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:80px;height:80px;margin:0 auto 16px;display:grid;place-items:center;background:linear-gradient(135deg,#06b6d4,#0ea5e9);border-radius:22px;box-shadow:0 20px 50px rgba(6,182,212,.4);">
          <img src="https://wsrv.nl/?url=cdn.jsdelivr.net/gh/Pragas123/assets@main/nmqo6a.png&w=160&h=140&output=webp&q=85" alt="Logo" style="width:56px;height:56px;object-fit:contain;border-radius:14px;">
        </div>
        <div style="font-size:10.5px;font-weight:900;letter-spacing:3px;color:#67e8f9;margin-bottom:6px;">SUGAR GROUP SCHOOLS</div>
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#94a3b8;">PSIKOTES ONLINE · TES TAHAP</div>
      </div>`;
  }

  function renderCard(inner) {
    return `
      <div style="width:min(480px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(6,182,212,.4);border-radius:22px;padding:32px 28px;box-shadow:0 40px 100px rgba(0,0,0,.7),0 0 0 1px rgba(6,182,212,.1);">
        ${renderHeader()}
        ${inner}
      </div>`;
  }

  function renderLoading() {
    root.innerHTML = renderCard(`
      <div style="text-align:center;padding:20px 0;">
        <div style="width:48px;height:48px;margin:0 auto 18px;border:3px solid rgba(6,182,212,.2);border-top-color:#06b6d4;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
        <div style="font-size:14px;font-weight:800;color:#e2e8f0;margin-bottom:6px;">Memverifikasi link...</div>
        <div style="font-size:11.5px;color:#64748b;">Mohon tunggu sebentar</div>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `);
  }

  function renderWaiting() {
    const d = state.data;
    root.innerHTML = renderCard(`
      <div style="padding:14px 16px;background:linear-gradient(135deg,rgba(6,182,212,.15),rgba(14,165,233,.08));border:1px solid rgba(6,182,212,.4);border-radius:12px;margin-bottom:18px;">
        <div style="font-size:10px;font-weight:900;letter-spacing:1.5px;color:#67e8f9;margin-bottom:6px;">HALO,</div>
        <div style="font-size:16px;font-weight:900;color:#fff;line-height:1.3;">${esc(d.name)}</div>
        ${d.position ? `<div style="font-size:11.5px;color:#94a3b8;margin-top:4px;">💼 ${esc(d.position)}</div>` : ''}
        <div style="font-size:11px;color:#94a3b8;margin-top:8px;padding-top:8px;border-top:1px dashed rgba(6,182,212,.3);">
          📋 <b style="color:#a5f3fc;">Tes Tahap ${d.tahap}</b>
          ${d.tests && d.tests.length ? ` · ${esc(d.tests.join(' · '))}` : ''}
        </div>
      </div>

      <div style="text-align:center;padding:20px 14px 22px;background:rgba(0,0,0,.25);border-radius:14px;margin-bottom:18px;">
        <div style="font-size:10px;font-weight:900;letter-spacing:2px;color:#64748b;margin-bottom:12px;">MULAI DALAM</div>
        <div id="landingCountdown" style="font-size:36px;font-weight:900;color:#67e8f9;font-family:'Courier New',monospace;letter-spacing:2px;font-variant-numeric:tabular-nums;line-height:1;text-shadow:0 0 24px rgba(6,182,212,.5);">--:--:--</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;">
        <div style="padding:10px 12px;background:rgba(0,0,0,.25);border-radius:10px;">
          <div style="font-size:9px;font-weight:900;letter-spacing:1px;color:#64748b;margin-bottom:4px;">📅 TANGGAL</div>
          <div style="font-size:11.5px;font-weight:800;color:#e2e8f0;">${esc(fmtDate(d.scheduledAt))}</div>
        </div>
        <div style="padding:10px 12px;background:rgba(0,0,0,.25);border-radius:10px;">
          <div style="font-size:9px;font-weight:900;letter-spacing:1px;color:#64748b;margin-bottom:4px;">🕐 PUKUL</div>
          <div style="font-size:11.5px;font-weight:800;color:#e2e8f0;">${esc(fmtTime(d.scheduledAt))} WIB</div>
        </div>
      </div>

      <button id="landingStartBtn" disabled
        style="width:100%;padding:16px;border:0;border-radius:12px;
          background:rgba(148,163,184,.15);color:#64748b;
          font-family:inherit;font-size:14px;font-weight:900;
          cursor:not-allowed;letter-spacing:.5px;">
        ⏳ Belum Waktunya
      </button>

      <div style="margin-top:14px;padding:11px 14px;background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.3);border-radius:10px;font-size:11px;color:#a5f3fc;line-height:1.6;text-align:center;">
        Link ini hanya aktif mulai waktu di atas. Halaman akan otomatis refresh saat waktunya tiba.
      </div>
    `);

    startCountdown();
  }

  function renderReady() {
    const d = state.data;
    root.innerHTML = renderCard(`
      <div style="text-align:center;padding:8px 0 22px;">
        <div style="font-size:52px;margin-bottom:12px;line-height:1;">🚀</div>
        <div style="font-size:20px;font-weight:900;color:#fff;margin-bottom:8px;line-height:1.3;">Waktunya Mulai!</div>
        <div style="font-size:12.5px;color:#94a3b8;line-height:1.6;margin-bottom:20px;">
          Halo <b style="color:#a5f3fc;">${esc(d.name)}</b>, silakan mulai tes Anda.
        </div>
        <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(6,182,212,.15);border:1px solid rgba(6,182,212,.4);border-radius:999px;font-size:11px;font-weight:800;color:#67e8f9;margin-bottom:16px;">
          📋 Tes Tahap ${d.tahap}${d.tests && d.tests.length ? ` · ${esc(d.tests.join(' · '))}` : ''}
        </div>
      </div>

      <button id="landingStartBtn" onclick="__landingStart()"
        style="width:100%;padding:18px;border:0;border-radius:12px;
          background:linear-gradient(135deg,#06b6d4,#0ea5e9);
          color:#fff;font-family:inherit;font-size:15px;font-weight:900;
          cursor:pointer;letter-spacing:.5px;
          box-shadow:0 12px 30px rgba(6,182,212,.4),inset 0 1px 0 rgba(255,255,255,.2);">
        🚀 Mulai Tes Sekarang
      </button>

      <div style="margin-top:16px;padding:11px 14px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.3);border-radius:10px;font-size:11px;color:#86efac;line-height:1.6;text-align:center;">
        ✅ Link aktif · Kadaluarsa ${esc(fmtDate(d.expiresAt))} pukul ${esc(fmtTime(d.expiresAt))}
      </div>
    `);
  }

  function renderExpired() {
    const d = state.data || {};
    root.innerHTML = renderCard(`
      <div style="text-align:center;padding:8px 0 18px;">
        <div style="font-size:52px;margin-bottom:12px;line-height:1;">⌛</div>
        <div style="font-size:20px;font-weight:900;color:#fca5a5;margin-bottom:8px;line-height:1.3;">Link Sudah Tidak Berlaku</div>
        <div style="font-size:12.5px;color:#94a3b8;line-height:1.7;margin-bottom:20px;">
          ${d.name ? `Halo <b style="color:#a5f3fc;">${esc(d.name)}</b>, ` : ''}link tes ini sudah melewati batas waktu.
          ${d.expiresAt ? `<br><br><span style="font-size:11px;color:#64748b;">Kadaluarsa: ${esc(fmtDate(d.expiresAt))} pukul ${esc(fmtTime(d.expiresAt))}</span>` : ''}
        </div>
        <div style="padding:12px 14px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);border-radius:10px;font-size:11.5px;color:#fca5a5;line-height:1.6;">
          Silakan hubungi admin untuk mendapatkan link baru.
        </div>
      </div>
    `);
  }

  function renderInvalid(reason) {
    root.innerHTML = renderCard(`
      <div style="text-align:center;padding:8px 0 18px;">
        <div style="font-size:52px;margin-bottom:12px;line-height:1;">❌</div>
        <div style="font-size:20px;font-weight:900;color:#fca5a5;margin-bottom:8px;line-height:1.3;">Link Tidak Valid</div>
        <div style="font-size:12.5px;color:#94a3b8;line-height:1.7;margin-bottom:20px;">
          ${esc(reason || 'Link tes tidak dapat diverifikasi.')}
        </div>
        <div style="padding:12px 14px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);border-radius:10px;font-size:11.5px;color:#fca5a5;line-height:1.6;">
          Pastikan Anda membuka link dari email yang dikirim admin.
        </div>
      </div>
    `);
  }

  function renderError(msg) {
    root.innerHTML = renderCard(`
      <div style="text-align:center;padding:8px 0 18px;">
        <div style="font-size:52px;margin-bottom:12px;line-height:1;">⚠️</div>
        <div style="font-size:18px;font-weight:900;color:#fcd34d;margin-bottom:8px;">Koneksi Bermasalah</div>
        <div style="font-size:12.5px;color:#94a3b8;line-height:1.7;margin-bottom:18px;">
          ${esc(msg || 'Gagal memverifikasi link. Periksa koneksi internet Anda.')}
        </div>
        <button onclick="location.reload()" style="width:100%;padding:14px;border:0;border-radius:11px;background:linear-gradient(135deg,#06b6d4,#0ea5e9);color:#fff;font-family:inherit;font-size:13px;font-weight:900;cursor:pointer;">
          🔄 Coba Lagi
        </button>
      </div>
    `);
  }

  /* ---------- Countdown live ---------- */
  function startCountdown() {
    cleanup();

   // Di init, setelah set state.serverNow:
state.targetAtMs = Date.now() + (state.remainingMs);

// Di tick():
function tick() {
  if (state.view !== 'waiting') return;
  const el = document.getElementById('landingCountdown');
  if (!el) return;

  state.remainingMs = Math.max(0, state.targetAtMs - Date.now());
  el.textContent = fmtCountdown(state.remainingMs);

  if (state.remainingMs <= 0) {
    cleanup();
    transitionToReady();
  }
}

    tick();
    state.tickHandle = setInterval(tick, 1000);

    // Auto expire
    state.expireHandle = setTimeout(() => {
      if (state.view === 'waiting' || state.view === 'ready') {
        audit('expired_view');
        state.view = 'expired';
        cleanup();
        renderExpired();
      }
    }, Math.max(0, state.expiredInMs));
  }

  function transitionToReady() {
  state.view = 'ready';
  cleanup();
  audit('ready');
  renderReady();

  // Re-arm expire timer
  if (state.expiredInMs > 0) {
    state.expireHandle = setTimeout(() => {
      if (state.view === 'ready') {
        audit('expired_view');
        state.view = 'expired';
        cleanup();
        renderExpired();
      }
    }, state.expiredInMs);
  }
}

  /* ---------- Click handler ---------- */
  window.__landingStart = function () {
    const d = state.data;
    if (!d) return;
    audit('click_start');

    // Build retake URL — signedToken not needed here, only tokenId
    const base = window.location.origin + window.location.pathname;
    const params = [
      'retake=1',
      'n=' + encodeURIComponent(d.name),
      'p=' + encodeURIComponent(d.position || ''),
      'tests=' + encodeURIComponent((d.tests || []).join(',')),
      'tahap=' + d.tahap,
      'start=' + d.scheduledAt,
      'expiresAt=' + d.expiresAt,
      'token=' + encodeURIComponent(d.tokenId)
    ];
    window.location.href = base + '?' + params.join('&');
  };

  /* ---------- Fetch & verify ---------- */
  async function init() {
    state.view = 'loading';
    renderLoading();
    audit('view');

    try {
      const res = await callGAS({
        action: 'verify_token',
        signedToken: startParam
      });

      if (!res || !res.success) {
        state.view = 'error';
        state.error = res?.error || 'Gagal verifikasi';
        renderInvalid(res?.reason || res?.error || 'Link tidak valid.');
        audit('invalid_view', { reason: res?.reason || 'unknown' });
        return;
      }

      if (!res.valid) {
        // Check reason
        if (res.reason === 'expired') {
          state.view = 'expired';
          state.data = res.data || null;
          audit('expired_view');
          renderExpired();
        } else {
          state.view = 'invalid';
          audit('invalid_view', { reason: res.reason });
          renderInvalid(res.reason_label || res.reason || 'Link tidak valid.');
        }
        return;
      }

      // Valid
      state.data = res.data;
      state.serverNow = res.now;
      const scheduledAt = state.data.scheduledAt;
      const expiresAt = state.data.expiresAt;

      // Compute remaining (using serverNow as reference to prevent clock skew)
      const remainingSec = scheduledAt - state.serverNow;
      state.remainingMs = remainingSec > 0 ? remainingSec * 1000 : 0;
      state.expiredInMs = Math.max(0, (expiresAt - state.serverNow) * 1000);

       if (state.remainingMs > 0) {
        state.view = 'waiting';
        renderWaiting();
      } else {
        state.view = 'ready';
        audit('ready_immediate');
        renderReady();

        /* 🆕 Re-arm expire timer untuk skenario immediate-ready
           (kandidat buka link setelah scheduledAt lewat).
           Tanpa ini: user bisa idle di halaman ready sampai expiresAt,
           UI tetap "ready" padahal sudah kadaluarsa. */
        if (state.expiredInMs > 0) {
          state.expireHandle = setTimeout(() => {
            if (state.view === 'ready') {
              audit('expired_view');
              state.view = 'expired';
              cleanup();
              renderExpired();
            }
          }, state.expiredInMs);
        }
      }

    } catch (e) {
      state.view = 'error';
      state.error = e.message;
      renderError('Gagal memverifikasi: ' + e.message);
    }
  }

  /* ---------- Cleanup on unload ---------- */
  window.addEventListener('beforeunload', cleanup);

  /* ---------- Start ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 200);
  }
})();