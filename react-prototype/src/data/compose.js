/**
 * 문서 조립 엔진
 *
 * 원칙 하나: **없는 사실은 만들지 않는다.**
 * 모든 문장은 사용자가 프로필에 입력한 경력 문장과 정량 성과(achievements)에서만 나온다.
 * 조립기가 하는 일은 (1) JD 적합도로 고르고 (2) 순서를 바꾸고 (3) 근거를 붙이는 것뿐이다.
 * 근거가 없는 자리는 지어내지 않고 `[수치 필요]` 로 남겨 사용자에게 되돌린다.
 *
 * composeDocument() 하나만 서버 호출로 바꾸면 그대로 LLM 생성으로 승격된다.
 * 그때도 이 파일의 buildContext()가 만든 재료를 프롬프트에 그대로 넣으면 된다.
 */

import { TODAY } from './nansa.js';
import { careerContext, formatAchievement, getBasics } from './career.js';

const LEN_BULLETS = { '짧게': 1, '보통': 2, '길게': 3 };
const LEN_PROJECTS = { '짧게': 2, '보통': 3, '길게': 4 };

/* ---------------- 기간 계산 ---------------- */

function toMonths(value) {
  const m = String(value || '').match(/(\d{4})\D*(\d{1,2})?/);
  if (!m) return null;
  return Number(m[1]) * 12 + (Number(m[2] || 1) - 1);
}

function nowMonths() {
  const [y, mo] = TODAY.split('-');
  return Number(y) * 12 + (Number(mo) - 1);
}

export function totalYears(careers) {
  let months = 0;
  careers.forEach(c => {
    const a = toMonths(c.start);
    const b = /재직|현재|now|ing/i.test(c.end || '') ? nowMonths() : toMonths(c.end);
    if (a != null && b != null && b >= a) months += b - a + 1;
  });
  if (!months) return null;
  return Math.max(1, Math.round(months / 12));
}

/* ---------------- JD 적합도 랭킹 ---------------- */

export function rankCareers(job, careers) {
  const kws = (job.keywords || []).map(k => ({ name: k.name, weight: k.weight || 1, lower: k.name.toLowerCase() }));
  return careers
    .map(c => {
      const hay = [
        c.role, c.project, c.company,
        (c.tags || []).join(' '),
        c.bullets.map(b => b.text).join(' '),
      ].join(' ').toLowerCase();
      const hits = kws.filter(k => hay.includes(k.lower));
      return {
        career: c,
        score: hits.reduce((s, k) => s + k.weight, 0),
        hits: hits.map(h => h.name),
      };
    })
    .sort((a, b) => b.score - a.score);
}

/* ---------------- 재료 준비 ---------------- */

export function buildContext(job, settings) {
  const careers = careerContext();
  const ranked = rankCareers(job, careers);
  const highlight = settings && settings.highlight;
  const chosen = highlight && highlight.size
    ? ranked.filter(r => highlight.has(r.career.id))
    : ranked;
  const limit = LEN_PROJECTS[(settings && settings.length) || '보통'] || 3;
  const picked = (chosen.length ? chosen : ranked).slice(0, limit);

  const achievements = [];
  careers.forEach(c => c.bullets.forEach(b => (b.achievements || []).forEach(a => {
    achievements.push({ ...a, career: c, bullet: b });
  })));

  const covered = new Set();
  picked.forEach(r => r.hits.forEach(h => covered.add(h)));

  const allBullets = picked.reduce((acc, r) => acc.concat(r.career.bullets), []);
  const quantified = allBullets.filter(b => b.quantified).length;

  return {
    careers,
    ranked,
    picked,
    achievements,
    covered: [...covered],
    coverage: (job.keywords || []).length
      ? Math.round((covered.size / job.keywords.length) * 100)
      : 0,
    quantRate: allBullets.length ? Math.round((quantified / allBullets.length) * 100) : 0,
    basics: getBasics(),
    years: totalYears(careers),
  };
}

