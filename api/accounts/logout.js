import { buildClearReaderCookie } from '../_lib/auth.js'
import { withErrorHandling } from '../_lib/http.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  res.setHeader('Set-Cookie', buildClearReaderCookie(req))
  res.status(200).json({ ok: true })
}

export default withErrorHandling(handler)
