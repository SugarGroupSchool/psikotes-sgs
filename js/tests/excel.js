/* ============================================================
   js/tests/excel.js
   - Tes Excel IN-APP dengan x-spreadsheet (persis Excel asli)
   - Formula + panel bantuan + auto-fill
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
let __xs = null;
let __excelTimer = null;
let __excelTimeLeft = 0;
let __excelWarnCount = 0;
const __EXCEL_MAX_WARN = 2;
let __excelCheat = false;
let __excelAllowTabOut = false;
let __excelBlurFn = null;
let __excelVisFn = null;

/* ============================================================
   ENTRY
   ============================================================ */
function renderAdminExcelSheet() {
  window.__inTestView = true;
  appState.currentTest = 'EXCEL';
  appState.completed = appState.completed || {};
  appState.completed.EXCEL = false;

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
            <div>
              <div class="ist-eyebrow"><span>📊</span> ADMINISTRATIVE TEST</div>
              <h2 class="ist-title">Tes Excel — In-App</h2>
              <p class="ist-subtitle">Kerjakan di aplikasi ini. Rasanya seperti Excel asli.</p>
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
                <li>Kerjakan <b>persis seperti di Excel</b> — semua fitur tersedia.</li>
                <li>Ketik <code>=</code> di cell, lalu <b>klik cell</b> untuk referensi.</li>
                <li>Atau pakai <b>panel Rumus Cepat</b> di atas — cukup klik.</li>
                <li>Ada tombol <b>Auto-isi</b> untuk isi kolom sekaligus.</li>
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

      <!-- PANEL BANTUAN RUMUS -->
      <div style="padding:8px 14px;background:#f0f9ff;border-bottom:1px solid #bae6fd;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
        <span style="font-size:11.5px;font-weight:800;color:#0369a1;margin-right:4px;">⚡ Rumus Cepat:</span>
        <button onclick="__insertFormula('=SUM(D6:F6)')" style="padding:5px 10px;background:#fff;border:1px solid #7dd3fc;border-radius:6px;font-size:11px;font-weight:700;color:#0369a1;cursor:pointer;font-family:'Courier New',monospace;">SUM</button>
        <button onclick="__insertFormula('=AVERAGE(D6:F6)')" style="padding:5px 10px;background:#fff;border:1px solid #7dd3fc;border-radius:6px;font-size:11px;font-weight:700;color:#0369a1;cursor:pointer;font-family:'Courier New',monospace;">AVERAGE</button>
        <button onclick="__insertFormula('=COUNTIF(C6:C35,\\"X-IPA-1\\")')" style="padding:5px 10px;background:#fff;border:1px solid #7dd3fc;border-radius:6px;font-size:11px;font-weight:700;color:#0369a1;cursor:pointer;font-family:'Courier New',monospace;">COUNTIF</button>
        <button onclick="__insertFormula('=COUNTIF(G6:G35,\\">80\\")')" style="padding:5px 10px;background:#fff;border:1px solid #7dd3fc;border-radius:6px;font-size:11px;font-weight:700;color:#0369a1;cursor:pointer;font-family:'Courier New',monospace;">COUNTIF &gt;80</button>
        <button onclick="__insertFormula('=IF(G6>=75,\\"Lulus\\",\\"Remedial\\")')" style="padding:5px 10px;background:#fff;border:1px solid #7dd3fc;border-radius:6px;font-size:11px;font-weight:700;color:#0369a1;cursor:pointer;font-family:'Courier New',monospace;">IF</button>
        <button onclick="__insertFormula('=MAX(G6:G35)')" style="padding:5px 10px;background:#fff;border:1px solid #7dd3fc;border-radius:6px;font-size:11px;font-weight:700;color:#0369a1;cursor:pointer;font-family:'Courier New',monospace;">MAX</button>
        <button onclick="__insertFormula('=MIN(G6:G35)')" style="padding:5px 10px;background:#fff;border:1px solid #7dd3fc;border-radius:6px;font-size:11px;font-weight:700;color:#0369a1;cursor:pointer;font-family:'Courier New',monospace;">MIN</button>
        <button onclick="__autoFillG()" style="padding:5px 10px;background:linear-gradient(135deg,#16a34a,#059669);border:0;border-radius:6px;font-size:11px;font-weight:700;color:#fff;cursor:pointer;">⚡ Auto-isi G6:G35</button>
        <button onclick="__autoFillH()" style="padding:5px 10px;background:linear-gradient(135deg,#16a34a,#059669);border:0;border-radius:6px;font-size:11px;font-weight:700;color:#fff;cursor:pointer;">⚡ Auto-isi H6:H35</button>
        <span style="font-size:10.5px;color:#64748b;margin-left:auto;">💡 Klik cell dulu, baru klik tombol rumus</span>
      </div>

      <div id="excelContainer" style="flex:1;overflow:auto;background:#fff;"></div>
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

  initXSpreadsheet();
  attachExcelAntiCheat();

  document.getElementById('btnFinishExcel').onclick = confirmFinishExcel;
}

