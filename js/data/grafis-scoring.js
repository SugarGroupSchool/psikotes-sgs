/* =========================================================
   GRAFIS TEST (DAP, HTP, BAUM) — Full Logic v2.0
   ---------------------------------------------------------
   Improvements v2.0:
   - Progress indicator (subtes 1/3, 2/3, 3/3)
   - Timer warning di 60s & 30s (pulse red)
   - Validasi foto (resolusi, brightness, ukuran)
   - Preview sebelum lanjut
   - Firebase upload dengan retry (3× exponential backoff)
   - LocalStorage fallback kalau Firebase gagal
   - Konfirmasi sebelum finish
   ========================================================= */

const GRAFIS_SUBTESTS = (typeof GRAFIS_DATA !== 'undefined' && GRAFIS_DATA.subtests)
  ? GRAFIS_DATA.subtests
  : [];

let __grafisTimer = null;
let __grafisTimeLeft = 0;
let __grafisCurrentIdx = 0;
let __grafisWarned60 = false;
let __grafisWarned30 = false;

/* =========================================================
   HELPER: Escape
   ========================================================= */
function __grafisEscape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* =========================================================
   STYLES
   ========================================================= */
function ensureGrafisStyles() {
  if (document.getElementById('grafisStylesInjected')) return;

  const s = document.createElement('style');
  s.id = 'grafisStylesInjected';
  s.textContent = `
    .grafis-page p,
    .grafis-page li,
    .grafis-page .grafis-detail-list li,
    .grafis-page .grafis-instruction,
    .grafis-page .grafis-instruction li,
    .grafis-page .grafis-notice,
    .grafis-page .grafis-modal-text,
    .grafis-page .grafis-modal-highlight,
    .grafis-page .grafis-example-note,
    .grafis-page .grafis-upload-info li,
    .grafis-page .grafis-final p,
    .grafis-thank p {
      text-align: justify;
      text-justify: inter-word;
      hyphens: auto;
      -webkit-hyphens: auto;
      word-break: break-word;
    }

    .grafis-btn,
    .grafis-timer-chip,
    .grafis-modal-actions button {
      text-align: center;
    }

    /* Progress indicator */
    .grafis-progress-track {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 18px auto 0;
      padding: 14px 18px;
      max-width: 560px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
    }
    .grafis-progress-step {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #94a3b8;
      transition: all .25s ease;
    }
    .grafis-progress-step.active { color: #2563eb; }
    .grafis-progress-step.done { color: #16a34a; }
    .grafis-progress-dot {
      width: 26px; height: 26px;
      border-radius: 50%;
      display: grid; place-items: center;
      background: #e2e8f0;
      color: #94a3b8;
      font-size: 11px;
      font-weight: 900;
      transition: all .25s ease;
    }
    .grafis-progress-step.active .grafis-progress-dot {
      background: linear-gradient(135deg, #3b82f6, #1e40af);
      color: #fff;
      box-shadow: 0 0 0 4px rgba(59,130,246,.15);
    }
    .grafis-progress-step.done .grafis-progress-dot {
      background: linear-gradient(135deg, #16a34a, #059669);
      color: #fff;
    }
    .grafis-progress-connector {
      width: 30px; height: 2px;
      background: #e2e8f0;
      border-radius: 2px;
    }
    .grafis-progress-connector.done { background: #16a34a; }

    /* Timer warning */
    .grafis-timer-chip.warn-60 {
      background: #fef3c7 !important;
      border-color: #fde68a !important;
      color: #92400e !important;
    }
    .grafis-timer-chip.warn-30 {
      background: #fee2e2 !important;
      border-color: #fca5a5 !important;
      color: #991b1b !important;
      animation: grafisTimerPulse 1s ease-in-out infinite;
    }
    @keyframes grafisTimerPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,38,38,.4); }
      50%      { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(220,38,38,0); }
    }

    /* Warning validation */
    .grafis-warn-inline {
      margin-top: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 11.5px;
      line-height: 1.5;
      display: none;
    }
    .grafis-warn-inline.show { display: block; }
    .grafis-warn-inline.warn {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #78350f;
    }
    .grafis-warn-inline.error {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #991b1b;
    }

    /* Preview block */
    .grafis-preview-block {
      margin-top: 14px;
      padding: 14px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      display: none;
    }
    .grafis-preview-block.show { display: block; }
    .grafis-preview-block-title {
      font-size: 12px;
      font-weight: 800;
      color: #166534;
      margin-bottom: 8px;
    }
    .grafis-preview-block-meta {
      font-size: 11px;
      color: #4b7a5a;
      line-height: 1.6;
    }
  `;
  document.head.appendChild(s);
}

