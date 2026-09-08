import { useState } from 'react'
import { subscribe } from '../data/inboxStore'
import './Newsletter.css'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = email.trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('That email looks off — double-check it.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await subscribe(trimmed)
      setEmail('')
      setSubscribed(true)
    } catch (err) {
      setError(err.message || 'Could not subscribe right now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="container newsletter">
      <div className="newsletter-card">
        <div>
          <p className="eyebrow">Stay updated</p>
          <h2>Get new posts in your inbox</h2>
          <p className="newsletter-sub">
            One email whenever something new goes up — no drip campaign, no spam.
          </p>
        </div>

        {subscribed ? (
          <p className="newsletter-thanks" role="status">
            You&apos;re on the list. Thanks for reading.
          </p>
        ) : (
          <form className="newsletter-form" onSubmit={handleSubmit} noValidate>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
            />
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
        {error && (
          <p className="newsletter-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  )
}
