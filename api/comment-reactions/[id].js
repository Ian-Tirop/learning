import { toggleCommentReaction, toggleCommentReport } from '../_lib/db.js'
import { withErrorHandling } from '../_lib/http.js'

const ALLOWED_EMOJI = new Set(['👍', '❤️', '😂', '🎉', '😮', '👎'])

async function handler(req, res) {
  const id = req.query?.id
  if (!id) {
    res.status(400).json({ error: 'An id is required.' })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { visitorId, emoji, report } = req.body || {}
  if (!visitorId || typeof visitorId !== 'string') {
    res.status(400).json({ error: 'A visitorId is required.' })
    return
  }

  if (report !== undefined) {
    const active = await toggleCommentReport(id, visitorId)
    res.status(200).json({ reported: active })
    return
  }

  if (!ALLOWED_EMOJI.has(emoji)) {
    res.status(400).json({ error: 'Unsupported emoji.' })
    return
  }

  const active = await toggleCommentReaction(id, visitorId, emoji)
  res.status(200).json({ active })
}

export default withErrorHandling(handler)
