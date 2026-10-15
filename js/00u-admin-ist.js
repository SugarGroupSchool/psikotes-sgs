/* ============================================================
   js/00u-admin-ist.js — v2 (Section di Hasil Tes + Modal + PDF)
   ------------------------------------------------------------
   - Baca data dari sgs_scores/{slug} (auto-push dari kandidat)
   - renderISTSectionHTML() → card di area "Hasil Tes" folder overlay
   - openISTModal()        → modal 9 subtes + analisis posisi
   - generateISTPDF()      → PDF ringkas on-demand (no chart)
   - fetchISTData()        → expose untuk async render di 00b
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     HELPERS
     ============================================================ */
  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function fbReady() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
  }
  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    const n = Number(v);
    return isFinite(n) ? n : 0;
  }
  function slugifyDashed(name) {
    return String(name || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  }

  /* ============================================================
     FETCH: coba spaced-slug & dashed-slug (kompatibel)
     ============================================================ */
  async function fetchISTData(slug) {
    if (!fbReady()) return null;
    const dashed = slugifyDashed(slug);
    const candidates = [slug, dashed].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const s of candidates) {
      try {
        const snap = await firebase.database().ref('sgs_scores/' + s).once('value');
        const d = snap.val();
        if (d && d.IST && typeof d.IST === 'object' && Object.keys(d.IST).length > 0) {
          return {
            IST:              d.IST,
            totalRW:          num(d.IST_totalRW),
            totalSW:          num(d.IST_totalSW),
            IQ:               d.IST_IQ != null ? Math.round(num(d.IST_IQ)) : null,
            IQkategori:       d.IST_IQ_kategori || null,
            age:              d.IST_age || null,
            candidateName:    d.candidateName || '',
            candidatePosition:d.candidatePosition || '',
            _slug:            s
          };
        }
      } catch (e) { /* lanjut ke kandidat berikutnya */ }
    }
    return null;
  }

  /* ============================================================
     BUILD SUMMARY
     ============================================================ */
  const IST_ORDER = ['SE','WA','AN','GE','ME','RA','ZR','FA','WU'];

  function buildSummary(data) {
    if (!data || !data.IST) return [];
    const desc = (typeof IST_DESCRIPTIONS !== 'undefined') ? IST_DESCRIPTIONS : {};
    return IST_ORDER
      .filter(code => data.IST[code] != null)
      .map(code => {
        const sw = Math.round(num(data.IST[code]));
        const ket = (typeof swCategory5 === 'function') ? swCategory5(sw) : '-';
        return { code, sw, description: desc[code] || '-', ket };
      });
  }

  function computeDominasiStr(summary) {
    try {
      if (typeof computeDominasi === 'function') return computeDominasi(summary);
    } catch (e) {}
    const get = c => (summary.find(x => x.code === c) || {}).sw || 0;
    const d = (get('GE') + get('RA')) - (get('AN') + get('ZR'));
    if (d > 10) return 'FESTIGUNG (Mantap/Eksak)';
    if (d < -10) return 'FLEKSIBILITÄT (Fleksibel/Non-Eksak)';
    return 'Seimbang';
  }

  /* ============================================================
     STYLING HELPERS
     ============================================================ */
  function ketColor(ket) {
    const map = {
      'Sangat Rendah': { bg:'rgba(239,68,68,.18)',  br:'rgba(239,68,68,.5)',  tx:'#fca5a5' },
      'Rendah':        { bg:'rgba(249,115,22,.18)', br:'rgba(249,115,22,.5)', tx:'#fdba74' },
      'Sedang':        { bg:'rgba(245,158,11,.18)', br:'rgba(245,158,11,.5)', tx:'#fcd34d' },
      'Cukup':         { bg:'rgba(234,179,8,.18)',  br:'rgba(234,179,8,.5)',  tx:'#fde047' },
      'Tinggi':        { bg:'rgba(34,197,94,.18)',  br:'rgba(34,197,94,.5)',  tx:'#86efac' },
      'Sangat Tinggi': { bg:'rgba(16,185,129,.22)', br:'rgba(16,185,129,.55)',tx:'#6ee7b7' }
    };
    return map[ket] || { bg:'rgba(148,163,184,.15)', br:'rgba(148,163,184,.4)', tx:'#cbd5e1' };
  }
  function barGradient(sw) {
    if (sw >= 118) return 'linear-gradient(90deg,#16a34a,#22c55e)';
    if (sw >= 100) return 'linear-gradient(90deg,#65a30d,#84cc16)';
    if (sw >= 85)  return 'linear-gradient(90deg,#f59e0b,#fbbf24)';
    return                'linear-gradient(90deg,#dc2626,#ef4444)';
  }
  // SW 70 → 0%, 130 → 100%
  function swToPct(sw) {
    return Math.max(0, Math.min(100, ((sw - 70) / 60) * 100));
  }

  /* ============================================================
     RENDER: STATS CHIP
     ============================================================ */
  function renderStatsHTML(data, summary) {
    const stats = [];
    if (data.totalRW) stats.push({ label:'TOTAL RW', value: data.totalRW, color:'#93c5fd' });
    if (data.totalSW) stats.push({ label:'TOTAL SW', value: Math.round(data.totalSW), color:'#a5b4fc' });
    if (data.IQ)      stats.push({ label:'IQ',       value: data.IQ,      color:'#86efac' });
    if (data.age)     stats.push({ label:'USIA',     value: data.age + ' th', color:'#c4b5fd' });

    const chips = stats.map(s => `
      <div style="padding:8px 14px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.35);border-radius:10px;display:flex;flex-direction:column;gap:2px;">
        <div style="font-size:9px;font-weight:900;letter-spacing:1px;color:#64748b;">${s.label}</div>
        <div style="font-size:15px;font-weight:900;color:${s.color};line-height:1.2;font-variant-numeric:tabular-nums;">${escHtml(String(s.value))}</div>
      </div>`).join('');

    return chips + `
      <div style="padding:8px 14px;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.35);border-radius:10px;display:flex;flex-direction:column;gap:2px;">
        <div style="font-size:9px;font-weight:900;letter-spacing:1px;color:#64748b;">DOMINASI</div>
        <div style="font-size:11.5px;font-weight:900;color:#c4b5fd;line-height:1.2;">${escHtml(computeDominasiStr(summary))}</div>
      </div>`;
  }

  /* ============================================================
     RENDER: TABEL 9 SUBTES
     ============================================================ */
  function renderTableHTML(summary) {
    if (!summary.length) {
      return '<div style="padding:20px;text-align:center;color:#94a3b8;font-size:12px;">Tidak ada subtes tersedia</div>';
    }
    return summary.map(r => {
      const c = ketColor(r.ket);
      const pct = swToPct(r.sw);
      return `
        <div class="ist-row" data-code="${r.code}" style="display:grid;grid-template-columns:48px 1fr 60px 96px;gap:10px;align-items:center;padding:10px 14px;background:rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.05);">
          <div style="font-size:11.5px;font-weight:900;color:#a5b4fc;text-align:center;font-family:'Courier New',monospace;letter-spacing:.5px;">${escHtml(r.code)}</div>
          <div style="min-width:0;">
            <div style="height:6px;background:rgba(255,255,255,.07);border-radius:999px;overflow:hidden;margin-bottom:6px;">
              <div style="width:${pct}%;height:100%;background:${barGradient(r.sw)};border-radius:inherit;"></div>
            </div>
            <div style="font-size:10.5px;color:#94a3b8;line-height:1.45;">${escHtml(r.description)}</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:18px;font-weight:900;color:#e2e8f0;line-height:1;font-variant-numeric:tabular-nums;">${r.sw}</div>
            <div style="font-size:9px;font-weight:800;color:#64748b;margin-top:3px;letter-spacing:.5px;">SW</div>
          </div>
          <div style="text-align:center;">
            <span style="display:inline-block;padding:3px 9px;border-radius:999px;font-size:9.5px;font-weight:900;background:${c.bg};border:1px solid ${c.br};color:${c.tx};white-space:nowrap;">${escHtml(r.ket)}</span>
          </div>
        </div>`;
    }).join('');
  }

  /* ============================================================
     RENDER: ANALISIS (Strength / Weakness / Posisi)
     ============================================================ */
  function renderAnalysisHTML(summary, position) {
    const strength = summary.filter(r => r.sw > 100);
    const weakness = summary.filter(r => r.sw < 100);
    let html = '';

    html += `
      <div style="margin-top:16px;padding:14px 16px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.3);border-radius:12px;">
        <div style="font-size:11px;font-weight:900;letter-spacing:1px;color:#86efac;margin-bottom:8px;">💪 KEKUATAN (SW > 100)</div>
        <div style="font-size:12px;color:#e2e8f0;line-height:1.7;">
          ${strength.length
            ? strength.map(r => `<b style="color:#86efac;">${escHtml(r.code)}</b> <span style="color:#94a3b8;font-size:10.5px;">(${r.sw})</span>`).join(' &nbsp;·&nbsp; ')
            : '<i style="color:#94a3b8;">Tidak ada subtes di atas ambang referensi</i>'}
        </div>
      </div>
      <div style="margin-top:10px;padding:14px 16px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);border-radius:12px;">
        <div style="font-size:11px;font-weight:900;letter-spacing:1px;color:#fca5a5;margin-bottom:8px;">⚠️ AREA PENGEMBANGAN (SW &lt; 100)</div>
        <div style="font-size:12px;color:#e2e8f0;line-height:1.7;">
          ${weakness.length
            ? weakness.map(r => `<b style="color:#fca5a5;">${escHtml(r.code)}</b> <span style="color:#94a3b8;font-size:10.5px;">(${r.sw})</span>`).join(' &nbsp;·&nbsp; ')
            : '<i style="color:#94a3b8;">Tidak ada subtes di bawah ambang referensi</i>'}
        </div>
      </div>`;

    if (position && typeof computeISTPositionFit === 'function') {
      try {
        const fit = computeISTPositionFit(summary, position);
        if (fit) {
          const katColor = {
            'SANGAT SESUAI': '#86efac', 'SESUAI': '#6ee7b7', 'CUKUP SESUAI': '#93c5fd',
            'KURANG SESUAI': '#fcd34d', 'TIDAK SESUAI': '#fca5a5'
          }[fit.kategori] || '#cbd5e1';

          html += `
            <div style="margin-top:10px;padding:16px;background:linear-gradient(135deg, rgba(99,102,241,.12), rgba(139,92,246,.08));border:1px solid rgba(99,102,241,.4);border-radius:12px;">
              <div style="font-size:11px;font-weight:900;letter-spacing:1px;color:#a5b4fc;margin-bottom:10px;">🎯 ANALISIS UNTUK POSISI: ${escHtml(fit.label)}</div>
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;padding:10px 12px;background:rgba(0,0,0,.25);border-radius:9px;">
                <div style="font-size:24px;font-weight:900;color:#fff;font-variant-numeric:tabular-nums;">${fit.skorAkhir}</div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:11.5px;font-weight:900;color:${katColor};letter-spacing:.5px;">${fit.kategori}</div>
                  <div style="font-size:10.5px;color:#94a3b8;margin-top:2px;">${fit.ringkasan.kuat} kuat · ${fit.ringkasan.cukup} cukup · ${fit.ringkasan.kurang} kurang · ${fit.ringkasan.lemah} lemah</div>
                </div>
              </div>
              <div style="font-size:11.5px;color:#cbd5e1;line-height:1.65;margin-bottom:12px;">${escHtml(fit.description)}</div>
              <div style="display:flex;flex-direction:column;gap:4px;">
                ${fit.subtes.map(s => {
                  const sColor = {
                    'Sangat Kuat':'#86efac','Kuat':'#a3e635','Cukup':'#93c5fd','Kurang':'#fcd34d','Lemah':'#fca5a5'
                  }[s.status] || '#94a3b8';
                  const gapStr = s.gap >= 0 ? '+' + s.gap : String(s.gap);
                  return `<div style="display:flex;align-items:center;gap:8px;font-size:11px;padding:5px 8px;background:rgba(0,0,0,.18);border-radius:6px;">
                    <span style="width:34px;font-weight:900;color:#a5b4fc;font-family:'Courier New',monospace;">${escHtml(s.code)}</span>
                    <span style="width:52px;color:#e2e8f0;font-weight:800;font-variant-numeric:tabular-nums;">SW ${s.sw}</span>
                    <span style="width:52px;color:#64748b;font-size:10px;">min ${s.minSW}</span>
                    <span style="width:38px;color:${sColor};font-weight:900;font-size:10px;font-variant-numeric:tabular-nums;">${gapStr}</span>
                    <span style="color:${sColor};font-size:10.5px;font-weight:800;">${escHtml(s.status)}</span>
                  </div>`;
                }).join('')}
              </div>
            </div>`;
        }
      } catch (e) { console.warn('[IST] computeISTPositionFit error', e); }
    }
    return html;
  }

  /* ============================================================
     SECTION RENDER (untuk area "Hasil Tes" folder overlay)
     - data = null  → tampil disabled state
     - data = object → tampil ringkas + tombol Lihat/PDF
     ============================================================ */
  function renderISTSectionHTML(data, slug, name, position) {
    /* -------- EMPTY STATE -------- */
    if (!data) {
      return `
        <div style="margin-bottom: 12px; padding: 14px 16px; background: rgba(148,163,184,.06); border: 1px dashed rgba(148,163,184,.3); border-radius: 11px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; background: rgba(148,163,184,.12); border-radius: 10px; font-size: 18px; opacity: .5;">🧠</div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 12px; font-weight: 800; color: #94a3b8;">Hasil Tes IST</div>
              <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">Belum ada data IST dari kandidat ini</div>
            </div>
            <span style="padding: 4px 10px; border-radius: 999px; font-size: 9.5px; font-weight: 800; background: rgba(148,163,184,.1); border: 1px solid rgba(148,163,184,.3); color: #94a3b8; white-space: nowrap;">Belum Tersedia</span>
          </div>
        </div>`;
    }

    /* -------- DATA STATE -------- */
    const summary   = buildSummary(data);
    const totalSW   = data.totalSW ? Math.round(data.totalSW) : '-';
    const iq        = data.IQ != null ? data.IQ : '-';
    const dominasi  = computeDominasiStr(summary);

    const safeSlug     = escHtml(slug || data._slug || '');
    const safeName     = escHtml(name || data.candidateName || '');
    const safePosition = escHtml(position || data.candidatePosition || '');

    return `
      <div style="margin-bottom: 12px; padding: 14px 16px; background: linear-gradient(135deg, rgba(99,102,241,.12), rgba(139,92,246,.08)); border: 1.5px solid rgba(99,102,241,.4); border-radius: 12px; box-shadow: 0 0 0 1px rgba(99,102,241,.1), 0 0 20px rgba(99,102,241,.12);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap;">
          <div style="width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 10px; font-size: 20px; box-shadow: 0 4px 12px rgba(99,102,241,.35);">🧠</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 12.5px; font-weight: 900; color: #c7d2fe; letter-spacing: .3px;">Hasil Tes IST</div>
            <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">
              ${summary.length} subtes · Dominasi: <b style="color: #c4b5fd;">${escHtml(dominasi)}</b>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(82px, 1fr)); gap: 6px; margin-bottom: 10px;">
          <div style="padding: 6px 10px; background: rgba(0,0,0,.28); border-radius: 8px;">
            <div style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #64748b;">TOTAL RW</div>
            <div style="font-size: 14px; font-weight: 900; color: #93c5fd; margin-top: 2px; font-variant-numeric: tabular-nums;">${escHtml(String(data.totalRW || '-'))}</div>
          </div>
          <div style="padding: 6px 10px; background: rgba(0,0,0,.28); border-radius: 8px;">
            <div style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #64748b;">TOTAL SW</div>
            <div style="font-size: 14px; font-weight: 900; color: #a5b4fc; margin-top: 2px; font-variant-numeric: tabular-nums;">${escHtml(String(totalSW))}</div>
          </div>
          <div style="padding: 6px 10px; background: rgba(0,0,0,.28); border-radius: 8px;">
            <div style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #64748b;">IQ</div>
            <div style="font-size: 14px; font-weight: 900; color: #86efac; margin-top: 2px; font-variant-numeric: tabular-nums;">${escHtml(String(iq))}</div>
          </div>
          ${data.age ? `
          <div style="padding: 6px 10px; background: rgba(0,0,0,.28); border-radius: 8px;">
            <div style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #64748b;">USIA</div>
            <div style="font-size: 14px; font-weight: 900; color: #c4b5fd; margin-top: 2px; font-variant-numeric: tabular-nums;">${escHtml(String(data.age))}</div>
          </div>` : ''}
        </div>

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="js-ist-open"
            data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePosition}"
            style="flex: 1; min-width: 130px; padding: 9px 14px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: 0; border-radius: 9px; color: #fff; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(99,102,241,.35);">
            👁 Lihat Detail (9 Subtes)
          </button>
          <button class="js-ist-pdf"
            data-slug="${safeSlug}" data-name="${safeName}" data-position="${safePosition}"
            style="padding: 9px 16px; background: rgba(16,185,129,.18); border: 1px solid rgba(16,185,129,.5); border-radius: 9px; color: #6ee7b7; font-family: inherit; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
            📄 PDF
          </button>
        </div>
      </div>`;
  }

  /* ============================================================
     MODAL
     ============================================================ */
  async function openISTModal(slug, name, position) {
    const old = document.getElementById('istModal'); if (old) old.remove();
    const data = await fetchISTData(slug);

    const overlay = document.createElement('div');
    overlay.id = 'istModal';
    overlay.setAttribute('data-slug', slug);
    overlay.setAttribute('data-name', name);
    overlay.setAttribute('data-position', position || '');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

    /* -------- EMPTY STATE -------- */
    if (!data) {
      overlay.innerHTML = `
        <div style="width:min(440px,100%);background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.4);border-radius:18px;padding:32px;text-align:center;color:#e2e8f0;box-shadow:0 30px 90px rgba(0,0,0,.65);">
          <div style="font-size:52px;margin-bottom:12px;">📭</div>
          <div style="font-size:16px;font-weight:900;color:#fff;margin-bottom:8px;">Belum Ada Data IST</div>
          <div style="font-size:13px;color:#94a3b8;line-height:1.65;margin-bottom:22px;">
            Kandidat <b style="color:#a5b4fc;">${escHtml(name)}</b> belum menyelesaikan tes IST atau skornya belum tersinkron.
          </div>
          <button id="istCloseEmpty" style="width:100%;padding:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#cbd5e1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;">Tutup</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#istCloseEmpty').onclick = () => overlay.remove();
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      return;
    }

    /* -------- DATA STATE -------- */
    const summary = buildSummary(data);
    const finalName = name || data.candidateName || 'Kandidat';
    const finalPosition = position || data.candidatePosition || '-';

    overlay.innerHTML = `
      <div style="width:min(880px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(99,102,241,.4);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;">

        <div style="padding:16px 20px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <div style="width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:11px;font-size:20px;">🧠</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">HASIL TES IST · 9 SUBTES</div>
            <div style="font-size:16px;font-weight:900;color:#fff;margin-top:2px;word-break:break-word;">${escHtml(finalName)}</div>
            <div style="font-size:11px;opacity:.85;margin-top:2px;">💼 ${escHtml(finalPosition)}</div>
          </div>
          <button id="istCloseBtn" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>
        </div>

        <div style="padding:12px 20px;background:rgba(0,0,0,.28);border-bottom:1px solid rgba(255,255,255,.06);display:flex;gap:8px;flex-wrap:wrap;">
          ${renderStatsHTML(data, summary)}
        </div>

        <div style="display:grid;grid-template-columns:48px 1fr 60px 96px;gap:10px;padding:8px 14px;background:rgba(0,0,0,.32);border-bottom:1px solid rgba(255,255,255,.05);font-size:9.5px;font-weight:900;letter-spacing:.8px;color:#64748b;">
          <div style="text-align:center;">KODE</div>
          <div>DESKRIPSI</div>
          <div style="text-align:center;">SW</div>
          <div style="text-align:center;">KATEGORI</div>
        </div>

        <div style="flex:1;overflow-y:auto;">
          ${renderTableHTML(summary)}
          <div style="padding:0 14px 16px;">
            ${renderAnalysisHTML(summary, finalPosition)}
          </div>
        </div>

        <div style="padding:12px 20px;background:rgba(0,0,0,.32);border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="color:#94a3b8;font-size:10.5px;font-weight:600;">ℹ️ Data dari Firebase (sgs_scores)</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="js-ist-pdf" style="padding:8px 16px;background:linear-gradient(135deg,#10b981,#059669);border:0;border-radius:9px;color:#fff;font-family:inherit;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,.35);">📄 Download PDF</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    overlay.querySelector('#istCloseBtn').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  /* ============================================================
     PDF RINGKAS (no chart)
     ============================================================ */
  async function generateISTPDF(name, position, data) {
    if (typeof window.loadPdfLibs === 'function') await window.loadPdfLibs();
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF tidak tersedia');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 15, CW = PW - 2 * M;
    let y = M;

    /* Header */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(30, 58, 138);
    doc.text('HASIL TES IST', PW / 2, y, { align: 'center' });
    y += 7;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139);
    doc.text('Sugar Group Schools', PW / 2, y, { align: 'center' });
    y += 5;
    doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 8;

    /* Info */
    const tanggal = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });
    [
      ['Nama', name || '-'],
      ['Posisi', position || '-'],
      ['Tanggal', tanggal],
      ['Usia', data.age ? data.age + ' tahun' : '-']
    ].forEach(([k, v]) => {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.setFontSize(10);
      doc.text(k + ' :', M, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(v), M + 30, y);
      y += 5.5;
    });
    y += 3;

    /* Ringkasan */
    const summary = buildSummary(data);
    const totalRW = data.totalRW || 0;
    const totalSW = data.totalSW ? Math.round(data.totalSW) : 0;
    const iqStr = data.IQ ? `${data.IQ} — ${data.IQkategori || ''}` : '-';

    doc.setFillColor(238, 242, 255); doc.setDrawColor(99, 102, 241);
    doc.rect(M, y, CW, 18, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(67, 56, 202);
    doc.text(`TOTAL RW: ${totalRW}   ·   TOTAL SW: ${totalSW}`, M + 4, y + 6);
    doc.setFontSize(10);
    doc.text(`IQ: ${iqStr}`, M + 4, y + 12);
    y += 22;

    /* Tabel header */
    doc.setFillColor(59, 130, 246); doc.rect(M, y, CW, 7, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('KODE', M + 4, y + 5);
    doc.text('SW', M + 26, y + 5, { align: 'center' });
    doc.text('DESKRIPSI', M + 40, y + 5);
    doc.text('KATEGORI', M + CW - 4, y + 5, { align: 'right' });
    y += 7;

    /* Tabel body */
    summary.forEach((r, i) => {
      if (y > PH - 25) { doc.addPage(); y = M; }
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(M, y, CW, 7, 'F'); }

      doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.setFontSize(9);
      doc.text(r.code, M + 4, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.text(String(r.sw), M + 26, y + 5, { align: 'center' });

      doc.setFontSize(8.5);
      const wrapped = doc.splitTextToSize(r.description || '-', 100);
      doc.text(wrapped[0] + (wrapped.length > 1 ? '…' : ''), M + 40, y + 5);

      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text(r.ket, M + CW - 4, y + 5, { align: 'right' });
      y += 7;
    });

    /* Kekuatan / Kelemahan */
    y += 6;
    if (y > PH - 30) { doc.addPage(); y = M; }
    const strength = summary.filter(r => r.sw > 100);
    const weakness = summary.filter(r => r.sw < 100);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(22, 101, 52);
    doc.text('KEKUATAN (SW > 100)', M, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
    const sStr = strength.length ? strength.map(r => `${r.code}(${r.sw})`).join(', ') : 'Tidak ada.';
    doc.splitTextToSize(sStr, CW).forEach(l => { doc.text(l, M, y); y += 4.5; });
    y += 2;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(185, 28, 28);
    doc.text('AREA PENGEMBANGAN (SW < 100)', M, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
    const wStr = weakness.length ? weakness.map(r => `${r.code}(${r.sw})`).join(', ') : 'Tidak ada.';
    doc.splitTextToSize(wStr, CW).forEach(l => { doc.text(l, M, y); y += 4.5; });
    y += 5;

    /* Kesimpulan posisi */
    if (position && typeof computeISTPositionFit === 'function') {
      try {
        const fit = computeISTPositionFit(summary, position);
        if (fit) {
          if (y > PH - 50) { doc.addPage(); y = M; }
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(67, 56, 202);
          doc.text('KESIMPULAN UNTUK POSISI: ' + fit.label, M, y); y += 5;
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
          doc.text(`Skor Kesesuaian: ${fit.skorAkhir} — ${fit.kategori}`, M, y); y += 5;
          doc.splitTextToSize(fit.description, CW).forEach(l => { doc.text(l, M, y); y += 4.5; });
          y += 3;
        }
      } catch (e) {}
    }

    /* Footer */
    if (y > PH - 20) { doc.addPage(); y = M; }
    y += 6;
    doc.setDrawColor(200); doc.line(M, y, PW - M, y); y += 5;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
    doc.text('Dibuat: ' + new Date().toLocaleString('id-ID'), M, y);
    doc.text('Halaman ' + doc.internal.getNumberOfPages(), PW - M, y, { align: 'right' });
    return doc;
  }

  async function downloadISTPDF(slug, name, position) {
    const data = await fetchISTData(slug);
    if (!data) throw new Error('Data IST tidak tersedia');
    const doc = await generateISTPDF(name, position, data);
    const safeName = String(name || 'Kandidat').replace(/[^a-zA-Z0-9]/g, '-');
    doc.save('Hasil-IST-' + safeName + '.pdf');
  }

  /* ============================================================
     EVENT DELEGATION
     ============================================================ */
  if (!window.__istDelegationAttached) {
    window.__istDelegationAttached = true;
    document.addEventListener('click', async function (e) {
      const openBtn = e.target.closest('.js-ist-open');
      if (openBtn) {
        e.preventDefault(); e.stopPropagation();
        if (openBtn.disabled) return;
        const slug = openBtn.getAttribute('data-slug');
        const name = openBtn.getAttribute('data-name');
        const position = openBtn.getAttribute('data-position');
        if (slug) openISTModal(slug, name, position);
        return;
      }

      const pdfBtn = e.target.closest('.js-ist-pdf');
      if (pdfBtn) {
        e.preventDefault(); e.stopPropagation();

        /* Sumber data: modal (prioritas) atau button attribute (standalone) */
        const modal = pdfBtn.closest('#istModal');
        const slug     = (modal ? modal.getAttribute('data-slug')     : pdfBtn.getAttribute('data-slug'));
        const name     = (modal ? modal.getAttribute('data-name')     : pdfBtn.getAttribute('data-name'));
        const position = (modal ? modal.getAttribute('data-position') : pdfBtn.getAttribute('data-position'));

        if (!slug) return;
        const prev = pdfBtn.innerHTML;
        pdfBtn.innerHTML = '⏳ PDF...'; pdfBtn.disabled = true;
        try {
          await downloadISTPDF(slug, name, position);
          pdfBtn.innerHTML = '✓ Terunduh';
          setTimeout(() => { pdfBtn.innerHTML = prev; pdfBtn.disabled = false; }, 1800);
        } catch (err) {
          alert('Gagal PDF: ' + err.message);
          pdfBtn.innerHTML = prev; pdfBtn.disabled = false;
        }
        return;
      }
    }, true);
  }

  /* ============================================================
     EXPORT
     ============================================================ */
  window.openISTModal          = openISTModal;
  window.downloadISTPDF        = downloadISTPDF;
  window.renderISTSectionHTML  = renderISTSectionHTML;
  window.__fetchISTData        = fetchISTData;

  console.log('[IST-ADMIN] ✓ Loaded v2 — section + modal + on-demand PDF');
})();