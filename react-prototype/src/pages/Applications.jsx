import { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import './Applications.css';

const LOCK_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/></svg>;

export default function Applications() {
  const [view, setView] = useState('kanban');

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
                <div className="kcol">
                  <div className="kcol-head">관심 공고 <span className="count">1</span></div>
                  <div className="kcard">
                    <div className="kc-company">오르빗랩스</div>
                    <div className="kc-title">데이터 분석가</div>
                    <div className="kc-meta">마감 07.30 · D-13</div>
                    <div className="kc-foot"><span className="badge b-neutral">관심 공고</span><Link className="btn btn-secondary btn-xs" to="/jobs/1">서류 만들기</Link></div>
                  </div>
                </div>
                <div className="kcol">
                  <div className="kcol-head">서류 준비중 <span className="count">1</span></div>
                  <div className="kcard">
                    <div className="kc-company">페이지컴퍼니</div>
                    <div className="kc-title">백엔드 엔지니어</div>
                    <div className="kc-meta">마감 07.22 · D-5 · 이력서 v2</div>
                    <div className="kc-foot"><span className="badge b-amber">준비중</span><Link className="btn btn-secondary btn-xs" to="/editor">이어 작성</Link></div>
                  </div>
                </div>
                <div className="kcol">
                  <div className="kcol-head">제출 완료 <span className="count">1</span></div>
                  <div className="kcard">
                    <div className="kc-company">브라이트웍스</div>
                    <div className="kc-title">프로덕트 디자이너</div>
                    <div className="kc-meta">제출 07.14 · 자기소개서 v3</div>
                    <div className="kc-foot"><span className="badge b-blue">제출 완료</span><a className="btn btn-secondary btn-xs" href="#version-table">서류 보기</a></div>
                  </div>
                </div>
                <div className="kcol">
                  <div className="kcol-head">면접·결과 <span className="count">2</span></div>
                  <div className="kcard">
                    <div className="kc-company">누리소프트</div>
                    <div className="kc-title">프론트엔드 엔지니어</div>
                    <div className="kc-meta">면접 07.25 예정</div>
                    <div className="kc-foot"><span className="badge b-green">면접 대기</span><a className="btn btn-secondary btn-xs" href="#version-table">서류 보기</a></div>
                  </div>
                  <div className="kcard">
                    <div className="kc-company">테크노바</div>
                    <div className="kc-title">데이터 엔지니어</div>
                    <div className="kc-meta">결과 07.05</div>
                    <div className="kc-foot"><span className="badge b-red">불합격</span><a className="btn btn-secondary btn-xs" href="#retro">회고 보기</a></div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {view === 'list' && (
            <section>
              <div className="card" style={{ padding: '8px 20px' }}>
                <table className="app-table">
                  <thead><tr><th>회사 · 직무</th><th>상태</th><th>일정</th><th>서류</th><th></th></tr></thead>
                  <tbody>
                    <tr><td>오르빗랩스 · 데이터 분석가</td><td><span className="badge b-neutral">관심 공고</span></td><td>마감 07.30</td><td>—</td><td><Link className="btn btn-secondary btn-xs" to="/jobs/1">서류 만들기</Link></td></tr>
                    <tr><td>페이지컴퍼니 · 백엔드 엔지니어</td><td><span className="badge b-amber">준비중</span></td><td>마감 07.22</td><td>이력서 v2</td><td><Link className="btn btn-secondary btn-xs" to="/editor">이어 작성</Link></td></tr>
                    <tr><td>브라이트웍스 · 프로덕트 디자이너</td><td><span className="badge b-blue">제출 완료</span></td><td>제출 07.14</td><td>자기소개서 v3</td><td><a className="btn btn-secondary btn-xs" href="#version-table">서류 보기</a></td></tr>
                    <tr><td>누리소프트 · 프론트엔드 엔지니어</td><td><span className="badge b-green">면접 대기</span></td><td>면접 07.25</td><td>이력서 v1</td><td><a className="btn btn-secondary btn-xs" href="#version-table">서류 보기</a></td></tr>
                    <tr><td>테크노바 · 데이터 엔지니어</td><td><span className="badge b-red">불합격</span></td><td>결과 07.05</td><td>이력서 v1</td><td><a className="btn btn-secondary btn-xs" href="#retro">회고 보기</a></td></tr>
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
                  <tr><td>이력서_페이지컴퍼니.pdf</td><td className="num" style={{ fontFamily: 'var(--font-mono)' }}>v2</td><td>백엔드 엔지니어</td><td className="meta" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>07.14</td><td><span className="lock-chip">{LOCK_ICON}편집 가능</span></td></tr>
                  <tr><td>이력서_페이지컴퍼니.pdf</td><td className="num" style={{ fontFamily: 'var(--font-mono)' }}>v1</td><td>백엔드 엔지니어</td><td className="meta" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>07.10</td><td><span className="lock-chip">{LOCK_ICON}스냅샷 잠금</span></td></tr>
                  <tr><td>자기소개서_브라이트웍스.pdf</td><td className="num" style={{ fontFamily: 'var(--font-mono)' }}>v3</td><td>프로덕트 디자이너</td><td className="meta" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>07.14</td><td><span className="lock-chip">{LOCK_ICON}제출본 잠금</span></td></tr>
                  <tr><td>이력서_누리소프트.pdf</td><td className="num" style={{ fontFamily: 'var(--font-mono)' }}>v1</td><td>프론트엔드 엔지니어</td><td className="meta" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>07.09</td><td><span className="lock-chip">{LOCK_ICON}제출본 잠금</span></td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="section-gap" id="retro" style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>지원 리포트</h2>
            <div className="card">
              <div className="report-grid">
                <div className="report-stat"><div className="rs-num">5</div><div className="rs-label">총 지원</div></div>
                <div className="report-stat"><div className="rs-num">3</div><div className="rs-label">서류 통과</div></div>
                <div className="report-stat"><div className="rs-num">1</div><div className="rs-label">면접 진행</div></div>
                <div className="report-stat"><div className="rs-num">1</div><div className="rs-label">불합격</div></div>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)', marginBottom: 4 }}>무엇이 통했는지 회고</p>
              <div className="retro-item">
                <div className="retro-head"><span className="retro-title">브라이트웍스 · 프로덕트 디자이너</span><span className="badge b-blue">서류 통과</span></div>
                <p>포트폴리오에 프로젝트별 지표(전환율, 사용자 수)를 구체적으로 추가한 버전이 서류 통과로 이어졌어요. 다음 지원에도 수치 중심 서술을 유지할 것.</p>
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
