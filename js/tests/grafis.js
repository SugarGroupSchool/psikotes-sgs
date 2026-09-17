/* =========================================================
   GRAFIS TEST (DAP, HTP, BAUM) — Full Logic
   ========================================================= */

   const GRAFIS_SUBTESTS = (typeof GRAFIS_DATA !== 'undefined' && GRAFIS_DATA.subtests)
   ? GRAFIS_DATA.subtests
   : [];
 
 let __grafisTimer = null;
 let __grafisTimeLeft = 0;
 let __grafisCurrentIdx = 0;
 
 function ensureGrafisStyles() {
   // CSS sudah dimuat via <link>
 }
 
 function formatTime(sec) {
   const m = Math.floor(sec / 60);
   const d = ("0" + (sec % 60)).slice(-2);
   return `${m}:${d}`;
 }
 
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
 
 function grafisHeader(title, subtitle = "") {
   return `
     <div class="grafis-header">
       <div class="grafis-logo-wrapper">
         <img src="${APP_CONFIG.LOGO}" alt="Tes Grafis" class="grafis-logo">
       </div>
       <div class="grafis-title">
         <div class="grafis-eyebrow">ASSESSMENT CENTER</div>
         <h2>${title}</h2>
         ${subtitle ? `<p>${subtitle}</p>` : ""}
       </div>
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
               <div style="display:flex;justify-content:center;margin-bottom:12px;">
                 <div class="test-logo-badge" style="width:60px;height:60px;border-radius:18px;">
                   <img
                     src="${(typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO) ? APP_CONFIG.LOGO : 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png'}"
                     alt="Sugar Group Schools"
                     style="width:100%;height:100%;object-fit:contain;padding:6px;"
                     onerror="this.style.display='none';this.parentElement.innerHTML='<div class=&quot;test-logo-badge__fallback&quot;>SGS</div>';"
                   >
                 </div>
               </div>
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
 
   document.getElementById("btnFinishGrafis").onclick = function () {
     renderGrafisThankYou();
     setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 150);
   };
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
         <div class="grafis-thank">
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
    ENTRY POINT — dipanggil dari startTest('GRAFIS')
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
