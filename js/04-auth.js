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
  
  // Putar suara HANYA JIKA BUKAN dari email auto-login
  if (!window.__sgsAutoLogin && typeof playFuturisticSound === 'function') {
    try { playFuturisticSound(); } catch (e) {}
  }

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

          /* 🆕 3. Validasi email */
          if (retakeData.email && cs.email) {
            if (String(cs.email).toLowerCase().trim() !== String(retakeData.email).toLowerCase().trim()) {
              throw new Error('Email tidak cocok');
            }
          }

          /* 🆕 4. Validasi token */
          if (retakeData.token) {
            const tkSnap = await firebase.database()
              .ref('sgs_retake_tokens/' + retakeData.token)
              .once('value');
            const tk = tkSnap.val();
            if (!tk) {
              throw new Error('Token tidak valid atau tidak ditemukan');
            }

            const nowSec = Math.floor(Date.now() / 1000);

            if (tk.scheduledAt && nowSec < tk.scheduledAt) {
              console.log('[RETAKE] ⏳ Belum waktunya. Countdown akan ditampilkan.');
            }
            if (tk.expiresAt && nowSec > tk.expiresAt) {
              throw new Error('Link sudah kadaluarsa pada ' +
                new Date(tk.expiresAt * 1000).toLocaleString('id-ID'));
            }

            if (tk.name) retakeData.name = tk.name;
            if (tk.position !== undefined) retakeData.position = tk.position || '';
            if (Array.isArray(tk.tests) && tk.tests.length) retakeData.tests = tk.tests.slice();
            if (tk.tahap) retakeData.tahap = tk.tahap;

            console.log('[RETAKE] ✅ Token valid — tahap:', tk.tahap,
              '| expires:', new Date(tk.expiresAt * 1000).toLocaleString('id-ID'));
          }

          /* 5. Restore identity */
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

          /* 🆕 8. Buat/update session */
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

          /* 🆕 9. Catat retake_history */
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
      if (typeof window.renderHome === 'function') window.renderHome();
      else renderIdentityForm();
    } else {
      renderIdentityForm();
    }
  }, APP_CONFIG.TIMING.SPLASH_DELAY);
}

window.checkPassword = checkPassword;


/* ============================================================
   🆕 AUTO-LOGIN PINTAR (Countdown + Klik Lanjutkan + Connect 5s)
   ============================================================ */
