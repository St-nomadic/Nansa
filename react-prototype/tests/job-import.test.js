import test from 'node:test';
import assert from 'node:assert/strict';
import { extractJob, publicAddress, resolveTarget } from '../server/job-import.js';
import { analyzeJdText } from '../src/data/nansa.js';
import handler from '../api/import-job.js';
const description = '<h2>담당 업무</h2><p>React와 TypeScript를 활용한 웹 서비스 개발과 사용자 경험 개선을 담당합니다.</p><h2>자격 요건</h2><p>React 개발 경력 3년 이상이며 팀원들과 원활하게 협업할 수 있는 분을 찾습니다.</p><h2>우대 사항</h2><p>테스트 코드 작성 및 성능 최적화 경험이 있는 분을 우대합니다.</p>';
test('structured job metadata and requirement buckets', () => {
 const result = extractJob(`<script type="application/ld+json">${JSON.stringify({'@graph':[{'@type':'JobPosting',title:'프론트엔드 개발자',hiringOrganization:{name:'테스트 회사'},description}]})}</script>`, 'https://example.com/jobs/1');
 assert.equal(result.company,'테스트 회사');
 const parsed = analyzeJdText(result.rawJd);
 assert.match(parsed.analysis.req.join(' '),/3년/);
 assert.match(parsed.analysis.plus.join(' '),/최적화/);
 assert.ok(parsed.keywords.some(k=>k.name==='React'));
});
test('HTML extraction removes navigation and scripts', () => {
 const result=extractJob(`<nav>제거할 메뉴</nav><main><h1>개발자 채용</h1>${description}<script>alert(1)</script></main>`,'https://example.com');
 assert.equal(result.title,'개발자 채용');assert.doesNotMatch(result.rawJd,/제거할 메뉴|alert/);
});
test('blocked and empty pages fail instead of registering placeholders',()=>{
 assert.throws(()=>extractJob('<main>Please log in</main>','https://example.com'));
});
test('reject internal addresses including mapped IPv6 and encoded loopback',async()=>{
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','::1','::ffff:127.0.0.1','fc00::1','192.168.1.1']) assert.equal(publicAddress(ip),false,ip);
 assert.equal(publicAddress('8.8.8.8'),true);
 for(const url of ['http://2130706433','http://[::1]','file:///etc/passwd','https://user:pass@example.com','http://example.com:8080']) await assert.rejects(resolveTarget(url));
 await assert.rejects(resolveTarget('https://example.com',async()=>[{address:'127.0.0.1',family:4}]));
});
test('API method and malformed URL validation',async()=>{
 const res={setHeader(){},status(n){this.code=n;return this;},json(body){this.body=body;return this;}};
 await handler({method:'GET'},res);assert.equal(res.code,405);
 await handler({method:'POST',body:{}},res);assert.equal(res.code,400);
 await handler({method:'POST',body:{url:'http://127.0.0.1'}},res);assert.equal(res.code,422);
});
