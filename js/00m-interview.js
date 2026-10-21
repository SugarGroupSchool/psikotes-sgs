/* ============================================================
   js/00m-interview.js — Form Wawancara v4 (Upload Lampiran)
   ============================================================ */
(function () {
  'use strict';

  let INTERVIEWER_LIST = ['NUG', 'GUN', 'DED', 'DEF', 'NET', 'YAC', 'ALF'];

  function __initAssessorsListener() {
    if (typeof window.ASSESSORS === 'undefined') {
      setTimeout(__initAssessorsListener, 500);
      return;
    }
    window.ASSESSORS.load('interview').then(list => {
      if (Array.isArray(list) && list.length > 0) {
        INTERVIEWER_LIST = list;
        console.log('[INTERVIEW] Interviewer dinamis:', list.join(', '));
      }
    });
    window.ASSESSORS.onChange('interview', list => {
      INTERVIEWER_LIST = list;
    });
  }
  __initAssessorsListener();

  const CRITERIA = {
    guru: [
      'COGNITIVE ABILITY & PROBLEM SOLVING', 'VERBAL COMMUNICATION & MATERIAL EXPLANATION', 'CLASSROOM MANAGEMENT & INSTRUCTIONAL LEADERSHIP', 'EMPATHY & INTERPERSONAL SKILLS', 'EMOTIONAL STABILITY & IMPULSE CONTROL', 'MOTIVATION & ACHIEVEMENT DRIVE', 'WORK DISCIPLINE & RELIABILITY', 'FLEXIBILITY, ADAPTABILITY, & LEARNING AGILITY', 'INTEGRITY & RULE COMPLIANCE', 'TEACHING CREATIVITY', 'TEACHING PRACTICE SKILLS'
    ],
    admin: [
      'Integritas & Kepatuhan terhadap Aturan', 'Akurasi & Ketelitian Kerja', 'Penguasaan Aplikasi Administrasi', 'Manajemen Waktu & Prioritas', 'Komunikasi Administratif', 'Service Orientation', 'Problem Solving', 'Inisiatif & Proaktivitas', 'Collaboration & Interpersonal Skill', 'Fleksibilitas & Adaptasi', 'Orientasi Hasil'
    ],
    it: [
      'COGNITIVE ABILITY & PROBLEM SOLVING', 'TECHNICAL SKILL & TOOL MASTERY', 'DEBUGGING & TROUBLESHOOTING', 'DOCUMENTATION & TECHNICAL COMMUNICATION', 'COLLABORATION & TEAM WORK', 'LEARNING AGILITY & ADAPTABILITY', 'TIME MANAGEMENT & DEADLINE', 'INTEGRITY & DATA ETHICS', 'INITIATIVE & PROACTIVITY', 'ATTENTION TO DETAIL', 'RESULT ORIENTATION'
    ],
    welder: [
      'TECHNICAL SKILL & WELDING PRECISION', 'SAFETY AWARENESS & PROCEDURE COMPLIANCE', 'ATTENTION TO DETAIL', 'STABILITY & PHYSICAL ENDURANCE', 'INTEGRITY & WORK DISCIPLINE', 'TEAM COLLABORATION', 'PROBLEM SOLVING DI LAPANGAN', 'WORK MOTIVATION & CONSISTENCY', 'COMMUNICATION & KOORDINASI', 'ADAPTABILITY TERHADAP PERUBAHAN', 'ORIENTASI HASIL & QUALITY'
    ],
    technical: [
      'COGNITIVE ABILITY & PROBLEM SOLVING', 'TECHNICAL SKILL & EQUIPMENT HANDLING', 'SAFETY AWARENESS & PROCEDURE COMPLIANCE', 'ATTENTION TO DETAIL & ACCURACY', 'WORK DISCIPLINE & RELIABILITY', 'TEAM COLLABORATION', 'STABILITY UNDER PRESSURE', 'INITIATIVE & PROACTIVITY', 'TIME MANAGEMENT & DEADLINE', 'ADAPTABILITY & LEARNING AGILITY', 'RESULT ORIENTATION'
    ],
    housekeeping: [
      'WORK DISCIPLINE & RELIABILITY', 'ATTENTION TO DETAIL & CLEANLINESS', 'PHYSICAL STAMINA & ENDURANCE', 'INTEGRITY & RULE COMPLIANCE', 'WORK MOTIVATION & CONSISTENCY', 'TEAM COLLABORATION', 'TIME MANAGEMENT & PUNCTUALITY', 'INITIATIVE & PROACTIVITY', 'COMMUNICATION & KOORDINASI', 'ADAPTABILITY TERHADAP PERUBAHAN', 'RESPONSIBILITY & OWNERSHIP'
    ]
  };

  const THRESHOLDS = { highly: 4.5, reco: 3.5, fairly: 2.5 };

  function getConclusion(avg) {
    if (avg >= THRESHOLDS.highly) return { label: 'HIGHLY RECOMMENDED', emoji: '🌟', color: [22, 101, 52],  short: 'Highly Recommended' };
    if (avg >= THRESHOLDS.reco)   return { label: 'RECOMMENDED',        emoji: '✅', color: [22, 163, 74],  short: 'Recommended' };
    if (avg >= THRESHOLDS.fairly) return { label: 'FAIRLY RECOMMENDED', emoji: '⚠️', color: [217, 119, 6],  short: 'Fairly Recommended' };
    return { label: 'NOT RECOMMENDED', emoji: '❌', color: [220, 38, 38], short: 'Not Recommended' };
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function cleanForPDF(s) {
    return String(s || '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/[^\x20-\x7E\n]/g, '').trim();
  }

  function detectCategory(position) {
    if (!position) return null;
    const p = String(position).toLowerCase();
    if (p.includes('guru') || p.includes('dosen')) return 'guru';
    if (p.includes('admin')) return 'admin';
    if (p.includes('it ') || p === 'it' || p.includes('programmer')) return 'it';
    if (p.includes('welder') || p.includes('las')) return 'welder';
    if (p.includes('technical')) return 'technical';
    if (p.includes('housekeeping')) return 'housekeeping';
    return null;
  }

  function parseScore(raw) {
    if (raw === null || raw === undefined) return null;
    const s = String(raw).trim().replace(',', '.');
    if (s === '') return null;
    const n = Number(s);
    if (!Number.isFinite(n) || n < 1 || n > 5) return null;
    return n;
  }

  function fmtScore(n) { return Number(n).toFixed(2).replace('.', ','); }

  function calcAvg(vals) {
    if (!Array.isArray(vals) || vals.length === 0) return 0;
    const valid = vals.filter(v => typeof v === 'number' && Number.isFinite(v));
    if (valid.length === 0) return 0;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  window.openInterviewLink = function (candidateName, candidatePosition) {
    const base = window.location.origin + window.location.pathname;
    function buildLink(iv) {
      return base + '?interview=1' + '&n=' + encodeURIComponent(candidateName) + '&p=' + encodeURIComponent(candidatePosition || '') + (iv ? '&iv=' + encodeURIComponent(iv) : '');
    }
    const old = document.getElementById('ivLinkModal');
    if (old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'ivLinkModal';
    modal.style.cssText = `position: fixed; inset: 0; z-index: 2147483647; background: rgba(10,20,35,.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; font-family: Inter, system-ui, -apple-system, sans-serif;`;
    document.body.appendChild(modal);

    function renderStep1() {
      modal.innerHTML = `
        <div style="width: min(560px, 100%); background: #fff; border-radius: 22px; overflow: hidden; box-shadow: 0 30px 90px rgba(0,0,0,.5);">
          <div style="padding: 24px 26px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; opacity: .85; margin-bottom: 6px;">FORM WAWANCARA</div>
            <div style="font-size: 20px; font-weight: 900;">🎤 Pilih Pewawancara</div>
          </div>
          <div style="padding: 22px 26px;">
            <div style="padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 18px;">
              <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1px; margin-bottom: 6px;">KANDIDAT</div>
              <div style="font-size: 14px; font-weight: 800; color: #1e293b;">${escapeHtml(candidateName)}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">💼 ${escapeHtml(candidatePosition || '(tanpa posisi)')}</div>
            </div>
            <div style="font-size: 12px; font-weight: 800; color: #475569; letter-spacing: 1px; margin-bottom: 10px;">PILIH PEWAWANCARA (bisa lebih dari satu)</div>
            <div id="ivPickList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; margin-bottom: 20px;">
              ${INTERVIEWER_LIST.map(n => `
                <label class="iv-pick-item" data-val="${n}" style="display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: #fff; border: 2px solid #e2e8f0; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 800; color: #1e293b; user-select: none; transition: all .15s ease;">
                  <input type="checkbox" value="${n}" style="width: 16px; height: 16px; accent-color: #3b82f6; cursor: pointer;">
                  <span>${n}</span>
                </label>
              `).join('')}
            </div>
            <div id="ivPickInfo" style="font-size: 12px; color: #64748b; margin-bottom: 14px; text-align: center;">Belum ada pewawancara dipilih</div>
            <div style="display: flex; gap: 10px;">
              <button id="ivGenBtn" disabled style="flex: 2; padding: 14px; border: 0; border-radius: 12px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; font-family: inherit; font-size: 14px; font-weight: 900; cursor: not-allowed; opacity: .5; box-shadow: 0 10px 24px rgba(30,58,138,.28);">🔗 Generate Link</button>
              <button id="ivCloseBtn" style="flex: 1; padding: 14px; border: 0; border-radius: 12px; background: #f1f5f9; color: #475569; font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer;">Tutup</button>
            </div>
          </div>
        </div>
      `;
      modal.querySelectorAll('.iv-pick-item').forEach(lbl => {
        const cb = lbl.querySelector('input');
        cb.addEventListener('change', () => { setTimeout(updatePickState, 0); });
      });
      document.getElementById('ivGenBtn').onclick = () => { const picked = getChecked(); if (picked.length > 0) renderStep2(picked); };
      document.getElementById('ivCloseBtn').onclick = () => modal.remove();
    }
    function getChecked() {
      const checked = [];
      modal.querySelectorAll('#ivPickList input[type="checkbox"]:checked').forEach(cb => { checked.push(cb.value); });
      return checked;
    }
    function updatePickState() {
      const picked = getChecked();
      const infoEl = document.getElementById('ivPickInfo');
      const btn = document.getElementById('ivGenBtn');
      modal.querySelectorAll('.iv-pick-item').forEach(lbl => {
        const cb = lbl.querySelector('input');
        if (cb.checked) { lbl.style.background = '#eff6ff'; lbl.style.borderColor = '#3b82f6'; lbl.style.color = '#1e40af'; }
        else { lbl.style.background = '#fff'; lbl.style.borderColor = '#e2e8f0'; lbl.style.color = '#1e293b'; }
      });
      if (picked.length === 0) {
        infoEl.textContent = 'Belum ada pewawancara dipilih'; infoEl.style.color = '#64748b'; btn.disabled = true; btn.style.opacity = '.5'; btn.style.cursor = 'not-allowed';
      } else {
        infoEl.innerHTML = `<b style="color:#1e40af;">${picked.length} pewawancara</b> dipilih: <b>${picked.join(', ')}</b>`; infoEl.style.color = '#475569'; btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer';
      }
    }
    function renderStep2(picked) {
      const links = picked.map(iv => ({ interviewer: iv, url: buildLink(iv) }));
      modal.innerHTML = `
        <div style="width: min(640px, 100%); background: #fff; border-radius: 22px; overflow: hidden; box-shadow: 0 30px 90px rgba(0,0,0,.5);">
          <div style="padding: 24px 26px; background: linear-gradient(135deg, #065f46, #16a34a); color: #fff;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; opacity: .85; margin-bottom: 6px;">LINK SIAP</div>
            <div style="font-size: 20px; font-weight: 900;">✅ ${links.length} Link Dibuat</div>
            <div style="font-size: 12px; opacity: .9; margin-top: 4px;">Kirim setiap link ke pewawancara yang sesuai.</div>
          </div>
          <div style="padding: 22px 26px;">
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px; max-height: 340px; overflow-y: auto;">
              ${links.map(l => `
                <div style="padding: 12px 14px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-size: 13px; font-weight: 900; color: #075985;">👤 Pewawancara: <span style="background:#fff;padding:3px 10px;border-radius:6px;">${escapeHtml(l.interviewer)}</span></div>
                    <button class="iv-copy-link" data-url="${l.url}" style="padding: 6px 12px; border: 0; border-radius: 7px; background: #0ea5e9; color: #fff; font-family: inherit; font-size: 11px; font-weight: 800; cursor: pointer;">📋 Copy</button>
                  </div>
                  <input type="text" readonly value="${l.url}" style="width: 100%; padding: 9px 11px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 11px; color: #334155; outline: none; box-sizing: border-box;">
                </div>
              `).join('')}
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button id="ivCopyAllBtn" style="flex: 2; padding: 14px; border: 0; border-radius: 12px; background: linear-gradient(135deg, #065f46, #16a34a); color: #fff; font-family: inherit; font-size: 14px; font-weight: 900; cursor: pointer; box-shadow: 0 10px 24px rgba(5,150,105,.28);">📋 Copy Semua Link</button>
              <button id="ivBackBtn" style="flex: 1; padding: 14px; border: 2px solid #cbd5e1; border-radius: 12px; background: #fff; color: #475569; font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer;">← Kembali</button>
              <button id="ivDoneBtn" style="flex: 1; padding: 14px; border: 0; border-radius: 12px; background: #f1f5f9; color: #475569; font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer;">Tutup</button>
            </div>
          </div>
        </div>
      `;
      modal.querySelectorAll('.iv-copy-link').forEach(btn => {
        btn.onclick = () => {
          const u = btn.getAttribute('data-url');
          try { if (navigator.clipboard) { navigator.clipboard.writeText(u).then(() => { const prev = btn.textContent; btn.textContent = '✅ Tersalin'; setTimeout(() => { btn.textContent = prev; }, 1500); }); } else { fallbackCopy(u); } } catch (e) { fallbackCopy(u); }
        };
      });
      document.getElementById('ivCopyAllBtn').onclick = () => {
        const allText = links.map(l => `${l.interviewer}: ${l.url}`).join('\n\n');
        try { if (navigator.clipboard) { navigator.clipboard.writeText(allText).then(() => { const btn = document.getElementById('ivCopyAllBtn'); const prev = btn.textContent; btn.textContent = '✅ Semua Tersalin'; setTimeout(() => { btn.textContent = prev; }, 1800); }); } else { fallbackCopy(allText); } } catch (e) { fallbackCopy(allText); }
      };
      document.getElementById('ivBackBtn').onclick = renderStep1;
      document.getElementById('ivDoneBtn').onclick = () => modal.remove();
    }
    function fallbackCopy(text) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }
    renderStep1();
  };

  const url = new URL(window.location.href);
  const isInterviewMode = url.searchParams.get('interview') === '1';
  if (isInterviewMode) { window.__GRAFIS_MODE_ACTIVE = true; }
  if (!isInterviewMode) return;

  const candidateName     = url.searchParams.get('n') || '(tanpa nama)';
  const candidatePosition = url.searchParams.get('p') || '';
  const category          = detectCategory(candidatePosition);
  const prefilledIv       = url.searchParams.get('iv') || '';

  const state = {
    scores: {},
    notePhotoBase64: null,
    notePhotoUrl: '',
    noteFileMime: '',
    noteFileName: '',
    noteFileSize: 0
  };

  function buildUI() {
    const root = document.createElement('div');
    root.id = 'interviewRoot';
    root.style.cssText = `position: fixed; inset: 0; z-index: 2147483647; background: linear-gradient(135deg, #f0f6fc 0%, #e6eef8 100%); overflow-y: auto; font-family: Inter, system-ui, -apple-system, sans-serif; padding: 20px;`;
    document.body.appendChild(root);

    if (!category || CRITERIA[category].length === 0) {
      root.innerHTML = `<div style="max-width: 640px; margin: 60px auto; padding: 40px 30px; background: #fff; border-radius: 20px; box-shadow: 0 20px 50px rgba(15,23,42,.12); text-align: center;"><div style="font-size: 52px; margin-bottom: 14px;">🛠️</div><h1 style="margin: 0 0 12px; color: #1e293b; font-size: 22px;">Form Belum Tersedia</h1><p style="color: #64748b; font-size: 14.5px; line-height: 1.65; margin: 0;">Form wawancara untuk posisi <b>"${escapeHtml(candidatePosition || 'ini')}"</b> belum dibuat.<br>Hubungi admin untuk informasi lebih lanjut.</p></div>`;
      return;
    }

    const criteriaList = CRITERIA[category];

    const interviewerBlock = prefilledIv
      ? `<div style="margin-bottom: 24px;"><div style="display: block; font-size: 12px; font-weight: 800; color: #475569; letter-spacing: 1px; margin-bottom: 8px;">NAMA PEWAWANCARA</div><div style="padding: 14px 16px; background: #eff6ff; border: 2px solid #93c5fd; border-radius: 12px; font-size: 15px; font-weight: 800; color: #1e40af; display: flex; align-items: center; gap: 10px;"><span style="font-size: 18px;">👤</span><span>${escapeHtml(prefilledIv)}</span><input type="hidden" id="interviewerName" value="${escapeHtml(prefilledIv)}"></div><div style="font-size: 11px; color: #64748b; margin-top: 6px;">Pewawancara sudah ditentukan oleh admin.</div></div>`
      : `<div style="margin-bottom: 24px;"><label style="display: block; font-size: 12px; font-weight: 800; color: #475569; letter-spacing: 1px; margin-bottom: 8px;">NAMA PEWAWANCARA <span style="color: #dc2626;">*</span></label><select id="interviewerName" required style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: inherit; background: #fff; outline: none; cursor: pointer;"><option value="">— Pilih Pewawancara —</option>${INTERVIEWER_LIST.map(n => `<option value="${n}">${n}</option>`).join('')}</select></div>`;

    root.innerHTML = `
      <div style="max-width: 820px; margin: 0 auto 40px;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); border-radius: 20px 20px 0 0; padding: 26px 30px; display: flex; align-items: center; gap: 16px;">
          <div style="width: 60px; height: 60px; flex: 0 0 60px; background: #fff; border-radius: 16px; display: grid; place-items: center; overflow: hidden; padding: 8px;">
            <img src="${(typeof APP_CONFIG !== 'undefined' && APP_CONFIG.LOGO) || 'https://cdn.jsdelivr.net/gh/Pragas123/assets@main/nmqo6a.png'}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none';this.parentElement.textContent='SGS';">
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: rgba(255,255,255,.75); margin-bottom: 4px;">SUGAR GROUP SCHOOLS</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -.3px;">🎤 Formulir Hasil Wawancara</h1>
          </div>
        </div>
        <div style="background: #fff; padding: 22px 30px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1.5px; margin-bottom: 10px;">KANDIDAT</div>
          <div style="font-size: 20px; font-weight: 900; color: #1e293b; margin-bottom: 4px;">${escapeHtml(candidateName)}</div>
          <div style="font-size: 13px; color: #64748b;">💼 ${escapeHtml(candidatePosition || '(tanpa posisi)')} &nbsp;•&nbsp; <span style="background: #eff6ff; color: #1e40af; padding: 3px 10px; border-radius: 999px; font-weight: 800; font-size: 11px;">${category === 'guru' ? 'KATEGORI: GURU' : 'KATEGORI: ADMINISTRATOR'}</span></div>
        </div>
        <form id="interviewForm" style="background: #fff; padding: 26px 30px 30px; border-radius: 0 0 20px 20px; box-shadow: 0 20px 50px rgba(15,23,42,.08);">
          ${interviewerBlock}
          <div style="margin-bottom: 18px; padding: 14px 16px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; font-size: 12.5px; color: #075985; line-height: 1.6;">
            <b>📝 Cara mengisi:</b> Nilai tiap kriteria dengan angka <b>1 – 5</b>.<br>Boleh pakai <b>desimal dengan koma</b> (contoh: <code style="background:#fff;padding:1px 5px;border-radius:3px;">2,97</code> atau <code style="background:#fff;padding:1px 5px;border-radius:3px;">4,8</code>).
          </div>
          <div style="margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 800; color: #475569; letter-spacing: 1px; margin-bottom: 14px;">PENILAIAN <span style="color: #dc2626;">*</span></div>
            <div id="criteriaList"></div>
          </div>
          <div id="liveResultBox" style="margin-bottom: 24px; padding: 18px 20px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 2px solid #e2e8f0; border-radius: 16px; transition: all .25s ease;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div>
                <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1.5px; margin-bottom: 4px;">RATA-RATA SEMENTARA</div>
                <div id="liveAvgNum" style="font-size: 32px; font-weight: 900; color: #1e293b; line-height: 1;">—,——</div>
                <div id="liveProgressText" style="font-size: 11.5px; color: #64748b; margin-top: 6px;">0 dari ${criteriaList.length} kriteria terisi</div>
              </div>
              <div id="liveConclusionChip" style="padding: 10px 18px; border-radius: 12px; background: #f1f5f9; border: 1px solid #cbd5e1; font-size: 13px; font-weight: 900; color: #64748b; white-space: nowrap; transition: all .25s ease;">⏳ Menunggu input</div>
            </div>
          </div>
          <div style="margin-bottom: 24px;">
            <label style="display: block; font-size: 12px; font-weight: 800; color: #475569; letter-spacing: 1px; margin-bottom: 8px;">CATATAN PEWAWANCARA (opsional)</label>
            <textarea id="interviewNotes" rows="4" placeholder="Tulis catatan tambahan, observasi, atau hal-hal yang perlu diperhatikan..." style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 14.5px; font-family: inherit; resize: vertical; outline: none; box-sizing: border-box; line-height: 1.5;"></textarea>
          </div>
          <div style="margin-bottom: 24px;">
            <label style="display: block; font-size: 12px; font-weight: 800; color: #475569; letter-spacing: 1px; margin-bottom: 8px;">📎 LAMPIRAN CATATAN (opsional — foto, PDF, atau Word)</label>
            <input type="file" id="interviewNotePhoto" accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="width: 100%; padding: 12px; border: 2px dashed #93c5fd; border-radius: 12px; font-family: inherit; font-size: 12px; background: #f0f9ff; cursor: pointer; box-sizing: border-box;">
            <div id="interviewPhotoPreview" style="margin-top:10px;"></div>
          </div>
          <button type="submit" id="ivSubmitBtn" style="width: 100%; padding: 16px; border: 0; border-radius: 14px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; font-size: 16px; font-weight: 900; font-family: inherit; cursor: pointer; box-shadow: 0 10px 24px rgba(30,58,138,.28);">📤 Kirim Hasil Wawancara</button>
          <div style="margin-top: 14px; text-align: center; font-size: 11.5px; color: #94a3b8;">Data akan di-generate jadi PDF & langsung terkirim ke admin.</div>
        </form>
      </div>
    `;

    const criteriaBox = document.getElementById('criteriaList');
    criteriaBox.innerHTML = criteriaList.map((label, idx) => `
      <div style="padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px; font-size: 13px; font-weight: 800; color: #1e293b; line-height: 1.4;">${idx + 1}. ${escapeHtml(label)}</div>
          <div style="flex: 0 0 auto; display: flex; align-items: center; gap: 8px;">
            <input type="text" class="iv-score-input" data-idx="${idx}" inputmode="decimal" autocomplete="off" placeholder="1,00 – 5,00" style="width: 110px; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 15px; font-weight: 800; text-align: center; color: #1e293b; outline: none; transition: all .15s ease; box-sizing: border-box;">
            <span class="iv-score-icon" style="font-size: 18px; opacity: .35;">⭕</span>
          </div>
        </div>
        <div class="iv-score-err" style="display: none; font-size: 11px; color: #dc2626; margin-top: 6px; font-weight: 700;"></div>
      </div>
    `).join('');

    criteriaBox.querySelectorAll('.iv-score-input').forEach(inp => {
      inp.addEventListener('input', onScoreInput);
      inp.addEventListener('blur', onScoreBlur);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });
    });

    const photoInput = document.getElementById('interviewNotePhoto');
    if (photoInput) {
      photoInput.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg','image/png','image/webp','image/gif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) { alert('Format tidak didukung.'); e.target.value = ''; return; }
        if (file.size > 10 * 1024 * 1024) { alert('File maksimal 10 MB.'); e.target.value = ''; return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
          state.notePhotoBase64 = ev.target.result;
          state.noteFileMime = file.type;
          state.noteFileName = file.name;
          state.noteFileSize = file.size;
          const isImg = file.type.startsWith('image/');
          const icon = isImg ? '🖼️' : (file.type === 'application/pdf' ? '📄' : '📝');
          const sizeStr = file.size > 1024 * 1024 ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : (file.size / 1024).toFixed(1) + ' KB';
          const prev = document.getElementById('interviewPhotoPreview');
          if (prev) prev.innerHTML = isImg
            ? `<div style="padding:10px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;"><div style="font-size:11px;font-weight:800;color:#075985;margin-bottom:6px;">✓ Foto baru dipilih:</div><img src="${ev.target.result}" style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid #bae6fd;"><div style="font-size:10.5px;color:#64748b;margin-top:6px;">${escapeHtml(file.name)} · ${sizeStr}</div></div>`
            : `<div style="padding:12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;display:flex;align-items:center;gap:10px;"><div style="font-size:28px;">${icon}</div><div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:800;color:#075985;word-break:break-all;">${escapeHtml(file.name)}</div><div style="font-size:10.5px;color:#64748b;margin-top:2px;">${sizeStr} · akan diupload saat submit</div></div></div>`;
        };
        reader.readAsDataURL(file);
      };
    }

    document.getElementById('interviewForm').onsubmit = handleSubmit;
  }

  function onScoreInput(e) {
    const inp = e.target;
    const idx = Number(inp.getAttribute('data-idx'));
    let raw = inp.value;
    raw = raw.replace(/[^0-9.,]/g, '');
    const m = raw.match(/^[0-9]*[.,]?[0-9]*/);
    if (m) raw = m[0];
    if (raw !== inp.value) {
      const selStart = inp.selectionStart;
      inp.value = raw;
      try { inp.setSelectionRange(selStart, selStart); } catch (err) {}
    }
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
      inp.value = fmtScore(parsed);
      state.scores[idx] = parsed;
      updateLiveResult();
    }
  }

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
        if (inp) { inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); inp.focus(); }
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
      let photoUrl = state.notePhotoUrl;
      if (state.notePhotoBase64) {
        btn.textContent = '⏳ Upload lampiran...';
        photoUrl = await uploadNotePhoto(interviewer);
      }
      await saveToFirebase(interviewer, scores, notes, avg, conclusion, photoUrl);
      if (typeof window.autoGenerateInterviewCombined === 'function') {
        btn.textContent = '🔄 Menggabungkan hasil…';
        try {
          await window.autoGenerateInterviewCombined(candidateName, candidatePosition);
        } catch (e) { console.warn('[INTERVIEW] Auto-combine gagal:', e); }
      }
      showSuccess(interviewer, avg, conclusion);
    } catch (err) {
      console.error('[INTERVIEW] Gagal:', err);
      alert('❌ Gagal mengirim: ' + (err.message || 'Coba lagi'));
      btn.disabled = false;
      btn.textContent = '📤 Kirim Hasil Wawancara';
    }
  }

  async function uploadNotePhoto(interviewer) {
    if (!state.notePhotoBase64) return state.notePhotoUrl || '';
    const base64Only = state.notePhotoBase64.split(',')[1] || '';
    if (!base64Only) return state.notePhotoUrl || '';
    let idToken = '';
    try { if (typeof firebase !== 'undefined' && firebase.apps.length) { const u = firebase.auth().currentUser; if (u) idToken = await u.getIdToken(); } } catch (e) {}
    const GAS_URL = (typeof GAS_UPLOAD_URL !== 'undefined' && GAS_UPLOAD_URL) || 'https://script.google.com/macros/s/AKfycbzsdy_aGU5vN6mrkXvNbKBO4nHym6xIGhDNT0u_Urz3qQ2w3jFjwMzjfv0ipQxmqyBG/exec';
    const slug = candidateName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'upload_subject_note_photo',
          idToken: idToken,
          slug: slug,
          kode: interviewer,
          candidateName: candidateName,
          candidatePosition: candidatePosition,
          base64: base64Only,
          mimeType: state.noteFileMime || 'image/jpeg',
          fileName: state.noteFileName || ''
        })
      });
      const data = await res.json();
      if (data && data.success && data.fileUrl) return data.fileUrl;
    } catch (e) { console.warn('Upload error:', e); }
    return state.notePhotoUrl || '';
  }

  async function saveToFirebase(interviewer, scores, notes, avg, conclusion, photoUrl) {
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
      notePhotoUrl: photoUrl || '',
      noteFileMime: state.noteFileMime || '',
      noteFileName: state.noteFileName || '',
      noteFileSize: Number(state.noteFileSize) || 0,
      ts: firebase.database.ServerValue.TIMESTAMP
    };
    await firebase.database().ref('sgs_interviews/' + slug + '/' + interviewer).set(payload);
    console.log('[INTERVIEW] ✅ Saved to Firebase');
  }

  function showSuccess(interviewer, avg, conclusion) {
    document.body.innerHTML = `
      <div style="position: fixed; inset: 0; z-index: 2147483647; background: linear-gradient(135deg, #065f46, #16a34a); display: flex; align-items: center; justify-content: center; padding: 20px; font-family: Inter, system-ui, -apple-system, sans-serif;">
        <div style="max-width: 520px; width: 100%; background: #fff; border-radius: 24px; padding: 40px 32px; text-align: center; box-shadow: 0 30px 90px rgba(0,0,0,.5);">
          <div style="width: 80px; height: 80px; margin: 0 auto 20px; display: grid; place-items: center; background: linear-gradient(135deg, #d1fae5, #ecfdf5); border: 3px solid #86efac; border-radius: 24px; font-size: 40px;">✅</div>
          <h1 style="margin: 0 0 12px; color: #065f46; font-size: 22px; font-weight: 900;">Terima Kasih!</h1>
          <p style="margin: 0 0 20px; color: #475569; font-size: 14.5px; line-height: 1.65;">Hasil wawancara Anda sudah terkirim ke admin.<br>PDF otomatis dibuat & tersimpan.</p>
          <div style="padding: 16px 18px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; text-align: left; font-size: 13px; color: #166534; line-height: 1.9;">
            <div><b>Pewawancara:</b> ${escapeHtml(interviewer)}</div>
            <div><b>Kandidat:</b> ${escapeHtml(candidateName)}</div>
            <div><b>Waktu:</b> ${new Date().toLocaleString('id-ID')}</div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #86efac;">
              <div><b>Rata-rata:</b> <span style="font-size: 18px; font-weight: 900;">${fmtScore(avg)}</span></div>
              <div style="color: rgb(${conclusion.color[0]}, ${conclusion.color[1]}, ${conclusion.color[2]}); font-weight: 900; font-size: 14px; margin-top: 4px;">${conclusion.label}</div>
            </div>
          </div>
          <div style="margin-top: 22px; padding: 14px 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; font-size: 13.5px; color: #1e40af; font-weight: 700; line-height: 1.5;">Halaman ini akan tertutup otomatis dalam <span id="ivAutoCloseCount" style="font-size: 18px; font-weight: 900;">5</span> detik</div>
          <button id="ivCloseNowBtn" style="margin-top: 12px; width: 100%; padding: 14px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; border: 0; border-radius: 12px; font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer;">Tutup Sekarang</button>
        </div>
      </div>
    `;
    const tryClose = () => {
      try { window.open('', '_self'); window.close(); setTimeout(() => { if (!window.closed) { document.body.innerHTML = `<div style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #f8fafc; font-family: Inter, sans-serif;"><div style="text-align: center; color: #64748b; font-size: 16px;">✅ Terima kasih. Anda boleh menutup tab ini.</div></div>`; } }, 200); } catch (e) { document.body.innerHTML = `<div style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #f8fafc; font-family: Inter, sans-serif;"><div style="text-align: center; color: #64748b; font-size: 16px;">✅ Terima kasih. Anda boleh menutup tab ini.</div></div>`; }
    };
    let count = 5;
    const timer = setInterval(() => { count--; const el = document.getElementById('ivAutoCloseCount'); if (el) el.textContent = count; if (count <= 0) { clearInterval(timer); tryClose(); } }, 1000);
    const closeBtn = document.getElementById('ivCloseNowBtn');
    if (closeBtn) { closeBtn.onclick = () => { clearInterval(timer); tryClose(); }; }
  }

  buildUI();
})();