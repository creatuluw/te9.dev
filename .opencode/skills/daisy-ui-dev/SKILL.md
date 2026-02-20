---
name: daisyui
description: Generate production-ready UI components using daisyUI, the most popular component library for Tailwind CSS. Provides access to 65+ components, 30+ themes, and semantic color utilities for rapid, beautiful interface development.
license: MIT
compatibility:
  - opencode
  - anthropic
metadata:
  audience: ui-engineers
  version: "1.0.0"
  category: design-system
  documentation_url: https://daisyui.com
  npm: https://www.npmjs.com/package/daisyui
---

# daisyUI Skill

Generate beautiful, accessible, and production-ready UI components using daisyUI - the most popular component library for Tailwind CSS. This skill provides comprehensive access to 65+ pre-built components, 30+ customizable themes, and semantic color utilities that reduce HTML size by 79% and class names by 88%.

## Overview

daisyUI is a Tailwind CSS plugin that adds semantic class names for common UI components. Instead of writing hundreds of utility classes for every element, you can use descriptive class names like `btn`, `card`, `modal`, and `navbar` while still having full customization power through Tailwind utilities.

### Why Use daisyUI?

- **88% fewer class names** - Write clean, semantic HTML
- **79% smaller HTML size** - Better performance and maintainability
- **65+ ready-to-use components** - Buttons, cards, forms, navigation, and more
- **30+ built-in themes** - Including light, dark, and creative themes
- **Pure CSS, no JavaScript** - Framework agnostic, works everywhere
- **Fully customizable** - Override any component with Tailwind utilities
- **Accessibility built-in** - WCAG AA compliant components
- **Dark mode ready** - Switch themes with a single class

## When to Use This Skill

Use this skill when you need to:
- Create UI components quickly without writing hundreds of utility classes
- Build consistent, themed interfaces
- Implement responsive layouts with pre-built patterns
- Add interactive elements (modals, dropdowns, tabs, carousels)
- Create forms with validation states and proper labeling
- Implement navigation (navbar, breadcrumbs, pagination, tabs)
- Add feedback elements (alerts, toasts, loading states, progress)
- Display data (tables, cards, stats, timelines, avatars)
- Use mockup components for showcases (browser, phone, code windows)
- Apply themes and semantic colors across your application

## Installation

### Step 1: Install daisyUI

```bash
# Using npm
npm install -D daisyui@latest

# Using yarn
yarn add -D daisyui@latest

# Using pnpm
pnpm add -D daisyui@latest

# Using bun
bun add -D daisyui@latest
```

### Step 2: Configure Tailwind CSS

Add daisyUI plugin to your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./public/index.html"
  ],
  plugins: [
    require('daisyui'),
  ],
  themes: ["light", "dark", "cupcake"], // Add your preferred themes
}
```

Or use the simplified CSS configuration (Tailwind CSS v4+):

```css
@import "tailwindcss";
@plugin "daisyui";
```

### Step 3: Apply a Theme

Add a `data-theme` attribute to your HTML or set it via JavaScript:

```html
<!-- In HTML -->
<html data-theme="dark">

