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
import { getCareers, quantScore, scoreLabel } from '../data/career.js';
import { composeDocument, rankCareers } from '../data/compose.js';
import './DocumentGenerator.css';

const TYPES = [
  { key: 'resume', title: '이력서', desc: '경력·프로젝트를 요건에 맞게 재구성', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h9l5 5v13H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></svg> },
  { key: 'cover-letter', title: '자기소개서', desc: '문항별 답변 초안 + 매칭 근거', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h4"/></svg> },
  { key: 'portfolio', title: '포트폴리오', desc: '관련 프로젝트 요약 페이지 구성', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v5"/></svg> },
];

const STEPS = [
  { n: 1, label: '서류 유형' },
  { n: 2, label: '섹션 선택' },
  { n: 3, label: '근거 점검' },
  { n: 4, label: '생성 결과' },
];

const TYPE_ORDER = ['resume', 'cover-letter', 'portfolio'];

function genStepsFor(typeKey) {
  return [
    'JD 요건 분석 반영',
    '경력 데이터 매칭',
    '정량 성과 근거 연결',
    DOC_LABEL[typeKey] + ' 문장 조립',
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

  const careers = useMemo(() => getCareers(), []);
  const ranked = useMemo(() => (job ? rankCareers(job, careers) : []), [job, careers]);
  const quant = useMemo(() => quantScore(), [step]);
  const quantTone = scoreLabel(quant.score);

  // 기본값: JD 적합도 상위 2개 경력을 강조
  const [highlighted, setHighlighted] = useState(() => new Set());
  useEffect(() => {
    if (highlighted.size === 0 && ranked.length) {
      setHighlighted(new Set(ranked.slice(0, 2).map(r => r.career.id)));
    }
  }, [ranked]);

  const [queueIndex, setQueueIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [results, setResults] = useState([]);
  const savedRef = useRef(new Set());

  const orderedTypes = useMemo(
    () => TYPE_ORDER.filter(t => selectedTypes.has(t)),
    [selectedTypes],
  );

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

  function settingsFor(type) {
    const keys = SECTIONS_BY_TYPE[type]
      .filter(s => sectionChecks[type + '.' + s.key] !== false)
      .map(s => s.key);
    return {
      tone,
      length,
      lang,
      highlight: highlighted,
      sectionKeys: new Set(keys),
    };
  }

  // 4단계: 진행 표시가 끝나는 시점에 실제로 문서를 조립하고 저장한다.
  useEffect(() => {
    if (step !== 4 || !job) return;
    if (queueIndex >= orderedTypes.length) return;
    const type = orderedTypes[queueIndex];
    const steps = genStepsFor(type);
    const id = window.setInterval(() => {
      setCompletedSteps(c => {
        if (c + 1 >= steps.length) {
          window.clearInterval(id);
          if (!savedRef.current.has(type)) {
            savedRef.current.add(type);
            const composed = composeDocument(job, type, settingsFor(type));
            const doc = addDocument({
              jobId: job.id,
              type,
              covered: composed.covered,
              tone,
              lang,
              sections: composed.sections,
              matchPoints: composed.matchPoints,
              quantRate: composed.quantRate,
              gaps: composed.gaps,
            });
            setResults(r => [...r, { type, docId: doc.id, ...composed }]);
          }
          setQueueIndex(i => i + 1);
          return 0;
        }
        return c + 1;
      });
    }, 480);
    return () => window.clearInterval(id);
  }, [step, queueIndex, orderedTypes, job]);

  const allDone = step === 4 && queueIndex >= orderedTypes.length && orderedTypes.length > 0;

  function startGenerate() {
    setResults([]);
    setQueueIndex(0);
    setCompletedSteps(0);
    savedRef.current = new Set();
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

  function toggleCareer(id) {
    setHighlighted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const currentType = orderedTypes[queueIndex];
  const currentSteps = currentType ? genStepsFor(currentType) : [];
  const backTo = `/jobs/${jobId}`;

  // 선택한 경력 안에서 숫자가 빠진 문장들
  const pickedGaps = useMemo(() => {
    const ids = highlighted.size ? highlighted : new Set(careers.map(c => c.id));
    const out = [];
    careers.filter(c => ids.has(c.id)).forEach(c => {
      c.bullets.forEach(b => {
        if (!/\d/.test(b.text)) out.push({ career: c, bullet: b });
      });
    });
    return out;
  }, [careers, highlighted, step]);

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

          {/* Step 3 — 근거 점검 */}
          <section className={`panel${step === 3 ? ' active' : ''}`}>
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>어떤 경력을 근거로 쓸까요?</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
              여기서 고른 경력의 문장만 서류에 들어갑니다. 없는 사실은 만들지 않아요.
            </p>

            <div className="field-group">
              <label>강조할 경력 · 프로젝트 <span className="lbl-note">JD 적합도순</span></label>
              <div className="tag-select">
                {ranked.map(r => (
                  <button
                    key={r.career.id}
                    className={`tag-opt${highlighted.has(r.career.id) ? ' active' : ''}`}
                    onClick={() => toggleCareer(r.career.id)}
                  >
                    {r.career.project || r.career.role}
                    {r.hits.length > 0 && <span className="tag-hit">{r.hits.length}개 일치</span>}
                  </button>
                ))}
                {!ranked.length && <span style={{ fontSize: 13, color: 'var(--muted)' }}>프로필에 등록된 경력이 없어요.</span>}
              </div>
            </div>

            <div className={`quant-gate ${quantTone.tone}`}>
              <div className="qg-head">
                <span className="qg-score">정량 근거 {quant.score}%</span>
                <span className="qg-label">{quantTone.text}</span>
              </div>
              <p className="qg-desc">
                고른 경력의 성과 문장 중 <strong>{pickedGaps.length}개</strong>에 숫자가 없어요.
                숫자 없는 문장은 그대로 들어가고, 서류에 <code>[수치 필요]</code>로 표시됩니다.
              </p>
              {pickedGaps.length > 0 && (
                <ul className="qg-list">
                  {pickedGaps.slice(0, 3).map(g => (
                    <li key={g.bullet.id}>{g.bullet.text}</li>
                  ))}
                  {pickedGaps.length > 3 && <li className="qg-more">외 {pickedGaps.length - 3}개</li>}
                </ul>
              )}
              <Link className="btn btn-secondary qg-cta" to="/profile">
                {pickedGaps.length > 0 ? '프로필에서 숫자 채우고 오기' : '프로필 확인하기'}
              </Link>
            </div>

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
                <button className={`chip-opt${lang === '한국어' ? ' active' : ''}`} onClick={() => setLang('한국어')}>한국어</button>
                <button className="chip-opt" disabled title="AI 연결 후 지원">영어</button>
              </div>
              <p className="lbl-note" style={{ marginTop: 8 }}>영어 변환은 번역이 필요해서 AI 연결 후에 열려요.</p>
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
                      <div className="rc-title">{DOC_LABEL[r.type]}</div>
                      <div className="rc-metric">
                        <div className="rc-metric-head"><span>JD 키워드 반영률</span><span className="num">{r.coverage}%</span></div>
                        <div className="coverage-bar"><div className="coverage-bar-fill" style={{ width: r.coverage + '%' }}></div></div>
                      </div>
                      <div className="rc-metric">
                        <div className="rc-metric-head"><span>정량 근거 비율</span><span className="num">{r.quantRate}%</span></div>
                        <div className="coverage-bar"><div className="coverage-bar-fill quant" style={{ width: r.quantRate + '%' }}></div></div>
                      </div>
                      {r.gaps > 0 && (
                        <p className="rc-gap">숫자가 없어 <code>[수치 필요]</code>로 남은 자리가 {r.gaps}곳 있어요.</p>
                      )}
                    </div>

                    {r.matchPoints.length ? r.matchPoints.map(mp => (
                      <div className="match-point" key={mp.text}>
                        <div className="mp-text">&ldquo;{mp.text}&rdquo;</div>
                        <div className="mp-foot">
                          <span className="mp-source"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>근거 · {mp.source}</span>
                          {mp.metric && <span className="mp-metric">{mp.metric}</span>}
                        </div>
                      </div>
                    )) : (
                      <p className="rc-gap">아직 수치로 정리된 성과가 없어서 근거를 붙이지 못했어요.</p>
                    )}
                  </div>
                ))}

                <div className="wizard-nav">
                  <Link className="btn btn-secondary" to={backTo}>나중에 이어하기</Link>
                  <Link className="btn btn-primary" to={`/editor?doc=${results[0] ? results[0].docId : ''}&new=1`}>편집기에서 검토하기</Link>
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
