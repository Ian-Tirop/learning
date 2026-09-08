// Site-wide analytics for the admin dashboard — real engagement/content
// numbers pulled from the database (no page-view tracking exists, so this
// never includes visits or traffic).
import { api } from '../lib/apiClient'

export async function getAnalytics() {
  return api.get('/api/admin/analytics')
}
