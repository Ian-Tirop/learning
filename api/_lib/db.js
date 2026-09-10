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
    newsletterSent: Boolean(row.newsletter_sent),
    scheduledAt: row.scheduled_at || null,
    seriesName: row.series_name || null,
    seriesOrder: row.series_order ?? null,
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

// Published posts this account has liked — from any device, since the
// like is attributed to the account (not just that device's visitor_id)
// whenever it's made while signed in. Not restricted by author: a like
// counts the same whether the post is Ian's own or another reader's
// approved submission.
export async function getLikedPostsForAccount(accountId) {
  const rows = await sqlQuery(
    postsWithStats(
      `WHERE p.status = 'published' AND p.slug IN (
        SELECT post_slug FROM post_reactions WHERE account_id = $2 AND reaction = 'like'
      )`,
      'ORDER BY p.date DESC',
    ),
    [null, accountId],
  )
  return rows.map(mapPostRow)
}

// Published posts this account has bookmarked — see saved_posts in
// db/schema.sql. Bookmarking requires an account (there's no anonymous
// equivalent), so this is always looked up by account id, never visitor_id.
export async function getSavedPostsForAccount(accountId) {
  const rows = await sqlQuery(
    postsWithStats(
      `WHERE p.status = 'published' AND p.slug IN (
        SELECT post_slug FROM saved_posts WHERE account_id = $2
      )`,
      'ORDER BY p.date DESC',
    ),
    [null, accountId],
  )
  return rows.map(mapPostRow)
}

export async function setPostSaved(accountId, slug, saved) {
  if (saved) {
    await sql`
      INSERT INTO saved_posts (account_id, post_slug)
      VALUES (${accountId}, ${slug})
      ON CONFLICT (account_id, post_slug) DO NOTHING
    `
  } else {
    await sql`DELETE FROM saved_posts WHERE account_id = ${accountId} AND post_slug = ${slug}`
  }
}

