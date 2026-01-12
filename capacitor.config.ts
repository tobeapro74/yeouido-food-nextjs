import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yeoidohanki.app',
  appName: '여의도한끼',
  webDir: 'www',
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
  },
  server: {
    // 배포된 웹앱 URL을 로드
    url: 'https://yeouido-food.vercel.app',
    cleartext: false,
  },
};

export default config;
