/* ============================================================
   js/00x4-excel-assessor.js — Excel Manual Scoring (Admin)
   ------------------------------------------------------------
   Modal scoring untuk admin: 6 pertanyaan × skor 1-5
   Save ke sgs_excel_assessments/{slug}/assessments/ADMIN
   ============================================================ */
(function () {
  'use strict';

  const EXCEL_QUESTIONS_DATA = [
    {
      id: 'q1_average', num: 1,
      title: 'Hitung rata-rata nilai tiap siswa',
      task: 'Menggunakan fungsi =AVERAGE(...) dan menambahkan kolom Nilai Rata-rata',
      criteria: 'Rumus AVERAGE benar · Referensi sel tepat sesuai baris · Hasil sesuai nilai siswa',
      rubric: {
        1: 'Tidak membuat / rumus salah total',
        2: 'Rumus ada tapi salah referensi',
        3: 'Rumus benar sebagian data',
        4: 'Rumus benar dan hasil akurat di semua baris',
        5: 'Rumus benar, hasil akurat, dan penulisan konsisten (format angka rapi)'
      }
    },
    {
      id: 'q2_countif', num: 2,
      title: 'Jumlah siswa dengan rata-rata > 80',
      task: 'Menggunakan =COUNTIF(...)',
      criteria: 'Fungsi COUNTIF benar · Kriteria (>80) tepat · Hasil sesuai data rata-rata',
      rubric: {
        1: 'Tidak membuat',
        2: 'Fungsi salah / argumen terbalik',
        3: 'Fungsi benar tapi range tidak lengkap',
        4: 'Fungsi benar dan hasil akurat',
        5: 'Fungsi benar, hasil akurat, dan cell hasil diberi label informatif ("Jumlah siswa >80")'
      }
    },
    {
      id: 'q3_if', num: 3,
      title: 'Kolom "Keterangan" (Lulus / Remedial)',
      task: 'Menggunakan =IF(...) dengan logika nilai ≥75',
      criteria: 'Logika benar (≥75 → Lulus; selain itu → Remedial) · Diterapkan konsisten di semua baris · Hasil sesuai nilai rata-rata',
      rubric: {
        1: 'Tidak membuat',
        2: 'Logika terbalik / salah operator',
        3: 'Fungsi benar sebagian',
        4: 'Fungsi benar seluruhnya',
        5: 'Fungsi benar, hasil rapi, ejaan seragam, format teks konsisten'
      }
    },
    {
      id: 'q4_rekap', num: 4,
      title: 'Rekap jumlah siswa per kelas (7A, 7B, 7C)',
      task: 'Menggunakan =COUNTIF(...) di sheet Data Siswa',
      criteria: 'Range data sesuai kelas tepat · Kriteria tiap kelas benar · Hasil rekap sesuai jumlah siswa per kelas',
      rubric: {
        1: 'Tidak membuat',
        2: 'COUNTIF salah rumus / salah kriteria',
        3: 'COUNTIF benar untuk sebagian kelas',
        4: 'COUNTIF benar untuk semua kelas',
        5: 'COUNTIF benar, hasil disajikan dalam tabel rapi (judul, garis, posisi sejajar)'
      }
    },
    {
      id: 'q5_sort', num: 5,
      title: 'Urutkan data berdasarkan rata-rata tertinggi',
      task: 'Menggunakan fitur Sort Descending',
      criteria: 'Data diurutkan benar dari nilai tertinggi ke rendah · Seluruh baris ikut terurut · Tabel dan header tidak rusak',
      rubric: {
        1: 'Tidak diurutkan',
        2: 'Urut sebagian / salah kolom',
        3: 'Urut benar tapi baris tidak ikut',
        4: 'Urut benar, tabel tetap utuh',
        5: 'Urut benar, tabel utuh, tampilan rapi (header, border, warna tidak rusak)'
      }
    },
    {
      id: 'q6_maxmin', num: 6,
      title: 'Nilai tertinggi & terendah dari kolom Nilai Rata-rata',
      task: 'Menggunakan =MAX(range) dan =MIN(range)',
      criteria: 'Fungsi MAX dan MIN benar · Range tepat · Hasil sesuai data',
      rubric: {
        1: 'Tidak membuat',
        2: 'Salah fungsi / salah range',
        3: 'Satu fungsi benar, satu salah',
        4: 'Keduanya benar dan hasil akurat',
        5: 'Keduanya benar dan diberi label informatif ("Nilai Tertinggi", "Nilai Terendah")'
      }
    }
  ];

  const RATING_COLORS = {
    1: { bg: 'rgba(239,68,68,.15)',  border: 'rgba(239,68,68,.5)',  color: '#fca5a5', label: 'Kurang' },
    2: { bg: 'rgba(249,115,22,.15)', border: 'rgba(249,115,22,.5)', color: '#fdba74', label: 'Cukup' },
    3: { bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.5)', color: '#fcd34d', label: 'Sedang' },
    4: { bg: 'rgba(34,197,94,.15)',  border: 'rgba(34,197,94,.5)',  color: '#86efac', label: 'Baik' },
    5: { bg: 'rgba(13,148,136,.18)', border: 'rgba(13,148,136,.55)',color: '#5eead4', label: 'Sangat Baik' }
  };

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function fbReady() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
  }

  function getRatingCategory(score) {
    const v = Number(score) || 0;
    if (v >= 85) return { label: 'HIGHLY RECOMMENDED', short: 'Highly', icon: '🌟', color: '#5eead4', bg: 'rgba(13,148,136,.2)', border: 'rgba(13,148,136,.55)' };
    if (v >= 70) return { label: 'RECOMMENDED',        short: 'Rec',    icon: '✅', color: '#86efac', bg: 'rgba(34,197,94,.15)',  border: 'rgba(34,197,94,.45)' };
    if (v >= 55) return { label: 'FAIRLY RECOMMENDED', short: 'Fairly', icon: '⚠️', color: '#fcd34d', bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.45)' };
    return                  { label: 'NOT RECOMMENDED',    short: 'Not',    icon: '❌', color: '#fca5a5', bg: 'rgba(239,68,68,.15)',  border: 'rgba(239,68,68,.45)' };
  }
  window.__excelGetRatingCategory = getRatingCategory;

  async function fetchExisting(slug) {
    if (!fbReady()) return null;
    try {
      const snap = await firebase.database().ref('sgs_excel_assessments/' + slug + '/assessments/ADMIN').once('value');
      return snap.val() || null;
    } catch (e) { return null; }
  }

  async function saveAssessment(slug, name, position, scores, notes) {
    if (!fbReady()) throw new Error('Firebase belum siap');
    const values = Object.values(scores).filter(v => typeof v === 'number' && v >= 1 && v <= 5);
    if (values.length !== EXCEL_QUESTIONS_DATA.length) {
      throw new Error('Semua ' + EXCEL_QUESTIONS_DATA.length + ' pertanyaan harus diisi');
    }
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const finalScore = (avg / 5) * 100;
    const cat = getRatingCategory(finalScore);

    await firebase.database().ref('sgs_excel_assessments/' + slug).update({
      candidateName: name,
      candidatePosition: position || '',
      ts: firebase.database.ServerValue.TIMESTAMP
    });

    await firebase.database().ref('sgs_excel_assessments/' + slug + '/assessments/ADMIN').set({
      assessorName: 'ADMIN',
      scores: scores,
      notes: notes || '',
      averageScore: Number(avg.toFixed(2)),
      finalScore: Number(finalScore.toFixed(2)),
      rating: cat.label,
      ts: firebase.database.ServerValue.TIMESTAMP
    });

    return { avg, finalScore, cat };
  }

  window.__openExcelScoringModal = async function (slug, name, position) {
    const old = document.getElementById('excelScoringModal');
    if (old) old.remove();

    const existing = await fetchExisting(slug);
    const files = (window.__candidateFilesMap && window.__candidateFilesMap[slug]) || [];
    const excelFile = files.find(f => /\.xlsx?$/i.test(f.name || '')) || null;

    const state = {
      scores: existing && existing.scores ? Object.assign({}, existing.scores) : {},
      notes: existing && existing.notes ? existing.notes : ''
    };

    const overlay = document.createElement('div');
    overlay.id = 'excelScoringModal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

    const existingBadge = existing
      ? `<div style="padding:5px 12px;background:rgba(34,197,94,.2);border:1px solid rgba(34,197,94,.5);border-radius:999px;font-size:10.5px;font-weight:800;color:#86efac;">✓ Sudah Dinilai</div>`
      : `<div style="padding:5px 12px;background:rgba(245,158,11,.2);border:1px solid rgba(245,158,11,.5);border-radius:999px;font-size:10.5px;font-weight:800;color:#fcd34d;">⏳ Belum Dinilai</div>`;

    const fileLink = excelFile
      ? `<a href="${esc(excelFile.url)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;text-decoration:none;border-radius:10px;font-size:12.5px;font-weight:800;box-shadow:0 4px 12px rgba(34,197,94,.3);">
          <span style="font-size:16px;">📊</span>
          <span>Buka File Excel: ${esc(String(excelFile.name).slice(0, 50))}${excelFile.name.length > 50 ? '...' : ''}</span>
          <span style="font-size:14px;">↗</span>
        </a>`
      : `<div style="padding:10px 16px;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.4);border-radius:10px;color:#fca5a5;font-size:12px;font-weight:700;">⚠️ File Excel belum terupload / tidak ditemukan</div>`;

    overlay.innerHTML = `
      <div style="width:min(900px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(34,197,94,.4);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.7);color:#e2e8f0;">
        <div style="padding:16px 20px;background:linear-gradient(135deg,#16a34a,#059669);display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <div style="width:42px;height:42px;display:grid;place-items:center;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:11px;font-size:20px;">📊</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;margin-bottom:2px;">EXCEL SCORING · ADMIN</div>
            <div style="font-size:16px;font-weight:900;color:#fff;word-break:break-word;">${esc(name)}</div>
            ${position && position !== '-' ? `<div style="font-size:11px;opacity:.85;margin-top:2px;">💼 ${esc(position)}</div>` : ''}
          </div>
          ${existingBadge}
          <button id="excelScoringClose" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>
        </div>

        <div style="padding:12px 20px;background:rgba(0,0,0,.3);border-bottom:1px solid rgba(255,255,255,.08);">
          ${fileLink}
        </div>

        <div id="excelScoringBody" style="flex:1;overflow-y:auto;padding:20px;">
          <div style="margin-bottom:16px;padding:12px 14px;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.35);border-radius:10px;font-size:12px;color:#93c5fd;line-height:1.6;">
            <b>ℹ️ Petunjuk:</b> Beri skor <b>1–5</b> untuk tiap pertanyaan. Klik <b>▼ Lihat rubrik</b> untuk melihat kriteria penilaian per level.
          </div>

          <div id="excelQuestionList">
            ${EXCEL_QUESTIONS_DATA.map((q) => {
              const current = state.scores[q.id] || 0;
              return `
                <div class="excel-q-card" data-qid="${q.id}" style="padding:14px 16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;margin-bottom:10px;">
                  <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
                    <div style="width:32px;height:32px;flex:0 0 32px;display:grid;place-items:center;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border-radius:9px;font-size:13px;font-weight:900;">${q.num}</div>
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:13.5px;font-weight:800;color:#fff;margin-bottom:4px;">${esc(q.title)}</div>
                      <div style="font-size:11px;color:#94a3b8;line-height:1.5;"><b style="color:#cbd5e1;">Tugas:</b> ${esc(q.task)}</div>
                      <div style="font-size:11px;color:#94a3b8;line-height:1.5;margin-top:2px;"><b style="color:#cbd5e1;">Kriteria:</b> ${esc(q.criteria)}</div>
                    </div>
                  </div>
                  <button type="button" class="excel-q-rubric-toggle" data-qid="${q.id}" style="padding:6px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:7px;color:#cbd5e1;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;margin-bottom:10px;">▼ Lihat rubrik penilaian</button>
                  <div class="excel-q-rubric" data-qid="${q.id}" style="display:none;padding:10px 12px;background:rgba(0,0,0,.25);border-radius:8px;margin-bottom:10px;font-size:11px;color:#cbd5e1;line-height:1.7;">
                    ${[1,2,3,4,5].map(n => `
                      <div style="display:flex;gap:8px;margin-bottom:4px;">
                        <span style="font-weight:900;color:${RATING_COLORS[n].color};min-width:14px;">${n}</span>
                        <span>= ${esc(q.rubric[n])}</span>
                      </div>
                    `).join('')}
                  </div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${[1,2,3,4,5].map(n => {
                      const active = current === n;
                      const c = RATING_COLORS[n];
                      return `<button type="button" class="excel-score-btn" data-qid="${q.id}" data-score="${n}"
                        style="flex:1;min-width:60px;padding:10px 8px;background:${active ? c.bg : 'rgba(255,255,255,.04)'};border:2px solid ${active ? c.border : 'rgba(255,255,255,.1)'};border-radius:9px;color:${active ? c.color : '#94a3b8'};font-family:inherit;font-size:13px;font-weight:900;cursor:pointer;transition:all .15s ease;">${n}</button>`;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div style="margin-top:16px;">
            <label style="display:block;font-size:11px;font-weight:800;color:#94a3b8;letter-spacing:1px;margin-bottom:8px;">📝 CATATAN (opsional)</label>
            <textarea id="excelScoringNotes" rows="4" placeholder="Catatan tambahan untuk kandidat..." style="width:100%;padding:12px 14px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.14);border-radius:10px;color:#fff;font-family:inherit;font-size:12.5px;line-height:1.6;resize:vertical;outline:none;box-sizing:border-box;">${esc(state.notes)}</textarea>
          </div>
        </div>

        <div style="padding:14px 20px;background:rgba(0,0,0,.4);border-top:1px solid rgba(255,255,255,.08);">
          <div id="excelScoringLive" style="padding:12px 16px;background:linear-gradient(135deg,rgba(34,197,94,.1),rgba(13,148,136,.06));border:1px solid rgba(34,197,94,.35);border-radius:12px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;"></div>
          <div style="display:flex;gap:10px;">
            <button id="excelScoringCancel" style="flex:1;padding:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:11px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Batal</button>
            <button id="excelScoringSave" style="flex:2;padding:13px;background:linear-gradient(135deg,#16a34a,#059669);border:0;border-radius:11px;color:#fff;font-family:inherit;font-size:13px;font-weight:900;cursor:pointer;box-shadow:0 6px 20px rgba(22,163,74,.35);">💾 Simpan Penilaian</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const body = document.getElementById('excelScoringBody');
    const live = document.getElementById('excelScoringLive');
    const notesEl = document.getElementById('excelScoringNotes');

    function updateLiveCalc() {
      const values = Object.values(state.scores).filter(v => typeof v === 'number' && v >= 1 && v <= 5);
      const filled = values.length;
      const total = EXCEL_QUESTIONS_DATA.length;
      const avg = filled > 0 ? values.reduce((s, v) => s + v, 0) / filled : 0;
      const finalScore = (avg / 5) * 100;
      const cat = getRatingCategory(finalScore);

      live.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;flex:1;min-width:0;">
          <div>
            <div style="font-size:9.5px;font-weight:900;letter-spacing:1px;color:#64748b;margin-bottom:2px;">PROGRESS</div>
            <div style="font-size:13px;font-weight:900;color:#cbd5e1;">${filled}/${total} terisi</div>
          </div>
          <div style="width:1px;height:30px;background:rgba(255,255,255,.1);"></div>
          <div>
            <div style="font-size:9.5px;font-weight:900;letter-spacing:1px;color:#64748b;margin-bottom:2px;">RATA-RATA</div>
            <div style="font-size:15px;font-weight:900;color:#a5b4fc;font-variant-numeric:tabular-nums;">${avg.toFixed(2)}/5</div>
          </div>
          <div style="width:1px;height:30px;background:rgba(255,255,255,.1);"></div>
          <div>
            <div style="font-size:9.5px;font-weight:900;letter-spacing:1px;color:#64748b;margin-bottom:2px;">NILAI AKHIR</div>
            <div style="font-size:18px;font-weight:900;color:${cat.color};font-variant-numeric:tabular-nums;">${finalScore.toFixed(2)}</div>
          </div>
        </div>
        <div style="padding:8px 14px;border-radius:999px;font-size:12px;font-weight:900;background:${cat.bg};border:1px solid ${cat.border};color:${cat.color};white-space:nowrap;">
          ${cat.icon} ${cat.label}
        </div>
      `;
    }
    updateLiveCalc();

    const closeModal = () => overlay.remove();
    document.getElementById('excelScoringClose').onclick = closeModal;
    document.getElementById('excelScoringCancel').onclick = closeModal;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    body.querySelectorAll('.excel-score-btn').forEach(btn => {
      btn.onclick = () => {
        const qid = btn.getAttribute('data-qid');
        const score = Number(btn.getAttribute('data-score'));
        state.scores[qid] = score;
        body.querySelectorAll(`.excel-score-btn[data-qid="${qid}"]`).forEach(b => {
          const n = Number(b.getAttribute('data-score'));
          const c = RATING_COLORS[n];
          const active = n === score;
          b.style.background = active ? c.bg : 'rgba(255,255,255,.04)';
          b.style.borderColor = active ? c.border : 'rgba(255,255,255,.1)';
          b.style.color = active ? c.color : '#94a3b8';
        });
        updateLiveCalc();
      };
    });

    body.querySelectorAll('.excel-q-rubric-toggle').forEach(btn => {
      btn.onclick = () => {
        const qid = btn.getAttribute('data-qid');
        const rubric = body.querySelector(`.excel-q-rubric[data-qid="${qid}"]`);
        if (!rubric) return;
        const isOpen = rubric.style.display !== 'none';
        rubric.style.display = isOpen ? 'none' : 'block';
        btn.textContent = isOpen ? '▼ Lihat rubrik penilaian' : '▲ Sembunyikan rubrik';
      };
    });

    if (notesEl) notesEl.oninput = () => { state.notes = notesEl.value; };

    document.getElementById('excelScoringSave').onclick = async () => {
      const values = Object.values(state.scores).filter(v => typeof v === 'number' && v >= 1 && v <= 5);
      if (values.length !== EXCEL_QUESTIONS_DATA.length) {
        alert('Semua ' + EXCEL_QUESTIONS_DATA.length + ' pertanyaan harus diberi skor.');
        return;
      }
      const saveBtn = document.getElementById('excelScoringSave');
      saveBtn.disabled = true;
      saveBtn.textContent = '⏳ Menyimpan...';
      try {
        const result = await saveAssessment(slug, name, position, state.scores, state.notes);
        closeModal();

        // Refresh section di folder
        const section = document.querySelector('.rf-excel-section');
        if (section && typeof window.__fetchEXCELData === 'function' && typeof window.renderEXCELSectionHTML === 'function') {
          try {
            const excelData = await window.__fetchEXCELData(slug);
            const fileFromMap = (window.__candidateFilesMap && window.__candidateFilesMap[slug] || []).find(f => /\.xlsx?$/i.test(f.name || '')) || null;
            section.innerHTML = window.renderEXCELSectionHTML(excelData, slug, name, position, fileFromMap);
          } catch (e) { console.warn('[EXCEL-ASSESSOR] Refresh section gagal:', e.message); }
        }

        if (typeof window.showResultToast === 'function') {
          window.showResultToast('✅', 'Penilaian tersimpan', name + ' · Nilai: ' + result.finalScore.toFixed(2));
        } else {
          alert('✅ Penilaian tersimpan. Nilai: ' + result.finalScore.toFixed(2));
        }
      } catch (e) {
        alert('❌ Gagal simpan: ' + e.message);
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Simpan Penilaian';
      }
    };
  };

  if (!window.__excelScoringDelegationAttached) {
    window.__excelScoringDelegationAttached = true;
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.js-excel-score');
      if (btn) {
        e.preventDefault(); e.stopPropagation();
        const slug = btn.getAttribute('data-slug');
        const name = btn.getAttribute('data-name');
        const position = btn.getAttribute('data-position');
        if (slug && typeof window.__openExcelScoringModal === 'function') {
          window.__openExcelScoringModal(slug, name, position);
        }
      }
    }, true);
  }

  console.log('[EXCEL-ASSESSOR] ✓ Loaded');
})();