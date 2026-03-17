<template>
  <DesktopTimelineView
    :comments="comments"
    :view-progress="viewProgress"
    :has-more="hasMore"
    :is-loading-more="isLoadingMore"
    :is-archived="isArchived"
    :current-user-id="currentUserId"
    :total-pages="totalPages"
    :preferred-mode="preferredMode"
    @submit="$emit('submit', $event)"
    @load-more="$emit('load-more')"
    @reply="$emit('reply', $event)"
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
  currentUserId?: string
  totalPages?: number
  preferredMode?: 'percent' | 'page'
}>()

defineEmits(['submit', 'load-more', 'reply', 'like', 'open-batch', 'edit', 'delete', 'progress-change'])
</script>
