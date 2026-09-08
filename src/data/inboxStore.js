// Newsletter subscribe + Contact-page reader feedback — both real and
// shared now (not localStorage-only). See api/inbox/[action].js.
import { api } from '../lib/apiClient'

export async function subscribe(email) {
  return api.post('/api/inbox/subscribe', { email })
}

export async function sendFeedback(payload) {
  return api.post('/api/inbox/feedback', payload)
}
