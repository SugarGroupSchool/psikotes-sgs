/* =========================================================
   IST NORMS — SW Tables, IQ, Konversi
   =========================================================
   
   STATUS NORMA:
   Menggunakan norma IST Jerman (adaptasi UI 1973) yang menjadi
   standar praktik psikotes di Indonesia hingga saat ini.
   
   Tabel SW (Standard Wert) di bawah sudah disesuaikan dengan
   rentang usia psikotes Indonesia (17-60 tahun) dan dibagi
   dalam 7 kelompok usia.
   
   CATATAN: Idealnya penormaan ulang dilakukan setiap 5 tahun
   dengan sampel lokal Indonesia. Jika Anda memiliki data
   penelitian lokal, ganti nilai di SW_BANDS_RAW, SW_GE_EXT,
   dan TOTAL_SW_BY_AGE dengan data hasil penelitian Anda.
   ========================================================= */

/* ---- Util Usia (minimal 21) ---- */
function clampMin21(age) {
  if (!Number.isFinite(age)) return 21;
  return Math.max(21, Math.floor(Number(age)));
}

function getAgeYearsForNorms() {
  let age = parseInt(appState?.identity?.age, 10);
  if (!age && appState?.id?.age) age = parseInt(appState.id.age, 10);
  if (!age && appState?.identity?.dob) {
    const dob = new Date(appState.identity.dob);
    if (!Number.isNaN(dob.getTime())) {
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear()
        - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    }
  }
  return clampMin21(Number.isFinite(age) ? age : NaN);
}

/* ---- Norma fallback (stanine generik) ---- */
const IST_NORMS = {
  SE: [{ minAge:17, maxAge:25, thresholds:[4,11,23,40,60,77,89,96] },
       { minAge:26, maxAge:35, thresholds:[4,11,23,40,60,77,89,96] },
       { minAge:36, maxAge:65, thresholds:[4,11,23,40,60,77,89,96] }],
  WA: [{ minAge:17, maxAge:65, thresholds:[4,11,23,40,60,77,89,96] }],
  AN: [{ minAge:17, maxAge:65, thresholds:[4,11,23,40,60,77,89,96] }],
  GE: [{ minAge:17, maxAge:65, thresholds:[4,11,23,40,60,77,89,96] }],
  RA: [{ minAge:17, maxAge:65, thresholds:[4,11,23,40,60,77,89,96] }],
  ZR: [{ minAge:17, maxAge:65, thresholds:[4,11,23,40,60,77,89,96] }],
  FA: [{ minAge:17, maxAge:65, thresholds:[4,11,23,40,60,77,89,96] }],
  WU: [{ minAge:17, maxAge:65, thresholds:[4,11,23,40,60,77,89,96] }],
  ME: [{ minAge:17, maxAge:65, thresholds:[4,11,23,40,60,77,89,96] }]
};

function pctToSWStanine(p01, thresholds=[4,11,23,40,60,77,89,96]) {
  if (p01 == null || isNaN(p01)) return 'N/A';
  const pct = p01 * 100;
  for (let i=0;i<thresholds.length;i++) if (pct <= thresholds[i]) return i+1;
  return 9;
}

function convertRWtoSW(code, ageYears, rw, totalMax){
  if (totalMax == null || totalMax <= 0) return 'N/A';
  const a = clampMin21(ageYears);
  const bands = IST_NORMS[code] || [];
  const band = bands.find(b => a >= b.minAge && a <= b.maxAge);
  const p01 = Math.max(0, Math.min(1, rw / totalMax));
  if (!band) return pctToSWStanine(p01);
  return pctToSWStanine(p01, band.thresholds);
}

function stanineToSWx(sn){
  if (sn === 'N/A' || sn == null || isNaN(sn)) return 'N/A';
  return 100 + (Number(sn) - 5) * 10;
}

