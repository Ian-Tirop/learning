// Consolidates login/logout/session into one function file — Vercel's
// Hobby plan caps a deployment at 12 Serverless Functions, and having each
// tiny admin endpoint as its own file was part of what pushed the project
// over that limit. A dynamic [action].js keeps the exact same URL paths
// (/api/admin/login, /api/admin/logout, /api/admin/session) so no frontend
// change was needed — only the routing underneath changed.
import { createSessionToken, buildSessionCookie, buildClearCookie, isAdminRequest, safeEqual } from '../_lib/auth.js'
import { withErrorHandling } from '../_lib/http.js'

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

    res.setHeader('Set-Cookie', buildSessionCookie(createSessionToken(), req))
    res.status(200).json({ ok: true })
    return
  }

  if (action === 'logout' && req.method === 'POST') {
    res.setHeader('Set-Cookie', buildClearCookie(req))
    res.status(200).json({ ok: true })
    return
  }

  res.status(404).json({ error: 'Not found.' })
}

export default withErrorHandling(handler)
