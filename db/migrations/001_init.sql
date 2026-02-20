-- Bookmarks table (synced from Raindrop)
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  raindrop_id INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  excerpt TEXT,
  cover TEXT,
  domain TEXT,
  type TEXT DEFAULT 'link',
  tags JSONB DEFAULT '[]',
  blog_approved BOOLEAN DEFAULT FALSE,
  reason_for_bookmark TEXT,
  category TEXT DEFAULT 'Uncategorized',
  created_at TIMESTAMP DEFAULT NOW(),
  raindrop_created_at TIMESTAMP,
  raindrop_updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_category ON bookmarks(category);
CREATE INDEX IF NOT EXISTS idx_bookmarks_blog_approved ON bookmarks(blog_approved);

-- Drafts table (AI-generated blog posts)
CREATE TABLE IF NOT EXISTS drafts (
  id SERIAL PRIMARY KEY,
  bookmark_id INTEGER REFERENCES bookmarks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_bookmark_id ON drafts(bookmark_id);

-- Categories table (configurable)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

-- Config table (app settings)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
