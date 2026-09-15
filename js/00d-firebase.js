/* ============================================================
   js/00d-firebase.js
   - Sync lock state & password antar device via Firebase
   ============================================================ */

/* ============================================================
   KONFIGURASI FIREBASE
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
   STATE CACHE — hasil sync dari Firebase
   ============================================================ */
window.__cloudState = {
  lock: false,
  freshPwd: '',
  usedPwd: '',
  ready: false,
};

/* ============================================================
   INIT FIREBASE
   ============================================================ */
function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('[FIREBASE] SDK belum ke-load — cek CDN di index.html');
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    const db = firebase.database();
    const ref = db.ref('sgs_state');

    // Listen perubahan real-time
    ref.on('value', (snapshot) => {
      const data = snapshot.val() || {};

      window.__cloudState.lock = data.lock === true;
      window.__cloudState.freshPwd = data.freshPwd || '';
      window.__cloudState.usedPwd = data.usedPwd || '';
      window.__cloudState.ready = true;

      console.log('[FIREBASE] 🔄 Sync:', {
        lock: window.__cloudState.lock,
        freshPwd: window.__cloudState.freshPwd,
        usedPwd: window.__cloudState.usedPwd
      });

      // Refresh admin panel kalau terbuka
      const panel = document.getElementById('adminPanelOverlay');
      if (panel && typeof renderAdminPanel === 'function') {
        renderAdminPanel();
      }
    });

    console.log('[FIREBASE] ✓ Initialized');

  } catch (e) {
    console.error('[FIREBASE] Init error:', e);
  }
}

/* ============================================================
   SET LOCK STATE — sync ke cloud
   ============================================================ */
async function setLockStateCloud(locked) {
  if (typeof firebase === 'undefined') return;
  try {
    await firebase.database().ref('sgs_state/lock').set(locked === true);
    console.log('[FIREBASE] ✅ Lock sync:', locked);
  } catch (e) {
    console.error('[FIREBASE] Gagal set lock:', e);
    alert('⚠️ Gagal sync ke server: ' + e.message);
  }
}

/* ============================================================
   SET PASSWORD — sync ke cloud
   ============================================================ */
async function setFreshPwdCloud(pwd) {
  try {
    await firebase.database().ref('sgs_state/freshPwd').set(pwd);
    console.log('[FIREBASE] ✅ Fresh pwd sync');
  } catch (e) {
    console.error('[FIREBASE] Gagal set fresh:', e);
    alert('⚠️ Gagal sync: ' + e.message);
  }
}

async function setUsedPwdCloud(pwd) {
  try {
    await firebase.database().ref('sgs_state/usedPwd').set(pwd);
    console.log('[FIREBASE] ✅ Used pwd sync');
  } catch (e) {
    console.error('[FIREBASE] Gagal set used:', e);
    alert('⚠️ Gagal sync: ' + e.message);
  }
}

/* ============================================================
   GET STATE — dari cloud, fallback ke localStorage
   ============================================================ */
function getCloudLockState() {
  return window.__cloudState.ready ? window.__cloudState.lock : false;
}

function getCloudFreshPwd() {
  if (window.__cloudState.ready && window.__cloudState.freshPwd) {
    return window.__cloudState.freshPwd;
  }
  return localStorage.getItem('_sgs_pwd_fresh') || 'SGS-REC-Assessment84';
}

function getCloudUsedPwd() {
  if (window.__cloudState.ready && window.__cloudState.usedPwd) {
    return window.__cloudState.usedPwd;
  }
  return localStorage.getItem('_sgs_pwd_used') || 'SGS-HC-Talent27';
}

/* ============================================================
   ADMIN — Toggle Lock
   ============================================================ */
async function toggleLockState() {
  const cb = document.getElementById('adminLockCheckbox');
  if (!cb) return;

  const locked = cb.checked;
  console.log('[ADMIN] Toggle lock →', locked);

  // Update ke cloud
  await setLockStateCloud(locked);

  // Cache di localStorage
  localStorage.setItem('_sgs_lock', locked ? '1' : '0');

  // Refresh panel
  renderAdminPanel();
}

/* ============================================================
   ADMIN — Regenerate Passwords
   ============================================================ */
async function regenFreshPwd() {
  if (!confirm('Generate password FRESH baru?')) return;
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let pwd = 'SGS-F-';
  for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  
  await setFreshPwdCloud(pwd);
  localStorage.setItem('_sgs_pwd_fresh', pwd);
  renderAdminPanel();
}

async function regenUsedPwd() {
  if (!confirm('Generate password USED baru?')) return;
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let pwd = 'SGS-U-';
  for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  
  await setUsedPwdCloud(pwd);
  localStorage.setItem('_sgs_pwd_used', pwd);
  renderAdminPanel();
}

async function setFreshPwdManual() {
  const input = document.getElementById('adminFreshInput');
  if (!input) return;
  const val = (input.value || '').trim();
  if (val.length < 6) { alert('Minimal 6 karakter'); return; }
  await setFreshPwdCloud(val);
  localStorage.setItem('_sgs_pwd_fresh', val);
  alert('✅ Password FRESH diganti');
  renderAdminPanel();
}

async function setUsedPwdManual() {
  const input = document.getElementById('adminUsedInput');
  if (!input) return;
  const val = (input.value || '').trim();
  if (val.length < 6) { alert('Minimal 6 karakter'); return; }
  await setUsedPwdCloud(val);
  localStorage.setItem('_sgs_pwd_used', val);
  alert('✅ Password USED diganti');
  renderAdminPanel();
}

/* ============================================================
   OVERRIDE — supaya aplikasi pakai versi cloud
   ============================================================ */
window.getLockState = getCloudLockState;
window.getFreshPwd = getCloudFreshPwd;
window.getUsedPwd = getCloudUsedPwd;
window.toggleLockState = toggleLockState;
window.regenFreshPwd = regenFreshPwd;
window.regenUsedPwd = regenUsedPwd;
window.setFreshPwdManual = setFreshPwdManual;
window.setUsedPwdManual = setUsedPwdManual;

/* ============================================================
   INIT SAAT DOM READY
   ============================================================ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFirebase);
} else {
  setTimeout(initFirebase, 100);
}

window.initFirebase = initFirebase;
window.setLockStateCloud = setLockStateCloud;
window.setFreshPwdCloud = setFreshPwdCloud;
window.setUsedPwdCloud = setUsedPwdCloud;

console.log('[FIREBASE] ✓ Loaded');