(function autoLoginFromEmailLink() {
  try {
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

    let phase = 'waiting';
    let isAudioUnlocked = false;
    let connectEndTime = 0;
    let timer;

    const overlay = document.createElement('div');
    overlay.id = 'autoLoginCountdown';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#0a1124 0%,#1a2547 50%,#2c3e50 100%);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Inter,sans-serif;text-align:center;padding:20px;';

    overlay.innerHTML = `
      <div style="background:#ffffff;padding:16px 28px;border-radius:20px;margin-bottom:20px;box-shadow:0 10px 30px rgba(0,0,0,0.3);">
        <img src="https://cdn.jsdelivr.net/gh/Pragas123/assets@main/nmqo6a.png" style="height:80px;display:block;">
      </div>
      <div style="font-size:11px;font-weight:900;letter-spacing:3px;color:#67e8f9;margin-bottom:20px;">SUGAR GROUP SCHOOLS</div>
      <div id="cd-text" style="font-size:36px;font-weight:900;margin-bottom:10px;font-variant-numeric:tabular-nums;">Menyiapkan...</div>
      <div id="cd-sub" style="font-size:14px;color:#94a3b8;margin-bottom:30px;">Mohon tunggu sebentar</div>
      <div id="cd-action" style="transition:all 0.4s ease; cursor:pointer;">
        <span style="display:inline-block;padding:12px 24px;border:1px solid rgba(255,255,255,0.15);border-radius:30px;background:rgba(255,255,255,0.05);font-size:13px;color:#cbd5e1;letter-spacing:0.5px;animation:pulse 1.5s infinite;">
          Sentuh layar untuk melanjutkan
        </span>
      </div>
      <style>@keyframes pulse{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}</style>
    `;
    document.body.appendChild(overlay);

    const elText = document.getElementById('cd-text');
    const elSub = document.getElementById('cd-sub');
    const elAction = document.getElementById('cd-action');

    function unlockAudio() {
      if (isAudioUnlocked) return;
      try {
        const ctx = window.__audioCtx || window.audioCtx;
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(()=>{});
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch(e) {}
      
      isAudioUnlocked = true;
      if (phase === 'waiting') {
        elAction.innerHTML = '<span style="display:inline-block;padding:12px 24px;border:1px solid rgba(34,197,94,0.4);border-radius:30px;background:rgba(34,197,94,0.1);font-size:13px;color:#86efac;letter-spacing:0.5px;">✓ Sesi Siap (Menunggu Jadwal)</span>';
      }
    }

    function handleInteraction() {
      unlockAudio();
      if (phase === 'ready') startConnecting();
    }
    overlay.addEventListener('click', handleInteraction);
    overlay.addEventListener('touchstart', handleInteraction);

    const nowSec = Math.floor(Date.now() / 1000);
    let targetTime = scheduledAt > nowSec ? scheduledAt : 0;

    function checkPhase() {
      const now = Math.floor(Date.now() / 1000);
      if (phase === 'waiting') {
        const diff = targetTime - now;
        if (diff <= 0) {
          phase = 'ready';
          elText.textContent = 'Waktunya Mulai!';
          elSub.textContent = 'Silakan lanjutkan ke halaman tes';
          elAction.innerHTML = '<span style="display:inline-block;padding:14px 32px;border:none;border-radius:30px;background:linear-gradient(135deg,#06b6d4,#0ea5e9);font-size:15px;font-weight:900;color:#fff;box-shadow:0 4px 15px rgba(6,182,212,.4);animation:pulse 1.5s infinite;">Lanjutkan Tes</span>';
          clearInterval(timer);
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
        elSub.textContent = `Tautan akan aktif otomatis sesuai jadwal`;
      }
    }

    function startConnecting() {
      if (phase === 'connecting') return;
      phase = 'connecting';
      elText.textContent = '5';
      elSub.textContent = 'Menghubungkan ke server...';
      elAction.style.display = 'none';
      
      connectEndTime = Math.floor(Date.now() / 1000) + 5;
      clearInterval(timer);

      timer = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const diff = connectEndTime - now;
        if (diff <= 0) {
          clearInterval(timer);
          startSplashScreen();
        } else {
          elText.textContent = diff;
        }
      }, 1000);
    }

    function startSplashScreen() {
      overlay.remove();
      try {
        const ctx = window.__audioCtx || window.audioCtx;
        if (ctx) {
          if (ctx.state === 'suspended') ctx.resume();
          const now = ctx.currentTime;
          const notes = [523.25, 659.25, 783.99];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.08);
            osc.stop(now + 1.5);
          });
        }
      } catch(e) {}

      document.getElementById('welcomeMessage').classList.add('show');
      const logo = document.getElementById('passwordLogo');
      if (logo) logo.classList.add('small');

      setTimeout(() => {
        document.getElementById('passwordScreen').classList.add('hidden');
        const input = document.getElementById('passwordInput');
        if (input) input.value = autopw;
        window.__sgsAutoLogin = true;
        if (typeof window.checkPassword === 'function') window.checkPassword();
        else if (typeof checkPassword === 'function') checkPassword();
      }, (window.APP_CONFIG && APP_CONFIG.TIMING && APP_CONFIG.TIMING.SPLASH_DELAY) ? APP_CONFIG.TIMING.SPLASH_DELAY : 1500);
    }

    if (targetTime <= nowSec) {
      phase = 'ready';
      elText.textContent = 'Waktunya Mulai!';
      elSub.textContent = 'Silakan lanjutkan ke halaman tes';
      elAction.innerHTML = '<span style="display:inline-block;padding:14px 32px;border:none;border-radius:30px;background:linear-gradient(135deg,#06b6d4,#0ea5e9);font-size:15px;font-weight:900;color:#fff;box-shadow:0 4px 15px rgba(6,182,212,.4);animation:pulse 1.5s infinite;">Lanjutkan Tes</span>';
    } else {
      checkPhase();
      timer = setInterval(checkPhase, 1000);
    }
  } catch (err) {
    console.warn('[AUTO-LOGIN] Error internal:', err);
  }
})();