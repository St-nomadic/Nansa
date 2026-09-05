import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Crumb from '../components/Crumb.jsx';
import Toast from '../components/Toast.jsx';
import useToast from '../hooks/useToast.js';
import {
  DOC_LABEL,
  agoLabel,
  getDocument,
  getDocuments,
  getJob,
  latestDocOfJob,
} from '../data/nansa.js';
import './DocumentEditor.css';

const INITIAL_CHECKS = [
  { label: '맞춤법 · 문장 흐름 확인 완료', checked: true },
  { label: '핵심 키워드 누락 없음', checked: true },
  { label: '분량 적정 (A4 1~2장)', checked: false },
  { label: '파일명 규칙 확인 (이름_회사_직무_이력서)', checked: false },
];

function resolveDoc(params) {
  const byId = params.get('doc') && getDocument(params.get('doc'));
  if (byId) return byId;
  const jobId = params.get('job');
  const type = params.get('type');
  if (jobId) {
    const docs = getDocuments().filter(d => String(d.jobId) === String(jobId) && (!type || d.type === type));
    if (docs.length) {
      return docs.sort((a, b) => b.version - a.version)[0];
    }
    const latest = latestDocOfJob(jobId);
    if (latest) return latest;
  }
  return getDocuments()[0] || null;
}

