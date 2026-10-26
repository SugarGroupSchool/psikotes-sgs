/* ============================================================
   js/00y2-unified-report.js — Unified PDF Report v1.0
   ------------------------------------------------------------
   🆕 [2026-10-26]: Generate SATU PDF lengkap yang menggabungkan:
   Cover + Psikogram + IST + Kraeplin + DISC + PAPI + BigFive
   + Grafis + Subject + Typing + Wawancara + Pengesahan (TTD)

   - Merge via pdf-lib (dynamic load CDN kalau belum ada)
   - Footer "Halaman X / Y" di setiap halaman
   - Button "📄 LAPORAN LENGKAP" di-inject otomatis ke folder overlay
   ============================================================ */

(function () {
  'use strict';

  if (window.__unifiedReportLoaded) return;
  window.__unifiedReportLoaded = true;

  const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';

  /* ============================================================
     HELPERS
     ============================================================ */
  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function safeFileName(name) {
    return String(name || 'Kandidat').replace(/[^a-zA-Z0-9]/g, '-');
  }
  function cleanText(s) {
    return String(s || '')
      .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[^\x20-\x7E\n]/g, '').trim();
  }
  function sanitize(s) {
    return String(s || '').replace(/[^\x20-\x7E]/g, '?');
  }

  /* ============================================================
     PDF-LIB LOADER (dynamic dari CDN kalau belum ada)
     ============================================================ */
  async function __ensurePdfLibLoaded() {
    if (window.PDFLib) return window.PDFLib;
    if (window.__pdfLibPromise) return window.__pdfLibPromise;

    window.__pdfLibPromise = new Promise((resolve, reject) => {
      if (window.PDFLib) return resolve(window.PDFLib);
      const s = document.createElement('script');
      s.src = PDFLIB_CDN;
      s.crossOrigin = 'anonymous';
      s.async = true;
      s.onload = () => {
        if (window.PDFLib) resolve(window.PDFLib);
        else reject(new Error('pdf-lib loaded but window.PDFLib undefined'));
      };
      s.onerror = () => reject(new Error('Gagal load pdf-lib dari CDN'));
      document.head.appendChild(s);
    });

    try {
      return await window.__pdfLibPromise;
    } finally {
      window.__pdfLibPromise = null;
    }
  }

  /* ============================================================
     FETCH INTERVIEWS (untuk Wawancara section)
     ============================================================ */
  async function __fetchInterviews(slug) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return null;
    const dashed = String(slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
    const candidates = [slug, dashed].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const s of candidates) {
      try {
        const snap = await firebase.database().ref('sgs_interviews/' + s).once('value');
        const d = snap.val() || {};
        const interviewers = Object.keys(d).filter(k => d[k] && typeof d[k].average === 'number');
        if (interviewers.length > 0) {
          interviewers.sort((a, b) => (d[b].average || 0) - (d[a].average || 0));
          return { data: d, interviewers };
        }
      } catch (e) {}
    }
    return null;
  }

  /* ============================================================
     BUILD: COVER PAGE
     ============================================================ */
  async function __buildCover(name, position, sectionsTOC) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 15, CW = PW - 2 * M;
    let y = 18;

    /* Logo */
    try {
      const logoUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO)
        || 'https://cdn.jsdelivr.net/gh/Pragas123/assets@main/nmqo6a.png';
      const resp = await fetch(logoUrl, { cache: 'no-cache' });
      if (resp.ok) {
        const blob = await resp.blob();
        const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onloadend = () => res(r.result); r.readAsDataURL(blob); });
        doc.addImage(dataUrl, 'PNG', PW / 2 - 12, y, 24, 20);
        y += 26;
      }
    } catch (e) {}

    /* Title */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(30, 58, 138);
    doc.text('LAPORAN HASIL SELEKSI', PW / 2, y, { align: 'center' }); y += 9;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(100, 116, 139);
    doc.text('SUGAR GROUP SCHOOLS', PW / 2, y, { align: 'center' }); y += 4;
    doc.setFontSize(9); doc.setTextColor(148, 163, 184);
    doc.text('Human Capital Recruitment Division', PW / 2, y, { align: 'center' }); y += 8;

    doc.setDrawColor(30, 58, 138); doc.setLineWidth(0.8);
    doc.line(M, y, PW - M, y); doc.setLineWidth(0.2); y += 8;

    /* Info Kandidat box */
    doc.setFillColor(238, 242, 255); doc.setDrawColor(59, 130, 246);
    doc.rect(M, y, CW, 32, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(67, 56, 202);
    doc.text('INFORMASI KANDIDAT', M + 5, y + 6);
    y += 11;

    const tanggal = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const infoRows = [
      ['Nama Kandidat', cleanText(name) || '-'],
      ['Posisi Dilamar', cleanText(position) || '-'],
      ['Tanggal Laporan', tanggal]
    ];
    infoRows.forEach(([k, v]) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(30, 41, 59);
      doc.text(k + ' :', M + 7, y);
      doc.setFont('helvetica', 'bold');
      doc.text(String(v), M + 42, y);
      y += 5.5;
    });
    y += 6;

    /* Daftar Isi */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(30, 58, 138);
    doc.text('DAFTAR ISI', M, y); y += 7;

    doc.setFontSize(10);
    sectionsTOC.forEach((s, i) => {
      doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
      doc.text(`${i + 1}. ${cleanText(s.title)}`, M + 4, y);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(59, 130, 246);
      doc.text(`Hal. ${s.startPage}`, PW - M - 4, y, { align: 'right' });
      y += 6;
    });

    /* Footer note */
    y = PH - 30;
    doc.setDrawColor(200); doc.line(M, y - 4, PW - M, y - 4);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(100, 116, 139);
    doc.text('Dokumen ini bersifat CONFIDENTIAL dan hanya untuk keperluan internal.', PW / 2, y, { align: 'center' }); y += 4;
    doc.text('Sugar Group Schools — Human Capital Recruitment', PW / 2, y, { align: 'center' });

    return doc;
  }

  /* ============================================================
     BUILD: WAWANCARA SECTION
     ============================================================ */
  async function __buildWawancara(name, position, waw) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 15, CW = PW - 2 * M;
    let y = 15;

    /* Section Title */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(146, 64, 14);
    doc.text('HASIL WAWANCARA', M, y); y += 5;
    doc.setDrawColor(146, 64, 14); doc.setLineWidth(0.6);
    doc.line(M, y, M + 60, y); doc.setLineWidth(0.2); y += 6;

    /* Overall average */
    const avgs = waw.interviewers.map(k => Number(waw.data[k].average) || 0);
    const grandAvg = avgs.reduce((a, b) => a + b, 0) / avgs.length;

    doc.setFillColor(254, 243, 199); doc.setDrawColor(245, 158, 11);
    doc.rect(M, y, CW, 16, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(146, 64, 14);
    doc.text(`RATA-RATA KESELURUHAN: ${grandAvg.toFixed(2)} / 5.00`, M + 4, y + 6);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`Dari ${waw.interviewers.length} pewawancara`, M + 4, y + 12);
    y += 22;

    /* Table header */
    doc.setFillColor(245, 158, 11); doc.rect(M, y, CW, 7, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('PEWAWANCARA', M + 4, y + 5);
    doc.text('NILAI', M + CW - 55, y + 5, { align: 'center' });
    doc.text('KESIMPULAN', M + CW - 4, y + 5, { align: 'right' });
    y += 7;

    waw.interviewers.forEach((iv, i) => {
      if (y > PH - 25) { doc.addPage(); y = 15; }
      const d = waw.data[iv] || {};
      if (i % 2 === 0) { doc.setFillColor(255, 251, 235); doc.rect(M, y, CW, 7, 'F'); }
      doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.setFontSize(9);
      doc.text(sanitize(String(iv).slice(0, 20)), M + 4, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(Number(d.average || 0).toFixed(2), M + CW - 55, y + 5, { align: 'center' });
      const rawConc = String(d.conclusion || '-');
      let shortConc = rawConc.replace(/_/g, ' ');
      if (shortConc.length > 22) shortConc = shortConc.slice(0, 22) + '…';
      doc.setFontSize(8);
      doc.text(sanitize(shortConc), M + CW - 4, y + 5, { align: 'right' });
      y += 7;
    });

    y += 8;

    /* Per-interviewer detail */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(146, 64, 14);
    doc.text('DETAIL PER PEWAWANCARA', M, y); y += 6;

    waw.interviewers.forEach((iv) => {
      if (y > PH - 40) { doc.addPage(); y = 15; }
      const d = waw.data[iv] || {};
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 41, 59);
      doc.text(`• ${sanitize(iv)} — ${Number(d.average || 0).toFixed(2)} / 5.00`, M, y); y += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(71, 85, 105);

      /* Tampilkan scores kalau ada */
      if (d.scores && typeof d.scores === 'object' && Object.keys(d.scores).length > 0) {
        const scoreLines = Object.entries(d.scores)
          .map(([k, v]) => `${k}: ${Number(v).toFixed(2)}`)
          .join(' · ');
        const wrappedScores = doc.splitTextToSize(cleanText(scoreLines), CW - 6);
        wrappedScores.forEach(line => {
          if (y > PH - 20) { doc.addPage(); y = 15; }
          doc.text(line, M + 4, y); y += 3.8;
        });
        y += 1.5;
      }

      /* Kesimpulan lengkap */
      const conclusion = cleanText(String(d.conclusion || '-'));
      const wrapped = doc.splitTextToSize(conclusion, CW - 6);
      wrapped.forEach(line => {
        if (y > PH - 20) { doc.addPage(); y = 15; }
        doc.text(line, M + 4, y);
        y += 4;
      });
      y += 5;
    });

    return doc;
  }

  /* ============================================================
     BUILD: SIGNATURE PAGE (Pengesahan)
     ============================================================ */
  async function __buildSignaturePage(name, position) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 15, CW = PW - 2 * M;

    let y = 30;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(30, 58, 138);
    doc.text('PENGESAHAN', M, y); y += 5;
    doc.setDrawColor(30, 58, 138); doc.setLineWidth(0.6);
    doc.line(M, y, M + 40, y); doc.setLineWidth(0.2); y += 15;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(30, 41, 59);
    doc.text('Laporan ini disusun berdasarkan hasil asesmen psikologis yang telah dilakukan', M, y); y += 6;
    doc.text('terhadap kandidat bersangkutan. Seluruh data yang tercantum bersifat rahasia', M, y); y += 6;
    doc.text('dan hanya dipergunakan untuk keperluan seleksi di lingkungan Sugar Group Schools.', M, y); y += 25;

    /* TTD */
    y = PH - 75;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(30, 41, 59);
    doc.text('Disahkan oleh,', PW - 85, y); y += 22;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(148, 163, 184);
    doc.text('ttd', PW - 85, y); y += 12;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(30, 41, 59);
    doc.text('Deni Pragas Septian Pratama', PW - 85, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
    doc.text('(Grafis Interpreter)', PW - 85, y);

    /* Tanggal */
    const tanggal = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(30, 41, 59);
    doc.text('Tanggal: ' + tanggal, M, PH - 40);

    return doc;
  }

  /* ============================================================
     COLLECT SECTIONS
     ============================================================ */
  async function __collectSections(slug, name, position, progressFn) {
    const sections = [];
    const tryAdd = async (key, title, fetchData, generateDoc) => {
      try {
        if (progressFn) progressFn(`Memuat ${title}...`);
        const data = await fetchData();
        if (!data) return;
        const doc = await generateDoc(data);
        if (doc) {
          sections.push({ key, title, doc });
          console.log('[UNIFIED] ✓ ' + key);
        }
      } catch (e) {
        console.warn('[UNIFIED] ' + key + ' skip:', e.message);
      }
    };

    /* 1. Psikogram */
    if (typeof window.__computePsikogram === 'function' && typeof window.generatePsikogramPDF === 'function') {
      try {
        if (progressFn) progressFn('Memuat Psikogram...');
        const psiko = await window.__computePsikogram(slug, position);
        const hasData = psiko.category && psiko.computed.some(c => c.finalScore !== null);
        if (hasData) {
          const doc = await window.generatePsikogramPDF(name, position, psiko.computed, { contentOnly: true });
          sections.push({ key: 'psikogram', title: 'Hasil Psikogram', doc });
          console.log('[UNIFIED] ✓ psikogram');
        }
      } catch (e) { console.warn('[UNIFIED] psikogram skip:', e.message); }
    }

    /* 2. IST */
    if (typeof window.__fetchISTData === 'function' && typeof window.generateISTPDF === 'function') {
      await tryAdd('ist', 'Hasil Tes IST',
        () => window.__fetchISTData(slug),
        (d) => window.generateISTPDF(name, position, d, { contentOnly: true }));
    }

    /* 3. Kraeplin */
    if (typeof window.__fetchKRAEPLINData === 'function' && typeof window.generateKRAEPLINPDF === 'function') {
      await tryAdd('kraeplin', 'Hasil Tes Kraeplin',
        () => window.__fetchKRAEPLINData(slug),
        (d) => window.generateKRAEPLINPDF(name, position, d, { contentOnly: true }));
    }

    /* 4. DISC */
    if (typeof window.__fetchDISCData === 'function' && typeof window.generateDISCPDF === 'function') {
      await tryAdd('disc', 'Hasil Tes DISC',
        () => window.__fetchDISCData(slug),
        (d) => window.generateDISCPDF(name, position, d, { contentOnly: true }));
    }

    /* 5. PAPI */
    if (typeof window.__fetchPAPIData === 'function' && typeof window.generatePAPIPDF === 'function') {
      await tryAdd('papi', 'Hasil Tes PAPI Kostick',
        () => window.__fetchPAPIData(slug),
        (d) => window.generatePAPIPDF(name, position, d, { contentOnly: true }));
    }

    /* 6. BigFive */
    if (typeof window.__fetchBIGFIVEData === 'function' && typeof window.generateBIGFIVEPDF === 'function') {
      await tryAdd('bigfive', 'Hasil Tes Big Five',
        () => window.__fetchBIGFIVEData(slug),
        (d) => window.generateBIGFIVEPDF(name, position, d, { contentOnly: true }));
    }

    /* 7. Grafis (special — butuh slug) */
    if (typeof window.__fetchGrafisData === 'function' && typeof window.generateGrafisCombinedPDF === 'function') {
      try {
        if (progressFn) progressFn('Memuat Grafis...');
        const data = await window.__fetchGrafisData(slug);
        if (data && Object.keys(data).length > 0) {
          const doc = await window.generateGrafisCombinedPDF(slug, name, position, data, { contentOnly: true });
          sections.push({ key: 'grafis', title: 'Hasil Tes Grafis (DAP · BAUM · HTP)', doc });
          console.log('[UNIFIED] ✓ grafis');
        }
      } catch (e) { console.warn('[UNIFIED] grafis skip:', e.message); }
    }

    /* 8. Subject */
    if (typeof window.__fetchSubjectData === 'function' && typeof window.generateSubjectPDF === 'function') {
      await tryAdd('subject', 'Hasil Koreksi Subject Test',
        () => window.__fetchSubjectData(slug),
        (d) => window.generateSubjectPDF(name, position, d, { contentOnly: true }));
    }

    /* 9. Typing */
    if (typeof window.__fetchTYPINGData === 'function' && typeof window.generateTYPINGPDF === 'function') {
      await tryAdd('typing', 'Hasil Tes Mengetik',
        () => window.__fetchTYPINGData(slug),
        (d) => window.generateTYPINGPDF(name, position, d, { contentOnly: true }));
    }

    /* 10. Wawancara (custom render) */
    try {
      if (progressFn) progressFn('Memuat Wawancara...');
      const waw = await __fetchInterviews(slug);
      if (waw && waw.interviewers.length > 0) {
        const doc = await __buildWawancara(name, position, waw);
        sections.push({ key: 'wawancara', title: 'Hasil Wawancara', doc });
        console.log('[UNIFIED] ✓ wawancara');
      }
    } catch (e) { console.warn('[UNIFIED] wawancara skip:', e.message); }

    return sections;
  }

  /* ============================================================
     APPLY FOOTER (pdf-lib) — "Halaman X / Y" + Nama Kandidat
     ============================================================ */
  async function __applyFooter(pdfDoc, name) {
    const PDFLib = window.PDFLib;
    const pages = pdfDoc.getPages();
    const total = pages.length;
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const gray = PDFLib.rgb(0.5, 0.55, 0.62);

    pages.forEach((page, i) => {
      const { width, height } = page.getSize();
      /* Nama kandidat kiri bawah */
      page.drawText(sanitize(name || '-'), {
        x: 40, y: 18, size: 8, font, color: gray
      });
      /* Halaman kanan bawah */
      page.drawText(`Halaman ${i + 1} / ${total}`, {
        x: width - 100, y: 18, size: 8, font, color: gray
      });
      /* Line separator */
      page.drawLine({
        start: { x: 40, y: height - 25 },
        end:   { x: width - 40, y: height - 25 },
        thickness: 0.3,
        color: PDFLib.rgb(0.85, 0.87, 0.91),
        opacity: 0.5
      });
    });
  }

  /* ============================================================
     MAIN ORCHESTRATOR
     ============================================================ */
  async function generateUnifiedReportPDF(slug, name, position, opts) {
    opts = opts || {};
    const progressFn = opts.onProgress || null;

    /* 1. Ensure libs */
    if (typeof window.loadPdfLibs === 'function') await window.loadPdfLibs();
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF tidak tersedia');
    if (progressFn) progressFn('Menyiapkan pdf-lib...');
    await __ensurePdfLibLoaded();
    const PDFLib = window.PDFLib;

    /* 2. Collect sections */
    const sections = await __collectSections(slug, name, position, progressFn);

    if (sections.length === 0) {
      throw new Error('Tidak ada data tes yang bisa disertakan dalam laporan.');
    }

    /* 3. Load each section + count pages */
    if (progressFn) progressFn('Menghitung halaman...');
    const loaded = [];
    let cursor = 2; /* cover = page 1, section 1 mulai halaman 2 */
    for (const sec of sections) {
      const bytes = sec.doc.output('arraybuffer');
      const pdf = await PDFLib.PDFDocument.load(bytes);
      const pageCount = pdf.getPageCount();
      loaded.push({ ...sec, pdfLibDoc: pdf, pageCount, startPage: cursor });
      cursor += pageCount;
    }

    /* 4. Build cover with TOC (startPage sudah terisi) */
    if (progressFn) progressFn('Membangun cover & TOC...');
    const coverDoc = await __buildCover(name, position, loaded);
    const coverBytes = coverDoc.output('arraybuffer');
    const coverPdf = await PDFLib.PDFDocument.load(coverBytes);
    const coverPageCount = coverPdf.getPageCount();

    /* Kalau cover > 1 page → sesuaikan nomor halaman & rebuild TOC */
    if (coverPageCount > 1) {
      let c2 = coverPageCount + 1;
      for (const l of loaded) {
        l.startPage = c2;
        c2 += l.pageCount;
      }
      const coverDoc2 = await __buildCover(name, position, loaded);
      const coverBytes2 = coverDoc2.output('arraybuffer');
      const coverPdf2 = await PDFLib.PDFDocument.load(coverBytes2);
      /* Replace cover */
      Object.assign({}, { cover: coverPdf2 }); /* no-op, just use coverPdf2 below */
      return await __mergeAndSave(coverPdf2, loaded, name, position, progressFn);
    }

    return await __mergeAndSave(coverPdf, loaded, name, position, progressFn);
  }

  async function __mergeAndSave(coverPdf, loadedSections, name, position, progressFn) {
    const PDFLib = window.PDFLib;

    /* 5. Build signature page */
    if (progressFn) progressFn('Membangun halaman pengesahan...');
    const sigDoc = await __buildSignaturePage(name, position);
    const sigBytes = sigDoc.output('arraybuffer');
    const sigPdf = await PDFLib.PDFDocument.load(sigBytes);

    /* 6. Merge all */
    if (progressFn) progressFn('Menggabungkan semua section...');
    const master = await PDFLib.PDFDocument.create();

    /* 6a. Copy cover */
    const coverPagesCopied = await master.copyPages(coverPdf, coverPdf.getPageIndices());
    coverPagesCopied.forEach(p => master.addPage(p));

    /* 6b. Copy each section */
    for (const sec of loadedSections) {
      const pages = await master.copyPages(sec.pdfLibDoc, sec.pdfLibDoc.getPageIndices());
      pages.forEach(p => master.addPage(p));
    }

    /* 6c. Copy signature page */
    const sigPagesCopied = await master.copyPages(sigPdf, sigPdf.getPageIndices());
    sigPagesCopied.forEach(p => master.addPage(p));

    /* 7. Apply footer */
    if (progressFn) progressFn('Menambahkan footer...');
    await __applyFooter(master, name);

    /* 8. Save */
    if (progressFn) progressFn('Menyimpan PDF...');
    const finalBytes = await master.save();
    return new Blob([finalBytes], { type: 'application/pdf' });
  }

  /* ============================================================
     DOWNLOAD (trigger file download)
     ============================================================ */
  async function downloadUnifiedReport(slug, name, position) {
    const blob = await generateUnifiedReportPDF(slug, name, position);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Laporan-Lengkap-' + safeFileName(name) + '.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  /* ============================================================
     LOADING OVERLAY
     ============================================================ */
  function __showLoadingOverlay(name) {
    const old = document.getElementById('unifiedReportLoading');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'unifiedReportLoading';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.94);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';
    ov.innerHTML = `
      <div style="max-width:400px;width:100%;background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.5);border-radius:18px;padding:32px 28px;text-align:center;color:#e2e8f0;box-shadow:0 30px 90px rgba(0,0,0,.65);">
        <div style="width:64px;height:64px;margin:0 auto 20px;border:4px solid rgba(99,102,241,.2);border-top-color:#6366f1;border-radius:50%;animation:unifiedSpin 1s linear infinite;"></div>
        <div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:8px;">Menyusun Laporan Lengkap</div>
        <div style="font-size:13px;color:#94a3b8;line-height:1.6;margin-bottom:16px;">Menggabungkan semua hasil tes <b style="color:#a5b4fc;">${escHtml(name)}</b> menjadi satu file PDF...</div>
        <div id="unifiedReportProgress" style="padding:10px 14px;background:rgba(0,0,0,.3);border-radius:8px;font-size:11.5px;color:#cbd5e1;font-weight:700;line-height:1.5;">Memulai...</div>
        <style>@keyframes unifiedSpin { to { transform: rotate(360deg); } }</style>
      </div>`;
    document.body.appendChild(ov);
  }

  function __updateProgress(msg) {
    const el = document.getElementById('unifiedReportProgress');
    if (el) el.textContent = msg;
  }

  function __hideLoadingOverlay() {
    const ov = document.getElementById('unifiedReportLoading');
    if (ov) ov.remove();
  }

  /* ============================================================
     INJECT BUTTON KE FOLDER OVERLAY
     ============================================================ */
  function __injectButtonToFolderOverlay() {
    const overlay = document.getElementById('rfFolderOverlay');
    if (!overlay) return;
    const actionBar = overlay.querySelector('.rf-folder-actions');
    if (!actionBar) return;
    if (actionBar.querySelector('.js-unified-report')) return;

    /* Ambil slug/name/position dari tombol manapun yang ada */
    const refBtn = overlay.querySelector('.js-retake-open')
      || overlay.querySelector('.js-interview-link')
      || overlay.querySelector('[data-slug]');
    const slug = refBtn ? refBtn.getAttribute('data-slug') : '';
    const name = refBtn ? refBtn.getAttribute('data-name') : '';
    const position = refBtn ? refBtn.getAttribute('data-position') : '';

    if (!slug) return;

    const btn = document.createElement('button');
    btn.className = 'js-unified-report';
    btn.setAttribute('data-slug', slug);
    btn.setAttribute('data-name', name);
    btn.setAttribute('data-position', position || '');
    btn.style.cssText = `
      padding: 12px 8px; border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: 0; color: #fff; font-family: inherit;
      font-size: 11.5px; font-weight: 800;
      cursor: pointer; white-space: nowrap;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      box-shadow: 0 4px 12px rgba(99,102,241,.35);`;
    btn.innerHTML = `
      <span style="font-size: 20px;">📄</span>
      <span class="rf-folder-overlay-btn-label">LAPORAN LENGKAP</span>`;
    actionBar.appendChild(btn);
    console.log('[UNIFIED] ✓ Button injected to folder overlay');
  }

  /* Watch for folder overlay appearance */
  let __folderBtnDebounce = null;
  const __folderObserver = new MutationObserver(() => {
    clearTimeout(__folderBtnDebounce);
    __folderBtnDebounce = setTimeout(() => {
      if (document.getElementById('rfFolderOverlay')) {
        __injectButtonToFolderOverlay();
      }
    }, 150);
  });
  if (document.body) {
    __folderObserver.observe(document.body, { childList: true, subtree: true });
  }

  /* ============================================================
     EVENT DELEGATION
     ============================================================ */
  if (!window.__unifiedReportDelegation) {
    window.__unifiedReportDelegation = true;
    document.addEventListener('click', async function (e) {
      const btn = e.target.closest('.js-unified-report');
      if (!btn) return;
      e.preventDefault(); e.stopPropagation();

      const slug = btn.getAttribute('data-slug');
      const name = btn.getAttribute('data-name');
      const position = btn.getAttribute('data-position');
      if (!slug) return;

      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<span style="font-size:20px;">⏳</span><span class="rf-folder-overlay-btn-label">MEMPROSES...</span>';
      btn.disabled = true;

      __showLoadingOverlay(name || 'Kandidat');
      try {
        const blob = await generateUnifiedReportPDF(slug, name, position, {
          onProgress: __updateProgress
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Laporan-Lengkap-' + safeFileName(name) + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);

        __updateProgress('✓ PDF berhasil diunduh!');
        setTimeout(__hideLoadingOverlay, 900);

        if (typeof window.showResultToast === 'function') {
          window.showResultToast('📄', 'Laporan lengkap terunduh', name || '');
        }
      } catch (err) {
        console.error('[UNIFIED] Error:', err);
        __hideLoadingOverlay();
        if (typeof window.showResultToast === 'function') {
          window.showResultToast('❌', 'Gagal membuat laporan', err.message || 'Coba lagi');
        } else {
          alert('Gagal membuat laporan: ' + (err.message || 'unknown error'));
        }
      } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    }, true);
  }

  /* ============================================================
     EXPORTS
     ============================================================ */
  window.generateUnifiedReportPDF = generateUnifiedReportPDF;
  window.downloadUnifiedReport     = downloadUnifiedReport;

  console.log('[UNIFIED-REPORT] ✓ Loaded v1.0 — cover + 9 sections + wawancara + pdf-lib merge');
})();