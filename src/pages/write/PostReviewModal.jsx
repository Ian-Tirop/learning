import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PostCover } from '../../components/PostCover'
import { formatDate } from '../../lib/formatDate'
import { getPostPath } from '../../lib/postUrl'

const STATUS_TITLE = { pending: 'Pending review', rejected: 'Rejected' }

// Opened from the Analytics tab's "Pending"/"Rejected" drill-downs (and the
// "All posts" list) so reviewing a submission shows the post, the writer,
// and — for a rejected one — the reason it was rejected, instead of
// dropping straight into the editor, which used to be the only way to see
// any of this.
export function PostReviewModal({ post, onClose, onApprove, onReject, onDelete, onViewAccount }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const isCommunitySubmission = Boolean(post.submittedByName)
  const isPending = post.status === 'pending'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card reader-detail-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${STATUS_TITLE[post.status] || 'Post'} details`}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#close-icon"></use>
          </svg>
        </button>

        <div className="reader-detail-header">
          <PostCover cover={post.cover} size="thumb" />
          <div>
            <h2>{post.title}</h2>
            <p className="write-intro">
              <span className={`status-badge ${post.status}`}>{STATUS_TITLE[post.status]}</span> ·{' '}
              {formatDate(post.date)}
            </p>
          </div>
        </div>

        {post.excerpt && <p className="write-intro">{post.excerpt}</p>}

        {!isPending && (
          <div className="reader-detail-section">
            <h3>Rejection note</h3>
            {post.reviewNote ? (
              <p className="write-intro">{post.reviewNote}</p>
            ) : (
              <p className="write-intro">No note was left for this rejection.</p>
            )}
          </div>
        )}

        <div className="reader-detail-section">
          <h3>Writer</h3>
          {isCommunitySubmission ? (
            <>
              <p className="write-intro">
                {post.submittedByName}
                {post.submittedByEmail && <span className="analytics-detail-sub"> ({post.submittedByEmail})</span>}
              </p>
              {post.authorAccountId && (
                <button
                  type="button"
                  className="comment-action-btn"
                  onClick={() => onViewAccount(post.authorAccountId)}
                >
                  View reader profile
                </button>
              )}
            </>
          ) : (
            <p className="write-intro">Written by you — not a community submission.</p>
          )}
        </div>

        {rejecting && (
          <div className="reader-detail-panel">
            <label className="field">
              <span>Rejection note (optional, visible to no one but you for now)</span>
              <textarea
                rows={3}
                value={rejectNote}
                onChange={(event) => setRejectNote(event.target.value)}
                placeholder="Why is this being rejected?"
              />
            </label>
            <div className="write-form-actions">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onReject(post.slug, rejectNote)}
              >
                Confirm reject
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setRejecting(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="reader-detail-actions">
          <button type="button" className="btn btn-primary" onClick={() => onApprove(post.slug)}>
            Approve &amp; publish
          </button>
          {isPending && !rejecting && (
            <button type="button" className="btn btn-ghost" onClick={() => setRejecting(true)}>
              Reject
            </button>
          )}
          <Link to={`/write/${post.slug}`} className="btn btn-ghost">
            Edit post
          </Link>
          <Link to={getPostPath(post)} className="btn btn-ghost" state={{ adminTab: 'analytics' }}>
            Preview
          </Link>
          {confirmingDelete ? (
            <span className="delete-confirm">
              <button type="button" className="btn btn-danger" onClick={() => onDelete(post.slug)}>
                Confirm delete
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button type="button" className="btn btn-danger" onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
