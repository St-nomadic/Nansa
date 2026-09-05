import { Link } from 'react-router-dom';

export default function Sidebar({ active, onMyPage = false }) {
  return (
    <aside className="sidebar">
      <Link to="/" className="brand"><span className="dot"></span>Nansa</Link>
      <nav>
        <Link to="/dashboard" className={active === 'dashboard' ? 'active' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="12" width="8" height="9" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></svg>
          대시보드
        </Link>
        <Link to="/jobs" className={active === 'jobs' ? 'active' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          채용 공고
        </Link>
        <Link to="/profile" className={active === 'profile' ? 'active' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
          프로필·경력
        </Link>
        <Link to="/applications" className={active === 'applications' ? 'active' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9"/><path d="M9 3h6v4H9zM13 13l6-6M13 7h6v6"/></svg>
          지원 관리
        </Link>
      </nav>
      <Link to="/me" className={`user-mini${onMyPage ? ' active' : ''}`} aria-label="개인 페이지">
        <span className="avatar">승</span>
      </Link>
      <div className={`user-card${onMyPage ? ' on-page' : ''}`} tabIndex={0}>
        <div className="avatar">승</div>
        <div className="who">
          <div className="name">이승현</div>
          <div className="email">austin9796@gmail.com</div>
        </div>
        <div className="user-flyout">
          <Link className={`uf-item${onMyPage ? ' current' : ''}`} to="/me">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l4.5-4.5a2 2 0 0 1 2.8 0L15 15M14 14l1.5-1.5a2 2 0 0 1 2.8 0L21 15"/><circle cx="8" cy="8" r="1.5"/></svg>
            개인 페이지
          </Link>
          <Link className="uf-item" to="/profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
            프로필·경력 편집하기
          </Link>
        </div>
      </div>
    </aside>
  );
}
