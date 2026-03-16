<template>
  <div class="apple-card p-6">
    <h3 class="text-desktop-headline text-zinc-900 dark:text-white mb-6">프로필</h3>

    <div class="flex items-center gap-6 mb-6">
      <div class="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
        <img v-if="profile?.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full flex items-center justify-center text-xl text-zinc-400 dark:text-zinc-500">
          {{ (profile?.nickname || 'U')[0] }}
        </div>
      </div>
      <div>
        <label class="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-desktop-callout text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
          사진 변경
          <input type="file" accept="image/*" class="hidden" @change="handleFile" />
        </label>
      </div>
    </div>

    <div class="space-y-4">
      <div>
        <label class="text-desktop-caption text-zinc-500 dark:text-zinc-400 mb-1 block">닉네임</label>
        <input
          v-model="nickname"
          class="desktop-input"
          placeholder="닉네임 입력"
        />
      </div>
      <button
        @click="$emit('save', nickname)"
        :disabled="!nickname.trim() || saving"
        class="px-5 py-2 bg-lime-400 text-black font-semibold rounded-xl hover:bg-lime-300 transition-colors text-desktop-callout disabled:opacity-50"
      >
        {{ saving ? '저장 중...' : '저장' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  profile: any
  saving: boolean
}>()

const emit = defineEmits(['save', 'file-change'])

const nickname = ref(props.profile?.nickname || '')

watch(() => props.profile?.nickname, (v) => {
  if (v && !nickname.value) nickname.value = v
})

const handleFile = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    emit('file-change', file)
  }
}
</script>
