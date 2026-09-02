import { updateComment, deleteComment } from '../_lib/db.js'

const MAX_COMMENT_LENGTH = 2000

export default async function handler(req, res) {
  const id = req.query?.id
  if (!id) {
    res.status(400).json({ error: 'An id is required.' })
    return
  }

  if (req.method === 'PATCH') {
    const { visitorId, text } = req.body || {}
    const trimmedText = typeof text === 'string' ? text.trim().slice(0, MAX_COMMENT_LENGTH) : ''
    if (!visitorId || !trimmedText) {
      res.status(400).json({ error: 'A visitorId and non-empty text are required.' })
      return
    }

    const updated = await updateComment(id, visitorId, trimmedText)
    if (!updated) {
      res.status(403).json({ error: "Couldn't update that comment — it may not be yours." })
      return
    }
    res.status(200).json({ comment: updated })
    return
  }

  if (req.method === 'DELETE') {
    const visitorId = req.query?.visitorId || req.body?.visitorId
    if (!visitorId) {
      res.status(400).json({ error: 'A visitorId is required.' })
      return
    }
    const deleted = await deleteComment(id, visitorId)
    if (!deleted) {
      res.status(403).json({ error: "Couldn't delete that comment — it may not be yours." })
      return
    }
    res.status(204).end()
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
