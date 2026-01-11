# 여의도 한끼 - 실행 계획 및 체크리스트

## 개발 완료 항목

### 기본 인프라
- [x] Next.js 16 프로젝트 설정
- [x] TypeScript 설정
- [x] Tailwind CSS 설정
- [x] shadcn/ui 컴포넌트 설치
- [x] Vercel 배포 설정

### 데이터베이스
- [x] Turso (libSQL) 연결
- [x] 사용자 테이블 생성
- [x] 리뷰 테이블 생성
- [x] 환경 변수 설정

### API 개발
- [x] `/api/auth/login` - 로그인
- [x] `/api/auth/logout` - 로그아웃
- [x] `/api/auth/register` - 회원가입
- [x] `/api/auth/me` - 현재 사용자 조회
- [x] `/api/auth/change-password` - 비밀번호 변경
- [x] `/api/reviews` - 리뷰 CRUD
- [x] `/api/place-photo` - Google Places 사진 (개별)
- [x] `/api/place-photos` - 배치 이미지 조회 (여러 개)
- [x] `/api/upload` - Cloudinary 이미지 업로드
- [x] `/api/restaurant-buildings` - 빌딩별 식당 조회
- [x] `/api/restaurants/sync` - 정적 데이터 → MongoDB 동기화

### UI 컴포넌트
- [x] 메인 페이지 레이아웃
- [x] 하단 네비게이션
- [x] 카테고리 선택 시트
- [x] 빌딩 선택 시트 (지역별 탭)
- [x] 맛집 카드 (horizontal/vertical)
- [x] 맛집 상세 페이지
- [x] 리뷰 모달
- [x] 리뷰 섹션 (식당 상세용)
- [x] 인증 모달
- [x] 비밀번호 변경 모달
- [x] 한끼추천 뷰
- [x] 취향 설정
- [x] 통합 검색 바 (식당, 빌딩, 음식, 도로명)
- [x] 운세맛집 모달 (오행 + 띠 기반)
- [x] 운세 결과 화면
- [x] 인기 맛집 컴포넌트 (배치 이미지 로딩)

### 커스텀 훅
- [x] useImageBatch - 배치 이미지 로딩 + 글로벌 캐시
- [x] useSwipeBack - 스와이프 뒤로가기 제스처

### 데이터
- [x] 195개 식당 데이터
- [x] 빌딩 정보 23곳 (동여의도 17곳, 서여의도 6곳)

### 특수 기능
- [x] 오행 + 띠 기반 맛집 운세 시스템
  - 생년월일/성별/결혼여부 기반 운세 계산
  - 천간지지 오행 분석
  - 띠(12지지) 계산 및 성향 분석
  - 육합/충/삼합 관계 적용
  - 길방(동/서여의도) 추천
  - 오행별 음식 카테고리 추천
  - 성별/결혼여부별 결과 차별화
- [x] 스와이프 뒤로가기 제스처 (모바일 UX 개선)

### 성능 최적화
- [x] MongoDB 이미지 URL 캐시 (image_cache 컬렉션)
  - 첫 조회: Google API → Cloudinary 업로드 → MongoDB 저장
  - 이후 조회: MongoDB에서 바로 반환 (API 호출 0)
- [x] Cloudinary API 확인 단계 제거로 로딩 속도 개선
- [x] 배치 이미지 로딩 (인기맛집 섹션)
  - 개별 API 5회 → 배치 API 1회
  - MongoDB $in 쿼리로 한 번에 조회
- [x] 글로벌 이미지 캐시 (useImageBatch 훅)

### 버그 수정
- [x] iOS Safari 이미지 업로드
- [x] 인기 맛집 중식 미표시
- [x] 빌딩 시트 스크롤 문제
- [x] 한끼추천 뒤로가기
- [x] 빌딩 선택 모달 - 실제 데이터에 있는 빌딩만 표시
- [x] 룰렛 돌리기 결과 불일치 (+150도 오프셋 보정)
- [x] 운세 화면 뒤로가기 시 빈 화면
- [x] 상세화면에서 운세맛집 탭 이동 안됨

## 진행 중 항목

### 데이터 확장
- [x] 미원빌딩 맛집 (4곳)
- [x] 홍우빌딩 맛집 (8곳)
- [ ] 추가 빌딩 맛집

### 문서화
- [x] 아키텍처 문서
- [x] 트러블슈팅 가이드
- [x] PRD 문서
- [x] 프로젝트 개요

## 배포 체크리스트

### 배포 전
- [ ] `npm run build` 성공 확인
- [ ] 환경 변수 설정 확인
- [ ] API 키 유효성 확인

### 배포
```bash
# 일반 배포
git add -A
git commit -m "feat/fix: 변경 내용"
git push origin main

# 강제 재배포 (캐시 무시)
npx vercel --prod --force
```

### 배포 후
- [ ] 프로덕션 사이트 확인
- [ ] 주요 기능 테스트
- [ ] 모바일 테스트 (iOS Safari)

## 코드 품질

### 코딩 컨벤션
- TypeScript strict mode
- ESLint 규칙 준수
- 컴포넌트당 하나의 책임

### 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
chore: 빌드/설정 변경
```

### Co-Author
```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## 모니터링

### 확인 사항
- Vercel 대시보드 에러 로그
- Google Places API 사용량
- Cloudinary 용량
- Turso 데이터베이스 상태

### 알림 설정
- Vercel 배포 실패 알림
- API 에러율 모니터링
