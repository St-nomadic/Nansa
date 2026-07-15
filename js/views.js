/* NANSA views — pure state -> HTML string renderers.
   Event wiring lives in app.js (data-action / data-input delegation). */
(function (global) {
  'use strict';

  const S = () => global.NansaStore.state;
  const Gen = () => global.NansaGenerator;
  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const DOC_LABEL = { resume: '이력서', cover: '자기소개서', portfolio: '포트폴리오' };
  const APP_STATUSES = ['준비중', '지원완료', '서류', '면접', '오퍼', '불합격'];
  const STATUS_CHIP = { 준비중: '', 지원완료: 'blue', 서류: 'violet', 면접: 'orange', 오퍼: 'green', 불합격: 'red' };

  /* ---------- shared helpers ---------- */

  function dday(deadline) {
    if (!deadline) return '';
    const diff = Math.ceil((new Date(deadline + 'T23:59:59') - new Date()) / 86400000);
    if (isNaN(diff)) return '';
    if (diff < 0) return '마감됨';
    if (diff === 0) return 'D-Day';
    return 'D-' + diff;
  }

  function jobStatus(job) {
    const s = S();
    const app = s.data.applications.find((a) => a.jobId === job.id);
    if (app) return { label: app.status === '준비중' ? '준비중' : '지원 완료', cls: app.status === '준비중' ? '' : 'green' };
    const hasDoc = Object.values(s.data.documents).some((d) => d.jobId === job.id);
    if (hasDoc) return { label: '서류 작성중', cls: 'blue' };
    return { label: '저장됨', cls: '' };
  }

  function logoBox(job, size) {
    const px = size || 44;
    return `<div class="logo-box" style="width:${px}px;height:${px}px;font-size:${Math.round(px * 0.3)}px;background:${esc(job.logoColor || '#5B37ED')};">${esc(job.logoText || (job.company || 'N').slice(0, 2))}</div>`;
  }

  function profileCompletion(profile) {
    let filled = 0;
    if (profile.name) filled++;
    if (profile.phone) filled++;
    if (profile.summary) filled++;
    if (profile.experiences.length) filled++;
    if (profile.skills.length) filled++;
    if (profile.links && profile.links.length) filled++;
    return Math.round((filled / 6) * 100);
  }

  /* ---------- chrome (sidebar + shell) ---------- */

  const NAV = [
    { key: 'home', label: '홈' },
    { key: 'jobs', label: '채용 공고' },
    { key: 'docs', label: '내 서류' },
    { key: 'profile', label: '내 프로필' },
    { key: 'history', label: '지원 관리' },
  ];
  const JOBS_FAMILY = ['jobs', 'jobDetail', 'generate', 'checklist'];

  function sidebar() {
    const s = S();
    const active = JOBS_FAMILY.includes(s.route.screen) ? 'jobs' : s.route.screen;
    return `
    <div class="sidebar">
      <div class="brand"><div class="brand-mark">N</div><span class="brand-name">NANSA</span></div>
      ${NAV.map((n) => `
        <div class="nav-item ${n.key === active ? 'active' : ''}" data-action="nav" data-screen="${n.key}">${n.label}</div>
      `).join('')}
      <div class="sidebar-spacer"></div>
      <div class="sidebar-user">
        <div class="avatar">${esc(s.data.profile.name.slice(0, 1))}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(s.data.profile.name)}</div>
          <div class="btn-link subtle" style="font-size:11px;" data-action="logout">로그아웃</div>
        </div>
      </div>
    </div>`;
  }

  /* ---------- login ---------- */

  function loginView() {
    const s = S();
    return `
    <div class="login-wrap">
      <div class="login-card">
        <div class="row gap-2 mb-1"><div class="brand-mark lg">N</div><span class="brand-name lg">NANSA</span></div>
        <div style="font-size:22px;font-weight:700;margin:18px 0 4px;letter-spacing:-0.01em;">로그인</div>
        <div style="font-size:14px;color:var(--label-alternative);margin-bottom:28px;">채용 공고에 맞춘 지원 서류를 자동으로 만들어보세요</div>
        <label class="field-label">이메일</label>
        <input class="input mb-4" type="email" placeholder="you@example.com" value="${esc(s.ui.loginEmail)}" data-input="login-email">
        <label class="field-label">비밀번호</label>
        <input class="input" type="password" placeholder="••••••••" value="${esc(s.ui.loginPassword)}" data-input="login-password" style="margin-bottom:22px;">
        <button class="btn primary block" data-action="login">로그인</button>
        <div class="divider-row"><div class="line"></div><span style="font-size:12px;color:var(--label-assistive);">또는</span><div class="line"></div></div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn outline block" data-action="login">구글 계정으로 계속하기</button>
          <button class="btn block" style="background:#FEE500;color:#191919;" data-action="login">카카오 계정으로 계속하기</button>
        </div>
      </div>
    </div>`;
  }

  /* ---------- home ---------- */

  function homeView() {
    const s = S();
    const jobs = s.data.jobs.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 3);
    const inProgress = s.data.applications.filter((a) => !['오퍼', '불합격'].includes(a.status)).length;
    return `
    <div class="page-title mb-1">안녕하세요, ${esc(s.data.profile.name)}님</div>
    <div class="page-sub mb-7">오늘도 맞춤 지원 서류로 빠르게 지원해보세요</div>
    <div class="stat-grid mb-7">
      <div class="card pad"><div class="stat-label">등록한 공고</div><div class="stat-value">${s.data.jobs.length}</div></div>
      <div class="card pad"><div class="stat-label">진행중인 지원</div><div class="stat-value">${inProgress}</div></div>
      <div class="card pad"><div class="stat-label">프로필 완성도</div><div class="stat-value" style="color:var(--primary-normal-3);">${profileCompletion(s.data.profile)}%</div></div>
    </div>
    <div class="row between mb-3">
      <div class="section-title">최근 등록한 공고</div>
      <button class="btn-link" data-action="nav" data-screen="jobs">전체 보기 →</button>
    </div>
    <div class="list-col mb-7">
      ${jobs.map((j) => `
        <div class="card clickable job-row" style="padding:16px 18px;" data-action="open-job" data-job="${j.id}">
          ${logoBox(j, 40)}
          <div style="flex:1;min-width:0;">
            <div style="font-size:15px;font-weight:700;">${esc(j.title || '(직무 미입력)')}</div>
            <div style="font-size:13px;color:var(--label-alternative);">${esc(j.company || '(회사 미입력)')} · ${esc(j.location || '-')}</div>
          </div>
          <div style="font-size:12px;color:var(--label-assistive);white-space:nowrap;">마감 ${esc(j.deadline || '미정')} ${dday(j.deadline) ? '· ' + dday(j.deadline) : ''}</div>
        </div>`).join('') || '<div class="card empty-state">아직 등록한 공고가 없어요</div>'}
    </div>
    <div class="row gap-3">
      <button class="btn primary" data-action="open-register">+ 새 공고 등록하기</button>
      <button class="btn outline" data-action="nav" data-screen="profile">내 프로필 채우기</button>
    </div>`;
  }

  /* ---------- jobs list ---------- */

  function jobsView() {
    const s = S();
    const q = s.ui.searchQuery.trim().toLowerCase();
    const skillQ = s.ui.skillFilter;
    let jobs = s.data.jobs.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    if (q) jobs = jobs.filter((j) => ((j.company || '') + (j.title || '')).toLowerCase().includes(q));
    if (skillQ) jobs = jobs.filter((j) => (j.skills || []).includes(skillQ));
    const allSkills = [...new Set(s.data.jobs.flatMap((j) => j.skills || []))].slice(0, 12);
    return `
    <div class="row between mb-5">
      <div class="page-title">채용 공고</div>
      <button class="btn primary md" data-action="open-register">+ 공고 등록</button>
    </div>
    <input class="input mb-3" style="width:340px;" placeholder="회사명, 직무로 검색" value="${esc(s.ui.searchQuery)}" data-input="search" data-keep-focus="search">
    <div class="row wrap gap-2 mb-5">
      ${allSkills.map((sk) => `<span class="chip ${sk === skillQ ? 'blue' : ''}" style="cursor:pointer;" data-action="filter-skill" data-skill="${esc(sk)}">${esc(sk)}</span>`).join('')}
      ${skillQ ? '<button class="btn-link subtle" data-action="filter-skill" data-skill="">필터 해제</button>' : ''}
    </div>
    <div class="list-col">
      ${jobs.map((j) => {
        const st = jobStatus(j);
        return `
        <div class="card job-row">
          <div style="cursor:pointer;" data-action="open-job" data-job="${j.id}">${logoBox(j, 44)}</div>
          <div style="flex:1;min-width:0;cursor:pointer;" data-action="open-job" data-job="${j.id}">
            <div class="row gap-2 mb-1">
              <span style="font-size:16px;font-weight:700;">${esc(j.title || '(직무 미입력)')}</span>
              <span class="badge chip ${st.cls}">${st.label}</span>
            </div>
            <div style="font-size:13px;color:var(--label-alternative);margin-bottom:8px;">${esc(j.company || '(회사 미입력)')} · ${esc(j.location || '-')} · 마감 ${esc(j.deadline || '미정')} ${dday(j.deadline) ? '(' + dday(j.deadline) + ')' : ''}</div>
            <div style="font-size:12px;color:var(--label-assistive);">${esc((j.skills || []).join(' · '))}</div>
          </div>
          <div class="bookmark ${j.bookmarked ? 'on' : ''}" data-action="toggle-bookmark" data-job="${j.id}">★</div>
        </div>`;
      }).join('') || '<div class="card empty-state">조건에 맞는 공고가 없어요</div>'}
    </div>`;
  }

  /* ---------- job detail ---------- */

  function ctaButtons(job) {
    const store = global.NansaStore;
    return ['resume', 'cover', 'portfolio'].map((t, i) => {
      const latest = store.latestDocFor(job.id, t);
      const label = latest ? `${DOC_LABEL[t]} 열기 (v${latest.version})` : `맞춤 ${DOC_LABEL[t]} 만들기 →`;
      const cls = i === 0 ? 'btn primary' : 'btn outline';
      const open = latest
        ? `<button class="${cls}" data-action="open-doc" data-doc="${latest.id}">${label}</button>
           <button class="btn-link" data-action="new-version" data-job="${job.id}" data-type="${t}">새 버전</button>`
        : `<button class="${cls}" data-action="go-generate" data-job="${job.id}" data-type="${t}">${label}</button>`;
      return `<div class="row gap-2">${open}</div>`;
    }).join('');
  }

  function jdBodyPasteCard(job) {
    return `
    <div class="card pad mb-5" style="border:1px dashed var(--line-normal-strong);box-shadow:none;">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">JD 본문 붙여넣기</div>
      <div style="font-size:13px;color:var(--label-alternative);margin-bottom:12px;">URL에서 공고 본문을 자동으로 가져올 수 없어요. 공고 본문 텍스트를 붙여넣으면 분석해 드릴게요.</div>
      <textarea class="textarea mb-3" style="height:120px;" placeholder="주요 업무 / 자격 요건 / 우대 사항이 포함된 공고 본문" data-input="jd-body" data-job="${job.id}"></textarea>
      <button class="btn primary md" data-action="analyze-body" data-job="${job.id}">본문 분석하기</button>
    </div>`;
  }

  function jobDetailView() {
    const s = S();
    const job = s.data.jobs.find((j) => j.id === s.route.jobId);
    if (!job) return '<div class="empty-state">공고를 찾을 수 없어요</div>';
    const kw = job.keywords || [];
    const needsBody = job.userRegistered && !(job.duties || []).length && !(job.requirements || []).length;
    return `
    <span class="back-link" data-action="nav" data-screen="jobs">← 공고 목록으로</span>
    <div class="card pad-lg mb-5" style="display:flex;align-items:flex-start;gap:18px;">
      ${logoBox(job, 56)}
      <div style="flex:1;">
        ${job.userRegistered ? `
          <input class="input mb-2" style="font-size:18px;font-weight:700;padding:8px 10px;" placeholder="직무명" value="${esc(job.title)}" data-input="job-title" data-job="${job.id}">
          <div class="row gap-2 mb-2">
            <input class="input" style="padding:8px 10px;font-size:13px;" placeholder="회사명" value="${esc(job.company)}" data-input="job-company" data-job="${job.id}">
            <input class="input" style="padding:8px 10px;font-size:13px;width:140px;flex:none;" placeholder="마감일 YYYY-MM-DD" value="${esc(job.deadline)}" data-input="job-deadline" data-job="${job.id}">
          </div>` : `
          <div style="font-size:22px;font-weight:700;margin-bottom:4px;">${esc(job.title)}</div>
          <div style="font-size:14px;color:var(--label-alternative);margin-bottom:10px;">${esc(job.company)} · ${esc(job.location || '-')} · 마감 ${esc(job.deadline || '미정')} ${dday(job.deadline) ? '(' + dday(job.deadline) + ')' : ''}</div>`}
        <div class="row wrap gap-2">
          ${(job.skills || []).map((sk) => `<span class="chip">${esc(sk)}</span>`).join('')}
          ${job.seniority ? `<span class="chip violet">${esc(job.seniority)}</span>` : ''}
        </div>
      </div>
      <div class="bookmark ${job.bookmarked ? 'on' : ''}" style="font-size:24px;" data-action="toggle-bookmark" data-job="${job.id}">★</div>
    </div>

    ${needsBody ? jdBodyPasteCard(job) : ''}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;" class="mb-6">
      <div class="card pad">
        <div style="font-size:15px;font-weight:700;margin-bottom:12px;">주요 업무</div>
        ${(job.duties || []).map((d) => `<div class="bullet-line"><span>·</span><span>${esc(d)}</span></div>`).join('') || '<div class="muted" style="font-size:13px;">등록된 내용이 없어요</div>'}
      </div>
      <div class="card pad">
        <div style="font-size:15px;font-weight:700;margin-bottom:12px;">자격 요건</div>
        ${(job.requirements || []).map((r) => `<div class="bullet-line"><span>·</span><span>${esc(r)}</span></div>`).join('') || '<div class="muted" style="font-size:13px;">등록된 내용이 없어요</div>'}
        ${(job.preferred || []).length ? `
          <div style="font-size:15px;font-weight:700;margin:16px 0 12px;">우대 사항</div>
          ${job.preferred.map((p) => `<div class="bullet-line"><span>·</span><span>${esc(p)}</span></div>`).join('')}` : ''}
      </div>
    </div>

    ${kw.length ? `
    <div class="card pad mb-6">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">JD 분석 결과 — 키워드 중요도</div>
      <div style="font-size:13px;color:var(--label-alternative);margin-bottom:12px;">공고에서 추출한 키워드예요. 문서 생성과 매칭 근거에 활용돼요.</div>
      <div class="row wrap gap-2">
        ${kw.map((k) => `<span class="chip ${k.importance === '상' ? 'blue' : k.importance === '중' ? 'violet' : ''}">${esc(k.skill)} · ${k.importance}</span>`).join('')}
      </div>
    </div>` : ''}

    <div class="card pad">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">이 공고에 맞춰 서류 만들기</div>
      <div style="font-size:13px;color:var(--label-alternative);margin-bottom:16px;">JD를 분석해 내 프로필과 매칭되는 근거를 함께 제시해 드려요</div>
      <div class="row wrap gap-3">
        ${ctaButtons(job)}
        <button class="btn outline" data-action="go-checklist" data-job="${job.id}">체크리스트 및 지원 →</button>
      </div>
    </div>`;
  }

  /* ---------- generate (mockup layout A: split view) ---------- */

  function generateView() {
    const s = S();
    const job = s.data.jobs.find((j) => j.id === s.route.jobId);
    if (!job) return '<div class="empty-state">공고를 찾을 수 없어요</div>';
    const docType = s.route.docType || 'resume';
    const doc = s.route.docId ? global.NansaStore.getDoc(s.route.docId) : null;
    const generating = s.ui.generating;
    const hasResult = !!doc && !generating;
    const cov = hasResult ? Gen().coverage(job, s.data.profile, doc.sections) : null;

    const genSet = s.data.genSettings;
    const emphasisIds = s.route.emphasisIds || s.data.profile.experiences.map((e) => e.id).slice(0, 2);
    const opt = (group, values, current) => values.map((v) =>
      `<button class="${v === current ? 'on' : ''}" data-action="gen-setting" data-group="${group}" data-value="${esc(v)}">${esc(v)}</button>`).join('');

    return `
    <span class="back-link" data-action="open-job" data-job="${job.id}">← ${esc(job.title || '공고')}로 돌아가기</span>
    <div class="row between wrap gap-3 mb-5">
      <div>
        <div style="font-size:24px;font-weight:700;letter-spacing:-0.02em;">맞춤 서류 만들기</div>
        <div style="font-size:13px;color:var(--label-alternative);">${esc(job.company)} · ${esc(job.title)}</div>
      </div>
      <div class="seg">
        ${['resume', 'cover', 'portfolio'].map((t) =>
          `<button class="${docType === t ? 'on' : ''}" data-action="set-doctype" data-type="${t}">${DOC_LABEL[t]}</button>`).join('')}
      </div>
    </div>

    <div class="gen-grid">
      <div class="card gen-settings" style="padding:20px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:10px;">생성 설정</div>
        <div style="font-size:12px;color:var(--label-alternative);margin-bottom:6px;">톤</div>
        <div class="opt-row mb-3">${opt('tone', ['간결', '표준', '강조'], genSet.tone)}</div>
        <div style="font-size:12px;color:var(--label-alternative);margin-bottom:6px;">길이</div>
        <div class="opt-row mb-3">${opt('length', ['짧게', '보통', '길게'], genSet.length)}</div>
        <div style="font-size:12px;color:var(--label-alternative);margin-bottom:6px;">언어</div>
        <div class="opt-row mb-4">${opt('lang', ['한국어', '영어'], genSet.lang)}</div>
        <div style="font-size:12px;color:var(--label-alternative);margin-bottom:6px;">강조할 경험 (1~3개)</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
          ${s.data.profile.experiences.map((e) => `
            <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--label-neutral);cursor:pointer;">
              <input type="checkbox" ${emphasisIds.includes(e.id) ? 'checked' : ''} data-action-change="toggle-emphasis" data-exp="${e.id}">
              ${esc(e.company)} · ${esc(e.role)}
            </label>`).join('')}
        </div>
        <div style="font-size:12px;color:var(--label-alternative);margin-bottom:8px;">공고 스킬 커버리지</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
          ${(job.skills || []).map((sk) => {
            const covered = cov ? cov.covered.includes(sk) : s.data.profile.skills.map((x) => x.toLowerCase()).includes(sk.toLowerCase());
            return `<div class="row gap-2" style="font-size:12px;"><span class="coverage-dot" style="color:${covered ? 'var(--status-positive)' : 'var(--line-normal-strong)'};">●</span><span>${esc(sk)}</span></div>`;
          }).join('')}
        </div>
        <button class="btn primary block" data-action="generate" data-job="${job.id}" data-type="${docType}" ${generating ? 'disabled' : ''}>
          ${generating ? '생성중...' : (hasResult ? '다시 생성하기' : '생성하기')}
        </button>
        ${docType === 'portfolio' && genSet.lang === '영어' ? '<div class="field-hint mt-2">포트폴리오는 아직 한국어 템플릿으로 생성돼요.</div>' : ''}
      </div>

      <div>
        ${generating ? '<div class="card empty-state">JD와 프로필을 분석해 맞춤 문서를 만드는 중이에요...</div>' : ''}
        ${hasResult ? generateResult(job, doc, cov) : ''}
        ${!generating && !hasResult ? '<div class="card empty-state">왼쪽에서 설정을 고르고 생성하기를 눌러보세요</div>' : ''}
      </div>
    </div>`;
  }

  function generateResult(job, doc, cov) {
    const canUndo = doc.history && doc.history.length;
    const canRedo = doc.future && doc.future.length;
    return `
    <div class="card mb-3" style="padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
      <div style="font-size:13px;color:var(--label-neutral);">
        키워드 커버리지 <b style="color:var(--primary-normal-3);font-size:16px;">${cov.score}%</b>
        <span class="assistive" style="font-size:11px;margin-left:6px;">${esc(doc.name)} ${doc.locked ? '· 🔒 제출본 잠금' : ''}</span>
      </div>
      <div class="row gap-2">
        <button class="btn sm outline" data-action="doc-undo" data-doc="${doc.id}" ${canUndo ? '' : 'disabled'}>↩ 되돌리기</button>
        <button class="btn sm outline" data-action="doc-redo" data-doc="${doc.id}" ${canRedo ? '' : 'disabled'}>↪ 다시 실행</button>
        <button class="btn sm outline" data-action="export" data-doc="${doc.id}" data-fmt="pdf">PDF 내보내기</button>
        <button class="btn sm outline" data-action="export" data-doc="${doc.id}" data-fmt="doc">DOCX 내보내기</button>
        <button class="btn sm outline" data-action="export" data-doc="${doc.id}" data-fmt="copy">전체 복사</button>
      </div>
    </div>

    ${cov.missing.length ? `
    <div class="card mb-3" style="padding:14px 18px;background:var(--orange-95);box-shadow:none;">
      <div style="font-size:12px;font-weight:700;color:var(--accent-foreground-orange);margin-bottom:6px;">누락된 JD 키워드 ${cov.missing.length}개</div>
      ${cov.missing.map((k) => `<div style="font-size:12px;color:var(--label-neutral);margin-bottom:2px;">· <b>${esc(k)}</b> — ${esc(Gen().insertionSuggestion(doc.type, k))}</div>`).join('')}
    </div>` : ''}

    ${doc.sections.map((sec, i) => `
      <div class="card section-card">
        <div class="row between mb-2">
          <div style="font-size:14px;font-weight:700;">${esc(sec.title)}</div>
          <button class="btn-link" style="font-size:12px;" data-action="regen-section" data-doc="${doc.id}" data-idx="${i}" ${doc.locked ? 'disabled' : ''}>↻ 재생성</button>
        </div>
        <textarea data-input="doc-section" data-doc="${doc.id}" data-idx="${i}" ${doc.locked ? 'readonly' : ''}>${esc(sec.body)}</textarea>
        ${(sec.matched && sec.matched.length) ? `<div class="matched-note">✓ 매칭 근거: ${esc(sec.matched.join(', '))}</div>` : ''}
        ${doc.locked ? '' : `
        <div class="ai-tools">
          ${Object.entries(Gen().REFINER_LABELS).map(([op, label]) =>
            `<button data-action="refine" data-doc="${doc.id}" data-idx="${i}" data-op="${op}">✦ ${label}</button>`).join('')}
        </div>`}
      </div>`).join('')}

    <div class="row gap-3 mt-4">
      <button class="btn primary" data-action="go-checklist" data-job="${job.id}">체크리스트 및 지원으로 이동 →</button>
    </div>`;
  }

  /* ---------- my documents ---------- */

  function docsView() {
    const s = S();
    const filter = s.ui.docFilterJobId;
    let docs = Object.values(s.data.documents).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    if (filter) docs = docs.filter((d) => d.jobId === filter);
    const jobsWithDocs = [...new Set(Object.values(s.data.documents).map((d) => d.jobId))]
      .map((id) => s.data.jobs.find((j) => j.id === id)).filter(Boolean);
    return `
    <div class="page-title mb-1">내 서류</div>
    <div class="page-sub mb-5">생성된 문서는 자동으로 이곳에 저장돼요. 공고별로 연결되어 있어요.</div>
    <div class="row wrap gap-2 mb-5">
      <span class="chip ${!filter ? 'blue' : ''}" style="cursor:pointer;" data-action="filter-docs" data-job="">전체</span>
      ${jobsWithDocs.map((j) => `<span class="chip ${filter === j.id ? 'blue' : ''}" style="cursor:pointer;" data-action="filter-docs" data-job="${j.id}">${esc(j.company)}</span>`).join('')}
    </div>
    <div class="list-col">
      ${docs.map((d) => {
        const job = s.data.jobs.find((j) => j.id === d.jobId) || {};
        const versions = Object.values(s.data.documents).filter((x) => x.jobId === d.jobId && x.type === d.type);
        return `
        <div class="card pad">
          <div class="row between wrap gap-3 mb-2">
            <input class="input" style="font-size:14px;font-weight:600;padding:8px 10px;max-width:460px;" value="${esc(d.name)}" data-input="doc-name" data-doc="${d.id}">
            <div class="row gap-2">
              <button class="btn sm primary" data-action="open-doc" data-doc="${d.id}">열기</button>
              <button class="btn sm outline" data-action="new-version" data-job="${d.jobId}" data-type="${d.type}">새 버전</button>
              ${versions.length >= 2 ? `<button class="btn sm outline" data-action="open-compare" data-job="${d.jobId}" data-type="${d.type}">버전 비교</button>` : ''}
              <button class="btn sm outline" data-action="export" data-doc="${d.id}" data-fmt="doc">DOCX</button>
            </div>
          </div>
          <div class="row wrap gap-2">
            <span class="chip blue">${DOC_LABEL[d.type]}</span>
            <span class="chip">v${d.version}</span>
            <span class="chip">${esc(job.company || '')} · ${esc(job.title || '')}</span>
            <span class="chip ${d.matchScore >= 60 ? 'green' : 'orange'}">매칭 ${d.matchScore}%</span>
            ${d.locked ? '<span class="chip red">🔒 제출본</span>' : ''}
            <span class="assistive" style="font-size:11px;">수정 ${esc((d.updatedAt || '').slice(0, 10))}</span>
          </div>
        </div>`;
      }).join('') || '<div class="card empty-state">아직 생성된 서류가 없어요. 공고 상세에서 맞춤 서류를 만들어보세요.</div>'}
    </div>`;
  }

  /* ---------- checklist & submit ---------- */

  function checklistView() {
    const s = S();
    const store = global.NansaStore;
    const job = s.data.jobs.find((j) => j.id === s.route.jobId);
    if (!job) return '<div class="empty-state">공고를 찾을 수 없어요</div>';
    const items = store.checklistFor(job.id);
    const allDone = items.every((i) => i.done);
    const jobDocs = Object.values(s.data.documents).filter((d) => d.jobId === job.id)
      .sort((a, b) => b.version - a.version);
    const app = s.data.applications.find((a) => a.jobId === job.id);
    return `
    <span class="back-link" data-action="open-job" data-job="${job.id}">← ${esc(job.title || '공고')}로 돌아가기</span>
    <div class="page-title mb-1">최종 점검 및 지원</div>
    <div class="page-sub mb-6">${esc(job.company)} · ${esc(job.title)} · 마감 ${esc(job.deadline || '미정')} ${dday(job.deadline) ? '(' + dday(job.deadline) + ')' : ''}</div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;" class="mb-6">
      <div class="card pad">
        <div style="font-size:15px;font-weight:700;margin-bottom:12px;">제출 전 체크리스트</div>
        ${items.map((it) => `
          <div class="check-item ${it.done ? 'done' : ''}" data-action="toggle-check" data-job="${job.id}" data-item="${it.id}">
            <div class="check-box">${it.done ? '✓' : ''}</div>
            <span style="font-size:14px;">${esc(it.label)}</span>
          </div>`).join('')}
        <div class="field-hint">모든 항목을 완료하면 제출 단계가 열려요.</div>
      </div>

      <div class="card pad">
        <div style="font-size:15px;font-weight:700;margin-bottom:12px;">제출할 서류 (${jobDocs.length})</div>
        ${jobDocs.map((d) => `
          <div class="row between mb-3" style="gap:10px;">
            <div style="min-width:0;">
              <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(d.name)}</div>
              <div class="assistive" style="font-size:11px;">${DOC_LABEL[d.type]} · v${d.version} ${d.locked ? '· 🔒' : ''}</div>
            </div>
            <div class="row gap-2" style="flex-shrink:0;">
              <button class="btn sm outline" data-action="export" data-doc="${d.id}" data-fmt="pdf">PDF</button>
              <button class="btn sm outline" data-action="export" data-doc="${d.id}" data-fmt="doc">DOCX</button>
            </div>
          </div>`).join('') || '<div class="muted" style="font-size:13px;">아직 이 공고로 만든 서류가 없어요. 먼저 맞춤 서류를 생성해 주세요.</div>'}
      </div>
    </div>

    <div class="card pad">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">제출하기</div>
      <div style="font-size:13px;color:var(--label-alternative);margin-bottom:14px;">
        업로드 가이드: ① 위에서 필요한 형식(PDF/DOCX)으로 파일을 내려받기 ② 지원 페이지에서 파일 업로드
        ③ 자기소개 문항은 '전체 복사'로 붙여넣기 ④ 제출 전 미리보기로 최종 확인
      </div>
      <label class="field-label">지원 페이지 URL</label>
      <div class="row gap-2 mb-4">
        <input class="input" placeholder="https://..." value="${esc(job.applyUrl || '')}" data-input="apply-url" data-job="${job.id}">
        <a class="btn outline md" style="flex-shrink:0;" href="${esc(job.applyUrl || '#')}" target="_blank" rel="noopener">지원 페이지로 이동 ↗</a>
      </div>
      <div class="row gap-3">
        <button class="btn primary" data-action="mark-applied" data-job="${job.id}" ${allDone && jobDocs.length ? '' : 'disabled'}>
          ${app && app.status !== '준비중' ? '지원 정보 업데이트' : '지원 완료로 기록'}
        </button>
        ${!allDone ? '<span class="assistive" style="font-size:12px;">체크리스트를 모두 완료해 주세요</span>'
          : (!jobDocs.length ? '<span class="assistive" style="font-size:12px;">제출할 서류를 먼저 생성해 주세요</span>' : '')}
      </div>
      <div class="field-hint mt-2">지원 완료로 기록하면 제출 서류가 스냅샷으로 잠기고, 지원 관리에서 상태를 추적할 수 있어요.</div>
    </div>`;
  }

  /* ---------- profile ---------- */

  function profileView() {
    const s = S();
    const p = s.data.profile;
    const suggestions = suggestSkills(p);
    return `
    <div class="page-title mb-1">내 프로필</div>
    <div class="page-sub mb-6">여기 입력한 데이터가 모든 맞춤 서류 생성의 재료가 돼요. 완성도 ${profileCompletion(p)}%</div>

    <div class="card pad mb-5">
      <div style="font-size:15px;font-weight:700;margin-bottom:14px;">기본 정보</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;" class="mb-3">
        <div><label class="field-label">이름</label><input class="input" value="${esc(p.name)}" data-input="profile-field" data-field="name"></div>
        <div><label class="field-label">희망 직무</label><input class="input" value="${esc(p.title)}" data-input="profile-field" data-field="title"></div>
        <div><label class="field-label">이메일</label><input class="input" value="${esc(p.email)}" data-input="profile-field" data-field="email"></div>
        <div><label class="field-label">연락처</label><input class="input" value="${esc(p.phone)}" data-input="profile-field" data-field="phone"></div>
      </div>
      <label class="field-label">한 줄 소개</label>
      <textarea class="textarea mb-4" style="height:64px;" data-input="profile-field" data-field="summary">${esc(p.summary)}</textarea>
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">링크 (포트폴리오/깃허브/블로그)</div>
      ${(p.links || []).map((l) => `
        <div class="row gap-2 mb-2">
          <input class="input" style="width:130px;flex:none;" value="${esc(l.label)}" data-input="link-label" data-link="${l.id}" placeholder="라벨">
          <input class="input ${l.url && !/^https?:\/\/\S+\.\S+/.test(l.url) ? 'invalid' : ''}" value="${esc(l.url)}" data-input="link-url" data-link="${l.id}" placeholder="https://...">
          <button class="btn sm danger" data-action="remove-link" data-link="${l.id}">삭제</button>
        </div>
        ${l.url && !/^https?:\/\/\S+\.\S+/.test(l.url) ? '<div class="field-error mb-2">URL 형식이 올바르지 않아요 (https://로 시작)</div>' : ''}`).join('')}
      <button class="btn-link" data-action="add-link">+ 링크 추가</button>
    </div>

    <div class="card pad mb-5">
      <div class="row between mb-3">
        <div style="font-size:15px;font-weight:700;">경력 / 프로젝트</div>
        <button class="btn sm primary" data-action="edit-exp" data-exp="">+ 경험 추가</button>
      </div>
      ${p.experiences.map((e) => `
        <div style="border:1px solid var(--line-solid-normal);border-radius:var(--radius-sm);padding:16px 18px;margin-bottom:10px;">
          <div class="row between mb-1">
            <div style="font-size:14px;font-weight:700;">${esc(e.company)} · ${esc(e.role)}</div>
            <div class="row gap-2">
              <button class="btn-link" style="font-size:12px;" data-action="edit-exp" data-exp="${e.id}">수정</button>
              <button class="btn-link" style="font-size:12px;color:var(--status-negative);" data-action="remove-exp" data-exp="${e.id}">삭제</button>
            </div>
          </div>
          <div class="assistive" style="font-size:12px;margin-bottom:8px;">${esc(e.period)}</div>
          ${e.bullets.map((b) => `<div class="bullet-line" style="font-size:13px;margin-bottom:4px;"><span>·</span><span>${esc(b)}</span></div>`).join('')}
          ${(e.tags || []).length ? `<div class="row wrap gap-2 mt-2">${e.tags.map((t) => `<span class="chip" style="font-size:11px;padding:3px 8px;">${esc(t)}</span>`).join('')}</div>` : ''}
        </div>`).join('') || '<div class="muted" style="font-size:13px;">경험을 추가하면 서류 품질이 크게 좋아져요.</div>'}
    </div>

    <div class="card pad mb-5">
      <div style="font-size:15px;font-weight:700;margin-bottom:12px;">스킬</div>
      <div class="row wrap gap-2 mb-3">
        ${p.skills.map((sk) => `<span class="chip blue">${esc(sk)} <span style="cursor:pointer;margin-left:2px;" data-action="remove-skill" data-skill="${esc(sk)}">×</span></span>`).join('')}
      </div>
      <div class="row gap-2 mb-3">
        <input class="input" style="width:220px;" placeholder="스킬 입력 후 추가" value="${esc(s.ui.newSkillInput)}" data-input="new-skill" data-keep-focus="new-skill">
        <button class="btn md outline" data-action="add-skill">추가</button>
      </div>
      ${suggestions.length ? `
        <div style="font-size:12px;color:var(--label-alternative);margin-bottom:6px;">경험에서 발견한 추천 스킬</div>
        <div class="row wrap gap-2">${suggestions.map((sk) => `<span class="chip violet" style="cursor:pointer;" data-action="add-skill-direct" data-skill="${esc(sk)}">+ ${esc(sk)}</span>`).join('')}</div>` : ''}
    </div>

    <div class="card pad">
      <div style="font-size:15px;font-weight:700;margin-bottom:12px;">변경 이력</div>
      ${(s.data.profileHistory || []).length ? `
      <div class="timeline">
        ${s.data.profileHistory.slice().reverse().map((h, revIdx) => {
          const idx = s.data.profileHistory.length - 1 - revIdx;
          return `
          <div class="timeline-item">
            <div class="row between">
              <span>${esc(h.label)} <span class="assistive">· ${esc(h.at.slice(0, 16).replace('T', ' '))}</span></span>
              <button class="btn-link" style="font-size:11px;" data-action="restore-profile" data-idx="${idx}">이 시점으로 복원</button>
            </div>
          </div>`;
        }).join('')}
      </div>` : '<div class="muted" style="font-size:13px;">프로필을 수정하면 변경 이력이 여기에 쌓여요.</div>'}
    </div>`;
  }

  function suggestSkills(profile) {
    if (!global.NansaJD) return [];
    const text = profile.experiences.map((e) => e.bullets.join(' ') + ' ' + (e.tags || []).join(' ')).join(' ');
    const owned = new Set(profile.skills.map((s) => s.toLowerCase()));
    return global.NansaJD.extractSkills(text)
      .map((f) => f.skill)
      .filter((sk) => !owned.has(sk.toLowerCase()))
      .slice(0, 6);
  }

  /* ---------- history (지원 관리) ---------- */

  function historyView() {
    const s = S();
    const apps = s.data.applications.slice().sort((a, b) => (b.appliedAt || '').localeCompare(a.appliedAt || ''));
    return `
    <div class="page-title mb-1">지원 관리</div>
    <div class="page-sub mb-6">공고별 지원 상태와 제출 서류 스냅샷, 회고 메모를 관리해요.</div>
    <div class="list-col">
      ${apps.map((a) => {
        const job = s.data.jobs.find((j) => j.id === a.jobId) || {};
        const snaps = (a.snapshotDocIds || []).map((id) => s.data.documents[id]).filter(Boolean);
        return `
        <div class="card pad">
          <div class="row between wrap gap-3 mb-3">
            <div class="row gap-3">
              ${logoBox(job, 40)}
              <div>
                <div style="font-size:15px;font-weight:700;">${esc(job.title || '(삭제된 공고)')}</div>
                <div style="font-size:13px;color:var(--label-alternative);">${esc(job.company || '')} · 지원일 ${esc(a.appliedAt || '-')} ${job.deadline ? '· 마감 ' + esc(job.deadline) + (dday(job.deadline) ? ' (' + dday(job.deadline) + ')' : '') : ''}</div>
              </div>
            </div>
            <div class="row gap-2">
              <span class="chip ${STATUS_CHIP[a.status] || ''}">${esc(a.status)}</span>
              <select class="status-select" data-action-change="app-status" data-app="${a.id}">
                ${APP_STATUSES.map((st) => `<option ${st === a.status ? 'selected' : ''}>${st}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div>
              <div style="font-size:12px;font-weight:700;color:var(--label-alternative);margin-bottom:8px;">타임라인</div>
              <div class="timeline">
                ${(a.timeline || []).map((t) => `<div class="timeline-item">${esc(t.label)} <span class="assistive">· ${esc(t.date)}</span></div>`).join('') || '<div class="muted" style="font-size:12px;">기록 없음</div>'}
              </div>
              ${snaps.length ? `
              <div style="font-size:12px;font-weight:700;color:var(--label-alternative);margin:10px 0 6px;">제출 서류 스냅샷 🔒</div>
              ${snaps.map((d) => `<div class="row gap-2 mb-1" style="font-size:12px;"><span class="chip" style="font-size:11px;padding:3px 8px;">${DOC_LABEL[d.type]} v${d.version}</span><button class="btn-link" style="font-size:11px;" data-action="open-doc" data-doc="${d.id}">보기</button></div>`).join('')}` : ''}
            </div>
            <div>
              <div style="font-size:12px;font-weight:700;color:var(--label-alternative);margin-bottom:8px;">회고 메모 — 무엇이 통했나?</div>
              <textarea class="textarea" style="height:96px;font-size:13px;" placeholder="예: MSA 전환 리드 경험을 첫 문단에 배치한 버전이 서류 통과율이 좋았다" data-input="app-note" data-app="${a.id}">${esc(a.note || '')}</textarea>
            </div>
          </div>
        </div>`;
      }).join('') || '<div class="card empty-state">아직 지원 기록이 없어요. 체크리스트를 완료하고 지원을 기록해 보세요.</div>'}
    </div>`;
  }

  /* ---------- modals ---------- */

  function registerModal() {
    const s = S();
    return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal" data-stop-propagation>
        <div style="font-size:18px;font-weight:700;margin-bottom:6px;">채용 공고 등록</div>
        <div style="font-size:13px;color:var(--label-alternative);margin-bottom:16px;">공고 URL을 붙여넣거나 공고 내용을 직접 입력하세요</div>
        <textarea class="textarea mb-2" style="height:130px;" placeholder="https://... 또는 채용공고 텍스트 붙여넣기 (주요 업무/자격 요건/우대 사항 포함)" data-input="register-input" data-keep-focus="register">${esc(s.ui.registerInput)}</textarea>
        ${s.ui.registerError ? `<div class="field-error mb-3">${esc(s.ui.registerError)}</div>` : ''}
        <div class="row gap-2" style="justify-content:flex-end;margin-top:12px;">
          <button class="btn outline md" data-action="close-modal">취소</button>
          <button class="btn primary md" data-action="submit-register" ${s.ui.registering ? 'disabled' : ''}>${s.ui.registering ? '분석중...' : '분석하고 등록'}</button>
        </div>
      </div>
    </div>`;
  }

  function expModal() {
    const s = S();
    const d = s.ui.modal.draft;
    return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal" data-stop-propagation>
        <div style="font-size:18px;font-weight:700;margin-bottom:16px;">${s.ui.modal.expId ? '경험 수정' : '경험 추가'}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" class="mb-3">
          <div><label class="field-label">회사/조직</label><input class="input" value="${esc(d.company)}" data-input="exp-draft" data-field="company"></div>
          <div><label class="field-label">역할/직무</label><input class="input" value="${esc(d.role)}" data-input="exp-draft" data-field="role"></div>
        </div>
        <label class="field-label">기간</label>
        <input class="input mb-3" placeholder="2022.03 - 2026.06" value="${esc(d.period)}" data-input="exp-draft" data-field="period">
        <label class="field-label">성과 불릿 (한 줄에 하나, 수치 포함 권장 — 예: 응답속도 40% 개선)</label>
        <textarea class="textarea mb-3" style="height:110px;" data-input="exp-draft" data-field="bulletsText">${esc(d.bulletsText)}</textarea>
        <label class="field-label">태그 (쉼표 구분 — 직무/기술/도메인)</label>
        <input class="input mb-4" placeholder="백엔드, 핀테크, Kotlin" value="${esc(d.tagsText)}" data-input="exp-draft" data-field="tagsText">
        <div class="row gap-2" style="justify-content:flex-end;">
          <button class="btn outline md" data-action="close-modal">취소</button>
          <button class="btn primary md" data-action="save-exp">저장</button>
        </div>
      </div>
    </div>`;
  }

  function compareModal() {
    const s = S();
    const m = s.ui.modal;
    const versions = Object.values(s.data.documents)
      .filter((d) => d.jobId === m.jobId && d.type === m.docType)
      .sort((a, b) => b.version - a.version);
    const a = s.data.documents[m.aId] || versions[1] || versions[0];
    const b = s.data.documents[m.bId] || versions[0];
    const diff = diffDocs(a, b);
    const pick = (side, current) => `
      <select class="status-select" data-action-change="compare-pick" data-side="${side}">
        ${versions.map((v) => `<option value="${v.id}" ${v.id === current.id ? 'selected' : ''}>v${v.version} · ${esc((v.updatedAt || '').slice(0, 10))}</option>`).join('')}
      </select>`;
    return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal" style="width:640px;" data-stop-propagation>
        <div style="font-size:18px;font-weight:700;margin-bottom:14px;">버전 비교 — ${DOC_LABEL[m.docType]}</div>
        <div class="row gap-3 mb-4">${pick('a', a)} <span class="muted">↔</span> ${pick('b', b)}</div>
        ${diff.map((d) => `
          <div style="border:1px solid var(--line-solid-normal);border-radius:var(--radius-sm);padding:12px 14px;margin-bottom:8px;">
            <div class="row gap-2 mb-1">
              <span class="chip ${d.kind === '변경' ? 'orange' : d.kind === '추가' ? 'green' : d.kind === '삭제' ? 'red' : ''}" style="font-size:11px;padding:3px 8px;">${d.kind}</span>
              <b style="font-size:13px;">${esc(d.title)}</b>
            </div>
            ${d.detail ? `<div style="font-size:12px;color:var(--label-alternative);">${esc(d.detail)}</div>` : ''}
          </div>`).join('') || '<div class="muted" style="font-size:13px;">두 버전이 동일해요.</div>'}
        <div class="row" style="justify-content:flex-end;margin-top:12px;">
          <button class="btn outline md" data-action="close-modal">닫기</button>
        </div>
      </div>
    </div>`;
  }

  // S-TZLYOS: section-level version diff summary.
  function diffDocs(a, b) {
    if (!a || !b || a.id === b.id) return [];
    const out = [];
    const bByTitle = new Map(b.sections.map((sec) => [sec.title, sec]));
    const aTitles = new Set(a.sections.map((sec) => sec.title));
    for (const sec of a.sections) {
      const other = bByTitle.get(sec.title);
      if (!other) out.push({ kind: '삭제', title: sec.title, detail: `v${b.version}에는 없는 섹션` });
      else if (other.body !== sec.body) {
        const delta = other.body.length - sec.body.length;
        out.push({ kind: '변경', title: sec.title, detail: `본문 ${delta >= 0 ? '+' : ''}${delta}자 (v${a.version} ${sec.body.length}자 → v${b.version} ${other.body.length}자)` });
      }
    }
    for (const sec of b.sections) {
      if (!aTitles.has(sec.title)) out.push({ kind: '추가', title: sec.title, detail: `v${b.version}에 새로 생긴 섹션` });
    }
    return out;
  }

  /* ---------- root ---------- */

  const SCREENS = {
    home: homeView, jobs: jobsView, jobDetail: jobDetailView, generate: generateView,
    docs: docsView, checklist: checklistView, profile: profileView, history: historyView,
  };

  function render() {
    const s = S();
    if (!s.session.loggedIn) return loginView() + toastHtml();
    const body = (SCREENS[s.route.screen] || homeView)();
    let modal = '';
    if (s.ui.modal) {
      if (s.ui.modal.type === 'register') modal = registerModal();
      else if (s.ui.modal.type === 'exp') modal = expModal();
      else if (s.ui.modal.type === 'compare') modal = compareModal();
    }
    return `<div class="layout">${sidebar()}<div class="main">${body}</div></div>${modal}${toastHtml()}`;
  }

  function toastHtml() {
    const t = S().ui.toast;
    return t ? `<div class="toast">${esc(t)}</div>` : '';
  }

  global.NansaViews = { render, esc, DOC_LABEL, APP_STATUSES, diffDocs };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.NansaViews;
})(typeof window !== 'undefined' ? window : globalThis);