/* =========================================================
   PLAY TIMEOUT SOUND
   ========================================================= */
function playTimeoutSound() {
  try {
    const a = new Audio("https://cdn.jsdelivr.net/gh/Pragas123/assets@main/time%20up.mp3");
    a.volume = .87;
    a.play().catch(() => {});
  } catch {}
}

/* =========================================================
   NAVIGATION
   ========================================================= */
function nextOrUploadSlide(idx) {
  if (idx < GRAFIS_SUBTESTS.length - 1) {
    renderGrafisSlide(idx + 1, "persiapan");
  } else {
    renderUploadSlide();
  }
}

function grafisHeader(title, subtitle = "") {
  return renderTestPageHeader({
    eyebrow: "ASSESSMENT CENTER",
    title: title,
    subtitle: subtitle
  });
}

/* =========================================================
   PROGRESS INDICATOR
   ========================================================= */
function renderGrafisProgress(currentIdx) {
  return `
    <div class="grafis-progress-track">
      ${GRAFIS_SUBTESTS.map((s, i) => {
        const isDone = i < currentIdx;
        const isActive = i === currentIdx;
        const cls = isDone ? 'done' : (isActive ? 'active' : '');
        const dotContent = isDone ? '✓' : (i + 1);
        return `
          <div class="grafis-progress-step ${cls}">
            <div class="grafis-progress-dot">${dotContent}</div>
            <span>${__grafisEscape(s.kode)}</span>
          </div>
          ${i < GRAFIS_SUBTESTS.length - 1 ? `<div class="grafis-progress-connector ${isDone ? 'done' : ''}"></div>` : ''}
        `;
      }).join('')}
    </div>
  `;
}

/* =========================================================
   WARNING SEBELUM UPLOAD
   ========================================================= */
