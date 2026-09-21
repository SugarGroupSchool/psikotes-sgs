/* =========================================================
   PDF GENERATION — Full Logic
   ========================================================= */

/* ============================================================
   HELPER — Sanitasi Teks & Encoding
   ============================================================ */

   function setCharSpaceSafe(doc, value = 0) {
    if (doc && typeof doc.setCharSpace === 'function') {
      try { doc.setCharSpace(value); } catch {}
    }
  }
  
  function normalizeSpaces(s) {
    return String(s || '')
      .replace(/\u00A0/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .trim();
  }
  
  function sanitizePDFText(s) {
    const map = {
      'Ä':'AE','Ö':'OE','Ü':'UE','ä':'ae','ö':'oe','ü':'ue','ß':'ss',
      '“':'"','”':'"','‘':"'",'’':"'",'–':'-','—':'-','•':'-',
      '→':'->','⇒':'=>>','←':'<-','«':'"','»':'"',
      'Δ':'delta','≤':'<=','≥':'>=','≠':'!=','±':'+/-','×':'x','÷':'/'
    };
    let t = String(s || '').replace(/[\u00A0\u2007\u202F]/g, ' ');
    t = t.replace(/[\u00AD]/g, '');
    t = t.replace(/[ÄÖÜäöüß“”‘’–—•→⇒←«»Δ≤≥≠±×÷]/g, ch => map[ch] || ch);
    try { t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch {}
    t = t.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
    return t;
  }
  
  function safeStr(s) {
    return normalizeSpaces(sanitizePDFText(s));
  }
  
  function textSafe(doc, text, x, y, opts) {
    setCharSpaceSafe(doc, 0);
    doc.text(safeStr(text), x, y, opts);
  }
  
  /* ============================================================
     HELPER — Encoder / Decoder Skor
     ============================================================ */
  
  function encodeScoreCode(value) {
    if (value == null || value === '' || isNaN(Number(value))) return '-';
    const num = Number(value), neg = num < 0;
    let s = String(Math.round(Math.abs(num)));
    if (s.length === 0) s = '0';
    const map = { '0':'o','1':'a','2':'b','3':'c','4':'d','5':'e','6':'f','7':'g','8':'h','9':'i' };
    let out = '';
    for (const ch of s) out += (map[ch] || '');
    if (out === '') out = 'o';
    return neg ? '-' + out : out;
  }
  
  function decodeScoreCode(s) {
    let str = String(s || '').trim().toLowerCase();
    if (!str) return NaN;
    let neg = false;
    if (str[0] === '-') { neg = true; str = str.slice(1); }
    const map = { o:'0', a:'1', b:'2', c:'3', d:'4', e:'5', f:'6', g:'7', h:'8', i:'9' };
    let digits = '';
    for (const ch of str) {
      if (!(ch in map)) return NaN;
      digits += map[ch];
    }
    const n = Number(digits);
    return neg ? -n : n;
  }
  
  function toNumFlexible(v) {
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    const s = String(v || '').trim();
    if (/^-?[a-io]+$/i.test(s)) {
      const n = decodeScoreCode(s);
      return isNaN(n) ? 0 : n;
    }
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }
  
  /* ============================================================
     HELPER — Page / Spacing
     ============================================================ */
  
  const Y_MAX = 280;
  const Y_PB  = 265;
  
  function ensurePage(doc, y) {
    if (y > Y_PB) { doc.addPage(); return 20; }
    return y;
  }
  
  function ensureSpace(doc, y, need = 12) {
    if (y + need > 270) { doc.addPage(); return 20; }
    return y;
  }
  
  function setTypewriter(doc, weight = 'normal') {
    doc.setFont('courier', weight);
  }
  
  function blokHeading(doc, title, rgb = [44, 62, 80], x, y, w, h) {
    doc.setFontSize(9);
    doc.setTextColor(rgb[0] || 44, rgb[1] || 62, rgb[2] || 80);
    doc.text(String(title || ''), 16, y + 6);
  }
  
  /* ============================================================
     HELPER — Label/Value dengan wrapping
     ============================================================ */
  
  function drawLabelValueFix(doc, x, y, label, value, opts = {}) {
    const fontSize   = opts.fontSize   || 7;
    const labelWidth = opts.labelWidth || 25;
    const maxWidth   = opts.maxWidth   || 44;
  
    doc.setFontSize(fontSize);
    doc.text(`${label}:`, x, y);
  
    const valStr = String(value ?? '-');
  
    if (doc.getTextWidth(valStr) > maxWidth) {
      let firstLine = '', secondLine = '';
      for (let i = 0; i < valStr.length; i++) {
        if (doc.getTextWidth(firstLine + valStr[i]) < maxWidth) firstLine += valStr[i];
        else { secondLine = valStr.slice(i); break; }
      }
      doc.text(firstLine,  x + labelWidth, y);
      doc.text(secondLine, x + labelWidth, y + 3.5);
      return y + 7;
    } else {
      doc.text(valStr, x + labelWidth, y);
      return y + 3.5;
    }
  }
  
  /* ============================================================
     HELPER — Wrapping Teks
     ============================================================ */
  
  function printLineWrap(doc, text, y, x = 16, w = 178, size = 8, step = 6) {
    doc.setFontSize(size);
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(safeStr(String(text)), w);
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        y += step;
        if (y > Y_MAX) { doc.addPage(); y = 20; }
      }
      textSafe(doc, lines[i], x, y);
    }
    return y;
  }
  
  /* ============================================================
     WATERMARK DIAGONAL
     ============================================================ */
  
  function addDiagonalWatermark(doc, text = 'SANGAT RAHASIA', angleDeg = -35, opts = {}) {
    const pages = typeof doc.getNumberOfPages === 'function' ? doc.getNumberOfPages() : 1;
  
    const opt = {
      centerXOffset: 0,
      centerYOffset: 0,
      color: [200, 20, 20],
      opacity: 0.12,
      blur: true,
      blurOpacity: 0.05,
      blurPasses: 10,
      blurRadius: 0.7,
      font: 'helvetica',
      fontStyle: 'bold',
      fontSizeMax: 54,
      edgeGap: 1.0,
      baselineShift: 0.30,
      ...opts
    };
  
    const hasAlpha = !!doc.setGState && !!doc.GState;
  
    for (let i = 1; i <= pages; i++) {
      if (doc.setPage) doc.setPage(i);
  
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      const cx = w / 2 + (opt.centerXOffset || 0);
      const cy = h / 2 - (opt.centerYOffset || 0);
  
      const diag = Math.sqrt(w * w + h * h);
      const targetWidth = Math.max(10, diag - 2 * (opt.edgeGap || 0));
  
      doc.setFont(opt.font, opt.fontStyle);
      doc.setTextColor(...opt.color);
  
      doc.setFontSize(10);
      const widthAt10 = Math.max(1, doc.getTextWidth(text));
      const autoSize = Math.min(opt.fontSizeMax, Math.max(12, (targetWidth / widthAt10) * 10));
      doc.setFontSize(autoSize);
  
      const baselineNudge = autoSize * (opt.baselineShift || 0.30);
  
      if (hasAlpha) {
        try {
          doc.saveGraphicsState();
          doc.setGState(new doc.GState({ opacity: opt.opacity }));
        } catch {}
      } else {
        const soften = (c) => Math.round(255 - (255 - c) * 0.65);
        const soft = [soften(opt.color[0]), soften(opt.color[1]), soften(opt.color[2])];
        doc.setTextColor(...soft);
      }
  
      if (opt.blur && hasAlpha) {
        try { doc.setGState(new doc.GState({ opacity: opt.blurOpacity })); } catch {}
        for (let k = 0; k < opt.blurPasses; k++) {
          const t = (k / opt.blurPasses) * Math.PI * 2;
          const dx = Math.cos(t) * opt.blurRadius;
          const dy = Math.sin(t) * opt.blurRadius;
          doc.text(text, cx + dx, cy + baselineNudge + dy, { align: 'center', angle: angleDeg });
        }
        try { doc.setGState(new doc.GState({ opacity: opt.opacity })); } catch {}
      }
  
      doc.text(text, cx, cy + baselineNudge, { align: 'center', angle: angleDeg });
  
      if (hasAlpha) {
        try { doc.restoreGraphicsState(); } catch {}
      }
    }
  }

/* ============================================================
   KOMPRES GAMBAR — resize + turunkan kualitas JPEG
   ============================================================ */
