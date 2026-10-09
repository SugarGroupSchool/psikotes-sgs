/* ============================================================
   js/00t-admin-candidate-panel.js
   ------------------------------------------------------------
   - Kartu kandidat: sidebar tab kiri + konten kanan
   - Tombol aksi (Wawancara/Grafis/FGD) pindah ke dalam panel
   - Tombol Reset HANYA di tab Wawancara
   - Subject rating (1-4) hanya untuk Guru/Dosen
   - Excel tab hanya untuk Admin/Staff
   - Tab Tes: auto-label TAHAP 1, TAHAP 2 jika > 1 file
   - File item: layout vertikal (stack) untuk panel sempit
   - 🆕 Status Lolos / Tidak Lolos + tombol WhatsApp
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

/* ============================================================
   KONFIGURASI EMAIL
   ============================================================ */
const EMAIL_GAS_URL = window.GAS_ADMIN_URL ||
  'https://script.google.com/macros/s/AKfycbxCryXLdQXXbB2k6qxkmbZJF-L2ltL-QgTUygKLFAg0UNVm3NfKHDgso9nB-NomM4en/exec';


  const STATUS_OPTIONS = [
    { value: '',                label: '⏳ Pending',          color: '#94a3b8', bg: 'rgba(148,163,184,.15)', border: 'rgba(148,163,184,.4)' },
    { value: 'lolos',           label: '✅ Lolos',             color: '#86efac', bg: 'rgba(34,197,94,.15)',   border: 'rgba(34,197,94,.5)' },
    { value: 'tidak_lolos',     label: '❌ Tidak Lolos',       color: '#fca5a5', bg: 'rgba(239,68,68,.15)',   border: 'rgba(239,68,68,.5)' },
    { value: 'dipertimbangkan', label: '⭐ Dipertimbangkan',   color: '#fcd34d', bg: 'rgba(245,158,11,.15)',  border: 'rgba(245,158,11,.5)' }
  ];

/* ============================================================
   BUILD EMAIL CONTENT PER STATUS
   ============================================================ */
