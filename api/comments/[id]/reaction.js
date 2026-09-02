import { toggleCommentReaction } from '../../_lib/db.js'

const ALLOWED_EMOJI = new Set(['👍', '❤️', '😂', '🎉', '😮', '👎'])

export default async function handler(req, res) {
  const id = req.query?.id
  if (!id) {
    res.status(400).json({ error: 'An id is required.' })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { visitorId, emoji } = req.body || {}
  if (!visitorId || typeof visitorId !== 'string') {
    res.status(400).json({ error: 'A visitorId is required.' })
    return
  }
  if (!ALLOWED_EMOJI.has(emoji)) {
    res.status(400).json({ error: 'Unsupported emoji.' })
    return
  }

  const active = await toggleCommentReaction(id, visitorId, emoji)
  res.status(200).json({ active })
}