async function __compressImageForPDF(dataUrl, maxDim = 1200, quality = 0.6) {
  return new Promise((resolve, reject) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        let w = img.naturalWidth;
        let h = img.naturalHeight;

        // Resize kalau lebih besar dari maxDim
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round(h * maxDim / w);
            w = maxDim;
          } else {
            w = Math.round(w * maxDim / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        // JPEG quality loop — turunkan sampai < 300KB
        let q = quality;
        let result = canvas.toDataURL('image/jpeg', q);
        const targetKB = 300;

        while (result.length * 0.75 / 1024 > targetKB && q > 0.3) {
          q -= 0.1;
          result = canvas.toDataURL('image/jpeg', q);
        }

        resolve(result);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => resolve(dataUrl); // fallback kalau gagal
    img.src = dataUrl;
  });
}

  /* ============================================================
     GENERATE PDF — FUNGSI UTAMA
     ============================================================ */
  
  async function generatePDF() {
// ============================================
// PDF PASSWORD DINAMIS
// Format: SGS-[6hurufNama]-[3akhirDeviceId]
// Contoh: SGS-AhmadF-9p3
// ============================================
const _pdfName = (appState?.identity?.name || 'Peserta')
  .replace(/[^a-zA-Z]/g, '')
  .slice(0, 6) || 'Peserta';
const _pdfDevice = (localStorage.getItem('_sgs_device_id') || 'xxx')
  .slice(-3);
const _pdfPassword = 'SGS-' + _pdfName + '-' + _pdfDevice;
window.__lastPdfPassword = _pdfPassword;  // ← TAMBAHAN
     
const doc = new jsPDF({
  unit: 'mm',
  format: 'a4',
  compress: true,
  encryption: {
    userPassword: _pdfPassword,
    ownerPassword: _pdfPassword
  }
});
  
    const pageWidth = doc.internal.pageSize.getWidth();
  
    /* ============================================================
       LOGO
       ============================================================ */
    const logoURL = 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png';
  
    async function loadImageAsDataURL(url) {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Gagal memuat logo (${response.status} ${response.statusText})`);
      }
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Gagal mengonversi logo ke Data URL.'));
        reader.readAsDataURL(blob);
      });
    }
  
    const logoDataURL = await loadImageAsDataURL(logoURL);
  
    doc.addImage(logoDataURL, 'PNG', pageWidth / 2 - 10, 8, 20, 16);
  
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.text('HASIL PSIKOTES', pageWidth / 2, 27, { align: 'center' });
    doc.text('SUGAR GROUP SCHOOLS', pageWidth / 2, 32, { align: 'center' });
  
    /* ============================================================
       IDENTITAS
       ============================================================ */
    const col1_x = 12, col2_x = 90;
    let y = 43;
  
    setTypewriter(doc, 'bold');
    doc.setFontSize(7);
    doc.text('IDENTITAS PESERTA', col1_x, y);
    y += 2;
    doc.setLineWidth(0.22);
    doc.line(col1_x, y, col1_x + 35, y);
    y += 3;
  
    const id = appState.identity;
  
    // Kolom kiri
    setTypewriter(doc, 'normal');
    let y1 = y;
    y1 = drawLabelValueFix(doc, col1_x, y1, "Nama Lengkap",     id.name || "-");
    y1 = drawLabelValueFix(doc, col1_x, y1, "Nama Panggilan",   id.nickname || "-");
    y1 = drawLabelValueFix(doc, col1_x, y1, "No. HP",           id.phone || "-");
    y1 = drawLabelValueFix(doc, col1_x, y1, "Tgl Lahir",        id.dob ? new Date(id.dob).toLocaleDateString('id-ID') : '-');
    y1 = drawLabelValueFix(doc, col1_x, y1, "Usia",             id.age || "-");
    y1 = drawLabelValueFix(doc, col1_x, y1, "Status",           id.status || "-");
    y1 = drawLabelValueFix(doc, col1_x, y1, "Posisi",           id.position || "-");
    if (id.position === 'Dosen/Guru')      y1 = drawLabelValueFix(doc, col1_x, y1, "Kategori Guru", id.teacherLevel || "-");
    if (id.position === 'Technical Staff') y1 = drawLabelValueFix(doc, col1_x, y1, "Role Teknis",   id.techRole || "-");
    y1 = drawLabelValueFix(doc, col1_x, y1, "Pendidikan",       id.education || "-");
  
    // Kolom kanan
    let y2 = y;
    y2 = drawLabelValueFix(doc, col2_x, y2, "Email",              id.email || "-",         { labelWidth: 30, maxWidth: 67, fontSize: 7 });
    y2 = drawLabelValueFix(doc, col2_x, y2, "Alamat KTP",         id.addressKTP || "-",    { labelWidth: 30, maxWidth: 67, fontSize: 7 });
    y2 = drawLabelValueFix(doc, col2_x, y2, "Alamat Saat Ini",    id.addressCurrent || "-",{ labelWidth: 30, maxWidth: 67, fontSize: 7 });
    y2 = drawLabelValueFix(doc, col2_x, y2, "Keterangan Tambahan",id.explanation || "-",   { labelWidth: 30, maxWidth: 67, fontSize: 7 });
    y2 = drawLabelValueFix(doc, col2_x, y2, "Tanggal Pengisian",  id.date || "-",          { labelWidth: 30, fontSize: 7 });
  
    // Alumni
    const yMaxIdentitas = Math.max(y1, y2);
    let ySection = yMaxIdentitas + 7;
  
    if (id.alumniSGS) {
      let alumniText = "Alumni Sugar Group Schools:";
      let alumniArr = [];
      if (id.alumniSD)  alumniArr.push("SD"  + (id.alumniSDText  ? ` (${id.alumniSDText})`   : ""));
      if (id.alumniSMP) alumniArr.push("SMP" + (id.alumniSMPText ? ` (${id.alumniSMPText})`  : ""));
      if (id.alumniSMA) alumniArr.push("SMA" + (id.alumniSMAText ? ` (${id.alumniSMAText})` : ""));
      alumniText += " " + (alumniArr.length > 0 ? alumniArr.join(", ") : "-");
      doc.setFontSize(8);
      doc.text(alumniText, col1_x, ySection);
      ySection += 6;
    }
  
    ySection = ensurePage(doc, ySection);
  
    /* ============================================================
       IST
       ============================================================ */
    if (
      appState.answers.IST &&
      Array.isArray(appState.answers.IST) &&
      appState.answers.IST.some(subtest => Array.isArray(subtest.answers) && subtest.answers.length > 0)
    ) {
      try { applyAllKeysIntoQuestions(); } catch {}
  
      ySection += 2;
      ySection = ensurePage(doc, ySection);
  
      setTypewriter(doc, 'bold');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.text('JAWABAN TES IST', pageWidth / 2, ySection, { align: 'center' });
  
      setTypewriter(doc, 'normal');
      ySection += 2;
      doc.setTextColor(44, 62, 80);
  
      /* Format ringkas per subtes */
      function _pickAnswer(a) {
        if (a == null) return '';
        if (typeof a === 'string' || typeof a === 'number') return String(a);
        if (typeof a === 'object') {
          const cand = a.answer ?? a.text ?? a.value ?? a.label ?? a.choice ?? '';
          return cand == null ? '' : String(cand);
        }
        return String(a);
      }
  
      function _compactToken(v) {
        if (v == null || v === '') return '-';
        let s = String(v).trim();
        if (/^[A-Ea-e]\s*$/.test(s)) return s[0].toLowerCase();
        if (/^[A-Ea-e][.)](?:\s*\S.*)?$/.test(s)) return s[0].toLowerCase();
        if (/^[+-]?\d+(?:[.,]\d+)?$/.test(s)) return s.replace(',', '.');
        return s.replace(/[\[\]]/g, '').replace(/,/g, ' ');
      }
  
      const SUB_LABEL = {
        SE: 'SE (Satzergänzung)',
        WA: 'WA (Wortauswahl)',
        AN: 'AN (Analogien)',
        GE: 'GE (Gemeinsamkeiten Finden)',
        RA: 'RA (Rechenaufgaben)',
        ZR: 'ZR (Zahlenreihen)',
        FA: 'FA (Figurenauswahl)',
        WU: 'WU (Würfelaufgaben)',
        ME: 'ME (Memori)'
      };
  
      function _inferCode(name = '') {
        const s = String(name).toUpperCase();
        const two = s.replace(/[^A-Z]/g, '').slice(0, 2);
        if (SUB_LABEL[two]) return two;
        for (const k of Object.keys(SUB_LABEL)) {
          if (s.includes(k)) return k;
        }
        return two || s.slice(0, 2) || 'SE';
      }
  
      function _formatSubtestLine(subtest) {
        const code = _inferCode(subtest?.name || '');
        const label = SUB_LABEL[code] || (code + ' (' + (subtest?.name || code) + ')');
        const answersArr = Array.isArray(subtest?.answers) ? subtest.answers : [];
        const tokens = answersArr.map(a => _compactToken(_pickAnswer(a)));
        if (!tokens.length) return `${label}  [-]`;
        const groups = [];
        for (let i = 0; i < tokens.length; i += 5) {
          const chunk = tokens.slice(i, i + 5);
          groups.push(`[${chunk.join(', ')}]`);
        }
        return `${label}  ${groups.join(', ')}`;
      }
  
      const linesPerSub = appState.answers.IST.map(st => _formatSubtestLine(st));
      const flow = linesPerSub.join(' ||| ');
  
      const LM = 16, RM = 16, MAXY = Y_MAX;
      const TEXT_W = pageWidth - (LM + RM);
  
      doc.setFontSize(7);
      setTypewriter(doc, 'normal');
      doc.setTextColor(44, 62, 80);
  
      const chunks = doc.splitTextToSize(safeStr(flow), TEXT_W);
      for (let i = 0; i < chunks.length; i++) {
        ySection += 2.4;
        if (ySection > MAXY) { doc.addPage(); ySection = 20; }
        doc.text(chunks[i], LM, ySection);
      }
      ySection += 2;
  
      // Ringkasan IST
      try {
        ySection = renderISTSummaryToPDF(doc, pageWidth, ySection);
        const summary = computeISTPerSubtestScores();
        ySection = renderISTScoresToPDF(doc, pageWidth, ySection, summary);
        ySection = renderISTIQToPDF(doc, pageWidth, ySection, summary);
        ySection = renderISTDescriptionsToPDF(doc, pageWidth, ySection, summary);
        ySection = renderISTThinkingDimensionToPDF(doc, pageWidth, ySection, summary);
        ySection = renderISTSWChartToPDF(doc, pageWidth, ySection, summary);
        ySection = renderISTMWAnalysisToPDF(doc, pageWidth, ySection, summary);
      } catch (e) {
        console.error('IST summary/render error', e);
      }
    }
  
    /* ============================================================
       KRAEPLIN
       ============================================================ */
    if (
      appState.answers.KRAEPLIN &&
      Array.isArray(appState.answers.KRAEPLIN) &&
      appState.answers.KRAEPLIN.some(arr => Array.isArray(arr) && arr.length > 0)
    ) {
      const USE_UGM_NORMS = true;
      const UGM_BANDS = {
        PANKER:  [10, 14, 18, 22],
        TIANKER: [5, 10, 15, 20],
        JANKER:  [1.5, 2.5, 4, 6],
        HANKER:  [-3, -1, 1, 3]
      };
  
      const LABELS5 = ["Rendah Sekali", "Rendah", "Cukup", "Tinggi", "Sangat Tinggi"];
  
      function catFixedAsc(value, bandsAsc, invert = false) {
        const [b1, b2, b3, b4] = bandsAsc;
        let idx = 0;
        if (value <= b1) idx = 0;
        else if (value <= b2) idx = 1;
        else if (value <= b3) idx = 2;
        else if (value <= b4) idx = 3;
        else idx = 4;
        return invert ? LABELS5[4 - idx] : LABELS5[idx];
      }
  
      const key = appState.kraeplinKey || [];
      const ans = appState.answers.KRAEPLIN || [];
      const colsOrigin = tests?.KRAEPLIN?.columns || [];
  
      const expectedPerCol = colsOrigin.map(col => Math.max(0, (Array.isArray(col) ? col.length : 0) - 1));
      const expectedTotal = expectedPerCol.reduce((a, b) => a + b, 0);
  
      const colStats = expectedPerCol.map((exp, cIdx) => {
        const jaw = Array.isArray(ans[cIdx]) ? ans[cIdx] : [];
        const k   = Array.isArray(key[cIdx]) ? key[cIdx] : [];
        let isi = 0, benar = 0, salah = 0;
        for (let r = 0; r < Math.min(jaw.length, k.length); r++) {
          const v = jaw[r];
          if (typeof v === 'number' && !Number.isNaN(v)) {
            isi++;
            if (v === k[r]) benar++; else salah++;
          }
        }
        const kosong = Math.max(0, exp - isi);
        return { exp, isi, benar, salah, kosong };
      });
  
      const isiPerKolom     = colStats.map(s => s.isi);
      const benarPerKolom   = colStats.map(s => s.benar);
      const salahPerKolom   = colStats.map(s => s.salah);
      const kosongPerKolom  = colStats.map(s => s.kosong);
      const akurasiPerKolom = colStats.map(s => s.isi > 0 ? (s.benar / s.isi * 100) : 0);
  
      const totalIsi    = isiPerKolom.reduce((a, b) => a + b, 0);
      const totalBenar  = benarPerKolom.reduce((a, b) => a + b, 0);
      const totalSalah  = salahPerKolom.reduce((a, b) => a + b, 0);
      const totalKosong = Math.max(0, expectedTotal - totalIsi);
  
      const kolomDikerjakan = isiPerKolom.filter(v => v > 0).length || ((appState?.currentColumn ?? -1) + 1) || 0;
  
      const panker       = kolomDikerjakan > 0 ? (totalIsi / kolomDikerjakan) : 0;
      const tianker_abs  = totalSalah;
      const tianker_pct  = totalIsi > 0 ? (totalSalah / totalIsi * 100) : 0;
  
      let jDif = [];
      for (let i = 1; i < isiPerKolom.length; i++) {
        if (isiPerKolom[i] > 0 || isiPerKolom[i - 1] > 0) {
          jDif.push(Math.abs(isiPerKolom[i] - isiPerKolom[i - 1]));
        }
      }
      const jankerAvgDev = jDif.length ? (jDif.reduce((a, b) => a + b, 0) / jDif.length) : 0;
  
      const lastIdx  = Math.min(50, isiPerKolom.length) - 1;
      const firstIdx = 0;
      const hanker   = (lastIdx >= 0 && isiPerKolom.length > 0)
        ? (isiPerKolom[lastIdx] - isiPerKolom[firstIdx])
        : 0;
  
      const takeAvg = (arr, from, to) => {
        const seg = arr.slice(from, to);
        const valid = seg.filter(x => x > 0);
        return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
      };
  
      const n = isiPerKolom.length;
      const blk = 10;
      const earlyAvg = takeAvg(isiPerKolom, 0, Math.min(blk, n));
      const lateAvg  = takeAvg(isiPerKolom, Math.max(0, Math.min(50, n) - blk), Math.min(50, n));
      const deltaEL  = (lateAvg - earlyAvg);
  
      function linRegSlope(yFix) {
        const x = yFix.map((_, i) => i + 1);
        const m = x.length;
        if (!m) return 0;
        const meanX = x.reduce((a, b) => a + b, 0) / m;
        const meanY = yFix.reduce((a, b) => a + b, 0) / m;
        let num = 0, den = 0;
        for (let i = 0; i < m; i++) {
          num += (x[i] - meanX) * (yFix[i] - meanY);
          den += (x[i] - meanX) * (x[i] - meanX);
        }
        return den ? (num / den) : 0;
      }
  
      const slope = +linRegSlope(isiPerKolom).toFixed(3);
  
      let trenText;
      const TH_SLOPE = 0.15;
      const TH_DELTA = 1.00;
      if (slope <= -TH_SLOPE && deltaEL < -TH_DELTA)      trenText = "Menurun (indikasi kelelahan)";
      else if (slope >= +TH_SLOPE && deltaEL > +TH_DELTA) trenText = "Meningkat (indikasi pemanasan/ketahanan)";
      else                                                trenText = "Relatif stabil";
  
      const pScore = +panker.toFixed(1);
      const tScore = +tianker_abs;
      const jScore = +jankerAvgDev.toFixed(2);
      const hScore = +hanker.toFixed(2);
  
      const catP = USE_UGM_NORMS ? catFixedAsc(pScore, UGM_BANDS.PANKER, false) : "Cukup";
      const catT = USE_UGM_NORMS ? catFixedAsc(tScore, UGM_BANDS.TIANKER, true)  : "Cukup";
      const catJ = USE_UGM_NORMS ? catFixedAsc(jScore, UGM_BANDS.JANKER, true)   : "Cukup";
      const catH = USE_UGM_NORMS ? catFixedAsc(hScore, UGM_BANDS.HANKER, false)  : "Cukup";
  
      ySection += 4;
      ySection = ensurePage(doc, ySection);
  
      setTypewriter(doc, 'bold');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.text('HASIL TES KRAEPLIN', pageWidth / 2, ySection, { align: 'center' });
  
      setTypewriter(doc, 'normal');
      ySection += 3.5;
      ySection = ensurePage(doc, ySection);
  
      doc.setFontSize(7);
      doc.setTextColor(44, 62, 80);
  
      const marginX  = 15;
      const contentW = pageWidth - marginX * 2;
      const gap      = 8;
  
      let xData = marginX;
      let yy = ySection;
      const rows = [
        ["Benar", totalBenar],
        ["Salah", totalSalah],
        ["Kosong", totalKosong],
        ["Total Diisi", totalIsi],
        ["Total Seharusnya", expectedTotal],
        ["Kolom Dikerjakan", kolomDikerjakan]
      ];
  
      const labelW = 50;
      rows.forEach(([label, val]) => {
        yy = ensurePage(doc, yy);
        doc.text(label + ":", xData, yy);
        doc.text(String(val), xData + labelW, yy);
        yy += 3.1;
      });
      yy += 2.0;
  
      const LINE = 3.4;
      const SAFE = 6;
  
      function wrapAt(text, maxW) {
        const w = Math.max(4, maxW | 0);
        try { return doc.splitTextToSize(String(text ?? ""), w); }
        catch { return [String(text ?? "")]; }
      }
  
      function resetCS() {
        try { doc.setCharSpace && doc.setCharSpace(0); } catch (e) {}
      }
  
      let xPerf = marginX;
      let yPerf = yy + 4;
      if (yPerf > (Y_PB - 40)) { doc.addPage(); yPerf = 20; }
  
      setTypewriter(doc, 'bold');
      doc.text('PERFORMA (Ringkas)', xPerf, yPerf);
      doc.setDrawColor(200);
      doc.setLineWidth(0.2);
      doc.line(xPerf, yPerf + 1.2, xPerf + contentW - 2, yPerf + 1.2);
      setTypewriter(doc, 'normal');
      resetCS();
      yPerf += 3.8;
  
      const perfSummary = [
        `PANKER: ${pScore.toFixed(1)} (${catP})`,
        `TIANKER: ${tScore} salah (${tianker_pct.toFixed(1)}%) — ${catT}`,
        `JANKER: ${jScore.toFixed(2)} — ${catJ}`,
        `HANKER: ${(hScore >= 0 ? "+" : "")}${hScore.toFixed(2)} — ${catH}`,
        `Tren: slope=${slope}, awal=${earlyAvg.toFixed(1)} vs akhir=${lateAvg.toFixed(1)} (Δ=${deltaEL >= 0 ? "+" : ""}${deltaEL.toFixed(1)}) — ${trenText}.`
      ];
  
      perfSummary.forEach(line => {
        const lines = wrapAt(line, contentW - 8);
        const h = lines.length * LINE;
        if (yPerf + h + SAFE > Y_PB) { doc.addPage(); yPerf = 20; }
        for (let i = 0; i < lines.length; i++) doc.text(lines[i], xPerf + 2, yPerf + i * LINE);
        yPerf += h + 0.8;
      });
  
      let afterPerfBottom = yPerf + 4;
      if (afterPerfBottom > (Y_PB - 60)) { doc.addPage(); afterPerfBottom = 20; }
  
      let chartsBottom = afterPerfBottom;
      if (isiPerKolom.length > 0) {
        const chartW = Math.floor((contentW - gap) / 2);
        const maxIsi = Math.max(...isiPerKolom);
        const chartH = 48;
        let topY = afterPerfBottom + 2;
        if (topY + chartH > Y_PB) { doc.addPage(); topY = 20; }
  
        const leftBottom = renderKraeplinChartToPDF(
          doc, marginX, topY, chartW, chartH, isiPerKolom,
          {
            title: 'Pengerjaan/kolom', xLabel: 'Kolom', yLabel: 'Jumlah',
            yMin: 0, yMax: Math.max(30, Math.ceil(maxIsi * 1.1)), yTicksExplicit: null, yTickEvery: 5,
            showPts: true, pointLabels: true, labelEveryPt: 1, markExtrema: true, showMidrange: true,
            footerNote: `Rata-rata: ${pScore.toFixed(1)} | Kolom: ${kolomDikerjakan}`,
            padL: 18, padT: 9, padB: 11
          }
        );
  
        let rightBottom = leftBottom;
        if (akurasiPerKolom.length > 0) {
          rightBottom = renderKraeplinChartToPDF(
            doc, marginX + chartW + gap, topY, chartW, chartH,
            akurasiPerKolom.map(v => +v.toFixed(1)),
            {
              title: 'Akurasi/kolom (%)', xLabel: 'Kolom', yLabel: '% benar',
              yMin: 0, yMax: 100,
              yTicksExplicit: Array.from({ length: 11 }, (_, i) => i * 10), yTickEvery: 1,
              showPts: true, pointLabels: false, markExtrema: true, showMidrange: true,
              padL: 18, padT: 9, padB: 11
            }
          );
        }
        chartsBottom = Math.max(leftBottom, rightBottom) + 2;
      }
  
      ySection = ensurePage(doc, Math.max(chartsBottom, yPerf) + 6);
    }
  
    /* ============================================================
       DISC
       ============================================================ */
    if (appState.completed.DISC) {
      ySection += 2;
      ySection = ensurePage(doc, ySection);
  
      setTypewriter(doc, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `HASIL DISC ${appState.identity?.nickname || ''}`,
        pageWidth / 2, ySection, { align: 'center' }
      );
      ySection += 6;
      doc.setTextColor(44, 62, 80);
  
      setTypewriter(doc, 'bold');
      doc.setFontSize(7);
      doc.text('JAWABAN TES DISC', pageWidth / 2, ySection, { align: 'center' });
  
      setTypewriter(doc, 'normal');
      ySection += 2;
  
      const jawabanDISC = (appState.answers.DISC || []).map((ans, idx) => ({
        no: (idx + 1).toString(),
        p: (ans.p + 1).toString(),
        k: (ans.k + 1).toString()
      }));
  
      const barisDISC = Math.ceil(jawabanDISC.length / 4);
      const cols = [[], [], [], []];
      for (let i = 0; i < jawabanDISC.length; i++) {
        const colIndex = i % 4;
        cols[colIndex].push(jawabanDISC[i]);
      }
  
      const colX = [29, 67, 105, 143];
      let colY = ySection + 0.5;
  
      for (let r = 0; r < barisDISC; r++) {
        colY += 2.3;
        if (colY > 280) { doc.addPage(); colY = 20; }
        for (let c = 0; c < 4; c++) {
          const ans = cols[c][r];
          if (ans) {
            doc.text(`${ans.no}. [P]=${ans.p} ; [K]=${ans.k}`, colX[c], colY);
          }
        }
      }
  
      ySection = colY + 2;
  
      if (ySection > 220) {
        doc.addPage();
        ySection = 20;
      }
  
      const hasilDISC = countDISC(appState.answers.DISC, tests.DISC.questions);
  
      if (typeof drawDISCClassic === "function") {
        drawDISCClassic('discMost',   'most',   hasilDISC.most.D,   hasilDISC.most.I,   hasilDISC.most.S,   hasilDISC.most.C,   "#2176C7");
        drawDISCClassic('discLeast',  'least',  hasilDISC.least.D,  hasilDISC.least.I,  hasilDISC.least.S,  hasilDISC.least.C,  "#DE9000");
        drawDISCClassic('discChange', 'change', hasilDISC.change.D, hasilDISC.change.I, hasilDISC.change.S, hasilDISC.change.C, "#18b172");
        await new Promise(r => setTimeout(r, 80));
      }
  
      // GRAFIK DISC
      try {
        const imgMost   = document.getElementById('discMost')?.toDataURL('image/png') || null;
        const imgLeast  = document.getElementById('discLeast')?.toDataURL('image/png') || null;
        const imgChange = document.getElementById('discChange')?.toDataURL('image/png') || null;
  
        const imgWidth = 28, imgHeight = 60;
        const gapImg = 3;
        const totalWidth = imgWidth * 3 + gapImg * 2;
        const xStart = pageWidth / 2 - totalWidth / 2;
  
        if (imgMost)   doc.addImage(imgMost,   'PNG', xStart, ySection, imgWidth, imgHeight);
        if (imgLeast)  doc.addImage(imgLeast,  'PNG', xStart + imgWidth + gapImg, ySection, imgWidth, imgHeight);
        if (imgChange) doc.addImage(imgChange, 'PNG', xStart + (imgWidth + gapImg) * 2, ySection, imgWidth, imgHeight);
  
        doc.setFontSize(7);
        doc.setTextColor(33, 118, 199);
        doc.text('Most (P)', xStart + imgWidth / 2, ySection + imgHeight + 6, { align: 'center' });
        doc.setTextColor(222, 144, 0);
        doc.text('Least (K)', xStart + imgWidth + gapImg + imgWidth / 2, ySection + imgHeight + 6, { align: 'center' });
        doc.setTextColor(24, 177, 114);
        doc.text('Change', xStart + (imgWidth + gapImg) * 2 + imgWidth / 2, ySection + imgHeight + 6, { align: 'center' });
  
        doc.setTextColor(44, 62, 80);
        ySection += imgHeight + 12;
        if (ySection > 265) { doc.addPage(); ySection = 20; }
      } catch (e) {}
  
      // TABEL NILAI
      doc.setFontSize(8.5);
      const tableX = pageWidth / 2 - 54;
      let tY = ySection;
  
      doc.setFont(undefined, 'bold');
      doc.text('Line',    tableX,     tY);
      doc.text('D',       tableX + 22, tY);
      doc.text('I',       tableX + 33, tY);
      doc.text('S',       tableX + 44, tY);
      doc.text('C',       tableX + 55, tY);
      doc.text('*',       tableX + 66, tY);
      doc.text('Total',   tableX + 77, tY);
      doc.setFont(undefined, 'normal');
      tY += 4;
  
      // Most row
      doc.text('Most (P)', tableX, tY);
      doc.text(`${hasilDISC.most.D || 0}`,          tableX + 22, tY);
      doc.text(`${hasilDISC.most.I || 0}`,          tableX + 33, tY);
      doc.text(`${hasilDISC.most.S || 0}`,          tableX + 44, tY);
      doc.text(`${hasilDISC.most.C || 0}`,          tableX + 55, tY);
      doc.text(`${hasilDISC.most['*'] || 0}`,       tableX + 66, tY);
      doc.text(
        `${(hasilDISC.most.D || 0) + (hasilDISC.most.I || 0) + (hasilDISC.most.S || 0) + (hasilDISC.most.C || 0) + (hasilDISC.most['*'] || 0)}`,
        tableX + 77, tY
      );
      tY += 4;
  
      // Least row
      doc.text('Least (K)', tableX, tY);
      doc.text(`${hasilDISC.least.D || 0}`,         tableX + 22, tY);
      doc.text(`${hasilDISC.least.I || 0}`,         tableX + 33, tY);
      doc.text(`${hasilDISC.least.S || 0}`,         tableX + 44, tY);
      doc.text(`${hasilDISC.least.C || 0}`,         tableX + 55, tY);
      doc.text(`${hasilDISC.least['*'] || 0}`,      tableX + 66, tY);
      doc.text(
        `${(hasilDISC.least.D || 0) + (hasilDISC.least.I || 0) + (hasilDISC.least.S || 0) + (hasilDISC.least.C || 0) + (hasilDISC.least['*'] || 0)}`,
        tableX + 77, tY
      );
      tY += 4;
  
      // Change row
      doc.text('Change', tableX, tY);
      doc.text(`${hasilDISC.change.D >= 0 ? '+' : ''}${hasilDISC.change.D || 0}`, tableX + 22, tY);
      doc.text(`${hasilDISC.change.I >= 0 ? '+' : ''}${hasilDISC.change.I || 0}`, tableX + 33, tY);
      doc.text(`${hasilDISC.change.S >= 0 ? '+' : ''}${hasilDISC.change.S || 0}`, tableX + 44, tY);
      doc.text(`${hasilDISC.change.C >= 0 ? '+' : ''}${hasilDISC.change.C || 0}`, tableX + 55, tY);
      doc.text(`${hasilDISC.change['*'] >= 0 ? '+' : ''}${hasilDISC.change['*'] || 0}`, tableX + 66, tY);
      doc.text(
        `${(hasilDISC.change.D || 0) + (hasilDISC.change.I || 0) + (hasilDISC.change.S || 0) + (hasilDISC.change.C || 0) + (hasilDISC.change['*'] || 0)}`,
        tableX + 77, tY
      );
  
      ySection = tY + 8;
      if (ySection > 265) { doc.addPage(); ySection = 20; }
  
     // ========== CEK INVALID DULU ==========
  const starMost = Number(hasilDISC.most['*'] || 0);
  const starLeast = Number(hasilDISC.least['*'] || 0);
  const totalStar = starMost + starLeast;
  const identity = appState.identity || {};
  let blokX = 16;
  let blokW = 82;

 if (totalStar >= 13) {
  if (identity.position) {
    blokHeading(doc, `Analisis Posisi: ${identity.position}`, [33,33,33], blokX, ySection, 80, 8);
    ySection += 10;
    doc.setFontSize(16);
    doc.setTextColor(200,24,44);
    doc.text("❌ INVALID", blokX+2, ySection);
    doc.setTextColor(44,62,80);
    doc.setFontSize(8.2);
    ySection += 14;
    if (ySection > 265) { doc.addPage(); ySection = 20; }
  }
  // Tambahkan paragraf penjelasan detail, jangan menyebut bintang!
  const invalidMsg = [
    "Berdasarkan analisis terhadap pola jawaban yang Anda berikan pada tes DISC, hasil tes ini dinyatakan tidak valid untuk digunakan dalam penilaian kepribadian. Ketidaksesuaian ini menunjukkan bahwa respons yang diberikan tidak merefleksikan kecenderungan kepribadian Anda yang sebenarnya, sehingga analisis lebih lanjut tidak dapat dilakukan secara objektif.",
    "Perlu ditekankan bahwa setiap alat psikotes, termasuk DISC, telah didesain dengan prinsip validitas dan reliabilitas yang tinggi sehingga tidak dapat dimanipulasi. Mengisi tes dengan mencoba menampilkan citra tertentu atau menyesuaikan jawaban dengan ekspektasi hasil hanya akan menghasilkan data yang bias dan tidak mencerminkan diri Anda yang sesungguhnya.",
    "Integritas dalam mengisi tes kepribadian sangat penting untuk memperoleh gambaran yang akurat mengenai potensi, pola perilaku, serta area pengembangan diri. Jawaban yang jujur dan sesuai kondisi diri sendiri merupakan kunci agar hasil analisis benar-benar dapat digunakan untuk tujuan pengembangan, penempatan posisi, atau konsultasi psikologi secara efektif.",
    "Apabila Anda merasa hasil ini tidak mencerminkan diri Anda, penting untuk merenungkan kembali cara pengisian tes di masa mendatang. Isilah setiap tes psikologi dengan kejujuran, spontanitas, dan sesuai instruksi, tanpa upaya untuk mengarahkan hasil, demi memperoleh manfaat yang utuh dari proses psikotes yang Anda jalani."
  ];
  invalidMsg.forEach(par => {
    const lines = doc.splitTextToSize(par, 152);
    lines.forEach(line => {
      doc.text(line, blokX+2, ySection);
      ySection += 3.1;
    });
    ySection += 1.5;
  });
  // Tetap lanjut ke proses jawaban (tidak usah break, biar selesai bagian jawaban)
} else {
  // ================= ANALISIS DISC (Most / Least / Change) =================
  const most   = analisa2DominanDISC(hasilDISC.most.D,  hasilDISC.most.I,  hasilDISC.most.S,  hasilDISC.most.C,  'most',  getPixelY);
  const least  = analisa2DominanDISC(hasilDISC.least.D, hasilDISC.least.I, hasilDISC.least.S, hasilDISC.least.C, 'least', getPixelY);
 const change = analisa2DominanDISC(hasilDISC.change.D,hasilDISC.change.I,hasilDISC.change.S,hasilDISC.change.C,'change',getPixelY);



  // ============== Helper: AMBIL REKOMENDASI HANYA DARI KUNCI EXACT ==============
  function pickRolesFromDominan(dom) {
    const d = (dom || []).filter(Boolean).slice(0, 3);
    const key = d.join('').toUpperCase();   // contoh: ['S','I','C'] -> "SIC"
    const arr = (typeof DISC_ROLES_MAP !== 'undefined' && DISC_ROLES_MAP.hasOwnProperty(key))
      ? DISC_ROLES_MAP[key] : [];
    return Array.isArray(arr) ? arr : [];
  }

  // ================= Ambil rekomendasi TERPISAH per grafik =================
  const rolesMost   = pickRolesFromDominan(most.dominan);
  const rolesLeast  = pickRolesFromDominan(least.dominan);
  const rolesChange = pickRolesFromDominan(change.dominan);
    
(function renderThreeColumns() {
  const left = blokX;                                       // margin kiri area tulis
  const topMargin = 20, bottomMargin = 20;
  const pageH = doc.internal.pageSize.getHeight ? doc.internal.pageSize.getHeight() : 297;
  const yLimit = pageH - bottomMargin;

  const gap    = 10;                                        // jarak antar kolom (lebih besar biar jelas terpisah)
  const lineH  = 3.4;
  const subHeadH = 6;                                       // tinggi subjudul kolom (tanpa bar background)
  const subHeadGap = 5;                                     // jarak subjudul -> isi
  const sectionHeadH = 10;                                  // tinggi banner section
  const sectionHeadGap = 8;                                 // jarak banner -> subjudul kolom
  const gutter = 2;                                         // gutter dalam kolom (kiri/kanan)

  const blokW = pageWidth - 2 * left;
  const colW  = (blokW - 2 * gap) / 3;

  doc.setFontSize(8);

  function measureColHeight(list) {
    let h = 0;
    list.forEach(role => {
      const lines = doc.splitTextToSize('- ' + role, colW - 2 * gutter);
      h += lines.length * lineH;
    });
    return h;
  }

  const hMost   = measureColHeight(rolesMost);
  const hLeast  = measureColHeight(rolesLeast);
  const hChange = measureColHeight(rolesChange);

  // total tinggi yang dibutuhkan untuk SELURUH paket
  const contentH = Math.max(hMost, hLeast, hChange);
  const needH = sectionHeadH + sectionHeadGap +           // banner
                subHeadH + subHeadGap +                   // baris subjudul kolom
                contentH + 4;                             // isi + padding bawah

  // keep-together
  if (ySection + needH > yLimit) {
    doc.addPage();
    ySection = topMargin;
  }

  // ===== Banner section (satu, lebar penuh) =====
  doc.setFillColor(61,131,223);
  doc.rect(left - 2, ySection - 4, blokW, sectionHeadH, 'F');
  doc.setTextColor(255,255,255);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.text("REKOMENDASI KARIR", left + 2, ySection + 2);

  // reset style untuk isi
  ySection += sectionHeadH + sectionHeadGap;
  doc.setTextColor(0,0,0);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');

  // koordinat kolom
  const xMost   = left;
  const xLeast  = left + colW + gap;
  const xChange = left + 2 * (colW + gap);

  // ===== Subjudul kolom (tanpa bar background supaya tidak “menyatu”) =====
  doc.text("Most (P)",   xMost + gutter,   ySection);
  doc.text("Least (K)",  xLeast + gutter,  ySection);
  doc.text("Change (P-K)", xChange + gutter, ySection);

  // garis tipis di bawah subjudul agar tegas terpisah
  doc.setDrawColor(200,200,200);
  doc.line(xMost,   ySection + 1.5, xMost   + colW, ySection + 1.5);
  doc.line(xLeast,  ySection + 1.5, xLeast  + colW, ySection + 1.5);
  doc.line(xChange, ySection + 1.5, xChange + colW, ySection + 1.5);

  // jarak aman ke isi
  ySection += subHeadGap;
  doc.setFont(undefined, 'normal');

  function printCol(list, x, y) {
    let yy = y;
    list.forEach(role => {
      const lines = doc.splitTextToSize('- ' + role, colW - 2 * gutter);
      lines.forEach(line => {
        doc.text(line, x + gutter, yy);
        yy += lineH;
      });
    });
    return yy;
  }

  const yEndMost   = printCol(rolesMost,   xMost,   ySection);
  const yEndLeast  = printCol(rolesLeast,  xLeast,  ySection);
  const yEndChange = printCol(rolesChange, xChange, ySection);

  // garis pemisah vertikal samar (opsional; membantu persepsi tidak "menyatu")
  doc.setDrawColor(235,235,235);
  const colTop = ySection - subHeadGap + 1.5;             // sedikit di atas isi (tepat setelah garis subjudul)
  const colBottom = Math.max(yEndMost, yEndLeast, yEndChange);
  doc.line(xLeast - gap/2,  colTop, xLeast - gap/2,  colBottom);
  doc.line(xChange - gap/2, colTop, xChange - gap/2, colBottom);

  ySection = colBottom + 4;
})();


  // ===================== Kecocokan POSISI (opsional, pakai Most) =====================
  let simbol = "-";
  let detail = "";
  if (identity.position) {
   const persyaratan = {
  "Administrator": {
    sangat: ["SC","DC"],
    cocok:  ["CS","CD"],
    cukup:  ["SD","IS"]
  },
  
  "Dosen/Guru": {
    sangat: ["IS","IC","SI","SC"],
    cocok:  ["ID","SD"],
    cukup:  ["CS","CI"]
  },

  "Technical Staff": {
    sangat: ["DC","SC"],
    cocok:  ["CD","CS"],
    cukup:  ["DS","SD"]
  },

  "IT Staff": {
    sangat: ["DC","CD"], 
    cocok:  ["SC","CS"],
    cukup:  ["SD","DS"]
  },

  "Manajer": {
    sangat: ["DI","ID","DC","CD"],
    cocok:  ["DS","IS"],
    cukup:  ["SC","CS"]
  },

  "Housekeeping": {
    sangat: ["SC","CS"],
    cocok:  ["SI","IC"],
    cukup:  ["SD","DS"]
  }
};


    function makePairs(dom) {
      const d = (dom||[]).slice(0,3);
      const out = [];
      for (let i=0;i<d.length;i++) for (let j=i+1;j<d.length;j++) {
        out.push(d[i]+d[j], d[j]+d[i]); // di bagian posisi ini memang dua arah
      }
      return out;
    }
    const pairSet = makePairs(most.dominan);
  const posReq = persyaratan[identity.position];

if (posReq) {
  if (posReq.sangat.some(code => pairSet.includes(code))) {
    simbol = "SS";     // Sangat Sesuai
  } else if (posReq.cocok.some(code => pairSet.includes(code))) {
    simbol = "C";      // Cocok
  } else if (posReq.cukup.some(code => pairSet.includes(code))) {
    simbol = "CC";     // Cukup Cocok
  } else {
    simbol = "K";      // Kurang / Tidak Sesuai
  }
}


    if (identity.teacherLevel) {
      if (identity.teacherLevel === "SD"  && most.dominan.includes("I")) detail += "Sangat cocok untuk mengajar anak-anak.";
      if (identity.teacherLevel === "SMA" && most.dominan.includes("C")) detail += (detail ? " " : "") + "Cocok untuk mata pelajaran eksakta.";
    }

    let tinggiPos = 13 + (detail ? doc.splitTextToSize(detail, pageWidth-36).length*3.2 : 0);
    ySection = ensureSpace(doc, ySection, tinggiPos);
    blokHeading(doc, `Analisis Posisi: ${identity.position}`, [33,33,33], blokX, ySection, 80, 8);
    ySection += 10;
    doc.setFontSize(16);
    doc.text(simbol, blokX+2, ySection);
    doc.setFontSize(8.2);
    ySection += 5;
    if (detail) {
      let detLines = doc.splitTextToSize(detail, pageWidth-36);
      doc.text(detLines, blokX+2, ySection); ySection += detLines.length*3.2 + 2;
    }
    ySection += 5;
    if (ySection > 265) { doc.addPage(); ySection = 20; }
  }

 // ========== KESIMPULAN 3 GRAFIK + KECOCOKAN POSISI ==========

if (identity.position) {
  const nickname = identity.nickname || "Peserta";
  const posisi = identity.position;

  const gabunganAnalisis = (() => {
    const introMost  = `• Grafik Most (P): Menunjukkan kepribadian alami ${nickname} dalam kondisi nyaman.`;
    const mostDetails = [
      `  - Tipe Dominan: ${most.dominan.join(' dan ')} (${most.ranking})`,
      `  - Deskripsi: ${stripHTML(most.deskripsi)}`,
      `  - Implikasi: ${getImplication(most.dominan.join(""), 'most', posisi)}`
    ].join('\n');

    const introLeast  = `• Grafik Least (K): Menggambarkan respons ${nickname} terhadap tekanan dan tantangan.`;
    const leastDetails = [
      `  - Tipe Dominan: ${least.dominan.join(' dan ')} (${least.ranking})`,
      `  - Deskripsi: ${stripHTML(least.deskripsi)}`,
      `  - Implikasi: ${getImplication(least.dominan.join(""), 'least', posisi)}`
    ].join('\n');

    const introChange  = `• Grafik Change (P-K): Merefleksikan kemampuan adaptasi ${nickname} antara situasi normal dan tekanan.`;
    const changeDetails = [
      `  - Kombinasi Dominan: ${change.dominan.join(' dan ')} (${change.ranking})`,
      `  - Deskripsi: ${stripHTML(change.deskripsi)}`,
      `  - Implikasi: ${getImplication(change.dominan.join(""), 'change', posisi)}`
    ].join('\n');

    return [
      introMost, mostDetails, "",
      introLeast, leastDetails, "",
      introChange, changeDetails
    ].join('\n');
  })();


  // ===================== SIMBOL KE TEKS =====================
  const cocokStr = (
    simbol === "SS" ? "SANGAT SESUAI" :
    simbol === "C"  ? "COCOK" :
    simbol === "CC" ? "CUKUP COCOK" :
    simbol === "K"  ? "KURANG SESUAI" :
                      "TIDAK SESUAI"
  );


  // ===================== TEKS UTAMA =====================
  const kalimatCocok = `

TINGKAT KECOCOKAN:
• Posisi: ${posisi}
• ${simbol}
• Alasan: ${getCompatibilityReason(simbol, most.dominan[0], posisi)}
`;


  // ===================== CATATAN LEVEL (OPSIONAL) =====================
  let levelNote = "";
  if (identity.teacherLevel) {
    if (identity.teacherLevel === "SD" && most.dominan.includes("I")) {
      levelNote = "\n• Catatan Khusus: Gaya interpersonal yang hangat mendukung pembelajaran tingkat dasar.";
    }
    if (identity.teacherLevel === "SMA" && most.dominan.includes("C")) {
      levelNote = "\n• Catatan Khusus: Pendekatan analitis mendukung pengajaran eksakta tingkat menengah atas.";
    }
  }


  const kalimatAkhir = `

POTENSI PENGEMBANGAN:
${nickname} memiliki potensi untuk:
- Beradaptasi secara efektif dalam lingkungan kerja baru
- Berkontribusi positif melalui ${getStrengthArea(most.dominan[0])}
- Mengembangkan diri dalam peran ${posisi} melalui ${getDevelopmentArea(least.dominan[0])}`;

  const marginLR = 18;
  const blokW = pageWidth - 2 * marginLR;

  const sectionTitle = "KESIMPULAN ANALISIS DISC";
  ySection = ensureSpace(doc, ySection, 20);

  doc.setFillColor(61, 131, 223);
  doc.rect(blokX - 2, ySection - 4, blokW, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(sectionTitle, blokX + 2, ySection + 2);

  ySection += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8.5);
  doc.setFont(undefined, 'normal');

  // Cetak gabungan analisis Most/Least/Change
  const lines = gabunganAnalisis.split('\n');
  lines.forEach(line => {
    if (!line.trim()) { ySection += 2; return; }
    const wrapLines = doc.splitTextToSize(line, blokW - 8);
    wrapLines.forEach(wrapLine => {
      ySection = ensureSpace(doc, ySection, 4);
      doc.text(wrapLine, blokX + 2, ySection);
      ySection += 4;
    });
  });

  // Cetak kecocokan posisi + catatan level + potensi pengembangan
  [kalimatCocok, levelNote, kalimatAkhir].forEach(chunk => {
    if (!chunk) return;
    ySection += 6;
    const wraps = doc.splitTextToSize(chunk, blokW - 8);
    wraps.forEach(w => { ySection = ensureSpace(doc, ySection, 4); doc.text(w, blokX + 2, ySection); ySection += 4; });
  });

  ySection += 8;
  if (ySection > 265) { doc.addPage(); ySection = 20; }

  // ====================== BERADAPTASI DENGAN LINGKUNGAN BERBEDA ======================
  // Catatan: Graph 1 = Most (P), Graph 2 = Least (K). Perubahan diukur berbasis Y-pixel.
  // Pada kanvas PDF: y lebih kecil = titik lebih ATAS (lebih dominan secara visual).

  // Helper untuk mengambil nilai {D,I,S,C} baik dari struktur {nilai:{...}} maupun langsung {...}
  const getAxisVals = (obj) => (obj && obj.nilai) ? obj.nilai : obj || {};
  const mVals = getAxisVals(most);
  const lVals = getAxisVals(least);

  // Y pixel pada masing-masing grafik (Most & Least)
  const yMost = {
    D: getPixelY('most',  'D', +(mVals.D ?? 0)),
    I: getPixelY('most',  'I', +(mVals.I ?? 0)),
    S: getPixelY('most',  'S', +(mVals.S ?? 0)),
    C: getPixelY('most',  'C', +(mVals.C ?? 0)),
  };
  const yLeast = {
    D: getPixelY('least', 'D', +(lVals.D ?? 0)),
    I: getPixelY('least', 'I', +(lVals.I ?? 0)),
    S: getPixelY('least', 'S', +(lVals.S ?? 0)),
    C: getPixelY('least', 'C', +(lVals.C ?? 0)),
  };

  // Delta pixel (Least - Most). Ingat: delta < 0 = naik (lebih atas, cenderung lebih terekspresikan); delta > 0 = turun.
  const dPx = {
    D: yLeast.D - yMost.D,
    I: yLeast.I - yMost.I,
    S: yLeast.S - yMost.S,
    C: yLeast.C - yMost.C,
  };

  // Formatter teks delta pixel
  const fmtPx = (v) => `${Math.abs(Math.round(v))} px`;

  // Klasifikasi signifikansi berbasis jarak pixel
  // 18px+ signifikan (tampak jelas); 10–17px moderat; <10px minor.
  const klasifikasi = (px) => {
    const a = Math.abs(Math.round(px));
    if (a >= 18) return { tingkat: "signifikan", penjelasan: "perubahan kuat & tampak dalam perilaku" };
    if (a >= 10) return { tingkat: "moderat",    penjelasan: "perubahan terasa pada situasi tertentu" };
    return         { tingkat: "minor",      penjelasan: "perubahan halus/nuansa" };
  };

  // Cek lintas midline (zona dominansi) untuk masing-masing faktor
  const isAbove = (tipe, axis, val) => {
    const mid = getMidline(tipe);
    const y   = getPixelY(tipe, axis, val);
    return Number.isFinite(y) ? (y <= mid) : false; // true = di atas midline (lebih menonjol)
  };
  const crossMid = (axis) => {
    const aMost  = isAbove('most',  axis, +(mVals[axis] ?? 0));
    const aLeast = isAbove('least', axis, +(lVals[axis] ?? 0));
    return aMost !== aLeast;
  };

  // Header section adaptasi
  ySection = ensureSpace(doc, ySection, 20);
  const blokXSafe = (typeof blokX !== 'undefined') ? blokX : marginLR;
  const blokW2    = pageWidth - 2 * marginLR;

  doc.setFillColor(61, 131, 223);
  doc.rect(blokXSafe - 2, ySection - 4, blokW2, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text("BERADAPTASI DENGAN LINGKUNGAN BERBEDA", blokXSafe + 2, ySection + 2);

  // Paragraf pembuka
  ySection += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8.5);
  doc.setFont(undefined, 'normal');

  const pembuka = [
    `Pada lembar ini, ${nickname} diminta melihat ketiga grafik dan materi profil secara utuh.`,
    `Perubahan dari Grafik 1 (Most) ke Grafik 2 (Least) sering merefleksikan respons terhadap stres/lingkungan.`,
    `Perubahan dapat membantu ${nickname} mengatasi tuntutan situasi atau menjadi sinyal untuk menata strategi adaptasi.`,
    `Dengan personal feedback, ${nickname} dapat melakukan self-monitor dan menggunakan informasi ini secara positif.`,
    "",
    "Bandingkan Grafik 1 dan 2. Saat berada pada Grafik 2 (Least), perhatikan pergeseran tiap faktor (naik/turun/konstan) dibandingkan Grafik 1 (Most):"
  ];

  pembuka.forEach(line => {
    if (!line.trim()) { ySection += 2; return; }
    const wraps = doc.splitTextToSize(line, blokW2 - 8);
    wraps.forEach(w => { ySection = ensureSpace(doc, ySection, 4); doc.text(w, blokXSafe + 2, ySection); ySection += 4; });
  });

  // Narasi per faktor (berbasis pixel, lintas midline, dan kaidah psikologi DISC)
  function barisFaktor(axis, dp, naikMsg, turunMsg, konstanMsg) {
    if (!Number.isFinite(dp)) return `- Faktor "${axis}": data tidak tersedia.`;
    const arah = (dp < 0) ? "naik" : (dp > 0) ? "turun" : "tetap";
    if (arah === "tetap") return `- Faktor "${axis}" tetap — ${konstanMsg}`;
    const kelas = klasifikasi(dp);
    const lintas = crossMid(axis) ? "; **melintasi midline** (zona dominansi berubah)" : "";
    const makna  = (dp < 0) ? naikMsg : turunMsg;
    return `- Faktor "${axis}" ${arah} ~${fmtPx(dp)} (${kelas.tingkat}${lintas}) — ${makna} (${kelas.penjelasan}).`;
  }

  const bulletD = barisFaktor(
    "D", dPx.D,
    `${nickname} menambah kontrol/asertivitas untuk menjaga arah & hasil saat tekanan meningkat.`,
    `${nickname} relatif melepas kontrol; lebih menerima arahan orang lain dalam situasi tertekan.`,
    "preferensi kontrol relatif stabil di berbagai konteks."
  );

  const bulletI = barisFaktor(
    "I", dPx.I,
    `${nickname} menguatkan komunikasi/persuasi dan menggalang dukungan sosial untuk menyelesaikan tugas.`,
    `${nickname} menahan komunikasi; interaksi dibuat lebih selektif & fungsional.`,
    "gaya interaksi sosial cenderung konstan (tidak banyak berubah)."
  );

  const bulletS = barisFaktor(
    "S", dPx.S,
    `${nickname} mencari kestabilan & rasa aman; cenderung menghindari konflik dan menunggu timing yang tepat.`,
    `${nickname} bergerak lebih cepat; pengambilan keputusan cenderung lebih cepat/impulsif.`,
    "kebutuhan stabilitas/ketekunan relatif tidak berubah."
  );

  const bulletC = barisFaktor(
    "C", dPx.C,
    `${nickname} meningkatkan kebutuhan data/aturan; keputusan diambil setelah informasi memadai.`,
    `${nickname} lebih pragmatis; keputusan lebih mengandalkan pertimbangan praktis/"gut feeling".`,
    "kebutuhan ketelitian/kepatuhan relatif tetap."
  );

  [bulletD, bulletI, bulletS, bulletC].forEach(line => {
    const wraps = doc.splitTextToSize(line, blokW2 - 8);
    wraps.forEach(w => { ySection = ensureSpace(doc, ySection, 4); doc.text(w, blokXSafe + 2, ySection); ySection += 4; });
  });

  ySection += 8;
  if (ySection > 265) { doc.addPage(); ySection = 20; }

  // ====================== ANALISIS SIGNIFIKANSI & POLA PSIKOLOGIS (Most vs Least) ======================
  {
    // Dominansi atas-midline di masing-masing grafik
    const domMost  = getDominantByMidline('most',  +(mVals.D??0), +(mVals.I??0), +(mVals.S??0), +(mVals.C??0));
    const domLeast = getDominantByMidline('least', +(lVals.D??0), +(lVals.I??0), +(lVals.S??0), +(lVals.C??0));

    // Skor arah adaptasi agregat:
    // Faktor yang "naik" (Δy<0) dianggap makin diaktifkan saat tekanan.
    const asertifAktif = (dPx.D < 0 ? 1 : 0) + (dPx.I < 0 ? 1 : 0); // D/I → eksekusi & pengaruh
    const stabilAktif  = (dPx.S < 0 ? 1 : 0) + (dPx.C < 0 ? 1 : 0); // S/C → stabilitas & akurasi

    let arahAdaptasi = "";
    if (asertifAktif > stabilAktif) {
      arahAdaptasi = "Di bawah tekanan, pola bergerak ke **lebih asertif/eksekutif (D/I)**: menambah kontrol, mempercepat keputusan, dan/atau meningkatkan komunikasi pengaruh.";
    } else if (stabilAktif > asertifAktif) {
      arahAdaptasi = "Di bawah tekanan, pola bergerak ke **lebih stabil/akurasi (S/C)**: mencari kepastian proses, data, dan suasana yang aman sebelum melangkah.";
    } else {
      arahAdaptasi = "Di bawah tekanan, pola **seimbang** antara dorongan asertif (D/I) dan kebutuhan stabil-akurasi (S/C); penyesuaian bersifat kontekstual.";
    }

    const domMostStr  = domMost.join("-");
    const domLeastStr = domLeast.join("-");
    const ringkasDominansi = (domMostStr !== domLeastStr)
      ? `Dominansi bergeser: **Most:** ${domMostStr || "—"} → **Least:** ${domLeastStr || "—"}`
      : `Dominansi relatif **konsisten** antara Most & Least (${domMostStr || "—"})`;

    // Subjudul kotak tip
    ySection = ensureSpace(doc, ySection, 18);
    const blokW3 = pageWidth - 2 * marginLR;

    doc.setFillColor(230, 241, 255);
    doc.rect(blokXSafe - 2, ySection - 3, blokW3, 8, 'F');
    doc.setTextColor(0, 84, 153);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text("Analisis Signifikansi Perubahan & Pola Psikologis", blokXSafe + 2, ySection + 2);

    // Narasi psikologis makro + catatan etis
    ySection += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'normal');

    const narasi = [
      ringkasDominansi,
      arahAdaptasi,
      "Catatan interpretatif (kaidah psikologi DISC):",
      "• D (Dominance): terkait kontrol, keberanian mengambil keputusan, orientasi hasil.",
      "• I (Influence): terkait komunikasi, persuasi, jejaring sosial, optimisme.",
      "• S (Steadiness): terkait kestabilan, kesabaran, konsistensi ritme kerja.",
      "• C (Conscientiousness): terkait ketelitian, kepatuhan, akurasi berbasis data.",
      "",
      "Peringatan interpretasi: Hasil ini adalah gambaran preferensi perilaku dalam konteks kerja/tekanan; bukan diagnosis klinis.",
      "Gunakan bersama observasi lapangan dan umpan balik rekan/atasan untuk keputusan pengembangan yang proporsional."
    ];

    narasi.forEach(line => {
      const wraps = doc.splitTextToSize(line, blokW3 - 8);
      wraps.forEach(w => { ySection = ensureSpace(doc, ySection, 4); doc.text(w, blokXSafe + 2, ySection); ySection += 4; });
    });

    ySection += 8;
    if (ySection > 265) { doc.addPage(); ySection = 20; }
  }

    } // endif identity.position
  }   // tutup else (totalStar >= 13)
}     // tutup if (appState.completed.DISC)

function getImplication(dominantType, graphType, position, nickname = appState.identity?.nickname || "Peserta") {
  const pos = position;
  const key = dominantType || '';
  const implications = {
    D: {
      Administrator: {
        most: `
Sebagai pribadi bertipe Dominan, ${nickname} menunjukkan peran yang sangat kuat dalam mengatur dan memimpin tim administrasi. ${nickname} sigap mengambil inisiatif, berani mengusulkan perbaikan sistem kerja, dan tidak segan menegakkan aturan demi menjaga ketertiban administrasi. Dorongan untuk terus bergerak maju, serta kemauan mendorong anggota tim ke arah produktivitas, membuat ${nickname} menjadi motor penggerak tercapainya standar administrasi yang tinggi dan efisien. Karakter ini sangat penting terutama ketika institusi membutuhkan ketegasan, percepatan, dan hasil nyata di bidang tata kelola administrasi.
        `.trim(),
        least: `
Saat menghadapi tekanan besar atau perubahan mendadak, karakter Dominan dalam diri ${nickname} dapat berubah menjadi kekakuan berlebihan dalam menjalankan aturan, bahkan menuntut standar yang sangat tinggi dari rekan kerja. Sikap ini kadang membuat suasana kerja tegang dan komunikasi menjadi kurang lancar. Maka penting bagi ${nickname} untuk selalu membuka komunikasi dua arah, meningkatkan empati, dan memperkuat kerja sama tim agar tekanan tidak berujung pada demotivasi anggota.
        `.trim(),
        change: `
Dalam menghadapi tekanan deadline administrasi atau perubahan sistem, ${nickname} tetap mampu menjaga kendali dan memberikan arahan yang jelas. Namun, tantangannya adalah membuka diri pada masukan rekan sejawat dan meningkatkan fleksibilitas, sehingga sistem kerja tetap adaptif dan efisien walaupun target berubah-ubah.
        `.trim()
      },
      Guru: {
        most: `
Sebagai sosok Dominan, ${nickname} tampil sebagai pemimpin kelas yang tegas dan mampu mengambil keputusan secara cepat. Karakter ini sangat mendukung pengelolaan kelas aktif, terutama ketika dibutuhkan tindakan tegas menjaga disiplin siswa. ${nickname} cenderung mampu membentuk suasana belajar yang terarah, memberikan arahan yang jelas, dan menjadi teladan keberanian serta kemandirian di lingkungan pendidikan. Kemampuan ini sangat penting untuk memastikan proses pembelajaran berjalan lancar dan target akademik tercapai.
        `.trim(),
        least: `
Saat tekanan atau konflik muncul di kelas, sisi Dominan pada ${nickname} bisa berubah menjadi kecenderungan otoriter, kurang sabar, bahkan terlalu menuntut siswa. Sikap seperti ini bisa mengurangi rasa nyaman siswa. Oleh sebab itu, ${nickname} perlu menyeimbangkan antara ketegasan dan empati, sehingga siswa tetap merasa dihargai serta dibimbing dengan hati.
        `.trim(),
        change: `
Menghadapi perubahan kurikulum, aturan sekolah, atau tekanan di kelas, ${nickname} tetap dapat menjaga peran pemimpin dan memastikan kelas berjalan sesuai rencana. Namun, fleksibilitas dan kreativitas dalam pendekatan belajar sangat penting agar kelas tidak hanya disiplin tapi juga mampu menyesuaikan diri dengan kebutuhan siswa yang beragam.
        `.trim()
      },
      "Technical Staff": {
        most: `
Dalam peran sebagai tenaga teknis, ${nickname} yang bertipe Dominan sangat sigap mengatasi masalah, berani mengambil keputusan perbaikan, dan mampu memimpin pelaksanaan solusi di lapangan. Dorongan untuk bergerak cepat, mencari solusi tuntas, serta menjaga standar mutu tinggi menjadi ciri utama kinerja ${nickname}. Karakter ini sangat dibutuhkan terutama pada situasi teknis yang memerlukan reaksi cepat dan ketegasan.
        `.trim(),
        least: `
Pada situasi tekanan atau konflik di tim teknis, kecenderungan Dominan dalam diri ${nickname} dapat membuatnya bertindak tergesa-gesa atau menuntut hasil sempurna dari tim. Akibatnya, komunikasi teknis bisa menjadi terlalu singkat, bahkan kurang sabar terhadap proses. Untuk itu, ${nickname} perlu melatih kemampuan komunikasi, mendengarkan pendapat anggota tim, dan menjaga suasana kerja tetap kondusif walaupun dalam tekanan.
        `.trim(),
        change: `
Ketika terjadi perubahan mendadak atau tekanan pekerjaan meningkat, ${nickname} tetap mampu bertahan dan bergerak cepat mengambil keputusan. Namun, di sisi lain, penting bagi ${nickname} untuk tetap mengutamakan prosedur keselamatan kerja, mendokumentasikan langkah-langkah teknis dengan teliti, serta terbuka terhadap masukan dari rekan teknis demi kelancaran operasional jangka panjang.
        `.trim()
      },
      Housekeeping: {
        most: `
Sebagai pribadi Dominan, ${nickname} sangat cepat dan tegas dalam mengambil keputusan untuk memastikan area kerja selalu bersih, rapi, serta memenuhi standar tinggi yang ditetapkan perusahaan. Karakter kepemimpinan ${nickname} sangat menonjol dalam mengatur ritme kerja tim, memotivasi anggota agar selalu bekerja optimal, serta tidak ragu menegur jika ditemukan pelanggaran aturan kebersihan. Komitmen terhadap hasil nyata serta dorongan untuk terus memperbaiki proses kerja menjadi fondasi utama yang membuat performa tim Housekeeping tetap prima dan disiplin.
        `.trim(),
        least: `
Ketika menghadapi tekanan tinggi, karakter Dominan dalam diri ${nickname} bisa muncul sebagai kecenderungan terlalu keras menegakkan aturan kebersihan atau menunjukkan ketidaksabaran pada anggota tim yang kurang disiplin. Sikap ini berisiko menciptakan jarak emosional dengan rekan kerja, menurunkan motivasi tim, dan membuat suasana kerja menjadi kurang kondusif. Penting bagi ${nickname} untuk meningkatkan sensitivitas komunikasi, memberikan umpan balik yang membangun, serta mengasah kemampuan mendengarkan agar suasana tim tetap harmonis di bawah tekanan.
        `.trim(),
        change: `
Pada saat beban kerja meningkat atau terjadi perubahan metode kerja, ${nickname} tetap mampu menyesuaikan strategi dengan cepat dan mengambil alih kendali situasi. Tantangan utamanya adalah membuka diri terhadap masukan anggota tim agar perubahan yang dilakukan lebih efektif dan diterima bersama. Kemampuan mengelola tekanan, mendelegasikan tugas secara proporsional, dan menumbuhkan semangat kolaborasi akan memperkuat peran ${nickname} sebagai pemimpin Housekeeping yang adaptif dan inspiratif.
        `.trim()
      }
    },
    DI: {
  Administrator: {
    most: `
Sebagai kombinasi Dominan–Influencer, ${nickname} memadukan ketegasan eksekusi dengan kemampuan memobilisasi orang. ${nickname} menetapkan standar tinggi, menuntut kejelasan otoritas, dan cepat mendorong perbaikan proses. Ia logis, kritis, dan imajinatif dalam memecahkan masalah—efektif sebagai motor perubahan administrasi yang progresif. Fokus tugas menjaga kinerja terarah, sementara sisi Influencer membangun dukungan lintas unit.
    `.trim(),
    least: `
Di bawah tekanan, sisi D-I pada ${nickname} bisa tampak kaku, dingin, dan terlalu menuntut standar sempurna, membuat koordinasi top–down dan komunikasi terpotong. Risiko: overcontrol, toleransi rendah pada deviasi, dan kritik sebelum buy-in. Antidot: aktifkan empati/persuasi, buka umpan balik dua arah, dan kalibrasikan ekspektasi agar tim tetap termotivasi.
    `.trim(),
    change: `
Saat terjadi perubahan sistem atau target baru, ${nickname} bergerak cepat mengambil keputusan dan mendefinisikan arah. Manfaatkan pengaruh untuk menyosialisasikan perubahan dan menggalang komitmen. Guardrail: tetapkan checkpoint kualitas, dokumentasikan keputusan, dan pisahkan “wajib” vs “opsional” agar kecepatan tidak mengorbankan akurasi & kepatuhan.
    `.trim()
  },
  Guru: {
    most: `
Sebagai pendidik D-I, ${nickname} karismatik, tegas, dan mampu menggerakkan kelas menuju sasaran yang jelas. Progresif dalam metode, berani mencoba hal baru, serta pandai memotivasi siswa. Standar tinggi menjaga disiplin dan hasil belajar, sementara energi serta komunikasi yang kuat membuat pembelajaran hidup dan terarah.
    `.trim(),
    least: `
Dalam tekanan (konflik kelas, tenggat kurikulum), ${nickname} dapat menjadi terlalu direktif dan kurang memberi ruang suara siswa. Risiko: kelas merasa “terdorong” bukan “terinspirasi”, muncul resistensi/kelelahan. Penyeimbang: selipkan jeda refleksi, teknik bertanya terbuka, dan diferensiasi tugas agar standar tinggi tetap humanis.
    `.trim(),
    change: `
Ketika kurikulum/penilaian berubah, ${nickname} sigap menstrukturkan implementasi dan mengajak siswa mengikuti ritme baru. Sisi Influencer mendukung sosialisasi ke orang tua/kolaborator. Pastikan scaffolding: target bertahap, rubrik jelas, dan umpan balik terjadwal agar adaptasi cepat tanpa kesenjangan pemahaman.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam konteks teknis, ${nickname} bergerak cepat melakukan triase masalah, menentukan prioritas, dan memimpin eksekusi perbaikan. Ia kritis–logis saat menganalisis akar masalah dan imajinatif merancang solusi. Dorongan kompetitif dan standar tinggi menjaga reliability, sementara pengaruh interpersonal memudahkan koordinasi lintas fungsi saat insiden.
    `.trim(),
    least: `
Di tekanan insiden, ${nickname} berisiko mengambil jalan pintas, menekan tim untuk “sempurna sekarang”, atau kurang sabar pada proses. Dampak: dokumentasi terlewat, komunikasi singkat, kelelahan tim. Peredam: gunakan checklist insiden, tetapkan “fix-now / fix-next”, dan lakukan postmortem berbasis data agar kecepatan tidak mengorbankan keselamatan & traceability.
    `.trim(),
    change: `
Saat migrasi teknologi/perubahan arsitektur, ${nickname} efektif sebagai champion: menetapkan milestone, membagi peran, dan menggerakkan adopsi. Kunci: definisikan batas otoritas, sediakan rencana rollback, dan wajibkan dokumentasi konfigurasi agar keberanian mencoba hal baru tetap aman, auditable, dan terpelihara.
    `.trim()
  },
  Housekeeping: {
    most: `
Sebagai pemimpin shift D-I, ${nickname} tegas menjaga standar kebersihan, rute kerja, dan SLA area. Ia mampu memotivasi anggota, mengoordinasikan lintas area, dan cepat menindak temuan. Standar tinggi serta orientasi hasil menjadikan area rapi–terkendali, sementara pengaruh interpersonal mempercepat pembiasaan SOP.
    `.trim(),
    least: `
Di beban puncak, ${nickname} bisa terdengar keras, kurang sabar pada pelanggaran kecil, dan menekan tim untuk “zero defect” seketika. Risiko: moral turun, komunikasi satu arah. Penyeimbang: umpan balik model sandwich, toleransi kesalahan yang edukatif, dan apresiasi kepatuhan untuk menjaga motivasi.
    `.trim(),
    change: `
Ketika metode kerja atau layout area berubah, ${nickname} cekatan merancang ulang rute, menetapkan standar baru, dan melatih tim. Agar transisi mulus: lakukan pilot kecil, tampilkan metrik sederhana (compliance, temuan, waktu siklus), dan perkuat coaching on-the-spot sehingga perubahan cepat sekaligus berkelanjutan.
    `.trim()
  }
},
    DS: {
  Administrator: {
    most: `
Sebagai kombinasi Dominan–Steady, ${nickname} menggabungkan ketegasan target dengan kestabilan proses. Ia objektif, analitis, dan konsisten menjaga SLA administrasi, seraya memberi dukungan pada otoritas yang dihormati. Penetapan tujuan jelas, SOP rapi, dan tindak lanjut yang kuat membuat operasi harian tertib serta dapat diprediksi.
    `.trim(),
    least: `
Di bawah tekanan, ${nickname} dapat menjadi terlalu kaku pada prosedur dan enggan mengubah rute kerja yang sudah mapan. Risiko: keputusan tertunda “menunggu data lengkap”, over-commit pada banyak hal, serta komunikasi yang tenang tetapi kurang asertif. Penyeimbang: tetapkan batas waktu keputusan, delegasikan follow-up, dan gunakan ringkasan 1 halaman untuk percepat eskalasi.
    `.trim(),
    change: `
Saat perubahan kebijakan/sistem, ${nickname} efektif memimpin transisi bertahap: pilot kecil, jadwal jelas, dan checklist implementasi. Jaga ritme stabil dengan milestone mingguan, definisikan kriteria sukses–gagal, dan sediakan rencana rollback agar adaptasi cepat namun tetap terkendali.
    `.trim()
  },
  Guru: {
    most: `
Sebagai pendidik |D-S|, ${nickname} tegas namun menenangkan. Ia menata kelas yang disiplin, konsisten pada aturan, dan memiliki tindak lanjut tugas yang rapi. Hubungan dengan siswa dijaga secara profesional; fokus pada tujuan belajar didukung struktur kegiatan yang stabil dan aman bagi semua.
    `.trim(),
    least: `
Dalam tekanan (konflik kelas/penilaian beruntun), ${nickname} bisa menjadi kaku pada rencana, enggan mencoba metode baru, dan kurang memberi ruang spontanitas siswa. Antidot: selipkan refleksi singkat, variasi aktivitas rendah-risiko, dan gunakan kontrak belajar agar standar tetap tinggi tanpa mematikan partisipasi.
    `.trim(),
    change: `
Saat kurikulum berubah, ${nickname} menyusun adaptasi bertahap: rubrik jelas, contoh pekerjaan, dan penjadwalan ulang beban tugas. Buat “peta transisi” (apa tetap, apa berubah, apa dihapus) sehingga kestabilan kelas terjaga sembari standar mutu naik.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam konteks teknis, ${nickname} tenang–tegas: cepat menetapkan prioritas, lalu eksekusi terstruktur dengan SOP. Ia objektif dalam analisis akar masalah dan dikenal rapi pada follow-up, sehingga reliabilitas sistem terjaga dan hutang teknis ditekan.
    `.trim(),
    least: `
Di puncak tekanan, ${nickname} cenderung bertahan pada cara yang sudah aman, menunda eskalasi, atau menghindari eksperimen solusi. Dampak: penyelesaian lambat dan backlog tumbuh. Peredam: tetapkan kriteria “escalate now”, gunakan matriks risiko, dan pisahkan perbaikan cepat vs jangka panjang.
    `.trim(),
    change: `
Saat migrasi/perubahan arsitektur, ${nickname} unggul dengan rollout bertahap (canary/blue–green), runbook, serta checklist validasi. Kunci: timebox analisis, buat komunikasi status ritmik, dan dokumentasikan keputusan agar stabilitas tetap menjadi jangkar selama perubahan.
    `.trim()
  },
  Housekeeping: {
    most: `
Sebagai pemimpin tim kebersihan, ${nickname} menjaga standar tinggi dengan ritme kerja stabil. Rute, jadwal, dan inspeksi konsisten; tindak lanjut temuan selalu selesai. Kombinasi tegas–tenang memupuk kedisiplinan tanpa menciptakan kepanikan.
    `.trim(),
    least: `
Di beban puncak, ${nickname} bisa terjebak pada jadwal kaku, lambat menukar prioritas area, dan menuntut ketuntasan penuh sebelum pindah tugas. Risiko: antrean kerja dan kelelahan tim. Penyeimbang: gunakan prinsip “critical first”, rotasi beban, dan checkpoint singkat antarsesi.
    `.trim(),
    change: `
Ketika layout/SOP berubah, ${nickname} menjalankan perubahan lewat simulasi rute, briefing singkat di lapangan, dan buddy system. Metode “uji–evaluasi–sebar” memastikan adopsi cepat namun tetap stabil dan aman.
    `.trim()
  }
},

DC: {
  Administrator: {
    most: `
Kombinasi Dominan–Conscientious membuat ${nickname} tegas sekaligus presisi. Ia menetapkan target yang terukur, menjaga kepatuhan kebijakan, dan memperkuat dokumentasi serta kontrol mutu. Keputusan cepat namun berbasis data; deviasi kecil pun ditangani lewat perbaikan proses yang konkret.
    `.trim(),
    least: `
Di bawah tekanan, perfeksionisme dapat memicu micromanagement, kritik tajam, atau jeda keputusan karena “mencari opsi terbaik”. Risiko: antrian persetujuan dan demotivasi tim. Antidot: timebox analisis, definisikan “good enough” & acceptance criteria, serta delegasikan detail eksekusi.
    `.trim(),
    change: `
Dalam perubahan sistem/struktur, ${nickname} efektif bila kriteria sukses jelas, RACI tegas, dan ada “minimum viable process” untuk go-live. Sertakan kontrol mutu pasca-implementasi dan jendela freeze agar kualitas tetap terjaga saat percepatan.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |D-C|, ${nickname} menyusun pembelajaran yang sangat terstruktur dengan standar tinggi. Ia cepat memutuskan langkah kelas, namun teliti pada materi, rubrik, dan evaluasi. Hasilnya: kelas tertib, ekspektasi jelas, dan akurasi penilaian kuat.
    `.trim(),
    least: `
Dalam tekanan, ${nickname} bisa terlalu banyak aturan, nada umpan balik menjadi kritis, dan spontanitas belajar berkurang. Risiko: siswa cemas dan kreativitas menurun. Penyeimbang: ruang eksplorasi terarah, bahasa umpan balik konstruktif, dan prioritas kompetensi inti agar tempo tetap manusiawi.
    `.trim(),
    change: `
Saat ada perubahan kurikulum/asesmen, ${nickname} menyiapkan checklist, contoh tugas, dan rubrik baru. Jaga agar tidak over-engineering: batasi indikator pada yang kritikal, uji coba skala kecil, dan iterasi cepat berdasarkan data hasil belajar.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam peran teknis, ${nickname} memimpin RCA dengan tajam, menetapkan kontrol perubahan ketat, dan mengeksekusi perbaikan yang presisi. Ia menggabungkan kecepatan keputusan dengan verifikasi menyeluruh sehingga reliabilitas dan kepatuhan teknis terjaga.
    `.trim(),
    least: `
Di tekanan insiden, ${nickname} bisa jatuh ke “analysis paralysis” atau sebaliknya memutuskan cepat namun kritis pada tim. Dampak: komunikasi renggang dan risiko blame. Peredam: definisikan protokol insiden (commander, scribe, PIC), uji hipotesis bertahap, dan lakukan postmortem tanpa menyalahkan.
    `.trim(),
    change: `
Pada perubahan arsitektur, ${nickname} unggul bila ada RFC, test plan, rollback, dan metrik kualitas yang disepakati. Hindari overengineering: fokus pada CTQ (critical-to-quality), timebox desain, dan iterasi setelah telemetry menunjukkan stabil.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menegakkan standar kebersihan secara tegas sekaligus rinci. Audit rutin, SOP detail, dan pelatihan terukur memastikan kualitas konsisten. Ia cepat mengoreksi deviasi kecil agar tidak menjadi pola.
    `.trim(),
    least: `
Di beban puncak, kecenderungan perfeksionis bisa memicu kritik berlebihan dan waktu tersita pada detail minor. Risiko: motivasi tim turun dan throughput merosot. Penyeimbang: daftar CTQ area, sampling audit, dan apresiasi perilaku patuh.
    `.trim(),
    change: `
Saat metode/peralatan baru diterapkan, ${nickname} menyusun standar kerja, daftar cek, dan metrik hasil. Terapkan adopsi bertahap, review harian singkat, dan jaga keseimbangan antara akurasi dan kecepatan agar kualitas naik tanpa menghambat pelayanan.
    `.trim()
  }
},
    DIS: {
  Administrator: {
    most: `
Sebagai kombinasi Dominan–Influencer–Steady, ${nickname} unggul menggerakkan orang dan pekerjaan sekaligus menjaga ritme tim. Ia fokus pada target besar, piawai membangun dukungan lintas unit, dan konsisten melakukan tindak lanjut sampai tuntas. Detail operasional didistribusikan ke pemilik proses, sementara ${nickname} menjaga arah, momentum, dan kolaborasi.
    `.trim(),
    least: `
Di bawah tekanan, ${nickname} cenderung melepas detail berlebihan, over-optimistic pada timeline, dan mengandalkan persuasi menggantikan kontrol mutu. Risiko: slip kualitas, scope creep, serta komitmen tim melebar. Penyeimbang: tetapkan PIC detail per stream, gunakan daftar CTQ (critical-to-quality), dan kunci baseline lingkup sebelum broadcast target.
    `.trim(),
    change: `
Saat perubahan kebijakan/sistem, ${nickname} efektif sebagai motor peluncuran: sosialisasi cepat, koordinasi lintas fungsi, dan pengaturan ritme adopsi. Guardrail penting: gantungkan setiap inisiatif pada rencana implementasi bertahap, checkpoint kualitas terjadwal, dan dashboard ringkas (status, risiko, keputusan) agar laju tinggi tidak mengorbankan akurasi.
    `.trim()
  },
  Guru: {
    most: `
Sebagai pendidik |D-I-S|, ${nickname} karismatik, energik, dan konsisten mendorong kelas pada tujuan yang jelas. Ia mahir memotivasi, memberi struktur yang menenangkan, serta menjaga tindak lanjut tugas sampai selesai. Detail teknis penilaian dapat dibantu asisten/rubrik, sementara ${nickname} menjaga arah dan semangat kelas.
    `.trim(),
    least: `
Dalam tekanan (ujian beruntun/konflik kelas), ${nickname} bisa kurang teliti pada detail penilaian, terlalu cepat mengganti pendekatan, atau memberi tugas berlebih. Antidot: gunakan rubrik baku, batasi jumlah indikator, dan sisipkan sesi refleksi singkat agar disiplin belajar tetap manusiawi.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} cepat memetakan tujuan akhir dan menggerakkan keterlibatan siswa–orang tua. Pastikan scaffolding: contoh tugas, rentang nilai yang transparan, dan timeline bertahap; tugaskan ko–guru/administrasi akademik sebagai pemilik detail untuk menjaga konsistensi nilai.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam konteks teknis, ${nickname} sigap men-set prioritas, mengoordinasikan respon, dan menjaga tim tetap bergerak hingga insiden/pekerjaan tuntas. Ia kuat pada mobilisasi dan komunikasi, sementara detail eksekusi dipegang PIC khusus—mendorong throughput tanpa kehilangan arah.
    `.trim(),
    least: `
Di puncak tekanan, ${nickname} berisiko melewatkan dokumentasi, QA, atau verifikasi akhir karena fokus pada penyelesaian cepat. Peredam: terapkan checklists insiden, pisahkan “fix-now” vs “fix-next”, wajibkan postmortem tanpa menyalahkan, dan pastikan seorang owner C/QA menandatangani rilis.
    `.trim(),
    change: `
Saat migrasi/perubahan arsitektur, ${nickname} unggul menggalang dukungan dan menjaga momentum rollout. Kunci keselamatan: RFC tertulis, rencana rollback, canary/blue–green, serta metrik kesehatan yang dipantau—sehingga adopsi cepat tetap aman dan terukur.
    `.trim()
  },
  Housekeeping: {
    most: `
Sebagai pimpinan shift, ${nickname} tegas menjaga target kebersihan area, mengatur rute kerja, dan memotivasi tim dengan energi tinggi. Ia kuat di koordinasi lapangan dan follow-up temuan sampai selesai, sambil mendelegasikan detail teknis ke leader area.
    `.trim(),
    least: `
Di beban puncak, ${nickname} bisa kehilangan detail (sudut/spot kecil), mengubah prioritas terlalu cepat, atau menambah tugas tanpa perhitungan beban. Penyeimbang: daftar titik kritis (CTQ) per area, timeboxing per rute, dan sampling audit berkala untuk menjaga kualitas konsisten.
    `.trim(),
    change: `
Ketika layout/SOP berubah, ${nickname} efektif melakukan briefing massal, demo lapangan, dan coaching on-the-spot. Agar transisi mulus: pilot kecil, indikator sederhana (compliance, temuan, siklus waktu), dan penguncian rute prioritas sebelum ekspansi penuh.
    `.trim()
  }
},

DIC: {
  Administrator: {
    most: `
Kombinasi Dominan–Influencer–Conscientious membuat ${nickname} mampu menyatukan relasi, kecepatan, dan ketepatan. Ia suka berjejaring sekaligus mampu menurunkan target ke detail operasional bila dibutuhkan. Orientasi hasil tinggi namun tetap menjaga akurasi dokumen, kepatuhan, dan kelengkapan proses.
    `.trim(),
    least: `
Di bawah tekanan, ${nickname} berisiko lompat ke proyek baru sebelum perencanaan matang, multitasking berlebihan, atau terlalu perfeksionis pada detail minor—keduanya menghambat progres. Antidot: kunci prioritas triad (impact–effort–risk), timebox perencanaan, dan tetapkan “definition of done” yang tegas.
    `.trim(),
    change: `
Dalam perubahan sistem/struktur, ${nickname} andal membangun buy-in dan menyusun SOP minimal agar cepat go-live, lalu mengeraskan kontrol kualitas bertahap. Jaga fokus: batasi indikator pada CTQ, jadwalkan review iteratif, dan hindari scope hopping dengan gate keputusan yang jelas.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |D-I-C|, ${nickname} memadukan kelas yang hidup, arahan tegas, dan akurasi evaluasi. Ia komunikatif, menuntut standar tinggi, dan dapat mengerjakan detail rubrik/administrasi saat diperlukan—menciptakan pembelajaran yang engaging namun terukur.
    `.trim(),
    least: `
Dalam tekanan, kecenderungan berpindah topik/proyek atau “over-engineer” materi dapat membuat waktu habis pada detail tidak kritis. Risiko: kelelahan siswa dan backlog penilaian. Penyeimbang: template RPP ringkas, batas indikator inti, dan ritme umpan balik yang tetap.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} mengkomunikasikan alasan perubahan dengan baik dan menyiapkan contoh penilaian yang akurat. Hindari overload: uji coba skala kecil, iterasi rubrik berdasarkan bukti belajar, dan gunakan kalender evaluasi agar konsistensi terjaga.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam peran teknis, ${nickname} mampu berjejaring lintas tim, bergerak cepat, sekaligus menyelam ke detail ketika dibutuhkan. Ia menuntut ketepatan implementasi dan kelengkapan dokumentasi, sehingga hasil teknis reliabel namun tetap memiliki dukungan organisasi.
    `.trim(),
    least: `
