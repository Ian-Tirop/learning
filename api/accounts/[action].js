// Consolidates signup/login/logout/session/my-posts into one function file
// — Vercel's Hobby plan caps a deployment at 12 Serverless Functions, and
// five separate tiny endpoints here was what pushed the project over that
// limit. A dynamic [action].js keeps the exact same URL paths
// (/api/accounts/signup, /login, /logout, /session, /my-posts) so no
// frontend change was needed — only the routing underneath changed.
import crypto from 'node:crypto'
import {
  createAccount,
  accountExistsWithEmail,
  getAccountByEmailForLogin,
  getAccountById,
  getAccountByIdForAuth,
  updateAccountProfile,
  updateAccountPassword,
  setPasswordResetToken,
  getAccountByResetToken,
  getPostsForAccount,
  getLikedPostsForAccount,
  getSavedPostsForAccount,
  toggleFollow,
  getFollowedAccounts,
  updateAccountAvatar,
} from '../_lib/db.js'
import {
  hashPassword,
  verifyPassword,
  createReaderSessionToken,
  buildReaderSessionCookie,
  buildClearReaderCookie,
  getReaderAccountId,
  isAdminRequest,
} from '../_lib/auth.js'
import { sendPasswordResetEmail, getSiteUrl } from '../_lib/email.js'
import { uploadImageFromDataUrl } from '../_lib/upload.js'
import { withErrorHandling } from '../_lib/http.js'

async function handleSignup(req, res) {
  const body = req.body || {}
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''

  if (!displayName) {
    res.status(400).json({ error: 'Your name is required.' })
    return
  }
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'A valid email is required.' })
    return
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Your password must be at least 8 characters.' })
    return
  }

  if (await accountExistsWithEmail(email)) {
    res.status(409).json({ error: 'An account with that email already exists — try logging in instead.' })
    return
  }

  const account = await createAccount({
    id: crypto.randomUUID(),
    email,
    passwordHash: hashPassword(password),
    displayName,
  })

  res.setHeader('Set-Cookie', buildReaderSessionCookie(createReaderSessionToken(account.id), req))
  res.status(201).json({ account })
}

async function handleLogin(req, res) {
  const body = req.body || {}
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  const row = await getAccountByEmailForLogin(email)
  if (!row || !verifyPassword(password, row.password_hash)) {
    res.status(401).json({ error: 'Incorrect email or password.' })
    return
  }

  res.setHeader('Set-Cookie', buildReaderSessionCookie(createReaderSessionToken(row.id), req))
  res.status(200).json({
    account: { id: row.id, email: row.email, displayName: row.display_name, createdAt: row.created_at },
  })
}

function handleLogout(req, res) {
  res.setHeader('Set-Cookie', buildClearReaderCookie(req))
  res.status(200).json({ ok: true })
}

async function handleSession(req, res) {
  const accountId = getReaderAccountId(req)
  if (!accountId) {
    res.status(200).json({ account: null })
    return
  }
  const account = await getAccountById(accountId)
  res.status(200).json({ account })
}

async function handleMyPosts(req, res) {
  const accountId = getReaderAccountId(req)
  if (!accountId) {
    res.status(401).json({ error: 'Sign in to see your submissions.' })
    return
  }
  const posts = await getPostsForAccount(accountId)
  res.status(200).json({ posts })
}

async function handleLikedPosts(req, res) {
  const accountId = getReaderAccountId(req)
  if (!accountId) {
    res.status(401).json({ error: 'Sign in to see your liked articles.' })
    return
  }
  const posts = await getLikedPostsForAccount(accountId)
  res.status(200).json({ posts })
}

async function handleSavedPosts(req, res) {
  const accountId = getReaderAccountId(req)
  if (!accountId) {
    res.status(401).json({ error: 'Sign in to see your saved articles.' })
    return
  }
  const posts = await getSavedPostsForAccount(accountId)
  res.status(200).json({ posts })
}

async function handleFollowToggle(req, res) {
  const accountId = getReaderAccountId(req)
  if (!accountId) {
    res.status(401).json({ error: 'Sign in to follow a writer.' })
    return
  }

  const writerId = typeof req.body?.writerId === 'string' ? req.body.writerId : ''
  if (!writerId) {
    res.status(400).json({ error: 'A writerId is required.' })
    return
  }
  if (writerId === accountId) {
    res.status(400).json({ error: "You can't follow yourself." })
    return
  }

  const result = await toggleFollow(accountId, writerId)
  res.status(200).json(result)
}

async function handleFollowing(req, res) {
  const accountId = getReaderAccountId(req)
  if (!accountId) {
    res.status(401).json({ error: 'Sign in to see who you follow.' })
    return
  }
  const accounts = await getFollowedAccounts(accountId)
  res.status(200).json({ accounts })
}

