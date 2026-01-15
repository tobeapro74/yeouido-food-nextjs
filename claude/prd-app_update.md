# iOS 앱 업데이트 프로세스 가이드

## 개요

이 문서는 Capacitor 기반 웹앱을 iOS 앱으로 배포하고 업데이트하는 프로세스를 설명합니다.

---

## 📱 초기 개발 → 첫 배포 프로세스

| 순서 | 단계 | 명령어/작업 |
|------|------|-------------|
| **1** | 웹 코드 수정 | Next.js 소스 코드 수정 (`src/` 폴더) |
| **2** | 웹 빌드 | `npm run build` |
| **3** | Capacitor 동기화 | `npx cap sync ios` |
| **4** | Xcode 열기 | `npx cap open ios` |
| **5** | 앱 버전 설정 | Xcode에서 Version, Build 번호 설정 |
| **6** | Archive 생성 | Xcode → Product → Archive |
| **7** | App Store Connect 업로드 | Xcode → Distribute App |
| **8** | TestFlight/심사 제출 | App Store Connect에서 심사 요청 |
| **9** | 앱 스토어 출시 | 심사 통과 후 출시 |

---

## 🔄 앱 배포 이후 업데이트 프로세스

앱 출시 후 기능 추가, 버그 수정 등의 업데이트가 필요할 때 따르는 프로세스입니다.

| 순서 | 단계 | 명령어/작업 | 설명 |
|------|------|-------------|------|
| **1** | 웹 코드 수정 | `src/` 폴더 내 파일 수정 | 기능 추가, 버그 수정 등 |
| **2** | 로컬 테스트 | `npm run dev` | 브라우저에서 먼저 테스트 |
| **3** | 웹 빌드 | `npm run build` | 프로덕션 빌드 생성 |
| **4** | Capacitor 동기화 | `npx cap sync ios` | 빌드된 웹을 iOS 프로젝트에 복사 |
| **5** | Xcode 열기 | `npx cap open ios` | iOS 프로젝트 열기 |
| **6** | **버전 번호 증가** | Xcode → General → Version/Build | ⚠️ **필수!** 반드시 올려야 함 |
| **7** | iOS 시뮬레이터 테스트 | Xcode → Run (▶️) | 실제 앱에서 테스트 |
| **8** | Archive 생성 | Product → Archive | 배포용 빌드 생성 |
| **9** | App Store Connect 업로드 | Distribute App → App Store Connect | 새 빌드 업로드 |
| **10** | TestFlight 테스트 (선택) | App Store Connect | 내부/외부 테스터 테스트 |
| **11** | 심사 제출 | App Store Connect → 심사 요청 | 새 버전 심사 제출 |
| **12** | 출시 | 심사 통과 후 | 자동/수동 출시 선택 |

---

## ⚡ 간단 요약 (핵심 명령어)

```bash
# 1. 코드 수정 후 빌드
npm run build

# 2. iOS 프로젝트에 동기화
npx cap sync ios

# 3. Xcode 열기
npx cap open ios

# 4. Xcode에서: 버전 올리기 → Archive → 업로드 → 심사 제출
```

---

## ⚠️ 중요 주의사항

### 버전 관리

| 항목 | 설명 |
|------|------|
| **Version** (예: 1.0.1) | 사용자에게 보이는 버전, 기능 추가 시 올림 |
| **Build** (예: 2, 3, 4...) | 같은 Version 내 수정 시 올림 |

- 매 업데이트마다 Version 또는 Build 번호를 **반드시** 올려야 함
- 같은 버전/빌드 번호로는 App Store Connect에 업로드 불가

### 심사 관련

| 항목 | 설명 |
|------|------|
| **심사 시간** | 보통 24~48시간 소요 (간단한 수정은 더 빠름) |
| **긴급 수정** | Apple에 "긴급 수정(Expedited Review)" 요청 가능 |

---

## 💡 자주 묻는 질문

### Q: 웹 코드만 수정해도 앱 업데이트가 필요한가요?

**네, 필요합니다.** Capacitor 앱은 웹 코드가 앱 안에 번들로 포함되기 때문에, 웹 코드만 수정하더라도 App Store 업데이트를 통해 배포해야 합니다.

### Q: 버전 번호는 어떻게 올려야 하나요?

- **메이저 기능 추가**: 1.0.0 → 2.0.0
- **일반 기능 추가/개선**: 1.0.0 → 1.1.0
- **버그 수정**: 1.0.0 → 1.0.1
- **같은 버전 내 빌드 수정**: Build 번호만 증가 (1 → 2 → 3)

### Q: TestFlight 테스트는 필수인가요?

필수는 아니지만, 실제 기기에서 테스트할 수 있어 **권장**됩니다. 특히 큰 업데이트 전에는 내부 테스터를 통해 검증하는 것이 좋습니다.

---

## 📋 업데이트 체크리스트

업데이트 배포 전 확인할 사항:

- [ ] 웹 코드 수정 완료
- [ ] `npm run dev`로 로컬 테스트 완료
- [ ] `npm run build` 성공
- [ ] `npx cap sync ios` 실행
- [ ] Xcode에서 Version 또는 Build 번호 증가
- [ ] iOS 시뮬레이터/실제 기기 테스트 완료
- [ ] Archive 생성 성공
- [ ] App Store Connect 업로드 완료
- [ ] (선택) TestFlight 테스트 완료
- [ ] 심사 제출

---

## 관련 문서

- [iOS 앱 배포 가이드](../docs/app%20distribution.md)
