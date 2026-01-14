# Spacing Tokens

The spacing system is built on a consistent 4px base unit using an exponential scale. This ensures rhythm and harmony across all components while maintaining flexibility for various layout needs.

## Spacing Scale

The spacing scale uses Tailwind CSS's default system, based on a 4px base unit:

| Token | Value | Pixels | CSS/Tailwind | Usage |
|-------|-------|--------|--------------|-------|
| 0 | 0rem | 0px | p-0, m-0, gap-0 | Remove spacing |
| px | 1px | 1px | px-1, my-px | Hairline spacing |
| 0.5 | 0.125rem | 2px | p-0.5, m-0.5, gap-0.5 | Tight spacing |
| 1 | 0.25rem | 4px | p-1, m-1, gap-1 | Micro spacing |
| 1.5 | 0.375rem | 6px | p-1.5, m-1.5, gap-1.5 | Small spacing |
| 2 | 0.5rem | 8px | p-2, m-2, gap-2 | Base spacing unit |
| 2.5 | 0.625rem | 10px | p-2.5, m-2.5 | Moderate spacing |
| 3 | 0.75rem | 12px | p-3, m-3, gap-3 | Comfortable spacing |
| 3.5 | 0.875rem | 14px | p-3.5, m-3.5 | Small component spacing |
| 4 | 1rem | 16px | p-4, m-4, gap-4 | Standard component spacing |
| 5 | 1.25rem | 20px | p-5, m-5, gap-5 | Comfortable component spacing |
| 6 | 1.5rem | 24px | p-6, m-6, gap-6 | Section spacing |
| 7 | 1.75rem | 28px | p-7, m-7 | Large component spacing |
| 8 | 2rem | 32px | p-8, m-8, gap-8 | Large section spacing |
| 9 | 2.25rem | 36px | p-9, m-9 | Extra large spacing |
| 10 | 2.5rem | 40px | p-10, m-10, gap-10 | Hero section spacing |
| 11 | 2.75rem | 44px | p-11, m-11 | Maximum spacing |
| 12 | 3rem | 48px | p-12, m-12, gap-12 | Major section spacing |
| 14 | 3.5rem | 56px | p-14, m-14 | Extra major spacing |
| 16 | 4rem | 64px | p-16, m-16 | Full section spacing |
| 20 | 5rem | 80px | p-20, m-20 | Maximum section spacing |
| 24 | 6rem | 96px | p-24, m-24 | Hero spacing |
| 28 | 7rem | 112px | p-28, m-28 | Extreme spacing |
| 32 | 8rem | 128px | p-32, m-32 | Maximum hero spacing |

## Padding Tokens

### Component Padding

| Element | Padding | CSS/Tailwind | Usage |
|---------|---------|--------------|-------|
| Input fields | 0.5rem 1rem | px-4 py-2 | Form inputs, selects, textareas |
| Buttons (normal) | 0.5rem 1rem | px-4 py-2 | Standard buttons |
| Buttons (small) | 0.25rem 0.5rem | px-2 py-1 | Small buttons |
| Cards | 1.5rem | p-6 | Card containers |
| Form sections | 1.5rem | p-6 | Form containers |
| Modal content | 1.5rem | p-6 | Modal dialogs |

### Section Padding

| Element | Padding | CSS/Tailwind | Usage |
|---------|---------|--------------|-------|
| Hero sections | 3rem 0 → 5rem 0 | py-12 md:py-20 | Top/bottom hero sections |
| Standard sections | 3rem 0 → 5rem 0 | py-12 md:py-20 | Content sections |
| Page content | 3rem 0 → 5rem 0 | py-12 md:py-20 | Main content areas |

### Horizontal Padding

| Element | Padding | CSS/Tailwind | Usage |
|---------|---------|--------------|-------|
| Page containers | 1rem → 1.5rem | px-4 sm:px-6 | Mobile → desktop page margins |
| Card padding | 1rem | px-4 | Card horizontal padding |

## Margin Tokens

### Vertical Margins

