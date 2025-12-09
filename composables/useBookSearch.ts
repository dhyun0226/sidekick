/**
 * 책 검색 API (Naver Book API)
 *
 * Naver Open API를 사용합니다.
 * https://developers.naver.com/docs/serviceapi/search/book/book.md
 */

interface Book {
  isbn: string
  title: string
  author: string
  publisher: string
  cover: string
  description?: string
  totalPages?: number
}

export const useBookSearch = () => {
  const searchBooks = async (query: string, start: number = 1): Promise<{ books: Book[]; hasMore: boolean }> => {
    if (!query || query.trim().length === 0) {
      return { books: [], hasMore: false }
    }

    try {
      console.log('[BookSearch] Searching for:', query, 'start:', start)

      // 자체 서버 API를 통해 네이버 API 호출 (CORS 해결)
      const response = await $fetch('/api/books/search', {
        method: 'GET',
        params: {
          query: query.trim(),
          start
        }
      }) as { success: boolean; books: any[]; total: number }

      if (!response.success) {
        throw new Error('검색에 실패했습니다.')
      }

      const books: Book[] = response.books.map((book: any) => ({
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        cover: book.cover,
        description: book.description,
        totalPages: null // 네이버 API는 페이지 수 제공 안 함
      }))

      // 네이버 API는 최대 1000개까지만 제공
      const hasMore = (start + 20) <= Math.min(response.total, 1000) && books.length === 20

      console.log('[BookSearch] Found:', books.length, 'books, hasMore:', hasMore)
      return { books, hasMore }

    } catch (error: any) {
      console.error('[BookSearch] Error:', error)
      throw new Error(error.data?.message || error.message || '책 검색 중 오류가 발생했습니다.')
    }
  }

  return {
    searchBooks
  }
}
