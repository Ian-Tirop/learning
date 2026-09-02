import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { deletePost, getAllPosts, updatePost } from '../../data/postStore'
import { PostCover } from '../../components/PostCover'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import { useAdmin } from '../../context/AdminContext'
import { formatDate } from '../../lib/formatDate'
import './Write.css'

const STATUS_LABEL = { draft: 'Draft', published: 'Published', pending: 'Pending review', rejected: 'Rejected' }

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
