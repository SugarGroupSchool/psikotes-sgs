/* ============================================================
   js/tests/excel.js
   - Tes Excel IN-APP dengan Luckysheet (persis Excel asli)
   - Anti-dobel guard: submit sekali saja
   - ✅ Diskualifikasi 1× warning → minta izin admin (sama seperti SUBJECT)
   - Output: .xlsx auto-upload ke Google Drive
   - ✅ FIX: Export Excel (support Luckysheet 2D array format)
   - ✅ FIX: Retry fill data + delay 800ms
   - ✅ FIX: Konfirmasi sebelum auto-submit PDF
   - ✅ FIX: Warning untuk user mobile
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
const __EXCEL_MAX_WARN = 1;
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
  if (appState.completed && appState.completed.EXCEL === true) {
    alert('🔒 Tes Excel sudah selesai dan terkirim ke admin. Tidak bisa diulang.');
    if (typeof window.renderHome === 'function') window.renderHome();
    return;
  }

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

  window.__inTestView = true;
  appState.currentTest = 'EXCEL';

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

  const isMobile = window.innerWidth < 900
    || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  document.getElementById('app').innerHTML = `
    <div class="ist-shell">
      <div class="ist-panel">
        ${renderTestPageHeader({
          eyebrow: 'ADMINISTRATIVE TEST',
          title: 'Tes Excel — In-App',
          subtitle: 'Kerjakan di aplikasi ini. Rasanya seperti Excel asli.',
          timeLabel: `${menit} menit`
        })}

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

          ${isMobile ? `
            <div class="ist-instruction-card" style="background:#fef3c7;border-color:#fde68a;">
              <div class="ist-section-heading" style="color:#92400e;">
                <span class="ist-section-icon" style="background:#fef3c7;color:#d97706;">📱</span>
                Disarankan Pakai Laptop
              </div>
              <div class="ist-instruction-text" style="color:#78350f;">
                Tes Excel sebaiknya dikerjakan di <b>laptop atau komputer</b> untuk pengalaman terbaik.
                Di HP/tablet, tombol dan grid mungkin lebih sulit digunakan.
              </div>
            </div>
          ` : ''}

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
              </ul>
            </div>
          </div>

          <div class="ist-instruction-card" style="background:#fff7ed;border-color:#fed7aa;">
            <div class="ist-section-heading" style="color:#9a3412;">
              <span class="ist-section-icon" style="background:#ffedd5;color:#ea580c;">⚠️</span>
              Anti-Cheat Aktif
            </div>
            <div class="ist-instruction-text" style="color:#7c2d12;">
              Keluar tab = peringatan. <b>2×</b> = diskualifikasi otomatis — Anda harus minta izin admin untuk lanjut.
            </div>
          </div>

          <div class="ist-actions">
            <button class="ist-btn-primary" id="btnStartExcel" type="button">🚀 Mulai Tes Excel</button>
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
          rowlen: { '1': 26, '2': 26 },
          columnlen: {
            '0': 50, '1': 180, '2': 90, '3': 70,
            '4': 70, '5': 70, '6': 110, '7': 110
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
          columnlen: { '0': 50, '1': 600 }
        }
      }
    ],
    hook: {
      workbookCreateAfter: function() {
        let attempts = 0;
        const maxAttempts = 10;

        function tryFill() {
          attempts++;
          try {
            if (typeof luckysheet === 'undefined' || !luckysheet.setCellValue) {
              if (attempts < maxAttempts) return setTimeout(tryFill, 300);
              console.warn('[EXCEL] Luckysheet tidak ready setelah ' + maxAttempts + ' percobaan');
              return;
            }

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
            console.warn('[EXCEL] Fill attempt ' + attempts + ' gagal:', e.message);
            if (attempts < maxAttempts) setTimeout(tryFill, 300);
          }
        }

        tryFill();
      }
    }
  });

  console.log('[EXCEL] Luckysheet initialized');
}

/* ============================================================
   ANTI-CHEAT — 1× warning → 2× diskualifikasi
   ============================================================ */
