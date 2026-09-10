// Consolidates login/logout/session/analytics/scheduling/2FA into one
// function file — Vercel's Hobby plan caps a deployment at 12 Serverless
// Functions, and having each tiny admin endpoint as its own file was part
// of what pushed the project over that limit. A dynamic [action].js keeps
// stable URL paths (/api/admin/login, /api/admin/logout, etc.) so the
// frontend only ever calls a path, never a file.
import crypto from 'node:crypto'
import QRCode from 'qrcode'
import {
  createSessionToken,
  buildSessionCookie,
  buildClearCookie,
  isAdminRequest,
  requireAdmin,
  safeEqual,
  hashPassword,
  verifyPassword,
  createPendingTwoFactorToken,
  verifyPendingTwoFactorToken,
} from '../_lib/auth.js'
import {
  getSiteAnalytics,
  publishDuePosts,
  getAllSubscriberEmails,
  markNewsletterSent,
  getAdminSetting,
  setAdminSetting,
  deleteAdminSetting,
  getAccountById,
  getPostsForAccount,
  getCommentsForAccount,
  deleteAccount,
  createAccountWarning,
  getAccountWarnings,
  setPasswordResetToken,
} from '../_lib/db.js'
import {
  sendPublishNotification,
  sendAdminSecurityAlert,
  sendPasswordResetEmail,
  sendAccountContactEmail,
  sendAccountWarningEmail,
  getSiteUrl,
} from '../_lib/email.js'
import { generateTotpSecret, otpauthUrl, verifyTotpCode } from '../_lib/totp.js'
import { uploadImageFromDataUrl } from '../_lib/upload.js'
import { withErrorHandling } from '../_lib/http.js'

async function isTwoFactorEnabled() {
  return (await getAdminSetting('totp_enabled')) === 'true'
}

// Checks a submitted code against either the live TOTP secret or one of
// the single-use backup codes — consumes the backup code if that's what
// matched, so it can't be reused.
async function verifyCodeOrBackup(code) {
  const secret = await getAdminSetting('totp_secret')
  if (secret && verifyTotpCode(secret, code)) return true

  const raw = await getAdminSetting('totp_backup_codes')
  const hashedCodes = raw ? JSON.parse(raw) : []
  const matchIndex = hashedCodes.findIndex((hash) => verifyPassword(code, hash))
  if (matchIndex === -1) return false

  hashedCodes.splice(matchIndex, 1)
  await setAdminSetting('totp_backup_codes', JSON.stringify(hashedCodes))
  return true
}

function generateBackupCodes(count = 8) {
  return Array.from({ length: count }, () => crypto.randomBytes(4).toString('hex').toUpperCase())
}

