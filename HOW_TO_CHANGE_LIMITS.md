# 📝 구독 제한 변경 가이드

## 🎯 핵심 개념

**이 시스템은 데이터베이스 중심으로 설계되었습니다!**

→ **코드 수정 없이** 데이터베이스 값만 바꾸면 모든 제한이 즉시 반영됩니다.

---

## 🚀 빠른 가이드

### 책 제한을 10권 → 5권으로 변경하기

```sql
-- Supabase Dashboard → SQL Editor에서 실행

UPDATE subscription_limits
SET max_books_per_group = 5
WHERE tier = 'free';
```

**끝!** 🎉

- ✅ 코드 수정 필요 없음
- ✅ 배포 필요 없음
- ✅ 서버 재시작 필요 없음
- ✅ 즉시 반영됨

---

## 📋 전체 제한 변경 방법

### 1. 현재 설정 확인

```sql
SELECT * FROM subscription_limits;
```

**결과:**
```
tier     | max_groups_created | max_books_per_group | has_statistics_access
---------|--------------------|---------------------|----------------------
free     | 1                  | 10                  | false
premium  | -1                 | -1                  | true
admin    | -1                 | -1                  | true
```

> **참고**: `-1` = 무제한

---

### 2. Free 사용자 그룹 제한 변경

#### 1개 → 2개로 변경
```sql
UPDATE subscription_limits
SET max_groups_created = 2
WHERE tier = 'free';
```

#### 1개 → 3개로 변경
```sql
UPDATE subscription_limits
SET max_groups_created = 3
WHERE tier = 'free';
```

#### 무제한으로 변경 (비추천)
```sql
UPDATE subscription_limits
SET max_groups_created = -1
WHERE tier = 'free';
```

---

### 3. Free 사용자 책 제한 변경

#### 10권 → 5권으로 변경
```sql
UPDATE subscription_limits
SET max_books_per_group = 5
WHERE tier = 'free';
```

#### 10권 → 15권으로 변경
```sql
UPDATE subscription_limits
SET max_books_per_group = 15
WHERE tier = 'free';
```

#### 10권 → 20권으로 변경
```sql
UPDATE subscription_limits
SET max_books_per_group = 20
WHERE tier = 'free';
```

---

### 4. 여러 제한 동시 변경

```sql
UPDATE subscription_limits
SET
  max_groups_created = 2,
  max_books_per_group = 15
WHERE tier = 'free';
```

---

## 🔍 변경 사항 확인

### 1. 데이터베이스에서 확인
```sql
SELECT
  tier as "등급",
  max_groups_created as "최대 그룹",
  max_books_per_group as "그룹당 최대 책",
  has_statistics_access as "통계 접근"
FROM subscription_limits
WHERE tier = 'free';
```

### 2. 프론트엔드에서 확인

사용자가 로그인하면 자동으로 최신 값을 가져옵니다:

```typescript
// pages/group/[id].vue 또는 다른 컴포넌트에서
const { limits, fetchLimits } = useSubscription()

onMounted(async () => {
  await fetchLimits()  // DB에서 최신 제한 값 가져오기
  console.log('현재 제한:', limits.value)
  // {
  //   max_groups: 1,
  //   max_books_per_group: 10,
  //   has_statistics_access: false
  // }
})
```

---

## 💡 실제 사용 시나리오

### 시나리오 1: 프로모션 이벤트

**상황**: 2주간 무료 사용자에게 더 많은 혜택 제공

```sql
-- 이벤트 시작: 제한 완화
UPDATE subscription_limits
SET
  max_groups_created = 3,
  max_books_per_group = 20
WHERE tier = 'free';

-- 2주 후: 원래대로 복구
UPDATE subscription_limits
SET
  max_groups_created = 1,
  max_books_per_group = 10
WHERE tier = 'free';
```

---

### 시나리오 2: A/B 테스트

**상황**: 책 제한을 5권으로 줄였을 때 전환율 측정

```sql
-- A 그룹: 기존 (10권)
-- B 그룹: 테스트 (5권)

UPDATE subscription_limits
SET max_books_per_group = 5
WHERE tier = 'free';

-- 1주일 후 데이터 수집 후 결정
-- 전환율 높으면 유지, 낮으면 복구
```

---

### 시나리오 3: 단계적 제한 강화

**상황**: 서비스 안정화를 위해 점진적으로 제한 강화

```sql
-- 1단계: 15권 → 10권
UPDATE subscription_limits
SET max_books_per_group = 10
WHERE tier = 'free';

-- 2주 후 2단계: 10권 → 7권
UPDATE subscription_limits
SET max_books_per_group = 7
WHERE tier = 'free';

-- 2주 후 3단계: 7권 → 5권 (최종)
UPDATE subscription_limits
SET max_books_per_group = 5
WHERE tier = 'free';
```

---

## ⚙️ 시스템 작동 원리

### Backend (데이터베이스 함수)

모든 함수가 `subscription_limits` 테이블을 직접 참조:

```sql
-- can_add_book_to_group 함수
SELECT max_books_per_group INTO v_max_books
FROM subscription_limits
WHERE tier = v_user_tier;

RETURN v_current_books < v_max_books;
```

→ DB 값 변경 시 즉시 반영!

---

### Frontend (Composable)

초기 로딩 시 한 번만 DB에서 값을 가져와 캐시:

