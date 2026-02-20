-- Posts table (published articles)
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  draft_id INTEGER,
  bookmark_id INTEGER REFERENCES bookmarks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  post_type TEXT DEFAULT 'blog_post' CHECK (post_type IN ('blog_post', 'skill')),
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_bookmark_id ON posts(bookmark_id);