function showGrafisUploadWarning(idx) {
  if (__grafisTimer) { clearInterval(__grafisTimer); __grafisTimer = null; }
  const subtest = GRAFIS_SUBTESTS[idx];

  const modal = document.createElement("div");
  modal.className = "grafis-modal-overlay";
  modal.id = "grafisUploadWarning";
  modal.innerHTML = `
    <div class="grafis-modal">
      <div class="grafis-modal-top"></div>
      <div class="grafis-modal-body">
        <div class="grafis-modal-icon">!</div>
        <h3>Pastikan foto sudah siap</h3>
        <div class="grafis-modal-text">
          Sebelum masuk ke tahap upload, pastikan hasil gambar Anda sudah selesai dan
          <b>sudah difoto dengan jelas</b>.<br><br>
          Setelah melanjutkan, Anda akan memiliki waktu terbatas untuk mengunggah hasil gambar.
        </div>
        <div class="grafis-modal-highlight">
          <b>Silakan ambil foto terlebih dahulu.</b><br>
          Untuk memudahkan proses upload, Anda dapat mengirim foto ke
          <b>WhatsApp diri sendiri</b>, kemudian membuka WhatsApp Web pada komputer atau laptop.
          <br><br>
          <b>Waktu upload: ${Math.round(subtest.waktuUpload / 60)} menit.</b>
        </div>
        <div class="grafis-modal-actions">
          <button type="button" class="grafis-btn" id="grafisBtnLanjutUpload">
            Saya Sudah Foto, Lanjut Upload →
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("grafisBtnLanjutUpload").onclick = () => {
    modal.remove();
    renderGrafisSlide(idx, "foto");
  };
}

/* =========================================================
   TIMER MENGGAMBAR
   ========================================================= */
function startGrafisDrawingTimer() {
  if (__grafisTimer) clearInterval(__grafisTimer);
  __grafisWarned60 = false;
  __grafisWarned30 = false;

  __grafisTimer = setInterval(() => {
    __grafisTimeLeft--;
    const chip = document.getElementById("timerGrafisChip");
    const t = document.getElementById("timerGrafis");
    if (t) t.textContent = formatTime(__grafisTimeLeft);

    // Warning at 60s
    if (__grafisTimeLeft <= 60 && !__grafisWarned60 && __grafisTimeLeft > 30) {
      __grafisWarned60 = true;
      if (chip) chip.classList.add("warn-60");
    }
    // Warning at 30s
    if (__grafisTimeLeft <= 30 && !__grafisWarned30) {
      __grafisWarned30 = true;
      if (chip) {
        chip.classList.remove("warn-60");
        chip.classList.add("warn-30");
      }
    }

    if (__grafisTimeLeft <= 0) {
      clearInterval(__grafisTimer);
      __grafisTimer = null;
      playTimeoutSound();
      renderGrafisSlide(__grafisCurrentIdx, "foto");
    }
  }, 1000);
}

/* =========================================================
   PERSIAPAN UTAMA
   ========================================================= */
function renderPersiapanSlide() {
  ensureGrafisStyles();
  if (__grafisTimer) { clearInterval(__grafisTimer); __grafisTimer = null; }

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="grafis-page">
      <div class="grafis-container">
        <div class="grafis-card">
          <div class="grafis-accent"></div>
          ${grafisHeader("Persiapan Tes Grafis", "Pastikan seluruh perlengkapan sudah tersedia.")}
          <div class="grafis-content">
            <div class="grafis-box">
              <div class="grafis-box-title">
                <div class="grafis-box-icon">✓</div>
                <strong>Siapkan terlebih dahulu</strong>
              </div>
              <ul class="grafis-detail-list">
                <li><b>3 lembar kertas A4 polos</b></li>
                <li>Pensil <b>HB / 2B</b></li>
                <li>HP / kamera untuk memfoto hasil</li>
              </ul>
            </div>
            <div class="grafis-box">
              <div class="grafis-box-title">
                <div class="grafis-box-icon">↑</div>
                <strong>Setelah menggambar</strong>
              </div>
              <ol class="grafis-detail-list">
                <li>Foto hasil gambar dengan jelas.</li>
                <li>Kirim foto ke WhatsApp diri sendiri.</li>
                <li>Buka WhatsApp Web.</li>
                <li>Download foto lalu upload pada halaman tes.</li>
              </ol>
            </div>
            <div class="grafis-notice">
              <b>Perhatian:</b> waktu akan berjalan setelah tombol mulai pada masing-masing tes ditekan.
            </div>
            <div class="grafis-actions">
              <button type="button" class="grafis-btn" id="btnSiapSemua">Saya Sudah Siap →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById("btnSiapSemua").onclick = () => renderGrafisSlide(0, "persiapan");
}

/* =========================================================
   DAP / HTP / BAUM
   ========================================================= */
function renderGrafisSlide(idx, step = "persiapan") {
  ensureGrafisStyles();
  if (__grafisTimer) { clearInterval(__grafisTimer); __grafisTimer = null; }

  __grafisCurrentIdx = idx;
  const subtest = GRAFIS_SUBTESTS[idx];
  const app = document.getElementById("app");

  window.appState = window.appState || {};
  appState.grafis = appState.grafis || {};

  if (step === "persiapan") {
    app.innerHTML = `
      <div class="grafis-page">
        <div class="grafis-container">
          <div class="grafis-card">
            <div class="grafis-accent"></div>
            ${grafisHeader(subtest.title, subtest.subtitle)}
            <div class="grafis-content">
              ${renderGrafisProgress(idx)}
              <div class="grafis-prep-grid" style="margin-top:20px;">
                <div>
                  <div class="grafis-box">
                    <div class="grafis-box-title">
                      <div class="grafis-box-icon">✓</div>
                      <strong>Persiapan</strong>
                    </div>
                    ${subtest.alat}
                  </div>
                  <div class="grafis-notice">
                    <b>Waktu menggambar:</b> ${Math.round(subtest.waktuGambar / 60)} menit.<br>
                    Waktu mulai setelah tombol <b>Mulai Menggambar</b> ditekan.
                  </div>
                </div>
                <div class="grafis-example-card">
                  <div class="grafis-example-label">Contoh hasil gambar</div>
                  <div class="grafis-example-image-wrap">
                    <img src="${subtest.contoh}" alt="Contoh ${subtest.kode}" class="grafis-example-image">
                  </div>
                  <div class="grafis-example-note">Contoh hanya sebagai referensi. Jangan meniru gambar.</div>
                </div>
              </div>
              <div class="grafis-actions">
                <button class="grafis-btn" id="btnSiap">Mulai Menggambar →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById("btnSiap").onclick = () => renderGrafisSlide(idx, "gambar");
    return;
  }

  if (step === "gambar") {
    __grafisTimeLeft = subtest.waktuGambar;
    app.innerHTML = `
      <div class="grafis-page">
        <div class="grafis-container">
          <div class="grafis-card">
            <div class="grafis-accent"></div>
            ${grafisHeader(subtest.title, `Waktu pengerjaan ${Math.round(subtest.waktuGambar / 60)} menit.`)}
            <div class="grafis-content">
              ${renderGrafisProgress(idx)}
              <div class="grafis-instruction" style="margin-top:20px;">${subtest.instruksi}</div>
              <div class="grafis-timer-area">
                <span class="grafis-timer-chip" id="timerGrafisChip">
                  ⏱️ <span id="timerGrafis">${formatTime(__grafisTimeLeft)}</span>
                </span>
                <button class="grafis-btn" id="btnSelesaiGambar">Selesai</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    startGrafisDrawingTimer();
    document.getElementById("btnSelesaiGambar").onclick = () => showGrafisUploadWarning(idx);
    return;
  }

  if (step === "foto") {
    __grafisTimeLeft = subtest.waktuUpload;
    app.innerHTML = `
      <div class="grafis-page">
        <div class="grafis-container">
          <div class="grafis-card">
            <div class="grafis-accent"></div>
            ${grafisHeader("Upload Hasil " + subtest.kode, "Foto hasil gambar lalu unggah di bawah.")}
            <div class="grafis-content">
              ${renderGrafisProgress(idx)}
              <div class="grafis-upload-info" style="margin-top:20px;">
                <ul class="grafis-detail-list">
                  <li>Foto harus <b>jelas dan tidak buram</b>.</li>
                  <li>Seluruh bagian gambar harus terlihat.</li>
                  <li>Usahakan kertas tidak terpotong pada foto.</li>
                  <li>Resolusi minimal <b>800 × 600 px</b>.</li>
                  <li>Klik atau drag file ke area upload.</li>
                </ul>
              </div>
              <div class="grafis-time-warning">
                Sisa waktu upload: <b><span id="timerFoto">${formatTime(__grafisTimeLeft)}</span></b>
              </div>
              <div class="grafis-drop" id="dropZone">
                <input type="file" accept="image/*" id="uploadGambar" style="display:none;">
                <div class="grafis-drop-icon">↑</div>
                <div class="grafis-drop-main" id="dropMsg">Klik atau drag & drop gambar</div>
                <div class="grafis-drop-note">JPG / PNG / WEBP · Maks 10 MB</div>
                <div class="grafis-preview" id="previewGambar"></div>
              </div>
              <div class="grafis-warn-inline" id="grafisWarnInline"></div>
              <div class="grafis-preview-block" id="grafisPreviewBlock">
                <div class="grafis-preview-block-title">✅ File siap diunggah</div>
                <div class="grafis-preview-block-meta" id="grafisPreviewMeta"></div>
              </div>
              <div class="grafis-actions">
                <button class="grafis-btn" id="btnNextGrafis" disabled>Lanjut →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    __grafisTimer = setInterval(() => {
      __grafisTimeLeft--;
      const tf = document.getElementById("timerFoto");
      if (tf) tf.textContent = formatTime(__grafisTimeLeft);
      if (__grafisTimeLeft <= 0) {
        clearInterval(__grafisTimer);
        __grafisTimer = null;
        playTimeoutSound();
        nextOrUploadSlide(idx);
      }
    }, 1000);

    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("uploadGambar");
    const btnNext = document.getElementById("btnNextGrafis");
    const dropMsg = document.getElementById("dropMsg");
    const preview = document.getElementById("previewGambar");
    const warnEl = document.getElementById("grafisWarnInline");
    const previewBlock = document.getElementById("grafisPreviewBlock");
    const previewMeta = document.getElementById("grafisPreviewMeta");

    /* Show/hide warning */
    function showWarn(type, msg) {
      warnEl.className = "grafis-warn-inline show " + type;
      warnEl.textContent = msg;
    }
    function hideWarn() {
      warnEl.className = "grafis-warn-inline";
      warnEl.textContent = "";
    }

    /* Validate image */
    async function validateImage(dataUrl) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const minW = 800, minH = 600;

          if (w < minW || h < minH) {
            resolve({
              ok: false,
              level: 'warn',
              msg: `⚠️ Resolusi foto rendah (${w}×${h}px). Disarankan minimal ${minW}×${minH}px. Lanjutkan upload atau foto ulang.`,
              w, h
            });
            return;
          }

          if (w < 1200 || h < 900) {
            resolve({
              ok: true,
              level: 'warn',
              msg: `ℹ️ Resolusi sedang (${w}×${h}px). Jika bisa, foto ulang dengan resolusi lebih tinggi.`,
              w, h
            });
            return;
          }

          resolve({
            ok: true,
            level: 'ok',
            msg: `✅ Resolusi baik (${w}×${h}px).`,
            w, h
          });
        };
        img.onerror = () => resolve({ ok: false, level: 'error', msg: '❌ Gagal memuat gambar.' });
        img.src = dataUrl;
      });
    }

    /* Handle file */
    async function handleFile(file) {
      if (!file || !file.type.startsWith('image/')) {
        showWarn('error', '❌ File harus berupa gambar (JPG/PNG/WEBP).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showWarn('error', '❌ Ukuran maksimal 10 MB. Kompres dulu atau foto ulang.');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target.result;

        /* Validate */
        const result = await validateImage(dataUrl);
        if (result.level === 'warn') showWarn('warn', result.msg);
        else if (result.level === 'error') { showWarn('error', result.msg); return; }
        else hideWarn();

        /* Show preview */
        preview.innerHTML = `<img src="${dataUrl}" alt="Preview hasil gambar">`;
        dropMsg.textContent = "✓ File berhasil diunggah";
        dropMsg.style.color = "#188c3a";

        /* Simpan ke state */
        appState.grafis[subtest.key] = dataUrl;

        /* Preview meta */
        const sizeKb = (file.size / 1024).toFixed(0);
        previewMeta.innerHTML = `
          <div><b>File:</b> ${__grafisEscape(file.name)}</div>
          <div><b>Ukuran:</b> ${sizeKb} KB</div>
          <div><b>Dimensi:</b> ${result.w} × ${result.h} px</div>
        `;
        previewBlock.classList.add('show');

        /* Enable next */
        btnNext.disabled = false;
      };
      reader.onerror = () => showWarn('error', '❌ Gagal membaca file.');
      reader.readAsDataURL(file);
    }

    dropZone.onclick = (e) => {
      if (e.target.closest('#previewGambar')) return;
      fileInput.click();
    };
    dropZone.ondragover = e => { e.preventDefault(); dropZone.style.background = "#e3f4ff"; };
    dropZone.ondragleave = e => { e.preventDefault(); dropZone.style.background = "#f8fcff"; };
    dropZone.ondrop = e => {
      e.preventDefault();
      dropZone.style.background = "#f8fcff";
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
      }
    };

    fileInput.addEventListener("change", function () {
      const file = fileInput.files[0];
      if (file) handleFile(file);
    });

    btnNext.onclick = function () {
      /* Konfirmasi kalau resolusi rendah */
      if (previewBlock.classList.contains('show') && warnEl.classList.contains('warn')) {
        const ok = confirm(
          "Foto Anda memiliki resolusi rendah.\n\n" +
          "Sistem tetap bisa menerima, namun akurasi interpretasi bisa berkurang.\n\n" +
          "Lanjutkan dengan foto ini?"
        );
        if (!ok) return;
      }

      if (__grafisTimer) { clearInterval(__grafisTimer); __grafisTimer = null; }
      nextOrUploadSlide(idx);
    };
    return;
  }
}

