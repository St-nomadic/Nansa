// 프로토타입 목업 데이터의 단일 출처(single source of truth).
// 이전에는 각 페이지 JSX에 값이 하드코딩돼 있어 화면마다 숫자가 달랐습니다.
// 화면에 보이는 카운트/비율은 모두 이 파일의 배열에서 파생됩니다.

export const TODAY = '2026-07-17';

export const STATUS = {
  interested: { label: '관심 공고', short: '관심 공고', badge: 'b-neutral', column: '관심 공고' },
  preparing: { label: '서류 준비중', short: '준비중', badge: 'b-amber', column: '서류 준비중' },
  submitted: { label: '제출 완료', short: '제출 완료', badge: 'b-blue', column: '제출 완료' },
  interview: { label: '면접 대기', short: '면접 대기', badge: 'b-green', column: '면접·결과' },
  rejected: { label: '불합격', short: '불합격', badge: 'b-red', column: '면접·결과' },
};

export const COLUMNS = ['관심 공고', '서류 준비중', '제출 완료', '면접·결과'];

export const DOC_LABEL = { resume: '이력서', 'cover-letter': '자기소개서', portfolio: '포트폴리오' };

export const SECTIONS_BY_TYPE = {
  resume: [
    { key: 'basic', label: '기본 정보' },
    { key: 'summary', label: '경력 요약' },
    { key: 'project', label: '프로젝트' },
    { key: 'skills', label: '스킬' },
  ],
  'cover-letter': [
    { key: 'motive', label: '지원 동기' },
    { key: 'strength', label: '직무 역량' },
    { key: 'collab', label: '협업 경험' },
    { key: 'future', label: '입사 후 포부' },
  ],
  portfolio: [
    { key: 'cover', label: '표지 · 요약' },
    { key: 'projects', label: '대표 프로젝트' },
    { key: 'metrics', label: '성과 지표' },
    { key: 'links', label: '링크 · 연락처' },
  ],
};