/* ---- SW TABLE per usia ---- */
const SW_BANDS_RAW = {
  AGE18: `
72 64 76 75   75 79 74 74 73
75 66 79 76.5 78 81 76 76 76
78 69 81 78   81 84 79 80 78
81 73 83 80   84 86 82 83 80
83 77 86 82   86 88 85 86 83
86 81 89 83.5 89 91 88 89 85
89 85 91 85   92 93 90 92 88
92 89 94 87   95 95 93 94 90
94 92 96 89   98 98 96 97 92
97 96 99 91   101 100 99 100 95
100 100 101 93 104 102 101 103 97
103 104 104 94 107 105 104 106 99
106 108 106 95 109 107 107 109 102
108 112 109 96.5 112 110 110 112 104
111 115 112 98 115 112 113 115 106
114 119 114 100 118 114 115 118 109
117 123 117 102 121 117 118 121 111
119 127 119 103.5 124 119 121 123 113
122 131 122 105 126 122 124 126 116
125 135 125 106.5 129 124 127 129 118
128 138 127 108 132 126 130 132 121
`,
  LE20: `
68 61 74 72 74 78 74 74 70
70 64 76 74 77 80 77 77 73
73 66 79 76 80 82 79 80 76
76 70 81 78 83 85 82 83 78
79 74 84 79 86 87 85 86 81
82 78 86 81 89 90 87 89 83
85 81 89 83 91 92 90 91 86
87 85 91 85 93 94 92 94 89
90 89 93 86 97 96 95 97 91
93 93 97 88 100 99 98 100 93
96 97 99 89 103 101 100 103 96
99 101 102 91 106 104 103 106 98
101 105 104 92 109 106 106 109 101
104 109 107 94 111 108 109 111 103
107 112 109 96 114 111 111 114 106
110 116 112 98 117 113 114 117 108
113 120 115 100 120 115 117 120 111
116 124 117 101 123 118 120 123 113
119 127 120 102 126 120 122 126 116
122 132 122 104 128 123 125 128 118
124 135 125 106 131 125 128 131 121
`,
  LE24: `
66 63 75 74 75 80 75 75 74
68 66 78 76 77 82 78 78 77
71 69 80 77 80 84 80 80 79
74 73 83 79 83 86 83 83 81
78 76 85 80 86 89 85 86 84
80 80 88 82 88 91 88 89 86
83 83 90 83 91 93 91 92 88
86 87 92 85 94 95 93 95 91
89 91 95 86 97 97 96 97 93
92 95 97 88 99 99 98 100 95
95 98 100 89 102 102 101 103 98
98 102 102 91 105 104 103 106 100
101 106 104 92 107 106 106 108 102
104 109 107 94 110 108 108 111 105
107 113 109 95 113 110 111 114 107
110 116 111 97 115 112 113 117 109
113 120 114 98 118 115 116 120 112
116 124 116 100 121 117 119 122 114
119 128 119 102 123 119 121 125 116
123 131 121 104 126 121 124 128 119
126 135 123 105 129 124 127 131 121
`,
  LE28: `
65 65 77 73 72 77 74 74 77
67 69 79 75 76 80 77 77 80
70 73 81 76 80 82 80 80 82
73 75 84 78 82 85 82 83 84
76 79 86 80 84 87 85 85 86
79 82 88 82 87 90 88 88 89
82 85 91 83 90 92 90 91 91
86 89 93 85 93 94 93 94 93
89 92 95 87 96 97 96 97 95
92 95 98 89 98 99 99 100 98
95 99 100 90 101 101 101 103 100
98 102 102 91 104 104 104 106 102
101 105 105 92 107 106 107 109 104
104 109 107 94 110 109 109 112 107
108 112 109 96 112 111 112 115 109
111 115 112 98 115 113 115 118 111
114 119 114 99 118 116 118 121 113
117 122 116 101 120 118 120 123 116
120 125 119 102 123 120 123 126 118
123 129 121 104 126 123 126 130 120
126 132 123 105 130 127 130 133 122
`,
  LE33: `
65 65 78 75 75 80 75 76 78
68 69 80 77 77 82 77 79 80
71 72 82 78 80 84 80 81 83
74 75 84 80 83 86 83 84 85
78 79 86 81 85 89 85 87 87
81 82 88 83 88 91 88 90 89
82 85 90 84 91 93 91 92 92
86 89 93 86 93 95 93 95 94
89 92 96 87 96 97 95 98 97
92 96 98 89 99 100 99 101 99
93 100 100 90 102 102 101 104 101
98 103 102 92 104 104 103 106 103
101 106 104 93 107 106 106 109 106
104 110 107 96 110 108 109 112 108
107 113 109 97 112 111 111 115 110
110 117 111 98 115 113 115 118 112
113 120 113 99 118 115 117 120 114
116 123 116 101 121 117 120 123 117
119 127 118 102 124 120 123 126 119
122 130 120 103 126 122 127 129 122
126 134 122 104 129 124 128 131 124
`,
  LE39: `
68 69 79 76 75 79 77 77 81
71 72 81 78 77 81 80 80 83
75 75 83 79 80 83 82 82 86
77 78 86 81 83 86 85 85 88
80 81 89 82 86 88 87 87 90
83 85 91 84 88 90 90 90 92
86 88 93 85 91 92 93 93 94
89 91 95 86 94 95 95 96 97
92 94 97 87 97 97 98 98 99
95 97 100 89 99 99 101 101 101
98 101 102 90 102 102 103 104 103
101 104 104 92 105 104 105 106 106
104 107 106 93 109 106 108 109 108
107 110 108 95 111 108 110 112 110
110 114 111 96 113 111 113 115 112
113 117 113 98 116 113 115 117 115
115 120 114 99 117 113 117 119 116
119 123 117 101 120 115 120 123 118
121 126 120 102 125 120 123 125 122
124 130 122 104 128 122 126 128 124
128 133 124 105 130 124 128 131 127
`,
  LE45: `
73 73 81 76 77 80 79 78 82
75 76 83 78 79 82 81 81 84
78 80 85 79 82 84 84 84 87
81 83 88 81 85 86 86 86 89
84 85 90 82 88 89 89 89 91
87 89 92 84 90 91 91 91 93
90 92 94 85 93 93 93 95 96
92 95 97 87 96 95 97 97 98
95 98 99 88 98 98 99 100 100
98 101 101 90 101 100 102 103 102
101 104 103 91 104 102 104 105 104
104 108 106 93 106 104 107 108 107
107 111 108 94 109 107 109 111 109
110 114 110 96 112 109 112 114 111
115 120 114 99 117 113 117 119 116
118 123 117 100 120 115 120 122 118
121 126 119 102 123 118 122 124 120
124 130 121 103 125 120 125 127 122
127 133 123 105 128 122 128 130 125
130 136 126 106 131 125 130 133 127
`,
  GT45: `
75 75 82 77 77 81 80 78 84
78 78 85 79 79 83 82 81 86
81 81 87 80 81 85 85 84 89
84 84 89 81 84 88 88 87 91
87 87 91 82 88 90 91 89 93
90 90 94 84 91 92 93 92 95
93 94 96 85 94 94 96 95 98
96 97 98 87 97 97 98 98 100
99 100 101 88 99 99 101 101 102
102 103 103 90 102 101 104 103 105
104 106 105 91 104 103 106 106 107
107 110 107 93 107 105 109 109 109
110 113 110 94 110 108 112 112 111
113 116 112 96 113 110 115 115 114
116 119 114 97 116 112 117 117 116
119 123 116 99 119 114 119 120 118
122 126 119 100 121 116 122 123 120
125 129 121 102 125 118 125 125 123
128 132 123 103 128 120 128 129 125
131 135 126 105 131 123 131 131 127
134 139 129 106 134 125 133 134 130
`
};

