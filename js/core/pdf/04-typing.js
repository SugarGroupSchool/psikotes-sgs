/* =========================================================
   js/core/pdf/04-typing.js
   ---------------------------------------------------------
   Extracted dari js/core/pdf.js — 2026-10-06
   Section: typing
   ========================================================= */

window.PDF_SECTIONS = window.PDF_SECTIONS || {};

window.PDF_SECTIONS.typing = async function(doc, pageWidth, startY, appState) {
  let ySection = startY;

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
     SUBJECT — Soal + Jawaban
     🆕 Soal dirender dulu, baru jawaban kandidat
     ============================================================ */
  if (
    appState.completed &&
    appState.completed.SUBJECT
  ) {
    /* ---------- BAGIAN 1: SOAL ---------- */
    if (appState.subjectSelected) {
      const subj = (tests?.SUBJECT?.subjects || []).find(s => s.id === appState.subjectSelected);
  
      if (subj) {
        doc.addPage();
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        let ySoal = 22;
  
        // Judul
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('SOAL TES SUBJEK', pageW / 2, ySoal, { align: 'center' });
        ySoal += 6;
  
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(subj.name || '-', pageW / 2, ySoal, { align: 'center' });
        ySoal += 8;
  
        // Extract & render gambar soal
        const htmlQuestions = subj.questions || [];
        let soalRendered = 0;
  
        for (const q of htmlQuestions) {
          if (!q.question) continue;
  
          // Extract semua <img src="..."> dari HTML soal
          const imgUrls = [];
          const re = /<img[^>]+src=["']([^"']+)["']/gi;
          let m;
          while ((m = re.exec(q.question)) !== null) imgUrls.push(m[1]);
  
          for (const url of imgUrls) {
            try {
              // Fetch gambar → dataURL
              const imgDataUrl = await (async () => {
                const r = await fetch(url, { cache: 'no-cache' });
                if (!r.ok) throw new Error('HTTP ' + r.status);
                const blob = await r.blob();
                return await new Promise((res, rej) => {
                  const reader = new FileReader();
                  reader.onloadend = () => res(reader.result);
                  reader.onerror = rej;
                  reader.readAsDataURL(blob);
                });
              })();
  
              // Load untuk dapat dimensi
              const img = await new Promise((res, rej) => {
                const im = new window.Image();
                im.onload = () => res(im);
                im.onerror = rej;
                im.src = imgDataUrl;
              });
  
              const pxToMm = px => px * 0.264583;
              let imgWmm = pxToMm(img.naturalWidth);
              let imgHmm = pxToMm(img.naturalHeight);
  
              const maxW = pageW - 24;
              const maxH = pageH - 44;
              const scale = Math.min(maxW / imgWmm, maxH / imgHmm, 1);
              imgWmm *= scale;
              imgHmm *= scale;
  
              const x = (pageW - imgWmm) / 2;
  
              if (soalRendered > 0) doc.addPage();
              doc.addImage(imgDataUrl, 'JPEG', x, 22, imgWmm, imgHmm);
              soalRendered++;
  
            } catch (e) {
              console.warn('[PDF] Gagal render soal:', url, e.message);
            }
          }
        }
  
        if (soalRendered === 0) {
          doc.setFontSize(9);
          doc.text('(Soal tidak dapat dimuat)', pageW / 2, ySoal, { align: 'center' });
        }
      }
    }
  
    /* ---------- BAGIAN 2: JAWABAN KANDIDAT ---------- */
    if (Array.isArray(appState.subjectUpload) && appState.subjectUpload.length > 0) {
      for (let i = 0; i < appState.subjectUpload.length; i++) {
        const compressedImg = await __compressImageForPDF(appState.subjectUpload[i], 1000, 0.55);
  
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
  }
    
      

  return ySection;
};

console.log('[PDF-TYPING] ✓ Loaded');
