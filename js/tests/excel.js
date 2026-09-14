/* =========================================================
   EXCEL / GOOGLE SHEET TEST — Full Logic
   ========================================================= */

   function ensureExamStyles() {
    // CSS sudah dimuat via <link>
  }
  
  /* =========================================================
     THANK YOU
     ========================================================= */
  function renderExcelThankYou() {
     window.__inTestView = false;
    ensureExamStyles();
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="thank-card">
        <div style="font-size:3rem;line-height:1;margin-bottom:10px;">🎉</div>
        <h2 style="margin:6px 0 8px 0;font-weight:900;color:#13693a;">
          Terima kasih! Tes Excel sudah selesai
        </h2>
        <p style="font-size:1.08rem;color:#244;max-width:680px;margin:0 auto 16px auto;line-height:1.6;">
          Link Google Sheet Anda telah tersimpan. Silakan lanjut mengerjakan tes lain yang Anda pilih.
          Tombol <b>Download PDF</b> akan aktif kembali setelah <b>seluruh</b> tes pilihan selesai.
        </p>
  
        <div style="display:flex;gap:12px;justify-content:center;margin-top:12px;flex-wrap:wrap;">
          <button id="btnContinueExcel" class="btn green">✅ Lanjut Tes Berikutnya</button>
        </div>
      </div>
    `;
  
    document.getElementById('btnContinueExcel').onclick = () => {
      window.appState = window.appState || {};
      appState.completed = appState.completed || {};
      appState.completed.EXCEL = true;
  
      if (typeof window.markTestCompleted === 'function') {
        markTestCompleted('EXCEL');
      }
      if (typeof window.updateDownloadButtonState === 'function') {
        window.updateDownloadButtonState();
      }
      if (typeof window.renderHome === 'function') {
        window.__inTestView = false;
        window.renderHome();
        setTimeout(() => {
          const el = document.getElementById('homeCard') || document.getElementById('downloadPDFBox');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    };
  }
  
  /* =========================================================
     TES EXCEL (Google Sheet)
     ========================================================= */
  function renderAdminExcelSheet() {
    ensureExamStyles();
    window.__inTestView = true;
    appState.currentTest = 'EXCEL';
  
    let timeLeft = 40 * 60;      // 40 menit
    let timerInterval;
    let sudahStart = false;
    let ttsPlayed10M = false;
  
    window.appState = window.appState || {};
    appState.adminAnswers = appState.adminAnswers || {};
  
    const timerStr = Math.floor(timeLeft / 60).toString().padStart(2, '0') + ':00';
  
    document.getElementById('app').innerHTML = `
      <div class="card exam">
        <div class="header"><h2>📊 Tes Admin: Excel (Google Sheet)</h2></div>
  
        <div class="warn-box" style="margin-bottom:14px;">
          <b>Instruksi:</b>
          <ul style="margin:10px 18px 0 18px;line-height:1.7;">
            <li>Klik tombol di bawah untuk mendapatkan Google Sheet soal ujian Anda (<b>salin ke Google Drive Anda</b>).</li>
            <li>Kerjakan langsung di Google Sheet tersebut.</li>
            <li><b>PENTING!</b> Setelah selesai, <b>bagikan link Sheet Anda</b> ke panitia dengan akses
              <span style="color:#0277bd;font-weight:600;">“Siapa saja yang memiliki link”</span> dan
              <span style="color:#388e3c;font-weight:600;">Editor</span>.
            </li>
          </ul>
          <div style="margin-top:10px;">
            <span class="timer-chip">⏱️ <span id="timer">${timerStr}</span></span>
          </div>
        </div>
  
        <div class="info-box" style="text-align:center;max-width:640px;margin:0 auto 12px auto;">
          <div style="font-weight:700;color:#155;margin-bottom:6px;">Panduan Membagikan Google Sheet:</div>
          <ol style="text-align:left;display:inline-block;margin:8px auto 10px auto;padding-left:21px;line-height:1.63;">
            <li>Klik <b>Bagikan</b> (Share) di kanan atas Sheet.</li>
            <li>Pada bagian <b>Akses umum</b> (General Access), pilih: <span style="color:#0277bd;font-weight:600;">“Siapa saja yang memiliki link”</span></li>
            <li>Pilih peran <span style="color:#388e3c;font-weight:600;">Editor</span></li>
            <li>Klik <b>Salin link</b>, lalu tempel di kolom jawaban di bawah.</li>
          </ol>
          <div style="text-align:center;">
            <img src="https://github.com/Pragas123/assets/blob/d4a1edf59e14946adf9799e377ad1212ef8abbc9/TES%20EXCEL.jpg?raw=true"
                 alt="Panduan Share Google Sheet"
                 style="display:inline-block;max-width:96%;border-radius:12px;border:1.6px solid #90caf9;box-shadow:0 2px 10px #a4cdf850;margin:9px auto 5px auto;">
          </div>
  
          <div style="margin:10px auto 5px auto;font-size:1em;color:#f57c00;">
            <b>Catatan:</b> Pastikan akses “Siapa saja yang memiliki link” & Editor sudah aktif sebelum mengumpulkan link!
          </div>
        </div>
  
        <div style="text-align:center; margin:22px 0 12px 0;">
          <a href="https://docs.google.com/spreadsheets/d/1RKykKAHOn-kXfOFrDLD2UkOQ6YlpoFAgv06ETvnRU_g/copy"
             target="_blank" rel="noopener" id="startSheetBtn">
            <button class="btn green" style="font-size:1.06rem;padding:12px 22px;">
              📋 Dapatkan Google Sheet Ujian Anda
            </button>
          </a>
        </div>
  
        <div style="max-width:560px;margin:0 auto;">
          <div style="margin-bottom:8px;font-weight:700;">Kumpulkan Link Google Sheet Anda:</div>
          <input type="url" id="sheetLinkInput" class="input" placeholder="Tempelkan link Google Sheet Anda di sini" autocomplete="off"/>
          <div id="sheetLinkMsg" class="hint" style="margin-top:8px;"></div>
        </div>
  
        <div id="waktuHabisMsg" class="hint bad" style="margin-top:22px;text-align:center;"></div>
  
        <div style="margin-top:22px;text-align:center;">
          <button class="btn" id="btnExcelDone" style="font-size:1.06rem;">Selesai</button>
        </div>
      </div>
    `;
  
    function updateTimer() {
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        const t = document.getElementById('timer');
        if (t) t.textContent = "00:00";
        const w = document.getElementById('waktuHabisMsg');
        if (w) w.textContent = "Waktu sudah habis.";
        return;
      }
      const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const s = (timeLeft % 60).toString().padStart(2, '0');
      const t = document.getElementById('timer');
      if (t) t.textContent = `${m}:${s}`;
  
      if (timeLeft === 600 && !ttsPlayed10M) {
        playTTS10Menit();
        ttsPlayed10M = true;
      }
      timeLeft--;
    }
  
    function playTTS10Menit() {
      try {
        const audio = new Audio('https://cdn.jsdelivr.net/gh/Pragas123/assets@main/10%20minute.mp3');
        audio.volume = 1;
        audio.play().catch(() => {});
      } catch {}
    }
  
    document.getElementById('startSheetBtn').addEventListener('click', function () {
      if (!sudahStart) {
        sudahStart = true;
        timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
        setTimeout(() => {
          this.style.pointerEvents = 'none';
          const btn = this.querySelector('button');
          if (btn) {
            btn.disabled = true;
            btn.innerHTML = "📝 Ujian Berlangsung";
          }
        }, 350);
      }
    });
  
    document.getElementById('sheetLinkInput').addEventListener('input', function (e) {
      const link = e.target.value.trim();
      const msg = document.getElementById('sheetLinkMsg');
      if (link.startsWith("https://docs.google.com/spreadsheets/")) {
        appState.adminAnswers.EXCEL = { link };
        if (msg) {
          msg.textContent = "✅ Link tersimpan. Pastikan akses sudah “Siapa saja yang memiliki link, Editor”.";
          msg.classList.remove('bad');
        }
      } else if (link.length > 6) {
        if (msg) {
          msg.textContent = "Link tidak valid. Pastikan itu link Google Sheet.";
          msg.classList.add('bad');
        }
      } else {
        if (msg) {
          msg.textContent = "";
          msg.classList.remove('bad');
        }
      }
    });
  
    document.getElementById('btnExcelDone').onclick = function () {
      clearInterval(timerInterval);
      appState.completed = appState.completed || {};
      appState.completed.EXCEL = true;
  
      if (typeof window.updateDownloadButtonState === 'function') {
        window.updateDownloadButtonState();
      }
      renderExcelThankYou();
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 150);
    };
  }
  
  console.log('[TEST-EXCEL] ✓ Loaded — 3 fungsi');
