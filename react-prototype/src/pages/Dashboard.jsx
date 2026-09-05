import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { IconPlus } from '../components/icons.jsx';
import './Dashboard.css';

export default function Dashboard() {
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
          <p className="lead" style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 8 }}>안녕하세요, 승현님. 이번 주 마감 공고가 2건 있고, 검토 대기 중인 서류가 1건이에요.</p>

          <section className="grid-4" style={{ marginTop: 24 }}>
            <div className="card stat-card">
              <div className="stat-label">진행 중인 지원</div>
              <div className="stat-num">4<span className="unit">건</span></div>
              <span className="stat-delta up">지난주 대비 +1</span>
            </div>
            <div className="card stat-card">
              <div className="stat-label">이번 주 마감</div>
              <div className="stat-num">2<span className="unit">건</span></div>
              <span className="stat-delta warn">가장 임박 D-2</span>
            </div>
            <div className="card stat-card">
              <div className="stat-label">생성된 서류</div>
              <div className="stat-num">6<span className="unit">개</span></div>
              <span className="stat-delta flat">이력서 2 · 자소서 4</span>
            </div>
            <div className="card stat-card">
              <div className="stat-label">평균 키워드 반영률</div>
              <div className="stat-num">87<span className="unit">%</span></div>
              <span className="stat-delta up">최근 생성 기준</span>
            </div>
          </section>

          <section className="section-gap">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ fontSize: 18 }}>최근 채용 공고</h2>
              <Link to="/jobs/1" className="btn btn-ghost btn-sm">전체 보기</Link>
            </div>
            <div className="card" style={{ padding: '8px 20px' }}>
              <div className="job-row">
                <div className="job-main">
                  <div className="job-company">페이지컴퍼니</div>
                  <div className="job-title">백엔드 엔지니어</div>
                </div>
                <span className="badge b-amber">서류 준비중</span>
                <span className="job-deadline">마감 7/22 · <span className="d-day">D-5</span></span>
                <Link className="btn btn-secondary btn-sm" to="/editor">서류 이어 작성</Link>
              </div>
              <div className="job-row">
                <div className="job-main">
                  <div className="job-company">브라이트웍스</div>
                  <div className="job-title">프로덕트 디자이너</div>
                </div>
                <span className="badge b-blue">제출 완료</span>
                <span className="job-deadline">마감 7/19 · <span className="d-day">D-2</span></span>
                <Link className="btn btn-secondary btn-sm" to="/applications">지원 상태 보기</Link>
              </div>
              <div className="job-row">
                <div className="job-main">
                  <div className="job-company">누리소프트</div>
                  <div className="job-title">프론트엔드 엔지니어</div>
                </div>
                <span className="badge b-green">면접 대기</span>
                <span className="job-deadline">제출 7/10</span>
                <Link className="btn btn-secondary btn-sm" to="/applications">지원 상태 보기</Link>
              </div>
              <div className="job-row">
                <div className="job-main">
                  <div className="job-company">오르빗랩스</div>
                  <div className="job-title">데이터 분석가</div>
                </div>
                <span className="badge b-neutral">관심 공고</span>
                <span className="job-deadline">마감 7/30 · D-13</span>
                <Link className="btn btn-primary btn-sm" to="/jobs/1">맞춤 서류 만들기</Link>
              </div>
            </div>
          </section>

          <section className="section-gap" style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ fontSize: 18 }}>지원 현황</h2>
              <Link to="/applications" className="btn btn-ghost btn-sm">전체 보기</Link>
            </div>
            <div className="kanban-mini">
              <div className="kcol">
                <div className="kcol-head">관심 공고 <span className="count num">1</span></div>
                <div className="kcard"><div className="kcard-title">오르빗랩스 · 데이터 분석가</div><div className="kcard-meta">마감 7/30</div></div>
              </div>
              <div className="kcol">
                <div className="kcol-head">서류 준비중 <span className="count num">1</span></div>
                <div className="kcard"><div className="kcard-title">페이지컴퍼니 · 백엔드</div><div className="kcard-meta">마감 7/22</div></div>
              </div>
              <div className="kcol">
                <div className="kcol-head">제출 완료 <span className="count num">1</span></div>
                <div className="kcard"><div className="kcard-title">브라이트웍스 · PD</div><div className="kcard-meta">제출 7/14</div></div>
              </div>
              <div className="kcol">
                <div className="kcol-head">면접·결과 <span className="count num">1</span></div>
                <div className="kcard"><div className="kcard-title">누리소프트 · FE</div><div className="kcard-meta">면접 7/25</div></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
