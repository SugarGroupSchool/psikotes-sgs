/* ============================================================
   js/00m-interview.js — Form Wawancara v2
   ------------------------------------------------------------
   - Input desimal (pakai koma atau titik)
   - Live rata-rata
   - Kesimpulan otomatis
   - PDF include semua
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     KONFIGURASI
     ============================================================ */
  const INTERVIEWER_LIST = ['NUG', 'GUN', 'DED', 'DEF', 'NET', 'YAC', 'ALF'];

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
     THRESHOLD KESIMPULAN (bisa diubah)
     ============================================================ */
  const THRESHOLDS = {
    highly: 4.5,     // ≥ 4.5  → Highly Recommended
    reco:   3.5,     // ≥ 3.5  → Recommended
    fairly: 2.5      // ≥ 2.5  → Fairly Recommended
                     // < 2.5  → Not Recommended
  };

  function getConclusion(avg) {
    if (avg >= THRESHOLDS.highly) return { label: 'HIGHLY RECOMMENDED', emoji: '🌟', color: [22, 101, 52], short: 'Highly Recommended' };
    if (avg >= THRESHOLDS.reco)   return { label: 'RECOMMENDED',        emoji: '✅', color: [22, 163, 74], short: 'Recommended' };
    if (avg >= THRESHOLDS.fairly) return { label: 'FAIRLY RECOMMENDED', emoji: '⚠️', color: [217, 119, 6], short: 'Fairly Recommended' };
    return { label: 'NOT RECOMMENDED', emoji: '❌', color: [220, 38, 38], short: 'Not Recommended' };
  }

  /* ============================================================
     HELPERS
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

  // Parse "2,97" atau "2.97" → 2.97 (number), return null kalau invalid
  function parseScore(raw) {
    if (raw === null || raw === undefined) return null;
    const s = String(raw).trim().replace(',', '.');
    if (s === '') return null;
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    if (n < 1 || n > 5) return null;
    return n;
  }

  // Format 2.97 → "2,97"
  function fmtScore(n) {
    return Number(n).toFixed(2).replace('.', ',');
  }

  // Hitung rata-rata dari array nilai
  function calcAvg(vals) {
    if (!Array.isArray(vals) || vals.length === 0) return 0;
    const valid = vals.filter(v => typeof v === 'number' && Number.isFinite(v));
    if (valid.length === 0) return 0;
    const sum = valid.reduce((a, b) => a + b, 0);
    return sum / valid.length;
  }

  /* ============================================================
     MODAL LINK UNTUK ADMIN
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

    document.getElementById('ivLinkOpen').onclick = () => window.open(link, '_blank');
    document.getElementById('ivLinkClose').onclick = () => modal.remove();
  };

  /* ============================================================
     CEK MODE WAWANCARA
     ============================================================ */
  const url = new URL(window.location.href);
  const isInterviewMode = url.searchParams.get('interview') === '1';

  if (!isInterviewMode) return;

  const candidateName     = url.searchParams.get('n') || '(tanpa nama)';
  const candidatePosition = url.searchParams.get('p') || '';
  const category          = detectCategory(candidatePosition);

  console.log('[INTERVIEW] Mode aktif —', { candidateName, candidatePosition, category });

  /* ============================================================
     STATE
     ============================================================ */
  const state = {
    scores: {},      // { index: number }
    notes: '',
  };

  /* ============================================================
     BUILD UI
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
      <div style="max-width: 820px; margin: 0 auto 40px;">

        <!-- HEADER -->
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

        <!-- KANDIDAT -->
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

        <!-- FORM -->
        <form id="interviewForm" style="background: #fff; padding: 26px 30px 30px; border-radius: 0 0 20px 20px;
          box-shadow: 0 20px 50px rgba(15,23,42,.08);">

          <!-- Pilih pewawancara -->
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

          <!-- INFO skala -->
          <div style="margin-bottom: 18px; padding: 14px 16px; background: #f0f9ff;
            border: 1px solid #bae6fd; border-radius: 12px; font-size: 12.5px; color: #075985; line-height: 1.6;">
            <b>📝 Cara mengisi:</b> Nilai tiap kriteria dengan angka <b>1 – 5</b>.<br>
            Boleh pakai <b>desimal dengan koma</b> (contoh: <code style="background:#fff;padding:1px 5px;border-radius:3px;">2,97</code>
            atau <code style="background:#fff;padding:1px 5px;border-radius:3px;">4,8</code>).
          </div>

          <!-- Kriteria -->
          <div style="margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 800; color: #475569; letter-spacing: 1px; margin-bottom: 14px;">
              PENILAIAN <span style="color: #dc2626;">*</span>
            </div>
            <div id="criteriaList"></div>
          </div>

          <!-- Live Result Box -->
          <div id="liveResultBox" style="margin-bottom: 24px; padding: 18px 20px;
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            border: 2px solid #e2e8f0; border-radius: 16px; transition: all .25s ease;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div>
                <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1.5px; margin-bottom: 4px;">
                  RATA-RATA SEMENTARA
                </div>
                <div id="liveAvgNum" style="font-size: 32px; font-weight: 900; color: #1e293b; line-height: 1;">
                  —,——
                </div>
                <div id="liveProgressText" style="font-size: 11.5px; color: #64748b; margin-top: 6px;">
                  0 dari ${criteriaList.length} kriteria terisi
                </div>
              </div>
              <div id="liveConclusionChip" style="padding: 10px 18px; border-radius: 12px;
                background: #f1f5f9; border: 1px solid #cbd5e1;
                font-size: 13px; font-weight: 900; color: #64748b; white-space: nowrap;
                transition: all .25s ease;">
                ⏳ Menunggu input
              </div>
            </div>
          </div>

          <!-- Catatan -->
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

          <!-- Submit -->
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

    // Render kriteria
    const criteriaBox = document.getElementById('criteriaList');
    criteriaBox.innerHTML = criteriaList.map((label, idx) => `
      <div style="padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px;
        margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px; font-size: 13px; font-weight: 800; color: #1e293b;
            line-height: 1.4;">
            ${idx + 1}. ${escapeHtml(label)}
          </div>
          <div style="flex: 0 0 auto; display: flex; align-items: center; gap: 8px;">
            <input type="text" class="iv-score-input" data-idx="${idx}"
              inputmode="decimal" autocomplete="off" placeholder="1,00 – 5,00"
              style="width: 110px; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 10px;
                font-family: inherit; font-size: 15px; font-weight: 800;
                text-align: center; color: #1e293b; outline: none; transition: all .15s ease;
                box-sizing: border-box;">
            <span class="iv-score-icon" style="font-size: 18px; opacity: .35;">⭕</span>
          </div>
        </div>
        <div class="iv-score-err" style="display: none; font-size: 11px; color: #dc2626;
          margin-top: 6px; font-weight: 700;"></div>
      </div>
    `).join('');

    // Attach events ke input
    criteriaBox.querySelectorAll('.iv-score-input').forEach(inp => {
      inp.addEventListener('input', onScoreInput);
      inp.addEventListener('blur', onScoreBlur);
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') e.preventDefault();
      });
    });

    document.getElementById('interviewForm').onsubmit = handleSubmit;
  }

  /* ============================================================
     SCORE INPUT HANDLER
     ============================================================ */
  function onScoreInput(e) {
    const inp = e.target;
    const idx = Number(inp.getAttribute('data-idx'));

    // Biarkan user mengetik bebas (angka, koma, titik)
    let raw = inp.value;

    // Hanya izinkan angka, koma, titik
    raw = raw.replace(/[^0-9.,]/g, '');

    // Kalau ada lebih dari 1 koma/titik, ambil yang pertama
    const m = raw.match(/^[0-9]*[.,]?[0-9]*/);
    if (m) raw = m[0];

    if (raw !== inp.value) {
      const selStart = inp.selectionStart;
      inp.value = raw;
      try { inp.setSelectionRange(selStart, selStart); } catch (err) {}
    }

    // Parse & update state
    const parsed = parseScore(raw);
    if (parsed !== null) {
      state.scores[idx] = parsed;
      inp.style.borderColor = '#86efac';
      inp.style.background = '#f0fdf4';
      inp.style.color = '#166534';

      const iconEl = inp.parentElement.querySelector('.iv-score-icon');
      if (iconEl) iconEl.textContent = '✅';

      const card = inp.closest('div').parentElement;
      const errEl = card ? card.querySelector('.iv-score-err') : null;
      if (errEl) errEl.style.display = 'none';
    } else {
      delete state.scores[idx];
      inp.style.borderColor = raw ? '#fca5a5' : '#e2e8f0';
      inp.style.background = raw ? '#fef2f2' : '#fff';
      inp.style.color = '#1e293b';

      const iconEl = inp.parentElement.querySelector('.iv-score-icon');
      if (iconEl) iconEl.textContent = raw ? '❌' : '⭕';
    }

    updateLiveResult();
  }

  function onScoreBlur(e) {
    const inp = e.target;
    const idx = Number(inp.getAttribute('data-idx'));
    const parsed = parseScore(inp.value);

    if (parsed === null && inp.value.trim() !== '') {
      const card = inp.closest('div').parentElement;
      const errEl = card ? card.querySelector('.iv-score-err') : null;
      if (errEl) {
        errEl.textContent = '⚠️ Nilai harus antara 1 – 5 (contoh: 3,5 atau 4,25)';
        errEl.style.display = 'block';
      }
    } else if (parsed !== null) {
      // Auto-format saat blur
      inp.value = fmtScore(parsed);
      state.scores[idx] = parsed;
      updateLiveResult();
    }
  }

  /* ============================================================
     UPDATE LIVE RESULT
     ============================================================ */
  function updateLiveResult() {
    const criteriaList = CRITERIA[category];
    const total = criteriaList.length;
    const filled = Object.keys(state.scores).length;
    const vals = Object.values(state.scores);
    const avg = calcAvg(vals);

    const numEl = document.getElementById('liveAvgNum');
    const progEl = document.getElementById('liveProgressText');
    const chipEl = document.getElementById('liveConclusionChip');
    const boxEl = document.getElementById('liveResultBox');

    if (numEl) numEl.textContent = filled > 0 ? fmtScore(avg) : '—,——';
    if (progEl) progEl.textContent = `${filled} dari ${total} kriteria terisi`;

    if (chipEl && boxEl) {
      if (filled === total && total > 0) {
        const c = getConclusion(avg);
        chipEl.textContent = c.emoji + ' ' + c.short;
        chipEl.style.background = `rgba(${c.color[0]}, ${c.color[1]}, ${c.color[2]}, .12)`;
        chipEl.style.border = `1px solid rgba(${c.color[0]}, ${c.color[1]}, ${c.color[2]}, .4)`;
        chipEl.style.color = `rgb(${c.color[0]}, ${c.color[1]}, ${c.color[2]})`;
        boxEl.style.border = `2px solid rgba(${c.color[0]}, ${c.color[1]}, ${c.color[2]}, .35)`;
        boxEl.style.background = `linear-gradient(135deg, #fff, rgba(${c.color[0]}, ${c.color[1]}, ${c.color[2]}, .04))`;
      } else if (filled > 0) {
        chipEl.textContent = `⏳ ${filled}/${total} terisi`;
        chipEl.style.background = '#fef3c7';
        chipEl.style.border = '1px solid #fde68a';
        chipEl.style.color = '#92400e';
        boxEl.style.border = '2px solid #e2e8f0';
        boxEl.style.background = 'linear-gradient(135deg, #f8fafc, #f1f5f9)';
      } else {
        chipEl.textContent = '⏳ Menunggu input';
        chipEl.style.background = '#f1f5f9';
        chipEl.style.border = '1px solid #cbd5e1';
        chipEl.style.color = '#64748b';
        boxEl.style.border = '2px solid #e2e8f0';
        boxEl.style.background = 'linear-gradient(135deg, #f8fafc, #f1f5f9)';
      }
    }
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
      const inp = document.querySelector(`.iv-score-input[data-idx="${i}"]`);
      const raw = inp ? inp.value : '';
      const parsed = parseScore(raw);

      if (parsed === null) {
        alert(`Kriteria #${i + 1} belum diisi atau nilainya tidak valid (harus 1 – 5).`);
        if (inp) {
          inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
          inp.focus();
        }
        return;
      }
      scores[criteriaList[i]] = parsed;
    }

    const notes = document.getElementById('interviewNotes').value.trim();

    const vals = Object.values(scores);
    const avg = calcAvg(vals);
    const conclusion = getConclusion(avg);

    const btn = document.getElementById('ivSubmitBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Mengirim...';

    try {
      await saveToFirebase(interviewer, scores, notes, avg, conclusion);

      btn.textContent = '📄 Membuat PDF...';
      const pdfBlob = await generateInterviewPDF(interviewer, scores, notes, avg, conclusion);

      btn.textContent = '📤 Mengupload...';
      await uploadToGAS(pdfBlob, interviewer);

      showSuccess(interviewer, avg, conclusion);

    } catch (err) {
      console.error('[INTERVIEW] Gagal:', err);
      alert('❌ Gagal mengirim: ' + (err.message || 'Coba lagi'));
      btn.disabled = false;
      btn.textContent = '📤 Kirim Hasil Wawancara';
    }
  }

  /* ============================================================
     SAVE TO FIREBASE
     ============================================================ */
  async function saveToFirebase(interviewer, scores, notes, avg, conclusion) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    const slug = candidateName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

    const payload = {
      candidateName,
      candidatePosition,
      category,
      interviewerName: interviewer,
      scores,
      notes,
      average: Number(avg.toFixed(2)),
      conclusion: conclusion.label,
      ts: firebase.database.ServerValue.TIMESTAMP
    };

    await firebase.database()
      .ref('sgs_interviews/' + slug + '/' + interviewer)
      .set(payload);

    console.log('[INTERVIEW] ✅ Saved to Firebase');
  }

  /* ============================================================
     GENERATE PDF
     ============================================================ */
  async function generateInterviewPDF(interviewer, scores, notes, avg, conclusion) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('jsPDF belum siap');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Logo
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
    doc.text('HASIL PENILAIAN (Skala 1,00 - 5,00)', 15, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const criteriaList = CRITERIA[category];

    criteriaList.forEach((label, idx) => {
      const val = scores[label];

      const labelWrapped = doc.splitTextToSize(`${idx + 1}. ${label}`, 130);
      const lineHeight = labelWrapped.length * 4.5;

      if (y + lineHeight + 8 > pageH - 40) {
        doc.addPage();
        y = 20;
      }

      labelWrapped.forEach((line, i) => {
        doc.text(line, 18, y + i * 4.5);
      });

      const ratingText = fmtScore(val);
      doc.setFont('helvetica', 'bold');
      doc.text(ratingText, pageW - 18, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      y += lineHeight + 2.5;
    });

    // Rata-rata
    y += 4;
    doc.setDrawColor(200);
    doc.line(15, y, pageW - 15, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`RATA-RATA: ${fmtScore(avg)}`, 18, y);
    y += 10;

    // Kesimpulan (warna)
    if (y > pageH - 40) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('KESIMPULAN:', 15, y);
    y += 6;

    doc.setFontSize(12);
    doc.setTextColor(...conclusion.color);
    doc.text(conclusion.emoji + '  ' + conclusion.label, 18, y);
    doc.setTextColor(0, 0, 0);
    y += 12;

    // Catatan
    if (notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
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

    // Tanda tangan
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

  /* ============================================================
     UPLOAD KE GAS
     ============================================================ */
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

  /* ============================================================
     SHOW SUCCESS
     ============================================================ */
  function showSuccess(interviewer, avg, conclusion) {
    document.body.innerHTML = `
      <div style="position: fixed; inset: 0; z-index: 2147483647;
        background: linear-gradient(135deg, #065f46, #16a34a);
        display: flex; align-items: center; justify-content: center; padding: 20px;
        font-family: Inter, system-ui, -apple-system, sans-serif;">
        <div style="max-width: 520px; width: 100%; background: #fff;
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

          <div style="padding: 16px 18px; background: #f0fdf4; border: 1px solid #bbf7d0;
            border-radius: 14px; text-align: left; font-size: 13px; color: #166534; line-height: 1.9;">
            <div><b>Pewawancara:</b> ${escapeHtml(interviewer)}</div>
            <div><b>Kandidat:</b> ${escapeHtml(candidateName)}</div>
            <div><b>Waktu:</b> ${new Date().toLocaleString('id-ID')}</div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #86efac;">
              <div><b>Rata-rata:</b> <span style="font-size: 18px; font-weight: 900;">${fmtScore(avg)}</span></div>
              <div style="color: rgb(${conclusion.color[0]}, ${conclusion.color[1]}, ${conclusion.color[2]});
                font-weight: 900; font-size: 14px; margin-top: 4px;">
                ${conclusion.emoji} ${conclusion.label}
              </div>
            </div>
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

  /* ============================================================
     INIT
     ============================================================ */
  buildUI();

})();
