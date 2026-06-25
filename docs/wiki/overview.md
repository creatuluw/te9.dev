---
type: System Overview
title: Overview
description: What this project contains and its structure.
timestamp: "2026-06-25T18:30:00.000Z"
---

# Overview

te9.dev is a [SvelteKit](https://svelte.dev/docs/kit) v2 personal website and "digital garden" built by Patrick Tehubijuluw. It serves as a central hub for dev experiments, starter kits, notes, tools, and resources — all organized into garden entrances (cards) and bookmark digests. The site is deployed on [Railway](https://railway.app/) using the Node adapter and connects to a PostgreSQL database via [Drizzle ORM](https://orm.drizzle.team/).

The project has a distinctive dark terminal aesthetic: deep black surfaces (`#0a0a0a`), amber/orange accent (`#ff9500`), and emerald green (`#00ff88`) for status indicators. It uses four font families — Bricolage Grotesque for display/body, JetBrains Mono for code, Lekton for labels/UI, and Space Grotesk as an alternative. The design system is documented in `.design-system/design-system-te9.dev.html`.

## Backend & Data Pipeline

Beyond the frontend, te9.dev has a significant data pipeline. It syncs bookmarks from Raindrop.io API, crawls URLs to extract readable content (via Mozilla Readability and Turndown), and analyzes bookmarks using an LLM to categorize and annotate them. Digests are then generated from analyzed bookmarks — either as "last 10" snapshots or "weekly" collections — which can optionally be emailed. The database schema lives under a dedicated `te9_dev` PostgreSQL schema with tables for garden entrances, bookmarks, bookmark content, bookmark analysis, and digests.

## Project Structure

The repo contains several satellite directories outside the main SvelteKit app: `godaddy-cli/` is a Go-based CLI tool for managing GoDaddy DNS records; `llm-gateway/` is an LLM proxy/gateway; `repotrend/` is a trend analysis tool. Documentation and specifications live in `docs/` (this wiki) and `.specs/`. The `.work/` directory tracks active tasks via PieTask.
