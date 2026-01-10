# 여의도한끼

여의도 직장인을 위한 맛집 추천 웹 애플리케이션

## 주요 기능

- **맛집 검색** - 식당명, 빌딩, 음식, 도로명 통합 검색
- **카테고리 필터** - 한식, 양식, 중식, 일식, 동남아식
- **지역 필터** - 서여의도 / 동여의도
- **빌딩별 맛집** - IFC, 더현대, 미원빌딩 등
- **한끼추천** - 룰렛 돌리기, 취향 기반 추천
- **리뷰 시스템** - 별점, 사진 첨부, 식사 유형 선택

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Turso (SQLite)
- **External**: Google Places API, Cloudinary
- **Deploy**: Vercel

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인

## 환경 변수

```env
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GOOGLE_PLACES_API_KEY=
```

## 배포

```bash
# Vercel 배포
npx vercel --prod

# 캐시 무시 강제 배포
npx vercel --prod --force
```

## 문서

- [아키텍처](docs/architecture.md) - 프로젝트 구조 및 기술 스택
- [트러블슈팅](docs/troubleshooting.md) - 문제 해결 가이드

## 라이선스

MIT
