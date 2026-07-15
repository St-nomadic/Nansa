/* NANSA unit tests — run with: node tests/run-tests.js
   Covers the pure engines (JD analyzer, document generator) that back
   requirements R-LCGURX / R-RSYIBV / R-DXIZND. */
'use strict';

const assert = require('assert');
const path = require('path');

const JD = require(path.join(__dirname, '..', 'js', 'jd.js'));
const Gen = require(path.join(__dirname, '..', 'js', 'generator.js'));
const SEED = require(path.join(__dirname, '..', 'js', 'data.js'));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (err) {
    failed++;
    console.error('  ✗ ' + name);
    console.error('    ' + err.message);
  }
}

const SAMPLE_JD = `토스뱅크 주식회사
백엔드 엔지니어 (결제)

주요 업무
- 핵심 결제 시스템 API 설계 및 개발
- 대용량 트래픽 처리를 위한 서버 아키텍처 개선
- MSA 환경에서의 서비스 간 통신 설계

자격 요건
- Kotlin 또는 Java 기반 서버 개발 경력 3년 이상
- MySQL 등 RDB 설계 경험
- REST API 설계 및 개발 경험

우대 사항
- Kubernetes 운영 경험
- 대규모 트래픽 처리 경험

마감: 2026.07.25 / 근무지: 서울 강남구`;

console.log('\n[JD analyzer]');

test('validateInput: 빈 입력 거부', () => {
  assert.strictEqual(JD.validateInput('').ok, false);
});

test('validateInput: 짧은 텍스트 거부 (40자 미만)', () => {
  assert.strictEqual(JD.validateInput('너무 짧은 공고').ok, false);
});

test('validateInput: URL 은 url 모드로 통과', () => {
  const r = JD.validateInput('https://toss.im/career/jobs/1234');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.mode, 'url');
});

test('analyze: 섹션 구조화 (업무/자격/우대)', () => {
  const a = JD.analyze(SAMPLE_JD);
  assert.strictEqual(a.duties.length, 3);
  assert.strictEqual(a.requirements.length, 3);
  assert.strictEqual(a.preferred.length, 2);
  assert.ok(a.duties[0].includes('결제 시스템 API'));
});

test('analyze: 스킬 키워드 추출 + 별칭 정규화', () => {
  const a = JD.analyze(SAMPLE_JD);
  for (const sk of ['Kotlin', 'Java', 'MySQL', 'Kubernetes', 'MSA', 'REST API']) {
    assert.ok(a.skills.includes(sk), sk + ' 이(가) 추출돼야 함: ' + a.skills.join(','));
  }
});

test('analyze: 자격 요건 키워드는 중요도 상', () => {
  const a = JD.analyze(SAMPLE_JD);
  const kotlin = a.keywords.find((k) => k.skill === 'Kotlin');
  assert.strictEqual(kotlin.importance, '상');
});

test('analyze: 시니어리티 추정 (3년 이상 → 미들)', () => {
  const a = JD.analyze(SAMPLE_JD);
  assert.ok(a.seniority.includes('미들'), a.seniority);
});

test('analyze: 마감일/지역 추출', () => {
  const a = JD.analyze(SAMPLE_JD);
  assert.strictEqual(a.deadline, '2026-07-25');
  assert.ok(a.location.startsWith('서울'));
});

test('analyze: URL 입력은 본문 붙여넣기 필요 상태 반환', () => {
  const a = JD.analyze('https://example.com/job/1');
  assert.strictEqual(a.needsBody, true);
  assert.strictEqual(a.sourceUrl, 'https://example.com/job/1');
});

test('extractSkills: React 별칭 통합 (react/ReactJS → React 1개)', () => {
  const found = JD.extractSkills('ReactJS 및 react 경험자 우대');
  const reacts = found.filter((f) => f.skill === 'React');
  assert.strictEqual(reacts.length, 1);
  assert.ok(reacts[0].count >= 2);
});

console.log('\n[Document generator]');

const job = SEED.jobs[0];       // 토스뱅크 백엔드 (skills: Kotlin, Spring Boot, MSA, Kubernetes, MySQL)
const profile = SEED.profile;   // skills: Kotlin, Spring Boot, MySQL, AWS, Kubernetes
const settings = { tone: '표준', length: '보통', lang: '한국어' };
const emphasis = [profile.experiences[0].id];

test('generate(resume): 요약/경력/스킬 섹션 구성', () => {
  const r = Gen.generate(job, profile, settings, emphasis, 'resume');
  const ids = r.sections.map((s) => s.id);
  assert.ok(ids.includes('summary'));
  assert.ok(ids.includes('skills'));
  assert.ok(ids.some((id) => id.startsWith('exp-')));
});

test('generate: 매칭 점수 = 겹치는 스킬 비율', () => {
  const r = Gen.generate(job, profile, settings, emphasis, 'resume');
  // 겹침: Kotlin, Spring Boot, Kubernetes, MySQL → 4/5 = 80%
  assert.strictEqual(r.matchScore, 80);
  assert.deepStrictEqual(r.missing, ['MSA']);
});

