# Layout Modules Reference

Complete guide to Nue's layout system for creating reusable site structure components.

## Overview

Layout modules are HTML templates that define the structural elements of your website (headers, footers, navigation, sidebars). They use a slot system to position content consistently across pages.

## Default HTML Structure

When you create a page in Nue, it automatically generates a semantic HTML structure:

```html
<html>
  <head>
    <!-- system meta elements -->
  </head>
  <body>
    <main>
      <article>
        <!-- your Markdown content -->
      </article>
    </main>
  </body>
</html>
```

Your Markdown content is rendered inside the `<article>` element.

## The Slot System

Nue uses predefined positions called "slots" where layout modules can be inserted. Slots are named positions in the page structure.

### Available Slots

| Slot Name | Purpose | Typical Content |
|-----------|---------|-----------------|
| `banner` | Temporary announcements | Alerts, promotions |
| `header` | Global site header | Logo, navigation |
| `subheader` | Secondary navigation | Breadcrumbs, tabs |
| `main` | Content wrapper | Around main content |
| `aside` | Sidebars | Navigation, widgets |
| `pagehead` | Page hero areas | Post headers, marketing sections |
| `pagefoot` | Call-to-action sections | Sign-up forms, related links |
| `beside` | Complementary navigation | Table of contents |
| `footer` | Global footer | Copyright, links |
| `bottom` | Overlays/menus | Modal triggers, bottom nav |

### Slot Hierarchy

```
<html>
  <head>...</head>
  <body>
    [banner slot]
    [header slot]
    [subheader slot]
    <main>
      [pagehead slot]
      [aside slot]
      <article>
        [content]
      </article>
      [pagefoot slot]
    </main>
    [footer slot]
    [bottom slot]
  </body>
</html>
```

## Creating Layout Modules

Layout modules are HTML files that fill specific slots.

### Basic Syntax

For HTML5 landmark elements (header, footer, main, aside), use the element directly:

```html
<header>
  <a href="/" class="logo">Site Name</a>
  <nav>
    <a href="/docs">Documentation</a>
    <a href="/blog">Blog</a>
    <a href="/about">About</a>
  </nav>
</header>
```

For non-landmark slots, use the `@name` attribute:

```html
<div @name="banner">
  <strong>Major update available!</strong>
  <a href="/blog/release-2.0/">Check out v2.0</a>
</div>
```

### Example: Site Header

```html
<header>
  <nav>
    <a href="/" class="logo">My Site</a>
    <navi :items="navigation.header"/>
  </nav>
  <button popovertarget="menu">Menu</button>
</header>
```

### Example: Site Footer

```html
<footer>
  <p>© 2024 Your Company</p>
  <nav>
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
  </nav>
</footer>
```

### Example: Page Hero

```html
<header @name="pagehead">
  <h1>{ title }</h1>
  <p class="meta">
    <pretty-date :date="pubDate"/>
    <span :if="author">by { author }</span>
  </p>
  <img :src="og_image" :alt="title">
</header>
```

## Special Layout Modules

Three special modules provide deeper control over your layout structure.

### 1. The Main Module

Control the structure inside `<main>`:

```html
<main>
  <h1>{ title }</h1>
  
  <aside>
    <slot for="pagehead"/>
  </aside>
  
  <article>
    <slot for="content"/>
  </article>
</main>
```

### 2. The Root Module

Override the entire HTML document structure:

```html
<html>
  <head>
    <slot for="head"/>
    <meta property="og:description" :content="og_description">
  </head>
  
  <body>
    <main>
      <h1>{ title }</h1>
      <slot for="content"/>
    </main>
  </body>
</html>
```

### 3. The Head Module

Add custom elements to `<head>`:

```html
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <script async src="https://analytics.example.com/script.js"></script>
</head>
```

## Module Organization

Layout modules can be defined at three scope levels.

### Global Layouts

**Location:** `@global/` directory

Available throughout your entire site.

```
@global/
├── layout.html      # Header and footer
├── layout.css       # Layout styles
└── main.html        # Custom main structure
```

### Application Layouts

**Location:** App directory (e.g., `blog/`, `docs/`)

Available only within that application/section.

```
blog/
├── blog.yaml
├── layout.html      # Blog-specific layout
└── hero.html        # Blog post header
```

### Page Layouts

**Location:** Page directory (e.g., `blog/post/`)

Available only for that specific page.

