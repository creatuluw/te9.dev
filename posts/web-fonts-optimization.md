---
title: Web Fonts Optimization
date: 2025-02-15
description: Load web fonts faster with these essential optimization techniques that improve performance without sacrificing typography.
---

# Web Fonts Optimization

Web fonts enhance design but can hurt performance. A poorly optimized font strategy adds seconds to page load. Here's how to load fonts efficiently.

## The Problem with Web Fonts

Fonts block rendering:

```css
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2') format('woff2');
}
```

While loading, browsers hide text (FOIT) or show fallbacks (FOUT).

## Use font-display

Control font loading behavior:

```css
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2') format('woff2');
  font-display: swap;
}
```

Options:
- **swap**: Show fallback immediately, swap when loaded
- **optional**: Use only if cached or instant
- **block**: Wait briefly, then fallback
- **fallback**: Short block, then swap

`swap` is usually best for content sites.

## Preload Critical Fonts

Load important fonts sooner:

```html
<link rel="preload" 
      href="/fonts/heading.woff2" 
      as="font" 
      type="font/woff2" 
      crossorigin>
```

Only preload fonts used in the initial viewport.

## Subset Your Fonts

Include only characters you need:

```bash
# Using pyftsubset
pyftsubset font.ttf \
  --output-file=font-subset.woff2 \
  --flavor=woff2 \
  --text="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
```

Or use unicode ranges for specific languages:

```css
unicode-range: U+0000-007F; /* Basic Latin */
```

## Variable Fonts

One file, multiple styles:

```css
@font-face {
  font-family: 'Variable';
  src: url('variable.woff2') format('woff2-variations');
  font-weight: 100 900;
}

.element {
  font-variation-settings: 'wght' 450;
}
```

Reduces file size by combining weights.

## Self-Host When Possible

External requests add latency:

```css
/* Self-hosted */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
}

/* vs external */
@import url('https://fonts.googleapis.com/css2?family=Inter');
```

Self-hosting gives you control over caching and subsetting.

## Measure Font Loading

Track loading performance:

```javascript
document.fonts.ready.then(() => {
  console.log('All fonts loaded');
});

document.fonts.addEventListener('loadingdone', (event) => {
  console.log('Font loaded:', event.fontfaces);
});
```

## Keep It Simple

- Use system fonts for body text when possible
- Limit custom fonts to headings and branding
- Load maximum 2-3 font families
- Always include fallbacks

Good typography doesn't require dozens of fonts. Optimize aggressively, measure often.