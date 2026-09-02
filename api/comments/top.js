import { getTopComments } from '../_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const limit = Number(req.query?.limit) || 3
  const comments = await getTopComments(Math.min(limit, 10))
  res.status(200).json({ comments })
}
