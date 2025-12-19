import { ref } from 'vue'

/**
 * Composable for handling image loading errors
 * Returns hasError state and handleError function
 */
export const useImageError = () => {
  const hasError = ref(false)

  const handleError = () => {
    hasError.value = true
  }

  const reset = () => {
    hasError.value = false
  }

  return {
    hasError,
    handleError,
    reset
  }
}
