import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getAdjacentPosts, getPostBySlug } from '../data/postStore'
import { usePostEngagement } from '../hooks/usePostEngagement'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { PostCover } from '../components/PostCover'
import { PostEngagement } from '../components/PostEngagement'
import { CommentSection } from '../components/CommentSection'
import { ContentBlocks } from '../components/ContentBlocks'
import { ReadingProgress } from '../components/ReadingProgress'
import './BlogPost.css'

export function BlogPost() {
  const { slug } = useParams()
  return <BlogPostView key={slug} slug={slug} />
}

const EMPTY_POST = {
  slug: '',
  seed: { likes: 0, dislikes: 0, ratingSum: 0, ratingCount: 0, comments: [] },
}

function BlogPostView({ slug }) {
  const post = getPostBySlug(slug)
  const engagement = usePostEngagement(post ?? EMPTY_POST)
  useDocumentTitle(post ? `${post.title} — Ian Tirop` : 'Ian Tirop — Blog')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (!post) {
    return <Navigate to="/blog" replace />
  }

  const { prev, next } = getAdjacentPosts(slug)

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
          {post.status === 'draft' && <span className="tag draft-tag">Draft</span>}
          {post.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <h1>{post.title}</h1>
        <p className="post-meta">
          {new Date(post.date).toLocaleDateString(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
          {' · '}
          {post.readingTime} min read
        </p>
      </header>

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
    </article>
  )
}
