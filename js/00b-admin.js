/* ============================================================
   js/00b-admin.js
   - Admin panel: LOCK kontrol + 2 password (Fresh & Used)
   - Login gate: butuh password untuk akses panel
   - Monitoring kandidat aktif (real-time) + timer + progress
   - Chat per kandidat + unread tracker (badge + blink)
   - Tombol "Izinkan Tes Lagi" untuk device finished/diskualifikasi
   - Auto-cleanup chat device tidak aktif
   - ✅ Hasil tes digabung per kandidat (PDF + Excel = 1 kartu)
   - ✅ FIX: Halaman hasil tes z-index 100000
   - ✅ OPTIMASI: Cache + dedupe + SWR + debounce search
   ============================================================ */

/* ============================================================
   KONFIGURASI LOGIN ADMIN
   ============================================================ */
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
   ✅ OPTIMASI: Cache hasil fetch GAS (shared global)
   - TTL 30 detik: hemat request, tetap relatif fresh
   - Dedupe: 2 request bersamaan → 1 network call
   - SWR (stale-while-revalidate): tampilkan cache dulu,
     lalu refresh di background
   ============================================================ */
window.__resultFilesCacheData  = null;
window.__resultFilesCacheTime  = 0;
window.__resultFilesFetchPromise = null;
window.__resultFilesCache = [];

const RESULT_CACHE_TTL_MS = 30000;  // 30 detik

async function fetchResultFiles(forceRefresh = false) {
  const now = Date.now();
  const cacheAge = now - (window.__resultFilesCacheTime || 0);

  // ✅ 1. Kalau ada cache fresh & tidak dipaksa refresh → pakai cache
  if (!forceRefresh
      && window.__resultFilesCacheData
      && cacheAge < RESULT_CACHE_TTL_MS) {
    return window.__resultFilesCacheData;
  }

  // ✅ 2. Kalau ada request sedang berjalan → tunggu yang sama (dedupe)
  if (window.__resultFilesFetchPromise) {
    return window.__resultFilesFetchPromise;
  }

  // ✅ 3. Fetch baru (dengan retry 3× untuk atasi flaky GAS)
  window.__resultFilesFetchPromise = (async () => {
    const maxRetry = 3;
    let lastErr = null;

    for (let attempt = 1; attempt <= maxRetry; attempt++) {
      try {
        const url = GAS_ADMIN_URL + '?action=list&_t=' + Date.now() + '_' + attempt;
        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) {
          throw new Error('HTTP ' + res.status);
        }

        const text = await res.text();

        // Cek apakah HTML (bukan JSON)
        if (text.trim().startsWith('<')) {
          throw new Error('Respon HTML, bukan JSON (GAS redirect error)');
        }

        const data = JSON.parse(text);

        if (data && data.success) {
          window.__resultFilesCacheData = data.files || [];
          window.__resultFilesCacheTime = Date.now();
          return window.__resultFilesCacheData;
        }

        console.warn('[PDF-LIST] Gagal:', data?.error);
        return window.__resultFilesCacheData || [];

      } catch (e) {
        lastErr = e;
        console.warn(`[PDF-LIST] Attempt ${attempt}/${maxRetry} gagal:`, e.message);

        if (attempt < maxRetry) {
          // Tunggu sebelum retry: 500ms, 1000ms
          await new Promise(r => setTimeout(r, attempt * 500));
        }
      }
    }

    console.error('[PDF-LIST] Semua retry gagal:', lastErr?.message);
    return window.__resultFilesCacheData || [];
  })();

  return window.__resultFilesFetchPromise;
}

/* Invalidate cache (dipanggil setelah delete) */
function __invalidateResultCache() {
  window.__resultFilesCacheData = null;
  window.__resultFilesCacheTime = 0;
}

/* ============================================================
   HAPUS FILE DARI DRIVE
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

      // ✅ Invalidate cache dulu supaya fetch ulang
      if (typeof __invalidateResultCache === 'function') {
        __invalidateResultCache();
      }

      // Refresh halaman baru jika sedang terbuka
      if (window.__resultFilesPageOpen && typeof loadResultFilesForPage === 'function') {
        loadResultFilesForPage();
      }
      // Update counter di panel admin
      if (typeof __updateAdminResultCounter === 'function') {
        __updateAdminResultCounter();
      }
    } else {
      alert('❌ Gagal hapus: ' + (data.error || 'Unknown error'));
    }
  } catch (e) {
    console.error('[DELETE-PDF] Error:', e);
    alert('❌ Gagal hapus: ' + e.message);
  }
}


/* ============================================================
   HELPER — Ekstrak info kandidat dari file
   Prioritas: description → fallback filename
   Sekarang juga ekstrak Password PDF
   ============================================================ */
function __extractCandidateInfo(file) {
  let name = '-';
  let position = '-';
  let password = '-';

  try {
    const lines = String(file.description || '').split('\n');
    lines.forEach(l => {
      const t = l.trim();
      if (t.startsWith('Nama:'))         name     = t.replace('Nama:', '').trim();
      if (t.startsWith('Posisi:'))       position = t.replace('Posisi:', '').trim();
      if (t.startsWith('Password PDF:')) password = t.replace('Password PDF:', '').trim();
    });
  } catch (e) {}

  if (name === '-' && file.name) {
    const m = String(file.name).match(/^(.+?)-(?:Psikotes-SGSchools|Excel-\d{4}-\d{2}-\d{2})/i);
    if (m) name = m[1].replace(/-/g, ' ').trim();
  }

  return { name, position, password };
}

/* ============================================================
   HELPER — Deteksi tipe file dari ekstensi
   ============================================================ */
function __detectFileKind(file) {
  const n = String(file.name || '').toLowerCase();
  if (/\.pdf$/.test(n))               return 'pdf';
  if (/\.xlsx?$/.test(n))             return 'excel';
  if (/\.(csv|ods)$/.test(n))         return 'excel';
  return 'other';
}

