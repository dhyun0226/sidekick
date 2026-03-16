import { ref, onMounted, onUnmounted } from 'vue'

const DESKTOP_BREAKPOINT = 1024

export function useDevice() {
  const isDesktop = ref(false)
  let mediaQuery: MediaQueryList | null = null
  let handler: ((e: MediaQueryListEvent) => void) | null = null

  onMounted(() => {
    if (typeof window === 'undefined') return
    mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    isDesktop.value = mediaQuery.matches
    handler = (e) => { isDesktop.value = e.matches }
    mediaQuery.addEventListener('change', handler)
  })

  onUnmounted(() => {
    if (mediaQuery && handler) {
      mediaQuery.removeEventListener('change', handler)
    }
  })

  return { isDesktop }
}
