import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/apiClient'
import { getVisitorId } from '../lib/visitorId'

function decorate(comment, visitorId) {
  const reactionSummary = Object.entries(comment.reactions || {})
    .map(([emoji, visitorIds]) => ({ emoji, count: visitorIds.length, mine: visitorIds.includes(visitorId) }))
    .filter((entry) => entry.count > 0)

  return {
    ...comment,
    date: comment.createdAt,
    isOwn: comment.visitorId === visitorId,
    reactionSummary,
  }
}

function buildTree(comments, visitorId) {
  const decorated = comments.map((comment) => decorate(comment, visitorId))
  const roots = decorated.filter((comment) => !comment.parentId)
  const repliesByParent = {}
  for (const comment of decorated) {
    if (!comment.parentId) continue
    if (!repliesByParent[comment.parentId]) repliesByParent[comment.parentId] = []
    repliesByParent[comment.parentId].push(comment)
  }
  return roots
    .map((root) => ({ ...root, replies: repliesByParent[root.id] || [] }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function usePostEngagement(post) {
  const visitorId = getVisitorId()
  const slug = post?.slug
  const [myReaction, setMyReaction] = useState(null)
  const [myRating, setMyRating] = useState(null)
  const [saved, setSaved] = useState(false)
  const [rawComments, setRawComments] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!slug) return
    try {
      const [reactionData, commentsData] = await Promise.all([
        api.get(`/api/post-reactions/${encodeURIComponent(slug)}?visitorId=${encodeURIComponent(visitorId)}`),
        api.get(`/api/comments?slug=${encodeURIComponent(slug)}`),
      ])
      setMyReaction(reactionData.reaction)
      setMyRating(reactionData.rating)
      setSaved(Boolean(reactionData.saved))
      setRawComments(commentsData.comments)
    } catch {
      // Post not yet published/reachable, or the API isn't available — the
      // page renders with zero engagement rather than crashing.
    } finally {
      setLoading(false)
    }
  }, [slug, visitorId])

  useEffect(() => {
    load()
  }, [load])

  const likes = (post?.seed?.likes || 0) + (myReaction === 'like' ? 1 : 0)
  const dislikes = (post?.seed?.dislikes || 0) + (myReaction === 'dislike' ? 1 : 0)
  const ratingSum = (post?.seed?.ratingSum || 0) + (myRating || 0)
  const ratingCount = (post?.seed?.ratingCount || 0) + (myRating ? 1 : 0)
  const average = ratingCount > 0 ? ratingSum / ratingCount : 0

  const postReaction = async (payload) => {
    const data = await api.post(`/api/post-reactions/${encodeURIComponent(slug)}`, { visitorId, ...payload })
    setMyReaction(data.reaction)
    setMyRating(data.rating)
    setSaved(Boolean(data.saved))
    return data
  }

  const toggleLike = () => postReaction({ reaction: myReaction === 'like' ? null : 'like' })
  const toggleDislike = () => postReaction({ reaction: myReaction === 'dislike' ? null : 'dislike' })
  const rate = (value) => postReaction({ rating: myRating === value ? null : value })
  // Throws (e.g. "Sign in to save articles.") if the reader isn't signed
  // into an account — saving needs a durable identity, unlike like/dislike.
  const toggleSave = () => postReaction({ saved: !saved })

  const addComment = async (name, text) => {
    const data = await api.post('/api/comments', { postSlug: slug, name, text, visitorId })
    setRawComments((prev) => [...prev, data.comment])
  }

  const editComment = async (id, text) => {
    const data = await api.patch(`/api/comments/${id}`, { visitorId, text })
    setRawComments((prev) => prev.map((comment) => (comment.id === id ? data.comment : comment)))
  }

  const deleteCommentById = async (id) => {
    await api.delete(`/api/comments/${id}?visitorId=${encodeURIComponent(visitorId)}`)
    setRawComments((prev) => prev.filter((comment) => comment.id !== id && comment.parentId !== id))
  }

  const addReply = async (topCommentId, name, text, mentionOf) => {
    const data = await api.post('/api/comments', {
      postSlug: slug,
      parentId: topCommentId,
      name,
      text,
      mentionOf: mentionOf || undefined,
      visitorId,
    })
    setRawComments((prev) => [...prev, data.comment])
  }

  const [reportedIds, setReportedIds] = useState(new Set())

  const reportComment = async (commentId) => {
    const data = await api.post(`/api/comment-reactions/${commentId}`, { visitorId, report: true })
    setReportedIds((prev) => {
      const next = new Set(prev)
      if (data.reported) next.add(commentId)
      else next.delete(commentId)
      return next
    })
  }

  const toggleReaction = async (commentId, emoji) => {
    const data = await api.post(`/api/comment-reactions/${commentId}`, { visitorId, emoji })
    setRawComments((prev) =>
      prev.map((comment) => {
        if (comment.id !== commentId) return comment
        const reactions = { ...comment.reactions }
        const ids = new Set(reactions[emoji] || [])
        if (data.active) ids.add(visitorId)
        else ids.delete(visitorId)
        reactions[emoji] = [...ids]
        return { ...comment, reactions }
      }),
    )
  }

  return {
    reaction: myReaction,
    likes,
    dislikes,
    toggleLike,
    toggleDislike,
    saved,
    toggleSave,
    average,
    ratingCount,
    userRating: myRating,
    rate,
    comments: buildTree(rawComments, visitorId).map((comment) => ({
      ...comment,
      reported: reportedIds.has(comment.id),
      replies: comment.replies.map((reply) => ({ ...reply, reported: reportedIds.has(reply.id) })),
    })),
    reportComment,
    loading,
    addComment,
    editComment,
    deleteComment: deleteCommentById,
    addReply,
    editReply: (topCommentId, replyId, text) => editComment(replyId, text),
    deleteReply: (topCommentId, replyId) => deleteCommentById(replyId),
    toggleReaction,
  }
}
