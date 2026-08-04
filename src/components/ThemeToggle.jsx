import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const [theme, toggleTheme] = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <svg className="icon" role="presentation" aria-hidden="true">
        <use href={`/icons.svg#${isDark ? 'sun-icon' : 'moon-icon'}`}></use>
      </svg>
    </button>
  )
}
