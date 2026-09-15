/* =========================================================
   SUBJECT TEST — Full Logic
   ========================================================= */

let subjectCheatFlag = false;
let allowTabOutSubject = false;
let __subjectTimerInterval = null;

function injectSubjectStyles() {
  // CSS sudah dimuat via <link>
}

/* =========================================================
   HOME — Pilih Mata Pelajaran
   ========================================================= */
function renderSubjectTestHome() {
  window.__inTestView = true;
  appState.currentTest = 'SUBJECT';

  // Filter subjek yang belum punya soal
  const subs = (tests.SUBJECT.subjects || []).filter(
    s => Array.isArray(s.questions) && s.questions.length > 0
  );

  document.getElementById('app').innerHTML = `
    <div class="subject-test-page">
      <div class="subject-test-container">
        <div class="subject-hero">
          <div class="subject-hero-accent"></div>
          <div class="subject-hero-content">
            <div class="subject-hero-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <div class="subject-hero-text">
              <div class="subject-eyebrow">ASSESSMENT CENTER</div>
              <h1>${tests.SUBJECT.name}</h1>
              <p>${tests.SUBJECT.description}</p>
            </div>
          </div>
          <div class="subject-instruction">
            <div class="subject-instruction-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div>
              <strong>Petunjuk</strong>
              <span>${tests.SUBJECT.instruction}</span>
            </div>
          </div>
        </div>

        <div class="subject-content-card">
          <div class="subject-content-header">
            <div>
              <h2>Pilih Mata Pelajaran</h2>
              <p>Pilih salah satu subjek yang ingin Anda kerjakan</p>
            </div>
            <div class="subject-count">
              <span class="subject-count-dot"></span>
              ${subs.length} Subjek Tersedia
            </div>
          </div>

          <div class="subject-grid">
            ${subs.map((subj, index) => `
              <button type="button" class="subject-card" onclick="startSubjectTest('${subj.id}')">
                <div class="subject-card-top">
                  <div class="subject-number">${String(index + 1).padStart(2, '0')}</div>
                  <div class="subject-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                </div>
                <div class="subject-name">${subj.name}</div>
                <div class="subject-card-description"><span>Klik untuk melihat instruksi</span></div>
                <div class="subject-card-accent"></div>
              </button>
            `).join('')}
          </div>

          <div class="subject-info-box">
            <div class="subject-info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div class="subject-info-text">
              <strong>Sebelum memulai</strong>
              <span>Pastikan Anda memilih mata pelajaran yang sesuai. Setelah memilih subjek, Anda akan melihat instruksi sebelum tes dimulai.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* =========================================================
   START SUBJEK
   ========================================================= */
function startSubjectTest(subjId) {
  const subj = (tests.SUBJECT.subjects || []).find(s => s.id === subjId);
  if (!subj) { alert("Subjek tidak ditemukan!"); return; }
  // ↓ TAMBAHKAN BARIS INI
  if (!Array.isArray(subj.questions) || subj.questions.length === 0) {
    alert("Soal untuk subjek ini belum tersedia. Silakan pilih subjek lain.");
    return;
  }

  appState.subjectSelected = subjId;
  appState.subjectStartTime = Date.now();
  appState.timeLeft = subj.time || 2700;

  if (subj.instruction) {
    document.getElementById('app').innerHTML = `
      <div class="subject-instruction-page">
        <div class="subject-instruction-container">
          <div class="subject-instruction-topbar">
            <button type="button" class="subject-back-button" onclick="renderSubjectTestHome()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              <span>Kembali</span>
            </button>
            <div class="subject-ready-status"><span></span>Siap Dimulai</div>
          </div>

          <div class="subject-instruction-main-card">
            <div class="subject-instruction-main-icon">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18h6"/>
                <path d="M10 22h4"/>
                <path d="M12 2a7 7 0 0 0-4 12.74c.65.5 1 1.27 1 2.09V17h6v-.17c0-.82.35-1.59 1-2.09A7 7 0 0 0 12 2z"/>
              </svg>
            </div>
            <div class="subject-instruction-eyebrow">PETUNJUK PELAKSANAAN TES</div>
            <h1>${subj.name}</h1>
            <div class="subject-instruction-divider"></div>

            <div class="subject-instruction-content">
              <div class="subject-instruction-content-title">
                <div class="subject-instruction-content-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </div>
                <span>Bacalah instruksi berikut dengan seksama</span>
              </div>
              <div class="subject-instruction-text">${subj.instruction}</div>
            </div>

            <div class="subject-ready-notice">
              <div class="subject-ready-notice-check">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <strong>Pastikan Anda sudah siap</strong>
                <span>Setelah menekan tombol mulai, tes akan segera dimulai.</span>
              </div>
            </div>

            <button type="button" class="subject-start-button" onclick="renderSubjectQuestionSlide(0)">
              <span>Mulai Tes</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>

            <div class="subject-start-note">Pastikan koneksi dan perangkat Anda dalam kondisi siap.</div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  renderSubjectQuestionSlide(0);
}

