/* NANSA document generator — F-KMYJSL (서류 생성), F-SKTTCN (매칭 근거),
   F-PBPCEO (생성 설정), F-DVUUWF (AI 보정), F-IDJPGB (키워드 커버리지),
   S-AFXUIN/S-KITKZI (파일명/저장 규칙).
   Rule-based engine: builds tailored drafts from profile data + JD analysis. */
(function (global) {
  'use strict';

  const TONE_PREFIX = { 간결: '', 표준: '', 강조: '주도적으로 ' };
  const LEN_BULLETS = { 짧게: 1, 보통: 2, 길게: 3 };

  function overlap(jobSkills, profileSkills) {
    const setP = new Set(profileSkills.map((s) => s.toLowerCase()));
    return (jobSkills || []).filter((sk) => setP.has(sk.toLowerCase()));
  }

  function pickEmphasized(profile, emphasisIds) {
    const chosen = profile.experiences.filter((e) => emphasisIds.includes(e.id));
    return chosen.length ? chosen : profile.experiences.slice(0, 1);
  }

  function matchedInText(text, overlapSkills) {
    const lower = (text || '').toLowerCase();
    return overlapSkills.filter((sk) => lower.includes(sk.toLowerCase()));
  }

  function condense(sentence, tone) {
    if (tone !== '간결') return sentence;
    return sentence.replace(/하였습니다/g, '했습니다').replace(/\s{2,}/g, ' ');
  }

  /* ---------------- Korean templates ---------------- */

  function buildResumeKo(job, profile, settings, emphExps, ov) {
    const tonePrefix = TONE_PREFIX[settings.tone] || '';
    const lenCount = LEN_BULLETS[settings.length] || 2;
    const sections = [];
    const coreSkills = ov.slice(0, 3).join(', ') || (job.skills || [])[0] || '핵심';

    sections.push({
      id: 'summary', title: '요약',
      body: condense(`${profile.name} — ${job.title} 지원. ${profile.summary} ${job.company}이(가) 필요로 하는 ${coreSkills} 역량을 갖추고 있습니다.`, settings.tone),
      matched: ov.slice(0, 3),
    });
    emphExps.forEach((exp) => {
      const bullets = exp.bullets.slice(0, lenCount).map((b) => tonePrefix + b);
      sections.push({
        id: 'exp-' + exp.id, title: `${exp.company} · ${exp.role} (${exp.period})`,
        body: bullets.join('\n'),
        matched: matchedInText(exp.bullets.join(' '), ov),
      });
    });
    sections.push({ id: 'skills', title: '보유 기술', body: profile.skills.join(' · '), matched: ov });
    return sections;
  }

  function buildCoverKo(job, profile, settings, emphExps, ov) {
    const tonePrefix = TONE_PREFIX[settings.tone] || '';
    const lenCount = LEN_BULLETS[settings.length] || 2;
    const firstDuty = (job.duties || [])[0] || '핵심 과제';
    const lastDuty = (job.duties || [])[(job.duties || []).length - 1] || firstDuty;
    const mainExp = emphExps[0];
    return [
      {
        id: 'motive', title: '지원 동기',
        body: condense(`${job.company}이(가) "${firstDuty}"을(를) 핵심 과제로 삼는다는 점에 공감하여 지원합니다.${mainExp ? ` ${mainExp.company}에서 ${tonePrefix}${mainExp.bullets[0]}` : ''} 경험을 바탕으로 기여하고 싶습니다.`, settings.tone),
        matched: ov.slice(0, 2),
      },
      {
        id: 'strength', title: '강점 및 경험',
        body: emphExps.slice(0, lenCount).map((e) => `${e.company}: ${tonePrefix}${e.bullets[0]}`).join('\n'),
        matched: ov,
      },
      {
        id: 'closing', title: '입사 후 포부',
        body: condense(`입사 후 ${job.title}로서 "${lastDuty}"에 기여하며 팀과 함께 성장하고 싶습니다.`, settings.tone),
        matched: [],
      },
    ];
  }

  function buildPortfolioKo(job, profile, settings, emphExps, ov) {
    const lenCount = LEN_BULLETS[settings.length] || 2;
    const sections = [
      {
        id: 'cover', title: '표지',
        body: `${profile.name} 포트폴리오\n${job.company} ${job.title} 지원\n핵심 역량: ${(ov.length ? ov : profile.skills).slice(0, 4).join(' · ')}`,
        matched: ov.slice(0, 4),
      },
    ];
    emphExps.forEach((exp) => {
      sections.push({
        id: 'pf-' + exp.id, title: `프로젝트 — ${exp.company} (${exp.period})`,
        body: [`역할: ${exp.role}`].concat(exp.bullets.slice(0, lenCount).map((b) => `성과: ${b}`)).join('\n'),
        matched: matchedInText(exp.bullets.join(' '), ov),
      });
    });
    sections.push({
      id: 'stack', title: '기술 스택 요약',
      body: profile.skills.join(' · '),
      matched: ov,
    });
    return sections;
  }

  /* ---------------- English templates (S-USKVZZ) ---------------- */

  function buildResumeEn(job, profile, settings, emphExps, ov) {
    const lenCount = LEN_BULLETS[settings.length] || 2;
    const coreSkills = ov.slice(0, 3).join(', ') || (job.skills || [])[0] || 'core';
    const sections = [
      {
        id: 'summary', title: 'Summary',
        body: `${profile.name} — applying for ${job.title} at ${job.company}. Experienced professional with a track record in ${coreSkills}.`,
        matched: ov.slice(0, 3),
      },
    ];
    emphExps.forEach((exp) => {
      sections.push({
        id: 'exp-' + exp.id, title: `${exp.company} · ${exp.role} (${exp.period})`,
        body: exp.bullets.slice(0, lenCount).map((b) => '- ' + b).join('\n'),
        matched: matchedInText(exp.bullets.join(' '), ov),
      });
    });
    sections.push({ id: 'skills', title: 'Skills', body: profile.skills.join(' · '), matched: ov });
    return sections;
  }

  function buildCoverEn(job, profile, settings, emphExps, ov) {
    const firstDuty = (job.duties || [])[0] || 'the team mission';
    const mainExp = emphExps[0];
    return [
      {
        id: 'motive', title: 'Motivation',
        body: `I am applying to ${job.company} because I resonate with its focus on "${firstDuty}".${mainExp ? ` At ${mainExp.company}, I ${mainExp.bullets[0]}` : ''}`,
        matched: ov.slice(0, 2),
      },
      {
        id: 'strength', title: 'Strengths & Experience',
        body: emphExps.map((e) => `${e.company}: ${e.bullets[0]}`).join('\n'),
        matched: ov,
      },
      {
        id: 'closing', title: 'Closing',
        body: `As a ${job.title}, I look forward to contributing and growing with the team.`,
        matched: [],
      },
    ];
  }

  /* ---------------- public API ---------------- */

  const DOC_TYPE_LABEL = { resume: '이력서', cover: '자기소개서', portfolio: '포트폴리오' };

  /**
   * Generate a tailored document draft.
   * @returns { sections, overlapSkills, missing, matchScore }
   */
  function generate(job, profile, settings, emphasisIds, docType) {
    const ov = overlap(job.skills || [], profile.skills || []);
    const missing = (job.skills || []).filter((sk) => !ov.includes(sk));
    const emphExps = pickEmphasized(profile, emphasisIds || []);
    const en = settings.lang === '영어';

    let sections;
    if (docType === 'resume') sections = (en ? buildResumeEn : buildResumeKo)(job, profile, settings, emphExps, ov);
    else if (docType === 'cover') sections = (en ? buildCoverEn : buildCoverKo)(job, profile, settings, emphExps, ov);
    else sections = buildPortfolioKo(job, profile, settings, emphExps, ov); // portfolio: Korean template (EN 미지원 명시)

    const matchScore = Math.round((ov.length / ((job.skills || []).length || 1)) * 100);
    return { sections, overlapSkills: ov, missing, matchScore };
  }

  /**
   * S-POIHPJ: keyword coverage against the *current* (possibly edited) document text.
   * Returns { covered: [skill], missing: [skill], score }.
   */
  function coverage(job, profile, sections) {
    const docText = (sections || []).map((s) => s.title + '\n' + s.body).join('\n').toLowerCase();
    const profileSet = new Set((profile.skills || []).map((s) => s.toLowerCase()));
    const covered = [];
    const missing = [];
    for (const sk of job.skills || []) {
      if (docText.includes(sk.toLowerCase()) || profileSet.has(sk.toLowerCase())) covered.push(sk);
      else missing.push(sk);
    }
    const score = Math.round((covered.length / ((job.skills || []).length || 1)) * 100);
    return { covered, missing, score };
  }

  // S-NCWNEF: suggest where to insert a missing keyword.
  function insertionSuggestion(docType, keyword) {
    if (docType === 'resume') return `'보유 기술' 또는 관련 경력 불릿에 "${keyword}" 경험을 추가해 보세요.`;
    if (docType === 'cover') return `'강점 및 경험' 문단에 "${keyword}" 관련 경험을 한 문장 추가해 보세요.`;
    return `'기술 스택 요약' 또는 관련 프로젝트에 "${keyword}"을(를) 언급해 보세요.`;
  }

  /* F-DVUUWF: rule-based refinement (문장 다듬기/압축/확장/강조).
     Deterministic text transforms — labelled in the UI as 규칙 기반 보정. */
  const REFINERS = {
    polish(body) {
      return body
        .split('\n')
        .map((line) => line.trim().replace(/\s{2,}/g, ' ').replace(/([가-힣])\.\.+/g, '$1.'))
        .filter((l, i, arr) => l || arr[i - 1]) // collapse duplicate blank lines
        .join('\n');
    },
    shorten(body) {
      const lines = body.split('\n').filter(Boolean);
      const kept = lines.slice(0, Math.max(1, Math.ceil(lines.length * 0.6)));
      return kept.map((l) => (l.length > 60 ? l.slice(0, 57).replace(/[,·\s]+\S*$/, '') + '…' : l)).join('\n');
    },
    lengthen(body, ctx) {
      const skills = (ctx && ctx.matched && ctx.matched.length) ? ctx.matched.join(', ') : null;
      const extra = skills
        ? `이 과정에서 ${skills} 역량을 실무에 적용하며 문제를 구조적으로 해결했습니다.`
        : '이 경험을 통해 협업과 문제 해결 역량을 함께 키웠습니다.';
      return body + '\n' + extra;
    },
    emphasize(body) {
      return body
        .split('\n')
        .map((line) => {
          if (!line.trim()) return line;
          if (/^(주도적으로|성과:|역할:|- )/.test(line)) return line;
          return line.replace(/했습니다|하였습니다/g, '해냈습니다');
        })
        .join('\n');
    },
  };

  const REFINER_LABELS = { polish: '문장 다듬기', shorten: '더 짧게', lengthen: '더 길게', emphasize: '더 강하게' };

  function refine(body, op, ctx) {
    const fn = REFINERS[op];
    if (!fn) throw new Error('unknown refine op: ' + op);
    return fn(body, ctx || {});
  }

  // S-AFXUIN / S-KITKZI: '회사명_직무_문서유형_버전_날짜' file naming rule.
  function docFileName(job, docType, version, date) {
    const clean = (v) => String(v || '').replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '') || '미정';
    const d = date || new Date().toISOString().slice(0, 10);
    return `${clean(job.company)}_${clean(job.title)}_${DOC_TYPE_LABEL[docType] || docType}_v${version}_${d}`;
  }

  global.NansaGenerator = {
    generate, coverage, insertionSuggestion, refine,
    REFINER_LABELS, DOC_TYPE_LABEL, docFileName,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.NansaGenerator;
})(typeof window !== 'undefined' ? window : globalThis);
