# LLM Prompt Template

This document provides standardized prompt templates and guidelines for LLM agents to generate consistent UI components using the Gray Design System. Use these templates to ensure accurate, repeatable, and maintainable code generation.

## Overview

The Gray Design System is structured specifically for LLM consumption. When generating UI components, reference the appropriate documentation files to ensure consistency with established tokens, components, patterns, and guidelines.

### Documentation Structure

- **README.md**: System overview and quick start guide
- **tokens/**: Atomic design values (colors, typography, spacing)
- **components/**: Component specifications (buttons, forms, cards)
- **layouts/**: Layout patterns (grid, sections, navigation)
- **examples/**: Complete page implementations
- **guidelines/**: Best practices and do's/don'ts

## Quick Start Prompts

### Generate a Component

```
Generate a [component_name] using the Gray Design System:

Reference the following documentation:
- Component specs: design-system/components/[component_file].md
- Tokens: design-system/tokens/
- Layout patterns: design-system/layouts/

Requirements:
1. Use exact component classes as documented
2. Follow spacing, color, and typography tokens exactly
3. Include all necessary states (hover, focus, disabled)
4. Ensure accessibility with proper ARIA attributes
5. Use semantic HTML5 elements
6. Follow mobile-first responsive design

Output: Complete, production-ready HTML with Tailwind classes
```

### Generate a Page Layout

```
Generate a [page_type] page using the Gray Design System:

Reference the following documentation:
- Layout patterns: design-system/layouts/patterns.md
- Component index: design-system/components/index.md
- Similar examples: design-system/examples/[similar_page].md

Page requirements:
1. Use semantic HTML structure (header, main, footer, sections)
2. Apply mobile-first responsive design
3. Follow established spacing patterns (py-12 md:py-20)
4. Use zinc color palette consistently
5. Include appropriate components (buttons, forms, cards)
6. Ensure WCAG AA accessibility (contrast ≥4.5:1)
7. Use exact component classes from documentation

Output: Complete page structure with all sections and components
```

## Component-Specific Prompts

### Button Component

```
Generate a button component using the Gray Design System:

Documentation reference: design-system/components/button.md

Specify the following variant:
- Variant: [primary/secondary/tertiary]
- Size: [regular/small]
- State: [default/hover/focus/disabled]
- Full width: [true/false]

Requirements:
- Use exact classes: `.btn` or `.btn-sm`
- Primary: `text-zinc-100 bg-zinc-900 hover:bg-zinc-800`
- Secondary: `text-zinc-600 bg-white hover:text-zinc-900`
- Tertiary: `text-sm font-medium text-zinc-500 hover:text-zinc-900`
- Include shadow: `shadow-sm`
- Include focus state: `focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2`

Output: Complete button HTML with all required classes
```

### Form Component

```
Generate a form using the Gray Design System:

Documentation reference: design-system/components/form.md

Form specification:
- Form type: [login/contact/request-demo/registration]
- Include social login: [true/false]
- Field types: [text/email/password/textarea/select]

Requirements:
- Use `.form-input` for text inputs
- Use `.form-textarea` for multi-line inputs
- Use `.form-select` for dropdowns
- Use `.form-checkbox` and `.form-radio` for selections
- Labels: `text-sm text-zinc-800 font-medium mb-2`
- Spacing: `space-y-4` for fields, `mt-5` for submit button
- Container: `max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl`
- Background: `bg-linear-to-b from-zinc-100 to-zinc-50/.7`
- Accessibility: Include `for` attributes, `aria-required`, `aria-describedby`

Output: Complete form with all fields and submit button
```

### Card Component

```
Generate a card using the Gray Design System:

Documentation reference: design-system/components/card.md

Card specification:
- Card type: [standard/elevated/interactive/feature/stats]
- Include image: [true/false]
- Include action button: [true/false]

Requirements:
- Base: `bg-zinc-100 border-zinc-200 rounded-lg`
- Elevated: Add `shadow-2xl`
- Interactive: Add `hover:border-zinc-400 hover:shadow-md transition`
- Padding: `p-6`
- Title: `font-inter-tight font-semibold text-zinc-900`
- Description: `text-sm text-zinc-500`
- Optional icon: `bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm`

Output: Complete card HTML with content structure
```

### Navigation Header

```
Generate a site header using the Gray Design System:

Documentation reference: design-system/layouts/patterns.md#navigation-patterns

Header specification:
- Position: [fixed/absolute]
- Include logo: [true/false]
- Navigation links: [number of links]
- CTA button: [true/false]

Requirements:
- Position: `absolute top-2 md:top-6 w-full z-30`
- Container: `max-w-6xl mx-auto px-4 sm:px-6`
- Nav bar: `flex items-center justify-between h-14`
- Gradient border: `[background:linear-gradient(var(--color-white),var(--color-white))_padding-box,linear-gradient(120deg,var(--color-zinc-300),var(--color-zinc-100),var(--color-zinc-300))_border-box]`
- Logo: `bg-white w-8 h-8 rounded-sm shadow-xs shadow-zinc-950/20`
- Links: `text-sm font-medium text-zinc-500 hover:text-zinc-900 px-3 lg:px-5 py-2`
- CTA: `.btn-sm text-zinc-100 bg-zinc-900 hover:bg-zinc-800`

Output: Complete header HTML with navigation
```

## Token Reference Prompts

### Color Token Lookup

```
I need to find the appropriate color token from the Gray Design System for:
- [color_purpose: primary text/secondary text/background/border/error/success]

Documentation: design-system/tokens/colors.md

Requirements:
1. Provide the exact zinc palette value (50-950)
2. Include the CSS/Tailwind class
3. Specify the use case
4. Include OKLCH value
5. Provide contrast ratio information

Output: Token name, value, class, usage context
```

### Typography Token Lookup

```
I need to find the appropriate typography token from the Gray Design System for:
- [text_element: heading/body/label/helper/caption]

Documentation: design-system/tokens/typography.md

Requirements:
1. Provide font family (Inter or Inter Tight)
2. Specify font size and line height
3. Include font weight
4. Provide CSS/Tailwind class
5. Specify responsive behavior if applicable

Output: Token name, values, class, usage context
```

### Spacing Token Lookup

```
I need to find the appropriate spacing token from the Gray Design System for:
- [spacing_type: padding/margin/gap]
- [size: small/medium/large]

Documentation: design-system/tokens/spacing.md

Requirements:
1. Provide the exact scale value (number)
2. Include rem and pixel values
3. Provide CSS/Tailwind class
4. Specify use case
5. Note if it scales responsively

Output: Token name, value, class, usage context
```

## Layout Pattern Prompts

### Hero Section

```
Generate a hero section using the Gray Design System:

Documentation reference: design-system/layouts/patterns.md#hero-section

Hero specification:
- Heading text: [heading content]
- Subheading: [optional description]
- Buttons: [primary/secondary/both]
- Image: [optional hero image]

Requirements:
- Container: `py-12 md:py-20` or `pt-32 pb-12 md:pt-40 md:pb-20`
- Heading: `font-inter-tight text-4xl md:text-5xl font-bold`
- Gradient text: `bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900`
- Spacing: `mb-8` after heading, `mb-4` before content
- Buttons: `space-y-4 sm:space-y-0 sm:space-x-4`
- Image: Add glow effect `before:absolute before:-top-12 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl`

Output: Complete hero section with all elements
```

### Feature Grid

```
Generate a feature grid using the Gray Design System:

Documentation reference: design-system/layouts/patterns.md#feature-section

Grid specification:
- Number of columns: [2/3/4]
- With icons: [true/false]
- Responsive: [mobile/tablet/desktop]

Requirements:
- Grid: `grid gap-12 sm:grid-cols-2 md:grid-cols-3`
- Container: `bg-zinc-50` with `py-12 md:py-20`
- Section heading: `font-inter-tight text-3xl md:text-4xl font-bold text-zinc-900 mb-4`
- Feature item: `flex items-start gap-4`
- Icon container: `bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0`
- Feature title: `font-inter-tight font-semibold text-zinc-900 mb-2`
- Feature description: `text-sm text-zinc-500`

Output: Complete feature grid with all items
```

### Form Container

```
Generate a form container using the Gray Design System:

Documentation reference: design-system/layouts/patterns.md#form-section

Container specification:
- Width: [standard/narrow/wide]
- With glow effect: [true/false]

Requirements:
- Container: `max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl`
- Background: `bg-linear-to-b from-zinc-100 to-zinc-50/.7`
- Glow: `relative before:absolute before:-top-12 before:-left-16 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl before:-z-10`
- Form spacing: `space-y-4` for fields, `mt-5` for submit button
- Accessibility: Include proper ARIA attributes

Output: Complete form container with form element
```

## Page-Level Prompts

### Landing Page

```
Generate a complete landing page using the Gray Design System:

Documentation reference: 
- Page example: design-system/examples/page-landing.md
- Layout patterns: design-system/layouts/patterns.md
- Component index: design-system/components/index.md

Page sections:
1. Header with navigation
2. Hero section with heading and CTAs
3. Statistics section (optional)
4. Features section with grid
5. CTA section (optional)
6. Footer with link columns

Requirements:
- Mobile-first responsive design
- Semantic HTML structure (header, main, footer, sections)
- Consistent spacing patterns (py-12 md:py-20)
- Zinc color palette throughout
- Proper heading hierarchy (h1 → h2 → h3)
- Accessibility with ARIA landmarks
- WCAG AA contrast compliance

Output: Complete landing page HTML with all sections
```

### Login Page

```
Generate a login page using the Gray Design System:

Documentation reference:
- Page example: design-system/examples/page-login.md
- Form components: design-system/components/form.md
- Layout patterns: design-system/layouts/patterns.md

Page structure:
1. Header with logo and links
2. Hero section with page heading
3. Centered login form with glow effect
4. Social login option with divider
5. Footer with basic links

Requirements:
- Form container: `max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl`
- Form fields: Email and password with proper labels
- Helper text and links (forgot password)
- Submit button with full width
- Social login with Google icon
- Accessibility with ARIA attributes
- Focus states on all inputs

Output: Complete login page HTML
```

### Contact/Request Demo Page

```
Generate a request demo page using the Gray Design System:

Documentation reference:
- Page example: design-system/examples/page-request-demo.md
- Form components: design-system/components/form.md
- Layout patterns: design-system/layouts/patterns.md

Page structure:
1. Header with navigation
2. Hero section with page heading
3. Centered form with multiple field types
4. Features section (optional)
5. Footer with links

Requirements:
- Form fields: Name, email, select, textarea
- All fields with proper labels
- Form spacing: `space-y-4` for fields, `mt-5` for submit button
- Submit button: Full width with primary style
- Accessibility: ARIA attributes for all fields
- Validation states and helper text

Output: Complete request demo page HTML
```

## System Context Prompts

### Get System Overview

```
Provide an overview of the Gray Design System for generating UI components.

Required information:
1. Core technologies and frameworks
2. Color system and palette
3. Typography system and fonts
4. Spacing scale and units
5. Component categories available
6. Layout patterns supported
7. Accessibility standards
8. File structure and documentation organization

Output: Comprehensive overview with key details for code generation
```

### Find Component Documentation

```
I need to find documentation for [component_name] in the Gray Design System.

Provide:
1. The exact file path for component documentation
2. Summary of component variants and sizes
3. Key classes and patterns
4. Props and configuration options
5. Example usage patterns
6. Related components or patterns

Output: Complete reference information with code examples
```

## Best Practice Prompts

### Validate Component

```
Review this [component_code] against the Gray Design System specifications:

Validation criteria:
1. Uses only documented Tailwind classes
2. Follows component specifications exactly
3. Includes necessary states (hover, focus, disabled)
4. Has proper semantic HTML structure
5. Includes accessibility attributes (ARIA)
6. Maintains color contrast (≥4.5:1)
7. Uses responsive breakpoints appropriately
8. Follows spacing scale correctly

Reference: design-system/components/[component].md and design-system/guidelines/dos-donts.md

Output:
- Validation checklist results
- Any issues found with specific references
- Suggested corrections with exact class names
```

### Optimize for LLM Generation

```
Optimize this UI component code for consistent LLM generation using the Gray Design System:

Requirements:
1. Remove all inline styles and custom CSS
2. Replace with exact Tailwind classes from documentation
3. Ensure semantic HTML structure
4. Add missing accessibility attributes
5. Standardize spacing using scale values
6. Use proper component variants
7. Include all interactive states

Reference:
- Tokens: design-system/tokens/
- Components: design-system/components/
- Guidelines: design-system/guidelines/dos-donts.md

Output: Optimized code with explanations of changes
```

## Troubleshooting Prompts

### Fix Inconsistent Styling

```
This component has inconsistent styling according to the Gray Design System.

Component: [component_type]

Issues:
- [list specific issues]

Fix requirements:
1. Reference the exact component documentation
2. Use documented color tokens (zinc palette)
3. Apply correct spacing values
4. Use proper component classes
5. Ensure accessibility attributes are present
6. Verify responsive classes are correct

Reference: design-system/components/[component].md

Output: Corrected component code with explanation of fixes
```

### Add Missing States

```
This component is missing states according to the Gray Design System.

Component: [component_code]

Missing states:
- [hover/focus/disabled/error/success]

Add requirements:
1. Add hover states with `hover:` prefix
2. Add focus states with `focus:` prefix
3. Add disabled states with disabled attribute and styling
4. Add error states with `border-red-500` styling
5. Ensure transitions are smooth with `transition`
6. Maintain accessibility with focus rings

Reference: design-system/components/[component].md

Output: Complete component with all required states
```

## Advanced Prompts

### Create Design System Variation

```
Create a new component variant for the Gray Design System while maintaining consistency.

New variant specification:
- Component type: [button/card/form/etc]
- Variant name: [descriptive name]
- Visual differences: [what makes this variant unique]

Requirements:
1. Follow existing component structure and patterns
2. Use zinc color palette
3. Maintain spacing scale
4. Use appropriate shadows and borders
5. Ensure accessibility with proper contrast
6. Include all states and interactions
7. Document the variant according to system standards
8. Follow responsive design principles

Reference: design-system/components/[component].md

Output: Complete variant implementation with documentation
```

### Build Complex Layout

```
Build a complex layout using the Gray Design System patterns.

Layout specification:
- Layout type: [dashboard/settings page/editor/etc]
- Components included: [list of components]
- Responsive requirements: [breakpoint behaviors]

Requirements:
1. Use semantic HTML5 structure
2. Apply 12-column grid system
3. Use consistent spacing patterns
4. Integrate components seamlessly
5. Maintain mobile-first responsive design
6. Ensure accessibility throughout
7. Use proper ARIA landmarks
8. Follow established section patterns

Reference:
- Layout patterns: design-system/layouts/patterns.md
- Grid system: design-system/layouts/grid.md
- Components: design-system/components/index.md

Output: Complete layout with all components and proper structure
```

## Prompt Structure Guidelines

### Effective Prompt Elements

1. **Clear Intent**: State exactly what component or page you need
2. **Documentation References**: Always specify which files to reference
3. **Requirements List**: Provide numbered list of specific requirements
4. **Context**: Describe use case, target audience, or platform
5. **Constraints**: Specify any limitations or special requirements
6. **Output Format**: Define expected output format (HTML, component, full page)

### Prompt Optimization

- **Be Specific**: Don't say "a button" - say "a primary button with full width"
- **Reference Documentation**: Always include file paths for reference
- **Specify Variants**: Clearly state which variant, size, or state
- **Include Accessibility**: Always mention ARIA and accessibility requirements
- **Set Context**: Describe where the component will be used
- **Define Output**: Specify if you need code, explanation, or both

### Common Mistakes to Avoid

- ❌ Don't reference non-existent documentation
- ❌ Don't create arbitrary class values
- ❌ Don't ignore accessibility requirements
- ❌ Don't mix design systems or frameworks
- ❌ Don't skip component states (hover, focus, disabled)
- ❌ Don't create custom CSS instead of Tailwind
- ❌ Don't ignore responsive design needs
- ❌ Don't omit semantic HTML structure

### Quality Checklist

Before finalizing your prompt, ensure:
- [ ] Clear component/page type is specified
- [ ] Relevant documentation files are referenced
- [ ] All requirements are explicitly listed
- [ ] Output format is defined
- [ ] Accessibility requirements are included
- [ ] Responsive behavior is specified
- [ ] Variant/sizes/states are clear
- [ ] No arbitrary values are requested
- [ ] Context for usage is provided

## Quick Reference Templates

### Minimal Component Prompt

```
Generate a [component] using Gray Design System:
- Reference: design-system/components/[component].md
- Use exact classes from documentation
- Include all states and accessibility
- Mobile-first responsive
```

### Full Page Prompt

```
Generate a [page_type] page using Gray Design System:
- Reference: design-system/examples/[similar_page].md
- Layouts: design-system/layouts/patterns.md
- Components: design-system/components/index.md
- All sections with proper structure
- Semantic HTML with accessibility
- Consistent zinc palette and spacing
```

### Token Lookup Prompt

```
Find the [token_type] token for [purpose] in Gray Design System:
- Reference: design-system/tokens/[token].md
- Provide exact value and class
- Include usage context and contrast info
```

## Integration Guidelines

### For LLM Agents

1. **Always Reference Documentation**: Before generating code, check the relevant documentation files
2. **Use Exact Classes**: Never create or modify Tailwind classes - use exactly as documented
3. **Follow Patterns**: Use established component and layout patterns
4. **Ensure Accessibility**: Include appropriate ARIA attributes and keyboard navigation
5. **Test Against Examples**: Compare generated code with examples in the `examples/` folder
6. **Validate Tokens**: Verify colors, typography, and spacing match documentation
7. **Maintain Consistency**: Ensure new components match existing system style
8. **Document Deviations**: If you must deviate, explain why with documentation references

### For Human Developers

1. **Start Here**: Read README.md for system overview
2. **Explore Tokens**: Check tokens/ to understand atomic values
3. **Review Components**: Study components/ for implementation patterns
4. **Study Examples**: Review examples/ for complete implementations
5. **Follow Guidelines**: Apply guidelines/dos-donts.md to your work
6. **Use Playground**: Experiment with playground.md to understand interactions
7. **Reference Documentation**: Keep documentation files handy during development
8. **Test Thoroughly**: Verify responsive behavior and accessibility

## Conclusion

These prompt templates are designed to ensure consistent, accurate, and maintainable code generation using the Gray Design System. Always reference the documentation files, use exact class values, and follow established patterns for best results.

For more information, refer to:
- **System Overview**: README.md
- **Component Specs**: components/
- **Token Reference**: tokens/
- **Layout Patterns**: layouts/
- **Complete Examples**: examples/
- **Best Practices**: guidelines/dos-donts.md

Use these templates as a foundation and adapt them to your specific needs while maintaining the core principles of consistency, accessibility, and adherence to documented patterns.