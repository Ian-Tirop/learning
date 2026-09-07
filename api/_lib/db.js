// Shared Postgres client + query helpers for every API route. Uses Neon's
// serverless driver, which works over HTTP/WebSocket and is safe to call
// fresh in each serverless function invocation.
import { neon } from '@neondatabase/serverless'

function getConnectionString() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL (or POSTGRES_URL) is not set — attach a Postgres database to this project.',
    )
  }
  return url
}

let cachedClient = null

function getClient() {
  if (!cachedClient) cachedClient = neon(getConnectionString())
  return cachedClient
}

// Tagged-template usage: sql`SELECT ...`
export function sql(...args) {
  return getClient()(...args)
}

// Parameterized-string usage: sql.query('SELECT ... $1', [x]). Deliberately
// a separate function rather than `sql.query` — `sql` above is a plain
// wrapper function, and a `.query` property attached to it would forward
// calls but silently drop the real client's `.query` method (only the
// client neon() actually returns has it), which is exactly the bug this
// replaced: sql.query(...) failed with "sql.query is not a function" for
// every one of these call sites until this was split out.
function sqlQuery(text, params) {
  return getClient().query(text, params)
}

function mapPostRow(row) {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    tags: row.tags || [],
    cover: row.cover,
    date: row.date,
    readingTime: row.reading_time,
    status: row.status,
    link: row.link || undefined,
    submittedByName: row.submitted_by_name || undefined,
    submittedByEmail: row.submitted_by_email || undefined,
    reviewNote: row.review_note || undefined,
    authorAccountId: row.author_account_id || null,
    seed: {
      likes: row.seed_likes + Number(row.reaction_likes || 0),
      dislikes: row.seed_dislikes + Number(row.reaction_dislikes || 0),
      ratingSum: row.seed_rating_sum + Number(row.reaction_rating_sum || 0),
      ratingCount: row.seed_rating_count + Number(row.reaction_rating_count || 0),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// `excludeVisitorId` (always bound param $1) leaves that visitor's own
// reaction out of the aggregate — the frontend then adds its own current
// reaction back in locally, so a toggle updates the count instantly without
// a refetch, and a returning visitor's own past reaction is never double
// counted once the post is refetched.
function postsWithStats(where, orderBy) {
  return `
    SELECT p.*,
      COALESCE(r.likes, 0) AS reaction_likes,
      COALESCE(r.dislikes, 0) AS reaction_dislikes,
      COALESCE(r.rating_sum, 0) AS reaction_rating_sum,
      COALESCE(r.rating_count, 0) AS reaction_rating_count
    FROM posts p
    LEFT JOIN (
      SELECT post_slug,
        COUNT(*) FILTER (WHERE reaction = 'like') AS likes,
        COUNT(*) FILTER (WHERE reaction = 'dislike') AS dislikes,
        COALESCE(SUM(rating), 0) AS rating_sum,
        COUNT(*) FILTER (WHERE rating IS NOT NULL) AS rating_count
      FROM post_reactions
      WHERE visitor_id IS DISTINCT FROM $1
      GROUP BY post_slug
    ) r ON r.post_slug = p.slug
    ${where}
    ${orderBy}
  `
}

export async function getPublishedPosts(excludeVisitorId = null) {
  const rows = await sqlQuery(postsWithStats("WHERE p.status = 'published'", 'ORDER BY p.date DESC'), [
    excludeVisitorId,
  ])
  return rows.map(mapPostRow)
}

export async function getAllPostsForAdmin(excludeVisitorId = null) {
  const rows = await sqlQuery(postsWithStats('', 'ORDER BY p.created_at DESC'), [excludeVisitorId])
  return rows.map(mapPostRow)
}

export async function getPostBySlug(slug, excludeVisitorId = null) {
  const rows = await sqlQuery(postsWithStats('WHERE p.slug = $2', 'LIMIT 1'), [excludeVisitorId, slug])
  return rows[0] ? mapPostRow(rows[0]) : null
}

export async function getPostsForAccount(accountId) {
  const rows = await sqlQuery(
    postsWithStats('WHERE p.author_account_id = $2', 'ORDER BY p.created_at DESC'),
    [null, accountId],
  )
  return rows.map(mapPostRow)
}

export async function getVisitorPostReaction(slug, visitorId) {
  if (!visitorId) return { reaction: null, rating: null }
  const rows = await sql`
    SELECT reaction, rating FROM post_reactions
    WHERE post_slug = ${slug} AND visitor_id = ${visitorId}
    LIMIT 1
  `
  return rows[0] ? { reaction: rows[0].reaction, rating: rows[0].rating } : { reaction: null, rating: null }
}

function mapCommentRow(row) {
  return {
    id: row.id,
    postSlug: row.post_slug,
    parentId: row.parent_id || null,
    name: row.name,
    text: row.body,
    mentionOf: row.mention_of || null,
    visitorId: row.visitor_id || null,
    createdAt: row.created_at,
    editedAt: row.edited_at || null,
  }
}

export async function getCommentsForPost(slug) {
  const rows = await sql`
    SELECT * FROM comments WHERE post_slug = ${slug} ORDER BY created_at ASC
  `
  return rows.map(mapCommentRow)
}

export async function getTopComments(limit = 3) {
  const rows = await sql`
    SELECT c.id, c.name, c.body, c.post_slug, p.title AS post_title,
      COALESCE(r.reaction_count, 0) AS reaction_count
    FROM comments c
    JOIN posts p ON p.slug = c.post_slug
    LEFT JOIN (
      SELECT comment_id, COUNT(*) AS reaction_count FROM comment_reactions GROUP BY comment_id
    ) r ON r.comment_id = c.id
    WHERE c.parent_id IS NULL AND p.status = 'published'
    ORDER BY reaction_count DESC, c.created_at DESC
    LIMIT ${limit}
  `
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    text: row.body,
    postSlug: row.post_slug,
    postTitle: row.post_title,
  }))
}

