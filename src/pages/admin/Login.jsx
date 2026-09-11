import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'
import { PasswordField } from '../../components/PasswordField'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import '../write/Write.css'
import './Login.css'

export function Login() {
  useDocumentTitle('Admin login — Ian Tirop')
  useMetaRobots()
  const { isAdmin, loading, login, verifyTwoFactor } = useAdmin()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [pendingToken, setPendingToken] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAdmin) {
    return <Navigate to="/write" replace />
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const data = await login(password)
      if (data.needsTwoFactor) {
        setPendingToken(data.pendingToken)
      } else {
        navigate('/write')
      }
    } catch (err) {
      setError(err.message || 'Incorrect password.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCodeSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await verifyTwoFactor(pendingToken, code.trim())
      navigate('/write')
    } catch (err) {
      setError(err.message || 'Incorrect code.')
    } finally {
      setSubmitting(false)
    }
  }

  if (pendingToken) {
    return (
      <section className="container login-page">
        <div className="section-heading">
          <p className="eyebrow">Admin</p>
          <h1>Enter your code</h1>
          <p className="login-intro">From your authenticator app, or a backup code.</p>
        </div>

        <form className="login-form" onSubmit={handleCodeSubmit}>
          <label className="field">
            <span>Code</span>
            <input
              type="text"
              inputMode="text"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoFocus
            />
          </label>
          {error && (
            <p className="comment-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Verifying…' : 'Verify'}
          </button>
        </form>
      </section>
    )
  }

  return (
    <section className="container login-page">
      <div className="section-heading">
        <p className="eyebrow">Admin</p>
        <h1>Log in</h1>
        <p className="login-intro">Only Ian can publish or edit posts directly.</p>
      </div>

      <form className="login-form" onSubmit={handlePasswordSubmit}>
        <PasswordField
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
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
    </section>
  )
}
