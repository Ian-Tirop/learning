-- Run once by scripts/migrate.js. Kept here as the readable source of truth
-- for the schema; migrate.js issues the same statements programmatically.

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
  seed_likes int NOT NULL DEFAULT 0,
  seed_dislikes int NOT NULL DEFAULT 0,
  seed_rating_sum int NOT NULL DEFAULT 0,
  seed_rating_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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
  PRIMARY KEY (post_slug, visitor_id)
);
