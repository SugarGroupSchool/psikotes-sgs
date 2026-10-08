/* ============================================================
   js/00p-fgd-admin.js
   ------------------------------------------------------------
   Admin panel: tombol + modal untuk generate link FGD
   
   - Tombol "🎯 FGD" di kartu kandidat (setelah Wawancara, Grafis)
   - Modal: pilih 2-4 asesor → generate link per asesor
   - Copy all links atau copy per asesor
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     KONFIGURASI
     ============================================================ */
  const ASSESSOR_LIST = ['NUG', 'GUN', 'DED', 'DEF', 'NET', 'YAC', 'ALF'];

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ============================================================
     MODAL — PILIH ASESOR & GENERATE LINK
     ============================================================ */
  window.openFgdLink = function (candidateName, candidatePosition) {
    const base = window.location.origin + window.location.pathname;

    function buildLink(iv) {
      return base + '?fgd=1'
        + '&n=' + encodeURIComponent(candidateName)
        + '&p=' + encodeURIComponent(candidatePosition || '')
        + (iv ? '&iv=' + encodeURIComponent(iv) : '');
    }

    const old = document.getElementById('fgdLinkModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'fgdLinkModal';
    modal.style.cssText = `position: fixed; inset: 0; z-index: 2147483647;
      background: rgba(10,20,35,.85); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; padding: 20px;
      font-family: Inter, system-ui, -apple-system, sans-serif;`;

    document.body.appendChild(modal);

    /* ----- STEP 1: pilih asesor ----- */
    function renderStep1() {
      modal.innerHTML = `
        <div style="width: min(560px, 100%); background: #fff; border-radius: 22px;
          overflow: hidden; box-shadow: 0 30px 90px rgba(0,0,0,.5);">
          <div style="padding: 24px 26px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; opacity: .85; margin-bottom: 6px;">
              FORM PENILAIAN FGD
            </div>
            <div style="font-size: 20px; font-weight: 900;">🎯 Pilih Asesor FGD</div>
          </div>
          <div style="padding: 22px 26px;">
            <div style="padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0;
              border-radius: 12px; margin-bottom: 18px;">
              <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1px; margin-bottom: 6px;">
                KANDIDAT
              </div>
              <div style="font-size: 14px; font-weight: 800; color: #1e293b;">${escapeHtml(candidateName)}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                💼 ${escapeHtml(candidatePosition || '(tanpa posisi)')}
              </div>
            </div>

            <div style="font-size: 12px; font-weight: 800; color: #475569; letter-spacing: 1px; margin-bottom: 10px;">
              PILIH ASESOR (2-4 asesor)
            </div>

            <div id="fgdPickList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
              gap: 8px; margin-bottom: 20px;">
              ${ASSESSOR_LIST.map(n => `
                <label class="fgd-pick-item" data-val="${n}"
                  style="display: flex; align-items: center; gap: 8px; padding: 12px 14px;
                    background: #fff; border: 2px solid #e2e8f0; border-radius: 10px;
                    cursor: pointer; font-size: 14px; font-weight: 800; color: #1e293b;
                    user-select: none; transition: all .15s ease;">
                  <input type="checkbox" value="${n}" style="width: 16px; height: 16px; accent-color: #3b82f6; cursor: pointer;">
                  <span>${n}</span>
                </label>
              `).join('')}
            </div>

            <div id="fgdPickInfo" style="font-size: 12px; color: #64748b; margin-bottom: 14px; text-align: center;">
              Belum ada asesor dipilih
            </div>

            <div style="display: flex; gap: 10px;">
              <button id="fgdGenBtn" disabled
                style="flex: 2; padding: 14px; border: 0; border-radius: 12px;
                  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
                  color: #fff; font-family: inherit; font-size: 14px; font-weight: 900;
                  cursor: not-allowed; opacity: .5; box-shadow: 0 10px 24px rgba(30,58,138,.28);">
                🔗 Generate Link
              </button>
              <button id="fgdCloseBtn"
                style="flex: 1; padding: 14px; border: 0; border-radius: 12px;
                  background: #f1f5f9; color: #475569;
                  font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer;">
                Tutup
              </button>
            </div>
          </div>
        </div>
      `;

      modal.querySelectorAll('.fgd-pick-item').forEach(lbl => {
        lbl.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') {
            const cb = lbl.querySelector('input');
            cb.checked = !cb.checked;
          }
          setTimeout(updatePickState, 0);
        });
        const cb = lbl.querySelector('input');
        cb.addEventListener('change', updatePickState);
      });

      document.getElementById('fgdGenBtn').onclick = () => {
        const picked = getChecked();
        if (picked.length < 2) {
          alert('Pilih minimal 2 asesor.');
          return;
        }
        renderStep2(picked);
      };

      document.getElementById('fgdCloseBtn').onclick = () => modal.remove();
    }

    function getChecked() {
      const checked = [];
      modal.querySelectorAll('#fgdPickList input[type="checkbox"]:checked').forEach(cb => {
        checked.push(cb.value);
      });
      return checked;
    }

    function updatePickState() {
      const picked = getChecked();
      const infoEl = document.getElementById('fgdPickInfo');
      const btn = document.getElementById('fgdGenBtn');

      modal.querySelectorAll('.fgd-pick-item').forEach(lbl => {
        const cb = lbl.querySelector('input');
        if (cb.checked) {
          lbl.style.background = '#eff6ff';
          lbl.style.borderColor = '#3b82f6';
          lbl.style.color = '#1e40af';
        } else {
          lbl.style.background = '#fff';
          lbl.style.borderColor = '#e2e8f0';
          lbl.style.color = '#1e293b';
        }
      });

      if (picked.length === 0) {
        infoEl.textContent = 'Belum ada asesor dipilih';
        infoEl.style.color = '#64748b';
        btn.disabled = true;
        btn.style.opacity = '.5';
        btn.style.cursor = 'not-allowed';
      } else if (picked.length < 2) {
        infoEl.innerHTML = `<b style="color:#dc2626;">${picked.length} asesor dipilih</b> — minimal 2 asesor`;
        infoEl.style.color = '#dc2626';
        btn.disabled = true;
        btn.style.opacity = '.5';
        btn.style.cursor = 'not-allowed';
      } else {
        infoEl.innerHTML = `<b style="color:#1e40af;">${picked.length} asesor</b> dipilih: <b>${picked.join(', ')}</b>`;
        infoEl.style.color = '#475569';
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
    }

    /* ----- STEP 2: tampilkan link ----- */
    function renderStep2(picked) {
      const links = picked.map(iv => ({ asesor: iv, url: buildLink(iv) }));

      modal.innerHTML = `
        <div style="width: min(640px, 100%); background: #fff; border-radius: 22px;
          overflow: hidden; box-shadow: 0 30px 90px rgba(0,0,0,.5);">
          <div style="padding: 24px 26px; background: linear-gradient(135deg, #065f46, #16a34a); color: #fff;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; opacity: .85; margin-bottom: 6px;">
              LINK SIAP
            </div>
            <div style="font-size: 20px; font-weight: 900;">✅ ${links.length} Link FGD Dibuat</div>
            <div style="font-size: 12px; opacity: .9; margin-top: 4px;">
              Kirim setiap link ke asesor yang sesuai.
            </div>
          </div>
          <div style="padding: 22px 26px;">
            <div style="padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0;
              border-radius: 12px; margin-bottom: 18px;">
              <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1px; margin-bottom: 6px;">
                KANDIDAT
              </div>
              <div style="font-size: 14px; font-weight: 800; color: #1e293b;">${escapeHtml(candidateName)}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                💼 ${escapeHtml(candidatePosition || '(tanpa posisi)')}
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px;
              max-height: 340px; overflow-y: auto;">
              ${links.map(l => `
                <div style="padding: 12px 14px; background: #f0f9ff;
                  border: 1px solid #bae6fd; border-radius: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-size: 13px; font-weight: 900; color: #075985;">
                      👤 Asesor: <span style="background:#fff;padding:3px 10px;border-radius:6px;">${escapeHtml(l.asesor)}</span>
                    </div>
                    <button class="fgd-copy-link" data-url="${l.url}"
                      style="padding: 6px 12px; border: 0; border-radius: 7px;
                        background: #0ea5e9; color: #fff; font-family: inherit;
                        font-size: 11px; font-weight: 800; cursor: pointer;">
                      📋 Copy
                    </button>
                  </div>
                  <input type="text" readonly value="${l.url}"
                    style="width: 100%; padding: 9px 11px; background: #fff;
                      border: 1px solid #cbd5e1; border-radius: 8px;
                      font-family: 'Courier New', monospace; font-size: 11px; color: #334155;
                      outline: none; box-sizing: border-box;">
                </div>
              `).join('')}
            </div>

            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button id="fgdCopyAllBtn"
                style="flex: 2; padding: 14px; border: 0; border-radius: 12px;
                  background: linear-gradient(135deg, #065f46, #16a34a);
                  color: #fff; font-family: inherit; font-size: 14px; font-weight: 900;
                  cursor: pointer; box-shadow: 0 10px 24px rgba(5,150,105,.28);">
                📋 Copy Semua Link
              </button>
              <button id="fgdBackBtn"
                style="flex: 1; padding: 14px; border: 2px solid #cbd5e1; border-radius: 12px;
                  background: #fff; color: #475569;
                  font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer;">
                ← Kembali
              </button>
              <button id="fgdDoneBtn"
                style="flex: 1; padding: 14px; border: 0; border-radius: 12px;
                  background: #f1f5f9; color: #475569;
                  font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer;">
                Tutup
              </button>
            </div>
          </div>
        </div>
      `;

      modal.querySelectorAll('.fgd-copy-link').forEach(btn => {
        btn.onclick = () => {
          const u = btn.getAttribute('data-url');
          try {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(u).then(() => {
                const prev = btn.textContent;
                btn.textContent = '✅ Tersalin';
                setTimeout(() => { btn.textContent = prev; }, 1500);
              });
            } else {
              fallbackCopy(u);
            }
          } catch (e) { fallbackCopy(u); }
        };
      });

      document.getElementById('fgdCopyAllBtn').onclick = () => {
        const allText = links.map(l => `${l.asesor}: ${l.url}`).join('\n\n');
        try {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(allText).then(() => {
              const btn = document.getElementById('fgdCopyAllBtn');
              const prev = btn.textContent;
              btn.textContent = '✅ Semua Tersalin';
              setTimeout(() => { btn.textContent = prev; }, 1800);
            });
          } else {
            fallbackCopy(allText);
          }
        } catch (e) { fallbackCopy(allText); }
      };

      document.getElementById('fgdBackBtn').onclick = renderStep1;
      document.getElementById('fgdDoneBtn').onclick = () => modal.remove();
    }

    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }

    renderStep1();
  };

  /* ============================================================
     AUTO-INJECT TOMBOL FGD DI KARTU KANDIDAT
     ------------------------------------------------------------
     Cari tombol .js-grafindo-link → tambahkan FGD setelahnya.
     Pakai MutationObserver supaya bekerja juga untuk kartu baru
     (yang di-render dinamis oleh admin panel).
     ============================================================ */
  function injectFgdButton() {
    const grafisBtns = document.querySelectorAll('.js-grafindo-link');
    grafisBtns.forEach(grafisBtn => {
      // Skip kalau sudah ada FGD button di sebelahnya
      if (grafisBtn.parentElement.querySelector('.js-fgd-link')) return;

      const name = grafisBtn.getAttribute('data-name');
      const position = grafisBtn.getAttribute('data-position');

      const fgdBtn = document.createElement('button');
      fgdBtn.className = 'js-fgd-link';
      fgdBtn.setAttribute('data-name', name);
      fgdBtn.setAttribute('data-position', position);
      fgdBtn.style.cssText = `padding: 4px 10px; border-radius: 999px;
        border: 1px solid rgba(59,130,246,.5);
        background: rgba(59,130,246,.15);
        color: #93c5fd; font-size: 10px; font-weight: 800;
        cursor: pointer; font-family: inherit; white-space: nowrap;`;
      fgdBtn.textContent = '🎯 FGD';
      fgdBtn.title = 'Buka form penilaian FGD untuk kandidat ini';

      grafisBtn.insertAdjacentElement('afterend', fgdBtn);
    });
  }

  /* Event delegation untuk tombol FGD */
  document.addEventListener('click', function (e) {
    const fgdBtn = e.target.closest('.js-fgd-link');
    if (fgdBtn) {
      e.preventDefault();
      e.stopPropagation();
      const name = fgdBtn.getAttribute('data-name');
      const position = fgdBtn.getAttribute('data-position');
      if (name && typeof window.openFgdLink === 'function') {
        window.openFgdLink(name, position);
      }
      return;
    }
  }, true);

  /* MutationObserver: detect saat admin panel render ulang */
  function startObserver() {
    if (window.__fgdAdminObserver) return;
    window.__fgdAdminObserver = new MutationObserver(() => {
      injectFgdButton();
    });
    window.__fgdAdminObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    // Initial run
    injectFgdButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(startObserver, 500));
  } else {
    setTimeout(startObserver, 500);
  }

  console.log('[FGD-ADMIN] ✓ Loaded — tombol FGD auto-inject di kartu kandidat');
})();