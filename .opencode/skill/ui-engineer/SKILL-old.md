---
name: gray-design-system
description: Generate consistent UI/UX components using the Gray Design System documentation structure. Provides comprehensive guidelines, token references, and component specifications for repeatable, accessible, and visually consistent interface generation.
license: MIT
compatibility:
  - opencode
  - anthropic
metadata:
  audience: ui-engineers
  version: "1.0.0"
  category: design-system
  documentation_url: https://github.com/opencode/skills
---

# Gray Design System Skill

Generate production-ready, accessible, and consistent UI components using the Gray Design System. This skill provides comprehensive guidelines, token references, and component specifications for repeatable interface development.

## When to Use This Skill

Use this skill when you need to:
- Create UI components (buttons, forms, cards, navigation)
- Generate complete page layouts (landing pages, login, forms)
- Apply consistent styling across different interfaces
- Ensure accessibility compliance (WCAG AA)
- Follow responsive design patterns (mobile-first)
- Reference design tokens (colors, typography, spacing)

## Design System Structure

The Gray Design System is organized in this folder structure:

```
/dev/design-system/
├── README.md                 # System overview and quick start
├── SUMMARY.md               # High-level summary and quick reference
├── CHANGELOG.md             # Version history and roadmap
├── tokens/                 # Atomic design values
│   ├── colors.md            # Zinc palette (50-950) with OKLCH values
│   ├── typography.md        # Inter & Inter Tight fonts, type scale
│   ├── spacing.md           # 4px base unit scale
│   └── config.json          # Complete Tailwind configuration
├── components/              # Component specifications
│   ├── button.md            # Button variants, sizes, states
│   ├── form.md              # Form elements (inputs, selects, textareas)
│   ├── card.md              # Card variants and patterns
│   └── index.md             # Component catalog
├── layouts/                 # Layout patterns
│   ├── grid.md              # 12-column responsive grid system
│   └── patterns.md          # Hero, features, forms, navigation patterns
├── examples/                # Complete implementations
│   ├── page-landing.md      # Full landing page example
│   ├── page-login.md        # Login page with authentication
│   └── playground.md         # Interactive component showcase
└── guidelines/              # Best practices
    ├── dos-donts.md        # Comprehensive do's and don'ts
    └── prompt-template.md    # LLM prompt library
```

## Quick Reference

### Essential Tokens

**Colors:**
- Primary palette: zinc-50 to zinc-950
- Text hierarchy: zinc-900 (headings), zinc-500 (body), zinc-400 (muted)
- Backgrounds: zinc-50 (light), zinc-100 (cards), white (surfaces)
- Borders: zinc-200 (standard), zinc-300 (dividers), zinc-400 (focus)
- Shadows: shadow-xs (logos), shadow-sm (buttons), shadow-2xl (cards)

**Typography:**
- Body font: Inter (text-sm, text-base, text-lg)
- Display font: Inter Tight (headings, display text)
- Type scale: text-xs (12px) to text-7xl (72px)
- Font weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Tabular numbers: Use `tabular-nums` for statistics

**Spacing:**
- Base unit: 4px (Tailwind default)
- Scale: 1 (4px) to 32 (128px)
- Component padding: p-4 (16px) for cards, p-6 (24px) for forms
- Section padding: py-12 (48px) mobile, py-20 (80px) desktop
- Container padding: px-4 (16px) mobile, sm:px-6 (24px) desktop

### Component Quick Reference

**Buttons:**
- Primary: `btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm`
- Secondary: `btn text-zinc-600 bg-white hover:text-zinc-900 shadow-sm`
- Small: `btn-sm text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm`
- Focus: Add `focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2`
- Disabled: Add `text-zinc-400 bg-zinc-100 cursor-not-allowed disabled`

**Forms:**
- Text input: `form-input text-sm w-full`
- Textarea: `form-textarea text-sm w-full`
- Select: `form-select w-full`
- Checkbox: `form-checkbox`
- Radio: `form-radio`
- Label: `text-sm text-zinc-800 font-medium mb-2`
- Helper text: `text-sm text-zinc-500 mt-2`

**Cards:**
- Standard: `bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6`
- Elevated: `bg-white border border-zinc-200 rounded-lg shadow-2xl p-6`
- Interactive: Add `hover:border-zinc-400 hover:shadow-md transition cursor-pointer`