function attachExcelAntiCheat() {
  if (__excelBlurFn) window.removeEventListener('blur', __excelBlurFn);
  if (__excelVisFn) document.removeEventListener('visibilitychange', __excelVisFn);

  __excelBlurFn = () => {
    if (__excelAllowTabOut || __excelCheat) return;
    if (!window.__inTestView) return;
    if (appState.currentTest !== 'EXCEL') return;

    __excelWarnCount++;

    // Warning 1× → modal amber, tes LANJUT
    if (__excelWarnCount <= __EXCEL_MAX_WARN) {
      showExcelWarning(__excelWarnCount);
      return;
    }

    // Warning 2× → DISKUALIFIKASI
    __excelCheat = true;
    clearInterval(__excelTimer);
    disqualifyExcel();
  };

  __excelVisFn = () => { if (document.hidden) __excelBlurFn(); };

  window.addEventListener('blur', __excelBlurFn);
  document.addEventListener('visibilitychange', __excelVisFn);
}

/* ============================================================
   ⚠️ MODAL PERINGATAN (1× warning)
   ============================================================ */
function showExcelWarning(warnCount) {
  __excelAllowTabOut = true;

  const old = document.getElementById('subjectWarningOverlay');
  if (old) old.remove();
  const oldExcel = document.getElementById('excelWarningOverlay');
  if (oldExcel) oldExcel.remove();

  const overlay = document.createElement('div');
  overlay.id = 'excelWarningOverlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    background: rgba(10,20,35,.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: Inter, system-ui, -apple-system, sans-serif;
    animation: excelWarnFadeIn .25s ease;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes excelWarnFadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes excelWarnSlideIn {
        from { opacity: 0; transform: translateY(20px) scale(.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes excelWarnIconPulse {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.08); }
      }
    </style>

    <div style="
      max-width: 500px;
      width: 100%;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 30px 90px rgba(0,0,0,.55);
      animation: excelWarnSlideIn .3s cubic-bezier(.2,.8,.2,1);
    ">
      <div style="
        padding: 30px 28px 24px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        text-align: center;
        color: #fff;
      ">
        <div style="
          width: 76px; height: 76px;
          margin: 0 auto 14px;
          display: grid; place-items: center;
          background: rgba(255,255,255,.2);
          border: 2px solid rgba(255,255,255,.35);
          border-radius: 22px;
          font-size: 38px;
          animation: excelWarnIconPulse 1.8s ease-in-out infinite;
        ">⚠️</div>
        <div style="
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          opacity: .9;
          margin-bottom: 6px;
        ">PERINGATAN ${warnCount}/${__EXCEL_MAX_WARN}</div>
        <div style="
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -.3px;
        ">Anda Keluar dari Tab Excel</div>
      </div>

      <div style="padding: 26px 28px 24px;">
        <p style="
          margin: 0 0 20px;
          color: #475569;
          font-size: 14.5px;
          line-height: 1.7;
          text-align: center;
        ">
          Sistem mendeteksi Anda <b style="color:#d97706;">keluar dari tab tes Excel</b>.<br><br>
          ${warnCount < __EXCEL_MAX_WARN
            ? `Ini adalah peringatan <b>terakhir</b>. Jika terulang sekali lagi, Anda akan <b style="color:#dc2626;">otomatis diskualifikasi</b> dan harus minta izin admin.`
            : `Jika terulang lagi, Anda akan <b style="color:#dc2626;">otomatis diskualifikasi</b>.`
          }
        </p>

        <div style="
          padding: 14px 16px;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 12px;
          font-size: 13px;
          color: #78350f;
          line-height: 1.65;
        ">
          <b>💡 Tips agar tidak terulang:</b><br>
          • Aktifkan <b>Do Not Disturb</b> di HP<br>
          • Tutup notifikasi WhatsApp / Telegram / SMS<br>
          • Jangan klik di luar tab ini<br>
          • Kerjakan tes di tempat yang tenang
        </div>

        <button id="btnExcelWarnOk" style="
          width: 100%;
          margin-top: 20px;
          padding: 15px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff;
          border: 0;
          border-radius: 12px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(217,119,6,.28);
          transition: transform .18s, box-shadow .18s, filter .18s;
        "
        onmouseover="this.style.transform='translateY(-2px)';this.style.filter='brightness(1.05)';this.style.boxShadow='0 14px 30px rgba(217,119,6,.35)';"
        onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)';this.style.boxShadow='0 10px 24px rgba(217,119,6,.28)';">
          ✅ Saya Mengerti, Lanjutkan Tes
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('btnExcelWarnOk').onclick = () => {
    overlay.remove();
    setTimeout(() => {
      __excelAllowTabOut = false;
    }, 800);
  };
}

