/**
 * 구독 관련 로직을 관리하는 Composable - DB 중심 버전
 *
 * 🎯 핵심: subscription_limits 테이블에서 제한 값을 읽어옴
 * → DB만 수정하면 프론트엔드도 자동 반영!
 *
 * 주요 기능:
 * - 사용자 등급 확인 (free/premium/admin)
 * - 책 보기 제한 (DB에서 max_books_per_group 읽기)
 * - 잠금 책 확인
 * - 그룹 참가/생성 제한 확인
 * - 책 추가 제한 확인
 */

// ============================================
// Global State (Singleton Pattern)
// ============================================

const limits = ref({
  max_groups: 1,
  max_books_per_group: 10,
  has_statistics_access: false
})

const limitsLoading = ref(false)
const limitsLoaded = ref(false)

export const useSubscription = () => {
  const client = useSupabaseClient()
  const userStore = useUserStore()

  // ============================================
  // Computed Properties
  // ============================================

  const tier = computed(() => userStore.profile?.subscription_tier || 'free')

  const isPremium = computed(() =>
    tier.value === 'premium' || tier.value === 'admin'
  )

  const isFree = computed(() => tier.value === 'free')

  const isAdmin = computed(() => tier.value === 'admin')

  // ============================================
  // DB로부터 제한 값 관리 ⭐
  // ============================================

  /**
   * ⭐ subscription_limits 테이블에서 제한 값 가져오기
   * 앱 로딩 시 한 번만 호출하면 됨 (force=true로 강제 갱신 가능)
   */
  const fetchLimits = async (force = false) => {
    // 이미 로드되었고 강제 갱신이 아니면 리턴 (단, 값이 기본값과 다를 때만)
    if (!force && limitsLoaded.value) return 
    
    const currentTier = userStore.profile?.subscription_tier
    console.log('[fetchLimits] User Tier:', currentTier)
    
    if (!currentTier) {
      console.warn('[fetchLimits] No tier found for user')
      return
    }

    limitsLoading.value = true
    try {
      const { data, error } = await client
        .from('subscription_limits')
        .select('max_groups_created, max_books_per_group, has_statistics_access')
        .eq('tier', currentTier)
        .single()

      console.log('[fetchLimits] DB Query Result:', { data, error })

      if (error) {
        console.error('[fetchLimits] Error:', error)
        return
      }

      if (data) {
        limits.value = {
          max_groups: data.max_groups_created,
          max_books_per_group: data.max_books_per_group,
          has_statistics_access: data.has_statistics_access
        }
        limitsLoaded.value = true
        console.log('[fetchLimits] Limits updated:', limits.value)
      }
    } catch (err) {
      console.error('[fetchLimits] Exception:', err)
    } finally {
      limitsLoading.value = false
    }
  }

  // ============================================
  // Book Visibility Functions (DB 기반)
  // ============================================

  /**
   * 사용자가 볼 수 있는 책 목록 반환
   * - Premium/Admin: 전체 책
   * - Free: DB에서 읽은 max_books_per_group만큼
   */
  const getVisibleBooks = (allBooks: any[]) => {
    if (isPremium.value) {
      return allBooks
    }

    // ⭐ DB에서 읽은 제한 값 사용 (하드코딩 없음!)
    const limit = limits.value.max_books_per_group

    // Free 유저: 생성일 기준 오래된 순으로 제한 개수만큼
    return [...allBooks]
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateA - dateB
      })
      .slice(0, limit)
  }

  /**
   * 사용자가 볼 수 없는 (잠금된) 책 목록 반환
   * - Premium/Admin: 없음
   * - Free: max_books_per_group 이후의 모든 책
   */
  const getLockedBooks = (allBooks: any[]) => {
    if (isPremium.value) {
      return []
    }

    // ⭐ DB에서 읽은 제한 값 사용
    const limit = limits.value.max_books_per_group

    const sortedBooks = [...allBooks]
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateA - dateB
      })

    // limit+1번째 책부터는 잠금
    return sortedBooks.slice(limit)
  }

  /**
   * 특정 책이 현재 사용자에게 잠겨있는지 확인
   */
  const isBookLocked = (book: any, allBooks: any[]) => {
    if (isPremium.value) {
      return false
    }

    const visibleBooks = getVisibleBooks(allBooks)
    return !visibleBooks.some(b => b.id === book.id)
  }

  /**
   * 잠긴 책 개수 반환
   */
  const getLockedBooksCount = (totalBooks: number) => {
    if (isPremium.value) {
      return 0
    }
    // ⭐ DB에서 읽은 제한 값 사용
    return Math.max(0, totalBooks - limits.value.max_books_per_group)
  }

  // ============================================
  // Permission Check Functions (DB 기반)
  // ============================================

  /**
   * 그룹에 책을 추가할 수 있는지 확인
   * - Premium/Admin: 항상 가능
   * - Free: DB에서 읽은 max_books_per_group 확인
   */
  const canAddBookToGroup = async (groupId: string): Promise<{
    allowed: boolean
    reason: string
    currentCount?: number
  }> => {
    if (isPremium.value) {
      return { allowed: true, reason: '' }
    }

    // Free 유저: 그룹의 현재 책 개수 확인
    const { count, error } = await client
      .from('group_books')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)

    if (error) {
      console.error('[canAddBookToGroup] Error:', error)
      return { allowed: false, reason: '오류가 발생했습니다.' }
    }

    const currentCount = count || 0

    // ⭐ DB에서 읽은 제한 값 사용
    const limit = limits.value.max_books_per_group

    if (currentCount >= limit) {
      return {
        allowed: false,
        reason: `무료 플랜은 그룹당 ${limit}권까지만 추가할 수 있습니다.`,
        currentCount
      }
    }

    return { allowed: true, reason: '', currentCount }
  }

  /**
   * 그룹에 참가할 수 있는지 확인 (생성 포함)
   * - Premium/Admin: 항상 가능
   * - Free: DB에서 읽은 max_groups_created 확인
   */
  const canJoinGroup = async (): Promise<{
    allowed: boolean
    currentCount: number
    message: string
  }> => {
    if (!userStore.profile?.id) {
      return {
        allowed: false,
        currentCount: 0,
        message: '로그인이 필요합니다.'
      }
    }

    if (isPremium.value) {
      return { allowed: true, currentCount: 0, message: '' }
    }

    // Free 유저: 현재 참가 중인 그룹 수 확인
    const { count, error } = await client
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userStore.profile.id)

    if (error) {
      console.error('[canJoinGroup] Error:', error)
      return {
        allowed: false,
        currentCount: 0,
        message: '오류가 발생했습니다.'
      }
    }

    const currentCount = count || 0

    // ⭐ DB에서 읽은 제한 값 사용
    const limit = limits.value.max_groups
    
    console.log('[canJoinGroup] Check:', { currentCount, limit, isPremium: isPremium.value })

    if (currentCount >= limit) {
      return {
        allowed: false,
        currentCount,
        message: `무료 플랜은 ${limit}개 그룹만 참가할 수 있습니다.`
      }
    }

    return { allowed: true, currentCount, message: '' }
  }

  /**
   * 그룹을 생성할 수 있는지 확인
   * (canJoinGroup과 동일한 로직)
   */
  const canCreateGroup = canJoinGroup

  // ============================================
  // Subscription Data Fetching
  // ============================================

  const subscription = ref<any>(null)
  const loading = ref(false)

  /**
   * 현재 활성 구독 정보 가져오기
   */
  const fetchSubscription = async () => {
    if (!userStore.profile?.id) return

    loading.value = true
    try {
      const { data, error } = await client
        .from('subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', userStore.profile.id)
        .eq('status', 'active')
        .maybeSingle()

      if (error) {
        console.error('[fetchSubscription] Error:', error)
      } else {
        subscription.value = data
      }
    } catch (err) {
      console.error('[fetchSubscription] Exception:', err)
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Return
  // ============================================

  return {
    // Tier info
    tier,
    isPremium,
    isFree,
    isAdmin,

    // ⭐ DB로부터 읽은 제한 값
    limits,
    limitsLoading,
    limitsLoaded,
    fetchLimits,

    // Book visibility
    getVisibleBooks,
    getLockedBooks,
    isBookLocked,
    getLockedBooksCount,

    // Permissions
    canAddBookToGroup,
    canJoinGroup,
    canCreateGroup,

    // Subscription data
    subscription,
    loading,
    fetchSubscription
  }
}