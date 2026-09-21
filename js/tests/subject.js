/* =========================================================
   SUBJECT TEST — Full Logic
   ========================================================= */

let subjectCheatFlag = false;
let allowTabOutSubject = false;
let __subjectTimerInterval = null;
let __subjectWarnCount = 0;           // ✅ BARU — counter peringatan
const __SUBJECT_MAX_WARN = 1;         // ✅ BARU — 1× peringatan, ke-2 diskualifikasi

function injectSubjectStyles() {}

/* =========================================================
   HELPER — Format waktu MM:SS
   ========================================================= */
function formatTimeSubject(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

/* =========================================================
   HOME — Pilih Mata Pelajaran
   ========================================================= */
function renderSubjectTestHome() {
  window.__inTestView = true;
  appState.currentTest = 'SUBJECT';

  // ✅ RESET warning counter setiap balik ke home
  __subjectWarnCount = 0;
  subjectCheatFlag = false;

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

  // ✅ RESET warning counter setiap mulai tes baru
  __subjectWarnCount = 0;
  subjectCheatFlag = false;
  allowTabOutSubject = false;

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

            <div class="subject-ready-notice" style="background:linear-gradient(135deg,#fef2f2,#fff1f2);border-color:#fecaca;">
              <div class="subject-ready-notice-check" style="background:#fee2e2;color:#dc2626;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <strong style="color:#991b1b;">Anti-Cheat Aktif</strong>
                <span style="color:#b91c1c;">Jangan keluar dari tab ini. Keluar 2× akan otomatis <b>diskualifikasi</b>.</span>
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

  const totalQuestions = subj.questions.length;
  const progress = totalQuestions > 1
    ? Math.round((qIdx / (totalQuestions - 1)) * 100)
    : 100;
  const isLast = qIdx === totalQuestions - 1;
  const isFirst = qIdx === 0;

  document.getElementById('app').innerHTML = `
    <div class="ist-shell">
      <div class="ist-question-panel">

        ${renderTestPageHeader({
          eyebrow: 'PELAKSANAAN TES',
          title: subj.name,
          subtitle: 'Baca soal di layar, lalu tulis jawaban Anda di kertas.',
          onBack: 'renderSubjectTestHome()',
          backLabel: 'Keluar',
          showLogo: false
        })}

        <div class="ist-question-top">
          <div class="ist-question-meta">
            <div>
              <div class="ist-question-label">TES SUBJEK</div>
              <div class="ist-question-badge">📚 ${subj.name}</div>
            </div>
            <div class="ist-timer">
              <span class="ist-timer-icon">⏱</span>
              <span id="subject-timer">${formatTimeSubject(appState.timeLeft || subj.time || 2700)}</span>
            </div>
          </div>

          <div class="ist-progress-wrap">
            <div class="ist-progress-info">
              <span>Halaman ${qIdx + 1} dari ${totalQuestions}</span>
              <span>${progress}%</span>
            </div>
            <div class="ist-progress-track">
              <div class="ist-progress-fill" style="width:${progress}%"></div>
            </div>
          </div>
        </div>

        <div class="ist-question-body">

          <div class="subject-helper">
            <div class="subject-helper-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.2"
                   stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div>
              <strong>Cara mengerjakan</strong>
              <span>Kerjakan soal berikut di <b>kertas</b> Anda. Jika sudah selesai semua, klik <b>Selesai &amp; Upload</b> di halaman terakhir.</span>
            </div>
          </div>

          <div class="subject-question-card">
            ${q.question}
          </div>

          <div class="ist-question-actions">
            <div class="ist-action-left">
              ${!isFirst ? `
                <button class="ist-prev-btn" id="btnPrevSubject" type="button">
                  ← <span>Sebelumnya</span>
                </button>
              ` : ''}
            </div>
            <div class="ist-action-right">
              <button class="ist-main-btn" id="btnNextSubject" type="button">
                ${isLast ? '📤 Selesai &amp; Upload' : 'Lanjut →'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  const nextBtn = document.getElementById('btnNextSubject');
  if (nextBtn) nextBtn.onclick = () => nextSubjectQuestionSlide(qIdx);

  const prevBtn = document.getElementById('btnPrevSubject');
  if (prevBtn) prevBtn.onclick = () => {
    if (qIdx > 0) renderSubjectQuestionSlide(qIdx - 1);
  };

  startSubjectCountdown();
}

/* =========================================================
   NEXT SLIDE
   ========================================================= */
function nextSubjectQuestionSlide(qIdx) {
  const subj = (tests.SUBJECT.subjects || []).find(s => s.id === appState.subjectSelected);
  if (!subj) return;
  if (qIdx < subj.questions.length - 1) {
    renderSubjectQuestionSlide(qIdx + 1);
  } else {
    renderSubjectUpload();
  }
}

/* =========================================================
   COUNTDOWN TIMER
   ========================================================= */
function startSubjectCountdown() {
  if (__subjectTimerInterval) clearInterval(__subjectTimerInterval);
  __subjectTimerInterval = setInterval(() => {
    appState.timeLeft--;
    const timer = document.getElementById('subject-timer');
    if (timer) timer.textContent = formatTimeSubject(appState.timeLeft);
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

  const subj = (tests.SUBJECT.subjects || []).find(s => s.id === appState.subjectSelected);
  const subjName = subj ? subj.name : 'Subjek';

  document.getElementById('app').innerHTML = `
    <div class="ist-shell">
      <div class="ist-panel">

        ${renderTestPageHeader({
          eyebrow: 'UPLOAD JAWABAN',
          title: 'Upload Foto Jawaban',
          subtitle: 'Foto lembar jawaban kertas Anda dengan jelas.',
          onBack: 'renderSubjectTestHome()',
          backLabel: 'Keluar',
          showLogo: false
        })}

        <div class="ist-body">

          <div class="subject-helper" style="background:linear-gradient(135deg,#f0fdf4,#f7fefb);border-color:#bbf7d0;color:#166534;">
            <div class="subject-helper-icon" style="background:#dcfce7;color:#16a34a;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.2"
                   stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <strong>Tes ${subjName} selesai</strong>
              <span>Upload foto lembar jawaban Anda. Bisa <b>lebih dari 1 gambar</b> — klik atau drag ke area upload di bawah.</span>
            </div>
          </div>

          <div class="subject-upload-zone" id="drop-area">
            <input type="file" id="subject-upload-multi" accept="image/*" multiple style="display:none;">

            <div class="subject-upload-inner">
              <div class="subject-upload-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.8"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div class="subject-upload-title">Klik atau drag gambar ke sini</div>
              <div class="subject-upload-note">Format: JPG · PNG · WEBP · Maks 5MB per gambar</div>
            </div>

            <div id="subject-upload-preview" class="subject-upload-preview"></div>
          </div>

          <div class="subject-upload-counter">
            <span id="subject-upload-count">0</span> gambar diupload
          </div>

          <div class="ist-actions">
            <button class="ist-main-btn" id="btnFinishSubject" type="button"
                    style="min-width:200px;background:linear-gradient(135deg,#16a34a,#059669);">
              ✅ Selesai &amp; Kirim
            </button>
          </div>

        </div>
      </div>
    </div>
  `;

  let base64List = [];

  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('subject-upload-multi');
  const previewDiv = document.getElementById('subject-upload-preview');
  const countEl = document.getElementById('subject-upload-count');
  const btnFinish = document.getElementById('btnFinishSubject');

  dropArea.addEventListener('click', (e) => {
    if (e.target.closest('.subject-preview-item-remove')) return;
    fileInput.click();
  });

  dropArea.addEventListener('dragover', e => {
    e.preventDefault();
    dropArea.classList.add('is-dragover');
  });
  dropArea.addEventListener('dragleave', e => {
    e.preventDefault();
    dropArea.classList.remove('is-dragover');
  });
  dropArea.addEventListener('drop', e => {
    e.preventDefault();
    dropArea.classList.remove('is-dragover');
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
    previewDiv.innerHTML = '';
    countEl.textContent = base64List.length;

    base64List.forEach((src, idx) => {
      const item = document.createElement('div');
      item.className = 'subject-preview-item';
      item.innerHTML = `
        <img src="${src}" alt="Preview ${idx + 1}">
        <button type="button" class="subject-preview-item-remove" data-idx="${idx}" title="Hapus">×</button>
      `;
      previewDiv.appendChild(item);
    });

    previewDiv.querySelectorAll('.subject-preview-item-remove').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const i = Number(btn.getAttribute('data-idx'));
        base64List.splice(i, 1);
        appState.subjectUpload = base64List.slice();
        showPreview();
      };
    });

    if (base64List.length > 0) {
      btnFinish.disabled = false;
      btnFinish.style.opacity = '1';
      btnFinish.style.cursor = 'pointer';
    } else {
      btnFinish.disabled = true;
      btnFinish.style.opacity = '.5';
      btnFinish.style.cursor = 'not-allowed';
    }
  }

  btnFinish.disabled = true;
  btnFinish.style.opacity = '.5';
  btnFinish.style.cursor = 'not-allowed';

  btnFinish.onclick = () => {
    if (base64List.length === 0) {
      alert('Upload minimal 1 gambar jawaban terlebih dahulu.');
      return;
    }
    selesaiSubjectUpload();
  };
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
    <div class="ist-shell">
      <div class="ist-panel">
        ${renderTestPageHeader({
          eyebrow: 'TES SUBJEK',
          title: 'Selesai',
          subtitle: 'Jawaban Anda telah berhasil dikirim.',
          showBack: false,
          showLogo: true
        })}

        <div class="ist-body">
          <div class="subject-finish-card">
            <div class="subject-finish-icon">🎉</div>
            <h2 class="subject-finish-title">Terima kasih!</h2>
            <p class="subject-finish-text">
              Jawaban Tes <b>Subjek</b> sudah berhasil diupload ke sistem.<br>
              Silakan lanjut mengerjakan tes berikutnya yang Anda pilih.
            </p>

            <div class="subject-finish-note">
              <span class="subject-finish-note-icon">ℹ️</span>
              <span>Tombol <b>Download PDF</b> akan aktif otomatis setelah <b>semua tes</b> selesai dikerjakan.</span>
            </div>

            <button class="ist-main-btn" id="btnContinueSubjek"
                    style="min-width:220px;margin-top:8px;background:linear-gradient(135deg,#16a34a,#059669);">
              ✅ Lanjut Tes Berikutnya
            </button>
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
   ⚠️ ANTI-CHEAT — 1× PERINGATAN DULU, BARU DISKUALIFIKASI
   ========================================================= */
function onSubjectBlur() {
  // Kalau tidak sedang di tes, atau allowTabOut → skip
  if (!appState.subjectSelected || allowTabOutSubject) return;

  // Kalau sudah diskualifikasi → skip
  if (appState.subjectDisqualified) return;

  __subjectWarnCount++;

  // ==========================================
  // PERINGATAN 1 — Tampilkan modal, tes LANJUT
  // ==========================================
  if (__subjectWarnCount <= __SUBJECT_MAX_WARN) {
    showSubjectWarning(__subjectWarnCount);
    return;
  }

  // ==========================================
  // PERINGATAN 2+ — DISKUALIFIKASI
  // ==========================================
  subjectCheatFlag = true;
  if (__subjectTimerInterval) clearInterval(__subjectTimerInterval);
  appState.subjectSelected = null;
  appState.subjectDisqualified = true;
  allowTabOutSubject = true;

  // Tampilkan layar diskualifikasi
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
              Anda terdeteksi <b>${__subjectWarnCount}×</b> keluar dari tab tes subjek.<br>
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

/* =========================================================
   ⚠️ MODAL PERINGATAN
   ========================================================= */
function showSubjectWarning(warnCount) {
  // Set flag sementara supaya blur berikutnya tidak dobel trigger
  allowTabOutSubject = true;

  // Hapus modal lama kalau ada
  const old = document.getElementById('subjectWarningOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'subjectWarningOverlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    background: rgba(10,20,35,.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: Inter, system-ui, -apple-system, sans-serif;
    animation: subjectWarnFadeIn .25s ease;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes subjectWarnFadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes subjectWarnSlideIn {
        from { opacity: 0; transform: translateY(20px) scale(.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes subjectWarnIconPulse {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.08); }
      }
    </style>

    <div style="
      max-width: 500px;
      width: 100%;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 30px 90px rgba(0,0,0,.55);
      animation: subjectWarnSlideIn .3s cubic-bezier(.2,.8,.2,1);
    ">
      <!-- HEADER -->
      <div style="
        padding: 30px 28px 24px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        text-align: center;
        color: #fff;
      ">
        <div style="
          width: 76px; height: 76px;
          margin: 0 auto 14px;
          display: grid; place-items: center;
          background: rgba(255,255,255,.2);
          border: 2px solid rgba(255,255,255,.35);
          border-radius: 22px;
          font-size: 38px;
          animation: subjectWarnIconPulse 1.8s ease-in-out infinite;
        ">⚠️</div>
        <div style="
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          opacity: .9;
          margin-bottom: 6px;
        ">PERINGATAN ${warnCount}/${__SUBJECT_MAX_WARN}</div>
        <div style="
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -.3px;
        ">Anda Keluar dari Tab Tes</div>
      </div>

      <!-- BODY -->
      <div style="padding: 26px 28px 24px;">
        <p style="
          margin: 0 0 20px;
          color: #475569;
          font-size: 14.5px;
          line-height: 1.7;
          text-align: center;
        ">
          Sistem mendeteksi Anda <b style="color:#d97706;">keluar dari tab tes subjek</b>.<br><br>
          ${warnCount < __SUBJECT_MAX_WARN
            ? `Ini adalah peringatan <b>terakhir</b>. Jika terulang sekali lagi, Anda akan <b style="color:#dc2626;">otomatis diskualifikasi</b>.`
            : `Jika terulang lagi, Anda akan <b style="color:#dc2626;">otomatis diskualifikasi</b>.`
          }
        </p>

        <div style="
          padding: 14px 16px;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 12px;
          font-size: 13px;
          color: #78350f;
          line-height: 1.65;
        ">
          <b>💡 Tips agar tidak terulang:</b><br>
          • Aktifkan <b>Do Not Disturb</b> di HP<br>
          • Tutup notifikasi WhatsApp / Telegram / SMS<br>
          • Jangan klik di luar tab ini<br>
          • Kerjakan tes di tempat yang tenang
        </div>

        <button id="btnSubjectWarnOk" style="
          width: 100%;
          margin-top: 20px;
          padding: 15px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff;
          border: 0;
          border-radius: 12px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(217,119,6,.28);
          transition: transform .18s, box-shadow .18s, filter .18s;
        "
        onmouseover="this.style.transform='translateY(-2px)';this.style.filter='brightness(1.05)';this.style.boxShadow='0 14px 30px rgba(217,119,6,.35)';"
        onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)';this.style.boxShadow='0 10px 24px rgba(217,119,6,.28)';">
          ✅ Saya Mengerti, Lanjutkan Tes
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Tombol OK → tutup modal, lanjut tes
  document.getElementById('btnSubjectWarnOk').onclick = () => {
    overlay.remove();
    // Delay reset flag supaya blur dari klik tombol tidak trigger lagi
    setTimeout(() => {
      allowTabOutSubject = false;
    }, 800);
  };
}

/* =========================================================
   DISKUALIFIKASI SUBJECT — Lanjut dengan Password USED
   - Tes lain tetap tersimpan
   - SUBJECT di-reset (bisa dikerjakan ulang)
   - Password jadi USED → kandidat login ulang sendiri
   ========================================================= */
function logoutDiskualifikasi() {
  // ==========================================
  // 1. Password jadi USED (kandidat login ulang pakai USED)
  // ==========================================
  try {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USED_PRAGAS, '1');
  } catch (e) {}

  // ==========================================
  // 2. Reset HANYA SUBJECT — tes lain tetap tersimpan
  // ==========================================
  try {
    // a. Hapus flag completed.SUBJECT saja
    const saved = JSON.parse(localStorage.getItem('completed') || '{}');
    if (saved.SUBJECT) delete saved.SUBJECT;
    localStorage.setItem('completed', JSON.stringify(saved));

    // b. Hapus SUBJECT dari selectedTests (biar bisa pilih ulang)
    const sel = JSON.parse(localStorage.getItem('selectedTests') || '[]');
    const filtered = Array.isArray(sel) ? sel.filter(t => t !== 'SUBJECT') : [];
    localStorage.setItem('selectedTests', JSON.stringify(filtered));

    // c. Reset subjectUpload (foto jawaban yang tadi diupload)
    localStorage.removeItem('subjectUpload');
  } catch (e) {}

  // ==========================================
  // 3. Reset state di memori
  // ==========================================
  window.__inTestView = false;
  appState.subjectSelected = null;
  appState.subjectDisqualified = false;
  appState.subjectUpload = [];
  appState.showTestCards = false;
  subjectCheatFlag = false;
  allowTabOutSubject = false;
  __subjectWarnCount = 0;

  if (appState.completed) {
    appState.completed.SUBJECT = false;
  }

  // ==========================================
  // 4. Sembunyikan layar password & clear app
  // ==========================================
  const pwdScreen = document.getElementById('passwordScreen');
  if (pwdScreen) pwdScreen.classList.add('hidden');
  const appEl = document.getElementById('app');
  if (appEl) appEl.innerHTML = '';

  // ==========================================
  // 5. Tampilkan layar diskualifikasi + countdown reload
  // ==========================================
  document.body.innerHTML = `
    <div style="
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      overflow-y: auto;
      background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%);
      font-family: Inter, system-ui, -apple-system, sans-serif;
    ">
      <div style="
        max-width: 540px; width: 100%;
        padding: 38px 32px 32px;
        background: #ffffff;
        border-radius: 24px;
        box-shadow: 0 30px 90px rgba(0,0,0,.5);
        text-align: center;
      ">
        <!-- ICON -->
        <div style="
          width: 84px; height: 84px;
          margin: 0 auto 20px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #fee2e2, #fef2f2);
          border: 3px solid #fca5a5;
          border-radius: 24px;
          font-size: 44px;
          animation: diskualifikasiPulse 2s ease-in-out infinite;
        ">❌</div>

        <!-- TITLE -->
        <h1 style="
          margin: 0 0 10px;
          font-size: 25px;
          font-weight: 900;
          color: #991b1b;
          letter-spacing: -0.4px;
        ">Diskualifikasi</h1>

        <p style="
          margin: 0 0 22px;
          color: #64748b;
          font-size: 14.5px;
          line-height: 1.65;
        ">
          Anda terdeteksi <b style="color:#dc2626;">keluar dari tab tes</b>.<br>
          Anda masih bisa melanjutkan dengan login ulang.
        </p>

        <!-- INFO: PROGRESS AMAN -->
        <div style="
          padding: 14px 16px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 14px;
          font-size: 13px;
          color: #166534;
          line-height: 1.7;
          text-align: left;
          margin-bottom: 12px;
        ">
          <div style="font-weight:800;margin-bottom:6px;font-size:13.5px;">
            ✅ Tes Anda Tetap Tersimpan
          </div>
          • Tes lain yang sudah selesai <b>tetap aman</b><br>
          • Tes <b>Subjek</b> di-reset — bisa dikerjakan ulang<br>
          • Anda hanya perlu login ulang &amp; lanjutkan
        </div>

        <!-- INFO: CARA LANJUT -->
        <div style="
          padding: 14px 16px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 14px;
          font-size: 13px;
          color: #1e40af;
          line-height: 1.7;
          text-align: left;
          margin-bottom: 22px;
        ">
          <div style="font-weight:800;margin-bottom:6px;font-size:13.5px;">
            🔑 Cara Login Ulang
          </div>
          1. Klik tombol <b>"Login Ulang"</b> di bawah<br>
          2. Masukkan <b>password USED</b> dari admin<br>
          3. Lanjutkan tes Anda
        </div>

        <!-- BUTTON -->
        <button id="btnReloginDisq" style="
          width: 100%;
          padding: 15px 20px;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          color: #fff;
          border: 0;
          border-radius: 13px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 26px rgba(220,38,38,.3);
          transition: transform .18s, box-shadow .18s, filter .18s;
        "
        onmouseover="this.style.transform='translateY(-2px)';this.style.filter='brightness(1.05)';"
        onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)';">
          🔄 Login Ulang Sekarang
        </button>

        <!-- COUNTDOWN -->
        <div style="
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #94a3b8;
          font-size: 12.5px;
        ">
          <span style="
            width: 8px; height: 8px; border-radius: 50%;
            background: #f59e0b;
            box-shadow: 0 0 0 4px rgba(245,158,11,.2);
            animation: waitingPulse 1.4s ease-in-out infinite;
          "></span>
          Auto-reload dalam <b style="color:#475569;min-width:14px;display:inline-block;text-align:center;"><span id="disqCountdown">5</span></b> detik
        </div>

        <!-- PROGRESS BAR -->
        <div style="
          width: 100%; height: 4px;
          background: #e2e8f0; border-radius: 999px;
          margin-top: 12px; overflow: hidden;
        ">
          <div id="disqProgressBar" style="
            width: 0%; height: 100%;
            background: linear-gradient(90deg, #dc2626, #f59e0b);
            border-radius: inherit;
            transition: width 5s linear;
          "></div>
        </div>
      </div>
    </div>

    <style>
      @keyframes diskualifikasiPulse {
        0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(220,38,38,.3); }
        50%      { transform: scale(1.06); box-shadow: 0 0 0 14px rgba(220,38,38,0); }
      }
      @keyframes waitingPulse {
        0%, 100% { transform: scale(1);    opacity: 1; }
        50%      { transform: scale(1.35); opacity: .7; }
      }
    </style>
  `;

  // ==========================================
  // 6. Animasi progress bar
  // ==========================================
  setTimeout(() => {
    const bar = document.getElementById('disqProgressBar');
    if (bar) bar.style.width = '100%';
  }, 100);

  // ==========================================
  // 7. Fungsi reload (untuk tombol & countdown)
  // ==========================================
  const doReload = () => {
    try {
      window.location.reload();
    } catch (e) {
      window.location.href = window.location.href;
    }
  };

  document.getElementById('btnReloginDisq').onclick = doReload;

  // ==========================================
  // 8. Countdown 5 detik → auto reload
  // ==========================================
  let countdown = 5;
  const countdownEl = document.getElementById('disqCountdown');

  const interval = setInterval(() => {
    countdown--;
    if (countdownEl) countdownEl.textContent = Math.max(0, countdown);

    if (countdown <= 0) {
      clearInterval(interval);
      doReload();
    }
  }, 1000);

  console.log('[SUBJECT] ⚠️ Diskualifikasi — reload ke login dalam 5 detik. Password jadi USED.');
}

console.log('[TEST-SUBJECT] ✓ Loaded — 11 fungsi + 1× warning anti-cheat');
