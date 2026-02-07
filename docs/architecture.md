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
- **MongoDB Atlas** - 클라우드 데이터베이스
- **Cloudinary** - 이미지 업로드/저장

### External APIs
- **Google Places API** - 식당 사진, 영업 상태, 건물 정보, 리뷰 조회

### Deployment
- **Vercel** - 호스팅 및 CI/CD

## 앱 아이콘

### 디자인 컨셉
- **여의도 금융가 스카이라인** - 63빌딩, IFC 트윈타워 등 랜드마크 실루엣
- **저녁 노을 그라데이션 배경** - 파란색 → 빨간색 그라데이션
- **밥그릇과 젓가락** - 맛집 앱 아이덴티티
- **"여의도한끼" 텍스트** - 앱 이름 표시

### 아이콘 파일
```
public/
├── icons/
│   ├── icon.svg          # 원본 SVG (512x512)
│   ├── icon-512.png      # PWA 아이콘 (512x512)
│   └── icon-192.png      # PWA 아이콘 (192x192)
├── apple-touch-icon.png  # iOS 홈화면 (180x180)
└── favicon-32x32.png     # 브라우저 탭 (32x32)
src/app/
└── favicon.ico           # 레거시 브라우저용 (32x32)
```

### 아이콘 생성 방법
```bash
# SVG → PNG 변환 (rsvg-convert 필요)
rsvg-convert -w 512 -h 512 icon.svg -o icon-512.png
rsvg-convert -w 192 -h 192 icon.svg -o icon-192.png
rsvg-convert -w 180 -h 180 icon.svg -o apple-touch-icon.png
rsvg-convert -w 32 -h 32 icon.svg -o favicon-32x32.png
```

## 디렉토리 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   │   ├── auth/          # 인증 API
│   │   │   ├── login/         # 로그인
│   │   │   ├── logout/        # 로그아웃
│   │   │   ├── register/      # 회원가입
│   │   │   ├── me/            # 현재 사용자 조회
│   │   │   ├── change-password/ # 비밀번호 변경
│   │   │   ├── send-verification/ # 이메일 인증 코드 발송
│   │   │   └── verify-code/   # 이메일 인증 코드 확인
│   │   ├── reviews/       # 리뷰 CRUD API
│   │   ├── place-photo/   # Google Places 사진 API (개별 조회)
│   │   ├── place-photos/  # 배치 이미지 API (여러 개 한 번에)
│   │   ├── google-reviews/  # Google 리뷰 API
│   │   │   ├── [name]/      # 식당별 리뷰 조회
│   │   │   └── clear-cache/ # 리뷰 캐시 삭제
│   │   ├── restaurant-buildings/ # 건물 정보 조회/관리 API
│   │   ├── restaurant-prices/   # 가격대/전화번호 조회 API
│   │   ├── restaurants/sync/  # 정적 데이터 → MongoDB 동기화 API
│   │   ├── custom-restaurants/ # 커스텀 맛집 CRUD API (GET/POST/PATCH/DELETE)
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
│   ├── popular-restaurants.tsx # 인기 맛집 섹션 (배치 로딩)
│   ├── preference-settings.tsx # 취향 설정
│   ├── recommendation-view.tsx # 한끼추천 뷰
│   ├── restaurant-card.tsx # 맛집 카드
│   ├── restaurant-detail.tsx # 맛집 상세
│   ├── restaurant-list.tsx # 맛집 리스트
│   ├── review-modal.tsx  # 리뷰 작성 모달
│   ├── review-section.tsx # 리뷰 섹션 (사용자 리뷰)
│   ├── google-reviews.tsx # Google 리뷰 표시 컴포넌트
│   ├── roulette-wheel.tsx # 룰렛 휠 컴포넌트
│   ├── search-bar.tsx    # 통합 검색 바
│   ├── fortune-modal.tsx # 운세 입력 모달
│   ├── fortune-result.tsx # 운세 결과 화면
│   ├── fortune-detail-modal.tsx # 운세 상세 해설 모달
│   ├── pull-to-refresh.tsx # Pull-to-Refresh 컴포넌트
│   ├── custom-restaurant-modal.tsx # 커스텀 맛집 등록 모달
│   └── category-edit-modal.tsx # 카테고리 수정 모달 (커스텀 맛집용)
├── data/
│   └── yeouido-food.ts   # 맛집 정적 데이터 (195개 식당)
├── hooks/
│   ├── useImageBatch.ts  # 이미지 배치 로딩 훅
│   └── useSwipeBack.ts   # 스와이프 뒤로가기 제스처 훅
└── lib/
    ├── mongodb.ts        # MongoDB 연결
    ├── fortune.ts        # 오행 운세 계산 로직
    ├── types.ts          # 공통 타입 정의
    └── utils.ts          # 유틸리티 함수

