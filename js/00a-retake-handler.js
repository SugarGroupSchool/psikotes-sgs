/* ============================================================
   js/00a-retake-handler.js
   ------------------------------------------------------------
   Handle URL ?retake=1 — kandidat langsung masuk home tes
   TANPA: minta izin akses, isi identitas, pilih tes.

   File ini HARUS dimuat SEBELUM 08-app-init.js
   ============================================================ */

(function () {
  'use strict';

  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('retake') !== '1') return;

    const n = url.searchParams.get('n') || '';
    const p = url.searchParams.get('p') || '';
    const d = url.searchParams.get('d') || '';
    const testsRaw = url.searchParams.get('tests') || '';
    const tests = testsRaw.split(',').map(x => x.trim()).filter(Boolean);

    if (!n || tests.length === 0) {
      console.warn('[RETAKE-HANDLER] n / tests kosong — skip');
      return;
    }

    console.log('[RETAKE-HANDLER] 🎯 Retake mode aktif:', n, '·', tests.join(','),
      d ? '· deviceId: ' + d.slice(-8) : '· (tanpa deviceId)');

    /* --- Clear flag agar tidak tampil layar minta izin --- */
    try {
      localStorage.removeItem('_sgs_finished');
      localStorage.removeItem('_sgs_disqualified');
      localStorage.removeItem('_sgs_lock');
      sessionStorage.removeItem('_sgs_retake_processed');
      sessionStorage.removeItem('_sgs_resumeChecked');
      sessionStorage.removeItem('_sgs_reloading');
    } catch (e) {}

    /* --- Set mode login pakai password USED --- */
    try {
      localStorage.setItem('usedPragas', '1');
    } catch (e) {}

    /* --- 🆕 Adopsi device ID target supaya konsisten --- */
    if (d) {
      try {
        localStorage.setItem('_sgs_device_id', d);
        console.log('[RETAKE-HANDLER] 🔄 Adopsi device ID target:', d.slice(-8));
      } catch (e) {}
    }

    /* --- Simpan data retake supaya 04-auth.js bisa restore --- */
    try {
      sessionStorage.setItem('__sgs_retake', JSON.stringify({
        name: n,
        position: p,
        tests: tests,
        deviceId: d,
        ts: Date.now()
      }));
    } catch (e) {}

    /* --- Flag khusus untuk 08-app-init.js & 04-auth.js --- */
    try {
      localStorage.setItem('_sgs_retake_mode', '1');
      localStorage.setItem('_sgs_retake_skip_form', '1');
    } catch (e) {}

    /* --- Bersihkan URL supaya tidak loop --- */
    window.history.replaceState({}, '', url.pathname);

    console.log('[RETAKE-HANDLER] ✓ Setup selesai — kandidat tinggal masukkan password USED');

  } catch (e) {
    console.warn('[RETAKE-HANDLER] Error:', e.message);
  }
})();