/* =========================================================
   RENDER SOAL
   ========================================================= */
function renderSubjectQuestionSlide(qIdx) {
  allowTabOutSubject = false;

  const subj = (tests.SUBJECT.subjects || []).find(s => s.id === appState.subjectSelected);
  if (!subj) return;

  const m = Math.floor(appState.timeLeft / 60);
  const s = appState.timeLeft % 60;
  const timerHTML = `<span id="subject-timer">${(m < 10 ? "0" : "") + m}:${(s < 10 ? "0" : "") + s}</span>`;

  const q = subj.questions[qIdx];
if (!q) {
  document.getElementById('app').innerHTML = `
    <div class="card" style="max-width:480px;margin:60px auto;padding:30px;text-align:center;">
      <h2>Soal belum tersedia</h2>
      <p>Soal untuk subjek <b>${subj.name}</b> belum tersedia.</p>
      <button class="btn" onclick="renderSubjectTestHome()">Kembali</button>
    </div>`;
  return;
}
  document.getElementById('app').innerHTML = `
    <div class="card" style="max-width:650px;margin:40px auto 0;padding:32px 18px 30px 18px;border-radius:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h2 style="margin-bottom:0;">${subj.name}</h2>
        <div style="font-size:1.05em;background:#f2fbe5;padding:7px 16px;border-radius:9px;">${timerHTML}</div>
      </div>
      <div style="margin:14px 0 17px 0;font-weight:500;font-size:1.05em;">
        Kerjakan soal berikut di kertas Anda. Jika selesai, klik <b>Selesai & Upload</b>!
      </div>
      <div style="font-size:1.14em;margin-bottom:34px;min-height:100px;">${q.question}</div>
      <div style="display:flex;justify-content:${qIdx === 0 ? 'flex-end' : 'space-between'}">
        ${qIdx > 0 ? `<button class="btn btn-outline" onclick="renderSubjectQuestionSlide(${qIdx - 1})">Sebelumnya</button>` : ""}
        <button class="btn" onclick="nextSubjectQuestionSlide(${qIdx})">
          ${qIdx === subj.questions.length - 1 ? 'Selesai & Upload' : 'Lanjut'}
        </button>
      </div>
    </div>
  `;

  startSubjectCountdown();
}

function nextSubjectQuestionSlide(qIdx) {
  const subj = (tests.SUBJECT.subjects || []).find(s => s.id === appState.subjectSelected);
  if (!subj) return;
  if (qIdx < subj.questions.length - 1) {
    renderSubjectQuestionSlide(qIdx + 1);
  } else {
    renderSubjectUpload();
  }
}

function startSubjectCountdown() {
  if (__subjectTimerInterval) clearInterval(__subjectTimerInterval);
  __subjectTimerInterval = setInterval(() => {
    appState.timeLeft--;
    const m = Math.floor(appState.timeLeft / 60);
    const s = appState.timeLeft % 60;
    const timer = document.getElementById('subject-timer');
    if (timer) timer.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    if (appState.timeLeft <= 0) {
      clearInterval(__subjectTimerInterval);
      renderSubjectUpload();
    }
  }, 1000);
}