const BASE_JOBS = [
  {
    id: '1',
    company: '페이지컴퍼니',
    companyEn: 'PAGE COMPANY',
    title: '백엔드 엔지니어',
    tags: ['정규직', '경력 3~5년', '서울 강남', 'Java / Spring'],
    seniority: '백엔드 · 경력 3~5년 추정',
    status: 'preparing',
    deadline: '2026-07-22',
    source: { kind: 'url', value: 'https://careers.pagecompany.co.kr/jobs/2481' },
    rawJd: '[담당 업무]\n- 커머스 주문/결제 도메인 백엔드 API 설계 및 개발\n- MSA 환경에서의 서비스 간 통신 및 트래픽 처리 최적화\n- 대용량 트래픽 대응을 위한 아키텍처 개선\n\n[자격 요건]\n- Java, Spring Boot 기반 서비스 개발 경력 3년 이상\n- RESTful API 설계 및 구현 경험\n- MySQL 등 RDBMS 활용 경험\n- Git 기반 협업 및 코드 리뷰 문화 경험\n\n[우대 사항]\n- AWS 등 클라우드 인프라 운영 경험\n- Kafka 등 메시지 큐 활용 경험\n- 대규모 트래픽 서비스 운영 경험\n- CI/CD 파이프라인 구축 경험',
    analysis: {
      duty: ['커머스 주문/결제 도메인 백엔드 API 설계 및 개발', 'MSA 환경에서의 서비스 간 통신 및 트래픽 처리 최적화', '대용량 트래픽 대응을 위한 아키텍처 개선'],
      req: ['Java, Spring Boot 기반 서비스 개발 경력 3년 이상', 'RESTful API 설계 및 구현 경험', 'MySQL 등 RDBMS 활용 경험', 'Git 기반 협업 및 코드 리뷰 문화 경험'],
      plus: ['AWS 등 클라우드 인프라 운영 경험', 'Kafka 등 메시지 큐 활용 경험', '대규모 트래픽 서비스 운영 경험', 'CI/CD 파이프라인 구축 경험'],
    },
    keywords: [
      { name: 'Spring Boot', weight: 3 }, { name: 'MSA', weight: 3 }, { name: 'RESTful API', weight: 2 },
      { name: 'AWS', weight: 2 }, { name: '트래픽 처리', weight: 2 }, { name: 'Kafka', weight: 1 },
      { name: 'MySQL', weight: 1 }, { name: '코드 리뷰', weight: 1 }, { name: 'CI/CD', weight: 1 },
    ],
  },
  {
    id: '2',
    company: '브라이트웍스',
    companyEn: 'BRIGHTWORKS',
    title: '프로덕트 디자이너',
    tags: ['정규직', '경력 3~5년', '서울 성수', 'Figma'],
    seniority: '프로덕트 디자이너 · 경력 3~5년 추정',
    status: 'submitted',
    deadline: '2026-07-19',
    submittedAt: '2026-07-14',
    source: { kind: 'url', value: 'https://brightworks.team/careers/pd' },
    rawJd: '[담당 업무]\n- B2C 커머스 앱의 핵심 구매 여정 UX/UI 설계\n- 디자인 시스템 컴포넌트 정의 및 운영\n- 사용성 테스트 설계와 결과 기반 개선안 도출\n\n[자격 요건]\n- 프로덕트 디자인 경력 3년 이상\n- Figma 기반 프로토타이핑 및 개발 핸드오프 경험\n- 데이터를 근거로 디자인 의사결정을 해본 경험\n- 개발자와 협업해 실제 출시까지 마무리한 경험\n\n[우대 사항]\n- 디자인 시스템을 처음부터 구축해본 경험\n- 그로스 실험(A/B 테스트) 참여 경험\n- 모션 · 인터랙션 디자인 역량',
    analysis: {
      duty: ['B2C 커머스 앱의 핵심 구매 여정 UX/UI 설계', '디자인 시스템 컴포넌트 정의 및 운영', '사용성 테스트 설계와 결과 기반 개선안 도출'],
      req: ['프로덕트 디자인 경력 3년 이상', 'Figma 기반 프로토타이핑 및 개발 핸드오프 경험', '데이터를 근거로 디자인 의사결정을 해본 경험', '개발자와 협업해 실제 출시까지 마무리한 경험'],
      plus: ['디자인 시스템을 처음부터 구축해본 경험', '그로스 실험(A/B 테스트) 참여 경험', '모션 · 인터랙션 디자인 역량'],
    },
    keywords: [
      { name: 'Figma', weight: 3 }, { name: '디자인 시스템', weight: 3 }, { name: '사용성 테스트', weight: 2 },
      { name: '프로토타이핑', weight: 2 }, { name: 'A/B 테스트', weight: 1 }, { name: '핸드오프', weight: 1 },
      { name: '그로스', weight: 1 },
    ],
  },
  {
    id: '3',
    company: '누리소프트',
    companyEn: 'NURISOFT',
    title: '프론트엔드 엔지니어',
    tags: ['정규직', '경력 3년 이상', '경기 판교', 'React / TypeScript'],
    seniority: '프론트엔드 · 경력 3~5년 추정',
    status: 'interview',
    deadline: '2026-07-08',
    submittedAt: '2026-07-09',
    interviewAt: '2026-07-25',
    source: { kind: 'url', value: 'https://nurisoft.co.kr/recruit/fe' },
    rawJd: '[담당 업무]\n- React 기반 사내 SaaS 대시보드 화면 개발\n- 공통 UI 컴포넌트 라이브러리 유지보수\n- 렌더링 성능 및 번들 사이즈 최적화\n\n[자격 요건]\n- React, TypeScript 기반 개발 경력 3년 이상\n- 상태 관리 라이브러리 활용 경험\n- REST API 연동 및 비동기 처리 경험\n- 크로스 브라우저 대응 경험\n\n[우대 사항]\n- Next.js 기반 SSR 서비스 운영 경험\n- 웹 접근성(WCAG) 대응 경험\n- 테스트 코드 작성 경험 (Jest, Testing Library)',
    analysis: {
      duty: ['React 기반 사내 SaaS 대시보드 화면 개발', '공통 UI 컴포넌트 라이브러리 유지보수', '렌더링 성능 및 번들 사이즈 최적화'],
      req: ['React, TypeScript 기반 개발 경력 3년 이상', '상태 관리 라이브러리 활용 경험', 'REST API 연동 및 비동기 처리 경험', '크로스 브라우저 대응 경험'],
      plus: ['Next.js 기반 SSR 서비스 운영 경험', '웹 접근성(WCAG) 대응 경험', '테스트 코드 작성 경험 (Jest, Testing Library)'],
    },
    keywords: [
      { name: 'React', weight: 3 }, { name: 'TypeScript', weight: 3 }, { name: '성능 최적화', weight: 2 },
      { name: '컴포넌트 설계', weight: 2 }, { name: 'Next.js', weight: 1 }, { name: '웹 접근성', weight: 1 },
      { name: '테스트 코드', weight: 1 },
    ],
  },
  {
    id: '4',
    company: '오르빗랩스',
    companyEn: 'ORBITLABS',
    title: '데이터 분석가',
    tags: ['정규직', '경력 2~4년', '서울 역삼', 'SQL / Python'],
    seniority: '데이터 분석가 · 경력 2~4년 추정',
    status: 'interested',
    deadline: '2026-07-30',
    source: { kind: 'url', value: 'https://orbitlabs.io/jobs/data-analyst' },
    rawJd: '[담당 업무]\n- 프로덕트 핵심 지표 정의 및 대시보드 구축\n- 사용자 행동 로그 분석과 인사이트 도출\n- A/B 테스트 설계 및 결과 해석\n\n[자격 요건]\n- 데이터 분석 경력 2년 이상\n- SQL을 활용한 대용량 데이터 추출 · 가공 경험\n- Python 기반 분석 및 시각화 경험\n- 비즈니스 문제를 지표로 번역해본 경험\n\n[우대 사항]\n- 실험 플랫폼 운영 경험\n- dbt, Airflow 등 데이터 파이프라인 도구 경험\n- 통계적 가설 검정에 대한 이해',
    analysis: {
      duty: ['프로덕트 핵심 지표 정의 및 대시보드 구축', '사용자 행동 로그 분석과 인사이트 도출', 'A/B 테스트 설계 및 결과 해석'],
      req: ['데이터 분석 경력 2년 이상', 'SQL을 활용한 대용량 데이터 추출 · 가공 경험', 'Python 기반 분석 및 시각화 경험', '비즈니스 문제를 지표로 번역해본 경험'],
      plus: ['실험 플랫폼 운영 경험', 'dbt, Airflow 등 데이터 파이프라인 도구 경험', '통계적 가설 검정에 대한 이해'],
    },
    keywords: [
      { name: 'SQL', weight: 3 }, { name: 'Python', weight: 3 }, { name: 'A/B 테스트', weight: 2 },
      { name: '지표 설계', weight: 2 }, { name: '대시보드', weight: 1 }, { name: 'Airflow', weight: 1 },
      { name: '통계 분석', weight: 1 },
    ],
  },
  {
    id: '5',
    company: '테크노바',
    companyEn: 'TECHNOVA',
    title: '데이터 엔지니어',
    tags: ['정규직', '경력 3~5년', '서울 마곡', 'Python / Airflow'],
    seniority: '데이터 엔지니어 · 경력 3~5년 추정',
    status: 'rejected',
    deadline: '2026-06-20',
    submittedAt: '2026-06-28',
    resultAt: '2026-07-05',
    source: { kind: 'url', value: 'https://technova.kr/careers/de' },
    rawJd: '[담당 업무]\n- 배치 · 실시간 데이터 파이프라인 설계 및 운영\n- 데이터 웨어하우스 모델링 및 품질 관리\n- 분석가 · ML 엔지니어를 위한 데이터 마트 제공\n\n[자격 요건]\n- 데이터 엔지니어링 경력 3년 이상\n- Python 또는 Scala 기반 데이터 처리 경험\n- Airflow 등 워크플로 오케스트레이션 경험\n- SQL 및 데이터 모델링 역량\n\n[우대 사항]\n- Spark 기반 대용량 배치 처리 경험\n- Kafka 기반 스트리밍 파이프라인 경험\n- 클라우드 DW(BigQuery, Snowflake) 운영 경험',
    analysis: {
      duty: ['배치 · 실시간 데이터 파이프라인 설계 및 운영', '데이터 웨어하우스 모델링 및 품질 관리', '분석가 · ML 엔지니어를 위한 데이터 마트 제공'],
      req: ['데이터 엔지니어링 경력 3년 이상', 'Python 또는 Scala 기반 데이터 처리 경험', 'Airflow 등 워크플로 오케스트레이션 경험', 'SQL 및 데이터 모델링 역량'],
      plus: ['Spark 기반 대용량 배치 처리 경험', 'Kafka 기반 스트리밍 파이프라인 경험', '클라우드 DW(BigQuery, Snowflake) 운영 경험'],
    },
    keywords: [
      { name: 'Airflow', weight: 3 }, { name: 'Python', weight: 3 }, { name: '데이터 모델링', weight: 2 },
      { name: 'Spark', weight: 2 }, { name: 'Kafka', weight: 1 }, { name: 'BigQuery', weight: 1 },
      { name: 'SQL', weight: 1 },
    ],
  },
];

