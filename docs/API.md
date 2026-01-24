# API 명세서

## 인증 API

### POST /api/auth/register
회원가입

**Request Body**
```json
{
  "name": "사용자명",
  "email": "user@example.com",
  "password": "비밀번호"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "사용자명",
    "email": "user@example.com"
  }
}
```

---

### POST /api/auth/login
로그인

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "비밀번호"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "사용자명",
    "profile_image": null,
    "is_admin": false
  }
}
```

**쿠키**: `auth_token` (JWT, httpOnly, 7일 유효)

---

### POST /api/auth/logout
로그아웃

**Response**
```json
{
  "success": true
}
```

---

### GET /api/auth/me
현재 로그인 사용자 정보

**Response (로그인 상태)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "사용자명",
    "email": "user@example.com",
    "is_admin": false
  }
}
```

**Response (비로그인)**
```json
{
  "success": false,
  "error": "인증이 필요합니다."
}
```

---

### POST /api/auth/send-verification
이메일 인증 코드 발송 (Resend API)

**Request Body**
```json
{
  "email": "user@example.com"
}
```

**Response**
```json
{
  "success": true,
  "message": "인증 코드가 발송되었습니다."
}
```

**참고**: 테스트 이메일(@test.com, @example.com)은 고정 코드 "123456" 사용

---

### POST /api/auth/verify-code
이메일 인증 코드 확인

**Request Body**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response**
```json
{
  "success": true,
  "message": "이메일이 인증되었습니다."
}
```

---

### POST /api/auth/change-password
비밀번호 변경 (인증 필요)

**Request Body**
```json
{
  "currentPassword": "현재비밀번호",
  "newPassword": "새비밀번호"
}
```

**Response**
```json
{
  "success": true,
  "message": "비밀번호가 변경되었습니다."
}
```

---

### DELETE /api/auth/delete-account
계정 삭제 (인증 필요)

**Response**
```json
{
  "success": true,
  "message": "계정이 삭제되었습니다."
}
```

---

## 리뷰 API

### GET /api/reviews
리뷰 목록 조회

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| restaurant_id | O | 맛집 ID |

**Response**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "restaurant_id": "맛집ID",
      "user_id": 1,
      "user_name": "사용자명",
      "rating": 5,
      "food_rating": 5,
      "service_rating": 4,
      "atmosphere_rating": 5,
      "content": "리뷰 내용",
      "photos": ["https://..."],
      "meal_type": "점심 식사",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST /api/reviews
리뷰 작성 (인증 필요)

**Request Body**
```json
{
  "restaurant_id": "맛집ID",
  "rating": 5,
  "food_rating": 5,
  "service_rating": 4,
  "atmosphere_rating": 5,
  "content": "리뷰 내용",
  "photos": ["https://cloudinary.com/..."],
  "meal_type": "점심 식사"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "insertedId": "..."
  }
}
```

---

### PUT /api/reviews/[id]
리뷰 수정 (본인 리뷰만)

**Request Body**: 리뷰 작성과 동일

**Response**
```json
{
  "success": true
}
```

---

### DELETE /api/reviews/[id]
리뷰 삭제 (본인 또는 관리자만)

**Response**
```json
{
  "success": true
}
```

---

## 맛집 API

### GET /api/custom-restaurants
맛집 목록 조회

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| category | X | 카테고리 (한식/양식/중식/일식/동남아식) |
| region | X | 지역 (서여의도/동여의도) |
| registeredBy | X | 등록자 ID |
| place_id | X | 장소 ID (중복 확인용) |

