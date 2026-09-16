/* ============================================================
   js/tests/excel.js
   - Tes Excel IN-APP (grid spreadsheet, tidak buka Google Sheets)
   - Anti-cheat: 2× warning → diskualifikasi
   - Output: .xlsx auto-upload ke Google Drive
   ============================================================ */

/* ============================================================
   ⚙️ DATA SISWA (30 siswa, 3 kelas)
   ============================================================ */
const EXCEL_STUDENTS = [
  { no: 1,  nama: "Ahmad Fauzi",    kelas: "X-IPA-1", mtk: 85, ipa: 78, ips: 82 },
  { no: 2,  nama: "Budi Santoso",   kelas: "X-IPA-1", mtk: 72, ipa: 68, ips: 75 },
  { no: 3,  nama: "Citra Dewi",     kelas: "X-IPA-1", mtk: 90, ipa: 88, ips: 85 },
  { no: 4,  nama: "Dedi Kurniawan", kelas: "X-IPA-1", mtk: 65, ipa: 70, ips: 68 },
  { no: 5,  nama: "Eka Pratiwi",    kelas: "X-IPA-1", mtk: 88, ipa: 92, ips: 90 },
  { no: 6,  nama: "Fajar Ramadhan", kelas: "X-IPA-1", mtk: 75, ipa: 72, ips: 78 },
  { no: 7,  nama: "Gita Ayu",       kelas: "X-IPA-1", mtk: 82, ipa: 80, ips: 85 },
  { no: 8,  nama: "Hendra Wijaya",  kelas: "X-IPA-1", mtk: 68, ipa: 65, ips: 72 },
  { no: 9,  nama: "Indah Permata",  kelas: "X-IPA-1", mtk: 92, ipa: 89, ips: 91 },
  { no: 10, nama: "Joko Susilo",    kelas: "X-IPA-1", mtk: 77, ipa: 74, ips: 79 },
  { no: 11, nama: "Kartika Sari",   kelas: "X-IPA-2", mtk: 86, ipa: 84, ips: 83 },
  { no: 12, nama: "Lukman Hakim",   kelas: "X-IPA-2", mtk: 70, ipa: 75, ips: 72 },
  { no: 13, nama: "Maya Anggraini", kelas: "X-IPA-2", mtk: 94, ipa: 91, ips: 92 },
  { no: 14, nama: "Nanda Pratama",  kelas: "X-IPA-2", mtk: 66, ipa: 68, ips: 70 },
  { no: 15, nama: "Oki Setiawan",   kelas: "X-IPA-2", mtk: 79, ipa: 76, ips: 81 },
  { no: 16, nama: "Putri Amelia",   kelas: "X-IPA-2", mtk: 88, ipa: 85, ips: 89 },
  { no: 17, nama: "Qori Ramadhan",  kelas: "X-IPA-2", mtk: 73, ipa: 71, ips: 74 },
  { no: 18, nama: "Rina Wulandari", kelas: "X-IPA-2", mtk: 90, ipa: 87, ips: 88 },
  { no: 19, nama: "Surya Nugraha",  kelas: "X-IPA-2", mtk: 81, ipa: 83, ips: 80 },
  { no: 20, nama: "Tika Marlina",   kelas: "X-IPA-2", mtk: 69, ipa: 72, ips: 67 },
  { no: 21, nama: "Umar Abdullah",  kelas: "X-IPS-1", mtk: 76, ipa: 73, ips: 88 },
  { no: 22, nama: "Vina Oktaviani", kelas: "X-IPS-1", mtk: 84, ipa: 82, ips: 90 },
  { no: 23, nama: "Wahyu Hidayat",  kelas: "X-IPS-1", mtk: 71, ipa: 69, ips: 78 },
  { no: 24, nama: "Xavier Tanjung", kelas: "X-IPS-1", mtk: 89, ipa: 86, ips: 92 },
  { no: 25, nama: "Yuni Astuti",    kelas: "X-IPS-1", mtk: 78, ipa: 80, ips: 85 },
  { no: 26, nama: "Zaki Rahman",    kelas: "X-IPS-1", mtk: 67, ipa: 71, ips: 74 },
  { no: 27, nama: "Aisyah Nur",     kelas: "X-IPS-1", mtk: 91, ipa: 88, ips: 93 },
  { no: 28, nama: "Bagas Wijaya",   kelas: "X-IPS-1", mtk: 74, ipa: 76, ips: 80 },
  { no: 29, nama: "Cindy Lestari",  kelas: "X-IPS-1", mtk: 83, ipa: 79, ips: 86 },
  { no: 30, nama: "Dimas Saputra",  kelas: "X-IPS-1", mtk: 80, ipa: 77, ips: 82 }
];