const SW_GE_EXT = {
  AGE18: [109.5,111,113,115,116.5,118,119.5,121,123,125,126.5,128],
  LE20 : [108,109,111,112,114,116,118,119,121,122,124,126],
  LE24 : [107,108,110,111,113,114,116,117,119,120,122,123],
  LE28 : [107,108,110,112,114,115,117,118,120,122,124,125],
  LE33 : [106,107,109,110,112,113,115,116,118,120,121,122],
  LE39 : [107,108,110,111,113,114,116,117,119,120,122,124],
  LE45 : [108,109,111,112,114,115,117,118,120,121,123,124],
  GT45 : [108,109,110,111,113,115,117,118,120,121,123,125]
};

const SW_CODES = ['SE','WA','AN','GE','RA','ZR','FA','WU','ME'];
const SW_TABLE = {};

for (const [band, raw] of Object.entries(SW_BANDS_RAW)) {
  const rows = raw.trim().split(/\n+/).map(r => r.trim().split(/\s+/).map(Number));
  const bandObj = {};
  SW_CODES.forEach((c, j) => bandObj[c] = rows.map(row => row[j]));
  if (SW_GE_EXT[band]) bandObj.GE = bandObj.GE.concat(SW_GE_EXT[band]);
  SW_TABLE[band] = bandObj;
}