scripts/                   # 데이터 동기화 스크립트
├── sync-restaurants-v2.mjs      # 정적 데이터 → MongoDB 동기화
├── fetch-building-info.mjs      # Google API 건물 정보 수집
├── fetch-building-info-v2.mjs   # 개선된 건물 정보 수집
├── manual-building-update.mjs   # 수동 건물 정보 업데이트
└── restaurant-data.json         # 식당 데이터 JSON
```

## 데이터 흐름

### 맛집 데이터
```
yeouido-food.ts (정적 데이터, 195개)
    ↓
sync-restaurants-v2.mjs (동기화 스크립트)
    ↓
MongoDB Atlas (restaurants 컬렉션, 330개)
    ↓
RestaurantCard / RestaurantList 컴포넌트
    ↓
Google Places API (사진/영업상태 조회)
```

### 건물 정보 수집
```
Google Places API (containingPlaces)
    ↓
fetch-building-info.mjs (자동 수집)
    ↓
manual-building-update.mjs (수동 보완)
    ↓
MongoDB (restaurant_buildings 컬렉션)
    ↓
restaurants.building 필드 업데이트
```

### 리뷰 데이터
```
ReviewModal (사용자 입력)
    ↓
/api/upload (이미지 → Cloudinary)
    ↓
/api/reviews (리뷰 → MongoDB)
    ↓
RestaurantDetail (리뷰 표시)
```

### 인증 흐름
```
AuthModal (로그인/회원가입)
    ↓
[회원가입 시] /api/auth/send-verification (이메일 인증 코드 발송)
    ↓
[회원가입 시] /api/auth/verify-code (인증 코드 확인)
    ↓
/api/auth/register 또는 /api/auth/login (JWT 쿠키 기반)
    ↓
/api/auth/me (인증 상태 확인)
```

### 커스텀 맛집 데이터 흐름
```
CustomRestaurantModal (Google Places 검색)
    ↓
Google Places Text Search API (맛집 검색)
    ↓
Google Places Details API (상세 정보 조회)
    ↓
/api/custom-restaurants POST (MongoDB 저장)
    ↓
RestaurantDetail (커스텀 맛집 상세 표시)
    ↓
[가격대/전화번호/영업시간 표시]
    - 커스텀 맛집: custom_restaurants 컬렉션에서 직접 조회
    - 일반 맛집: /api/restaurant-prices API 호출
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

### Google 리뷰 흐름
```
RestaurantDetail (식당 상세 페이지)
    ↓
GoogleReviews 컴포넌트
    ↓
/api/google-reviews/[name] (API 호출)
    ↓
MongoDB 캐시 확인 (google_reviews_cache)
    ↓ (캐시 miss 또는 24시간 경과)
Google Places API (Place Details - reviews 필드)
    ↓
최신순 정렬 (time 필드 기준)
    ↓
MongoDB 캐시 저장 → 클라이언트 반환
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
- **기분별 추천**: 피곤해, 가볍게, 특별하게, 매콤하게, 국물땡김, 고기고기
- **룰렛 돌리기**: 카테고리 기반 랜덤 추천
- **취향 설정**: 카테고리, 지역, 가격대, 제외 태그 필터

#### 룰렛 휠 구현 (`roulette-wheel.tsx`)
```
섹션 레이아웃:
- 6개 섹션: 한식, 양식, 중식, 일식, 동남아, 랜덤
- CSS: origin-bottom-right + w-1/2 h-1/2 + skewY 변환
- 섹션 각도: 60도씩 (360 / 6)

