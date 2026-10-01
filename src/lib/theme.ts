export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

// Saved choice first, otherwise follow the OS setting
export function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // storage unavailable — fall through to the OS setting
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // not critical
  }
}
