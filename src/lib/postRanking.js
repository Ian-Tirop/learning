export function getMostLiked(posts, count = 3, exclude = []) {
  const excluded = new Set(exclude.map((post) => post.slug))
  return [...posts]
    .filter((post) => !excluded.has(post.slug))
    .sort((a, b) => b.seed.likes - a.seed.likes)
    .slice(0, count)
}

// Ranks other posts by how many tags they share with `post`, falling back to
// recency to fill out the list when nothing else shares a tag.
export function getRelatedPosts(posts, post, count = 3) {
  const tagSet = new Set(post.tags)
  return [...posts]
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => ({
      candidate,
      shared: candidate.tags.filter((tag) => tagSet.has(tag)).length,
    }))
    .sort((a, b) => b.shared - a.shared || new Date(b.candidate.date) - new Date(a.candidate.date))
    .slice(0, count)
    .map(({ candidate }) => candidate)
}

// A reader's own "Recommended for you" — scored against the combined tags
// of everything they've liked/saved, same shared-tag-count approach as
// getRelatedPosts. Falls back to the site's most-liked posts when a reader
// has no signal yet (a brand-new account), so the section is never empty.
export function getRecommendedPosts(posts, interestTags, count = 6) {
  const tagSet = new Set(interestTags)
  if (tagSet.size === 0) return getMostLiked(posts, count)

  return [...posts]
    .map((candidate) => ({
      candidate,
      shared: candidate.tags.filter((tag) => tagSet.has(tag)).length,
    }))
    .sort((a, b) => b.shared - a.shared || new Date(b.candidate.date) - new Date(a.candidate.date))
    .slice(0, count)
    .map(({ candidate }) => candidate)
}
