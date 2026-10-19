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
  
  // 1. Paksa putar suara (mungkin diblokir Chrome jika via email autologin)
  try {
    if (typeof playFuturisticSound === 'function') playFuturisticSound();
  } catch (e) {}

  // 2. Cadangan: Bunyikan saat user klik pertama kali (karena Chrome blokir autoplay)
  window.__sgsPendingSound = true;
  const playOnFirstClick = () => {
    if (window.__sgsPendingSound) {
      window.__sgsPendingSound = false;
      try {
        if (typeof playFuturisticSound === 'function') playFuturisticSound();
      } catch (e) {}
    }
    document.removeEventListener('click', playOnFirstClick, true);
    document.removeEventListener('touchstart', playOnFirstClick, true);
  };
  document.addEventListener('click', playOnFirstClick, true);
  document.addEventListener('touchstart', playOnFirstClick, true);

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
          const slug = String(retakeData.name).toLowerCase()
            .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
          if (!slug) throw new Error('Slug kosong');

              /* 🆕 1. Baca status kandidat (permanen, lintas device) */
          let csSnap = await firebase.database()
            .ref('sgs_candidate_status/' + slug).once('value');
          let cs = csSnap.val() || {};

          /* 🆕 Fallback: kalau candidate_status kosong, cari session by name match */
          if (!cs.candidateName) {
            console.log('[RETAKE] candidate_status kosong — fallback ke sessions');
            const sessionsSnap = await firebase.database()
              .ref('sgs_state/sessions').once('value');
            const sessions = sessionsSnap.val() || {};
            const nameTarget = String(retakeData.name).toLowerCase().trim();

            for (const devId in sessions) {
              const s = sessions[devId] || {};
              if (!s.name) continue;
              if (String(s.name).toLowerCase().trim() === nameTarget) {
                cs = {
                  candidateName: s.name,
                  email: s.email || '',
                  candidatePosition: s.position || '',
                  phone: s.phone || '',
                  completed: s.completed || {}
                };
                console.log('[RETAKE] ✅ Fallback dari session:', devId.slice(-8), s.name);
                break;
              }
            }

            /* Sekalian MIRROR ke candidate_status biar retake berikutnya cepat */
            if (cs.candidateName) {
              try {
                await firebase.database()
                  .ref('sgs_candidate_status/' + slug).update({
                    candidateName: cs.candidateName,
                    email: cs.email || '',
                    candidatePosition: cs.candidatePosition || '',
                    phone: cs.phone || '',
                    completed: cs.completed || {},
                    ts: firebase.database.ServerValue.TIMESTAMP
                  });
                console.log('[RETAKE] ✅ Mirror ke candidate_status berhasil');
              } catch (e) {
                console.warn('[RETAKE] Gagal mirror:', e.message);
              }
            }
          }

          if (!cs.candidateName) {
            throw new Error('Data kandidat tidak ditemukan di sistem');
          }

          /* 🆕 2. Validasi nama */
          const nameTarget = String(retakeData.name).toLowerCase().trim();
          const nameDB = String(cs.candidateName).toLowerCase().trim();
          if (nameTarget !== nameDB) {
            throw new Error('Nama tidak cocok: "' + cs.candidateName + '" vs "' + retakeData.name + '"');
          }

          /* 🆕 3. Validasi email (kalau ada di URL & di DB) */
          if (retakeData.email && cs.email) {
            if (String(cs.email).toLowerCase().trim() !== String(retakeData.email).toLowerCase().trim()) {
              throw new Error('Email tidak cocok');
            }
          }

                   /* 🆕 4. Validasi token — baca dari /sgs_retake_tokens/{tokenId} */
          if (retakeData.token) {
            const tkSnap = await firebase.database()
              .ref('sgs_retake_tokens/' + retakeData.token)
              .once('value');
            const tk = tkSnap.val();
            if (!tk) {
              throw new Error('Token tidak valid atau tidak ditemukan');
            }

            const nowSec = Math.floor(Date.now() / 1000);

                                  /* Time-window validation */
            if (tk.scheduledAt && nowSec < tk.scheduledAt) {
              // JANGAN throw error! Biarkan masuk agar bisa tampilkan countdown
              console.log('[RETAKE] ⏳ Belum waktunya. Countdown akan ditampilkan.');
            }
            if (tk.expiresAt && nowSec > tk.expiresAt) {
              // Ini baru boleh throw karena link benar-benar mati
              throw new Error('Link sudah kadaluarsa pada ' +
                new Date(tk.expiresAt * 1000).toLocaleString('id-ID'));
            }

            /* Override data dari Firebase — anti tamper URL params */
            if (tk.name) retakeData.name = tk.name;
            if (tk.position !== undefined) retakeData.position = tk.position || '';
            if (Array.isArray(tk.tests) && tk.tests.length) retakeData.tests = tk.tests.slice();
            if (tk.tahap) retakeData.tahap = tk.tahap;

            console.log('[RETAKE] ✅ Token valid — tahap:', tk.tahap,
              '| expires:', new Date(tk.expiresAt * 1000).toLocaleString('id-ID'));
          }

          /* 5. Restore identity dari candidate_status */
          const identity = {
            name: cs.candidateName,
            nickname: cs.nickname || cs.candidateName.split(' ')[0],
            email: cs.email || retakeData.email || '',
            phone: cs.phone || '',
            position: cs.candidatePosition || retakeData.position || '',
            dob: cs.dob || '',
            age: cs.age || '',
            status: cs.maritalStatus || '',
            addressKTP: cs.addressKTP || '',
            addressCurrent: cs.addressCurrent || '',
            education: cs.education || '',
            teacherLevel: cs.teacherLevel || '',
            techRole: cs.techRole || '',
            date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
          };

          window.appState.identity = identity;
          try { localStorage.setItem('identity', JSON.stringify(identity)); } catch (e) {}

          /* 6. Set selectedTests & completed */
          window.appState.selectedTests = retakeData.tests.slice();
          try { localStorage.setItem('selectedTests', JSON.stringify(retakeData.tests)); } catch (e) {}

          window.appState.completed = window.appState.completed || {};
          retakeData.tests.forEach(t => { window.appState.completed[t] = false; });
          /* 🆕 Isi completed dari candidate_status (biar tes lama tetap terkunci) */
          if (cs.completed && typeof cs.completed === 'object') {
            Object.keys(cs.completed).forEach(t => {
              if (cs.completed[t] === true) window.appState.completed[t] = true;
            });
          }
          try { localStorage.setItem('completed', JSON.stringify(window.appState.completed)); } catch (e) {}

          /* 7. Set tahap */
          const __tahap = Math.max(2, parseInt(retakeData.tahap, 10) || 2);
          window.appState.currentTahap = __tahap;
          try { localStorage.setItem('_sgs_current_tahap', String(__tahap)); } catch (e) {}

          /* 🆕 8. Buat/update session di device INI (apapun device-nya) */
          const myDeviceId = localStorage.getItem('_sgs_device_id');
          if (myDeviceId && typeof firebase !== 'undefined' && firebase.apps.length) {
            try {
              await firebase.database()
                .ref('sgs_state/sessions/' + myDeviceId).update({
                  deviceId: myDeviceId,
                  name: identity.name,
                  email: identity.email,
                  position: identity.position,
                  phone: identity.phone,
                  nickname: identity.nickname,
                  completed: window.appState.completed,
                  selectedTests: retakeData.tests,
                  lastSeen: firebase.database.ServerValue.TIMESTAMP,
                  retake_count: __tahap - 1,
                  lastRetakeTahap: __tahap,
                  lastRetakeAt: firebase.database.ServerValue.TIMESTAMP,
                  status: 'active',
                  finished: false,
                  disqualified: false
                });
              console.log('[RETAKE] ✅ Session device ini dibuat:', myDeviceId.slice(-8));
            } catch (e) {
              console.warn('[RETAKE] Gagal buat session baru:', e.message);
            }
          }

          /* 🆕 9. Catat retake_history ke candidate_status */
          try {
            await firebase.database()
              .ref('sgs_candidate_status/' + slug + '/retake_history/' + __tahap)
              .update({
                tahap: __tahap,
                tests: retakeData.tests.slice(),
                activatedAt: firebase.database.ServerValue.TIMESTAMP,
                deviceId: myDeviceId || '',
                status: 'active'
              });
          } catch (e) {
            console.warn('[RETAKE] Gagal catat retake_history:', e.message);
          }

          window.appState.showTestCards = true;
          restored = true;
          console.log('[RETAKE] ✅ Restore berhasil — device:', (myDeviceId || '').slice(-8), '| tahap:', __tahap);

        } catch (e) {
          console.warn('[RETAKE] Gagal restore identity:', e);
        }

        try { sessionStorage.removeItem('__sgs_retake'); } catch (e) {}
        try {
          localStorage.removeItem('_sgs_retake_mode');
          localStorage.removeItem('_sgs_retake_skip_form');
          localStorage.removeItem('_sgs_retake_tahap');
        } catch (e) {}

        if (restored) {
                    /* 🆕 Cek jadwal + expiry */
          const startAt = parseInt(localStorage.getItem('_sgs_schedule_lock') || '0', 10) || 0;
          const expiresAtLS = parseInt(localStorage.getItem('_sgs_schedule_expires') || '0', 10) || 0;

          if (expiresAtLS > 0 && Date.now() > expiresAtLS * 1000) {
            try { localStorage.removeItem('_sgs_schedule_lock'); } catch (e) {}
            try { localStorage.removeItem('_sgs_schedule_expires'); } catch (e) {}
            alert('⌛ Link tes ini sudah kadaluarsa.\n\nSilakan hubungi admin untuk link baru.');
            renderIdentityForm();
            return;
          }

          if (startAt > 0 && Date.now() < startAt * 1000) {
            if (typeof window.__showRetakeCountdown === 'function') {
              window.__showRetakeCountdown(startAt, function () {
                try { localStorage.removeItem('_sgs_schedule_lock'); } catch (e) {}
                if (typeof window.renderHome === 'function') window.renderHome();
              });
              return;
            }
          }
          try { localStorage.removeItem('_sgs_schedule_lock'); } catch (e) {}
          try { localStorage.removeItem('_sgs_schedule_expires'); } catch (e) {}

          if (typeof window.renderHome === 'function') window.renderHome();
          else renderIdentityForm();
        } else {
          console.warn('[RETAKE] Restore gagal — fallback ke form');
          alert('⚠️ Data kandidat tidak ditemukan / tidak cocok.\n\nSilakan isi form identitas untuk melanjutkan.');
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

      // 🆕 Cek jadwal lock — jika user me-refresh halaman saat hitung mundur, jangan bypass!
      const startAtLock = parseInt(localStorage.getItem('_sgs_schedule_lock') || '0', 10) || 0;
      if (startAtLock > 0 && Date.now() < startAtLock * 1000) {
        if (typeof window.__showRetakeCountdown === 'function') {
          window.__showRetakeCountdown(startAtLock, function () {
            try { localStorage.removeItem('_sgs_schedule_lock'); } catch (e) {}
            if (typeof window.renderHome === 'function') window.renderHome();
          });
          return;
        }
      }

      if (typeof window.renderHome === 'function') window.renderHome();
      else renderIdentityForm();
    } else {
      renderIdentityForm();
    }
  }, APP_CONFIG.TIMING.SPLASH_DELAY);
}