**Response**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "place_id": "ChIJ...",
      "name": "맛집명",
      "address": "주소",
      "category": "한식",
      "region": "서여의도",
      "feature": "특징",
      "google_rating": 4.5,
      "google_reviews_count": 100,
      "coordinates": { "lat": 37.52, "lng": 126.92 },
      "price_level": 2,
      "phone_number": "02-123-4567",
      "registered_by": 1,
      "registered_by_name": "사용자명",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "deletedStaticIds": []
}
```

---

### POST /api/custom-restaurants
맛집 등록 (인증 필요)

**Request Body**
```json
{
  "place_id": "ChIJ...",
  "name": "맛집명",
  "address": "주소",
  "category": "한식",
  "region": "서여의도",
  "feature": "특징 메모",
  "coordinates": { "lat": 37.52, "lng": 126.92 },
  "google_rating": 4.5,
  "google_reviews_count": 100,
  "price_level": 2,
  "phone_number": "02-123-4567",
  "opening_hours": ["월-금 10:00-22:00"]
}
```

**Response**
```json
{
  "success": true,
  "message": "맛집이 등록되었습니다.",
  "data": { "insertedId": "..." }
}
```

---

### PATCH /api/custom-restaurants
카테고리/특징 수정 (등록자, 관리자, 또는 박병철)

**Request Body**
```json
{
  "place_id": "ChIJ...",
  "category": "양식",
  "feature": "새 특징",
  "region": "동여의도"
}
```

**Response**
```json
{
  "success": true,
  "message": "맛집 정보가 수정되었습니다."
}
```

---

### PUT /api/custom-restaurants
맛집 상세 정보 수정 (등록자, 관리자, 또는 박병철)

**Request Body**
```json
{
  "old_place_id": "ChIJ...",
  "address": "새 주소",
  "feature": "새 특징",
  "coordinates": { "lat": 37.52, "lng": 126.92 },
  "phone_number": "02-123-4567",
  "opening_hours": ["월-금 10:00-22:00"]
}
```

**Response**
```json
{
  "success": true,
  "message": "맛집 정보가 수정되었습니다."
}
```

---

### DELETE /api/custom-restaurants
맛집 삭제 (등록자, 관리자, 또는 박병철)

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| place_id | O | 삭제할 맛집의 place_id |

**Response**
```json
{
  "success": true
}
```

---

## 이미지 API

### POST /api/upload
이미지 업로드 (Cloudinary)

**Request Body**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response**
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/...",
  "public_id": "yeouido-food/..."
}
```

---

### GET /api/place-photo
Google Places 이미지 조회 (캐싱 포함)

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| query | O | 검색어 (식당명 + 여의도) |
| name | X | 식당명 (캐시 키) |

**Response**
```json
{
  "photoUrl": "https://res.cloudinary.com/...",
  "buildingName": "IFC몰",
  "cached": true,
  "isClosed": false,
  "businessStatus": "OPERATIONAL"
}
```

---

### POST /api/place-photos
여러 이미지 일괄 조회

**Request Body**
```json
{
  "names": ["맛집1", "맛집2", "맛집3"]
}
```

**Response**
```json
{
  "results": [
    {
      "restaurantName": "맛집1",
      "photoUrl": "https://...",
      "cached": true,
      "isClosed": false
    }
  ]
}
```

---

## Google Place Details API

> **비용 최적화**: sessionToken을 사용하면 Autocomplete + Place Details 조합 호출 시 한 세션으로 묶여 **70~80% 비용 절감**됩니다.

### GET /api/places-search
장소 자동완성 검색

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| q | O | 검색어 (최소 2자) |
| sessionToken | X | 세션 토큰 (비용 절감용) |

**Response**
```json
{
  "success": true,
  "predictions": [
    {
      "place_id": "ChIJ...",
      "name": "장소명",
      "description": "장소명, 주소",
      "secondary_text": "주소"
    }
  ],
  "sessionToken": "uuid-v4-token"
}
```

> **비용 절감 팁**: 응답의 `sessionToken`을 Place Details 호출 시 함께 전달하면 한 세션으로 묶입니다.

---

### POST /api/place-details
장소 상세 정보 조회