결과 계산 방식:
1. 랜덤 회전 (5바퀴 + 랜덤 각도)
2. 회전 완료 후 최종 각도 정규화 (% 360)
3. 포인터(12시 = CSS 270도)가 어느 섹션 범위에 있는지 확인
4. 해당 섹션의 카테고리 반환
```

**핵심**: 결과를 미리 선택하지 않고, 휠이 멈춘 후 실제 포인터 위치에서 섹션을 역산

### 4. 빌딩 정보 표시
- 식당 카드에 빌딩 배지 표시 (파란색)
- 상세 페이지에 빌딩 배지 표시
- `restaurant.빌딩` 필드가 있는 경우에만 표시
- 빌딩 아이콘: `Building2` (Lucide)

### 5. 필터 시스템
- 카테고리별 필터
- 지역별 필터 (서여의도/동여의도)
- 빌딩별 필터 (IFC, 더현대, 미원빌딩 등)

### 6. 리뷰 시스템
#### 사용자 리뷰
- 별점 (전체, 음식, 서비스, 분위기)
- 사진 첨부 (최대 4장, iOS Safari 호환)
- 식사 유형 선택

#### Google 리뷰 (2025.01.12 추가)
- Google Places API에서 리뷰 데이터 조회
- 최대 5개 리뷰 표시 (API 제한)
- 최신순 정렬 (time 필드 기준 내림차순)
- 24시간 MongoDB 캐싱
- 표시 정보: 작성자, 프로필 사진, 별점, 작성 시간, 리뷰 내용
- 긴 리뷰 더보기/접기 기능 (150자 기준)

### 7. 사용자 계정 관리
- 로그인/회원가입 (이메일, 비밀번호)
- 비밀번호 변경 (현재 비밀번호 확인 필수)
- 사용자 메뉴 드롭다운 (프로필 버튼 클릭 시)

### 8. 네비게이션 UX

#### iOS 스타일 스와이프 뒤로가기 (2025.01.12 개선)
- **스와이프 뒤로가기**: 화면 왼쪽 가장자리에서 오른쪽으로 스와이프하여 이전 화면으로 이동
- **설정**: threshold 80px, edgeWidth 25px
- **구현**: `useSwipeBack` 훅 (touch 이벤트 기반)
- **적용 화면**: detail, list, recommend, fortune 뷰
- **iOS 스타일 시각 효과**:
  - 페이지 전체가 오른쪽으로 슬라이드 (스와이프 양에 비례)
  - 배경 오버레이 어두워지는 효과 (스와이프할수록 밝아짐)
  - 스와이프 완료 시 페이지 밀어내기 애니메이션
  - 스와이프 취소 시 부드러운 복귀 애니메이션
  - 왼쪽에 그림자 효과로 깊이감 표현

```
┌─────────────────────────────────────┐
│  화면 왼쪽 가장자리 (25px)에서       │
│  터치 시작                          │
│                                     │
│  ──────► 오른쪽으로 스와이프        │
│                                     │
│  페이지 전체 슬라이드 + 오버레이     │
│                                     │
│  threshold(80px) 초과 시            │
│  → 뒤로가기 실행                    │
│  미만 시 → 원위치 복귀              │
└─────────────────────────────────────┘
```

#### 뒤로가기 버튼 (2025.01.12 개선)
- Apple HIG 권장 44x44px 터치 영역
- 반투명 배경으로 가시성 확보 (상세 페이지)
- 둥근 원형 디자인

### 9. 운세맛집 (오행 + 띠 기반 맛집 운세)
- **입력 정보**: 생년월일, 성별, 결혼여부
- **오행 계산**: 천간지지 기반 본명 오행 산출 (목/화/토/금/수)
- **띠(12지지) 계산**: 출생년도 기반 띠 산출 (쥐/소/호랑이/토끼/용/뱀/말/양/원숭이/닭/개/돼지)
  - 육합(六合): 서로 잘 맞는 관계
  - 충(冲): 서로 상충하는 관계
  - 삼합(三合): 세 지지가 모여 강한 기운
- **성별/결혼여부별 차별화**: 동일 생년월일도 다른 결과 제공
- **운세 결과**:
  - 나의 오행 및 띠 (색상별 카드 배경, 띠 이모지)
  - 오늘의 길방 (동여의도/서여의도)
  - 추천 음식 카테고리 (상생 관계 + 띠 성향 기반)
  - 추천 맛집 리스트 (길방 + 카테고리 조합)
- **UI 특징**:
  - 오행별 색상 테마 (목-초록, 화-빨강, 토-노랑, 금-흰색, 수-파랑)
  - 밝은 배경(토/금)에서 어두운 텍스트로 가독성 확보
- **운세 지수 시스템** (2025.01.16 추가):
  - 종합운, 재물운, 가정운, 사회운 (각 1-5점)
  - 이모지 + 숫자 표시 (예: ⭐ 5)
  - 터치 시 상세 해설 모달 표시
- **구체적 메뉴 추천**:
  - 오행×성별×결혼여부별 맞춤 메뉴 추천
  - 추천 이유, 키워드, 대상자 정보 표시
- **컴포넌트**: `fortune-modal.tsx`, `fortune-result.tsx`, `fortune-detail-modal.tsx`
- **로직**: `lib/fortune.ts` (오행 계산, 상생/상극 관계, 운세 지수, 상세 해설)

### 10. Pull-to-Refresh (2025.01.16 추가)
- **기능**: 모바일에서 화면 아래로 당겨서 새로고침
- **구현**: Touch 이벤트 기반 (`touchstart`, `touchmove`, `touchend`)
- **임계값**: 80px 이상 당기면 새로고침 트리거
- **시각 피드백**:
  - 당기는 동안 회전하는 아이콘
  - "당겨서 새로고침" → "놓으면 새로고침" → "새로고침 중..." 메시지
- **적용 화면**: 홈 화면
- **컴포넌트**: `pull-to-refresh.tsx`

## 성능 최적화

### 이미지 최적화
- 업로드 시 800px로 리사이즈
- JPEG 품질 60%로 압축
- URL.createObjectURL 사용 (iOS Safari 호환)

### 캐싱
- MongoDB 이미지 URL 캐시 (image_cache 컬렉션)
  - 첫 조회: Google API → Cloudinary 업로드 → MongoDB 저장
  - 이후 조회: MongoDB에서 바로 반환 (빠른 응답)
- Google Places 사진 URL 메모리 캐시 (클라이언트)
- 폐업/휴업 상태 캐시

### 배치 이미지 로딩
인기맛집 섹션처럼 여러 이미지를 동시에 로딩해야 할 때 사용:

```
이전 방식 (느림):
식당 5개 → 개별 API 호출 5회 → MongoDB 쿼리 5회

