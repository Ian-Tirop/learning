export function searchPosts(posts, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(normalized) ||
      post.excerpt.toLowerCase().includes(normalized) ||
      post.tags.some((tag) => tag.toLowerCase().includes(normalized)),
  )
}
