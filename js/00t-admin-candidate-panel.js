/* ============================================================
   js/00t-admin-candidate-panel.js
   ------------------------------------------------------------
   - Tombol 🔄 Reset data wawancara (Firebase + Drive)
   - Penilaian Subject Test (1-4): Not / Fairly / Recommended / Highly
   - Tombol aksi rapi per kartu kandidat
   ============================================================ */

(function () {
  'use strict';

  const SUBJECT_RATINGS = [
    { value: 0, label: '— Belum dinilai —' },
    { value: 1, label: '1 — Not Recommended' },
    { value: 2, label: '2 — Fairly Recommended' },
    { value: 3, label: '3 — Recommended' },
    { value: 4, label: '4 — Highly Recommended' }
  ];

  function slugify(name) {
    return String(name || 'tanpa-nama').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'tanpa-nama';
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ============================================================
     1. TOMBOL RESET DATA WAWANCARA
     ============================================================ */
  window.adminResetInterviewData = async function (candidateName, candidatePosition) {
    if (!candidateName) return alert('Nama kandidat kosong.');

    const slug = slugify(candidateName);
    const ok = (typeof window.sgsConfirmDanger === 'function')
      ? await window.sgsConfirmDanger(
          'Reset SEMUA data wawancara untuk:\n\n👤 ' + candidateName +
          '\n💼 ' + (candidatePosition || '-') + '\n\n' +
          'Yang akan dihapus:\n• Firebase: sgs_interviews/' + slug +
          '\n• Semua file *-Wawancara-*.pdf di Drive',
          { title: '⚠️ Reset Data Wawancara', okText: 'Ya, Hapus Semua' }
        )
      : confirm('Reset data wawancara untuk ' + candidateName + '?');

    if (!ok) return;

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      return alert('Firebase belum siap');
    }

    let fbDeleted = false, driveDeleted = 0;

    /* 1. Hapus Firebase */
    try {
      const ref = firebase.database().ref('sgs_interviews/' + slug);
      const snap = await ref.once('value');
      if (snap.exists()) {
        await ref.remove();
        fbDeleted = true;
        console.log('[RESET-IV] 🧹 Firebase dihapus:', slug);
      }
    } catch (e) { console.warn('[RESET-IV] Firebase:', e.message); }

    /* 2. Hapus lastDelete */
    try {
      const ldSnap = await firebase.database().ref('sgs_state/lastDelete').once('value');
      const ld = ldSnap.val() || {};
      const ldSlug = ld.candidateSlug || (ld.candidateName
        ? slugify(ld.candidateName) : null);
      if (ldSlug === slug || (ld.candidateName && String(ld.candidateName).toLowerCase().includes(slug))) {
        await firebase.database().ref('sgs_state/lastDelete').remove();
        console.log('[RESET-IV] 🧹 lastDelete dibersihkan');
      }
    } catch (e) {}

    /* 3. Hapus file Drive */
    try {
      const files = (typeof window.fetchResultFiles === 'function')
        ? await window.fetchResultFiles(true) : [];
      const targets = files.filter(f => {
        const n = String(f.name || '').toLowerCase();
        return /-wawancara-/.test(n) && (n.startsWith(slug + '-') || n.includes('[' + slug + ']'));
      });
      if (targets.length > 0 && typeof window.GAS_ADMIN_URL === 'string') {
        const idToken = (typeof window.__getFirebaseIdToken === 'function')
          ? await window.__getFirebaseIdToken() : '';
        for (const f of targets) {
          try {
            const res = await fetch(window.GAS_ADMIN_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ action: 'delete', fileId: f.id, idToken })
            });
            if (res.ok) {
              if (window.__recentlyDeletedFileIds) window.__recentlyDeletedFileIds.add(f.id);
              if (typeof window.__removeFileFromCache === 'function') window.__removeFileFromCache(f.id);
              driveDeleted++;
            }
          } catch (e) {}
        }
      }
    } catch (e) { console.warn('[RESET-IV] Drive:', e.message); }

    if (typeof window.__invalidateResultCache === 'function') window.__invalidateResultCache();

    setTimeout(() => {
      if (document.getElementById('resultFilesPageOverlay') && typeof window.__renderResultPageContent === 'function') {
        window.__renderResultPageContent();
      }
    }, 500);

    alert(
      'Reset selesai:\n\n' +
      '• Firebase: ' + (fbDeleted ? '✅ dihapus' : '⏭ kosong') + '\n' +
      '• File Drive: ' + driveDeleted + ' dihapus\n\n' +
      'Silakan minta interviewer input ulang.'
    );
  };

  /* ============================================================
     2. PENILAIAN SUBJECT TEST (1-4)
     ============================================================ */
  async function __loadSubjectRating(slug) {
    try {
      const snap = await firebase.database()
        .ref('sgs_subject_ratings/' + slug).once('value');
      return snap.val() || null;
    } catch (e) { return null; }
  }

  async function __saveSubjectRating(slug, rating, candidateName, candidatePosition) {
    try {
      await firebase.database().ref('sgs_subject_ratings/' + slug).set({
        rating: Number(rating),
        candidateName: candidateName || '',
        candidatePosition: candidatePosition || '',
        ts: firebase.database.ServerValue.TIMESTAMP,
        ratedBy: 'admin'
      });
      return true;
    } catch (e) {
      console.error('[SUBJECT-RATING] Gagal simpan:', e);
      return false;
    }
  }

  function __buildSubjectRatingHTML(slug, current) {
    const val = Number(current?.rating) || 0;
    const options = SUBJECT_RATINGS.map(r =>
      '<option value="' + r.value + '"' + (r.value === val ? ' selected' : '') + '>' +
      r.label + '</option>'
    ).join('');

    let badge = '';
    if (val >= 4)      badge = '<span style="background:#065f46;color:#fff;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:800;margin-left:6px;">HIGHLY</span>';
    else if (val === 3) badge = '<span style="background:#16a34a;color:#fff;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:800;margin-left:6px;">RECOMMENDED</span>';
    else if (val === 2) badge = '<span style="background:#f59e0b;color:#fff;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:800;margin-left:6px;">FAIRLY</span>';
    else if (val === 1) badge = '<span style="background:#dc2626;color:#fff;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:800;margin-left:6px;">NOT</span>';

    return (
      '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;' +
      'background:linear-gradient(135deg,#fef3c7,#fffbeb);border:1px solid #fde68a;' +
      'border-radius:10px;margin-top:8px;flex-wrap:wrap;">' +
      '<span style="font-size:11px;font-weight:800;color:#92400e;">📝 Penilaian Subject:</span>' +
      '<select class="js-subject-rating" data-slug="' + escHtml(slug) + '" ' +
      'style="padding:5px 10px;border:1px solid #fbbf24;border-radius:7px;background:#fff;' +
      'font-family:inherit;font-size:11px;font-weight:700;color:#78350f;cursor:pointer;flex:1;min-width:180px;">' +
      options + '</select>' +
      badge +
      '</div>'
    );
  }

  /* ============================================================
     3. INJECT KE KARTU KANDIDAT
     ============================================================ */
  async function __injectToCard(card) {
    if (!card || card.querySelector('.js-reset-interview')) return;

    // Cari nama & posisi dari tombol yang sudah ada
    const ivBtn = card.querySelector('.js-interview-link, .js-grafindo-link');
    if (!ivBtn) return;
    const name = ivBtn.getAttribute('data-name');
    const position = ivBtn.getAttribute('data-position') || '';
    if (!name) return;

    const slug = slugify(name);

    // Container tombol
    const btnRow = ivBtn.parentElement;
    if (!btnRow) return;

    // 3a. Tambah tombol Reset di akhir btnRow
    const resetBtn = document.createElement('button');
    resetBtn.className = 'js-reset-interview';
    resetBtn.setAttribute('data-name', name);
    resetBtn.setAttribute('data-position', position);
    resetBtn.textContent = '🔄 Reset';
    resetBtn.title = 'Reset Firebase & Drive data wawancara kandidat ini';
    resetBtn.style.cssText =
      'padding:4px 10px;border-radius:999px;border:1px solid rgba(239,68,68,.5);' +
      'background:rgba(239,68,68,.15);color:#fca5a5;font-size:10px;font-weight:800;' +
      'cursor:pointer;font-family:inherit;white-space:nowrap;';
    btnRow.appendChild(resetBtn);

    // 3b. Tambah penilaian Subject di bawah btnRow (setelah btnRow)
    const ratingData = await __loadSubjectRating(slug);
    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'js-subject-rating-wrap';
    ratingDiv.innerHTML = __buildSubjectRatingHTML(slug, ratingData);
    btnRow.parentElement.insertBefore(ratingDiv, btnRow.nextSibling);
  }

  function __scanAndInject() {
    const cards = document.querySelectorAll('.rf-card');
    cards.forEach(card => { __injectToCard(card).catch(() => {}); });
  }

  /* ============================================================
     4. EVENT DELEGATION
     ============================================================ */
  document.addEventListener('click', function (e) {
    const resetBtn = e.target.closest('.js-reset-interview');
    if (resetBtn) {
      e.preventDefault();
      e.stopPropagation();
      const name = resetBtn.getAttribute('data-name');
      const pos = resetBtn.getAttribute('data-position');
      if (name && typeof window.adminResetInterviewData === 'function') {
        window.adminResetInterviewData(name, pos);
      }
      return;
    }
  }, true);

  document.addEventListener('change', async function (e) {
    const sel = e.target.closest('.js-subject-rating');
    if (!sel) return;
    e.preventDefault();
    e.stopPropagation();

    const slug = sel.getAttribute('data-slug');
    const value = Number(sel.value);

    // Ambil nama & posisi dari card
    const card = sel.closest('.rf-card');
    const ivBtn = card ? card.querySelector('.js-interview-link, .js-grafindo-link') : null;
    const name = ivBtn ? ivBtn.getAttribute('data-name') : '';
    const position = ivBtn ? ivBtn.getAttribute('data-position') : '';

    if (!firebase || !firebase.apps.length) {
      alert('Firebase belum siap');
      return;
    }

    sel.disabled = true;
    const ok = await __saveSubjectRating(slug, value, name, position);
    sel.disabled = false;

    if (ok) {
      // Update badge visual tanpa re-render penuh
      const wrap = sel.parentElement;
      const oldBadge = wrap.querySelector('span[style*="border-radius:6px"]');
      if (oldBadge) oldBadge.remove();

      let badge = '';
      if (value === 4)      badge = '<span style="background:#065f46;color:#fff;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:800;margin-left:6px;">HIGHLY</span>';
      else if (value === 3) badge = '<span style="background:#16a34a;color:#fff;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:800;margin-left:6px;">RECOMMENDED</span>';
      else if (value === 2) badge = '<span style="background:#f59e0b;color:#fff;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:800;margin-left:6px;">FAIRLY</span>';
      else if (value === 1) badge = '<span style="background:#dc2626;color:#fff;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:800;margin-left:6px;">NOT</span>';

      if (badge) wrap.insertAdjacentHTML('beforeend', badge);
      sel.style.boxShadow = '0 0 0 3px rgba(34,197,94,.25)';
      setTimeout(() => { sel.style.boxShadow = ''; }, 1200);
    } else {
      alert('Gagal menyimpan penilaian. Coba lagi.');
    }
  }, true);

  /* ============================================================
     5. OBSERVER + INIT
     ============================================================ */
  if (!window.__adminCandidatePanelObserver) {
    window.__adminCandidatePanelObserver = new MutationObserver(() => {
      clearTimeout(window.__adminCandidatePanelTimer);
      window.__adminCandidatePanelTimer = setTimeout(__scanAndInject, 400);
    });
    window.__adminCandidatePanelObserver.observe(document.body, {
      childList: true, subtree: true
    });
  }

  setTimeout(__scanAndInject, 800);
  setTimeout(__scanAndInject, 2500);

  console.log('[ADMIN-CANDIDATE-PANEL] ✓ Loaded — reset + subject rating');
})();