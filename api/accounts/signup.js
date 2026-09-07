import crypto from 'node:crypto'
import { createAccount, accountExistsWithEmail } from '../_lib/db.js'
import { hashPassword, createReaderSessionToken, buildReaderSessionCookie } from '../_lib/auth.js'
import { withErrorHandling } from '../_lib/http.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

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

export default withErrorHandling(handler)
