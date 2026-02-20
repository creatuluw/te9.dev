---
name: nuejs
description: "Standards-first web framework for building modern websites. Use when: working with NueJS/Nuekit, building content-focused sites, using Markdown-based development, implementing interactive islands, creating static sites with dynamic features, or when user mentions 'nue', 'nuejs', 'nue kit'. Focuses on separation of content, layout, and styling with minimal JavaScript."
---

# NueJS Development

Build modern websites using web standards (HTML, CSS, Markdown) with minimal JavaScript. Nue separates content, layout, and styling for maintainable, fast-loading sites.

## Quick Start

### Installation

```bash
# Install Bun (required)
curl -fsSL https://bun.sh/install | bash

# Install Nue globally
bun install --global nuekit

# Create a new project
nue create simple-blog
```

### Basic Project Structure

```
/
├── @global/              # Global styles and layouts
│   ├── layout.css        # Core layout styles
│   ├── layout.html       # Header and footer templates
│   └── typography.css    # Typography scale
├── blog/                 # Blog content area
│   ├── blog.yaml         # Blog settings
│   ├── index.md          # Blog listing page
│   └── post.md           # Individual posts
├── img/                  # Images and icons
├── index.md              # Front page content
└── site.yaml             # Global settings
```

### Development Commands

```bash
# Start development server (default port: 8080)
nue serve

# Build for production
nue build --production

# Build specific file types
nue build .md .css
```

## Core Concepts

### 1. Content with Markdown

Pages are Markdown files with YAML front matter:

```markdown
---
title: My Page Title
description: Page description
date: 2024-01-15
---

# Heading

Content here...
```

**Key features:**
- Content collections for automatic page listings
- Hot reloading during development
- Extended Markdown syntax

**See**: `references/content-management.md` for collections, front matter, and advanced content features.

### 2. Layout Modules

HTML templates that define site structure using a slot system:

```html
<header>
  <nav>
    <a href="/">Home</a>
    <a href="/blog">Blog</a>
  </nav>
</header>

<footer>
  <p>© 2024 Your Site</p>
</footer>
```

**Slot positions**: banner, header, subheader, main, aside, pagehead, pagefoot, beside, footer, bottom

**See**: `references/layout-modules.md` for slot system, template syntax, and module organization.

### 3. Styling with CSS

Global design system with CSS custom properties:

```css
body {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2% 5%;
}

> header nav {
  justify-content: space-between;
  display: flex;
}
```

**Key features:**
- CSS layers for cascade control
- Design system variables
- Component-based styling

**See**: `references/styling.md` for design systems, CSS layers, and optimization.

### 4. Interactive Islands

Lightweight JavaScript components (2.5kb runtime) for interactivity:

```html
<form @name="contact-form" @submit.prevent="submit">
  <input type="email" name="email" required>
  <button>Submit</button>
  
  <script>
    function submit() {
      // Handle form submission
    }
  </script>
</form>
```

Use in Markdown: `[contact-form]`

**See**: `references/islands.md` for creating, organizing, and using interactive islands.

### 5. Configuration

Three-tier configuration system:

```yaml
# site.yaml (global)
title: My Site
port: 8080
view_transitions: true
content:
  heading_ids: true
  sections: true
```

**Levels**: site.yaml → app.yaml → page front matter

**See**: `references/configuration.md` for complete configuration reference.

## Development Workflow

### 1. Start Development

```bash
# Navigate to project
cd my-project

# Start server
nue serve

# Open browser to http://localhost:8080
```

### 2. Create Content

Add Markdown files with front matter:

```markdown
---
title: New Blog Post
date: 2024-01-20
---

Content goes here...
```

### 3. Add Layout

Create layout modules in `@global/layout.html`:

```html
<header>
  <nav>
    <a href="/">Home</a>
  </nav>
</header>
```

### 4. Style with CSS

Add styles in `@global/` directory:

```css
/* @global/layout.css */
body {
  font-family: system-ui;
}
```

### 5. Add Interactivity

Create islands in `.dhtml` files:

```html
<form @name="signup">
  <!-- form content -->
</form>
```

### 6. Build for Production

```bash
nue build --production
```

Output goes to `.dist/prod/`, ready for deployment.

## When to Use This Skill

Use NueJS when you need:

1. **Content-focused sites**: Blogs, documentation, marketing sites
2. **Standards-first approach**: Prefer HTML/CSS/Markdown over JavaScript frameworks
3. **Fast performance**: Minimal JavaScript, optimized CSS
4. **Clean separation**: Content, layout, and styling kept separate
5. **SEO-friendly**: Server-rendered content with optional client-side enhancement

## Common Tasks

### Create a Blog Post

1. Add Markdown file to `blog/` directory
2. Include front matter with title, date, description
3. Write content in Markdown
4. Site auto-generates listing with `[page-list]`

### Add a New Page

1. Create `page-name/index.md`
2. Add front matter and content
3. Link from navigation in `site.yaml`

### Create an Interactive Form

1. Create island in `contact.dhtml`
2. Add to page: `[contact-form]`
3. Handle submission in island's `<script>` tag

### Customize Layout

1. Edit `@global/layout.html` for header/footer
2. Create page-specific layouts in app directories
3. Use slot system to position elements

### Deploy to Production

1. Run `nue build --production`
2. Upload `.dist/prod/` to CDN or static host
3. Works with Cloudflare, Vercel, Netlify, etc.

## Detailed References

For comprehensive information on specific topics:

- **`references/installation.md`** - Detailed installation and setup
- **`references/tutorial.md`** - Complete tutorial walkthrough
- **`references/configuration.md`** - All configuration options
- **`references/layout-modules.md`** - Layout system and slots
- **`references/islands.md`** - Interactive islands
- **`references/content-management.md`** - Markdown, collections, front matter
- **`references/styling.md`** - CSS and design systems
- **`references/cli.md`** - Command line interface reference

## Key Principles

1. **Separation of concerns**: Content (Markdown), Layout (HTML), Style (CSS)
2. **Progressive enhancement**: Static first, JavaScript only when needed
3. **Standards-first**: Use web standards before abstractions
4. **Performance**: Minimal bundle size (entire ecosystem in 1MB)
5. **Developer experience**: Hot reloading, fast builds (<100ms)

## Getting Help

- Official docs: https://nuejs.org/docs/
- GitHub: https://github.com/nuejs/nue
- Community: Slack channel for questions
- Issues: Post bugs on GitHub issues

## Architecture Overview

Nue consists of six core packages:

1. **Nuekit** - Standards-first web framework
2. **Nuedom** - HTML-first UI assembly
3. **Nuestate** - URL-first state management
4. **Nuemark** - Content-first web development
5. **Nueserver** - Edge-first server development
6. **Nueglow** - CSS-first syntax highlighting

All packages work together but can be used independently. The framework is designed to replace larger ecosystems (500MB+) with a minimal footprint (1MB).