```typescript
const fetchLimits = async () => {
  const { data } = await client
    .from('subscription_limits')
    .select('max_groups_created, max_books_per_group')
    .eq('tier', userProfile.subscription_tier)
    .single()

  limits.value = {
    max_groups: data.max_groups_created,
    max_books_per_group: data.max_books_per_group
  }
}
```

→ 사용자가 새로고침하면 최신 값 반영!

---

## 🎨 프론트엔드 사용 예시

### 그룹 페이지에서 사용

```vue
<script setup>
const {
  limits,           // DB에서 읽은 제한 값
  fetchLimits,      // 제한 값 다시 가져오기
  getVisibleBooks,  // 볼 수 있는 책 (자동으로 limits 사용)
  getLockedBooks    // 잠긴 책 (자동으로 limits 사용)
} = useSubscription()

// 컴포넌트 마운트 시 제한 값 로드
onMounted(async () => {
  await fetchLimits()
})

// 책 필터링 (자동으로 DB 제한 값 사용)
const visibleBooks = computed(() => getVisibleBooks(allBooks.value))
const lockedBooks = computed(() => getLockedBooks(allBooks.value))
</script>

<template>
  <div>
    <!-- 현재 제한 표시 -->
    <p>무료 플랜: {{ limits.max_books_per_group }}권까지 읽기 가능</p>

    <!-- 읽을 수 있는 책 -->
    <div v-for="book in visibleBooks" :key="book.id">
      {{ book.title }}
    </div>

    <!-- 잠긴 책 -->
    <div v-for="book in lockedBooks" :key="book.id">
      🔒 {{ book.title }}
    </div>
  </div>
</template>
```

---

## 🔒 보안 고려사항

### 1. 프론트엔드는 UX용

프론트엔드에서 제한을 체크하는 것은 **사용자 경험 개선용**입니다:
- 미리 차단하여 불필요한 요청 방지
- 업그레이드 모달 표시

### 2. 백엔드가 실제 보안

데이터베이스 RLS 정책과 함수가 **실제 보안**을 담당:
- 클라이언트에서 아무리 조작해도 DB에서 차단됨
- 함수가 직접 `subscription_limits` 테이블 참조

```sql
-- 이 정책이 실제 차단
CREATE POLICY "Group members can add books based on tier"
  ON group_books FOR INSERT
  WITH CHECK (
    can_add_book_to_group(auth.uid(), group_id)  -- ← 여기서 실제 체크
  );
```

---

## 🐛 문제 해결

### Q: 제한을 바꿨는데 프론트엔드에서 반영 안 됨

**A:** 사용자가 페이지를 새로고침해야 합니다.

또는 수동으로 재로드:
```typescript
const { fetchLimits } = useSubscription()
await fetchLimits()  // 강제로 다시 로드
```

---

### Q: 백엔드는 반영되는데 프론트엔드는 여전히 옛날 값

**A:** 브라우저 캐시 문제일 수 있습니다.

해결:
1. 하드 리프레시 (Ctrl + Shift + R)
2. 로그아웃 후 다시 로그인
3. 개발자 도구 → Application → Clear Site Data

---

### Q: 특정 사용자만 다른 제한을 주고 싶음

**A:** 현재 시스템은 tier별 제한만 지원합니다.

개별 사용자 제한이 필요하면:
1. 새로운 tier 추가 (예: `vip`, `trial` 등)
2. 해당 사용자의 `subscription_tier` 변경

```sql
-- 1. 새 tier 추가
INSERT INTO subscription_limits VALUES
  ('vip', 5, 50, true);

-- 2. 특정 사용자에게 적용
UPDATE users
SET subscription_tier = 'vip'
WHERE id = 'user-uuid-here';
```

---

## 📊 권장 설정값

### 보수적 (전환율 높임)
```sql
UPDATE subscription_limits
SET
  max_groups_created = 1,
  max_books_per_group = 5
WHERE tier = 'free';
```

### 중간 (현재)
```sql
UPDATE subscription_limits
SET
  max_groups_created = 1,
  max_books_per_group = 10
WHERE tier = 'free';
```

### 관대함 (사용자 친화적)
```sql
UPDATE subscription_limits
SET
  max_groups_created = 2,
  max_books_per_group = 20
WHERE tier = 'free';
```

---

## ✅ 체크리스트

변경 후 확인사항:

- [ ] SQL 실행 성공 확인
- [ ] `SELECT * FROM subscription_limits` 로 값 확인
- [ ] 프론트엔드에서 새로고침 후 테스트
- [ ] Free 사용자로 제한 확인
- [ ] Premium 사용자는 여전히 무제한인지 확인
- [ ] 에러 로그 확인

---

## 🎯 요약

**변경 방법:**
```sql
UPDATE subscription_limits
SET max_books_per_group = [원하는 숫자]
WHERE tier = 'free';
```

**반영 시점:**
- ✅ 백엔드: 즉시
- ⏳ 프론트엔드: 다음 페이지 로드 시

**필요한 작업:**
- ✅ SQL 실행만
- ❌ 코드 수정 불필요
- ❌ 배포 불필요
- ❌ 서버 재시작 불필요

**이게 가능한 이유:**
- 모든 함수가 `subscription_limits` 테이블 참조
- 하드코딩된 값 없음
- Single Source of Truth 원칙

---

**더 궁금한 점이 있으면 `SUBSCRIPTION_IMPLEMENTATION.md` 파일을 참고하세요!**
