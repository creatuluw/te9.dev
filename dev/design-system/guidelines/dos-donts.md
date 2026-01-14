# Do's and Don'ts Guidelines

This document provides clear, actionable guidelines for working with the Gray Design System. Follow these rules to ensure consistency, accessibility, and maintainability across all generated interfaces.

## Overview

These guidelines serve as the definitive source of truth for implementing the Gray Design System. They cover tokens, components, layouts, accessibility, and best practices for both human developers and LLM agents.

### Core Principles

1. **Consistency First**: Always use documented tokens and component patterns
2. **Mobile-First**: Design for mobile, enhance for larger screens
3. **Accessibility by Default**: Ensure WCAG AA compliance (≥4.5:1 contrast)
4. **Semantic Structure**: Use proper HTML5 elements and ARIA attributes
5. **No Custom Values**: Never create arbitrary values outside the system

---

## Tokens - DO ✅

### Colors
- **DO** use zinc palette as the primary color system
- **DO** use zinc-900 for primary headings and emphasis
- **DO** use zinc-500 for secondary text and descriptions
- **DO** use zinc-100 for card and section backgrounds
- **DO** use zinc-50 for page and light section backgrounds
- **DO** use semantic colors (red for errors, green for success) appropriately
- **DO** maintain WCAG AA contrast ratios (≥4.5:1) for all text
- **DO** use opacity values for shadows (zinc-950/20, zinc-950/10)
- **DO** reference exact hex/OKLCH values from color documentation

### Typography
- **DO** use Inter font family for body text and UI elements
- **DO** use Inter Tight for headings and display text
- **DO** follow the defined type scale (text-xs to text-7xl)
- **DO** use tabular-nums for numerical data and statistics
- **DO** scale typography responsively (mobile → tablet → desktop)
- **DO** maintain consistent line heights (1.5 for body, 1.2-1.4 for headings)
- **DO** use appropriate font weights (400, 500, 600, 700)
- **DO** apply letter-spacing (-0.017em) to larger headings
- **DO** use gradient text (bg-clip-text) for hero headings

### Spacing
- **DO** use the 4px base unit scale (1, 2, 3, 4, 5, 6, 8, 12, 16)
- **DO** use consistent spacing within components (space-y-4 for forms)
- **DO** scale spacing up on larger screens (py-12 md:py-20)
- **DO** maintain section padding consistency (3rem mobile, 5rem desktop)
- **DO** use appropriate container widths (max-w-3xl, max-w-6xl)
- **DO** apply spacing tokens from the scale values
- **DO** use gap utilities for flex and grid layouts

### Borders and Shadows
- **DO** use zinc-200 for standard borders
- **DO** use zinc-300 for section dividers
- **DO** use zinc-400 for focus states
- **DO** use shadow-xs for logos and small elements
- **DO** use shadow-sm for buttons and inputs
- **DO** use shadow-2xl for cards and hero images
- **DO** use opacity with shadows (zinc-950/20)

---

## Tokens - DON'T ❌

### Colors
- **DON'T** create custom hex or OKLCH values outside the palette
- **DON'T** mix multiple color scales in the same component
- **DON'T** use zinc-400 or lighter for primary text
- **DON'T** use zinc-900 backgrounds with zinc-800 text (insufficient contrast)
- **DON'T** create custom gradients outside defined patterns
- **DON'T** ignore contrast ratios when combining colors
- **DON'T** use saturated colors as primary UI elements
- **DON'T** mix zinc with bright/saturated colors without purpose
- **DON'T** create arbitrary color values (like [color: #ff0000])
- **DON'T** use colors that don't meet WCAG AA standards

### Typography
- **DON'T** create custom font sizes outside the type scale
- **DON'T** use font weights below 400 for body text
- **DON'T** mix multiple font families within components
- **DON'T** use all-caps for body text
- **DON'T** stretch or condense fonts
- **DON'T** use text smaller than 0.75rem (12px) for essential content
- **DON'T** create arbitrary font sizes (like text-[18px])
- **DON'T** use inconsistent line heights within similar content
- **DON'T** ignore responsive typography needs

### Spacing
- **DON'T** create custom pixel values outside the scale
- **DON'T** use arbitrary values like [padding: 13px]
- **DON'T** mix different spacing units (px, rem, em)
- **DON'T** apply excessive spacing that wastes screen space
- **DON'T** use the same spacing for mobile and desktop
- **DON'T** create inconsistent spacing within similar components
- **DON'T** use margin for internal component spacing (use gap or padding)
- **DON'T** ignore the 4px base unit scale

