/**
 * 홈 페이지 통합 API
 * GET /api/pages/home
 *
 * 기존 4개 쿼리를 1개 API로 통합:
 * 1. group_members (내 그룹 목록)
 * 2. group_books + books + user_reading_progress (현재 읽는 책)
 * 3. group_members count (그룹별 멤버 수)
 * 4. group_books done count (그룹별 완독 수)
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, message: '인증이 필요합니다' })
    }

    const serviceClient = serverSupabaseServiceRole(event)
    const userId = user.sub

    // 1. 내 그룹 멤버십
    const { data: memberData, error: memberError } = await serviceClient
      .from('group_members')
      .select(`
        group_id,
        left_at,
        groups (
          id, name, group_type, status, deleted_at
        )
      `)
      .eq('user_id', userId)

    if (memberError) throw memberError
    if (!memberData || memberData.length === 0) {
      return { groups: [] }
    }

    const groupIds = memberData.map((m: any) => m.groups.id)

    // 2~4. 병렬로 한번에 조회
    const [booksRes, membersRes, doneRes] = await Promise.all([
      // 읽는 중인 책 + 내 진도
      serviceClient
        .from('group_books')
        .select(`
          id, group_id, created_at, target_start_date, target_end_date,
          pages_snapshot, genre_snapshot,
          books (title, author, publisher, official_pages, draft_pages, cover_url, official_genre, draft_genre),
          user_reading_progress!left (last_read_at, progress_pct)
        `)
        .in('group_id', groupIds)
        .eq('status', 'reading')
        .is('deleted_at', null)
        .eq('user_reading_progress.user_id', userId),

      // 그룹별 멤버 수
      serviceClient
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds)
        .is('left_at', null),

      // 그룹별 완독 수
      serviceClient
        .from('group_books')
        .select('group_id')
        .in('group_id', groupIds)
        .eq('status', 'done')
    ])

    // 집계
    const booksByGroup = new Map<string, any[]>()
    booksRes.data?.forEach((book: any) => {
      if (!booksByGroup.has(book.group_id)) booksByGroup.set(book.group_id, [])
      booksByGroup.get(book.group_id)!.push(book)
    })

    const memberCountByGroup = new Map<string, number>()
    membersRes.data?.forEach((m: any) => {
      memberCountByGroup.set(m.group_id, (memberCountByGroup.get(m.group_id) || 0) + 1)
    })

    const doneCountByGroup = new Map<string, number>()
    doneRes.data?.forEach((b: any) => {
      doneCountByGroup.set(b.group_id, (doneCountByGroup.get(b.group_id) || 0) + 1)
    })

    // 그룹 데이터 조립
    const groups = memberData.map((item: any) => {
      const group = item.groups
      const bookList = booksByGroup.get(group.id) || []

      // 최근 읽은 순 정렬
      const sorted = bookList.sort((a: any, b: any) => {
        const aLast = a.user_reading_progress?.[0]?.last_read_at
        const bLast = b.user_reading_progress?.[0]?.last_read_at
        if (!aLast && !bLast) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (!aLast) return 1
        if (!bLast) return -1
        return new Date(bLast).getTime() - new Date(aLast).getTime()
      })

      const bookData = sorted[0]

      return {
        id: group.id,
        name: group.name,
        group_type: group.group_type,
        status: group.status,
        deleted_at: group.deleted_at,
        left_at: item.left_at,
        memberCount: memberCountByGroup.get(group.id) || 0,
        doneCount: doneCountByGroup.get(group.id) || 0,
        currentBook: bookData ? {
          title: bookData.books?.title,
          author: bookData.books?.author,
          publisher: bookData.books?.publisher,
          cover_url: bookData.books?.cover_url,
          total_pages: bookData.pages_snapshot || bookData.books?.official_pages || bookData.books?.draft_pages,
          genre: bookData.genre_snapshot || bookData.books?.official_genre || bookData.books?.draft_genre,
          created_at: bookData.created_at,
          target_start_date: bookData.target_start_date,
          target_end_date: bookData.target_end_date,
          progress: bookData.user_reading_progress?.[0]?.progress_pct || 0
        } : null
      }
    })

    return { groups }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, message: '홈 데이터 조회에 실패했습니다' })
  }
})
