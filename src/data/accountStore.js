// Optional reader accounts — a thin client for /api/accounts/*. Entirely
// separate from the single admin login; see AccountContext for the
// provider that wraps this in React state.
import { api } from '../lib/apiClient'

export async function signup({ email, password, displayName }) {
  const data = await api.post('/api/accounts/signup', { email, password, displayName })
  return data.account
}

export async function login({ email, password }) {
  const data = await api.post('/api/accounts/login', { email, password })
  return data.account
}

export async function logout() {
  await api.post('/api/accounts/logout', {})
}

export async function getAccountSession() {
  const data = await api.get('/api/accounts/session')
  return data.account
}

/** All posts (any status) submitted by the signed-in reader's account. */
export async function getMyPosts() {
  const data = await api.get('/api/accounts/my-posts')
  return data.posts
}

/** Published posts the signed-in reader's account has liked, any author. */
export async function getLikedPosts() {
  const data = await api.get('/api/accounts/liked-posts')
  return data.posts
}

/** Published posts the signed-in reader's account has bookmarked. */
export async function getSavedPosts() {
  const data = await api.get('/api/accounts/saved-posts')
  return data.posts
}

/** Follows/unfollows a writer (by account id), returning the new state. */
export async function toggleFollow(writerId) {
  return api.post('/api/accounts/follow-toggle', { writerId })
}

/** Every writer the signed-in reader's account currently follows. */
export async function getFollowing() {
  const data = await api.get('/api/accounts/following')
  return data.accounts
}

export async function updateProfile({ displayName, email }) {
  const data = await api.post('/api/accounts/update-profile', { displayName, email })
  return data.account
}

export async function changePassword({ currentPassword, newPassword }) {
  await api.post('/api/accounts/change-password', { currentPassword, newPassword })
}

export async function requestPasswordReset(email) {
  await api.post('/api/accounts/forgot-password', { email })
}

export async function resetPassword({ email, token, newPassword }) {
  await api.post('/api/accounts/reset-password', { email, token, newPassword })
}