function buildEmailContent(status, candidateName, position) {
  const nama = candidateName || 'Kandidat';
  const pos = position || 'posisi yang dilamar';
  const timestamp = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const baseStyle = "font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.65;color:#1e293b;max-width:560px;margin:0 auto;padding:0;background:#f8fafc;";

  const header =
    '<div style="background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0;">' +
      '<div style="font-size:11px;font-weight:800;letter-spacing:3px;color:rgba(255,255,255,.85);margin-bottom:4px;">SUGAR GROUP SCHOOLS</div>' +
      '<div style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-.3px;">Human Capital Recruitment</div>' +
    '</div>';

  const footer =
    '<div style="background:#0f172a;color:#94a3b8;padding:20px 24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;line-height:1.7;">' +
      '<div style="font-weight:800;color:#fff;margin-bottom:6px;">Sugar Group Schools</div>' +
      '<div>Human Capital Recruitment Division</div>' +
      '<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;">Email ini dikirim otomatis pada ' + timestamp + '.<br>Mohon tidak membalas langsung ke alamat ini.</div>' +
    '</div>';

  function card(icon, color, inner) {
    return '<div style="' + baseStyle + '">' + header +
      '<div style="background:#fff;padding:32px 28px;">' +
        '<div style="width:68px;height:68px;margin:0 auto 18px;display:flex;align-items:center;justify-content:center;background:' + color + '15;border:2px solid ' + color + '40;border-radius:18px;font-size:34px;">' + icon + '</div>' +
        inner +
      '</div>' + footer + '</div>';
  }

  const greeting =
    '<div style="font-size:15px;color:#475569;margin-bottom:16px;">' +
      'Yth. <b style="color:#1e293b;">' + nama + '</b>,<br>' +
      'Pelamar <b style="color:#1e293b;">' + pos + '</b>' +
    '</div>';

  const signature =
    '<div style="margin-top:28px;padding-top:20px;border-top:1px dashed #e2e8f0;font-size:13px;color:#64748b;line-height:1.8;">' +
      'Hormat kami,<br>' +
      '<b style="color:#1e293b;font-size:14px;">Tim Recruitment</b><br>' +
      'Sugar Group Schools' +
    '</div>';

  if (status === 'lolos') {
    return {
      subject: '\uD83C\uDF89 Selamat! Anda Lolos Seleksi \u2014 ' + pos,
      htmlBody: card('\uD83C\uDF89', '#16a34a',
        greeting +
        '<h1 style="font-size:22px;font-weight:900;color:#166534;margin:0 0 16px;line-height:1.3;">Selamat, Anda Lolos!</h1>' +
        '<p style="margin:0 0 16px;font-size:14.5px;color:#334155;">Kami dengan senang hati menginformasikan bahwa Anda <b style="color:#166534;">DINYATAKAN LOLOS</b> dalam proses seleksi untuk posisi <b>' + pos + '</b> di Sugar Group Schools.</p>' +
        '<div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #86efac;border-radius:12px;padding:16px 18px;margin:20px 0;font-size:13.5px;color:#166534;line-height:1.7;"><b>\uD83D\uDCCC Langkah Selanjutnya:</b><br>Tim HR akan segera menghubungi Anda untuk proses onboarding dan penjadwalan. Mohon pastikan nomor telepon dan email Anda aktif.</div>' +
        '<p style="margin:0;font-size:14px;color:#475569;">Terima kasih atas partisipasi dan kepercayaan Anda kepada Sugar Group Schools.</p>' +
        signature
      )
    };
  }

  if (status === 'tidak_lolos') {
    return {
      subject: 'Hasil Seleksi \u2014 ' + pos + ' \u2014 Sugar Group Schools',
      htmlBody: card('\uD83D\uDCCB', '#dc2626',
        greeting +
        '<h1 style="font-size:20px;font-weight:900;color:#991b1b;margin:0 0 16px;line-height:1.3;">Informasi Hasil Seleksi</h1>' +
        '<p style="margin:0 0 16px;font-size:14.5px;color:#334155;">Terima kasih atas partisipasi Anda dalam proses seleksi untuk posisi <b>' + pos + '</b> di Sugar Group Schools.</p>' +
        '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 18px;margin:20px 0;font-size:13.5px;color:#7f1d1d;line-height:1.7;">Setelah melalui pertimbangan yang matang, kami belum dapat melanjutkan proses Anda ke tahap berikutnya.</div>' +
        '<p style="margin:0 0 16px;font-size:14px;color:#475569;">Namun, kami sangat mengapresiasi waktu, usaha, dan minat Anda. Semoga sukses di kesempatan berikutnya.</p>' +
        signature
      )
    };
  }

  if (status === 'dipertimbangkan') {
    return {
      subject: 'Status Seleksi Anda \u2014 ' + pos + ' \u2014 Sugar Group Schools',
      htmlBody: card('\u2B50', '#d97706',
        greeting +
        '<h1 style="font-size:20px;font-weight:900;color:#92400e;margin:0 0 16px;line-height:1.3;">Berkas Anda Sedang Dipertimbangkan</h1>' +
        '<p style="margin:0 0 16px;font-size:14.5px;color:#334155;">Terima kasih atas kesabaran Anda selama proses seleksi untuk posisi <b>' + pos + '</b>.</p>' +
        '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 18px;margin:20px 0;font-size:13.5px;color:#78350f;line-height:1.7;">Saat ini berkas Anda <b>masih dalam tahap pertimbangan</b>. Kami akan menghubungi Anda kembali setelah proses seleksi selesai.</div>' +
        '<p style="margin:0;font-size:14px;color:#475569;">Mohon tetap aktif dan pastikan kontak Anda dapat dihubungi.</p>' +
        signature
      )
    };
  }

  return {
    subject: 'Konfirmasi Proses Seleksi \u2014 ' + pos,
    htmlBody: card('\u2139\uFE0F', '#3b82f6',
      greeting +
      '<h1 style="font-size:20px;font-weight:900;color:#1e40af;margin:0 0 16px;line-height:1.3;">Konfirmasi Proses Seleksi</h1>' +
      '<p style="margin:0 0 16px;font-size:14.5px;color:#334155;">Kami dari Sugar Group Schools ingin mengonfirmasi mengenai proses seleksi Anda untuk posisi <b>' + pos + '</b>.</p>' +
      '<p style="margin:0;font-size:14px;color:#475569;">Mohon hubungi tim recruitment untuk informasi lebih lanjut.</p>' +
      signature
    )
  };
}