/* ============================================================
   ⚙️ SOAL ANALISIS
   ============================================================ */
const EXCEL_QUESTIONS = [
  { id: "q2", text: "Tentukan jumlah siswa yang mendapatkan rata-rata nilai di atas 80." },
  { id: "q4", text: "Hitung jumlah siswa per kelas (X-IPA-1, X-IPA-2, X-IPS-1)." },
  { id: "q5", text: "Urutkan data siswa berdasarkan nilai rata-rata tertinggi ke terendah. Tulis 5 nama teratas beserta rata-ratanya." },
  { id: "q6", text: "Tampilkan nilai tertinggi dan terendah dari kolom Rata-rata." }
];

const EXCEL_TIME = 40 * 60; // 40 menit

/* ============================================================
   STATE
   ============================================================ */
let __excelTimer = null;
let __excelTimeLeft = 0;
let __excelAvgAnswers = {};
let __excelKetAnswers = {};
let __excelEssayAnswers = {};
let __excelWarnCount = 0;
const __EXCEL_MAX_WARN = 2;
let __excelCheat = false;
let __excelAllowTabOut = false;
let __excelBlurFn = null;
let __excelVisFn = null;

/* ============================================================
   ENTRY — dari startTest('EXCEL')
   ============================================================ */
function renderAdminExcelSheet() {
  window.__inTestView = true;
  appState.currentTest = 'EXCEL';
  appState.completed = appState.completed || {};
  appState.completed.EXCEL = false;

  __excelAvgAnswers = {};
  __excelKetAnswers = {};
  __excelEssayAnswers = {};
  __excelWarnCount = 0;
  __excelCheat = false;
  __excelAllowTabOut = false;

  renderExcelIntro();
}

/* ============================================================
   INTRO
   ============================================================ */
