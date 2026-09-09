// Generates public/sitemap.xml, public/rss.xml, and public/robots.txt
// before each dev/build run. Reads the live database when DATABASE_URL is
// set (so newly published/approved posts are included on the next build),
// falling back to the original static seed posts otherwise — that fallback
// keeps `npm run dev`/`npm run build` working with zero setup before a
// database is attached. See README's "Backend & data model" section.
//
// Set SITE_URL when deploying so the generated links point at the real
// domain, e.g. `SITE_URL=https://iantirop.dev npm run build`.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { posts as staticPosts } from '../src/data/posts.js'

const siteUrl = (process.env.SITE_URL || 'https://example.com').replace(/\/$/, '')
if (!process.env.SITE_URL) {
  console.warn(
    '[generate-feeds] SITE_URL is not set — sitemap.xml/rss.xml/robots.txt will use the placeholder ' +
      `"${siteUrl}". Set SITE_URL before deploying for real links.`,
  )
}

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public')

async function loadPublishedPosts() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!connectionString) {
    console.warn('[generate-feeds] DATABASE_URL not set — using the static seed posts instead of live data.')
    return staticPosts.filter((post) => post.status !== 'draft')
  }

  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(connectionString)
    const rows = await sql`SELECT slug, title, excerpt, date, content FROM posts WHERE status = 'published' ORDER BY date DESC`
    return rows
  } catch (error) {
    console.warn('[generate-feeds] Could not reach the database, falling back to static seed posts:', error.message)
    return staticPosts.filter((post) => post.status !== 'draft')
  }
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      default:
        return '&quot;'
    }
  })
}

function buildSitemap(published) {
  const staticRoutes = ['/', '/blog', '/community', '/about', '/contact']
  const postRoutes = published.map((post) => `/blog/${post.slug}`)
  const urls = [...staticRoutes, ...postRoutes]
    .map((route) => `  <url><loc>${escapeXml(siteUrl + route)}</loc></url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

// Content blocks -> plain HTML for the feed's full-content field. Kept
// deliberately simple (no syntax highlighting, no copy button) since feed
// readers render HTML in wildly different, JS-free contexts.
function contentToHtml(content) {
  if (!Array.isArray(content)) return ''
  return content
    .map((block) => {
      const text = escapeXml(block.text || '')
      if (block.type === 'h3') return `<h3>${text}</h3>`
      if (block.type === 'quote') return `<blockquote>${text}</blockquote>`
      if (block.type === 'code') return `<pre><code>${text}</code></pre>`
      return `<p>${text}</p>`
    })
    .join('\n')
}

function buildRss(published) {
  const items = published
    .map(
      (post) => `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${escapeXml(`${siteUrl}/blog/${post.slug}`)}</link>
    <guid>${escapeXml(`${siteUrl}/blog/${post.slug}`)}</guid>
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    <description>${escapeXml(post.excerpt)}</description>
    <content:encoded><![CDATA[${contentToHtml(post.content)}]]></content:encoded>
  </item>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>Ian Tirop — Blog</title>
  <link>${escapeXml(siteUrl)}</link>
  <description>Notes on code, design, and things I learn by building.</description>
${items}
</channel>
</rss>
`
}

function buildRobots() {
  return `User-agent: *\nDisallow: /write\nDisallow: /admin\nSitemap: ${siteUrl}/sitemap.xml\n`
}

const published = await loadPublishedPosts()

writeFileSync(path.join(publicDir, 'sitemap.xml'), buildSitemap(published))
writeFileSync(path.join(publicDir, 'rss.xml'), buildRss(published))
writeFileSync(path.join(publicDir, 'robots.txt'), buildRobots())

console.log(`[generate-feeds] wrote sitemap.xml, rss.xml, and robots.txt for ${published.length} posts.`)
