import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
    const profile = ref(null)

    // Lazy getters for composables to avoid SSR issues
    const getUser = () => useSupabaseUser()
    const getClient = () => useSupabaseClient()
    const getRouter = () => useRouter()

    const fetchProfile = async () => {
        console.log('[User Store] fetchProfile called')

        // Supabase User 객체 가져오기
        const client = getClient()
        const { data: { user }, error: userError } = await client.auth.getUser()

        console.log('[User Store] Current user:', user)

        if (userError || !user) {
            console.log('[User Store] No user found, clearing profile')
            profile.value = null
            return
        }

        console.log('[User Store] Fetching profile for user ID:', user.id)
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

        if (error) {
            console.error('[User Store] Error fetching profile:', error)
            return
        }

        console.log('[User Store] Profile data:', data)
        if (data) {
            profile.value = data
            console.log('[User Store] Profile set successfully:', profile.value)
        } else {
            console.log('[User Store] No profile data returned')
        }
    }

    const signOut = async () => {
        try {
            console.log('[User Store] Signing out...')
            const client = getClient()

            // 1. Supabase 세션 종료
            const { error } = await client.auth.signOut()

            if (error) {
                console.error('[User Store] Sign out error:', error)
                throw error
            }

            // 2. 로컬 상태 초기화
            profile.value = null

            console.log('[User Store] Sign out successful')

            // 3. 로그인 페이지로 리다이렉트
            getRouter().push('/login')
        } catch (error) {
            console.error('[User Store] Sign out failed:', error)
            throw error
        }
    }

    const updateProfile = async (nickname: string, avatarUrl?: string) => {
        const client = getClient()
        const { data: { user }, error: userError } = await client.auth.getUser()

        if (userError || !user) throw new Error('User not authenticated')

        const { error } = await client
            .from('users')
            .update({
                nickname,
                ...(avatarUrl && { avatar_url: avatarUrl })
            })
            .eq('id', user.id)

        if (error) throw error
        await fetchProfile()
    }

    // user ID를 반환하는 computed (다른 컴포넌트에서 사용)
    const userId = computed(async () => {
        const client = getClient()
        const { data: { user } } = await client.auth.getUser()
        return user?.id
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