function renderExcelIntro() {
  const menit = Math.floor(EXCEL_TIME / 60);

  document.getElementById('app').innerHTML = `
    <div class="ist-shell">
      <div class="ist-panel">
        <div class="ist-panel-header">
          <div class="ist-header-row">
            <div>
              <div class="ist-eyebrow"><span>📊</span> ADMINISTRATIVE TEST</div>
              <h2 class="ist-title">Tes Excel — In-App</h2>
              <p class="ist-subtitle">Kerjakan langsung di dalam aplikasi. Tidak perlu buka Google Sheets.</p>
            </div>
            <div class="ist-time-chip">
              <span class="ist-time-chip-icon">⏱</span>
              <span>${menit} menit</span>
            </div>
          </div>
        </div>

        <div class="ist-body">
          <div class="ist-info-grid">
            <div class="ist-info-card">
              <div class="ist-info-label">Data</div>
              <div class="ist-info-value">${EXCEL_STUDENTS.length} siswa</div>
            </div>
            <div class="ist-info-card">
              <div class="ist-info-label">Soal</div>
              <div class="ist-info-value">6 pertanyaan</div>
            </div>
            <div class="ist-info-card">
              <div class="ist-info-label">Output</div>
              <div class="ist-info-value">.xlsx otomatis</div>
            </div>
          </div>

          <div class="ist-instruction-card">
            <div class="ist-section-heading">
              <span class="ist-section-icon">📘</span> Petunjuk Pengerjaan
            </div>
            <div class="ist-instruction-text">
              <ul style="margin:0;padding-left:22px;line-height:1.75;">
                <li>Isi kolom <b>Rata-rata</b> & <b>Keterangan</b> untuk setiap siswa.</li>
                <li><b>Keterangan</b>: tulis <b>Lulus</b> jika rata-rata ≥ 75, tulis <b>Remedial</b> jika &lt; 75.</li>
                <li>Jawab 4 soal analisis di bagian bawah grid.</li>
                <li>Gunakan <b>Tab</b> / <b>Enter</b> untuk pindah cell.</li>
                <li><b>DILARANG keluar tab</b> — 2× pelanggaran = diskualifikasi.</li>
                <li>Klik <b>Selesai</b> → file .xlsx otomatis terkirim ke admin.</li>
              </ul>
            </div>
          </div>

          <div class="ist-instruction-card" style="background:#fff7ed;border-color:#fed7aa;">
            <div class="ist-section-heading" style="color:#9a3412;">
              <span class="ist-section-icon" style="background:#ffedd5;color:#ea580c;">⚠️</span>
              Anti-Cheat Aktif
            </div>
            <div class="ist-instruction-text" style="color:#7c2d12;">
              Keluar tab / buka jendela lain = <b>peringatan</b>. 2× = <b>diskualifikasi otomatis</b>.
            </div>
          </div>

          <div class="ist-actions">
            <button class="ist-btn-primary" id="btnStartExcel" type="button">🚀 Mulai Tes Excel</button>
            <button class="ist-btn-secondary" onclick="window.__inTestView=false;renderHome()" type="button">Kembali</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnStartExcel').onclick = startExcelTest;
}

/* ============================================================
   START
   ============================================================ */
function startExcelTest() {
  __excelTimeLeft = EXCEL_TIME;

  clearInterval(__excelTimer);
  __excelTimer = setInterval(() => {
    __excelTimeLeft--;
    updateExcelTimer();
    if (__excelTimeLeft <= 0) {
      clearInterval(__excelTimer);
      finishExcelTest(true);
    }
  }, 1000);

  attachExcelAntiCheat();
  renderExcelGrid();
}

/* ============================================================
   RENDER GRID + SOAL
   ============================================================ */
function renderExcelGrid() {
  const rowsHTML = EXCEL_STUDENTS.map(s => {
    const avg = __excelAvgAnswers[s.no] || '';
    const ket = __excelKetAnswers[s.no] || '';
    return `
      <tr>
        <td style="text-align:center;">${s.no}</td>
        <td>${s.nama}</td>
        <td style="text-align:center;">${s.kelas}</td>
        <td style="text-align:center;">${s.mtk}</td>
        <td style="text-align:center;">${s.ipa}</td>
        <td style="text-align:center;">${s.ips}</td>
        <td><input class="excel-cell" data-type="avg" data-no="${s.no}" value="${avg}" oninput="onExcelInput(this)" onkeydown="onExcelKeyNav(event,this)" autocomplete="off" inputmode="decimal"></td>
        <td><input class="excel-cell" data-type="ket" data-no="${s.no}" value="${ket}" oninput="onExcelInput(this)" onkeydown="onExcelKeyNav(event,this)" autocomplete="off"></td>
      </tr>
    `;
  }).join('');

  const questionsHTML = EXCEL_QUESTIONS.map((q, i) => `
    <div style="margin-bottom:16px;">
      <div style="font-weight:700;color:#1e293b;font-size:13.5px;margin-bottom:6px;">
        ${i + 1}. ${q.text}
      </div>
      <textarea class="excel-essay" data-qid="${q.id}" rows="3"
        oninput="onExcelEssay(this)"
        placeholder="Tulis jawaban Anda di sini..."
        style="width:100%;padding:10px 12px;border:1px solid #d6e1ec;border-radius:10px;font-family:inherit;font-size:13px;resize:vertical;outline:none;background:#f9fbfd;box-sizing:border-box;">${__excelEssayAnswers[q.id] || ''}</textarea>
    </div>
  `).join('');

  document.getElementById('app').innerHTML = `
    <div class="ist-shell">
      <div class="ist-question-panel">
        <div class="ist-question-top">
          <div class="ist-question-meta">
            <div>
              <div class="ist-question-label">TES EXCEL</div>
              <div class="ist-question-badge">📊 Data Siswa & Analisis</div>
            </div>
            <div class="ist-time-chip">
              <span class="ist-time-chip-icon">⏱</span>
              <span id="excelTimerDisplay">--:--</span>
            </div>
          </div>
        </div>

        <div class="ist-question-body">
          <div class="ist-instruction-card" style="margin-bottom:14px;">
            <div class="ist-instruction-text">
              <b>Data Siswa:</b> Isi kolom <b>Rata-rata</b> (dari MTK, IPA, IPS) dan <b>Keterangan</b>
              (Lulus jika rata-rata ≥ 75, Remedial jika &lt; 75).
            </div>
          </div>

          <div class="excel-grid-wrap">
            <table class="excel-grid">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Siswa</th>
                  <th>Kelas</th>
                  <th>MTK</th>
                  <th>IPA</th>
                  <th>IPS</th>
                  <th style="background:#dbeafe;">Rata-rata</th>
                  <th style="background:#dcfce7;">Keterangan</th>
                </tr>
              </thead>
              <tbody>${rowsHTML}</tbody>
            </table>
          </div>

          <div class="ist-instruction-card" style="margin-top:24px;">
            <div class="ist-section-heading">
              <span class="ist-section-icon">📝</span>
              Soal Analisis
            </div>
          </div>

          <div style="margin-top:14px;">${questionsHTML}</div>

          <div class="ist-question-actions">
            <div class="ist-action-left"></div>
            <div class="ist-action-right">
              <button class="ist-main-btn" style="background:linear-gradient(135deg,#16a34a,#059669);" onclick="confirmFinishExcel()" type="button">
                ✓ Selesai &amp; Kirim
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  injectExcelStyles();
  updateExcelTimer();
}

