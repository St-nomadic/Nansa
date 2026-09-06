/**
 * 경력 · 정량 성과(achievements) 데이터 모델
 *
 * 서류의 경쟁력은 문장의 유려함이 아니라 "내 경험에서 숫자를 얼마나 끌어냈는가"에서 갈린다.
 * 이 모듈은 (1) 성과를 문장이 아닌 구조로 보관하고, (2) 숫자가 빠진 문장을 찾아내고,
 * (3) 그 자리를 메우기 위해 되물을 질문을 만든다.
 *
 * 지금은 규칙 기반이지만, followUpQuestions / parseAnswer 두 함수만 서버 호출로 바꾸면
 * 그대로 LLM 기반으로 승격된다. (호출부는 전부 이 두 함수만 본다)
 */

const CAREER_KEY = 'nansa.careers.v1';
const ACH_KEY = 'nansa.achievements.v1';

/* ---------------- 시드 데이터 ---------------- */

const SEED_CAREERS = [
  {
    id: 'c1',
    role: '백엔드 엔지니어',
    company: '다우기술',
    project: 'MSA 전환 프로젝트',
    start: '2023.03',
    end: '2024.06',
    tags: ['Spring Boot', 'MSA', 'Kafka'],
    bullets: [
      { id: 'c1b1', text: '주문·결제 모놀리식 서비스를 8개 마이크로서비스로 분리, 배포 주기를 2주 → 2일로 단축' },
      { id: 'c1b2', text: '서비스 간 통신을 gRPC로 전환해 평균 응답 시간 120ms 개선' },
    ],
  },
  {
    id: 'c2',
    role: '백엔드 엔지니어',
    company: '다우기술',
    project: '커머스 결제 시스템 리팩토링',
    start: '2022.01',
    end: '2022.12',
    tags: ['Java', 'MySQL', 'RESTful API'],
    bullets: [
      { id: 'c2b1', text: '레거시 결제 모듈을 Spring Boot 기반으로 재작성, 트래픽 처리량 3배 증설' },
      { id: 'c2b2', text: '코드 리뷰 체크리스트를 도입해 배포 후 장애 건수를 절반으로 감소' },
    ],
  },
  {
    id: 'c3',
    role: '주니어 백엔드 엔지니어',
    company: '다우기술',
    project: '신입 온보딩 자동화 툴',
    start: '2021.02',
    end: '2021.12',
    tags: ['Node.js', 'CI/CD'],
    bullets: [
      { id: 'c3b1', text: '사내 온보딩 자동화 도구를 구축해 신규 입사자 계정 발급 시간을 단축' },
    ],
  },
];

const SEED_ACHIEVEMENTS = [
  { id: 'a1', careerId: 'c1', bulletId: 'c1b1', metric: '분리한 마이크로서비스', kind: 'count', value: 8, unit: '개' },
  { id: 'a2', careerId: 'c1', bulletId: 'c1b1', metric: '배포 주기', kind: 'delta', before: 14, after: 2, unit: '일', direction: 'down' },
  { id: 'a3', careerId: 'c1', bulletId: 'c1b2', metric: '평균 응답 시간', kind: 'count', value: 120, unit: 'ms', direction: 'down' },
  { id: 'a4', careerId: 'c2', bulletId: 'c2b1', metric: '트래픽 처리량', kind: 'ratio', value: 3, unit: '배', direction: 'up' },
];

/* ---------------- 저장소 ---------------- */

function read(key, seed) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      window.localStorage.setItem(key, JSON.stringify(seed));
      return JSON.parse(JSON.stringify(seed));
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : JSON.parse(JSON.stringify(seed));
  } catch (e) {
    return JSON.parse(JSON.stringify(seed));
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* 저장 실패해도 화면은 동작해야 한다 */
  }
}

