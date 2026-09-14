/* ============================================================
   js/06-timer.js
   - Timer umum untuk tes IST, PAPI, BIGFIVE, dll.
   - Untuk KRAEPLIN punya timer sendiri di tests/kraeplin.js
   ============================================================ */

/* ============================================================
   START TIMER — dipakai IST, PAPI, BIGFIVE
   ============================================================ */
   function startTimer() {
    clearInterval(appState.timer);
  
    appState.timer = setInterval(() => {
      appState.timeLeft--;
      updateTimerDisplay();
  
      if (appState.timeLeft <= 0) {
        clearInterval(appState.timer);
        timeUp();
      }
    }, 1000);
  }
  
  
  /* ============================================================
     UPDATE DISPLAY TIMER
     ============================================================ */
  function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
      timerDisplay.textContent = `${appState.timeLeft}s`;
  
      if (appState.timeLeft <= 10) {
        timerDisplay.classList.add('timer-warning');
      } else {
        timerDisplay.classList.remove('timer-warning');
      }
    }
  }
  
  
  /* ============================================================
     TIME UP — waktu habis
     ============================================================ */
  function timeUp() {
    alert('Waktu telah habis! Tes akan dikirim secara otomatis.');
  
    if (appState.currentTest === 'IST') {
      const subtest = tests.IST.subtests[appState.currentSubtest];
  
      // Save unanswered questions as '-'
      while (appState.currentQuestion < subtest.questions.length) {
        if (!appState.answers.IST[appState.currentSubtest]) {
          appState.answers.IST[appState.currentSubtest] = {
            name: subtest.name,
            answers: []
          };
        }
        appState.answers.IST[appState.currentSubtest].answers.push({
          id: subtest.questions[appState.currentQuestion].id,
          answer: '-',
          correct: false
        });
        appState.currentQuestion++;
      }
  
      appState.currentSubtest++;
      appState.currentQuestion = 0;
  
      // Jika masih ada subtes berikutnya → intro, jika habis → thank you
      if (appState.currentSubtest >= tests.IST.subtests.length) {
        if (typeof showThankYouAndHomeIST === 'function') {
          showThankYouAndHomeIST();
        } else {
          renderHome();
        }
      } else {
        renderISTSubtestIntro();
      }
  
    } else if (appState.currentTest === 'PAPI') {
      while (appState.currentQuestion < tests.PAPI.questions.length) {
        appState.answers.PAPI.push({
          id: tests.PAPI.questions[appState.currentQuestion].id,
          answer: '-',
          answerText: 'Tidak dijawab (waktu habis)'
        });
        appState.currentQuestion++;
      }
  
      appState.completed.PAPI = true;
  
      if (typeof window.markTestCompleted === 'function') {
        window.markTestCompleted('PAPI');
      }
      if (typeof renderPAPIThankYou === 'function') {
        renderPAPIThankYou();
      } else {
        renderHome();
      }
  
    } else if (appState.currentTest === 'BIGFIVE') {
      // Save unanswered questions as 0
      appState.answers.BIGFIVE = appState.answers.BIGFIVE || [];
      while (appState.currentQuestion < tests.BIGFIVE.questions.length) {
        appState.answers.BIGFIVE[appState.currentQuestion] = 0;
        appState.currentQuestion++;
      }
  
      appState.completed.BIGFIVE = true;
      appState.hasilOCEAN = koreksiBigFive(
        appState.answers.BIGFIVE || [],
        tests.BIGFIVE.questions
      );
  
      if (typeof window.markTestCompleted === 'function') {
        window.markTestCompleted('BIGFIVE');
      }
      if (typeof renderBIGFIVEThankYou === 'function') {
        renderBIGFIVEThankYou();
      } else {
        renderHome();
      }
    }
  }
  
  
  /* ============================================================
     EXPORT
     ============================================================ */
  window.startTimer        = startTimer;
  window.updateTimerDisplay = updateTimerDisplay;
  window.timeUp            = timeUp;