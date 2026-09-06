import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Crumb from '../components/Crumb.jsx';
import Toast from '../components/Toast.jsx';
import useToast from '../hooks/useToast.js';
import { DOC_LABEL, coverageOf, docsOfJob, getJobs } from '../data/nansa.js';
import {
  PERSONAS,
  buildPlan,
  buildReport,
  evaluateAnswer,
  getPersona,
  keywordSplit,
  reaction,
  saveSession,
} from '../data/interview.js';
import { addAchievement, addBullet, getCareers, parseAnswer } from '../data/career.js';
import './InterviewChat.css';

const HINTS = {
  opening: '두괄식으로. "저는 ○○을 ○년 해온 사람입니다"로 시작하고 숫자 하나를 붙이세요.',
  req: '상황 → 본인이 한 행동 → 결과(숫자) 세 문장이면 충분합니다.',
  achievement: '측정 방법과 본인 기여 비중을 구분해서 말하세요. "팀 성과 중 제 몫은 ○○입니다"',
  gap: '없으면 없다고 말하고, 대신 가장 가까운 경험과 학습 계획을 붙이세요. 지어내면 바로 티가 납니다.',
  duty: '지금 조직에서 해봤던 진입 방식을 근거로 말하세요. 추측보다 경험이 낫습니다.',
  motive: '회사의 구체적인 사실(제품·기사·채용공고 문구)을 하나 인용하세요.',
  collab: '갈등의 승패가 아니라, 합의를 만든 방법에 초점을 두세요.',
  move: '전 직장을 깎아내리지 말고, 하고 싶은 일 중심으로 말하세요.',
  decision: '무엇을 포기했는지까지 말해야 판단력으로 들립니다.',
  failure: '원인 분석과 그 뒤에 바꾼 행동을 반드시 붙이세요.',
  impact: '숫자 목표 하나를 못 박으세요. "○○를 ○%까지"',
  closing: '역질문 1개는 준비된 사람으로 보입니다. 조직 구조나 첫 3개월 기대치를 물어보세요.',
};

