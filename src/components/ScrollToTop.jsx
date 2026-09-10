import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Browsers restore the previous scroll position on client-side route changes
// (unlike a full page load), so without this, navigating to a new page can
// land you wherever the last page happened to be scrolled to. Skips
// hash-only changes so in-page anchors (skip link, footer "back to top",
// TOC links) keep working.
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
