---
type: Learning
title: Bookmark Data Pipeline
description: How bookmark syncing, crawling, analysis, and digest generation work
timestamp: "2026-06-25T18:30:00.000Z"
---

# Bookmark Data Pipeline

The data pipeline runs in 4 stages, each as a separate npm script:

## 1. Sync — `npm run sync:raindrop`

Fetches bookmarks from Raindrop.io API (collection ID 34657545) using `RAINDROP_ACCESS_TOKEN`. Paginated at 50 per page. Upserts into the `bookmarks` table under the `te9_dev` schema. Source: `scripts/sync-raindrop.js`.

## 2. Crawl — `npm run sync:crawl`

For each bookmark, downloads the page HTML, extracts readable content via [Mozilla Readability](https://github.com/mozilla/readability), converts to Markdown via [Turndown](https://github.com/mixmark-io/turndown), and stores the result in `bookmark_content`. Source: `scripts/crawl-bookmarks.js`.

## 3. Analyze — `npm run sync:analyze`

Passes crawled content to an LLM which extracts structured metadata: `relevance`, `purpose`, `how_to_use`, `when_to_use`, `tags`, and `category`. Results stored in `bookmark_analysis`. Source: `scripts/analyze-bookmarks.js`.

## 4. Digest — `npm run digest:last10` / `npm run digest:weekly`

Generates a styled HTML digest from analyzed bookmarks. Supports two modes:
- **last10**: The most recent 10 analyzed bookmarks
- **weekly**: Bookmarks analyzed in the current week

Can optionally be emailed with the `--send` flag. Source: `scripts/generate-digest.js`.

## Database Schema

All tables live in the `te9_dev` PostgreSQL schema:
| Table | Purpose | Key fields |
|-------|---------|------------|
| `garden_entrance` | Homepage garden cards | title, description, tag, icon, slug, sortOrder, isActive |
| `bookmarks` | Synced Raindrop.io bookmarks | raindropId, title, url, excerpt, tags, domain |
| `bookmark_content` | Crawled page content | bookmarkId, markdown, tokenCount, status |
| `bookmark_analysis` | LLM analysis results | bookmarkId, relevance, purpose, howToUse, tags, category |
| `digests` | Generated digest HTML | type, title, slug, html, entryCount, emailSent |
