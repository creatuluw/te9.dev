┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │ 8  │ 9  │10  │11  │12  │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
```

### Column Classes

| Class | Columns | Use Case |
|-------|----------|----------|
| `grid-cols-1` | 1 column | Single column layout |
| `grid-cols-2` | 2 columns | Half-width columns |
| `grid-cols-3` | 3 columns | Third-width columns |
| `grid-cols-4` | 4 columns | Quarter-width columns |
| `grid-cols-6` | 6 columns | One-sixth width columns |
| `grid-cols-12` | 12 columns | Full 12-column grid |

### Span Classes

| Class | Spans | Use Case |
|-------|--------|----------|
| `col-span-1` | 1 column | 1/12 width |
| `col-span-2` | 2 columns | 1/6 width |
| `col-span-3` | 3 columns | 1/4 width |
| `col-span-4` | 4 columns | 1/3 width |
| `col-span-6` | 6 columns | 1/2 width |
| `col-span-8` | 8 columns | 2/3 width |
| `col-span-9` | 9 columns | 3/4 width |
| `col-span-12` | 12 columns | Full width |

## Grid Gaps

The gap system controls spacing between grid items:

| Class | Value | Usage |
|-------|--------|-------|
| `gap-0` | 0rem | No gap between items |
| `gap-4` | 1rem | Standard gap (16px) |
| `gap-5` | 1.25rem | Medium gap (20px) |
| `gap-8` | 2rem | Large gap (32px) |
| `gap-12` | 3rem | Extra large gap (48px) |

### Gap Variants

```html
<!-- Horizontal gap only -->
<div class="grid grid-cols-2 gap-x-4">
  <!-- Items with horizontal gap -->
</div>

<!-- Vertical gap only -->
<div class="grid grid-cols-2 gap-y-4">
  <!-- Items with vertical gap -->
</div>

<!-- Different horizontal and vertical gaps -->
<div class="grid grid-cols-2 gap-x-4 gap-y-8">
  <!-- Items with different horizontal and vertical gaps -->
</div>
```

## Grid Patterns

### Single Column Grid

Default layout for mobile and simple content.

```html
<div class="grid grid-cols-1 gap-6">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

**Classes:**
- Grid: `grid grid-cols-1`
- Gap: `gap-6` (1.5rem)

### Two-Column Grid

Common pattern for side-by-side content.

```html
<div class="grid gap-12 sm:grid-cols-2">
  <div>Left column</div>
  <div>Right column</div>
</div>
```

**Classes:**
- Mobile: `grid` (single column)
- Desktop: `sm:grid-cols-2` (two columns)
- Gap: `gap-12` (3rem)

### Three-Column Grid

Pattern for feature cards or content sections.

```html
<div class="grid gap-12 sm:grid-cols-2 md:grid-cols-3">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>
```

**Classes:**
- Mobile: `grid` (single column)
- Tablet: `sm:grid-cols-2` (two columns)
- Desktop: `md:grid-cols-3` (three columns)
- Gap: `gap-12`

### Four-Column Grid

Pattern for statistics or dense content grids.

```html
<div class="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>
```

**Classes:**
- Mobile: `grid` (single column)
- Tablet: `sm:grid-cols-2` (two columns)
- Desktop: `md:grid-cols-4` (four columns)
- Gap: `gap-12`

### Complex Column Span Grid

Grid with varying column spans.

```html
<div class="grid grid-cols-12 gap-6">
  <div class="col-span-12 md:col-span-8">
    <!-- Main content: 8 columns on desktop -->
  </div>
  <div class="col-span-12 md:col-span-4">
    <!-- Sidebar: 4 columns on desktop -->
  </div>
</div>
```

**Classes:**
- Grid: `grid grid-cols-12` (12-column grid)
- Mobile: Both items `col-span-12` (full width)
- Desktop: Main `md:col-span-8`, sidebar `md:col-span-4`
- Gap: `gap-6`

## Responsive Grid Examples

### Feature Section Grid

