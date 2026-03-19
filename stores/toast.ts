import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
  onUndo?: () => void
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let toastCounter = 0

  const add = (message: string, type: ToastType = 'info', duration = 3000, onUndo?: () => void) => {
    const id = `${Date.now()}-${toastCounter++}`
    toasts.value.push({ id, message, type, duration, onUndo })

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, onUndo ? 5000 : duration)
    }
  }

  const remove = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (msg: string, onUndo?: () => void) => add(msg, 'success', 3000, onUndo)
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
