import { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import {
  COLUMNS,
  DOC_LABEL,
  LOCK_LABEL,
  STATUS,
  columnJobs,
  docName,
  dot,
  getJob,
  getJobs,
  latestDocOfJob,
  getDocuments,
  scheduleLabel,
  stats,
} from '../data/nansa.js';
import './Applications.css';

const LOCK_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/></svg>;

function docSummary(job) {
  const doc = latestDocOfJob(job.id);
  return doc ? `${DOC_LABEL[doc.type]} v${doc.version}` : '—';
}

function ActionFor({ job }) {
  const doc = latestDocOfJob(job.id);
  if (job.status === 'interested') {
    return <Link className="btn btn-secondary btn-xs" to={`/jobs/${job.id}`}>서류 만들기</Link>;
  }
  if (job.status === 'preparing') {
    return doc
      ? <Link className="btn btn-secondary btn-xs" to={`/editor?doc=${doc.id}`}>이어 작성</Link>
      : <Link className="btn btn-secondary btn-xs" to={`/jobs/${job.id}`}>서류 만들기</Link>;
  }
  if (job.status === 'rejected') {
    return <a className="btn btn-secondary btn-xs" href="#retro">회고 보기</a>;
  }
  return <a className="btn btn-secondary btn-xs" href="#version-table">서류 보기</a>;
}

export default function Applications() {
  const [view, setView] = useState('kanban');
  const s = stats();
  const jobs = getJobs();
  const documents = getDocuments();

  return (
    <div className="app-shell">
      <Sidebar active="applications" />
      <div className="main page-applications">
        <header className="topbar">
          <h1>지원 관리</h1>
          <div className="view-toggle">
            <button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')}>칸반</button>
            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>리스트</button>
          </div>
        </header>

        <div className="content">
          {view === 'kanban' && (
            <section>
              <div className="kanban">
                {COLUMNS.map(col => {
                  const list = columnJobs(col);
                  return (
                    <div className="kcol" key={col}>
                      <div className="kcol-head">{col} <span className="count">{list.length}</span></div>
                      {list.map(job => (
                        <div className="kcard" key={job.id}>
                          <div className="kc-company">{job.company}</div>
                          <div className="kc-title">{job.title}</div>
                          <div className="kc-meta">
                            {scheduleLabel(job)}
                            {latestDocOfJob(job.id) ? ` · ${docSummary(job)}` : ''}
                          </div>
                          <div className="kc-foot">
                            <span className={`badge ${STATUS[job.status].badge}`}>{STATUS[job.status].short}</span>
                            <ActionFor job={job} />
                          </div>
                        </div>
                      ))}
                      {!list.length && <div className="kcol-empty">비어 있음</div>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {view === 'list' && (
            <section>
              <div className="card" style={{ padding: '8px 20px' }}>
                <table className="app-table">
                  <thead><tr><th>회사 · 직무</th><th>상태</th><th>일정</th><th>서류</th><th></th></tr></thead>
                  <tbody>
                    {jobs.map(job => (
                      <tr key={job.id}>
                        <td>{job.company} · {job.title}</td>
                        <td><span className={`badge ${STATUS[job.status].badge}`}>{STATUS[job.status].short}</span></td>
                        <td>{scheduleLabel(job)}</td>
                        <td>{docSummary(job)}</td>
                        <td><ActionFor job={job} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="section-gap" id="version-table">
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>서류 버전 스냅샷</h2>
            <div className="card" style={{ padding: '8px 20px' }}>
              <table className="ver-table">
                <thead><tr><th>문서명</th><th>버전</th><th>공고</th><th>날짜</th><th>상태</th></tr></thead>
                <tbody>
                  {documents.map(doc => {
                    const job = getJob(doc.jobId);
                    return (
                      <tr key={doc.id}>
                        <td>{docName(doc)}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)' }}>v{doc.version}</td>
                        <td>{job ? job.title : '삭제된 공고'}</td>
                        <td className="meta" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{dot(doc.updatedAt)}</td>
                        <td><span className="lock-chip">{LOCK_ICON}{LOCK_LABEL[doc.lock]}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="section-gap" id="retro" style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>지원 리포트</h2>
            <div className="card">
              <div className="report-grid">
                <div className="report-stat"><div className="rs-num">{s.applied}</div><div className="rs-label">지원 완료</div></div>
                <div className="report-stat"><div className="rs-num">{s.passed}</div><div className="rs-label">서류 통과</div></div>
                <div className="report-stat"><div className="rs-num">{s.interview}</div><div className="rs-label">면접 진행</div></div>
                <div className="report-stat"><div className="rs-num">{s.rejected}</div><div className="rs-label">불합격</div></div>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)', marginBottom: 4 }}>무엇이 통했는지 회고</p>
              <div className="retro-item">
                <div className="retro-head"><span className="retro-title">브라이트웍스 · 프로덕트 디자이너</span><span className="badge b-blue">제출 완료</span></div>
                <p>포트폴리오에 프로젝트별 지표(전환율, 사용자 수)를 구체적으로 추가한 버전으로 제출했어요. 다음 지원에도 수치 중심 서술을 유지할 것.</p>
              </div>
              <div className="retro-item">
                <div className="retro-head"><span className="retro-title">테크노바 · 데이터 엔지니어</span><span className="badge b-red">불합격</span></div>
                <p>코딩 테스트 단계에서 시간 관리에 어려움을 겪었어요. 이력서 자체의 키워드 반영률은 높았던 편이라, 다음엔 사전 테스트 연습에 집중하기로 함.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
