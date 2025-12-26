# 구독 시스템 최종 구현 가이드

## 📋 구현 개요

**비즈니스 로직:**
- **Free 사용자**: 그룹 1개만 참가, 책 10권만 보기 (잠금 UI 표시), 10권 미만일 때만 추가 가능
- **Premium 사용자**: 모든 제한 없음
- **개인 등급 기반**: 그룹 등급 개념 없음, 각 사용자의 subscription_tier에 따라 제한

---

## 1. 데이터베이스 마이그레이션

### 파일: `supabase/migrations/update_subscription_system_final.sql`

**실행 방법:**
```
Supabase Dashboard → SQL Editor
→ update_subscription_system_final.sql 내용 복사/붙여넣기
→ Run
```

**주요 함수:**

#### `can_join_group(user_id, group_id)`
- Free 유저: 1개 그룹만 참가 가능 확인
- Premium/Admin: 무제한

#### `can_create_group(user_id)`
- Free 유저: 이미 1개 그룹 참가 중이면 생성 불가
- 생성과 참가를 동일하게 취급

#### `can_add_book_to_group(user_id, group_id)`
- Free 유저: 그룹에 10권 미만일 때만 추가 가능
- Premium/Admin: 무제한

#### `get_user_subscription_usage(user_id)`
- 사용자의 현재 그룹 참가 수, 최대 참가 가능 수 등 반환

**RLS 정책:**
- 그룹 생성: `can_create_group()` 확인
- 그룹 참가: `can_join_group()` 확인
- 책 추가: `can_add_book_to_group()` 확인

---

## 2. Composable: `composables/useSubscription.ts`

### 주요 함수

#### 책 보기 관련
```typescript
// Free 유저가 볼 수 있는 책 (오래된 순 10권)
getVisibleBooks(allBooks: any[])

// Free 유저가 볼 수 없는 책 (잠금된 책)
getLockedBooks(allBooks: any[])

// 특정 책이 잠겨있는지 확인
isBookLocked(book: any, allBooks: any[])

// 잠긴 책 개수
getLockedBooksCount(totalBooks: number)
```

#### 권한 확인 관련
```typescript
// 책 추가 가능 여부
canAddBookToGroup(groupId: string)
// Returns: { allowed: boolean, reason: string, currentCount?: number }

// 그룹 참가 가능 여부
canJoinGroup()
// Returns: { allowed: boolean, currentCount: number, message: string }

// 그룹 생성 가능 여부 (canJoinGroup과 동일)
canCreateGroup()
```

### 사용 예시
```vue
<script setup>
const {
  isPremium,
  isFree,
  getVisibleBooks,
  getLockedBooks,
  canAddBookToGroup
} = useSubscription()

// 그룹 페이지에서
const visibleBooks = computed(() => getVisibleBooks(allBooks.value))
const lockedBooks = computed(() => getLockedBooks(allBooks.value))
</script>
```

---

## 3. 컴포넌트: `components/UpgradePromptModal.vue`

### Props
```typescript
interface Props {
  isOpen: boolean
  feature: 'groups' | 'books' | 'insights' | 'general'
  currentCount?: number
}
```

### 기능별 메시지
- **groups**: "무료 플랜은 1개 그룹만 참가 가능"
- **books**: "가장 오래된 10권까지만 읽을 수 있음"
- **insights**: "프리미엄 전용 통계 기능"
- **general**: "프리미엄 기능"

### 사용 예시
```vue
<template>
  <UpgradePromptModal
    :isOpen="upgradeModalOpen"
    feature="books"
    @close="upgradeModalOpen = false"
  />
</template>
```

---

## 4. 그룹 페이지 잠금 책 UI 구현

### 필요한 수정 사항

#### `pages/group/[id].vue` (또는 책 목록 컴포넌트)

