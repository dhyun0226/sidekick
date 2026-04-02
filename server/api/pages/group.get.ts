/**
 * 그룹/라이브러리 페이지 통합 API (최적화 버전)
 * GET /api/pages/group?id={groupId}&mode=solo|social
 *
 * 최대한 병렬 처리하여 응답 시간 최소화
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

    // Solo: 그룹 ID 조회
    if (mode === 'solo') {
      const { data: soloMembership } = await client
        .from('group_members')
        .select('group_id, groups!inner(id, group_type)')
        .eq('user_id', userId)
        .eq('groups.group_type', 'solo')
        .is('left_at', null)
        .single()

      if (!soloMembership) {
        throw createError({ statusCode: 404, message: '내 서재를 찾을 수 없습니다' })
      }
      groupId = soloMembership.group_id
    }

    if (!groupId) {
      throw createError({ statusCode: 400, message: 'Group ID가 필요합니다' })
    }

    // ── 1차 병렬: 그룹 + 멤버 + 책 동시 조회 ──
    const [groupRes, membersRes, booksRes] = await Promise.all([
      client.from('groups')
        .select('id, name, group_type, status, deleted_at, invite_code, created_by')
        .eq('id', groupId)
        .single(),

      mode === 'social'
        ? client.from('group_members')
            .select('*, user:users(id, nickname, avatar_url, subscription_tier)')
            .eq('group_id', groupId)
        : Promise.resolve({ data: null, error: null }),

      client.from('group_books')
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
    ])

    if (groupRes.error || !groupRes.data) {
      throw createError({ statusCode: 404, message: mode === 'solo' ? '내 서재를 찾을 수 없습니다' : '존재하지 않는 그룹입니다' })
    }

    // 멤버 처리
    let members: any[] = []
    if (mode === 'social' && membersRes.data) {
      members = membersRes.data.map((m: any) => ({
        id: m.user.id,
        nickname: m.user.nickname,
        avatar_url: m.user.avatar_url,
        role: m.role,
        left_at: m.left_at,
        subscription_tier: m.user.subscription_tier || 'free'
      }))
      if (!members.some((m: any) => m.id === userId)) {
        throw createError({ statusCode: 403, message: '이 그룹에 접근할 권한이 없습니다' })
      }
    }

    // 책 정렬 + 통합 필드
    const allBooksRaw = (booksRes.data || [])
      .sort((a: any, b: any) => {
        const aLast = a.user_reading_progress?.[0]?.last_read_at
        const bLast = b.user_reading_progress?.[0]?.last_read_at
        if (!aLast && !bLast) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (!aLast) return 1
        if (!bLast) return -1
        return new Date(bLast).getTime() - new Date(aLast).getTime()
      })
      .map((b: any) => ({
        ...b,
        user_finished_at: b.user_reading_progress?.[0]?.finished_at || null,
        genre: b.genre_snapshot || b.book?.official_genre || b.book?.draft_genre,
        total_pages: b.pages_snapshot || b.book?.official_pages || b.book?.draft_pages
      }))

    const firstReadingBook = allBooksRaw.find((b: any) => b.status === 'reading')
    const uniqueIsbns = [...new Set(allBooksRaw.map((b: any) => b.isbn))]
    const bookIds = allBooksRaw.map((b: any) => b.id)

    // ── 2차 병렬: 회차 + 리뷰 + 댓글 + 멤버진도 동시 조회 ──
    const [roundsRes, reviewsRes, commentsResult, memberProgressRes] = await Promise.all([
      uniqueIsbns.length > 0
        ? client.from('group_books').select('id, isbn, created_at').eq('group_id', groupId).in('isbn', uniqueIsbns).order('created_at', { ascending: true })
        : Promise.resolve({ data: [], error: null }),

      bookIds.length > 0
        ? client.from('reviews').select('group_book_id, rating').eq('user_id', userId).in('group_book_id', bookIds)
        : Promise.resolve({ data: [], error: null }),

      firstReadingBook
        ? fetchCommentsForBook(client, firstReadingBook.id, userId)
        : Promise.resolve({ comments: [], hasMore: false }),

      firstReadingBook
        ? client.from('user_reading_progress').select('user_id, group_book_id, progress_pct, finished_at, last_read_at').eq('group_book_id', firstReadingBook.id)
        : Promise.resolve({ data: [], error: null })
    ])

    // 회차 계산
    const instancesByIsbn = new Map<string, Array<{ id: string; created_at: string }>>()
    roundsRes.data?.forEach((inst: any) => {
      if (!instancesByIsbn.has(inst.isbn)) instancesByIsbn.set(inst.isbn, [])
      instancesByIsbn.get(inst.isbn)!.push(inst)
    })

    const allBooks = allBooksRaw.map((b: any) => {
      const instances = instancesByIsbn.get(b.isbn) || []
      let round: number | null = null
      if (instances.length >= 2) {
        const idx = instances.findIndex((i: any) => i.id === b.id)
        round = idx === -1 ? null : idx + 1
      }
      return { ...b, round }
    })

    // 리뷰 맵
    const userReviewedBooks: Record<string, number> = {}
    reviewsRes.data?.forEach((r: any) => { userReviewedBooks[r.group_book_id] = Number(r.rating) })

    // 선택된 책 데이터
    let selectedBookData = null
    if (firstReadingBook) {
      const userProgressEntry = memberProgressRes.data?.find((p: any) => p.user_id === userId)
      selectedBookData = {
        comments: commentsResult.comments,
        hasMore: commentsResult.hasMore,
        userProgress: userProgressEntry?.progress_pct || 0,
        memberProgress: memberProgressRes.data || []
      }
    }

    return { group: groupRes.data, groupId, members, allBooks, userReviewedBooks, selectedBookData }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, message: '그룹 데이터 조회에 실패했습니다' })
  }
})

async function fetchCommentsForBook(client: any, groupBookId: string, userId: string) {
  const { data: commentsData } = await client
    .from('comments')
    .select('id, user_id, content, anchor_text, position_pct, created_at, parent_id, group_book_id, user:users(*)')
    .eq('group_book_id', groupBookId)
    .order('position_pct', { ascending: true })
    .order('created_at', { ascending: true })
    .range(0, COMMENTS_PER_PAGE - 1)

  if (!commentsData || commentsData.length === 0) return { comments: [], hasMore: false }

  const hasMore = commentsData.length >= COMMENTS_PER_PAGE
  const commentIds = commentsData.map((c: any) => c.id)

  // 반응 병렬 조회
  const [likesRes, userLikesRes] = await Promise.all([
    client.from('reactions').select('comment_id').in('comment_id', commentIds).eq('type', 'like'),
    client.from('reactions').select('comment_id').in('comment_id', commentIds).eq('user_id', userId).eq('type', 'like')
  ])

  const likeCounts: Record<string, number> = {}
  likesRes.data?.forEach((r: any) => { likeCounts[r.comment_id] = (likeCounts[r.comment_id] || 0) + 1 })
  const userLikedSet = new Set((userLikesRes.data || []).map((r: any) => r.comment_id))

  const itemsById: Record<string, any> = {}
  const processed = commentsData.map((c: any) => {
    const item = { ...c, likes: likeCounts[c.id] || 0, isLiked: userLikedSet.has(c.id), replies: [] as any[] }
    itemsById[c.id] = item
    return item
  })

  const roots: any[] = []
  processed.forEach((item: any) => {
    if (item.parent_id && itemsById[item.parent_id]) {
      itemsById[item.parent_id].replies.push(item)
    } else if (!item.parent_id) {
      roots.push(item)
    }
  })

  return { comments: roots, hasMore }
}
