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

// ============ 카카오 로그인 ============

export async function kakaoLogin() {
  const redirectUri =
    process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ||
    `${window.location.origin}/auth/kakao/callback`;

  const restKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  if (!restKey) return;

  const oauthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${restKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

  // 네이티브/웹 모두 WebView 내에서 직접 이동
  window.location.href = oauthUrl;
}
