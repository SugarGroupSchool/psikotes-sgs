/* ============================================================
   js/07-download.js
   - Logika 2-klik tombol download PDF
   - markTestCompleted, allTestsCompleted
   - Form final + auto logout
   - PASSWORD (fallback kalau auth.js belum set)
   ============================================================ */

/* ============================================================
   PASSWORD AKTIF (fallback — auth.js bisa menimpa)
   ============================================================ */
   if (typeof PASSWORD === 'undefined') {
    var PASSWORD =
      localStorage.getItem('usedPragas') === '1'
        ? "SGS-HC-Talent27"        // sudah pernah logout → kode hangus
        : "SGS-REC-Assessment84";  // fresh → kode kandidat
  }
  
  
  /* ============================================================
     COUNTER KLIK
     ============================================================ */
  let downloadClickCount = 0;
  window.downloadClickCount = 0;
  
  
  /* ============================================================
     MARK TES SELESAI
     ============================================================ */
  function markTestCompleted(testId) {
    appState.completed = appState.completed || {};
    appState.completed[testId] = true;
  
    // Simpan ke localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('completed') || '{}');
      saved[testId] = true;
      localStorage.setItem('completed', JSON.stringify(saved));
    } catch (e) {}
  
    // Update tombol download
    updateDownloadButtonState();
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
     UPDATE STATUS TOMBOL DOWNLOAD
     ============================================================ */
  function updateDownloadButtonState() {
    const pdfBtn = document.getElementById('btnDownloadPDF');
    if (!pdfBtn) return;
  
    const allDone = allTestsCompleted();
    const clickCount = window.downloadClickCount || 0;
  
    if (clickCount === 0) {
      // Belum pernah diklik: aktif
      pdfBtn.disabled = false;
      pdfBtn.style.opacity = '1';
      pdfBtn.style.pointerEvents = 'auto';
      pdfBtn.classList.add('blink');
      pdfBtn.innerHTML = `<span style="font-size:1.23em;vertical-align:-3px;">📄</span> Cek Tombol Download (uji unduh PDF)`;
  
    } else if (clickCount === 1) {
      // Sudah diklik sekali: tunggu semua tes selesai
      if (allDone) {
        pdfBtn.disabled = false;
        pdfBtn.style.opacity = '1';
        pdfBtn.style.pointerEvents = 'auto';
        pdfBtn.classList.add('blink');
        pdfBtn.innerHTML = `<span style="font-size:1.1em;vertical-align:-2px;">📄</span> Unduh Akhir &amp; Kumpulkan (Logout Otomatis)`;
      } else {
        pdfBtn.disabled = true;
        pdfBtn.style.opacity = '0.45';
        pdfBtn.style.pointerEvents = 'none';
        pdfBtn.classList.remove('blink');
        pdfBtn.innerHTML = `<span style="font-size:1.15em;vertical-align:-2px;">⏳</span> Sudah dicek. Silakan selesaikan semua tes yang dipilih`;
      }
  
    } else if (clickCount === 2) {
      showFinalFormAndLogout();
    }
  }
  
  
  /* ============================================================
     INSTALL HANDLER TOMBOL DOWNLOAD
     ============================================================ */
  function installPdfButtonHandler() {
    const pdfBtn = document.getElementById('btnDownloadPDF');
    if (!pdfBtn) return;
    if (pdfBtn.__handlerInstalled) return;
    pdfBtn.__handlerInstalled = true;
  
    if (typeof window.downloadClickCount !== 'number') {
      window.downloadClickCount = 0;
    }
  
    // Sinkronisasi dari sessionStorage
    try {
      const saved = sessionStorage.getItem('dlClick');
      if (saved !== null) {
        window.downloadClickCount = parseInt(saved, 10) || 0;
      }
    } catch (e) {}
  
    pdfBtn.onclick = function () {
      if (pdfBtn.__busy) return;
  
      const allDone = allTestsCompleted();
      const clickCount = window.downloadClickCount || 0;
  
      /* ============================================================
         KLIK 1: UJI DOWNLOAD
         ============================================================ */
      if (clickCount === 0) {
        pdfBtn.__busy = true;
  
        try {
          if (typeof window.generatePDF === 'function') {
            window.generatePDF();
          } else {
            alert('Fungsi generatePDF() belum tersedia. Hubungi tim IT.');
            pdfBtn.__busy = false;
            return;
          }
        } finally {
          setTimeout(() => { pdfBtn.__busy = false; }, 500);
        }
  
        window.downloadClickCount = 1;
        try { sessionStorage.setItem('dlClick', '1'); } catch (e) {}
  
        // Jika semua tes sudah selesai → langsung ke final
        if (allDone) {
          window.downloadClickCount = 2;
          try { sessionStorage.setItem('dlClick', '2'); } catch (e) {}
          showFinalFormAndLogout();
          return;
        }
  
        // Ubah tombol ke mode menunggu
        pdfBtn.disabled = true;
        pdfBtn.style.opacity = '0.45';
        pdfBtn.style.pointerEvents = 'none';
        pdfBtn.classList.remove('blink');
        pdfBtn.innerHTML = `<span style="font-size:1.15em;vertical-align:-2px;">⏳</span> Sudah dicek. Silakan selesaikan semua tes yang dipilih`;
  
        // Tampilkan pesan
        const cekMsg = document.getElementById('cekDownloadMsg');
        if (cekMsg) {
          cekMsg.style.display = 'block';
          cekMsg.innerHTML = `<b>✅ Tombol sudah dicek.</b><br>Silakan kerjakan <u>semua</u> tes yang dipilih.<br><br>Setelah semuanya selesai, tombol akan aktif kembali untuk <b>unduh akhir &amp; logout otomatis</b>.`;
        }
  
        // Watcher untuk status tes
        if (window.__pdfBtnWatcher) {
          try { clearInterval(window.__pdfBtnWatcher); } catch (e) {}
        }
        window.__pdfBtnWatcher = setInterval(() => {
          if (allTestsCompleted()) {
            try { clearInterval(window.__pdfBtnWatcher); } catch (e) {}
            window.__pdfBtnWatcher = null;
  
            const btn = document.getElementById('btnDownloadPDF');
            if (btn) {
              btn.disabled = false;
              btn.style.opacity = '1';
              btn.style.pointerEvents = 'auto';
              btn.classList.add('blink');
              btn.innerHTML = `<span style="font-size:1.1em;vertical-align:-2px;">📄</span> Unduh Akhir &amp; Kumpulkan (Logout Otomatis)`;
            }
          }
        }, 700);
  
        return;
      }
  
      /* ============================================================
         KLIK 2: DOWNLOAD FINAL
         ============================================================ */
      if (clickCount === 1) {
        if (!allDone) {
          alert('Masih ada tes yang belum selesai!');
          return;
        }
  
        pdfBtn.__busy = true;
        try {
          if (typeof window.generatePDF === 'function') {
            window.generatePDF();
          } else {
            alert('Fungsi generatePDF() belum tersedia.');
            pdfBtn.__busy = false;
            return;
          }
        } finally {
          setTimeout(() => { pdfBtn.__busy = false; }, 500);
        }
  
        window.downloadClickCount = 2;
        try { sessionStorage.setItem('dlClick', '2'); } catch (e) {}
  
        showFinalFormAndLogout();
      }
    };
  
    updateDownloadButtonState();
  }
  
  
  /* ============================================================
     FORM FINAL + LOGOUT OTOMATIS
     ============================================================ */
  function showFinalFormAndLogout() {
    const formURL = 'https://forms.gle/G69K56TRfxNnBXtr9';
  
    const box = document.getElementById('downloadPDFBox');
    if (box) {
      box.innerHTML = `
        <div style="text-align:center;margin-top:24px;">
          <div style="color:#c00;font-weight:600;margin-bottom:14px;line-height:1.6;">
            ✅ Hasil akhir telah diunduh.<br>
            <b>Silakan unggah PDF hasil tes ke link berikut (dibuka otomatis):</b><br>
            <a href="${formURL}" target="_blank" rel="noopener noreferrer" style="font-weight:bold;color:#1565c0;word-break:break-all;">${formURL}</a><br>
            Sistem akan <b>logout otomatis</b> sesaat lagi.
          </div>
        </div>
      `;
    }
  
    // Buka Google Form
    try {
      window.open(formURL, '_blank', 'noopener,noreferrer');
    } catch (e) {}
  
    // Auto logout setelah 1.5 detik
setTimeout(() => {
  // ✅ HAPUS SEMUA state — fresh total
  try {
    localStorage.removeItem('identity');
    localStorage.removeItem('completed');
    localStorage.removeItem('selectedTests');
    localStorage.removeItem('usedPragas');
    sessionStorage.removeItem('dlClick');
  } catch (e) {}
  window.downloadClickCount = 0;
  location.reload();
}, 1500);
  }
  
  
  /* ============================================================
     EXPORT
     ============================================================ */
  window.markTestCompleted         = markTestCompleted;
  window.allTestsCompleted         = allTestsCompleted;
  window.updateDownloadButtonState = updateDownloadButtonState;
  window.installPdfButtonHandler   = installPdfButtonHandler;
  window.showFinalFormAndLogout    = showFinalFormAndLogout;
