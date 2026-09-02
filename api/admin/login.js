import { createSessionToken, buildSessionCookie, safeEqual } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

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

  res.setHeader('Set-Cookie', buildSessionCookie(createSessionToken(), req))
  res.status(200).json({ ok: true })
}
