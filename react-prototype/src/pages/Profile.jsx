import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Toast from '../components/Toast.jsx';
import useToast from '../hooks/useToast.js';
import { IconPlus, IconTrash } from '../components/icons.jsx';
import {
  METRIC_PRESETS,
  achievementsOfBullet,
  addAchievement,
  addBullet,
  addCareer,
  formatAchievement,
  followUpQuestions,
  getAchievements,
  getCareers,
  isQuantified,
  parseAnswer,
  quantScore,
  removeBullet,
  removeCareer,
  scoreLabel,
  suggestBulletText,
  updateBullet,
} from '../data/career.js';
import './Profile.css';

const EMPTY_FORM = { role: '', company: '', project: '', start: '', end: '', tags: '', bullet: '' };

export default function Profile() {
  const { toast, showToast } = useToast();
  const [tick, setTick] = useState(0);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [interview, setInterview] = useState(null); // { careerId, bulletId, qIndex, step, answer, parsed, draft }
  const [newBullet, setNewBullet] = useState({});
  const answerRef = useRef(null);

  const careers = useMemo(() => getCareers(), [tick]);
  const achievements = useMemo(() => getAchievements(), [tick]);
  const quant = useMemo(() => quantScore(), [tick]);
  const label = scoreLabel(quant.score);

  function refresh() {
    setTick(t => t + 1);
  }

  /* ---------------- 성과 인터뷰 ---------------- */

  function openInterview(careerId, bullet) {
    const questions = followUpQuestions(bullet.text);
    setInterview({
      careerId,
      bulletId: bullet.id,
      bulletText: bullet.text,
      questions,
      qIndex: 0,
      step: 'ask',
      answer: '',
      parsed: null,
      draft: '',
      miss: false,
    });
    window.setTimeout(() => answerRef.current && answerRef.current.focus(), 60);
  }

  function closeInterview() {
    setInterview(null);
  }

  function nextQuestion() {
    setInterview(iv => (iv ? { ...iv, qIndex: (iv.qIndex + 1) % iv.questions.length, answer: '', miss: false } : iv));
    window.setTimeout(() => answerRef.current && answerRef.current.focus(), 60);
  }

  function submitAnswer() {
    if (!interview) return;
    const question = interview.questions[interview.qIndex];
    const parsed = parseAnswer(interview.answer, question, interview.bulletText);
    if (!parsed) {
      setInterview({ ...interview, miss: true });
      return;
    }
    setInterview({
      ...interview,
      step: 'confirm',
      parsed,
      miss: false,
      draft: suggestBulletText(interview.bulletText, parsed),
    });
  }

  function applyAchievement() {
    if (!interview || !interview.parsed) return;
    updateBullet(interview.careerId, interview.bulletId, interview.draft.trim() || interview.bulletText);
    addAchievement({
      careerId: interview.careerId,
      bulletId: interview.bulletId,
      ...interview.parsed,
    });
    closeInterview();
    refresh();
    showToast('성과를 숫자로 저장했어요');
  }

  function usePreset(preset) {
    setInterview(iv => (iv ? { ...iv, answer: iv.answer ? iv.answer : `${preset.label} `, miss: false } : iv));
    window.setTimeout(() => answerRef.current && answerRef.current.focus(), 30);
  }

  /* ---------------- 경력 추가 ---------------- */

  function submitCareer() {
    if (!form.role.trim() || !form.company.trim()) {
      setFormError('역할과 회사는 꼭 입력해 주세요.');
      return;
    }
    const created = addCareer({
      role: form.role,
      company: form.company,
      project: form.project,
      start: form.start,
      end: form.end,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      bullets: form.bullet.trim() ? [form.bullet.trim()] : [],
    });
    setForm(EMPTY_FORM);
    setFormError('');
    setAdding(false);
    refresh();
    showToast('경력을 추가했어요');
    // 성과 한 줄을 적었는데 숫자가 없다면, 바로 되묻는다.
    const first = created.bullets[0];
    if (first && !isQuantified(first, [])) {
      window.setTimeout(() => openInterview(created.id, first), 260);
    }
  }

  function submitNewBullet(careerId) {
    const text = (newBullet[careerId] || '').trim();
    if (!text) return;
    const bullet = addBullet(careerId, text);
    setNewBullet({ ...newBullet, [careerId]: '' });
    refresh();
    if (!isQuantified(bullet, [])) {
      window.setTimeout(() => openInterview(careerId, bullet), 200);
    } else {
      showToast('성과를 추가했어요');
    }
  }

  function scrollToFirstGap() {
    const el = document.querySelector('.bullet-row.needs-metric');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('flash');
    window.setTimeout(() => el.classList.remove('flash'), 1400);
  }

  const currentQuestion = interview ? interview.questions[interview.qIndex] : null;

  return (
    <div className="app-shell">
      <Sidebar active="profile" />
      <div className="main page-profile">
        <header className="topbar">
          <h1>프로필 · 경력 관리</h1>
          <span className={`quant-pill ${label.tone}`}>
            정량성 {quant.score}%
          </span>
        </header>

        <div className="content">
          {/* 정량성 점수: JD 키워드 커버리지와 짝을 이루는 두 번째 축 */}
          <section className={`card quant-card ${label.tone}`}>
            <div className="quant-left">
              <div className="quant-ring" style={{ '--pct': `${quant.score}` }}>
                <span className="quant-num">{quant.score}<i>%</i></span>
              </div>
            </div>
            <div className="quant-body">
              <h2>경력 정량성 · {label.text}</h2>
              <p>
                성과 문장 {quant.total}개 중 <strong>{quant.filled}개</strong>에 숫자가 들어 있어요.
                면접관과 ATS가 가장 먼저 붙잡는 건 형용사가 아니라 숫자입니다.
              </p>
              {quant.gaps > 0 ? (
                <button className="btn btn-primary btn-xs" onClick={scrollToFirstGap}>
                  숫자 빠진 문장 {quant.gaps}개 보완하기
                </button>
              ) : (
                <span className="quant-done">모든 문장에 숫자가 들어갔어요 👏</span>
              )}
            </div>
          </section>

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
              <button className="btn btn-secondary btn-xs" onClick={() => { setAdding(v => !v); setFormError(''); }}>
                <IconPlus />
                {adding ? '입력 접기' : '경력 추가'}
              </button>
            </div>

            <div className={`career-form${adding ? ' open' : ''}`}>
              <div className="career-form-inner">
                <div className="cf-grid">
                  <div className="field"><label>역할 *</label><input className="input" placeholder="예: SI PM" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
                  <div className="field"><label>회사 *</label><input className="input" placeholder="예: 모멘티" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                  <div className="field"><label>프로젝트</label><input className="input" placeholder="예: 대외 포털 고도화" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} /></div>
                  <div className="field"><label>기술 · 키워드 (쉼표로 구분)</label><input className="input" placeholder="예: 요구사항관리, WBS, Jira" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /></div>
                  <div className="field"><label>시작</label><input className="input" placeholder="2024.03" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} /></div>
                  <div className="field"><label>종료</label><input className="input" placeholder="2025.08 또는 재직중" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} /></div>
                </div>
                <div className="field">
                  <label>대표 성과 한 줄</label>
                  <input
                    className="input"
                    placeholder="예: 요구사항 변경 프로세스를 정비해 재작업을 줄임"
                    value={form.bullet}
                    onChange={e => setForm({ ...form, bullet: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') submitCareer(); }}
                  />
                  <p className="field-hint">숫자가 없어도 괜찮아요. 저장하면 바로 몇 가지만 되물어서 같이 채워 드릴게요.</p>
                </div>
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <div className="cf-actions">
                  <button className="btn btn-secondary btn-xs" onClick={() => { setAdding(false); setForm(EMPTY_FORM); setFormError(''); }}>취소</button>
                  <button className="btn btn-primary btn-xs" onClick={submitCareer}>추가하기</button>
                </div>
              </div>
            </div>

            {careers.length === 0 && (
              <p className="exp-empty">아직 등록한 경력이 없어요. 위에서 첫 경력을 추가해 보세요.</p>
            )}

            {careers.map(career => (
              <div className="exp-item" key={career.id}>
                <div className="exp-head">
                  <div>
                    <div className="exp-role">{career.role}</div>
                    <div className="exp-company">{career.company}{career.project ? ` · ${career.project}` : ''}</div>
                  </div>
                  <div className="exp-actions">
                    <span className="exp-period">{career.start}{career.end ? ` – ${career.end}` : ''}</span>
                    <button
                      className="btn-icon"
                      title="경력 삭제"
                      onClick={() => { removeCareer(career.id); refresh(); showToast('경력을 삭제했어요'); }}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>

                <div className="exp-body">
                  {career.bullets.map(bullet => {
                    const own = achievementsOfBullet(bullet.id);
                    const ok = isQuantified(bullet, achievements);
                    const open = interview && interview.bulletId === bullet.id;
                    return (
                      <div className={`bullet-row${ok ? '' : ' needs-metric'}${open ? ' open' : ''}`} key={bullet.id}>
                        <div className="bullet-main">
                          <span className="bullet-dot" aria-hidden="true"></span>
                          <div className="bullet-text">
                            {bullet.text}
                            {own.length > 0 && (
                              <span className="bullet-chips">
                                {own.map(a => <span className="ach-chip" key={a.id}>{formatAchievement(a)}</span>)}
                              </span>
                            )}
                          </div>
                          <div className="bullet-side">
                            {!ok && !open && (
                              <button className="bullet-fix" onClick={() => openInterview(career.id, bullet)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" width="13" height="13"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>
                                숫자 채우기
                              </button>
                            )}
                            <button
                              className="bullet-del"
                              title="문장 삭제"
                              onClick={() => { removeBullet(career.id, bullet.id); if (open) closeInterview(); refresh(); }}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        {open && (
                          <div className="interview-panel">
                            <div className="iv-head">
                              <span className="iv-avatar">난</span>
                              <div className="iv-ask">
                                {interview.step === 'ask' ? currentQuestion.ask : '이렇게 바꿔 둘까요?'}
                                {interview.step === 'ask' && interview.questions.length > 1 && (
                                  <button className="iv-swap" onClick={nextQuestion}>다른 질문으로</button>
                                )}
                              </div>
                              <button className="iv-close" onClick={closeInterview} title="닫기">×</button>
                            </div>

                            {interview.step === 'ask' ? (
                              <>
                                <div className="iv-presets">
                                  {METRIC_PRESETS.slice(0, 6).map(p => (
                                    <button className="iv-preset" key={p.label} onClick={() => usePreset(p)}>{p.label}</button>
                                  ))}
                                </div>
                                <div className="iv-input-row">
                                  <input
                                    ref={answerRef}
                                    className="input"
                                    placeholder={currentQuestion.hint}
                                    value={interview.answer}
                                    onChange={e => setInterview({ ...interview, answer: e.target.value, miss: false })}
                                    onKeyDown={e => { if (e.key === 'Enter') submitAnswer(); if (e.key === 'Escape') closeInterview(); }}
                                  />
                                  <button className="btn btn-primary btn-xs" onClick={submitAnswer}>반영</button>
                                </div>
                                {interview.miss && (
                                  <p className="iv-miss">숫자를 하나만 넣어 주세요. “8명”, “14일 → 2일”처럼 편하게 적으셔도 됩니다.</p>
                                )}
                                <p className="iv-note">모르면 건너뛰어도 괜찮아요. 나중에 면접 연습에서 다시 물어봐 드립니다.</p>
                              </>
                            ) : (
                              <>
                                <div className="iv-parsed">
                                  <span className="ach-chip strong">{formatAchievement(interview.parsed)}</span>
                                  <span className="iv-parsed-note">이 수치를 성과 데이터로 따로 저장해 둘게요.</span>
                                </div>
                                <textarea
                                  className="textarea iv-preview"
                                  rows={2}
                                  value={interview.draft}
                                  onChange={e => setInterview({ ...interview, draft: e.target.value })}
                                />
                                <div className="iv-actions">
                                  <button className="btn btn-secondary btn-xs" onClick={() => setInterview({ ...interview, step: 'ask', parsed: null })}>다시 답하기</button>
                                  <button className="btn btn-primary btn-xs" onClick={applyAchievement}>이대로 적용</button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="bullet-add">
                    <input
                      className="input"
                      placeholder="+ 성과 한 줄 추가"
                      value={newBullet[career.id] || ''}
                      onChange={e => setNewBullet({ ...newBullet, [career.id]: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') submitNewBullet(career.id); }}
                    />
                  </div>
                </div>

                {career.tags && career.tags.length > 0 && (
                  <div className="exp-tags">{career.tags.map(t => <span className="tag" key={t}>{t}</span>)}</div>
                )}
              </div>
            ))}
          </section>

          <section className="card practice-card">
            <div className="practice-body">
              <h2>이 경력으로 면접까지 연습해 볼까요?</h2>
              <p>공고 요건과 제출한 서류를 그대로 읽은 면접관이 질문합니다. 여기서 나온 숫자는 다시 성과로 저장돼요.</p>
            </div>
            <Link className="btn btn-primary" to="/interview">면접 연습 시작</Link>
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
        </div>
      </div>

      <Toast show={toast.show} message={toast.message} />
    </div>
  );
}
