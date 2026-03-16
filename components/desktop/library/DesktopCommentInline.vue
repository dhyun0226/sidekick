<template>
  <div
    class="apple-card group/card overflow-hidden transition-all duration-200"
    :class="isOwn ? 'ring-1 ring-lime-200/50 dark:ring-lime-800/30' : ''"
  >
    <!-- Quote Section (if exists) -->
    <div
      v-if="comment.anchor_text"
      class="px-5 py-3 bg-gradient-to-r from-lime-50/80 to-emerald-50/40 dark:from-lime-950/20 dark:to-emerald-950/10 border-b border-lime-100/80 dark:border-lime-900/30"
    >
      <div class="flex items-start gap-2">
        <Quote :size="14" class="text-lime-500/70 mt-0.5 flex-shrink-0" />
        <p class="text-desktop-body italic text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {{ comment.anchor_text }}
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="p-5">
      <!-- Author Row -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2.5">
          <!-- Avatar -->
          <div class="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-zinc-900 shadow-sm">
            <img
              v-if="comment.user?.avatar_url"
              :src="comment.user.avatar_url"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-white text-[11px] font-bold">
              {{ (comment.user?.nickname || '나')[0] }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-desktop-callout text-zinc-900 dark:text-white">{{ comment.user?.nickname || '나' }}</span>
            <span v-if="isOwn" class="text-[10px] px-1.5 py-0.5 bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400 rounded-full font-semibold">나</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- Progress badge -->
          <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            {{ Math.round(comment.position_pct) }}%
          </span>
          <span class="text-desktop-caption text-zinc-400">{{ timeAgo }}</span>
        </div>
      </div>

      <!-- Content (view mode) -->
      <template v-if="!isEditing">
        <p class="text-desktop-body text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">{{ comment.content }}</p>
      </template>

      <!-- Content (edit mode) -->
      <template v-else>
        <textarea
          ref="editTextareaRef"
          v-model="editContent"
          rows="3"
          class="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-desktop-body text-zinc-800 dark:text-zinc-200 resize-none transition-all focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 mb-3"
          @keydown.meta.enter="saveEdit"
          @keydown.ctrl.enter="saveEdit"
          @keydown.escape="cancelEdit"
        ></textarea>
        <div class="flex items-center gap-2">
          <button
            @click="saveEdit"
            :disabled="!editContent.trim()"
            class="px-3.5 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-desktop-caption font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-40"
          >
            저장
          </button>
          <button
            @click="cancelEdit"
            class="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-desktop-caption font-semibold rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            취소
          </button>
          <kbd class="ml-auto text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">⌘↵ 저장</kbd>
        </div>
      </template>

      <!-- Actions Bar -->
      <div v-if="!isEditing" class="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div class="flex items-center gap-1">
          <!-- Like -->
          <button
            @click="handleLike"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-desktop-caption font-medium transition-all"
            :class="comment.isLiked
              ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
              : 'text-zinc-400 hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/10'"
          >
            <Heart
              :size="14"
              :fill="comment.isLiked ? 'currentColor' : 'none'"
              :class="justLiked ? 'animate-like-bounce' : ''"
            />
            <span v-if="comment.likes" class="tabular-nums">{{ comment.likes }}</span>
            <span v-else>좋아요</span>
          </button>

          <!-- Reply -->
          <button
            @click="$emit('reply', comment)"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-desktop-caption font-medium text-zinc-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all"
          >
            <MessageCircle :size="14" />
            <span v-if="comment.replies?.length" class="tabular-nums">{{ comment.replies.length }}</span>
            <span v-else>답글</span>
          </button>
        </div>

        <!-- Own comment actions (hover reveal) -->
        <div v-if="isOwn" class="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
          <button
            @click="startEdit"
            class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="수정"
          >
            <Pencil :size="13" />
          </button>
          <button
            @click="$emit('delete', comment)"
            class="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            title="삭제"
          >
            <Trash2 :size="13" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Heart, MessageCircle, Pencil, Trash2, Quote } from 'lucide-vue-next'

const props = defineProps<{
  comment: any
  currentUserId?: string
}>()

const emit = defineEmits(['reply', 'like', 'edit', 'delete'])

const { formatTimeAgo } = useDateUtils()

const timeAgo = computed(() => formatTimeAgo(props.comment.created_at) || '')
const isOwn = computed(() => props.currentUserId && props.comment.user_id === props.currentUserId)

const isEditing = ref(false)
const editContent = ref('')
const editTextareaRef = ref<HTMLTextAreaElement | null>(null)
const justLiked = ref(false)

const startEdit = () => {
  editContent.value = props.comment.content
  isEditing.value = true
  nextTick(() => editTextareaRef.value?.focus())
}

const cancelEdit = () => {
  isEditing.value = false
  editContent.value = ''
}

const saveEdit = () => {
  if (!editContent.value.trim()) return
  emit('edit', { ...props.comment, content: editContent.value.trim() })
  isEditing.value = false
}

const handleLike = () => {
  if (!props.comment.isLiked) {
    justLiked.value = true
    setTimeout(() => { justLiked.value = false }, 400)
  }
  emit('like', props.comment)
}
</script>

<style scoped>
@keyframes like-bounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.4); }
  60% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

.animate-like-bounce {
  animation: like-bounce 0.4s ease-out;
}
</style>
