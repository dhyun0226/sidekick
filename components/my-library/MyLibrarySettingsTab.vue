<template>
  <div class="space-y-4">
    <!-- Library Management -->
    <div>
      <div class="flex items-center justify-between px-1 mb-3">
        <h3 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">내 서재 관리</h3>
      </div>
      <div class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">

      <div class="flex items-center gap-2 mb-3">
        <input
          v-model="localGroupName"
          type="text"
          placeholder="서재 이름"
          :disabled="isArchived"
          class="flex-1 min-w-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-800 dark:text-zinc-200 ring-1 ring-black/[0.04] dark:ring-white/[0.06] focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button v-if="!isArchived" @click="handleSaveGroupName" class="flex-shrink-0 p-2.5 bg-zinc-900 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors">
          <Save :size="18" />
        </button>
      </div>
      <button
        v-if="!isArchived"
        @click="emit('openSearchModal')"
        class="w-full py-2.5 border border-lime-300 dark:border-lime-700 text-lime-600 dark:text-lime-400 rounded-lg text-xs font-bold hover:bg-lime-50 dark:hover:bg-lime-900/20 transition-colors flex items-center justify-center gap-2"
      >
        <Plus :size="14" />
        새 책 시작하기
      </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, Save } from 'lucide-vue-next'

interface Props {
  groupName: string
  isArchived: boolean
}

interface Emits {
  (e: 'saveGroupName', name: string): void
  (e: 'openSearchModal'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localGroupName = ref(props.groupName)

// Watch for external changes to groupName
watch(() => props.groupName, (newName) => {
  localGroupName.value = newName
})

const handleSaveGroupName = () => {
  emit('saveGroupName', localGroupName.value)
}
</script>
