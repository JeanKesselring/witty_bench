import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark'

export type ThemeStore = {
  theme: Theme
  /** True while following the OS setting rather than an explicit choice. */
  isSystem: boolean
  setTheme: (t: Theme) => void
  toggle: () => void
  useSystem: () => void
}

export const ThemeCtx = createContext<ThemeStore | null>(null)

export function useTheme(): ThemeStore {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}

export const STORAGE_KEY = 'sg-demos-theme'
