/**
 * 위시리스트 관리 Composable
 *
 * 사용자가 읽고 싶은 책을 위시리스트에 담고 관리하는 기능 제공
 */

import { ref } from 'vue'

interface WishlistItem {
  id: string
  isbn: string
  created_at: string
  book: {
    isbn: string
    title: string
    author: string
    publisher: string
    cover_url: string
  }
}

export const useWishlist = () => {
  const wishlist = ref<WishlistItem[]>([])
  const loading = ref(false)
  const client = useSupabaseClient()

  // 위시 목록 조회 (책 정보 join)
  const fetchWishlist = async (userId: string) => {
    if (!userId) return
    loading.value = true
    try {
      const { data, error } = await client
        .from('user_wishlists')
        .select(`
          id,
          isbn,
          created_at,
          book:books (
            isbn,
            title,
            author,
            publisher,
            cover_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      wishlist.value = (data || []) as unknown as WishlistItem[]
    } catch (err) {
      console.error('[useWishlist] fetchWishlist error:', err)
      wishlist.value = []
    } finally {
      loading.value = false
    }
  }

  // 위시에 담기
  const addToWishlist = async (userId: string, isbn: string) => {
    if (!userId || !isbn) return false
    try {
      const { error } = await client
        .from('user_wishlists')
        .insert({ user_id: userId, isbn })

      if (error) {
        // 이미 추가된 경우 (unique constraint)
        if (error.code === '23505') {
          return { success: false, message: '이미 위시리스트에 있습니다.' }
        }
        throw error
      }
      return { success: true }
    } catch (err) {
      console.error('[useWishlist] addToWishlist error:', err)
      return { success: false, message: '위시리스트 추가에 실패했습니다.' }
    }
  }

  // 위시에서 제거
  const removeFromWishlist = async (userId: string, isbn: string) => {
    if (!userId || !isbn) return false
    try {
      const { error } = await client
        .from('user_wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('isbn', isbn)

      if (error) throw error
      wishlist.value = wishlist.value.filter(item => item.isbn !== isbn)
      return { success: true }
    } catch (err) {
      console.error('[useWishlist] removeFromWishlist error:', err)
      return { success: false, message: '위시리스트 제거에 실패했습니다.' }
    }
  }

  // 위시에 있는지 확인
  const isInWishlist = (isbn: string) => {
    return wishlist.value.some(item => item.isbn === isbn)
  }

  return {
    wishlist,
    loading,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist
  }
}
