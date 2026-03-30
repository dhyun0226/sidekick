<template>
  <DesktopTimelineView
    :comments="comments"
    :view-progress="viewProgress"
    :has-more="hasMore"
    :is-loading-more="isLoadingMore"
    :is-archived="isArchived"
    :is-read-only-mode="isReadOnlyMode"
    :current-user-id="currentUserId"
    :total-pages="totalPages"
    :preferred-mode="preferredMode"
    :is-finished="isFinished"
    @submit="$emit('submit', $event)"
    @load-more="$emit('load-more')"
    @reply="$emit('reply', $event)"
    @reply-submit="$emit('reply-submit', $event)"
    @like="$emit('like', $event)"
    @open-batch="$emit('open-batch')"
    @edit="$emit('edit', $event)"
    @delete="$emit('delete', $event)"
    @progress-change="$emit('progress-change', $event)"
  />
</template>

<script setup lang="ts">
import DesktopTimelineView from '~/components/desktop/library/DesktopTimelineView.vue'

defineProps<{
  comments: any[]
  viewProgress: number
  hasMore: boolean
  isLoadingMore: boolean
  isArchived?: boolean
  isReadOnlyMode?: boolean
  currentUserId?: string
  totalPages?: number
  preferredMode?: 'percent' | 'page'
  isFinished?: boolean
}>()

defineEmits(['submit', 'load-more', 'reply', 'reply-submit', 'like', 'open-batch', 'edit', 'delete', 'progress-change'])
</script>
