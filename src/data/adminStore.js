// Site-wide analytics for the admin dashboard — real engagement/content
// numbers pulled from the database (no page-view tracking exists, so this
// never includes visits or traffic).
import { api } from '../lib/apiClient'
import { fileToDataUrl } from '../lib/fileToDataUrl'

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

export async function getRecoveryEmail() {
  return api.get('/api/admin/recovery-email')
}

export async function setRecoveryEmail(email) {
  return api.post('/api/admin/recovery-email', { email })
}

/** Full admin-facing view of one reader account: their posts, comments, and warning history. */
export async function getReaderDetail(accountId) {
  return api.get(`/api/admin/reader-detail?accountId=${encodeURIComponent(accountId)}`)
}

/** Sends that reader a password-reset email, same flow as their own "forgot password". */
export async function forceReaderPasswordReset(accountId) {
  return api.post('/api/admin/reader-force-reset', { accountId })
}

/** A free-form email from Ian to this reader. */
export async function contactReader(accountId, subject, message) {
  return api.post('/api/admin/reader-contact', { accountId, subject, message })
}

/** Issues a warning: a permanent note on the account, plus an email to the reader. */
export async function warnReader(accountId, note) {
  return api.post('/api/admin/reader-warn', { accountId, note })
}

/** Permanently deletes a reader account. */
export async function deleteReaderAccount(accountId) {
  return api.post('/api/admin/reader-delete', { accountId })
}

export async function getAdminAvatar() {
  const data = await api.get('/api/admin/avatar')
  return data.avatarUrl
}

/** Uploads a new avatar image for the admin identity. */
export async function uploadAdminAvatar(file) {
  const image = await fileToDataUrl(file)
  const data = await api.post('/api/admin/avatar', { image })
  return data.avatarUrl
}
