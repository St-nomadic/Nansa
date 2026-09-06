/**
 * 면접 시뮬레이션 엔진
 *
 * 재료는 딱 두 가지다.
 *  1) 지원한 공고의 JD 분석 결과 (담당업무 / 자격요건 / 우대사항 / 키워드)
 *  2) 그 공고로 실제 제출·생성한 서류 (반영된 키워드, 프로필의 정량 성과)
 *
 * 그래서 "일반적인 면접 질문"이 아니라 "이 공고 × 내 서류"에서만 나올 수 있는 질문이 나온다.
 * 특히 서류에 적힌 숫자를 되짚는 질문(kind: 'achievement')과
 * 서류에 없는 키워드를 찌르는 질문(kind: 'gap')이 이 엔진의 핵심이다.
 *
 * buildPlan / evaluateAnswer 두 함수만 서버 호출로 교체하면 LLM 면접관으로 승격된다.
 */

import { DOC_LABEL, coverageOf, docsOfJob, getJob } from './nansa.js';
import { formatAchievement, getAchievements, getCareers } from './career.js';

const SESSION_KEY = 'nansa.interviews.v1';

export const PERSONAS = [
  {
    key: 'lead',
    name: '실무 팀장',
    initial: '팀',
    tagline: '경험이 진짜인지, 본인 몫이 얼마인지 파고듭니다',
    desc: '서류에 적힌 수치와 요건 하나하나를 사례로 확인해요. 가장 압박이 셉니다.',
  },
  {
    key: 'hr',
    name: '인사 담당자',
    initial: '인',
    tagline: '동기와 협업 방식, 조직 적합성을 봅니다',
    desc: '왜 우리 회사인지, 갈등 상황에서 어떻게 움직이는지를 물어요.',
  },
  {
    key: 'exec',
    name: '임원',
    initial: '임',
    tagline: '판단의 근거와 큰 그림을 묻습니다',
    desc: '의사결정 이유, 실패 경험, 앞으로의 기여를 짧고 굵게 확인해요.',
  },
];

export function getPersona(key) {
  return PERSONAS.find(p => p.key === key) || PERSONAS[0];
}

/* ---------------- 질문 계획 수립 ---------------- */

function q(kind, text, ref) {
  return { id: kind + '-' + Math.random().toString(36).slice(2, 7), kind, text, ref: ref || '' };
}

/** 이 공고 서류에 반영된 키워드 / 아직 안 잡힌 키워드 */
export function keywordSplit(job) {
  const docs = docsOfJob(job.id);
  const covered = new Set();
  docs.forEach(d => (d.covered || []).forEach(k => covered.add(k)));
  const all = job.keywords || [];
  return {
    covered: all.filter(k => covered.has(k.name)),
    missing: all.filter(k => !covered.has(k.name)),
    docs,
  };
}

/** 프로필에 저장된 정량 성과 중 이 면접에서 되짚을 만한 것 */
function pickAchievements(limit) {
  const achievements = getAchievements();
  const careers = getCareers();
  const byBullet = {};
  careers.forEach(c => c.bullets.forEach(b => { byBullet[b.id] = { career: c, bullet: b }; }));
  return achievements
    .filter(a => byBullet[a.bulletId])
    .slice(0, limit)
    .map(a => ({ ...a, ctx: byBullet[a.bulletId] }));
}

