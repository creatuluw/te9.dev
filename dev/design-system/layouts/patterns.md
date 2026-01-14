# Layout Patterns

Layout patterns provide reusable structures for organizing content across pages and components. These patterns ensure consistency, responsiveness, and visual harmony throughout the system.

## Overview

Layout patterns are based on the 12-column grid system and responsive breakpoints. They provide consistent spacing, alignment, and content organization for common use cases like hero sections, feature displays, forms, and navigation elements.

## Page Structure

### Full Page Layout

Complete page structure with header, main content, and footer.

```html
<body class="font-inter antialiased bg-white text-zinc-900 tracking-tight">
  <!-- Page wrapper -->
  <div class="flex flex-col min-h-screen overflow-hidden supports-[overflow:clip]:overflow-clip">
    
    <!-- Site header -->
    <header class="absolute top-2 md:top-6 w-full z-30">
      <!-- Header content -->
    </header>
    
    <!-- Page content -->
    <main class="grow">
      <!-- Main content sections -->
    </main>
    
    <!-- Site footer -->
    <footer>
      <!-- Footer content -->
    </footer>
    
  </div>
</body>
```

**Classes:**
- Body: `font-inter antialiased bg-white text-zinc-900 tracking-tight`
- Page wrapper: `flex flex-col min-h-screen overflow-hidden supports-[overflow:clip]:overflow-clip`
- Main: `grow` (fills available space)

### Section Container

Standard section wrapper with responsive padding.

```html
<section class="relative bg-zinc-50">
  <div class="py-12 md:py-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <!-- Section content -->
    </div>
  </div>
</section>
```

**Classes:**
- Background: `bg-zinc-50` (or `bg-white` for light sections)
- Padding: `py-12 md:py-20` (3rem mobile → 5rem desktop)
- Container: `max-w-6xl mx-auto px-4 sm:px-6`

## Section Patterns

### Hero Section

Eye-catching introduction section with heading, description, and actions.

```html
<section class="relative before:absolute before:inset-0 before:h-80 before:pointer-events-none before:bg-linear-to-b before:from-zinc-100 before:-z-10">
  <div class="pt-32 pb-12 md:pt-40 md:pb-20">
    <!-- Section content -->
    <div class="px-4 sm:px-6">
      <div class="max-w-3xl mx-auto text-center pb-12 md:pb-16">
        <h1 class="font-inter-tight text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900 pb-4">
          Hero Heading Text
        </h1>
        <p class="text-lg text-zinc-500 mb-8">
          Hero description paragraph for introduction.
        </p>
        <div class="max-w-xs mx-auto sm:max-w-none sm:inline-flex sm:justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <a class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm" href="#">
            Primary Action
          </a>
          <a class="btn text-zinc-600 bg-white hover:text-zinc-900 w-full shadow-sm" href="#">
            Secondary Action
          </a>
        </div>
      </div>
    </div>
    <!-- Optional hero image -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 flex justify-center pb-12 md:pb-20 relative before:absolute before:-top-12 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl before:-z-10">
      <img class="rounded-lg shadow-2xl" src="hero.jpg" alt="Hero" width="1104" height="620" />
    </div>
  </div>
</section>
```

**Classes:**
- Gradient overlay: `before:absolute before:inset-0 before:h-80 before:pointer-events-none before:bg-linear-to-b before:from-zinc-100 before:-z-10`
- Vertical padding: `pt-32 pb-12 md:pt-40 md:pb-20` (8rem → 10rem, 3rem → 5rem)
- Heading: `font-inter-tight text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900 pb-4`
- Button group: `space-y-4 sm:space-y-0 sm:space-x-4` (vertical mobile, horizontal desktop)
- Image glow: `before:absolute before:-top-12 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl before:-z-10`

### Feature Section

Grid-based feature display with icons and descriptions.

