# 여의도 한끼 - 트러블슈팅 가이드

## 해결된 이슈들

### 1. iOS Safari 이미지 업로드 실패

**문제**
- iOS Safari에서 이미지 업로드 시 빈 화면 또는 업로드 실패
- FileReader + crossOrigin 조합이 iOS에서 동작하지 않음

**원인**
- `FileReader.readAsDataURL()`이 iOS Safari에서 불안정
- blob URL에 `crossOrigin = "anonymous"` 설정 시 이미지 로드 실패

**해결**
```typescript
// Before (문제 있는 코드)
const reader = new FileReader();
reader.onload = (e) => {
  const img = document.createElement("img");
  img.crossOrigin = "anonymous";  // iOS에서 문제
  img.src = e.target?.result as string;
};
reader.readAsDataURL(file);

// After (수정된 코드)
const objectUrl = URL.createObjectURL(file);
const img = document.createElement("img");
img.onload = () => {
  // canvas 처리
  URL.revokeObjectURL(objectUrl);  // 메모리 정리
};
// crossOrigin 설정 제거 (blob URL에는 불필요)
img.src = objectUrl;
```

**파일**: `src/components/review-modal.tsx`

---

### 2. 인기 맛집에 중식이 표시되지 않음

**문제**
- 메인 화면 인기 맛집 섹션에서 중식 카드가 보이지 않음
- 한식, 양식, 일식, 동남아식만 표시됨

**원인**
- 중식 1등 식당 "샹하오 여의도"가 Google Places API에서 폐업으로 반환
- `RestaurantCard` 컴포넌트에서 `isClosed === true`면 `return null` 처리

**해결**
- 폐업된 "샹하오 여의도" 데이터 삭제
- 새로운 중식 1등: "무탄 여의도" (평점 4.5)

**파일**: `src/data/yeouido-food.ts`

---

### 3. 빌딩 시트에서 마지막 항목 가림

**문제**
- 동여의도 빌딩 목록이 많아서 스크롤 시 마지막 항목(IFC몰 등)이 가려짐
- 스크롤이 제대로 동작하지 않음

**원인**
- `ScrollArea` 높이 계산이 부정확
- 하단 safe area 고려 안 됨

**해결**
```typescript
// Before
<ScrollArea className="h-[calc(100%-12rem)] pr-4">
  <div className="grid grid-cols-2 gap-2 pb-4">

// After
<ScrollArea className="flex-1 h-[calc(70vh-14rem)]">
  <div className="grid grid-cols-2 gap-2 pb-20 pr-4">
```

**파일**: `src/components/building-sheet.tsx`

---

### 4. 한끼추천 상세페이지 뒤로가기 버그

**문제**
- 한끼추천에서 식당 상세 → 뒤로가기 시 홈으로 이동
- 한끼추천 뷰로 돌아가지 않음

**원인**
- `previousView` 상태 관리 미흡
- `handleBack()`에서 recommend 뷰 처리 누락

**해결**
```typescript
const handleBack = () => {
  if (currentView === "detail") {
    if (previousView === "home") {
      setCurrentView("home");
      setActiveTab("home");
    } else if (previousView === "recommend") {
      setCurrentView("recommend");
      setActiveTab("recommend");
    } else {
      setCurrentView("list");
    }
    setSelectedRestaurant(null);
  }
  // ...
};
```

**파일**: `src/app/page.tsx`

---

### 5. Vercel 캐시로 인한 배포 반영 지연

**문제**
- 코드 수정 후 배포해도 변경사항이 반영되지 않음
- 브라우저 새로고침해도 이전 버전 표시

**원인**
- Vercel의 정적 페이지 캐싱
- 브라우저 캐시

**해결**
```bash
# 강제 재배포 (캐시 무시)
npx vercel --prod --force

# 빈 커밋으로 재배포 트리거
git commit --allow-empty -m "chore: trigger rebuild"
git push origin main
```

**브라우저 캐시 삭제**
- 시크릿 모드로 확인
- 하드 리프레시: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)

---

### 6. 룰렛 돌리기 카테고리와 추천 결과 불일치

