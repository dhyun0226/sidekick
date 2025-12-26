# 📚 Sidekick 관리자 가이드

> 독서 모임 서비스 Sidekick의 전체 관리자 기능 설명서

**최종 업데이트**: 2025-12-26
**대상 사용자**: 시스템 관리자, 운영팀

---

## 📋 목차

1. [관리자 페이지 접근](#1-관리자-페이지-접근)
2. [구독 & 결제 관리](#2-구독--결제-관리)
3. [사용자 등급 관리](#3-사용자-등급-관리)
4. [구독 제한 설정](#4-구독-제한-설정)
5. [데이터베이스 직접 관리](#5-데이터베이스-직접-관리)
6. [보안 및 권한](#6-보안-및-권한)
7. [문제 해결 (Troubleshooting)](#7-문제-해결-troubleshooting)

---

## 1. 관리자 페이지 접근

### 📍 URL
```
https://your-domain.com/admin/subscriptions
```

### 🔐 접근 권한
- **필수 조건**: `subscription_tier = 'admin'`인 사용자만 접근 가능
- 관리자가 아닌 사용자가 접근 시 자동으로 메인 페이지로 리디렉션됨

### 🛡️ 미들웨어
**파일**: `middleware/admin.ts`
```typescript
// 사용자의 subscription_tier를 체크하여 admin이 아니면 차단
```

### 👤 관리자 권한 부여 방법
**Supabase Dashboard → SQL Editor**에서 실행:
```sql
UPDATE users
SET subscription_tier = 'admin'
WHERE email = 'admin@example.com';
```

---

## 2. 구독 & 결제 관리

### 2.1 구독 관리 탭 (Subscriptions)

#### 기능
- 전체 구독 현황 조회
- 활성/취소/만료 구독 필터링
- 사용자별 구독 정보 확인
- 구독 강제 취소

#### 주요 정보 표시
| 항목 | 설명 |
|------|------|
| **사용자** | 이름, 이메일 |
| **플랜** | 월간/연간 프리미엄 |
| **상태** | 활성/취소됨/만료 |
| **시작일** | 구독 시작 날짜 |
| **만료일** | 구독 종료 예정일 |
| **자동갱신** | ✓ 또는 ✗ |

#### 구독 상태 설명
```
✅ active (활성) - 현재 이용 중인 유효한 구독
❌ cancelled (취소됨) - 사용자가 자동갱신을 취소했으나 만료일까지는 유효
⏱️ expired (만료) - 종료된 구독
```

#### 구독 강제 취소 방법
1. 해당 구독 행의 "취소" 버튼 클릭
2. 확인 대화상자에서 승인
3. 자동으로 `status='cancelled'`, `auto_renew=false`로 변경됨
4. 사용자는 만료일까지는 계속 프리미엄 기능 이용 가능

---

### 2.2 결제 내역 탭 (Payments)

#### 기능
- 전체 결제 트랜잭션 조회
- 결제 상태별 필터링 (완료/대기/실패)
- 토스페이먼츠 주문 ID 추적

#### 주요 정보 표시
| 항목 | 설명 |
|------|------|
| **주문ID** | 토스페이먼츠 orderId (20자까지 표시) |
| **사용자** | 결제한 사용자 정보 |
| **금액** | 결제 금액 (₩2,500 또는 ₩19,000) |
| **결제수단** | 카드/계좌이체/간편결제 |
| **상태** | 완료/대기/실패 |
| **결제일** | 승인 날짜 및 시간 |

#### 결제 상태 설명
```
✅ done (완료) - 정상적으로 처리된 결제
⏱️ pending (대기) - 결제 진행 중
❌ failed (실패) - 결제 실패
🚫 cancelled (취소) - 사용자가 취소한 결제
```

---

### 2.3 대시보드 통계 카드

페이지 상단에 4개의 실시간 통계 카드 표시:

#### 📊 활성 구독
- 현재 `status='active'`인 구독 수
- 실제 매출을 발생시키는 유효 구독자 수

#### 💰 이번 달 수익
- 현재 월에 `status='done'`인 결제의 합계
- 월별 수익 추이 파악 가능

#### 📈 전체 수익
- 서비스 시작 이후 총 누적 수익
- 모든 완료된 결제의 합계

#### ⏰ 7일 내 만료
- 향후 7일 이내에 만료 예정인 활성 구독 수
- 갱신 독려 대상 사용자 파악

---

## 3. 사용자 등급 관리

### 3.1 사용자 등급 탭 (Tiers)

#### 기능
- 전체 사용자 목록 조회
- 사용자별 현재 등급 확인
- 등급 즉시 변경 (무료 ↔ 프리미엄 ↔ 관리자)
- 그룹 참여 현황 파악

#### 주요 정보 표시
| 항목 | 설명 |
|------|------|
| **사용자** | 프로필 이미지, 닉네임, 이메일 |
| **현재 등급** | 무료/프리미엄/관리자 |
| **가입일** | 사용자 계정 생성일 |
| **참여 그룹** | 현재 가입된 그룹 수 |
| **등급 변경** | 드롭다운으로 즉시 변경 |

---

### 3.2 등급 시스템 설명

#### 🆓 무료 (Free)
- **제한 사항**:
  - 최대 1개 그룹 참여
  - 그룹당 최대 10권 책 보기
  - 통계 기능 접근 불가
- **대상**: 일반 사용자 (기본값)
- **색상**: 회색 배지

#### 💎 프리미엄 (Premium)
- **특징**:
  - 무제한 그룹 참여
  - 무제한 책 추가/조회
  - 전체 통계 기능 이용 가능
- **대상**: 유료 구독 사용자
- **색상**: 라임색 배지

#### 👑 관리자 (Admin)
- **특징**:
  - 프리미엄 기능 전체 포함
  - 관리자 페이지 접근 권한
  - 시스템 설정 변경 권한
- **대상**: 운영팀, 개발자
- **색상**: 보라색 배지

---

### 3.3 등급 변경 방법

#### UI에서 변경
1. `/admin/subscriptions` 접속
2. "사용자 등급" 탭 클릭
3. 대상 사용자 검색 (이름, 이메일)
4. 등급 드롭다운 선택 → 자동 저장
5. 성공 토스트 메시지 확인

#### SQL로 변경
```sql
-- 특정 사용자를 프리미엄으로 변경
UPDATE users
SET subscription_tier = 'premium'
WHERE email = 'user@example.com';

-- 여러 사용자를 한 번에 변경
UPDATE users
SET subscription_tier = 'free'
WHERE subscription_tier = 'premium'
  AND email LIKE '%@test.com';
```

#### 🚨 주의사항
- 등급 변경은 **즉시 반영**됨
- 사용자는 **페이지 새로고침** 후 변경된 권한 적용
- 프리미엄 → 무료로 다운그레이드 시:
  - 기존 그룹/책은 **유지**되지만 **새로 추가 불가**
  - 잠긴 책은 **blur 처리**되어 표시됨

---

## 4. 구독 제한 설정

### 4.1 제한 설정 탭 (Limits)

#### 기능
- 각 등급별 제한 값 실시간 조정
- 데이터베이스 기반 동적 설정
- 변경 즉시 전체 사용자에게 적용

#### 설정 가능한 항목

| 설정 | 설명 | 무료 기본값 | 프리미엄 기본값 |
|------|------|-------------|----------------|
| **최대 그룹 수** | 참여 가능한 최대 그룹 개수 | 1 | -1 (무제한) |
| **그룹당 최대 책** | 그룹에서 볼 수 있는 최대 책 | 10 | -1 (무제한) |
| **통계 기능 접근** | Insight 탭 접근 권한 | ✗ | ✓ |

---

### 4.2 설정 변경 방법

#### UI에서 변경
1. `/admin/subscriptions` 접속
2. "제한 설정" 탭 클릭
3. 등급별 카드에서 값 수정
   - **-1**: 무제한을 의미
   - **0 이상**: 실제 제한 개수
4. "변경사항 저장" 버튼 클릭
5. 즉시 적용 확인

#### SQL로 변경
```sql
-- 무료 사용자 책 제한을 10권 → 5권으로 변경
UPDATE subscription_limits
SET max_books_per_group = 5
WHERE tier = 'free';

-- 무료 사용자 그룹 제한을 1개 → 2개로 변경
UPDATE subscription_limits
SET max_groups_created = 2
WHERE tier = 'free';

-- 무료 사용자에게 통계 기능 허용
UPDATE subscription_limits
SET has_statistics_access = true
WHERE tier = 'free';
```

---

### 4.3 제한 적용 메커니즘

#### 백엔드 (PostgreSQL RLS)
```sql
-- 그룹 참여 시 자동 체크
CREATE POLICY "Users can join groups within tier limit"
  ON group_members FOR INSERT
  WITH CHECK (can_join_group(auth.uid(), group_id));

-- 책 추가 시 자동 체크
CREATE POLICY "Group members can add books within tier limit"
  ON group_books FOR INSERT
  WITH CHECK (can_add_book_to_group(auth.uid(), group_id));
```

#### 프론트엔드 (Vue Composable)
```typescript
// composables/useSubscription.ts
const { isPremium, limits, fetchLimits } = useSubscription()

// 페이지 로드 시 최신 제한 값 조회
onMounted(async () => {
  await fetchLimits() // subscription_limits 테이블에서 가져옴
})

// 책 제한 적용
const visibleBooks = getVisibleBooks(allBooks) // 최대 max_books_per_group개만 표시
const lockedBooks = getLockedBooks(allBooks)   // 나머지는 잠금 처리
```

---

### 4.4 제한 변경 시 영향 범위

| 변경 사항 | 즉시 적용 | 새로고침 필요 | 영구 영향 |
|-----------|----------|--------------|---------|
| **SQL에서 변경** | ✓ (백엔드) | ✓ (프론트엔드) | ✓ |
| **UI에서 변경** | ✓ (백엔드) | ✓ (프론트엔드) | ✓ |

#### 예시 시나리오
```
1. 관리자가 무료 플랜 책 제한을 10 → 5로 변경
2. 백엔드: 즉시 적용 (새로운 책 추가 시도 시 차단)
3. 프론트엔드: 사용자가 페이지 새로고침 시 5권만 표시됨
4. 기존 10권을 보던 사용자 → 5권만 보임 + 5권은 잠금 처리
```

---

## 5. 데이터베이스 직접 관리

### 5.1 주요 테이블 구조

#### `users` 테이블
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  nickname TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 핵심 컬럼
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `subscriptions` 테이블
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT, -- 'active', 'cancelled', 'expired'
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `subscription_limits` 테이블 (핵심)
```sql
CREATE TABLE subscription_limits (
  tier TEXT PRIMARY KEY, -- 'free', 'premium', 'admin'
  max_groups_created INTEGER NOT NULL,
  max_books_per_group INTEGER NOT NULL,
  has_statistics_access BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 데이터
INSERT INTO subscription_limits VALUES
  ('free', 1, 10, false),
  ('premium', -1, -1, true),
  ('admin', -1, -1, true);
```

#### `payments` 테이블
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  order_id TEXT UNIQUE NOT NULL, -- 토스페이먼츠 orderId
  amount INTEGER NOT NULL,
  method TEXT, -- 'card', 'transfer', 'easy_payment'
  status TEXT, -- 'done', 'pending', 'failed', 'cancelled'
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 5.2 유용한 SQL 쿼리

#### 사용자 통계 조회
```sql
-- 등급별 사용자 수
SELECT subscription_tier, COUNT(*) as count
FROM users
GROUP BY subscription_tier;

-- 활성 프리미엄 사용자 목록
SELECT u.email, u.nickname, s.end_date
FROM users u
JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active'
ORDER BY s.end_date ASC;
```

#### 수익 통계
```sql
-- 월별 수익
SELECT
  DATE_TRUNC('month', approved_at) as month,
  SUM(amount) as revenue
FROM payments
WHERE status = 'done'
GROUP BY month
ORDER BY month DESC;

-- 오늘의 수익
SELECT SUM(amount) as today_revenue
FROM payments
WHERE status = 'done'
  AND approved_at >= CURRENT_DATE;
```

#### 만료 예정 구독 조회
```sql
-- 7일 이내 만료 예정
SELECT
  u.email,
  u.nickname,
  s.end_date,
  (s.end_date - NOW()) as remaining
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.status = 'active'
  AND s.end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY s.end_date ASC;
```

#### 문제 상황 수정
```sql
-- 결제는 완료되었으나 subscription_tier가 free인 사용자 찾기
SELECT u.email, u.subscription_tier, s.status
FROM users u
JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active'
  AND u.subscription_tier = 'free';

-- 위 사용자들을 프리미엄으로 수정
UPDATE users
SET subscription_tier = 'premium'
WHERE id IN (
  SELECT u.id
  FROM users u
  JOIN subscriptions s ON u.id = s.user_id
  WHERE s.status = 'active' AND u.subscription_tier = 'free'
);
```

---

### 5.3 PostgreSQL Functions (RPC)

#### `can_join_group(user_id, group_id)`
```sql
-- 사용자가 그룹에 참여 가능한지 체크
SELECT can_join_group(
  'user-uuid-here'::UUID,
  'group-uuid-here'::UUID
); -- true 또는 false 반환
```

#### `can_create_group(user_id)`
```sql
-- 사용자가 새 그룹을 생성할 수 있는지 체크
SELECT can_create_group('user-uuid-here'::UUID);
```

#### `can_add_book_to_group(user_id, group_id)`
```sql
-- 사용자가 그룹에 책을 추가할 수 있는지 체크
SELECT can_add_book_to_group(
  'user-uuid-here'::UUID,
  'group-uuid-here'::UUID
);
```

#### `get_user_subscription_usage(user_id)`
```sql
-- 사용자의 현재 사용량과 제한 조회
SELECT * FROM get_user_subscription_usage('user-uuid-here'::UUID);

-- 결과 예시:
-- tier | groups_joined | max_groups | max_books_per_group | can_join_more_groups | has_statistics_access
-- free | 1             | 1          | 10                  | false                | false
```

---

## 6. 보안 및 권한

### 6.1 Row Level Security (RLS)

#### 관리자만 접근 가능한 테이블
```sql
-- subscription_limits 테이블: 읽기는 모두 가능, 쓰기는 불가능
CREATE POLICY "Anyone can view limits"
  ON subscription_limits FOR SELECT
  USING (true);

-- 관리자만 수정 가능 (서버 API를 통해서만)
-- 직접 수정은 Supabase Dashboard에서만 가능
```

#### 일반 사용자가 자신의 데이터만 조회
```sql
-- 사용자는 자신의 구독만 조회 가능
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 결제 내역만 조회 가능
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);
```

---

### 6.2 API 보안

#### 서버 엔드포인트 인증
```typescript
// server/api/subscription/*.ts
const { data: { session } } = await client.auth.getSession()
if (!session?.user) {
  throw createError({ statusCode: 401, message: '인증이 필요합니다.' })
}
```

#### 관리자 전용 API
```typescript
// server/api/admin/*.ts
const { data: userData } = await client
  .from('users')
  .select('subscription_tier')
  .eq('id', session.user.id)
  .single()

if (userData.subscription_tier !== 'admin') {
  throw createError({ statusCode: 403, message: '관리자 권한이 필요합니다.' })
}
```

---

### 6.3 프론트엔드 미들웨어

#### `middleware/admin.ts`
```typescript
export default defineNuxtRouteMiddleware(async (to, from) => {
  const userStore = useUserStore()
  await userStore.fetchProfile()

  if (userStore.profile?.subscription_tier !== 'admin') {
    return navigateTo('/')
  }
})
```

---

## 7. 문제 해결 (Troubleshooting)

### 7.1 사용자가 결제했는데 프리미엄이 안 되는 경우

#### 원인
- 결제는 완료되었으나 `subscription_tier`가 업데이트되지 않음
- `subscriptions` 테이블에는 레코드가 있으나 `users.subscription_tier`는 'free'

#### 해결 방법
```sql
-- 1. 확인
SELECT u.email, u.subscription_tier, s.status
FROM users u
JOIN subscriptions s ON u.id = s.user_id
WHERE u.email = 'user@example.com';

-- 2. 수동 수정
UPDATE users
SET subscription_tier = 'premium'
WHERE email = 'user@example.com';
```

---

### 7.2 사용자가 그룹을 생성/참여할 수 없다는 경우

#### 원인
- 무료 사용자가 제한에 도달함
- `subscription_limits` 설정이 잘못됨

#### 해결 방법
```sql
-- 1. 사용자의 현재 상태 확인
SELECT * FROM get_user_subscription_usage('user-uuid-here'::UUID);

-- 2. 제한 확인
SELECT * FROM subscription_limits WHERE tier = 'free';

-- 3. 임시로 제한 완화 또는 사용자를 프리미엄으로 변경
UPDATE users SET subscription_tier = 'premium' WHERE email = 'user@example.com';
```

---

### 7.3 관리자 페이지가 안 열리는 경우

#### 원인
- `subscription_tier`가 'admin'이 아님
- 미들웨어 오류

#### 해결 방법
```sql
-- 1. 사용자 등급 확인
SELECT email, subscription_tier FROM users WHERE email = 'admin@example.com';

-- 2. 관리자로 변경
UPDATE users SET subscription_tier = 'admin' WHERE email = 'admin@example.com';

-- 3. 브라우저 캐시 삭제 후 재로그인
```

---

### 7.4 제한 설정 변경이 적용 안 되는 경우

#### 원인
- 프론트엔드 캐시
- `fetchLimits()`가 호출되지 않음

#### 해결 방법
```typescript
// 사용자에게 페이지 새로고침 요청 (Ctrl+Shift+R)
// 또는 캐시 무효화
localStorage.clear()
```

---

### 7.5 결제 실패 트랜잭션이 많은 경우

#### 원인
- 사용자가 결제 진행 중 취소
- 카드 한도 초과
- 네트워크 문제

#### 확인 방법
```sql
-- 실패 결제 조회
SELECT
  u.email,
  p.amount,
  p.status,
  p.created_at
FROM payments p
JOIN users u ON p.user_id = u.id
WHERE p.status IN ('failed', 'cancelled')
ORDER BY p.created_at DESC
LIMIT 20;
```

---

## 8. 자주 사용하는 관리 작업

### 8.1 무료 프리미엄 지급
```sql
-- 특정 사용자에게 평생 프리미엄 부여
UPDATE users
SET subscription_tier = 'premium'
WHERE email = 'friend@example.com';

-- 구독 레코드 생성 (선택사항)
INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, auto_renew)
VALUES (
  (SELECT id FROM users WHERE email = 'friend@example.com'),
  (SELECT id FROM subscription_plans WHERE name = 'premium_lifetime'),
  'active',
  NOW(),
  NOW() + INTERVAL '100 years', -- 실질적으로 평생
  false
);
```

---

### 8.2 전체 사용자에게 한시적 프리미엄 제공
```sql
-- 이벤트 기간 동안 모든 사용자를 프리미엄으로 변경
UPDATE users
SET subscription_tier = 'premium'
WHERE subscription_tier = 'free';

-- 이벤트 종료 후 원복 (원래 free였던 사용자만)
UPDATE users
SET subscription_tier = 'free'
WHERE subscription_tier = 'premium'
  AND id NOT IN (
    SELECT user_id FROM subscriptions WHERE status = 'active'
  );
```

---

### 8.3 구독 만료 처리 (Cron Job)
```sql
-- 매일 자정에 실행되는 자동 만료 처리
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS void AS $
BEGIN
  -- 만료일이 지난 구독을 expired로 변경
  UPDATE subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND end_date < NOW();

  -- 만료된 구독을 가진 사용자를 free로 변경
  UPDATE users
  SET subscription_tier = 'free'
  WHERE id IN (
    SELECT user_id FROM subscriptions
    WHERE status = 'expired'
  )
  AND subscription_tier = 'premium';
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron 스케줄 설정 (Supabase Dashboard에서)
SELECT cron.schedule(
  'expire-subscriptions',
  '0 0 * * *', -- 매일 자정 UTC
  $$ SELECT expire_subscriptions(); $$
);
```

---

## 9. 관리자 대시보드 주요 지표

### 9.1 KPI (Key Performance Indicators)

| 지표 | 계산 방법 | 목표 |
|------|----------|------|
| **활성 구독자 수** | `COUNT(subscriptions WHERE status='active')` | 지속 성장 |
| **월 수익** | `SUM(payments.amount WHERE month=current)` | 전월 대비 증가 |
| **전환율** | `(프리미엄 사용자 / 전체 사용자) * 100` | 10% 이상 |
| **이탈률** | `(취소된 구독 / 전체 구독) * 100` | 5% 이하 |
| **평균 구독 기간** | `AVG(end_date - start_date)` | 6개월 이상 |

---

### 9.2 모니터링 쿼리

#### 일일 신규 가입자
```sql
SELECT COUNT(*) as new_users
FROM users
WHERE created_at >= CURRENT_DATE;
```

#### 일일 신규 결제
```sql
SELECT COUNT(*) as new_payments, SUM(amount) as revenue
FROM payments
WHERE status = 'done'
  AND approved_at >= CURRENT_DATE;
```

#### 주간 활성 사용자 (WAU)
```sql
SELECT COUNT(DISTINCT user_id) as wau
FROM reading_logs
WHERE created_at >= NOW() - INTERVAL '7 days';
```

---

## 10. 연락처 및 지원

### 개발팀
- **이메일**: dev@sidekick.com
- **슬랙**: #admin-support
- **긴급 연락**: 010-XXXX-XXXX

### Supabase 지원
- **대시보드**: https://app.supabase.com
- **문서**: https://supabase.com/docs
- **커뮤니티**: https://discord.supabase.com

### 토스페이먼츠 지원
- **대시보드**: https://developers.tosspayments.com
- **API 문서**: https://docs.tosspayments.com
- **고객센터**: 1544-7772

---

## 부록: 빠른 참조

### 관리자 작업 체크리스트

#### 신규 관리자 추가
- [ ] `subscription_tier = 'admin'` 설정
- [ ] 이메일로 안내 발송
- [ ] 첫 로그인 확인

#### 사용자 문의 대응
- [ ] 사용자 이메일로 계정 검색
- [ ] 구독/결제 상태 확인
- [ ] 필요시 수동 조정
- [ ] 조치 내역 기록

#### 월간 점검
- [ ] 활성 구독 수 확인
- [ ] 수익 추이 분석
- [ ] 실패 결제 검토
- [ ] 만료 예정 구독 알림

---

**이 문서는 지속적으로 업데이트됩니다.**
**마지막 수정**: 2025-12-26
