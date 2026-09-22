/* ============================================================
   js/00d-firebase.js
   - Sync lock state & password antar device via Firebase
   - 🔒 SECURITY FIX [2026-09-22]:
     * P1-6: Fail-closed — password/lock tidak punya fallback
     * P1-7: Auto-register device_owners (untuk rules baru)
     * P1-8: Guard anti double-init
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyDoa8VnRk7SyBJxmD1E06KmACZsMJEXyMk",
  authDomain: "sgs-psikotes.firebaseapp.com",
  databaseURL: "https://sgs-psikotes-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sgs-psikotes",
  storageBucket: "sgs-psikotes.firebasestorage.app",
  messagingSenderId: "1015639764470",
  appId: "1:1015639764470:web:0d6090b3adcf61d3a7ebd7"
};

/* ============================================================
   STATE — FAIL-CLOSED
   null = belum sync → anggap LOCKED (fail-closed)
   ============================================================ */
window.__cloudState = {
  lock:      null,   // null = unknown → treat as locked
  freshPwd:  null,
  usedPwd:   null,
  ready:     false,
  error:     null,
};

/* ============================================================
   ANONYMOUS AUTH
   ============================================================ */
function initAnonymousAuth() {
  return new Promise((resolve) => {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      resolve(null);
      return;
    }
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log('[AUTH] User login:', user.uid.slice(0, 8), user.isAnonymous ? '(anon)' : '(email)');
        unsubscribe();
        resolve(user);
      } else {
        firebase.auth().signInAnonymously()
          .catch((err) => {
            console.warn('[AUTH] Anonymous gagal:', err.message);
            unsubscribe();
            resolve(null);
          });
      }
    });
    setTimeout(() => {
      unsubscribe();
      resolve(firebase.auth().currentUser);
    }, 8000);
  });
}

/* ============================================================
   🔒 P1-7: REGISTER device_owners → uid
   Wajib sebelum kandidat boleh write apa pun.
   ============================================================ */
async function ensureDeviceOwnership(deviceId) {
  if (!deviceId) return false;
  const user = firebase.auth().currentUser;
  if (!user) return false;
  const uid = user.uid;
  try {
    const ref = firebase.database().ref('device_owners/' + deviceId);
    const snap = await ref.once('value');
    if (snap.exists() && snap.val() === uid) return true;
if (snap.exists() && snap.val() !== uid) {
  // Admin login di device yang pernah dipakai kandidat → normal, skip tanpa warning
  return true;
}
    await ref.set(uid);
    console.log('[OWNERSHIP] ✅ Registered:', deviceId.slice(-8), '→', uid.slice(0, 8));
    return true;
  } catch (e) {
    console.warn('[OWNERSHIP] Gagal register:', e.message);
    return false;
  }
}

window.initAnonymousAuth = initAnonymousAuth;
window.ensureDeviceOwnership = ensureDeviceOwnership;

/* ============================================================
   INIT FIREBASE
   ============================================================ */
function initFirebase() {
  if (window.__firebaseInitialized) {
    console.log('[FIREBASE] Sudah init, skip');
    return;
  }
  window.__firebaseInitialized = true;

  if (typeof firebase === 'undefined') {
    console.warn('[FIREBASE] SDK belum ke-load');
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    const db = firebase.database();

    let __fbStateRefs = [];

    function __detachFbListeners() {
      __fbStateRefs.forEach(({ ref, cb }) => {
        try { ref.off('value', cb); } catch (e) {}
      });
      __fbStateRefs = [];
    }

    function __attachFbListeners() {
      __detachFbListeners();

      let __lastSync = { lock: null, freshPwd: null, usedPwd: null };

      function __handleStateChange() {
        const newLock     = window.__cloudState.lock;
        const newFreshPwd = window.__cloudState.freshPwd;
        const newUsedPwd  = window.__cloudState.usedPwd;

        const changed =
          __lastSync.lock     !== newLock ||
          __lastSync.freshPwd !== newFreshPwd ||
          __lastSync.usedPwd  !== newUsedPwd;

        const isReady = (newLock !== null) && (newFreshPwd !== null) && (newUsedPwd !== null);
        window.__cloudState.ready = isReady;

        if (changed) {
          __lastSync = { lock: newLock, freshPwd: newFreshPwd, usedPwd: newUsedPwd };
          console.log('[FIREBASE] Sync:', { lock: newLock, fresh: !!newFreshPwd, used: !!newUsedPwd, ready: isReady });

          const panel = document.getElementById('adminPanelOverlay');
          if (panel && typeof renderAdminPanel === 'function') renderAdminPanel();

          // 🔔 Dispatch event supaya login screen bisa cek kapan cloud ready
          try {
            window.dispatchEvent(new CustomEvent('cloudStateReady', { detail: { ready: isReady } }));
          } catch (e) {}
        }
      }

      const lockRef = db.ref('sgs_state/lock');
      const lockCb  = s => { window.__cloudState.lock = s.val() === true; __handleStateChange(); };
      lockRef.on('value', lockCb, err => { window.__cloudState.error = err.message; console.warn('[FIREBASE] lock err:', err.message); });
      __fbStateRefs.push({ ref: lockRef, cb: lockCb });

      const freshRef = db.ref('sgs_state/freshPwd');
      const freshCb  = s => { window.__cloudState.freshPwd = s.val() || null; __handleStateChange(); };
      freshRef.on('value', freshCb, err => { window.__cloudState.error = err.message; console.warn('[FIREBASE] freshPwd err:', err.message); });
      __fbStateRefs.push({ ref: freshRef, cb: freshCb });

      const usedRef = db.ref('sgs_state/usedPwd');
      const usedCb  = s => { window.__cloudState.usedPwd = s.val() || null; __handleStateChange(); };
      usedRef.on('value', usedCb, err => { window.__cloudState.error = err.message; console.warn('[FIREBASE] usedPwd err:', err.message); });
      __fbStateRefs.push({ ref: usedRef, cb: usedCb });
    }

    __attachFbListeners();

  firebase.auth().onAuthStateChanged((user) => {
  const type = user ? (user.isAnonymous ? 'anonim' : 'email') : 'logout';
  console.log('[FIREBASE] 🔄 Auth changed:', type);

  // 🆕 Kalau user logout (null) → detach listener, JANGAN re-attach
  if (!user) {
    __detachFbListeners();
    console.log('[FIREBASE] 🔇 Listeners detached (user logout)');
    return;
  }

  setTimeout(__attachFbListeners, 400);
});

    console.log('[FIREBASE] ✓ Initialized (auth-aware + fail-closed)');
  } catch (e) {
    console.error('[FIREBASE] Init error:', e);
    window.__firebaseInitialized = false;
  }
}