Di insiden atau proyek paralel, ${nickname} bisa melompat konteks, melemahkan rencana, atau terjebak pada detail non-kritis. Peredam: WIP limit, kanban jelas, prioritas CTQ, dan ritual harian (standup/status 10 menit) untuk menjaga fokus dan throughput.
    `.trim(),
    change: `
Dalam perubahan arsitektur, ${nickname} efektif memimpin RFC, menyelaraskan stakeholder, dan menjaga presisi eksekusi. Pastikan disiplin: change window, checklist verifikasi, metrik kesehatan, serta evaluasi pasca-rilis agar iterasi berikutnya lebih tajam.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} ramah dan persuasif dalam memimpin tim, menegakkan standar secara detail ketika diperlukan. Ia mampu menutup gap kualitas sambil menjaga hubungan baik, sehingga kepatuhan SOP meningkat tanpa menciptakan resistensi.
    `.trim(),
    least: `
Di beban puncak, ${nickname} dapat terlalu lama pada detail kecil atau berpindah tugas sebelum rute selesai—menciptakan ketidakkonsistenan. Penyeimbang: kunci rute prioritas, target waktu per segmen, dan audit sampling agar fokus terjaga.
    `.trim(),
    change: `
Saat metode/alat baru diterapkan, ${nickname} mampu melatih tim dengan pendekatan komunikatif dan memastikan standar kerja terdokumentasi. Terapkan adopsi bertahap, ukur hasil (temuan, waktu siklus), dan perkuat umpan balik lapangan untuk menstabilkan kualitas.
    `.trim()
}
},
  DSI: {
  Administrator: {
    most: `
