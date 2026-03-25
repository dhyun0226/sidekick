import { defineStore } from 'pinia'

interface UserProfile {
    id: string
    email?: string
    nickname?: string
    avatar_url?: string
    subscription_tier?: string
    created_at?: string
    updated_at?: string
}

export const useUserStore = defineStore('user', () => {
    const profile = ref<UserProfile | null>(null)
    const isLoading = ref(false)
    const lastFetchTime = ref<number | null>(null)
    const CACHE_DURATION = 5 * 60 * 1000 // 5분 캐시

    // Lazy getters for composables to avoid SSR issues
    const getUser = () => useSupabaseUser()
    const getClient = () => useSupabaseClient()
    const getRouter = () => useRouter()

    const fetchProfile = async (force = false) => {
        // 캐싱으로 중복 호출 방지
        // 1. 이미 로딩 중이면 대기
        if (isLoading.value && !force) {
            return
        }

        // 2. 최근에 fetch했고 force가 아니면 캐시 사용
        if (!force && profile.value && lastFetchTime.value) {
            const timeSinceLastFetch = Date.now() - lastFetchTime.value
            if (timeSinceLastFetch < CACHE_DURATION) {
                return
            }
        }

        isLoading.value = true

        try {
            const client = getClient()
            const { data: { user } } = await client.auth.getUser()

            if (!user) {
                profile.value = null
                return
            }

            const { data, error } = await client
                .from('users')
                .select('*')
                .eq('id', user.id)
                .maybeSingle()

        if (error) {
            return
        }

            if (data) {
                profile.value = data
                lastFetchTime.value = Date.now()
            }
        } finally {
            isLoading.value = false
        }
    }

    const signOut = async () => {
        try {
            const client = getClient()

            // 1. Supabase 세션 종료
            const { error } = await client.auth.signOut()

            if (error) {
                throw error
            }

            // 2. 로컬 상태 초기화
            profile.value = null
            lastFetchTime.value = null
            isLoading.value = false

            // 3. 구독 캐시 초기화
            try {
                const { resetLimitsCache } = useSubscription()
                resetLimitsCache()
            } catch (e) {
                // Subscription cache clear failed, non-critical
            }

            // 4. 로그인 페이지로 리다이렉트
            getRouter().push('/login')
        } catch (error) {
            console.error('[User Store] Sign out failed:', error)
            throw error
        }
    }

    const updateProfile = async (nickname: string, avatarUrl?: string) => {
        const client = getClient()
        const { data: { user } } = await client.auth.getUser()

        if (!user) throw new Error('User not authenticated')

        const { error } = await client
            .from('users')
            .update({
                nickname,
                ...(avatarUrl && { avatar_url: avatarUrl })
            })
            .eq('id', user.id)

        if (error) throw error
        await fetchProfile(true) // Force refresh after update
    }

    // user ID를 반환하는 computed (다른 컴포넌트에서 사용)
    const userId = computed(() => {
        // 🔥 성능 최적화: useSupabaseUser() 사용
        const user = getUser()
        return user.value?.id
    })

    return {
        user: computed(() => getUser().value),
        userId,
        profile,
        fetchProfile,
        signOut,
        updateProfile
    }
})
