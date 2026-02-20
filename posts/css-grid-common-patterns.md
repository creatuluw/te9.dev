---
title: CSS Grid Common Patterns
date: 2025-02-18
description: Practical CSS Grid layout patterns you can use in your projects today.
---

# CSS Grid Common Patterns

CSS Grid has revolutionized web layouts. Here are the most common patterns you'll use in everyday development.

## Holy Grail Layout

The classic three-column layout with header and footer:

```css
.page {
  display: grid;
  grid-template:
    "header header header" auto
    "nav main aside" 1fr
    "footer footer footer" auto
    / 200px 1fr 200px;
  min-height: 100vh;
}
```

## Card Grid

Responsive card layouts without media queries:

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
```

## Centering Everything

The easiest way to center content:

```css
.center {
  display: grid;
  place-items: center;
  min-height: 100vh;
}
```

## Sticky Footer

Keep footer at the bottom:

```css
body {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}
```

## Responsive Without Media Queries

Grid adapts naturally:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}
```

These patterns handle most layout needs. Master them and you'll rarely need anything else.