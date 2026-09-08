// Newsletter subscribers + Contact-page reader feedback — both were
// localStorage-only, per-browser, before this pass. Consolidated into one
// dynamic-action file (rather than two separate ones) to stay within
// Vercel's Hobby-plan 12-Serverless-Function cap; this project is now at
// that cap, so any future new endpoint needs to fold into an existing
// [action].js rather than add a new file.
import crypto from 'node:crypto'
import {
  createSubscriber,
  deleteSubscriber,
  createFeedback,
} from '../_lib/db.js'
import { verifyUnsubscribeToken } from '../_lib/email.js'
import { withErrorHandling } from '../_lib/http.js'

function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

async function handleSubscribe(req, res) {
  const body = req.body || {}
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'That email looks off — double-check it.' })
    return
  }
  await createSubscriber(email)
  res.status(200).json({ ok: true })
}

// Reached from the unsubscribe link in the email itself — public, but
// token-gated so nobody can unsubscribe someone else's address.
async function handleUnsubscribe(req, res) {
  const email = typeof req.query?.email === 'string' ? req.query.email.trim().toLowerCase() : ''
  const token = typeof req.query?.token === 'string' ? req.query.token : ''

  res.setHeader('content-type', 'text/html; charset=utf-8')

  if (!email || !verifyUnsubscribeToken(email, token)) {
    res.status(403).send('<p>That unsubscribe link is invalid or expired.</p>')
    return
  }

  await deleteSubscriber(email)
  res.status(200).send('<p>You&rsquo;ve been unsubscribed. <a href="/">Return to the blog</a>.</p>')
}

async function handleFeedback(req, res) {
  const body = req.body || {}
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) {
    res.status(400).json({ error: 'Add a note before sending — even a line or two helps.' })
    return
  }

  await createFeedback({
    id: crypto.randomUUID(),
    name: typeof body.name === 'string' ? body.name.trim() || null : null,
    email: typeof body.email === 'string' ? body.email.trim() || null : null,
    interests: Array.isArray(body.interests) ? body.interests.map(String) : [],
    wantsToWrite: typeof body.wantsToWrite === 'string' ? body.wantsToWrite : null,
    writeNote: typeof body.writeNote === 'string' ? body.writeNote.trim() || null : null,
    message,
    postSlug: typeof body.postSlug === 'string' ? body.postSlug : null,
    postTitle: typeof body.postTitle === 'string' ? body.postTitle : null,
  })

  res.status(201).json({ ok: true })
}

async function handler(req, res) {
  const action = req.query?.action

  if (action === 'subscribe' && req.method === 'POST') return handleSubscribe(req, res)
  if (action === 'unsubscribe' && req.method === 'GET') return handleUnsubscribe(req, res)
  if (action === 'feedback' && req.method === 'POST') return handleFeedback(req, res)

  res.status(404).json({ error: 'Not found.' })
}

export default withErrorHandling(handler)