**문제**
- 룰렛에서 "동남아"가 포인터 아래에 멈췄는데 "일식 카테고리에서 추천!"이 표시됨
- 시각적으로 보이는 섹션과 실제 결과가 일치하지 않음

**원인 분석**

1. **CSS 렌더링과 결과 계산의 좌표계 불일치**
   - CSS에서 섹션을 `-90도`부터 시작하도록 렌더링 (`angle = index * 60 - 90`)
   - 결과 계산에서 이 오프셋을 고려하지 않음

2. **`origin-bottom-right` 특성**
   - 섹션이 `w-1/2 h-1/2` + `origin-bottom-right`로 구현
   - 일반적인 원형 좌표계와 다른 위치에서 시작

3. **복잡한 오프셋 계산 시도 실패**
   - for문으로 각 섹션 범위를 체크하는 방식: 360도 경계 처리 복잡
   - 임의의 `pointerPosition` 값 설정: 일관성 없음

**해결 방법: 단순한 역산 공식**

핵심 원리: "룰렛이 시계방향으로 N도 회전했다 = 포인터가 반시계방향으로 N도 이동한 것과 같다"

```typescript
setTimeout(() => {
  // 1. 실제 회전한 각도 (0~360 범위)
  const actualRotation = finalRotationRef.current % 360;

  // 2. 포인터가 가리키는 각도 계산 (역산)
  // - (360 - actualRotation): 반시계방향 이동 계산
  // - +150도: CSS 렌더링 오프셋 보정
  //   - -90도: 섹션이 12시 방향부터 시작
  //   - +60도: origin-bottom-right 특성 보정
  //   - 총 +150도 (실험적으로 도출)
  const deg = (360 - actualRotation + 150) % 360;

  // 3. 해당 각도가 몇 번째 섹션인지 계산
  const index = Math.floor(deg / sectionAngle);
  const resultIndex = index >= items.length ? 0 : index;

  onResult(items[resultIndex].id);
}, 4000);
```

**+150도 오프셋 도출 과정**

| 시도 | 오프셋 | 결과 |
|------|--------|------|
| 1차 | +0도 | 2~3칸 차이 |
| 2차 | -90도 | 여전히 불일치 |
| 3차 | +30도 | 경계에서 틀림 |
| 4차 | +90도 | 1칸 차이 |
| 5차 | +120도 | 거의 맞음 |
| **최종** | **+150도** | **정확히 일치** |

**디버깅 팁**

콘솔 로그로 검증:
```typescript
console.log("actualRotation:", actualRotation);
console.log("deg:", deg);
console.log("resultIndex:", resultIndex);
console.log("result:", items[resultIndex].id);
```

화면의 섹션 `transform: rotate(Xdeg)`와 비교:
- 섹션 n의 원래 각도 = `n * 60 - 90`
- 해당 섹션이 12시에 있으면 결과도 n이어야 함

**핵심 교훈**
1. CSS 렌더링 좌표계와 수학적 좌표계는 다를 수 있음
2. 복잡한 조건문보다 단순한 수식 + 오프셋 조정이 효과적
3. 실험 데이터 기반으로 오프셋을 도출하는 것이 가장 확실

**파일**: `src/components/roulette-wheel.tsx`

---

### 7. 모바일에서 이미지 로딩 속도 저하

**문제**
- 모바일에서 앱을 열면 식당 카드 이미지 로딩에 시간이 오래 걸림
- 매번 같은 식당도 느리게 로딩됨

**원인**
- 매 요청마다 Cloudinary API로 이미지 존재 여부 확인
- Google Places API 호출 → Cloudinary 업로드 순차 처리

**해결**
MongoDB에 이미지 URL 캐시 레이어 추가:
```typescript
// 1. MongoDB 캐시 확인 (가장 빠름)
const cached = await getCachedImage(restaurantName);
if (cached) {
  return NextResponse.json({
    photoUrl: cached.photoUrl,
    cached: true
  });
}

// 2. 캐시 없으면 Google API 호출 후 MongoDB에 저장
await saveImageCache({
  restaurantName,
  photoUrl: optimizedUrl,
  buildingName,
});
```

