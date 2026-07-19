import Sidebar from '../components/Sidebar.jsx';
import { IconPlus, IconTrash } from '../components/icons.jsx';
import './Profile.css';

const TRASH_ICON = <IconTrash />;

export default function Profile() {
  return (
    <div className="app-shell">
      <Sidebar active="profile" />
      <div className="main page-profile">
        <header className="topbar">
          <h1>프로필 · 경력 관리</h1>
          <span className="meta" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>마지막 저장 2분 전</span>
        </header>

        <div className="content">
          <section className="card">
            <div className="card-head"><h2>기본 정보</h2></div>
            <div className="field-row">
              <div className="field"><label>이름</label><input className="input" defaultValue="이승현" /></div>
              <div className="field"><label>연락처</label><input className="input" defaultValue="010-1234-5678" /></div>
              <div className="field"><label>이메일</label><input className="input" defaultValue="austin9796@gmail.com" /></div>
              <div className="field"><label>링크드인 / 포트폴리오 URL</label><input className="input" defaultValue="linkedin.com/in/seunghyun" /></div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>경력 · 프로젝트</h2>
              <button className="btn btn-secondary btn-xs" onClick={() => alert('경력 항목 추가 폼이 열립니다')}>
                <IconPlus />
                경력 추가
              </button>
            </div>
            <div className="exp-item">
              <div className="exp-head">
                <div>
                  <div className="exp-role">백엔드 엔지니어</div>
                  <div className="exp-company">다우기술 · MSA 전환 프로젝트</div>
                </div>
                <div className="exp-actions">
                  <span className="exp-period">2023.03 – 2024.06</span>
                  <button className="btn-icon" title="삭제">{TRASH_ICON}</button>
                </div>
              </div>
              <div className="exp-body">
                <ul>
                  <li>주문·결제 모놀리식 서비스를 8개 마이크로서비스로 분리, 배포 주기를 2주 → 2일로 단축</li>
                  <li>서비스 간 통신을 gRPC로 전환해 평균 응답 시간 120ms 개선</li>
                </ul>
              </div>
              <div className="exp-tags"><span className="tag">Spring Boot</span><span className="tag">MSA</span><span className="tag">Kafka</span></div>
            </div>
            <div className="exp-item">
              <div className="exp-head">
                <div>
                  <div className="exp-role">백엔드 엔지니어</div>
                  <div className="exp-company">다우기술 · 커머스 결제 시스템 리팩토링</div>
                </div>
                <div className="exp-actions">
                  <span className="exp-period">2022.01 – 2022.12</span>
                  <button className="btn-icon" title="삭제">{TRASH_ICON}</button>
                </div>
              </div>
              <div className="exp-body">
                <ul>
                  <li>레거시 결제 모듈을 Spring Boot 기반으로 재작성, 트래픽 처리량 3배 증설</li>
                  <li>코드 리뷰 체크리스트를 도입해 배포 후 장애 건수를 절반으로 감소</li>
                </ul>
              </div>
              <div className="exp-tags"><span className="tag">Java</span><span className="tag">MySQL</span><span className="tag">RESTful API</span></div>
            </div>
            <div className="exp-item">
              <div className="exp-head">
                <div>
                  <div className="exp-role">주니어 백엔드 엔지니어</div>
                  <div className="exp-company">다우기술 · 신입 온보딩 자동화 툴</div>
                </div>
                <div className="exp-actions">
                  <span className="exp-period">2021.02 – 2021.12</span>
                  <button className="btn-icon" title="삭제">{TRASH_ICON}</button>
                </div>
              </div>
              <div className="exp-body">
                <ul>
                  <li>사내 온보딩 자동화 도구를 구축해 신규 입사자 계정 발급 시간을 단축</li>
                </ul>
              </div>
              <div className="exp-tags"><span className="tag">Node.js</span><span className="tag">CI/CD</span></div>
            </div>
          </section>

          <section className="card">
            <div className="card-head"><h2>스킬 · 기술 스택 라이브러리</h2></div>
            <div className="skill-group">
              <div className="sg-label">전문 · 3년 이상</div>
              <div className="skill-chips">
                <span className="skill-chip expert">Java</span>
                <span className="skill-chip expert">Spring Boot</span>
                <span className="skill-chip expert">MSA</span>
              </div>
            </div>
            <div className="skill-group">
              <div className="sg-label">능숙 · 1~3년</div>
              <div className="skill-chips">
                <span className="skill-chip">AWS</span>
                <span className="skill-chip">Kafka</span>
                <span className="skill-chip">MySQL</span>
                <span className="skill-chip">RESTful API</span>
              </div>
            </div>
            <div className="skill-group">
              <div className="sg-label">기본</div>
              <div className="skill-chips">
                <span className="skill-chip">Node.js</span>
                <span className="skill-chip">CI/CD</span>
                <span className="skill-chip">Docker</span>
              </div>
            </div>
            <div className="add-skill-input">
              <input className="input" placeholder="스킬 이름 입력 후 Enter (예: Redis)" />
              <button className="btn btn-secondary btn-xs">추가</button>
            </div>
          </section>

          <section className="card">
            <div className="card-head"><h2>경험 데이터 가져오기</h2></div>
            <div className="import-grid">
              <div className="upload-zone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                기존 이력서 파일(PDF/DOCX)을 업로드하면 경력 항목을 자동으로 추출해요
                <div style={{ marginTop: 12 }}><button className="btn btn-secondary btn-xs">파일 선택</button></div>
              </div>
              <div className="import-url-box">
                <div className="field"><label>링크드인 프로필 URL</label><input className="input" placeholder="linkedin.com/in/username" /></div>
                <button className="btn btn-secondary btn-xs" style={{ alignSelf: 'flex-start' }}>가져오기</button>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>동일 프로젝트는 자동으로 중복 병합돼요.</p>
              </div>
            </div>
          </section>

          <section className="card section-gap" style={{ marginBottom: 40 }}>
            <div className="card-head"><h2>변경 이력</h2></div>
            <div className="history-item">
              <div><div className="hi-what">MSA 전환 프로젝트 성과 문구 수정</div><div className="hi-when">2시간 전</div></div>
              <a onClick={() => alert('이전 버전으로 복원합니다')}>복원</a>
            </div>
            <div className="history-item">
              <div><div className="hi-what">Kafka 스킬 태그 추가</div><div className="hi-when">어제</div></div>
              <a onClick={() => alert('이전 버전으로 복원합니다')}>복원</a>
            </div>
            <div className="history-item">
              <div><div className="hi-what">이력서 파일에서 경력 3건 자동 추출</div><div className="hi-when">2026.07.10</div></div>
              <a onClick={() => alert('이전 버전으로 복원합니다')}>복원</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