/* ============================================================
   SETTERS (admin only)
   ============================================================ */
async function setLockStateCloud(locked) {
  if (typeof firebase === 'undefined') return;
  await firebase.database().ref('sgs_state/lock').set(locked === true);
  console.log('[FIREBASE] ✅ Lock sync:', locked);
}

async function setFreshPwdCloud(pwd) {
  if (!pwd || pwd.length < 6) throw new Error('Password minimal 6 karakter');
  await firebase.database().ref('sgs_state/freshPwd').set(pwd);
  console.log('[FIREBASE] ✅ Fresh pwd sync');
}

async function setUsedPwdCloud(pwd) {
  if (!pwd || pwd.length < 6) throw new Error('Password minimal 6 karakter');
  await firebase.database().ref('sgs_state/usedPwd').set(pwd);
  console.log('[FIREBASE] ✅ Used pwd sync');
}

/* ============================================================
   🔒 GETTERS — FAIL-CLOSED
   ============================================================ */
function getCloudLockState() {
  // Kalau belum ready → anggap terkunci (fail-closed)
  if (!window.__cloudState.ready) return true;
  return window.__cloudState.lock === true;
}

function getCloudFreshPwd() {
  if (!window.__cloudState.ready) return null;
  return window.__cloudState.freshPwd || null;
}

function getCloudUsedPwd() {
  if (!window.__cloudState.ready) return null;
  return window.__cloudState.usedPwd || null;
}

function isCloudReady() {
  return window.__cloudState.ready === true;
}

/* ============================================================
   ADMIN TOGGLE
   ============================================================ */
async function toggleLockState() {
  const cb = document.getElementById('adminLockCheckbox');
  if (!cb) return;
  const locked = cb.checked;
  await setLockStateCloud(locked);
  localStorage.setItem('_sgs_lock', locked ? '1' : '0');
  renderAdminPanel();
}

async function regenFreshPwd() {
  if (typeof sgsConfirm === 'function') {
    const ok = await sgsConfirm('Generate password FRESH baru?', { title: 'Regenerate FRESH' });
    if (!ok) return;
  }
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let pwd = 'SGS-F-';
  for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  await setFreshPwdCloud(pwd);
  localStorage.setItem('_sgs_pwd_fresh', pwd);
  renderAdminPanel();
}

async function regenUsedPwd() {
  if (typeof sgsConfirm === 'function') {
    const ok = await sgsConfirm('Generate password USED baru?', { title: 'Regenerate USED' });
    if (!ok) return;
  }
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let pwd = 'SGS-U-';
  for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  await setUsedPwdCloud(pwd);
  localStorage.setItem('_sgs_pwd_used', pwd);
  renderAdminPanel();
}

/* ============================================================
   OVERRIDE
   ============================================================ */
window.getLockState = getCloudLockState;
window.getFreshPwd  = getCloudFreshPwd;
window.getUsedPwd   = getCloudUsedPwd;
window.isCloudReady = isCloudReady;
window.toggleLockState = toggleLockState;
window.regenFreshPwd   = regenFreshPwd;
window.regenUsedPwd    = regenUsedPwd;

/* ============================================================
   BOOTSTRAP
   ============================================================ */
async function bootstrapFirebaseWithAuth() {
  const isAdminMode = (typeof isAdminUrl === 'function') && isAdminUrl();

  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  if (!isAdminMode && typeof firebase !== 'undefined' && firebase.auth) {
    try {
      if (!firebase.auth().currentUser) {
        await firebase.auth().signInAnonymously();
        console.log('[FIREBASE] ✓ Anonymous login berhasil');
      }
    } catch (e) {
      console.warn('[FIREBASE] Anonymous gagal:', e.message);
    }
  }

  initFirebase();

  // 🔒 Setelah firebase init, register device ownership
  const did = localStorage.getItem('_sgs_device_id');
  if (did && firebase.auth().currentUser) {
    await ensureDeviceOwnership(did);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapFirebaseWithAuth);
} else {
  setTimeout(bootstrapFirebaseWithAuth, 100);
}

window.initFirebase     = initFirebase;
window.setLockStateCloud = setLockStateCloud;
window.setFreshPwdCloud  = setFreshPwdCloud;
window.setUsedPwdCloud   = setUsedPwdCloud;

console.log('[FIREBASE] ✓ Loaded — secured + fail-closed');
