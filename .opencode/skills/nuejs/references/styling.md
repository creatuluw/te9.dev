# Styling and Design Systems Reference

Complete guide to styling websites with Nue using CSS and design systems.

## Overview

Nue takes a CSS-first approach to styling, leveraging modern CSS features and web standards. Styles are kept separate from content and layout, following the separation of concerns principle.

## CSS Architecture

### Three-Layer Cascade

Nue uses CSS `@layer` for organized cascade control:

```css
@layer design, layout, component;

@layer design {
  /* Design tokens and base styles */
}

@layer layout {
  /* Structural styles */
}

@layer component {
  /* Component-specific styles */
}
```

Configure layer order in `site.yaml`:

```yaml
design:
  layers: [settings, elements, components]
```

### Directory Structure

```
@global/
├── design.css       # Design tokens and variables
├── typography.css   # Typography scale
├── layout.css       # Layout and structure
├── colors.css       # Color system
└── components.css   # Component styles
```

## Design System Variables

### CSS Custom Properties

Define design tokens using CSS custom properties:

```css
:root {
  /* Layout */
  --max-line-width: 42rem;
  --page-width: 1024px;
  --line-height: 1.65;
  
  /* Typography */
  --font: inter, "helvetica neue", system-ui;
  --monospace: "plex mono", courier, monospace;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
  --spacing-xl: 4rem;
  
  /* Border radius */
  --radius-s: 2px;
  --radius-m: 4px;
  --radius-l: 8px;
  
  /* UI sizing */
  --ui-sizing: 14px;
}
```

### Color System

Define a semantic color palette:

```css
:root {
  /* Light theme */
  --bg: #ffffff;
  --text: #64707f;
  --text-subtle: #95a0ae;
  --text-strong: #000;
  
  --gray: #dcdfe5;
  --gray-subtle: #f4f6f9;
  --gray-strong: #b0b4bc;
  
  --brand: #3481fe;
  --brand-text: white;
  
  --accent: #18aa79;
  --accent-text: white;
  
  --inverse: black;
  --inverse-text: white;
  
  --pop: #7727ff;
}

/* Dark theme */
.dark {
  --bg: #121212;
  --text: #a7b4c8;
  --text-subtle: #6d7d91;
  --text-strong: #eef2f7;
  
  --gray: #323d4e;
  --gray-subtle: #1c2026;
  --gray-strong: #4c5663;
  
  --accent: #0bbc81;
  --inverse: white;
  --inverse-text: black;
}
```

### Usage in Components

```css
.button {
  background-color: var(--brand);
  color: var(--brand-text);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-m);
}

.card {
  background-color: var(--gray-subtle);
  padding: var(--spacing-md);
  border: 1px solid var(--gray);
}
```

## Typography

### Typography Scale

```css
@layer design {
  :root {
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-2xl: 1.5rem;
    --font-size-3xl: 2rem;
    --font-size-4xl: 2.5rem;
  }
  
  h1 {
    font-size: var(--font-size-4xl);
    font-weight: 650;
    letter-spacing: -0.01em;
    line-height: 1.25;
    color: var(--text-strong);
  }
  
  h2 {
    font-size: var(--font-size-3xl);
    font-weight: 550;
    line-height: 1.25;
  }
  
  h3 {
    font-size: var(--font-size-xl);
    font-weight: 600;
  }
  
  h4 {
    font-size: var(--font-size-lg);
    font-weight: 600;
  }
  
  body {
    font-family: var(--font);
    font-size: var(--font-size-base);
    line-height: var(--line-height);
    color: var(--text);
  }
}
```

### Text Utilities

```css
.text-strong {
  color: var(--text-strong);
  font-weight: 600;
}

.text-subtle {
  color: var(--text-subtle);
  font-weight: 400;
}

.text-center {
  text-align: center;
}

.text-balance {
  text-wrap: balance;
}
```

## Layout Styles

### Page Layout

