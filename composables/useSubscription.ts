/**
 * 구독 관련 로직을 관리하는 Composable - DB 중심 버전
 *
 * 🎯 핵심: subscription_limits 테이블에서 제한 값을 읽어옴
 * → DB만 수정하면 프론트엔드도 자동 반영!
 *
 * 주요 기능:
 * - 사용자 등급 확인 (free/premium/admin)
 * - 그룹 참가/생성 제한 확인
 * - 소셜 그룹 읽기전용 모드 (무료 유저)
 *
 * 📌 정책:
 * - 내 서재(solo): 무료/프리미엄 모두 책 무제한 추가
 * - 소셜 그룹: 프리미엄만 책 추가 가능 (무료는 읽기전용)
 */

// ============================================
// Global State (Singleton Pattern)
// ⚠️ WARNING: 전역 상태로 인한 메모리 누수 위험
// NOTE: 추후 Pinia Store로 이동 고려
// ============================================

const limits = ref({
  max_groups: 1,
  has_statistics_access: false
})

const limitsLoading = ref(false)
const limitsLoaded = ref(false)

/**
 * 전역 상태 리셋 (테스트 및 로그아웃 시 사용)
 */
const resetLimitsCache = () => {
  limits.value = {
    max_groups: 1,
    has_statistics_access: false
  }
  limitsLoading.value = false
  limitsLoaded.value = false
}

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

    if (!currentTier) {
      return
    }

    limitsLoading.value = true
    try {
      const { data, error } = await client
        .from('subscription_limits')
        .select('max_groups_created, has_statistics_access')
        .eq('tier', currentTier)
        .single()

      if (error) {
        return
      }

      if (data) {
        limits.value = {
          max_groups: data.max_groups_created,
          has_statistics_access: data.has_statistics_access
        }
        limitsLoaded.value = true
      }
    } catch (err) {
      console.error('[fetchLimits] Exception:', err)
    } finally {
      limitsLoading.value = false
    }
  }

  // ============================================
  // Permission Check Functions
  // ============================================

  /**
   * 그룹에 책을 추가할 수 있는지 확인
   * - Solo 그룹: 모든 유저 무제한
   * - Social 그룹: Premium/Admin만 가능, Free는 읽기전용
   */
  const canAddBookToGroup = async (groupId: string): Promise<{
    allowed: boolean
    reason: string
  }> => {
    if (isPremium.value) {
      return { allowed: true, reason: '' }
    }

    // Free 유저: 그룹 타입 확인
    const { data: group, error } = await client
      .from('groups')
      .select('group_type')
      .eq('id', groupId)
      .single()

    if (error) {
      return { allowed: false, reason: '오류가 발생했습니다.' }
    }

    // Solo 그룹은 무제한
    if (group?.group_type === 'solo') {
      return { allowed: true, reason: '' }
    }

    // Social 그룹에서는 무료 유저 추가 불가
    return {
      allowed: false,
      reason: '소셜 그룹에서 책을 추가하려면 프리미엄 구독이 필요합니다.'
    }
  }

  /**
   * 그룹에 참가할 수 있는지 확인
   * - 모든 유저: 무제한 참가 가능
   * - Free 유저는 Social 그룹에서 읽기 전용 모드로 참가
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

    // 모든 유저 무제한 참가 가능
    return { allowed: true, currentCount: 0, message: '' }
  }

  /**
   * Social 그룹을 생성할 수 있는지 확인
   * - Premium/Admin: 항상 가능
   * - Free: 불가능 (Social 그룹 생성은 프리미엄 전용)
   */
  const canCreateGroup = async (): Promise<{
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

    // Social 그룹 생성은 프리미엄 전용
    if (!isPremium.value) {
      return {
        allowed: false,
        currentCount: 0,
        message: '공유 그룹 생성은 프리미엄 회원만 가능합니다.'
      }
    }

    return { allowed: true, currentCount: 0, message: '' }
  }

  /**
   * Social 그룹에서 읽기 전용 모드인지 확인
   * - Free 유저: Social 그룹에서는 읽기 전용 (댓글/진도/완독 불가)
   * - Free 유저: Solo 그룹에서는 모든 기능 가능
   * - Premium/Admin: 모든 그룹에서 모든 기능 가능
   */
  const isReadOnlyInGroup = (groupType: 'solo' | 'social') => {
    if (isPremium.value) return false
    return groupType === 'social'
  }

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

      if (!error) {
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
    resetLimitsCache,

    // Permissions
    canAddBookToGroup,
    canJoinGroup,
    canCreateGroup,
    isReadOnlyInGroup,

    // Subscription data
    subscription,
    loading,
    fetchSubscription
  }
}