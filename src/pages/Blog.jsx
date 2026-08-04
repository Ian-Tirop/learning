import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllPosts } from '../data/postStore'
import { PostCover } from '../components/PostCover'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import './Blog.css'

export function Blog() {
  useDocumentTitle('Blog — Ian Tirop')
  const [activeTag, setActiveTag] = useState(null)
  const [query, setQuery] = useState('')

  const posts = getAllPosts({ includeDrafts: false })
  const tags = [...new Set(posts.flatMap((post) => post.tags))].sort()

  const normalizedQuery = query.trim().toLowerCase()

  const visiblePosts = posts.filter((post) => {
    const matchesTag = !activeTag || post.tags.includes(activeTag)
    const matchesQuery =
      !normalizedQuery ||
      post.title.toLowerCase().includes(normalizedQuery) ||
      post.excerpt.toLowerCase().includes(normalizedQuery)
    return matchesTag && matchesQuery
  })

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
          onChange={(event) => setQuery(event.target.value)}
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
        {visiblePosts.map((post, index) => (
          <li key={post.slug}>
            <Link
              to={`/blog/${post.slug}`}
              className="post-row fade-in-up"
              style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
            >
              <PostCover cover={post.cover} size="thumb" />
              <div className="post-row-main">
                <h2>{post.title}</h2>
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
                <span>
                  {new Date(post.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span>{post.readingTime} min read</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {visiblePosts.length === 0 && (
        <p className="empty-state">
          {normalizedQuery
            ? `No posts match "${query}".`
            : `No posts tagged "${activeTag}" yet.`}
        </p>
      )}
    </section>
  )
}
