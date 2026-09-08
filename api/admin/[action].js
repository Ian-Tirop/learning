// Consolidates login/logout/session into one function file — Vercel's
// Hobby plan caps a deployment at 12 Serverless Functions, and having each
// tiny admin endpoint as its own file was part of what pushed the project
// over that limit. A dynamic [action].js keeps the exact same URL paths
// (/api/admin/login, /api/admin/logout, /api/admin/session) so no frontend
// change was needed — only the routing underneath changed.
import {
  createSessionToken,
  buildSessionCookie,
  buildClearCookie,
  isAdminRequest,
  requireAdmin,
  safeEqual,
} from '../_lib/auth.js'
import { getSiteAnalytics, publishDuePosts, getAllSubscriberEmails, markNewsletterSent } from '../_lib/db.js'
import { sendPublishNotification } from '../_lib/email.js'
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

  if (action === 'analytics' && req.method === 'GET') {
    if (!requireAdmin(req, res)) return
    const analytics = await getSiteAnalytics()
    res.status(200).json(analytics)
    return
  }

  // Invoked by Vercel Cron (see vercel.json) — no admin session cookie
  // arrives with a cron request, so this checks a shared secret instead.
  // Publishes any post whose scheduled time has passed, and sends the
  // same subscriber notification a manual publish/approve would.
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

  res.status(404).json({ error: 'Not found.' })
}

export default withErrorHandling(handler)
