/* ============================================================
   js/00s-interview-combined-pdf.js
   ------------------------------------------------------------
   AUTO-GENERATOR PDF GABUNGAN HASIL WAWANCARA
   
   - Dipanggil dari 00m-interview.js setelah asesor submit
   - Fetch data dari sgs_interviews/[slug]
   - Generate 1 PDF: Cover + Tabel + Catatan per Asesor
   - Upload otomatis ke Google Drive via GAS
   - TIDAK ada tombol manual di panel admin
   ============================================================ */

(function () {
  'use strict';

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbxCryXLdQXXbB2k6qxkmbZJF-L2ltL-QgTUygKLFAg0UNVm3NfKHDgso9nB-NomM4en/exec';

  const CRITERIA_ORDER = {
    guru: [
      'COGNITIVE ABILITY & PROBLEM SOLVING',
      'VERBAL COMMUNICATION & MATERIAL EXPLANATION',
      'CLASSROOM MANAGEMENT & INSTRUCTIONAL LEADERSHIP',
      'EMPATHY & INTERPERSONAL SKILLS',
      'EMOTIONAL STABILITY & IMPULSE CONTROL',
      'MOTIVATION & ACHIEVEMENT DRIVE',
      'WORK DISCIPLINE & RELIABILITY',
      'FLEXIBILITY, ADAPTABILITY, & LEARNING AGILITY',
      'INTEGRITY & RULE COMPLIANCE',
      'TEACHING CREATIVITY',
      'TEACHING PRACTICE SKILLS'
    ],
    admin: [
      'Integritas & Kepatuhan terhadap Aturan',
      'Akurasi & Ketelitian Kerja',
      'Penguasaan Aplikasi Administrasi',
      'Manajemen Waktu & Prioritas',
      'Komunikasi Administratif',
      'Service Orientation',
      'Problem Solving',
      'Inisiatif & Proaktivitas',
      'Collaboration & Interpersonal Skill',
      'Fleksibilitas & Adaptasi',
      'Orientasi Hasil'
    ]
  };

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
  function stripEmoji(s) {
    return String(s || '')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .replace(/[\u{2600}-\u{27BF}]/gu, '')
      .replace(/[\u{2B00}-\u{2BFF}]/gu, '')
      .replace(/\s+/g, ' ').trim();
  }
  function conclusionColor(label) {
    const s = String(label || '').toUpperCase();
    if (s.includes('HIGHLY')) return [22, 101, 52];
    if (s.includes('FAIRLY')) return [217, 119, 6];
    if (s.includes('NOT'))    return [220, 38, 38];
    if (s.includes('RECOMMENDED')) return [22, 163, 74];
    return [71, 85, 105];
  }

  async function fetchInterviewData(candidateName) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      throw new Error('Firebase belum siap');
    }
    const slug = candidateSlug(candidateName);
    const snap = await firebase.database()
      .ref('sgs_interviews/' + slug).once('value');
    const data = snap.val() || {};
    const interviewers = Object.keys(data).sort();
    return { slug, data, interviewers };
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

  async function buildCombinedPDF(candidateName, candidatePosition, data, interviewers) {
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
    doc.setTextColor(30, 58, 138);
    doc.text('LAPORAN HASIL WAWANCARA', PW / 2, y, { align: 'center' });
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
    doc.setTextColor(30, 58, 138);
    doc.text('INFORMASI KANDIDAT', M, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    [
      ['Nama Kandidat', candidateName || '-'],
      ['Posisi Dilamar', candidatePosition || '-'],
      ['Jumlah Asesor', String(interviewers.length)],
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
    doc.setTextColor(30, 58, 138);
    doc.text('RANGKUMAN PER ASESOR', M, y);
    y += 5;

    const cols = { no: M + 2, name: M + 12, avg: M + 65, concl: M + 95 };
    doc.setFillColor(235, 242, 248);
    doc.rect(M, y - 3.5, CW, 6.5, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('No', cols.no, y);
    doc.text('Asesor', cols.name, y);
    doc.text('Rata-rata', cols.avg, y);
    doc.text('Kesimpulan', cols.concl, y);
    y += 5.5;
    doc.setFont('helvetica', 'normal');

    let overallSum = 0, overallCount = 0;
    interviewers.forEach((iv, idx) => {
      const item = data[iv] || {};
      const avg = Number(item.average) || 0;
      const concl = stripEmoji(item.conclusion || '-');
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(M, y - 3.5, CW, 5.5, 'F');
      }
      doc.setFontSize(8.5);
      doc.text(String(idx + 1), cols.no, y);
      doc.text(iv, cols.name, y);
      doc.text(fmtScore(avg), cols.avg, y);
      const cC = conclusionColor(item.conclusion);
      doc.setTextColor(cC[0], cC[1], cC[2]);
      doc.text(concl, cols.concl, y);
      doc.setTextColor(30, 41, 59);
      y += 5;
      if (avg > 0) { overallSum += avg; overallCount++; }
    });

    const overallAvg = overallCount > 0 ? overallSum / overallCount : 0;
    doc.setFillColor(225, 232, 240);
    doc.rect(M, y - 3.5, CW, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('RATA-RATA KESELURUHAN', cols.no, y);
    doc.text(fmtScore(overallAvg), cols.avg, y);
    y += 9;

    /* HALAMAN 2: TABEL KRITERIA */
    doc.addPage();
    y = M + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text('KRITERIA PENILAIAN', PW / 2, y, { align: 'center' });
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Skor 1 (Sangat Kurang) - 5 (Sangat Baik)', PW / 2, y, { align: 'center' });
    y += 6;

    const category = (data[interviewers[0]] || {}).category;
    let criteriaList = CRITERIA_ORDER[category] || [];
    if (criteriaList.length === 0) {
      criteriaList = Object.keys((data[interviewers[0]] || {}).scores || {});
    }

    const scoreColW = 13;
    const critColW = CW - (interviewers.length + 1) * scoreColW - 5;

    doc.setFillColor(235, 242, 248);
    doc.rect(M, y - 3.5, CW, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('No', M + 2, y);
    doc.text('Kriteria', M + 12, y);
    let xC = M + 12 + critColW;
    interviewers.forEach(iv => {
      doc.text(iv, xC + scoreColW / 2, y, { align: 'center' });
      xC += scoreColW;
    });
    doc.text('Rata²', xC + scoreColW / 2, y, { align: 'center' });
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    criteriaList.forEach((kriteria, idx) => {
      const wrapped = doc.splitTextToSize(kriteria, critColW - 4);
      const rowH = Math.max(7, wrapped.length * 3.5 + 2);
      if (y + rowH > PH - 20) { doc.addPage(); y = M + 5; }
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(M, y - 3.5, CW, rowH, 'F');
      }
      doc.setTextColor(30, 41, 59);
      doc.text(String(idx + 1), M + 2, y);
      wrapped.slice(0, 2).forEach((line, i) => doc.text(line, M + 12, y + i * 3.5));

      let xCs = M + 12 + critColW;
      let sum = 0, cnt = 0;
      interviewers.forEach(iv => {
        const s = (data[iv]?.scores || {})[kriteria];
        const ok = (typeof s === 'number');
        doc.text(ok ? fmtScore(s) : '-', xCs + scoreColW / 2, y, { align: 'center' });
        if (ok) { sum += s; cnt++; }
        xCs += scoreColW;
      });
      const avgK = cnt > 0 ? sum / cnt : 0;
      doc.setFont('helvetica', 'bold');
      doc.text(fmtScore(avgK), xCs + scoreColW / 2, y, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      y += rowH;
    });

    /* HALAMAN 3: CATATAN */
    doc.addPage();
    y = M + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text('CATATAN PER ASESOR', PW / 2, y, { align: 'center' });
    y += 10;

    interviewers.forEach(iv => {
      const item = data[iv] || {};
      const avg = Number(item.average) || 0;
      const concl = stripEmoji(item.conclusion || '-');
      const notes = String(item.notes || '').trim() || '(Tidak ada catatan)';
      if (y + 40 > PH - 20) { doc.addPage(); y = M + 5; }

      doc.setFillColor(235, 242, 248);
      doc.rect(M, y - 4, CW, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 58, 138);
      doc.text('Asesor: ' + iv, M + 3, y);
      doc.setFontSize(9);
      doc.text('Rata-rata: ' + fmtScore(avg), PW - M - 60, y);
      const cC = conclusionColor(item.conclusion);
      doc.setTextColor(cC[0], cC[1], cC[2]);
      doc.text(concl, PW - M - 3, y, { align: 'right' });
      y += 9;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      const wrapped = doc.splitTextToSize(notes, CW - 6);
      wrapped.forEach(line => {
        if (y > PH - 20) { doc.addPage(); y = M + 5; }
        doc.text(line, M + 3, y);
        y += 4.2;
      });
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
        deviceId: 'ivcombined_' + Date.now(),
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
        deviceId: 'ivcombined'
      }).catch(() => {});
    } catch (e) {}

    if (typeof window.__invalidateResultCache === 'function') {
      try { window.__invalidateResultCache(); } catch (e) {}
    }
  }

  /* ============================================================
     PUBLIC: dipanggil dari 00m-interview.js
     ============================================================ */
  window.autoGenerateInterviewCombined = async function (candidateName, candidatePosition) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return false;
    try {
      const { data, interviewers } = await fetchInterviewData(candidateName);
      if (interviewers.length === 0) return false;

      console.log('[INTERVIEW-COMBINED] Generate untuk', candidateName, '·', interviewers.length, 'asesor');
      const doc = await buildCombinedPDF(candidateName, candidatePosition, data, interviewers);
      const blob = doc.output('blob');
      const filename = candidateName.replace(/[^a-zA-Z0-9]/g, '-') + '-Wawancara-COMBINED.pdf';

      await uploadCombinedToGAS(blob, filename, candidateName, candidatePosition);
      console.log('[INTERVIEW-COMBINED] ✓ Uploaded:', filename);
      return true;
    } catch (e) {
      console.error('[INTERVIEW-COMBINED] Gagal:', e);
      return false;
    }
  };

  console.log('[INTERVIEW-COMBINED] ✓ Loaded — auto-generate mode');
})();