```css
@layer layout {
  body {
    max-width: var(--page-width);
    margin: 0 auto;
    padding: 2% 5%;
    
    /* Flexbox layout */
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    
    > main {
      flex: 1;
    }
    
    > header,
    > footer {
      padding: 1em;
    }
  }
}
```

### Header and Footer

```css
@layer layout {
  body > header {
    margin-bottom: 3rem;
    
    nav {
      display: flex;
      align-items: center;
      gap: 2em;
      justify-content: space-between;
    }
  }
  
  body > footer {
    margin-top: 6rem;
    padding-top: 2rem;
    border-top: 1px solid var(--gray);
    
    nav {
      display: flex;
      justify-content: space-between;
    }
  }
}
```

### Content Areas

```css
@layer layout {
  main > article {
    display: flex;
    flex-direction: column;
    gap: 3em;
    
    section {
      > h3,
      > h4 {
        margin-top: 2.5em;
      }
    }
  }
  
  main > aside {
    margin-block: 5em;
  }
  
  /* Constrain line length */
  h1, h2, h3, h4, p, li, pre {
    max-width: var(--max-line-width);
  }
}
```

## Component Styles

### Buttons

```css
@layer component {
  button,
  .button {
    background-color: var(--gray-subtle);
    color: var(--text-strong);
    text-align: center;
    font-family: inherit;
    font-size: inherit;
    padding: 0.5em 1.25em;
    border-radius: 0.25em;
    cursor: pointer;
    display: inline-block;
    white-space: nowrap;
    border: unset;
    gap: 0.5em;
    
    &:hover {
      filter: brightness(1.1);
    }
    
    &:active {
      filter: brightness(0.9);
      transform: scale(0.99);
    }
    
    &[disabled] {
      pointer-events: none;
      opacity: 0.33;
    }
    
    &.plain {
      background-color: unset;
      border: 0;
      padding: 0;
    }
  }
}
```

### Cards

```css
@layer component {
  .card {
    background-color: var(--gray-subtle);
    border-radius: var(--radius-m);
    padding: 1em 1.25em;
    
    .card {
      background-color: var(--bg);
    }
    
    > :first-child {
      margin-top: 0;
    }
    
    > :last-child {
      margin-bottom: 0;
    }
  }
}
```

### Navigation

```css
@layer component {
  nav {
    line-height: 1.25;
    
    a {
      color: var(--text);
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
      
      &:hover {
        color: var(--text-strong);
      }
    }
  }
}
```

### Forms

```css
@layer component {
  form {
    max-width: var(--width, 45em);
    margin-block: 2em;
  }
  
  input,
  textarea {
    background-color: var(--gray-subtle);
    border: none;
    color: var(--text);
    font-family: inherit;
    font-size: inherit;
    padding: 0.75em;
    width: 100%;
    margin: 0;
  }
  
  input:focus,
  textarea:focus {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
  }
  
  ::placeholder {
    color: var(--gray-strong);
  }
  
  :focus-visible {
    outline-color: var(--bg);
    outline-offset: 4px;
    outline-width: 1px;
  }
  
  label {
    display: block;
    margin-bottom: 0.5em;
    
    span {
      display: block;
      font-weight: 500;
      margin-bottom: 0.25em;
    }
  }
}
```

### Tables

```css
@layer component {
  table {
    font-size: var(--ui-sizing);
    border-collapse: collapse;
    width: 100%;
    
    tr {
      vertical-align: baseline;
    }
    
    th {
      color: var(--text-strong);
    }
    
    th,
    td {
      border-bottom: 1px solid var(--gray);
      padding: 0.5em 0;
      text-align: left;
      
      &:not(:first-child) {
        padding-left: 2em;
      }
    }
    
    td:first-child {
      white-space: nowrap;
      width: 25%;
    }
    
    tfoot td {
      color: var(--text-strong);
      font-weight: 500;
      border: 0;
    }
  }
}
```

## Responsive Design

### Media Queries

```css
/* Mobile-first approach */

/* Tablet */
@media (width >= 750px) {
  .sidebar {
    display: block;
  }
}

/* Desktop */
@media (width >= 1024px) {
  body {
    padding: 2% 10%;
  }
  
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Fluid Typography

```css
h1 {
  font-size: clamp(2rem, 5vw, 3rem);
}

