import { useEffect, useState } from 'react'

// Tracks whether a horizontally-scrollable element has more content to the
// left/right of what's currently visible — used to fade the edges of
// something like a scrollable tab strip only where there's actually more
// to scroll to, instead of a fade that's always on (misleading once
// you've reached the end) or always off (no affordance at all).
export function useScrollEdges(ref) {
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    const update = () => {
      setAtStart(el.scrollLeft <= 0)
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [ref])

  return { atStart, atEnd }
}
