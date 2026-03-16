<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      leave-active-class="transition-opacity duration-100"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[99999] flex items-start justify-center pt-[20vh]" @click.self="close">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close"></div>

        <div class="relative w-[560px] bg-white dark:bg-zinc-900 rounded-2xl shadow-apple-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden" @click.stop>
          <!-- Search Input -->
          <div class="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <Search :size="18" class="text-zinc-400" />
            <input
              ref="inputRef"
              v-model="query"
              placeholder="페이지 이동, 명령어 검색..."
              class="flex-1 bg-transparent text-desktop-body text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
              @keydown.down.prevent="moveSelection(1)"
              @keydown.up.prevent="moveSelection(-1)"
              @keydown.enter="executeSelected"
              @keydown.escape="close"
            />
            <kbd class="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">ESC</kbd>
          </div>

          <!-- Results -->
          <div class="max-h-[300px] overflow-y-auto py-2">
            <div
              v-for="(item, idx) in filteredItems"
              :key="item.id"
              @click="executeItem(item)"
              class="flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors"
              :class="idx === selectedIndex ? 'bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'"
            >
              <component :is="item.icon" :size="16" class="text-zinc-400 flex-shrink-0" />
              <span class="text-desktop-body text-zinc-900 dark:text-white flex-1">{{ item.label }}</span>
              <span v-if="item.shortcut" class="text-desktop-caption text-zinc-400">{{ item.shortcut }}</span>
            </div>

            <div v-if="filteredItems.length === 0" class="px-5 py-8 text-center text-desktop-body text-zinc-400">
              결과가 없습니다
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Search, Home, BookOpen, Compass, User, Settings } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'navigate'])

const query = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

const items = [
  { id: 'home', label: '홈', path: '/', icon: Home, shortcut: '' },
  { id: 'library', label: '내 서재', path: '/my-library', icon: BookOpen, shortcut: '' },
  { id: 'discover', label: '디스커버', path: '/discover', icon: Compass, shortcut: '' },
  { id: 'profile', label: '프로필', path: '/profile', icon: User, shortcut: '' },
  { id: 'settings', label: '설정', path: '/settings', icon: Settings, shortcut: '' },
]

const filteredItems = computed(() => {
  if (!query.value.trim()) return items
  const q = query.value.toLowerCase()
  return items.filter(i => i.label.toLowerCase().includes(q) || i.path.includes(q))
})

watch(() => props.isOpen, (open) => {
  if (open) {
    query.value = ''
    selectedIndex.value = 0
    nextTick(() => inputRef.value?.focus())
  }
})

const moveSelection = (dir: number) => {
  selectedIndex.value = Math.max(0, Math.min(filteredItems.value.length - 1, selectedIndex.value + dir))
}

const executeSelected = () => {
  const item = filteredItems.value[selectedIndex.value]
  if (item) executeItem(item)
}

const executeItem = (item: any) => {
  emit('navigate', item.path)
  close()
}

const close = () => {
  emit('close')
}
</script>
