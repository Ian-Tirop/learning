// Readers aren't logged in, so "their" pending submissions are tracked by a
// private edit token saved to this browser's localStorage when they submit.
// Anyone who has the token can view/edit that one submission — it's a
// capability, not a password, so don't treat it as strong auth.
const KEY = 'blog:mySubmissions'

export function getMySubmissions() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addMySubmission(slug, token, title) {
  const current = getMySubmissions()
  localStorage.setItem(KEY, JSON.stringify([{ slug, token, title }, ...current]))
}
