import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { IconPlus } from '../components/icons.jsx';
import {
  COLUMNS,
  STATUS,
  columnJobs,
  latestDocOfJob,
  scheduleLabel,
  stats,
} from '../data/nansa.js';
import './Dashboard.css';

export default function Dashboard() {
  const s = stats();
  const recent = s.jobs.slice(0, 4);
  const resumeCount = s.byType.resume || 0;
  const coverCount = s.byType['cover-letter'] || 0;
  const portfolioCount = s.byType.portfolio || 0;
  const typeSummary = [
    resumeCount ? `이력서 ${resumeCount}` : null,
    coverCount ? `자소서 ${coverCount}` : null,
    portfolioCount ? `포폴 ${portfolioCount}` : null,
  ].filter(Boolean).join(' · ') || '아직 없음';

  function actionFor(job) {
    const doc = latestDocOfJob(job.id);
    if (job.status === 'preparing' && doc) {
      return <Link className="btn btn-secondary btn-sm" to={`/editor?doc=${doc.id}`}>서류 이어 작성</Link>;
    }
    if (job.status === 'submitted' || job.status === 'interview' || job.status === 'rejected') {
      return <Link className="btn btn-secondary btn-sm" to="/applications">지원 상태 보기</Link>;
    }
    return <Link className="btn btn-primary btn-sm" to={`/jobs/${job.id}`}>맞춤 서류 만들기</Link>;
  }

  return (
    <div className="app-shell">
      <Sidebar active="dashboard" />
      <div className="main page-dashboard">
        <header className="topbar">
          <h1>대시보드</h1>
          <Link className="btn btn-primary" to="/jobs">
            <IconPlus />
            새 공고 등록
          </Link>
        </header>

        <div className="content">
          <p className="lead" style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 8 }}>
            안녕하세요, 승현님. 이번 주 마감 공고가 {s.closingSoon}건 있고, 검토 대기 중인 서류가 {s.reviewWaiting}건이에요.
          </p>

          <section className="grid-4" style={{ marginTop: 24 }}>
            <div className="card stat-card">
              <div className="stat-label">진행 중인 지원</div>
              <div className="stat-num">{s.inProgress}<span className="unit">건</span></div>
              <span className="stat-delta flat">관심 공고 제외</span>
            </div>
            <div className="card stat-card">
              <div className="stat-label">이번 주 마감</div>
              <div className="stat-num">{s.closingSoon}<span className="unit">건</span></div>
              <span className="stat-delta warn">
                {s.nearestDday === null ? '임박한 마감 없음' : `가장 임박 D-${s.nearestDday}`}
              </span>
            </div>
            <div className="card stat-card">
              <div className="stat-label">생성된 서류</div>
              <div className="stat-num">{s.docCount}<span className="unit">개</span></div>
              <span className="stat-delta flat">{typeSummary}</span>
            </div>
            <div className="card stat-card">
              <div className="stat-label">평균 키워드 반영률</div>
              <div className="stat-num">{s.avgCoverage}<span className="unit">%</span></div>
              <span className="stat-delta up">공고별 최신 버전 기준</span>
            </div>
          </section>

          <section className="section-gap">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ fontSize: 18 }}>최근 채용 공고</h2>
              <Link to="/jobs" className="btn btn-ghost btn-sm">전체 보기</Link>
            </div>
            <div className="card" style={{ padding: '8px 20px' }}>
              {recent.map(job => (
                <div className="job-row" key={job.id}>
                  <div className="job-main">
                    <div className="job-company">{job.company}</div>
                    <div className="job-title">{job.title}</div>
                  </div>
                  <span className={`badge ${STATUS[job.status].badge}`}>{STATUS[job.status].label}</span>
                  <span className="job-deadline">{scheduleLabel(job)}</span>
                  {actionFor(job)}
                </div>
              ))}
            </div>
          </section>

          <section className="section-gap" style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ fontSize: 18 }}>지원 현황</h2>
              <Link to="/applications" className="btn btn-ghost btn-sm">칸반 전체 보기</Link>
            </div>
            <div className="kanban-mini">
              {COLUMNS.map(col => {
                const list = columnJobs(col);
                return (
                  <div className="kcol" key={col}>
                    <div className="kcol-head">{col} <span className="count num">{list.length}</span></div>
                    {list.map(job => (
                      <div className="kcard" key={job.id}>
                        <div className="kcard-title">{job.company} · {job.title}</div>
                        <div className="kcard-meta">{scheduleLabel(job)}</div>
                      </div>
                    ))}
                    {!list.length && <div className="kcol-empty">비어 있음</div>}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
