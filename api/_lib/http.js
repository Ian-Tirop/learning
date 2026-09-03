// Wraps a handler so any unexpected throw (a DB connection failure, a bad
// query, anything) becomes a clean JSON 500 instead of Vercel's generic
// FUNCTION_INVOCATION_FAILED page — the frontend's apiClient already knows
// how to show a graceful error for that shape of response.
export function withErrorHandling(handler) {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (error) {
      console.error(`${req.method} ${req.url} failed:`, error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Something went wrong on the server.' })
      }
    }
  }
}