export async function getReactionsForComments(commentIds) {
  if (commentIds.length === 0) return []
  const rows = await sql`
    SELECT comment_id, emoji, visitor_id FROM comment_reactions
    WHERE comment_id = ANY(${commentIds}::text[])
  `
  return rows
}

export async function createPost(post) {
  const rows = await sql`
    INSERT INTO posts (
      slug, title, excerpt, content, tags, cover, date, reading_time, status,
      link, submitted_by_name, submitted_by_email, edit_token, author_account_id
    ) VALUES (
      ${post.slug}, ${post.title}, ${post.excerpt},
      ${JSON.stringify(post.content)}::jsonb, ${post.tags}::text[],
      ${post.cover ? JSON.stringify(post.cover) : null}::jsonb,
      ${post.date}, ${post.readingTime}, ${post.status},
      ${post.link ? JSON.stringify(post.link) : null}::jsonb,
      ${post.submittedByName || null}, ${post.submittedByEmail || null}, ${post.editToken || null},
      ${post.authorAccountId || null}
    )
    RETURNING *
  `
  return mapPostRow(rows[0])
}

export async function updatePostRow(slug, fields) {
  const columns = {
    title: 'title',
    excerpt: 'excerpt',
    date: 'date',
    readingTime: 'reading_time',
    status: 'status',
    reviewNote: 'review_note',
  }
  const jsonColumns = { content: 'content', cover: 'cover', link: 'link' }

  const setClauses = []
  const values = []
  let index = 1

  for (const [key, column] of Object.entries(columns)) {
    if (fields[key] === undefined) continue
    setClauses.push(`${column} = $${index}`)
    values.push(fields[key])
    index += 1
  }
  if (fields.tags !== undefined) {
    setClauses.push(`tags = $${index}::text[]`)
    values.push(fields.tags)
    index += 1
  }
  for (const [key, column] of Object.entries(jsonColumns)) {
    if (fields[key] === undefined) continue
    setClauses.push(`${column} = $${index}::jsonb`)
    values.push(JSON.stringify(fields[key]))
    index += 1
  }

  if (setClauses.length === 0) return getPostBySlug(slug)

  setClauses.push('updated_at = now()')
  values.push(slug)

  const rows = await sqlQuery(
    `UPDATE posts SET ${setClauses.join(', ')} WHERE slug = $${index} RETURNING *`,
    values,
  )
  return rows[0] ? mapPostRow(rows[0]) : null
}