## Generating Components

### Button Component

When generating buttons:

1. **Reference**: Always check `/dev/design-system/components/button.md` first
2. **Choose variant**:
   - Primary: `text-zinc-100 bg-zinc-900 hover:bg-zinc-800`
   - Secondary: `text-zinc-600 bg-white hover:text-zinc-900`
   - Tertiary: `text-sm font-medium text-zinc-500 hover:text-zinc-900 px-3 py-2`
3. **Choose size**:
   - Regular: `.btn` (px-4 py-2)
   - Small: `.btn-sm` (px-2 py-1)
4. **Include shadow**: Always add `shadow-sm`
5. **Include states**: Add hover and focus states
6. **Full width**: Add `w-full` when appropriate (forms, mobile)

**Example:**
```html
<button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
  Submit
</button>
```

### Form Component

When generating forms:

1. **Reference**: Check `/dev/design-system/components/form.md` for complete specs
2. **Use form classes**:
   - `form-input` for text inputs
   - `form-textarea` for multi-line inputs
   - `form-select` for dropdowns
   - `form-checkbox` for checkboxes
   - `form-radio` for radio buttons
3. **Include labels**: Always use `text-sm text-zinc-800 font-medium mb-2`
4. **Add spacing**: Use `space-y-4` between fields, `mt-5` before submit button
5. **Accessibility**: Include `for` attribute, `aria-required`, `aria-describedby`
6. **Validation states**: Add `border-red-500` for errors

**Example:**
```html
<form>
  <div class="space-y-4">
    <div>
      <label class="text-sm text-zinc-800 font-medium mb-2" for="email">
        Email
      </label>
      <input id="email" class="form-input text-sm w-full" type="email" required />
    </div>
    <div class="mt-5">
      <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm">
        Submit
      </button>
    </div>
  </div>
</form>
```

### Card Component

When generating cards:

1. **Reference**: Check `/dev/design-system/components/card.md` for variants
2. **Choose variant**:
   - Standard: `bg-zinc-100 border-zinc-200 rounded-lg shadow-sm p-6`
   - Elevated: `bg-white border-zinc-200 rounded-lg shadow-2xl p-6`
   - Interactive: Add `hover:border-zinc-400 hover:shadow-md transition`
3. **Include title**: `font-inter-tight font-semibold text-zinc-900`
4. **Include content**: `text-sm text-zinc-500` for descriptions
5. **Add padding**: Always use `p-6` for consistent card padding

**Example:**
```html
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
  <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Card Title</h3>
  <p class="text-sm text-zinc-500">Card description text goes here.</p>
</div>
```

## Generating Layouts

### Grid System

When generating grid layouts:

1. **Reference**: Check `/dev/design-system/layouts/grid.md` for 12-column system
2. **Use responsive columns**:
   - `grid-cols-1` (mobile default)
   - `sm:grid-cols-2` (tablet)
   - `md:grid-cols-3` (desktop)
   - `lg:grid-cols-4` (large desktop)
3. **Add gaps**: Use `gap-12` for feature grids, `gap-8` for general grids
4. **Column spans**: Use `col-span-*` classes for complex layouts
5. **Alignment**: Add `items-center` for vertical alignment

**Example:**
```html
<div class="grid gap-12 sm:grid-cols-2 md:grid-cols-3">
  <div class="bg-zinc-100 border border-zinc-200 rounded-lg p-6">
    Card 1
  </div>
  <div class="bg-zinc-100 border border-zinc-200 rounded-lg p-6">
    Card 2
  </div>
  <div class="bg-zinc-100 border border-zinc-200 rounded-lg p-6">
    Card 3
  </div>
</div>
```

### Section Patterns

When generating sections:

1. **Container**: Use `max-w-6xl mx-auto px-4 sm:px-6` for full-width
2. **Padding**: Use `py-12 md:py-20` for standard sections
3. **Backgrounds**: Alternate between `bg-white` and `bg-zinc-50`
4. **Headings**: Use `text-zinc-900` with appropriate size (text-3xl to text-5xl)
5. **Subheadings**: Use `text-zinc-500` for descriptions

**Example:**
```html
<section class="py-12 md:py-20 bg-zinc-50">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <h2 class="font-inter-tight text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
      Section Title
    </h2>
    <p class="text-lg text-zinc-500">
      Section description paragraph.
    </p>
  </div>
</section>
```

