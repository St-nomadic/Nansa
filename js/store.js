/* NANSA store — 절대 기준 2 준수: 모든 공유 상태는 단일 스토어(SOT)에 집중.
   state.data 는 localStorage('nansa.v1')에 영속화되고, state.route/ui 는 세션 한정. */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'nansa.v1';
  const MAX_DOC_HISTORY = 20;      // S-YRHRVV: 최소 20단계 되돌리기
  const MAX_PROFILE_HISTORY = 15;  // S-MHXUKU: 변경 이력 타임라인

  let listeners = [];
  let toastTimer = null;

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function deepCopy(v) { return JSON.parse(JSON.stringify(v)); }

  function defaultData() {
    return {
      jobs: deepCopy(global.NANSA_SEED.jobs),
      profile: deepCopy(global.NANSA_SEED.profile),
      applications: deepCopy(global.NANSA_SEED.applications),
      documents: {},        // docId -> document (S-KITKZI 자동 저장)
      checklists: {},       // jobId -> checklist items (F-BEDFKB)
      genSettings: { tone: '표준', length: '보통', lang: '한국어' }, // S-FXFFCX: 최근 설정이 기본값
      profileHistory: [],   // F-AJWNNY
    };
  }

  function loadData() {
    try {
      const raw = global.localStorage && localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw);
      // merge over defaults so newly added fields survive old saves
      return Object.assign(defaultData(), parsed);
    } catch (e) {
      console.warn('[nansa] failed to load saved state, starting fresh', e);
      return defaultData();
    }
  }

  const state = {
    session: { loggedIn: false, email: '' },
    route: { screen: 'login', jobId: null, docId: null },
    ui: {
      toast: '', modal: null, searchQuery: '', skillFilter: '',
      registerInput: '', registering: false, registerError: '',
      docFilterJobId: '', compare: null, generating: false,
      loginEmail: '', loginPassword: '', newSkillInput: '', historyView: 'list',
    },
    data: loadData(),
  };

  function persist() {
    try {
      if (global.localStorage) localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    } catch (e) {
      console.warn('[nansa] persist failed', e);
    }
  }

  function notify() { listeners.forEach((fn) => fn(state)); }

  /**
   * Central mutation entry. mutator(state) mutates in place.
   * opts.silent: skip re-render (used while typing so focus is kept).
   */
  function update(mutator, opts) {
    mutator(state);
    persist();
    if (!(opts && opts.silent)) notify();
  }

  function subscribe(fn) { listeners.push(fn); }

  function toast(msg) {
    clearTimeout(toastTimer);
    update((s) => { s.ui.toast = msg; });
    toastTimer = setTimeout(() => update((s) => { s.ui.toast = ''; }), 2600);
  }

  function go(screen, patch) {
    update((s) => {
      s.route.screen = screen;
      Object.assign(s.route, patch || {});
      s.ui.modal = null;
    });
  }

  /* ---------- document helpers ---------- */

  function getDoc(docId) { return state.data.documents[docId] || null; }

  function latestDocFor(jobId, docType) {
    const docs = Object.values(state.data.documents)
      .filter((d) => d.jobId === jobId && d.type === docType)
      .sort((a, b) => b.version - a.version);
    return docs[0] || null;
  }

  // Push current sections onto the undo stack before an edit (S-YRHRVV).
  function pushDocHistory(doc) {
    doc.history = doc.history || [];
    doc.history.push(deepCopy(doc.sections));
    if (doc.history.length > MAX_DOC_HISTORY) doc.history.shift();
    doc.future = [];
  }

  function undoDoc(doc) {
    if (!doc.history || !doc.history.length) return false;
    doc.future = doc.future || [];
    doc.future.push(deepCopy(doc.sections));
    doc.sections = doc.history.pop();
    return true;
  }

  function redoDoc(doc) {
    if (!doc.future || !doc.future.length) return false;
    doc.history = doc.history || [];
    doc.history.push(deepCopy(doc.sections));
    doc.sections = doc.future.pop();
    return true;
  }

  /* ---------- profile change history (F-AJWNNY) ---------- */

  function snapshotProfile(label) {
    const h = state.data.profileHistory;
    h.push({ at: new Date().toISOString(), label, snapshot: deepCopy(state.data.profile) });
    if (h.length > MAX_PROFILE_HISTORY) h.shift();
  }

  /* ---------- checklist (S-SCYNFO) ---------- */

  function defaultChecklist() {
    return [
      { id: 'keywords', label: 'JD 핵심 키워드 반영 확인', done: false },
      { id: 'proofread', label: '오탈자/문장 흐름 점검', done: false },
      { id: 'sections', label: '필수 섹션 누락 확인', done: false },
      { id: 'format', label: '파일 형식/페이지 수/용량 확인', done: false },
      { id: 'privacy', label: '개인정보 과다 노출 점검', done: false },
    ];
  }

  function checklistFor(jobId) {
    if (!state.data.checklists[jobId]) state.data.checklists[jobId] = defaultChecklist();
    return state.data.checklists[jobId];
  }

  global.NansaStore = {
    state, update, subscribe, toast, go, uid, deepCopy,
    getDoc, latestDocFor, pushDocHistory, undoDoc, redoDoc,
    snapshotProfile, defaultChecklist, checklistFor,
    STORAGE_KEY,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.NansaStore;
})(typeof window !== 'undefined' ? window : globalThis);
