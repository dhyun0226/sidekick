// Group & Member types
export interface Group {
  id: string
  name: string
  group_type: 'solo' | 'social'
  status?: string
  invite_code?: string
  deleted_at?: string | null
  created_at?: string
}

export interface GroupMember {
  id: string
  nickname: string
  avatar_url?: string
  role: 'admin' | 'member'
  left_at?: string | null
  subscription_tier?: string
}

// TOC chapter (UI-normalized format)
export interface TocChapter {
  title: string
  start: number
  end: number
  startPage: number
}

// Modal states for group pages
export interface GroupPageModals {
  drawer: boolean
  search: boolean
  review: boolean
  reviews: boolean
  comment: boolean
  groupStats: boolean
  commentInput: boolean
  editDates: boolean
  editToc: boolean
  editGenre: boolean
  markCompleted: boolean
  deleteBook: boolean
  editFinishedDate: boolean
  editingBook: any
  upgradeBook: boolean
  upgradeReadOnly: boolean
  promoteMember: boolean
  kickMember: boolean
  leaveGroup: boolean
  deleteGroup: boolean
  deleteGroupConfirm: boolean
  clipboardFallback: boolean
  regenerateInviteCode: boolean
  deleteHistoryBook: boolean
}

// Admin action pending data
export interface PendingMemberAction {
  id: string
  nickname: string
}

export interface PendingBookToDelete {
  id: string
  title: string
}

export interface ClipboardFallbackData {
  title: string
  message: string
  text: string
}

// Member with computed progress data (for race/leaderboard)
export interface MemberWithProgress extends GroupMember {
  progress: number
  timeAgo: string | null
  inactive: boolean
  finishedAt: string | null
  finishedDate: string | null
  isCompleted: boolean
}

// InjectionKey for provide/inject of useGroupPage return value
import type { InjectionKey } from 'vue'
import type { useGroupPage } from '~/composables/useGroupPage'

export type GroupPageContext = ReturnType<typeof useGroupPage>
export const GroupPageKey: InjectionKey<GroupPageContext> = Symbol('GroupPageKey')
