/* =========================================================
   DISC TEST — Full Logic
   ========================================================= */

   function namaPanggilan() {
    return (appState?.identity?.nickname && String(appState.identity.nickname).trim())
      ? String(appState.identity.nickname).trim()
      : "Peserta";
  }
  
  /* ============================================================
     INTRO DISC
     ============================================================ */
  function renderDISCIntro() {
    const app = document.getElementById('app');
  
    const totalQuestions = Array.isArray(tests?.DISC?.questions)
      ? tests.DISC.questions.length
      : 0;
  
    app.innerHTML = `
      <div class="ist-shell">
        <div class="ist-panel">
          <div class="ist-panel-header">
            <div class="ist-header-row">
              <div style="display:flex;align-items:center;gap:15px;">
                ${renderTestLogoBadge()}
                <div>
                  <div class="ist-eyebrow"><span>👤</span> PERSONALITY ASSESSMENT</div>
                  <h2 class="ist-title" style="margin-top:11px;">${tests.DISC.name}</h2>
                  <p class="ist-subtitle">${tests.DISC.description || 'Tes kepribadian DISC'}</p>
                </div>
              </div>
              <div class="ist-time-chip">
                <span class="ist-time-chip-icon">⏱</span>
                <span>${totalQuestions > 0 ? '~5' : '0'} menit</span>
              </div>
            </div>
          </div>
  
          <div class="ist-body">
            <div class="ist-info-grid">
              <div class="ist-info-card">
                <div class="ist-info-label">Tes</div>
                <div class="ist-info-value">DISC</div>
              </div>
              <div class="ist-info-card">
                <div class="ist-info-label">Jumlah Soal</div>
                <div class="ist-info-value">${totalQuestions} soal</div>
              </div>
              <div class="ist-info-card">
                <div class="ist-info-label">Metode</div>
                <div class="ist-info-value">P / K</div>
              </div>
            </div>
  
            <div class="ist-instruction-card">
              <div class="ist-section-heading">
                <span class="ist-section-icon">📘</span>
                Petunjuk Pengerjaan
              </div>
              <div class="ist-instruction-text">
                <ul style="margin:0;padding-left:22px;line-height:1.75;">
                  <li>Pilih <strong>1 pernyataan PALING (P)</strong> yang paling menggambarkan diri Anda.</li>
                  <li>Pilih <strong>1 pernyataan KURANG (K)</strong> yang paling tidak menggambarkan diri Anda.</li>
                  <li>P dan K harus dipilih pada <strong>pernyataan yang berbeda.</strong></li>
                  <li>Jawablah sesuai kondisi diri Anda yang sebenarnya, bukan berdasarkan jawaban yang dianggap paling baik.</li>
                </ul>
              </div>
            </div>
  
            <div class="ist-example">
              <h4 class="ist-example-title">✦ Contoh Pengisian</h4>
              <div class="ist-instruction-text">
                <strong>Pilih P dan K sesuai dengan kondisi diri Anda.</strong><br>
                P digunakan untuk pernyataan yang <strong>PALING</strong> menggambarkan diri Anda.<br>
                K digunakan untuk pernyataan yang <strong>KURANG</strong> menggambarkan diri Anda.
              </div>
              <img class="disc-example-image"
                src="https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/disc.png"
                alt="Contoh pengisian DISC" loading="eager" decoding="async">
            </div>
  
            <div class="ist-actions">
              <button class="ist-btn-primary" onclick="mulaiDISC()">🚀 Mulai Tes DISC</button>
              <button class="ist-btn-secondary" onclick="renderHome()" type="button">Kembali</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /* ============================================================
     MULAI DISC
     ============================================================ */
  function mulaiDISC() {
    appState.currentTest = "DISC";
    appState.currentQuestion = 0;
    appState.tempDISC = {};
    appState.answers = appState.answers || {};
    appState.answers.DISC = [];
    appState.completed = appState.completed || {};
    appState.completed.DISC = false;
    appState.discError = "";
    renderDISCQuestion();
  }
  
  /* ============================================================
     RENDER QUESTION
     ============================================================ */
  function renderDISCQuestion() {
    const soal = tests?.DISC?.questions || [];
    const idx = Number(appState.currentQuestion || 0);
  
    if (!Array.isArray(soal) || soal.length === 0) {
      document.getElementById('app').innerHTML = `
        <div class="ist-shell">
          <div class="ist-panel">
            <div class="ist-body">
              <div class="disc-ist-error">Soal DISC belum dimuat.</div>
            </div>
          </div>
        </div>
      `;
      return;
    }
  
    if (idx >= soal.length) {
      showDISCResult();
      return;
    }
  
    const question = soal[idx];
  
    if (!appState.tempDISC) appState.tempDISC = {};
  
    const totalQuestions = soal.length;
    const questionNumber = idx + 1;
    const progress = totalQuestions ? ((idx) / totalQuestions) * 100 : 0;
  
    const optionsHTML = (question.options || []).map((option, index) => {
      const isP = appState.tempDISC.p === index;
      const isK = appState.tempDISC.k === index;
      const selectedClass = isP ? ' selected-p' : isK ? ' selected-k' : '';
  
      return `
        <div class="disc-ist-option${selectedClass}" data-index="${index}">
          <button type="button" class="disc-pk-btn p-btn${isP ? ' selected-p' : ''}"
            onclick="selectDISCAnswer('p', ${index})"
            aria-label="Paling" title="Paling menggambarkan diri Anda">P</button>
  
          <div class="disc-option-text">${option.text}</div>
  
          <button type="button" class="disc-pk-btn k-btn${isK ? ' selected-k' : ''}"
            onclick="selectDISCAnswer('k', ${index})"
            aria-label="Kurang" title="Kurang menggambarkan diri Anda">K</button>
        </div>
      `;
    }).join('');
  
    const errorHTML = appState.discError ? `<div class="disc-ist-error">${appState.discError}</div>` : '';
  
    const app = document.getElementById('app');
  
    app.innerHTML = `
      <div class="ist-shell">
        <div class="ist-question-panel">
          <div class="ist-question-top">
            <div class="ist-question-meta">
              <div>
                <div class="ist-question-label">TES DISC</div>
                <div class="ist-question-badge">👤 Personality Assessment</div>
              </div>
              <div class="ist-time-chip">
                <span class="ist-time-chip-icon">⏱</span>
                <span>${Math.max(1, Math.round(totalQuestions * 0.2))} menit</span>
              </div>
            </div>
  
            <div class="ist-progress-wrap">
              <div class="ist-progress-info">
                <span>Soal ${questionNumber} dari ${totalQuestions}</span>
                <span>${Math.round(progress)}%</span>
              </div>
              <div class="ist-progress-track">
                <div class="ist-progress-fill" style="width:${progress}%"></div>
              </div>
            </div>
          </div>
  
          <div class="ist-question-body">
            <div class="ist-question-heading">${question.text || ''}</div>
  
            <div class="disc-pk-legend">
              <span class="disc-legend-item">
                <span class="disc-legend-p">P</span> PALING
              </span>
              <span style="color:#cbd1df;">|</span>
              <span class="disc-legend-item">
                <span class="disc-legend-k">K</span> KURANG
              </span>
            </div>
  
            <div style="display:grid;grid-template-columns:1fr;gap:11px;margin-top:18px;">
              ${optionsHTML}
            </div>
  
            ${errorHTML}
  
            <div class="ist-question-actions">
              <div class="ist-action-left"></div>
              <div class="ist-action-right">
                <button class="ist-main-btn" id="btnNextDISC" type="button">
                  ${idx < totalQuestions - 1 ? 'Lanjut →' : 'Selesai ✓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  
    const nextBtn = document.getElementById('btnNextDISC');
    if (nextBtn) nextBtn.onclick = nextDISCQuestion;
  }
  
  /* ============================================================
     NEXT QUESTION
     ============================================================ */
  function nextDISCQuestion() {
    const temp = appState.tempDISC || {};
    appState.discError = "";
  
    if (typeof temp.p !== 'number' || typeof temp.k !== 'number') {
      appState.discError = 'Harap pilih satu opsi untuk P (Paling) dan satu opsi untuk K (Kurang)!';
      renderDISCQuestion();
      return;
    }
  
    if (temp.p === temp.k) {
      appState.discError = 'P dan K tidak boleh berada pada opsi yang sama!';
      renderDISCQuestion();
      return;
    }
  
    const question = tests.DISC.questions[appState.currentQuestion];
  
    appState.answers.DISC = appState.answers.DISC || [];
  
    appState.answers.DISC[appState.currentQuestion] = {
      id: question.id,
      p: temp.p,
      k: temp.k,
      pText: question.options[temp.p].text,
      kText: question.options[temp.k].text
    };
  
    appState.currentQuestion++;
    appState.tempDISC = {};
    appState.discError = "";
  
    if (appState.currentQuestion >= tests.DISC.questions.length) {
      appState.completed.DISC = true;
      showThankYouAndHomeDISC();
    } else {
      renderDISCQuestion();
    }
  }
  
  /* ============================================================
     THANK YOU
     ============================================================ */
  function showThankYouAndHomeDISC() {
     window.__inTestView = false;
    if (typeof window.markTestCompleted === 'function') {
      markTestCompleted('DISC');
    } else {
      window.appState = window.appState || {};
      appState.completed = appState.completed || {};
      appState.completed.DISC = true;
  
      try {
        const saved = JSON.parse(localStorage.getItem('completed') || '{}');
        saved.DISC = true;
        localStorage.setItem('completed', JSON.stringify(saved));
      } catch (e) {}
  
      if (typeof window.updateDownloadButtonState === 'function') {
        window.updateDownloadButtonState();
      }
    }
  
    const app = document.getElementById('app');
  
    app.innerHTML = `
      <div class="ist-shell">
        <div class="ist-panel">
          <div class="ist-panel-header">
            <div class="ist-header-row">
              <div>
                <div class="ist-eyebrow"><span>✅</span> PERSONALITY ASSESSMENT</div>
                <h2 class="ist-title">Tes DISC Selesai</h2>
                <p class="ist-subtitle">Terima kasih, jawaban Anda telah berhasil disimpan.</p>
              </div>
            </div>
          </div>
  
          <div class="ist-body">
            <div class="ist-instruction-card" style="text-align:center;padding:32px 22px;">
              <div style="font-size:4rem;line-height:1;margin-bottom:16px;">🎉</div>
              <div style="font-size:1.15rem;font-weight:800;color:#172033;margin-bottom:10px;">Terima kasih!</div>
              <div style="max-width:650px;margin:0 auto;color:#667085;line-height:1.7;">
                Tes DISC sudah selesai dan seluruh jawaban Anda telah tersimpan.<br>
                Silakan lanjut mengerjakan tes berikutnya yang tersedia.
              </div>
            </div>
  
            <div class="ist-actions">
              <button class="ist-btn-primary" id="btnContinueDISC" type="button">
                ✅ Lanjut Tes Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  
    const btn = document.getElementById('btnContinueDISC');
    if (btn) {
      btn.onclick = () => {
        window.__inTestView = false;
        if (typeof window.renderHome === 'function') {
          window.renderHome();
          setTimeout(() => {
            const el = document.getElementById('homeCard') || document.getElementById('downloadPDFBox');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 200);
        }
      };
    }
  }
  
  /* ============================================================
     SELECT P / K
     ============================================================ */
  function selectDISCAnswer(type, index) {
    if (!appState.tempDISC) appState.tempDISC = {};
  
    if (type === 'p') {
      if (appState.tempDISC.k === index) appState.tempDISC.k = undefined;
      appState.tempDISC.p = index;
    } else if (type === 'k') {
      if (appState.tempDISC.p === index) appState.tempDISC.p = undefined;
      appState.tempDISC.k = index;
    }
  
    appState.discError = "";
    renderDISCQuestion();
  }
  
  /* ============================================================
     COUNT DISC
     ============================================================ */
  function countDISC(answers, questions) {
    const countP = { D: 0, I: 0, S: 0, C: 0, '*': 0 };
    const countK = { D: 0, I: 0, S: 0, C: 0, '*': 0 };
  
    for (let i = 0; i < questions.length; i++) {
      const ans = answers[i];
      const q = questions[i];
      if (!ans || !q) continue;
  
      const pKey = q.options[ans.p]?.P;
      const kKey = q.options[ans.k]?.K;
  
      if (countP.hasOwnProperty(pKey)) countP[pKey]++;
      if (countK.hasOwnProperty(kKey)) countK[kKey]++;
    }
  
    const change = {};
    ['D', 'I', 'S', 'C', '*'].forEach(k => {
      change[k] = (countP[k] || 0) - (countK[k] || 0);
    });
  
    return { most: countP, least: countK, change };
  }
  
  /* ============================================================
     CLASSIC GRAPH PIXEL
     ============================================================ */
  const classicGraph = [
    { type: 'most', blockData: [
        { label: 4, pixel: [20, 100], values: {
          D: [{val:20, pixel:36},{val:16, pixel:44},{val:15, pixel:52},{val:14, pixel:78},{val:13, pixel:86}],
          I: [{val:17, pixel:36},{val:10, pixel:44},{val:8, pixel:63},{val:7, pixel:78}],
          S: [{val:19, pixel:36},{val:13, pixel:52},{val:11, pixel:68},{val:10, pixel:84}],
          C: [{val:14, pixel:36},{val:10, pixel:52},{val:9, pixel:62},{val:8, pixel:70},{val:7, pixel:78}]
        }},
        { label: 3, pixel: [100, 200], values: {
          D: [{val:12, pixel:110},{val:11, pixel:118},{val:10, pixel:126},{val:9, pixel:156},{val:8, pixel:172},{val:7, pixel:180}],
          I: [{val:6, pixel:118},{val:5, pixel:126},{val:4, pixel:172}],
          S: [{val:9, pixel:110},{val:8, pixel:126},{val:7, pixel:134},{val:6, pixel:172},{val:5, pixel:180}],
          C: [{val:6, pixel:126},{val:5, pixel:156},{val:4, pixel:180}]
        }},
        { label: 2, pixel: [200, 300], values: {
          D: [{val:6, pixel:208},{val:5, pixel:230},{val:4, pixel:238},{val:3, pixel:260}],
          I: [{val:3, pixel:230},{val:2, pixel:260}],
          S: [{val:4, pixel:215},{val:3, pixel:235},{val:2, pixel:290}],
          C: [{val:3, pixel:215},{val:2, pixel:260}]
        }},
        { label: 1, pixel: [300, 400], values: {
          D: [{val:2, pixel:308},{val:1, pixel:340},{val:0, pixel:360}],
          I: [{val:1, pixel:325},{val:0, pixel:351}],
          S: [{val:1, pixel:315},{val:0, pixel:323}],
          C: [{val:1, pixel:325},{val:0, pixel:351}]
        }}
    ]},
    { type: 'least', blockData: [
        { label: 4, pixel: [20, 100], values: {
          D: [{val:0, pixel:36},{val:1, pixel:70},{val:2, pixel:96}],
          I: [{val:0, pixel:44},{val:1, pixel:64}],
          S: [{val:0, pixel:36},{val:1, pixel:52},{val:2, pixel:64}],
          C: [{val:0, pixel:36},{val:1, pixel:52},{val:2, pixel:70}]
        }},
        { label: 3, pixel: [100, 200], values: {
          D: [{val:3, pixel:134},{val:4, pixel:172},{val:5, pixel:199}],
          I: [{val:2, pixel:110},{val:3, pixel:134},{val:4, pixel:172}],
          S: [{val:3, pixel:110},{val:4, pixel:134},{val:5, pixel:164},{val:6, pixel:180}],
          C: [{val:3, pixel:110},{val:4, pixel:134},{val:5, pixel:164},{val:6, pixel:199}]
        }},
        { label: 2, pixel: [200, 300], values: {
          D: [{val:6, pixel:210},{val:7, pixel:230},{val:8, pixel:238},{val:9, pixel:270},{val:10, pixel:278},{val:11, pixel:286}],
          I: [{val:5, pixel:210},{val:6, pixel:255},{val:7, pixel:286}],
          S: [{val:7, pixel:218},{val:8, pixel:238},{val:9, pixel:278}],
          C: [{val:7, pixel:210},{val:9, pixel:270},{val:10, pixel:286}]
        }},
        { label: 1, pixel: [300, 400], values: {
          D: [{val:12, pixel:315},{val:13, pixel:340},{val:14, pixel:348},{val:15, pixel:358},{val:16, pixel:368},{val:18, pixel:378},{val:21, pixel:388}],
          I: [{val:8, pixel:315},{val:9, pixel:340},{val:10, pixel:358},{val:15, pixel:373},{val:19, pixel:388}],
          S: [{val:10, pixel:315},{val:11, pixel:327},{val:12, pixel:340},{val:13, pixel:358},{val:18, pixel:373},{val:19, pixel:388}],
          C: [{val:11, pixel:315},{val:12, pixel:348},{val:13, pixel:378},{val:15, pixel:388}]
        }}
    ]},
    { type: 'change', blockData: [
        { label: 4, pixel: [20, 100], values: {
          D: [{val:20, pixel:36},{val:16, pixel:44},{val:15, pixel:52},{val:14, pixel:60},{val:13, pixel:68},{val:12, pixel:76},{val:10, pixel:84}],
          I: [{val:17, pixel:36},{val:15, pixel:44},{val:8, pixel:60},{val:7, pixel:68},{val:6, pixel:76},{val:5, pixel:84},{val:4, pixel:92}],
          S: [{val:19, pixel:36},{val:15, pixel:44},{val:10, pixel:60},{val:9, pixel:68},{val:8, pixel:76},{val:7, pixel:84}],
          C: [{val:14, pixel:36},{val:7, pixel:52},{val:6, pixel:60},{val:4, pixel:68},{val:3, pixel:84},{val:2, pixel:92}]
        }},
        { label: 3, pixel: [100, 200], values: {
          D: [{val:9, pixel:110},{val:8, pixel:118},{val:7, pixel:126},{val:5, pixel:164},{val:3, pixel:172},{val:1, pixel:199}],
          I: [{val:3, pixel:126},{val:2, pixel:144},{val:1, pixel:164},{val:0, pixel:190}],
          S: [{val:5, pixel:110},{val:4, pixel:118},{val:3, pixel:126},{val:2, pixel:144},{val:1, pixel:164},{val:0, pixel:172}],
          C: [{val:1, pixel:118},{val:0, pixel:144},{val:-1, pixel:172},{val:-2, pixel:190}]
        }},
        { label: 2, pixel: [200, 300], values: {
          D: [{val:0, pixel:210},{val:-2, pixel:218},{val:-3, pixel:226},{val:-4, pixel:234},{val:-6, pixel:270},{val:-7, pixel:278},{val:-9, pixel:286}],
          I: [{val:-1, pixel:210},{val:-2, pixel:234},{val:-3, pixel:252},{val:-4, pixel:278},{val:-5, pixel:286}],
          S: [{val:-1, pixel:210},{val:-2, pixel:218},{val:-3, pixel:226},{val:-4, pixel:234},{val:-5, pixel:252},{val:-6, pixel:278},{val:-7, pixel:286}],
          C: [{val:-3, pixel:210},{val:-4, pixel:218},{val:-5, pixel:270},{val:-6, pixel:278},{val:-7, pixel:286}]
        }},
        { label: 1, pixel: [300, 400], values: {
          D: [{val:-10, pixel:316},{val:-11, pixel:340},{val:-12, pixel:348},{val:-15, pixel:356},{val:-20, pixel:380},{val:-21, pixel:388}],
          I: [{val:-6, pixel:316},{val:-7, pixel:324},{val:-8, pixel:348},{val:-9, pixel:356},{val:-10, pixel:370},{val:-19, pixel:388}],
          S: [{val:-8, pixel:316},{val:-10, pixel:340},{val:-12, pixel:370},{val:-19, pixel:388}],
          C: [{val:-8, pixel:316},{val:-9, pixel:324},{val:-10, pixel:348},{val:-13, pixel:356},{val:-15, pixel:388}]
        }}
    ]}
  ];
  
  function getPixelY(type, axis, val) {
    const g = classicGraph.find(e => e.type === type);
    if (!g) return 400;
  
    let chosenArr = null;
    for (let blk of g.blockData) {
      const arr = blk.values[axis] || [];
      if (!arr.length) continue;
  
      if (val >= arr[arr.length - 1].val && val <= arr[0].val) {
        chosenArr = arr; break;
      }
      if (val >= arr[0].val && val <= arr[arr.length - 1].val) {
        chosenArr = arr; break;
      }
      if (val < arr[arr.length - 1].val) chosenArr = arr;
      if (val > arr[0].val && !chosenArr) chosenArr = arr;
    }
  
    const arr = chosenArr || (g.blockData[0].values[axis] || []);
  
    for (let i = 0; i < arr.length; i++) {
      if (val === arr[i].val) return arr[i].pixel;
      if (val > arr[i].val && i > 0) {
        let prev = arr[i - 1], next = arr[i];
        let prop = (val - prev.val) / (next.val - prev.val);
        return prev.pixel + prop * (next.pixel - prev.pixel);
      }
    }
  
    if (arr.length && val < arr[arr.length - 1].val) return arr[arr.length - 1].pixel;
    if (arr.length && val > arr[0].val) return arr[0].pixel;
    return 400;
  }
  
  function getMidline(tipe) {
    const g = classicGraph.find(e => e.type === tipe);
    if (!g || !Array.isArray(g.blockData) || g.blockData.length === 0) return 200;
    const ys = g.blockData.flatMap(b => Array.isArray(b.pixel) ? b.pixel : []);
    const ymin = Math.min(...ys);
    const ymax = Math.max(...ys);
    return (ymin + ymax) / 2;
  }
  
  function getDominantByMidline(tipe, D, I, S, C) {
    const mid = getMidline(tipe);
    const pts = [
      { key: 'D', y: getPixelY(tipe, 'D', D), val: D },
      { key: 'I', y: getPixelY(tipe, 'I', I), val: I },
      { key: 'S', y: getPixelY(tipe, 'S', S), val: S },
      { key: 'C', y: getPixelY(tipe, 'C', C), val: C },
    ].filter(p => Number.isFinite(p.y))
     .sort((a, b) => a.y - b.y);
  
    let dominan = pts.filter(p => p.y <= mid).map(p => p.key);
    if (dominan.length === 0) dominan = pts.slice(0, 2).map(p => p.key);
    if (dominan.length > 3) dominan = dominan.slice(0, 3);
  
    return dominan;
  }
  
  /* ============================================================
     ANALISA 2/3 DOMINAN
     ============================================================ */
  function analisa2DominanDISC(D, I, S, C, tipe, getPixelYFn) {
    const arr = [
      { key: "D", val: D, y: getPixelYFn(tipe, "D", D) },
      { key: "I", val: I, y: getPixelYFn(tipe, "I", I) },
      { key: "S", val: S, y: getPixelYFn(tipe, "S", S) },
      { key: "C", val: C, y: getPixelYFn(tipe, "C", C) }
    ].filter(o => Number.isFinite(o.y))
     .sort((a, b) => a.y - b.y);
  
    let dominan = getDominantByMidline(tipe, D, I, S, C);
    if (!dominan || dominan.length === 0) dominan = arr.slice(0, 2).map(x => x.key);
    if (dominan.length > 3) dominan = dominan.slice(0, 3);
  
    const ranking = arr.map(x => x.key);
    const nama = namaPanggilan();
  
    const desk = {
      D: `${nama} memiliki rasa ego yang tinggi dan cenderung invidualis dengan standard yang sangat tinggi.`,
      I: `Profile: Pure I ${nama} merupakan pribadi yang antusias dan optimistik, lebih suka mencapai sasaran melalui orang lain.`,
      S: `${nama} merupakan individu konsisten yang berusaha menjaga lingkungan/suasana yang tidak berubah.`,
      C: `${nama} seorang yang praktis, cakap dan unik. Mampu menilai diri sendiri dan kritis terhadap dirinya dan orang lain.`
    };
  
    function gabunganDeskripsi(a, b, c) {
      const parts = [a, b, c].filter(Boolean).map(x => String(x).toUpperCase());
      const letters = [...new Set(parts.join('').split(''))]
        .filter(ch => ['D','I','S','C'].includes(ch))
        .slice(0, 3);
  
      if (letters.length === 1) return desk[letters[0]] || '';
      if (letters.length === 2) return (desk[letters[0]] || '') + '<br>' + (desk[letters[1]] || '');
      if (letters.length >= 3) {
        return letters.map(h => desk[h] || '').join('<br>');
      }
      return '';
    }
  
    function analisaPolaGrafik() {
      if (!arr.length) return "";
      const tertinggi = arr[0].y;
      const terendah = arr[arr.length - 1].y;
      const jarak = terendah - tertinggi;
      const faktorDominan = [...dominan];
      let analisa = "";
  
      if (jarak > 200) {
        analisa += `<b>Pola Ekstrim:</b> Perbedaan sangat besar antara tipe dominan dan tipe lemah.<br>`;
      }
      if (jarak < 100) {
        analisa += `<b>Pola Seimbang:</b> Profil fleksibel, mudah beradaptasi.<br>`;
      }
      if (faktorDominan.length === 2) {
        const gab = faktorDominan.join('');
        if (gab === 'CD' || gab === 'DC') analisa += `<b>Pola Perfeksionis Tegas:</b> fokus mutu + ketegasan eksekusi.<br>`;
        else if (gab === 'IS' || gab === 'SI') analisa += `<b>Pola Influencer Stabil:</b> relasi kuat + konsistensi tim.<br>`;
        else if (gab === 'DS' || gab === 'SD') analisa += `<b>Pola Stabil Tegas:</b> tenang, tahan banting.<br>`;
        else if (gab === 'IC' || gab === 'CI') analisa += `<b>Pola Analitis Persuasif:</b> kombinasi logika dan komunikasi.<br>`;
        else if (gab === 'DI' || gab === 'ID') analisa += `<b>Pola Leader Inspiratif:</b> karisma + dorongan hasil.<br>`;
        else if (gab === 'SC' || gab === 'CS') analisa += `<b>Pola Detail Stabil:</b> ketelitian + kesabaran proses.<br>`;
      }
      if (faktorDominan.length === 3) {
        analisa += `<b>Pola Multi-Dominan:</b> ${faktorDominan.join(', ')} sama kuat secara grafik.<br>`;
      }
      return analisa;
    }
  
    const deskripsi = gabunganDeskripsi(...dominan);
  
    return {
      dominan,
      ranking: ranking.join(' > '),
      deskripsi,
      analisaPola: analisaPolaGrafik(),
      nilai: {
        D: (arr.find(i => i.key === 'D') || {}).val,
        I: (arr.find(i => i.key === 'I') || {}).val,
        S: (arr.find(i => i.key === 'S') || {}).val,
        C: (arr.find(i => i.key === 'C') || {}).val
      },
      y: {
        D: (arr.find(i => i.key === 'D') || {}).y,
        I: (arr.find(i => i.key === 'I') || {}).y,
        S: (arr.find(i => i.key === 'S') || {}).y,
        C: (arr.find(i => i.key === 'C') || {}).y
      }
    };
  }
  
  /* ============================================================
     DRAW DISC CLASSIC
     ============================================================ */
  function drawDISCClassic(canvasOrId, tipe, D, I, S, C, warnaGaris = '#2176C7') {
    const canvas = (typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
  
    const x0 = 12;
    const w = 128;
    const top = 20;
    const bottom = 400;
    const MIDLINE_Y = 200;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
  
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    [20, 100, 200, 300, 400].forEach(y => {
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + w, y);
      ctx.stroke();
    });
  
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x0 + i * 32, top);
      ctx.lineTo(x0 + i * 32, bottom);
      ctx.stroke();
    }
  
    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#444';
    ctx.moveTo(x0, MIDLINE_Y);
    ctx.lineTo(x0 + w, MIDLINE_Y);
    ctx.stroke();
    ctx.setLineDash([]);
  
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 10px Segoe UI';
    const levelLabels = [[20, '4'], [100, '3'], [200, '2'], [300, '1']];
    levelLabels.forEach(([y, t]) => ctx.fillText(t, x0 - 10, y + 4));
  
    const xs = [x0 + 33, x0 + 65, x0 + 97, x0 + 129];
  
    const points = [
      [xs[0], getPixelY(tipe, 'D', D)],
      [xs[1], getPixelY(tipe, 'I', I)],
      [xs[2], getPixelY(tipe, 'S', S)],
      [xs[3], getPixelY(tipe, 'C', C)],
    ];
  
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.strokeStyle = warnaGaris;
    ctx.lineWidth = 2.7;
    ctx.stroke();
  
    const warnaTitik = ['#e74a3b', '#f6c23e', '#1cc88a', '#4e73df'];
    [D, I, S, C].forEach((v, idx) => {
      const [px, py] = points[idx];
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, 2 * Math.PI, false);
      ctx.fillStyle = warnaTitik[idx];
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.font = 'bold 13px Segoe UI';
      ctx.fillStyle = '#222';
      ctx.fillText(String(v), px - 7, py - 13);
    });
  
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillStyle = '#1a232e';
    ['D', 'I', 'S', 'C'].forEach((t, i) => ctx.fillText(t, xs[i] - 6, 415));
  
    ctx.restore();
  }
  
  /* ============================================================
     SHOW DISC RESULT
     ============================================================ */
  function showDISCResult() {
    const hasilDISC = countDISC(appState.answers.DISC, tests.DISC.questions);
    const identity = appState.identity || {};
  
    let starMost = Number(hasilDISC.most['*'] || 0);
    let starLeast = Number(hasilDISC.least['*'] || 0);
    let totalStar = starMost + starLeast;
    let isInvalid = (totalStar > 8);
  
    let analisaHTML = "";
  
    if (!isInvalid) {
      const most = analisa2DominanDISC(hasilDISC.most.D, hasilDISC.most.I, hasilDISC.most.S, hasilDISC.most.C, 'most', getPixelY);
      const least = analisa2DominanDISC(hasilDISC.least.D, hasilDISC.least.I, hasilDISC.least.S, hasilDISC.least.C, 'least', getPixelY);
      const change = analisa2DominanDISC(hasilDISC.change.D, hasilDISC.change.I, hasilDISC.change.S, hasilDISC.change.C, 'change', getPixelY);
  
      function rekomendasiPeran() {
        const roles = {
          "DI": ["Manajer Penjualan", "Entrepreneur", "Pemimpin Tim", "Marketing Director"],
          "ID": ["Marketing, Public Relations", "Event Organizer", "Business Development"],
          "DS": ["Manajer Operasional", "Supervisor Produksi", "Koordinator Proyek"],
          "SD": ["Koordinator SDM", "Staf Pelayanan Publik"],
          "DC": ["Manajer Proyek Teknis", "Insinyur Senior", "Konsultan Spesialis"],
          "CD": ["Auditor", "Analis Sistem", "Project Manager"],
          "IS": ["HRD Manager", "Konselor", "Guru", "Customer Relations Manager"],
          "SI": ["Guru SD", "Fasilitator Komunitas"],
          "IC": ["Marketing Analyst", "Konsultan Bisnis"],
          "CI": ["Peneliti", "Content Planner", "Data Scientist"],
          "SC": ["Analis Data", "Akuntan", "Quality Assurance"],
          "CS": ["QA Tester", "Admin Proses", "Laboran"]
        };
        const kode = most.dominan.join('');
        const kode2 = most.dominan.slice().reverse().join('');
        return roles[kode] || roles[kode2] || ["Beragam, sesuaikan dengan minat dan pengalaman"];
      }
  
      function cocokPosisi() {
        if (!identity.position) return "";
        const persyaratan = {
          "Administrator": { sangat: ["SC","CS","DC"], cocok: ["CD"], cukup: ["SD","IS"] },
          "Dosen/Guru": { sangat: ["IS","IC","SI","SC"], cocok: ["ID","SD"], cukup: ["CS","CI"] },
          "Technical Staff": { sangat: ["DC","SC"], cocok: ["CD","CS"], cukup: ["SD","CI"] },
          "IT Staff": { sangat: ["CS","SC","CD"], cocok: ["SD","CI"], cukup: ["SI","IC"] },
          "Housekeeping": { sangat: ["SC","CS"], cocok: ["SI","IC"], cukup: ["CI"] }
        };
  
        const kode = most.dominan.join('');
        const kode2 = most.dominan.slice().reverse().join('');
        const req = persyaratan[identity.position] || {};
  
        let tingkat = "TIDAK COCOK";
        let simbol = "X";
  
        if ((req.sangat || []).includes(kode) || (req.sangat || []).includes(kode2)) {
          tingkat = "SANGAT SESUAI"; simbol = "SS";
        } else if ((req.cocok || []).includes(kode) || (req.cocok || []).includes(kode2)) {
          tingkat = "COCOK"; simbol = "C";
        } else if ((req.cukup || []).includes(kode) || (req.cukup || []).includes(kode2)) {
          tingkat = "CUKUP COCOK"; simbol = "CC";
        } else if ([].concat(req.sangat||[], req.cocok||[], req.cukup||[]).some(x =>
          kode.includes(x[0]) || kode.includes(x[1]) || kode2.includes(x[0]) || kode2.includes(x[1]))) {
          tingkat = "KURANG COCOK"; simbol = "K";
        }
  
        return `
          <div style="margin-top:16px;padding:14px;background:${
            tingkat === "SANGAT SESUAI" ? '#e8f5e9' :
            tingkat === "COCOK" ? '#f0f7fa' :
            tingkat === "CUKUP COCOK" ? '#eef5ff' :
            tingkat === "KURANG COCOK" ? '#fff7e6' : '#ffebee'
          };border-radius:8px;">
            <b>Analisis Posisi "${identity.position}":</b>
            <div>
              ${tingkat === "SANGAT SESUAI" ? '✅ <span style="color:#18b172;font-weight:bold;">Cocok Sekali</span>' :
                tingkat === "COCOK" ? '✔️ <span style="color:#2176c7;font-weight:bold;">Cocok</span>' :
                tingkat === "CUKUP COCOK" ? 'ℹ️ <span style="color:#395b9a;font-weight:bold;">Cukup Cocok</span>' :
                tingkat === "KURANG COCOK" ? '⚠️ <span style="color:#de9000;font-weight:bold;">Kurang Cocok</span>' :
                '❌ <span style="color:#c00;font-weight:bold;">Tidak Cocok</span>'}
            </div>
          </div>
        `;
      }
  
      analisaHTML = `
        <div style="margin-top:28px;border-radius:11px;background:#f8fafb;padding:20px 26px;">
          <div style="display:flex;gap:20px;flex-wrap:wrap;">
            <div style="flex:1;min-width:300px;">
              <div style="font-weight:600;color:#2176C7;font-size:1.12em;">Analisis Mask / Most (P):</div>
              <div style="font-size:0.97em;color:#677;">Perilaku alami, motivasi utama saat nyaman atau tanpa tekanan.</div>
              <div style="margin-bottom:7px;">
                <b>Dua dominan utama:</b> <span style="color:#2176C7">${most.dominan.join(' & ')}</span><br>
                <b>Urutan:</b> ${most.ranking}<br>
                <div style="margin-top:10px;">${most.deskripsi}</div>
              </div>
  
              <div style="font-weight:600;color:#DE9000;font-size:1.12em;margin-top:20px;">Analisis Pressure / Least (K):</div>
              <div style="margin-bottom:7px;">
                <b>Dua dominan utama:</b> <span style="color:#DE9000">${least.dominan.join(' & ')}</span><br>
                <b>Urutan:</b> ${least.ranking}<br>
                <div style="margin-top:10px;">${least.deskripsi}</div>
              </div>
            </div>
  
            <div style="flex:1;min-width:300px;">
              <div style="font-weight:600;color:#18b172;font-size:1.12em;">Analisis Self / Change (P-K):</div>
              <div>
                <b>Dua dominan utama:</b> <span style="color:#18b172">${change.dominan.join(' & ')}</span><br>
                <b>Urutan:</b> ${change.ranking}<br>
                <div style="margin-top:10px;">${change.deskripsi}</div>
              </div>
  
              <div style="margin:20px 0 0 0;font-weight:600;color:#1a232e;">Rekomendasi Karir:</div>
              <ul style="margin-top:8px;padding-left:20px;">
                ${rekomendasiPeran().map(r => `<li>${r}</li>`).join('')}
              </ul>
  
              ${cocokPosisi()}
            </div>
          </div>
        </div>
      `;
    }
  
    document.getElementById('app').innerHTML = `
      <div class="card" style="max-width:780px;margin:34px auto 0 auto;padding:32px 32px 38px 32px;border-radius:18px;box-shadow:0 6px 32px #9992;">
        <h2 style="text-align:center;font-size:2em;">
          Hasil DISC ${appState.identity?.nickname ? appState.identity.nickname : 'Anda'}
        </h2>
  
        ${isInvalid ? `
          <div style="margin:14px auto 22px auto;max-width:500px;background:#fee2e2;color:#c00;border-radius:12px;padding:19px 18px 17px 18px;font-size:1.16em;text-align:center;font-weight:600;box-shadow:0 2px 10px #fbb;">
            HASIL INVALID<br>
            <div style="margin:6px 0 0 0;font-weight:400;color:#a33;font-size:.99em;">
              (Terdeteksi pola pengisian jawaban yang tidak wajar, silakan ulangi tes.)
            </div>
          </div>
        ` : ''}
  
        <div style="display:flex;gap:26px;justify-content:center;align-items:flex-end;margin:26px 0 18px 0;flex-wrap:wrap;">
          <div style="width:170px;height:420px;">
            <canvas id="discMost" width="170" height="420"></canvas>
            <div style="text-align:center;margin-top:6px;font-weight:600;">Mask / Most (P)</div>
          </div>
          <div style="width:170px;height:420px;">
            <canvas id="discLeast" width="170" height="420"></canvas>
            <div style="text-align:center;margin-top:6px;font-weight:600;">Pressure / Least (K)</div>
          </div>
          <div style="width:170px;height:420px;">
            <canvas id="discChange" width="170" height="420"></canvas>
            <div style="text-align:center;margin-top:6px;font-weight:600;">Self / Change (P-K)</div>
          </div>
        </div>
  
        <table style="margin:18px auto 0 auto;font-size:1.13em;min-width:370px;text-align:center;border-collapse:collapse;">
          <tr style="background:#f8fafb;font-weight:bold">
            <th style="padding:5px 18px">Line</th>
            <th style="padding:5px 14px">D</th>
            <th style="padding:5px 14px">I</th>
            <th style="padding:5px 14px">S</th>
            <th style="padding:5px 14px">C</th>
            <th style="padding:5px 8px;color:#999;">*</th>
          </tr>
          <tr>
            <td><b>Most (P)</b></td>
            <td>${hasilDISC.most.D || 0}</td>
            <td>${hasilDISC.most.I || 0}</td>
            <td>${hasilDISC.most.S || 0}</td>
            <td>${hasilDISC.most.C || 0}</td>
            <td style="color:#999;">${hasilDISC.most['*'] || 0}</td>
          </tr>
          <tr>
            <td><b>Least (K)</b></td>
            <td>${hasilDISC.least.D || 0}</td>
            <td>${hasilDISC.least.I || 0}</td>
            <td>${hasilDISC.least.S || 0}</td>
            <td>${hasilDISC.least.C || 0}</td>
            <td style="color:#999;">${hasilDISC.least['*'] || 0}</td>
          </tr>
          <tr>
            <td><b>Change</b></td>
            <td>${hasilDISC.change.D >= 0 ? '+' : ''}${hasilDISC.change.D || 0}</td>
            <td>${hasilDISC.change.I >= 0 ? '+' : ''}${hasilDISC.change.I || 0}</td>
            <td>${hasilDISC.change.S >= 0 ? '+' : ''}${hasilDISC.change.S || 0}</td>
            <td>${hasilDISC.change.C >= 0 ? '+' : ''}${hasilDISC.change.C || 0}</td>
            <td style="background:#eee;">${hasilDISC.change['*'] >= 0 ? '+' : ''}${hasilDISC.change['*'] || 0}</td>
          </tr>
        </table>
  
        ${analisaHTML}
  
        <div style="margin-top:32px;text-align:center;">
          <button class="btn" onclick="renderHome()">Kembali ke Beranda</button>
        </div>
      </div>
    `;
  
    if (!isInvalid) {
      drawDISCClassic('discMost',   'most',   hasilDISC.most.D,   hasilDISC.most.I,   hasilDISC.most.S,   hasilDISC.most.C,   "#2176C7");
      drawDISCClassic('discLeast',  'least',  hasilDISC.least.D,  hasilDISC.least.I,  hasilDISC.least.S,  hasilDISC.least.C,  "#DE9000");
      drawDISCClassic('discChange', 'change', hasilDISC.change.D, hasilDISC.change.I, hasilDISC.change.S, hasilDISC.change.C, "#18b172");
    }
  }
  
  function stripHTML(html) {
    return String(html)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li>/gi, '- ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<ul>/gi, '')
      .replace(/<\/ul>/gi, '')
      .replace(/<b>(.*?)<\/b>/gi, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^\s+/gm, '');
  }
  
  console.log('[TEST-DISC] ✓ Loaded');
