import { useMemo, useRef, useState } from 'react';
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
  updateDocument,
} from '../data/nansa.js';
import { composeDocument, compressText, expandText, polishText } from '../data/compose.js';
import './DocumentEditor.css';

const INITIAL_CHECKS = [
  { label: '맞춤법 · 문장 흐름 확인 완료', checked: false },
  { label: '핵심 키워드 누락 없음', checked: false },
  { label: '[수치 필요] 표시 모두 처리', checked: false },
  { label: '파일명 규칙 확인 (이름_회사_직무_이력서)', checked: false },
];

function resolveDoc(params) {
  const byId = params.get('doc') && getDocument(params.get('doc'));
  if (byId) return byId;
  const jobId = params.get('job');
  const type = params.get('type');
  if (jobId) {
    const docs = getDocuments().filter(d => String(d.jobId) === String(jobId) && (!type || d.type === type));
    if (docs.length) return docs.sort((a, b) => b.version - a.version)[0];
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
  const paperRef = useRef(null);

  // 저장된 본문이 있으면 그대로, 없으면(예전 시드 문서) 지금 프로필 기준으로 즉석 조립한다.
  const initial = useMemo(() => {
    if (doc && doc.sections && doc.sections.length) {
      return { sections: doc.sections, matchPoints: doc.matchPoints || [], legacy: false };
    }
    if (doc && job) {
      const c = composeDocument(job, doc.type, { tone: doc.tone || '표준', length: '보통' });
      return { sections: c.sections, matchPoints: c.matchPoints, legacy: true };
    }
    return { sections: [], matchPoints: [], legacy: true };
  }, [doc, job]);

  const [sections, setSections] = useState(initial.sections);
  const [target, setTarget] = useState(() => {
    const first = initial.sections.find(s => s.key !== 'basic');
    return first ? first.key : (initial.sections[0] ? initial.sections[0].key : '');
  });
  const [undoStack, setUndoStack] = useState([]);
  const [checks, setChecks] = useState(INITIAL_CHECKS);
  const [keywords, setKeywords] = useState(() => {
    if (!job || !job.keywords.length) return [];
    const covered = new Set(doc ? doc.covered || [] : []);
    return job.keywords.map(k => ({ name: k.name, covered: covered.has(k.name) }));
  });

  const bodyText = useMemo(
    () => sections.reduce((acc, s) => acc + ' ' + s.blocks.map(b => b.text).join(' '), ''),
    [sections],
  );
  const needsFix = b => b.source !== 'heading' && (b.needsMetric || /\[수치 필요\]|\[근거 필요\]/.test(b.text)) && !/\d/.test(b.text);
  const gapCount = useMemo(
    () => sections.reduce((n, s) => n + s.blocks.filter(needsFix).length, 0),
    [sections],
  );
  const metricBlocks = useMemo(() => {
    const body = sections.reduce((acc, s) => acc.concat(s.blocks), []).filter(b => b.source !== 'heading');
    const withNum = body.filter(b => /\d/.test(b.text)).length;
    return body.length ? Math.round((withNum / body.length) * 100) : 0;
  }, [sections]);

  function persist(next) {
    setSections(next);
    if (doc) updateDocument(doc.id, { sections: next });
  }

  function pushUndo(label) {
    setUndoStack(prev => [{ label, when: '방금 전', sections: JSON.parse(JSON.stringify(sections)) }, ...prev].slice(0, 8));
  }

  function undo(i) {
    const entry = undoStack[i];
    if (!entry) return;
    persist(entry.sections);
    setUndoStack(prev => prev.filter((_, idx) => idx !== i));
    showToast('이전 상태로 되돌렸어요');
  }

  function editBlock(sectionKey, blockIdx, text) {
    const next = sections.map(s => (
      s.key === sectionKey
        ? { ...s, blocks: s.blocks.map((b, i) => (i === blockIdx ? { ...b, text } : b)) }
        : s
    ));
    persist(next);
  }

  /* ---------- 실제로 문장을 바꾸는 보정 ---------- */

  function applyTool(kind) {
    const section = sections.find(s => s.key === target);
    if (!section) return;
    let changed = 0;
    const nextBlocks = section.blocks.map(b => {
      if (b.source === 'heading') return b;
      let out = null;
      if (kind === 'polish') out = polishText(b.text);
      if (kind === 'compress') out = compressText(b.text);
      if (kind === 'expand') out = expandText(b.text, b.metric ? b.metric.split(' · ') : []);
      if (out && out !== b.text) { changed += 1; return { ...b, text: out }; }
      return b;
    });
    if (!changed) {
      showToast(kind === 'expand' ? '덧붙일 정량 근거가 없어요' : '이미 정리된 문장이에요');
      return;
    }
    pushUndo(`${section.title} · ${{ polish: '문장 다듬기', compress: '압축', expand: '근거 확장' }[kind]}`);
    persist(sections.map(s => (s.key === target ? { ...s, blocks: nextBlocks } : s)));
    showToast(`${section.title} 문장 ${changed}개를 바꿨어요`);
  }

  function addKeyword(name) {
    const section = sections.find(s => s.key === target) || sections.find(s => s.key !== 'basic');
    if (!section) return;
    const idx = section.blocks.findIndex(b => b.source !== 'heading');
    if (idx === -1) return;
    pushUndo(`${name} 키워드 반영`);
    const next = sections.map(s => (
      s.key === section.key
        ? { ...s, blocks: s.blocks.map((b, i) => (i === idx ? { ...b, text: `${b.text} (${name} 활용)` } : b)) }
        : s
    ));
    persist(next);
    setKeywords(prev => prev.map(k => (k.name === name ? { ...k, covered: true } : k)));
    showToast(`${name}을(를) ${section.title}에 넣었어요. 문장을 다듬어 주세요`);
  }

  function toggleCheck(i) {
    setChecks(prev => prev.map((c, idx) => (idx === i ? { ...c, checked: !c.checked } : c)));
  }

  function exportPdf() {
    window.print();
  }

  function exportDoc() {
    const title = doc ? `${DOC_LABEL[doc.type]}_${job ? job.company : '공고'}` : '서류';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:'Malgun Gothic',sans-serif;line-height:1.7">` +
      sections.map(s => `<h2>${s.title}</h2>` + s.blocks.map(b => `<p>${b.text.replace(/</g, '&lt;')}</p>`).join('')).join('') +
      '</body></html>';
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('워드에서 열 수 있는 파일로 저장했어요');
  }

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('현재 문서 주소를 복사했어요');
    } catch (e) {
      showToast('복사에 실패했어요. 주소창에서 직접 복사해 주세요');
    }
  }

  const coveredCount = keywords.filter(k => k.covered).length;
  const kwPercent = keywords.length ? Math.round((coveredCount / keywords.length) * 100) : 0;
  const checkedCount = checks.filter(c => c.checked).length;
  const ready = checkedCount === checks.length;

  const docTitle = doc ? `${DOC_LABEL[doc.type]} 초안 · v${doc.version}` : '서류 초안';
  const jobLabel = job ? `— ${job.title} @ ${job.company}` : '';
  const editedLabel = isNew ? '방금 생성됨' : doc ? `${agoLabel(doc.updatedAt)} 수정됨` : '';
  const backTo = job ? `/jobs/${job.id}` : '/jobs';

  if (!doc) {
    return (
      <div className="app-shell">
        <Sidebar active="jobs" />
        <div className="main page-editor">
          <header className="topbar"><Crumb to="/jobs" label="채용 공고" /></header>
          <div className="content">
            <div className="card" style={{ textAlign: 'center', padding: 44 }}>
              <h2 style={{ fontSize: 18, marginBottom: 8 }}>아직 만든 서류가 없어요</h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 18 }}>공고를 고르고 서류를 먼저 생성해 주세요.</p>
              <Link className="btn btn-primary" to="/jobs">공고 목록으로</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar active="jobs" />
      <div className="main page-editor">
        <header className="topbar">
          <Crumb to={backTo} label="공고 상세" />
          <div className="doc-title-wrap">
            <h1>{docTitle} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{jobLabel}</span></h1>
            <div className="doc-sub">{doc.tone || '표준'} 톤 · {doc.lang || '한국어'} · {editedLabel}</div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-secondary" onClick={copyShare}>공유 링크</button>
            <button className="btn btn-secondary" onClick={exportDoc}>DOCX</button>
            <button className="btn btn-primary" onClick={exportPdf}>PDF 내보내기</button>
          </div>
        </header>

        <div className="content">
          {initial.legacy && (
            <div className="legacy-note">
              이 문서는 예전 형식이라, 지금 프로필 기준으로 다시 조립해서 보여주고 있어요. 편집 내용은 저장되지 않습니다.
            </div>
          )}
          {gapCount > 0 && (
            <div className="gap-note">
              숫자가 비어 <code>[수치 필요]</code> 로 남은 자리가 <strong>{gapCount}곳</strong> 있어요.
              <Link to="/profile">프로필에서 채우기</Link>
              <Link to={`/interview?job=${doc.jobId}`}>면접 연습으로 캐내기</Link>
            </div>
          )}

          <div className="editor-grid">
            <div ref={paperRef} className="doc-paper">
              {sections.map(section => (
                <div className="card" key={section.key}>
                  <div className="card-head">
                    <h2>{section.title}</h2>
                    <span className="card-sub">{target === section.key ? 'AI 보정 대상' : '클릭해서 바로 수정하세요'}</span>
                  </div>
                  {section.blocks.map((b, i) => (
                    b.source === 'heading' ? (
                      <div className="proj-title" key={section.key + i}>{b.text}</div>
                    ) : (
                      <div
                        key={section.key + i}
                        className={`editable${needsFix(b) ? ' needs' : ''}`}
                        contentEditable
                        suppressContentEditableWarning
                        onFocus={() => setTarget(section.key)}
                        onBlur={e => editBlock(section.key, i, e.currentTarget.innerText.trim())}
                      >
                        {b.text}
                      </div>
                    )
                  ))}
                  {section.blocks.some(needsFix) && (
                    <p className="need-hint">표시된 문장에 숫자가 없어요. 면접에서 바로 되물리는 자리입니다.</p>
                  )}
                  {section.blocks.some(b => b.metric) && (
                    <div className="sec-metrics">
                      {[...new Set(section.blocks.filter(b => b.metric).map(b => b.metric))].map(m => (
                        <span className="metric-chip" key={m}>{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="card no-print">
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

            <aside className="no-print">
              <div className="side-card">
                <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.8 4.4L18 9l-4.2 1.6L12 15l-1.8-4.4L6 9l4.2-1.6z"/></svg>AI 보정</h3>
                <select className="tool-target" aria-label="보정할 섹션" value={target} onChange={e => setTarget(e.target.value)}>
                  {sections.map(s => <option key={s.key} value={s.key}>{s.title}</option>)}
                </select>
                <div className="ai-tools">
                  <button className="btn btn-secondary btn-xs" onClick={() => applyTool('polish')}>문장 다듬기</button>
                  <button className="btn btn-secondary btn-xs" onClick={() => applyTool('compress')}>압축</button>
                  <button className="btn btn-secondary btn-xs" onClick={() => applyTool('expand')}>근거 확장</button>
                </div>
                <p className="tool-note">‘근거 확장’은 새 사실을 지어내지 않고, 프로필에 저장된 정량 성과만 덧붙여요.</p>
              </div>

              <div className="side-card">
                <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>반영 현황</h3>
                <div className="kw-progress-label"><span>JD 키워드</span><span className="num" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>{kwPercent}%</span></div>
                <div className="coverage-bar"><div className="coverage-bar-fill" style={{ width: `${kwPercent}%` }}></div></div>
                <div className="kw-progress-label" style={{ marginTop: 12 }}><span>정량 근거</span><span className="num" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>{metricBlocks}%</span></div>
                <div className="coverage-bar"><div className="coverage-bar-fill quant" style={{ width: `${metricBlocks}%` }}></div></div>
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
                {initial.matchPoints.length ? initial.matchPoints.map(mp => (
                  <div className="evidence-item" key={mp.text}>
                    <div className="ev-text">&ldquo;{mp.text}&rdquo;</div>
                    <div className="ev-src">근거 · {mp.source}</div>
                    {mp.metric && <div className="ev-metric">{mp.metric}</div>}
                  </div>
                )) : (
                  <p className="tool-note">아직 수치로 정리된 성과가 없어요. <Link to="/profile">프로필에서 채우기</Link></p>
                )}
              </div>

              <div className="side-card">
                <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5M12 7v5l4 2"/></svg>변경 이력</h3>
                {undoStack.length ? undoStack.map((h, i) => (
                  <div className="history-item" key={h.label + i}>
                    <div><div className="hi-what">{h.label}</div><div className="hi-when">{h.when}</div></div>
                    <button type="button" className="history-undo" onClick={() => undo(i)}>되돌리기</button>
                  </div>
                )) : (
                  <p className="tool-note">아직 변경한 내용이 없어요.</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Toast show={toast.show} message={toast.message} />
    </div>
  );
}
