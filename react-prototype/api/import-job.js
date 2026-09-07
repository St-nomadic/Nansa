import { extractJob, fetchHtml } from '../server/job-import.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'POST 요청만 지원합니다.' }); }
  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch { return res.status(400).json({ error: '올바른 URL을 입력해 주세요.' }); }
  if (typeof body?.url !== 'string' || body.url.length > 2048) return res.status(400).json({ error: '올바른 URL을 입력해 주세요.' });
  try {
    const html = await fetchHtml(body.url);
    return res.status(200).json(extractJob(html, body.url));
  } catch (error) {
    const message = /[가-힣]/.test(error.message) ? error.message : '공고 사이트에 연결하지 못했어요. 본문을 직접 붙여넣어 주세요.';
    return res.status(422).json({ error: message });
  }
}
