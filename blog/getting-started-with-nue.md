---
title: Getting Started with Nue.js
date: 2025-02-20
description: Learn how to build content-focused websites with Nue.js, a modern framework that puts content first.
---

# Getting Started with Nue.js

Nue.js is a content-first framework that separates concerns cleanly: content lives in Markdown, design in CSS, and templates in HTML. This approach makes it perfect for blogs, documentation, and marketing sites.

## Why Content-First?

Traditional frameworks mix content with presentation. Nue takes a different approach:

- **Markdown for content**: Writers can focus on writing
- **CSS for design**: Designers control the visual layer
- **HTML for structure**: Developers build reusable layouts

## The File Structure

A simple Nue blog looks like this:

```
├── site.yaml          # configuration
├── layout.html        # shared header/footer
├── index.css          # design system
├── index.md           # homepage
└── posts/
    ├── layout.html    # post layout
    └── *.md           # your posts
```

## Collections

Define collections in your `site.yaml`:

```yaml
collections:
  blog:
    match: [posts/*.md]
    sort: date desc
```

Then use them in your templates to list posts automatically.

## Next Steps

Start building your content-focused site with Nue.js and experience the difference of putting content first.
