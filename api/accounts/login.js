import { getAccountByEmailForLogin } from '../_lib/db.js'
import { verifyPassword, createReaderSessionToken, buildReaderSessionCookie } from '../_lib/auth.js'
import { withErrorHandling } from '../_lib/http.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

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

export default withErrorHandling(handler)
