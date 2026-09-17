/* ============================================================
   js/00c-admin-candidate.js
   - Halaman detail kandidat aktif (admin)
   - Real-time: status, progress, timer, test timeline
   - Aksi: chat, allow retake, disqualify, force logout,
           reset progress, delete session, force refresh
   ============================================================ */

let __candidateDetailRef = null;
let __candidateDetailCb = null;
let __candidateDetailDeviceId = null;

function openCandidateDetailPage(deviceId) {
  if (!deviceId) return;
  __candidateDetailDeviceId = deviceId;

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
    animation: candidateDetailIn 0.28s cubic-bezier(.2,.8,.2,1);
    overflow: hidden;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes candidateDetailIn {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes candidateCardIn {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes resultSpinner { to { transform: rotate(360deg); } }
      .cd-scroll::-webkit-scrollbar { width: 8px; }
      .cd-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,.03); }
      .cd-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 4px; }
      .cd-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.25); }

      .cd-btn {
        padding: 10px 16px; border-radius: 10px; border: 0;
        font-family: inherit; font-size: 13px; font-weight: 800;
        cursor: pointer; transition: all .18s ease;
        display: inline-flex; align-items: center; gap: 8px;
      }
      .cd-btn:hover { transform: translateY(-1px); }
      .cd-btn:active { transform: translateY(0) scale(.98); }
      .cd-btn-primary {
        background: linear-gradient(135deg, #3b82f6, #1e40af);
        color: #fff; box-shadow: 0 4px 14px rgba(59,130,246,.3);
      }
      .cd-btn-success {
        background: linear-gradient(135deg, #16a34a, #059669);
        color: #fff; box-shadow: 0 4px 14px rgba(22,163,74,.3);
      }
      .cd-btn-warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #fff; box-shadow: 0 4px 14px rgba(245,158,11,.3);
      }
      .cd-btn-danger {
        background: linear-gradient(135deg, #dc2626, #991b1b);
        color: #fff; box-shadow: 0 4px 14px rgba(220,38,38,.3);
      }
      .cd-btn-ghost {
        background: rgba(255,255,255,.06);
        color: #cbd5e1;
        border: 1.5px solid rgba(255,255,255,.12);
      }
      .cd-btn-ghost:hover { background: rgba(255,255,255,.1); color: #fff; }
    </style>

    <!-- HEADER -->
    <div style="
      padding: 20px 28px;
      background: linear-gradient(180deg, rgba(0,0,0,.25), transparent);
      border-bottom: 1px solid rgba(255,255,255,.08);
      display: flex; align-items: center; gap: 18px;
      flex-wrap: wrap;
    ">
      <button id="cdBackBtn" class="cd-btn cd-btn-ghost" style="width:44px;height:44px;padding:0;justify-content:center;font-size:18px;">←</button>
      <div style="flex: 1; min-width: 0;">
        <div style="
          font-size: 11px; font-weight: 800;
          letter-spacing: 2px; color: #818cf8; margin-bottom: 4px;
        ">ADMIN · DETAIL KANDIDAT</div>
        <div id="cdHeaderName" style="font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -.3px;">
          Memuat...
        </div>
      </div>
      <div id="cdHeaderBadge"></div>
    </div>

    <!-- CONTENT -->
    <div class="cd-scroll" id="cdContent" style="
      flex: 1; overflow-y: auto;
      padding: 24px 28px 40px;
    ">
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
          animation: resultSpinner .8s linear infinite;
        "></div>
        Memuat data kandidat...
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('cdBackBtn').onclick = closeCandidateDetailPage;
  startCandidateDetailListener(deviceId);
}

function closeCandidateDetailPage() {
  stopCandidateDetailListener();
  const overlay = document.getElementById('candidateDetailOverlay');
  if (overlay) overlay.remove();
  __candidateDetailDeviceId = null;
}

function startCandidateDetailListener(deviceId) {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  stopCandidateDetailListener();

  __candidateDetailRef = firebase.database().ref('sgs_state/sessions/' + deviceId);
  __candidateDetailCb = (snap) => {
    const data = snap.val() || {};
    renderCandidateDetailContent(deviceId, data);
  };
  __candidateDetailRef.on('value', __candidateDetailCb);
}

function stopCandidateDetailListener() {
  if (__candidateDetailRef && __candidateDetailCb) {
    try { __candidateDetailRef.off('value', __candidateDetailCb); } catch(e) {}
  }
  __candidateDetailRef = null;
  __candidateDetailCb = null;
}

function renderCandidateDetailContent(deviceId, s) {
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
  if (isDisq)        { statusColor = '#dc2626'; statusLabel = 'Diskualifikasi'; statusDot = '⚠️'; }
  else if (isFinished){ statusColor = '#94a3b8'; statusLabel = 'Selesai'; statusDot = '✅'; }
  else if (isActive) { statusColor = '#22c55e'; statusLabel = 'Mengerjakan'; statusDot = '🟢'; }
  else               { statusColor = '#f59e0b'; statusLabel = 'Idle'; statusDot = '🟡'; }

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

  const lastSeenAgo = s.lastSeen ? Math.round((Date.now() - s.lastSeen) / 1000) : null;
  const lastSeenStr = lastSeenAgo === null ? '-' :
                      lastSeenAgo < 60 ? `${lastSeenAgo}s lalu` :
                      lastSeenAgo < 3600 ? `${Math.floor(lastSeenAgo/60)}m lalu` :
                      lastSeenAgo < 86400 ? `${Math.floor(lastSeenAgo/3600)}j lalu` :
                      `${Math.floor(lastSeenAgo/86400)}h lalu`;

  const startedAgo = s.startedAt ? Math.round((Date.now() - s.startedAt) / 1000) : null;
  const startedStr = startedAgo === null ? '-' :
                     startedAgo < 60 ? `${startedAgo}s` :
                     startedAgo < 3600 ? `${Math.floor(startedAgo/60)}m` :
                     `${Math.floor(startedAgo/3600)}j ${Math.floor((startedAgo%3600)/60)}m`;

  const initial = safeName.split(/\s+/).slice(0,2).map(w => w[0] || '').join('').toUpperCase() || '?';
  const hash = safeName.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
  const avatarColors = [
    ['#3b82f6', '#1e40af'], ['#8b5cf6', '#6d28d9'], ['#10b981', '#047857'],
    ['#f59e0b', '#b45309'], ['#ec4899', '#be185d'], ['#06b6d4', '#0e7490']
  ];
  const [c1, c2] = avatarColors[hash % avatarColors.length];

  const timeLeftStr = s.timeLeft != null ? formatTimeAdmin(s.timeLeft) : '-';
  const progressPct = Math.max(0, Math.min(100, s.progressPercent || 0));

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

  let testTimelineHTML = '';
  testNames.forEach(t => {
    const isDone = completed[t] === true;
    const isCurrent = s.currentTest === t;
    let rowStyle, icon;
    if (isDone) {
      rowStyle = 'background: rgba(34,197,94,.08); border-color: rgba(34,197,94,.25);';
      icon = '✅';
    } else if (isCurrent) {
      rowStyle = 'background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.4);';
      icon = '🟢';
    } else {
      rowStyle = 'background: rgba(255,255,255,.03); border-color: rgba(255,255,255,.06);';
      icon = '⚪';
    }
    testTimelineHTML += `
      <div style="
        display: flex; align-items: center; gap: 10px;
        padding: 10px 12px; border-radius: 10px;
        border: 1px solid transparent;
        ${rowStyle}
        transition: all .2s ease;
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

  content.innerHTML = `
    <!-- PROFILE CARD -->
    <div style="
      display: flex; align-items: flex-start; gap: 18px;
      padding: 22px;
      background: linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.02));
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 18px;
      margin-bottom: 20px;
      animation: candidateCardIn .3s ease;
    ">
      <div style="
        width: 72px; height: 72px; flex: 0 0 72px;
        display: grid; place-items: center;
        background: linear-gradient(135deg, ${c1}, ${c2});
        border-radius: 20px;
        font-size: 26px; font-weight: 900; color: #fff;
        letter-spacing: -.5px;
        box-shadow: 0 10px 24px ${c1}55;
      ">${initial}</div>

      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 6px; word-break: break-word;">
          ${__cdEscape(safeName)}
        </div>
        <div style="color: #94a3b8; font-size: 13px; line-height: 1.7;">
          ${s.position ? `💼 ${__cdEscape(s.position)}<br>` : ''}
          ${s.ip ? `🌐 IP: <code style="
            background: rgba(255,255,255,.06); padding: 2px 6px;
            border-radius: 4px; font-size: 12px; color: #93c5fd;
          ">${__cdEscape(s.ip)}</code><br>` : ''}
          📱 ID: <code style="
            background: rgba(255,255,255,.06); padding: 2px 6px;
            border-radius: 4px; font-size: 12px; color: #cbd5e1;
          ">${__cdEscape(deviceId.slice(-12))}</code>
        </div>
      </div>
    </div>

    <!-- STATS GRID -->
    <div style="
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    ">
      ${__cdStatCard('📊', 'Progress Tes', `${completedCount}/${totalTests}`, progressTestPct + '%', '#3b82f6')}
      ${__cdStatCard('⏱', 'Timer Sekarang', timeLeftStr, s.currentTest || '—', '#f59e0b')}
      ${__cdStatCard('🕐', 'Durasi Sesi', startedStr, 'Sejak mulai', '#8b5cf6')}
      ${__cdStatCard('👁', 'Aktivitas', lastSeenStr, 'Terakhir', '#10b981')}
    </div>

    <!-- CURRENT TEST PROGRESS -->
    ${s.currentTest ? `
      <div style="
        padding: 18px 20px;
        background: linear-gradient(135deg, rgba(59,130,246,.1), rgba(139,92,246,.06));
        border: 1px solid rgba(59,130,246,.25);
        border-radius: 16px;
        margin-bottom: 20px;
        animation: candidateCardIn .3s ease;
      ">
        <div style="
          display: flex; justify-content: space-between;
          align-items: center; gap: 10px;
          margin-bottom: 12px; flex-wrap: wrap;
        ">
          <div style="
            font-size: 11px; font-weight: 800;
            letter-spacing: 1.5px; color: #93c5fd;
            text-transform: uppercase;
          ">🎯 Sedang Mengerjakan</div>
          <div style="
            font-size: 12px; font-weight: 800;
            padding: 4px 10px; border-radius: 999px;
            background: rgba(59,130,246,.2); color: #93c5fd;
          ">${s.currentTest}${subInfo ? ' · ' + subInfo : ''}</div>
        </div>

        <div style="
          font-size: 15px; font-weight: 700;
          color: #e2e8f0; margin-bottom: 10px;
        ">
          ${s.questionLabel ? `Soal ${__cdEscape(s.questionLabel)}` : 'Sedang berjalan…'}
        </div>

        <div style="
          height: 10px; background: rgba(255,255,255,.06);
          border-radius: 999px; overflow: hidden;
        ">
          <div style="
            width: ${progressPct}%; height: 100%;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
            border-radius: inherit;
            transition: width .3s ease;
            box-shadow: 0 0 12px rgba(59,130,246,.5);
          "></div>
        </div>
        <div style="
          text-align: right; margin-top: 6px;
          font-size: 11px; color: #64748b; font-weight: 700;
        ">${progressPct}%</div>
      </div>
    ` : ''}

    <!-- TEST TIMELINE -->
    <div style="
      padding: 20px;
      background: rgba(255,255,255,.02);
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 16px;
      margin-bottom: 20px;
    ">
      <div style="
        font-size: 11px; font-weight: 800;
        letter-spacing: 1.5px; color: #818cf8;
        margin-bottom: 14px;
      ">📋 DAFTAR TES</div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${testTimelineHTML}
      </div>
    </div>

    <!-- ACTIONS -->
    <div style="
      padding: 20px;
      background: rgba(255,255,255,.02);
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 16px;
      margin-bottom: 20px;
    ">
      <div style="
        font-size: 11px; font-weight: 800;
        letter-spacing: 1.5px; color: #818cf8;
        margin-bottom: 14px;
      ">⚡ AKSI CEPAT</div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="cd-btn cd-btn-primary" onclick="__cdActionChat('${deviceId}', '${safeNameAttr}')">💬 Buka Chat</button>
        <button class="cd-btn cd-btn-success" onclick="__cdActionAllowRetake('${deviceId}', '${safeNameAttr}')">✅ Izinkan Tes Lagi</button>
        <button class="cd-btn cd-btn-warning" onclick="__cdActionForceRefresh('${deviceId}')">🔄 Force Refresh</button>
        <button class="cd-btn cd-btn-danger" onclick="__cdActionDisqualify('${deviceId}', '${safeNameAttr}')">⚠️ Diskualifikasi</button>
        <button class="cd-btn cd-btn-danger" onclick="__cdActionForceLogout('${deviceId}', '${safeNameAttr}')">🚪 Force Logout</button>
      </div>
    </div>

    <!-- DANGER ZONE -->
    <div style="
      padding: 20px;
      background: rgba(239,68,68,.04);
      border: 1px solid rgba(239,68,68,.2);
      border-radius: 16px;
    ">
      <div style="
        font-size: 11px; font-weight: 800;
        letter-spacing: 1.5px; color: #fca5a5;
        margin-bottom: 14px;
      ">🚨 ZONA BAHAYA</div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="cd-btn cd-btn-ghost" style="color: #fca5a5; border-color: rgba(239,68,68,.3);" onclick="__cdActionResetProgress('${deviceId}', '${safeNameAttr}')">🗑️ Reset Semua Progres</button>
        <button class="cd-btn cd-btn-ghost" style="color: #fca5a5; border-color: rgba(239,68,68,.3);" onclick="__cdActionDeleteSession('${deviceId}', '${safeNameAttr}')">❌ Hapus Sesi Ini</button>
      </div>
    </div>
  `;
}

function __cdEscape(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function __cdStatCard(icon, label, value, sub, color) {
  return `
    <div style="
      padding: 14px 16px;
      background: linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 14px;
      animation: candidateCardIn .3s ease;
    ">
      <div style="
        display: flex; align-items: center; gap: 8px;
        font-size: 10px; font-weight: 800;
        color: #94a3b8; text-transform: uppercase;
        letter-spacing: 1px; margin-bottom: 8px;
      ">
        <span style="font-size: 14px;">${icon}</span> ${label}
      </div>
      <div style="
        font-size: 20px; font-weight: 900;
        color: ${color}; margin-bottom: 3px;
        letter-spacing: -.5px;
      ">${value}</div>
      <div style="font-size: 10.5px; color: #64748b; font-weight: 600;">${sub}</div>
    </div>
  `;
}

/* ============================================================
   ACTIONS
   ============================================================ */
function __cdActionChat(deviceId, name) {
  closeCandidateDetailPage();
  if (typeof openChatForAdmin === 'function') {
    openChatForAdmin(deviceId, name);
  }
}

function __cdActionAllowRetake(deviceId, name) {
  if (typeof adminAllowRetake === 'function') {
    adminAllowRetake(deviceId, name);
  } else {
    alert('❌ Fungsi adminAllowRetake tidak tersedia');
  }
}

function __cdToast(msg, color = '#16a34a') {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `
    position: fixed; bottom: 24px; right: 24px;
    padding: 12px 18px; border-radius: 10px;
    background: ${color}; color: #fff; font-weight: 800;
    font-size: 13px; z-index: 2147483647;
    box-shadow: 0 10px 26px ${color}55;
    animation: candidateDetailIn .25s ease;
    font-family: Inter, system-ui, sans-serif;
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

function __cdActionForceRefresh(deviceId) {
  if (!confirm('Force refresh device kandidat?\n\nHalaman kandidat akan dimuat ulang.')) return;
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;

  firebase.database().ref('sgs_state/sessions/' + deviceId).update({
    force_refresh: Date.now()
  }).then(() => {
    __cdToast('✅ Sinyal refresh terkirim');
  }).catch(e => alert('❌ Gagal: ' + e.message));
}

function __cdActionDisqualify(deviceId, name) {
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
  }).then(() => {
    __cdToast('⚠️ Kandidat didiskualifikasi', '#dc2626');
  }).catch(e => alert('❌ Gagal: ' + e.message));
}

function __cdActionForceLogout(deviceId, name) {
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
  }).then(() => {
    __cdToast('🚪 Sinyal logout terkirim', '#dc2626');
  }).catch(e => alert('❌ Gagal: ' + e.message));
}