body {
  font-size: clamp(1rem, 2vw, 1.125rem);
}
```

### Responsive Utilities

```css
@layer layout {
  @media (width < 750px) {
    .teaser,
    .social {
      display: none;
    }
    
    nav {
      flex-direction: column;
    }
  }
  
  @media (width >= 900px) {
    .columns {
      column-count: var(--count, 2);
      margin-block: 2em;
      column-gap: 1.5em;
      
      div {
        break-inside: avoid;
      }
    }
  }
}
```

## Layout Utilities

### Flexbox

```css
@layer layout {
  .row {
    align-items: center;
    display: flex;
    gap: 0.5em;
  }
  
  .flex {
    display: flex;
    gap: 1em;
    
    > * {
      flex: 1;
    }
    
    &.wrap {
      flex-wrap: wrap;
      
      > * {
        flex: 1 1 var(--cell-width, 200px);
      }
    }
  }
  
  .stack {
    flex-direction: column;
    align-items: unset;
    display: flex;
    gap: 1em;
  }
}
```

### Grid

```css
@layer layout {
  .grid {
    display: grid;
    grid-template-columns: repeat(
      auto-fit,
      minmax(var(--cell-width, 250px), 1fr)
    );
    gap: 1em;
  }
  
  .grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Motion and Animations

### View Transitions

Enable in `site.yaml`:

```yaml
site:
  view_transitions: true
```

Style transitions:

```css
article {
  view-transition-name: article;
}

::view-transition-old(article) {
  transform: scale(1.2) translateY(2em);
  transition: 0.8s;
}

::view-transition-new(article) {
  animation: fade-in 0.5s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

### Hover Effects

```css
@layer design {
  a {
    text-decoration-color: var(--brand);
    text-underline-offset: 0.25em;
    transition: color 0.3s ease, text-decoration-thickness 0.3s ease;
    
    &:hover {
      text-decoration-color: var(--brand);
      text-decoration-thickness: 2px;
      color: var(--text-strong);
    }
    
    &:visited {
      opacity: 0.5;
    }
  }
  
  button {
    transition: filter 0.2s ease, transform 0.2s ease;
  }
}
```

### CSS Transitions

```css
.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
```

## CSS Optimization

### Production Settings

In `site.yaml`:

```yaml
design:
  # Inline critical CSS
  inline_css: true
  
  # Limit utility class abuse
  max_class_names: 3
```

### Inline CSS

When `inline_css: true`, Nue inlines critical CSS directly in the HTML:

```html
<head>
  <style>
    /* Critical CSS inlined here */
  </style>
</head>
```

Benefits:
- Faster initial render
- No render-blocking CSS
- Better Core Web Vitals

### Minification

Use lightningcss for production:

```bash
nue build --production --lcss
```

## Component Library Pattern

### Library Structure

```
@library/
├── buttons.css      # Button variations
├── cards.css        # Card components
├── forms.css        # Form elements
├── motion.css       # Animations
└── utilities.css    # Utility classes
```

### Include in site.yaml

```yaml
libs: ["@library"]
```

Or in app.yaml:

```yaml
include: [buttons, cards, forms, motion]
```

### Example Component Library

**buttons.css:**

```css
@layer component {
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.5em 1.25em;
    border-radius: var(--radius-m);
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }
  
  .btn-primary {
    background-color: var(--brand);
    color: var(--brand-text);
  }
  
  .btn-secondary {
    background-color: var(--gray-subtle);
    color: var(--text-strong);
  }
  
  .btn-outline {
    background-color: transparent;
    border: 2px solid var(--brand);
    color: var(--brand);
  }
}
```

## Utility Classes

### Spacing

```css
@layer utilities {
  .m-0 { margin: 0; }
  .m-1 { margin: var(--spacing-xs); }
  .m-2 { margin: var(--spacing-sm); }
  .m-3 { margin: var(--spacing-md); }
  .m-4 { margin: var(--spacing-lg); }
  
  .p-0 { padding: 0; }
  .p-1 { padding: var(--spacing-xs); }
  .p-2 { padding: var(--spacing-sm); }
  .p-3 { padding: var(--spacing-md); }
  .p-4 { padding: var(--spacing-lg); }
}
```

### Text

```css
@layer utilities {
  .text-sm { font-size: var(--font-size-sm); }
  .text-lg { font-size: var(--font-size-lg); }
  .text-xl { font-size: var(--font-size-xl); }
  
  .font-normal { font-weight: 400; }
  .font-medium { font-weight: 500; }
  .font-bold { font-weight: 700; }
}
```

## Best Practices

### 1. Use CSS Layers

Organize cascade with layers:

```css
@layer design, layout, component, utilities;
```

### 2. Leverage Custom Properties

Use design tokens consistently:

```css
/* ✅ Good */
.card {
  padding: var(--spacing-md);
  background: var(--bg);
}