window.checkPassword = checkPassword;


/* ============================================================
   🆕 AUTO-LOGIN PINTAR (Countdown + Splash + Anti-Replay)
   ============================================================ */
(function autoLoginFromEmailLink() {
  const url = new URL(window.location.href);
  const autopw = url.searchParams.get('autopw');
  const isRetake = url.searchParams.get('retake') === '1';
  const startRaw = url.searchParams.get('start');
  const scheduledAt = startRaw ? parseInt(startRaw, 10) : 0;

  if (!autopw || !isRetake) return;

  // Hapus autopw & start dari URL segera
  try {
    url.searchParams.delete('autopw');
    window.history.replaceState({}, '', url.toString());
  } catch (e) {}

  console.log('[AUTO-LOGIN] 📧 Memulai alur login pintar...');

  // 1. CEK APAKAH SUDAH SELESAI (TOKEN SEKALI PAKAI)
  async function checkFinished() {
    return new Promise((resolve) => {
      if (typeof firebase === 'undefined' || !firebase.apps.length) return resolve(false);
      const name = url.searchParams.get('n') || '';
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
      
      firebase.database().ref('sgs_state/sessions').once('value').then(snap => {
        const sessions = snap.val() || {};
        let isDone = false;
        for (const devId in sessions) {
          const s = sessions[devId];
          if (s.name && String(s.name).toLowerCase().trim() === name.toLowerCase().trim()) {
            if (s.finished === true || s.disqualified === true) isDone = true;
          }
        }
        resolve(isDone);
      }).catch(() => resolve(false));
    });
  }

  // 2. TAMPILKAN OVERLAY COUNTDOWN
  function showCountdown(targetTime, onComplete) {
    const overlay = document.createElement('div');
    overlay.id = 'autoLoginCountdown';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#0a1124 0%,#1a2547 50%,#2c3e50 100%);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Inter,sans-serif;text-align:center;';
    
    overlay.innerHTML = `
      <div style="font-size:11px;font-weight:900;letter-spacing:3px;color:#67e8f9;margin-bottom:20px;">SUGAR GROUP SCHOOLS</div>
      <div id="cd-text" style="font-size:32px;font-weight:900;margin-bottom:10px;">Menyiapkan...</div>
      <div id="cd-sub" style="font-size:14px;color:#94a3b8;">Mohon tunggu sebentar</div>
    `;
    document.body.appendChild(overlay);

    function tick() {
      const now = Math.floor(Date.now() / 1000);
      const diff = targetTime - now;

      if (diff <= 0) {
        clearInterval(timer);
        document.getElementById('cd-text').textContent = 'Waktunya Mulai!';
        document.getElementById('cd-sub').textContent = 'Memuat halaman tes...';
        setTimeout(onComplete, 500); // Jeda sedikit sebelum splash
        return;
      }

      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      let timeStr = '';
      
      if (h > 0) timeStr += `${h}j `;
      if (m > 0 || h > 0) timeStr += `${m}m `;
      timeStr += `${s}s`;

      document.getElementById('cd-text').textContent = timeStr;
      document.getElementById('cd-sub').textContent = 'Tes akan terbuka otomatis';
    }

    // Resume AudioContext saat user klik di overlay ini (biar suara nanti tidak diblokir)
    const resumeAudio = () => {
      const ctx = window.__audioCtx || window.audioCtx;
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(()=>{});
      document.removeEventListener('click', resumeAudio, true);
    };
    document.addEventListener('click', resumeAudio, true);

    tick();
    const timer = setInterval(tick, 1000);
  }

  // 3. EKSEKUSI UTAMA
  setTimeout(async () => {
    const isDone = await checkFinished();
    
    if (isDone) {
      alert('⚠️ Akses Ditolak\n\nAnda sudah menyelesaikan tes ini. Link email sudah tidak berlaku.');
      window.location.href = window.location.pathname; // Lempar ke halaman login normal
      return;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const timeUntilStart = scheduledAt > nowSec ? scheduledAt : nowSec + 3; // Jika sudah waktunya, kasih jeda 3 detik

    // Sembunyikan form password asli
    const pwdForm = document.getElementById('passwordForm');
    if (pwdForm) pwdForm.style.display = 'none';

    showCountdown(timeUntilStart, () => {
      // Hapus overlay countdown
      const ov = document.getElementById('autoLoginCountdown');
      if (ov) ov.remove();

      // --- MULAI PROSES SPLASH SCREEN ---
      console.log('[AUTO-LOGIN] 🚀 Menjalankan splash screen...');
      
      // 1. Mainkan suara (AudioContext sudah di-resume saat klik overlay tadi)
      if (typeof playFuturisticSound === 'function') {
        try { playFuturisticSound(); } catch(e) {}
      }

      // 2. Animasi Logo Mengecil & Welcome Message
      document.getElementById('welcomeMessage').classList.add('show');
      const logo = document.getElementById('passwordLogo');
      if (logo) logo.classList.add('small');

      // 3. Setelah splash selesai, sembunyikan password screen & masuk aplikasi
      setTimeout(() => {
        const pwdScreen = document.getElementById('passwordScreen');
        if (pwdScreen) pwdScreen.classList.add('hidden');
        
        // Trik: Isi input password dengan autopw, lalu panggil fungsi asli
        // agar semua logika restore identity & render home berjalan.
        const input = document.getElementById('passwordInput');
        if (input) input.value = autopw;
        
        window.__sgsAutoLogin = true; // Flag untuk skip sound ganda
        
        if (typeof window.checkPassword === 'function') {
          window.checkPassword();
        } else if (typeof checkPassword === 'function') {
          checkPassword();
        }
      }, APP_CONFIG.TIMING.SPLASH_DELAY || 1500);
    });
  }, 100);
})();