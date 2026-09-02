import { useEffect } from 'react'

export function useMetaDescription(description) {
  useEffect(() => {
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [description])
}