| Element | Margin | CSS/Tailwind | Usage |
|---------|--------|--------------|-------|
| Heading bottom | 1rem | mb-4 | Small headings |
| Heading bottom (large) | 2rem | mb-8 | Hero and section headings |
| Element spacing | 0.5rem | mb-2 | Tight spacing between elements |
| Paragraph spacing | 1rem | mb-4 | Between paragraphs |
| Section spacing | 1.5rem | mb-6 | Between major sections |
| Form fields | 1rem | space-y-4 | Between form elements |
| Form submit button | 1.25rem | mt-5 | Above submit button |

### Horizontal Margins

| Element | Margin | CSS/Tailwind | Usage |
|---------|--------|--------------|-------|
| Centered containers | Auto left/right | mx-auto | Centering content |
| Logo margin | 1rem | mr-4 | Space after logo |
| Button group | 0.25rem | ml-1 | Between buttons |
| Link padding | 0.75rem → 1.25rem | px-3 lg:px-5 | Navigation links |

## Gap Tokens

### Flex and Grid Gaps

| Element | Gap | CSS/Tailwind | Usage |
|---------|-----|--------------|-------|
| Button groups | 1rem | space-x-4 | Horizontal button groups |
| Form fields | 1rem | space-y-4 | Vertical form spacing |
| Grid items | 1.25rem | gap-5 | Grid item spacing |
| Card grids | 0 → negative margins | md:-mx-5 | Grid edge handling |

## Section Spacing Patterns

### Hero Section

```html
<section class="relative before:absolute before:inset-0 before:h-80 
                 before:pointer-events-none before:bg-linear-to-b 
                 before:from-zinc-100 before:-z-10">
  <div class="pt-32 pb-12 md:pt-40 md:pb-20">
    <!-- Hero content -->
  </div>
</section>
```

**Spacing:**
- Top padding: 8rem (mobile) → 10rem (desktop)
- Bottom padding: 3rem (mobile) → 5rem (desktop)

### Standard Section

```html
<section class="py-12 md:py-20">
  <div class="px-4 sm:px-6">
    <!-- Section content -->
  </div>
</section>
```

**Spacing:**
- Top/bottom padding: 3rem (mobile) → 5rem (desktop)
- Horizontal padding: 1rem (mobile) → 1.5rem (desktop)

### Card Section

```html
<div class="max-w-6xl mx-auto px-4 sm:px-6">
  <div class="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
    <!-- Card items -->
  </div>
</div>
```

**Spacing:**
- Grid gap: 3rem
- Container padding: 1rem (mobile) → 1.5rem (desktop)

## Component Spacing

### Button Spacing

```html
<!-- Standard Button -->
<button class="btn px-4 py-2">
  <!-- Padding: horizontal 1rem, vertical 0.5rem -->
</button>

<!-- Small Button -->
<button class="btn-sm px-2 py-1">
  <!-- Padding: horizontal 0.5rem, vertical 0.25rem -->
</button>
```

### Form Spacing

```html
<form>
  <div class="space-y-4">
    <!-- Form fields with 1rem vertical gap -->
  </div>
  <div class="mt-5">
    <!-- Submit button with 1.25rem top margin -->
    <button>Submit</button>
  </div>
</form>
```

### Card Spacing

```html
<div class="p-6 rounded-lg shadow-2xl bg-zinc-100">
  <h3 class="mb-2">Title</h3>
  <p class="mb-4">Description</p>
  <button>Action</button>
</div>
```

**Spacing:**
- Card padding: 1.5rem (all sides)
- Title bottom margin: 0.5rem
- Description bottom margin: 1rem

### Navigation Spacing

```html
<header class="px-4 sm:px-6">
  <nav>
    <ul class="flex justify-end items-center">
      <li class="px-3 lg:px-5 py-2">
        <a>Link</a>
      </li>
    </ul>
  </nav>
</header>
```

**Spacing:**
- Container padding: 1rem (mobile) → 1.5rem (desktop)
- Link horizontal padding: 0.75rem (mobile) → 1.25rem (desktop)
- Link vertical padding: 0.5rem

