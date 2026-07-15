/* NANSA app controller — event delegation, actions, render loop. */
(function (global) {
  'use strict';

  const Store = global.NansaStore;
  const Views = global.NansaViews;
  const Gen = global.NansaGenerator;
  const JD = global.NansaJD;
  const Exporter = global.NansaExporter;

  const root = document.getElementById('app');
  const today = () => new Date().toISOString().slice(0, 10);

  /* ---------- render loop with focus preservation ---------- */

  function render() {
    let focusKey = null, selStart = 0, selEnd = 0;
    const ae = document.activeElement;
    if (ae && ae.dataset && ae.dataset.keepFocus) {
      focusKey = ae.dataset.keepFocus;
      try { selStart = ae.selectionStart; selEnd = ae.selectionEnd; } catch (e) { /* non-text */ }
    }
    root.innerHTML = Views.render();
    if (focusKey) {
      const el = root.querySelector(`[data-keep-focus="${focusKey}"]`);
      if (el) {
        el.focus();
        try { el.setSelectionRange(selStart, selEnd); } catch (e) { /* non-text */ }
      }
    }
  }

  Store.subscribe(render);

  /* ---------- job helpers ---------- */

  const LOGO_COLORS = ['#5B37ED', '#0064FF', '#00A05B', '#E8590C', '#C2255C', '#0B7285'];

  function jobFromAnalysis(a, rawInput) {
    const company = a.company || '';
    return {
      id: Store.uid('job'),
      company, title: a.title || '', location: a.location || '',
      deadline: a.deadline || '', applyUrl: a.sourceUrl || '',
      logoColor: LOGO_COLORS[Math.floor(Math.random() * LOGO_COLORS.length)],
      logoText: (company || 'NEW').slice(0, 2),
      duties: a.duties || [], requirements: a.requirements || [], preferred: a.preferred || [],
      skills: a.skills || [], keywords: a.keywords || [], seniority: a.seniority || '',
      rawText: a.rawText || '', sourceUrl: a.sourceUrl || '',
      bookmarked: false, userRegistered: true,
      createdAt: new Date().toISOString(),
      _rawInput: rawInput,
    };
  }

  function findJob(s, id) { return s.data.jobs.find((j) => j.id === id); }

  /* ---------- document lifecycle ---------- */

  function createDocument(s, job, docType, emphasisIds, baseDoc) {
    const latest = Store.latestDocFor(job.id, docType);
    const version = (latest ? latest.version : 0) + 1;
    const settings = Store.deepCopy(s.data.genSettings);
    const result = baseDoc
      ? { sections: Store.deepCopy(baseDoc.sections), overlapSkills: baseDoc.overlapSkills, missing: baseDoc.missing, matchScore: baseDoc.matchScore }
      : Gen.generate(job, s.data.profile, settings, emphasisIds, docType);
    const doc = {
      id: Store.uid('doc'), jobId: job.id, type: docType,
      name: Gen.docFileName(job, docType, version, today()),
      version, settings, emphasisIds: emphasisIds.slice(),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      sections: result.sections, overlapSkills: result.overlapSkills,
      missing: result.missing, matchScore: result.matchScore,
      locked: false, history: [], future: [],
    };
    s.data.documents[doc.id] = doc; // S-KITKZI: 생성 즉시 '내 서류'에 자동 저장
    return doc;
  }

  function exportDocById(docId, fmt) {
    const s = Store.state;
    const doc = s.data.documents[docId];
    if (!doc) return;
    const job = findJob(s, doc.jobId) || {};
    const p = s.data.profile;
    const headerLines = [
      p.name,
      `${job.company || ''} ${job.title || ''} 지원 · ${Views.DOC_LABEL[doc.type]} v${doc.version}`,
      [p.email, p.phone].filter(Boolean).join(' · '),
      (p.links || []).map((l) => `${l.label}: ${l.url}`).join(' · '),
    ];
    if (fmt === 'pdf') {
      const ok = Exporter.exportPdf(doc.name, headerLines, doc.sections);
      Store.toast(ok ? 'PDF 인쇄 창을 열었어요 — "PDF로 저장"을 선택하세요' : '팝업이 차단됐어요. 팝업을 허용해 주세요.');
    } else if (fmt === 'doc') {
      Exporter.exportDoc(doc.name, headerLines, doc.sections);
      Store.toast(`${doc.name}.doc 파일로 내보냈어요`);
    } else if (fmt === 'copy') {
      Exporter.copyText(doc.sections).then((ok) => Store.toast(ok ? '문서 전체를 클립보드에 복사했어요' : '복사에 실패했어요'));
    }
  }

  /* ---------- click actions ---------- */

  const clickActions = {
    nav(el) { Store.go(el.dataset.screen); },
    login() {
      Store.update((s) => {
        s.session.loggedIn = true;
        s.session.email = s.ui.loginEmail || s.data.profile.email;
        s.route.screen = 'home';
      });
    },
    logout() {
      Store.update((s) => {
        s.session.loggedIn = false;
        s.ui.loginEmail = ''; s.ui.loginPassword = '';
        s.route.screen = 'login';
      });
    },

    'open-job'(el) { Store.go('jobDetail', { jobId: el.dataset.job }); },
    'toggle-bookmark'(el) {
      Store.update((s) => {
        const j = findJob(s, el.dataset.job);
        if (j) j.bookmarked = !j.bookmarked;
      });
    },
    'filter-skill'(el) { Store.update((s) => { s.ui.skillFilter = el.dataset.skill; }); },
    'filter-docs'(el) { Store.update((s) => { s.ui.docFilterJobId = el.dataset.job; }); },

    'open-register'() { Store.update((s) => { s.ui.modal = { type: 'register' }; s.ui.registerInput = ''; s.ui.registerError = ''; }); },
    'close-modal'() { Store.update((s) => { s.ui.modal = null; }); },
    'submit-register'() {
      const s = Store.state;
      if (s.ui.registering) return;
      const input = s.ui.registerInput;
      const validation = JD.validateInput(input);
      if (!validation.ok) {
        Store.update((st) => { st.ui.registerError = validation.reason; });
        return;
      }
      Store.update((st) => { st.ui.registering = true; st.ui.registerError = ''; });
      setTimeout(() => {
        try {
          const analysis = JD.analyze(input);
          const job = jobFromAnalysis(analysis, input);
          Store.update((st) => {
            st.data.jobs.push(job);
            st.ui.registering = false; st.ui.modal = null;
            st.route.screen = 'jobDetail'; st.route.jobId = job.id;
          });
          Store.toast(analysis.needsBody ? '공고를 등록했어요 — JD 본문을 붙여넣어 분석을 완료하세요' : '공고를 분석해 등록했어요');
        } catch (err) {
          Store.update((st) => { st.ui.registering = false; st.ui.registerError = err.message; });
        }
      }, 700);
    },
    'analyze-body'(el) {
      const jobId = el.dataset.job;
      const body = (Store.state.ui['_jdBody_' + jobId] || '').trim();
      const validation = JD.validateInput(body);
      if (!validation.ok || /^https?:/i.test(body)) {
        Store.toast(validation.ok ? 'URL이 아닌 공고 본문 텍스트를 붙여넣어 주세요' : validation.reason);
        return;
      }
      const analysis = JD.analyze(body);
      Store.update((s) => {
        const j = findJob(s, jobId);
        if (!j) return;
        j.duties = analysis.duties; j.requirements = analysis.requirements; j.preferred = analysis.preferred;
        j.skills = analysis.skills; j.keywords = analysis.keywords; j.seniority = analysis.seniority;
        j.rawText = analysis.rawText;
        if (!j.company) j.company = analysis.company;
        if (!j.title) j.title = analysis.title;
        if (!j.deadline) j.deadline = analysis.deadline;
        if (!j.location) j.location = analysis.location;
        if (j.company) j.logoText = j.company.slice(0, 2);
      });
      Store.toast('JD 본문을 분석해 공고에 반영했어요');
    },

    'go-generate'(el) {
      const s = Store.state;
      const jobId = el.dataset.job;
      const docType = el.dataset.type;
      const latest = Store.latestDocFor(jobId, docType);
      Store.go('generate', {
        jobId, docType,
        docId: latest && !latest.locked ? latest.id : null,
        emphasisIds: s.data.profile.experiences.slice(0, 2).map((e) => e.id),
      });
    },
    'open-doc'(el) {
      const doc = Store.getDoc(el.dataset.doc);
      if (!doc) return;
      Store.go('generate', {
        jobId: doc.jobId, docType: doc.type, docId: doc.id,
        emphasisIds: (doc.emphasisIds && doc.emphasisIds.length) ? doc.emphasisIds.slice() : Store.state.data.profile.experiences.slice(0, 2).map((e) => e.id),
      });
    },
    'new-version'(el) {
      // S-XFLEBO: 기존 최신 버전을 복사해 새 버전 초안으로 시작
      const s = Store.state;
      const jobId = el.dataset.job;
      const docType = el.dataset.type;
      const job = findJob(s, jobId);
      const latest = Store.latestDocFor(jobId, docType);
      if (!job) return;
      let newDoc;
      Store.update((st) => { newDoc = createDocument(st, job, docType, (latest && latest.emphasisIds) || [], latest); });
      Store.go('generate', { jobId, docType, docId: newDoc.id, emphasisIds: newDoc.emphasisIds });
      Store.toast(`v${newDoc.version} 새 버전을 만들었어요 (이전 버전 복사)`);
    },
    'set-doctype'(el) {
      const s = Store.state;
      const docType = el.dataset.type;
      const latest = Store.latestDocFor(s.route.jobId, docType);
      Store.update((st) => {
        st.route.docType = docType;
        st.route.docId = latest ? latest.id : null;
      });
    },
    'gen-setting'(el) {
      // S-FXFFCX: 선택 결과는 다음 생성의 기본값으로 저장
      Store.update((s) => { s.data.genSettings[el.dataset.group] = el.dataset.value; });
    },
    generate(el) {
      const jobId = el.dataset.job;
      const docType = el.dataset.type;
      Store.update((s) => { s.ui.generating = true; });
      setTimeout(() => {
        Store.update((s) => {
          const job = findJob(s, jobId);
          if (!job) { s.ui.generating = false; return; }
          const emphasisIds = s.route.emphasisIds || [];
          const existing = s.route.docId ? s.data.documents[s.route.docId] : null;
          if (existing && !existing.locked) {
            // S-UPMATY: 같은 문서에 재생성 (이전 내용은 undo 스택에 보존)
            Store.pushDocHistory(existing);
            const result = Gen.generate(job, s.data.profile, s.data.genSettings, emphasisIds, docType);
            Object.assign(existing, {
              sections: result.sections, overlapSkills: result.overlapSkills,
              missing: result.missing, matchScore: result.matchScore,
              settings: Store.deepCopy(s.data.genSettings), emphasisIds: emphasisIds.slice(),
              updatedAt: new Date().toISOString(),
            });
          } else {
            const doc = createDocument(s, job, docType, emphasisIds);
            s.route.docId = doc.id;
          }
          s.ui.generating = false;
        });
        Store.toast('맞춤 서류 초안을 생성했어요 — 내 서류에 자동 저장됐어요');
      }, 900);
    },
    'regen-section'(el) {
      const doc = Store.getDoc(el.dataset.doc);
      const idx = Number(el.dataset.idx);
      if (!doc || doc.locked) return;
      Store.update((s) => {
        const job = findJob(s, doc.jobId);
        Store.pushDocHistory(doc);
        const fresh = Gen.generate(job, s.data.profile, doc.settings, doc.emphasisIds || [], doc.type);
        const match = fresh.sections.find((sec) => sec.id === doc.sections[idx].id);
        if (match) doc.sections[idx] = match;
        doc.updatedAt = new Date().toISOString();
      });
      Store.toast('문단을 다시 생성했어요 (되돌리기 가능)');
    },
    refine(el) {
      const doc = Store.getDoc(el.dataset.doc);
      const idx = Number(el.dataset.idx);
      const op = el.dataset.op;
      if (!doc || doc.locked) return;
      Store.update((s) => {
        Store.pushDocHistory(doc);
        const sec = doc.sections[idx];
        sec.body = Gen.refine(sec.body, op, { matched: sec.matched });
        doc.updatedAt = new Date().toISOString();
      });
      Store.toast(`${Gen.REFINER_LABELS[op]} 보정을 적용했어요 (되돌리기 가능)`);
    },
    'doc-undo'(el) {
      const doc = Store.getDoc(el.dataset.doc);
      if (!doc) return;
      Store.update(() => { Store.undoDoc(doc); });
    },
    'doc-redo'(el) {
      const doc = Store.getDoc(el.dataset.doc);
      if (!doc) return;
      Store.update(() => { Store.redoDoc(doc); });
    },
    export(el) { exportDocById(el.dataset.doc, el.dataset.fmt); },

    'go-checklist'(el) { Store.go('checklist', { jobId: el.dataset.job }); },
    'toggle-check'(el) {
      Store.update((s) => {
        const items = Store.checklistFor(el.dataset.job);
        const item = items.find((i) => i.id === el.dataset.item);
        if (item) item.done = !item.done;
      });
    },
    'mark-applied'(el) {
      const jobId = el.dataset.job;
      Store.update((s) => {
        const jobDocs = Object.values(s.data.documents).filter((d) => d.jobId === jobId);
        jobDocs.forEach((d) => { d.locked = true; }); // S-PLVHGO: 제출본 스냅샷 잠금
        let app = s.data.applications.find((a) => a.jobId === jobId);
        if (!app) {
          app = {
            id: Store.uid('app'), jobId, status: '지원완료', appliedAt: today(),
            note: '', snapshotDocIds: jobDocs.map((d) => d.id),
            timeline: [{ date: today(), label: '지원 완료' }],
          };
          s.data.applications.push(app);
        } else {
          app.status = '지원완료';
          app.appliedAt = app.appliedAt || today();
          app.snapshotDocIds = [...new Set([...(app.snapshotDocIds || []), ...jobDocs.map((d) => d.id)])];
          app.timeline.push({ date: today(), label: '지원 정보 업데이트' });
        }
        s.route.screen = 'history';
      });
      Store.toast('지원을 기록했어요 — 제출 서류는 스냅샷으로 잠겼어요');
    },

    'open-compare'(el) {
      Store.update((s) => { s.ui.modal = { type: 'compare', jobId: el.dataset.job, docType: el.dataset.type, aId: null, bId: null }; });
    },

    /* profile */
    'add-link'() {
      Store.update((s) => {
        s.data.profile.links = s.data.profile.links || [];
        s.data.profile.links.push({ id: Store.uid('link'), label: '', url: '' });
        Store.snapshotProfile('링크 추가');
      });
    },
    'remove-link'(el) {
      Store.update((s) => {
        s.data.profile.links = (s.data.profile.links || []).filter((l) => l.id !== el.dataset.link);
        Store.snapshotProfile('링크 삭제');
      });
    },
    'edit-exp'(el) {
      const s = Store.state;
      const exp = s.data.profile.experiences.find((e) => e.id === el.dataset.exp);
      const draft = exp
        ? { company: exp.company, role: exp.role, period: exp.period, bulletsText: exp.bullets.join('\n'), tagsText: (exp.tags || []).join(', ') }
        : { company: '', role: '', period: '', bulletsText: '', tagsText: '' };
      Store.update((st) => { st.ui.modal = { type: 'exp', expId: exp ? exp.id : null, draft }; });
    },
    'save-exp'() {
      Store.update((s) => {
        const m = s.ui.modal;
        if (!m || m.type !== 'exp') return;
        const d = m.draft;
        if (!d.company.trim() && !d.role.trim()) { Store.toast('회사 또는 역할을 입력해 주세요'); return; }
        const parsed = {
          company: d.company.trim(), role: d.role.trim(), period: d.period.trim(),
          bullets: d.bulletsText.split('\n').map((b) => b.trim()).filter(Boolean),
          tags: d.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
        };
        if (m.expId) {
          const exp = s.data.profile.experiences.find((e) => e.id === m.expId);
          Object.assign(exp, parsed);
          Store.snapshotProfile(`경험 수정: ${parsed.company}`);
        } else {
          s.data.profile.experiences.push(Object.assign({ id: Store.uid('exp') }, parsed));
          Store.snapshotProfile(`경험 추가: ${parsed.company}`);
        }
        s.ui.modal = null;
      });
    },
    'remove-exp'(el) {
      Store.update((s) => {
        const exp = s.data.profile.experiences.find((e) => e.id === el.dataset.exp);
        s.data.profile.experiences = s.data.profile.experiences.filter((e) => e.id !== el.dataset.exp);
        Store.snapshotProfile(`경험 삭제: ${exp ? exp.company : ''}`);
      });
    },
    'add-skill'() {
      Store.update((s) => {
        const v = s.ui.newSkillInput.trim();
        if (!v) return;
        if (!s.data.profile.skills.some((sk) => sk.toLowerCase() === v.toLowerCase())) {
          s.data.profile.skills.push(v);
          Store.snapshotProfile(`스킬 추가: ${v}`);
        }
        s.ui.newSkillInput = '';
      });
    },
    'add-skill-direct'(el) {
      Store.update((s) => {
        const v = el.dataset.skill;
        if (!s.data.profile.skills.includes(v)) {
          s.data.profile.skills.push(v);
          Store.snapshotProfile(`스킬 추가: ${v}`);
        }
      });
    },
    'remove-skill'(el) {
      Store.update((s) => {
        s.data.profile.skills = s.data.profile.skills.filter((sk) => sk !== el.dataset.skill);
        Store.snapshotProfile(`스킬 삭제: ${el.dataset.skill}`);
      });
    },
    'restore-profile'(el) {
      Store.update((s) => {
        const entry = s.data.profileHistory[Number(el.dataset.idx)];
        if (!entry) return;
        s.data.profile = Store.deepCopy(entry.snapshot);
        Store.snapshotProfile(`복원: ${entry.label} 시점`);
      });
      Store.toast('선택한 시점으로 프로필을 복원했어요');
    },
  };

  /* ---------- change actions (checkbox/select) ---------- */

  const changeActions = {
    'toggle-emphasis'(el) {
      Store.update((s) => {
        const id = el.dataset.exp;
        const list = s.route.emphasisIds || [];
        if (list.includes(id)) s.route.emphasisIds = list.filter((x) => x !== id);
        else if (list.length < 3) s.route.emphasisIds = [...list, id]; // S-STHWFQ: 1~3개
        else Store.toast('강조 경험은 최대 3개까지 선택할 수 있어요');
      });
    },
    'app-status'(el) {
      Store.update((s) => {
        const app = s.data.applications.find((a) => a.id === el.dataset.app);
        if (!app || app.status === el.value) return;
        app.status = el.value;
        app.timeline.push({ date: today(), label: `상태 변경: ${el.value}` });
      });
    },
    'compare-pick'(el) {
      Store.update((s) => {
        if (!s.ui.modal || s.ui.modal.type !== 'compare') return;
        if (el.dataset.side === 'a') s.ui.modal.aId = el.value;
        else s.ui.modal.bId = el.value;
      });
    },
  };

  /* ---------- input handlers (silent unless noted) ---------- */

  // doc-section undo bookkeeping: capture pre-edit snapshot on focus,
  // commit it to the undo stack on the first keystroke (S-YRHRVV).
  let pendingDocSnapshot = null;

  const inputHandlers = {
    'login-email'(el) { Store.update((s) => { s.ui.loginEmail = el.value; }, { silent: true }); },
    'login-password'(el) { Store.update((s) => { s.ui.loginPassword = el.value; }, { silent: true }); },
    search(el) { Store.update((s) => { s.ui.searchQuery = el.value; }); }, // rerender: live filter
    'register-input'(el) { Store.update((s) => { s.ui.registerInput = el.value; }, { silent: true }); },
    'jd-body'(el) { Store.update((s) => { s.ui['_jdBody_' + el.dataset.job] = el.value; }, { silent: true }); },
    'job-title'(el) { Store.update((s) => { const j = findJob(s, el.dataset.job); if (j) j.title = el.value; }, { silent: true }); },
    'job-company'(el) {
      Store.update((s) => {
        const j = findJob(s, el.dataset.job);
        if (j) { j.company = el.value; if (el.value) j.logoText = el.value.slice(0, 2); }
      }, { silent: true });
    },
    'job-deadline'(el) { Store.update((s) => { const j = findJob(s, el.dataset.job); if (j) j.deadline = el.value; }, { silent: true }); },
    'apply-url'(el) { Store.update((s) => { const j = findJob(s, el.dataset.job); if (j) j.applyUrl = el.value; }, { silent: true }); },
    'doc-section'(el) {
      const doc = Store.getDoc(el.dataset.doc);
      if (!doc || doc.locked) return;
      if (pendingDocSnapshot && pendingDocSnapshot.docId === doc.id) {
        doc.history = doc.history || [];
        doc.history.push(pendingDocSnapshot.sections);
        if (doc.history.length > 20) doc.history.shift();
        doc.future = [];
        pendingDocSnapshot = null;
      }
      Store.update(() => {
        doc.sections[Number(el.dataset.idx)].body = el.value;
        doc.updatedAt = new Date().toISOString();
      }, { silent: true });
    },
    'doc-name'(el) {
      Store.update(() => {
        const doc = Store.getDoc(el.dataset.doc);
        if (doc) doc.name = el.value;
      }, { silent: true });
    },
    'profile-field'(el) { Store.update((s) => { s.data.profile[el.dataset.field] = el.value; }, { silent: true }); },
    'link-label'(el) {
      Store.update((s) => {
        const l = (s.data.profile.links || []).find((x) => x.id === el.dataset.link);
        if (l) l.label = el.value;
      }, { silent: true });
    },
    'link-url'(el) {
      Store.update((s) => {
        const l = (s.data.profile.links || []).find((x) => x.id === el.dataset.link);
        if (l) l.url = el.value;
      }, { silent: true });
    },
    'new-skill'(el) { Store.update((s) => { s.ui.newSkillInput = el.value; }, { silent: true }); },
    'exp-draft'(el) {
      Store.update((s) => {
        if (s.ui.modal && s.ui.modal.type === 'exp') s.ui.modal.draft[el.dataset.field] = el.value;
      }, { silent: true });
    },
    'app-note'(el) {
      Store.update((s) => {
        const app = s.data.applications.find((a) => a.id === el.dataset.app);
        if (app) app.note = el.value;
      }, { silent: true });
    },
  };

  /* ---------- profile change-history bookkeeping (F-AJWNNY) ---------- */

  let profileBeforeEdit = null;
  const PROFILE_INPUTS = new Set(['profile-field', 'link-label', 'link-url']);
  const FIELD_LABELS = {
    name: '이름', title: '희망 직무', email: '이메일', phone: '연락처', summary: '한 줄 소개',
  };

  /* ---------- global listeners ---------- */

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    // backdrop click closes the modal only when the backdrop itself was clicked
    if (el.classList.contains('modal-backdrop') && e.target !== el) return;
    const fn = clickActions[el.dataset.action];
    if (fn) { e.preventDefault && el.tagName !== 'A' && e.preventDefault(); fn(el); }
  });

  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-action-change]');
    if (!el) return;
    const fn = changeActions[el.dataset.actionChange];
    if (fn) fn(el);
  });

  document.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.input) return;
    const fn = inputHandlers[el.dataset.input];
    if (fn) fn(el);
  });

  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.input) return;
    if (el.dataset.input === 'doc-section') {
      const doc = Store.getDoc(el.dataset.doc);
      if (doc) pendingDocSnapshot = { docId: doc.id, sections: Store.deepCopy(doc.sections) };
    }
    if (PROFILE_INPUTS.has(el.dataset.input)) {
      profileBeforeEdit = JSON.stringify(Store.state.data.profile);
    }
  });

  // Re-render on blur is deferred: an immediate render replaces the DOM during the
  // mousedown→click sequence and swallows the click on whatever the user pressed.
  let renderTimer = null;
  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => Store.update(() => {}), 180);
  }

  document.addEventListener('focusout', (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.input) return;
    if (el.dataset.input === 'doc-section') {
      pendingDocSnapshot = null;
      scheduleRender(); // refresh coverage / matched notes / undo buttons
    }
    if (PROFILE_INPUTS.has(el.dataset.input)) {
      const after = JSON.stringify(Store.state.data.profile);
      if (profileBeforeEdit && profileBeforeEdit !== after) {
        Store.update((s) => {
          const label = el.dataset.input === 'profile-field'
            ? `${FIELD_LABELS[el.dataset.field] || el.dataset.field} 수정`
            : '링크 수정';
          Store.snapshotProfile(label);
        }, { silent: true });
      }
      profileBeforeEdit = null;
      scheduleRender(); // also refreshes URL validation display
    }
    if (['job-title', 'job-company', 'job-deadline', 'apply-url', 'doc-name', 'new-skill'].includes(el.dataset.input)) {
      scheduleRender();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.input === 'new-skill') {
      e.preventDefault();
      clickActions['add-skill']();
    }
  });

  /* ---------- boot ---------- */
  render();
})(typeof window !== 'undefined' ? window : globalThis);
