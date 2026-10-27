/* ============================================================
   js/00x5-admin-wawancara-result.js — Unified Interview Card v1.0
   ------------------------------------------------------------
   - Render 1 card wawancara (chips per pewawancara)
   - Tombol Lihat Detail → modal per pewawancara
   - Tombol PDF → buka file combined di Drive
   ============================================================ */
(function () {
  'use strict';

  if (window.__wawancaraResultLoaded) return;
  window.__wawancaraResultLoaded = true;

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function fbReady() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
  }
  function slugifyDashed(name) {
    return String(name || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  }

  function __concStyle(conclusion) {
    const c = String(conclusion || '').toUpperCase();
    if (c.includes('HIGHLY'))  return { label: 'Highly Rec',    short: '🌟', tx: '#86efac', bg: 'rgba(34,197,94,.18)',  br: 'rgba(34,197,94,.55)' };
    if (c.includes('NOT'))     return { label: 'Not Rec',       short: '❌', tx: '#fca5a5', bg: 'rgba(239,68,68,.18)',  br: 'rgba(239,68,68,.5)' };
    if (c.includes('FAIRLY'))  return { label: 'Fairly Rec',    short: '⚠️', tx: '#fcd34d', bg: 'rgba(245,158,11,.18)', br: 'rgba(245,158,11,.5)' };
    return { label: 'Recommended', short: '✅', tx: '#86efac', bg: 'rgba(34,197,94,.15)', br: 'rgba(34,197,94,.45)' };
  }

  async function __fetchStats(slug) {
    if (!fbReady()) return null;
    const dashed = slugifyDashed(slug);
    const candidates = [slug, dashed].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const s of candidates) {
      try {
        const snap = await firebase.database().ref('sgs_interviews/' + s).once('value');
        const data = snap.val() || {};
        const keys = Object.keys(data).filter(k => data[k] && typeof data[k].average === 'number');
        if (keys.length === 0) continue;

        let sum = 0;
        const perInterviewer = keys.map(k => {
          sum += data[k].average;
          return {
            name: k,
            average: Number(data[k].average) || 0,
            conclusion: data[k].conclusion || '',
            scores: data[k].scores || {},
            notes: data[k].notes || '',
            candidateName: data[k].candidateName || '',
            ts: data[k].ts || 0
          };
        }).sort((a, b) => b.average - a.average);

        return {
          count: perInterviewer.length,
          avg: sum / perInterviewer.length,
          perInterviewer: perInterviewer,
          _slug: s
        };
      } catch (e) {}
    }
    return null;
  }

  function __renderBox(stats, files, slug, name, position) {
    const combined = (files || []).find(f => /-wawancara-combined\.pdf$/i.test(f.name || ''));
    const individual = (files || []).filter(f => !/-wawancara-combined\.pdf$/i.test(f.name || ''));

    if (!stats && individual.length === 0 && !combined) {
  return '<div style="margin-bottom:12px;padding:14px 16px;background:linear-gradient(135deg,rgba(250,204,21,.08),rgba(245,158,11,.05));border:1.5px dashed rgba(250,204,21,.3);border-radius:12px;text-align:center;">' +
    '<div style="font-size:24px;margin-bottom:6px;">🎤</div>' +
    '<div style="font-size:12px;font-weight:900;color:#fde047;">Belum ada wawancara</div>' +
    '<div style="font-size:10.5px;color:#94a3b8;margin-top:4px;">Kandidat belum diwawancarai.</div>' +
  '</div>';
}

    const safeSlug = escHtml(slug);
    const safeName = escHtml(name);
    const safePosition = escHtml(position || '');

    const chipsHTML = stats
      ? stats.perInterviewer.map(iv => {
          const cs = __concStyle(iv.conclusion);
          return '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;font-size:10px;font-weight:900;background:' + cs.bg + ';border:1px solid ' + cs.br + ';color:' + cs.tx + ';white-space:nowrap;">' +
            '<b style="font-family:\'Courier New\',monospace;">' + escHtml(iv.name) + '</b>' +
            '<span>' + cs.short + '</span>' +
            '<span style="font-variant-numeric:tabular-nums;">' + iv.average.toFixed(2) + '</span>' +
          '</span>';
        }).join('')
      : '';

    const subtitle = stats
      ? stats.count + ' pewawancara · Rata-rata: <b style="color:#fde047;">' + stats.avg.toFixed(2) + '</b>/5'
      : individual.length + ' file pewawancara';

    const detailBtn = stats
      ? '<button class="js-wawancara-open" data-slug="' + safeSlug + '" data-name="' + safeName + '" data-position="' + safePosition + '" ' +
        'style="flex:1;min-width:130px;padding:9px 14px;background:linear-gradient(135deg,#f59e0b,#d97706);border:0;border-radius:9px;color:#fff;font-family:inherit;font-size:11.5px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(245,158,11,.35);">' +
        '👁 Lihat Detail (' + stats.count + ' Pewawancara)</button>'
      : '';

    let pdfBtn = '';
    if (combined) {
      const safeUrl = String(combined.url || '#').replace(/"/g, '%22');
      pdfBtn = '<a href="' + safeUrl + '" target="_blank" rel="noopener" ' +
        'style="padding:9px 16px;background:rgba(16,185,129,.18);border:1px solid rgba(16,185,129,.5);border-radius:9px;color:#6ee7b7;font-family:inherit;font-size:11.5px;font-weight:800;cursor:pointer;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '📄 PDF</a>';
    } else if (individual.length > 0) {
      pdfBtn = '<button class="js-wawancara-pdf" data-slug="' + safeSlug + '" data-name="' + safeName + '" ' +
        'style="padding:9px 16px;background:rgba(16,185,129,.18);border:1px solid rgba(16,185,129,.5);border-radius:9px;color:#6ee7b7;font-family:inherit;font-size:11.5px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '📄 PDF</button>';
    }

        return '<div class="js-waw-card-hover" ' +
      'style="margin-bottom:12px;padding:14px 16px;' +
        'background:linear-gradient(135deg,rgba(250,204,21,.12),rgba(245,158,11,.08));' +
        'border:1.5px solid rgba(250,204,21,.45);border-radius:12px;' +
        'box-shadow:0 0 0 1px rgba(250,204,21,.1),0 0 20px rgba(250,204,21,.12);' +
        'transition:all .25s cubic-bezier(.2,.8,.2,1);cursor:default;" ' +
      'onmouseover="this.style.transform=\'translateY(-3px)\';' +
        'this.style.borderColor=\'rgba(250,204,21,.75)\';' +
        'this.style.boxShadow=\'0 12px 32px rgba(0,0,0,.35), 0 0 0 1px rgba(250,204,21,.35), 0 0 28px rgba(250,204,21,.25)\';" ' +
      'onmouseout="this.style.transform=\'translateY(0)\';' +
        'this.style.borderColor=\'rgba(250,204,21,.45)\';' +
        'this.style.boxShadow=\'0 0 0 1px rgba(250,204,21,.1), 0 0 20px rgba(250,204,21,.12)\';">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;flex-wrap:wrap;">' +
        '<div style="width:40px;height:40px;flex:0 0 40px;display:grid;place-items:center;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:10px;font-size:20px;box-shadow:0 4px 12px rgba(245,158,11,.35);">🎤</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:12.5px;font-weight:900;color:#fde047;letter-spacing:.3px;">Hasil Wawancara</div>' +
          '<div style="font-size:10.5px;color:#94a3b8;margin-top:2px;">' + subtitle + '</div>' +
        '</div>' +
        (stats ? '<div style="padding:4px 12px;border-radius:999px;font-size:11px;font-weight:900;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.4);color:#86efac;font-variant-numeric:tabular-nums;">⭐ ' + stats.avg.toFixed(2) + '</div>' : '') +
      '</div>' +
      (chipsHTML ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' + chipsHTML + '</div>' : '') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + detailBtn + pdfBtn + '</div>' +
    '</div>';
  }

  window.__attachWawancaraUnified = async function (slug, name, position, files, wrapper) {
    if (!wrapper) return;
    try {
      const stats = await __fetchStats(slug);
      wrapper.innerHTML = __renderBox(stats, files || [], slug, name, position);
    } catch (e) {
      console.warn('[WAWANCARA] render gagal:', e.message);
      wrapper.innerHTML = __renderBox(null, files || [], slug, name, position);
    }
  };

  window.__openWawancaraModal = async function (slug, name, position) {
    const stats = await __fetchStats(slug);
    if (!stats) { alert('Belum ada data wawancara.'); return; }

    const old = document.getElementById('wawancaraModal');
    if (old) old.remove();

    const ov = document.createElement('div');
    ov.id = 'wawancaraModal';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

    const overallChip = __concStyle(
      stats.avg >= 4.5 ? 'HIGHLY' :
      stats.avg >= 3.5 ? 'RECOMMENDED' :
      stats.avg >= 2.5 ? 'FAIRLY' :
      'NOT'
    );

    const perIvHTML = stats.perInterviewer.map(function(iv) {
      const cs = __concStyle(iv.conclusion);
      const scoreEntries = Object.entries(iv.scores);
      const scoreRows = scoreEntries.length
        ? scoreEntries.map(function(e) {
            return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-top:1px dashed rgba(255,255,255,.06);font-size:11px;">' +
              '<span style="color:#cbd5e1;">' + escHtml(e[0]) + '</span>' +
              '<span style="color:#fde047;font-weight:900;font-variant-numeric:tabular-nums;">' + Number(e[1]).toFixed(2) + '</span>' +
            '</div>';
          }).join('')
        : '';

      return '<div style="padding:14px;background:rgba(0,0,0,.28);border:1px solid rgba(250,204,21,.25);border-radius:12px;margin-bottom:10px;">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">' +
          '<div style="width:36px;height:36px;display:grid;place-items:center;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border-radius:9px;font-weight:900;font-size:11px;letter-spacing:.5px;">' + escHtml(String(iv.name).slice(0,3)) + '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:13px;font-weight:900;color:#fff;">' + escHtml(iv.name) + '</div>' +
            '<div style="font-size:10.5px;color:#94a3b8;margin-top:1px;">' + (iv.ts ? new Date(iv.ts).toLocaleString('id-ID') : '-') + '</div>' +
          '</div>' +
          '<div style="padding:4px 10px;border-radius:999px;font-size:11px;font-weight:900;background:' + cs.bg + ';border:1px solid ' + cs.br + ';color:' + cs.tx + ';">' + iv.average.toFixed(2) + ' · ' + cs.label + '</div>' +
        '</div>' +
        (scoreRows ? '<div style="margin-top:6px;">' + scoreRows + '</div>' : '') +
        (iv.notes ? '<div style="margin-top:10px;padding:8px 10px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:8px;font-size:11px;color:#fde047;line-height:1.5;"><b>Catatan:</b> ' + escHtml(iv.notes) + '</div>' : '') +
      '</div>';
    }).join('');

    ov.innerHTML = '<div style="width:min(760px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid rgba(250,204,21,.4);border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#e2e8f0;">' +
      '<div style="padding:16px 20px;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;gap:14px;flex-wrap:wrap;">' +
        '<div style="width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:11px;font-size:20px;">🎤</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:10px;font-weight:900;letter-spacing:2px;opacity:.85;">HASIL WAWANCARA</div>' +
          '<div style="font-size:16px;font-weight:900;color:#fff;margin-top:2px;word-break:break-word;">' + escHtml(name) + '</div>' +
          '<div style="font-size:11px;opacity:.85;margin-top:2px;">💼 ' + escHtml(position || '-') + '</div>' +
        '</div>' +
        '<button id="wawancaraCloseBtn" style="width:36px;height:36px;display:grid;place-items:center;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>' +
      '</div>' +
      '<div style="padding:12px 20px;background:rgba(0,0,0,.3);border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:10px;font-weight:900;color:#94a3b8;letter-spacing:1px;">RATA-RATA:</span>' +
          '<span style="font-size:18px;font-weight:900;color:#fff;font-variant-numeric:tabular-nums;">' + stats.avg.toFixed(2) + ' / 5.00</span>' +
        '</div>' +
        '<span style="padding:5px 12px;border-radius:999px;font-size:11px;font-weight:900;background:' + overallChip.bg + ';border:1px solid ' + overallChip.br + ';color:' + overallChip.tx + ';">' + overallChip.label + '</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:16px 20px 20px;">' +
        '<div style="font-size:11px;font-weight:900;color:#94a3b8;letter-spacing:1px;margin-bottom:10px;">PER PEWAWANCARA (' + stats.count + ')</div>' +
        perIvHTML +
      '</div>' +
      '<div style="padding:12px 20px;background:rgba(0,0,0,.3);border-top:1px solid rgba(255,255,255,.06);display:flex;justify-content:flex-end;">' +
        '<button id="wawancaraCloseBtn2" style="padding:9px 20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:9px;color:#cbd5e1;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;">Tutup</button>' +
      '</div>' +
    '</div>';

    document.body.appendChild(ov);
    var close = function() { ov.remove(); };
    ov.querySelector('#wawancaraCloseBtn').onclick = close;
    ov.querySelector('#wawancaraCloseBtn2').onclick = close;
    ov.addEventListener('click', function(e) { if (e.target === ov) close(); });
  };

  if (!window.__wawancaraDelegationAttached) {
    window.__wawancaraDelegationAttached = true;
    document.addEventListener('click', async function(e) {
      var openBtn = e.target.closest('.js-wawancara-open');
      if (openBtn) {
        e.preventDefault(); e.stopPropagation();
        var slug = openBtn.getAttribute('data-slug');
        var name = openBtn.getAttribute('data-name');
        var position = openBtn.getAttribute('data-position');
        if (slug) window.__openWawancaraModal(slug, name, position);
        return;
      }
    }, true);
  }

  console.log('[WAWANCARA-RESULT] Loaded - unified card + modal');
})();