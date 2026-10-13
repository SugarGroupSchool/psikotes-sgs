/* ============================================================
   js/00a-retake-handler.js
   ------------------------------------------------------------
   Handle URL ?retake=1 — kandidat langsung masuk home tes
   TANPA: minta izin akses, isi identitas, pilih tes.

   🆕 v2 [2026-10-13]: Support TAHAP DINAMIS (2, 3, 4, 5, ...)
   - URL: ?retake=1&n=...&tests=...&tahap=3
   - Default tahap = 2 (backward compat)

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

    /* 🆕 Baca tahap dari URL (default 2, range 2-20) */
    const tahapRaw = url.searchParams.get('tahap') || '2';
    const tahap = Math.max(2, Math.min(20, parseInt(tahapRaw, 10) || 2));
/* 🆕 Baca jadwal mulai (unix detik) */
const startRaw = url.searchParams.get('start') || '0';
const startAt = Math.max(0, parseInt(startRaw, 10) || 0);
    const testsRaw = url.searchParams.get('tests') || '';
    const tests = testsRaw.split(',').map(x => x.trim()).filter(Boolean);

    if (!n || tests.length === 0) {
      console.warn('[RETAKE-HANDLER] n / tests kosong — skip');
      return;
    }

    console.log(
      '%c[RETAKE-HANDLER] 🎯 Retake mode aktif',
      'color:#6366f1;font-weight:900;',
      `— Tahap ${tahap} · ${n} · [${tests.join(', ')}]` +
      (d ? ' · deviceId: ' + d.slice(-8) : ' · (tanpa deviceId)')
    );

    /* --- Clear flag agar tidak tampil layar minta izin --- */
    try {
      localStorage.removeItem('_sgs_finished');
      localStorage.removeItem('_sgs_disqualified');
      localStorage.removeItem('_sgs_lock');
      sessionStorage.removeItem('_sgs_retake_processed');
      sessionStorage.removeItem('__resumeChecked');
      sessionStorage.removeItem('_sgs_reloading');
    } catch (e) {}

    /* --- Set mode login pakai password USED --- */
    try {
      localStorage.setItem('usedPragas', '1');
    } catch (e) {}

    /* --- Adopsi device ID target supaya konsisten --- */
    if (d) {
      try {
        localStorage.setItem('_sgs_device_id', d);
        console.log('[RETAKE-HANDLER] 🔄 Adopsi device ID target:', d.slice(-8));
      } catch (e) {}
    }

    /* --- Simpan data retake supaya 04-auth.js bisa restore --- */
try {                                                         ← 2. SAVE
  sessionStorage.setItem('__sgs_retake', JSON.stringify({
    name: n,
    position: p,
    tests: tests,
    tahap: tahap,
    startAt: startAt,          ← tambahkan juga di sini
    deviceId: d,
    ts: Date.now()
  }));
} catch (e) {}

try {
  localStorage.setItem('_sgs_retake_mode', '1');
  localStorage.setItem('_sgs_retake_skip_form', '1');
  localStorage.setItem('_sgs_retake_tahap', String(tahap));

  if (startAt > 0) {                                          ← 3. LOCK
    localStorage.setItem('_sgs_schedule_lock', String(startAt));
  }
} catch (e) {}

    /* --- 🆕 Set info global untuk file lain --- */
    window.__RETAKE_INFO = {
      tahap: tahap,
      name: n,
      position: p,
      tests: tests.slice(),
      deviceId: d
    };

    /* --- Bersihkan URL supaya tidak loop --- */
    window.history.replaceState({}, '', url.pathname);

    console.log(`[RETAKE-HANDLER] ✓ Setup selesai — kandidat tinggal masukkan password USED (Tahap ${tahap})`);

  } catch (e) {
    console.warn('[RETAKE-HANDLER] Error:', e.message);
  }
})();