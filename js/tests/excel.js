/* ============================================================
   js/tests/excel.js
   - Tes Excel IN-APP dengan Luckysheet (persis Excel asli)
   - Anti-dobel guard: submit sekali saja
   - Anti-cheat: 2× warning → diskualifikasi
   - Output: .xlsx auto-upload ke Google Drive
   ============================================================ */

(function() {
  'use strict';

/* ============================================================
   ⚙️ DATA SISWA
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

const EXCEL_QUESTIONS = [
  "Hitung rata-rata nilai tiap siswa",
  "Tentukan jumlah siswa yang mendapatkan rata-rata nilai di atas 80",
  "Tambahkan kolom \"Keterangan\", jika rata2 >= 75 tulis \"Lulus\", selain itu tulis \"Remedial\"",
  "Hitung jumlah siswa per kelas",
  "Urutkan data siswa berdasarkan nilai rata-rata tertinggi ke terendah",
  "Tampilkan nilai tertinggi dan terendah dari kolom Rata-rata"
];

const EXCEL_TIME = 40 * 60;

/* ============================================================
   STATE
   ============================================================ */
let __excelTimer = null;
let __excelTimeLeft = 0;
let __excelWarnCount = 0;
const __EXCEL_MAX_WARN = 2;
let __excelCheat = false;
let __excelAllowTabOut = false;
let __excelBlurFn = null;
let __excelVisFn = null;
let __excelFinishing = false;
let __excelFinished = false;

/* ============================================================
   ENTRY
   ============================================================ */
function renderAdminExcelSheet() {
  // ✅ GUARD: cek dulu — kalau sudah selesai, tolak
  if (appState.completed && appState.completed.EXCEL === true) {
    alert('🔒 Tes Excel sudah selesai dan terkirim ke admin. Tidak bisa diulang.');
    if (typeof window.renderHome === 'function') window.renderHome();
    return;
  }

  // Cek juga di localStorage (kalau appState belum sync)
  try {
    const saved = JSON.parse(localStorage.getItem('completed') || '{}');
    if (saved.EXCEL === true) {
      appState.completed = appState.completed || {};
      appState.completed.EXCEL = true;
      alert('🔒 Tes Excel sudah selesai dan terkirim ke admin. Tidak bisa diulang.');
      if (typeof window.renderHome === 'function') window.renderHome();
      return;
    }
  } catch (e) {}

  // ✅ BARU: masuk tes Excel
  window.__inTestView = true;
  appState.currentTest = 'EXCEL';

  // Reset guard flags — kita baru mulai tes
  __excelFinishing = false;
  __excelFinished = false;
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
  const id = appState.identity || {};
  const nama = id.name || 'Kandidat';

  document.getElementById('app').innerHTML = `
    <div class="ist-shell">
      <div class="ist-panel">
        <div class="ist-panel-header">
          <div class="ist-header-row">
            <div style="display:flex;align-items:center;gap:15px;">
              ${renderTestLogoBadge()}
              <div>
                <div class="ist-eyebrow">ADMINISTRATIVE TEST</div>
                <h2 class="ist-title" style="margin-top:11px;">Tes Excel — In-App</h2>
                <p class="ist-subtitle">Kerjakan di aplikasi ini. Rasanya seperti Excel asli.</p>
              </div>
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
              <div class="ist-info-label">Kandidat</div>
              <div class="ist-info-value">${nama}</div>
            </div>
            <div class="ist-info-card">
              <div class="ist-info-label">Fitur</div>
              <div class="ist-info-value">Formula + Fill handle</div>
            </div>
            <div class="ist-info-card">
              <div class="ist-info-label">Output</div>
              <div class="ist-info-value">.xlsx otomatis</div>
            </div>
          </div>

          <div class="ist-instruction-card">
            <div class="ist-section-heading">
              <span class="ist-section-icon">📘</span> Petunjuk
            </div>
            <div class="ist-instruction-text">
              <ul style="margin:0;padding-left:22px;line-height:1.75;">
                <li>Kerjakan <b>persis seperti di Excel</b>.</li>
                <li>Ketik <code>=</code> di cell, lalu <b>klik cell / drag range</b> → referensi otomatis masuk.</li>
                <li>Drag <b>fill handle</b> (pojok kanan-bawah cell) untuk copy rumus.</li>
                <li>Soal ada di sheet <b>"Soal"</b> (tab bawah).</li>
                <li><b>DILARANG keluar tab</b> — 2× = diskualifikasi.</li>
              </ul>
            </div>
          </div>

          <div class="ist-instruction-card" style="background:#fff7ed;border-color:#fed7aa;">
            <div class="ist-section-heading" style="color:#9a3412;">
              <span class="ist-section-icon" style="background:#ffedd5;color:#ea580c;">⚠️</span>
              Anti-Cheat Aktif
            </div>
            <div class="ist-instruction-text" style="color:#7c2d12;">
              Keluar tab = peringatan. 2× = diskualifikasi otomatis.
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

  document.getElementById('app').innerHTML = `
    <div style="width:100%;min-height:100vh;display:flex;flex-direction:column;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 18px;background:#fff;border-bottom:1px solid #e2e8f0;">
        <div style="display:flex;align-items:center;gap:8px;font-weight:800;color:#1e293b;">
          <span style="font-size:16px;">📊</span>
          <span>Tes Excel</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-family:'Courier New',monospace;font-size:15px;font-weight:800;color:#1b4f8f;">
            ⏱ <span id="excelTimerDisplay">--:--</span>
          </span>
          <button id="btnFinishExcel" style="padding:8px 18px;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;border:0;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 3px 8px rgba(22,163,74,.28);">
            ✓ Selesai &amp; Kirim
          </button>
        </div>
      </div>
      <div id="excelContainer" style="flex:1;overflow:hidden;position:relative;"></div>
    </div>
  `;

  clearInterval(__excelTimer);
  __excelTimer = setInterval(() => {
    __excelTimeLeft--;
    const el = document.getElementById('excelTimerDisplay');
    if (el) {
      const s = Math.max(0, __excelTimeLeft);
      const m = Math.floor(s / 60).toString().padStart(2, '0');
      const sec = (s % 60).toString().padStart(2, '0');
      el.textContent = `${m}:${sec}`;
      el.style.color = s <= 60 ? '#c62828' : '#1b4f8f';
    }
    if (__excelTimeLeft <= 0) {
      clearInterval(__excelTimer);
      finishExcelTest(true);
    }
  }, 1000);

  initLuckysheet();
  attachExcelAntiCheat();

  document.getElementById('btnFinishExcel').onclick = confirmFinishExcel;
}

/* ============================================================
   INIT LUCKYSHEET
   ============================================================ */
function initLuckysheet() {
  if (typeof luckysheet === 'undefined') {
    alert('⚠️ Library Luckysheet belum dimuat. Refresh halaman.');
    return;
  }

  const id = appState.identity || {};
  const nama = id.name || 'Kandidat';
  const posisi = id.position || '-';
  const tanggal = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const sheet1Data = [];

  sheet1Data.push([{ v: 'FORM KANDIDAT', m: 'FORM KANDIDAT', bl: 1, fs: 14, fc: '#1e40af' }]);

  sheet1Data.push([
    { v: 'Nama:', m: 'Nama:', bl: 1 },
    { v: nama, m: nama },
    { v: '', m: '' },
    { v: 'Posisi:', m: 'Posisi:', bl: 1 },
    { v: posisi, m: posisi }
  ]);

  sheet1Data.push([
    { v: 'Tanggal:', m: 'Tanggal:', bl: 1 },
    { v: tanggal, m: tanggal },
    { v: '', m: '' },
    { v: 'Tes:', m: 'Tes:', bl: 1 },
    { v: 'Excel In-App', m: 'Excel In-App' }
  ]);

  sheet1Data.push([{ v: '', m: '' }]);

  const headerRow = ['No', 'Nama Siswa', 'Kelas', 'MTK', 'IPA', 'IPS', 'Rata-rata', 'Keterangan'];
  sheet1Data.push(headerRow.map(h => ({ v: h, m: h, bl: 1, bg: '#dbeafe', fc: '#1e40af' })));

  EXCEL_STUDENTS.forEach(s => {
    sheet1Data.push([
      { v: s.no, m: String(s.no) },
      { v: s.nama, m: s.nama },
      { v: s.kelas, m: s.kelas },
      { v: s.mtk, m: String(s.mtk) },
      { v: s.ipa, m: String(s.ipa) },
      { v: s.ips, m: String(s.ips) },
      { v: '', m: '' },
      { v: '', m: '' }
    ]);
  });

  const sheet2Data = [];
  sheet2Data.push([{ v: 'DAFTAR SOAL', m: 'DAFTAR SOAL', bl: 1, fs: 14, fc: '#1e40af' }]);
  sheet2Data.push([{ v: 'Kerjakan pada sheet "Data Siswa" menggunakan formula Excel.', m: 'Kerjakan pada sheet "Data Siswa" menggunakan formula Excel.' }]);
  sheet2Data.push([{ v: '', m: '' }]);

  EXCEL_QUESTIONS.forEach((q, i) => {
    sheet2Data.push([
      { v: i + 1, m: String(i + 1), bl: 1 },
      { v: q, m: q }
    ]);
  });

  luckysheet.create({
    container: 'excelContainer',
    lang: 'en',
    title: '',
    data: [
      {
        name: 'Data Siswa',
        color: '',
        status: '1',
        order: '0',
        hide: 0,
        row: 200,
        column: 20,
        defaultRowHeight: 24,
        defaultColWidth: 100,
        celldata: [],
        config: {
          merge: {},
          rowlen: {
            '1': 26,
            '2': 26
          },
          columnlen: {
            '0': 50,
            '1': 180,
            '2': 90,
            '3': 70,
            '4': 70,
            '5': 70,
            '6': 110,
            '7': 110
          }
        }
      },
      {
        name: 'Soal',
        color: '',
        status: '0',
        order: '1',
        hide: 0,
        row: 100,
        column: 5,
        defaultRowHeight: 24,
        defaultColWidth: 100,
        celldata: [],
        config: {
          columnlen: {
            '0': 50,
            '1': 600
          }
        }
      }
    ],
    hook: {
      workbookCreateAfter: function() {
        setTimeout(() => {
          try {
            luckysheet.setSheetActive(0);
            for (let r = 0; r < sheet1Data.length; r++) {
              for (let c = 0; c < sheet1Data[r].length; c++) {
                const cell = sheet1Data[r][c];
                if (cell && (cell.v !== undefined && cell.v !== '')) {
                  luckysheet.setCellValue(r, c, cell.v, { isRefresh: false });
                }
              }
            }
            luckysheet.setSheetActive(1);
            for (let r = 0; r < sheet2Data.length; r++) {
              for (let c = 0; c < sheet2Data[r].length; c++) {
                const cell = sheet2Data[r][c];
                if (cell && (cell.v !== undefined && cell.v !== '')) {
                  luckysheet.setCellValue(r, c, cell.v, { isRefresh: false });
                }
              }
            }
            luckysheet.setSheetActive(0);
            luckysheet.refresh();
            console.log('[EXCEL] ✓ Luckysheet siap — kandidat:', nama);
          } catch (e) {
            console.error('[EXCEL] Isi data error:', e);
          }
        }, 300);
      }
    }
  });

  console.log('[EXCEL] Luckysheet initialized');
}

/* ============================================================
   ANTI-CHEAT
   ============================================================ */
function attachExcelAntiCheat() {
  if (__excelBlurFn) window.removeEventListener('blur', __excelBlurFn);
  if (__excelVisFn) document.removeEventListener('visibilitychange', __excelVisFn);

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

  __excelVisFn = () => { if (document.hidden) __excelBlurFn(); };

  window.addEventListener('blur', __excelBlurFn);
  document.addEventListener('visibilitychange', __excelVisFn);
}

function showExcelWarning(count) {
  __excelAllowTabOut = true;
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;z-index:99999;background:rgba(10,20,35,.85);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;`;
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
              Anda terdeteksi keluar dari tab tes <b>${__EXCEL_MAX_WARN}×</b>. Hubungi admin.
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
  if (__excelFinishing || __excelFinished) return;
  if (!confirm('Kirim hasil Tes Excel sekarang?\n\nFile .xlsx akan otomatis terkirim ke admin.')) return;

  __excelAllowTabOut = true;

  const btnFinish = document.getElementById('btnFinishExcel');
  if (btnFinish) {
    btnFinish.disabled = true;
    btnFinish.style.opacity = '0.5';
    btnFinish.style.cursor = 'not-allowed';
    btnFinish.textContent = '⏳ Mengirim...';
  }

  finishExcelTest(false);
}

async function finishExcelTest(timeUp) {
  // Guard: cegah dobel eksekusi
  if (__excelFinishing || __excelFinished) {
    console.warn('[EXCEL] finishExcelTest dipanggil lagi — diabaikan');
    return;
  }
  __excelFinishing = true;

  clearInterval(__excelTimer);
  __excelAllowTabOut = true;
  window.__inTestView = false;

  if (__excelBlurFn) { window.removeEventListener('blur', __excelBlurFn); __excelBlurFn = null; }
  if (__excelVisFn) { document.removeEventListener('visibilitychange', __excelVisFn); __excelVisFn = null; }

  document.getElementById('app').innerHTML = `
    <div class="ist-shell">
      <div class="ist-panel">
        <div class="ist-body">
          <div class="ist-instruction-card" style="text-align:center;padding:32px 22px;">
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
            <div id="excelFinishIcon" style="display:none;">📊</div>
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
    const i = document.getElementById('excelFinishIcon');
    const t = document.getElementById('excelFinishTitle');
    const m = document.getElementById('excelFinishMsg');
    const b = document.getElementById('excelFinishBar');
    if (i) i.textContent = icon;
    if (t) t.textContent = title;
    if (m) m.textContent = msg;
    if (b) b.style.width = pct + '%';
  };

  try {
    if (typeof XLSX === 'undefined') throw new Error('Library XLSX belum dimuat. Refresh halaman.');

    setUI('📊', 'Membuat file .xlsx...', 'Mengumpulkan jawaban Anda...', 30);
    await new Promise(r => setTimeout(r, 300));

    const xlsxBlob = generateExcelBlob();
    const filename = buildExcelFilename();

    setUI('📤', 'Mengirim ke admin...', 'Mengunggah file .xlsx...', 60);
    await uploadExcelToGAS(xlsxBlob, filename);

    // ✅ Tandai selesai
    __excelFinished = true;

    // ✅ Simpan flag di localStorage — biar tahan refresh
    try {
      const saved = JSON.parse(localStorage.getItem('completed') || '{}');
      saved.EXCEL = true;
      localStorage.setItem('completed', JSON.stringify(saved));
    } catch (e) {}

    setUI('✅', 'Berhasil Terkirim!', 'Hasil Anda sudah diterima admin. Halaman akan dimuat ulang...', 100);

    appState.completed = appState.completed || {};
    appState.completed.EXCEL = true;

    if (typeof window.markTestCompleted === 'function') {
      try { window.markTestCompleted('EXCEL'); } catch (e) {}
    }

    if (typeof window.updateDownloadButtonState === 'function') {
      try { window.updateDownloadButtonState(); } catch (e) {}
    }

    // ✅ RELOAD halaman (bukan renderHome) — paksa state fresh dari localStorage
    setTimeout(() => {
      window.__inTestView = false;
      try {
        window.location.reload();
      } catch (e) {
        if (typeof window.renderHome === 'function') window.renderHome();
      }
    }, 2500);

  } catch (err) {
    console.error('[EXCEL] Finish error:', err);
    // Reset guard supaya bisa retry
    __excelFinishing = false;
    setUI('❌', 'Gagal Kirim', 'Error: ' + err.message + ' — Screenshot & hubungi admin.', 100);
  }
}

/* ============================================================
   GENERATE .xlsx
   ============================================================ */
function generateExcelBlob() {
  const wb = XLSX.utils.book_new();

  let sheets = [];
  try {
    if (typeof luckysheet !== 'undefined' && luckysheet.getAllSheets) {
      sheets = luckysheet.getAllSheets();
    }
  } catch (e) {
    console.warn('[EXCEL] getAllSheets gagal:', e);
  }

  if (!Array.isArray(sheets) || sheets.length === 0) {
    const dataSheet = [["No","Nama Siswa","Kelas","MTK","IPA","IPS","Rata-rata","Keterangan"]];
    EXCEL_STUDENTS.forEach(s => {
      dataSheet.push([s.no, s.nama, s.kelas, s.mtk, s.ipa, s.ips, "", ""]);
    });
    const ws1 = XLSX.utils.aoa_to_sheet(dataSheet);
    ws1['!cols'] = [{wch:5},{wch:22},{wch:10},{wch:6},{wch:6},{wch:6},{wch:12},{wch:12}];
    XLSX.utils.book_append_sheet(wb, ws1, 'Data Siswa');

    const soalSheet = [["No","Soal"]];
    EXCEL_QUESTIONS.forEach((q, i) => soalSheet.push([i + 1, q]));
    const ws2 = XLSX.utils.aoa_to_sheet(soalSheet);
    ws2['!cols'] = [{wch:5},{wch:80}];
    XLSX.utils.book_append_sheet(wb, ws2, 'Soal');
  } else {
    sheets.forEach((sheetData, idx) => {
      const name = (sheetData.name || ('Sheet' + (idx + 1))).slice(0, 30);
      const celldata = sheetData.data || sheetData.celldata || [];

      let maxR = 0, maxC = 0;
      celldata.forEach(c => {
        if (c.r > maxR) maxR = c.r;
        if (c.c > maxC) maxC = c.c;
      });

      const aoa = [];
      for (let r = 0; r <= maxR; r++) {
        const rowArr = [];
        for (let c = 0; c <= maxC; c++) {
          const found = celldata.find(x => x.r === r && x.c === c);
          const cell = found ? found.v : null;
          if (cell == null) {
            rowArr.push('');
          } else if (typeof cell === 'object' && cell.m != null) {
            rowArr.push(cell.m);
          } else {
            rowArr.push(cell);
          }
        }
        aoa.push(rowArr);
      }

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = Array.from({ length: maxC + 1 }, () => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(wb, ws, name);
    });
  }

  const arrayBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([arrayBuf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

function buildExcelFilename() {
  const id = appState.identity || {};
  const safeName = (id.name || 'Peserta').replace(/[^a-zA-Z0-9]/g, '-');
  const ts = new Date().toISOString().slice(0, 10);
  return `${safeName}-Excel-${ts}.xlsx`;
}

/* ============================================================
   UPLOAD KE GAS
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

window.renderAdminExcelSheet = renderAdminExcelSheet;

console.log('[TEST-EXCEL] ✓ Loaded — Luckysheet + anti-dobel');

})();
