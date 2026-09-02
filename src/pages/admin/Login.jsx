import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import '../write/Write.css'
import './Login.css'

export function Login() {
  useDocumentTitle('Admin login — Ian Tirop')
  useMetaRobots()
  const { isAdmin, loading, login } = useAdmin()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAdmin) {
    return <Navigate to="/write" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login(password)
      navigate('/write')
    } catch (err) {
      setError(err.message || 'Incorrect password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="container login-page">
      <div className="section-heading">
        <p className="eyebrow">Admin</p>
        <h1>Log in</h1>
        <p className="login-intro">Only Ian can publish or edit posts directly.</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
          />
        </label>
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
