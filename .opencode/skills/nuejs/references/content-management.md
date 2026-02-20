# Content Management Reference

Complete guide to managing content with Markdown, front matter, and content collections in Nue.

## Overview

Nue uses Markdown files with YAML front matter for content. This separation keeps content pure and maintainable while enabling powerful features like automatic collections, SEO optimization, and dynamic page generation.

## Markdown Files

### Basic Structure

Content files are Markdown (`.md`) with optional YAML front matter:

```markdown
---
title: My Page Title
description: A brief description
date: 2024-01-15
author: Jane Doe
---

# Heading

Content starts here...

## Subheading

More content...
```

### Front Matter

YAML block at the top of Markdown files between `---` markers:

```yaml
---
# Required fields
title: Page Title
description: Page description for SEO

# Optional metadata
date: 2024-01-15
author: Jane Doe
category: Technology
tags: [web, development, nue]

# Custom fields
hero_image: /img/hero.jpg
cta_text: Sign up now
featured: true
draft: false
---
```

### Common Front Matter Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `title` | Page title | `title: My Blog Post` |
| `description` | SEO description | `description: Learn about Nue` |
| `date` / `pubDate` | Publication date | `date: 2024-01-15` |
| `author` | Author name | `author: Jane Doe` |
| `category` | Content category | `category: Tutorial` |
| `tags` | Content tags | `tags: [web, css]` |
| `og_image` | Social sharing image | `og_image: /img/share.png` |
| `draft` | Hide from listings | `draft: true` |
| `layout` | Custom layout | `layout: wide` |
| `slug` | Custom URL slug | `slug: my-custom-url` |

### Metadata Aliases

Nue recognizes common aliases:

- `desc` → `description`
- `og` → `og_image`
- `date` → `pubDate`

## Content Collections

Content collections automatically group and organize related content files.

### Defining Collections

Configure collections in `site.yaml` or `app.yaml`:

```yaml
# site.yaml
collections:
  blog:
    include: [posts/]           # Include files in posts/ directory
    require: [title, date]      # Required front matter fields
    skip: [draft]               # Skip if draft field exists
    sort: date desc             # Sort by date, newest first
    
  team:
    include: [team/]
    require: [name, role, email]
    sort: name asc
    
  products:
    include: [products/]
    require: [title, price]
    tags: [featured]            # Only include if has this tag
    sort: price asc
```

### Collection Properties

**`include`** (required)
- Array of directory paths or file patterns
- Substring match on file path
- Example: `include: [posts/, articles/]`

**`require`** (optional)
- Array of required front matter fields
- Files missing these fields are excluded
- Example: `require: [title, date, author]`

**`skip`** (optional)
- Array of field names to check
- If field exists (even if false), file is excluded
- Example: `skip: [draft, private]`

**`tags`** (optional)
- Array of required tags
- Only files with these tags are included
- Example: `tags: [featured, popular]`

**`sort`** (optional)
- Field to sort by and direction
- Format: `field direction`
- Directions: `asc` (ascending), `desc` (descending)
- Example: `sort: date desc`

### Using Collections

Access collections with the `[page-list]` tag:

```markdown
# Blog Posts

[page-list]
```

**With specific collection:**

```markdown
# Team Members

[page-list collection="team"]
```

**Customizing output:**

```markdown
# Featured Products

[page-list collection="products" limit="5"]
```

### Collection Variables

Collections create template variables:

```html
<!-- In layout modules -->
<ul>
  <li :for="post in blog">
    <a :href="post.url">{ post.title }</a>
  </li>
</ul>
```

## Extended Markdown

Nue supports extended Markdown syntax beyond standard CommonMark.

### Custom Tags

Use bracket syntax for custom components:

```markdown
# My Page

Regular markdown content...

[page-list]

More content...

[contact-form]
```

### Image Syntax

Extended image syntax with dimensions:

```markdown
![Alt text](/img/photo.jpg "Title" 800x600)
```

### Definition Lists

Create definition lists:

```markdown
Term 1
: Definition for term 1

Term 2
: Definition for term 2
```

### Task Lists

Interactive task lists:

```markdown
- [x] Completed task
- [ ] Incomplete task
- [ ] Another task
```

### Footnotes

Add footnotes:

