import {
  upsertPostReaction,
  clearPostReactionField,
  getVisitorPostReaction,
  setPostSaved,
  isPostSavedByAccount,
} from '../_lib/db.js'
import { getReaderAccountId } from '../_lib/auth.js'
import { withErrorHandling } from '../_lib/http.js'

async function handler(req, res) {
  const slug = req.query?.slug
  if (!slug) {
    res.status(400).json({ error: 'A slug is required.' })
    return
  }

  const accountId = getReaderAccountId(req)

  if (req.method === 'GET') {
    const visitorId = req.query?.visitorId
    const current = await getVisitorPostReaction(slug, visitorId)
    const saved = await isPostSavedByAccount(accountId, slug)
    res.status(200).json({ ...current, saved })
    return
  }

  if (req.method === 'POST') {
    const { visitorId, reaction, rating, saved } = req.body || {}
    if (!visitorId || typeof visitorId !== 'string') {
      res.status(400).json({ error: 'A visitorId is required.' })
      return
    }

    // Bookmarking needs a durable identity (an account), unlike
    // like/dislike/rating, which work for any anonymous visitor — check
    // this up front so a mixed request never partially applies.
    if (saved !== undefined && !accountId) {
      res.status(401).json({ error: 'Sign in to save articles.' })
      return
    }

    if (reaction !== undefined) {
      if (reaction === null) {
        await clearPostReactionField(slug, visitorId, 'reaction')
      } else if (reaction === 'like' || reaction === 'dislike') {
        await upsertPostReaction(slug, visitorId, { reaction, accountId })
      } else {
        res.status(400).json({ error: 'reaction must be "like", "dislike", or null.' })
        return
      }
    }

    if (rating !== undefined) {
      if (rating === null) {
        await clearPostReactionField(slug, visitorId, 'rating')
      } else if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
        await upsertPostReaction(slug, visitorId, { rating, accountId })
      } else {
        res.status(400).json({ error: 'rating must be an integer 1-5, or null.' })
        return
      }
    }

    if (saved !== undefined) {
      await setPostSaved(accountId, slug, Boolean(saved))
    }

    const current = await getVisitorPostReaction(slug, visitorId)
    const savedNow = await isPostSavedByAccount(accountId, slug)
    res.status(200).json({ ...current, saved: savedNow })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

export default withErrorHandling(handler)