async function handleUpdateProfile(req, res) {
  const accountId = getReaderAccountId(req)
  if (!accountId) {
    res.status(401).json({ error: 'Sign in to update your profile.' })
    return
  }

  const body = req.body || {}
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : ''

  if (!displayName) {
    res.status(400).json({ error: 'Your name is required.' })
    return
  }
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'A valid email is required.' })
    return
  }

  const existing = await getAccountByEmailForLogin(email)
  if (existing && existing.id !== accountId) {
    res.status(409).json({ error: 'Another account already uses that email.' })
    return
  }

  const account = await updateAccountProfile(accountId, { displayName, email, nickname })
  res.status(200).json({ account })
}

async function handleUploadAvatar(req, res) {
  const accountId = getReaderAccountId(req)
  if (!accountId) {
    res.status(401).json({ error: 'Sign in to upload an avatar.' })
    return
  }
  const url = await uploadImageFromDataUrl(req.body?.image, `avatars/${accountId}`)
  const account = await updateAccountAvatar(accountId, url)
  res.status(200).json({ account })
}

// Shared by both the reader-facing Submit page and the admin editor for
// post cover art and inline body images — an exception to this file's
// usual reader-only scope, made here (rather than as its own function)
// purely because Vercel's Hobby plan caps a project at 12 serverless
// functions and this project is already at that limit.
async function handleUploadImage(req, res) {
  const accountId = getReaderAccountId(req)
  const admin = isAdminRequest(req)
  if (!accountId && !admin) {
    res.status(401).json({ error: 'Sign in to upload an image.' })
    return
  }
  const url = await uploadImageFromDataUrl(req.body?.image, `posts/${accountId || 'admin'}`)
  res.status(200).json({ url })
}

async function handleChangePassword(req, res) {
  const accountId = getReaderAccountId(req)
  if (!accountId) {
    res.status(401).json({ error: 'Sign in to change your password.' })
    return
  }

  const body = req.body || {}
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'Your new password must be at least 8 characters.' })
    return
  }

  const row = await getAccountByIdForAuth(accountId)
  if (!row || !verifyPassword(currentPassword, row.password_hash)) {
    res.status(401).json({ error: 'Your current password is incorrect.' })
    return
  }

  await updateAccountPassword(accountId, hashPassword(newPassword))
  res.status(200).json({ ok: true })
}

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000 // 30 minutes

async function handleForgotPassword(req, res) {
  const body = req.body || {}
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  // Always respond the same way whether or not the email exists — avoids
  // leaking which addresses have an account here.
  if (email) {
    const row = await getAccountByEmailForLogin(email)
    if (row) {
      const token = crypto.randomUUID()
      const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS)
      await setPasswordResetToken(email, token, expires)
      const resetUrl = `${getSiteUrl()}/account/reset-password?email=${encodeURIComponent(email)}&token=${token}`
      await sendPasswordResetEmail(email, resetUrl)
    }
  }

  res.status(200).json({ ok: true })
}

async function handleResetPassword(req, res) {
  const body = req.body || {}
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const token = typeof body.token === 'string' ? body.token : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'Your new password must be at least 8 characters.' })
    return
  }

  const account = await getAccountByResetToken(email, token)
  if (!account) {
    res.status(400).json({ error: 'That reset link is invalid or has expired.' })
    return
  }

  await updateAccountPassword(account.id, hashPassword(newPassword))
  res.status(200).json({ ok: true })
}

async function handler(req, res) {
  const action = req.query?.action

  if (action === 'signup' && req.method === 'POST') return handleSignup(req, res)
  if (action === 'login' && req.method === 'POST') return handleLogin(req, res)
  if (action === 'logout' && req.method === 'POST') return handleLogout(req, res)
  if (action === 'session' && req.method === 'GET') return handleSession(req, res)
  if (action === 'my-posts' && req.method === 'GET') return handleMyPosts(req, res)
  if (action === 'liked-posts' && req.method === 'GET') return handleLikedPosts(req, res)
  if (action === 'saved-posts' && req.method === 'GET') return handleSavedPosts(req, res)
  if (action === 'follow-toggle' && req.method === 'POST') return handleFollowToggle(req, res)
  if (action === 'following' && req.method === 'GET') return handleFollowing(req, res)
  if (action === 'update-profile' && req.method === 'POST') return handleUpdateProfile(req, res)
  if (action === 'upload-avatar' && req.method === 'POST') return handleUploadAvatar(req, res)
  if (action === 'upload-image' && req.method === 'POST') return handleUploadImage(req, res)
  if (action === 'change-password' && req.method === 'POST') return handleChangePassword(req, res)
  if (action === 'forgot-password' && req.method === 'POST') return handleForgotPassword(req, res)
  if (action === 'reset-password' && req.method === 'POST') return handleResetPassword(req, res)

  res.status(404).json({ error: 'Not found.' })
}

export default withErrorHandling(handler)
