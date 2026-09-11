import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAccount } from '../../context/AccountContext'
import { PasswordField } from '../../components/PasswordField'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import '../write/Write.css'
import '../admin/Login.css'
import './Account.css'

export function AccountLogin() {
  useDocumentTitle('Log in — Ian Tirop')
  useMetaRobots()
  const { account, loading, login } = useAccount()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && account) {
    return <Navigate to="/profile" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login({ email, password })
      navigate('/profile')
    } catch (err) {
      setError(err.message || 'Incorrect email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="container login-page">
      <div className="section-heading">
        <p className="eyebrow">Account</p>
        <h1>Log in</h1>
        <p className="login-intro">Track and edit the posts you&apos;ve submitted for review.</p>
      </div>

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
        <PasswordField
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
        {error && (
          <p className="comment-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="login-switch">
        <Link to="/account/forgot-password">Forgot your password?</Link>
      </p>
      <p className="login-switch">
        Don&apos;t have an account? <Link to="/account/signup">Create one</Link>
      </p>
    </section>
  )
}
