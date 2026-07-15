/* NANSA exporter — F-RMKTNY / F-QXWFUB (내보내기: PDF / DOCX(워드 호환) / 텍스트 복사)
   Static MVP without libraries:
   - PDF: print-styled popup + browser "PDF로 저장" (S-LRLOBQ)
   - DOCX: Word-compatible HTML(.doc) Blob download (S-QNSVBL)
   - PPTX: 미지원 — 제출 단계에서 가이드로 안내 (S-YVVFWV는 후속 범위)
*/
(function (global) {
  'use strict';

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function docHtml(docName, headerLines, sections) {
    const header = headerLines
      .filter(Boolean)
      .map((l, i) => (i === 0
        ? `<h1 style="font-size:22pt;margin:0 0 4pt;">${escapeHtml(l)}</h1>`
        : `<p style="margin:0;color:#555;font-size:10pt;">${escapeHtml(l)}</p>`))
      .join('\n');
    const body = sections.map((sec) => `
      <h2 style="font-size:13pt;margin:16pt 0 6pt;border-bottom:1px solid #ddd;padding-bottom:3pt;">${escapeHtml(sec.title)}</h2>
      <p style="font-size:11pt;line-height:1.7;margin:0;white-space:pre-wrap;">${escapeHtml(sec.body)}</p>
    `).join('\n');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(docName)}</title></head>
<body style="font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;max-width:680px;margin:24pt auto;padding:0 16pt;">
${header}
${body}
</body></html>`;
  }

  // S-QNSVBL: Word opens HTML saved with a .doc extension natively.
  function exportDoc(docName, headerLines, sections) {
    const html = docHtml(docName, headerLines, sections);
    const blob = new Blob(['﻿', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = docName + '.doc';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // S-LRLOBQ: open a printable window; the browser print dialog offers "PDF로 저장".
  function exportPdf(docName, headerLines, sections) {
    const win = window.open('', '_blank');
    if (!win) return false;
    win.document.write(docHtml(docName, headerLines, sections));
    win.document.close();
    win.document.title = docName;
    win.focus();
    setTimeout(() => win.print(), 250);
    return true;
  }

  // S-WHBZAJ: clipboard copy for paste-based application forms.
  function copyText(sections) {
    const text = sections.map((s) => `[${s.title}]\n${s.body}`).join('\n\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  global.NansaExporter = { exportDoc, exportPdf, copyText, docHtml, escapeHtml };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.NansaExporter;
})(typeof window !== 'undefined' ? window : globalThis);
