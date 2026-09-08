import { useState } from 'react'
import { sendFeedback } from '../data/inboxStore'
import { useToast } from '../context/ToastContext'
import './SuggestEdit.css'

export function SuggestEdit({ postSlug, postTitle }) {
  const showToast = useToast()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) {
      setError('Add a note about what should change.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await sendFeedback({ message: trimmed, postSlug, postTitle })
      setOpen(false)
      setMessage('')
      showToast('Thanks — sent to Ian.', { type: 'success' })
    } catch (err) {
      setError(err.message || 'Could not send that right now.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button type="button" className="suggest-edit-toggle" onClick={() => setOpen(true)}>
        Spot an error? Suggest an edit
      </button>
    )
  }

  return (
    <form className="suggest-edit-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>What should change on &quot;{postTitle}&quot;?</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder="A typo, a broken link, an outdated detail..."
          autoFocus
        />
      </label>
      {error && (
        <p className="comment-error" role="alert">
          {error}
        </p>
      )}
      <div className="suggest-edit-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Sending…' : 'Send suggestion'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  )
}