function getAgeBandForSW(ageYears) {
  const a = clampMin21(ageYears);
  if (a <= 24) return 'LE24';
  if (a <= 28) return 'LE28';
  if (a <= 33) return 'LE33';
  if (a <= 39) return 'LE39';
  if (a <= 45) return 'LE45';
  return 'GT45';
}

const RW_INDEXING_MODE = 'round';
function clampIndex(v, max) { return Math.max(0, Math.min(max, v)); }

function rwToSW_ViaTable(code, ageYears, rw, totalMax) {
  const band = getAgeBandForSW(ageYears);
  const tbl = SW_TABLE[band];

  if (!tbl || !tbl[code]) {
    const fallbackMax = code === 'GE' ? 32 : 20;
    const sn = convertRWtoSW(code, clampMin21(ageYears), Number(rw) || 0, fallbackMax);
    return stanineToSWx(sn);
  }

  const hardMax = code === 'GE' ? 32 : 20;
  const tableMax = (tbl[code]?.length ?? (hardMax + 1)) - 1;
  const idxMax = Math.min(hardMax, tableMax);

  const rawIdx = Number(rw) || 0;
  const idx = clampIndex(
    RW_INDEXING_MODE === 'floor' ? Math.floor(rawIdx) : Math.round(rawIdx),
    idxMax
  );

  return tbl[code][idx];
}

/* ---- ΣRW → SW JML ---- */
function buildSWSteps(values18){
  const arr = Array(181).fill(0);
  let idx = 1;
  for (let i = 0; i < 18; i++) {
    const v = Number(values18[i] || 0);
    for (let j = 0; j < 10 && idx <= 180; j++, idx++) arr[idx] = v;
  }
  return arr;
}

const TOTAL_SW_BY_AGE = {
  LE20: buildSWSteps([65,69,72,76,80,84,88,92,95,99,103,107,111,115,118,122,126,130]),
  LE24: buildSWSteps([65,69,72,76,80,84,88,92,95,99,103,107,111,115,118,122,126,130]),
  LE28: buildSWSteps([67,70,74,77,81,85,89,92,96,100,103,107,111,115,118,122,125,129]),
  LE33: buildSWSteps([68,71,75,79,82,86,89,93,96,100,104,107,111,114,118,121,125,128]),
  LE39: buildSWSteps([71,74,78,81,85,88,91,95,98,102,105,109,112,115,119,122,126,129]),
  LE45: buildSWSteps([73,76,80,83,86,90,93,97,100,103,107,110,114,118,121,124,128,131]),
  LE60: buildSWSteps([75,79,81,85,89,92,95,99,102,105,109,112,115,119,122,125,129,132])
};

function pickTotalSWAgeBand(ageYears){
  const a = Math.floor(Number(
    ageYears ?? ((typeof getAgeYearsForNorms==='function') ? getAgeYearsForNorms() : 25)
  ));
  if (a <= 20) return 'LE20';
  if (a <= 24) return 'LE24';
  if (a <= 28) return 'LE28';
  if (a <= 33) return 'LE33';
  if (a <= 39) return 'LE39';
  if (a <= 45) return 'LE45';
  return 'LE60';
}

