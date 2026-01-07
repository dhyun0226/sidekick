/**
 * Genre management composable
 * Defines available book genres and provides utility functions
 */

export const GENRES = [
  '소설',
  '시/시집',
  '에세이',
  '자기계발',
  '경영/경제',
  '인문/철학',
  '사회/정치',
  '과학/기술',
  '역사',
  '예술',
  '종교',
  '기타'
] as const

export type Genre = typeof GENRES[number]

export const useGenres = () => {
  const genres = GENRES

  /**
   * Check if a string is a valid genre
   */
  const isValidGenre = (genre: string): genre is Genre => {
    return GENRES.includes(genre as Genre)
  }

  /**
   * Get genre display color (for badges)
   */
  const getGenreColor = (genre: Genre): string => {
    const colorMap: Record<Genre, string> = {
      '소설': 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
      '시/시집': 'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400',
      '에세이': 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
      '자기계발': 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
      '경영/경제': 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
      '인문/철학': 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400',
      '사회/정치': 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
      '과학/기술': 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400',
      '역사': 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
      '예술': 'bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400',
      '종교': 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
      '기타': 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
    }

    return colorMap[genre] || colorMap['기타']
  }

  return {
    genres,
    isValidGenre,
    getGenreColor
  }
}
