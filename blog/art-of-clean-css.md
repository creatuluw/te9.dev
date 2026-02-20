---
title: The Art of Clean CSS
date: 2025-02-15
description: Write maintainable CSS using design tokens, logical properties, and modern layout techniques.
---

# The Art of Clean CSS

CSS has evolved significantly. Modern CSS is powerful enough to handle complex layouts without preprocessors or utility classes. Here's how to write clean, maintainable styles.

## Design Tokens

Use CSS custom properties for consistency:

```css
:root {
  --color-text: #e5e5e5;
  --color-muted: #737373;
  --space-md: 1rem;
  --radius: 8px;
}
```

These become your single source of truth.

## Logical Properties

Write direction-agnostic CSS:

```css
/* Instead of margin-left */
margin-inline-start: var(--space-md);

/* Instead of padding-top */
padding-block-start: var(--space-md);
```

This makes your CSS work globally.

## Modern Layout

Grid and Flexbox handle most layouts:

```css
.posts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-lg);
}
```

No frameworks needed.

## The Cascade is Your Friend

Use the cascade intentionally:

```css
/* Base styles */
article { ... }

/* Contextual variations */
.dark article { ... }

/* Component variations */
article.featured { ... }
```

## Keep It Simple

Resist the urge to over-engineer. Start with minimal CSS, add complexity only when needed.
