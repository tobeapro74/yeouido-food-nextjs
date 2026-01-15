# iOS 앱 배포 가이드 (App Store 출시)

중학생도 쉽게 따라할 수 있는 iOS 앱 배포 완벽 가이드입니다.

---

## 목차

1. [사전 준비물](#사전-준비물)
2. [Part 1: Apple Developer Program 가입](#part-1-apple-developer-program-가입)
3. [Part 2: Xcode 설정 및 빌드](#part-2-xcode-설정-및-빌드)
4. [Part 3: App Store Connect 앱 등록](#part-3-app-store-connect-앱-등록)
5. [Part 4: 심사 제출](#part-4-심사-제출)
6. [문제 해결 (Troubleshooting)](#문제-해결-troubleshooting)

---

## 사전 준비물

시작하기 전에 다음 항목을 준비하세요:

- [ ] **Mac 컴퓨터** (macOS 최신 버전 권장)
- [ ] **Xcode** 설치 (App Store에서 무료 다운로드)
- [ ] **Apple ID** (없으면 새로 만들기) tobeapro@gmail.com / Ls@~
- [ ] **신용카드 또는 체크카드** (개발자 등록비 결제용)
- [ ] **연간 등록비 $99** (약 13만원)
- [ ] **앱 아이콘** (1024x1024 픽셀, PNG, 투명 배경 없이)
- [ ] **앱 스크린샷** (iPhone, iPad용)
- [ ] **개인정보 처리방침 URL** (웹페이지 필요)

---

## Part 1: Apple Developer Program 가입

### 1-1. Apple Developer 웹사이트 접속

1. 웹 브라우저에서 **[developer.apple.com](https://developer.apple.com)** 접속
2. 우측 상단 **"Account"** 클릭
3. **Apple ID로 로그인**

### 1-2. Developer Program 등록 시작

4. 로그인 후 **[developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll)** 접속
5. **"Start Your Enrollment"** 버튼 클릭
6. **"개인/개인 사업자"** 또는 **"조직"** 선택
   - 개인 앱이면 → **개인** 선택
   - 회사/단체면 → **조직** 선택

### 1-3. 개인 정보 입력

7. **이름** 확인 (Apple ID에 등록된 이름)
8. **연락처 정보** 입력
   - 전화번호: 국가코드 포함 (예: +82 10-1234-5678)
   - 이메일: 연락 가능한 이메일
9. **"Continue"** 클릭

### 1-4. 결제 및 완료

10. **결제 정보** 입력
    - 연간 $99 (약 13만원)
    - 신용카드/체크카드 정보 입력
11. **약관 동의** 체크
12. **"Purchase"** 클릭
13. **확인 이메일** 수신 (24~48시간 내 활성화)

> **참고:** 활성화까지 최대 48시간 소요될 수 있습니다. 이메일을 확인하세요!

---

## Part 2: Xcode 설정 및 빌드

### 2-1. Xcode 프로젝트 열기

1. **Xcode** 실행
2. **File → Open** 또는 프로젝트 폴더의 `.xcworkspace` 파일 더블클릭
3. 프로젝트가 열리면 좌측 **프로젝트 네비게이터**에서 프로젝트 이름 클릭

### 2-2. Signing & Capabilities 설정

4. 중앙 패널에서 **"Signing & Capabilities"** 탭 클릭
5. **"Automatically manage signing"** 체크 확인
6. **"Team"** 드롭다운에서 **본인 이름 (개인 팀)** 선택
   - 목록에 없으면: Xcode → Settings → Accounts → Apple ID 추가
7. **"Bundle Identifier"** 확인
   - 형식: `com.yourname.appname`
   - 예: `com.johnkim.taiwanfood`
   - 전 세계에서 유일해야 함!

### 2-3. 앱 아이콘 설정

8. 좌측에서 **Assets.xcassets** 폴더 클릭
9. **AppIcon** 선택
10. **1024x1024 픽셀 PNG 이미지** 드래그 앤 드롭

> **중요:** 앱 아이콘은 반드시:
>
> - 1024 x 1024 픽셀
> - PNG 형식
> - **투명 배경 없음** (alpha channel 없음)
> - 모서리는 사각형 (iOS가 자동으로 둥글게 처리)

### 2-4. 버전 번호 확인

11. **General** 탭 클릭
12. **Version**: 1.0 (첫 출시)
13. **Build**: 1 (빌드 번호)

### 2-5. iPhone 실기기 테스트 (선택사항)

14. **iPhone을 Mac에 USB로 연결**
15. iPhone에서 **"이 컴퓨터를 신뢰하시겠습니까?"** → **신뢰** 선택
16. Xcode 상단에서 **시뮬레이터 대신 본인 iPhone** 선택
17. **▶️ (Run)** 버튼 클릭
18. iPhone에서 **설정 → 일반 → VPN 및 기기 관리** → 개발자 앱 **신뢰**

### 2-6. Archive 생성 (앱 패키징)

19. Xcode 상단에서 빌드 대상을 **"Any iOS Device (arm64)"** 선택
    - 시뮬레이터가 아닌 실제 기기용으로 설정
20. 메뉴: **Product → Archive** 클릭
21. 빌드 완료까지 대기 (몇 분 소요)
22. **Organizer** 창이 자동으로 열림

### 2-7. App Store에 업로드

23. Organizer에서 방금 생성된 **Archive** 선택
24. **"Distribute App"** 버튼 클릭
25. **"App Store Connect"** 선택 → **Next**
26. **"Upload"** 선택 → **Next**
27. 옵션 확인 (기본값 유지) → **Next**
28. 인증서 선택 → **Next**
29. **"Upload"** 클릭
30. **키체인 암호 입력** 팝업 → Mac 로그인 암호 입력 → **"항상 허용"** 클릭
    - 여러 번 뜰 수 있음, 매번 **"항상 허용"** 선택
31. **"Upload Succeeded"** 메시지 확인
32. **"Done"** 클릭

> **참고:** 업로드 후 App Store Connect에서 빌드가 보이기까지 10~15분 소요됩니다.

---

## Part 3: App Store Connect 앱 등록

### 3-1. App Store Connect 접속

1. 웹 브라우저에서 **[appstoreconnect.apple.com](https://appstoreconnect.apple.com)** 접속
2. **Apple ID로 로그인**

### 3-2. 새 앱 생성

3. **"나의 앱"** 클릭
4. 좌측 상단 **"+"** 버튼 클릭 → **"신규 앱"** 선택
5. 앱 정보 입력:
   - **플랫폼**: iOS 체크
   - **이름**: 앱 이름 (App Store에 표시됨)
   - **기본 언어**: 한국어
   - **번들 ID**: Xcode에서 설정한 Bundle Identifier 선택
   - **SKU**: 고유 식별자 (예: taiwanfood001)
   - **사용자 액세스 권한**: 전체 액세스
6. **"생성"** 클릭

### 3-3. 앱 정보 입력

7. 좌측 메뉴 **"앱 정보"** 클릭
8. **카테고리** 설정:
   - 기본 카테고리: 음식 및 음료
   - 보조 카테고리: 여행 (선택사항)
9. **콘텐츠 권한** 설정:
   - "편집" 클릭
   - 타사 콘텐츠 사용 여부 선택:
     - 구글맵, 외부 API 사용하면 → **"예"** 선택
     - 자체 콘텐츠만 있으면 → **"아니요"** 선택
   - "완료" 클릭
10. **"저장"** 클릭

### 3-4. 가격 및 사용 가능 여부 설정

11. 좌측 메뉴 **"가격 책정 및 사용 가능 여부"** 클릭
12. **"가격 추가"** 클릭
    - 무료 앱: **₩0 (무료)** 선택
    - 유료 앱: 원하는 가격 선택
13. **"사용 가능 여부 설정"** 클릭
    - 배포할 국가/지역 선택
    - 전 세계: 모두 선택
    - 특정 국가만: 원하는 국가 선택
14. **"저장"** 클릭

### 3-5. 앱 개인정보 보호 설정

15. 좌측 메뉴 **"앱 개인정보 보호"** 클릭
16. **개인정보 처리방침 URL** 입력
    - 예: `https://yourapp.com/privacy`
17. **"시작하기"** 클릭
18. 데이터 수집 여부 선택:
    - 개인정보 수집 안 함: **"아니요, 데이터를 수집하지 않습니다"** 선택
    - 개인정보 수집함: **"예"** 선택 후 수집 항목 체크
19. **"저장"** 또는 **"게시"** 클릭

### 3-6. 연령 등급 설정

20. 좌측 메뉴 **"앱 정보"** → **연령 등급** 섹션
21. **"편집"** 클릭
22. 질문에 답변:
    - 폭력적인 콘텐츠? → 아니요
    - 성인 콘텐츠? → 아니요
    - 도박? → 아니요
    - (모든 질문에 "아니요" 선택하면 4+ 등급)
23. **"완료"** 클릭

### 3-7. 버전 정보 입력 (iOS 앱 1.0)

24. 좌측 메뉴에서 **"iOS 앱 1.0"** 클릭 (버전 페이지)

#### 스크린샷 업로드

25. **스크린샷** 섹션에서 기기별로 업로드:

**iPhone 스크린샷 (필수)**

- **6.7인치** (iPhone 14 Pro Max): 1290 x 2796 픽셀
- **6.5인치** (iPhone 11 Pro Max): 1284 x 2778 픽셀
- 최소 1장, 최대 10장

**iPad 스크린샷 (iPad 지원 시 필수)**

- **12.9인치** (iPad Pro): 2048 x 2732 픽셀
- 최소 1장, 최대 10장

> **팁:** 시뮬레이터에서 Cmd + S로 스크린샷 저장 가능

26. 각 기기 섹션에 스크린샷 **드래그 앤 드롭**

#### 앱 설명 입력

27. **프로모션 텍스트** (선택): 170자 이내 짧은 홍보 문구
28. **설명** (필수): 앱 상세 설명 (최대 4000자)
    ```
    예시:
    대만 맛집을 한눈에!

    - 현지인이 추천하는 진짜 맛집
    - 지도에서 바로 확인
    - 실시간 리뷰와 평점
    - 영업시간, 메뉴 정보 제공
    ```
29. **키워드**: 검색용 키워드 (쉼표로 구분, 100자 이내)
    ```
    예: 대만,맛집,여행,음식,타이베이,야시장
    ```
30. **지원 URL**: 앱 지원 웹페이지 URL
31. **마케팅 URL** (선택): 앱 홍보 페이지 URL

#### 빌드 선택

32. **빌드** 섹션에서 **"+"** 버튼 클릭
33. Xcode에서 업로드한 빌드 선택
    - 안 보이면 10~15분 후 새로고침
34. **"완료"** 클릭

#### 앱 암호화 설정

35. 빌드 선택 시 **암호화 관련 질문** 팝업:
    - 앱이 HTTPS만 사용: **"아니요, 암호화 알고리즘을 사용하지 않습니다"** 선택
    - 별도 암호화 기능 있음: **"예"** 선택 후 세부 사항 입력
36. **"완료"** 클릭

#### 앱 심사 정보

37. **앱 심사 정보** 섹션:
    - **로그인 필요**: 앱에 로그인 기능이 있으면 체크 후 테스트 계정 정보 입력
    - **연락처 정보**: 이름, 전화번호, 이메일 입력
    - **메모** (선택): 심사자에게 전달할 메모
38. **"저장"** 클릭

---

## Part 4: 심사 제출

### 4-1. 최종 확인

1. 모든 필수 항목이 입력되었는지 확인
2. 빨간색 경고 메시지가 없는지 확인
3. 앱 상태가 **"제출 준비 완료"**인지 확인

### 4-2. 심사 제출

4. 페이지 우측 상단 **"심사를 위해 제출"** 버튼 클릭
   - 버튼이 비활성화되어 있으면 누락된 항목 확인
5. **"제출"** 확인

### 4-3. 심사 대기

6. 앱 상태가 **"심사 대기 중"**으로 변경됨
7. 심사 기간: 보통 **24시간 ~ 3일**
8. 결과는 **이메일**로 통보

### 4-4. 심사 결과

**승인됨 (Approved)**

- 축하합니다! App Store에 앱이 출시됩니다.
- "판매 준비됨" 상태로 변경

**거부됨 (Rejected)**

- 거부 사유가 이메일로 전달됨
- Resolution Center에서 상세 내용 확인
- 문제 수정 후 재제출

---

## 문제 해결 (Troubleshooting)

### 자주 발생하는 에러와 해결 방법

#### 1. "Invalid app icon" 에러

**원인:** 앱 아이콘에 투명 배경(alpha channel)이 있음

**해결:**

```bash
# Python으로 alpha 채널 제거
python3 -c "
from PIL import Image
img = Image.open('AppIcon.png')
if img.mode == 'RGBA':
    background = Image.new('RGB', img.size, (255, 255, 255))
    background.paste(img, mask=img.split()[3])
    background.save('AppIcon_fixed.png', 'PNG')
"
```

또는 포토샵/피그마에서 배경색을 흰색으로 채우고 PNG로 저장

#### 2. "Bundle Identifier already exists" 에러

**원인:** 다른 앱이 같은 Bundle ID를 사용 중

**해결:**

- Xcode에서 Bundle Identifier 변경
- 예: `com.yourname.appname2`

#### 3. 키체인 암호 팝업이 계속 뜸

**원인:** 키체인 접근 권한 문제

**해결:**

1. 암호 입력 후 **"항상 허용"** 선택 (허용 X)
2. 여러 번 뜨면 매번 "항상 허용" 선택
3. 안 되면 Mac 재시작 후 다시 시도

#### 4. "Unlock device to continue" 메시지

**원인:** iPhone이 잠겨 있음

**해결:**

- iPhone 잠금 해제 (Face ID/암호)

#### 5. iPhone이 Xcode에서 안 보임

**해결:**

1. USB 케이블 다시 연결
2. 다른 USB 포트 사용
3. iPhone에서 "이 컴퓨터를 신뢰" 선택
4. iPhone 잠금 해제 상태 유지

#### 6. Archive 메뉴가 비활성화

**원인:** 시뮬레이터가 선택되어 있음

**해결:**

- 상단에서 **"Any iOS Device (arm64)"** 선택

#### 7. 빌드가 App Store Connect에 안 보임

**원인:** 처리 시간 필요

**해결:**

- 10~15분 대기 후 새로고침
- 이메일로 처리 완료 알림 확인

#### 8. iPad 스크린샷이 필요하다는 에러

**해결 방법 1:** iPad 스크린샷 추가

- iPhone 스크린샷을 2048x2732로 리사이즈

**해결 방법 2:** iPhone 전용으로 설정

- Xcode → General → Deployment Info → iPhone만 체크

---

## 체크리스트

### 제출 전 최종 확인

- [ ] Apple Developer Program 활성화됨
- [ ] Bundle Identifier가 고유함
- [ ] 앱 아이콘 1024x1024 (투명 없음)
- [ ] iPhone 스크린샷 업로드됨
- [ ] iPad 스크린샷 업로드됨 (필요시)
- [ ] 앱 이름, 설명 입력됨
- [ ] 키워드 입력됨
- [ ] 카테고리 선택됨
- [ ] 가격 설정됨 (무료/유료)
- [ ] 개인정보 처리방침 URL 입력됨
- [ ] 연령 등급 설정됨
- [ ] 콘텐츠 권한 설정됨
- [ ] 빌드 선택됨
- [ ] 앱 암호화 설정됨
- [ ] 연락처 정보 입력됨

---

## 유용한 링크

- [Apple Developer Program](https://developer.apple.com/programs/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [App Store 심사 지침](https://developer.apple.com/app-store/review/guidelines/)
- [앱 아이콘 가이드라인](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [스크린샷 사양](https://help.apple.com/app-store-connect/#/devd274dd925)

---

## 예상 소요 시간

| 단계                          | 소요 시간       |
| ----------------------------- | --------------- |
| Developer Program 가입        | 30분            |
| Developer Program 활성화 대기 | 24~48시간       |
| Xcode 설정 및 빌드            | 30분            |
| App Store Connect 앱 등록     | 1~2시간         |
| 심사 대기                     | 1~3일           |
| **총 예상 시간**        | **3~5일** |

---

*마지막 업데이트: 2026년 1월*
