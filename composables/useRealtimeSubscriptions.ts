import { watch, onUnmounted, type Ref } from 'vue'

interface Comment {
  id: string
  user_id: string
  content: string
  anchor_text?: string
  position_pct: number
  created_at: string
  parent_id?: string
  group_book_id?: string
  user?: any
}

interface ProgressUpdate {
  user_id: string
  group_book_id: string
  progress_pct: number
  last_read_at: string
  finished_at: string | null
}

export const useRealtimeSubscriptions = (
  selectedBookId: Ref<string | null>,
  drawerOpen: Ref<boolean>,
  currentUserId: Ref<string | null>,
  onCommentAdded: (comment: Comment) => void,
  onProgressUpdated: (progress: ProgressUpdate) => void
) => {
  const client = useSupabaseClient()

  let commentChannel: any = null
  let progressChannel: any = null

  /**
   * Setup comment realtime subscription for a specific book
   */
  const setupCommentSubscription = (bookId?: string) => {
    if (commentChannel) {
      client.removeChannel(commentChannel)
      commentChannel = null
    }

    const targetBookId = bookId || selectedBookId.value
    if (!targetBookId) return

    commentChannel = client.channel(`comments:${targetBookId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `group_book_id=eq.${targetBookId}` },
        async (payload) => {
          const { data: user } = await client
            .from('users')
            .select('*')
            .eq('id', payload.new.user_id)
            .single()

          if (user) {
            onCommentAdded({ ...payload.new, user })
          }
        }
      )
      .subscribe()
  }

  /**
   * Setup progress realtime subscription for a specific book
   */
  const setupProgressSubscription = (bookId: string) => {
    if (progressChannel) {
      client.removeChannel(progressChannel)
      progressChannel = null
    }

    progressChannel = client.channel('public:user_reading_progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_reading_progress',
          filter: `group_book_id=eq.${bookId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedProgress = payload.new

            // Don't update current user's progress (already optimistically updated)
            if (updatedProgress.user_id !== currentUserId.value) {
              onProgressUpdated(updatedProgress)
            }
          }
        }
      )
      .subscribe()
  }

  /**
   * Cleanup all subscriptions
   */
  const cleanup = () => {
    if (commentChannel) {
      client.removeChannel(commentChannel)
      commentChannel = null
    }
    if (progressChannel) {
      client.removeChannel(progressChannel)
      progressChannel = null
    }
  }

  /**
   * Watch drawer and selectedBookId to manage progress subscription
   */
  // Re-subscribe comments when book changes
  watch(() => selectedBookId.value, (bookId, oldBookId) => {
    if (bookId && bookId !== oldBookId) {
      setupCommentSubscription(bookId)
    }
  })

  watch([drawerOpen, () => selectedBookId.value], async ([isOpen, bookId], [wasOpen, oldBookId]) => {
    if (oldBookId && oldBookId !== bookId && progressChannel) {
      client.removeChannel(progressChannel)
      progressChannel = null
    }

    if (isOpen && bookId) {
      if (!progressChannel || oldBookId !== bookId) {
        setupProgressSubscription(bookId)
      }
    } else if (!isOpen && progressChannel) {
      client.removeChannel(progressChannel)
      progressChannel = null
    }
  })

  // Cleanup on unmount
  onUnmounted(cleanup)

  return {
    setupCommentSubscription,
    setupProgressSubscription,
    cleanup
  }
}
