/* =========================================================
   UTILITAS UMUM
   ========================================================= */

/** Hitung umur dari DOB */
function calculateAge(dob) {
  if (!dob) return '';
  const birth = new Date(dob);
  const today = new Date();
  let years  = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth()    - birth.getMonth();
  let days   = today.getDate()     - birth.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) { years -= 1; months += 12; }
  return `${years} tahun ${months} bulan ${days} hari`;
}

/** Normalisasi huruf A-E */
function normalizeLetter(v) {
  if (v == null) return '';
  const s = String(v).trim();
  const m = s.match(/^[A-E]/i);
  return m ? m[0].toUpperCase() : s.toUpperCase();
}

/** Ambil kode subtes dari nama lengkap (SE, WA, AN, ...) */
function getSubtestCode(name = '') {
  const n = String(name || '').toUpperCase();
  const m = n.match(/\b(SE|WA|AN|GE|RA|ZR|FA|WU|ME)\b/);
  if (m) return m[1];
  for (const k of ['SE','WA','AN','GE','RA','ZR','FA','WU','ME']) {
    if (n.includes(k)) return k;
  }
  return n.slice(0,2);
}

/** Progress bar berdasarkan currentTest */
function calculateProgress() {
  if (!appState.currentTest) return 0;
  const map = {
    IST:     () => (appState.currentQuestion / tests.IST.subtests[appState.currentSubtest].questions.length) * 100,
    KRAEPLIN:() => ((appState.currentColumn + 1) / tests.KRAEPLIN.columns.length) * 100,
    DISC:    () => (appState.currentQuestion / tests.DISC.questions.length) * 100,
    PAPI:    () => (appState.currentQuestion / tests.PAPI.questions.length) * 100,
    BIGFIVE: () => (appState.currentQuestion / tests.BIGFIVE.questions.length) * 100,
  };
  return map[appState.currentTest] ? map[appState.currentTest]() : 0;
}

/** Escape HTML */
function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/** Format detik → MM:SS */
function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Injek gaya sekali saja */
function injectStyleOnce(id, cssText) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = cssText;
  document.head.appendChild(s);
}

/** Scroll halus ke elemen */
function scrollToElement(el, block = 'start') {
  if (!el) return;
  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block }), 200);
}

/* ============================================================
   ✅ TEST LOGO HEADER — badge logo (backward compat)
   ============================================================ */
function renderTestLogoBadge(size = 'normal') {
  const logoUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO)
    ? APP_CONFIG.LOGO
    : 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png';

  const cls = size === 'small'
    ? 'test-logo-badge test-logo-badge--small'
    : (size === 'large'
        ? 'test-logo-badge test-logo-badge--large'
        : 'test-logo-badge');

  return `
    <div class="${cls}">
      <img
        src="${logoUrl}"
        alt="Sugar Group Schools"
        loading="eager"
        decoding="async"
        onerror="this.style.display='none';this.parentElement.innerHTML='<div class=&quot;test-logo-badge__fallback&quot;>SGS</div>';"
      >
    </div>
  `;
}

/** Legacy: renderTestLogoHeader — tetap ada untuk backward compat */
function renderTestLogoHeader({ eyebrow, title, subtitle, centered = true, size = 'normal' }) {
  if (centered) {
    return `
      <div class="test-logo-header test-logo-header--centered">
        ${renderTestLogoBadge(size)}
        <div style="text-align:center;width:100%;">
          ${eyebrow ? `<div class="ist-eyebrow" style="justify-content:center;">${eyebrow}</div>` : ''}
          ${title ? `<h2 class="ist-title" style="margin:8px 0 7px;">${title}</h2>` : ''}
          ${subtitle ? `<p class="ist-subtitle">${subtitle}</p>` : ''}
        </div>
      </div>
    `;
  }
  return `
    <div class="test-logo-header" style="justify-content:center;">
      ${renderTestLogoBadge(size)}
      <div>
        ${eyebrow ? `<div class="ist-eyebrow">${eyebrow}</div>` : ''}
        ${title ? `<h2 class="ist-title" style="margin-top:11px;">${title}</h2>` : ''}
        ${subtitle ? `<p class="ist-subtitle">${subtitle}</p>` : ''}
      </div>
    </div>
  `;
}

