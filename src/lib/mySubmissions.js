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

// Only forgets this browser's local tracking of the submission — it
// doesn't touch the actual post or its review status, so closing one here
// is safe even for a submission that's still pending.
export function removeMySubmission(slug) {
  const current = getMySubmissions()
  localStorage.setItem(KEY, JSON.stringify(current.filter((item) => item.slug !== slug)))
}
