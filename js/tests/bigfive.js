/* =========================================================
   BIG FIVE TEST — Full Logic
   ========================================================= */

   function injectBIGFIVEStyles() {
      if (typeof injectISTFuturisticStyles === 'function') injectISTFuturisticStyles();
      // CSS sudah dimuat via <link>
    }
    
    /* ============================================================
       INTRO
       ============================================================ */
    function renderBIGFIVEInstruction() {
      injectBIGFIVEStyles();
      const app = document.getElementById('app');
      window.__inTestView = true;
    
      const total = Array.isArray(tests?.BIGFIVE?.questions) ? tests.BIGFIVE.questions.length : 0;
      const time = Number(tests?.BIGFIVE?.time || 0);
      const minutes = Math.floor(time / 60);
    
      app.innerHTML = `
        <div class="ist-shell">
          <div class="ist-panel">
            <div class="ist-panel-header">
              <div class="ist-header-row">
                <div style="display:flex;align-items:center;gap:15px;">
                  ${renderTestLogoBadge()}
                  <div>
                    <div class="ist-eyebrow">PERSONALITY ASSESSMENT</div>
                    <h2 class="ist-title" style="margin-top:11px;">${tests.BIGFIVE.name}</h2>
                    <p class="ist-subtitle">${tests.BIGFIVE.description || ''}</p>
                  </div>
                </div>
                <div class="ist-time-chip">
                  <span class="ist-time-chip-icon">⏱</span>
                  <span>${minutes} menit</span>
                </div>
              </div>
            </div>
    
            <div class="ist-body">
              <div class="ist-info-grid">
                <div class="ist-info-card">
                  <div class="ist-info-label">Tes</div>
                  <div class="ist-info-value">Big Five Personality</div>
                </div>
                <div class="ist-info-card">
                  <div class="ist-info-label">Jumlah Soal</div>
                  <div class="ist-info-value">${total} pernyataan</div>
                </div>
                <div class="ist-info-card">
                  <div class="ist-info-label">Tampilan</div>
                  <div class="ist-info-value">4 soal / layar</div>
                </div>
              </div>
    
              <div class="ist-instruction-card">
                <div class="ist-section-heading">
                  <span class="ist-section-icon">📘</span>
                  Petunjuk
                </div>
                <div class="ist-instruction-text">
                  Pilih satu jawaban yang paling sesuai dengan diri Anda pada setiap pernyataan.
                </div>
              </div>
    
              <div class="ist-example">
                <h4 class="ist-example-title">✦ Contoh Soal</h4>
                <div class="ist-instruction-text">
                  <strong>Pernyataan:</strong> ${tests.BIGFIVE.example?.question || ''}
                </div>
                <div class="ist-instruction-text" style="margin-top:10px">
                  1 = Sangat Tidak Sesuai &nbsp;•&nbsp; 5 = Sangat Sesuai
                </div>
                ${tests.BIGFIVE.example?.explanation ? `
                  <div class="ist-example-explanation" style="margin-top:12px">
                    <strong>Penjelasan:</strong> ${tests.BIGFIVE.example.explanation}
                  </div>
                ` : ''}
              </div>
    
              <div class="ist-actions">
                <button class="ist-btn-primary" onclick="startBIGFIVEQuestions()">🚀 Mulai Tes Big Five</button>
                <button class="ist-btn-secondary" onclick="window.__inTestView=false;renderHome()" type="button">Kembali</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    /* ============================================================
       START
       ============================================================ */
    function startBIGFIVEQuestions() {
      injectBIGFIVEStyles();
      window.__inTestView = true;
    
      appState.currentTest = 'BIGFIVE';
      appState.currentQuestion = 0;
      appState.timeLeft = Number(tests?.BIGFIVE?.time || 0);
      appState.answers = appState.answers || {};
      appState.answers.BIGFIVE = [];
      appState.completed = appState.completed || {};
      appState.completed.BIGFIVE = false;
      appState.hasilOCEAN = null;
    
      clearInterval(appState.timer);
      appState.timer = setInterval(() => {
        appState.timeLeft--;
        updateBIGFIVETimerDisplay();
        if (appState.timeLeft <= 0) {
          clearInterval(appState.timer);
          finishBIGFIVETestByTime();
        }
      }, 1000);
    
      renderBIGFIVEQuestion();
    }
    
    /* ============================================================
       TIMER
       ============================================================ */
    function updateBIGFIVETimerDisplay() {
      const el = document.getElementById('bigfive-timer-display');
      if (!el) return;
      const sec = Math.max(0, Number(appState.timeLeft || 0));
      const min = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      el.textContent = `${min}:${s}`;
      el.style.color = sec <= 30 ? '#c62828' : '#1b4f8f';
    }
    
    /* ============================================================
       RENDER 4 SOAL
       ============================================================ */
    function renderBIGFIVEQuestion() {
      injectBIGFIVEStyles();
    
      const soal = tests?.BIGFIVE?.questions || [];
      const startIndex = Number(appState.currentQuestion || 0);
    
      if (startIndex >= soal.length) {
        finishBIGFIVETest();
        return;
      }
    
      const q1 = soal[startIndex] || null;
      const q2 = soal[startIndex + 1] || null;
      const q3 = soal[startIndex + 2] || null;
      const q4 = soal[startIndex + 3] || null;
    
      const total = soal.length;
      const n1 = startIndex + 1;
      const n2 = startIndex + 2;
      const n3 = startIndex + 3;
      const n4 = startIndex + 4;
    
      const currentPage = Math.floor(startIndex / 4) + 1;
      const totalPages = Math.ceil(total / 4);
      const progress = totalPages ? ((currentPage - 1) / totalPages) * 100 : 0;
      const hasPrevious = startIndex > 0;
    
      function renderSingle(question, index, number) {
        if (!question) return '';
    
        const prev = Number(appState.answers?.BIGFIVE?.[index] || 0);
        const labels = ['Sangat Tidak Sesuai', 'Tidak Sesuai', 'Netral', 'Sesuai', 'Sangat Sesuai'];
    
        const options = [1, 2, 3, 4, 5].map(v => `
          <label class="bigfive-option-box${prev === v ? ' selected' : ''}"
                 onclick="selectBIGFIVEAnswer(this, ${v}, ${index})">
            <input type="radio" name="bigfive-answer-${index}" value="${v}" ${prev === v ? 'checked' : ''}>
            <span class="bigfive-option-number">${v}</span>
            <span class="bigfive-option-text">${labels[v - 1]}</span>
          </label>`).join('');
    
        return `
          <div class="bigfive-question-card" data-question-index="${index}">
            <div class="bigfive-question-number">SOAL ${number}</div>
            <div class="bigfive-question-text">${question.text || ''}</div>
            <div class="bigfive-likert">${options}</div>
          </div>`;
      }
    
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="ist-shell">
          <div class="ist-question-panel">
            <div class="ist-question-top">
              <div class="ist-question-meta">
                <div>
                  <div class="ist-question-label">TES BIG FIVE</div>
                  <div class="ist-question-badge">📊 Personality Assessment</div>
                </div>
                <div class="ist-time-chip">
                  <span class="ist-time-chip-icon">⏱</span>
                  <span id="bigfive-timer-display">00:00</span>
                </div>
              </div>
    
              <div class="ist-progress-wrap">
                <div class="ist-progress-info">
                  <span>Soal ${n1} ${q4 ? `–${n4}` : q3 ? `–${n3}` : q2 ? `–${n2}` : ''} dari ${total}</span>
                  <span>${Math.round(progress)}%</span>
                </div>
                <div class="ist-progress-track">
                  <div class="ist-progress-fill" style="width:${progress}%"></div>
                </div>
              </div>
            </div>
    
            <div class="ist-question-body">
              <div class="ist-question-heading" style="margin-bottom:4px">
                Pilih jawaban yang paling sesuai dengan diri Anda.
              </div>
    
              <div class="bigfive-question-grid">
                ${renderSingle(q1, startIndex, n1)}
                ${renderSingle(q2, startIndex + 1, n2)}
                ${renderSingle(q3, startIndex + 2, n3)}
                ${renderSingle(q4, startIndex + 3, n4)}
              </div>
    
              <div id="bigfive-error" class="bigfive-error" style="display:none"></div>
    
              <div class="ist-question-actions">
                <div class="ist-action-left">
                  ${hasPrevious ? `<button class="ist-prev-btn" id="btnPreviousBIGFIVE" type="button">← <span>Sebelumnya</span></button>` : ''}
                </div>
                <div class="ist-action-right">
                  <button class="ist-main-btn" id="btnNextBIGFIVE" type="button">
                    ${startIndex + 4 < total ? 'Lanjut →' : 'Selesai ✓'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    
      updateBIGFIVETimerDisplay();
      restoreBIGFIVEAnswersOnScreen(startIndex, q1, q2, q3, q4);
    
      const nextBtn = document.getElementById('btnNextBIGFIVE');
      if (nextBtn) nextBtn.onclick = nextBIGFIVEQuestion;
    
      const prevBtn = document.getElementById('btnPreviousBIGFIVE');
      if (prevBtn) prevBtn.onclick = previousBIGFIVEQuestion;
    }
    
    /* ============================================================
       SELECT ANSWER
       ============================================================ */
    function selectBIGFIVEAnswer(element, value, questionIndex) {
      const card = element.closest('.bigfive-question-card');
      if (!card) return;
    
      card.querySelectorAll('.bigfive-option-box').forEach(box => {
        box.classList.remove('selected');
        const input = box.querySelector('input');
        if (input) input.checked = false;
      });
    
      element.classList.add('selected');
      const input = element.querySelector('input');
      if (input) input.checked = true;
    
      appState.answers = appState.answers || {};
      appState.answers.BIGFIVE = appState.answers.BIGFIVE || [];
      appState.answers.BIGFIVE[questionIndex] = Number(value);
    
      const error = document.getElementById('bigfive-error');
      if (error) {
        error.style.display = 'none';
        error.textContent = '';
      }
    }
    
    /* ============================================================
       RESTORE
       ============================================================ */
    function restoreBIGFIVEAnswersOnScreen(startIndex, q1, q2, q3, q4) {
      const indices = [startIndex];
      if (q2) indices.push(startIndex + 1);
      if (q3) indices.push(startIndex + 2);
      if (q4) indices.push(startIndex + 3);
    
      indices.forEach(index => {
        const answer = Number(appState.answers?.BIGFIVE?.[index] || 0);
        if (!answer) return;
        const input = document.querySelector(`input[name="bigfive-answer-${index}"][value="${answer}"]`);
        if (!input) return;
        input.checked = true;
        const box = input.closest('.bigfive-option-box');
        if (box) box.classList.add('selected');
      });
    }
    
    /* ============================================================
       SAVE ANSWER
       ============================================================ */
    function saveBIGFIVESingleAnswer(questionIndex) {
      const question = tests.BIGFIVE.questions[questionIndex];
      if (!question) return null;
    
      const selected = document.querySelector(`input[name="bigfive-answer-${questionIndex}"]:checked`);
      if (!selected) return null;
    
      appState.answers = appState.answers || {};
      appState.answers.BIGFIVE = appState.answers.BIGFIVE || [];
      appState.answers.BIGFIVE[questionIndex] = Number(selected.value);
    
      return {
        id: question.id,
        questionIndex: questionIndex,
        answer: Number(selected.value),
        answerText: selected.value
      };
    }
    
    function saveCurrentBIGFIVEPage() {
      const startIndex = Number(appState.currentQuestion || 0);
      for (let i = 0; i < 4; i++) {
        const index = startIndex + i;
        if (tests.BIGFIVE.questions[index]) {
          saveBIGFIVESingleAnswer(index);
        }
      }
    }
    
    /* ============================================================
       VALIDASI
       ============================================================ */
    function validateCurrentBIGFIVEPage() {
      const startIndex = Number(appState.currentQuestion || 0);
      const total = tests.BIGFIVE.questions.length;
    
      for (let i = 0; i < 4; i++) {
        const index = startIndex + i;
        if (index >= total) break;
        const selected = document.querySelector(`input[name="bigfive-answer-${index}"]:checked`);
        if (!selected) {
          showBIGFIVEError(`Soal ${index + 1} belum dijawab.`);
          return false;
        }
      }
      return true;
    }
    
    /* ============================================================
       NEXT
       ============================================================ */
    function nextBIGFIVEQuestion() {
      if (!validateCurrentBIGFIVEPage()) return;
      saveCurrentBIGFIVEPage();
    
      const total = tests.BIGFIVE.questions.length;
      appState.currentQuestion += 4;
    
      if (appState.currentQuestion >= total) {
        clearInterval(appState.timer);
        appState.completed = appState.completed || {};
        appState.completed.BIGFIVE = true;
        appState.hasilOCEAN = koreksiBigFive(appState.answers.BIGFIVE || [], tests.BIGFIVE.questions);
    
        if (typeof window.updateDownloadButtonState === 'function') {
          window.updateDownloadButtonState();
        }
        renderBIGFIVEThankYou();
        return;
      }
      renderBIGFIVEQuestion();
    }
    
    /* ============================================================
       PREVIOUS
       ============================================================ */
    function previousBIGFIVEQuestion() {
      const currentIndex = Number(appState.currentQuestion || 0);
      if (currentIndex <= 0) return;
      saveCurrentBIGFIVEPage();
      appState.currentQuestion = Math.max(0, currentIndex - 4);
      renderBIGFIVEQuestion();
    }
    
    /* ============================================================
       ERROR
       ============================================================ */
    function showBIGFIVEError(message) {
      const error = document.getElementById('bigfive-error');
      if (!error) return;
      error.textContent = message;
      error.style.display = 'block';
      error.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    /* ============================================================
       WAKTU HABIS
       ============================================================ */
    function finishBIGFIVETestByTime() {
      const total = tests.BIGFIVE.questions.length;
      appState.answers = appState.answers || {};
      appState.answers.BIGFIVE = appState.answers.BIGFIVE || [];
    
      saveCurrentBIGFIVEPage();
    
      for (let i = 0; i < total; i++) {
        if (appState.answers.BIGFIVE[i] === undefined || appState.answers.BIGFIVE[i] === null) {
          appState.answers.BIGFIVE[i] = 0;
        }
      }
    
      clearInterval(appState.timer);
      appState.completed = appState.completed || {};
      appState.completed.BIGFIVE = true;
      appState.hasilOCEAN = koreksiBigFive(appState.answers.BIGFIVE || [], tests.BIGFIVE.questions);
    
      if (typeof window.updateDownloadButtonState === 'function') {
        window.updateDownloadButtonState();
      }
      renderBIGFIVEThankYou();
    }
    
    /* ============================================================
       FINISH
       ============================================================ */
    function finishBIGFIVETest() {
      clearInterval(appState.timer);
      appState.completed = appState.completed || {};
      appState.completed.BIGFIVE = true;
      appState.hasilOCEAN = koreksiBigFive(appState.answers.BIGFIVE || [], tests.BIGFIVE.questions);
      renderBIGFIVEThankYou();
    }
    
    /* ============================================================
       THANK YOU
       ============================================================ */
    function renderBIGFIVEThankYou() {
      if (typeof injectISTFuturisticStyles === 'function') injectISTFuturisticStyles();
    
      if (typeof window.markTestCompleted === 'function') {
        markTestCompleted('BIGFIVE');
      } else {
        window.appState = window.appState || {};
        appState.completed = appState.completed || {};
        appState.completed.BIGFIVE = true;
        try {
          const saved = JSON.parse(localStorage.getItem('completed') || '{}');
          saved.BIGFIVE = true;
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
                <div style="display:flex;align-items:center;gap:15px;">
                  ${renderTestLogoBadge()}
                  <div>
                    <div class="ist-eyebrow">PERSONALITY ASSESSMENT</div>
                    <h2 class="ist-title" style="margin-top:11px;">Tes Big Five Selesai</h2>
                    <p class="ist-subtitle">Terima kasih, jawaban Anda telah berhasil disimpan.</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="ist-body">
              <div class="ist-instruction-card" style="text-align:center;padding:32px 22px">
                <div style="font-size:4rem;line-height:1;margin-bottom:16px">🎉</div>
                <div style="font-size:1.15rem;font-weight:800;color:#172033;margin-bottom:10px">Terima kasih!</div>
                <div style="max-width:650px;margin:0 auto;color:#667085;line-height:1.7">
                  Tes Big Five sudah selesai dan seluruh jawaban Anda telah tersimpan.
                  <br>Silakan lanjut mengerjakan tes berikutnya yang tersedia.
                </div>
              </div>
              <div class="ist-actions">
                <button class="ist-btn-primary" id="btnContinueBIGFIVE" type="button">✅ Lanjut Tes Berikutnya</button>
              </div>
            </div>
          </div>
        </div>
      `;
    
      const btn = document.getElementById('btnContinueBIGFIVE');
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
    
    console.log('[TEST-BIGFIVE] ✓ Loaded — 17 fungsi');