```markdown
Here's a statement with a footnote.[^1]

[^1]: This is the footnote text.
```

### Tables

Create tables:

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

### Code Blocks

Fenced code blocks with syntax highlighting:

```markdown
```javascript
function hello() {
  console.log('Hello, World!')
}
```
```

### Admonitions

Callout blocks (if supported):

```markdown
> **Note**: This is important information.

> **Warning**: Be careful with this.
```

## Page Listings

The `[page-list]` tag automatically generates listings from collections.

### Basic Usage

```markdown
# Blog

[page-list]
```

Uses default collection configured in `app.yaml`:

```yaml
# blog/blog.yaml
content_collection: posts
```

### Collection-Specific

```markdown
# Team

[page-list collection="team"]
```

### Customization

**Limit results:**

```markdown
[page-list limit="5"]
```

**Exclude current page:**

```markdown
[page-list exclude_current="true"]
```

**Custom template:**

Create custom listing layout in `blog/list-item.html`:

```html
<article>
  <h2><a :href="url">{ title }</a></h2>
  <p>{ description }</p>
  <pretty-date :date="pubDate"/>
</article>
```

Use it:

```markdown
[page-list template="list-item"]
```

## Content Organization

### Directory Structure

Organize content by type and hierarchy:

```
/
├── index.md                    # Homepage
├── about.md                    # About page
├── blog/                       # Blog section
│   ├── blog.yaml              # Blog configuration
│   ├── index.md               # Blog listing
│   └── posts/                 # Blog posts
│       ├── post-1.md
│       └── post-2.md
├── docs/                       # Documentation
│   ├── docs.yaml
│   ├── index.md
│   ├── getting-started.md
│   └── advanced/
│       └── api.md
└── team/                       # Team members
    ├── team.yaml
    ├── index.md
    └── members/
        ├── jane.md
        └── john.md
```

### Index Pages

Create `index.md` in directories for section landing pages:

```markdown
# blog/index.md
---
title: Blog
description: Latest articles and updates
---

# Blog

[page-list]
```

### Nested Content

Support multi-level content hierarchies:

```
docs/
├── index.md
├── getting-started/
│   ├── index.md
│   ├── installation.md
│   └── quick-start.md
└── api/
    ├── index.md
    ├── endpoints.md
    └── authentication.md
```

### Permalinks

Customize URLs with front matter:

```markdown
---
title: My Post
slug: custom-url-here
---

Content...
```

Results in URL: `/blog/custom-url-here/`

## Content Processing

### Auto-Generated IDs

Enable heading IDs for deep linking:

```yaml
# site.yaml
content:
  heading_ids: true
```

Results in:

```html
<h2 id="my-heading">My Heading</h2>
```

Link to it: `/blog/post/#my-heading`

### Auto-Generated Sections

Wrap content in sections automatically:

```yaml
# site.yaml
content:
  sections: true
```

Or with specific class names:

```yaml
content:
  sections: [hero, features, testimonials, cta]
```

Each section gets its own wrapper:

```html
<section class="hero">
  <!-- Content -->
</section>
```

### Section Wrappers

Add inner wrapper for layout control:

```yaml
content:
  section_wrapper: wrap
```

Results in:

```html
<section class="hero">
  <div class="wrap">
    <!-- Content -->
  </div>
</section>
```

## Global Links

Define reusable link references:

```yaml
# site.yaml
links:
  github: //github.com/nuejs/nue
  docs: //nuejs.org/docs/
  npm: //www.npmjs.com/package/nuekit
```

Use in Markdown:

```markdown
Check out the [GitHub repo][github] or read the [documentation][docs].
```

## Draft Content

Hide content from collections:

```markdown
---
title: Work in Progress
draft: true
---

Content still being written...
```

Or configure collection to skip:

```yaml
collections:
  blog:
    include: [posts/]
    skip: [draft]
```

## Content Metadata

### Title Templates

Define title patterns:

```yaml
# site.yaml
meta:
  title_template: "%s / My Site"
```

Results in: `"Blog Post Title / My Site"`

### SEO Optimization

```markdown
---
title: Optimized Title
description: SEO-friendly description (150-160 characters)
og_image: /img/social-share.png
author: Expert Author
keywords: [relevant, keywords, here]
---
```

