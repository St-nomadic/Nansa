/* NANSA seed data — carried over from the NANSA standalone mockup.
   Used only on first launch; afterwards everything lives in localStorage. */
(function (global) {
  'use strict';

  const SEED_JOBS = [
    {
      id: 'job-1', company: '토스뱅크', title: '백엔드 엔지니어', location: '서울 강남구',
      deadline: '2026-07-25', logoColor: '#0064FF', logoText: '토스',
      applyUrl: 'https://toss.im/career/jobs',
      duties: [
        '핵심 결제 시스템 API 설계 및 개발',
        '대용량 트래픽 처리를 위한 서버 아키텍처 개선',
        'MSA 환경에서의 서비스 간 통신 설계',
      ],
      requirements: [
        'Kotlin 또는 Java 기반 서버 개발 경력 3년 이상',
        'RDB 및 NoSQL 데이터베이스 설계 경험',
        'REST API 설계 및 개발 경험',
      ],
      preferred: ['금융 도메인 경험', 'Kubernetes 운영 경험', '대규모 트래픽 처리 경험'],
      skills: ['Kotlin', 'Spring Boot', 'MSA', 'Kubernetes', 'MySQL'],
      seniority: '미들 이상 (3년+)',
      bookmarked: true, createdAt: '2026-07-01T09:00:00.000Z',
    },
    {
      id: 'job-2', company: '컬리', title: '프로덕트 디자이너', location: '서울 송파구',
      deadline: '2026-07-18', logoColor: '#5F0080', logoText: '컬리',
      applyUrl: 'https://www.kurly.com/recruit',
      duties: [
        '신선식품 커머스 핵심 구매 여정 UX 설계',
        '디자인 시스템 고도화 및 컴포넌트 관리',
        '데이터 기반 UX 개선 실험 설계 및 검증',
      ],
      requirements: [
        '프로덕트 디자인 경력 3년 이상',
        'Figma 기반 협업 및 디자인 시스템 운영 경험',
        '정성/정량 리서치를 통한 의사결정 경험',
      ],
      preferred: ['커머스 도메인 경험', 'A/B 테스트 설계 경험'],
      skills: ['Figma', 'Design System', 'UX Research', 'Prototyping'],
      seniority: '미들 이상 (3년+)',
      bookmarked: false, createdAt: '2026-07-03T09:00:00.000Z',
    },
    {
      id: 'job-3', company: '뱅크샐러드', title: '그로스 마케터', location: '서울 성동구',
      deadline: '2026-08-02', logoColor: '#FFC800', logoText: '뱅샐',
      applyUrl: 'https://banksalad.com/careers',
      duties: [
        '퍼포먼스 마케팅 캠페인 기획 및 운영',
        '사용자 획득/리텐션 지표 분석 및 개선',
        '신규 채널 발굴 및 실험 설계',
      ],
      requirements: [
        '그로스/퍼포먼스 마케팅 경력 2년 이상',
        'GA4, Amplitude 등 데이터 분석 툴 활용 경험',
        'SQL 기본 활용 가능',
      ],
      preferred: ['핀테크 서비스 마케팅 경험', '콘텐츠 마케팅 경험'],
      skills: ['Growth', 'SQL', 'GA4', 'Amplitude'],
      seniority: '주니어 이상 (2년+)',
      bookmarked: false, createdAt: '2026-07-05T09:00:00.000Z',
    },
  ];

  const SEED_PROFILE = {
    name: '김나사',
    email: 'nansa.kim@example.com',
    phone: '010-1234-5678',
    title: '백엔드 엔지니어 지망',
    summary: '3년차 서버 개발자로 결제/정산 도메인에서 안정적인 API를 설계해왔습니다.',
    links: [
      { id: 'link-1', label: 'GitHub', url: 'https://github.com/nansa-kim' },
    ],
    experiences: [
      {
        id: 'exp-1', company: '핀테크스타트업', role: '백엔드 개발자', period: '2022.03 - 2026.06',
        tags: ['백엔드', '핀테크', 'Kotlin'],
        bullets: [
          '월 200만 건 결제 트랜잭션 처리 API 설계 및 운영',
          'MSA 전환 프로젝트 리드, 응답속도 40% 개선',
          'Kubernetes 기반 배포 파이프라인 구축',
        ],
      },
      {
        id: 'exp-2', company: '테크컴퍼니', role: '서버 개발 인턴', period: '2021.07 - 2021.12',
        tags: ['백엔드', '인턴'],
        bullets: [
          '내부 어드민 툴 API 개발',
          'MySQL 스키마 설계 보조',
        ],
      },
    ],
    skills: ['Kotlin', 'Spring Boot', 'MySQL', 'AWS', 'Kubernetes'],
  };

  const SEED_APPLICATIONS = [
    {
      id: 'app-1', jobId: 'job-1', status: '서류', appliedAt: '2026-07-02', note: '',
      snapshotDocIds: [],
      timeline: [
        { date: '2026-07-02', label: '지원 완료' },
        { date: '2026-07-05', label: '서류 검토 시작' },
      ],
    },
  ];

  global.NANSA_SEED = {
    jobs: SEED_JOBS,
    profile: SEED_PROFILE,
    applications: SEED_APPLICATIONS,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.NANSA_SEED;
})(typeof window !== 'undefined' ? window : globalThis);
