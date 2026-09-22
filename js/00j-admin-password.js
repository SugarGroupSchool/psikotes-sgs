/* ============================================================
   js/00j-admin-password.js
   - Halaman baru: Pengaturan Password (FRESH & USED)
   - Dibuka dari panel admin via openPasswordSettingsPage()
   - CSP-safe: event delegation (tanpa onclick inline)
   ============================================================ */

(function() {
  'use strict';

  try { window.__ENABLE_LOGS && window.__ENABLE_LOGS(); } catch(e){}
  console.log('[ADMIN-PASSWORD] ✓ Script mulai');

  /* ============================================================
     HELPERS
     ============================================================ */
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(msg, color) {
    color = color || '#16a34a';
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = [
      'position:fixed;bottom:24px;right:24px;',
      'padding:12px 18px;border-radius:10px;',
      'background:' + color + ';color:#fff;font-weight:800;font-size:13px;',
      'z-index:2147483647;font-family:Inter,system-ui,sans-serif;',
      'box-shadow:0 10px 26px ' + color + '55;'
    ].join('');
    document.body.appendChild(t);
    setTimeout(function() { t.remove(); }, 2500);
  }

  /* ============================================================
     OPEN / CLOSE
     ============================================================ */
  function openPasswordSettingsPage() {
    var old = document.getElementById('passwordSettingsPageOverlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'passwordSettingsPageOverlay';
   overlay.style.cssText = [
  'position:fixed;inset:0;z-index:100002;',   // ← GANTI
  'background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);',
      'display:flex;flex-direction:column;',
      'font-family:Inter,system-ui,-apple-system,sans-serif;',
      'color:#e2e8f0;overflow:hidden;',
      'animation:psPageIn .28s cubic-bezier(.2,.8,.2,1);'
    ].join('');

    overlay.innerHTML = [
      '<style>',
      '  @keyframes psPageIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }',
      '  .ps-scroll::-webkit-scrollbar { width: 8px; }',
      '  .ps-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,.03); }',
      '  .ps-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 4px; }',
      '  .ps-password-box {',
      '    font-family: "Courier New", monospace;',
      '    font-size: 22px; font-weight: 900;',
      '    letter-spacing: 1.5px; text-align: center;',
      '    padding: 18px 22px; border-radius: 12px 12px 0 0;',
      '    word-break: break-all; line-height: 1.3;',
      '  }',
      '  .ps-btn {',
      '    padding: 10px 14px; border-radius: 8px; border: 0;',
      '    font-family: inherit; font-size: 12px; font-weight: 800;',
      '    cursor: pointer; transition: all .18s ease;',
      '    display: inline-flex; align-items: center; gap: 6px;',
      '  }',
      '  .ps-btn:hover { transform: translateY(-1px); }',
      '  .ps-input {',
      '    flex: 1; padding: 10px 14px;',
      '    border: 1px solid rgba(255,255,255,.15);',
      '    border-radius: 8px;',
      '    background: rgba(255,255,255,.05);',
      '    color: #fff; font-family: inherit; font-size: 13px;',
      '    outline: none;',
      '  }',
      '  .ps-input:focus { border-color: #fcd34d; }',
      '  .ps-input::placeholder { color: rgba(255,255,255,.35); }',
      '</style>',

      // HEADER
      '<div style="padding:20px 28px;background:linear-gradient(180deg,rgba(0,0,0,.25),transparent);border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:18px;flex-wrap:wrap;">',
      '  <button id="psBackBtn" style="',
      '    width:42px;height:42px;flex:0 0 42px;',
      '    display:grid;place-items:center;',
      '    background:rgba(255,255,255,.08);',
      '    border:1.5px solid rgba(255,255,255,.14);',
      '    border-radius:12px;color:#fff;font-size:18px;',
      '    cursor:pointer;font-family:inherit;transition:all .18s ease;',
      '  " onmouseover="this.style.background=\'rgba(255,255,255,.15)\'"',
      '     onmouseout="this.style.background=\'rgba(255,255,255,.08)\'">←</button>',
      '  <div style="flex:1;min-width:0;">',
      '    <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#fcd34d;margin-bottom:4px;">ADMIN PANEL · KEAMANAN</div>',
      '    <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-.3px;">🔑 Pengaturan Password</div>',
      '  </div>',
      '</div>',

      // CONTENT
      '<div id="psContent" class="ps-scroll" style="flex:1;overflow-y:auto;padding:24px 28px 40px;">',
      '  <div style="max-width:720px;margin:0 auto;"></div>',
      '</div>'
    ].join('');

    document.body.appendChild(overlay);
    document.getElementById('psBackBtn').onclick = closePasswordSettingsPage;
    renderContent();
  }

  function closePasswordSettingsPage() {
    var overlay = document.getElementById('passwordSettingsPageOverlay');
    if (overlay) overlay.remove();
    if (typeof window.renderAdminPanel === 'function') {
      try { window.renderAdminPanel(); } catch(e) {}
    }
  }

  /* ============================================================
     RENDER CONTENT
     ============================================================ */
  function renderContent() {
    var content = document.querySelector('#psContent > div');
    if (!content) return;

    var locked = (typeof window.getLockState === 'function') ? window.getLockState() : false;
    var freshPwd = (typeof window.getFreshPwd === 'function') ? window.getFreshPwd() : '—';
    var usedPwd  = (typeof window.getUsedPwd  === 'function') ? window.getUsedPwd()  : '—';

    var html = '';

    // ==== STATUS LOCK ====
    html += '<div style="margin-bottom:22px;padding:18px 20px;background:' + (locked ? 'rgba(239,68,68,.12)' : 'rgba(34,197,94,.12)') + ';border:2px solid ' + (locked ? 'rgba(239,68,68,.4)' : 'rgba(34,197,94,.4)') + ';border-radius:14px;display:flex;align-items:center;gap:14px;">'
      + '<div style="font-size:32px;">' + (locked ? '🔒' : '🔓') + '</div>'
      + '<div style="flex:1;">'
      +   '<div style="font-size:15px;font-weight:900;color:' + (locked ? '#fca5a5' : '#86efac') + ';margin-bottom:4px;">'
      +     (locked ? 'Login Dikunci' : 'Login Terbuka')
      +   '</div>'
      +   '<div style="font-size:12px;color:#94a3b8;line-height:1.5;">'
      +     (locked ? 'Kandidat tidak bisa login dengan password apapun.' : 'Kandidat bisa login dengan password di bawah.')
      +   '</div>'
      + '</div>'
      + '<button class="ps-btn" data-ps-action="toggle-lock" style="padding:10px 18px;background:' + (locked ? 'linear-gradient(135deg,#16a34a,#059669)' : 'linear-gradient(135deg,#dc2626,#991b1b)') + ';color:#fff;">'
      +   (locked ? '🔓 Buka Kunci' : '🔒 Kunci Login')
      + '</button>'
      + '</div>';

    // ==== FRESH ====
    html += '<div style="margin-bottom:22px;">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'
      +   '<span style="width:10px;height:10px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.2);"></span>'
      +   '<div style="font-size:12px;font-weight:800;letter-spacing:1.5px;color:#86efac;text-transform:uppercase;">Password FRESH — Kandidat Baru</div>'
      + '</div>'
      + '<div class="ps-password-box" style="background:rgba(34,197,94,.1);border:2px solid rgba(34,197,94,.35);border-bottom:0;color:#86efac;">' + esc(freshPwd) + '</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;background:rgba(34,197,94,.1);border:2px solid rgba(34,197,94,.35);border-top:0;border-radius:0 0 12px 12px;padding:10px;">'
      +   '<button class="ps-btn" data-ps-action="copy-fresh" data-ps-value="' + esc(freshPwd) + '" style="flex:1;min-width:110px;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;justify-content:center;">📋 Copy</button>'
      +   '<button class="ps-btn" data-ps-action="regen-fresh" style="flex:1;min-width:110px;background:rgba(255,255,255,.1);color:#86efac;border:1px solid rgba(34,197,94,.4);justify-content:center;">🔄 Random</button>'
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-top:10px;">'
      +   '<input class="ps-input" id="psFreshInput" placeholder="Atau ketik manual..." autocomplete="off">'
      +   '<button class="ps-btn" data-ps-action="set-fresh" style="padding:10px 20px;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;">Set</button>'
      + '</div>'
      + '</div>';

    // ==== USED ====
    html += '<div style="margin-bottom:22px;">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'
      +   '<span style="width:10px;height:10px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 4px rgba(239,68,68,.2);"></span>'
      +   '<div style="font-size:12px;font-weight:800;letter-spacing:1.5px;color:#fca5a5;text-transform:uppercase;">Password USED — Lanjut / Resume</div>'
      + '</div>'
      + '<div class="ps-password-box" style="background:rgba(239,68,68,.1);border:2px solid rgba(239,68,68,.35);border-bottom:0;color:#fca5a5;">' + esc(usedPwd) + '</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;background:rgba(239,68,68,.1);border:2px solid rgba(239,68,68,.35);border-top:0;border-radius:0 0 12px 12px;padding:10px;">'
      +   '<button class="ps-btn" data-ps-action="copy-used" data-ps-value="' + esc(usedPwd) + '" style="flex:1;min-width:110px;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;justify-content:center;">📋 Copy</button>'
      +   '<button class="ps-btn" data-ps-action="regen-used" style="flex:1;min-width:110px;background:rgba(255,255,255,.1);color:#fca5a5;border:1px solid rgba(239,68,68,.4);justify-content:center;">🔄 Random</button>'
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-top:10px;">'
      +   '<input class="ps-input" id="psUsedInput" placeholder="Atau ketik manual..." autocomplete="off">'
      +   '<button class="ps-btn" data-ps-action="set-used" style="padding:10px 20px;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;">Set</button>'
      + '</div>'
      + '</div>';

    // ==== PANDUAN ====
    html += '<div style="padding:16px 18px;background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.25);border-radius:14px;font-size:13px;color:#fcd34d;line-height:1.7;">'
      + '<div style="font-weight:800;margin-bottom:8px;color:#fde68a;">📘 Cara Pakai</div>'
      + '<div>• <b style="color:#86efac;">FRESH</b> — kandidat baru (belum pernah tes)</div>'
      + '<div>• <b style="color:#fca5a5;">USED</b> — kandidat lanjut/resume (koneksi putus, logout di tengah tes)</div>'
      + '<div>• <b>Selesai / Diskualifikasi</b> — tidak bisa login, pakai "🔓 Izinkan Tes Lagi" di halaman kandidat</div>'
      + '</div>';

    content.innerHTML = html;
  }

  /* ============================================================
     ACTIONS
     ============================================================ */
  function copyToClipboard(text, btn) {
    if (!text) return;
    var done = function() {
      if (!btn) return;
      var prev = btn.textContent;
      btn.textContent = '✓ Tersalin';
      setTimeout(function() { btn.textContent = prev; }, 1200);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function() { fallbackCopy(text); done(); });
      } else {
        fallbackCopy(text); done();
      }
    } catch(e) { fallbackCopy(text); done(); }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
  }

  function handleAction(action, btn) {
    if (action === 'toggle-lock') {
      var locked = (typeof window.getLockState === 'function') ? window.getLockState() : false;
      var next = !locked;
      if (typeof window.setLockStateCloud === 'function') {
        window.setLockStateCloud(next).then(function() {
          try { localStorage.setItem('_sgs_lock', next ? '1' : '0'); } catch(e){}
          toast(next ? '🔒 Login dikunci' : '🔓 Login dibuka', next ? '#dc2626' : '#16a34a');
          renderContent();
        }).catch(function(e) { alert('Gagal: ' + e.message); });
      } else if (typeof window.setLockState === 'function') {
        window.setLockState(next);
        toast(next ? '🔒 Login dikunci' : '🔓 Login dibuka', next ? '#dc2626' : '#16a34a');
        renderContent();
      }
      return;
    }

    if (action === 'copy-fresh' || action === 'copy-used') {
      var val = btn.getAttribute('data-ps-value');
      copyToClipboard(val, btn);
      return;
    }

    if (action === 'regen-fresh') {
  var newFresh = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.generateRandomPassword)
        ? APP_CONFIG.generateRandomPassword('SGS-F-')
        : 'SGS-F-' + Math.random().toString(36).slice(2, 10).toUpperCase();

      if (typeof window.setFreshPwdCloud === 'function') {
        window.setFreshPwdCloud(newFresh).then(function() {
          try { localStorage.setItem('_sgs_pwd_fresh', newFresh); } catch(e){}
          toast('✅ Password FRESH diganti');
          renderContent();
        }).catch(function(e) { alert('Gagal: ' + e.message); });
      }
      return;
    }

 if (action === 'regen-used') {
  var newUsed = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.generateRandomPassword)
        ? APP_CONFIG.generateRandomPassword('SGS-U-')
        : 'SGS-U-' + Math.random().toString(36).slice(2, 10).toUpperCase();

      if (typeof window.setUsedPwdCloud === 'function') {
        window.setUsedPwdCloud(newUsed).then(function() {
          try { localStorage.setItem('_sgs_pwd_used', newUsed); } catch(e){}
          toast('✅ Password USED diganti');
          renderContent();
        }).catch(function(e) { alert('Gagal: ' + e.message); });
      }
      return;
    }

    if (action === 'set-fresh') {
      var freshInput = document.getElementById('psFreshInput');
      var freshVal = freshInput ? freshInput.value.trim() : '';
      if (freshVal.length < 6) { alert('Password minimal 6 karakter'); return; }
      if (!confirm('Set password FRESH ke: "' + freshVal + '"? Password lama hangus.')) return;

      if (typeof window.setFreshPwdCloud === 'function') {
        window.setFreshPwdCloud(freshVal).then(function() {
          try { localStorage.setItem('_sgs_pwd_fresh', freshVal); } catch(e){}
          toast('✅ Password FRESH diganti');
          renderContent();
        }).catch(function(e) { alert('Gagal: ' + e.message); });
      }
      return;
    }

    if (action === 'set-used') {
      var usedInput = document.getElementById('psUsedInput');
      var usedVal = usedInput ? usedInput.value.trim() : '';
      if (usedVal.length < 6) { alert('Password minimal 6 karakter'); return; }
      if (!confirm('Set password USED ke: "' + usedVal + '"? Password lama hangus.')) return;

      if (typeof window.setUsedPwdCloud === 'function') {
        window.setUsedPwdCloud(usedVal).then(function() {
          try { localStorage.setItem('_sgs_pwd_used', usedVal); } catch(e){}
          toast('✅ Password USED diganti');
          renderContent();
        }).catch(function(e) { alert('Gagal: ' + e.message); });
      }
      return;
    }
  }

  /* ============================================================
     EVENT DELEGATION
     ============================================================ */
  if (!window.__psDelegationAttached) {
    window.__psDelegationAttached = true;

    document.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-ps-action]');
      if (!btn) return;
      e.preventDefault();
      handleAction(btn.getAttribute('data-ps-action'), btn);
    }, true);
  }

  window.openPasswordSettingsPage = openPasswordSettingsPage;
  window.closePasswordSettingsPage = closePasswordSettingsPage;

  console.log('[ADMIN-PASSWORD] ✓ Loaded');
})();
