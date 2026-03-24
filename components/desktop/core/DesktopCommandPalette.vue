<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150 ease-apple"
      leave-active-class="transition-opacity duration-100 ease-apple"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[100020] flex items-start justify-center pt-[18vh]" @click.self="close">
        <div class="absolute inset-0 bg-black/25 backdrop-blur-md" @click="close"></div>

        <div class="relative w-[600px] bg-white dark:bg-zinc-900 rounded-2xl shadow-apple-lg overflow-hidden ring-1 ring-black/[0.04] dark:ring-white/[0.06]" @click.stop>
          <!-- Search Input -->
          <div class="flex items-center gap-3.5 px-6 py-5">
            <Search :size="18" class="text-zinc-400 dark:text-zinc-500" :stroke-width="1.75" />
            <input
              ref="inputRef"
              v-model="query"
              placeholder="어디로 이동할까요?"
              class="flex-1 bg-transparent text-desktop-callout text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
              @keydown.down.prevent="moveSelection(1)"
              @keydown.up.prevent="moveSelection(-1)"
              @keydown.enter="executeSelected"
              @keydown.escape="close"
            />
            <kbd class="text-desktop-micro text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded font-medium">ESC</kbd>
          </div>

          <!-- Divider -->
          <div class="h-px bg-zinc-100 dark:bg-zinc-800/60"></div>

          <!-- Results -->
          <div class="max-h-[340px] overflow-y-auto py-2">
            <div
              v-for="(item, idx) in filteredItems"
              :key="item.id"
              @click="executeItem(item)"
              class="flex items-center gap-3.5 px-6 py-3 cursor-pointer transition-colors duration-150"
              :class="idx === selectedIndex ? 'bg-zinc-50 dark:bg-zinc-800/60' : 'hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30'"
            >
              <component :is="item.icon" :size="16" class="text-zinc-400 dark:text-zinc-500 flex-shrink-0" :stroke-width="1.75" />
              <span class="text-desktop-callout text-zinc-700 dark:text-zinc-300 flex-1">{{ item.label }}</span>
              <span v-if="item.shortcut" class="text-desktop-footnote text-zinc-400 dark:text-zinc-500">{{ item.shortcut }}</span>
            </div>

            <div v-if="filteredItems.length === 0" class="px-6 py-10 text-center text-desktop-callout text-zinc-400 dark:text-zinc-500">
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