<!-- Or via JavaScript -->
document.documentElement.setAttribute('data-theme', 'cupcake')
```

## Component Categories

daisyUI components are organized into 7 categories:

### 1. Actions
Interactive components that trigger actions or display menus.
- **button** - Various styles, sizes, and states
- **dropdown** - Click or hover dropdowns with menu items
- **fab** - Floating Action Button / Speed Dial
- **modal** - Dialog windows with various configurations
- **swap** - Toggle between two states
- **theme-controller** - Theme switcher component

### 2. Data Display
Components for presenting information and data.
- **accordion** - Collapsible content panels
- **avatar** - User profile images with status indicators
- **badge** - Small status or count indicators
- **card** - Content containers with images and actions
- **carousel** - Image/content sliders
- **chat-bubble** - Message bubbles for chat interfaces
- **collapse** - Collapsible sections
- **countdown** - Timer display
- **diff** - Before/after comparison
- **hover-3d-card** - 3D hover effects on cards
- **hover-gallery** - Image gallery with hover effects
- **kbd** - Keyboard shortcut displays
- **list** - Styled list items
- **stat** - Statistics display with icons
- **status** - Online/offline status indicators
- **table** - Data tables with various styles
- **text-rotate** - Rotating text animations
- **timeline** - Vertical or horizontal timelines

### 3. Navigation
Components for site navigation and wayfinding.
- **breadcrumbs** - Breadcrumb navigation
- **dock** - macOS-style dock navigation
- **link** - Styled links
- **menu** - Navigation menus with nested items
- **navbar** - Site navigation bars
- **pagination** - Page navigation
- **steps** - Multi-step process indicators
- **tab** - Tabbed content interfaces

### 4. Feedback
Components for providing user feedback and system status.
- **alert** - Informational messages
- **loading** - Loading spinners and animations
- **progress** - Linear progress bars
- **radial-progress** - Circular progress indicators
- **skeleton** - Content placeholder animations
- **toast** - Notification popups
- **tooltip** - Hover tooltips

### 5. Data Input
Form components for user input and data collection.
- **calendar** - Date picker
- **checkbox** - Checkboxes with various styles
- **fieldset** - Form field grouping
- **file-input** - File upload input
- **filter** - Filter dropdowns
- **label** - Form labels
- **radio** - Radio button groups
- **range** - Range sliders
- **rating** - Star ratings
- **select** - Dropdown selects
- **input** - Text, email, password inputs
- **textarea** - Multi-line text input
- **toggle** - Toggle switches
- **validator** - Form validation feedback

### 6. Layout
Components for structuring page layouts.
- **divider** - Visual separators
- **drawer** - Slide-out sidebars
- **footer** - Page footers
- **hero** - Hero sections
- **indicator** - Badges/notifications on elements
- **join** - Group connected elements
- **mask** - Image masking
- **stack** - Stacked elements with overlap

### 7. Mockup
Components for showcasing UI mockups and demos.
- **browser** - Browser window mockup
- **code** - Code editor window
- **phone** - Mobile device mockup
- **window** - Application window

## Using the daisyUI Tool

The daisyUI tool provides programmatic access to all components and themes. Use it to generate component code, search for components, and explore themes.

### Available Actions

#### 1. List Components
```javascript
// List all components
result = tool("daisyui", {
  "action": "list-components"
})

// List components by category
result = tool("daisyui", {
  "action": "list-components",
  "category": "dataDisplay"
})
```

#### 2. Get Component Code
```javascript
// Get basic component
result = tool("daisyui", {
  "action": "get-component",
  "component": "button"
})

// Get specific variant
result = tool("daisyui", {
  "action": "get-component",
  "component": "button",
  "variant": "primary"
})

// Get component with custom utilities
result = tool("daisyui", {
  "action": "generate-component",
  "component": "card",
  "variant": "withImage",
  "custom": true
})
```

#### 3. List Themes
```javascript
// List all available themes
result = tool("daisyui", {
  "action": "list-themes"
})
```

#### 4. Get Theme Details
```javascript
// Get specific theme configuration
result = tool("daisyui", {
  "action": "get-theme",
  "theme": "cupcake"
})
```

#### 5. Search Components
```javascript
// Search for components
result = tool("daisyui", {
  "action": "search",
  "search": "button"
})
```

## Quick Reference

### Essential Components

**Button:**
```html
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-outline">Outline Button</button>
<button class="btn btn-ghost">Ghost Button</button>
```

**Input:**
```html
<input type="text" placeholder="Type here" class="input input-bordered w-full" />
```

**Card:**
```html
<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Card Title</h2>
    <p>Card content goes here</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</div>
```

**Modal:**
```html
<button class="btn" onclick="my_modal.showModal()">Open Modal</button>
<dialog id="my_modal" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Hello!</h3>
    <p class="py-4">Press ESC or click outside to close</p>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
</dialog>
```

**Alert:**
```html
<div class="alert alert-info">
  <span>Information message</span>
</div>
<div class="alert alert-success">
  <span>Success message</span>