/* ============================================================
   INPUT HANDLERS
   ============================================================ */
function onExcelInput(el) {
  const type = el.dataset.type;
  const no = el.dataset.no;
  const val = el.value;
  if (type === 'avg') __excelAvgAnswers[no] = val;
  else if (type === 'ket') __excelKetAnswers[no] = val;
}

function onExcelEssay(el) {
  __excelEssayAnswers[el.dataset.qid] = el.value;
}

function onExcelKeyNav(e, el) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const type = el.dataset.type;
    const no = parseInt(el.dataset.no, 10);
    const next = document.querySelector(`.excel-cell[data-type="${type}"][data-no="${no + 1}"]`);
    if (next) {
      next.focus();
      next.select();
    } else {
      el.blur();
    }
  }
}

/* ============================================================
   TIMER
   ============================================================ */
function updateExcelTimer() {
  const el = document.getElementById('excelTimerDisplay');
  if (!el) return;
  const s = Math.max(0, __excelTimeLeft);
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  el.textContent = `${m}:${sec}`;
  el.style.color = s <= 60 ? '#c62828' : '#1b4f8f';
  el.style.fontWeight = s <= 60 ? '900' : '850';
}

/* ============================================================
   CSS GRID
   ============================================================ */
function injectExcelStyles() {
  if (document.getElementById('__excelStyles')) return;
  const css = document.createElement('style');
  css.id = '__excelStyles';
  css.textContent = `
    .excel-grid-wrap {
      max-height: 480px;
      overflow: auto;
      border: 1px solid #d6e1ec;
      border-radius: 12px;
      background: #fff;
    }
    .excel-grid {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      font-family: Inter, system-ui, sans-serif;
    }
    .excel-grid thead th {
      position: sticky; top: 0;
      background: #f1f5f9;
      font-weight: 800;
      color: #334155;
      padding: 9px 10px;
      border-bottom: 2px solid #cbd5e1;
      text-align: left;
      white-space: nowrap;
      z-index: 2;
    }
    .excel-grid tbody td {
      padding: 0;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
      padding: 8px 10px;
    }
    .excel-grid tbody td:has(input) {
      padding: 0;
    }
    .excel-cell {
      width: 100%;
      padding: 8px 10px;
      border: 0;
      outline: none;
      background: #fbfdff;
      font-family: inherit;
      font-size: 12.5px;
      color: #0f172a;
      box-sizing: border-box;
      transition: background .15s, box-shadow .15s;
    }
    .excel-cell:hover { background: #f0f9ff; }
    .excel-cell:focus {
      background: #fff;
      box-shadow: inset 0 0 0 2px #3b82f6;
    }
    .excel-essay:focus {
      border-color: #3b82f6 !important;
      background: #fff !important;
      box-shadow: 0 0 0 3px rgba(59,130,246,.1);
    }
  `;
  document.head.appendChild(css);
}

