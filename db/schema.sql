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
  password_reset_token text,
  password_reset_expires timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS password_reset_token text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS password_reset_expires timestamptz;

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
    CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'scheduled')),
  link jsonb,
  submitted_by_name text,
  submitted_by_email text,
  edit_token text,
  review_note text,
  author_account_id text REFERENCES accounts(id) ON DELETE SET NULL,
  newsletter_sent boolean NOT NULL DEFAULT false,
  scheduled_at timestamptz,
  series_name text,
  series_order int,
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
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS series_name text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS series_order int;

CREATE INDEX IF NOT EXISTS posts_series_name_idx ON posts(series_name);

-- The CHECK constraint above only applies on a fresh CREATE TABLE — the
-- already-deployed database needs its existing constraint swapped out to
-- allow the new 'scheduled' status.
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check
  CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'scheduled'));

CREATE INDEX IF NOT EXISTS posts_author_account_id_idx ON posts(author_account_id);

CREATE TABLE IF NOT EXISTS comments (
  id text PRIMARY KEY,
  post_slug text NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
  parent_id text REFERENCES comments(id) ON DELETE CASCADE,
  name text NOT NULL,
  body text NOT NULL,
  mention_of text,
  visitor_id text,
  account_id text REFERENCES accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);

ALTER TABLE comments ADD COLUMN IF NOT EXISTS account_id text REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS comments_post_slug_idx ON comments(post_slug);

-- A reader flagging a comment for Ian's attention — counted by distinct
-- reporter so the same visitor can't inflate a comment's report count.
CREATE TABLE IF NOT EXISTS comment_reports (
  comment_id text NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, visitor_id)
);

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

-- Single-row-per-key settings for the one admin account — currently just
-- two-factor auth state (secret, enabled flag, hashed backup codes). Not
-- an "accounts" row since there's exactly one admin, gated by
-- ADMIN_PASSWORD, not a row in `accounts`.
CREATE TABLE IF NOT EXISTS admin_settings (
  key text PRIMARY KEY,
  value text
);

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
  post_slug text,
  post_title text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Lets "Suggest an edit" (a per-post feedback note) share this same table
-- and admin view rather than needing its own.
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS post_slug text;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS post_title text;

-- A reader account following a "writer" — any account with at least one
-- published post. Direction matters: follower_id follows writer_id, never
-- the reverse. Self-follows are rejected at the app layer (a CHECK here
-- would need a name to be droppable/idempotent like the posts one above,
-- and the app-layer check is simpler for a relationship this small).
CREATE TABLE IF NOT EXISTS follows (
  follower_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  writer_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, writer_id)
);

CREATE INDEX IF NOT EXISTS follows_writer_id_idx ON follows(writer_id);
