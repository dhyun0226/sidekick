# 📊 연간 리캡 v2 마이그레이션 가이드

> **작성일**: 2025-01-15
> **목적**: 정확한 연도별 통계 기록을 위한 `yearly_stats` 테이블 도입
> **난이도**: 중급 (크론잡 설정 필요)

---

## 📋 목차

1. [개요](#개요)
2. [현재 시스템 (Phase 1)](#현재-시스템-phase-1)
3. [목표 시스템 (Phase 2)](#목표-시스템-phase-2)
4. [마이그레이션 계획](#마이그레이션-계획)
5. [구현 세부사항](#구현-세부사항)
6. [테스트 방법](#테스트-방법)
7. [트러블슈팅](#트러블슈팅)
8. [체크리스트](#체크리스트)

---

## 개요

### 왜 필요한가?

**현재 (Phase 1)**:
- `users.yearly_reading_goal` 단일 컬럼으로 목표 관리
- 리캡 생성 시 **현재 목표 기준**으로 추정
- 과거 목표가 뭐였는지 모름

**문제**:
```
2025년 1월: 목표 50권 설정
2025년 6월: 목표 70권으로 변경
2025년 12월: 48권 완독

2026년 1월에 "2025년 리캡" 생성:
- 현재 목표: 70권
- 달성: 48권
- 달성률: 68% ← 틀림! (실제는 50권 기준 96%)
```

**해결책 (Phase 2)**:
- 매년 12월 31일 자정에 자동으로 통계 스냅샷 저장
- `yearly_stats` 테이블에 그 해의 정확한 목표와 달성 기록
- 과거 리캡 정확도 100%

---

## 현재 시스템 (Phase 1)

### DB 구조
```sql
-- users 테이블
users (
  id UUID PRIMARY KEY,
  yearly_reading_goal INTEGER DEFAULT 50,  -- 현재 목표만 저장
  ...
)
```

### 동작 방식
1. 사용자가 목표 설정/변경 → `users.yearly_reading_goal` 업데이트
2. 활동 탭: 현재 목표와 진행 상황 표시
3. 리캡 생성: 현재 목표 기준으로 계산

### 한계
- ❌ 과거 목표 기록 없음
- ❌ 목표 변경 이력 없음
- ❌ 연도별 정확한 통계 불가능
- ❌ 리캡 데이터 재계산 (성능 이슈 가능)

---

## 목표 시스템 (Phase 2)

### DB 구조
```sql
-- 기존 유지
users (
  yearly_reading_goal INTEGER  -- 현재 목표
)

-- 신규 추가
yearly_stats (
  id UUID PRIMARY KEY,
  user_id UUID,
  year INTEGER,

  -- 목표
  goal INTEGER,

  -- 달성
  books_completed INTEGER,
  total_pages_read INTEGER,

  -- 활동
  comments_count INTEGER,
  reviews_count INTEGER,
  active_days INTEGER,

  -- 습관
  longest_streak INTEGER,
  avg_rating DECIMAL(2,1),

  -- 메타
  created_at TIMESTAMP,
  UNIQUE(user_id, year)
)
```

### 동작 방식
1. **평소**: Phase 1과 동일 (`users.yearly_reading_goal` 사용)
2. **12월 31일 23:59**: 크론잡 실행
   - 모든 사용자의 올해 통계 계산
   - `yearly_stats` 테이블에 스냅샷 저장
3. **리캡 생성**: `yearly_stats`에서 정확한 데이터 조회

### 장점
- ✅ 과거 데이터 100% 정확
- ✅ 리캡 생성 속도 빠름 (미리 계산됨)
- ✅ 연도별 비교 가능 ("2024년 대비 20% 증가")
- ✅ 목표 변경 이력 자동 기록

---

## 마이그레이션 계획

### Step 1: DB 테이블 생성

**파일**: `supabase/migrations/YYYYMMDD_create_yearly_stats.sql`

```sql
-- yearly_stats 테이블 생성
CREATE TABLE yearly_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,

  -- 목표
  goal INTEGER NOT NULL,

  -- 독서 성과
  books_completed INTEGER DEFAULT 0,
  total_pages_read INTEGER DEFAULT 0,

  -- 참여도
  comments_count INTEGER DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  active_days INTEGER DEFAULT 0,

  -- 습관
  longest_streak INTEGER DEFAULT 0,
  avg_rating DECIMAL(2,1) DEFAULT 0,

  -- 추가 통계 (선택)
  most_active_month INTEGER,  -- 1-12
  most_active_weekday INTEGER,  -- 0-6 (Sun-Sat)
  favorite_book_id VARCHAR(255),  -- ISBN

  -- 메타
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_user_year UNIQUE(user_id, year)
);

-- 인덱스
CREATE INDEX idx_yearly_stats_user_id ON yearly_stats(user_id);
CREATE INDEX idx_yearly_stats_year ON yearly_stats(year);
CREATE INDEX idx_yearly_stats_user_year ON yearly_stats(user_id, year);

-- RLS 정책
ALTER TABLE yearly_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats"
  ON yearly_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert stats"
  ON yearly_stats FOR INSERT
  WITH CHECK (true);  -- 크론잡용

CREATE POLICY "System can update stats"
  ON yearly_stats FOR UPDATE
  USING (true);  -- 크론잡용

-- 트리거 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_yearly_stats_updated_at
  BEFORE UPDATE ON yearly_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**마이그레이션 실행**:
```bash
# Supabase CLI
supabase migration new create_yearly_stats
# 위 SQL을 파일에 붙여넣기
supabase db push
```

---

### Step 2: 통계 계산 함수 작성

**파일**: `server/utils/calculateYearlyStats.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

interface YearlyStats {
  userId: string
  year: number
  goal: number
  booksCompleted: number
  totalPagesRead: number
  commentsCount: number
  reviewsCount: number
  activeDays: number
  longestStreak: number
  avgRating: number
  mostActiveMonth?: number
  mostActiveWeekday?: number
  favoriteBookId?: string
}

export async function calculateYearlyStats(
  client: SupabaseClient,
  userId: string,
  year: number
): Promise<YearlyStats> {

  // 1. 목표 조회
  const { data: userData } = await client
    .from('users')
    .select('yearly_reading_goal')
    .eq('id', userId)
    .single()

  const goal = userData?.yearly_reading_goal || 50

  // 2. 완독한 책 수 & 총 페이지
  const { data: completedBooks } = await client
    .from('user_reading_progress')
    .select(`
      finished_at,
      group_book:group_books (
        book:books (total_pages)
      )
    `)
    .eq('user_id', userId)
    .gte('finished_at', `${year}-01-01`)
    .lt('finished_at', `${year + 1}-01-01`)

  const booksCompleted = completedBooks?.length || 0
  const totalPagesRead = completedBooks?.reduce((sum, item) => {
    return sum + (item.group_book?.book?.total_pages || 0)
  }, 0) || 0

  // 3. 댓글 수
  const { count: commentsCount } = await client
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', `${year}-01-01`)
    .lt('created_at', `${year + 1}-01-01`)

  // 4. 리뷰 수 & 평균 별점
  const { data: reviews } = await client
    .from('reviews')
    .select('rating, created_at')
    .eq('user_id', userId)
    .gte('created_at', `${year}-01-01`)
    .lt('created_at', `${year + 1}-01-01`)

  const reviewsCount = reviews?.length || 0
  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  // 5. 활동 일수
  const { data: allActivities } = await client
    .from('comments')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', `${year}-01-01`)
    .lt('created_at', `${year + 1}-01-01`)

  const { data: reviewDates } = await client
    .from('reviews')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', `${year}-01-01`)
    .lt('created_at', `${year + 1}-01-01`)

  const uniqueDates = new Set([
    ...(allActivities || []).map(a => a.created_at.split('T')[0]),
    ...(reviewDates || []).map(r => r.created_at.split('T')[0])
  ])

  const activeDays = uniqueDates.size

  // 6. 최장 스트릭
  const dates = Array.from(uniqueDates).sort()
  let longestStreak = 0
  let currentStreak = 0

  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      currentStreak = 1
    } else {
      const prevDate = new Date(dates[i - 1])
      const currDate = new Date(dates[i])
      const diffDays = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (diffDays === 1) {
        currentStreak++
      } else {
        currentStreak = 1
      }
    }

    longestStreak = Math.max(longestStreak, currentStreak)
  }

  // 7. 가장 활발한 월
  const monthCounts = new Map<number, number>()
  allActivities?.forEach(a => {
    const month = new Date(a.created_at).getMonth() + 1
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1)
  })

  let mostActiveMonth = 0
  let maxCount = 0
  monthCounts.forEach((count, month) => {
    if (count > maxCount) {
      maxCount = count
      mostActiveMonth = month
    }
  })

  // 8. 가장 활발한 요일
  const weekdayCounts = new Map<number, number>()
  allActivities?.forEach(a => {
    const weekday = new Date(a.created_at).getDay()
    weekdayCounts.set(weekday, (weekdayCounts.get(weekday) || 0) + 1)
  })

  let mostActiveWeekday = 0
  maxCount = 0
  weekdayCounts.forEach((count, weekday) => {
    if (count > maxCount) {
      maxCount = count
      mostActiveWeekday = weekday
    }
  })

  // 9. 가장 좋아한 책 (최고 별점)
  const { data: favoriteBook } = await client
    .from('reviews')
    .select('group_book:group_books(book:books(isbn))')
    .eq('user_id', userId)
    .gte('created_at', `${year}-01-01`)
    .lt('created_at', `${year + 1}-01-01`)
    .order('rating', { ascending: false })
    .limit(1)
    .single()

  const favoriteBookId = favoriteBook?.group_book?.book?.isbn || null

  return {
    userId,
    year,
    goal,
    booksCompleted,
    totalPagesRead,
    commentsCount: commentsCount || 0,
    reviewsCount,
    activeDays,
    longestStreak,
    avgRating: Math.round(avgRating * 10) / 10,
    mostActiveMonth: mostActiveMonth || undefined,
    mostActiveWeekday: mostActiveWeekday || undefined,
    favoriteBookId: favoriteBookId || undefined
  }
}

export async function saveYearlyStats(
  client: SupabaseClient,
  stats: YearlyStats
): Promise<void> {
  const { error } = await client
    .from('yearly_stats')
    .upsert({
      user_id: stats.userId,
      year: stats.year,
      goal: stats.goal,
      books_completed: stats.booksCompleted,
      total_pages_read: stats.totalPagesRead,
      comments_count: stats.commentsCount,
      reviews_count: stats.reviewsCount,
      active_days: stats.activeDays,
      longest_streak: stats.longestStreak,
      avg_rating: stats.avgRating,
      most_active_month: stats.mostActiveMonth,
      most_active_weekday: stats.mostActiveWeekday,
      favorite_book_id: stats.favoriteBookId
    })

  if (error) {
    throw new Error(`Failed to save yearly stats: ${error.message}`)
  }
}
```

---

### Step 3: 크론잡 설정

#### 옵션 A: Supabase Edge Functions + pg_cron

**파일**: `supabase/functions/yearly-stats-snapshot/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { calculateYearlyStats, saveYearlyStats } from './utils.ts'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const client = createClient(supabaseUrl, supabaseKey)

    // 현재 연도
    const year = new Date().getFullYear()

    // 모든 사용자 가져오기
    const { data: users } = await client
      .from('users')
      .select('id')

    if (!users) {
      throw new Error('No users found')
    }

    console.log(`Processing ${users.length} users for year ${year}`)

    // 각 사용자의 통계 계산 및 저장
    let successCount = 0
    let errorCount = 0

    for (const user of users) {
      try {
        const stats = await calculateYearlyStats(client, user.id, year)
        await saveYearlyStats(client, stats)
        successCount++
      } catch (error) {
        console.error(`Error for user ${user.id}:`, error)
        errorCount++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        year,
        totalUsers: users.length,
        successCount,
        errorCount
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

**pg_cron 설정** (Supabase SQL Editor):
```sql
-- 매년 12월 31일 23:59에 실행
SELECT cron.schedule(
  'yearly-stats-snapshot',
  '59 23 31 12 *',  -- 분 시 일 월 요일
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/yearly-stats-snapshot',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      )
    ) as request_id;
  $$
);
```

#### 옵션 B: Vercel Cron (더 간단)

**파일**: `vercel.json`
```json
{
  "crons": [{
    "path": "/api/cron/yearly-stats-snapshot",
    "schedule": "59 23 31 12 *"
  }]
}
```

**파일**: `pages/api/cron/yearly-stats-snapshot.ts`
```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { calculateYearlyStats, saveYearlyStats } from '~/server/utils/calculateYearlyStats'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Vercel Cron 인증
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const year = new Date().getFullYear()

    const { data: users } = await client
      .from('users')
      .select('id')

    if (!users) {
      throw new Error('No users found')
    }

    let successCount = 0
    let errorCount = 0

    for (const user of users) {
      try {
        const stats = await calculateYearlyStats(client, user.id, year)
        await saveYearlyStats(client, stats)
        successCount++
      } catch (error) {
        console.error(`Error for user ${user.id}:`, error)
        errorCount++
      }
    }

    return res.status(200).json({
      success: true,
      year,
      totalUsers: users.length,
      successCount,
      errorCount
    })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return res.status(500).json({ error: error.message })
  }
}
```

---

### Step 4: 리캡 컴포넌트 수정

**파일**: `pages/profile.vue` 또는 `pages/recap/[year].vue`

```vue
<script setup lang="ts">
// 리캡 데이터 가져오기
const fetchRecapData = async (year: number) => {
  // 1. yearly_stats에서 데이터 조회
  const { data: stats } = await client
    .from('yearly_stats')
    .select('*')
    .eq('user_id', currentUserId.value)
    .eq('year', year)
    .single()

  // 2. 있으면 그대로 사용
  if (stats) {
    return stats
  }

  // 3. 없으면 (과거 데이터 or 올해 진행중) 실시간 계산
  const calculatedStats = await calculateYearlyStats(
    client,
    currentUserId.value,
    year
  )

  return calculatedStats
}

// 리캡 표시
const recap = ref<any>(null)

onMounted(async () => {
  const year = route.params.year || new Date().getFullYear()
  recap.value = await fetchRecapData(year)
})
</script>

<template>
  <div v-if="recap" class="recap-container">
    <h1>🎉 {{ recap.year }}년 독서 리캡</h1>

    <!-- 목표 달성 -->
    <div class="goal-section">
      <h2>🎯 목표 달성</h2>
      <p class="goal">목표: {{ recap.goal }}권</p>
      <p class="achieved">달성: {{ recap.books_completed }}권</p>
      <p class="percentage">
        {{ Math.round((recap.books_completed / recap.goal) * 100) }}%
      </p>
    </div>

    <!-- 독서 성과 -->
    <div class="stats-section">
      <h2>📚 독서 성과</h2>
      <p>총 {{ recap.total_pages_read }}페이지 읽음</p>
      <p>{{ recap.active_days }}일 동안 활동</p>
      <p>최장 연속 {{ recap.longest_streak }}일 기록!</p>
    </div>

    <!-- 참여도 -->
    <div class="engagement-section">
      <h2>💭 남긴 생각</h2>
      <p>댓글 {{ recap.comments_count }}개</p>
      <p>리뷰 {{ recap.reviews_count }}개</p>
      <p>평균 별점 ⭐{{ recap.avg_rating }}</p>
    </div>

    <!-- 습관 -->
    <div class="habits-section">
      <h2>🔥 독서 습관</h2>
      <p>가장 활발한 달: {{ recap.most_active_month }}월</p>
      <p>가장 활발한 요일: {{ getWeekdayName(recap.most_active_weekday) }}</p>
    </div>
  </div>
</template>
```

---

## 테스트 방법

### 1. 로컬 테스트

```typescript
// 테스트 스크립트: scripts/test-yearly-stats.ts
import { createClient } from '@supabase/supabase-js'
import { calculateYearlyStats, saveYearlyStats } from '~/server/utils/calculateYearlyStats'

const client = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function test() {
  const userId = 'YOUR_USER_ID'
  const year = 2024

  console.log(`Calculating stats for user ${userId}, year ${year}...`)

  const stats = await calculateYearlyStats(client, userId, year)
  console.log('Stats:', stats)

  console.log('Saving stats...')
  await saveYearlyStats(client, stats)
  console.log('Done!')
}

test()
```

실행:
```bash
npx tsx scripts/test-yearly-stats.ts
```

### 2. 크론잡 수동 테스트

**Supabase Edge Function**:
```bash
# 로컬 실행
supabase functions serve yearly-stats-snapshot

# 테스트 호출
curl -X POST http://localhost:54321/functions/v1/yearly-stats-snapshot \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Vercel Cron**:
```bash
# 로컬 테스트
curl -X POST http://localhost:3000/api/cron/yearly-stats-snapshot \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. DB 확인

```sql
-- 저장된 통계 확인
SELECT * FROM yearly_stats
WHERE user_id = 'YOUR_USER_ID'
ORDER BY year DESC;

-- 전체 통계 개수
SELECT year, COUNT(*) as users
FROM yearly_stats
GROUP BY year
ORDER BY year DESC;
```

---

## 트러블슈팅

### 문제 1: 크론잡이 실행 안 됨

**원인**:
- pg_cron이 활성화되지 않음
- 시간대 설정 문제
- 권한 문제

**해결**:
```sql
-- pg_cron 활성화 확인
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- 없으면 활성화 (Supabase는 자동)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 크론 작업 확인
SELECT * FROM cron.job;

-- 실행 로그 확인
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### 문제 2: 일부 사용자 통계 계산 실패

**원인**:
- 데이터 무결성 문제
- NULL 값 처리
- 관계 끊어짐 (orphaned records)

**해결**:
```typescript
// 에러 핸들링 강화
for (const user of users) {
  try {
    const stats = await calculateYearlyStats(client, user.id, year)
    await saveYearlyStats(client, stats)
    successCount++
  } catch (error) {
    console.error(`Error for user ${user.id}:`, error)

    // 에러 로그 저장
    await client.from('error_logs').insert({
      type: 'yearly_stats_calculation',
      user_id: user.id,
      year,
      error: error.message,
      stack: error.stack
    })

    errorCount++
  }
}
```

### 문제 3: 성능 이슈 (사용자 많을 때)

**원인**:
- 모든 사용자를 순차 처리
- DB 쿼리 최적화 필요

**해결**:
```typescript
// 배치 처리
const BATCH_SIZE = 100

for (let i = 0; i < users.length; i += BATCH_SIZE) {
  const batch = users.slice(i, i + BATCH_SIZE)

  await Promise.all(
    batch.map(async (user) => {
      try {
        const stats = await calculateYearlyStats(client, user.id, year)
        await saveYearlyStats(client, stats)
      } catch (error) {
        console.error(`Error for user ${user.id}:`, error)
      }
    })
  )

  console.log(`Processed ${Math.min(i + BATCH_SIZE, users.length)}/${users.length}`)
}
```

### 문제 4: 과거 데이터 소급 적용

**시나리오**: 2026년에 이 기능을 도입했는데, 2024, 2025년 데이터도 생성하고 싶음

**해결**:
```typescript
// 스크립트: scripts/backfill-yearly-stats.ts
async function backfill() {
  const years = [2024, 2025]  // 소급할 연도

  const { data: users } = await client.from('users').select('id')

  for (const year of years) {
    console.log(`Backfilling year ${year}...`)

    for (const user of users!) {
      try {
        const stats = await calculateYearlyStats(client, user.id, year)
        await saveYearlyStats(client, stats)
      } catch (error) {
        console.error(`Error for user ${user.id}, year ${year}:`, error)
      }
    }

    console.log(`Completed year ${year}`)
  }
}

backfill()
```

---

## 체크리스트

### Phase 1 완료 확인
- [ ] `users.yearly_reading_goal` 컬럼 존재
- [ ] 활동 탭에서 목표 표시/수정 가능
- [ ] 목표 변경 시 DB 저장 확인

### Phase 2 마이그레이션

#### DB 준비
- [ ] `yearly_stats` 테이블 생성
- [ ] 인덱스 생성 확인
- [ ] RLS 정책 설정
- [ ] 트리거 동작 확인

#### 코드 작성
- [ ] `calculateYearlyStats` 함수 작성
- [ ] `saveYearlyStats` 함수 작성
- [ ] 단위 테스트 통과
- [ ] 에러 핸들링 추가

#### 크론잡 설정
- [ ] Edge Function OR Vercel API 작성
- [ ] 크론 스케줄 설정 (12/31 23:59)
- [ ] 수동 테스트 성공
- [ ] 로그 확인 가능

#### 리캡 UI
- [ ] `yearly_stats`에서 데이터 가져오기
- [ ] fallback: 실시간 계산
- [ ] 목표 달성률 정확도 확인
- [ ] 과거 연도 리캡 테스트

#### 배포 전
- [ ] 로컬 환경 테스트 완료
- [ ] Staging 환경 테스트
- [ ] 성능 테스트 (100+ 사용자)
- [ ] 롤백 계획 수립

#### 배포 후
- [ ] 첫 크론 실행 모니터링
- [ ] 에러 로그 확인
- [ ] 사용자 리캡 정확도 검증
- [ ] 성능 메트릭 확인

---

## 예상 일정

| 단계 | 작업 | 예상 시간 |
|------|------|----------|
| 1 | DB 테이블 생성 | 30분 |
| 2 | 통계 계산 함수 작성 | 2-3시간 |
| 3 | 크론잡 설정 | 1-2시간 |
| 4 | 리캡 UI 수정 | 1시간 |
| 5 | 테스트 | 2시간 |
| 6 | 문서화 | 1시간 |
| **합계** | | **8-10시간** |

---

## 참고 자료

- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Edge Functions](https://supabase.com/docs/guides/functions)

---

## 변경 이력

| 날짜 | 작성자 | 변경 내용 |
|------|--------|----------|
| 2025-01-15 | AI | 초안 작성 |

---

## 연락처

문제 발생 시:
1. GitHub Issues에 보고
2. DB 백업 확인
3. 크론잡 로그 첨부

**Happy Coding! 📚**
