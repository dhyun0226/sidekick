<template>
  <div class="space-y-8">
    <section>
      <h4 class="text-desktop-micro text-zinc-400 dark:text-zinc-300 font-medium mb-4">그룹 정보</h4>
      <div v-if="isAdmin" class="space-y-3">
        <div class="flex items-center gap-2">
          <input
            v-if="isEditingName"
            ref="nameInputRef"
            v-model="editName"
            class="desktop-input flex-1"
            placeholder="그룹 이름"
            @keydown.enter="saveName"
            @keydown.escape="cancelEditName"
          />
          <p v-else class="text-desktop-body text-zinc-900 dark:text-white font-semibold flex-1 truncate">{{ groupName }}</p>
          <button
            v-if="isEditingName"
            @click="saveName"
            :disabled="!editName.trim() || editName.trim() === groupName || isSavingName"
            class="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-desktop-caption font-semibold rounded-full hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
          >
            <div v-if="isSavingName" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span v-else>저장</span>
          </button>
          <button
            v-if="isEditingName"
            @click="cancelEditName"
            class="px-3 py-1.5 text-zinc-500 text-desktop-caption hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            취소
          </button>
          <button
            v-if="!isEditingName"
            @click="startEditName"
            class="flex items-center gap-2 text-desktop-caption text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors py-1.5"
          >
            <Pencil :size="14" />
            이름 수정
          </button>
        </div>
        <p class="text-desktop-caption text-zinc-400 dark:text-zinc-400">그룹 설정과 초대 관리는 이 패널에서 처리합니다.</p>
      </div>
      <p v-else class="text-desktop-body text-zinc-900 dark:text-white font-semibold truncate">{{ groupName }}</p>
    </section>

    <section v-if="inviteCode">
      <h4 class="text-desktop-micro text-zinc-400 dark:text-zinc-300 font-medium mb-4">초대</h4>
      <div class="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
        <div class="flex items-center gap-3">
          <code class="text-desktop-body font-mono text-zinc-900 dark:text-white tracking-widest flex-1">
            {{ inviteCode }}
          </code>
          <button
            @click="$emit('copy-code')"
            class="flex items-center gap-1.5 text-desktop-caption text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <Copy :size="14" />
            코드
          </button>
          <button
            @click="$emit('copy-link')"
            class="flex items-center gap-1.5 text-desktop-caption text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <Link :size="14" />
            링크
          </button>
        </div>
      </div>
      <button
        v-if="isAdmin"
        @click="$emit('regenerate-code')"
        class="flex items-center gap-2 text-desktop-caption text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors py-1.5 mt-3"
      >
        <RefreshCw :size="14" />
        초대 코드 재생성
      </button>
    </section>

    <section v-if="isAdmin" class="pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
      <h4 class="text-desktop-micro text-zinc-400 dark:text-zinc-300 font-medium mb-4">그룹장 액션</h4>
      <button
        @click="$emit('open-search-modal')"
        class="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl hover:opacity-85 transition-opacity text-desktop-caption font-semibold"
      >
        <Plus :size="14" />
        책 추가
      </button>
      <button
        @click="$emit('delete-group')"
        class="mt-3 flex items-center gap-2 text-desktop-caption text-zinc-400 dark:text-zinc-300 hover:text-red-500 transition-colors py-1.5"
      >
        <Archive :size="14" />
        그룹 종료
      </button>
    </section>

    <section v-else class="pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
      <button
        @click="$emit('leave-group')"
        class="flex items-center gap-2 text-desktop-caption text-zinc-400 dark:text-zinc-300 hover:text-red-500 transition-colors py-1.5"
      >
        <LogOut :size="14" />
        그룹 나가기
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Copy, Link, RefreshCw, Pencil, Plus, Archive, LogOut } from 'lucide-vue-next'

const props = defineProps<{
  groupName: string
  inviteCode?: string
  isAdmin: boolean
}>()

const emit = defineEmits(['copy-code', 'copy-link', 'regenerate-code', 'delete-group', 'leave-group', 'save-group-name', 'open-search-modal'])

const isEditingName = ref(false)
const editName = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)
const isSavingName = ref(false)

const startEditName = () => {
  editName.value = props.groupName
  isEditingName.value = true
  nextTick(() => nameInputRef.value?.focus())
}

const cancelEditName = () => {
  isEditingName.value = false
  editName.value = ''
}

const saveName = () => {
  const trimmed = editName.value.trim()
  if (!trimmed || trimmed === props.groupName || isSavingName.value) return
  isSavingName.value = true
  try {
    emit('save-group-name', trimmed)
    isEditingName.value = false
  } finally {
    isSavingName.value = false
  }
}
</script>