### Navigation Patterns

When generating navigation:

1. **Reference**: Check `/dev/design-system/layouts/patterns.md` for navigation patterns
2. **Fixed header**: Use `absolute top-2 md:top-6 w-full z-30`
3. **Gradient border**: Use complex gradient border pattern
4. **Container**: `max-w-6xl mx-auto px-4 sm:px-6`
5. **Links**: Use `text-sm font-medium text-zinc-500 hover:text-zinc-900`
6. **Logo**: `bg-white w-8 h-8 rounded-sm shadow-xs shadow-zinc-950/20`

**Example:**
```html
<header class="absolute top-2 md:top-6 w-full z-30">
  <div class="px-4 sm:px-6">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center justify-between h-14 border border-transparent [background:linear-gradient(var(--color-white),var(--color-white))_padding-box,linear-gradient(120deg,var(--color-zinc-300),var(--color-zinc-100),var(--color-zinc-300))_border-box] rounded-lg px-3">
        <div class="shrink-0 mr-4">
          <a class="bg-white w-8 h-8 rounded-sm shadow-xs shadow-zinc-950/20">
            Logo
          </a>
        </div>
        <nav class="flex grow">
          <!-- Navigation links -->
        </nav>
      </div>
    </div>
  </div>
</header>
```

## Generating Complete Pages

### Landing Page

When generating landing pages:

1. **Reference**: Study `/dev/design-system/examples/page-landing.md`
2. **Include sections**: Header, Hero, Stats, Features, CTA, Footer
3. **Use responsive grids**: Feature grids with `gap-12 sm:grid-cols-2 md:grid-cols-3`
4. **Gradient text**: Use `bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900` for hero headings
5. **Social proof**: Include stats section with `tabular-nums`

**Example sections:**
- Hero with gradient heading and dual CTAs
- 4-column stats grid with tabular numbers
- 3-column feature grid with icons
- Dark CTA section for final conversion
- Multi-column footer with link groups

### Login Page

When generating authentication pages:

1. **Reference**: Study `/dev/design-system/examples/page-login.md`
2. **Form container**: Use centered container with glow effect
3. **Social login**: Include "Or" divider and social button
4. **Accessibility**: Include proper ARIA attributes for forms
5. **Links**: Add forgot password and terms links

**Key elements:**
- Fixed header with navigation
- Centered form container: `max-w-[25rem] mx-auto p-6`
- Glow effect: `before:absolute before:-top-12 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15]`
- Email and password fields with labels
- Social login button with Google icon

## Accessibility Requirements

Always ensure:

### Semantic HTML
- Use proper HTML5 elements: `<header>`, `<main>`, `<footer>`, `<nav>`, `<section>`, `<article>`, `<aside>`
- Maintain heading hierarchy: h1 → h2 → h3
- Associate labels with inputs: `<label for="field-id">`

### ARIA Attributes
- `role="banner"` for headers
- `role="main"` for main content
- `role="navigation"` for nav
- `role="contentinfo"` for footers
- `aria-labelledby` for sections
- `aria-label` for icon-only buttons
- `aria-required="true"` for required fields
- `aria-invalid="true"` for error states
- `aria-describedby` for helper text
- `aria-hidden="true"` for decorative elements

### Color Contrast
- Minimum 4.5:1 contrast for normal text (WCAG AA)
- Minimum 3:1 contrast for large text (18pt+)
- Verify contrast ratios using /dev/design-system/tokens/colors.md

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Add focus states: `focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2`
- Maintain logical tab order
- Support Enter key for form submission

### Touch Targets
- Minimum 44×44px touch targets for buttons and links
- Minimum 8px spacing between interactive elements
- Ensure adequate tap targets on mobile

## Responsive Design

Always follow mobile-first approach:

### Breakpoints
- Default (< 640px): Single column, stacked layouts
- sm (≥ 640px): Two columns, increased spacing
- md (≥ 768px): Multi-column, full features
- lg (≥ 1024px): Optimized layouts, maximum spacing
- xl (≥ 1280px): Extra large layouts

### Mobile Optimization
- Single column layouts for mobile
- Full-width buttons on mobile: `w-full`
- Touch-friendly spacing: adequate padding around elements
- Simplified navigation on mobile