</div>
<div class="alert alert-warning">
  <span>Warning message</span>
</div>
<div class="alert alert-error">
  <span>Error message</span>
</div>
```

**Navbar:**
```html
<div class="navbar bg-base-100">
  <div class="navbar-start">
    <a class="btn btn-ghost text-xl">Logo</a>
  </div>
  <div class="navbar-center hidden lg:flex">
    <ul class="menu menu-horizontal px-1">
      <li><a>Home</a></li>
      <li><a>About</a></li>
      <li><a>Contact</a></li>
    </ul>
  </div>
  <div class="navbar-end">
    <button class="btn btn-primary">Login</button>
  </div>
</div>
```

**Tabs:**
```html
<div role="tablist" class="tabs tabs-boxed">
  <a role="tab" class="tab">Tab 1</a>
  <a role="tab" class="tab tab-active">Tab 2</a>
  <a role="tab" class="tab">Tab 3</a>
</div>
```

### Semantic Colors

daisyUI provides semantic color names that work across all components:

- **primary** - Main brand color
- **secondary** - Secondary brand color
- **accent** - Accent/highlight color
- **neutral** - Neutral gray tones
- **info** - Informational blue
- **success** - Success green
- **warning** - Warning yellow
- **error** - Error red

Apply semantic colors to components:
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-accent">Accent</button>
<button class="btn btn-info">Info</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-warning">Warning</button>
<button class="btn btn-error">Error</button>
```

### Component Sizes

Most components support size modifiers: `xs`, `sm`, `md`, `lg`, `xl`

```html
<button class="btn btn-xs">Extra Small</button>
<button class="btn btn-sm">Small</button>
<button class="btn btn-md">Medium</button>
<button class="btn btn-lg">Large</button>
```

### Common Patterns

**Form with Label:**
```html
<label class="form-control w-full max-w-xs">
  <div class="label">
    <span class="label-text">Email Address</span>
  </div>
  <input type="email" class="input input-bordered w-full max-w-xs" />
</label>
```

**Badge on Element:**
```html
<div class="indicator">
  <span class="indicator-item badge badge-secondary">new</span>
  <button class="btn">Notifications</button>
</div>
```

**Stacked Elements:**
```html
<div class="stack">
  <div class="alert alert-info">Message 1</div>
  <div class="alert alert-success">Message 2</div>
  <div class="alert alert-warning">Message 3</div>
</div>
```

**Hero Section:**
```html
<div class="hero min-h-screen bg-base-200">
  <div class="hero-content text-center">
    <div class="max-w-md">
      <h1 class="text-5xl font-bold">Welcome!</h1>
      <p class="py-6">Your content here</p>
      <button class="btn btn-primary">Get Started</button>
    </div>
  </div>
</div>
```

## Popular Themes

### Light Themes
- **light** - Clean, modern light theme
- **cupcake** - Playful pastel colors
- **emerald** - Green nature theme
- **corporate** - Professional business theme
- **wireframe** - Minimal wireframe style
- **pastel** - Soft pastel colors

### Dark Themes
- **dark** - Classic dark theme
- **dracula** - Popular Dracula color scheme
- **night** - Deep dark blue theme
- **cyberpunk** - Neon cyberpunk aesthetic
- **synthwave** - Retro synthwave vibes
- **black** - Pure black theme

### Creative Themes
- **bumblebee** - Yellow and purple
- **retro** - Vintage color palette
- **valentine** - Romantic pink tones
- **halloween** - Orange and black
- **luxury** - Gold and black premium feel

### Apply a Theme

```html
<!-- Set theme on HTML element -->
<html data-theme="cupcake">

<!-- Or change dynamically -->
<select id="theme-selector" class="select select-bordered">
  <option value="light">Light</option>
  <option value="dark">Dark</option>
  <option value="cupcake">Cupcake</option>
  <option value="dracula">Dracula</option>
</select>

<script>
document.getElementById('theme-selector').addEventListener('change', (e) => {
  document.documentElement.setAttribute('data-theme', e.target.value)
})
</script>
```

