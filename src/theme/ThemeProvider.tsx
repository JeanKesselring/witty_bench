import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { STORAGE_KEY, ThemeCtx, type Theme, type ThemeStore } from './themeContext'

const readStored = (): Theme | null => {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    // Private mode / storage disabled — fall back to the OS setting.
    return null
  }
}

const systemTheme = (): Theme =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [explicit, setExplicit] = useState<Theme | null>(readStored)
  const [system, setSystem] = useState<Theme>(systemTheme)

  // Keep following the OS while no explicit choice has been made.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setSystem(mql.matches ? 'light' : 'dark')
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    }
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  const theme = explicit ?? system

  // The stylesheets key off this attribute, and `color-scheme` makes the
  // browser's own widgets (scrollbars, form controls) match.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setExplicit(t)
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      // Non-fatal: the choice just will not survive a reload.
    }
  }, [])

  const value = useMemo<ThemeStore>(
    () => ({
      theme,
      isSystem: explicit === null,
      setTheme,
      toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      useSystem: () => {
        setExplicit(null)
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* ignore */
        }
      },
    }),
    [theme, explicit, setTheme],
  )

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}