```html
<section class="relative bg-zinc-50">
  <div class="py-12 md:py-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <!-- Section header -->
      <div class="max-w-3xl mx-auto text-center pb-12">
        <h2 class="font-inter-tight text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
          Feature Section Title
        </h2>
        <p class="text-lg text-zinc-500">
          Feature section description paragraph.
        </p>
      </div>

      <!-- Features grid -->
      <div class="max-w-6xl mx-auto grid gap-12 sm:grid-cols-2 md:grid-cols-3">
        <!-- Feature item -->
        <div class="flex items-start gap-4">
          <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
            <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">
              Feature Title
            </h3>
            <p class="text-sm text-zinc-500">
              Feature description text goes here.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

**Classes:**
- Background: `bg-zinc-50`
- Section padding: `py-12 md:py-20`
- Header: `max-w-3xl mx-auto text-center pb-12`
- Heading: `font-inter-tight text-3xl md:text-4xl font-bold text-zinc-900 mb-4`
- Grid: `grid gap-12 sm:grid-cols-2 md:grid-cols-3`
- Feature item: `flex items-start gap-4`
- Icon container: `flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0`

### Stats Section

Statistics display with numbers and descriptions.

```html
<section class="py-12 md:py-20">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="max-w-sm mx-auto grid gap-12 sm:grid-cols-2 md:grid-cols-4 md:-mx-5 md:gap-0 items-start md:max-w-none">
      <!-- Stat item -->
      <div class="relative text-center md:px-5 after:hidden md:after:block after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-8 after:border-l after:border-zinc-300 after:border-dashed last:after:hidden">
        <h4 class="font-inter-tight text-2xl md:text-3xl font-bold tabular-nums mb-2">
          476K
        </h4>
        <p class="text-sm text-zinc-500">
          Description of this statistic.
        </p>
      </div>
    </div>
  </div>
</section>
```

**Classes:**
- Mobile container: `max-w-sm mx-auto`
- Grid: `grid gap-12 sm:grid-cols-2 md:grid-cols-4`
- Desktop: `md:-mx-5 md:gap-0 md:max-w-none`
- Stat item: `relative text-center md:px-5`
- Divider: `after:hidden md:after:block after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-8 after:border-l after:border-zinc-300 after:border-dashed last:after:hidden`
- Number: `font-inter-tight text-2xl md:text-3xl font-bold tabular-nums mb-2`

### Form Section

Centered form container with special styling.

```html
<section class="relative before:absolute before:inset-0 before:h-80 before:pointer-events-none before:bg-linear-to-b before:from-zinc-100 before:-z-10">
  <div class="pt-32 pb-12 md:pt-40 md:pb-20">
    <div class="px-4 sm:px-6">
      <!-- Page header -->
      <div class="max-w-3xl mx-auto text-center pb-12 md:pb-16">
        <h1 class="font-inter-tight text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900">
          Form Page Title
        </h1>
      </div>

      <!-- Form container -->
      <div class="max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl bg-linear-to-b from-zinc-100 to-zinc-50/.7 relative before:absolute before:-top-12 before:-left-16 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl before:-z-10">
        <form>
          <!-- Form content -->
        </form>
      </div>
    </div>
  </div>
</section>
```

**Classes:**
- Form container: `max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl`
- Background: `bg-linear-to-b from-zinc-100 to-zinc-50/.7`
- Glow effect: `relative before:absolute before:-top-12 before:-left-16 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl before:-z-10`

## Navigation Patterns

### Fixed Header

Sticky navigation header that stays at top of page.

```html
<header class="absolute top-2 md:top-6 w-full z-30">
  <div class="px-4 sm:px-6">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center justify-between h-14 border border-transparent [background:linear-gradient(var(--color-white),var(--color-white))_padding-box,linear-gradient(120deg,var(--color-zinc-300),var(--color-zinc-100),var(--color-zinc-300))_border-box] rounded-lg px-3">
        
        <!-- Site branding -->
        <div class="shrink-0 mr-4">
          <a class="flex items-center justify-center bg-white w-8 h-8 rounded-sm shadow-xs shadow-zinc-950/20" href="#">
            <img src="logo.png" width="24" height="24" alt="Logo" />
          </a>
        </div>
        
        <!-- Desktop navigation -->
        <nav class="flex grow">
          <ul class="flex grow justify-end flex-wrap items-center">
            <li>
              <a class="text-sm font-medium text-zinc-500 hover:text-zinc-900 px-3 lg:px-5 py-2 flex items-center transition" href="#">
                Link 1
              </a>
            </li>
            <li class="ml-1">
              <a class="btn-sm text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm" href="#">
                CTA Button
              </a>
            </li>
          </ul>
        </nav>
        
      </div>
    </div>
  </div>
