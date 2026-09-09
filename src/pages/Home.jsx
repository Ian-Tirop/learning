import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllPosts } from '../data/postStore'
import { api } from '../lib/apiClient'
import { PostCover } from '../components/PostCover'
import { SkeletonPostCard } from '../components/Skeleton'
import { Newsletter } from '../components/Newsletter'
import { Reveal } from '../components/Reveal'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaDescription } from '../hooks/useMetaDescription'
import { useCanonicalUrl } from '../hooks/useCanonicalUrl'
import { formatDate } from '../lib/formatDate'
import { getMostLiked } from '../lib/postRanking'
import { getTagCounts } from '../lib/tagCounts'
import { isRecent } from '../lib/isRecent'
import './Home.css'

export function Home() {
  useDocumentTitle('Ian Tirop — Blog')
  useMetaDescription(
    "Ian Tirop's blog on code, design, and the small, specific problems that show up building real interfaces — CSS bugs, UX details, dev habits, and side projects.",
  )
  useCanonicalUrl()

  const [posts, setPosts] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([getAllPosts(), api.get('/api/comments/top?limit=3').catch(() => ({ comments: [] }))])
      .then(([fetchedPosts, topComments]) => {
        if (cancelled) return
        setPosts(fetchedPosts)
        setTestimonials(topComments.comments)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const latest = posts.slice(0, 3)
  const favorites = getMostLiked(posts, 3, latest)
  const topTags = getTagCounts(posts).slice(0, 6)

  return (
    <>
      <section className="hero container">
        <div className="hero-bg" aria-hidden="true">
          <span className="hero-blob hero-blob-1" />
          <span className="hero-blob hero-blob-2" />
          <span className="hero-blob hero-blob-3" />
          <span className="hero-dots" />
        </div>

        <div className="hero-grid">
          <div className="hero-content">
            <p className="tagline fade-in-up">
              <span className="wave">👋</span> Hi, I&apos;m Ian Tirop
            </p>
            <h1 className="gradient-text fade-in-up" style={{ animationDelay: '90ms' }}>
              Notes on code, design, and things I learn by building.
            </h1>
            <p className="hero-sub fade-in-up" style={{ animationDelay: '180ms' }}>
              I&apos;m a developer and UI/UX designer, and I write about the small,
              specific problems that show up on both sides of that line — the
              CSS bug that ate an afternoon, the interaction that felt wrong
              until the easing curve changed.
            </p>
            <div className="hero-actions fade-in-up" style={{ animationDelay: '270ms' }}>
              <Link to="/blog" className="btn btn-primary">
                Read the blog
              </Link>
              <Link to="/about" className="btn btn-ghost">
                About me
              </Link>
            </div>
          </div>

          <div className="hero-visual fade-in-up" style={{ animationDelay: '220ms' }} aria-hidden="true">
            <div className="code-window">
              <span className="tag hero-chip hero-chip-1">CSS &amp; layout</span>
              <span className="tag hero-chip hero-chip-2">React</span>
              <span className="tag hero-chip hero-chip-3">UI/UX design</span>

              <div className="code-window-bar">
                <span className="code-dot code-dot-1" />
                <span className="code-dot code-dot-2" />
                <span className="code-dot code-dot-3" />
                <span className="code-window-title">notes.js</span>
              </div>
              <pre className="code-window-body">
                <code>{`const focus = [
  'code',
  'design',
  'things I learn by building',
]

export default function IanTirop() {
  return write(focus)
}`}</code>
              </pre>
            </div>
          </div>
        </div>

        <a href="#topics" className="hero-scroll fade-in-up" style={{ animationDelay: '380ms' }}>
          Scroll
          <span className="hero-scroll-icon">
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#arrow-icon"></use>
            </svg>
          </span>
        </a>
      </section>

      <Reveal as="section" id="topics" className="container topics-row" aria-label="Topics I write about">
        {topTags.map(({ tag, count }) => (
          <Link key={tag} to={`/blog?tag=${encodeURIComponent(tag)}`} className="tag">
            {tag} <span className="tag-count">{count}</span>
          </Link>
        ))}
        <Link to="/topics" className="tag topics-see-all">
          All topics →
        </Link>
      </Reveal>

      <Reveal as="section" className="container latest-section">
        <div className="section-heading">
          <p className="eyebrow">Latest</p>
          <h2>Recent posts</h2>
        </div>

        <div className="post-grid">
          {loading &&
            [0, 1, 2].map((i) => <SkeletonPostCard key={i} />)}
          {!loading && latest.map((post, index) => (
            <Reveal as="div" key={post.slug} delay={index * 90}>
              <Link to={`/blog/${post.slug}`} className="card post-card">
                <PostCover cover={post.cover} size="card" />
                <div className="post-card-body">
                  <p className="post-date">
                    {index === 0 && isRecent(post.date) && <span className="new-badge">New</span>}
                    {formatDate(post.date)}
                    {' · '}
                    {post.readingTime} min read
                  </p>
                  <h3>{post.title}</h3>
                  <p className="post-excerpt">{post.excerpt}</p>
                  <span className="read-more">
                    Read post
                    <svg className="icon" role="presentation" aria-hidden="true">
                      <use href="/icons.svg#arrow-icon"></use>
                    </svg>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Link to="/blog" className="view-all">
          View all posts
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#arrow-icon"></use>
          </svg>
        </Link>
      </Reveal>

      {favorites.length > 0 && (
        <Reveal as="section" className="container favorites-section">
          <div className="section-heading">
            <p className="eyebrow">Reader favorites</p>
            <h2>Most liked posts</h2>
          </div>

          <ul className="favorite-list">
            {favorites.map((post, index) => (
              <Reveal as="li" key={post.slug} delay={index * 80}>
                <Link to={`/blog/${post.slug}`} className="favorite-row">
                  <span className="favorite-rank">{index + 1}</span>
                  <PostCover cover={post.cover} size="thumb" />
                  <div className="favorite-main">
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                  </div>
                  <span className="favorite-likes">
                    <svg className="icon" role="presentation" aria-hidden="true">
                      <use href="/icons.svg#thumb-up-icon"></use>
                    </svg>
                    {post.seed.likes}
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Reveal>
      )}

      {testimonials.length > 0 && (
        <Reveal as="section" className="container testimonials-section">
          <div className="section-heading">
            <p className="eyebrow">What readers say</p>
            <h2>From the comments</h2>
          </div>

          <div className="testimonial-grid">
            {testimonials.map((comment, index) => (
              <Reveal
                as="div"
                key={`${comment.postSlug}-${comment.id}`}
                delay={index * 90}
              >
                <Link to={`/blog/${comment.postSlug}`} className="card testimonial-card">
                  <p className="testimonial-text">&ldquo;{comment.text}&rdquo;</p>
                  <p className="testimonial-attribution">
                    <span className="testimonial-name">{comment.name}</span>
                    <span className="testimonial-source">on {comment.postTitle}</span>
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </Reveal>
      )}

      <Reveal as="section" className="container author-section">
        <div className="author-spotlight">
          <div className="author-spotlight-avatar" aria-hidden="true">
            IT
          </div>
          <div>
            <p className="eyebrow">Who&apos;s writing</p>
            <h2>Meet Ian Tirop</h2>
            <p>
              Developer and UI/UX designer. I build the things I design, and
              write about what breaks along the way — on both sides of that
              line.
            </p>
            <Link to="/about" className="btn btn-ghost">
              More about me
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <Newsletter />
      </Reveal>
    </>
  )
}
