import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

function savedTheme(): Theme {
  try {
    const value = localStorage.getItem('broker-lab-theme')
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {}
  return 'system'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(savedTheme)
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)
  const dark = theme === 'dark' || (theme === 'system' && systemDark)

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemDark(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#14161a' : '#f5f6f8')
  }, [dark])

  const change = useCallback((value: Theme) => {
    setTheme(value)
    try { localStorage.setItem('broker-lab-theme', value) } catch {}
  }, [])

  return { theme, dark, change }
}
