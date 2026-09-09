// The searchable, tag-filterable post grid shared by the Blog page (Ian's
// own posts) and the Community page (reader-authored, admin-approved
// posts) — each page fetches and filters its own subset, then hands the
// result here so the search/tag/empty-state logic never has to be written
// twice or drift between the two.
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PostCover } from './PostCover'
import { SkeletonRow } from './Skeleton'
import { formatDate } from '../lib/formatDate'
import { searchPosts } from '../lib/searchPosts'
import { isRecent } from '../lib/isRecent'

export function PostList({ posts, loading, emptyMessage }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTag = searchParams.get('tag')
  const [query, setQuery] = useState(() => searchParams.get('q') || '')

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

  const tags = [...new Set(posts.flatMap((post) => post.tags))].sort()
  const taggedPosts = activeTag ? posts.filter((post) => post.tags.includes(activeTag)) : posts
  const normalizedQuery = query.trim().toLowerCase()
  const visiblePosts = normalizedQuery ? searchPosts(taggedPosts, query) : taggedPosts

  return (
    <>
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

      {tags.length > 0 && (
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
      )}

      <ul className="post-list">
        {loading &&
          [0, 1, 2, 3].map((i) => (
            <li key={i}>
              <SkeletonRow />
            </li>
          ))}
        {!loading &&
          visiblePosts.map((post, index) => (
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
                  {post.submittedByName && <span>by {post.submittedByName}</span>}
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
              : activeTag
                ? `No posts tagged "${activeTag}" yet.`
                : emptyMessage}
          </p>
        </div>
      )}
    </>
  )
}
