import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { deletePost, getAllPosts, updatePost } from '../../data/postStore'
import { getAnalytics, deleteCommentAsAdmin, getAdminAvatar, uploadAdminAvatar } from '../../data/adminStore'
import { PostCover } from '../../components/PostCover'
import { SecurityPanel } from '../admin/SecurityPanel'
import { ReaderDetailModal } from './ReaderDetailModal'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import { useAdmin } from '../../context/AdminContext'
import { useToast } from '../../context/ToastContext'
import { useCountUp } from '../../hooks/useCountUp'
import { formatDate } from '../../lib/formatDate'
import { getPostPath } from '../../lib/postUrl'
import '../account/Account.css'
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

function AnalyticsDetail({ activeKey, data, reportedComments, onDeleteComment, onViewAccount }) {
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
                <strong>{comment.name}</strong>
                {!comment.accountId && <span className="guest-badge">Guest</span>} on{' '}
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
              <span className="reader-account-row-end">
                {account.postCount} {account.postCount === 1 ? 'post' : 'posts'} · joined{' '}
                {formatDate(account.createdAt)}
                <button type="button" className="comment-action-btn" onClick={() => onViewAccount(account.id)}>
                  View
                </button>
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
                <strong>{comment.name}</strong>
                {!comment.accountId && <span className="guest-badge">Guest</span>} on{' '}
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

function AnalyticsBody({ data, onViewAccount }) {
  const [activeKey, setActiveKey] = useState(null)
  const [reportedComments, setReportedComments] = useState(data.reportedComments)
  const { totals, topLiked, topCommented, topRated, trending, mostFollowed } = data
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
        onViewAccount={onViewAccount}
      />

      <div className="analytics-columns">
        <div className="analytics-column">
          <h3>Most liked</h3>
          {topLiked.length === 0 && <p className="write-intro">Nothing published yet.</p>}
          <ul className="analytics-list">
            {topLiked.map((post) => (
              <li key={post.slug}>
                <Link to={getPostPath(post)}>{post.title}</Link>
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
                <Link to={getPostPath(post)}>{post.title}</Link>
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
                <Link to={getPostPath(post)}>{post.title}</Link>
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
                <Link to={getPostPath(post)}>{post.title}</Link>
                <span>{post.comments} 💬</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="analytics-column">
          <h3>Most followed</h3>
          {mostFollowed.length === 0 && <p className="write-intro">No follows yet.</p>}
          <ul className="analytics-list">
            {mostFollowed.map((writer) => (
              <li key={writer.id}>
                <Link to={`/reader/${writer.id}`}>{writer.displayName}</Link>
                <span>
                  {writer.followerCount} {writer.followerCount === 1 ? 'follower' : 'followers'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

function OverviewPanel({ analytics, pendingCount, onGoToReview }) {
  if (!analytics) return <p className="loading-note">Loading…</p>

  const { recentComments, trending } = analytics

  return (
    <>
      {pendingCount > 0 && (
        <button type="button" className="overview-callout" onClick={onGoToReview}>
          <strong>
            {pendingCount} {pendingCount === 1 ? 'submission' : 'submissions'}
          </strong>{' '}
          waiting for your review →
        </button>
      )}

      <div className="analytics-columns">
        <div className="analytics-column">
          <h3>Trending this week</h3>
          <p className="body-hint">By comment activity in the last 7 days.</p>
          {trending.length === 0 && <p className="write-intro">Nothing this week yet.</p>}
          <ul className="analytics-list">
            {trending.map((post) => (
              <li key={post.slug}>
                <Link to={getPostPath(post)}>{post.title}</Link>
                <span>{post.comments} 💬</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="analytics-column recent-comments">
          <h3>Recent comments</h3>
          {recentComments.length === 0 && <p className="write-intro">No comments yet.</p>}
          <ul className="analytics-list recent-comments-list">
            {recentComments.slice(0, 6).map((comment) => (
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
      </div>
    </>
  )
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'grid-icon' },
  { key: 'review', label: 'Review queue', icon: 'check-icon' },
  { key: 'posts', label: 'All posts', icon: 'folder-icon' },
  { key: 'analytics', label: 'Analytics', icon: 'network-icon' },
  { key: 'security', label: 'Security', icon: 'user-icon' },
]

function AdminAvatarUploadForm({ avatarUrl, onUploaded }) {
  const showToast = useToast()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadAdminAvatar(file)
      onUploaded(url)
      showToast('Profile picture updated.', { type: 'success' })
    } catch (err) {
      showToast(err.message || 'Could not upload that image.', { type: 'error' })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="settings-card">
      <h3 className="settings-card-title">Profile picture</h3>
      <p className="body-hint">PNG, JPEG, WebP, or GIF, up to 5MB.</p>
      <div className="avatar-upload-row">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="profile-avatar profile-avatar-sm profile-avatar-photo" />
        ) : (
          <div className="profile-avatar profile-avatar-sm" aria-hidden="true">
            IT
          </div>
        )}
        <label className="btn btn-ghost">
          {uploading ? 'Uploading…' : 'Upload photo'}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            hidden
          />
        </label>
      </div>
    </div>
  )
}

export function WriteDashboard() {
  useDocumentTitle('Write — Ian Tirop')
  useMetaRobots()
  const { isAdmin, loading: authLoading, logout } = useAdmin()
  const showToast = useToast()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [confirmingSlug, setConfirmingSlug] = useState(null)
  const [reviewNoteFor, setReviewNoteFor] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'overview')
  const [viewingAccountId, setViewingAccountId] = useState(null)
  const [postsFilter, setPostsFilter] = useState('all')
  const [avatarUrl, setAvatarUrl] = useState(null)

  const refresh = () => {
    setLoading(true)
    Promise.all([getAllPosts({ all: true }).catch(() => []), getAnalytics().catch(() => null)])
      .then(([allPosts, analyticsData]) => {
        setPosts(allPosts)
        setAnalytics(analyticsData)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isAdmin) {
      refresh()
      getAdminAvatar().then(setAvatarUrl).catch(() => {})
    }
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
  const filteredPosts = posts.filter((post) => {
    if (postsFilter === 'mine') return !post.submittedByName
    if (postsFilter === 'community') return Boolean(post.submittedByName)
    return true
  })

  return (
    <section className="container write-page profile-page">
      <div className="profile-header">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="profile-avatar profile-avatar-photo" />
        ) : (
          <div className="profile-avatar" aria-hidden="true">
            IT
          </div>
        )}
        <div className="profile-header-info">
          <p className="eyebrow">Admin</p>
          <h1>Ian Tirop</h1>
          <p className="write-intro">
            {loading ? 'Loading…' : `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`} — the
            real, shared site content, not a per-browser copy.
          </p>
        </div>
        <div className="write-header-actions">
          <Link to="/write/new" className="btn btn-primary">
            New post
          </Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <div className="analytics-grid profile-stats">
        <button type="button" className="stat-card" onClick={() => setActiveTab('posts')}>
          <StatValue value={analytics?.totals.posts ?? posts.length} />
          <span className="stat-label">Total posts</span>
        </button>
        <button type="button" className="stat-card" onClick={() => setActiveTab('review')}>
          <StatValue value={analytics?.totals.byStatus.pending ?? pending.length} />
          <span className="stat-label">Pending review</span>
        </button>
        <button type="button" className="stat-card" onClick={() => setActiveTab('analytics')}>
          <StatValue value={analytics?.totals.comments ?? 0} />
          <span className="stat-label">Comments</span>
        </button>
        <button type="button" className="stat-card" onClick={() => setActiveTab('analytics')}>
          <StatValue value={analytics?.totals.accounts ?? 0} />
          <span className="stat-label">Reader accounts</span>
        </button>
      </div>

      <div className="profile-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`profile-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href={`/icons.svg#${tab.icon}`}></use>
            </svg>
            {tab.label}
            {tab.key === 'review' && pending.length > 0 && <span className="tab-badge">{pending.length}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="profile-panel">
          <OverviewPanel analytics={analytics} pendingCount={pending.length} onGoToReview={() => setActiveTab('review')} />
        </div>
      )}

      {activeTab === 'review' && (
        <div className="profile-panel">
          <h2 className="profile-section-title">Pending review ({pending.length})</h2>
          {pending.length === 0 && <p className="write-intro">Nothing waiting on you right now.</p>}
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
                  <Link to={getPostPath(post)} state={{ adminTab: 'review' }} className="comment-action-btn">
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

      {activeTab === 'posts' && (
        <div className="profile-panel">
          <h2 className="profile-section-title">All posts ({filteredPosts.length})</h2>
          <p className="write-intro">Every post regardless of status — drafts, scheduled, published, rejected, and pending.</p>
          <div className="body-tabs posts-filter-tabs">
            {[
              { key: 'all', label: `All (${posts.length})` },
              { key: 'mine', label: `Mine (${posts.filter((p) => !p.submittedByName).length})` },
              { key: 'community', label: `Community (${posts.filter((p) => p.submittedByName).length})` },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                className={`body-tab${postsFilter === option.key ? ' active' : ''}`}
                onClick={() => setPostsFilter(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <ul className="write-list">
            {filteredPosts.map((post) => (
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
                  <Link to={getPostPath(post)} state={{ adminTab: 'posts' }} className="comment-action-btn">
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
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="profile-panel">
          <h2 className="profile-section-title">Analytics</h2>
          {!analytics && <p className="loading-note">Loading analytics…</p>}
          {analytics && <AnalyticsBody data={analytics} onViewAccount={setViewingAccountId} />}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="profile-panel">
          <h2 className="profile-section-title">Security</h2>
          <AdminAvatarUploadForm avatarUrl={avatarUrl} onUploaded={setAvatarUrl} />
          <SecurityPanel />
        </div>
      )}

      {viewingAccountId && (
        <ReaderDetailModal
          accountId={viewingAccountId}
          onClose={() => setViewingAccountId(null)}
          onDeleted={() => refresh()}
        />
      )}
    </section>
  )
}
