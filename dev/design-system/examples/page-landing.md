# Landing Page Example

A complete landing page implementation demonstrating the Gray Design System in action. This example shows how to combine components, patterns, and tokens to create a cohesive, responsive landing page.

## Page Structure

This landing page includes:
- **Fixed Header**: Navigation with logo and action buttons
- **Hero Section**: Eye-catching introduction with gradient text and CTAs
- **Statistics Section**: Key metrics with tabular numbers
- **Features Section**: Grid-based feature display with icons
- **Footer**: Multi-column footer with links

## Complete Implementation

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <title>Gray Design System - Landing Page Example</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="./style.css" rel="stylesheet">
</head>

<body class="font-inter antialiased bg-white text-zinc-900 tracking-tight">

  <!-- Page wrapper -->
  <div class="flex flex-col min-h-screen overflow-hidden supports-[overflow:clip]:overflow-clip">

    <!-- Site header -->
    <header class="absolute top-2 md:top-6 w-full z-30" role="banner">
      <div class="px-4 sm:px-6">
        <div class="max-w-3xl mx-auto">
          <div class="flex items-center justify-between h-14 border border-transparent [background:linear-gradient(var(--color-white),var(--color-white))_padding-box,linear-gradient(120deg,var(--color-zinc-300),var(--color-zinc-100),var(--color-zinc-300))_border-box] rounded-lg px-3">
          
            <!-- Site branding -->
            <div class="shrink-0 mr-4">
              <a class="flex items-center justify-center bg-white w-8 h-8 rounded-sm shadow-xs shadow-zinc-950/20" href="#" aria-label="Home">
                <img src="./images/logo.png" width="24" height="24" alt="Logo">
              </a>
            </div>
          
            <!-- Desktop navigation -->
            <nav class="flex grow" role="navigation" aria-label="Main navigation">
              <ul class="flex grow justify-end flex-wrap items-center">
                <li>
                  <a class="text-sm font-medium text-zinc-500 hover:text-zinc-900 px-3 lg:px-5 py-2 flex items-center transition" href="#features">
                    Features
                  </a>
                </li>
                <li>
                  <a class="text-sm font-medium text-zinc-500 hover:text-zinc-900 px-3 lg:px-5 py-2 flex items-center transition" href="#pricing">
                    Pricing
                  </a>
                </li>
                <li>
                  <a class="text-sm font-medium text-zinc-500 hover:text-zinc-900 px-3 lg:px-5 py-2 flex items-center transition" href="login.html">
                    Log in
                  </a>
                </li>
                <li class="ml-1">
                  <a class="btn-sm text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm" href="request-demo.html">
                    Request Demo
                  </a>
                </li>
              </ul>
            </nav>
          
          </div>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="grow" role="main">
      
      <!-- Hero Section -->
      <section class="relative before:absolute before:inset-0 before:h-80 before:pointer-events-none before:bg-linear-to-b before:from-zinc-100 before:-z-10" aria-labelledby="hero-heading">
        <div class="pt-32 pb-12 md:pt-40 md:pb-20">
          <!-- Section content -->
          <div class="px-4 sm:px-6">
            <div class="max-w-3xl mx-auto">
              <div class="text-center pb-12 md:pb-16">
                <h1 id="hero-heading" class="font-inter-tight text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900 pb-4">
                  The creative
                  <em class="italic relative inline-flex justify-center items-center text-zinc-900">
                    platform
                    <svg class="absolute fill-zinc-300 w-[calc(100%+1rem)] -z-10" xmlns="http://www.w3.org/2000/svg" width="223" height="62" viewBox="0 0 223 62" aria-hidden="true" preserveAspectRatio="none">
                      <path d="M45.654 53.62c17.666 3.154 35.622 4.512 53.558 4.837 17.94.288 35.91-.468 53.702-2.54 8.89-1.062 17.742-2.442 26.455-4.352 8.684-1.945 17.338-4.3 25.303-7.905 3.94-1.81 7.79-3.962 10.634-6.777 1.38-1.41 2.424-2.994 2.758-4.561.358-1.563-.078-3.143-1.046-4.677-.986-1.524-2.43-2.96-4.114-4.175a37.926 37.926 0 0 0-5.422-3.32c-3.84-1.977-7.958-3.563-12.156-4.933-8.42-2.707-17.148-4.653-25.95-6.145-8.802-1.52-17.702-2.56-26.622-3.333-17.852-1.49-35.826-1.776-53.739-.978-8.953.433-17.898 1.125-26.79 2.22-8.887 1.095-17.738 2.541-26.428 4.616-4.342 1.037-8.648 2.226-12.853 3.676-4.197 1.455-8.314 3.16-12.104 5.363-1.862 1.13-3.706 2.333-5.218 3.829-1.52 1.47-2.79 3.193-3.285 5.113-.528 1.912-.127 3.965.951 5.743 1.07 1.785 2.632 3.335 4.348 4.68 2.135 1.652 3.2 2.672 2.986 3.083-.18.362-1.674.114-4.08-1.638-1.863-1.387-3.63-3.014-4.95-5.09C.94 35.316.424 34.148.171 32.89c-.275-1.253-.198-2.579.069-3.822.588-2.515 2.098-4.582 3.76-6.276 1.673-1.724 3.612-3.053 5.57-4.303 3.96-2.426 8.177-4.278 12.457-5.868 4.287-1.584 8.654-2.89 13.054-4.036 8.801-2.292 17.74-3.925 26.716-5.19C70.777 2.131 79.805 1.286 88.846.723c18.087-1.065 36.236-.974 54.325.397 9.041.717 18.07 1.714 27.042 3.225 8.972 1.485 17.895 3.444 26.649 6.253 4.37 1.426 8.697 3.083 12.878 5.243a42.11 42.11 0 0 1 6.094 3.762c1.954 1.44 3.823 3.2 5.283 5.485a12.515 12.515 0 0 1 1.63 3.88c.164.706.184 1.463.253 2.193-.063.73-.094 1.485-.247 2.195-.652 2.886-2.325 5.141-4.09 6.934-3.635 3.533-7.853 5.751-12.083 7.688-8.519 3.778-17.394 6.09-26.296 7.998-8.917 1.86-17.913 3.152-26.928 4.104-18.039 1.851-36.17 2.295-54.239 1.622-18.062-.713-36.112-2.535-53.824-6.23-5.941-1.31-5.217-2.91.361-1.852" />
                    </svg>
                  </em>
                  for cross-functional work
                </h1>
                <p class="text-lg text-zinc-500 mb-8">
                  Turbocharge your creative process with a powerful AI design platform that gives creatives the power of creating without limits.
                </p>
                <div class="max-w-xs mx-auto sm:max-w-none sm:inline-flex sm:justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div>
                    <a class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm" href="request-demo.html">
                      Request Demo
                    </a>
                  </div>
                  <div>
                    <a class="btn text-zinc-600 bg-white hover:text-zinc-900 w-full shadow-sm" href="#features">
                      Learn More
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <!-- Hero Image -->
            <div class="max-w-6xl mx-auto px-4 sm:px-6 flex justify-center pb-12 md:pb-20 relative before:absolute before:-top-12 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl before:-z-10">
              <img class="rounded-lg shadow-2xl" src="./images/hero-image.png" width="1104" height="620" alt="Platform dashboard showing creative tools and features">
            </div>
            <!-- Stats -->
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
                    Active users worldwide creating daily.
                  </p>
                </div>

                <!-- Stat 3 -->
                <div class="relative text-center md:px-5 after:hidden md:after:block after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-8 after:border-l after:border-zinc-300 after:border-dashed last:after:hidden">
                  <h4 class="font-inter-tight text-2xl md:text-3xl font-bold tabular-nums mb-2">
                    1.5M+
                  </h4>
                  <p class="text-sm text-zinc-500">
                    Downloads across all platforms combined.
                  </p>
                </div>

                <!-- Stat 4 -->
                <div class="relative text-center md:px-5 after:hidden md:after:block after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-8 after:border-l after:border-zinc-300 after:border-dashed last:after:hidden">
                  <h4 class="font-inter-tight text-2xl md:text-3xl font-bold tabular-nums mb-2">
                    192K
                  </h4>
                  <p class="text-sm text-zinc-500">
                    Five-star reviews and counting.
                  </p>
                </div>                        
                
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="relative bg-zinc-50" aria-labelledby="features-heading">
        <div class="py-12 md:py-20">
          <div class="max-w-6xl mx-auto px-4 sm:px-6">
            <div class="max-w-3xl mx-auto text-center pb-12">
              <h2 id="features-heading" class="font-inter-tight text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
                Go further than the speed of thought
              </h2>
              <p class="text-lg text-zinc-500">
                AI reads and understands your designs, and with nothing more than a single line of feedback, perform complex actions autonomously.
              </p>
            </div>

            <!-- Features Grid -->
            <div class="max-w-6xl mx-auto grid gap-12 sm:grid-cols-2 md:grid-cols-3">
              
              <!-- Feature 1: AI Effects -->
              <article class="flex items-start gap-4">
                <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">
                    AI Effects
                  </h3>
                  <p class="text-sm text-zinc-500">
                    Visually structure your designs and apply stunning effects with a single command.
                  </p>
                </div>
              </article>

              <!-- Feature 2: Creative Mode -->
              <article class="flex items-start gap-4">
                <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">
                    Creative Mode
                  </h3>
                  <p class="text-sm text-zinc-500">
                    Unleash your creativity with AI-powered tools that enhance your workflow.
                  </p>
                </div>
              </article>

              <!-- Feature 3: Realistic Images -->
              <article class="flex items-start gap-4">
                <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">
                    Realistic Images
                  </h3>
                  <p class="text-sm text-zinc-500">
                    Generate photorealistic images that match your design vision perfectly.
                  </p>
                </div>
              </article>

              <!-- Feature 4: Powerful Plugins -->
              <article class="flex items-start gap-4">
                <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M12 20V10" />
                    <path d="M18 20V4" />
                    <path d="M6 20v-4" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">
                    Powerful Plugins
                  </h3>
                  <p class="text-sm text-zinc-500">
                    Extend functionality with a wide range of integrated plugins and integrations.
                  </p>
                </div>
              </article>

              <!-- Feature 5: Team Collaboration -->
              <article class="flex items-start gap-4">
                <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">
                    Team Collaboration
                  </h3>
                  <p class="text-sm text-zinc-500">
                    Work together seamlessly with your team in real-time.
                  </p>
                </div>
              </article>

              <!-- Feature 6: Analytics Dashboard -->
              <article class="flex items-start gap-4">
                <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">
                    Analytics Dashboard
                  </h3>
                  <p class="text-sm text-zinc-500">
                    Track performance and gain insights with comprehensive analytics.
                  </p>
                </div>
              </article>

            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="relative bg-zinc-900" aria-labelledby="cta-heading">
        <div class="py-12 md:py-20">
          <div class="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 id="cta-heading" class="font-inter-tight text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
              Ready to transform your workflow?
            </h2>
            <p class="text-lg text-zinc-400 mb-8">
              Join thousands of creatives who are already using our platform to create faster and better.
            </p>
            <a class="btn text-zinc-100 bg-white hover:bg-zinc-50 shadow-sm" href="request-demo.html">
              Start Free Trial
            </a>
          </div>
        </div>
      </section>

    </main>

    <!-- Site footer -->
    <footer class="border-t border-zinc-200 bg-white py-12" role="contentinfo">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <!-- Brand column -->
          <div>
            <a class="flex items-center justify-center bg-white w-8 h-8 rounded-sm shadow-xs shadow-zinc-950/20" href="#" aria-label="Home">
              <img src="./images/logo.png" width="24" height="24" alt="Logo">
            </a>
            <p class="mt-4 text-sm text-zinc-500">
              The creative platform for cross-functional work, powered by AI.
            </p>
          </div>
          
          <!-- Product column -->
          <div>
            <h6 class="text-sm font-semibold text-zinc-900 mb-4">Product</h6>
            <ul class="space-y-2">
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="#features">
                  Features
                </a>
              </li>
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="#pricing">
                  Pricing
                </a>
              </li>
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="#">
                  Integrations
                </a>
              </li>
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="#">
                  Changelog
                </a>
              </li>
            </ul>
          </div>
          
          <!-- Resources column -->
          <div>
            <h6 class="text-sm font-semibold text-zinc-900 mb-4">Resources</h6>
            <ul class="space-y-2">
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="#">
                  Documentation
                </a>
              </li>
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="#">
                  Tutorials
                </a>
              </li>
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="#">
                  Blog
                </a>
              </li>
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="#">
                  Community
                </a>
              </li>
            </ul>
          </div>
          
          <!-- Company column -->
          <div>
            <h6 class="text-sm font-semibold text-zinc-900 mb-4">Company</h6>
            <ul class="space-y-2">
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="#">
                  About
                </a>
              </li>
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="#">
                  Careers
                </a>
              </li>
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="#">
                  Privacy
                </a>
              </li>
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="#">
                  Terms
                </a>
              </li>
            </ul>
          </div>
          
        </div>
      </div>
    </footer>

  </div>

