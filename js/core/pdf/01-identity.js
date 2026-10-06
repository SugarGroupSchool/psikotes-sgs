/* =========================================================
   js/core/pdf/01-identity.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — 2026-10-06
   
   Render: IDENTITAS PESERTA + Alumni SGS
   Call:   window.PDF_SECTIONS.identity(doc, pageWidth, startY, appState)
   Return: ySection (untuk dilanjutkan section berikutnya)
   ========================================================= */
window.PDF_SECTIONS = window.PDF_SECTIONS || {};

window.PDF_SECTIONS.identity = function(doc, pageWidth, startY, appState) {
  /* ============================================================
         IDENTITAS
         ============================================================ */
      const col1_x = 12, col2_x = 90;
      let y = startY;
    
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
    
      
  return ySection;
};

console.log('[PDF-IDENTITY] ✓ Loaded');
