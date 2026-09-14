/* =========================================================
   IST TEST — Full Logic (Scoring + PDF Reporting)
   ========================================================= */

let __istKeysApplied = false;

/* ============================================================
   PRELOAD ASSETS
   ============================================================ */
const __istImgCache = new Map();

function preloadImage(src) {
  if (!src) return Promise.resolve();
  if (__istImgCache.has(src)) return __istImgCache.get(src);
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  const p = (img.decode ? img.decode() : new Promise((res, rej) => {
    img.onload = res; img.onerror = rej;
  })).catch(() => {});
  __istImgCache.set(src, p);
  return p;
}

function preloadQuestionAssets(subtest, idx) {
  const q = subtest?.questions?.[idx];
  if (!q) return;
  const jobs = [];
  if (q.questionImage) jobs.push(preloadImage(q.questionImage));
  (q.images || []).forEach(s => jobs.push(preloadImage(s)));
  Promise.all(jobs).catch(() => {});
}

/* ============================================================
   APPLY KEYS TO QUESTIONS
   ============================================================ */
function applyAllKeysIntoQuestions() {
  if (__istKeysApplied) return;
  const ist = tests?.IST;
  if (!ist?.subtests) return;

  ist.subtests.forEach(st => {
    const code = getSubtestCode(st.name);
    const keys = IST_KEYS[code];

    if (keys && Array.isArray(st.questions)) {
      st.questions.forEach((q, i) => {
        const k = keys[i];
        if (k == null) return;
        if (Array.isArray(k)) {
          q.answer = normalizeLetter(k[0]);
          q.accepted = k.map(normalizeLetter);
        } else {
          q.answer = normalizeLetter(k);
          q.accepted = [normalizeLetter(k)];
        }
      });
    }
    if (code === 'RA' && Array.isArray(st.questions)) {
      st.questions.forEach((q, i) => { if (RA_KEYS[i] != null) q.answer = String(RA_KEYS[i]); });
    }
    if (code === 'ZR' && Array.isArray(st.questions)) {
      st.questions.forEach((q, i) => { if (ZR_KEYS[i] != null) q.answer = String(ZR_KEYS[i]); });
    }
  });
  __istKeysApplied = true;
}
window.applyAllKeysIntoQuestions = applyAllKeysIntoQuestions;

function injectISTFuturisticStyles() {
  // CSS via <link>
}

/* ============================================================
   HELPER
   ============================================================ */
function hasAnyISTAnswers() {
  return (
    Array.isArray(appState?.answers?.IST) &&
    appState.answers.IST.some(b => Array.isArray(b?.answers) && b.answers.length > 0)
  );
}

function resetISTSession() {
  appState.currentSubtest = 0;
  appState.currentQuestion = 0;
  appState.completed = appState.completed || {};
  appState.completed.IST = false;
  appState.answers = appState.answers || {};
  appState.answers.IST = (tests?.IST?.subtests || []).map(st => ({
    name: st.name,
    answers: []
  }));
}

/* ============================================================
   INTRO SUBTES
   ============================================================ */
