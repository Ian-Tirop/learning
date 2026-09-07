# Ian Tirop — Blog

A personal blog built with React, Vite, and a small Postgres-backed API.
Routed multi-page site, light/dark theme, real shared comments with emoji
reactions, single-admin auth for publishing, a public "submit a post"
review workflow, a poll/quiz on each post, related posts, an AI chat
widget, and SEO basics (sitemap, RSS, Open Graph).

This started as a fully static, no-backend demo. It now has a real
database and a real login — see [Backend & data model](#backend--data-model)
for what that changed and why.

**Live**: https://learning-peach-two.vercel.app

## Features

- **Pages**: Home, Blog (list + search + tag filter), individual post pages,
  About, Contact, Submit, Admin login, and a 404.
- **Light/dark theme**: toggled from the nav, persisted to `localStorage`,
  and applied before first paint (an inline script in `index.html` sets it
  ahead of the React bundle, so there's no flash of the wrong theme).
- **Generated cover art**: every post gets an on-brand SVG cover (gradient +
  icon + pattern) instead of stock photos — see `src/components/PostCover.jsx`.
- **Real, shared engagement per post**: like/dislike, a 5-star rating, and
  comments with nested replies and **emoji reactions** (👍 ❤️ 😂 🎉 😮 👎) —
  every visitor sees the same live data, stored in Postgres. See
  [Backend & data model](#backend--data-model).
- **Single-admin auth**: only Ian can create/edit/publish/delete posts
  directly, and only he can approve or reject a reader's submission — see
  [Auth & the admin/reader view](#auth--the-adminreader-view).
- **Reader submissions with review**: anyone can write a post at `/submit`;
  it goes to Ian for review before it's ever public. See
  [Reader submissions](#reader-submissions).
- **Reading progress bar** and an **estimated reading time**, both scoped to
  an open article (`src/components/ReadingProgress.jsx`,
  `src/lib/estimateReadingTime.js`), plus **copy-link / share-to-X** and an
  **author byline** on every post.
- **Interactive polls and quizzes** on every seeded post — a single-choice
  poll with a live results bar, and a "quick check" multiple-choice question
  with an explanation, both defined per post in `src/data/postExtras.js` and
  rendered by `src/components/Poll.jsx` / `src/components/Quiz.jsx`. A post
  without an entry in `postExtras.js` simply renders without this section.
  (These stay `localStorage`-only, per-browser — see that file's own note.)
- **Reader feedback form on the Contact page**: visitors can flag which
  topics they're interested in (pulled live from the tags used across posts),
  say whether they'd like to write a guest post, and leave general feedback —
  see `src/components/ReaderFeedback.jsx`. Still `localStorage`-only (not
  part of this pass — see that component for the honest caveat).
- **Discovery on every post**: a table of contents (for posts with 2+
  subheadings), clickable tags that deep-link into a pre-filtered Blog page
  (`/blog?tag=...`), and a "Related posts" section ranked by shared tags —
  see [Content depth & navigation](#content-depth--navigation).
- **Global search** from the nav on every page, with live results as you
  type and a "New" badge on the most recent post — see
  [Content depth & navigation](#content-depth--navigation).
- **On the homepage**: recent posts, a "Reader favorites" list of the most
  liked posts, a "What readers say" pull-quote section sourced from real
  comment data, a "Meet Ian Tirop" author spotlight, and a newsletter signup
  form (still `localStorage`-only).
- **SEO basics**: per-page `<title>`/meta description/canonical URL, a
  generated `sitemap.xml` and `rss.xml` (built from the live database when
  one's attached), a `robots.txt`, an Open Graph/Twitter preview image, and
  a skip-to-content link — see [SEO & discoverability](#seo--discoverability)
  and [Accessibility](#accessibility).
- **Animated hero background**: three softly blurred, slowly drifting blobs
  in the site's own accent colors, plus a faint panning dot grid (the same
  dot motif `PostCover.jsx` uses for post covers) — built entirely from
  existing CSS custom properties, no new colors. Low opacity and corner
  placement keep it from ever fighting the gradient headline for contrast;
  disabled in favor of a static version under `prefers-reduced-motion`.
- **Two-column hero on wider screens** (≥900px; phones/tablets keep the
  original centered layout unchanged): a floating "code window" card —
  window-chrome dots in the three accent colors, a snippet describing the
  blog itself — with a few topic tags floating at its corners, plus a
  pill-styled intro badge and a bouncing scroll cue down to the topics row.
- **AI chat widget** (bottom-right) that answers questions about the blog,
  grounded in the live post content — shows up automatically once
  `ANTHROPIC_API_KEY` is configured, and stays hidden otherwise. See
  [AI chat widget](#ai-chat-widget).
- Distinctive editorial type (Fraunces for headings, system sans for body),
  reduced-motion-aware entrance animations, and themed selection/scrollbar
  styling.

## Getting started

```bash
npm install
npm run dev       # start the Vite dev server (frontend only — see below)
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # oxlint
```

Plain `vite`/`npm run dev` serves **only the frontend** — it has no idea
`/api/*` exists, so every API call fails locally unless you also run the
Vercel CLI's dev server, which understands both:

```bash
npm install -g vercel
vercel dev
```

`vercel dev` needs the same environment variables production does (see
[Deploying](#deploying)) — either `vercel env pull` after linking the
project, or a local `.env` (`cp .env.example .env` and fill it in).

`dev` and `build` both regenerate `public/sitemap.xml`, `public/rss.xml`,
and `public/robots.txt` first (via `predev`/`prebuild` →
`scripts/generate-feeds.js`) — from the live database if `DATABASE_URL` is
set, otherwise from the static seed posts, so plain `npm run dev` still
works with zero setup. Set `SITE_URL` for a real deploy so those files (and
the canonical URLs the app sets at runtime) point at your actual domain:

```bash
SITE_URL=https://your-domain.com npm run build
```

## Deploying

Built for Vercel (the serverless functions under `api/` use its Node
runtime and its file-based routing convention).

1. **Attach a Postgres database.** In the Vercel dashboard: Storage → add a
   Postgres database (Neon-backed) to this project. That sets
   `DATABASE_URL`/`POSTGRES_URL` for you automatically.
2. **Run the migration once**, pointed at that database, to create the
   schema and seed the original posts + their comments:
   ```bash
   vercel env pull .env   # or fill in .env by hand from .env.example
   npm run migrate
   ```
   It's idempotent — safe to re-run; it skips seeding if `posts` already
   has rows.
3. **Set the rest of the environment variables** in Vercel's Settings →
   Environment Variables:
   - `ADMIN_PASSWORD` — your login password for `/admin/login`.
   - `ADMIN_SESSION_SECRET` — any long random string, used to sign the
     login session cookie (e.g. `openssl rand -hex 32`).
   - `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com), for the chat widget.
   - `SITE_URL` — your real domain, for the sitemap/RSS/canonical links.
4. **Push to GitHub and import the repo on [vercel.com](https://vercel.com/new)**
   (or connect it if already imported) — it builds and deploys
   automatically, and every future push redeploys.

None of the four app secrets above are optional in the sense of "the site
breaks without them" — each one just degrades gracefully to a clear error
or an empty/local fallback if unset (see each feature's section below), so
you can add them incrementally.

## Project structure

```
api/
  _lib/
    db.js                  Postgres query helpers (Neon serverless driver), shared by every route
    auth.js                 Signs/verifies the admin session cookie
    http.js                 withErrorHandling() — any route's unexpected throw becomes a clean
                            JSON 500 instead of Vercel's generic crash page
  admin/                    login.js, logout.js, session.js
  posts/                    index.js (list/create), [slug].js (get/update/delete)
  post-reactions/           [slug].js (like/dislike/rating) — a sibling route, not nested under
                            posts/[slug]/, to avoid a routing collision (see note below)
  comments/                 index.js (list/create), [id].js (edit/delete), top.js (homepage testimonials)
  comment-reactions/        [id].js (emoji toggle) — same sibling-route reasoning as post-reactions
  chat.js                  Anthropic proxy for the chat widget
  chat-status.js           Tells the frontend whether ANTHROPIC_API_KEY is set, so the widget can
                            hide itself instead of showing a chat button that always fails
db/
  schema.sql                Table definitions (posts, comments, comment_reactions, post_reactions)
vercel.json                 SPA rewrite for client-side routing on Vercel
.env.example                 Every environment variable the app reads, documented
scripts/
  migrate.js                One-time (idempotent) schema + seed-data setup — see Deploying
  generate-feeds.js        Builds sitemap.xml/rss.xml/robots.txt (live DB, or static fallback)
src/
  context/
    AdminContext.jsx        Admin session state + the admin/reader view-mode toggle
  data/
    posts.js               The ORIGINAL static posts — now only used to seed the database
                            once (scripts/migrate.js) and as a fallback when no DB is attached
    postStore.js            Thin client for /api/posts (replaces the old localStorage version)
    postExtras.js           Per-post poll + quiz content, keyed by slug (still static)
    coverPresets.js         The gradient+icon+pattern options offered in the cover picker
    social.js               Shared social links (nav footer + contact page)
  hooks/
    useLocalStorage.js      Generic localStorage-backed state (still used by Poll/Quiz/Newsletter/etc.)
    usePostEngagement.js    Live comments + reactions for a post, via the API
    useTheme.js             Light/dark theme state
    useDocumentTitle.js     Sets the browser tab title per route
    useMetaDescription.js   Updates <meta name="description"> per route
    useCanonicalUrl.js      Updates <link rel="canonical"> per route
    useMetaRobots.js        Sets/clears <meta name="robots">, used to noindex /write, /admin, and drafts
  lib/
    apiClient.js             Small fetch wrapper used by every API call
    visitorId.js              A random per-browser id, so an anonymous visitor can recognize
                              (and edit/delete/react to) their own comments — not an auth mechanism
    mySubmissions.js          Tracks a reader's own pending post submissions by private edit token
    postBody.js             Markdown-ish text <-> content-block array, for the editor
    postRanking.js           getMostLiked / getRelatedPosts
    headings.js              Extracts {text, id} headings from a post's content blocks
    searchPosts.js           Shared title/excerpt/tag search, used by NavSearch and the Blog page
    isRecent.js              Date-based check backing the "New" badge
    slugify.js, estimateReadingTime.js, formatDate.js, formatRelativeDate.js
  components/              Nav, NavSearch, Footer, PostCover, PostEngagement, CommentSection,
                            ContentBlocks, ReadingProgress, Poll, Quiz,
                            ReaderFeedback, Newsletter, ChatWidget, ThemeToggle
  pages/                    Home, Blog, BlogPost, About, Contact, Submit, NotFound
  pages/admin/              Login
  pages/write/              WriteDashboard (list + review queue), PostEditor (create/edit)
```

## Backend & data model

Postgres (via Neon's serverless driver, `@neondatabase/serverless`), four
tables (`db/schema.sql`):

- **`posts`** — every post, any status. `status` is one of `draft`,
  `pending`, `published`, `rejected`. A pending post also carries
  `submitted_by_name`/`submitted_by_email` and a private `edit_token`.
- **`comments`** — flat table with a self-referential `parent_id` for
  replies, plus `mention_of` for the "replying to a reply" case (flattened
  one level, same as before) and `visitor_id` (see below).
- **`comment_reactions`** — `(comment_id, visitor_id, emoji)`, one row per
  reaction; toggling deletes the row instead of un-reacting some other way.
- **`post_reactions`** — one row per `(post_slug, visitor_id)` holding that
  visitor's like/dislike and star rating.

**No visitor accounts.** Every browser gets a random id
(`src/lib/visitorId.js`, in `localStorage`) purely so it can recognize its
*own* comments and reactions — enough to let someone edit or delete their
own comment, or toggle their own emoji reaction, without a login. It is not
authentication and isn't meant to resist someone clearing their storage;
the only real login on this site is the single admin one.

**Aggregate counts** (a post's likes/rating, a comment's reaction counts)
are computed live with a `GROUP BY` in `api/_lib/db.js`, and the requesting
visitor's own reaction is excluded from that aggregate and added back in
client-side — that's what makes a like/react toggle feel instant without a
refetch, and it's why a returning visitor's older reaction is never counted
twice.

**Seed data**: `scripts/migrate.js` copies the original 8 static posts and
their seed comments from `src/data/posts.js` into the database once. After
that, `posts.js` is no longer the source of truth for anything the site
renders — it's a historical seed and a fallback for `generate-feeds.js`
when no database is attached.

## Auth & the admin/reader view

One login, one password, no accounts table — `ADMIN_PASSWORD` is checked
server-side (`api/admin/login.js`) against a constant-time comparison, and
success sets an `HttpOnly`, signed session cookie (`api/_lib/auth.js`,
HMAC'd with `ADMIN_SESSION_SECRET`). Every mutating endpoint
(create/update/delete a post outside a reader's own pending submission,
approve/reject) checks that cookie server-side — the frontend's admin state
(`src/context/AdminContext.jsx`) is only ever a UI convenience, never the
actual gate.

**Admin/reader view toggle**: once logged in, a button in the nav reads
**Preview as reader** — click it to flip into reader view without logging
out. That sets a `viewMode` (in `sessionStorage`, not the login itself)
that hides every admin-only affordance (the Write pencil icon, "Edit this
post" links, the review queue), and a persistent, high-contrast banner
appears across the top of every page ("👁️ Previewing the site as a reader
would see it — no admin controls are showing.") so it's never ambiguous
which mode you're in. The nav button itself relabels to **Exit preview**;
either it or the banner's own **Return to admin view** button flips you
back.

## Reader submissions

Anyone can go to `/submit` and write a post — name, title, tags, excerpt,
body (same markdown-ish syntax the admin editor uses), optional link. It's
always created with `status: 'pending'` server-side (`api/posts/index.js`
ignores any status a non-admin client sends), and the response includes a
private **edit token**, saved to that browser's `localStorage`
(`src/lib/mySubmissions.js`) so the same person can come back to
`/submit/edit/:slug?token=...` and revise it — but only while it's still
`pending`; once Ian approves or rejects it, that token stops working for
edits (`api/posts/[slug].js` enforces this server-side).

Ian reviews everything pending from `/write` (admin-only — see above): a
**Pending review** section up top lists each submission with **Approve**
(→ `published`), **Reject** (→ `rejected`, with an optional note), **Edit**
(take it over directly, same editor as any other post), and **Preview**.

## Writing and editing posts (as admin)

Once logged in, click the pencil icon in the nav (or go to `/write`) to see
every post — draft, pending, published, rejected — with **New post**,
**Preview**, **Edit**, and **Delete** actions (delete is permanent now —
there's a real row to remove, not a `localStorage` flag to unhide later).

The editor (`/write/new` or `/write/:slug`) has a title, slug, tags, date,
excerpt, an optional external link, a visual cover picker, and a body editor
using the same tiny markdown-ish syntax as `/submit`:

- A blank line starts a new paragraph.
- `### text` becomes a subheading.
- `> text` becomes a pulled quote.
- Triple-backtick fences (` ``` `) become a code block.

A **Write / Preview** toggle renders the body through the exact same
component the live post page uses. Reading time is auto-estimated from the
body (~200 words/minute) unless you edit the field yourself. **Save draft**
keeps a post unlisted but reachable by direct link (tagged accordingly, and
`noindex`ed); **Publish** makes it public everywhere.

## Polls, quizzes, and reader feedback

These two features weren't part of this backend pass and are still
per-browser, exactly as before:

- Each poll option's displayed vote share includes a small deterministic
  "baseline" count (hashed from the post slug + option text) so a first-time
  visitor doesn't see an empty 0/0 poll — your own vote is added on top of
  that baseline, and un-voting removes it.
- A quiz answer, once picked, is locked in and marked correct/incorrect
  against `correctIndex` in `postExtras.js`; **Try again** clears the stored
  answer so you can retry.
- Add a poll/quiz to a post by adding a matching entry to `postExtras.js`
  (keyed by slug); posts without an entry there just skip the section.
- The Contact page's reader feedback form and the homepage newsletter form
  still write to `localStorage` only (`blog:readerFeedback`,
  `blog:subscribers`) — real, testable interactions with no admin view for
  them yet. Same shape of extension as comments got in this pass, if wanted
  later: a table, an endpoint, done.

## Content depth & navigation

- **Related posts**: `getRelatedPosts` in `src/lib/postRanking.js` ranks
  every other post by how many tags it shares with the current one, falling
  back to recency to fill out the list — so a post with little tag overlap
  with the rest of the blog still gets three related links instead of none.
- **Table of contents**: `src/lib/headings.js` pulls every `h3` block out of
  a post's content and slugifies it into an anchor id; `ContentBlocks.jsx`
  stamps that same id onto the rendered heading so the two never drift out
  of sync. Shown only when a post has 2+ subheadings.
- **Tag deep-linking**: each tag chip on a post links to
  `/blog?tag=<tag>`; the Blog page reads that query param via
  `useSearchParams` to preselect its filter, so the URL is shareable/
  bookmarkable. The tag-filter buttons on the Blog page itself write back to
  the URL the same way.
- **Global search**: a search icon in the nav (`src/components/NavSearch.jsx`,
  every page, desktop and mobile) opens a live-results dropdown as you type —
  matching against title, excerpt, and tags via the shared
  `src/lib/searchPosts.js` helper (also used by the Blog page's own search
  box, so results are consistent everywhere). Enter, or "See all results",
  goes to `/blog?q=<query>` — the Blog page reads and writes that param the
  same way it does `?tag=`, so `?tag=` and `?q=` can combine and the URL
  stays shareable.
- **"New" badge**: the single most recently published post gets a small
  "New" badge on the Home page's Recent Posts and the Blog list, but only
  while it's within 14 days of today (`src/lib/isRecent.js`, checked against
  `Date.now()` — not hardcoded) — so it never becomes a stale, permanently
  "new" label as posts age.

## SEO & discoverability

- `sitemap.xml`, `rss.xml`, and `robots.txt` are static files generated at
  build time (`scripts/generate-feeds.js`) — from the live database when
  `DATABASE_URL` is set (so newly published/approved posts show up on the
  next deploy), falling back to the static seed posts otherwise. Per-page
  `<title>`, meta description, and canonical URL update on every route via
  `useDocumentTitle`/`useMetaDescription`/`useCanonicalUrl`.
- Open Graph/Twitter Card tags live once, statically, in `index.html`
  (title, description, and `/og-cover.png`, a 1200×630 image pre-rendered
  from a small HTML template). Most link-unfurling bots (Slack, X, iMessage,
  Facebook) don't execute JavaScript, so they only ever see that static
  homepage preview, not a per-post one — real per-post social previews
  would need server-side rendering, out of scope here.
- **Noindexed on purpose**: `/write`, `/admin/login`, and any post that
  isn't `status: 'published'` get `<meta name="robots" content="noindex,
  nofollow">` via `useMetaRobots`.
- `og-cover.png` isn't generated by a build script — it's a pre-rendered
  static asset in `public/`. Regenerate it by hand (screenshot a matching
  HTML template at 1200×630) if the tagline or brand colors change.

## Accessibility

- A **skip-to-content link** (`.skip-link` in `App.jsx`/`App.css`) is the
  first focusable element on every page — invisible until it receives
  keyboard focus, then jumps past the nav to `#main-content`.
- Transient confirmations (copy-link, copied-to-clipboard, poll/quiz
  feedback, newsletter/reader-feedback/submission success and error
  messages) use `aria-live`/`role="status"`/`role="alert"` so screen reader
  users get notified without needing to find the change visually.
- A `.sr-only` utility class in `App.css` is available for visually-hidden,
  screen-reader-only text.

## AI chat widget

The chat button in the bottom-right corner (`src/components/ChatWidget.jsx`)
talks to Claude (Anthropic) through a small serverless proxy at
`api/chat.js`.

**Graceful hiding when unconfigured**: on mount, the widget calls
`api/chat-status.js`, which reports whether `ANTHROPIC_API_KEY` is set
(without exposing the key itself). If it isn't — or the endpoint is
unreachable — the widget renders nothing at all rather than showing a chat
button that always fails. Set `ANTHROPIC_API_KEY` in the Vercel project's
environment variables and redeploy to turn it on; no code change needed.

**Why a backend at all** for the API key: it must never be shipped to the
browser — anyone could read it out of the JS bundle in devtools and rack up
usage on it. `api/chat.js` is the one place the key lives; the frontend
only ever calls same-origin `/api/chat`.

**How it's grounded**: on every request, `api/chat.js` queries the live
database for every published post (title, date, tags, excerpt) and builds
that into its system prompt — so a post approved five minutes ago is
already something the assistant can talk about. If the database isn't
reachable, it falls back to the static seed posts rather than failing
outright. The prompt also tells the model to point contact requests at
`/contact` rather than stating an email or phone number itself, and to
decline questions unrelated to the blog.

**Current limits**: each request caps history to the last 20 messages and
512 reply tokens, and the widget shows a plain error bubble on any failure
after it's already open (network issue, model error) rather than breaking —
a missing key is handled earlier, by not showing the widget at all. There's no
persistent rate-limiting yet (a stateless serverless function can't cheaply
track that on its own) — if the widget gets real traffic, put it behind
Vercel's built-in abuse protection or add a proper store (Upstash Redis,
Vercel KV) before relying on it unattended.

## Tech

- [React 19](https://react.dev) + [React Router 7](https://reactrouter.com)
- [Vite](https://vite.dev) for dev/build tooling
- [Vercel](https://vercel.com) serverless functions (Node runtime) for the API
- [Neon](https://neon.tech) Postgres via `@neondatabase/serverless`, provisioned through Vercel
- [Anthropic](https://www.anthropic.com) Claude for the chat widget
- [Oxlint](https://oxc.rs) for linting
- Plain CSS (custom properties for theming, no CSS framework)
