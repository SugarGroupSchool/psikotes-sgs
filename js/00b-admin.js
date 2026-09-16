/* ============================================================
   js/00b-admin.js
   - Admin panel: LOCK kontrol + 2 password (Fresh & Used)
   - Login gate: butuh password untuk akses panel
   - Monitoring kandidat aktif (real-time) + timer + progress
   - Chat per kandidat + unread tracker (badge + blink)
   - Tombol "Izinkan Tes Lagi" untuk device finished/diskualifikasi
   - Auto-cleanup chat device tidak aktif
   ============================================================ */

/* ============================================================
   KONFIGURASI LOGIN ADMIN
   ============================================================ */
// Password admin sekarang via Firebase Auth (tidak ada di source code)
const ADMIN_SESSION_KEY     = '_sgs_admin_logged_in';
/* ============================================================
   KONFIGURASI GAS (Google Apps Script) UNTUK PDF
   ============================================================ */
const GAS_ADMIN_URL = 'https://script.google.com/macros/s/AKfycbxCryXLdQXXbB2k6qxkmbZJF-L2ltL-QgTUygKLFAg0UNVm3NfKHDgso9nB-NomM4en/exec';
/* ============================================================
   KONFIGURASI AUTO-CLEANUP CHAT
   ============================================================ */
const CHAT_CLEANUP_ENABLED        = true;
const CHAT_CLEANUP_AGE_MS         = 60 * 60 * 1000;  // 1 jam
const CHAT_CLEANUP_DELETE_SESSION = true;

/* ============================================================
   ADMIN UNREAD TRACKER (global per device)
   ============================================================ */
window.__adminUnreadMap = {};
window.__adminLastSessions = [];

let __adminUnreadRefs = [];
let __adminRefreshTimer = null;

function startAdminUnreadTracker() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;

  // Skip kalau sudah jalan
  if (__adminUnreadRefs.length > 0) {
    console.log('[ADMIN] 👂 Unread tracker sudah jalan, skip restart');
    return;
  }

  const chatsRef = firebase.database().ref('sgs_state/chats');

  const onRoomAdded = (roomSnap) => {
    const deviceId = roomSnap.key;
    const queryRef = roomSnap.ref.child('messages')
      .orderByChild('from').equalTo('candidate');

    const onMsgsChange = (snap) => {
      let count = 0;
      snap.forEach(ch => { if (!ch.val()?.read) count++; });
      window.__adminUnreadMap[deviceId] = count;
      scheduleAdminRefresh();
    };

    queryRef.on('value', onMsgsChange);
    __adminUnreadRefs.push({ ref: queryRef, cb: onMsgsChange, type: 'value' });
  };

  chatsRef.on('child_added', onRoomAdded);
  __adminUnreadRefs.push({ ref: chatsRef, cb: onRoomAdded, type: 'child_added' });

  console.log('[ADMIN] 👂 Unread tracker started');
}

function stopAdminUnreadTracker() {
  __adminUnreadRefs.forEach(({ ref, cb, type }) => {
    try {
      if (type === 'child_added') ref.off('child_added', cb);
      else ref.off('value', cb);
    } catch (e) {}
  });
  __adminUnreadRefs = [];
  console.log('[ADMIN] 🔇 Unread tracker stopped');
}

function scheduleAdminRefresh() {
  clearTimeout(__adminRefreshTimer);
  __adminRefreshTimer = setTimeout(() => {
    const container = document.getElementById('adminActiveSessions');
    if (!container) return;
    if (window.__adminLastSessions) {
      container.innerHTML = renderActiveSessionsHTML(window.__adminLastSessions);
    }
  }, 200);
}

/* ============================================================
   ADMIN TIMER TICK — update timer countdown tiap detik di DOM
   ============================================================ */
let __adminTimerTickInterval = null;

function startAdminTimerTick() {
  if (__adminTimerTickInterval) clearInterval(__adminTimerTickInterval);

  __adminTimerTickInterval = setInterval(() => {
    const timers = document.querySelectorAll('[data-timer-id]');
    const now = Date.now();

    timers.forEach(el => {
      const timeLeftInit = parseInt(el.dataset.timeLeft || '0', 10);
      const lastUpdate = parseInt(el.dataset.lastUpdate || '0', 10);
      const elapsed = Math.floor((now - lastUpdate) / 1000);
      const remaining = Math.max(0, timeLeftInit - elapsed);

      const textEl = el.querySelector('.timer-text');
      if (textEl) {
        textEl.textContent = __formatTimeAdmin(remaining);
      }

      // Warna merah kalau ≤ 30 detik
      if (remaining <= 30) {
        el.style.background = '#fee2e2';
        el.style.color = '#991b1b';
      } else {
        el.style.background = '#dbeafe';
        el.style.color = '#1e40af';
      }

      if (remaining <= 0) {
        if (textEl) textEl.textContent = '00:00';
      }
    });
  }, 1000);
}

function stopAdminTimerTick() {
  if (__adminTimerTickInterval) {
    clearInterval(__adminTimerTickInterval);
    __adminTimerTickInterval = null;
  }
}

