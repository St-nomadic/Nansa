import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Crumb from '../components/Crumb.jsx';
import { IconCheck, IconChevronDown } from '../components/icons.jsx';
import {
  DOC_LABEL,
  STATUS,
  agoLabel,
  coverageOf,
  ddayLabel,
  docsOfJob,
  getJob,
  scheduleLabel,
} from '../data/nansa.js';
import './JobDetail.css';

const CHECK = <IconCheck />;

const DOC_TYPES = [
  { key: 'resume', title: '이력서 생성', desc: '경력·프로젝트를 이 공고 요건에 맞춰 재구성해요.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h9l5 5v13H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></svg> },
  { key: 'cover-letter', title: '자기소개서 생성', desc: '매칭 근거가 담긴 문항별 답변 초안을 만들어요.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h4"/></svg> },
  { key: 'portfolio', title: '포트폴리오 생성', desc: '관련 프로젝트를 골라 요약 페이지를 구성해요.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v5"/></svg> },
];

const REQ_TABS = [
  { key: 'duty', label: '주요 업무' },
  { key: 'req', label: '자격 요건' },
  { key: 'plus', label: '우대 사항' },
];

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const job = getJob(jobId);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [reqTab, setReqTab] = useState('duty');
  const [selectedDocTypes, setSelectedDocTypes] = useState(new Set());

  if (!job) {
    return (
      <div className="app-shell">
        <Sidebar active="jobs" />
        <div className="main page-job-detail">
          <header className="topbar">
            <Crumb to="/jobs" label="채용 공고" />
          </header>
          <div className="content">
            <div className="empty-state">
              <h1 style={{ fontSize: 20, marginBottom: 8 }}>공고를 찾을 수 없어요</h1>
              <p>삭제됐거나 주소가 잘못된 공고예요. 목록에서 다시 선택해 주세요.</p>
              <Link className="btn btn-primary" style={{ marginTop: 16 }} to="/jobs">채용 공고 목록으로</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const analyzed = Boolean(job.analysis);
  const docs = docsOfJob(job.id);

  function toggleDocType(key) {
    setSelectedDocTypes(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function goGenerate() {
    if (selectedDocTypes.size === 0) return;
    navigate(`/generate?job=${job.id}&types=${[...selectedDocTypes].join(',')}`);
  }

  return (
    <div className="app-shell">
      <Sidebar active="jobs" />
      <div className="main page-job-detail">
        <header className="topbar">
          <Crumb to="/jobs" label="채용 공고" />
        </header>

        <div className="content">
          <div className="job-head">
            <div>
              <div className="company">{job.company}{job.companyEn ? ` · ${job.companyEn}` : ''}</div>
              <h1>{job.title}</h1>
              <div className="tags">
                <span className={`badge ${STATUS[job.status].badge}`}>{STATUS[job.status].label}</span>
                {job.tags.map(t => <span className="tag" key={t}>{t}</span>)}
              </div>
            </div>
            <div className="deadline-box">
              <div className="d">{job.deadline ? ddayLabel(job.deadline) : '—'}</div>
              <div className="date">{scheduleLabel(job)}</div>
            </div>
          </div>

          {job.rawJd && (
            <div className={`accordion${accordionOpen ? ' open' : ''}`}>
              <button className="accordion-toggle" onClick={() => setAccordionOpen(v => !v)} aria-expanded={accordionOpen}>
                <span>채용 공고 원문 {accordionOpen ? '접기' : '보기'}</span>
                <IconChevronDown />
              </button>
              <div className="accordion-body">
                <div className="accordion-body-inner">{job.rawJd}</div>
              </div>
            </div>
          )}

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>JD 분석 결과</h2>
            {analyzed ? (
              <>
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="analysis-tabs" role="tablist">
                    {REQ_TABS.map(t => (
                      <button key={t.key} className={`analysis-tab${reqTab === t.key ? ' active' : ''}`} onClick={() => setReqTab(t.key)}>{t.label}</button>
                    ))}
                  </div>
                  {REQ_TABS.map(t => (
                    <div key={t.key} className={`req-panel${reqTab === t.key ? ' active' : ''}`}>
                      {job.analysis[t.key] && job.analysis[t.key].length ? (
                        <ul className="req-list">
                          {job.analysis[t.key].map((line, i) => <li key={i}>{CHECK}{line}</li>)}
                        </ul>
                      ) : (
                        <p style={{ color: 'var(--muted)', fontSize: 14 }}>이 공고에는 {t.label} 항목이 없어요.</p>
                      )}
                    </div>
                  ))}
                </div>

                {job.keywords.length > 0 && (
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 14, color: 'var(--fg-2)' }}>핵심 키워드 · 중요도순</h3>
                      <span className="badge b-blue">{job.seniority || '경력 요건 확인 필요'}</span>
                    </div>
                    <div className="kw-cloud">
                      {job.keywords.map(k => <span className={`kw w${k.weight}`} key={k.name}>{k.name}</span>)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="card empty-state">
                <h3 style={{ fontSize: 16, marginBottom: 6 }}>아직 분석 전이에요</h3>
                <p>
                  {job.source && job.source.kind === 'url'
                    ? '등록된 URL에서 공고 본문을 아직 가져오지 못했어요.'
                    : 'PDF에서 공고 본문을 아직 읽어오지 못했어요.'}
                  <br />
                  채용 공고 화면의 <strong>텍스트</strong> 탭에 본문을 붙여넣으면 요건과 키워드를 바로 분석해 드려요.
                </p>
                <Link className="btn btn-secondary" style={{ marginTop: 14 }} to="/jobs">본문 붙여넣고 분석하기</Link>
              </div>
            )}
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>이 공고에 맞는 서류 만들기</h2>
            {analyzed ? (
              <>
                <div className="cta-grid">
                  {DOC_TYPES.map(t => (
                    <button
                      type="button"
                      key={t.key}
                      className={`cta-card${selectedDocTypes.has(t.key) ? ' selected' : ''}`}
                      aria-pressed={selectedDocTypes.has(t.key)}
                      onClick={() => toggleDocType(t.key)}
                    >
                      <div className="cta-check">{selectedDocTypes.has(t.key) && <IconCheck />}</div>
                      <div className="cta-mark">{t.icon}</div>
                      <h3>{t.title}</h3>
                      <p>{t.desc}</p>
                    </button>
                  ))}
                </div>
                <button className="btn btn-primary" style={{ marginTop: 14 }} disabled={selectedDocTypes.size === 0} onClick={goGenerate}>
                  선택한 서류 생성하기{selectedDocTypes.size > 0 ? ` (${selectedDocTypes.size})` : ''}
                </button>
              </>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>JD 분석이 끝나면 이 공고에 맞춘 서류를 만들 수 있어요.</p>
            )}
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>이미 만든 서류</h2>
            {docs.length ? docs.map(doc => (
              <div className="draft-row" key={doc.id}>
                <div className="draft-main">
                  <div className="draft-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h9l5 5v13H6z"/><path d="M14 3v5h5"/></svg></div>
                  <div>
                    <div className="draft-title">{DOC_LABEL[doc.type]} 초안 · v{doc.version}</div>
                    <div className="draft-sub">{agoLabel(doc.updatedAt)} 수정 · 키워드 반영률 {coverageOf(doc)}%</div>
                  </div>
                </div>
                <div className="draft-actions">
                  <Link className="btn btn-secondary" to={`/generate?job=${job.id}&types=${doc.type}`}>새 버전 만들기</Link>
                  <Link className="btn btn-primary" to={`/editor?doc=${doc.id}`}>열기</Link>
                </div>
              </div>
            )) : (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>아직 이 공고로 만든 서류가 없어요.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
