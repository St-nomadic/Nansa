# React 앱

- `npm run dev`: 프론트엔드 개발 서버
- `npx vercel dev`: URL 가져오기 API를 포함한 로컬 개발 서버 (기존 Vercel 프로젝트 연결 필요)
- `npm test`: URL 추출·분석 및 요청 검증 테스트
- `npm run build`: 배포 빌드

URL 등록은 `api/import-job.js`에서 공개 HTML을 가져오고, JobPosting 구조화 데이터 또는 main/article 본문을 추출해 기존 규칙 기반 분석기로 전달합니다. 로그인, 봇 차단, JavaScript 실행이 필요한 페이지는 본문 붙여넣기로 전환합니다. 사설 주소는 허용하지 않으며 리다이렉트마다 검증한 IP로 연결합니다. 응답 크기는 2MB, 요청 시간은 12초로 제한합니다.
