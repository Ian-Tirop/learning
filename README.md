# Ian Tirop — Blog

A personal blog built with React and Vite. Routed multi-page site, light/dark
theme, and a full comment/reaction system for each post — all running
client-side, no backend required.

## Features

- **Pages**: Home, Blog (list + search + tag filter), individual post pages,
  About, Contact, and a 404.
- **Light/dark theme**: toggled from the nav, persisted to `localStorage`,
  and applied before first paint (an inline script in `index.html` sets it
  ahead of the React bundle, so there's no flash of the wrong theme).
- **Generated cover art**: every post gets an on-brand SVG cover (gradient +
  icon + pattern) instead of stock photos — see `src/components/PostCover.jsx`.
- **Engagement per post**: like/dislike, a 5-star rating with a live average,
  and comments with nested replies and their own like/dislike. See
  [Engagement data model](#engagement-data-model) below for how this is
  stored.
- **Reading progress bar**, **copy-link / share-to-X**, and an **author
  byline** on every post.
- **A "Write" area** (the pencil icon in the nav, or `/write`) for creating,
  editing, publishing, and deleting posts from the browser — no code editing
  required. See [Writing and editing posts](#writing-and-editing-posts).
- Distinctive editorial type (Fraunces for headings, system sans for body),
  reduced-motion-aware entrance animations, and themed selection/scrollbar
  styling.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # oxlint
```

## Project structure

```
src/
  data/
    posts.js              Static seed posts + seed engagement data
    postStore.js           Merges static posts with local edits/new posts/deletions
    coverPresets.js         The gradient+icon+pattern options offered in the cover picker
  hooks/
    useLocalStorage.js      Generic localStorage-backed state
    usePostEngagement.js    Derives likes/dislikes/rating/comments for a post
    useTheme.js             Light/dark theme state
    useDocumentTitle.js     Sets the browser tab title per route
  lib/
    postBody.js             Markdown-ish text <-> content-block array, for the editor
    slugify.js, estimateReadingTime.js, formatRelativeDate.js
  components/              Nav, Footer, PostCover, PostEngagement, CommentSection,
                            ContentBlocks, ReadingProgress, ThemeToggle
  pages/                    Home, Blog, BlogPost, About, Contact, NotFound
  pages/write/              WriteDashboard (list posts), PostEditor (create/edit)
```

## Writing and editing posts

Click the pencil icon in the nav (or go to `/write`) to see every post —
published and draft — with **New post**, **Preview**, **Edit**, and
**Delete** actions.

The editor (`/write/new` or `/write/:slug`) has a title, slug, tags, date,
excerpt, an optional external link, a visual cover picker, and a body editor
that uses a tiny markdown-ish syntax mapped straight onto the post's content
blocks:

- A blank line starts a new paragraph.
- `### text` becomes a subheading.
- `> text` becomes a pulled quote.
- Triple-backtick fences (` ``` `) become a code block.

A **Write / Preview** toggle renders the body through the exact same
component the live post page uses, so what you see is what gets published.
Reading time is auto-estimated from the body (~200 words/minute) unless you
edit the field yourself. **Save draft** keeps a post unlisted but reachable
by direct link (with a "Draft" tag); **Publish** makes it public on the
Home and Blog pages.

Editing one of the built-in seed posts doesn't touch `posts.js` — it saves
an override in `localStorage` that's layered on top at render time (the
dashboard marks these "Edited"). Deleting a seed post hides it rather than
erasing it from the source, and can be restored from the dashboard's
"Deleted" section. New posts you create are stored entirely in
`localStorage` (marked "New").

This means writing/editing is **local to your own browser**, exactly like
the engagement data described below — there's no server, so nothing you
publish here is visible to anyone opening the site in a different browser
or device. That's enough to fully use and demo the authoring flow. Making
posts genuinely shared/published for real visitors means writing them to
`posts.js` in the repo (and redeploying), or replacing `postStore.js` with
calls to a real backend.

## Engagement data model

There is no backend or database here — this is a static site. Likes,
dislikes, ratings, and comments are stored in **each visitor's own browser**
via `localStorage`, layered on top of a fixed "seed" baseline that ships
with each post in `posts.js` (`seed.likes`, `seed.dislikes`,
`seed.ratingSum`/`seed.ratingCount`, and `seed.comments`).

That means:
- Every visitor sees the same starting numbers and seeded comments.
- Reacting, rating, or commenting updates what *that visitor* sees, and
  persists across reloads on their device.
- None of that is shared across different visitors' browsers — if two
  people open the same post, they won't see each other's likes or comments.

This is enough to fully demo and use the interaction patterns for a single
reader. To make likes/ratings/comments genuinely shared across everyone who
visits, swap the `usePostEngagement` hook for calls to a real backend (a
small API, or something like Supabase/Firebase) instead of `localStorage`.

## Tech

- [React 19](https://react.dev) + [React Router 7](https://reactrouter.com)
- [Vite](https://vite.dev) for dev/build tooling
- [Oxlint](https://oxc.rs) for linting
- Plain CSS (custom properties for theming, no CSS framework)