### Desktop Enhancement
- Multi-column grids: 3-4 columns
- Sidebars and complex layouts
- Enhanced typography: larger headings
- Improved visual hierarchy with spacing

## Best Practices

### DO ✅

1. **Always Reference Documentation**
   - Check `/dev/design-system/` folder before generating
   - Use exact class combinations from component docs
   - Reference token values from `tokens/` folder

2. **Use Exact Classes**
   - Never create custom CSS or arbitrary values
   - Use only documented Tailwind classes
   - Follow established patterns

3. **Include All States**
   - Hover: `hover:` prefix
   - Focus: `focus:` prefix with ring
   - Disabled: `disabled` attribute and styling
   - Error: `border-red-500` for error states

4. **Ensure Accessibility**
   - Semantic HTML5 structure
   - Proper ARIA attributes
   - Keyboard navigation support
   - WCAG AA color contrast

5. **Follow Responsive Design**
   - Mobile-first approach
   - Progressive enhancement
   - Test at all breakpoints

6. **Maintain Consistency**
   - Use zinc color palette exclusively
   - Follow spacing scale (4px base unit)
   - Use Inter & Inter Tight fonts
   - Keep component patterns consistent

### DON'T ❌

1. **Don't Create Custom Classes**
   - No arbitrary values like `[padding: 13px]`
   - No custom CSS outside Tailwind
   - No mixing of different design systems

2. **Don't Skip States**
   - Always include hover states
   - Always include focus states for keyboard users
   - Always include disabled states when appropriate

3. **Don't Ignore Accessibility**
   - Don't skip ARIA attributes
   - Don't make elements keyboard inaccessible
   - Don't use insufficient color contrast

4. **Don't Break Responsive Design**
   - Don't design desktop-first
   - Don't use fixed widths for responsive content
   - Don't ignore mobile constraints

5. **Don't Mix Patterns**
   - Don't combine multiple design systems
   - Don't create inconsistent spacing within same component
   - Don't use different font families arbitrarily

## Common Patterns

### Hero Section Pattern
```html
<section class="py-12 md:py-20">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 text-center">
    <h1 class="font-inter-tight text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900 pb-4">
      Hero Heading
    </h1>
    <p class="text-lg text-zinc-500 mb-8">
      Hero description
    </p>
    <div class="space-y-4 sm:space-y-0 sm:space-x-4">
      <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
        Primary Action
      </button>
      <button class="btn text-zinc-600 bg-white hover:text-zinc-900 shadow-sm">
        Secondary Action
      </button>
    </div>
  </div>
</section>
```

### Feature Grid Pattern
```html
<section class="bg-zinc-50 py-12 md:py-20">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="max-w-3xl mx-auto text-center pb-12">
      <h2 class="font-inter-tight text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
        Section Heading
      </h2>
    </div>
    <div class="grid gap-12 sm:grid-cols-2 md:grid-cols-3">
      <div class="flex items-start gap-4">
        <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
          Icon SVG
        </div>
        <div>
          <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">
            Feature Title
          </h3>
          <p class="text-sm text-zinc-500">
            Feature description
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
```

### Form Container Pattern
```html
<div class="max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl bg-linear-to-b from-zinc-100 to-zinc-50/.7 relative before:absolute before:-top-12 before:-left-16 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl before:-z-10">
  <form>
    <div class="space-y-4">
      <div>
        <label class="text-sm text-zinc-800 font-medium mb-2" for="field">
          Field Label
        </label>
        <input id="field" class="form-input text-sm w-full" type="text" required />
      </div>
    </div>
    <div class="mt-5">
      <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm">
        Submit
      </button>
    </div>
  </form>
</div>
```

## Troubleshooting

### Component Doesn't Match Documentation

**Problem**: Generated component doesn't match examples
**Solution**: 
1. Reference exact component documentation: `/dev/design-system/components/[component].md`
2. Copy class combinations exactly as documented
3. Verify all required classes are included
4. Check for typos in class names

### Colors Are Inconsistent

**Problem**: Generated colors don't match zinc palette
**Solution**: 
1. Reference `/dev/design-system/tokens/colors.md`
2. Use exact zinc values (zinc-50 to zinc-950)
3. Never create custom color values
4. Verify contrast ratios meet WCAG AA