## Accessibility Best Practices

daisyUI components are built with accessibility in mind, but proper implementation is essential:

### Forms
```html
<!-- ✅ Proper labeling -->
<label class="form-control">
  <div class="label">
    <span class="label-text">Email</span>
  </div>
  <input type="email" id="email" class="input input-bordered" required />
</label>

<!-- ❌ Missing label -->
<input type="email" class="input input-bordered" />
```

### Buttons
```html
<!-- ✅ Descriptive button text -->
<button class="btn btn-primary">Submit Form</button>

<!-- ❌ Vague button text -->
<button class="btn btn-primary">Click</button>
```

### ARIA Attributes
```html
<!-- Add aria-label for icon-only buttons -->
<button class="btn btn-circle" aria-label="Close">
  <svg>...</svg>
</button>

<!-- Add aria-required for required fields -->
<input type="text" class="input input-bordered" aria-required="true" />

<!-- Add aria-invalid for validation errors -->
<input type="text" class="input input-bordered input-error" aria-invalid="true" aria-describedby="error-message" />
<span id="error-message" class="text-error">This field is required</span>
```

### Keyboard Navigation
- Ensure all interactive elements are keyboard accessible
- Add `tabindex` to custom interactive elements
- Support Enter and Space for buttons and toggles

## Responsive Design

daisyUI components work seamlessly with Tailwind's responsive modifiers:

```html
<!-- Responsive navbar -->
<div class="navbar bg-base-100">
  <div class="navbar-start">
    <!-- Mobile menu -->
    <div class="dropdown lg:hidden">
      <button class="btn btn-ghost">
        <svg>...</svg>
      </button>
      <ul class="menu dropdown-content">
        <li><a>Home</a></li>
      </ul>
    </div>
    <!-- Desktop menu -->
    <a class="btn btn-ghost hidden lg:inline-block">Logo</a>
  </div>
</div>

<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
</div>

<!-- Responsive text -->
<h1 class="text-2xl md:text-4xl lg:text-6xl">Responsive Heading</h1>
```

## Customization

### Override Component Styles
```html
<!-- Combine daisyUI classes with Tailwind utilities -->
<button class="btn btn-primary rounded-full shadow-lg hover:shadow-xl">
  Custom Button
</button>

<!-- Modify card styling -->
<div class="card bg-gradient-to-r from-blue-500 to-purple-500 text-white">
  <div class="card-body">
    <h2 class="card-title text-2xl">Custom Card</h2>
  </div>
</div>
```

### Custom Themes
```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('daisyui'),
  ],
  themes: [
    {
      mytheme: {
        "primary": "#ff6b6b",
        "secondary": "#4ecdc4",
        "accent": "#ffe66d",
        "neutral": "#2d3436",
        "base-100": "#ffffff",
        "info": "#3b82f6",
        "success": "#22c55e",
        "warning": "#f59e0b",
        "error": "#ef4444",
      },
    },
  ],
}
```

### Create Component Variants
```html
<!-- Create a custom button variant -->
<button class="btn bg-gradient-to-r from-pink-500 to-yellow-500 border-0 text-white hover:scale-105 transition-transform">
  Gradient Button
</button>

<!-- Custom card style -->
<div class="card bg-base-100 shadow-2xl border-2 border-primary hover:border-secondary transition-colors">
  <div class="card-body">
    <h2 class="card-title">Custom Border Card</h2>
  </div>
</div>
```

## Common Use Cases

### 1. Authentication Page
```html
<div class="hero min-h-screen bg-base-200">
  <div class="hero-content flex-col lg:flex-row-reverse">
    <div class="text-center lg:text-left">
      <h1 class="text-5xl font-bold">Login now!</h1>
      <p class="py-6">Access your account to continue.</p>
    </div>
    <div class="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
      <form class="card-body">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Email</span>
          </label>
          <input type="email" class="input input-bordered" required />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Password</span>
          </label>
          <input type="password" class="input input-bordered" required />
          <label class="label">
            <a href="#" class="label-text-alt link link-hover">Forgot password?</a>
          </label>
        </div>
        <div class="form-control mt-6">
          <button class="btn btn-primary">Login</button>
        </div>
      </form>
    </div>
  </div>
</div>
```

