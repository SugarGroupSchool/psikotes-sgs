/* ============================================================
   js/07-download.js
   - Logika tombol "Kirim Hasil"
   - markTestCompleted, allTestsCompleted
   - Generate PDF → Upload ke Google Drive (GAS)
   - Fallback ke Google Form kalau gagal
   - Logout otomatis setelah sukses
   - Warning "jangan keluar" saat submit
   ============================================================ */

/* ============================================================
   KONFIGURASI UPLOAD — GOOGLE APPS SCRIPT
   ============================================================ */
const GAS_UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbxCryXLdQXXbB2k6qxkmbZJF-L2ltL-QgTUygKLFAg0UNVm3NfKHDgso9nB-NomM4en/exec';
const FORM_FALLBACK_URL = 'https://forms.gle/G69K56TRfxNnBXtr9';

/* ============================================================
   PASSWORD AKTIF (fallback)
   ============================================================ */
if (typeof PASSWORD === 'undefined') {
  var PASSWORD =
    localStorage.getItem('usedPragas') === '1'
      ? "SGS-HC-Talent27"
      : "SGS-REC-Assessment84";
}

/* ============================================================
   COUNTER KLIK
   ============================================================ */
window.downloadClickCount = 0;

/* ============================================================
   MARK TES SELESAI
   ============================================================ */
function markTestCompleted(testId) {
  appState.completed = appState.completed || {};
  appState.completed[testId] = true;

  try {
    const saved = JSON.parse(localStorage.getItem('completed') || '{}');
    saved[testId] = true;
    localStorage.setItem('completed', JSON.stringify(saved));
  } catch (e) {}

  updateDownloadButtonState();

  if (typeof window.pushPresence === 'function') {
    try { window.pushPresence('active'); } catch (e) {}
  }
}

/* ============================================================
   CEK SEMUA TES SELESAI
   ============================================================ */
function allTestsCompleted() {
  const selected = appState.selectedTests || [];
  if (selected.length === 0) return false;
  const completed = appState.completed || {};
  return selected.every(id => completed[id] === true);
}

/* ============================================================
   UPDATE STATUS TOMBOL
   ============================================================ */
function updateDownloadButtonState() {
  const pdfBtn = document.getElementById('btnDownloadPDF');
  if (!pdfBtn) return;

  const allDone = allTestsCompleted();

  if (allDone) {
    pdfBtn.disabled = false;
    pdfBtn.style.opacity = '1';
    pdfBtn.style.pointerEvents = 'auto';
    pdfBtn.classList.add('blink');
    pdfBtn.innerHTML = `<span style="font-size:1.2em;vertical-align:-2px;">📤</span> Kirim Hasil Tes`;
  } else {
    const completed = appState.completed || {};
    const selected = appState.selectedTests || [];
    const done = selected.filter(id => completed[id] === true).length;
    const total = selected.length;

    pdfBtn.disabled = true;
    pdfBtn.style.opacity = '0.5';
    pdfBtn.style.pointerEvents = 'none';
    pdfBtn.classList.remove('blink');
    pdfBtn.innerHTML = `<span style="font-size:1.15em;vertical-align:-2px;">⏳</span> Selesaikan ${done}/${total} tes dulu`;
  }
}

/* ============================================================
   INSTALL HANDLER TOMBOL
   ============================================================ */
function installPdfButtonHandler() {
  const pdfBtn = document.getElementById('btnDownloadPDF');
  if (!pdfBtn) return;
  if (pdfBtn.__handlerInstalled) return;
  pdfBtn.__handlerInstalled = true;

  pdfBtn.onclick = function () {
    if (pdfBtn.__busy) return;

    if (!allTestsCompleted()) {
      alert('Masih ada tes yang belum selesai!');
      return;
    }

    pdfBtn.__busy = true;
    showSubmitPreview();
    setTimeout(() => { pdfBtn.__busy = false; }, 500);
  };

  updateDownloadButtonState();
}

/* ============================================================
   HELPER: ESCAPE HTML
   ============================================================ */
function __escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ============================================================
   HELPER: BLOB → BASE64
   ============================================================ */
function __blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/* ============================================================
   PREVIEW KONFIRMASI
   ============================================================ */