/* Helper format waktu MM:SS */
function __formatTimeAdmin(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec2 = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec2}`;
}

/* ============================================================
   STORAGE HELPERS
   ============================================================ */
function getLockState() {
  return localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LOCK_ALL) === '1';
}

function setLockState(locked) {
  try {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.LOCK_ALL, locked ? '1' : '0');
  } catch (e) {}
}

function getFreshPwd() {
  return localStorage.getItem(APP_CONFIG.STORAGE_KEYS.PWD_FRESH) || APP_CONFIG.DEFAULT_FRESH_PWD;
}

function getUsedPwd() {
  return localStorage.getItem(APP_CONFIG.STORAGE_KEYS.PWD_USED) || APP_CONFIG.DEFAULT_USED_PWD;
}

function setFreshPwd(pwd) {
  try { localStorage.setItem(APP_CONFIG.STORAGE_KEYS.PWD_FRESH, pwd); } catch (e) {}
}

function setUsedPwd(pwd) {
  try { localStorage.setItem(APP_CONFIG.STORAGE_KEYS.PWD_USED, pwd); } catch (e) {}
}

/* ============================================================
   DETEKSI URL ADMIN
   ============================================================ */
function isAdminUrl() {
  try {
    const url = new URL(window.location.href);
    const key = APP_CONFIG.ADMIN_KEY;
    return (
      url.searchParams.get('admin') === key ||
      url.hash === '#' + key
    );
  } catch (e) {
    return false;
  }
}

/* ============================================================
   TOGGLE LOCK
   ============================================================ */
function toggleLockState() {
  const cb = document.getElementById('adminLockCheckbox');
  if (!cb) return;
  const locked = cb.checked;
  setLockState(locked);
  console.log('[ADMIN] Lock state:', locked ? 'LOCKED' : 'UNLOCKED');
  renderAdminPanel();
}

/* ============================================================
   COPY KE CLIPBOARD
   ============================================================ */
function copyToClipboard(text, btnEl) {
  if (!text) return;
  const done = () => {
    if (!btnEl) return;
    const prev = btnEl.textContent;
    btnEl.textContent = '✓';
    setTimeout(() => { btnEl.textContent = prev; }, 1200);
  };
  try {
    navigator.clipboard.writeText(text).then(done).catch(() => {
      fallbackCopy(text); done();
    });
  } catch (e) {
    fallbackCopy(text); done();
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
}

/* ============================================================
   HTML ESCAPE
   ============================================================ */
function __adminEscape(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ============================================================
   REGENERATE PASSWORDS
   ============================================================ */
function regenFreshPwd() {
  if (!confirm('Generate password FRESH baru? Password lama hangus.')) return;
  const newPwd = APP_CONFIG.generateRandomPassword('SGS-F-');
  setFreshPwd(newPwd);
  console.log('[ADMIN] Fresh pwd baru:', newPwd);
  renderAdminPanel();
}

function regenUsedPwd() {
  if (!confirm('Generate password USED baru? Password lama hangus.')) return;
  const newPwd = APP_CONFIG.generateRandomPassword('SGS-U-');
  setUsedPwd(newPwd);
  console.log('[ADMIN] Used pwd baru:', newPwd);
  renderAdminPanel();
}

/* ============================================================
   SET PASSWORD MANUAL
   ============================================================ */
function setFreshPwdManual() {
  const input = document.getElementById('adminFreshInput');
  if (!input) return;
  const val = (input.value || '').trim();
  if (val.length < 6) {
    alert('Password minimal 6 karakter');
    return;
  }
  if (!confirm('Set password FRESH ke: "' + val + '"? Password lama hangus.')) return;
  setFreshPwd(val);
  alert('✅ Password FRESH diganti');
  renderAdminPanel();
}

function setUsedPwdManual() {
  const input = document.getElementById('adminUsedInput');
  if (!input) return;
  const val = (input.value || '').trim();
  if (val.length < 6) {
    alert('Password minimal 6 karakter');
    return;
  }
  if (!confirm('Set password USED ke: "' + val + '"? Password lama hangus.')) return;
  setUsedPwd(val);
  alert('✅ Password USED diganti');
  renderAdminPanel();
}

/* ============================================================
   RESET / UNLOCK DEVICE
   ============================================================ */
function adminResetThisDevice() {
  if (!confirm('Reset state device ini? (identity, completed, selectedTests, usedPragas)')) return;
  try {
    localStorage.removeItem('identity');
    localStorage.removeItem('completed');
    localStorage.removeItem('selectedTests');
    localStorage.removeItem('usedPragas');
    alert('✅ Device di-reset');
    renderAdminPanel();
  } catch (e) {
    alert('❌ ' + e.message);
  }
}

function adminUnlockDevice() {
  if (!confirm('Unlock device ini? (bisa login lagi setelah selesai)')) return;
  try {
    localStorage.removeItem('_sgs_finished');
    alert('✅ Device di-unlock');
    renderAdminPanel();
  } catch (e) {
    alert('❌ ' + e.message);
  }
}

/* ============================================================
   IZINKAN TES LAGI (untuk device tertentu)
   ============================================================ */
function adminAllowRetake(deviceId, candidateName) {
  const name = candidateName || 'kandidat';

  const ok = confirm(
    'Izinkan "' + name + '" untuk mengerjakan tes lagi?\n\n' +
    '• Device akan di-reset (hapus history tes)\n' +
    '• Kandidat harus login ulang dengan password dari admin\n' +
    '• Semua hasil tes sebelumnya tetap ada di Firebase\n\n' +
    'Lanjutkan?'
  );
  if (!ok) return;

  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    alert('❌ Firebase belum siap');
    return;
  }

  const ref = firebase.database().ref('sgs_state/sessions/' + deviceId);
  ref.update({
    allow_retake: true,
    allow_retake_at: firebase.database.ServerValue.TIMESTAMP,
    allow_retake_by: 'admin',
    finished: false,
    disqualified: false
  })
  .then(() => {
    console.log('[ADMIN] ✅ allow_retake=true untuk:', deviceId);

    alert(
      '✅ Sinyal terkirim ke device "' + name + '".\n\n' +
      'Kandidat akan otomatis logout & bisa tes lagi dalam beberapa detik.\n\n' +
      '(Jika device kandidat sedang offline, sinyal akan diproses saat online.)'
    );

    setTimeout(() => renderAdminPanel(), 500);
  })
  .catch(e => {
    console.error('[ADMIN] ❌ Gagal allow_retake:', e);
    alert('❌ Gagal kirim sinyal: ' + e.message);
  });
}

/* ============================================================
   AUTO-CLEANUP CHAT UNTUK DEVICE TIDAK AKTIF
   ============================================================ */
async function cleanupInactiveChatRooms(options = {}) {
  const {
    silent = false,
    minAgeMs = CHAT_CLEANUP_AGE_MS,
    alsoDeleteSessions = CHAT_CLEANUP_DELETE_SESSION
  } = options;

  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    return { removed: 0, deviceIds: [] };
  }

  const now = Date.now();
  const myDeviceId = localStorage.getItem('_sgs_device_id');

  try {
    const sessionsSnap = await firebase.database().ref('sgs_state/sessions').once('value');
    const chatsSnap    = await firebase.database().ref('sgs_state/chats').once('value');

    const sessions = sessionsSnap.val() || {};
    const chats    = chatsSnap.val() || {};

    const toDelete = [];

    Object.keys(chats).forEach(deviceId => {
      if (deviceId === myDeviceId) return;

      const session = sessions[deviceId] || {};
      const lastSeen = session.lastSeen || 0;
      const status   = session.status;

      if (session.finished === true) return;

      if (status === 'active' && (now - lastSeen) < minAgeMs) return;

      if (status === 'offline' || (now - lastSeen) >= minAgeMs) {
        toDelete.push(deviceId);
      }
    });

    let removed = 0;
    for (const deviceId of toDelete) {
      try {
        await firebase.database().ref('sgs_state/chats/' + deviceId).remove();
        if (alsoDeleteSessions) {
          await firebase.database().ref('sgs_state/sessions/' + deviceId).remove();
        }
        removed++;
      } catch (e) {
        console.warn('[CLEANUP] Gagal hapus room:', deviceId, e);
      }
    }

    if (!silent) {
      console.log('[CLEANUP] 🧹 Removed', removed, 'chat rooms:', toDelete.map(d => d.slice(-8)).join(', '));
    }

    return { removed, deviceIds: toDelete };
  } catch (e) {
    console.error('[CLEANUP] Error:', e);
    return { removed: 0, deviceIds: [], error: e.message };
  }
}

async function adminCleanupInactive() {
  if (!confirm(
    'Bersihkan chat dari kandidat yang tidak aktif?\n\n' +
    '• Chat room device offline / tidak aktif > ' +
    Math.round(CHAT_CLEANUP_AGE_MS / 60000) + ' menit akan dihapus\n' +
    '• Device yang masih aktif tidak terpengaruh\n' +
    '• Device yang sudah selesai tes juga tidak terpengaruh\n\n' +
    'Lanjutkan?'
  )) return;

  const result = await cleanupInactiveChatRooms({ silent: false });

  if (result.removed === 0) {
    alert('✨ Tidak ada chat yang perlu dibersihkan.');
  } else {
    alert('✅ ' + result.removed + ' chat room berhasil dibersihkan.');
  }

  setTimeout(() => renderAdminPanel(), 300);
}
/* ============================================================
   AMBIL DAFTAR PDF DARI GOOGLE DRIVE (via GAS)
   ============================================================ */
async function fetchResultFiles() {
  try {
    const url = GAS_ADMIN_URL + '?action=list&_t=' + Date.now();
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      return data.files || [];
    }
    console.warn('[PDF-LIST] Gagal:', data.error);
    return [];
  } catch (e) {
    console.error('[PDF-LIST] Error:', e);
    return [];
  }
}

/* ============================================================
   HAPUS PDF DARI DRIVE
   ============================================================ */
async function deleteResultFile(fileId, fileName) {
  const name = fileName || 'file ini';
  if (!confirm('Hapus "' + name + '" dari Google Drive?\n\nFile akan dipindah ke Trash (bisa dipulihkan dalam 30 hari).')) return;

  try {
    const res = await fetch(GAS_ADMIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'delete', fileId: fileId })
    });

    const data = await res.json();
    if (data && data.success) {
      alert('✅ File berhasil dihapus dari Drive');
      // Refresh list
      if (typeof refreshResultFilesList === 'function') refreshResultFilesList();
    } else {
      alert('❌ Gagal hapus: ' + (data.error || 'Unknown error'));
    }
  } catch (e) {
    console.error('[DELETE-PDF] Error:', e);
    alert('❌ Gagal hapus: ' + e.message);
  }
}


/* ============================================================
   RENDER DAFTAR PDF DI PANEL ADMIN
   ============================================================ */
function renderResultFilesHTML(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return `
      <div style="
        padding: 20px 14px; text-align: center;
        color: #94a3b8; font-size: 12px;
        background: #fff; border-radius: 10px;
      ">
        📭 Belum ada PDF yang dikirim kandidat
      </div>`;
  }

  return files.map(f => {
    const sizeMB = f.size ? (f.size / 1024 / 1024).toFixed(2) + ' MB' : '-';
    const dateStr = f.date ? new Date(f.date).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }) : '-';

    // Parse description untuk dapat nama & posisi
    let name = '-', pos = '-';
    try {
      const lines = (f.description || '').split('\n');
      lines.forEach(l => {
        if (l.startsWith('Nama:')) name = l.replace('Nama:', '').trim();
        if (l.startsWith('Posisi:')) pos = l.replace('Posisi:', '').trim();
      });
    } catch (e) {}

    const safeFileName = String(f.name || '').replace(/'/g, "\\'");

    return `
      <div style="
        padding: 12px 14px; background: #fff;
        border: 1px solid #dbeafe; border-radius: 10px;
        font-size: 12px; line-height: 1.5;
      ">
        <div style="
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 8px; margin-bottom: 6px;
        ">
          <div style="font-weight: 800; color: #1e293b; min-width:0; word-break:break-word;">
            ${__adminEscape(name !== '-' ? name : f.name || '(tanpa nama)')}
          </div>
          <div style="
            font-size: 10px; color: #3b82f6;
            font-weight: 800; white-space: nowrap;
            background: #eff6ff; padding: 3px 8px; border-radius: 6px;
          ">${sizeMB}</div>
        </div>

        <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
          ${pos !== '-' ? `📍 ${__adminEscape(pos)} &nbsp;·&nbsp; ` : ''}
          🕐 ${dateStr}
        </div>

        <div style="
          display: flex; justify-content: space-between;
          align-items: center; gap: 8px; padding-top: 6px;
          border-top: 1px dashed #e2e8f0;
        ">
          <div style="color: #94a3b8; font-size: 10px; min-width:0; word-break:break-all;">
            ${__adminEscape((f.name || '').slice(0, 40))}${(f.name || '').length > 40 ? '...' : ''}
          </div>
          <div style="display: flex; gap: 5px;">
            <a href="${f.url}" target="_blank" rel="noopener"
               style="
              padding: 5px 10px;
              background: linear-gradient(135deg, #3b82f6, #1e40af);
              color: #fff; border: 0; border-radius: 7px;
              font-size: 11px; font-weight: 800;
              text-decoration: none; white-space: nowrap;
              box-shadow: 0 3px 8px rgba(59,130,246,.25);
            ">⬇️ Buka</a>

            <button onclick="deleteResultFile('${f.id}', '${safeFileName}')" style="
              padding: 5px 10px;
              background: #fff;
              color: #dc2626;
              border: 1.5px solid #fca5a5;
              border-radius: 7px;
              font-size: 11px; font-weight: 800;
              cursor: pointer; font-family: inherit;
              white-space: nowrap;
            ">🗑️ Hapus</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   REFRESH DAFTAR PDF DI PANEL
   ============================================================ */
async function refreshResultFilesList() {
  const container = document.getElementById('adminResultFiles');
  const countEl = document.getElementById('adminResultCount');

  if (!container) return;

  container.innerHTML = `
    <div style="padding: 20px 14px; text-align: center; color: #94a3b8; font-size: 12px;">
      ⏳ Memuat daftar PDF...
    </div>
  `;

  const files = await fetchResultFiles();

  if (countEl) {
    countEl.textContent = files.length + ' file';
    countEl.style.color = files.length > 0 ? '#1e40af' : '#94a3b8';
  }

  container.innerHTML = renderResultFilesHTML(files);
}
/* ============================================================
   ADMIN LOGIN PROMPT
   ============================================================ */
function renderAdminLoginPrompt() {
  const old = document.getElementById('adminLoginOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'adminLoginOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(10,20,35,0.95);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    font-family: Inter, system-ui, -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="
      width: min(420px, 100%);
      background: linear-gradient(180deg, #ffffff 0%, #f7fafd 100%);
      border-radius: 22px;
      box-shadow: 0 30px 90px rgba(0,0,0,.60);
      overflow: hidden;
    ">
      <div style="
        padding: 26px 28px 22px;
        background: linear-gradient(135deg, #1e3a8a, #3b82f6);
        color: #fff; text-align: center;
      ">
        <div style="
          width: 62px; height: 62px;
          margin: 0 auto 12px;
          display: grid; place-items: center;
          background: rgba(255,255,255,.15);
          border: 1px solid rgba(255,255,255,.3);
          border-radius: 18px; font-size: 28px;
        ">🔒</div>
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; opacity: .85;">
          ADMIN PANEL
        </div>
        <div style="font-size: 22px; font-weight: 900; margin-top: 6px;">
          Login Admin
        </div>
        <div style="font-size: 13px; opacity: .85; margin-top: 6px;">
          Masukkan email & password
        </div>
      </div>

      <div style="padding: 26px 28px 28px;">
        <input type="email" id="adminLoginEmail" placeholder="Email admin..."
          autocomplete="off"
          style="
            width: 100%; padding: 14px 16px;
            border: 2px solid #e2e8f0; border-radius: 12px;
            font-size: 15px; outline: none;
            font-family: inherit; background: #fff;
            box-sizing: border-box;
            transition: border-color .18s, box-shadow .18s;
            margin-bottom: 10px;
          ">
        <input type="password" id="adminLoginPassword" placeholder="Password..."
          autocomplete="off"
          style="
            width: 100%; padding: 14px 16px;
            border: 2px solid #e2e8f0; border-radius: 12px;
            font-size: 15px; outline: none;
            font-family: inherit; background: #fff;
            box-sizing: border-box;
            transition: border-color .18s, box-shadow .18s;
          ">
        <div id="adminLoginError" style="
          color: #dc2626; font-size: 13px;
          min-height: 20px; margin-top: 10px;
          text-align: center; font-weight: 600;
        "></div>
        <button id="adminLoginBtn" style="
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #1e3a8a, #3b82f6);
          color: #fff; border: 0; border-radius: 12px;
          font-size: 15px; font-weight: 800;
          cursor: pointer; font-family: inherit;
          margin-top: 6px;
          box-shadow: 0 10px 24px rgba(30,58,138,.24);
          transition: transform .18s, box-shadow .18s, filter .18s;
        ">🔓 Masuk</button>

        <div style="margin-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
          Akses hanya untuk administrator
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const emailEl = document.getElementById('adminLoginEmail');
  const pwdEl = document.getElementById('adminLoginPassword');
  const btn = document.getElementById('adminLoginBtn');
  const errorEl = document.getElementById('adminLoginError');

  [emailEl, pwdEl].forEach(el => {
    el.addEventListener('focus', () => {
      el.style.borderColor = '#3b82f6';
      el.style.boxShadow = '0 0 0 4px rgba(59,130,246,.12)';
    });
    el.addEventListener('blur', () => {
      el.style.borderColor = '#e2e8f0';
      el.style.boxShadow = 'none';
    });
  });

  const attemptLogin = async () => {
    const email = (emailEl.value || '').trim();
    const pwd = pwdEl.value || '';

    if (!email || !pwd) {
      errorEl.textContent = '⚠️ Isi email dan password';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Memeriksa...';
    errorEl.textContent = '';

    try {
      const cred = await firebase.auth().signInWithEmailAndPassword(email, pwd);
      const snap = await firebase.database().ref('admins/' + cred.user.uid).once('value');

      if (!snap.exists() || snap.val() !== true) {
        await firebase.auth().signOut();
        throw new Error('Akun ini bukan admin');
      }

   sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
errorEl.style.color = '#16a34a';
errorEl.textContent = '✅ Berhasil...';

setTimeout(() => {
  overlay.remove();
  renderAdminPanel();

  // Retry — pastikan listener Firebase sudah ready
  setTimeout(() => {
    if (typeof renderAdminPanel === 'function') {
      const container = document.getElementById('adminActiveSessions');
      if (container && container.textContent.includes('Memuat')) {
        renderAdminPanel();
      }
    }
  }, 1500);
}, 200);

    } catch (err) {
      console.error('[ADMIN] Login error:', err);

      let msg = err.message || 'Login gagal';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        msg = 'Email atau password salah';
      } else if (msg.includes('too-many-requests')) {
        msg = 'Terlalu banyak percobaan. Tunggu sebentar.';
      } else if (msg.includes('network')) {
        msg = 'Koneksi bermasalah. Coba lagi.';
      }

      errorEl.style.color = '#dc2626';
      errorEl.textContent = '❌ ' + msg;
      pwdEl.value = '';
      pwdEl.focus();
      btn.disabled = false;
      btn.textContent = '🔓 Masuk';
    }
  };

  btn.onclick = attemptLogin;
  emailEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); pwdEl.focus(); }
  });
  pwdEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); attemptLogin(); }
  });

  setTimeout(() => emailEl.focus(), 120);
}
/* ============================================================
   ADMIN LOGOUT
   ============================================================ */