**개선된 흐름**
- 첫 조회: Google API → Cloudinary 업로드 → MongoDB 저장
- 이후 조회: MongoDB에서 바로 반환 (API 호출 0)

**파일**: `src/app/api/place-photo/route.ts`

---

### 8. 인기맛집 이미지 로딩 시간 개선

**문제**
- 홈화면 인기맛집 섹션에서 이미지 5개가 순차적으로 느리게 로딩
- 페이지 새로고침 시마다 시간이 소요됨

**원인**
- 각 식당 카드가 개별적으로 `/api/place-photo` API 호출 (5번)
- 각 호출마다 MongoDB 쿼리 실행 (5번)
- 네트워크 왕복 시간이 누적됨

**해결**
배치 이미지 조회 API와 전용 컴포넌트 구현:

```typescript
// /api/place-photos/route.ts - 배치 조회 API
const cached = await collection.find({
  restaurantName: { $in: restaurantNames }  // 한 번에 여러 개 조회
}).toArray();

// /components/popular-restaurants.tsx - 배치 로딩 사용
const response = await fetch("/api/place-photos", {
  method: "POST",
  body: JSON.stringify({ names: restaurantNames }),
});
```

**개선 효과**
| 항목 | 이전 | 이후 |
|------|------|------|
| API 호출 | 5회 | 1회 |
| MongoDB 쿼리 | 5회 | 1회 |
| 체감 로딩 시간 | 느림 | 빠름 |

**추가 최적화**: 글로벌 메모리 캐시 적용
```typescript
// /hooks/useImageBatch.ts
const globalImageCache = new Map<string, ImageResult>();
// 같은 세션 내에서는 재요청 없이 즉시 표시
```

**파일**:
- `src/app/api/place-photos/route.ts`
- `src/hooks/useImageBatch.ts`
- `src/components/popular-restaurants.tsx`

---

### 9. 운세 화면에서 뒤로가기 시 빈 화면 문제

**문제**
- 운세맛집 탭에서 맛집 상세 화면으로 이동 후 뒤로가기 시 빈 화면 표시
- 이전 뷰(fortune)로 돌아가지 않음

**원인**
- `handleBack()` 함수에서 `previousView === "fortune"` 케이스 처리 누락

**해결**
```typescript
const handleBack = () => {
  if (currentView === "detail") {
    if (previousView === "home") {
      setCurrentView("home");
      setActiveTab("home");
    } else if (previousView === "recommend") {
      setCurrentView("recommend");
      setActiveTab("recommend");
    } else if (previousView === "fortune") {  // 추가
      setCurrentView("fortune");
      setActiveTab("fortune");
    } else {
      setCurrentView("list");
    }
    setSelectedRestaurant(null);
  }
};
```

**파일**: `src/app/page.tsx`

---

### 10. 상세화면에서 운세맛집 탭 이동 안되는 문제

**문제**
- 맛집 상세 화면에서 하단 네비게이션의 운세맛집 탭 클릭 시 화면 전환 안됨
- 한끼추천 뷰에서도 동일한 문제 발생

**원인**
- detail 뷰와 recommend 뷰에서 `FortuneModal` 컴포넌트가 렌더링되지 않음
- 시트들은 렌더링되어 있으나 운세 모달 누락

**해결**
- detail 뷰와 recommend 뷰의 return 문에 `FortuneModal` 추가

```typescript
// detail view
if (currentView === "detail" && selectedRestaurant) {
  return (
    <>
      <RestaurantDetail ... />
      <BottomNav ... />
      <CategorySheet ... />
      <BuildingSheet ... />
      <FortuneModal  // 추가
        open={fortuneModalOpen}
        onOpenChange={setFortuneModalOpen}
        onSubmit={handleFortuneSubmit}
      />
    </>
  );
}
```

**파일**: `src/app/page.tsx`

---

### 11. 구글 리뷰가 최신순으로 표시되지 않는 문제

**문제**
- 구글맵에서는 2일 전 리뷰(손예주님)가 최신인데, 앱에서는 1주 전 리뷰(R H님)가 최신으로 표시
- 리뷰가 자동으로 업데이트되지 않음

