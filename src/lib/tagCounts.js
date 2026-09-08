// Live tag counts from actual published posts — replaces a hardcoded
// "topics I write about" list with real, clickable data.
export function getTagCounts(posts) {
  const counts = new Map()
  for (const post of posts) {
    for (const tag of post.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}
