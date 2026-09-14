/* =========================================================
   IST TEST — Full Logic
   ========================================================= */

   let __istKeysApplied = false;

   /* ============================================================
      PRELOAD ASSETS
      ============================================================ */
   const __istImgCache = new Map();
   
   function preloadImage(src) {
     if (!src) return Promise.resolve();
     if (__istImgCache.has(src)) return __istImgCache.get(src);
     try {
       const l = document.createElement('link');
       l.rel = 'preload';
       l.as = 'image';
       l.href = src;
       document.head.appendChild(l);
     } catch {}
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
      INJECT KEYS KE QUESTIONS
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
     // CSS sudah dimuat via <link>
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
     } catch (e) {
       console.warn('[IST] Gagal injeksi kunci:', e);
     }
   
     appState.answers = appState.answers || {};
     appState.answers.IST = appState.answers.IST || [];
   
     if (appState.currentSubtest === 0 && appState.currentQuestion === 0 && hasAnyISTAnswers()) {
       const overwrite = window.confirm('Mulai ulang IST? Hasil sebelumnya akan dihapus.');
       if (overwrite) resetISTSession();
     }
   
     const subtests = tests?.IST?.subtests;
     if (!Array.isArray(subtests)) { console.error('[IST] Subtes tidak tersedia.'); return; }
   
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
      FASE HAFALAN (MEMORY PHASE)
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
      RESTORE ANSWER
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
      RENDER QUESTION
      ============================================================ */
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
   
     /* IMAGE SELECT */
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
   
     /* MULTIPLE CHOICE SELECT */
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
      SELECT MULTIPLE CHOICE
      ============================================================ */
   function selectISTAnswer(value) {
     document.querySelectorAll('.ist-option-box').forEach(b => b.classList.remove('selected'));
     const v = normalizeLetter(value);
     const radio = document.querySelector(`input[name="ist-answer"][value="${v}"]`);
     if (radio) {
       radio.checked = true;
       radio.parentElement.classList.add('selected');
     }
   }
   
   /* ============================================================
      SAVE CURRENT ANSWER
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
   
   /* ============================================================
      NEXT QUESTION
      ============================================================ */
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
   
   /* ============================================================
      PREVIOUS QUESTION
      ============================================================ */
   function previousISTQuestion() {
     if (appState.currentQuestion <= 0) return;
     appState.currentQuestion--;
     renderISTQuestion();
   }
   
   /* ============================================================
      THANK YOU / FINISH
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
   
     window.__inTestView = true;
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
         name: bucket?.name || `Subtes ${idx+1}`, qlen: null
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
      PDF RENDERERS — Versi minimal (kompatibel dgn pdf.js)
      ============================================================ */
   function renderISTSummaryToPDF(doc, pageWidth, ySection) {
     try {
       const summary = computeISTPerSubtestScores();
       ySection += 4;
       doc.setFontSize(9);
       doc.setFont(undefined, 'bold');
       doc.text('RINGKASAN IST', 16, ySection);
       ySection += 4;
       doc.setFont(undefined, 'normal');
       doc.setFontSize(7);
       summary.forEach(r => {
         if (ySection > 270) { doc.addPage(); ySection = 20; }
         doc.text(`${r.code}: RW=${r.rw} | SW=${Math.round(Number(r.sw)||0)}`, 16, ySection);
         ySection += 3.2;
       });
       return ySection + 2;
     } catch (e) { return ySection; }
   }
   
   function renderISTScoresToPDF(doc, pageWidth, ySection, summary) {
     return ySection;
   }
   function renderISTIQToPDF(doc, pageWidth, ySection, summary) {
     try {
       const totalRW = summary.reduce((a, r) => a + (Number(r.rw) || 0), 0);
       const age = (typeof getAgeYearsForNorms === 'function') ? getAgeYearsForNorms() : 25;
       const totalSW = getTotalSWFromRW(totalRW, age);
       const iq = getIQFromSW(totalSW);
       ySection += 4;
       if (ySection > 270) { doc.addPage(); ySection = 20; }
       doc.setFontSize(8);
       doc.text(`IQ: ${iq ?? '-'} — ${iqCategory(iq)}`, 16, ySection);
       return ySection + 4;
     } catch { return ySection; }
   }
   function renderISTDescriptionsToPDF(doc, pageWidth, ySection, summary) {
     return ySection;
   }
   function renderISTThinkingDimensionToPDF(doc, pageWidth, ySection, summary) {
     return ySection;
   }
   function renderISTSWChartToPDF(doc, pageWidth, ySection, summary) {
     try {
       if (typeof drawSWLineChart === 'function') {
         ySection = drawSWLineChart(doc, 20, ySection, pageWidth - 40, 46, summary);
       }
       return ySection;
     } catch { return ySection; }
   }
   function renderISTMWAnalysisToPDF(doc, pageWidth, ySection, summary) {
     return ySection;
   }
   
   console.log('[TEST-IST] ✓ Loaded — 21 fungsi');