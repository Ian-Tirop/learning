// Full post content already ships in the list payload (mapPostRow always
// includes it), so this can search inside the body too — no new endpoint
// or backend change needed, entirely client-side against data already
// fetched for the page.
function bodyText(post) {
  return (post.content || []).map((block) => block.text || '').join(' ')
}

export function searchPosts(posts, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(normalized) ||
      post.excerpt.toLowerCase().includes(normalized) ||
      post.tags.some((tag) => tag.toLowerCase().includes(normalized)) ||
      bodyText(post).toLowerCase().includes(normalized),
  )
}

// A short snippet of body text around the first match, for search results
// where the hit isn't in the title/excerpt — gives the reader a reason to
// trust the result instead of just a title match.
export function getMatchSnippet(post, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return null
  if (post.title.toLowerCase().includes(normalized)) return null
  if (post.excerpt.toLowerCase().includes(normalized)) return null

  const text = bodyText(post)
  const index = text.toLowerCase().indexOf(normalized)
  if (index === -1) return null

  const start = Math.max(0, index - 40)
  const end = Math.min(text.length, index + normalized.length + 60)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return `${prefix}${text.slice(start, end).trim()}${suffix}`
}
