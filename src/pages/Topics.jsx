import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllPosts } from '../data/postStore'
import { getTagCounts } from '../lib/tagCounts'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaDescription } from '../hooks/useMetaDescription'
import { useCanonicalUrl } from '../hooks/useCanonicalUrl'
import './Topics.css'

export function Topics() {
  useDocumentTitle('Topics — Ian Tirop')
  useMetaDescription('Every topic covered on the blog, with how many posts touch on each.')
  useCanonicalUrl()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllPosts()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const tags = getTagCounts(posts)
  const maxCount = tags[0]?.count || 1

  return (
    <section className="container topics-page">
      <div className="section-heading">
        <p className="eyebrow">Browse</p>
        <h1>All topics</h1>
        <p className="topics-intro">Every tag used across the blog, sized by how much I&apos;ve written on it.</p>
      </div>

      {loading && <p className="loading-note">Loading topics…</p>}

      {!loading && tags.length === 0 && <p className="loading-note">No published posts yet.</p>}

      <div className="topics-cloud">
        {tags.map(({ tag, count }) => {
          const scale = 0.85 + (count / maxCount) * 0.65
          return (
            <Link
              key={tag}
              to={`/blog?tag=${encodeURIComponent(tag)}`}
              className="topic-chip"
              style={{ fontSize: `${scale * 15}px` }}
            >
              {tag}
              <span className="topic-chip-count">{count}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
