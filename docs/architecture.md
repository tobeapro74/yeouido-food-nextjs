# 여의도 한끼 - 아키텍처 문서

## 프로젝트 개요

여의도 직장인을 위한 맛집 추천 웹 애플리케이션입니다.

## 기술 스택

### Frontend
- **Next.js 16** - App Router 사용
- **React 19** - 최신 React 기능 활용
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **shadcn/ui** - UI 컴포넌트 라이브러리
- **Lucide React** - 아이콘

### Backend
- **Next.js API Routes** - 서버리스 API
- **Turso (libSQL)** - SQLite 기반 엣지 데이터베이스
- **Cloudinary** - 이미지 업로드/저장

### External APIs
- **Google Places API** - 식당 사진 및 영업 상태 조회

### Deployment
- **Vercel** - 호스팅 및 CI/CD

## 디렉토리 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   │   ├── auth/          # 인증 API (login, logout, register, me, change-password)
│   │   ├── reviews/       # 리뷰 CRUD API
│   │   ├── place-photo/   # Google Places 사진 API
│   │   └── upload/        # Cloudinary 이미지 업로드
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 페이지
│   └── globals.css        # 전역 스타일
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 기본 컴포넌트
│   ├── auth-modal.tsx    # 로그인/회원가입 모달
│   ├── change-password-modal.tsx # 비밀번호 변경 모달
│   ├── bottom-nav.tsx    # 하단 네비게이션
│   ├── building-sheet.tsx # 빌딩 선택 시트
│   ├── category-sheet.tsx # 카테고리 선택 시트
│   ├── preference-settings.tsx # 취향 설정
│   ├── recommendation-view.tsx # 한끼추천 뷰
│   ├── restaurant-card.tsx # 맛집 카드
│   ├── restaurant-detail.tsx # 맛집 상세
│   ├── restaurant-list.tsx # 맛집 리스트
│   ├── review-modal.tsx  # 리뷰 작성 모달
│   ├── roulette-wheel.tsx # 룰렛 휠 컴포넌트
│   └── search-bar.tsx    # 통합 검색 바
├── data/
│   └── yeouido-food.ts   # 맛집 정적 데이터 (180+ 식당)
└── lib/
    ├── db.ts             # Turso 데이터베이스 연결
    └── utils.ts          # 유틸리티 함수
```

## 데이터 흐름

### 맛집 데이터
```
yeouido-food.ts (정적 데이터)
    ↓
getPopularRestaurants() / getRestaurantsByCategory() 등
    ↓
RestaurantCard / RestaurantList 컴포넌트
    ↓
Google Places API (사진/영업상태 조회)
```

### 리뷰 데이터
```
ReviewModal (사용자 입력)
    ↓
/api/upload (이미지 → Cloudinary)
    ↓
/api/reviews (리뷰 → Turso DB)
    ↓
RestaurantDetail (리뷰 표시)
```

### 인증 흐름
```
AuthModal (로그인/회원가입)
    ↓
/api/auth/* (JWT 쿠키 기반)
    ↓
/api/auth/me (인증 상태 확인)
```

### 비밀번호 변경 흐름
```
사용자 메뉴 (헤더 프로필 버튼)
    ↓
ChangePasswordModal (현재/새 비밀번호 입력)
    ↓
/api/auth/change-password (비밀번호 검증 및 업데이트)
    ↓
MongoDB users 컬렉션 업데이트
```

## 주요 기능

### 1. 홈 화면
- 헤더 (타이틀, 사용자 메뉴 드롭다운)
- 통합 검색 바 (헤더 아래 메인 콘텐츠 영역 상단에 위치)
  - 식당, 빌딩, 음식, 도로명 검색 지원
  - 실시간 자동완성 드롭다운
- 카테고리 퀵 버튼 (한식, 양식, 중식, 일식, 동남아식)
- 인기 맛집 카드 (카테고리별 최고 평점)
- 지역별 맛집 (서여의도/동여의도)

### 2. 통합 검색
- 식당 이름 검색 (예: "김삼보", "딘타이펑")
- 빌딩명 검색 (예: "IFC", "미원빌딩")
- 음식/특징 검색 (예: "삼계탕", "파스타")
- 도로명 검색 (예: "국제금융로", "여의대로")
- 점수 기반 결과 정렬

### 3. 한끼추천
- 룰렛 돌리기 (랜덤 추천)
- 취향 설정 (카테고리, 지역, 빌딩 필터)
- 개인화 추천

### 4. 필터 시스템
- 카테고리별 필터
- 지역별 필터 (서여의도/동여의도)
- 빌딩별 필터 (IFC, 더현대, 미원빌딩 등)

### 5. 리뷰 시스템
- 별점 (전체, 음식, 서비스, 분위기)
- 사진 첨부 (최대 4장, iOS Safari 호환)
- 식사 유형 선택

### 6. 사용자 계정 관리
- 로그인/회원가입 (이메일, 비밀번호)
- 비밀번호 변경 (현재 비밀번호 확인 필수)
- 사용자 메뉴 드롭다운 (프로필 버튼 클릭 시)

## 성능 최적화

### 이미지 최적화
- 업로드 시 800px로 리사이즈
- JPEG 품질 60%로 압축
- URL.createObjectURL 사용 (iOS Safari 호환)

### 캐싱
- Google Places 사진 URL 메모리 캐시
- 폐업/휴업 상태 캐시

### 렌더링
- 폐업 식당 자동 필터링 (return null)
- Lazy loading 이미지

## 환경 변수

```env
# Database
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google
GOOGLE_PLACES_API_KEY=
```

## 배포

Vercel을 통한 자동 배포:
1. GitHub main 브랜치 push
2. Vercel 자동 빌드
3. 프로덕션 배포

수동 배포:
```bash
npx vercel --prod --force
```
