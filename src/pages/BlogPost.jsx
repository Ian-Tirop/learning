import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams, useParams } from 'react-router-dom'
import { getAllPosts, getPostBySlug } from '../data/postStore'
import { getPostExtras } from '../data/postExtras'
import { getRelatedPosts } from '../lib/postRanking'
import { getHeadings } from '../lib/headings'
import { usePostEngagement } from '../hooks/usePostEngagement'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaDescription } from '../hooks/useMetaDescription'
import { useCanonicalUrl } from '../hooks/useCanonicalUrl'
import { useMetaRobots } from '../hooks/useMetaRobots'
import { useAdmin } from '../context/AdminContext'
import { PostCover } from '../components/PostCover'
import { PostEngagement } from '../components/PostEngagement'
import { CommentSection } from '../components/CommentSection'
import { ContentBlocks } from '../components/ContentBlocks'
import { ReadingProgress } from '../components/ReadingProgress'
import { Poll } from '../components/Poll'
import { Quiz } from '../components/Quiz'
import { formatDate } from '../lib/formatDate'
import './BlogPost.css'

export function BlogPost() {
  const { slug } = useParams()
  return <BlogPostView key={slug} slug={slug} />
}

function BlogPostView({ slug }) {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || undefined
  const { effectiveIsAdmin } = useAdmin()

  const [post, setPost] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [related, setRelated] = useState([])

  useEffect(() => {
    let cancelled = false
    window.scrollTo(0, 0)
    setPost(null)
    setNotFound(false)

    getPostBySlug(slug, { token })
      .then((fetched) => {
        if (cancelled) return
        setPost(fetched)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })

    getAllPosts()
      .then((all) => {
        if (!cancelled) setRelated(all)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [slug, token])

  const engagement = usePostEngagement(post)
  useDocumentTitle(post ? `${post.title} — Ian Tirop` : 'Ian Tirop — Blog')
  useMetaDescription(post?.excerpt || "Ian Tirop's blog — notes on code, design, and building things on the web.")
  useCanonicalUrl()
  useMetaRobots(post && post.status !== 'published' ? 'noindex, nofollow' : 'index, follow')

  if (notFound) {
    return <Navigate to="/blog" replace />
  }

  if (!post) {
    return (
      <article className="container post-page">
        <p className="loading-note">Loading post…</p>
      </article>
    )
  }

  const publishedOrder = related.filter((candidate) => candidate.status === 'published')
  const currentIndex = publishedOrder.findIndex((candidate) => candidate.slug === post.slug)
  const prev = currentIndex >= 0 ? publishedOrder[currentIndex + 1] : undefined
  const next = currentIndex > 0 ? publishedOrder[currentIndex - 1] : undefined
  const relatedPosts = getRelatedPosts(related, post, 3)
  const headings = getHeadings(post.content)
  const canEditAsOwner = Boolean(token && post.status === 'pending')
  const extras = getPostExtras(post.slug)

  return (
    <article className="container post-page">
      <ReadingProgress />

      <Link to="/blog" className="back-link">
        <svg className="icon" role="presentation" aria-hidden="true">
          <use href="/icons.svg#arrow-icon"></use>
        </svg>
        Back to all posts
      </Link>

      <PostCover cover={post.cover} size="banner" />

      <header className="post-header fade-in-up">
        <div className="post-row-tags">
          {post.status !== 'published' && (
            <span className="tag draft-tag">
              {post.status === 'pending' ? 'Pending review' : post.status.charAt(0).toUpperCase() + post.status.slice(1)}
            </span>
          )}
          {post.tags.map((tag) => (
            <Link key={tag} to={`/blog?tag=${encodeURIComponent(tag)}`} className="tag">
              {tag}
            </Link>
          ))}
        </div>
        <h1>{post.title}</h1>
        <p className="post-meta">
          {formatDate(post.date, 'long')}
          {' · '}
          {post.readingTime} min read
          {post.submittedByName && ` · submitted by ${post.submittedByName}`}
        </p>
        {(effectiveIsAdmin || canEditAsOwner) && post.status !== 'published' && (
          <Link
            to={canEditAsOwner ? `/submit/edit/${post.slug}?token=${token}` : `/write/${post.slug}`}
            className="btn btn-ghost post-edit-link"
          >
            Edit this post
          </Link>
        )}
      </header>

      {headings.length > 1 && (
        <nav className="toc" aria-label="Table of contents">
          <p className="toc-label">In this post</p>
          <ul>
            {headings.map((heading) => (
              <li key={heading.id}>
                <a href={`#${heading.id}`}>{heading.text}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="prose">
        <ContentBlocks content={post.content} />
      </div>

      {post.link && (
        <a
          href={post.link.href}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary post-link-cta"
        >
          {post.link.label}
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#arrow-icon"></use>
          </svg>
        </a>
      )}

      {post.status === 'published' && (
        <>
          {extras && (
            <>
              <Poll slug={post.slug} poll={extras.poll} />
              <Quiz slug={post.slug} quiz={extras.quiz} />
            </>
          )}

          <PostEngagement post={post} {...engagement} />

          <CommentSection
            comments={engagement.comments}
            addComment={engagement.addComment}
            editComment={engagement.editComment}
            deleteComment={engagement.deleteComment}
            addReply={engagement.addReply}
            editReply={engagement.editReply}
            deleteReply={engagement.deleteReply}
            toggleReaction={engagement.toggleReaction}
          />
        </>
      )}

      <div className="author-card">
        <div className="author-avatar" aria-hidden="true">
          IT
        </div>
        <div>
          <p className="author-name">Written by Ian Tirop</p>
          <Link to="/about" className="author-link">
            More about me
          </Link>
        </div>
      </div>

      {post.status === 'published' && relatedPosts.length > 0 && (
        <section className="related-posts">
          <h2>Related posts</h2>
          <div className="related-grid">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.slug}
                to={`/blog/${relatedPost.slug}`}
                className="card related-card"
              >
                <PostCover cover={relatedPost.cover} size="card" />
                <div className="related-card-body">
                  <h3>{relatedPost.title}</h3>
                  <p>{relatedPost.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {post.status === 'published' && (prev || next) && (
        <nav className="post-nav">
          {prev ? (
            <Link to={`/blog/${prev.slug}`} className="card post-nav-link">
              <span className="post-nav-label">← Older</span>
              <span className="post-nav-title">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={`/blog/${next.slug}`} className="card post-nav-link next">
              <span className="post-nav-label">Newer →</span>
              <span className="post-nav-title">{next.title}</span>
            </Link>
          )}
        </nav>
      )}
    </article>
  )
}