function renderISTSubtestIntro() {
  const subtest = tests.IST.subtests[appState.currentSubtest];
  if (!subtest) {
    appState.completed.IST = true;
    showThankYouAndHomeIST();
    return;
  }

  const hasExample = !!subtest.example;
  const ex = hasExample ? subtest.example : {};
  const exImages = Array.isArray(ex.images) ? ex.images : [];

  try {
    if (ex.questionImage) preloadImage(ex.questionImage);
    exImages.forEach(src => preloadImage(src));
  } catch {}

  injectISTFuturisticStyles();
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="ist-shell">
      <div class="ist-panel">
        <div class="ist-panel-header">
          <div class="ist-header-row">
            <div style="display:flex;align-items:center;gap:15px;">
              <div style="width:58px;height:58px;min-width:58px;border-radius:16px;background:#fff;border:1px solid #e2e5ef;display:grid;place-items:center;box-shadow:0 8px 18px rgba(15,23,42,.07);overflow:hidden;">
                <img src="${APP_CONFIG.LOGO}" alt="Logo" style="width:100%;height:100%;object-fit:contain;padding:6px;">
              </div>
              <div>
                <div class="ist-eyebrow">INTELLIGENCE ASSESSMENT</div>
                <h2 class="ist-title" style="margin-top:8px;">Subtes ${subtest.name}</h2>
                <p class="ist-subtitle">${subtest.description || 'Tes kemampuan intelektual'}</p>
              </div>
            </div>
            <div class="ist-time-chip">
              <span class="ist-time-chip-icon">⏱</span>
              <span>${Math.floor((subtest.time || 0) / 60)} menit</span>
            </div>
          </div>
        </div>

        <div class="ist-body">
          <div class="ist-info-grid">
            <div class="ist-info-card">
              <div class="ist-info-label">Subtes</div>
              <div class="ist-info-value">${subtest.name}</div>
            </div>
            <div class="ist-info-card">
              <div class="ist-info-label">Waktu</div>
              <div class="ist-info-value">${Math.floor((subtest.time || 0) / 60)} menit</div>
            </div>
            <div class="ist-info-card">
              <div class="ist-info-label">Soal</div>
              <div class="ist-info-value">${Array.isArray(subtest.questions) ? subtest.questions.length : 0} soal</div>
            </div>
          </div>

          <div class="ist-instruction-card">
            <div class="ist-section-heading">
              <span class="ist-section-icon">📘</span>
              Petunjuk Pengerjaan
            </div>
            <div class="ist-instruction-text">${subtest.instruction || '-'}</div>
          </div>

          ${hasExample ? (
            subtest.type === 'image-choice' ? `
              <div class="ist-example">
                <h4 class="ist-example-title">Contoh Soal</h4>
                ${ex.questionImage ? `<img class="ist-example-image" src="${ex.questionImage}" alt="Contoh Soal" loading="eager" decoding="async">` : ''}
                <div class="ist-example-options">
                  ${exImages.map((img, index) => `
                    <div class="ist-example-option">
                      <img src="${img}" alt="${ex.options?.[index] ?? ''}" loading="lazy" decoding="async">
                      <div class="ist-example-option-label">${ex.options?.[index] ?? ''}</div>
                    </div>
                  `).join('')}
                </div>
                ${ex.answer ? `<div class="ist-example-answer"><strong>Jawaban:</strong> ${ex.answer}</div>` : ''}
                ${ex.explanation ? `<div class="ist-example-explanation">${ex.explanation}</div>` : ''}
              </div>
            ` : `
              <div class="ist-example">
                <h4 class="ist-example-title">Contoh Soal</h4>
                ${ex.question ? `<div class="ist-instruction-text"><strong>Soal:</strong> ${ex.question}</div>` : ''}
                ${Array.isArray(ex.options) ? `<div class="ist-instruction-text" style="margin-top:10px;"><strong>Pilihan:</strong> ${ex.options.join(', ')}</div>` : ''}
                ${ex.answer ? `<div class="ist-example-answer"><strong>Jawaban:</strong> ${ex.answer}</div>` : ''}
                ${ex.explanation ? `<div class="ist-example-explanation">${ex.explanation}</div>` : ''}
              </div>
            `
          ) : ''}

          <div class="ist-actions">
            <button class="ist-btn-primary" onclick="startISTSubtest()">🚀 Mulai Subtes</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   START SUBTES
   ============================================================ */
function startISTSubtest() {
  try {
    if (!window.__istKeysApplied && typeof window.applyAllKeysIntoQuestions === 'function') {
      window.applyAllKeysIntoQuestions();
    }
  } catch (e) {}

  appState.answers = appState.answers || {};
  appState.answers.IST = appState.answers.IST || [];

  if (appState.currentSubtest === 0 && appState.currentQuestion === 0 && hasAnyISTAnswers()) {
    const overwrite = window.confirm('Mulai ulang IST? Hasil sebelumnya akan dihapus.');
    if (overwrite) resetISTSession();
  }

  const subtests = tests?.IST?.subtests;
  if (!Array.isArray(subtests)) return;

  const subtest = subtests[appState.currentSubtest];
  if (!subtest) {
    appState.completed = appState.completed || {};
    appState.completed.IST = true;
    showThankYouAndHomeIST();
    return;
  }

  appState.timeLeft = Number(subtest.time) || 0;

  if (!appState.answers.IST[appState.currentSubtest]) {
    appState.answers.IST[appState.currentSubtest] = { name: subtest.name, answers: [] };
  } else {
    appState.answers.IST[appState.currentSubtest].name = subtest.name;
  }

  try {
    preloadQuestionAssets(subtest, 0);
    preloadQuestionAssets(subtest, 1);
  } catch {}

  if (subtest.memorizePhase) {
    renderISTMemorizePhase();
    return;
  }

  renderISTQuestion();
  startTimer();
}

/* ============================================================
   MEMORY PHASE (ME)
   ============================================================ */
function renderISTMemorizePhase() {
  const subtest = tests.IST.subtests[appState.currentSubtest];
  const dur = (subtest.memorizePhase && subtest.memorizePhase.duration) ? subtest.memorizePhase.duration : 180;

  clearInterval(appState.timer);
  appState.timeLeft = dur;

  const app = document.getElementById('app');

  function renderMemorize() {
    const mm = String(Math.floor(appState.timeLeft / 60)).padStart(2, '0');
    const ss = String(appState.timeLeft % 60).padStart(2, '0');

    const groupsHTML = (subtest.memorizePhase.groups || []).map(g => `
      <div class="ist-memory-group">
        <div class="ist-memory-group-label">${g.label}</div>
        <div class="ist-memory-group-items">${g.items.join(', ')}</div>
      </div>
    `).join('');

    app.innerHTML = `
      <div class="ist-shell">
        <div class="ist-panel ist-memory-panel">
          <div class="ist-panel-header">
            <div class="ist-memory-header">
              <div>
                <div class="ist-eyebrow">🧠 MEMORY PHASE</div>
                <h2 class="ist-title" style="margin-top:11px;">
                  ${subtest.memorizePhase.title || 'Hafalkan daftar berikut'}
                </h2>
                <p class="ist-subtitle">
                  Perhatikan informasi berikut dan hafalkan sebaik mungkin sebelum waktu berakhir.
                </p>
              </div>
              <div class="ist-memory-timer" id="memorize-timer-display">
                ⏳ ${mm}:${ss}
              </div>
            </div>
          </div>
          <div class="ist-body">
            <div class="ist-memory-groups">${groupsHTML}</div>
          </div>
        </div>
      </div>
    `;
  }

  try { if (typeof prepareAudioContext === 'function') prepareAudioContext(); if (typeof playBeep === 'function') playBeep(); } catch {}
  renderMemorize();

  appState.timer = setInterval(() => {
    appState.timeLeft--;
    const el = document.getElementById('memorize-timer-display');
    if (el) {
      const mm = String(Math.floor(appState.timeLeft / 60)).padStart(2, '0');
      const ss = String(appState.timeLeft % 60).padStart(2, '0');
      el.textContent = `⏳ ${mm}:${ss}`;
    }
    if (appState.timeLeft <= 0) {
      clearInterval(appState.timer);
      try { if (typeof playBeep === 'function') playBeep(); } catch {}
      const subtestNow = tests.IST.subtests[appState.currentSubtest];
      appState.timeLeft = subtestNow.time;
      renderISTQuestion();
      startTimer();
    }
  }, 1000);
}

/* ============================================================
   RESTORE / RENDER QUESTION
   ============================================================ */
function restoreISTPreviousAnswer(subtest) {
  const bucket = appState.answers?.IST?.[appState.currentSubtest];
  if (!bucket) return;
  const record = bucket.answers?.[appState.currentQuestion];
  if (!record) return;
  const savedAnswer = record.answer;
  if (savedAnswer == null || savedAnswer === '') return;

  if (subtest.type === 'text-input' || subtest.type === 'number-input') {
    const input = document.getElementById('ist-answer');
    if (input) input.value = savedAnswer;
    return;
  }

  if (subtest.type === 'multiple-choice') {
    const normalized = normalizeLetter(savedAnswer);
    const radio = document.querySelector(`input[name="ist-answer"][value="${normalized}"]`);
    if (radio) {
      radio.checked = true;
      const parent = radio.closest('.ist-option-box');
      if (parent) parent.classList.add('selected');
    }
    return;
  }

  if (subtest.type === 'image-choice') {
    const normalized = normalizeLetter(savedAnswer);
    document.querySelectorAll('.ist-image-option').forEach(option => {
      const input = option.querySelector('input[name="ist-answer"]');
      if (!input) return;
      if (normalizeLetter(input.value) === normalized) {
        input.checked = true;
        option.classList.add('selected');
      }
    });
  }
}

function renderISTQuestion() {
  const subtest = tests.IST.subtests[appState.currentSubtest];
  const question = subtest.questions[appState.currentQuestion];
  const progress = calculateProgress();

  let optionsHTML = '';

  if (subtest.type === 'multiple-choice') {
    optionsHTML = question.options.map(option => {
      const letter = normalizeLetter(option);
      const cleanText = String(option).replace(/^[A-E][\.\)]?\s*/, '');
      return `
        <label class="ist-option-box">
          <input type="radio" name="ist-answer" value="${letter}">
          <span class="ist-option-letter">${letter}</span>
          <span>${cleanText}</span>
          <span class="ist-check-indicator"></span>
        </label>
      `;
    }).join('');
  }
  else if (subtest.type === 'text-input') {
    optionsHTML = `
      <div class="ist-input-wrap">
        <label class="ist-input-label">Tulis jawaban Anda</label>
        <input type="text" id="ist-answer" class="ist-text-input" placeholder="Ketik jawaban Anda di sini..." autocomplete="off">
      </div>
    `;
  }
  else if (subtest.type === 'number-input') {
    optionsHTML = `
      <div class="ist-input-wrap">
        <label class="ist-input-label">Masukkan jawaban angka</label>
        <input type="number" id="ist-answer" class="ist-number-input" placeholder="Ketik angka jawaban..." autocomplete="off">
      </div>
    `;
  }
  else if (subtest.type === 'image-choice') {
    optionsHTML = `
      <div>
        <div class="ist-image-question-card">
          ${question.questionImage ? `
            <img class="ist-image-question-image" src="${question.questionImage}" alt="Soal"
                 loading="eager" fetchpriority="high" decoding="async" width="640" height="360">
          ` : ''}
          <div class="ist-image-question-title">${subtest.instruction || ''}</div>
        </div>
        <div class="ist-image-options-grid">
          ${(question.images || []).map((img, index) => {
            const value = question.options ? normalizeLetter(question.options[index]) : String.fromCharCode(65 + index);
            const label = question.options ? question.options[index] : String.fromCharCode(65 + index);
            return `
              <div class="ist-image-option" data-idx="${index}">
                <img src="${img}" alt="Opsi ${label}" loading="lazy" decoding="async" width="160" height="160">
                <span class="ist-image-option-label">${label}</span>
                <input type="radio" name="ist-answer" value="${value}" style="display:none;">
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  const app = document.getElementById('app');
  const hasPrevious = appState.currentQuestion > 0;
  const questionNumber = appState.currentQuestion + 1;
  const totalQuestions = subtest.questions.length;

  app.innerHTML = `
    <div class="ist-shell">
      <div class="ist-question-panel">
        <div class="ist-question-top">
          <div class="ist-question-meta">
            <div>
              <div class="ist-question-label">TES IST</div>
              <div class="ist-question-badge">🧠 ${subtest.name}</div>
            </div>
            <div class="ist-timer">
              <span class="ist-timer-icon">⏱</span>
              <span id="timer-display">${appState.timeLeft}s</span>
            </div>
          </div>

          <div class="ist-progress-wrap">
            <div class="ist-progress-info">
              <span>Soal ${questionNumber} dari ${totalQuestions}</span>
              <span>${Math.round(progress)}%</span>
            </div>
            <div class="ist-progress-track">
              <div class="ist-progress-fill" style="width:${progress}%"></div>
            </div>
          </div>
        </div>

        <div class="ist-question-body">
          <div class="ist-question-heading">${question.text || ''}</div>
          ${optionsHTML}

          <div class="ist-question-actions">
            <div class="ist-action-left">
              ${hasPrevious ? `
                <button class="ist-prev-btn" id="btnPreviousIST" type="button">
                  ← <span>Sebelumnya</span>
                </button>
              ` : ''}
            </div>
            <div class="ist-action-right">
              <button class="ist-main-btn" id="btnNextIST" type="button">
                ${appState.currentQuestion < subtest.questions.length - 1 ? 'Lanjut →' : 'Selesai ✓'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (subtest.type === 'image-choice') {
    document.querySelectorAll('.ist-image-option').forEach(opt => {
      opt.addEventListener('click', function () {
        document.querySelectorAll('.ist-image-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        const inp = this.querySelector('input');
        if (inp) inp.checked = true;
      });
    });
  }

  if (subtest.type === 'multiple-choice') {
    document.querySelectorAll('.ist-option-box').forEach(box => {
      box.addEventListener('click', function () {
        document.querySelectorAll('.ist-option-box').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        const inp = this.querySelector('input');
        if (inp) inp.checked = true;
      });
    });
  }

  restoreISTPreviousAnswer(subtest);

  try {
    preloadQuestionAssets(subtest, appState.currentQuestion + 1);
    preloadQuestionAssets(subtest, appState.currentQuestion + 2);
  } catch {}

  const nextBtn = document.getElementById('btnNextIST');
  if (nextBtn) nextBtn.onclick = nextISTQuestion;

  const previousBtn = document.getElementById('btnPreviousIST');
  if (previousBtn) previousBtn.onclick = previousISTQuestion;

  updateTimerDisplay();
}

/* ============================================================
   SAVE / NEXT / PREVIOUS
   ============================================================ */
function saveCurrentISTAnswer() {
  const subtest = tests.IST.subtests[appState.currentSubtest];
  const question = subtest.questions[appState.currentQuestion];
  let answer = '';

  if (subtest.type === 'multiple-choice' || subtest.type === 'image-choice') {
    const selectedOption = document.querySelector('input[name="ist-answer"]:checked');
    answer = selectedOption ? normalizeLetter(selectedOption.value) : '-';
  } else {
    const input = document.getElementById('ist-answer');
    answer = input ? input.value : '-';
  }

  const code = getSubtestCode(subtest.name);
  let correct, score, maxScore;

  if (code === 'GE') {
    const geIdx = appState.currentQuestion;
    score = (typeof scoreGE === 'function') ? scoreGE(geIdx, answer) : 0;
    maxScore = 2;
    correct = score === 2;
  } else if (question.answer != null && question.answer !== '') {
    if (subtest.type === 'number-input') {
      correct = String(answer).trim() === String(question.answer).trim();
    } else {
      const accepted = Array.isArray(question.accepted) && question.accepted.length
        ? question.accepted
        : [question.answer];
      correct = accepted.some(k => normalizeLetter(k) === normalizeLetter(answer));
    }
  }

  const bucket = appState.answers.IST[appState.currentSubtest] ||
    (appState.answers.IST[appState.currentSubtest] = { name: subtest.name, answers: [] });

  const record = {
    id: question?.id ?? `${code}-${appState.currentQuestion + 1}`,
    answer,
    correct,
    ...(typeof score === 'number' ? { score, maxScore } : {})
  };

  bucket.answers[appState.currentQuestion] = record;
  return record;
}

function nextISTQuestion() {
  saveCurrentISTAnswer();
  const subtest = tests.IST.subtests[appState.currentSubtest];
  appState.currentQuestion++;

  if (appState.currentQuestion >= subtest.questions.length) {
    clearInterval(appState.timer);
    appState.currentSubtest++;
    appState.currentQuestion = 0;

    if (appState.currentSubtest >= tests.IST.subtests.length) {
      showThankYouAndHomeIST();
    } else {
      renderISTSubtestIntro();
    }
  } else {
    renderISTQuestion();
  }
}

function previousISTQuestion() {
  if (appState.currentQuestion <= 0) return;
  appState.currentQuestion--;
  renderISTQuestion();
}

/* ============================================================
   THANK YOU
   ============================================================ */
function showThankYouAndHomeIST() {
  if (appState.timer) clearInterval(appState.timer);

  if (typeof window.markTestCompleted === 'function') {
    markTestCompleted('IST');
  } else {
    window.appState = window.appState || {};
    appState.completed = appState.completed || {};
    appState.completed.IST = true;
    try {
      const saved = JSON.parse(localStorage.getItem('completed') || '{}');
      saved.IST = true;
      localStorage.setItem('completed', JSON.stringify(saved));
    } catch (e) {}
    if (typeof window.updateDownloadButtonState === 'function') {
      window.updateDownloadButtonState();
    }
  }

  window.__inTestView = false;
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="ist-shell">
      <div class="ist-panel">
        <div class="ist-panel-header">
          <div class="ist-header-row">
            <div>
              <div class="ist-eyebrow"><span>✅</span> COGNITIVE ASSESSMENT</div>
              <h2 class="ist-title">Tes IST Selesai</h2>
              <p class="ist-subtitle">Jawaban Anda telah berhasil disimpan.</p>
            </div>
          </div>
        </div>
        <div class="ist-body">
          <div class="ist-instruction-card" style="text-align:center;padding:32px 22px;">
            <div style="font-size:4rem;line-height:1;margin-bottom:16px;">🎉</div>
            <div style="font-size:1.15rem;font-weight:800;color:#172033;margin-bottom:10px;">Terima kasih!</div>
            <div style="max-width:650px;margin:0 auto;color:#667085;line-height:1.7;">
              Tes IST sudah selesai dan seluruh jawaban Anda telah tersimpan.
              <br>Silakan lanjut mengerjakan tes berikutnya yang tersedia.
            </div>
          </div>
          <div class="ist-actions">
            <button class="ist-btn-primary" id="btnContinueIST" type="button">✅ Lanjut Tes Berikutnya</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const btn = document.getElementById('btnContinueIST');
  if (btn) {
    btn.onclick = () => {
      window.__inTestView = false;
      if (typeof window.renderHome === 'function') {
        window.renderHome();
        setTimeout(() => {
          const el = document.getElementById('homeCard') || document.getElementById('downloadPDFBox');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    };
  }
}

/* ============================================================
   HITUNG SKOR PER SUBTES
   ============================================================ */
function computeISTPerSubtestScores() {
  const age = (typeof getAgeYearsForNorms === 'function') ? getAgeYearsForNorms() : 25;

  const subtestsFromTests = tests?.IST?.subtests?.map((st, idx) => ({
    idx, code: getSubtestCode(st?.name), name: st?.name,
    qlen: Array.isArray(st?.questions) ? st.questions.length : null
  })) || [];

  const subtestsFromAnswers = (Array.isArray(appState?.answers?.IST) ? appState.answers.IST : [])
    .map((bucket, idx) => ({
      idx, code: getSubtestCode(bucket?.name || ''),
      name: bucket?.name || `Subtes ${idx + 1}`, qlen: null
    }));

  const metaList = subtestsFromTests.length ? subtestsFromTests : subtestsFromAnswers;

  const agg = {};
  metaList.forEach(meta => {
    const code = meta.code || '';
    if (!code) return;

    const totalMaxBucket = (meta.qlen != null)
      ? (code === 'GE' ? meta.qlen * 2 : meta.qlen)
      : defaultMaxByCode(code);

    let rwBucket = 0;
    const bucket = appState?.answers?.IST?.[meta.idx];
    if (bucket?.answers?.length) {
      for (const a of bucket.answers) {
        if (typeof a.score === 'number') rwBucket += a.score;
        else if (typeof a.correct === 'boolean') rwBucket += a.correct ? 1 : 0;
      }
    }

    if (!agg[code]) {
      agg[code] = {
        code, rwSum: 0, totalMaxSum: 0,
        description: (typeof IST_DESCRIPTIONS !== 'undefined' && IST_DESCRIPTIONS[code])
          ? IST_DESCRIPTIONS[code] : '-'
      };
    }
    agg[code].rwSum += Number.isFinite(rwBucket) ? rwBucket : 0;
    agg[code].totalMaxSum += Number.isFinite(totalMaxBucket) ? totalMaxBucket : 0;
  });

  const summary = Object.values(agg).map(r => {
    const hardMax = r.code === 'GE' ? 32 : 20;
    const rwClamped = Math.max(0, Math.min(hardMax, Math.round(r.rwSum)));
    const totalMaxForFallback = Math.max(0, Math.round(r.totalMaxSum)) || defaultMaxByCode(r.code);
    const sw = rwToSW_ViaTable(r.code, age, rwClamped, totalMaxForFallback);
    return { code: r.code, rw: rwClamped, totalMax: totalMaxForFallback, sw, description: r.description };
  });

  const order = ['SE','WA','AN','GE','ME','RA','ZR','FA','WU'];
  summary.sort((a, b) => {
    const ia = order.indexOf(a.code), ib = order.indexOf(b.code);
    return (ia === -1 && ib === -1) ? a.code.localeCompare(b.code)
      : (ia === -1) ? 1 : (ib === -1) ? -1 : ia - ib;
  });

  return summary;
}

/* ============================================================
   PDF REPORTING — RENDER LENGKAP
   ============================================================ */
function renderISTSummaryToPDF(doc, pageWidth, ySection) {
  try {
    const LM = 16, RM = 16, MAXY = 280, LINE_H = 2.4;
    const TEXT_W = pageWidth - (LM + RM);
    const right = pageWidth - RM;

    /* ---- Helper internal ---- */
    function setCharSpaceSafe(doc, v = 0) {
      if (doc && typeof doc.setCharSpace === 'function') {
        try { doc.setCharSpace(v); } catch {}
      }
    }
    function normalizeSpaces(s) {
      return String(s || '').replace(/\u00A0/g, ' ').replace(/[ ]{2,}/g, ' ').trim();
    }
    function sanitizePDFText(s) {
      const map = {
        'Ä':'AE','Ö':'OE','Ü':'UE','ä':'ae','ö':'oe','ü':'ue','ß':'ss',
        '“':'"','”':'"','‘':"'",'’':"'",'–':'-','—':'-','•':'-',
        '→':'->','⇒':'=>>','←':'<-','Δ':'delta','≤':'<=','≥':'>=','≠':'!=','±':'+/-','×':'x','÷':'/'
      };
      let t = String(s || '').replace(/[\u00A0\u2007\u202F]/g, ' ');
      t = t.replace(/[\u00AD]/g, '');
      t = t.replace(/[ÄÖÜäöüß“”‘’–—•→⇒←Δ≤≥≠±×÷]/g, ch => map[ch] || ch);
      try { t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch {}
      t = t.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
      return t;
    }
    function safeStr(s) {
      return normalizeSpaces(sanitizePDFText(s));
    }
    function textSafe(text, x, y, opts) {
      setCharSpaceSafe(doc, 0);
      doc.text(safeStr(text), x, y, opts);
    }
    function ensurePage(y, need = 12) {
      if (y + need > MAXY - 5) { doc.addPage(); return 20; }
      return y;
    }
    function printLineWrap(text, y, x = LM, w = TEXT_W, size = 8, step = 4) {
      doc.setFontSize(size);
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(safeStr(String(text)), w);
      for (let i = 0; i < lines.length; i++) {
        y = ensurePage(y, step);
        textSafe(lines[i], x, y);
        y += step;
      }
      return y;
    }

    /* ---- Data summary ---- */
    const summary = computeISTPerSubtestScores();
    const toNum = v => (typeof toNumFlexible === 'function') ? toNumFlexible(v) : (Number(v) || 0);
    const totalRWDisplay = summary.reduce((acc, r) => acc + toNum(r?.rw), 0);

    const ageYears = (typeof getAgeYearsForNorms === 'function') ? getAgeYearsForNorms() : 25;
    const totalSWFromRW = (typeof getTotalSWFromRW === 'function') ? getTotalSWFromRW(totalRWDisplay, ageYears) : 100;
    const iqFromSW = (typeof getIQFromSW === 'function') ? getIQFromSW(totalSWFromRW) : null;
    const iqKet = (typeof iqCategory === 'function') ? iqCategory(iqFromSW) : '';

    /* ---- HEADING ---- */
    ySection = ensurePage(ySection + 2, 12);
    doc.setFontSize(9); doc.setTextColor(23, 78, 119); doc.setFont(undefined, 'bold');
    textSafe('RINGKASAN IST', LM, ySection + 6);
    doc.setTextColor(0, 0, 0); doc.setFont(undefined, 'normal');
    ySection += 10;

    /* ---- TABEL HEADER ---- */
    const col = {
      sub: LM,
      rw: LM + 22,
      sw: LM + 36,
      desc: LM + 52,
      ket: right - 14
    };
    const headerH = 7;

    ySection = ensurePage(ySection, headerH);

    doc.setFillColor(235, 242, 248);
    doc.rect(col.sub, ySection, right - col.sub, headerH, 'F');

    doc.setFontSize(7);
    doc.setTextColor(44, 62, 80);
    doc.setFont(undefined, 'bold');
    textSafe('SUBTES',    col.sub + 2,  ySection + 4.6);
    textSafe('RW',        col.rw + 2,   ySection + 4.6);
    textSafe('SW',        col.sw + 2,   ySection + 4.6);
    textSafe('DESKRIPSI', col.desc + 2, ySection + 4.6);
    textSafe('KET',       col.ket + 2,  ySection + 4.6);
    ySection += headerH;
    doc.setFont(undefined, 'normal');

    /* ---- TABEL BODY ---- */
    const CELL_FONT = 7, CELL_LINE = 3.6, ROW_PAD_TOP = 4.2, ROW_PAD_BOTTOM = 2.0;

    function drawCellMultiline(x, yTop, text, maxWidth, fontSize = CELL_FONT) {
      doc.setFontSize(fontSize);
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(safeStr(String(text || '-')), maxWidth);
      for (let i = 0; i < lines.length; i++) {
        textSafe(lines[i], x, yTop + ROW_PAD_TOP + i * CELL_LINE);
      }
      return ROW_PAD_TOP + Math.max(0, lines.length - 1) * CELL_LINE + ROW_PAD_BOTTOM;
    }

    if (Array.isArray(summary) && summary.length > 0) {
      summary.forEach((r, i) => {
        const code = String(r?.code || '').toUpperCase();
        const rwNum = Math.round(toNum(r?.rw));
        const swNum = Math.round(toNum(r?.sw));
        const ketLetter = (typeof letterCategoryFromSw === 'function') ? letterCategoryFromSw(swNum) : '-';

        const descWidth = col.ket - col.desc - 4;
        const ketWidth = right - col.ket - 2;

        doc.setFontSize(CELL_FONT);
        const descLines = doc.splitTextToSize(safeStr(r?.description || '-'), descWidth);
        const ketLines = doc.splitTextToSize(safeStr(ketLetter || '-'), ketWidth);
        const linesCount = Math.max(descLines.length, ketLines.length);
        const rowH = Math.max(7, ROW_PAD_TOP + (linesCount - 1) * CELL_LINE + ROW_PAD_BOTTOM);

        if (ySection + rowH > MAXY - 5) { doc.addPage(); ySection = 20; }

        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(col.sub, ySection, right - col.sub, rowH, 'F');
        }

        doc.setFontSize(CELL_FONT);
        textSafe(code || '-',                col.sub + 2, ySection + ROW_PAD_TOP);
        textSafe(String(rwNum),              col.rw + 2,  ySection + ROW_PAD_TOP);
        textSafe(String(swNum),              col.sw + 2,  ySection + ROW_PAD_TOP);
        drawCellMultiline(col.desc + 2, ySection, r?.description || '-', descWidth, CELL_FONT);
        drawCellMultiline(col.ket + 2, ySection, ketLetter || '-', ketWidth, CELL_FONT);

        ySection += rowH;
      });
    } else {
      const rowH = 7;
      ySection = ensurePage(ySection, rowH);
      doc.setFillColor(248, 250, 252);
      doc.rect(col.sub, ySection, right - col.sub, rowH, 'F');
      textSafe('-', col.sub + 2, ySection + 4.6);
      textSafe('Belum ada data subtes.', col.desc + 2, ySection + 4.6);
      ySection += rowH;
    }

    /* ---- BARIS JML (Total RW, Total SW) ---- */
    const jh = 7;
    ySection = ensurePage(ySection, jh);
    doc.setFillColor(232, 232, 232);
    doc.rect(col.sub, ySection, right - col.sub, jh, 'F');
    doc.setFont(undefined, 'bold');
    textSafe('JML',                            col.sub + 2, ySection + 4.6);
    textSafe(String(totalRWDisplay),           col.rw + 2,  ySection + 4.6);
    textSafe(String(Math.round(totalSWFromRW)), col.sw + 2, ySection + 4.6);
    doc.setFont(undefined, 'normal');
    ySection += jh + 5;

    /* ---- IQ & DOMINASI ---- */
    ySection = ensurePage(ySection, 12);
    const dominasi = (typeof computeDominasi === 'function') ? computeDominasi(summary) : '-';
    doc.setFontSize(8);
    doc.setTextColor(44, 62, 80);

    const iqLetter = (typeof letterCategoryFromSw === 'function') ? letterCategoryFromSw(totalSWFromRW) : '-';
    const iqLine = (iqFromSW != null)
      ? `IQ: ${iqFromSW} — ${iqKet || '-'} [${iqLetter}]`
      : `IQ: -`;
    ySection = printLineWrap(iqLine, ySection);
    ySection += 1;
    ySection = printLineWrap(`Dominasi: ${dominasi}`, ySection);
    ySection += 5;

    /* ---- KEKUATAN & KELEMAHAN ---- */
    const strengths = summary.filter(r => toNum(r?.sw) > 100).map(r => String(r?.code || '').toUpperCase());
    const weaknesses = summary.filter(r => toNum(r?.sw) < 100).map(r => String(r?.code || '').toUpperCase());

    ySection = ensurePage(ySection, 20);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    textSafe('Kekuatan', LM, ySection);
    doc.setFont(undefined, 'normal');
    ySection += LINE_H + 1;
    ySection = printLineWrap(
      'Subtes dengan performa di atas ambang referensi (SW > 100): ' +
      (strengths.length ? strengths.join(', ') : '-'),
      ySection
    );
    ySection += 4;

    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    textSafe('Kelemahan', LM, ySection);
    doc.setFont(undefined, 'normal');
    ySection += LINE_H + 1;
    ySection = printLineWrap(
      'Subtes di bawah ambang referensi (SW < 100): ' +
      (weaknesses.length ? weaknesses.join(', ') : '-'),
      ySection
    );
    ySection += 5;

    /* ---- CARA BERPIKIR ---- */
    const getSW = c => {
      const r = summary.find(x => String(x?.code || '').toUpperCase() === c);
      return toNum(r?.sw);
    };
    const sumFest = getSW('GE') + getSW('RA');
    const sumFlex = getSW('AN') + getSW('ZR');
    const diff = sumFest - sumFlex;

    ySection = ensurePage(ySection, 20);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    textSafe('Cara berpikir', LM, ySection);
    doc.setFont(undefined, 'normal');
    ySection += LINE_H + 1;

    let klasCara;
    if (diff > 10) klasCara = 'FESTIGUNG (Mantap/Eksak)';
    else if (diff < -10) klasCara = 'FLEKSIBILITAET (Fleksibel/Non-Eksak)';
    else klasCara = 'Kurang pasti (ambang tidak terlampaui)';

    ySection = printLineWrap(
      `GE+RA = ${sumFest} | AN+ZR = ${sumFlex} | delta = ${diff >= 0 ? '+' : ''}${diff} => ${klasCara}`,
      ySection
    );
    ySection += 5;

    /* ---- GRAFIK CORAK BERPIKIR ---- */
    ySection = ensurePage(ySection, 60);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    textSafe('Corak berpikir', LM, ySection);
    doc.setFont(undefined, 'normal');
    ySection += LINE_H + 2;

    const graphWidth = pageWidth - 40;
    const graphHeight = 46;

    if (typeof drawSWLineChart === 'function') {
      ySection = drawSWLineChart(doc, 20, ySection, graphWidth, graphHeight, summary);
      setCharSpaceSafe(doc, 0);
    }

    const vSE = getSW('SE'), vWA = getSW('WA'), vAN = getSW('AN'), vGE = getSW('GE');
    let pola = 'Tidak jelas (campuran/relatif datar).';
    if (vSE < vWA && vWA > vAN && vAN < vGE) pola = 'Huruf "M" -> cenderung verbal-teoretis.';
    else if (vSE > vWA && vWA < vAN && vAN > vGE) pola = 'Huruf "W" -> cenderung praktis-konkret.';
    ySection = printLineWrap(`Pola terdeteksi: ${pola}`, ySection);
    ySection += 5;

    /* ---- KESIMPULAN PER POSISI ---- */
    const position = (typeof appState !== 'undefined' && appState.identity && appState.identity.position)
      ? String(appState.identity.position) : '';

    ySection = ensurePage(ySection, 25);
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'bold');

    const showGuru = position === 'Dosen/Guru';
    const showITStaff = position === 'IT Staff' || position === 'Technical Staff';

    let kesimpulanLines = [];

    if (showGuru) {
      kesimpulanLines.push('Kesimpulan untuk Posisi Guru/Dosen');
      const guruFit = (typeof computeGuruFitLetter === 'function') ? computeGuruFitLetter(summary, iqFromSW) : '-';
      const buildRes = (typeof buildGuruReasons === 'function') ? buildGuruReasons(summary) : { reasons: [], notes: [] };

      kesimpulanLines.push(`Kesesuaian: ${guruFit}`);
      if (buildRes.reasons.length) {
        kesimpulanLines.push('');
        kesimpulanLines.push('Alasan:');
        buildRes.reasons.forEach(r => kesimpulanLines.push('- ' + r));
      }
      if (buildRes.notes.length) {
        kesimpulanLines.push('');
        kesimpulanLines.push('Catatan pengembangan:');
        buildRes.notes.forEach(n => kesimpulanLines.push('- ' + n));
      }
    } else if (showITStaff) {
      kesimpulanLines.push('Kesimpulan untuk Posisi IT Staff');
      const itFit = (typeof computeITStaffFitLetter === 'function') ? computeITStaffFitLetter(summary, iqFromSW) : '-';
      const buildRes = (typeof buildITStaffReasons === 'function') ? buildITStaffReasons(summary) : { reasons: [], notes: [] };

      kesimpulanLines.push(`Kesesuaian: ${itFit}`);
      if (buildRes.reasons.length) {
        kesimpulanLines.push('');
        kesimpulanLines.push('Alasan:');
        buildRes.reasons.forEach(r => kesimpulanLines.push('- ' + r));
      }
      if (buildRes.notes.length) {
        kesimpulanLines.push('');
        kesimpulanLines.push('Catatan pengembangan:');
        buildRes.notes.forEach(n => kesimpulanLines.push('- ' + n));
      }
    } else {
      kesimpulanLines.push('Kesimpulan Umum');
      kesimpulanLines.push('Tidak ada analisis spesifik untuk posisi ini.');
    }

    /* Render kotak kesimpulan */
    doc.setFontSize(8);
    const BOX_W = TEXT_W, INNER_X = LM + 3, INNER_W = BOX_W - 6, LINE_GAP = 3.4;
    let wrapped = [];
    kesimpulanLines.forEach(l => {
      if (!l) { wrapped.push(''); return; }
      const parts = doc.splitTextToSize(l, INNER_W);
      wrapped = wrapped.concat(parts);
    });

    const contentH = Math.max(14, wrapped.length * LINE_GAP + 6);
    ySection = ensurePage(ySection, contentH + 6);

    doc.setDrawColor(225, 229, 235);
    doc.setFillColor(248, 250, 252);
    doc.rect(LM, ySection, BOX_W, contentH, 'FD');

    let yy = ySection + 6;
    doc.setTextColor(44, 62, 80);
    wrapped.forEach((t, idx) => {
      if (t === '') { yy += LINE_GAP; return; }
      /* Baris judul kesimpulan → bold */
      if (idx === 0) {
        doc.setFont(undefined, 'bold');
        textSafe(t, INNER_X, yy);
        doc.setFont(undefined, 'normal');
      } else {
        textSafe(t, INNER_X, yy);
      }
      yy += LINE_GAP;
    });
    ySection += contentH + 6;

    doc.setTextColor(0, 0, 0);
    return ySection + 2;

  } catch (e) {
    console.warn('[IST] renderISTSummaryToPDF error', e);
    return ySection;
  }
}

/* ============================================================
   FUNGSI PDF PENDUKUNG — Sudah tergabung di Summary
   (return ySection saja biar tidak double-render)
   ============================================================ */
function renderISTScoresToPDF(doc, pageWidth, ySection, summary) {
  return ySection;
}

function renderISTIQToPDF(doc, pageWidth, ySection, summary) {
  return ySection;
}

function renderISTDescriptionsToPDF(doc, pageWidth, ySection, summary) {
  return ySection;
}

function renderISTThinkingDimensionToPDF(doc, pageWidth, ySection, summary) {
  return ySection;
}

function renderISTSWChartToPDF(doc, pageWidth, ySection, summary) {
  return ySection;
}

function renderISTMWAnalysisToPDF(doc, pageWidth, ySection, summary) {
  return ySection;
}

console.log('[TEST-IST] ✓ Loaded — 21 fungsi + PDF reporting');