</header>
```

**Classes:**
- Position: `absolute top-2 md:top-6 w-full z-30`
- Container: `max-w-3xl mx-auto`
- Nav bar: `flex items-center justify-between h-14`
- Gradient border: `border border-transparent [background:linear-gradient(var(--color-white),var(--color-white))_padding-box,linear-gradient(120deg,var(--color-zinc-300),var(--color-zinc-100),var(--color-zinc-300))_border-box]`
- Logo container: `shrink-0 mr-4`
- Logo: `bg-white w-8 h-8 rounded-sm shadow-xs shadow-zinc-950/20`
- Nav link: `text-sm font-medium text-zinc-500 hover:text-zinc-900 px-3 lg:px-5 py-2`

## Footer Patterns

### Multi-Column Footer

Comprehensive footer with multiple link sections.

```html
<footer class="border-t border-zinc-200 bg-white py-12">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      
      <!-- Brand column -->
      <div>
        <a class="flex items-center justify-center bg-white w-8 h-8 rounded-sm shadow-xs shadow-zinc-950/20" href="#">
          <img src="logo.png" width="24" height="24" alt="Logo" />
        </a>
        <p class="mt-4 text-sm text-zinc-500">
          Company description and tagline goes here.
        </p>
      </div>
      
      <!-- Link column -->
      <div>
        <h6 class="text-sm font-semibold text-zinc-900 mb-4">Product</h6>
        <ul class="space-y-2">
          <li>
            <a class="text-sm text-zinc-500 hover:text-zinc-900" href="#">Features</a>
          </li>
          <li>
            <a class="text-sm text-zinc-500 hover:text-zinc-900" href="#">Pricing</a>
          </li>
          <li>
            <a class="text-sm text-zinc-500 hover:text-zinc-900" href="#">Integrations</a>
          </li>
        </ul>
      </div>
      
      <!-- Additional link columns -->
      <!-- ... -->
      
    </div>
  </div>
</footer>
```

**Classes:**
- Border: `border-t border-zinc-200`
- Background: `bg-white`
- Padding: `py-12`
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8`
- Heading: `text-sm font-semibold text-zinc-900 mb-4`
- Link list: `space-y-2`
- Link: `text-sm text-zinc-500 hover:text-zinc-900`

## Content Organization

### Two-Column Layout

Split content with text and image or related content.

```html
<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
  <!-- Left column -->
  <div>
    <h2 class="font-inter-tight text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
      Section Heading
    </h2>
    <p class="text-lg text-zinc-500 mb-6">
      Paragraph describing the content.
    </p>
    <a class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm" href="#">
      Learn More
    </a>
  </div>
  
  <!-- Right column -->
  <div class="flex justify-center">
    <img class="rounded-lg shadow-2xl" src="content.jpg" alt="Content" width="600" height="400" />
  </div>
</div>
```

**Classes:**
- Grid: `grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`
- Centered vertical: `items-center`

### Sidebar Layout

Main content with sidebar on desktop.

```html
<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
  <!-- Main content -->
  <div class="col-span-12 lg:col-span-8">
    <h1 class="font-inter-tight text-4xl font-bold text-zinc-900 mb-6">
      Main Content
    </h1>
    <!-- Content -->
  </div>
  
  <!-- Sidebar -->
  <aside class="col-span-12 lg:col-span-4">
    <div class="bg-zinc-100 border border-zinc-200 rounded-lg p-6">
      <h3 class="font-inter-tight font-semibold text-zinc-900 mb-4">
        Sidebar Title
      </h3>
      <!-- Sidebar content -->
    </div>
  </aside>
</div>
```

**Classes:**
- Grid: `grid grid-cols-1 lg:grid-cols-12 gap-8`
- Main content: `col-span-12 lg:col-span-8`
- Sidebar: `col-span-12 lg:col-span-4`
- Sidebar card: `bg-zinc-100 border border-zinc-200 rounded-lg p-6`

