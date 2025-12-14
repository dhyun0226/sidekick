import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  const add = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Date.now().toString()
    toasts.value.push({ id, message, type, duration })

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
  }

  const remove = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  // 헬퍼 함수들
  const success = (msg: string) => add(msg, 'success')
  const error = (msg: string) => add(msg, 'error')
  const info = (msg: string) => add(msg, 'info')
  const warning = (msg: string) => add(msg, 'warning')

  return {
    toasts,
    add,
    remove,
    success,
    error,
    info,
    warning
  }
})
