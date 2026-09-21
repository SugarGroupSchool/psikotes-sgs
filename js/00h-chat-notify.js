/* ============================================================
   js/00h-chat-notify.js
   - Notifikasi chat global (SOUND + TITLE BLINK + TOAST)
   - TIDAK pakai browser notification (tanpa permission popup)
   - FAB chat di admin: kelap-kelip saat ada unread
   ============================================================ */

(function() {
  'use strict';

  var TITLE_BLINK_INTERVAL = null;
  var ORIGINAL_TITLE = document.title || 'Psikotes Sugar Group Schools';
  var __lastSeenChatTs = {};

  /* ============================================================
     SOUND — soft bell 3 nada
     ============================================================ */
  var __notifyAudioCtx = null;
  function playNotifySound() {
    try {
      if (!__notifyAudioCtx) {
        __notifyAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // Expose ke window supaya bisa di-resume oleh unlock helper
        window.__notifyAudioCtx = __notifyAudioCtx;
      }
      var ctx = __notifyAudioCtx;

      // ✅ Kalau suspended, coba resume — kalau gagal, skip silent
      if (ctx.state === 'suspended') {
        ctx.resume().catch(function() {});
        // Cek lagi — kalau masih suspended, jangan lanjut (hindari warning)
        if (ctx.state === 'suspended') return;
      }

      var now = ctx.currentTime;
      [880, 1175, 1480].forEach(function(freq, i) {
        // ... sisanya sama
      });
    } catch(e) {}
  }

  /* ============================================================
     TAB TITLE BLINK
     ============================================================ */
  function startTitleBlink(count, label) {
    stopTitleBlink();
    var toggle = false;
    var text = label || 'Pesan baru';
    var display = '(' + count + ') ' + text + ' — ' + ORIGINAL_TITLE;
    TITLE_BLINK_INTERVAL = setInterval(function() {
      document.title = toggle ? display : ORIGINAL_TITLE;
      toggle = !toggle;
    }, 1200);
    document.title = display;
  }

  function stopTitleBlink() {
    if (TITLE_BLINK_INTERVAL) {
      clearInterval(TITLE_BLINK_INTERVAL);
      TITLE_BLINK_INTERVAL = null;
    }
    document.title = ORIGINAL_TITLE;
  }

  /* ============================================================
     TOAST (in-page, kanan atas)
     ============================================================ */
  function showChatToast(opts) {
    var container = document.getElementById('sgsChatToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'sgsChatToastContainer';
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:2147483646;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:340px;';
      document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    toast.style.cssText = 'pointer-events:auto;background:linear-gradient(135deg,#ffffff,#f8fafc);border:1px solid #dbeafe;border-radius:14px;padding:14px 16px;box-shadow:0 12px 32px rgba(15,23,42,.15),0 4px 12px rgba(15,23,42,.06);cursor:pointer;display:flex;gap:12px;align-items:flex-start;animation:sgsToastIn .3s cubic-bezier(.2,.8,.2,1);font-family:Inter,system-ui,-apple-system,sans-serif;';

    toast.innerHTML = [
      '<div style="width:40px;height:40px;flex:0 0 40px;display:grid;place-items:center;background:linear-gradient(135deg,#3b82f6,#1e40af);border-radius:12px;font-size:18px;color:#fff;box-shadow:0 6px 14px rgba(59,130,246,.25);">' + (opts.icon || '💬') + '</div>',
      '<div style="flex:1;min-width:0;">',
      '  <div style="font-size:13px;font-weight:800;color:#1e293b;margin-bottom:3px;">' + (opts.title || 'Pesan baru') + '</div>',
      '  <div style="font-size:12px;color:#64748b;line-height:1.4;word-break:break-word;">' + (opts.body || '') + '</div>',
      '</div>'
    ].join('');

    toast.onclick = function() {
      try { toast.remove(); } catch(e) {}
      if (typeof opts.onClick === 'function') opts.onClick();
    };

    container.appendChild(toast);

    setTimeout(function() {
      if (toast.parentElement) {
        toast.style.transition = 'opacity .3s ease, transform .3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(function() { try { toast.remove(); } catch(e) {} }, 350);
      }
    }, opts.duration || 5000);

    if (!document.getElementById('sgsToastAnimStyle')) {
      var st = document.createElement('style');
      st.id = 'sgsToastAnimStyle';
      st.textContent = '@keyframes sgsToastIn { from { opacity:0; transform: translateX(20px) scale(.95); } to { opacity:1; transform: translateX(0) scale(1); } }';
      document.head.appendChild(st);
    }
  }

  /* ============================================================
     FAB CHAT ADMIN (kelap-kelip saat unread)
     ============================================================ */
  function injectAdminChatFab() {
    if (!isAdminMode()) return;
    if (document.getElementById('adminChatFab')) return;

    var fab = document.createElement('button');
    fab.id = 'adminChatFab';
    fab.title = 'Pesan Kandidat';
    fab.innerHTML = [
      '<span style="font-size:24px;line-height:1;">💬</span>',
      '<span id="adminChatFabBadge" style="',
        'position:absolute;top:-4px;right:-4px;',
        'min-width:20px;height:20px;padding:0 6px;',
        'background:#ef4444;color:#fff;font-size:11px;',
        'border-radius:999px;font-weight:800;',
        'display:none;place-items:center;',
        'box-shadow:0 0 0 3px #fff;',
        'font-family:system-ui,sans-serif;',
      '"></span>'
    ].join('');
    fab.style.cssText = [
      'position:fixed;bottom:22px;right:22px;',
      'width:58px;height:58px;',
      'border-radius:50%;',
      'background:linear-gradient(135deg,#3b82f6,#1e40af);',
      'color:#fff;',
      'border:0;cursor:pointer;',
      'box-shadow:0 12px 28px rgba(30,64,175,.4);',
      'z-index:99999;',
      'transition:transform .18s ease;',
      'font-family:inherit;',
      'display:grid;place-items:center;'
    ].join('');
    fab.onmouseenter = function() { fab.style.transform = 'scale(1.08)'; };
    fab.onmouseleave = function() { fab.style.transform = 'scale(1)'; };
    fab.onclick = function() {
      if (typeof window.openActiveCandidatesPage === 'function') {
        window.openActiveCandidatesPage();
      }
    };
    document.body.appendChild(fab);

    if (!document.getElementById('adminChatFabStyle')) {
      var st = document.createElement('style');
      st.id = 'adminChatFabStyle';
      st.textContent = [
        '@keyframes adminChatFabBlink {',
        '  0%, 100% { box-shadow: 0 12px 28px rgba(30,64,175,.4), 0 0 0 0 rgba(239,68,68,.7); }',
        '  50%      { box-shadow: 0 12px 28px rgba(30,64,175,.4), 0 0 0 16px rgba(239,68,68,0); }',
        '}',
        '@keyframes adminChatBadgeBlink {',
        '  0%, 100% { transform: scale(1); opacity: 1; }',
        '  50%      { transform: scale(1.25); opacity: .85; }',
        '}',
        '.admin-chat-fab-blink { animation: adminChatFabBlink 1.5s ease-in-out infinite !important; }',
        '.admin-chat-badge-blink { animation: adminChatBadgeBlink 1s ease-in-out infinite !important; }'
      ].join('\n');
      document.head.appendChild(st);
    }
  }

  function updateAdminChatFab() {
    var fab = document.getElementById('adminChatFab');
    var badge = document.getElementById('adminChatFabBadge');
    if (!fab || !badge) return;

    var unreadMap = window.__adminUnreadMap || {};
    var total = 0;
    Object.keys(unreadMap).forEach(function(k) {
      var n = Number(unreadMap[k]) || 0;
      if (n > 0) total += n;
    });

    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : total;
      badge.style.display = 'grid';
      badge.classList.add('admin-chat-badge-blink');
      fab.classList.add('admin-chat-fab-blink');
    } else {
      badge.style.display = 'none';
      badge.classList.remove('admin-chat-badge-blink');
      fab.classList.remove('admin-chat-fab-blink');
    }
  }

  /* ============================================================
     NOTIFY MAIN
     ============================================================ */
  function notifyNewMessage(opts) {
    var isAdmin = opts.role === 'admin';
    playNotifySound();

    var label = isAdmin ? 'Chat kandidat' : 'Chat admin';
    startTitleBlink(opts.unreadCount || 1, label);

    var senderName = opts.name || (isAdmin ? 'Kandidat' : 'Admin');
    var bodyText = (opts.text || '').slice(0, 80);

    showChatToast({
      icon: isAdmin ? '👤' : '🎧',
      title: senderName,
      body: bodyText || 'Mengirim gambar',
      duration: 6000,
      onClick: function() {
        if (isAdmin) {
          if (typeof window.openChatForAdmin === 'function') {
            window.openChatForAdmin(opts.roomId, opts.name);
          }
        } else {
          if (typeof window.openChatForCandidate === 'function') {
            window.openChatForCandidate();
          }
        }
      }
    });

    if (isAdmin) {
      setTimeout(updateAdminChatFab, 100);
    }
  }

  /* ============================================================
     HELPERS
     ============================================================ */
function getDeviceId() {
  // 🔒 I2 FIX: Delegasi ke sumber tunggal (00e-presence.js)
  if (typeof window.getOrCreateDeviceId === 'function') {
    return window.getOrCreateDeviceId();
  }
  // Fallback darurat
  try { return localStorage.getItem('_sgs_device_id') || ''; } catch(e) { return ''; }
}
  function isAdminMode() {
    return typeof window.isAdminUrl === 'function' && window.isAdminUrl();
  }

  /* ============================================================
     LISTENER — KANDIDAT
     ============================================================ */
  function startCandidateListener() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    var deviceId = getDeviceId();
    if (!deviceId) return;

    var roomRef = firebase.database().ref('sgs_state/chats/' + deviceId + '/messages');
    var initialized = false;

    roomRef.limitToLast(1).on('child_added', function(snap) {
      var m = snap.val();
      if (!m) return;

      if (!initialized) {
        initialized = true;
        __lastSeenChatTs[deviceId] = m.ts || m.clientTs || 0;
        return;
      }

      if (m.from !== 'admin') return;
      if (m.read) return;
      if (document.getElementById('chatWindowOverlay')) return;

      var ts = m.ts || m.clientTs || 0;
      if (ts <= (__lastSeenChatTs[deviceId] || 0)) return;
      __lastSeenChatTs[deviceId] = ts;

      notifyNewMessage({
        role: 'candidate',
        roomId: deviceId,
        name: 'Admin',
        text: m.text || '',
        unreadCount: 1
      });
    });

    console.log('[CHAT-NOTIFY] ✓ Candidate listener active —', deviceId);
  }

  /* ============================================================
     LISTENER — ADMIN
     ============================================================ */
  function startAdminListener() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    var chatsRef = firebase.database().ref('sgs_state/chats');
    var initializedRooms = {};

    chatsRef.on('child_added', function(roomSnap) {
      var deviceId = roomSnap.key;
      var msgsRef = roomSnap.ref.child('messages');

      msgsRef.limitToLast(1).on('child_added', function(snap) {
        var m = snap.val();
        if (!m) return;

        if (!initializedRooms[deviceId]) {
          initializedRooms[deviceId] = true;
          __lastSeenChatTs[deviceId] = m.ts || m.clientTs || 0;
          return;
        }

        if (m.from !== 'candidate') return;
        if (m.read) return;
        if (document.getElementById('chatWindowOverlay')) return;

        var ts = m.ts || m.clientTs || 0;
        if (ts <= (__lastSeenChatTs[deviceId] || 0)) return;
        __lastSeenChatTs[deviceId] = ts;

        var name = deviceId.slice(-8);
        var unread = 1;
        if (window.__adminUnreadMap && window.__adminUnreadMap[deviceId]) {
          unread = window.__adminUnreadMap[deviceId];
        }

        try {
          firebase.database().ref('sgs_state/sessions/' + deviceId + '/name').once('value')
            .then(function(nameSnap) {
              var n = nameSnap.val();
              notifyNewMessage({
                role: 'admin', roomId: deviceId,
                name: n || name, text: m.text || '', unreadCount: unread
              });
            })
            .catch(function() {
              notifyNewMessage({
                role: 'admin', roomId: deviceId,
                name: name, text: m.text || '', unreadCount: unread
              });
            });
          return;
        } catch(e) {}

        notifyNewMessage({
          role: 'admin', roomId: deviceId,
          name: name, text: m.text || '', unreadCount: unread
        });
      });
    });

    console.log('[CHAT-NOTIFY] ✓ Admin listener active');
  }

  /* ============================================================
     STOP BLINK ON FOCUS
     ============================================================ */
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') stopTitleBlink();
  });
  window.addEventListener('focus', stopTitleBlink);

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      setTimeout(init, 500);
      return;
    }

    if (isAdminMode()) {
      injectAdminChatFab();
      startAdminListener();
      setInterval(updateAdminChatFab, 800);
    } else {
      startCandidateListener();
    }

    console.log('[CHAT-NOTIFY] ✓ Ready — mode:', isAdminMode() ? 'admin' : 'candidate');
  }

  window.__sgsNotifyChat = notifyNewMessage;
  window.__sgsStopTitleBlink = stopTitleBlink;
  window.__sgsPlayNotifySound = playNotifySound;
  window.__sgsUpdateAdminChatFab = updateAdminChatFab;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 800); });
  } else {
    setTimeout(init, 800);
  }

  console.log('[CHAT-NOTIFY] ✓ Loaded');
})();
