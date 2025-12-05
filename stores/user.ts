import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
    const user = useSupabaseUser()
    const client = useSupabaseClient()
    const router = useRouter()

    const profile = ref(null)

    const fetchProfile = async () => {
        if (!user.value) return

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
        const { error } = await client.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error
        await fetchProfile()
        router.push('/')
    }

    const signUp = async (email: string, password: string, nickname: string) => {
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
        router.push('/')
    }

    const signOut = async () => {
        await client.auth.signOut()
        profile.value = null
        router.push('/login')
    }

    const signInWithOAuth = async (provider: 'google' | 'kakao') => {
        const { error } = await client.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: window.location.origin
            }
        })
        if (error) throw error
    }

    return {
        user,
        profile,
        fetchProfile,
        signIn,
        signUp,
        signOut,
        signInWithOAuth
    }
})
