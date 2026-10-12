/* ============================================================
   CHECK PASSWORD — Login utama (SECURED)
   ------------------------------------------------------------
   🔒 SECURITY FIX [2026-09-22]:
   - P1-1: Hapus fallback password default
   - P1-4: Cek finished/disqualified server-side
   - P1-6: Fail-closed kalau cloud belum ready
   ============================================================ */
/* ============================================================
   WRONG PASSWORD EFFECTS
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
  }, 950);
}

function runWrongPasswordEffects() {
  passwordWrongImageEffect();
  if (typeof playWrongPasswordAlarm === 'function') playWrongPasswordAlarm();
}

async function checkPassword() {
  const input = document.getElementById('passwordInput');
  const error = document.getElementById('passwordError');
  const value = (input.value || '').trim();

  if (!value) {
    error.textContent = 'Masukkan kode akses terlebih dahulu.';
    error.style.color = '#ff6b6b';
    input.focus();
    return;
  }

  /* ---------- 🔒 CEK 0: Cloud ready? ---------- */
  if (typeof window.isCloudReady === 'function' && !window.isCloudReady()) {
    error.textContent = '⚠️ Sistem sedang memuat konfigurasi. Tunggu beberapa detik lalu coba lagi.';
    error.style.color = '#fbbf24';
    return;
  }

  const deviceId = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DEVICE_ID);

  /* ---------- 🔒 CEK 1: Lock server-side ---------- */
  let lockedNow = null;
  if (typeof window.checkLockServer === 'function') {
    const lockRes = await window.checkLockServer();
    if (lockRes.status === 'ok') lockedNow = lockRes.locked;
  }
  if (lockedNow === null && typeof window.getLockState === 'function') {
    lockedNow = window.getLockState();
  }
  if (lockedNow === true) {
    error.textContent = '🔒 Login sedang dikunci oleh admin. Hubungi panitia.';
    error.style.color = '#ff6b6b';
    input.value = '';
    input.focus();
    return;
  }

    /* ---------- 🔒 CEK 2: Device finished server-side ---------- */
  /* 🆕 Skip seluruh cek ini kalau sedang retake mode */
  const __isRetakeFlow = localStorage.getItem('_sgs_retake_mode') === '1' ||
                         localStorage.getItem('_sgs_retake_skip_form') === '1';

  let serverStatus = null;
  if (!__isRetakeFlow && deviceId && typeof window.checkDeviceStatusServer === 'function') {
    serverStatus = await window.checkDeviceStatusServer(deviceId);
  }

  const finishedServer = !__isRetakeFlow && (
    (serverStatus && serverStatus.finished === true) ||
    (localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DEVICE_FINISHED) === '1')
  );

  if (finishedServer) {
    // 🔒 Sync ke server kalau ternyata lokal lebih dulu
    if (deviceId && typeof window.syncFinishedStateToServer === 'function') {
      try { await window.syncFinishedStateToServer(deviceId); } catch (e) {}
    }
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

  const disqualifiedServer =
    (serverStatus && serverStatus.disqualified === true) ||
    (localStorage.getItem('_sgs_disqualified') === '1');

  if (disqualifiedServer) {
    if (typeof showRequestAccessScreen === 'function') {
      const pwdScreen = document.getElementById('passwordScreen');
      if (pwdScreen) pwdScreen.classList.add('hidden');
      showRequestAccessScreen();
      return;
    }
  }

  /* ---------- 🔒 CEK 3: Ambil password aktif dari cloud ---------- */
  const used = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USED_PRAGAS) === '1';
  const validPwd = used
    ? (typeof window.getUsedPwd === 'function' ? window.getUsedPwd() : null)
    : (typeof window.getFreshPwd === 'function' ? window.getFreshPwd() : null);

  if (!validPwd) {
    error.textContent = '⚠️ Password belum tersedia di server. Refresh halaman atau hubungi admin.';
    error.style.color = '#fbbf24';
    return;
  }

  /* ---------- CEK 4: Cocok? ---------- */
  if (value !== validPwd) {
    error.textContent = 'Kode akses salah!';
    if (typeof runWrongPasswordEffects === 'function') {
  runWrongPasswordEffects();
} else if (typeof playWrongPasswordAlarm === 'function') {
  playWrongPasswordAlarm();
}
    input.focus();
    input.select();
    return;
  }

  /* ---------- LOGIN SUKSES ---------- */
  error.textContent = '';
  if (typeof playFuturisticSound === 'function') playFuturisticSound();

  document.getElementById('welcomeMessage').classList.add('show');
  document.getElementById('passwordLogo').classList.add('small');
  document.getElementById('passwordForm').style.opacity = '0';
  document.getElementById('passwordForm').style.pointerEvents = 'none';

  setTimeout(() => {
    document.getElementById('passwordScreen').classList.add('hidden');

    let identitySaved = null;
    try {
      const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.IDENTITY);
      if (raw) identitySaved = JSON.parse(raw);
    } catch (e) {}

    // 🆕 Cek retake mode
    let retakeData = null;
    try {
      const raw = sessionStorage.getItem('__sgs_retake');
      if (raw) retakeData = JSON.parse(raw);
    } catch (e) {}

      if (retakeData && retakeData.name && Array.isArray(retakeData.tests)) {
      (async () => {
        let restored = false;
        try {
          /* 🆕 Baca 1 device spesifik — rules allow kandidat baca
             sgs_state/sessions/{deviceId} (bukan list) */
          const targetDeviceId = retakeData.deviceId ||
            localStorage.getItem('_sgs_device_id');

          if (!targetDeviceId) {
            throw new Error('deviceId tidak tersedia di URL / localStorage');
          }

          const snap = await firebase.database()
            .ref('sgs_state/sessions/' + targetDeviceId)
            .once('value');

          const s = snap.val();

          if (!s || !s.name) {
            throw new Error('Session tidak ditemukan untuk device ' + targetDeviceId.slice(-8));
          }

          /* Verify nama cocok */
          const nameLower = String(retakeData.name).toLowerCase().trim();
          const sNameLower = String(s.name).toLowerCase().trim();

          if (sNameLower !== nameLower) {
            throw new Error('Nama tidak cocok: "' + s.name + '" vs "' + retakeData.name + '"');
          }

          const identity = {
            name: s.name,
            nickname: s.nickname || s.name.split(' ')[0],
            email: s.email || '',
            phone: s.phone || '',
            position: s.position || retakeData.position || '',
            dob: s.dob || '',
            age: s.age || '',
            status: s.status || '',
            addressKTP: s.addressKTP || '',
            addressCurrent: s.addressCurrent || '',
            education: s.education || '',
            teacherLevel: s.teacherLevel || '',
            techRole: s.techRole || '',
            date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
          };

          window.appState.identity = identity;
          try { localStorage.setItem('identity', JSON.stringify(identity)); } catch (e) {}

          window.appState.selectedTests = retakeData.tests.slice();
          try { localStorage.setItem('selectedTests', JSON.stringify(retakeData.tests)); } catch (e) {}

          window.appState.completed = window.appState.completed || {};
          retakeData.tests.forEach(t => { window.appState.completed[t] = false; });
          try { localStorage.setItem('completed', JSON.stringify(window.appState.completed)); } catch (e) {}

          window.appState.showTestCards = true;

          restored = true;
        } catch (e) {
          console.warn('[RETAKE] Gagal restore identity:', e);
        }

        // Clear retake flag
        try { sessionStorage.removeItem('__sgs_retake'); } catch (e) {}

        if (restored) {
          console.log('[RETAKE] ✅ Identity restored, langsung ke tes');

          try {
            localStorage.removeItem('_sgs_retake_mode');
            localStorage.removeItem('_sgs_retake_skip_form');
          } catch (e) {}

          if (typeof window.renderHome === 'function') window.renderHome();
          else renderIdentityForm();
        } else {
          console.warn('[RETAKE] Identity tidak ditemukan, fallback ke form');

          try {
            localStorage.removeItem('_sgs_retake_mode');
            localStorage.removeItem('_sgs_retake_skip_form');
          } catch (e) {}

          alert('⚠️ Data identitas tidak ditemukan di sistem.\n\nSilakan isi form identitas untuk melanjutkan.');
          renderIdentityForm();
        }
      })();
      return;  // Skip flow normal
    }


    const hasValidIdentity =
      identitySaved &&
      typeof identitySaved === 'object' &&
      typeof identitySaved.name === 'string' &&
      identitySaved.name.trim().length > 0;

    if (hasValidIdentity) {
      window.appState = window.appState || {};
      window.appState.identity = identitySaved;
      if (typeof window.renderHome === 'function') window.renderHome();
      else renderIdentityForm();
    } else {
      renderIdentityForm();
    }
  }, APP_CONFIG.TIMING.SPLASH_DELAY);
}

window.checkPassword = checkPassword;
