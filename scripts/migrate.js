// One-time (idempotent) setup: creates the schema, then seeds the original
// static posts and their seed comments into the database if it's empty.
// Run with: npm run migrate
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import { posts } from '../src/data/posts.js'

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!connectionString) {
  console.error('DATABASE_URL (or POSTGRES_URL) is not set. Run with `npm run migrate` after filling in .env.')
  process.exit(1)
}

const sql = neon(connectionString)
const here = path.dirname(fileURLToPath(import.meta.url))

async function applySchema() {
  const raw = readFileSync(path.join(here, '../db/schema.sql'), 'utf8')
  // Strip full-line `--` comments first — splitting on every `;` in the raw
  // file breaks the moment a comment's prose happens to contain one (as the
  // file header originally did), turning the tail of that comment into
  // invalid "SQL" on its own.
  const withoutComments = raw
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')

  const statements = withoutComments
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)

  for (const statement of statements) {
    await sql.query(statement)
  }
  console.log(`[migrate] applied ${statements.length} schema statements`)
}

function makeId() {
  return crypto.randomUUID()
}

async function seedPosts() {
  const rows = await sql.query('SELECT COUNT(*)::int AS count FROM posts')
  if (rows[0].count > 0) {
    console.log(`[migrate] posts table already has ${rows[0].count} rows — skipping seed`)
    return
  }

  for (const post of posts) {
    await sql`
      INSERT INTO posts (
        slug, title, excerpt, content, tags, cover, date, reading_time, status,
        link, seed_likes, seed_dislikes, seed_rating_sum, seed_rating_count
      ) VALUES (
        ${post.slug}, ${post.title}, ${post.excerpt}, ${JSON.stringify(post.content)}::jsonb,
        ${post.tags}::text[], ${JSON.stringify(post.cover)}::jsonb, ${post.date}, ${post.readingTime},
        'published', ${post.link ? JSON.stringify(post.link) : null}::jsonb,
        ${post.seed.likes}, ${post.seed.dislikes}, ${post.seed.ratingSum}, ${post.seed.ratingCount}
      )
      ON CONFLICT (slug) DO NOTHING
    `

    for (const comment of post.seed.comments) {
      const commentId = makeId()
      await sql`
        INSERT INTO comments (id, post_slug, parent_id, name, body, visitor_id, created_at)
        VALUES (${commentId}, ${post.slug}, NULL, ${comment.name}, ${comment.text}, ${'seed-' + commentId}, ${comment.date})
      `
      for (let i = 0; i < (comment.likes || 0); i++) {
        await sql`
          INSERT INTO comment_reactions (comment_id, visitor_id, emoji)
          VALUES (${commentId}, ${'seed-like-' + i}, '👍')
          ON CONFLICT DO NOTHING
        `
      }

      for (const reply of comment.replies || []) {
        const replyId = makeId()
        await sql`
          INSERT INTO comments (id, post_slug, parent_id, name, body, visitor_id, created_at)
          VALUES (${replyId}, ${post.slug}, ${commentId}, ${reply.name}, ${reply.text}, ${'seed-' + replyId}, ${reply.date})
        `
        for (let i = 0; i < (reply.likes || 0); i++) {
          await sql`
            INSERT INTO comment_reactions (comment_id, visitor_id, emoji)
            VALUES (${replyId}, ${'seed-like-' + i}, '👍')
            ON CONFLICT DO NOTHING
          `
        }
      }
    }
  }

  console.log(`[migrate] seeded ${posts.length} posts and their comments`)
}

await applySchema()
await seedPosts()
console.log('[migrate] done')
