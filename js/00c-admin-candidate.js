/* ============================================================
   js/00c-admin-candidate.js
   - Halaman detail kandidat aktif (admin)
   - SELF-REGISTER: otomatis override renderActiveSessionsHTML
   - Tidak perlu edit 00b-admin.js
   ============================================================ */

(function() {
  'use strict';

  /* ============================================================
     STATE
     ============================================================ */
  let __cdRef = null;
  let __cdCb = null;
  let __cdDeviceId = null;

  /* ============================================================
     HELPERS
     ============================================================ */
  function cdEscape(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function cdFmtTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const r = (s % 60).toString().padStart(2, '0');
    return `${m}:${r}`;
  }

  function cdToast(msg, color = '#16a34a') {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `
      position: fixed; bottom: 24px; right: 24px;
      padding: 12px 18px; border-radius: 10px;
      background: ${color}; color: #fff; font-weight: 800;
      font-size: 13px; z-index: 2147483647;
      box-shadow: 0 10px 26px ${color}55;
      font-family: Inter, system-ui, sans-serif;
    `;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  /* ============================================================
     OPEN / CLOSE DETAIL PAGE
     ============================================================ */
  function openCandidateDetailPage(deviceId) {
    if (!deviceId) { alert('Device ID tidak valid'); return; }
    __cdDeviceId = deviceId;

    const old = document.getElementById('candidateDetailOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'candidateDetailOverlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 100000;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      display: flex; flex-direction: column;
      font-family: Inter, system-ui, -apple-system, sans-serif;
      color: #e2e8f0;
      overflow: hidden;
    `;

    overlay.innerHTML = `
      <style>
        @keyframes cdIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cdCardIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cdSpin { to { transform: rotate(360deg); } }
        .cd-scroll::-webkit-scrollbar { width: 8px; }
        .cd-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,.03); }
        .cd-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 4px; }
        .cd-btn {
          padding: 10px 16px; border-radius: 10px; border: 0;
          font-family: inherit; font-size: 13px; font-weight: 800;
          cursor: pointer; transition: all .18s ease;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .cd-btn:hover { transform: translateY(-1px); }
        .cd-btn-primary { background: linear-gradient(135deg, #3b82f6, #1e40af); color: #fff; box-shadow: 0 4px 14px rgba(59,130,246,.3); }
        .cd-btn-success { background: linear-gradient(135deg, #16a34a, #059669); color: #fff; box-shadow: 0 4px 14px rgba(22,163,74,.3); }
        .cd-btn-warning { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; box-shadow: 0 4px 14px rgba(245,158,11,.3); }
        .cd-btn-danger  { background: linear-gradient(135deg, #dc2626, #991b1b); color: #fff; box-shadow: 0 4px 14px rgba(220,38,38,.3); }
        .cd-btn-ghost   { background: rgba(255,255,255,.06); color: #cbd5e1; border: 1.5px solid rgba(255,255,255,.12); }
        .cd-btn-ghost:hover { background: rgba(255,255,255,.1); color: #fff; }
      </style>

      <div style="
        padding: 20px 28px;
        background: linear-gradient(180deg, rgba(0,0,0,.25), transparent);
        border-bottom: 1px solid rgba(255,255,255,.08);
        display: flex; align-items: center; gap: 18px;
        flex-wrap: wrap;
      ">
        <button id="cdBackBtn" class="cd-btn cd-btn-ghost" style="width:44px;height:44px;padding:0;justify-content:center;font-size:18px;">←</button>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #818cf8; margin-bottom: 4px;">ADMIN · DETAIL KANDIDAT</div>
          <div id="cdHeaderName" style="font-size: 22px; font-weight: 900; color: #fff;">Memuat...</div>
        </div>
        <div id="cdHeaderBadge"></div>
      </div>

      <div class="cd-scroll" id="cdContent" style="flex: 1; overflow-y: auto; padding: 24px 28px 40px;">
        <div style="
          display: flex; align-items: center; justify-content: center;
          padding: 80px 20px; color: #64748b; font-size: 14px;
          flex-direction: column; gap: 14px;
        ">
          <div style="
            width: 40px; height: 40px;
            border: 3px solid rgba(255,255,255,.1);
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: cdSpin .8s linear infinite;
          "></div>
          Memuat data kandidat...
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.getElementById('cdBackBtn').onclick = closeCandidateDetailPage;
    startListener(deviceId);
  }

  function closeCandidateDetailPage() {
    stopListener();
    const overlay = document.getElementById('candidateDetailOverlay');
    if (overlay) overlay.remove();
    __cdDeviceId = null;
  }

  function startListener(deviceId) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      console.warn('[ADMIN-CANDIDATE] Firebase belum siap');
      return;
    }
    stopListener();

    __cdRef = firebase.database().ref('sgs_state/sessions/' + deviceId);
    __cdCb = (snap) => {
      const data = snap.val() || {};
      renderContent(deviceId, data);
    };
    __cdRef.on('value', __cdCb);
  }

  function stopListener() {
    if (__cdRef && __cdCb) {
      try { __cdRef.off('value', __cdCb); } catch(e) {}
    }
    __cdRef = null;
    __cdCb = null;
  }

  /* ============================================================
     RENDER CONTENT
     ============================================================ */
  function renderContent(deviceId, s) {
    const headerName = document.getElementById('cdHeaderName');
    const headerBadge = document.getElementById('cdHeaderBadge');
    const content = document.getElementById('cdContent');
    if (!content) return;

    const safeName = s.name || '(tanpa nama)';
    if (headerName) headerName.textContent = safeName;

    const isFinished = s.finished === true;
    const isDisq = s.disqualified === true;
    const isActive = s.inTestView === true && !isFinished && !isDisq;

    let statusColor, statusLabel, statusDot;
    if (isDisq)         { statusColor = '#dc2626'; statusLabel = 'Diskualifikasi'; statusDot = '⚠️'; }
    else if (isFinished){ statusColor = '#94a3b8'; statusLabel = 'Selesai'; statusDot = '✅'; }
    else if (isActive)  { statusColor = '#22c55e'; statusLabel = 'Mengerjakan'; statusDot = '🟢'; }
    else                { statusColor = '#f59e0b'; statusLabel = 'Idle'; statusDot = '🟡'; }

    if (headerBadge) {
      headerBadge.innerHTML = `
        <div style="
          padding: 8px 14px; border-radius: 10px;
          background: ${statusColor}22;
          border: 1.5px solid ${statusColor}55;
          color: ${statusColor};
          font-size: 12px; font-weight: 800;
          display: inline-flex; align-items: center; gap: 6px;
        ">${statusDot} ${statusLabel}</div>
      `;
    }

    const ago = s.lastSeen ? Math.round((Date.now() - s.lastSeen) / 1000) : null;
    const agoStr = ago === null ? '-' :
                   ago < 60 ? `${ago}s lalu` :
                   ago < 3600 ? `${Math.floor(ago/60)}m lalu` :
                   ago < 86400 ? `${Math.floor(ago/3600)}j lalu` :
                   `${Math.floor(ago/86400)}h lalu`;

    const startedAgo = s.startedAt ? Math.round((Date.now() - s.startedAt) / 1000) : null;
    const startedStr = startedAgo === null ? '-' :
                       startedAgo < 60 ? `${startedAgo}s` :
                       startedAgo < 3600 ? `${Math.floor(startedAgo/60)}m` :
                       `${Math.floor(startedAgo/3600)}j ${Math.floor((startedAgo%3600)/60)}m`;

    const initial = safeName.split(/\s+/).slice(0,2).map(w => w[0] || '').join('').toUpperCase() || '?';
    const hash = safeName.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
    const colors = [
      ['#3b82f6', '#1e40af'], ['#8b5cf6', '#6d28d9'], ['#10b981', '#047857'],
      ['#f59e0b', '#b45309'], ['#ec4899', '#be185d'], ['#06b6d4', '#0e7490']
    ];
    const [c1, c2] = colors[hash % colors.length];

    const timeLeftStr = s.timeLeft != null ? cdFmtTime(s.timeLeft) : '-';
    const pct = Math.max(0, Math.min(100, s.progressPercent || 0));

    const subtestInfo = s.currentTest === 'IST' && s.currentSubtest != null && s.testTotalSubtests
      ? `Subtes ${(s.currentSubtest||0)+1}/${s.testTotalSubtests}` : '';
    const columnInfo = s.currentTest === 'KRAEPLIN' && s.currentColumn != null && s.testTotalColumns
      ? `Kolom ${(s.currentColumn||0)+1}/${s.testTotalColumns}` : '';
    const subInfo = subtestInfo || columnInfo;

    const completedCount = s.completedCount || 0;
    const totalTests = s.totalTests || 0;
    const progressTestPct = totalTests ? Math.round((completedCount/totalTests)*100) : 0;

    const testNames = ['IST','KRAEPLIN','DISC','PAPI','BIGFIVE','GRAFIS','EXCEL','TYPING','SUBJECT'];
    const testLabels = {
      IST:'Kecerdasan', KRAEPLIN:'Koran', DISC:'Kepemimpinan', PAPI:'Sikap Kerja',
      BIGFIVE:'Kepribadian', GRAFIS:'Gambar', EXCEL:'Excel', TYPING:'Mengetik', SUBJECT:'Subjek'
    };
    const completed = s.completed || {};

    let timelineHTML = '';
    testNames.forEach(t => {
      const isDone = completed[t] === true;
      const isCurrent = s.currentTest === t;
      let style, icon;
      if (isDone) {
        style = 'background: rgba(34,197,94,.08); border-color: rgba(34,197,94,.25);';
        icon = '✅';
      } else if (isCurrent) {
        style = 'background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.4);';
        icon = '🟢';
      } else {
        style = 'background: rgba(255,255,255,.03); border-color: rgba(255,255,255,.06);';
        icon = '⚪';
      }
      timelineHTML += `
        <div style="
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px;
          border: 1px solid transparent; ${style}
        ">
          <span style="font-size: 14px;">${icon}</span>
          <span style="font-weight: 700; font-size: 12px; color: ${isCurrent ? '#93c5fd' : (isDone ? '#86efac' : '#64748b')};">
            ${testLabels[t]}
          </span>
          ${isCurrent && subInfo ? `
            <span style="
              margin-left: auto; font-size: 10px; font-weight: 800;
              padding: 3px 8px; border-radius: 6px;
              background: rgba(59,130,246,.2); color: #93c5fd;
            ">${subInfo}</span>
          ` : ''}
        </div>
      `;
    });

    const safeNameAttr = safeName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    function statCard(icon, label, value, sub, color) {
      return `
        <div style="
          padding: 14px 16px;
          background: linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px;
        ">
          <div style="
            display: flex; align-items: center; gap: 8px;
            font-size: 10px; font-weight: 800;
            color: #94a3b8; text-transform: uppercase;
            letter-spacing: 1px; margin-bottom: 8px;
          "><span style="font-size: 14px;">${icon}</span> ${label}</div>
          <div style="font-size: 20px; font-weight: 900; color: ${color}; margin-bottom: 3px;">${value}</div>
          <div style="font-size: 10.5px; color: #64748b; font-weight: 600;">${sub}</div>
        </div>
      `;
    }

    content.innerHTML = `
      <!-- PROFILE -->
      <div style="
        display: flex; align-items: flex-start; gap: 18px;
        padding: 22px;
        background: linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.02));
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 18px; margin-bottom: 20px;
      ">
        <div style="
          width: 72px; height: 72px; flex: 0 0 72px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, ${c1}, ${c2});
          border-radius: 20px;
          font-size: 26px; font-weight: 900; color: #fff;
          box-shadow: 0 10px 24px ${c1}55;
        ">${initial}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 6px; word-break: break-word;">
            ${cdEscape(safeName)}
          </div>
          <div style="color: #94a3b8; font-size: 13px; line-height: 1.7;">
            ${s.position ? `💼 ${cdEscape(s.position)}<br>` : ''}
            ${s.ip ? `🌐 IP: <code style="background: rgba(255,255,255,.06); padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #93c5fd;">${cdEscape(s.ip)}</code><br>` : ''}
            📱 ID: <code style="background: rgba(255,255,255,.06); padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #cbd5e1;">${cdEscape(deviceId.slice(-12))}</code>
          </div>
        </div>
      </div>

      <!-- STATS -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 20px;">
        ${statCard('📊', 'Progress Tes', `${completedCount}/${totalTests}`, progressTestPct + '%', '#3b82f6')}
        ${statCard('⏱', 'Timer Sekarang', timeLeftStr, s.currentTest || '—', '#f59e0b')}
        ${statCard('🕐', 'Durasi Sesi', startedStr, 'Sejak mulai', '#8b5cf6')}
        ${statCard('👁', 'Aktivitas', agoStr, 'Terakhir', '#10b981')}
      </div>

      ${s.currentTest ? `
        <div style="
          padding: 18px 20px;
          background: linear-gradient(135deg, rgba(59,130,246,.1), rgba(139,92,246,.06));
          border: 1px solid rgba(59,130,246,.25);
          border-radius: 16px; margin-bottom: 20px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #93c5fd; text-transform: uppercase;">🎯 Sedang Mengerjakan</div>
            <div style="font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 999px; background: rgba(59,130,246,.2); color: #93c5fd;">
              ${s.currentTest}${subInfo ? ' · ' + subInfo : ''}
            </div>
          </div>
          <div style="font-size: 15px; font-weight: 700; color: #e2e8f0; margin-bottom: 10px;">
            ${s.questionLabel ? `Soal ${cdEscape(s.questionLabel)}` : 'Sedang berjalan…'}
          </div>
          <div style="height: 10px; background: rgba(255,255,255,.06); border-radius: 999px; overflow: hidden;">
            <div style="
              width: ${pct}%; height: 100%;
              background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
              border-radius: inherit;
              box-shadow: 0 0 12px rgba(59,130,246,.5);
            "></div>
          </div>
          <div style="text-align: right; margin-top: 6px; font-size: 11px; color: #64748b; font-weight: 700;">${pct}%</div>
        </div>
      ` : ''}

      <!-- TIMELINE -->
      <div style="
        padding: 20px;
        background: rgba(255,255,255,.02);
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 16px; margin-bottom: 20px;
      ">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #818cf8; margin-bottom: 14px;">📋 DAFTAR TES</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">${timelineHTML}</div>
      </div>

      <!-- ACTIONS -->
      <div style="
        padding: 20px;
        background: rgba(255,255,255,.02);
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 16px; margin-bottom: 20px;
      ">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #818cf8; margin-bottom: 14px;">⚡ AKSI CEPAT</div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="cd-btn cd-btn-primary" onclick="__cdActionChat('${deviceId}', '${safeNameAttr}')">💬 Buka Chat</button>
          <button class="cd-btn cd-btn-success" onclick="__cdActionAllowRetake('${deviceId}', '${safeNameAttr}')">✅ Izinkan Tes Lagi</button>
          <button class="cd-btn cd-btn-warning" onclick="__cdActionForceRefresh('${deviceId}')">🔄 Force Refresh</button>
          <button class="cd-btn cd-btn-danger" onclick="__cdActionDisqualify('${deviceId}', '${safeNameAttr}')">⚠️ Diskualifikasi</button>
          <button class="cd-btn cd-btn-danger" onclick="__cdActionForceLogout('${deviceId}', '${safeNameAttr}')">🚪 Force Logout</button>
        </div>
      </div>

      <!-- DANGER -->
      <div style="
        padding: 20px;
        background: rgba(239,68,68,.04);
        border: 1px solid rgba(239,68,68,.2);
        border-radius: 16px;
      ">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #fca5a5; margin-bottom: 14px;">🚨 ZONA BAHAYA</div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="cd-btn cd-btn-ghost" style="color: #fca5a5; border-color: rgba(239,68,68,.3);" onclick="__cdActionResetProgress('${deviceId}', '${safeNameAttr}')">🗑️ Reset Semua Progres</button>
          <button class="cd-btn cd-btn-ghost" style="color: #fca5a5; border-color: rgba(239,68,68,.3);" onclick="__cdActionDeleteSession('${deviceId}', '${safeNameAttr}')">❌ Hapus Sesi Ini</button>
        </div>
      </div>
    `;
  }

  /* ============================================================
     ACTIONS
     ============================================================ */
  function actionChat(deviceId, name) {
    closeCandidateDetailPage();
    if (typeof openChatForAdmin === 'function') openChatForAdmin(deviceId, name);
  }

  function actionAllowRetake(deviceId, name) {
    if (typeof adminAllowRetake === 'function') adminAllowRetake(deviceId, name);
    else alert('❌ Fungsi adminAllowRetake tidak tersedia');
  }

  function actionForceRefresh(deviceId) {
    if (!confirm('Force refresh device kandidat?\n\nHalaman kandidat akan dimuat ulang.')) return;
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    firebase.database().ref('sgs_state/sessions/' + deviceId).update({
      force_refresh: Date.now()
    }).then(() => cdToast('✅ Sinyal refresh terkirim'))
      .catch(e => alert('❌ Gagal: ' + e.message));
  }

  function actionDisqualify(deviceId, name) {
    const ok = confirm(
      `Diskualifikasi "${name}"?\n\n` +
      `• Device akan terkunci\n` +
      `• Kandidat tidak bisa melanjutkan tes\n` +
      `• Perlu "Izinkan Tes Lagi" untuk reset\n\n` +
      `Lanjutkan?`
    );
    if (!ok) return;
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    firebase.database().ref('sgs_state/sessions/' + deviceId).update({
      disqualified: true,
      disqualified_at: firebase.database.ServerValue.TIMESTAMP,
      disqualified_by: 'admin',
      finished: true
    }).then(() => cdToast('⚠️ Kandidat didiskualifikasi', '#dc2626'))
      .catch(e => alert('❌ Gagal: ' + e.message));
  }

  function actionForceLogout(deviceId, name) {
    const ok = confirm(
      `Force logout "${name}"?\n\n` +
      `• Device akan dikunci sementara\n` +
      `• Kandidat tidak bisa login lagi sampai di-unlock\n\n` +
      `Lanjutkan?`
    );
    if (!ok) return;
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    firebase.database().ref('sgs_state/sessions/' + deviceId).update({
      force_logout: Date.now(),
      force_logout_at: firebase.database.ServerValue.TIMESTAMP
    }).then(() => cdToast('🚪 Sinyal logout terkirim', '#dc2626'))
      .catch(e => alert('❌ Gagal: ' + e.message));
  }

  function actionResetProgress(deviceId, name) {
    const ok = confirm(
      `⚠️ Reset SEMUA progres "${name}"?\n\n` +
      `• Semua jawaban tes akan dihapus\n` +
      `• Identity tetap tersimpan\n` +
      `• Kandidat harus mulai dari awal lagi\n\n` +
      `Tindakan ini tidak bisa dibatalkan!\n\n` +
      `Lanjutkan?`
    );
    if (!ok) return;
    if (!confirm('Yakin? Ini akan menghapus semua jawaban.')) return;
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    firebase.database().ref('sgs_state/sessions/' + deviceId).update({
      reset_progress: Date.now(),
      completed: null,
      answers: null,
      currentTest: null,
      currentSubtest: null,
      currentQuestion: null,
      currentColumn: null,
      reset_at: firebase.database.ServerValue.TIMESTAMP,
      reset_by: 'admin'
    }).then(() => cdToast('🗑️ Progres di-reset', '#f59e0b'))
      .catch(e => alert('❌ Gagal: ' + e.message));
  }

  function actionDeleteSession(deviceId, name) {
    const ok = confirm(
      `❌ Hapus sesi "${name}"?\n\n` +
      `• Data sesi di Firebase akan dihapus\n` +
      `• Hasil tes yang sudah di-upload TIDAK terhapus\n\n` +
      `Lanjutkan?`
    );
    if (!ok) return;
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    firebase.database().ref('sgs_state/sessions/' + deviceId).remove()
      .then(() => {
        cdToast('✅ Sesi dihapus', '#dc2626');
        closeCandidateDetailPage();
      })
      .catch(e => alert('❌ Gagal: ' + e.message));
  }

  /* ============================================================
     RENDER ACTIVE SESSIONS — VERSI BARU (clickable card)
     ============================================================ */
  function renderActiveSessionsHTML_NEW(sessions) {
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return `
        <div style="
          padding: 14px; text-align: center;
          color: #94a3b8; font-size: 12px;
          background: #fff; border-radius: 10px;
        ">🌙 Belum ada kandidat yang aktif</div>`;
    }

    const escape = (typeof window.__adminEscape === 'function')
      ? window.__adminEscape
      : cdEscape;

    const fmtTime = (typeof window.__formatTimeAdmin === 'function')
      ? window.__formatTimeAdmin
      : cdFmtTime;

    return sessions.map(s => {
      const ago = s.lastSeen ? Math.round((Date.now() - s.lastSeen) / 1000) : null;
      const agoStr = ago === null ? '-' :
                     ago < 60 ? `${ago}s lalu` :
                     ago < 3600 ? `${Math.floor(ago/60)}m lalu` :
                     ago < 86400 ? `${Math.floor(ago/3600)}j lalu` :
                     `${Math.floor(ago/86400)}h lalu`;

      const testLabel = s.currentTest ? s.currentTest : '—';
      const progress = s.totalTests > 0
        ? `${s.completedCount}/${s.totalTests} tes`
        : '—';

      const subLabel = s.currentTest === 'IST' && s.currentSubtest !== null && s.testTotalSubtests
        ? `Subtes ${(s.currentSubtest || 0) + 1}/${s.testTotalSubtests}`
        : '';

      const isFinished = s.finished === true;
      const isDisqualified = s.disqualified === true;

      let statusColor, statusLabel;
      if (isDisqualified) {
        statusColor = '#dc2626'; statusLabel = '⚠️ Diskualifikasi';
      } else if (isFinished) {
        statusColor = '#94a3b8'; statusLabel = '✅ Selesai (Terkunci)';
      } else if (s.inTestView) {
        statusColor = '#16a34a'; statusLabel = '🟢 Mengerjakan';
      } else {
        statusColor = '#f59e0b'; statusLabel = '🟡 Idle';
      }

      const safeName = String(s.name || '(tanpa nama)')
        .replace(/\\/g, '\\\\').replace(/'/g, "\\'");

      const deviceIdShort = s.deviceId.slice(-8);

      const unreadCount = (window.__adminUnreadMap && window.__adminUnreadMap[s.deviceId]) || 0;
      const hasUnread = unreadCount > 0;

      const chatBtn = (isFinished || isDisqualified) ? `
        <button disabled title="${isDisqualified ? 'Kandidat diskualifikasi' : 'Kandidat sudah selesai'}" style="
          padding: 5px 12px;
          background: #e2e8f0; color: #94a3b8;
          border: 0; border-radius: 7px;
          font-size: 11px; font-weight: 800;
          cursor: not-allowed; font-family: inherit;
          white-space: nowrap;
        ">💬 Chat</button>
      ` : `
        <button onclick="event.stopPropagation(); openChatForAdmin('${s.deviceId}', '${safeName}')"
                class="${hasUnread ? 'chat-btn-blink' : ''}"
                style="
          padding: 5px 12px;
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          color: #fff; border: 0; border-radius: 7px;
          font-size: 11px; font-weight: 800;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 3px 8px rgba(59,130,246,.25);
          white-space: nowrap;
        ">💬 ${hasUnread ? 'Chat (' + unreadCount + ')' : 'Chat'}</button>
      `;

      const cardBg = isDisqualified
        ? 'linear-gradient(135deg, #fef2f2, #fee2e2)'
        : isFinished
        ? 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
        : '#fff';
      const cardBorder = isDisqualified ? '#fca5a5'
                       : isFinished ? '#cbd5e1'
                       : '#dbeafe';

      let timerProgressHTML = '';

      if (!isFinished && !isDisqualified && s.inTestView && s.currentTest) {
        const hasTimer = s.timeLeft !== null && s.timeLeft !== undefined;
        const timeLeftInit = hasTimer ? s.timeLeft : 0;
        const lastSeenOffset = s.lastSeen ? Math.round((Date.now() - s.lastSeen) / 1000) : 0;
        const estimatedTimeLeft = Math.max(0, timeLeftInit - lastSeenOffset);

        const timerHTML = hasTimer ? `
          <div style="
            display: inline-flex; align-items: center; gap: 5px;
            padding: 3px 9px; border-radius: 999px;
            background: ${estimatedTimeLeft <= 30 ? '#fee2e2' : '#dbeafe'};
            color: ${estimatedTimeLeft <= 30 ? '#991b1b' : '#1e40af'};
            font-size: 11px; font-weight: 800;
            font-family: 'Courier New', monospace;
          " data-timer-id="${s.deviceId}"
             data-time-left="${estimatedTimeLeft}"
             data-last-update="${Date.now()}">
            <span style="font-size: 12px;">⏱</span>
            <span class="timer-text">${fmtTime(estimatedTimeLeft)}</span>
          </div>
        ` : '';

        const pct = Math.max(0, Math.min(100, s.progressPercent || 0));

        timerProgressHTML = `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">
                ⏱ Sedang: ${testLabel}
              </span>
              ${timerHTML}
            </div>
            <div style="margin-top: 6px;">
              <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin-bottom: 3px;">
                <span>${s.questionLabel || 'Progress'}${subLabel ? ' · ' + subLabel : ''}</span>
                <span>${pct}%</span>
              </div>
              <div style="height: 5px; border-radius: 999px; overflow: hidden; background: #e2e8f0;">
                <div style="
                  width: ${pct}%; height: 100%;
                  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                  border-radius: inherit;
                "></div>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div
          onclick="openCandidateDetailPage('${s.deviceId}')"
          style="
            padding: 12px 14px; background: ${cardBg};
            border: 1px solid ${cardBorder}; border-radius: 10px;
            font-size: 12px; line-height: 1.5;
            cursor: pointer;
            transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
          "
          onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 10px 22px rgba(15,23,42,.1)';this.style.borderColor='#93c5fd';"
          onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';this.style.borderColor='${cardBorder}';"
        >
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
            <div style="font-weight: 800; color: #1e293b; min-width:0;">
              ${escape(s.name || '(tanpa nama)')}
            </div>
            <div style="font-size: 10px; color: ${statusColor}; font-weight: 800; white-space: nowrap;">
              ${statusLabel}
            </div>
          </div>

          <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
            ${s.position ? `📍 ${escape(s.position)} &nbsp;·&nbsp; ` : ''}
            📝 <b>${testLabel}</b> &nbsp;·&nbsp;
            ✅ ${progress}
          </div>
          ${(s.ip && !s.position) ? `
            <div style="color: #3b82f6; font-size: 11px; margin-bottom: 6px; font-family: 'Courier New', monospace;">
              🌐 IP: ${escape(s.ip)}
            </div>
          ` : ''}
          ${timerProgressHTML}

          <div style="
            display: flex; justify-content: space-between;
            align-items: center; gap: 8px; padding-top: 6px;
            border-top: 1px dashed #e2e8f0; flex-wrap: wrap;
            margin-top: 6px;
          ">
            <div style="color: #94a3b8; font-size: 10px;">
              ID: ${deviceIdShort} &nbsp;·&nbsp; 👁 ${agoStr}
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              <span style="
                font-size: 10px; font-weight: 800; color: #3b82f6;
                padding: 3px 8px; border-radius: 999px;
                background: rgba(59,130,246,.1);
                border: 1px solid rgba(59,130,246,.2);
                white-space: nowrap;
              ">🔍 Detail →</span>
              ${chatBtn}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ============================================================
     SELF-REGISTER: OVERRIDE renderActiveSessionsHTML
     ============================================================ */
  function tryRegister() {
    if (typeof window.renderActiveSessionsHTML !== 'function') {
      console.warn('[ADMIN-CANDIDATE] renderActiveSessionsHTML belum siap, retry 300ms…');
      setTimeout(tryRegister, 300);
      return;
    }

    const currentSrc = window.renderActiveSessionsHTML.toString();
    if (currentSrc.includes('openCandidateDetailPage')) {
      console.log('[ADMIN-CANDIDATE] ✓ Sudah versi baru, skip override');
      return;
    }

    window.renderActiveSessionsHTML = renderActiveSessionsHTML_NEW;
    console.log('[ADMIN-CANDIDATE] ✓ renderActiveSessionsHTML berhasil di-override');
  }

  /* ============================================================
     EXPORT KE WINDOW (untuk onclick inline)
     ============================================================ */
  window.openCandidateDetailPage = openCandidateDetailPage;
  window.closeCandidateDetailPage = closeCandidateDetailPage;
  window.__cdActionChat = actionChat;
  window.__cdActionAllowRetake = actionAllowRetake;
  window.__cdActionForceRefresh = actionForceRefresh;
  window.__cdActionDisqualify = actionDisqualify;
  window.__cdActionForceLogout = actionForceLogout;
  window.__cdActionResetProgress = actionResetProgress;
  window.__cdActionDeleteSession = actionDeleteSession;
  window.__renderActiveSessionsHTML_NEW = renderActiveSessionsHTML_NEW;

  /* ============================================================
     INIT
     ============================================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(tryRegister, 500));
  } else {
    setTimeout(tryRegister, 500);
  }

  console.log('[ADMIN-CANDIDATE] ✓ Loaded (self-register)');
})();
