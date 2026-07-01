import { ref } from 'vue'

type Theme = 'light' | 'dark'

const currentTheme = ref<Theme>('light')

export function useTheme() {
  function applyTheme(theme: Theme) {
    currentTheme.value = theme
    document.documentElement.setAttribute('data-theme', theme)

    // Add transition class
    document.documentElement.classList.add('theme-transition')
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition')
    }, 350)

    // Persist
    window.api.db.setting.set('theme', theme)
  }

  async function initTheme() {
    // 1. Read user preference
    const saved = await window.api.db.setting.get('theme')
    if (saved === 'light' || saved === 'dark') {
      applyTheme(saved)
      return
    }

    // 2. Read system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(prefersDark ? 'dark' : 'light')
  }

  function toggleTheme() {
    applyTheme(currentTheme.value === 'light' ? 'dark' : 'light')
  }

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  function onSystemChange(e: MediaQueryListEvent) {
    window.api.db.setting.get('theme').then((saved) => {
      if (!saved) {
        applyTheme(e.matches ? 'dark' : 'light')
      }
    })
  }

  mediaQuery.addEventListener('change', onSystemChange)

  return { currentTheme, applyTheme, toggleTheme, initTheme }
}
