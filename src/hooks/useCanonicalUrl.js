import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useCanonicalUrl() {
  const { pathname } = useLocation()

  useEffect(() => {
    let link = document.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', `${window.location.origin}${pathname}`)
  }, [pathname])
}
