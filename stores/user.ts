import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
    const profile = ref(null)

    // Lazy getters for composables to avoid SSR issues
    const getUser = () => useSupabaseUser()
    const getClient = () => useSupabaseClient()
    const getRouter = () => useRouter()

    const fetchProfile = async () => {
        const user = getUser()
        if (!user.value) return

        const client = getClient()
        const { data } = await client
            .from('users')
            .select('*')
            .eq('id', user.value.id)
            .single()

        if (data) {
            profile.value = data
        }
    }

    const signOut = async () => {
        const client = getClient()
        await client.auth.signOut()
        profile.value = null
        getRouter().push('/login')
    }

    const signInWithOAuth = async (provider: 'google' | 'kakao') => {
        const client = getClient()
        const { error } = await client.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })
        if (error) throw error
    }

    const updateProfile = async (nickname: string, avatarUrl?: string) => {
        const user = getUser()
        if (!user.value) throw new Error('User not authenticated')

        const client = getClient()
        const { error } = await client
            .from('users')
            .update({
                nickname,
                ...(avatarUrl && { avatar_url: avatarUrl })
            })
            .eq('id', user.value.id)

        if (error) throw error
        await fetchProfile()
    }

    return {
        user: computed(() => getUser().value),
        profile,
        fetchProfile,
        signOut,
        signInWithOAuth,
        updateProfile
    }
})
