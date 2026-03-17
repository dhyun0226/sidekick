<template>
  <div
    class="group/card transition-all duration-200 ease-apple rounded-2xl"
    :class="isOwn ? 'bg-zinc-50/50 dark:bg-zinc-800/20' : ''"
  >
    <!-- Quote Section (if exists) -->
    <div
      v-if="comment.anchor_text"
      class="px-5 pt-4 pb-0"
    >
      <div class="pl-3 border-l-2 border-lime-400 dark:border-lime-500">
        <p class="text-desktop-body italic text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {{ comment.anchor_text }}
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="px-5 py-4">
      <!-- Author Row -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <!-- Avatar -->
          <div class="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
            <img
              v-if="comment.user?.avatar_url"
              :src="comment.user.avatar_url"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 text-[10px] font-semibold">
              {{ (comment.user?.nickname || '나')[0] }}
            </div>
          </div>
          <span class="text-desktop-caption font-medium text-zinc-900 dark:text-white">{{ comment.user?.nickname || '나' }}</span>
        </div>
        <div class="flex items-center gap-2">
          <!-- Progress badge -->
          <span class="text-[11px] text-zinc-400 dark:text-zinc-500">
            {{ Math.round(comment.position_pct) }}%
          </span>
          <span class="text-desktop-caption text-zinc-300 dark:text-zinc-600">{{ timeAgo }}</span>
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
          class="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-desktop-body text-zinc-800 dark:text-zinc-200 resize-none transition-all duration-200 ease-apple focus:border-zinc-400 focus:ring-0 mb-3"
          @keydown.meta.enter="saveEdit"
          @keydown.ctrl.enter="saveEdit"
          @keydown.escape="cancelEdit"
        ></textarea>
        <div class="flex items-center gap-2">
          <button
            @click="saveEdit"
            :disabled="!editContent.trim()"
            class="px-3.5 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-desktop-caption font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-40"
          >
            저장
          </button>
          <button
            @click="cancelEdit"
            class="px-3.5 py-1.5 text-zinc-500 text-desktop-caption font-medium hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            취소
          </button>
          <kbd class="ml-auto text-[10px] text-zinc-300 dark:text-zinc-600">⌘↵</kbd>
        </div>
      </template>

      <!-- Actions Bar -->
      <div v-if="!isEditing" class="flex items-center justify-between mt-3">
        <div class="flex items-center gap-1">
          <!-- Like -->
          <button
            @click="handleLike"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-desktop-caption font-medium transition-all duration-200 ease-apple"
            :class="comment.isLiked
              ? 'text-red-500'
              : 'text-zinc-300 dark:text-zinc-600 hover:text-red-400'"
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
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-desktop-caption font-medium text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200 ease-apple"
          >
            <MessageCircle :size="14" />
            <span v-if="comment.replies?.length" class="tabular-nums">{{ comment.replies.length }}</span>
            <span v-else>답글</span>
          </button>
        </div>

        <!-- Own comment actions (hover reveal) -->
        <div v-if="isOwn" class="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 ease-apple">
          <button
            @click="startEdit"
            class="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            title="수정"
          >
            <Pencil :size="13" />
          </button>
          <button
            @click="$emit('delete', comment)"
            class="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 transition-colors"
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
