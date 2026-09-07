import { getReaderAccountId } from '../_lib/auth.js'
import { getAccountById } from '../_lib/db.js'
import { withErrorHandling } from '../_lib/http.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const accountId = getReaderAccountId(req)
  if (!accountId) {
    res.status(200).json({ account: null })
    return
  }
  const account = await getAccountById(accountId)
  res.status(200).json({ account })
}

export default withErrorHandling(handler)
