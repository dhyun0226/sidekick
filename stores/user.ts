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

    const signIn = async (email: string, password: string) => {
        const client = getClient()
        const { error } = await client.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error
        await fetchProfile()
        getRouter().push('/')
    }

    const signUp = async (email: string, password: string, nickname: string) => {
        const client = getClient()
        const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nickname
                }
            }
        })
        if (error) throw error

        // Create profile record
        if (data.user) {
            const { error: profileError } = await client
                .from('users')
                .insert({
                    id: data.user.id,
                    nickname: nickname,
                    avatar_url: '' // Default empty
                })

            if (profileError) console.error('Profile creation failed:', profileError)
        }

        await fetchProfile()
        getRouter().push('/')
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
                redirectTo: window.location.origin
            }
        })
        if (error) throw error
    }

    return {
        user: computed(() => getUser().value),
        profile,
        fetchProfile,
        signIn,
        signUp,
        signOut,
        signInWithOAuth
    }
})