/* ============================================================
   ✅ GO BACK HOME — kembali ke beranda dengan aman
   - Konfirmasi kalau ada tes yang sedang jalan
   - Bersihkan semua timer & overlay
   - Reset __inTestView
   ============================================================ */
function goBackHome() {
  const hasActiveTimer =
    (typeof appState !== 'undefined' && appState && appState.timer) ||
    (typeof appState !== 'undefined' && appState && appState.typingTimer) ||
    (typeof appState !== 'undefined' && appState && appState.timerActive);

  if (hasActiveTimer && window.__inTestView === true) {
    const ok = confirm('Kembali ke beranda? Progres tes ini tidak akan disimpan.');
    if (!ok) return;
  }

  // Clear semua timer yang mungkin jalan
  try { if (typeof appState !== 'undefined' && appState.timer) clearInterval(appState.timer); } catch (e) {}
  try { if (typeof appState !== 'undefined' && appState.typingTimer) clearInterval(appState.typingTimer); } catch (e) {}
  try { clearInterval(__subjectTimerInterval); } catch (e) {}
  try { clearInterval(__grafisTimer); } catch (e) {}
  try { clearInterval(__excelTimer); } catch (e) {}

  // Kraeplin cleanup
  try { if (typeof _kraeplinClickHintCleanup === 'function') _kraeplinClickHintCleanup(); } catch (e) {}
  try { if (typeof removeOverlay === 'function') removeOverlay(); } catch (e) {}
  try { if (typeof setKraeplinBlur === 'function') setKraeplinBlur(false); } catch (e) {}

  // Reset state test
  try {
    if (typeof appState !== 'undefined' && appState) {
      appState.timerActive = false;
      appState.timer = null;
      appState.typingTimer = null;
    }
  } catch (e) {}

  window.__inTestView = false;

  // Render home
  if (typeof window.renderHome === 'function') {
    window.renderHome();
  } else {
    window.location.reload();
  }
}

/* ============================================================
   ✅ TEST PAGE HEADER — Unified Professional Layout
   - Logo CENTERED di atas
   - Tombol Kembali (kiri atas) → default goBackHome()
   - Time chip (kanan atas)
   ============================================================ */
function renderTestPageHeader({
  eyebrow = '',
  title = '',
  subtitle = '',
  timeLabel = '',
  onBack = 'goBackHome()',
  backLabel = 'Kembali',
  showBack = true,
  showLogo = true,
} = {}) {
  const logoUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO)
    ? APP_CONFIG.LOGO
    : 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png';

  return `
    <div class="test-page-header">
      ${showBack ? `
        <button type="button" class="test-page-back" onclick="${onBack}">
          <span class="test-page-back-icon">←</span>
          <span class="test-page-back-text">${backLabel}</span>
        </button>
      ` : ''}

      ${timeLabel ? `
        <div class="test-page-time">
          <span class="test-page-time-icon">⏱</span>
          <span>${timeLabel}</span>
        </div>
      ` : ''}

      ${showLogo ? `
        <div class="test-page-logo">
          <img
            src="${logoUrl}"
            alt="Sugar Group Schools"
            onerror="this.style.display='none';this.parentElement.innerHTML='<div class=&quot;test-logo-badge__fallback&quot;>SGS</div>';"
          >
        </div>
      ` : ''}

      ${eyebrow ? `<div class="ist-eyebrow test-page-eyebrow">${eyebrow}</div>` : ''}
      ${title ? `<h2 class="ist-title test-page-title">${title}</h2>` : ''}
      ${subtitle ? `<p class="ist-subtitle test-page-subtitle">${subtitle}</p>` : ''}
    </div>
  `;
}

window.renderTestLogoBadge    = renderTestLogoBadge;
window.renderTestLogoHeader   = renderTestLogoHeader;
window.goBackHome             = goBackHome;
window.renderTestPageHeader   = renderTestPageHeader;

console.log('[UTILS] ✓ Loaded');
