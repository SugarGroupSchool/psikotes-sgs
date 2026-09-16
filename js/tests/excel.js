/* ============================================================
   js/tests/excel.js
   - Tes Excel IN-APP (spreadsheet experience)
   - Formula support: =, +, -, *, /, SUM, AVERAGE, IF, MIN, MAX, COUNT, ROUND
   - Cell navigation (arrow, Tab, Enter), formula bar, sheet tabs
   - Anti-cheat: 2× warning → diskualifikasi
   - Output: .xlsx auto-upload ke Google Drive
   ============================================================ */

/* ============================================================
   ⚙️ DATA SISWA — prefilled ke sheet "Data Siswa"
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
  "Tentukan jumlah siswa yang mendapatkan rata-rata nilai di atas 80.",
  "Hitung jumlah siswa per kelas (X-IPA-1, X-IPA-2, X-IPS-1).",
  "Urutkan data siswa berdasarkan nilai rata-rata tertinggi ke terendah. Tulis 5 nama teratas beserta rata-ratanya.",
  "Tampilkan nilai tertinggi dan terendah dari kolom Rata-rata."
];

const EXCEL_TIME = 40 * 60;

/* ============================================================
   STATE SPREADSHEET
   ============================================================ */
const __ss = {
  sheets: [
    { id: 'data',     name: 'Data Siswa',    cols: 8, rows: 36, data: {} },
    { id: 'analisis', name: 'Jawaban Analisis', cols: 3, rows: 12, data: {} }
  ],
  activeSheet: 0,
  activeCell: { r: 0, c: 0 },
  timer: null,
  timeLeft: 0,
  warnCount: 0,
  cheat: false,
  allowTabOut: false,
  clipboard: null,
  blurFn: null,
  visFn: null,
  keyFn: null
};

const __EXCEL_MAX_WARN = 2;

/* ============================================================
   PREFILL DATA
   ============================================================ */
function __prefillSheets() {
  // Sheet 1: Data Siswa
  const s1 = __ss.sheets[0].data;
  s1.A1 = "No"; s1.B1 = "Nama Siswa"; s1.C1 = "Kelas";
  s1.D1 = "MTK"; s1.E1 = "IPA"; s1.F1 = "IPS";
  s1.G1 = "Rata-rata"; s1.H1 = "Keterangan";

  EXCEL_STUDENTS.forEach((s, i) => {
    const r = i + 2;
    s1['A' + r] = s.no;
    s1['B' + r] = s.nama;
    s1['C' + r] = s.kelas;
    s1['D' + r] = s.mtk;
    s1['E' + r] = s.ipa;
    s1['F' + r] = s.ips;
  });

  // Sheet 2: Jawaban Analisis
  const s2 = __ss.sheets[1].data;
  s2.A1 = "No"; s2.B1 = "Pertanyaan"; s2.C1 = "Jawaban";
  EXCEL_QUESTIONS.forEach((q, i) => {
    const r = i + 2;
    s2['A' + r] = i + 1;
    s2['B' + r] = q;
  });
}

/* ============================================================
   HELPERS — Cell Reference
   ============================================================ */
function colLetter(idx) {
  let s = '';
  idx = Number(idx);
  while (idx >= 0) {
    s = String.fromCharCode(65 + (idx % 26)) + s;
    idx = Math.floor(idx / 26) - 1;
  }
  return s;
}

function refToRC(ref) {
  const m = String(ref).toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  return { c: m[1].charCodeAt(0) - 65, r: parseInt(m[2], 10) - 1 };
}

function rcToRef(r, c) {
  return colLetter(c) + (r + 1);
}

/* ============================================================
   FORMULA ENGINE
   ============================================================ */
function __tokenize(s) {
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i+1]))) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      tokens.push({ t: 'num', v: parseFloat(s.slice(i, j)) });
      i = j; continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      let j = i + 1;
      while (j < s.length && s[j] !== q) j++;
      tokens.push({ t: 'str', v: s.slice(i + 1, j) });
      i = j + 1; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
      tokens.push({ t: 'ident', v: s.slice(i, j) });
      i = j; continue;
    }
    if (c === '<' && (s[i+1] === '=' || s[i+1] === '>')) {
      tokens.push({ t: 'op', v: s.slice(i, i+2) }); i += 2; continue;
    }
    if (c === '>' && s[i+1] === '=') {
      tokens.push({ t: 'op', v: '>=' }); i += 2; continue;
    }
    if ('+-*/()<>=,:&%'.includes(c)) {
      tokens.push({ t: 'op', v: c }); i++; continue;
    }
    throw new Error('Char: ' + c);
  }
  return tokens;
}

