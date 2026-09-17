/* =========================================================
   SUBJECT TEST — Full Logic
   ========================================================= */

let subjectCheatFlag = false;
let allowTabOutSubject = false;
let __subjectTimerInterval = null;

function injectSubjectStyles() {}

/* =========================================================
   HOME — Pilih Mata Pelajaran
   ========================================================= */
function renderSubjectTestHome() {
  window.__inTestView = true;
  appState.currentTest = 'SUBJECT';

  const subs = (tests.SUBJECT.subjects || []).filter(
    s => Array.isArray(s.questions) && s.questions.length > 0
  );

  document.getElementById('app').innerHTML = `
    <div class="subject-test-page">
      <div class="subject-test-container">
        <div class="subject-hero" style="padding:0;overflow:hidden;">
          <div class="subject-hero-accent"></div>
          ${renderTestPageHeader({
            eyebrow: 'ASSESSMENT CENTER',
            title: tests.SUBJECT.name,
            subtitle: tests.SUBJECT.description
          })}
          <div style="padding: 22px 38px 34px;">
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
          ${renderTestPageHeader({
            eyebrow: 'PETUNJUK PELAKSANAAN TES',
            title: subj.name,
            subtitle: '',
            onBack: 'renderSubjectTestHome()'
          })}

          <div class="subject-instruction-main-card" style="margin-top:20px;">
            <div class="subject-ready-status" style="display:inline-flex;margin-bottom:18px;">
              <span></span>Siap Dimulai
            </div>

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
      <div class="subject-test-page">
        <div class="subject-test-container">
          <div class="card" style="max-width:480px;margin:60px auto;padding:30px;text-align:center;">
            <h2>Soal belum tersedia</h2>
            <p>Soal untuk subjek <b>${subj.name}</b> belum tersedia.</p>
            <button class="btn" onclick="renderSubjectTestHome()">Kembali</button>
          </div>
        </div>
      </div>`;
    return;
  }

  document.getElementById('app').innerHTML = `
    <div class="subject-test-page" style="min-height:auto;padding:20px;">
      <div class="subject-test-container" style="max-width:650px;">
        <div class="subject-hero" style="padding:0;overflow:hidden;">
          <div class="subject-hero-accent"></div>
          ${renderTestPageHeader({
            eyebrow: 'PELAKSANAAN TES',
            title: subj.name,
            subtitle: 'Kerjakan soal berikut di kertas Anda',
            onBack: 'renderSubjectTestHome()'
          })}
          <div style="padding: 22px 32px 28px;">
            <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
              <div class="subject-count" style="background:#f2fbe5;border-color:#c8e6a3;color:#4d6b1f;">
                ⏱ ${timerHTML}
              </div>
            </div>
            <div style="font-size:1.05em;font-weight:500;margin-bottom:17px;color:#475569;">
              Kerjakan soal berikut di kertas Anda. Jika selesai, klik <b>Selesai & Upload</b>!
            </div>
            <div style="font-size:1.14em;margin-bottom:34px;min-height:100px;line-height:1.6;">${q.question}</div>
            <div style="display:flex;justify-content:${qIdx === 0 ? 'flex-end' : 'space-between'};gap:10px;">
              ${qIdx > 0 ? `<button class="btn btn-outline" onclick="renderSubjectQuestionSlide(${qIdx - 1})">Sebelumnya</button>` : ""}
              <button class="btn" onclick="nextSubjectQuestionSlide(${qIdx})">
                ${qIdx === subj.questions.length - 1 ? 'Selesai & Upload' : 'Lanjut'}
              </button>
            </div>
          </div>
        </div>
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
    <div class="subject-test-page" style="min-height:auto;padding:20px;">
      <div class="subject-test-container" style="max-width:600px;">
        <div class="subject-hero" style="padding:0;overflow:hidden;text-align:center;">
          <div class="subject-hero-accent"></div>
          ${renderTestPageHeader({
            eyebrow: 'UPLOAD JAWABAN',
            title: 'Upload Foto Jawaban',
            subtitle: 'Foto lembar jawaban kertas Anda',
            onBack: 'renderSubjectTestHome()'
          })}
          <div style="padding: 24px 28px 30px;">
            <div style="margin:6px 0 24px 0;color:#475569;line-height:1.6;">
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
        </div>
      </div>
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
    <div class="subject-test-page" style="min-height:auto;padding:20px;">
      <div class="subject-test-container" style="max-width:820px;">
        <div class="subject-hero" style="padding:0;overflow:hidden;text-align:center;">
          <div class="subject-hero-accent"></div>
          ${renderTestPageHeader({
            eyebrow: 'SUBJECT TEST',
            title: 'Tes Subjek Selesai',
            subtitle: 'Jawaban Anda telah berhasil diupload',
            showBack: false
          })}
          <div style="padding: 26px 28px 30px;">
            <div style="font-size:4rem;line-height:1;margin-bottom:12px;">🎉</div>
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
      <div class="subject-test-page" style="min-height:auto;padding:20px;">
        <div class="subject-test-container" style="max-width:520px;">
          <div class="subject-hero" style="padding:0;overflow:hidden;text-align:center;">
            <div class="subject-hero-accent"></div>
            ${renderTestPageHeader({
              eyebrow: 'SUBJECT TEST',
              title: 'Tes Subjek',
              subtitle: 'Diskualifikasi',
              showBack: false
            })}
            <div style="padding: 30px 26px 34px;">
              <div style="font-size:2.3em;margin-bottom:13px;">❌</div>
              <h2 style="color:#c91b1b;margin-bottom:13px;">Diskualifikasi!</h2>
              <div style="font-size:1.09em;margin-bottom:24px;color:#475569;line-height:1.6;">
                Anda terdeteksi membuka tab/jendela lain saat mengerjakan tes subjek.<br>
                Mohon hubungi panitia jika ada kendala.
              </div>
              <button class="btn btn-danger" style="padding:12px 46px;font-size:1.15em;" onclick="logoutDiskualifikasi()">
                🔒 Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

/* =========================================================
   LOGOUT DISKUALIFIKASI — TANPA RELOAD
   ========================================================= */
function logoutDiskualifikasi() {
  try {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USED_PRAGAS, '1');
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.DEVICE_FINISHED, '1');
    localStorage.setItem('_sgs_disqualified', '1');
  } catch (e) {}

  window.__inTestView = false;
  appState.subjectSelected = null;
  appState.subjectDisqualified = false;
  subjectCheatFlag = false;
  allowTabOutSubject = false;

  const pwdScreen = document.getElementById('passwordScreen');
  if (pwdScreen) pwdScreen.classList.add('hidden');

  const appEl = document.getElementById('app');
  if (appEl) appEl.innerHTML = '';

  document.body.innerHTML = `
    <div style="
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%);
      font-family: Inter, system-ui, -apple-system, sans-serif;
    ">
      <div style="
        max-width: 520px; width: 100%;
        padding: 40px 34px 34px;
        background: #ffffff;
        border-radius: 24px;
        box-shadow: 0 30px 90px rgba(0,0,0,.5);
        text-align: center;
      ">
        <div style="
          width: 90px; height: 90px;
          margin: 0 auto 22px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #fee2e2, #fef2f2);
          border: 3px solid #fca5a5;
          border-radius: 26px;
          font-size: 46px;
          animation: diskualifikasiPulse 2s ease-in-out infinite;
        ">❌</div>

        <h1 style="
          margin: 0 0 14px;
          font-size: 26px;
          font-weight: 900;
          color: #991b1b;
          letter-spacing: -0.5px;
        ">Diskualifikasi</h1>

        <p style="
          margin: 0 0 22px;
          color: #475569;
          font-size: 15px;
          line-height: 1.65;
        ">
          Anda terdeteksi <b>membuka tab atau jendela lain</b> saat mengerjakan tes.<br><br>
          Device ini <b style="color:#dc2626;">terkunci</b>.
          Hubungi admin untuk diizinkan melanjutkan tes.
        </p>

        <div style="
          padding: 16px 18px;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 14px;
          font-size: 13.5px;
          color: #92400e;
          line-height: 1.6;
          text-align: left;
        ">
          <b>ℹ️ Informasi</b><br>
          • Progress tes Anda <b>tetap tersimpan</b><br>
          • Kalau admin mengizinkan, halaman ini akan otomatis reload<br>
          • Setelah reload, Anda bisa login dan <b>lanjut dari tes terakhir</b>
        </div>

        <div style="
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #94a3b8;
          font-size: 13px;
        ">
          <span style="
            width: 10px; height: 10px; border-radius: 50%;
            background: #f59e0b;
            box-shadow: 0 0 0 5px rgba(245,158,11,.2);
            animation: waitingPulse 1.4s ease-in-out infinite;
          "></span>
          Menunggu izin dari admin...
        </div>
      </div>
    </div>

    <style>
      @keyframes diskualifikasiPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,38,38,.3); }
        50%      { transform: scale(1.05); box-shadow: 0 0 0 14px rgba(220,38,38,0); }
      }
      @keyframes waitingPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50%      { transform: scale(1.35); opacity: .7; }
      }
    </style>
  `;

  console.log('[SUBJECT] ⚠️ Diskualifikasi — device terkunci, menunggu admin');
}

console.log('[TEST-SUBJECT] ✓ Loaded — 9 fungsi');