/* ============================================================
   PANEL BANTUAN — Insert formula ke cell aktif
   ============================================================ */
function __getActiveCell() {
  try {
    if (__xs && __xs.sheet && __xs.sheet.selector) {
      const sel = __xs.sheet.selector;
      return { ri: sel.ri, ci: sel.ci };
    }
    if (__xs && __xs.datas && __xs.datas.length > 0) {
      const d = __xs.datas[__xs.sheet.index || 0];
      if (d && d.selector) return { ri: d.selector.ri, ci: d.selector.ci };
    }
  } catch (e) {}
  return null;
}

function __insertFormula(formula) {
  const cell = __getActiveCell();
  if (!cell) {
    alert('Klik dulu cell tujuannya, baru klik tombol rumus.');
    return;
  }

  try {
    __xs.cell(cell.ri, cell.ci, formula);
    __xs.reRender();
    console.log('[EXCEL] ✓ Formula ke cell (' + cell.ri + ',' + cell.ci + '):', formula);
  } catch (e) {
    console.error('[EXCEL] Insert formula error:', e);
    alert('Gagal insert rumus: ' + e.message);
  }
}

function __autoFillG() {
  try {
    for (let i = 0; i < 30; i++) {
      const row = 5 + i;
      const rowNum = row + 1;
      __xs.cell(row, 6, `=AVERAGE(D${rowNum}:F${rowNum})`);
    }
    __xs.reRender();
    console.log('[EXCEL] ✓ Auto-fill G6:G35 =AVERAGE(Dx:Fx)');
    alert('✅ Kolom Rata-rata (G6:G35) sudah diisi otomatis.');
  } catch (e) {
    console.error('[EXCEL] Auto-fill G error:', e);
    alert('Gagal auto-isi G: ' + e.message);
  }
}

function __autoFillH() {
  try {
    for (let i = 0; i < 30; i++) {
      const row = 5 + i;
      const rowNum = row + 1;
      __xs.cell(row, 7, `=IF(G${rowNum}>=75,"Lulus","Remedial")`);
    }
    __xs.reRender();
    console.log('[EXCEL] ✓ Auto-fill H6:H35 =IF(Gx>=75,...)');
    alert('✅ Kolom Keterangan (H6:H35) sudah diisi otomatis.');
  } catch (e) {
    console.error('[EXCEL] Auto-fill H error:', e);
    alert('Gagal auto-isi H: ' + e.message);
  }
}

/* ============================================================
   INIT X-SPREADSHEET
   ============================================================ */
