<template>
  <div class="apple-card p-6">
    <h3 class="text-desktop-headline text-zinc-900 dark:text-white mb-6">알림 설정</h3>

    <div class="space-y-4">
      <div v-for="item in notificationItems" :key="item.key" class="flex items-center justify-between">
        <div>
          <p class="text-desktop-body text-zinc-900 dark:text-white">{{ item.label }}</p>
          <p class="text-desktop-caption text-zinc-500 dark:text-zinc-400">{{ item.description }}</p>
        </div>
        <button
          @click="$emit('toggle', item.key)"
          class="relative w-12 h-7 rounded-full transition-colors"
          :class="settings[item.key] ? 'bg-lime-400' : 'bg-zinc-300'"
        >
          <div
            class="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform"
            :class="settings[item.key] ? 'translate-x-5' : 'translate-x-0.5'"
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
