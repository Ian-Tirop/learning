import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllPosts } from '../data/postStore'
import { PostList } from '../components/PostList'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaDescription } from '../hooks/useMetaDescription'
import { useCanonicalUrl } from '../hooks/useCanonicalUrl'
import './Blog.css'

export function Blog() {
  useDocumentTitle('Blog — Ian Tirop')
  useCanonicalUrl()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getAllPosts()
      .then((fetched) => {
        // This page is specifically "everything I've written" — a post
        // submitted through /submit (by an account or anonymously) always
        // carries submittedByName (see api/posts/index.js), so that's the
        // one signal that distinguishes a reader's post from Ian's own.
        // Reader-authored posts live on /community instead.
        if (!cancelled) setPosts(fetched.filter((post) => !post.submittedByName))
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
    `${posts.length} posts about code, design, and the process of learning both in public.`,
  )

  return (
    <section className="container blog-page">
      <div className="section-heading">
        <p className="eyebrow">Blog</p>
        <h1>Everything I&apos;ve written</h1>
        <p className="blog-intro">
          {posts.length} posts about code, design, and the process of
          learning both in public. Looking for posts from other readers?{' '}
          <Link to="/community">Visit the community page →</Link>
        </p>
      </div>

      <PostList posts={posts} loading={loading} emptyMessage="No posts yet — check back soon." />
    </section>
  )
}
