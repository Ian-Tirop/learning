import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { deletePost, getAllPosts, updatePost } from '../../data/postStore'
import { getAnalytics } from '../../data/adminStore'
import { PostCover } from '../../components/PostCover'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import { useAdmin } from '../../context/AdminContext'
import { formatDate } from '../../lib/formatDate'
import './Write.css'

const STATUS_LABEL = { draft: 'Draft', published: 'Published', pending: 'Pending review', rejected: 'Rejected' }

function AnalyticsSection() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="analytics-section">
        <p className="loading-note">Loading analytics…</p>
      </div>
    )
  }

  if (!data) return null

  const { totals, topLiked, topCommented, topRated, recentComments } = data

  return (
    <div className="analytics-section">
      <h2>Analytics</h2>
      <p className="write-intro">
        Real numbers from your database — engagement, review queue, and reader accounts. There's no
        page-view tracking on this site, so this won&apos;t show visits or traffic.
      </p>

      <div className="analytics-grid">
        <div className="stat-card">
          <span className="stat-value">{totals.posts}</span>
          <span className="stat-label">Total posts</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totals.byStatus.published || 0}</span>
          <span className="stat-label">Published</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totals.byStatus.pending || 0}</span>
          <span className="stat-label">Pending review</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totals.byStatus.rejected || 0}</span>
          <span className="stat-label">Rejected</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totals.byStatus.draft || 0}</span>
          <span className="stat-label">Drafts</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totals.comments}</span>
          <span className="stat-label">Comments</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totals.accounts}</span>
          <span className="stat-label">Reader accounts</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totals.likes}</span>
          <span className="stat-label">Likes</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totals.dislikes}</span>
          <span className="stat-label">Dislikes</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {totals.ratingCount > 0 ? totals.averageRating.toFixed(1) : '—'}
          </span>
          <span className="stat-label">Avg. rating ({totals.ratingCount})</span>
        </div>
      </div>

      <div className="analytics-columns">
        <div className="analytics-column">
          <h3>Most liked</h3>
          {topLiked.length === 0 && <p className="write-intro">Nothing published yet.</p>}
          <ul className="analytics-list">
            {topLiked.map((post) => (
              <li key={post.slug}>
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                <span>{post.likes} 👍</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="analytics-column">
          <h3>Most commented</h3>
          {topCommented.length === 0 && <p className="write-intro">Nothing published yet.</p>}
          <ul className="analytics-list">
            {topCommented.map((post) => (
              <li key={post.slug}>
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                <span>{post.comments} 💬</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="analytics-column">
          <h3>Top rated</h3>
          {topRated.length === 0 && <p className="write-intro">No ratings yet.</p>}
          <ul className="analytics-list">
            {topRated.map((post) => (
              <li key={post.slug}>
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                <span>
                  {post.average.toFixed(1)} ★ ({post.count})
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {recentComments.length > 0 && (
        <div className="analytics-column recent-comments">
          <h3>Recent comments</h3>
          <ul className="analytics-list recent-comments-list">
            {recentComments.map((comment) => (
              <li key={comment.id}>
                <div>
                  <strong>{comment.name}</strong> on{' '}
                  <Link to={`/blog/${comment.postSlug}`}>{comment.postTitle}</Link>
                  <p>{comment.text}</p>
                </div>
                <span>{formatDate(comment.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function WriteDashboard() {
  useDocumentTitle('Write — Ian Tirop')
  useMetaRobots()
  const { isAdmin, loading: authLoading } = useAdmin()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmingSlug, setConfirmingSlug] = useState(null)
  const [reviewNoteFor, setReviewNoteFor] = useState(null)
  const [reviewNote, setReviewNote] = useState('')

  const refresh = () => {
    setLoading(true)
    getAllPosts({ all: true })
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isAdmin) refresh()
  }, [isAdmin])

  if (!authLoading && !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  const handleDelete = async (slug) => {
    await deletePost(slug)
    setConfirmingSlug(null)
    refresh()
  }

  const handleApprove = async (slug) => {
    await updatePost(slug, { status: 'published' })
    refresh()
  }

  const handleReject = async (slug) => {
    await updatePost(slug, { status: 'rejected', reviewNote: reviewNote.trim() || undefined })
    setReviewNoteFor(null)
    setReviewNote('')
    refresh()
  }

  const pending = posts.filter((post) => post.status === 'pending')
  const rest = posts.filter((post) => post.status !== 'pending')

  return (
    <section className="container write-page">
      <div className="write-header">
        <div>
          <p className="eyebrow">Write</p>
          <h1>Your posts</h1>
          <p className="write-intro">
            {loading ? 'Loading…' : `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`} — this
            is the real, shared site content, not a per-browser copy.
          </p>
        </div>
        <Link to="/write/new" className="btn btn-primary">
          New post
        </Link>
      </div>

      <AnalyticsSection />

      {pending.length > 0 && (
        <div className="write-pending">
          <h2>Pending review ({pending.length})</h2>
          <ul className="write-list">
            {pending.map((post) => (
              <li key={post.slug} className="write-row">
                <PostCover cover={post.cover} size="thumb" />
                <div className="write-row-main">
                  <div className="write-row-title">
                    <h2>{post.title}</h2>
                    <span className="status-badge pending">Pending review</span>
                  </div>
                  <p className="write-row-meta">
                    Submitted by {post.submittedByName || 'a reader'}
                    {post.submittedByEmail && ` (${post.submittedByEmail})`} · {formatDate(post.date)}
                  </p>
                </div>
                <div className="write-row-actions">
                  <Link to={`/blog/${post.slug}`} className="comment-action-btn">
                    Preview
                  </Link>
                  <Link to={`/write/${post.slug}`} className="comment-action-btn">
                    Edit
                  </Link>
                  <button type="button" className="comment-action-btn" onClick={() => handleApprove(post.slug)}>
                    Approve
                  </button>
                  {reviewNoteFor === post.slug ? (
                    <span className="delete-confirm">
                      <input
                        type="text"
                        className="review-note-input"
                        placeholder="Optional note (visible to no one but you for now)"
                        value={reviewNote}
                        onChange={(event) => setReviewNote(event.target.value)}
                      />
                      <button
                        type="button"
                        className="comment-action-btn danger"
                        onClick={() => handleReject(post.slug)}
                      >
                        Confirm reject
                      </button>
                      <button
                        type="button"
                        className="comment-action-btn"
                        onClick={() => {
                          setReviewNoteFor(null)
                          setReviewNote('')
                        }}
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="comment-action-btn danger"
                      onClick={() => setReviewNoteFor(post.slug)}
                    >
                      Reject
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="write-list">
        {rest.map((post) => (
          <li key={post.slug} className="write-row">
            <PostCover cover={post.cover} size="thumb" />
            <div className="write-row-main">
              <div className="write-row-title">
                <h2>{post.title}</h2>
                <span className={`status-badge ${post.status}`}>{STATUS_LABEL[post.status]}</span>
              </div>
              <p className="write-row-meta">
                {formatDate(post.date)}
                {' · '}
                {post.readingTime} min read
                {post.submittedByName && ` · submitted by ${post.submittedByName}`}
                {post.submittedByEmail && ` (${post.submittedByEmail})`}
                {post.status === 'rejected' && post.reviewNote && ` · note: ${post.reviewNote}`}
              </p>
            </div>
            <div className="write-row-actions">
              <Link to={`/blog/${post.slug}`} className="comment-action-btn">
                Preview
              </Link>
              <Link to={`/write/${post.slug}`} className="comment-action-btn">
                Edit
              </Link>
              {confirmingSlug === post.slug ? (
                <span className="delete-confirm">
                  <button
                    type="button"
                    className="comment-action-btn danger"
                    onClick={() => handleDelete(post.slug)}
                  >
                    Confirm delete
                  </button>
                  <button
                    type="button"
                    className="comment-action-btn"
                    onClick={() => setConfirmingSlug(null)}
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="comment-action-btn danger"
                  onClick={() => setConfirmingSlug(post.slug)}
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
