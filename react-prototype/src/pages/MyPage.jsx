import { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Crumb from '../components/Crumb.jsx';
import Toast from '../components/Toast.jsx';
import useToast from '../hooks/useToast.js';
import './MyPage.css';

const EMOJIS = ['🎯', '💼', '🌱', '☕', '🚀', '🏝️'];
const DURATIONS = ['오늘 자정까지', '4시간 후', '1주일 후', '삭제하지 않음'];

export default function MyPage() {
  const { toast, showToast } = useToast();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [statusText, setStatusText] = useState('이직 준비 중');
  const [duration, setDuration] = useState('삭제하지 않음');
  const [pill, setPill] = useState({ emoji: '🎯', text: '이직 준비 중' });
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (
        popoverOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        e.target !== triggerRef.current
      ) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [popoverOpen]);

  function saveStatus() {
    const text = statusText.trim() || '상태 메시지 없음';
    setPill({ emoji: selectedEmoji, text });
    setPopoverOpen(false);
    showToast('상태를 저장했습니다');
  }

  function clearStatus() {
    setStatusText('');
    setPill({ emoji: '', text: '상태 없음' });
    setPopoverOpen(false);
    showToast('상태를 지웠습니다');
  }

  return (
    <div className="app-shell">
      <Sidebar active={null} onMyPage />
      <div className="main page-mypage">
        <header className="topbar">
          <Crumb to="/dashboard" label="대시보드" />
        </header>

        <div className="content">
          <section className="profile-hero">
            <div className="banner">
              <div className="banner-overlay">
                <button className="btn btn-secondary btn-xs" onClick={() => showToast('배경 사진을 변경했습니다')}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M9 5l1-2h4l1 2"/></svg>
                  배경 사진 변경
                </button>
              </div>
            </div>
            <div className="hero-row">
              <div className="avatar-wrap">
                <div className="avatar-lg">승</div>
                <button className="avatar-edit-btn" title="프로필 사진 변경" onClick={() => showToast('프로필 사진을 변경했습니다')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M9 5l1-2h4l1 2"/></svg>
                </button>
              </div>
              <div className="hero-info">
                <div className="hero-name-row">
                  <h1>이승현</h1>
                  <span className="status-pill">
                    <span>{pill.emoji}</span><span>{pill.text}</span>
                  </span>
                </div>
                <div className="hero-handle">@seunghyun · 백엔드 엔지니어</div>
              </div>
              <div className="hero-actions">
                <button
                  className="btn btn-secondary"
                  ref={triggerRef}
                  onClick={e => { e.stopPropagation(); setPopoverOpen(v => !v); }}
                >
                  상태 편집
                </button>
                <div className={`status-popover${popoverOpen ? ' open' : ''}`} ref={popoverRef}>
                  <h3>상태 아이콘 선택</h3>
                  <div className="emoji-row">
                    {EMOJIS.map(e => (
                      <button
                        key={e}
                        className={`emoji-opt${selectedEmoji === e ? ' selected' : ''}`}
                        onClick={() => setSelectedEmoji(e)}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  <div className="status-input-row">
                    <span className="cur-emoji">{selectedEmoji}</span>
                    <input
                      type="text"
                      value={statusText}
                      maxLength={60}
                      placeholder="지금 상태를 한 줄로 알려주세요"
                      onChange={e => setStatusText(e.target.value)}
                    />
                  </div>
                  <div className="status-field">
                    <label>자동 삭제</label>
                    <select value={duration} onChange={e => setDuration(e.target.value)}>
                      {DURATIONS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="status-foot">
                    <button className="btn btn-ghost btn-xs" onClick={clearStatus}>상태 지우기</button>
                    <button className="btn btn-primary btn-xs" onClick={saveStatus}>저장</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section-block">
            <h2>사진 관리</h2>
            <p className="sb-sub">프로필과 배경에 쓰이는 이미지를 관리해요.</p>
            <div className="card">
              <div className="upload-row">
                <div>
                  <div className="ur-label">프로필 사진</div>
                  <div className="ur-sub">정사각형 이미지 권장 · 최소 200×200px</div>
                </div>
                <button className="btn btn-secondary btn-xs" onClick={() => showToast('프로필 사진을 변경했습니다')}>변경</button>
              </div>
              <div className="upload-row">
                <div>
                  <div className="ur-label">배경 사진</div>
                  <div className="ur-sub">가로형 이미지 권장 · 최소 1200×300px</div>
                </div>
                <button className="btn btn-secondary btn-xs" onClick={() => showToast('배경 사진을 변경했습니다')}>변경</button>
              </div>
            </div>
          </section>

          <section className="section-block" style={{ marginBottom: 20 }}>
            <h2>최근 상태</h2>
            <p className="sb-sub">이전에 설정했던 한줄 상태예요.</p>
            <div className="card">
              <div className="upload-row"><div className="ur-label">🎯 이직 준비 중</div><div className="ur-sub">현재 적용됨</div></div>
              <div className="upload-row"><div className="ur-label">☕ 잠시 자리 비움</div><div className="ur-sub">7/12 – 7/13</div></div>
              <div className="upload-row"><div className="ur-label">🚀 사이드 프로젝트 런칭 준비</div><div className="ur-sub">6/28 – 7/05</div></div>
            </div>
          </section>
        </div>
      </div>

      <Toast show={toast.show} message={toast.message} />
    </div>
  );
}
