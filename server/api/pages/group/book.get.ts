/**
 * 그룹 책 전환 API
 * GET /api/pages/group/book?bookId={bookId}
 *
 * 책 전환 시 3개 클라이언트 쿼리를 1개 API로 통합:
 * 1. comments + reactions (코멘트 + 좋아요)
 * 2. user_reading_progress (유저 진도)
 * 3. user_reading_progress (멤버 전체 진도)
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

const COMMENTS_PER_PAGE = 20

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, message: '인증이 필요합니다' })
    }

    const client = serverSupabaseServiceRole(event)
    const userId = user.sub
    const query = getQuery(event)
    const bookId = query.bookId as string

    if (!bookId) {
      throw createError({ statusCode: 400, message: 'bookId가 필요합니다' })
    }

    // Fetch comments and all member progress in parallel
    const [commentsResult, memberProgressRes] = await Promise.all([
      fetchCommentsForBook(client, bookId, userId),
      client
        .from('user_reading_progress')
        .select('user_id, group_book_id, progress_pct, finished_at, last_read_at')
        .eq('group_book_id', bookId)
    ])

    // Extract user's own progress
    const userProgressEntry = memberProgressRes.data?.find((p: any) => p.user_id === userId)
    const userProgress = userProgressEntry?.progress_pct || 0

    return {
      comments: commentsResult.comments,
      hasMore: commentsResult.hasMore,
      userProgress,
      memberProgress: memberProgressRes.data || []
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[API /pages/group/book] Error:', err)
    throw createError({ statusCode: 500, message: '책 데이터 조회에 실패했습니다' })
  }
})

/**
 * Fetch comments for a book with reactions and nested replies
 */
async function fetchCommentsForBook(
  client: any,
  groupBookId: string,
  userId: string
) {
  const { data: commentsData, error: commentsError } = await client
    .from('comments')
    .select('id, user_id, content, anchor_text, position_pct, created_at, parent_id, group_book_id, user:users(*)')
    .eq('group_book_id', groupBookId)
    .order('position_pct', { ascending: true })
    .order('created_at', { ascending: true })
    .range(0, COMMENTS_PER_PAGE - 1)

  if (commentsError || !commentsData) {
    return { comments: [], hasMore: false }
  }

  const hasMore = commentsData.length >= COMMENTS_PER_PAGE

  const allCommentIds = commentsData.map((c: any) => c.id)

  if (allCommentIds.length === 0) {
    return { comments: [], hasMore: false }
  }

  // Fetch reactions in parallel
  const [reactionCountsRes, userLikesRes] = await Promise.all([
    client
      .from('reactions')
      .select('comment_id')
      .in('comment_id', allCommentIds)
      .eq('type', 'like'),
    client
      .from('reactions')
      .select('comment_id')
      .in('comment_id', allCommentIds)
      .eq('user_id', userId)
      .eq('type', 'like')
  ])

  const likeCounts: Record<string, number> = {}
  reactionCountsRes.data?.forEach((r: any) => {
    likeCounts[r.comment_id] = (likeCounts[r.comment_id] || 0) + 1
  })

  const userLikedSet = new Set(
    (userLikesRes.data || []).map((r: any) => r.comment_id)
  )

  const processedItems = commentsData.map((comment: any) => ({
    ...comment,
    likes: likeCounts[comment.id] || 0,
    isLiked: userLikedSet.has(comment.id),
    replies: [] as any[]
  }))

  const itemsById: Record<string, any> = {}
  processedItems.forEach((c: any) => { itemsById[c.id] = c })

  const rootComments: any[] = []
  processedItems.forEach((item: any) => {
    if (item.parent_id) {
      const parent = itemsById[item.parent_id]
      if (parent) {
        if (!parent.replies) parent.replies = []
        parent.replies.push(item)
      }
    } else {
      rootComments.push(item)
    }
  })

  return { comments: rootComments, hasMore }
}
