// Site-wide analytics for the admin dashboard — real engagement/content
// numbers pulled from the database (no page-view tracking exists, so this
// never includes visits or traffic).
import { api } from '../lib/apiClient'

export async function getAnalytics() {
  return api.get('/api/admin/analytics')
}

/** Admin-only: deletes any comment regardless of who posted it. */
export async function deleteCommentAsAdmin(id) {
  await api.delete(`/api/comments/${id}`)
}

export async function getTwoFactorStatus() {
  return api.get('/api/admin/two-factor-status')
}

/** Starts setup — returns { secret, qrDataUrl }. Not enabled until confirmed. */
export async function startTwoFactorSetup() {
  return api.post('/api/admin/two-factor-setup', {})
}

/** Confirms setup with a real code — returns { backupCodes } shown once. */
export async function confirmTwoFactorSetup(code) {
  return api.post('/api/admin/two-factor-confirm', { code })
}

export async function disableTwoFactor(code) {
  return api.post('/api/admin/two-factor-disable', { code })
}
