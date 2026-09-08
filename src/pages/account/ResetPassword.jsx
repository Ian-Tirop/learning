import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../data/accountStore'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import '../write/Write.css'
import '../admin/Login.css'
import './Account.css'

export function ResetPassword() {
  useDocumentTitle('Choose a new password — Ian Tirop')
  useMetaRobots()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  if (!email || !token) {
    return <Navigate to="/account/forgot-password" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await resetPassword({ email, token, newPassword })
      setDone(true)
      setTimeout(() => navigate('/account/login'), 2000)
    } catch (err) {
      setError(err.message || 'That reset link is invalid or has expired.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="container login-page">
      <div className="section-heading">
        <p className="eyebrow">Account</p>
        <h1>Choose a new password</h1>
      </div>

      {done ? (
        <p className="form-success" style={{ textAlign: 'center', marginTop: 24 }}>
          Password changed — taking you to login…
        </p>
      ) : (
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoFocus
            />
          </label>
          <label className="field">
            <span>Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          {error && (
            <p className="comment-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      )}

      <p className="login-switch">
        <Link to="/account/login">Back to login</Link>
      </p>
    </section>
  )
}