---

## Components - DO ✅

### Buttons
- **DO** use `.btn` class for regular buttons
- **DO** use `.btn-sm` class for small buttons
- **DO** apply primary button style: `text-zinc-100 bg-zinc-900 hover:bg-zinc-800`
- **DO** apply secondary button style: `text-zinc-600 bg-white hover:text-zinc-900`
- **DO** include `shadow-sm` on all buttons
- **DO** make buttons full width on mobile when appropriate: `w-full`
- **DO** provide clear, descriptive button text
- **DO** include focus states: `focus:outline-none focus:ring-2 focus:ring-zinc-400`
- **DO** disable buttons visually and functionally when needed

### Forms
- **DO** use `.form-input` for text inputs
- **DO** use `.form-textarea` for multi-line inputs
- **DO** use `.form-select` for dropdowns
- **DO** use `.form-checkbox` for checkboxes
- **DO** use `.form-radio` for radio buttons
- **DO** provide labels for all form fields with `for` attribute
- **DO** use consistent spacing between fields: `space-y-4`
- **DO** include helper text with `text-sm text-zinc-500 mt-2`
- **DO** apply focus state: `focus:border-zinc-400`
- **DO** use error states with `border-red-500` and error text
- **DO** include validation messages below inputs

### Cards
- **DO** use `.bg-zinc-100 border-zinc-200 rounded-lg shadow-sm p-6` for standard cards
- **DO** use `.shadow-2xl` for elevated cards
- **DO** maintain consistent card padding (p-6)
- **DO** use grid layouts for card containers
- **DO** include card titles with `font-inter-tight font-semibold`
- **DO** use `tabular-nums` for card statistics
- **DO** apply hover effects for interactive cards

### Navigation
- **DO** use fixed header positioning: `absolute top-2 md:top-6 w-full z-30`
- **DO** apply gradient border to nav bar
- **DO** use `px-4 sm:px-6` for container padding
- **DO** center navigation elements with `flex items-center justify-between`
- **DO** use link style for tertiary navigation: `text-zinc-500 hover:text-zinc-900`
- **DO** include logo with `bg-white w-8 h-8 rounded-sm shadow-xs`
- **DO** use semantic `nav` element with `role="navigation"`

---

## Components - DON'T ❌

### Buttons
- **DON'T** create custom button classes outside `.btn` and `.btn-sm`
- **DON'T** use multiple primary buttons in the same context
- **DON'T** use vague button text like "Click Here" or "Submit"
- **DON'T** disable buttons without explanation
- **DON'T** make buttons look like links or vice versa
- **DON'T** use buttons for navigation (use links instead)
- **DON'T** nest buttons inside other buttons
- **DON'T** create custom button sizes outside defined variants
- **DON'T** use buttons for decorative purposes

### Forms
- **DON'T** create custom form field styles outside form classes
- **DON'T** use placeholder text as a replacement for labels
- **DON'T** mix different form field sizes in the same context
- **DON'T** make form labels ambiguous or unclear
- **DON'T** skip form validation or provide unclear error messages
- **DON'T** require users to create passwords without strength indicators
- **DON'T** disable form fields without explanation
- **DON'T** create custom input types outside standard HTML5

### Cards
- **DON'T** create custom card styles outside the system
- **DON'T** mix different card variants in the same context
- **DON'T** overuse shadows or borders
- **DON'T** make cards too large or overwhelming
- **DON'T** create cards without clear purpose
- **DON'T** use inconsistent spacing within cards
- **DON'T** nest cards inside other cards
- **DON'T** create custom border radius values

### Navigation
- **DON'T** create custom navigation styles outside defined patterns
- **DON'T** ignore responsive behavior (always design mobile-first)
- **DON'T** create navigation without clear visual hierarchy
- **DON'T** hide navigation on mobile without hamburger menu
- **DON'T** use inaccessible navigation patterns

---

## Layouts - DO ✅

### Page Structure
- **DO** use semantic HTML5 elements: `<header>`, `<main>`, `<footer>`, `<section>`, `<article>`, `<aside>`
- **DO** apply mobile-first responsive design
- **DO** use the 12-column grid system
- **DO** scale layouts from mobile to desktop
- **DO** use `max-w-6xl mx-auto` for wide containers
- **DO** use `max-w-3xl mx-auto` for medium containers
- **DO** use `px-4 sm:px-6` for container padding
- **DO** apply `py-12 md:py-20` for standard sections
- **DO** maintain consistent vertical spacing between sections

