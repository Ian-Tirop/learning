// Sends the "new post" notification to every subscriber when a post is
// published for the first time. Uses Resend's HTTP API directly (a plain
// fetch — no SDK dependency, consistent with the rest of this project).
//
// Gracefully does nothing if RESEND_API_KEY or RESEND_FROM_EMAIL isn't
// set, exactly like the chat widget hides itself without ANTHROPIC_API_KEY
// — a missing key degrades to "no email sent" rather than a crash.
import crypto from 'node:crypto'

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set')
  return secret
}

// Lets an unsubscribe link identify + authorize itself without an account
// system — anyone with this token for this exact email can unsubscribe it,
// nobody else's.
export function makeUnsubscribeToken(email) {
  return crypto.createHmac('sha256', getSecret()).update(email.toLowerCase()).digest('hex')
}

export function verifyUnsubscribeToken(email, token) {
  if (!token || typeof token !== 'string') return false
  const expected = makeUnsubscribeToken(email)
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)
}

export function getSiteUrl() {
  return (process.env.SITE_URL || 'https://learning-peach-two.vercel.app').replace(/\/$/, '')
}

function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size))
  return chunks
}

// The single-recipient send used by every transactional email below
// (password reset, submission status, comment replies). Same graceful
// no-op as sendPublishNotification when Resend isn't configured.
async function sendEmail(to, subject, html) {
  if (!isConfigured()) return { sent: false }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to, subject, html }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    console.error(`Resend send to ${to} failed:`, response.status, body)
    return { sent: false }
  }
  return { sent: true }
}

export async function sendPasswordResetEmail(email, resetUrl) {
  return sendEmail(
    email,
    'Reset your password',
    `
      <p>Someone (hopefully you) requested a password reset for your account on
      ${getSiteUrl()}.</p>
      <p><a href="${resetUrl}">Choose a new password</a></p>
      <p style="font-size:12px;color:#666">This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
    `,
  )
}

export async function sendSubmissionStatusEmail(email, post, status, reviewNote) {
  const postUrl = `${getSiteUrl()}/blog/${post.slug}`
  const isApproved = status === 'published'
  return sendEmail(
    email,
    isApproved ? `Your post is live: ${post.title}` : `About your submission: ${post.title}`,
    isApproved
      ? `
        <p>Good news — Ian approved and published your post:</p>
        <h2><a href="${postUrl}">${post.title}</a></h2>
        <p><a href="${postUrl}">Read it live →</a></p>
      `
      : `
        <p>Ian reviewed your submission "<strong>${post.title}</strong>" and it wasn't approved this time.</p>
        ${reviewNote ? `<p><strong>Note:</strong> ${reviewNote}</p>` : ''}
        <p>You're welcome to revise and resubmit any time.</p>
      `,
  )
}

export async function sendCommentReplyNotification(email, { replierName, commentText, postTitle, postUrl }) {
  return sendEmail(
    email,
    `${replierName} replied to your comment`,
    `
      <p><strong>${replierName}</strong> replied to your comment on
      <a href="${postUrl}">${postTitle}</a>:</p>
      <blockquote style="margin:8px 0;padding-left:12px;border-left:3px solid #ccc;color:#444">${commentText}</blockquote>
      <p><a href="${postUrl}">View the conversation →</a></p>
    `,
  )
}

export async function sendPublishNotification(post, subscriberEmails) {
  if (!isConfigured() || subscriberEmails.length === 0) return { sent: false }

  const siteUrl = getSiteUrl()
  const postUrl = `${siteUrl}/blog/${post.slug}`

  // Individual emails (via Resend's batch endpoint — one HTTP call per
  // 100 subscribers, not per subscriber) rather than one BCC'd email, so
  // each recipient gets a real, working, personal unsubscribe link.
  const messages = subscriberEmails.map((email) => {
    const token = makeUnsubscribeToken(email)
    const unsubscribeUrl = `${siteUrl}/api/inbox/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
    return {
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: `New post: ${post.title}`,
      html: `
        <p>Ian just published a new post:</p>
        <h2><a href="${postUrl}">${post.title}</a></h2>
        <p>${post.excerpt}</p>
        <p><a href="${postUrl}">Read it →</a></p>
        <hr />
        <p style="font-size:12px;color:#666">
          You're getting this because you subscribed at ${siteUrl}.
          <a href="${unsubscribeUrl}">Unsubscribe</a>.
        </p>
      `,
    }
  })

  let anySent = false
  for (const batch of chunk(messages, 100)) {
    const response = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(batch),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error('Resend publish notification failed:', response.status, body)
      continue
    }
    anySent = true
  }

  return { sent: anySent }
}