const BASE_DOCS = [
  { id: 'd1', jobId: '1', type: 'resume', version: 2, updatedAt: '2026-07-14', lock: 'editable', covered: ['Spring Boot', 'MSA', 'RESTful API', 'AWS', '트래픽 처리', 'MySQL', '코드 리뷰', 'CI/CD'] },
  { id: 'd2', jobId: '1', type: 'resume', version: 1, updatedAt: '2026-07-10', lock: 'snapshot', covered: ['Spring Boot', 'MSA', 'RESTful API', 'MySQL', '코드 리뷰', 'CI/CD'] },
  { id: 'd3', jobId: '2', type: 'cover-letter', version: 3, updatedAt: '2026-07-14', lock: 'submitted', covered: ['Figma', '디자인 시스템', '사용성 테스트', '프로토타이핑', 'A/B 테스트', '핸드오프'] },
  { id: 'd4', jobId: '3', type: 'resume', version: 1, updatedAt: '2026-07-09', lock: 'submitted', covered: ['React', 'TypeScript', '성능 최적화', '컴포넌트 설계', '테스트 코드'] },
  { id: 'd5', jobId: '5', type: 'resume', version: 1, updatedAt: '2026-06-28', lock: 'submitted', covered: ['Airflow', 'Python', '데이터 모델링', 'Spark', 'Kafka', 'SQL'] },
];

