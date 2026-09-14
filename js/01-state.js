/* =========================================================
   STATE APLIKASI
   ========================================================= */
   const appState = {
    currentTest:     null,
    currentSubtest:  0,
    currentQuestion: 0,
    timer:           null,
    timeLeft:        0,
  
    answers: {
      IST:     [],
      KRAEPLIN:[],
      DISC:    [],
      PAPI:    [],
      BIGFIVE: [],
    },
  
    kraeplinHistory:    {},
    kraeplinKey:        [],
    kraeplinStartTime:  0,
    kraeplinEndTime:    0,
    kraeplinWaktuKolom: [],
  
    grafis: { orang:'', rumah:'', pohon:'' },
  
    completed: {
      IST:      false,
      KRAEPLIN: false,
      DISC:     false,
      PAPI:     false,
      BIGFIVE:  false,
      GRAFIS:   false,
      EXCEL:    false,
      TYPING:   false,
      SUBJECT:  false,
    },
  
    isKraeplinTrial: false,
    kraeplinStarted: false,
    currentColumn:   0,
    currentRow:      {},
    timerActive:     false,
  
    identity: {
      name:'', nickname:'', email:'', phone:'', dob:'', age:'',
      status:'', addressKTP:'', addressCurrent:'', sameAddress:false,
      position:'', teacherLevel:'', techRole:'', education:'',
      explanation:'',
      date: new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'}),
      alumniSGS:false, alumniSD:false, alumniSMP:false, alumniSMA:false,
      alumniSDText:'', alumniSMPText:'', alumniSMAText:'',
    },
  
    adminAnswers: { EXCEL: null, TYPING: null },
  
    /* Alur */
    showTestCards:        false,
    selectedTests:        [],
    subjectUpload:        [],
    subjectSelected:      null,
    subjectStartTime:     0,
    subjectDisqualified:  false,
    typingText:           '',
    typingStart:          0,
    typingEnded:          false,
    typingTimer:          null,
    hasilOCEAN:           null,
    tempDISC:             {},
    discError:            '',
  };
  
  window.appState = appState;
  console.log('[STATE] ✓ Loaded');