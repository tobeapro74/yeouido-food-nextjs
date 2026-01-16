# 프로젝트: 여의도한끼

## 기술 스택
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Capacitor (iOS 앱)
- MongoDB Atlas
- Vercel 배포

## 개발 명령어
- `npm run dev` - 로컬 개발 서버 (localhost:3000)
- `npm run build` - 프로덕션 빌드
- `npm run lint` - ESLint 검사

## iOS 앱 관련
- `npx cap sync ios` - 웹 빌드를 iOS 프로젝트에 동기화
- `npx cap open ios` - Xcode에서 프로젝트 열기

## 배포
- main 브랜치 push → Vercel 자동 배포
- iOS 앱은 Vercel URL 로드 (capacitor.config.ts에서 설정)
- 코드 수정 후 Vercel 배포만 하면 앱 rebuild 불필요

## 주요 파일 위치
- 맛집 데이터: src/data/restaurants.ts
- 추천 컴포넌트: src/components/recommendation-view.tsx
- API 라우트: src/app/api/
- DB 연결: src/lib/mongodb.ts
- Capacitor 설정: capacitor.config.ts

## 주요 타입 정의
- Restaurant: { 이름, 카테고리, 평점, 특징[], 위치, place_id }
- WeatherData: { current, yesterday, comparison, recommendation }
- UserPreferences: { excludeTags[], favoriteCategories[] }

## 외부 API
- 날씨: Open-Meteo API (무료, API 키 불필요)
- 맛집 사진/리뷰: Google Places API
- 이미지 저장: Cloudinary
