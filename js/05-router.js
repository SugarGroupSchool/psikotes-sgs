/* ============================================================
   js/05-router.js
   - Routing antar halaman: pilih tes, home, instruksi, startTest
   - Guard pintar untuk __inTestView (anti stuck)
   - Resume state: cek progress tersimpan → tampilkan modal
   ============================================================ */

/* ============================================================
   PILIH TES
   ============================================================ */
function renderTestSelection() {
  if (appState.selectedTests && appState.selectedTests.length > 0) {
    renderHome();
    return;
  }

  const categories = [
    {
      title: 'Psikotes',
      tests: [
        { id: 'IST',      label: 'KECERDASAN 🧠' },
        { id: 'KRAEPLIN', label: 'KORAN 🧮' },
        { id: 'DISC',     label: 'KEPEMIMPINAN 👤' },
        { id: 'PAPI',     label: 'SIKAP KERJA 📊' },
        { id: 'BIGFIVE',  label: 'KEPRIBADIAN 📝' },
        { id: 'GRAFIS',   label: 'GAMBAR 🎨' }
      ]
    },
    {
      title: 'Tes Kemampuan',
      tests: [
        { id: 'EXCEL',   label: 'EXCEL 📑' },
        { id: 'TYPING',  label: 'MENGETIK ⌨️' },
        { id: 'SUBJECT', label: 'SUBJEK 📚' }
      ]
    }
  ];

  document.getElementById('app').innerHTML = `
    <div class="card tes-selection-main"
      style="max-width:940px;margin:44px auto 0 auto;padding:40px 38px 36px 38px;border-radius:25px;box-shadow:0 10px 38px #b6ccff35;background:linear-gradient(120deg,#f8fcff 87%,#ecf6fd 100%);border:1.5px solid #c7dbfc;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png"
          alt="Logo"
          style="max-width:120px;box-shadow:0 4px 18px #c2e3fc40;border-radius:18px;">
      </div>
      <h2 style="text-align:center;margin-bottom:34px;font-weight:900;font-size:2rem;letter-spacing:.5px;color:#195d90;text-shadow:0 1px 8px #b0e3ff70;">
        Pilih Tes yang akan Dikerjakan
      </h2>
      <form id="testSelectionForm" style="padding:2px 0 0 0;">
        ${categories.map(cat => `
          <div style="margin-bottom:38px;">
            <div style="font-weight:800;font-size:1.19rem;color:#2674d6;margin-bottom:13px;letter-spacing:0.4px;">
              <span style="border-bottom:2.4px solid #d4e7fd;padding-bottom:2px;">${cat.title}</span>
            </div>
            <div class="test-selection" style="margin-top:5px;">
              ${cat.tests.map(test => `
                <label class="test-select-card">
                  <input type="checkbox" name="selectedTests" value="${test.id}">
                  <span class="test-checkbox"></span>
                  <span class="test-label-text">${test.label}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
        <div style="text-align:center;margin-top:30px;">
          <button class="btn" type="submit"
            style="padding:14px 38px;font-weight:800;font-size:1.18rem;letter-spacing:0.3px;border-radius:12px;background:#22a558;box-shadow:0 3px 18px #c9f5dd90,0 0 8px #b3eed4a0;border:0;color:#fff;transition:background 0.18s;">
            ✔️ Lanjutkan ke Tes
          </button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('testSelectionForm').onsubmit = function (e) {
    e.preventDefault();
    const selected = Array.from(
      document.querySelectorAll('input[name="selectedTests"]:checked')
    ).map(el => el.value);

    if (selected.length === 0) {
      alert('Pilih setidaknya satu tes!');
      return;
    }

    appState.selectedTests = selected;
    localStorage.setItem('selectedTests', JSON.stringify(selected));

    appState.completed = appState.completed || {};
    selected.forEach(id => { appState.completed[id] = false; });

    appState.showTestCards = false;
    renderHome();
  };
}

/* ============================================================
   HOME
   ============================================================ */
function renderHome() {
  /* Guard pintar: cek UI tes di DOM, bukan hanya flag */
  const inTestUI = document.querySelector(
    '.kraeplin-card, .ist-shell, .ist-question-panel, ' +
    '.card.exam, .grafis-page, .subject-test-page'
  );

  if (window.__inTestView === true && inTestUI) {
    console.warn('[ROUTER] renderHome() diabaikan — sedang di dalam tes');
    return;
  }

  if (window.__inTestView === true && !inTestUI) {
    console.warn('[ROUTER] __inTestView di-reset (flag basi tanpa UI tes)');
    window.__inTestView = false;
  }

  /* ============================================================
     🆕 RESUME CHECK — tampilkan modal kalau ada progress tersimpan
     🔒 I7 FIX: Cek hanya 1× per sesi (hemat request Firebase)
     ============================================================ */
  const __resumeCheckedThisSession = sessionStorage.getItem('__resumeChecked') === '1';

  if (typeof window.__resumeCheck === 'function'
      && !window.__resumeModalShown
      && !__resumeCheckedThisSession) {
    try { sessionStorage.setItem('__resumeChecked', '1'); } catch (e) {}
    window.__resumeCheck().then(function(data) {
      if (data && !window.__resumeModalShown) {
        window.__resumeModalShown = true;
        showResumeModal(data, function onResume() {
          window.__resumeModalShown = false;
          const ok = window.__resumeToTest(data);
          if (!ok) {
            alert('Tidak bisa melanjutkan tes ini. Memulai ulang dari awal.');
            window.__resumeClear();
            renderHome();
          }
        }, function onRestart() {
          window.__resumeModalShown = false;
          window.__resumeClear();
          renderHome();
        });
      }
    }).catch(function() {});
  }
   
  setTimeout(function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 20);

  window.appState = window.appState || {};
  appState.completed = appState.completed || {};
  appState.selectedTests = appState.selectedTests ||
    JSON.parse(localStorage.getItem('selectedTests') || '[]');

  // ✅ Login pakai password USED → skip instruksi, langsung ke test cards
  try {
    const isUsedMode = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USED_PRAGAS) === '1';
    if (isUsedMode) {
      appState.showTestCards = true;
      console.log('[ROUTER] ✅ Login USED → skip instruksi, langsung test cards');
    }
  } catch (e) {}

  const nickname = appState.identity && appState.identity.nickname
    ? appState.identity.nickname
    : "Peserta";
  const selectedTests = appState.selectedTests;

  let greetingHTML = '';
  if (!appState.showTestCards) {
    greetingHTML = `
      <div class="personal-greeting" style="margin:26px auto 28px;padding:25px 24px 22px;max-width:500px;background:linear-gradient(135deg,#ffffff 0%,#f7fbff 72%,#eef7ff 100%);border:1px solid #dceaf7;border-radius:18px;box-shadow:0 8px 28px rgba(48,105,160,.10);text-align:center;color:#263746;">
        <div style="font-size:2.05rem;line-height:1;margin-bottom:10px;">👋</div>
        <b style="display:block;font-size:1.16rem;font-weight:800;color:#174f7d;">Halo, ${nickname}!</b>
        <div style="margin-top:9px;font-size:1rem;line-height:1.58;color:#526575;">
          Silakan baca dan dengarkan <span style="color:#1475bd;font-weight:700;">instruksi tes</span> terlebih dahulu.<br>
          <span style="display:inline-block;margin-top:4px;color:#267348;font-size:.96rem;">Klik tombol di bawah sebelum mulai mengerjakan.</span>
        </div>
        <div style="margin-top:18px;">
          <button class="btn blink" id="btnShowInstruksi" type="button"
            style="padding:12px 30px;font-size:1rem;font-weight:800;border:2px solid #f0c900;background:linear-gradient(135deg,#fffef0,#fff4b8);color:#202a33;box-shadow:0 5px 16px rgba(230,193,0,.22);border-radius:10px;cursor:pointer;">
            📢 Lihat &amp; Pahami Instruksi
          </button>
        </div>
      </div>
    `;
  } else {
    greetingHTML = `
      <div class="personal-greeting" style="margin:26px auto 28px;padding:20px 24px 18px;max-width:500px;background:linear-gradient(135deg,#ffffff 0%,#f7fbff 72%,#eef7ff 100%);border:1px solid #dceaf7;border-radius:18px;box-shadow:0 7px 24px rgba(48,105,160,.08);text-align:center;color:#263746;">
        <div style="font-size:1.9rem;line-height:1;margin-bottom:9px;">👋</div>
        <b style="display:block;font-size:1.12rem;font-weight:800;color:#174f7d;">Halo, ${nickname}!</b>
        <div style="margin-top:8px;font-size:.98rem;line-height:1.55;color:#526575;">
          Instruksi sudah selesai.<br>
          Silakan mulai mengerjakan tes yang telah dipilih.<br>
          <span style="display:inline-block;margin-top:3px;color:#27843b;font-size:.94rem;">Semoga lancar!</span>
        </div>
      </div>
    `;
  }

  let html = `
    <div class="card" id="homeCard" style="max-width:900px;margin:30px auto 0;padding:0 0 34px;border-radius:24px;background:linear-gradient(135deg,#f8fcff 0%,#f3f9fd 78%,#eaf6ff 100%);box-shadow:0 12px 38px rgba(52,119,170,.10);border:1px solid #cfe5f5;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:17px;padding:30px 32px 2px;">
        <img src="https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png"
          alt="Logo Psikotes"
          style="width:62px;height:62px;object-fit:contain;border-radius:14px;flex-shrink:0;">
        <div style="min-width:0;">
          <h1 style="margin:0 0 5px;font-size:1.85rem;line-height:1.2;font-weight:900;color:#145d99;">
            Platform Tes Sugar Group Schools
          </h1>
          <div style="font-size:1rem;color:#536a7b;font-weight:600;">
            Platform Seleksi &amp; Pengembangan
          </div>
        </div>
      </div>
      ${greetingHTML}
  `;

  if (appState.showTestCards) {
    const allTestMeta = {
      IST:      { icon: '🧠', label: 'KECERDASAN',    desc: tests.IST.description,       time: '~60 menit' },
      KRAEPLIN: { icon: '🧮', label: 'KORAN',          desc: tests.KRAEPLIN.description,  time: '±5-10 menit' },
      DISC:     { icon: '👤', label: 'KEPEMIMPINAN',   desc: tests.DISC.description,      time: '~5 menit' },
      PAPI:     { icon: '📊', label: 'SIKAP KERJA',    desc: tests.PAPI.description,      time: '~5 menit' },
      BIGFIVE:  { icon: '📝', label: 'KEPRIBADIAN',    desc: tests.BIGFIVE.description,   time: '~5 menit' },
      GRAFIS:   { icon: '🎨', label: 'GAMBAR',         desc: 'Upload gambar Rumah, Pohon, dan Orang', time: '~10 menit' },
      EXCEL:    { icon: '📑', label: 'EXCEL',          desc: 'Mengerjakan soal administrasi di spreadsheet', time: '~15 menit' },
      TYPING:   { icon: '⌨️', label: 'MENGETIK',       desc: 'Uji kecepatan dan akurasi mengetik', time: '~5 menit' },
      SUBJECT:  { icon: '📚', label: 'SUBJEK',         desc: 'Pilih dan kerjakan soal sesuai mata pelajaran', time: '~15 menit' }
    };

    const selectedMeta = selectedTests
      .filter(id => allTestMeta[id])
      .map(id => ({ id: id, meta: allTestMeta[id] }));

    if (selectedMeta.length > 0) {
      html += '<div class="test-selection" style="padding:0 24px;">';

      selectedMeta.forEach(function (item) {
        const test = item.meta;
        const testId = item.id;
        const isCompleted = appState.completed[testId] === true;

        if (isCompleted) {
          html += `
            <div class="test-card completed locked" data-test-id="${testId}" title="Tes sudah selesai — tidak dapat diulang">
              <div class="test-icon">${test.icon}</div>
              <h3>${test.label}</h3>
              <p>${test.desc}</p>
              <div class="time">Waktu: ${test.time}</div>
              <div class="status">
                <span class="status-locked">🔒 Selesai — Terkunci</span>
              </div>
            </div>
          `;
        } else {
          html += `
            <div class="test-card" data-test-id="${testId}" onclick="startTest('${testId}')">
              <div class="test-icon">${test.icon}</div>
              <h3>${test.label}</h3>
              <p>${test.desc}</p>
              <div class="time">Waktu: ${test.time}</div>
              <div class="status">Belum dikerjakan</div>
            </div>
          `;
        }
      });

      html += '</div>';
    }

    html += `
      <div id="downloadPDFBox" style="text-align:center;margin:48px 0 0 0;">
        <button class="btn btn-download" id="btnDownloadPDF" type="button"
          style="padding:19px 48px;font-size:1.25rem;font-weight:900;border:2.4px solid #31b729;background:linear-gradient(92deg,#f7fff1 65%,#d3ffb8 100%);color:#15772a;box-shadow:0 0 18px #45ff6190;border-radius:15px;cursor:pointer;">
          <span style="font-size:1.23em;vertical-align:-3px;">📤</span>
          Kirim Hasil Tes
        </button>
        <div style="margin-top:13px;font-size:1.01em;color:#486908;">
          <span style="background:#fffde8;border-radius:8px;padding:3px 13px;display:inline-block;border:1px solid #ffe066;">
            <b>PENTING:</b> Kirim hasil hanya setelah semua tes selesai.
          </span>
        </div>
      </div>
    `;
  }

  html += '</div>';
  document.getElementById('app').innerHTML = html;

  const instruksiBtn = document.getElementById('btnShowInstruksi');
  if (instruksiBtn) {
    instruksiBtn.onclick = function () {
      window.downloadClickCount = 0;
      try { sessionStorage.removeItem('dlClick'); } catch (e) {}
      if (window.__pdfBtnWatcher) {
        try { clearInterval(window.__pdfBtnWatcher); } catch (e) {}
        window.__pdfBtnWatcher = null;
      }
      showInstruksiOverlay(nickname);
    };
  }

  if (typeof installPdfButtonHandler === 'function') installPdfButtonHandler();
  if (typeof updateDownloadButtonState === 'function') updateDownloadButtonState();
}

/* ============================================================
   🆕 RESUME MODAL
   ============================================================ */
function showResumeModal(data, onResume, onRestart) {
  const old = document.getElementById('resumeModalOverlay');
  if (old) old.remove();

  const labelMap = {
    IST:      'Tes IST (Kecerdasan)',
    KRAEPLIN: 'Tes Kraeplin (Koran)',
    DISC:     'Tes DISC (Kepemimpinan)',
    PAPI:     'Tes PAPI (Sikap Kerja)',
    BIGFIVE:  'Tes Big Five (Kepribadian)',
    GRAFIS:   'Tes Grafis (Gambar)',
    SUBJECT:  'Tes Subjek',
    TYPING:   'Tes Mengetik',
    EXCEL:    'Tes Excel'
  };

  const testLabel = labelMap[data.currentTest] || data.currentTest;
  const agoSec = Math.round((Date.now() - (data.savedAt || 0)) / 1000);
  const agoStr = agoSec < 60   ? agoSec + ' detik lalu'
               : agoSec < 3600 ? Math.floor(agoSec / 60) + ' menit lalu'
               : Math.floor(agoSec / 3600) + ' jam lalu';

  let progressLine = '';
  if (data.currentTest === 'IST') {
    progressLine = 'Subtes ' + ((data.currentSubtest || 0) + 1) + ' — Soal ' + ((data.currentQuestion || 0) + 1);
  } else if (data.currentTest === 'KRAEPLIN') {
    progressLine = 'Kolom ' + ((data.currentColumn || 0) + 1);
  } else if (['DISC','PAPI','BIGFIVE'].indexOf(data.currentTest) !== -1) {
    progressLine = 'Soal ' + ((data.currentQuestion || 0) + 1);
  } else if (data.currentTest === 'SUBJECT') {
    progressLine = 'Halaman ' + ((data.currentQuestion || 0) + 1);
  }

  const overlay = document.createElement('div');
  overlay.id = 'resumeModalOverlay';
  overlay.style.cssText = [
    'position: fixed', 'inset: 0', 'z-index: 2147483645',
    'background: rgba(10,20,35,.88)',
    'backdrop-filter: blur(10px)',
    '-webkit-backdrop-filter: blur(10px)',
    'display: flex', 'align-items: center', 'justify-content: center',
    'padding: 20px', 'overflow-y: auto',
    'font-family: Inter, system-ui, -apple-system, sans-serif',
    'animation: resumeFadeIn .25s ease'
  ].join(';');

  overlay.innerHTML = `
    <style>
      @keyframes resumeFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes resumeSlideIn {
        from { opacity: 0; transform: translateY(24px) scale(.95); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
    </style>

    <div style="
      max-width: 500px; width: 100%;
      background: #fff; border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 30px 90px rgba(0,0,0,.55);
      animation: resumeSlideIn .3s cubic-bezier(.2,.8,.2,1);
    ">
      <div style="
        padding: 28px 28px 22px;
        background: linear-gradient(135deg, #6366f1, #4338ca);
        color: #fff; text-align: center;
      ">
        <div style="font-size: 48px; line-height: 1; margin-bottom: 12px;">🔄</div>
        <div style="
          font-size: 12px; font-weight: 800;
          letter-spacing: 2px; opacity: .85; margin-bottom: 6px;
        ">LANJUTKAN TES?</div>
        <div style="font-size: 22px; font-weight: 900; letter-spacing: -.3px;">
          Anda terputus di tengah tes
        </div>
      </div>

      <div style="padding: 24px 28px 26px;">
        <div style="
          padding: 16px 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 18px;
          line-height: 1.75; font-size: 13.5px;
        ">
          <div style="font-weight: 800; color: #1e293b; font-size: 14px; margin-bottom: 6px;">
            📝 ${testLabel}
          </div>
          ${progressLine ? `<div style="color: #64748b;">Posisi terakhir: <b style="color:#4f46e5;">${progressLine}</b></div>` : ''}
          <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
            ⏱ Tersimpan ${agoStr}
          </div>
        </div>

        <div style="
          padding: 12px 14px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 12px;
          font-size: 12.5px; color: #78350f;
          line-height: 1.6; margin-bottom: 20px;
        ">
          <b>💡 Pilih:</b><br>
          • <b>Lanjutkan</b> — kembali ke posisi terakhir<br>
          • <b>Mulai Ulang</b> — hapus progress & mulai dari awal
        </div>

        <div style="display: flex; gap: 10px;">
          <button id="btnResumeRestart" style="
            flex: 1; padding: 14px;
            background: #f1f5f9; color: #475569;
            border: 0; border-radius: 12px;
            font-family: inherit; font-size: 14px; font-weight: 800;
            cursor: pointer;
          ">🔄 Mulai Ulang</button>

          <button id="btnResumeContinue" style="
            flex: 2; padding: 14px;
            background: linear-gradient(135deg, #6366f1, #4338ca);
            color: #fff; border: 0; border-radius: 12px;
            font-family: inherit; font-size: 14px; font-weight: 800;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(99,102,241,.32);
          ">▶️ Lanjutkan</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('btnResumeContinue').onclick = function() {
    overlay.remove();
    if (typeof onResume === 'function') onResume();
  };
  document.getElementById('btnResumeRestart').onclick = function() {
    overlay.remove();
    if (typeof onRestart === 'function') onRestart();
  };
}

/* ============================================================
   OVERLAY INSTRUKSI
   ============================================================ */
function showInstruksiOverlay(nickname) {
  const overlay = document.createElement('div');
  overlay.id = 'overlayInstruksi';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(12,25,43,.94);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;backdrop-filter:blur(6px);';
  document.body.appendChild(overlay);

  const prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const selectedTests = appState.selectedTests || [];
  const testLabels = {
    IST:      { icon: '🧠', label: 'KECERDASAN' },
    KRAEPLIN: { icon: '🧮', label: 'KORAN' },
    DISC:     { icon: '👤', label: 'KEPEMIMPINAN' },
    PAPI:     { icon: '📊', label: 'SIKAP KERJA' },
    BIGFIVE:  { icon: '📝', label: 'KEPRIBADIAN' },
    GRAFIS:   { icon: '🎨', label: 'GAMBAR' },
    EXCEL:    { icon: '📑', label: 'EXCEL' },
    TYPING:   { icon: '⌨️', label: 'MENGETIK' },
    SUBJECT:  { icon: '📚', label: 'SUBJEK' }
  };

  const chips = selectedTests.map(function (id) {
    const item = testLabels[id] || { icon: '•', label: id };
    return '<div style="display:flex;align-items:center;gap:7px;background:#f7fbff;border:1px solid #dce9f3;padding:8px 13px;border-radius:10px;font-size:.94rem;">' +
      '<span style="font-size:1.16em;line-height:1;">' + item.icon + '</span>' +
      '<span style="font-weight:700;color:#34495a;">' + item.label + '</span>' +
    '</div>';
  }).join('');

  overlay.innerHTML = `
    <div style="width:min(920px,100%);max-height:calc(100vh - 30px);overflow-y:auto;padding:24px 26px 22px;background:linear-gradient(180deg,#fff 0%,#fbfdff 100%);border:1px solid #dbe8f2;border-radius:20px;box-shadow:0 22px 65px rgba(0,0,0,.30);position:relative;">
      <div style="height:5px;background:linear-gradient(90deg,#2879d5,#28b879);border-radius:10px;margin-bottom:17px;"></div>
      <button id="btnCloseOverlay" aria-label="Tutup" style="position:absolute;top:12px;right:13px;width:34px;height:34px;border:1px solid #dce6ed;background:#f7f9fb;color:#687783;font-size:15px;font-weight:600;border-radius:9px;cursor:pointer;">✕</button>
      <div style="font-size:1rem;font-weight:700;color:#2a6c9f;margin-bottom:4px;text-align:center;">Hi, <b>${nickname}</b>!</div>
      <h2 style="text-align:center;margin:0 0 16px;color:#263746;font-size:1.58rem;font-weight:850;">Selamat Datang di Platform Tes</h2>
      <div style="max-height:60vh;overflow-y:auto;padding:4px 2px;">
        <div style="text-align:center;">
          <img src="https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/Aturan.png"
               alt="Instruksi" style="width:100%;max-width:1000px;height:auto;display:block;margin:auto;border-radius:11px;border:1px solid #dce8f1;">
        </div>
      </div>
      <div style="margin:25px 0 12px;">
        <div style="font-weight:800;font-size:1rem;color:#17639d;margin-bottom:10px;text-align:center;">Tes yang Akan Anda Kerjakan</div>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px 10px;">${chips}</div>
      </div>
      <div style="text-align:center;margin-top:20px;">
        <button class="btn" id="btnSelesaiInstruksi" style="padding:11px 31px;font-size:1rem;font-weight:800;background:linear-gradient(135deg,#2c7be5,#1768bd);color:#fff;border:none;border-radius:10px;cursor:pointer;">
          ✔️ Selesai
        </button>
      </div>
    </div>
  `;

  function closeOverlay() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.body.style.overflow = prevBodyOverflow;
  }

  document.getElementById('btnCloseOverlay').onclick = closeOverlay;

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeOverlay();
      document.removeEventListener('keydown', escHandler);
    }
  }, { once: true });

  const btnSelesai = document.getElementById('btnSelesaiInstruksi');
  if (btnSelesai) {
    btnSelesai.onclick = function () {
      appState.showTestCards = true;
      closeOverlay();
      if (typeof window.renderHome === 'function') {
        window.renderHome();
      }
      setTimeout(function () {
        const target = document.getElementById('downloadPDFBox') || document.getElementById('btnDownloadPDF');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof enableDownloadButtonAfterInstruksi === 'function') {
          enableDownloadButtonAfterInstruksi();
        }
      }, 300);
    };
  }
}

