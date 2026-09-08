import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAllPosts } from '../data/postStore'
import { PostCover } from '../components/PostCover'
import { SkeletonRow } from '../components/Skeleton'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaDescription } from '../hooks/useMetaDescription'
import { useCanonicalUrl } from '../hooks/useCanonicalUrl'
import { formatDate } from '../lib/formatDate'
import { searchPosts } from '../lib/searchPosts'
import { isRecent } from '../lib/isRecent'
import './Blog.css'

export function Blog() {
  useDocumentTitle('Blog — Ian Tirop')
  useCanonicalUrl()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTag = searchParams.get('tag')
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getAllPosts()
      .then((fetched) => {
        if (!cancelled) setPosts(fetched)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setActiveTag = (tag) => {
    const next = new URLSearchParams(searchParams)
    if (tag) next.set('tag', tag)
    else next.delete('tag')
    setSearchParams(next, { replace: true })
  }

  const handleQueryChange = (value) => {
    setQuery(value)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  useMetaDescription(
    `${posts.length} posts about code, design, and the process of learning both in public.`,
  )
  const tags = [...new Set(posts.flatMap((post) => post.tags))].sort()

  const taggedPosts = activeTag ? posts.filter((post) => post.tags.includes(activeTag)) : posts
  const normalizedQuery = query.trim().toLowerCase()
  const visiblePosts = normalizedQuery ? searchPosts(taggedPosts, query) : taggedPosts

  return (
    <section className="container blog-page">
      <div className="section-heading">
        <p className="eyebrow">Blog</p>
        <h1>Everything I&apos;ve written</h1>
        <p className="blog-intro">
          {posts.length} posts about code, design, and the process of
          learning both in public.
        </p>
      </div>

      <div className="search-box">
        <svg className="icon" role="presentation" aria-hidden="true">
          <use href="/icons.svg#search-icon"></use>
        </svg>
        <input
          type="search"
          placeholder="Search posts..."
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          aria-label="Search posts"
        />
      </div>

      <div className="tag-filter">
        <button
          type="button"
          className={`tag-btn${activeTag === null ? ' active' : ''}`}
          onClick={() => setActiveTag(null)}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`tag-btn${activeTag === tag ? ' active' : ''}`}
            onClick={() => setActiveTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <ul className="post-list">
        {loading &&
          [0, 1, 2, 3].map((i) => (
            <li key={i}>
              <SkeletonRow />
            </li>
          ))}
        {!loading && visiblePosts.map((post, index) => (
          <li key={post.slug}>
            <Link
              to={`/blog/${post.slug}`}
              className="post-row fade-in-up"
              style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
            >
              <PostCover cover={post.cover} size="thumb" />
              <div className="post-row-main">
                <h2>
                  {post.slug === posts[0]?.slug && isRecent(post.date) && (
                    <span className="new-badge">New</span>
                  )}
                  {post.title}
                </h2>
                <p>{post.excerpt}</p>
                <div className="post-row-tags">
                  {post.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="post-row-meta">
                <span>{formatDate(post.date)}</span>
                <span>{post.readingTime} min read</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {!loading && visiblePosts.length === 0 && (
        <div className="empty-state">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#search-icon"></use>
          </svg>
          <p>
            {normalizedQuery
              ? `No posts match "${query}".`
              : `No posts tagged "${activeTag}" yet.`}
          </p>
        </div>
      )}
    </section>
  )
}
