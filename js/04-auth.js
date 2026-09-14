/* =========================================================
   AUTHENTICATION — Password Screen
   ========================================================= */

function getActivePassword() {
  const K = APP_CONFIG.STORAGE_KEYS;
  const used = localStorage.getItem(K.USED_PRAGAS) === '1';

  // 🔐 Pakai password acak (fungsi dari 00b-admin.js)
  if (typeof window.getFreshPassword === 'function' && typeof window.getUsedPassword === 'function') {
    return used ? window.getUsedPassword() : window.getFreshPassword();
  }

  // Fallback ke hardcoded (kalau 00b-admin.js belum load)
  return used ? APP_CONFIG.PASSWORDS.USED : APP_CONFIG.PASSWORDS.FRESH;
}

function checkPassword() {
  const input = document.getElementById('passwordInput');
  const error = document.getElementById('passwordError');
  const value = (input.value || '').trim();

  if (value === getActivePassword()) {
    error.textContent = '';
    playFuturisticSound();

    document.getElementById('welcomeMessage').classList.add('show');
    document.getElementById('passwordLogo').classList.add('small');
    document.getElementById('passwordForm').style.opacity = '0';
    document.getElementById('passwordForm').style.pointerEvents = 'none';

setTimeout(() => {
  document.getElementById('passwordScreen').classList.add('hidden');

  // ✅ Cek: apakah identity sudah ada?
  let identitySaved = null;
  try {
    const raw = localStorage.getItem('identity');
    if (raw) identitySaved = JSON.parse(raw);
  } catch (e) {}

  const hasValidIdentity =
    identitySaved &&
    typeof identitySaved === 'object' &&
    typeof identitySaved.name === 'string' &&
    identitySaved.name.trim().length > 0;

  if (hasValidIdentity) {
    // → RESUME MODE: kandidat lanjut setelah diskualifikasi
    console.log('[AUTH] 🔄 Identity ditemukan — langsung ke home');
    if (typeof window.renderHome === 'function') {
      window.renderHome();
    } else {
      renderIdentityForm();
    }
  } else {
    // → FRESH MODE: kandidat baru
    console.log('[AUTH] 🆕 Fresh kandidat — tampilkan form identity');
    renderIdentityForm();
  }
}, APP_CONFIG.TIMING.SPLASH_DELAY);

  } else {
    error.textContent = 'Kode akses salah!';
    runWrongPasswordEffects();
    input.focus();
    input.select();
  }
}

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
  playWrongPasswordAlarm();
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

/* Event bindings */
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('passwordInput');
  const btn = document.querySelector('.password-submit');

  if (input) {
    input.addEventListener('keypress', e => {
      if (e.key === 'Enter') checkPassword();
    });
    setTimeout(() => input.focus(), 100);
  }

  btn?.addEventListener('click', () => {
    setTimeout(() => {
      const err = document.getElementById('passwordError');
      if (err && err.textContent.trim() !== '') {
        // efek sudah dijalankan oleh checkPassword
      }
    }, 100);
  });
});

/* Cegah drag gambar & context menu */
document.addEventListener('dragstart', e => {
  if (e.target instanceof HTMLImageElement) e.preventDefault();
});
document.addEventListener('contextmenu', e => e.preventDefault());

console.log('[AUTH] ✓ Loaded');
