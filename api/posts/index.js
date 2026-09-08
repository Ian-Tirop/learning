import {
  getPublishedPosts,
  getAllPostsForAdmin,
  createPost,
  getAccountById,
  getAllSubscriberEmails,
  markNewsletterSent,
} from '../_lib/db.js'
import { isAdminRequest, getReaderAccountId } from '../_lib/auth.js'
import { sendPublishNotification } from '../_lib/email.js'
import { withErrorHandling } from '../_lib/http.js'
import { slugify } from '../../src/lib/slugify.js'
import { estimateReadingTime } from '../../src/lib/estimateReadingTime.js'

function makeToken() {
  return crypto.randomUUID()
}

async function handler(req, res) {
  if (req.method === 'GET') {
    const admin = isAdminRequest(req)
    const wantsAll = req.query?.status === 'all'
    const visitorId = req.query?.visitorId || null
    const posts =
      wantsAll && admin ? await getAllPostsForAdmin(visitorId) : await getPublishedPosts(visitorId)
    // submittedByEmail is only ever meant for Ian's eyes in the review
    // queue — strip it from anything a public/non-admin request sees.
    if (!admin) {
      posts.forEach((post) => {
        delete post.submittedByEmail
      })
    }
    res.status(200).json({ posts })
    return
  }

  if (req.method === 'POST') {
    const admin = isAdminRequest(req)
    const body = req.body || {}

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const excerpt = typeof body.excerpt === 'string' ? body.excerpt.trim() : ''
    const content = Array.isArray(body.content) ? body.content : null

    if (!title || !excerpt || !content || content.length === 0) {
      res.status(400).json({ error: 'A title, excerpt, and body are required.' })
      return
    }

    const slug = slugify(typeof body.slug === 'string' && body.slug.trim() ? body.slug : title)
    if (!slug) {
      res.status(400).json({ error: 'Could not derive a URL slug from that title.' })
      return
    }

    const tags = Array.isArray(body.tags) ? body.tags.map((tag) => String(tag).toLowerCase().trim()).filter(Boolean) : []
    const readingTime = Number.isFinite(body.readingTime) ? body.readingTime : estimateReadingTime(content)

    const post = {
      slug,
      title,
      excerpt,
      content,
      tags,
      cover: body.cover || null,
      date: typeof body.date === 'string' && body.date ? body.date : new Date().toISOString().slice(0, 10),
      readingTime,
      link: body.link || null,
    }

    if (admin) {
      // Ian, writing directly: draft or publish immediately, his call.
      post.status = body.status === 'published' ? 'published' : 'draft'
    } else {
      // A reader's request to post: always goes to review, regardless of
      // what the client sends — never trust the client for this.
      const readerAccountId = getReaderAccountId(req)
      const account = readerAccountId ? await getAccountById(readerAccountId) : null

      let submittedByName
      let submittedByEmail
      if (account) {
        // Signed-in reader — use their verified identity, not whatever the
        // client happened to send, and remember which account owns this
        // post so they can track/edit it from any device (see /profile).
        submittedByName = account.displayName
        submittedByEmail = account.email
        post.authorAccountId = account.id
      } else {
        submittedByName = typeof body.submittedByName === 'string' ? body.submittedByName.trim() : ''
        submittedByEmail = typeof body.submittedByEmail === 'string' ? body.submittedByEmail.trim() : ''
        if (!submittedByName) {
          res.status(400).json({ error: 'Your name is required to submit a post for review.' })
          return
        }
      }
      post.status = 'pending'
      post.submittedByName = submittedByName
      post.submittedByEmail = submittedByEmail
      post.editToken = makeToken()
    }

    try {
      const created = await createPost(post)

      if (created.status === 'published' && !created.newsletterSent) {
        const emails = await getAllSubscriberEmails()
        const { sent } = await sendPublishNotification(created, emails)
        if (sent) await markNewsletterSent(created.slug)
      }

      res.status(201).json({
        post: created,
        editToken: admin ? undefined : post.editToken,
      })
    } catch (error) {
      if (String(error?.message || '').includes('duplicate key')) {
        res.status(409).json({ error: `The URL "/blog/${slug}" is already taken — try a different title or slug.` })
        return
      }
      console.error('Create post error:', error)
      res.status(500).json({ error: 'Could not save that post right now.' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

export default withErrorHandling(handler)
