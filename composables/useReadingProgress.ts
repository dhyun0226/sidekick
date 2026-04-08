import { ref, type Ref } from 'vue'
import { useToastStore } from '~/stores/toast'

interface ProgressData {
  user_id: string
  group_book_id: string
  progress_pct: number
  last_read_at: string
  finished_at: string | null
}

export const useReadingProgress = (
  groupBookId: Ref<string | null>,
  userId: Ref<string | null>
) => {
  const client = useSupabaseClient()
  const toast = useToastStore()
  const memberProgress = ref<ProgressData[]>([])

  /**
   * Optimistically update memberProgress before DB save
   * Provides instant UI feedback
   * NOTE: finished_at은 건드리지 않음 (완독/완독취소는 별도 함수로 처리)
   */
  const updateOptimistic = (progress: number) => {
    if (!groupBookId.value || !userId.value) return

    const index = memberProgress.value.findIndex(p => p.user_id === userId.value)

    if (index >= 0) {
      // Update existing progress (finished_at은 그대로 유지)
      memberProgress.value[index].progress_pct = progress
      memberProgress.value[index].last_read_at = new Date().toISOString()
    } else {
      // Add new progress entry (first time recording, finished_at은 null)
      memberProgress.value.push({
        user_id: userId.value,
        group_book_id: groupBookId.value,
        progress_pct: progress,
        last_read_at: new Date().toISOString(),
        finished_at: null
      })
    }
  }

  /**
   * Save progress to database with optimistic rollback on error
   * NOTE: finished_at은 건드리지 않음 (완독/완독취소는 별도 함수로 처리)
   */
  const saveProgress = async (progress: number) => {
    if (!groupBookId.value || !userId.value) {
      return
    }

    // 🔥 완독한 책은 저장하지 않음 (last_read_at 업데이트 방지)
    const existing = memberProgress.value.find(
      p => p.user_id === userId.value && p.group_book_id === groupBookId.value
    )
    if (existing?.finished_at) {
      return
    }

    // Backup current value for rollback
    const index = memberProgress.value.findIndex(p => p.user_id === userId.value)
    const previousProgress = index >= 0 ? memberProgress.value[index].progress_pct : 0

    try {
      const { data, error } = await client
        .from('user_reading_progress')
        .upsert({
          user_id: userId.value,
          group_book_id: groupBookId.value,
          progress_pct: progress,
          last_read_at: new Date().toISOString()
          // finished_at은 건드리지 않음 (완독 처리는 별도 함수에서만)
        }, {
          onConflict: 'user_id,group_book_id'
        })
        .select()

      if (error) {
        // Rollback on error
        if (index >= 0) {
          memberProgress.value[index].progress_pct = previousProgress
          toast.error(`진행도 저장 실패 - 이전 값(${Math.round(previousProgress)}%)으로 되돌렸습니다`)
        } else {
          toast.error('진행도 저장에 실패했습니다. 인터넷 연결을 확인해주세요')
        }
      }
    } catch (error) {
      console.error('[Progress] Save error:', error)

      // Rollback on exception
      if (index >= 0) {
        memberProgress.value[index].progress_pct = previousProgress
        toast.error(`진행도 저장 실패 - 이전 값(${Math.round(previousProgress)}%)으로 되돌렸습니다`)
      } else {
        toast.error('진행도 저장에 실패했습니다')
      }
    }
  }

  /**
   * Load user's reading progress for a specific book
   */
  const loadProgress = async (bookId: string, currentUserId: string) => {
    const { data: progressData } = await client
      .from('user_reading_progress')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('group_book_id', bookId)
      .maybeSingle()

    return progressData?.progress_pct || 0
  }

  /**
   * Load all members' progress for a specific book
   */
  const loadMemberProgress = async (bookId: string) => {
    const { data: progressData } = await client
      .from('user_reading_progress')
      .select('*')
      .eq('group_book_id', bookId)

    if (progressData) {
      memberProgress.value = progressData
    }
  }

  return {
    memberProgress,
    updateOptimistic,
    saveProgress,
    loadProgress,
    loadMemberProgress
  }
}