/* ============================================================
   ❌ DISKUALIFIKASI EXCEL — Minta Izin Admin (seperti SUBJECT)
   - Reset HANYA completed.EXCEL (selectedTests tetap)
   - Data IST/DISC/PAPI/dll TETAP TERSIMPAN
   - Password jadi USED setelah admin approve
   ============================================================ */
function disqualifyExcel() {
  // 1. Set flags
  try {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USED_PRAGAS, '1');
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.DEVICE_FINISHED, '1');
    localStorage.setItem('_sgs_disqualified', '1');
  } catch (e) {}

  // 2. Reset HANYA completed.EXCEL
  try {
    const saved = JSON.parse(localStorage.getItem('completed') || '{}');
    if (saved.EXCEL) delete saved.EXCEL;
    localStorage.setItem('completed', JSON.stringify(saved));

    // ⚠️ selectedTests TIDAK diubah → EXCEL tetap muncul di home
  } catch (e) {}

  // 3. Reset state di memori
  window.__inTestView = false;
  appState.currentTest = null;
  __excelCheat = false;
  __excelAllowTabOut = false;
  __excelWarnCount = 0;

  if (appState.completed) {
    appState.completed.EXCEL = false;
  }

  // 4. Hide layar password & clear app
  const pwdScreen = document.getElementById('passwordScreen');
  if (pwdScreen) pwdScreen.classList.add('hidden');
  const appEl = document.getElementById('app');
  if (appEl) appEl.innerHTML = '';

  // 5. Tampilkan layar diskualifikasi + tombol Minta Izin
  document.body.innerHTML = `
    <div style="
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      padding: 20px; overflow-y: auto;
      background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%);
      font-family: Inter, system-ui, -apple-system, sans-serif;
    ">
      <div style="
        max-width: 540px; width: 100%;
        padding: 38px 32px 32px;
        background: #ffffff; border-radius: 24px;
        box-shadow: 0 30px 90px rgba(0,0,0,.5);
        text-align: center;
      ">
        <div style="
          width: 84px; height: 84px;
          margin: 0 auto 20px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #fee2e2, #fef2f2);
          border: 3px solid #fca5a5; border-radius: 24px;
          font-size: 44px;
          animation: excelDisqPulse 2s ease-in-out infinite;
        ">❌</div>

        <h1 style="
          margin: 0 0 10px;
          font-size: 25px; font-weight: 900;
          color: #991b1b; letter-spacing: -0.4px;
        ">Diskualifikasi</h1>

        <p style="
          margin: 0 0 20px;
          color: #64748b; font-size: 14.5px;
          line-height: 1.65;
        ">
          Anda terdeteksi <b style="color:#dc2626;">keluar dari tab tes Excel</b>.<br>
          Anda perlu <b>izin admin</b> untuk melanjutkan.
        </p>

        <div style="
          padding: 14px 16px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 14px;
          font-size: 13px; color: #166534;
          line-height: 1.75; text-align: left;
          margin-bottom: 12px;
        ">
          <div style="font-weight:800;margin-bottom:6px;font-size:13.5px;">
            ✅ Data Anda Tetap Tersimpan
          </div>
          • Tes yang sudah selesai <b>tetap aman</b><br>
          • Tes <b>Excel</b> bisa dikerjakan ulang<br>
          • Anda hanya perlu <b>izin admin</b> untuk lanjut
        </div>

        <div style="
          padding: 14px 16px;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 14px;
          font-size: 13px; color: #78350f;
          line-height: 1.75; text-align: left;
          margin-bottom: 22px;
        ">
          <div style="font-weight:800;margin-bottom:6px;font-size:13.5px;">
            📨 Langkah Selanjutnya
          </div>
          1. Klik <b>"Minta Izin Akses"</b> di bawah<br>
          2. Tunggu admin menyetujui permintaan Anda<br>
          3. Login ulang dengan <b>password baru dari admin</b><br>
          4. Lanjutkan tes Anda
        </div>

        <button id="btnExcelMintaIzin" style="
          width: 100%; padding: 15px 20px;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          color: #fff; border: 0; border-radius: 13px;
          font-family: inherit; font-size: 15px; font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 26px rgba(220,38,38,.3);
          transition: transform .18s, box-shadow .18s, filter .18s;
        "
        onmouseover="this.style.transform='translateY(-2px)';this.style.filter='brightness(1.05)';"
        onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)';">
          📨 Minta Izin Akses
        </button>

        <div style="
          margin-top: 18px;
          display: flex; align-items: center; justify-content: center;
          gap: 10px; color: #94a3b8; font-size: 12.5px;
        ">
          <span style="
            width: 8px; height: 8px; border-radius: 50%;
            background: #f59e0b;
            box-shadow: 0 0 0 4px rgba(245,158,11,.2);
            animation: excelWaitPulse 1.4s ease-in-out infinite;
          "></span>
          Butuh izin admin untuk melanjutkan
        </div>
      </div>
    </div>

    <style>
      @keyframes excelDisqPulse {
        0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(220,38,38,.3); }
        50%      { transform: scale(1.06); box-shadow: 0 0 0 14px rgba(220,38,38,0); }
      }
      @keyframes excelWaitPulse {
        0%, 100% { transform: scale(1);    opacity: 1; }
        50%      { transform: scale(1.35); opacity: .7; }
      }
    </style>
  `;

  // 6. Handle tombol "Minta Izin Akses"
  document.getElementById('btnExcelMintaIzin').onclick = () => {
    const btn = document.getElementById('btnExcelMintaIzin');
    btn.disabled = true;
    btn.textContent = '⏳ Mengirim permintaan...';
    btn.style.opacity = '.7';
    btn.style.cursor = 'wait';

    __excelSendRequestToAdmin()
      .then(() => {
        __excelShowWaitingApprovalScreen();
      })
      .catch(err => {
        console.error('[EXCEL] Gagal kirim request:', err);
        btn.disabled = false;
        btn.textContent = '📨 Minta Izin Akses';
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        alert('❌ Gagal mengirim permintaan: ' + (err.message || 'Coba lagi'));
      });
  };

  console.log('[EXCEL] ⚠️ Diskualifikasi — menunggu kandidat klik Minta Izin Akses');
}

