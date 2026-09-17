/* ============================================================
   js/00c-admin-candidate.js
   - Halaman daftar kandidat aktif (openActiveCandidatesPage)
   - Halaman detail kandidat (openCandidateDetailPage)
   - Event delegation (CSP-safe, tanpa onclick inline)
   ============================================================ */

(function() {
  'use strict';

  try { window.__ENABLE_LOGS && window.__ENABLE_LOGS(); } catch(e){}
  console.log('[ADMIN-CANDIDATE] ✓ Script mulai');

  /* ============================================================
     HELPERS
     ============================================================ */
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtTime(sec) {
    var s = Math.max(0, Math.floor(sec || 0));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function timeAgo(sec) {
    if (sec === null || sec === undefined) return '-';
    if (sec < 60) return sec + 's lalu';
    if (sec < 3600) return Math.floor(sec / 60) + 'm lalu';
    if (sec < 86400) return Math.floor(sec / 3600) + 'j lalu';
    return Math.floor(sec / 86400) + 'h lalu';
  }

  function toast(msg, color) {
    color = color || '#16a34a';
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:12px 18px;border-radius:10px;background:' + color + ';color:#fff;font-weight:800;font-size:13px;z-index:2147483647;font-family:Inter,system-ui,sans-serif;';
    document.body.appendChild(t);
    setTimeout(function() { t.remove(); }, 2500);
  }

  function getInitials(name) {
    return String(name || '?').split(/\s+/).slice(0, 2).map(function(w) {
      return w[0] || '';
    }).join('').toUpperCase() || '?';
  }

  function getAvatarColors(name) {
    var hash = String(name || '').split('').reduce(function(a, c) { return a + c.charCodeAt(0); }, 0);
    var palette = [
      ['#3b82f6', '#1e40af'], ['#8b5cf6', '#6d28d9'], ['#10b981', '#047857'],
      ['#f59e0b', '#b45309'], ['#ec4899', '#be185d'], ['#06b6d4', '#0e7490']
    ];
    return palette[hash % palette.length];
  }

  /* ============================================================
     STATE
     ============================================================ */
  var __detailRef = null;
  var __detailCb = null;
  var __listenerAttached = false;

  /* ============================================================
     HALAMAN DAFTAR KANDIDAT
     ============================================================ */
  function openActiveCandidatesPage() {
    var old = document.getElementById('activeCandidatesPageOverlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'activeCandidatesPageOverlay';
    overlay.style.cssText = [
      'position: fixed', 'inset: 0', 'z-index: 99999',
      'background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      'display: flex', 'flex-direction: column',
      'font-family: Inter, system-ui, -apple-system, sans-serif',
      'color: #e2e8f0', 'overflow: hidden',
      'animation: acPageIn .28s cubic-bezier(.2,.8,.2,1)'
    ].join(';');

    overlay.innerHTML = [
      '<style>',
      '  @keyframes acPageIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }',
      '  @keyframes acSpin { to { transform: rotate(360deg); } }',
      '  .ac-scroll::-webkit-scrollbar { width: 8px; }',
      '  .ac-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,.03); }',
      '  .ac-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 4px; }',
      '</style>',

      '<div style="',
      '  padding: 20px 28px;',
      '  background: linear-gradient(180deg, rgba(0,0,0,.25), transparent);',
      '  border-bottom: 1px solid rgba(255,255,255,.08);',
      '  display: flex; align-items: center; gap: 18px; flex-wrap: wrap;',
      '">',
      '  <button id="acBackBtn" style="',
      '    width: 42px; height: 42px; flex: 0 0 42px;',
      '    display: grid; place-items: center;',
      '    background: rgba(255,255,255,.08);',
      '    border: 1.5px solid rgba(255,255,255,.14);',
      '    border-radius: 12px; color: #fff; font-size: 18px;',
      '    cursor: pointer; font-family: inherit; transition: all .18s ease;',
      '  " onmouseover="this.style.background=\'rgba(255,255,255,.15)\'"',
      '     onmouseout="this.style.background=\'rgba(255,255,255,.08)\'">←</button>',
      '  <div style="flex: 1; min-width: 0;">',
      '    <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #818cf8; margin-bottom: 4px;">ADMIN PANEL · MONITORING</div>',
      '    <div style="font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -.3px;">📊 Kandidat Aktif &amp; Selesai</div>',
      '  </div>',
      '  <div id="acStats" style="display: flex; gap: 10px; flex-wrap: wrap;"></div>',
      '</div>',

      '<div id="acContent" class="ac-scroll" style="flex: 1; overflow-y: auto; padding: 24px 28px 40px;">',
      '  <div style="display: flex; align-items: center; justify-content: center; padding: 60px 20px; color: #64748b; font-size: 14px; flex-direction: column; gap: 14px;">',
      '    <div style="width: 40px; height: 40px; border: 3px solid rgba(255,255,255,.1); border-top-color: #6366f1; border-radius: 50%; animation: acSpin .8s linear infinite;"></div>',
      '    Memuat daftar kandidat...',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(overlay);
    document.getElementById('acBackBtn').onclick = closeActiveCandidatesPage;

    // Attach listener real-time
    if (typeof window.listenActiveSessions === 'function') {
      window.listenActiveSessions(function(sessions) {
        renderListContent(sessions);
      });
    } else {
      document.getElementById('acContent').innerHTML =
        '<div style="text-align:center;padding:40px;color:#f87171;">❌ Modul monitoring tidak tersedia</div>';
    }
  }

  function closeActiveCandidatesPage() {
    if (typeof window.stopListeningActiveSessions === 'function') {
      try { window.stopListeningActiveSessions(); } catch(e) {}
    }
    var overlay = document.getElementById('activeCandidatesPageOverlay');
    if (overlay) overlay.remove();

    // Balik ke panel admin, hidupkan ulang counter
    if (typeof window.listenActiveSessions === 'function') {
      window.listenActiveSessions(function(sessions) {
        var countEl = document.getElementById('adminActiveCount');
        if (countEl) {
          countEl.textContent = sessions.length + ' kandidat';
          countEl.style.color = sessions.length > 0 ? '#1e40af' : '#94a3b8';
        }
      });
    }
  }

  function renderListContent(sessions) {
    var content = document.getElementById('acContent');
    var stats = document.getElementById('acStats');
    if (!content) return;

    if (!Array.isArray(sessions)) sessions = [];

    // Stats di header
    if (stats) {
      var activeCount = sessions.filter(function(s) {
        return s.inTestView && !s.finished && !s.disqualified;
      }).length;
      var finishedCount = sessions.filter(function(s) { return s.finished === true; }).length;
      var disqCount = sessions.filter(function(s) { return s.disqualified === true; }).length;

      stats.innerHTML = [
        '<div style="padding: 8px 14px; border-radius: 10px; background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.3); font-size: 12px; font-weight: 800; color: #86efac;">🟢 ' + activeCount + ' aktif</div>',
        '<div style="padding: 8px 14px; border-radius: 10px; background: rgba(148,163,184,.12); border: 1px solid rgba(148,163,184,.3); font-size: 12px; font-weight: 800; color: #cbd5e1;">✅ ' + finishedCount + ' selesai</div>',
        '<div style="padding: 8px 14px; border-radius: 10px; background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.3); font-size: 12px; font-weight: 800; color: #fca5a5;">⚠️ ' + disqCount + ' diskualifikasi</div>'
      ].join('');
    }

    if (sessions.length === 0) {
      content.innerHTML = [
        '<div style="display: flex; align-items: center; justify-content: center; padding: 80px 20px; color: #64748b; font-size: 14px; flex-direction: column; gap: 12px; text-align: center;">',
        '  <div style="font-size: 52px; opacity: .5;">🌙</div>',
        '  <div style="font-weight: 700; color: #94a3b8;">Belum ada kandidat yang aktif</div>',
        '</div>'
      ].join('');
      return;
    }

    var escapeFn = (typeof window.__adminEscape === 'function') ? window.__adminEscape : esc;

    var cardsHTML = sessions.map(function(s) {
      var safeName = String(s.name || '(tanpa nama)');
      var isFinished = s.finished === true;
      var isDisq = s.disqualified === true;
      var isActive = s.inTestView === true && !isFinished && !isDisq;

      var statusColor, statusLabel, statusBg;
      if (isDisq)         { statusColor = '#fca5a5'; statusLabel = '⚠️ Diskualifikasi'; statusBg = 'rgba(239,68,68,.15)'; }
      else if (isFinished){ statusColor = '#cbd5e1'; statusLabel = '✅ Selesai'; statusBg = 'rgba(148,163,184,.15)'; }
      else if (isActive)  { statusColor = '#86efac'; statusLabel = '🟢 Mengerjakan'; statusBg = 'rgba(34,197,94,.15)'; }
      else                { statusColor = '#fcd34d'; statusLabel = '🟡 Idle'; statusBg = 'rgba(245,158,11,.15)'; }

      var pal = getAvatarColors(safeName);
      var initial = getInitials(safeName);
      var ago = s.lastSeen ? Math.round((Date.now() - s.lastSeen) / 1000) : null;
      var agoStr = timeAgo(ago);
      var completedCount = s.completedCount || 0;
      var totalTests = s.totalTests || 0;
      var pct = totalTests ? Math.round((completedCount / totalTests) * 100) : 0;

      var chatBtnHTML = (isFinished || isDisq) ? '' :
        '<button class="ac-chat-btn" data-device-id="' + s.deviceId + '" data-name="' + esc(safeName) + '" style="' +
        'padding: 4px 10px; background: linear-gradient(135deg, #3b82f6, #1e40af);' +
        'border: 0; color: #fff; font-size: 10px; font-weight: 800;' +
        'border-radius: 7px; cursor: pointer; font-family: inherit;' +
        '">💬 Chat</button>';

      return [
        '<div class="ac-candidate-card" data-device-id="' + s.deviceId + '" style="',
        '  padding: 16px;',
        '  background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));',
        '  border: 1px solid rgba(255,255,255,.08);',
        '  border-radius: 16px; cursor: pointer;',
        '  transition: all .2s ease;',
        '" onmouseover="this.style.transform=\'translateY(-3px)\';this.style.borderColor=\'rgba(99,102,241,.4)\';this.style.boxShadow=\'0 12px 32px rgba(0,0,0,.3)\';"',
        '   onmouseout="this.style.transform=\'translateY(0)\';this.style.borderColor=\'rgba(255,255,255,.08)\';this.style.boxShadow=\'none\';">',

        '  <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">',
        '    <div style="',
        '      width: 46px; height: 46px; flex: 0 0 46px;',
        '      display: grid; place-items: center;',
        '      background: linear-gradient(135deg, ' + pal[0] + ', ' + pal[1] + ');',
        '      border-radius: 13px; font-size: 16px; font-weight: 900; color: #fff;',
        '      box-shadow: 0 6px 14px ' + pal[0] + '44;',
        '    ">' + initial + '</div>',
        '    <div style="flex: 1; min-width: 0;">',
        '      <div style="font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 4px; word-break: break-word;">' + escapeFn(safeName) + '</div>',
        '      <div style="font-size: 11px; color: #94a3b8;">',
        (s.position ? '💼 ' + escapeFn(s.position) : (s.ip ? '🌐 ' + escapeFn(s.ip) : '📱 ' + s.deviceId.slice(-8))),
        '      </div>',
        '    </div>',
        '    <div style="padding: 4px 10px; border-radius: 999px; background: ' + statusBg + '; color: ' + statusColor + '; font-size: 10px; font-weight: 800; white-space: nowrap;">' + statusLabel + '</div>',
        '  </div>',

        '  <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.06); margin-bottom: 10px;">',
        '    <div style="font-size: 11px; color: #cbd5e1;">📝 <b style="color: #93c5fd;">' + (s.currentTest || '—') + '</b></div>',
        '    <div style="font-size: 11px; color: #94a3b8;">✅ ' + completedCount + '/' + totalTests + ' tes</div>',
        '  </div>',

        '  <div style="margin-bottom: 10px;">',
        '    <div style="height: 5px; border-radius: 999px; overflow: hidden; background: rgba(255,255,255,.06);">',
        '      <div style="width: ' + pct + '%; height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: inherit;"></div>',
        '    </div>',
        '  </div>',

        '  <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">',
        '    <div style="font-size: 10px; color: #64748b;">👁 ' + agoStr + '</div>',
        '    <div style="display: flex; gap: 6px; align-items: center;">',
        '      <span style="padding: 4px 10px; background: rgba(99,102,241,.15); border: 1px solid rgba(99,102,241,.3); color: #a5b4fc; font-size: 10px; font-weight: 800; border-radius: 7px;">🔍 Detail →</span>',
        chatBtnHTML,
        '    </div>',
        '  </div>',

        '</div>'
      ].join('');
    }).join('');

    content.innerHTML =
      '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px;">' +
        cardsHTML +
      '</div>';
  }

  /* ============================================================
     HALAMAN DETAIL KANDIDAT
     ============================================================ */
  function openCandidateDetailPage(deviceId) {
    if (!deviceId) { alert('Device ID tidak valid'); return; }

    var old = document.getElementById('candidateDetailOverlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'candidateDetailOverlay';
    overlay.style.cssText = [
      'position: fixed', 'inset: 0', 'z-index: 100000',
      'background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      'display: flex', 'flex-direction: column',
      'font-family: Inter, system-ui, sans-serif',
      'color: #e2e8f0', 'overflow: hidden'
    ].join(';');

    overlay.innerHTML = [
      '<style>',
      '  @keyframes cdSpin { to { transform: rotate(360deg); } }',
      '  .cd-btn { padding:10px 16px;border-radius:10px;border:0;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all .18s; }',
      '  .cd-btn:hover { transform: translateY(-1px); }',
      '  .cd-btn-primary { background:linear-gradient(135deg,#3b82f6,#1e40af); color:#fff; }',
      '  .cd-btn-success { background:linear-gradient(135deg,#16a34a,#059669); color:#fff; }',
      '  .cd-btn-warning { background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; }',
      '  .cd-btn-danger  { background:linear-gradient(135deg,#dc2626,#991b1b); color:#fff; }',
      '  .cd-btn-ghost   { background:rgba(255,255,255,.06); color:#cbd5e1; border:1.5px solid rgba(255,255,255,.12); }',
      '  .cd-btn-ghost:hover { background:rgba(255,255,255,.1); color:#fff; }',
      '  .cd-scroll::-webkit-scrollbar { width: 8px; }',
      '  .cd-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 4px; }',
      '</style>',

      '<div style="padding:20px 28px;background:linear-gradient(180deg,rgba(0,0,0,.25),transparent);border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:18px;flex-wrap:wrap;">',
      '  <button id="cdBackBtn" class="cd-btn cd-btn-ghost" style="width:44px;height:44px;padding:0;justify-content:center;font-size:18px;">←</button>',
      '  <div style="flex:1;min-width:0;">',
      '    <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#818cf8;margin-bottom:4px;">ADMIN · DETAIL KANDIDAT</div>',
      '    <div id="cdHeaderName" style="font-size:22px;font-weight:900;color:#fff;">Memuat...</div>',
      '  </div>',
      '  <div id="cdHeaderBadge"></div>',
      '</div>',

      '<div id="cdContent" class="cd-scroll" style="flex:1;overflow-y:auto;padding:24px 28px 40px;">',
      '  <div style="display:flex;align-items:center;justify-content:center;padding:80px 20px;color:#64748b;font-size:14px;flex-direction:column;gap:14px;">',
      '    <div style="width:40px;height:40px;border:3px solid rgba(255,255,255,.1);border-top-color:#6366f1;border-radius:50%;animation:cdSpin .8s linear infinite;"></div>',
      '    Memuat data kandidat...',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(overlay);
    document.getElementById('cdBackBtn').onclick = closeCandidateDetailPage;

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      document.getElementById('cdContent').innerHTML =
        '<div style="color:#f87171;text-align:center;padding:40px;">❌ Firebase belum siap</div>';
      return;
    }

    if (__detailRef && __detailCb) {
      try { __detailRef.off('value', __detailCb); } catch(e) {}
    }

    __detailRef = firebase.database().ref('sgs_state/sessions/' + deviceId);
    __detailCb = function(snap) {
      renderDetailContent(deviceId, snap.val() || {});
    };
    __detailRef.on('value', __detailCb);
  }

  function closeCandidateDetailPage() {
    if (__detailRef && __detailCb) {
      try { __detailRef.off('value', __detailCb); } catch(e) {}
    }
    __detailRef = null;
    __detailCb = null;
    var overlay = document.getElementById('candidateDetailOverlay');
    if (overlay) overlay.remove();
  }

  function renderDetailContent(deviceId, s) {
    var headerName = document.getElementById('cdHeaderName');
    var headerBadge = document.getElementById('cdHeaderBadge');
    var content = document.getElementById('cdContent');
    if (!content) return;

    var safeName = s.name || '(tanpa nama)';
    if (headerName) headerName.textContent = safeName;

    var isFinished = s.finished === true;
    var isDisq = s.disqualified === true;
    var isActive = s.inTestView === true && !isFinished && !isDisq;

    var statusColor, statusLabel, statusDot;
    if (isDisq)         { statusColor = '#dc2626'; statusLabel = 'Diskualifikasi'; statusDot = '⚠️'; }
    else if (isFinished){ statusColor = '#94a3b8'; statusLabel = 'Selesai'; statusDot = '✅'; }
    else if (isActive)  { statusColor = '#22c55e'; statusLabel = 'Mengerjakan'; statusDot = '🟢'; }
    else                { statusColor = '#f59e0b'; statusLabel = 'Idle'; statusDot = '🟡'; }

    if (headerBadge) {
      headerBadge.innerHTML = '<div style="padding:8px 14px;border-radius:10px;background:' + statusColor + '22;border:1.5px solid ' + statusColor + '55;color:' + statusColor + ';font-size:12px;font-weight:800;">' + statusDot + ' ' + statusLabel + '</div>';
    }

    var ago = s.lastSeen ? Math.round((Date.now() - s.lastSeen) / 1000) : null;
    var agoStr = timeAgo(ago);
    var startedAgo = s.startedAt ? Math.round((Date.now() - s.startedAt) / 1000) : null;
    var startedStr = startedAgo === null ? '-' :
                     startedAgo < 60 ? startedAgo + 's' :
                     startedAgo < 3600 ? Math.floor(startedAgo / 60) + 'm' :
                     Math.floor(startedAgo / 3600) + 'j ' + Math.floor((startedAgo % 3600) / 60) + 'm';

    var pal = getAvatarColors(safeName);
    var initial = getInitials(safeName);
    var timeLeftStr = s.timeLeft != null ? fmtTime(s.timeLeft) : '-';
    var pct = Math.max(0, Math.min(100, s.progressPercent || 0));

    var subInfo = '';
    if (s.currentTest === 'IST' && s.currentSubtest != null && s.testTotalSubtests) {
      subInfo = 'Subtes ' + ((s.currentSubtest || 0) + 1) + '/' + s.testTotalSubtests;
    } else if (s.currentTest === 'KRAEPLIN' && s.currentColumn != null && s.testTotalColumns) {
      subInfo = 'Kolom ' + ((s.currentColumn || 0) + 1) + '/' + s.testTotalColumns;
    }

    var completedCount = s.completedCount || 0;
    var totalTests = s.totalTests || 0;
    var progressTestPct = totalTests ? Math.round((completedCount / totalTests) * 100) : 0;

    var testNames = ['IST', 'KRAEPLIN', 'DISC', 'PAPI', 'BIGFIVE', 'GRAFIS', 'EXCEL', 'TYPING', 'SUBJECT'];
    var testLabels = {
      IST: 'Kecerdasan', KRAEPLIN: 'Koran', DISC: 'Kepemimpinan',
      PAPI: 'Sikap Kerja', BIGFIVE: 'Kepribadian', GRAFIS: 'Gambar',
      EXCEL: 'Excel', TYPING: 'Mengetik', SUBJECT: 'Subjek'
    };
    var completed = s.completed || {};

    var timelineHTML = testNames.map(function(t) {
      var isDone = completed[t] === true;
      var isCurrent = s.currentTest === t;
      var style, icon;
      if (isDone) { style = 'background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.25);'; icon = '✅'; }
      else if (isCurrent) { style = 'background:rgba(59,130,246,.12);border-color:rgba(59,130,246,.4);'; icon = '🟢'; }
      else { style = 'background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.06);'; icon = '⚪'; }

      var color = isCurrent ? '#93c5fd' : (isDone ? '#86efac' : '#64748b');
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid transparent;' + style + '">' +
        '<span style="font-size:14px;">' + icon + '</span>' +
        '<span style="font-weight:700;font-size:12px;color:' + color + ';">' + testLabels[t] + '</span>' +
        (isCurrent && subInfo ? '<span style="margin-left:auto;font-size:10px;font-weight:800;padding:3px 8px;border-radius:6px;background:rgba(59,130,246,.2);color:#93c5fd;">' + subInfo + '</span>' : '') +
        '</div>';
    }).join('');

    function statCard(icon, label, value, sub, color) {
      return '<div style="padding:14px 16px;background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:14px;">' +
        '<div style="display:flex;align-items:center;gap:8px;font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;"><span style="font-size:14px;">' + icon + '</span> ' + label + '</div>' +
        '<div style="font-size:20px;font-weight:900;color:' + color + ';margin-bottom:3px;">' + value + '</div>' +
        '<div style="font-size:10.5px;color:#64748b;font-weight:600;">' + sub + '</div>' +
        '</div>';
    }

    var html = '';

    // Profile
    html += '<div style="display:flex;align-items:flex-start;gap:18px;padding:22px;background:linear-gradient(135deg,rgba(255,255,255,.05),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:18px;margin-bottom:20px;">' +
      '<div style="width:72px;height:72px;flex:0 0 72px;display:grid;place-items:center;background:linear-gradient(135deg,' + pal[0] + ',' + pal[1] + ');border-radius:20px;font-size:26px;font-weight:900;color:#fff;box-shadow:0 10px 24px ' + pal[0] + '55;">' + initial + '</div>' +
      '<div style="flex:1;min-width:0;">' +
      '  <div style="font-size:20px;font-weight:900;color:#fff;margin-bottom:6px;word-break:break-word;">' + esc(safeName) + '</div>' +
      '  <div style="color:#94a3b8;font-size:13px;line-height:1.7;">' +
      (s.position ? '💼 ' + esc(s.position) + '<br>' : '') +
      (s.ip ? '🌐 IP: <code style="background:rgba(255,255,255,.06);padding:2px 6px;border-radius:4px;font-size:12px;color:#93c5fd;">' + esc(s.ip) + '</code><br>' : '') +
      '    📱 ID: <code style="background:rgba(255,255,255,.06);padding:2px 6px;border-radius:4px;font-size:12px;color:#cbd5e1;">' + esc(deviceId.slice(-12)) + '</code>' +
      '  </div>' +
      '</div></div>';

    // Stats
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:20px;">' +
      statCard('📊', 'Progress Tes', completedCount + '/' + totalTests, progressTestPct + '%', '#3b82f6') +
      statCard('⏱', 'Timer Sekarang', timeLeftStr, s.currentTest || '—', '#f59e0b') +
      statCard('🕐', 'Durasi Sesi', startedStr, 'Sejak mulai', '#8b5cf6') +
      statCard('👁', 'Aktivitas', agoStr, 'Terakhir', '#10b981') +
      '</div>';

    // Current test progress
    if (s.currentTest) {
      html += '<div style="padding:18px 20px;background:linear-gradient(135deg,rgba(59,130,246,.1),rgba(139,92,246,.06));border:1px solid rgba(59,130,246,.25);border-radius:16px;margin-bottom:20px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">' +
        '  <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#93c5fd;text-transform:uppercase;">🎯 Sedang Mengerjakan</div>' +
        '  <div style="font-size:12px;font-weight:800;padding:4px 10px;border-radius:999px;background:rgba(59,130,246,.2);color:#93c5fd;">' + s.currentTest + (subInfo ? ' · ' + subInfo : '') + '</div>' +
        '</div>' +
        '<div style="font-size:15px;font-weight:700;color:#e2e8f0;margin-bottom:10px;">' + (s.questionLabel ? 'Soal ' + esc(s.questionLabel) : 'Sedang berjalan…') + '</div>' +
        '<div style="height:10px;background:rgba(255,255,255,.06);border-radius:999px;overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#3b82f6,#8b5cf6,#06b6d4);border-radius:inherit;box-shadow:0 0 12px rgba(59,130,246,.5);"></div></div>' +
        '<div style="text-align:right;margin-top:6px;font-size:11px;color:#64748b;font-weight:700;">' + pct + '%</div>' +
        '</div>';
    }

    // Timeline
    html += '<div style="padding:20px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:16px;margin-bottom:20px;">' +
      '<div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#818cf8;margin-bottom:14px;">📋 DAFTAR TES</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' + timelineHTML + '</div></div>';

    // Actions
    html += '<div style="padding:20px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:16px;margin-bottom:20px;">' +
      '<div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#818cf8;margin-bottom:14px;">⚡ AKSI CEPAT</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      '<button class="cd-btn cd-btn-primary" data-cd-action="chat" data-device-id="' + deviceId + '" data-name="' + esc(safeName) + '">💬 Buka Chat</button>' +
      '<button class="cd-btn cd-btn-success" data-cd-action="allow-retake" data-device-id="' + deviceId + '" data-name="' + esc(safeName) + '">✅ Izinkan Tes Lagi</button>' +
      '<button class="cd-btn cd-btn-warning" data-cd-action="force-refresh" data-device-id="' + deviceId + '">🔄 Force Refresh</button>' +
      '<button class="cd-btn cd-btn-danger" data-cd-action="disqualify" data-device-id="' + deviceId + '" data-name="' + esc(safeName) + '">⚠️ Diskualifikasi</button>' +
      '<button class="cd-btn cd-btn-danger" data-cd-action="force-logout" data-device-id="' + deviceId + '" data-name="' + esc(safeName) + '">🚪 Force Logout</button>' +
      '</div></div>';

    // Danger zone
    html += '<div style="padding:20px;background:rgba(239,68,68,.04);border:1px solid rgba(239,68,68,.2);border-radius:16px;">' +
      '<div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#fca5a5;margin-bottom:14px;">🚨 ZONA BAHAYA</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      '<button class="cd-btn cd-btn-ghost" style="color:#fca5a5;border-color:rgba(239,68,68,.3);" data-cd-action="reset-progress" data-device-id="' + deviceId + '" data-name="' + esc(safeName) + '">🗑️ Reset Semua Progres</button>' +
      '<button class="cd-btn cd-btn-ghost" style="color:#fca5a5;border-color:rgba(239,68,68,.3);" data-cd-action="delete-session" data-device-id="' + deviceId + '" data-name="' + esc(safeName) + '">❌ Hapus Sesi Ini</button>' +
      '</div></div>';

    content.innerHTML = html;
  }

  /* ============================================================
     ACTIONS
     ============================================================ */
  function handleAction(action, deviceId, name) {
    if (action === 'chat') {
      closeCandidateDetailPage();
      if (typeof window.openChatForAdmin === 'function') {
        window.openChatForAdmin(deviceId, name);
      }
      return;
    }

    if (action === 'allow-retake') {
      if (typeof window.adminAllowRetake === 'function') {
        window.adminAllowRetake(deviceId, name);
      } else {
        alert('Fungsi adminAllowRetake tidak tersedia');
      }
      return;
    }

    if (action === 'force-refresh') {
      if (!confirm('Force refresh device kandidat?\n\nHalaman kandidat akan dimuat ulang.')) return;
      if (typeof firebase === 'undefined' || !firebase.apps.length) return;
      firebase.database().ref('sgs_state/sessions/' + deviceId).update({
        force_refresh: Date.now()
      }).then(function() { toast('✅ Sinyal refresh terkirim'); })
        .catch(function(e) { alert('Gagal: ' + e.message); });
      return;
    }

    if (action === 'disqualify') {
      if (!confirm('Diskualifikasi "' + name + '"?\n\nDevice akan dikunci.')) return;
      if (typeof firebase === 'undefined' || !firebase.apps.length) return;
      firebase.database().ref('sgs_state/sessions/' + deviceId).update({
        disqualified: true,
        disqualified_at: firebase.database.ServerValue.TIMESTAMP,
        disqualified_by: 'admin',
        finished: true
      }).then(function() { toast('⚠️ Kandidat didiskualifikasi', '#dc2626'); })
        .catch(function(e) { alert('Gagal: ' + e.message); });
      return;
    }

    if (action === 'force-logout') {
      if (!confirm('Force logout "' + name + '"?')) return;
      if (typeof firebase === 'undefined' || !firebase.apps.length) return;
      firebase.database().ref('sgs_state/sessions/' + deviceId).update({
        force_logout: Date.now(),
        force_logout_at: firebase.database.ServerValue.TIMESTAMP
      }).then(function() { toast('🚪 Sinyal logout terkirim', '#dc2626'); })
        .catch(function(e) { alert('Gagal: ' + e.message); });
      return;
    }

    if (action === 'reset-progress') {
      if (!confirm('⚠️ Reset SEMUA progres "' + name + '"?\n\nSemua jawaban akan dihapus!')) return;
      if (!confirm('Yakin? Tidak bisa dibatalkan.')) return;
      if (typeof firebase === 'undefined' || !firebase.apps.length) return;
      firebase.database().ref('sgs_state/sessions/' + deviceId).update({
        reset_progress: Date.now(),
        completed: null,
        currentTest: null,
        currentSubtest: null,
        currentQuestion: null,
        currentColumn: null,
        reset_at: firebase.database.ServerValue.TIMESTAMP,
        reset_by: 'admin'
      }).then(function() { toast('🗑️ Progres di-reset', '#f59e0b'); })
        .catch(function(e) { alert('Gagal: ' + e.message); });
      return;
    }

    if (action === 'delete-session') {
      if (!confirm('❌ Hapus sesi "' + name + '"?')) return;
      if (typeof firebase === 'undefined' || !firebase.apps.length) return;
      firebase.database().ref('sgs_state/sessions/' + deviceId).remove()
        .then(function() {
          toast('✅ Sesi dihapus', '#dc2626');
          closeCandidateDetailPage();
        })
        .catch(function(e) { alert('Gagal: ' + e.message); });
      return;
    }
  }

  /* ============================================================
     EVENT DELEGATION (CSP-safe)
     ============================================================ */
  function attachEventDelegation() {
    if (__listenerAttached) return;
    __listenerAttached = true;

    document.addEventListener('click', function(e) {
      // 1. Tombol chat di halaman daftar
      var chatBtn = e.target.closest('.ac-chat-btn');
      if (chatBtn) {
        e.stopPropagation();
        e.preventDefault();
        var deviceId1 = chatBtn.getAttribute('data-device-id');
        var name1 = chatBtn.getAttribute('data-name');
        if (deviceId1 && typeof window.openChatForAdmin === 'function') {
          window.openChatForAdmin(deviceId1, name1);
        }
        return;
      }

      // 2. Card kandidat di halaman daftar → buka detail
      var card = e.target.closest('.ac-candidate-card');
      if (card) {
        var deviceId2 = card.getAttribute('data-device-id');
        if (deviceId2) openCandidateDetailPage(deviceId2);
        return;
      }

      // 3. Tombol aksi di halaman detail
      var actionBtn = e.target.closest('[data-cd-action]');
      if (actionBtn) {
        e.preventDefault();
        var action = actionBtn.getAttribute('data-cd-action');
        var deviceId3 = actionBtn.getAttribute('data-device-id');
        var name3 = actionBtn.getAttribute('data-name');
        handleAction(action, deviceId3, name3);
        return;
      }
    }, true);

    console.log('[ADMIN-CANDIDATE] ✓ Event delegation attached');
  }

  /* ============================================================
     EXPORT KE WINDOW
     ============================================================ */
  window.openActiveCandidatesPage = openActiveCandidatesPage;
  window.closeActiveCandidatesPage = closeActiveCandidatesPage;
  window.openCandidateDetailPage = openCandidateDetailPage;
  window.closeCandidateDetailPage = closeCandidateDetailPage;

  /* ============================================================
     INIT
     ============================================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(attachEventDelegation, 200);
    });
  } else {
    setTimeout(attachEventDelegation, 200);
  }

  console.log('[ADMIN-CANDIDATE] ✓ Loaded — daftar + detail + event delegation');
})();
