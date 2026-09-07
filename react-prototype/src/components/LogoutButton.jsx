import { useNavigate } from 'react-router-dom';
import { endSession } from '../data/session.js';

export default function LogoutButton({ className = '' }) {
  const navigate = useNavigate();
  return (
    <button type="button" className={className} onClick={() => {
      endSession();
      navigate('/', { replace: true, state: { loggedOut: true } });
    }}>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 4H4v16h5M14 8l4 4-4 4M8 12h10" /></svg>
      로그아웃
    </button>
  );
}
