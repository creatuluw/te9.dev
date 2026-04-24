# Blog Integration Specification

## Feature Overview

This feature integrates a standalone markdown-based blog system into the te9.dev-v2 website as an integral part of the main application. The blog system, originally built with the `@aureuma/svelta` package, allows content creators to write and publish blog posts using markdown files with frontmatter metadata. The integration will make the blog a seamless part of the te9 website experience, maintaining consistent navigation, styling, and user experience while preserving the powerful markdown publishing workflow.

The blog system reads markdown files from a content directory, parses frontmatter metadata (title, date, category, author, cover image, excerpt, tags), renders markdown to HTML, and provides utilities for listing posts, filtering by category/tags, finding hero posts, and navigating between adjacent posts. This spec covers the integration of this functionality into the main `src/routes` structure of te9.dev-v2.

## Success Criteria

1. **Blog routes accessible**: Users can access blog listing at `/blog` and individual posts at `/blog/[slug]`
2. **Markdown posts render correctly**: All markdown files in `src/content/blog/` are parsed and rendered with proper HTML formatting
3. **Frontmatter metadata extracted**: Title, date, category, author, cover, excerpt, and tags are correctly extracted and displayed
4. **Category filtering works**: Users can filter blog posts by category on the listing page
5. **Navigation functional**: Previous/next post navigation works on individual post pages
6. **Responsive design**: Blog pages are fully responsive across mobile, tablet, and desktop
7. **Consistent styling**: Blog styling matches the existing te9 website design system (dark theme, Tailwind CSS)
8. **No breaking changes**: Existing routes and functionality remain unaffected

## Design Goals

### Primary (Must Have)

- **P1**: Blog routes integrated into `src/routes/blog/` structure following SvelteKit conventions
- **P2**: Blog utility functions moved to `src/lib/blog.ts` for reuse across the application
- **P3**: Content directory at `src/content/blog/` for markdown post files
- **P4**: Server-side loading functions fetch and process blog data
- **P5**: Svelte 5 components with runes for reactive state management
- **P6**: Tailwind CSS styling consistent with existing site design

### Secondary (Nice to Have)

- **S1**: RSS feed generation for blog posts
- **S2**: Search functionality for blog content
- **S3**: Draft post support with environment-based visibility
- **S4**: Social sharing buttons on posts
- **S5**: Reading progress indicator on article pages

## User Experience

Users will access the blog through a "Journal" or "Blog" link in the main navigation. The blog listing page displays posts in a visually engaging bento-grid layout with a featured hero post, category filtering, and visual variety in card sizes. Clicking a post navigates to the full article page with the post content rendered from markdown, author information, publication date, reading time, and previous/next navigation links. The experience should feel cohesive with the rest of the te9 website, maintaining the dark theme, typography, and interaction patterns.

Content authors will create blog posts by adding markdown files to `src/content/blog/` with required frontmatter fields (title, date, category, author, cover, excerpt). Posts are automatically available after the site rebuilds, requiring no database or CMS interaction.

## Design Rationale

This integration approach leverages the existing `@aureuma/svelta` package which provides a mature, file-based blog system that aligns with SvelteKit's file-based routing philosophy. By keeping blog posts as markdown files in the repository, we maintain version control, simple authoring workflows, and fast build times. The bento-grid layout provides visual interest and allows for featured content highlighting without requiring a complex CMS.

The alternative approaches considered were:
1. **Headless CMS integration** (Contentful, Sanity): Adds complexity, external dependencies, and cost without clear benefits for a personal/studio blog
2. **MDX-based approach**: Would allow component embedding in posts but adds build complexity and is unnecessary for text-focused content
3. **Database-backed blog**: Over-engineering for static content that rarely changes

The chosen approach balances simplicity, maintainability, and user experience while keeping the content close to the codebase.

## Constraints/Assumptions

### Technical Constraints

- Must use SvelteKit 2.x and Svelte 5 (as per project package.json)
- Must use Tailwind CSS 4.x for styling (existing project dependency)
- Blog package `@aureuma/svelta` must be added to dependencies
- Markdown rendering requires `marked` package
- Content files must be committed to repository (no external CMS)

### Business Assumptions

- Blog content will be authored by technical team familiar with git/markdown
- Post frequency is moderate (1-4 posts per month)
- No user accounts or comments system needed
- No monetization or advertising integration required
- SEO is important but can be handled with basic meta tags

## Functional Requirements

### FR-1: Blog Post Storage

**Requirement**: Blog posts are stored as markdown files in `src/content/blog/` directory with frontmatter metadata.