**원인 1: Google Places API 기본 정렬**
- Google Places API는 기본적으로 "관련성(most_relevant)" 기준으로 리뷰를 반환
- 최신 리뷰가 아닌 "유용한" 리뷰를 우선 표시

**해결 1: `reviews_sort=newest` 파라미터 추가**
```typescript
// Before
const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&language=ko&key=${GOOGLE_API_KEY}`;

// After
const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&language=ko&reviews_sort=newest&key=${GOOGLE_API_KEY}`;
```

**원인 2: 리뷰 자동 업데이트 시스템 부재**
- 정기 업데이트 기능이 없어서 캐시가 만료될 때까지 오래된 데이터 유지

**해결 2: Vercel Cron Job으로 3시간마다 자동 업데이트**

`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/update-reviews",
      "schedule": "0 */3 * * *"
    }
  ]
}
```

Cron API (`src/app/api/cron/update-reviews/route.ts`):
- 모든 식당의 구글 리뷰를 배치로 업데이트
- 5개씩 처리, 2초 딜레이 (API 레이트 제한 방지)

**원인 3: 다중 캐시 레이어 문제**
- MongoDB 서버 캐시 (24시간 TTL)
- 브라우저 메모리 캐시 (만료 없음)
- Safari/PWA 웹뷰 캐시

**해결 3: 캐시 정책 개선**

MongoDB 캐시 TTL 변경 (24시간 → 3시간):
```typescript
const maxAge = 3 * 60 * 60 * 1000; // 3시간
```

브라우저 메모리 캐시에 만료시간 추가:
```typescript
const CACHE_TTL = 10 * 60 * 1000; // 10분

const isCacheValid = (entry: CacheEntry | undefined): entry is CacheEntry => {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
};
```

fetch 요청에 캐시 무효화 헤더:
```typescript
const res = await fetch(url, {
  cache: 'no-store',
  headers: { 'Cache-Control': 'no-cache' }
});
```

**캐시 문제 발생 시 해결 순서**
1. MongoDB 캐시 전체 삭제:
   ```bash
   curl -X POST "https://yeouido-food.vercel.app/api/google-reviews/clear-cache" \
     -H "Content-Type: application/json" \
     -d '{"clearAll": true}'
   ```

2. Vercel 강제 재배포:
   ```bash
   vercel --prod --force
   ```

3. Safari 캐시 삭제:
   - iPhone 설정 → Safari → 방문 기록 및 웹 사이트 데이터 지우기

4. PWA 홈화면 아이콘 삭제 후 재추가

**파일**:
- `src/app/api/google-reviews/[name]/route.ts`
- `src/app/api/cron/update-reviews/route.ts`
- `src/components/google-reviews.tsx`
- `vercel.json`

---

### 12. 운세 지수 카드 이모지 오버플로우 문제 (2025.01.16)

**문제**
- 운세 지수 카드에서 별 5개(⭐⭐⭐⭐⭐)가 카드 영역을 넘침
- 모바일에서 3개만 보이고 나머지가 잘림

**원인**
- 좁은 카드 영역에 이모지 5개가 들어가면서 공간 부족
- `grid-cols-4` 레이아웃에서 각 카드 너비가 제한됨

**해결**
이모지 개수 대신 "이모지 + 숫자" 형식으로 변경:
```typescript
// Before (오버플로우 발생)
{Array.from({ length: score }).map((_, i) => (
  <span key={i}>{cat.emoji}</span>
))}

// After (깔끔하게 표시)
<p className="text-base font-bold">
  {cat.emoji} {score}
</p>
```

**파일**: `src/components/fortune-result.tsx`

---

### 13. 운세 모달 생년월일 select 자동 열림 문제 (2025.01.16)

**문제**
- 운세 모달 열 때 생년월일 select 드롭다운이 자동으로 열림
- 모바일에서 특히 불편한 UX

**원인**
- Radix UI Dialog의 기본 동작으로 첫 번째 포커스 가능 요소에 자동 포커스
- `<select>` 요소가 포커스되면서 드롭다운이 열림