```html
<section class="py-12 md:py-20">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="grid gap-12 sm:grid-cols-2 md:grid-cols-3">
      <!-- Feature 1 -->
      <div class="flex items-start gap-4">
        <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div>
          <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Lightning Fast</h3>
          <p class="text-sm text-zinc-500">Optimized for speed and performance.</p>
        </div>
      </div>

      <!-- Feature 2 -->
      <div class="flex items-start gap-4">
        <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Secure & Reliable</h3>
          <p class="text-sm text-zinc-500">Enterprise-grade security and reliability.</p>
        </div>
      </div>

      <!-- Feature 3 -->
      <div class="flex items-start gap-4">
        <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <div>
          <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Team Collaboration</h3>
          <p class="text-sm text-zinc-500">Work together seamlessly with your team.</p>
        </div>
      </div>
    </div>
  </div>
</section>
```

**Layout:**
- Mobile: Single column stacked
- Tablet: Two columns
- Desktop: Three columns
- Gap: 3rem between items

### Statistics Grid

```html
<section class="py-12 md:py-20">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="max-w-sm mx-auto grid gap-12 sm:grid-cols-2 md:grid-cols-4 md:-mx-5 md:gap-0 items-start md:max-w-none">
      <!-- Stat 1 -->
      <div class="relative text-center md:px-5 after:hidden md:after:block after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-8 after:border-l after:border-zinc-300 after:border-dashed last:after:hidden">
        <h4 class="font-inter-tight text-2xl md:text-3xl font-bold tabular-nums mb-2">
          476K
        </h4>
        <p class="text-sm text-zinc-500">
          Assets packed with power beyond your imagination.
        </p>
      </div>

      <!-- Stat 2 -->
      <div class="relative text-center md:px-5 after:hidden md:after:block after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-8 after:border-l after:border-zinc-300 after:border-dashed last:after:hidden">
        <h4 class="font-inter-tight text-2xl md:text-3xl font-bold tabular-nums mb-2">
          1.44K
        </h4>
        <p class="text-sm text-zinc-500">
          Active users worldwide.
        </p>
      </div>

      <!-- Stat 3 -->
      <div class="relative text-center md:px-5 after:hidden md:after:block after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-8 after:border-l after:border-zinc-300 after:border-dashed last:after:hidden">
        <h4 class="font-inter-tight text-2xl md:text-3xl font-bold tabular-nums mb-2">
          1.5M+
        </h4>
        <p class="text-sm text-zinc-500">
          Downloads across all platforms.
        </p>
      </div>

      <!-- Stat 4 -->
      <div class="relative text-center md:px-5">
        <h4 class="font-inter-tight text-2xl md:text-3xl font-bold tabular-nums mb-2">
          192K
        </h4>
        <p class="text-sm text-zinc-500">
          Five-star reviews and counting.
        </p>
      </div>
    </div>
  </div>
</section>
```

**Layout:**
- Mobile: Single column stacked
- Tablet: Two columns
- Desktop: Four columns with dividers
- Uses negative margins for edge alignment
- Dashed vertical dividers between stats

### Content Layout Grid

```html
<div class="grid grid-cols-12 gap-8">
  <!-- Main content area -->
  <div class="col-span-12 md:col-span-8">
    <h2 class="font-inter-tight text-3xl font-bold text-zinc-900 mb-4">
      Main Content
    </h2>
    <p class="text-lg text-zinc-500 mb-6">
      This is the main content area spanning 8 columns.
    </p>
    <!-- Additional content -->
  </div>

  <!-- Sidebar -->
  <div class="col-span-12 md:col-span-4">
    <h3 class="font-inter-tight text-xl font-semibold text-zinc-900 mb-4">
      Sidebar
    </h3>
    <p class="text-sm text-zinc-500">
      This sidebar spans 4 columns on desktop.
    </p>
  </div>
</div>
```

**Layout:**
- 12-column grid
- Main content: 8 columns (2/3 width) on desktop
- Sidebar: 4 columns (1/3 width) on desktop
- Full width on mobile
- Gap: 2rem

## Grid Alignment

### Horizontal Alignment

