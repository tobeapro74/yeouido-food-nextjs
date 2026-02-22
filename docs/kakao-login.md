# 카카오 로그인 구현 가이드

> Next.js (App Router) + Capacitor iOS 앱에서 카카오 OAuth 로그인을 구현하는 완전 가이드.
> 이 문서만 보고 다른 프로젝트에 동일하게 적용할 수 있도록 작성됨.

---

## 목차

1. [동작 흐름](#1-동작-흐름)
2. [아키텍처](#2-아키텍처)
3. [사전 준비](#3-사전-준비)
4. [구현 파일 목록](#4-구현-파일-목록)
5. [코드 구현](#5-코드-구현)
6. [iOS 네이티브 설정](#6-ios-네이티브-설정)
7. [환경변수](#7-환경변수)
8. [체크리스트](#8-체크리스트)
9. [트러블슈팅](#9-트러블슈팅)

---

## 1. 동작 흐름

### 웹 브라우저

```
사용자 → 카카오 로그인 버튼 클릭
  → window.location.href로 카카오 OAuth 페이지 이동
  → 카카오 인증 완료
  → /auth/kakao/callback 으로 리다이렉트 (code 파라미터)
  → 콜백 페이지에서 /api/auth/kakao POST (인가코드 전달)
  → 서버: 토큰 교환 → 사용자 정보 → DB 조회/생성 → JWT + httpOnly 쿠키 설정
  → window.location.replace("/") 로 메인 이동
  → 로그인 완료
```

### iOS 네이티브 앱 (Capacitor)

```
사용자 → 카카오 로그인 버튼 클릭
  → Browser.open()으로 SFSafariViewController 열기 (state=native 파라미터 추가)
  → 카카오 인증 완료
  → /auth/kakao/callback?code=...&state=native 로 리다이렉트
  → 콜백 페이지에서 /api/auth/kakao POST (인가코드 전달)
  → 서버: JWT 발급 + 응답에 token 포함
  → 콜백 페이지: window.location.href = "앱스킴://auth?token=..." (딥링크)
  → 앱의 appUrlOpen 리스너가 딥링크 수신
  → Browser.close()로 SFSafariViewController 자동 닫기
  → window.location.href = "/api/auth/set-token?token=..." (GET 요청)
  → 서버: JWT 검증 → httpOnly 쿠키 설정 → "/" 리다이렉트
  → 로그인 완료
```

### 핵심 포인트

| 구분 | 웹 | iOS 네이티브 |
|------|-----|-------------|
| 카카오 페이지 열기 | `window.location.href` | `Browser.open()` (SFSafariViewController) |
| 콜백 처리 | 쿠키가 같은 브라우저에 설정됨 | SFSafariViewController ≠ WebView (쿠키 공유 안 됨) |
| 토큰 전달 | 불필요 (쿠키로 충분) | 딥링크로 JWT 토큰 전달 |
| 쿠키 설정 | /api/auth/kakao에서 직접 | /api/auth/set-token GET으로 WebView에서 설정 |

---

## 2. 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│  프론트엔드 (클라이언트)                                     │
│                                                         │
│  src/lib/kakao.ts          카카오 SDK 초기화 + 로그인 실행   │
│  src/components/auth-modal 카카오 로그인 버튼 UI            │
│  src/app/auth/kakao/callback/page.tsx  OAuth 콜백 처리     │
│  src/app/page.tsx          딥링크 리스너 (네이티브 전용)      │
│  src/app/layout.tsx        카카오 JS SDK 스크립트 로드       │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│  백엔드 (API Routes)                                      │
│                                                         │
│  /api/auth/kakao       인가코드→토큰교환→DB→JWT+쿠키        │
│  /api/auth/set-token   딥링크 토큰→쿠키 설정 (GET/POST)     │
│  /api/auth/me          현재 로그인 사용자 조회               │
│  /api/auth/login       이메일 로그인 (카카오 전용 계정 분기)   │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│  iOS 네이티브 설정                                         │
│                                                         │
│  Info.plist              URL Scheme (딥링크) 등록          │
│  capacitor.config.ts     서버 URL, 플러그인 설정            │
│  @capacitor/browser      SFSafariViewController 제어      │
│  @capacitor/app          딥링크(appUrlOpen) 이벤트 수신     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 사전 준비

### 3-1. 카카오 개발자 콘솔 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com) → 내 애플리케이션 → 앱 생성
2. **앱 키 확인**:
   - REST API 키 → `KAKAO_REST_API_KEY` / `NEXT_PUBLIC_KAKAO_REST_API_KEY`
   - JavaScript 키 → `NEXT_PUBLIC_KAKAO_JS_KEY`
3. **플랫폼 등록**:
   - 웹 플랫폼: `https://your-app.vercel.app` (배포 URL)
4. **카카오 로그인 활성화**:
   - 제품 설정 → 카카오 로그인 → 활성화 ON
   - Redirect URI 등록: `https://your-app.vercel.app/auth/kakao/callback`
5. **동의 항목 설정**:
   - 닉네임: 필수 동의
   - 이메일: 선택 동의 (권장)
   - 프로필 사진: 선택 동의
6. **Client Secret (선택)**:
   - 보안 → Client Secret → 코드 생성 → 활성화

> **주의**: 리다이렉트 URI는 정확히 일치해야 함. 끝에 `/` 없이 등록.

### 3-2. npm 패키지 설치

```bash
npm install @capacitor/browser @capacitor/app
npx cap sync ios
```

---

## 4. 구현 파일 목록

| 파일 | 역할 | 신규/수정 |
|------|------|----------|
| `src/lib/kakao.ts` | SDK 초기화 + 로그인 실행 | 신규 |
| `src/app/layout.tsx` | 카카오 JS SDK `<Script>` 추가 | 수정 |
| `src/components/auth-modal.tsx` | 카카오 로그인 버튼 추가 | 수정 |
| `src/app/auth/kakao/callback/page.tsx` | OAuth 콜백 페이지 | 신규 |
| `src/app/api/auth/kakao/route.ts` | 인가코드→토큰교환→DB→JWT | 신규 |
| `src/app/api/auth/set-token/route.ts` | 딥링크 토큰→쿠키 (GET/POST) | 신규 |
| `src/app/api/auth/login/route.ts` | 카카오 전용 계정 분기 추가 | 수정 |
| `src/app/api/auth/me/route.ts` | profile_image, has_password 추가 | 수정 |
| `src/app/page.tsx` | 딥링크 리스너 추가 | 수정 |
| `src/lib/types.ts` | JWTPayload에 profile_image 추가 | 수정 |
| `capacitor.config.ts` | 플러그인 설정 확인 | 확인 |
| `ios/App/App/Info.plist` | URL Scheme 등록 | 수정 |

---

## 5. 코드 구현

### 5-1. `src/lib/kakao.ts`

```typescript
// ============ 카카오 SDK 타입 확장 ============

interface KakaoAuth {
  authorize: (options: { redirectUri: string; scope?: string }) => void;
}

export interface KakaoSDK {
  isInitialized: () => boolean;
  init: (appKey: string) => void;
  Auth: KakaoAuth;
}

declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

// ============ SDK 초기화 ============

export function initKakaoSDK(): boolean {
  const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (typeof window === "undefined" || !window.Kakao || !KAKAO_KEY) return false;

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_KEY);
  }
  return window.Kakao.isInitialized();
}

// ============ Capacitor 환경 감지 ============

function isCapacitorNative(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).Capacitor?.isNativePlatform?.() === true;
}

// ============ 카카오 로그인 ============

export async function kakaoLogin() {
  const redirectUri =
    process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ||
    `${window.location.origin}/auth/kakao/callback`;

  const restKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  if (!restKey) return;

  const native = isCapacitorNative();
  // 네이티브 앱에서는 state=native를 전달하여 콜백에서 딥링크 분기
  const stateParam = native ? "&state=native" : "";
  const oauthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${restKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code${stateParam}`;

  if (native) {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: oauthUrl, presentationStyle: "popover" });
    } catch {
      // Browser 플러그인이 네이티브에 없는 경우 fallback
      window.location.href = oauthUrl;
    }
  } else {
    window.location.href = oauthUrl;
  }
}
```

**커스터마이즈 포인트:**
- 환경변수명은 그대로 사용 가능
- `presentationStyle: "popover"` → SFSafariViewController를 모달로 표시

### 5-2. `src/app/layout.tsx` — 카카오 SDK 스크립트 추가

```tsx
import Script from "next/script";

// ... layout 컴포넌트 내 <body> 안에 추가:
<Script
  src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
  strategy="afterInteractive"
/>
```

### 5-3. `src/app/auth/kakao/callback/page.tsx`

```tsx
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    // 네이티브 앱에서 보낸 요청은 state=native 파라미터가 있음
    const isNative = searchParams.get("state") === "native";

    if (errorParam) {
      setError("카카오 로그인이 취소되었습니다.");
      setTimeout(() => router.replace("/"), 2000);
      return;
    }

    if (!code) {
      setError("인가 코드가 없습니다.");
      setTimeout(() => router.replace("/"), 2000);
      return;
    }

    const processLogin = async () => {
      try {
        const res = await fetch("/api/auth/kakao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();

        if (!data.success) {
          setError(data.error || "카카오 로그인에 실패했습니다.");
          setTimeout(() => router.replace("/"), 2000);
          return;
        }

        if (isNative) {
          // SFSafariViewController에서 열린 경우
          // 딥링크로 토큰을 전달하여 앱 WebView로 복귀
          const token = data.data.token;
          // ⚠️ 앱 스킴을 자기 프로젝트에 맞게 변경
          const deepLink = `앱스킴://auth?token=${encodeURIComponent(token)}`;
          window.location.href = deepLink;
          // ⚠️ 딥링크 실행 후 절대 다른 페이지로 이동하지 않음!
          //    setTimeout(() => window.location.replace("/") 같은 fallback을 넣으면
          //    딥링크가 취소되어 앱으로 돌아가지 못함
        } else {
          // 웹 브라우저: 쿠키가 이미 설정됨 → 바로 메인으로 이동
          window.location.replace("/");
        }
      } catch {
        setError("네트워크 오류가 발생했습니다.");
        setTimeout(() => router.replace("/"), 2000);
      }
    };

    processLogin();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4">
      {error ? (
        <div className="max-w-sm px-4 text-center space-y-3">
          <p className="text-destructive text-sm font-medium">카카오 인증에 실패했습니다.</p>
          <p className="text-muted-foreground text-xs break-all whitespace-pre-wrap">{error}</p>
          <button
            onClick={() => router.replace("/")}
            className="text-xs text-primary underline"
          >
            메인 페이지로 돌아가기
          </button>
        </div>
      ) : (
        <>
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">카카오 로그인 처리 중...</p>
        </>
      )}
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-dvh">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <KakaoCallbackContent />
    </Suspense>
  );
}
```

### 5-4. `src/app/api/auth/kakao/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";  // ⚠️ 자기 프로젝트의 DB 연결 함수
import jwt from "jsonwebtoken";
import type { JWTPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY!;
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;
const KAKAO_REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI!;

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: "인가 코드가 필요합니다." },
        { status: 400 }
      );
    }

    // ━━━━━━━━━━ 1단계: 인가코드 → access_token 교환 ━━━━━━━━━━
    const tokenParams: Record<string, string> = {
      grant_type: "authorization_code",
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: KAKAO_REDIRECT_URI,
      code,
    };
    if (KAKAO_CLIENT_SECRET) {
      tokenParams.client_secret = KAKAO_CLIENT_SECRET;
    }

    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(tokenParams),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("카카오 토큰 교환 실패:", tokenData);
      return NextResponse.json(
        { success: false, error: `카카오 인증에 실패했습니다.` },
        { status: 401 }
      );
    }

    // ━━━━━━━━━━ 2단계: 사용자 정보 조회 ━━━━━━━━━━
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const kakaoUser = await userRes.json();

    if (!userRes.ok || !kakaoUser.id) {
      return NextResponse.json(
        { success: false, error: "카카오 사용자 정보를 가져올 수 없습니다." },
        { status: 401 }
      );
    }

    const kakaoId = kakaoUser.id;
    const kakaoNickname = kakaoUser.kakao_account?.profile?.nickname || "카카오 사용자";
    const kakaoProfileImage = kakaoUser.kakao_account?.profile?.profile_image_url || null;
    const kakaoEmail = kakaoUser.kakao_account?.email?.toLowerCase() || null;

    // ━━━━━━━━━━ 3단계: DB 조회/생성 ━━━━━━━━━━
    // ⚠️ DB 연결 방식을 자기 프로젝트에 맞게 수정
    const db = await getDb();
    const usersCollection = db.collection("users");  // ⚠️ 컬렉션명 확인

    // 3-a: kakao_id로 기존 사용자 조회
    let user: any = await usersCollection.findOne({ kakao_id: kakaoId });

    if (!user && kakaoEmail) {
      // 3-b: 같은 이메일의 기존 계정이 있으면 kakao_id 연동
      const emailUser = await usersCollection.findOne({ email: kakaoEmail });
      if (emailUser) {
        await usersCollection.updateOne(
          { id: emailUser.id },
          {
            $set: {
              kakao_id: kakaoId,
              profile_image: emailUser.profile_image || kakaoProfileImage,
              updated_at: new Date(),
            },
          }
        );
        user = { ...emailUser, kakao_id: kakaoId };
      }
    }

    if (!user) {
      // 3-c: 신규 사용자 생성
      const lastUser = await usersCollection
        .find({})
        .sort({ id: -1 })
        .limit(1)
        .toArray();
      const newId = lastUser.length > 0 ? lastUser[0].id + 1 : 1;

      const now = new Date();
      const newUser = {
        id: newId,
        name: kakaoNickname,
        email: kakaoEmail,
        password: null,       // 카카오 전용 사용자는 비밀번호 없음
        kakao_id: kakaoId,
        profile_image: kakaoProfileImage,
        is_admin: false,
        created_at: now,
        updated_at: now,
      };

      await usersCollection.insertOne(newUser);
      user = newUser;
    }

    // ━━━━━━━━━━ 4단계: JWT 발급 + 쿠키 설정 ━━━━━━━━━━
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email || "",
      name: user.name,
      is_admin: user.is_admin || false,
      profile_image: user.profile_image || null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          profile_image: user.profile_image || null,
          is_admin: user.is_admin || false,
        },
        token,  // ⚠️ 네이티브 앱 딥링크용으로 token을 반드시 포함
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,  // 7일
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("카카오 로그인 오류:", error);
    return NextResponse.json(
      { success: false, error: "카카오 로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
```

### 5-5. `src/app/api/auth/set-token/route.ts`

> **가장 중요한 파일.** CapacitorHttp가 fetch를 프록시하므로 GET 방식이 필수.

```typescript
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import type { JWTPayload } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// GET: 딥링크에서 토큰을 받아 쿠키 설정 후 메인 페이지로 리다이렉트
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    jwt.verify(token, JWT_SECRET) as JWTPayload;

    const response = NextResponse.redirect(new URL("/", request.url));

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

// POST: 기존 방식 (웹에서 사용, CapacitorHttp 없는 환경)
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "토큰이 필요합니다." },
        { status: 400 }
      );
    }

    jwt.verify(token, JWT_SECRET) as JWTPayload;

    const response = NextResponse.json({ success: true });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "유효하지 않은 토큰입니다." },
      { status: 401 }
    );
  }
}
```

### 5-6. `src/app/page.tsx` — 딥링크 리스너

메인 페이지 컴포넌트의 `useEffect` 안에 추가:

```tsx
// 네이티브 앱: 카카오 로그인 딥링크 수신 처리
useEffect(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isNative = (window as any).Capacitor?.isNativePlatform?.() === true;
  if (!isNative) return;

  let cleanup: (() => void) | undefined;

  const setupDeepLinkListener = async () => {
    try {
      const { App: CapApp } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");

      const listener = await CapApp.addListener("appUrlOpen", async (event) => {
        // ⚠️ 앱 스킴을 자기 프로젝트에 맞게 변경
        if (event.url.startsWith("앱스킴://auth")) {
          // SFSafariViewController 먼저 닫기
          try { await Browser.close(); } catch { /* ignore */ }

          // URL에서 토큰 추출
          const tokenMatch = event.url.match(/[?&]token=([^&]+)/);
          const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

          if (token) {
            // GET 요청으로 쿠키 설정 후 메인 페이지로 리다이렉트
            window.location.href = `/api/auth/set-token?token=${encodeURIComponent(token)}`;
          }
        }
      });

      cleanup = () => listener.remove();
    } catch {
      // Capacitor App 플러그인 없는 경우 무시
    }
  };

  setupDeepLinkListener();
  return () => cleanup?.();
}, []);
```

### 5-7. 카카오 로그인 버튼 (auth-modal.tsx)

```tsx
import { initKakaoSDK, kakaoLogin } from "@/lib/kakao";

