import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authenticate, getAuthSession, watchAuth } from '../data/auth.js';
import './Auth.css';

export default function Auth({ signup = false }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let mounted = true;
    const redirectIfAuthenticated = session => {
      if (mounted && session) navigate('/dashboard', { replace: true });
    };
    getAuthSession().then(redirectIfAuthenticated).catch(() => {});
    const stopWatching = watchAuth(redirectIfAuthenticated);
    return () => {
      mounted = false;
      stopWatching();
    };
  }, [navigate]);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError(''); setMessage('');
    if (signup && password !== confirm) { setError('비밀번호가 일치하지 않아요.'); return; }
    setBusy(true);
    try {
      const result = await authenticate({ signup, name: name.trim(), email: email.trim(), password });
      if (result.session) navigate('/dashboard', { replace: true });
      else { setMessage('이메일로 보낸 인증 링크를 확인한 뒤 로그인해 주세요.'); setPassword(''); setConfirm(''); }
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return (
    <div className="page-auth">
      <header><Link className="auth-brand" to="/"><span aria-hidden="true" />Nansa</Link><Link className="auth-home" to="/">홈으로</Link></header>
      <main className="auth-card">
        <p className="auth-eyebrow">나의 다음 커리어를 준비하는 곳</p>
        <h1>{signup ? 'Nansa 시작하기' : '다시 만나 반가워요'}</h1>
        <p className="auth-description">{signup ? '계정을 만들고 나에게 맞는 지원을 준비하세요.' : '로그인하고 준비하던 지원을 이어가세요.'}</p>
        <nav className="auth-tabs" aria-label="계정 메뉴">
          <Link to="/login" aria-current={!signup ? 'page' : undefined}>로그인</Link>
          <Link to="/signup" aria-current={signup ? 'page' : undefined}>회원가입</Link>
        </nav>
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            {signup && <label htmlFor="auth-name">이름<input id="auth-name" autoComplete="name" required maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="이름을 입력해 주세요" /></label>}
            <label htmlFor="auth-email">이메일<input id="auth-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" /></label>
            <label htmlFor="auth-password">비밀번호<input id="auth-password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={signup ? 8 : undefined} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} placeholder={signup ? '8자 이상 입력해 주세요' : '비밀번호를 입력해 주세요'} /></label>
            {signup && <label htmlFor="auth-confirm">비밀번호 확인<input id="auth-confirm" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="비밀번호를 한 번 더 입력해 주세요" /></label>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            {message && <p className="auth-message" role="status">{message}</p>}
            <button className="auth-submit" type="submit" aria-busy={busy}>{busy ? '처리하는 중…' : signup ? '회원가입' : '로그인'}</button>
          </fieldset>
        </form>
        <p className="auth-switch">{signup ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'} <Link to={signup ? '/login' : '/signup'}>{signup ? '로그인' : '회원가입'}</Link></p>
      </main>
    </div>
  );
}