function __toNum(v) {
  if (typeof v === 'number') return v;
  if (v == null || v === '') return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function __getCellRaw(ref) {
  return __ss.sheets[__ss.activeSheet].data[ref];
}

function __getCellValue(ref, visited) {
  visited = visited || new Set();
  const key = __ss.activeSheet + '!' + ref;
  if (visited.has(key)) return '#CIRC!';
  visited.add(key);

  const raw = __getCellRaw(ref);
  if (raw == null || raw === '') return '';
  const s = String(raw);
  if (s.startsWith('=')) {
    try {
      return __evalFormula(s.slice(1), visited);
    } catch (e) {
      return '#ERR!';
    }
  }
  const n = Number(s);
  if (!isNaN(n) && s.trim() !== '' && /^-?[0-9.]+$/.test(s.trim())) return n;
  return s;
}

function __displayCellValue(ref) {
  const v = __getCellValue(ref);
  if (typeof v === 'number') {
    return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, '');
  }
  return String(v);
}

function __expandRange(from, to, visited) {
  const a = refToRC(from), b = refToRC(to);
  if (!a || !b) return [];
  const c1 = Math.min(a.c, b.c), c2 = Math.max(a.c, b.c);
  const r1 = Math.min(a.r, b.r), r2 = Math.max(a.r, b.r);
  const out = [];
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      out.push(__getCellValue(rcToRef(r, c), visited));
    }
  }
  return out;
}