function showSubmitPreview() {
  const identity = appState.identity || {};
  const selected = appState.selectedTests || [];
  const completed = appState.completed || {};
  const completedCount = selected.filter(id => completed[id] === true).length;

  const overlay = document.createElement('div');
  overlay.id = 'submitPreviewOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99998;
    background: rgba(10,20,35,.92);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    font-family: Inter, system-ui, -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="
      width: min(520px, 100%);
      background: #fff; border-radius: 22px;
      overflow: hidden;
      box-shadow: 0 30px 90px rgba(0,0,0,.55);
    ">
      <div style="
        padding: 26px 28px 22px;
        background: linear-gradient(135deg, #1e40af, #3b82f6);
        color: #fff; text-align: center;
      ">
        <div style="font-size: 44px; line-height: 1; margin-bottom: 10px;">📋</div>
        <div style="font-size: 20px; font-weight: 900;">
          Konfirmasi Pengiriman Hasil
        </div>
        <div style="font-size: 13px; opacity: .85; margin-top: 6px;">
          Pastikan data di bawah sudah benar sebelum dikirim
        </div>
      </div>

      <div style="padding: 24px 28px 26px;">
        <div style="
          padding: 16px 18px; background: #f8fafc;
          border: 1px solid #e2e8f0; border-radius: 12px;
          margin-bottom: 18px; font-size: 13.5px; line-height: 1.9;
        ">
          <div><strong>Nama</strong> : ${__escHtml(identity.name || '-')}</div>
          <div><strong>Posisi</strong> : ${__escHtml(identity.position || '-')}</div>
          <div><strong>Email</strong> : ${__escHtml(identity.email || '-')}</div>
          <div><strong>Tes Selesai</strong> : ${completedCount}/${selected.length} tes</div>
        </div>

        <div style="
          padding: 14px 16px; background: #fffbeb;
          border: 1px solid #fde68a; border-radius: 12px;
          font-size: 12.5px; color: #78350f;
          line-height: 1.6; margin-bottom: 20px;
        ">
          <b>⚠️ Perhatian</b><br>
          Setelah dikirim, hasil tes <b>tidak dapat diubah</b>.
          Pastikan semua data sudah benar.
        </div>

        <div style="display: flex; gap: 10px;">
          <button id="btnSubmitCancel" style="
            flex: 1; padding: 14px;
            background: #f1f5f9; color: #475569;
            border: 0; border-radius: 12px;
            font-family: inherit; font-size: 14px; font-weight: 800;
            cursor: pointer;
          ">← Kembali</button>
          <button id="btnSubmitConfirm" style="
            flex: 2; padding: 14px;
            background: linear-gradient(135deg, #16a34a, #059669);
            color: #fff; border: 0; border-radius: 12px;
            font-family: inherit; font-size: 14px; font-weight: 800;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(5,150,105,.28);
          ">✅ Kirim Sekarang</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('btnSubmitCancel').onclick = () => overlay.remove();
  document.getElementById('btnSubmitConfirm').onclick = () => {
    overlay.remove();
    startSubmitProcess();
  };
}

/* ============================================================
   PROSES KIRIM
   ============================================================ */
async function startSubmitProcess() {
  const overlay = document.createElement('div');
  overlay.id = 'submitProgressOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(10,20,35,.95);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    font-family: Inter, system-ui, -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="
      width: min(480px, 100%);
      background: #fff; border-radius: 22px;
      padding: 36px 28px 32px;
      box-shadow: 0 30px 90px rgba(0,0,0,.5);
      text-align: center;
    ">
      <div id="submitIcon" style="
        width: 76px; height: 76px;
        margin: 0 auto 20px;
        display: grid; place-items: center;
        background: linear-gradient(135deg, #dbeafe, #eff6ff);
        border: 2px solid #bfdbfe;
        border-radius: 22px;
        font-size: 36px;
        animation: submitPulse 1.4s ease-in-out infinite;
      ">📄</div>

      <div id="submitTitle" style="
        font-size: 20px; font-weight: 900;
        color: #1e293b; margin-bottom: 8px;
      ">Menyiapkan PDF...</div>

      <div id="submitWarning" style="
        padding: 12px 14px;
        background: #fef3c7;
        border: 1px solid #fde68a;
        border-radius: 10px;
        font-size: 12.5px;
        color: #78350f;
        line-height: 1.6;
        margin-bottom: 14px;
        text-align: left;
      ">
        <b>⚠️ JANGAN TUTUP / KELUAR DARI HALAMAN INI</b><br>
        Proses pengiriman sedang berjalan. Keluar sebelum selesai bisa menyebabkan data tidak terkirim.
      </div>

      <div id="submitMessage" style="
        font-size: 13.5px; color: #64748b;
        line-height: 1.6; margin-bottom: 20px;
      ">Mohon tunggu, ini hanya beberapa detik.</div>

      <div style="
        height: 8px; background: #e2e8f0;
        border-radius: 999px; overflow: hidden;
        margin-bottom: 8px;
      ">
        <div id="submitProgressBar" style="
          height: 100%; width: 0%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          border-radius: inherit;
          transition: width .35s ease;
        "></div>
      </div>
      <div id="submitProgressText" style="
        font-size: 12px; color: #94a3b8;
        font-weight: 800;
      ">0%</div>
    </div>

    <style>
      @keyframes submitPulse {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.06); }
      }
    </style>
  `;

  document.body.appendChild(overlay);

  // Cegah keluar saat submit berlangsung
  const __beforeUnload = (e) => {
    // 🔥 Skip kalau ada flag khusus
    if (window.__skipBeforeUnload === true) return;

    e.preventDefault();
    e.returnValue = 'Proses pengiriman sedang berjalan. Yakin keluar?';
    return e.returnValue;
  };
  window.addEventListener('beforeunload', __beforeUnload);
  window.__submitBeforeUnload = __beforeUnload;
  const setUI = (icon, title, message, progress, text) => {
    const iconEl = document.getElementById('submitIcon');
    const titleEl = document.getElementById('submitTitle');
    const msgEl = document.getElementById('submitMessage');
    const barEl = document.getElementById('submitProgressBar');
    const textEl = document.getElementById('submitProgressText');

    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.innerHTML = message;
    if (barEl && progress !== null) barEl.style.width = progress + '%';
    if (textEl && text !== null) textEl.textContent = text;
  };

  try {
    // Step 1: Generate PDF
    setUI('📄', 'Menyiapkan PDF...', 'Mengumpulkan semua jawaban Anda.', 15, '15%');
    await new Promise(r => setTimeout(r, 300));

    if (typeof window.generatePDFBlob !== 'function') {
      throw new Error('Fungsi PDF belum tersedia');
    }

    const pdfResult = await window.generatePDFBlob();
    if (!pdfResult || !pdfResult.blob) {
      throw new Error('Gagal generate PDF');
    }

    setUI('📄', 'PDF Siap',
      `Ukuran: ${(pdfResult.size / 1024 / 1024).toFixed(2)} MB — Mengunggah...`,
      40, '40%');
    await new Promise(r => setTimeout(r, 300));

    // Step 2: Upload ke GAS
    await uploadPDFWithRetry(pdfResult, setUI);

    // Step 3: Sukses
    setUI('✅', 'Terkirim!', `
      Hasil Anda sudah diterima oleh admin.<br>
      Anda bisa menutup halaman ini.
    `, 100, '100%');

    // Lepas beforeunload setelah sukses
    if (window.__submitBeforeUnload) {
      window.removeEventListener('beforeunload', window.__submitBeforeUnload);
      window.__submitBeforeUnload = null;
    }

    setTimeout(() => {
      try {
        localStorage.setItem('_sgs_finished', '1');
        localStorage.setItem('usedPragas', '1');
        localStorage.removeItem('identity');
        localStorage.removeItem('completed');
        localStorage.removeItem('selectedTests');
      } catch (e) {}
      window.location.reload();
    }, 3000);

  } catch (err) {
    console.error('[SUBMIT] Gagal:', err);

    // Lepas beforeunload kalau gagal juga
    if (window.__submitBeforeUnload) {
      window.removeEventListener('beforeunload', window.__submitBeforeUnload);
      window.__submitBeforeUnload = null;
    }

    showSubmitFallback(err.message || 'Koneksi gagal');
  }
}

/* ============================================================
   UPLOAD PDF KE GAS (dengan retry 3×)
   ============================================================ */
async function uploadPDFWithRetry(pdfResult, setUI, maxRetry = 3) {
  const identity = appState.identity || {};

  const pdfBase64 = await __blobToBase64(pdfResult.blob);

const payload = {
  deviceId: localStorage.getItem('_sgs_device_id') || 'unknown',
  filename: pdfResult.filename,
  name: identity.name || '(tanpa nama)',
  position: identity.position || '',
  email: identity.email || '',
  pdfBase64: pdfBase64,
  pdfPassword: pdfResult.password || window.__lastPdfPassword || '-', // ← TAMBAHAN
  token: _gasToken
};

  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetry) {
    attempt++;
    try {
      if (attempt > 1) {
        setUI('🔄', `Coba ulang (${attempt}/${maxRetry})...`,
          'Koneksi tidak stabil, mencoba lagi...', null, null);
        await new Promise(r => setTimeout(r, attempt * 1500));
      }

      setUI('📤', 'Mengunggah...', `Percobaan ke-${attempt}...`, 60, '60%');

      await fetch(GAS_UPLOAD_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      setUI('📤', 'Mengunggah...', 'Menunggu konfirmasi server...', 90, '90%');
      await new Promise(r => setTimeout(r, 1500));

      return { success: true };

    } catch (err) {
      lastError = err;
      console.warn(`[SUBMIT] Attempt ${attempt} gagal:`, err.message);
    }
  }

  throw lastError || new Error('Upload gagal setelah ' + maxRetry + ' percobaan');
}

/* ============================================================
   FALLBACK — Kalau upload gagal
   ============================================================ */
function showSubmitFallback(errorMsg) {
  const prog = document.getElementById('submitProgressOverlay');
  if (prog) prog.remove();

  const overlay = document.createElement('div');
  overlay.id = 'submitFallbackOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(10,20,35,.95);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    font-family: Inter, system-ui, -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="
      width: min(520px, 100%);
      background: #fff; border-radius: 22px;
      overflow: hidden;
      box-shadow: 0 30px 90px rgba(0,0,0,.5);
    ">
      <div style="
        padding: 26px 28px 22px;
        background: linear-gradient(135deg, #dc2626, #f59e0b);
        color: #fff; text-align: center;
      ">
        <div style="font-size: 44px; line-height: 1; margin-bottom: 8px;">⚠️</div>
        <div style="font-size: 20px; font-weight: 900;">
          Gagal Mengirim
        </div>
        <div style="font-size: 13px; opacity: .9; margin-top: 6px;">
          ${__escHtml(errorMsg || 'Koneksi tidak stabil')}
        </div>
      </div>

      <div style="padding: 24px 28px 26px;">
        <div style="
          padding: 16px 18px; background: #fffbeb;
          border: 1px solid #fde68a; border-radius: 12px;
          font-size: 13px; color: #78350f;
          line-height: 1.7; margin-bottom: 20px;
        ">
          <b>Jangan khawatir!</b><br>
          Anda bisa mengirim hasil melalui <b>form online</b> berikut.
          PDF akan diunduh otomatis, lalu upload di form tersebut.
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button id="btnFallbackForm" style="
            padding: 16px;
            background: linear-gradient(135deg, #3b82f6, #1e40af);
            color: #fff; border: 0; border-radius: 12px;
            font-family: inherit; font-size: 14px; font-weight: 800;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(59,130,246,.28);
          ">📝 Kirim via Form Online</button>

          <button id="btnFallbackRetry" style="
            padding: 14px;
            background: #f1f5f9; color: #475569;
            border: 0; border-radius: 12px;
            font-family: inherit; font-size: 13px; font-weight: 800;
            cursor: pointer;
          ">🔄 Coba Lagi</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('btnFallbackRetry').onclick = () => {
    overlay.remove();
    startSubmitProcess();
  };

  document.getElementById('btnFallbackForm').onclick = async () => {
    try {
      const btn = document.getElementById('btnFallbackForm');
      btn.disabled = true;
      btn.textContent = 'Menyiapkan PDF...';

      const pdfResult = await window.generatePDFBlob();
      if (pdfResult && pdfResult.blob) {
        const url = URL.createObjectURL(pdfResult.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfResult.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }

      window.open(FORM_FALLBACK_URL, '_blank', 'noopener,noreferrer');

      btn.textContent = '✅ PDF Diunduh — Upload di Form';
      btn.style.background = 'linear-gradient(135deg, #16a34a, #059669)';

      setTimeout(() => {
        try {
          localStorage.setItem('_sgs_finished', '1');
          localStorage.setItem('usedPragas', '1');
        } catch (e) {}
        window.location.reload();
      }, 5000);

    } catch (e) {
      alert('Gagal generate PDF: ' + e.message);
      document.getElementById('btnFallbackForm').disabled = false;
      document.getElementById('btnFallbackForm').textContent = '📝 Kirim via Form Online';
    }
  };
}

/* ============================================================
   EXPORT
   ============================================================ */
window.markTestCompleted         = markTestCompleted;
window.allTestsCompleted         = allTestsCompleted;
window.updateDownloadButtonState = updateDownloadButtonState;
window.installPdfButtonHandler   = installPdfButtonHandler;
window.showSubmitPreview         = showSubmitPreview;
window.startSubmitProcess        = startSubmitProcess;

console.log('[DOWNLOAD] ✓ Loaded — submit via Google Drive + fallback Form');
