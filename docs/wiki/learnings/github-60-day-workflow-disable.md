---
type: Learning
title: GitHub auto-disables scheduled workflows after 60 days — GITHUB_TOKEN commits don't count
description: "GitHub auto-disables **all scheduled workflows** in a repo after 60 days of no activity. Hit on 2026-08-24: all four workflows in creatuluw/te9.dev were silentl"
tags: [github-actions, devops, ci]
timestamp: "2026-08-24T09:01:51.895Z"
---

# GitHub auto-disables scheduled workflows after 60 days — GITHUB_TOKEN commits don't count

GitHub auto-disables **all scheduled workflows** in a repo after 60 days of no activity. Hit on 2026-08-24: all four workflows in creatuluw/te9.dev were silently disabled (Digest — Weekly, Digest — Last 10 Analyzed, Sync Raindrop Bookmarks, Update README timestamp) — only one emailed a notice.

## Non-obvious gotcha
Commits made by `GITHUB_TOKEN` do **not** count as activity. The README-timestamp workflow commits daily via `GITHUB_TOKEN`, so the repo LOOKS active but GitHub still treats it as inactive — the last *human/PAT* commit was 2026-06-25, and exactly 60 days later everything shut off.

## Recurrence & prevention
- Expect this again ~60 days after the last real (non-GITHUB_TOKEN) commit.
- An occasional manual commit, or a keepalive cron using a PAT (not GITHUB_TOKEN), prevents it.
- Re-enable via GitHub Actions UI or `gh workflow enable <name>`.

## Source
- `.github/workflows/` — the four scheduled workflows affected.
