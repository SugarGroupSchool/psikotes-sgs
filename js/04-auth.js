/* =========================================================
   AUTHENTICATION — Lock Control + Fresh/Used password
   ========================================================= */

/* ============================================================
   CHECK PASSWORD — Login utama
   ============================================================ */
function checkPassword() {
  const input = document.getElementById('passwordInput');
  const error = document.getElementById('passwordError');
  const value = (input.value || '').trim();

  /* ---------- CEK 1: LOCK AKTIF? ---------- */
  if (typeof window.getLockState === 'function' && window.getLockState()) {
    error.textContent = '🔒 Login sedang dikunci oleh admin. Hubungi panitia.';
    error.style.color = '#ff6b6b';
    input.value = '';
    input.focus();
    return;
  }

/* ---------- CEK 2: DEVICE SUDAH FINISHED? ---------- */
if (localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DEVICE_FINISHED) === '1') {
  if (typeof showRequestAccessScreen === 'function') {
    const pwdScreen = document.getElementById('passwordScreen');
    if (pwdScreen) pwdScreen.classList.add('hidden');
    showRequestAccessScreen();
    return;
  }
  error.textContent = 'Perangkat ini sudah menyelesaikan tes. Hubungi admin.';
  error.style.color = '#ff6b6b';
  input.value = '';
  input.focus();
  return;
}

  /* ---------- CEK 3: TENTUKAN PASSWORD YANG BERLAKU ---------- */
  const used = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USED_PRAGAS) === '1';
  const validPwd = used
    ? (typeof window.getUsedPwd === 'function' ? window.getUsedPwd() : APP_CONFIG.DEFAULT_USED_PWD)
    : (typeof window.getFreshPwd === 'function' ? window.getFreshPwd() : APP_CONFIG.DEFAULT_FRESH_PWD);

  /* ---------- CEK 4: PASSWORD COCOK? ---------- */
  if (value !== validPwd) {
    error.textContent = 'Kode akses salah!';
    runWrongPasswordEffects();
    input.focus();
    input.select();
    return;
  }

  /* ---------- LOGIN SUKSES ---------- */
  error.textContent = '';
  playFuturisticSound();

  document.getElementById('welcomeMessage').classList.add('show');
  document.getElementById('passwordLogo').classList.add('small');
  document.getElementById('passwordForm').style.opacity = '0';
  document.getElementById('passwordForm').style.pointerEvents = 'none';

  setTimeout(() => {
    document.getElementById('passwordScreen').classList.add('hidden');

    /* Cek identity: kalau sudah ada → resume, kalau belum → form */
    let identitySaved = null;
    try {
      const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.IDENTITY);
      if (raw) identitySaved = JSON.parse(raw);
    } catch (e) {}

    const hasValidIdentity =
      identitySaved &&
      typeof identitySaved === 'object' &&
      typeof identitySaved.name === 'string' &&
      identitySaved.name.trim().length > 0;

    if (hasValidIdentity) {
      console.log('[AUTH] 🔄 Resume — langsung ke home');
      window.appState = window.appState || {};
      window.appState.identity = identitySaved;
      if (typeof window.renderHome === 'function') {
        window.renderHome();
      } else {
        renderIdentityForm();
      }
    } else {
      console.log('[AUTH] 🆕 Fresh — tampilkan form identity');
      renderIdentityForm();
    }
  }, APP_CONFIG.TIMING.SPLASH_DELAY);
}

/* ============================================================
   EFFECTS
   ============================================================ */
function passwordWrongImageEffect() {
  const screen = document.getElementById('passwordScreen');
  document.querySelectorAll('img').forEach(img => {
    img.classList.remove('password-image-error');
    void img.offsetWidth;
    img.classList.add('password-image-error');
  });
  if (screen) {
    screen.classList.remove('password-screen-error');
    void screen.offsetWidth;
    screen.classList.add('password-screen-error');
  }
  setTimeout(() => {
    document.querySelectorAll('img').forEach(i => i.classList.remove('password-image-error'));
    if (screen) screen.classList.remove('password-screen-error');
  }, APP_CONFIG.TIMING.AUTH_SOUND_MS);
}

function runWrongPasswordEffects() {
  passwordWrongImageEffect();
  if (typeof playWrongPasswordAlarm === 'function') playWrongPasswordAlarm();
}

function resetToLogin() {
  document.getElementById('passwordScreen').classList.remove('hidden');
  document.getElementById('passwordForm').style.opacity = '1';
  document.getElementById('passwordForm').style.pointerEvents = 'auto';
  document.getElementById('passwordInput').value = '';
  document.getElementById('passwordError').textContent = '';
  document.getElementById('welcomeMessage').classList.remove('show');
  document.getElementById('passwordLogo').classList.remove('small');
  document.getElementById('app').innerHTML = '';
  setTimeout(() => document.getElementById('passwordInput')?.focus(), 150);
}

/* ============================================================
   EVENT BINDINGS
   ============================================================ */
document.addEventListener('dragstart', e => {
  const input = document.getElementById('passwordInput');
  if (input) {
    input.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        checkPassword();
      }
    });
    setTimeout(() => input.focus(), 100);
  }
});

document.addEventListener('dragstart', e => {
  if (e.target instanceof HTMLImageElement) e.preventDefault();
});
document.addEventListener('contextmenu', e => e.preventDefault());

console.log('[AUTH] ✓ Loaded');