```vue
<script setup lang="ts">
import { Lock } from 'lucide-vue-next'

const {
  getVisibleBooks,
  getLockedBooks,
  getLockedBooksCount,
  isFree
} = useSubscription()

// 모든 책
const allBooks = ref([])

// Free 유저가 볼 수 있는 책
const visibleBooks = computed(() => getVisibleBooks(allBooks.value))

// Free 유저에게 잠긴 책
const lockedBooks = computed(() => getLockedBooks(allBooks.value))

// 잠긴 책 개수
const lockedCount = computed(() => getLockedBooksCount(allBooks.value.length))

// 잠긴 책 클릭 시
const upgradeModalOpen = ref(false)
const handleLockedBookClick = () => {
  upgradeModalOpen.value = true
}
</script>

<template>
  <div class="books-container">
    <!-- 상단 통계 배너 (Free 유저만) -->
    <div v-if="isFree && lockedCount > 0" class="upgrade-banner">
      <div class="flex items-center justify-between p-4 bg-gradient-to-r from-lime-50 to-emerald-50 dark:from-lime-950/20 dark:to-emerald-950/20 rounded-xl border-2 border-lime-200 dark:border-lime-800">
        <div class="flex items-center gap-3">
          <BookOpen :size="20" class="text-lime-600" />
          <div>
            <p class="font-bold text-zinc-900 dark:text-white">
              이 그룹에는 {{ allBooks.length }}권이 있습니다
            </p>
            <p class="text-sm text-zinc-600 dark:text-zinc-400">
              {{ lockedCount }}권이 잠겨있습니다
            </p>
          </div>
        </div>
        <button
          @click="handleLockedBookClick"
          class="px-4 py-2 bg-gradient-to-r from-lime-400 to-lime-500 text-black font-bold rounded-lg hover:from-lime-300 hover:to-lime-400 transition-all flex items-center gap-2"
        >
          <Sparkles :size="16" />
          프리미엄으로 업그레이드
        </button>
      </div>
    </div>

    <!-- 읽을 수 있는 책 목록 -->
    <div class="books-grid">
      <div
        v-for="book in visibleBooks"
        :key="book.id"
        @click="navigateToBook(book.id)"
        class="book-card cursor-pointer hover:scale-105 transition-transform"
      >
        <img :src="book.cover" class="rounded-lg" />
        <h3 class="font-bold">{{ book.title }}</h3>
        <p class="text-sm text-zinc-600">진도: {{ book.progress }}%</p>
      </div>
    </div>

    <!-- 잠긴 책 목록 (Free 유저만) -->
    <div v-if="isFree && lockedBooks.length > 0" class="locked-books-section mt-8">
      <div class="flex items-center gap-2 mb-4">
        <Lock :size="20} class="text-zinc-400" />
        <h3 class="text-lg font-bold text-zinc-700 dark:text-zinc-300">
          잠긴 책 ({{ lockedBooks.length }}권)
        </h3>
      </div>

      <div class="books-grid">
        <div
          v-for="book in lockedBooks"
          :key="book.id"
          @click="handleLockedBookClick"
          class="book-card locked cursor-pointer relative overflow-hidden"
        >
          <!-- 잠금 오버레이 -->
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <Lock :size="32" class="text-white mb-2" />
            <span class="text-xs font-bold text-white bg-lime-500 px-3 py-1 rounded-full">
              PREMIUM
            </span>
          </div>

          <!-- 흐린 책 이미지 -->
          <img :src="book.cover" class="rounded-lg blur-sm opacity-50" />
          <h3 class="font-bold text-zinc-500">{{ book.title }}</h3>
          <p class="text-xs text-zinc-400">프리미엄으로 잠금 해제</p>
        </div>
      </div>
    </div>

    <!-- 업그레이드 모달 -->
    <UpgradePromptModal
      :isOpen="upgradeModalOpen"
      feature="books"
      @close="upgradeModalOpen = false"
    />
  </div>
</template>

<style scoped>
.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.book-card {
  @apply rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 transition-all;
}

.book-card.locked {
  @apply opacity-80 hover:opacity-100;
}

.locked-books-section {
  @apply border-t border-zinc-200 dark:border-zinc-800 pt-6;
}
</style>
```

---

## 5. 그룹 생성 제한 구현

### 기존 CreateGroupModal 수정

```vue
<script setup lang="ts">
const { canCreateGroup } = useSubscription()
const upgradeModalOpen = ref(false)

const handleCreateGroup = async () => {
  // 1. 그룹 생성 가능 여부 확인
  const { allowed, message } = await canCreateGroup()

  if (!allowed) {
    console.log('[CreateGroup] Blocked:', message)
    upgradeModalOpen.value = true
    return // 그룹 생성 중단
  }

  // 2. 그룹 생성 로직 계속...
  // (기존 코드 유지)
}
</script>

<template>
  <!-- 기존 그룹 생성 모달 -->
  <div>
    <!-- ... -->
  </div>

  <!-- 업그레이드 프롬프트 모달 -->
  <UpgradePromptModal
    :isOpen="upgradeModalOpen"
    feature="groups"
    @close="upgradeModalOpen = false"
  />
</template>
```

---

## 6. 책 추가 제한 구현

### 책 추가 버튼 또는 모달에서

```vue
<script setup lang="ts">
const { canAddBookToGroup, isFree } = useSubscription()
const upgradeModalOpen = ref(false)

const groupId = route.params.id

// 책 추가 가능 여부 확인
const bookAddCheck = ref({ allowed: true, reason: '', currentCount: 0 })

onMounted(async () => {
  bookAddCheck.value = await canAddBookToGroup(groupId)
})

const handleAddBookClick = async () => {
  const check = await canAddBookToGroup(groupId)

  if (!check.allowed) {
    console.log('[AddBook] Blocked:', check.reason)
    upgradeModalOpen.value = true
    return
  }

  // 책 추가 모달 열기
  bookSearchModalOpen.value = true
}
</script>

<template>
  <button
    @click="handleAddBookClick"
    class="add-book-btn"
  >
    <Plus :size="20" />
    새 책 시작하기
    <Lock v-if="!bookAddCheck.allowed" :size="14" class="text-zinc-400 ml-2" />
  </button>

  <UpgradePromptModal
    :isOpen="upgradeModalOpen"
    feature="books"
    @close="upgradeModalOpen = false"
  />
</template>
```

