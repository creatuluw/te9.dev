-- Seed default categories
INSERT INTO categories (name, slug) VALUES
  ('Tech', 'tech'),
  ('Design', 'design'),
  ('Business', 'business'),
  ('Tutorial', 'tutorial'),
  ('News', 'news'),
  ('Other', 'other'),
  ('Uncategorized', 'uncategorized')
ON CONFLICT (slug) DO NOTHING;

-- Seed default config
INSERT INTO config (key, value) VALUES
  ('polling', '{"interval_minutes": 240, "enabled": true}'),
  ('ai', '{"provider": "anthropic", "model": "claude-sonnet-4-20250514"}'),
  ('raindrop', '{"last_sync_at": null}')
ON CONFLICT (key) DO NOTHING;

-- Seed initial API key
INSERT INTO api_keys (key, name) VALUES
  ('bm9kZS1ibG9nLWFwaS1rZXktMjAyNS0wcHg4', 'Initial Key')
ON CONFLICT (key) DO NOTHING;
