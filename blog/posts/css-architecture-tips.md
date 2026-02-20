---
title: CSS Architecture Tips
date: 2025-02-14
description: Organize your CSS with proven architecture patterns that scale from small projects to large applications.
---

# CSS Architecture Tips

CSS is easy to write but hard to maintain. Without structure, stylesheets become tangled messes. These architecture patterns help you write CSS that scales.

## The Single Responsibility Principle

Each class should do one thing:

```css
/* Bad: Multiple responsibilities */
.card {
  background: white;
  padding: 1rem;
  display: flex;
  font-size: 1.2rem;
  color: blue;
}

/* Good: Separated concerns */
.card { padding: 1rem; }
.card-primary { background: white; }
.card-large { font-size: 1.2rem; }
```

Compose classes instead of creating new ones.

## BEM Methodology

Block, Element, Modifier:

```css
/* Block */
.card { }

/* Element */
.card__title { }
.card__body { }

/* Modifier */
.card--featured { }
.card--dark { }
```

Use BEM for component-based architecture.

## Utility-First Approach

Use small, single-purpose classes:

```css
.mt-1 { margin-top: 1rem; }
.p-2 { padding: 2rem; }
.text-center { text-align: center; }
.flex { display: flex; }
```

```html
<div class="card p-2 mt-1 text-center">
```

This is the Tailwind approach—fast for building, harder to maintain at scale.

## Layered Architecture

Organize CSS in layers:

```css
/* 1. Settings - Variables */
:root { --color-primary: #3b82f6; }

/* 2. Base - Resets, element defaults */
*, *::before, *::after { box-sizing: border-box; }

/* 3. Objects - Layout patterns */
.container { max-width: 1200px; margin: 0 auto; }

/* 4. Components - UI components */
.button { padding: 0.5rem 1rem; }

/* 5. Utilities - Helper classes */
.hidden { display: none; }
```

Import in this order to control the cascade.

## Naming Conventions

Be consistent and descriptive:

```css
/* Bad */
.btn1 { }
.red { }
.bigButton { }

/* Good */
.button { }
.button--danger { }
.button--large { }
```

Names should describe purpose, not appearance.

## Avoid Deep Nesting

Keep selectors flat:

```css
/* Bad */
.header .nav .list .item .link { }

/* Good */
.nav-link { }
```

Flat selectors are more performant and easier to override.

## File Organization

Split CSS by concern:

```
styles/
├── base/
│   ├── reset.css
│   └── typography.css
├── components/
│   ├── button.css
│   └── card.css
├── layout/
│   └── grid.css
└── main.css
```

Import all in your main stylesheet.

## Start Simple

Don't over-engineer. For small projects, a single file works fine. Add complexity only when you feel the pain of scale.
