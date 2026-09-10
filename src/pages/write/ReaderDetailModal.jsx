import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getReaderDetail,
  forceReaderPasswordReset,
  contactReader,
  warnReader,
  deleteReaderAccount,
} from '../../data/adminStore'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/formatDate'
import './ReaderDetailModal.css'

const STATUS_LABEL = { draft: 'Draft', published: 'Published', pending: 'Pending review', rejected: 'Rejected', scheduled: 'Scheduled' }

// The "View" button on a reader account (Analytics tab -> Reader accounts)
// opens this. Everything here goes through admin-only, accountId-scoped
// actions in api/admin/[action].js — distinct from the reader's own
// self-service endpoints in api/accounts/[action].js.
export function ReaderDetailModal({ accountId, onClose, onDeleted }) {
  const showToast = useToast()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePanel, setActivePanel] = useState(null) // null | 'contact' | 'warn' | 'delete'
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [warnNote, setWarnNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    getReaderDetail(accountId)
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch((err) => {
        if (cancelled) return
        showToast(err.message || 'Could not load that account.', { type: 'error' })
        onClose()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId])

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const togglePanel = (panel) => setActivePanel((current) => (current === panel ? null : panel))

  const handleForceReset = async () => {
    setBusy(true)
    try {
      const { emailSent } = await forceReaderPasswordReset(accountId)
      showToast(
        emailSent ? 'Password reset email sent.' : 'Reset link created — email is not configured, so none was sent.',
        { type: 'success' },
      )
    } catch (err) {
      showToast(err.message || 'Could not do that right now.', { type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const handleContact = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      const { emailSent } = await contactReader(accountId, contactSubject.trim(), contactMessage.trim())
      showToast(emailSent ? 'Message sent.' : 'Saved — email is not configured, so nothing was sent.', {
        type: 'success',
      })
      setActivePanel(null)
      setContactSubject('')
      setContactMessage('')
    } catch (err) {
      showToast(err.message || 'Could not send that right now.', { type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const handleWarn = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      const { warning } = await warnReader(accountId, warnNote.trim())
      setDetail((current) => ({ ...current, warnings: [warning, ...current.warnings] }))
      showToast('Warning issued and saved to this account.', { type: 'success' })
      setActivePanel(null)
      setWarnNote('')
    } catch (err) {
      showToast(err.message || 'Could not send that right now.', { type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    try {
      await deleteReaderAccount(accountId)
      showToast('Account deleted.')
      onDeleted?.(accountId)
      onClose()
    } catch (err) {
      showToast(err.message || 'Could not delete that account.', { type: 'error' })
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card reader-detail-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Reader account details"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#close-icon"></use>
          </svg>
        </button>

        {loading && <p className="loading-note">Loading…</p>}

        {detail && (
          <>
            <div className="reader-detail-header">
              <h2>{detail.account.displayName}</h2>
              <p className="write-intro">
                {detail.account.email} · Joined {formatDate(detail.account.createdAt)}
              </p>
            </div>

            <div className="reader-detail-actions">
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={handleForceReset}>
                Force password reset
              </button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => togglePanel('contact')}>
                Contact
              </button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => togglePanel('warn')}>
                Send warning
              </button>
              <button type="button" className="btn btn-danger" disabled={busy} onClick={() => togglePanel('delete')}>
                Delete account
              </button>
            </div>

            {activePanel === 'contact' && (
              <form className="write-form reader-detail-panel" onSubmit={handleContact}>
                <label className="field">
                  <span>Subject</span>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(event) => setContactSubject(event.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>Message</span>
                  <textarea
                    rows={4}
                    value={contactMessage}
                    onChange={(event) => setContactMessage(event.target.value)}
                    required
                  />
                </label>
                <div className="write-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    Send email
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setActivePanel(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {activePanel === 'warn' && (
              <form className="write-form reader-detail-panel" onSubmit={handleWarn}>
                <label className="field">
                  <span>Warning note</span>
                  <textarea
                    rows={3}
                    value={warnNote}
                    onChange={(event) => setWarnNote(event.target.value)}
                    placeholder="What should this reader know?"
                    required
                  />
                </label>
                <p className="body-hint">This is saved permanently on the account and emailed to the reader.</p>
                <div className="write-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    Send warning
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setActivePanel(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {activePanel === 'delete' && (
              <div className="reader-detail-panel">
                <p className="comment-error">
                  This permanently deletes the account. Their posts and comments stay (just unattributed), but
                  saved posts and follows are removed. This can&apos;t be undone.
                </p>
                <div className="write-form-actions">
                  <button type="button" className="btn btn-danger" disabled={busy} onClick={handleDelete}>
                    Confirm delete
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setActivePanel(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="reader-detail-section">
              <h3>Posts ({detail.posts.length})</h3>
              {detail.posts.length === 0 ? (
                <p className="write-intro">No posts submitted.</p>
              ) : (
                <ul className="analytics-list analytics-detail-list">
                  {detail.posts.map((post) => (
                    <li key={post.slug}>
                      <div>
                        <Link to={`/write/${post.slug}`}>{post.title}</Link>
                        <span className={`status-badge ${post.status}`}>{STATUS_LABEL[post.status]}</span>
                      </div>
                      <span>{formatDate(post.date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="reader-detail-section">
              <h3>Comments ({detail.comments.length})</h3>
              {detail.comments.length === 0 ? (
                <p className="write-intro">No comments left.</p>
              ) : (
                <ul className="analytics-list recent-comments-list">
                  {detail.comments.map((comment) => (
                    <li key={comment.id}>
                      <div>
                        <Link to={`/blog/${comment.postSlug}`}>{comment.postTitle}</Link>
                        <p>{comment.text}</p>
                      </div>
                      <span>{formatDate(comment.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="reader-detail-section">
              <h3>Warning history ({detail.warnings.length})</h3>
              {detail.warnings.length === 0 ? (
                <p className="write-intro">No warnings issued.</p>
              ) : (
                <ul className="analytics-list recent-comments-list">
                  {detail.warnings.map((warning) => (
                    <li key={warning.id}>
                      <div>
                        <p>{warning.note}</p>
                      </div>
                      <span>{formatDate(warning.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
