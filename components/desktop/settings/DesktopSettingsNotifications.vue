<template>
  <div class="pt-6 border-t border-zinc-200/80 dark:border-zinc-800">
    <h3 class="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium mb-5">알림 설정</h3>

    <div class="space-y-5">
      <div v-for="item in notificationItems" :key="item.key" class="flex items-center justify-between">
        <div>
          <p class="text-desktop-body text-zinc-900 dark:text-white">{{ item.label }}</p>
          <p class="text-desktop-caption text-zinc-400 dark:text-zinc-500 mt-0.5">{{ item.description }}</p>
        </div>
        <button
          @click="$emit('toggle', item.key)"
          class="relative w-11 h-[24px] rounded-full transition-colors ease-apple duration-200"
          :class="settings[item.key] ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'"
        >
          <div
            class="absolute top-[3px] w-[18px] h-[18px] bg-white dark:bg-zinc-900 rounded-full shadow-sm transition-transform ease-apple duration-200"
            :class="settings[item.key] ? 'translate-x-[22px]' : 'translate-x-[3px]'"
          ></div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  settings: Record<string, boolean>
}>()

defineEmits(['toggle'])

const notificationItems = [
  { key: 'comment_reply', label: '답글 알림', description: '내 댓글에 답글이 달릴 때' },
  { key: 'reaction', label: '좋아요 알림', description: '내 댓글에 좋아요가 눌릴 때' },
  { key: 'member_join', label: '멤버 참여', description: '새 멤버가 그룹에 참여할 때' },
  { key: 'completion', label: '완독 알림', description: '멤버가 책을 완독할 때' },
  { key: 'book_added', label: '새 책 추가', description: '그룹에 새 책이 추가될 때' },
  { key: 'group_archived', label: '그룹 종료', description: '그룹이 종료될 때' },
]
</script>