export function buildPlan(job, personaKey) {
  const persona = getPersona(personaKey);
  const analysis = job.analysis || { duty: [], req: [], plus: [] };
  const { missing } = keywordSplit(job);
  const plan = [];

  plan.push(q(
    'opening',
    `안녕하세요. ${job.company} ${job.title} 면접에 오신 걸 환영합니다. 먼저 1분 정도로 본인 소개와, 이 직무에서 가장 자신 있는 강점 하나를 말씀해 주세요.`,
  ));

  if (persona.key === 'lead') {
    (analysis.req || []).slice(0, 3).forEach(r => {
      plan.push(q('req', `공고 자격 요건에 "${r}"가 있습니다. 실제로 해보신 사례를 상황–행동–결과 순서로 설명해 주세요.`, r));
    });
    pickAchievements(2).forEach(a => {
      plan.push(q(
        'achievement',
        `서류에 "${formatAchievement(a)}"라고 쓰셨습니다. 그 숫자는 어떻게 측정하셨고, 그중 본인이 직접 기여한 부분은 어디까지인가요?`,
        formatAchievement(a),
      ));
    });
    (analysis.duty || []).slice(0, 1).forEach(d => {
      plan.push(q('duty', `입사하시면 "${d}" 업무를 맡게 됩니다. 첫 3개월 동안 무엇부터 손대실 건가요?`, d));
    });
    missing.slice(0, 2).forEach(k => {
      plan.push(q('gap', `제출하신 서류에서는 ${k.name} 관련 경험이 확인되지 않았습니다. 다뤄보신 적 있나요? 없다면 어떻게 메우실 생각인가요?`, k.name));
    });
  }

  if (persona.key === 'hr') {
    plan.push(q('motive', `여러 회사 중에 ${job.company}에 지원하신 이유가 궁금합니다. 저희 회사의 어떤 점을 보고 오셨나요?`));
    plan.push(q('collab', '함께 일하던 동료와 의견이 정면으로 부딪힌 적이 있나요? 그때 본인이 어떻게 행동했는지 구체적으로 말씀해 주세요.'));
    plan.push(q('move', '이직(또는 지원)을 결심하게 된 계기는 무엇인가요? 지금 조직에서 아쉬웠던 점을 솔직하게 말씀해 주셔도 좋습니다.'));
    (analysis.plus || []).slice(0, 1).forEach(p => {
      plan.push(q('plus', `우대 사항에 "${p}"가 있습니다. 관련해서 스스로 준비해 온 게 있다면 알려주세요.`, p));
    });
    plan.push(q('fit', '어떤 방식으로 일할 때 성과가 가장 잘 나오나요? 반대로 잘 안 맞는 환경은 어떤 곳인가요?'));
  }

  if (persona.key === 'exec') {
    plan.push(q('decision', '지금까지 커리어에서 가장 어려웠던 의사결정 하나를 골라 주세요. 무엇을 근거로 판단하셨나요?'));
    plan.push(q('failure', '기대만큼 안 됐던 프로젝트가 있을 텐데요. 무엇이 원인이었고, 그다음에 무엇을 바꾸셨나요?'));
    (analysis.duty || []).slice(0, 1).forEach(d => {
      plan.push(q('impact', `"${d}"를 맡는다고 했을 때, 1년 뒤 어떤 숫자가 달라져 있으면 성공이라고 보시나요?`, d));
    });
    plan.push(q('growth', '3년 뒤에 어떤 사람이 되어 있고 싶으신가요? 그게 이 자리와 어떻게 연결되나요?'));
  }

  plan.push(q('closing', '마지막으로 저희에게 궁금한 점이나, 꼭 하고 싶은 말씀이 있으면 편하게 말씀해 주세요.'));
  return plan;
}

/* ---------------- 답변 평가 ---------------- */

const ROLE_RE = /(제가|저는|제 |본인이|직접|주도|담당|맡아|리드)/;
const RESULT_RE = /(결과|그래서|덕분에|개선|달성|줄|늘|단축|절감|성공|전환|해결)/;
const NUM_RE = /\d/;

const NEEDS_NUMBER = ['req', 'achievement', 'duty', 'impact', 'plus'];
// 마무리·역질문 성격의 문항은 되묻지 않는다 (기계처럼 보인다)
const NO_FOLLOWUP = ['closing'];
// "본인 역할" 되묻기가 자연스러운 문항만
const ROLE_MATTERS = ['req', 'achievement', 'collab', 'decision', 'failure', 'opening'];

export function evaluateAnswer(answer, question) {
  const text = (answer || '').trim();
  const hasNumber = NUM_RE.test(text);
  const hasRole = ROLE_RE.test(text);
  const hasResult = RESULT_RE.test(text);
  const len = text.length;

  let score = 30;
  if (len >= 60) score += 20;
  else if (len >= 30) score += 10;
  if (hasRole) score += 15;
  if (hasResult) score += 15;
  if (hasNumber) score += 20;
  score = Math.max(0, Math.min(100, score));

  const tags = [];
  if (hasNumber) tags.push({ label: '수치 있음', tone: 'good' });
  else tags.push({ label: '수치 없음', tone: 'warn' });
  if (hasRole) tags.push({ label: '본인 역할 명확', tone: 'good' });
  else tags.push({ label: '역할 불명확', tone: 'warn' });
  if (len < 30) tags.push({ label: '너무 짧음', tone: 'warn' });

  let followUp = null;
  if (NO_FOLLOWUP.includes(question.kind)) {
    followUp = null;
  } else if (len < 25) {
    followUp = '답변이 조금 짧네요. 어떤 상황이었고, 본인이 무엇을 했고, 결과가 어땠는지 순서대로 다시 말씀해 주시겠어요?';
  } else if (!hasNumber && NEEDS_NUMBER.includes(question.kind)) {
    followUp = '좋습니다. 그런데 규모가 잘 안 그려지네요. 인원·기간·건수·비율 무엇이든 좋으니 숫자를 하나만 붙여서 다시 말씀해 주세요.';
  } else if (!hasRole && ROLE_MATTERS.includes(question.kind)) {
    followUp = '팀이 한 일 말고, 그 안에서 본인이 직접 판단하고 실행한 부분만 짚어주실 수 있을까요?';
  }

  return { score, hasNumber, hasRole, hasResult, length: len, tags, followUp };
}