/* ❌ Avoid */
.card {
  padding: 1rem;
  background: #ffffff;
}
```

### 3. Keep Styles Modular

Organize by feature:

```
@global/
  ├── layout.css      # Structure
  ├── design.css      # Design tokens
  └── typography.css  # Type styles

blog/
  └── blog.css        # Blog-specific styles
```

### 4. Limit Class Names

Prevent utility class abuse:

```yaml
design:
  max_class_names: 3
```

This forces more semantic class naming:

```html
<!-- ✅ Good -->
<div class="card featured">

<!-- ❌ Avoid -->
<div class="p-4 m-2 bg-gray border-radius shadow hover:scale">
```

### 5. Use Native CSS Features

Leverage modern CSS:

```css
/* ✅ Native nesting */
.card {
  &:hover {
    transform: translateY(-4px);
  }
  
  > h3 {
    margin-top: 0;
  }
}

/* ✅ CSS Grid */
.layout {
  display: grid;
  grid-template-columns: 1fr 3fr;
}

/* ✅ Container queries */
@container (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}
```

### 6. Optimize for Performance

- Use `inline_css: true` in production
- Minimize specificity
- Avoid deep nesting
- Use efficient selectors
- Leverage browser caching

## Theming

### Light/Dark Mode

```css
:root {
  --bg: #ffffff;
  --text: #333333;
}

.dark {
  --bg: #121212;
  --text: #eef2f7;
}

/* System preference */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #121212;
    --text: #eef2f7;
  }
}
```

### Theme Switching

Use with interactive island:

```html
<button @name="theme-toggle" @click="toggleTheme">
  <span if="isDark">☀️</span>
  <span else>🌙</span>
  
  <script>
    let isDark = localStorage.getItem('theme') === 'dark'
    
    function toggleTheme() {
      isDark = !isDark
      document.body.classList.toggle('dark', isDark)
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }
    
    mounted() {
      document.body.classList.toggle('dark', isDark)
    }
  </script>
</button>
```

## Troubleshooting

### Styles Not Applying

1. Check CSS file location
2. Verify `include` setting in YAML
3. Check for syntax errors
4. Clear browser cache
5. Check CSS layer order

### Cascade Issues

1. Use `@layer` to control specificity
2. Check selector specificity
3. Verify import order
4. Use `!important` sparingly

### Performance Issues

1. Enable `inline_css: true`
2. Minimize CSS file size
3. Remove unused styles
4. Use `--lcss` flag for minification

## Summary

Nue styling principles:
- **CSS-first**: Use native CSS features
- **Layered architecture**: Organize with `@layer`
- **Design tokens**: Use CSS custom properties
- **Separation**: Keep styles separate from content
- **Performance**: Optimize for production
- **Modularity**: Organize by feature/component
- **Theming**: Support light/dark modes
- **Progressive enhancement**: Works without JavaScript

Key features:
- CSS `@layer` for cascade control
- CSS custom properties for design tokens
- Native CSS nesting
- View transitions API
- Production CSS inlining
- Responsive design utilities