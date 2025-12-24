# 토스 페이먼츠 결제 시스템 설정 가이드

## 1. 패키지 설치

```bash
npm install @tosspayments/payment-sdk nanoid
```

## 2. 토스 페이먼츠 개발자 가입 및 키 발급

### 2.1 회원가입
1. https://developers.tosspayments.com/ 접속
2. 회원가입 및 로그인
3. "내 개발 정보" 메뉴로 이동

### 2.2 테스트 키 발급
- **클라이언트 키**: `test_ck_` 로 시작 (공개 가능)
- **시크릿 키**: `test_sk_` 로 시작 (절대 공개하면 안됨)

## 3. 환경 변수 설정

`.env` 파일에 추가:

```env
# Toss Payments
NUXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_여기에_클라이언트_키_입력
TOSS_SECRET_KEY=test_sk_여기에_시크릿_키_입력
NUXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 4. 데이터베이스 설정

Supabase SQL Editor에서 `supabase_payment_schema.sql` 파일 실행:

```bash
# SQL 파일 내용을 복사해서 Supabase SQL Editor에 붙여넣고 실행
```

## 5. 테스트 카드 번호

토스 페이먼츠 테스트 모드에서 사용 가능한 카드:

### 성공 케이스
- **카드 번호**: `4000-0000-0000-0004`
- **유효기간**: 아무거나 (미래 날짜)
- **CVC**: 아무 3자리 숫자
- **비밀번호**: 아무 2자리 숫자

### 실패 케이스
- **카드 번호**: `4000-0000-0000-0036` (잔액 부족)
- **카드 번호**: `4000-0000-0000-0077` (분실/도난 카드)

## 6. 결제 플로우

### 사용자 관점
1. `/subscription` 페이지 접속
2. "프리미엄 시작하기" 버튼 클릭
3. 토스 페이먼츠 결제창에서 카드 정보 입력
4. 결제 완료 → `/payment/success` 페이지로 리다이렉트
5. 프리미엄 구독 활성화 완료

### 기술적 플로우
```
1. 클라이언트: "프리미엄 시작하기" 클릭
   ↓
2. POST /api/payments/create-order
   - 주문 ID 생성
   - payments 테이블에 pending 상태로 저장
   ↓
3. 토스 페이먼츠 SDK 결제창 호출
   - 사용자가 카드 정보 입력
   ↓
4. 결제 성공 → /payment/success?orderId=...&paymentKey=...&amount=...
   ↓
5. POST /api/payments/confirm
   - 토스 API로 결제 승인 요청
   - payments 테이블 업데이트 (done)
   - subscriptions 테이블에 구독 생성
   - users.subscription_tier → 'premium' 업데이트
   ↓
6. 완료 페이지 표시
```

## 7. 주요 API 엔드포인트

### POST `/api/payments/create-order`
주문 생성
- Request: `{ planName, amount }`
- Response: `{ orderId, amount }`

### POST `/api/payments/confirm`
결제 승인
- Request: `{ orderId, paymentKey, amount }`
- Response: `{ success, message, subscription }`

### POST `/api/payments/cancel-subscription`
구독 취소 (자동갱신 중지)
- Response: `{ success, message, endDate }`

## 8. 구독 만료 처리 (Cron Job 필요)

현재는 수동으로 처리하지만, 프로덕션에서는 다음이 필요:

### 옵션 1: Supabase Edge Function (추천)
매일 실행되는 함수로 만료된 구독 처리

### 옵션 2: Vercel Cron
`vercel.json`에 cron 설정

### 옵션 3: 외부 Cron 서비스
매일 API 호출

## 9. 실제 결제 전환 (프로덕션)

### 9.1 토스 페이먼츠에서 실 키 발급
- 사업자 등록 필요
- 정산 계좌 등록
- 실 키 발급: `live_ck_`, `live_sk_`

### 9.2 환경 변수 변경
```env
NUXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_실제_키
TOSS_SECRET_KEY=live_sk_실제_키
NUXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 9.3 Webhook 설정 (선택)
토스 개발자센터에서 Webhook URL 설정:
- `https://yourdomain.com/api/payments/webhook`

## 10. 보안 주의사항

✅ **해야 할 것**
- 시크릿 키는 절대 클라이언트에 노출하지 않기
- 모든 결제 승인은 서버에서 처리
- 금액 검증 반드시 수행
- HTTPS 필수

❌ **하지 말아야 할 것**
- 클라이언트에서 직접 결제 승인
- 금액을 클라이언트에서 받아서 그대로 사용
- 테스트 키를 프로덕션에 사용

## 11. 테스트 방법

```bash
# 1. 서버 실행
npm run dev

# 2. 브라우저에서 접속
http://localhost:3000/subscription

# 3. 프리미엄 시작하기 클릭

# 4. 테스트 카드로 결제
카드번호: 4000-0000-0000-0004
유효기간: 12/25
CVC: 123
비밀번호: 00

# 5. 결제 완료 확인
- /payment/success 페이지 확인
- Supabase에서 데이터 확인:
  - payments 테이블: status = 'done'
  - subscriptions 테이블: status = 'active'
  - users 테이블: subscription_tier = 'premium'
```

## 12. 문제 해결

### 결제창이 안 뜨는 경우
- 클라이언트 키가 올바른지 확인
- 패키지가 설치되었는지 확인: `@tosspayments/payment-sdk`

### 결제 승인이 실패하는 경우
- 시크릿 키가 올바른지 확인
- 금액이 일치하는지 확인
- 토스 페이먼츠 API 응답 로그 확인

### 구독이 활성화되지 않는 경우
- payments 테이블 status 확인
- subscriptions 테이블 데이터 확인
- 서버 로그 확인

## 13. 추가 기능 구현 가능

- ✅ 월 구독 (현재 구현됨)
- ⏳ 연 구독 (할인가)
- ⏳ 자동 갱신 (빌링키 사용)
- ⏳ 영수증 이메일 발송
- ⏳ 결제 내역 조회 페이지
- ⏳ 환불 기능

## 도움이 필요하면

- 토스 페이먼츠 문서: https://docs.tosspayments.com/
- 토스 페이먼츠 Discord: https://discord.gg/tosspayments
