<template>
  <div class="pt-6 border-t border-zinc-200/80 dark:border-zinc-800">
    <h3 class="text-desktop-micro text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium mb-5">프로필</h3>

    <div class="flex items-center gap-5 mb-6">
      <div class="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
        <img v-if="profile?.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full flex items-center justify-center text-desktop-body text-zinc-400 dark:text-zinc-500">
          {{ (profile?.nickname || 'U')[0] }}
        </div>
      </div>
      <div>
        <label class="px-3.5 py-1.5 text-desktop-callout text-zinc-600 dark:text-zinc-400 cursor-pointer ring-1 ring-zinc-200 dark:ring-zinc-700 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ease-apple duration-200">
          사진 변경
          <input type="file" accept="image/*" class="hidden" @change="handleFile" />
        </label>
      </div>
    </div>

    <div class="space-y-4">
      <div>
        <label class="text-desktop-footnote text-zinc-400 dark:text-zinc-500 mb-1.5 block font-medium">닉네임</label>
        <input
          v-model="nickname"
          class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-0 rounded-xl text-desktop-body text-zinc-900 dark:text-white placeholder-zinc-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 transition-all ease-apple duration-200"
          placeholder="닉네임 입력"
        />
      </div>
      <button
        @click="$emit('save', nickname)"
        :disabled="!nickname.trim() || saving"
        class="px-5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors ease-apple duration-200 text-desktop-callout disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[60px]"
      >
        <div v-if="saving" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        <span v-else>저장</span>
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
