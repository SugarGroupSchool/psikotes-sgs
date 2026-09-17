/* =========================================================
   PAPI KOSTICK TEST — Full Logic
   ========================================================= */

/* ============================================================
   TIMER DISPLAY
   ============================================================ */
   function updatePAPITimerDisplay() {
    const el = document.getElementById('papi-timer-display');
    if (!el) return;
  
    const sec = Math.max(0, Number(appState.timeLeft || 0));
    const min = Math.floor(sec / 60).toString().padStart(2, '0');
    const seconds = (sec % 60).toString().padStart(2, '0');
  
    el.textContent = `${min}:${seconds}`;
    el.style.color = sec <= 30 ? '#c62828' : '#1b4f8f';
  }
  
  /* ============================================================
     INTRO PAPI
     ============================================================ */
  function renderPAPIIntro() {
    const app = document.getElementById('app');
  
    const totalQuestions = Array.isArray(tests?.PAPI?.questions) ? tests.PAPI.questions.length : 0;
    const totalTime = Number(tests?.PAPI?.time || 0);
    const totalMinutes = Math.floor(totalTime / 60);
  
    app.innerHTML = `
      <div class="ist-shell">
        <div class="ist-panel">
          <div class="ist-panel-header">
            <div class="ist-header-row">
            <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;">
                ${renderTestLogoBadge()}
                <div>
                  <div class="ist-eyebrow">PERSONALITY ASSESSMENT</div>
                  <h2 class="ist-title" style="margin-top:11px;">${tests.PAPI.name}</h2>
                  <p class="ist-subtitle">${tests.PAPI.description || ''}</p>
                </div>
              </div>
              <div class="ist-time-chip">
                <span class="ist-time-chip-icon">⏱</span>
                <span>${totalMinutes} menit</span>
              </div>
            </div>
          </div>
  
          <div class="ist-body">
            <div class="ist-info-grid">
              <div class="ist-info-card">
                <div class="ist-info-label">Tes</div>
                <div class="ist-info-value">PAPI Kostick</div>
              </div>
              <div class="ist-info-card">
                <div class="ist-info-label">Jumlah Soal</div>
                <div class="ist-info-value">${totalQuestions} soal</div>
              </div>
              <div class="ist-info-card">
                <div class="ist-info-label">Tampilan</div>
                <div class="ist-info-value">2 soal / layar</div>
              </div>
            </div>
  
            <div class="ist-instruction-card">
              <div class="ist-section-heading">
                <span class="ist-section-icon">📘</span>
                Petunjuk Pengerjaan
              </div>
              <div class="ist-instruction-text">
                <ul style="margin:0;padding-left:22px;line-height:1.75;">
                  <li>Setiap soal terdiri dari dua pernyataan.</li>
                  <li>Pilih <strong>satu pernyataan</strong> yang paling sesuai dengan diri Anda.</li>
                  <li>Tidak ada jawaban benar atau salah.</li>
                  <li>Jawablah secara jujur dan spontan.</li>
                  <li>Waktu pengerjaan: <strong>${totalMinutes} menit</strong>.</li>
                </ul>
              </div>
            </div>
  
            <div class="ist-example">
              <h4 class="ist-example-title">✦ Contoh Soal</h4>
              <div class="ist-instruction-text">
                <strong>Soal:</strong> ${tests.PAPI.example?.question || ''}
              </div>
              <div class="papi-question-grid" style="margin-top:14px;">
                <div class="papi-option-box">
                  <span class="papi-option-letter">A</span>
                  <span class="papi-option-text">${tests.PAPI.example?.optionA || ''}</span>
                </div>
                <div class="papi-option-box">
                  <span class="papi-option-letter">B</span>
                  <span class="papi-option-text">${tests.PAPI.example?.optionB || ''}</span>
                </div>
              </div>
              ${tests.PAPI.example?.explanation ? `
                <div class="ist-example-explanation" style="margin-top:14px;">
                  <strong>Penjelasan:</strong> ${tests.PAPI.example.explanation}
                </div>
              ` : ''}
            </div>
  
            <div class="ist-actions">
              <button class="ist-btn-primary" onclick="startPAPITest()">🚀 Mulai Tes PAPI</button>
              <button class="ist-btn-secondary" onclick="renderHome()" type="button">Kembali</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /* ============================================================
     START PAPI
     ============================================================ */
  function startPAPITest() {
    appState.currentTest = "PAPI";
    appState.currentQuestion = 0;
    appState.timeLeft = tests.PAPI.time || 300;
    appState.answers = appState.answers || {};
    appState.answers.PAPI = [];
    appState.completed = appState.completed || {};
    appState.completed.PAPI = false;
  
    clearInterval(appState.timer);
  
    appState.timer = setInterval(() => {
      appState.timeLeft--;
      if (appState.timeLeft <= 0) {
        clearInterval(appState.timer);
        finishPAPITestByTime();
      }
    }, 1000);
  
    renderPAPIQuestion();
  }
  
  /* ============================================================
     RENDER 2 SOAL
     ============================================================ */
  function renderPAPIQuestion() {
    const soal = tests?.PAPI?.questions || [];
    const startIndex = Number(appState.currentQuestion || 0);
  
    if (startIndex >= soal.length) {
      finishPAPITest();
      return;
    }
  
    const q1 = soal[startIndex] || null;
    const q2 = soal[startIndex + 1] || null;
  
    const totalQuestions = soal.length;
    const questionNumber1 = startIndex + 1;
    const questionNumber2 = startIndex + 2;
  
    const currentPair = Math.floor(startIndex / 2) + 1;
    const totalPairs = Math.ceil(totalQuestions / 2);
    const progress = totalPairs ? ((currentPair - 1) / totalPairs) * 100 : 0;
    const hasPrevious = startIndex > 0;
  
    function renderSinglePAPIQuestion(question, questionIndex, questionNumber) {
      if (!question) return '';
  
      return `
        <div class="papi-question-card" data-question-index="${questionIndex}">
          <div class="papi-question-number">SOAL ${questionNumber}</div>
          <div class="papi-question-text">${question.text || ''}</div>
          <div class="papi-option-list">
            <label class="papi-option-box" onclick="selectPAPIAnswer(this, 'A', ${questionIndex})">
              <input type="radio" name="papi-answer-${questionIndex}" value="A">
              <span class="papi-option-letter">A</span>
              <span class="papi-option-text">${question.optionA || ''}</span>
              <span class="papi-check-indicator"></span>
            </label>
  
            <label class="papi-option-box" onclick="selectPAPIAnswer(this, 'B', ${questionIndex})">
              <input type="radio" name="papi-answer-${questionIndex}" value="B">
              <span class="papi-option-letter">B</span>
              <span class="papi-option-text">${question.optionB || ''}</span>
              <span class="papi-check-indicator"></span>
            </label>
          </div>
        </div>
      `;
    }
  
    const app = document.getElementById('app');
  
    app.innerHTML = `
      <div class="ist-shell">
        <div class="ist-question-panel">
          <div class="ist-question-top">
            <div class="ist-question-meta">
              <div>
                <div class="ist-question-label">TES PAPI</div>
                <div class="ist-question-badge">📊 Personality Assessment</div>
              </div>
              <div class="ist-time-chip">
                <span class="ist-time-chip-icon">⏱</span>
                <span id="papi-timer-display">00:00</span>
              </div>
            </div>
  
            <div class="ist-progress-wrap">
              <div class="ist-progress-info">
                <span>Soal ${questionNumber1} ${q2 ? `–${questionNumber2}` : ''} dari ${totalQuestions}</span>
                <span>${Math.round(progress)}%</span>
              </div>
              <div class="ist-progress-track">
                <div class="ist-progress-fill" style="width:${progress}%"></div>
              </div>
            </div>
          </div>
  
          <div class="ist-question-body">
            <div class="ist-question-heading" style="margin-bottom:4px;">
              Pilih satu pernyataan yang paling sesuai dengan diri Anda.
            </div>
  
            <div class="papi-helper-box">
              <strong>Petunjuk:</strong> Pilih hanya satu jawaban pada setiap soal.<br>
              Jawablah sesuai keadaan diri Anda yang sebenarnya.
            </div>
  
            <div class="papi-question-grid">
              ${renderSinglePAPIQuestion(q1, startIndex, questionNumber1)}
              ${renderSinglePAPIQuestion(q2, startIndex + 1, questionNumber2)}
            </div>
  
            <div id="papi-error" class="papi-error" style="display:none;"></div>
  
            <div class="ist-question-actions">
              <div class="ist-action-left">
                ${hasPrevious ? `
                  <button class="ist-prev-btn" id="btnPreviousPAPI" type="button">
                    ← <span>Sebelumnya</span>
                  </button>
                ` : ''}
              </div>
              <div class="ist-action-right">
                <button class="ist-main-btn" id="btnNextPAPI" type="button">
                  ${(startIndex + 2) < totalQuestions ? 'Lanjut →' : 'Selesai ✓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  
    updatePAPITimerDisplay();
    restorePAPIAnswersOnScreen(startIndex, q1, q2);
  
    const nextBtn = document.getElementById('btnNextPAPI');
    if (nextBtn) nextBtn.onclick = nextPAPIQuestion;
  
    const previousBtn = document.getElementById('btnPreviousPAPI');
    if (previousBtn) previousBtn.onclick = previousPAPIQuestion;
  }
  
  /* ============================================================
     SELECT ANSWER
     ============================================================ */
  function selectPAPIAnswer(element, value, questionIndex) {
    const card = element.closest('.papi-question-card');
    if (!card) return;
  
    card.querySelectorAll('.papi-option-box').forEach(box => {
      box.classList.remove('selected');
    });
  
    element.classList.add('selected');
    const input = element.querySelector('input');
    if (input) input.checked = true;
  
    const error = document.getElementById('papi-error');
    if (error) {
      error.style.display = 'none';
      error.textContent = '';
    }
  }
  
  /* ============================================================
     RESTORE ANSWERS
     ============================================================ */
  function restorePAPIAnswersOnScreen(startIndex, q1, q2) {
    const indices = [startIndex];
    if (q2) indices.push(startIndex + 1);
  
    indices.forEach(questionIndex => {
      const answer = appState.answers?.PAPI?.find(
        record => Number(record?.questionIndex) === Number(questionIndex)
      );
      if (!answer) return;
  
      const input = document.querySelector(
        `input[name="papi-answer-${questionIndex}"][value="${answer.answer}"]`
      );
      if (!input) return;
  
      input.checked = true;
      const box = input.closest('.papi-option-box');
      if (box) box.classList.add('selected');
    });
  }
  
  /* ============================================================
     SAVE ANSWER
     ============================================================ */
  function savePAPISingleAnswer(questionIndex) {
    const question = tests.PAPI.questions[questionIndex];
    if (!question) return null;
  
    const selected = document.querySelector(
      `input[name="papi-answer-${questionIndex}"]:checked`
    );
    if (!selected) return null;
  
    const record = {
      id: question.id,
      questionIndex: questionIndex,
      answer: selected.value,
      answerText: selected.value === 'A' ? question.optionA : question.optionB
    };
  
    appState.answers = appState.answers || {};
    appState.answers.PAPI = appState.answers.PAPI || [];
  
    const existingIndex = appState.answers.PAPI.findIndex(
      item => Number(item?.questionIndex) === Number(questionIndex)
    );
  
    if (existingIndex >= 0) {
      appState.answers.PAPI[existingIndex] = record;
    } else {
      appState.answers.PAPI.push(record);
    }
  
    return record;
  }
  
  function saveCurrentPAPIPair() {
    const startIndex = Number(appState.currentQuestion || 0);
    const q1 = tests.PAPI.questions[startIndex];
    const q2 = tests.PAPI.questions[startIndex + 1];
  
    if (q1) savePAPISingleAnswer(startIndex);
    if (q2) savePAPISingleAnswer(startIndex + 1);
  }
  
  /* ============================================================
     VALIDASI
     ============================================================ */
  function validateCurrentPAPIPair() {
    const startIndex = Number(appState.currentQuestion || 0);
    const q2 = tests.PAPI.questions[startIndex + 1];
  
    const selected1 = document.querySelector(
      `input[name="papi-answer-${startIndex}"]:checked`
    );
    if (!selected1) {
      showPAPIError(`Soal ${startIndex + 1} belum dijawab.`);
      return false;
    }
  
    if (q2) {
      const selected2 = document.querySelector(
        `input[name="papi-answer-${startIndex + 1}"]:checked`
      );
      if (!selected2) {
        showPAPIError(`Soal ${startIndex + 2} belum dijawab.`);
        return false;
      }
    }
  
    return true;
  }
  
  /* ============================================================
     NEXT
     ============================================================ */
  function nextPAPIQuestion() {
    if (!validateCurrentPAPIPair()) return;
  
    saveCurrentPAPIPair();
  
    const startIndex = Number(appState.currentQuestion || 0);
    const hasSecondQuestion = !!tests.PAPI.questions[startIndex + 1];
  
    appState.currentQuestion += hasSecondQuestion ? 2 : 1;
  
    if (appState.currentQuestion >= tests.PAPI.questions.length) {
      clearInterval(appState.timer);
      appState.completed.PAPI = true;
  
      if (typeof window.updateDownloadButtonState === 'function') {
        window.updateDownloadButtonState();
      }
  
      appState.skorPAPIArahKerja       = skorPAPIArahKerja(appState.answers.PAPI);
      appState.skorPAPIKepemimpinan    = skorPAPIKepemimpinan(appState.answers.PAPI);
      appState.skorPAPIAktivitas       = skorPAPIAktivitas(appState.answers.PAPI);
      appState.skorPAPIPergaulan       = skorPAPIPergaulan(appState.answers.PAPI);
      appState.skorPAPIGayaKerja       = skorPAPIGayaKerja(appState.answers.PAPI);
      appState.skorPAPISifat           = skorPAPISifat(appState.answers.PAPI);
      appState.skorPAPIKetaatan        = skorPAPIKetaatan(appState.answers.PAPI);
  
      renderPAPIThankYou();
      return;
    }
  
    renderPAPIQuestion();
  }
  
  /* ============================================================
     PREVIOUS
     ============================================================ */
  function previousPAPIQuestion() {
    const currentIndex = Number(appState.currentQuestion || 0);
    if (currentIndex <= 0) return;
  
    saveCurrentPAPIPair();
    appState.currentQuestion = Math.max(0, currentIndex - 2);
    renderPAPIQuestion();
  }
  
  /* ============================================================
     ERROR
     ============================================================ */
  function showPAPIError(message) {
    const error = document.getElementById('papi-error');
    if (!error) return;
  
    error.textContent = message;
    error.style.display = 'block';
    error.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  /* ============================================================
     WAKTU HABIS
     ============================================================ */
  function finishPAPITestByTime() {
    const total = tests.PAPI.questions.length;
  
    appState.answers = appState.answers || {};
    appState.answers.PAPI = appState.answers.PAPI || [];
  
    for (let i = 0; i < total; i++) {
      const already = appState.answers.PAPI.some(
        answer => Number(answer?.questionIndex) === Number(i)
      );
      if (already) continue;
  
      const question = tests.PAPI.questions[i];
      if (!question) continue;
  
      appState.answers.PAPI.push({
        id: question.id,
        questionIndex: i,
        answer: '-',
        answerText: 'Tidak dijawab (waktu habis)'
      });
    }
  
    clearInterval(appState.timer);
    appState.completed.PAPI = true;
  
    appState.skorPAPIArahKerja       = skorPAPIArahKerja(appState.answers.PAPI);
    appState.skorPAPIKepemimpinan    = skorPAPIKepemimpinan(appState.answers.PAPI);
    appState.skorPAPIAktivitas       = skorPAPIAktivitas(appState.answers.PAPI);
    appState.skorPAPIPergaulan       = skorPAPIPergaulan(appState.answers.PAPI);
    appState.skorPAPIGayaKerja       = skorPAPIGayaKerja(appState.answers.PAPI);
    appState.skorPAPISifat           = skorPAPISifat(appState.answers.PAPI);
    appState.skorPAPIKetaatan        = skorPAPIKetaatan(appState.answers.PAPI);
  
    if (typeof window.updateDownloadButtonState === 'function') {
      window.updateDownloadButtonState();
    }
  
    renderPAPIThankYou();
  }
  
  /* ============================================================
     FINISH NORMAL
     ============================================================ */
  function finishPAPITest() {
    clearInterval(appState.timer);
    appState.completed = appState.completed || {};
    appState.completed.PAPI = true;
    renderPAPIThankYou();
  }
  
  /* ============================================================
     THANK YOU
     ============================================================ */
  function renderPAPIThankYou() {
    markTestCompleted('PAPI');
  
    window.__inTestView = false;
    const app = document.getElementById('app');
  
    app.innerHTML = `
      <div class="ist-shell">
        <div class="ist-panel">
          <div class="ist-panel-header">
            <div class="ist-header-row">
            <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;">
                ${renderTestLogoBadge()}
                <div>
                  <div class="ist-eyebrow">PERSONALITY ASSESSMENT</div>
                  <h2 class="ist-title" style="margin-top:11px;">Tes PAPI Selesai</h2>
                  <p class="ist-subtitle">Terima kasih, jawaban Anda telah berhasil disimpan.</p>
                </div>
              </div>
            </div>
          </div>
  
          <div class="ist-body">
            <div class="ist-instruction-card" style="text-align:center;padding:32px 22px;">
              <div style="font-size:4rem;line-height:1;margin-bottom:16px;">🎉</div>
              <div style="font-size:1.15rem;font-weight:800;color:#172033;margin-bottom:10px;">Terima kasih!</div>
              <div style="max-width:650px;margin:0 auto;color:#667085;line-height:1.7;">
                Tes PAPI Kostick sudah selesai dan seluruh jawaban Anda telah tersimpan.<br>
                Silakan lanjut mengerjakan tes berikutnya yang tersedia.
              </div>
            </div>
  
            <div class="ist-actions">
              <button class="ist-btn-primary" id="btnContinuePAPI" type="button">
                ✅ Lanjut Tes Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  
    const btn = document.getElementById('btnContinuePAPI');
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
     SKOR PAPI — Semua Aspek
     ============================================================ */
  function skorPAPIArahKerja(answerObjArray) {
    let hasil = { N: 0, G: 0, A: 0 };
  
    mappingPAPI.ArahKerja.N.nomor.forEach(n => {
      const jaw = answerObjArray.find(a => a.id === n);
      if (jaw && jaw.answer === mappingPAPI.ArahKerja.N.tipe) hasil.N++;
    });
  
    mappingPAPI.ArahKerja.G.nomor.forEach(n => {
      const jaw = answerObjArray.find(a => a.id === n);
      if (jaw && jaw.answer === mappingPAPI.ArahKerja.G.tipe) hasil.G++;
    });
  
    mappingPAPI.ArahKerja.A.forEach(group => {
      group.nomor.forEach(n => {
        const jaw = answerObjArray.find(a => a.id === n);
        if (jaw && jaw.answer === group.tipe) hasil.A++;
      });
    });
  
    return hasil;
  }
  
  function skorPAPIKepemimpinan(answerObjArray) {
    let hasil = { L: 0, P: 0, I: 0 };
  
    ['L', 'P', 'I'].forEach(kode => {
      mappingPAPI.Kepemimpinan[kode].forEach(group => {
        group.nomor.forEach(n => {
          const jaw = answerObjArray.find(a => a.id === n);
          if (jaw && jaw.answer === group.tipe) hasil[kode]++;
        });
      });
    });
  
    return hasil;
  }
  
  function skorPAPIAktivitas(answerObjArray) {
    let hasil = { T: 0, V: 0 };
  
    ['T', 'V'].forEach(kode => {
      mappingPAPI.Aktivitas[kode].forEach(group => {
        group.nomor.forEach(n => {
          const jaw = answerObjArray.find(a => a.id === n);
          if (jaw && jaw.answer === group.tipe) hasil[kode]++;
        });
      });
    });
  
    return hasil;
  }
  
  function skorPAPIPergaulan(answerObjArray) {
    let hasil = { X: 0, S: 0, B: 0, O: 0 };
  
    ['X', 'S', 'B', 'O'].forEach(kode => {
      mappingPAPI.Pergaulan[kode].forEach(group => {
        group.nomor.forEach(n => {
          const jaw = answerObjArray.find(a => a.id === n);
          if (jaw && jaw.answer === group.tipe) hasil[kode]++;
        });
      });
    });
  
    return hasil;
  }
  
  function skorPAPIGayaKerja(answerObjArray) {
    let hasil = { R: 0, D: 0, C: 0 };
  
    ['R', 'D', 'C'].forEach(kode => {
      mappingPAPI.GayaKerja[kode].forEach(group => {
        group.nomor.forEach(n => {
          const jaw = answerObjArray.find(a => a.id === n);
          if (jaw && jaw.answer === group.tipe) hasil[kode]++;
        });
      });
    });
  
    return hasil;
  }
  
  function skorPAPISifat(answerObjArray) {
    let hasil = { Z: 0, E: 0, K: 0 };
  
    ['Z', 'E', 'K'].forEach(kode => {
      const faktor = mappingPAPI.Sifat[kode];
  
      if (Array.isArray(faktor)) {
        faktor.forEach(group => {
          group.nomor.forEach(n => {
            const jaw = answerObjArray.find(a => a.id === n);
            if (jaw && jaw.answer === group.tipe) hasil[kode]++;
          });
        });
      } else {
        faktor.nomor.forEach(n => {
          const jaw = answerObjArray.find(a => a.id === n);
          if (jaw && jaw.answer === faktor.tipe) hasil[kode]++;
        });
      }
    });
  
    return hasil;
  }
  
  function skorPAPIKetaatan(answerObjArray) {
    let hasil = { F: 0, W: 0 };
  
    ['F', 'W'].forEach(kode => {
      const faktor = mappingPAPI.Ketaatan[kode];
  
      if (Array.isArray(faktor)) {
        faktor.forEach(group => {
          group.nomor.forEach(n => {
            const jaw = answerObjArray.find(a => a.id === n);
            if (jaw && jaw.answer === group.tipe) hasil[kode]++;
          });
        });
      } else {
        faktor.nomor.forEach(n => {
          const jaw = answerObjArray.find(a => a.id === n);
          if (jaw && jaw.answer === faktor.tipe) hasil[kode]++;
        });
      }
    });
  
    return hasil;
  }
  
  /* ============================================================
     ANALISIS KECOCOKAN PAPI
     ============================================================ */
  const requirementPAPI = {
    "Technical Staff": {
      utama: ['D', 'C', 'R', 'W', 'E'],
      pendukung: ['G', 'T', 'V', 'F', 'N'],
      highlight: {
        D: 'Suka pekerjaan yang terperinci',
        C: 'Tipe teratur',
        R: 'Tipe teoritikal',
        W: 'Kebutuhan taat pada aturan dan pengarahan',
        E: 'Pengendalian emosi',
        G: 'Peranan sebagai pekerja keras',
        T: 'Tipe selalu sibuk',
        V: 'Tipe yang bersemangat',
        F: 'Dukungan terhadap atasan',
        N: 'Penyelesaian secara prestasi'
      }
    },
    "Dosen/Guru": {
      utama: ['R', 'S', 'P', 'L', 'E'],
      pendukung: ['A', 'O', 'B', 'G', 'X'],
      highlight: {
        R: 'Tipe teoritikal',
        S: 'Pergaulan luas',
        P: 'Pengendalian orang lain',
        L: 'Peran sebagai pimpinan',
        E: 'Pengendalian emosi',
        A: 'Hasrat untuk berprestasi',
        O: 'Kebutuhan untuk dekat dan menyayangi',
        B: 'Kebutuhan berkelompok',
        G: 'Peranan sebagai pekerja keras',
        X: 'Kebutuhan untuk mendapatkan perhatian'
      }
    },
    "Administrator": {
      utama: ['C', 'D', 'W', 'N', 'E'],
      pendukung: ['S', 'B', 'G', 'T', 'F'],
      highlight: {
        C: 'Tipe teratur',
        D: 'Suka pekerjaan yang terperinci',
        W: 'Kebutuhan taat pada aturan dan pengarahan',
        N: 'Penyelesaian secara prestasi',
        E: 'Pengendalian emosi',
        S: 'Pergaulan luas',
        B: 'Kebutuhan berkelompok',
        G: 'Peranan sebagai pekerja keras',
        T: 'Tipe selalu sibuk',
        F: 'Dukungan terhadap atasan'
      }
    },
    "Housekeeping": {
      utama: ['C', 'D', 'G', 'W', 'T'],
      pendukung: ['O', 'S', 'N', 'F'],
      highlight: {
        C: 'Tipe teratur',
        D: 'Suka pekerjaan yang terperinci',
        G: 'Peranan sebagai pekerja keras',
        W: 'Kebutuhan taat pada aturan dan pengarahan',
        T: 'Tipe selalu sibuk',
        O: 'Kebutuhan untuk dekat dan menyayangi',
        S: 'Pergaulan luas',
        N: 'Penyelesaian secara prestasi',
        F: 'Dukungan terhadap atasan'
      }
    },
    "IT Staff": {
      utama: ['R', 'D', 'C', 'I', 'E'],
      pendukung: ['T', 'G', 'V', 'W', 'N'],
      highlight: {
        R: 'Tipe teoritikal',
        D: 'Suka pekerjaan yang terperinci',
        C: 'Tipe teratur',
        I: 'Mudah dalam mengambil keputusan',
        E: 'Pengendalian emosi',
        T: 'Tipe selalu sibuk',
        G: 'Peranan sebagai pekerja keras',
        V: 'Tipe yang bersemangat',
        W: 'Kebutuhan taat pada aturan dan pengarahan',
        N: 'Penyelesaian secara prestasi'
      }
    }
  };
  
  function analisisKecocokanPAPIDetail(scores, posisi, nama) {
    nama = nama || "Kandidat";
    const req = requirementPAPI[posisi];
    if (!req) return `Posisi "${posisi}" tidak dikenali.`;
  
    let paragraf = `Analisis kecocokan ${nama} untuk posisi **${posisi}** berdasarkan hasil Tes PAPI:\n\n`;
  
    paragraf += `*Faktor utama posisi:*\n`;
    req.utama.forEach(k => {
      paragraf += `- ${req.highlight[k]} (skor: ${scores[k] ?? "-"}): ${getInterpretasiPAPI(k, scores[k] ?? 0)}\n`;
    });
  
    paragraf += `\n`;
  
    paragraf += `*Faktor pendukung posisi:*\n`;
    req.pendukung.forEach(k => {
      paragraf += `- ${req.highlight[k]} (skor: ${scores[k] ?? "-"}) : ${getInterpretasiPAPI(k, scores[k] ?? 0)}\n`;
    });
  
    paragraf += `\n`;
  
    const kelebihan = [];
    const pengembangan = [];
  
    req.utama.forEach(k => {
      if ((scores[k] ?? 0) >= 6) kelebihan.push(req.highlight[k] + ` (skor: ${scores[k]})`);
      if ((scores[k] ?? 0) < 3) pengembangan.push(req.highlight[k] + ` (skor: ${scores[k]})`);
    });
  
    req.pendukung.forEach(k => {
      if ((scores[k] ?? 0) >= 7) kelebihan.push(req.highlight[k] + ` (skor: ${scores[k]})`);
      if ((scores[k] ?? 0) < 2) pengembangan.push(req.highlight[k] + ` (skor: ${scores[k]})`);
    });
  
    if (kelebihan.length > 0) {
      paragraf += `*Kekuatan utama:*\n${kelebihan.map(s => '- ' + s).join('\n')}\n\n`;
    } else {
      paragraf += `Tidak ditemukan kekuatan menonjol pada faktor utama. Perlu dikembangkan lebih lanjut.\n\n`;
    }
  
    if (pengembangan.length > 0) {
      paragraf += `*Area yang perlu dikembangkan:*\n${pengembangan.map(s => '- ' + s).join('\n')}\n\n`;
    }
  
    if (kelebihan.length > 0 && pengembangan.length === 0) {
      paragraf += `Kandidat memiliki kompetensi yang sangat baik untuk posisi ini.`;
    } else if (kelebihan.length > 0 && pengembangan.length > 0) {
      paragraf += `Kandidat memiliki beberapa kelebihan penting namun juga area pengembangan yang perlu diperhatikan sebelum menempati posisi ini.`;
    } else {
      paragraf += `Kandidat belum memenuhi banyak aspek utama posisi ini. Disarankan untuk pengembangan lebih lanjut.`;
    }
  
    return paragraf;
  }
  
  console.log('[TEST-PAPI] ✓ Loaded');