```
blog/post/
├── index.md
└── layout.html      # Post-specific layout
```

## Override Behavior

More specific modules override less specific ones:

```
Global Layout → App Layout → Page Layout
```

**Example:**
1. Global header in `@global/layout.html`
2. Blog header in `blog/layout.html` (overrides global for blog section)
3. Post header in `blog/post/layout.html` (overrides blog for this page)

## Module Storage

### Single File for Multiple Modules

A single `.html` file can contain multiple modules:

```html
<!-- @global/layout.html -->

<header>
  <nav>...</nav>
</header>

<footer>
  <p>...</p>
</footer>

<div @name="banner">
  <p>Announcement</p>
</div>
```

### Separate Files per Module

Or use separate files for organization:

```
@global/
├── header.html
├── footer.html
├── banner.html
└── sidebar.html
```

## Disabling Modules

Disable specific slots through configuration.

### In app.yaml

```yaml
aside: false
pagehead: false
pagefoot: false
```

### In page front matter

```markdown
---
title: Minimal Page
aside: false
pagefoot: false
---

Content without sidebars or footer sections.
```

## Template Syntax

Layout modules support dynamic templating features.

### Variables

Insert data from front matter or configuration:

```html
<h1>{ title }</h1>
<p>By { author }</p>
<img :src="og_image" :alt="title">
```

### Conditionals

Show content based on conditions:

```html
<p :if="author">Written by { author }</p>
<span :if="category">in { category }</span>
```

### Loops

Iterate over arrays:

```html
<nav>
  <a :for="item in navigation" :href="item.url">
    { item.title }
  </a>
</nav>
```

### Attributes

Dynamic attribute binding:

```html
<a :href="url" :class="{ active: isActive }">
  { title }
</a>
```

## Navigation Components

### Using navi Tag

Built-in component for navigation:

```html
<header>
  <navi :items="navigation.header"/>
</header>
```

Configure in `site.yaml`:

```yaml
navigation:
  header:
    - Home: /
    - Blog: /blog/
    - Contact: /contact/
  footer:
    - Privacy: /privacy/
    - Terms: /terms/
```

### Nested Navigation

```yaml
navigation:
  header:
    - Products: /products/
    - Services:
      - Consulting: /services/consulting/
      - Development: /services/development/
    - About: /about/
```

## Layout Examples

### Documentation Layout

```html
<!-- @global/layout.html -->

<header>
  <a href="/" class="logo">Docs</a>
  <navi :items="navigation.main"/>
</header>

<!-- docs/docs.yaml configures aside -->
<aside @name="aside">
  <navi :items="navigation.docs"/>
</aside>

<footer>
  <p>© 2024 Company</p>
</footer>
```

### Blog Layout

```html
<!-- blog/layout.html -->

<header @name="pagehead">
  <h1>{ title }</h1>
  <p class="post-meta">
    <pretty-date :date="pubDate"/>
    <span :if="author"> • { author }</span>
  </p>
</header>

<aside @name="beside">
  <h3>Table of Contents</h3>
  <!-- Auto-generated from headings -->
</aside>
```

### Marketing Layout

```html
<!-- @global/layout.html -->

<header>
  <nav>
    <a href="/" class="logo">Brand</a>
    <navi :items="navigation.main"/>
    <a href="/signup" class="cta">Get Started</a>
  </nav>
</header>

<footer>
  <div class="footer-grid">
    <div>
      <h4>Product</h4>
      <navi :items="navigation.product"/>
    </div>
    <div>
      <h4>Company</h4>
      <navi :items="navigation.company"/>
    </div>
  </div>
  <p>© 2024 Company</p>
</footer>
```

## Responsive Layouts

### Mobile Menu

```html
<header>
  <a href="/" class="logo">Site</a>
  <nav class="desktop">
    <navi :items="navigation.header"/>
  </nav>
  <button popovertarget="mobile-menu" class="mobile-only">
    Menu
  </button>
</header>

<div id="mobile-menu" popover>
  <nav>
    <navi :items="navigation.header"/>
  </nav>
</div>
```

### Conditional Slots

```yaml
# site.yaml
content:
  sections: [hero, features, testimonials]
```

```html
<div @name="pagehead" :if="sections.includes('hero')">
  <slot for="hero"/>
</div>
```

## Best Practices

### 1. Keep Modules Focused

Each module should have a single responsibility:

```html
<!-- Good: Focused on navigation -->
<header>
  <navi :items="navigation.header"/>
</header>

<!-- Avoid: Mixing unrelated content -->
<header>
  <navi :items="navigation.header"/>
  <div class="announcement">
    <!-- Move to banner slot -->
  </div>
</header>
```

### 2. Use Semantic HTML

```html
<!-- Good -->
<header>
  <nav>
    <a href="/">Home</a>
  </nav>
</header>

<!-- Avoid -->
<div class="header">
  <div class="nav">
    <a href="/">Home</a>
  </div>
</div>
```

### 3. Leverage Configuration

```yaml
# site.yaml
navigation:
  header:
    - Home: /
    - Blog: /blog/
```

```html
<!-- Good: Data-driven -->
<navi :items="navigation.header"/>

<!-- Avoid: Hardcoded -->
<nav>
  <a href="/">Home</a>
  <a href="/blog">Blog</a>
</nav>
```

### 4. Organize by Scope

```
@global/
  layout.html        # Site-wide header/footer

blog/
  layout.html        # Blog-specific layouts
  hero.html          # Post headers

docs/
  layout.html        # Docs-specific layouts
  sidebar.html       # Docs navigation
```

### 5. Use Descriptive Slot Names

```html
<!-- Good -->
<div @name="toc">
  <h3>Table of Contents</h3>
</div>

<!-- Avoid -->
<div @name="section1">
  <h3>Table of Contents</h3>
</div>
```

## Common Patterns

### Sticky Header

```html
<header class="sticky">
  <nav>
    <a href="/" class="logo">Site</a>
    <navi :items="navigation.header"/>
  </nav>
</header>
```

```css
/* @global/layout.css */
header.sticky {
  position: sticky;
  top: 0;
  background: var(--bg);
  z-index: 100;
}
```

### Breadcrumbs

```html
<nav @name="subheader" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span>/</span>
  <a :href="parent.url">{ parent.title }</a>
  <span>/</span>
  <span aria-current="page">{ title }</span>
</nav>
```

### Related Posts

```html
<aside @name="pagefoot">
  <h3>Related Posts</h3>
  <div class="related-posts">
    <a :for="post in related" :href="post.url">
      <img :src="post.image">
      <h4>{ post.title }</h4>
    </a>
  </div>
</aside>
```

## Debugging Layouts

### Inspect Module Loading

Check which modules are being loaded:

```bash
nue build --verbose
```

### Check Slot Filling

Temporarily add borders to see slot positions:

```css
/* Debugging only */
[aria-label] {
  border: 2px dashed red;
}

header, footer, aside, main {
  border: 2px dashed blue;
}
```

### Module Not Loading

1. Check file location (global vs. app vs. page)
2. Verify `@name` attribute for non-landmark slots
3. Check YAML configuration hasn't disabled the slot
4. Ensure module file has `.html` extension

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Module not appearing | Wrong location | Check scope (global/app/page) |
| Slot not filling | Disabled in config | Check YAML for `slot: false` |
| Layout not overriding | Naming mismatch | Ensure file is in correct directory |
| Variables not rendering | Wrong syntax | Use `{ variable }` not `${variable}` |
| Navigation empty | Config missing | Add to `site.yaml` navigation section |

## Advanced Topics

### Layout Inheritance

Create base layouts and extend them:

```html
<!-- @global/base-layout.html -->
<div class="page-wrapper">
  <slot for="content"/>
</div>

<!-- blog/layout.html -->
<extends src="@global/base-layout.html">
  <slot for="content">
    <article>
      <!-- blog-specific content -->
    </article>
  </slot>
</extends>
```

### Dynamic Layouts

Change layout based on page metadata:

```markdown
---
layout: wide
---
```

```html
<main :class="layout">
  <slot for="content"/>
</main>
```

```css
main.wide {
  max-width: 100%;
}

main {
  max-width: 800px;
}
```

## Summary

Layout modules in Nue:
- Use HTML templates to define site structure
- Leverage a slot system for positioning
- Support three scope levels (global, app, page)
- Enable template syntax for dynamic content
- Provide special modules for main, root, and head
- Can be organized in single or multiple files
- Support override behavior based on specificity
- Integrate with navigation configuration

Key principles:
- Separation of structure (HTML) from content (Markdown)
- Reusability across pages and sections
- Progressive enhancement from basic to advanced
- Semantic HTML for accessibility and SEO