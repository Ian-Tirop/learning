import { useEffect, useState } from 'react'

function getInitialTheme() {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'

    // The View Transitions API needs the DOM change to happen inside its
    // callback (synchronously, not via React's next effect run) so it can
    // correctly capture the before/after screenshots to crossfade between.
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        document.documentElement.setAttribute('data-theme', next)
        setTheme(next)
      })
    } else {
      setTheme(next)
    }
  }

  return [theme, toggleTheme]
}