/* ============================================================
   KIRIM REQUEST KE FIREBASE (khusus Excel)
   ============================================================ */
async function __excelSendRequestToAdmin() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    throw new Error('Firebase belum siap, coba refresh halaman.');
  }

  const deviceId = localStorage.getItem('_sgs_device_id') || 'unknown';

  let name = 'Kandidat';
  let position = '';
  try {
    const identity = JSON.parse(localStorage.getItem('identity') || '{}');
    name = identity.name || name;
    position = identity.position || position;
  } catch (e) {}

  await firebase.database().ref('sgs_requests/' + deviceId).set({
    deviceId: deviceId,
    name: name,
    position: position,
    status: 'pending',
    reason: 'diskualifikasi_excel',
    requestedAt: firebase.database.ServerValue.TIMESTAMP,
    userAgent: navigator.userAgent.slice(0, 200)
  });

  console.log('[EXCEL] ✅ Request izin akses terkirim ke admin:', deviceId);
}

/* ============================================================
   LAYAR "MENUNGGU PERSETUJUAN ADMIN" (khusus Excel)
   ============================================================ */
function __excelShowWaitingApprovalScreen() {
  document.body.innerHTML = `
    <div style="
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      padding: 20px; overflow-y: auto;
      background: linear-gradient(135deg, #92400e 0%, #f59e0b 100%);
      font-family: Inter, system-ui, -apple-system, sans-serif;
    ">
      <div style="
        max-width: 500px; width: 100%;
        padding: 40px 32px 34px;
        background: #ffffff; border-radius: 24px;
        box-shadow: 0 30px 90px rgba(0,0,0,.5);
        text-align: center;
      ">
        <div style="
          width: 84px; height: 84px;
          margin: 0 auto 20px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #fef3c7, #fef9c3);
          border: 3px solid #fde68a; border-radius: 24px;
          font-size: 44px;
        ">⏳</div>

        <h1 style="
          margin: 0 0 12px;
          font-size: 22px; font-weight: 900;
          color: #92400e; letter-spacing: -0.3px;
        ">Menunggu Persetujuan Admin</h1>

        <p style="
          margin: 0 0 22px;
          color: #475569; font-size: 14.5px;
          line-height: 1.65;
        ">
          Permintaan izin Anda sudah terkirim.<br>
          Mohon tunggu admin meninjau permintaan ini.<br><br>
          <b>Halaman akan otomatis dimuat ulang setelah disetujui.</b>
        </p>

        <div style="
          padding: 14px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 12.5px; color: #475569;
          line-height: 1.7; text-align: left;
        ">
          <div style="margin-bottom:4px;"><b>Status:</b> Menunggu</div>
          <div><b>Tes:</b> Excel</div>
          <div><b>Waktu:</b> ${new Date().toLocaleString('id-ID', {
            day: '2-digit', month: 'short',
            hour: '2-digit', minute: '2-digit'
          })}</div>
        </div>

        <div style="
          margin-top: 22px;
          display: flex; align-items: center; justify-content: center;
          gap: 10px; color: #94a3b8; font-size: 12.5px;
        ">
          <span style="
            width: 10px; height: 10px; border-radius: 50%;
            background: #f59e0b;
            box-shadow: 0 0 0 5px rgba(245,158,11,.2);
            animation: excelWaitPulse2 1.4s ease-in-out infinite;
          "></span>
          Menunggu...
        </div>
      </div>
    </div>

    <style>
      @keyframes excelWaitPulse2 {
        0%, 100% { transform: scale(1);    opacity: 1; }
        50%      { transform: scale(1.35); opacity: .7; }
      }
    </style>
  `;

  const deviceId = localStorage.getItem('_sgs_device_id') || 'unknown';

  if (typeof firebase === 'undefined' || !firebase.apps.length) return;

  firebase.database()
    .ref('sgs_requests/' + deviceId)
    .on('value', (snap) => {
      const req = snap.val();
      if (!req) return;

      // ✅ APPROVED → Hapus flags & reload ke login
      if (req.status === 'approved') {
        console.log('[EXCEL] ✅ Admin approved → reload ke login');

        try {
          localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.DEVICE_FINISHED);
          localStorage.removeItem('_sgs_disqualified');
          localStorage.removeItem('_sgs_lock');
          sessionStorage.removeItem('_sgs_retake_processed');
        } catch (e) {}

        document.body.innerHTML = `
          <div style="
            position: fixed; inset: 0; z-index: 2147483647;
            display: flex; align-items: center; justify-content: center;
            padding: 20px;
            background: linear-gradient(135deg, #065f46 0%, #16a34a 100%);
            font-family: Inter, system-ui, -apple-system, sans-serif;
          ">
            <div style="
              max-width: 440px; width: 100%;
              padding: 40px 32px 34px;
              background: #ffffff; border-radius: 24px;
              box-shadow: 0 30px 90px rgba(0,0,0,.5);
              text-align: center;
            ">
              <div style="
                width: 80px; height: 80px;
                margin: 0 auto 22px;
                display: grid; place-items: center;
                background: linear-gradient(135deg, #d1fae5, #ecfdf5);
                border: 3px solid #86efac; border-radius: 24px;
                font-size: 40px;
              ">✅</div>

              <h1 style="
                margin: 0 0 12px;
                font-size: 22px; font-weight: 900;
                color: #065f46;
              ">Disetujui!</h1>

              <p style="
                margin: 0 0 16px;
                color: #475569; font-size: 14.5px;
                line-height: 1.65;
              ">
                Admin sudah menyetujui permintaan Anda.<br>
                Silakan login dengan <b>password baru dari admin</b>.
              </p>

              <div style="font-size: 13px; color: #94a3b8;">
                Memuat ulang halaman...
              </div>

              <div style="
                width: 100%; height: 4px;
                background: #e2e8f0; border-radius: 999px;
                margin-top: 12px; overflow: hidden;
              ">
                <div id="excelApprovedBar" style="
                  width: 0%; height: 100%;
                  background: linear-gradient(90deg, #22c55e, #16a34a);
                  border-radius: inherit;
                  transition: width 2s linear;
                "></div>
              </div>
            </div>
          </div>
        `;

        setTimeout(() => {
          const bar = document.getElementById('excelApprovedBar');
          if (bar) bar.style.width = '100%';
        }, 100);

        setTimeout(() => {
          try { window.location.reload(); } catch (e) {
            window.location.href = window.location.href;
          }
        }, 2000);
      }

      // ❌ REJECTED → Tampilkan pesan ditolak
      if (req.status === 'rejected') {
        console.log('[EXCEL] ❌ Admin rejected');
        alert('❌ Permintaan izin Anda ditolak oleh admin.\n\nSilakan hubungi panitia untuk informasi lebih lanjut.');
      }
    });
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
        ${renderTestPageHeader({
          eyebrow: 'ADMINISTRATIVE TEST',
          title: 'Tes Excel',
          subtitle: timeUp ? 'Waktu habis — mengirim hasil…' : 'Mengirim hasil…',
          showBack: false
        })}
        <div class="ist-body">
          <div class="ist-instruction-card" style="text-align:center;padding:32px 22px;">
            <div id="excelFinishIcon" style="font-size:60px;line-height:1;margin-bottom:14px;">📊</div>
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

    __excelFinished = true;

    try {
      const saved = JSON.parse(localStorage.getItem('completed') || '{}');
      saved.EXCEL = true;
      localStorage.setItem('completed', JSON.stringify(saved));
    } catch (e) {}

    appState.completed = appState.completed || {};
    appState.completed.EXCEL = true;

    if (typeof window.markTestCompleted === 'function') {
      try { window.markTestCompleted('EXCEL'); } catch (e) {}
    }

    if (typeof window.updateDownloadButtonState === 'function') {
      try { window.updateDownloadButtonState(); } catch (e) {}
    }

    setUI('✅', 'Excel Terkirim!', 'Memeriksa status tes...', 100);

    setTimeout(() => {
      window.__inTestView = false;

      const allDone = (typeof window.allTestsCompleted === 'function')
        ? window.allTestsCompleted()
        : false;

      if (allDone) {
        setUI('✅', 'Semua Tes Selesai!', 'Excel sudah terkirim ke admin.', 100);

        setTimeout(() => {
          const ok = confirm(
            'Semua tes sudah selesai! ✅\n\n' +
            'Klik OK untuk mengirim HASIL TES (PDF) ke admin sekarang.\n\n' +
            'Pastikan koneksi internet stabil sebelum melanjutkan.'
          );

          if (ok) {
            try { document.getElementById('app').innerHTML = ''; } catch (e) {}
            if (typeof window.startSubmitProcess === 'function') {
              window.startSubmitProcess();
            } else if (typeof window.renderHome === 'function') {
              window.renderHome();
            }
          } else {
            if (typeof window.renderHome === 'function') {
              window.renderHome();
            } else {
              window.location.reload();
            }
          }
        }, 1200);
      } else {
        setUI('🏠', 'Kembali ke beranda…', 'Excel sudah terkirim ke admin.', 100);

        setTimeout(() => {
          if (typeof window.renderHome === 'function') {
            window.renderHome();
          } else {
            window.location.reload();
          }
        }, 1000);
      }
    }, 800);

  } catch (err) {
    console.error('[EXCEL] Finish error:', err);
    __excelFinishing = false;
    setUI('❌', 'Gagal Kirim', 'Error: ' + err.message + ' — Screenshot & hubungi admin.', 100);
  }
}