### 2. Dashboard Layout
```html
<div class="drawer lg:drawer-open">
  <input id="my-drawer" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content flex flex-col">
    <div class="navbar bg-base-300">
      <div class="flex-none lg:hidden">
        <label for="my-drawer" class="btn btn-square btn-ghost">
          <svg>...</svg>
        </label>
      </div>
      <div class="flex-1 px-2">Dashboard</div>
    </div>
    <div class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="stat">
          <div class="stat-title">Total Users</div>
          <div class="stat-value">12.5K</div>
          <div class="stat-desc">↗︎ 14% more than last month</div>
        </div>
        <div class="stat">
          <div class="stat-title">Revenue</div>
          <div class="stat-value">$45.2K</div>
          <div class="stat-desc">↘︎ 4% less than last month</div>
        </div>
        <div class="stat">
          <div class="stat-title">New Orders</div>
          <div class="stat-value">89</div>
          <div class="stat-desc">↗︎ 8% more than last month</div>
        </div>
      </div>
    </div>
  </div>
  <div class="drawer-side">
    <ul class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
      <li><a>Dashboard</a></li>
      <li><a>Users</a></li>
      <li><a>Orders</a></li>
      <li><a>Settings</a></li>
    </ul>
  </div>
</div>
```

### 3. Product Card
```html
<div class="card bg-base-100 shadow-xl w-96">
  <figure>
    <img src="product-image.jpg" alt="Product" class="w-full h-64 object-cover" />
  </figure>
  <div class="card-body">
    <h2 class="card-title">
      Product Name
      <div class="badge badge-secondary">NEW</div>
    </h2>
    <p>Product description goes here. Highlight key features.</p>
    <div class="flex items-center gap-2">
      <div class="rating rating-sm">
        <input type="radio" name="rating" class="mask mask-star bg-orange-400" checked />
        <input type="radio" name="rating" class="mask mask-star bg-orange-400" />
        <input type="radio" name="rating" class="mask mask-star bg-orange-400" />
        <input type="radio" name="rating" class="mask mask-star bg-orange-400" />
        <input type="radio" name="rating" class="mask mask-star bg-orange-400" />
      </div>
      <span class="text-sm text-gray-500">(128 reviews)</span>
    </div>
    <div class="card-actions justify-between items-center mt-4">
      <span class="text-2xl font-bold text-primary">$49.99</span>
      <div class="join">
        <button class="btn btn-outline">-</button>
        <input type="text" class="input input-bordered w-12 text-center" value="1" />
        <button class="btn btn-outline">+</button>
        <button class="btn btn-primary">Add to Cart</button>
      </div>
    </div>
  </div>
</div>
```

### 4. Data Table with Actions
```html
<div class="overflow-x-auto">
  <table class="table table-zebra">
    <thead>
      <tr>
        <th>
          <label>
            <input type="checkbox" class="checkbox" />
          </label>
        </th>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>
          <label>
            <input type="checkbox" class="checkbox" />
          </label>
        </th>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td>Admin</td>
        <td><div class="badge badge-success">Active</div></td>
        <td>
          <button class="btn btn-ghost btn-xs">Edit</button>
          <button class="btn btn-ghost btn-xs text-error">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

## Integration with Other Skills

### With ui-engineer Skill
```javascript
// Use daisyUI with Gray Design System principles
// daisyUI provides components, Gray Design System provides tokens
context = skill("ui-engineer")

// Generate daisyUI component
component = tool("daisyui", {
  "action": "generate-component",
  "component": "button",
  "variant": "primary",
  "custom": true
})

// Apply Gray Design System spacing and typography
customizedComponent = applyGrayTokens(component)
```

### With openmemory Skills
```javascript
// Store component patterns
skill("openmemory-store", {
  "content": "Common daisyUI button pattern: btn btn-primary for primary actions",
  "sector": "semantic"
})