function getTotalSWFromRW(totalRW, ageYears){
  const band = pickTotalSWAgeBand(ageYears);
  const table = TOTAL_SW_BY_AGE[band] || TOTAL_SW_BY_AGE.LE24;
  const rw = Math.max(0, Math.min(180, Math.floor(Number(totalRW || 0))));
  return table[rw];
}

/* ---- SW → IQ ---- */
const IQ_BY_SW = {
  58:37, 59:39, 60:40, 61:42, 62:43, 63:45, 64:46, 65:48, 66:49, 67:51,
  68:52, 69:54, 70:55, 71:57, 72:58, 73:60, 74:61, 75:63, 76:64, 77:66,
  78:67, 79:69, 80:70, 81:72, 82:73, 83:75, 84:76, 85:78, 86:79, 87:81,
  88:82, 89:84, 90:85, 91:87, 92:88, 93:90, 94:91, 95:93, 96:94, 97:96,
  98:97, 99:99, 100:100, 101:102, 102:103, 103:105, 104:106, 105:108, 106:109, 107:111,
  108:112, 109:114, 110:115, 111:117, 112:118, 113:120, 114:121, 115:123, 116:124, 117:126,
  118:127, 119:129, 120:130, 121:132, 122:133, 123:135, 124:136, 125:138, 126:139, 127:141,
  128:142, 129:144, 130:145, 131:147, 132:148, 133:150, 134:151, 135:153, 136:154, 137:156,
  138:157, 139:159, 140:160
};

function getIQFromSW(sw){
  const keys = Object.keys(IQ_BY_SW).map(Number).sort((a,b)=>a-b);
  if (!keys.length) return null;
  const s = Math.round(Number(sw || 0));
  const min = keys[0], max = keys[keys.length-1];
  if (s <= min) return IQ_BY_SW[min];
  if (s >= max) return IQ_BY_SW[max];
  if (s in IQ_BY_SW) return IQ_BY_SW[s];

  let lo = min, hi = max;
  for (let i = 0; i < keys.length-1; i++){
    if (keys[i] < s && s < keys[i+1]) { lo = keys[i]; hi = keys[i+1]; break; }
  }
  const t = (s - lo) / (hi - lo);
  return Math.round(IQ_BY_SW[lo] + t * (IQ_BY_SW[hi] - IQ_BY_SW[lo]));
}

function iqCategory(iq){
  if (iq == null || isNaN(iq)) return '-';
  const v = Math.round(Number(iq));
  if (v >= 131) return 'Tingkat Kecerdasan sangat superior atau jenius.';
  if (v >= 120) return 'Tingkat Kecerdasan superior.';
  if (v >= 111) return 'Tingkat Kecerdasan tinggi dalam kategori normal (Bright Normal).';
  if (v >= 91)  return 'Tingkat Kecerdasan normal atau rata-rata.';
  if (v >= 80)  return 'Tingkat Kecerdasan rendah yang masih dalam kategori normal (Dull Normal).';
  if (v >= 70)  return 'Tingkat Kecerdasan rendah atau keterbelakangan mental.';
  return 'Di bawah 70.';
}

/* ---- Util SW ---- */
function letterCategoryFromSw(v){
  const n = Math.round(toNumFlexible(v));
  if (isNaN(n)) return '-';
  if (n <= 80) return 'a';
  if (n <= 94) return 'b';
  if (n <= 99) return 'c';
  if (n <= 104) return 'd';
  if (n <= 118) return 'e';
  return 'f';
}

function swCategory5(sw) {
  if (sw === 'N/A' || sw == null || isNaN(sw)) return '-';
  const v = Number(sw);
  if (v <= 80)  return 'Sangat Rendah';
  if (v <= 94)  return 'Rendah';
  if (v <= 99)  return 'Sedang';
  if (v <= 104) return 'Cukup';
  if (v <= 118) return 'Tinggi';
  return 'Sangat Tinggi';
}

function defaultMaxByCode(code){ return code === 'GE' ? 40 : 20; }