export async function isPostSavedByAccount(accountId, slug) {
  if (!accountId) return false
  const rows = await sql`
    SELECT 1 FROM saved_posts WHERE account_id = ${accountId} AND post_slug = ${slug} LIMIT 1
  `
  return rows.length > 0
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
    accountId: row.account_id || null,
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

export async function getCommentById(id) {
  const rows = await sql`SELECT * FROM comments WHERE id = ${id} LIMIT 1`
  return rows[0] ? mapCommentRow(rows[0]) : null
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
      link, submitted_by_name, submitted_by_email, edit_token, author_account_id, scheduled_at,
      series_name, series_order
    ) VALUES (
      ${post.slug}, ${post.title}, ${post.excerpt},
      ${JSON.stringify(post.content)}::jsonb, ${post.tags}::text[],
      ${post.cover ? JSON.stringify(post.cover) : null}::jsonb,
      ${post.date}, ${post.readingTime}, ${post.status},
      ${post.link ? JSON.stringify(post.link) : null}::jsonb,
      ${post.submittedByName || null}, ${post.submittedByEmail || null}, ${post.editToken || null},
      ${post.authorAccountId || null}, ${post.scheduledAt || null},
      ${post.seriesName || null}, ${post.seriesOrder ?? null}
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
    scheduledAt: 'scheduled_at',
    seriesName: 'series_name',
    seriesOrder: 'series_order',
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

// Flips every due scheduled post to published — called from the cron
// endpoint (api/admin/[action].js, action=cron-publish-scheduled).
export async function publishDuePosts() {
  const due = await sql`
    SELECT slug FROM posts WHERE status = 'scheduled' AND scheduled_at <= now()
  `
  const results = []
  for (const row of due) {
    const updated = await updatePostRow(row.slug, { status: 'published', scheduledAt: null })
    if (updated) results.push(updated)
  }
  return results
}

export async function createComment(comment) {
  const rows = await sql`
    INSERT INTO comments (id, post_slug, parent_id, name, body, mention_of, visitor_id, account_id)
    VALUES (
      ${comment.id}, ${comment.postSlug}, ${comment.parentId || null}, ${comment.name}, ${comment.text},
      ${comment.mentionOf || null}, ${comment.visitorId || null}, ${comment.accountId || null}
    )
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

// Admin can delete any comment, regardless of who posted it — used both
// for general moderation and for cleaning up a reported comment.
export async function deleteCommentAsAdmin(id) {
  await sql`DELETE FROM comments WHERE id = ${id}`
}

export async function toggleCommentReport(commentId, visitorId) {
  const existing = await sql`
    SELECT 1 FROM comment_reports WHERE comment_id = ${commentId} AND visitor_id = ${visitorId}
  `
  if (existing.length > 0) {
    await sql`DELETE FROM comment_reports WHERE comment_id = ${commentId} AND visitor_id = ${visitorId}`
    return false
  }
  await sql`
    INSERT INTO comment_reports (comment_id, visitor_id) VALUES (${commentId}, ${visitorId})
    ON CONFLICT DO NOTHING
  `
  return true
}

export async function getReportedComments() {
  const rows = await sql`
    SELECT c.id, c.name, c.body, c.post_slug, c.account_id, p.title AS post_title,
      COUNT(r.visitor_id)::int AS report_count
    FROM comment_reports r
    JOIN comments c ON c.id = r.comment_id
    JOIN posts p ON p.slug = c.post_slug
    GROUP BY c.id, c.name, c.body, c.post_slug, c.account_id, p.title
    ORDER BY report_count DESC, c.id
  `
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    text: row.body,
    postSlug: row.post_slug,
    postTitle: row.post_title,
    accountId: row.account_id || null,
    reportCount: row.report_count,
  }))
}

// Follower/following counts for one account — the admin reader-detail
// view's counterpart to getAuthorInfo, which only ever returns a follower
// count (a public byline never needs to show who an account follows).
export async function getFollowCounts(accountId) {
  const [[{ count: followerCount }], [{ count: followingCount }]] = await Promise.all([
    sql`SELECT COUNT(*)::int AS count FROM follows WHERE writer_id = ${accountId}`,
    sql`SELECT COUNT(*)::int AS count FROM follows WHERE follower_id = ${accountId}`,
  ])
  return { followerCount, followingCount }
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

// `accountId`, when the reader is signed in, tags this visitor_id's row
// with their account — that's what lets getLikedPostsForAccount find it
// later, from any device. COALESCE keeps a previously-recorded account_id
// if a later call (e.g. signed out) doesn't supply one.
export async function upsertPostReaction(slug, visitorId, { reaction, rating, accountId }) {
  await sql`
    INSERT INTO post_reactions (post_slug, visitor_id, reaction, rating, account_id)
    VALUES (${slug}, ${visitorId}, ${reaction ?? null}, ${rating ?? null}, ${accountId ?? null})
    ON CONFLICT (post_slug, visitor_id)
    DO UPDATE SET
      reaction = COALESCE(EXCLUDED.reaction, post_reactions.reaction),
      rating = COALESCE(EXCLUDED.rating, post_reactions.rating),
      account_id = COALESCE(EXCLUDED.account_id, post_reactions.account_id)
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
    avatarUrl: row.avatar_url || null,
    nickname: row.nickname || null,
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

// Includes password_hash — only ever call this server-side to verify a
// change-password request's current password. Use getAccountById for
// anything that returns to a client.
export async function getAccountByIdForAuth(id) {
  const rows = await sql`SELECT * FROM accounts WHERE id = ${id} LIMIT 1`
  return rows[0] || null
}

export async function updateAccountProfile(id, { displayName, email, nickname }) {
  const rows = await sql`
    UPDATE accounts SET display_name = ${displayName}, email = ${email}, nickname = ${nickname || null}
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0] ? mapAccountRow(rows[0]) : null
}

export async function updateAccountAvatar(id, avatarUrl) {
  const rows = await sql`
    UPDATE accounts SET avatar_url = ${avatarUrl} WHERE id = ${id} RETURNING *
  `
  return rows[0] ? mapAccountRow(rows[0]) : null
}

export async function updateAccountPassword(id, passwordHash) {
  await sql`
    UPDATE accounts
    SET password_hash = ${passwordHash}, password_reset_token = NULL, password_reset_expires = NULL
    WHERE id = ${id}
  `
}

export async function setPasswordResetToken(email, token, expires) {
  await sql`
    UPDATE accounts SET password_reset_token = ${token}, password_reset_expires = ${expires}
    WHERE email = ${email}
  `
}

// Looked up by token + email together — the token alone (a random UUID)
// is already unguessable, but this costs nothing and rules out a stale
// link for the wrong account entirely.
export async function getAccountByResetToken(email, token) {
  const rows = await sql`
    SELECT * FROM accounts
    WHERE email = ${email} AND password_reset_token = ${token}
      AND password_reset_expires > now()
    LIMIT 1
  `
  return rows[0] || null
}

// Follow/unfollow a writer, toggling on whichever state is currently
// stored — same convention as toggleCommentReaction/toggleCommentReport.
// Self-follows are rejected by the caller (api/accounts/[action].js),
// before this ever runs.
export async function toggleFollow(followerId, writerId) {
  const deleted = await sql`
    DELETE FROM follows WHERE follower_id = ${followerId} AND writer_id = ${writerId}
    RETURNING writer_id
  `
  if (deleted.length === 0) {
    await sql`
      INSERT INTO follows (follower_id, writer_id) VALUES (${followerId}, ${writerId})
      ON CONFLICT DO NOTHING
    `
  }
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM follows WHERE writer_id = ${writerId}`
  return { following: deleted.length === 0, followerCount: count }
}

// Public-safe author details for a post's byline — just enough to render
// "Written by X, N followers" and a Follow button, never the account's
// email. `viewerAccountId` is null for a logged-out visitor, in which case
// isFollowing is always false rather than hitting the follows table.
export async function getAuthorInfo(accountId, viewerAccountId) {
  const rows = await sql`
    SELECT id, display_name, avatar_url, created_at FROM accounts WHERE id = ${accountId} LIMIT 1
  `
  const account = rows[0]
  if (!account) return null

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM follows WHERE writer_id = ${accountId}`
  let isFollowing = false
  if (viewerAccountId) {
    const followRows = await sql`
      SELECT 1 FROM follows WHERE follower_id = ${viewerAccountId} AND writer_id = ${accountId} LIMIT 1
    `
    isFollowing = followRows.length > 0
  }

  return {
    id: account.id,
    displayName: account.display_name,
    avatarUrl: account.avatar_url || null,
    followerCount: count,
    isFollowing,
    createdAt: account.created_at,
  }
}

// Published posts only — the public-profile counterpart to
// getPostsForAccount, which includes every status and is only ever shown
// to the account owner themselves (or admin).
export async function getPublishedPostsForAccount(accountId) {
  const rows = await sqlQuery(
    postsWithStats("WHERE p.author_account_id = $2 AND p.status = 'published'", 'ORDER BY p.date DESC'),
    [null, accountId],
  )
  return rows.map(mapPostRow)
}

// Every writer this account follows, for the profile's Following tab —
// with how many published posts each currently has, so a reader can see
// at a glance whether there's anything new to catch up on.
export async function getFollowedAccounts(followerId) {
  const rows = await sql`
    SELECT a.id, a.display_name, a.created_at,
      (SELECT COUNT(*)::int FROM posts WHERE author_account_id = a.id AND status = 'published') AS post_count
    FROM follows f
    JOIN accounts a ON a.id = f.writer_id
    WHERE f.follower_id = ${followerId}
    ORDER BY f.created_at DESC
  `
  return rows.map((row) => ({
    id: row.id,
    displayName: row.display_name,
    createdAt: row.created_at,
    postCount: row.post_count,
  }))
}

// Every comment a specific reader account has ever left, newest first,
// with enough post context to link back to it — the admin-facing
// counterpart to getCommentsForPost, which is scoped by post instead of by
// commenter.
export async function getCommentsForAccount(accountId) {
  const rows = await sql`
    SELECT c.id, c.post_slug, c.body, c.created_at, p.title AS post_title
    FROM comments c
    JOIN posts p ON p.slug = c.post_slug
    WHERE c.account_id = ${accountId}
    ORDER BY c.created_at DESC
  `
  return rows.map((row) => ({
    id: row.id,
    postSlug: row.post_slug,
    postTitle: row.post_title,
    text: row.body,
    createdAt: row.created_at,
  }))
}

// Permanently removes a reader account. posts/comments/post_reactions keep
// existing (author_account_id/account_id just become null, per the schema's
// ON DELETE SET NULL) — only saved_posts and follows rows actually vanish,
// per their ON DELETE CASCADE. Irreversible; the caller is responsible for
// confirming with the admin first.
export async function deleteAccount(id) {
  await sql`DELETE FROM accounts WHERE id = ${id}`
}

export async function createAccountWarning(accountId, note) {
  const id = crypto.randomUUID()
  const rows = await sql`
    INSERT INTO account_warnings (id, account_id, note) VALUES (${id}, ${accountId}, ${note})
    RETURNING created_at
  `
  return { id, accountId, note, createdAt: rows[0].created_at }
}

export async function getAccountWarnings(accountId) {
  const rows = await sql`
    SELECT id, note, created_at FROM account_warnings
    WHERE account_id = ${accountId}
    ORDER BY created_at DESC
  `
  return rows.map((row) => ({ id: row.id, note: row.note, createdAt: row.created_at }))
}

// Real numbers from what the site actually tracks (engagement + review
// queue + accounts) — there's no page-view/traffic pipeline here, so this
// never reports visits or unique-visitor counts, only what's genuinely in
// the database. Reuses getAllPostsForAdmin's already-correct seed+live
// aggregation instead of re-deriving likes/ratings in raw SQL.
export async function getSiteAnalytics() {
  const [
    allPosts,
    commentCountRows,
    totalCommentsRows,
    accounts,
    recentComments,
    subscribers,
    feedback,
    trendingRows,
    reportedComments,
    mostFollowedRows,
  ] = await Promise.all([
    getAllPostsForAdmin(null),
    sql`SELECT post_slug, COUNT(*)::int AS count FROM comments GROUP BY post_slug`,
    sql`SELECT COUNT(*)::int AS count FROM comments`,
    sql`SELECT id, email, display_name, created_at FROM accounts ORDER BY created_at DESC`,
    sql`
      SELECT c.id, c.name, c.body, c.post_slug, c.account_id, c.created_at, p.title AS post_title
      FROM comments c
      JOIN posts p ON p.slug = c.post_slug
      ORDER BY c.created_at DESC
      LIMIT 50
    `,
    sql`SELECT email, subscribed_at FROM subscribers ORDER BY subscribed_at DESC`,
    sql`SELECT * FROM feedback ORDER BY created_at DESC`,
    // "Trending this week" — comment velocity is the cleanest recency
    // signal actually available: post_reactions (likes) never recorded a
    // timestamp historically, so backfilling one would make old likes look
    // freshly "trending". Comments always had created_at, seed data
    // included, so this doesn't need any schema backfill to be accurate.
    sql`
      SELECT c.post_slug, p.title, COUNT(*)::int AS count
      FROM comments c
      JOIN posts p ON p.slug = c.post_slug
      WHERE c.created_at > now() - interval '7 days' AND p.status = 'published'
      GROUP BY c.post_slug, p.title
      ORDER BY count DESC
      LIMIT 5
    `,
    getReportedComments(),
    sql`
      SELECT a.id, a.display_name, COUNT(f.follower_id)::int AS follower_count
      FROM follows f
      JOIN accounts a ON a.id = f.writer_id
      GROUP BY a.id, a.display_name
      ORDER BY follower_count DESC
      LIMIT 5
    `,
  ])

  const commentCountBySlug = Object.fromEntries(commentCountRows.map((row) => [row.post_slug, row.count]))

  const byStatus = { draft: 0, pending: 0, published: 0, rejected: 0 }
  let likes = 0
  let dislikes = 0
  let ratingSum = 0
  let ratingCount = 0
  for (const post of allPosts) {
    byStatus[post.status] = (byStatus[post.status] || 0) + 1
    likes += post.seed.likes
    dislikes += post.seed.dislikes
    ratingSum += post.seed.ratingSum
    ratingCount += post.seed.ratingCount
  }

  const postCountByAccount = {}
  for (const post of allPosts) {
    if (!post.authorAccountId) continue
    postCountByAccount[post.authorAccountId] = (postCountByAccount[post.authorAccountId] || 0) + 1
  }

  const published = allPosts.filter((post) => post.status === 'published')

  const topLiked = [...published]
    .sort((a, b) => b.seed.likes - a.seed.likes)
    .slice(0, 5)
    .map((post) => ({ slug: post.slug, title: post.title, likes: post.seed.likes }))

  const topCommented = published
    .map((post) => ({ slug: post.slug, title: post.title, comments: commentCountBySlug[post.slug] || 0 }))
    .sort((a, b) => b.comments - a.comments)
    .slice(0, 5)

  const topRated = [...published]
    .filter((post) => post.seed.ratingCount > 0)
    .sort((a, b) => b.seed.ratingSum / b.seed.ratingCount - a.seed.ratingSum / a.seed.ratingCount)
    .slice(0, 5)
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      average: post.seed.ratingSum / post.seed.ratingCount,
      count: post.seed.ratingCount,
    }))

  return {
    totals: {
      posts: allPosts.length,
      byStatus,
      comments: totalCommentsRows[0].count,
      accounts: accounts.length,
      likes,
      dislikes,
      averageRating: ratingCount > 0 ? ratingSum / ratingCount : 0,
      ratingCount,
      subscribers: subscribers.length,
      feedback: feedback.length,
      reportedComments: reportedComments.length,
    },
    topLiked,
    topCommented,
    topRated,
    trending: trendingRows.map((row) => ({ slug: row.post_slug, title: row.title, comments: row.count })),
    mostFollowed: mostFollowedRows.map((row) => ({
      id: row.id,
      displayName: row.display_name,
      followerCount: row.follower_count,
    })),
    reportedComments,
    // Full lists (not just top 5) — the frontend uses these for the
    // click-to-drill-down detail view on each stat card.
    posts: allPosts.map((post) => ({
      slug: post.slug,
      title: post.title,
      status: post.status,
      date: post.date,
      submittedByName: post.submittedByName,
      likes: post.seed.likes,
      dislikes: post.seed.dislikes,
      ratingAverage: post.seed.ratingCount > 0 ? post.seed.ratingSum / post.seed.ratingCount : 0,
      ratingCount: post.seed.ratingCount,
      comments: commentCountBySlug[post.slug] || 0,
    })),
    accounts: accounts.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      createdAt: row.created_at,
      postCount: postCountByAccount[row.id] || 0,
    })),
    recentComments: recentComments.map((row) => ({
      id: row.id,
      name: row.name,
      text: row.body,
      postSlug: row.post_slug,
      postTitle: row.post_title,
      accountId: row.account_id || null,
      createdAt: row.created_at,
    })),
    subscribers: subscribers.map((row) => ({ email: row.email, subscribedAt: row.subscribed_at })),
    feedback: feedback.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      interests: row.interests || [],
      wantsToWrite: row.wants_to_write,
      writeNote: row.write_note,
      message: row.message,
      postSlug: row.post_slug,
      postTitle: row.post_title,
      createdAt: row.created_at,
    })),
  }
}

export async function createSubscriber(email) {
  await sql`
    INSERT INTO subscribers (email) VALUES (${email})
    ON CONFLICT (email) DO NOTHING
  `
}

export async function getAllSubscriberEmails() {
  const rows = await sql`SELECT email FROM subscribers`
  return rows.map((row) => row.email)
}

export async function deleteSubscriber(email) {
  await sql`DELETE FROM subscribers WHERE email = ${email}`
}

export async function createFeedback({
  id,
  name,
  email,
  interests,
  wantsToWrite,
  writeNote,
  message,
  postSlug,
  postTitle,
}) {
  await sql`
    INSERT INTO feedback (id, name, email, interests, wants_to_write, write_note, message, post_slug, post_title)
    VALUES (
      ${id}, ${name || null}, ${email || null}, ${interests || []}::text[],
      ${wantsToWrite || null}, ${writeNote || null}, ${message},
      ${postSlug || null}, ${postTitle || null}
    )
  `
}

export async function markNewsletterSent(slug) {
  await sql`UPDATE posts SET newsletter_sent = true WHERE slug = ${slug}`
}

export async function getAdminSetting(key) {
  const rows = await sql`SELECT value FROM admin_settings WHERE key = ${key}`
  return rows[0]?.value ?? null
}

export async function setAdminSetting(key, value) {
  await sql`
    INSERT INTO admin_settings (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `
}

export async function deleteAdminSetting(key) {
  await sql`DELETE FROM admin_settings WHERE key = ${key}`
}