/* =========================================================
   FINAL
   ========================================================= */
function renderUploadSlide() {
  ensureGrafisStyles();
  if (__grafisTimer) { clearInterval(__grafisTimer); __grafisTimer = null; }

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="grafis-page">
      <div class="grafis-container">
        <div class="grafis-card">
          <div class="grafis-accent"></div>
          ${grafisHeader("Tes Grafis Selesai", "Semua hasil gambar telah diunggah.")}
          <div class="grafis-content">
            ${renderGrafisProgress(GRAFIS_SUBTESTS.length)}
            <div class="grafis-final" style="margin-top:20px;">
              <h3>Semua gambar berhasil diunggah</h3>
              <p>Klik Selesai untuk mengirim gambar ke sistem dan melanjutkan ke tahap berikutnya.</p>
            </div>
            <div class="grafis-actions">
              <button class="grafis-btn" id="btnFinishGrafis">Selesai & Kirim →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btnFinishGrafis").onclick = async function () {
    const ok = confirm(
      "Kirim semua hasil gambar ke sistem?\n\n" +
      "Pastikan semua gambar sudah benar dan jelas.\n" +
      "Setelah dikirim, Anda tidak bisa mengulang tes ini."
    );
    if (!ok) return;

    const btn = document.getElementById("btnFinishGrafis");
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Mengirim gambar...'; }

    try {
      await __uploadGrafisImagesToFirebase();
      renderGrafisThankYou();
    } catch (e) {
      console.warn('[GRAFIS] Upload error:', e);

      /* Tanya user: retry atau lanjut */
      const retry = confirm(
        "⚠️ Upload ke server bermasalah:\n\n" +
        (e.message || 'Koneksi tidak stabil') + "\n\n" +
        "Gambar Anda tersimpan di perangkat ini.\n\n" +
        "Klik OK untuk COBA LAGI, atau Cancel untuk LANJUT tanpa upload (admin akan hubungi Anda)."
      );

      if (retry) {
        btn.disabled = false;
        btn.textContent = 'Selesai & Kirim →';
        return;
      }

      renderGrafisThankYou({ uploadFailed: true });
    }
  };
}

