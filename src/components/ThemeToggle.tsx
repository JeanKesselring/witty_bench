import { useTheme } from '../theme/themeContext'

export function ThemeToggle() {
  const { theme, isSystem, toggle, useSystem } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      // Double-click hands control back to the OS setting.
      onDoubleClick={useSystem}
      aria-label={`Switch to ${next} theme${isSystem ? ' (currently following your system setting)' : ''}`}
      title={isSystem ? 'Following system · double-click to reset' : 'Double-click to follow system'}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {theme === 'dark' ? '☾' : '☀'}
      </span>
      <span className="theme-toggle__label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  )
}
