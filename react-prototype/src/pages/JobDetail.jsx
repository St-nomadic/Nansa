import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Crumb from '../components/Crumb.jsx';
import { IconCheck, IconChevronDown } from '../components/icons.jsx';
import './JobDetail.css';

const CHECK = <IconCheck />;

const DOC_TYPES = [
  { key: 'resume', title: '이력서 생성', desc: '경력·프로젝트를 이 공고 요건에 맞춰 재구성해요.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h9l5 5v13H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></svg> },
  { key: 'cover-letter', title: '자기소개서 생성', desc: '매칭 근거가 담긴 문항별 답변 초안을 만들어요.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h4"/></svg> },
  { key: 'portfolio', title: '포트폴리오 생성', desc: '관련 프로젝트를 골라 요약 페이지를 구성해요.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v5"/></svg> },
];

export default function JobDetail() {
  const navigate = useNavigate();
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [reqTab, setReqTab] = useState('duty');
  const [selectedDocTypes, setSelectedDocTypes] = useState(new Set());

  function toggleDocType(key) {
    setSelectedDocTypes(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function goGenerate() {
    if (selectedDocTypes.size === 0) return;
    navigate(`/generate?types=${[...selectedDocTypes].join(',')}`);
  }

  return (
    <div className="app-shell">
      <Sidebar active="jobs" />
      <div className="main page-job-detail">
        <header className="topbar">
          <Crumb to="/dashboard" label="대시보드" />
        </header>

        <div className="content">
          <div className="job-head">
            <div>
              <div className="company">페이지컴퍼니 · PAGE COMPANY</div>
              <h1>백엔드 엔지니어</h1>
              <div className="tags">
                <span className="tag">정규직</span>
                <span className="tag">경력 3~5년</span>
                <span className="tag">서울 강남</span>
                <span className="tag">Java / Spring</span>
              </div>
            </div>
            <div className="deadline-box">
              <div className="d">D-5</div>
              <div className="date">마감 2026.07.22</div>
            </div>
          </div>

          <div className={`accordion${accordionOpen ? ' open' : ''}`}>
            <button className="accordion-toggle" onClick={() => setAccordionOpen(v => !v)}>
              <span>채용 공고 원문 보기</span>
              <IconChevronDown />
            </button>
            <div className="accordion-body">
              <div className="accordion-body-inner">{`[담당 업무]
- 커머스 주문/결제 도메인 백엔드 API 설계 및 개발
- MSA 환경에서의 서비스 간 통신 및 트래픽 처리 최적화
- 대용량 트래픽 대응을 위한 아키텍처 개선

[자격 요건]
- Java, Spring Boot 기반 서비스 개발 경력 3년 이상
- RESTful API 설계 및 구현 경험
- MySQL 등 RDBMS 활용 경험
- Git 기반 협업 및 코드 리뷰 문화 경험

[우대 사항]
- AWS 등 클라우드 인프라 운영 경험
- Kafka 등 메시지 큐 활용 경험
- 대규모 트래픽 서비스 운영 경험
- CI/CD 파이프라인 구축 경험`}</div>
            </div>
          </div>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>JD 분석 결과</h2>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="analysis-tabs" role="tablist">
                <button className={`analysis-tab${reqTab === 'duty' ? ' active' : ''}`} onClick={() => setReqTab('duty')}>주요 업무</button>
                <button className={`analysis-tab${reqTab === 'req' ? ' active' : ''}`} onClick={() => setReqTab('req')}>자격 요건</button>
                <button className={`analysis-tab${reqTab === 'plus' ? ' active' : ''}`} onClick={() => setReqTab('plus')}>우대 사항</button>
              </div>
              <div className={`req-panel${reqTab === 'duty' ? ' active' : ''}`}>
                <ul className="req-list">
                  <li>{CHECK}커머스 주문/결제 도메인 백엔드 API 설계 및 개발</li>
                  <li>{CHECK}MSA 환경에서의 서비스 간 통신 및 트래픽 처리 최적화</li>
                  <li>{CHECK}대용량 트래픽 대응을 위한 아키텍처 개선</li>
                </ul>
              </div>
              <div className={`req-panel${reqTab === 'req' ? ' active' : ''}`}>
                <ul className="req-list">
                  <li>{CHECK}Java, Spring Boot 기반 서비스 개발 경력 3년 이상</li>
                  <li>{CHECK}RESTful API 설계 및 구현 경험</li>
                  <li>{CHECK}MySQL 등 RDBMS 활용 경험</li>
                  <li>{CHECK}Git 기반 협업 및 코드 리뷰 문화 경험</li>
                </ul>
              </div>
              <div className={`req-panel${reqTab === 'plus' ? ' active' : ''}`}>
                <ul className="req-list">
                  <li>{CHECK}AWS 등 클라우드 인프라 운영 경험</li>
                  <li>{CHECK}Kafka 등 메시지 큐 활용 경험</li>
                  <li>{CHECK}대규모 트래픽 서비스 운영 경험</li>
                </ul>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, color: 'var(--fg-2)' }}>핵심 키워드 · 중요도순</h3>
                <span className="badge b-blue">시니어 백엔드 · 추정 3~5년차</span>
              </div>
              <div className="kw-cloud">
                <span className="kw w3">Spring Boot</span>
                <span className="kw w3">MSA</span>
                <span className="kw w2">RESTful API</span>
                <span className="kw w2">AWS</span>
                <span className="kw w2">트래픽 처리</span>
                <span className="kw w1">Kafka</span>
                <span className="kw w1">MySQL</span>
                <span className="kw w1">코드 리뷰</span>
                <span className="kw w1">CI/CD</span>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>이 공고에 맞는 서류 만들기</h2>
            <div className="cta-grid">
              {DOC_TYPES.map(t => (
                <div key={t.key} className={`cta-card${selectedDocTypes.has(t.key) ? ' selected' : ''}`} onClick={() => toggleDocType(t.key)}>
                  <div className="cta-check">{selectedDocTypes.has(t.key) && <IconCheck />}</div>
                  <div className="cta-mark">{t.icon}</div>
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 14 }} disabled={selectedDocTypes.size === 0} onClick={goGenerate}>
              선택한 서류 생성하기{selectedDocTypes.size > 0 ? ` (${selectedDocTypes.size})` : ''}
            </button>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>이미 만든 서류</h2>
            <div className="draft-row">
              <div className="draft-main">
                <div className="draft-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h9l5 5v13H6z"/><path d="M14 3v5h5"/></svg></div>
                <div>
                  <div className="draft-title">이력서 초안 · v2</div>
                  <div className="draft-sub">3일 전 수정 · 키워드 반영률 87%</div>
                </div>
              </div>
              <div className="draft-actions">
                <Link className="btn btn-secondary" to="/generate?type=resume">새 버전 만들기</Link>
                <Link className="btn btn-primary" to="/editor">열기</Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