Sebagai kombinasi |D-S-I|, ${nickname} menyeimbangkan ketegasan target, ritme kerja stabil, dan kemampuan memobilisasi orang. Ia objektif–analitis, senang terlibat langsung, serta kuat di tindak lanjut sampai tuntas. Detail operasional didistribusikan ke pemilik proses, sementara ${nickname} menjaga arah, disiplin, dan kolaborasi harian.
    `.trim(),
    least: `
Di bawah tekanan, ${nickname} cenderung mempertahankan cara aman (S), menunda konfrontasi, atau melebarkan komitmen karena ingin tetap membantu banyak pihak (I). Risiko: keputusan lambat, scope melebar, dan prioritas kabur. Penyeimbang: batas waktu keputusan, RACI tegas, WIP limit, dan ringkasan 1 halaman untuk eskalasi cepat.
    `.trim(),
    change: `
Saat ada perubahan kebijakan/sistem, ${nickname} efektif melakukan transisi bertahap: pilot kecil, jadwal implementasi jelas, dan checklist adopsi. Jaga momentum dengan komunikasi rutin (I) namun pegang milestone tetap (D) dan ritme stabil (S) agar adaptasi cepat tapi terkendali.
    `.trim()
  },
  Guru: {
    most: `
Sebagai pendidik |D-S-I|, ${nickname} tegas namun menenangkan: tujuan belajar jelas, struktur kelas stabil, dan motivasi siswa terjaga. Ia konsisten pada tindak lanjut tugas dan membangun hubungan yang sehat di kelas, sehingga pembelajaran terasa terarah dan suportif.
    `.trim(),
    least: `
Dalam tekanan (ujian/konflik kelas), ${nickname} bisa menjadi kaku pada rencana, kurang spontan, atau memberi beban tugas berlebih demi mengejar target. Antidot: variasi aktivitas berisiko rendah, refleksi singkat, dan diferensiasi tugas agar disiplin tetap humanis.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyusun peta transisi: apa yang tetap–berubah–dihapus, contoh tugas, serta rubrik sederhana. Komunikasikan ke orang tua/kolaborator dan jalankan bertahap agar kestabilan kelas terjaga.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam konteks teknis, ${nickname} tenang–tegas: menetapkan prioritas, mengoordinasikan respons, dan menutup loop hingga insiden/proyek tuntas. Ia objektif pada RCA dan konsisten mengeksekusi rencana perbaikan.
    `.trim(),
    least: `
Di puncak tekanan, ${nickname} bisa bertahan pada metode lama yang aman (S), menunda eskalasi, atau melewatkan dokumentasi karena fokus menyelesaikan. Peredam: kriteria “escalate now”, checklist insiden, pemisahan “fix-now/fix-next”, dan postmortem tanpa menyalahkan.
    `.trim(),
    change: `
Saat migrasi/perubahan arsitektur, ${nickname} unggul pada rollout bertahap (canary/blue–green), runbook, dan komunikasi status ritmik. Milestone tegas (D) + ritme stabil (S) + persuasi lintas tim (I) = adopsi cepat namun aman.
    `.trim()
  },
  Housekeeping: {
    most: `
Sebagai pimpinan shift, ${nickname} menjaga standar area dengan rute kerja stabil, inspeksi rutin, dan dorongan motivasional. Tindak lanjut temuan konsisten hingga tuntas, sementara hubungan tim tetap hangat.
    `.trim(),
    least: `
Di beban puncak, jadwal bisa terlalu kaku, prioritas sulit ditukar, dan tugas baru ditambahkan tanpa hitung beban. Penyeimbang: prinsip “critical first”, timeboxing per rute, rotasi beban, dan sampling audit untuk jaga kualitas.
    `.trim(),
    change: `
Saat layout/SOP berubah, ${nickname} menjalankan simulasi rute, briefing lapangan, dan buddy system. Mulai dari area kunci dulu, ukur compliance & waktu siklus, lalu skalakan.
    `.trim()
  }
},

DSC: {
  Administrator: {
    most: `
Kombinasi |D-S-C| membuat ${nickname} tegas pada target, stabil dalam eksekusi, dan teliti pada kepatuhan. Ia menyukai proses rapi, dokumentasi lengkap, dan kontrol mutu yang konsisten—menghasilkan operasi administrasi yang tertib dan dapat diaudit.
    `.trim(),
    least: `
Di bawah tekanan, perfeksionisme (C) dan preferensi stabil (S) dapat memperlambat keputusan atau membuat ${nickname} enggan mengubah rute kerja. Risiko: antrean persetujuan dan lambatnya respons. Antidot: timebox analisis, definisikan “good enough” & acceptance criteria, sederhanakan jalur sign-off.
    `.trim(),
    change: `
Dalam perubahan sistem, ${nickname} efektif jika ada governance jelas: RACI, RFC, checklist go-live, dan window perubahan. Jalankan bertahap dengan metrik kualitas pasca-implementasi agar mutu terjaga tanpa menghambat laju.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |D-S-C|, ${nickname} menyusun kelas yang sangat terstruktur, konsisten, dan berstandar tinggi. Ia teliti pada materi, administrasi, dan penilaian; disiplin kelas kuat namun suasana tetap stabil dan aman.
    `.trim(),
    least: `
Dalam tekanan, ${nickname} bisa terlalu banyak aturan, fokus detail minor, dan mengurangi ruang eksplorasi siswa. Penyeimbang: batasi indikator inti, gunakan rubrik ringkas, dan beri sesi eksplorasi terarah agar tempo tetap manusiawi.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyiapkan contoh tugas, rubrik baru, dan jadwal bertahap. Hindari over-engineering: uji coba kecil, iterasi berdasar bukti belajar, dan kunci standar minimum yang realistis.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam peran teknis, ${nickname} memimpin dengan SOP yang kuat, dokumentasi presisi, dan kontrol perubahan ketat. Ia memastikan kualitas tinggi dan keandalan sistem melalui eksekusi terstruktur.
    `.trim(),
    least: `
Di insiden, ${nickname} berisiko masuk “analysis paralysis” atau menunda rilis demi kesempurnaan. Peredam: protokol insiden (commander/scribe/PIC), eksperimen bertahap, dan keputusan berbasis risiko CTQ agar kecepatan dan mutu seimbang.
    `.trim(),
    change: `
Pada perubahan arsitektur, ${nickname} mengandalkan RFC, test plan, rollback, dan metrik kesehatan. Fokus pada CTQ, batasi WIP, dan lakukan review terjadwal untuk menjaga mutu tanpa memperlambat proyek.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menegakkan standar kebersihan melalui SOP rinci, inspeksi rutin, dan jadwal stabil. Detail diperhatikan, tindak lanjut temuan rapi, dan konsistensi kualitas terjaga.
    `.trim(),
    least: `
Di beban puncak, perhatian pada detail minor bisa menurunkan throughput dan moral tim. Penyeimbang: daftar CTQ per area, sampling audit, dan apresiasi kepatuhan agar fokus tetap pada dampak terbesar.
    `.trim(),
    change: `
Saat metode/alat baru diterapkan, ${nickname} menyusun standar kerja, daftar cek, dan pelatihan bertahap. Ukur hasil (temuan, waktu siklus) dan sesuaikan sebelum ekspansi penuh.
    `.trim()
  }
},

DCI: {
  Administrator: {
    most: `
Sebagai |D-C-I|, ${nickname} menyatukan ketegasan target, presisi proses, dan komunikasi yang membangun buy-in. Ia cepat memutuskan, menjaga akurasi dokumen, dan piawai menggalang dukungan lintas unit untuk mengeksekusi perubahan.
    `.trim(),
    least: `
Di tekanan tinggi, ${nickname} bisa terjebak perfeksionisme (C) atau melompat konteks ke proyek baru (I), sementara standar tetap tinggi (D). Risiko: progres tersendat atau tim lelah oleh kritik/detail non-kritis. Antidot: triase prioritas (impact–effort–risk), timebox perencanaan, “definition of done” yang tegas, dan kanal umpan balik dua arah.
    `.trim(),
    change: `
Dalam perubahan sistem/struktur, ${nickname} efektif memimpin RFC, menetapkan CTQ, dan menyosialisasikan rencana. Gunakan gate keputusan, metrik kualitas pasca-rilis, dan iterasi terjadwal agar laju dan akurasi sama-sama terjaga.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |D-C-I|, ${nickname} mengelola kelas yang hidup namun presisi: arahan jelas, rubrik akurat, dan komunikasi yang menyemangati siswa. Standar tinggi tercapai tanpa kehilangan keterlibatan.
    `.trim(),
    least: `
Dalam tekanan, ${nickname} bisa over-engineer materi/penilaian atau berpindah topik terlalu cepat. Penyeimbang: template RPP ringkas, batasi indikator inti, dan ritme umpan balik yang konsisten agar beban tetap proporsional.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menjelaskan alasan perubahan dengan baik, menyediakan contoh penilaian, dan menguji skala kecil. Iterasi rubrik berdasarkan bukti belajar dan kunci kalender evaluasi untuk konsistensi.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam peran teknis, ${nickname} memadukan keputusan cepat (D), QA presisi (C), dan koordinasi lintas tim (I). Dokumentasi lengkap, kontrol perubahan rapi, dan komunikasi yang jelas menjaga reliabilitas sekaligus dukungan organisasi.
    `.trim(),
    least: `
Di insiden atau proyek paralel, ${nickname} bisa bergeser ke kritik tajam atau multitasking berlebih. Peredam: WIP limit, standup singkat harian, prioritas CTQ, serta postmortem tanpa menyalahkan untuk menjaga fokus dan pembelajaran.
    `.trim(),
    change: `
Dalam perubahan arsitektur, ${nickname} memimpin penyelarasan stakeholder, menegakkan checklist verifikasi, dan memastikan metrik kesehatan dipantau. Rencana rollback siap, gate kualitas jelas, dan komunikasi status ritmik.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} mendorong standar tinggi yang detail saat diperlukan, sambil menjaga semangat tim melalui komunikasi yang baik. Ia mampu menutup gap kualitas tanpa menimbulkan resistensi.
    `.trim(),
    least: `
Di beban puncak, ${nickname} berisiko teralihkan oleh detail non-kritis atau berpindah tugas sebelum rute selesai. Penyeimbang: kunci rute prioritas, target waktu per segmen, dan audit sampling agar konsistensi terjaga.
    `.trim(),
    change: `
Ketika metode/alat baru diluncurkan, ${nickname} melatih tim secara komunikatif, menjaga dokumentasi standar kerja, dan menerapkan adopsi bertahap. Ukur hasil (temuan, waktu siklus) dan perkuat umpan balik lapangan.
    `.trim()
}
},
  DCS: {
  Administrator: {
    most: `
Kombinasi |D-C-S| membuat ${nickname} menetapkan target tegas, mengeksekusi presisi, dan menjaga ritme kerja stabil. Ia sensitif pada problem, cepat memutuskan, lalu mengawal kepatuhan SOP, dokumentasi, dan kontrol mutu. Hasilnya: operasi administrasi tertib, terukur, dan dapat diaudit tanpa kehilangan kecepatan.
    `.trim(),
    least: `
Di bawah tekanan, perfeksionisme (C) dan preferensi stabil (S) dapat memperlambat keputusan atau memicu micromanagement pada detail non-kritis. Risiko: antrian persetujuan, kelelahan tim, dan melambatnya progres. Antidot: timebox analisis, definisikan “good enough” & acceptance criteria, batasi jalur sign-off, dan eskalasi cepat untuk blocker.
    `.trim(),
    change: `
Dalam perubahan sistem/struktur, ${nickname} efektif bila governance jelas: RACI tegas, RFC terdokumentasi, checklist go-live, dan window perubahan. Terapkan rollout bertahap dengan metrik pasca-implementasi (defect, SLA, compliance) agar kualitas terjaga sambil laju tetap terkendali.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |D-C-S|, ${nickname} membangun kelas yang sangat terstruktur, standar tinggi, dan konsisten. Ia cepat mengarahkan, teliti pada materi–rubrik–administrasi, serta menjaga suasana stabil sehingga target belajar tercapai dengan akurat dan tertib.
    `.trim(),
    least: `
Dalam tekanan (ujian beruntun/konflik kelas), ${nickname} bisa terlalu banyak aturan, fokus pada detail minor, dan mengurangi ruang eksplorasi siswa. Penyeimbang: batasi indikator inti, gunakan rubrik ringkas, sertakan sesi eksplorasi terarah, dan jaga bahasa umpan balik agar tetap suportif.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyiapkan contoh tugas, rubrik baru, dan kalender evaluasi bertahap. Hindari over-engineering: uji coba skala kecil, iterasi berdasar bukti belajar, dan kunci standar minimum yang realistis sebelum perluasan penuh.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam peran teknis, ${nickname} memimpin RCA tajam, menjaga kontrol perubahan ketat, dan mengeksekusi perbaikan presisi. Keputusan cepat (D) disangga dokumentasi akurat (C) dan eksekusi stabil (S), sehingga reliabilitas sistem dan kepatuhan tetap tinggi.
    `.trim(),
    least: `
Di insiden, ${nickname} berisiko masuk “analysis paralysis” atau menghabiskan waktu pada detail non-kritis. Dampak: rilis tertunda dan tekanan tim meningkat. Peredam: protokol insiden (commander/scribe/PIC), eksperimen bertahap, prioritas CTQ, dan postmortem tanpa menyalahkan untuk menjaga fokus & pembelajaran.
    `.trim(),
    change: `
Pada migrasi/rekayasa ulang, ${nickname} unggul jika ada RFC, test plan, rollback, dan metrik kesehatan yang disepakati. Fokus pada CTQ, batasi WIP, lakukan canary/blue-green, serta review terjadwal agar mutu terjaga tanpa memperlambat roadmap.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menegakkan standar kebersihan tegas sekaligus rinci, dengan jadwal dan rute kerja yang stabil. Audit rutin, checklist komplit, dan tindak lanjut temuan rapi memastikan kualitas konsisten di seluruh area.
    `.trim(),
    least: `
Di beban puncak, perhatian pada detail minor dapat menurunkan throughput dan moral tim. Penyeimbang: daftar CTQ per area, sampling audit, target waktu per segmen, dan apresiasi kepatuhan agar fokus tetap pada dampak terbesar.
    `.trim(),
    change: `
Saat metode/peralatan baru diterapkan, ${nickname} menyusun SOP, daftar cek, dan pelatihan bertahap. Mulai dari area prioritas, ukur hasil (temuan, waktu siklus), lalu skalakan; jaga komunikasi lapangan agar transisi cepat namun stabil.
    `.trim()
  }
},

    I: {
      Administrator: {
        most: `
Sebagai tipe Influencer, ${nickname} mahir membangun komunikasi efektif dengan rekan kerja maupun pihak luar, memudahkan koordinasi dan memperlancar seluruh proses administrasi. ${nickname} sering menjadi sumber inspirasi dan motivasi di lingkungan kerja, menciptakan suasana kerja yang hangat dan suportif, serta mudah menjalin hubungan baik antarbagian. Karakter ini membuat proses pelayanan dan administrasi berjalan lancar, penuh kolaborasi, serta minim konflik.
        `.trim(),
        least: `
Ketika beban kerja tinggi, ${nickname} yang berorientasi pada hubungan sosial cenderung terdistraksi oleh percakapan, interaksi informal, atau kegiatan non-prioritas. Hal ini bisa mengurangi fokus pada target kerja utama. Untuk mengimbanginya, ${nickname} perlu memperkuat disiplin pribadi, menjaga batas profesionalitas, serta memprioritaskan tugas administratif yang esensial tanpa mengabaikan keharmonisan hubungan kerja.
        `.trim(),
        change: `
Di bawah tekanan atau saat menghadapi target yang ketat, ${nickname} tetap mampu membangun sinergi tim, menjaga suasana kerja tetap positif, dan memberikan semangat kepada rekan kerja. Namun, penting untuk tetap menjaga keseimbangan antara keakraban dengan tanggung jawab profesional, serta tetap fokus pada hasil kerja yang terukur.
        `.trim()
      },
      Guru: {
        most: `
Sebagai Guru yang bertipe Influencer, ${nickname} sangat pandai membangun hubungan hangat dengan siswa dan menciptakan suasana pembelajaran yang menyenangkan serta komunikatif. Karakter ini menjadikan ${nickname} sumber motivasi dan inspirasi bagi murid-muridnya. Kelas yang dipimpin oleh ${nickname} biasanya terasa hidup, penuh antusiasme, serta sangat terbuka untuk diskusi dan ekspresi pendapat. Kemampuan ini sangat mendukung proses pembelajaran yang efektif dan membangun kedekatan emosional antara guru dan siswa.
        `.trim(),
        least: `
Saat menghadapi tekanan di kelas, ${nickname} mungkin cenderung terlalu larut dalam interaksi sosial hingga tujuan pembelajaran menjadi kurang terfokus. Ada risiko kehilangan arah pembelajaran jika terlalu mengutamakan suasana akrab. Oleh sebab itu, ${nickname} perlu memperkuat pengelolaan waktu, menegaskan batas interaksi, dan memastikan sasaran pembelajaran tetap tercapai dengan baik tanpa mengurangi nuansa kekeluargaan.
        `.trim(),
        change: `
Dalam menghadapi tantangan atau perubahan dalam dunia pendidikan, ${nickname} tetap dapat menjaga suasana kelas tetap positif dan semangat belajar siswa tetap tinggi. Namun, perlu dikontrol agar kedekatan emosional tidak mengganggu objektivitas, serta tetap memprioritaskan pencapaian akademik.
        `.trim()
      },
      "Technical Staff": {
        most: `
Sebagai tenaga teknis dengan karakter Influencer, ${nickname} unggul dalam membangun komunikasi dan koordinasi yang baik antaranggota tim. Hal ini membuat proses kerja lebih efisien, minim miskomunikasi, dan penuh kolaborasi. ${nickname} sering menjadi penghubung yang memperlancar jalannya pekerjaan teknis, mampu meredam konflik, serta menjaga motivasi kerja tim tetap tinggi dalam kondisi apapun.
        `.trim(),
        least: `
Saat menghadapi kendala teknis, kecenderungan terlalu santai atau kurang tegas dapat membuat solusi berjalan lebih lambat. Dalam situasi seperti ini, ${nickname} perlu belajar meningkatkan ketegasan dalam memberikan instruksi, memastikan setiap anggota tim memahami peran dan tanggung jawabnya, serta menjaga agar proses kerja tetap berjalan sesuai target teknis yang ditetapkan.
        `.trim(),
        change: `
Di bawah tekanan kerja teknis, ${nickname} mampu menjaga suasana tim tetap kooperatif dan komunikatif. Namun, penting untuk memastikan bahwa komunikasi yang baik juga diiringi dengan aksi nyata dalam menyelesaikan permasalahan teknis, bukan hanya mengandalkan diskusi atau suasana positif semata.
        `.trim()
      },
      Housekeeping: {
        most: `
Sebagai pribadi bertipe Influencer di lingkungan Housekeeping, ${nickname} menjadi sumber semangat dan motivasi bagi seluruh tim. Kemampuan ${nickname} membangun kerja sama, menciptakan suasana harmonis, dan menumbuhkan rasa kebersamaan sangat membantu meningkatkan produktivitas serta kenyamanan kerja. ${nickname} selalu membawa aura positif yang membuat suasana kerja terasa ringan, penuh dukungan, serta mudah mengajak anggota tim untuk saling membantu. Pendekatan komunikatif dan empati yang tinggi dari ${nickname} sangat diperlukan dalam menjaga kekompakan dan loyalitas tim Housekeeping.
        `.trim(),
        least: `
Dalam tekanan atau ketika target belum tercapai, ${nickname} kadang lebih memprioritaskan suasana hati tim dibandingkan pencapaian standar kerja yang ditetapkan. Ada risiko menghindari konfrontasi langsung, sehingga standar kerja menjadi kurang optimal. Untuk itu, ${nickname} perlu belajar menyeimbangkan keramahan dan ketegasan, serta memastikan pencapaian target kebersihan tetap menjadi prioritas utama.
        `.trim(),
        change: `
Dalam masa sibuk atau deadline mendesak, ${nickname} tetap mampu menjaga motivasi dan semangat tim. Namun, penting bagi ${nickname} untuk tetap disiplin terhadap prosedur kerja, tidak terlalu larut dalam suasana, dan memastikan hasil kerja tetap optimal di bawah tekanan.
        `.trim()
      }
    },
    ID: {
  Administrator: {
    most: `
Sebagai |I-D|, ${nickname} pemimpin integratif yang mobilisasi orang “melalui” relasi. Ia ramah, persuasif, suka variasi tugas, dan efektif meraih dukungan lintas unit. Visi jelas disosialisasikan dengan bahasa yang menggerakkan; detail analitis diserahkan pada pemilik proses agar eksekusi tetap cepat.
    `.trim(),
    least: `
Di bawah tekanan, ${nickname} bisa impulsif, terlalu optimistis, banyak bicara, dan melewati detail/prosedur. Risiko: scope creep, janji berlebih, dan kualitas turun. Penyeimbang: pasangan PIC analitik (C) untuk data/fakta, timebox keputusan, acceptance criteria yang tegas, dan ringkasan 1 halaman untuk menjaga fokus.
    `.trim(),
    change: `
Saat perubahan kebijakan/sistem, ${nickname} kuat di kampanye perubahan: membangun cerita, ajak kolaborasi, dan mengeksekusi pilot cepat. Guardrail: minta paket data dari analis, kunci ruang lingkup sebelum siaran, dan tetapkan checkpoint kualitas agar adopsi cepat tetap akurat.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |I-D|, ${nickname} karismatik, komunikatif, dan pandai memotivasi kelas menuju target. Ia menyukai aktivitas variatif, diskusi, dan proyek kolaboratif; rubrik/administrasi detail dapat dibantu template agar energi utama tersalur ke penggerakan belajar.
    `.trim(),
    least: `
Dalam tekanan, ${nickname} berisiko impulsif, berganti metode terlalu cepat, atau meluberkan tugas. Antidot: strukturkan RPP ringkas, batasi indikator inti, gunakan rubrik siap pakai, dan sisipkan jeda refleksi agar antusiasme tetap terarah.
    `.trim(),
    change: `
Saat kurikulum berganti, ${nickname} mahir menjelaskan alasan perubahan dan menggalang dukungan siswa–orang tua. Kunci: contoh tugas konkret, timeline bertahap, serta peran ko–guru untuk detail penilaian agar tempo tinggi tak mengorbankan akurasi.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam konteks teknis, ${nickname} efektif sebagai incident coordinator/liaison: cepat menggerakkan orang yang tepat, mengomunikasikan status, dan memastikan eskalasi. Detail RCA/QA didukung spesialis; ${nickname} menjaga momentum hingga selesai.
    `.trim(),
    least: `
Di insiden, risiko melewatkan dokumentasi/QA, “mengejar solusi” tanpa verifikasi, atau overpromising. Peredam: checklist insiden, pisahkan “fix-now/fix-next”, PIC dokumentasi, dan postmortem berbasis data.
    `.trim(),
    change: `
Pada migrasi/perubahan, ${nickname} champion adopsi: brief, demo, dan koordinasi. Pastikan ada RFC tertulis, metrik kesehatan, dan rencana rollback—serta partner C untuk mengawal presisi.
    `.trim()
  },
  Housekeeping: {
    most: `
Sebagai leader lapangan, ${nickname} memotivasi tim, menjaga suasana positif, dan mendorong capaian area. Ia kuat pada komunikasi dan rotasi tugas agar rutinitas tidak membosankan; QC detail dipegang leader area.
    `.trim(),
    least: `
Di beban puncak, ${nickname} bisa terlalu banyak komunikasi, kurang fokus CTQ, atau janji berlebih ke pengguna area. Penyeimbang: daftar titik kritis (CTQ), spot-check terjadwal, dan target waktu per rute.
    `.trim(),
    change: `
Saat SOP/layout berubah, ${nickname} unggul melakukan briefing massal, simulasi lapangan, dan buddy system. Kunci: checklist sederhana, papan status area, dan sampling audit agar antusiasme berbuah konsistensi.
    `.trim()
  }
},

IS: {
  Administrator: {
    most: `
Sebagai |I-S|, ${nickname} hangat, suportif, dan kuat membangun harmoni tim. Ia menjaga layanan internal, proses konsisten, dan komunikasi empatik—cocok untuk menjaga stabilitas operasi harian dan kepuasan pemangku kepentingan.
    `.trim(),
    least: `
Risiko: menghindari konfrontasi, terlalu toleran pada kinerja rendah, dan membawa kritik secara pribadi—keputusan sulit tertunda. Antidot: SLA jelas, ambang eskalasi, skrip percakapan tegas-empatik, dan metrik kinerja yang transparan.
    `.trim(),
    change: `
Dalam perubahan, ${nickname} efektif menenangkan kekhawatiran dan memfasilitasi pelatihan. Tetapkan deadline nyata, milestone kecil, dan dukungan lapangan agar tempo tidak melambat.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |I-S|, ${nickname} menciptakan kelas yang hangat, aman, dan suportif. Ia pendengar baik, peka pada emosi siswa, dan menjaga hubungan harmonis sehingga keterlibatan meningkat.
    `.trim(),
    least: `
Risiko: kurang tegas pada aturan, terlalu memaklumi, dan tersinggung oleh kritik. Penyeimbang: kontrak belajar, rubrik jelas, batas peran yang tegas, dan latihan bahasa umpan balik yang konstruktif.
    `.trim(),
    change: `
Saat kurikulum berubah, ${nickname} menyampaikan perubahan dengan empatik dan bertahap. Pastikan pacing, contoh tugas, dan jadwal evaluasi agar kelas tidak “terbawa arus” tanpa arah.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} andal di perawatan rutin, dukungan pengguna, dan dokumentasi langkah demi langkah. Ia menjaga hubungan baik dengan stakeholder dan menjaga ritme layanan stabil.
    `.trim(),
    least: `
Risiko: enggan eskalasi/konfrontasi saat ada blocking issue, atau menoleransi deviasi prosedur. Peredam: kriteria “escalate now”, runbook tegas, dan rotasi on-call dengan debrief singkat.
    `.trim(),
    change: `
Pada perubahan, ${nickname} membantu pelatihan penggunaan dan adopsi. Tetapkan batas waktu, checklist, dan dukungan onsite untuk menghindari molornya transisi.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menjaga moral tim, rutin, dan stabilitas area. Ia ramah pada pengguna area, mendengar keluhan, dan memastikan tim merasa didukung.
    `.trim(),
    least: `
Risiko: sulit menegur pelanggaran, toleran terhadap ketidakefektifan. Penyeimbang: checklist bertanda tangan, inspeksi ringan namun sering, dan format umpan balik tegas–santun.
    `.trim(),
    change: `