/* ---------------- 한글 조사 ---------------- */

/** 앞 글자의 받침에 따라 조사를 고른다. (영문·숫자로 끝나면 받침 없음으로 취급) */
export function josa(word, withFinal, withoutFinal) {
  const s = String(word || '');
  if (!s) return withoutFinal;
  const code = s.charCodeAt(s.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return withoutFinal;
  return (code - 0xac00) % 28 !== 0 ? withFinal : withoutFinal;
}

/* ---------------- 톤 ---------------- */

const POLISH_MAP = [
  [/하였습니다/g, '했습니다'],
  [/되었습니다/g, '됐습니다'],
  [/하였고/g, '했고'],
  [/되어\s?있습니다/g, '돼 있습니다'],
  [/\s{2,}/g, ' '],
];

const FILLER_RE = /(매우|정말|굉장히|아주|열심히|적극적으로|최선을 다해|많은|다양한)\s*/g;

export function applyTone(text, tone) {
  let out = text;
  POLISH_MAP.forEach(([re, to]) => { out = out.replace(re, to); });
  if (tone === '간결하게') out = out.replace(FILLER_RE, '');
  return out.trim();
}

/* ---------------- 블록 유틸 ---------------- */

function block(text, opts) {
  return {
    text,
    needsMetric: Boolean(opts && opts.needsMetric),
    source: (opts && opts.source) || '',
    metric: (opts && opts.metric) || '',
  };
}

function bulletBlocks(careerRank, count, tone) {
  return careerRank.career.bullets.slice(0, count).map(b => block(applyTone(b.text, tone), {
    needsMetric: !b.quantified,
    source: `${careerRank.career.company} · ${careerRank.career.project || careerRank.career.role}`,
    metric: (b.achievements || []).map(formatAchievement).join(' · '),
  }));
}

function topAchievements(ctx, n) {
  return ctx.achievements.slice(0, n);
}

/* ---------------- 서류별 조립 ---------------- */

function composeResume(job, ctx, settings) {
  const tone = settings.tone;
  const count = LEN_BULLETS[settings.length] || 2;
  const top = topAchievements(ctx, 2);
  const keyTerms = ctx.covered.slice(0, 3);

  const summaryParts = [];
  summaryParts.push(
    ctx.years
      ? `${job.title} 직무 기준 ${ctx.years}년차입니다.`
      : `${job.title} 직무에 지원합니다.`
  );
  if (keyTerms.length) {
    const tail = keyTerms[keyTerms.length - 1];
    summaryParts.push(`${keyTerms.join(' · ')}${josa(tail, '을', '를')} 중심으로 일해 왔습니다.`);
  }
  if (top.length) summaryParts.push(`대표 성과는 ${top.map(formatAchievement).join(', ')}입니다.`);

  const sections = [
    {
      key: 'basic',
      title: '기본 정보',
      blocks: [
        block(`${ctx.basics.name} · ${ctx.basics.phone}`),
        block(`${ctx.basics.email}${ctx.basics.link ? ` · ${ctx.basics.link}` : ''}`),
      ],
    },
    {
      key: 'summary',
      title: '경력 요약',
      blocks: [
        summaryParts.length > 1
          ? block(applyTone(summaryParts.join(' '), tone))
          : block('프로필에 경력을 먼저 등록해 주세요.', { needsMetric: true }),
      ],
    },
    {
      key: 'project',
      title: '경력 · 프로젝트',
      blocks: ctx.picked.length
        ? ctx.picked.reduce((acc, r) => acc.concat(
            [block(`${r.career.project || r.career.role} · ${r.career.company} (${r.career.start}${r.career.end ? ` – ${r.career.end}` : ''})`, { source: 'heading' })],
            bulletBlocks(r, count, tone),
          ), [])
        : [block('등록된 경력이 없어요.', { needsMetric: true })],
    },
    {
      key: 'skills',
      title: '스킬',
      blocks: [block([...new Set(ctx.covered.concat(ctx.picked.reduce((a, r) => a.concat(r.career.tags || []), [])))].join(' · ') || '등록된 스킬이 없어요.')],
    },
  ];
  return sections;
}

function composeCoverLetter(job, ctx, settings) {
  const tone = settings.tone;
  const analysis = job.analysis || { duty: [], req: [], plus: [] };
  const top = topAchievements(ctx, 2);
  const lead = ctx.picked[0];

  function bulletFor(re) {
    for (const r of ctx.picked) {
      const hit = r.career.bullets.find(b => re.test(b.text));
      if (hit) return { bullet: hit, career: r.career };
    }
    return null;
  }

  const collab = bulletFor(/(협업|코드 리뷰|리뷰|커뮤니케이션|조율|합의|팀|공유|온보딩|교육)/);

  return [
    {
      key: 'motive',
      title: '지원 동기',
      blocks: [
        block(applyTone(
          `${job.company}의 ${job.title} 공고에서 "${(analysis.duty || [])[0] || job.title}" 항목을 보고 지원했습니다.` +
          (lead ? ` ${lead.career.project || lead.career.role}에서 같은 성격의 문제를 다뤄 왔습니다.` : ''),
          tone,
        ), { source: lead ? `${lead.career.company} · ${lead.career.project || lead.career.role}` : '' }),
      ],
    },
    {
      key: 'strength',
      title: '직무 역량',
      blocks: (analysis.req || []).slice(0, 2).map(req => {
        const words = req.split(/[\s,·]+/).filter(w => w.length >= 2);
        const match = bulletFor(new RegExp(words.slice(0, 3).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '')).join('|')));
        if (!match) {
          return block(`"${req}" 요건을 뒷받침할 경험이 프로필에 없습니다. [근거 필요]`, { needsMetric: true });
        }
        return block(applyTone(`"${req}" 요건과 관련해, ${match.bullet.text}`, tone), {
          needsMetric: !match.bullet.quantified,
          source: `${match.career.company} · ${match.career.project || match.career.role}`,
          metric: (match.bullet.achievements || []).map(formatAchievement).join(' · '),
        });
      }),
    },
    {
      key: 'collab',
      title: '협업 경험',
      blocks: [
        collab
          ? block(applyTone(collab.bullet.text, tone), {
              needsMetric: !collab.bullet.quantified,
              source: `${collab.career.company} · ${collab.career.project || collab.career.role}`,
              metric: (collab.bullet.achievements || []).map(formatAchievement).join(' · '),
            })
          : block('협업 관련 경험이 프로필에 없습니다. 프로필에 한 줄 추가해 주세요. [근거 필요]', { needsMetric: true }),
      ],
    },
    {
      key: 'future',
      title: '입사 후 포부',
      blocks: [
        block(applyTone(
          `입사 후 "${(analysis.duty || [])[0] || job.title}"에 먼저 기여하겠습니다.` +
          (top.length ? ` 이전에 ${formatAchievement(top[0])}를 만든 방식을 그대로 적용하겠습니다.` : ''),
          tone,
        )),
      ],
    },
  ];
}