export async function deletePostRow(slug) {
  await sql`DELETE FROM posts WHERE slug = ${slug}`
}

export async function createComment(comment) {
  const rows = await sql`
    INSERT INTO comments (id, post_slug, parent_id, name, body, mention_of, visitor_id)
    VALUES (${comment.id}, ${comment.postSlug}, ${comment.parentId || null}, ${comment.name}, ${comment.text}, ${comment.mentionOf || null}, ${comment.visitorId || null})
    RETURNING *
  `
  return mapCommentRow(rows[0])
}

export async function updateComment(id, visitorId, text) {
  const rows = await sql`
    UPDATE comments SET body = ${text}, edited_at = now()
    WHERE id = ${id} AND visitor_id = ${visitorId}
    RETURNING *
  `
  return rows[0] ? mapCommentRow(rows[0]) : null
}

export async function deleteComment(id, visitorId) {
  const rows = await sql`
    DELETE FROM comments WHERE id = ${id} AND visitor_id = ${visitorId} RETURNING id
  `
  return rows.length > 0
}

export async function toggleCommentReaction(commentId, visitorId, emoji) {
  const existing = await sql`
    SELECT 1 FROM comment_reactions
    WHERE comment_id = ${commentId} AND visitor_id = ${visitorId} AND emoji = ${emoji}
  `
  if (existing.length > 0) {
    await sql`
      DELETE FROM comment_reactions
      WHERE comment_id = ${commentId} AND visitor_id = ${visitorId} AND emoji = ${emoji}
    `
    return false
  }
  await sql`
    INSERT INTO comment_reactions (comment_id, visitor_id, emoji)
    VALUES (${commentId}, ${visitorId}, ${emoji})
    ON CONFLICT DO NOTHING
  `
  return true
}

export async function upsertPostReaction(slug, visitorId, { reaction, rating }) {
  await sql`
    INSERT INTO post_reactions (post_slug, visitor_id, reaction, rating)
    VALUES (${slug}, ${visitorId}, ${reaction ?? null}, ${rating ?? null})
    ON CONFLICT (post_slug, visitor_id)
    DO UPDATE SET
      reaction = COALESCE(EXCLUDED.reaction, post_reactions.reaction),
      rating = COALESCE(EXCLUDED.rating, post_reactions.rating)
  `
}

export async function clearPostReactionField(slug, visitorId, field) {
  const column = field === 'reaction' ? 'reaction' : 'rating'
  await sqlQuery(
    `UPDATE post_reactions SET ${column} = NULL WHERE post_slug = $1 AND visitor_id = $2`,
    [slug, visitorId],
  )
}

function mapAccountRow(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
  }
}

export async function createAccount({ id, email, passwordHash, displayName }) {
  const rows = await sql`
    INSERT INTO accounts (id, email, password_hash, display_name)
    VALUES (${id}, ${email}, ${passwordHash}, ${displayName})
    RETURNING *
  `
  return mapAccountRow(rows[0])
}

// Includes password_hash — only ever call this server-side to verify a
// login attempt. Use getAccountById for anything that returns to a client.
export async function getAccountByEmailForLogin(email) {
  const rows = await sql`SELECT * FROM accounts WHERE email = ${email} LIMIT 1`
  return rows[0] || null
}

export async function accountExistsWithEmail(email) {
  const rows = await sql`SELECT 1 FROM accounts WHERE email = ${email} LIMIT 1`
  return rows.length > 0
}

export async function getAccountById(id) {
  const rows = await sql`SELECT * FROM accounts WHERE id = ${id} LIMIT 1`
  return rows[0] ? mapAccountRow(rows[0]) : null
}