function __evalFormula(formula, visited) {
  const tokens = __tokenize(formula);
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseExpr() { return parseComparison(); }

  function parseComparison() {
    let left = parseAddSub();
    while (peek() && peek().t === 'op' && ['=','<>','<','>','<=','>='].includes(peek().v)) {
      const op = next().v;
      const right = parseAddSub();
      const a = left, b = right;
      let r = false;
      if (op === '=') r = String(a) === String(b) || (typeof a === 'number' && typeof b === 'number' && a === b);
      else if (op === '<>') r = !(String(a) === String(b));
      else if (op === '<') r = __toNum(a) < __toNum(b);
      else if (op === '>') r = __toNum(a) > __toNum(b);
      else if (op === '<=') r = __toNum(a) <= __toNum(b);
      else if (op === '>=') r = __toNum(a) >= __toNum(b);
      left = r ? 1 : 0;
    }
    return left;
  }

  function parseAddSub() {
    let left = parseMulDiv();
    while (peek() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) {
      const op = next().v;
      const right = parseMulDiv();
      left = op === '+' ? (__toNum(left) + __toNum(right)) : (__toNum(left) - __toNum(right));
    }
    return left;
  }

  function parseMulDiv() {
    let left = parseUnary();
    while (peek() && peek().t === 'op' && (peek().v === '*' || peek().v === '/')) {
      const op = next().v;
      const right = parseUnary();
      left = op === '*' ? (__toNum(left) * __toNum(right)) : (__toNum(left) / __toNum(right));
    }
    return left;
  }

  function parseUnary() {
    if (peek() && peek().t === 'op' && (peek().v === '-' || peek().v === '+')) {
      const op = next().v;
      const val = parseUnary();
      return op === '-' ? -__toNum(val) : __toNum(val);
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const tok = peek();
    if (!tok) throw new Error('Formula belum lengkap');

    if (tok.t === 'num') { next(); return tok.v; }
    if (tok.t === 'str') { next(); return tok.v; }

    if (tok.t === 'op' && tok.v === '(') {
      next();
      const v = parseExpr();
      if (!peek() || peek().v !== ')') throw new Error('Kurang tanda )');
      next();
      return v;
    }

    if (tok.t === 'ident') {
      const name = next().v.toUpperCase();

      // Cell ref or range
      if (/^[A-Z]+\d+$/.test(name)) {
        if (peek() && peek().v === ':') {
          next();
          const end = next();
          if (!end || end.t !== 'ident' || !/^[A-Z]+\d+$/.test(end.v.toUpperCase())) {
            throw new Error('Range tidak valid');
          }
          return { range: [name, end.v.toUpperCase()] };
        }
        return __getCellValue(name, visited);
      }

      // Function call
      if (peek() && peek().v === '(') {
        next();
        const args = [];
        if (peek() && peek().v !== ')') {
          args.push(parseExpr());
          while (peek() && peek().v === ',') {
            next();
            args.push(parseExpr());
          }
        }
        if (!peek() || peek().v !== ')') throw new Error('Kurang ) pada ' + name);
        next();
        return __callFunction(name, args, visited);
      }

      throw new Error('Nama tidak dikenal: ' + name);
    }

    throw new Error('Token tidak valid');
  }

  function __callFunction(name, args, vis) {
    function expand(arr) {
      const out = [];
      for (const a of arr) {
        if (a && typeof a === 'object' && a.range) {
          const cells = __expandRange(a.range[0], a.range[1], vis);
          for (const v of cells) {
            const n = __toNum(v);
            if (v !== '' && v !== null && !isNaN(n)) out.push(n);
          }
        } else {
          if (a !== '' && a !== null && a !== undefined) {
            const n = __toNum(a);
            if (!isNaN(n)) out.push(n);
          }
        }
      }
      return out;
    }

    switch (name) {
      case 'SUM': { const n = expand(args); return n.reduce((a, b) => a + b, 0); }
      case 'AVERAGE': case 'AVG': {
        const n = expand(args);
        return n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0;
      }
      case 'MIN': { const n = expand(args); return n.length ? Math.min(...n) : 0; }
      case 'MAX': { const n = expand(args); return n.length ? Math.max(...n) : 0; }
      case 'COUNT': { return expand(args).length; }
      case 'COUNTA': {
        let c = 0;
        for (const a of args) {
          if (a && typeof a === 'object' && a.range) {
            const cells = __expandRange(a.range[0], a.range[1], vis);
            for (const v of cells) if (v !== '' && v != null) c++;
          } else if (a !== '' && a != null) c++;
        }
        return c;
      }
      case 'COUNTIF': {
        if (args.length < 2) throw new Error('COUNTIF butuh 2 argumen');
        const range = args[0];
        const crit = args[1];
        if (!range || typeof range !== 'object' || !range.range) return 0;
        const cells = __expandRange(range.range[0], range.range[1], vis);
        return cells.filter(v => __matchCriteria(v, crit)).length;
      }
      case 'IF': {
        if (args.length < 2) throw new Error('IF butuh minimal 2 argumen');
        const cond = args[0];
        let truthy;
        if (typeof cond === 'number') truthy = cond !== 0;
        else if (typeof cond === 'string') truthy = cond.trim() !== '' && cond !== 'FALSE';
        else truthy = !!cond;
        return truthy ? args[1] : (args[2] !== undefined ? args[2] : '');
      }
      case 'ROUND': {
        const v = __toNum(args[0]);
        const d = args.length > 1 ? __toNum(args[1]) : 0;
        const f = Math.pow(10, d);
        return Math.round(v * f) / f;
      }
      case 'AND': {
        return args.every(a => {
          if (typeof a === 'number') return a !== 0;
          if (typeof a === 'string') return a.trim() !== '' && a !== 'FALSE';
          return !!a;
        }) ? 1 : 0;
      }
      case 'OR': {
        return args.some(a => {
          if (typeof a === 'number') return a !== 0;
          if (typeof a === 'string') return a.trim() !== '' && a !== 'FALSE';
          return !!a;
        }) ? 1 : 0;
      }
      default:
        throw new Error('Fungsi belum didukung: ' + name);
    }
  }

  function __matchCriteria(val, crit) {
    if (typeof crit === 'string' && crit.startsWith('>=')) return __toNum(val) >= __toNum(crit.slice(2));
    if (typeof crit === 'string' && crit.startsWith('<=')) return __toNum(val) <= __toNum(crit.slice(2));
    if (typeof crit === 'string' && crit.startsWith('<>')) return String(val) !== crit.slice(2);
    if (typeof crit === 'string' && crit.startsWith('>')) return __toNum(val) > __toNum(crit.slice(1));
    if (typeof crit === 'string' && crit.startsWith('<')) return __toNum(val) < __toNum(crit.slice(1));
    if (typeof crit === 'string' && crit.startsWith('=')) return String(val) === crit.slice(1);
    return String(val) === String(crit);
  }

  const result = parseExpr();
  if (pos !== tokens.length) throw new Error('Formula tidak lengkap');
  return result;
}

/* ============================================================
   ENTRY POINT
   ============================================================ */
function renderAdminExcelSheet() {
  window.__inTestView = true;
  appState.currentTest = 'EXCEL';
  appState.completed = appState.completed || {};
  appState.completed.EXCEL = false;

  // Reset
  __ss.sheets[0].data = {};
  __ss.sheets[1].data = {};
  __ss.activeSheet = 0;
  __ss.activeCell = { r: 0, c: 0 };
  __ss.warnCount = 0;
  __ss.cheat = false;
  __ss.allowTabOut = false;

  __prefillSheets();

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
              <p class="ist-subtitle">Kerjakan langsung di aplikasi ini seperti bekerja di Excel.</p>
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
              <div class="ist-info-label">Sheet</div>
              <div class="ist-info-value">2 sheet</div>
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
                <li>Isi kolom <b>Rata-rata</b> & <b>Keterangan</b> di sheet <b>Data Siswa</b>.</li>
                <li>Boleh pakai <b>formula</b>, contoh: <code>=AVERAGE(D2:F2)</code>, <code>=IF(G2&gt;=75,"Lulus","Remedial")</code></li>
                <li>Di sheet <b>Jawaban Analisis</b>, isi kolom <b>Jawaban</b> untuk tiap pertanyaan.</li>
                <li>Klik cell untuk mulai. Ketik untuk mengisi. <b>Arrow key</b> untuk pindah cell.</li>
                <li><b>DILARANG keluar tab</b> — 2× pelanggaran = diskualifikasi.</li>
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
  __ss.timeLeft = EXCEL_TIME;

  clearInterval(__ss.timer);
  __ss.timer = setInterval(() => {
    __ss.timeLeft--;
    updateExcelTimer();
    if (__ss.timeLeft <= 0) {
      clearInterval(__ss.timer);
      finishExcelTest(true);
    }
  }, 1000);

  attachExcelAntiCheat();
  renderSpreadsheet();
}

/* ============================================================
   RENDER SPREADSHEET
   ============================================================ */
function renderSpreadsheet() {
  const sheet = __ss.sheets[__ss.activeSheet];
  const cols = sheet.cols, rows = sheet.rows;

  // Column headers
  let colHeaders = '<th class="ss-corner"></th>';
  for (let c = 0; c < cols; c++) {
    colHeaders += `<th class="ss-col-h" data-col="${c}">${colLetter(c)}</th>`;
  }

  // Rows
  let bodyRows = '';
  for (let r = 0; r < rows; r++) {
    bodyRows += `<tr>`;
    bodyRows += `<td class="ss-row-h" data-row="${r}">${r + 1}</td>`;
    for (let c = 0; c < cols; c++) {
      const ref = rcToRef(r, c);
      const raw = sheet.data[ref];
      const display = (raw == null) ? '' : __displayCellValue(ref);
      const isActive = (r === __ss.activeCell.r && c === __ss.activeCell.c);
      const isHeaderRow = (r === 0);
      const isLabelCol = (sheet.id === 'analisis' && c === 1);
      const extraClass = [
        isActive ? 'ss-active' : '',
        isHeaderRow ? 'ss-head' : '',
        isLabelCol ? 'ss-label' : ''
      ].filter(Boolean).join(' ');

      bodyRows += `
        <td class="ss-cell ${extraClass}" data-r="${r}" data-c="${c}" data-ref="${ref}">
          <input type="text" class="ss-input" data-ref="${ref}" value="${escapeHtmlAttr(display)}" readonly tabindex="-1">
        </td>
      `;
    }
    bodyRows += `</tr>`;
  }

  // Sheet tabs
  const tabsHTML = __ss.sheets.map((s, i) => `
    <button class="ss-tab ${i === __ss.activeSheet ? 'active' : ''}"
            onclick="switchSheet(${i})" type="button">
      ${s.name}
    </button>
  `).join('');

  const activeRef = rcToRef(__ss.activeCell.r, __ss.activeCell.c);
  const activeRaw = sheet.data[activeRef] || '';

  document.getElementById('app').innerHTML = `
    <div class="ss-shell">
      <!-- Top bar -->
      <div class="ss-top">
        <div class="ss-title">
          <span style="font-size:16px;">📊</span>
          <span>Tes Excel</span>
        </div>
        <div class="ss-top-right">
          <span class="ss-timer">⏱ <span id="excelTimerDisplay">--:--</span></span>
          <button class="ss-btn-finish" onclick="confirmFinishExcel()" type="button">✓ Selesai &amp; Kirim</button>
        </div>
      </div>

      <!-- Formula bar -->
      <div class="ss-formula-bar">
        <div class="ss-cellref" id="ssCellRef">${activeRef}</div>
        <div class="ss-fx">ƒx</div>
        <input type="text" class="ss-formula-input" id="ssFormulaInput"
               value="${escapeHtmlAttr(activeRaw)}"
               onkeydown="onFormulaBarKey(event)"
               oninput="onFormulaBarInput(this.value)"
               placeholder="Masukkan nilai atau formula, misal =AVERAGE(D2:F2)"
               autocomplete="off" spellcheck="false">
      </div>

      <!-- Grid -->
      <div class="ss-grid-wrap">
        <table class="ss-grid">
          <thead><tr>${colHeaders}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>

      <!-- Sheet tabs -->
      <div class="ss-tabs">${tabsHTML}</div>

      <!-- Status bar -->
      <div class="ss-status">
        <span id="ssStatusLeft">Siap</span>
        <span id="ssStatusRight">Sheet ${__ss.activeSheet + 1} dari ${__ss.sheets.length}</span>
      </div>
    </div>
  `;

  injectSpreadsheetStyles();
  updateExcelTimer();
  attachGridEvents();
  focusActiveCell();
}

/* ============================================================
   GRID EVENTS (delegated)
   ============================================================ */
function attachGridEvents() {
  const wrap = document.querySelector('.ss-grid-wrap');
  if (!wrap) return;

  // Click to select
  wrap.onclick = (e) => {
    const td = e.target.closest('td.ss-cell');
    if (!td) return;
    const r = Number(td.dataset.r), c = Number(td.dataset.c);
    setActiveCell(r, c, true);
  };

  // Double click to edit inline
  wrap.ondblclick = (e) => {
    const td = e.target.closest('td.ss-cell');
    if (!td) return;
    const input = td.querySelector('.ss-input');
    if (input) {
      input.readOnly = false;
      input.focus();
      input.select();
    }
  };

  // Keyboard on window
  if (__ss.keyFn) document.removeEventListener('keydown', __ss.keyFn);
  __ss.keyFn = onSpreadsheetKeyDown;
  document.addEventListener('keydown', __ss.keyFn);
}

function focusActiveCell() {
  const { r, c } = __ss.activeCell;
  const td = document.querySelector(`td.ss-cell[data-r="${r}"][data-c="${c}"]`);
  if (!td) return;
  const input = td.querySelector('.ss-input');
  if (input) {
    input.readOnly = false;
    input.focus();
    input.select();
  }
  updateFormulaBar();
  updateStatusBar();
}

function setActiveCell(r, c, commit) {
  if (commit) {
    const cur = document.querySelector('td.ss-cell.ss-active .ss-input');
    if (cur) {
      cur.readOnly = true;
      cur.blur();
    }
  }

  const sheet = __ss.sheets[__ss.activeSheet];
  if (r < 0) r = 0;
  if (c < 0) c = 0;
  if (r >= sheet.rows) r = sheet.rows - 1;
  if (c >= sheet.cols) c = sheet.cols - 1;

  __ss.activeCell = { r, c };

  document.querySelectorAll('td.ss-cell.ss-active').forEach(td => td.classList.remove('ss-active'));
  const td = document.querySelector(`td.ss-cell[data-r="${r}"][data-c="${c}"]`);
  if (td) {
    td.classList.add('ss-active');
    td.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  focusActiveCell();
}

function onSpreadsheetKeyDown(e) {
  if (!window.__inTestView) return;
  if (appState.currentTest !== 'EXCEL') return;

  const target = e.target;
  const isInGrid = target && target.classList.contains('ss-input');
  const isInFormulaBar = target && target.id === 'ssFormulaInput';

  if (!isInGrid && !isInFormulaBar) return;

  const { r, c } = __ss.activeCell;

  // Navigation only when not editing inline OR when it's the formula bar we skip nav
  if (isInFormulaBar) {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFormulaBarValue();
      setActiveCell(r + 1, c, true);
    } else if (e.key === 'Escape') {
      updateFormulaBar();
      focusActiveCell();
    }
    return;
  }

  // In grid
  const isEditing = target.readOnly === false && !isAllSelected(target);

  if (e.key === 'ArrowUp') {
    if (isEditing && target.selectionStart === target.selectionEnd && !isAllSelected(target)) return;
    e.preventDefault();
    commitCurrentCell();
    setActiveCell(r - 1, c, false);
  } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
    e.preventDefault();
    commitCurrentCell();
    setActiveCell(r + 1, c, false);
  } else if (e.key === 'ArrowLeft') {
    if (isEditing && target.selectionStart > 0 && !isAllSelected(target)) return;
    e.preventDefault();
    commitCurrentCell();
    setActiveCell(r, c - 1, false);
  } else if (e.key === 'ArrowRight') {
    if (isEditing && target.selectionStart < target.value.length && !isAllSelected(target)) return;
    e.preventDefault();
    commitCurrentCell();
    setActiveCell(r, c + 1, false);
  } else if (e.key === 'Tab') {
    e.preventDefault();
    commitCurrentCell();
    setActiveCell(r, c + (e.shiftKey ? -1 : 1), false);
  } else if (e.key === 'F2') {
    e.preventDefault();
    target.readOnly = false;
    target.focus();
    target.select();
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (isAllSelected(target) || target.readOnly) {
      e.preventDefault();
      clearCurrentCell();
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    target.blur();
    target.readOnly = true;
    const ref = target.dataset.ref;
    const sheet = __ss.sheets[__ss.activeSheet];
    const raw = sheet.data[ref];
    target.value = (raw == null) ? '' : __displayCellValue(ref);
    updateFormulaBar();
  } else if (/^[a-zA-Z0-9=+\-*/("'$]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
    // Start editing — replace content
    if (isAllSelected(target) || target.readOnly) {
      target.readOnly = false;
      target.value = '';
      target.focus();
    }
  } else if (e.ctrlKey || e.metaKey) {
    if (e.key === 'c' || e.key === 'C') {
      e.preventDefault();
      const ref = target.dataset.ref;
      const sheet = __ss.sheets[__ss.activeSheet];
      __ss.clipboard = sheet.data[ref] || '';
      updateStatusBar('Copied: ' + ref);
    } else if (e.key === 'v' || e.key === 'V') {
      e.preventDefault();
      if (__ss.clipboard != null) {
        target.readOnly = false;
        target.value = __ss.clipboard;
        target.dispatchEvent(new Event('input', { bubbles: true }));
        commitCurrentCell();
      }
    } else if (e.key === 'x' || e.key === 'X') {
      e.preventDefault();
      const ref = target.dataset.ref;
      const sheet = __ss.sheets[__ss.activeSheet];
      __ss.clipboard = sheet.data[ref] || '';
      clearCurrentCell();
    }
  }
}

function isAllSelected(input) {
  try {
    return input.selectionStart === 0 && input.selectionEnd === input.value.length && input.value.length > 0;
  } catch (e) {
    return false;
  }
}

function commitCurrentCell() {
  const { r, c } = __ss.activeCell;
  const td = document.querySelector(`td.ss-cell[data-r="${r}"][data-c="${c}"]`);
  if (!td) return;
  const input = td.querySelector('.ss-input');
  if (!input) return;

  const ref = input.dataset.ref;
  const sheet = __ss.sheets[__ss.activeSheet];
  const raw = input.readOnly ? (sheet.data[ref] ?? '') : input.value;

  if (raw === '' || raw == null) {
    delete sheet.data[ref];
  } else {
    sheet.data[ref] = raw;
  }

  // Recompute this cell's display
  const display = (sheet.data[ref] == null) ? '' : __displayCellValue(ref);
  input.value = display;
  input.readOnly = true;

  // Recompute all formula cells
  recomputeAll();
}

function clearCurrentCell() {
  const { r, c } = __ss.activeCell;
  const td = document.querySelector(`td.ss-cell[data-r="${r}"][data-c="${c}"]`);
  if (!td) return;
  const input = td.querySelector('.ss-input');
  if (!input) return;

  const ref = input.dataset.ref;
  const sheet = __ss.sheets[__ss.activeSheet];
  delete sheet.data[ref];

  input.value = '';
  input.readOnly = true;

  recomputeAll();
  updateFormulaBar();
}

function recomputeAll() {
  const sheet = __ss.sheets[__ss.activeSheet];
  const { r: actR, c: actC } = __ss.activeCell;

  document.querySelectorAll('.ss-cell .ss-input').forEach(inp => {
    const ref = inp.dataset.ref;
    const td = inp.closest('td');
    const r = Number(td.dataset.r);
    const c = Number(td.dataset.c);
    if (r === actR && c === actC && inp.readOnly === false) return; // skip cell sedang diedit
    const raw = sheet.data[ref];
    inp.value = (raw == null) ? '' : __displayCellValue(ref);
  });
}

/* ============================================================
   FORMULA BAR
   ============================================================ */
function updateFormulaBar() {
  const ref = rcToRef(__ss.activeCell.r, __ss.activeCell.c);
  const refEl = document.getElementById('ssCellRef');
  const inputEl = document.getElementById('ssFormulaInput');
  if (refEl) refEl.textContent = ref;
  if (inputEl) {
    const sheet = __ss.sheets[__ss.activeSheet];
    inputEl.value = sheet.data[ref] || '';
  }
}

function onFormulaBarInput(val) {
  const ref = rcToRef(__ss.activeCell.r, __ss.activeCell.c);
  const sheet = __ss.sheets[__ss.activeSheet];
  if (val === '') delete sheet.data[ref];
  else sheet.data[ref] = val;

  // Recompute affected cells (don't touch formula bar)
  const { r: actR, c: actC } = __ss.activeCell;
  document.querySelectorAll('.ss-cell .ss-input').forEach(inp => {
    const td = inp.closest('td');
    const r = Number(td.dataset.r);
    const c = Number(td.dataset.c);
    if (r === actR && c === actC) return;
    const rf = inp.dataset.ref;
    const raw = sheet.data[rf];
    inp.value = (raw == null) ? '' : __displayCellValue(rf);
  });
}

function onFormulaBarKey(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    applyFormulaBarValue();
    // Move down
    const { r, c } = __ss.activeCell;
    setActiveCell(r + 1, c, false);
    setTimeout(() => {
      const tb = document.getElementById('ssFormulaInput');
      if (tb) { tb.focus(); tb.select(); }
    }, 10);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    updateFormulaBar();
    focusActiveCell();
  }
}

function applyFormulaBarValue() {
  const ref = rcToRef(__ss.activeCell.r, __ss.activeCell.c);
  const sheet = __ss.sheets[__ss.activeSheet];
  const val = document.getElementById('ssFormulaInput').value;
  if (val === '') delete sheet.data[ref];
  else sheet.data[ref] = val;
  recomputeAll();
}

/* ============================================================
   SHEET SWITCH
   ============================================================ */
function switchSheet(idx) {
  if (idx === __ss.activeSheet) return;
  commitCurrentCell();
  __ss.activeSheet = idx;
  __ss.activeCell = { r: 0, c: 0 };
  renderSpreadsheet();
}

/* ============================================================
   TIMER + STATUS
   ============================================================ */
function updateExcelTimer() {
  const el = document.getElementById('excelTimerDisplay');
  if (!el) return;
  const s = Math.max(0, __ss.timeLeft);
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  el.textContent = `${m}:${sec}`;
  el.style.color = s <= 60 ? '#c62828' : '#1b4f8f';
}

function updateStatusBar(leftText) {
  const l = document.getElementById('ssStatusLeft');
  const r = document.getElementById('ssStatusRight');
  if (l && leftText) l.textContent = leftText;
  else if (l) {
    const ref = rcToRef(__ss.activeCell.r, __ss.activeCell.c);
    const sheet = __ss.sheets[__ss.activeSheet];
    const raw = sheet.data[ref] || '';
    const display = raw ? __displayCellValue(ref) : '';
    l.textContent = display ? `${ref}: ${display}` : 'Siap';
  }
  if (r) r.textContent = `Sheet ${__ss.activeSheet + 1} dari ${__ss.sheets.length}`;
}

/* ============================================================
   CSS
   ============================================================ */
function injectSpreadsheetStyles() {
  if (document.getElementById('__ssStyles')) return;
  const css = document.createElement('style');
  css.id = '__ssStyles';
  css.textContent = `
    .ss-shell {
      width: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      font-family: Inter, system-ui, sans-serif;
    }
    .ss-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 18px;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
    }
    .ss-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
      color: #1e293b;
    }
    .ss-top-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ss-timer {
      font-family: 'Courier New', monospace;
      font-size: 15px;
      font-weight: 800;
      color: #1b4f8f;
    }
    .ss-btn-finish {
      padding: 8px 18px;
      background: linear-gradient(135deg, #16a34a, #059669);
      color: #fff;
      border: 0;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 3px 8px rgba(22,163,74,.28);
    }
    .ss-btn-finish:hover { transform: translateY(-1px); }

    /* Formula bar */
    .ss-formula-bar {
      display: flex;
      align-items: center;
      gap: 0;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0;
    }
    .ss-cellref {
      width: 70px;
      padding: 8px 12px;
      background: #f1f5f9;
      color: #334155;
      font-weight: 800;
      font-size: 13px;
      text-align: center;
      border-right: 1px solid #e2e8f0;
      font-family: 'Courier New', monospace;
    }
    .ss-fx {
      padding: 8px 12px;
      color: #64748b;
      font-style: italic;
      font-weight: 700;
      border-right: 1px solid #e2e8f0;
      font-size: 13px;
    }
    .ss-formula-input {
      flex: 1;
      padding: 8px 12px;
      border: 0;
      outline: none;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #0f172a;
      background: #fff;
    }
    .ss-formula-input:focus {
      background: #f0f9ff;
      box-shadow: inset 0 -2px 0 #3b82f6;
    }

    /* Grid */
    .ss-grid-wrap {
      flex: 1;
      overflow: auto;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      max-height: calc(100vh - 230px);
    }
    .ss-grid {
      border-collapse: collapse;
      font-family: 'Calibri', 'Segoe UI', Inter, sans-serif;
      font-size: 13px;
      table-layout: fixed;
    }
    .ss-grid thead th {
      position: sticky;
      top: 0;
      z-index: 3;
      background: #f1f5f9;
      border: 1px solid #d1d5db;
      height: 22px;
      width: 90px;
      min-width: 90px;
      color: #475569;
      font-weight: 600;
      font-size: 11px;
      text-align: center;
      user-select: none;
    }
    .ss-grid .ss-corner {
      width: 40px;
      min-width: 40px;
      background: #e2e8f0;
    }
    .ss-grid .ss-col-h {
      width: 90px;
      min-width: 90px;
    }

    .ss-grid tbody td {
      border: 1px solid #e2e8f0;
      height: 24px;
      padding: 0;
      position: relative;
    }
    .ss-grid .ss-row-h {
      width: 40px;
      min-width: 40px;
      background: #f1f5f9;
      text-align: center;
      color: #64748b;
      font-size: 11px;
      user-select: none;
      position: sticky;
      left: 0;
      z-index: 2;
      font-weight: 600;
    }
    .ss-grid .ss-head {
      background: #f8fafc;
      font-weight: 700;
      color: #1e293b;
    }
    .ss-grid .ss-label {
      background: #f8fafc;
    }

    .ss-cell.ss-active::after {
      content: '';
      position: absolute;
      inset: 0;
      border: 2px solid #3b82f6;
      box-shadow: inset 0 0 0 1px rgba(59,130,246,.25);
      pointer-events: none;
      z-index: 1;
    }

    .ss-input {
      width: 100%;
      height: 100%;
      padding: 3px 6px;
      border: 0;
      outline: none;
      font-family: inherit;
      font-size: 13px;
      color: #0f172a;
      background: transparent;
      box-sizing: border-box;
      cursor: cell;
    }
    .ss-input:focus {
      background: #fff;
      cursor: text;
    }
    .ss-input[readonly] {
      cursor: cell;
      user-select: none;
      caret-color: transparent;
    }
    .ss-cell.ss-head .ss-input {
      font-weight: 700;
      color: #1e293b;
      cursor: default;
    }

    /* Sheet tabs */
    .ss-tabs {
      display: flex;
      gap: 2px;
      background: #f1f5f9;
      padding: 6px 12px 0;
      border-bottom: 2px solid #cbd5e1;
      overflow-x: auto;
    }
    .ss-tab {
      padding: 7px 18px;
      background: #e2e8f0;
      color: #475569;
      border: 1px solid #cbd5e1;
      border-bottom: 0;
      border-radius: 8px 8px 0 0;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
    }
    .ss-tab.active {
      background: #fff;
      color: #1e293b;
      border-color: #94a3b8;
      font-weight: 800;
    }

    /* Status bar */
    .ss-status {
      display: flex;
      justify-content: space-between;
      padding: 6px 14px;
      background: #1e293b;
      color: #cbd5e1;
      font-size: 11.5px;
      font-weight: 600;
      font-family: 'Courier New', monospace;
    }
  `;
  document.head.appendChild(css);
}

function escapeHtmlAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ============================================================
   ANTI-CHEAT
   ============================================================ */
function attachExcelAntiCheat() {
  if (__ss.blurFn) window.removeEventListener('blur', __ss.blurFn);
  if (__ss.visFn) document.removeEventListener('visibilitychange', __ss.visFn);

  __ss.blurFn = () => {
    if (__ss.allowTabOut || __ss.cheat) return;
    if (!window.__inTestView) return;
    if (appState.currentTest !== 'EXCEL') return;

    __ss.warnCount++;
    if (__ss.warnCount < __EXCEL_MAX_WARN) {
      showExcelWarning(__ss.warnCount);
      return;
    }
    __ss.cheat = true;
    clearInterval(__ss.timer);
    disqualifyExcel();
  };

  __ss.visFn = () => { if (document.hidden) __ss.blurFn(); };

  window.addEventListener('blur', __ss.blurFn);
  document.addEventListener('visibilitychange', __ss.visFn);
}

function showExcelWarning(count) {
  __ss.allowTabOut = true;
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
    setTimeout(() => { __ss.allowTabOut = false; }, 1500);
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
  // Commit dulu
  commitCurrentCell();
  if (!confirm('Kirim hasil Tes Excel sekarang?\n\nFile .xlsx akan otomatis terkirim ke admin.')) return;
  __ss.allowTabOut = true;
  finishExcelTest(false);
}

async function finishExcelTest(timeUp) {
  clearInterval(__ss.timer);
  __ss.allowTabOut = true;
  window.__inTestView = false;

  if (__ss.blurFn) { window.removeEventListener('blur', __ss.blurFn); __ss.blurFn = null; }
  if (__ss.visFn) { document.removeEventListener('visibilitychange', __ss.visFn); __ss.visFn = null; }

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

  __ss.sheets.forEach(sheet => {
    const aoa = [];
    for (let r = 0; r < sheet.rows; r++) {
      const row = [];
      for (let c = 0; c < sheet.cols; c++) {
        const ref = rcToRef(r, c);
        const raw = sheet.data[ref];
        if (raw == null || raw === '') {
          row.push('');
        } else {
          const s = String(raw);
          if (s.startsWith('=')) {
            // Simpan formula, bukan value
            row.push(s);
          } else {
            row.push(raw);
          }
        }
      }
      aoa.push(row);
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = Array.from({ length: sheet.cols }, () => ({ wch: 16 }));
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 30));
  });

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

console.log('[TEST-EXCEL-INAPP] ✓ Loaded — spreadsheet UI + formula engine');
