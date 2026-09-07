import { getReaderAccountId } from '../_lib/auth.js'
import { getPostsForAccount } from '../_lib/db.js'
import { withErrorHandling } from '../_lib/http.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const accountId = getReaderAccountId(req)
  if (!accountId) {
    res.status(401).json({ error: 'Sign in to see your submissions.' })
    return
  }
  const posts = await getPostsForAccount(accountId)
  res.status(200).json({ posts })
}

export default withErrorHandling(handler)