function uid(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

export function getCareers() {
  return read(CAREER_KEY, SEED_CAREERS);
}

export function getAchievements() {
  return read(ACH_KEY, SEED_ACHIEVEMENTS);
}

export function saveCareers(list) {
  write(CAREER_KEY, list);
  return list;
}

export function saveAchievements(list) {
  write(ACH_KEY, list);
  return list;
}

export function addCareer(input) {
  const list = getCareers();
  const id = uid('c');
  const bullets = (input.bullets || [])
    .map(t => (typeof t === 'string' ? t : t.text))
    .filter(t => t && t.trim())
    .map(t => ({ id: uid(id + 'b'), text: t.trim() }));
  const next = {
    id,
    role: (input.role || '').trim() || '역할 미입력',
    company: (input.company || '').trim() || '회사 미입력',
    project: (input.project || '').trim(),
    start: (input.start || '').trim(),
    end: (input.end || '').trim(),
    tags: (input.tags || []).filter(Boolean),
    bullets,
  };
  saveCareers([next, ...list]);
  return next;
}

export function removeCareer(careerId) {
  saveCareers(getCareers().filter(c => c.id !== careerId));
  saveAchievements(getAchievements().filter(a => a.careerId !== careerId));
}

export function addBullet(careerId, text) {
  const list = getCareers();
  const bullet = { id: uid(careerId + 'b'), text: text.trim() };
  saveCareers(list.map(c => (c.id === careerId ? { ...c, bullets: [...c.bullets, bullet] } : c)));
  return bullet;
}

export function updateBullet(careerId, bulletId, text) {
  saveCareers(getCareers().map(c => (
    c.id === careerId
      ? { ...c, bullets: c.bullets.map(b => (b.id === bulletId ? { ...b, text } : b)) }
      : c
  )));
}

export function removeBullet(careerId, bulletId) {
  saveCareers(getCareers().map(c => (
    c.id === careerId ? { ...c, bullets: c.bullets.filter(b => b.id !== bulletId) } : c
  )));
  saveAchievements(getAchievements().filter(a => a.bulletId !== bulletId));
}

export function addAchievement(input) {
  const list = getAchievements();
  const next = { id: uid('a'), ...input };
  saveAchievements([...list, next]);
  return next;
}

export function removeAchievement(id) {
  saveAchievements(getAchievements().filter(a => a.id !== id));
}

export function achievementsOfBullet(bulletId) {
  return getAchievements().filter(a => a.bulletId === bulletId);
}

/* ---------------- 수치 감지 ---------------- */

// 한국어 이력서에서 실제로 쓰이는 단위들. 순서가 중요하다(긴 단위 먼저).
const UNITS = [
  '개월', '만원', '억원', '천만원', '개사', '건/일', 'MAU', 'DAU', 'ms',
  '%', '배', '명', '건', '개', '일', '주', '년', '시간', '분', '초', '원', '회', '점', '위', '억', '만',
];

const NUM_RE = new RegExp('(\\d[\\d,]*(?:\\.\\d+)?)\\s*(' + UNITS.join('|') + ')?', 'g');

/** 문장에서 "숫자(+단위)" 조합을 뽑는다. 단위 없는 맨숫자는 약한 신호로만 취급. */
export function detectNumbers(text) {
  if (!text) return [];
  const out = [];
  let m;
  NUM_RE.lastIndex = 0;
  while ((m = NUM_RE.exec(text)) !== null) {
    const value = Number(String(m[1]).replace(/,/g, ''));
    if (!Number.isFinite(value)) continue;
    out.push({ raw: m[0].trim(), value, unit: m[2] || '', index: m.index });
  }
  return out;
}

/** 이 문장이 "정량화된" 문장인가. 연결된 성과가 있거나, 단위 붙은 숫자가 있으면 true. */
export function isQuantified(bullet, achievements) {
  const list = achievements || getAchievements();
  if (list.some(a => a.bulletId === bullet.id)) return true;
  return detectNumbers(bullet.text).some(n => n.unit);
}

/** 수치가 비어 있는 문장 목록. 프로필 상단 "보완하기"가 이걸 쓴다. */
export function quantGaps() {
  const careers = getCareers();
  const achievements = getAchievements();
  const gaps = [];
  careers.forEach(c => {
    c.bullets.forEach(b => {
      if (!isQuantified(b, achievements)) gaps.push({ career: c, bullet: b });
    });
  });
  return gaps;
}

/**
 * 정량성 점수 (0~100)
 * 키워드 커버리지가 "JD 단어가 들어갔나"를 본다면, 이 점수는 "내 숫자가 들어갔나"를 본다.
 */
export function quantScore() {
  const careers = getCareers();
  const achievements = getAchievements();
  const bullets = careers.reduce((acc, c) => acc.concat(c.bullets), []);
  if (!bullets.length) return { score: 0, total: 0, filled: 0, gaps: 0 };
  const filled = bullets.filter(b => isQuantified(b, achievements)).length;
  return {
    score: Math.round((filled / bullets.length) * 100),
    total: bullets.length,
    filled,
    gaps: bullets.length - filled,
  };
}

export function scoreLabel(score) {
  if (score >= 85) return { text: '아주 좋아요', tone: 'good' };
  if (score >= 60) return { text: '조금만 더', tone: 'mid' };
  if (score >= 30) return { text: '보완이 필요해요', tone: 'low' };
  return { text: '숫자가 거의 없어요', tone: 'low' };
}

/* ---------------- 되묻기(성과 인터뷰) 엔진 ---------------- */

const QUESTION_RULES = [
  {
    test: /(개선|향상|최적화|단축|절감|감소|줄|축소|낮)/,
    ask: '개선 전과 후의 수치가 각각 어떻게 됐나요?',
    hint: '예: 14일 → 2일',
    metric: '',
    kind: 'delta',
  },
  {
    test: /(구축|도입|전환|이관|마이그레이션|리팩|재작성|자동화)/,
    ask: '도입한 뒤에 어떤 지표가 얼마나 움직였나요?',
    hint: '예: 처리 시간 3시간 → 20분',
    metric: '',
    kind: 'delta',
  },
  {
    test: /(관리|운영|리드|총괄|주도|PM|프로젝트|일정)/,
    ask: '투입 인원과 기간은 어느 정도였나요?',
    hint: '예: 8명 / 6개월',
    metric: '투입 인원',
    kind: 'count',
  },
  {
    test: /(고객|클라이언트|발주|계약|수주|제안)/,
    ask: '고객사 수나 계약 규모를 숫자로 말하면 얼마인가요?',
    hint: '예: 4개사 / 12억원',
    metric: '고객사 수',
    kind: 'count',
  },
  {
    test: /(장애|이슈|버그|오류|결함|리스크)/,
    ask: '건수가 얼마에서 얼마로 줄었나요?',
    hint: '예: 월 12건 → 5건',
    metric: '장애 건수',
    kind: 'delta',
  },
  {
    test: /(설계|개발|제작|구현|산출물|문서|화면)/,
    ask: '몇 건(개)을 다뤘나요? 규모를 숫자로 알려주세요.',
    hint: '예: 화면 120개 / 산출물 38건',
    metric: '산출물 수',
    kind: 'count',
  },
  {
    test: /(교육|온보딩|가이드|매뉴얼|전파)/,
    ask: '대상 인원이나 소요 시간이 얼마나 바뀌었나요?',
    hint: '예: 30명 / 3일 → 4시간',
    metric: '대상 인원',
    kind: 'count',
  },
  {
    test: /(매출|비용|예산|수익|투자)/,
    ask: '금액으로는 얼마 규모였나요?',
    hint: '예: 연 2.4억원 절감',
    metric: '금액',
    kind: 'count',
  },
];

const DEFAULT_QUESTION = {
  ask: '이 일을 숫자 하나로 말한다면 어떤 숫자인가요?',
  hint: '규모·기간·비율 무엇이든 좋아요',
  metric: '',
  kind: 'count',
};

/**
 * 문장 하나에 대해 되물을 질문을 만든다. (최대 2개)
 * 나중에 이 함수를 `POST /achievements/follow-ups` 호출로 바꾸면 그대로 LLM 버전이 된다.
 */
export function followUpQuestions(text) {
  const matched = QUESTION_RULES.filter(r => r.test.test(text || ''));
  const picked = matched.slice(0, 2).map((r, i) => ({
    id: 'q' + i,
    ask: r.ask,
    hint: r.hint,
    metric: r.metric,
    kind: r.kind,
  }));
  if (!picked.length) picked.push({ id: 'q0', ...DEFAULT_QUESTION });
  return picked;
}

/** SI·PM 직군에서 실제로 먹히는 지표들. 답변 입력 위 칩으로 노출된다. */
export const METRIC_PRESETS = [
  { label: '투입 인원', unit: '명' },
  { label: '프로젝트 기간', unit: '개월' },
  { label: '예산 규모', unit: '억원' },
  { label: '일정 준수율', unit: '%' },
  { label: '변경요청 건수', unit: '건' },
  { label: '산출물 수', unit: '건' },
  { label: '결함률', unit: '%' },
  { label: '고객사 수', unit: '개사' },
  { label: '처리 리드타임', unit: '일' },
  { label: '재계약·추가수주', unit: '건' },
];

/**
 * 사용자의 짧은 답변에서 수치를 뽑아 성과 구조로 만든다.
 * "14일에서 2일로" / "14일 -> 2일" / "8명" 같은 자연스러운 입력을 그대로 받는다.
 */
export function parseAnswer(answer, question, contextText) {
  const nums = detectNumbers(answer);
  if (!nums.length) return null;
  const isDelta = nums.length >= 2 && /→|->|=>|에서|부터|~/.test(answer);
  const metric = (question && question.metric)
    || guessMetric(answer)
    || inferMetric(answer)
    || inferMetric(contextText)
    || '성과';
  if (isDelta) {
    const [a, b] = nums;
    return {
      kind: 'delta',
      metric,
      before: a.value,
      after: b.value,
      unit: b.unit || a.unit || '',
      direction: b.value < a.value ? 'down' : 'up',
    };
  }
  const first = nums[0];
  return {
    kind: first.unit === '배' ? 'ratio' : 'count',
    metric,
    value: first.value,
    unit: first.unit || '',
  };
}

function guessMetric(answer) {
  const hit = METRIC_PRESETS.find(p => answer.includes(p.label));
  return hit ? hit.label : '';
}

// "장애 건수를 줄였다" 같은 문장에서 지표 이름만 뽑아낸다.
const METRIC_NOUN_RE = /([가-힣A-Za-z][가-힣A-Za-z ·]{0,4}?(건수|비율|이탈률|준수율|결함률|응답 시간|처리 시간|리드타임|처리량|점유율|만족도|주기|기간|인원|규모|매출|비용|예산|시간))/;

function inferMetric(text) {
  if (!text) return '';
  const m = String(text).match(METRIC_NOUN_RE);
  return m ? m[1].trim() : '';
}

/** 성과 구조를 사람이 읽는 한 줄로 (칩·미리보기용) */
export function formatAchievement(a) {
  if (!a) return '';
  if (a.kind === 'delta') return `${a.metric} ${a.before}${a.unit} → ${a.after}${a.unit}`;
  if (a.kind === 'ratio') return `${a.metric} ${a.value}${a.unit || '배'}`;
  return `${a.metric} ${a.value}${a.unit}`;
}

/** 원래 문장에 수치를 자연스럽게 얹은 제안 문장. 사용자가 수정한 뒤 적용한다. */
export function suggestBulletText(original, parsed) {
  const base = (original || '').replace(/\s*$/, '');
  if (!parsed) return base;
  const already = detectNumbers(base).some(n => n.unit);
  const phrase = parsed.kind === 'delta'
    ? `${parsed.metric} ${parsed.before}${parsed.unit} → ${parsed.after}${parsed.unit}`
    : `${parsed.metric} ${parsed.value}${parsed.unit}`;
  if (already) return `${base} · ${phrase}`;
  return base.endsWith('.') ? `${base.slice(0, -1)} (${phrase})` : `${base} (${phrase})`;
}

/** 프로필 전체를 문서 생성기가 쓰기 좋은 형태로 (다음 단계에서 프롬프트에 그대로 넣는다) */
export function careerContext() {
  const careers = getCareers();
  const achievements = getAchievements();
  return careers.map(c => ({
    ...c,
    bullets: c.bullets.map(b => ({
      ...b,
      achievements: achievements.filter(a => a.bulletId === b.id),
      quantified: isQuantified(b, achievements),
    })),
  }));
}