**Acceptance Criteria**:
- Markdown files with `.md` extension are recognized as blog posts
- Frontmatter includes: title, date, category, author, cover, excerpt, tags (optional), featured (optional), draft (optional)
- Files are read at build time for production, at request time for development
- Invalid frontmatter is handled gracefully with default values

### FR-2: Blog Listing Page

**Requirement**: A listing page at `/blog` displays all published posts in a bento-grid layout with category filtering.

**Acceptance Criteria**:
- Page loads all published posts sorted by date (newest first)
- Hero post is selected and displayed prominently (2x2 card)
- Posts are displayed in varied card sizes (1x1, 2x1, 2x2)
- Category filter buttons allow filtering posts by category
- "All" filter resets to show all posts
- Empty state displays when no posts match filter

### FR-3: Individual Post Page

**Requirement**: Individual posts are accessible at `/blog/[slug]` with full content rendering.

**Acceptance Criteria**:
- Slug is derived from markdown filename (without `.md` extension)
- Post content is rendered from markdown to HTML
- Frontmatter metadata displays: category, title, author info, date, reading time
- Cover image displays if specified in frontmatter
- Previous/next navigation links show adjacent posts by date
- 404 error displays for non-existent slugs

### FR-4: Category and Tag System

**Requirement**: Posts can be organized by categories and tags with filtering support.

**Acceptance Criteria**:
- Categories are predefined with display labels and slugs
- Tags are free-form strings assigned per post
- Category filtering works on listing page
- Tag filtering works on listing page (can combine with category)
- Category and tag counts display accurately

### FR-5: Author Information

**Requirement**: Author information is displayed on posts with avatar, name, and title.

**Acceptance Criteria**:
- Authors are defined in configuration with id, name, title, avatar
- Author lookup by id from frontmatter
- Default author used when id not found
- Author avatar displays as circular image
- Author name and title display in byline

### FR-6: Reading Time Calculation

**Requirement**: Reading time is calculated and displayed for each post.

**Acceptance Criteria**:
- Reading time calculated based on word count (average 200 words/minute)
- Short format displays as "X min read"
- Long format displays as "X minute read" or "X minutes read"
- Reading time rounds up to nearest minute

### FR-7: Markdown Rendering

**Requirement**: Markdown content is rendered to HTML with proper formatting and styling.

**Acceptance Criteria**:
- Common markdown syntax renders correctly (headers, paragraphs, lists, links, images, code blocks)
- HTML output is sanitized to prevent XSS
- Typography plugin styles rendered content (prose classes)
- Code blocks support syntax highlighting (if package available)
- Images support alt text and responsive sizing

## Edge Cases

### EC-1: No Blog Posts

**Scenario**: Content directory is empty or contains no valid posts.

**Handling**: Listing page displays empty state message: "No posts yet. Check back soon!" with call-to-action if appropriate.

### EC-2: Invalid Frontmatter

**Scenario**: Markdown file has missing or malformed frontmatter fields.

**Handling**: Missing required fields use defaults (title: "Untitled", date: file modified date, author: default). Invalid posts are logged to console in development, silently skipped in production.

### EC-3: Missing Cover Image

**Scenario**: Post frontmatter references a cover image that doesn't exist.

**Handling**: Fallback to gradient background card design. Image error logged in development.

### EC-4: Invalid Slug in URL

**Scenario**: User navigates to `/blog/nonexistent-post`.

**Handling**: Server returns 404 error with appropriate error page. User can navigate back to listing.

### EC-5: Draft Posts

**Scenario**: Post has `draft: true` in frontmatter.

**Handling**: Draft posts are excluded from production builds. Draft posts are visible in development mode for preview.

### EC-6: Future-Dated Posts

**Scenario**: Post date is in the future.

**Handling**: Future posts are excluded from public listing but accessible via direct URL. Alternative: exclude entirely until date passes.

### EC-7: Duplicate Slugs

**Scenario**: Two markdown files have the same filename (case-insensitive).

**Handling**: Build process logs warning. Last file processed wins. Recommend unique filenames.

### EC-8: Very Long Content

**Scenario**: Post content is extremely long (10,000+ words).

**Handling**: Reading time reflects actual length. Consider table of contents for navigation. No hard limit enforced.

### EC-9: Special Characters in Frontmatter

**Scenario**: Frontmatter contains special characters, quotes, or non-ASCII text.

**Handling**: YAML parser handles escaping. UTF-8 encoding enforced. Test with international characters.

### EC-10: Broken Internal Links

**Scenario**: Markdown contains links to other posts that don't exist.

**Handling**: Links render but lead to 404. Consider build-time link validation as enhancement.