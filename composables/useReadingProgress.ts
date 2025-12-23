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
   */
  const updateOptimistic = (progress: number) => {
    if (!groupBookId.value || !userId.value) return

    const roundedProgress = Math.round(progress)
    // 100% 이상이면 완독 처리, 미만이면 완독 취소
    const finishedAt = roundedProgress >= 100 ? new Date().toISOString() : null
    const index = memberProgress.value.findIndex(p => p.user_id === userId.value)

    if (index >= 0) {
      // Update existing progress
      memberProgress.value[index].progress_pct = roundedProgress
      memberProgress.value[index].last_read_at = new Date().toISOString()
      memberProgress.value[index].finished_at = finishedAt  // 완독 상태도 즉시 업데이트
    } else {
      // Add new progress entry (first time recording)
      memberProgress.value.push({
        user_id: userId.value,
        group_book_id: groupBookId.value,
        progress_pct: roundedProgress,
        last_read_at: new Date().toISOString(),
        finished_at: finishedAt
      })
    }
  }

  /**
   * Save progress to database with optimistic rollback on error
   */
  const saveProgress = async (progress: number) => {
    if (!groupBookId.value || !userId.value) {
      console.log('Cannot save progress:', {
        hasBook: !!groupBookId.value,
        hasUser: !!userId.value
      })
      return
    }

    const roundedProgress = Math.round(progress)
    // 100% 이상이면 완독 처리, 미만이면 완독 취소
    const finishedAt = roundedProgress >= 100 ? new Date().toISOString() : null

    // Backup current value for rollback
    const index = memberProgress.value.findIndex(p => p.user_id === userId.value)
    const previousProgress = index >= 0 ? memberProgress.value[index].progress_pct : 0

    try {
      console.log('[Progress] Saving to DB:', {
        user_id: userId.value,
        group_book_id: groupBookId.value,
        progress_pct: roundedProgress,
        finished_at: finishedAt,
        action: roundedProgress >= 100 ? 'COMPLETE' : 'IN_PROGRESS'
      })

      const { data, error } = await client
        .from('user_reading_progress')
        .upsert({
          user_id: userId.value,
          group_book_id: groupBookId.value,
          progress_pct: roundedProgress,
          last_read_at: new Date().toISOString(),
          finished_at: finishedAt  // null이면 완독 취소
        }, {
          onConflict: 'user_id,group_book_id'
        })
        .select()

      if (error) {
        console.error('[Progress] Save failed:', error)

        // Rollback on error
        if (index >= 0) {
          memberProgress.value[index].progress_pct = previousProgress
          console.log('[Progress] Rolled back to:', previousProgress)
          toast.error(`진행도 저장 실패 - 이전 값(${previousProgress}%)으로 되돌렸습니다.`)
        } else {
          toast.error('진행도 저장에 실패했습니다. 인터넷 연결을 확인해주세요.')
        }
      } else {
        console.log('[Progress] Saved successfully:', data)
      }
    } catch (error) {
      console.error('[Progress] Save error:', error)

      // Rollback on exception
      if (index >= 0) {
        memberProgress.value[index].progress_pct = previousProgress
        console.log('[Progress] Rolled back to:', previousProgress)
        toast.error(`진행도 저장 실패 - 이전 값(${previousProgress}%)으로 되돌렸습니다.`)
      } else {
        toast.error('진행도 저장 중 오류가 발생했습니다.')
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
