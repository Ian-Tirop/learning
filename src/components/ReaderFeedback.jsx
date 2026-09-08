import { useState } from 'react'
import { sendFeedback } from '../data/inboxStore'
import { posts } from '../data/posts'
import './ReaderFeedback.css'

const INTERESTS = [...new Set(posts.flatMap((post) => post.tags))].sort()

const WRITE_OPTIONS = [
  { value: 'yes', label: "Yes, I'd like to write a post" },
  { value: 'maybe', label: 'Maybe — tell me more' },
  { value: 'no', label: 'Not right now' },
]

const emptyForm = {
  name: '',
  email: '',
  interests: [],
  wantsToWrite: '',
  writeNote: '',
  message: '',
}

export function ReaderFeedback() {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState(false)

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((item) => item !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const message = form.message.trim()

    if (!message) {
      setError('Add a note before sending — even a line or two helps.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await sendFeedback({ ...form, name: form.name.trim(), message })
      setForm(emptyForm)
      setJustSubmitted(true)
      setTimeout(() => setJustSubmitted(false), 4000)
    } catch (err) {
      setError(err.message || 'Could not send that right now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="reader-feedback">
      <div className="section-heading">
        <p className="eyebrow">Reader input</p>
        <h2>Tell me what you&apos;re into</h2>
        <p className="reader-feedback-intro">
          What you&apos;d like to read more of, whether you&apos;d want to write a post
          yourself, and anything you think of the blog so far — it all shapes what
          goes up next.
        </p>
      </div>

      <form className="reader-feedback-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="form-field">
            <span>Name (optional)</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Your name"
            />
          </label>
          <label className="form-field">
            <span>Email (optional)</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="you@example.com"
            />
          </label>
        </div>

        <fieldset className="form-field">
          <legend>What are you interested in?</legend>
          <div className="interest-tags">
            {INTERESTS.map((interest) => {
              const active = form.interests.includes(interest)
              return (
                <button
                  type="button"
                  key={interest}
                  className={`interest-tag${active ? ' active' : ''}`}
                  aria-pressed={active}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="form-field">
          <legend>Interested in writing a post?</legend>
          <div className="write-options">
            {WRITE_OPTIONS.map((option) => (
              <label key={option.value} className="radio-option">
                <input
                  type="radio"
                  name="wantsToWrite"
                  value={option.value}
                  checked={form.wantsToWrite === option.value}
                  onChange={(event) => updateField('wantsToWrite', event.target.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
          {(form.wantsToWrite === 'yes' || form.wantsToWrite === 'maybe') && (
            <input
              type="text"
              className="write-note-input"
              value={form.writeNote}
              onChange={(event) => updateField('writeNote', event.target.value)}
              placeholder="What topic would you want to write about?"
              aria-label="What topic would you want to write about?"
            />
          )}
        </fieldset>

        <label className="form-field">
          <span>General review or feedback</span>
          <textarea
            rows={4}
            value={form.message}
            onChange={(event) => updateField('message', event.target.value)}
            placeholder="What's working, what's not, what you'd like to see more of..."
          />
        </label>

        {error && (
          <p className="reader-feedback-error" role="alert">
            {error}
          </p>
        )}

        <div className="reader-feedback-submit">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Sending…' : 'Send feedback'}
          </button>
          {justSubmitted && (
            <span className="reader-feedback-thanks" role="status">
              Thanks — got it!
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
