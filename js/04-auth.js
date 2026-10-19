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
   🆕 AUTO-LOGIN PINTAR (Countdown + Buffer 10s + Suara Elegan)
   ============================================================ */
(function autoLoginFromEmailLink() {
  const url = new URL(window.location.href);
  const autopw = url.searchParams.get('autopw');
  const isRetake = url.searchParams.get('retake') === '1';
  const startRaw = url.searchParams.get('start');
  const scheduledAt = startRaw ? parseInt(startRaw, 10) : 0;

  if (!autopw || !isRetake) return;

  try {
    url.searchParams.delete('autopw');
    window.history.replaceState({}, '', url.toString());
  } catch (e) {}

  // 1. Siapkan Overlay Countdown (Desain Bersih & Profesional)
  const overlay = document.createElement('div');
  overlay.id = 'autoLoginCountdown';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#0a1124 0%,#1a2547 50%,#2c3e50 100%);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Inter,sans-serif;text-align:center;cursor:pointer;';
  
  overlay.innerHTML = `
    <div style="font-size:11px;font-weight:900;letter-spacing:3px;color:#67e8f9;margin-bottom:20px;">SUGAR GROUP SCHOOLS</div>
    <div id="cd-text" style="font-size:36px;font-weight:900;margin-bottom:10px;font-variant-numeric:tabular-nums;">Menyiapkan...</div>
    <div id="cd-sub" style="font-size:14px;color:#94a3b8;margin-bottom:30px;">Mohon tunggu sebentar</div>
    
    <div id="cd-click-warn" style="transition:all 0.4s ease;">
      <span style="display:inline-block;padding:12px 24px;border:1px solid rgba(255,255,255,0.15);border-radius:30px;background:rgba(255,255,255,0.05);font-size:13px;color:#cbd5e1;letter-spacing:0.5px;">
        Sentuh layar untuk melanjutkan
      </span>
    </div>
  `;
  document.body.appendChild(overlay);

  // 2. Fungsi Membuka Blokir Audio Chrome
  let isAudioUnlocked = false;
  function unlockAudio() {
    if (isAudioUnlocked) return;
    const ctx = window.__audioCtx || window.audioCtx;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(()=>{});
    }
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch(e) {}
    
    isAudioUnlocked = true;
    const warn = document.getElementById('cd-click-warn');
    if (warn) {
      warn.innerHTML = '<span style="display:inline-block;padding:12px 24px;border:1px solid rgba(34,197,94,0.4);border-radius:30px;background:rgba(34,197,94,0.1);font-size:13px;color:#86efac;letter-spacing:0.5px;">✓ Sesi Siap</span>';
    }
  }
  
  overlay.addEventListener('click', unlockAudio);
  overlay.addEventListener('touchstart', unlockAudio);

  // 3. Logika Waktu
  let phase = 'waiting';
  let connectEndTime = 0;
  const nowSec = Math.floor(Date.now() / 1000);

  let targetTime = scheduledAt > nowSec ? scheduledAt : nowSec;

  const timer = setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    const elText = document.getElementById('cd-text');
    const elSub = document.getElementById('cd-sub');

    if (phase === 'waiting') {
      const diff = targetTime - now;
      if (diff <= 0) {
        phase = 'connecting';
        connectEndTime = now + 10; // Jeda koneksi 10 detik
        elSub.textContent = 'Menghubungkan ke server...';
        return;
      }
      
      const d = Math.floor(diff / 86400);
      const h = Math.floor((diff % 86400) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      
      let str = '';
      if (d > 0) str += `${d} hari `;
      if (h > 0) str += `${h} jam `;
      if (m > 0 || h > 0 || d > 0) str += `${m} mnt `;
      str += `${s} dtk`;
      
      elText.textContent = str;
      elSub.textContent = `Tautan akan terbuka otomatis sesuai jadwal`;
    } 
    else if (phase === 'connecting') {
      const diff = connectEndTime - now;
      if (diff <= 0) {
        clearInterval(timer);
        elText.textContent = 'Waktunya Mulai!';
        elSub.textContent = 'Memuat halaman tes...';
        setTimeout(startSplashScreen, 500);
        return;
      }
      elText.textContent = diff + ' detik';
    }
  }, 1000);

  // 4. Fungsi Transisi Masuk (Splash + Suara Elegan)
  function startSplashScreen() {
    overlay.remove(); 
    
    // 🔊 SUARA ELEGAN (Major Chord Arpeggio C5-E5-G5)
    try {
      const ctx = window.__audioCtx || window.audioCtx;
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          
          // Amplop suara lembut (fade in - fade out)
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + i * 0.08); // Efek bergantian (arpeggio)
          osc.stop(now + 1.5);
        });
      }
    } catch(e) {}

    // Animasi Logo Mengecil
    document.getElementById('welcomeMessage').classList.add('show');
    const logo = document.getElementById('passwordLogo');
    if (logo) logo.classList.add('small');

    // Setelah animasi selesai, jalankan checkPassword
    setTimeout(() => {
      document.getElementById('passwordScreen').classList.add('hidden');
      const input = document.getElementById('passwordInput');
      if (input) input.value = autopw;
      
      window.__sgsAutoLogin = true; // Blokir suara ganda
      
      if (typeof window.checkPassword === 'function') {
        window.checkPassword();
      } else if (typeof checkPassword === 'function') {
        checkPassword();
      }
    }, APP_CONFIG.TIMING.SPLASH_DELAY || 1500);
  }

  if (targetTime <= nowSec) {
    phase = 'connecting';
    connectEndTime = nowSec + 10;
    document.getElementById('cd-sub').textContent = 'Menghubungkan ke server...';
  }
})();