import { useNavigate } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();

  function scrollToHow() {
    const el = document.getElementById('how');
    if (el) window.scrollTo({ top: el.offsetTop - 72, behavior: 'smooth' });
  }

  return (
    <div className="page-landing">
      <header className="topnav">
        <div className="container topnav-inner">
          <span className="logo">Nansa</span>
          <nav>
            <a href="#features">기능</a>
            <a href="#how">작동 방식</a>
            <a onClick={() => navigate('/dashboard')}>대시보드 미리보기</a>
          </nav>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>시작하기</button>
        </div>
      </header>

      <main id="content">
        <section className="section hero">
          <div className="container hero-center">
            <p className="eyebrow">AI 지원 서류 자동화</p>
            <h1>채용 공고에 맞춰,<br />서류가 스스로 완성됩니다</h1>
            <p className="lead">공고 링크나 텍스트를 등록하면 Nansa가 요건을 분석하고 내 경력 데이터와 매칭해 이력서·자기소개서·포트폴리오를 만들어 드립니다.</p>
            <div className="hero-cta">
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>무료로 시작하기</button>
              <button className="btn btn-secondary" onClick={scrollToHow}>작동 방식 보기</button>
            </div>
          </div>
        </section>

        <section className="section" id="features">
          <div className="container stack" style={{ gap: 56 }}>
            <div style={{ maxWidth: '40ch' }}>
              <p className="eyebrow">핵심 기능</p>
              <h2>공고를 등록하면 무엇이 달라지나요</h2>
            </div>
            <div className="grid-3">
              <div className="feature card-flat">
                <div className="feature-mark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>
                </div>
                <h3>JD를 구조로 분석</h3>
                <p>채용 공고에서 업무·자격·우대 요건과 핵심 키워드를 자동으로 추출해, 놓치는 요건이 없는지 확인해요.</p>
              </div>
              <div className="feature card-flat">
                <div className="feature-mark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                </div>
                <h3>근거 있는 맞춤 문장</h3>
                <p>생성된 문장마다 어떤 경력·프로젝트에서 매칭했는지 근거를 함께 보여줘, 제출 전에 스스로 검증할 수 있어요.</p>
              </div>
              <div className="feature card-flat">
                <div className="feature-mark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/></svg>
                </div>
                <h3>지원 현황을 한 곳에서</h3>
                <p>공고별 서류 버전과 제출 상태, 마감일을 타임라인으로 관리하고 결과를 기록해 다음 지원에 활용해요.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="how">
          <div className="container stack" style={{ gap: 56 }}>
            <div style={{ maxWidth: '40ch' }}>
              <p className="eyebrow">작동 방식</p>
              <h2>네 단계면 충분해요</h2>
            </div>
            <div className="grid-4">
              <div className="step">
                <div className="step-num num">1</div>
                <h3>공고 등록</h3>
                <p>채용 공고 URL이나 텍스트를 붙여넣으세요.</p>
              </div>
              <div className="step">
                <div className="step-num num">2</div>
                <h3>JD 분석</h3>
                <p>요건과 키워드를 구조화해 보여드려요.</p>
              </div>
              <div className="step">
                <div className="step-num num">3</div>
                <h3>맞춤 서류 생성</h3>
                <p>내 경력 데이터와 매칭해 서류를 만들어요.</p>
              </div>
              <div className="step">
                <div className="step-num num">4</div>
                <h3>검토 후 제출</h3>
                <p>근거를 확인하고 다듬은 뒤 바로 지원해요.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container grid-1-2">
            <div className="ph-img wide" aria-label="프로필/경력 데이터 화면 자리표시자">[ 프로필 · 경력 데이터 미리보기 ]</div>
            <div>
              <p className="eyebrow">경력 데이터</p>
              <h2>경력 데이터는 한 번만 입력하세요</h2>
              <p className="lead" style={{ marginTop: 16 }}>프로필에 경력·프로젝트·스킬을 구조화해서 저장해두면, 공고가 바뀔 때마다 처음부터 다시 쓸 필요 없이 자동으로 맞춰 드립니다.</p>
              <ul className="list-check">
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>기존 이력서 파일에서 경력 항목 자동 추출</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>직무·기술 태그로 정리되는 스킬 라이브러리</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>변경 이력을 타임라인으로 보관, 언제든 복원</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container" style={{ maxWidth: 720 }}>
            <blockquote className="quote">&ldquo;공고마다 자기소개서를 새로 쓰던 시간이, 근거를 확인하고 다듬는 시간으로 바뀌었어요.&rdquo;</blockquote>
            <p className="quote-author">— Nansa 베타 사용자 인터뷰</p>
          </div>
        </section>

        <section className="section" style={{ textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 600 }}>
            <h2>다음 지원, 서류부터 다시 준비하지 마세요</h2>
            <p className="lead" style={{ margin: '16px auto 32px' }}>공고를 등록하고 첫 맞춤 서류를 만들어보세요.</p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>무료로 시작하기</button>
          </div>
        </section>
      </main>

      <footer className="pagefoot">
        <div className="container row-between">
          <span>© 2026 Nansa</span>
          <span className="meta">공고 하나, 서류는 자동으로 · hello@nansa.app</span>
        </div>
      </footer>
    </div>
  );
}