/* ============================================================
   ENABLE DOWNLOAD SETELAH INSTRUKSI
   ============================================================ */
function enableDownloadButtonAfterInstruksi() {
  const pdfBtn = document.getElementById('btnDownloadPDF');
  if (!pdfBtn) return;
  pdfBtn.disabled = false;
  pdfBtn.style.opacity = '1';
  pdfBtn.style.pointerEvents = 'auto';
  pdfBtn.classList.add('blink');
  if (typeof updateDownloadButtonState === 'function') updateDownloadButtonState();
}

/* ============================================================
   START TEST — dengan guard
   ============================================================ */
function startTest(testName) {
  if (typeof window.pushPresence === 'function') {
    window.pushPresence('active');
  }
  if (appState.completed && appState.completed[testName] === true) {
    alert('🔒 Tes ini sudah selesai dikerjakan dan tidak dapat diulang.');
    return;
  }

  if (window.__inTestView === true) {
    console.warn('[ROUTER] Ditolak: sedang berada di tes lain');
    return;
  }

  if (Array.isArray(appState.selectedTests) &&
      appState.selectedTests.length > 0 &&
      appState.selectedTests.indexOf(testName) === -1) {
    alert('⚠️ Tes ini tidak termasuk dalam tes yang Anda pilih.');
    return;
  }

  window.__inTestView = true;
  appState.currentTest = testName;
  appState.currentSubtest = 0;
  appState.currentQuestion = 0;

  if (testName === "IST") {
    renderISTSubtestIntro();
  } else if (testName === "KRAEPLIN") {
    renderKraeplinInstructions();
  } else if (testName === "DISC") {
    renderDISCIntro();
  } else if (testName === "PAPI") {
    renderPAPIIntro();
  } else if (testName === "BIGFIVE") {
    appState.timeLeft = tests.BIGFIVE.time;
    renderBIGFIVEInstruction();
  } else if (testName === "GRAFIS") {
    renderGrafisUpload();
  } else if (testName === "EXCEL") {
    renderAdminExcelSheet();
  } else if (testName === "TYPING") {
    renderTypingTest();
  } else if (testName === "SUBJECT") {
    renderSubjectTestHome();
  }
}

/* ============================================================
   CONFIRM CANCEL TEST
   ============================================================ */
function confirmCancelTest() {
  if (confirm('Apakah Anda yakin ingin membatalkan tes? Semua jawaban yang sudah diisi akan hilang.')) {
    clearInterval(appState.timer);
    window.__inTestView = false;
    renderHome();
  }
}

/* ============================================================
   EXPORT KE WINDOW
   ============================================================ */
window.renderTestSelection = renderTestSelection;
window.renderHome = renderHome;
window.showInstruksiOverlay = showInstruksiOverlay;
window.showResumeModal = showResumeModal;
window.enableDownloadButtonAfterInstruksi = enableDownloadButtonAfterInstruksi;
window.startTest = startTest;
window.confirmCancelTest = confirmCancelTest;

console.log('[ROUTER] ✓ Loaded — resume modal aktif');
