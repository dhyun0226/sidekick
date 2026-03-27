/**
 * 프로필 페이지 통합 API
 * GET /api/pages/profile
 *
 * 기존 fetchData()의 7개 병렬 쿼리 + N개 회차 쿼리를 1개 API로 통합:
 * 1. user_reading_progress (서재 데이터 + 책/그룹 정보)
 * 2. reviews (평점)
 * 3. group_members count (활성 그룹 수)
 * 4. users (연간 목표)
 * 5. comments (created_at만 — 스트릭/히트맵용)
 * 6. reviews (created_at만 — 스트릭/히트맵용)
 * 7. group_members (멤버십 필터링용)
 * 8. group_books (회차 계산 — 서버에서 1회 쿼리로 처리)
 * 9. user_wishlists count (위시 카운트)
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, message: '인증이 필요합니다' })
    }

    const client = serverSupabaseServiceRole(event)
    const userId = user.sub

    // ── Phase 1: 모든 독립 쿼리 병렬 실행 ──────────────────────────────
    const [
      progressRes,
      reviewsRes,
      groupCountRes,
      userRes,
      commentsDateRes,
      reviewsDateRes,
      membershipRes,
      wishCountRes
    ] = await Promise.all([
      // 1. 서재 데이터 (진도 + 책 + 그룹 정보)
      client
        .from('user_reading_progress')
        .select(`
          finished_at, progress_pct, last_read_at, hidden,
          group_book:group_books (
            id, isbn, genre_snapshot, pages_snapshot, group_id,
            target_end_date, deleted_at,
            book:books (*),
            group:groups (id, name, group_type, deleted_at)
          )
        `)
        .eq('user_id', userId)
        .order('last_read_at', { ascending: false }),

      // 2. 리뷰 (평점 매핑용)
      client
        .from('reviews')
        .select('group_book_id, rating')
        .eq('user_id', userId),

      // 3. 활성 그룹 수 (social만, solo 제외)
      client
        .from('group_members')
        .select('groups!inner(deleted_at, group_type)', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('groups.deleted_at', null)
        .eq('groups.group_type', 'social')
        .is('left_at', null),

      // 4. 연간 목표
      client
        .from('users')
        .select('yearly_reading_goal')
        .eq('id', userId)
        .single(),

      // 5. 코멘트 날짜 (스트릭/히트맵)
      client
        .from('comments')
        .select('created_at')
        .eq('user_id', userId),

      // 6. 리뷰 날짜 (스트릭/히트맵)
      client
        .from('reviews')
        .select('created_at')
        .eq('user_id', userId),

      // 7. 멤버십 (목록에서 제거된 그룹 필터링용)
      client
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId),

      // 8. 위시리스트 카운트
      client
        .from('user_wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
    ])

    if (progressRes.error) throw progressRes.error

    // ── Phase 2: 서재 데이터 가공 ──────────────────────────────────────

    // 멤버십 그룹 ID Set
    const memberGroupIds = new Set(
      (membershipRes.data || []).map((m: any) => m.group_id)
    )

    // 평점 맵
    const ratingsMap = new Map(
      (reviewsRes.data || []).map((r: any) => [r.group_book_id, r.rating])
    )

    // 기본 매핑 (멤버십이 있는 그룹만)
    const libraryData = (progressRes.data || [])
      .filter((p: any) => memberGroupIds.has(p.group_book?.group?.id))
      .map((p: any) => ({
        id: p.group_book?.book?.isbn,
        isbn: p.group_book?.isbn,
        groupBookId: p.group_book?.id,
        groupId: p.group_book?.group?.id,
        groupName: p.group_book?.group?.name,
        groupType: p.group_book?.group?.group_type,
        title: p.group_book?.book?.title,
        author: p.group_book?.book?.author,
        publisher: p.group_book?.book?.publisher,
        total_pages: p.group_book?.pages_snapshot || p.group_book?.book?.official_pages || p.group_book?.book?.draft_pages,
        cover_url: p.group_book?.book?.cover_url,
        genre: p.group_book?.genre_snapshot || p.group_book?.book?.official_genre || p.group_book?.book?.draft_genre,
        finished_at: p.finished_at,
        progress_pct: p.progress_pct,
        last_read_at: p.last_read_at,
        target_end_date: p.group_book?.target_end_date,
        myRating: ratingsMap.get(p.group_book?.id) || null,
        isArchived: p.group_book?.group?.deleted_at != null,
        isBookDeleted: p.group_book?.deleted_at != null,
        hidden: p.hidden || false,
        isDiscontinued: p.group_book?.group?.deleted_at != null && !p.finished_at,
        round: null as number | null // Phase 3에서 채움
      }))

    // ── Phase 3: 회차 계산 (서버에서 1회 쿼리로) ────────────────────────

    // 그룹별로 ISBN 수집
    const groupedByGroup = new Map<string, any[]>()
    libraryData.forEach((book: any) => {
      if (book.groupId) {
        if (!groupedByGroup.has(book.groupId)) {
          groupedByGroup.set(book.groupId, [])
        }
        groupedByGroup.get(book.groupId)!.push(book)
      }
    })

    // 모든 그룹의 고유 ISBN과 그룹 ID 수집
    const allGroupIds = [...groupedByGroup.keys()]

    if (allGroupIds.length > 0) {
      // 모든 관련 group_books를 한 번에 조회
      const allIsbns = [...new Set(libraryData.map((b: any) => b.isbn).filter(Boolean))]

      if (allIsbns.length > 0) {
        const { data: allInstances } = await client
          .from('group_books')
          .select('id, isbn, group_id, created_at')
          .in('group_id', allGroupIds)
          .in('isbn', allIsbns)
          .order('created_at', { ascending: true })

        if (allInstances && allInstances.length > 0) {
          // (groupId, isbn) -> instances[] 맵 구축
          const instanceMap = new Map<string, Array<{ id: string; created_at: string }>>()
          allInstances.forEach((inst: any) => {
            const key = `${inst.group_id}:${inst.isbn}`
            if (!instanceMap.has(key)) instanceMap.set(key, [])
            instanceMap.get(key)!.push(inst)
          })

          // 각 책에 회차 번호 할당
          libraryData.forEach((book: any) => {
            if (!book.groupId || !book.isbn) return
            const key = `${book.groupId}:${book.isbn}`
            const instances = instanceMap.get(key) || []
            if (instances.length <= 1) {
              book.round = null
            } else {
              const index = instances.findIndex((inst: any) => inst.id === book.groupBookId)
              book.round = index === -1 ? null : index + 1
            }
          })
        }
      }
    }

    // ── Phase 4: 통계 계산 ──────────────────────────────────────────────

    const booksCount = libraryData.filter((b: any) => b.finished_at && !b.isBookDeleted).length
    const groupsCount = groupCountRes.count || 0
    const yearlyGoal = userRes.data?.yearly_reading_goal || 50
    const wishCount = wishCountRes.count || 0

    // 코멘트 + 리뷰 날짜 합산
    const allDatesC = commentsDateRes.data || []
    const allDatesR = reviewsDateRes.data || []
    const commentsCount = allDatesC.length + allDatesR.length

    // 히트맵용 경량 활동 데이터
    const lightweightActivities = [
      ...allDatesC.map((c: any) => ({ created_at: c.created_at, type: 'comment', isLightweight: true })),
      ...allDatesR.map((r: any) => ({ created_at: r.created_at, type: 'review', isLightweight: true }))
    ]

    // 월별 합산
    const monthlyTotals: Record<string, number> = {}
    const allDates = [...allDatesC, ...allDatesR]
    allDates.forEach((d: any) => {
      const date = new Date(d.created_at)
      const key = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyTotals[key] = (monthlyTotals[key] || 0) + 1
    })

    // 스트릭 계산
    const getLocalDateString = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const ds = [...new Set(
      [...allDatesC, ...allDatesR].map((i: any) => getLocalDateString(new Date(i.created_at)))
    )].sort().reverse()

    let currentStreak = 0
    let longestStreak = 0

    if (ds.length > 0) {
      const t = getLocalDateString(new Date())
      const y = getLocalDateString(new Date(Date.now() - 86400000))

      if (ds[0] === t || ds[0] === y) {
        currentStreak = 1
        for (let i = 1; i < ds.length; i++) {
          const prev = new Date(ds[i - 1])
          const curr = new Date(ds[i])
          const diff = Math.floor((prev.getTime() - curr.getTime()) / 86400000)
          if (diff === 1) currentStreak++
          else break
        }
      }

      // 최장 연속
      let temp = 1
      longestStreak = 1
      for (let i = 1; i < ds.length; i++) {
        const prev = new Date(ds[i - 1])
        const curr = new Date(ds[i])
        const diff = Math.floor((prev.getTime() - curr.getTime()) / 86400000)
        if (diff === 1) {
          temp++
        } else {
          longestStreak = Math.max(longestStreak, temp)
          temp = 1
        }
      }
      longestStreak = Math.max(longestStreak, temp)
    }

    // ── 결과 반환 ──────────────────────────────────────────────────────

    return {
      library: libraryData,
      stats: {
        books: booksCount,
        wish: wishCount,
        comments: commentsCount,
        streak: currentStreak,
        groups: groupsCount
      },
      longestStreak,
      yearlyGoal,
      monthlyTotals,
      lightweightActivities
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[/api/pages/profile] Error:', err)
    throw createError({ statusCode: 500, message: '프로필 데이터 조회에 실패했습니다' })
  }
})
