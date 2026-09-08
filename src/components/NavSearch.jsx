import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getAllPosts } from '../data/postStore'
import { searchPosts } from '../lib/searchPosts'
import { formatDate } from '../lib/formatDate'
import './NavSearch.css'

export function NavSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [posts, setPosts] = useState([])
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      getAllPosts().then(setPosts).catch(() => setPosts([]))
    }
  }, [open])

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  const handleBlur = (event) => {
    if (!containerRef.current?.contains(event.relatedTarget)) close()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') close()
  }

  const goToAllResults = () => {
    if (!query.trim()) return
    navigate(`/blog?q=${encodeURIComponent(query.trim())}`)
    close()
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    goToAllResults()
  }

  const results = query.trim() ? searchPosts(posts, query).slice(0, 6) : []

  return (
    <div className="nav-search" ref={containerRef} onBlur={handleBlur} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Search posts"
        aria-controls="nav-search-panel"
        title="Search (⌘K)"
      >
        <svg className="icon" role="presentation" aria-hidden="true">
          <use href="/icons.svg#search-icon"></use>
        </svg>
      </button>

      {open && (
        <div className="nav-search-panel" id="nav-search-panel">
          <form onSubmit={handleSubmit}>
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#search-icon"></use>
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search posts..."
              aria-label="Search posts"
            />
          </form>

          {query.trim() && (
            <ul className="nav-search-results">
              {results.map((post) => (
                <li key={post.slug}>
                  <Link to={`/blog/${post.slug}`} onClick={close}>
                    <span className="nav-search-result-title">{post.title}</span>
                    <span className="nav-search-result-meta">
                      {formatDate(post.date)} · {post.readingTime} min read
                    </span>
                  </Link>
                </li>
              ))}
              {results.length === 0 && (
                <li className="nav-search-empty">No posts match &quot;{query}&quot;.</li>
              )}
            </ul>
          )}

          {query.trim() && (
            <button type="button" className="nav-search-all" onClick={goToAllResults}>
              See all results for &quot;{query}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
