# Card Components

Cards are container components that group related content with consistent styling, providing visual hierarchy and structure to the interface.

## Overview

The card system includes various card types for different use cases, from simple content containers to interactive feature cards. All cards follow unified styling with zinc-based colors, consistent border radius, shadows, and padding.

## Base Card Styles

### Standard Card

Basic card container with consistent styling.

```html
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
  <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Card Title</h3>
  <p class="text-sm text-zinc-500">Card description text goes here.</p>
</div>
```

**Classes:**
- Background: `bg-zinc-100`
- Border: `border border-zinc-200`
- Radius: `rounded-lg` (0.5rem)
- Shadow: `shadow-sm`
- Padding: `p-6` (1.5rem)

### Elevated Card

Card with stronger shadow for emphasis.

```html
<div class="bg-white border border-zinc-200 rounded-lg shadow-2xl p-6">
  <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Elevated Card</h3>
  <p class="text-sm text-zinc-500">This card stands out with a stronger shadow.</p>
</div>
```

**Classes:**
- Background: `bg-white`
- Border: `border border-zinc-200`
- Radius: `rounded-lg`
- Shadow: `shadow-2xl`
- Padding: `p-6`

### Interactive Card

Card with hover effects for interactive content.

```html
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6 hover:border-zinc-400 hover:shadow-md transition cursor-pointer">
  <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Interactive Card</h3>
  <p class="text-sm text-zinc-500">Hover over this card to see the effect.</p>
</div>
```

**Classes:**
- Base: `bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6`
- Hover: `hover:border-zinc-400 hover:shadow-md`
- Transition: `transition`
- Cursor: `cursor-pointer`

## Card Variants

### Feature Card

Card with icon, title, and description for features.

```html
<div class="flex items-start gap-4">
  <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  </div>
  <div>
    <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Feature Title</h3>
    <p class="text-sm text-zinc-500">Detailed description of the feature and its benefits.</p>
  </div>
</div>
```

**Icon Container Classes:**
- Background: `bg-zinc-900`
- Text: `text-zinc-100`
- Size: `w-12 h-12` (3rem × 3rem)
- Radius: `rounded-sm`
- Flex: `flex items-center justify-center`
- Shrink: `shrink-0`

### Content Card

Card with rich content including heading, paragraph, and action.

```html
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
  <h3 class="font-inter-tight text-xl font-semibold text-zinc-900 mb-3">
    Card Heading
  </h3>
  <p class="text-base text-zinc-600 mb-4">
    This is the card content paragraph. It provides detailed information about the topic.
  </p>
  <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
    Learn More
  </button>
</div>
```

### Image Card

Card with featured image and content overlay.

```html
<div class="rounded-lg shadow-2xl overflow-hidden">
  <div class="relative">
    <img 
      class="w-full h-48 object-cover" 
      src="image.jpg" 
      alt="Card image" 
    />
    <div class="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
    <div class="absolute bottom-0 left-0 right-0 p-6">
      <h3 class="font-inter-tight text-lg font-semibold text-zinc-100 mb-2">
        Image Card Title
      </h3>
      <p class="text-sm text-zinc-200">
        Description text with gradient background overlay.
      </p>
    </div>
  </div>
</div>
```

**Classes:**
- Container: `rounded-lg shadow-2xl overflow-hidden`
- Image: `w-full h-48 object-cover`
- Overlay: `absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent`
- Content: `absolute bottom-0 left-0 right-0 p-6`

## Card Patterns

### Horizontal Card

Card with horizontal layout.

```html
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6 flex gap-4">
  <img 
    class="w-24 h-24 object-cover rounded-sm shrink-0" 
    src="thumbnail.jpg" 
    alt="Thumbnail" 
  />
  <div class="flex flex-col justify-center">
    <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">
      Horizontal Card
    </h3>
    <p class="text-sm text-zinc-500">
      Card content with thumbnail image on the left.
    </p>
  </div>
</div>
```

### Stats Card

Card displaying statistics or metrics.

```html
<div class="text-center md:px-5">
  <h4 class="font-inter-tight text-2xl md:text-3xl font-bold tabular-nums mb-2">
    476K
  </h4>
  <p class="text-sm text-zinc-500">
    Assets packed with power beyond your imagination.
  </p>
</div>
```

