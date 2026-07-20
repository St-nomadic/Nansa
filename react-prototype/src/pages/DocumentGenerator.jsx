import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Crumb from '../components/Crumb.jsx';
import './DocumentGenerator.css';

const TYPES = [
  { key: 'resume', title: '이력서', desc: '경력·프로젝트를 요건에 맞게 재구성', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h9l5 5v13H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></svg> },
  { key: 'cover-letter', title: '자기소개서', desc: '문항별 답변 초안 + 매칭 근거', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h4"/></svg> },
  { key: 'portfolio', title: '포트폴리오', desc: '관련 프로젝트 요약 페이지 구성', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v5"/></svg> },
];

const STEPS = [
  { n: 1, label: '서류 유형' },
  { n: 2, label: '생성 범위' },
  { n: 3, label: '생성 설정' },
  { n: 4, label: '생성 결과' },
];

const GEN_STEPS = ['JD 요건 분석 반영', '경력 데이터 매칭', '문장 생성 및 근거 정리', '키워드 커버리지 점검'];

export default function DocumentGenerator() {
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(params.get('type') || 'resume');
  const [scope, setScope] = useState('full');
  const [sectionChecks, setSectionChecks] = useState({ basic: true, summary: true, project: false, skills: false });
  const [tone, setTone] = useState('표준');
  const [length, setLength] = useState('보통');
  const [lang, setLang] = useState('한국어');
  const [highlighted, setHighlighted] = useState(new Set(['커머스 결제 시스템 리팩토링', 'MSA 전환 프로젝트']));
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (step !== 4) return;
    setCompleted(0);
    const id = setInterval(() => {
      setCompleted(c => {
        if (c + 1 >= GEN_STEPS.length) {
          clearInterval(id);
          return GEN_STEPS.length;
        }
        return c + 1;
      });
    }, 650);
    return () => clearInterval(id);
  }, [step]);

  function toggleTag(name) {
    setHighlighted(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  const generating = completed < GEN_STEPS.length;

  return (
    <div className="app-shell">
      <Sidebar active="jobs" />
      <div className="main page-generator">
        <header className="topbar">
          <Crumb to="/jobs/1" label="공고 상세" />
          <h1>맞춤 서류 생성 · 백엔드 엔지니어 @ 페이지컴퍼니</h1>
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
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>여러 개를 선택해 순차로 생성할 수 있어요.</p>
            <div className="type-grid">
              {TYPES.map(t => (
                <div key={t.key} className={`type-card${selectedType === t.key ? ' selected' : ''}`} onClick={() => setSelectedType(t.key)}>
                  <div className="type-mark">{t.icon}</div>
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Step 2 */}
          <section className={`panel${step === 2 ? ' active' : ''}`}>
            <h2 style={{ fontSize: 20, marginBottom: 20 }}>생성 범위를 선택하세요</h2>
            <label className={`radio-card${scope === 'full' ? ' selected' : ''}`} onClick={() => setScope('full')}>
              <input type="radio" name="scope" checked={scope === 'full'} readOnly />
              <div><div className="rc-title">전체 생성</div><div className="rc-sub">이력서 전체를 처음부터 새로 구성해요.</div></div>
            </label>
            <label className={`radio-card${scope === 'section' ? ' selected' : ''}`} onClick={() => setScope('section')}>
              <input type="radio" name="scope" checked={scope === 'section'} readOnly />
              <div>
                <div className="rc-title">섹션 단위 생성</div>
                <div className="rc-sub">선택한 섹션만 이 공고에 맞춰 다시 써요.</div>
                <div className="section-checks" onClick={e => e.stopPropagation()}>
                  {Object.entries({ basic: '기본 정보', summary: '경력 요약', project: '프로젝트', skills: '스킬' }).map(([key, label]) => (
                    <label className="chip-check" key={key}>
                      <input type="checkbox" checked={sectionChecks[key]} onChange={() => setSectionChecks(p => ({ ...p, [key]: !p[key] }))} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </label>
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
            {generating ? (
              <div className="gen-loading">
                <div className="gen-spinner"></div>
                <h2 style={{ fontSize: 17 }}>JD 요건에 맞춰 서류를 생성하고 있어요</h2>
                <ul className="gen-steps">
                  {GEN_STEPS.map((label, i) => (
                    <li key={label} className={i < completed ? 'gs-done' : i === completed ? 'gs-active' : ''}>
                      <span className="gs-dot"></span>{label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <div className="result-head">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>
                  <h2 style={{ fontSize: 20 }}>이력서 초안이 완성됐어요</h2>
                </div>
                <div className="result-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>키워드 반영률</span>
                    <span className="meta" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg)' }}>87%</span>
                  </div>
                  <div className="coverage-bar"><div className="coverage-bar-fill" style={{ width: '87%' }}></div></div>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)', marginBottom: 10 }}>주요 매칭 포인트 미리보기</p>
                <div className="match-point">
                  <div className="mp-text">&ldquo;MSA 환경에서 주문·결제 서비스를 분리하며 서비스 간 트래픽을 30% 절감한 경험이 있습니다.&rdquo;</div>
                  <div className="mp-source"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>근거 · MSA 전환 프로젝트 (2024)</div>
                </div>
                <div className="match-point">
                  <div className="mp-text">&ldquo;Spring Boot 기반 결제 API를 설계하고 코드 리뷰 프로세스를 정착시켰습니다.&rdquo;</div>
                  <div className="mp-source"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>근거 · 커머스 결제 시스템 리팩토링</div>
                </div>
                <div className="wizard-nav">
                  <Link className="btn btn-secondary" to="/jobs/1">나중에 이어하기</Link>
                  <Link className="btn btn-primary" to="/editor">편집기에서 검토하기</Link>
                </div>
              </div>
            )}
          </section>

          {step !== 4 && (
            <div className="wizard-nav">
              <button className="btn btn-secondary" disabled={step === 1} onClick={() => setStep(s => Math.max(1, s - 1))}>이전</button>
              <button className="btn btn-primary" onClick={() => setStep(s => Math.min(4, s + 1))}>{step === 3 ? '서류 생성하기' : '다음'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
