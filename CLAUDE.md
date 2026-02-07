# 프로젝트: 여의도한끼

## 기술 스택
- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui + Radix UI
- Capacitor (iOS 앱)
- MongoDB Atlas
- Vercel 배포

## 디자인 시스템
- 폰트: Pretendard (한글) + Geist Sans (라틴)
- 아이콘: lucide-react v0.468
- 토스트: sonner (비블로킹 알림)
- 컬러: OKLCH 기반 CSS 변수, 레드 브랜드 (#dc2626)
- 터치 영역: NDS 40px 최소 기준
- 디자인 가이드: docs/design-guide.md 참조

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
- 맛집 데이터: src/data/yeouido-food.ts
- 추천 컴포넌트: src/components/recommendation-view.tsx
- API 라우트: src/app/api/
- DB 연결: src/lib/mongodb.ts
- Capacitor 설정: capacitor.config.ts
- 전역 스타일/테마: src/app/globals.css
- 레이아웃/폰트: src/app/layout.tsx
- UI 컴포넌트: src/components/ui/

## 주요 타입 정의
- Restaurant: { 이름, 카테고리, 평점, 특징[], 위치, place_id }
- WeatherData: { current, yesterday, comparison, recommendation }
- UserPreferences: { excludeTags[], favoriteCategories[] }

## 외부 API
- 날씨: Open-Meteo API (무료, API 키 불필요)
- 맛집 사진/리뷰: Google Places API
- 이미지 저장: Cloudinary
