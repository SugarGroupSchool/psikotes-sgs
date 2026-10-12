/* ============================================================
   js/00v-fgd-combined-pdf.js
   ------------------------------------------------------------
   AUTO-GENERATOR PDF GABUNGAN HASIL FGD
   
   - Dipanggil dari 00o-fgd.js setelah asesor submit
   - Dipanggil dari 00t-admin-candidate-panel.js saat hapus asesor
   - Fetch data dari sgs_fgd/[slug]
   - Generate 1 PDF: Cover + Tabel 5 Aspek + Catatan per Asesor
   - Upload otomatis ke Google Drive via GAS
   ============================================================ */

(function () {
  'use strict';

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbzsdy_aGU5vN6mrkXvNbKBO4nHym6xIGhDNT0u_Urz3qQ2w3jFjwMzjfv0ipQxmqyBG/exec';

  const ASPEK_ORDER = [
    { id: 'analisis',      label: 'Kemampuan Analisis & Pemecahan Masalah' },
    { id: 'komunikasi',    label: 'Keterampilan Komunikasi' },
    { id: 'kerjasama',     label: 'Kerjasama Tim' },
    { id: 'kepemimpinan',  label: 'Kepemimpinan & Inisiatif' },
    { id: 'adaptabilitas', label: 'Adaptabilitas' }
  ];

  function candidateSlug(name) {
    return String(name || 'tanpa-nama').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'tanpa-nama';
  }

  function fmtScore(n) {
    if (n === null || n === undefined || isNaN(n)) return '-';
    return Number(n).toFixed(2).replace('.', ',');
  }

  function fmtDateId(ts) {
    if (!ts) return '-';
    return new Date(ts).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  function recLabel(v) {
    const map = {
      HIGHLY_RECOMMENDED: 'HIGHLY RECOMMENDED',
      RECOMMENDED: 'RECOMMENDED',
      FAIRLY_RECOMMENDED: 'FAIRLY RECOMMENDED',
      NOT_RECOMMENDED: 'NOT RECOMMENDED'
    };
    return map[v] || (v || '-');
  }

  function conclusionColor(label) {
    const s = String(label || '').toUpperCase();
    if (s.includes('HIGHLY')) return [22, 101, 52];
    if (s.includes('FAIRLY')) return [217, 119, 6];
    if (s.includes('NOT'))    return [220, 38, 38];
    if (s.includes('RECOMMENDED')) return [22, 163, 74];
    return [71, 85, 105];
  }

  async function fetchFGDData(candidateName) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      throw new Error('Firebase belum siap');
    }
    const slug = candidateSlug(candidateName);

    const [snap, lastDeleteSnap] = await Promise.all([
      firebase.database().ref('sgs_fgd/' + slug).once('value'),
      firebase.database().ref('sgs_state/lastDelete').once('value')
    ]);

    const rawData = snap.val() || {};
    const lastDelete = lastDeleteSnap.val() || {};

    let sameCandidate = false;
    if (lastDelete.candidateSlug) {
      sameCandidate = (lastDelete.candidateSlug === slug);
    } else if (lastDelete.candidateName) {
      const _s = candidateSlug(lastDelete.candidateName);
      if (_s === slug) sameCandidate = true;
    }
    const cutoffTs = sameCandidate ? (Number(lastDelete.ts) || 0) : 0;

    const data = {};
    Object.keys(rawData).forEach(asesor => {
      const item = rawData[asesor] || {};
      const ts = Number(item.ts) || 0;
      if (ts > cutoffTs) data[asesor] = item;
    });

    const asesorList = Object.keys(data).sort();
    console.log('[FGD-COMBINED] Fetched:', asesorList.length, 'asesor');
    return { slug, data, asesorList };
  }

  async function loadLogoDataURL() {
    const logoUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO)
      || 'https://cdn.jsdelivr.net/gh/Pragas123/assets@main/nmqo6a.png';
    try {
      const r = await fetch(logoUrl, { cache: 'no-cache' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const blob = await r.blob();
      return await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });
    } catch (e) { return null; }
  }

  async function buildCombinedPDF(candidateName, candidatePosition, data, asesorList) {
    if (typeof window.loadPdfLibs === 'function') await window.loadPdfLibs();
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF belum siap');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 15;
    const CW = PW - M * 2;
    let y = M;

    /* KOP */
    const logo = await loadLogoDataURL();
    if (logo) { try { doc.addImage(logo, 'PNG', PW / 2 - 10, y, 20, 16); } catch (e) {} }
    y += 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(139, 92, 246);
    doc.text('LAPORAN HASIL FGD', PW / 2, y, { align: 'center' });
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('SUGAR GROUP SCHOOLS', PW / 2, y, { align: 'center' });
    y += 8;
    doc.setDrawColor(200); doc.setLineWidth(0.3);
    doc.line(M, y, PW - M, y);
    y += 6;

    /* IDENTITAS */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(139, 92, 246);
    doc.text('INFORMASI KANDIDAT', M, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    [
      ['Nama Kandidat', candidateName || '-'],
      ['Posisi Dilamar', candidatePosition || '-'],
      ['Jumlah Asesor', String(asesorList.length)],
      ['Tanggal Laporan', fmtDateId(Date.now())]
    ].forEach(([k, v]) => {
      doc.text(k + ' :', M + 2, y);
      doc.text(String(v), M + 40, y);
      y += 4.5;
    });
    y += 3;
    doc.setDrawColor(220);
    doc.line(M, y, PW - M, y);
    y += 6;

    /* RANGKUMAN PER ASESOR */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(139, 92, 246);
    doc.text('RANGKUMAN PER ASESOR', M, y);
    y += 5;

    const cols = { no: M + 2, name: M + 12, avg: M + 65, rec: M + 95 };
    doc.setFillColor(243, 232, 255);
    doc.rect(M, y - 3.5, CW, 6.5, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('No', cols.no, y);
    doc.text('Asesor', cols.name, y);
    doc.text('Rata-rata', cols.avg, y);
    doc.text('Rekomendasi', cols.rec, y);
    y += 5.5;
    doc.setFont('helvetica', 'normal');

    let overallSum = 0, overallCount = 0;
    asesorList.forEach((asesor, idx) => {
      const item = data[asesor] || {};
      const avg = Number(item.average) || 0;
      const rec = recLabel(item.recommendation);
      if (idx % 2 === 0) {
        doc.setFillColor(250, 248, 255);
        doc.rect(M, y - 3.5, CW, 5.5, 'F');
      }
      doc.setFontSize(8.5);
      doc.text(String(idx + 1), cols.no, y);
      doc.text(asesor, cols.name, y);
      doc.text(fmtScore(avg), cols.avg, y);
      const cC = conclusionColor(item.recommendation);
      doc.setTextColor(cC[0], cC[1], cC[2]);
      doc.text(rec, cols.rec, y);
      doc.setTextColor(30, 41, 59);
      y += 5;
      if (avg > 0) { overallSum += avg; overallCount++; }
    });

    const overallAvg = overallCount > 0 ? overallSum / overallCount : 0;
    doc.setFillColor(233, 213, 255);
    doc.rect(M, y - 3.5, CW, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('RATA-RATA KESELURUHAN', cols.no, y);
    doc.text(fmtScore(overallAvg), cols.avg, y);
    y += 9;

    /* TABEL 5 ASPEK */
    if (y + 20 > PH - M) { doc.addPage(); y = M + 5; }
    else { y += 8; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(139, 92, 246);
    doc.text('PENILAIAN 5 ASPEK', PW / 2, y, { align: 'center' });
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Skor 1,00 (Sangat Kurang) - 4,00 (Sangat Baik)', PW / 2, y, { align: 'center' });
    y += 6;

    const scoreColW = 13;
    const aspekColW = CW - (asesorList.length + 1) * scoreColW - 5;

    doc.setFillColor(243, 232, 255);
    doc.rect(M, y - 3.5, CW, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('No', M + 2, y);
    doc.text('Aspek', M + 12, y);
    let xC = M + 12 + aspekColW;
    asesorList.forEach(asesor => {
      doc.text(asesor, xC + scoreColW / 2, y, { align: 'center' });
      xC += scoreColW;
    });
    doc.text('Rata2', xC + scoreColW / 2, y, { align: 'center' });
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    ASPEK_ORDER.forEach((aspek, idx) => {
      const wrapped = doc.splitTextToSize(aspek.label, aspekColW - 4);
      const rowH = Math.max(7, wrapped.length * 3.5 + 2);
      if (y + rowH > PH - 20) { doc.addPage(); y = M + 5; }
      if (idx % 2 === 0) {
        doc.setFillColor(250, 248, 255);
        doc.rect(M, y - 3.5, CW, rowH, 'F');
      }
      doc.setTextColor(30, 41, 59);
      doc.text(String(idx + 1), M + 2, y);
      wrapped.slice(0, 2).forEach((line, i) => doc.text(line, M + 12, y + i * 3.5));

      let xCs = M + 12 + aspekColW;
      let sum = 0, cnt = 0;
      asesorList.forEach(asesor => {
        const s = (data[asesor]?.scores || {})[aspek.id];
        const ok = (typeof s === 'number');
        doc.text(ok ? fmtScore(s) : '-', xCs + scoreColW / 2, y, { align: 'center' });
        if (ok) { sum += s; cnt++; }
        xCs += scoreColW;
      });
      const avgA = cnt > 0 ? sum / cnt : 0;
      doc.setFont('helvetica', 'bold');
      doc.text(fmtScore(avgA), xCs + scoreColW / 2, y, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      y += rowH;
    });

    /* CATATAN PER ASESOR */
    if (y + 30 > PH - M) { doc.addPage(); y = M + 5; }
    else { y += 10; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(139, 92, 246);
    doc.text('CATATAN PER ASESOR', PW / 2, y, { align: 'center' });
    y += 10;

    asesorList.forEach(asesor => {
      const item = data[asesor] || {};
      const avg = Number(item.average) || 0;
      const rec = recLabel(item.recommendation);
      const overall = String(item.overallNote || '').trim();
      const notes = item.notes || {};

      if (y + 40 > PH - 20) { doc.addPage(); y = M + 5; }

      doc.setFillColor(243, 232, 255);
      doc.rect(M, y - 4, CW, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(139, 92, 246);
      doc.text('Asesor: ' + asesor, M + 3, y);
      doc.setFontSize(9);
      doc.text('Rata-rata: ' + fmtScore(avg), PW - M - 70, y);
      const cC = conclusionColor(item.recommendation);
      doc.setTextColor(cC[0], cC[1], cC[2]);
      doc.text(rec, PW - M - 3, y, { align: 'right' });
      y += 9;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      ASPEK_ORDER.forEach(aspek => {
        const noteText = String(notes[aspek.id] || '').trim();
        if (!noteText) return;
        if (y > PH - 20) { doc.addPage(); y = M + 5; }
        const score = (item.scores || {})[aspek.id];
        doc.setFont('helvetica', 'bold');
        doc.text(aspek.label + (typeof score === 'number' ? ' [' + fmtScore(score) + ']' : '') + ':', M + 3, y);
        y += 4;
        doc.setFont('helvetica', 'normal');
        const wrapped = doc.splitTextToSize(noteText, CW - 8);
        wrapped.forEach(line => {
          if (y > PH - 20) { doc.addPage(); y = M + 5; }
          doc.text(line, M + 6, y);
          y += 3.8;
        });
        y += 1;
      });

      if (overall) {
        if (y > PH - 25) { doc.addPage(); y = M + 5; }
        y += 3;
        doc.setFont('helvetica', 'bold');
        doc.text('Catatan Keseluruhan:', M + 3, y);
        y += 4;
        doc.setFont('helvetica', 'normal');
        const wrappedO = doc.splitTextToSize(overall, CW - 8);
        wrappedO.forEach(line => {
          if (y > PH - 20) { doc.addPage(); y = M + 5; }
          doc.text(line, M + 6, y);
          y += 3.8;
        });
      }

      y += 6;
    });

    /* FOOTER */
    if (y + 40 > PH - 20) { doc.addPage(); y = M + 5; }
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Tester,', PW - M - 50, y);
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Deni Pragas Septian Pratama', PW - M - 50, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Human Capital Recruitment Staff', PW - M - 50, y + 4);
    doc.text('Sugar Group Schools', PW - M - 50, y + 8);

    return doc;
  }

  async function uploadCombinedToGAS(blob, filename, candidateName, candidatePosition) {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    let idToken = '';
    try {
      const user = firebase.auth().currentUser;
      if (user) idToken = await user.getIdToken();
    } catch (e) {}

    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        idToken: idToken,
        action: 'upload',
        deviceId: 'fgdcombined_' + Date.now(),
        filename: filename,
        name: candidateName,
        position: candidatePosition || '',
        email: '',
        pdfBase64: base64,
        pdfPassword: '-'
      })
    });

    await new Promise(r => setTimeout(r, 2000));

    try {
      firebase.database().ref('sgs_state/lastUpload').set({
        ts: firebase.database.ServerValue.TIMESTAMP,
        type: 'pdf',
        name: candidateName,
        position: candidatePosition || '',
        deviceId: 'fgdcombined'
      }).catch(() => {});
    } catch (e) {}

    if (typeof window.__invalidateResultCache === 'function') {
      try { window.__invalidateResultCache(); } catch (e) {}
    }
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */
  window.autoGenerateFGDCombined = async function (candidateName, candidatePosition) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return false;
    try {
      const { data, asesorList } = await fetchFGDData(candidateName);

      if (asesorList.length === 0) {
        console.log('[FGD-COMBINED] Tidak ada asesor — skip generate');
        return false;
      }

      console.log('[FGD-COMBINED] Generate untuk', candidateName, '·', asesorList.length, 'asesor');
      const doc = await buildCombinedPDF(candidateName, candidatePosition, data, asesorList);
      const blob = doc.output('blob');
      const filename = candidateName.replace(/[^a-zA-Z0-9]/g, '-') + '-FGD-COMBINED.pdf';

      await uploadCombinedToGAS(blob, filename, candidateName, candidatePosition);
      console.log('[FGD-COMBINED] ✓ Uploaded:', filename);
      return true;
    } catch (e) {
      console.error('[FGD-COMBINED] Gagal:', e);
      return false;
    }
  };

  console.log('[FGD-COMBINED] ✓ Loaded — auto-generate mode');
})();