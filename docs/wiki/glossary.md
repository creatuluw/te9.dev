---
type: Glossary
title: Glossary
description: Key terms for this project.
timestamp: "2026-06-25T18:30:00.000Z"
---

# Glossary

| Term | Definition |
|------|------------|
| Digital Garden | A personal website organized as a collection of growing, interconnected notes and resources rather than chronological posts |
| Garden Entrance | A card on the garden page representing a category or section (e.g. Dev Playground, Starter Kits), stored in the `garden_entrance` database table |
| Digest | A curated snapshot of analyzed bookmarks, generated as styled HTML. Two types: "last 10" (latest bookmarks) and "weekly" (time-windowed collection) |
| Raindrop Sync | Process of fetching bookmarks from the Raindrop.io API (collection 34657545) into the local `bookmarks` database table |
| Bookmark Crawl | Downloads page HTML for each bookmark, extracts readable content via Mozilla Readability + Turndown (HTML→Markdown), stores in `bookmark_content` |
| Bookmark Analysis | LLM-driven categorization of bookmark content into fields: relevance, purpose, how_to_use, when_to_use, tags, and category, stored in `bookmark_analysis` |
| View Transition | A randomly selected CSS animation applied on each SvelteKit navigation. 10 variations: slide, zoom, rotate, flip, curtain, blur, spiral, explode, drop, swipe |
| PieTask | A task/issue tracking system using flat markdown files in `.work/pietask/` |
| Drizzle ORM | TypeScript ORM (drizzle-orm) used for PostgreSQL queries, operating under a dedicated `te9_dev` database schema |
| Result Type | A Rust-style Ok/Err monad (`src/lib/types/result.ts`) used for functional error handling instead of try/catch |
| Runes Mode | Svelte 5's reactive runes system (`$state`, `$derived`, `$effect`) used for all component reactivity |
| Noise Overlay | A fixed SVG fractal noise layer at 3% opacity over the entire page for visual texture |
| Scanlines | A fixed CSS scanline overlay at 10% opacity simulating CRT monitor lines |
| Node Adapter | SvelteKit adapter (`@sveltejs/adapter-node`) that builds the app as a standalone Node.js server for Railway deployment |
| Tailwind CSS v4 | Utility-first CSS framework used via the `@tailwindcss/vite` plugin for all styling |