**해결**
`DialogContent`에 `onOpenAutoFocus` 이벤트 핸들러 추가:
```typescript
<DialogContent
  className="sm:max-w-md"
  onOpenAutoFocus={(e) => e.preventDefault()}
>
```

**파일**: `src/components/fortune-modal.tsx`

---

### 14. 커스텀 맛집 상세페이지에서 가격대/전화번호가 안 보이는 문제 (2026.01.19)

**문제**
- 커스텀 맛집(예: 왕산) 상세페이지에서 가격대, 전화번호, 영업시간이 표시되지 않음
- MongoDB에는 데이터가 정상적으로 저장되어 있음

**원인**
- `restaurant-detail.tsx`에서 두 개의 `useEffect`가 충돌
- 첫 번째 `useEffect`: 커스텀 맛집 정보를 `/api/custom-restaurants`에서 가져와 `priceRange`, `phoneNumber` 설정
- 두 번째 `useEffect`: `/api/restaurant-prices/` API를 호출하여 값을 덮어씀
- 커스텀 맛집의 경우 두 번째 API에서 해당 식당을 찾지 못해 `null`로 덮어씌워짐

**해결**
두 번째 `useEffect`에서 커스텀 맛집인 경우 스킵하도록 조건 추가:

```typescript
// 가격대/전화번호 정보 가져오기 (커스텀 맛집이 아닌 경우에만)
useEffect(() => {
  // 커스텀 맛집인 경우 이미 fetchCustomInfo에서 처리하므로 스킵
  if (customInfo) {
    return;
  }

  // 이미 캐시된 경우
  if (cacheKey in infoCache) {
    setPriceRange(infoCache[cacheKey].priceRange);
    setPhoneNumber(infoCache[cacheKey].phoneNumber);
    setInfoLoaded(true);
    return;
  }

  const fetchRestaurantInfo = async () => {
    // ... API 호출
  };

  fetchRestaurantInfo();
}, [restaurant.이름, cacheKey, infoCache, customInfo]); // customInfo 의존성 추가
```

**추가 수정사항**
- `CustomRestaurantInfo` 인터페이스에 `opening_hours?: string[]` 필드 추가
- 첫 번째 `useEffect`에서 `setOpeningHours(found.opening_hours)` 호출
- UI에서 영업시간을 배열로 표시 (요일별 한 줄씩)

**파일**: `src/components/restaurant-detail.tsx`

---

### 15. Next.js Turbopack 캐시 손상으로 개발 서버 시작 실패 (2026.01.19)

**문제**
- `npm run dev` 실행 시 Turbopack panic 에러 발생
- 에러 메시지: `range start index 18446744073709551543 out of range for slice of length 79`

**원인**
- `.next` 폴더의 Turbopack 캐시 파일 손상
- 비정상 종료 등으로 인해 캐시 데이터가 깨짐

**해결**
`.next` 캐시 폴더 삭제 후 재시작:

```bash
rm -rf .next
npm run dev
```

**파일**: `.next/` (캐시 폴더)

---

## 일반적인 디버깅 팁

### 로컬 개발 서버
```bash
npm run dev
# http://localhost:3000
```

### 빌드 테스트
```bash
npm run build
```

### 데이터 확인
```bash
node -e "
const { getPopularRestaurants } = require('./src/data/yeouido-food.ts');
console.log(getPopularRestaurants());
"
```

### API 테스트
```bash
# 식당 사진 API
curl "http://localhost:3000/api/place-photo?query=김삼보+여의도"

# 리뷰 API
curl "http://localhost:3000/api/reviews?restaurant_id=xxx"
```

### Vercel 로그 확인
```bash
npx vercel logs [deployment-url]
```

---

## 환경 설정 체크리스트

1. **환경 변수 확인**
   - Vercel 대시보드 → Settings → Environment Variables
   - 모든 필수 변수가 설정되어 있는지 확인

2. **API 키 유효성**
   - Google Places API 키 활성화 상태
   - Cloudinary 계정 용량

3. **데이터베이스 연결**
   - Turso 데이터베이스 URL/토큰 확인
   - 테이블 스키마 확인
