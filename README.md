# Ian Tirop — Blog

A personal blog and small publishing platform built with React, Vite, and a
Postgres-backed API. Routed multi-page site, light/dark theme with a
view-transition crossfade, real shared comments with emoji reactions and
moderation, reader accounts with a tabbed profile dashboard, a public
"submit a post" review workflow, scheduled publishing, real email
(newsletter + transactional), two-factor admin auth, an AI chat widget, and
SEO basics (sitemap, RSS, Open Graph).

This started as a fully static, no-backend demo. It now has a real
database, real accounts, and real email — see
[Backend & data model](#backend--data-model) for what that changed and why.

**Live**: https://learning-peach-two.vercel.app

## Features

- **Pages**: Home, Blog (list + search + tag filter), Topics (every tag with
  a post count), individual post pages, About, Contact, Submit, reader
  signup/login/profile, admin login, and a 404.
- **Light/dark theme**: toggled from the nav, persisted to `localStorage`,
  applied before first paint (an inline script in `index.html` sets it ahead
  of the React bundle, so there's no flash of the wrong theme), and
  crossfades with the View Transitions API on browsers that support it.
- **Generated cover art**: every post gets an on-brand SVG cover (gradient +
  icon + pattern) instead of stock photos — see `src/components/PostCover.jsx`.
- **Real, shared engagement per post**: like/dislike, a 5-star rating, and
  comments with nested replies, **emoji reactions** (👍 ❤️ 😂 🎉 😮 👎), and a
  **Report** flag readers can raise on an abusive comment — every visitor
  sees the same live data, stored in Postgres. See
  [Backend & data model](#backend--data-model) and
  [Comment moderation](#comment-moderation).
- **Reader accounts**: sign up, log in, reset a forgotten password, and get
  a tabbed **profile dashboard** — submissions, liked posts, saved posts,
  personalized recommendations, and account settings all in one place. See
  [Reader accounts & profile](#reader-accounts--profile).
- **Single-admin auth with two-factor authentication**: only Ian can
  create/edit/publish/delete posts directly, and only he can approve or
  reject a reader's submission — protected by a password plus optional TOTP
  2FA with backup codes and a recovery-email alert. See
  [Auth: admin vs. reader accounts](#auth-admin-vs-reader-accounts).
- **Tabbed admin dashboard**: overview, review queue, every post regardless
  of status, full analytics with drill-downs and leaderboards, and security
  settings, all in one place at `/write`. See
  [Admin dashboard](#admin-dashboard).
- **Reader submissions with review**: anyone can write a post at `/submit`;
  it goes to Ian for review before it's ever public. See
  [Reader submissions](#reader-submissions).
- **Scheduled publishing**: set a future publish time on any post; a daily
  Vercel Cron job flips it live automatically. See
  [Scheduled publishing](#scheduled-publishing).
- **Newsletter and transactional email**: a real subscriber list gets
  emailed (via Resend) when a post goes live, and readers get emailed when
  their own submission is approved or rejected — both degrade gracefully to
  a no-op if email isn't configured. See
  [Newsletter & transactional email](#newsletter--transactional-email).
- **Reading progress bar** and an **estimated reading time**, both scoped to
  an open article (`src/components/ReadingProgress.jsx`,
  `src/lib/estimateReadingTime.js`), plus **copy-link / share-to-X**, an
  **author byline**, a **"Listen to this post"** text-to-speech button
  (`src/components/ListenButton.jsx`, via the Web Speech API — no
  dependency), and a **"Suggest an edit"** form on every post
  (`src/components/SuggestEdit.jsx`) that lands in the same admin feedback
  inbox as the Contact page's form.
- **Syntax-highlighted code blocks** via highlight.js, auto-detecting the
  language per block since posts are never tagged one.
- **Interactive polls and quizzes** on every seeded post — a single-choice
  poll with a live results bar, and a "quick check" multiple-choice question
  with an explanation, both defined per post in `src/data/postExtras.js` and
  rendered by `src/components/Poll.jsx` / `src/components/Quiz.jsx`. A post
  without an entry in `postExtras.js` simply renders without this section.
  (These stay `localStorage`-only, per-browser — see that file's own note.)
- **Discovery on every post**: a table of contents (for posts with 2+
  subheadings), clickable tags that deep-link into a pre-filtered Blog page
  (`/blog?tag=...`), a "Related posts" section ranked by shared tags, and a
  **"Recommended for you"** section on a reader's own profile, personalized
  from their liked/saved tags with a "most liked" fallback for a brand-new
  account — see [Content depth & navigation](#content-depth--navigation).
- **Global search** from the nav on every page, with live results as you
  type (matching title, excerpt, tags, *and* body content) and a "New"
  badge on the most recent post — see
  [Content depth & navigation](#content-depth--navigation).
- **On the homepage**: recent posts, a "Reader favorites" list of the most
  liked posts, a "What readers say" pull-quote section sourced from real
  comment data, a "Meet Ian Tirop" author spotlight, and a real newsletter
  signup form.
- **Toast notifications** (`src/context/ToastContext.jsx`) confirm actions
  site-wide — commenting, saving a post, and every admin publish/schedule/
  approve/reject/delete — plus skeleton shimmer loaders
  (`src/components/Skeleton.jsx`) while content is in flight.
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
runtime and its file-based routing convention). **Vercel's Hobby plan caps
a project at 12 serverless functions and daily-or-slower cron jobs** — this
project sits right at that function cap, so any new backend endpoint has to
be folded into an existing dynamic `[action].js` dispatch file
(`api/admin/[action].js`, `api/accounts/[action].js`, `api/inbox/[action].js`)
rather than added as a new file. Each dispatch file reads `req.query.action`
plus `req.method` to route internally, so public URL paths stay stable
regardless of how the functions are packaged.

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
   Environment Variables (see `.env.example` for the full, documented list):
   - `ADMIN_PASSWORD` — your login password for `/admin/login`.
   - `ADMIN_SESSION_SECRET` — any long random string, used to sign the
     admin and reader session cookies (e.g. `openssl rand -hex 32`).
   - `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com), for the chat widget.
   - `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — from
     [resend.com](https://resend.com), for the newsletter and transactional
     emails (see [Newsletter & transactional email](#newsletter--transactional-email)).
   - `CRON_SECRET` — any long random string, checked against the daily
     scheduled-publish cron request (see [Scheduled publishing](#scheduled-publishing)).
   - `SITE_URL` — your real domain, for the sitemap/RSS/canonical links.
4. **Push to GitHub and import the repo on [vercel.com](https://vercel.com/new)**
   (or connect it if already imported) — it builds and deploys
   automatically, and every future push redeploys.

None of the app secrets above are optional in the sense of "the site breaks
without them" — each one just degrades gracefully to a clear error, a
skipped step, or a hidden feature if unset (see each feature's section
below), so you can add them incrementally.

**Deployment Protection**: if this project ever has Vercel's SSO/deployment
protection turned on with no custom domain attached, *every* URL — including
the stable production alias — redirects visitors to a Vercel login page
instead of the site. Check Project Settings → Deployment Protection if the
live site ever seems unreachable to a logged-out visitor.

## Project structure

```
api/
  _lib/
    db.js                  Postgres query helpers (Neon serverless driver), shared by every route
    auth.js                 Signs/verifies admin + reader session cookies, and the short-lived
                            "pending 2FA" token
    totp.js                 Hand-rolled RFC 6238 TOTP (base32, HOTP/HMAC-SHA1) for admin 2FA
    email.js                Resend-backed email sends; no-ops gracefully if unconfigured
    http.js                 withErrorHandling() — any route's unexpected throw becomes a clean
                            JSON 500 instead of Vercel's generic crash page
  admin/[action].js         Admin login/logout/session, two-factor setup+verify+disable,
                            recovery email, analytics, and the daily cron-publish-scheduled job —
                            one dispatch file, kept under the 12-function cap (see Deploying)
  accounts/[action].js      Reader signup/login/logout/session, my-posts/liked-posts/saved-posts,
                            update-profile, change-password, forgot/reset-password
  inbox/[action].js         Newsletter subscribe/unsubscribe and the reader-feedback form
  posts/                    index.js (list/create), [slug].js (get/update/delete)
  post-reactions/           [slug].js (like/dislike/rating) — a sibling route, not nested under
                            posts/[slug]/, to avoid a routing collision
  comments/                 index.js (list/create), [id].js (edit/delete), top.js (homepage testimonials)
  comment-reactions/        [id].js (emoji toggle, and comment reporting via the same route's
                            `report` flag — same sibling-route reasoning as post-reactions)
  chat.js                  Anthropic proxy for the chat widget
  chat-status.js           Tells the frontend whether ANTHROPIC_API_KEY is set, so the widget can
                            hide itself instead of showing a chat button that always fails
db/
  schema.sql                Table definitions — see Backend & data model
vercel.json                 SPA rewrite for client-side routing, plus the daily cron schedule
.env.example                 Every environment variable the app reads, documented
scripts/
  migrate.js                One-time (idempotent) schema + seed-data setup — see Deploying
  generate-feeds.js        Builds sitemap.xml/rss.xml/robots.txt (live DB, or static fallback)
src/
  context/
    AdminContext.jsx        Admin session state + the admin/reader view-mode toggle
    AccountContext.jsx      Reader session state (separate from the admin session)
    ToastContext.jsx        Site-wide toast notifications
  data/
    posts.js               The ORIGINAL static posts — now only used to seed the database
                            once (scripts/migrate.js) and as a fallback when no DB is attached
    postStore.js            Thin client for /api/posts
    accountStore.js          Thin client for /api/accounts/[action]
    adminStore.js            Thin client for the admin-only parts of /api/admin/[action]
    inboxStore.js            Thin client for /api/inbox/[action] (newsletter + feedback)
    postExtras.js            Per-post poll + quiz content, keyed by slug (still static)
    coverPresets.js          The gradient+icon+pattern options offered in the cover picker
    social.js               Shared social links (nav footer + contact page)
  hooks/
    useLocalStorage.js      Generic localStorage-backed state (still used by Poll/Quiz/theme)
    usePostEngagement.js    Live comments + reactions (+ reporting) for a post, via the API
    useTheme.js             Light/dark theme state, crossfaded via the View Transitions API
    useCountUp.js            Animates a stat number counting up from 0
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
    postRanking.js           getMostLiked / getRelatedPosts / getRecommendedPosts
    headings.js              Extracts {text, id} headings from a post's content blocks
    searchPosts.js           Shared title/excerpt/tag/body search, used by NavSearch and the Blog page
    tagCounts.js              Tallies posts per tag, for the Topics page
    isRecent.js              Date-based check backing the "New" badge
    slugify.js, estimateReadingTime.js, formatDate.js, formatRelativeDate.js
  components/              Nav, NavSearch, Footer, PostCover, PostEngagement, CommentSection,
                            ContentBlocks (incl. syntax highlighting), ReadingProgress, ListenButton,
                            SuggestEdit, Poll, Quiz, ReaderFeedback, Newsletter, ChatWidget,
                            ThemeToggle, Skeleton
  pages/                    Home, Blog, BlogPost, Topics, About, Contact, Submit, NotFound
  pages/account/            AccountSignup, AccountLogin, ForgotPassword, ResetPassword,
                            Profile (tabbed reader dashboard)
  pages/admin/              Login, Security (thin wrapper), SecurityPanel (2FA + recovery email,
                            shared with the admin dashboard's Security tab)
  pages/write/              WriteDashboard (tabbed admin dashboard), PostEditor (create/edit)
```

## Backend & data model

Postgres (via Neon's serverless driver, `@neondatabase/serverless`), ten
tables (`db/schema.sql`):

- **`accounts`** — reader accounts: email, hashed password, display name,
  password-reset token/expiry. Entirely separate from the single admin
  login — this is a real accounts table because there can be many readers,
  unlike the one admin.
- **`posts`** — every post, any status. `status` is one of `draft`,
  `pending`, `published`, `rejected`, `scheduled`. Carries an optional
  `author_account_id` (if written by a logged-in reader),
  `scheduled_at` (for [scheduled publishing](#scheduled-publishing)),
  `newsletter_sent`, and optional `series_name`/`series_order`. A pending
  post also carries `submitted_by_name`/`submitted_by_email` and a private
  `edit_token`.
- **`comments`** — flat table with a self-referential `parent_id` for
  replies, `mention_of` for the "replying to a reply" case (flattened one
  level), an optional `account_id` if the commenter was logged in, and
  `visitor_id` (see below).
- **`comment_reactions`** — `(comment_id, visitor_id, emoji)`, one row per
  reaction; toggling deletes the row instead of un-reacting some other way.
- **`comment_reports`** — `(comment_id, visitor_id)`, one row per reporter
  so the same visitor can't inflate a comment's report count; surfaced to
  admin in [Comment moderation](#comment-moderation).
- **`post_reactions`** — one row per `(post_slug, visitor_id)` holding that
  visitor's like/dislike and star rating, with an optional `account_id`.
- **`saved_posts`** — `(account_id, post_slug)`, a reader's bookmarked
  articles. Account-only (no anonymous equivalent) since a bookmark's whole
  point is to persist across devices, which only an account can do.
- **`admin_settings`** — single-row-per-key settings for the one admin
  login: TOTP secret, 2FA-enabled flag, hashed backup codes, recovery email.
  Not an `accounts` row, since there's exactly one admin, gated by
  `ADMIN_PASSWORD`.
- **`subscribers`** — the real, shared newsletter list.
- **`feedback`** — reader feedback from the Contact page's "what are you
  into" form and every post's "Suggest an edit" form (`post_slug`/
  `post_title` are set only for the latter).

**No visitor accounts required for engagement.** Every browser gets a
random id (`src/lib/visitorId.js`, in `localStorage`) purely so it can
recognize its *own* comments and reactions — enough to let someone edit or
delete their own comment, or toggle their own emoji reaction/report,
without a login. It is not authentication and isn't meant to resist someone
clearing their storage; a *real* login (reader account or admin) is what
`account_id` on a row represents.

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

## Auth: admin vs. reader accounts

Two entirely separate login systems, sharing only the HMAC-signing helper
in `api/_lib/auth.js`:

**Admin** — one login, one password, no accounts-table row.
`ADMIN_PASSWORD` is checked server-side (`api/admin/[action].js`) against a
constant-time comparison, and success sets an `HttpOnly`, signed session
cookie (`admin_session`). Every mutating endpoint (create/update/delete a
post outside a reader's own pending submission, approve/reject) checks that
cookie server-side — the frontend's admin state
(`src/context/AdminContext.jsx`) is only ever a UI convenience, never the
actual gate. See [Two-factor authentication](#two-factor-authentication)
for the optional second factor on top of the password.

**Reader accounts** — a real `accounts` table (email + scrypt-hashed
password), its own signed session cookie (`reader_session`), sign-up/login/
logout/forgot-password/reset-password all under `api/accounts/[action].js`,
and its own React context (`src/context/AccountContext.jsx`). A reader
account is what lets someone submit a post, comment, like, rate, and save
articles from any device with a consistent identity, instead of relying on
the per-browser `visitor_id`/edit-token fallback described in
[Backend & data model](#backend--data-model) — but none of that requires an
account; it's an upgrade, not a gate.

**Admin/reader view toggle** (admin-only): once logged in as admin, a
button in the nav reads **Preview as reader** — click it to flip into
reader view without logging out. That sets a `viewMode` (in
`sessionStorage`, not the login itself) that hides every admin-only
affordance (the Write pencil icon, "Edit this post" links, the review
queue), and a persistent, high-contrast banner appears across the top of
every page ("👁️ Previewing the site as a reader would see it — no admin
controls are showing.") so it's never ambiguous which mode you're in. The
nav button itself relabels to **Exit preview**; either it or the banner's
own **Return to admin view** button flips you back.

## Two-factor authentication

Optional, on top of `ADMIN_PASSWORD`, via `/admin/security` or the
dashboard's Security tab (`src/pages/admin/SecurityPanel.jsx` — one
component, shared by both):

- **Setup**: scan a QR code (generated server-side with the `qrcode`
  package — the secret never touches the client except as that one image)
  into any TOTP authenticator app, confirm a 6-digit code, and you're given
  8 single-use **backup codes** — the only way back in if you lose the
  authenticator, since there's no email-based reset for the admin login
  itself.
- **The TOTP implementation is hand-rolled** (`api/_lib/totp.js`, using
  only `node:crypto` — no dependency) rather than pulled from a package,
  and was verified against the official RFC 6238 test vector before ever
  being wired into login, given how bad a subtle bug here would be (an
  admin lockout).
- **Recovery email**: an optional email address that gets a heads-up
  whenever 2FA is turned on or off — useful if that ever happens without
  you. Sent via the same Resend integration as
  [Newsletter & transactional email](#newsletter--transactional-email);
  a no-op if Resend isn't configured.
- Login becomes two steps once 2FA is on: password → short-lived
  "pending 2FA" token → a 6-digit code or a backup code to get the real
  `admin_session` cookie.

## Admin dashboard

`/write` (admin-only, redirects to `/admin/login` otherwise) is a tabbed
dashboard, mirroring the shape of the reader profile below:

- A header (identity, post count) with **New post** and **Log out**
  actions, and a row of 4 clickable stat cards (Total posts, Pending
  review, Comments, Reader accounts) that jump straight to the matching tab.
- **Overview** — a "trending this week" snapshot, a recent-comments feed,
  and (when there's anything to review) a callout linking straight to the
  Review queue tab.
- **Review queue** — every pending reader submission, with **Approve**
  (→ `published`, triggers the newsletter send), **Reject** (→ `rejected`,
  with an optional note that's emailed to the submitter), **Edit**, and
  **Preview**.
- **All posts** — literally every post regardless of status (draft,
  scheduled, published, rejected, pending), each with **Preview**, **Edit**,
  and **Delete** (delete is permanent — a real row removed, not a
  `localStorage` flag hidden).
- **Analytics** — 13 stat cards (posts by status, comments, reader
  accounts, subscribers, feedback notes, reported comments, likes/
  dislikes, average rating), each clickable for a full drill-down list, plus
  4 leaderboards (most liked, most commented, top rated, trending this
  week). There's no page-view tracking on this site, so this never shows
  visits or traffic — only real engagement the database actually records.
- **Security** — the same `SecurityPanel` described in
  [Two-factor authentication](#two-factor-authentication), so it doesn't
  need its own page visit; `/admin/security` still works standalone too.

## Reader accounts & profile

Once logged in as a reader, `/profile` is a tabbed dashboard, mirroring the
shape of the admin one above:

- A header (avatar with initials, display name, email, member-since date)
  with **Submit a post** and **Log out** actions, and a row of 4 clickable
  stat cards (Submissions, Liked, Saved, Recommended) that jump straight to
  the matching tab.
- **Overview** — "Recommended for you"
  (`getRecommendedPosts` in `src/lib/postRanking.js`), personalized from
  the tags on posts you've liked/saved, falling back to "most liked" for a
  brand-new account with no signal yet.
- **Submissions** — every post you've submitted, with its status, any
  rejection note, and a link back to `/submit/edit/:slug` while it's still
  pending.
- **Liked** / **Saved** — every post you've liked or bookmarked, each with
  an empty-state message for a fresh account.
- **Settings** — a profile-details form (display name, etc.) and a
  separate change-password form, each in its own bordered card.

## Reader submissions

Anyone can go to `/submit` and write a post — name, title, tags, excerpt,
body (same markdown-ish syntax the admin editor uses), optional link. It's
always created with `status: 'pending'` server-side (`api/posts/index.js`
ignores any status a non-admin client sends), and the response includes a
private **edit token**, saved to that browser's `localStorage`
(`src/lib/mySubmissions.js`) so the same person can come back to
`/submit/edit/:slug?token=...` and revise it while it's pending. If you're
logged into a reader account when you submit, the post is also linked to
that account (`author_account_id`) so it shows up under
[your profile's Submissions tab](#reader-accounts--profile) from any
device — the edit-token path and the account-linked path both work, and
either is enough; you don't need an account to submit. Once Ian approves or
rejects it, the edit token stops working for further edits
(`api/posts/[slug].js` enforces this server-side), and — if email is
configured — the submitter gets a status email either way. See
[Newsletter & transactional email](#newsletter--transactional-email).

Ian reviews everything pending from the [admin dashboard](#admin-dashboard)'s
Review queue.

## Writing and editing posts (as admin)

From the [admin dashboard](#admin-dashboard)'s All posts tab: **New post**,
**Preview**, **Edit**, and **Delete** on every post regardless of status.

The editor (`/write/new` or `/write/:slug`) has a title, slug, tags, date,
excerpt, an optional external link, a visual cover picker, an optional
future publish time (see [Scheduled publishing](#scheduled-publishing)),
and a body editor using the same tiny markdown-ish syntax as `/submit`:

- A blank line starts a new paragraph.
- `### text` becomes a subheading.
- `> text` becomes a pulled quote.
- Triple-backtick fences (` ``` `) become a code block, syntax-highlighted
  on render.

A **Write / Preview** toggle renders the body through the exact same
component the live post page uses. Reading time is auto-estimated from the
body (~200 words/minute) unless you edit the field yourself. **Save draft**
keeps a post unlisted but reachable by direct link (tagged accordingly, and
`noindex`ed); **Publish** makes it public everywhere immediately; setting a
future publish time instead queues it as `scheduled`.

## Scheduled publishing

Set a future date/time in the editor and a post is saved with
`status: 'scheduled'` instead of `published`. A Vercel Cron job
(`vercel.json`, `GET /api/admin/cron-publish-scheduled`) runs once a day and
publishes anything whose scheduled time has passed, sending the same
subscriber notification a manual publish would. It's gated by a shared
`CRON_SECRET` bearer token rather than the admin session cookie, since no
browser is involved in a cron-triggered request.

**Why once a day, not on the hour**: Vercel's Hobby plan caps cron jobs at
once per day — an hourly schedule is silently rejected at deploy time. In
practice this means a scheduled post can go live up to ~24 hours after its
target time, which the editor's own copy calls out so it's never a
surprise.

## Newsletter & transactional email

Real email via [Resend](https://resend.com) (`api/_lib/email.js`, a plain
`fetch` call — no SDK), used for:

- **Publish notifications** — every subscriber in `subscribers` gets an
  email when a post goes live (manual publish, submission approval, or the
  scheduled-publish cron), sent individually through Resend's batch
  endpoint (not BCC) so each email has a real, working unsubscribe link.
- **Submission status emails** — a reader who submitted a post gets emailed
  when it's approved or rejected (with the reviewer's note, if any).
- **Admin security alerts** — the recovery email set in
  [Two-factor authentication](#two-factor-authentication) gets notified
  whenever 2FA is turned on or off.

**Graceful no-op when unconfigured**: every one of these functions checks
for `RESEND_API_KEY`/`RESEND_FROM_EMAIL` first and silently does nothing if
either is missing — the same pattern the [chat widget](#ai-chat-widget)
uses for `ANTHROPIC_API_KEY`. Nothing about signup, submission, or
publishing depends on email actually sending.

## Comment moderation

Any reader can click **Report** on a comment (`api/comment-reactions/[id].js`,
the same route emoji reactions use, distinguished by a `report` flag in the
body rather than an `emoji`) — it's tallied by distinct reporter in
`comment_reports` so the same visitor can't inflate the count. Reported
comments surface in the [admin dashboard](#admin-dashboard)'s Analytics tab
under "Reported comments," each with its report count and a **Delete**
button, so moderation doesn't need its own dedicated page.

## Polls, quizzes, and reader feedback

Polls and quizzes weren't part of the backend passes and are still
per-browser, exactly as originally built:

- Each poll option's displayed vote share includes a small deterministic
  "baseline" count (hashed from the post slug + option text) so a first-time
  visitor doesn't see an empty 0/0 poll — your own vote is added on top of
  that baseline, and un-voting removes it.
- A quiz answer, once picked, is locked in and marked correct/incorrect
  against `correctIndex` in `postExtras.js`; **Try again** clears the stored
  answer so you can retry.
- Add a poll/quiz to a post by adding a matching entry to `postExtras.js`
  (keyed by slug); posts without an entry there just skip the section.

The Contact page's reader feedback form, every post's "Suggest an edit"
form, and the newsletter signup form are **not** `localStorage`-only
anymore — all three write to real, shared tables (`feedback`,
`subscribers`) via `api/inbox/[action].js`, visible to admin from the
[admin dashboard](#admin-dashboard)'s Analytics tab.

## Content depth & navigation

- **Related posts**: `getRelatedPosts` in `src/lib/postRanking.js` ranks
  every other post by how many tags it shares with the current one, falling
  back to recency to fill out the list — so a post with little tag overlap
  with the rest of the blog still gets three related links instead of none.
- **Recommended for you**: `getRecommendedPosts`, the same shared-tag
  scoring applied to a reader's own liked/saved tags instead of a single
  post — see [Reader accounts & profile](#reader-accounts--profile).
- **Table of contents**: `src/lib/headings.js` pulls every `h3` block out of
  a post's content and slugifies it into an anchor id; `ContentBlocks.jsx`
  stamps that same id onto the rendered heading so the two never drift out
  of sync. Shown only when a post has 2+ subheadings.
- **Topics page** (`/topics`): every tag used across the blog, with a live
  post count per tag (`src/lib/tagCounts.js`), each linking into
  `/blog?tag=...`.
- **Tag deep-linking**: each tag chip on a post links to
  `/blog?tag=<tag>`; the Blog page reads that query param via
  `useSearchParams` to preselect its filter, so the URL is shareable/
  bookmarkable. The tag-filter buttons on the Blog page itself write back to
  the URL the same way.
- **Global search**: a search icon in the nav (`src/components/NavSearch.jsx`,
  every page, desktop and mobile) opens a live-results dropdown as you type —
  matching against title, excerpt, tags, and full body content via the
  shared `src/lib/searchPosts.js` helper (also used by the Blog page's own
  search box, so results are consistent everywhere). Enter, or "See all
  results", goes to `/blog?q=<query>` — the Blog page reads and writes that
  param the same way it does `?tag=`, so `?tag=` and `?q=` can combine and
  the URL stays shareable.
- **"New" badge**: the single most recently published post gets a small
  "New" badge on the Home page's Recent Posts and the Blog list, but only
  while it's within 14 days of today (`src/lib/isRecent.js`, checked against
  `Date.now()` — not hardcoded) — so it never becomes a stale, permanently
  "new" label as posts age.
- **"Listen to this post"**: a text-to-speech button
  (`src/components/ListenButton.jsx`) using the browser's own Web Speech
  API — no dependency, no server round-trip.

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
- Transient confirmations (toast notifications, copy-link, poll/quiz
  feedback, newsletter/reader-feedback/submission success and error
  messages) use `aria-live`/`role="status"`/`role="alert"` so screen reader
  users get notified without needing to find the change visually.
- A `.sr-only` utility class in `App.css` is available for visually-hidden,
  screen-reader-only text.
- The light/dark theme crossfade and every entrance animation respect
  `prefers-reduced-motion`, falling back to an instant swap/static layout.

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
- [Resend](https://resend.com) for newsletter + transactional email
- [highlight.js](https://highlightjs.org) for code-block syntax highlighting
- `qrcode` for server-side 2FA QR code generation
- [Oxlint](https://oxc.rs) for linting
- Plain CSS (custom properties for theming, no CSS framework)