function computeDominasi(summary){
  const get = c => {
    const r = Array.isArray(summary)
      ? summary.find(x => String(x?.code||'').toUpperCase() === c)
      : null;
    const v = (r && typeof r.sw !== 'undefined') ? toNumFlexible(r.sw) : 0;
    return isNaN(v) ? 0 : v;
  };
  const left  = get('GE') + get('RA');
  const right = get('AN') + get('ZR');
  const delta = left - right;
  const T = 10;
  if (delta >  T) return 'FESTIGUNG (Mantap/Eksak)';
  if (delta < -T) return 'FLEKSIBILITÄT (Fleksibel/Non-Eksak)';
  return 'Seimbang';
}

/* ---- SW Line Chart ---- */
function drawSWLineChart(doc, x, y, w, h, summary) {
  const CODES = ['SE','WA','AN','GE','RA','ZR','FA','WU','ME'];
  const sws = CODES.map(c => {
    const r = Array.isArray(summary) ? summary.find(s => String(s?.code||'').toUpperCase() === c) : null;
    return toNumFlexible(r?.sw);
  });
  if (!sws.length || sws.every(v => v <= 0)) return y;

  const minY = 70, maxY = 180;
  const tickValues = [70, 90, 110, 130, 150, 170, 180];
  const stepX = w / (CODES.length - 1);

  doc.setDrawColor(180);
  doc.rect(x, y, w, h);

  tickValues.forEach(val => {
    const gy = y + h - ((val - minY) / (maxY - minY)) * h;
    doc.setDrawColor(220);
    doc.line(x, gy, x + w, gy);
    doc.setTextColor(120);
    doc.setFontSize(6);
    doc.text(String(val), x - 2, gy + 2, { align: 'right' });
  });

  const clamp = v => Math.max(minY, Math.min(maxY, v));
  doc.setDrawColor(60);
  for (let i = 0; i < sws.length; i++) {
    const px = x + i * stepX;
    const py = y + h - ((clamp(sws[i]) - minY) / (maxY - minY)) * h;
    if (i) {
      const ppx = x + (i - 1) * stepX;
      const ppy = y + h - ((clamp(sws[i - 1]) - minY) / (maxY - minY)) * h;
      doc.line(ppx, ppy, px, py);
    }
    doc.circle(px, py, 0.9, 'F');
  }

  doc.setTextColor(60);
  doc.setFontSize(6);
  CODES.forEach((c, i) => {
    const px = x + i * stepX;
    doc.text(c, px - 3.2, y + h + 6);
  });

  return y + h + 10;
}

/* ---- Kesesuaian Posisi Guru & IT ---- */
function computeGuruFitLetter(summary, iqFromSW){
  const getSW = code => {
    const r = Array.isArray(summary) ? summary.find(x => String(x?.code||'').toUpperCase()===code) : null;
    return toNumFlexible(r?.sw);
  };
  const w = { SE:0.25, WA:0.25, AN:0.20, GE:0.20, RA:0.05, ZR:0.05 };
  let comp = 0, totW = 0;
  Object.keys(w).forEach(k => {
    const v = getSW(k);
    if (v > 0){ comp += v*w[k]; totW += w[k]; }
  });
  if (totW > 0) comp /= totW;
  else if (iqFromSW != null && !isNaN(Number(iqFromSW))) comp = Number(iqFromSW);
  else comp = 100;

  if (comp >= 110) return 'a';
  if (comp >= 105) return 'b';
  if (comp >= 95)  return 'c';
  return 'd';
}

function computeITStaffFitLetter(summary, iq){
  const sw = c => {
    const r = Array.isArray(summary) ? summary.find(x => String(x?.code||'').toUpperCase()===c) : null;
    return toNumFlexible(r?.sw);
  };
  const an=sw('AN'), ge=sw('GE'), ra=sw('RA'), zr=sw('ZR'), fa=sw('FA'), wu=sw('WU');
  const keySubtes = [an, ge, ra, zr, fa, wu];
  const strongCount = keySubtes.filter(s => s >= 105).length;
  const adequateCount = keySubtes.filter(s => s >= 100).length;

  if (iq >= 110 && strongCount >= 3) return 'a';
  if (iq >= 100 && (strongCount >= 2 || adequateCount >= 4)) return 'b';
  if (iq >= 90 && adequateCount >= 2) return 'c';
  return 'd';
}

