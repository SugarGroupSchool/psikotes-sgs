/* ============================================================
   js/00h-chat-notify.js
   - Notifikasi chat global (sound + title + toast + browser)
   - Kandidat: pesan dari admin
   - Admin: pesan dari kandidat
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
      }
      var ctx = __notifyAudioCtx;
      if (ctx.state === 'suspended') ctx.resume();
      var now = ctx.currentTime;
      [880, 1175, 1480].forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        var g   = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        var t = now + i * 0.10;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.32);
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
     BROWSER NOTIFICATION (opsional)
     ============================================================ */
  function requestBrowserPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch(e) {}
    }
  }

  function showBrowserNotif(title, body, onClick) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return;
    try {
      var n = new Notification(title, {
        body: body,
        icon: 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png',
        tag: 'sgs-chat',
        renotify: true
      });
      n.onclick = function() {
        try { window.focus(); } catch(e) {}
        if (typeof onClick === 'function') onClick();
        n.close();
      };
      setTimeout(function() { try { n.close(); } catch(e) {} }, 6000);
    } catch(e) {}
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

    showBrowserNotif(senderName, bodyText, function() {
      if (isAdmin) {
        if (typeof window.openChatForAdmin === 'function') {
          window.openChatForAdmin(opts.roomId, opts.name);
        }
      } else {
        if (typeof window.openChatForCandidate === 'function') {
          window.openChatForCandidate();
        }
      }
    });
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function getDeviceId() {
    if (typeof window.getOrCreateDeviceId === 'function') {
      return window.getOrCreateDeviceId();
    }
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

      if (typeof window.countUnreadFor === 'function') {
        window.countUnreadFor('candidate', deviceId, function(n) {
          var badge = document.getElementById('chatFabBadge');
          if (!badge) return;
          if (n > 0) {
            badge.textContent = n > 99 ? '99+' : n;
            badge.style.display = 'grid';
            badge.classList.add('chat-badge-blink');
          }
        });
      }
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

        // Ambil nama kandidat dari session
        try {
          if (typeof firebase !== 'undefined' && firebase.apps.length) {
            firebase.database().ref('sgs_state/sessions/' + deviceId + '/name').once('value')
              .then(function(nameSnap) {
                var n = nameSnap.val();
                notifyNewMessage({
                  role: 'admin',
                  roomId: deviceId,
                  name: n || name,
                  text: m.text || '',
                  unreadCount: unread
                });
              })
              .catch(function() {
                notifyNewMessage({
                  role: 'admin',
                  roomId: deviceId,
                  name: name,
                  text: m.text || '',
                  unreadCount: unread
                });
              });
            return;
          }
        } catch(e) {}

        notifyNewMessage({
          role: 'admin',
          roomId: deviceId,
          name: name,
          text: m.text || '',
          unreadCount: unread
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
    requestBrowserPermission();

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      setTimeout(init, 500);
      return;
    }

    if (isAdminMode()) {
      startAdminListener();
    } else {
      startCandidateListener();
    }

    console.log('[CHAT-NOTIFY] ✓ Ready — mode:', isAdminMode() ? 'admin' : 'candidate');
  }

  window.__sgsNotifyChat = notifyNewMessage;
  window.__sgsStopTitleBlink = stopTitleBlink;
  window.__sgsPlayNotifySound = playNotifySound;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 800); });
  } else {
    setTimeout(init, 800);
  }

  console.log('[CHAT-NOTIFY] ✓ Loaded');
})();
