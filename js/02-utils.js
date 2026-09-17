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
   ✅ TEST LOGO HEADER — render logo konsisten (tanpa emoji)
   - Logo selalu CENTER (atas) + teks di bawah
   - Tidak ada emoji di header
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

/**
 * renderTestLogoHeader — header tes (intro & thank you)
 * @param {Object} opts
 * @param {string} opts.eyebrow   - teks kecil di atas judul
 * @param {string} opts.title     - judul utama
 * @param {string} opts.subtitle  - deskripsi
 * @param {boolean} opts.centered - default TRUE (logo di atas, teks di bawah, semua center)
 * @param {string} opts.size      - 'small' | 'normal' | 'large'
 */
function renderTestLogoHeader({ eyebrow, title, subtitle, centered = true, size = 'normal' }) {
  if (centered) {
    return `
      <div class="test-logo-header test-logo-header--centered">
        ${renderTestLogoBadge(size)}
        <div style="text-align:center;width:100%;">
          ${eyebrow
            ? `<div class="ist-eyebrow" style="justify-content:center;">${eyebrow}</div>`
            : ''}
          ${title
            ? `<h2 class="ist-title" style="margin:8px 0 7px;">${title}</h2>`
            : ''}
          ${subtitle
            ? `<p class="ist-subtitle">${subtitle}</p>`
            : ''}
        </div>
      </div>
    `;
  }

  // Non-centered: logo & teks berdampingan, tetap rapi
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

window.renderTestLogoBadge  = renderTestLogoBadge;
window.renderTestLogoHeader = renderTestLogoHeader;

console.log('[UTILS] ✓ Loaded');
