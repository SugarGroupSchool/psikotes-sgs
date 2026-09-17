/* =========================================================
   TYPING TEST — Full Logic
   ========================================================= */

   function __normalizeWS(s) {
    return String(s).replace(/\s+/g, ' ').trim();
  }
  
  function fairAlignCounts(expectedRaw, inputRaw, { whitespace = 'collapse' } = {}) {
    const eStr = whitespace === 'collapse' ? __normalizeWS(expectedRaw) : String(expectedRaw).trim();
    const iStr = whitespace === 'collapse' ? __normalizeWS(inputRaw) : String(inputRaw).trim();
    const E = eStr ? eStr.split(' ').filter(Boolean) : [];
    const I = iStr ? iStr.split(' ').filter(Boolean) : [];
    const n = E.length, m = I.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 0; i <= n; i++) dp[i][0] = i;
    for (let j = 0; j <= m; j++) dp[0][j] = j;
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const cost = (E[i - 1] === I[j - 1]) ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    let i = n, j = m;
    let matches = 0, substitutions = 0, insertions = 0, deletions = 0;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + ((E[i - 1] === I[j - 1]) ? 0 : 1)) {
        if (E[i - 1] === I[j - 1]) matches++; else substitutions++;
        i--; j--;
      } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) { deletions++; i--; }
      else { insertions++; j--; }
    }
    return { matches, substitutions, insertions, deletions, expectedLen: n, inputLen: m };
  }
  
  function formatTypingTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
  
  /* ============================================================
     RENDER TYPING TEST
     ============================================================ */
  function renderTypingTest() {
    window.__inTestView = true;
    appState.currentTest = 'TYPING';
  
    const typingText = `Sugar Group Schools merupakan institusi pendidikan yang berada di bawah naungan perusahaan agribisnis terintegrasi, tersebar di tiga perusahaan gula terbesar di Indonesia. Sekolah ini didirikan dengan tujuan utama untuk mendukung proses pendidikan dan pengembangan generasi bangsa melalui sistem pembelajaran yang berkualitas dan relevan dengan kebutuhan zaman. Dengan komitmen untuk menciptakan lingkungan belajar yang kondusif dan inovatif, kami berupaya menjadi pelopor dalam menghasilkan lulusan berkualitas tinggi yang tidak hanya berjiwa profesional, tetapi juga mampu menguasai teknologi modern dan siap bersaing di era globalisasi.`;
  
    const waktuTyping = 120;
  
    appState.typingText = typingText;
    appState.timeLeft = waktuTyping;
    appState.typingStart = Date.now();
    appState.typingEnded = false;
  
    const expectedWordCount = __normalizeWS(typingText).split(' ').filter(Boolean).length;
  
    document.getElementById('app').innerHTML = `
      <div class="card" style="
        max-width:920px;margin:34px auto;padding:26px 24px 28px 24px;border-radius:22px;
        background:linear-gradient(135deg,#f5faff 88%,#e5f3ff 100%);
        box-shadow:0 10px 36px #c9eaff33,0 1.5px 6px #fff9;border:1.7px solid #bfe3fc;">
  
<div style="position:relative;margin-bottom:10px;">
  <!-- ⏱ Timer absolute di kanan atas -->
  <div class="timer-container" style="position:absolute;top:0;right:0;text-align:right;z-index:2;">
    <span class="timer-icon" style="margin-right:6px;">⏱️</span>
    <span class="timer" id="typingTimer" style="font-weight:800;font-size:1.07em;">${formatTypingTime(waktuTyping)}</span>
  </div>

  <!-- 🏷 Logo + Judul di tengah -->
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;padding:6px 80px 0;">
    ${renderTestLogoBadge()}
    <h2 style="margin:0;font-weight:900;color:#1662a5;letter-spacing:.2px;text-shadow:0 1.5px 10px #e1efff99;font-size:1.35em;">
      Tes Mengetik (Typing Test)
    </h2>
  </div>
</div>
  
        <div class="progress-container" style="height:10px;width:100%;background:#dde7f5;border-radius:10px;overflow:hidden;margin:6px 0 14px 0;">
          <div id="progressTypingBarInner" class="progress-bar" style="height:100%;width:0%;background:#31b729;transition:width .18s;"></div>
        </div>
  
        <div style="margin:8px 0 14px 0;padding:13px 15px;background:#f5fafc;border-radius:12px;border:1.6px solid #b7dfff;">
          <b>Instruksi:</b>
          <ul style="margin:10px 0 0 18px;line-height:1.7;color:#155;">
            <li>Ketik ulang teks di bawah <b>tanpa menyalin</b> (copy/paste dinonaktifkan).</li>
            <li><b>Penilaian per kata</b> (spasi jadi pemisah). Kata harus sama persis (huruf besar/kecil & tanda baca).</li>
            <li>Perbedaan jumlah spasi tidak memengaruhi penilaian, karena dibandingkan per kata.</li>
            <li>Waktu: <b>${Math.floor(waktuTyping / 60)} menit</b>.</li>
          </ul>
        </div>
  
        <div id="typingText" style="
          user-select:none;pointer-events:none;filter: blur(.4px);
          background:#ffffff;padding:14px 16px;border-radius:12px;margin-bottom:12px;
          font-size:1.06em;color:#234;border:1.4px solid #d9e9ff;">
          ${typingText.replace(/\n/g, '<br>')}
        </div>
  
        <textarea
          id="typingInput"
          placeholder="Ketik ulang teks di sini..."
          style="width:100%;min-height:130px;padding:14px 13px;font-size:1.06em;border-radius:12px;border:1.4px solid #b7dfff;outline:none;box-shadow:0 2px 11px #eaf3ff inset;"
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
          oncopy="return false" onpaste="return false" oncut="return false"
        ></textarea>
  
        <div id="typingLiveStats" style="margin:12px 0 0 0;font-size:1.02em;color:#155;">
          <b>Kata Benar:</b> 0 &nbsp;|&nbsp; <b>Kata Salah:</b> 0 &nbsp;|&nbsp;
          <b>Belum diketik:</b> ${expectedWordCount} &nbsp;|&nbsp;
          <b>Akurasi:</b> 0% &nbsp;|&nbsp; <b>WPM:</b> 0
        </div>
  
        <div style="margin-top:22px;text-align:center;">
          <button class="btn" id="btnTypingDone" style="
            padding:12px 28px;font-weight:800;border-radius:11px;background:#18a35d;color:#fff;border:0;
            box-shadow:0 4px 18px #bff1d7;">Kirim Jawaban</button>
          <button class="btn btn-outline" onclick="confirmCancelTest()" style="margin-left:8px;">Batalkan Tes</button>
        </div>
      </div>
    `;
  
    if (appState.typingTimer) clearInterval(appState.typingTimer);
    appState.typingTimer = setInterval(() => {
      appState.timeLeft--;
      const el = document.getElementById('typingTimer');
      if (el) el.textContent = formatTypingTime(appState.timeLeft);
      if (appState.timeLeft <= 0) endTypingTest(true);
    }, 1000);
  
    const inputEl = document.getElementById('typingInput');
    let __typingStatsTick;
    inputEl.addEventListener('input', () => {
      clearTimeout(__typingStatsTick);
      __typingStatsTick = setTimeout(updateTypingStats, 60);
    });
  
    ['copy', 'paste', 'cut'].forEach(ev => inputEl.addEventListener(ev, e => e.preventDefault()));
  
    document.getElementById('btnTypingDone').onclick = () => endTypingTest(false);
  
    function updateTypingStats() {
      const inputRaw = inputEl.value;
      const expectedRaw = typingText;
  
      const { matches, substitutions, insertions, deletions, expectedLen, inputLen } =
        fairAlignCounts(expectedRaw, inputRaw, { whitespace: 'collapse' });
  
      const benar = matches;
      const salah = substitutions + insertions;
      const belum = deletions;
  
      const akurasi = expectedLen ? (benar / expectedLen * 100) : 0;
      const menit = Math.max((waktuTyping - appState.timeLeft) / 60, 1e-6);
      const wpm = Math.round(inputLen / menit);
      const progress = Math.min(100, (inputLen / Math.max(expectedLen, 1)) * 100);
  
      const bar = document.getElementById('progressTypingBarInner');
      if (bar) bar.style.width = `${progress}%`;
  
      const stats = document.getElementById('typingLiveStats');
      if (stats) {
        stats.innerHTML =
          `<b>Kata Benar:</b> ${benar} &nbsp;|&nbsp; ` +
          `<b>Kata Salah:</b> ${salah} &nbsp;|&nbsp; ` +
          `<b>Belum diketik:</b> ${belum} &nbsp;|&nbsp; ` +
          `<b>Akurasi:</b> ${akurasi.toFixed(1)}% &nbsp;|&nbsp; ` +
          `<b>WPM:</b> ${isFinite(wpm) && wpm >= 0 ? wpm : 0}`;
      }
    }
  }
  
  /* ============================================================
     END TYPING TEST
     ============================================================ */
  function endTypingTest(timeIsUp = false) {
    if (appState.typingEnded) return;
    appState.typingEnded = true;
  
    if (appState.typingTimer) clearInterval(appState.typingTimer);
  
    const userInput = (document.getElementById('typingInput')?.value || '');
    const kunci = appState.typingText || '';
  
    const { matches, substitutions, insertions, deletions, expectedLen, inputLen } =
      fairAlignCounts(kunci, userInput, { whitespace: 'collapse' });
  
    const benar = matches;
    const salah = substitutions + insertions;
    const belum = deletions;
  
    const durasiDipakai = 120 - (appState.timeLeft || 0);
    const menit = Math.max(durasiDipakai / 60, 1e-6);
    const wpm = Math.round(inputLen / menit);
    const akurasi = expectedLen ? (benar / expectedLen * 100).toFixed(1) : '0.0';
  
    appState.answers = appState.answers || {};
    appState.answers.TYPING = {
      text: userInput,
      wpm,
      accuracy: akurasi,
      benar, salah, belum,
      total: expectedLen,
      waktu: durasiDipakai,
      waktuSisa: Math.max(appState.timeLeft || 0, 0),
      status: timeIsUp ? 'Waktu habis' : 'Selesai'
    };
  
    appState.completed = appState.completed || {};
    appState.completed.TYPING = true;
    try {
      const saved = JSON.parse(localStorage.getItem('completed') || '{}');
      saved.TYPING = true;
      localStorage.setItem('completed', JSON.stringify(saved));
    } catch {}
    if (typeof window.updateDownloadButtonState === 'function') {
      window.updateDownloadButtonState();
    }
  
    renderTypingThankYou();
  }
  
  /* ============================================================
     THANK YOU
     ============================================================ */
  function renderTypingThankYou() {
     window.__inTestView = false;
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="card" style="
        max-width:820px;margin:34px auto;padding:32px 28px;border-radius:22px;
        background:linear-gradient(135deg,#f5fff8 86%,#e8fff1 100%);
        box-shadow:0 10px 34px #c7f4da55;border:1.6px solid #c8f1d6;text-align:center;">
        <div style="display:flex;justify-content:center;margin-bottom:14px;">
          <div class="test-logo-badge" style="width:74px;height:74px;border-radius:22px;box-shadow:0 12px 28px rgba(91,92,240,.14);">
            <img
              src="${(typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO) ? APP_CONFIG.LOGO : 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png'}"
              alt="Sugar Group Schools"
              style="width:100%;height:100%;object-fit:contain;padding:6px;"
              onerror="this.style.display='none';this.parentElement.innerHTML='<div class=&quot;test-logo-badge__fallback&quot;>SGS</div>';"
            >
          </div>
        </div>
        <h2 style="margin:6px 0 8px 0;font-weight:900;color:#13693a;">
          Terima kasih! Tes Mengetik sudah selesai
        </h2>
        <p style="font-size:1.08rem;color:#244;max-width:680px;margin:0 auto 16px auto;line-height:1.6;">
          Jawaban Anda untuk Tes <b>Mengetik</b> telah tersimpan. Silakan lanjut mengerjakan tes lain yang Anda pilih.
          Tombol <b>Download PDF</b> akan aktif kembali setelah <b>semua</b> tes pilihan selesai dikerjakan.
        </p>
  
        <div style="display:flex;gap:12px;justify-content:center;margin-top:12px;flex-wrap:wrap;">
          <button id="btnContinueTyping" class="btn" style="
            padding:12px 24px;font-weight:800;border-radius:11px;
            background:#18a35d;color:#fff;border:0;box-shadow:0 4px 18px #bff1d7;">
            ✅ Lanjut Tes Berikutnya
          </button>
        </div>
      </div>
    `;
  
    const goNext = () => {
      window.__inTestView = false;
      if (typeof window.renderHome === 'function') window.renderHome();
      setTimeout(() => {
        const el = document.getElementById('homeCard') || document.getElementById('downloadPDFBox');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    };
    document.getElementById('btnContinueTyping').onclick = goNext;
  }
  
  console.log('[TEST-TYPING] ✓ Loaded — 5 fungsi');
