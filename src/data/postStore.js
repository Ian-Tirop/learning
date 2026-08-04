import { posts as staticPosts } from './posts'

const LOCAL_POSTS_KEY = 'blog:localPosts'
const OVERRIDES_KEY = 'blog:postOverrides'
const HIDDEN_KEY = 'blog:hiddenSlugs'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function emptySeed() {
  return { likes: 0, dislikes: 0, ratingSum: 0, ratingCount: 0, comments: [] }
}

export function isStaticSlug(slug) {
  return staticPosts.some((post) => post.slug === slug)
}

export function slugExists(slug) {
  return getAllPosts({ includeDrafts: true }).some((post) => post.slug === slug)
}

/**
 * The full merged post list: static posts (with any local edits layered on
 * top and deletions hidden) plus fully local posts, newest first. Everything
 * here is stored per-browser in localStorage — see the README for why.
 */
export function getAllPosts({ includeDrafts = true } = {}) {
  const overrides = read(OVERRIDES_KEY, {})
  const hidden = new Set(read(HIDDEN_KEY, []))
  const local = read(LOCAL_POSTS_KEY, [])

  const fromStatic = staticPosts
    .filter((post) => !hidden.has(post.slug))
    .map((post) => {
      const override = overrides[post.slug]
      const merged = override ? { ...post, ...override } : post
      return {
        ...merged,
        status: merged.status || 'published',
        isLocal: false,
        isEdited: Boolean(override),
      }
    })

  const fromLocal = local.map((post) => ({ ...post, isLocal: true, isEdited: false }))

  const all = [...fromLocal, ...fromStatic]
  const visible = includeDrafts ? all : all.filter((post) => post.status !== 'draft')

  return visible.sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getPostBySlug(slug, options) {
  return getAllPosts(options).find((post) => post.slug === slug)
}

export function getAdjacentPosts(slug) {
  const visible = getAllPosts({ includeDrafts: false })
  const index = visible.findIndex((post) => post.slug === slug)
  return {
    prev: index >= 0 ? visible[index + 1] : undefined,
    next: index > 0 ? visible[index - 1] : undefined,
  }
}

export function createPost(data) {
  const local = read(LOCAL_POSTS_KEY, [])
  const post = { ...data, seed: emptySeed(), status: data.status || 'draft' }
  write(LOCAL_POSTS_KEY, [post, ...local])
  return post
}

export function updatePost(slug, data) {
  if (isStaticSlug(slug)) {
    const overrides = read(OVERRIDES_KEY, {})
    write(OVERRIDES_KEY, { ...overrides, [slug]: { ...overrides[slug], ...data } })
    return
  }

  const local = read(LOCAL_POSTS_KEY, [])
  write(
    LOCAL_POSTS_KEY,
    local.map((post) => (post.slug === slug ? { ...post, ...data } : post)),
  )
}

export function deletePost(slug) {
  if (isStaticSlug(slug)) {
    const hidden = read(HIDDEN_KEY, [])
    if (!hidden.includes(slug)) write(HIDDEN_KEY, [...hidden, slug])

    const overrides = read(OVERRIDES_KEY, {})
    write(
      OVERRIDES_KEY,
      Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== slug)),
    )
    return
  }

  const local = read(LOCAL_POSTS_KEY, [])
  write(
    LOCAL_POSTS_KEY,
    local.filter((post) => post.slug !== slug),
  )
}

export function getDeletedStaticPosts() {
  const hidden = new Set(read(HIDDEN_KEY, []))
  return staticPosts.filter((post) => hidden.has(post.slug))
}

export function restorePost(slug) {
  const hidden = read(HIDDEN_KEY, [])
  write(
    HIDDEN_KEY,
    hidden.filter((s) => s !== slug),
  )
}
