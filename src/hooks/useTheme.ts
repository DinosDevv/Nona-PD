import { useState } from 'react'
import { applyTheme, getInitialTheme, saveTheme, type Theme } from '../lib/theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.dataset.theme as Theme | undefined) ?? getInitialTheme(),
  )

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    saveTheme(next)
    setTheme(next)
  }

  return { theme, toggle }
}
