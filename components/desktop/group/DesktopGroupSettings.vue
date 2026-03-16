<template>
  <div class="space-y-6">
    <!-- Group Info -->
    <div class="apple-card p-4">
      <h4 class="text-desktop-caption text-zinc-500 uppercase tracking-wider mb-3">그룹 정보</h4>
      <div class="space-y-3">
        <div>
          <label class="text-desktop-caption text-zinc-500 mb-1 block">그룹 이름</label>
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
            <p v-else class="text-desktop-body text-zinc-900 dark:text-white font-semibold flex-1">{{ groupName }}</p>
            <button
              v-if="isEditingName"
              @click="saveName"
              :disabled="!editName.trim() || editName.trim() === groupName"
              class="px-3 py-1.5 bg-lime-400 text-black text-desktop-caption font-semibold rounded-lg hover:bg-lime-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              저장
            </button>
            <button
              v-if="isEditingName"
              @click="cancelEditName"
              class="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-desktop-caption font-semibold rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              취소
            </button>
            <button
              v-if="!isEditingName"
              @click="startEditName"
              class="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-desktop-caption font-semibold rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              수정
            </button>
          </div>
          <p v-else class="text-desktop-body text-zinc-900 dark:text-white font-semibold">{{ groupName }}</p>
        </div>
      </div>
    </div>

    <!-- Invite Code -->
    <div v-if="inviteCode" class="apple-card p-4">
      <h4 class="text-desktop-caption text-zinc-500 uppercase tracking-wider mb-3">초대 코드</h4>
      <div class="flex items-center gap-2">
        <code class="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-desktop-body font-mono text-zinc-900 dark:text-white">
          {{ inviteCode }}
        </code>
        <button
          @click="$emit('copy-code')"
          class="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-desktop-caption text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          복사
        </button>
        <button
          @click="$emit('copy-link')"
          class="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-desktop-caption text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          링크 복사
        </button>
      </div>
      <button
        v-if="isAdmin"
        @click="$emit('regenerate-code')"
        class="mt-2 px-3 py-2 text-desktop-caption text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
      >
        초대 코드 재생성
      </button>
    </div>

    <!-- Actions -->
    <div v-if="isAdmin" class="space-y-2">
      <button
        @click="$emit('delete-group')"
        class="w-full px-3 py-2 text-desktop-caption text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-left"
      >
        그룹 종료
      </button>
    </div>
    <div v-else class="space-y-2">
      <button
        @click="$emit('leave-group')"
        class="w-full px-3 py-2 text-desktop-caption text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-left"
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
  if (!trimmed || trimmed === props.groupName) return
  emit('save-group-name', trimmed)
  isEditingName.value = false
}
</script>