### Responsive Layout Broken

**Problem**: Layout doesn't work on mobile
**Solution**: 
1. Follow mobile-first approach
2. Use responsive grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`
3. Verify spacing scales correctly
4. Test at actual breakpoints (640px, 768px, 1024px)

### Accessibility Issues

**Problem**: Component not keyboard accessible
**Solution**: 
1. Add focus states with rings: `focus:ring-2 focus:ring-zinc-400`
2. Include ARIA attributes: `aria-label`, `aria-required`, etc.
3. Ensure tab order follows visual layout
4. Test keyboard navigation through all components

## Advanced Patterns

### Gradient Border Pattern
```html
<div class="[background:linear-gradient(var(--color-white),var(--color-white))_padding-box,linear-gradient(120deg,var(--color-zinc-300),var(--color-zinc-100),var(--color-zinc-300))_border-box]">
  <!-- Content with gradient border -->
</div>
```

### Glow Effect Pattern
```html
<div class="relative">
  <div class="before:absolute before:-top-12 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl before:-z-10">
    <!-- Content with glow effect -->
  </div>
</div>
```

### Stats Divider Pattern
```html
<div class="relative text-center md:px-5 after:hidden md:after:block after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-8 after:border-l after:border-zinc-300 after:border-dashed last:after:hidden">
  <!-- Stats content with dashed dividers -->
</div>
```

## Quick Prompt Templates

### Generate Button
```
Create a primary button using Gray Design System:
- Reference: /dev/design-system/components/button.md
- Use exact classes: btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm
- Include focus state: focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2
```

### Generate Form
```
Create a login form using Gray Design System:
- Reference: /dev/design-system/components/form.md and /dev/design-system/examples/page-login.md
- Container: max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl
- Form classes: form-input, space-y-4, mt-5
- Accessibility: Include for, aria-required, aria-describedby
```

### Generate Card Grid
```
Create a 3-column feature grid using Gray Design System:
- Reference: /dev/design-system/components/card.md and /dev/design-system/layouts/patterns.md
- Grid: grid gap-12 sm:grid-cols-2 md:grid-cols-3
- Cards: bg-zinc-100 border-zinc-200 rounded-lg p-6
- Icons: bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0
```

### Generate Landing Page
```
Create a landing page using Gray Design System:
- Reference: /dev/design-system/examples/page-landing.md
- Sections: Hero, stats, features, CTA, footer
- Spacing: py-12 md:py-20 for sections
- Colors: Zinc palette throughout
- Accessibility: Semantic HTML, ARIA attributes, WCAG AA
```

## Validation Checklist

Before finalizing generated code, verify:

- [ ] Documentation referenced (components, tokens, layouts)
- [ ] Exact class names used (no typos, no custom values)
- [ ] All required states included (hover, focus, disabled)
- [ ] Responsive breakpoints applied correctly
- [ ] Accessibility attributes present (ARIA, semantic HTML)
- [ ] Color contrast meets WCAG AA (≥4.5:1)
- [ ] Touch targets are adequate (44×44px minimum)
- [ ] Keyboard navigation works (focus states, tab order)
- [ ] Spacing follows scale (4px base unit)
- [ ] Typography follows type scale (Inter, Inter Tight)
- [ ] Zinc palette used exclusively
- [ ] Component patterns followed exactly
- [ ] Layout structure is semantic (header, main, footer)

## Getting Help

If you encounter issues:

1. **Check Documentation**: Refer to `/dev/design-system/` folder for detailed specs
2. **Study Examples**: Review `/dev/design-system/examples/` for working implementations
3. **Review Guidelines**: Check `/dev/design-system/guidelines/` for best practices
4. **Use Templates**: Refer to `/dev/design-system/guidelines/prompt-template.md` for prompt patterns

## Related Skills

This skill works well with:
- **Frontend development**: HTML, CSS, JavaScript
- **UI/UX design**: Component-based architecture
- **Web frameworks**: React, Vue, Svelte, Angular
- **CSS frameworks**: Tailwind CSS, Bootstrap, Material UI

## Version Notes

**Current**: v1.0.0
**Last Updated**: 2024-01-XX
**Design System Version**: Gray Design System v1.0.0

This skill is actively maintained to match the evolving Gray Design System documentation. Always reference the latest documentation files for the most accurate specifications.