function adminLogout() {
  if (!confirm('Keluar dari panel admin?')) return;
  try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch (e) {}
  try { firebase.auth().signOut(); } catch (e) {}

  if (typeof window.stopListeningActiveSessions === 'function') {
    try { window.stopListeningActiveSessions(); } catch (e) {}
  }
  if (typeof stopAdminUnreadTracker === 'function') {
    try { stopAdminUnreadTracker(); } catch (e) {}
  }
  if (typeof stopAdminTimerTick === 'function') {
    try { stopAdminTimerTick(); } catch (e) {}
  }

  const panel = document.getElementById('adminPanelOverlay');
     if (typeof stopListeningAccessRequests === 'function') {
    try { stopListeningAccessRequests(); } catch (e) {}
  }
  if (panel) panel.remove();
  const login = document.getElementById('adminLoginOverlay');
  if (login) login.remove();

  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    url.hash = '';
    window.history.replaceState({}, '', url.pathname + (url.search || ''));
  } catch (e) {}

  console.log('[ADMIN] Logged out');
}

/* ============================================================
   RENDER DAFTAR KANDIDAT AKTIF + FINISHED
   ============================================================ */
function renderActiveSessionsHTML(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return `
      <div style="
        padding: 14px; text-align: center;
        color: #94a3b8; font-size: 12px;
        background: #fff; border-radius: 10px;
      ">🌙 Belum ada kandidat yang aktif</div>`;
  }

  return sessions.map(s => {
    const ago = s.lastSeen ? Math.round((Date.now() - s.lastSeen) / 1000) : null;
    const agoStr = ago === null ? '-' :
                   ago < 60 ? `${ago}s lalu` :
                   ago < 3600 ? `${Math.floor(ago / 60)}m lalu` :
                   ago < 86400 ? `${Math.floor(ago / 3600)}j lalu` :
                   `${Math.floor(ago / 86400)}h lalu`;

    const testLabel = s.currentTest ? s.currentTest : '—';
    const progress = s.totalTests > 0
      ? `${s.completedCount}/${s.totalTests} tes`
      : '—';

    // Subtes label untuk IST
    const subLabel = s.currentTest === 'IST' && s.currentSubtest !== null && s.testTotalSubtests
      ? `Subtes ${(s.currentSubtest || 0) + 1}/${s.testTotalSubtests}`
      : '';

    // Status
    const isFinished = s.finished === true;
    const isDisqualified = s.disqualified === true;

    let statusColor, statusLabel;
    if (isDisqualified) {
      statusColor = '#dc2626';
      statusLabel = '⚠️ Diskualifikasi';
    } else if (isFinished) {
      statusColor = '#94a3b8';
      statusLabel = '✅ Selesai (Terkunci)';
    } else if (s.inTestView) {
      statusColor = '#16a34a';
      statusLabel = '🟢 Mengerjakan';
    } else {
      statusColor = '#f59e0b';
      statusLabel = '🟡 Idle';
    }

    const safeName = String(s.name || '(tanpa nama)')
      .replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    const deviceIdShort = s.deviceId.slice(-8);

       // Tombol "Izinkan Tes Lagi" dihapus dari sesi aktif
    // Akses retake hanya via section "Request Izin Akses"
    const allowRetakeBtn = '';

    const unreadCount = (window.__adminUnreadMap && window.__adminUnreadMap[s.deviceId]) || 0;
    const hasUnread = unreadCount > 0;

    // Tombol chat
    const chatBtn = (isFinished || isDisqualified) ? `
      <button disabled title="${isDisqualified ? 'Kandidat diskualifikasi' : 'Kandidat sudah selesai'}" style="
        padding: 5px 12px;
        background: #e2e8f0; color: #94a3b8;
        border: 0; border-radius: 7px;
        font-size: 11px; font-weight: 800;
        cursor: not-allowed; font-family: inherit;
        white-space: nowrap;
      ">💬 Chat</button>
    ` : `
      <button onclick="openChatForAdmin('${s.deviceId}', '${safeName}')"
              class="${hasUnread ? 'chat-btn-blink' : ''}"
              style="
        padding: 5px 12px;
        background: linear-gradient(135deg, #3b82f6, #1e40af);
        color: #fff; border: 0; border-radius: 7px;
        font-size: 11px; font-weight: 800;
        cursor: pointer; font-family: inherit;
        box-shadow: 0 3px 8px rgba(59,130,246,.25);
        white-space: nowrap;
      ">💬 ${hasUnread ? 'Chat (' + unreadCount + ')' : 'Chat'}</button>
    `;

    // Background
    const cardBg = isDisqualified
      ? 'linear-gradient(135deg, #fef2f2, #fee2e2)'
      : isFinished
      ? 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
      : '#fff';
    const cardBorder = isDisqualified ? '#fca5a5'
                     : isFinished ? '#cbd5e1'
                     : '#dbeafe';

    // ============================================================
    // TIMER & PROGRESS BAR (muncul hanya kalau sedang tes)
    // ============================================================
    let timerProgressHTML = '';

    if (!isFinished && !isDisqualified && s.inTestView && s.currentTest) {
      // Timer — hitung estimasi time left
      const hasTimer = s.timeLeft !== null && s.timeLeft !== undefined;
      const timeLeftInit = hasTimer ? s.timeLeft : 0;
      const lastSeenOffset = s.lastSeen ? Math.round((Date.now() - s.lastSeen) / 1000) : 0;
      const estimatedTimeLeft = Math.max(0, timeLeftInit - lastSeenOffset);

      const timerHTML = hasTimer ? `
        <div style="
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: 999px;
          background: ${estimatedTimeLeft <= 30 ? '#fee2e2' : '#dbeafe'};
          color: ${estimatedTimeLeft <= 30 ? '#991b1b' : '#1e40af'};
          font-size: 11px; font-weight: 800;
          font-family: 'Courier New', monospace;
        " data-timer-id="${s.deviceId}"
           data-time-left="${estimatedTimeLeft}"
           data-last-update="${Date.now()}">
          <span style="font-size: 12px;">⏱</span>
          <span class="timer-text">${__formatTimeAdmin(estimatedTimeLeft)}</span>
        </div>
      ` : '';

      // Progress bar
      const pct = Math.max(0, Math.min(100, s.progressPercent || 0));
      const progressHTML = `
        <div style="margin-top: 6px;">
          <div style="
            display: flex; justify-content: space-between;
            font-size: 10px; color: #64748b; margin-bottom: 3px;
          ">
            <span>${s.questionLabel || 'Progress'}${subLabel ? ' · ' + subLabel : ''}</span>
            <span>${pct}%</span>
          </div>
          <div style="
            height: 5px; border-radius: 999px; overflow: hidden;
            background: #e2e8f0;
          ">
            <div style="
              width: ${pct}%; height: 100%;
              background: linear-gradient(90deg, #3b82f6, #8b5cf6);
              border-radius: inherit;
              transition: width .35s ease;
            "></div>
          </div>
        </div>
      `;

      timerProgressHTML = `
        <div style="
          margin-top: 8px; padding-top: 8px;
          border-top: 1px solid #e2e8f0;
        ">
          <div style="
            display: flex; justify-content: space-between;
            align-items: center; gap: 8px; margin-bottom: 2px;
          ">
            <span style="
              font-size: 10px; font-weight: 800;
              color: #1e40af; text-transform: uppercase;
              letter-spacing: 0.5px;
            ">⏱ Sedang: ${testLabel}</span>
            ${timerHTML}
          </div>
          ${progressHTML}
        </div>
      `;
    }

    return `
      <div style="
        padding: 12px 14px; background: ${cardBg};
        border: 1px solid ${cardBorder}; border-radius: 10px;
        font-size: 12px; line-height: 1.5;
      ">
        <div style="
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 8px; margin-bottom: 6px;
        ">
          <div style="font-weight: 800; color: #1e293b; min-width:0;">
            ${__adminEscape(s.name || '(tanpa nama)')}
          </div>
          <div style="
            font-size: 10px; color: ${statusColor};
            font-weight: 800; white-space: nowrap;
          ">${statusLabel}</div>
        </div>

        <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
          ${s.position ? `📍 ${__adminEscape(s.position)} &nbsp;·&nbsp; ` : ''}
          📝 <b>${testLabel}</b> &nbsp;·&nbsp;
          ✅ ${progress}
        </div>
        ${(s.ip && !s.position) ? `
        <div style="color: #3b82f6; font-size: 11px; margin-bottom: 6px; font-family: 'Courier New', monospace;">
          🌐 IP: ${__adminEscape(s.ip)}
        </div>
        ` : ''}
        ${timerProgressHTML}

        <div style="
          display: flex; justify-content: space-between;
          align-items: center; gap: 8px; padding-top: 6px;
          border-top: 1px dashed #e2e8f0; flex-wrap: wrap;
          margin-top: 6px;
        ">
          <div style="color: #94a3b8; font-size: 10px;">
            ID: ${deviceIdShort} &nbsp;·&nbsp; 👁 ${agoStr}
          </div>
          <div style="display: flex; gap: 6px;">
            ${allowRetakeBtn}
            ${chatBtn}
          </div>
        </div>
      </div>
    `;
  }).join('');
}