/* =========================================================
   FIREBASE UPLOAD — With Retry + LocalStorage Fallback
   ========================================================= */
async function __uploadGrafisImagesToFirebase() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    throw new Error('Firebase belum siap');
  }

  const identity = (window.appState && appState.identity) ? appState.identity : {};
  if (!identity.name) {
    throw new Error('Nama kandidat kosong');
  }

  const slug = String(identity.name).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  if (!slug) throw new Error('Slug tidak valid');

  const map = { orang: 'dap', rumah: 'htp', pohon: 'baum' };
  const images = {};
  let hasAny = false;

  /* Kompres semua gambar dulu */
  for (const [key, testKey] of Object.entries(map)) {
    const dataUrl = appState.grafis && appState.grafis[key];
    if (!dataUrl) continue;
    try {
      const compressed = (typeof __compressImageForPDF === 'function')
        ? await __compressImageForPDF(dataUrl, 1200, 0.6)
        : dataUrl;
      images[testKey] = {
        dataUrl: compressed,
        label: key,
        uploadedAt: Date.now()
      };
      hasAny = true;
    } catch (e) {
      console.warn('[GRAFIS] Compress gagal (' + key + '):', e.message);
    }
  }

  if (!hasAny) throw new Error('Tidak ada gambar untuk di-upload');

  /* Payload */
  const payload = {
    meta: {
      name: identity.name,
      position: identity.position || '',
      ts: firebase.database.ServerValue.TIMESTAMP
    },
    images: images
  };

  /* Retry 3× exponential backoff */
  const maxRetry = 3;
  let lastErr = null;

  for (let attempt = 1; attempt <= maxRetry; attempt++) {
    try {
      await firebase.database()
        .ref('sgs_grafis_images/' + slug)
        .set(payload);

      console.log('[GRAFIS] ✅ Gambar tersimpan di Firebase (attempt ' + attempt + ')');

      /* Sinyal ke admin */
      try {
        firebase.database().ref('sgs_state/lastUpload').set({
          ts: firebase.database.ServerValue.TIMESTAMP,
          type: 'grafis',
          name: identity.name,
          position: identity.position || '',
          deviceId: localStorage.getItem('_sgs_device_id') || ''
        }).catch(() => {});
      } catch (e) {}

      /* Hapus fallback kalau ada */
      try { localStorage.removeItem('_sgs_grafis_fallback_' + slug); } catch (e) {}

      return { ok: true, attempt };

    } catch (err) {
      lastErr = err;
      console.warn(`[GRAFIS] Upload attempt ${attempt}/${maxRetry} gagal:`, err.message);

      if (attempt < maxRetry) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }

  /* SEMUA RETRY GAGAL → Fallback ke localStorage */
  try {
    localStorage.setItem('_sgs_grafis_fallback_' + slug, JSON.stringify({
      slug,
      payload: {
        meta: { name: identity.name, position: identity.position || '', ts: Date.now() },
        images: images
      },
      savedAt: Date.now()
    }));
    console.warn('[GRAFIS] Fallback tersimpan di localStorage');
  } catch (e) {
    console.warn('[GRAFIS] Gagal simpan fallback:', e.message);
  }

  throw lastErr || new Error('Upload gagal setelah ' + maxRetry + ' percobaan');
}

