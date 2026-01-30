<template>
  <Teleport to="body">
    <Transition
      enter-active-class="ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="relative z-50" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-zinc-500/25 dark:bg-zinc-900/50 backdrop-blur-sm transition-opacity" @click="close"></div>

        <div class="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition
            enter-active-class="ease-out duration-300"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="ease-in duration-200"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="isOpen"
              class="mx-auto max-w-xl transform divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden rounded-xl bg-white dark:bg-zinc-900 shadow-2xl ring-1 ring-black ring-opacity-5 transition-all"
            >
              <div class="relative">
                <Search class="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-zinc-400" aria-hidden="true" />
                <input
                  ref="searchInput"
                  type="text"
                  class="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-0 sm:text-sm outline-none"
                  placeholder="검색 또는 명령어 입력... (도서, 사용자, 메뉴)"
                  @input="query = ($event.target as HTMLInputElement).value"
                  :value="query"
                  @keydown.down.prevent="onArrowDown"
                  @keydown.up.prevent="onArrowUp"
                  @keydown.enter="onEnter"
                  @keydown.esc="close"
                />
              </div>

              <div v-if="filteredItems.length > 0" class="max-h-96 scroll-py-3 overflow-y-auto p-3">
                <ul class="text-sm text-zinc-700 dark:text-zinc-200 space-y-1">
                  <li
                    v-for="(item, index) in filteredItems"
                    :key="item.id"
                    :class="[
                      'group flex cursor-default select-none rounded-lg p-2',
                      activeIndex === index ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : ''
                    ]"
                    @click="selectItem(item)"
                    @mouseenter="activeIndex = index"
                  >
                    <div
                      class="flex h-10 w-10 flex-none items-center justify-center rounded-lg"
                      :class="[
                        activeIndex === index ? 'bg-white dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-900/5 dark:ring-zinc-700'
                      ]"
                    >
                      <component :is="item.icon" class="h-6 w-6 text-zinc-500" />
                    </div>
                    <div class="ml-4 flex-auto">
                      <p class="font-medium" :class="[activeIndex === index ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300']">
                        {{ item.name }}
                      </p>
                      <p class="text-xs text-zinc-500 truncate">{{ item.description }}</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div v-if="query !== '' && filteredItems.length === 0" class="px-6 py-14 text-center text-sm sm:px-14">
                <AlertCircle class="mx-auto h-6 w-6 text-zinc-400" aria-hidden="true" />
                <p class="mt-4 font-semibold text-zinc-900 dark:text-white">검색 결과 없음</p>
                <p class="mt-2 text-zinc-500">다른 키워드로 검색해보세요.</p>
              </div>
              
              <div class="flex flex-wrap items-center bg-zinc-50 dark:bg-zinc-950/50 px-4 py-2.5 text-xs text-zinc-500 border-t border-zinc-100 dark:border-zinc-800">
                 <span class="mr-1 font-bold">Pro Tip:</span> 
                 <span>'/'를 입력하여 메뉴로 바로 이동하거나, '#'으로 사용자를 검색하세요.</span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  LayoutDashboard,
  BookOpen,
  Users,
  CreditCard,
  Shield,
  FileText,
  AlertCircle
} from 'lucide-vue-next'

const router = useRouter()
const isOpen = ref(false)
const query = ref('')
const activeIndex = ref(0)
const searchInput = ref<HTMLInputElement | null>(null)

// Mock Data Source
const items = [
  { id: 'nav-1', name: '대시보드', description: '메인 관리자 화면으로 이동', href: '/admin', icon: LayoutDashboard, type: 'nav' },
  { id: 'nav-2', name: '도서 관리', description: '도서 목록 및 목차 승인', href: '/admin/books', icon: BookOpen, type: 'nav' },
  { id: 'nav-3', name: '그룹 관리', description: '전체 독서 모임 관리', href: '/admin/groups', icon: Users, type: 'nav' },
  { id: 'nav-4', name: '사용자 관리', description: '회원 조회 및 권한 설정', href: '/admin/users', icon: Shield, type: 'nav' },
  { id: 'nav-5', name: '구독 & 결제', description: '매출 현황 및 구독 설정', href: '/admin/subscriptions', icon: CreditCard, type: 'nav' },
  { id: 'act-1', name: '목차 승인 대기 목록', description: '승인이 필요한 목차 보기', href: '/admin/books?filter=pending', icon: FileText, type: 'action' },
]

const filteredItems = computed(() => {
  if (query.value === '') {
    return items.filter(i => i.type === 'nav')
  }
  const lowerQuery = query.value.toLowerCase()
  return items.filter((item) => {
    return (
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
    )
  })
})

const open = () => {
  isOpen.value = true
  query.value = ''
  activeIndex.value = 0
  nextTick(() => {
    searchInput.value?.focus()
  })
}

const close = () => {
  isOpen.value = false
}

const onArrowDown = () => {
  if (activeIndex.value < filteredItems.value.length - 1) {
    activeIndex.value++
  }
}

const onArrowUp = () => {
  if (activeIndex.value > 0) {
    activeIndex.value--
  }
}

const selectItem = (item: any) => {
  close()
  if (item.href) {
    router.push(item.href)
  }
}

const onEnter = () => {
  const item = filteredItems.value[activeIndex.value]
  if (item) {
    selectItem(item)
  }
}

const onKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    open()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>
