/* ============================================================
   js/00q-assessors.js — Multi-kategori Assessor
   ------------------------------------------------------------
   Dua daftar independen:
   - 'fgd'       → untuk Form FGD (00o-fgd.js, 00p-fgd-admin.js)
   - 'interview' → untuk Form Interview (00m-interview.js)
   
   Firebase:
   - sgs_config/assessors_fgd
   - sgs_config/assessors_interview
   
   API:
   - ASSESSORS.getList('fgd' | 'interview')
   - ASSESSORS.save('fgd' | 'interview', array)
   - ASSESSORS.onChange('fgd' | 'interview', cb)
   - ASSESSORS.load('fgd' | 'interview')     → Promise
   - ASSESSORS.has('fgd' | 'interview', name)
   - ASSESSORS.reset('fgd' | 'interview')
   ============================================================ */

(function () {
  'use strict';

  const CATEGORIES = ['fgd', 'interview'];

  const DEFAULTS = {
    fgd:       ['NUG', 'GUN', 'DED', 'DEF', 'NET', 'YAC', 'ALF'],
    interview: ['NUG', 'GUN', 'DED', 'DEF', 'NET', 'YAC', 'ALF']
  };

  const FIREBASE_PATHS = {
    fgd:       'sgs_config/assessors_fgd',
    interview: 'sgs_config/assessors_interview'
  };

  const state = {
    fgd: {
      list: DEFAULTS.fgd.slice(),
      ready: false,
      listeners: [],
      ref: null
    },
    interview: {
      list: DEFAULTS.interview.slice(),
      ready: false,
      listeners: [],
      ref: null
    }
  };

  function normCategory(cat) {
    if (CATEGORIES.indexOf(cat) === -1) throw new Error('Kategori tidak valid: ' + cat);
    return cat;
  }

  /* ============================================================
     LOAD
     ============================================================ */
  function loadOnce(cat) {
    return new Promise((resolve) => {
      const c = normCategory(cat);
      const s = state[c];

      if (typeof firebase === 'undefined' || !firebase.apps.length) {
        resolve(s.list.slice());
        return;
      }

      firebase.database().ref(FIREBASE_PATHS[c]).once('value')
        .then(snap => {
          const val = snap.val();
          if (Array.isArray(val) && val.length > 0) {
            s.list = val.filter(x => typeof x === 'string' && x.trim());
          } else {
            s.list = DEFAULTS[c].slice();
          }
          s.ready = true;
          resolve(s.list.slice());
        })
        .catch(err => {
          console.warn('[ASSESSORS] Gagal load ' + c + ':', err.message);
          s.list = DEFAULTS[c].slice();
          s.ready = true;
          resolve(s.list.slice());
        });
    });
  }

  /* ============================================================
     REALTIME LISTENER
     ============================================================ */
  function startListener(cat) {
    const c = normCategory(cat);
    const s = state[c];

    if (typeof firebase === 'undefined' || !firebase.apps.length) return;
    if (s.ref) return;

    s.ref = firebase.database().ref(FIREBASE_PATHS[c]);

    s.ref.on('value', snap => {
      const val = snap.val();
      if (Array.isArray(val) && val.length > 0) {
        s.list = val.filter(x => typeof x === 'string' && x.trim());
      } else {
        s.list = DEFAULTS[c].slice();
      }
      s.ready = true;
      notify(c);
    });
  }

  function notify(cat) {
    const c = normCategory(cat);
    const s = state[c];
    s.listeners.forEach(cb => {
      try { cb(s.list.slice()); } catch (e) {}
    });
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */
  window.ASSESSORS = {
    CATEGORIES: CATEGORIES.slice(),

    getList(cat) {
      return state[normCategory(cat)].list.slice();
    },

    isReady(cat) {
      return state[normCategory(cat)].ready;
    },

    has(cat, name) {
      return state[normCategory(cat)].list.indexOf(name) !== -1;
    },

    async load(cat) {
      if (cat === undefined) {
        await Promise.all(CATEGORIES.map(c => loadOnce(c)));
        CATEGORIES.forEach(c => startListener(c));
        return {
          fgd: state.fgd.list.slice(),
          interview: state.interview.list.slice()
        };
      }
      await loadOnce(cat);
      startListener(cat);
      return state[normCategory(cat)].list.slice();
    },

    async save(cat, newList) {
      const c = normCategory(cat);

      if (!Array.isArray(newList)) throw new Error('List harus array');

      const clean = newList
        .map(s => String(s || '').trim().toUpperCase())
        .filter(Boolean);

      const unique = [...new Set(clean)];

      if (unique.length === 0) throw new Error('List tidak boleh kosong');

      if (typeof firebase === 'undefined' || !firebase.apps.length) {
        throw new Error('Firebase belum siap');
      }

      await firebase.database().ref(FIREBASE_PATHS[c]).set(unique);
      state[c].list = unique;
      notify(c);
      return unique;
    },

    onChange(cat, cb) {
      const c = normCategory(cat);
      if (typeof cb !== 'function') return () => {};
      state[c].listeners.push(cb);
      cb(state[c].list.slice());
      return () => {
        state[c].listeners = state[c].listeners.filter(x => x !== cb);
      };
    },

    async reset(cat) {
      const c = normCategory(cat);
      return this.save(c, DEFAULTS[c]);
    },

    /** Untuk debugging / admin panel */
    getAll() {
      return {
        fgd: state.fgd.list.slice(),
        interview: state.interview.list.slice()
      };
    }
  };

  /* ============================================================
     AUTO-INIT
     ============================================================ */
  async function init() {
    await Promise.all(CATEGORIES.map(c => loadOnce(c)));
    CATEGORIES.forEach(c => startListener(c));
    console.log('[ASSESSORS] ✓ FGD:', state.fgd.list.join(', '));
    console.log('[ASSESSORS] ✓ Interview:', state.interview.list.join(', '));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 800));
  } else {
    setTimeout(init, 800);
  }

})();