Saat SOP baru, ${nickname} memperkenalkan perubahan secara bertahap, dengan demo dan pendampingan. Jaga disiplin dengan target sederhana (compliance, temuan utama) dan apresiasi progres.
    `.trim()
  }
},

IC: {
  Administrator: {
    most: `
Sebagai |I-C|, ${nickname} sosial namun presisi saat diperlukan. Ia mudah membangun jaringan, mempromosikan program, dan mampu menyelam ke detail kebijakan/dokumen untuk memastikan akurasi—kombinasi yang kuat untuk layanan dan kepatuhan.
    `.trim(),
    least: `
Risiko: optimisme membuat salah menilai kemampuan orang/deadline; di sisi lain perfeksionisme bisa mendorong isolasi kerja dan jeda komunikasi. Antidot: review risiko, peer review dokumen, dan batas WIP dengan checkpoint status rutin.
    `.trim(),
    change: `
Dalam perubahan, ${nickname} komunikator andal yang menyediakan panduan rinci. Jaga agar tidak over-engineer: kunci indikator CTQ, gate keputusan jelas, dan uji coba skala kecil sebelum meluas.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |I-C|, ${nickname} menyeimbangkan kelas yang engaging dengan ketelitian rubrik/administrasi. Ia peduli relasi dan mampu menata detail penilaian sehingga adil dan transparan.
    `.trim(),
    least: `
Risiko: menilai terlalu optimistis kemampuan siswa atau tenggelam pada detail materi hingga waktu habis. Penyeimbang: kolaborasi perencanaan, batas indikator inti, dan ritme umpan balik yang konsisten.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} mahir menjelaskan dan memberi contoh konkret. Hindari beban berlebih dengan template ringkas dan iterasi rubrik berdasarkan bukti belajar.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam peran teknis, ${nickname} menjadi jembatan sains–stakeholder: komunikatif, dokumentatif, dan teliti saat dibutuhkan. Cocok untuk BA/QA, dokumentasi, dan koordinasi lintas fungsi.
    `.trim(),
    least: `
Risiko: perfeksionisme memperlambat rilis atau optimisme menyebabkan estimasi meleset. Peredam: buffer estimasi, definisi “done” yang konkret, dan review berpasangan pada artefak teknis.
    `.trim(),
    change: `
Pada perubahan, ${nickname} unggul menulis RFC, panduan, dan materi sosialisasi. Tetapkan WIP limit, jalankan canary, dan lakukan evaluasi pasca-rilis agar laju dan kualitas seimbang.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} ramah dalam memimpin tim dan mampu mengawal detail SOP saat diperlukan. Ia menjaga kepuasan pengguna area sambil memastikan standar terdokumentasi.
    `.trim(),
    least: `
Risiko: terlalu optimistis pada kemampuan tim sehingga target tidak realistis, atau bekerja sendiri terlalu lama di detail. Penyeimbang: kuota jelas per rute, audit sampling, dan komunikasi status singkat berkala.
    `.trim(),
    change: `
Saat metode/alat baru diterapkan, ${nickname} komunikatif melatih tim dan menyiapkan panduan rinci. Jaga fokus CTQ agar tidak terseret detail minor, ukur temuan & waktu siklus sebelum ekspansi penuh.
    `.trim()
}
},
    IDS: {
  Administrator: {
    most: `
Sebagai |I-D-S|, ${nickname} memimpin lewat relasi yang kuat, eksekusi cepat, dan ritme kerja stabil. Ia disukai, mudah menggerakkan dukungan lintas unit, serta tekun menutup loop sampai tuntas. Ia tahu kapan meminta bantuan dan mendelegasikan detail ke pemilik proses, sambil menjaga arah dan moral tim.
    `.trim(),
    least: `
Di bawah tekanan, ${nickname} bisa mengejar popularitas, melebarkan komitmen, atau terlalu bergantung pada bantuan sehingga prioritas kabur. Risiko: scope creep dan turunnya kualitas. Penyeimbang: kunci CTQ, tetapkan RACI, WIP limit, dan checkpoint kualitas terjadwal agar fokus tetap terjaga.
    `.trim(),
    change: `
Dalam perubahan kebijakan/sistem, ${nickname} unggul sebagai duta perubahan: kampanye yang kuat, koordinasi lapangan rapi, dan dukungan tim tinggi. Guardrail: definisikan baseline lingkup, rencana bertahap (pilot → scale), dan dashboard status-risiko-keputusan agar laju tidak mengorbankan akurasi.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |I-D-S|, ${nickname} karismatik, suportif, dan tegas mengarahkan kelas menuju tujuan yang jelas. Ia menjaga atmosfer positif, struktur stabil, dan konsisten menyelesaikan tindak lanjut tugas—mendorong keterlibatan sekaligus disiplin.
    `.trim(),
    least: `
Dalam tekanan, ${nickname} berisiko terlalu banyak aktivitas sosial, memberi beban berlebih, atau kurang teliti pada batas kelas. Antidot: kontrak belajar, rubrik ringkas, dan jeda refleksi berkala agar energi sosial tetap produktif.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menjelaskan alasan perubahan dengan bahasa yang membangun buy-in. Siapkan contoh tugas, timeline bertahap, dan peran ko–guru untuk detail penilaian sehingga adaptasi cepat dan konsisten.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} efektif sebagai koordinator insiden dan penggerak eksekusi: menghubungkan pihak relevan, menjaga komunikasi status, dan menindaklanjuti sampai tuntas dengan ritme stabil.
    `.trim(),
    least: `
Di puncak tekanan, ${nickname} bisa melewatkan dokumentasi/QA karena fokus menyelesaikan atau menunda keputusan sulit demi harmoni. Peredam: checklist insiden, kriteria “escalate now”, pisahkan “fix-now/fix-next”, dan postmortem tanpa menyalahkan.
    `.trim(),
    change: `
Saat migrasi/perubahan arsitektur, ${nickname} kuat di sosialisasi dan pendampingan. Kunci keselamatan: RFC tertulis, canary/blue–green, metrik kesehatan, dan rencana rollback agar adopsi cepat namun terukur.
    `.trim()
  },
  Housekeeping: {
    most: `
Sebagai leader lapangan, ${nickname} menjaga semangat tim, mengatur rute kerja efisien, dan konsisten menutup temuan. Ia mudah meminta dukungan lintas area dan membuat standar terasa “ringan dijalankan”.
    `.trim(),
    least: `
Risiko: menunda teguran demi suasana, target melebar, atau mengabaikan spot kecil. Penyeimbang: daftar CTQ per area, target waktu per segmen, sampling audit, dan umpan balik singkat-tegas.
    `.trim(),
    change: `
Ketika SOP/layout berubah, ${nickname} menjalankan briefing massal, demo lapangan, dan buddy system. Lakukan pilot area kritis, ukur compliance & waktu siklus, baru ekspansi bertahap.
    `.trim()
  }
},

IDC: {
  Administrator: {
    most: `
Sebagai |I-D-C|, ${nickname} menggabungkan jejaring kuat, dorongan eksekusi, dan ketepatan saat dibutuhkan. Ia andal merekrut/merangkul stakeholder, menyusun pesan yang meyakinkan, dan memastikan tugas “done right” dengan kontrol mutu memadai.
    `.trim(),
    least: `
Risiko: tampak dingin/dominan, terlalu fokus tugas hingga mengabaikan kebutuhan orang, atau overtrust pada penilaian terhadap orang/kemampuan tim. Antidot: sesi “voice of stakeholder”, gate prioritas (impact–effort–risk), WIP limit, dan partner C untuk jaga ketelitian.
    `.trim(),
    change: `
Dalam perubahan sistem/struktur, ${nickname} kuat sebagai frontman: kampanye, perekrutan champion, dan onboarding. Guardrail: checklist go-live, definition of done yang tegas, serta sesi dengar pendapat agar buy-in tidak semu.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |I-D-C|, ${nickname} menghadirkan kelas engaging dengan standar yang jelas dan akurat. Ia komunikatif, menuntut kualitas tugas, dan mampu menyelami detail rubrik saat diperlukan.
    `.trim(),
    least: `
Risiko: terlalu menekan target hingga relasi siswa terabaikan, atau sebaliknya melompat fokus karena banyak ide. Penyeimbang: RPP ringkas, indikator inti, jadwal umpan balik konsisten, dan waktu fokus tanpa distraksi.
    `.trim(),
    change: `
Saat kurikulum berganti, ${nickname} mengomunikasikan perubahan dengan baik dan menyediakan contoh penilaian tepat. Hindari overload: uji coba kecil, iterasi rubrik berdasar bukti belajar, dan kalender evaluasi yang terkunci.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam peran teknis, ${nickname} luwes mengoordinasi lintas fungsi, bergerak cepat, dan menurunkan standar ke detail saat perlu. Dokumentasi dan QA dijaga cukup agar hasil reliabel sekaligus cepat.
    `.trim(),
    least: `
Di insiden/proyek paralel, risiko konteks lompat, overpromising, atau mengkritik sebelum data lengkap. Peredam: kanban transparan, WIP limit, PIC dokumentasi, dan checkpoint QA yang wajib.
    `.trim(),
    change: `
Pada perubahan arsitektur, ${nickname} efektif menyatukan stakeholder dan menjaga presisi eksekusi. Disiplin: RFC, change window, checklist verifikasi, metrik kesehatan, dan post-implementation review.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} persuasif merekrut/menyatukan tim, menetapkan standar yang jelas, dan memantau kualitas dengan daftar cek praktis. Kinerja area naik tanpa mematikan suasana positif.
    `.trim(),
    least: `
Risiko: mendorong tugas “harus benar” namun kurang mendengar kebutuhan lapangan, atau berganti fokus sebelum rute selesai. Penyeimbang: walk-through dua arah, rute prioritas, dan audit sampling berkala.
    `.trim(),
    change: `
Ketika metode/alat baru diterapkan, ${nickname} melatih secara interaktif dan memastikan standar terdokumentasi. Kunci: indikator CTQ sederhana, pelaporan singkat, dan evaluasi mingguan agar konsistensi terjaga.
    `.trim()
  }
},

ISD: {
  Administrator: {
    most: `
Sebagai |I-S-D|, ${nickname} menjaga harmoni dan layanan internal sambil tetap mendorong target tercapai. Ia komunikatif, suportif, dan siap memimpin ketika tujuan jelas—mampu menyelesaikan pekerjaan cepat dan efisien.
    `.trim(),
    least: `
Risiko: menghindari konfrontasi, mencari pengakuan, atau menunda keputusan sulit demi menjaga suasana. Antidot: SLA & ambang eskalasi, skrip percakapan tegas–empatik, dan review metrik kinerja yang transparan.
    `.trim(),
    change: `
Dalam perubahan, ${nickname} menenangkan kekhawatiran, memfasilitasi pelatihan, dan menjaga ritme adopsi. Tetapkan milestone kecil, deadline nyata, dan forum tanya-jawab berkala agar tempo tidak melambat.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |I-S-D|, ${nickname} menghadirkan kelas hangat, komunikatif, dan efisien. Ia mempertimbangkan perasaan siswa dalam keputusan, namun tetap menutup tugas tepat waktu dengan arahan jelas.
    `.trim(),
    least: `
Risiko: terlalu toleran pada kinerja rendah, enggan menegakkan aturan, atau mencari pengakuan berlebihan. Penyeimbang: kontrak belajar, batas tegas, rubrik sederhana, dan umpan balik yang spesifik–konstruktif.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} kuat pada komunikasi dan dukungan siswa. Siapkan contoh tugas, tahapan adaptasi, dan peran asisten untuk detail agar konsistensi terjaga.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} adalah liaison yang ramah, stabil dalam eksekusi, dan mampu memimpin saat perlu. Ia menjaga dokumentasi langkah-demi-langkah dan layanan yang konsisten sambil menyelesaikan pekerjaan efisien.
    `.trim(),
    least: `
Risiko: menunda konfrontasi pada blocking issue atau terlalu lama menjaga harmoni. Peredam: kriteria eskalasi, runbook tegas, dan daily check-in singkat untuk mengunci prioritas.
    `.trim(),
    change: `
Pada perubahan, ${nickname} membantu onboarding dan adopsi pengguna. Kunci: checklist sederhana, batas waktu, dan dukungan onsite agar transisi tidak melar.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menjaga moral tim, ritme kerja stabil, dan penyelesaian tugas cepat. Ia memimpin maupun mendukung sesuai kebutuhan, memastikan area rapi dan target tercapai.
    `.trim(),
    least: `
Risiko: sulit menegur pelanggaran atau over-focus pada pengakuan. Penyeimbang: CTQ area, inspeksi ringan namun sering, dan target waktu per rute.
    `.trim(),
    change: `
Saat SOP/layout baru, ${nickname} memperkenalkan perubahan secara komunikatif, menjalankan demo, dan buddy system. Ukur compliance & temuan utama sebelum ekspansi penuh.
    `.trim()
}
},
    
ISC: {
  Administrator: {
    most: `
Sebagai |I-S-C|, ${nickname} mengandalkan hubungan yang hangat, ritme kerja stabil, dan standar kualitas yang jelas. Ia komunikatif–loyal, sensitif pada kebutuhan pemangku kepentingan, serta mengambil keputusan berbasis data/dokumen. Operasi harian rapi karena SOP dipahami semua pihak, ekspektasi diperjelas sebelum proyek dimulai, dan tindak lanjut konsisten.
    `.trim(),
    least: `
Di bawah tekanan, ${nickname} dapat terlalu peduli pada opini orang, menahan konfrontasi, dan menunda keputusan sampai data “lengkap”. Risiko: lambat, scope melebar, dan pesan tidak tegas. Antidot: SLA & ambang eskalasi, tenggat keputusan, ringkasan 1 halaman berbasis fakta, serta skrip percakapan tegas–empatik.
    `.trim(),
    change: `
Dalam perubahan kebijakan/sistem, ${nickname} efektif menenangkan kekhawatiran dan memfasilitasi pelatihan. Guardrail: ekspektasi per peran dipertegas, pilot kecil, checklist adopsi, office hour Q&A, dan metrik compliance—agar tempo adaptasi terjaga tanpa mengorbankan kualitas.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |I-S-C|, ${nickname} membangun kelas hangat dan terstruktur. Ia peka terhadap emosi siswa, menjaga stabilitas ritme belajar, dan menilai berbasis rubrik/indikator yang jelas sehingga adil dan transparan.
    `.trim(),
    least: `
Risiko: kurang tegas menegakkan aturan, terlalu memikirkan penerimaan sosial, atau menumpuk detail administrasi. Penyeimbang: kontrak belajar, batas tegas yang konsisten, rubrik ringkas (indikator inti), dan jadwal umpan balik tetap.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menjelaskan perubahan secara empatik, memberi contoh tugas & rubrik baru, lalu menggelar adaptasi bertahap. Pastikan pacing realistis dan pantau ketercapaian indikator utama.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} kuat di dukungan pengguna, dokumentasi langkah-demi-langkah, dan QA yang sabar. Ia menjaga hubungan baik, ritme stabil, dan keputusan berbasis bukti—cocok untuk BA/QA, dokumentasi, dan layanan rutin.
    `.trim(),
    least: `
Risiko: perfeksionisme administrasi, sulit menolak permintaan, menunda eskalasi karena menjaga harmoni. Peredam: kriteria “escalate now”, WIP limit, matriks prioritas CTQ, dan standup status 10 menit yang tegas.
    `.trim(),
    change: `
Pada perubahan, ${nickname} membantu adopsi lewat panduan rinci dan pendampingan. Gunakan change window, checklist verifikasi, serta sampling audit agar kualitas tetap konsisten saat transisi.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menjaga moral tim, komunikasi ramah, dan konsistensi SOP. Ia memastikan setiap anggota paham standar, rute, serta ekspektasi sebelum mulai—mendorong kepatuhan dan kualitas area yang stabil.
    `.trim(),
    least: `
Risiko: enggan menegur pelanggaran kecil, khawatir pada opini, dan fokus pada detail administrasi ketimbang throughput. Penyeimbang: checklist bertanda tangan, inspeksi ringan–sering, CTQ per area, dan target waktu per rute.
    `.trim(),
    change: `
Saat SOP/layout baru, ${nickname} mengedukasi tim via demo lapangan dan buddy system. Mulai dari area prioritas, ukur compliance & temuan kunci, lalu skalakan bertahap.
    `.trim()
  }
},

ICD: {
  Administrator: {
    most: `
Sebagai |I-C-D|, ${nickname} memadukan keramahan yang membangun jejaring, presisi kebijakan, dan dorongan menyelesaikan tugas “benar sejak awal”. Ia nyaman menilai situasi/relasi, menjaga kualitas, dan mengarahkan eksekusi berbasis dokumen/aturan yang jelas.
    `.trim(),
    least: `
Di tekanan tinggi, ${nickname} cenderung perfeksionis lalu mengisolasi diri untuk menuntaskan, enggan pada kejutan, dan menunda keputusan sampai sangat yakin. Risiko: lambat & kurang transparan. Antidot: definisikan “good enough”, timebox analisis, keputusan berbasis risiko CTQ, dan ritual status reguler.
    `.trim(),
    change: `
Dalam perubahan, ${nickname} efektif bila rencana jelas, tanpa kejutan, dengan SOP/pelatihan rapi. Terapkan rollout bertahap, checklist go-live, metrik kualitas pasca-implementasi, dan jalur umpan balik terbuka agar buy-in dan mutu sama-sama terjaga.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |I-C-D|, ${nickname} menghadirkan kelas engaging namun presisi: relasi baik dengan siswa, rubrik akurat, dan penyelesaian tugas tepat. Ia menjaga kualitas hasil belajar melalui standar jelas.
    `.trim(),
    least: `
Risiko: over-detail hingga waktu habis, enggan improvisasi, atau fokus pada kesempurnaan dokumen. Penyeimbang: indikator inti saja, contoh tugas sederhana, dan jeda eksplorasi terarah agar kreativitas siswa tetap hidup.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyiapkan panduan rinci dan contoh penilaian. Uji coba skala kecil, iterasi berdasarkan data hasil belajar, dan kunci kalender evaluasi untuk konsistensi.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam peran teknis, ${nickname} unggul pada QA, dokumentasi presisi, dan pengendalian perubahan. Ia sosial seperlunya namun tegas pada standar kualitas—mendorong hasil yang reliabel dan auditable.
    `.trim(),
    least: `
Risiko: analisis berlarut, resistensi pada perubahan mendadak, atau bekerja sendiri terlalu lama. Peredam: kanban transparan, WIP limit, gate keputusan, dan eksperimen bertahap dengan metrik kesehatan yang disepakati.
    `.trim(),
    change: `
Pada perubahan arsitektur, ${nickname} menulis RFC, menetapkan CTQ, dan menyiapkan rollback. Lakukan canary/blue–green, verifikasi terukur, dan post-implementation review untuk pembelajaran berkelanjutan.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} ramah dalam memimpin, namun sangat berorientasi pada kualitas. SOP rinci, checklist lengkap, dan inspeksi terukur membuat area konsisten bersih–rapi.
    `.trim(),
    least: `
Risiko: lambat beradaptasi saat ritme berubah, tenggelam di detail minor, atau bekerja sendiri menyelesaikan “sempurna”. Penyeimbang: CTQ area, timeboxing per rute, dan sampling audit agar fokus tetap pada dampak terbesar.
    `.trim(),
    change: `
Saat metode/alat baru diterapkan, ${nickname} menyiapkan standar kerja, pelatihan, dan evaluasi terjadwal. Mulai dari area kunci, ukur temuan & waktu siklus, kemudian perluas.
    `.trim()
  }
},

ICS: {
  Administrator: {
    most: `
Sebagai |I-C-S|, ${nickname} mengutamakan layanan empatik, kepastian standar, dan stabilitas proses. Ia komunikatif, loyal, sensitif terhadap kebutuhan pihak lain, serta mengambil keputusan berbasis data—hasilnya operasi tertib dan ramah pemangku kepentingan.
    `.trim(),
    least: `
Di bawah tekanan, ${nickname} bisa terlalu khawatir pada opini, menunda konfrontasi, atau perfeksionis pada detail administrasi. Risiko: keputusan lambat & energi terkuras. Antidot: ambang eskalasi, tenggat keputusan, CTQ yang disepakati, dan review status singkat berkala.
    `.trim(),
    change: `
Dalam perubahan, ${nickname} efektif sebagai fasilitator adopsi: menjelaskan alasan, menyiapkan panduan, dan menjaga ritme stabil. Gunakan pilot, checklist, serta metrik compliance agar kualitas tetap konsisten.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |I-C-S|, ${nickname} menghadirkan kelas hangat, terstruktur, dan adil. Ia peka pada perasaan siswa, menggunakan rubrik jelas, serta memastikan ekspektasi dipahami sebelum proyek dimulai.
    `.trim(),
    least: `
Risiko: terlalu memikirkan penerimaan sosial, kurang tegas pada pelanggaran, atau tenggelam pada detail kecil. Penyeimbang: kontrak belajar, indikator inti, bahasa umpan balik spesifik–konstruktif, dan batas waktu tugas yang konsisten.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyusun contoh tugas, rubrik baru, dan jadwal pelatihan singkat. Adaptasi bertahap dengan pemantauan indikator utama menjaga tempo tanpa mengorbankan rasa aman siswa.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} kuat di layanan pengguna, dokumentasi, dan QA praktis. Ia menjaga hubungan baik sambil memastikan standar dipenuhi—cocok untuk BA/QA & support operasional.
    `.trim(),
    least: `
Risiko: perfeksionisme dokumentasi, menunda eskalasi, dan over-communication yang mengaburkan prioritas. Peredam: kriteria “escalate now”, kanban prioritas CTQ, WIP limit, dan checkpoint QA terjadwal.
    `.trim(),
    change: `
Pada perubahan, ${nickname} menyusun panduan praktis, memberikan pelatihan, dan menjaga ritme transisi. Terapkan change window, checklist verifikasi, dan sampling audit agar kualitas konsisten.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} ramah dan telaten menjaga SOP, memastikan tim paham standar serta rute kerja sebelum eksekusi. Kualitas area stabil karena komunikasi jelas dan tindak lanjut rapi.
    `.trim(),
    least: `
Risiko: sulit menegur pelanggaran atau fokus pada detail minor hingga throughput turun. Penyeimbang: CTQ per area, target waktu per segmen, inspeksi ringan–sering, dan apresiasi kepatuhan.
    `.trim(),
    change: `
Saat SOP/layout baru, ${nickname} melakukan briefing komunikatif, demo lapangan, dan buddy system. Ukur compliance & temuan utama sebelum perluas ke seluruh area.
    `.trim()
  }
},
    SD: {
  Administrator: {
    most: `
Sebagai |S-D|, ${nickname} menggabungkan stabilitas proses dengan dorongan hasil. Ia objektif–analitis, suka terlibat langsung, dan konsisten menutup tindak lanjut hingga tuntas. Gaya tenang membangun kepercayaan, sementara dorongan D menjaga target dan SLA tercapai.
    `.trim(),
    least: `
Di bawah tekanan, ${nickname} bisa menjadi tidak ramah/terkesan dingin, menahan konfrontasi, atau lebih memilih “mendukung pemimpin” ketimbang mengambil alih isu yang tidak nyaman. Risiko: keputusan lambat dan prioritas kabur. Antidot: tenggat keputusan, ambang eskalasi, RACI tegas, dan ringkasan 1 halaman untuk mempercepat arah.
    `.trim(),
    change: `
Pada perubahan kebijakan/sistem, ${nickname} efektif dengan transisi bertahap: pilot kecil, SOP jelas, dan checklist implementasi. Jaga ritme stabil (S), namun pasang milestone tegas (D) agar adaptasi cepat tapi terkendali.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |S-D|, ${nickname} tenang–tegas: kelas terstruktur, ekspektasi jelas, dan tindak lanjut rapi. Ia suportif pada siswa namun konsisten mendorong penyelesaian tugas sampai selesai.
    `.trim(),
    least: `
Dalam tekanan, ${nickname} bisa kaku pada rencana, kurang spontan, atau menjaga jarak saat suasana tidak nyaman. Penyeimbang: variasi aktivitas berisiko rendah, check-in singkat, dan diferensiasi tugas agar disiplin tetap humanis.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyusun peta transisi (apa tetap–berubah–dihapus), contoh tugas, dan rubrik sederhana. Lakukan bertahap agar stabilitas kelas tetap terjaga.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} unggul pada prioritisasi tenang, eksekusi terstruktur, dan follow-up konsisten. Analisis obyektif dan ketahanan tinggi membuat reliabilitas sistem terjaga.
    `.trim(),
    least: `
Di puncak tekanan, ${nickname} cenderung menunda eskalasi/konfrontasi atau bertahan pada cara aman. Peredam: kriteria “escalate now”, runbook insiden, standup status 10 menit, dan pemisahan “fix-now/fix-next”.
    `.trim(),
    change: `
Saat migrasi/perubahan arsitektur, ${nickname} cocok memimpin rollout bertahap (canary/blue–green), dokumentasi, dan checkpoint kualitas. Milestone tegas memastikan laju tanpa mengorbankan stabilitas.
    `.trim()
  },
  Housekeeping: {
    most: `
Sebagai leader area, ${nickname} menjaga ritme kerja stabil, rute jelas, dan tindak lanjut temuan sampai tuntas. Ia suportif pada tim dan memastikan standar dipenuhi secara konsisten.
    `.trim(),
    least: `
Di beban puncak atau situasi tidak nyaman, ${nickname} bisa tampak dingin, menunda teguran, atau melambat untuk “mengamati”. Penyeimbang: CTQ per area, skrip umpan balik tegas–santun, target waktu per segmen, dan sampling audit.
    `.trim(),
    change: `
Ketika SOP/layout berubah, ${nickname} menjalankan simulasi rute, briefing lapangan, dan buddy system. Mulai dari area kunci, ukur compliance & waktu siklus, lalu skalakan.
    `.trim()
  }
},

SI: {
  Administrator: {
    most: `
Sebagai |S-I|, ${nickname} hangat, stabil, dan menjaga harmoni tim serta layanan internal. Ia pendengar baik, memfasilitasi kolaborasi, dan memastikan proses berjalan konsisten untuk kepuasan pemangku kepentingan.
    `.trim(),
    least: `
Risiko: menghindari konfrontasi, menerima kritik sebagai serangan pribadi, dan terlalu toleran pada kinerja rendah. Antidot: SLA & ambang eskalasi, skrip percakapan tegas–empatik, metrik kinerja transparan, dan dukungan HR/QA saat diperlukan.
    `.trim(),
    change: `
Dalam perubahan, ${nickname} menenangkan kekhawatiran dan memfasilitasi pelatihan. Tetapkan deadline nyata, milestone kecil, dan forum Q&A agar tempo tidak melambat.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |S-I|, ${nickname} menciptakan kelas hangat, aman, dan suportif. Ia pendengar yang sangat baik, mempertimbangkan perasaan siswa, dan menjaga stabilitas ritme belajar.
    `.trim(),
    least: `
Risiko: kurang tegas, terlalu memaklumi, dan terluka oleh kritik. Penyeimbang: kontrak belajar, batas peran/aturan yang konsisten, rubrik ringkas, dan latihan umpan balik spesifik–konstruktif.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyampaikan perubahan secara empatik dan bertahap dengan contoh tugas. Pastikan pacing realistis dan indikator utama dipantau.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam peran teknis, ${nickname} kuat di layanan pengguna, perawatan rutin, dan dokumentasi langkah demi langkah. Ia menjaga hubungan baik dan ritme layanan stabil.
    `.trim(),
    least: `
Risiko: menunda eskalasi demi harmoni, toleran pada deviasi prosedur, atau terlalu lama mendengarkan tanpa keputusan. Peredam: kriteria “escalate now”, runbook tegas, dan standup status singkat yang mengunci prioritas.
    `.trim(),
    change: `
Pada perubahan, ${nickname} membantu onboarding dan adopsi pengguna via panduan praktis. Gunakan checklist, batas waktu, dan sampling audit agar kualitas konsisten.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menjaga moral tim, komunikasi ramah, dan rutinitas stabil. Keluhan pengguna area ditangani dengan empatik sambil menjaga standar.
    `.trim(),
    least: `
Risiko: enggan menegur pelanggaran, toleran terhadap ketidakefektifan. Penyeimbang: checklist bertanda tangan, inspeksi ringan–sering, target waktu per rute, dan apresiasi kepatuhan.
    `.trim(),
    change: `
Saat SOP/layout baru, ${nickname} memperkenalkan perubahan secara komunikatif, demo lapangan, dan pendampingan. Fokus pada indikator CTQ agar tidak terseret isu minor.
    `.trim()
  }
},

SC: {
  Administrator: {
    most: `
Sebagai |S-C|, ${nickname} ramah–teliti: menjaga stabilitas proses, kepatuhan, dan detail operasional. Ia mempertimbangkan dampak keputusan pada orang dan menyusun SOP/dokumen yang jelas agar layanan konsisten dan dapat diaudit.
    `.trim(),
    least: `
Risiko: terlalu hati-hati, menunda keputusan, atau memperlambat kerja untuk “mengamati” saat merasa ada yang memanfaatkan situasi. Antidot: timebox analisis, definisi “good enough”, jalur sign-off sederhana, dan kanal umpan balik yang aman.
    `.trim(),
    change: `
Dalam perubahan, ${nickname} efektif dengan rencana tanpa kejutan: pilot kecil, checklist go-live, dan metrik pasca-implementasi. Komunikasi empatik menjaga buy-in, sementara standar mutu tetap tegak.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |S-C|, ${nickname} menghadirkan kelas stabil, rapi, dan teliti. Ia peduli pada siswa sekaligus menjaga akurasi administrasi dan penilaian berbasis rubrik.
    `.trim(),
    least: `
