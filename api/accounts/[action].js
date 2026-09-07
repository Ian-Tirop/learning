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
  getPostsForAccount,
  getLikedPostsForAccount,
  getSavedPostsForAccount,
} from '../_lib/db.js'
import {
  hashPassword,
  verifyPassword,
  createReaderSessionToken,
  buildReaderSessionCookie,
  buildClearReaderCookie,
  getReaderAccountId,
} from '../_lib/auth.js'
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

async function handleUpdateProfile(req, res) {
  const accountId = getReaderAccountId(req)
  if (!accountId) {
    res.status(401).json({ error: 'Sign in to update your profile.' })
    return
  }

  const body = req.body || {}
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

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

  const account = await updateAccountProfile(accountId, { displayName, email })
  res.status(200).json({ account })
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

async function handler(req, res) {
  const action = req.query?.action

  if (action === 'signup' && req.method === 'POST') return handleSignup(req, res)
  if (action === 'login' && req.method === 'POST') return handleLogin(req, res)
  if (action === 'logout' && req.method === 'POST') return handleLogout(req, res)
  if (action === 'session' && req.method === 'GET') return handleSession(req, res)
  if (action === 'my-posts' && req.method === 'GET') return handleMyPosts(req, res)
  if (action === 'liked-posts' && req.method === 'GET') return handleLikedPosts(req, res)
  if (action === 'saved-posts' && req.method === 'GET') return handleSavedPosts(req, res)
  if (action === 'update-profile' && req.method === 'POST') return handleUpdateProfile(req, res)
  if (action === 'change-password' && req.method === 'POST') return handleChangePassword(req, res)

  res.status(404).json({ error: 'Not found.' })
}

export default withErrorHandling(handler)