---

## 7. 테스트 체크리스트

### Free 사용자 테스트
- [ ] 그룹 1개 생성 → ✅ 성공
- [ ] 그룹 2개 생성 시도 → ❌ 업그레이드 모달 표시
- [ ] 다른 그룹 초대 수락 시도 (1개 이미 참가 중) → ❌ 차단
- [ ] 그룹에 책 9권 추가 → ✅ 성공
- [ ] 그룹에 책 10권 추가 → ✅ 성공
- [ ] 그룹에 책 11권 추가 시도 → ❌ 업그레이드 모달 표시
- [ ] 그룹에 25권이 있을 때 → 가장 오래된 10권만 보임, 15권 잠김 UI 표시
- [ ] 잠긴 책 클릭 → 업그레이드 모달 표시

### Premium 사용자 테스트
- [ ] 그룹 10개 생성 → ✅ 모두 성공
- [ ] 그룹에 책 50권 추가 → ✅ 모두 성공
- [ ] 모든 책 볼 수 있음 → ✅ 확인
- [ ] 잠긴 책 없음 → ✅ 확인

### 혼합 그룹 테스트
- [ ] Free 그룹장 + Premium 멤버
  - Premium 멤버가 책 20권 추가 → ✅ 성공
  - Free 그룹장은 가장 오래된 10권만 보임 → ✅ 확인
- [ ] Premium 그룹장 + Free 멤버
  - Premium 그룹장이 책 30권 추가 → ✅ 성공
  - Free 멤버는 가장 오래된 10권만 보임 → ✅ 확인
  - Free 멤버가 11번째 책 추가 시도 → ❌ 차단 (이미 10권 이상)

---

## 8. 배포 순서

1. **데이터베이스 마이그레이션** (가장 먼저)
   ```
   Supabase Dashboard → SQL Editor
   → update_subscription_system_final.sql 실행
   ```

2. **코드 배포**
   - `composables/useSubscription.ts` ✅ (완료)
   - `components/UpgradePromptModal.vue` ✅ (완료)

3. **UI 통합** (다음 단계)
   - `pages/group/[id].vue` - 잠금 책 UI 추가
   - 그룹 생성 모달 - 제한 체크 추가
   - 책 추가 버튼 - 제한 체크 추가

4. **테스트**
   - Free 계정으로 전체 플로우 테스트
   - Premium 계정으로 전체 플로우 테스트
   - 혼합 그룹 테스트

5. **모니터링**
   - Supabase 로그 확인
   - 에러 추적
   - 사용자 피드백 수집

---

## 9. 주의사항

### 데이터베이스
- **RLS 정책**이 활성화되어 있으므로 클라이언트에서 직접 DB 접근 시 자동으로 제한됨
- 서버 API를 통한 우회도 함수에서 체크하므로 안전

### 기존 사용자
- 스키마 변경 후 모든 기존 사용자는 `subscription_tier='free'`로 설정됨
- 기존에 생성한 그룹/책은 유지됨
- 새로 추가하려고 할 때 제한 적용

### 다운그레이드
- Premium → Free 전환 시
  - 기존 그룹: 모두 유지 (탈퇴 강제 안 함)
  - 하지만 새 그룹 참가 불가 (이미 1개 초과)
  - 책 보기: 각 그룹에서 10권씩만 보임

### Admin 특수 케이스
- Admin은 모든 제한 무시
- Admin이 추가한 책도 Free 사용자에게는 잠김 표시될 수 있음

---

## 10. 다음 단계

1. **그룹 페이지 UI 통합** - 잠금 책 UI 추가
2. **CreateGroupModal 수정** - 제한 체크 추가
3. **책 추가 로직 수정** - 제한 체크 추가
4. **프로필 페이지** - 구독 정보 표시
5. **Insight 탭 잠금** - Free 사용자 차단
6. **전체 테스트** - 모든 시나리오 검증

---

## 📝 요약

**완료된 것:**
✅ 데이터베이스 함수 및 RLS 정책
✅ `useSubscription` composable
✅ `UpgradePromptModal` 컴포넌트

**다음 단계:**
⏳ 그룹 페이지 잠금 책 UI
⏳ 그룹 생성/참가 제한 UI
⏳ 책 추가 제한 UI
⏳ 전체 테스트

**핵심 비즈니스 로직:**
- Free: 그룹 1개, 책 10권 보기 (잠금 표시), 10권 미만일 때만 추가
- Premium: 무제한
- 개인 등급 기반, 그룹 등급 개념 없음
