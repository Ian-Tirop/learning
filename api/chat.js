// Vercel serverless function (Node runtime). Holds the Anthropic API key
// server-side — it must never be sent to or read from the browser. Set
// ANTHROPIC_API_KEY in the Vercel project's environment variables.
import { posts as staticPosts } from '../src/data/posts.js'
import { getPublishedPosts } from './_lib/db.js'

const SITE_NAME = 'Ian Tirop — Blog'
const MODEL = 'claude-haiku-4-5-20251001'
const MAX_HISTORY_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000
const MAX_REPLY_TOKENS = 512

async function getKnowledgePosts() {
  try {
    return await getPublishedPosts()
  } catch (error) {
    console.error('Chat: could not load posts from the database, falling back to static seed posts:', error)
    return staticPosts.filter((post) => post.status !== 'draft')
  }
}

async function buildSystemPrompt() {
  const published = await getKnowledgePosts()
  const postLines = published
    .map((post) => `- "${post.title}" (${post.date}, tags: ${post.tags.join(', ')}) — ${post.excerpt}`)
    .join('\n')

  return `You are the on-site assistant for ${SITE_NAME}, a personal blog written by Ian Tirop — a developer and UI/UX designer who writes about code, design, and the small, specific problems that come up building real interfaces.

Every post currently published on the blog:
${postLines}

Guidelines:
- Answer questions about Ian, the blog, and its posts using only the information above.
- When a post is relevant, mention it by title so the visitor can find it (posts live under /blog).
- If asked something this content doesn't cover, say so honestly instead of guessing or inventing details.
- For contact requests, point people to the Contact page (/contact) rather than stating an email or phone number yourself.
- Keep answers conversational and fairly short — a few sentences, not an essay.
- Stay on topic: you're a chat widget for a personal blog, not a general-purpose assistant. Politely decline unrelated requests (e.g. "I'm just here to help with questions about Ian's blog!").`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Chat is not configured on the server yet.' })
    return
  }

  const { messages } = req.body || {}

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'A "messages" array is required.' })
    return
  }

  const sanitized = messages
    .slice(-MAX_HISTORY_MESSAGES)
    .filter(
      (message) =>
        message &&
        typeof message.content === 'string' &&
        message.content.trim() &&
        (message.role === 'user' || message.role === 'assistant'),
    )
    .map((message) => ({ role: message.role, content: message.content.slice(0, MAX_MESSAGE_LENGTH) }))

  if (sanitized.length === 0) {
    res.status(400).json({ error: 'No valid messages provided.' })
    return
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_REPLY_TOKENS,
        system: await buildSystemPrompt(),
        messages: sanitized,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Anthropic API error:', response.status, errorText)
      res.status(502).json({ error: 'The assistant is having trouble responding right now.' })
      return
    }

    const data = await response.json()
    const reply = data.content?.[0]?.text

    if (!reply) {
      res.status(502).json({ error: "Sorry, I couldn't come up with a reply." })
      return
    }

    res.status(200).json({ reply })
  } catch (error) {
    console.error('Chat handler error:', error)
    res.status(500).json({ error: 'Something went wrong talking to the assistant.' })
  }
}
