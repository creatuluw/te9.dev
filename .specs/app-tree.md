# App Tree Specification

This document serves as the canonical reference for the repository structure, defining where capabilities live and where new specs/implementation should target.

## Repository Root Structure

```
te9.dev/
├── .specs/                          # Specifications & design docs
│   ├── app-tree.md                  # This file - structure reference
│   ├── blog-integration/            # Blog integration specs
│   └── component-refactoring/       # Component refactoring specs
│
├── .design-system/                  # Design system documentation & assets
│   ├── design-system.json
│   ├── design-system.md
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── .github/                         # GitHub configuration
│
├── .opencode/                       # Opencode AI assistant configuration
│   ├── skills/                      # Custom AI skills
│   └── package.json
│
├── .vscode/                         # VSCode workspace settings
│
├── .archive/                        # Archived/experimental content
│   ├── .lancedb/
│   ├── .opencode/
│   └── blog2/
│
├── .v1/                             # Version 1 legacy content
│   ├── blog/
│   ├── design/
│   ├── garden/
│   ├── llmngn/
│   └── repotrend/
│
├── src/                             # Main application source code
│   ├── routes/                      # SvelteKit routes (see Route Tree below)
│   └── lib/                         # Shared libraries & features (see Feature Tree below)
│
├── llm-gateway/                     # LLM Gateway microservice
│   ├── src/
│   │   ├── client.ts                # API client
│   │   ├── index.ts                 # Entry point
│   │   └── types.ts                 # Type definitions
│   ├── scripts/
│   └── Dockerfile
│
├── repotrend/                       # RepoTrend sub-project
│   ├── site/                        # Site generation
│   ├── data/                        # Data storage
│   ├── bsky/                        # Bluesky integration
│   └── design/                      # Design assets
│
├── scripts/                         # Utility scripts
│   ├── analyze-bookmarks.js
│   ├── crawl-bookmarks.js
│   ├── setup-db.js
│   └── sync-raindrop.js
│
├── static/                          # Static assets (served at /)
│   └── robots.txt
│
├── docs/                            # Documentation
│   └── lucide svelte with svelte 5.md
│
├── build/                           # Build output directory
│
├── node_modules/                    # Dependencies
│
└── Configuration Files
    ├── package.json                 # Project dependencies & scripts
    ├── svelte.config.js             # SvelteKit configuration
    ├── vite.config.ts               # Vite configuration
    ├── tsconfig.json                # TypeScript configuration
    ├── drizzle.config.ts            # Drizzle ORM configuration
    ├── eslint.config.js             # ESLint configuration
    ├── railway.toml                 # Railway deployment config
    └── .npmrc                       # npm configuration
```

---

## Route Tree (`src/routes/`)

Routes define the URL structure and page-level logic. Each route may contain:
- `+page.svelte` - Page component
- `+page.server.ts` - Server-side data loading
- `+layout.svelte` - Layout wrapper
- `+layout.server.ts` - Layout server logic

```
src/routes/
├── / (root)
│   ├── +layout.svelte               # App-wide layout (Header, Footer, etc.)
│   ├── +page.svelte                 # Home page component
│   ├── +page.server.ts              # Home page server data
│   └── layout.css                   # Layout styles
│
└── /garden
    ├── +page.svelte                 # Garden page component
    └── +page.server.ts              # Garden page server data
```

### Route Creation Guidelines

| When to create | Where to create |
|----------------|-----------------|
| New page/URL   | `src/routes/<new-route>/` |
| New API endpoint | `src/routes/api/<endpoint>/+server.ts` |
| Shared layout  | `src/routes/<group>/+layout.svelte` |

---

## Feature Tree (`src/lib/`)

Features are reusable capabilities shared across routes. Organized by concern:

```
src/lib/
├── index.ts                         # Public exports barrel file
│
├── components/                      # UI Components
│   ├── ui/                          # Base UI components
│   │   ├── BackgroundEffects.svelte
│   │   ├── Button.svelte
│   │   ├── Footer.svelte
│   │   ├── GardenCard.svelte
│   │   ├── Header.svelte
│   │   ├── Hero.svelte
│   │   ├── QuickLink.svelte
│   │   ├── SectionHeader.svelte
│   │   ├── data.ts                  # Component data
│   │   └── types.ts                 # Component types
│   └── features/                    # Feature-specific components (create new here)
│       └── <feature-name>/          # e.g., garden/, blog/, auth/
│
├── server/                          # Server-side logic
│   ├── db/                          # Database layer
│   │   ├── index.ts                 # DB connection & exports
│   │   └── schema.ts                # Drizzle schema definitions
│   └── api/                         # API utilities (create new here)
│       └── <service-name>/          # e.g., llm/, auth/, data/
│
├── assets/                          # Static assets (images, fonts, etc.)
│
├── utils/                           # Utility functions (create new here)
│   └── <utility-name>.ts
│
├── stores/                          # Svelte stores for state management
│   └── <store-name>.ts
│
├── types/                           # Shared TypeScript types
│   └── <type-name>.ts
│
└── vitest-examples/                 # Test examples
```

### Feature Creation Guidelines

| Capability Type | Target Location | Example |
|-----------------|-----------------|---------|
| New UI Component | `src/lib/components/ui/` | `Button.svelte` |
| Feature Component | `src/lib/components/features/<feature>/` | `features/garden/GardenGrid.svelte` |
| Database Schema | `src/lib/server/db/schema.ts` | Add new table definition |
| DB Query/Service | `src/lib/server/<service>/` | `server/llm/queries.ts` |
| API Client | `llm-gateway/src/` or `src/lib/server/api/` | `client.ts` |
| Utility Function | `src/lib/utils/` | `utils/format.ts` |
| Shared Type | `src/lib/types/` | `types/garden.ts` |
| State Store | `src/lib/stores/` | `stores/user.ts` |

---

## Capability Placement Decision Tree

```
Need to add new capability?
│
├─ Is it a visible UI element?
│  ├─ Generic/reusable → src/lib/components/ui/
│  └─ Feature-specific → src/lib/components/features/<feature>/
│
├─ Is it a new page/URL?
│  └─ Create route → src/routes/<new-route>/
│
├─ Is it server-side logic?
│  ├─ Database schema → src/lib/server/db/schema.ts
│  ├─ Database queries → src/lib/server/<domain>/
│  └─ External API → llm-gateway/ or src/lib/server/api/
│
├─ Is it a background service/microservice?
│  └─ Create in → llm-gateway/ or new sub-project
│
├─ Is it a utility/helper function?
│  └─ Create in → src/lib/utils/
│
├─ Is it shared state?
│  └─ Create in → src/lib/stores/
│
└─ Is it a type definition?
   └─ Create in → src/lib/types/ or colocate with feature
```

---

## Specification Targeting

When writing specs in `.specs/`:

| Spec Type | Target Structure | Implementation Path |
|-----------|------------------|---------------------|
| New Feature | `.specs/<feature-name>/` | `src/lib/components/features/<feature>/` + `src/routes/<feature>/` |
| UI Component | `.specs/components/<name>/` | `src/lib/components/ui/` or `features/` |
| API Integration | `.specs/api/<service>/` | `llm-gateway/` or `src/lib/server/api/` |
| Database Change | `.specs/db/<entity>/` | `src/lib/server/db/schema.ts` |
| Route Addition | `.specs/routes/<name>/` | `src/routes/<name>/` |

---

## Quick Reference

### Primary Development Paths

| Area | Path | Purpose |
|------|------|---------|
| Routes | `src/routes/` | URL endpoints & pages |
| Components | `src/lib/components/` | Reusable UI |
| Server Logic | `src/lib/server/` | Backend operations |
| Database | `src/lib/server/db/` | Schema & queries |
| External Services | `llm-gateway/` | Microservices |
| Specs | `.specs/` | Design documentation |

### Naming Conventions

- **Routes**: kebab-case (`/digital-garden/`)
- **Components**: PascalCase (`GardenCard.svelte`)
- **Utils/Modules**: camelCase (`formatDate.ts`)
- **Spec Folders**: kebab-case (`blog-integration/`)

---

*Last updated: This document should be updated when new major capabilities or structural changes are added to the repository.*