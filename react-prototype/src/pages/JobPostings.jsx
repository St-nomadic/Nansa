import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Toast from '../components/Toast.jsx';
import useToast from '../hooks/useToast.js';
import { IconPlus } from '../components/icons.jsx';
import { addJob, analyzeJdText, getJobs, scheduleLabel, STATUS } from '../data/nansa.js';
import './JobPostings.css';

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (e) {
    return '';
  }
}

export default function JobPostings() {
  const [tab, setTab] = useState('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState(() => getJobs());
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  function switchTab(next) {
    setTab(next);
    setError('');
  }

  function pickFile(f) {
    if (!f) return;
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) {
      setError('PDF 파일만 올릴 수 있어요.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('파일이 너무 커요. 10MB 이하 PDF만 올릴 수 있어요.');
      return;
    }
    setError('');
    setFile(f);
  }

  function validate() {
    if (tab === 'url') {
      const v = url.trim();
      if (!v) return '공고 URL을 입력해 주세요.';
      if (!/^https?:\/\/.+\..+/.test(v)) return 'http:// 또는 https:// 로 시작하는 올바른 주소를 입력해 주세요.';
      return '';
    }
    if (tab === 'text') {
      const v = text.trim();
      if (!v) return '공고 본문을 붙여넣어 주세요.';
      if (v.length < 30) return '내용이 너무 짧아요. 공고 전문을 붙여넣어 주세요. (30자 이상)';
      return '';
    }
    if (!file) return 'PDF 파일을 선택해 주세요.';
    return '';
  }

  function submit() {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    let payload;
    if (tab === 'url') {
      const host = hostOf(url.trim());
      payload = {
        company: host || '직접 등록한 공고',
        companyEn: host,
        title: '분석 대기 중인 공고',
        source: { kind: 'url', value: url.trim() },
        rawJd: null,
      };
    } else if (tab === 'text') {
      const parsed = analyzeJdText(text);
      const firstLine = text.trim().split('\n').find(l => l.trim() && !/^\[/.test(l.trim())) || '붙여넣은 공고';
      payload = {
        company: '직접 등록한 공고',
        title: firstLine.trim().slice(0, 40),
        source: { kind: 'text', value: '본문 직접 입력' },
        rawJd: text.trim(),
        analysis: parsed ? parsed.analysis : null,
        keywords: parsed ? parsed.keywords : [],
      };
    } else {
      payload = {
        company: '직접 등록한 공고',
        title: file.name.replace(/\.pdf$/i, '').slice(0, 40),
        source: { kind: 'pdf', value: file.name },
        rawJd: null,
      };
    }

    const created = addJob(payload);
    setJobs(getJobs());
    setUrl('');
    setText('');
    setFile(null);
    showToast('공고를 등록했어요');
    navigate('/jobs/' + created.id);
  }

  return (
    <div className="app-shell">
      <Sidebar active="jobs" />
      <div className="main page-jobs">
        <header className="topbar">
          <h1>채용 공고</h1>
        </header>

        <div className="content">
          <section className="card new-post-card">
            <div className="new-post-head">
              <div className="np-mark"><IconPlus strokeWidth="1.8" width={undefined} height={undefined} /></div>
              <div>
                <h2>새 채용 공고 등록</h2>
                <p>공고를 등록하면 요건을 분석하고 맞춤 서류를 만들 수 있어요.</p>
              </div>
            </div>
            <div className="tabs" role="tablist">
              <button className={`tab-btn${tab === 'url' ? ' active' : ''}`} onClick={() => switchTab('url')}>URL</button>
              <button className={`tab-btn${tab === 'text' ? ' active' : ''}`} onClick={() => switchTab('text')}>텍스트</button>
              <button className={`tab-btn${tab === 'pdf' ? ' active' : ''}`} onClick={() => switchTab('pdf')}>PDF 업로드</button>
            </div>

            <div className={`tab-panel${tab === 'url' ? ' active' : ''}`}>
              <div className="field">
                <label htmlFor="job-url">공고 URL</label>
                <input
                  className={`input${error && tab === 'url' ? ' has-error' : ''}`}
                  id="job-url"
                  type="url"
                  value={url}
                  onChange={e => { setUrl(e.target.value); if (error) setError(''); }}
                  placeholder="https://careers.example.com/jobs/1234"
                  aria-invalid={Boolean(error && tab === 'url')}
                />
              </div>
            </div>

            <div className={`tab-panel${tab === 'text' ? ' active' : ''}`}>
              <div className="field">
                <label htmlFor="job-text">공고 본문 붙여넣기</label>
                <textarea
                  className={`textarea${error && tab === 'text' ? ' has-error' : ''}`}
                  id="job-text"
                  value={text}
                  onChange={e => { setText(e.target.value); if (error) setError(''); }}
                  placeholder="채용 공고 전문을 붙여넣으세요"
                  aria-invalid={Boolean(error && tab === 'text')}
                ></textarea>
                <p className="field-hint">[담당 업무] / [자격 요건] / [우대 사항] 형태로 붙여넣으면 요건을 자동으로 나눠 분석해요.</p>
              </div>
            </div>

            <div className={`tab-panel${tab === 'pdf' ? ' active' : ''}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="visually-hidden-file"
                onChange={e => pickFile(e.target.files && e.target.files[0])}
              />
              <button
                type="button"
                className={`upload-zone${file ? ' has-file' : ''}${error && tab === 'pdf' ? ' has-error' : ''}`}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); pickFile(e.dataTransfer.files && e.dataTransfer.files[0]); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                {file ? file.name : 'PDF 파일을 드래그하거나 클릭해서 업로드'}
              </button>
              {file && (
                <button type="button" className="file-clear" onClick={() => setFile(null)}>선택 취소</button>
              )}
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="new-post-foot">
              <button className="btn btn-primary" onClick={submit}>등록하고 분석하기</button>
            </div>
          </section>

          <section className="section-gap" style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>최근 등록한 공고</h2>
            <div className="card" style={{ padding: '8px 20px' }}>
              {jobs.map(job => (
                <div className="job-row" key={job.id}>
                  <div className="job-main">
                    <div className="job-company">{job.company}</div>
                    <div className="job-title">{job.title}</div>
                  </div>
                  <span className={`badge ${STATUS[job.status].badge}`}>{STATUS[job.status].label}</span>
                  <span className="job-deadline">{scheduleLabel(job)}</span>
                  <Link className="btn btn-secondary btn-xs" to={`/jobs/${job.id}`}>상세 보기</Link>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <Toast show={toast.show} message={toast.message} />
    </div>
  );
}