// 핸들러
const handleKakaoLogin = async () => {
  setError("");
  initKakaoSDK();
  await kakaoLogin();
};

// JSX — 로그인 탭에 추가
<div className="pt-4">
  <button
    type="button"
    onClick={handleKakaoLogin}
    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-medium text-[15px] transition-colors"
    style={{ backgroundColor: "#FEE500", color: "#000000" }}
  >
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 0.6C4.029 0.6 0 3.713 0 7.551C0 9.942 1.558 12.048 3.931 13.303L2.933 16.909C2.844 17.221 3.213 17.466 3.479 17.278L7.736 14.41C8.151 14.462 8.572 14.502 9 14.502C13.971 14.502 18 11.389 18 7.551C18 3.713 13.971 0.6 9 0.6Z"
        fill="#000000"
      />
    </svg>
    카카오로 로그인
  </button>
</div>

{/* 구분선 */}
<div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-border" />
  </div>
  <div className="relative flex justify-center text-xs">
    <span className="bg-background px-2 text-muted-foreground">또는</span>
  </div>
</div>
```

### 5-8. 이메일 로그인 API 수정 (`/api/auth/login/route.ts`)

기존 이메일 로그인에서 카카오 전용 계정 체크 추가:

```typescript
// 비밀번호 검증 전에 추가
if (!user.password && user.kakao_id) {
  return NextResponse.json(
    { success: false, error: "카카오 로그인으로 가입된 계정입니다. 카카오 로그인을 이용해주세요." },
    { status: 400 }
  );
}
```

---

## 6. iOS 네이티브 설정

### 6-1. Info.plist — URL Scheme 등록

`ios/App/App/Info.plist`에 추가:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>앱스킴</string>  <!-- 예: yeouido, taiwanfood -->
    </array>
    <key>CFBundleURLName</key>
    <string>com.your.app.id</string>
  </dict>
</array>
```

