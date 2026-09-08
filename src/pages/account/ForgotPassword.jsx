import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../data/accountStore'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import '../write/Write.css'
import '../admin/Login.css'
import './Account.css'

export function ForgotPassword() {
  useDocumentTitle('Reset your password — Ian Tirop')
  useMetaRobots()

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
    } catch {
      // Always show the same generic confirmation — see the endpoint's own
      // reasoning: never reveal whether an email has an account.
    } finally {
      setSubmitting(false)
      setSent(true)
    }
  }

  return (
    <section className="container login-page">
      <div className="section-heading">
        <p className="eyebrow">Account</p>
        <h1>Forgot your password?</h1>
        <p className="login-intro">Enter your email and we&apos;ll send you a reset link.</p>
      </div>

      {sent ? (
        <p className="form-success" style={{ textAlign: 'center', marginTop: 24 }}>
          If that email has an account, a reset link is on its way.
        </p>
      ) : (
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoFocus
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="login-switch">
        <Link to="/account/login">Back to login</Link>
      </p>
    </section>
  )
}
