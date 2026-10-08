/* ============================================================
   js/00t-admin-candidate-panel.js
   ------------------------------------------------------------
   - Redesign kartu kandidat: sidebar tab kiri + konten kanan
   - Subject rating (1-4) HANYA untuk posisi Guru/Dosen
   - Excel tab HANYA untuk posisi Admin/Staff
   - Tombol Reset data wawancara (Firebase + Drive)
   ============================================================ */

(function () {
  'use strict';

  const SUBJECT_RATINGS = [
    { value: 0, label: '— Belum dinilai —' },
    { value: 1, label: '1 — Not Recommended',       color: '#dc2626', short: 'NOT' },
    { value: 2, label: '2 — Fairly Recommended',    color: '#f59e0b', short: 'FAIRLY' },
    { value: 3, label: '3 — Recommended',           color: '#16a34a', short: 'RECOMMENDED' },
    { value: 4, label: '4 — Highly Recommended',    color: '#065f46', short: 'HIGHLY' }
  ];

  function slugify(name) {
    return String(name || 'tanpa-nama').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'tanpa-nama';
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function detectCat(html) {
    const h = String(html || '').toLowerCase();
    if (/-wawancara-/.test(h)) return 'wawancara';
    if (/-fgd-/.test(h))       return 'fgd';
    if (/-grafis-/.test(h))    return 'grafis';
    if (/xlsx|xls\b/.test(h))  return 'excel';
    return 'tes';
  }

  /* ============================================================
     TOMBOL RESET
     ============================================================ */
  window.adminResetInterviewData = async function (candidateName, candidatePosition) {
    if (!candidateName) return alert('Nama kandidat kosong.');
    const slug = slugify(candidateName);

    const ok = (typeof window.sgsConfirmDanger === 'function')
      ? await window.sgsConfirmDanger(
          'Reset SEMUA data wawancara untuk:\n\n👤 ' + candidateName +
          '\n💼 ' + (candidatePosition || '-') + '\n\n' +
          'Yang akan dihapus:\n• Firebase sgs_interviews/' + slug +
          '\n• Semua file *-Wawancara-*.pdf di Drive',
          { title: '⚠️ Reset Data Wawancara', okText: 'Ya, Hapus Semua' }
        )
      : confirm('Reset data wawancara untuk ' + candidateName + '?');
    if (!ok) return;

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      return alert('Firebase belum siap');
    }

    let fbDeleted = false, driveDeleted = 0;

    try {
      const ref = firebase.database().ref('sgs_interviews/' + slug);
      const snap = await ref.once('value');
      if (snap.exists()) {
        await ref.remove();
        fbDeleted = true;
        console.log('[RESET-IV] 🧹 Firebase dihapus:', slug);
      }
    } catch (e) { console.warn('[RESET-IV] Firebase:', e.message); }

    try {
      const ldSnap = await firebase.database().ref('sgs_state/lastDelete').once('value');
      const ld = ldSnap.val() || {};
      const ldSlug = ld.candidateSlug || (ld.candidateName ? slugify(ld.candidateName) : null);
      if (ldSlug === slug || (ld.candidateName && String(ld.candidateName).toLowerCase().includes(slug))) {
        await firebase.database().ref('sgs_state/lastDelete').remove();
      }
    } catch (e) {}

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
    } catch (e) {}

    if (typeof window.__invalidateResultCache === 'function') window.__invalidateResultCache();
    setTimeout(() => {
      if (document.getElementById('resultFilesPageOverlay') && typeof window.__renderResultPageContent === 'function') {
        window.__renderResultPageContent();
      }
    }, 500);

    alert('Reset selesai:\n\n• Firebase: ' + (fbDeleted ? '✅ dihapus' : '⏭ kosong') +
      '\n• File Drive: ' + driveDeleted + ' dihapus');
  };

  /* ============================================================
     SUBJECT RATING
     ============================================================ */
  async function loadSubjectRating(slug) {
    try {
      const snap = await firebase.database().ref('sgs_subject_ratings/' + slug).once('value');
      return snap.val() || null;
    } catch (e) { return null; }
  }

  async function saveSubjectRating(slug, rating, name, position) {
    try {
      await firebase.database().ref('sgs_subject_ratings/' + slug).set({
        rating: Number(rating),
        candidateName: name || '',
        candidatePosition: position || '',
        ts: firebase.database.ServerValue.TIMESTAMP,
        ratedBy: 'admin'
      });
      return true;
    } catch (e) { return false; }
  }

  function ratingHTML(slug, current) {
    const val = Number(current?.rating) || 0;
    const opts = SUBJECT_RATINGS.map(r =>
      '<option value="' + r.value + '"' + (r.value === val ? ' selected' : '') + '>' +
      esc(r.label) + '</option>'
    ).join('');
    return (
      '<div style="padding:14px;background:linear-gradient(135deg,#fffbeb,#fef3c7);' +
      'border:1px solid #fde68a;border-radius:12px;">' +
      '<div style="font-size:12px;font-weight:800;color:#92400e;margin-bottom:10px;">' +
      '📝 Penilaian Subject Test</div>' +
      '<select class="js-subject-rating" data-slug="' + esc(slug) + '" ' +
      'style="width:100%;padding:10px 12px;border:1.5px solid #fbbf24;border-radius:10px;' +
      'background:#fff;font-family:inherit;font-size:13px;font-weight:700;color:#78350f;cursor:pointer;">' +
      opts + '</select>' +
      '<div style="font-size:10.5px;color:#a16207;margin-top:8px;">' +
      'Nilai subject test kandidat. Tersimpan otomatis.</div>' +
      '</div>'
    );
  }

  /* ============================================================
     RESTRUCTURE CARD
     ============================================================ */
  async function restructureCard(card) {
    if (card.dataset.tabbed === '1') return;

    // Cari file list = div dengan flex-direction: column
    const kids = Array.from(card.children);
    const fileList = kids.find(el => {
      const s = (el.getAttribute('style') || '') + (el.style.cssText || '');
      return el.children.length > 0 && /flex-direction\s*:\s*column/.test(s);
    });
    if (!fileList) return;

    const items = Array.from(fileList.children);
    if (items.length === 0) return;

    card.dataset.tabbed = '1';

    // Kategorikan
    const groups = { tes: [], grafis: [], fgd: [], wawancara: [], excel: [] };
    items.forEach(el => {
      const cat = detectCat(el.outerHTML);
      if (groups[cat]) groups[cat].push(el);
      else groups.tes.push(el);
    });

    // Guru / Admin?
    const ivBtn = card.querySelector('.js-interview-link, .js-grafindo-link');
    const name = ivBtn ? ivBtn.getAttribute('data-name') : '';
    const position = (ivBtn ? ivBtn.getAttribute('data-position') : '') || '';
    const posLower = position.toLowerCase();
    const isGuru = /guru|dosen|teacher|pengajar/.test(posLower);
    const isAdmin = /admin|staff|sekretariat|office/.test(posLower);
    const slug = slugify(name);

    // Definisi tab
    const tabs = [];
    if (groups.tes.length > 0)          tabs.push({ id: 'tes',        label: '📄 Tes',       items: groups.tes });
    if (groups.grafis.length > 0)       tabs.push({ id: 'grafis',     label: '🎨 Grafis',    items: groups.grafis });
    if (groups.fgd.length > 0)          tabs.push({ id: 'fgd',        label: '🎯 FGD',       items: groups.fgd });
    if (groups.wawancara.length > 0)    tabs.push({ id: 'wawancara',  label: '🎤 Wawancara', items: groups.wawancara });
    if (isGuru)                          tabs.push({ id: 'subject',    label: '📚 Subject',   special: 'subject' });
    if (isAdmin && groups.excel.length)  tabs.push({ id: 'excel',      label: '📊 Excel',     items: groups.excel });

    if (tabs.length === 0) return;

    // Ambil rating untuk guru
    let ratingData = null;
    if (isGuru) ratingData = await loadSubjectRating(slug);

    // Build sidebar
    const sidebarHTML = tabs.map((t, i) => {
      const active = i === 0 ? 'active' : '';
      return '<button class="js-tab-btn ' + active + '" data-tab="' + t.id + '" ' +
        'style="text-align:left;padding:10px 12px;border-radius:9px;' +
        'border:1px solid ' + (i === 0 ? '#3b82f6' : 'rgba(255,255,255,.1)') + ';' +
        'background:' + (i === 0 ? 'linear-gradient(135deg,#3b82f6,#1e40af)' : 'rgba(255,255,255,.04)') + ';' +
        'color:' + (i === 0 ? '#fff' : '#cbd5e1') + ';' +
        'font-family:inherit;font-size:11.5px;font-weight:800;cursor:pointer;' +
        'transition:all .15s ease;white-space:nowrap;">' + t.label + '</button>';
    }).join('');

    // Build content panels (pindahkan nodes)
    const contentHTML = tabs.map((t, i) => {
      const active = i === 0;
      let inner = '';
      if (t.special === 'subject') {
        inner = ratingHTML(slug, ratingData);
      }
      return '<div class="js-tab-panel" data-panel="' + t.id + '" ' +
        'style="display:' + (active ? 'block' : 'none') + ';">' + inner + '</div>';
    }).join('');

    // Buat wrapper baru
       // 🆕 Hapus tombol lama di atas yang sudah jadi tab
    const removeClasses = [
      '.js-interview-link',
      '.js-grafindo-link',
      '.js-fgd-link'
    ];
    removeClasses.forEach(cls => {
      const btns = card.querySelectorAll(cls);
      btns.forEach(b => b.remove());
    });

      '<div class="js-tabs-nav" style="flex:0 0 130px;display:flex;flex-direction:column;gap:6px;">' +
        sidebarHTML +
      '</div>' +
      '<div class="js-tabs-content" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;">' +
        contentHTML +
      '</div>';

    // Pindahkan file items ke panel yang sesuai
    const panels = wrapper.querySelectorAll('.js-tab-panel');
    panels.forEach(p => {
      const tabId = p.getAttribute('data-panel');
      const tabDef = tabs.find(t => t.id === tabId);
      if (tabDef && tabDef.items) {
        tabDef.items.forEach(el => p.appendChild(el));
      }
    });

    // Sembunyikan file list asli, insert wrapper
    fileList.style.display = 'none';
    fileList.parentElement.insertBefore(wrapper, fileList.nextSibling);
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  document.addEventListener('click', function (e) {
    // Tombol reset
    const r = e.target.closest('.js-reset-interview');
    if (r) {
      e.preventDefault();
      e.stopPropagation();
      const name = r.getAttribute('data-name');
      const pos  = r.getAttribute('data-position');
      if (name && typeof window.adminResetInterviewData === 'function') {
        window.adminResetInterviewData(name, pos);
      }
      return;
    }

    // Tab click
    const tabBtn = e.target.closest('.js-tab-btn');
    if (tabBtn) {
      e.preventDefault();
      e.stopPropagation();
      const wrap = tabBtn.closest('.js-tabs-wrap');
      if (!wrap) return;
      const tabId = tabBtn.getAttribute('data-tab');

      wrap.querySelectorAll('.js-tab-btn').forEach(b => {
        const isActive = b === tabBtn;
        b.classList.toggle('active', isActive);
        b.style.borderColor = isActive ? '#3b82f6' : 'rgba(255,255,255,.1)';
        b.style.background  = isActive
          ? 'linear-gradient(135deg,#3b82f6,#1e40af)'
          : 'rgba(255,255,255,.04)';
        b.style.color = isActive ? '#fff' : '#cbd5e1';
      });

      wrap.querySelectorAll('.js-tab-panel').forEach(p => {
        p.style.display = (p.getAttribute('data-panel') === tabId) ? 'block' : 'none';
      });
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
    const card = sel.closest('.rf-card');
    const ivBtn = card ? card.querySelector('.js-interview-link, .js-grafindo-link') : null;
    const name = ivBtn ? ivBtn.getAttribute('data-name') : '';
    const position = ivBtn ? ivBtn.getAttribute('data-position') : '';

    if (!firebase || !firebase.apps.length) return alert('Firebase belum siap');

    sel.disabled = true;
    const ok = await saveSubjectRating(slug, value, name, position);
    sel.disabled = false;

    if (ok) {
      sel.style.boxShadow = '0 0 0 3px rgba(34,197,94,.3)';
      setTimeout(() => { sel.style.boxShadow = ''; }, 1200);
    } else {
      alert('Gagal menyimpan. Coba lagi.');
    }
  }, true);

  /* ============================================================
     SCAN & INIT
     ============================================================ */
  function scanAndRestructure() {
    const cards = document.querySelectorAll('.rf-card');
    cards.forEach(c => { restructureCard(c).catch(() => {}); });
  }

  if (!window.__adminPanelObserver) {
    window.__adminPanelObserver = new MutationObserver(() => {
      clearTimeout(window.__adminPanelTimer);
      window.__adminPanelTimer = setTimeout(scanAndRestructure, 400);
    });
    window.__adminPanelObserver.observe(document.body, {
      childList: true, subtree: true
    });
  }

  setTimeout(scanAndRestructure, 1000);
  setTimeout(scanAndRestructure, 3000);

  console.log('[ADMIN-CANDIDATE-PANEL] ✓ Loaded — tab layout + subject rating');
})();