function composePortfolio(job, ctx, settings) {
  const tone = settings.tone;
  const count = LEN_BULLETS[settings.length] || 2;
  return [
    {
      key: 'cover',
      title: '표지 · 요약',
      blocks: [
        block(`${ctx.basics.name} 포트폴리오`),
        block(`${job.company} ${job.title} 지원`),
        block(`핵심 역량 · ${(ctx.covered.slice(0, 4).join(' · ')) || '프로필에서 스킬을 등록해 주세요.'}`),
      ],
    },
    {
      key: 'projects',
      title: '대표 프로젝트',
      blocks: ctx.picked.reduce((acc, r) => acc.concat(
        [block(`${r.career.project || r.career.role} · ${r.career.company}`, { source: 'heading' })],
        bulletBlocks(r, count, tone),
      ), []),
    },
    {
      key: 'metrics',
      title: '성과 지표',
      blocks: ctx.achievements.length
        ? ctx.achievements.map(a => block(formatAchievement(a), {
            source: `${a.career.company} · ${a.career.project || a.career.role}`,
            metric: formatAchievement(a),
          }))
        : [block('아직 수치로 정리된 성과가 없어요. 프로필에서 숫자를 채워 주세요. [수치 필요]', { needsMetric: true })],
    },
    {
      key: 'links',
      title: '링크 · 연락처',
      blocks: [block(`${ctx.basics.email}${ctx.basics.link ? ` · ${ctx.basics.link}` : ''}`)],
    },
  ];
}