/* =========================================================
   UPLOAD JAWABAN
   ========================================================= */
function renderSubjectUpload() {
  allowTabOutSubject = true;
  if (__subjectTimerInterval) clearInterval(__subjectTimerInterval);

  document.getElementById('app').innerHTML = `
    <div class="card" style="max-width:540px;margin:44px auto;padding:32px 19px 34px 19px;border-radius:17px;text-align:center;">
      <h2>Upload Foto Jawaban</h2>
      <div style="margin:14px 0 24px 0;">
        Upload foto lembar jawaban kertas Anda di sini.<br>
        Bisa lebih dari 3 gambar (<b>klik</b> atau <b>drag dari WA</b> ke area bawah).
      </div>
      <div id="drop-area" style="border:2px dashed #83c980;border-radius:12px;padding:28px 12px;cursor:pointer;background:#f6fff3;">
        <input type="file" id="subject-upload-multi" accept="image/*" multiple style="display:none;">
        <div style="color:#789;font-size:1.08em;">Klik di sini atau drag gambar ke area ini</div>
        <div id="subject-upload-preview" style="margin-top:16px;display:flex;flex-wrap:wrap;justify-content:center;gap:11px;"></div>
      </div>
      <button class="btn" style="margin-top:28px;padding:12px 38px;" onclick="selesaiSubjectUpload()">Selesai</button>
    </div>
  `;

  let gambarList = [];
  let base64List = [];

  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('subject-upload-multi');
  const previewDiv = document.getElementById('subject-upload-preview');

  dropArea.addEventListener('click', () => fileInput.click());
  dropArea.addEventListener('dragover', e => {
    e.preventDefault();
    dropArea.style.background = "#eaffd5";
  });
  dropArea.addEventListener('dragleave', e => {
    e.preventDefault();
    dropArea.style.background = "#f6fff3";
  });
  dropArea.addEventListener('drop', e => {
    e.preventDefault();
    dropArea.style.background = "#f6fff3";
    let files = [];
    if (e.dataTransfer.items) {
      for (let item of e.dataTransfer.items) {
        if (item.kind === "file") files.push(item.getAsFile());
      }
    } else {
      files = Array.from(e.dataTransfer.files);
    }
    handleFiles(files);
  });

  fileInput.addEventListener('change', e => handleFiles(e.target.files));

  function handleFiles(files) {
    Array.from(files)
      .filter(f => f.type.startsWith("image/"))
      .forEach(file => {
        const reader = new FileReader();
        reader.onload = evt => {
          gambarList.push(file);
          base64List.push(evt.target.result);
          showPreview();

          if (!appState.completed) appState.completed = {};
          appState.completed.SUBJECT = true;
          appState.subjectUpload = base64List.slice();
        };
        reader.readAsDataURL(file);
      });
  }

  function showPreview() {
    previewDiv.innerHTML = "";
    base64List.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.style = "max-width:130px;max-height:95px;border-radius:10px;box-shadow:0 3px 15px #c5e5b990;margin:2px;";
      previewDiv.appendChild(img);
    });
  }
}

/* =========================================================
   SELESAI UPLOAD
   ========================================================= */
