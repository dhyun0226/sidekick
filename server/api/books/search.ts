/**
 * 네이버 책 검색 API 프록시
 *
 * CORS 문제를 해결하고 API 키를 안전하게 보호하기 위한 서버 사이드 API
 */

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const searchQuery = query.query as string
  const start = parseInt(query.start as string) || 1

  if (!searchQuery || searchQuery.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: '검색어를 입력해주세요.'
    })
  }

  // 네이버 API 키 확인
  const clientId = config.naverClientId
  const clientSecret = config.naverClientSecret

  if (!clientId || !clientSecret) {
    console.error('[Naver API] Missing credentials')
    throw createError({
      statusCode: 500,
      message: '네이버 API 설정이 올바르지 않습니다.'
    })
  }

  try {
    console.log('[Naver API] Searching for:', searchQuery)

    // 네이버 책 검색 API 호출
    const response = await $fetch('https://openapi.naver.com/v1/search/book.json', {
      method: 'GET',
      params: {
        query: searchQuery,
        display: 20, // 최대 20개 결과
        start: start, // 시작 위치 (1부터 시작)
        sort: 'sim' // 정확도순 정렬
      },
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret
      }
    })

    console.log('[Naver API] Response:', response)

    // 응답 데이터 변환
    const books = (response as any).items.map((item: any) => {
      // ISBN 추출 (ISBN13 우선, 없으면 ISBN10)
      const isbnFull = item.isbn || ''
      const isbnParts = isbnFull.split(' ')
      const isbn = isbnParts[1] || isbnParts[0] || 'unknown'

      // HTML 태그 제거
      const cleanTitle = item.title.replace(/<\/?b>/g, '')
      const cleanAuthor = item.author.replace(/<\/?b>/g, '')

      return {
        isbn: isbn,
        title: cleanTitle,
        author: cleanAuthor,
        publisher: item.publisher,
        cover: item.image,
        description: item.description,
        pubdate: item.pubdate
      }
    })

    return {
      success: true,
      books: books,
      total: (response as any).total || 0
    }

  } catch (error: any) {
    console.error('[Naver API] Error:', error)

    // 네이버 API 에러 처리
    if (error.statusCode === 400) {
      throw createError({
        statusCode: 400,
        message: '잘못된 검색어입니다.'
      })
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      throw createError({
        statusCode: 500,
        message: '네이버 API 인증에 실패했습니다. API 키를 확인해주세요.'
      })
    }

    throw createError({
      statusCode: 500,
      message: '책 검색 중 오류가 발생했습니다.'
    })
  }
})