export const LOCK_LABEL = { editable: '편집 가능', snapshot: '스냅샷 잠금', submitted: '제출본 잠금' };

/* ---------- localStorage (사용자가 직접 등록한 공고 / 생성한 서류) ---------- */

const JOB_KEY = 'nansa.jobs.v1';
const DOC_KEY = 'nansa.docs.v1';

function read(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* 저장 실패해도 화면은 동작해야 하므로 무시 */
  }
}

export function getJobs() {
  return [...BASE_JOBS, ...read(JOB_KEY)];
}

export function getJob(id) {
  return getJobs().find(j => String(j.id) === String(id)) || null;
}

export function getDocuments() {
  return [...BASE_DOCS, ...read(DOC_KEY)];
}

export function addJob(job) {
  const custom = read(JOB_KEY);
  const id = 'u' + (custom.length + 1) + '-' + Date.now().toString(36);
  const next = { id, createdAt: new Date().toISOString().slice(0, 10), status: 'interested', tags: [], keywords: [], analysis: null, ...job };
  write(JOB_KEY, [...custom, next]);
  return next;
}

export function addDocument(doc) {
  const custom = read(DOC_KEY);
  const existing = getDocuments().filter(d => d.jobId === doc.jobId && d.type === doc.type);
  const version = existing.reduce((m, d) => Math.max(m, d.version), 0) + 1;
  const id = 'g-' + doc.jobId + '-' + doc.type + '-' + Date.now().toString(36);
  const next = { id, version, updatedAt: todayISO(), lock: 'editable', generated: true, ...doc };
  write(DOC_KEY, [...custom, next]);
  return next;
}

export function resetLocal() {
  write(JOB_KEY, []);
  write(DOC_KEY, []);
}

/* ---------- 날짜 / 포맷 ---------- */

export function todayISO() {
  return TODAY;
}

export function dday(iso) {
  if (!iso) return null;
  const a = new Date(TODAY + 'T00:00:00');
  const b = new Date(iso + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

export function ddayLabel(iso) {
  const d = dday(iso);
  if (d === null) return '';
  if (d === 0) return 'D-DAY';
  return d > 0 ? 'D-' + d : 'D+' + Math.abs(d);
}

export function slash(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return Number(m) + '/' + Number(d);
}

export function dot(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return m + '.' + d;
}

export function agoLabel(iso) {
  const d = dday(iso);
  if (d === null) return '';
  if (d === 0) return '오늘';
  return Math.abs(d) + '일 전';
}

/* ---------- 파생 값 ---------- */

export function coverageOf(doc) {
  const job = getJob(doc.jobId);
  if (!job || !job.keywords.length) return 0;
  return Math.round((doc.covered.length / job.keywords.length) * 100);
}

export function docsOfJob(jobId) {
  return getDocuments()
    .filter(d => String(d.jobId) === String(jobId))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : b.version - a.version));
}

export function latestDocOfJob(jobId) {
  return docsOfJob(jobId)[0] || null;
}

export function getDocument(id) {
  return getDocuments().find(d => d.id === id) || null;
}

export function docName(doc) {
  const job = getJob(doc.jobId);
  return DOC_LABEL[doc.type] + '_' + (job ? job.company : '공고') + '.pdf';
}