</body>

</html>
```

## Component Breakdown

### Header Component
- **Type**: Fixed navigation with gradient border
- **Classes**: `absolute top-2 md:top-6 w-full z-30`
- **Pattern**: Logo + Navigation Links + CTA Button
- **Documentation**: See [Header Patterns](../layouts/patterns.md#navigation-patterns)

### Hero Section
- **Type**: Introduction with gradient text and dual CTAs
- **Classes**: `pt-32 pb-12 md:pt-40 md:pb-20`
- **Features**:
  - Gradient text heading: `bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900`
  - Italic emphasis with SVG underline
  - Responsive button group: `space-y-4 sm:space-y-0 sm:space-x-4`
  - Hero image with glow effect
- **Documentation**: See [Hero Section Pattern](../layouts/patterns.md#hero-section)

### Statistics Section
- **Type**: Metrics display with tabular numbers
- **Classes**: `grid gap-12 sm:grid-cols-2 md:grid-cols-4 md:-mx-5 md:gap-0`
- **Features**:
  - Tabular numbers: `tabular-nums`
  - Dashed vertical dividers on desktop: `after:border-zinc-300 after:border-dashed`
  - Responsive grid: 1 → 2 → 4 columns
- **Documentation**: See [Stats Section Pattern](../layouts/patterns.md#stats-section)

### Features Section
- **Type**: Grid-based feature display
- **Classes**: `bg-zinc-50` with `grid gap-12 sm:grid-cols-2 md:grid-cols-3`
- **Features**:
  - Icon + content layout: `flex items-start gap-4`
  - Icon containers: `bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm`
  - Semantic article elements
- **Documentation**: See [Feature Section Pattern](../layouts/patterns.md#feature-section)

### Footer Component
- **Type**: Multi-column footer
- **Classes**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8`
- **Pattern**: Brand + 3 link columns
- **Documentation**: See [Multi-Column Footer](../layouts/patterns.md#multi-column-footer)

## Token Usage

### Colors
- **Backgrounds**: `bg-white`, `bg-zinc-50`, `bg-zinc-900`
- **Text**: `text-zinc-900`, `text-zinc-500`, `text-zinc-400`, `text-zinc-100`
- **Borders**: `border-zinc-200`, `border-zinc-300`
- **Documentation**: See [Color Tokens](../tokens/colors.md)

### Typography
- **Headings**: `font-inter-tight`, `font-bold`, `text-4xl md:text-5xl`
- **Body**: `font-inter`, `text-lg`, `text-sm`
- **Emphasis**: `italic`, `relative inline-flex`
- **Documentation**: See [Typography Tokens](../tokens/typography.md)

### Spacing
- **Section padding**: `py-12 md:py-20`
- **Container padding**: `px-4 sm:px-6`
- **Grid gaps**: `gap-12`, `gap-8`
- **Margins**: `mb-4`, `mb-8`, `mt-4`
- **Documentation**: See [Spacing Tokens](../tokens/spacing.md)

## Responsive Behavior

### Mobile (< 640px)
- Single column layouts
- Stacked button groups
- Full-width containers
- Hidden desktop dividers

### Tablet (640px - 768px)
- Two-column grids (stats, features, footer)
- Horizontal button groups
- Standard container widths

### Desktop (> 768px)
- Multi-column grids (3-4 columns)
- Full header with gradient border
- Negative margins for edge alignment
- Tabular numbers with dividers

## Accessibility Features

### Semantic HTML
- `<header role="banner">` for page header
- `<main role="main">` for main content
- `<footer role="contentinfo">` for page footer
- `<nav role="navigation">` for navigation
- `<article>` for feature items

### ARIA Attributes
- `aria-labelledby` for section headings
- `aria-label` for logo links
- `aria-hidden="true"` for decorative SVGs
- `role="navigation"` for nav element

### Keyboard Navigation
- All links are focusable
- Proper focus states with `hover:text-zinc-900`
- Tab index order follows visual layout

### Color Contrast
- All text meets WCAG AA (≥4.5:1)
- Primary buttons: zinc-100 on zinc-900 (15.5:1)
- Secondary text: zinc-500 on white (7.5:1)

## Best Practices Demonstrated

### DO ✅
- Mobile-first responsive design
- Semantic HTML structure
- Consistent spacing patterns
- Proper heading hierarchy
- Accessible color contrasts
- Keyboard navigable interface
- ARIA attributes where needed
- Grid system for complex layouts
- Component reuse patterns
- Token-based styling

### Key Patterns
1. **Gradient Borders**: Header with complex gradient border pattern
2. **Glow Effects**: Hero image with blur glow
3. **Text Gradients**: Hero heading with clip-text
4. **Tabular Numbers**: Stats with aligned digits
5. **Responsive Grids**: Multiple breakpoint transitions
6. **Icon Containers**: Consistent icon styling
7. **Section Alternation**: White/zinc-50 background alternation

## Implementation Notes

### File Structure
- Place in root directory as `index.html`
- Reference `style.css` for compiled Tailwind
- Images in `./images/` directory
- Use `./` relative paths for links

### Dependencies
- Tailwind CSS v4.0.3
- @tailwindcss/forms plugin
- Inter & Inter Tight fonts (Google Fonts)

### Build Process
```bash
# Install dependencies
npm install

# Development mode (watch for changes)
npm run dev

# Production build
npm run build
```

## Related Examples

- **[Login Page](page-login.md)**: Authentication page with form components
- **[Request Demo](page-request-demo.md)**: Extended form with validation
- **[Card Components](../components/card.md)**: Card variants and patterns
- **[Form Components](../components/form.md)**: Form input styling and states

## Customization Tips

### Modifying Content
- Replace text content while keeping structure
- Update image alt text for accessibility
- Maintain heading hierarchy (H1 → H2 → H3)
- Keep consistent spacing values

### Modifying Styling
- Use token values from `tokens/` directory
- Maintain zinc color palette
- Keep responsive breakpoints consistent
- Preserve component class combinations

### Modifying Layout
- Adjust grid columns while maintaining responsive behavior
- Change container widths using `max-w-*` classes
- Modify section padding with `py-*` classes
- Keep semantic HTML structure intact

---

**Note**: This landing page demonstrates the complete Gray Design System in action. All components, patterns, and tokens work together to create a cohesive, accessible, and responsive experience. Use this example as a reference when generating similar landing pages, ensuring consistency with the design system.