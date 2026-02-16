# 여의도한끼 디자인 가이드

## 기술 스택

| 항목 | 내용 |
|------|------|
| CSS 프레임워크 | Tailwind CSS v4 |
| 컴포넌트 | shadcn/ui + Radix UI |
| 아이콘 | lucide-react v0.468 |
| 폰트 | Geist (라틴) + Pretendard (한글) |
| 프레임워크 | Next.js 16 + React 19 + TypeScript |
| 유틸리티 | clsx + tailwind-merge (cn 함수) |
| 토스트 | sonner |
| 디자인 기준 | HNW 디자인가이드 (NDS 기반) |

---

## 컬러 시스템

CSS 변수 기반 OKLCH 라이트 모드 테마. 정의 위치: `src/app/globals.css`

### 기본 색상

| 토큰 | OKLCH | 용도 |
|------|-------|------|
| `--primary` | `oklch(0.205 0 0)` | 버튼, 본문 강조 |
| `--foreground` | `oklch(0.145 0 0)` | 본문 텍스트 |
| `--muted-foreground` | `oklch(0.556 0 0)` | 보조 텍스트 |
| `--secondary` / `--muted` | `oklch(0.97 0 0)` | 배경, 보조 영역 |
| `--destructive` | `oklch(0.577 0.245 27.325)` | 삭제, 위험 액션 |
| `--border` / `--input` | `oklch(0.922 0 0)` | 테두리, 입력 필드 |
| `--background` / `--card` | `oklch(1 0 0)` | 배경, 카드 |
| `--radius` | `0.625rem` (10px) | 모서리 반경 |

### 브랜드 컬러

| 용도 | Tailwind | HEX |
|------|----------|-----|
| 브랜드 레드 | `text-red-500` / `red-600` | `#ef4444` / `#dc2626` |
| 추천 오렌지 | `text-orange-500` | `#f97316` |
| 운세 퍼플 | `text-purple-500` | `#a855f7` |
| 별점 앰버 | `fill-amber-400 text-amber-400` | `#fbbf24` |
| 빌딩 배지 블루 | `text-blue-600 bg-blue-50` | `#2563eb` |

### 카테고리 아이콘 (이모지)

| 카테고리 | 아이콘 |
|---------|--------|
| 한식 | 🍚 |
| 양식 | 🥩 |
| 중식 | 🥟 |
| 일식 | 🍣 |
| 동남아식 | 🍜 |

---

## 폰트

정의 위치: `src/app/layout.tsx`, `src/app/globals.css`

| 용도 | 폰트 | CSS 변수 |
|------|------|---------|
| 기본 (라틴) | Geist | `--font-geist-sans` |
| 코드 | Geist Mono | `--font-geist-mono` |
| 한글 (우선) | Pretendard Variable | body font-family |

```css
body {
  font-family: 'Pretendard Variable', Pretendard, var(--font-geist-sans),
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

Pretendard는 CDN dynamic subset으로 로드 (필요한 글리프만 다운로드):
```html
<link rel="stylesheet" as="style" crossOrigin="anonymous"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
```

### 모바일 가독성 — 최소 폰트 크기 보장

정의 위치: `src/app/globals.css`

body 기본 폰트 15px, line-height 1.6. 작은 폰트는 CSS override로 최소값 보장:

| Tailwind 클래스 | 기본 크기 | 실제 적용 크기 | line-height |
|---|---|---|---|
| `text-[7px]`~`text-[9px]` | 7~9px | **11px** | 1.4 |
| `text-[10px]`~`text-[11px]` | 10~11px | **12px** | 1.4 |
| `text-xs` | 12px | **13px** | 1.5 |
| `text-sm` | 14px | **15px** | 1.55 |
| `text-base` 이상 | 16px~ | 변경 없음 | Tailwind 기본 |

---

## UI 컴포넌트

디렉토리: `src/components/ui/`

### Button

```tsx
// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default(h-10, 40px), sm(h-8, 32px), lg(h-11, 44px), icon(size-10, 40px)

<Button variant="default">기본</Button>
<Button variant="destructive">삭제</Button>
<Button variant="outline">외곽선</Button>
<Button variant="ghost" size="sm">고스트</Button>
<Button size="icon"><Search /></Button>
```

### Badge

```tsx
// Variants: default, secondary, destructive, outline

