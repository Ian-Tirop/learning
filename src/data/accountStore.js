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