## Responsive Patterns

### Mobile-First Approach

All layouts start mobile-first and scale up:

```html
<!-- Single column on mobile -->
<div class="grid grid-cols-1 gap-6">
  <!-- Content stacks vertically on mobile -->
</div>

<!-- Two columns on tablet, three on desktop -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
  <!-- Responsive columns -->
</div>

<!-- Hidden on mobile, visible on tablet -->
<div class="hidden sm:block">
  <!-- Tablet and desktop only content -->
</div>
```

**Breakpoint Classes:**
- Mobile: No prefix (default)
- Tablet: `sm:` (640px+)
- Desktop: `md:` (768px+)
- Large desktop: `lg:` (1024px+)

### Container Widths

Responsive container widths for different content areas:

```html
<!-- Narrow container -->
<div class="max-w-sm mx-auto px-4 sm:px-6">
  <!-- Centered narrow content (384px) -->
</div>

<!-- Medium container -->
<div class="max-w-3xl mx-auto px-4 sm:px-6">
  <!-- Centered medium content (768px) -->
</div>

<!-- Wide container -->
<div class="max-w-6xl mx-auto px-4 sm:px-6">
  <!-- Centered wide content (1152px) -->
</div>

<!-- Full width container -->
<div class="w-full px-4 sm:px-6">
  <!-- Full width content -->
</div>
```

**Container Classes:**
- Narrow: `max-w-sm` (384px)
- Medium: `max-w-3xl` (768px)
- Wide: `max-w-6xl` (1152px)
- Full width: `w-full`
- Padding: `px-4 sm:px-6`

## Spacing Patterns

### Section Spacing

Consistent vertical spacing between sections:

```html
<!-- Compact section -->
<section class="py-8 md:py-12">
  <!-- 2rem mobile, 3rem desktop -->
</section>

<!-- Standard section -->
<section class="py-12 md:py-20">
  <!-- 3rem mobile, 5rem desktop -->
</section>

<!-- Spacious section -->
<section class="py-16 md:py-24">
  <!-- 4rem mobile, 6rem desktop -->
</section>
```

**Vertical Padding Classes:**
- Compact: `py-8 md:py-12`
- Standard: `py-12 md:py-20`
- Spacious: `py-16 md:py-24`

### Element Spacing

Consistent spacing within sections:

```html
<!-- Heading with bottom margin -->
<h2 class="font-inter-tight text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
  <!-- 1rem bottom margin -->
</h2>

<!-- Button group spacing -->
<div class="space-y-4 sm:space-y-0 sm:space-x-4">
  <!-- 1rem vertical (mobile) or horizontal (desktop) gap -->
</div>

<!-- Grid item spacing -->
<div class="grid gap-12">
  <!-- 3rem gap between items -->
</div>
```

**Spacing Classes:**
- Heading: `mb-4` (1rem)
- Button group: `space-y-4 sm:space-y-0 sm:space-x-4`
- Grid: `gap-12` (3rem)

## Usage Guidelines

### DO ✅

- Use consistent section padding across similar content types
- Design mobile-first layouts that scale up
- Use appropriate container widths for content type
- Maintain consistent spacing between elements
- Use semantic HTML (section, article, aside, nav)
- Ensure adequate contrast between alternating sections
- Test layouts on all breakpoints
- Use grid for complex layouts, flexbox for simple ones
- Keep layouts simple and maintainable
- Consider content hierarchy when choosing layouts

### DON'T ❌

- Don't create custom padding values outside the system
- Don't ignore mobile layouts (always design mobile-first)
- Don't mix different container widths in same section
- Don't use inconsistent spacing patterns
- Don't create overly complex nested layouts
- Don't use fixed widths for responsive content
- Don't ignore accessibility (keyboard navigation, screen readers)
- Don't create layouts without clear purpose
- Don't mix grid and flexbox unnecessarily
- Don't use arbitrary pixel values for spacing

## Accessibility

### Semantic Structure

Use proper semantic HTML elements:

