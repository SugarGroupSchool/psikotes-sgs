/* ============================================================
   js/00u-admin-psikogram.js
   ------------------------------------------------------------
   Psikogram komponen untuk panel admin (posisi Guru/Dosen)
   
   - 11 aspek psikologis dengan progress bar
   - Skor & persentase bisa diedit inline via modal
   - Auto-save ke Firebase: sgs_psikogram/[slug]
   - Tombol Copy Ringkasan & Reset Default
   - Hanya muncul kalau posisi = guru/dosen
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     DEFINISI ASPEK PER KATEGORI
     ============================================================ */
  const ASPECTS = {
    guru: [
      { id: 'cognitive_ability',      label: 'Cognitive Ability & Problem Solving',              default: 3.54 },
      { id: 'verbal_communication',   label: 'Verbal Communication & Material Explanation',     default: 3.68 },
      { id: 'classroom_management',   label: 'Classroom Management & Instructional Leadership',  default: 3.60 },
      { id: 'empathy_interpersonal',  label: 'Empathy & Interpersonal Skills',                   default: 3.81 },
      { id: 'emotional_stability',    label: 'Emotional Stability & Impulse Control',            default: 2.04 },
      { id: 'motivation_drive',       label: 'Motivation & Achievement Drive',                    default: 2.93 },
      { id: 'work_discipline',        label: 'Work Discipline & Reliability',                     default: 3.38 },
      { id: 'flexibility_adaptability', label: 'Flexibility, Adaptability & Learning Agility',   default: 3.38 },
      { id: 'integrity_compliance',   label: 'Integrity & Rule Compliance',                       default: 2.62 },
      { id: 'teaching_creativity',    label: 'Teaching Creativity',                               default: 3.76 },
      { id: 'teaching_practice',      label: 'Teaching Practice Skills',                          default: 3.90 }
    ]
  };

  /* ============================================================
     HELPERS
     ============================================================ */
  function detectCategory(position) {
    if (!position) return null;
    const p = String(position).toLowerCase();
    if (/guru|dosen|teacher|pengajar|kindergarten|primary|math|biology|english/i.test(p)) return 'guru';
    return null;
  }

  function scoreToKet(score) {
    const s = Number(score) || 0;
    if (s >= 3.5) return { label: 'BAIK',          color: '#86efac', bg: 'rgba(34,197,94,.15)',  border: 'rgba(34,197,94,.45)'  };
    if (s >= 2.5) return { label: 'CUKUP',         color: '#fcd34d', bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.45)' };
    if (s >= 1.5) return { label: 'KURANG',        color: '#fca5a5', bg: 'rgba(239,68,68,.15)',  border: 'rgba(239,68,68,.45)'  };
    return         { label: 'SANGAT KURANG', color: '#fca5a5', bg: 'rgba(239,68,68,.22)',  border: 'rgba(239,68,68,.55)'  };
  }

  function barGradient(pct) {
    if (pct >= 87.5) return 'linear-gradient(90deg, #16a34a, #22c55e)';
    if (pct >= 75)   return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    if (pct >= 50)   return 'linear-gradient(90deg, #ea580c, #f97316)';
    return                  'linear-gradient(90deg, #dc2626, #ef4444)';
  }

  function slugify(name) {
    return String(name || 'tanpa-nama').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'tanpa-nama';
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fbReady() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
  }

  /* ============================================================
     FIREBASE LOAD / SAVE
     ============================================================ */
  async function loadPsikogram(slug) {
    if (!fbReady()) return null;
    try {
      const snap = await firebase.database().ref('sgs_psikogram/' + slug).once('value');
      return snap.val() || null;
    } catch (e) {
      console.warn('[PSIKOGRAM] Load error:', e.message);
      return null;
    }
  }

  async function savePsikogram(slug, category, scores) {
    if (!fbReady()) throw new Error('Firebase belum siap');
    await firebase.database().ref('sgs_psikogram/' + slug).update({
      category,
      scores,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
  }

  /* ============================================================
     RENDER HTML
     ============================================================ */
  function buildRowsHTML(category, savedScores) {
    const aspects = ASPECTS[category] || [];
    return aspects.map((asp, idx) => {
      const raw = savedScores[asp.id] !== undefined ? Number(savedScores[asp.id]) : asp.default;
      const pct = Math.round((raw / 4) * 1000) / 10;
      const ket = scoreToKet(raw);

      return `
        <div class="psiko-row" data-aspect-id="${asp.id}" style="
          display: grid;
          grid-template-columns: 30px minmax(0,1fr) 62px 78px 62px 34px;
          gap: 10px;
          align-items: center;
          padding: 10px 14px;
          background: rgba(255,255,255,.02);
          border-bottom: 1px solid rgba(255,255,255,.05);
          transition: background .15s ease;
        " onmouseover="this.style.background='rgba(99,102,241,.07)'" onmouseout="this.style.background='rgba(255,255,255,.02)'">

          <div style="font-size: 10px; font-weight: 800; color: #64748b; text-align: center;">
            ${String(idx + 1).padStart(2, '0')}
          </div>

          <div style="min-width: 0;">
            <div style="font-size: 11.5px; font-weight: 700; color: #e2e8f0; line-height: 1.35; margin-bottom: 5px; word-break: break-word;">
              ${escHtml(asp.label)}
            </div>
            <div style="height: 5px; background: rgba(255,255,255,.07); border-radius: 999px; overflow: hidden;">
              <div class="psiko-bar" style="width: ${pct}%; height: 100%; background: ${barGradient(pct)}; border-radius: inherit; transition: width .35s ease, background .25s ease;"></div>
            </div>
          </div>

          <div class="psiko-pct" style="font-size: 13px; font-weight: 800; color: #a5b4fc; text-align: right; font-variant-numeric: tabular-nums;">
            ${pct.toFixed(1)}%
          </div>

          <div class="psiko-score" style="font-size: 11.5px; font-weight: 800; color: #e2e8f0; text-align: center; font-variant-numeric: tabular-nums;">
            ${raw.toFixed(2)} / 4
          </div>

          <div style="text-align: center;">
            <span class="psiko-ket" style="
              display: inline-block; padding: 3px 8px;
              border-radius: 999px; font-size: 9px; font-weight: 900;
              letter-spacing: .3px;
              background: ${ket.bg}; border: 1px solid ${ket.border};
              color: ${ket.color}; white-space: nowrap;
            ">${ket.label}</span>
          </div>

          <div style="text-align: center;">
            <button class="psiko-edit-btn" data-aspect-id="${asp.id}" title="Edit skor" style="
              width: 26px; height: 26px;
              display: grid; place-items: center;
              background: rgba(99,102,241,.18);
              border: 1px solid rgba(99,102,241,.45);
              border-radius: 7px;
              color: #a5b4fc; font-size: 11px;
              cursor: pointer; font-family: inherit;
              transition: all .15s ease; padding: 0;
            " onmouseover="this.style.background='rgba(99,102,241,.35)';this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(99,102,241,.18)';this.style.transform='scale(1)'">✎</button>
          </div>

        </div>
      `;
    }).join('');
  }

  function buildFooterStats(category, savedScores) {
    const aspects = ASPECTS[category] || [];
    const scores = aspects.map(a => savedScores[a.id] !== undefined ? Number(savedScores[a.id]) : a.default);
    const avg = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);
    const avgPct = (avg / 4) * 100;
    return { avg, avgPct, ket: scoreToKet(avg) };
  }

  function buildHTML(slug, category, savedScores) {
    savedScores = savedScores || {};
    const stats = buildFooterStats(category, savedScores);

    return `
      <div class="js-psikogram-box" data-slug="${escHtml(slug)}" data-category="${category}" style="
        margin-top: 14px;
        border-radius: 14px;
        overflow: hidden;
        background: linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.015));
        border: 1.5px solid rgba(99,102,241,.28);
      ">

        <!-- HEADER -->
        <div style="
          padding: 12px 16px;
          background: linear-gradient(135deg, rgba(99,102,241,.16), rgba(139,92,246,.08));
          border-bottom: 1px solid rgba(99,102,241,.22);
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        ">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="
              width: 32px; height: 32px;
              display: grid; place-items: center;
              background: linear-gradient(135deg, #6366f1, #8b5cf6);
              border-radius: 9px; font-size: 15px;
              box-shadow: 0 0 14px rgba(99,102,241,.4);
            ">📊</div>
            <div>
              <div style="font-size: 11px; font-weight: 900; color: #c4b5fd; letter-spacing: 1.5px;">
                PSIKOGRAM · POSISI GURU/DOSEN
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">
                ${(ASPECTS[category] || []).length} aspek psikologis · klik ✎ untuk edit skor
              </div>
            </div>
          </div>

          <div class="psiko-avg-chip" style="
            padding: 6px 12px;
            background: rgba(99,102,241,.15);
            border: 1px solid rgba(99,102,241,.38);
            border-radius: 999px;
            font-size: 11px; font-weight: 800;
            color: #a5b4fc; white-space: nowrap;
            font-variant-numeric: tabular-nums;
            display: flex; align-items: center; gap: 8px;
          ">
            <span>Rata-rata: <b style="color:#fff;">${stats.avg.toFixed(2)}/4</b> · ${stats.avgPct.toFixed(1)}%</span>
            <span style="
              padding: 2px 8px;
              background: ${stats.ket.bg};
              border: 1px solid ${stats.ket.border};
              color: ${stats.ket.color};
              border-radius: 999px;
              font-size: 9.5px; font-weight: 900;
            ">${stats.ket.label}</span>
          </div>
        </div>

        <!-- COLUMN HEADER -->
        <div style="
          display: grid;
          grid-template-columns: 30px minmax(0,1fr) 62px 78px 62px 34px;
          gap: 10px;
          padding: 8px 14px;
          background: rgba(0,0,0,.22);
          border-bottom: 1px solid rgba(255,255,255,.05);
          font-size: 9.5px; font-weight: 900;
          letter-spacing: .8px; color: #64748b;
        ">
          <div style="text-align: center;">#</div>
          <div>ASPEK</div>
          <div style="text-align: right;">%</div>
          <div style="text-align: center;">SKOR</div>
          <div style="text-align: center;">KET</div>
          <div style="text-align: center;">·</div>
        </div>

        <!-- ROWS -->
        <div class="psiko-rows">${buildRowsHTML(category, savedScores)}</div>

        <!-- FOOTER -->
        <div style="
          padding: 10px 16px;
          background: rgba(0,0,0,.22);
          border-top: 1px solid rgba(255,255,255,.05);
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        ">
          <div class="psiko-status" style="color: #94a3b8; font-size: 10.5px; font-weight: 600;">
            ℹ️ Auto-save ke server saat simpan
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="js-psiko-reset" style="
              padding: 6px 12px;
              background: rgba(255,255,255,.06);
              border: 1px solid rgba(255,255,255,.14);
              border-radius: 8px;
              color: #cbd5e1; font-family: inherit;
              font-size: 10.5px; font-weight: 800;
              cursor: pointer;
            ">↺ Reset</button>
            <button class="js-psiko-copy" style="
              padding: 6px 12px;
              background: linear-gradient(135deg, rgba(99,102,241,.28), rgba(139,92,246,.18));
              border: 1px solid rgba(99,102,241,.5);
              border-radius: 8px;
              color: #c4b5fd; font-family: inherit;
              font-size: 10.5px; font-weight: 800;
              cursor: pointer;
            ">📋 Copy</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ============================================================
     MODAL EDIT
     ============================================================ */
  function openEditModal(aspectId, aspectLabel, currentScore, onSave) {
    const old = document.getElementById('psikoEditModal');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'psikoEditModal';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483646;
      background: rgba(10,20,35,.88);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      font-family: Inter, system-ui, sans-serif;
      animation: psikoFadeIn .2s ease;
    `;

    overlay.innerHTML = `
      <style>
        @keyframes psikoFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes psikoSlideIn { from{opacity:0;transform:translateY(16px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
      </style>
      <div style="
        width: min(440px, 100%);
        background: linear-gradient(180deg, #1e293b, #0f172a);
        border: 1.5px solid rgba(99,102,241,.35);
        border-radius: 18px;
        padding: 24px;
        box-shadow: 0 30px 90px rgba(0,0,0,.6);
        color: #e2e8f0;
        animation: psikoSlideIn .25s cubic-bezier(.2,.8,.2,1);
      ">
        <div style="font-size: 10.5px; font-weight: 900; color: #a5b4fc; letter-spacing: 1.8px; margin-bottom: 8px;">
          ✎ EDIT SKOR ASPEK
        </div>
        <div style="font-size: 13.5px; font-weight: 800; color: #fff; margin-bottom: 6px; line-height: 1.4;">
          ${escHtml(aspectLabel)}
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 18px;">
          Masukkan skor antara <b style="color:#c4b5fd;">0.00 – 4.00</b>
        </div>

        <input id="psikoEditInput" type="number" min="0" max="4" step="0.01" value="${currentScore.toFixed(2)}"
          style="
            width: 100%; padding: 14px 16px;
            background: rgba(255,255,255,.06);
            border: 2px solid rgba(99,102,241,.45);
            border-radius: 12px;
            color: #fff; font-family: inherit;
            font-size: 22px; font-weight: 800;
            text-align: center;
            outline: none; box-sizing: border-box;
            transition: border-color .15s ease, box-shadow .15s ease;
          " onfocus="this.style.borderColor='#818cf8';this.style.boxShadow='0 0 0 4px rgba(99,102,241,.2)'" onblur="this.style.borderColor='rgba(99,102,241,.45)';this.style.boxShadow='none'">

        <div class="psiko-edit-preview" style="
          margin-top: 10px; text-align: center;
          font-size: 12px; color: #94a3b8; font-weight: 700;
        ">= —%</div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button id="psikoEditCancel" style="
            flex: 1; padding: 13px;
            background: rgba(255,255,255,.06);
            border: 1px solid rgba(255,255,255,.14);
            border-radius: 10px;
            color: #cbd5e1; font-family: inherit;
            font-size: 13px; font-weight: 800;
            cursor: pointer;
          ">Batal</button>
          <button id="psikoEditSave" style="
            flex: 2; padding: 13px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border: 0; border-radius: 10px;
            color: #fff; font-family: inherit;
            font-size: 13px; font-weight: 800;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(99,102,241,.42);
          ">✓ Simpan</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = document.getElementById('psikoEditInput');
    const preview = overlay.querySelector('.psiko-edit-preview');

    function updatePreview() {
      const v = parseFloat(input.value);
      if (isNaN(v)) { preview.textContent = '= —%'; return; }
      const pct = ((Math.max(0, Math.min(4, v)) / 4) * 100).toFixed(1);
      preview.textContent = '= ' + pct + '%';
    }
    input.addEventListener('input', updatePreview);
    updatePreview();

    setTimeout(() => { input.focus(); input.select(); }, 100);

    function doSave() {
      let v = parseFloat(input.value);
      if (isNaN(v)) v = 0;
      v = Math.max(0, Math.min(4, v));
      overlay.remove();
      onSave(v);
    }

    document.getElementById('psikoEditSave').onclick = doSave;
    document.getElementById('psikoEditCancel').onclick = () => overlay.remove();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); doSave(); }
      if (e.key === 'Escape') { e.preventDefault(); overlay.remove(); }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  /* ============================================================
     UPDATE ROW UI (tanpa re-render seluruh box)
     ============================================================ */
  function updateRowUI(box, aspectId, newScore) {
    const row = box.querySelector('.psiko-row[data-aspect-id="' + aspectId + '"]');
    if (!row) return;

    const pct = Math.round((newScore / 4) * 1000) / 10;
    const ket = scoreToKet(newScore);

    const bar = row.querySelector('.psiko-bar');
    if (bar) {
      bar.style.width = pct + '%';
      bar.style.background = barGradient(pct);
    }
    const pctEl = row.querySelector('.psiko-pct');
    if (pctEl) pctEl.textContent = pct.toFixed(1) + '%';

    const scoreEl = row.querySelector('.psiko-score');
    if (scoreEl) scoreEl.textContent = newScore.toFixed(2) + ' / 4';

    const ketEl = row.querySelector('.psiko-ket');
    if (ketEl) {
      ketEl.textContent = ket.label;
      ketEl.style.background = ket.bg;
      ketEl.style.borderColor = ket.border;
      ketEl.style.color = ket.color;
    }
  }

  function updateAvgChip(box) {
    const chip = box.querySelector('.psiko-avg-chip');
    if (!chip) return;

    const rows = box.querySelectorAll('.psiko-row');
    let sum = 0, count = 0;
    rows.forEach(r => {
      const s = parseFloat(r.querySelector('.psiko-score')?.textContent) || 0;
      sum += s; count++;
    });
    const avg = count ? sum / count : 0;
    const avgPct = (avg / 4) * 100;
    const ket = scoreToKet(avg);

    chip.innerHTML = `
      <span>Rata-rata: <b style="color:#fff;">${avg.toFixed(2)}/4</b> · ${avgPct.toFixed(1)}%</span>
      <span style="
        padding: 2px 8px;
        background: ${ket.bg};
        border: 1px solid ${ket.border};
        color: ${ket.color};
        border-radius: 999px;
        font-size: 9.5px; font-weight: 900;
      ">${ket.label}</span>
    `;
  }

  function showStatus(box, msg, color) {
    const el = box.querySelector('.psiko-status');
    if (!el) return;
    const original = el.textContent;
    el.style.color = color;
    el.textContent = msg;
    setTimeout(() => {
      el.style.color = '#94a3b8';
      el.textContent = original;
    }, 2200);
  }

  /* ============================================================
     GET CURRENT SCORES DARI DOM
     ============================================================ */
  function getScoresFromDOM(box) {
    const scores = {};
    box.querySelectorAll('.psiko-row').forEach(row => {
      const id = row.getAttribute('data-aspect-id');
      const s = parseFloat(row.querySelector('.psiko-score')?.textContent) || 0;
      scores[id] = s;
    });
    return scores;
  }

  /* ============================================================
     BUILD COPY SUMMARY
     ============================================================ */
  function buildSummaryText(box) {
    const slug = box.dataset.slug;
    const category = box.dataset.category;
    const aspects = ASPECTS[category] || [];
    const scores = getScoresFromDOM(box);

    const card = box.closest('.rf-card') || box.closest('.ac-candidate-card');
    const nameEl = card ? card.querySelector('.js-interview-link, .js-grafindo-link, .js-fgd-link') : null;
    const name = nameEl ? nameEl.getAttribute('data-name') : '(kandidat)';
    const position = nameEl ? nameEl.getAttribute('data-position') : '';

    const lines = [];
    lines.push('PSIKOGRAM — ' + (category === 'guru' ? 'POSISI GURU/DOSEN' : category.toUpperCase()));
    lines.push('Nama   : ' + (name || '-'));
    lines.push('Posisi : ' + (position || '-'));
    lines.push('');

    const scoresArr = [];
    aspects.forEach((asp, i) => {
      const s = scores[asp.id] !== undefined ? scores[asp.id] : asp.default;
      const pct = ((s / 4) * 100).toFixed(1);
      const ket = scoreToKet(s);
      lines.push(`${String(i + 1).padStart(2, '0')}. ${asp.label}`);
      lines.push(`    Skor: ${s.toFixed(2)}/4 (${pct}%) — ${ket.label}`);
      scoresArr.push(s);
    });

    const avg = scoresArr.reduce((a, b) => a + b, 0) / Math.max(1, scoresArr.length);
    const avgPct = ((avg / 4) * 100).toFixed(1);
    const avgKet = scoreToKet(avg);

    lines.push('');
    lines.push('─────────────────────────────');
    lines.push(`RATA-RATA: ${avg.toFixed(2)}/4 (${avgPct}%) — ${avgKet.label}`);
    lines.push('Dibuat  : ' + new Date().toLocaleString('id-ID'));

    return lines.join('\n');
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ============================================================
     MAIN PUBLIC: renderPsikogramBox
     ============================================================ */
  window.renderPsikogramBox = async function (slug, candidateName, position) {
    const category = detectCategory(position);
    if (!category) return '';
    const data = await loadPsikogram(slug);
    const savedScores = (data && data.scores) ? data.scores : {};
    return buildHTML(slug, category, savedScores);
  };

  /* ============================================================
     EVENT DELEGATION — GLOBAL
     ============================================================ */
  if (!window.__psikoDelegationAttached) {
    window.__psikoDelegationAttached = true;

    document.addEventListener('click', function (e) {
      /* --- EDIT BUTTON --- */
      const editBtn = e.target.closest('.psiko-edit-btn');
      if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        const box = editBtn.closest('.js-psikogram-box');
        if (!box) return;

        const slug = box.dataset.slug;
        const category = box.dataset.category;
        const aspectId = editBtn.getAttribute('data-aspect-id');
        const asp = (ASPECTS[category] || []).find(a => a.id === aspectId);
        if (!asp) return;

        const row = editBtn.closest('.psiko-row');
        const currentScore = parseFloat(row.querySelector('.psiko-score')?.textContent) || asp.default;

        openEditModal(aspectId, asp.label, currentScore, async (newScore) => {
          try {
            const scores = getScoresFromDOM(box);
            scores[aspectId] = newScore;
            await savePsikogram(slug, category, scores);
            updateRowUI(box, aspectId, newScore);
            updateAvgChip(box);
            showStatus(box, '✓ Tersimpan ke server', '#86efac');
          } catch (err) {
            console.error('[PSIKOGRAM] Save failed:', err);
            showStatus(box, '✗ Gagal: ' + err.message, '#fca5a5');
          }
        });
        return;
      }

      /* --- RESET BUTTON --- */
      const resetBtn = e.target.closest('.js-psiko-reset');
      if (resetBtn) {
        e.preventDefault();
        e.stopPropagation();
        const box = resetBtn.closest('.js-psikogram-box');
        if (!box) return;

        if (!confirm('Reset semua skor ke nilai default?')) return;

        const slug = box.dataset.slug;
        const category = box.dataset.category;
        const aspects = ASPECTS[category] || [];
        const defaultScores = {};
        aspects.forEach(a => { defaultScores[a.id] = a.default; });

        savePsikogram(slug, category, defaultScores).then(() => {
          // Re-render isi box
          box.outerHTML = buildHTML(slug, category, defaultScores);
        }).catch(err => {
          alert('Gagal reset: ' + err.message);
        });
        return;
      }

      /* --- COPY BUTTON --- */
      const copyBtn = e.target.closest('.js-psiko-copy');
      if (copyBtn) {
        e.preventDefault();
        e.stopPropagation();
        const box = copyBtn.closest('.js-psikogram-box');
        if (!box) return;

        const text = buildSummaryText(box);

        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
              const prev = copyBtn.textContent;
              copyBtn.textContent = '✓ Tersalin';
              copyBtn.style.color = '#86efac';
              setTimeout(() => {
                copyBtn.textContent = prev;
                copyBtn.style.color = '#c4b5fd';
              }, 1500);
            }).catch(() => {
              fallbackCopy(text);
              copyBtn.textContent = '✓ Tersalin';
              setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 1500);
            });
          } else {
            fallbackCopy(text);
            copyBtn.textContent = '✓ Tersalin';
            setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 1500);
          }
        } catch (err) {
          fallbackCopy(text);
        }
        return;
      }
    }, true);
  }

  console.log('[PSIKOGRAM] ✓ Loaded — posisi guru/dosen');
})();