/* ============================================================
   RENDER — 1 kandidat = 1 kartu (PDF + Excel digabung)
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

  const groups = new Map();

files.forEach(f => {
    const info = __extractCandidateInfo(f);
    const key  = (info.name || 'tanpa-nama').toLowerCase().trim() || 'tanpa-nama';

    if (!groups.has(key)) {
      groups.set(key, {
        name: info.name,
        position: info.position,
        password: info.password,
        files: []
      });
    }
    const g = groups.get(key);
    if (info.position !== '-' && g.position === '-') g.position = info.position;
    if (info.password !== '-' && g.password === '-') g.password = info.password;
    g.files.push(f);
  });

  const groupArr = Array.from(groups.values()).sort((a, b) => {
    const latestA = Math.max(...a.files.map(f => f.date || 0));
    const latestB = Math.max(...b.files.map(f => f.date || 0));
    return latestB - latestA;
  });

function renderFileRow(f, kind) {
    const sizeMB = f.size
      ? (f.size / 1024 / 1024).toFixed(2) + ' MB'
      : '-';

    const styleMap = {
      pdf:   { icon: '📄', label: 'Hasil Tes (PDF)',   bg: '#eff6ff', br: '#bfdbfe', iconBg: '#dbeafe', text: '#1e40af' },
      excel: { icon: '📊', label: 'Jawaban Excel',      bg: '#ecfdf5', br: '#86efac', iconBg: '#d1fae5', text: '#15803d' },
      other: { icon: '📁', label: 'File Lain',           bg: '#f8fafc', br: '#cbd5e1', iconBg: '#e2e8f0', text: '#475569' }
    };
    const s = styleMap[kind] || styleMap.other;
    const safeFileName = String(f.name || '').replace(/'/g, "\\'");
    const shortName = (f.name || '').length > 42
      ? (f.name || '').slice(0, 42) + '...'
      : (f.name || '');

    // ─── Ekstrak password dari description (khusus PDF) ───
    let pdfPassword = '-';
    if (kind === 'pdf') {
      try {
        const lines = String(f.description || '').split('\n');
        lines.forEach(l => {
          const t = l.trim();
          if (t.startsWith('Password PDF:')) {
            pdfPassword = t.replace('Password PDF:', '').trim();
          }
        });
      } catch (e) {}
    }

    // ─── Baris password (hanya tampil kalau PDF & ada password) ───
    const passwordRow = (kind === 'pdf' && pdfPassword && pdfPassword !== '-')
      ? `
        <div style="
          margin-top: 6px; padding: 6px 10px;
          display: inline-flex; align-items: center; gap: 8px;
          background: #fef9c3; border: 1px solid #fde047;
          border-radius: 6px;
          font-size: 10.5px;
        ">
          <span style="font-weight: 800; color: #713f12; white-space: nowrap;">🔑 Password PDF:</span>
          <code style="
            font-family: 'Courier New', monospace;
            font-weight: 800; color: #1e3a8a;
            background: #fff; padding: 3px 8px;
            border-radius: 4px; font-size: 11px;
            letter-spacing: 0.3px;
            word-break: break-all;
          ">${__adminEscape(pdfPassword)}</code>
          <button onclick="event.stopPropagation(); navigator.clipboard.writeText('${pdfPassword.replace(/'/g, "\\'")}'); this.textContent='✓'; setTimeout(()=>this.textContent='📋', 1000);"
            style="
              padding: 3px 8px; border: 1px solid #fde047;
              background: #fff; border-radius: 4px;
              cursor: pointer; font-size: 11px;
              font-family: inherit; font-weight: 800;
              color: #713f12;
            "
            title="Copy password">📋</button>
        </div>
      `
      : '';

    return `
      <div style="
        display: flex; align-items: flex-start; gap: 9px;
        padding: 8px 10px;
        background: ${s.bg};
        border: 1px solid ${s.br};
        border-radius: 9px;
      ">
        <div style="
          width: 30px; height: 30px; flex: 0 0 30px;
          display: grid; place-items: center;
          background: ${s.iconBg}; border-radius: 8px;
          font-size: 15px;
        ">${s.icon}</div>

        <div style="flex: 1; min-width: 0;">
          <div style="
            font-weight: 800; color: ${s.text};
            font-size: 11.5px; margin-bottom: 2px;
          ">${s.label}</div>
          <div style="
            color: #64748b; font-size: 10px;
            word-break: break-all; line-height: 1.35;
          ">
            ${__adminEscape(shortName)} &nbsp;·&nbsp; ${sizeMB}
          </div>
          ${passwordRow}
        </div>

        <div style="display: flex; gap: 5px; flex: 0 0 auto;">
          <a href="${f.url}" target="_blank" rel="noopener"
             style="
              padding: 5px 10px;
              background: linear-gradient(135deg, #3b82f6, #1e40af);
              color: #fff; border: 0; border-radius: 7px;
              font-size: 10px; font-weight: 800;
              text-decoration: none; white-space: nowrap;
              box-shadow: 0 3px 8px rgba(59,130,246,.22);
            ">⬇️ Buka</a>

          <button onclick="deleteResultFile('${f.id}', '${safeFileName}')"
            style="
              padding: 5px 9px;
              background: #fff; color: #dc2626;
              border: 1.5px solid #fca5a5; border-radius: 7px;
              font-size: 10px; font-weight: 800;
              cursor: pointer; font-family: inherit;
              white-space: nowrap;
            ">🗑️</button>
        </div>
      </div>
    `;
  }

  return groupArr.map(g => {
    const pdfs   = g.files.filter(f => __detectFileKind(f) === 'pdf');
    const excels = g.files.filter(f => __detectFileKind(f) === 'excel');
    const others = g.files.filter(f => __detectFileKind(f) === 'other');

    const latestDate = Math.max(...g.files.map(f => f.date || 0));
    const dateStr = latestDate ? new Date(latestDate).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }) : '-';

    let badge;
    if (pdfs.length > 0 && excels.length > 0) {
     badge = `
  <span style="
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; color: #15803d; font-weight: 800;
    background: #dcfce7; padding: 3px 9px;
    border-radius: 999px; border: 1px solid #86efac;
    white-space: nowrap;
  ">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style="flex:0 0 11px;">
      <circle cx="12" cy="12" r="10" fill="#16a34a"/>
      <path d="M7 12.5l3.2 3L17 9" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Lengkap (${g.files.length})
  </span>`;
    } else if (pdfs.length > 0 && excels.length === 0) {
     badge = `
  <span style="
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; color: #1e40af; font-weight: 800;
    background: #eff6ff; padding: 3px 9px;
    border-radius: 999px; border: 1px solid #bfdbfe;
    white-space: nowrap;
  ">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style="flex:0 0 11px;">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#2563eb"/>
      <path d="M7 7h6M7 11h6M7 15h3" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
    PDF
  </span>`;
 } else if (excels.length > 0 && pdfs.length === 0) {
  badge = `
    <span style="
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 10px; color: #15803d; font-weight: 800;
      background: #dcfce7; padding: 3px 9px;
      border-radius: 999px; border: 1px solid #86efac;
      white-space: nowrap;
    ">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style="flex:0 0 11px;">
        <rect x="2" y="3" width="20" height="18" rx="2" fill="#16a34a"/>
        <path d="M7 8l3 4-3 4M12 8l3 4-3 4M17 8v8" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
      Excel
    </span>`;
}else if (g.files.length > 0) {
      badge = `
        <span style="
          font-size: 10px; color: #475569; font-weight: 800;
          background: #f1f5f9; padding: 3px 9px;
          border-radius: 999px; border: 1px solid #cbd5e1;
          white-space: nowrap;
        ">📁 ${g.files.length} file</span>`;
    }

    return `
      <div style="
        padding: 12px 14px;
        background: linear-gradient(180deg, #ffffff, #fbfdff);
        border: 1px solid #dbeafe; border-radius: 12px;
        box-shadow: 0 2px 8px rgba(30,64,175,.04);
      ">
        <div style="
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 10px;
          margin-bottom: 10px; padding-bottom: 8px;
          border-bottom: 1px dashed #e2e8f0;
        ">
          <div style="min-width: 0;">
            <div style="
              font-weight: 800; color: #1e293b;
              font-size: 13px; word-break: break-word;
            ">👤 ${__adminEscape(g.name)}</div>
            <div style="color: #64748b; font-size: 11px; margin-top: 3px;">
              ${g.position !== '-' ? `📍 ${__adminEscape(g.position)} &nbsp;·&nbsp; ` : ''}
              🕐 ${dateStr}
            </div>
          </div>
          ${badge}
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${pdfs.map(f => renderFileRow(f, 'pdf')).join('')}
          ${excels.map(f => renderFileRow(f, 'excel')).join('')}
          ${others.map(f => renderFileRow(f, 'other')).join('')}
        </div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   REFRESH DAFTAR PDF (hitung kandidat unik)
   ============================================================ */