/* ============================================================
   ANTI-CHEAT
   ============================================================ */
function attachExcelAntiCheat() {
  // Cleanup dulu
  if (__excelBlurFn) {
    window.removeEventListener('blur', __excelBlurFn);
    __excelBlurFn = null;
  }
  if (__excelVisFn) {
    document.removeEventListener('visibilitychange', __excelVisFn);
    __excelVisFn = null;
  }

  __excelBlurFn = () => {
    if (__excelAllowTabOut || __excelCheat) return;
    if (!window.__inTestView) return;
    if (appState.currentTest !== 'EXCEL') return;

    __excelWarnCount++;
    if (__excelWarnCount < __EXCEL_MAX_WARN) {
      showExcelWarning(__excelWarnCount);
      return;
    }
    __excelCheat = true;
    clearInterval(__excelTimer);
    disqualifyExcel();
  };

  __excelVisFn = () => {
    if (document.hidden) __excelBlurFn();
  };

  window.addEventListener('blur', __excelBlurFn);
  document.addEventListener('visibilitychange', __excelVisFn);
}

function showExcelWarning(count) {
  __excelAllowTabOut = true;

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(10,20,35,.85); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; font-family: Inter, system-ui, sans-serif;
  `;
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:22px;padding:32px 28px;max-width:460px;width:100%;text-align:center;box-shadow:0 30px 90px rgba(0,0,0,.5);">
      <div style="font-size:52px;line-height:1;margin-bottom:14px;">⚠️</div>
      <h2 style="margin:0 0 12px;color:#991b1b;font-size:22px;font-weight:900;">Peringatan ${count}/2</h2>
      <p style="color:#475569;font-size:14.5px;line-height:1.65;margin:0 0 20px;">
        Anda terdeteksi <b>keluar dari tab tes Excel</b>.<br>
        Jika terulang sekali lagi → <b>diskualifikasi otomatis</b>.
      </p>
      <div style="padding:14px;background:#fef3c7;border:1px solid #fde68a;border-radius:12px;font-size:13px;color:#78350f;text-align:left;line-height:1.6;">
        <b>💡 Tips:</b><br>
        • Aktifkan Do Not Disturb<br>
        • Tutup notifikasi WhatsApp/Telegram<br>
        • Jangan klik di luar tab ini
      </div>
      <button id="btnExcelWarnOk" style="margin-top:20px;width:100%;padding:14px;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;border:0;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;">
        Saya Mengerti, Lanjutkan
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('btnExcelWarnOk').onclick = () => {
    overlay.remove();
    setTimeout(() => { __excelAllowTabOut = false; }, 1500);
  };
}

function disqualifyExcel() {
  window.__inTestView = false;
  try {
    localStorage.setItem('_sgs_disqualified', '1');
    localStorage.setItem('_sgs_finished', '1');
    localStorage.setItem('usedPragas', '1');
  } catch (e) {}

  appState.completed = appState.completed || {};
  appState.completed.EXCEL = false;

  document.getElementById('app').innerHTML = `
    <div class="ist-shell">
      <div class="ist-panel">
        <div class="ist-body">
          <div class="ist-instruction-card" style="text-align:center;padding:40px 24px;background:#fef2f2;border-color:#fecaca;">
            <div style="font-size:60px;line-height:1;margin-bottom:16px;">❌</div>
            <h2 style="margin:0 0 12px;color:#991b1b;font-size:24px;font-weight:900;">Diskualifikasi</h2>
            <p style="color:#7c2d12;font-size:15px;line-height:1.7;margin:0 0 22px;">
              Anda terdeteksi keluar dari tab tes <b>${__EXCEL_MAX_WARN}×</b>.<br>
              Hubungi admin jika ada kendala.
            </p>
            <button onclick="location.reload()" style="padding:14px 32px;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;border:0;border-radius:12px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;">
              🔒 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   SELESAI
   ============================================================ */
function confirmFinishExcel() {
  if (!confirm('Kirim hasil Tes Excel sekarang?\n\nFile .xlsx akan otomatis terkirim ke admin.')) return;
  __excelAllowTabOut = true;
  finishExcelTest(false);
}

async function finishExcelTest(timeUp) {
  clearInterval(__excelTimer);
  __excelAllowTabOut = true;
  window.__inTestView = false;

  // Lepas listener
  if (__excelBlurFn) {
    window.removeEventListener('blur', __excelBlurFn);
    __excelBlurFn = null;
  }
  if (__excelVisFn) {
    document.removeEventListener('visibilitychange', __excelVisFn);
    __excelVisFn = null;
  }

  document.getElementById('app').innerHTML = `
    <div class="ist-shell">
      <div class="ist-panel">
        <div class="ist-body">
          <div class="ist-instruction-card" style="text-align:center;padding:32px 22px;">
            <div id="excelFinishIcon" style="font-size:50px;margin-bottom:14px;">📊</div>
            <div id="excelFinishTitle" style="font-size:18px;font-weight:900;color:#172033;margin-bottom:10px;">Menyiapkan file Excel...</div>
            <div id="excelFinishMsg" style="color:#64748b;font-size:13.5px;line-height:1.6;">Mohon tunggu, jangan tutup halaman ini.</div>
            <div style="margin-top:18px;height:6px;background:#e2e8f0;border-radius:999px;overflow:hidden;">
              <div id="excelFinishBar" style="width:0%;height:100%;background:linear-gradient(90deg,#3b82f6,#8b5cf6);transition:width .3s;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const setUI = (icon, title, msg, pct) => {
    const iconEl = document.getElementById('excelFinishIcon');
    const titleEl = document.getElementById('excelFinishTitle');
    const msgEl = document.getElementById('excelFinishMsg');
    const barEl = document.getElementById('excelFinishBar');
    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = msg;
    if (barEl) barEl.style.width = pct + '%';
  };

  try {
    if (typeof XLSX === 'undefined') {
      throw new Error('Library XLSX belum dimuat. Refresh halaman.');
    }

    setUI('📊', 'Membuat file .xlsx...', 'Mengumpulkan jawaban Anda...', 30);
    await new Promise(r => setTimeout(r, 300));

    const xlsxBlob = generateExcelBlob();
    const filename = buildExcelFilename();

    setUI('📤', 'Mengirim ke admin...', 'Mengunggah file .xlsx...', 60);
    await uploadExcelToGAS(xlsxBlob, filename);

    setUI('✅', 'Berhasil Terkirim!', 'Hasil Anda sudah diterima admin. Halaman akan dimuat ulang...', 100);

    // Mark completed
    appState.completed = appState.completed || {};
    appState.completed.EXCEL = true;

    if (typeof window.markTestCompleted === 'function') {
      try { window.markTestCompleted('EXCEL'); } catch (e) {}
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('completed') || '{}');
        saved.EXCEL = true;
        localStorage.setItem('completed', JSON.stringify(saved));
      } catch (e) {}
    }

    if (typeof window.updateDownloadButtonState === 'function') {
      try { window.updateDownloadButtonState(); } catch (e) {}
    }

    // Balik ke home setelah 2.5 detik
    setTimeout(() => {
      window.__inTestView = false;
      if (typeof window.renderHome === 'function') {
        window.renderHome();
        setTimeout(() => {
          const el = document.getElementById('homeCard') || document.getElementById('downloadPDFBox');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    }, 2500);

  } catch (err) {
    console.error('[EXCEL] Finish error:', err);
    setUI('❌', 'Gagal Kirim', 'Error: ' + err.message + ' — Screenshot & hubungi admin.', 100);
  }
}

/* ============================================================
   GENERATE .xlsx via SheetJS
   ============================================================ */
function generateExcelBlob() {
  // Sheet 1: Data siswa
  const dataSheet = [
    ["No", "Nama Siswa", "Kelas", "MTK", "IPA", "IPS", "Rata-rata", "Keterangan"]
  ];
  EXCEL_STUDENTS.forEach(s => {
    dataSheet.push([
      s.no,
      s.nama,
      s.kelas,
      s.mtk,
      s.ipa,
      s.ips,
      __excelAvgAnswers[s.no] || "",
      __excelKetAnswers[s.no] || ""
    ]);
  });

  // Sheet 2: Jawaban analisis
  const essaySheet = [["No", "Pertanyaan", "Jawaban"]];
  EXCEL_QUESTIONS.forEach((q, i) => {
    essaySheet.push([i + 1, q.text, __excelEssayAnswers[q.id] || ""]);
  });

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(dataSheet);
  const ws2 = XLSX.utils.aoa_to_sheet(essaySheet);

  ws1['!cols'] = [
    { wch: 5 }, { wch: 22 }, { wch: 10 },
    { wch: 6 }, { wch: 6 }, { wch: 6 },
    { wch: 12 }, { wch: 12 }
  ];
  ws2['!cols'] = [{ wch: 5 }, { wch: 60 }, { wch: 50 }];

  XLSX.utils.book_append_sheet(wb, ws1, "Data Siswa");
  XLSX.utils.book_append_sheet(wb, ws2, "Jawaban Analisis");

  const arrayBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([arrayBuf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

function buildExcelFilename() {
  const id = appState.identity || {};
  const safeName = (id.name || "Peserta").replace(/[^a-zA-Z0-9]/g, "-");
  const ts = new Date().toISOString().slice(0, 10);
  return `${safeName}-Excel-${ts}.xlsx`;
}

/* ============================================================
   UPLOAD .xlsx via GAS
   ============================================================ */
async function uploadExcelToGAS(blob, filename) {
  const base64 = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

  const id = appState.identity || {};
  const payload = {
    action: 'upload_excel',
    deviceId: localStorage.getItem('_sgs_device_id') || 'unknown',
    filename: filename,
    name: id.name || '(tanpa nama)',
    position: id.position || '',
    email: id.email || '',
    xlsxBase64: base64
  };

  const gasUrl = (typeof GAS_UPLOAD_URL !== 'undefined')
    ? GAS_UPLOAD_URL
    : 'https://script.google.com/macros/s/AKfycbxCryXLdQXXbB2k6qxkmbZJF-L2ltL-QgTUygKLFAg0UNVm3NfKHDgso9nB-NomM4en/exec';

  await fetch(gasUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  await new Promise(r => setTimeout(r, 1500));
  return { success: true };
}

console.log('[TEST-EXCEL-INAPP] ✓ Loaded');
