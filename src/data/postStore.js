// Backed by the real, shared Postgres database via /api/posts — every
// visitor sees the same data. Replaces the old localStorage-only version;
// see README's "Backend & data model" section.
import { api } from '../lib/apiClient'
import { getVisitorId } from '../lib/visitorId'

/**
 * Published posts, newest first, visible to everyone. Pass `{ all: true }`
 * to also get drafts/pending/rejected posts — the server only honors that
 * for an authenticated admin request, so it's safe to call either way.
 */
export async function getAllPosts({ all = false } = {}) {
  const params = new URLSearchParams({ visitorId: getVisitorId() })
  if (all) params.set('status', 'all')
  const data = await api.get(`/api/posts?${params}`)
  return data.posts
}

/**
 * A single post by slug. `token` lets a reader who submitted a pending post
 * (and was given a private edit token) fetch their own not-yet-published
 * submission.
 */
export async function getPostBySlug(slug, { token } = {}) {
  const params = new URLSearchParams({ visitorId: getVisitorId() })
  if (token) params.set('token', token)
  const data = await api.get(`/api/posts/${encodeURIComponent(slug)}?${params}`)
  return data.post
}

export async function getAdjacentPosts(slug) {
  const visible = await getAllPosts()
  const index = visible.findIndex((post) => post.slug === slug)
  return {
    prev: index >= 0 ? visible[index + 1] : undefined,
    next: index > 0 ? visible[index - 1] : undefined,
  }
}

/** Admin: creates as draft/published directly. Reader: always goes to `pending` review; returns an editToken for that submission. */
export async function createPost(payload) {
  return api.post('/api/posts', payload)
}

/** Admin: full edit rights, including status changes (approve/reject). Reader: only their own pending submission, by passing the token they were given. */
export async function updatePost(slug, payload) {
  const data = await api.patch(`/api/posts/${encodeURIComponent(slug)}`, payload)
  return data.post
}

export async function deletePost(slug) {
  await api.delete(`/api/posts/${encodeURIComponent(slug)}`)
}