### Grid System
- **DO** use responsive grid columns: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`
- **DO** use consistent gap values: `gap-12` (3rem)
- **DO** align content appropriately: `items-center`, `items-start`, `items-stretch`
- **DO** use column spans for complex layouts: `col-span-6` (1/2 width)
- **DO** use negative margins sparingly and only when necessary
- **DO** test grids across all breakpoints

### Section Patterns
- **DO** use hero section pattern with gradient text
- **DO** apply glow effects to hero images with blur
- **DO** use feature section pattern with icon + content layout
- **DO** implement stats section with tabular numbers and dividers
- **DO** use form section pattern with centered container
- **DO** alternate section backgrounds (white, zinc-50) for visual separation

---

## Layouts - DON'T ❌

### Page Structure
- **DON'T** use div soup (overuse of divs without semantic elements)
- **DON'T** ignore mobile layouts (always design mobile-first)
- **DON'T** create custom grid configurations outside 12-column system
- **DON'T** mix grid and flexbox unnecessarily
- **DON'T** create layouts without clear content hierarchy
- **DON'T** use fixed widths for responsive content
- **DON'T** ignore the need for semantic structure
- **DON'T** create overly complex nested layouts

### Grid System
- **DON'T** mix different gap values in the same grid
- **DON'T** create custom column numbers outside the system
- **DON'T** use grids when flexbox is more appropriate
- **DON'T** make grids too complex or nested
- **DON'T** use arbitrary grid values without purpose
- **DON'T** ignore responsive design needs
- **DON'T** create grids that don't align with content

### Section Patterns
- **DON'T** create custom section patterns outside the system
- **DON'T** mix inconsistent spacing patterns
- **DON'T** use the same padding for all section types
- **DON'T** create sections without clear purpose
- **DON'T** ignore visual hierarchy between sections
- **DON'T** create sections that don't scale properly

---

## Accessibility - DO ✅

### Semantic HTML
- **DO** use `<header>` for page headers with `role="banner"`
- **DO** use `<nav>` for navigation with `role="navigation"`
- **DO** use `<main>` for main content with `role="main"`
- **DO** use `<aside>` for sidebars with `role="complementary"`
- **DO** use `<footer>` for page footers with `role="contentinfo"`
- **DO** use `<article>` for self-contained content
- **DO** use `<section>` for thematic content groups
- **DO** use proper heading hierarchy (h1 → h2 → h3)

### ARIA Attributes
- **DO** associate labels with inputs using `for` and `id`
- **DO** provide `aria-label` for icon-only buttons
- **DO** use `aria-required="true"` for required fields
- **DO** use `aria-invalid="true"` for error states
- **DO** use `aria-describedby` for helper text and error messages
- **DO** use `aria-labelledby` for section and component headings
- **DO** use `role="button"` for clickable divs
- **DO** use `aria-hidden="true"` for decorative elements

### Keyboard Navigation
- **DO** ensure all interactive elements are keyboard accessible
- **DO** provide visible focus states with rings
- **DO** maintain logical tab order
- **DO** support Enter key for form submission
- **DO** support Escape key for modals
- **DO** include focus management when opening/closing overlays
- **DO** use `focus:outline-none` with custom focus rings

### Color Contrast
- **DO** ensure minimum 4.5:1 contrast for normal text
- **DO** ensure minimum 3:1 contrast for large text (18pt+)
- **DO** ensure minimum 3:1 contrast for UI components and graphics
- **DO** use zinc-100 on zinc-900 (15.5:1 - AAA)
- **DO** use zinc-500 on white (7.5:1 - AAA)
- **DO** test contrast ratios with color contrast checkers
- **DO** consider color blindness when choosing color combinations

### Touch Targets
- **DO** ensure minimum 44×44px touch targets for buttons and links
- **DO** provide adequate spacing between touch targets (minimum 8px)
- **DO** make form fields large enough on mobile (min 44px height)
- **DO** consider thumb placement for mobile interfaces
- **DO** test on actual mobile devices

---

## Accessibility - DON'T ❌

### Semantic HTML
- **DON'T** use divs where semantic elements are appropriate
- **DON'T** skip heading levels (don't go from h1 to h3)
- **DON'T** use multiple h1s on a page
- **DON'T** ignore landmark regions (header, main, footer, nav)
- **DON'T** use non-semantic markup for structure
- **DON'T** create forms without proper labels
- **DON'T** use tables for layout (only for tabular data)

### ARIA Attributes
- **DON'T** use ARIA attributes that duplicate native HTML semantics
- **DON'T** guess ARIA roles (use only when necessary)
- **DON'T** forget to update ARIA when content changes dynamically
- **DON'T** use generic role="application" without justification
- **DON'T** create invisible elements without aria-hidden="true"
- **DON'T** use aria-live on static content (only for dynamic updates)
- **DON'T** omit ARIA for complex widgets

### Keyboard Navigation
- **DON'T** trap keyboard focus without escape mechanism
- **DON'T** create keyboard traps (elements that can't be exited)
- **DON'T** make interactive elements not keyboard accessible
- **DON'T** remove focus indicators entirely
- **DON'T** break natural tab order
- **DON'T** ignore focus management in modals
- **DON'T** create elements that can only be activated with mouse

### Color Contrast
- **DON'T** use text that doesn't meet WCAG AA (≥4.5:1)
- **DON'T** rely on color alone to convey information
- **DON'T** use low contrast decorations for content
- **DON'T** ignore the needs of colorblind users
- **DON'T** place text on complex backgrounds without sufficient contrast
- **DON'T** use zinc-400 text on zinc-100 backgrounds (low contrast)
- **DON'T** create custom color combinations without testing

### Touch Targets
- **DON'T** create touch targets smaller than 44×44px
- **DON'T** place touch targets too close together
- **DON'T** ignore mobile touch constraints
- **DON'T** make hit areas ambiguous or overlapping
- **DON'T** create elements that are hard to tap on mobile
- **DON'T** rely solely on hover states for mobile interactions

---

## LLM Integration - DO ✅

### Prompt Usage
- **DO** always reference the complete design system documentation
- **DO** specify exact component classes from documentation
- **DO** use the quick reference patterns provided
- **DO** follow the component specifications exactly
- **DO** include accessibility attributes in generated code
- **DO** maintain responsive design patterns
- **DO** use semantic HTML structure
- **DO** test generated code against the examples
- **DO** reference specific token values when needed

### Code Generation
- **DO** use only documented Tailwind classes
- **DO** maintain consistent class order (spacing → typography → colors → effects)
- **DO** include all necessary states (hover, focus, disabled)
- **DO** generate semantic HTML5 elements
- **DO** include appropriate ARIA attributes
- **DO** follow the mobile-first responsive approach
- **DO** use the exact component patterns from documentation
- **DO** ensure all generated code is valid HTML

### Quality Assurance
- **DO** verify color contrast meets WCAG AA standards
- **DO** check all interactive elements are keyboard accessible
- **DO** ensure responsive behavior at all breakpoints
- **DO** validate semantic HTML structure
- **DO** test generated components against examples
- **DO** verify spacing follows the scale
- **DO** check typography uses the type scale
- **DO** ensure accessibility attributes are complete

---

## LLM Integration - DON'T ❌

### Prompt Usage
- **DON'T** generate code without referencing design system documentation
- **DON'T** create arbitrary or custom class values
- **DON'T** ignore the component specifications
- **DON'T** mix different design systems or frameworks
- **DON'T** assume values without checking documentation
- **DON'T** create components outside the defined patterns
- **DON'T** use custom CSS or inline styles
- **DON'T** generate code that doesn't follow the system

### Code Generation
- **DON'T** create custom button, form, or card classes
- **DON'T** use arbitrary Tailwind values (like [padding: 13px])
- **DON'T** mix different color palettes
- **DON'T** ignore responsive design needs
- **DON'T** skip accessibility attributes
- **DON'T** create non-semantic HTML structure
- **DON'T** use custom font sizes or weights
- **DON'T** generate inconsistent spacing patterns
- **DON'T** create components without clear purpose

### Quality Assurance
- **DON'T** skip validation of generated code
- **DON'T** ignore accessibility requirements
- **DON'T** create code that only works on one breakpoint
- **DON'T** assume users have specific capabilities
- **DON'T** generate components that don't match examples
- **DON'T** create inconsistent implementation patterns
- **DON'T** ignore the needs of assistive technology users
- **DON'T** generate code without testing against documentation

---

## Common Mistakes to Avoid

### Color-Related Mistakes
- Creating custom color values instead of using zinc palette
- Using zinc-900 backgrounds with zinc-800 text (no contrast)
- Ignoring contrast ratios when combining colors
- Mixing multiple color scales in the same component

### Typography-Related Mistakes
- Creating arbitrary font sizes outside the type scale
- Using font weights below 400 for body text
- Scaling typography down instead of up (designing desktop-first)
- Inconsistent line heights across similar content

### Spacing-Related Mistakes
- Creating custom pixel values instead of using the scale
- Using the same spacing for mobile and desktop
- Applying excessive spacing that wastes screen space
- Using margin for internal component spacing instead of gap

### Component-Related Mistakes
- Creating custom button styles instead of using `.btn` or `.btn-sm`
- Making buttons look like links or vice versa
- Using multiple primary buttons in the same context
- Nesting buttons inside other buttons

### Layout-Related Mistakes
- Creating grids without clear purpose
- Mixing grid and flexbox unnecessarily
- Ignoring mobile layouts (always design mobile-first)
- Creating overly complex nested layouts

### Accessibility-Related Mistakes
- Skipping form labels or using placeholders as labels
- Making interactive elements not keyboard accessible
- Removing focus indicators instead of customizing them
- Forgetting ARIA attributes for complex components

---

## Quick Reference Checklist

### Before Writing Code
- [ ] Have I referenced the design system documentation?
- [ ] Am I using documented tokens (colors, typography, spacing)?
- [ ] Am I following the mobile-first responsive approach?
- [ ] Will this component be accessible to keyboard users?
- [ ] Will this component be accessible to screen readers?
- [ ] Does the color contrast meet WCAG AA standards?
- [ ] Are touch targets at least 44×44px?

### During Component Creation
- [ ] Am I using exact component classes from documentation?
- [ ] Am I including all necessary states (hover, focus, disabled)?
- [ ] Am I using semantic HTML5 elements?
- [ ] Am I including appropriate ARIA attributes?
- [ ] Is the spacing consistent with the scale?
- [ ] Is the typography following the type scale?
- [ ] Are the colors from the zinc palette?

### After Component Creation
- [ ] Does the component work on mobile?
- [ ] Does the component work on tablet?
- [ ] Does the component work on desktop?
- [ ] Is the component keyboard accessible?
- [ ] Is the component screen reader accessible?
- [ ] Does the component match the examples?
- [ ] Is the code clean and maintainable?
- [ ] Are there any accessibility issues?

---

## Examples

### Correct Usage ✅

```html
<!-- Correct: Using documented button class -->
<button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
  Submit
