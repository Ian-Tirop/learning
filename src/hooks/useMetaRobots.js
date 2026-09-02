import { useEffect } from 'react'

// Keeps the authoring tool (and drafts previewed through it) out of search
// results — there's nothing there a search engine's audience needs to see.
export function useMetaRobots(content = 'noindex, nofollow') {
  useEffect(() => {
    let tag = document.querySelector('meta[name="robots"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'robots')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', content)

    return () => tag.remove()
  }, [content])
}