/* ============================================================
   ACCORDION — Section collapsible di admin panel
   ============================================================ */
window.__adminSectionOpen = window.__adminSectionOpen || { active: false, result: false, request: false };

function toggleAdminSection(key) {
  window.__adminSectionOpen[key] = !window.__adminSectionOpen[key];
  const body = document.getElementById('adminSectionBody_' + key);
  const arrow = document.getElementById('adminSectionArrow_' + key);
  if (body) body.style.display = window.__adminSectionOpen[key] ? 'block' : 'none';
  if (arrow) arrow.textContent = window.__adminSectionOpen[key] ? '▼' : '▶';
}

/* ============================================================
   ACCESS REQUESTS — Kandidat minta izin akses
   ============================================================ */
let __adminRequestRef = null;
let __adminRequestCb = null;
window.__adminAccessRequests = [];

function listenAccessRequests(callback) {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    callback([]);
    return;
  }
  if (__adminRequestRef && __adminRequestCb) {
    try { __adminRequestRef.off('value', __adminRequestCb); } catch (e) {}
  }
  __adminRequestRef = firebase.database().ref('sgs_requests');
  __adminRequestCb = (snap) => {
    const data = snap.val() || {};
    const requests = Object.entries(data)
      .map(([deviceId, req]) => ({ deviceId, ...req }))
      .filter(r => r.status === 'pending')
      .sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
    window.__adminAccessRequests = requests;
    callback(requests);
  };
  __adminRequestRef.on('value', __adminRequestCb);
}

