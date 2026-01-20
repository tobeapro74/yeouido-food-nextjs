# iOS 앱 배포 완전 가이드

중학생도 따라할 수 있는 iOS 앱 배포 A to Z 매뉴얼입니다.

---

## 목차

1. [사전 준비: 필요한 서비스 가입](#part-1-사전-준비-필요한-서비스-가입)
2. [환경 변수 설정](#part-2-환경-변수-설정)
3. [Xcode 설정 및 빌드](#part-3-xcode-설정-및-빌드)
4. [App Store Connect 설정](#part-4-app-store-connect-설정)
5. [심사 제출](#part-5-심사-제출)
6. [심사 거부 대응](#part-6-심사-거부-대응)
7. [트러블슈팅 체크리스트](#part-7-트러블슈팅-체크리스트)

---

# Part 1: 사전 준비 (필요한 서비스 가입)

앱을 출시하려면 여러 서비스에 가입해야 합니다. 하나씩 천천히 따라해보세요.

---

## 📋 계정 정보 요약 (여의도한끼 프로젝트)

> ⚠️ **보안 주의**: 이 정보는 프로젝트 관리용입니다. 외부에 노출하지 마세요.

| 서비스 | 사이트 | 아이디 | 비밀번호 힌트 |
|--------|--------|--------|---------------|
| Apple Developer | developer.apple.com | `tobeapro@gmail.com` | `Ls@~` |
| App Store Connect | appstoreconnect.apple.com | `tobeapro@gmail.com` | (Apple ID 동일) |
| Vercel | vercel.com | GitHub 연동 (`tobeapro74`) | - |
| MongoDB Atlas | cloud.mongodb.com | `tobeapro` | `1023` |
| Google Cloud | console.cloud.google.com | `tobeapro@gmail.com` | (Google 계정) |
| Cloudinary | cloudinary.com | `tobeapro@gmail.com` | - |
| Resend | resend.com | `tobeapro@gmail.com` | - |
| GitHub | github.com | `tobeapro74` | - |

### 주요 API 키 (Vercel 환경 변수용)

| 키 이름 | 값 | 설명 |
|---------|-----|------|
| `MONGODB_URI` | `mongodb+srv://tobeapro:1023@cluster0.ppfoisv.mongodb.net/yeouido_food?retryWrites=true&w=majority` | MongoDB 연결 문자열 |
| `JWT_SECRET` | `yeouido-food-jwt-secret-key-2024` | JWT 암호화 키 |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | `AIzaSyAP4-MpGNRYObV4vbPMjXdWYSUCLoux1s4` | Google Places API (클라이언트용) |
| `GOOGLE_PLACES_API_KEY` | `AIzaSyAP4-MpGNRYObV4vbPMjXdWYSUCLoux1s4` | Google Places API (서버용) |
| `GOOGLE_PLACES_API_NEW_KEY` | `AIzaSyCIt74LXHiWsgscQvJICXMIYrXskEMKv9w` | Google Places API (New) 키 |
| `CLOUDINARY_CLOUD_NAME` | `dedlpr1kx` | Cloudinary 클라우드 이름 |
| `CLOUDINARY_API_KEY` | `694492762215652` | Cloudinary API 키 |
| `CLOUDINARY_API_SECRET` | `1pT8JWxKkciZGDUuvtg4bftbBHw` | Cloudinary API 시크릿 |
| `RESEND_API_KEY` | `re_g4nbDxSs_LpZMV4jf8T7AQShHsjrHtY5G` | Resend 이메일 API 키 |
| `ADMIN_SECRET_KEY` | `yeouido-admin-2024` | 관리자 인증 키 |

### 테스트 계정 (앱 심사용)

| 용도 | 이메일 | 비밀번호 | 인증코드 |
|------|--------|----------|----------|
| App Store 심사 | `test@test.com` | `test1234` | `123456` |

---

## 1.1 Apple Developer Program 가입

> 💰 비용: 연간 $99 (약 13만원)_완료
> ⏱️ 소요 시간: 가입 30분 + 활성화 대기 24~48시간

### 왜 필요한가요?

App Store에 앱을 올리려면 반드시 Apple Developer Program에 가입해야 합니다.

### 가입 순서

#### Step 1: Apple 개발자 사이트 접속

1. 웹 브라우저에서 **[developer.apple.com](https://developer.apple.com)** 접속
2. 우측 상단 **"Account"** 클릭
3. **Apple ID로 로그인** (없으면 새로 만들기)

#### Step 2: Developer Program 등록 시작

4. **[developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll)** 접속
5. **"Start Your Enrollment"** 버튼 클릭
6. **"개인/개인 사업자"** 선택 (회사가 아니면 개인 선택)

#### Step 3: 개인 정보 입력

7. 이름 확인 (Apple ID에 등록된 이름)
8. 연락처 정보 입력
   - 전화번호: `+82 10-1234-5678` 형식
   - 이메일: 실제 사용하는 이메일
9. **"Continue"** 클릭

#### Step 4: 결제

10. 신용카드/체크카드 정보 입력
11. 연간 $99 결제
12. 약관 동의 체크 → **"Purchase"** 클릭
13. 확인 이메일 수신 대기 (24~48시간)

### ✅ 체크리스트

- [ ] Apple ID 로그인 완료
- [ ] Developer Program 결제 완료
- [ ] 활성화 이메일 수신 확인

---

## 1.2 Vercel 가입 및 프로젝트 연결

> 💰 비용: 무료 (Hobby 플랜)
> ⏱️ 소요 시간: 10분

### 왜 필요한가요?

Next.js 앱을 인터넷에 배포해서 누구나 접속할 수 있게 해줍니다.

### 가입 순서

#### Step 1: Vercel 사이트 접속

1. **[vercel.com](https://vercel.com)** 접속
2. **"Sign Up"** 클릭
3. **"Continue with GitHub"** 선택 (GitHub 계정으로 로그인)

#### Step 2: GitHub 연동

4. GitHub 로그인 → Vercel 앱 권한 허용
5. 프로필 설정 → **"Continue"** 클릭

#### Step 3: 프로젝트 가져오기

6. 대시보드에서 **"Add New..."** → **"Project"** 클릭
7. **"Import Git Repository"** 섹션에서 본인 저장소 선택
8. 프레임워크가 **"Next.js"**로 자동 감지되는지 확인
9. **"Deploy"** 클릭

#### Step 4: 배포 확인

10. 배포 완료 후 **"Visit"** 클릭
11. 사이트가 정상적으로 표시되는지 확인
12. URL 복사해두기 (예: `https://your-app.vercel.app`)

### ✅ 체크리스트

- [ ] Vercel 가입 완료
- [ ] GitHub 저장소 연결 완료
- [ ] 첫 배포 성공
- [ ] 배포 URL 복사해둠

---

## 1.3 MongoDB Atlas 가입 및 데이터베이스 생성

> 💰 비용: 무료 (M0 클러스터)
> ⏱️ 소요 시간: 15분

### 왜 필요한가요?

사용자 정보, 리뷰, 맛집 데이터 등을 저장하는 데이터베이스입니다.

### 가입 순서

#### Step 1: MongoDB 사이트 접속

1. **[mongodb.com](https://www.mongodb.com)** 접속
2. **"Try Free"** 클릭
3. Google 또는 이메일로 가입

#### Step 2: 클러스터 생성

4. **"Build a Database"** 클릭
5. **"M0 Free"** 선택 (무료)
6. 클라우드 제공자: **AWS** 선택
7. 지역: **Seoul (ap-northeast-2)** 선택 (가장 빠름)
8. 클러스터 이름 입력 (예: `Cluster0`)
9. **"Create"** 클릭

#### Step 3: 데이터베이스 사용자 생성

10. **Security Quickstart** 화면에서:
    - Username: 원하는 이름 입력 (예: `admin`)
    - Password: 강력한 비밀번호 생성 → **반드시 메모!**
11. **"Create User"** 클릭

#### Step 4: 네트워크 접근 설정

12. **"Add My Current IP Address"** 클릭 (개발용)
13. **Vercel에서 접근 허용**:
    - **"Add IP Address"** 클릭
    - IP 주소에 **`0.0.0.0/0`** 입력 (모든 IP 허용)
    - **"Confirm"** 클릭

#### Step 5: 연결 문자열 획득

14. 클러스터에서 **"Connect"** 클릭
15. **"Connect your application"** 선택
16. Driver: **Node.js**, Version: **6.0 or later** 선택
17. 연결 문자열 복사 (아래 형식):

```
mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/yeouido_food?retryWrites=true&w=majority
```

18. `<password>` 부분을 실제 비밀번호로 교체
19. 이 문자열을 **안전한 곳에 메모!**

### ✅ 체크리스트

- [ ] MongoDB 가입 완료
- [ ] M0 무료 클러스터 생성
- [ ] 데이터베이스 사용자 생성 (ID/PW 메모)
- [ ] IP 접근 허용 설정 (0.0.0.0/0)
- [ ] 연결 문자열(URI) 복사해둠

---

## 1.4 Resend 가입 (이메일 인증용)

> 💰 비용: 무료 (월 3,000개 이메일)
> ⏱️ 소요 시간: 10분

### 왜 필요한가요?

회원가입 시 이메일 인증 코드를 보내는 데 사용합니다.

### 가입 순서

#### Step 1: Resend 사이트 접속

1. **[resend.com](https://resend.com)** 접속
2. **"Get Started"** 클릭
3. GitHub 또는 Google 계정으로 가입

#### Step 2: API 키 생성

4. 대시보드에서 좌측 메뉴 **"API Keys"** 클릭
5. **"Create API Key"** 클릭
6. 이름 입력 (예: `yeouido-food-key`)
7. Permission: **Full access** 선택
8. **"Create"** 클릭
9. 생성된 API 키 복사 (한 번만 표시됨!) → **반드시 메모!**

#### Step 3: 도메인 설정 (선택사항)

- 커스텀 도메인이 있으면 **"Domains"**에서 추가
- 없으면 기본 `onboarding@resend.dev`로 발송 가능

### ✅ 체크리스트

- [ ] Resend 가입 완료
- [ ] API 키 생성 및 복사해둠
- [ ] (선택) 커스텀 도메인 설정

---

## 1.5 Google Cloud Console (Places API)

> 💰 비용: 월 $200 무료 크레딧 (초과 시 유료)
> ⏱️ 소요 시간: 20분

### 왜 필요한가요?

맛집 사진, 평점, 리뷰를 구글맵에서 가져옵니다.

### 가입 순서

#### Step 1: Google Cloud Console 접속

1. **[console.cloud.google.com](https://console.cloud.google.com)** 접속
2. Google 계정으로 로그인

#### Step 2: 새 프로젝트 생성

3. 상단 프로젝트 선택 드롭다운 클릭
4. **"새 프로젝트"** 클릭
5. 프로젝트 이름 입력 (예: `yeouido-food`)
6. **"만들기"** 클릭

#### Step 3: 결제 계정 설정 (필수!)

7. 좌측 메뉴 **≡** 클릭 → **"결제"**
8. **"결제 계정 연결"** 클릭
9. 새 결제 계정 생성 → 신용카드 정보 입력
10. $200 무료 크레딧이 자동 적용됨

> ⚠️ **중요**: 결제 계정 없이는 API가 작동하지 않습니다!

#### Step 4: Places API 활성화

11. **[console.cloud.google.com/apis/library](https://console.cloud.google.com/apis/library)** 접속
12. 검색창에 **"Places API"** 입력
13. **"Places API"** 클릭 → **"사용"** 버튼 클릭
14. 같은 방법으로 **"Places API (New)"** 도 활성화

#### Step 5: API 키 생성

15. 좌측 메뉴 **"사용자 인증 정보"** 클릭
16. **"+ 사용자 인증 정보 만들기"** → **"API 키"** 클릭
17. 생성된 API 키 복사 → **반드시 메모!**

#### Step 6: API 키 제한 설정 (보안)

18. 생성된 키 이름 클릭
19. **"API 제한사항"** 섹션:
    - **"키 제한"** 선택
    - Places API, Places API (New) 체크
20. **"저장"** 클릭

### ✅ 체크리스트

- [ ] Google Cloud 프로젝트 생성
- [ ] 결제 계정 연결 완료
- [ ] Places API 활성화
- [ ] API 키 생성 및 복사해둠
- [ ] API 키 제한 설정 완료

---

## 1.6 Cloudinary 가입 (이미지 저장)

> 💰 비용: 무료 (월 25GB 저장, 25GB 전송)
> ⏱️ 소요 시간: 10분

### 왜 필요한가요?

사용자가 올린 리뷰 사진을 저장하고 최적화해서 제공합니다.

### 가입 순서

#### Step 1: Cloudinary 사이트 접속

1. **[cloudinary.com](https://cloudinary.com)** 접속
2. **"Sign Up for Free"** 클릭
3. 이메일, 이름, 비밀번호 입력 후 가입

#### Step 2: 대시보드에서 정보 확인

4. 로그인 후 대시보드 확인
5. **"Product Environment"** 섹션에서 다음 정보 메모:
   - **Cloud Name**: `your-cloud-name`
   - **API Key**: `123456789012345`
   - **API Secret**: `abcdefghij...` (Show 클릭)

### ✅ 체크리스트

- [ ] Cloudinary 가입 완료
- [ ] Cloud Name 복사해둠
- [ ] API Key 복사해둠
- [ ] API Secret 복사해둠

---

## 1.7 Namecheap 도메인 구매 (선택사항)

> 💰 비용: 연간 $10~15 (도메인에 따라 다름)
> ⏱️ 소요 시간: 15분

### 왜 필요한가요?

`yeouido-food.com` 같은 커스텀 도메인을 사용하려면 필요합니다.

### 구매 순서

#### Step 1: Namecheap 접속

1. **[namecheap.com](https://www.namecheap.com)** 접속
2. 검색창에 원하는 도메인 입력 (예: `yeouido-food`)
3. 사용 가능한 도메인 확인

#### Step 2: 도메인 구매

4. 원하는 도메인 **"Add to cart"** 클릭
5. **"Checkout"** 클릭
6. 계정 생성 또는 로그인
7. 결제 정보 입력 후 구매

#### Step 3: Vercel에 도메인 연결

8. Vercel 대시보드 → 프로젝트 선택 → **"Settings"**
9. **"Domains"** 메뉴 클릭
10. 구매한 도메인 입력 → **"Add"**
11. 안내되는 DNS 레코드를 Namecheap에서 설정

#### Step 4: Namecheap DNS 설정

12. Namecheap 대시보드 → 도메인 선택 → **"Manage"**
13. **"Advanced DNS"** 탭 클릭
14. Vercel에서 안내한 레코드 추가:
    - Type: **A Record**, Host: **@**, Value: `76.76.21.21`
    - Type: **CNAME**, Host: **www**, Value: `cname.vercel-dns.com`

### ✅ 체크리스트

- [ ] 도메인 구매 완료
- [ ] Vercel에 도메인 추가
- [ ] Namecheap DNS 설정 완료
- [ ] 도메인 접속 확인 (전파에 최대 48시간 소요)

---

# Part 2: 환경 변수 설정

수집한 모든 API 키와 비밀번호를 Vercel에 설정합니다.

---

## 2.1 Vercel 환경 변수 설정

### 순서

#### Step 1: Vercel 대시보드 접속

1. **[vercel.com](https://vercel.com)** 로그인
2. 프로젝트 선택
3. **"Settings"** 탭 클릭
4. 좌측 메뉴에서 **"Environment Variables"** 클릭

#### Step 2: 환경 변수 추가

아래 변수들을 하나씩 추가합니다:

| 이름                                  | 값                    | 설명                        |
| ------------------------------------- | --------------------- | --------------------------- |
| `MONGODB_URI`                       | `mongodb+srv://...` | MongoDB 연결 문자열         |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | `AIzaSy...`         | Google Places API 키        |
| `GOOGLE_PLACES_API_KEY`             | `AIzaSy...`         | (서버용) 동일한 키          |
| `CLOUDINARY_CLOUD_NAME`             | `your-cloud`        | Cloudinary 클라우드 이름    |
| `CLOUDINARY_API_KEY`                | `12345...`          | Cloudinary API 키           |
| `CLOUDINARY_API_SECRET`             | `abc123...`         | Cloudinary 시크릿           |
| `RESEND_API_KEY`                    | `re_...`            | Resend API 키               |
| `JWT_SECRET`                        | `random-string`     | JWT 암호화 키 (아무 문자열) |

#### Step 3: 변수 추가 방법

5. **"Add New"** 버튼 클릭
6. **Key**: 변수 이름 입력 (예: `MONGODB_URI`)
7. **Value**: 값 입력 (예: 연결 문자열)
8. **Environment**: 모두 체크 (Production, Preview, Development)
9. **"Save"** 클릭
10. 모든 변수에 대해 반복

#### Step 4: 재배포

11. 환경 변수 추가 후 **"Deployments"** 탭 이동
12. 최근 배포의 **"..."** 메뉴 → **"Redeploy"** 클릭
13. **"Redeploy"** 확인

### ⚠️ 주의사항

- 값 입력 시 앞뒤 공백 없이 입력
- 복사/붙여넣기 시 줄바꿈(`\n`) 포함되지 않도록 주의
- 따옴표(`"`) 포함하지 않음

### ✅ 체크리스트

- [ ] MONGODB_URI 설정 완료
- [ ] GOOGLE_PLACES_API_KEY 설정 완료
- [ ] CLOUDINARY 관련 3개 설정 완료
- [ ] RESEND_API_KEY 설정 완료
- [ ] JWT_SECRET 설정 완료
- [ ] 재배포 완료

---

## 2.2 로컬 개발용 환경 변수 (.env.local)

로컬 개발 시 사용할 환경 변수 파일을 만듭니다.

### 순서

#### Step 1: 파일 생성

1. 프로젝트 루트 폴더에 `.env.local` 파일 생성

#### Step 2: 내용 입력

```bash
# MongoDB
MONGODB_URI=mongodb+srv://admin:password@cluster0.xxxxx.mongodb.net/yeouido_food?retryWrites=true&w=majority

# Google Places API
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyAP4-xxxxx
GOOGLE_PLACES_API_KEY=AIzaSyAP4-xxxxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnop

# Resend
RESEND_API_KEY=re_xxxxx

# JWT
JWT_SECRET=my-super-secret-key-12345
```

#### Step 3: Git에서 제외 확인

3. `.gitignore` 파일에 `.env.local`이 포함되어 있는지 확인
4. 포함되어 있지 않으면 추가:

```
.env.local
.env*.local
```

### ✅ 체크리스트

- [ ] .env.local 파일 생성
- [ ] 모든 환경 변수 입력
- [ ] .gitignore에서 제외 확인

---

# Part 3: Xcode 설정 및 빌드

Next.js 웹앱을 iOS 앱으로 변환하여 App Store에 올립니다.

---

## 3.1 Capacitor 설정

### 순서

#### Step 1: Capacitor 설치 확인

1. 터미널에서 프로젝트 폴더로 이동
2. 다음 명령어 실행:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init
```

#### Step 2: capacitor.config.ts 확인

3. 프로젝트 루트의 `capacitor.config.ts` 파일 확인:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.yeouido-food',
  appName: '여의도한끼',
  webDir: 'out',
  server: {
    url: 'https://your-app.vercel.app',  // Vercel 배포 URL
    cleartext: true
  }
};

export default config;
```

#### Step 3: iOS 프로젝트 생성

4. 터미널에서 실행:

```bash
npm run build
npx cap add ios
npx cap sync ios
```

### ✅ 체크리스트

- [ ] Capacitor 설치 완료
- [ ] capacitor.config.ts 설정 완료
- [ ] iOS 프로젝트 생성 완료

---

## 3.2 Xcode 프로젝트 설정

### 순서

#### Step 1: Xcode에서 프로젝트 열기

1. 터미널에서 실행:

```bash
npx cap open ios
```

2. Xcode가 자동으로 열림

#### Step 2: Signing & Capabilities 설정

3. 좌측 프로젝트 탐색기에서 **"App"** 클릭
4. 중앙 패널에서 **"Signing & Capabilities"** 탭 클릭
5. **"Automatically manage signing"** 체크
6. **"Team"** 드롭다운에서 본인 Apple ID 선택
   - 목록에 없으면: Xcode → Settings → Accounts → + 버튼 → Apple ID 추가

#### Step 3: Bundle Identifier 설정

7. **"Bundle Identifier"** 확인
   - 형식: `com.yourname.appname`
   - 예: `com.johnkim.yeouido-food`
   - 전 세계에서 유일해야 함!

#### Step 4: 버전 정보 설정

8. **"General"** 탭 클릭
9. **"Identity"** 섹션:
   - Version: `1.0`
   - Build: `1`

### ✅ 체크리스트

- [ ] Xcode에서 프로젝트 열기 완료
- [ ] Team 설정 완료
- [ ] Bundle Identifier 설정 완료
- [ ] 버전 정보 설정 완료

---

## 3.3 앱 아이콘 설정

### 순서

#### Step 1: 아이콘 준비

1. **1024 x 1024 픽셀** PNG 이미지 준비
2. ⚠️ **투명 배경 없이** (알파 채널 없음)
3. 모서리는 사각형 (iOS가 자동으로 둥글게 처리)

#### Step 2: Xcode에서 설정

4. 좌측 탐색기에서 **Assets.xcassets** 폴더 클릭
5. **AppIcon** 선택
6. 1024x1024 이미지를 드래그 앤 드롭

### 투명 배경 제거 방법 (필요시)

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

### ✅ 체크리스트

- [ ] 1024x1024 앱 아이콘 준비
- [ ] 투명 배경 없음 확인
- [ ] Xcode에 아이콘 추가 완료

---

## 3.4 Archive 생성 및 업로드

### 순서

#### Step 1: 빌드 대상 설정

1. Xcode 상단 툴바에서 현재 선택된 장치 클릭
2. **"Any iOS Device (arm64)"** 선택
   - 시뮬레이터가 아닌 실제 기기용으로 설정

#### Step 2: Archive 생성

3. 메뉴: **Product → Archive** 클릭
4. 빌드 완료까지 대기 (2~5분 소요)
5. **Organizer** 창이 자동으로 열림

#### Step 3: App Store에 업로드

6. Organizer에서 방금 생성된 Archive 선택
7. **"Distribute App"** 버튼 클릭
8. **"App Store Connect"** 선택 → **"Next"**
9. **"Upload"** 선택 → **"Next"**
10. 옵션 확인 (기본값 유지) → **"Next"**
11. 인증서 선택 → **"Next"**
12. **"Upload"** 클릭
13. 키체인 암호 팝업 → Mac 로그인 암호 입력 → **"항상 허용"** 클릭
    - 여러 번 뜰 수 있음, 매번 **"항상 허용"** 선택
14. **"Upload Succeeded"** 메시지 확인
15. **"Done"** 클릭

> 📌 업로드 후 App Store Connect에서 빌드가 보이기까지 10~15분 소요

### ✅ 체크리스트

- [ ] Any iOS Device (arm64) 선택
- [ ] Archive 생성 완료
- [ ] App Store Connect 업로드 완료
- [ ] Upload Succeeded 메시지 확인

---

# Part 4: App Store Connect 설정

앱 정보를 입력하고 스크린샷을 업로드합니다.

---

## 4.1 새 앱 등록

### 순서

#### Step 1: App Store Connect 접속

1. **[appstoreconnect.apple.com](https://appstoreconnect.apple.com)** 접속
2. Apple ID로 로그인

#### Step 2: 새 앱 생성

3. **"나의 앱"** 클릭
4. 좌측 상단 **"+"** 버튼 클릭 → **"신규 앱"** 선택
5. 앱 정보 입력:
   - **플랫폼**: iOS 체크
   - **이름**: 앱 이름 (App Store에 표시됨)
   - **기본 언어**: 한국어
   - **번들 ID**: Xcode에서 설정한 Bundle Identifier 선택
   - **SKU**: 고유 식별자 (예: `yeouido-food-001`)
   - **사용자 액세스 권한**: 전체 액세스
6. **"생성"** 클릭

### ✅ 체크리스트

- [ ] App Store Connect 로그인
- [ ] 새 앱 생성 완료
- [ ] 번들 ID 연결 완료

---

## 4.2 앱 정보 입력

### 순서

#### Step 1: 기본 정보

1. 좌측 메뉴 **"앱 정보"** 클릭
2. **카테고리** 설정:
   - 기본 카테고리: **음식 및 음료**
   - 보조 카테고리: **여행** (선택사항)

#### Step 2: 콘텐츠 권한

3. **콘텐츠 권한** 섹션 → **"편집"** 클릭
4. 타사 콘텐츠 사용 여부 선택:
   - 구글맵, 외부 API 사용하면 → **"예"** 선택
5. **"완료"** 클릭

#### Step 3: 연령 등급

6. **연령 등급** 섹션 → **"편집"** 클릭
7. 모든 질문에 **"아니요"** 선택 (폭력, 성인물 등 없는 경우)
8. **"완료"** 클릭
9. **"저장"** 클릭

### ✅ 체크리스트

- [ ] 카테고리 설정 완료
- [ ] 콘텐츠 권한 설정 완료
- [ ] 연령 등급 설정 완료 (4+)

---

## 4.3 가격 및 사용 가능 여부

### 순서

1. 좌측 메뉴 **"가격 책정 및 사용 가능 여부"** 클릭
2. **"가격 추가"** 클릭
   - 무료 앱: **₩0 (무료)** 선택
   - 유료 앱: 원하는 가격 선택
3. **"사용 가능 여부 설정"** 클릭
   - 전 세계: 모두 선택
   - 특정 국가만: 원하는 국가 선택
4. **"저장"** 클릭

### ✅ 체크리스트

- [ ] 가격 설정 완료 (무료/유료)
- [ ] 배포 국가 선택 완료

---

## 4.4 개인정보 처리방침

### 순서

1. 좌측 메뉴 **"앱 개인정보 보호"** 클릭
2. **개인정보 처리방침 URL** 입력
   - 예: `https://your-app.vercel.app/privacy`
3. **"시작하기"** 클릭
4. 데이터 수집 여부 선택:
   - 개인정보 수집 안 함: **"아니요"** 선택
   - 개인정보 수집함: **"예"** 선택 후 수집 항목 체크
5. **"저장"** 또는 **"게시"** 클릭

### ✅ 체크리스트

- [ ] 개인정보 처리방침 URL 입력
- [ ] 데이터 수집 설정 완료

---

## 4.5 스크린샷 업로드

### 필요한 스크린샷 규격

| 기기                   | 해상도 (세로) |
| ---------------------- | ------------- |
| iPhone 6.7인치 (필수)  | 1290 x 2796   |
| iPhone 6.5인치         | 1284 x 2778   |
| iPad Pro 13인치 (필수) | 2064 x 2752   |

### 스크린샷 촬영 방법

#### Step 1: 시뮬레이터 실행

```bash
open -a Simulator
```

#### Step 2: 원하는 기기 선택

- 메뉴: **File → Open Simulator → iPhone 16 Pro Max**
- 메뉴: **File → Open Simulator → iPad Pro 13-inch**

#### Step 3: 웹앱 접속

- 시뮬레이터 Safari에서 배포 URL 접속

#### Step 4: 스크린샷 촬영

- 키보드: **Cmd + S**
- 데스크톱에 자동 저장됨

### 업로드 순서

1. 좌측 메뉴 **"iOS 앱 1.0"** 클릭
2. **스크린샷** 섹션에서 각 기기 탭 선택
3. 스크린샷 파일 **드래그 앤 드롭**
4. 최소 1장, 최대 10장

### ⚠️ 주의사항

- 스크린샷은 **앱 내부 UI만** 보여줘야 함
- 외부 링크(Google Maps 등) 화면은 사용 금지
- 상태바 포함해도 무관

### ✅ 체크리스트

- [ ] iPhone 스크린샷 업로드 (6.7인치)
- [ ] iPad 스크린샷 업로드 (13인치)
- [ ] 각 기기별 최소 1장 이상

---

## 4.6 버전 정보 입력

### 순서

1. 좌측 메뉴 **"iOS 앱 1.0"** 클릭
2. 다음 정보 입력:

#### 설명

```
여의도 맛집을 한눈에!

- 날씨, 기분에 맞는 맛집 추천
- 180개+ 여의도 맛집 정보
- 실시간 구글 리뷰
- 빌딩별, 카테고리별 검색
```

#### 키워드

```
여의도,맛집,점심,저녁,음식,식당,추천,한식,중식,일식,양식
```

#### 지원 URL

```
https://your-app.vercel.app/support
```

### 빌드 선택

3. **빌드** 섹션에서 **"+"** 버튼 클릭
4. Xcode에서 업로드한 빌드 선택
5. **"완료"** 클릭

### 앱 암호화 설정

6. 빌드 선택 시 암호화 질문:
   - 앱이 HTTPS만 사용: **"아니요"** 선택
7. **"완료"** 클릭

### ✅ 체크리스트

- [ ] 앱 설명 입력
- [ ] 키워드 입력
- [ ] 지원 URL 입력
- [ ] 빌드 선택 완료
- [ ] 암호화 설정 완료

---

## 4.7 심사 정보 입력

### 순서

1. **"앱 심사 정보"** 섹션 찾기
2. 다음 정보 입력:

#### 로그인 정보 (앱에 로그인 기능이 있는 경우)

- **로그인 필요**: 체크
- **사용자 이름**: `test@test.com`
- **암호**: `test1234`

#### 연락처 정보

- **이름**: 본인 이름
- **전화번호**: 연락 가능한 번호
- **이메일**: 연락 가능한 이메일

#### 메모 (심사자에게 전달)

```
Demo Account Login:
- Email: test@test.com
- Password: test1234

If you want to test sign-up:
- Use any email ending with @test.com or @example.com
- Verification code is always: 123456
```

3. **"저장"** 클릭

### ✅ 체크리스트

- [ ] 테스트 계정 정보 입력
- [ ] 연락처 정보 입력
- [ ] 심사자 메모 입력

---

# Part 5: 심사 제출

모든 정보를 입력했으면 심사를 제출합니다.

---

## 5.1 제출 전 최종 확인

### 체크리스트

#### 기본 정보

- [ ] 앱 이름 입력됨
- [ ] 번들 ID 연결됨
- [ ] 카테고리 설정됨
- [ ] 가격 설정됨 (무료/유료)

#### 미디어

- [ ] 앱 아이콘 설정됨 (투명 배경 없음)
- [ ] iPhone 스크린샷 업로드됨
- [ ] iPad 스크린샷 업로드됨

#### 콘텐츠

- [ ] 앱 설명 입력됨
- [ ] 키워드 입력됨
- [ ] 연령 등급 설정됨
- [ ] 개인정보 처리방침 URL 입력됨

#### 빌드

- [ ] 빌드 선택됨
- [ ] 암호화 설정됨

#### 심사 정보

- [ ] 테스트 계정 입력됨
- [ ] 연락처 입력됨

---

## 5.2 심사 제출

### 순서

1. 페이지 우측 상단 확인
2. 모든 필수 항목이 완료되면 **"심사를 위해 제출"** 버튼 활성화
3. **"심사를 위해 제출"** 클릭
4. 확인 팝업에서 **"제출"** 클릭

---

## 5.3 심사 대기

### 상태 확인

- 앱 상태가 **"심사 대기 중"**으로 변경됨
- 심사 기간: 보통 **24시간 ~ 3일**
- 결과는 **이메일**로 통보

### 심사 결과

#### 승인됨 (Approved)

- 축하합니다! App Store에 앱이 출시됩니다
- 상태가 **"판매 준비됨"**으로 변경

#### 거부됨 (Rejected)

- 거부 사유가 이메일로 전달됨
- Resolution Center에서 상세 내용 확인
- 문제 수정 후 재제출 (Part 6 참고)

---

# Part 6: 심사 거부 대응

실제로 자주 발생하는 거부 사유와 해결 방법입니다.

---

## 6.1 거부 사유 확인하기

### 순서

1. 거부 이메일 확인
2. App Store Connect 접속
3. **나의 앱 → 앱 선택 → Resolution Center** 클릭
4. 거부 사유 상세 내용 확인

---

## 6.2 iPad 스크린샷 누락

### 문제

```
앱이 iPad를 지원하는데 iPad 스크린샷이 없습니다.
```

### 해결 방법

#### 방법 1: iPad 스크린샷 추가 (권장)

1. iPad 시뮬레이터 실행: `open -a Simulator`
2. File → Open Simulator → iPad Pro (13-inch)
3. 배포 URL 접속
4. Cmd + S로 스크린샷 촬영
5. App Store Connect에 업로드

#### 방법 2: iPhone 전용으로 변경

1. Xcode → 프로젝트 → General 탭
2. Deployment Info → iPhone만 체크
3. 다시 Archive → 업로드

---

## 6.3 회원탈퇴 기능 없음

### 문제

```
Guideline 5.1.1 - Legal - Privacy
앱에 계정 생성 기능이 있지만 계정 삭제 기능이 없습니다.
```

### 해결

- 회원탈퇴 API 추가 (`/api/auth/delete-account`)
- 회원탈퇴 UI 추가 (사용자 메뉴에 버튼)
- 재빌드 후 업로드

---

## 6.4 카메라 기능 크래시

### 문제

```
Guideline 2.1.0 - Performance: App Completeness
카메라 기능 사용 시 앱이 크래시됩니다.
```

### 해결

1. Capacitor Camera 플러그인 설치:

```bash
npm install @capacitor/camera
npx cap sync ios
```

2. Info.plist에 권한 설명 추가:

```xml
<key>NSCameraUsageDescription</key>
<string>리뷰에 사진을 첨부하기 위해 카메라 접근이 필요합니다.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>리뷰에 사진을 첨부하기 위해 사진 라이브러리 접근이 필요합니다.</string>
```

---

## 6.5 외부 웹사이트 스크린샷

### 문제

```
Guideline 2.3.3 - Performance - Accurate Metadata
스크린샷이 앱이 아닌 외부 웹사이트를 보여줍니다.
```

### 해결

- Google Maps 등 외부 링크 화면 스크린샷 삭제
- 앱 내부 UI 스크린샷으로 교체
- 메인 화면, 상세 페이지, 검색 화면 등 사용

---

## 6.6 iPad 화면이 좁게 표시

### 문제

```
앱이 iPad에서 화면을 제대로 활용하지 않습니다.
```

### 해결

`src/app/layout.tsx` 수정:

```typescript
// Before
<div className="max-w-md mx-auto">

// After (반응형)
<div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
```

---

## 6.7 iPad 이메일 인증 오류

### 문제

```
Guideline 2.1.0 - Performance: App Completeness
iPad에서 이메일 인증 시 오류가 발생합니다.
```

### 해결

`src/components/ui/dialog.tsx` 수정:

```typescript
// Dialog에 스크롤 지원 추가
className="... max-h-[90vh] overflow-y-auto"
```

---

## 6.8 재제출 순서

1. 문제 수정
2. 로컬 테스트
3. Git 커밋 & 푸시
4. Xcode에서 새 Archive 생성
5. App Store Connect 업로드
6. 새 빌드 선택
7. Resolution Center에서 답변 작성 (선택)
8. 재제출

---

# Part 7: 트러블슈팅 체크리스트

자주 발생하는 문제와 해결 방법 요약입니다.

---

## 7.1 개발 환경 문제

### npm run dev 실행 안됨

```bash
# 캐시 삭제 후 재시작
rm -rf .next
npm run dev
```

### 빌드 에러

```bash
# node_modules 재설치
rm -rf node_modules
npm install
npm run build
```

---

## 7.2 Xcode 문제

### Archive 메뉴가 비활성화

- 상단에서 **"Any iOS Device (arm64)"** 선택
- 시뮬레이터 선택 시 Archive 불가능

### Team 목록에 이름 없음

- Xcode → Settings → Accounts → + 버튼 → Apple ID 추가

### 키체인 암호 팝업 계속 뜸

- 매번 **"항상 허용"** 선택 (허용 X)
- 안 되면 Mac 재시작

---

## 7.3 App Store Connect 문제

### 빌드가 안 보임

- 업로드 후 10~15분 대기
- 이메일로 처리 완료 알림 확인

### 앱 아이콘 에러

- 1024x1024 픽셀 확인
- 투명 배경(alpha channel) 제거

---

## 7.4 운영 환경 문제

### 이미지가 안 보임

1. Google Cloud 결제 계정 확인
2. Vercel 환경변수에 `\n` 포함 여부 확인
3. MongoDB 데이터베이스 이름 확인

### API 에러

```bash
# 운영 API 테스트
curl "https://your-app.vercel.app/api/place-photo?query=테스트"
```

### 캐시 문제

```bash
# Vercel 강제 재배포
npx vercel --prod --force
```

---

## 7.5 환경 변수 체크리스트

| 변수명                            | 확인 |
| --------------------------------- | ---- |
| MONGODB_URI                       | [ ]  |
| GOOGLE_PLACES_API_KEY             | [ ]  |
| NEXT_PUBLIC_GOOGLE_PLACES_API_KEY | [ ]  |
| CLOUDINARY_CLOUD_NAME             | [ ]  |
| CLOUDINARY_API_KEY                | [ ]  |
| CLOUDINARY_API_SECRET             | [ ]  |
| RESEND_API_KEY                    | [ ]  |
| JWT_SECRET                        | [ ]  |

---

# 부록: 버전 히스토리

| 버전 | 빌드 | 날짜       | 상태   | 비고                    |
| ---- | ---- | ---------- | ------ | ----------------------- |
| 1.0  | 1    | 2026-01-15 | 거부   | iPad 스크린샷 누락      |
| 1.0  | 2    | 2026-01-16 | 거부   | 회원탈퇴 기능 없음      |
| 1.0  | 3    | 2026-01-17 | 거부   | 카메라 크래시           |
| 1.0  | 4    | 2026-01-18 | 거부   | iPad 이메일 인증 오류   |
| 1.0  | 5    | 2026-01-20 | 심사중 | iPad Dialog 스크롤 수정 |

---

# 유용한 링크

- [Apple Developer Program](https://developer.apple.com/programs/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [MongoDB Atlas](https://cloud.mongodb.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [Cloudinary Console](https://cloudinary.com/console)
- [Resend Dashboard](https://resend.com/dashboard)

---

*마지막 업데이트: 2026년 1월 20일*
