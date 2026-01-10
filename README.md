# 여의도한끼

여의도 직장인을 위한 맛집 추천 웹 애플리케이션

🔗 **Live**: https://yeouido-food.vercel.app

## 주요 기능

- **맛집 검색** - 식당명, 빌딩, 음식, 도로명 통합 검색
- **카테고리 필터** - 한식, 양식, 중식, 일식, 동남아식
- **지역 필터** - 서여의도 / 동여의도
- **빌딩별 맛집** - IFC, 전경련회관, 파크원타워 등 40+ 빌딩
- **한끼추천** - 룰렛 돌리기, 취향 기반 추천
- **리뷰 시스템** - 별점, 사진 첨부, 식사 유형 선택

## 데이터 현황

| 항목 | 개수 |
|------|------|
| 전체 식당 | 330개 |
| 한식 | 164개 |
| 양식 | 62개 |
| 중식 | 34개 |
| 일식 | 51개 |
| 동남아식 | 19개 |
| 빌딩 정보 | 100% |

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas
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
# MongoDB
MONGODB_URI=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google Places API
GOOGLE_PLACES_API_NEW_KEY=
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=

# Auth
JWT_SECRET=
ADMIN_SECRET_KEY=
```

## 데이터 동기화

```bash
# 정적 데이터 → MongoDB 동기화
node scripts/sync-restaurants-v2.mjs

# Google Places API로 건물 정보 수집
node scripts/fetch-building-info.mjs

# 수동 조사한 건물 정보 업데이트
node scripts/manual-building-update.mjs
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