/** 면접관이 다음 말로 붙일 짧은 리액션 (기계처럼 안 보이게) */
export function reaction(evaluation) {
  if (evaluation.score >= 80) return '네, 구체적이라 잘 이해됐습니다.';
  if (evaluation.score >= 60) return '알겠습니다. 잘 들었어요.';
  if (evaluation.score >= 40) return '네, 확인했습니다.';
  return '음, 조금 더 들어봐야 할 것 같네요.';
}

/* ---------------- 리포트 ---------------- */

export function buildReport(job, plan, turns) {
  const answered = turns.filter(t => t.role === 'me');
  const evals = answered.map(t => t.evaluation).filter(Boolean);
  const avg = evals.length ? Math.round(evals.reduce((s, e) => s + e.score, 0) / evals.length) : 0;
  const withNumber = evals.filter(e => e.hasNumber).length;
  const numberRate = evals.length ? Math.round((withNumber / evals.length) * 100) : 0;

  const askedRefs = new Set(plan.filter(p => p.ref).map(p => p.ref));
  const reqs = (job.analysis && job.analysis.req) || [];
  const checkedReqs = reqs.filter(r => askedRefs.has(r));

  // 답변 안에서 새로 나온 숫자 → 프로필 성과 후보 (여기서 루프가 닫힌다)
  const candidates = [];
  answered.forEach(t => {
    if (!t.evaluation || !t.evaluation.hasNumber) return;
    const sentences = t.text.split(/[。\n]|\.(?!\d)/).map(s => s.trim()).filter(s => s && /\d/.test(s));
    sentences.slice(0, 1).forEach(s => {
      if (candidates.length < 5 && !candidates.some(c => c.text === s)) {
        candidates.push({ text: s.length > 90 ? s.slice(0, 90) + '…' : s, question: t.questionText || '' });
      }
    });
  });

  const strengths = [];
  const improvements = [];
  if (numberRate >= 60) strengths.push('답변 대부분에 숫자가 들어가 규모가 잘 전달됐어요.');
  else improvements.push(`숫자가 들어간 답변이 ${numberRate}%뿐이에요. 면접관이 가장 먼저 기억하는 건 숫자입니다.`);
  if (evals.filter(e => e.hasRole).length / (evals.length || 1) >= 0.6) strengths.push('"제가 무엇을 했다"가 분명해서 기여도가 드러났어요.');
  else improvements.push('팀의 성과와 본인의 역할이 섞여 있어요. 주어를 "제가"로 바꿔 말해보세요.');
  if (evals.filter(e => e.length >= 60).length / (evals.length || 1) >= 0.6) strengths.push('답변 길이가 충분해서 맥락이 잘 잡혔어요.');
  else improvements.push('답변이 짧은 편이에요. 상황–행동–결과 세 문장만 지켜도 길이가 맞습니다.');

  return {
    avg,
    numberRate,
    answeredCount: answered.length,
    planCount: plan.length,
    checkedReqs,
    totalReqs: reqs.length,
    candidates,
    strengths,
    improvements,
  };
}

/* ---------------- 세션 저장 ---------------- */

export function saveSession(session) {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const next = [{ ...session, savedAt: new Date().toISOString() }, ...list].slice(0, 20);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch (e) {
    /* 무시 */
  }
}

export function getSessions() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/** 면접 준비가 된 공고인지 (JD 분석 + 서류) */
export function interviewReadiness(jobId) {
  const job = getJob(jobId);
  if (!job) return { ready: false, reason: 'no-job' };
  if (!job.analysis) return { ready: false, reason: 'no-analysis', job };
  const docs = docsOfJob(job.id);
  return {
    ready: true,
    job,
    docs,
    docLabel: docs.map(d => `${DOC_LABEL[d.type]} v${d.version}`).join(' · '),
    avgCoverage: docs.length ? Math.round(docs.reduce((s, d) => s + coverageOf(d), 0) / docs.length) : 0,
  };
}
