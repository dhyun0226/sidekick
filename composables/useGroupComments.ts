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

        // 🎯 Collect ALL IDs including nested replies to fetch reactions
        const allItemIds = data.map(c => c.id)
        
        // Get reaction counts for all items (roots + replies)
        const { data: reactionCounts } = await client
          .from('reactions')
          .select('comment_id')
          .in('comment_id', allItemIds)
          .eq('type', 'like')

        // Get user's likes for all items
        const { data: userLikes } = userId ? await client
          .from('reactions')
          .select('comment_id')
          .in('comment_id', allItemIds)
          .eq('user_id', userId)
          .eq('type', 'like') : { data: [] }

        // Count likes per item
        const likeCounts: Record<string, number> = {}
        reactionCounts?.forEach(r => {
          likeCounts[r.comment_id] = (likeCounts[r.comment_id] || 0) + 1
        })

        const userLikedSet = new Set(userLikes?.map(r => r.comment_id) || [])

        // 1. Process items with full data and initialize replies
        const processedItems = data.map(comment => ({
          ...comment,
          likes: likeCounts[comment.id] || 0,
          isLiked: userLikedSet.has(comment.id),
          replies: []
        }))

        // 2. Map all items by ID for quick lookup
        const itemsById: Record<string, any> = {}
        // Add existing comments to lookup
        comments.value.forEach(c => { itemsById[c.id] = c })
        // Add newly fetched items to lookup
        processedItems.forEach(c => { itemsById[c.id] = c })

        // 3. Nest replies
        const rootComments: Comment[] = []
        processedItems.forEach(item => {
          if (item.parent_id) {
            const parent = itemsById[item.parent_id]
            if (parent) {
              if (!parent.replies) parent.replies = []
              if (!parent.replies.some((r: any) => r.id === item.id)) {
                parent.replies.push(item)
              }
            }
          } else {
            rootComments.push(item)
          }
        })

        // 4. Update main comments with root level comments only
        const uniqueRoots = rootComments.filter(newRoot => 
          !comments.value.some(existing => existing.id === newRoot.id)
        )
        
        comments.value = [...comments.value, ...uniqueRoots]
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
    payload: CommentPayload & { parentId?: string }
  ) => {
    const { data, error } = await client
      .from('comments')
      .insert({
        group_book_id: groupBookId,
        user_id: currentUserId,
        content: payload.content,
        position_pct: payload.position,
        anchor_text: payload.anchorText,
        parent_id: payload.parentId // parent_id 지원
      })
      .select('id, user_id, content, anchor_text, position_pct, created_at, parent_id, group_book_id, user:users(*)')
      .single()

    if (error) {
      throw error
    }

    if (data) {
      // 🎯 Handle as reply or root comment
      if (data.parent_id) {
        const parent = comments.value.find(c => c.id === data.parent_id)
        if (parent) {
          if (!parent.replies) parent.replies = []
          parent.replies.push({ ...data, likes: 0, isLiked: false })
        }
      } else {
        comments.value.push({ ...data, likes: 0, isLiked: false, replies: [] })
        // Sort root comments
        comments.value.sort((a, b) => {
          if (a.position_pct !== b.position_pct) return a.position_pct - b.position_pct
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
      }
    }

    return data
  }

  /**
   * Add a new comment to the local state (from realtime subscription)
   */
  const addComment = (newComment: Comment) => {
    // 🎯 Check if it's a reply
    if (newComment.parent_id) {
      const parent = comments.value.find(c => c.id === newComment.parent_id)
      if (parent) {
        if (!parent.replies) parent.replies = []
        const exists = parent.replies.some(r => r.id === newComment.id)
        if (!exists) {
          parent.replies.push({ ...newComment, likes: 0, isLiked: false })
        }
      }
      return // Replies don't go to the main list
    }

    // Handle root level comment
    const exists = comments.value.find(c => c.id === newComment.id)
    if (exists) return

    comments.value.push({ ...newComment, likes: 0, isLiked: false, replies: [] })

    // Sort by position_pct and created_at
    comments.value.sort((a, b) => {
      if (a.position_pct !== b.position_pct) return a.position_pct - b.position_pct
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
