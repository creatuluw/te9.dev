---
title: CSS Custom Properties Guide
date: 2025-02-17
description: Master CSS custom properties to create maintainable, themeable designs with a single source of truth.
---

# CSS Custom Properties Guide

CSS custom properties (variables) bring real programming power to stylesheets. They enable dynamic theming, reduce repetition, and make CSS more maintainable. Here's how to use them effectively.

## The Basics

Define properties on `:root` for global access:

```css
:root {
  --color-primary: #3b82f6;
  --color-text: #1f2937;
  --space-md: 1rem;
  --radius: 0.5rem;
}
```

Use them with `var()`:

```css
.button {
  background: var(--color-primary);
  padding: var(--space-md);
  border-radius: var(--radius);
}
```

## Fallback Values

Provide defaults for safety:

```css
.title {
  color: var(--heading-color, var(--color-text, #000));
}
```

The first defined value wins.

## Scoped Variables

Override values locally:

```css
.card {
  --color-primary: #10b981;
}

.card .button {
  background: var(--color-primary); /* Uses local value */
}
```

This enables component-level theming.

## Theme Switching

Dark mode becomes trivial:

```css
:root {
  --bg: #ffffff;
  --text: #000000;
}

[data-theme="dark"] {
  --bg: #0f172a;
  --text: #e2e8f0;
}

body {
  background: var(--bg);
  color: var(--text);
}
```

Toggle with JavaScript:

```javascript
document.documentElement.dataset.theme = 'dark';
```

## Responsive Values

Change values at breakpoints:

```css
:root {
  --container-width: 100%;
}

@media (min-width: 768px) {
  :root {
    --container-width: 720px;
  }
}

.container {
  max-width: var(--container-width);
}
```

## Naming Conventions

Use descriptive, semantic names:

```css
/* Bad */
--blue: #3b82f6;

/* Good */
--color-link: #3b82f6;
--color-accent: #10b981;
```

Name by purpose, not value.

## Next Steps

Start by converting your most-repeated values to custom properties. Build a design system that scales.