</button>

<!-- Correct: Using semantic HTML and proper tokens -->
<section class="py-12 md:py-20 bg-zinc-50" aria-labelledby="features-heading">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <h2 id="features-heading" class="font-inter-tight text-3xl font-bold text-zinc-900">
      Features
    </h2>
  </div>
</section>

<!-- Correct: Using form classes with labels -->
<div>
  <label class="text-sm text-zinc-800 font-medium mb-2" for="email">
    Email Address
  </label>
  <input 
    id="email" 
    class="form-input text-sm w-full" 
    type="email" 
    aria-required="true"
  />
</div>
```

### Incorrect Usage ❌

```html
<!-- Incorrect: Custom button styling -->
<button style="padding: 12px 16px; background: #333; color: white;">
  Submit
</button>

<!-- Incorrect: Arbitrary color value -->
<div class="bg-[#ff0000] text-white">
  Error message
</div>

<!-- Incorrect: Missing semantic structure -->
<div>
  <div class="font-bold text-2xl">Features</div>
  <div>
    <div>Feature 1</div>
    <div>Feature 2</div>
  </div>
</div>

<!-- Incorrect: No label for form input -->
<input class="form-input text-sm w-full" type="email" placeholder="Email" />
```

---

## Final Notes

1. **Reference First**: Always check the documentation before implementing
2. **Follow Patterns**: Use established patterns instead of creating new ones
3. **Test Thoroughly**: Verify across breakpoints, browsers, and assistive technologies
4. **Document Deviations**: If you must deviate, document why and how
5. **Iterate Consistently**: Keep improvements aligned with existing patterns

This document serves as your definitive guide for working with the Gray Design System. When in doubt, reference the component documentation, token specifications, and examples. Consistency and accessibility are non-negotiable.