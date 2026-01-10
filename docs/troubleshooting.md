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