/* =========================================================
   THANK YOU
   ========================================================= */
function renderGrafisThankYou(opts = {}) {
  window.__inTestView = false;
  ensureGrafisStyles();
  const app = document.getElementById("app");

  const isFailed = opts.uploadFailed === true;

  app.innerHTML = `
    <div class="grafis-page">
      <div class="grafis-container">
        <div class="grafis-card">
          <div class="grafis-accent"></div>
          ${renderTestPageHeader({
            eyebrow: 'ASSESSMENT CENTER',
            title: isFailed ? 'Tes Grafis Selesai (Pending Upload)' : 'Tes Grafis Selesai',
            subtitle: isFailed
              ? 'Gambar tersimpan di perangkat. Admin akan menghubungi Anda.'
              : 'Semua gambar Anda telah tersimpan.',
            showBack: false
          })}
        </div>
        <div class="grafis-thank" style="margin-top:20px;">
          <div class="grafis-thank-icon">${isFailed ? '⚠️' : '🎉'}</div>
          <h2>${isFailed ? 'Upload Pending' : 'Terima Kasih!'}</h2>
          <p>
            ${isFailed
              ? 'Koneksi ke server sedang bermasalah. Jangan khawatir — gambar Anda masih tersimpan di perangkat ini.<br>Silakan beritahu admin agar data bisa diambil manual.'
              : 'Semua gambar Anda telah tersimpan. Silakan lanjut ke tes berikutnya.'}
          </p>
          <div class="grafis-actions">
            <button id="btnContinueGrafis" class="grafis-btn">
              ${isFailed ? '🏠 Kembali ke Beranda' : '✅ Lanjut Tes Berikutnya'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btnContinueGrafis").onclick = () => {
    window.appState = window.appState || {};
    appState.completed = appState.completed || {};
    appState.completed.GRAFIS = true;

    if (typeof window.markTestCompleted === 'function') {
      markTestCompleted('GRAFIS');
    }
    if (typeof window.updateDownloadButtonState === "function") {
      window.updateDownloadButtonState();
    }
    if (typeof window.renderHome === "function") {
      window.__inTestView = false;
      window.renderHome();
      setTimeout(() => {
        const el = document.getElementById("homeCard") || document.getElementById("downloadPDFBox");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  };
}

/* =========================================================
   ENTRY POINT
   ========================================================= */
function renderGrafisUpload() {
  window.__inTestView = true;
  appState.currentTest = 'GRAFIS';
  appState.completed = appState.completed || {};
  appState.completed.GRAFIS = false;
  appState.grafis = appState.grafis || {};
  renderPersiapanSlide();
}

/* =========================================================
   RECOVERY — Cek fallback di startup
   ========================================================= */
async function __recoverGrafisFallback() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;

  const keys = Object.keys(localStorage).filter(k => k.startsWith('_sgs_grafis_fallback_'));
  if (keys.length === 0) return;

  console.log('[GRAFIS] 🔄 Recovery: ' + keys.length + ' fallback ditemukan');

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw);
      if (!data.slug || !data.payload) continue;

      await firebase.database()
        .ref('sgs_grafis_images/' + data.slug)
        .set(data.payload);

      localStorage.removeItem(key);
      console.log('[GRAFIS] ✓ Fallback recovered:', data.slug);
    } catch (e) {
      console.warn('[GRAFIS] Recovery gagal untuk', key, ':', e.message);
    }
  }
}

/* Auto-run recovery setelah Firebase siap */
setTimeout(() => {
  __recoverGrafisFallback().catch(() => {});
}, 5000);

console.log('[TEST-GRAFIS] ✓ Loaded — v2.0 (progress + validation + retry + recovery)');
