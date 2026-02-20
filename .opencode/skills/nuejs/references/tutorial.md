# Tutorial: Building Websites with Nue

Complete walkthrough of building a simple Markdown-based blog with Nue. Learn how Nue keeps content, structure, and style separate while adding interactivity where needed.

## Getting Started

### Prerequisites

Install Nue first (see installation guide):

```bash
bun install --global nuekit
```

### Create Demo Project

```bash
nue create simple-blog
```

Run it and open `http://localhost:8083` in your browser to follow along.

**Live demo**: Available on the NueJS website
**Source code**: Available on GitHub

## Project Structure

Nue organizes your blog into a directory structure that separates content, layout, and styling:

```
/
├── @global/             # Global styles and layouts
│   ├── colors.css       # Design system: colors
│   ├── layout.css       # Core layout styles
│   ├── layout.html      # Header and footer templates
│   └── typography.css   # Typography scale
├── blog/                # Blog content area
│   ├── blog.yaml        # Blog settings
│   ├── index.md         # Blog listing page
│   └── hero.html        # Blog post header template
├── img/                 # Images and icons
├── index.md             # Front page content
└── site.yaml            # Global settings
```

### Directory Purposes

- **`@global/`**: Reusable pieces for the whole site (styles, layouts, design tokens)
- **`blog/`**: Blog-specific content and configuration
- **`img/`**: Static assets
- **`index.md`**: Homepage
- **`site.yaml`**: Site-wide configuration

## Content Management

### Site Metadata

The `site.yaml` file sets up metadata for the entire site:

```yaml
title_template: "Emma Bennet / %s"
og: /img/og_emma.png
author: Emma Bennet
favicon: /img/favicon.jpg
```

This defines:
- How page titles appear (e.g., "Emma Bennet / Blog")
- Social sharing image
- Favicon
- Basic details for SEO and branding

### Blog Posts

Posts are Markdown files in the `blog/` directory:

```markdown
---
title: A standards first framework
description: Taking HTML, CSS and JavaScript to their peak
date: 2024-01-15
---

Content starts here...
```

The front matter provides metadata (title, description, date) that Nue uses to display the post. The Markdown below is the content itself.

### Content Collections

The blog's listing page (`blog/index.md`) shows all posts with a collection.

Set it up in `blog/blog.yaml`:

```yaml
content_collection: posts
```

Then use it in `blog/index.md`:

```markdown
# Emma's Blog

[page-list]
```

The `[page-list]` tag pulls every post from `blog/`, sorting them by date (newest first). It's a quick way to keep the list up to date automatically.

### Hot Reloading

Change a post (like its title) and save. Nue's hot reloading updates the browser instantly, keeping your workflow smooth without manual refreshes.

## Layout System

Layout modules are HTML files that define the blog's structure, wrapping around your Markdown content for consistency.

### Site-wide Layout

The `@global/layout.html` file provides a header and footer for all pages:

```html
<header>
  <navi :items="navigation.header"/>
</header>

<footer>
  <navi :items="navigation.footer"/>
</footer>
```

The `<navi>` tag builds navigation from `site.yaml`:

```yaml
navigation:
  header:
    - Emma Bennet: /
    - Contact: /contact/
  footer:
    - © Emma Bennet: /
    social:
      - image: /img/github.svg
        url: //github.com/nuejs/
        alt: Github Projects
```

This keeps navigation simple and centralized.

### Blog Post Layout

Each post gets a header from `blog/hero.html`:

```html
<header @name="pagehead">
  <h1>{ title }</h1>
  <p>
    <pretty-date :date="pubDate"/> • Content by AI
    Photo credits: <a href="//dribbble.com/{ credits }">{ credits }</a>
  </p>
  <img :src="og" width="1000" height="800" alt="Hero image for { title }">
</header>
```

It uses the post's front matter to fill in details, sitting above the content.

### Slot System

Nue uses predefined positions (slots) where layout modules can be inserted:

**Common slots:**
- `banner` - Announcements above header
- `header` - Global site header
- `subheader` - Breadcrumbs or secondary navigation
- `main` - Content inside main element
- `aside` - Sidebars
- `pagehead` - Hero areas
- `pagefoot` - Call-to-action sections
- `beside` - Table of contents
- `footer` - Global footer
- `bottom` - Overlays or menus

## Styling

Styling adds visual polish with CSS, kept separate from content and layout for flexibility.

### Global Styles

In `site.yaml`, global styles are included:

```yaml
globals: ["@global"]
libs: ["@library"]
```

The `@global/layout.css` file styles the page structure:

```css
body {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2% 5%;

  > header nav {
    justify-content: space-between;
    margin-bottom: 4rem;
    display: flex;
  }

  > footer {
    border-top: 1px solid var(--gray-200);
    justify-content: space-between;
    margin-top: 6rem;
    display: flex;
  }
}
```

### Component Styles

The blog adds specific styles in `blog.yaml`:

```yaml
include: [ content, cards, motion ]
```

These handle:
- Content formatting
- Post cards
- Animations

### CSS Layers

Use CSS `@layer` for cascade control:

```css
@layer design, layout, component;

@layer design {
  :root {
    --max-line-width: 42rem;
    --page-width: 1024px;
    --line-height: 1.65;
  }
}
```

### Design System Variables

Define CSS custom properties for consistency:

```css
:root {
  --bg: #ffffff;
  --text: #64707f;
  --text-subtle: #95a0ae;
  --text-strong: #000;
  --gray: #dcdfe5;
  --brand: #3481fe;
  --accent: #18aa79;
}

.dark {
  --bg: #121212;
  --text: #a7b4c8;
  --text-strong: #eef2f7;
}
```

## Interactive Islands