**Classes:**
- Container: `text-center md:px-5`
- Number: `font-inter-tight text-2xl md:text-3xl font-bold tabular-nums mb-2`
- Description: `text-sm text-zinc-500`

### Form Card

Card container for forms with special styling.

```html
<div class="max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl bg-linear-to-b from-zinc-100 to-zinc-50/.7 relative before:absolute before:-top-12 before:-left-16 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl before:-z-10">
  <form>
    <!-- Form content -->
  </form>
</div>
```

**Classes:**
- Container: `max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl`
- Background: `bg-linear-to-b from-zinc-100 to-zinc-50/.7`
- Glow effect: `relative before:absolute before:-top-12 before:-left-16 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl before:-z-10`

### Testimonial Card

Card for testimonials and quotes.

```html
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
  <p class="text-base text-zinc-600 mb-4 italic">
    "This is a testimonial quote that showcases the product or service."
  </p>
  <div class="flex items-center gap-3">
    <img 
      class="w-10 h-10 rounded-full" 
      src="avatar.jpg" 
      alt="Avatar" 
    />
    <div>
      <h4 class="font-inter-tight font-semibold text-zinc-900 text-sm">
        John Doe
      </h4>
      <p class="text-xs text-zinc-500">
        CEO, Company
      </p>
    </div>
  </div>
</div>
```

## Card States

### Default State

Standard card appearance.

```html
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
  Default Card
</div>
```

### Hover State

Card appearance on hover.

```html
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6 hover:border-zinc-400 hover:shadow-md transition">
  Hover State
</div>
```

**Hover Classes:** `hover:border-zinc-400 hover:shadow-md`

### Focus State

Card appearance on keyboard focus.

```html
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2" tabindex="0">
  Focus State
</div>
```

**Focus Classes:** `focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2`

### Disabled State

Card appearance when disabled.

```html
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6 opacity-50 pointer-events-none">
  Disabled Card
</div>
```

**Disabled Classes:** `opacity-50 pointer-events-none`

## Card Grid Layouts

### Two-Column Grid

```html
<div class="grid gap-12 sm:grid-cols-2">
  <div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
    Card 1
  </div>
  <div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
    Card 2
  </div>
</div>
```

**Classes:**
- Grid: `grid gap-12 sm:grid-cols-2`
- Gap: 3rem between cards
- Columns: 1 column (mobile) → 2 columns (sm breakpoint)

### Three-Column Grid

```html
<div class="grid gap-12 sm:grid-cols-2 md:grid-cols-3">
  <div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
    Card 1
  </div>
  <div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
    Card 2
  </div>
  <div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
    Card 3
  </div>
</div>
```

**Classes:**
- Grid: `grid gap-12 sm:grid-cols-2 md:grid-cols-3`
- Columns: 1 → 2 → 3 responsive columns

### Four-Column Grid

```html
<div class="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
  <div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
    Card 1
  </div>
  <div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
    Card 2
  </div>
  <div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
    Card 3
  </div>
  <div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
    Card 4
  </div>
</div>
```

**Classes:**
- Grid: `grid gap-12 sm:grid-cols-2 md:grid-cols-4`
- Columns: 1 → 2 → 4 responsive columns

## Card Content Patterns

### Card with Header

```html
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm">
  <div class="p-6 border-b border-zinc-200">
    <h3 class="font-inter-tight font-semibold text-zinc-900">
      Card Header
    </h3>
  </div>
  <div class="p-6">
    <p class="text-sm text-zinc-500">
      Card body content goes here.
    </p>
  </div>
</div>
```

**Classes:**
- Header: `p-6 border-b border-zinc-200`
- Body: `p-6`

### Card with Footer

```html
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm">
  <div class="p-6 border-b border-zinc-200">
    <h3 class="font-inter-tight font-semibold text-zinc-900">
      Card Title
    </h3>
  </div>
  <div class="p-6">
    <p class="text-sm text-zinc-500 mb-4">
      Card body content goes here.
    </p>
  </div>
  <div class="p-6 bg-zinc-50 border-t border-zinc-200">
    <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm w-full">
      Action Button
    </button>
  </div>
</div>
```

