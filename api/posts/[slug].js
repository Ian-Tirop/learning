import { getPostBySlug, updatePostRow, deletePostRow } from '../_lib/db.js'
import { isAdminRequest, requireAdmin, safeEqual } from '../_lib/auth.js'

export default async function handler(req, res) {
  const slug = req.query?.slug
  if (!slug) {
    res.status(400).json({ error: 'A slug is required.' })
    return
  }

  const admin = isAdminRequest(req)

  if (req.method === 'GET') {
    const post = await getPostBySlug(slug, req.query?.visitorId || null)
    if (!post) {
      res.status(404).json({ error: 'Not found.' })
      return
    }

    if (post.status === 'published' || admin) {
      res.status(200).json({ post })
      return
    }

    // Not published, not admin — only visible to the person who submitted
    // it, and only by presenting the private edit token they were given.
    const token = req.query?.token || req.body?.token
    if (token && post.editToken && safeEqual(token, post.editToken)) {
      res.status(200).json({ post })
      return
    }

    res.status(404).json({ error: 'Not found.' })
    return
  }

  if (req.method === 'PATCH') {
    const post = await getPostBySlug(slug)
    if (!post) {
      res.status(404).json({ error: 'Not found.' })
      return
    }

    const body = req.body || {}

    if (admin) {
      const fields = {}
      for (const key of ['title', 'excerpt', 'content', 'tags', 'cover', 'date', 'readingTime', 'link', 'reviewNote']) {
        if (body[key] !== undefined) fields[key] = body[key]
      }
      if (body.status && ['draft', 'published', 'pending', 'rejected'].includes(body.status)) {
        fields.status = body.status
      }
      const updated = await updatePostRow(slug, fields)
      res.status(200).json({ post: updated })
      return
    }

    // A reader editing their own pending submission.
    if (post.status !== 'pending') {
      res.status(403).json({ error: 'This post has already been reviewed and can no longer be edited.' })
      return
    }
    if (!body.token || !post.editToken || !safeEqual(body.token, post.editToken)) {
      res.status(403).json({ error: 'Invalid edit link.' })
      return
    }

    const fields = {}
    for (const key of ['title', 'excerpt', 'content', 'tags', 'cover', 'date', 'link']) {
      if (body[key] !== undefined) fields[key] = body[key]
    }
    const updated = await updatePostRow(slug, fields)
    res.status(200).json({ post: updated })
    return
  }

  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return
    await deletePostRow(slug)
    res.status(204).end()
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
