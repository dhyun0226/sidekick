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

  /**
   * Fetch all comments for a specific book with likes and user data
   */
  const fetchComments = async (groupBookId: string) => {
    const { data } = await client
      .from('comments')
      .select('id, user_id, content, anchor_text, position_pct, created_at, parent_id, group_book_id, user:users(*)')
      .eq('group_book_id', groupBookId)
      .order('position_pct', { ascending: true })
      .order('created_at', { ascending: true })

    if (data) {
      // Fetch reactions for all comments
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

      // Add likes and isLiked to comments
      comments.value = data.map(comment => ({
        ...comment,
        likes: likeCounts[comment.id] || 0,
        isLiked: userLikedSet.has(comment.id)
      }))
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
    // Check if comment already exists (prevent duplicates)
    const exists = comments.value.find(c => c.id === newComment.id)
    if (exists) {
      console.log('Comment already exists, skipping')
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
    submitComment,
    addComment
  }
}
