<template>
  <div class="space-y-8">
    <!-- Group Info -->
    <div>
      <h4 class="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium mb-4">그룹 정보</h4>
      <div>
        <div v-if="isAdmin" class="flex items-center gap-2">
          <input
            v-if="isEditingName"
            ref="nameInputRef"
            v-model="editName"
            class="desktop-input flex-1"
            placeholder="그룹 이름"
            @keydown.enter="saveName"
            @keydown.escape="cancelEditName"
          />
          <p v-else class="text-desktop-body text-zinc-900 dark:text-white font-medium flex-1">{{ groupName }}</p>
          <button
            v-if="isEditingName"
            @click="saveName"
            :disabled="!editName.trim() || editName.trim() === groupName || isSavingName"
            class="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-desktop-caption font-medium rounded-full hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
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
            class="text-desktop-caption text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            수정
          </button>
        </div>
        <p v-else class="text-desktop-body text-zinc-900 dark:text-white font-medium">{{ groupName }}</p>
      </div>
    </div>

    <!-- Invite Code -->
    <div v-if="inviteCode">
      <h4 class="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium mb-4">초대 코드</h4>
      <div class="flex items-center gap-3">
        <code class="text-desktop-body font-mono text-zinc-900 dark:text-white tracking-widest">
          {{ inviteCode }}
        </code>
        <button
          @click="$emit('copy-code')"
          class="text-desktop-caption text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          복사
        </button>
        <button
          @click="$emit('copy-link')"
          class="text-desktop-caption text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          링크 복사
        </button>
      </div>
      <button
        v-if="isAdmin"
        @click="$emit('regenerate-code')"
        class="mt-3 text-desktop-caption text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
      >
        초대 코드 재생성
      </button>
    </div>

    <!-- Actions -->
    <div v-if="isAdmin" class="pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
      <button
        @click="$emit('delete-group')"
        class="text-desktop-caption text-zinc-400 hover:text-red-500 transition-colors text-left"
      >
        그룹 종료
      </button>
    </div>
    <div v-else class="pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
      <button
        @click="$emit('leave-group')"
        class="text-desktop-caption text-zinc-400 hover:text-red-500 transition-colors text-left"
      >
        그룹 나가기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{
  groupName: string
  inviteCode?: string
  isAdmin: boolean
}>()

const emit = defineEmits(['copy-code', 'copy-link', 'regenerate-code', 'delete-group', 'leave-group', 'save-group-name'])

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