async function refreshResultFilesList() {
  const container = document.getElementById('adminResultFiles');
  const countEl   = document.getElementById('adminResultCount');

  if (!container) return;

  container.innerHTML = `
    <div style="padding: 20px 14px; text-align: center; color: #94a3b8; font-size: 12px;">
      ⏳ Memuat daftar PDF...
    </div>
  `;

  const files = await fetchResultFiles();

  const uniqueNames = new Set();
  files.forEach(f => {
    const info = __extractCandidateInfo(f);
    const key = (info.name || 'tanpa-nama').toLowerCase().trim();
    uniqueNames.add(key);
  });

  if (countEl) {
    const c = uniqueNames.size;
    const fCount = files.length;
    if (fCount === 0) {
      countEl.textContent = '0 file';
      countEl.style.color = '#94a3b8';
    } else {
      countEl.textContent = `${c} kandidat · ${fCount} file`;
      countEl.style.color = '#1e40af';
    }
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
  
  // ✅ SESI 8.1: Matikan idle tracker
  if (typeof __stopAdminIdleTracking === 'function') {
    __stopAdminIdleTracking();
  }
  
  try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch (e) {}
  // ... sisa kode ...
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
  if (window.__pdfAutoRefreshTimer) {
    clearInterval(window.__pdfAutoRefreshTimer);
    window.__pdfAutoRefreshTimer = null;
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

    const subLabel = s.currentTest === 'IST' && s.currentSubtest !== null && s.testTotalSubtests
      ? `Subtes ${(s.currentSubtest || 0) + 1}/${s.testTotalSubtests}`
      : '';

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

    const unreadCount = (window.__adminUnreadMap && window.__adminUnreadMap[s.deviceId]) || 0;
    const hasUnread = unreadCount > 0;

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
      <button onclick="event.stopPropagation(); openChatForAdmin('${s.deviceId}', '${safeName}')"
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

    const cardBg = isDisqualified
      ? 'linear-gradient(135deg, #fef2f2, #fee2e2)'
      : isFinished
      ? 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
      : '#fff';
    const cardBorder = isDisqualified ? '#fca5a5'
                     : isFinished ? '#cbd5e1'
                     : '#dbeafe';

    let timerProgressHTML = '';

    if (!isFinished && !isDisqualified && s.inTestView && s.currentTest) {
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
      <div
        onclick="openCandidateDetailPage('${s.deviceId}')"
        style="
          padding: 12px 14px; background: ${cardBg};
          border: 1px solid ${cardBorder}; border-radius: 10px;
          font-size: 12px; line-height: 1.5;
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
        "
        onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 10px 22px rgba(15,23,42,.1)';this.style.borderColor='#93c5fd';"
        onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';this.style.borderColor='${cardBorder}';"
      >
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
          <div style="display: flex; gap: 6px; align-items: center;">
            <span style="
              font-size: 10px; font-weight: 800; color: #3b82f6;
              padding: 3px 8px; border-radius: 999px;
              background: rgba(59,130,246,.1);
              border: 1px solid rgba(59,130,246,.2);
              white-space: nowrap;
            ">🔍 Detail →</span>
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
   ✅ HALAMAN HASIL TES TERKIRIM — fullscreen overlay
   - Filter by posisi + search nama (debounced)
   - Grouping per kandidat
   - z-index 100000
   - SWR loading (instant dari cache)
   ============================================================ */
window.__resultFilterPosition = 'all';
window.__resultSearchQuery = '';
window.__resultFilesPageOpen = false;

function openResultFilesPage() {
  const existing = document.getElementById('resultFilesPageOverlay');
  if (existing) existing.remove();

  window.__resultFilesPageOpen = false;

  try {
    window.__resultFilesPageOpen = true;

    const overlay = document.createElement('div');
    overlay.id = 'resultFilesPageOverlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 100000;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      display: flex; flex-direction: column;
      font-family: Inter, system-ui, -apple-system, sans-serif;
      color: #e2e8f0;
      animation: resultPageIn .3s cubic-bezier(.2,.8,.2,1);
    `;

    overlay.innerHTML = `
      <style>
        @keyframes resultPageIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes resultCardIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes resultSpinner {
          to { transform: rotate(360deg); }
        }
        #resultFilesPageOverlay ::-webkit-scrollbar { width: 8px; height: 8px; }
        #resultFilesPageOverlay ::-webkit-scrollbar-track { background: rgba(255,255,255,.03); }
        #resultFilesPageOverlay ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 4px; }
        #resultFilesPageOverlay ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.25); }
        .rf-chip {
          padding: 8px 16px; border-radius: 999px;
          background: rgba(255,255,255,.06);
          border: 1.5px solid rgba(255,255,255,.1);
          color: #cbd5e1; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all .18s ease;
          font-family: inherit; white-space: nowrap;
        }
        .rf-chip:hover { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.2); color: #fff; }
        .rf-chip.active {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border-color: transparent; color: #fff;
          box-shadow: 0 4px 14px rgba(59,130,246,.4);
        }
        .rf-card {
          background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 18px; padding: 20px;
          transition: all .22s ease;
          backdrop-filter: blur(10px);
          animation: resultCardIn .35s ease both;
        }
        .rf-card:hover {
          border-color: rgba(99,102,241,.4);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,.3), 0 0 0 1px rgba(99,102,241,.2);
        }
        .rf-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 9px;
          font-size: 12px; font-weight: 800;
          cursor: pointer; transition: all .18s ease;
          font-family: inherit; text-decoration: none;
          border: 0;
        }
        .rf-btn:hover { transform: translateY(-1px); }
        .rf-btn-primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: #fff;
          box-shadow: 0 4px 12px rgba(59,130,246,.3);
        }
        .rf-btn-primary:hover { box-shadow: 0 6px 16px rgba(59,130,246,.4); }
        .rf-btn-danger {
          background: rgba(239,68,68,.12);
          color: #fca5a5;
          border: 1px solid rgba(239,68,68,.3);
        }
        .rf-btn-danger:hover { background: rgba(239,68,68,.2); color: #fecaca; }
      </style>

      <!-- HEADER -->
      <div style="
        padding: 20px 28px;
        background: linear-gradient(180deg, rgba(0,0,0,.25), transparent);
        border-bottom: 1px solid rgba(255,255,255,.08);
        display: flex; align-items: center; gap: 18px;
        flex-wrap: wrap;
      ">
        <button id="rfBackBtn" style="
          width: 42px; height: 42px; flex: 0 0 42px;
          display: grid; place-items: center;
          background: rgba(255,255,255,.08);
          border: 1.5px solid rgba(255,255,255,.14);
          border-radius: 12px; color: #fff;
          font-size: 18px; cursor: pointer;
          font-family: inherit; transition: all .18s ease;
        " onmouseover="this.style.background='rgba(255,255,255,.15)'"
           onmouseout="this.style.background='rgba(255,255,255,.08)'">←</button>

        <div style="flex: 1; min-width: 0;">
          <div style="
            font-size: 11px; font-weight: 800;
            letter-spacing: 2px; color: #818cf8;
            margin-bottom: 4px;
          ">ADMIN PANEL · HASIL TES</div>
          <div style="font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -.3px;">
            📄 Hasil Tes Terkirim
          </div>
        </div>

        <div id="rfStats" style="display: flex; gap: 12px; flex-wrap: wrap;"></div>

        <button id="rfRefreshBtn" style="
          padding: 10px 18px;
          background: linear-gradient(135deg, #16a34a, #059669);
          border: 0; border-radius: 11px; color: #fff;
          font-size: 13px; font-weight: 800;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 6px 16px rgba(22,163,74,.3);
          transition: all .18s ease;
        " onmouseover="this.style.transform='translateY(-1px)'"
           onmouseout="this.style.transform='translateY(0)'">🔄 Refresh</button>
      </div>

      <!-- FILTER BAR -->
      <div style="
        padding: 18px 28px;
        background: rgba(0,0,0,.15);
        border-bottom: 1px solid rgba(255,255,255,.06);
      ">
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 14px;">
          <div style="flex: 1; min-width: 240px; position: relative;">
            <input id="rfSearchInput" type="text" placeholder="Cari nama kandidat atau posisi..."
              autocomplete="off"
              style="
                width: 100%; padding: 12px 16px 12px 42px;
                background: rgba(255,255,255,.06);
                border: 1.5px solid rgba(255,255,255,.1);
                border-radius: 12px;
                color: #fff; font-size: 14px;
                font-family: inherit; outline: none;
                transition: all .18s ease;
                box-sizing: border-box;
              "
              onfocus="this.style.borderColor='rgba(99,102,241,.6)';this.style.background='rgba(255,255,255,.09)'"
              onblur="this.style.borderColor='rgba(255,255,255,.1)';this.style.background='rgba(255,255,255,.06)'">
            <span style="
              position: absolute; left: 15px; top: 50%;
              transform: translateY(-50%);
              font-size: 16px; color: #64748b;
              pointer-events: none;
            ">🔍</span>
          </div>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <span style="
            font-size: 11px; font-weight: 800;
            letter-spacing: 1px; color: #64748b;
            margin-right: 4px;
          ">FILTER POSISI:</span>
          <div id="rfPositionChips" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
        </div>
      </div>

      <!-- CONTENT -->
      <div id="rfContent" style="flex: 1; overflow-y: auto; padding: 24px 28px 40px;">
        <div style="
          display: flex; align-items: center; justify-content: center;
          padding: 60px 20px; color: #64748b;
          font-size: 14px; flex-direction: column; gap: 14px;
        ">
          <div style="
            width: 40px; height: 40px;
            border: 3px solid rgba(255,255,255,.1);
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: resultSpinner 0.8s linear infinite;
          "></div>
          Memuat daftar hasil tes...
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('rfBackBtn').onclick = closeResultFilesPage;

    // ✅ Refresh button — force fetch (bypass cache)
    document.getElementById('rfRefreshBtn').onclick = async (e) => {
      const btn = e.currentTarget;
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '⏳ Memuat...';

      try {
        if (typeof __invalidateResultCache === 'function') {
          __invalidateResultCache();
        }
        const files = await fetchResultFiles(true);
        window.__resultFilesCache = files;
        __renderResultPageContent();
      } catch (err) {
        console.error('[RESULT-PAGE] Refresh error:', err);
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    };

    // ✅ Search input — debounce 250ms
    const searchInput = document.getElementById('rfSearchInput');
    let __searchDebounceTimer = null;
    searchInput.addEventListener('input', (e) => {
      window.__resultSearchQuery = (e.target.value || '').toLowerCase().trim();
      clearTimeout(__searchDebounceTimer);
      __searchDebounceTimer = setTimeout(() => {
        __renderResultPageContent();
      }, 250);
    });

    loadResultFilesForPage();

  } catch (err) {
    console.error('[RESULT-PAGE] Gagal buka halaman:', err);
    window.__resultFilesPageOpen = false;
    alert('❌ Gagal membuka halaman hasil tes: ' + err.message);
  }
}

function closeResultFilesPage() {
  const overlay = document.getElementById('resultFilesPageOverlay');
  if (overlay) overlay.remove();
  window.__resultFilesPageOpen = false;
  if (typeof __updateAdminResultCounter === 'function') {
    __updateAdminResultCounter();
  }
}

/* ============================================================
   ✅ SWR — load dengan stale-while-revalidate
   ============================================================ */
async function loadResultFilesForPage() {
  const content = document.getElementById('rfContent');
  if (!content) return;

  // ✅ Kalau ada cache → tampil INSTAN
  if (window.__resultFilesCacheData && window.__resultFilesCacheData.length >= 0) {
    window.__resultFilesCache = window.__resultFilesCacheData;
    __renderResultPageContent();

    const cacheAge = Date.now() - (window.__resultFilesCacheTime || 0);
    if (cacheAge > 10000) {
      fetchResultFiles(true).then(files => {
        window.__resultFilesCache = files;
        __renderResultPageContent();
      });
    }
    return;
  }

  // Tidak ada cache → loading + fetch
  content.innerHTML = `
    <div style="
      display: flex; align-items: center; justify-content: center;
      padding: 60px 20px; color: #64748b;
      font-size: 14px; flex-direction: column; gap: 14px;
    ">
      <div style="
        width: 40px; height: 40px;
        border: 3px solid rgba(255,255,255,.1);
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: resultSpinner 0.8s linear infinite;
      "></div>
      Memuat daftar hasil tes...
    </div>
  `;

  const files = await fetchResultFiles();
  window.__resultFilesCache = files;
  __renderResultPageContent();
}

function __renderResultPageContent() {
  const content = document.getElementById('rfContent');
  const chipsContainer = document.getElementById('rfPositionChips');
  const statsContainer = document.getElementById('rfStats');
  if (!content || !chipsContainer || !statsContainer) return;

  const files = window.__resultFilesCache || [];

  const groups = new Map();
  files.forEach(f => {
    const info = __extractCandidateInfo(f);
    const key = (info.name || 'tanpa-nama').toLowerCase().trim() || 'tanpa-nama';
    if (!groups.has(key)) {
      groups.set(key, { name: info.name, position: info.position, files: [] });
    }
    const g = groups.get(key);
    if (info.position !== '-' && g.position === '-') g.position = info.position;
    g.files.push(f);
  });

  let groupArr = Array.from(groups.values());

  groupArr.sort((a, b) => {
    const latestA = Math.max(...a.files.map(f => f.date || 0));
    const latestB = Math.max(...b.files.map(f => f.date || 0));
    return latestB - latestA;
  });

  const positionSet = new Set();
  groupArr.forEach(g => {
    if (g.position && g.position !== '-') positionSet.add(g.position);
  });
  const positions = Array.from(positionSet).sort();

  const currentFilter = window.__resultFilterPosition || 'all';
  let chipsHTML = `
    <button class="rf-chip ${currentFilter === 'all' ? 'active' : ''}"
      onclick="__setResultFilter('all')">Semua (${groupArr.length})</button>
  `;
  positions.forEach(p => {
    const count = groupArr.filter(g => g.position === p).length;
    const isActive = currentFilter === p;
    const safeP = String(p).replace(/'/g, "\\'");
    chipsHTML += `
      <button class="rf-chip ${isActive ? 'active' : ''}"
        onclick="__setResultFilter('${safeP}')">${__adminEscape(p)} (${count})</button>
    `;
  });

  const noPosCount = groupArr.filter(g => !g.position || g.position === '-').length;
  if (noPosCount > 0) {
    const isActive = currentFilter === '__no_position__';
    chipsHTML += `
      <button class="rf-chip ${isActive ? 'active' : ''}"
        onclick="__setResultFilter('__no_position__')">Tanpa Posisi (${noPosCount})</button>
    `;
  }

  chipsContainer.innerHTML = chipsHTML;

  const totalFiles = groupArr.reduce((acc, g) => acc + g.files.length, 0);
  statsContainer.innerHTML = `
    <div style="
      padding: 8px 14px; border-radius: 10px;
      background: rgba(99,102,241,.12);
      border: 1px solid rgba(99,102,241,.3);
      font-size: 12px; font-weight: 800; color: #a5b4fc;
    ">👥 ${groupArr.length} kandidat</div>
    <div style="
      padding: 8px 14px; border-radius: 10px;
      background: rgba(34,197,94,.12);
      border: 1px solid rgba(34,197,94,.3);
      font-size: 12px; font-weight: 800; color: #86efac;
    ">📎 ${totalFiles} file</div>
  `;

  const search = window.__resultSearchQuery || '';
  const filterPos = window.__resultFilterPosition || 'all';

  let filtered = groupArr;

  if (filterPos === '__no_position__') {
    filtered = filtered.filter(g => !g.position || g.position === '-');
  } else if (filterPos !== 'all') {
    filtered = filtered.filter(g => g.position === filterPos);
  }

  if (search) {
    filtered = filtered.filter(g =>
      (g.name || '').toLowerCase().includes(search) ||
      (g.position || '').toLowerCase().includes(search)
    );
  }

  if (filtered.length === 0) {
    content.innerHTML = `
      <div style="
        display: flex; align-items: center; justify-content: center;
        padding: 80px 20px; color: #64748b;
        font-size: 14px; flex-direction: column; gap: 12px;
        text-align: center;
      ">
        <div style="font-size: 52px; opacity: .5;">📭</div>
        <div style="font-weight: 700; color: #94a3b8;">
          ${files.length === 0 ? 'Belum ada hasil tes yang terkirim' : 'Tidak ada kandidat yang cocok dengan filter'}
        </div>
        ${files.length > 0 ? `
          <button onclick="__resetResultFilter()" style="
            margin-top: 8px; padding: 9px 20px;
            background: rgba(99,102,241,.15);
            border: 1px solid rgba(99,102,241,.4);
            color: #a5b4fc; border-radius: 9px;
            font-family: inherit; font-size: 13px; font-weight: 800;
            cursor: pointer;
          ">Reset Filter</button>
        ` : ''}
      </div>
    `;
    return;
  }

  const cardsHTML = filtered.map(g => {
    const pdfs   = g.files.filter(f => __detectFileKind(f) === 'pdf');
    const excels = g.files.filter(f => __detectFileKind(f) === 'excel');
    const others = g.files.filter(f => __detectFileKind(f) === 'other');

    const latestDate = Math.max(...g.files.map(f => f.date || 0));
    const dateStr = latestDate ? new Date(latestDate).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) : '-';

    const initials = (g.name || '?')
      .split(/\s+/).slice(0, 2)
      .map(w => w[0] || '').join('').toUpperCase() || '?';

    const hash = (g.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const avatarColors = [
      ['#3b82f6', '#1e40af'],
      ['#8b5cf6', '#6d28d9'],
      ['#10b981', '#047857'],
      ['#f59e0b', '#b45309'],
      ['#ec4899', '#be185d'],
      ['#06b6d4', '#0e7490']
    ];
    const [c1, c2] = avatarColors[hash % avatarColors.length];

    let badge, badgeColor;
    if (pdfs.length > 0 && excels.length > 0) {
      badge = '✓ Lengkap'; badgeColor = { bg: 'rgba(34,197,94,.15)', br: 'rgba(34,197,94,.4)', text: '#86efac' };
    } else if (pdfs.length > 0) {
      badge = '📄 PDF'; badgeColor = { bg: 'rgba(59,130,246,.15)', br: 'rgba(59,130,246,.4)', text: '#93c5fd' };
   } else if (excels.length > 0) {
  badge = '<span style="display:inline-flex;align-items:center;gap:5px;"><svg width="11" height="11" viewBox="0 0 24 24" style="flex:0 0 11px;"><rect x="2" y="3" width="20" height="18" rx="2" fill="#16a34a"/><path d="M7 8l3 4-3 4M12 8l3 4-3 4M17 8v8" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>Excel</span>';
  badgeColor = { bg: 'rgba(34,197,94,.15)', br: 'rgba(34,197,94,.4)', text: '#86efac' };
} else {
      badge = `📁 ${g.files.length} file`; badgeColor = { bg: 'rgba(148,163,184,.15)', br: 'rgba(148,163,184,.4)', text: '#cbd5e1' };
    }

        function fileRow(f, kind) {
      const sizeMB = f.size ? (f.size / 1024 / 1024).toFixed(2) + ' MB' : '-';
      const iconMap = { pdf: '📄', excel: '📊', other: '📁' };
      const labelMap = { pdf: 'Hasil Tes (PDF)', excel: 'Jawaban Excel', other: 'File Lain' };
      const safeFileName = String(f.name || '').replace(/'/g, "\\'");

      // ─── Ekstrak password dari description (khusus PDF) ───
      let pdfPassword = '-';
      if (kind === 'pdf') {
        try {
          const lines = String(f.description || '').split('\n');
          lines.forEach(l => {
            const t = l.trim();
            if (t.startsWith('Password PDF:')) {
              pdfPassword = t.replace('Password PDF:', '').trim();
            }
          });
        } catch (e) {}
      }

      // ─── Baris password (dark theme) ───
      const passwordRow = (kind === 'pdf' && pdfPassword && pdfPassword !== '-')
        ? `
          <div style="
            margin-top: 8px; padding: 8px 10px;
            display: inline-flex; align-items: center; gap: 8px;
            background: rgba(250,204,21,.15);
            border: 1px solid rgba(250,204,21,.4);
            border-radius: 7px;
            font-size: 11px;
            flex-wrap: wrap;
          ">
            <span style="font-weight: 800; color: #fde047; white-space: nowrap;">🔑 Password PDF:</span>
            <code style="
              font-family: 'Courier New', monospace;
              font-weight: 800; color: #fff;
              background: rgba(0,0,0,.35); padding: 3px 9px;
              border-radius: 4px; font-size: 11.5px;
              letter-spacing: 0.3px;
              word-break: break-all;
            ">${__adminEscape(pdfPassword)}</code>
            <button onclick="event.stopPropagation(); navigator.clipboard.writeText('${pdfPassword.replace(/'/g, "\\'")}'); this.textContent='✓'; setTimeout(()=>this.textContent='📋', 1000);"
              style="
                padding: 3px 9px; border: 1px solid rgba(250,204,21,.5);
                background: rgba(255,255,255,.08); border-radius: 5px;
                cursor: pointer; font-size: 11px;
                font-family: inherit; font-weight: 800;
                color: #fde047;
              "
              title="Copy password">📋</button>
          </div>
        `
        : '';

      return `
        <div style="
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px;
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 11px;
          transition: all .15s ease;
        " onmouseover="this.style.background='rgba(255,255,255,.06)';this.style.borderColor='rgba(255,255,255,.12)'"
           onmouseout="this.style.background='rgba(255,255,255,.03)';this.style.borderColor='rgba(255,255,255,.06)'">

          <div style="
            width: 34px; height: 34px; flex: 0 0 34px;
            display: grid; place-items: center;
            background: rgba(255,255,255,.06);
            border-radius: 9px; font-size: 16px;
          ">${iconMap[kind] || iconMap.other}</div>

          <div style="flex: 1; min-width: 0;">
            <div style="
              font-weight: 800; color: #e2e8f0;
              font-size: 12px; margin-bottom: 3px;
            ">${labelMap[kind] || labelMap.other}</div>
            <div style="
              color: #64748b; font-size: 10.5px;
              word-break: break-all; line-height: 1.4;
            ">${__adminEscape((f.name || '').slice(0, 45))}${(f.name || '').length > 45 ? '...' : ''} · ${sizeMB}</div>
            ${passwordRow}
          </div>

          <div style="display: flex; gap: 6px; flex: 0 0 auto;">
            <a href="${f.url}" target="_blank" rel="noopener" class="rf-btn rf-btn-primary">⬇ Buka</a>
            <button onclick="deleteResultFile('${f.id}', '${safeFileName}')" class="rf-btn rf-btn-danger">🗑</button>
          </div>
        </div>
      `;
    }


    return `
      <div class="rf-card">
        <div style="
          display: flex; align-items: flex-start; gap: 14px;
          margin-bottom: 14px; padding-bottom: 14px;
          border-bottom: 1px solid rgba(255,255,255,.06);
        ">
          <div style="
            width: 48px; height: 48px; flex: 0 0 48px;
            display: grid; place-items: center;
            background: linear-gradient(135deg, ${c1}, ${c2});
            border-radius: 14px;
            font-size: 17px; font-weight: 900; color: #fff;
            letter-spacing: -.5px;
            box-shadow: 0 6px 16px ${c1}55;
          ">${initials}</div>

          <div style="flex: 1; min-width: 0;">
            <div style="
              display: flex; align-items: center; gap: 10px;
              flex-wrap: wrap; margin-bottom: 6px;
            ">
              <div style="
                font-size: 15px; font-weight: 900; color: #fff;
                letter-spacing: -.2px;
                word-break: break-word;
              ">${__adminEscape(g.name)}</div>
              <span style="
                padding: 3px 10px; border-radius: 999px;
                background: ${badgeColor.bg};
                border: 1px solid ${badgeColor.br};
                color: ${badgeColor.text};
                font-size: 10px; font-weight: 800;
                white-space: nowrap;
              ">${badge}</span>
            </div>
            <div style="color: #94a3b8; font-size: 12px; font-weight: 600;">
              ${g.position !== '-' ? `💼 ${__adminEscape(g.position)}` : '💼 <span style="opacity:.6">Tanpa posisi</span>'}
              <span style="opacity:.4; margin: 0 8px;">•</span>
              🕐 ${dateStr}
            </div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${pdfs.map(f => fileRow(f, 'pdf')).join('')}
          ${excels.map(f => fileRow(f, 'excel')).join('')}
          ${others.map(f => fileRow(f, 'other')).join('')}
        </div>
      </div>
    `;
  }).join('');

  content.innerHTML = `
    <div style="
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 16px;
    ">
      ${cardsHTML}
    </div>
  `;
}

function __setResultFilter(pos) {
  window.__resultFilterPosition = pos;
  __renderResultPageContent();
}

function __resetResultFilter() {
  window.__resultFilterPosition = 'all';
  window.__resultSearchQuery = '';
  const input = document.getElementById('rfSearchInput');
  if (input) input.value = '';
  __renderResultPageContent();
}

/* ============================================================
   ✅ Counter di panel admin (pakai cache — instan)
   ============================================================ */
async function __updateAdminResultCounter() {
  const countEl = document.getElementById('adminResultCount');
  if (!countEl) return;

  // ✅ Tampilkan cache dulu (instan) kalau ada
  if (window.__resultFilesCacheData && window.__resultFilesCacheData.length >= 0) {
    __renderCounterFromData(window.__resultFilesCacheData);
  }

  // ✅ Refresh dari network (pakai cache TTL, tidak selalu fetch)
  const files = await fetchResultFiles();
  __renderCounterFromData(files);
}

function __renderCounterFromData(files) {
  const countEl = document.getElementById('adminResultCount');
  if (!countEl) return;

  if (!files || !files.length) {
    countEl.textContent = 'Belum ada hasil tes';
    countEl.style.color = '#94a3b8';
    return;
  }

  const uniqueNames = new Set();
  files.forEach(f => {
    const info = __extractCandidateInfo(f);
    const key = (info.name || 'tanpa-nama').toLowerCase().trim();
    uniqueNames.add(key);
  });

  countEl.textContent = `${uniqueNames.size} kandidat · ${files.length} file`;
  countEl.style.color = '#15803d';
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
             KANDIDAT AKTIF — tombol buka halaman
             ========================================= -->
        <button onclick="openActiveCandidatesPage()" style="
          width: 100%;
          padding: 20px 22px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border: 2px solid #93c5fd;
          border-radius: 14px;
          margin-bottom: 16px;
          cursor: pointer;
          font-family: inherit;
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; text-align: left;
          transition: all .18s ease;
          box-shadow: 0 2px 8px rgba(59,130,246,.08);
        "
        onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 20px rgba(59,130,246,.18)';this.style.borderColor='#60a5fa'"
        onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(59,130,246,.08)';this.style.borderColor='#93c5fd'">

          <div style="display: flex; align-items: center; gap: 14px; min-width: 0;">
            <div style="
              width: 48px; height: 48px; flex: 0 0 48px;
              display: grid; place-items: center;
              background: linear-gradient(135deg, #3b82f6, #1e40af);
              border-radius: 14px; font-size: 22px;
              box-shadow: 0 6px 16px rgba(59,130,246,.3);
            ">📊</div>
            <div style="min-width: 0;">
              <div style="
                font-size: 15px; font-weight: 900; color: #1e3a8a;
                margin-bottom: 4px;
              ">Kandidat Aktif &amp; Selesai</div>
              <div id="adminActiveCount" style="
                font-size: 12px; font-weight: 700; color: #1e40af;
              ">Memuat...</div>
            </div>
          </div>

          <div style="
            display: flex; align-items: center; gap: 8px;
            padding: 10px 18px;
            background: linear-gradient(135deg, #3b82f6, #1e40af);
            color: #fff; border-radius: 11px;
            font-size: 13px; font-weight: 800;
            box-shadow: 0 6px 16px rgba(59,130,246,.3);
            white-space: nowrap; flex: 0 0 auto;
          ">Buka Halaman →</div>
        </button>

<!-- =========================================
     HASIL TES TERKIRIM — tombol buka halaman
     ========================================= -->
<button onclick="openResultFilesPage()" style="
  width: 100%;
  padding: 20px 22px;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 2px solid #86efac;
  border-radius: 14px;
  margin-bottom: 16px;
  cursor: pointer;
  font-family: inherit;
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; text-align: left;
  transition: all .18s ease;
  box-shadow: 0 2px 8px rgba(34,197,94,.08);
"
onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 20px rgba(34,197,94,.18)';this.style.borderColor='#4ade80'"
onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(34,197,94,.08)';this.style.borderColor='#86efac'">

  <div style="display: flex; align-items: center; gap: 14px; min-width: 0;">
    <div style="
      width: 48px; height: 48px; flex: 0 0 48px;
      display: grid; place-items: center;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      border-radius: 14px; font-size: 22px;
      box-shadow: 0 6px 16px rgba(34,197,94,.3);
    ">📄</div>
    <div style="min-width: 0;">
      <div style="
        font-size: 15px; font-weight: 900; color: #14532d;
        margin-bottom: 4px;
      ">Hasil Tes Terkirim</div>
      <div id="adminResultCount" style="
        font-size: 12px; font-weight: 700; color: #15803d;
      ">Memuat...</div>
    </div>
  </div>

  <div style="
    display: flex; align-items: center; gap: 8px;
    padding: 10px 18px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff; border-radius: 11px;
    font-size: 13px; font-weight: 800;
    box-shadow: 0 6px 16px rgba(34,197,94,.3);
    white-space: nowrap; flex: 0 0 auto;
  ">Buka Halaman →</div>
</button>

        <style>          @keyframes adminPulseDot {
            0%, 100% { transform: scale(1); opacity: 1; }
            50%      { transform: scale(1.35); opacity: .7; }
          }
        </style>

        <!-- =========================================
             PENGATURAN PASSWORD — tombol buka halaman
             ========================================= -->
        <button onclick="openPasswordSettingsPage()" style="
          width: 100%;
          padding: 20px 22px;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 2px solid #fcd34d;
          border-radius: 14px;
          margin-bottom: 16px;
          cursor: pointer;
          font-family: inherit;
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; text-align: left;
          transition: all .18s ease;
          box-shadow: 0 2px 8px rgba(245,158,11,.08);
        "
        onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 20px rgba(245,158,11,.18)';this.style.borderColor='#f59e0b'"
        onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(245,158,11,.08)';this.style.borderColor='#fcd34d'">

          <div style="display: flex; align-items: center; gap: 14px; min-width: 0;">
            <div style="
              width: 48px; height: 48px; flex: 0 0 48px;
              display: grid; place-items: center;
              background: linear-gradient(135deg, #f59e0b, #d97706);
              border-radius: 14px; font-size: 22px;
              box-shadow: 0 6px 16px rgba(245,158,11,.3);
            ">🔑</div>
            <div style="min-width: 0;">
              <div style="
                font-size: 15px; font-weight: 900; color: #78350f;
                margin-bottom: 4px;
              ">Pengaturan Password</div>
              <div style="
                font-size: 12px; font-weight: 700; color: #92400e;
              ">${locked ? '🔒 Login sedang dikunci' : '🔓 Kelola FRESH & USED'}</div>
            </div>
          </div>

          <div style="
            display: flex; align-items: center; gap: 8px;
            padding: 10px 18px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #fff; border-radius: 11px;
            font-size: 13px; font-weight: 800;
            box-shadow: 0 6px 16px rgba(245,158,11,.3);
            white-space: nowrap; flex: 0 0 auto;
          ">Buka Halaman →</div>
        </button>
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

  // ✅ SESI 8.1: Aktifkan idle tracker untuk admin
  if (typeof __startAdminIdleTracking === 'function') {
    __startAdminIdleTracking();
  }

  /* ---- Listen kandidat aktif (real-time) ---- */
  setTimeout(() => {
    const countEl = document.getElementById('adminActiveCount');
    if (!countEl || typeof window.listenActiveSessions !== 'function') return;

       window.listenActiveSessions((sessions) => {
      window.__adminLastSessions = sessions;

      if (countEl) {
        countEl.textContent = sessions.length + ' kandidat';
        countEl.style.color = sessions.length > 0 ? '#1e40af' : '#94a3b8';
      }
      // List tidak dirender di panel — dibuka di halaman terpisah
    });

    if (typeof startAdminUnreadTracker === 'function') {
      startAdminUnreadTracker();
    }

    if (typeof startAdminTimerTick === 'function') {
      startAdminTimerTick();
    }
    // 📄 Auto-load counter hasil tes dari Google Drive
    if (typeof __updateAdminResultCounter === 'function') {
      __updateAdminResultCounter();
    }
    // Auto-refresh counter tiap 30 detik
    if (window.__pdfAutoRefreshTimer) {
      clearInterval(window.__pdfAutoRefreshTimer);
    }
    window.__pdfAutoRefreshTimer = setInterval(() => {
      if (document.getElementById('adminResultCount')) {
        __updateAdminResultCounter();
      }
    }, 30000);

    if (CHAT_CLEANUP_ENABLED && typeof cleanupInactiveChatRooms === 'function') {
      setTimeout(() => {
        cleanupInactiveChatRooms({ silent: true }).then(r => {
          if (r.removed > 0) {
            console.log('[AUTO-CLEANUP] 🧹 ' + r.removed + ' chat lama dibersihkan');
          }
        });
      }, 500);
    }

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
      if (window.__pdfAutoRefreshTimer) {
        clearInterval(window.__pdfAutoRefreshTimer);
        window.__pdfAutoRefreshTimer = null;
      }

      overlay.remove();

      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('admin');
        url.hash = '';
        window.history.replaceState({}, '', url.pathname + (url.search || ''));
      } catch (e) {}
    };
  }

  const logoutBtn = document.getElementById('btnAdminLogout');
  if (logoutBtn) {
    logoutBtn.onclick = adminLogout;
  }

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

/* ─── Helper grouping ─── */
window.__extractCandidateInfo  = __extractCandidateInfo;
window.__detectFileKind        = __detectFileKind;

/* ─── Halaman hasil tes ─── */
window.openResultFilesPage     = openResultFilesPage;
window.closeResultFilesPage    = closeResultFilesPage;
window.loadResultFilesForPage  = loadResultFilesForPage;
window.__setResultFilter       = __setResultFilter;
window.__resetResultFilter     = __resetResultFilter;
window.__updateAdminResultCounter = __updateAdminResultCounter;

/* ─── ✅ Cache control ─── */
window.__invalidateResultCache = __invalidateResultCache;

/* ─── Access Requests ─── */
window.listenAccessRequests         = listenAccessRequests;
window.stopListeningAccessRequests  = stopListeningAccessRequests;
window.approveAccessRequest         = approveAccessRequest;
window.rejectAccessRequest          = rejectAccessRequest;
window.renderAccessRequestsHTML     = renderAccessRequestsHTML;
/* ============================================================
   ✅ SESI 8.1 — ADMIN SESSION TIMEOUT
   Auto-logout setelah idle 15 menit (dapat diubah)
   ============================================================ */
const ADMIN_SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const ADMIN_WARNING_BEFORE_MS  = 60 * 1000;

let __adminIdleTimer        = null;
let __adminWarningTimer     = null;
let __adminWarningShown     = false;

function __resetAdminIdleTimer() {
  // Skip kalau bukan mode admin
  if (typeof isAdminUrl !== 'function' || !isAdminUrl()) return;

  // Skip kalau panel admin tidak terbuka
  const panel = document.getElementById('adminPanelOverlay');
  if (!panel) return;

  // Clear timer lama
  clearTimeout(__adminIdleTimer);
  clearTimeout(__adminWarningTimer);

  // Sembunyikan warning kalau ada
  const warn = document.getElementById('adminIdleWarning');
  if (warn) warn.remove();
  __adminWarningShown = false;

  // Set timer warning (1 menit sebelum logout)
  __adminWarningTimer = setTimeout(() => {
    if (__adminWarningShown) return;
    __adminWarningShown = true;
    __showAdminIdleWarning();
  }, ADMIN_SESSION_TIMEOUT_MS - ADMIN_WARNING_BEFORE_MS);

  // Set timer logout
  __adminIdleTimer = setTimeout(() => {
    if (typeof adminLogout === 'function') {
      const panel = document.getElementById('adminPanelOverlay');
      if (panel) {
        const warn = document.getElementById('adminIdleWarning');
        if (warn) warn.remove();

        alert('🔒 Sesi admin berakhir karena tidak ada aktivitas 15 menit.\n\nSilakan login ulang untuk melanjutkan.');
        try { adminLogout(); } catch (e) {}
      }
    }
  }, ADMIN_SESSION_TIMEOUT_MS);
}

function __showAdminIdleWarning() {
  const old = document.getElementById('adminIdleWarning');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'adminIdleWarning';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 2147483646;
    background: rgba(10,20,35,.85);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    font-family: Inter, system-ui, -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="
      width: min(440px, 100%);
      background: #fff; border-radius: 22px;
      padding: 32px 28px 28px;
      box-shadow: 0 30px 90px rgba(0,0,0,.5);
      text-align: center;
    ">
      <div style="font-size: 52px; margin-bottom: 14px;">⏰</div>
      <h2 style="
        margin: 0 0 12px;
        color: #b45309; font-size: 22px; font-weight: 900;
      ">Sesi Hampir Berakhir</h2>
      <p style="
        color: #475569; font-size: 14.5px;
        line-height: 1.65; margin: 0 0 22px;
      ">
        Anda tidak ada aktivitas selama 14 menit.<br>
        Sesi akan otomatis berakhir dalam <b>1 menit</b>.
      </p>
      <button id="btnAdminStay" style="
        width: 100%; padding: 14px;
        background: linear-gradient(135deg, #16a34a, #059669);
        color: #fff; border: 0; border-radius: 12px;
        font-size: 15px; font-weight: 800;
        cursor: pointer; font-family: inherit;
        box-shadow: 0 10px 24px rgba(5,150,105,.28);
      ">✅ Saya Masih di Sini</button>
      <button id="btnAdminLogoutNow" style="
        width: 100%; padding: 12px; margin-top: 10px;
        background: #f1f5f9; color: #475569;
        border: 0; border-radius: 12px;
        font-size: 13px; font-weight: 700;
        cursor: pointer; font-family: inherit;
      ">🚪 Logout Sekarang</button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('btnAdminStay').onclick = () => {
    overlay.remove();
    __adminWarningShown = false;
    __resetAdminIdleTimer();
  };

  document.getElementById('btnAdminLogoutNow').onclick = () => {
    overlay.remove();
    if (typeof adminLogout === 'function') {
      try { adminLogout(); } catch (e) {}
    }
  };
}

function __startAdminIdleTracking() {
  // Skip kalau bukan mode admin
  if (typeof isAdminUrl !== 'function' || !isAdminUrl()) return;

  // Prevent duplicate listeners
  if (window.__adminIdleListenersAttached) return;
  window.__adminIdleListenersAttached = true;

  const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'click', 'scroll'];
  events.forEach(evt => {
    document.addEventListener(evt, __resetAdminIdleTimer, { passive: true });
  });

  __resetAdminIdleTimer();
  console.log('[ADMIN] ⏰ Session timeout aktif (15 menit idle)');
}

function __stopAdminIdleTracking() {
  clearTimeout(__adminIdleTimer);
  clearTimeout(__adminWarningTimer);
  __adminIdleTimer = null;
  __adminWarningTimer = null;
  window.__adminIdleListenersAttached = false;
  const warn = document.getElementById('adminIdleWarning');
  if (warn) warn.remove();
}

window.__resetAdminIdleTimer = __resetAdminIdleTimer;
window.__startAdminIdleTracking = __startAdminIdleTracking;
window.__stopAdminIdleTracking = __stopAdminIdleTracking;
console.log('[ADMIN] ✓ Loaded — lock + 2 passwords + login gate + monitoring + chat + allow_retake + unread + cleanup + timer + grouped results + cache optimized');