```html
<!-- Left aligned (default) -->
<div class="grid grid-cols-2 justify-items-start">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Center aligned -->
<div class="grid grid-cols-2 justify-items-center">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Right aligned -->
<div class="grid grid-cols-2 justify-items-end">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Stretched (full width) -->
<div class="grid grid-cols-2 justify-items-stretch">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Vertical Alignment

```html
<!-- Top aligned (default) -->
<div class="grid grid-cols-2 items-start">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Center aligned -->
<div class="grid grid-cols-2 items-center">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Bottom aligned -->
<div class="grid grid-cols-2 items-end">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Stretched (full height) -->
<div class="grid grid-cols-2 items-stretch">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## Grid with Negative Margins

For edge-to-edge alignment in complex grids:

```html
<div class="grid grid-cols-4 md:-mx-5 md:gap-0">
  <div class="md:px-5">
    <!-- Grid item with padding to offset negative margin -->
  </div>
  <div class="md:px-5">
    <!-- Grid item with padding -->
  </div>
  <div class="md:px-5">
    <!-- Grid item with padding -->
  </div>
  <div class="md:px-5">
    <!-- Grid item with padding -->
  </div>
</div>
```

**Classes:**
- Grid: `grid grid-cols-4`
- Negative margin: `md:-mx-5` (only on desktop)
- No gap: `md:gap-0` (only on desktop)
- Item padding: `md:px-5` (offsets negative margin)

## Grid Auto Layouts

### Auto Fit Columns

Automatic columns that fit available space:

```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-auto-fit gap-6">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
  <div>Card 4</div>
</div>
```

**Classes:**
- Mobile: `grid-cols-1` (single column)
- Tablet: `sm:grid-cols-2` (two columns)
- Desktop: `lg:grid-cols-auto-fit` (auto-fit based on content)
- Gap: `gap-6`

### Minimum Column Width

Create columns with minimum width:

```html
<div class="grid grid-cols-[minmax(250px,1fr)] gap-6">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

**Classes:**
- Grid: `grid`
- Columns: `grid-cols-[minmax(250px,1fr)]` (minimum 250px, grow equally)
- Gap: `gap-6`

## Grid Props Table

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columns | `1 \| 2 \| 3 \| 4 \| 6 \| 12` | Responsive array | Number of columns per breakpoint |
| gap | `0 \| 4 \| 5 \| 6 \| 8 \| 12` | `6` | Spacing between grid items |
| gapX | `0 \| 4 \| 5 \| 6 \| 8 \| 12` | `undefined` | Horizontal gap only |
| gapY | `0 \| 4 \| 5 \| 6 \| 8 \| 12` | `undefined` | Vertical gap only |
| alignItems | `'start' \| 'center' \| 'end' \| 'stretch'` | `'stretch'` | Vertical alignment of items |
| justifyItems | `'start' \| 'center' \| 'end' \| 'stretch'` | `'stretch'` | Horizontal alignment of items |

## Usage Guidelines

### DO ✅

- Use the 12-column grid for complex layouts
- Design mobile-first (single column by default)
- Use consistent gaps within the same grid
- Use responsive breakpoints for optimal viewing
- Align grid content appropriately for use case
- Use negative margins sparingly and only when necessary
- Ensure grid items have meaningful content structure
- Test grids across all breakpoints
- Consider content when choosing column spans
- Use semantic HTML (section, article) within grid items

### DON'T ❌

- Don't mix different gap values in the same grid
- Don't create custom column numbers outside the system
- Don't use grids when flexbox is more appropriate
- Don't make grids too complex or nested
- Don't ignore mobile layouts (always design mobile-first)
- Don't use arbitrary grid values without purpose
- Don't create grids without clear content hierarchy
- Don't mix grid and flexbox unnecessarily
- Don't use negative margins without understanding impact
- Don't create grids that don't align with content

## Accessibility

### Semantic Grid Structure

Use semantic HTML within grid items:

```html
<div class="grid gap-12 sm:grid-cols-2">
  <article class="bg-zinc-100 border border-zinc-200 rounded-lg p-6">
    <h3 class="font-inter-tight font-semibold text-zinc-900">Article Title</h3>
    <p class="text-sm text-zinc-500">Article content...</p>
  </article>
  <article class="bg-zinc-100 border border-zinc-200 rounded-lg p-6">
    <h3 class="font-inter-tight font-semibold text-zinc-900">Article Title</h3>
    <p class="text-sm text-zinc-500">Article content...</p>
  </article>