## Responsive Spacing

### Mobile-First Approach

Spacing scales up on larger screens:

| Element | Mobile | Desktop (md:) | CSS/Tailwind |
|---------|--------|---------------|--------------|
| Section padding | py-12 | py-20 | py-12 md:py-20 |
| Hero padding | pt-32 pb-12 | pt-40 pb-20 | pt-32 pb-12 md:pt-40 md:pb-20 |
| Container padding | px-4 | sm:px-6 | px-4 sm:px-6 |
| Grid gap | gap-12 | gap-0 with negative margins | md:gap-0 md:-mx-5 |

### Breakpoint Spacing

| Breakpoint | Width | Typical Spacing Adjustments |
|------------|-------|----------------------------|
| sm | 640px | Increased container padding (px-6) |
| md | 768px | Increased section padding (py-20) |
| lg | 1024px | Larger gaps, more breathing room |
| xl | 1280px | Maximum spacing for large screens |

## Spacing Patterns

### Form Layout

```html
<form>
  <div class="space-y-4">
    <!-- Each form field -->
    <div>
      <label class="mb-2 block">Label</label>
      <input class="w-full" />
    </div>
  </div>
  <div class="mt-5">
    <button>Submit</button>
  </div>
</form>
```

**Pattern:**
- Form fields: 1rem vertical gap (space-y-4)
- Label bottom margin: 0.5rem (mb-2)
- Submit button top margin: 1.25rem (mt-5)

### Button Group

```html
<div class="space-y-4 sm:space-y-0 sm:space-x-4">
  <button>Primary</button>
  <button>Secondary</button>
</div>
```

**Pattern:**
- Mobile: 1rem vertical gap
- Desktop: 1rem horizontal gap

### Card Grid

```html
<div class="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
  <!-- Cards with 3rem gap -->
</div>
```

**Pattern:**
- Grid gap: 3rem (consistent across breakpoints)
- Responsive columns: 1 → 2 → 4

### Section with Image

```html
<section class="py-12 md:py-20">
  <div class="pb-12 md:pb-20">
    <!-- Text content -->
  </div>
  <div class="flex justify-center pb-12 md:pb-20">
    <!-- Image -->
  </div>
</section>
```

**Pattern:**
- Section padding: 3rem (mobile) → 5rem (desktop)
- Content bottom padding: 3rem (mobile) → 5rem (desktop)

## Spacing Utilities

### Padding Utilities

| Utility | Direction | Value | Usage |
|---------|-----------|-------|-------|
| p-* | All sides | Scale value | Uniform padding |
| px-* | Horizontal | Scale value | Left/right padding |
| py-* | Vertical | Scale value | Top/bottom padding |
| pt-* | Top | Scale value | Top padding only |
| pr-* | Right | Scale value | Right padding only |
| pb-* | Bottom | Scale value | Bottom padding only |
| pl-* | Left | Scale value | Left padding only |

### Margin Utilities

| Utility | Direction | Value | Usage |
|---------|-----------|-------|-------|
| m-* | All sides | Scale value | Uniform margin |
| mx-* | Horizontal | Scale value | Left/right margin |
| my-* | Vertical | Scale value | Top/bottom margin |
| mt-* | Top | Scale value | Top margin only |
| mr-* | Right | Scale value | Right margin only |
| mb-* | Bottom | Scale value | Bottom margin only |
| ml-* | Left | Scale value | Left margin only |
| mx-auto | Horizontal | Auto | Center horizontally |

### Gap Utilities

| Utility | Context | Value | Usage |
|---------|---------|-------|-------|
| gap-* | Grid/Flex | Scale value | All directions gap |
| gap-x-* | Grid/Flex | Scale value | Horizontal gap |
| gap-y-* | Grid/Flex | Scale value | Vertical gap |
| space-x-* | Flex | Scale value | Horizontal spacing (children) |
| space-y-* | Flex | Scale value | Vertical spacing (children) |

## Spacing Best Practices

### DO ✅

