import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { IconPlus } from '../components/icons.jsx';
import './JobPostings.css';

export default function JobPostings() {
  const [tab, setTab] = useState('url');
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <Sidebar active="jobs" />
      <div className="main page-jobs">
        <header className="topbar">
          <h1>채용 공고</h1>
        </header>

        <div className="content">
          <section className="card new-post-card">
            <div className="new-post-head">
              <div className="np-mark"><IconPlus strokeWidth="1.8" width={undefined} height={undefined} /></div>
              <div>
                <h2>새 채용 공고 등록</h2>
                <p>공고를 등록하면 요건을 분석하고 맞춤 서류를 만들 수 있어요.</p>
              </div>
            </div>
            <div className="tabs" role="tablist">
              <button className={`tab-btn${tab === 'url' ? ' active' : ''}`} onClick={() => setTab('url')}>URL</button>
              <button className={`tab-btn${tab === 'text' ? ' active' : ''}`} onClick={() => setTab('text')}>텍스트</button>
              <button className={`tab-btn${tab === 'pdf' ? ' active' : ''}`} onClick={() => setTab('pdf')}>PDF 업로드</button>
            </div>
            <div className={`tab-panel${tab === 'url' ? ' active' : ''}`}>
              <div className="field">
                <label htmlFor="job-url">공고 URL</label>
                <input className="input" id="job-url" type="url" placeholder="https://careers.example.com/jobs/1234" />
              </div>
            </div>
            <div className={`tab-panel${tab === 'text' ? ' active' : ''}`}>
              <div className="field">
                <label htmlFor="job-text">공고 본문 붙여넣기</label>
                <textarea className="textarea" id="job-text" placeholder="채용 공고 전문을 붙여넣으세요"></textarea>
              </div>
            </div>
            <div className={`tab-panel${tab === 'pdf' ? ' active' : ''}`}>
              <div className="upload-zone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                PDF 파일을 드래그하거나 클릭해서 업로드
              </div>
            </div>
            <div className="new-post-foot">
              <button className="btn btn-primary" onClick={() => navigate('/jobs/1')}>등록하고 분석하기</button>
            </div>
          </section>

          <section className="section-gap" style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>최근 등록한 공고</h2>
            <div className="card" style={{ padding: '8px 20px' }}>
              <div className="job-row">
                <div className="job-main">
                  <div className="job-company">페이지컴퍼니</div>
                  <div className="job-title">백엔드 엔지니어</div>
                </div>
                <span className="badge b-amber">서류 준비중</span>
                <span className="job-deadline">마감 7/22 · <span className="d-day">D-5</span></span>
                <Link className="btn btn-secondary btn-xs" to="/jobs/1">상세 보기</Link>
              </div>
              <div className="job-row">
                <div className="job-main">
                  <div className="job-company">브라이트웍스</div>
                  <div className="job-title">프로덕트 디자이너</div>
                </div>
                <span className="badge b-blue">제출 완료</span>
                <span className="job-deadline">마감 7/19 · <span className="d-day">D-2</span></span>
                <Link className="btn btn-secondary btn-xs" to="/jobs/1">상세 보기</Link>
              </div>
              <div className="job-row">
                <div className="job-main">
                  <div className="job-company">누리소프트</div>
                  <div className="job-title">프론트엔드 엔지니어</div>
                </div>
                <span className="badge b-green">면접 대기</span>
                <span className="job-deadline">제출 7/10</span>
                <Link className="btn btn-secondary btn-xs" to="/jobs/1">상세 보기</Link>
              </div>
              <div className="job-row">
                <div className="job-main">
                  <div className="job-company">오르빗랩스</div>
                  <div className="job-title">데이터 분석가</div>
                </div>
                <span className="badge b-neutral">관심 공고</span>
                <span className="job-deadline">마감 7/30 · D-13</span>
                <Link className="btn btn-secondary btn-xs" to="/jobs/1">상세 보기</Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