배치 방식 (빠름):
식당 5개 → /api/place-photos 1회 → MongoDB $in 쿼리 1회
```

**구현 파일**:
- `/api/place-photos/route.ts` - 배치 이미지 조회 API
- `/hooks/useImageBatch.ts` - 글로벌 캐시 + 배치 로딩 훅
- `/components/popular-restaurants.tsx` - 배치 로딩 적용 컴포넌트

**성능 개선 효과**:
| 항목 | 개별 로딩 | 배치 로딩 |
|------|----------|----------|
| API 호출 | 5회 | 1회 |
| MongoDB 쿼리 | 5회 | 1회 ($in) |
| 네트워크 왕복 | ~250-500ms | ~50-100ms |

### 렌더링
- 폐업 식당 자동 필터링 (return null)
- Lazy loading 이미지

## 데이터베이스 스키마

### MongoDB Collections

#### restaurants
```javascript
{
  name: String,           // 식당명
  address: String,        // 주소
  description: String,    // 특징/설명
  region: String,         // "서여의도" | "동여의도"
  category: String,       // "한식" | "양식" | "중식" | "일식" | "동남아식"
  building: String,       // 건물명
  rating: Number,         // 평점
  reviewCount: Number,    // 리뷰 수
  businessHours: String,  // 영업시간
  priceRange: String,     // 가격대
  googleBuildingName: String,  // Google API에서 가져온 건물명
  updatedAt: Date
}
```

#### restaurant_buildings
```javascript
{
  restaurantName: String,    // 식당명
  buildingName: String,      // 건물명
  address: String,           // 주소
  containingPlaceId: String, // Google Place ID
  source: String,            // "google" | "manual"
  updatedAt: Date
}
```

#### image_cache
```javascript
{
  restaurantName: String,    // 식당명 (인덱스)
  photoUrl: String,          // Cloudinary 이미지 URL
  buildingName: String,      // 건물명
  isClosed: Boolean,         // 폐업/휴업 여부
  businessStatus: String,    // OPERATIONAL, CLOSED_TEMPORARILY, CLOSED_PERMANENTLY
  createdAt: Date,
  updatedAt: Date
}
```

#### users
```javascript
{
  email: String,
  password: String,  // bcrypt hashed
  name: String,
  createdAt: Date
}
```

#### reviews
```javascript
{
  restaurantName: String,
  userId: ObjectId,
  rating: Number,
  content: String,
  images: [String],
  mealType: String,
  createdAt: Date
}
```

#### google_reviews_cache (2025.01.12 추가)
```javascript
{
  restaurantName: String,    // 식당명 (인덱스)
  placeId: String,           // Google Place ID
  reviews: [{                // Google 리뷰 배열 (최대 5개)
    author_name: String,
    author_url: String,
    profile_photo_url: String,
    rating: Number,
    relative_time_description: String,
    text: String,
    time: Number             // Unix timestamp
  }],
  rating: Number,            // 전체 평점
  userRatingsTotal: Number,  // 총 리뷰 수
  createdAt: Date,
  updatedAt: Date            // 24시간 경과 시 캐시 갱신
}
```

#### custom_restaurants (2026.01.19 추가)
```javascript
{
  place_id: String,          // Google Place ID (유니크)
  name: String,              // 식당명
  address: String,           // 주소
  category: String,          // 카테고리 (한식/양식/중식/일식/동남아식)
  feature: String,           // 특징/설명
  region: String,            // 지역 (서여의도/동여의도)
  coordinates: {             // 좌표
    lat: Number,
    lng: Number
  },
  google_rating: Number,     // Google 평점
  google_reviews_count: Number, // Google 리뷰 수
  price_level: Number,       // 가격대 (1-4)
  phone_number: String,      // 전화번호
  opening_hours: [String],   // 영업시간 배열
  photos: [String],          // 사진 URL 배열
  website: String,           // 웹사이트 URL
  google_map_url: String,    // Google Maps URL
  registered_by: Number,     // 등록자 ID
  registered_by_name: String, // 등록자 이름
  created_at: Date,
  updated_at: Date
}
```

#### email_verifications (2026.01.19 추가)
```javascript
{
  email: String,             // 이메일 주소
  code: String,              // 6자리 인증 코드
  expiresAt: Date,           // 만료 시간 (5분)
  verified: Boolean,         // 인증 완료 여부
  verifiedAt: Date,          // 인증 완료 시간
  createdAt: Date
}
```

## 환경 변수

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

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

# Email (Resend)
RESEND_API_KEY=
```