// Query for similar components
patterns = skill("openmemory-query", {
  "query": "daisyUI form patterns",
  "sectors": ["procedural"]
})
```

### With PRD Skills
```javascript
// Use daisyUI in PRD execution
context = skill("openmemory-context", {
  "query": "user authentication UI",
  "contextType": "prd-execute"
})

// Generate login form
form = tool("daisyui", {
  "action": "generate-component",
  "component": "input",
  "variant": "withLabel"
})
```

## Best Practices

### DO ✅
- Use semantic component names (`btn`, `card`, `modal`)
- Combine daisyUI with Tailwind utilities for customization
- Use theme classes for consistent styling
- Ensure proper labeling and accessibility attributes
- Test components in different themes
- Use responsive modifiers for mobile-first design
- Leverage semantic colors (`primary`, `success`, `error`)
- Use component size modifiers (`btn-lg`, `input-sm`)
- Validate forms with proper error states
- Use `join` for connected elements

### DON'T ❌
- Don't write hundreds of utility classes when daisyUI components exist
- Don't skip proper labeling for form elements
- Don't forget to test in dark mode
- Don't override all component styles unnecessarily
- Don't use `!important` - use Tailwind utilities instead
- Don't forget accessibility attributes
- Don't mix theme classes on the same element
- Don't skip keyboard navigation testing

## Troubleshooting

### Components Not Appearing
1. Verify daisyUI is installed: `npm list daisyui`
2. Check Tailwind config includes daisyUI plugin
3. Ensure content paths are correct in Tailwind config
4. Clear cache: `npm run clean` or delete `.next` / `dist`

### Theme Not Applying
1. Check `data-theme` attribute on HTML element
2. Verify theme name in Tailwind config
3. Ensure CSS is built after config changes
4. Check for theme name typos

### Component Styling Issues
1. Verify no conflicting CSS
2. Check Tailwind version compatibility
3. Ensure no CSS reset overriding daisyUI
4. Test in isolation

### Performance Issues
1. Purge unused classes in production
2. Use tree-shaking for themes
3. Minimize custom CSS overrides
4. Optimize images in components

## Quick Prompt Templates

### Generate Component
```markdown
Generate a [component] component using daisyUI:
- Component: [name]
- Variant: [variant]
- Custom utilities: [yes/no]
- Theme: [theme-name]
```

### Create Form
```markdown
Create a form using daisyUI components:
- Fields: [list fields]
- Validation: [requirements]
- Theme: [theme-name]
- Layout: [stacked/horizontal]
```

### Build Page Layout
```markdown
Build a [page-type] layout using daisyUI:
- Navbar: [style]
- Hero section: [content]
- Content area: [components]
- Footer: [style]
- Theme: [theme-name]
```

### Theme Application
```markdown
Apply daisyUI theme to [project]:
- Theme name: [name]
- Components to style: [list]
- Custom color overrides: [colors]
- Dark mode: [yes/no]
```

## Examples

### Example 1: Complete Landing Page
```javascript
// Get components
navbar = tool("daisyui", { "action": "generate-component", "component": "navbar" })
hero = tool("daisyui", { "action": "generate-component", "component": "hero" })
features = tool("daisyui", { "action": "generate-component", "component": "card", "variant": "horizontal" })

// Assemble page
page = `
<!DOCTYPE html>
<html data-theme="cupcake">
<head>
  <title>My Landing Page</title>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  ${navbar}
  ${hero}
  <div class="container mx-auto py-12">
    ${features}
  </div>
</body>
</html>
`
```

### Example 2: Dashboard with Multiple Components
```javascript
// Get dashboard components
drawer = tool("daisyui", { "action": "generate-component", "component": "drawer" })
stat = tool("daisyui", { "action": "generate-component", "component": "stat" })
table = tool("daisyui", { "action": "generate-component", "component": "table" })

// Create stats array
stats = Array(3).fill(stat).map((s, i) => 
  s.replace('Total Page Views', `Metric ${i + 1}`)
    .replace('89.4K', ['12.5K', '$45.2K', '89'][i])
    .replace('21%', ['14%', '4%', '8%'][i])
).join('\n')

