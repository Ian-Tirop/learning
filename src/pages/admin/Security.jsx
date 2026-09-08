import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'
import { useToast } from '../../context/ToastContext'
import {
  getTwoFactorStatus,
  startTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  getRecoveryEmail,
  setRecoveryEmail,
} from '../../data/adminStore'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import '../write/Write.css'
import './Login.css'
import './Security.css'

function SetupFlow({ onEnabled }) {
  const showToast = useToast()
  const [step, setStep] = useState('start') // start | scan | codes
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleStart = async () => {
    setSaving(true)
    setError('')
    try {
      const data = await startTwoFactorSetup()
      setQrDataUrl(data.qrDataUrl)
      setSecret(data.secret)
      setStep('scan')
    } catch (err) {
      setError(err.message || 'Could not start setup.')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirm = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await confirmTwoFactorSetup(code.trim())
      setBackupCodes(data.backupCodes)
      setStep('codes')
    } catch (err) {
      setError(err.message || 'Incorrect code.')
    } finally {
      setSaving(false)
    }
  }

  if (step === 'start') {
    return (
      <div className="security-card">
        <p className="write-intro">
          Two-factor authentication is currently <strong>off</strong>. Turning it on requires an
          authenticator app (Google Authenticator, 1Password, Authy...).
        </p>
        {error && (
          <p className="comment-error" role="alert">
            {error}
          </p>
        )}
        <button type="button" className="btn btn-primary" disabled={saving} onClick={handleStart}>
          {saving ? 'Starting…' : 'Set up two-factor authentication'}
        </button>
      </div>
    )
  }

  if (step === 'scan') {
    return (
      <div className="security-card">
        <p className="write-intro">Scan this with your authenticator app, then enter the 6-digit code it shows.</p>
        {qrDataUrl && <img src={qrDataUrl} alt="Two-factor setup QR code" className="security-qr" />}
        <p className="body-hint">
          Can&apos;t scan it? Enter this key manually: <code>{secret}</code>
        </p>
        <form className="login-form" onSubmit={handleConfirm}>
          <label className="field">
            <span>6-digit code</span>
            <input
              type="text"
              inputMode="numeric"
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
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Confirming…' : 'Confirm and turn on'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="security-card">
      <p className="form-success">Two-factor authentication is on.</p>
      <p className="write-intro">
        Save these backup codes somewhere safe — each works once, and they&apos;re the only way back
        in if you lose your authenticator app. They won&apos;t be shown again.
      </p>
      <ul className="security-backup-codes">
        {backupCodes.map((backupCode) => (
          <li key={backupCode}>{backupCode}</li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          showToast('Two-factor authentication is on', { type: 'success' })
          onEnabled()
        }}
      >
        I&apos;ve saved these codes
      </button>
    </div>
  )
}

function DisableFlow({ onDisabled }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await disableTwoFactor(code.trim())
      onDisabled()
    } catch (err) {
      setError(err.message || 'Incorrect code.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="security-card">
      <p className="write-intro">
        Two-factor authentication is currently <strong>on</strong>.
      </p>
      <form className="login-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Enter a code to turn it off</span>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="6-digit code or a backup code"
            autoFocus
          />
        </label>
        {error && (
          <p className="comment-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-ghost" disabled={saving}>
          {saving ? 'Turning off…' : 'Turn off two-factor authentication'}
        </button>
      </form>
    </div>
  )
}

function RecoveryEmailForm({ currentEmail, onSaved }) {
  const showToast = useToast()
  const [email, setEmail] = useState(currentEmail || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await setRecoveryEmail(email.trim())
      showToast('Recovery email saved', { type: 'success' })
      onSaved(email.trim())
    } catch (err) {
      setError(err.message || 'Could not save that.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="security-card">
      <p className="write-intro">
        A recovery email gets a heads-up whenever two-factor authentication is turned on or off on
        your admin login — useful if that ever happens without you.
      </p>
      <form className="login-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Recovery email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        {error && (
          <p className="comment-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-ghost" disabled={saving}>
          {saving ? 'Saving…' : 'Save recovery email'}
        </button>
      </form>
    </div>
  )
}

export function Security() {
  useDocumentTitle('Security — Ian Tirop')
  useMetaRobots()
  const { isAdmin, loading: authLoading } = useAdmin()

  const [enabled, setEnabled] = useState(null)
  const [recoveryEmail, setRecoveryEmailState] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    setLoading(true)
    Promise.all([
      getTwoFactorStatus().then((data) => data.enabled),
      getRecoveryEmail().then((data) => data.email),
    ])
      .then(([twoFactorEnabled, email]) => {
        setEnabled(twoFactorEnabled)
        setRecoveryEmailState(email)
      })
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isAdmin) refresh()
  }, [isAdmin])

  if (!authLoading && !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <section className="container write-page">
      <div className="write-header">
        <div>
          <p className="eyebrow">Write</p>
          <h1>Security</h1>
          <p className="write-intro">
            Two-factor authentication for your admin login.{' '}
            {recoveryEmail
              ? `Security alerts go to ${recoveryEmail}.`
              : "Lost your authenticator app and your backup codes? Ask me (Claude) to clear it directly from the database — that's the fallback recovery path with no recovery email set."}
          </p>
        </div>
      </div>

      {loading && <p className="loading-note">Loading…</p>}
      {!loading && (
        <RecoveryEmailForm currentEmail={recoveryEmail} onSaved={setRecoveryEmailState} />
      )}
      {!loading && enabled === false && <SetupFlow onEnabled={refresh} />}
      {!loading && enabled === true && <DisableFlow onDisabled={refresh} />}
    </section>
  )
}