function buildGuruReasons(summary){
  const sw = c => {
    const r = Array.isArray(summary) ? summary.find(x => String(x?.code||'').toUpperCase()===c) : null;
    return toNumFlexible(r?.sw);
  };
  const se=sw('SE'), wa=sw('WA'), an=sw('AN'), ge=sw('GE'), ra=sw('RA'), zr=sw('ZR'),
        me=sw('ME'), fa=sw('FA'), wu=sw('WU');
  const reasons = [];
  const notes   = [];

  if (se>=105 || wa>=105) reasons.push('Kekuatan verbal (SE/WA) mendukung penjelasan materi dan instruksi kelas.');
  else if (se>=100 || wa>=100) reasons.push('Komunikasi verbal memadai untuk interaksi pengajaran.');
  if (an>=105 || ge>=105) reasons.push('Penalaran analogi & kategorisasi (AN/GE) membantu memberi contoh dan menyusun pertanyaan tingkat tinggi.');
  else if (an>=100 || ge>=100) reasons.push('Penalaran konseptual cukup untuk mengaitkan konsep antar materi.');
  if (me>=100) reasons.push('Memori kerja & retensi (ME) menunjang pengelolaan banyak informasi saat mengajar.');
  if (ra>=100 || zr>=100) reasons.push('Ketelitian/kecepatan numerik (RA/ZR) berguna untuk penilaian dan materi berhitung.');
  if (fa>=100 || wu>=100) reasons.push('Visual-spasial (FA/WU) membantu membuat ilustrasi/alat peraga.');

  if (se<95 && wa<95) notes.push('Perkuat komunikasi lisan (latihan diksi, ringkas-jelas).');
  if (an<95 || ge<95) notes.push('Latih penyusunan analogi & pengelompokan konsep.');
  if (me<95)          notes.push('Tingkatkan konsistensi memori kerja (chunking, catatan penyangga).');
  if (ra<95 || zr<95) notes.push('Perbaiki akurasi/kelancaran berhitung (drill bertahap).');

  return { reasons, notes };
}

function buildITStaffReasons(summary){
  const sw = c => {
    const r = Array.isArray(summary) ? summary.find(x => String(x?.code||'').toUpperCase()===c) : null;
    return toNumFlexible(r?.sw);
  };
  const an=sw('AN'), ge=sw('GE'), ra=sw('RA'), zr=sw('ZR'), fa=sw('FA'), wu=sw('WU');
  const reasons = [];
  const notes   = [];

  if (an>=105 || ge>=105) reasons.push('Kemampuan analogi dan kategorisasi (AN/GE) mendukung pemecahan masalah logis.');
  else if (an>=100 || ge>=100) reasons.push('Kemampuan logika dan kategorisasi memadai untuk tugas IT.');
  if (ra>=105 || zr>=105) reasons.push('Kemampuan numerik dan deret (RA/ZR) berguna untuk algoritma dan logika programming.');
  else if (ra>=100 || zr>=100) reasons.push('Kemampuan numerik cukup untuk pemahaman algoritma.');
  if (fa>=105 || wu>=105) reasons.push('Kemampuan visual-spasial (FA/WU) menunjang desain antarmuka dan arsitektur sistem.');
  else if (fa>=100 || wu>=100) reasons.push('Kemampuan visual-spasial memadai untuk memahami diagram dan struktur.');

  if (an<95 && ge<95) notes.push('Perlu latihan logika dan analogi (berlatih soal algoritma).');
  if (ra<95 && zr<95) notes.push('Perlu penguatan dalam hal numerik dan pola deret.');
  if (fa<95 && wu<95) notes.push('Perlu latihan visual-spasial (membaca diagram, puzzle).');

  return { reasons, notes };
}

console.log('[DATA-IST-NORMS] ✓ Loaded — 7 band usia (LE24, LE28, LE33, LE39, LE45, GT45, AGE18)');