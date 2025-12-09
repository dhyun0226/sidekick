/**
 * 책 검색 API (Kakao Book API)
 *
 * Kakao REST API 키가 필요합니다.
 * https://developers.kakao.com/docs/latest/ko/daum-search/dev-guide#search-book
 */

interface Book {
  isbn: string
  title: string
  author: string
  publisher: string
  cover: string
  totalPages?: number
}

export const useBookSearch = () => {
  const config = useRuntimeConfig()

  const searchBooks = async (query: string): Promise<Book[]> => {
    if (!query || query.trim().length === 0) {
      return []
    }

    try {
      console.log('[BookSearch] Searching for:', query)

      // Kakao API를 사용하려면 API 키가 필요합니다.
      // 현재는 Mock 데이터를 사용합니다.
      // 실제 프로덕션에서는 아래 주석을 해제하고 API 키를 설정하세요.

      /*
      const response = await $fetch('https://dapi.kakao.com/v3/search/book', {
        params: {
          query: query,
          size: 10
        },
        headers: {
          Authorization: `KakaoAK ${config.public.kakaoRestApiKey}`
        }
      })

      return response.documents.map((book: any) => ({
        isbn: book.isbn.split(' ')[0] || book.isbn, // ISBN13 사용
        title: book.title,
        author: book.authors.join(', '),
        publisher: book.publisher,
        cover: book.thumbnail,
        totalPages: null // Kakao API doesn't provide page count
      }))
      */

      // Mock 데이터 (개발/테스트용)
      const mockBooks: Book[] = [
        {
          isbn: '9788936434120',
          title: '소년이 온다',
          author: '한강',
          publisher: '창비',
          cover: 'https://image.aladin.co.kr/product/4086/97/cover500/8936434128_1.jpg',
          totalPages: 216
        },
        {
          isbn: '9788936433598',
          title: '채식주의자',
          author: '한강',
          publisher: '창비',
          cover: 'https://image.aladin.co.kr/product/124/0/cover500/8936433598_2.jpg',
          totalPages: 181
        },
        {
          isbn: '9791191891287',
          title: '트렌드 코리아 2025',
          author: '김난도 외',
          publisher: '미래의창',
          cover: 'https://image.aladin.co.kr/product/34769/53/cover500/k592934773_1.jpg',
          totalPages: 464
        },
        {
          isbn: '9788934942467',
          title: '죽은 시인의 사회',
          author: 'N. H. 클라인바움',
          publisher: '김영사',
          cover: 'https://image.aladin.co.kr/product/1/35/cover500/8934942460_2.jpg',
          totalPages: 200
        },
        {
          isbn: '9788932917245',
          title: '1984',
          author: '조지 오웰',
          publisher: '민음사',
          cover: 'https://image.aladin.co.kr/product/1816/39/cover500/k012530594_1.jpg',
          totalPages: 396
        }
      ]

      // 검색어 필터링
      const filtered = mockBooks.filter(book =>
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase())
      )

      console.log('[BookSearch] Found:', filtered.length, 'books')
      return filtered

    } catch (error) {
      console.error('[BookSearch] Error:', error)
      throw new Error('책 검색 중 오류가 발생했습니다.')
    }
  }

  return {
    searchBooks
  }
}