**Request Body**
```json
{
  "placeId": "ChIJ...",
  "sessionToken": "uuid-v4-token"
}
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| placeId | O | Google Place ID |
| sessionToken | X | Autocomplete에서 받은 세션 토큰 (비용 절감) |

**Response**
```json
{
  "success": true,
  "data": {
    "place_id": "ChIJ...",
    "name": "장소명",
    "address": "서울특별시 영등포구...",
    "coordinates": { "lat": 37.52, "lng": 126.92 },
    "rating": 4.5,
    "reviewCount": 100,
    "priceLevel": 2,
    "phoneNumber": "02-123-4567",
    "openingHours": ["월요일: AM 10:00 ~ PM 10:00", ...],
    "isOpen": true,
    "photos": ["https://res.cloudinary.com/..."],
    "businessStatus": "OPERATIONAL",
    "region": "서여의도"
  }
}
```

---

### GET /api/place-details
텍스트 검색으로 장소 상세 정보 조회

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| q | O | 검색어 |

**Response**: POST와 동일

---

## Google 리뷰 API

### GET /api/google-reviews/[name]
Google 리뷰 조회 (3시간 캐시)

**Response**
```json
{
  "reviews": [
    {
      "author_name": "사용자명",
      "rating": 5,
      "text": "리뷰 내용",
      "time": 1704067200,
      "relative_time_description": "1개월 전"
    }
  ],
  "rating": 4.5,
  "userRatingsTotal": 100,
  "cached": true
}
```

---

### POST /api/google-reviews/clear-cache
Google 리뷰 캐시 삭제

**Request Body**
```json
{
  "restaurantName": "맛집명",
  "clearAll": false
}
```

**Response**
```json
{
  "success": true,
  "message": "캐시가 삭제되었습니다.",
  "deleted": 1
}
```

---

## 건물/가격 정보 API

### GET /api/restaurant-buildings
식당 건물 정보 목록 조회

**Response**
```json
{
  "count": 50,
  "buildings": [
    { "restaurantName": "맛집명", "buildingName": "IFC몰" }
  ]
}
```

---

### GET /api/restaurant-buildings/[name]
특정 식당 건물 정보 조회

**Response**
```json
{
  "restaurantName": "맛집명",
  "buildingName": "IFC몰"
}
```

---

### GET /api/restaurant-prices
식당 가격 정보 목록 조회

**Response**
```json
{
  "count": 50,
  "prices": [
    {
      "restaurantName": "맛집명",
      "priceLevel": "PRICE_LEVEL_MODERATE",
      "priceRange": "10,000~20,000원",
      "phoneNumber": "02-123-4567"
    }
  ]
}
```

---

### GET /api/restaurant-prices/[name]
특정 식당 가격 정보 조회

**Response**
```json
{
  "restaurantName": "맛집명",
  "priceLevel": "PRICE_LEVEL_MODERATE",
  "priceRange": "10,000~20,000원",
  "phoneNumber": "02-123-4567"
}
```

---

## 맛집 히스토리 API

### GET /api/restaurant-history
히스토리 목록 조회

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| page | X | 페이지 번호 (기본: 1) |
| limit | X | 페이지당 항목 수 (기본: 20) |
| action | X | 액션 필터 (register/delete/update) |

**Response**
```json
{
  "success": true,
  "data": [
    {
      "seq": 8,
      "place_id": "ChIJ...",
      "name": "맛집명",
      "category": "한식",
      "action": "register",
      "registered_by": 1,
      "registered_by_name": "박병철",
      "registered_at": "2024-01-15T10:30:00.000Z",
      "memo": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  }
}
```

---

### POST /api/restaurant-history
히스토리 수동 추가 (인증 필요)

**Request Body**
```json
{
  "place_id": "ChIJ...",
  "name": "맛집명",
  "category": "한식",
  "action": "register",
  "short_address": "여의도동",
  "memo": "메모 (선택)"
}
```

**Response**
```json
{
  "success": true,
  "message": "히스토리가 추가되었습니다.",
  "data": { "seq": 9 }
}
```

---

## 역지오코딩 API

### POST /api/reverse-geocode
좌표를 주소로 변환 (Google Geocoding API)

**Request Body**
```json
{
  "lat": 37.5216,
  "lng": 126.9245
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "address": "7GX8+5G6 여의도동 영등포구 서울특별시",
    "formatted_address": "서울특별시 영등포구 여의도동 123",
    "plus_code": "7GX8+5G6",
    "coordinates": { "lat": 37.5216, "lng": 126.9245 },
    "place_id": "ChIJ..."
  }
}
```

---

## 날씨 API

### GET /api/weather
여의도 현재 날씨 및 음식 추천 (30분 캐시)

**Response**
```json
{
  "current": {
    "temperature": 5,
    "feelsLike": 2,
    "weather": "맑음",
    "icon": "01d",
    "type": "sunny",
    "humidity": 45,
    "windSpeed": 3.5
  },
  "yesterday": {
    "temperature": 3,
    "weather": "흐림",
    "type": "cloudy"
  },
  "comparison": {
    "tempDiff": 2,
    "tempTrend": "hotter",
    "weatherChanged": true
  },
  "recommendation": {
    "message": "추운 날씨에 따뜻한 국물 요리 어떠세요?",
    "tags": ["국물요리", "찌개", "탕"]
  }
}
```

---

## Cron Jobs API

### GET /api/cron/update-reviews
Google 리뷰 자동 업데이트 (Vercel Cron)

**인증**: `Authorization: Bearer {CRON_SECRET}`

**Response**
```json
{
  "success": true,
  "message": "리뷰 업데이트 완료",
  "stats": {
    "total": 50,
    "updated": 48,
    "failed": 2,
    "skipped": 0
  },
  "duration": "25.3s",
  "timestamp": "2025-01-24T06:00:00.000Z"
}
```

---

## 에러 응답 형식

모든 API는 에러 발생 시 다음 형식으로 응답합니다:

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

**HTTP 상태 코드**
| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (필수 파라미터 누락 등) |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 500 | 서버 오류 |

---

## Google Places API 비용 최적화 전략

### 문제점
| 항목 | 비용 | 문제 |
|------|------|------|
| Place Details | $17/1,000회 | 음식점 리스트 표시 시 각각 호출 |
| Autocomplete | $2.83/1,000회 | 입력마다 호출 폭증 (5~10회/검색) |
| Place Photo | $7/1,000회 | 매번 새로 요청 |

### 적용된 최적화

#### 1. sessionToken 사용 (70~80% 비용 절감)
```typescript
// 클라이언트
import { getSessionTokenManager } from "@/lib/google-session-token";