## 배포

### 웹 배포 (Vercel)

Vercel을 통한 자동 배포:
1. GitHub main 브랜치 push
2. Vercel 자동 빌드
3. 프로덕션 배포

수동 배포:
```bash
npx vercel --prod --force
```

### iOS 앱 배포 (App Store)

Capacitor를 사용한 iOS 네이티브 앱 배포:

#### iOS 프로젝트 구조
```
ios/
├── App/
│   ├── App/
│   │   ├── Assets.xcassets/
│   │   │   └── AppIcon.appiconset/
│   │   │       ├── AppIcon.png (1024x1024, alpha 없음)
│   │   │       └── Contents.json
│   │   └── Info.plist
│   └── App.xcworkspace
└── capacitor.config.ts
```

#### 빌드 및 업로드 과정
1. **웹 빌드**: `npm run build`
2. **Capacitor 동기화**: `npx cap sync ios`
3. **Xcode 열기**: `npx cap open ios`
4. **Archive 생성**: Xcode → Product → Archive
5. **App Store 업로드**: Distribute App → App Store Connect → Upload

#### App Store Connect 설정
- **번들 ID**: com.yeoidohanki.app
- **연령 등급**: 4+ (전체)
- **가격**: 무료
- **카테고리**: 음식 및 음료

#### 앱 아이콘 요구사항
- 1024 x 1024 픽셀
- PNG 형식
- **투명 배경(alpha channel) 없음** (필수!)
- 모서리는 사각형 (iOS가 자동으로 둥글게 처리)

