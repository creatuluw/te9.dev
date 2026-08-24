---
type: Artifact
title: File Tree
description: Complete project file listing with descriptions.
timestamp: "2026-06-25T18:30:00.000Z"
---

# File tree — generated 2026-06-25T18:30:00.000Z

Significant source files only (excluding node_modules, .git, .svelte-kit, build, and other generated directories).

```
.
├── .archive/ — Archived files and old design system backups
│   ├── .lancedb/ — LanceDB vector store artifacts (archived, linked to old llmngn project)
│   └── .opencode/ — Archived OpenCode AI config and dependencies
├── .design-system/ — Design system documentation
│   ├── .archive/ — Previous design system backups (GLACIER, JSON, Markdown, CSS, JS versions)
│   └── design-system-te9.dev.html — Main design system reference (dark terminal aesthetic, 4245 lines)
├── .github/ — GitHub Actions workflows and templates
├── .pi/ — Pi coding agent configuration, skills, and agents
├── .specs/ — Project specifications
│   ├── app-tree.md — Application tree specification
│   ├── blog-integration/ — Blog integration design spec
│   └── component-refactoring/ — Component refactoring plan
├── .work/ — Active task tracking via PieTask
│   └── pietask/ — PieTask entry files
├── docs/ — Project documentation
│   └── wiki/ — OKF v0.1 knowledge wiki (this wiki)
├── godaddy-cli/ — Go CLI for managing GoDaddy DNS records
│   ├── godaddy.go — Main Go source: CRUD operations for DNS records (A, CNAME, MX, TXT, etc.)
│   ├── godaddy.exe — Compiled binary (12MB)
│   ├── go.mod / go.sum — Go module dependencies
│   └── internal/ — Internal Go packages
├── llm-gateway/ — LLM proxy/gateway service
│   ├── src/ — TypeScript source (client.ts, index.ts, types.ts)
│   ├── Dockerfile — Containerized deployment config
│   ├── railway.toml — Railway deployment config
│   ├── AGENTS.md — Agent instructions for the gateway
│   ├── README.md — Gateway documentation (Qwen3.5-4B, OpenAI-compatible API)
│   └── scripts/ — Setup scripts (dev.ps1, dev.sh, setup.ps1, setup.sh)
├── repotrend/ — Repository trend analysis and social posting tools
│   ├── bsky/ — Bluesky posting scripts and OG card templates
│   │   ├── post-to-bsky.js — Posts repo trend cards to Bluesky
│   │   ├── test-post-to-bsky.js — Test harness for Bluesky posting
│   │   ├── debug-card.html — Card preview debug tool
│   │   └── og-card-template.html — OG card HTML template
│   ├── design/ — Visual design files (GitHub cards HTML, index, script)
│   └── .archive/ — Archived repo name collections
├── scripts/ — Data pipeline CLI scripts (run via npm run)
│   ├── sync-raindrop.js — Fetches bookmarks from Raindrop.io API, upserts to DB
│   ├── crawl-bookmarks.js — Downloads pages, extracts content via Readability + Turndown
│   ├── analyze-bookmarks.js — Sends content to LLM, extracts structured metadata
│   ├── generate-digest.js — Generates styled HTML digest ("last10" or "weekly"), optional email
│   ├── setup-db.js — Creates database tables if they don't exist
│   ├── setup-digests-db.js — Sets up the digests table
│   └── send-test-email.ts — Email transport test utility
├── src/ — SvelteKit v2 application source
│   ├── app.css — Global styles: Tailwind CSS v4 import, 10 view transition keyframe sets, custom fonts, scrollbar, noise/scanline animations
│   ├── app.d.ts — TypeScript ambient declarations
│   ├── app.html — SvelteKit HTML shell with Google Fonts preconnects (Bricolage Grotesque, JetBrains Mono, Lekton, Space Grotesk)
│   ├── lib/ — Shared library code
│   │   ├── index.ts — Library re-exports
│   │   ├── assets/ — Static assets (favicon.svg)
│   │   ├── components/ui/ — Svelte 5 UI components (Runes mode)
│   │   │   ├── BackgroundEffects.svelte — Fixed noise overlay + CRT scanlines
│   │   │   ├── Button.svelte — Reusable button component
│   │   │   ├── data.ts — Static data (6 garden cards, 6 quick links)
│   │   │   ├── Footer.svelte — Site footer with social links + "Growing organically" status dot
│   │   │   ├── GardenCard.svelte — Card with gradient, emerald→amber hover border, icon mapping
│   │   │   ├── Header.svelte — Fixed nav with terminal typing effect, scroll-aware background
│   │   │   ├── Hero.svelte — Hero with decorative animated rings, CTAs, bracket label
│   │   │   ├── QuickLink.svelte — Rounded link item with arrow-on-hover animation
│   │   │   ├── SectionHeader.svelte — Section heading with monospace label
│   │   │   └── types.ts — TypeScript interfaces (GardenCard, QuickLink)
│   │   ├── server/ — Server-only code
│   │   │   └── db/ — Database layer
│   │   │       ├── index.ts — PostgreSQL connection via postgres library
│   │   │       └── schema.ts — Drizzle ORM schema (5 tables in te9_dev schema)
│   │   ├── services/ — Business logic services
│   │   │   └── emailService.ts — Email sending service
│   │   ├── templates/emails/ — 8 HTML email templates (base, invitation, magic-link, mention, password-reset, subscription, sysadmin, welcome, test)
│   │   ├── types/ — Type definitions
│   │   │   ├── errors.ts — AppError hierarchy (20 ErrorCode values, 6 error classes, severity/retry utilities)
│   │   │   ├── index.ts — Re-exports
│   │   │   └── result.ts — Result<Ok, Err> monad (Ok/Err classes + ok/err/isOk/isErr/unwrap/map/andThen/toResult/collect helpers)
│   │   ├── utils/ — Utility functions
│   │   │   └── emailTemplateUtils.ts — Email template helpers
│   │   └── vitest-examples/ — Example test files (greet.ts, greet.spec.ts, Welcome.svelte)
│   └── routes/ — SvelteKit routes (page-driven routing)
│       ├── +layout.svelte — Root layout: Header, BackgroundEffects, Footer, random view transitions on navigate
│       ├── +page.server.ts — Homepage loader: queries garden_entrance + latest 3 digests from DB
│       ├── +page.svelte — Homepage template: Hero, Garden grid, Digest cards, Quick links
│       ├── layout.css — Layout-specific CSS (empty, uses Tailwind)
│       └── api/email/send/+server.ts — POST endpoint for sending emails
│       ├── digest/ — Digest archive
│       │   ├── +page.server.ts — Loads all digests ordered by date
│       │   ├── +page.svelte — Archive page with list layout, type tags, hover arrows
│       │   └── [slug]/+server.ts — Individual digest API endpoint (slug-based routing)
│       └── garden/ — Garden page
│           ├── +page.server.ts — Loads all active garden entrances ordered by sortOrder
│           └── +page.svelte — Full-width garden grid with no-gap cards
├── static/ — Static assets (favicon, robots.txt, etc.)
├── .env.example — Environment template: DATABASE_URL, RAINDROP_ACCESS_TOKEN
├── .gitignore — Git ignore rules
├── .npmrc — NPM configuration
├── drizzle.config.ts — Drizzle Kit config: schema path, PostgreSQL dialect, strict mode
├── eslint.config.js — ESLint flat config
├── package.json — NPM package: SvelteKit 2, Svelte 5, Tailwind CSS v4, Drizzle ORM, Lucide icons, Zod, EmailJS
├── railway.toml — Railway deploy config: Nixpacks builder, healthcheck at /, port 8080
├── README.md — Project readme (scaffolded by sv CLI)
├── svelte.config.js — SvelteKit config: Node adapter, Runes mode for project files
├── tsconfig.json — TypeScript configuration
└── vite.config.ts — Vite config: Tailwind CSS v4 plugin + SvelteKit plugin
```
