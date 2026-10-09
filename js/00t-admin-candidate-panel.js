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
   - File item: layout vertikal (stack) untuk panel sempit
   - 🆕 Status Lolos / Tidak Lolos + tombol WhatsApp + Kirim Email
   - 🆕 Auto-fetch email & phone dari Firebase + Drive
   - 🆕 Layout baru: Tabs di atas → Status collapsible di bawah
   - 🆕 Tombol 🗑️ hapus total kandidat
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
     CARI EMAIL KANDIDAT — AUTO dari Firebase + Drive
     ============================================================ */
  async function findEmail(slug, candidateName) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return null;

    // 1. Cache
    try {
      const snap = await firebase.database()
        .ref('sgs_candidate_status/' + slug + '/email').once('value');
      const cached = snap.val();
      if (cached && String(cached).includes('@')) return cached;
    } catch (e) {}

    // 2. sgs_state/sessions (by name match)
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

    // 3. sgs_interviews
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

    // 4. Drive file description
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
     CARI PHONE (WA) KANDIDAT — AUTO dari Firebase + Drive
     ============================================================ */
  async function findPhone(slug, candidateName) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return null;

    // 1. Cache
    try {
      const snap = await firebase.database()
        .ref('sgs_candidate_status/' + slug + '/phone').once('value');
      const cached = snap.val();
      if (cached && String(cached).replace(/\D/g, '').length >= 9) return cached;
    } catch (e) {}

    // 2. sgs_state/sessions
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

    // 3. Drive file description
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

  /* ============================================================
     🆕 RETAKE TAB — Kirim link tes tahap 2
     ============================================================ */
  function retakeHTML(slug, statusData, name, position) {
    const tests = [
      { id: 'IST',      label: 'Kecerdasan' },
      { id: 'KRAEPLIN', label: 'Koran' },
      { id: 'DISC',     label: 'Kepemimpinan' },
      { id: 'PAPI',     label: 'Sikap Kerja' },
      { id: 'BIGFIVE',  label: 'Kepribadian' },
      { id: 'GRAFIS',   label: 'Gambar' },
      { id: 'EXCEL',    label: 'Excel' },
      { id: 'TYPING',   label: 'Mengetik' },
      { id: 'SUBJECT',  label: 'Subjek' }
    ];

    const checkboxes = tests.map(t =>
      '<label style="display:flex;align-items:center;gap:8px;' +
      'padding:8px 12px;background:rgba(255,255,255,.03);' +
      'border:1px solid rgba(255,255,255,.08);border-radius:8px;' +
      'cursor:pointer;font-size:11.5px;">' +
        '<input type="checkbox" class="js-retake-test" value="' + t.id + '" ' +
          'style="width:15px;height:15px;accent-color:#3b82f6;cursor:pointer;">' +
        '<span style="font-weight:700;color:#cbd5e1;">' + t.label + '</span>' +
      '</label>'
    ).join('');

    const email = statusData?.email || '';
    const phone = statusData?.phone || '';

    return (
      '<div class="js-retake-panel" style="padding:14px;' +
      'background:linear-gradient(135deg,rgba(59,130,246,.08),rgba(139,92,246,.05));' +
      'border:1.5px solid rgba(59,130,246,.25);border-radius:12px;">' +

        '<div style="font-size:12px;font-weight:800;color:#93c5fd;' +
        'margin-bottom:8px;">📤 Kirim Link Tes Tahap 2</div>' +

        '<div style="font-size:11px;color:#94a3b8;line-height:1.5;' +
        'margin-bottom:12px;">' +
          'Pilih tes yang akan dikerjakan ulang. Kandidat akan menerima ' +
          'link & <b>langsung masuk ke tes</b> tanpa isi identitas & pilih tes lagi.' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:repeat(2,1fr);' +
        'gap:6px;margin-bottom:12px;">' +
          checkboxes +
        '</div>' +

        (email ? '<div style="font-size:10.5px;color:#c4b5fd;' +
                 'margin-bottom:6px;">📧 ' + esc(email) + '</div>' : '') +
        (phone ? '<div style="font-size:10.5px;color:#86efac;' +
                 'margin-bottom:6px;">📱 ' + esc(phone) + '</div>' : '') +

        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          '<button class="js-retake-copy" data-slug="' + esc(slug) + '" ' +
          'data-name="' + esc(name) + '" data-position="' + esc(position) + '" ' +
            'style="flex:1;min-width:80px;padding:10px;border-radius:9px;' +
            'background:rgba(59,130,246,.2);border:1px solid rgba(59,130,246,.4);' +
            'color:#93c5fd;font-family:inherit;font-size:11px;font-weight:800;' +
            'cursor:pointer;">📋 Copy Link</button>' +

          '<button class="js-retake-wa" data-slug="' + esc(slug) + '" ' +
          'data-name="' + esc(name) + '" data-position="' + esc(position) + '" ' +
            'style="flex:1;min-width:80px;padding:10px;border-radius:9px;' +
            'background:linear-gradient(135deg,#25d366,#128c7e);' +
            'border:0;color:#fff;font-family:inherit;font-size:11px;' +
            'font-weight:800;cursor:pointer;">📱 Kirim WA</button>' +

          '<button class="js-retake-email" data-slug="' + esc(slug) + '" ' +
          'data-name="' + esc(name) + '" data-position="' + esc(position) + '" ' +
            'style="flex:1;min-width:80px;padding:10px;border-radius:9px;' +
            'background:linear-gradient(135deg,#8b5cf6,#6d28d9);' +
            'border:0;color:#fff;font-family:inherit;font-size:11px;' +
            'font-weight:800;cursor:pointer;">📧 Kirim Email</button>' +
        '</div>' +

      '</div>'
    );
  }

  /* ============================================================
     Helper: ambil tes yang dipilih di panel retake
     ============================================================ */
  function __getSelectedRetakeTests(btn) {
    const panel = btn.closest('.js-retake-panel');
    if (!panel) return [];
    const checked = panel.querySelectorAll('.js-retake-test:checked');
    return Array.from(checked).map(c => c.value);
  }

  /* ============================================================
     Build URL retake
     ============================================================ */
  function __buildRetakeUrl(name, position, tests) {
    const base = window.location.origin + window.location.pathname;
    return base + '?retake=1' +
      '&n=' + encodeURIComponent(name) +
      '&p=' + encodeURIComponent(position || '') +
      '&tests=' + encodeURIComponent(tests.join(','));
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
     🗑️ HAPUS TOTAL KANDIDAT — semua resource
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
          '  subject_ratings, candidate_status\n' +
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

    // === 1. HAPUS FILE DI DRIVE ===
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
    } catch (e) { console.warn('[DELETE] Drive:', e.message); }

    // === 2. HAPUS DATA DI FIREBASE ===
    const paths = [
      'sgs_interviews/' + slug,
      'sgs_grafis_interp/' + slug,
      'sgs_grafis_images/' + slug,
      'sgs_fgd/' + slug,
      'sgs_subject_ratings/' + slug,
      'sgs_candidate_status/' + slug
    ];

    for (const path of paths) {
      try {
        await firebase.database().ref(path).remove();
        fbDeleted++;
      } catch (e) {}
    }

    // === 3. HAPUS CHAT ROOM (kalau ada) ===
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
          } catch (e) {}
        }
      }
    } catch (e) {}

    // === 4. INVALIDATE CACHE & REFRESH ===
    if (typeof window.__invalidateResultCache === 'function') window.__invalidateResultCache();
    setTimeout(() => {
      if (document.getElementById('resultFilesPageOverlay') && typeof window.__renderResultPageContent === 'function') {
        window.__renderResultPageContent();
      }
    }, 500);

    const card = document.querySelector('.rf-card[data-candidate-slug="' + slug + '"]');
    if (card) card.remove();

    alert(
      '✅ Hapus total selesai:\n\n' +
      '• Firebase paths: ' + fbDeleted + ' dihapus\n' +
      '• File Drive: ' + driveDeleted + ' dihapus\n\n' +
      'Kandidat "' + candidateName + '" sudah dihapus permanen.'
    );
  };

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
     BACKFILL GLOBAL — Scan sessions + Drive, cache semua kontak
     ============================================================ */
  let __backfillDone = false;
  async function backfillAllContacts() {
    if (__backfillDone) return;
    __backfillDone = true;

    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    console.log('[BACKFILL] Memulai sinkronisasi kontak...');
    const map = {};

    // 1. Dari sessions
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

    // 2. Dari Drive file description
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

    // 3. Push ke sgs_candidate_status (per-slug)
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
     KONTAK CHIP — info email & phone
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
     STATUS BAR HTML — Collapsible
     Default: badge compact "📋 Status: X ▾"
     Klik: expand → dropdown + WA + Email
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

        // Toggle header
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

        // Expanded content
        '<div class="js-status-content" style="display:none;padding:0 16px 16px;' +
          'border-top:1px solid rgba(99,102,241,.15);">' +

          // Dropdown status
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

          // Aksi: WA + Email
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

    // 🆕 FGD hanya untuk posisi Guru/Dosen
    if (isGuru && (fgdBtn || groups.fgd.length > 0)) {
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
    // 🆕 Tab "Kirim Tahap 2" — SELALU tampil
    tabs.push({ id: 'retake', label: '📤 Kirim Tahap 2', special: 'retake' });

    // 🆕 Cleanup: hapus tombol action yang TIDAK dipakai
    // (fix bug "FGD muncul di non-guru")
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
      if (t.special === 'retake') {
        panel.innerHTML = retakeHTML(slug, statusData, name, position);
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

    fileList.style.display = 'none';

    // Set data-slug di card
    card.setAttribute('data-candidate-slug', slug);

    // Pastikan card relative untuk tombol sampah
    if (getComputedStyle(card).position === 'static') {
      card.style.position = 'relative';
    }

    // Buat status bar collapsible
    const statusBar = document.createElement('div');
    statusBar.className = 'js-status-bar';
    statusBar.innerHTML = statusBarHTML(slug, statusData, name, position);

    // 🆕 Tombol sampah — pojok kanan atas kartu
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

    // 🆕 INSERT: Tabs DULU → Status di BAWAH
    fileList.parentElement.insertBefore(wrapper, fileList);
    fileList.parentElement.insertBefore(statusBar, wrapper.nextSibling);

    setTimeout(() => {
      card.querySelectorAll(':scope > .js-reset-interview').forEach(b => b.remove());
    }, 100);
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  document.addEventListener('click', function (e) {
    // 🆕 TOMBOL SAMPAH
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

    // 🆕 STATUS TOGGLE
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

    // Reset interview
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

      const box = wa.closest('.js-status-box');
      const statusSel = box ? box.querySelector('.js-candidate-status') : null;
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

    // 🆕 RETAKE — Copy Link
    const copyRetake = e.target.closest('.js-retake-copy');
    if (copyRetake) {
      e.preventDefault();
      e.stopPropagation();
      const name = copyRetake.getAttribute('data-name');
      const position = copyRetake.getAttribute('data-position');
      const tests = __getSelectedRetakeTests(copyRetake);

      if (tests.length === 0) {
        alert('Pilih minimal 1 tes terlebih dahulu.');
        return;
      }

      const url = __buildRetakeUrl(name, position, tests);

      try {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(() => {
            const prev = copyRetake.textContent;
            copyRetake.textContent = '✅ Tersalin';
            if (typeof window.__showToast === 'function') {
              window.__showToast('📋 Link tes tahap 2 tersalin', 'success');
            }
            setTimeout(() => { copyRetake.textContent = prev; }, 1800);
          }).catch(() => {
            window.prompt('Copy link ini:', url);
          });
        } else {
          window.prompt('Copy link ini:', url);
        }
      } catch (err) {
        window.prompt('Copy link ini:', url);
      }
      return;
    }

    // 🆕 RETAKE — Kirim WA
    const waRetake = e.target.closest('.js-retake-wa');
    if (waRetake) {
      e.preventDefault();
      e.stopPropagation();
      const slug = waRetake.getAttribute('data-slug');
      const name = waRetake.getAttribute('data-name');
      const position = waRetake.getAttribute('data-position');
      const tests = __getSelectedRetakeTests(waRetake);

      if (tests.length === 0) {
        alert('Pilih minimal 1 tes terlebih dahulu.');
        return;
      }

      (async () => {
        const phone = await findPhone(slug, name);
        if (!phone) {
          alert('Nomor WA kandidat tidak tersedia. Isi manual dulu via tombol "Hubungi WA".');
          return;
        }

        const norm = normalizePhoneWA(phone);
        if (!norm) {
          alert('Nomor WA tidak valid: ' + phone);
          return;
        }

        const url = __buildRetakeUrl(name, position, tests);
        const message =
          'Halo ' + name + ',\n\n' +
          'Admin Sugar Group Schools mengirimkan link untuk *Tes Tahap 2*.\n\n' +
          '📋 Tes yang harus dikerjakan: *' + tests.join(', ') + '*\n\n' +
          '🔗 Link: ' + url + '\n\n' +
          'Isi password yang diberikan admin untuk masuk. Anda akan langsung masuk ke tes tanpa isi data ulang.\n\n' +
          'Terima kasih.';

        window.open('https://wa.me/' + norm + '?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
      })();
      return;
    }

    // 🆕 RETAKE — Kirim Email
    const emailRetake = e.target.closest('.js-retake-email');
    if (emailRetake) {
      e.preventDefault();
      e.stopPropagation();
      const slug = emailRetake.getAttribute('data-slug');
      const name = emailRetake.getAttribute('data-name');
      const position = emailRetake.getAttribute('data-position');
      const tests = __getSelectedRetakeTests(emailRetake);

      if (tests.length === 0) {
        alert('Pilih minimal 1 tes terlebih dahulu.');
        return;
      }

      (async () => {
        const email = await findEmail(slug, name);
        if (!email || !isValidEmail(email)) {
          alert('Email kandidat tidak tersedia atau tidak valid. Isi manual dulu via tombol "Kirim Email" utama.');
          return;
        }

        const url = __buildRetakeUrl(name, position, tests);

        const subject = '🔗 Link Tes Tahap 2 — ' + name;
        const htmlBody =
          '<div style="font-family:-apple-system,sans-serif;line-height:1.65;color:#1e293b;max-width:560px;margin:0 auto;">' +
            '<div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:24px;text-align:center;border-radius:12px 12px 0 0;color:#fff;">' +
              '<div style="font-size:11px;font-weight:800;letter-spacing:3px;opacity:.85;margin-bottom:4px;">SUGAR GROUP SCHOOLS</div>' +
              '<div style="font-size:18px;font-weight:900;">Tes Tahap 2</div>' +
            '</div>' +
            '<div style="background:#fff;padding:28px 24px;">' +
              '<p>Halo <b>' + name + '</b>,</p>' +
              '<p>Admin Sugar Group Schools mengirimkan link untuk <b>Tes Tahap 2</b>.</p>' +
              '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 16px;margin:18px 0;">' +
                '<div style="font-size:12px;font-weight:800;color:#1e40af;margin-bottom:6px;">📋 TES YANG HARUS DIKERJAKAN</div>' +
                '<div style="font-size:14px;font-weight:900;color:#1e40af;">' + tests.join(' · ') + '</div>' +
              '</div>' +
              '<div style="text-align:center;margin:24px 0;">' +
                '<a href="' + url + '" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;text-decoration:none;border-radius:12px;font-weight:900;font-size:14px;">🚀 Mulai Tes Tahap 2</a>' +
              '</div>' +
              '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 14px;font-size:12.5px;color:#78350f;">' +
                '<b>⚠️ Catatan:</b> Isi password yang diberikan admin untuk masuk. Anda akan langsung masuk ke tes tanpa isi data ulang.' +
              '</div>' +
              '<p style="margin-top:20px;font-size:13px;color:#64748b;">Terima kasih,<br><b>Tim Recruitment</b><br>Sugar Group Schools</p>' +
            '</div>' +
            '<div style="background:#0f172a;color:#94a3b8;padding:16px;text-align:center;font-size:11px;border-radius:0 0 12px 12px;">Email otomatis · Jangan balas langsung</div>' +
          '</div>';

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

          const prev = emailRetake.textContent;
          emailRetake.textContent = '✅ Terkirim';
          emailRetake.style.background = 'linear-gradient(135deg,#16a34a,#059669)';
          if (typeof window.__showToast === 'function') {
            window.__showToast('📧 Link tes tahap 2 terkirim ke ' + email, 'success');
          }
          setTimeout(() => {
            emailRetake.textContent = prev;
            emailRetake.style.background = 'linear-gradient(135deg,#8b5cf6,#6d28d9)';
          }, 2200);
        } catch (err) {
          alert('Gagal kirim email: ' + err.message);
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

        // 🆕 Update label di header status
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

  /* 🆕 Backfill otomatis semua kontak */
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

  /* 🆕 Expose untuk debugging/testing via Console */
  window.__findEmail = findEmail;
  window.__findPhone = findPhone;
  window.__backfillAllContacts = backfillAllContacts;

  console.log('[ADMIN-CANDIDATE-PANEL] ✓ Loaded — tab + status + WA + email + reset + delete');
})();