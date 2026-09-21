/* =========================================================
   AUDIO — Beep & Sound Effects
   ========================================================= */

   let sharedAudioCtx = null;
   let wrongPasswordAudioContext = null;
   
   function prepareAudioContext() {
     if (!sharedAudioCtx) {
       try {
         sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
       } catch {}
     }
   }
   
   function playBeep() {
     if (!sharedAudioCtx) return;
     const o = sharedAudioCtx.createOscillator();
     const g = sharedAudioCtx.createGain();
     o.type = 'square';
     o.frequency.value = 1080;
     g.gain.value = 0.18;
     o.connect(g);
     g.connect(sharedAudioCtx.destination);
     o.start();
     setTimeout(() => { o.stop(); g.disconnect(); o.disconnect(); }, 260);
   }
   
   function playFuturisticSound() {
     const audioWelcome = new Audio('https://cdn.jsdelivr.net/gh/Pragas123/assets@main/futuristic.mp3');
     audioWelcome.volume = 0.80;
     audioWelcome.play().catch(() => {});
   
     const audioTTS = new Audio('https://cdn.jsdelivr.net/gh/Pragas123/assets@70d6b32ad0b433b80453e5cd0897f5a541e7075d/welcome.mp3');
     audioTTS.volume = 0.65;
     audioTTS.play().catch(() => {});
   
     try {
       const ctx = new (window.AudioContext || window.webkitAudioContext)();
       const now = ctx.currentTime;
       const dur = 0.65;
       const osc = ctx.createOscillator();
       const gain = ctx.createGain();
       const filter = ctx.createBiquadFilter();
   
       osc.type = 'sawtooth';
       osc.frequency.setValueAtTime(180, now);
       osc.frequency.exponentialRampToValueAtTime(2200, now + 0.18);
       osc.frequency.exponentialRampToValueAtTime(900,  now + 0.40);
   
       const detune = ctx.createOscillator();
       detune.type = 'sine'; detune.frequency.value = 16;
       detune.connect(osc.detune);
       osc.detune.value = 15;
   
       filter.type = 'bandpass';
       filter.frequency.value = 2000; filter.Q.value = 12;
       filter.frequency.exponentialRampToValueAtTime(800, now + dur);
   
       gain.gain.setValueCurveAtTime([0,0.8,0.3,0.6,0.2,0], now, dur, 0.2);
   
       osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
       osc.start(now); detune.start(now);
       osc.stop(now + dur); detune.stop(now + dur);
     } catch {}
   }
   
   /** Alarm password salah */
   function playWrongPasswordAlarm() {
     try {
       const AudioContext = window.AudioContext || window.webkitAudioContext;
       if (!AudioContext) return;
       if (!wrongPasswordAudioContext) wrongPasswordAudioContext = new AudioContext();
       const ctx = wrongPasswordAudioContext;
       if (ctx.state === 'suspended') ctx.resume();
   
       const now = ctx.currentTime;
       const osc  = ctx.createOscillator();
       const gain = ctx.createGain();
       osc.type = 'square';
   
       osc.frequency.setValueAtTime(720, now);
       osc.frequency.setValueAtTime(720, now + 0.12);
       osc.frequency.setValueAtTime(480, now + 0.15);
       osc.frequency.setValueAtTime(660, now + 0.18);
       osc.frequency.setValueAtTime(660, now + 0.55);
       osc.frequency.setValueAtTime(740, now + 0.60);
       osc.frequency.setValueAtTime(740, now + 0.68);
   
       gain.gain.setValueAtTime(0.0001, now);
       gain.gain.exponentialRampToValueAtTime(0.45,  now + 0.015);
       gain.gain.exponentialRampToValueAtTime(0.0001,now + 0.13);
       gain.gain.exponentialRampToValueAtTime(0.45,  now + 0.18);
       gain.gain.exponentialRampToValueAtTime(0.0001,now + 0.74);
   
       osc.connect(gain); gain.connect(ctx.destination);
       osc.start(now); osc.stop(now + 0.78);
     } catch (err) {
       console.warn('Alarm audio gagal:', err);
     }
   }
   /* ============================================================
   🆕 AUDIO UNLOCK — Buka blokir autoplay browser
   - Browser modern blokir audio sebelum user gesture
   - Resume AudioContext setelah klik/tap/keydown pertama
   ============================================================ */
(function() {
  let __audioUnlocked = false;

  function __unlockAudio() {
    if (__audioUnlocked) return;

    // Resume semua AudioContext yang sudah ada
    [sharedAudioCtx, wrongPasswordAudioContext].forEach(ctx => {
      if (ctx && ctx.state === 'suspended') {
        try { ctx.resume(); } catch (e) {}
      }
    });

    // Resume AudioContext dari chat-notify (kalau ada)
    if (window.__notifyAudioCtx && window.__notifyAudioCtx.state === 'suspended') {
      try { window.__notifyAudioCtx.resume(); } catch (e) {}
    }
    if (window.__chatAudioCtx && window.__chatAudioCtx.state === 'suspended') {
      try { window.__chatAudioCtx.resume(); } catch (e) {}
    }

    __audioUnlocked = true;
    console.log('[AUDIO] 🔓 AudioContext unlocked');

    // Hapus listener setelah sukses
    document.removeEventListener('click', __unlockAudio, true);
    document.removeEventListener('touchstart', __unlockAudio, true);
    document.removeEventListener('keydown', __unlockAudio, true);
  }

  document.addEventListener('click', __unlockAudio, true);
  document.addEventListener('touchstart', __unlockAudio, true);
  document.addEventListener('keydown', __unlockAudio, true);

  window.__unlockAudio = __unlockAudio;
})();
   console.log('[AUDIO] ✓ Loaded');
