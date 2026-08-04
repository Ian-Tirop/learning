import { useLocalStorage } from './useLocalStorage'

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function usePostEngagement(post) {
  const [reaction, setReaction] = useLocalStorage(`blog:reaction:${post.slug}`, null)
  const [userRating, setUserRating] = useLocalStorage(`blog:rating:${post.slug}`, null)
  const [userComments, setUserComments] = useLocalStorage(`blog:comments:${post.slug}`, [])
  // Flat map keyed by comment or reply id — one visitor reaction per entry, whichever kind it is.
  const [reactions, setReactions] = useLocalStorage(`blog:entryReactions:${post.slug}`, {})
  // Replies are always stored under their top-level comment's id, even when replying to
  // another reply (that reply's author name is kept as `mentionOf` instead of nesting deeper).
  const [userReplies, setUserReplies] = useLocalStorage(`blog:replies:${post.slug}`, {})

  const likes = post.seed.likes + (reaction === 'like' ? 1 : 0)
  const dislikes = post.seed.dislikes + (reaction === 'dislike' ? 1 : 0)

  const toggleLike = () => setReaction((r) => (r === 'like' ? null : 'like'))
  const toggleDislike = () => setReaction((r) => (r === 'dislike' ? null : 'dislike'))

  const ratingSum = post.seed.ratingSum + (userRating || 0)
  const ratingCount = post.seed.ratingCount + (userRating ? 1 : 0)
  const average = ratingCount > 0 ? ratingSum / ratingCount : 0

  const rate = (value) => setUserRating((prev) => (prev === value ? null : value))

  const toggleReaction = (id, type) => {
    setReactions((prev) => {
      const next = { ...prev }
      if (next[id] === type) {
        delete next[id]
      } else {
        next[id] = type
      }
      return next
    })
  }

  const addComment = (name, text) => {
    setUserComments((prev) => [
      { id: makeId(), name, text, date: today(), likes: 0, dislikes: 0 },
      ...prev,
    ])
  }

  const editComment = (id, text) => {
    setUserComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, text, editedAt: today() } : c)),
    )
  }

  const deleteComment = (id) => {
    setUserComments((prev) => prev.filter((c) => c.id !== id))
  }

  const addReply = (topCommentId, name, text, mentionOf) => {
    setUserReplies((prev) => ({
      ...prev,
      [topCommentId]: [
        ...(prev[topCommentId] || []),
        { id: makeId(), name, text, date: today(), likes: 0, dislikes: 0, mentionOf },
      ],
    }))
  }

  const editReply = (topCommentId, replyId, text) => {
    setUserReplies((prev) => ({
      ...prev,
      [topCommentId]: (prev[topCommentId] || []).map((r) =>
        r.id === replyId ? { ...r, text, editedAt: today() } : r,
      ),
    }))
  }

  const deleteReply = (topCommentId, replyId) => {
    setUserReplies((prev) => ({
      ...prev,
      [topCommentId]: (prev[topCommentId] || []).filter((r) => r.id !== replyId),
    }))
  }

  const decorate = (entry, isOwn) => {
    const entryReaction = reactions[entry.id] ?? null
    return {
      ...entry,
      likes: (entry.likes || 0) + (entryReaction === 'like' ? 1 : 0),
      dislikes: (entry.dislikes || 0) + (entryReaction === 'dislike' ? 1 : 0),
      reaction: entryReaction,
      isOwn,
    }
  }

  const buildReplies = (comment) => [
    ...(comment.replies || []).map((r) => decorate(r, false)),
    ...(userReplies[comment.id] || []).map((r) => decorate(r, true)),
  ]

  const comments = [
    ...userComments.map((c) => ({ ...decorate(c, true), replies: buildReplies(c) })),
    ...[...post.seed.comments].reverse().map((c) => ({ ...decorate(c, false), replies: buildReplies(c) })),
  ]

  return {
    reaction,
    likes,
    dislikes,
    toggleLike,
    toggleDislike,
    average,
    ratingCount,
    userRating,
    rate,
    comments,
    addComment,
    editComment,
    deleteComment,
    addReply,
    editReply,
    deleteReply,
    toggleReaction,
  }
}