function selesaiSubjectUpload() {
  window.__inTestView = false;
  if (typeof window.markTestCompleted === 'function') {
    markTestCompleted('SUBJECT');
  } else {
    window.appState = window.appState || {};
    appState.completed = appState.completed || {};
    appState.completed.SUBJECT = true;
    try {
      const saved = JSON.parse(localStorage.getItem('completed') || '{}');
      saved.SUBJECT = true;
      localStorage.setItem('completed', JSON.stringify(saved));
    } catch {}
    if (typeof window.updateDownloadButtonState === "function") {
      window.updateDownloadButtonState();
    }
  }

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="card" style="
      max-width:820px;margin:34px auto;padding:32px 28px;border-radius:22px;
      background:linear-gradient(135deg,#f5fff8 86%,#e8fff1 100%);
      box-shadow:0 10px 34px #c7f4da55;border:1.6px solid #c8f1d6;text-align:center;">
      <div style="font-size:3rem;line-height:1;margin-bottom:10px;">🎉</div>
      <h2 style="margin:6px 0 8px 0;font-weight:900;color:#13693a;">
        Terima kasih! Tes Subjek sudah selesai
      </h2>
      <p style="font-size:1.08rem;color:#244;max-width:680px;margin:0 auto 16px auto;line-height:1.6;">
        Jawaban Anda untuk Tes <b>Subjek</b> telah berhasil diupload.
        Silakan lanjut mengerjakan tes berikutnya yang Anda pilih.
        Tombol <b>Download PDF</b> akan aktif kembali setelah <b>semua</b> tes selesai dikerjakan.
      </p>

      <div style="display:flex;gap:12px;justify-content:center;margin-top:12px;flex-wrap:wrap;">
        <button id="btnContinueSubjek" class="btn" style="
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

  document.getElementById('btnContinueSubjek').onclick = goNext;
}

/* =========================================================
   ANTI-CHEAT
   ========================================================= */
function onSubjectBlur() {
  if (appState.subjectSelected && !allowTabOutSubject) {
    subjectCheatFlag = true;
    if (__subjectTimerInterval) clearInterval(__subjectTimerInterval);
    appState.subjectSelected = null;
    appState.subjectDisqualified = true;

    document.getElementById('app').innerHTML = `
      <div class="card" style="max-width:480px;margin:80px auto;padding:32px 25px 35px 25px;border-radius:17px;text-align:center;">
        <div style="font-size:2.3em;margin-bottom:13px;">❌</div>
        <h2 style="color:#c91b1b;margin-bottom:13px;">Diskualifikasi!</h2>
        <div style="font-size:1.09em;margin-bottom:24px;">
          Anda terdeteksi membuka tab/jendela lain saat mengerjakan tes subjek.<br>
          Mohon hubungi panitia jika ada kendala.
        </div>
        <button class="btn btn-danger" style="padding:12px 46px;font-size:1.15em;" onclick="logoutDiskualifikasi()">
          🔒 Logout
        </button>
      </div>
    `;
  }
}

/* =========================================================
   LOGOUT DISKUALIFIKASI — TANPA RELOAD
   
   ⚠️  PENTING: JANGAN pakai location.reload()
   
   Kalau reload, semua jawaban di appState.answers (memory)
   akan hilang → PDF jadi kosong saat download final.
   
   Solusinya: tampilkan password screen secara manual,
   biarkan identity + completed + answers tetap utuh.
   ========================================================= */
function logoutDiskualifikasi() {
  /* Diskualifikasi: set usedPragas = "1" supaya password aktif = USED
     Data jawaban tetap tersimpan di memory */
  try {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USED_PRAGAS, '1');
  } catch (e) {}

  window.__inTestView = false;
  appState.subjectSelected = null;
  appState.subjectDisqualified = false;
  subjectCheatFlag = false;
  allowTabOutSubject = false;

  const pwdScreen = document.getElementById('passwordScreen');
  const pwdForm = document.getElementById('passwordForm');
  const pwdInput = document.getElementById('passwordInput');
  const pwdError = document.getElementById('passwordError');
  const welcomeMsg = document.getElementById('welcomeMessage');
  const pwdLogo = document.getElementById('passwordLogo');

  if (pwdScreen) {
    pwdScreen.classList.remove('hidden');
    if (pwdForm) {
      pwdForm.style.opacity = '1';
      pwdForm.style.pointerEvents = 'auto';
    }
    if (pwdInput) pwdInput.value = '';
    if (pwdError) pwdError.textContent = '';
    if (welcomeMsg) welcomeMsg.classList.remove('show');
    if (pwdLogo) pwdLogo.classList.remove('small');
  }

  const appEl = document.getElementById('app');
  if (appEl) appEl.innerHTML = '';

  setTimeout(() => {
    if (pwdInput) pwdInput.focus();
  }, 150);

  console.log('[SUBJECT] Diskualifikasi — pakai password USED untuk lanjut');
}

console.log('[TEST-SUBJECT] ✓ Loaded — 9 fungsi');
