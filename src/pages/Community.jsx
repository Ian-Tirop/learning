import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllPosts } from '../data/postStore'
import { PostList } from '../components/PostList'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaDescription } from '../hooks/useMetaDescription'
import { useCanonicalUrl } from '../hooks/useCanonicalUrl'
import './Blog.css'

export function Community() {
  useDocumentTitle('Community — Ian Tirop')
  useCanonicalUrl()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getAllPosts()
      .then((fetched) => {
        if (!cancelled) setPosts(fetched.filter((post) => post.submittedByName))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useMetaDescription(
    `${posts.length} posts submitted by readers and published on the blog.`,
  )

  return (
    <section className="container blog-page">
      <div className="section-heading">
        <p className="eyebrow">Community</p>
        <h1>From our readers</h1>
        <p className="blog-intro">
          {posts.length} posts submitted by readers through{' '}
          <Link to="/submit">Write</Link> and approved for publishing —
          same blog, different voices.{' '}
          <Link to="/blog">Looking for my own posts? →</Link>
        </p>
      </div>

      <PostList
        posts={posts}
        loading={loading}
        emptyMessage="No community posts published yet — check back soon, or be the first to submit one."
      />
    </section>
  )
}
