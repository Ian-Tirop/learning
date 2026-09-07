// Lets the frontend know whether the chat widget has anything to talk to,
// without exposing the key itself. Checked once on load so the widget can
// hide entirely rather than presenting a chat button that always fails.
// A flat filename, deliberately — api/chat.js already exists as a file, and
// a same-named api/chat/ directory alongside it is exactly the collision
// that silently broke routing elsewhere in this project (see api/posts and
// api/comments' history: a dynamic file + same-named directory both
// resolved, unpredictably, to whichever one the deployment picked).
export default async function handler(req, res) {
  res.status(200).json({ available: Boolean(process.env.ANTHROPIC_API_KEY) })
}