Risiko: terlalu hati-hati, ruang eksplorasi sempit, dan lambat mengambil keputusan. Penyeimbang: indikator inti saja, contoh tugas sederhana, serta sesi eksplorasi terarah agar kreativitas tidak padam.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyiapkan panduan rinci dan bertahap. Uji coba kecil, iterasi berdasar bukti belajar, dan kalender evaluasi yang terkunci menjaga konsistensi.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} kuat pada QA, SOP terperinci, dan dokumentasi. Ia menjaga layanan stabil dan kualitas detail tereksekusi dengan baik.
    `.trim(),
    least: `
Risiko: kehati-hatian berlebih memperlambat rilis atau membuat ${nickname} memperlambat kerja untuk memantau situasi. Peredam: matriks risiko CTQ, WIP limit, gate keputusan, dan eksperimen bertahap dengan metrik kesehatan.
    `.trim(),
    change: `
Pada perubahan arsitektur, ${nickname} menyusun RFC, checklist verifikasi, dan rencana rollback. Jalankan canary/blue–green, ukur hasil, dan lakukan review terjadwal agar mutu terjaga tanpa menghambat roadmap.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menjaga SOP rinci, rute kerja stabil, dan inspeksi yang telaten. Detail diperhatikan tanpa mengorbankan kenyamanan tim/area.
    `.trim(),
    least: `
Jika merasa ada yang “memanfaatkan”, ${nickname} dapat melambat untuk mengamati— throughput turun. Penyeimbang: pembagian kerja adil, rotasi rute, CTQ per area, dan umpan balik dua arah yang jelas.
    `.trim(),
    change: `
Saat metode/alat baru diterapkan, ${nickname} menyiapkan standar kerja, pelatihan, dan evaluasi. Mulai dari area prioritas, ukur temuan & waktu siklus, lalu perluas bertahap.
    `.trim()
  }
}
,
    SDI: {
  Administrator: {
    most: `
Sebagai |S-D-I|, ${nickname} menyeimbangkan ritme kerja stabil (S), ketegasan target (D), dan komunikasi yang memobilisasi (I). Ia objektif–analitis, senang terlibat langsung, suportif pada pemangku kepentingan, dan kuat pada tindak lanjut hingga tuntas. Detail operasional dapat didelegasikan ke pemilik proses, sementara ${nickname} menjaga arah, disiplin, dan kolaborasi.
    `.trim(),
    least: `
Di bawah tekanan, ${nickname} cenderung menghindari konfrontasi pada isu tidak nyaman, bertahan pada cara aman, atau melebar membantu banyak pihak hingga prioritas kabur. Risiko: keputusan lambat, scope creep, dan akuntabilitas kabur. Antidot: tenggat keputusan, RACI tegas, WIP limit, dan ringkasan 1 halaman berbasis fakta untuk eskalasi cepat.
    `.trim(),
    change: `
Saat perubahan kebijakan/sistem, ${nickname} efektif menjalankan transisi bertahap: pilot kecil, milestone jelas, dan checklist adopsi. Gunakan komunikasi ritmik (I) untuk buy-in, jaga ritme stabil (S), dan kunci CTQ serta baseline lingkup (D) agar laju tidak mengorbankan kualitas.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |S-D-I|, ${nickname} menata kelas stabil dan suportif dengan tujuan belajar yang jelas. Ia persisten menutup tugas, membangun relasi positif, dan memotivasi siswa sambil menjaga struktur aktivitas yang terarah.
    `.trim(),
    least: `
Dalam tekanan, ${nickname} bisa ragu menegakkan aturan di awal, lalu mendadak tegas belakangan; atau menambah aktivitas demi menjaga suasana hingga beban tidak proporsional. Penyeimbang: kontrak belajar, tangga konsekuensi yang konsisten, dan diferensiasi tugas agar disiplin tetap manusiawi.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} memetakan “apa tetap–berubah–dihapus”, menyiapkan contoh tugas & rubrik sederhana, dan menyosialisasikan bertahap ke siswa–orang tua. Jaga scaffolding dan ritme evaluasi agar adaptasi mulus.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam konteks teknis, ${nickname} tenang–tegas: menetapkan prioritas, mengoordinasi respon, dan menutup loop hingga insiden/proyek tuntas. Ia objektif pada RCA, komunikatif pada status, dan konsisten pada follow-up.
    `.trim(),
    least: `
Di puncak tekanan, ${nickname} bisa menunda eskalasi, bertahan pada solusi aman, atau melewatkan dokumentasi karena fokus menyelesaikan. Peredam: kriteria “escalate now”, pisahkan “fix-now/fix-next”, checklist insiden, dan postmortem tanpa menyalahkan.
    `.trim(),
    change: `
Saat migrasi/perubahan arsitektur, ${nickname} unggul dengan rollout bertahap (canary/blue–green), runbook, dan komunikasi status ritmik. Milestone tegas (D) + stabilitas eksekusi (S) + buy-in lintas tim (I) = adopsi cepat namun aman.
    `.trim()
  },
  Housekeeping: {
    most: `
Sebagai leader area, ${nickname} menjaga ritme kerja stabil, rute jelas, dan tindak lanjut temuan sampai tuntas. Ia memotivasi tim dengan komunikasi hangat sambil memastikan standar terpenuhi.
    `.trim(),
    least: `
Di beban puncak, ${nickname} bisa menunda teguran demi suasana atau menambah tugas tanpa mengukur beban. Penyeimbang: CTQ per area, target waktu per segmen, rotasi beban, dan sampling audit berkala.
    `.trim(),
    change: `
Ketika SOP/layout berubah, ${nickname} melakukan simulasi rute, briefing lapangan, dan buddy system. Mulai area prioritas, ukur compliance & waktu siklus, lalu skalakan bertahap.
    `.trim()
  }
},

SDC: {
  Administrator: {
    most: `
Sebagai |S-D-C|, ${nickname} sabar–terkontrol, menggali fakta, dan mengeksekusi konsisten. Ia merencanakan pekerjaan hati-hati, mengumpulkan data pendukung, lalu berjalan mantap sesuai arahan yang benar. People skill menonjol sehingga layanan ke pemangku kepentingan kuat, sementara kepatuhan & dokumentasi terjaga.
    `.trim(),
    least: `
Risiko: terlalu hati-hati dan lambat memutuskan, over-collecting data, atau mengutamakan kenyamanan orang dibanding batas waktu. Antidot: timebox analisis, acceptance criteria jelas, jalur sign-off sederhana, dan ambang eskalasi ketika blocker muncul.
    `.trim(),
    change: `
Dalam perubahan sistem, ${nickname} efektif jika governance jelas: RACI, RFC, checklist go-live, window perubahan, dan metrik kualitas pasca-implementasi. Jalankan bertahap dengan komunikasi empatik agar mutu dan buy-in terjaga.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |S-D-C|, ${nickname} menyiapkan kelas rapi, stabil, dan berbasis bukti. Ia sabar, ramah, teliti pada materi–rubrik, dan konsisten mendorong penyelesaian tugas yang benar.
    `.trim(),
    least: `
Dalam tekanan, ia bisa terlalu hati-hati, membatasi spontanitas, atau melambat demi verifikasi detail. Penyeimbang: indikator inti saja, contoh tugas sederhana, dan sesi eksplorasi terarah agar kreativitas tetap hidup.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyiapkan panduan rinci, contoh penilaian, dan jadwal bertahap. Hindari over-engineering: uji coba kecil dan iterasi berdasar data hasil belajar.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} kuat pada fact-finding, SOP, dan eksekusi konsisten. Ia menjaga kualitas dan stabilitas layanan melalui dokumentasi jelas dan kontrol perubahan.
    `.trim(),
    least: `
Risiko: analysis paralysis, menunda eskalasi, atau enggan mengubah rute kerja yang sudah aman. Peredam: matriks risiko CTQ, kriteria “escalate now”, dan eksperimen bertahap dengan metrik kesehatan.
    `.trim(),
    change: `
Pada perubahan arsitektur, ${nickname} mengandalkan RFC, test plan, rollback, dan verifikasi terukur. Jalankan canary/blue–green, review terjadwal, dan batasi WIP untuk menjaga mutu tanpa memperlambat roadmap.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} telaten, ramah, dan konsisten menolong tim. Rute, SOP, dan inspeksi dijalankan stabil; standar jelas sehingga kualitas area terjaga.
    `.trim(),
    least: `
Jika ritme berubah, ${nickname} bisa melambat untuk mengamati atau terlalu banyak memeriksa detail. Penyeimbang: CTQ per area, target waktu segmen, dan sampling audit agar fokus pada dampak terbesar.
    `.trim(),
    change: `
Saat metode/alat baru diterapkan, ${nickname} menyiapkan daftar cek, pelatihan, dan evaluasi bertahap. Mulai dari area prioritas, ukur temuan & waktu siklus, baru perluas.
    `.trim()
  }
},

SID: {
  Administrator: {
    most: `
Sebagai |S-I-D|, ${nickname} hangat–stabil dan komunikatif, namun siap memimpin ketika tujuan jelas. Ia mempertimbangkan perasaan orang dalam keputusan, menjaga layanan konsisten, dan mendorong penyelesaian kerja cepat–efisien ketika dibutuhkan.
    `.trim(),
    least: `
Risiko: menghindari konfrontasi, menerima kritik secara pribadi, terlalu toleran pada kinerja rendah, atau mengejar pengakuan sehingga prioritas kabur. Antidot: SLA & ambang eskalasi, skrip umpan balik tegas–empatik, metrik kinerja transparan, dan checkpoint keputusan.
    `.trim(),
    change: `
Dalam perubahan, ${nickname} menenangkan kekhawatiran dan menggalang dukungan. Tetapkan milestone kecil, deadline nyata, contoh konkret, dan forum tanya–jawab berkala agar adaptasi tidak melambat.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |S-I-D|, ${nickname} menciptakan kelas hangat dan suportif, lalu mengarahkan ke pencapaian yang jelas. Ia komunikatif, mempertimbangkan emosi siswa, dan menyelesaikan tugas tepat waktu saat target sudah disepakati.
    `.trim(),
    least: `
Risiko: kurang tegas di awal, terlalu memaklumi, atau sensitif terhadap kritik. Penyeimbang: kontrak belajar, batas peran & aturan konsisten, rubrik ringkas, dan jadwal umpan balik tetap.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyampaikan alasan perubahan secara empatik, menyediakan contoh tugas, dan menjadwalkan adaptasi bertahap. Daya dorong D dipakai untuk memastikan tenggat tercapai.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam peran teknis, ${nickname} andal pada layanan pengguna, dokumentasi langkah-demi-langkah, dan koordinasi ketika prioritas jelas. Ia menjaga ritme stabil dan menyelesaikan pekerjaan efisien.
    `.trim(),
    least: `
Risiko: menunda eskalasi atau teguran demi harmoni, menyerap kritik secara pribadi, dan toleran terhadap deviasi prosedur. Peredam: kriteria “escalate now”, runbook tegas, standup 10 menit untuk mengunci prioritas.
    `.trim(),
    change: `
Pada perubahan, ${nickname} membantu onboarding dan adopsi pengguna. Gunakan checklist, batas waktu, change window, dan sampling audit agar kualitas konsisten selama transisi.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menjaga moral tim, ritme stabil, dan siap memimpin atau mendukung sesuai kebutuhan. Ia memastikan area rapi melalui komunikasi jelas dan tindak lanjut cepat.
    `.trim(),
    least: `
Risiko: enggan menegur pelanggaran kecil, fokus pada penerimaan sosial, atau tersinggung oleh kritik. Penyeimbang: CTQ area, inspeksi ringan–sering, target waktu per rute, dan format umpan balik spesifik–konstruktif.
    `.trim(),
    change: `
Saat SOP/layout baru, ${nickname} memperkenalkan perubahan secara komunikatif, demo lapangan, dan buddy system. Ukur compliance & temuan utama sebelum ekspansi penuh.
    `.trim()
  }
},
    SIC: {
  Administrator: {
    most: `
Sebagai |S-I-C|, ${nickname} stabil, ramah, dan loyal dalam membangun hubungan pemangku kepentingan. Ia menjaga layanan konsisten, menjelaskan ekspektasi sebelum proyek dimulai, dan mampu masuk ke detail ketika dibutuhkan. Keputusan dibuat berbasis data, namun preferensi utamanya adalah menjaga harmoni tim dan kejelasan peran.
    `.trim(),
    least: `
Di bawah tekanan, ${nickname} bisa terlalu peduli pada opini, enggan konfrontasi, menunggu mandat jelas, atau menunda keputusan. Risiko: tempo melambat dan prioritas kabur. Antidot: tetapkan RACI/decision-rights, SLA & tenggat keputusan, ringkasan 1 halaman berbasis fakta, serta skrip percakapan tegas–empatik.
    `.trim(),
    change: `
Dalam perubahan kebijakan/sistem, ${nickname} efektif sebagai fasilitator: menenangkan, melatih, dan menjaga komunikasi dua arah. Guardrail: mandat tertulis, pilot kecil, checklist adopsi, office hour Q&A, dan metrik compliance agar adaptasi cepat namun tetap nyaman.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |S-I-C|, ${nickname} menciptakan kelas hangat dan terstruktur. Ia peka terhadap perasaan siswa, loyal, dan menilai dengan rubrik jelas berbasis data. Ekspektasi dipastikan dipahami sebelum tugas dimulai.
    `.trim(),
    least: `
Risiko: sulit tegas di awal, bingung saat mandat/aturan tidak jelas, atau terlalu memikirkan penerimaan sosial. Penyeimbang: kontrak belajar, indikator inti pada rubrik, batas peran konsisten, dan jadwal umpan balik tetap.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menjelaskan alasan perubahan secara empatik, menyediakan contoh tugas, dan menggelar adaptasi bertahap. Pastikan parameter wewenang & standar minimum tertulis.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} kuat di dukungan pengguna, dokumentasi langkah-demi-langkah, dan QA praktis. Ia menjaga ritme stabil dan relasi baik, serta mengeksekusi detail saat diperlukan.
    `.trim(),
    least: `
Risiko: menunda eskalasi demi harmoni, ragu mengambil keputusan tanpa mandat, atau over-communicate hingga prioritas kabur. Peredam: kriteria “escalate now”, kanban prioritas CTQ, WIP limit, dan checkpoint QA terjadwal.
    `.trim(),
    change: `
Pada perubahan, ${nickname} menyusun panduan praktis, pelatihan komunikatif, dan jalur bantuan. Gunakan change window, checklist verifikasi, dan sampling audit agar kualitas konsisten selama transisi.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} ramah, telaten, dan menjaga SOP berjalan konsisten. Ia memastikan tiap anggota paham standar dan rute sebelum eksekusi; hubungan tim positif dan kepatuhan stabil.
    `.trim(),
    least: `
Risiko: enggan menegur pelanggaran kecil, terlalu khawatir opini, atau menunda keputusan saat mandat tidak jelas. Penyeimbang: CTQ per area, target waktu per segmen, inspeksi ringan–sering, dan format umpan balik tegas–santun.
    `.trim(),
    change: `
Saat SOP/layout baru, ${nickname} melakukan demo lapangan, buddy system, dan penjelasan ekspektasi yang eksplisit. Mulai dari area prioritas, ukur compliance & temuan kunci, lalu skalakan.
    `.trim()
  }
},

SCD: {
  Administrator: {
    most: `
Sebagai |S-C-D|, ${nickname} stabil, teliti, dan berorientasi kualitas. Ia mempertimbangkan dampak keputusan pada orang, menyusun SOP/dokumen jelas, dan mengeksekusi dengan konsisten. Ketika target harus dikejar, sisi D memastikan penyelesaian tepat waktu tanpa mengorbankan mutu.
    `.trim(),
    least: `
Risiko: terlalu hati-hati, memperlambat kerja untuk “mengamati” saat merasa ada yang memanfaatkan, atau menunda keputusan demi kesempurnaan. Antidot: timebox analisis, definisi “good enough”, jalur sign-off sederhana, ambang eskalasi, dan pembagian akuntabilitas yang jelas.
    `.trim(),
    change: `
Dalam perubahan sistem, ${nickname} unggul jika governance jelas: RACI, RFC, checklist go-live, window perubahan, serta metrik pasca-implementasi. Jalankan bertahap dengan komunikasi empatik agar buy-in dan kualitas sama-sama terjaga.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |S-C-D|, ${nickname} menghadirkan kelas stabil, rapi, dan teliti. Ia peduli pada siswa, rubrik akurat, serta konsisten mendorong tugas selesai dengan benar sejak awal.
    `.trim(),
    least: `
Risiko: kehati-hatian berlebih menyempitkan eksplorasi dan memperlambat keputusan. Penyeimbang: indikator inti saja, contoh tugas sederhana, dan sesi eksplorasi terarah agar kreativitas tetap hidup.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyiapkan panduan rinci, contoh penilaian, dan jadwal bertahap. Hindari over-engineering: uji coba kecil dan iterasi berdasar data hasil belajar.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} kuat pada QA, dokumentasi presisi, dan kontrol perubahan. Ia memastikan proses dapat diaudit dan stabil, lalu mendorong penyelesaian sesuai target saat diperlukan.
    `.trim(),
    least: `
Risiko: analysis paralysis, lambat beradaptasi, atau melambat untuk memantau “situasi”. Peredam: matriks risiko CTQ, kriteria “escalate now”, eksperimen bertahap dengan metrik kesehatan, dan standup status 10 menit.
    `.trim(),
    change: `
Pada perubahan arsitektur, ${nickname} menyiapkan RFC, test plan, rollback, dan verifikasi terukur. Terapkan canary/blue–green, review terjadwal, dan batasi WIP agar mutu terjaga tanpa menghambat roadmap.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menjaga SOP rinci, rute stabil, dan inspeksi telaten. Standar kebersihan dipertahankan dengan konsisten, sementara dorongan hasil memastikan temuan ditutup tepat waktu.
    `.trim(),
    least: `
Jika merasa ada pihak “memanfaatkan”, ${nickname} dapat memperlambat kerja untuk mengamati—throughput turun. Penyeimbang: pembagian kerja adil, rotasi rute, CTQ per area, target waktu segmen, dan umpan balik dua arah.
    `.trim(),
    change: `
Saat metode/alat baru diterapkan, ${nickname} menyusun standar kerja, pelatihan, dan evaluasi terjadwal. Mulai dari area prioritas, ukur temuan & waktu siklus, kemudian perluas bertahap.
    `.trim()
  }
},

SCI: {
  Administrator: {
    most: `
Sebagai |S-C-I|, ${nickname} mengutamakan stabilitas proses, kepastian standar, dan komunikasi yang hangat. Ia membangun hubungan positif, mengambil keputusan berbasis data, serta memastikan semua pihak memahami ekspektasi sebelum mulai.
    `.trim(),
    least: `
Risiko: keras kepala pada keputusan yang sudah diambil, menahan konfrontasi, atau menunggu parameter wewenang sangat jelas sebelum melangkah. Antidot: decision-rights matrix, SLA & tenggat keputusan, ringkasan 1 halaman berbasis fakta, dan forum dengar pendapat terstruktur.
    `.trim(),
    change: `
Dalam perubahan, ${nickname} efektif sebagai fasilitator adopsi yang stabil: menjelaskan alasan, menyiapkan panduan, dan menjaga ritme. Gunakan pilot, checklist verifikasi, dan metrik compliance agar kualitas konsisten.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |S-C-I|, ${nickname} menghadirkan kelas hangat, terstruktur, dan adil. Ia peka pada kebutuhan siswa, menggunakan rubrik jelas, dan memastikan ekspektasi dipahami sebelum proyek dimulai.
    `.trim(),
    least: `
Risiko: sulit mengubah pendirian, terlalu memikirkan penerimaan sosial, atau tenggelam pada detail administrasi. Penyeimbang: indikator inti, kontrak belajar, bahasa umpan balik spesifik–konstruktif, dan batas waktu konsisten.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyusun contoh tugas, rubrik baru, dan jadwal pelatihan singkat. Adaptasi bertahap dengan pemantauan indikator utama menjaga tempo tanpa mengorbankan rasa aman siswa.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam peran teknis, ${nickname} andal di layanan pengguna, dokumentasi, dan QA praktis. Ia menjaga relasi baik, ritme stabil, dan masuk ke detail saat diperlukan untuk memastikan mutu.
    `.trim(),
    least: `
Risiko: menunda eskalasi demi harmoni, teguh pada keputusan lama walau konteks berubah, atau over-communicate sehingga fokus kabur. Peredam: kriteria “escalate now”, kanban prioritas CTQ, WIP limit, dan checkpoint QA terjadwal.
    `.trim(),
    change: `
Pada perubahan, ${nickname} menyusun panduan rinci dan pelatihan komunikatif. Terapkan change window, checklist verifikasi, dan sampling audit agar kualitas konsisten saat transisi.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menjaga SOP konsisten, komunikasi ramah, dan rute kerja stabil. Ia memastikan setiap anggota paham standar & ekspektasi sebelum eksekusi, sehingga mutu area terjaga.
    `.trim(),
    least: `
Risiko: enggan menegur pelanggaran kecil, sulit mengubah keputusan yang sudah diambil, atau fokus pada opini. Penyeimbang: CTQ per area, inspeksi ringan–sering, target waktu per rute, dan umpan balik tegas–santun.
    `.trim(),
    change: `
Saat SOP/layout baru, ${nickname} melakukan briefing komunikatif, demo lapangan, dan buddy system. Ukur compliance & temuan utama sebelum perluas ke seluruh area.
    `.trim()
  }
},
    S: {
      Administrator: {
        most: `
Sebagai tipe Steadiness, ${nickname} sangat teratur, teliti, dan andal dalam memastikan proses administrasi berjalan lancar dan minim kesalahan. Konsistensi kerja yang tinggi membuat ${nickname} menjadi andalan dalam menjaga kelancaran dokumen, arsip, dan segala urusan administratif. ${nickname} biasanya sabar menghadapi proses, tetap tenang dalam menyelesaikan tugas, serta cenderung bertahan dengan sistem kerja yang sudah terbukti efektif.
        `.trim(),
        least: `
Ketika menghadapi perubahan prosedur atau sistem baru, ${nickname} cenderung resisten atau lambat beradaptasi. Sikap ini bisa menjadi penghambat pembaruan dan inovasi dalam administrasi. Untuk itu, penting bagi ${nickname} untuk membuka diri terhadap pembaruan, aktif mencari cara meningkatkan efisiensi, dan tetap responsif terhadap kebutuhan organisasi yang berkembang.
        `.trim(),
        change: `
Saat beban kerja meningkat atau terjadi perubahan mendadak, ${nickname} tetap mampu menjaga konsistensi dan kualitas pekerjaan. Namun, untuk bisa bertahan dalam dinamika administrasi modern, ${nickname} perlu terus mengembangkan kemampuan proaktif dalam menerima perubahan, baik dalam prosedur maupun teknologi.
        `.trim()
      },
      Guru: {
        most: `
Sebagai guru tipe Steadiness, ${nickname} sangat konsisten, sabar, dan mampu menciptakan lingkungan belajar yang stabil serta aman bagi siswa. Siswa merasa nyaman dan percaya untuk berkembang dalam kelas yang dipimpin oleh ${nickname}, karena suasana yang disiplin dan penuh perhatian. Pendekatan ini sangat mendukung keberhasilan proses belajar berkelanjutan.
        `.trim(),
        least: `
Saat menghadapi perubahan kurikulum atau dinamika kelas, ${nickname} cenderung kurang fleksibel. Hal ini bisa membuat kelas sulit menyesuaikan diri dengan tuntutan zaman atau kebutuhan siswa. ${nickname} perlu meningkatkan kemampuan adaptasi, mencari inovasi dalam metode belajar, dan lebih terbuka terhadap umpan balik dari siswa maupun rekan guru.
        `.trim(),
        change: `
Ketika tekanan pekerjaan meningkat, ${nickname} tetap bisa menjaga stabilitas dan ketenangan kelas. Namun, agar kualitas pembelajaran tetap terjaga, ${nickname} perlu terus membuka diri terhadap inovasi dan berbagai metode pembelajaran baru.
        `.trim()
      },
      "Technical Staff": {
        most: `
Sebagai tenaga teknis dengan tipe Steadiness, ${nickname} memastikan setiap pekerjaan dilakukan dengan teliti, hati-hati, dan minim risiko kesalahan. Konsistensi dan keandalan menjadi nilai lebih yang membuat ${nickname} sangat dipercaya oleh rekan kerja maupun atasan. Semua SOP teknis diikuti dengan disiplin, sehingga hasil kerja tetap terjamin kualitasnya.
        `.trim(),
        least: `
Ketika dihadapkan pada perubahan alat, prosedur, atau sistem baru, ${nickname} cenderung butuh waktu lebih lama untuk beradaptasi. Akibatnya, proses upgrade teknologi bisa tertunda. Untuk menghadapi tantangan era modern, ${nickname} perlu terus mengasah kemampuan belajar hal baru dan lebih terbuka terhadap perubahan.
        `.trim(),
        change: `
Dalam tekanan kerja teknis atau perubahan mendadak, ${nickname} mampu menjaga standar kualitas, namun harus lebih responsif dan fleksibel dalam menyikapi situasi lapangan, sehingga hasil kerja tetap efisien dan sesuai kebutuhan organisasi.
        `.trim()
      },
      Housekeeping: {
        most: `
Sebagai pribadi tipe Steadiness di Housekeeping, ${nickname} sangat menjaga standar kebersihan secara konsisten dan dapat diandalkan dalam rutinitas harian. ${nickname} memastikan setiap area tetap rapi, pekerjaan dilakukan teliti, dan tidak mudah lalai terhadap detail kebersihan. Sikap sabar dan kestabilan kerja menjadikan ${nickname} tulang punggung dalam menjaga kualitas layanan Housekeeping.
        `.trim(),
        least: `
Saat terjadi perubahan pola kerja, shifting jadwal, atau penambahan tugas baru, ${nickname} cenderung sulit beradaptasi. Hal ini kadang membuat tim Housekeeping kurang responsif terhadap kebutuhan organisasi yang terus berkembang. Oleh sebab itu, ${nickname} perlu lebih fleksibel, aktif bertanya, dan belajar metode kerja baru demi mendukung performa tim.
        `.trim(),
        change: `
Ketika tekanan meningkat, ${nickname} tetap stabil, teliti, dan tidak mudah panik. Namun, peningkatan adaptasi dan keterbukaan terhadap perubahan sangat diperlukan agar kinerja Housekeeping tetap optimal di segala kondisi.
        `.trim()
      }
    },
    CD: {
  Administrator: {
    most: `
Sebagai |C-D|, ${nickname} sangat berorientasi tugas, faktual, dan tegas pada standar. Ia cepat menyusun kebijakan yang jelas, indikator kinerja terukur, serta kontrol mutu ketat. Keputusan diambil berdasarkan data—bukan emosi—sehingga operasi administrasi tertib, konsisten, dan dapat diaudit.
    `.trim(),
    least: `
Risiko: tampak dingin/berjarak, micromanagement pada detail, dan toleransi rendah pada ambiguitas. Komunikasi bisa satu arah dan kepercayaan ke tim menurun. Antidot: definisikan “good enough”, delegasikan keputusan operasional dengan acceptance criteria, dan adakan forum tanya–jawab terstruktur untuk menjaga buy-in.
    `.trim(),
    change: `
Dalam perubahan sistem/struktur, ${nickname} efektif jika ada governance jelas: RACI, RFC terdokumentasi, checklist go-live, dan window perubahan. Jalankan pilot kecil dengan metrik pasca-implementasi (defect, SLA, compliance) agar mutu terjaga tanpa menghambat laju.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |C-D|, ${nickname} menyusun pembelajaran presisi dengan rubrik ketat dan target hasil yang jelas. Ia menegakkan disiplin berbasis aturan dan menilai secara objektif, sehingga kualitas akademik terjaga.
    `.trim(),
    least: `
Risiko: umpan balik terasa keras, ruang eksplorasi sempit, dan empati ke siswa kurang—motivasi bisa turun. Penyeimbang: bahasa umpan balik konstruktif, contoh kerja “memadai” vs “unggul”, dan porsi aktivitas eksplorasi terarah.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyiapkan kriteria inti, contoh penilaian, dan pacing bertahap. Hindari overcontrol dengan memberi otonomi terbatas pada siswa di dalam koridor standar.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} unggul pada RCA tajam, kontrol perubahan ketat, dan kualitas rilis. Ia mengutamakan spesifikasi, dokumentasi presisi, serta verifikasi berbasis bukti sebelum “done”.
    `.trim(),
    least: `
Risiko: mengabaikan dimensi relasi, sulit mempercayai tim, atau menunda rilis menunggu kesempurnaan. Peredam: matriks risiko CTQ, timebox analisis, dan prinsip “fix-now / harden-next” dengan postmortem tanpa menyalahkan.
    `.trim(),
    change: `
Pada migrasi/rekayasa ulang, ${nickname} memastikan RFC, test plan, rollback, dan metrik kesehatan disepakati. Terapkan canary/blue–green dan review terjadwal untuk menjaga mutu tanpa mengorbankan roadmap.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menegakkan standar kebersihan dengan SOP rinci, checklist lengkap, dan inspeksi disiplin. Deviasi kecil segera dikoreksi agar tidak menjadi pola.
    `.trim(),
    least: `
Risiko: gaya dingin, fokus berlebih pada detail minor, dan motivasi tim turun. Penyeimbang: CTQ per area, sampling audit, serta apresiasi perilaku patuh untuk menjaga moral.
    `.trim(),
    change: `
Saat metode/alat baru diterapkan, ${nickname} menyusun standar kerja terukur, pelatihan singkat, dan evaluasi pasca-implementasi. Mulai dari area prioritas lalu skalakan.
    `.trim()
  }
},

CI: {
  Administrator: {
    most: `
Sebagai |C-I|, ${nickname} menggabungkan akurasi kebijakan dengan kemampuan membangun hubungan ketika diperlukan. Ia menetapkan standar kualitas tinggi, menyajikan data jelas, dan mampu menyosialisasikan aturan secara ramah agar diterima.
    `.trim(),
    least: `
Risiko: perfeksionisme hingga isolasi kerja, resistensi pada kejutan, dan keputusan lambat. Penyeimbang: batas WIP, timebox perencanaan, checkpoint komunikasi rutin, dan definisi “cukup layak rilis” yang disepakati.
    `.trim(),
    change: `