/** 공고의 대표 일정 (상태에 따라 무엇을 보여줄지) */
export function scheduleLabel(job) {
  if (job.status === 'rejected') return '결과 ' + dot(job.resultAt);
  if (job.status === 'interview') return '면접 ' + dot(job.interviewAt) + ' 예정';
  if (job.status === 'submitted') return '제출 ' + dot(job.submittedAt);
  return job.deadline ? '마감 ' + dot(job.deadline) + ' · ' + ddayLabel(job.deadline) : '마감일 미정';
}

export function stats() {
  const jobs = getJobs();
  const docs = getDocuments();
  const openStatuses = ['preparing', 'submitted', 'interview'];
  const inProgress = jobs.filter(j => openStatuses.includes(j.status));
  // 아직 제출하지 않았고 7일 안에 마감인 공고
  const closingSoon = jobs.filter(j => {
    if (['submitted', 'interview', 'rejected'].includes(j.status)) return false;
    const d = dday(j.deadline);
    return d !== null && d >= 0 && d <= 7;
  });
  const nearest = closingSoon
    .map(j => dday(j.deadline))
    .sort((a, b) => a - b)[0];
  const latestPerJob = jobs.map(j => latestDocOfJob(j.id)).filter(Boolean);
  const avgCoverage = latestPerJob.length
    ? Math.round(latestPerJob.reduce((sum, d) => sum + coverageOf(d), 0) / latestPerJob.length)
    : 0;
  const byType = {};
  docs.forEach(d => { byType[d.type] = (byType[d.type] || 0) + 1; });
  const applied = jobs.filter(j => ['submitted', 'interview', 'rejected'].includes(j.status));
  return {
    jobs,
    docs,
    inProgress: inProgress.length,
    closingSoon: closingSoon.length,
    nearestDday: nearest === undefined ? null : nearest,
    docCount: docs.length,
    byType,
    avgCoverage,
    reviewWaiting: docs.filter(d => d.lock === 'editable').length,
    applied: applied.length,
    passed: jobs.filter(j => ['interview'].includes(j.status)).length,
    interview: jobs.filter(j => j.status === 'interview').length,
    rejected: jobs.filter(j => j.status === 'rejected').length,
  };
}

export function columnJobs(column) {
  return getJobs().filter(j => STATUS[j.status] && STATUS[j.status].column === column);
}

/* ---------- 붙여넣은 공고 본문 간이 분석 ---------- */

const KEYWORD_DICT = [
  'Spring Boot', 'Spring', 'Java', 'Kotlin', 'MSA', 'RESTful API', 'REST API', 'GraphQL', 'AWS', 'GCP',
  'Kafka', 'MySQL', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'CI/CD', 'React', 'TypeScript',
  'JavaScript', 'Next.js', 'Vue', 'Node.js', 'Python', 'Django', 'SQL', 'Airflow', 'Spark', 'BigQuery',
  'Figma', '디자인 시스템', '사용성 테스트', '프로토타이핑', 'A/B 테스트', '데이터 분석', '코드 리뷰',
  '성능 최적화', '웹 접근성', '테스트 코드', '데이터 모델링', '트래픽 처리', '지표 설계', '대시보드',
];

/** '[담당 업무]' 같은 대괄호 소제목 + '-' 불릿 구조를 파싱해 분석 결과를 만든다. */
export function analyzeJdText(text) {
  if (!text || !text.trim()) return null;
  const buckets = { duty: [], req: [], plus: [] };
  let current = 'duty';
  text.split('\n').forEach(line => {
    const t = line.trim();
    if (!t) return;
    const heading = t.match(/^[\[(]?\s*(.+?)\s*[\])]?$/);
    const head = heading ? heading[1] : t;
    if (/^\[.*\]$/.test(t) || /^[■◆●]/.test(t)) {
      if (/우대|preferred|plus/i.test(head)) current = 'plus';
      else if (/자격|요건|requirement|qualification/i.test(head)) current = 'req';
      else current = 'duty';
      return;
    }
    if (/^[-•*·]\s*/.test(t)) {
      buckets[current].push(t.replace(/^[-•*·]\s*/, ''));
    } else if (t.length > 6 && buckets[current].length < 8) {
      buckets[current].push(t);
    }
  });
  const total = buckets.duty.length + buckets.req.length + buckets.plus.length;
  if (!total) return null;
  const lower = text.toLowerCase();
  const keywords = KEYWORD_DICT
    .filter(k => lower.includes(k.toLowerCase()))
    .slice(0, 9)
    .map((name, i) => ({ name, weight: i < 2 ? 3 : i < 5 ? 2 : 1 }));
  return { analysis: buckets, keywords };
}

