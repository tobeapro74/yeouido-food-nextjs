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
  return (window as unknown as Record<string, unknown> & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() === true;
}

// ============ 카카오 로그인 ============

export async function kakaoLogin() {
  const redirectUri =
    process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ||
    `${window.location.origin}/auth/kakao/callback`;

  const restKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  if (!restKey) return;

  const native = isCapacitorNative();
  const stateParam = native ? "&state=native" : "";
  const oauthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${restKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code${stateParam}`;

  if (native) {
    try {
      // @capacitor/browser가 설치된 경우에만 동적 import
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await (Function('return import("@capacitor/browser")')() as Promise<any>);
      await mod.Browser.open({ url: oauthUrl, presentationStyle: "popover" });
    } catch {
      window.location.href = oauthUrl;
    }
  } else {
    window.location.href = oauthUrl;
  }
}