/* ============================================================
   CARI EMAIL KANDIDAT
   ============================================================ */
async function findEmail(slug, candidateName) {
  try {
    const snap = await firebase.database()
      .ref('sgs_candidate_status/' + slug + '/email').once('value');
    const cached = snap.val();
    if (cached) return cached;
  } catch (e) {}

  try {
    const snap = await firebase.database().ref('sgs_state/sessions').once('value');
    const sessions = snap.val() || {};
    const nameLower = String(candidateName || '').toLowerCase().trim();
    for (const devId in sessions) {
      const s = sessions[devId] || {};
      if (s.name && String(s.name).toLowerCase().trim() === nameLower) {
        if (s.email) {
          await firebase.database()
            .ref('sgs_candidate_status/' + slug + '/email')
            .set(s.email);
          return s.email;
        }
      }
    }
  } catch (e) {}

  return null;
}

/* ============================================================
   VALIDASI EMAIL
   ============================================================ */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

/* ============================================================
   KIRIM EMAIL VIA GAS
   ============================================================ */
async function sendStatusEmail(slug, candidateName, position, statusValue, email) {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    alert('Firebase belum siap');
    return false;
  }
  if (!isValidEmail(email)) {
    alert('Format email tidak valid: ' + email);
    return false;
  }

  const content = buildEmailContent(statusValue, candidateName, position);

  let idToken = '';
  try {
    const user = firebase.auth().currentUser;
    if (user) idToken = await user.getIdToken();
  } catch (e) {}

  const payload = {
    action: 'send_status_email',
    idToken: idToken,
    to: email,
    name: candidateName,
    position: position,
    status: statusValue,
    subject: content.subject,
    htmlBody: content.htmlBody
  };

  try {
    await fetch(EMAIL_GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    await firebase.database()
      .ref('sgs_candidate_status/' + slug)
      .update({
        email: email,
        emailSentAt: firebase.database.ServerValue.TIMESTAMP,
        emailSentStatus: statusValue,
        emailSentBy: 'admin'
      });

    return true;
  } catch (e) {
    console.error('[EMAIL] Gagal:', e);
    return false;
  }
}


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

  function normalizePhoneWA(phone) {
    let p = String(phone || '').replace(/[^0-9]/g, '');
    if (!p) return null;
    if (p.startsWith('0')) p = '62' + p.slice(1);
    if (p.startsWith('62')) return p;
    if (p.length >= 9 && p.length <= 13) return '62' + p;
    return p;
  }

  /* ============================================================
     STATUS LOLOS
     ============================================================ */
  async function loadStatus(slug) {
    try {
      const snap = await firebase.database().ref('sgs_candidate_status/' + slug).once('value');
      return snap.val() || {};
    } catch (e) { return {}; }
  }

  async function saveStatus(slug, status, name, position) {
    try {
      await firebase.database().ref('sgs_candidate_status/' + slug).update({
        status: status || '',
        candidateName: name || '',
        candidatePosition: position || '',
        ts: firebase.database.ServerValue.TIMESTAMP,
        updatedBy: 'admin'
      });
      return true;
    } catch (e) { return false; }
  }

  async function findPhone(slug, candidateName) {
    // 1. Cek cache di sgs_candidate_status
    try {
      const snap = await firebase.database().ref('sgs_candidate_status/' + slug + '/phone').once('value');
      const cached = snap.val();
      if (cached) return cached;
    } catch (e) {}

    // 2. Cari di sgs_state/sessions by name
    try {
      const snap = await firebase.database().ref('sgs_state/sessions').once('value');
      const sessions = snap.val() || {};
      const nameLower = String(candidateName || '').toLowerCase().trim();
      for (const devId in sessions) {
        const s = sessions[devId] || {};
        if (s.name && String(s.name).toLowerCase().trim() === nameLower) {
          if (s.phone) {
            // Cache ke sgs_candidate_status
            await firebase.database().ref('sgs_candidate_status/' + slug + '/phone').set(s.phone);
            return s.phone;
          }
        }
      }
    } catch (e) {}

    return null;
  }

  function buildWAMessage(status, candidateName, position) {
    const nama = candidateName || 'Kandidat';
    const pos = position || 'yang dilamar';
    if (status === 'lolos') {
      return 'Halo ' + nama + ',\n\n' +
        'Selamat! Anda dinyatakan LOLOS dalam proses seleksi untuk posisi ' + pos + ' di Sugar Group Schools. 🎉\n\n' +
        'Tim HR akan menghubungi Anda untuk proses selanjutnya.\n\n' +
        'Terima kasih,\nSugar Group Schools';
    }
    if (status === 'tidak_lolos') {
      return 'Halo ' + nama + ',\n\n' +
        'Terima kasih atas partisipasi Anda dalam proses seleksi untuk posisi ' + pos + ' di Sugar Group Schools.\n\n' +
        'Setelah melalui pertimbangan yang matang, kami belum dapat melanjutkan proses Anda ke tahap berikutnya. Namun, kami mengapresiasi waktu dan usaha Anda.\n\n' +
        'Semoga sukses di kesempatan berikutnya.\n\n' +
        'Salam,\nSugar Group Schools';
    }
    if (status === 'dipertimbangkan') {
      return 'Halo ' + nama + ',\n\n' +
        'Terima kasih atas partisipasi Anda dalam proses seleksi untuk posisi ' + pos + ' di Sugar Group Schools.\n\n' +
        'Saat ini berkas Anda masih dalam tahap pertimbangan. Kami akan menghubungi Anda kembali setelah proses selesai.\n\n' +
        'Salam,\nSugar Group Schools';
    }
    // Pending
    return 'Halo ' + nama + ',\n\n' +
      'Kami dari Sugar Group Schools ingin mengonfirmasi mengenai proses seleksi Anda untuk posisi ' + pos + '.\n\n' +
      'Mohon info lebih lanjut.\n\nTerima kasih.';
  }

  async function openWhatsApp(slug, candidateName, position, statusValue) {
    let phone = await findPhone(slug, candidateName);

    if (!phone) {
      // Minta input manual
      const input = (typeof window.sgsPrompt === 'function')
        ? await window.sgsPrompt(
            'Nomor WhatsApp untuk ' + candidateName + ':\n\n' +
            'Format: 08xxx atau 628xxx',
            '',
            { title: '📱 Nomor WhatsApp', okText: 'Simpan & Buka WA' }
          )
        : prompt('Nomor WhatsApp (08xxx):');
      if (!input) return;

      phone = String(input).trim();
      // Simpan ke cache
      try {
        await firebase.database().ref('sgs_candidate_status/' + slug).update({
          phone: phone,
          candidateName: candidateName,
          candidatePosition: position,
          ts: firebase.database.ServerValue.TIMESTAMP
        });
      } catch (e) {}
    }

    const norm = normalizePhoneWA(phone);
    if (!norm) {
      alert('Nomor WA tidak valid: ' + phone);
      return;
    }

    const message = buildWAMessage(statusValue, candidateName, position);
    const url = 'https://wa.me/' + norm + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /* ============================================================
     RESET DATA WAWANCARA
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
     COMPACT FILE ITEM
     ============================================================ */
  function compactFileItem(el) {
    if (!el || el.dataset.compact === '1') return;
    el.dataset.compact = '1';

    const kids = Array.from(el.children);
    if (kids.length < 3) return;

    const icon = kids[0];
    const content = kids[1];
    const btns = kids[2];

    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'stretch';
    el.style.gap = '8px';
    el.style.padding = '10px';

    const topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex;align-items:flex-start;gap:8px;width:100%;';

    if (icon) {
      icon.style.width = '28px';
      icon.style.height = '28px';
      icon.style.flex = '0 0 28px';
      icon.style.fontSize = '14px';
      icon.style.borderRadius = '7px';
    }
    if (content) {
      content.style.flex = '1';
      content.style.minWidth = '0';
      content.style.overflow = 'hidden';
    }

    el.innerHTML = '';
    if (icon) topRow.appendChild(icon);
    if (content) topRow.appendChild(content);
    el.appendChild(topRow);

    if (btns) {
      btns.style.display = 'flex';
      btns.style.gap = '6px';
      btns.style.flexWrap = 'wrap';
      btns.style.width = '100%';
      btns.style.justifyContent = 'flex-end';
      el.appendChild(btns);
    }
  }

  /* ============================================================
     STATUS BAR HTML
     ============================================================ */
  function statusBarHTML(slug, statusData, name, position) {
    const cur = statusData?.status || '';
    const curOpt = STATUS_OPTIONS.find(s => s.value === cur) || STATUS_OPTIONS[0];

    const opts = STATUS_OPTIONS.map(s =>
      '<option value="' + s.value + '"' + (s.value === cur ? ' selected' : '') + '>' +
      esc(s.label) + '</option>'
    ).join('');

    return (
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;' +
      'padding:10px 12px;background:rgba(255,255,255,.03);' +
      'border:1px solid rgba(255,255,255,.08);border-radius:12px;margin-top:10px;">' +
        '<span style="font-size:10.5px;font-weight:800;color:#94a3b8;' +
        'letter-spacing:1px;text-transform:uppercase;">Status Kelulusan</span>' +
        '<select class="js-candidate-status" data-slug="' + esc(slug) + '" ' +
          'data-name="' + esc(name) + '" data-position="' + esc(position) + '" ' +
          'style="padding:6px 10px;border-radius:8px;' +
          'background:' + curOpt.bg + ';border:1.5px solid ' + curOpt.border + ';' +
          'color:' + curOpt.color + ';font-family:inherit;font-size:11.5px;' +
          'font-weight:800;cursor:pointer;outline:none;">' +
          opts +
        '</select>' +
        '<button class="js-wa-btn" data-slug="' + esc(slug) + '" ' +
          'data-name="' + esc(name) + '" data-position="' + esc(position) + '" ' +
          'style="padding:7px 14px;border-radius:8px;' +
          'background:linear-gradient(135deg,#25d366,#128c7e);' +
          'border:1px solid rgba(37,211,102,.5);color:#fff;' +
          'font-family:inherit;font-size:11.5px;font-weight:800;' +
          'cursor:pointer;white-space:nowrap;' +
          'box-shadow:0 4px 12px rgba(37,211,102,.2);">' +
          '📱 Hubungi WA' +
        '</button>' +
      '<button class="js-email-btn" data-slug="' + esc(slug) + '" ' +
        'data-name="' + esc(name) + '" data-position="' + esc(position) + '" ' +
        'style="padding:7px 14px;border-radius:8px;' +
        'background:linear-gradient(135deg,#8b5cf6,#6d28d9);' +
        'border:1px solid rgba(139,92,246,.5);color:#fff;' +
        'font-family:inherit;font-size:11.5px;font-weight:800;' +
        'cursor:pointer;white-space:nowrap;' +
        'box-shadow:0 4px 12px rgba(139,92,246,.2);">' +
        '📧 Kirim Email' +
      '</button>' +
      '</div>'
    );
  }

  /* ============================================================
     RESTRUCTURE CARD
     ============================================================ */
  async function restructureCard(card) {
    if (card.dataset.tabbed === '1') return;

    const kids = Array.from(card.children);
    const fileList = kids.find(el => {
      const s = (el.getAttribute('style') || '') + (el.style.cssText || '');
      return el.children.length > 0 && /flex-direction\s*:\s*column/.test(s);
    });
    if (!fileList) return;

    const items = Array.from(fileList.children);

    card.dataset.tabbed = '1';

    const groups = { tes: [], grafis: [], fgd: [], wawancara: [], excel: [] };
    items.forEach(el => {
      const cat = detectCat(el.outerHTML);
      if (groups[cat]) groups[cat].push(el);
      else groups.tes.push(el);
    });

    const pureTesFiles = groups.tes.filter(el => {
      const h = el.outerHTML.toLowerCase();
      return !/-wawancara-|-fgd-|-grafis-|xlsx/.test(h);
    });

    const ivBtn  = card.querySelector('.js-interview-link');
    const grBtn  = card.querySelector('.js-grafindo-link');
    const fgdBtn = card.querySelector('.js-fgd-link');

    const anyBtn = ivBtn || grBtn || fgdBtn;
    const name = anyBtn ? anyBtn.getAttribute('data-name') : '';
    const position = (anyBtn ? anyBtn.getAttribute('data-position') : '') || '';
    const posLower = position.toLowerCase();
    const isGuru = /guru|dosen|teacher|pengajar/.test(posLower);
    const isAdmin = /admin|staff|sekretariat|office/.test(posLower);
    const slug = slugify(name);

    // Load data paralel
    const [ratingData, statusData] = await Promise.all([
      isGuru ? loadSubjectRating(slug) : Promise.resolve(null),
      loadStatus(slug)
    ]);

    // Definisikan tab
    const tabs = [];
    tabs.push({ id: 'tes', label: '📄 Tes', items: pureTesFiles, multiLabel: true });

    if (grBtn || groups.grafis.length > 0) {
      tabs.push({ id: 'grafis', label: '🎨 Grafis', items: groups.grafis, actionBtn: grBtn });
    }
    if (fgdBtn || groups.fgd.length > 0) {
      tabs.push({ id: 'fgd', label: '🎯 FGD', items: groups.fgd, actionBtn: fgdBtn });
    }
    if (ivBtn || groups.wawancara.length > 0) {
      tabs.push({ id: 'wawancara', label: '🎤 Wawancara', items: groups.wawancara, actionBtn: ivBtn });
    }
    if (isGuru) {
      tabs.push({ id: 'subject', label: '📚 Subject', special: 'subject' });
    }
    if (isAdmin && groups.excel.length > 0) {
      tabs.push({ id: 'excel', label: '📊 Excel', items: groups.excel });
    }

    // Wrapper utama
    const wrapper = document.createElement('div');
    wrapper.className = 'js-tabs-wrap';
    wrapper.style.cssText = 'display:flex;gap:12px;margin-top:12px;';

    const navHTML = tabs.map((t, i) => {
      const active = i === 0;
      return '<button class="js-tab-btn" data-tab="' + t.id + '" ' +
        'style="text-align:left;padding:9px 11px;border-radius:10px;' +
        'border:1.5px solid ' + (active ? '#3b82f6' : 'rgba(255,255,255,.1)') + ';' +
        'background:' + (active ? 'linear-gradient(135deg,#3b82f6,#1e40af)' : 'rgba(255,255,255,.04)') + ';' +
        'color:' + (active ? '#fff' : '#cbd5e1') + ';' +
        'font-family:inherit;font-size:11px;font-weight:800;' +
        'cursor:pointer;transition:all .15s ease;white-space:nowrap;">' +
        t.label + '</button>';
    }).join('');

    const panelsHTML = tabs.map((t, i) => {
      const active = i === 0;
      return '<div class="js-tab-panel" data-panel="' + t.id + '" ' +
        'style="display:' + (active ? 'block' : 'none') + ';"></div>';
    }).join('');

    wrapper.innerHTML =
      '<div class="js-tabs-nav" style="flex:0 0 110px;display:flex;flex-direction:column;gap:8px;align-self:flex-start;position:sticky;top:0;">' +
        navHTML +
      '</div>' +
      '<div class="js-tabs-content" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;">' +
        panelsHTML +
      '</div>';

    // Isi setiap panel
    tabs.forEach(t => {
      const panel = wrapper.querySelector('.js-tab-panel[data-panel="' + t.id + '"]');
      if (!panel) return;

      if (t.special === 'subject') {
        panel.innerHTML = ratingHTML(slug, ratingData);
        return;
      }

      if (t.id === 'wawancara' && t.actionBtn) {
        const btnWrap = document.createElement('div');
        btnWrap.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;';

        t.actionBtn.style.flex = '1';
        t.actionBtn.style.padding = '10px 14px';
        t.actionBtn.style.fontSize = '12px';
        t.actionBtn.style.boxSizing = 'border-box';
        btnWrap.appendChild(t.actionBtn);

        const resetBtn = document.createElement('button');
        resetBtn.className = 'js-reset-interview';
        resetBtn.setAttribute('data-name', name);
        resetBtn.setAttribute('data-position', position);
        resetBtn.textContent = '🔄 Reset';
        resetBtn.title = 'Hapus semua data wawancara kandidat ini';
        resetBtn.style.cssText =
          'padding:10px 14px;border-radius:10px;' +
          'border:1.5px solid rgba(239,68,68,.5);' +
          'background:rgba(239,68,68,.15);color:#fca5a5;' +
          'font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;' +
          'white-space:nowrap;';
        btnWrap.appendChild(resetBtn);

        panel.appendChild(btnWrap);
      }
      else if (t.actionBtn) {
        t.actionBtn.style.width = '100%';
        t.actionBtn.style.padding = '10px 14px';
        t.actionBtn.style.fontSize = '12px';
        t.actionBtn.style.marginBottom = '4px';
        t.actionBtn.style.boxSizing = 'border-box';
        t.actionBtn.style.display = 'block';
        panel.appendChild(t.actionBtn);
      }

      if (t.items && t.items.length > 0) {
        const showLabel = t.multiLabel && t.items.length > 1;
        t.items.forEach((el, idx) => {
          compactFileItem(el);
          if (showLabel) {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'margin-bottom:8px;';

            const badge = document.createElement('div');
            badge.style.cssText =
              'display:inline-block;padding:3px 10px;border-radius:6px;' +
              'background:linear-gradient(135deg,#3b82f6,#1e40af);' +
              'color:#fff;font-size:9.5px;font-weight:900;letter-spacing:1px;' +
              'text-transform:uppercase;margin-bottom:5px;';
            badge.textContent = 'TAHAP ' + (idx + 1);

            wrap.appendChild(badge);
            wrap.appendChild(el);
            panel.appendChild(wrap);
          } else {
            panel.appendChild(el);
          }
        });
      } else if (!t.actionBtn) {
        const empty = document.createElement('div');
        empty.style.cssText =
          'padding:20px;text-align:center;color:#64748b;font-size:12px;' +
          'background:rgba(255,255,255,.03);border-radius:10px;border:1px dashed rgba(255,255,255,.1);';
        empty.textContent = 'Belum ada file';
        panel.appendChild(empty);
      }
    });

    // Sembunyikan file list asli, insert wrapper
    fileList.style.display = 'none';

    // Insert status bar + tabs wrapper
    const statusBar = document.createElement('div');
    statusBar.className = 'js-status-bar';
    statusBar.innerHTML = statusBarHTML(slug, statusData, name, position);

    fileList.parentElement.insertBefore(statusBar, fileList);
    fileList.parentElement.insertBefore(wrapper, fileList.nextSibling);

    // Cleanup tombol reset lama
    setTimeout(() => {
      card.querySelectorAll(':scope > .js-reset-interview').forEach(b => b.remove());
    }, 100);
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  document.addEventListener('click', function (e) {
    // Reset
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

    // WA
    const wa = e.target.closest('.js-wa-btn');
    if (wa) {
      e.preventDefault();
      e.stopPropagation();
      const slug = wa.getAttribute('data-slug');
      const name = wa.getAttribute('data-name');
      const position = wa.getAttribute('data-position');

      // Cari status terkini dari dropdown
      const bar = wa.closest('.js-status-bar');
      const statusSel = bar ? bar.querySelector('.js-candidate-status') : null;
      const statusValue = statusSel ? statusSel.value : '';

      openWhatsApp(slug, name, position, statusValue);
      return;
    }


    // EMAIL
    const emailBtn = e.target.closest('.js-email-btn');
    if (emailBtn) {
      e.preventDefault();
      e.stopPropagation();
      const slug = emailBtn.getAttribute('data-slug');
      const name = emailBtn.getAttribute('data-name');
      const position = emailBtn.getAttribute('data-position');

      const bar = emailBtn.closest('.js-status-bar');
      const statusSel = bar ? bar.querySelector('.js-candidate-status') : null;
      const statusValue = statusSel ? statusSel.value : '';

      if (!statusValue) {
        alert('Pilih status kelulusan dulu sebelum kirim email.');
        return;
      }

      (async () => {
        let email = await findEmail(slug, name);

        if (!email) {
          const input = (typeof window.sgsPrompt === 'function')
            ? await window.sgsPrompt(
                'Email kandidat untuk ' + name + ':\n\nContoh: kandidat@email.com',
                '',
                { title: '📧 Alamat Email', okText: 'Simpan & Kirim' }
              )
            : prompt('Email kandidat:');
          if (!input) return;

          email = String(input).trim();
          if (!isValidEmail(email)) {
            alert('Format email tidak valid: ' + email);
            return;
          }

          try {
            await firebase.database()
              .ref('sgs_candidate_status/' + slug)
              .update({
                email: email,
                candidateName: name,
                candidatePosition: position,
                ts: firebase.database.ServerValue.TIMESTAMP
              });
          } catch (err) {}
        }

        const okMsg = 'Kirim email ke:\n\n👤 ' + name + '\n📧 ' + email +
          '\n📋 Status: ' + statusValue + '\n\nLanjutkan?';

        const ok = (typeof window.sgsConfirm === 'function')
          ? await window.sgsConfirm(okMsg, { title: '📧 Konfirmasi Kirim Email', okText: 'Ya, Kirim' })
          : confirm(okMsg);
        if (!ok) return;

        const prev = emailBtn.textContent;
        emailBtn.disabled = true;
        emailBtn.textContent = '⏳ Mengirim...';
        emailBtn.style.opacity = '.7';
        emailBtn.style.cursor = 'wait';

        const success = await sendStatusEmail(slug, name, position, statusValue, email);

        emailBtn.disabled = false;
        emailBtn.textContent = success ? '✅ Terkirim' : prev;
        emailBtn.style.opacity = '1';
        emailBtn.style.cursor = 'pointer';

        if (success) {
          setTimeout(() => { emailBtn.textContent = prev; }, 2500);
        } else {
          alert('❌ Gagal mengirim email. Cek koneksi & coba lagi.');
        }
      })();

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
    // Subject rating
    const sel = e.target.closest('.js-subject-rating');
    if (sel) {
      e.preventDefault();
      e.stopPropagation();

      const slug = sel.getAttribute('data-slug');
      const value = Number(sel.value);
      const card = sel.closest('.rf-card');
      const anyBtn = card ? card.querySelector('.js-interview-link, .js-grafindo-link, .js-fgd-link') : null;
      const name = anyBtn ? anyBtn.getAttribute('data-name') : '';
      const position = anyBtn ? anyBtn.getAttribute('data-position') : '';

      if (!firebase || !firebase.apps.length) return;

      sel.disabled = true;
      const ok = await saveSubjectRating(slug, value, name, position);
      sel.disabled = false;

      if (ok) {
        sel.style.boxShadow = '0 0 0 3px rgba(34,197,94,.3)';
        setTimeout(() => { sel.style.boxShadow = ''; }, 1200);
      }
      return;
    }

    // Candidate status
    const statSel = e.target.closest('.js-candidate-status');
    if (statSel) {
      e.preventDefault();
      e.stopPropagation();

      const slug = statSel.getAttribute('data-slug');
      const name = statSel.getAttribute('data-name');
      const position = statSel.getAttribute('data-position');
      const value = statSel.value;

      if (!firebase || !firebase.apps.length) return;

      statSel.disabled = true;
      const ok = await saveStatus(slug, value, name, position);
      statSel.disabled = false;

      if (ok) {
        const opt = STATUS_OPTIONS.find(s => s.value === value) || STATUS_OPTIONS[0];
        statSel.style.background = opt.bg;
        statSel.style.borderColor = opt.border;
        statSel.style.color = opt.color;

        statSel.style.boxShadow = '0 0 0 3px rgba(34,197,94,.3)';
        setTimeout(() => { statSel.style.boxShadow = ''; }, 1200);
      }
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

  console.log('[ADMIN-CANDIDATE-PANEL] ✓ Loaded — tab + status + WA + reset');
})();