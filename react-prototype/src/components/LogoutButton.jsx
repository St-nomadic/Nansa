import { useState } from 'react';
import { signOut } from '../data/auth.js';
import { useNavigate } from 'react-router-dom';
import { endSession } from '../data/session.js';

export default function LogoutButton({ className = '' }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <button type="button" disabled={busy} className={className} onClick={async () => {
      setBusy(true);
      try {
        await signOut();
        endSession();
        navigate('/', { replace: true, state: { loggedOut: true } });
      } catch { setError(true); }
      finally { setBusy(false); }
    }}>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 4H4v16h5M14 8l4 4-4 4M8 12h10" /></svg>
      {error ? '다시 로그아웃하기' : busy ? '로그아웃 중…' : '로그아웃'}
    </button>
  );
}
