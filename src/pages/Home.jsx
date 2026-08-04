import { Link } from 'react-router-dom'
import { getAllPosts } from '../data/postStore'
import { PostCover } from '../components/PostCover'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import './Home.css'

const topics = [
  'UI/UX design',
  'CSS & layout',
  'React',
  'Design systems',
  'Dev habits',
  'Side projects',
]

export function Home() {
  useDocumentTitle('Ian Tirop — Blog')
  const latest = getAllPosts({ includeDrafts: false }).slice(0, 3)

  return (
    <>
      <section className="hero container fade-in-up">
        <p className="tagline">
          <span className="wave">👋</span> Hi, I&apos;m Ian Tirop
        </p>
        <h1 className="gradient-text">
          Notes on code, design, and things I learn by building.
        </h1>
        <p className="hero-sub">
          I'm a developer and UI/UX designer, and I write about the small,
          specific problems that show up on both sides of that line — the
          CSS bug that ate an afternoon, the interaction that felt wrong
          until the easing curve changed.
        </p>
        <div className="hero-actions">
          <Link to="/blog" className="btn btn-primary">
            Read the blog
          </Link>
          <Link to="/about" className="btn btn-ghost">
            About me
          </Link>
        </div>
      </section>

      <section className="container topics-row" aria-label="Topics I write about">
        {topics.map((topic) => (
          <span key={topic} className="tag">
            {topic}
          </span>
        ))}
      </section>

      <section className="container latest-section">
        <div className="section-heading">
          <p className="eyebrow">Latest</p>
          <h2>Recent posts</h2>
        </div>

        <div className="post-grid">
          {latest.map((post, index) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="card post-card fade-in-up"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <PostCover cover={post.cover} size="card" />
              <div className="post-card-body">
                <p className="post-date">
                  {new Date(post.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
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
          ))}
        </div>

        <Link to="/blog" className="view-all">
          View all posts
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#arrow-icon"></use>
          </svg>
        </Link>
      </section>
    </>
  )
}