</div>
```

### Keyboard Navigation

Ensure grid items are keyboard accessible:

```html
<div class="grid gap-12 sm:grid-cols-2" role="list">
  <article role="listitem" tabindex="0">
    <!-- Content -->
  </article>
  <article role="listitem" tabindex="0">
    <!-- Content -->
  </article>
</div>
```

### Screen Reader Considerations

Use appropriate ARIA attributes:

```html
<div class="grid gap-12 sm:grid-cols-2" role="list" aria-label="Feature list">
  <article role="listitem">
    <h3 class="font-inter-tight font-semibold text-zinc-900">Feature 1</h3>
  </article>
</div>
```

## Common Grid Patterns

### Hero Section

```html
<section class="py-12 md:py-20">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <!-- Text content -->
      <div>
        <h1 class="font-inter-tight text-4xl md:text-5xl font-bold text-zinc-900 mb-6">
          Hero Heading
        </h1>
        <p class="text-lg text-zinc-500 mb-8">
          Hero description paragraph.
        </p>
        <div class="space-x-4">
          <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
            Get Started
          </button>
          <button class="btn text-zinc-600 bg-white hover:text-zinc-900 shadow-sm">
            Learn More
          </button>
        </div>
      </div>
      
      <!-- Image -->
      <div class="flex justify-center">
        <img class="rounded-lg shadow-2xl" src="hero.jpg" alt="Hero image" />
      </div>
    </div>
  </div>
</section>
```

**Pattern:**
- Two-column grid (desktop)
- Centered vertical alignment
- 3rem gap between columns
- Full width on mobile

### Feature Grid

```html
<section class="py-12 md:py-20 bg-zinc-50">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="max-w-3xl mx-auto text-center pb-12">
      <h2 class="font-inter-tight text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
        Feature Section
      </h2>
      <p class="text-lg text-zinc-500">
        Section description paragraph.
      </p>
    </div>
    
    <div class="grid gap-12 sm:grid-cols-2 md:grid-cols-3">
      <!-- Feature cards -->
      <div class="flex items-start gap-4">
        <!-- Icon + content -->
      </div>
    </div>
  </div>
</section>
```

**Pattern:**
- Section header centered
- Three-column grid (desktop)
- 3rem gap between cards
- Icon + content layout within cards

## Implementation Notes

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        '0': '0',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '12': '3rem',
      },
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(min-content, 1fr))',
      },
    },
  },
};
```

### Custom Grid Utilities

```css
/* Custom grid patterns */
.grid-with-negative-margins {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

@media (min-width: 768px) {
  .grid-with-negative-margins {
    margin-left: -1.25rem;
    margin-right: -1.25rem;
    gap: 0;
  }
  
  .grid-with-negative-margins > * {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }
}
```

## Quick Reference

### Common Grid Configurations

| Layout | Mobile | Tablet | Desktop | Gap |
|---------|--------|---------|----------|------|
| Single Column | 1 col | 1 col | 1 col | 6 |
| Two Columns | 1 col | 2 col | 2 col | 12 |
| Three Columns | 1 col | 2 col | 3 col | 12 |
| Four Columns | 1 col | 2 col | 4 col | 12 |

### Gap Values

| Purpose | Class | Size |
|---------|--------|------|
| No gap | `gap-0` | 0px |
| Small gap | `gap-4` | 16px |
| Medium gap | `gap-6` | 24px |
| Large gap | `gap-8` | 32px |
| Extra large | `gap-12` | 48px |

---

**Note**: Always use exact grid classes specified in this documentation. Never create custom grid configurations or deviate from the 12-column system. Ensure all grids follow responsive design principles and accessibility guidelines.