export default function InterviewChat() {
  const [params, setParams] = useSearchParams();
  const { toast, showToast } = useToast();

  const jobs = useMemo(() => getJobs().filter(j => j.analysis), []);
  const [jobId, setJobId] = useState(() => params.get('job') || (jobs[0] ? jobs[0].id : ''));
  const [personaKey, setPersonaKey] = useState('lead');
  const [stage, setStage] = useState('setup');

  const [plan, setPlan] = useState([]);
  const [idx, setIdx] = useState(0);
  const [turns, setTurns] = useState([]);
  const [followUpUsed, setFollowUpUsed] = useState(false);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [report, setReport] = useState(null);
  const [saveTarget, setSaveTarget] = useState('');
  const [saved, setSaved] = useState({});

  const streamRef = useRef(null);
  const inputRef = useRef(null);
  const turnsRef = useRef([]);

  const job = useMemo(() => jobs.find(j => String(j.id) === String(jobId)) || null, [jobs, jobId]);
  const persona = getPersona(personaKey);
  const split = useMemo(() => (job ? keywordSplit(job) : { covered: [], missing: [], docs: [] }), [job, stage]);
  const docs = useMemo(() => (job ? docsOfJob(job.id) : []), [job, stage]);
  const careers = useMemo(() => getCareers(), [stage]);

  useEffect(() => {
    turnsRef.current = turns;
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [turns, thinking]);

  useEffect(() => {
    if (careers.length && !saveTarget) setSaveTarget(careers[0].id);
  }, [careers, saveTarget]);

  function start() {
    if (!job) return;
    const next = buildPlan(job, personaKey);
    setPlan(next);
    setIdx(0);
    setFollowUpUsed(false);
    setTurns([{ role: 'ai', text: next[0].text, kind: next[0].kind }]);
    setStage('chat');
    setParams({ job: String(job.id), persona: personaKey }, { replace: true });
    window.setTimeout(() => inputRef.current && inputRef.current.focus(), 120);
  }

  function send() {
    const text = input.trim();
    if (!text || thinking || stage !== 'chat') return;
    const question = plan[idx] || { kind: 'closing', text: '' };
    const evaluation = evaluateAnswer(text, question);

    setTurns(t => [...t, { role: 'me', text, evaluation, questionText: question.text }]);
    setInput('');
    setShowHint(false);
    setThinking(true);

    window.setTimeout(() => {
      setThinking(false);
      if (evaluation.followUp && !followUpUsed) {
        setFollowUpUsed(true);
        setTurns(t => [...t, { role: 'ai', text: evaluation.followUp, kind: question.kind, isFollowUp: true }]);
        return;
      }
      const nextIdx = idx + 1;
      if (nextIdx >= plan.length) {
        setTurns(t => [...t, { role: 'ai', reaction: reaction(evaluation), text: '여기까지 하겠습니다. 오늘 답변 정리해서 보여드릴게요.', kind: 'end' }]);
        window.setTimeout(() => finish(), 500);
        return;
      }
      setIdx(nextIdx);
      setFollowUpUsed(false);
      setTurns(t => [...t, { role: 'ai', reaction: reaction(evaluation), text: plan[nextIdx].text, kind: plan[nextIdx].kind }]);
    }, 620);
  }

  function finish() {
    if (!job) return;
    const built = buildReport(job, plan, turnsRef.current);
    setReport(built);
    setStage('report');
    saveSession({
      jobId: job.id,
      company: job.company,
      title: job.title,
      persona: personaKey,
      avg: built.avg,
      answered: built.answeredCount,
    });
  }

  function restart() {
    setStage('setup');
    setTurns([]);
    setPlan([]);
    setIdx(0);
    setReport(null);
    setSaved({});
  }

  function saveCandidate(candidate, i) {
    const target = careers.find(c => c.id === saveTarget) || careers[0];
    if (!target) {
      showToast('먼저 프로필에 경력을 추가해 주세요');
      return;
    }
    const bullet = addBullet(target.id, candidate.text);
    const parsed = parseAnswer(candidate.text, null);
    if (parsed) addAchievement({ careerId: target.id, bulletId: bullet.id, ...parsed });
    setSaved({ ...saved, [i]: true });
    showToast(`${target.company} 경력에 성과로 저장했어요`);
  }

  const answered = turns.filter(t => t.role === 'me').length;
  const progress = plan.length ? Math.min(100, Math.round((answered / plan.length) * 100)) : 0;
  const askedRefs = new Set(plan.slice(0, idx + 1).map(p => p.ref).filter(Boolean));

  /* ---------------- 공고가 없을 때 ---------------- */

  if (!jobs.length) {
    return (
      <div className="app-shell">
        <Sidebar active="interview" />
        <div className="main page-interview">
          <header className="topbar"><Crumb to="/dashboard" label="대시보드" /><h1>면접 연습</h1><span style={{ width: 70 }}></span></header>
          <div className="content">
            <div className="card iv-empty">
              <h2>아직 분석된 공고가 없어요</h2>
              <p>면접관은 공고의 요건과 제출한 서류를 읽고 질문합니다. 먼저 공고를 등록하고 분석해 주세요.</p>
              <Link className="btn btn-primary" to="/jobs">공고 등록하러 가기</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar active="interview" />
      <div className="main page-interview">
        <header className="topbar">
          <Crumb to={job ? `/jobs/${job.id}` : '/dashboard'} label={job ? '공고 상세' : '대시보드'} />
          <h1>면접 연습{job ? ` · ${job.title} @ ${job.company}` : ''}</h1>
          {stage === 'chat' ? (
            <button className="btn btn-secondary btn-xs" onClick={finish}>면접 종료</button>
          ) : (
            <span style={{ width: 70 }}></span>
          )}
        </header>

        <div className="content">
          {/* ---------- 준비 화면 ---------- */}
          {stage === 'setup' && (
            <div className="iv-setup">
              <h2 className="iv-setup-title">누구와 연습할까요?</h2>
              <p className="iv-setup-sub">
                선택한 공고의 <strong>JD 요건</strong>과 그 공고로 만든 <strong>제출 서류</strong>를 그대로 읽고 질문합니다.
                일반적인 예상 질문이 아니라, 내 서류에서만 나올 수 있는 질문이에요.
              </p>

              <div className="field iv-job-field">
                <label>연습할 공고</label>
                <select className="input" value={jobId} onChange={e => setJobId(e.target.value)}>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.company} · {j.title}</option>)}
                </select>
              </div>

              {job && (
                <div className="iv-source">
                  <span className="iv-source-item"><b>{(job.analysis.req || []).length}</b>개 자격요건</span>
                  <span className="iv-source-item"><b>{(job.keywords || []).length}</b>개 키워드</span>
                  <span className="iv-source-item"><b>{docs.length}</b>건 제출 서류</span>
                  <span className="iv-source-item">서류에 없는 키워드 <b>{split.missing.length}</b>개</span>
                </div>
              )}

              <div className="persona-grid">
                {PERSONAS.map(p => (
                  <button
                    type="button"
                    key={p.key}
                    className={`persona-card${personaKey === p.key ? ' selected' : ''}`}
                    aria-pressed={personaKey === p.key}
                    onClick={() => setPersonaKey(p.key)}
                  >
                    <span className="persona-avatar">{p.initial}</span>
                    <span className="persona-name">{p.name}</span>
                    <span className="persona-tag">{p.tagline}</span>
                    <span className="persona-desc">{p.desc}</span>
                  </button>
                ))}
              </div>

              <button className="btn btn-primary iv-start" onClick={start} disabled={!job}>
                면접 시작하기
              </button>
            </div>
          )}

          {/* ---------- 채팅 화면 ---------- */}
          {stage === 'chat' && job && (
            <div className="iv-layout">
              <div className="iv-chat">
                <div className="iv-progress">
                  <div className="iv-progress-head">
                    <span>{persona.name}와 진행 중</span>
                    <span className="iv-progress-num">{answered} / {plan.length}</span>
                  </div>
                  <div className="iv-progress-bar"><div style={{ width: `${progress}%` }}></div></div>
                </div>

                <div className="iv-stream" ref={streamRef}>
                  {turns.map((t, i) => (
                    t.role === 'ai' ? (
                      <div className="msg ai" key={i}>
                        <span className="msg-avatar">{persona.initial}</span>
                        <div className="msg-body">
                          {t.reaction && <div className="msg-reaction">{t.reaction}</div>}
                          <div className={`bubble${t.isFollowUp ? ' follow' : ''}`}>{t.text}</div>
                          {t.isFollowUp && <div className="msg-note">꼬리 질문</div>}
                        </div>
                      </div>
                    ) : (
                      <div className="msg me" key={i}>
                        <div className="msg-body">
                          <div className="bubble">{t.text}</div>
                          {t.evaluation && (
                            <div className="msg-tags">
                              {t.evaluation.tags.map(tag => (
                                <span className={`eval-tag ${tag.tone}`} key={tag.label}>{tag.label}</span>
                              ))}
                              <span className="eval-score">{t.evaluation.score}점</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                  {thinking && (
                    <div className="msg ai">
                      <span className="msg-avatar">{persona.initial}</span>
                      <div className="msg-body"><div className="bubble typing"><i></i><i></i><i></i></div></div>
                    </div>
                  )}
                </div>

                {showHint && plan[idx] && (
                  <div className="iv-hintbox">
                    <strong>답변 팁</strong>
                    {HINTS[plan[idx].kind] || '상황 → 행동 → 결과 순서로, 숫자를 하나 이상 넣으세요.'}
                  </div>
                )}

                <div className="iv-compose">
                  <textarea
                    ref={inputRef}
                    className="iv-input"
                    rows={2}
                    placeholder="답변을 입력하세요. Enter로 전송, Shift+Enter로 줄바꿈"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                    }}
                  />
                  <div className="iv-compose-side">
                    <button className="btn btn-secondary btn-xs" onClick={() => setShowHint(v => !v)}>
                      {showHint ? '팁 닫기' : '답변 팁'}
                    </button>
                    <button className="btn btn-primary btn-xs" onClick={send} disabled={!input.trim() || thinking}>보내기</button>
                  </div>
                </div>
              </div>

              <aside className="iv-context">
                <div className="ctx-card">
                  <h3>이 면접의 재료</h3>
                  <div className="ctx-job">{job.company} · {job.title}</div>
                  <div className="ctx-sub">{persona.name} 모드</div>
                </div>

                <div className="ctx-card">
                  <h3>자격 요건 확인</h3>
                  {(job.analysis.req || []).length ? (
                    <ul className="ctx-list">
                      {(job.analysis.req || []).map(r => (
                        <li key={r} className={askedRefs.has(r) ? 'done' : ''}>
                          <span className="ctx-check">{askedRefs.has(r) ? '✓' : ''}</span>{r}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="ctx-empty">요건 항목이 없어요.</p>}
                </div>

                <div className="ctx-card">
                  <h3>제출 서류</h3>
                  {docs.length ? docs.map(d => (
                    <div className="ctx-doc" key={d.id}>
                      <span>{DOC_LABEL[d.type]} v{d.version}</span>
                      <span className="ctx-cov">{coverageOf(d)}%</span>
                    </div>
                  )) : <p className="ctx-empty">이 공고로 만든 서류가 없어요.</p>}
                </div>

                {split.missing.length > 0 && (
                  <div className="ctx-card warn">
                    <h3>서류에 없는 키워드</h3>
                    <p className="ctx-empty">면접관이 이 부분을 찌를 수 있어요.</p>
                    <div className="ctx-chips">
                      {split.missing.map(k => <span className="ctx-chip" key={k.name}>{k.name}</span>)}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          )}

          {/* ---------- 리포트 ---------- */}
          {stage === 'report' && report && (
            <div className="iv-report">
              <div className="card report-head">
                <div className="report-score">
                  <span className="rs-num">{report.avg}</span>
                  <span className="rs-unit">점</span>
                </div>
                <div className="report-meta">
                  <h2>{job.company} · {job.title} 면접 리포트</h2>
                  <p>
                    질문 {report.planCount}개 중 {report.answeredCount}개 답변 ·
                    수치가 들어간 답변 <strong>{report.numberRate}%</strong> ·
                    자격 요건 {report.checkedReqs.length}/{report.totalReqs}개 확인
                  </p>
                </div>
              </div>

              <div className="report-cols">
                <div className="card">
                  <h3 className="report-h3">잘한 점</h3>
                  {report.strengths.length ? (
                    <ul className="report-list good">{report.strengths.map(s => <li key={s}>{s}</li>)}</ul>
                  ) : <p className="ctx-empty">아직 근거가 부족해요.</p>}
                </div>
                <div className="card">
                  <h3 className="report-h3">보완할 점</h3>
                  {report.improvements.length ? (
                    <ul className="report-list warn">{report.improvements.map(s => <li key={s}>{s}</li>)}</ul>
                  ) : <p className="ctx-empty">특별히 없어요.</p>}
                </div>
              </div>

              <div className="card">
                <h3 className="report-h3">답변에서 나온 숫자를 성과로 저장하기</h3>
                <p className="report-sub">
                  면접에서 말한 수치는 서류에도 그대로 들어가야 합니다. 저장하면 프로필 경력에 성과로 붙고,
                  다음 서류 생성부터 근거로 쓰여요.
                </p>
                {careers.length > 0 && report.candidates.length > 0 && (
                  <div className="save-target">
                    <label>저장할 경력</label>
                    <select className="input" value={saveTarget} onChange={e => setSaveTarget(e.target.value)}>
                      {careers.map(c => <option key={c.id} value={c.id}>{c.company} · {c.project || c.role}</option>)}
                    </select>
                  </div>
                )}
                {report.candidates.length ? report.candidates.map((c, i) => (
                  <div className="cand-row" key={i}>
                    <div className="cand-text">{c.text}</div>
                    <button
                      className={`btn btn-xs ${saved[i] ? 'btn-secondary' : 'btn-primary'}`}
                      disabled={saved[i]}
                      onClick={() => saveCandidate(c, i)}
                    >
                      {saved[i] ? '저장됨' : '성과로 저장'}
                    </button>
                  </div>
                )) : (
                  <p className="ctx-empty">숫자가 들어간 답변이 없어서 저장할 성과가 없어요. 다음엔 규모를 숫자로 말해 보세요.</p>
                )}
              </div>

              <div className="report-actions">
                <button className="btn btn-secondary" onClick={restart}>다시 연습하기</button>
                <Link className="btn btn-secondary" to="/profile">프로필에서 성과 확인</Link>
                <Link className="btn btn-primary" to={`/generate?job=${job.id}&types=resume`}>보완된 성과로 서류 다시 만들기</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <Toast show={toast.show} message={toast.message} />
    </div>
  );
}

