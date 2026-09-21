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
        ${renderTestPageHeader({
          eyebrow: 'INTELLIGENCE ASSESSMENT',
          title: `Subtes ${subtest.name}`,
          subtitle: subtest.description || 'Tes kemampuan intelektual',
          timeLabel: `${Math.floor((subtest.time || 0) / 60)} menit`
        })}

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
          ${renderTestPageHeader({
            eyebrow: 'MEMORY PHASE',
            title: subtest.memorizePhase.title || 'Hafalkan daftar berikut',
            subtitle: 'Perhatikan informasi berikut dan hafalkan sebaik mungkin sebelum waktu berakhir.'
          })}
          <div class="ist-body">
            <div style="display:flex;justify-content:center;margin-bottom:20px;">
              <div class="ist-memory-timer" id="memorize-timer-display">
                ⏳ ${mm}:${ss}
              </div>
            </div>
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

/* ============================================================
   ✅ ZR (Zahlenreihen) — Render tiap angka sebagai kotak
   + kotak jawaban di ujung deret
   ============================================================ */
function renderZRSeriesInput(question) {
  const raw = String(question?.text || '');

  // Split berdasarkan koma, bersihkan spasi
  const parts = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Ambil hanya angka (buang tanda '?')
  const numbers = parts.filter(p => p !== '?' && p !== '');

  let html = '<div class="zr-series-container">';

  // Kotak angka
  numbers.forEach(num => {
    html += `<div class="zr-box zr-box-number">${num}</div>`;
  });

  // Kotak jawaban (input)
  html += `
    <div class="zr-box zr-box-answer">
      <input
        type="number"
        id="ist-answer"
        class="zr-input"
        placeholder="?"
        autocomplete="off"
        inputmode="numeric"
        aria-label="Jawaban deret angka">
    </div>
  `;

  html += '</div>';

  return html;
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
    const code = getSubtestCode(subtest.name);

    if (code === 'ZR') {
      // ✅ ZR: render tiap angka sebagai kotak + kotak jawaban di samping
      optionsHTML = renderZRSeriesInput(question);
    } else {
      // RA dan tipe number-input lain: tetap pakai input biasa
      optionsHTML = `
        <div class="ist-input-wrap">
          <label class="ist-input-label">Masukkan jawaban angka</label>
          <input type="number" id="ist-answer" class="ist-number-input" placeholder="Ketik angka jawaban..." autocomplete="off">
        </div>
      `;
    }
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
                 <div class="ist-question-heading">${(() => {
          const code = getSubtestCode(subtest.name);
          if (code === 'ZR') return 'Lanjutkan deret angka berikut:';
          return question.text || '';
        })()}</div>
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
        ${renderTestPageHeader({
          eyebrow: 'COGNITIVE ASSESSMENT',
          title: 'Tes IST Selesai',
          subtitle: 'Jawaban Anda telah berhasil disimpan.',
          showBack: false
        })}
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
        const ketLetter = (typeof swCategory5 === 'function') ? swCategory5(swNum) : '-';

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

    const iqKategori = (typeof swCategory5 === 'function') ? `${swCategory5(Math.round(totalSWFromRW))} (${Math.round(totalSWFromRW)})` : '-';
const iqLine = (iqFromSW != null)
  ? `IQ: ${iqFromSW} — ${iqKet || '-'} [${iqKategori}]`
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

      /* ---- KESIMPULAN PER POSISI (ANALISIS LENGKAP) ---- */
    const position = (typeof appState !== 'undefined' && appState.identity && appState.identity.position)
      ? String(appState.identity.position) : '';

    ySection = ensurePage(ySection, 25);
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'bold');

    let kesimpulanLines = [];

    if (position && typeof computeISTPositionFit === 'function') {
      const fit = computeISTPositionFit(summary, position);

      if (fit) {
        /* Header */
        kesimpulanLines.push(`ANALISIS IST UNTUK POSISI: ${fit.label}`);
        kesimpulanLines.push('');

        /* Skor & Kategori */
        kesimpulanLines.push(`Skor Kesesuaian: ${fit.skorAkhir} — ${fit.kategori}`);
        kesimpulanLines.push('');

        /* Ringkasan status */
        kesimpulanLines.push(`Ringkasan: ${fit.ringkasan.kuat} kuat, ${fit.ringkasan.cukup} cukup, ${fit.ringkasan.kurang} kurang, ${fit.ringkasan.lemah} lemah dari ${fit.ringkasan.total} subtes dinilai.`);
        kesimpulanLines.push('');

        /* Tabel per subtes */
        kesimpulanLines.push('Detail per Subtes:');
        fit.subtes.forEach(s => {
          const gapStr = s.gap >= 0 ? `+${s.gap}` : `${s.gap}`;
          kesimpulanLines.push(`- ${s.code} (SW ${s.sw} / min ${s.minSW}, gap ${gapStr}): ${s.label} — ${s.status}.`);
        });
        kesimpulanLines.push('');

        /* Deskripsi posisi */
        kesimpulanLines.push('Deskripsi Posisi:');
        kesimpulanLines.push(fit.description);
        kesimpulanLines.push('');

        /* Kekuatan */
        const kuat = fit.subtes.filter(s => s.status === 'Sangat Kuat' || s.status === 'Kuat');
        if (kuat.length > 0) {
          kesimpulanLines.push('Kekuatan Utama:');
          kuat.forEach(s => {
            kesimpulanLines.push(`- ${s.code} (SW ${s.sw}): ${s.label}`);
          });
          kesimpulanLines.push('');
        }

        /* Kelemahan */
        const kurang = fit.subtes.filter(s => s.status === 'Kurang' || s.status === 'Lemah');
        if (kurang.length > 0) {
          kesimpulanLines.push('Area Pengembangan:');
          kurang.forEach(s => {
            kesimpulanLines.push(`- ${s.code} (SW ${s.sw}, gap ${s.gap}): ${s.label}`);
          });
          kesimpulanLines.push('');
        }

        /* Rekomendasi */
        kesimpulanLines.push('Rekomendasi:');
        if (fit.kategori === 'SANGAT SESUAI' || fit.kategori === 'SESUAI') {
          kesimpulanLines.push(`Kandidat menunjukkan profil yang ${fit.kategori.toLowerCase()} untuk posisi ${fit.label}.`);
          if (kuat.length > 0) {
            kesimpulanLines.push(`Kekuatan pada ${kuat.map(s => s.code).join(', ')} menjadi modal utama.`);
          }
          if (kurang.length > 0) {
            kesimpulanLines.push(`Penguatan pada ${kurang.map(s => s.code).join(', ')} disarankan agar kinerja optimal dalam jangka panjang.`);
          } else {
            kesimpulanLines.push('Tidak ditemukan kelemahan signifikan. Kandidat dapat langsung ditempatkan dengan supervisi ringan.');
          }
        } else if (fit.kategori === 'CUKUP SESUAI') {
          kesimpulanLines.push(`Kandidat memiliki kecocokan moderat untuk posisi ${fit.label}.`);
          if (kurang.length > 0) {
            kesimpulanLines.push(`Perlu pendampingan pada subtes ${kurang.map(s => s.code).join(', ')}.`);
          }
        } else {
          kesimpulanLines.push(`Kandidat belum menunjukkan kecocokan optimal untuk posisi ${fit.label}.`);
          kesimpulanLines.push('Disarankan pengembangan lebih lanjut atau penempatan pada posisi lain yang lebih sesuai.');
        }
      } else {
        /* Posisi tidak dikenali */
        kesimpulanLines.push(`Posisi: ${position}`);
        kesimpulanLines.push('Analisis spesifik belum tersedia untuk posisi ini.');
        kesimpulanLines.push(`Skor rata-rata SW: ${Math.round(summary.reduce((a, r) => a + (Number(r?.sw) || 0), 0) / Math.max(1, summary.length))}`);
      }
    } else {
      kesimpulanLines.push('Kesimpulan Umum');
      kesimpulanLines.push('Tidak ada informasi posisi. Analisis umum berdasarkan rata-rata SW.');
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
/* ============================================================
   ANALISIS LENGKAP IST PER POSISI
   - Modul ini menghasilkan analisis komprehensif untuk posisi
     yang dilamar berdasarkan 9 subtes IST
   ============================================================ */

/* ---- Kebutuhan IST per Posisi (Bobot + Threshold) ---- */
const IST_POSITION_REQUIREMENTS = {

  'Administrator': {
    label: 'Administrator / Staf Administrasi',
    description: 'Peran ini membutuhkan ketelitian tinggi, kemampuan mengelola data/dokumen, konsistensi proses, dan kemampuan berkomunikasi dengan jelas.',
    subtesKunci: {
      SE: { bobot: 0.20, minSW: 100, label: 'Pemahaman verbal & konteks kerja' },
      WA: { bobot: 0.20, minSW: 100, label: 'Kemampuan bahasa & empati' },
      AN: { bobot: 0.10, minSW: 95,  label: 'Fleksibilitas berpikir' },
      GE: { bobot: 0.15, minSW: 95,  label: 'Abstraksi & pembentukan konsep' },
      ME: { bobot: 0.15, minSW: 100, label: 'Memori kerja & retensi' },
      RA: { bobot: 0.10, minSW: 95,  label: 'Hitungan praktis' },
      ZR: { bobot: 0.10, minSW: 95,  label: 'Deret angka & pola' }
    }
  },

  'Dosen/Guru': {
    label: 'Dosen / Guru',
    description: 'Peran ini membutuhkan kekuatan verbal tinggi (menjelaskan materi), memori kerja yang kuat (mengelola banyak informasi kelas), penalaran konseptual, serta kemampuan membangun relasi dengan siswa.',
    subtesKunci: {
      SE: { bobot: 0.20, minSW: 105, label: 'Pemahaman konteks & pengambilan keputusan' },
      WA: { bobot: 0.20, minSW: 105, label: 'Kemampuan bahasa & empati (penjelasan materi)' },
      AN: { bobot: 0.15, minSW: 100, label: 'Analogi & contoh konkret untuk siswa' },
      GE: { bobot: 0.15, minSW: 100, label: 'Abstraksi & inti persoalan' },
      ME: { bobot: 0.15, minSW: 105, label: 'Memori kerja (nama siswa, materi, jadwal)' },
      RA: { bobot: 0.05, minSW: 95,  label: 'Hitungan (penilaian, materi berhitung)' },
      ZR: { bobot: 0.05, minSW: 95,  label: 'Kelincahan berpikir angka' },
      FA: { bobot: 0.03, minSW: 95,  label: 'Visual-spasial (ilustrasi)' },
      WU: { bobot: 0.02, minSW: 95,  label: 'Daya bayang ruang (alat peraga)' }
    }
  },

  'Technical Staff': {
    label: 'Technical Staff',
    description: 'Peran ini membutuhkan ketelitian, konsistensi mengikuti SOP, kemampuan visual-spasial, dan penalaran praktis-konkret untuk menyelesaikan masalah teknis.',
    subtesKunci: {
      SE: { bobot: 0.10, minSW: 95,  label: 'Pemahaman instruksi' },
      WA: { bobot: 0.10, minSW: 95,  label: 'Komunikasi teknis' },
      AN: { bobot: 0.15, minSW: 100, label: 'Analogi teknis & perpindahan hubungan' },
      GE: { bobot: 0.15, minSW: 100, label: 'Kategorisasi & konsep teknis' },
      ME: { bobot: 0.10, minSW: 95,  label: 'Memori prosedur & SOP' },
      RA: { bobot: 0.15, minSW: 100, label: 'Hitungan praktis & presisi' },
      ZR: { bobot: 0.05, minSW: 95,  label: 'Pola angka teknis' },
      FA: { bobot: 0.10, minSW: 100, label: 'Visual-spasial (membaca diagram)' },
      WU: { bobot: 0.10, minSW: 100, label: 'Daya bayang tiga dimensi' }
    }
  },

  'IT Staff': {
    label: 'IT Staff / Programmer',
    description: 'Peran ini membutuhkan penalaran logis tinggi, kemampuan analisis-kategorisasi, kemampuan numerik untuk algoritma, dan visual-spasial untuk desain sistem.',
    subtesKunci: {
      SE: { bobot: 0.05, minSW: 95,  label: 'Pemahaman requirement' },
      WA: { bobot: 0.05, minSW: 95,  label: 'Dokumentasi teknis' },
      AN: { bobot: 0.20, minSW: 105, label: 'Logika algoritma & problem solving' },
      GE: { bobot: 0.20, minSW: 105, label: 'Kategorisasi sistem & pola data' },
      ME: { bobot: 0.10, minSW: 100, label: 'Memori syntax & referensi API' },
      RA: { bobot: 0.15, minSW: 105, label: 'Numerik untuk algoritma' },
      ZR: { bobot: 0.15, minSW: 105, label: 'Deret angka & logika matematis' },
      FA: { bobot: 0.05, minSW: 100, label: 'Visual-spasial (UI/UX, diagram)' },
      WU: { bobot: 0.05, minSW: 100, label: 'Daya bayang arsitektur sistem' }
    }
  },

  'Housekeeping': {
    label: 'Housekeeping / Staf Kebersihan',
    description: 'Peran ini membutuhkan konsistensi kerja, kemampuan mengikuti SOP, perhatian pada detail, dan ritme kerja stabil.',
    subtesKunci: {
      SE: { bobot: 0.10, minSW: 95,  label: 'Pemahaman instruksi kerja' },
      WA: { bobot: 0.10, minSW: 95,  label: 'Komunikasi dengan tim' },
      AN: { bobot: 0.10, minSW: 95,  label: 'Adaptasi terhadap situasi' },
      GE: { bobot: 0.10, minSW: 95,  label: 'Pemahaman standar & kategori' },
      ME: { bobot: 0.15, minSW: 100, label: 'Memori SOP & area kerja' },
      RA: { bobot: 0.15, minSW: 100, label: 'Ketelitian hitungan (pengukuran bahan)' },
      ZR: { bobot: 0.10, minSW: 95,  label: 'Pola kerja berulang' },
      FA: { bobot: 0.10, minSW: 95,  label: 'Visual-spasial (tata letak area)' },
      WU: { bobot: 0.10, minSW: 95,  label: 'Daya bayang ruang kerja' }
    }
  }
};

/* ============================================================
   HITUNG SKOR KECOCOKAN POSISI
   ============================================================ */
function computeISTPositionFit(summary, positionKey) {
  const req = IST_POSITION_REQUIREMENTS[positionKey];
  if (!req) return null;

  const getSW = code => {
    const r = Array.isArray(summary)
      ? summary.find(x => String(x?.code || '').toUpperCase() === code)
      : null;
    return (typeof toNumFlexible === 'function') ? toNumFlexible(r?.sw) : (Number(r?.sw) || 0);
  };

  const subtesArr = [];
  let totalScore = 0;
  let totalWeight = 0;
  let keteranganKuat = 0;
  let keteranganCukup = 0;
  let keteranganKurang = 0;
  let keteranganLemah = 0;

  Object.entries(req.subtesKunci).forEach(([code, conf]) => {
    const sw = getSW(code);
    const gap = sw - conf.minSW;
    let status, symbol;

    if (gap >= 10) { status = 'Sangat Kuat'; symbol = 'SS'; keteranganKuat++; }
    else if (gap >= 0) { status = 'Kuat'; symbol = 'S'; keteranganKuat++; }
    else if (gap >= -10) { status = 'Cukup'; symbol = 'C'; keteranganCukup++; }
    else if (gap >= -20) { status = 'Kurang'; symbol = 'K'; keteranganKurang++; }
    else { status = 'Lemah'; symbol = 'L'; keteranganLemah++; }

    /* Skor kontribusi: SW aktual × bobot */
    totalScore += sw * conf.bobot;
    totalWeight += conf.bobot;

    subtesArr.push({
      code,
      label: conf.label,
      sw,
      minSW: conf.minSW,
      gap,
      bobot: conf.bobot,
      status,
      symbol
    });
  });

  const skorAkhir = totalWeight > 0 ? totalScore / totalWeight : 0;

  /* Tentukan kategori akhir */
  let kategori, kategoriColor;
  if (keteranganLemah > 0 && keteranganKuat === 0) {
    kategori = 'TIDAK SESUAI';
    kategoriColor = 'red';
  } else if (skorAkhir >= 110) {
    kategori = 'SANGAT SESUAI';
    kategoriColor = 'green';
  } else if (skorAkhir >= 105) {
    kategori = 'SESUAI';
    kategoriColor = 'green-light';
  } else if (skorAkhir >= 95) {
    kategori = 'CUKUP SESUAI';
    kategoriColor = 'blue';
  } else if (skorAkhir >= 85) {
    kategori = 'KURANG SESUAI';
    kategoriColor = 'orange';
  } else {
    kategori = 'TIDAK SESUAI';
    kategoriColor = 'red';
  }

  return {
    positionKey,
    label: req.label,
    description: req.description,
    subtes: subtesArr,
    skorAkhir: Math.round(skorAkhir * 10) / 10,
    kategori,
    kategoriColor,
    ringkasan: {
      kuat: keteranganKuat,
      cukup: keteranganCukup,
      kurang: keteranganKurang,
      lemah: keteranganLemah,
      total: subtesArr.length
    }
  };
}

/* ============================================================
   NARASI ANALISIS LENGKAP PER POSISI
   ============================================================ */
function generateISTPositionNarrative(fit) {
  if (!fit) return [];

  const lines = [];
  const sub = fit.subtes;
  const nama = sub.filter(s => s.status === 'Sangat Kuat' || s.status === 'Kuat').map(s => s.code);
  const lemah = sub.filter(s => s.status === 'Lemah' || s.status === 'Kurang').map(s => s.code);

  lines.push(`Posisi: ${fit.label}`);
  lines.push(`Skor Kesesuaian: ${fit.skorAkhir} — ${fit.kategori}`);
  lines.push('');
  lines.push('Deskripsi Posisi:');
  lines.push(fit.description);
  lines.push('');

  /* Kekuatan */
  if (nama.length > 0) {
    lines.push('Kekuatan Utama:');
    sub.filter(s => s.status === 'Sangat Kuat' || s.status === 'Kuat').forEach(s => {
      lines.push(`- ${s.code} (SW ${s.sw} vs min ${s.minSW}): ${s.label} — ${s.status}.`);
    });
    lines.push('');
  }

  /* Kelemahan */
  if (lemah.length > 0) {
    lines.push('Area yang Perlu Dikembangkan:');
    sub.filter(s => s.status === 'Lemah' || s.status === 'Kurang').forEach(s => {
      lines.push(`- ${s.code} (SW ${s.sw} vs min ${s.minSW}, gap ${s.gap >= 0 ? '+' : ''}${s.gap}): ${s.label} — ${s.status}.`);
    });
    lines.push('');
  }

  /* Rekomendasi */
  lines.push('Rekomendasi:');
  if (fit.kategori === 'SANGAT SESUAI' || fit.kategori === 'SESUAI') {
    lines.push(`Kandidat menunjukkan profil yang ${fit.kategori.toLowerCase()} untuk posisi ${fit.label}. Kekuatan pada ${nama.join(', ')} menjadi modal utama.`);
    if (lemah.length > 0) {
      lines.push(`Namun, tetap perlu penguatan pada subtes ${lemah.join(', ')} agar kinerja optimal dalam jangka panjang.`);
    } else {
      lines.push('Tidak ditemukan kelemahan signifikan. Kandidat dapat langsung ditempatkan pada peran ini dengan supervisi ringan.');
    }
  } else if (fit.kategori === 'CUKUP SESUAI') {
    lines.push(`Kandidat memiliki kecocokan moderat untuk posisi ${fit.label}.`);
    lines.push(`Perlu pendampingan dan pengembangan pada subtes ${lemah.join(', ') || '(tidak ada)'} agar lebih siap.`);
  } else {
    lines.push(`Kandidat belum menunjukkan kecocokan yang optimal untuk posisi ${fit.label}.`);
    lines.push(`Disarankan untuk pengembangan lebih lanjut atau penempatan pada posisi yang lebih sesuai dengan profil kandidat.`);
  }

  return lines;
}

console.log('[IST-POSITION-ANALYSIS] ✓ Loaded — 5 posisi');
console.log('[TEST-IST] ✓ Loaded — 22 fungsi + PDF reporting');