test('generate: 요약 섹션에 매칭 근거 포함 (S-BFVDJI)', () => {
  const r = Gen.generate(job, profile, settings, emphasis, 'resume');
  const summary = r.sections.find((s) => s.id === 'summary');
  assert.ok(summary.matched.length >= 1);
});

test('generate(cover): 지원 동기에 JD 주요 업무 인용', () => {
  const r = Gen.generate(job, profile, settings, emphasis, 'cover');
  const motive = r.sections.find((s) => s.id === 'motive');
  assert.ok(motive.body.includes(job.duties[0]));
  assert.ok(motive.body.includes(job.company));
});

test('generate(portfolio): 표지 + 프로젝트 + 기술 요약', () => {
  const r = Gen.generate(job, profile, settings, emphasis, 'portfolio');
  const ids = r.sections.map((s) => s.id);
  assert.ok(ids.includes('cover'));
  assert.ok(ids.includes('stack'));
  assert.ok(ids.some((id) => id.startsWith('pf-')));
});

test('generate: 길이 설정이 불릿 수 반영 (짧게=1, 길게=3)', () => {
  const short = Gen.generate(job, profile, { ...settings, length: '짧게' }, emphasis, 'resume');
  const long = Gen.generate(job, profile, { ...settings, length: '길게' }, emphasis, 'resume');
  const expShort = short.sections.find((s) => s.id.startsWith('exp-'));
  const expLong = long.sections.find((s) => s.id.startsWith('exp-'));
  assert.strictEqual(expShort.body.split('\n').length, 1);
  assert.strictEqual(expLong.body.split('\n').length, 3);
});

test('generate: 강조 톤이 불릿에 반영', () => {
  const r = Gen.generate(job, profile, { ...settings, tone: '강조' }, emphasis, 'resume');
  const exp = r.sections.find((s) => s.id.startsWith('exp-'));
  assert.ok(exp.body.includes('주도적으로'));
});

test('generate: 영어 이력서 생성 (S-USKVZZ)', () => {
  const r = Gen.generate(job, profile, { ...settings, lang: '영어' }, emphasis, 'resume');
  const summary = r.sections.find((s) => s.id === 'summary');
  assert.ok(summary.title === 'Summary');
  assert.ok(summary.body.includes('applying for'));
});

test('coverage: 문서 편집 후 커버리지 재계산 (S-POIHPJ)', () => {
  // MSA 를 언급하지 않는 프로필/문서로 시작 → 편집으로 언급하면 커버리지 상승
  const bareProfile = { ...profile, skills: ['Kotlin', 'Spring Boot', 'MySQL', 'Kubernetes'] };
  const sections = [{ id: 'summary', title: '요약', body: 'Kotlin, Spring Boot, MySQL, Kubernetes 경험.' }];
  const before = Gen.coverage(job, bareProfile, sections);
  assert.deepStrictEqual(before.missing, ['MSA']);
  assert.strictEqual(before.score, 80);
  const edited = [{ ...sections[0], body: sections[0].body + ' MSA 전환 경험 보유.' }];
  const after = Gen.coverage(job, bareProfile, edited);
  assert.strictEqual(after.missing.length, 0);
  assert.strictEqual(after.score, 100);
});

test('refine: 4가지 보정 연산 동작 (F-DVUUWF)', () => {
  const body = '월 200만 건 결제 트랜잭션 처리 API 설계 및 운영을 했습니다\nMSA 전환 프로젝트를 리드했습니다';
  const shorter = Gen.refine(body, 'shorten');
  assert.ok(shorter.split('\n').length <= body.split('\n').length);
  const longer = Gen.refine(body, 'lengthen', { matched: ['Kotlin'] });
  assert.ok(longer.length > body.length);
  assert.ok(longer.includes('Kotlin'));
  const emphasized = Gen.refine(body, 'emphasize');
  assert.ok(emphasized.includes('해냈습니다'));
  const polished = Gen.refine('문장  사이  공백   정리', 'polish');
  assert.strictEqual(polished, '문장 사이 공백 정리');
});

test('refine: 알 수 없는 연산은 예외', () => {
  assert.throws(() => Gen.refine('x', 'nope'));
});

test('docFileName: 회사명_직무_유형_버전_날짜 규칙 (S-AFXUIN)', () => {
  const name = Gen.docFileName(job, 'resume', 2, '2026-07-15');
  assert.strictEqual(name, '토스뱅크_백엔드-엔지니어_이력서_v2_2026-07-15');
});

test('docFileName: 파일명 금지 문자 제거', () => {
  const name = Gen.docFileName({ company: 'A/B:C', title: 'PM?' }, 'cover', 1, '2026-07-15');
  assert.ok(!/[\\/:*?"<>|]/.test(name), name);
});

test('insertionSuggestion: 문서 유형별 삽입 위치 제안 (S-NCWNEF)', () => {
  assert.ok(Gen.insertionSuggestion('resume', 'MSA').includes('보유 기술'));
  assert.ok(Gen.insertionSuggestion('cover', 'MSA').includes('강점'));
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
