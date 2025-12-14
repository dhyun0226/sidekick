/**
 * Theme management composable
 * Supports dark and light modes with localStorage persistence
 */
import { ref, readonly, computed } from 'vue'

export type Theme = 'dark' | 'light'

// Get initial theme value (SSR-safe)
const getInitialTheme = (): Theme => {
  if (process.client) {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) {
      return stored
    }
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  }
  return 'dark' // SSR default
}

export const useTheme = () => {
  const theme = ref<Theme>(getInitialTheme())

  // Initialize theme from localStorage or system preference
  const initTheme = () => {
    if (process.client) {
      const stored = localStorage.getItem('theme') as Theme | null

      if (stored) {
        theme.value = stored
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        theme.value = prefersDark ? 'dark' : 'light'
      }

      applyTheme(theme.value)
    }
  }

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    if (process.client) {
      const html = document.documentElement

      if (newTheme === 'dark') {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }
    }
  }

  // Set theme and persist to localStorage
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme

    if (process.client) {
      localStorage.setItem('theme', newTheme)
      applyTheme(newTheme)
    }
  }

  // Toggle between dark and light
  const toggleTheme = () => {
    const newTheme = theme.value === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const isDark = computed(() => theme.value === 'dark')

  return {
    theme: readonly(theme),
    isDark,
    setTheme,
    toggleTheme,
    initTheme
  }
}
