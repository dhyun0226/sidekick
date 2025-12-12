/**
 * Composable for calculating book round numbers
 * When the same book is added multiple times to a group,
 * this helps display which round (1회, 2회, 3회) each instance is
 */

export const useBookRound = () => {
  const client = useSupabaseClient()

  /**
   * Calculate the round number for a specific group_book instance
   *
   * @param groupId - The group ID
   * @param isbn - The book ISBN
   * @param groupBookId - The specific group_book ID to find the round for
   * @returns The round number (1, 2, 3, etc.) or null if only one instance exists
   *
   * Rules:
   * - If only 1 instance of the book exists in the group: return null (no round number shown)
   * - If 2+ instances exist: return the round number (1, 2, 3, etc.)
   */
  const getBookRound = async (
    groupId: string,
    isbn: string,
    groupBookId: string
  ): Promise<number | null> => {
    try {
      // Fetch all instances of this book in this group, ordered by creation time
      const { data: instances, error } = await client
        .from('group_books')
        .select('id, created_at')
        .eq('group_id', groupId)
        .eq('isbn', isbn)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching book instances:', error)
        return null
      }

      if (!instances || instances.length === 0) {
        return null
      }

      // If only one instance exists, don't show round number
      if (instances.length === 1) {
        return null
      }

      // Find the index of the current book (1-based)
      const index = instances.findIndex(b => b.id === groupBookId)

      if (index === -1) {
        console.warn('Group book ID not found in instances')
        return null
      }

      // Return 1-based round number (1회, 2회, 3회, etc.)
      return index + 1
    } catch (error) {
      console.error('Error calculating book round:', error)
      return null
    }
  }

  /**
   * Get total count of instances for a book in a group
   *
   * @param groupId - The group ID
   * @param isbn - The book ISBN
   * @returns The total number of times this book has been added to the group
   */
  const getBookInstanceCount = async (
    groupId: string,
    isbn: string
  ): Promise<number> => {
    try {
      const { count, error } = await client
        .from('group_books')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('isbn', isbn)

      if (error) {
        console.error('Error counting book instances:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error counting book instances:', error)
      return 0
    }
  }

  /**
   * Check if a book has multiple instances in a group
   * Useful for determining whether to show round numbers at all
   *
   * @param groupId - The group ID
   * @param isbn - The book ISBN
   * @returns True if 2+ instances exist, false otherwise
   */
  const hasMultipleRounds = async (
    groupId: string,
    isbn: string
  ): Promise<boolean> => {
    const count = await getBookInstanceCount(groupId, isbn)
    return count >= 2
  }

  return {
    getBookRound,
    getBookInstanceCount,
    hasMultipleRounds
  }
}