- Use the 4px base unit scale consistently
- Scale spacing up for larger screens
- Use consistent spacing patterns for similar components
- Use gap utilities for flex and grid layouts
- Maintain consistent vertical rhythm
- Use negative margins sparingly and only when necessary
- Consider content density when choosing spacing
- Use semantic spacing names (e.g., mb-4 for standard spacing)

### DON'T ❌

- Don't create custom pixel values outside the scale
- Don't mix different spacing units (px, rem, em)
- Don't use arbitrary values like [padding: 13px]
- Don't apply excessive spacing that wastes screen space
- Don't use the same spacing for mobile and desktop
- Don't create inconsistent spacing within similar components
- Don't use margin for internal component spacing (use gap or padding)
- Don't ignore responsive spacing needs

## Accessibility Guidelines

### Touch Targets

- **Minimum touch target**: 44×44px (0.75rem padding on all sides)
- **Recommended touch target**: 48×48px (0.875rem padding on all sides)
- **Spacing between touch targets**: 8px minimum

```html
<!-- Accessible button with sufficient spacing -->
<button class="px-4 py-2 min-h-[44px]">
  <!-- 0.5rem padding provides 44px+ touch target -->
</button>
```

### Visual Separation

- **Minimum spacing between interactive elements**: 8px
- **Section separation**: 32px minimum on mobile
- **Content separation**: 16px minimum within sections

### Focus States

- **Focus outline offset**: 2px minimum
- **Focus ring spacing**: 4px recommended

```html
<!-- Input with focus spacing -->
<input class="focus:ring-2 focus:ring-zinc-400 
              focus:ring-offset-2" />
```

## Implementation Notes

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        // Default Tailwind spacing scale
        // 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96
      },
    },
  },
};
```

### CSS Variables

```css
:root {
  --spacing-0: 0;
  --spacing-px: 1px;
  --spacing-0-5: 0.125rem;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  --spacing-20: 5rem;
  --spacing-24: 6rem;
}
```

### Common Spacing Classes

```css
/* Component-specific spacing */
.form-input {
  padding: 0.5rem 1rem; /* px-4 py-2 */
}

.btn {
  padding: 0.5rem 1rem; /* px-4 py-2 */
}

.btn-sm {
  padding: 0.25rem 0.5rem; /* px-2 py-1 */
}

.card {
  padding: 1.5rem; /* p-6 */
}

/* Section spacing */
.section {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

@media (min-width: 768px) {
  .section {
    padding-top: 5rem;
    padding-bottom: 5rem;
  }
}
```

## Quick Reference

### Common Spacing Values

| Purpose | Value | CSS/Tailwind |
|---------|-------|--------------|
| Micro spacing | 4px | 1 |
| Small spacing | 8px | 2 |
| Base spacing | 16px | 4 |
| Medium spacing | 24px | 6 |
| Large spacing | 32px | 8 |
| Extra large spacing | 48px | 12 |
| Hero spacing | 64px | 16 |

### Component Spacing Quick Guide

```html
<!-- Buttons -->
px-4 py-2     <!-- Standard button -->
px-2 py-1     <!-- Small button -->

<!-- Forms -->
px-4 py-2     <!-- Input padding -->
mb-2          <!-- Label bottom margin -->
space-y-4     <!-- Form field gap -->
mt-5          <!-- Submit button top margin -->

<!-- Cards -->
p-6           <!-- Card padding -->
mb-2          <!-- Title bottom margin -->
mb-4          <!-- Description bottom margin -->

<!-- Sections -->
py-12 md:py-20      <!-- Section padding -->
px-4 sm:px-6        <!-- Container padding -->
mb-4           <!-- Heading bottom margin -->
mb-8           <!-- Large heading bottom margin -->

<!-- Navigation -->
px-3 lg:px-5 py-2    <!-- Link padding -->
mr-4           <!-- Logo right margin -->
```

---

**Note**: Always reference this spacing documentation when generating components. Use the exact spacing scale values and patterns specified. Never create custom pixel or rem values outside the defined scale.