Dalam perubahan, ${nickname} efektif bila ada rencana tanpa kejutan: panduan rinci, FAQ, dan jalur umpan balik. Uji coba kecil dan iterasi berdasarkan data kepatuhan/kualitas menjaga buy-in.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |C-I|, ${nickname} menghadirkan kelas rapi dan adil: rubrik akurat, contoh jelas, dan komunikasi yang menenangkan. Ia peduli relasi namun tetap menjaga mutu hasil belajar.
    `.trim(),
    least: `
Risiko: waktu tersita pada detail non-kritis atau menghindari improvisasi; di sisi lain optimisme relasional dapat membuat estimasi beban kurang tepat. Penyeimbang: indikator inti, jadwal umpan balik konsisten, dan batas waktu tegas.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyediakan template sederhana, contoh penilaian, dan sosialisasi empatik. Iterasi rubrik dilakukan setelah review bukti belajar awal.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam peran teknis, ${nickname} kuat pada QA, dokumentasi, dan koordinasi yang cukup hangat. Ia menjaga akurasi artefak teknis sambil tetap mampu berjejaring lintas fungsi saat dibutuhkan.
    `.trim(),
    least: `
Risiko: analisis berlarut atau “menunggu kepastian” sehingga rilis tertunda; sebaliknya fokus hubungan bisa membuat estimasi optimistis. Peredam: buffer estimasi, gate keputusan, dan review berpasangan.
    `.trim(),
    change: `
Pada perubahan arsitektur, ${nickname} menulis RFC, menyiapkan panduan adopsi, dan mendampingi tim. Terapkan canary, metrik kesehatan, dan post-implementation review.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} teliti namun tetap ramah. Ia memastikan SOP jelas, komunikasi baik dengan pengguna area, dan tindak lanjut temuan tertata.
    `.trim(),
    least: `
Risiko: terjebak detail minor atau bekerja sendiri terlalu lama; kadang over-optimistis terhadap kemampuan tim. Penyeimbang: rute prioritas, target waktu per segmen, dan audit sampling.
    `.trim(),
    change: `
Saat SOP/alat baru, ${nickname} menyiapkan panduan dan pelatihan singkat. Mulai dari area kunci, ukur hasil, lalu perluas.
    `.trim()
  }
},

CS: {
  Administrator: {
    most: `
Sebagai |C-S|, ${nickname} sistematis, patuh prosedur, dan teliti. Ia menyusun SOP jelas, kalender kepatuhan, serta dokumentasi lengkap sehingga layanan konsisten dan dapat diaudit.
    `.trim(),
    least: `
Risiko: analysis paralysis, menghindari konflik, dan penolakan pada perubahan mendadak. Antidot: timebox keputusan, jalur sign-off sederhana, decision-rights matrix, dan komunikasi perubahan yang bertahap.
    `.trim(),
    change: `
Dalam perubahan kebijakan/sistem, ${nickname} efektif jika transisi terstruktur: pilot, checklist go-live, dan metrik pasca-implementasi. Pastikan tidak ada “kejutan” dengan rencana komunikasi berlapis.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |C-S|, ${nickname} menjaga kelas teratur dan akurat: rubrik terperinci, instruksi jelas, dan ritme belajar stabil. Siswa memahami ekspektasi sejak awal.
    `.trim(),
    least: `
Risiko: terlalu berhati-hati hingga ruang eksplorasi menyempit dan keputusan lambat. Penyeimbang: fokus indikator inti, contoh tugas sederhana, dan porsi eksplorasi terarah agar kreativitas tetap hidup.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyiapkan panduan rinci dan jadwal bertahap. Uji kecil–iterasi–sebar untuk menjaga mutu tanpa mengacaukan ritme.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} andal pada SOP, QA, dan dokumentasi presisi. Ia menjaga stabilitas layanan dan meminimalkan deviasi prosedur.
    `.trim(),
    least: `
Risiko: resistensi pada perubahan mendadak, terjebak detail, atau menunda eskalasi. Peredam: matriks risiko CTQ, kriteria “escalate now”, WIP limit, dan eksperimen bertahap dengan metrik kesehatan.
    `.trim(),
    change: `
Pada perubahan arsitektur, ${nickname} menyiapkan RFC, checklist verifikasi, dan rencana rollback. Jalankan canary/blue–green, review terjadwal, dan log keputusan untuk akuntabilitas.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menjaga standar kebersihan melalui SOP rinci, rute stabil, dan inspeksi telaten. Detail diperhatikan tanpa mengorbankan konsistensi tim.
    `.trim(),
    least: `
Risiko: terlalu lama pada detail kecil dan lambat mengubah prioritas saat beban puncak. Penyeimbang: CTQ per area, target waktu per segmen, rotasi beban, dan sampling audit.
    `.trim(),
    change: `
Saat metode/alat baru diterapkan, ${nickname} menyusun standar kerja, pelatihan, dan evaluasi pasca-implementasi. Mulai dari area prioritas, ukur temuan & waktu siklus sebelum ekspansi.
    `.trim()
  }
},
   CDI: {
  Administrator: {
    most: `
Sebagai |C-D-I|, ${nickname} sangat berorientasi tugas dan faktual: menetapkan standar terukur, KPI jelas, serta kontrol mutu ketat. Ia cepat memutuskan berdasarkan data, lalu mengomunikasikan arahan dengan efektif saat diperlukan (I), sehingga kebijakan cepat dipahami dan dijalankan.
    `.trim(),
    least: `
Risiko: terkesan dingin/berjarak, micromanagement pada detail, dan rendahnya kepercayaan ke tim. Dampak: buy-in turun, komunikasi satu arah, dan inisiatif tim mandek. Antidot: tetapkan “good enough” & acceptance criteria, lakukan sesi “voice of stakeholder”, delegasikan keputusan operasional melalui RACI, dan gunakan ringkasan 1 halaman agar tetap fokus.
    `.trim(),
    change: `
Dalam perubahan sistem/struktur, ${nickname} unggul bila governance tegas: RFC, RACI, checklist go-live, window perubahan, serta metrik pasca-implementasi (defect, SLA, compliance). Tambahkan paket komunikasi singkat–padat agar ketegasan kualitas tidak mengurangi penerimaan.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |C-D-I|, ${nickname} menegakkan standar akademik tinggi: rubrik presisi, instruksi jelas, dan disiplin konsisten. Ia mampu mengemas alasan kebijakan/penilaian agar diterima siswa/ortu tanpa mengorbankan akurasi.
    `.trim(),
    least: `
Risiko: umpan balik terasa keras, jarak emosional, dan ruang eksplorasi sempit. Penyeimbang: bahasa umpan balik konstruktif, contoh “memadai vs unggul”, serta slot eksplorasi terarah agar motivasi tetap tinggi.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menurunkan kriteria inti, contoh penilaian, dan timeline bertahap; sisipkan komunikasi singkat ke orang tua/siswa untuk mengamankan buy-in tanpa menurunkan standar.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} memimpin RCA tajam, change control ketat, dan verifikasi berbasis bukti. Ia menjaga spesifikasi–dokumentasi presisi dan memastikan “done” benar-benar memenuhi CTQ.
    `.trim(),
    least: `
Risiko: overcontrol, skeptis terhadap input tim, atau menunda rilis menunggu kesempurnaan. Peredam: matriks risiko, timebox analisis, prinsip “fix-now / harden-next”, dan postmortem tanpa menyalahkan untuk menjaga kecepatan belajar.
    `.trim(),
    change: `
Pada migrasi/rekayasa ulang, ${nickname} mengawal RFC, test plan, rollback, canary/blue–green, dan metrik kesehatan. Tambahkan paket komunikasi status ritmik (I) agar lintas fungsi tetap selaras.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menegakkan SOP rinci, checklist lengkap, dan audit disiplin—deviasi kecil segera dikoreksi. Standar area konsisten, temuan ditutup tuntas.
    `.trim(),
    least: `
Risiko: kesan dingin, fokus pada detail minor, moral tim turun. Penyeimbang: CTQ per area, sampling audit (bukan 100%), serta apresiasi perilaku patuh agar ketegasan berbuah motivasi.
    `.trim(),
    change: `
Saat metode/alat baru, ${nickname} menyusun standar kerja terukur, pelatihan singkat, dan evaluasi pasca-implementasi—mulai dari area prioritas lalu skalakan, dengan papan status sederhana untuk transparansi.
    `.trim()
  }
},

CDS: {
  Administrator: {
    most: `
Sebagai |C-D-S|, ${nickname} detail–logis dengan standar tinggi, sekaligus stabil dan dapat diandalkan. Ia menyusun SOP rapi, indikator mutu jelas, dan mengeksekusi konsisten hingga target tercapai—kualitas “benar sejak awal” menjadi ciri khasnya.
    `.trim(),
    least: `
Risiko: analysis paralysis, terlalu kompetitif pada kualitas minor, dan kurang peka pada beban tim. Antidot: timebox analisis, prioritas CTQ vs nice-to-have, jalur sign-off sederhana, dan cadangan waktu untuk kejutan operasional.
    `.trim(),
    change: `
Dalam perubahan, ${nickname} efektif dengan transisi bertahap: RFC, checklist go-live, window perubahan, serta metrik pasca-implementasi. Stabilitas (S) menjaga ritme, ketegasan (D) mengunci tenggat, dan presisi (C) memastikan kepatuhan.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |C-D-S|, ${nickname} menghadirkan kelas sangat terstruktur, rubrik detail, dan ritme belajar stabil. Ia menjaga mutu tinggi sembari konsisten pada tindak lanjut tugas.
    `.trim(),
    least: `
Risiko: perfeksionisme menyempitkan kreativitas, keputusan lambat, dan fokus pada detail non-kritis. Penyeimbang: indikator inti, contoh sederhana, dan slot eksplorasi terarah agar hasil tetap unggul tanpa memperlambat kelas.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyiapkan paket adaptasi lengkap (contoh tugas, rubrik ringkas, jadwal). Jalankan uji coba kecil dan iterasi berdasarkan data hasil belajar.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam peran teknis, ${nickname} kuat pada QA presisi, dokumentasi, dan eksekusi stabil. Ia menjaga reliabilitas dengan kontrol perubahan ketat dan follow-up konsisten.
    `.trim(),
    least: `
Risiko: menunda rilis karena mengejar kesempurnaan, lambat beradaptasi, atau berat melepas cara lama. Peredam: matriks risiko CTQ, kriteria “escalate now”, canary incremental, dan WIP limit.
    `.trim(),
    change: `
Pada migrasi/arsitektur baru, ${nickname} menyusun test plan, rollback, dan metrik kesehatan yang dipantau. Review terjadwal memastikan mutu tanpa mengorbankan roadmap.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} telaten, fokus detail, dan ritme kerja stabil; SOP jelas, inspeksi terukur, dan temuan ditutup tepat waktu. Kualitas area konsisten dan dapat diaudit.
    `.trim(),
    least: `
Risiko: terlalu lama di detail minor, kaku menukar prioritas saat beban puncak. Penyeimbang: CTQ per area, target waktu per segmen, dan sampling audit untuk menjaga throughput.
    `.trim(),
    change: `
Saat metode/alat baru, ${nickname} menggelar pelatihan bertahap, checklist verifikasi, dan evaluasi mingguan. Mulai dari area kunci, ukur temuan & waktu siklus, lalu ekspansi.
    `.trim()
  }
},

CID: {
  Administrator: {
    most: `
Sebagai |C-I-D|, ${nickname} memadukan akurasi kebijakan, komunikasi yang ramah saat diperlukan, dan dorongan penyelesaian tepat waktu. Ia menyukai situasi yang dapat diprediksi, menyiapkan dokumen jelas, dan menjaga mutu konsisten.
    `.trim(),
    least: `
Risiko: perfeksionisme → isolasi kerja, resistensi pada kejutan, atau switching antara relasi & detail sehingga fokus buyar. Antidot: batas WIP, gate prioritas (impact–effort–risk), timebox perencanaan, dan ritme komunikasi yang konsisten.
    `.trim(),
    change: `
Dalam perubahan, ${nickname} efektif bila rencana tanpa kejutan: RFC, panduan/FAQ, jalur umpan balik, serta uji coba kecil. Komunikasikan alasan perubahan secara empatik (I) sambil mengunci CTQ (D/C).
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |C-I-D|, ${nickname} menghadirkan kelas rapi dan adil: rubrik akurat, komunikasi hangat, dan penyelesaian tugas tepat waktu. Ia menjaga mutu sekaligus hubungan baik dengan siswa.
    `.trim(),
    least: `
Risiko: waktu habis pada detail, enggan improvisasi, atau sebaliknya melompat topik karena banyak ide. Penyeimbang: indikator inti, RPP ringkas, jadwal umpan balik tetap, dan blok fokus tanpa distraksi.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyediakan template sederhana, contoh penilaian, dan sosialisasi empatik. Iterasi rubrik berdasarkan bukti belajar awal menjaga ketepatan sekaligus penerimaan.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} unggul di QA/dokumentasi presisi dan koordinasi secukupnya lintas fungsi. Ia mendorong hasil yang benar sejak awal dan nyaman pada lingkungan yang dapat diprediksi.
    `.trim(),
    least: `
Risiko: analisis berlarut, menunda keputusan menunggu kepastian, atau mengisolasi diri untuk “menyempurnakan”. Peredam: buffer estimasi, kriteria “escalate now”, kanban transparan, dan review berpasangan agar progres terjaga.
    `.trim(),
    change: `
Pada perubahan arsitektur, ${nickname} menulis RFC, menyiapkan panduan adopsi, dan memantau metrik kesehatan. Terapkan canary/blue–green serta post-implementation review untuk pembelajaran berkelanjutan.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} ramah seperlunya namun detail: SOP jelas, checklist lengkap, dan kualitas area konsisten. Ia memastikan tugas selesai “benar” dan dapat diaudit.
    `.trim(),
    least: `
Risiko: tenggelam pada detail, lambat berubah saat ritme bergeser, atau bekerja sendiri terlalu lama. Penyeimbang: rute prioritas, target waktu per segmen, audit sampling, dan komunikasi status singkat berkala.
    `.trim(),
    change: `
Saat SOP/alat baru, ${nickname} menyiapkan panduan rinci, pelatihan, dan evaluasi berkala. Mulai dari area prioritas, ukur temuan & waktu siklus, lalu perluas bertahap.
    `.trim()
  }
},
    CIS: {
  Administrator: {
    most: `
Sebagai |C-I-S|, ${nickname} menggabungkan ketepatan (C), komunikasi hangat (I), dan stabilitas proses (S). Ia pencari fakta yang kuat, menyiapkan SOP jelas, dan memastikan semua pihak memahami ekspektasi sebelum mulai. Keputusan diambil setelah data memadai, layanan terasa ramah namun tertib.
    `.trim(),
    least: `
Di bawah tekanan, ${nickname} bisa terlalu peduli pada opini, menunda keputusan hingga data “lengkap”, dan menghindari konfrontasi. Risiko: tempo melambat & pesan tidak tegas. Antidot: decision-rights/RACI tegas, tenggat keputusan, ringkasan 1 halaman berbasis fakta, serta skrip percakapan tegas–empatik.
    `.trim(),
    change: `
Dalam perubahan kebijakan/sistem, ${nickname} efektif sebagai fasilitator: menjelaskan alasan, menyusun panduan rinci/FAQ, dan menjaga ritme adopsi stabil. Gunakan pilot kecil, checklist verifikasi, metrik compliance, serta forum Q&A berkala.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |C-I-S|, ${nickname} menghadirkan kelas hangat, terstruktur, dan adil. Ia menilai berbasis rubrik, komunikatif, serta menjaga stabilitas ritme belajar—membuat siswa paham standar dan merasa dihargai.
    `.trim(),
    least: `
Risiko: terlalu cemas dengan penerimaan sosial, detail administrasi menumpuk, atau keputusan lambat. Penyeimbang: indikator inti pada rubrik, kontrak belajar, batas waktu konsisten, dan bahasa umpan balik spesifik–konstruktif.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyajikan contoh tugas, rubrik baru yang ringkas, dan tahapan adaptasi realistis. Pantau indikator utama agar laju terjaga tanpa mengorbankan rasa aman siswa.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} kuat pada QA/dokumentasi, dukungan pengguna, dan komunikasi yang bersahabat. Ia mengambil keputusan setelah bukti cukup, menjaga SOP dan layanan stabil.
    `.trim(),
    least: `
Risiko: menunda eskalasi demi harmoni, perfeksionisme dokumentasi, atau over-communication yang mengaburkan prioritas. Peredam: kriteria “escalate now”, kanban prioritas CTQ, WIP limit, dan checkpoint QA terjadwal.
    `.trim(),
    change: `
Pada perubahan, ${nickname} menulis panduan praktis, melatih pengguna, dan memantau adopsi. Terapkan change window, checklist verifikasi, serta sampling audit agar kualitas konsisten.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menjaga SOP konsisten, komunikasi ramah, dan rute kerja stabil. Ia menegaskan ekspektasi di awal dan memastikan temuan ditutup rapi.
    `.trim(),
    least: `
Risiko: sulit menegur, fokus pada opini, atau melambat menunggu data lengkap. Penyeimbang: CTQ per area, target waktu per segmen, inspeksi ringan–sering, dan umpan balik tegas–santun.
    `.trim(),
    change: `
Saat SOP/layout baru, ${nickname} melakukan briefing komunikatif, demo lapangan, dan buddy system. Mulai dari area prioritas, ukur compliance & temuan utama, lalu skalakan.
    `.trim()
  }
},

CSD: {
  Administrator: {
    most: `
Sebagai |C-S-D|, ${nickname} sistematis, teliti, dan stabil; ketika target menuntut, ia menutup pekerjaan tepat waktu (D). Ia menyusun SOP rapi, indikator mutu jelas, dan eksekusi konsisten—kualitas “benar sejak awal”.
    `.trim(),
    least: `
Risiko: analysis paralysis, alergi perubahan mendadak, dan tenggelam pada detail minor. Antidot: timebox analisis, prioritas CTQ vs nice-to-have, jalur sign-off sederhana, dan ambang eskalasi untuk blocker.
    `.trim(),
    change: `
Dalam perubahan sistem, ${nickname} efektif jika ada governance tegas: RACI, RFC, checklist go-live, window perubahan, metrik pasca-implementasi. Stabilitas (S) menjaga ritme; ketegasan (D) mengunci tenggat; ketelitian (C) memastikan kepatuhan.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |C-S-D|, ${nickname} menghadirkan kelas sangat terstruktur, rubrik presisi, dan ritme belajar stabil. Ia konsisten menutup tindak lanjut tugas hingga tuntas.
    `.trim(),
    least: `
Risiko: ruang eksplorasi sempit, keputusan lambat, fokus pada detail non-kritis. Penyeimbang: indikator inti, contoh sederhana, dan slot eksplorasi terarah agar kreativitas tetap hidup.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyiapkan paket adaptasi lengkap (contoh tugas, rubrik ringkas, jadwal). Uji coba kecil–iterasi–sebar untuk menjaga mutu tanpa mengacaukan ritme.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam peran teknis, ${nickname} unggul pada QA presisi, dokumentasi, dan kontrol perubahan. Ia menjaga reliabilitas melalui eksekusi stabil dan follow-up konsisten.
    `.trim(),
    least: `
Risiko: lambat beradaptasi, menunda rilis demi kesempurnaan, atau kaku pada prosedur lama. Peredam: matriks risiko CTQ, kriteria “escalate now”, canary incremental, WIP limit, dan review terjadwal.
    `.trim(),
    change: `
Pada migrasi/arsitektur baru, ${nickname} menyusun test plan, rollback, dan metrik kesehatan yang dipantau. Jalankan canary/blue–green dan log keputusan untuk akuntabilitas.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} telaten, fokus detail, dan ritme kerja stabil; SOP jelas, inspeksi terukur, dan temuan ditutup tepat waktu. Kualitas area konsisten dan dapat diaudit.
    `.trim(),
    least: `
Risiko: terlalu lama di detail minor dan sulit menukar prioritas saat beban puncak. Penyeimbang: CTQ per area, target waktu per segmen, rotasi beban, dan sampling audit.
    `.trim(),
    change: `
Saat metode/alat baru, ${nickname} menggelar pelatihan bertahap, checklist verifikasi, dan evaluasi mingguan. Mulai dari area kunci, ukur temuan & waktu siklus, lalu ekspansi.
    `.trim()
  }
},

CSI: {
  Administrator: {
    most: `
Sebagai |C-S-I|, ${nickname} mengutamakan ketepatan standar (C), stabilitas proses (S), dan komunikasi yang hangat (I). Ia pencari fakta yang baik, memastikan ekspektasi jelas, dan menjaga layanan ramah–tertib.
    `.trim(),
    least: `
Risiko: keras pada keputusan yang sudah diambil, menahan konfrontasi, dan cemas pada opini publik internal. Antidot: decision-rights matrix, tenggat keputusan, CTQ yang disepakati, serta forum dengar pendapat terstruktur.
    `.trim(),
    change: `
Dalam perubahan, ${nickname} efektif sebagai fasilitator adopsi: menjelaskan alasan, menyiapkan panduan rinci, dan menjaga ritme. Gunakan pilot, checklist verifikasi, metrik compliance, dan komunikasi ritmik.
    `.trim()
  },
  Guru: {
    most: `
Sebagai guru |C-S-I|, ${nickname} menghadirkan kelas hangat, terstruktur, dan adil. Ia peka pada kebutuhan siswa, menggunakan rubrik jelas, dan memastikan ekspektasi dipahami sebelum proyek dimulai.
    `.trim(),
    least: `
Risiko: keputusan lambat, terlalu memikirkan penerimaan sosial, atau fokus pada detail administrasi. Penyeimbang: indikator inti, kontrak belajar, bahasa umpan balik spesifik–konstruktif, dan batas waktu konsisten.
    `.trim(),
    change: `
Saat kurikulum/asesmen berubah, ${nickname} menyusun contoh tugas, rubrik baru, dan jadwal pelatihan singkat. Adaptasi bertahap dengan pemantauan indikator utama menjaga tempo tanpa mengorbankan rasa aman.
    `.trim()
  },
  "Technical Staff": {
    most: `
Dalam tim teknis, ${nickname} andal pada QA/dokumentasi, layanan pengguna, dan komunikasi yang bersahabat. Ia menjaga SOP konsisten dan mengambil keputusan setelah bukti cukup.
    `.trim(),
    least: `
Risiko: menunda eskalasi demi harmoni, teguh pada keputusan lama walau konteks berubah, atau over-communicate hingga fokus kabur. Peredam: kriteria “escalate now”, kanban prioritas CTQ, WIP limit, dan checkpoint QA terjadwal.
    `.trim(),
    change: `
Pada perubahan, ${nickname} menulis panduan rinci, mengadakan pelatihan komunikatif, dan menjaga ritme transisi. Terapkan change window, checklist verifikasi, serta sampling audit agar kualitas konsisten.
    `.trim()
  },
  Housekeeping: {
    most: `
${nickname} menjaga SOP konsisten, komunikasi ramah, dan rute kerja stabil. Ia memastikan tiap anggota paham standar & ekspektasi sebelum eksekusi; mutu area terjaga.
    `.trim(),
    least: `
Risiko: enggan menegur pelanggaran kecil, sulit mengubah keputusan yang sudah diambil, dan fokus pada opini. Penyeimbang: CTQ per area, inspeksi ringan–sering, target waktu per rute, dan umpan balik tegas–santun.
    `.trim(),
    change: `
Saat SOP/layout baru, ${nickname} melakukan briefing komunikatif, demo lapangan, dan buddy system. Ukur compliance & temuan utama sebelum perluas ke seluruh area.
    `.trim()
  }
},
    C: {
      Administrator: {
        most: `
Sebagai tipe Compliance, ${nickname} sangat teliti dan sistematis dalam pengelolaan data maupun dokumen administrasi. Setiap detail dipastikan benar sebelum proses dilanjutkan. Standar kualitas tinggi dan akurasi menjadi ciri utama kerja ${nickname}, sehingga setiap output administrasi sangat bisa diandalkan, minim kesalahan, dan rapi.
        `.trim(),
        least: `
Kecenderungan untuk terlalu banyak pengecekan atau menunda pengambilan keputusan karena ingin semuanya sempurna, kadang membuat proses kerja menjadi lambat. Untuk meningkatkan efisiensi, ${nickname} perlu menyeimbangkan antara kebutuhan akurasi dan kecepatan, serta belajar mendelegasikan tugas jika perlu.
        `.trim(),
        change: `
Di bawah tekanan, ${nickname} tetap menjaga kualitas hasil kerja, namun kadang menjadi terlalu kaku terhadap standar atau enggan mengambil risiko. Perlu lebih fleksibel dan terbuka pada masukan untuk menciptakan sistem administrasi yang adaptif.
        `.trim()
      },
      Guru: {
        most: `
Sebagai guru tipe Compliance, ${nickname} sangat teliti, terorganisir, dan mampu menyusun rencana pembelajaran serta evaluasi dengan sistematis. Semua administrasi kelas tersusun rapi dan setiap progres siswa terpantau jelas. ${nickname} sangat memperhatikan detail, sehingga kualitas pembelajaran dan penilaian selalu terjaga tinggi.
        `.trim(),
        least: `
Terkadang, ${nickname} bisa terlalu kaku atau perfeksionis, membuat suasana kelas menjadi kurang dinamis dan siswa kurang bebas mengekspresikan kreativitas. Untuk menciptakan lingkungan belajar yang lebih hidup, ${nickname} perlu melonggarkan standar sesekali dan memberi ruang untuk eksperimen.
        `.trim(),
        change: `
Ketika beban kerja meningkat, ${nickname} tetap menjaga kualitas pembelajaran, namun penting untuk lebih fleksibel dan menyesuaikan pendekatan sesuai kebutuhan masing-masing siswa agar perkembangan akademik lebih merata.
        `.trim()
      },
      "Technical Staff": {
        most: `
Sebagai tenaga teknis Compliance, ${nickname} sangat analitis dan detail dalam menyelesaikan setiap masalah teknis. Tidak ada hal kecil yang terlewat dari pengamatan dan penanganan ${nickname}, sehingga hasil kerja teknis selalu aman, rapi, dan berkualitas tinggi.
        `.trim(),
        least: `
Kecenderungan perfeksionis terkadang membuat troubleshooting berjalan lebih lama dan solusi teknis menjadi kurang praktis. Untuk mengimbangi, ${nickname} perlu belajar mengatur prioritas, membedakan antara detail penting dan minor, serta meningkatkan efisiensi dalam penyelesaian masalah.
        `.trim(),
        change: `
Dalam kondisi tertekan atau terjadi kendala mendadak, ${nickname} tetap menjaga kualitas dan keamanan kerja. Namun, peningkatan efisiensi serta kemampuan mengatur waktu sangat penting agar proses kerja teknis tetap berjalan optimal di segala situasi.
        `.trim()
      },
      Housekeeping: {
        most: `
Sebagai tipe Compliance di Housekeeping, ${nickname} sangat teliti, rapi, dan disiplin dalam memastikan seluruh area bersih sesuai standar tertinggi. Setiap prosedur dijalankan dengan hati-hati, tidak mudah melewatkan detail sekecil apapun, dan selalu melakukan pengecekan ulang sebelum meninggalkan area kerja. Sikap profesional dan penuh tanggung jawab menjadikan ${nickname} pilar utama dalam menjaga reputasi layanan Housekeeping.
        `.trim(),
        least: `
Kecenderungan terlalu fokus pada detail kecil kadang membuat efisiensi kerja tim menjadi menurun, karena terlalu banyak waktu terbuang pada pengecekan minor. Untuk itu, ${nickname} perlu belajar memperhatikan keseimbangan antara kualitas dan efisiensi, serta mempercayakan tugas-tugas ringan pada anggota tim lain agar target tercapai lebih efektif.
        `.trim(),
        change: `
Ketika tekanan kerja meningkat atau harus mengerjakan banyak area sekaligus, ${nickname} tetap menjaga standar kebersihan dan teliti pada detail. Namun, harus diingat agar tidak terlalu terpaku pada standar pribadi sehingga menghambat kecepatan kerja tim secara keseluruhan.
        `.trim()
      }
    },
            CS: {
  Administrator: {
    most: `
Tidak basa-basi dan tegas, |D-I| ${nickname} adalah individualis yang kuat dengan visi jauh ke depan, progresif, dan siap berkompetisi untuk mencapai sasaran. ${nickname} selalu ingin tahu dengan cakupan minat yang luas. Dalam memecahkan masalah, ia logis, kritis, tajam, dan kerap imajinatif. ${nickname} memiliki kemampuan kepemimpinan yang baik; pada konteks administrasi, patokan D mendorong kecepatan keputusan, dorongan kontrol, dan eksekusi, sementara unsur I memperluas pengaruh dan jaringan untuk menggerakkan tim.
    `.trim(),
    least: `
Pada grafik Least, fokus tugas dan standar tinggi ${nickname} dapat membuatnya tampak keras kepala atau dingin; orientasi target cenderung melebihi orientasi pada relasi. ${nickname} mencanangkan standar tinggi untuk diri dan orang di sekitarnya, dan menjadi sangat kritis ketika standar tidak tercapai. Risiko: perfeksionisme, toleransi rendah pada ambiguitas, serta kecenderungan mengambil alih otoritas. Antidot: kalibrasi ekspektasi, aktifkan sisi I untuk komunikasi empatik dan membangun buy-in.
    `.trim(),
    change: `
Dalam menghadapi deadline atau perubahan sistem, patokan D membuat ${nickname} menjaga arah, mengambil keputusan cepat, menuntut otoritas yang jelas, dan menyukai tugas-tugas baru. Tantangan: mengelola impatience tanpa menurunkan akurasi. Strategi: gunakan pengaruh I untuk mobilisasi lintas fungsi, klarifikasi peran/otoritas, dan tetapkan cek-poin kualitas agar standar tetap tercapai meski bergerak cepat.
    `.trim()
  },
      Guru: {
    most: `
