import {
  getPostBySlug,
  updatePostRow,
  deletePostRow,
  getAllSubscriberEmails,
  markNewsletterSent,
} from '../_lib/db.js'
import { isAdminRequest, requireAdmin, safeEqual, getReaderAccountId } from '../_lib/auth.js'
import { sendPublishNotification } from '../_lib/email.js'
import { withErrorHandling } from '../_lib/http.js'

async function handler(req, res) {
  const slug = req.query?.slug
  if (!slug) {
    res.status(400).json({ error: 'A slug is required.' })
    return
  }

  const admin = isAdminRequest(req)

  if (req.method === 'GET') {
    const post = await getPostBySlug(slug, req.query?.visitorId || null)
    if (!post) {
      res.status(404).json({ error: 'Not found.' })
      return
    }

    if (post.status === 'published' || admin) {
      // submittedByEmail is only ever meant for Ian's eyes in the review
      // queue — strip it from anything a public/non-admin request sees.
      if (!admin) delete post.submittedByEmail
      res.status(200).json({ post })
      return
    }

    // Not published, not admin — only visible to the person who submitted
    // it: either a signed-in reader account that owns it, or (for
    // anonymous submissions) the private edit token they were given.
    const readerAccountId = getReaderAccountId(req)
    if (readerAccountId && post.authorAccountId && readerAccountId === post.authorAccountId) {
      res.status(200).json({ post })
      return
    }

    const token = req.query?.token || req.body?.token
    if (token && post.editToken && safeEqual(token, post.editToken)) {
      res.status(200).json({ post })
      return
    }

    res.status(404).json({ error: 'Not found.' })
    return
  }

  if (req.method === 'PATCH') {
    const post = await getPostBySlug(slug)
    if (!post) {
      res.status(404).json({ error: 'Not found.' })
      return
    }

    const body = req.body || {}

    if (admin) {
      const fields = {}
      for (const key of ['title', 'excerpt', 'content', 'tags', 'cover', 'date', 'readingTime', 'link', 'reviewNote']) {
        if (body[key] !== undefined) fields[key] = body[key]
      }
      if (body.status && ['draft', 'published', 'pending', 'rejected'].includes(body.status)) {
        fields.status = body.status
      }
      const updated = await updatePostRow(slug, fields)

      // Only the first time a post goes live — an edit-then-republish
      // cycle (see the reader-edit branch below) never re-notifies.
      if (updated.status === 'published' && post.status !== 'published' && !updated.newsletterSent) {
        const emails = await getAllSubscriberEmails()
        const { sent } = await sendPublishNotification(updated, emails)
        if (sent) await markNewsletterSent(updated.slug)
      }

      res.status(200).json({ post: updated })
      return
    }

    // A reader editing their own submission — either a signed-in account
    // that owns it (any status, so an account can revise even a published
    // post), or an anonymous edit token (pending only, same as always —
    // the token is a lightweight capability, not a verified identity, so
    // it doesn't get the extra trust of editing after review).
    const readerAccountId = getReaderAccountId(req)
    const ownsViaAccount = Boolean(readerAccountId) && readerAccountId === post.authorAccountId
    const ownsViaToken =
      post.status === 'pending' && body.token && post.editToken && safeEqual(body.token, post.editToken)

    if (!ownsViaAccount && !ownsViaToken) {
      if (post.status !== 'pending') {
        res.status(403).json({
          error: 'This post has already been reviewed. Sign in to the account that submitted it to edit it further.',
        })
      } else {
        res.status(403).json({ error: 'Invalid edit link.' })
      }
      return
    }

    const fields = {}
    for (const key of ['title', 'excerpt', 'content', 'tags', 'cover', 'date', 'link']) {
      if (body[key] !== undefined) fields[key] = body[key]
    }
    // Any reader edit goes back through review — updating a live post is
    // still Ian's call to publish, exactly like the original submission.
    fields.status = 'pending'
    fields.reviewNote = null
    const updated = await updatePostRow(slug, fields)
    res.status(200).json({ post: updated })
    return
  }

  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return
    await deletePostRow(slug)
    res.status(204).end()
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

export default withErrorHandling(handler)
