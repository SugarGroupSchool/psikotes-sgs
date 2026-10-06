/* =========================================================
   js/core/pdf/00-helpers.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — 2026-10-06
   
   Semua helper tersedia sebagai:
   - Global function (backward compat)
   - window.PDF_HELPERS.<name>
   ========================================================= */

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
  
 function blokHeading(doc, title, rgb, x, y) {
  // 🔒 I5 FIX: Hapus parameter w & h yang tidak dipakai
  rgb = rgb || [44, 62, 80];
  doc.setFontSize(9);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text(String(title || ''), x || 16, y + 6);
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


/* ============================================================
   EXPORT ke window.PDF_HELPERS
   ============================================================ */
window.PDF_HELPERS = {
  setCharSpaceSafe,
  normalizeSpaces,
  sanitizePDFText,
  safeStr,
  textSafe,
  encodeScoreCode,
  decodeScoreCode,
  toNumFlexible,
  ensurePage,
  ensureSpace,
  setTypewriter,
  blokHeading,
  drawLabelValueFix,
  printLineWrap,
  addDiagonalWatermark,
  __compressImageForPDF,
  Y_MAX: typeof Y_MAX !== 'undefined' ? Y_MAX : 280,
  Y_PB:  typeof Y_PB  !== 'undefined' ? Y_PB  : 265
};

console.log('[PDF-HELPERS] ✓ Loaded — ' + Object.keys(window.PDF_HELPERS).length + ' items');
