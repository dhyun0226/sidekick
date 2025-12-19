import { ref } from 'vue'

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
  likes?: number
  isLiked?: boolean
}

interface CommentPayload {
  content: string
  anchorText: string | null
  position: number
}

export const useGroupComments = (userId: string | null) => {
  const client = useSupabaseClient()
  const comments = ref<Comment[]>([])
  const hasMore = ref(true)
  const isLoadingMore = ref(false)
  const COMMENTS_PER_PAGE = 30

  /**
   * Fetch initial comments for a specific book with likes and user data
   */
  const fetchComments = async (groupBookId: string) => {
    comments.value = [] // Reset comments
    hasMore.value = true
    await loadMoreComments(groupBookId)
  }

  /**
   * Load more comments with pagination
   */
  const loadMoreComments = async (groupBookId: string) => {
    if (isLoadingMore.value || !hasMore.value) return

    isLoadingMore.value = true

    try {
      const currentOffset = comments.value.length

      const { data, error } = await client
        .from('comments')
        .select('id, user_id, content, anchor_text, position_pct, created_at, parent_id, group_book_id, user:users(*)')
        .eq('group_book_id', groupBookId)
        .order('position_pct', { ascending: true })
        .order('created_at', { ascending: true })
        .range(currentOffset, currentOffset + COMMENTS_PER_PAGE - 1)

      if (error) {
        console.error('Error loading comments:', error)
        return
      }

      if (data) {
        // Check if we've reached the end
        if (data.length < COMMENTS_PER_PAGE) {
          hasMore.value = false
        }

        // Fetch reactions for new comments
        const commentIds = data.map(c => c.id)

        // Get reaction counts for all comments
        const { data: reactionCounts } = await client
          .from('reactions')
          .select('comment_id')
          .in('comment_id', commentIds)
          .eq('type', 'like')

        // Get user's likes
        const { data: userLikes } = userId ? await client
          .from('reactions')
          .select('comment_id')
          .in('comment_id', commentIds)
          .eq('user_id', userId)
          .eq('type', 'like') : { data: [] }

        // Count likes per comment
        const likeCounts: Record<string, number> = {}
        reactionCounts?.forEach(r => {
          likeCounts[r.comment_id] = (likeCounts[r.comment_id] || 0) + 1
        })

        // Check which comments user liked
        const userLikedSet = new Set(userLikes?.map(r => r.comment_id) || [])

        // Add new comments with likes and isLiked
        const newComments = data.map(comment => ({
          ...comment,
          likes: likeCounts[comment.id] || 0,
          isLiked: userLikedSet.has(comment.id)
        }))

        comments.value = [...comments.value, ...newComments]
      }
    } finally {
      isLoadingMore.value = false
    }
  }

  /**
   * Submit a new comment to a book
   */
  const submitComment = async (
    groupBookId: string,
    currentUserId: string,
    payload: CommentPayload
  ) => {
    const { data, error } = await client
      .from('comments')
      .insert({
        group_book_id: groupBookId,
        user_id: currentUserId,
        content: payload.content,
        position_pct: payload.position,
        anchor_text: payload.anchorText
      })
      .select('id, user_id, content, anchor_text, position_pct, created_at, parent_id, group_book_id, user:users(*)')
      .single()

    if (error) {
      throw error
    }

    if (data) {
      // Immediately add comment to UI (don't wait for realtime)
      comments.value.push(data)

      // Sort by position_pct and created_at
      comments.value.sort((a, b) => {
        if (a.position_pct !== b.position_pct) {
          return a.position_pct - b.position_pct
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })
    }

    return data
  }

  /**
   * Add a new comment to the local state (from realtime subscription)
   */
  const addComment = (newComment: Comment) => {
    // Enhanced duplicate check: ID or same user+time+position
    const exists = comments.value.find(c =>
      c.id === newComment.id ||
      (c.user_id === newComment.user_id &&
       c.created_at === newComment.created_at &&
       c.position_pct === newComment.position_pct &&
       c.content === newComment.content)
    )
    if (exists) {
      console.log('Comment already exists (ID or duplicate content), skipping')
      return
    }

    comments.value.push(newComment)

    // Sort by position_pct and created_at
    comments.value.sort((a, b) => {
      if (a.position_pct !== b.position_pct) {
        return a.position_pct - b.position_pct
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
  }

  return {
    comments,
    fetchComments,
    loadMoreComments,
    submitComment,
    addComment,
    hasMore,
    isLoadingMore
  }
}