<Badge variant="default">한식</Badge>
<Badge variant="secondary">🍚 한식</Badge>
```

### Card

```tsx
<Card className="hover:shadow-lg transition-shadow">
  <CardContent className="p-4">
    {/* 콘텐츠 */}
  </CardContent>
</Card>
```

### Dialog (Modal)

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>제목</DialogTitle>
    </DialogHeader>
    {/* 콘텐츠 */}
  </DialogContent>
</Dialog>
```

### EmptyState

빈 화면 표시용 공통 컴포넌트.

```tsx
// 파일: src/components/ui/empty-state.tsx
<EmptyState
  icon={Search}
  title="검색 결과가 없습니다"
  description="다른 키워드로 검색해보세요"
  action={<Button size="sm">전체 보기</Button>}
/>
```

### 토스트 알림 (sonner)

`alert()` 대신 비블로킹 토스트 사용.

```tsx
import { toast } from "sonner";

toast.success("맛집이 삭제되었습니다.");      // 성공 (녹색)
toast.error("삭제에 실패했습니다.");          // 실패 (빨간색)
toast.warning("별점을 선택해주세요.");        // 경고 (노란색)
toast.info("로그인이 필요합니다.");           // 안내 (파란색)
```

**문구 규칙**:
- 성공: "~되었습니다" / "~했습니다" (능동형)
- 실패: "~에 실패했습니다" / "~가 발생했습니다"
- `confirm()`은 그대로 유지 (사용자 확인이 필요한 경우)

### 기타 컴포넌트

| 컴포넌트 | 파일 | 높이 | 설명 |
|---------|------|------|------|
| Input | `input.tsx` | h-10 (40px) | 텍스트 입력 필드 |
| Tabs | `tabs.tsx` | h-10 (40px) | 탭 네비게이션 |
| Sheet | `sheet.tsx` | - | 바텀/사이드 시트 |
| ScrollArea | `scroll-area.tsx` | - | 커스텀 스크롤 영역 |
| Skeleton | `skeleton.tsx` | - | 로딩 플레이스홀더 |
| Avatar | `avatar.tsx` | - | 사용자 아바타 |
| Separator | `separator.tsx` | - | 구분선 |

---

## 아이콘 (lucide-react)

### 네비게이션 아이콘

| 탭 | 아이콘 |
|----|--------|
| 홈 | `Home` |
| 한끼추천 | `Dice5` |
| 운세맛집 | `Sparkles` |
| 카테고리 | `Grid3X3` |
| 빌딩 | `Building2` |

### 일반 아이콘

`User`, `LogOut`, `ChevronDown`, `ChevronLeft`, `Search`, `Star`, `MapPin`, `Clock`, `Phone`, `ExternalLink`, `Trash2`, `Settings`, `Key`, `History`, `MessageSquarePlus`, `Pencil`, `Camera`, `Loader2`

---

## 레이아웃

### 전체 구조

```
┌──────────────────────────────────┐
│  Header (glassmorphism)          │  ← safe-area-top, sticky
│  [  ] ["여의도" 한끼] [User]     │
├──────────────────────────────────┤
│                                  │
│  Main Content (pb-20)            │
│  ┌────────────────────────────┐  │
│  │ SearchBar                   │  │
│  │ Quick Categories            │  │
│  │ Popular Restaurants         │  │
│  │ Region Restaurants          │  │
│  └────────────────────────────┘  │
│                                  │
├──────────────────────────────────┤
│  Bottom Nav (fixed, h-16)        │  ← safe-area-bottom
│  [홈] [추천] [운세] [카테고리] [빌딩] │
└──────────────────────────────────┘
```

### 헤더 (글래스모피즘)

```tsx
<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50 safe-area-top">
  <div className="px-4 py-3 flex items-center justify-between">
    <div className="w-10" />
    <h1 className="text-xl font-bold text-foreground tracking-tight">
      <span className="text-red-500">여의도</span> 한끼
    </h1>
    {/* 우측 사용자 버튼 */}
  </div>
</header>
```

### 하단 네비게이션

```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-50">
  <div className="max-w-md mx-auto flex justify-around items-center h-16">
    {/* active: text-primary, 추천: text-orange-500, 운세: text-purple-500 */}
  </div>
</nav>
```

### 콘텐츠 영역

