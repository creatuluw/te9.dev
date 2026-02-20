---
title: Flexbox Layout Patterns
date: 2025-02-17
description: Master the essential Flexbox patterns for common layout challenges.
---

# Flexbox Layout Patterns

Flexbox excels at one-dimensional layouts. While Grid handles two dimensions, Flexbox is perfect for aligning items in a row or column. Here are the patterns you'll use most.

## Centering Content

The classic centering problem, solved:

```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
```

Both horizontal and vertical centering in three lines.

## Navigation Patterns

Spread items across a row:

```css
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

Or group them to one side:

```css
.nav {
  display: flex;
  gap: 1rem;
}
```

## Card Layouts

Equal-height cards with flexible content:

```css
.card-container {
  display: flex;
  gap: 1.5rem;
}

.card {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-content {
  flex: 1; /* Fills remaining space */
}
```

## Split Layouts

Push items to opposite edges:

```css
.split {
  display: flex;
  justify-content: space-between;
}

/* Or with one item taking remaining space */
.split {
  display: flex;
}

.split > :last-child {
  margin-left: auto;
}
```

## Wrapping Content

Let items wrap naturally:

```css
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
```

## Responsive Patterns

Stack on mobile, row on desktop:

```css
.responsive {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .responsive {
    flex-direction: row;
  }
}
```

These patterns cover most alignment needs. Combine them for complex layouts.