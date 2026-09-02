// A random id persisted per-browser, purely to let a visitor recognize
// their own comments/reactions (edit/delete their own, toggle their own
// reactions) without requiring a real account. Not an auth mechanism.
const KEY = 'blog:visitorId'

export function getVisitorId() {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}
