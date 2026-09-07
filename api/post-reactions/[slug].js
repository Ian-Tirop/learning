import { upsertPostReaction, clearPostReactionField, getVisitorPostReaction } from '../_lib/db.js'
import { withErrorHandling } from '../_lib/http.js'

async function handler(req, res) {
  const slug = req.query?.slug
  if (!slug) {
    res.status(400).json({ error: 'A slug is required.' })
    return
  }

  if (req.method === 'GET') {
    const visitorId = req.query?.visitorId
    const current = await getVisitorPostReaction(slug, visitorId)
    res.status(200).json(current)
    return
  }

  if (req.method === 'POST') {
    const { visitorId, reaction, rating } = req.body || {}
    if (!visitorId || typeof visitorId !== 'string') {
      res.status(400).json({ error: 'A visitorId is required.' })
      return
    }

    if (reaction !== undefined) {
      if (reaction === null) {
        await clearPostReactionField(slug, visitorId, 'reaction')
      } else if (reaction === 'like' || reaction === 'dislike') {
        await upsertPostReaction(slug, visitorId, { reaction })
      } else {
        res.status(400).json({ error: 'reaction must be "like", "dislike", or null.' })
        return
      }
    }

    if (rating !== undefined) {
      if (rating === null) {
        await clearPostReactionField(slug, visitorId, 'rating')
      } else if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
        await upsertPostReaction(slug, visitorId, { rating })
      } else {
        res.status(400).json({ error: 'rating must be an integer 1-5, or null.' })
        return
      }
    }

    const current = await getVisitorPostReaction(slug, visitorId)
    res.status(200).json(current)
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

export default withErrorHandling(handler)