```html
<!-- Page structure -->
<body>
  <header>
    <nav>
      <!-- Navigation -->
    </nav>
  </header>
  
  <main>
    <article>
      <!-- Main content -->
    </article>
    
    <aside>
      <!-- Sidebar content -->
    </aside>
  </main>
  
  <footer>
    <!-- Footer content -->
  </footer>
</body>

<!-- Section structure -->
<section aria-labelledby="section-heading">
  <h2 id="section-heading">Section Title</h2>
  <!-- Section content -->
</section>
```

### Keyboard Navigation

Ensure interactive elements are keyboard accessible:

```html
<!-- Focusable cards -->
<div class="bg-zinc-100 border border-zinc-200 rounded-lg p-6 hover:border-zinc-400 hover:shadow-md transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2" tabindex="0" role="button">
  <!-- Card content -->
</div>

<!-- Skip navigation link -->
<a class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50" href="#main-content">
  Skip to main content
</a>
```

### ARIA Landmarks

Use appropriate ARIA landmarks:

```html
<header role="banner">
  <!-- Site header -->
</header>

<nav role="navigation" aria-label="Main navigation">
  <!-- Navigation -->
</nav>

<main role="main" id="main-content">
  <!-- Main content -->
</main>

<aside role="complementary">
  <!-- Sidebar -->
</aside>

<footer role="contentinfo">
  <!-- Footer -->
</footer>
```

## Implementation Notes

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        '12': '3rem',
        '20': '5rem',
        '24': '6rem',
      },
      maxWidth: {
        '3xl': '48rem',   // 768px
        '6xl': '72rem',   // 1152px
      },
      gridTemplateColumns: {
        '12': 'repeat(12, minmax(0, 1fr))',
      },
    },
  },
};
```

### Custom Layout Utilities

```css
/* Layout utilities */
.layout-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
}

.layout-main {
  flex-grow: 1;
}

/* Gradient border pattern */
.gradient-border {
  border: 1px solid transparent;
  background: 
    linear-gradient(var(--color-white), var(--color-white)) padding-box,
    linear-gradient(120deg, var(--color-zinc-300), var(--color-zinc-100), var(--color-zinc-300)) border-box;
}

/* Glow effect pattern */
.glow-effect {
  position: relative;
}

.glow-effect::before {
  content: '';
  position: absolute;
  top: -3rem;
  left: -4rem;
  width: 24rem;
  height: 24rem;
  background: var(--color-zinc-900);
  opacity: 0.15;
  border-radius: 50%;
  filter: blur(3rem);
  z-index: -1;
}
```

## Pattern Reference

| Pattern | Classes | Use Case |
|----------|----------|----------|
| Hero Section | `py-12 md:py-20 text-center` | Page introduction |
| Feature Section | `bg-zinc-50 grid gap-12 sm:grid-cols-2 md:grid-cols-3` | Feature displays |
| Stats Section | `grid gap-12 sm:grid-cols-2 md:grid-cols-4 md:-mx-5` | Statistics display |
| Form Section | `max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl` | Form containers |
| Two-Column | `grid grid-cols-1 lg:grid-cols-2 gap-12 items-center` | Text + content |
| Sidebar | `grid grid-cols-1 lg:grid-cols-12` | Content + sidebar |

| Section Type | Padding | Container |
|--------------|----------|------------|
| Compact | `py-8 md:py-12` | `max-w-3xl mx-auto` |
| Standard | `py-12 md:py-20` | `max-w-6xl mx-auto` |
| Spacious | `py-16 md:py-24` | `max-w-6xl mx-auto` |

| Element | Spacing | Classes |
|---------|----------|----------|
| Heading | 1rem bottom | `mb-4` |
| Large Heading | 2rem bottom | `mb-8` |
| Button Group | 1rem gap | `space-x-4` |
| Form Fields | 1rem vertical | `space-y-4` |
| Grid Items | 3rem gap | `gap-12` |

---

**Note**: Always use exact layout classes specified in this documentation. Never create custom layout patterns or deviate from defined spacing and grid systems. Ensure all layouts follow responsive design principles and accessibility guidelines.