/* NANSA JD analyzer — F-JDHTDX (키워드/역량/요건 추출), F-AUFVEW (공고 등록), S-BINBDK (직무/레벨 추정)
   Pure client-side, rule-based structuring of pasted JD text or URL. */
(function (global) {
  'use strict';

  // Canonical skill -> aliases (lowercased match). S-UGCVJF: aliases collapse to one keyword.
  const SKILL_DICTIONARY = {
    'Kotlin': ['kotlin'], 'Java': ['java'], 'Python': ['python'], 'Go': ['golang', 'go언어'],
    'TypeScript': ['typescript', 'ts'], 'JavaScript': ['javascript', 'js', '자바스크립트'],
    'React': ['react', 'reactjs', 'react.js', '리액트'], 'Vue': ['vue', 'vuejs', 'vue.js'],
    'Next.js': ['next.js', 'nextjs'], 'Node.js': ['node.js', 'nodejs', 'node'],
    'Spring Boot': ['spring boot', 'springboot', '스프링부트', '스프링 부트'], 'Spring': ['spring', '스프링'],
    'Django': ['django'], 'FastAPI': ['fastapi'],
    'MySQL': ['mysql'], 'PostgreSQL': ['postgresql', 'postgres'], 'Redis': ['redis'],
    'MongoDB': ['mongodb', 'mongo'], 'NoSQL': ['nosql'], 'RDB': ['rdb', 'rdbms'],
    'SQL': ['sql'], 'Kafka': ['kafka', '카프카'], 'Elasticsearch': ['elasticsearch'],
    'AWS': ['aws', 'amazon web services'], 'GCP': ['gcp', 'google cloud'], 'Azure': ['azure'],
    'Kubernetes': ['kubernetes', 'k8s', '쿠버네티스'], 'Docker': ['docker', '도커'],
    'MSA': ['msa', 'microservice', 'microservices', '마이크로서비스'],
    'REST API': ['rest api', 'restful', 'rest'], 'GraphQL': ['graphql'], 'gRPC': ['grpc'],
    'CI/CD': ['ci/cd', 'cicd'], 'Terraform': ['terraform'], 'Git': ['git'],
    'Figma': ['figma', '피그마'], 'Design System': ['design system', '디자인 시스템', '디자인시스템'],
    'UX Research': ['ux research', 'ux 리서치', '사용자 리서치', '유저 리서치'],
    'Prototyping': ['prototyping', '프로토타이핑', '프로토타입'],
    'A/B Test': ['a/b 테스트', 'a/b test', 'ab test', 'ab테스트'],
    'GA4': ['ga4', 'google analytics'], 'Amplitude': ['amplitude', '앰플리튜드'],
    'Growth': ['growth', '그로스'], 'SEO': ['seo'], 'CRM': ['crm'],
    'Machine Learning': ['machine learning', 'ml', '머신러닝'], 'LLM': ['llm'],
    'Data Pipeline': ['data pipeline', '데이터 파이프라인', 'etl'],
    'Tableau': ['tableau'], 'Looker': ['looker'],
    'Communication': ['커뮤니케이션', 'communication'], 'Collaboration': ['협업', 'collaboration'],
    'Problem Solving': ['문제 해결', 'problem solving'],
  };

  const SECTION_PATTERNS = [
    { key: 'duties', re: /(주요\s*업무|담당\s*업무|하시게\s*될\s*업무|합류하면\s*담당할\s*업무|what you('ll| will) do|responsibilities)/i },
    { key: 'requirements', re: /(자격\s*요건|지원\s*자격|필수\s*요건|이런\s*분을\s*찾|필요한\s*역량|requirements|qualifications|who you are)/i },
    { key: 'preferred', re: /(우대\s*사항|우대\s*요건|이런\s*분이면\s*더\s*좋|preferred|nice to have|plus)/i },
  ];

  function isSectionHeader(line) {
    if (line.length > 40) return null;
    for (const { key, re } of SECTION_PATTERNS) {
      if (re.test(line)) return key;
    }
    return null;
  }

  function cleanBullet(line) {
    return line.replace(/^[\s•\-–·*▪◦o•]+/, '').replace(/^\d+[.)]\s*/, '').trim();
  }

  // Metadata lines (deadline, workplace, hiring process) are not section bullets.
  const META_LINE_RE = /^(마감|근무지|접수|지원\s*기간|채용\s*절차|전형\s*절차|근무\s*형태|급여|연봉)/;

  // Split JD text into structured sections. Lines before the first known header
  // are treated as intro (used for company/title guesses).
  function splitSections(text) {
    const out = { intro: [], duties: [], requirements: [], preferred: [] };
    let current = 'intro';
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      const header = isSectionHeader(line);
      if (header) { current = header; continue; }
      const bullet = cleanBullet(line);
      if (current !== 'intro' && META_LINE_RE.test(bullet)) { out.intro.push(bullet); continue; }
      out[current].push(bullet);
    }
    return out;
  }

  // Extract canonical skills present in text, with occurrence counts.
  function extractSkills(text) {
    const lower = text.toLowerCase();
    const found = [];
    for (const [canonical, aliases] of Object.entries(SKILL_DICTIONARY)) {
      let count = 0;
      for (const alias of aliases) {
        // word-boundary-ish match that also works for Korean and terms like "ci/cd"
        const escaped = alias.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
        const re = new RegExp('(^|[^a-z0-9가-힣])' + escaped + '($|[^a-z0-9가-힣])', 'gi');
        const m = lower.match(re);
        if (m) count += m.length;
      }
      if (count > 0) found.push({ skill: canonical, count });
    }
    return found;
  }

  // S-UGCVJF: importance 상/중/하 — requirements 등장 = 상, duties = 중, 그 외 빈도 기반.
  function scoreKeywords(sections, allText) {
    const reqText = sections.requirements.join('\n');
    const dutyText = sections.duties.join('\n');
    const prefText = sections.preferred.join('\n');
    const found = extractSkills(allText);
    return found
      .map(({ skill, count }) => {
        const inReq = extractSkills(reqText).some((s) => s.skill === skill);
        const inDuty = extractSkills(dutyText).some((s) => s.skill === skill);
        const inPref = extractSkills(prefText).some((s) => s.skill === skill);
        let importance = '하';
        if (inReq || count >= 3) importance = '상';
        else if (inDuty || inPref || count === 2) importance = '중';
        return { skill, count, importance, inReq, inDuty, inPref };
      })
      .sort((a, b) => {
        const rank = { 상: 0, 중: 1, 하: 2 };
        return rank[a.importance] - rank[b.importance] || b.count - a.count;
      });
  }

  // S-BINBDK: seniority estimate from "N년" mentions.
  function estimateSeniority(text) {
    const years = [];
    const re = /(\d+)\s*년\s*(이상)?/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const n = parseInt(m[1], 10);
      if (n >= 1 && n <= 20) years.push(n);
    }
    if (!years.length) {
      if (/신입|주니어|junior/i.test(text)) return '주니어';
      if (/시니어|리드|senior|lead|스태프|staff/i.test(text)) return '시니어';
      return '경력 무관 추정';
    }
    const min = Math.min(...years);
    if (min <= 2) return `주니어 이상 (${min}년+)`;
    if (min <= 6) return `미들 이상 (${min}년+)`;
    return `시니어 (${min}년+)`;
  }

  function guessDeadline(text) {
    const m = text.match(/(20\d{2})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})/);
    if (!m) return '';
    const pad = (v) => String(v).padStart(2, '0');
    return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  }

  function guessCompanyAndTitle(sections, text) {
    const firstLines = sections.intro.slice(0, 4);
    let company = '';
    let title = '';
    const companyMatch = text.match(/([가-힣A-Za-z0-9&.\s]{2,20})\s*(주식회사|㈜|Inc\.|Corp\.?)/);
    if (companyMatch) company = companyMatch[1].trim();
    const ROLE_RE = /(엔지니어|개발자|디자이너|마케터|매니저|PM|PO|기획자|analyst|engineer|developer|designer|manager|marketer)/i;
    for (const line of firstLines) {
      if (!title && line.length <= 45 && ROLE_RE.test(line)) title = line;
    }
    if (!title) {
      const m = text.match(/^.{0,40}?([가-힣A-Za-z0-9/()\s]{2,35}(엔지니어|개발자|디자이너|마케터|매니저|기획자))/m);
      if (m) title = m[1].trim();
    }
    return { company, title };
  }

  function looksLikeUrl(input) {
    return /^https?:\/\/\S+$/i.test(input.trim());
  }

  // S-BXCRSP: input validation for the register modal.
  function validateInput(input) {
    const v = (input || '').trim();
    if (!v) return { ok: false, reason: '내용을 입력해 주세요.' };
    if (looksLikeUrl(v)) return { ok: true, mode: 'url' };
    if (v.length < 40) return { ok: false, reason: 'JD 텍스트가 너무 짧아요. 공고 본문을 40자 이상 붙여넣어 주세요.' };
    return { ok: true, mode: 'text' };
  }

  /**
   * Analyze pasted JD text into a structured job draft.
   * Returns { company, title, location, deadline, duties, requirements, preferred,
   *           skills, keywords, seniority, sourceUrl, rawText }.
   */
  function analyze(input) {
    const validation = validateInput(input);
    if (!validation.ok) throw new Error(validation.reason);

    if (validation.mode === 'url') {
      // Static MVP: cross-origin fetch of job boards is blocked in the browser,
      // so a URL registers the posting shell and asks the user to paste the JD body.
      // (S-LITJIB fallback path: URL 파싱 실패 시 텍스트 붙여넣기 안내)
      return {
        company: '', title: '', location: '', deadline: '',
        duties: [], requirements: [], preferred: [],
        skills: [], keywords: [], seniority: '경력 무관 추정',
        sourceUrl: input.trim(), rawText: '',
        needsBody: true,
      };
    }

    const text = input.trim();
    const sections = splitSections(text);
    const keywords = scoreKeywords(sections, text);
    const { company, title } = guessCompanyAndTitle(sections, text);

    // If no explicit sections were found, treat intro lines as duties so the
    // posting still renders something meaningful.
    const noSections = !sections.duties.length && !sections.requirements.length && !sections.preferred.length;
    const duties = noSections ? sections.intro.slice(0, 6) : sections.duties;

    const locMatch = text.match(/(서울|경기|인천|부산|대구|대전|광주|판교|성남)[^\n,·]{0,12}/);

    return {
      company, title,
      location: locMatch ? locMatch[0].trim() : '',
      deadline: guessDeadline(text),
      duties,
      requirements: sections.requirements,
      preferred: sections.preferred,
      skills: keywords.map((k) => k.skill),
      keywords,
      seniority: estimateSeniority(text),
      sourceUrl: '',
      rawText: text,
      needsBody: false,
    };
  }

  global.NansaJD = { analyze, validateInput, extractSkills, estimateSeniority, splitSections, SKILL_DICTIONARY };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.NansaJD;
})(typeof window !== 'undefined' ? window : globalThis);
