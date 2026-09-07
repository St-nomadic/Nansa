import { lookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import ipaddr from 'ipaddr.js';
import { load } from 'cheerio';

export function publicAddress(address) {
  try { return ipaddr.process(address).range() === 'unicast'; } catch { return false; }
}

export async function resolveTarget(value, resolver = lookup) {
  let url;
  try { url = new URL(value); } catch { throw new Error('올바른 공고 URL을 입력해 주세요.'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) {
    throw new Error('공개된 http 또는 https 공고 주소를 입력해 주세요.');
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = ipaddr.isValid(hostname)
    ? [{ address: hostname, family: ipaddr.parse(hostname).kind() === 'ipv6' ? 6 : 4 }]
    : await resolver(hostname, { all: true });
  if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw new Error('공개된 채용 사이트 주소만 가져올 수 있어요.');
  return { url, address: addresses[0] };
}

export async function fetchHtml(value, { signal = AbortSignal.timeout(12000), redirects = 0 } = {}) {
  const { url, address } = await resolveTarget(value);
  if (signal.aborted) throw new Error('공고 사이트의 응답이 늦어요. 본문을 직접 붙여넣어 주세요.');
  const response = await new Promise((resolve, reject) => {
    const req = (url.protocol === 'https:' ? https : http).get(url, {
      signal,
      headers: { 'User-Agent': 'NansaJobImporter/1.0', Accept: 'text/html,application/xhtml+xml', 'Accept-Encoding': 'identity' },
      lookup: (_host, options, callback) => options.all ? callback(null, [address]) : callback(null, address.address, address.family),
    }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        res.resume(); resolve({ location: res.headers.location }); return;
      }
      if (res.statusCode !== 200 || !/text\/html|application\/xhtml\+xml/i.test(res.headers['content-type'] || '')) {
        res.resume(); reject(new Error('사이트에서 공고 본문을 읽을 수 없어요. 본문을 직접 붙여넣어 주세요.')); return;
      }
      const chunks = []; let size = 0;
      res.on('data', chunk => {
        size += chunk.length;
        if (size > 2 * 1024 * 1024) { res.destroy(new Error('공고 페이지가 너무 커요. 본문을 직접 붙여넣어 주세요.')); return; }
        chunks.push(chunk);
      });
      res.on('error', reject);
      res.on('end', () => {
        const charset = /charset=([^;\s]+)/i.exec(res.headers['content-type'] || '')?.[1] || 'utf-8';
        try { resolve({ html: new TextDecoder(charset).decode(Buffer.concat(chunks)) }); }
        catch { reject(new Error('공고 문자를 읽을 수 없어요. 본문을 직접 붙여넣어 주세요.')); }
      });
    });
    req.on('error', reject);
  });
  if ('location' in response) {
    if (!response.location || redirects >= 4) throw new Error('공고 주소가 너무 많이 이동해요. 최종 공고 주소를 입력해 주세요.');
    return fetchHtml(new URL(response.location, url).href, { signal, redirects: redirects + 1 });
  }
  return response.html;
}

function plain(html) {
  const $ = load(html || '');
  $('script,style,nav,header,footer,form,button,noscript,svg,iframe,[hidden]').remove();
  $('br').replaceWith('\n');
  $('p,div,li,section,article,h1,h2,h3,h4,tr').each((_, el) => { $(el).append('\n'); });
  return $.root().text().split('\n').map(s => s.replace(/[\t \u00a0]+/g, ' ').trim()).filter(Boolean).join('\n');
}
function findJob(value, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 15) return null;
  if ([value['@type']].flat().includes('JobPosting')) return value;
  for (const child of Object.values(value)) { const found = findJob(child, depth + 1); if (found) return found; }
  return null;
}
export function extractJob(html, url) {
  const $ = load(html); let job;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (job) return;
    try { job = findJob(JSON.parse($(el).text())); } catch { /* Try the next structured record. */ }
  });
  const parts = job ? [plain(job.description), ...[['responsibilities', '담당 업무'], ['qualifications', '자격 요건'], ['experienceRequirements', '자격 요건'], ['skills', '우대 사항']].flatMap(([key, heading]) => typeof job[key] === 'string' ? [`[${heading}]`, plain(job[key])] : [])] : [];
  const rawJd = (job ? parts.join('\n') : plain(($('main').first().length ? $('main').first() : $('article').first().length ? $('article').first() : $('body')).html()))
    .split('\n').map(line => /^(담당\s*업무|주요\s*업무|자격\s*요건|지원\s*자격|필수\s*요건|우대\s*사항|responsibilities|requirements|qualifications|preferred qualifications)\s*[:：]?$/i.test(line) ? `[${line.replace(/[:：]$/, '')}]` : line).join('\n');
  if (rawJd.length < 100 || rawJd.length > 60000 || (!job && !/자격|채용|우대|담당|주요\s*업무|responsibilit|qualification|requirements/i.test(rawJd))) {
    throw new Error('공고 본문을 찾지 못했어요. 로그인이나 화면 로딩이 필요한 공고는 본문을 직접 붙여넣어 주세요.');
  }
  return { title: plain(typeof job?.title === 'string' ? job.title : $('h1').first().text() || $('title').text()).slice(0, 150) || '등록한 공고', company: (typeof job?.hiringOrganization?.name === 'string' ? job.hiringOrganization.name : new URL(url).hostname).slice(0, 100), rawJd };
}