const BUILDERS = {
  resume: composeResume,
  'cover-letter': composeCoverLetter,
  portfolio: composePortfolio,
};

/**
 * 실제 문서 조립.
 * @param settings { tone, length, lang, highlight:Set<careerId>, sectionKeys:Set<key> }
 */
export function composeDocument(job, type, settings) {
  const cfg = {
    tone: '표준',
    length: '보통',
    lang: '한국어',
    highlight: null,
    sectionKeys: null,
    ...(settings || {}),
  };
  const ctx = buildContext(job, cfg);
  const builder = BUILDERS[type] || composeResume;
  let sections = builder(job, ctx, cfg);
  if (cfg.sectionKeys && cfg.sectionKeys.size) {
    sections = sections.filter(s => cfg.sectionKeys.has(s.key));
  }

  const bodyBlocks = sections.reduce((acc, s) => acc.concat(s.blocks), [])
    .filter(b => b.source !== 'heading');
  const withMetric = bodyBlocks.filter(b => b.metric).length;
  const needs = bodyBlocks.filter(b => b.needsMetric);

  const byBullet = new Map();
  ctx.achievements.forEach(a => {
    const key = a.bullet.id;
    if (byBullet.has(key)) {
      byBullet.get(key).metric += ' · ' + formatAchievement(a);
      return;
    }
    byBullet.set(key, {
      text: a.bullet.text,
      source: `${a.career.company} · ${a.career.project || a.career.role}`,
      metric: formatAchievement(a),
    });
  });
  const matchPoints = [...byBullet.values()].slice(0, 3);

  return {
    sections,
    matchPoints,
    covered: ctx.covered,
    coverage: ctx.coverage,
    quantRate: bodyBlocks.length ? Math.round((withMetric / bodyBlocks.length) * 100) : 0,
    gaps: needs.length,
    usedCareerIds: ctx.picked.map(r => r.career.id),
    years: ctx.years,
  };
}

/* ---------------- 편집기용 실제 보정 ---------------- */

export function polishText(text) {
  let out = text;
  POLISH_MAP.forEach(([re, to]) => { out = out.replace(re, to); });
  out = out
    .replace(/(습니다)\.\s*(그리고|또한)\s*/g, '$1. ')
    .replace(/\s+([,.])/g, '$1')
    .replace(/\s{2,}/g, ' ');
  return out.trim();
}

export function compressText(text) {
  let out = text.replace(FILLER_RE, '').replace(/\s{2,}/g, ' ').trim();
  const sentences = out.split(/(?<=습니다\.|다\.)\s+/).filter(Boolean);
  if (sentences.length > 1) out = sentences.slice(0, sentences.length - 1).join(' ');
  return out.trim();
}

/**
 * 확장은 "지어내기"가 아니라, 이미 저장된 정량 성과를 근거로 덧붙이는 것만 한다.
 * @param metrics 이미 포맷된 성과 문자열 배열 (예: ['배포 주기 14일 → 2일'])
 */
export function expandText(text, metrics) {
  const list = (metrics || []).filter(Boolean);
  if (!list.length) return null;
  const already = list.filter(l => !text.includes(l));
  if (!already.length) return null;
  const base = text.replace(/\s*$/, '');
  return `${base} 구체적으로는 ${already.join(', ')}의 성과로 이어졌습니다.`;
}