- `max-w-md mx-auto`: 모바일 앱 스타일 최대 너비 제한
- `pb-20`: 하단 네비게이션 높이만큼 여백
- `min-h-screen`: 최소 전체 높이

---

## 반응형 브레이크포인트

| 접두사 | 크기 | 용도 |
|--------|-----|------|
| (기본) | 0px~ | 모바일 |
| `md:` | 768px~ | 태블릿 |
| `lg:` | 1024px~ | 데스크탑 |
| `xl:` | 1280px~ | 대형 화면 |

---

## 모바일 최적화

### Safe Area (iOS 노치 대응)

```css
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 뷰포트 설정

```tsx
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#dc2626",
};
```

---

## 터치 영역 (NDS 접근성 기준)

NDS 디자인가이드 + WCAG 접근성 기준 적용. 모바일 앱이므로 최소 40px 터치 영역 확보.

| UI 요소 | 크기 | Tailwind | NDS 최소 기준 |
|---------|------|----------|-------------|
| Button default | 40px | `h-10` | 40px |
| Button sm | 32px | `h-8` | 32px (밀집 UI) |
| Button lg | 44px | `h-11` | 44px |
| Button icon | 40×40px | `size-10` | 40px |
| Input | 40px | `h-10` | 36px |
| 하단 네비게이션 | 64px | `h-16` | 52px |
| 뒤로가기 버튼 | 44×44px | `w-11 h-11` | 44px |

---

## 애니메이션

정의 위치: `src/app/globals.css`

### 커스텀 애니메이션

| 클래스 | 효과 | 용도 |
|--------|------|------|
| `animate-fade-in` | opacity 0→1 (0.2s ease-out) | 모달 오버레이 |
| `animate-slide-up` | translateY(100%)→0 (0.3s ease-out) | 바텀시트 |
| `animate-scale-in` | scale(0.95)→1 (0.2s ease-out) | 다이얼로그 |
| `animate-fade-in-up` | translateY(10px)→0 + opacity (0.4s ease-out) | 리스트 항목 |

### 그림자

| 클래스 | 값 |
|--------|---|
| `shadow-premium` | `0 4px 20px rgba(0, 0, 0, 0.1)` |

### Radix UI 애니메이션 (tw-animate-css)

```
data-[state=open]:animate-in
data-[state=closed]:animate-out
data-[state=closed]:fade-out-0
data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95
data-[state=open]:zoom-in-95
```

---

## 모달/팝업 패턴

### 유형

| 유형 | 위치 | 용도 | 닫기 |
|------|------|------|------|
| 바텀시트 | 하단 슬라이드 업 | 리뷰 작성, 맛집 수정 | X 버튼 / 배경 터치 |
| 센터 모달 | 화면 중앙 | 로그인, 맛집 등록, 비밀번호 변경 | X 버튼 |

### 스크롤 방지 패턴

모든 모달에서 body overflow hidden 적용:

```tsx
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }
}, [isOpen]);
```

---

## 유틸리티

### 줄 수 제한

```css
.line-clamp-1  /* 최대 1줄, 넘치면 ... */
.line-clamp-2  /* 최대 2줄, 넘치면 ... */
```

### 스크롤바 숨기기

```css
.scrollbar-hide  /* 스크롤바 숨기기 (가로 스크롤 영역 등) */
```

---

## 주요 파일 참조

| 역할 | 파일 경로 |
|------|----------|
| 테마/색상/애니메이션 변수 | `src/app/globals.css` |
| 레이아웃/폰트/Toaster | `src/app/layout.tsx` |
| 클래스 유틸리티 | `src/lib/utils.ts` |
| UI 컴포넌트 | `src/components/ui/` |
| 빈 화면 컴포넌트 | `src/components/ui/empty-state.tsx` |
| 하단 네비게이션 | `src/components/bottom-nav.tsx` |
| 메인 페이지 (헤더 포함) | `src/app/page.tsx` |

---

## 디자인 기준 문서

- **HNW 디자인가이드**: NDS (NH Design System) 기반 — 탭, 팝업, 넛징, 접근성, UX Writing
- **적용일**: 2026-02-07
- **변경 사항**: Pretendard 폰트, sonner 토스트, 40px 터치 영역, 글래스모피즘 헤더, 공통 애니메이션, EmptyState 컴포넌트
