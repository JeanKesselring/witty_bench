'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

/* §3.1: data-theme on <html> plus color-scheme. Carried over from
 * Common Sage — that part of the implementation was already correct. */

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const attr = document.documentElement.getAttribute('data-theme')
    if (attr === 'dark' || attr === 'light') {
      setTheme(attr)
      return
    }
    setTheme(
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
    )
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('cs-theme', next)
    } catch {
      // §11.12: the preference belongs to the account; local storage is a
      // convenience, and failing to write it must never break the toggle.
    }
  }

  return (
    <button
      type="button"
      className="k-btn k-btn--quiet k-press"
      onClick={toggle}
      // §9.2: the accessible name changes with state.
      aria-pressed={theme === 'dark'}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}