**Classes:**
- Body: `p-6 border-b border-zinc-200`
- Content: `p-6`
- Footer: `p-6 bg-zinc-50 border-t border-zinc-200`

## Card Props Table

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'standard' \| 'elevated' \| 'interactive'` | `'standard'` | Card visual style |
| padding | `'none' \| 'sm' \| 'md' \| 'lg'` | `'lg'` | Card padding amount |
| border | `boolean` | `true` | Show card border |
| shadow | `'none' \| 'sm' \| 'md' \| 'lg' \| '2xl'` | `'sm'` | Card shadow strength |
| rounded | `'none' \| 'sm' \| 'md' \| 'lg'` | `'lg'` | Card border radius |
| hoverable | `boolean` | `false` | Enable hover effects |
| clickable | `boolean` | `false` | Make card clickable |

## Usage Guidelines

### DO ✅

- Use cards to group related content together
- Maintain consistent card sizes within a grid
- Use appropriate shadows based on visual hierarchy
- Include meaningful titles and descriptions
- Use card grids for responsive layouts
- Keep card content concise and focused
- Use icons to reinforce card meaning
- Ensure adequate spacing between cards
- Use consistent padding and margins
- Test cards on mobile devices

### DON'T ❌

- Don't create custom card styles outside the system
- Don't mix different card variants in same context
- Don't overuse shadows or borders
- Don't make cards too large or overwhelming
- Don't create cards without clear purpose
- Don't use inconsistent spacing within cards
- Don't nest cards inside other cards
- Don't use cards for simple text content
- Don't create custom border radius values
- Don't ignore responsive design needs

## Examples

### Feature Section with Cards

```html
<section class="py-12 md:py-20 bg-zinc-50">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <!-- Section header -->
    <div class="max-w-3xl mx-auto text-center pb-12">
      <h2 class="font-inter-tight text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
        Why Choose Our Platform
      </h2>
      <p class="text-lg text-zinc-500">
        Our platform provides everything you need to succeed.
      </p>
    </div>

    <!-- Feature cards grid -->
    <div class="grid gap-12 sm:grid-cols-2 md:grid-cols-3">
      <!-- Card 1 -->
      <div class="flex items-start gap-4">
        <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div>
          <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">
            Lightning Fast
          </h3>
          <p class="text-sm text-zinc-500">
            Optimized for speed and performance.
          </p>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="flex items-start gap-4">
        <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">
            Secure & Reliable
          </h3>
          <p class="text-sm text-zinc-500">
            Enterprise-grade security and reliability.
          </p>
        </div>
      </div>

      <!-- Card 3 -->
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
          <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">
            Team Collaboration
          </h3>
          <p class="text-sm text-zinc-500">
            Work together seamlessly with your team.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
