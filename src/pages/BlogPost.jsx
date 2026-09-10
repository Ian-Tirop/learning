import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams, useParams } from 'react-router-dom'
import { getAllPosts, getPostBySlug } from '../data/postStore'
import { getPostExtras } from '../data/postExtras'
import { getRelatedPosts } from '../lib/postRanking'
import { getHeadings } from '../lib/headings'
import { countWords } from '../lib/estimateReadingTime'
import { usePostEngagement } from '../hooks/usePostEngagement'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaDescription } from '../hooks/useMetaDescription'
import { useCanonicalUrl } from '../hooks/useCanonicalUrl'
import { useMetaRobots } from '../hooks/useMetaRobots'
import { useAdmin } from '../context/AdminContext'
import { useAccount } from '../context/AccountContext'
import { useToast } from '../context/ToastContext'
import { toggleFollow } from '../data/accountStore'
import { initials } from '../lib/initials'
import { PostCover } from '../components/PostCover'
import { Reveal } from '../components/Reveal'
import { TableOfContents } from '../components/TableOfContents'
import { PostEngagement } from '../components/PostEngagement'
import { CommentSection } from '../components/CommentSection'
import { ContentBlocks } from '../components/ContentBlocks'
import { ReadingProgress } from '../components/ReadingProgress'
import { Poll } from '../components/Poll'
import { Quiz } from '../components/Quiz'
import { SuggestEdit } from '../components/SuggestEdit'
import { ListenButton } from '../components/ListenButton'
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
  const { account } = useAccount()
  const showToast = useToast()

  const [post, setPost] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [related, setRelated] = useState([])
  const [activeHeadingId, setActiveHeadingId] = useState(null)
  const [followState, setFollowState] = useState(null)
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    window.scrollTo(0, 0)
    setPost(null)
    setNotFound(false)

    setFollowState(null)

    getPostBySlug(slug, { token })
      .then((fetched) => {
        if (cancelled) return
        setPost(fetched)
        if (fetched.author) {
          setFollowState({ following: fetched.author.isFollowing, followerCount: fetched.author.followerCount })
        }
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

  const headingIds = post ? getHeadings(post.content).map((h) => h.id) : []
  useEffect(() => {
    if (headingIds.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length > 0) setActiveHeadingId(visible[0].target.id)
      },
      { rootMargin: '-84px 0px -70% 0px' },
    )
    headingIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.slug, headingIds.length])

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
  const isLongPost = countWords(post.content) >= 1500
  const canEditAsOwner = Boolean(token && post.status === 'pending')
  const extras = getPostExtras(post.slug)
  const handleToggleFollow = async () => {
    if (!post.author || followBusy) return
    setFollowBusy(true)
    try {
      const result = await toggleFollow(post.author.id)
      setFollowState({ following: result.following, followerCount: result.followerCount })
      showToast(result.following ? `Following ${post.author.displayName}` : `Unfollowed ${post.author.displayName}`)
    } catch (err) {
      showToast(err.message || 'Could not update that right now.', { type: 'error' })
    } finally {
      setFollowBusy(false)
    }
  }

  const seriesPosts = post.seriesName
    ? publishedOrder
        .filter((candidate) => candidate.seriesName === post.seriesName)
        .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0))
    : []

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
        <ListenButton post={post} />
        {(effectiveIsAdmin || canEditAsOwner) && post.status !== 'published' && (
          <Link
            to={canEditAsOwner ? `/submit/edit/${post.slug}?token=${token}` : `/write/${post.slug}`}
            className="btn btn-ghost post-edit-link"
          >
            Edit this post
          </Link>
        )}
      </header>

      {seriesPosts.length > 1 && (
        <nav className="series-nav" aria-label={`${post.seriesName} series`}>
          <p className="toc-label">{post.seriesName}</p>
          <ul>
            {seriesPosts.map((seriesPost) => (
              <li key={seriesPost.slug}>
                {seriesPost.slug === post.slug ? (
                  <span className="series-current">
                    Part {seriesPost.seriesOrder}: {seriesPost.title}
                  </span>
                ) : (
                  <Link to={`/blog/${seriesPost.slug}`}>
                    Part {seriesPost.seriesOrder}: {seriesPost.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}

      {headings.length > 1 && isLongPost && (
        <TableOfContents headings={headings} activeHeadingId={activeHeadingId} />
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

      {post.status === 'published' && <SuggestEdit postSlug={post.slug} postTitle={post.title} />}

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
            account={account}
            comments={engagement.comments}
            addComment={engagement.addComment}
            editComment={engagement.editComment}
            deleteComment={engagement.deleteComment}
            addReply={engagement.addReply}
            editReply={engagement.editReply}
            deleteReply={engagement.deleteReply}
            toggleReaction={engagement.toggleReaction}
            reportComment={engagement.reportComment}
          />
        </>
      )}

      <Reveal>
        {post.author ? (
          <div className="author-card">
            <Link to={`/reader/${post.author.id}`}>
              {post.author.avatarUrl ? (
                <img src={post.author.avatarUrl} alt="" className="author-avatar author-avatar-photo" />
              ) : (
                <div className="author-avatar" aria-hidden="true">
                  {initials(post.author.displayName)}
                </div>
              )}
            </Link>
            <div className="author-card-info">
              <p className="author-name">
                Written by <Link to={`/reader/${post.author.id}`}>{post.author.displayName}</Link>
              </p>
              <p className="author-followers">
                {followState?.followerCount ?? post.author.followerCount}{' '}
                {(followState?.followerCount ?? post.author.followerCount) === 1 ? 'follower' : 'followers'}
              </p>
            </div>
            {account && account.id !== post.author.id && (
              <button
                type="button"
                className={`btn ${followState?.following ? 'btn-ghost' : 'btn-primary'} follow-btn`}
                onClick={handleToggleFollow}
                disabled={followBusy}
              >
                {followState?.following ? 'Following' : 'Follow'}
              </button>
            )}
            {!account && (
              <Link to="/account/login" className="btn btn-ghost follow-btn">
                Log in to follow
              </Link>
            )}
          </div>
        ) : post.submittedByName ? (
          <div className="author-card">
            <div className="author-avatar" aria-hidden="true">
              {initials(post.submittedByName)}
            </div>
            <div>
              <p className="author-name">Written by {post.submittedByName}</p>
            </div>
          </div>
        ) : (
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
        )}
      </Reveal>

      {post.status === 'published' && relatedPosts.length > 0 && (
        <Reveal as="section" className="related-posts">
          <h2>Related posts</h2>
          <div className="related-grid">
            {relatedPosts.map((relatedPost, index) => (
              <Reveal as="div" key={relatedPost.slug} delay={index * 90}>
                <Link to={`/blog/${relatedPost.slug}`} className="card related-card">
                  <PostCover cover={relatedPost.cover} size="card" />
                  <div className="related-card-body">
                    <h3>{relatedPost.title}</h3>
                    <p>{relatedPost.excerpt}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Reveal>
      )}

      {post.status === 'published' && (prev || next) && (
        <Reveal as="nav" className="post-nav">
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
        </Reveal>
      )}
    </article>
  )
}
