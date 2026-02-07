---
description: 여의도 한끼 - 여의도 직장인 맛집 추천 앱 프로젝트 분석
globs:
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "src/data/*.ts"
alwaysApply: true
---

# 여의도 한끼 프로젝트 개요

## 프로젝트 정보

- **이름**: 여의도 한끼
- **웹 URL**: https://yeouido-food.vercel.app
- **iOS 앱**: App Store 심사 중 (2026.01.15 제출)
- **GitHub**: https://github.com/tobeapro74/yeouido-food-nextjs
- **기술 스택**: Next.js 16, React 19, TypeScript, Tailwind CSS, MongoDB, Cloudinary, Capacitor (iOS)

## 핵심 파일 구조

### 메인 페이지
- `src/app/page.tsx` - 메인 SPA 페이지 (홈, 리스트, 상세, 추천 뷰 관리)

### 데이터
- `src/data/yeouido-food.ts` - 195개 식당 정적 데이터
  - 카테고리: 한식, 양식, 중식, 일식, 동남아식
  - 지역: 서여의도, 동여의도
  - 빌딩: 23곳 (동여의도 17곳, 서여의도 6곳)

### 주요 컴포넌트
- `src/components/search-bar.tsx` - 통합 검색 (식당, 빌딩, 음식, 도로명)
- `src/components/restaurant-card.tsx` - 맛집 카드 (Google Places API 연동)
- `src/components/restaurant-detail.tsx` - 맛집 상세 페이지
- `src/components/recommendation-view.tsx` - 한끼추천 (룰렛, 취향설정)
- `src/components/review-modal.tsx` - 리뷰 작성 (이미지 리사이즈)
- `src/components/review-section.tsx` - 리뷰 섹션 (식당 상세용)
- `src/components/building-sheet.tsx` - 빌딩 선택 (지역별 탭)
- `src/components/fortune-modal.tsx` - 운세 입력 모달 (생년월일/성별/결혼여부)
- `src/components/fortune-result.tsx` - 운세 결과 화면
- `src/components/change-password-modal.tsx` - 비밀번호 변경 모달
- `src/components/popular-restaurants.tsx` - 인기 맛집 (배치 이미지 로딩)

### 훅 (Hooks)
- `src/hooks/useImageBatch.ts` - 이미지 배치 로딩 + 글로벌 캐시
- `src/hooks/useSwipeBack.ts` - 스와이프 뒤로가기 제스처

### 운세 시스템
- `src/lib/fortune.ts` - 오행 + 띠 기반 운세 계산 로직
  - 천간지지 오행 분석
  - 띠(12지지) 계산 및 성향 분석
  - 육합/충/삼합 관계 적용
  - 상생/상극 관계 계산
  - 길방(동/서) 추천
  - 오행별 음식 카테고리 매핑
  - 성별/결혼여부별 결과 차별화

### API 라우트
- `src/app/api/auth/*` - 인증 (로그인, 회원가입, 세션, 비밀번호 변경)
- `src/app/api/reviews/*` - 리뷰 CRUD
- `src/app/api/place-photo/` - Google Places 사진/영업상태 (개별)
- `src/app/api/place-photos/` - 배치 이미지 조회 (여러 개)
- `src/app/api/upload/` - Cloudinary 이미지 업로드
- `src/app/api/restaurant-buildings/*` - 빌딩별 식당 조회
- `src/app/api/restaurants/sync/` - 정적 데이터 → MongoDB 동기화

### 데이터베이스
- `src/lib/db.ts` - Turso (libSQL) 연결

## 주요 함수

### 데이터 조회
```typescript
getPopularRestaurants()      // 카테고리별 인기 맛집 (5개)
getRestaurantsByCategory()   // 카테고리별 필터
getRestaurantsByRegion()     // 지역별 필터
getRestaurantsByBuilding()   // 빌딩별 필터
getAllRestaurants()          // 전체 식당
searchRestaurants(query)     // 통합 검색 (이름, 빌딩, 음식, 주소)
```

### 운세 계산 (src/lib/fortune.ts)
```typescript
calculateFortune(birthYear, birthMonth, birthDay, gender, maritalStatus)  // 전체 운세 결과
getPersonElement(birthYear, birthMonth, birthDay)  // 본명 오행
getTodayElement()            // 오늘의 오행
getLuckyDirection(...)       // 길방 (동/서)
getLuckyFood(...)           // 추천 음식 카테고리
```

### 이미지 처리
```typescript
resizeImage(file, maxSize, quality)  // iOS Safari 호환 리사이즈
```

## 해결된 주요 이슈

1. **iOS Safari 이미지 업로드** - URL.createObjectURL 사용
2. **인기 맛집 중식 미표시** - 폐업 식당 데이터 정리
3. **빌딩 시트 스크롤** - 높이 계산 및 패딩 조정
4. **빌딩 선택 모달** - 실제 데이터에 있는 빌딩만 표시
5. **이미지 로딩 속도** - MongoDB 캐시로 재조회 시 즉시 반환
6. **룰렛 결과 불일치** - CSS 렌더링 오프셋 보정 (+150도)
7. **인기맛집 배치 로딩** - 개별 API 5회 → 배치 API 1회
8. **운세 화면 뒤로가기** - previousView === "fortune" 케이스 처리
9. **상세화면 운세탭 이동** - FortuneModal 렌더링 누락 수정

## 코딩 가이드라인

### 식당 추가
```typescript
{
  이름: "식당명",
  주소: "서울 영등포구 ...",
  특징: "특징 설명",
  지역: "동여의도" | "서여의도",
  카테고리: "한식" | "양식" | "중식" | "일식" | "동남아식",
  빌딩: "빌딩명",  // 선택
  평점: 4.0,
  리뷰수: 500,
  영업시간: "11:00-21:00",
  가격대: "10,000-20,000원"
}
```

### 빌딩 추가
```typescript
{ id: "빌딩명", name: "빌딩명", icon: "🏢", 지역: "동여의도" | "서여의도" }
```

### 배포
```bash
git add -A && git commit -m "feat: 내용" && git push origin main
npx vercel --prod --force  # 강제 재배포
```

## 환경 변수

```
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
GOOGLE_PLACES_API_KEY
```

## 참고 문서

- [아키텍처](../docs/architecture.md)
- [트러블슈팅](../docs/troubleshooting.md)
- [iOS 앱 배포 가이드](../docs/app%20distribution.md)
- [PRD](./prd-instruction.md)
- [실행 계획](./prd-execution.md)
