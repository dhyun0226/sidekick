export const useDateUtils = () => {
  /**
   * Format date to short format: yy.m.d
   * @param date - Date object to format
   * @returns Formatted string like "25.1.15"
   */
  const formatShortDate = (date: Date): string => {
    const year = date.getFullYear() % 100
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}.${month}.${day}`
  }

  /**
   * Format date range to short format
   * @param startDate - Start date string (ISO format)
   * @param endDate - End date string (ISO format)
   * @returns Formatted range like "25.1.1 - 25.1.31" or null if dates are invalid
   */
  const formatDateRange = (startDate: string | undefined, endDate: string | undefined): string | null => {
    if (!startDate || !endDate) return null
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${formatShortDate(start)} - ${formatShortDate(end)}`
  }

  /**
   * Calculate days remaining until target date
   * @param targetDate - Target date string (ISO format)
   * @returns Number of days remaining (positive = future, negative = past, 0 = today) or null if invalid
   */
  const getDaysRemaining = (targetDate: string | undefined): number | null => {
    if (!targetDate) return null
    const end = new Date(targetDate)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Calculate total days between two dates
   * @param startDate - Start date string (ISO format)
   * @param endDate - End date string (ISO format)
   * @returns Total number of days or null if dates are invalid
   */
  const getTotalDays = (startDate: string | undefined, endDate: string | undefined): number | null => {
    if (!startDate || !endDate) return null
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Calculate days since start date
   * @param startDate - Start date string (ISO format)
   * @returns Number of days since start or null if invalid
   */
  const getDaysSinceStart = (startDate: string | undefined): number | null => {
    if (!startDate) return null
    const start = new Date(startDate)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Format time difference as human-readable string
   * @param dateString - Date string (ISO format)
   * @returns Human-readable time like "10분 전", "2시간 전", "3일 전"
   */
  const formatTimeAgo = (dateString: string | undefined): string | null => {
    if (!dateString) return null

    const now = new Date()
    const past = new Date(dateString)
    const diffMs = now.getTime() - past.getTime()

    // 음수면 미래 시간 (잘못된 데이터)
    if (diffMs < 0) return null

    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`

    // 30일 이상이면 날짜 표시
    return formatShortDate(past)
  }

  /**
   * Check if user is inactive (hasn't read for 3+ days)
   * @param dateString - Last read date string (ISO format)
   * @returns True if inactive (3+ days), false otherwise
   */
  const isInactive = (dateString: string | undefined): boolean => {
    if (!dateString) return true

    const now = new Date()
    const past = new Date(dateString)
    const diffDays = (now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24)

    return diffDays >= 3
  }

  return {
    formatShortDate,
    formatDateRange,
    getDaysRemaining,
    getTotalDays,
    getDaysSinceStart,
    formatTimeAgo,
    isInactive
  }
}
