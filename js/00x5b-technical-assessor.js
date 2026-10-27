/* ============================================================
   js/00x5b-technical-assessor.js — Form Assessor Teknis
   URL: ?technicaldo=1&n=Nama&p=Posisi&kode=KODE
   ============================================================ */
(function () {
  'use strict';

  const urlObj = new URL(window.location.href);
  if (urlObj.searchParams.get('technicaldo') !== '1') return;
  window.__TECHNICAL_MODE_ACTIVE = true;

  const candidateName = urlObj.searchParams.get('n') || '';
  const candidatePosition = urlObj.searchParams.get('p') || '';
  const assessorKode = (urlObj.searchParams.get('kode') || '').toUpperCase();

  if (!candidateName || !assessorKode) {
    document.body.innerHTML = '<div style="padding:40px;text-align:center;font-family:Inter,sans-serif;"><h1>❌ Link tidak valid</h1><p>Parameter nama / kode assessor tidak lengkap.</p></div>';
    return;
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function slugify(name) {
    return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  }
  const slug = slugify(candidateName);

  function hideDefaultUI() {
    const app = document.getElementById('app');
    if (app) { app.style.display = 'none'; app.innerHTML = ''; }
    const pwd = document.getElementById('passwordScreen');
    if (pwd) pwd.style.display = 'none';
    if (document.body) { document.body.style.background = '#f8fafc'; document.body.style.overflow = 'auto'; }
  }
  hideDefaultUI();
  setTimeout(hideDefaultUI, 100);
  setTimeout(hideDefaultUI, 500);

  const state = {
    rating: 0,
    notes: '',
    noteFileDataUrl: '',
    noteFileName: '',
    noteFileMime: '',
    images: []
  };

  async function loadCandidateImages() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;
    try {
      const snap = await firebase.database().ref('sgs_technical_images/' + slug).once('value');
      const d = snap.val();
      if (d && d.images) state.images = Object.values(d.images).map(i => i.dataUrl).filter(Boolean);
    } catch (e) {}
  }

  function renderForm() {
    const old = document.getElementById('techAssessorRoot');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'techAssessorRoot';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%);overflow-y:auto;padding:20px;font-family:Inter,system-ui,sans-serif;';

    const imgsHTML = state.images.length
      ? '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">'
        + state.images.map((url, i) => '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;cursor:zoom-in;" onclick="window.open(\'' + url + '\',\'_blank\')"><img src="' + url + '" style="width:100%;height:160px;object-fit:contain;background:#f8fafc;"><div style="padding:6px;text-align:center;font-size:11px;font-weight:700;color:#64748b;">📄 Hal. ' + (i + 1) + '</div></div>').join('')
        + '</div>'
      : '<div style="padding:20px;text-align:center;color:#94a3b8;font-size:12px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;">Belum ada foto jawaban dari kandidat.</div>';

    const ratingOpts = [1,2,3,4].map(val => {
      const label = {1:'Not Recommended',2:'Fairly',3:'Recommended',4:'Highly Recommended'}[val];
      const icon = {1:'❌',2:'⚠️',3:'✅',4:'🌟'}[val];
      return '<label style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#fff;border:2px solid #e2e8f0;border-radius:10px;cursor:pointer;transition:all .15s;">'
        + '<input type="radio" name="techRating" value="' + val + '" style="width:18px;height:18px;accent-color:#6366f1;">'
        + '<span style="font-size:16px;">' + icon + '</span>'
        + '<span style="font-size:13px;font-weight:800;color:#1e293b;">' + val + ' — ' + label + '</span>'
        + '</label>';
    }).join('');

    ov.innerHTML = '<div style="max-width:800px;margin:0 auto;background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.1);overflow:hidden;">'
      + '<div style="padding:20px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;">'
      + '<div style="font-size:11px;font-weight:800;letter-spacing:2px;opacity:.85;">KEMAMPUAN TEKNIS · ASSESSOR</div>'
      + '<div style="font-size:20px;font-weight:900;margin-top:4px;">Form Penilaian</div>'
      + '</div>'
      + '<div style="padding:20px 24px;">'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;background:#f8fafc;border-radius:10px;margin-bottom:16px;">'
      + '<div><div style="font-size:10px;font-weight:800;color:#64748b;">KANDIDAT</div><div style="font-size:13px;font-weight:800;color:#1e293b;margin-top:2px;">' + escHtml(candidateName) + '</div></div>'
      + '<div><div style="font-size:10px;font-weight:800;color:#64748b;">POSISI</div><div style="font-size:13px;font-weight:800;color:#1e293b;margin-top:2px;">' + escHtml(candidatePosition || '-') + '</div></div>'
      + '<div><div style="font-size:10px;font-weight:800;color:#64748b;">ASSESSOR</div><div style="font-size:13px;font-weight:800;color:#6366f1;margin-top:2px;">' + escHtml(assessorKode) + '</div></div>'
      + '</div>'
      + '<div style="margin-bottom:16px;"><div style="font-size:11px;font-weight:800;color:#475569;margin-bottom:8px;">📷 FOTO JAWABAN</div>' + imgsHTML + '</div>'
      + '<div style="margin-bottom:16px;"><div style="font-size:11px;font-weight:800;color:#475569;margin-bottom:8px;">⭐ RATING (1-4)</div><div style="display:flex;flex-direction:column;gap:8px;">' + ratingOpts + '</div></div>'
      + '<div style="margin-bottom:16px;"><div style="font-size:11px;font-weight:800;color:#475569;margin-bottom:8px;">📝 CATATAN</div>'
      + '<textarea id="techNotes" rows="4" placeholder="Tulis catatan..." style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:13px;resize:vertical;outline:none;box-sizing:border-box;"></textarea></div>'
      + '<div style="display:flex;gap:10px;"><button id="techSubmitBtn" style="flex:2;padding:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;border-radius:10px;color:#fff;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer;">✓ Kirim Penilaian</button>'
      + '<button id="techCloseBtn" style="flex:1;padding:14px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;color:#475569;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Tutup</button></div>'
      + '</div></div>';

    document.body.appendChild(ov);

    ov.querySelectorAll('input[name="techRating"]').forEach(radio => {
      radio.addEventListener('change', () => {
        state.rating = Number(radio.value);
        ov.querySelectorAll('input[name="techRating"]').forEach(r => {
          r.closest('label').style.borderColor = r.checked ? '#6366f1' : '#e2e8f0';
          r.closest('label').style.background = r.checked ? '#eef2ff' : '#fff';
        });
      });
    });

    ov.querySelector('#techNotes').addEventListener('input', e => { state.notes = e.target.value; });
    ov.querySelector('#techCloseBtn').onclick = () => ov.remove();
    ov.querySelector('#techSubmitBtn').onclick = async () => {
      if (!state.rating) { alert('Pilih rating dulu'); return; }
      const btn = ov.querySelector('#techSubmitBtn');
      btn.disabled = true; btn.textContent = '⏳ Mengirim...';
      try {
        if (typeof firebase === 'undefined' || !firebase.apps.length) throw new Error('Firebase belum siap');
        await firebase.database().ref('sgs_technical_assessments/' + slug + '/assessments/' + assessorKode).set({
          assessorName: assessorKode,
          rating: state.rating,
          notes: state.notes || '',
          ts: firebase.database.ServerValue.TIMESTAMP
        });
        await firebase.database().ref('sgs_technical_assessments/' + slug).update({
          candidateName: candidateName,
          candidatePosition: candidatePosition || ''
        });
        btn.textContent = '✓ Terkirim';
        setTimeout(() => {
          ov.innerHTML = '<div style="max-width:600px;margin:60px auto;background:#fff;border-radius:18px;padding:40px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.1);">'
            + '<div style="font-size:64px;margin-bottom:16px;">✅</div>'
            + '<div style="font-size:22px;font-weight:900;color:#065f46;margin-bottom:8px;">Penilaian Terkirim</div>'
            + '<div style="font-size:14px;color:#475569;line-height:1.6;">Terima kasih, <b>' + escHtml(assessorKode) + '</b>.<br>Hasil penilaian sudah tersimpan.</div>'
            + '</div>';
        }, 500);
      } catch (err) {
        alert('Gagal: ' + err.message);
        btn.disabled = false; btn.textContent = '✓ Kirim Penilaian';
      }
    };
  }

  async function run() {
    await loadCandidateImages();
    renderForm();
  }

  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    run();
  } else {
    let waited = 0;
    const waitFb = setInterval(() => {
      waited += 100;
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
        clearInterval(waitFb); run();
      } else if (waited > 5000) { clearInterval(waitFb); run(); }
    }, 100);
  }

  console.log('[TECHNICAL-ASSESSOR] ✓ Loaded — ' + assessorKode);
})();