```

### Pricing Cards

```html
<section class="py-12 md:py-20">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="grid gap-8 sm:grid-cols-3">
      <!-- Basic Plan -->
      <div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
        <h3 class="font-inter-tight text-xl font-semibold text-zinc-900 mb-2">
          Basic
        </h3>
        <p class="text-sm text-zinc-500 mb-4">
          For individuals
        </p>
        <div class="text-3xl font-bold text-zinc-900 mb-6">
          $19<span class="text-base font-normal text-zinc-500">/mo</span>
        </div>
        <ul class="space-y-3 mb-6">
          <li class="text-sm text-zinc-600">✓ 5 projects</li>
          <li class="text-sm text-zinc-600">✓ Basic analytics</li>
          <li class="text-sm text-zinc-600">✓ Email support</li>
        </ul>
        <button class="btn text-zinc-600 bg-white hover:text-zinc-900 w-full shadow-sm">
          Get Started
        </button>
      </div>

      <!-- Pro Plan -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-6 relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-900 text-zinc-100 px-3 py-1 rounded-full text-xs font-medium">
          Popular
        </div>
        <h3 class="font-inter-tight text-xl font-semibold text-zinc-100 mb-2">
          Pro
        </h3>
        <p class="text-sm text-zinc-400 mb-4">
          For growing teams
        </p>
        <div class="text-3xl font-bold text-zinc-100 mb-6">
          $49<span class="text-base font-normal text-zinc-400">/mo</span>
        </div>
        <ul class="space-y-3 mb-6">
          <li class="text-sm text-zinc-200">✓ 25 projects</li>
          <li class="text-sm text-zinc-200">✓ Advanced analytics</li>
          <li class="text-sm text-zinc-200">✓ Priority support</li>
          <li class="text-sm text-zinc-200">✓ Custom integrations</li>
        </ul>
        <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm border border-zinc-700">
          Get Started
        </button>
      </div>

      <!-- Enterprise Plan -->
      <div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
        <h3 class="font-inter-tight text-xl font-semibold text-zinc-900 mb-2">
          Enterprise
        </h3>
        <p class="text-sm text-zinc-500 mb-4">
          For large organizations
        </p>
        <div class="text-3xl font-bold text-zinc-900 mb-6">
          $99<span class="text-base font-normal text-zinc-500">/mo</span>
        </div>
        <ul class="space-y-3 mb-6">
          <li class="text-sm text-zinc-600">✓ Unlimited projects</li>
          <li class="text-sm text-zinc-600">✓ Custom analytics</li>
          <li class="text-sm text-zinc-600">✓ 24/7 support</li>
          <li class="text-sm text-zinc-600">✓ Dedicated account manager</li>
        </ul>
        <button class="btn text-zinc-600 bg-white hover:text-zinc-900 w-full shadow-sm">
          Contact Sales
        </button>
      </div>
    </div>
  </div>
</section>
```

## Accessibility

### Keyboard Navigation

Cards should be keyboard accessible when interactive:

```html
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6 hover:border-zinc-400 hover:shadow-md transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2" tabindex="0" role="button" aria-label="View card details">
  <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Card Title</h3>
  <p class="text-sm text-zinc-500">Card content</p>
</div>
```

### ARIA Attributes

Use appropriate ARIA attributes:

```html
<!-- Card with heading landmark -->
<article class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6" aria-labelledby="card-title">
  <h3 id="card-title" class="font-inter-tight font-semibold text-zinc-900 mb-2">
    Card Title
  </h3>
  <p class="text-sm text-zinc-500">Card content</p>
</article>

<!-- Interactive card -->
<div 
  class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6 hover:border-zinc-400 hover:shadow-md transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
  role="button"
  tabindex="0"
  aria-label="View card details"
  aria-pressed="false"
>
  <!-- Card content -->
</div>
```

## Implementation Notes

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(9 9 11 / 0.05)',
        '2xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        'lg': '0.5rem',
        'sm': '0.125rem',
      },
    },
  },
};
```

### CSS Variables

```css
:root {
  --card-padding-sm: 0.75rem;  /* p-3 */
  --card-padding-md: 1rem;     /* p-4 */
  --card-padding-lg: 1.5rem;   /* p-6 */
  
  --card-border-radius-lg: 0.5rem;     /* rounded-lg */
  --card-border-radius-md: 0.375rem;   /* rounded-md */
  --card-border-radius-sm: 0.125rem;   /* rounded-sm */
}
```

## Component Reference

| Variant | Classes | Use Case |
|---------|---------|----------|
| Standard | `bg-zinc-100 border-zinc-200 rounded-lg shadow-sm p-6` | General content grouping |
| Elevated | `bg-white border-zinc-200 rounded-lg shadow-2xl p-6` | Emphasized content |
| Interactive | `bg-zinc-100 border-zinc-200 rounded-lg shadow-sm p-6 hover:border-zinc-400 hover:shadow-md transition` | Clickable cards |

| Content Pattern | Classes | Purpose |
|----------------|----------|---------|
| Feature | `flex items-start gap-4` | Icon + text layout |
| Stats | `text-center md:px-5` | Metrics display |
| Form | `max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl bg-linear-to-b from-zinc-100 to-zinc-50/.7` | Form container |
| Testimonial | `bg-zinc-100 border-zinc-200 rounded-lg shadow-sm p-6` | Quotes and reviews |

---

**Note**: Always use exact card classes specified in this documentation. Never create custom card styles or deviate from defined variants and patterns. Ensure all cards follow consistent spacing, borders, shadows, and content structure.