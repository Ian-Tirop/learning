import { useState } from 'react'
import { formatRelativeDate } from '../lib/formatRelativeDate'
import { useToast } from '../context/ToastContext'
import './CommentSection.css'

function ReplyForm({ account, onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedName = account ? account.displayName : name.trim()
    const trimmedText = text.trim()

    if (!trimmedName || !trimmedText) {
      setError('Add your name and a reply before posting.')
      return
    }

    onSubmit(trimmedName, trimmedText)
    setName('')
    setText('')
    setError('')
  }

  return (
    <form className="reply-form" onSubmit={handleSubmit}>
      {account ? (
        <p className="commenting-as">
          Replying as <strong>{account.displayName}</strong>
        </p>
      ) : (
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label="Your name"
        />
      )}
      <textarea
        placeholder="Write a reply..."
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-label="Your reply"
        rows={2}
      />
      {error && (
        <p className="comment-error" role="alert">
          {error}
        </p>
      )}
      <div className="reply-form-actions">
        <button type="submit" className="btn btn-primary">
          Post reply
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function EditForm({ initialText, onSave, onCancel }) {
  const [text, setText] = useState(initialText)
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) {
      setError('A comment cannot be empty.')
      return
    }
    onSave(trimmed)
  }

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-label="Edit your comment"
        rows={3}
        autoFocus
      />
      {error && (
        <p className="comment-error" role="alert">
          {error}
        </p>
      )}
      <div className="reply-form-actions">
        <button type="submit" className="btn btn-primary">
          Save
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '🎉', '😮', '👎']