function stopListeningAccessRequests() {
  if (__adminRequestRef && __adminRequestCb) {
    try { __adminRequestRef.off('value', __adminRequestCb); } catch (e) {}
    __adminRequestRef = null;
    __adminRequestCb = null;
  }
}

function renderAccessRequestsHTML(requests) {
  if (!Array.isArray(requests) || requests.length === 0) {
    return `
      <div style="
        padding: 14px; text-align: center;
        color: #94a3b8; font-size: 12px;
        background: #fff; border-radius: 10px;
      ">📭 Belum ada request izin akses</div>`;
  }

  return requests.map(r => {
    const ago = r.requestedAt ? Math.round((Date.now() - r.requestedAt) / 1000) : null;
    const agoStr = ago === null ? '-' :
                   ago < 60 ? ago + 's lalu' :
                   ago < 3600 ? Math.floor(ago / 60) + 'm lalu' :
                   ago < 86400 ? Math.floor(ago / 3600) + 'j lalu' :
                   Math.floor(ago / 86400) + 'h lalu';

    const safeName = String(r.name || '(tanpa nama)')
      .replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    return `
      <div style="
        padding: 12px 14px; background: #fff;
        border: 1px solid #fde68a; border-radius: 10px;
        font-size: 12px; line-height: 1.5;
      ">
        <div style="
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 8px; margin-bottom: 6px;
        ">
          <div style="font-weight: 800; color: #1e293b; min-width:0;">
            ${__adminEscape(r.name || '(tanpa nama)')}
          </div>
          <div style="
            font-size: 10px; color: #92400e;
            font-weight: 800; white-space: nowrap;
            background: #fef3c7; padding: 3px 8px;
            border-radius: 999px;
          ">⏳ Menunggu</div>
        </div>

        <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">
          ${r.position ? '📍 ' + __adminEscape(r.position) + ' &nbsp;·&nbsp; ' : ''}
          🕐 ${agoStr}
        </div>

        <div style="
          display: flex; justify-content: space-between;
          align-items: center; gap: 8px;
          padding-top: 6px;
          border-top: 1px dashed #fde68a;
        ">
          <div style="color: #94a3b8; font-size: 10px;">
            ID: ${r.deviceId.slice(-8)}
          </div>
          <div style="display: flex; gap: 6px;">
            <button onclick="rejectAccessRequest('${r.deviceId}')" style="
              padding: 5px 12px;
              background: #fff; color: #dc2626;
              border: 1.5px solid #fca5a5; border-radius: 7px;
              font-size: 11px; font-weight: 800;
              cursor: pointer; font-family: inherit;
            ">✕ Tolak</button>
            <button onclick="approveAccessRequest('${r.deviceId}', '${safeName}')" style="
              padding: 5px 12px;
              background: linear-gradient(135deg, #16a34a, #059669);
              color: #fff; border: 0; border-radius: 7px;
              font-size: 11px; font-weight: 800;
              cursor: pointer; font-family: inherit;
              box-shadow: 0 3px 8px rgba(22,163,74,.25);
            ">✓ Setujui</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function approveAccessRequest(deviceId, name) {
  const n = name || 'kandidat';
  if (!confirm('Setujui izin akses untuk "' + n + '"?\n\n• Device akan di-reset (mulai dari nol)\n• Kandidat pakai password FRESH\n• Kandidat harus login ulang')) return;

  try {
    await firebase.database().ref('sgs_state/sessions/' + deviceId).update({
      allow_retake: true,
      allow_retake_at: firebase.database.ServerValue.TIMESTAMP,
      allow_retake_by: 'admin',
      finished: false,
      disqualified: false
    });
    await firebase.database().ref('sgs_requests/' + deviceId).update({
      status: 'approved',
      respondedAt: firebase.database.ServerValue.TIMESTAMP,
      respondedBy: 'admin'
    });
    alert('✅ Izin akses diberikan untuk "' + n + '".\n\nKandidat akan otomatis logout & bisa login dengan password FRESH.');
  } catch (e) {
    console.error('[ADMIN] Gagal approve:', e);
    alert('❌ Gagal: ' + e.message);
  }
}

async function rejectAccessRequest(deviceId) {
  if (!confirm('Tolak request izin ini?')) return;
  try {
    await firebase.database().ref('sgs_requests/' + deviceId).update({
      status: 'rejected',
      respondedAt: firebase.database.ServerValue.timestamp,
      respondedBy: 'admin'
    });
    alert('✅ Request ditolak.');
  } catch (e) {
    console.error('[ADMIN] Gagal reject:', e);
    alert('❌ Gagal: ' + e.message);
  }
}

/* ============================================================
   RENDER ADMIN PANEL
   ============================================================ */
function renderAdminPanel() {
  const old = document.getElementById('adminPanelOverlay');
  if (old) old.remove();

  const locked = getLockState();
  const freshPwd = getFreshPwd();
  const usedPwd = getUsedPwd();

  const deviceFinished = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DEVICE_FINISHED) === '1';
  const usedPragas = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USED_PRAGAS) === '1';

  let identityName = '(belum ada)';
  try {
    const raw = localStorage.getItem('identity');
    if (raw) {
      const id = JSON.parse(raw);
      identityName = id.name || '(kosong)';
    }
  } catch (e) {}

  let completedCount = 0;
  try {
    const raw = localStorage.getItem('completed');
    if (raw) {
      const c = JSON.parse(raw);
      completedCount = Object.values(c).filter(v => v === true).length;
    }
  } catch (e) {}

  const myDeviceId = localStorage.getItem('_sgs_device_id') || '';

  const overlay = document.createElement('div');
  overlay.id = 'adminPanelOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(10,20,35,0.90);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; overflow-y: auto;
  `;

  overlay.innerHTML = `
    <div style="
      width: min(720px, 100%);
      max-height: calc(100vh - 40px);
      overflow-y: auto;
      background: linear-gradient(180deg, #ffffff 0%, #f7fafd 100%);
      border-radius: 22px;
      box-shadow: 0 30px 90px rgba(0,0,0,.55);
      font-family: Inter, system-ui, -apple-system, sans-serif;
      color: #1a2332;
    ">
      <!-- HEADER -->
      <div style="
        padding: 24px 28px 20px;
        background: linear-gradient(135deg, ${locked ? '#7f1d1d' : '#1e3a8a'}, ${locked ? '#dc2626' : '#3b82f6'});
        border-radius: 22px 22px 0 0;
        color: #fff; position: relative;
      ">
        <div style="
          position: absolute; top: 16px; right: 16px;
          display: flex; gap: 6px;
        ">
          <button id="btnAdminLogout" title="Logout" style="
            height: 34px; padding: 0 12px;
            background: rgba(255,255,255,.15);
            border: 1px solid rgba(255,255,255,.3);
            border-radius: 9px; cursor: pointer;
            color: #fff; font-size: 12px; font-weight: 800;
            font-family: inherit;
          ">🚪 Logout</button>
          <button id="btnAdminClose" title="Tutup" style="
            width: 34px; height: 34px;
            background: rgba(255,255,255,.15);
            border: 1px solid rgba(255,255,255,.3);
            border-radius: 9px; cursor: pointer;
            color: #fff; font-size: 16px; font-weight: 700;
            font-family: inherit;
          ">✕</button>
        </div>
        <div style="font-size: 12px; font-weight: 800; letter-spacing: 2px; opacity: .85;">
          ADMIN PANEL
        </div>
        <div style="font-size: 24px; font-weight: 900; margin-top: 6px;">
          🔐 Login Control
        </div>
        <div style="font-size: 13px; opacity: .85; margin-top: 6px;">
          ${locked ? '🔒 SEMUA LOGIN DITOLAK' : '🔓 Kandidat bisa login'}
        </div>
      </div>

      <!-- BODY -->
      <div style="padding: 24px 28px 28px;">

        <!-- LOCK TOGGLE -->
        <div style="
          padding: 18px 20px;
          background: ${locked ? '#fef2f2' : '#f0fdf4'};
          border: 2px solid ${locked ? '#fca5a5' : '#86efac'};
          border-radius: 16px;
          margin-bottom: 22px;
        ">
          <label style="
            display: flex; align-items: center; gap: 12px;
            cursor: pointer; user-select: none;
          ">
            <input type="checkbox" id="adminLockCheckbox" ${locked ? 'checked' : ''}
                   onchange="toggleLockState()"
                   style="
                     width: 22px; height: 22px;
                     cursor: pointer;
                     accent-color: ${locked ? '#dc2626' : '#16a34a'};
                   ">
            <div>
              <div style="
                font-size: 16px; font-weight: 900;
                color: ${locked ? '#991b1b' : '#166534'};
              ">
                ${locked ? '🔒 LOCK AKTIF — semua login ditolak' : '🔓 UNLOCKED — kandidat bisa login'}
              </div>
              <div style="
                font-size: 12px; color: ${locked ? '#b91c1c' : '#15803d'};
                margin-top: 4px; line-height: 1.5;
              ">
                ${locked
                  ? 'Kandidat tidak bisa login dengan password apapun.'
                  : 'Centang untuk memblokir semua login kandidat.'}
              </div>
            </div>
          </label>
        </div>

        <!-- =========================================
             REQUEST IZIN AKSES (ACCORDION)
             ========================================= -->
        <div style="
          padding: 18px 20px;
          background: linear-gradient(135deg, #fef3c7, #fffbeb);
          border: 2px solid #fde68a;
          border-radius: 14px;
          margin-bottom: 16px;
        ">
          <div onclick="toggleAdminSection('request')" style="
            cursor: pointer; user-select: none;
            display: flex; align-items: center; justify-content: space-between;
            flex-wrap: wrap; gap: 8px;
          ">
            <div style="
              font-size: 14px; font-weight: 900; color: #92400e;
              display: flex; align-items: center; gap: 8px;
            ">
              <span id="adminSectionArrow_request" style="font-size: 11px; color: #92400e; width: 12px;">
                ${window.__adminSectionOpen.request ? '▼' : '▶'}
              </span>
              <span style="font-size: 16px;">📨</span>
              Request Izin Akses
            </div>
            <div id="adminRequestCount" style="
              font-size: 12px; font-weight: 800; color: #94a3b8;
              background: #fff; padding: 4px 10px; border-radius: 999px;
              border: 1px solid #fde68a;
            ">0 request</div>
          </div>

          <div id="adminSectionBody_request" style="
            display: ${window.__adminSectionOpen.request ? 'block' : 'none'};
            margin-top: 14px;
          ">
            <div id="adminAccessRequests" style="
              display: flex; flex-direction: column; gap: 8px;
              max-height: 400px; overflow-y: auto;
            ">
              <div style="
                padding: 14px; text-align: center;
                color: #94a3b8; font-size: 12px;
              ">⏳ Memuat...</div>
            </div>
          </div>
        </div>
        
         <!-- =========================================
             MONITORING KANDIDAT AKTIF (ACCORDION)
             ========================================= -->
        <div style="
          padding: 18px 20px;
          background: linear-gradient(135deg, #eff6ff, #f0f9ff);
          border: 2px solid #bfdbfe;
          border-radius: 14px;
          margin-bottom: 16px;
        ">
          <div onclick="toggleAdminSection('active')" style="
            cursor: pointer;
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
          ">
            <div style="
              font-size: 14px; font-weight: 900; color: #1e40af;
              display: flex; align-items: center; gap: 8px;
            ">
              <span id="adminSectionArrow_active" style="font-size: 11px; color: #1e40af; width: 12px;">
                ${window.__adminSectionOpen.active ? '▼' : '▶'}
              </span>
              <span style="
                width: 10px; height: 10px; border-radius: 50%;
                background: #22c55e;
                box-shadow: 0 0 0 4px rgba(34,197,94,.2);
                animation: adminPulseDot 1.4s ease-in-out infinite;
              "></span>
              Kandidat Aktif & Selesai
            </div>
            <div id="adminActiveCount" style="
              font-size: 12px; font-weight: 800; color: #94a3b8;
              background: #fff; padding: 4px 10px; border-radius: 999px;
              border: 1px solid #bfdbfe;
            ">0 kandidat</div>
          </div>

          <div id="adminSectionBody_active" style="
            display: ${window.__adminSectionOpen.active ? 'block' : 'none'};
            margin-top: 14px;
          ">
            <div id="adminActiveSessions" style="
              display: flex; flex-direction: column; gap: 8px;
              max-height: 400px; overflow-y: auto;
            ">
              <div style="
                padding: 14px; text-align: center;
                color: #94a3b8; font-size: 12px;
              ">⏳ Memuat data...</div>
            </div>
          </div>
        </div>

        <!-- =========================================
             HASIL TES TERKIRIM (ACCORDION)
             ========================================= -->
        <div style="
          padding: 18px 20px;
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          border: 2px solid #86efac;
          border-radius: 14px;
          margin-bottom: 16px;
        ">
          <div onclick="toggleAdminSection('result')" style="
            cursor: pointer;
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
          ">
            <div style="
              font-size: 14px; font-weight: 900; color: #15803d;
              display: flex; align-items: center; gap: 8px;
            ">
              <span id="adminSectionArrow_result" style="font-size: 11px; color: #15803d; width: 12px;">
                ${window.__adminSectionOpen.result ? '▼' : '▶'}
              </span>
              <span style="font-size: 16px;">📄</span>
              Hasil Tes Terkirim
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              <div id="adminResultCount" style="
                font-size: 12px; font-weight: 800; color: #94a3b8;
                background: #fff; padding: 4px 10px; border-radius: 999px;
                border: 1px solid #86efac;
              ">0 file</div>
              <button onclick="event.stopPropagation(); refreshResultFilesList();" style="
                padding: 5px 12px;
                background: linear-gradient(135deg, #16a34a, #059669);
                color: #fff; border: 0; border-radius: 8px;
                font-family: inherit; font-size: 11px; font-weight: 800;
                cursor: pointer;
                box-shadow: 0 3px 8px rgba(22,163,74,.25);
              ">🔄 Refresh</button>
            </div>
          </div>

          <div id="adminSectionBody_result" style="
            display: ${window.__adminSectionOpen.result ? 'block' : 'none'};
            margin-top: 14px;
          ">
            <div id="adminResultFiles" style="
              display: flex; flex-direction: column; gap: 8px;
              max-height: 400px; overflow-y: auto;
            ">
              <div style="
                padding: 20px 14px; text-align: center;
                color: #94a3b8; font-size: 12px;
              ">⏳ Memuat...</div>
            </div>
          </div>
        </div>

        <style>          @keyframes adminPulseDot {
            0%, 100% { transform: scale(1); opacity: 1; }
            50%      { transform: scale(1.35); opacity: .7; }
          }
        </style>

        ${locked ? `
          <!-- KALAU LOCKED -->
          <div style="
            padding: 24px 20px;
            background: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 14px;
            text-align: center;
            color: #64748b;
            font-size: 13px;
            line-height: 1.7;
            margin-bottom: 16px;
          ">
            <div style="font-size: 36px; margin-bottom: 10px;">🔒</div>
            <div style="font-weight: 800; color: #334155; margin-bottom: 6px;">
              Login sedang DIKUNCI
            </div>
            <div>Un-check kotak di atas untuk melihat & mengelola password.</div>
          </div>
        ` : `
          <!-- PASSWORD FRESH -->
          <div style="margin-bottom: 20px;">
            <div style="
              font-size: 11px; font-weight: 800; letter-spacing: 1.5px;
              color: #16a34a; margin-bottom: 8px;
              display: flex; align-items: center; gap: 8px;
            ">
              <span style="
                width: 8px; height: 8px; border-radius: 50%;
                background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,.15);
              "></span>
              PASSWORD FRESH — untuk kandidat baru
            </div>
            <div style="
              padding: 16px 20px;
              background: #f0fdf4;
              border: 2px solid #86efac;
              border-radius: 12px 12px 0 0;
              font-family: 'Courier New', monospace;
              font-size: 20px; font-weight: 900;
              color: #14532d; letter-spacing: 1.5px;
              text-align: center;
              word-break: break-all;
            ">${freshPwd}</div>
            <div style="
              display: flex; gap: 6px;
              background: #f0fdf4;
              border: 2px solid #86efac;
              border-top: 0;
              border-radius: 0 0 12px 12px;
              padding: 8px;
            ">
              <button onclick="copyToClipboard('${freshPwd}', this)" style="
                flex: 1; padding: 8px 12px;
                background: #16a34a; color: #fff;
                border: 0; border-radius: 8px;
                font-family: inherit; font-size: 12px; font-weight: 800;
                cursor: pointer;
              ">📋 Copy</button>
              <button onclick="regenFreshPwd()" style="
                flex: 1; padding: 8px 12px;
                background: #fff; color: #16a34a;
                border: 1px solid #86efac; border-radius: 8px;
                font-family: inherit; font-size: 12px; font-weight: 800;
                cursor: pointer;
              ">🔄 Random</button>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 8px;">
              <input type="text" id="adminFreshInput" placeholder="Atau ketik manual..." style="
                flex: 1; padding: 8px 12px;
                border: 1px solid #d1fae5; border-radius: 8px;
                font-family: inherit; font-size: 12px;
                outline: none;
              ">
              <button onclick="setFreshPwdManual()" style="
                padding: 8px 16px;
                background: #16a34a; color: #fff;
                border: 0; border-radius: 8px;
                font-family: inherit; font-size: 12px; font-weight: 800;
                cursor: pointer;
              ">Set</button>
            </div>
          </div>

          <!-- PASSWORD USED -->
          <div style="margin-bottom: 22px;">
            <div style="
              font-size: 11px; font-weight: 800; letter-spacing: 1.5px;
              color: #dc2626; margin-bottom: 8px;
              display: flex; align-items: center; gap: 8px;
            ">
              <span style="
                width: 8px; height: 8px; border-radius: 50%;
                background: #ef4444; box-shadow: 0 0 0 4px rgba(239,68,68,.15);
              "></span>
              PASSWORD USED — kandidat lanjut / resume
            </div>
            <div style="
              padding: 16px 20px;
              background: #fef2f2;
              border: 2px solid #fca5a5;
              border-radius: 12px 12px 0 0;
              font-family: 'Courier New', monospace;
              font-size: 20px; font-weight: 900;
              color: #7f1d1d; letter-spacing: 1.5px;
              text-align: center;
              word-break: break-all;
            ">${usedPwd}</div>
            <div style="
              display: flex; gap: 6px;
              background: #fef2f2;
              border: 2px solid #fca5a5;
              border-top: 0;
              border-radius: 0 0 12px 12px;
              padding: 8px;
            ">
              <button onclick="copyToClipboard('${usedPwd}', this)" style="
                flex: 1; padding: 8px 12px;
                background: #dc2626; color: #fff;
                border: 0; border-radius: 8px;
                font-family: inherit; font-size: 12px; font-weight: 800;
                cursor: pointer;
              ">📋 Copy</button>
              <button onclick="regenUsedPwd()" style="
                flex: 1; padding: 8px 12px;
                background: #fff; color: #dc2626;
                border: 1px solid #fca5a5; border-radius: 8px;
                font-family: inherit; font-size: 12px; font-weight: 800;
                cursor: pointer;
              ">🔄 Random</button>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 8px;">
              <input type="text" id="adminUsedInput" placeholder="Atau ketik manual..." style="
                flex: 1; padding: 8px 12px;
                border: 1px solid #fee2e2; border-radius: 8px;
                font-family: inherit; font-size: 12px;
                outline: none;
              ">
              <button onclick="setUsedPwdManual()" style="
                padding: 8px 16px;
                background: #dc2626; color: #fff;
                border: 0; border-radius: 8px;
                font-family: inherit; font-size: 12px; font-weight: 800;
                cursor: pointer;
              ">Set</button>
            </div>
          </div>

          <!-- PANDUAN -->
          <div style="
            padding: 14px 16px;
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 12px;
            font-size: 12px; color: #78350f;
            line-height: 1.7;
            margin-bottom: 20px;
          ">
            <b>Cara pakai:</b><br>
            • <b>FRESH</b> — kandidat baru (belum pernah tes)<br>
            • <b>USED</b> — kandidat lanjut/resume (koneksi putus, logout di tengah tes)<br>
            • <b>Selesai/Diskualifikasi</b> — tidak bisa login, pakai "🔓 Izinkan Tes Lagi"
          </div>
        `}

        <!-- INFO DEVICE -->
        <div style="
          padding: 16px 18px;
          background: #f1f5f9;
          border-radius: 12px;
          margin-bottom: 16px;
          font-size: 13px; color: #334155;
          line-height: 1.9;
        ">
          <div style="font-weight: 800; margin-bottom: 8px; color: #1e293b;">
            📱 Device ini
          </div>
          <div><strong>Nama:</strong> ${__adminEscape(identityName)}</div>
          <div><strong>Tes selesai:</strong> ${completedCount}</div>
          <div><strong>Used flag:</strong> ${usedPragas ? '✅ aktif (kandidat sudah logout)' : '❌ belum'}</div>
          <div><strong>Device finished:</strong> ${deviceFinished ? '🔒 ya (tidak bisa login)' : '🔓 belum'}</div>
        </div>

        <!-- TEST CHAT (Device Sendiri) -->
        ${myDeviceId ? `
        <div style="margin-bottom: 12px;">
          <button onclick="openChatForAdmin('${myDeviceId}', '${String(identityName).replace(/'/g, "\\'")}')" style="
            width: 100%;
            padding: 12px 16px;
            background: linear-gradient(135deg, #64748b, #334155);
            color: #fff; border: 0; border-radius: 10px;
            font-family: inherit; font-size: 13px; font-weight: 800;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(51,65,85,.28);
          ">🧪 Test Chat (Device Sendiri)</button>
        </div>
        ` : ''}

        <!-- ACTIONS -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button onclick="adminResetThisDevice()" style="
            flex: 1; min-width: 140px;
            padding: 12px 16px;
            background: #f59e0b; color: #fff;
            border: 0; border-radius: 10px;
            font-family: inherit; font-size: 13px; font-weight: 800;
            cursor: pointer;
          ">🔄 Reset Device</button>
          <button onclick="adminUnlockDevice()" style="
            flex: 1; min-width: 140px;
            padding: 12px 16px;
            background: #fff; color: #dc2626;
            border: 2px solid #fca5a5; border-radius: 10px;
            font-family: inherit; font-size: 13px; font-weight: 800;
            cursor: pointer;
          ">🔓 Unlock Device</button>
          <button onclick="adminCleanupInactive()" style="
            flex: 1; min-width: 140px;
            padding: 12px 16px;
            background: #fff; color: #7c3aed;
            border: 2px solid #c4b5fd; border-radius: 10px;
            font-family: inherit; font-size: 13px; font-weight: 800;
            cursor: pointer;
          ">🧹 Bersihkan Chat Tidak Aktif</button>
        </div>

        <!-- FOOTER -->
        <div style="
          margin-top: 20px; padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px; color: #94a3b8;
          text-align: center;
        ">
          URL admin: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">?admin=${APP_CONFIG.ADMIN_KEY}</code>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  /* ---- Listen kandidat aktif (real-time) ---- */
  setTimeout(() => {
    const container = document.getElementById('adminActiveSessions');
    const countEl   = document.getElementById('adminActiveCount');
    if (!container || typeof window.listenActiveSessions !== 'function') {
      if (container) {
        container.innerHTML = `
          <div style="
            padding: 14px; text-align: center;
            color: #94a3b8; font-size: 11px;
            background: #fff; border-radius: 10px;
          ">⚠️ Modul monitoring belum siap</div>`;
      }
      return;
    }

    window.listenActiveSessions((sessions) => {
      window.__adminLastSessions = sessions;

      if (countEl) {
        countEl.textContent = sessions.length + ' kandidat';
        countEl.style.color = sessions.length > 0 ? '#1e40af' : '#94a3b8';
      }
      container.innerHTML = renderActiveSessionsHTML(sessions);
    });

    // Mulai unread tracker
    if (typeof startAdminUnreadTracker === 'function') {
      startAdminUnreadTracker();
    }

    // ⏱ Mulai timer tick (update angka tiap detik)
    if (typeof startAdminTimerTick === 'function') {
      startAdminTimerTick();
    }
    // 📄 Auto-load daftar PDF dari Google Drive
    if (typeof refreshResultFilesList === 'function') {
      refreshResultFilesList();
    }
    // 🔄 AUTO-CLEANUP: hapus chat kandidat yang sudah lama tidak aktif
    if (CHAT_CLEANUP_ENABLED && typeof cleanupInactiveChatRooms === 'function') {
      setTimeout(() => {
        cleanupInactiveChatRooms({ silent: true }).then(r => {
          if (r.removed > 0) {
            console.log('[AUTO-CLEANUP] 🧹 ' + r.removed + ' chat lama dibersihkan');
          }
        });
      }, 500);
    }
         // Listen access requests
    if (typeof listenAccessRequests === 'function') {
      const reqContainer = document.getElementById('adminAccessRequests');
      const reqCountEl = document.getElementById('adminRequestCount');
      listenAccessRequests((requests) => {
        if (reqCountEl) {
          reqCountEl.textContent = requests.length + ' request';
          reqCountEl.style.color = requests.length > 0 ? '#92400e' : '#94a3b8';
          if (requests.length > 0) {
            reqCountEl.style.animation = 'adminPulseDot 1.4s ease-in-out infinite';
          } else {
            reqCountEl.style.animation = '';
          }
        }
        if (reqContainer) {
          reqContainer.innerHTML = renderAccessRequestsHTML(requests);
        }
      });
    }

  }, 200);

  const closeBtn = document.getElementById('btnAdminClose');
  if (closeBtn) {
    closeBtn.onclick = () => {
      if (typeof window.stopListeningActiveSessions === 'function') {
        try { window.stopListeningActiveSessions(); } catch (e) {}
      }
      if (typeof stopAdminUnreadTracker === 'function') {
        try { stopAdminUnreadTracker(); } catch (e) {}
      }
      if (typeof stopAdminTimerTick === 'function') {
        try { stopAdminTimerTick(); } catch (e) {}
      }
      overlay.remove();
             if (typeof stopListeningAccessRequests === 'function') {
        try { stopListeningAccessRequests(); } catch (e) {}
      }
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('admin');
        url.hash = '';
        window.history.replaceState({}, '', url.pathname + (url.search || ''));
      } catch (e) {}
    };
  }

  /* ---- Tombol logout ---- */
  const logoutBtn = document.getElementById('btnAdminLogout');
  if (logoutBtn) {
    logoutBtn.onclick = adminLogout;
  }

  /* ---- ESC untuk tutup ---- */
  document.addEventListener('keydown', function adminEsc(e) {
    if (e.key === 'Escape') {
      closeBtn && closeBtn.click();
      document.removeEventListener('keydown', adminEsc);
    }
  }, { once: true });
}

