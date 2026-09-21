/* ============================================================
   js/01b-resume.js
   - Auto-save & Restore progress di tengah tes
   - Gratis: LocalStorage (fast) + Firebase (backup)
   - Non-invasive: hook via appState polling
   - Fail-safe: silent errors, tidak ganggu UX
   ============================================================ */

(function() {
  'use strict';

  const STORAGE_KEY         = '_sgs_resume';
  const FIREBASE_PATH       = 'sgs_state/resume';
  const POLL_INTERVAL_MS    = 2000;        // cek perubahan tiap 2s
  const DEBOUNCE_SAVE_MS    = 1500;        // tunda save setelah perubahan
  const AUTO_EXPIRE_MS      = 4 * 3600e3;  // 4 jam
  const FIREBASE_THROTTLE   = 10000;       // min 10s antar Firebase save
  const MAX_PAYLOAD_BYTES   = 200 * 1024;  // 200KB max

  let __pollTimer         = null;
  let __debounceTimer     = null;
  let __lastSignature     = '';
  let __lastFirebaseSave  = 0;

  /* ============================================================
     HELPERS
     ============================================================ */
  function __getDeviceId() {
    try { return localStorage.getItem('_sgs_device_id') || null; }
    catch (e) { return null; }
  }

  function __firebaseReady() {
    return typeof firebase !== 'undefined'
      && firebase.apps
      && firebase.apps.length > 0;
  }

  function __isInTest() {
    return window.__inTestView === true
      && window.appState
      && window.appState.currentTest
      && window.appState.currentTest !== null;
  }

  /* ============================================================
     SERIALIZE — ringkas state jadi payload
     ============================================================ */
  function __serializeState() {
    try {
      if (!__isInTest()) return null;

      const a = window.appState;

      // Kalau tes ini sudah completed → tidak perlu resume
      if (a.completed && a.completed[a.currentTest] === true) return null;

      // Payload inti
      const payload = {
        v: 1,
        savedAt: Date.now(),
        deviceId: __getDeviceId(),

        currentTest:     a.currentTest,
        currentSubtest:  a.currentSubtest || 0,
        currentQuestion: a.currentQuestion || 0,
        currentColumn:   a.currentColumn || 0,
        timeLeft:        a.timeLeft || 0,

        // Jawaban semua tes
        answers: a.answers || {},

        // DISC temp (di tengah pengisian)
        tempDISC: a.tempDISC || {},
        discError: a.discError || '',

        // Kraeplin state
        isKraeplinTrial:  !!a.isKraeplinTrial,
        kraeplinStarted:  !!a.kraeplinStarted,
        kraeplinKey:      a.kraeplinKey || [],
        kraeplinHistory:  a.kraeplinHistory || {},
        currentRow:       a.currentRow || {},

        // Subject
        subjectSelected:  a.subjectSelected || null,

        // Typing
        typingText:       a.typingText || '',
        typingStart:      a.typingStart || 0,

        // Big Five
        hasilOCEAN:       a.hasilOCEAN || null
      };

      return payload;
    } catch (e) {
      console.warn('[RESUME] Serialize error:', e.message);
      return null;
    }
  }

  /* ============================================================
     RESTORE — apply payload ke appState
     ============================================================ */
  function __restoreState(data) {
    try {
      if (!data || !window.appState) return false;
      if (!data.currentTest) return false;

      const a = window.appState;

      a.currentTest     = data.currentTest;
      a.currentSubtest  = Number(data.currentSubtest) || 0;
      a.currentQuestion = Number(data.currentQuestion) || 0;
      a.currentColumn   = Number(data.currentColumn) || 0;
      a.timeLeft        = Number(data.timeLeft) || 0;

      a.answers = data.answers || {};

      a.tempDISC  = data.tempDISC  || {};
      a.discError = data.discError || '';

      a.isKraeplinTrial = !!data.isKraeplinTrial;
      a.kraeplinStarted = false;   // selalu false — user klik dulu
      a.kraeplinKey     = data.kraeplinKey || [];
      a.kraeplinHistory = data.kraeplinHistory || {};
      a.currentRow      = data.currentRow || {};

      a.subjectSelected = data.subjectSelected || null;

      a.typingText   = data.typingText || '';
      a.typingStart  = 0;          // reset — timer jalan setelah user klik

      a.hasilOCEAN   = data.hasilOCEAN || null;

      a.timerActive  = false;

      window.__inTestView = true;

      return true;
    } catch (e) {
      console.warn('[RESUME] Restore error:', e.message);
      return false;
    }
  }

  /* ============================================================
     SAVE
     ============================================================ */
  function __resumeSave(force = false) {
    try {
      const data = __serializeState();

      // Kalau tidak dalam tes → clear
      if (!data) {
        if (!__isInTest()) __resumeClear();
        return;
      }

      // Size check
      let json;
      try { json = JSON.stringify(data); }
      catch (e) { return; }

      if (json.length > MAX_PAYLOAD_BYTES) {
        console.warn('[RESUME] Payload terlalu besar (' + json.length + ' bytes) — skip');
        return;
      }

      // 1) LocalStorage
      try {
        localStorage.setItem(STORAGE_KEY, json);
      } catch (e) {
        console.warn('[RESUME] LocalStorage penuh?', e.message);
        // Coba hapus data lama kalau sudah expired
        try {
          const old = localStorage.getItem(STORAGE_KEY);
          if (old) localStorage.removeItem(STORAGE_KEY);
          localStorage.setItem(STORAGE_KEY, json);
        } catch (e2) {}
      }

      // 2) Firebase (throttled)
      __resumeSaveToFirebase(data);

    } catch (e) {
      console.warn('[RESUME] Save error:', e.message);
    }
  }

  function __resumeSaveToFirebase(data) {
    const now = Date.now();
    if (now - __lastFirebaseSave < FIREBASE_THROTTLE) return;

    if (!__firebaseReady()) return;
    if (!navigator.onLine) return;
    if (!data.deviceId) return;

    __lastFirebaseSave = now;

    try {
      firebase.database()
        .ref(FIREBASE_PATH + '/' + data.deviceId)
        .set(data)
        .catch(() => {});   // silent
    } catch (e) {}
  }

  /* ============================================================
     LOAD
     ============================================================ */
  function __resumeLoadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw);
      if (!data || !data.currentTest) return null;
      if (!data.savedAt) return null;

      // Auto-expire
      if (Date.now() - data.savedAt > AUTO_EXPIRE_MS) {
        __resumeClear();
        return null;
      }

      // Kalau tes sudah selesai → tidak perlu resume
      if (data.answers && window.appState && window.appState.completed
          && window.appState.completed[data.currentTest] === true) {
        __resumeClear();
        return null;
      }

      return data;
    } catch (e) {
      return null;
    }
  }

  async function __resumeLoadFirebase() {
    const deviceId = __getDeviceId();
    if (!deviceId) return null;
    if (!__firebaseReady()) return null;
    if (!navigator.onLine) return null;

    try {
      const snap = await firebase.database()
        .ref(FIREBASE_PATH + '/' + deviceId)
        .once('value');

      const data = snap.val();
      if (!data || !data.currentTest) return null;
      if (!data.savedAt) return null;
      if (Date.now() - data.savedAt > AUTO_EXPIRE_MS) return null;

      return data;
    } catch (e) {
      return null;
    }
  }

  /* ============================================================
     CLEAR
     ============================================================ */
  function __resumeClear() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}

    const deviceId = __getDeviceId();
    if (!deviceId) return;
    if (!__firebaseReady()) return;

    try {
      firebase.database()
        .ref(FIREBASE_PATH + '/' + deviceId)
        .remove()
        .catch(() => {});
    } catch (e) {}
  }

  /* ============================================================
     SIGNATURE & POLLING
     ============================================================ */
  function __computeSignature() {
    try {
      const a = window.appState;
      if (!a) return '';

      const ans = a.answers || {};
      const answersSig = Object.keys(ans).map(k => {
        const v = ans[k];
        if (Array.isArray(v)) return k + ':' + v.length;
        if (v && typeof v === 'object') return k + ':' + Object.keys(v).length;
        return k + ':?';
      }).join(',');

      return [
        a.currentTest,
        a.currentSubtest,
        a.currentQuestion,
        a.currentColumn,
        a.timeLeft,
        answersSig
      ].join('|');
    } catch (e) {
      return '';
    }
  }

  function __startPolling() {
    if (__pollTimer) return;

    __pollTimer = setInterval(() => {
      if (!__isInTest()) return;

      const sig = __computeSignature();
      if (sig === __lastSignature) return;
      __lastSignature = sig;

      // Debounce save
      clearTimeout(__debounceTimer);
      __debounceTimer = setTimeout(() => __resumeSave(), DEBOUNCE_SAVE_MS);
    }, POLL_INTERVAL_MS);
  }

  /* ============================================================
     LIFECYCLE HOOKS
     ============================================================ */
  function __attachLifecycleHooks() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && __isInTest()) __resumeSave(true);
    });

    window.addEventListener('beforeunload', () => {
      if (__isInTest()) __resumeSave(true);
    });

    window.addEventListener('blur', () => {
      if (__isInTest()) __resumeSave(true);
    });
  }

  /* ============================================================
     RESUME TO TEST — panggil render yang sesuai
     ============================================================ */
  window.__resumeToTest = function(data) {
    if (!data || !data.currentTest) return false;
    if (!__restoreState(data)) return false;

    const test = data.currentTest;

    try {
      switch (test) {
        case 'IST':
          if (typeof renderISTQuestion === 'function') {
            renderISTQuestion();
            if (typeof startTimer === 'function') startTimer();
            return true;
          }
          break;

        case 'DISC':
          if (typeof renderDISCQuestion === 'function') {
            renderDISCQuestion();
            return true;
          }
          break;

        case 'PAPI':
          if (typeof renderPAPIQuestion === 'function') {
            renderPAPIQuestion();
            if (typeof updatePAPITimerDisplay === 'function') updatePAPITimerDisplay();
            // restart timer
            clearInterval(appState.timer);
            appState.timer = setInterval(() => {
              appState.timeLeft--;
              if (typeof updatePAPITimerDisplay === 'function') updatePAPITimerDisplay();
              if (appState.timeLeft <= 0) {
                clearInterval(appState.timer);
                if (typeof finishPAPITestByTime === 'function') finishPAPITestByTime();
              }
            }, 1000);
            return true;
          }
          break;

        case 'BIGFIVE':
          if (typeof renderBIGFIVEQuestion === 'function') {
            renderBIGFIVEQuestion();
            // restart timer
            clearInterval(appState.timer);
            appState.timer = setInterval(() => {
              appState.timeLeft--;
              if (typeof updateBIGFIVETimerDisplay === 'function') updateBIGFIVETimerDisplay();
              if (appState.timeLeft <= 0) {
                clearInterval(appState.timer);
                if (typeof finishBIGFIVETestByTime === 'function') finishBIGFIVETestByTime();
              }
            }, 1000);
            return true;
          }
          break;

        case 'SUBJECT':
          if (typeof renderSubjectQuestionSlide === 'function') {
            renderSubjectQuestionSlide(Number(data.currentQuestion) || 0);
            return true;
          }
          break;

        case 'TYPING':
          if (typeof renderTypingTest === 'function') {
            renderTypingTest();
            return true;
          }
          break;

        case 'KRAEPLIN':
          if (typeof renderKraeplinBoard === 'function') {
            // Kraeplin: columns regenerate (biar fresh), mulai dari kolom terakhir
            appState.kraeplinStarted = false;
            renderKraeplinBoard();
            return true;
          }
          break;

        case 'GRAFIS':
          if (typeof renderPersiapanSlide === 'function') {
            renderPersiapanSlide();
            return true;
          }
          break;

        // EXCEL tidak support resume — Luckysheet state terlalu kompleks
        case 'EXCEL':
          return false;
      }
    } catch (e) {
      console.warn('[RESUME] resumeToTest error:', e.message);
      return false;
    }

    return false;
  };

  /* ============================================================
     PUBLIC API
     ============================================================ */
  window.__resumeSave         = __resumeSave;
  window.__resumeClear        = __resumeClear;
  window.__resumeLoadLocal    = __resumeLoadLocal;
  window.__resumeLoadFirebase = __resumeLoadFirebase;

  window.__resumeCheck = async function() {
    // 1) Local dulu (cepat)
    let data = __resumeLoadLocal();

    // 2) Fallback Firebase
    if (!data) {
      data = await __resumeLoadFirebase();
      if (data) {
        // Cache ke lokal
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
      }
    }

    return data;
  };

  /* ============================================================
     AUTO-INIT
     ============================================================ */
  function __init() {
    __attachLifecycleHooks();
    __startPolling();
    console.log('[RESUME] ✓ Auto-save aktif');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', __init);
  } else {
    setTimeout(__init, 100);
  }

  console.log('[RESUME] ✓ Loaded');
})();