function CommentReactions({ entry, onToggle }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const summary = entry.reactionSummary || []

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setPickerOpen(false)
  }

  return (
    <div className="comment-reactions" onBlur={handleBlur}>
      {summary.map(({ emoji, count, mine }) => (
        <button
          key={emoji}
          type="button"
          className={`emoji-reaction-btn${mine ? ' active' : ''}`}
          onClick={() => onToggle(emoji)}
          aria-pressed={mine}
          aria-label={`React with ${emoji} (${count})`}
        >
          <span aria-hidden="true">{emoji}</span>
          {count}
        </button>
      ))}

      <div className="emoji-picker-wrap">
        <button
          type="button"
          className="emoji-add-btn"
          onClick={() => setPickerOpen((open) => !open)}
          aria-label="Add a reaction"
          aria-expanded={pickerOpen}
        >
          <span aria-hidden="true">+</span>
        </button>
        {pickerOpen && (
          <div className="emoji-picker" role="menu">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="menuitem"
                onClick={() => {
                  onToggle(emoji)
                  setPickerOpen(false)
                }}
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CommentEntry({
  account,
  entry,
  isReply,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  isConfirmingDelete,
  onDeleteClick,
  onCancelDelete,
  onConfirmDelete,
  onToggleReaction,
  onReport,
  isReplyOpen,
  onToggleReply,
  onCancelReply,
  onSubmitReply,
}) {
  return (
    <div className="comment">
      <div className={`comment-avatar${isReply ? ' small' : ''}`} aria-hidden="true">
        {entry.name.trim().charAt(0).toUpperCase()}
      </div>
      <div className="comment-body">
        <div className="comment-meta">
          <span className="comment-name">{entry.name}</span>
          {!entry.accountId && (
            <span className="guest-badge" title="Posted without a reader account — this name isn't verified">
              Guest
            </span>
          )}
          <span className="comment-date">
            {formatRelativeDate(entry.date)}
            {entry.editedAt ? ' · edited' : ''}
          </span>
        </div>

        {entry.mentionOf && <span className="comment-mention">@{entry.mentionOf}</span>}

        {isEditing ? (
          <EditForm initialText={entry.text} onSave={onSaveEdit} onCancel={onCancelEdit} />
        ) : (
          <>
            <p className="comment-text">{entry.text}</p>

            <div className="comment-actions">
              <CommentReactions entry={entry} onToggle={onToggleReaction} />
              <button type="button" className="comment-action-btn" onClick={onToggleReply}>
                Reply
              </button>
              {!entry.isOwn && (
                <button
                  type="button"
                  className="comment-action-btn"
                  onClick={onReport}
                  aria-pressed={entry.reported}
                >
                  {entry.reported ? 'Reported' : 'Report'}
                </button>
              )}
              {entry.isOwn && (
                <>
                  <button type="button" className="comment-action-btn" onClick={onStartEdit}>
                    Edit
                  </button>
                  {isConfirmingDelete ? (
                    <span className="delete-confirm">
                      <button
                        type="button"
                        className="comment-action-btn danger"
                        onClick={onConfirmDelete}
                      >
                        Confirm delete
                      </button>
                      <button type="button" className="comment-action-btn" onClick={onCancelDelete}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="comment-action-btn danger"
                      onClick={onDeleteClick}
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {isReplyOpen && <ReplyForm account={account} onSubmit={onSubmitReply} onCancel={onCancelReply} />}
      </div>
    </div>
  )
}

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'liked', label: 'Most liked' },
]

function sortComments(comments, sortKey) {
  const sorted = [...comments]
  if (sortKey === 'oldest') return sorted.sort((a, b) => new Date(a.date) - new Date(b.date))
  if (sortKey === 'liked') {
    return sorted.sort(
      (a, b) =>
        (b.reactionSummary || []).reduce((sum, r) => sum + r.count, 0) -
        (a.reactionSummary || []).reduce((sum, r) => sum + r.count, 0),
    )
  }
  return sorted.sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function CommentSection({
  account,
  comments,
  addComment,
  editComment,
  deleteComment,
  addReply,
  editReply,
  deleteReply,
  toggleReaction,
  reportComment,
}) {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null)
  const [sortKey, setSortKey] = useState('newest')
  const showToast = useToast()

  const totalCount = comments.reduce((sum, comment) => sum + 1 + comment.replies.length, 0)
  const sortedComments = sortComments(comments, sortKey)

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedName = account ? account.displayName : name.trim()
    const trimmedText = text.trim()

    if (!trimmedName || !trimmedText) {
      setError('Add your name and a comment before posting.')
      return
    }

    addComment(trimmedName, trimmedText)
    setName('')
    setText('')
    setError('')
    showToast('Comment posted!', { type: 'success' })
  }

  return (
    <section className="comments">
      <div className="comments-header">
        <h2>
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#comment-icon"></use>
          </svg>
          {totalCount} {totalCount === 1 ? 'Comment' : 'Comments'}
        </h2>

        {comments.length > 1 && (
          <div className="comment-sort" role="group" aria-label="Sort comments">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`comment-sort-btn${sortKey === option.key ? ' active' : ''}`}
                onClick={() => setSortKey(option.key)}
                aria-pressed={sortKey === option.key}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <form className="comment-form" onSubmit={handleSubmit}>
        {account ? (
          <p className="commenting-as">
            Commenting as <strong>{account.displayName}</strong>
          </p>
        ) : (
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label="Your name"
          />
        )}
        <textarea
          placeholder="Add to the discussion..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label="Your comment"
          rows={3}
        />
        {error && (
          <p className="comment-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary">
          Post comment
        </button>
      </form>

      <ul className="comment-list">
        {sortedComments.map((comment) => (
          <li key={comment.id} className="comment-thread">
            <CommentEntry
              account={account}
              entry={comment}
              isReply={false}
              isEditing={editingId === comment.id}
              onStartEdit={() => setEditingId(comment.id)}
              onSaveEdit={(newText) => {
                editComment(comment.id, newText)
                setEditingId(null)
              }}
              onCancelEdit={() => setEditingId(null)}
              isConfirmingDelete={confirmingDeleteId === comment.id}
              onDeleteClick={() => setConfirmingDeleteId(comment.id)}
              onCancelDelete={() => setConfirmingDeleteId(null)}
              onConfirmDelete={() => {
                deleteComment(comment.id)
                setConfirmingDeleteId(null)
              }}
              onToggleReaction={(type) => toggleReaction(comment.id, type)}
              onReport={() => reportComment(comment.id)}
              isReplyOpen={replyingTo === comment.id}
              onToggleReply={() =>
                setReplyingTo((current) => (current === comment.id ? null : comment.id))
              }
              onCancelReply={() => setReplyingTo(null)}
              onSubmitReply={(replyName, replyText) => {
                addReply(comment.id, replyName, replyText)
                setReplyingTo(null)
              }}
            />

            {comment.replies.length > 0 && (
              <ul className="reply-list">
                {comment.replies.map((reply) => (
                  <li key={reply.id}>
                    <CommentEntry
                      account={account}
                      entry={reply}
                      isReply
                      isEditing={editingId === reply.id}
                      onStartEdit={() => setEditingId(reply.id)}
                      onSaveEdit={(newText) => {
                        editReply(comment.id, reply.id, newText)
                        setEditingId(null)
                      }}
                      onCancelEdit={() => setEditingId(null)}
                      isConfirmingDelete={confirmingDeleteId === reply.id}
                      onDeleteClick={() => setConfirmingDeleteId(reply.id)}
                      onCancelDelete={() => setConfirmingDeleteId(null)}
                      onConfirmDelete={() => {
                        deleteReply(comment.id, reply.id)
                        setConfirmingDeleteId(null)
                      }}
                      onToggleReaction={(type) => toggleReaction(reply.id, type)}
                      onReport={() => reportComment(reply.id)}
                      isReplyOpen={replyingTo === reply.id}
                      onToggleReply={() =>
                        setReplyingTo((current) => (current === reply.id ? null : reply.id))
                      }
                      onCancelReply={() => setReplyingTo(null)}
                      onSubmitReply={(replyName, replyText) => {
                        addReply(comment.id, replyName, replyText, reply.name)
                        setReplyingTo(null)
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
