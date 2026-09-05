import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Crumb from '../components/Crumb.jsx';
import {
  DOC_LABEL,
  SECTIONS_BY_TYPE,
  addDocument,
  getJob,
} from '../data/nansa.js';
import './DocumentGenerator.css';

const TYPES = [
  { key: 'resume', title: '이력서', desc: '경력·프로젝트를 요건에 맞게 재구성', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h9l5 5v13H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></svg> },
  { key: 'cover-letter', title: '자기소개서', desc: '문항별 답변 초안 + 매칭 근거', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h4"/></svg> },
  { key: 'portfolio', title: '포트폴리오', desc: '관련 프로젝트 요약 페이지 구성', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v5"/></svg> },
];

const STEPS = [
  { n: 1, label: '서류 유형' },
  { n: 2, label: '섹션 선택' },
  { n: 3, label: '생성 설정' },
  { n: 4, label: '생성 결과' },
];

const TYPE_ORDER = ['resume', 'cover-letter', 'portfolio'];

const MATCH_POINTS = {
  resume: [
    { text: 'MSA 환경에서 주문·결제 서비스를 분리하며 서비스 간 트래픽을 30% 절감한 경험이 있습니다.', source: 'MSA 전환 프로젝트 (2024)' },
    { text: 'Spring Boot 기반 결제 API를 설계하고 코드 리뷰 프로세스를 정착시켰습니다.', source: '커머스 결제 시스템 리팩토링' },
  ],
  'cover-letter': [
    { text: '레거시 결제 모듈을 재작성하며, 장애를 줄이는 일이 곧 사용자 신뢰를 쌓는 일이라는 걸 배웠습니다.', source: '커머스 결제 시스템 리팩토링' },
    { text: '배포 주기를 2주에서 2일로 줄이며 팀 전체의 실험 속도를 끌어올린 경험이 있습니다.', source: 'MSA 전환 프로젝트 (2024)' },
  ],
  portfolio: [
    { text: '프로젝트별로 담당 범위 · 기술 선택 이유 · 정량 성과를 한 장으로 정리했습니다.', source: '대표 프로젝트 2건 선별' },
    { text: '트래픽 처리량 3배 증설, 평균 응답 시간 120ms 개선 등 수치 중심으로 서술했습니다.', source: '성과 지표 섹션' },
  ],
};

const BASE_COVERAGE = { resume: 89, 'cover-letter': 84, portfolio: 78 };

function genStepsFor(typeKey) {
  return [
    'JD 요건 분석 반영',
    '경력 데이터 매칭',
    DOC_LABEL[typeKey] + ' 문장 생성 및 근거 정리',
    '키워드 커버리지 점검',
  ];
}

export default function DocumentGenerator() {
  const [params] = useSearchParams();
  const jobId = params.get('job') || '1';
  const job = getJob(jobId);

  const [step, setStep] = useState(() => (params.get('types') ? 2 : 1));
  const [selectedTypes, setSelectedTypes] = useState(() => {
    const types = params.get('types');
    if (types) return new Set(types.split(',').filter(Boolean));
    return new Set([params.get('type') || 'resume']);
  });
  const [sectionChecks, setSectionChecks] = useState({});
  const [tone, setTone] = useState('표준');
  const [length, setLength] = useState('보통');
  const [lang, setLang] = useState('한국어');
  const [highlighted, setHighlighted] = useState(new Set(['커머스 결제 시스템 리팩토링', 'MSA 전환 프로젝트']));

  // 선택한 서류를 하나씩 순차 생성
  const [queueIndex, setQueueIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [results, setResults] = useState([]);
  const savedRef = useRef(false);

  const orderedTypes = useMemo(
    () => TYPE_ORDER.filter(t => selectedTypes.has(t)),
    [selectedTypes],
  );

  // 선택한 서류가 바뀌면 섹션 체크박스를 기본 전체 선택으로 맞춘다
  useEffect(() => {
    setSectionChecks(prev => {
      const next = { ...prev };
      orderedTypes.forEach(type => {
        SECTIONS_BY_TYPE[type].forEach(s => {
          const id = type + '.' + s.key;
          if (next[id] === undefined) next[id] = true;
        });
      });
      return next;
    });
  }, [orderedTypes]);

  // 4단계: 서류를 순서대로 생성
  useEffect(() => {
    if (step !== 4) return;
    if (queueIndex >= orderedTypes.length) return;
    const steps = genStepsFor(orderedTypes[queueIndex]);
    const id = setInterval(() => {
      setCompletedSteps(c => {
        if (c + 1 >= steps.length) {
          clearInterval(id);
          const type = orderedTypes[queueIndex];
          setResults(r => [...r, { type, coverage: BASE_COVERAGE[type] || 80 }]);
          setQueueIndex(i => i + 1);
          return 0;
        }
        return c + 1;
      });
    }, 550);
    return () => clearInterval(id);
  }, [step, queueIndex, orderedTypes]);

  const allDone = step === 4 && queueIndex >= orderedTypes.length && orderedTypes.length > 0;

  // 생성이 끝나면 실제 서류 레코드를 저장 (중복 저장 방지)
  useEffect(() => {
    if (!allDone || savedRef.current || !job) return;
    savedRef.current = true;
    const covered = (job.keywords || []).map(k => k.name);
    results.forEach(r => {
      const take = Math.max(1, Math.round((covered.length * r.coverage) / 100));
      addDocument({ jobId: job.id, type: r.type, covered: covered.slice(0, take), tone, lang });
    });
  }, [allDone, results, job, tone, lang]);

  function startGenerate() {
    setResults([]);
    setQueueIndex(0);
    setCompletedSteps(0);
    savedRef.current = false;
    setStep(4);
  }

  function toggleType(key) {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleTag(name) {
    setHighlighted(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  const currentType = orderedTypes[queueIndex];
  const currentSteps = currentType ? genStepsFor(currentType) : [];
  const backTo = `/jobs/${jobId}`;

  return (
    <div className="app-shell">
      <Sidebar active="jobs" />
      <div className="main page-generator">
        <header className="topbar">
          <Crumb to={backTo} label="공고 상세" />
          <h1>맞춤 서류 생성 · {job ? `${job.title} @ ${job.company}` : '공고를 찾을 수 없음'}</h1>
          <span style={{ width: 70 }}></span>
        </header>

        <div className="content">
          <div className="stepper">
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'contents' }}>
                <div className={`sp-item${s.n < step ? ' done' : ''}${s.n === step ? ' current' : ''}`}>
                  <div className="sp-circle">{s.n}</div><span className="sp-label">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="sp-line"></div>}
              </div>
            ))}
          </div>

          {/* Step 1 */}
          <section className={`panel${step === 1 ? ' active' : ''}`}>
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>어떤 서류를 만들까요?</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>여러 개를 선택하면 선택한 순서대로 하나씩 생성해 드려요.</p>
            <div className="type-grid">
              {TYPES.map(t => (
                <button
                  type="button"
                  key={t.key}
                  className={`type-card${selectedTypes.has(t.key) ? ' selected' : ''}`}
                  aria-pressed={selectedTypes.has(t.key)}
                  onClick={() => toggleType(t.key)}
                >
                  <div className="type-mark">{t.icon}</div>
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Step 2 */}
          <section className={`panel${step === 2 ? ' active' : ''}`}>
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>어떤 섹션을 다시 쓸까요?</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>선택한 섹션만 이 공고에 맞춰 다시 써요.</p>
            {orderedTypes.map(type => (
              <div className="section-block" key={type}>
                <h3 className="section-block-title">{DOC_LABEL[type]}</h3>
                <div className="section-checks">
                  {SECTIONS_BY_TYPE[type].map(s => {
                    const id = type + '.' + s.key;
                    return (
                      <label className="chip-check" key={id}>
                        <input
                          type="checkbox"
                          checked={sectionChecks[id] !== false}
                          onChange={() => setSectionChecks(p => ({ ...p, [id]: !(p[id] !== false) }))}
                        />
                        {s.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          {/* Step 3 */}
          <section className={`panel${step === 3 ? ' active' : ''}`}>
            <h2 style={{ fontSize: 20, marginBottom: 20 }}>생성 설정</h2>
            <div className="field-group">
              <label>톤</label>
              <div className="chip-row">
                {['간결하게', '표준', '강조 있게'].map(v => (
                  <button key={v} className={`chip-opt${tone === v ? ' active' : ''}`} onClick={() => setTone(v)}>{v}</button>
                ))}
              </div>
            </div>
            <div className="field-group">
              <label>분량</label>
              <div className="chip-row">
                {['짧게', '보통', '길게'].map(v => (
                  <button key={v} className={`chip-opt${length === v ? ' active' : ''}`} onClick={() => setLength(v)}>{v}</button>
                ))}
              </div>
            </div>
            <div className="field-group">
              <label>언어</label>
              <div className="chip-row">
                {['한국어', '영어'].map(v => (
                  <button key={v} className={`chip-opt${lang === v ? ' active' : ''}`} onClick={() => setLang(v)}>{v}</button>
                ))}
              </div>
            </div>
            <div className="field-group">
              <label>강조할 프로젝트 / 경험 (내 프로필에서 선택)</label>
              <div className="tag-select">
                {['커머스 결제 시스템 리팩토링', 'MSA 전환 프로젝트', '사내 API 게이트웨이 구축', '신입 온보딩 자동화 툴'].map(name => (
                  <button key={name} className={`tag-opt${highlighted.has(name) ? ' active' : ''}`} onClick={() => toggleTag(name)}>{name}</button>
                ))}
              </div>
            </div>
          </section>

          {/* Step 4 */}
          <section className={`panel${step === 4 ? ' active' : ''}`}>
            {!allDone ? (
              <div className="gen-loading">
                <div className="gen-spinner"></div>
                <h2 style={{ fontSize: 17 }}>
                  {DOC_LABEL[currentType] || '서류'}를 생성하고 있어요
                  {orderedTypes.length > 1 && <span className="gen-progress"> ({queueIndex + 1}/{orderedTypes.length})</span>}
                </h2>
                <ul className="gen-steps">
                  {currentSteps.map((label, i) => (
                    <li key={label} className={i < completedSteps ? 'gs-done' : i === completedSteps ? 'gs-active' : ''}>
                      <span className="gs-dot"></span>{label}
                    </li>
                  ))}
                </ul>
                {results.length > 0 && (
                  <p className="gen-done-note">완료: {results.map(r => DOC_LABEL[r.type]).join(' · ')}</p>
                )}
              </div>
            ) : (
              <div>
                <div className="result-head">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>
                  <h2 style={{ fontSize: 20 }}>
                    {results.length > 1
                      ? `${results.length}개 서류 초안이 완성됐어요`
                      : `${DOC_LABEL[results[0] ? results[0].type : 'resume']} 초안이 완성됐어요`}
                  </h2>
                </div>

                {results.map(r => (
                  <div className="result-block" key={r.type}>
                    <div className="result-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>{DOC_LABEL[r.type]} · 키워드 반영률</span>
                        <span className="meta" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg)' }}>{r.coverage}%</span>
                      </div>
                      <div className="coverage-bar"><div className="coverage-bar-fill" style={{ width: r.coverage + '%' }}></div></div>
                    </div>
                    {(MATCH_POINTS[r.type] || []).map(mp => (
                      <div className="match-point" key={mp.text}>
                        <div className="mp-text">&ldquo;{mp.text}&rdquo;</div>
                        <div className="mp-source"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>근거 · {mp.source}</div>
                      </div>
                    ))}
                  </div>
                ))}

                <div className="wizard-nav">
                  <Link className="btn btn-secondary" to={backTo}>나중에 이어하기</Link>
                  <Link className="btn btn-primary" to={`/editor?job=${jobId}&type=${results[0] ? results[0].type : 'resume'}&new=1`}>편집기에서 검토하기</Link>
                </div>
              </div>
            )}
          </section>

          {step !== 4 && (
            <div className="wizard-nav">
              <button className="btn btn-secondary" disabled={step === 1} onClick={() => setStep(s => Math.max(1, s - 1))}>이전</button>
              <button className="btn btn-primary" onClick={() => (step === 3 ? startGenerate() : setStep(s => Math.min(4, s + 1)))}>
                {step === 3 ? `서류 생성하기 (${orderedTypes.length})` : '다음'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
