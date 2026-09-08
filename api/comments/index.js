import {
  getCommentsForPost,
  getReactionsForComments,
  createComment,
  getPostBySlug,
  getCommentById,
  getAccountById,
} from '../_lib/db.js'
import { getReaderAccountId } from '../_lib/auth.js'
import { sendCommentReplyNotification, getSiteUrl } from '../_lib/email.js'
import { withErrorHandling } from '../_lib/http.js'

const MAX_COMMENT_LENGTH = 2000
const MAX_NAME_LENGTH = 80

function groupReactions(reactions) {
  const byComment = {}
  for (const row of reactions) {
    if (!byComment[row.comment_id]) byComment[row.comment_id] = {}
    if (!byComment[row.comment_id][row.emoji]) byComment[row.comment_id][row.emoji] = []
    byComment[row.comment_id][row.emoji].push(row.visitor_id)
  }
  return byComment
}

async function handler(req, res) {
  if (req.method === 'GET') {
    const slug = req.query?.slug
    if (!slug) {
      res.status(400).json({ error: 'A slug is required.' })
      return
    }

    const comments = await getCommentsForPost(slug)
    const reactions = await getReactionsForComments(comments.map((comment) => comment.id))
    const reactionsByComment = groupReactions(reactions)

    res.status(200).json({
      comments: comments.map((comment) => ({
        ...comment,
        reactions: reactionsByComment[comment.id] || {},
      })),
    })
    return
  }

  if (req.method === 'POST') {
    const { postSlug, parentId, name, text, visitorId, mentionOf } = req.body || {}

    if (!postSlug || typeof postSlug !== 'string') {
      res.status(400).json({ error: 'A postSlug is required.' })
      return
    }
    const trimmedName = typeof name === 'string' ? name.trim().slice(0, MAX_NAME_LENGTH) : ''
    const trimmedText = typeof text === 'string' ? text.trim().slice(0, MAX_COMMENT_LENGTH) : ''
    if (!trimmedName || !trimmedText) {
      res.status(400).json({ error: 'Add your name and a comment before posting.' })
      return
    }
    if (!visitorId || typeof visitorId !== 'string') {
      res.status(400).json({ error: 'A visitorId is required.' })
      return
    }

    const post = await getPostBySlug(postSlug)
    if (!post || post.status !== 'published') {
      res.status(404).json({ error: 'That post is not open for comments.' })
      return
    }

    const readerAccountId = getReaderAccountId(req)

    const comment = await createComment({
      id: crypto.randomUUID(),
      postSlug,
      parentId: parentId || null,
      name: trimmedName,
      text: trimmedText,
      mentionOf: typeof mentionOf === 'string' ? mentionOf.slice(0, MAX_NAME_LENGTH) : null,
      visitorId,
      accountId: readerAccountId,
    })

    // Notify whoever they're replying to, if that comment was posted by a
    // signed-in reader (anonymous comments have no email to notify) and
    // isn't the same person replying to themselves.
    if (comment.parentId) {
      const parent = await getCommentById(comment.parentId)
      if (parent?.accountId && parent.accountId !== readerAccountId) {
        const parentAccount = await getAccountById(parent.accountId)
        if (parentAccount) {
          await sendCommentReplyNotification(parentAccount.email, {
            replierName: trimmedName,
            commentText: trimmedText,
            postTitle: post.title,
            postUrl: `${getSiteUrl()}/blog/${post.slug}`,
          })
        }
      }
    }

    res.status(201).json({ comment: { ...comment, reactions: {} } })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

export default withErrorHandling(handler)
