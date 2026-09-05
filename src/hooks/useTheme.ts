import { useEffect, useRef, useState } from 'react'

type Theme = 'light' | 'dark'
const THEME_KEY = 'interview-lab.theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  )
  const explicitChoice = useRef(document.documentElement.dataset.themePreference === 'saved')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#151c1a' : '#f7f8fa')
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const followSystem = () => {
      if (!explicitChoice.current) setTheme(media.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', followSystem)
    return () => media.removeEventListener('change', followSystem)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    explicitChoice.current = true
    setTheme(next)
    try {
      window.localStorage.setItem(THEME_KEY, next)
    } catch {
      // Theme changes still work for this visit when storage is unavailable.
    }
  }

  return { theme, toggleTheme }
}
