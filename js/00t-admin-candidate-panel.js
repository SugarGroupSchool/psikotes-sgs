/* ============================================================
   js/00t-admin-candidate-panel.js
   ------------------------------------------------------------
   - Kartu kandidat: sidebar tab kiri + konten kanan
   - Tombol aksi (Wawancara/Grafis/FGD) pindah ke dalam panel
   - Tombol Reset HANYA di tab Wawancara
   - Subject rating (1-4) hanya untuk Guru/Dosen
   - Excel tab hanya untuk Admin/Staff
   - FGD hanya untuk posisi Guru/Dosen
   - Tab Tes: auto-label TAHAP 1, TAHAP 2 jika > 1 file
   - Status Lolos / Tidak Lolos + tombol WhatsApp + Kirim Email
   - Auto-fetch email & phone dari Firebase + Drive
   - Layout: Tabs di atas → Status collapsible di bawah
   - Tombol 🗑️ BESAR hapus total kandidat (Drive + Firebase)
   - 🆕 Retake panel DI DALAM tab Tes + modal filter tes selesai
   - ✅ FIX [2026-10-13]: fuzzy name match + dropdown sesi manual
   - ✅ FIX [2026-10-13]: jadwal mulai + countdown
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     🆕 GAS_ADMIN_URL — safety net
     ============================================================ */
  if (typeof window.GAS_ADMIN_URL !== 'string' || !window.GAS_ADMIN_URL) {
    window.GAS_ADMIN_URL = 'https://script.google.com/macros/s/AKfycbzsdy_aGU5vN6mrkXvNbKBO4nHym6xIGhDNT0u_Urz3qQ2w3jFjwMzjfv0ipQxmqyBG/exec';
    console.log('[INIT] GAS_ADMIN_URL di-set (fallback):', window.GAS_ADMIN_URL);
  }

  /* ============================================================
     🆕 HIDE TOMBOL SAMPAH KECIL
     ============================================================ */
  (function __hideSmallTrashButtons() {
    if (document.getElementById('sgs-hide-small-trash')) return;
    const st = document.createElement('style');
    st.id = 'sgs-hide-small-trash';
    st.textContent = `
      .js-delete-file {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        width: 0 !important;
        height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(st);
    console.log('[UI] 🗑️ Tombol sampah kecil disembunyikan');
  })();

  const SUBJECT_RATINGS = [
    { value: 0, label: '— Belum dinilai —' },
    { value: 1, label: '1 — Not Recommended' },
    { value: 2, label: '2 — Fairly Recommended' },
    { value: 3, label: '3 — Recommended' },
    { value: 4, label: '4 — Highly Recommended' }
  ];

  const EMAIL_GAS_URL = window.GAS_ADMIN_URL;

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
    if (typeof firebase === 'undefined' || !firebase.apps.length) return null;

    try {
      const snap = await firebase.database()
        .ref('sgs_candidate_status/' + slug + '/email').once('value');
      const cached = snap.val();
      if (cached && String(cached).includes('@')) return cached;
    } catch (e) {}

    try {
      const snap = await firebase.database().ref('sgs_state/sessions').once('value');
      const sessions = snap.val() || {};
      const nameLower = String(candidateName || '').toLowerCase().trim();
      for (const devId in sessions) {
        const s = sessions[devId] || {};
        if (s.name && String(s.name).toLowerCase().trim() === nameLower) {
          if (s.email && String(s.email).includes('@')) {
            await firebase.database()
              .ref('sgs_candidate_status/' + slug)
              .update({ email: s.email, phone: s.phone || '' });
            return s.email;
          }
        }
      }
    } catch (e) {}

    try {
      const snap = await firebase.database().ref('sgs_interviews/' + slug).once('value');
      const data = snap.val() || {};
      for (const iv in data) {
        const it = data[iv] || {};
        if (it.candidateEmail && String(it.candidateEmail).includes('@')) {
          await firebase.database()
            .ref('sgs_candidate_status/' + slug)
            .update({ email: it.candidateEmail });
          return it.candidateEmail;
        }
      }
    } catch (e) {}

    try {
      if (typeof window.fetchResultFiles === 'function') {
        const files = await window.fetchResultFiles(false);
        const nameLower = String(candidateName || '').toLowerCase().trim();
        for (const f of files) {
          const desc = String(f.description || '');
          const namaMatch = desc.match(/Nama:\s*(.+)/i);
          if (!namaMatch) continue;
          const fileNama = String(namaMatch[1]).toLowerCase().trim();
          if (fileNama !== nameLower) continue;
          const emailMatch = desc.match(/Email:\s*([^\s\n]+@[^\s\n]+)/i);
          if (emailMatch && emailMatch[1] && emailMatch[1].includes('@')) {
            const email = emailMatch[1].trim();
            await firebase.database()
              .ref('sgs_candidate_status/' + slug)
              .update({ email: email });
            return email;
          }
        }
      }
    } catch (e) {}

    return null;
  }

  /* ============================================================
     CARI PHONE KANDIDAT
     ============================================================ */
  async function findPhone(slug, candidateName) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return null;

    try {
      const snap = await firebase.database()
        .ref('sgs_candidate_status/' + slug + '/phone').once('value');
      const cached = snap.val();
      if (cached && String(cached).replace(/\D/g, '').length >= 9) return cached;
    } catch (e) {}

    try {
      const snap = await firebase.database().ref('sgs_state/sessions').once('value');
      const sessions = snap.val() || {};
      const nameLower = String(candidateName || '').toLowerCase().trim();
      for (const devId in sessions) {
        const s = sessions[devId] || {};
        if (s.name && String(s.name).toLowerCase().trim() === nameLower) {
          if (s.phone && String(s.phone).replace(/\D/g, '').length >= 9) {
            await firebase.database()
              .ref('sgs_candidate_status/' + slug)
              .update({ phone: s.phone, email: s.email || '' });
            return s.phone;
          }
        }
      }
    } catch (e) {}

    try {
      if (typeof window.fetchResultFiles === 'function') {
        const files = await window.fetchResultFiles(false);
        const nameLower = String(candidateName || '').toLowerCase().trim();
        for (const f of files) {
          const desc = String(f.description || '');
          const namaMatch = desc.match(/Nama:\s*(.+)/i);
          if (!namaMatch) continue;
          const fileNama = String(namaMatch[1]).toLowerCase().trim();
          if (fileNama !== nameLower) continue;
          const phoneMatch = desc.match(/(?:No\.?\s*HP|Phone|HP):\s*([0-9+\-\s]{8,20})/i);
          if (phoneMatch && phoneMatch[1]) {
            const phone = phoneMatch[1].replace(/\D/g, '');
            if (phone.length >= 9) {
              await firebase.database()
                .ref('sgs_candidate_status/' + slug)
                .update({ phone: phone });
              return phone;
            }
          }
        }
      }
    } catch (e) {}

    return null;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

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

  /* ============================================================
     HELPERS
     ============================================================ */
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
    return 'Halo ' + nama + ',\n\n' +
      'Kami dari Sugar Group Schools ingin mengonfirmasi mengenai proses seleksi Anda untuk posisi ' + pos + '.\n\n' +
      'Mohon info lebih lanjut.\n\nTerima kasih.';
  }

  async function openWhatsApp(slug, candidateName, position, statusValue) {
    let phone = await findPhone(slug, candidateName);

    if (!phone) {
      const input = (typeof window.sgsPrompt === 'function')
        ? await window.sgsPrompt(
            'Nomor WhatsApp untuk ' + candidateName + ' tidak ditemukan di sistem.\n\n' +
            'Masukkan manual (format: 08xxx atau 628xxx) — atau klik Batal.',
            '',
            { title: '📱 Nomor WhatsApp', okText: 'Simpan & Buka WA' }
          )
        : prompt('Nomor WhatsApp (08xxx):');
      if (!input) {
        if (typeof window.__showToast === 'function') {
          window.__showToast('Dibatalkan — nomor WA tidak tersedia', 'warn');
        }
        return;
      }

      phone = String(input).trim();
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
     RETAKE — Tombol pembuka modal
     ============================================================ */
  function retakeHTML(slug, statusData, name, position) {
    return (
      '<div style="padding:14px;' +
      'background:linear-gradient(135deg,rgba(59,130,246,.08),rgba(139,92,246,.05));' +
      'border:1.5px solid rgba(59,130,246,.25);border-radius:12px;">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
          '<div style="width:36px;height:36px;flex:0 0 36px;display:grid;place-items:center;' +
          'background:linear-gradient(135deg,#3b82f6,#1e40af);border-radius:10px;font-size:18px;">📤</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:12px;font-weight:900;color:#93c5fd;margin-bottom:2px;">' +
              '📤 Tes Tahap Berikutnya</div>' +
            '<div style="font-size:10.5px;color:#94a3b8;line-height:1.4;">' +
              'Kirim link tes ulang — kandidat langsung masuk tanpa isi data.</div>' +
          '</div>' +
        '</div>' +
        '<button class="js-retake-open" ' +
          'data-slug="' + esc(slug) + '" ' +
          'data-name="' + esc(name) + '" ' +
          'data-position="' + esc(position) + '" ' +
          'style="width:100%;padding:11px 14px;border-radius:10px;' +
          'background:linear-gradient(135deg,#3b82f6,#1e40af);' +
          'border:0;color:#fff;font-family:inherit;font-size:12.5px;' +
          'font-weight:900;cursor:pointer;' +
          'box-shadow:0 4px 12px rgba(59,130,246,.3);">' +
          '📤 Kirim Link Tes Tahap Berikutnya' +
        '</button>' +
      '</div>'
    );
  }

  function __isDefaultSessionName(n) {
    const s = String(n || '').trim().toLowerCase();
    if (!s) return true;
    if (s.length < 3) return true;
    if (/^ip\s*:/.test(s)) return true;
    if (/^\(memuat/.test(s)) return true;
    if (/^(belum|not|no|unknown|anonymous|anonim|guest|kandidat|peserta|user|loading|memuat)\b/i.test(s)) return true;
    if (/(belum\s*login|not\s*login|not\s*logged|belum\s*isi|not\s*filled)/i.test(s)) return true;
    return false;
  }


  /* ============================================================
     🆕 Fuzzy name matching
     ============================================================ */
  function __normName(str) {
    return String(str || '').toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function __isNameMatch(sessionName, targetNorm, targetWords) {
    const sNorm = __normName(sessionName);
    if (!sNorm || !targetNorm) return false;

    if (sNorm === targetNorm) return true;

    const sWords = sNorm.split(' ').filter(Boolean);
    if (sWords.length >= 2 && targetWords.length >= 2) {
      if (sWords[0] === targetWords[0] &&
          sWords[sWords.length - 1] === targetWords[targetWords.length - 1]) {
        return true;
      }
    }

    if (sNorm.includes(targetNorm) || targetNorm.includes(sNorm)) {
      const sSet = new Set(sWords);
      const tSet = new Set(targetWords);
      let common = 0;
      tSet.forEach(w => { if (sSet.has(w)) common++; });
      if (common >= 2) return true;
    }

    return false;
  }

  /* ============================================================
     🆕 List semua session dengan completed — untuk dropdown manual
     ============================================================ */
  async function __listSessionsWithCompleted() {
    try {
      if (typeof firebase === 'undefined' || !firebase.apps.length) return [];
      const snap = await firebase.database().ref('sgs_state/sessions').once('value');
      const sessions = snap.val() || {};
      const list = [];

      for (const devId in sessions) {
        const s = sessions[devId] || {};
        if (!s.name) continue;
       if (__isDefaultSessionName(s.name)) continue;

        const hasCompleted = s.completed && typeof s.completed === 'object'
          && Object.keys(s.completed).length > 0;

        list.push({
          deviceId: devId,
          name: s.name,
          completed: s.completed || {},
          completedCount: s.completedCount || 0,
          lastSeen: s.lastSeen || 0,
          hasCompleted: hasCompleted
        });
      }

      list.sort((a, b) => {
        if (a.hasCompleted !== b.hasCompleted) return b.hasCompleted ? 1 : -1;
        return (b.lastSeen || 0) - (a.lastSeen || 0);
      });

      return list;
    } catch (e) {
      console.warn('[RETAKE-LIST] Gagal:', e.message);
      return [];
    }
  }

/* ============================================================
   🆕 GAS ADMIN CLIENT — Generate signed token via GAS
   ============================================================ */
async function __callAdminGAS(payload) {
  let idToken = '';
  try {
    const u = firebase.auth().currentUser;
    if (u) idToken = await u.getIdToken();
  } catch (e) {}
  const res = await fetch(EMAIL_GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...payload, idToken: idToken })
  });
  if (!res.ok) throw new Error('GAS HTTP ' + res.status);
  return await res.json();
}

async function __generateSignedRetakeToken(params) {
  const data = await __callAdminGAS({
    action: 'generate_token',
    name: params.name,
    position: params.position || '',
    tahap: params.tahap,
    tests: params.tests,
    scheduledAt: params.scheduledAt || 0
  });
  if (!data || !data.success) {
    throw new Error(data?.error || 'Generate token gagal');
  }
  return {
    tokenId: data.tokenId,
    signedToken: data.signedToken,
    scheduledAt: data.scheduledAt,
    expiresAt: data.expiresAt,
    startUrl: data.startUrl
  };
}

/* ============================================================
   __buildRetakeUrl (existing) — tetap dipakai sebagai fallback
   ============================================================ */

  /* ============================================================
     Build URL retake
     ============================================================ */
  async function __buildRetakeUrl(name, position, tests, tahap, startAt, forceDeviceId, email, token) {
    const t = Math.max(2, Math.min(20, parseInt(tahap, 10) || 2));
    const base = window.location.origin + window.location.pathname;
    const params = [
      'retake=1',
      'n=' + encodeURIComponent(name),
      'p=' + encodeURIComponent(position || ''),
      'tests=' + encodeURIComponent(tests.join(',')),
      'tahap=' + t
    ];

    if (email) params.push('e=' + encodeURIComponent(email));
    if (token) params.push('token=' + encodeURIComponent(token));
    if (startAt > 0) params.push('start=' + startAt);

    // Device ID OPSIONAL — hanya sebagai hint, bukan syarat
    if (forceDeviceId && forceDeviceId !== 'from_candidate_status') {
      params.push('d=' + encodeURIComponent(forceDeviceId));
    }

    return base + '?' + params.join('&');
  }

  /* ============================================================
     🆕 Helper: auto-detect tahap berikutnya
     ============================================================ */
  async function __getNextTahapForCandidate(slug) {
    try {
      if (typeof firebase === 'undefined' || !firebase.apps.length) return 2;
      const snap = await firebase.database().ref('sgs_state/sessions').once('value');
      const sessions = snap.val() || {};
      const slugLower = String(slug || '').toLowerCase();

      let maxTahap = 1;
      for (const devId in sessions) {
        const s = sessions[devId] || {};
        if (!s.name) continue;
        const sSlug = String(s.name).toLowerCase()
          .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
        if (sSlug !== slugLower) continue;

        const hist = s.retake_history || {};
        for (const t in hist) {
          const num = parseInt(t, 10) || 0;
          if (num > maxTahap) maxTahap = num;
        }
      }
      return Math.min(20, maxTahap + 1);
    } catch (e) {
      return 2;
    }
  }

  /* ============================================================
     RETAKE MODAL
     ============================================================ */
  window.__openRetakeModal = async function (slug, name, position) {
    if (window.__retakeModalOpening) {
      console.warn('[RETAKE] Modal sedang dibuka — abaikan klik dobel');
      return;
    }
    if (document.getElementById('retakeModalOverlay')) {
      console.warn('[RETAKE] Modal sudah tampil — skip');
      return;
    }

    window.__retakeModalOpening = true;

    try {
      let completed = {};
      let sessionInfo = null;
      let matches = [];           /* 🆕 di luar try */
      let __allSessionsForManual = [];

      try {
        const snap = await firebase.database().ref('sgs_state/sessions').once('value');
        const sessions = snap.val() || {};
        const targetNorm = __normName(name);
        const tWords = targetNorm.split(' ').filter(Boolean);

        for (const devId in sessions) {
          const s = sessions[devId] || {};
          if (!s.name) continue;
         if (__isDefaultSessionName(s.name)) continue;

          if (__isNameMatch(s.name, targetNorm, tWords)) {
            matches.push({ deviceId: devId, ...s });
          }
        }

        const RECENT_MS = 10 * 60 * 1000;
        matches.sort((a, b) => {
          const aR = (Date.now() - (a.lastSeen || 0)) < RECENT_MS ? 1 : 0;
          const bR = (Date.now() - (b.lastSeen || 0)) < RECENT_MS ? 1 : 0;
          if (aR !== bR) return bR - aR;
          return (b.lastSeen || 0) - (a.lastSeen || 0);
        });

        if (matches.length > 0) {
          const active = matches[0];
          completed = active.completed || {};
                   sessionInfo = {
            deviceId: String(active.deviceId || ''),
            lastSeen: active.lastSeen,
            totalMatches: matches.length,
            _fromCandidateStatus: !!active._fromCandidateStatus,
            allMatches: matches.map(m => ({
              deviceId: String(m.deviceId || '').slice(-8),
              lastSeen: m.lastSeen ? new Date(m.lastSeen).toLocaleString('id-ID') : '-',
              completed: m.completed
            }))
          };

          console.log('[RETAKE] Sessions match:', matches.length,
            '| Active device:', sessionInfo.deviceId.slice(-8),
            '| completed:', JSON.stringify(completed));
        } else {
          console.warn('[RETAKE] Tidak ada session match untuk nama:', name);
        }
      } catch (e) {
        console.warn('[RETAKE] Gagal ambil completed:', e);
      }

   
      /* 🆕 FALLBACK: kalau tidak ada session, baca dari candidate_status */
      if (matches.length === 0) {
        try {
          const csSnap = await firebase.database()
            .ref('sgs_candidate_status/' + slug).once('value');
          const cs = csSnap.val();
          if (cs && cs.candidateName) {
                        /* 🆕 Build completed dari retake_history kalau completed kosong */
            let __builtCompleted = Object.assign({}, cs.completed || {});
            if (Object.keys(__builtCompleted).length === 0 && cs.retake_history) {
              Object.keys(cs.retake_history).forEach(function(tahapKey) {
                const h = cs.retake_history[tahapKey] || {};
                if (Array.isArray(h.tests)) {
                  h.tests.forEach(function(t) {
                    if (h.status === 'completed' || h.completed === true) {
                      __builtCompleted[t] = true;
                    }
                  });
                }
              });
              /* Kalau tahap 2 ada, tandai tahap 1 (IST + GRAFIS) juga selesai */
              if (cs.retake_history['2']) {
                __builtCompleted.IST = true;
                __builtCompleted.GRAFIS = true;
              }
            }

            matches.push({
              deviceId: 'from_candidate_status',
              name: cs.candidateName,
              email: cs.email || '',
              position: cs.candidatePosition || '',
              phone: cs.phone || '',
              completed: __builtCompleted,
              lastSeen: Date.now(),
              _fromCandidateStatus: true
            });
            console.log('[RETAKE] ✅ Fallback dari candidate_status:', cs.candidateName,
              '| completed:', JSON.stringify(cs.completed || {}));
          }
        } catch (e) {
          console.warn('[RETAKE] Fallback candidate_status gagal:', e.message);
        }
      }

      const ALL_TESTS = [
        { id: 'IST',      label: 'Kecerdasan',    icon: '🧠' },
        { id: 'KRAEPLIN', label: 'Koran',         icon: '🧮' },
        { id: 'DISC',     label: 'Kepemimpinan',  icon: '👤' },
        { id: 'PAPI',     label: 'Sikap Kerja',   icon: '📊' },
        { id: 'BIGFIVE',  label: 'Kepribadian',   icon: '📝' },
        { id: 'GRAFIS',   label: 'Gambar',        icon: '🎨' },
        { id: 'EXCEL',    label: 'Excel',         icon: '📑' },
        { id: 'TYPING',   label: 'Mengetik',      icon: '⌨️' },
        { id: 'SUBJECT',  label: 'Subjek',        icon: '📚' }
      ];

      const available = ALL_TESTS.filter(t => completed[t.id] !== true);
      const alreadyDone = ALL_TESTS.filter(t => completed[t.id] === true);

      const old = document.getElementById('retakeModalOverlay');
      if (old) old.remove();

      const overlay = document.createElement('div');
      overlay.id = 'retakeModalOverlay';
      overlay.style.cssText = [
        'position: fixed', 'inset: 0', 'z-index: 2147483640',
        'background: rgba(10,20,35,.85)',
        'backdrop-filter: blur(8px)',
        '-webkit-backdrop-filter: blur(8px)',
        'display: flex', 'align-items: center', 'justify-content: center',
        'padding: 20px', 'overflow-y: auto',
        'font-family: Inter, system-ui, sans-serif'
      ].join(';');

      /* 🆕 Fungsi untuk re-render checkbox tes saat dropdown ganti */
      function applyTestFilter() {
        const grid = document.getElementById('retakeCheckboxGrid');
        if (!grid) return;

        const avail = ALL_TESTS.filter(t => completed[t.id] !== true);
        const done = ALL_TESTS.filter(t => completed[t.id] === true);

        grid.innerHTML = avail.length > 0
          ? avail.map(t =>
              '<label class="js-retake-test-item" data-test="' + t.id + '" ' +
                'style="display:flex;align-items:center;gap:10px;' +
                'padding:11px 14px;background:#fff;' +
                'border:1.5px solid #e2e8f0;border-radius:10px;' +
                'cursor:pointer;font-size:12.5px;font-weight:700;color:#1e293b;' +
                'transition:all .15s ease;user-select:none;">' +
                '<input type="checkbox" class="js-retake-test" value="' + t.id + '" ' +
                  'style="width:16px;height:16px;accent-color:#3b82f6;cursor:pointer;">' +
                '<span style="font-size:16px;line-height:1;">' + t.icon + '</span>' +
                '<span style="flex:1;">' + t.label + '</span>' +
              '</label>'
            ).join('')
          : '<div style="padding:20px;text-align:center;color:#94a3b8;' +
            'font-size:13px;background:#f8fafc;border-radius:10px;">' +
            '✨ Semua tes sudah selesai — tidak ada yang perlu diulang.' +
            '</div>';

        grid.querySelectorAll('.js-retake-test-item').forEach(label => {
          const cb = label.querySelector('input');
          if (!cb) return;
          cb.addEventListener('change', () => {
            if (cb.checked) {
              label.style.background = '#eff6ff';
              label.style.borderColor = '#3b82f6';
              label.style.color = '#1e40af';
            } else {
              label.style.background = '#fff';
              label.style.borderColor = '#e2e8f0';
              label.style.color = '#1e293b';
            }
          });
        });

        const doneEl = document.getElementById('retakeDoneInfo');
        if (doneEl) {
          if (done.length > 0) {
            doneEl.style.display = 'block';
            doneEl.innerHTML = '<b>✅ Sudah selesai (' + done.length + '):</b> ' +
              done.map(t => t.label).join(', ');
          } else {
            doneEl.style.display = 'none';
          }
        }
      }

      const checkboxHTML = available.length > 0
        ? available.map(t =>
            '<label class="js-retake-test-item" data-test="' + t.id + '" ' +
              'style="display:flex;align-items:center;gap:10px;' +
              'padding:11px 14px;background:#fff;' +
              'border:1.5px solid #e2e8f0;border-radius:10px;' +
              'cursor:pointer;font-size:12.5px;font-weight:700;color:#1e293b;' +
              'transition:all .15s ease;user-select:none;">' +
              '<input type="checkbox" class="js-retake-test" value="' + t.id + '" ' +
                'style="width:16px;height:16px;accent-color:#3b82f6;cursor:pointer;">' +
              '<span style="font-size:16px;line-height:1;">' + t.icon + '</span>' +
              '<span style="flex:1;">' + t.label + '</span>' +
            '</label>'
          ).join('')
        : '<div style="padding:20px;text-align:center;color:#94a3b8;' +
          'font-size:13px;background:#f8fafc;border-radius:10px;">' +
          '✨ Semua tes sudah selesai — tidak ada tes yang perlu diulang.' +
          '</div>';

      const doneHTML = alreadyDone.length > 0
        ? '<div id="retakeDoneInfo" style="margin-top:14px;padding:10px 12px;' +
            'background:#f0fdf4;border:1px solid #86efac;border-radius:9px;' +
            'font-size:11px;color:#166534;line-height:1.5;">' +
            '<b>✅ Sudah selesai (' + alreadyDone.length + '):</b> ' +
            alreadyDone.map(t => t.label).join(', ') +
          '</div>'
        : '<div id="retakeDoneInfo" style="display:none;margin-top:14px;' +
            'padding:10px 12px;background:#f0fdf4;border:1px solid #86efac;' +
            'border-radius:9px;font-size:11px;color:#166534;line-height:1.5;"></div>';

            const sessionLine = (function () {
        if (!sessionInfo) {
          if (__allSessionsForManual.length > 0) {
            return '⚠️ Nama tidak cocok otomatis — <b>pilih sesi manual di bawah</b>';
          }
          return '⚠️ Tidak ada session — kandidat mungkin belum pernah login';
        }
        const devShort = sessionInfo.deviceId
          ? sessionInfo.deviceId.slice(-8)
          : '?';
        const tsStr = sessionInfo.lastSeen
          ? new Date(sessionInfo.lastSeen).toLocaleString('id-ID', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            })
          : '-';
        const multi = sessionInfo.totalMatches > 1
          ? ' · ⚠️ <b>' + sessionInfo.totalMatches + ' sesi</b> (dipakai yang terbaru)'
          : '';
        return '📱 Device: <b>' + devShort + '</b> · 🕐 ' + tsStr + multi;
      })();

      /* 🆕 Dropdown pilih sesi manual */
      const manualSessionHTML = (__allSessionsForManual.length > 0)
        ? '<div style="margin-bottom:14px;padding:12px 14px;' +
            'background:linear-gradient(135deg,#fef3c7,#fde68a);' +
            'border:1.5px solid #f59e0b;border-radius:10px;">' +
            '<label style="font-size:11px;font-weight:900;color:#78350f;' +
              'letter-spacing:.5px;display:block;margin-bottom:6px;">' +
              '⚠️ NAMA TIDAK COCOK — PILIH SESI MANUAL</label>' +
            '<select id="retakeSessionSelect" style="width:100%;' +
              'padding:8px 12px;border:1.5px solid #d97706;border-radius:8px;' +
              'font-family:inherit;font-size:12.5px;font-weight:800;' +
              'color:#78350f;background:#fff;cursor:pointer;box-sizing:border-box;">' +
              __allSessionsForManual.map((s, i) => {
                const ts = s.lastSeen
                  ? new Date(s.lastSeen).toLocaleString('id-ID', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })
                  : '-';
                const label = (i + 1) + '. ' + s.name +
                  ' · ' + (s.completedCount || 0) + ' tes · ' + ts +
                  (s.hasCompleted ? ' ✅' : ' ⚠️');
                return '<option value="' + esc(s.deviceId) + '"' +
                  (i === 0 ? ' selected' : '') + '>' +
                  esc(label) + '</option>';
              }).join('') +
            '</select>' +
            '<div style="font-size:10px;color:#92400e;margin-top:6px;' +
              'line-height:1.4;">Pilih yang ada tanda ✅ (sudah ada data).</div>' +
          '</div>'
        : '';

      /* Auto-detect tahap berikutnya */
      let __nextTahap = 2;
      try {
        __nextTahap = await __getNextTahapForCandidate(slug);
      } catch (e) { __nextTahap = 2; }

      console.log('[RETAKE] Auto-detect tahap berikutnya:', __nextTahap);

      const tahapOptionsHTML = Array.from({ length: 19 }, (_, i) => i + 2)
        .map(n =>
          '<option value="' + n + '"' + (n === __nextTahap ? ' selected' : '') + '>' +
            'Tahap ' + n + (n === __nextTahap ? ' (disarankan)' : '') +
          '</option>'
        ).join('');

      overlay.innerHTML =
        '<div style="width: min(520px, 100%); background: #fff; border-radius: 20px; ' +
        'overflow: hidden; box-shadow: 0 30px 90px rgba(0,0,0,.55);">' +
          '<div style="padding: 22px 24px; ' +
          'background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
              '<div style="min-width:0;">' +
                '<div style="font-size:10.5px;font-weight:800;letter-spacing:2px;opacity:.85;margin-bottom:4px;">' +
                  'TES TAHAP ' + __nextTahap +
                '</div>' +
                '<div style="font-size:18px;font-weight:900;letter-spacing:-.2px;">📤 Kirim Link Tes</div>' +
              '</div>' +
              '<button id="retakeCloseBtn" ' +
                'style="width:32px;height:32px;display:grid;place-items:center;' +
                'background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);' +
                'border-radius:9px;color:#fff;font-size:15px;cursor:pointer;font-family:inherit;">✕</button>' +
            '</div>' +
            '<div style="font-size:12px;opacity:.9;margin-top:8px;line-height:1.45;">' +
              '👤 ' + esc(name) + (position ? ' · 💼 ' + esc(position) : '') +
            '</div>' +
            '<div style="font-size:10.5px;opacity:.75;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.15);line-height:1.5;">' +
              sessionLine +
            '</div>' +
          '</div>' +
          '<div style="padding: 22px 24px 24px;">' +
            manualSessionHTML +
                        '<div style="margin-bottom:14px;padding:12px 16px;' +
              'background:linear-gradient(135deg,#eff6ff,#dbeafe);' +
              'border:1.5px solid #93c5fd;border-radius:10px;">' +
              '<div style="font-size:10.5px;font-weight:800;color:#1e40af;' +
                'letter-spacing:1.5px;margin-bottom:4px;">📤 TES TAHAP</div>' +
              '<div style="font-size:22px;font-weight:900;color:#1e3a8a;' +
                'letter-spacing:-.5px;">Tahap ' + __nextTahap + '</div>' +
              '<div style="font-size:10.5px;color:#64748b;margin-top:4px;">' +
                '✨ Otomatis dari riwayat tes</div>' +
            '</div>' +
            '<div style="margin-bottom:14px;padding:12px 14px;' +
              'background:linear-gradient(135deg,#fef3c7,#fde68a);' +
              'border:1.5px solid #f59e0b;border-radius:10px;">' +
              '<label style="font-size:11px;font-weight:900;color:#78350f;' +
                'letter-spacing:.5px;display:block;margin-bottom:6px;">🗓️ JADWAL MULAI TES</label>' +
              '<input type="datetime-local" id="retakeStartAt" ' +
                'style="width:100%;padding:8px 10px;border:1.5px solid #d97706;' +
                'border-radius:8px;font-family:inherit;font-size:12.5px;' +
                'font-weight:800;color:#78350f;background:#fff;box-sizing:border-box;">' +
              '<div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;">' +
                '<button type="button" class="js-quick-start" data-h="0" ' +
                  'style="flex:1;padding:6px 8px;border-radius:7px;border:1px solid #f59e0b;' +
                  'background:#fff;color:#78350f;font-family:inherit;font-size:10.5px;' +
                  'font-weight:800;cursor:pointer;">⚡ Sekarang</button>' +
                '<button type="button" class="js-quick-start" data-h="1" ' +
                  'style="flex:1;padding:6px 8px;border-radius:7px;border:1px solid #f59e0b;' +
                  'background:#fff;color:#78350f;font-family:inherit;font-size:10.5px;' +
                  'font-weight:800;cursor:pointer;">+1 hari</button>' +
                '<button type="button" class="js-quick-start" data-h="3" ' +
                  'style="flex:1;padding:6px 8px;border-radius:7px;border:1px solid #f59e0b;' +
                  'background:#fff;color:#78350f;font-family:inherit;font-size:10.5px;' +
                  'font-weight:800;cursor:pointer;">+3 hari</button>' +
                '<button type="button" class="js-quick-start" data-h="7" ' +
                  'style="flex:1;padding:6px 8px;border-radius:7px;border:1px solid #f59e0b;' +
                  'background:#fff;color:#78350f;font-family:inherit;font-size:10.5px;' +
                  'font-weight:800;cursor:pointer;">+7 hari</button>' +
              '</div>' +
              '<div style="font-size:10px;color:#92400e;margin-top:6px;' +
                'line-height:1.4;">Kosong = bisa diakses langsung (seperti sekarang).</div>' +
            '</div>' +
            '<div style="font-size:11.5px;color:#475569;line-height:1.6;margin-bottom:14px;' +
            'padding:10px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;">' +
              '<b>ℹ️ Info:</b> Tes yang sudah selesai otomatis disembunyikan. ' +
              'Kandidat akan menerima link dan <b>langsung masuk ke tes</b> tanpa isi data ulang.' +
            '</div>' +
            '<div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:1px;' +
            'margin-bottom:8px;">PILIH TES YANG AKAN DIULANG</div>' +
            '<div id="retakeCheckboxGrid" style="display:grid;' +
            'grid-template-columns:repeat(2,1fr);gap:8px;">' +
              checkboxHTML +
            '</div>' +
            doneHTML +
            '<div style="display:flex;gap:8px;margin-top:18px;">' +
              '<button id="retakeCopyBtn" ' +
                'style="flex:1;padding:11px 12px;border-radius:10px;' +
                'background:rgba(59,130,246,.12);border:1.5px solid rgba(59,130,246,.35);' +
                'color:#1e40af;font-family:inherit;font-size:12px;font-weight:800;' +
                'cursor:pointer;">📋 Copy Link</button>' +
              '<button id="retakeWaBtn" ' +
                'style="flex:1;padding:11px 12px;border-radius:10px;' +
                'background:linear-gradient(135deg,#25d366,#128c7e);' +
                'border:0;color:#fff;font-family:inherit;font-size:12px;' +
                'font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(37,211,102,.25);">' +
                '📱 Kirim WA</button>' +
              '<button id="retakeEmailBtn" ' +
                'style="flex:1;padding:11px 12px;border-radius:10px;' +
                'background:linear-gradient(135deg,#8b5cf6,#6d28d9);' +
                'border:0;color:#fff;font-family:inherit;font-size:12px;' +
                'font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(139,92,246,.25);">' +
                '📧 Kirim Email</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      document.body.appendChild(overlay);

      /* Quick-start handler */
      overlay.querySelectorAll('.js-quick-start').forEach(btn => {
        btn.onclick = () => {
          const h = parseInt(btn.getAttribute('data-h'), 10) || 0;
          const inp = document.getElementById('retakeStartAt');
          if (!inp) return;
          if (h === 0) {
            inp.value = '';
          } else {
            const d = new Date(Date.now() + h * 24 * 60 * 60 * 1000);
            d.setMinutes(0, 0, 0);
            d.setHours(9);
            const pad = n => String(n).padStart(2, '0');
            inp.value = d.getFullYear() + '-' +
              pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' +
              pad(d.getHours()) + ':' + pad(d.getMinutes());
          }
        };
      });

      const closeModal = () => {
        if (overlay && overlay.parentElement) overlay.remove();
      };

      const closeBtn = document.getElementById('retakeCloseBtn');
      if (closeBtn) closeBtn.onclick = closeModal;

      overlay.addEventListener('click', (ev) => {
        if (ev.target === overlay) closeModal();
      });

      overlay.querySelectorAll('.js-retake-test-item').forEach(label => {
        const cb = label.querySelector('input');
        if (!cb) return;
        cb.addEventListener('change', () => {
          if (cb.checked) {
            label.style.background = '#eff6ff';
            label.style.borderColor = '#3b82f6';
            label.style.color = '#1e40af';
          } else {
            label.style.background = '#fff';
            label.style.borderColor = '#e2e8f0';
            label.style.color = '#1e293b';
          }
        });
      });

      const getSelected = () => Array.from(
        overlay.querySelectorAll('.js-retake-test:checked')
      ).map(cb => cb.value);

            const getSelectedTahap = () => __nextTahap;

      const getStartAt = () => {
        const inp = document.getElementById('retakeStartAt');
        if (!inp || !inp.value) return 0;
        const t = new Date(inp.value).getTime();
        return isNaN(t) ? 0 : Math.floor(t / 1000);
      };

      const getSelectedDeviceId = () => {
        const sel = document.getElementById('retakeSessionSelect');
        if (sel && sel.value) return sel.value;
        if (sessionInfo && sessionInfo.deviceId &&
            sessionInfo.deviceId !== 'from_candidate_status') {
          return sessionInfo.deviceId;
        }
        return '';
      };

      /* Handler dropdown sesi — saat dipilih, update `completed` */
      const sessSel = document.getElementById('retakeSessionSelect');
      if (sessSel) {
        const applySession = () => {
          const picked = __allSessionsForManual.find(s => s.deviceId === sessSel.value);
          if (picked) {
            completed = picked.completed || {};
            console.log('[RETAKE] Manual pick:', picked.name,
              '| completed:', JSON.stringify(completed));
            applyTestFilter();
          }
        };
        sessSel.onchange = applySession;
        applySession();
      }

            const copyBtn = document.getElementById('retakeCopyBtn');
      if (copyBtn) {
        copyBtn.onclick = async () => {
          const tests = getSelected();
          if (tests.length === 0) {
            alert('Pilih minimal 1 tes terlebih dahulu.');
            return;
          }
          const tahapVal = getSelectedTahap();
          /* Mirror candidate_status dari session sebelum kirim link */
          try {
            const csCheck = await firebase.database()
              .ref('sgs_candidate_status/' + slug).once('value');
            const csData = csCheck.val();
            if (!csData || !csData.candidateName) {
              const sessSnap = await firebase.database().ref('sgs_state/sessions').once('value');
              const sessions = sessSnap.val() || {};
              const nameTarget = String(name).toLowerCase().trim();
              for (const devId in sessions) {
                const s = sessions[devId] || {};
                if (s.name && String(s.name).toLowerCase().trim() === nameTarget) {
                  await firebase.database().ref('sgs_candidate_status/' + slug).update({
                    candidateName: s.name,
                    email: s.email || '',
                    candidatePosition: s.position || '',
                    phone: s.phone || '',
                    completed: s.completed || {},
                    ts: firebase.database.ServerValue.TIMESTAMP
                  });
                  break;
                }
              }
            }
          } catch (e) {}

          const prev = copyBtn.textContent;
          copyBtn.textContent = '⏳ Membuat link...';
          copyBtn.disabled = true;
          try {
            const tokenData = await __generateSignedRetakeToken({
              name: name,
              position: position,
              tahap: tahapVal,
              tests: tests,
              scheduledAt: getStartAt()
            });
            const url = tokenData.startUrl;

            try {
              if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                copyBtn.textContent = '✅ Tersalin';
                copyBtn.style.background = 'rgba(34,197,94,.15)';
                copyBtn.style.borderColor = 'rgba(34,197,94,.4)';
                copyBtn.style.color = '#16a34a';
                if (typeof window.__showToast === 'function') {
                  window.__showToast('📋 Link Tes Tahap ' + tahapVal + ' tersalin', 'success');
                }
              } else {
                window.prompt('Copy link ini:', url);
                copyBtn.textContent = prev;
              }
            } catch (e) {
              window.prompt('Copy link ini:', url);
              copyBtn.textContent = prev;
            }
            setTimeout(() => {
              copyBtn.textContent = prev;
              copyBtn.disabled = false;
              copyBtn.style.background = 'rgba(59,130,246,.12)';
              copyBtn.style.borderColor = 'rgba(59,130,246,.35)';
              copyBtn.style.color = '#1e40af';
            }, 1800);
          } catch (err) {
            alert('Gagal generate link: ' + err.message);
            copyBtn.textContent = prev;
            copyBtn.disabled = false;
          }
        };
      }

      const waBtn = document.getElementById('retakeWaBtn');
      if (waBtn) {
        waBtn.onclick = async () => {
          const tests = getSelected();
          if (tests.length === 0) {
            alert('Pilih minimal 1 tes terlebih dahulu.');
            return;
          }
          const phone = await findPhone(slug, name);
          if (!phone) {
            alert('Nomor WA kandidat tidak tersedia.\n\nIsi dulu via tombol "Hubungi WA" di tab Status.');
            return;
          }
          const norm = normalizePhoneWA(phone);
          if (!norm) {
            alert('Nomor WA tidak valid: ' + phone);
            return;
          }
                    const tahapVal = getSelectedTahap();
    /* 🆕 Mirror candidate_status dari session sebelum kirim link */
    try {
      const csCheck = await firebase.database()
        .ref('sgs_candidate_status/' + slug).once('value');
      const csData = csCheck.val();
      if (!csData || !csData.candidateName) {
        // Cari session by name, copy ke candidate_status
        const sessSnap = await firebase.database()
          .ref('sgs_state/sessions').once('value');
        const sessions = sessSnap.val() || {};
        const nameTarget = String(name).toLowerCase().trim();
        for (const devId in sessions) {
          const s = sessions[devId] || {};
          if (s.name && String(s.name).toLowerCase().trim() === nameTarget) {
            await firebase.database()
              .ref('sgs_candidate_status/' + slug).update({
                candidateName: s.name,
                email: s.email || '',
                candidatePosition: s.position || '',
                phone: s.phone || '',
                completed: s.completed || {},
                ts: firebase.database.ServerValue.TIMESTAMP
              });
            console.log('[RETAKE-EMAIL] ✅ Mirror ke candidate_status:', s.name);
            break;
          }
        }
      }
    } catch (e) {
      console.warn('[RETAKE-EMAIL] Mirror gagal:', e.message);
    }

                  const prevWa = waBtn.textContent;
          waBtn.textContent = '⏳ Membuat link...';
          waBtn.disabled = true;
          try {
            const tokenData = await __generateSignedRetakeToken({
              name: name,
              position: position,
              tahap: tahapVal,
              tests: tests,
              scheduledAt: getStartAt()
            });
            const url = tokenData.startUrl;
            const message =
              'Halo ' + name + ',\n\n' +
              'Admin Sugar Group Schools mengirimkan link untuk *Tes Tahap ' + tahapVal + '*.\n\n' +
              '📋 Tes yang harus dikerjakan: *' + tests.join(', ') + '*\n\n' +
              '🔗 Link: ' + url + '\n\n' +
              'Isi password yang diberikan admin untuk masuk. Anda akan langsung masuk ke tes tanpa isi data ulang.\n\n' +
              'Terima kasih.';
            window.open('https://wa.me/' + norm + '?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
          } catch (err) {
            alert('Gagal generate link: ' + err.message);
          } finally {
            waBtn.textContent = prevWa;
            waBtn.disabled = false;
          }
        };
      }

      const emailBtn = document.getElementById('retakeEmailBtn');
      if (emailBtn) {
        emailBtn.onclick = async () => {
          const tests = getSelected();
          if (tests.length === 0) {
            alert('Pilih minimal 1 tes terlebih dahulu.');
            return;
          }
          const email = await findEmail(slug, name);
          if (!email || !isValidEmail(email)) {
            alert('Email kandidat tidak tersedia / tidak valid.\n\nIsi dulu via tombol "Kirim Email" di tab Status.');
            return;
          }

              const tahapVal = getSelectedTahap();
    /* 🆕 Mirror candidate_status dari session sebelum kirim link */
    try {
      const csCheck = await firebase.database()
        .ref('sgs_candidate_status/' + slug).once('value');
      const csData = csCheck.val();
      if (!csData || !csData.candidateName) {
        // Cari session by name, copy ke candidate_status
        const sessSnap = await firebase.database()
          .ref('sgs_state/sessions').once('value');
        const sessions = sessSnap.val() || {};
        const nameTarget = String(name).toLowerCase().trim();
        for (const devId in sessions) {
          const s = sessions[devId] || {};
          if (s.name && String(s.name).toLowerCase().trim() === nameTarget) {
            await firebase.database()
              .ref('sgs_candidate_status/' + slug).update({
                candidateName: s.name,
                email: s.email || '',
                candidatePosition: s.position || '',
                phone: s.phone || '',
                completed: s.completed || {},
                ts: firebase.database.ServerValue.TIMESTAMP
              });
            console.log('[RETAKE-EMAIL] ✅ Mirror ke candidate_status:', s.name);
            break;
          }
        }
      }
    } catch (e) {
      console.warn('[RETAKE-EMAIL] Mirror gagal:', e.message);
    }

    const prev = emailBtn.textContent;
    emailBtn.disabled = true;
    emailBtn.textContent = '⏳ Membuat link...';

    try {
      // 🔒 Generate signed token via GAS (HMAC)
      const tokenData = await __generateSignedRetakeToken({
        name: name,
        position: position,
        tahap: tahapVal,
        tests: tests,
        scheduledAt: getStartAt()
      });
      const url = tokenData.startUrl;
      const subject = '🔗 Link Tes Tahap ' + tahapVal + ' — ' + name;

      /* Password HTML */
      const __usedPwd = (typeof window.getUsedPwd === 'function')
        ? window.getUsedPwd()
        : null;
      let __passwordHTML = '';
      if (__usedPwd && __usedPwd.length > 0) {
        const __copyHelperUrl = window.location.origin + window.location.pathname +
          '?copypw=' + encodeURIComponent(__usedPwd) +
          '&next=' + encodeURIComponent(url);
        __passwordHTML =
          '<div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);' +
          'border-radius:14px;padding:20px 22px;margin:18px 0;text-align:center;">' +
            '<div style="font-size:11px;font-weight:800;letter-spacing:2px;' +
              'color:rgba(255,255,255,.85);margin-bottom:10px;">' +
              '🔑 KODE AKSES MASUK TES</div>' +
            '<div style="font-family:\'Courier New\',monospace;font-size:22px;' +
              'font-weight:900;color:#fff;letter-spacing:2px;padding:12px 16px;' +
              'background:rgba(0,0,0,.3);border-radius:10px;display:block;' +
              'margin-bottom:12px;word-break:break-all;">' +
              __usedPwd +
            '</div>' +
            '<a href="' + __copyHelperUrl + '" ' +
              'style="display:inline-block;padding:11px 24px;' +
              'background:#fff;color:#1e3a8a;text-decoration:none;' +
              'border-radius:10px;font-weight:900;font-size:13px;">' +
              '📋 Salin Password & Lanjut' +
            '</a>' +
            '<div style="font-size:11px;color:rgba(255,255,255,.75);margin-top:10px;">' +
              'Klik tombol di atas — password otomatis tersalin</div>' +
          '</div>';
      }

      /* ⏰ Info countdown live (bukan static) */
      const __startVal = getStartAt();
      let __countdownInfoHTML = '';
      if (__startVal > 0) {
        const __targetDate = new Date(__startVal * 1000);
        const __fmtDate = __targetDate.toLocaleDateString('id-ID', {
          weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
        });
        const __fmtTime = __targetDate.toLocaleTimeString('id-ID', {
          hour: '2-digit', minute: '2-digit'
        });
        __countdownInfoHTML =
          '<div style="background:linear-gradient(135deg,#fef3c7,#fde68a);' +
          'border:2px solid #f59e0b;border-radius:14px;padding:18px 20px;margin:20px 0;">' +
            '<div style="font-size:11px;font-weight:900;color:#78350f;' +
              'letter-spacing:2px;margin-bottom:10px;">⏰ JADWAL MULAI TES</div>' +
            '<div style="font-size:16px;font-weight:900;color:#78350f;margin-bottom:4px;">' +
              '📅 ' + __fmtDate + '</div>' +
            '<div style="font-size:14px;font-weight:800;color:#92400e;margin-bottom:12px;">' +
              '🕐 Pukul ' + __fmtTime + ' WIB</div>' +
            '<div style="background:#fff;border-radius:10px;padding:12px 14px;' +
              'font-size:12.5px;color:#78350f;line-height:1.6;text-align:center;">' +
              '⏳ <b>Klik tombol di bawah untuk melihat hitung mundur live</b>' +
            '</div>' +
            '<div style="font-size:11px;color:#92400e;margin-top:10px;text-align:center;font-style:italic;">' +
              '⚠️ Link hanya aktif mulai waktu di atas · Berlaku 24 jam' +
            '</div>' +
          '</div>';
      }

      const htmlBody =
        '<div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:24px;text-align:center;border-radius:12px 12px 0 0;color:#fff;">' +
          '<div style="font-size:11px;font-weight:800;letter-spacing:3px;opacity:.85;margin-bottom:4px;">SUGAR GROUP SCHOOLS</div>' +
          '<div style="font-size:18px;font-weight:900;">Tes Tahap ' + tahapVal + '</div>' +
        '</div>' +
        '<div style="background:#fff;padding:28px 24px;">' +
          '<p>Halo <b>' + name + '</b>,</p>' +
          '<p>Admin Sugar Group Schools mengirimkan link untuk <b>Tes Tahap ' + tahapVal + '</b>.</p>' +
          '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 16px;margin:18px 0;">' +
            '<div style="font-size:12px;font-weight:800;color:#1e40af;margin-bottom:6px;">📋 TES YANG HARUS DIKERJAKAN</div>' +
            '<div style="font-size:14px;font-weight:900;color:#1e40af;">' + tests.join(' · ') + '</div>' +
          '</div>' +
          __countdownInfoHTML +
          __passwordHTML +
          '<div style="text-align:center;margin:24px 0;">' +
            '<a href="' + url + '" style="display:inline-block;padding:16px 36px;' +
            'background:linear-gradient(135deg,#06b6d4,#0ea5e9);color:#fff;' +
            'text-decoration:none;border-radius:12px;font-weight:900;' +
            'font-size:15px;box-shadow:0 6px 20px rgba(6,182,212,.35);">' +
            '🚀 Buka Halaman Tes</a>' +
          '</div>' +
          '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 14px;font-size:12.5px;color:#78350f;">' +
            '<b>⚠️ Catatan:</b> Isi password yang diberikan admin untuk masuk. Anda akan langsung masuk ke tes tanpa isi data ulang.' +
          '</div>' +
          '<p style="margin-top:20px;font-size:13px;color:#64748b;">Terima kasih,<br><b>Tim Recruitment</b><br>Sugar Group Schools</p>' +
        '</div>' +
        '<div style="background:#0f172a;color:#94a3b8;padding:16px;text-align:center;font-size:11px;border-radius:0 0 12px 12px;">Email otomatis · Jangan balas langsung</div>';

      emailBtn.textContent = '⏳ Mengirim...';

      let idToken = '';
      try {
        const u = firebase.auth().currentUser;
        if (u) idToken = await u.getIdToken();
      } catch (e) {}

      await fetch(EMAIL_GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'send_status_email',
          idToken: idToken,
          to: email,
          name: name,
          position: position || '',
          status: 'retake',
          subject: subject,
          htmlBody: htmlBody
        })
      });

      emailBtn.textContent = '✅ Terkirim';
      emailBtn.style.background = 'linear-gradient(135deg,#16a34a,#059669)';
      if (typeof window.__showToast === 'function') {
        window.__showToast('📧 Link Tes Tahap ' + tahapVal + ' terkirim ke ' + email, 'success');
      }
      setTimeout(() => {
        emailBtn.disabled = false;
        emailBtn.textContent = prev;
        emailBtn.style.background = 'linear-gradient(135deg,#8b5cf6,#6d28d9)';
      }, 2200);
    } catch (err) {
      emailBtn.disabled = false;
      emailBtn.textContent = prev;
      alert('Gagal kirim email: ' + err.message);
    }
          emailBtn.disabled = true;
          emailBtn.textContent = '⏳ Mengirim...';

          let idToken = '';
          try {
            const u = firebase.auth().currentUser;
            if (u) idToken = await u.getIdToken();
          } catch (e) {}

          try {
            await fetch(EMAIL_GAS_URL, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action: 'send_status_email',
                idToken: idToken,
                to: email,
                name: name,
                position: position || '',
                status: 'retake',
                subject: subject,
                htmlBody: htmlBody
              })
            });

            emailBtn.textContent = '✅ Terkirim';
            emailBtn.style.background = 'linear-gradient(135deg,#16a34a,#059669)';
            if (typeof window.__showToast === 'function') {
              window.__showToast('📧 Link Tes Tahap ' + tahapVal + ' terkirim ke ' + email, 'success');
            }
            setTimeout(() => {
              emailBtn.disabled = false;
              emailBtn.textContent = prev;
              emailBtn.style.background = 'linear-gradient(135deg,#8b5cf6,#6d28d9)';
            }, 2200);
          } catch (err) {
            emailBtn.disabled = false;
            emailBtn.textContent = prev;
            alert('Gagal kirim email: ' + err.message);
          }
        };
      }

    } finally {
      window.__retakeModalOpening = false;
    }
  };

  /* ============================================================
     HAPUS TOTAL KANDIDAT
     ============================================================ */
  window.adminDeleteCandidateCompletely = async function (candidateName, candidatePosition) {
    if (!candidateName) return alert('Nama kandidat kosong.');
    const slug = slugify(candidateName);

    const ok1 = (typeof window.sgsConfirmDanger === 'function')
      ? await window.sgsConfirmDanger(
          '⚠️ HAPUS TOTAL KANDIDAT\n\n' +
          '👤 ' + candidateName + '\n' +
          '💼 ' + (candidatePosition || '-') + '\n\n' +
          'Yang akan dihapus PERMANEN:\n' +
          '• Semua file di Drive (PDF, Excel, Grafis, Wawancara, FGD)\n' +
          '• Firebase: interviews, grafis_interp, grafis_images, fgd,\n' +
          '  subject_ratings, candidate_status, sgs_scores,\n' +
          '  sgs_psikogram, sgs_psikogram_raw, sgs_psikogram_weights\n' +
          '• Request izin & resume state\n' +
          '• Chat room (jika ada)\n\n' +
          'Tidak bisa dibatalkan!',
          { title: '🗑️ Hapus Kandidat', okText: 'Ya, Saya Yakin' }
        )
      : confirm('Hapus total kandidat ' + candidateName + '?');

    if (!ok1) return;

    const ok2 = (typeof window.sgsConfirmDanger === 'function')
      ? await window.sgsConfirmDanger(
          'Konfirmasi terakhir:\n\nHapus permanen "' + candidateName + '"?',
          { title: '⚠️ Konfirmasi Terakhir', okText: 'Ya, Hapus Sekarang' }
        )
      : confirm('Yakin 100%? Tindakan ini permanen.');

    if (!ok2) return;

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      return alert('Firebase belum siap');
    }

    let driveDeleted = 0;
    let fbDeleted = 0;
    let driveFailed = 0;

    try {
      const files = (typeof window.fetchResultFiles === 'function')
        ? await window.fetchResultFiles(true) : [];

      const nameLower = String(candidateName).toLowerCase().trim();

      const targets = files.filter(f => {
        const n = String(f.name || '').toLowerCase();
        const desc = String(f.description || '').toLowerCase();

        const descMatch = desc.match(/nama:\s*(.+)/i);
        if (descMatch && descMatch[1].trim() === nameLower) return true;

        if (n.includes('[' + nameLower.replace(/\s+/g, '-') + ']')) return true;
        if (n.startsWith(slug + '-')) return true;

        return false;
      });

      console.log('[DELETE TOTAL] Target file Drive:', targets.length);

      if (targets.length > 0 && typeof window.GAS_ADMIN_URL === 'string') {
        const idToken = (typeof window.__getFirebaseIdToken === 'function')
          ? await window.__getFirebaseIdToken() : '';

        for (let i = 0; i < targets.length; i++) {
          const f = targets[i];
          let success = false;

          try {
            await fetch(window.GAS_ADMIN_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ action: 'delete', fileId: f.id, idToken })
            });
            success = true;
          } catch (e) {
            console.warn('[DELETE TOTAL] Fetch error (dianggap sukses):', f.name, '—', e.message);
            success = true;
          }

          if (success) {
            if (window.__recentlyDeletedFileIds) window.__recentlyDeletedFileIds.add(f.id);
            if (typeof window.__removeFileFromCache === 'function') window.__removeFileFromCache(f.id);
            driveDeleted++;
            console.log(`[DELETE TOTAL] ✓ (${i + 1}/${targets.length})`, f.name);
          } else {
            driveFailed++;
          }

          if (i < targets.length - 1) {
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }
    } catch (e) {
      console.warn('[DELETE TOTAL] Drive error:', e.message);
    }

    const paths = [
      'sgs_interviews/' + slug,
      'sgs_grafis_interp/' + slug,
      'sgs_grafis_images/' + slug,
      'sgs_fgd/' + slug,
      'sgs_subject_ratings/' + slug,
      'sgs_candidate_status/' + slug,
      'sgs_scores/' + slug,
      'sgs_psikogram/' + slug,
      'sgs_psikogram_raw/' + slug,
      'sgs_psikogram_weights/' + slug
    ];

    for (const path of paths) {
      try {
        await firebase.database().ref(path).remove();
        fbDeleted++;
      } catch (e) {
        console.warn('[DELETE TOTAL] Firebase gagal:', path, e.message);
      }
    }

    try {
      const sessionsSnap = await firebase.database().ref('sgs_state/sessions').once('value');
      const sessions = sessionsSnap.val() || {};
      const nameLower = String(candidateName).toLowerCase().trim();

      for (const devId in sessions) {
        const s = sessions[devId] || {};
        if (s.name && String(s.name).toLowerCase().trim() === nameLower) {
          try {
            await firebase.database().ref('sgs_state/chats/' + devId).remove();
            await firebase.database().ref('sgs_state/sessions/' + devId).remove();
            await firebase.database().ref('sgs_requests/' + devId).remove();
            await firebase.database().ref('sgs_state/resume/' + devId).remove();
          } catch (e) {}
        }
      }
    } catch (e) {}

    __detachFGDRealtime(slug);

    if (typeof window.__invalidateResultCache === 'function') {
      window.__invalidateResultCache();
    }

    await new Promise(r => setTimeout(r, 2000));

    try {
      if (typeof window.fetchResultFiles === 'function') {
        const freshFiles = await window.fetchResultFiles(true);
        window.__resultFilesCache = freshFiles;
      }
      if (document.getElementById('resultFilesPageOverlay') &&
          typeof window.__renderResultPageContent === 'function') {
        window.__renderResultPageContent();
      }
      if (typeof window.__updateAdminResultCounter === 'function') {
        window.__updateAdminResultCounter();
      }
    } catch (e) {
      console.warn('[DELETE TOTAL] Refresh error:', e.message);
    }

    const card = document.querySelector('.rf-card[data-candidate-slug="' + slug + '"]');
    if (card) card.remove();

    let msg =
      '✅ Hapus total selesai:\n\n' +
      '• Firebase paths: ' + fbDeleted + ' dihapus\n' +
      '• File Drive: ' + driveDeleted + ' dihapus';

    if (driveFailed > 0) {
      msg += '\n• ⚠️ Gagal: ' + driveFailed + ' file';
    }

    msg += '\n\nKandidat "' + candidateName + '" sudah dihapus permanen.';

    alert(msg);
  };

  /* ============================================================
     RESET KE FRESH
     ============================================================ */
  window.adminResetToFreshByName = async function (candidateName) {
    if (!candidateName) return alert('Nama kandidat kosong.');

  /* 🆕 Guard: session belum login — bukan kandidat asli */
  if (/^🔓/.test(candidateName) ||
      /belum\s*login/i.test(candidateName) ||
      /^IP\s*:/i.test(candidateName)) {
    return alert(
      '⚠️ Ini session belum login — bukan kandidat asli.\n\n' +
      'Kandidat harus login & submit identitas dulu.\n' +
      'Setelah itu, tombol Reset ke Fresh bisa dipakai.'
    );
  }

    const ok = (typeof window.sgsConfirmDanger === 'function')
      ? await window.sgsConfirmDanger(
          '🆕 RESET KE FRESH\n\n' +
          '👤 ' + candidateName + '\n\n' +
          'Yang akan terjadi di device kandidat:\n' +
          '• Semua data lokal dihapus (identity, completed, selectedTests)\n' +
          '• Status kelulusan & diskualifikasi di-reset\n' +
          '• Device jadi seperti baru → login pakai password FRESH\n' +
          '• Kandidat harus isi form identitas lagi\n\n' +
          '⚠️ File hasil tes di Drive & Firebase TIDAK dihapus.\n\n' +
          'Lanjutkan?',
          { title: '🆕 Reset ke Fresh', okText: 'Ya, Reset' }
        )
      : confirm('Reset ' + candidateName + ' ke FRESH?');

    if (!ok) return;

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      return alert('Firebase belum siap');
    }

    let deviceId = null;
    try {
      const snap = await firebase.database().ref('sgs_state/sessions').once('value');
      const sessions = snap.val() || {};
      const nameLower = String(candidateName).toLowerCase().trim();
      for (const devId in sessions) {
        const s = sessions[devId] || {};
        if (s.name && String(s.name).toLowerCase().trim() === nameLower) {
          deviceId = devId;
          break;
        }
      }
    } catch (e) {
      return alert('Gagal baca sessions: ' + e.message);
    }

    if (!deviceId) {
      return alert(
        '❌ Device kandidat tidak ditemukan di sessions.\n\n' +
        'Kemungkinan:\n' +
        '• Kandidat belum pernah login\n' +
        '• Sesi sudah kadaluarsa (>3 menit offline)\n' +
        '• Nama tidak cocok (cek ejaan)'
      );
    }

    try {
      await firebase.database().ref('sgs_state/sessions/' + deviceId).update({
        force_reset_fresh: Date.now(),
        finished: false,
        disqualified: false,
        status: 'active',
        lastSeen: firebase.database.ServerValue.TIMESTAMP,
        completed: null,
        selectedTests: null,
        currentTest: null,
        currentSubtest: null,
        currentQuestion: null
      });

      const slug = String(candidateName).toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
       const __isJunkName = /^🔓/.test(candidateName) ||
                           /belum\s*login/i.test(candidateName) ||
                           /^IP\s*:/i.test(candidateName);
      if (!__isJunkName) {
        try {
          await firebase.database().ref('sgs_candidate_status/' + slug).update({
            candidateName: candidateName,
            status: '',
            emailSentAt: null,
            emailSentStatus: null,
            ts: firebase.database.ServerValue.TIMESTAMP
          });
        } catch (e) {}
      }

      alert(
        '✅ Sinyal reset terkirim ke device kandidat.\n\n' +
        '📱 Device kandidat akan otomatis reload.\n' +
        'Setelah reload, login pakai password FRESH.'
      );

    } catch (e) {
      alert('Gagal kirim sinyal: ' + e.message);
    }
  };

  /* ============================================================
     FGD — Hapus asesor
     ============================================================ */
  async function deleteFGDAsesor(slug, asesor, candidateName, candidatePosition) {
    if (!asesor) return alert('Nama asesor kosong.');

    const ok = (typeof window.sgsConfirmDanger === 'function')
      ? await window.sgsConfirmDanger(
          '🗑️ HAPUS ASESOR FGD\n\n' +
          '👤 Asesor: ' + asesor + '\n' +
          '🎯 Kandidat: ' + candidateName + '\n\n' +
          'Yang akan terjadi:\n' +
          '• Nilai & catatan asesor ini dihapus dari Firebase\n' +
          '• PDF combined akan di-regenerate tanpa asesor ini\n\n' +
          'Lanjutkan?',
          { title: '🗑️ Hapus Asesor FGD', okText: 'Ya, Hapus' }
        )
      : confirm('Hapus asesor "' + asesor + '" dari FGD ' + candidateName + '?');
    if (!ok) return;

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      return alert('Firebase belum siap');
    }

    try {
      await firebase.database().ref('sgs_fgd/' + slug + '/' + asesor).remove();
      console.log('[FGD-DELETE] ✓ Dihapus dari Firebase:', slug, '/', asesor);

      try {
        if (typeof window.fetchResultFiles === 'function') {
          const files = await window.fetchResultFiles(true);

          const nameSlug = String(candidateName || '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
          const targets = files.filter(f => {
            const n = String(f.name || '');
            if (!/-FGD-COMBINED\.pdf$/i.test(n)) return false;
            return n.toLowerCase().includes(nameSlug);
          });

          console.log('[FGD-DELETE] PDF combined lama ditemukan:', targets.length);

          if (targets.length > 0 && typeof window.GAS_ADMIN_URL === 'string') {
            const idToken = (typeof window.__getFirebaseIdToken === 'function')
              ? await window.__getFirebaseIdToken() : '';

            for (const target of targets) {
              try {
                await fetch(window.GAS_ADMIN_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                  body: JSON.stringify({ action: 'delete', fileId: target.id, idToken })
                });
                if (window.__recentlyDeletedFileIds) window.__recentlyDeletedFileIds.add(target.id);
                if (typeof window.__removeFileFromCache === 'function') window.__removeFileFromCache(target.id);
                console.log('[FGD-DELETE] ✓ Dihapus:', target.name);
                await new Promise(r => setTimeout(r, 300));
              } catch (e) {
                console.warn('[FGD-DELETE] Gagal hapus:', target.name, '—', e.message);
              }
            }
          }
        }
      } catch (e) {
        console.warn('[FGD-DELETE] Gagal cari/hapus PDF lama:', e.message);
      }

      const snapAfter = await firebase.database().ref('sgs_fgd/' + slug).once('value');
      const dataAfter = snapAfter.val() || {};
      const remaining = Object.keys(dataAfter);

      if (remaining.length > 0) {
        if (typeof window.autoGenerateFGDCombined === 'function') {
          await new Promise(r => setTimeout(r, 1500));
          await window.autoGenerateFGDCombined(candidateName, candidatePosition);
          console.log('[FGD-DELETE] ✓ PDF combined di-regenerate');
        }
      } else {
        console.log('[FGD-DELETE] Tidak ada asesor lagi — PDF combined tidak di-regenerate');
      }

      if (typeof window.__invalidateResultCache === 'function') {
        window.__invalidateResultCache();
      }

    } catch (e) {
      console.error('[FGD-DELETE] Gagal:', e);
      alert('Gagal hapus asesor: ' + e.message);
    }
  }

  /* ============================================================
     FGD — Load data
     ============================================================ */
  async function loadFGDData(slug) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return null;
    try {
      const snap = await firebase.database().ref('sgs_fgd/' + slug).once('value');
      return snap.val() || null;
    } catch (e) {
      console.warn('[FGD-LOAD] Gagal baca:', e.message);
      return null;
    }
  }

  /* ============================================================
     FGD — Render box
     ============================================================ */
  const FGD_REC_MAP = {
    'HIGHLY_RECOMMENDED': { short: '🌟 Highly',  color: '#86efac', bg: 'rgba(34,197,94,.15)',  border: 'rgba(34,197,94,.45)' },
    'RECOMMENDED':        { short: '✅ Rec',      color: '#86efac', bg: 'rgba(34,197,94,.12)',  border: 'rgba(34,197,94,.35)' },
    'FAIRLY_RECOMMENDED': { short: '⚠️ Fairly',  color: '#fcd34d', bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.45)' },
    'NOT_RECOMMENDED':    { short: '❌ Not',      color: '#fca5a5', bg: 'rgba(239,68,68,.15)',  border: 'rgba(239,68,68,.45)' }
  };

  function renderFGDBox(fgdData) {
    const data = fgdData || {};
    const asesorList = Object.keys(data).sort();

    if (asesorList.length === 0) {
      return (
        '<div class="js-fgd-box" style="padding:14px;' +
        'background:rgba(139,92,246,.05);border:1.5px dashed rgba(139,92,246,.3);border-radius:12px;' +
        'font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">' +
          '🎯 <b>Belum ada asesor yang submit FGD</b><br>' +
          '<span style="font-size:10.5px;opacity:.7;">Kirim link FGD ke asesor lewat tombol di atas.</span>' +
        '</div>'
      );
    }

    const avgs = asesorList
      .map(a => Number(data[a]?.average) || 0)
      .filter(v => v > 0);
    const grandAvg = avgs.length
      ? (avgs.reduce((s, v) => s + v, 0) / avgs.length)
      : 0;

    const rowsHTML = asesorList.map(asesor => {
      const d = data[asesor] || {};
      const rec = FGD_REC_MAP[d.recommendation] || null;
      const avg = Number(d.average) || 0;

      const recBadge = rec
        ? '<span style="padding:2px 8px;border-radius:999px;font-size:9.5px;font-weight:800;' +
          'background:' + rec.bg + ';border:1px solid ' + rec.border + ';color:' + rec.color + ';' +
          'white-space:nowrap;">' + rec.short + '</span>'
        : '';

      return (
        '<div class="js-fgd-row" data-asesor="' + esc(asesor) + '" ' +
          'style="display:flex;align-items:center;gap:8px;padding:8px 10px;' +
          'background:rgba(255,255,255,.03);border:1px solid rgba(139,92,246,.2);' +
          'border-radius:9px;margin-bottom:6px;flex-wrap:wrap;">' +
          '<div style="width:30px;height:30px;flex:0 0 30px;display:grid;place-items:center;' +
            'background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;border-radius:8px;' +
            'font-weight:900;font-size:10px;letter-spacing:.5px;">' +
            esc(String(asesor).slice(0,3).toUpperCase()) +
          '</div>' +
          '<div style="flex:1;min-width:100px;">' +
            '<div style="font-weight:900;font-size:12.5px;color:#fff;line-height:1.2;">' + esc(asesor) + '</div>' +
            '<div style="font-size:10.5px;color:#94a3b8;margin-top:1px;">⭐ ' + avg.toFixed(2) + '</div>' +
          '</div>' +
          recBadge +
          '<button class="js-fgd-delete-asesor" data-asesor="' + esc(asesor) + '" ' +
            'title="Hapus asesor ini"' +
            'style="flex:0 0 auto;padding:5px 9px;border-radius:7px;' +
            'background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.4);' +
            'color:#fca5a5;font-family:inherit;font-size:11px;font-weight:800;' +
            'cursor:pointer;line-height:1;">🗑️</button>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="js-fgd-box" style="padding:12px;' +
        'background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(99,102,241,.05));' +
        'border:1.5px solid rgba(139,92,246,.3);border-radius:14px;">' +

        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">' +
          '<div style="width:32px;height:32px;flex:0 0 32px;display:grid;place-items:center;' +
            'background:linear-gradient(135deg,#8b5cf6,#6d28d9);border-radius:9px;font-size:16px;">🎯</div>' +
          '<div style="flex:1;min-width:100px;">' +
            '<div style="font-size:12px;font-weight:900;color:#c4b5fd;">Hasil FGD</div>' +
            '<div style="font-size:10px;color:#94a3b8;">' + asesorList.length + ' asesor submit</div>' +
          '</div>' +
          (asesorList.length > 0
            ? '<div style="padding:5px 10px;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.4);' +
              'border-radius:999px;font-size:10.5px;font-weight:900;color:#86efac;white-space:nowrap;' +
              'font-variant-numeric:tabular-nums;">' +
              '⭐ ' + grandAvg.toFixed(2) + '</div>'
            : '') +
        '</div>' +

        rowsHTML +

      '</div>'
    );
  }

  /* ============================================================
     FGD REALTIME LISTENER
     ============================================================ */
  const __fgdRealtimeListeners = new Map();

  function __attachFGDRealtime(slug, wrapper, driveItems) {
    __detachFGDRealtime(slug);

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      wrapper.innerHTML = '<div style="padding:14px;text-align:center;color:#f87171;font-size:11.5px;">❌ Firebase belum siap</div>';
      return;
    }

    const ref = firebase.database().ref('sgs_fgd/' + slug);
    const cb = (snap) => {
      try {
        if (!wrapper.isConnected) {
          __detachFGDRealtime(slug);
          return;
        }

        const data = snap.val() || {};
        wrapper.innerHTML = renderFGDBox(data);
      } catch (e) {
        console.warn('[FGD-REALTIME] render error:', e.message);
      }
    };

    ref.on('value', cb, (err) => {
      console.warn('[FGD-REALTIME] listener error:', err.message);
    });

    __fgdRealtimeListeners.set(slug, { ref, cb });
  }

  function __detachFGDRealtime(slug) {
    if (!slug) return;
    const item = __fgdRealtimeListeners.get(slug);
    if (!item) return;
    try { item.ref.off('value', item.cb); } catch (e) {}
    __fgdRealtimeListeners.delete(slug);
  }

  function __detachAllFGDRealtime() {
    __fgdRealtimeListeners.forEach((item, slug) => {
      try { item.ref.off('value', item.cb); } catch (e) {}
    });
    __fgdRealtimeListeners.clear();
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
     BACKFILL GLOBAL
     ============================================================ */
  function __isAdminLoggedIn() {
    try {
      return sessionStorage.getItem('_sgs_admin_logged_in') === '1';
    } catch (e) {
      return false;
    }
  }

  let __backfillDone = false;
  async function backfillAllContacts() {
    if (__backfillDone) return;
    __backfillDone = true;

    if (typeof firebase === 'undefined' || !firebase.apps.length) return;
    if (!__isAdminLoggedIn()) {
      console.log('[BACKFILL] ⏭️ Skip — bukan mode admin');
      return;
    }

    console.log('[BACKFILL] Memulai sinkronisasi kontak...');
    const map = {};

    try {
      const snap = await firebase.database().ref('sgs_state/sessions').once('value');
      const sessions = snap.val() || {};
      Object.values(sessions).forEach(s => {
        if (!s || !s.name || /^IP:/.test(s.name)) return;
        const key = String(s.name).toLowerCase().trim();
        if (!map[key]) map[key] = { name: s.name, email: '', phone: '' };
        if (s.email && String(s.email).includes('@')) map[key].email = s.email;
        if (s.phone && String(s.phone).replace(/\D/g, '').length >= 9) {
          map[key].phone = s.phone;
        }
      });
      console.log('[BACKFILL] Dari sessions:', Object.keys(map).length, 'kandidat');
    } catch (e) {
      console.warn('[BACKFILL] Sessions gagal:', e.message);
    }

    try {
      if (typeof window.fetchResultFiles === 'function') {
        const files = await window.fetchResultFiles(false);
        files.forEach(f => {
          const desc = String(f.description || '');
          const namaMatch = desc.match(/Nama:\s*(.+)/i);
          if (!namaMatch) return;
          const name = namaMatch[1].trim();
          if (!name || name === '-') return;
          const key = name.toLowerCase().trim();
          if (!map[key]) map[key] = { name: name, email: '', phone: '' };

          const emailMatch = desc.match(/Email:\s*([^\s\n]+@[^\s\n]+)/i);
          if (emailMatch && emailMatch[1] && String(emailMatch[1]).includes('@')) {
            if (!map[key].email) map[key].email = emailMatch[1].trim();
          }
          const phoneMatch = desc.match(/(?:No\.?\s*HP|Phone|HP):\s*([0-9+\-\s]{8,20})/i);
          if (phoneMatch && phoneMatch[1]) {
            const phone = phoneMatch[1].replace(/\D/g, '');
            if (phone.length >= 9 && !map[key].phone) map[key].phone = phone;
          }
        });
        console.log('[BACKFILL] Total setelah Drive:', Object.keys(map).length, 'kandidat');
      }
    } catch (e) {
      console.warn('[BACKFILL] Drive gagal:', e.message);
    }

    let saved = 0;
    const promises = [];

    Object.keys(map).forEach(key => {
      const c = map[key];
      if (!c.email && !c.phone) return;
      const slug = slugify(c.name);
      if (!slug || slug === 'tanpa-nama') return;

      const payload = {
        candidateName: c.name,
        email: c.email || '',
        phone: c.phone || '',
        ts: firebase.database.ServerValue.TIMESTAMP
      };

      promises.push(
        firebase.database()
          .ref('sgs_candidate_status/' + slug)
          .update(payload)
          .then(() => { saved++; })
          .catch(err => {
            console.warn('[BACKFILL] Gagal simpan', slug + ':', err.message);
          })
      );
    });

    if (promises.length > 0) {
      await Promise.all(promises);
      console.log('[BACKFILL] ✓', saved, '/', promises.length, 'kontak tersimpan ke cache');
    } else {
      console.log('[BACKFILL] Tidak ada kontak baru untuk disimpan');
    }

    console.log('[BACKFILL] ✓ Selesai');
  }

  /* ============================================================
     KONTAK CHIP
     ============================================================ */
  function contactChipHTML(statusData) {
    const email = statusData?.email || '';
    const phone = statusData?.phone || '';
    if (!email && !phone) return '';
    let html = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;font-size:10.5px;">';
    if (email) {
      html += '<span style="padding:3px 9px;border-radius:999px;' +
        'background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.3);' +
        'color:#c4b5fd;font-weight:700;">📧 ' + esc(email) + '</span>';
    }
    if (phone) {
      html += '<span style="padding:3px 9px;border-radius:999px;' +
        'background:rgba(37,211,102,.12);border:1px solid rgba(37,211,102,.3);' +
        'color:#86efac;font-weight:700;">📱 ' + esc(phone) + '</span>';
    }
    html += '</div>';
    return html;
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
      '<div class="js-status-box" data-slug="' + esc(slug) + '" ' +
      'style="margin-top:14px;border-radius:14px;overflow:hidden;' +
      'background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(139,92,246,.06));' +
      'border:1.5px solid rgba(99,102,241,.25);">' +

        '<button type="button" class="js-status-toggle" ' +
          'style="width:100%;display:flex;align-items:center;justify-content:space-between;' +
          'gap:10px;padding:12px 16px;background:transparent;border:0;cursor:pointer;' +
          'font-family:inherit;text-align:left;">' +
          '<div style="display:flex;align-items:center;gap:10px;min-width:0;">' +
            '<span style="font-size:18px;">📋</span>' +
            '<div style="min-width:0;">' +
              '<div style="font-size:10.5px;font-weight:800;color:#818cf8;' +
                'letter-spacing:1.5px;text-transform:uppercase;margin-bottom:2px;">' +
                'Status Kelulusan</div>' +
              '<div class="js-status-label" style="font-size:14px;font-weight:900;' +
                'color:' + curOpt.color + ';white-space:nowrap;overflow:hidden;' +
                'text-overflow:ellipsis;">' +
                curOpt.label +
              '</div>' +
            '</div>' +
          '</div>' +
          '<span class="js-status-chevron" style="font-size:14px;color:#818cf8;' +
            'transition:transform .2s ease;">▾</span>' +
        '</button>' +

        '<div class="js-status-content" style="display:none;padding:0 16px 16px;' +
          'border-top:1px solid rgba(99,102,241,.15);">' +

          '<div style="margin-top:14px;margin-bottom:12px;">' +
            '<div style="font-size:10.5px;font-weight:800;color:#94a3b8;' +
              'letter-spacing:1px;margin-bottom:6px;">UBAH STATUS</div>' +
            '<select class="js-candidate-status" data-slug="' + esc(slug) + '" ' +
              'data-name="' + esc(name) + '" data-position="' + esc(position) + '" ' +
              'style="width:100%;padding:10px 12px;border-radius:10px;' +
              'background:' + curOpt.bg + ';border:1.5px solid ' + curOpt.border + ';' +
              'color:' + curOpt.color + ';font-family:inherit;font-size:13px;' +
              'font-weight:800;cursor:pointer;outline:none;">' +
              opts +
            '</select>' +
          '</div>' +

          '<div style="display:flex;gap:8px;">' +
            '<button class="js-wa-btn" data-slug="' + esc(slug) + '" ' +
              'data-name="' + esc(name) + '" data-position="' + esc(position) + '" ' +
              'style="flex:1;padding:11px 14px;border-radius:10px;' +
              'background:linear-gradient(135deg,#25d366,#128c7e);' +
              'border:0;color:#fff;font-family:inherit;font-size:12.5px;' +
              'font-weight:800;cursor:pointer;' +
              'box-shadow:0 4px 12px rgba(37,211,102,.25);">' +
              '📱 Hubungi WA' +
            '</button>' +
            '<button class="js-email-btn" data-slug="' + esc(slug) + '" ' +
              'data-name="' + esc(name) + '" data-position="' + esc(position) + '" ' +
              'style="flex:1;padding:11px 14px;border-radius:10px;' +
              'background:linear-gradient(135deg,#8b5cf6,#6d28d9);' +
              'border:0;color:#fff;font-family:inherit;font-size:12.5px;' +
              'font-weight:800;cursor:pointer;' +
              'box-shadow:0 4px 12px rgba(139,92,246,.25);">' +
              '📧 Kirim Email' +
            '</button>' +
          '</div>' +

          contactChipHTML(statusData) +

        '</div>' +
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

    if (isGuru && grBtn && !fgdBtn) {
      delete card.dataset.tabbed;
      setTimeout(function() { restructureCard(card).catch(function() {}); }, 300);
      return;
    }
    const isAdmin = /admin|staff|sekretariat|office/.test(posLower);
    const slug = slugify(name);

    const [ratingData, statusData] = await Promise.all([
      isGuru ? loadSubjectRating(slug) : Promise.resolve(null),
      loadStatus(slug)
    ]);

    const tabs = [];
    tabs.push({ id: 'tes', label: '📄 Tes', items: pureTesFiles, multiLabel: true });

    if (grBtn || groups.grafis.length > 0) {
      tabs.push({ id: 'grafis', label: '🎨 Grafis', items: groups.grafis, actionBtn: grBtn });
    }

    if (isGuru) {
      tabs.push({ id: 'fgd', label: '🎯 FGD', items: [], actionBtn: fgdBtn });
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

    if (!isGuru && fgdBtn) {
      try { fgdBtn.remove(); } catch (e) {}
    }

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

    tabs.forEach(t => {
      const panel = wrapper.querySelector('.js-tab-panel[data-panel="' + t.id + '"]');
      if (!panel) return;

      if (t.special === 'subject') {
        panel.innerHTML = ratingHTML(slug, ratingData);
        return;
      }

      if (t.id === 'fgd') {
        if (t.actionBtn) {
          t.actionBtn.style.width = '100%';
          t.actionBtn.style.padding = '10px 14px';
          t.actionBtn.style.fontSize = '12px';
          t.actionBtn.style.marginBottom = '4px';
          t.actionBtn.style.boxSizing = 'border-box';
          t.actionBtn.style.display = 'block';
          panel.appendChild(t.actionBtn);
        }

        const fgdWrap = document.createElement('div');
        fgdWrap.className = 'js-fgd-wrapper';
        fgdWrap.style.marginTop = '10px';
        fgdWrap.innerHTML = '<div style="padding:14px;text-align:center;color:#64748b;font-size:11.5px;">⏳ Memuat data FGD...</div>';
        panel.appendChild(fgdWrap);

        __attachFGDRealtime(slug, fgdWrap, []);

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
      } else if (!t.actionBtn && t.id !== 'fgd') {
        const empty = document.createElement('div');
        empty.style.cssText =
          'padding:20px;text-align:center;color:#64748b;font-size:12px;' +
          'background:rgba(255,255,255,.03);border-radius:10px;border:1px dashed rgba(255,255,255,.1);';
        empty.textContent = 'Belum ada file';
        panel.appendChild(empty);
      }

      if (t.id === 'tes') {
        const retakeWrap = document.createElement('div');
        retakeWrap.style.cssText = 'margin-top:14px;';
        retakeWrap.innerHTML = retakeHTML(slug, statusData, name, position);
        panel.appendChild(retakeWrap);
      }
    });

    fileList.style.display = 'none';

    card.setAttribute('data-candidate-slug', slug);

    if (getComputedStyle(card).position === 'static') {
      card.style.position = 'relative';
    }

    const statusBar = document.createElement('div');
    statusBar.className = 'js-status-bar';
    statusBar.innerHTML = statusBarHTML(slug, statusData, name, position);

    if (!card.querySelector('.js-delete-candidate')) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'js-delete-candidate';
      deleteBtn.setAttribute('data-name', name);
      deleteBtn.setAttribute('data-position', position);
      deleteBtn.title = 'Hapus total kandidat (semua tes)';
      deleteBtn.style.cssText =
        'position:absolute;top:12px;right:12px;' +
        'width:34px;height:34px;' +
        'display:grid;place-items:center;' +
        'background:rgba(239,68,68,.12);' +
        'border:1.5px solid rgba(239,68,68,.35);' +
        'border-radius:10px;' +
        'color:#fca5a5;font-size:15px;' +
        'cursor:pointer;font-family:inherit;' +
        'transition:all .15s ease;z-index:5;';
      deleteBtn.textContent = '🗑️';
      deleteBtn.onmouseenter = () => {
        deleteBtn.style.background = 'rgba(239,68,68,.25)';
        deleteBtn.style.transform = 'scale(1.08)';
      };
      deleteBtn.onmouseleave = () => {
        deleteBtn.style.background = 'rgba(239,68,68,.12)';
        deleteBtn.style.transform = 'scale(1)';
      };

      card.appendChild(deleteBtn);
    }

    fileList.parentElement.insertBefore(wrapper, fileList);

    const __posLower = String(position || '').toLowerCase();
    const __isGuruPos = /guru|dosen|teacher|pengajar|kindergarten|primary|math|biology|english/i.test(__posLower);

    let psikoSlot = null;
    if (__isGuruPos && typeof window.renderPsikogramBox === 'function') {
      psikoSlot = document.createElement('div');
      psikoSlot.className = 'js-psikogram-slot';
      psikoSlot.style.marginTop = '14px';
      fileList.parentElement.insertBefore(psikoSlot, wrapper.nextSibling);
    }

    if (psikoSlot) {
      fileList.parentElement.insertBefore(statusBar, psikoSlot.nextSibling);
    } else {
      fileList.parentElement.insertBefore(statusBar, wrapper.nextSibling);
    }

    if (psikoSlot) {
      window.renderPsikogramBox(slug, name, position)
        .then(function (html) {
          if (html && psikoSlot && psikoSlot.parentElement) {
            psikoSlot.innerHTML = html;
            const btn = psikoSlot.querySelector('.js-psikogram-open');
            if (btn) {
              btn.setAttribute('data-slug', slug);
              btn.setAttribute('data-name', name);
              btn.setAttribute('data-position', position || '');
            }
          } else if (psikoSlot && psikoSlot.parentElement) {
            psikoSlot.remove();
          }
        })
        .catch(function (err) {
          console.warn('[PANEL] Psikogram load error:', err);
          if (psikoSlot && psikoSlot.parentElement) psikoSlot.remove();
        });
    }

    setTimeout(() => {
      card.querySelectorAll(':scope > .js-reset-interview').forEach(b => b.remove());
    }, 100);
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  document.addEventListener('click', function (e) {
    const delBtn = e.target.closest('.js-delete-candidate');
    if (delBtn) {
      e.preventDefault();
      e.stopPropagation();
      const name = delBtn.getAttribute('data-name');
      const position = delBtn.getAttribute('data-position');
      if (name && typeof window.adminDeleteCandidateCompletely === 'function') {
        window.adminDeleteCandidateCompletely(name, position);
      }
      return;
    }

    const fgdDelBtn = e.target.closest('.js-fgd-delete-asesor');
    if (fgdDelBtn) {
      e.preventDefault();
      e.stopPropagation();
      const asesor = fgdDelBtn.getAttribute('data-asesor');
      const card = fgdDelBtn.closest('.rf-card');
      const anyBtn = card ? card.querySelector('.js-interview-link, .js-grafindo-link, .js-fgd-link') : null;
      const name = anyBtn ? anyBtn.getAttribute('data-name') : '';
      const position = anyBtn ? anyBtn.getAttribute('data-position') : '';
      const slug = slugify(name);

      if (!asesor || !name) return;

      fgdDelBtn.disabled = true;
      fgdDelBtn.style.opacity = '.5';
      fgdDelBtn.style.cursor = 'wait';
      fgdDelBtn.textContent = '⏳';

      deleteFGDAsesor(slug, asesor, name, position || '');
      return;
    }

    const statusToggle = e.target.closest('.js-status-toggle');
    if (statusToggle) {
      e.preventDefault();
      e.stopPropagation();
      const box = statusToggle.closest('.js-status-box');
      if (!box) return;
      const content = box.querySelector('.js-status-content');
      const chevron = box.querySelector('.js-status-chevron');
      if (!content) return;

      const isOpen = content.style.display !== 'none';
      content.style.display = isOpen ? 'none' : 'block';
      if (chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
      return;
    }

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

    const wa = e.target.closest('.js-wa-btn');
    if (wa) {
      e.preventDefault();
      e.stopPropagation();
      const slug = wa.getAttribute('data-slug');
      const name = wa.getAttribute('data-name');
      const position = wa.getAttribute('data-position');

      const box = wa.closest('.js-status-box');
      const statusSel = box ? box.querySelector('.js-candidate-status') : null;
      const statusValue = statusSel ? statusSel.value : '';

      openWhatsApp(slug, name, position, statusValue);
      return;
    }

    const emailBtn = e.target.closest('.js-email-btn');
    if (emailBtn) {
      e.preventDefault();
      e.stopPropagation();
      const slug = emailBtn.getAttribute('data-slug');
      const name = emailBtn.getAttribute('data-name');
      const position = emailBtn.getAttribute('data-position');

      const box = emailBtn.closest('.js-status-box');
      const statusSel = box ? box.querySelector('.js-candidate-status') : null;
      const statusValue = statusSel ? statusSel.value : '';

      if (!statusValue) {
        alert('Pilih status kelulusan dulu sebelum kirim email.');
        return;
      }

      (async () => {
        const prev = emailBtn.textContent;
        emailBtn.disabled = true;
        emailBtn.textContent = '🔍 Mencari email...';
        emailBtn.style.opacity = '.7';
        emailBtn.style.cursor = 'wait';

        let email = await findEmail(slug, name);

        emailBtn.disabled = false;
        emailBtn.textContent = prev;
        emailBtn.style.opacity = '1';
        emailBtn.style.cursor = 'pointer';

        if (!email) {
          const input = (typeof window.sgsPrompt === 'function')
            ? await window.sgsPrompt(
                'Email kandidat untuk ' + name + ' tidak ditemukan di sistem.\n\n' +
                'Masukkan manual — atau klik Batal.',
                '',
                { title: '📧 Alamat Email', okText: 'Simpan & Kirim' }
              )
            : prompt('Email kandidat:');
          if (!input) {
            if (typeof window.__showToast === 'function') {
              window.__showToast('Dibatalkan — email tidak tersedia', 'warn');
            }
            return;
          }

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

    const retakeOpen = e.target.closest('.js-retake-open');
    if (retakeOpen) {
      e.preventDefault();
      e.stopPropagation();
      const slug = retakeOpen.getAttribute('data-slug');
      const name = retakeOpen.getAttribute('data-name');
      const position = retakeOpen.getAttribute('data-position');

      if (typeof window.__openRetakeModal === 'function') {
        window.__openRetakeModal(slug, name, position);
      }
      return;
    }

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

        const box = statSel.closest('.js-status-box');
        if (box) {
          const label = box.querySelector('.js-status-label');
          if (label) {
            label.textContent = opt.label;
            label.style.color = opt.color;
          }
        }
      }
    }
  }, true);

  /* ============================================================
     SCAN & INIT
     ============================================================ */
  function scanAndRestructure() {
    if (!__isAdminLoggedIn()) return;

    const cards = document.querySelectorAll('.rf-card');

    const visibleSlugs = new Set();
    cards.forEach(c => {
      const slug = c.getAttribute('data-candidate-slug');
      if (slug) visibleSlugs.add(slug);
    });
    __fgdRealtimeListeners.forEach((item, slug) => {
      if (!visibleSlugs.has(slug)) {
        __detachFGDRealtime(slug);
      }
    });

    cards.forEach(c => { restructureCard(c).catch(() => {}); });
  }

  if (!window.__adminPanelObserver && __isAdminLoggedIn()) {
    window.__adminPanelObserver = new MutationObserver(() => {
      clearTimeout(window.__adminPanelTimer);
      window.__adminPanelTimer = setTimeout(scanAndRestructure, 400);
    });
    window.__adminPanelObserver.observe(document.body, {
      childList: true, subtree: true
    });
  }

  if (!window.__sgsBackfillDone) {
    window.__sgsBackfillDone = true;
    setTimeout(() => {
      backfillAllContacts().then(() => {
        setTimeout(scanAndRestructure, 500);
      }).catch(() => {});
    }, 800);
  }

  setTimeout(scanAndRestructure, 1000);
  setTimeout(scanAndRestructure, 3000);

  window.addEventListener('beforeunload', () => {
    __detachAllFGDRealtime();
  });

  window.__findEmail = findEmail;
  window.__findPhone = findPhone;
  window.__backfillAllContacts = backfillAllContacts;
  window.__buildRetakeUrl = __buildRetakeUrl;
  window.__getNextTahapForCandidate = __getNextTahapForCandidate;
window.__sendStatusEmail = sendStatusEmail;
window.__buildWAMessage = buildWAMessage;
window.__normalizePhoneWA = normalizePhoneWA;
window.__loadStatus = loadStatus;
window.__saveStatus = saveStatus;
  window.__detachAllFGDRealtime = __detachAllFGDRealtime;

  console.log('[ADMIN-CANDIDATE-PANEL] ✓ Loaded — Tahap dinamis + dropdown sesi manual + jadwal countdown');
})();