function initXSpreadsheet() {
  if (typeof x_spreadsheet === 'undefined') {
    alert('⚠️ Library spreadsheet belum dimuat. Refresh halaman.');
    return;
  }

  const container = document.getElementById('excelContainer');
  const containerH = window.innerHeight - 150;
  const id = appState.identity || {};
  const nama = id.name || 'Kandidat';
  const posisi = id.position || '-';
  const tanggal = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  try {
    __xs = x_spreadsheet(container, {
      mode: 'edit',
      showToolbar: true,
      showContextmenu: true,
      showBottomBar: true,
      view: {
        height: () => containerH,
        width: () => container.clientWidth
      },
      row: { len: 200, height: 24 },
      col: { len: 20, width: 100, indexWidth: 46 }
    });
  } catch (err) {
    console.error('[EXCEL] Init error:', err);
    alert('Gagal init spreadsheet: ' + err.message);
    return;
  }

  setTimeout(() => {
    try {
      const sheet1Rows = {};

      sheet1Rows[0] = { cells: { 0: { text: 'FORM KANDIDAT' } } };
      sheet1Rows[1] = {
        cells: {
          0: { text: 'Nama:' },
          1: { text: nama },
          3: { text: 'Posisi:' },
          4: { text: posisi }
        }
      };
      sheet1Rows[2] = {
        cells: {
          0: { text: 'Tanggal:' },
          1: { text: tanggal },
          3: { text: 'Tes:' },
          4: { text: 'Excel In-App' }
        }
      };
      sheet1Rows[4] = {
        cells: {
          0: { text: 'No' },
          1: { text: 'Nama Siswa' },
          2: { text: 'Kelas' },
          3: { text: 'MTK' },
          4: { text: 'IPA' },
          5: { text: 'IPS' },
          6: { text: 'Rata-rata' },
          7: { text: 'Keterangan' }
        }
      };

      EXCEL_STUDENTS.forEach((s, i) => {
        const r = 5 + i;
        sheet1Rows[r] = {
          cells: {
            0: { text: String(s.no) },
            1: { text: s.nama },
            2: { text: s.kelas },
            3: { text: String(s.mtk) },
            4: { text: String(s.ipa) },
            5: { text: String(s.ips) }
          }
        };
      });

      const sheet2Rows = {};

      sheet2Rows[0] = { cells: { 0: { text: 'DAFTAR SOAL' } } };
      sheet2Rows[1] = {
        cells: {
          0: { text: 'Kerjakan pada sheet "Data Siswa" menggunakan formula Excel.' }
        }
      };

      EXCEL_QUESTIONS.forEach((q, i) => {
        const r = i + 3;
        sheet2Rows[r] = {
          cells: {
            0: { text: String(i + 1) },
            1: { text: q }
          }
        };
      });

      __xs.loadData([
        {
          name: 'Data Siswa',
          rows: sheet1Rows,
          cols: {
            0: { width: 50 },
            1: { width: 160 },
            2: { width: 90 },
            3: { width: 70 },
            4: { width: 70 },
            5: { width: 70 },
            6: { width: 110 },
            7: { width: 110 }
          }
        },
        {
          name: 'Soal',
          rows: sheet2Rows,
          cols: {
            0: { width: 50 },
            1: { width: 500 }
          }
        }
      ]);

      console.log('[EXCEL] ✓ x-spreadsheet siap — kandidat:', nama);

    } catch (err) {
      console.error('[EXCEL] LoadData error:', err);
      alert('Gagal load data spreadsheet: ' + err.message);
    }
  }, 300);

  window.addEventListener('resize', () => {
    if (__xs) {
      try { __xs.reRender(); } catch (e) {}
    }
  });
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
  if (!confirm('Kirim hasil Tes Excel sekarang?\n\nFile .xlsx akan otomatis terkirim ke admin.')) return;
  __excelAllowTabOut = true;
  finishExcelTest(false);
}

async function finishExcelTest(timeUp) {
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

    setUI('✅', 'Berhasil Terkirim!', 'Hasil Anda sudah diterima admin. Halaman akan dimuat ulang...', 100);

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
   GENERATE .xlsx
   ============================================================ */
function generateExcelBlob() {
  const wb = XLSX.utils.book_new();

  let allSheets = [];
  try {
    if (typeof __xs.getData === 'function') {
      allSheets = __xs.getData();
    }
  } catch (e) {
    console.warn('[EXCEL] getData gagal:', e);
  }

  if (!Array.isArray(allSheets) || allSheets.length === 0) {
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
    allSheets.forEach((sheetData, idx) => {
      const name = (sheetData.name || ('Sheet' + (idx + 1))).slice(0, 30);
      const rows = sheetData.rows || {};
      const aoa = [];

      let maxR = 0, maxC = 0;
      Object.keys(rows).forEach(rk => {
        const r = parseInt(rk, 10);
        if (r > maxR) maxR = r;
        const cells = rows[rk].cells || {};
        Object.keys(cells).forEach(ck => {
          const c = parseInt(ck, 10);
          if (c > maxC) maxC = c;
        });
      });

      for (let r = 0; r <= maxR; r++) {
        const rowArr = [];
        for (let c = 0; c <= maxC; c++) {
          const cell = rows[r] && rows[r].cells && rows[r].cells[c];
          rowArr.push(cell && cell.text != null ? cell.text : '');
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

/* ============================================================
   EXPORT ke window (biar tombol panel bisa akses)
   ============================================================ */
window.renderAdminExcelSheet = renderAdminExcelSheet;
window.__insertFormula = __insertFormula;
window.__autoFillG = __autoFillG;
window.__autoFillH = __autoFillH;

console.log('[TEST-EXCEL] ✓ Loaded — x-spreadsheet v4 + panel rumus');

})();
