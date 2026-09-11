import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAccount } from '../../context/AccountContext'
import { PasswordField } from '../../components/PasswordField'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import '../write/Write.css'
import '../admin/Login.css'
import './Account.css'

export function AccountSignup() {
  useDocumentTitle('Create an account — Ian Tirop')
  useMetaRobots()
  const { account, loading, signup } = useAccount()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && account) {
    return <Navigate to="/profile" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Your password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.')
      return
    }

    setSubmitting(true)
    try {
      await signup({ displayName, email, password })
      navigate('/profile')
    } catch (err) {
      setError(err.message || 'Could not create your account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="container login-page">
      <div className="section-heading">
        <p className="eyebrow">Account</p>
        <h1>Create an account</h1>
        <p className="login-intro">
          Optional — lets you track the status of your submissions and edit
          them from any device, even after Ian&apos;s reviewed one.
        </p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Your name</span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoFocus
          />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <PasswordField
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
        />
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(event) => setAgreedToTerms(event.target.checked)}
          />
          <span>
            I agree to the <Link to="/terms">Terms of Service</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </span>
        </label>
        {error && (
          <p className="comment-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="login-switch">
        Already have an account? <Link to="/account/login">Log in</Link>
      </p>
    </section>
  )
}
