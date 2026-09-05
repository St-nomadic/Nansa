import { Link, useLocation } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <div className="page-notfound">
      <div className="nf-box">
        <div className="nf-code">404</div>
        <h1>페이지를 찾을 수 없어요</h1>
        <p>
          요청하신 주소 <code>{pathname}</code> 는 없는 페이지예요.
          <br />
          주소가 바뀌었거나 링크가 잘못됐을 수 있어요.
        </p>
        <div className="nf-actions">
          <Link className="nf-btn nf-btn-primary" to="/dashboard">대시보드로 가기</Link>
          <Link className="nf-btn nf-btn-secondary" to="/">첫 화면으로</Link>
        </div>
        <div className="nf-links">
          <span>자주 찾는 메뉴</span>
          <Link to="/jobs">채용 공고</Link>
          <Link to="/applications">지원 관리</Link>
          <Link to="/profile">프로필·경력</Link>
        </div>
      </div>
    </div>
  );
}