// Assemble dashboard
dashboard = `
<html data-theme="light">
<head>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  ${drawer}
  <div class="drawer-content">
    <div class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${stats}
      </div>
      <div class="mt-8">
        ${table}
      </div>
    </div>
  </div>
</body>
</html>
`
```

### Example 3: Form with Validation
```javascript
// Get form components
input = tool("daisyui", { "action": "generate-component", "component": "input", "variant": "withLabel" })
button = tool("daisyui", { "action": "generate-component", "component": "button", "variant": "primary" })
alert = tool("daisyui", { "action": "generate-component", "component": "alert", "variant": "error" })

// Create form fields
emailField = input.replace('What is your name?', 'Email Address')
  .replace('Type here', 'you@example.com')
  .replace('type="text"', 'type="email" required')

passwordField = input.replace('What is your name?', 'Password')
  .replace('Type here', '••••••••')
  .replace('type="text"', 'type="password" required')

// Create error alert
errorAlert = alert.replace('Warning: Invalid email address!', 'Please fill in all required fields')

// Assemble form
form = `
<div class="hero min-h-screen bg-base-200">
  <div class="hero-content">
    <div class="card shrink-0 w-full max-w-md shadow-2xl bg-base-100">
      <form class="card-body" onsubmit="event.preventDefault();">
        <h2 class="text-3xl font-bold text-center">Login</h2>
        ${emailField}
        ${passwordField}
        <div class="form-control mt-6">
          ${button.replace('Button', 'Login')}
        </div>
        ${errorAlert}
      </form>
    </div>
  </div>
</div>
`
```

## Validation Checklist

- [ ] daisyUI is installed in package.json
- [ ] Tailwind config includes daisyUI plugin
- [ ] Theme is applied via `data-theme` attribute
- [ ] Components use correct daisyUI class names
- [ ] Form fields have proper labels
- [ ] Buttons have descriptive text
- [ ] Accessibility attributes are present
- [ ] Components work in different themes
- [ ] Responsive design is implemented
- [ ] No conflicting custom CSS
- [ ] Keyboard navigation works
- [ ] Dark mode is tested

## Getting Started

### Step 1: Install and Configure
```bash
npm install -D daisyui tailwindcss
```

### Step 2: Set Up Tailwind
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{html,js}"],
  plugins: [require("daisyui")],
}
```

### Step 3: Choose a Theme
```html
<html data-theme="cupcake">
```

### Step 4: Start Building
```javascript
// Use the daisyUI tool
component = tool("daisyui", {
  "action": "generate-component",
  "component": "button",
  "variant": "primary"
})
```

## Resources

- **Official Website**: https://daisyui.com
- **Documentation**: https://daisyui.com/docs/components/
- **NPM Package**: https://www.npmjs.com/package/daisyui
- **GitHub**: https://github.com/saadeghi/daisyui
- **Theme Generator**: https://daisyui.com/docs/themes/
- **Examples**: https://daisyui.com/docs/examples/

## Related Skills

- **ui-engineer**: Use with Gray Design System for consistent design tokens
- **openmemory**: Store and retrieve component patterns
- **prd-create**: Create PRDs for UI development using daisyUI

## Version Notes

- **Version 1.0.0**: Initial release with 65+ components and 30+ themes
- Built for daisyUI 5.5.14
- Compatible with Tailwind CSS 4.x
- Supports all major JavaScript frameworks

---

## Summary

The daisyUI skill provides comprehensive access to the most popular component library for Tailwind CSS. With 65+ components, 30+ themes, and semantic color utilities, you can build beautiful, accessible, and production-ready UIs in minutes.

**Key Benefits:**
- 88% fewer class names
- 79% smaller HTML size
- Pure CSS, no JavaScript dependencies
- Framework agnostic
- Fully customizable with Tailwind utilities
- Built-in accessibility support
- Dark mode ready

**Get Started:**
```javascript
tool("daisyui", {
  "action": "list-components"
})
```

Happy building with daisyUI! 🌼