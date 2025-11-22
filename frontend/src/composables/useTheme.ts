import { ref, watchEffect, onMounted, computed } from 'vue'

type Theme = 'light' | 'dark'

export function useTheme() {
  const theme = ref<Theme>('light')

  const getPreferredTheme = (): Theme => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch (error) {
      console.error('Error reading theme from localStorage:', error)
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  const applyTheme = (t: Theme) => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(t)
    localStorage.setItem('theme', t)
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  onMounted(() => {
    theme.value = getPreferredTheme()
    applyTheme(theme.value)
  })

  watchEffect(() => {
    applyTheme(theme.value)
  })

  return {
    theme,
    toggleTheme,
    isDark: computed(() => theme.value === 'dark'),
  }
}
