-- Run once by scripts/migrate.js. Kept here as the readable source of truth
-- for the schema — migrate.js issues the same statements programmatically.

-- Optional reader accounts: lets a submitter track and edit their posts from
-- any device instead of relying on a per-browser edit token. Entirely
-- separate from the single admin login (api/_lib/auth.js) — this is a real
-- accounts table because there can be many readers, unlike the one admin.
CREATE TABLE IF NOT EXISTS accounts (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  slug text PRIMARY KEY,
  title text NOT NULL,
  excerpt text NOT NULL,
  content jsonb NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  cover jsonb,
  date date NOT NULL,
  reading_time int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'published', 'rejected')),
  link jsonb,
  submitted_by_name text,
  submitted_by_email text,
  edit_token text,
  review_note text,
  author_account_id text REFERENCES accounts(id) ON DELETE SET NULL,
  newsletter_sent boolean NOT NULL DEFAULT false,
  seed_likes int NOT NULL DEFAULT 0,
  seed_dislikes int NOT NULL DEFAULT 0,
  seed_rating_sum int NOT NULL DEFAULT 0,
  seed_rating_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Safety net for the already-deployed database, where `posts` exists
-- without this column — CREATE TABLE IF NOT EXISTS above is a no-op there,
-- so the column has to be added separately. Harmless to also run against a
-- fresh install (the column already exists from the CREATE TABLE above).
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_account_id text REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS newsletter_sent boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS posts_author_account_id_idx ON posts(author_account_id);

CREATE TABLE IF NOT EXISTS comments (
  id text PRIMARY KEY,
  post_slug text NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
  parent_id text REFERENCES comments(id) ON DELETE CASCADE,
  name text NOT NULL,
  body text NOT NULL,
  mention_of text,
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);

CREATE INDEX IF NOT EXISTS comments_post_slug_idx ON comments(post_slug);

CREATE TABLE IF NOT EXISTS comment_reactions (
  comment_id text NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, visitor_id, emoji)
);

CREATE TABLE IF NOT EXISTS post_reactions (
  post_slug text NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  reaction text CHECK (reaction IN ('like', 'dislike')),
  rating int CHECK (rating BETWEEN 1 AND 5),
  account_id text REFERENCES accounts(id) ON DELETE SET NULL,
  PRIMARY KEY (post_slug, visitor_id)
);

-- Same already-deployed-database situation as posts.author_account_id above.
ALTER TABLE post_reactions ADD COLUMN IF NOT EXISTS account_id text REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS post_reactions_account_id_idx ON post_reactions(account_id);

-- A reader's bookmarked articles — account-only (no anonymous equivalent),
-- since a bookmark's whole point is to persist across devices, which only
-- an account (not the per-browser visitor_id) can do.
CREATE TABLE IF NOT EXISTS saved_posts (
  account_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  post_slug text NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, post_slug)
);

CREATE INDEX IF NOT EXISTS saved_posts_account_id_idx ON saved_posts(account_id);

-- Real, shared newsletter list (was localStorage-only, per-browser, before
-- this pass — see api/_lib/email.js for the actual send-on-publish logic).
CREATE TABLE IF NOT EXISTS subscribers (
  email text PRIMARY KEY,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);

-- Real, shared reader feedback (was localStorage-only, per-browser, before
-- this pass) — the Contact page's "what are you into" form.
CREATE TABLE IF NOT EXISTS feedback (
  id text PRIMARY KEY,
  name text,
  email text,
  interests text[] NOT NULL DEFAULT '{}',
  wants_to_write text,
  write_note text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