async function handler(req, res) {
  const action = req.query?.action

  if (action === 'session' && req.method === 'GET') {
    res.status(200).json({ isAdmin: isAdminRequest(req) })
    return
  }

  if (action === 'login' && req.method === 'POST') {
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
      res.status(500).json({ error: 'Admin login is not configured on the server yet.' })
      return
    }

    const { password } = req.body || {}
    if (typeof password !== 'string' || password.length === 0) {
      res.status(400).json({ error: 'Password is required.' })
      return
    }

    if (!safeEqual(password, adminPassword)) {
      res.status(401).json({ error: 'Incorrect password.' })
      return
    }

    if (await isTwoFactorEnabled()) {
      res.status(200).json({ needsTwoFactor: true, pendingToken: createPendingTwoFactorToken() })
      return
    }

    res.setHeader('Set-Cookie', buildSessionCookie(createSessionToken(), req))
    res.status(200).json({ ok: true })
    return
  }

  // Second step of login when 2FA is enabled — takes the pendingToken
  // from the login response plus a 6-digit code (or a backup code).
  if (action === 'verify-two-factor' && req.method === 'POST') {
    const { pendingToken, code } = req.body || {}
    if (!verifyPendingTwoFactorToken(pendingToken)) {
      res.status(401).json({ error: 'That login attempt expired — log in again.' })
      return
    }
    if (typeof code !== 'string' || !(await verifyCodeOrBackup(code.trim().toUpperCase()))) {
      res.status(401).json({ error: 'Incorrect code.' })
      return
    }

    res.setHeader('Set-Cookie', buildSessionCookie(createSessionToken(), req))
    res.status(200).json({ ok: true })
    return
  }

  if (action === 'logout' && req.method === 'POST') {
    res.setHeader('Set-Cookie', buildClearCookie(req))
    res.status(200).json({ ok: true })
    return
  }

  if (action === 'two-factor-status' && req.method === 'GET') {
    if (!requireAdmin(req, res)) return
    res.status(200).json({ enabled: await isTwoFactorEnabled() })
    return
  }

  // Generates a new secret and QR code but does NOT enable 2FA yet — it
  // only takes effect once confirmed with a real code from the app, so a
  // setup that's abandoned partway through never locks anyone out.
  if (action === 'two-factor-setup' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return
    const secret = generateTotpSecret()
    await setAdminSetting('totp_secret_pending', secret)
    const url = otpauthUrl(secret, 'admin')
    const qrDataUrl = await QRCode.toDataURL(url)
    res.status(200).json({ secret, qrDataUrl })
    return
  }

  if (action === 'two-factor-confirm' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return
    const { code } = req.body || {}
    const pendingSecret = await getAdminSetting('totp_secret_pending')
    if (!pendingSecret) {
      res.status(400).json({ error: 'Start setup again — nothing pending to confirm.' })
      return
    }
    if (typeof code !== 'string' || !verifyTotpCode(pendingSecret, code.trim())) {
      res.status(401).json({ error: 'Incorrect code — check the time on your phone and try again.' })
      return
    }

    const backupCodes = generateBackupCodes()
    await setAdminSetting('totp_secret', pendingSecret)
    await setAdminSetting('totp_enabled', 'true')
    await setAdminSetting('totp_backup_codes', JSON.stringify(backupCodes.map((c) => hashPassword(c))))
    await deleteAdminSetting('totp_secret_pending')

    const recoveryEmail = await getAdminSetting('admin_email')
    await sendAdminSecurityAlert(
      recoveryEmail,
      'Two-factor authentication turned on',
      'Two-factor authentication was just enabled on your admin login. If this wasn’t you, someone has access to your admin session — log in and check immediately.',
    )

    res.status(200).json({ ok: true, backupCodes })
    return
  }

  if (action === 'two-factor-disable' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return
    const { code } = req.body || {}
    if (typeof code !== 'string' || !(await verifyCodeOrBackup(code.trim().toUpperCase()))) {
      res.status(401).json({ error: 'Incorrect code.' })
      return
    }
    await deleteAdminSetting('totp_secret')
    await deleteAdminSetting('totp_enabled')
    await deleteAdminSetting('totp_backup_codes')
    await deleteAdminSetting('totp_secret_pending')

    const recoveryEmail = await getAdminSetting('admin_email')
    await sendAdminSecurityAlert(
      recoveryEmail,
      'Two-factor authentication turned off',
      'Two-factor authentication was just disabled on your admin login. If this wasn’t you, someone has access to your admin session — log in, re-enable it, and change your admin password.',
    )

    res.status(200).json({ ok: true })
    return
  }

  if (action === 'recovery-email' && req.method === 'GET') {
    if (!requireAdmin(req, res)) return
    res.status(200).json({ email: await getAdminSetting('admin_email') })
    return
  }

  if (action === 'recovery-email' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return
    const { email } = req.body || {}
    const trimmed = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!trimmed || !trimmed.includes('@')) {
      res.status(400).json({ error: 'A valid email is required.' })
      return
    }
    await setAdminSetting('admin_email', trimmed)
    res.status(200).json({ ok: true })
    return
  }

  if (action === 'avatar' && req.method === 'GET') {
    if (!requireAdmin(req, res)) return
    res.status(200).json({ avatarUrl: await getAdminSetting('admin_avatar_url') })
    return
  }

  if (action === 'avatar' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return
    const url = await uploadImageFromDataUrl(req.body?.image, 'avatars/admin')
    await setAdminSetting('admin_avatar_url', url)
    res.status(200).json({ avatarUrl: url })
    return
  }

  if (action === 'analytics' && req.method === 'GET') {
    if (!requireAdmin(req, res)) return
    const analytics = await getSiteAnalytics()
    res.status(200).json(analytics)
    return
  }

  // Invoked once daily by Vercel Cron (see vercel.json — Hobby plan caps
  // cron jobs at once/day, so a scheduled post can go live up to ~24h
  // after its target time). No admin session cookie arrives with a cron
  // request, so this checks a shared secret instead. Publishes any post
  // whose scheduled time has passed, and sends the same subscriber
  // notification a manual publish/approve would.
  if (action === 'cron-publish-scheduled' && req.method === 'GET') {
    const secret = process.env.CRON_SECRET
    if (secret && req.headers.authorization !== `Bearer ${secret}`) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const published = await publishDuePosts()
    if (published.length > 0) {
      const emails = await getAllSubscriberEmails()
      for (const post of published) {
        if (post.newsletterSent) continue
        const { sent } = await sendPublishNotification(post, emails)
        if (sent) await markNewsletterSent(post.slug)
      }
    }
    res.status(200).json({ published: published.length })
    return
  }

  // Everything below is the admin-facing reader-account management view —
  // "View" on a reader in the Analytics tab's accounts drill-down opens
  // this. All require admin auth and take the target reader's accountId,
  // as distinct from api/accounts/[action].js's self-service actions,
  // which only ever act on the caller's own session.

  if (action === 'reader-detail' && req.method === 'GET') {
    if (!requireAdmin(req, res)) return
    const accountId = req.query?.accountId
    if (!accountId) {
      res.status(400).json({ error: 'An accountId is required.' })
      return
    }
    const account = await getAccountById(accountId)
    if (!account) {
      res.status(404).json({ error: 'No account with that id.' })
      return
    }
    const [posts, comments, warnings] = await Promise.all([
      getPostsForAccount(accountId),
      getCommentsForAccount(accountId),
      getAccountWarnings(accountId),
    ])
    res.status(200).json({ account, posts, comments, warnings })
    return
  }

  if (action === 'reader-force-reset' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return
    const { accountId } = req.body || {}
    const account = accountId ? await getAccountById(accountId) : null
    if (!account) {
      res.status(404).json({ error: 'No account with that id.' })
      return
    }
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 30 * 60 * 1000)
    await setPasswordResetToken(account.email, token, expires)
    const resetUrl = `${getSiteUrl()}/account/reset-password?email=${encodeURIComponent(account.email)}&token=${token}`
    const { sent } = await sendPasswordResetEmail(account.email, resetUrl)
    res.status(200).json({ ok: true, emailSent: sent })
    return
  }

  if (action === 'reader-contact' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return
    const { accountId, subject, message } = req.body || {}
    const account = accountId ? await getAccountById(accountId) : null
    if (!account) {
      res.status(404).json({ error: 'No account with that id.' })
      return
    }
    const trimmedSubject = typeof subject === 'string' ? subject.trim() : ''
    const trimmedMessage = typeof message === 'string' ? message.trim() : ''
    if (!trimmedSubject || !trimmedMessage) {
      res.status(400).json({ error: 'A subject and message are both required.' })
      return
    }
    const { sent } = await sendAccountContactEmail(account.email, trimmedSubject, trimmedMessage)
    res.status(200).json({ ok: true, emailSent: sent })
    return
  }

  if (action === 'reader-warn' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return
    const { accountId, note } = req.body || {}
    const account = accountId ? await getAccountById(accountId) : null
    if (!account) {
      res.status(404).json({ error: 'No account with that id.' })
      return
    }
    const trimmedNote = typeof note === 'string' ? note.trim() : ''
    if (!trimmedNote) {
      res.status(400).json({ error: 'A note is required for a warning.' })
      return
    }
    const warning = await createAccountWarning(accountId, trimmedNote)
    const { sent } = await sendAccountWarningEmail(account.email, trimmedNote)
    res.status(201).json({ warning, emailSent: sent })
    return
  }

  if (action === 'reader-delete' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return
    const { accountId } = req.body || {}
    if (!accountId) {
      res.status(400).json({ error: 'An accountId is required.' })
      return
    }
    await deleteAccount(accountId)
    res.status(200).json({ ok: true })
    return
  }

  res.status(404).json({ error: 'Not found.' })
}

export default withErrorHandling(handler)