/* ============================================================
   CEK URL ADMIN
   ============================================================ */
function checkAdminUrlAndRender() {
  if (!isAdminUrl()) return false;

  // Tampilkan loading sementara
  const loading = document.createElement('div');
  loading.id = 'adminAuthLoading';
  loading.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(10,20,35,0.95);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-family: Inter, system-ui, sans-serif;
    font-size: 15px; font-weight: 700;
  `;
  loading.innerHTML = '⏳ Memeriksa sesi admin...';
  document.body.appendChild(loading);

  // Tunggu Firebase Auth ready (maks 3 detik)
  let resolved = false;

  const timeout = setTimeout(() => {
    if (resolved) return;
    resolved = true;
    loading.remove();
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    renderAdminLoginPrompt();
  }, 3000);

  const unsubscribe = firebase.auth().onAuthStateChanged(user => {
    if (resolved) return;
    resolved = true;
    clearTimeout(timeout);
    if (unsubscribe) unsubscribe();
    loading.remove();

    if (!user) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      renderAdminLoginPrompt();
      return;
    }

    // Cek apakah user ini admin
    firebase.database().ref('admins/' + user.uid).once('value')
      .then(snap => {
        if (snap.exists() && snap.val() === true) {
          sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
          renderAdminPanel();
        } else {
          firebase.auth().signOut();
          sessionStorage.removeItem(ADMIN_SESSION_KEY);
          renderAdminLoginPrompt();
        }
      })
      .catch(() => {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        renderAdminLoginPrompt();
      });
  });

  return true;
}

/* ============================================================
   EXPORT
   ============================================================ */
window.getLockState = getLockState;
window.setLockState = setLockState;
window.getFreshPwd = getFreshPwd;
window.getUsedPwd = getUsedPwd;
window.isAdminUrl = isAdminUrl;
window.renderAdminPanel = renderAdminPanel;
window.renderAdminLoginPrompt = renderAdminLoginPrompt;
window.renderActiveSessionsHTML = renderActiveSessionsHTML;
window.checkAdminUrlAndRender = checkAdminUrlAndRender;
window.toggleLockState = toggleLockState;
window.copyToClipboard = copyToClipboard;
window.regenFreshPwd = regenFreshPwd;
window.regenUsedPwd = regenUsedPwd;
window.setFreshPwdManual = setFreshPwdManual;
window.setUsedPwdManual = setUsedPwdManual;
window.adminResetThisDevice = adminResetThisDevice;
window.adminUnlockDevice = adminUnlockDevice;
window.adminAllowRetake = adminAllowRetake;
window.adminCleanupInactive = adminCleanupInactive;
window.adminLogout = adminLogout;

/* ─── Unread Tracker ─── */
window.startAdminUnreadTracker = startAdminUnreadTracker;
window.stopAdminUnreadTracker = stopAdminUnreadTracker;

/* ─── Chat Cleanup ─── */
window.cleanupInactiveChatRooms = cleanupInactiveChatRooms;

/* ─── Timer Tick ─── */
window.startAdminTimerTick = startAdminTimerTick;
window.stopAdminTimerTick = stopAdminTimerTick;
window.fetchResultFiles        = fetchResultFiles;
window.renderResultFilesHTML   = renderResultFilesHTML;
window.refreshResultFilesList  = refreshResultFilesList;
window.deleteResultFile         = deleteResultFile;
/* ─── Access Requests ─── */
window.listenAccessRequests         = listenAccessRequests;
window.stopListeningAccessRequests  = stopListeningAccessRequests;
window.approveAccessRequest         = approveAccessRequest;
window.rejectAccessRequest          = rejectAccessRequest;
window.renderAccessRequestsHTML     = renderAccessRequestsHTML;
console.log('[ADMIN] ✓ Loaded — lock + 2 passwords + login gate + monitoring + chat + allow_retake + unread + cleanup + timer');