### Social Sharing

```yaml
# site.yaml
meta:
  og_image: /img/default-social.png
  twitter_card: summary_large_image
```

Override per page:

```markdown
---
og_image: /img/custom-share.png
---
```

## Content Queries

### Access Collection Data

Use collection data in templates:

```html
<!-- Layout module -->
<div class="recent-posts">
  <h3>Recent Posts</h3>
  <ul>
    <li :for="post in blog.slice(0, 5)">
      <a :href="post.url">{ post.title }</a>
    </li>
  </ul>
</div>
```

### Filter by Front Matter

```html
<div :for="post in blog.filter(p => p.category === 'Tutorial')">
  <a :href="post.url">{ post.title }</a>
</div>
```

### Sort Dynamically

```html
<div :for="post in blog.sort((a, b) => a.title.localeCompare(b.title))">
  <a :href="post.url">{ post.title }</a>
</div>
```

## Best Practices

### 1. Consistent Front Matter

Use consistent fields across content types:

```markdown
---
title: string
description: string
date: YYYY-MM-DD
author: string
category: string
tags: array
---
```

### 2. Organize by Type

```
blog/posts/         # All blog posts
docs/guides/        # All guides
team/members/       # All team pages
```

### 3. Use Index Pages

Every section should have an `index.md`:

```
blog/index.md       # Blog landing
docs/index.md       # Docs landing
```

### 4. Leverage Collections

Define collections for each content type:

```yaml
collections:
  posts:
    include: [blog/posts/]
  guides:
    include: [docs/guides/]
```

### 5. Draft Mode

Use `draft: true` for work-in-progress:

```markdown
---
title: Coming Soon
draft: true
---
```

### 6. Semantic Structure

Use proper heading hierarchy:

```markdown
# H1 (page title - once per page)

## H2 (major sections)

### H3 (subsections)

#### H4 (details)
```

### 7. Descriptive Filenames

```
✓ how-to-install-nue.md
✓ getting-started-guide.md
✗ post1.md
✗ article.md
```

## Common Patterns

### Blog with Categories

```yaml
# blog/blog.yaml
collections:
  posts:
    include: [posts/]
    require: [title, date, category]
    sort: date desc
    
  featured:
    include: [posts/]
    require: [title, date]
    tags: [featured]
    sort: date desc
```

```markdown
# blog/index.md
---
title: Blog
---

# All Posts

[page-list collection="posts"]

# Featured

[page-list collection="featured" limit="3"]
```

### Documentation Site

```yaml
# docs/docs.yaml
collections:
  guides:
    include: [guides/]
    require: [title, order]
    sort: order asc
    
  api:
    include: [api/]
    require: [title, endpoint]
    sort: title asc
```

### Team Directory

```yaml
# team/team.yaml
collections:
  members:
    include: [members/]
    require: [name, role, email]
    sort: name asc
```

```markdown
---
name: Jane Doe
role: Developer
email: jane@example.com
bio: Full-stack developer with 5 years experience.
image: /img/team/jane.jpg
---

# Jane Doe

Full-stack developer with expertise in web technologies...
```

## Content Migration

### From Other Systems

**WordPress/Markdown export:**

1. Export content as Markdown
2. Adjust front matter format
3. Place in appropriate directories
4. Configure collections

**From static site generators:**

1. Keep Markdown content
2. Update front matter field names
3. Adjust collection configuration
4. Update internal links

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Collection empty | Wrong include path | Check directory names match |
| Pages not sorting | Missing sort field | Add field to front matter |
| Drafts showing | Collection not configured to skip | Add `skip: [draft]` |
| Page-list not working | Collection not defined | Check `content_collection` setting |
| Front matter ignored | YAML syntax error | Validate YAML format |

## Summary

Content management in Nue:
- **Markdown-first**: Content in `.md` files with YAML front matter
- **Collections**: Automatic grouping and sorting of related content
- **Page listings**: `[page-list]` tag for automatic generation
- **Extended syntax**: Enhanced Markdown features
- **Flexible organization**: Multiple patterns for content structure
- **SEO-friendly**: Built-in metadata support
- **Draft support**: Hide work-in-progress content

Key principles:
- Separation of content from presentation
- Convention over configuration
- Progressive enhancement
- Standards-based approach