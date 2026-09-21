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
   RENDER TYPING TEST — dengan overlay persiapan
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

  // ============================================================
  // RENDER UI (dalam kondisi blur + timer BELUM jalan)
  // ============================================================
  document.getElementById('app').innerHTML = `
    <div class="ist-shell" id="typingShell">
      <div class="ist-panel">
        ${renderTestPageHeader({
          eyebrow: 'ADMINISTRATIVE TEST',
          title: 'Tes Mengetik',
          subtitle: 'Uji kecepatan dan akurasi mengetik Anda.',
          timeLabel: `<span id="typingTimer">${formatTypingTime(waktuTyping)}</span>`,
          onBack: 'confirmCancelTest()'
        })}

        <div class="ist-body">
          <div class="progress-container" style="height:10px;width:100%;background:#dde7f5;border-radius:10px;overflow:hidden;margin:6px 0 14px 0;">
            <div id="progressTypingBarInner" class="progress-bar" style="height:100%;width:0%;background:#31b729;transition:width .18s;"></div>
          </div>

          <div class="ist-instruction-card" style="background:#f5fafc;border-color:#b7dfff;">
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
            background:#ffffff;padding:14px 16px;border-radius:12px;margin:12px 0;
            font-size:1.06em;color:#234;border:1.4px solid #d9e9ff;line-height:1.7;">
            ${typingText.replace(/\n/g, '<br>')}
          </div>

          <textarea
            id="typingInput"
            placeholder="Ketik ulang teks di sini..."
            style="width:100%;min-height:130px;padding:14px 13px;font-size:1.06em;border-radius:12px;border:1.4px solid #b7dfff;outline:none;box-shadow:0 2px 11px #eaf3ff inset;font-family:inherit;box-sizing:border-box;"
            autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
            oncopy="return false" onpaste="return false" oncut="return false"
          ></textarea>

          <div id="typingLiveStats" style="margin:12px 0 0 0;font-size:1.02em;color:#155;">
            <b>Kata Benar:</b> 0 &nbsp;|&nbsp; <b>Kata Salah:</b> 0 &nbsp;|&nbsp;
            <b>Belum diketik:</b> ${expectedWordCount} &nbsp;|&nbsp;
            <b>Akurasi:</b> 0% &nbsp;|&nbsp; <b>WPM:</b> 0
          </div>

          <div class="ist-actions" style="margin-top:22px;">
            <button class="ist-btn-primary" id="btnTypingDone" type="button" style="background:linear-gradient(135deg,#16a34a,#059669);" disabled>
              Kirim Jawaban
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // ============================================================
  // OVERLAY PERSIAPAN
  // ============================================================
  const overlayId = 'typingStartOverlay';
  const existingOverlay = document.getElementById(overlayId);
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = overlayId;
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background:
      radial-gradient(circle at 20% 20%, rgba(99,102,241,.15), transparent 40%),
      radial-gradient(circle at 80% 80%, rgba(16,185,129,.15), transparent 45%),
      rgba(10,17,36,.85);
    backdrop-filter: blur(10px) saturate(1.1);
    -webkit-backdrop-filter: blur(10px) saturate(1.1);
    animation: typingOverlayFade .3s ease;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes typingOverlayFade {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes typingModalIn {
        from { opacity: 0; transform: translateY(20px) scale(.95); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes typingIconPulse {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.08); }
      }
      @keyframes typingBtnShine {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }
    </style>

    <div style="
      max-width: 520px;
      width: 100%;
      background: linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
      border-radius: 26px;
      overflow: hidden;
      box-shadow:
        0 40px 100px rgba(10,17,36,.45),
        0 15px 40px rgba(10,17,36,.28);
      animation: typingModalIn .36s cubic-bezier(.2,.8,.2,1);
      position: relative;
    ">
      <!-- Gold/Navy accent line -->
      <div style="
        height: 5px;
        background: linear-gradient(90deg, #0a1124, #1a2547 30%, #6366f1 50%, #1a2547 70%, #0a1124);
      "></div>

      <div style="padding: 40px 34px 34px; text-align: center;">

        <div style="
          width: 80px; height: 80px;
          margin: 0 auto 18px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #0a1124, #1a2547);
          border-radius: 24px;
          font-size: 38px;
          box-shadow:
            0 15px 32px rgba(10,17,36,.28),
            inset 0 1px 0 rgba(255,255,255,.1),
            0 0 0 1px rgba(99,102,241,.25);
          animation: typingIconPulse 2s ease-in-out infinite;
        ">⌨️</div>

        <h2 style="
          margin: 0 0 12px;
          font-size: 1.6rem;
          font-weight: 850;
          color: #0a1124;
          letter-spacing: -.03em;
          line-height: 1.2;
        ">Siap Mulai Mengetik?</h2>

        <p style="
          margin: 0 0 22px;
          color: #64748b;
          font-size: 0.98rem;
          line-height: 1.65;
        ">
          Waktu <b style="color:#0a1124;">2 menit</b> akan mulai berjalan <b>setelah</b> Anda menekan tombol.<br>
          Kursor akan otomatis aktif di kotak ketik.
        </p>

        <div style="
          padding: 14px 16px;
          background: linear-gradient(135deg, #eff6ff, #f0f9ff);
          border: 1px solid #dbeafe;
          border-radius: 14px;
          text-align: left;
          font-size: 0.86rem;
          color: #1e40af;
          line-height: 1.7;
          margin-bottom: 22px;
        ">
          <div style="font-weight: 800; margin-bottom: 6px; font-size: 0.92rem; color: #1e3a8a;">
            💡 Tips sebelum mulai
          </div>
          • Siapkan posisi jari di keyboard<br>
          • Pastikan tidak ada gangguan di sekitar<br>
          • Fokus ke kotak ketik — kursor sudah otomatis di sana<br>
          • Tekan <b>Enter</b> untuk mulai lebih cepat
        </div>

        <button id="btnTypingStart" style="
          position: relative;
          width: 100%;
          padding: 17px 24px;
          background: linear-gradient(135deg, #6366f1, #4338ca 60%, #3730a3);
          color: #fff;
          border: 0;
          border-radius: 14px;
          font-family: inherit;
          font-size: 1.05rem;
          font-weight: 800;
          letter-spacing: 0.01em;
          cursor: pointer;
          overflow: hidden;
          box-shadow:
            0 14px 34px rgba(99,102,241,.32),
            inset 0 1px 0 rgba(255,255,255,.15),
            0 0 0 1px rgba(99,102,241,.15);
          transition: all .2s ease;
        "
        onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 20px 44px rgba(99,102,241,.42), inset 0 1px 0 rgba(255,255,255,.18)';"
        onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 14px 34px rgba(99,102,241,.32), inset 0 1px 0 rgba(255,255,255,.15)';">
          🚀 Mulai Mengetik Sekarang
        </button>

        <div style="
          margin-top: 16px;
          font-size: 0.78rem;
          color: #94a3b8;
          line-height: 1.5;
        ">
          Tombol <b style="color:#475569;">Enter</b> di keyboard juga bisa untuk memulai
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // ============================================================
  // MULAI TEST — timer jalan, fokus input
  // ============================================================
  let started = false;
  let __typingStatsTick;

  function mulaiTypingTest() {
    if (started) return;
    started = true;

    // Hapus overlay
    overlay.remove();
    document.removeEventListener('keydown', handleEnterStart);

    // ==========================================
    // Aktifkan input & tombol kirim
    // ==========================================
    const inputEl = document.getElementById('typingInput');
    const btnDone = document.getElementById('btnTypingDone');

    if (btnDone) btnDone.disabled = false;

    if (inputEl) {
      inputEl.readOnly = false;
      inputEl.disabled = false;
      setTimeout(() => {
        try { inputEl.focus({ preventScroll: false }); } catch (e) { inputEl.focus(); }
        // Fokus ulang setelah delay singkat untuk device tertentu
        setTimeout(() => {
          try { inputEl.focus(); } catch (e) {}
        }, 150);
      }, 100);
    }

    // ==========================================
    // Mulai timer
    // ==========================================
    appState.typingStart = Date.now();
    if (appState.typingTimer) clearInterval(appState.typingTimer);

    appState.typingTimer = setInterval(() => {
      appState.timeLeft--;
      const el = document.getElementById('typingTimer');
      if (el) el.textContent = formatTypingTime(appState.timeLeft);
      if (appState.timeLeft <= 0) endTypingTest(true);
    }, 1000);

    // ==========================================
    // Attach stats listener
    // ==========================================
    if (inputEl) {
      inputEl.addEventListener('input', () => {
        clearTimeout(__typingStatsTick);
        __typingStatsTick = setTimeout(updateTypingStats, 60);
      });

      ['copy', 'paste', 'cut'].forEach(ev =>
        inputEl.addEventListener(ev, e => e.preventDefault())
      );
    }

    if (btnDone) btnDone.onclick = () => endTypingTest(false);

    // ==========================================
    // Live stats function
    // ==========================================
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

    console.log('[TYPING] ▶ Test dimulai — timer jalan, input fokus');
  }

  // ============================================================
  // Handler tombol & Enter
  // ============================================================
  const startBtn = document.getElementById('btnTypingStart');
  if (startBtn) startBtn.onclick = mulaiTypingTest;

  function handleEnterStart(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      mulaiTypingTest();
    }
  }
  document.addEventListener('keydown', handleEnterStart);

  console.log('[TYPING] Overlay persiapan muncul — menunggu klik Mulai');
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
    <div class="ist-shell">
      <div class="ist-panel">
        ${renderTestPageHeader({
          eyebrow: 'ADMINISTRATIVE TEST',
          title: 'Tes Mengetik Selesai',
          subtitle: 'Jawaban Anda telah tersimpan.',
          showBack: false
        })}

        <div class="ist-body">
          <div class="ist-instruction-card" style="text-align:center;padding:32px 22px;">
            <div style="font-size:4rem;line-height:1;margin-bottom:16px;">🎉</div>
            <div style="font-size:1.15rem;font-weight:800;color:#172033;margin-bottom:10px;">Terima kasih!</div>
            <div style="max-width:650px;margin:0 auto;color:#667085;line-height:1.7;">
              Jawaban Anda untuk Tes <b>Mengetik</b> telah tersimpan.
              Silakan lanjut mengerjakan tes lain yang Anda pilih.
              Tombol <b>Download PDF</b> akan aktif kembali setelah <b>semua</b> tes pilihan selesai dikerjakan.
            </div>
          </div>

          <div class="ist-actions">
            <button class="ist-btn-primary" id="btnContinueTyping" type="button">✅ Lanjut Tes Berikutnya</button>
          </div>
        </div>
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