export default function DocumentEditor() {
  const [params] = useSearchParams();
  const { toast, showToast } = useToast();

  const doc = useMemo(() => resolveDoc(params), [params]);
  const job = doc ? getJob(doc.jobId) : null;
  const isNew = params.get('new') === '1';

  const [keywords, setKeywords] = useState(() => {
    if (!job || !job.keywords.length) return [];
    const covered = new Set(doc ? doc.covered : []);
    return job.keywords.map(k => ({ name: k.name, covered: covered.has(k.name) }));
  });
  const [checks, setChecks] = useState(INITIAL_CHECKS);

  function addKeyword(name) {
    setKeywords(prev => prev.map(k => (k.name === name ? { ...k, covered: true } : k)));
    showToast(`${name} 키워드를 문서에 반영했습니다`);
  }

  function toggleCheck(i) {
    setChecks(prev => prev.map((c, idx) => (idx === i ? { ...c, checked: !c.checked } : c)));
  }

  const coveredCount = keywords.filter(k => k.covered).length;
  const kwPercent = keywords.length ? Math.round((coveredCount / keywords.length) * 100) : 0;
  const checkedCount = checks.filter(c => c.checked).length;
  const ready = checkedCount === checks.length;

  const docTitle = doc ? `${DOC_LABEL[doc.type]} 초안 · v${doc.version}` : '서류 초안';
  const jobLabel = job ? `— ${job.title} @ ${job.company}` : '';
  const editedLabel = isNew ? '방금 생성됨' : doc ? `${agoLabel(doc.updatedAt)} 수정됨` : '';
  const backTo = job ? `/jobs/${job.id}` : '/jobs';

  const history = isNew
    ? [{ what: `${DOC_LABEL[doc ? doc.type : 'resume']} 초안 생성`, when: '방금 전' }]
    : [
        { what: '경력 요약 문장 다듬기', when: '10분 전' },
        { what: 'Kafka 키워드 자동 추가', when: '1시간 전' },
        { what: `v${doc && doc.version > 1 ? doc.version - 1 : 1} → v${doc ? doc.version : 1} 섹션 재생성`, when: doc ? agoLabel(doc.updatedAt) : '' },
      ];

  return (
    <div className="app-shell">
      <Sidebar active="jobs" />
      <div className="main page-editor">
        <header className="topbar">
          <Crumb to={backTo} label="공고 상세" />
          <div className="doc-title-wrap">
            <h1>{docTitle} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{jobLabel}</span></h1>
            <div className="doc-sub">표준 톤 · 한국어 · {editedLabel}</div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-secondary" onClick={() => showToast('읽기 전용 공유 링크가 복사되었습니다')}>공유 링크</button>
            <button className="btn btn-secondary" onClick={() => showToast('DOCX로 내보냈습니다')}>DOCX</button>
            <button className="btn btn-primary" onClick={() => showToast('PDF로 내보냈습니다')}>PDF 내보내기</button>
          </div>
        </header>

        <div className="content">
          <div className="editor-grid">
            <div>
              <div className="card">
                <div className="card-head"><h2>기본 정보</h2></div>
                <div className="field-row">
                  <div className="field"><label>이름</label><input className="input" defaultValue="이승현" /></div>
                  <div className="field"><label>연락처</label><input className="input" defaultValue="010-1234-5678" /></div>
                  <div className="field"><label>이메일</label><input className="input" defaultValue="austin9796@gmail.com" /></div>
                  <div className="field"><label>포트폴리오 / 링크드인</label><input className="input" defaultValue="linkedin.com/in/seunghyun" /></div>
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <h2>경력 요약</h2>
                  <span className="card-sub">클릭해서 바로 수정하세요</span>
                </div>
                <div className="editable" contentEditable suppressContentEditableWarning>백엔드 개발 4년차로, 커머스 도메인에서 결제·주문 시스템을 MSA로 전환하고 대용량 트래픽을 안정적으로 처리해 온 엔지니어입니다. Spring Boot와 AWS 기반의 서비스 설계·운영 경험을 바탕으로 {job ? job.company : '지원 회사'}의 서비스 확장에 기여하고 싶습니다.</div>
              </div>

              <div className="card">
                <div className="card-head">
                  <h2>경력 · 프로젝트</h2>
                  <span className="card-sub">JD 매칭 순으로 정렬됨</span>
                </div>
                <div className="proj-block">
                  <div className="proj-title">MSA 전환 프로젝트 · 다우기술 (2023.03 – 2024.06)</div>
                  <div className="editable" contentEditable suppressContentEditableWarning>
                    <ul>
                      <li>주문·결제 모놀리식 서비스를 8개 마이크로서비스로 분리, 배포 주기를 2주 → 2일로 단축</li>
                      <li>서비스 간 통신을 gRPC로 전환해 평균 응답 시간 120ms 개선</li>
                      <li>Kafka 기반 이벤트 파이프라인 도입으로 결제 실패 재처리 자동화</li>
                    </ul>
                  </div>
                </div>
                <div className="proj-block">
                  <div className="proj-title">커머스 결제 시스템 리팩토링 · 다우기술 (2022.01 – 2022.12)</div>
                  <div className="editable" contentEditable suppressContentEditableWarning>
                    <ul>
                      <li>레거시 결제 모듈을 Spring Boot 기반으로 재작성, 트래픽 처리량 3배 증설</li>
                      <li>코드 리뷰 체크리스트를 도입해 배포 후 장애 건수를 절반으로 감소</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-head"><h2>스킬</h2></div>
                <div className="skill-chips">
                  {['Java', 'Spring Boot', 'MSA', 'AWS', 'Kafka', 'MySQL', 'RESTful API'].map(s => (
                    <span className="skill-chip" key={s}>{s}</span>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-head"><h2>최종 점검 체크리스트</h2></div>
                {checks.map((c, i) => (
                  <label className={`check-item${c.checked ? ' checked' : ''}`} key={c.label}>
                    <input type="checkbox" checked={c.checked} onChange={() => toggleCheck(i)} /><span>{c.label}</span>
                  </label>
                ))}
                <div className={`submit-status${ready ? ' ready' : ''}`}>
                  <span className="ss-text">
                    {ready ? '모든 점검 완료 · 지원 준비가 끝났어요' : `${checkedCount}/${checks.length} 항목 완료 · 제출 전 마지막 점검이 남았어요`}
                  </span>
                  <Link className="btn btn-secondary btn-xs" to="/applications">지원 관리로 이동</Link>
                </div>
              </div>
            </div>

            <aside>
              <div className="side-card">
                <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.8 4.4L18 9l-4.2 1.6L12 15l-1.8-4.4L6 9l4.2-1.6z"/></svg>AI 보정</h3>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>편집 중인 문단에 적용돼요</p>
                <div className="ai-tools">
                  <button className="btn btn-secondary btn-xs" onClick={() => showToast('문장을 다듬었습니다')}>문장 다듬기</button>
                  <button className="btn btn-secondary btn-xs" onClick={() => showToast('내용을 압축했습니다')}>압축</button>
                  <button className="btn btn-secondary btn-xs" onClick={() => showToast('내용을 확장했습니다')}>확장</button>
                </div>
              </div>

              <div className="side-card">
                <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>키워드 반영 체크</h3>
                <div className="kw-progress-label"><span>키워드 반영률</span><span className="num" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>{kwPercent}%</span></div>
                <div className="coverage-bar"><div className="coverage-bar-fill" style={{ width: `${kwPercent}%` }}></div></div>
                <ul className="kw-list">
                  {keywords.map(k => (
                    <li className={k.covered ? 'covered' : 'missing'} key={k.name}>
                      <span className="kw-name"><span className="kw-dot"></span>{k.name}</span>
                      {!k.covered && <button className="btn btn-secondary btn-xs" onClick={() => addKeyword(k.name)}>추가</button>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="side-card">
                <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>매칭 근거</h3>
                <div className="evidence-item">
                  <div className="ev-text">&ldquo;8개 마이크로서비스로 분리, 배포 주기를 2주 → 2일로 단축&rdquo;</div>
                  <div className="ev-src">근거 · MSA 전환 프로젝트 실적</div>
                </div>
                <div className="evidence-item">
                  <div className="ev-text">&ldquo;Spring Boot 기반으로 재작성, 트래픽 처리량 3배 증설&rdquo;</div>
                  <div className="ev-src">근거 · 결제 시스템 리팩토링 실적</div>
                </div>
              </div>

              <div className="side-card">
                <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5M12 7v5l4 2"/></svg>변경 이력</h3>
                {history.map(h => (
                  <div className="history-item" key={h.what}>
                    <div><div className="hi-what">{h.what}</div><div className="hi-when">{h.when}</div></div>
                    <button type="button" className="history-undo" onClick={() => showToast('이전 버전으로 되돌렸습니다')}>되돌리기</button>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Toast show={toast.show} message={toast.message} />
    </div>
  );
}
