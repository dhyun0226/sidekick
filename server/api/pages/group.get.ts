/**
 * 그룹/라이브러리 페이지 통합 API
 * GET /api/pages/group?id={groupId}&mode=solo|social
 *
 * 기존 7-8개 클라이언트 쿼리를 1개 API로 통합:
 * 1. group_members (solo group ID 조회 — solo mode)
 * 2. groups (그룹 정보)
 * 3. group_members + users (멤버 목록 — social mode)
 * 4. group_books + books + user_reading_progress (모든 책 + 유저 진도)
 * 5. group_books (회차 계산용 — batch)
 * 6. reviews (유저 리뷰 매핑)
 * 7. comments + reactions (첫 번째 읽는 중 책의 코멘트)
 * 8. user_reading_progress (선택된 책의 멤버 진도)
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
    const mode = (query.mode as string) || 'social'
    let groupId = query.id as string

    // ── Solo mode: find user's solo group ID ──
    if (mode === 'solo') {
      const { data: soloMembership, error: soloError } = await client
        .from('group_members')
        .select('group_id, groups!inner(id, group_type)')
        .eq('user_id', userId)
        .eq('groups.group_type', 'solo')
        .is('left_at', null)
        .single()

      if (soloError || !soloMembership) {
        throw createError({ statusCode: 404, message: '내 서재를 찾을 수 없습니다' })
      }
      groupId = soloMembership.group_id
    }

    if (!groupId) {
      throw createError({ statusCode: 400, message: 'Group ID가 필요합니다' })
    }

    // ── Phase 1: Fetch group info ──
    const { data: groupData, error: groupError } = await client
      .from('groups')
      .select('id, name, group_type, status, deleted_at, invite_code, created_by')
      .eq('id', groupId)
      .single()

    if (groupError || !groupData) {
      const errMsg = mode === 'solo' ? '내 서재를 찾을 수 없습니다' : '존재하지 않는 그룹입니다'
      throw createError({ statusCode: 404, message: errMsg })
    }

    // ── Phase 2: Fetch members (social only) + books in parallel ──
    let members: any[] = []

    const membersPromise = mode === 'social'
      ? client
          .from('group_members')
          .select('*, user:users(id, nickname, avatar_url, subscription_tier)')
          .eq('group_id', groupId)
      : Promise.resolve({ data: null, error: null })

    const booksPromise = client
      .from('group_books')
      .select(`
        id, isbn, group_id, status, created_at, target_start_date, target_end_date,
        finished_at, deleted_at, toc_snapshot, pages_snapshot, genre_snapshot,
        book:books(title, author, publisher, cover_url, official_genre, draft_genre, official_pages, draft_pages, official_toc, draft_toc),
        user_reading_progress!left(last_read_at, progress_pct, finished_at)
      `)
      .eq('group_id', groupId)
      .in('status', ['reading', 'done'])
      .is('deleted_at', null)
      .eq('user_reading_progress.user_id', userId)

    const [membersRes, booksRes] = await Promise.all([membersPromise, booksPromise])

    // Process members
    if (mode === 'social') {
      if (membersRes.data) {
        members = membersRes.data.map((m: any) => ({
          id: m.user.id,
          nickname: m.user.nickname,
          avatar_url: m.user.avatar_url,
          role: m.role,
          left_at: m.left_at,
          subscription_tier: m.user.subscription_tier || 'free'
        }))
      }

      // Check access
      const isMember = members.some((m: any) => m.id === userId)
      if (!isMember) {
        throw createError({ statusCode: 403, message: '이 그룹에 접근할 권한이 없습니다' })
      }
    }

    // Process books
    if (booksRes.error) {
      throw createError({ statusCode: 500, message: '책 목록을 불러오는데 실패했습니다' })
    }

    const allBooksRaw = booksRes.data || []

    // Sort by last_read_at (descending), then by created_at
    const sortedBooks = allBooksRaw.sort((a: any, b: any) => {
      const aLastRead = a.user_reading_progress?.[0]?.last_read_at
      const bLastRead = b.user_reading_progress?.[0]?.last_read_at
      if (!aLastRead && !bLastRead) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (!aLastRead) return 1
      if (!bLastRead) return -1
      return new Date(bLastRead).getTime() - new Date(aLastRead).getTime()
    })

    // Add unified fields
    const booksWithUserProgress = sortedBooks.map((b: any) => ({
      ...b,
      user_finished_at: b.user_reading_progress?.[0]?.finished_at || null,
      genre: b.genre_snapshot || b.book?.official_genre || b.book?.draft_genre,
      total_pages: b.pages_snapshot || b.book?.official_pages || b.book?.draft_pages
    }))

    // ── Phase 3: Batch round calculation + user reviews in parallel ──
    const uniqueIsbns = [...new Set(booksWithUserProgress.map((b: any) => b.isbn))]
    const bookIds = booksWithUserProgress.map((b: any) => b.id)

    const roundsPromise = uniqueIsbns.length > 0
      ? client
          .from('group_books')
          .select('id, isbn, created_at')
          .eq('group_id', groupId)
          .in('isbn', uniqueIsbns)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [], error: null })

    const reviewsPromise = bookIds.length > 0
      ? client
          .from('reviews')
          .select('group_book_id, rating')
          .eq('user_id', userId)
          .in('group_book_id', bookIds)
      : Promise.resolve({ data: [], error: null })

    const [roundsRes, reviewsRes] = await Promise.all([roundsPromise, reviewsPromise])

    // Calculate rounds (same logic as useBookRound.getBatchBookRounds)
    const instancesByIsbn = new Map<string, Array<{ id: string; created_at: string }>>()
    roundsRes.data?.forEach((instance: any) => {
      if (!instancesByIsbn.has(instance.isbn)) {
        instancesByIsbn.set(instance.isbn, [])
      }
      instancesByIsbn.get(instance.isbn)!.push(instance)
    })

    const allBooks = booksWithUserProgress.map((b: any) => {
      const instances = instancesByIsbn.get(b.isbn) || []
      let round: number | null = null
      if (instances.length >= 2) {
        const index = instances.findIndex((inst: any) => inst.id === b.id)
        round = index === -1 ? null : index + 1
      }
      return { ...b, round }
    })

    // Build userReviewedBooks map
    const userReviewedBooks: Record<string, number> = {}
    reviewsRes.data?.forEach((r: any) => {
      userReviewedBooks[r.group_book_id] = Number(r.rating)
    })

    // ── Phase 4: Fetch selectedBook data (comments + progress) ──
    // selectedBook = first reading book
    const firstReadingBook = allBooks.find((b: any) => b.status === 'reading')
    let selectedBookData = null

    if (firstReadingBook) {
      const selectedBookId = firstReadingBook.id

      const [commentsResult, memberProgressResult] = await Promise.all([
        fetchCommentsForBook(client, selectedBookId, userId),
        client
          .from('user_reading_progress')
          .select('user_id, group_book_id, progress_pct, finished_at, last_read_at')
          .eq('group_book_id', selectedBookId)
      ])

      // User's own progress
      const userProgressEntry = memberProgressResult.data?.find((p: any) => p.user_id === userId)
      const userProgress = userProgressEntry?.progress_pct || 0

      selectedBookData = {
        comments: commentsResult.comments,
        hasMore: commentsResult.hasMore,
        userProgress,
        memberProgress: memberProgressResult.data || []
      }
    }

    return {
      group: groupData,
      groupId,
      members,
      allBooks,
      userReviewedBooks,
      selectedBookData
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[API /pages/group] Error:', err)
    throw createError({ statusCode: 500, message: '그룹 데이터 조회에 실패했습니다' })
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

  // Collect all comment IDs for reaction queries
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

  // Count likes per comment
  const likeCounts: Record<string, number> = {}
  reactionCountsRes.data?.forEach((r: any) => {
    likeCounts[r.comment_id] = (likeCounts[r.comment_id] || 0) + 1
  })

  const userLikedSet = new Set(
    (userLikesRes.data || []).map((r: any) => r.comment_id)
  )

  // Process items and initialize replies
  const processedItems = commentsData.map((comment: any) => ({
    ...comment,
    likes: likeCounts[comment.id] || 0,
    isLiked: userLikedSet.has(comment.id),
    replies: [] as any[]
  }))

  // Map items by ID for parent lookup
  const itemsById: Record<string, any> = {}
  processedItems.forEach((c: any) => { itemsById[c.id] = c })

  // Nest replies under parents
  const rootComments: any[] = []
  processedItems.forEach((item: any) => {
    if (item.parent_id) {
      const parent = itemsById[item.parent_id]
      if (parent) {
        if (!parent.replies) parent.replies = []
        parent.replies.push(item)
      }
      // Orphan replies are ignored (parent deleted)
    } else {
      rootComments.push(item)
    }
  })

  return { comments: rootComments, hasMore }
}
