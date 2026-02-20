# Configuration Reference

Nue uses a three-tier configuration system that cascades from global to local settings.

## Configuration Hierarchy

Settings cascade in this order (later overrides earlier):

1. **site.yaml** - Global site-wide defaults
2. **app.yaml** - Application/section-specific settings
3. **Front matter** - Individual page settings

## Site-wide Configuration

Location: `site.yaml` in project root

### Server Settings

```yaml
# Development server port (default: 4000)
port: 8080

# Override via command line: nue --port 9090
```

### Site Metadata

```yaml
site:
  # Origin URL for sitemap.xml and RSS feed
  origin: https://example.com
  
  # Enable view transitions between pages (default: false)
  view_transitions: true
  
  # Skip files/directories from processing
  skip: [test/, @plans/, node_modules/]
```

### Design System

```yaml
design:
  # Configure CSS @layer cascade order
  layers: [settings, elements, components]
  
  # Limit class names per element (prevents utility abuse)
  max_class_names: 3
  
  # Inline all CSS in production builds
  inline_css: true
```

### Server Infrastructure

```yaml
# Option 1: Built-in server
server:
  dir: @shared/server        # Server code directory
  reload: true               # Auto-reload on changes

# Option 2: Reverse proxy
server:
  url: http://localhost:5000  # Backend server URL
  routes: [/api/, /private/]  # Forwarded routes
```

### Content Collections

```yaml
collections:
  blog:
    include: [posts/]        # Files to include (substring match)
    require: [date]          # Required front matter fields
    tags: [design]           # Required tags
    skip: [draft]            # Exclude if field exists
    sort: date desc          # Sort field and direction
    
  team:
    include: [team/]
    require: [role, email]
    sort: name asc
```

### SEO & Feeds

```yaml
# Sitemap generation
sitemap:
  enabled: true              # Generate sitemap.xml (default: false)
  skip: [draft, private]     # Skip pages with these fields

# RSS feed
rss:
  enabled: true              # Generate /feed.xml (default: false)
  collection: blog           # Collection to use
  title: Acme developer blog
  description: Latest news on web technologies
```

### Import Maps

```yaml
import_map:
  app: /@shared/app/index.js
  d3: /lib/d3.js
```

### Content Processing

```yaml
content:
  # Add IDs to headings for linking (default: false)
  heading_ids: true
  
  # Auto-wrap content in sections (default: false)
  sections: true
  
  # Assign class names to auto-generated sections
  sections: [hero, features, testimonials]
  
  # Wrap section content for layout control
  section_wrapper: wrap
```

### Default Metadata

```yaml
meta:
  # Page title
  title: The UNIX of the web
  
  # Title template for non-home pages (%s = page title)
  title_template: "%s / Acme Inc (DEV)"
  
  # Meta description
  description: Standards-first web framework
  
  # Favicon
  favicon: /img/logo.svg
  
  # Open Graph image
  og_image: /img/social.png
  
  # Viewport
  viewport: width=device-width,initial-scale=1
  
  # Language
  language: en-US
  
  # Text direction
  direction: <empty>
  
  # Body class
  class: <empty>
  
  # Publish date
  pubDate: null
  
  # Theme color for mobile browsers
  theme_color: "#0066cc"
  
  # Author
  author: Jane Doe
  
  # Search engine directives
  robots: index, follow
```

### Global Links

```yaml
links:
  # Reference: [dev branch][dev] on Github
  dev: //github.com/nuejs/nue/tree/dev/packages
  css_vars: //developer.mozilla.org/en-US/docs/Web/CSS/var
```

### Production Overrides

```yaml
production:
  # Metadata override
  title_template: "%s / Acme Inc"
  
  # Production-specific values
  analytics_id: GA-PROD-789012
```

## App-level Configuration

Location: `app.yaml` in any subdirectory

Overrides and extends site settings for that section:

```yaml
# blog/app.yaml

# Metadata overrides
meta:
  title: Blog Title
  author: Blog Author

# Content processing overrides
content:
  sections: false

# Extend site collections
collections:
  featured:
    include: [featured/]
    skip: [todo]
    sort: date desc
```

## Page-level Configuration

Location: Front matter in `.md` files

Highest priority, overrides both site and app settings:

```markdown
---
# Metadata
title: Page Title
description: Page description
og_image: /img/page-specific.png

# Content settings
sections: [hero, features]
---
```

## SVG Processing

Application-only setting in `app.yaml`:

```yaml
# visuals/app.yaml
svg:
  # Process .svg files as Nue templates
  process: true
  
  # Embed fonts in SVG output
  fonts:
    Inter: @shared/design/inter.woff2
```

## Metadata Aliases

Nue recognizes common aliases:

- `desc` → `description`
- `og` → `og_image`
- `date` → `pubDate`

## Configuration Examples

### Blog Configuration

```yaml
# site.yaml
collections:
  posts:
    include: [posts/]
    require: [title, date]
    sort: date desc

rss:
  enabled: true
  collection: posts
  title: My Blog
  description: Thoughts on web development
```

### Documentation Site

```yaml
# site.yaml
content:
  heading_ids: true
  sections: true

collections:
  docs:
    include: [docs/]
    sort: title asc

meta:
  robots: index, follow
```

### Marketing Site

```yaml
# site.yaml
content:
  sections: [hero, features, testimonials, cta]

design:
  inline_css: true
  max_class_names: 3

view_transitions: true
```

## Best Practices

1. **Start minimal**: Begin with essential settings in `site.yaml`
2. **Use app configs**: Organize sections with `app.yaml` files
3. **Leverage front matter**: Set page-specific overrides
4. **Environment separation**: Use `production:` for production-only values
5. **Collection organization**: Define collections based on content structure

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Settings not applying | Check cascade order (site → app → page) |
| Collection not showing | Verify `include` paths and `require` fields |
| RSS feed not generating | Ensure `collection` name matches defined collection |
| CSS not inlining | Set `inline_css: true` in design section |
| View transitions not working | Enable `view_transitions: true` in site config |