### 6-2. capacitor.config.ts

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.your.app.id',
  appName: '앱 이름',
  webDir: 'www',
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
  },
  server: {
    url: 'https://your-app.vercel.app',
    cleartext: false,
    // ⚠️ allowNavigation에 카카오를 넣지 않음!
    // WKWebView 안에서 카카오 로그인이 작동하지 않기 때문
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
```

### 6-3. Capacitor Sync

```bash
npx cap sync ios
```

sync 후 `ios/App/App/capacitor.config.json`에 `packageClassList`에 `AppPlugin`, `CAPBrowserPlugin`이 포함되었는지 확인:

```json
{
  "packageClassList": [
    "AppPlugin",
    "CAPBrowserPlugin",
    ...
  ]
}
```

---

## 7. 환경변수

### .env.local (로컬)

```bash
# Kakao Login
NEXT_PUBLIC_KAKAO_REST_API_KEY=카카오_REST_API_키
NEXT_PUBLIC_KAKAO_JS_KEY=카카오_JavaScript_키
NEXT_PUBLIC_KAKAO_REDIRECT_URI=https://your-app.vercel.app/auth/kakao/callback
KAKAO_REST_API_KEY=카카오_REST_API_키
KAKAO_CLIENT_SECRET=카카오_Client_Secret
```

### Vercel 환경변수

Vercel Dashboard → Settings → Environment Variables에 동일한 5개 변수 등록.

> **`NEXT_PUBLIC_` 접두사**: 클라이언트에서 사용하는 변수. REST_API_KEY는 클라이언트(OAuth URL 생성)와 서버(토큰 교환) 모두에서 사용하므로 양쪽 다 등록.

---

## 8. 체크리스트

### 구현 완료 체크

- [ ] 카카오 개발자 콘솔 앱 생성 + Redirect URI 등록
- [ ] 환경변수 5개 설정 (로컬 + Vercel)
- [ ] `@capacitor/browser`, `@capacitor/app` 설치
- [ ] `src/lib/kakao.ts` 생성
- [ ] `layout.tsx`에 카카오 SDK 스크립트 추가
- [ ] `auth-modal.tsx`에 카카오 버튼 + 핸들러 추가
- [ ] `/auth/kakao/callback/page.tsx` 생성
- [ ] `/api/auth/kakao/route.ts` 생성
- [ ] `/api/auth/set-token/route.ts` 생성 (GET + POST)
- [ ] `page.tsx`에 딥링크 리스너 추가
- [ ] `/api/auth/login`에 카카오 전용 계정 분기 추가
- [ ] `Info.plist`에 URL Scheme 등록
- [ ] `npx cap sync ios` 실행
- [ ] `npm run build` 성공 확인
- [ ] Vercel 배포 완료 확인

### 테스트 체크

- [ ] **웹 브라우저**: 카카오 로그인 → 콜백 → 메인 이동 → 로그인 상태
- [ ] **웹 브라우저**: 새로고침 후 로그인 유지
- [ ] **iOS 앱**: 카카오 로그인 → SFSafariViewController → 인증 → 팝업 자동 닫힘 → 로그인 상태
- [ ] **iOS 앱**: 새로고침 후 로그인 유지
- [ ] **기존 이메일 로그인**: 정상 동작 확인
- [ ] **카카오 전용 계정**: 이메일 로그인 시 안내 메시지 표시

---

## 9. 트러블슈팅

### 9-1. WKWebView에서 카카오 로그인 버튼이 안 눌림

**증상**: `allowNavigation: ['*.kakao.com']`으로 WebView 안에서 카카오 로그인 페이지를 열었으나, 로그인 버튼을 눌러도 아무 반응 없음. "브라우저 설정을 확인해 주세요" 경고 표시.

**원인**: 카카오 로그인 폼은 내부적으로 `window.open()`으로 새 창을 열어 인증을 처리함. WKWebView는 기본적으로 새 창 열기를 차단.

**해결**: `allowNavigation`을 사용하지 않고, `Browser.open()`으로 SFSafariViewController를 열어 카카오 인증을 처리. **절대 `allowNavigation`에 카카오를 추가하지 않을 것.**

---

### 9-2. 딥링크 실행 후 앱으로 안 돌아옴

**증상**: SFSafariViewController에서 콜백 페이지가 로딩되고 메인 페이지(`/`)로 이동해버림. 앱으로 돌아가지 않음.

**원인**: 딥링크 `window.location.href = "앱스킴://auth?token=..."` 실행 후 fallback으로 `setTimeout(() => window.location.replace("/"), 1500)`을 넣으면, **iOS가 딥링크를 처리하기 전에 페이지가 이동**하여 딥링크가 취소됨.

**해결**: `isNative`일 때 딥링크 실행 후 **절대 다른 URL로 이동하지 않음**. fallback setTimeout 제거.

```typescript
// ❌ 잘못된 코드
window.location.href = deepLink;
setTimeout(() => window.location.replace("/"), 1500); // 딥링크 취소됨!

// ✅ 올바른 코드
window.location.href = deepLink;
// 끝. 아무것도 하지 않음.
```

---

### 9-3. 딥링크로 앱에 돌아왔는데 로그인 안 됨

**증상**: SFSafariViewController가 닫히고 앱으로 돌아왔으나, 로그인 상태가 아님.

**원인**: `CapacitorHttp` 플러그인이 `fetch()` 요청을 네이티브 HTTP 클라이언트로 프록시함. 이 경우 서버의 `Set-Cookie` 응답이 **WKWebView 쿠키 스토어에 반영되지 않음.**

**해결**: `fetch()`로 POST 대신 `window.location.href`로 GET 요청을 보내 브라우저 레벨에서 쿠키를 설정.

```typescript
// ❌ 잘못된 코드 — CapacitorHttp가 프록시하여 쿠키 미반영
await fetch("/api/auth/set-token", {
  method: "POST",
  body: JSON.stringify({ token }),
});

// ✅ 올바른 코드 — WebView가 직접 HTTP 요청 → Set-Cookie 반영
window.location.href = `/api/auth/set-token?token=${encodeURIComponent(token)}`;
```

`set-token` API에 **GET 핸들러**를 추가하여 쿠키 설정 + 메인 리다이렉트 처리.

---

### 9-4. `npx cap sync ios` 후 설정이 반영 안 됨

**증상**: `capacitor.config.ts`를 수정했는데 앱에 반영 안 됨.

**원인**: `npx cap sync ios`가 `ios/App/App/capacitor.config.json`을 재생성하지만, 이전 빌드 캐시가 남아있을 수 있음.

**해결**:
1. `npx cap sync ios` 실행
2. `ios/App/App/capacitor.config.json` 내용 직접 확인
3. Xcode에서 Clean Build (Product → Clean Build Folder)
4. 다시 빌드

---

### 9-5. SFSafariViewController가 자동으로 안 닫힘

**증상**: 카카오 로그인 완료 후 앱으로 돌아왔는데 SFSafariViewController 팝업이 남아있음.

**원인**: 딥링크 리스너에서 `Browser.close()`를 호출하지 않았거나, 호출 순서가 잘못됨.

**해결**: `appUrlOpen` 리스너에서 딥링크를 수신하면 **가장 먼저** `Browser.close()`를 호출.

```typescript
CapApp.addListener("appUrlOpen", async (event) => {
  if (event.url.startsWith("앱스킴://auth")) {
    // ✅ 가장 먼저 SFSafariViewController 닫기
    try { await Browser.close(); } catch {}

    // 그 다음 토큰 처리
    // ...
  }
});
```

---

### 9-6. 커스텀 URL 스킴 파싱 주의

**증상**: `new URL("앱스킴://auth?token=...")` 파싱 시 `pathname`이나 `hostname`이 예상과 다름.

**원인**: 커스텀 스킴(`앱스킴://`)은 표준 URL이 아니므로, 브라우저/환경에 따라 `new URL()` 파싱 결과가 다를 수 있음.

**해결**: `new URL()` 대신 **문자열 매칭**으로 안전하게 처리.

```typescript
// ❌ 불안정 — 환경별 파싱 차이
const url = new URL(event.url);
if (url.protocol === "앱스킴:" && url.pathname === "//auth") { ... }

// ✅ 안전 — 문자열 매칭
if (event.url.startsWith("앱스킴://auth")) {
  const tokenMatch = event.url.match(/[?&]token=([^&]+)/);
  const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
}
```

---

### 9-7. 새 프로젝트 적용 시 변경해야 할 값들

| 항목 | 예시 (여의도한끼) | 변경 필요 |
|------|------------------|----------|
| 앱 스킴 | `yeouido` | `앱고유스킴`으로 변경 |
| 앱 ID | `com.yeoidohanki.app` | 자기 앱 번들 ID |
| 서버 URL | `yeouido-food.vercel.app` | 배포 URL |
| JWT Secret | `yeouido-food-secret-key` | 자기 프로젝트 시크릿 |
| DB 연결 | `getDb()` | 자기 프로젝트의 DB 연결 함수 |
| 컬렉션명 | `users` | 자기 프로젝트의 사용자 컬렉션 |
| 카카오 앱 키 | (각각 다름) | 카카오 개발자 콘솔에서 확인 |

검색-치환으로 빠르게 적용: `yeouido` → `새앱스킴`, `com.yeoidohanki.app` → `새번들ID`

---

## 부록: DB 스키마 (users 컬렉션)

카카오 로그인을 지원하려면 users 컬렉션에 다음 필드가 필요:

```typescript
interface User {
  id: number;
  name: string;
  email: string | null;
  password: string | null;    // 카카오 전용은 null
  kakao_id?: number;          // 카카오 고유 ID
  profile_image?: string;     // 카카오 프로필 이미지 URL
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}
```

기존 이메일 사용자가 카카오로 로그인하면 `kakao_id`가 자동 연동됨 (이메일 매칭).