Tidak basa-basi dan tegas, |D-I| ${nickname} memimpin kelas dengan arah yang jelas dan ritme cepat. Ia berpandangan jauh ke depan dalam merancang pembelajaran, berani menetapkan target capaian, dan menuntut standar disiplin yang tinggi. Saat mengajar, patokan D mendorong keputusan cepat dan eksekusi, sementara unsur I membuat ${nickname} komunikatif, mampu memobilisasi antusiasme siswa, dan menyampaikan materi secara persuasif.
    `.trim(),
    least: `
Pada grafik Least, orientasi tugas dan standar tinggi ${nickname} bisa membuatnya tampak kaku, terlalu menekan, atau kurang peka terhadap dinamika emosi siswa. Risiko: ceramah satu arah, toleransi rendah pada keterlambatan/ketidakteraturan, serta kritik yang terasa tajam. Antidot: aktifkan sisi I—variasikan metode, gunakan penguatan positif, dan lakukan check-in singkat agar engagement terjaga tanpa menurunkan standar.
    `.trim(),
    change: `
Saat tekanan (ujian/proyek/insiden kelas), patokan D membuat ${nickname} menjaga arah, mengambil keputusan cepat, dan menegaskan batas. Tantangannya: mengelola impatience sambil menjaga akurasi asesmen. Strategi: rencana kontinjensi, aturan main yang diperjelas di awal, timebox aktivitas, serta ritual umpan balik singkat agar kelas tetap terkendali sekaligus termotivasi.
    `.trim()
  },

  "Technical Staff": {
    most: `
Tidak basa-basi dan tegas, |D-I| ${nickname} unggul dalam troubleshooting cepat, pemetaan prioritas tiket, dan pendorong pencapaian SLA. Patokan D menonjol pada keputusan teknis yang cepat dan eksekusi berani; unsur I membantu ${nickname} berkoordinasi lintas tim, menggalang dukungan, dan mengkomunikasikan update dengan jelas. Hasilnya: perbaikan lebih cepat, antrian tertata, dan inisiatif peningkatan sistem berjalan.
    `.trim(),
    least: `
Pada grafik Least, fokus target dan standar tinggi dapat mendorong ${nickname} cenderung mem-bypass prosedur, menekan timeline secara agresif, atau tampak kurang sabar terhadap ambiguitas/ketidakpastian akar masalah. Risiko: regresi kualitas, gesekan dengan QA/ops. Antidot: aktifkan sisi I untuk kolaborasi—sinkronisasi singkat sebelum eksekusi, transparansi perubahan, dan pencarian buy-in dari stakeholder kunci.
    `.trim(),
    change: `
Di bawah tekanan incident/outage, patokan D membuat ${nickname} mengambil alih komando, menentukan prioritas, dan mengeksekusi mitigasi cepat. Tantangan: menjaga disiplin prosedur dan dokumentasi. Strategi: war-room terstruktur, patuhi runbook, update status berkala, checklist pasca-aksi, serta postmortem singkat agar pemulihan cepat tanpa mengorbankan pembelajaran.
    `.trim()
  },

  Housekeeping: {
    most: `
Tidak basa-basi dan tegas, |D-I| ${nickname} menetapkan standar kebersihan tinggi, mempercepat turnaround kamar/area, dan memastikan inspeksi berjalan disiplin. Patokan D menonjol pada ketegasan SOP dan target harian; unsur I membuat ${nickname} mampu memotivasi tim, membangun semangat, serta tetap ramah saat berinteraksi dengan penghuni/tamu internal.
    `.trim(),
    least: `
Pada grafik Least, orientasi target bisa membuat ${nickname} tampak terlalu menekan, detail berlebihan, atau dingin dalam komunikasi saat beban puncak. Risiko: kelelahan tim, kualitas menurun karena terburu-buru. Antidot: aktifkan sisi I—briefing apresiatif, pembagian beban yang proporsional, dan umpan balik singkat yang mendorong perbaikan tanpa menjatuhkan moral.
    `.trim(),
    change: `
Saat okupansi tinggi/audit/keluhan mendesak, patokan D mendorong ${nickname} cepat mengalokasikan ulang personel, memrioritaskan area lalu lintas tinggi, dan menegaskan standar inspeksi. Strategi: zoning tugas, checklist cepat, eskalasi jalur jelas, serta koordinasi dengan Front Office/Engineering agar waktu respons singkat tetap sejalan dengan kualitas.
    `.trim()
  }
    }
  };

  // Multi-level safe access with fallback
  const getImplicationText = (key) => {
    return implications[key]?.[pos]?.[graphType] || null;
  };

  // Try primary combination
  let txt = getImplicationText(key);
  
  // Fallback to first letter if combination not found
  if (!txt && key.length > 0) {
    const primaryType = key[0];
    txt = getImplicationText(primaryType);
  }

  if (txt) return txt.replace(/\$\{nickname\}/g, nickname);
  return "Deskripsi implikasi khusus untuk posisi ini belum tersedia.";
}


// ========== PAPI ==========
if (appState.completed.PAPI) {
      ySection += 8;
      if (ySection > 265) { doc.addPage(); ySection = 20; }
  
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('JAWABAN TES PAPI', 105, ySection, { align: 'center' });
      ySection += 7;
  
      doc.setFontSize(7.2);
      doc.setFont(undefined, 'normal');
  
      const kolom = 18, baris = 5;
      const xStart = 17;
      const kolGap = 10;
  
      for (let i = 0; i < baris; i++) {
        let x = xStart;
        for (let j = 0; j < kolom; j++) {
          const idx = i + j * baris;
          if (idx < appState.answers.PAPI.length) {
            const ans = appState.answers.PAPI[idx];
            const txt = `${String(idx + 1).padStart(2, '0')}.${ans.answer || '-'}`;
            doc.text(txt, x, ySection);
            x += kolGap;
          }
        }
        ySection += 3.1;
        if (ySection > 275) { doc.addPage(); ySection = 22; }
      }
  
      ySection += 3;
      if (ySection > 265) { doc.addPage(); ySection = 20; }
  
      // SKOR PAPI
      doc.setFont(undefined, 'bold');
      doc.text('Skor PAPI:', 25, ySection);
      ySection += 2.2;
      doc.setFont(undefined, 'normal');
  
      function gabungSkorKelompok() {
        const bagian = [
          ['Arah Kerja',      appState.skorPAPIArahKerja],
          ['Kepemimpinan',    appState.skorPAPIKepemimpinan],
          ['Aktivitas',       appState.skorPAPIAktivitas],
          ['Pergaulan',       appState.skorPAPIPergaulan],
          ['Gaya Kerja',      appState.skorPAPIGayaKerja],
          ['Sifat',           appState.skorPAPISifat],
          ['Ketaatan',        appState.skorPAPIKetaatan]
        ];
        return bagian.map(([judul, obj]) => {
          if (!obj) return '';
          const skor = Object.entries(obj).map(([k, v]) => `${k}=${v}`).join(' | ');
          return `${judul}: ${skor}`;
        });
      }
  
      const skorKelompokArr = gabungSkorKelompok();
      const MAX_KOLOM_PER_BARIS = 3;
  
      for (let i = 0; i < skorKelompokArr.length; i += MAX_KOLOM_PER_BARIS) {
        const slice = skorKelompokArr.slice(i, i + MAX_KOLOM_PER_BARIS).join('   |   ');
        doc.text(slice, 25, ySection);
        ySection += 2.3;
        if (ySection > 265) { doc.addPage(); ySection = 20; }
      }
  
      /* =========================================================
         RANGKUMAN SKOR & INTERPRETASI PAPI
         ========================================================= */
      ySection += 4;
      if (ySection > 265) { doc.addPage(); ySection = 20; }
  
      doc.setFont(undefined, 'bold');
      doc.text('Rangkuman Skor dan Deskripsi:', 25, ySection);
      ySection += 3;
      doc.setFont(undefined, 'normal');
  
      // Rangkuman menggunakan kamusPAPI (dari data/papi-kamus.js)
      const urutanPAPI = [
        'N','G','A','L','P','I','T','V',
        'X','S','B','O','R','D','C',
        'Z','E','K','F','W'
      ];
  
      const allScores = {
        ...appState.skorPAPIArahKerja,
        ...appState.skorPAPIKepemimpinan,
        ...appState.skorPAPIAktivitas,
        ...appState.skorPAPIPergaulan,
        ...appState.skorPAPIGayaKerja,
        ...appState.skorPAPISifat,
        ...appState.skorPAPIKetaatan
      };
  
      const entries = urutanPAPI.map(kode => [kode, allScores[kode]]).filter(([k, v]) => v !== undefined);
  
      function hitungTinggiKolom(pasangan, fontSize = 6.2) {
        let totalY = 0;
        pasangan.forEach(([kode, nilai]) => {
          if (nilai == null) return;
          const interpretasi = getInterpretasiPAPI(kode, nilai);
          const lines = doc.splitTextToSize(interpretasi, 72);
          totalY += 4.6 + (lines.length - 1) * 2.3;
        });
        return totalY;
      }
  
      function drawKolom(pasangan, xStart, yStart) {
        let y = yStart;
        pasangan.forEach(([kode, nilai]) => {
          if (nilai == null) return;
          doc.setFont(undefined, 'bold');
          doc.text(`${kode} = ${nilai}`, xStart, y);
          doc.setFont(undefined, 'normal');
          const interpretasi = getInterpretasiPAPI(kode, nilai);
          const lines = doc.splitTextToSize(interpretasi, 72);
          lines.forEach((line, i) => {
            doc.text(line, xStart + 12, y + (i * 2.3));
          });
          y += 4.6 + (lines.length - 1) * 2.3;
          if (y > 265) { doc.addPage(); y = 20; }
        });
        return y;
      }
  
      const nHalf = Math.ceil(entries.length / 2);
      const kolomKiri = entries.slice(0, nHalf);
      const kolomKanan = entries.slice(nHalf);
  
      const tinggiKiri = hitungTinggiKolom(kolomKiri);
      const tinggiKanan = hitungTinggiKolom(kolomKanan);
      const tinggiMax = Math.max(tinggiKiri, tinggiKanan);
  
      if (ySection + tinggiMax > 275) {
        doc.addPage();
        ySection = 20;
      }
  
      doc.setFontSize(6.2);
      const yL = drawKolom(kolomKiri, 25, ySection);
      const yR = drawKolom(kolomKanan, 112, ySection);
      ySection = Math.max(yL, yR) + 6;
  
      /* =========================================================
         ANALISIS KECOCOKAN POSISI PAPI
         ========================================================= */
      const posisi = appState.identity?.position || "Unknown";
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.text(`Analisis Kecocokan untuk Posisi: ${posisi}`, 25, ySection);
      ySection += 3;
      doc.setFont(undefined, 'normal');
  
      const nama = appState.identity?.name || "Kandidat";
      const hasilAnalisisDetail = analisisKecocokanPAPIDetail(allScores, posisi, nama);
  
      doc.setFontSize(8.5);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(61, 131, 223);
      doc.text(`Analisis Kecocokan untuk Posisi: ${posisi}`, 20, ySection);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      ySection += 4;
  
      hasilAnalisisDetail.split('\n').forEach(baris => {
        const wrapLines = doc.splitTextToSize(baris, 160);
        wrapLines.forEach(wrapLine => {
          if (ySection > 275) { doc.addPage(); ySection = 20; }
          const xPos = (baris.startsWith('-') || baris.startsWith('*')) ? 27 : 20;
          doc.text(wrapLine, xPos, ySection);
          ySection += 3;
        });
      });
      ySection += 5;
    }
  
    /* ============================================================
       BIG FIVE
       ============================================================ */
    if (appState.completed.BIGFIVE) {
      ySection += 6;
      if (ySection > 265) { doc.addPage(); ySection = 20; }
  
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Tes Big Five', 105, ySection, { align: 'center' });
      ySection += 4;
  
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.text('Jawaban:', 20, ySection);
      ySection += 3;
  
      const total = tests.BIGFIVE.questions.length;
      const col_x = [18, 63, 108, 153];
      const rowsPerCol = Math.ceil(total / 4);
  
      let row = 0, col = 0, maxRow = 0;
  
      for (let i = 0; i < total; i++) {
        if ((ySection + row * 3) > 275) {
          doc.addPage();
          ySection = 22;
          row = 0;
          col++;
          if (col > 3) { col = 0; }
        }
        if (row >= rowsPerCol) { row = 0; col++; }
        if (col > 3) { doc.addPage(); ySection = 22; col = 0; row = 0; }
  
        const ans = appState.answers.BIGFIVE[i];
        let jawaban = "Tidak dijawab";
  
        if (typeof ans === 'number' && ans > 0) {
          if (ans === 1)      jawaban = "1 (Sangat Tidak Sesuai)";
          else if (ans === 2) jawaban = "2 (Tidak Sesuai)";
          else if (ans === 3) jawaban = "3 (Netral)";
          else if (ans === 4) jawaban = "4 (Sesuai)";
          else if (ans === 5) jawaban = "5 (Sangat Sesuai)";
          else                jawaban = ans.toString();
        }
  
        doc.text(
          `${(i + 1).toString().padStart(3, '0')}. ${jawaban}`,
          col_x[col], ySection + row * 3
        );
  
        row++;
        maxRow = Math.max(maxRow, row);
      }
  
      ySection += maxRow * 3 + 3;
  
      /* Ringkasan OCEAN */
      if (appState.hasilOCEAN) {
        if (ySection > 255) { doc.addPage(); ySection = 20; }
  
        doc.setFont(undefined, 'bold');
        doc.text('Ringkasan Hasil OCEAN:', 20, ySection);
        ySection += 3;
        doc.setFont(undefined, 'normal');
  
        Object.entries(appState.hasilOCEAN).forEach(([dim, val]) => {
          if (ySection > 280) { doc.addPage(); ySection = 20; }
  
          const splitText = doc.splitTextToSize(
            `${val.name.padEnd(15)} | Skor: ${val.percent.toString().padStart(2, ' ')}% | ${val.desc}`,
            170
          );
  
          splitText.forEach(part => {
            if (ySection > 280) { doc.addPage(); ySection = 20; }
            doc.text(part, 25, ySection);
            ySection += 3.1;
          });
        });
        ySection += 2;
      }
  
      /* Tabel Kecocokan OCEAN */
      if (appState.hasilOCEAN && appState.identity && appState.identity.position) {
        let posisiKey = appState.identity.position;
        if (posisiKey === "Dosen/Guru" && appState.identity.teacherLevel && bigFivePositionAnalysis[appState.identity.teacherLevel]) {
          posisiKey = appState.identity.teacherLevel;
        }
        if (posisiKey === "Technical Staff" && appState.identity.techRole && bigFivePositionAnalysis[appState.identity.techRole]) {
          posisiKey = appState.identity.techRole;
        }
  
        const aspekList = ['O', 'C', 'E', 'A', 'N'];
        const aspekLabel = {
          O: 'Openness',
          C: 'Conscientiousness',
          E: 'Extraversion',
          A: 'Agreeableness',
          N: 'Neuroticism'
        };
  
        let aspekHasil = [];
  
        if (ySection > 250) { doc.addPage(); ySection = 20; }
  
        doc.setFont(undefined, 'bold');
        doc.text("Tabel Kecocokan Big Five dengan Posisi:", 20, ySection);
        ySection += 3;
  
        doc.setFont(undefined, 'normal');
        doc.text("Aspek             | Skor (%) | Kecocokan", 25, ySection);
        ySection += 3;
  
        aspekList.forEach(dim => {
          const val = appState.hasilOCEAN[dim];
          if (!val) return;
  
          let label = getBigFiveSuitabilityLabel(val.percent, dim);
          aspekHasil.push({ dim, label, percent: val.percent });
  
          let line = `${aspekLabel[dim].padEnd(15)} | ${val.percent.toString().padStart(3)}%    | ${label}`;
          doc.text(line, 25, ySection);
          ySection += 2.6;
        });
        ySection += 1.8;
  
        const count = { 'Cocok sekali': 0, 'Cocok': 0, 'Kurang cocok': 0, 'Tidak cocok': 0 };
        aspekHasil.forEach(a => count[a.label]++);
  
        let urutan = ["Tidak cocok", "Kurang cocok", "Cocok", "Cocok sekali"];
        let overall = urutan.find(label => count[label] === Math.max(...Object.values(count))) || "Kurang cocok";
  
        doc.setFont(undefined, 'bold');
        doc.text("Kesimpulan Akhir Kecocokan:", 25, ySection);
        ySection += 2.7;
  
        doc.setFont(undefined, 'normal');
        doc.text(`${overall.toUpperCase()}`, 90, ySection - 0.2);
  
        const strongest = aspekHasil.filter(a => a.label === "Cocok sekali" || a.label === "Cocok").sort((a, b) => b.percent - a.percent)[0];
        const weakest = aspekHasil.filter(a => a.label === "Tidak cocok" || a.label === "Kurang cocok").sort((a, b) => a.percent - b.percent)[0];
  
        ySection += 2.6;
        doc.setFont(undefined, 'bold');
        doc.text("Alasan:", 25, ySection);
        ySection += 2.2;
        doc.setFont(undefined, 'normal');
  
        let alasan;
        if (overall === "Cocok sekali") {
          alasan = `Seluruh aspek kepribadian kandidat sangat sesuai dengan tuntutan posisi. Aspek paling menonjol adalah ${strongest ? aspekLabel[strongest.dim] + " (" + strongest.percent + "%)" : "-"}, yang menjadi kekuatan utama dalam menunjang kinerja dan adaptasi pada posisi ini. Tidak ditemukan aspek yang menghambat secara signifikan.`;
        } else if (overall === "Cocok") {
          alasan = `Sebagian besar aspek kepribadian kandidat sesuai dengan tuntutan posisi. Aspek yang paling mendukung adalah ${strongest ? aspekLabel[strongest.dim] + " (" + strongest.percent + "%)" : "-"}, yang sangat menunjang kebutuhan utama pada posisi ini. Namun, terdapat beberapa aspek yang perlu dikembangkan, yaitu ${weakest ? aspekLabel[weakest.dim] + " (" + weakest.percent + "%)" : "-"}, agar kinerja dan adaptasi kandidat dapat semakin optimal.`;
        } else if (overall === "Kurang cocok") {
          alasan = `Beberapa aspek kepribadian kandidat belum memenuhi kriteria utama posisi ini, terutama pada aspek ${weakest ? aspekLabel[weakest.dim] + " (" + weakest.percent + "%)" : "-"} yang menjadi area penghambat utama. Penguatan pada aspek ini sangat disarankan agar kandidat dapat menyesuaikan diri secara lebih efektif. Meski demikian, ada pula aspek yang sudah sesuai yaitu ${strongest ? aspekLabel[strongest.dim] + " (" + strongest.percent + "%)" : "-"}, yang dapat dijadikan modal awal pengembangan.`;
        } else {
          alasan = `Sebagian besar aspek kepribadian kandidat tidak sesuai dengan tuntutan posisi, terutama pada aspek ${weakest ? aspekLabel[weakest.dim] + " (" + weakest.percent + "%)" : "-"}, yang berpotensi menjadi hambatan besar dalam pelaksanaan tugas. Diperlukan pengembangan menyeluruh dan penyesuaian pada hampir seluruh aspek agar dapat mencapai kecocokan yang dibutuhkan pada posisi ini.`;
        }
  
        const alasanLines = doc.splitTextToSize(alasan, 170);
        alasanLines.forEach(line => {
          if (ySection > 280) { doc.addPage(); ySection = 20; }
          doc.text(line, 25, ySection);
          ySection += 2.7;
        });
        ySection += 2.5;
      }
  
      /* Analisa Kepribadian & Kecocokan Posisi */
      if (appState.identity && appState.identity.position) {
        let posisiKey = appState.identity.position;
        if (posisiKey === "Dosen/Guru" && appState.identity.teacherLevel && bigFivePositionAnalysis[appState.identity.teacherLevel]) {
          posisiKey = appState.identity.teacherLevel;
        }
        if (posisiKey === "Technical Staff" && appState.identity.techRole && bigFivePositionAnalysis[appState.identity.techRole]) {
          posisiKey = appState.identity.techRole;
        }
  
        const analisa = bigFivePositionAnalysis[posisiKey];
        if (analisa && analisa.length > 0) {
          if (ySection > 255) { doc.addPage(); ySection = 20; }
          doc.setFont(undefined, 'normal');
  
          analisa.forEach(line => {
            const splitText = doc.splitTextToSize(line, 170);
            splitText.forEach(part => {
              if (ySection > 280) { doc.addPage(); ySection = 20; }
              doc.text(part, 25, ySection);
              ySection += 3.3;
            });
          });
          ySection += 2;
        }
      }
    }
  
    /* ============================================================
       GRAFIS
       ============================================================ */
if (appState.completed.GRAFIS && appState.grafis) {
  const grafisKeys = ["orang", "rumah", "pohon"];

  for (const key of grafisKeys) {
    if (appState.grafis[key]) {
      // ↓ KOMPRES GAMBAR DULU sebelum masuk PDF
      const compressedImg = await __compressImageForPDF(appState.grafis[key], 1200, 0.6);

      await new Promise(resolve => {
        doc.addPage();
        const img = new window.Image();

        img.onload = function () {
          const pxToMm = px => px * 0.264583;
          const pageW = doc.internal.pageSize.getWidth();
          const pageH = doc.internal.pageSize.getHeight();

          let imgWmm = pxToMm(img.naturalWidth);
          let imgHmm = pxToMm(img.naturalHeight);

          const scale = Math.min(pageW / imgWmm, pageH / imgHmm);
          imgWmm *= scale;
          imgHmm *= scale;

          const x = (pageW - imgWmm) / 2;
          const y = (pageH - imgHmm) / 2;

          doc.addImage(compressedImg, 'JPEG', x, y, imgWmm, imgHmm);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = compressedImg;
      });
    }
  }

  doc.addPage();
  ySection = 25;
}
  
    /* ============================================================
       EXCEL
       ============================================================ */
    if (appState.completed.EXCEL && appState.adminAnswers && appState.adminAnswers.EXCEL && appState.adminAnswers.EXCEL.link) {
      ySection += 5;
      if (ySection > 260) { doc.addPage(); ySection = 25; }
  
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text('Tes Admin: Excel/Spreadsheet', 20, ySection);
      ySection += 4;
  
      doc.setFont(undefined, 'normal');
      doc.setTextColor(33, 77, 170);
  
      const link = appState.adminAnswers.EXCEL.link;
      const wrapLink = doc.splitTextToSize(link, 160);
      doc.text('Link Google Sheet Jawaban:', 24, ySection);
      ySection += 4;
      doc.text(wrapLink, 24, ySection);
      ySection += 6;
      doc.setTextColor(44, 62, 80);
  
      if (ySection > 260) { doc.addPage(); ySection = 25; }
    }
  
    /* ============================================================
       TYPING
       ============================================================ */
    if (appState.completed.TYPING && appState.answers.TYPING) {
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text('Tes Mengetik', 20, ySection);
      ySection += 4;
  
      doc.setFont(undefined, 'normal');
      doc.setTextColor(44, 62, 80);
  
      const typing = appState.answers.TYPING;
      doc.text(`Karakter benar     : ${typing.benar}`, 24, ySection);  ySection += 4;
      doc.text(`Karakter salah     : ${typing.salah}`, 24, ySection);  ySection += 4;
      doc.text(`Belum diketik      : ${typing.belum}`, 24, ySection);  ySection += 4;
      doc.text(`Akurasi            : ${typing.accuracy}%`, 24, ySection); ySection += 4;
      doc.text(`Kecepatan          : ${typing.wpm} kata/menit (WPM)`, 24, ySection); ySection += 4;
      doc.text(`Waktu digunakan    : ${typing.waktu} detik`, 24, ySection); ySection += 4;
      doc.text(`Teks hasil ketik:`, 24, ySection); ySection += 4;
  
      const typedText = typing.text ? typing.text.replace(/\n/g, " ") : "";
      const wrapTyping = doc.splitTextToSize(typedText, 160);
      doc.text(wrapTyping, 28, ySection);
      ySection += 4 + wrapTyping.length * 4;
  
      if (ySection > 260) { doc.addPage(); ySection = 25; }
      doc.setTextColor(44, 62, 80);
    }
  
    /* ============================================================
       SUBJECT (upload jawaban)
       ============================================================ */
if (
  appState.completed &&
  appState.completed.SUBJECT &&
  Array.isArray(appState.subjectUpload) &&
  appState.subjectUpload.length > 0
) {
  for (let i = 0; i < appState.subjectUpload.length; i++) {
    // ↓ KOMPRES GAMBAR DULU
    const compressedImg = await __compressImageForPDF(appState.subjectUpload[i], 1400, 0.6);

    await new Promise(resolve => {
      doc.addPage();
      const img = new window.Image();

      img.onload = function () {
        const pxToMm = px => px * 0.264583;
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();

        let imgWmm = pxToMm(img.naturalWidth);
        let imgHmm = pxToMm(img.naturalHeight);

        const scale = Math.min(pageW / imgWmm, pageH / imgHmm, 1);
        imgWmm *= scale;
        imgHmm *= scale;

        const x = (pageW - imgWmm) / 2;
        const y = (pageH - imgHmm) / 2;

        doc.addImage(compressedImg, 'JPEG', x, y, imgWmm, imgHmm);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = compressedImg;
    });
  }
  doc.addPage();
  ySection = 25;
}
  
    /* ============================================================
       FOOTER TANDA TANGAN
       ============================================================ */
    let footerY = 285;
    if (ySection > 245) { doc.addPage(); footerY = 285; }
  
    const footerX = pageWidth - 20;
  
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('TESTER,', footerX, footerY - 36, { align: "right" });
  
    doc.setFont(undefined, 'normal');
    doc.text('Deni Pragas Septian Pratama', footerX, footerY - 12, { align: "right" });
    doc.text('Human Capital Recruitment Staff', footerX, footerY - 6, { align: "right" });
    doc.text('Sugar Group Schools', footerX, footerY, { align: "right" });
  
    /* ============================================================
       WATERMARK
       ============================================================ */
    addDiagonalWatermark(doc, 'SANGAT RAHASIA', -35, {
      centerYOffset: 60,
      centerXOffset: 15,
      color: [200, 20, 20],
      opacity: 0.10,
      blur: true,
      blurOpacity: 0.05,
      blurPasses: 4,
      blurRadius: 0.8
    });
  
     /* ============================================================
       RETURN BLOB (bukan simpan ke file)
       ============================================================ */
    let namaFile = ((typeof id === 'object' && id && id.name) ? id.name : "Peserta")
      .replace(/[^a-zA-Z0-9]/g, "-") + "-Psikotes-SGSchools.pdf";

    const blob = doc.output('blob');

    return {
      blob: blob,
      filename: namaFile,
      size: blob.size,
      password: _pdfPassword  // ← TAMBAHAN
    };
  }
  
  /* ============================================================
     FUNGSI YANG PERLU DI-LOAD SEBELUM generatePDF() DIPANGGIL
     ============================================================
     Beberapa fungsi berikut WAJIB ADA (bisa di file terpisah):
     
     📁 js/data/ist-norms.js:
        - IST_NORMS, SW_TABLE, SW_BANDS_RAW, SW_GE_EXT, SW_CODES
        - TOTAL_SW_BY_AGE, buildSWSteps, pickTotalSWAgeBand
        - getTotalSWFromRW, IQ_BY_SW, getIQFromSW, iqCategory
        - IST_DESCRIPTIONS, GE_SCORING, RA_KEYS, ZR_KEYS
     
     📁 js/data/bigfive-position-analysis.js:
        - bigFivePositionAnalysis (objek besar)
        - getBigFiveSuitabilityLabel
        - analisaBigFiveSuitability
        - koreksiBigFive
     
     📁 js/data/disc-implications.js:
        - getImplication (objek besar)
        - getCompatibilityReason
        - getStrengthArea, getDevelopmentArea
        - formatBulletPoints
     
     📁 js/tests/ist.js:
        - applyAllKeysIntoQuestions
        - computeISTPerSubtestScores
        - renderISTSummaryToPDF
        - renderISTScoresToPDF
        - renderISTIQToPDF
        - renderISTDescriptionsToPDF
        - renderISTThinkingDimensionToPDF
        - renderISTSWChartToPDF
        - renderISTMWAnalysisToPDF
        - computeDominasi
        - drawSWLineChart
        - letterCategoryFromSw
        - computeGuruFitLetter, computeITStaffFitLetter
        - buildGuruReasons, buildITStaffReasons
        - swCategory5
        - getAgeYearsForNorms
        - clampMin21
        - pctToSWStanine, convertRWtoSW, stanineToSWx
        - defaultMaxByCode
        - getSubtestCode
        - normText
        - rwToIndex0_20, rwToSW_ViaTable
     
     📁 js/tests/kraeplin.js:
        - renderKraeplinChartToPDF
        - analyzeKraeplin
        - generateKraeplinReport
        - kraeplinKategori
     
     📁 js/tests/disc.js:
        - countDISC, analisa2DominanDISC, drawDISCClassic
        - getPixelY, getMidline, getDominantByMidline
        - getFullDISCAnalysisHTML, stripHTML
     
     📁 js/data/papi-kamus.js:
        - kamusPAPI, mappingPAPI
        - getInterpretasiPAPI
        - analisisKecocokanPAPI, analisisKecocokanPAPIDetail
        - generateAnalisaPAPI
        - skorPAPIArahKerja, skorPAPIKepemimpinan, skorPAPIAktivitas,
          skorPAPIPergaulan, skorPAPIGayaKerja, skorPAPISifat, skorPAPIKetaatan
     
     📁 js/data/disc-roles.js:
        - DISC_ROLES_MAP
     ============================================================ */
  /* ============================================================
   GENERATE PDF BLOB — return Blob + metadata
   Dipakai oleh 07-download.js untuk upload ke Google Drive
   ============================================================ */
async function generatePDFBlob() {
  return await generatePDF();
}
window.generatePDFBlob = generatePDFBlob;

console.log('[PDF] ✓ generatePDFBlob ready');
  console.log('[CORE-PDF] ✓ Loaded');
