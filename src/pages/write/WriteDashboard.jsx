import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { deletePost, getAllPosts, updatePost } from '../../data/postStore'
import { getAnalytics, deleteCommentAsAdmin } from '../../data/adminStore'
import { PostCover } from '../../components/PostCover'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import { useAdmin } from '../../context/AdminContext'
import { useToast } from '../../context/ToastContext'
import { useCountUp } from '../../hooks/useCountUp'
import { formatDate } from '../../lib/formatDate'
import './Write.css'

function StatValue({ value }) {
  const animated = useCountUp(value)
  return <span className="stat-value">{animated}</span>
}

const STATUS_LABEL = { draft: 'Draft', published: 'Published', pending: 'Pending review', rejected: 'Rejected', scheduled: 'Scheduled' }

function statPosts(data, statusFilter) {
  return data.posts
    .filter((post) => !statusFilter || post.status === statusFilter)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

const STAT_DEFS = [
  { key: 'total', label: 'Total posts', value: (t) => t.posts },
  { key: 'published', label: 'Published', value: (t) => t.byStatus.published || 0 },
  { key: 'pending', label: 'Pending review', value: (t) => t.byStatus.pending || 0 },
  { key: 'rejected', label: 'Rejected', value: (t) => t.byStatus.rejected || 0 },
  { key: 'draft', label: 'Drafts', value: (t) => t.byStatus.draft || 0 },
  { key: 'comments', label: 'Comments', value: (t) => t.comments },
  { key: 'accounts', label: 'Reader accounts', value: (t) => t.accounts },
  { key: 'subscribers', label: 'Newsletter subscribers', value: (t) => t.subscribers },
  { key: 'feedback', label: 'Feedback notes', value: (t) => t.feedback },
  { key: 'reportedComments', label: 'Reported comments', value: (t) => t.reportedComments },
  { key: 'likes', label: 'Likes', value: (t) => t.likes },
  { key: 'dislikes', label: 'Dislikes', value: (t) => t.dislikes },
  {
    key: 'rating',
    label: (t) => `Avg. rating (${t.ratingCount})`,
    value: (t) => (t.ratingCount > 0 ? t.averageRating.toFixed(1) : '—'),
  },
]

function PostDetailList({ posts, emptyMessage }) {
  if (posts.length === 0) return <p className="write-intro">{emptyMessage}</p>
  return (
    <ul className="analytics-list analytics-detail-list">
      {posts.map((post) => (
        <li key={post.slug}>
          <div>
            <Link to={`/write/${post.slug}`}>{post.title}</Link>
            <span className={`status-badge ${post.status}`}>{STATUS_LABEL[post.status]}</span>
          </div>
          <span>
            {formatDate(post.date)} · {post.likes} 👍 {post.dislikes} 👎 {post.comments} 💬
            {post.ratingCount > 0 && ` · ${post.ratingAverage.toFixed(1)} ★ (${post.ratingCount})`}
          </span>
        </li>
      ))}
    </ul>
  )
}

function AnalyticsDetail({ activeKey, data, reportedComments, onDeleteComment }) {
  if (!activeKey) return null

  const { posts, accounts, subscribers, feedback, recentComments } = data

  let title = ''
  let body = null

  if (['total', 'published', 'pending', 'rejected', 'draft'].includes(activeKey)) {
    const statusFilter = activeKey === 'total' ? null : activeKey
    title = STAT_DEFS.find((s) => s.key === activeKey).label
    body = <PostDetailList posts={statPosts(data, statusFilter)} emptyMessage="No posts here yet." />
  } else if (activeKey === 'likes' || activeKey === 'dislikes') {
    title = activeKey === 'likes' ? 'Posts by likes' : 'Posts by dislikes'
    const sorted = [...posts].sort((a, b) => b[activeKey] - a[activeKey])
    body = <PostDetailList posts={sorted} emptyMessage="Nothing published yet." />
  } else if (activeKey === 'rating') {
    title = 'Posts by rating'
    const rated = posts.filter((post) => post.ratingCount > 0).sort((a, b) => b.ratingAverage - a.ratingAverage)
    body = <PostDetailList posts={rated} emptyMessage="No ratings yet." />
  } else if (activeKey === 'comments') {
    title = `Comments (${recentComments.length}${recentComments.length === 50 ? '+' : ''})`
    body =
      recentComments.length === 0 ? (
        <p className="write-intro">No comments yet.</p>
      ) : (
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
      )
  } else if (activeKey === 'accounts') {
    title = 'Reader accounts'
    body =
      accounts.length === 0 ? (
        <p className="write-intro">No reader accounts yet.</p>
      ) : (
        <ul className="analytics-list analytics-detail-list">
          {accounts.map((account) => (
            <li key={account.id}>
              <div>
                <strong>{account.displayName}</strong>
                <span className="analytics-detail-sub">{account.email}</span>
              </div>
              <span>
                {account.postCount} {account.postCount === 1 ? 'post' : 'posts'} · joined{' '}
                {formatDate(account.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )
  } else if (activeKey === 'subscribers') {
    title = 'Newsletter subscribers'
    body =
      subscribers.length === 0 ? (
        <p className="write-intro">No subscribers yet.</p>
      ) : (
        <ul className="analytics-list analytics-detail-list">
          {subscribers.map((sub) => (
            <li key={sub.email}>
              <span>{sub.email}</span>
              <span>Subscribed {formatDate(sub.subscribedAt)}</span>
            </li>
          ))}
        </ul>
      )
  } else if (activeKey === 'feedback') {
    title = 'Reader feedback'
    body =
      feedback.length === 0 ? (
        <p className="write-intro">No feedback yet.</p>
      ) : (
        <ul className="analytics-list recent-comments-list">
          {feedback.map((note) => (
            <li key={note.id}>
              <div>
                <strong>{note.name || 'Anonymous'}</strong>
                {note.email && <span className="analytics-detail-sub"> ({note.email})</span>}
                {note.postSlug && (
                  <span className="analytics-detail-sub">
                    {' '}
                    · re: <Link to={`/blog/${note.postSlug}`}>{note.postTitle}</Link>
                  </span>
                )}
                <p>{note.message}</p>
                {note.interests.length > 0 && (
                  <p className="analytics-detail-sub">Interested in: {note.interests.join(', ')}</p>
                )}
                {note.wantsToWrite && note.wantsToWrite !== 'no' && (
                  <p className="analytics-detail-sub">
                    Wants to write{note.writeNote ? `: ${note.writeNote}` : '.'}
                  </p>
                )}
              </div>
              <span>{formatDate(note.createdAt)}</span>
            </li>
          ))}
        </ul>
      )
  } else if (activeKey === 'reportedComments') {
    title = 'Reported comments'
    body =
      reportedComments.length === 0 ? (
        <p className="write-intro">No comments have been reported.</p>
      ) : (
        <ul className="analytics-list recent-comments-list">
          {reportedComments.map((comment) => (
            <li key={comment.id}>
              <div>
                <strong>{comment.name}</strong> on{' '}
                <Link to={`/blog/${comment.postSlug}`}>{comment.postTitle}</Link>
                <span className="analytics-detail-sub">
                  {' '}
                  · reported {comment.reportCount} {comment.reportCount === 1 ? 'time' : 'times'}
                </span>
                <p>{comment.text}</p>
              </div>
              <button type="button" className="comment-action-btn danger" onClick={() => onDeleteComment(comment.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )
  }

  return (
    <div className="analytics-detail">
      <h3>{title}</h3>
      {body}
    </div>
  )
}

function AnalyticsBody({ data }) {
  const [activeKey, setActiveKey] = useState(null)
  const [reportedComments, setReportedComments] = useState(data.reportedComments)
  const { totals, topLiked, topCommented, topRated, trending } = data
  const toggleActive = (key) => setActiveKey((current) => (current === key ? null : key))

  const handleDeleteComment = async (id) => {
    await deleteCommentAsAdmin(id)
    setReportedComments((current) => current.filter((comment) => comment.id !== id))
  }

  return (
    <>
      <p className="write-intro">
        Real numbers from your database — engagement, review queue, reader accounts, subscribers, and
        feedback. There&apos;s no page-view tracking on this site, so this won&apos;t show visits or
        traffic. Click any card for the full list.
      </p>

      <div className="analytics-grid">
        {STAT_DEFS.map((stat) => (
          <button
            key={stat.key}
            type="button"
            className={`stat-card${activeKey === stat.key ? ' active' : ''}`}
            onClick={() => toggleActive(stat.key)}
            aria-pressed={activeKey === stat.key}
          >
            <StatValue value={stat.value(totals)} />
            <span className="stat-label">{typeof stat.label === 'function' ? stat.label(totals) : stat.label}</span>
          </button>
        ))}
      </div>

      <AnalyticsDetail
        activeKey={activeKey}
        data={data}
        reportedComments={reportedComments}
        onDeleteComment={handleDeleteComment}
      />

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

        <div className="analytics-column">
          <h3>Trending this week</h3>
          <p className="body-hint">By comment activity in the last 7 days.</p>
          {trending.length === 0 && <p className="write-intro">Nothing this week yet.</p>}
          <ul className="analytics-list">
            {trending.map((post) => (
              <li key={post.slug}>
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                <span>{post.comments} 💬</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

// Collapsed by default — the full grid + leaderboards made /write very
// long, and most visits here are to work the review queue, not to check
// analytics. Data is only fetched the first time it's expanded.
function AnalyticsSection() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleToggle = () => {
    setOpen((current) => !current)
    if (!data && !loading) {
      setLoading(true)
      getAnalytics()
        .then(setData)
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    }
  }

  return (
    <div className="analytics-section">
      <button
        type="button"
        className="analytics-toggle"
        onClick={handleToggle}
        aria-expanded={open}
      >
        <h2>Analytics</h2>
        <svg className={`icon chevron${open ? ' open' : ''}`} role="presentation" aria-hidden="true">
          <use href="/icons.svg#chevron-icon"></use>
        </svg>
      </button>

      {open && (
        <div className="analytics-body">
          {loading && <p className="loading-note">Loading analytics…</p>}
          {!loading && error && <p className="write-intro">Could not load analytics right now.</p>}
          {!loading && data && <AnalyticsBody data={data} />}
        </div>
      )}
    </div>
  )
}

export function WriteDashboard() {
  useDocumentTitle('Write — Ian Tirop')
  useMetaRobots()
  const { isAdmin, loading: authLoading } = useAdmin()
  const showToast = useToast()

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
    showToast('Post deleted')
  }

  const handleApprove = async (slug) => {
    await updatePost(slug, { status: 'published' })
    refresh()
    showToast('Published! 🎉', { type: 'success' })
  }

  const handleReject = async (slug) => {
    await updatePost(slug, { status: 'rejected', reviewNote: reviewNote.trim() || undefined })
    setReviewNoteFor(null)
    setReviewNote('')
    refresh()
    showToast('Submission rejected')
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