const tokenManager = getSessionTokenManager();
const sessionToken = tokenManager.getToken();

// Autocomplete 호출
const res = await fetch(`/api/places-search?q=${query}&sessionToken=${sessionToken}`);
const { predictions, sessionToken: returnedToken } = await res.json();

// Place Details 호출 (동일 토큰 사용)
await fetch("/api/place-details", {
  method: "POST",
  body: JSON.stringify({ placeId, sessionToken: returnedToken })
});

// 선택 완료 후 토큰 무효화
tokenManager.invalidateToken();
```

#### 2. fields 파라미터 최적화
```
// Before (13개 필드)
fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,
       price_level,formatted_phone_number,opening_hours,photos,website,url,business_status

// After (11개 필드) - website, url 제거
fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,
       price_level,formatted_phone_number,opening_hours,photos,business_status
```

#### 3. 이미지 캐싱 전략
- **MongoDB 캐시**: `image_cache` 컬렉션에 URL 저장
- **Cloudinary 저장**: Google Photo → Cloudinary 업로드 → 최적화 URL 반환
- **휴업/폐업 상태 캐싱**: `business_status` 저장하여 불필요한 재조회 방지

#### 4. 리뷰 캐싱 (3시간)
- **MongoDB 캐시**: `google_reviews_cache` 컬렉션
- **캐시 기간**: 3시간
- **배치 갱신**: Cron Job으로 자동 갱신

### 캐싱 관련 컬렉션

| 컬렉션명 | 용도 | TTL |
|---------|------|-----|
| `image_cache` | 식당 이미지 URL 캐시 | 무제한 |
| `google_reviews_cache` | 구글 리뷰 캐시 | 3시간 |
| `restaurant_buildings` | 건물 정보 | 무제한 |
| `restaurant_prices` | 가격 정보 | 무제한 |

### 비용 절감 예상

| 최적화 항목 | 예상 절감률 |
|------------|-----------|
| sessionToken 도입 | 70~80% |
| fields 최적화 | 5~10% |
| 이미지 Cloudinary 캐싱 | 90%+ |
| 리뷰 3시간 캐싱 | 95%+ |

### 관련 파일
- `/src/lib/google-session-token.ts` - sessionToken 유틸리티
- `/src/app/api/places-search/route.ts` - 장소 검색 (sessionToken 적용)
- `/src/app/api/place-details/route.ts` - 장소 상세 (sessionToken + fields 최적화)
- `/src/app/api/place-photo/route.ts` - 이미지 캐싱 (Cloudinary + MongoDB)

---

## 기술 스택

- **프레임워크**: Next.js 16 (App Router)
- **데이터베이스**: MongoDB
- **인증**: JWT (7일 유효), bcrypt
- **이미지 저장**: Cloudinary
- **이메일**: Resend API
- **외부 API**:
  - Google Places API (음식점 검색, 평점, 건물 정보)
  - Google Geocoding API (역지오코딩)
  - Open-Meteo API (날씨, 무료)

---

**작성일**: 2025-01-24
**프로젝트**: 여의도한끼 (여의도 맛집 추천 앱)
