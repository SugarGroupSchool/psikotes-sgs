/* =========================================================
   GRAFIS TEST (DAP, HTP, BAUM) — Full Logic
   ---------------------------------------------------------
   🔒 AUDIT FIX [2026-09-21]:
   - I1: Hapus fungsi formatTime lokal (duplikat)
         → pakai window.formatTime dari 02-utils.js
   ========================================================= */

const GRAFIS_SUBTESTS = (typeof GRAFIS_DATA !== 'undefined' && GRAFIS_DATA.subtests)
  ? GRAFIS_DATA.subtests
  : [];

let __grafisTimer = null;
let __grafisTimeLeft = 0;
let __grafisCurrentIdx = 0;

function ensureGrafisStyles() {}

// ── 🔒 I1 FIX: Hapus fungsi formatTime lokal ──
// Alasan: sudah ada window.formatTime di 02-utils.js dengan format konsisten "05:30"
// Pemanggilan formatTime(sec) di bawah tetap bekerja — JavaScript cari ke scope global.

function playTimeoutSound() {
  try {
    const a = new Audio("https://cdn.jsdelivr.net/gh/Pragas123/assets@main/time%20up.mp3");
    a.volume = .87;
    a.play().catch(() => {});
  } catch {}
}

function nextOrUploadSlide(idx) {
  if (idx < GRAFIS_SUBTESTS.length - 1) {
    renderGrafisSlide(idx + 1, "persiapan");
  } else {
    renderUploadSlide();
  }
}

/* Wrapper ke header baru */
function grafisHeader(title, subtitle = "") {
  return renderTestPageHeader({
    eyebrow: "ASSESSMENT CENTER",
    title: title,
    subtitle: subtitle
  });
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
  __grafisTimer = setInterval(() => {
    __grafisTimeLeft--;
    const t = document.getElementById("timerGrafis");
    if (t) t.textContent = formatTime(__grafisTimeLeft);
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
              <div class="grafis-prep-grid">
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
              <div class="grafis-instruction">${subtest.instruksi}</div>
              <div class="grafis-timer-area">
                <span class="grafis-timer-chip">⏱️ <span id="timerGrafis">${formatTime(__grafisTimeLeft)}</span></span>
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
              <div class="grafis-upload-info">
                <ul class="grafis-detail-list">
                  <li>Foto harus <b>jelas dan tidak buram</b>.</li>
                  <li>Seluruh bagian gambar harus terlihat.</li>
                  <li>Usahakan kertas tidak terpotong pada foto.</li>
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
                <div class="grafis-drop-note">JPG / PNG / WEBP</div>
                <div class="grafis-preview" id="previewGambar"></div>
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

    dropZone.onclick = () => fileInput.click();
    dropZone.ondragover = e => { e.preventDefault(); dropZone.style.background = "#e3f4ff"; };
    dropZone.ondragleave = e => { e.preventDefault(); dropZone.style.background = "#f8fcff"; };
    dropZone.ondrop = e => {
      e.preventDefault();
      dropZone.style.background = "#f8fcff";
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        try {
          fileInput.files = e.dataTransfer.files;
          fileInput.dispatchEvent(new Event("change"));
        } catch {}
      }
    };

    fileInput.addEventListener("change", function () {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        preview.innerHTML = `<img src="${ev.target.result}" alt="Preview hasil gambar">`;
        appState.grafis[subtest.key] = ev.target.result;
        btnNext.disabled = false;
        dropMsg.textContent = "✓ File berhasil diunggah";
        dropMsg.style.color = "#188c3a";
      };
      reader.readAsDataURL(file);
    });

    btnNext.onclick = function () {
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
            <div class="grafis-final">
              <h3>Semua gambar berhasil diunggah</h3>
              <p>Klik Selesai untuk melanjutkan ke tahap berikutnya.</p>
            </div>
            <div class="grafis-actions">
              <button class="grafis-btn" id="btnFinishGrafis">Selesai →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

document.getElementById("btnFinishGrafis").onclick = async function () {
  const btn = document.getElementById("btnFinishGrafis");
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Menyimpan gambar...';
  }

  try {
    await __uploadGrafisImagesToFirebase();
  } catch (e) {
    console.warn('[GRAFIS] Upload error:', e);
  }

  renderGrafisThankYou();
  setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 150);
};
}

/* ============================================================
   🆕 Upload gambar grafis ke Firebase (auto-load untuk admin)
   ============================================================ */
async function __uploadGrafisImagesToFirebase() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;

  const identity = (window.appState && appState.identity) ? appState.identity : {};
  if (!identity.name) {
    console.warn('[GRAFIS] Skip upload — nama kosong');
    return;
  }

  const slug = String(identity.name).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  if (!slug) return;

  // Mapping: key internal → testKey
  const map = {
    orang: 'dap',
    rumah: 'htp',
    pohon: 'baum'
  };

  const images = {};
  let hasAny = false;

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

  if (!hasAny) {
    console.log('[GRAFIS] Tidak ada gambar untuk di-upload');
    return;
  }

  try {
    await firebase.database()
      .ref('sgs_grafis_images/' + slug)
      .set({
        meta: {
          name: identity.name,
          position: identity.position || '',
          ts: firebase.database.ServerValue.TIMESTAMP
        },
        images: images
      });

    console.log('[GRAFIS] ✅ Gambar tersimpan di Firebase untuk admin');
  } catch (e) {
    console.warn('[GRAFIS] Gagal simpan ke Firebase:', e.message);
  }
}

/* =========================================================
   THANK YOU
   ========================================================= */
function renderGrafisThankYou() {
  window.__inTestView = false;
  ensureGrafisStyles();
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="grafis-page">
      <div class="grafis-container">
        <div class="grafis-card">
          <div class="grafis-accent"></div>
          ${renderTestPageHeader({
            eyebrow: 'ASSESSMENT CENTER',
            title: 'Tes Grafis Selesai',
            subtitle: 'Semua gambar Anda telah tersimpan.',
            showBack: false
          })}
        </div>
        <div class="grafis-thank" style="margin-top:20px;">
          <h2>Tes Grafis Selesai</h2>
          <p>Semua gambar Anda telah tersimpan. Silakan lanjut ke tes berikutnya.</p>
          <div class="grafis-actions">
            <button id="btnContinueGrafis" class="grafis-btn">✅ Lanjut Tes Berikutnya</button>
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

console.log('[TEST-GRAFIS] ✓ Loaded — 11 fungsi');