function __cdActionResetProgress(deviceId, name) {
  const ok = confirm(
    `⚠️ Reset SEMUA progres "${name}"?\n\n` +
    `• Semua jawaban tes akan dihapus\n` +
    `• Identity tetap tersimpan\n` +
    `• Kandidat harus mulai dari awal lagi\n\n` +
    `Tindakan ini tidak bisa dibatalkan!\n\n` +
    `Lanjutkan?`
  );
  if (!ok) return;

  const confirmed = confirm('Yakin? Ini akan menghapus semua jawaban.');
  if (!confirmed) return;

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
  }).then(() => {
    __cdToast('🗑️ Progres di-reset', '#f59e0b');
  }).catch(e => alert('❌ Gagal: ' + e.message));
}

function __cdActionDeleteSession(deviceId, name) {
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
      __cdToast('✅ Sesi dihapus', '#dc2626');
      closeCandidateDetailPage();
    })
    .catch(e => alert('❌ Gagal: ' + e.message));
}

window.openCandidateDetailPage = openCandidateDetailPage;
window.closeCandidateDetailPage = closeCandidateDetailPage;
window.__cdActionChat = __cdActionChat;
window.__cdActionAllowRetake = __cdActionAllowRetake;
window.__cdActionForceRefresh = __cdActionForceRefresh;
window.__cdActionDisqualify = __cdActionDisqualify;
window.__cdActionForceLogout = __cdActionForceLogout;
window.__cdActionResetProgress = __cdActionResetProgress;
window.__cdActionDeleteSession = __cdActionDeleteSession;

console.log('[ADMIN-CANDIDATE] ✓ Loaded');
