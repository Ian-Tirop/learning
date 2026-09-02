import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import './Newsletter.css'

export function Newsletter() {
  const [subscribers, setSubscribers] = useLocalStorage('blog:subscribers', [])
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = email.trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('That email looks off — double-check it.')
      return
    }

    setSubscribers((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
    setEmail('')
    setError('')
    setSubscribed(true)
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
            You&apos;re on the list for this browser. Thanks for reading.
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
            <button type="submit" className="btn btn-primary">
              Subscribe
            </button>
          </form>
        )}
        {error && (
          <p className="newsletter-error" role="alert">
            {error}
          </p>
        )}
        {subscribers.length > 0 && !subscribed && (
          <p className="newsletter-count">
            Already subscribed on this browser ({subscribers.length}{' '}
            {subscribers.length === 1 ? 'address' : 'addresses'}).
          </p>
        )}
      </div>
    </section>
  )
}