#### 스크린샷 요구사항
- **iPhone 6.7인치**: 1290 x 2796 픽셀
- **iPad 12.9인치**: 2048 x 2732 픽셀

자세한 배포 가이드는 [app distribution.md](./app%20distribution.md) 참조

## UI/UX 패턴

### 디자인 시스템 (2026.02.07 적용)
- **폰트**: Pretendard (한글) + Geist Sans (라틴) - CDN dynamic subset
- **컬러**: OKLCH 기반 CSS 변수 시스템, 레드 브랜드
- **토스트**: sonner 비블로킹 알림 (`toast.success/error/warning/info`)
- **터치 영역**: NDS 40px 최소 기준 (버튼 기본 40px, lg 44px)
- **애니메이션**: globals.css 공통 정의 (`animate-fade-in`, `animate-slide-up`, `animate-scale-in`, `animate-fade-in-up`)
- **빈 화면**: EmptyState 공통 컴포넌트 (`src/components/ui/empty-state.tsx`)
- **헤더**: 글래스모피즘 (`bg-white/80 backdrop-blur-xl border-b`)
- **상세 가이드**: `docs/design-guide.md` 참조

### 바텀 시트 (Sheet) - 카테고리 선택
- Radix UI Dialog 기반
- `side="bottom"` 설정으로 하단에서 슬라이드 업
- `max-h-[70vh]`로 높이 제한
- 내부 콘텐츠 스크롤 가능

### 바텀시트 모달 (맛집수정, 리뷰)
- 커스텀 구현 (CSS 애니메이션)
- 아래에서 위로 슬라이드 애니메이션 (`animate-slide-up`)
- 드래그 핸들 (상단 회색 바)
- 배경 터치 시 닫힘
- 상단 모서리만 둥글게 (`rounded-t-3xl`)
- 최대 높이 85~90vh, safe-area 고려

### 모달 배경 스크롤 방지
```typescript
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
  return () => {
    document.body.style.overflow = "";
  };
}, [isOpen]);
```

## 정적 데이터 Soft Delete 흐름

### 정적 데이터 삭제 (Soft Delete)
```
┌──────────────────────────────────────────────────────────────────┐
│                    정적 데이터 삭제 요청                           │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│           place_id가 'static_'으로 시작하는지 확인                  │
└─────────────────────────────┬────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │ 정적 데이터                     │ 일반 데이터
              ▼                               ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  Soft Delete                │  │  Hard Delete               │
│  - deleted: true            │  │  - deleteOne() 실행         │
│  - deleted_at: timestamp    │  │                             │
│  (DB에 기록 유지)            │  │                             │
└─────────────────────────────┘  └─────────────────────────────┘
```

### 정적 데이터 자동 마이그레이션
```
┌──────────────────────────────────────────────────────────────────┐
│                    정적 데이터 수정/삭제 요청                       │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│           place_id가 'static_'으로 시작하는지 확인                  │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ DB에 해당 맛집이   │
                    │ 있는지 확인        │
                    └────────┬──────────┘
                             │
              ┌──────────────┴──────────────┐
              │ 없음 (정적 데이터)            │ 있음 (이미 마이그레이션됨)
              ▼                             ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  자동 마이그레이션 실행       │  │  기존 DB 데이터 사용         │
│  (정적 → MongoDB)           │  │                             │
└─────────────────────────────┘  └─────────────────────────────┘
```

**place_id 생성 규칙 (정적 데이터)**
```typescript
// 형식: static_${이름}_${카테고리}
generateStaticPlaceId("김삼보", "한식")
// → "static_김삼보_한식"

generateStaticPlaceId("딘타이펑", "중식")
// → "static_딘타이펑_중식"
```

**목록 조회 시 필터링**
```typescript
// API 응답에 삭제된 정적 데이터 ID 목록 포함
const deletedStaticIds = await collection
  .find({ deleted: true, place_id: { $regex: /^static_/ } })
  .project({ place_id: 1 })
  .toArray();

// 클라이언트에서 정적 데이터 필터링
staticRestaurants = staticRestaurants.filter(r => {
  const staticPlaceId = r.place_id || generateStaticPlaceId(r.이름, r.category);
  return !deletedStaticIds.includes(staticPlaceId);
});
```
