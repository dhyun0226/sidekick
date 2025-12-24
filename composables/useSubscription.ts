/**
 * 구독 관리 Composable
 *
 * 구독 등급(free/premium/admin)에 따른 기능 제한 및 상태 관리
 *
 * 주요 기능:
 * - tier: 현재 구독 등급
 * - isPremium/isFree: 등급 확인 computed
 * - limits: tier별 제한 정보
 * - canCreateGroup(): 그룹 생성 가능 여부 체크
 * - fetchSubscription(): 구독 상세 정보 조회
 */

export const useSubscription = () => {
  const userStore = useUserStore()
  const client = useSupabaseClient()

  const subscription = ref<any>(null)
  const loading = ref(false)

  // Computed: 현재 구독 등급
  const tier = computed(() => userStore.profile?.subscription_tier || 'free')

  // Computed: 프리미엄 여부 (premium 또는 admin)
  const isPremium = computed(() => tier.value === 'premium' || tier.value === 'admin')

  // Computed: 무료 여부
  const isFree = computed(() => tier.value === 'free')

  // Computed: tier별 제한 정보
  const limits = computed(() => {
    if (isPremium.value) {
      return {
        maxGroups: Infinity,
        maxBooksPerGroup: Infinity,
        hasInsightTab: true,
        hasPremiumBadge: true
      }
    }
    return {
      maxGroups: 2,
      maxBooksPerGroup: 10,
      hasInsightTab: false,
      hasPremiumBadge: false
    }
  })

  /**
   * 그룹 생성 가능 여부 체크
   *
   * @returns {Promise<{ allowed: boolean; currentCount: number; message?: string }>}
   */
  const canCreateGroup = async (): Promise<{
    allowed: boolean
    currentCount: number
    message?: string
  }> => {
    // 프리미엄 사용자는 무제한
    if (isPremium.value) {
      return { allowed: true, currentCount: 0 }
    }

    if (!userStore.profile?.id) {
      return {
        allowed: false,
        currentCount: 0,
        message: '사용자 정보를 찾을 수 없습니다.'
      }
    }

    try {
      // 현재 생성한 그룹 수 카운트
      const { count } = await client
        .from('groups')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userStore.profile.id)

      const currentCount = count || 0

      // 제한 초과 체크
      if (currentCount >= limits.value.maxGroups) {
        return {
          allowed: false,
          currentCount,
          message: `무료 플랜은 최대 ${limits.value.maxGroups}개 그룹만 생성할 수 있습니다.`
        }
      }

      return { allowed: true, currentCount }
    } catch (error) {
      console.error('[useSubscription] canCreateGroup error:', error)
      return {
        allowed: false,
        currentCount: 0,
        message: '그룹 생성 가능 여부를 확인할 수 없습니다.'
      }
    }
  }

  /**
   * 활성 구독 정보 조회
   *
   * subscriptions 테이블에서 현재 사용자의 활성 구독 정보 조회
   * (만료일, 자동갱신 여부 등)
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
        console.error('[useSubscription] fetchSubscription error:', error)
        return
      }

      subscription.value = data
    } catch (error) {
      console.error('[useSubscription] Unexpected error:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    tier,
    isPremium,
    isFree,
    limits,
    subscription,
    loading,
    canCreateGroup,
    fetchSubscription
  }
}
