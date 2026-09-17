/* =========================================================
   KRAEPLIN TEST — Full Logic
   ========================================================= */

   let timeOutEffect = false;
   let _kraeplinClickHintCleanup = null;
   
   /* ============================================================
      INSTRUKSI
      ============================================================ */
   function renderKraeplinInstructions() {
     const app = document.getElementById("app");
   
     app.innerHTML = `
       <div class="kraeplin-instruction">
      <div class="instruction-header">
        <div style="display:flex;align-items:center;justify-content:center;gap:15px;margin-bottom:8px;">
          ${renderTestLogoBadge()}
          <div style="text-align:left;">
            <h2 style="margin:0;">Instruksi Tes Kraeplin</h2>
          </div>
        </div>
        <p>Baca instruksi singkat berikut sebelum memulai tes.</p>
      </div>
   
         <div class="instruction-content">
           <div class="instruction-row">
             <div class="instruction-col">
               <div class="instruction-label">Cara Mengerjakan</div>
               <ul class="compact-list">
                 <li>Lihat contoh visual.</li>
                 <li>Ketik <b>jawaban</b> hasil penjumlahan di box.</li>
                 <li>Kerjakan tiap kolom dalam <b>15 detik</b>.</li>
               </ul>
             </div>
   
             <div class="instruction-col">
               <div class="instruction-label">Perhatian</div>
               <ul class="compact-list">
                 <li>Kecepatan <b>dan</b> ketelitian sama penting.</li>
                 <li>Hanya tulis digit terakhir (contoh: 17 → 7).</li>
                 <li>Waktu habis, otomatis ke baris berikutnya.</li>
               </ul>
             </div>
           </div>
   
           <div class="visual-section">
             <div class="section-title">Contoh Visual</div>
             <div class="image-container">
               <img src="https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/KRAEPLIN.jpg"
                    alt="Contoh Pengerjaan Kraeplin"
                    class="gambar-kraeplin">
             </div>
   
             <div class="calc-examples">
               <div>8 + 7 = 15 → tulis <b>5</b></div>
               <div>8 + 1 = 9 → tulis <b>9</b></div>
               <div>3 + 3 = 6 → tulis <b>6</b></div>
               <div>2 + 8 = 10 → tulis <b>0</b></div>
             </div>
           </div>
         </div>
   
         <div class="instruction-footer">
           <button class="btn-instruction-green" onclick="startKraeplinTrial()">
             <span style="font-size:1em;font-weight:600;">PAHAMI & MULAI PERCOBAAN</span>
           </button>
         </div>
       </div>
     `;
   }
   
   /* ============================================================
      START TRIAL & REAL
      ============================================================ */
   function startKraeplinTrial() {
     appState.isKraeplinTrial = true;
     appState.kraeplinStarted = false;
     appState.completed.KRAEPLIN = false;
     appState.currentColumn = 0;
     appState.timeLeft = 15;
     appState.answers.KRAEPLIN = [];
     appState.currentRow = {};
     appState.kraeplinHistory = {};
   
     tests.KRAEPLIN.columns = generateKraeplinColumns(4, 28);
     generateKraeplinKey();
   
     renderKraeplinBoard();
   }
   
   function startKraeplinReal() {
     appState.isKraeplinTrial = false;
     appState.kraeplinStarted = false;
     appState.completed.KRAEPLIN = false;
     appState.currentColumn = 0;
     appState.timeLeft = 15;
     appState.answers.KRAEPLIN = [];
     appState.currentRow = {};
     appState.kraeplinHistory = {};
   
     tests.KRAEPLIN.columns = generateKraeplinColumns(50, 28);
     generateKraeplinKey();
   
     renderKraeplinBoard();
   }
   
   /* ============================================================
      FINISH
      ============================================================ */
   function finishKraeplinBoard() {
     clearInterval(appState.timer);
     appState.timerActive = false;
     appState.kraeplinStarted = false;
   
     if (appState.isKraeplinTrial) {
       appState.completed.KRAEPLIN = true;
       renderKraeplinBoard();
     } else {
       appState.completed.KRAEPLIN = true;
       markTestCompleted('KRAEPLIN');
       showThankYouAndHomeKRAEPLIN();
     }
   }
   
   /* ============================================================
      GENERATE COLUMNS & KEY
      ============================================================ */
   function generateKraeplinColumns(jumlahKolom, jumlahBaris) {
     return Array.from({ length: jumlahKolom }, () =>
       Array.from({ length: jumlahBaris }, () => Math.floor(Math.random() * 9) + 1)
     );
   }
   
   function generateKraeplinKey() {
     const key = [];
     const columns = tests.KRAEPLIN.columns;
   
     for (let col = 0; col < columns.length; col++) {
       key[col] = [];
       for (let row = 0; row < columns[col].length - 1; row++) {
         const sum = columns[col][row] + columns[col][row + 1];
         key[col][row] = sum % 10;
       }
     }
   
     appState.kraeplinKey = key;
   }
   
   /* ============================================================
      THANK YOU SCREEN
      ============================================================ */
   function showThankYouAndHomeKRAEPLIN() {
     clearInterval(appState.timer);
     markTestCompleted('KRAEPLIN');
   
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
                  <div class="ist-eyebrow">PERFORMANCE ASSESSMENT</div>
                  <h2 class="ist-title" style="margin-top:11px;">Tes Kraeplin Selesai</h2>
                  <p class="ist-subtitle">Terima kasih, jawaban Anda telah berhasil disimpan.</p>
                </div>
              </div>
            </div>
          </div>
   
           <div class="ist-body">
             <div class="ist-instruction-card" style="text-align:center;padding:32px 22px;">
               <div style="font-size:4rem;line-height:1;margin-bottom:16px;">🎉</div>
               <div style="font-size:1.15rem;font-weight:800;color:#172033;margin-bottom:10px;">
                 Terima kasih!
               </div>
               <div style="max-width:650px;margin:0 auto;color:#667085;line-height:1.7;">
                 Tes Kraeplin sudah selesai dan seluruh jawaban Anda telah tersimpan.<br>
                 Silakan lanjut mengerjakan tes berikutnya yang tersedia.
               </div>
             </div>
   
             <div class="ist-actions">
               <button class="ist-btn-primary" id="btnContinueKrae" type="button">
                 ✅ Lanjut Tes Berikutnya
               </button>
             </div>
           </div>
         </div>
       </div>
     `;
   
     document.getElementById('btnContinueKrae').onclick = () => {
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
   
   /* ============================================================
      BOARD & TIMER
      ============================================================ */
   function renderKraeplinBoard() {
     if (typeof _kraeplinClickHintCleanup === 'function') {
       _kraeplinClickHintCleanup();
       _kraeplinClickHintCleanup = null;
     }
   
     const columns = tests?.KRAEPLIN?.columns || [];
     const app = document.getElementById('app');
   
     if (!app || !columns.length) return;
   
     const colCount = columns.length;
     const visibleRows = 5;
     const visibleCols = 4;
   
     const activeCol = appState.currentColumn ?? 0;
     const isSelesai = appState.completed.KRAEPLIN;
   
     const windowEnd = Math.min(colCount, activeCol + 1);
     const windowStart = Math.max(0, windowEnd - visibleCols);
   
     const treadmillIndexes = (col) => {
       const arr = [];
       const len = columns[col]?.length || 0;
       const from = Math.max(0, len - visibleRows);
       for (let i = from; i < len; i++) arr.push(i);
       return arr;
     };
   
     const dangerEffect = (appState.kraeplinStarted && timeOutEffect) ? ' danger-effect' : '';
   
     const label = appState.isKraeplinTrial
       ? `<div class="kp-mode-label trial">● TAHAP PERCOBAAN / TRIAL</div>`
       : `<div class="kp-mode-label">● TES KRAEPLIN SESUNGGUHNYA</div>`;
   
     const totalCols = colCount;
     const doneCols = (appState.kraeplinStarted && !isSelesai)
       ? activeCol
       : (isSelesai ? totalCols : 0);
     const inProg = (appState.kraeplinStarted && !isSelesai) ? 1 : 0;
     const stepCols = Math.min(doneCols + inProg, totalCols);
     const pctCols = totalCols ? Math.round((stepCols / totalCols) * 100) : 0;
   
     const dotHTML = Array.from({ length: totalCols }, (_, i) => {
       const cls = i < doneCols
         ? 'kp-dot done'
         : (i === doneCols && inProg ? 'kp-dot cur' : 'kp-dot');
       return `<span class="${cls}" aria-hidden="true"></span>`;
     }).join('');
   
     let html = `
       <div class="card kraeplin-card${dangerEffect}" aria-hidden="${(!appState.kraeplinStarted && !isSelesai) ? 'true' : 'false'}">
         <div class="header">
           ${renderTestLogoBadge('small')}
           <h2>${tests.KRAEPLIN.name}</h2>
           <p>${tests.KRAEPLIN.description}</p>
           <p>Waktu per kolom: <strong style="color:#4f46e5;"><span id="timer-desc">${appState.timeLeft || 15}s</span></strong></p>
           ${label}
         </div>
   
         <div class="timer-float-top" id="kraeplin-timer-top">
           <span style="font-size:1.05rem;">⏱️</span>
           <span id="kraeplin-timer-top-num">${appState.timeLeft || 15}s</span>
         </div>
   
         <div class="kp-progress" aria-live="polite">
           <div class="kp-progress-head">
             <span>Kolom: <b id="kp-col">${Math.max(stepCols, isSelesai ? totalCols : stepCols)}/${totalCols}</b></span>
             <span id="kp-pct">${pctCols}%</span>
           </div>
           <div class="kp-bar">
             <div class="kp-fill" style="width:${pctCols}%"></div>
           </div>
           <div class="kp-dots">${dotHTML}</div>
         </div>
   
         <div class="kraeplin-board-flex">
     `;
   
     for (let c = windowStart; c < windowEnd; c++) {
       html += `
         <div class="kraeplin-col-vertical ${c === activeCol ? 'kraeplin-active' : ''}" data-col="${c}" style="position:relative;">
           <div style="display:flex;flex-direction:row;align-items:flex-end;justify-content:center;width:100%;height:100%;">
             <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;">
       `;
   
       const indexes = treadmillIndexes(c);
       for (let i = 0; i < indexes.length; i++) {
         const idx = indexes[i];
         html += `
           <div class="kraeplin-row">
             <div class="kraeplin-num">${columns[c][idx]}</div>
           </div>
         `;
       }
   
       html += `</div>`;
   
       if (
         !isSelesai &&
         c === activeCol &&
         appState.kraeplinStarted &&
         columns[c].length >= 2
       ) {
         const idxBawah = columns[c].length - 1;
         const idxAtas = columns[c].length - 2;
         const angkaAtas = columns[c][idxAtas];
         const angkaBawah = columns[c][idxBawah];
         const existingAnswer = appState.answers?.KRAEPLIN?.[c]?.[idxAtas];
         const inputEmpty = (existingAnswer === undefined || existingAnswer === null || existingAnswer === '');
   
         html += `
           <div class="kraeplin-click-wrapper" style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;margin-left:8px;padding-bottom:2px;position:relative;">
             <div style="font-size:.65rem;color:#64748b;font-weight:700;margin-bottom:5px;white-space:nowrap;">
               ${angkaAtas} + ${angkaBawah}
             </div>
             <input
               type="text"
               class="kraeplin-input-bottom ${inputEmpty ? 'input-empty' : ''}"
               data-col="${c}"
               data-index="${idxAtas}"
               maxlength="1"
               autocomplete="off"
               inputmode="numeric"
               pattern="[0-9]"
               aria-label="Jawaban kolom ${c + 1}"
               placeholder=""
               value="${inputEmpty ? '' : String(existingAnswer)}"
               ${!appState.kraeplinStarted ? 'disabled' : ''}
               onfocus="this.classList.remove('input-empty');this.classList.remove('kp-click-target');const h=this.parentElement.querySelector('.kp-click-hint');if(h){h.classList.remove('show');}this.placeholder='';"
               onclick="this.select();"
               oninput="isiJawabanKraeplinBottom(this)"
             />
             <div class="kp-click-hint" aria-hidden="true">Klik box ini</div>
           </div>
         `;
       } else {
         html += `
           <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;margin-left:8px;padding-bottom:2px;">
             <div style="font-size:.65rem;color:#94a3b8;font-weight:600;margin-bottom:5px;">+</div>
             <input type="text" class="kraeplin-input-bottom" disabled placeholder="–" />
           </div>
         `;
       }
   
       html += `</div></div>`;
     }
   
     html += `
         </div>
   
         <div id="kraeplinLiveStats">
           <b>Jawaban benar:</b> 0 &nbsp; | &nbsp;
           <b>Salah:</b> 0 &nbsp; | &nbsp;
           <b>Jumlah isi:</b> 0 &nbsp; | &nbsp;
           <b>Ketelitian:</b> 0.0%
           ${appState.isKraeplinTrial ? `<div style="color:#b45309;font-size:.68rem;font-weight:700;margin-top:3px;">● MODE PERCOBAAN / TRIAL</div>` : ''}
         </div>
       </div>
     `;
   
     app.innerHTML = html;
   
     const harusTampilStartTrial = (appState.isKraeplinTrial && !appState.kraeplinStarted && !isSelesai);
     const harusTampilStartRealSetelahTrial = (appState.isKraeplinTrial && isSelesai);
     const harusTampilStartReal = (!appState.isKraeplinTrial && !appState.kraeplinStarted && !isSelesai);
   
     if (harusTampilStartTrial) {
       setKraeplinBlur(true);
       createOverlay(`
         <h3>🧮 Mulai Percobaan</h3>
         <p>Latihan singkat untuk memahami alur pengerjaan tes Kraeplin.</p>
         <div class="overlay-actions">
           <button class="btn-pill btn-start-trial" id="btnStartTrial" onclick="startKraeplinBoard()">
             🚀 Mulai Percobaan
           </button>
         </div>
       `);
       attachEnterHotkeyOnce('btnStartTrial', startKraeplinBoard);
     } else if (harusTampilStartRealSetelahTrial) {
       setKraeplinBlur(true);
       createOverlay(`
         <h3>✨ Percobaan Selesai</h3>
         <p>Anda sudah menyelesaikan tahap latihan. Selanjutnya masuk ke tes Kraeplin sesungguhnya.</p>
         <div class="overlay-actions">
           <button class="btn-pill btn-start-real2" id="btnStartReal" onclick="startKraeplinReal()">
             🚀 Mulai Tes Sungguhan
           </button>
         </div>
       `);
       attachEnterHotkeyOnce('btnStartReal', startKraeplinReal);
     } else if (harusTampilStartReal) {
       setKraeplinBlur(true);
       createOverlay(`
         <h3>🧠 Mulai Tes Kraeplin</h3>
         <p>Pastikan Anda sudah siap. Setelah dimulai, waktu setiap kolom akan berjalan otomatis.</p>
         <div class="overlay-actions">
           <button class="btn-pill btn-start-real" id="btnStartRealMain" onclick="startKraeplinBoard()">
             🚀 Mulai Tes Kraeplin
           </button>
         </div>
       `);
       attachEnterHotkeyOnce('btnStartRealMain', startKraeplinBoard);
     } else {
       setKraeplinBlur(false);
       removeOverlay();
     }
   
     setTimeout(() => {
       if (appState.kraeplinStarted) {
         const input = document.querySelector('.kraeplin-col-vertical.kraeplin-active input:not([disabled])');
         if (input) input.focus({ preventScroll: true });
       }
     }, 80);
   
     if (appState.kraeplinStarted && !isSelesai) {
       setTimeout(() => { initKraeplinClickHint(); }, 100);
     }
   
     if (appState.kraeplinStarted && timeOutEffect) {
       if (typeof window._kraeplinDangerSoundLock === 'undefined') {
         window._kraeplinDangerSoundLock = false;
       }
   
       if (!window._kraeplinDangerSoundLock && typeof playBeep === 'function') {
         window._kraeplinDangerSoundLock = true;
         try { playBeep(); } catch (err) { console.warn('[KRAEPLIN] Suara gagal:', err); }
         setTimeout(() => { window._kraeplinDangerSoundLock = false; }, 700);
       }
   
       const card = document.querySelector('#app .kraeplin-card');
       if (card) {
         card.classList.remove('danger-effect');
         void card.offsetWidth;
         card.classList.add('danger-effect');
       }
   
       const tmrTop = document.getElementById('kraeplin-timer-top');
       const tmrNum = document.getElementById('kraeplin-timer-top-num');
   
       if (tmrTop) {
         tmrTop.classList.remove('danger-timer');
         void tmrTop.offsetWidth;
         tmrTop.classList.add('danger-timer');
       }
       if (tmrNum) {
         tmrNum.classList.remove('danger-timer');
         void tmrNum.offsetWidth;
         tmrNum.classList.add('danger-timer');
       }
   
       setTimeout(() => {
         const currentCard = document.querySelector('#app .kraeplin-card');
         const currentTop = document.getElementById('kraeplin-timer-top');
         const currentNum = document.getElementById('kraeplin-timer-top-num');
         if (currentCard) currentCard.classList.remove('danger-effect');
         if (currentTop) currentTop.classList.remove('danger-timer');
         if (currentNum) currentNum.classList.remove('danger-timer');
       }, 700);
     }
   
     if (typeof updateKraeplinTimerDisplay === 'function') {
       updateKraeplinTimerDisplay(appState.timeLeft);
     }
     if (typeof updateKraeplinLiveStats === 'function') {
       updateKraeplinLiveStats();
     }
   }
   
   /* ============================================================
      SISTEM KLIK BOX
      ============================================================ */
   function initKraeplinClickHint() {
     if (typeof _kraeplinClickHintCleanup === 'function') {
       _kraeplinClickHintCleanup();
       _kraeplinClickHintCleanup = null;
     }
   
     if (!appState.kraeplinStarted || appState.completed.KRAEPLIN) return;
   
     const activeInput = document.querySelector('.kraeplin-col-vertical.kraeplin-active input.kraeplin-input-bottom:not([disabled])');
     if (!activeInput) return;
   
     const hint = activeInput.parentElement?.querySelector('.kp-click-hint');
     if (!hint) return;
   
     let hideTimer = null;
   
     function showHint() {
       clearTimeout(hideTimer);
       activeInput.classList.add('kp-click-target');
       hint.classList.add('show');
       hideTimer = setTimeout(() => {
         hint.classList.remove('show');
         activeInput.classList.remove('kp-click-target');
       }, 1800);
     }
   
     function hideHint() {
       clearTimeout(hideTimer);
       hint.classList.remove('show');
       activeInput.classList.remove('kp-click-target');
     }
   
     function handleKraeplinClick(e) {
       if (!appState.kraeplinStarted || appState.completed.KRAEPLIN) return;
       if (e.target.closest('#kraeplinOverlay')) return;
       if (e.target === activeInput || activeInput.contains(e.target)) {
         hideHint();
         return;
       }
       showHint();
     }
   
     document.addEventListener('click', handleKraeplinClick, true);
   
     _kraeplinClickHintCleanup = function () {
       document.removeEventListener('click', handleKraeplinClick, true);
       clearTimeout(hideTimer);
       hideHint();
     };
   }
   
   /* ============================================================
      OVERLAY HELPERS
      ============================================================ */
   function setKraeplinBlur(state) {
     document.body.classList.toggle('kraeplin-blurred', !!state);
   }
   
   function createOverlay(inner) {
     removeOverlay();
     const veil = document.createElement('div');
     veil.id = 'kraeplinOverlay';
     veil.className = 'overlay-veil';
     veil.setAttribute('role', 'dialog');
     veil.setAttribute('aria-modal', 'true');
     veil.innerHTML = `<div class="overlay-modal" tabindex="-1">${inner}</div>`;
   
     veil.addEventListener('click', (e) => {
       if (e.target === veil) {
         e.preventDefault();
         e.stopPropagation();
       }
     });
   
     document.body.appendChild(veil);
   
     requestAnimationFrame(() => {
       const b = veil.querySelector('button');
       if (b) b.focus();
     });
   }
   
   function removeOverlay() {
     const v = document.getElementById('kraeplinOverlay');
     if (v) v.remove();
   }
   
   let _enterHotkeyCleanup = null;
   
   function attachEnterHotkeyOnce(btnId, fn) {
     if (_enterHotkeyCleanup) _enterHotkeyCleanup();
   
     const handler = (e) => {
       if (e.key === 'Enter') {
         const b = document.getElementById(btnId);
         if (b) {
           e.preventDefault();
           fn();
         }
       }
     };
   
     document.addEventListener('keydown', handler);
   
     _enterHotkeyCleanup = () => {
       document.removeEventListener('keydown', handler);
     };
   }
   
   /* ============================================================
      START BOARD
      ============================================================ */
   function startKraeplinBoard() {
     if (typeof prepareAudioContext === 'function') prepareAudioContext();
   
     appState.kraeplinStarted = true;
     appState.currentColumn = 0;
     appState.timeLeft = 15;
     appState.timerActive = true;
     appState.currentRow = {};
   
     removeOverlay();
     setKraeplinBlur(false);
   
     if (_enterHotkeyCleanup) _enterHotkeyCleanup();
   
     renderKraeplinBoard();
     startKraeplinBoardTimer();
   }
   
   /* ============================================================
      TIMER
      ============================================================ */
   function startKraeplinBoardTimer() {
     clearInterval(appState.timer);
     appState.timerActive = true;
   
     updateKraeplinTimerDisplay(appState.timeLeft);
   
     appState.timer = setInterval(() => {
       appState.timeLeft--;
       updateKraeplinTimerDisplay(appState.timeLeft);
   
       if (appState.timeLeft <= 0) {
         clearInterval(appState.timer);
         appState.timerActive = false;
         timeOutEffect = true;
         renderKraeplinBoard();
   
         setTimeout(() => {
           timeOutEffect = false;
           nextKraeplinCol();
         }, 700);
       }
     }, 1000);
   }
   
   /* ============================================================
      INPUT JAWABAN
      ============================================================ */
   function isiJawabanKraeplinBottom(el) {
     const col = +el.dataset.col;
   
     if (!appState.kraeplinStarted || appState.completed.KRAEPLIN) return;
   
     el.value = String(el.value).replace(/\D/g, '').slice(-1);
   
     const columns = tests.KRAEPLIN.columns;
     const currentRowIndex = columns[col].length - 2;
   
     if (!appState.answers.KRAEPLIN[col]) {
       const initialLength = columns[col].length - 1;
       appState.answers.KRAEPLIN[col] = Array(initialLength).fill(null);
     }
   
     if (el.value !== '') {
       appState.answers.KRAEPLIN[col][currentRowIndex] = parseInt(el.value, 10);
     }
   
     updateKraeplinLiveStats();
   
     if (el.value.length === 1) {
       if (tests.KRAEPLIN.columns[col].length > 0) {
         tests.KRAEPLIN.columns[col].pop();
       }
       renderKraeplinBoard();
     }
   }
   
   /* ============================================================
      LIVE STATS
      ============================================================ */
   function updateKraeplinLiveStats() {
     let benar = 0, salah = 0, total = 0;
   
     const jawaban = appState.answers?.KRAEPLIN || [];
     const kunci = appState.kraeplinKey || [];
   
     for (let col = 0; col < jawaban.length; col++) {
       if (!Array.isArray(jawaban[col])) continue;
   
       for (let row = 0; row < jawaban[col].length; row++) {
         if (typeof jawaban[col][row] !== 'number') continue;
         total++;
   
         if (jawaban[col][row] === kunci?.[col]?.[row]) {
           benar++;
         } else {
           salah++;
         }
       }
     }
   
     const ketelitian = total ? (benar / total * 100).toFixed(1) : "0.0";
   
     const el = document.getElementById('kraeplinLiveStats');
     if (el) {
       el.innerHTML = `
         <b>Jawaban benar:</b> ${benar} &nbsp; | &nbsp;
         <b>Salah:</b> ${salah} &nbsp; | &nbsp;
         <b>Jumlah isi:</b> ${total} &nbsp; | &nbsp;
         <b>Ketelitian:</b> ${ketelitian}%
         ${appState.isKraeplinTrial ? `<div style="color:#b45309;font-size:.68rem;font-weight:700;margin-top:3px;">● MODE PERCOBAAN / TRIAL</div>` : ''}
       `;
     }
   }
   
   /* ============================================================
      TIMER DISPLAY
      ============================================================ */
   function updateKraeplinTimerDisplay(val) {
     const timerEl = document.getElementById('kraeplin-timer');
     const descEl = document.getElementById('timer-desc');
     const topEl = document.getElementById('kraeplin-timer-top-num');
   
     const display = (val !== undefined ? val : (appState.timeLeft || 15)) + 's';
   
     if (timerEl) timerEl.textContent = display;
     if (descEl)  descEl.textContent  = display;
     if (topEl)   topEl.textContent   = display;
   
     const isCritical = (appState.timeLeft || 15) <= 3;
   
     if (timerEl) {
       if (isCritical) timerEl.classList.add('danger-timer');
       else timerEl.classList.remove('danger-timer');
     }
   
     if (topEl) {
       if (isCritical) topEl.classList.add('danger-timer');
       else topEl.classList.remove('danger-timer');
     }
   }
   
   /* ============================================================
      PINDAH KOLOM
      ============================================================ */
   function nextKraeplinCol() {
     let nextCol = (appState.currentColumn ?? 0) + 1;
   
     if (nextCol < tests.KRAEPLIN.columns.length) {
       appState.currentColumn = nextCol;
       appState.timeLeft = 15;
       appState.timerActive = false;
       renderKraeplinBoard();
       startKraeplinBoardTimer();
     } else {
       finishKraeplinBoard();
     }
   }
   
   /* ============================================================
      ANALISIS KRAEPLIN
      ============================================================ */
   function analyzeKraeplin() {
     const user = appState.answers.KRAEPLIN || [];
     const key  = appState.kraeplinKey || [];
     const history = appState.kraeplinHistory || {};
   
     const isiPerKolom = [];
     const benarPerKolom = [];
     const salahPerKolom = [];
     const skippedPerKolom = [];
   
     let totalBenar = 0, totalSalah = 0, totalSkipped = 0, kolomTerisi = 0, dibenarkan = 0;
   
     for (let col = 0; col < user.length; col++) {
       const U = user[col], K = key[col];
       if (!Array.isArray(U) || !Array.isArray(K)) continue;
   
       const n = Math.min(U.length, K.length);
       let isi = 0, b = 0, s = 0, sk = 0;
   
       for (let row = 0; row < n; row++) {
         const ans = U[row];
         const kunci = K[row];
   
         if (ans === null || typeof ans === "undefined") { sk++; continue; }
   
         isi++;
         if (ans === kunci) {
           b++;
           const hKey = `${col}-${row}`;
           const riwayat = history[hKey] || [];
           if (riwayat.length > 1 && riwayat.some(v => v !== kunci)) dibenarkan++;
         } else {
           s++;
         }
       }
   
       if (isi + sk > 0) {
         isiPerKolom.push(isi);
         benarPerKolom.push(b);
         salahPerKolom.push(s);
         skippedPerKolom.push(sk);
   
         totalBenar += b;
         totalSalah += s;
         totalSkipped += sk;
         kolomTerisi++;
       }
     }
   
     const kecepatan = isiPerKolom.reduce((a, b) => a + b, 0);
     const avgIsiPerKolom = isiPerKolom.length ? kecepatan / isiPerKolom.length : 0;
     const totalSoal = kecepatan;
     const ketelitian = totalSoal ? (totalBenar / totalSoal) * 100 : 0;
   
     const panker = avgIsiPerKolom;
     const tianker = totalSalah + totalSkipped;
   
     let jankerRange = 0, jankerAvgDev = 0;
     if (isiPerKolom.length) {
       const maxY = Math.max(...isiPerKolom);
       const minY = Math.min(...isiPerKolom);
       jankerRange = maxY - minY;
       jankerAvgDev = isiPerKolom.reduce((a, y) => a + Math.abs(y - avgIsiPerKolom), 0) / isiPerKolom.length;
     }
   
     let slope = 0, hanker = 0;
     if (isiPerKolom.length >= 2) {
       const N = isiPerKolom.length;
       const xs = Array.from({ length: N }, (_, i) => i + 1);
       const meanX = xs.reduce((a, c) => a + c, 0) / N;
       const meanY = avgIsiPerKolom;
       const num = xs.reduce((a, x, i) => a + (x - meanX) * (isiPerKolom[i] - meanY), 0);
       const den = xs.reduce((a, x) => a + Math.pow(x - meanX, 2), 0);
       slope = den ? (num / den) : 0;
       hanker = slope * 50;
     }
   
     let mentalFatigue = 0;
     if (isiPerKolom.length >= 4) {
       const q = Math.floor(isiPerKolom.length / 4);
       const awal = isiPerKolom.slice(0, q).reduce((a, b) => a + b, 0) / (q || 1);
       const akhir = isiPerKolom.slice(-q).reduce((a, b) => a + b, 0) / (q || 1);
       mentalFatigue = awal > 0 ? ((awal - akhir) / awal) * 100 : 0;
     }
   
     const akurasiPerKolom = isiPerKolom.map((isi, i) => isi > 0 ? (benarPerKolom[i] / isi) * 100 : 0);
     const rataAkurasi = akurasiPerKolom.length ? akurasiPerKolom.reduce((a, b) => a + b, 0) / akurasiPerKolom.length : 0;
   
     const diffs = [];
     for (let i = 1; i < isiPerKolom.length; i++) diffs.push(Math.abs(isiPerKolom[i] - isiPerKolom[i - 1]));
     const rataFluktuasi = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0;
     const koefisienKonsistensi = avgIsiPerKolom ? (rataFluktuasi / avgIsiPerKolom) * 100 : 0;
   
     return {
       benar: totalBenar,
       salah: totalSalah,
       dibenarkan,
       total: totalSoal,
       ketelitian,
       kecepatan,
       isiPerKolom,
       akurasiPerKolom,
       keajegan: rataFluktuasi,
       koefisienKonsistensi,
       ketahananSlope: slope,
       mentalFatigue,
       avgIsi: avgIsiPerKolom,
       rataAkurasi,
       kolomTerisi,
       panker,
       tianker,
       jankerRange,
       jankerAvgDev,
       hanker
     };
   }
   
   function kraeplinKategori(skor, jenisMetric, tresholds) {
     const defaultThresholds = {
       kecepatan: [100, 200, 300, 400],
       ketelitian: [60, 70, 80, 90],
       konsistensi: [40, 30, 20, 10],
       ketahanan: [-0.5, -0.2, 0.2, 0.5]
     };
     const thresholds = tresholds || defaultThresholds[jenisMetric] || [20, 40, 60, 80];
     if (skor <= thresholds[0]) return "Rendah Sekali";
     if (skor <= thresholds[1]) return "Rendah";
     if (skor <= thresholds[2]) return "Cukup";
     if (skor <= thresholds[3]) return "Tinggi";
     return "Tinggi Sekali";
   }
   
   function generateKraeplinReport(analysis) {
     const {
       panker, tianker, jankerRange, jankerAvgDev, hanker,
       benar, salah, dibenarkan, total, ketelitian, kecepatan,
       ketahananSlope, mentalFatigue, avgIsi, kolomTerisi
     } = analysis;
   
     let kategoriKetahanan;
     if (hanker < -1) kategoriKetahanan = "Menurun";
     else if (hanker > 1) kategoriKetahanan = "Meningkat";
     else kategoriKetahanan = "Stabil";
   
     const LABELS5 = ["Rendah Sekali", "Rendah", "Cukup", "Tinggi", "Sangat Tinggi"];
     const bandsP = [10, 14, 18, 22];
     const bandsT = [5, 10, 15, 20];
     const bandsJ = [1.5, 2.5, 4.0, 6.0];
   
     function pickLabel5(value, bandsAsc, invert = false) {
       const [b1, b2, b3, b4] = bandsAsc;
       let idx = 0;
       if (value <= b1) idx = 0;
       else if (value <= b2) idx = 1;
       else if (value <= b3) idx = 2;
       else if (value <= b4) idx = 3;
       else idx = 4;
       return invert ? LABELS5.slice().reverse()[idx] : LABELS5[idx];
     }
   
     const catP = pickLabel5(panker ?? 0, bandsP, false);
     const catT = pickLabel5(tianker ?? 0, bandsT, true);
     const catJ = pickLabel5(jankerAvgDev ?? 0, bandsJ, true);
   
     const lowList = [];
     if (catP === "Rendah" || catP === "Rendah Sekali") lowList.push("tempo kerja");
     if (catT === "Rendah" || catT === "Rendah Sekali") lowList.push("ketelitian");
     if (catJ === "Rendah" || catJ === "Rendah Sekali") lowList.push("keajegan");
     if (kategoriKetahanan === "Menurun") lowList.push("ketahanan (ritme menurun)");
   
     function roleDemand(pos) {
       switch (pos) {
         case "Administrator": return "tugas administratif yang menuntut ketelitian arsip, konsistensi pencatatan, dan ritme kerja stabil";
         case "Technical Staff": return "tugas teknis yang menuntut tempo eksekusi, ketahanan pada repetisi, dan kestabilan kualitas";
         case "Housekeeping": return "tugas kebersihan yang menuntut tempo terjaga, perhatian detail, dan kesinambungan hasil";
         default: return "tugas harian yang menuntut keseimbangan tempo, ketelitian, dan kestabilan";
       }
     }
   
     const posisi = (appState?.identity?.position || "").trim();
   
     function roleSentence(pos) {
       const angka = ` (PANKER ${(panker ?? 0).toFixed(1)}/lajur; TIANKER ${tianker ?? 0}; JANKER ${(jankerAvgDev ?? 0).toFixed(2)}; HANKER ${(hanker >= 0 ? "+" : "")}${(hanker ?? 0).toFixed(2)})`;
       const dasar = `Untuk posisi ${pos}, profil menunjukkan kecepatan ${catP.toLowerCase()}, ketelitian ${catT.toLowerCase()}, keajegan ${catJ.toLowerCase()}, serta ketahanan yang ${kategoriKetahanan.toLowerCase()}; `;
       if (!lowList.length) return dasar + `kombinasi ini mendukung ${roleDemand(pos)}.` + angka;
       const joinLow = lowList.join(", ").replace(", ketahanan", " dan ketahanan");
       return dasar + `perlu penguatan pada ${joinLow} agar lebih selaras dengan ${roleDemand(pos)}.` + angka;
     }
   
     const interpretasiPosisi = (posisi && posisi !== "Guru") ? roleSentence(posisi) : null;
   
     return {
       skor: {
         PANKER: panker,
         TIANKER: tianker,
         JANKER: { range: jankerRange, avgDev: jankerAvgDev },
         HANKER: hanker,
         kecepatan,
         ketelitian,
         konsistensi: analysis.koefisienKonsistensi,
         ketahanan: ketahananSlope,
         mentalFatigue
       },
       kategori: { panker: catP, tianker: catT, janker: catJ, ketahanan: kategoriKetahanan },
       interpretasi: {
         panker: `Laju kerja (PANKER): rata-rata ${(panker ?? 0).toFixed(1)} item per lajur (15 detik/lajur).`,
         tianker: `Ketelitian (TIANKER): total kesalahan + loncatan = ${tianker ?? 0}. Semakin kecil → semakin teliti.`,
         janker: `Keajegan (JANKER): rentang ${jankerRange ?? 0}, deviasi rata-rata ${(jankerAvgDev ?? 0).toFixed(2)}. Semakin kecil → semakin ajeg/stabil.`,
         hanker: `Ketahanan (HANKER): ${kategoriKetahanan} (Δ≈ ${(hanker ?? 0).toFixed(2)} item dari awal menuju lajur 50).`,
         kecepatan: `Total item diisi: ${kecepatan ?? 0} (rata ${(avgIsi ?? 0).toFixed(1)}/lajur, ${kolomTerisi ?? 0} lajur dikerjakan).`,
         ketelitian_lama: `Akurasi keseluruhan (informasi tambahan): ${(ketelitian ?? 0).toFixed(1)}%.`,
         posisi: interpretasiPosisi
       },
       detail: {
         jawabanBenar: benar,
         jawabanSalah: salah,
         jawabanDibenarkan: dibenarkan,
         totalDiisi: total,
         kolomDikerjakan: kolomTerisi
       }
     };
   }
   
   /* ============================================================
      GRAFIK KRAEPLIN UNTUK PDF
      ============================================================ */
   function renderKraeplinChartToPDF(doc, x, y, width, height, data, opts = {}) {
     if (!Array.isArray(data) || data.length === 0) return y;
   
     const title = opts.title ?? '';
     const xLabel = opts.xLabel ?? '';
     const yLabel = opts.yLabel ?? '';
     const padL = opts.padL ?? 18;
     const padR = opts.padR ?? 4;
     const padT = opts.padT ?? (title ? 10 : 8);
     const padB = opts.padB ?? 12;
     const showPts = opts.showPts ?? true;
     const pointLabels = opts.pointLabels ?? false;
     const labelEveryPt = opts.labelEveryPt ?? 1;
     const yTicksExplicit = Array.isArray(opts.yTicksExplicit) ? opts.yTicksExplicit : null;
     const yTickEvery = opts.yTickEvery ?? 1;
     const markExtrema = opts.markExtrema ?? true;
     const showMidrange = opts.showMidrange ?? true;
     const midrangeLabel = opts.midrangeLabel ?? 'Garis tengah (max–min)';
   
     const minVal = Math.min(...data);
     const maxVal = Math.max(...data);
   
     function niceNum(range, round) {
       const exp = Math.floor(Math.log10(range || 1));
       const f = (range || 1) / Math.pow(10, exp);
       let nf;
       if (round) { if (f < 1.5) nf = 1; else if (f < 3) nf = 2; else if (f < 7) nf = 5; else nf = 10; }
       else       { if (f <= 1) nf = 1; else if (f <= 2) nf = 2; else if (f <= 5) nf = 5; else nf = 10; }
       return nf * Math.pow(10, exp);
     }
   
     function niceScale(min, max, maxTicks) {
       const range = niceNum(max - min || 1, false);
       const d = niceNum(range / (maxTicks - 1), true);
       const graphMin = Math.floor(min / d) * d;
       const graphMax = Math.ceil(max / d) * d;
       return { min: graphMin, max: graphMax, step: d };
     }
   
     let yMin = (opts.yMin != null) ? opts.yMin : minVal;
     let yMax = (opts.yMax != null) ? opts.yMax : maxVal;
   
     if ((opts.yMin == null || opts.yMax == null) && !yTicksExplicit) {
       const n = niceScale(yMin, yMax, 6);
       if (opts.yMin == null) yMin = n.min;
       if (opts.yMax == null) yMax = n.max;
     }
     if (yMax === yMin) yMax = yMin + 1;
   
     const px0 = x + padL;
     const py0 = y + padT;
     const pw = Math.max(10, width - padL - padR);
     const ph = Math.max(10, height - padT - padB);
   
     if (title) {
       doc.setFontSize(7);
       doc.setFont(undefined, 'bold');
       doc.text(title, x + width / 2, y + 5, { align: 'center' });
       doc.setFont(undefined, 'normal');
     }
   
     doc.setDrawColor(180, 190, 200);
     doc.setLineWidth(0.2);
     doc.rect(px0, py0, pw, ph);
   
     doc.setFontSize(5);
     if (yTicksExplicit) {
       for (let i = 0; i < yTicksExplicit.length; i++) {
         const v = yTicksExplicit[i];
         if (v < yMin || v > yMax) continue;
         const ry = py0 + ph - ((v - yMin) / (yMax - yMin)) * ph;
         doc.setDrawColor(235, 238, 240);
         doc.line(px0, ry, px0 + pw, ry);
         if (i % yTickEvery === 0) {
           doc.setTextColor(60);
           doc.text(String(v), px0 - 1.5, ry + 1.5, { align: 'right' });
         }
       }
     } else {
       const ticks = 5;
       const step = (yMax - yMin) / ticks;
       for (let i = 0; i <= ticks; i++) {
         const v = yMin + i * step;
         const ry = py0 + ph - ((v - yMin) / (yMax - yMin)) * ph;
         doc.setDrawColor(235, 238, 240);
         doc.line(px0, ry, px0 + pw, ry);
         doc.setTextColor(60);
         const label = (Math.round(v * 10) / 10).toString();
         doc.text(label, px0 - 1.5, ry + 1.5, { align: 'right' });
       }
     }
   
     if (yLabel) {
       doc.setTextColor(40);
       doc.setFontSize(6);
       doc.text(yLabel, x + 2, py0 + ph / 2, { angle: 90 });
     }
   
     doc.setTextColor(60);
     doc.setFontSize(5.5);
     const maxXTicks = Math.min(18, data.length);
     const everyX = Math.max(1, Math.ceil(data.length / maxXTicks));
     for (let i = 0; i < data.length; i += everyX) {
       const rx = px0 + (i / (data.length - 1)) * pw;
       doc.text(String(i + 1), rx, py0 + ph + 4, { align: 'center' });
     }
   
     if (xLabel) {
       doc.setTextColor(40);
       doc.setFontSize(6);
       doc.text(xLabel, px0 + pw / 2, py0 + ph + 7, { align: 'center' });
     }
   
     const toPX = (idx) => px0 + (idx / (data.length - 1)) * pw;
     const toPY = (val) => py0 + ph - ((val - yMin) / (yMax - yMin)) * ph;
   
     doc.setDrawColor(231, 76, 60);
     doc.setLineWidth(0.5);
     for (let i = 0; i < data.length - 1; i++) {
       doc.line(toPX(i), toPY(data[i]), toPX(i + 1), toPY(data[i + 1]));
     }
   
     if (showPts) {
       doc.setFillColor(41, 128, 185);
       for (let i = 0; i < data.length; i++) {
         const cx = toPX(i), cy = toPY(data[i]);
         if (doc.circle) doc.circle(cx, cy, 0.7, 'F');
         else doc.rect(cx - 0.5, cy - 0.5, 1, 1, 'F');
       }
     }
   
     const idxMax = data.indexOf(maxVal);
     const idxMin = data.indexOf(minVal);
     const cxMax = toPX(idxMax), cyMax = toPY(maxVal);
     const cxMin = toPX(idxMin), cyMin = toPY(minVal);
   
     if (showMidrange) {
       const mid = (maxVal + minVal) / 2;
       const ryMid = toPY(mid);
       doc.setDrawColor(160, 160, 160);
       doc.setLineWidth(0.2);
       doc.line(px0, ryMid, px0 + pw, ryMid);
       doc.setFontSize(5.5);
       doc.setTextColor(80);
       doc.text(`${midrangeLabel}: ${mid.toFixed(1)}`, px0 + pw, ryMid - 1.2, { align: 'right' });
     }
   
     if (markExtrema) {
       doc.setFillColor(22, 163, 74);
       if (doc.circle) doc.circle(cxMax, cyMax, 1.3, 'F');
       else doc.rect(cxMax - 1, cyMax - 1, 2, 2, 'F');
       doc.setFontSize(6);
       doc.setTextColor(22, 163, 74);
       doc.text(`Puncak: ${maxVal} (kolom ${idxMax + 1})`, cxMax, cyMax - 2.2, { align: 'center' });
   
       doc.setFillColor(220, 38, 38);
       if (doc.circle) doc.circle(cxMin, cyMin, 1.3, 'F');
       else doc.rect(cxMin - 1, cyMin - 1, 2, 2, 'F');
       doc.setFontSize(6);
       doc.setTextColor(220, 38, 38);
       doc.text(`Terendah: ${minVal} (kolom ${idxMin + 1})`, cxMin, cyMin + 3.2, { align: 'center' });
   
       doc.setTextColor(30);
     }
   
     if (pointLabels) {
       doc.setFontSize(5);
       doc.setTextColor(30);
       for (let i = 0; i < data.length; i++) {
         if (i % labelEveryPt !== 0) continue;
         const cx = toPX(i), cy = toPY(data[i]);
         doc.text(String(data[i]), cx, cy - 1.4, { align: 'center' });
       }
     }
   
     if (opts.footerNote) {
       doc.setFontSize(5.5);
       doc.setTextColor(80);
       doc.text(opts.footerNote, px0 + 1, py0 - 1.5);
     }
   
     return y + height + 4;
   }
   
   console.log('[TEST-KRAEPLIN] ✓ Loaded');
