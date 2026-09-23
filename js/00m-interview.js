/* ============================================================
   js/00m-interview.js — Form Wawancara untuk Pewawancara
   ------------------------------------------------------------
   TRIGGER URL: ?interview=1&n=<nama>&p=<posisi>
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     KONFIGURASI
     ============================================================ */
  const INTERVIEWER_LIST = ['NUG', 'GUN', 'DED', 'DEF', 'NET', 'YAC', 'ALF'];

  const RATING_LABELS = {
    1: 'Sangat Kurang',
    2: 'Kurang',
    3: 'Cukup',
    4: 'Baik',
    5: 'Sangat Baik'
  };

  const CRITERIA = {
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
    ],
    it:     [],
    welder: []
  };

  /* ============================================================
     HELPER: escapeHtml — DIDEKLARASIKAN SEKALI SAJA
     ============================================================ */
  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function detectCategory(position) {
    if (!position) return null;
    const p = String(position).toLowerCase();
    if (p.includes('guru') || p.includes('dosen')) return 'guru';
    if (p.includes('admin')) return 'admin';
    if (p.includes('it ') || p === 'it' || p.includes('programmer')) return 'it';
    if (p.includes('welder') || p.includes('las')) return 'welder';
    return null;
  }

  /* ============================================================
     MODAL LINK UNTUK ADMIN — SELALU AKTIF
     Didefinisikan SEBELUM cek isInterviewMode
     ============================================================ */
  window.openInterviewLink = function (candidateName, candidatePosition) {
    const base = window.location.origin + window.location.pathname;
    const link = base + '?interview=1'
      + '&n=' + encodeURIComponent(candidateName)
      + '&p=' + encodeURIComponent(candidatePosition || '');

    const old = document.getElementById('ivLinkModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'ivLinkModal';
    modal.style.cssText = `position: fixed; inset: 0; z-index: 2147483647;
      background: rgba(10,20,35,.85); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; padding: 20px;
      font-family: Inter, system-ui, -apple-system, sans-serif;`;

    modal.innerHTML = `
      <div style="width: min(540px, 100%); background: #fff; border-radius: 22px;
        overflow: hidden; box-shadow: 0 30px 90px rgba(0,0,0,.5);">
        <div style="padding: 24px 26px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; opacity: .85; margin-bottom: 6px;">
            FORM WAWANCARA
          </div>
          <div style="font-size: 20px; font-weight: 900;">🎤 Link untuk Pewawancara</div>
        </div>
        <div style="padding: 24px 26px;">
          <div style="font-size: 13px; color: #475569; line-height: 1.65; margin-bottom: 16px;">
            Kirim link ini ke pewawancara via WhatsApp/Email.<br>
            Pewawancara buka link → isi form → klik Kirim → PDF otomatis masuk ke panel Anda.
          </div>

          <div style="padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0;
            border-radius: 12px; margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1px; margin-bottom: 6px;">
              KANDIDAT
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #1e293b;">${escapeHtml(candidateName)}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
              💼 ${escapeHtml(candidatePosition || '(tanpa posisi)')}
            </div>
          </div>

          <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1px; margin-bottom: 6px;">
            LINK WAWANCARA
          </div>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="ivLinkInput" readonly value="${link}"
              style="flex: 1; padding: 12px 14px; background: #f8fafc;
                border: 2px solid #e2e8f0; border-radius: 10px;
                font-family: 'Courier New', monospace; font-size: 12px; color: #334155;
                outline: none; box-sizing: border-box;">
            <button id="ivLinkCopy" style="padding: 12px 20px; border: 0; border-radius: 10px;
              background: linear-gradient(135deg, #16a34a, #059669); color: #fff;
              font-family: inherit; font-size: 13px; font-weight: 800; cursor: pointer;">
              📋 Copy
            </button>
          </div>

          <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button id="ivLinkOpen" style="flex: 1; padding: 12px; border: 2px solid #93c5fd;
              background: #eff6ff; color: #1e40af; border-radius: 10px;
              font-family: inherit; font-size: 13px; font-weight: 800; cursor: pointer;">
              🔗 Buka Link
            </button>
            <button id="ivLinkClose" style="flex: 1; padding: 12px; border: 0;
              background: #f1f5f9; color: #475569; border-radius: 10px;
              font-family: inherit; font-size: 13px; font-weight: 800; cursor: pointer;">
              Tutup
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('ivLinkCopy').onclick = () => {
      const input = document.getElementById('ivLinkInput');
      input.select();
      try {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(link).then(() => {
            const btn = document.getElementById('ivLinkCopy');
            const prev = btn.textContent;
            btn.textContent = '✅ Tersalin';
            setTimeout(() => { btn.textContent = prev; }, 1500);
          });
        } else {
          document.execCommand('copy');
        }
      } catch (e) {}
    };

    document.getElementById('ivLinkOpen').onclick = () => {
      window.open(link, '_blank');
    };

    document.getElementById('ivLinkClose').onclick = () => {
      modal.remove();
    };
  };

  /* ============================================================
     CEK MODE WAWANCARA — KELUAR KALAU BUKAN
     (Setelah openInterviewLink didefinisikan)
     ============================================================ */
  const url = new URL(window.location.href);
  const isInterviewMode = url.searchParams.get('interview') === '1';

  if (!isInterviewMode) return;   // ← Aman: openInterviewLink sudah didefinisikan

  const candidateName     = url.searchParams.get('n') || '(tanpa nama)';
  const candidatePosition = url.searchParams.get('p') || '';
  const category          = detectCategory(candidatePosition);

  console.log('[INTERVIEW] Mode aktif —', { candidateName, candidatePosition, category });

  /* ============================================================
     BUILD UI — MODE WAWANCARA
     ============================================================ */
  function buildUI() {
    const root = document.createElement('div');
    root.id = 'interviewRoot';
    root.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483647;
      background: linear-gradient(135deg, #f0f6fc 0%, #e6eef8 100%);
      overflow-y: auto; font-family: Inter, system-ui, -apple-system, sans-serif;
      padding: 20px;
    `;

    document.body.appendChild(root);

    if (!category || CRITERIA[category].length === 0) {
      root.innerHTML = `
        <div style="max-width: 640px; margin: 60px auto; padding: 40px 30px; background: #fff;
          border-radius: 20px; box-shadow: 0 20px 50px rgba(15,23,42,.12); text-align: center;">
          <div style="font-size: 52px; margin-bottom: 14px;">🛠️</div>
          <h1 style="margin: 0 0 12px; color: #1e293b; font-size: 22px;">Form Belum Tersedia</h1>
          <p style="color: #64748b; font-size: 14.5px; line-height: 1.65; margin: 0;">
            Form wawancara untuk posisi <b>"${escapeHtml(candidatePosition || 'ini')}"</b> belum dibuat.<br>
            Hubungi admin untuk informasi lebih lanjut.
          </p>
        </div>
      `;
      return;
    }

    const criteriaList = CRITERIA[category];

    root.innerHTML = `
      <div style="max-width: 780px; margin: 0 auto 40px;">

        <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); border-radius: 20px 20px 0 0;
          padding: 26px 30px; display: flex; align-items: center; gap: 16px;">
          <div style="width: 60px; height: 60px; flex: 0 0 60px; background: #fff; border-radius: 16px;
            display: grid; place-items: center; overflow: hidden; padding: 8px;">
            <img src="${(typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO) || 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png'}"
              alt="Logo" style="width: 100%; height: 100%; object-fit: contain;"
              onerror="this.style.display='none';this.parentElement.textContent='SGS';">
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: rgba(255,255,255,.75); margin-bottom: 4px;">
              SUGAR GROUP SCHOOLS
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -.3px;">
              🎤 Formulir Hasil Wawancara
            </h1>
          </div>
        </div>

        <div style="background: #fff; padding: 22px 30px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1.5px; margin-bottom: 10px;">
            KANDIDAT
          </div>
          <div style="font-size: 20px; font-weight: 900; color: #1e293b; margin-bottom: 4px;">
            ${escapeHtml(candidateName)}
          </div>
          <div style="font-size: 13px; color: #64748b;">
            💼 ${escapeHtml(candidatePosition || '(tanpa posisi)')}
            &nbsp;•&nbsp;
            <span style="background: #eff6ff; color: #1e40af; padding: 3px 10px; border-radius: 999px;
              font-weight: 800; font-size: 11px;">
              ${category === 'guru' ? 'KATEGORI: GURU' : 'KATEGORI: ADMINISTRATOR'}
            </span>
          </div>
        </div>

        <form id="interviewForm" style="background: #fff; padding: 26px 30px 30px; border-radius: 0 0 20px 20px;
          box-shadow: 0 20px 50px rgba(15,23,42,.08);">

          <div style="margin-bottom: 24px;">
            <label style="display: block; font-size: 12px; font-weight: 800; color: #475569;
              letter-spacing: 1px; margin-bottom: 8px;">
              NAMA PEWAWANCARA <span style="color: #dc2626;">*</span>
            </label>
            <select id="interviewerName" required
              style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px;
                font-size: 15px; font-family: inherit; background: #fff; outline: none; cursor: pointer;">
              <option value="">— Pilih Pewawancara —</option>
              ${INTERVIEWER_LIST.map(n => `<option value="${n}">${n}</option>`).join('')}
            </select>
          </div>

          <div style="margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 800; color: #475569; letter-spacing: 1px; margin-bottom: 14px;">
              PENILAIAN (Skala 1-5) <span style="color: #dc2626;">*</span>
            </div>
            <div id="criteriaList"></div>
          </div>

          <div style="margin-bottom: 24px;">
            <label style="display: block; font-size: 12px; font-weight: 800; color: #475569;
              letter-spacing: 1px; margin-bottom: 8px;">
              CATATAN PEWAWANCARA (opsional)
            </label>
            <textarea id="interviewNotes" rows="4"
              placeholder="Tulis catatan tambahan, observasi, atau hal-hal yang perlu diperhatikan..."
              style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px;
                font-size: 14.5px; font-family: inherit; resize: vertical; outline: none;
                box-sizing: border-box; line-height: 1.5;"></textarea>
          </div>

          <div style="margin-bottom: 26px;">
            <div style="font-size: 12px; font-weight: 800; color: #475569; letter-spacing: 1px; margin-bottom: 10px;">
              KESIMPULAN <span style="color: #dc2626;">*</span>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <label class="iv-conclusion" data-val="Direkomendasikan"
                style="flex: 1; min-width: 160px; padding: 14px 16px; border: 2px solid #86efac;
                  background: #f0fdf4; border-radius: 12px; cursor: pointer; text-align: center;
                  font-size: 13px; font-weight: 800; color: #166534;">
                <input type="radio" name="conclusion" value="Direkomendasikan" required style="display:none;">
                ✅ Direkomendasikan
              </label>
              <label class="iv-conclusion" data-val="Dipertimbangkan"
                style="flex: 1; min-width: 160px; padding: 14px 16px; border: 2px solid #fcd34d;
                  background: #fffbeb; border-radius: 12px; cursor: pointer; text-align: center;
                  font-size: 13px; font-weight: 800; color: #92400e;">
                <input type="radio" name="conclusion" value="Dipertimbangkan" style="display:none;">
                ⚖️ Dipertimbangkan
              </label>
              <label class="iv-conclusion" data-val="Tidak Direkomendasikan"
                style="flex: 1; min-width: 160px; padding: 14px 16px; border: 2px solid #fca5a5;
                  background: #fef2f2; border-radius: 12px; cursor: pointer; text-align: center;
                  font-size: 13px; font-weight: 800; color: #991b1b;">
                <input type="radio" name="conclusion" value="Tidak Direkomendasikan" style="display:none;">
                ❌ Tidak Direkomendasikan
              </label>
            </div>
          </div>

          <button type="submit" id="ivSubmitBtn"
            style="width: 100%; padding: 16px; border: 0; border-radius: 14px;
              background: linear-gradient(135deg, #1e3a8a, #3b82f6);
              color: #fff; font-size: 16px; font-weight: 900; font-family: inherit;
              cursor: pointer; box-shadow: 0 10px 24px rgba(30,58,138,.28);">
            📤 Kirim Hasil Wawancara
          </button>

          <div style="margin-top: 14px; text-align: center; font-size: 11.5px; color: #94a3b8;">
            Data akan di-generate jadi PDF & langsung terkirim ke admin.
          </div>
        </form>
      </div>
    `;

    const criteriaBox = document.getElementById('criteriaList');
    criteriaBox.innerHTML = criteriaList.map((label, idx) => `
      <div style="padding: 16px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px;
        margin-bottom: 10px;">
        <div style="font-size: 13px; font-weight: 800; color: #1e293b; margin-bottom: 12px;
          line-height: 1.4;">
          ${idx + 1}. ${escapeHtml(label)}
        </div>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
          ${[1, 2, 3, 4, 5].map(val => `
            <label class="iv-rating" data-crit="${idx}" data-val="${val}"
              style="position: relative; display: flex; flex-direction: column; align-items: center;
                justify-content: center; padding: 10px 6px; border: 2px solid #e2e8f0;
                background: #fff; border-radius: 10px; cursor: pointer; transition: all .15s ease;">
              <input type="radio" name="crit_${idx}" value="${val}" required style="display: none;">
              <div style="font-size: 20px; font-weight: 900; color: #1e293b; margin-bottom: 2px;">${val}</div>
              <div style="font-size: 9px; color: #64748b; font-weight: 700; text-align: center;
                line-height: 1.2;">
                ${RATING_LABELS[val].split(' ')[0]}
              </div>
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');

    criteriaBox.querySelectorAll('.iv-rating').forEach(lbl => {
      lbl.addEventListener('click', () => {
        const crit = lbl.getAttribute('data-crit');
        criteriaBox.querySelectorAll(`.iv-rating[data-crit="${crit}"]`).forEach(x => {
          x.style.borderColor = '#e2e8f0';
          x.style.background = '#fff';
          x.style.boxShadow = 'none';
        });
        lbl.style.borderColor = '#3b82f6';
        lbl.style.background = '#eff6ff';
        lbl.style.boxShadow = '0 0 0 3px rgba(59,130,246,.12)';
      });
    });

    document.querySelectorAll('.iv-conclusion').forEach(lbl => {
      lbl.addEventListener('click', () => {
        document.querySelectorAll('.iv-conclusion').forEach(x => {
          x.style.transform = 'scale(1)';
        });
        lbl.style.transform = 'scale(1.02)';
      });
    });

    document.getElementById('interviewForm').onsubmit = handleSubmit;
  }

  /* ============================================================
     HANDLE SUBMIT
     ============================================================ */
  async function handleSubmit(e) {
    e.preventDefault();

    const interviewer = document.getElementById('interviewerName').value.trim();
    if (!interviewer) { alert('Pilih nama pewawancara dulu.'); return; }

    const criteriaList = CRITERIA[category];
    const scores = {};

    for (let i = 0; i < criteriaList.length; i++) {
      const checked = document.querySelector(`input[name="crit_${i}"]:checked`);
      if (!checked) {
        alert(`Kriteria #${i + 1} belum dinilai.`);
        const box = document.querySelector(`.iv-rating[data-crit="${i}"]`);
        if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      scores[criteriaList[i]] = Number(checked.value);
    }

    const conclusionEl = document.querySelector('input[name="conclusion"]:checked');
    if (!conclusionEl) { alert('Pilih kesimpulan dulu.'); return; }
    const conclusion = conclusionEl.value;

    const notes = document.getElementById('interviewNotes').value.trim();

    const btn = document.getElementById('ivSubmitBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Mengirim...';

    try {
      await saveToFirebase(interviewer, scores, notes, conclusion);

      btn.textContent = '📄 Membuat PDF...';
      const pdfBlob = await generateInterviewPDF(interviewer, scores, notes, conclusion);

      btn.textContent = '📤 Mengupload...';
      await uploadToGAS(pdfBlob, interviewer);

      showSuccess(interviewer);

    } catch (err) {
      console.error('[INTERVIEW] Gagal:', err);
      alert('❌ Gagal mengirim: ' + (err.message || 'Coba lagi'));
      btn.disabled = false;
      btn.textContent = '📤 Kirim Hasil Wawancara';
    }
  }

  async function saveToFirebase(interviewer, scores, notes, conclusion) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    const slug = candidateName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

    const payload = {
      candidateName,
      candidatePosition,
      category,
      interviewerName: interviewer,
      scores,
      notes,
      conclusion,
      ts: firebase.database.ServerValue.TIMESTAMP
    };

    await firebase.database()
      .ref('sgs_interviews/' + slug + '/' + interviewer)
      .set(payload);

    console.log('[INTERVIEW] ✅ Saved to Firebase');
  }

  async function generateInterviewPDF(interviewer, scores, notes, conclusion) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('jsPDF belum siap');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    try {
      const logoUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO)
        || 'https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png';

      const imgData = await fetchImageAsDataURL(logoUrl);
      doc.addImage(imgData, 'PNG', pageW / 2 - 12, 10, 24, 20);
    } catch (e) {
      console.warn('[INTERVIEW] Logo gagal load:', e.message);
    }

    let y = 38;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('FORMULIR HASIL WAWANCARA', pageW / 2, y, { align: 'center' });
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('SUGAR GROUP SCHOOLS', pageW / 2, y, { align: 'center' });
    y += 10;

    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMASI KANDIDAT', 15, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);

    const tanggal = new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    const infoRows = [
      ['Nama Kandidat', candidateName],
      ['Posisi Dilamar', candidatePosition || '-'],
      ['Kategori', category === 'guru' ? 'Guru' : 'Administrator'],
      ['Pewawancara', interviewer],
      ['Tanggal Wawancara', tanggal]
    ];

    infoRows.forEach(([label, value]) => {
      doc.text(label + ' :', 18, y);
      doc.text(String(value), 65, y);
      y += 5.5;
    });

    y += 3;

    doc.setDrawColor(220);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('HASIL PENILAIAN (Skala 1-5)', 15, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const criteriaList = CRITERIA[category];
    let total = 0;

    criteriaList.forEach((label, idx) => {
      const val = scores[label];
      total += val;

      const labelWrapped = doc.splitTextToSize(`${idx + 1}. ${label}`, 130);
      const lineHeight = labelWrapped.length * 4.5;

      if (y + lineHeight + 8 > pageH - 40) {
        doc.addPage();
        y = 20;
      }

      labelWrapped.forEach((line, i) => {
        doc.text(line, 18, y + i * 4.5);
      });

      const ratingText = `${val} - ${RATING_LABELS[val]}`;
      doc.setFont('helvetica', 'bold');
      doc.text(ratingText, pageW - 18, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      y += lineHeight + 2.5;
    });

    const avg = (total / criteriaList.length).toFixed(2);
    const avgLabel = avg >= 4.5 ? 'Sangat Baik' :
                     avg >= 3.5 ? 'Baik' :
                     avg >= 2.5 ? 'Cukup' :
                     avg >= 1.5 ? 'Kurang' : 'Sangat Kurang';

    y += 4;
    doc.setDrawColor(200);
    doc.line(15, y, pageW - 15, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`RATA-RATA: ${avg} (${avgLabel})`, 18, y);
    y += 10;

    if (notes) {
      doc.setFontSize(10);
      doc.text('CATATAN PEWAWANCARA:', 15, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const wrappedNotes = doc.splitTextToSize(notes, pageW - 36);
      wrappedNotes.forEach(line => {
        if (y > pageH - 40) { doc.addPage(); y = 20; }
        doc.text(line, 18, y);
        y += 4.5;
      });
      y += 6;
    }

    if (y > pageH - 40) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('KESIMPULAN:', 15, y);
    y += 6;

    doc.setFontSize(11);
    const conclusionColor = conclusion === 'Direkomendasikan' ? [22, 163, 74] :
                            conclusion === 'Dipertimbangkan' ? [217, 119, 6] :
                            [220, 38, 38];
    doc.setTextColor(...conclusionColor);
    doc.text('☑ ' + conclusion.toUpperCase(), 18, y);
    doc.setTextColor(0, 0, 0);
    y += 14;

    if (y > pageH - 50) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Pewawancara,', pageW - 60, y);
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(interviewer, pageW - 60, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('(Pewawancara)', pageW - 60, y + 4);

    return doc.output('blob');
  }

  async function uploadToGAS(pdfBlob, interviewer) {
    const GAS_URL = (typeof GAS_UPLOAD_URL !== 'undefined' && GAS_UPLOAD_URL)
      || 'https://script.google.com/macros/s/AKfycbxCryXLdQXXbB2k6qxkmbZJF-L2ltL-QgTUygKLFAg0UNVm3NfKHDgso9nB-NomM4en/exec';

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });

    const cleanName = candidateName.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${cleanName}-Wawancara-${interviewer}.pdf`;

    const payload = {
      action: 'upload',
      deviceId: 'interview_' + Date.now(),
      filename: filename,
      name: candidateName,
      position: candidatePosition,
      email: '',
      pdfBase64: base64,
      pdfPassword: '-'
    };

    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    await new Promise(r => setTimeout(r, 1500));
    console.log('[INTERVIEW] ✅ Uploaded to GAS');
  }

  async function fetchImageAsDataURL(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const blob = await r.blob();
    return await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(blob);
    });
  }

  function showSuccess(interviewer) {
    document.body.innerHTML = `
      <div style="position: fixed; inset: 0; z-index: 2147483647;
        background: linear-gradient(135deg, #065f46, #16a34a);
        display: flex; align-items: center; justify-content: center; padding: 20px;
        font-family: Inter, system-ui, -apple-system, sans-serif;">
        <div style="max-width: 480px; width: 100%; background: #fff;
          border-radius: 24px; padding: 40px 32px; text-align: center;
          box-shadow: 0 30px 90px rgba(0,0,0,.5);">
          <div style="width: 80px; height: 80px; margin: 0 auto 20px;
            display: grid; place-items: center; background: linear-gradient(135deg, #d1fae5, #ecfdf5);
            border: 3px solid #86efac; border-radius: 24px; font-size: 40px;">✅</div>
          <h1 style="margin: 0 0 12px; color: #065f46; font-size: 22px; font-weight: 900;">
            Terima Kasih!
          </h1>
          <p style="margin: 0 0 20px; color: #475569; font-size: 14.5px; line-height: 1.65;">
            Hasil wawancara Anda sudah terkirim ke admin.<br>
            PDF otomatis dibuat & tersimpan.
          </p>
          <div style="padding: 14px 16px; background: #f0fdf4; border: 1px solid #bbf7d0;
            border-radius: 12px; text-align: left; font-size: 13px; color: #166534; line-height: 1.7;">
            <div><b>Pewawancara:</b> ${escapeHtml(interviewer)}</div>
            <div><b>Kandidat:</b> ${escapeHtml(candidateName)}</div>
            <div><b>Waktu:</b> ${new Date().toLocaleString('id-ID')}</div>
          </div>
          <button onclick="window.close()" style="margin-top: 22px; width: 100%; padding: 14px;
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            color: #fff; border: 0; border-radius: 12px;
            font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer;">
            Tutup Halaman
          </button>
        </div>
      </div>
    `;
  }

  buildUI();

})();