Islands add interactivity with custom tags, enhancing static content using a 2.5kb runtime.

### Contact Form Example

Here's the island from the demo, in `contact-me.dhtml`:

```html
<script>
  import { loadPage } from '/@nue/view-transitions.js'
</script>

<form @name="contact-me" @submit.prevent="submit" autocomplete="on">
  <label>
    <span>Your name</span>
    <input type="text" name="name" placeholder="Example: John Doe" required>
  </label>

  <label>
    <span>Your email</span>
    <input type="email" name="email" placeholder="your@email.com" required>
  </label>

  <label>
    <span>Requirements</span>
    <textarea name="feedback" placeholder="Type here..."></textarea>
  </label>

  <button>Let's talk!</button>

  <script>
    submit() {
      loadPage('thanks.html')
    }
  </script>
</form>
```

### Using Islands in Markdown

Add it to `index.md`:

```markdown
## Contact me

Get in touch to discuss your project.

[contact-me]
```

It submits and navigates to a "thanks" page with a transition.

### Island Organization

Islands can live at different levels:
- **Global islands**: `@globals/join-list.dhtml` for use across entire site
- **Area-specific islands**: `blog/islands.dhtml` for app-specific features
- **Page-specific islands**: `blog/post/islands.dhtml` for single pages

A single `.dhtml` file can hold multiple islands.

## Motion and Animations

Motion enhances the blog with CSS, keeping it lightweight.

### View Transitions

Enable them in `site.yaml`:

```yaml
view_transitions: true
```

Style them in `@library/motion.css`:

```css
article {
  view-transition-name: article;
}

::view-transition-old(article) {
  transform: scale(1.2) translateY(2em);
  transition: .8s;
}
```

This smooths page changes without JavaScript.

### CSS Transitions

Add transitions for interactive elements:

```css
a {
  text-decoration-color: var(--brand);
  text-underline-offset: .25em;
  transition: color 0.3s ease;
  
  &:hover {
    text-decoration-thickness: 2px;
    color: var(--text-strong);
  }
}
```

## Optimization

The blog stays fast with optimization features.

### CSS Optimization

Enable CSS inlining in `site.yaml`:

```yaml
inline_css: true
```

This loads critical CSS upfront for faster rendering.

### Performance Features

- **Works without JavaScript**: Core functionality doesn't require JS
- **Lazy image loading**: Images load as needed
- **Minimal runtime**: Only 2.5kb for interactive islands
- **Fast builds**: Usually completes in <100ms even with hundreds of files

### Production Build

Build for production:

```bash
nue build --production
```

Files end up in `.dist/prod`, optimized and ready for deployment.

## Deployment

### Build Process

```bash
# Build for production
nue build --production

# Output goes to .dist/prod/
```

### Deployment Options

The output is static files ready for:

1. **CDN deployment**: Cloudflare, AWS CloudFront
2. **Static hosting**: Vercel, Netlify, GitHub Pages
3. **Traditional hosting**: Any web server
4. **Edge deployment**: Compatible with edge networks

### Example: Cloudflare

1. Build project: `nue build --production`
2. Upload `.dist/prod/` contents to Cloudflare
3. Configure custom domain
4. Enable HTTPS

### Example: Vercel

1. Connect repository to Vercel
2. Set build command: `nue build --production`
3. Set output directory: `.dist/prod`
4. Deploy

## Next Steps

After completing this tutorial:

1. **Try multipage applications**: `nue create simple-mpa`
2. **Explore advanced layouts**: Create custom layout modules
3. **Add more islands**: Implement complex interactive features
4. **Customize design**: Build a complete design system
5. **Integrate APIs**: Connect to backends with server routes

## Common Patterns

### Blog with Categories

```yaml
# blog/blog.yaml
collections:
  featured:
    include: [featured/]
    sort: date desc
```

```markdown
# Featured Posts

[page-list collection="featured"]
```

### Documentation Site

```yaml
# docs/docs.yaml
include: [docs, navigation]
content:
  heading_ids: true
  sections: true
```

```markdown
# Documentation

[page-list]
```

### Portfolio Site

```yaml
# portfolio.yaml
collections:
  projects:
    include: [projects/]
    require: [title, image, description]
    sort: date desc
```

## Troubleshooting

### Hot Reload Not Working

1. Check that development server is running: `nue serve`
2. Verify file is being watched (check console output)
3. Try manual browser refresh

### Styles Not Applying

1. Check CSS file is in correct directory
2. Verify `include` setting in YAML configuration
3. Check for CSS syntax errors
4. Clear browser cache

### Islands Not Loading

1. Verify island file has `.dhtml` extension
2. Check `@name` attribute is set
3. Ensure island is referenced correctly: `[island-name]`
4. Check browser console for JavaScript errors

### Build Errors

1. Check YAML syntax in configuration files
2. Verify all referenced files exist
3. Check Markdown syntax in content files
4. Review error messages for specific issues

## Best Practices

1. **Keep content pure**: Avoid HTML in Markdown files
2. **Use layout modules**: Don't repeat structure across pages
3. **Leverage collections**: Automate content listings
4. **Optimize images**: Use appropriate sizes and formats
5. **Test without JS**: Ensure core functionality works
6. **Use semantic HTML**: Improve accessibility and SEO
7. **Organize by feature**: Group related files together
8. **Version control**: Track changes with Git

## Summary

This tutorial covered:
- Project structure and organization
- Content management with Markdown
- Layout modules and the slot system
- Styling with CSS and design systems
- Interactive islands for dynamic features
- Motion and animations
- Optimization techniques
- Deployment to production

Nue separates concerns (content, layout, style) while enabling progressive enhancement with interactive islands. The framework prioritizes web standards and performance, resulting in fast, maintainable websites.