/* ============================================================
   ✅ GENERATE .xlsx — Support kedua format Luckysheet
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

      let aoa = [];
      const data2D = sheetData.data;
      const celldata = sheetData.celldata;

      if (Array.isArray(data2D) && data2D.length > 0 && Array.isArray(data2D[0])) {
        const maxR = data2D.length;
        let maxC = 0;
        data2D.forEach(row => {
          if (Array.isArray(row) && row.length > maxC) maxC = row.length;
        });

        for (let r = 0; r < maxR; r++) {
          const rowArr = [];
          for (let c = 0; c < maxC; c++) {
            const cell = data2D[r]?.[c];
            if (cell == null) {
              rowArr.push('');
            } else if (typeof cell === 'object') {
              const val = cell.v != null ? cell.v : (cell.m != null ? cell.m : '');
              rowArr.push(val);
            } else {
              rowArr.push(cell);
            }
          }
          aoa.push(rowArr);
        }
      } else if (Array.isArray(celldata) && celldata.length > 0) {
        let maxR = 0, maxC = 0;
        celldata.forEach(c => {
          if (c.r > maxR) maxR = c.r;
          if (c.c > maxC) maxC = c.c;
        });

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
      }

      if (aoa.length === 0) {
        aoa = [['(Sheet kosong)']];
      }

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const maxCols = Math.max(...aoa.map(r => r.length), 1);
      ws['!cols'] = Array.from({ length: maxCols }, () => ({ wch: 20 }));
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

console.log('[TEST-EXCEL] ✓ Loaded — Luckysheet + anti-cheat 1× warning + minta izin admin');

})();
