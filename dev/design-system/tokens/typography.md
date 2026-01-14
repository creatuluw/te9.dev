# Typography Tokens

The typography system uses a carefully selected typeface scale with two font families, defined weights, and consistent spacing to create readable, hierarchical text interfaces.

## Font Families

### Primary Font: Inter

Inter is used for body text, UI elements, and general interface content.

| Token | Value | CSS/Tailwind | Usage |
|-------|-------|--------------|-------|
| sans | Inter, sans-serif | font-sans, font-inter | Body text, paragraphs, labels, UI elements |

### Display Font: Inter Tight

Inter Tight is used for headings, emphasized text, and display typography.

| Token | Value | CSS/Tailwind | Usage |
|-------|-------|--------------|-------|
| tight | Inter Tight, sans-serif | font-inter-tight | Headings, display text, emphasized content |

## Font Weights

| Weight | Numeric Value | CSS/Tailwind | Usage |
|--------|--------------|--------------|-------|
| Regular | 400 | font-normal, font-weight-400 | Body text, secondary headings |
| Medium | 500 | font-medium, font-weight-500 | Emphasis, buttons, labels |
| Semibold | 600 | font-semibold, font-weight-600 | Primary headings, navigation |
| Bold | 700 | font-bold, font-weight-700 | Hero text, major emphasis |

## Type Scale

### Micro Text

| Token | Size | Line Height | Letter Spacing | CSS/Tailwind | Usage |
|-------|------|-------------|----------------|--------------|-------|
| text-xs | 0.75rem (12px) | 1.5 | normal | text-xs | Captions, labels, tiny UI text |

### Small Text

| Token | Size | Line Height | Letter Spacing | CSS/Tailwind | Usage |
|-------|------|-------------|----------------|--------------|-------|
| text-sm | 0.875rem (14px) | 1.5715 | normal | text-sm | Body text, form labels, secondary text |

### Base Text

| Token | Size | Line Height | Letter Spacing | CSS/Tailwind | Usage |
|-------|------|-------------|----------------|--------------|-------|
| text-base | 1rem (16px) | 1.5 | -0.017em | text-base | Standard body text, paragraphs |

### Large Text

| Token | Size | Line Height | Letter Spacing | CSS/Tailwind | Usage |
|-------|------|-------------|----------------|--------------|-------|
| text-lg | 1.125rem (18px) | 1.5 | -0.017em | text-lg | Lead paragraphs, emphasized body text |

### Extra Large Text

| Token | Size | Line Height | Letter Spacing | CSS/Tailwind | Usage |
|-------|------|-------------|----------------|--------------|-------|
| text-xl | 1.25rem (20px) | 1.5 | -0.017em | text-xl | Subheadings, section titles |
| text-2xl | 1.5rem (24px) | 1.415 | -0.017em | text-2xl | Small headings, card titles |

### Display Text

| Token | Size | Line Height | Letter Spacing | CSS/Tailwind | Usage |
|-------|------|-------------|----------------|--------------|-------|
| text-3xl | 2rem (32px) | 1.3125 | -0.017em | text-3xl | Section headings, feature titles |
| text-4xl | 2.5rem (40px) | 1.25 | -0.017em | text-4xl | Page headings, major sections |
| text-5xl | 3.25rem (52px) | 1.2 | -0.017em | text-5xl | Hero headings, display text |
| text-6xl | 3.75rem (60px) | 1.1666 | -0.017em | text-6xl | Large display, landing page headlines |
| text-7xl | 4.5rem (72px) | 1.1666 | -0.017em | text-7xl | Extra large display, hero text |

## Responsive Typography

### Mobile-First Scale

Typography scales up on larger screens:

| Element | Mobile | Desktop (md:) | CSS/Tailwind |
|---------|--------|---------------|--------------|
| Small Heading | text-4xl | text-5xl | text-4xl md:text-5xl |
| Medium Heading | text-5xl | text-6xl | text-5xl md:text-6xl |

## Typography Hierarchy

### Level 1: Hero Text

```html
<h1 class="font-inter-tight text-4xl md:text-5xl font-bold text-zinc-900">
  Main Page Title
</h1>
```

**Characteristics:**
- Font: Inter Tight
- Weight: Bold (700)
- Size: 2.5rem (mobile) → 3.25rem (desktop)
- Color: zinc-900
- Line Height: 1.25
- Letter Spacing: -0.017em

### Level 2: Section Headings

```html
<h2 class="font-inter-tight text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
  Section Title
</h2>
```

**Characteristics:**
- Font: Inter Tight
- Weight: Bold (700)
- Size: 2rem (mobile) → 2.5rem (desktop)
- Color: zinc-900
- Bottom margin: 1rem (0.25rem × 4)

### Level 3: Component Headings

```html
<h3 class="font-inter-tight text-xl font-semibold text-zinc-900">
  Component Title
</h3>
```

**Characteristics:**
- Font: Inter Tight
- Weight: Semibold (600)
- Size: 1.25rem
- Color: zinc-900

### Level 4: Labels and Captions

```html
<label class="text-sm text-zinc-800 font-medium">
  Form Label
</label>
```

**Characteristics:**
- Font: Inter
- Weight: Medium (500)
- Size: 0.875rem
- Color: zinc-800

### Level 5: Body Text

```html
<p class="text-base text-zinc-900">
  Standard body paragraph text for general content.
</p>
```

**Characteristics:**
- Font: Inter
- Weight: Normal (400)
- Size: 1rem
- Color: zinc-900
- Line Height: 1.5

### Level 6: Secondary Text

```html
<p class="text-lg text-zinc-500">
  Secondary descriptive text for lead paragraphs and descriptions.
</p>
```

**Characteristics:**
- Font: Inter
- Weight: Normal (400)
- Size: 1.125rem
- Color: zinc-500
- Line Height: 1.5

### Level 7: Muted Text

```html
<span class="text-sm text-zinc-400">
  Muted helper text, timestamps, secondary information.
</span>
```

**Characteristics:**
- Font: Inter
- Weight: Normal (400)
- Size: 0.875rem
- Color: zinc-400

## Component Typography

### Buttons

```html
<!-- Primary Button -->
<button class="btn text-sm font-medium text-zinc-100">
  Button Label
</button>

<!-- Secondary Button -->
<button class="btn-sm text-sm font-medium text-zinc-100">
  Small Button
</button>
```

### Form Elements

```html
<!-- Input Label -->
<label class="text-sm text-zinc-800 font-medium mb-2">
  Email Address
</label>

<!-- Input Placeholder -->
<input class="form-input text-sm text-zinc-600 placeholder-zinc-400" />

<!-- Helper Text -->
<p class="text-sm text-zinc-500">
  Helper text goes here.
</p>
```

### Navigation

```html
<!-- Nav Links -->
<a class="text-sm font-medium text-zinc-500 hover:text-zinc-900">
  Navigation Link
</a>

<!-- Logo Text -->
<span class="font-inter-tight font-bold text-zinc-900">
  Brand Name
</span>
```

### Cards

```html
<!-- Card Title -->
<h3 class="font-inter-tight font-semibold text-zinc-900">
  Card Heading
</h3>

<!-- Card Description -->
<p class="text-sm text-zinc-500">
  Card description text.
</p>
```

## Typography Utilities

### Text Alignment

| Utility | CSS/Tailwind | Usage |
|---------|--------------|-------|
| Left | text-left | Default, most body text |
| Center | text-center | Hero text, centered content |
| Right | text-right | Secondary information, metadata |

### Text Transformation

| Utility | CSS/Tailwind | Usage |
|---------|--------------|-------|
| Uppercase | uppercase | Labels, badges, small caps |
| Lowercase | lowercase | URLs, email addresses |
| Capitalize | capitalize | Name formatting |

### Text Decoration

| Utility | CSS/Tailwind | Usage |
|---------|--------------|-------|
| Underline | underline | Links, emphasis |
| No Underline | no-underline | Hover states |
| Line Through | line-through | Strikethrough, deleted text |

### Tracking (Letter Spacing)

| Utility | CSS/Tailwind | Usage |
|---------|--------------|-------|
| Tight | tracking-tight | Headings, display text |
| Normal | tracking-normal | Body text, default |
| Wide | tracking-wide | Uppercase text, labels |

## Text Gradients

Special gradient text for hero sections and emphasis:

```html
<h1 class="bg-clip-text text-transparent bg-linear-to-r 
           from-zinc-500 via-zinc-900 to-zinc-900">
  Gradient Heading Text
</h1>
```

**Characteristics:**
- Background Clip: text
- Text Color: transparent
- Gradient: zinc-500 → zinc-900 → zinc-900

## Tabular Numbers

For numerical data, use tabular nums for alignment:

```html
<h4 class="tabular-nums mb-2">
  1,234.56
</h4>
```

**CSS/Tailwind:** `tabular-nums`

## Typography Patterns

### Hero Section

```html
<h1 class="font-inter-tight text-4xl md:text-5xl font-bold 
           bg-clip-text text-transparent 
           bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900 
           pb-4">
  Hero Heading with Gradient
</h1>
<p class="text-lg text-zinc-500 mb-8">
  Lead paragraph for hero section.
</p>
```

### Feature Section

```html
<h2 class="font-inter-tight text-3xl md:text-4xl font-bold 
           text-zinc-900 mb-4">
  Section Heading
</h2>
<p class="text-lg text-zinc-500">
  Section description paragraph.
</p>
```

### Card Component

```html
<h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">
  Card Title
</h3>
<p class="text-sm text-zinc-500">
  Card description with secondary text.
</p>
```

### Form Section

```html
<label class="text-sm text-zinc-800 font-medium mb-2">
  Field Label
</label>
<input class="form-input text-sm text-zinc-600 
             placeholder-zinc-400" />
<p class="text-sm text-zinc-500 mt-2">
  Helper text.
</p>
```

## Accessibility Guidelines

### Font Size Minimums

- **Body text**: 1rem (16px) minimum
- **Form labels**: 0.875rem (14px) minimum with sufficient contrast
- **Captions**: 0.75rem (12px) minimum for decorative text only

### Line Height Guidelines

- **Body text**: 1.5 to 1.6 for readability
- **Headings**: 1.2 to 1.4 for tight, professional appearance
- **Small text**: 1.5 to maintain readability

### Color Contrast

- **Primary text**: zinc-900 on white (21:1 - AAA)
- **Secondary text**: zinc-500 on white (7.5:1 - AAA)
- **Muted text**: zinc-400 on white (4.5:1 - AA)

### Readability Best Practices

- Maximum line length: 75-85 characters for body text
- Paragraph spacing: 1.5rem (24px) between paragraphs
- Heading hierarchy: Maintain clear visual distinction between levels
- Avoid text over images without sufficient contrast overlay

## Typography Do's and Don'ts

### DO ✅

- Use Inter for body text and UI elements
- Use Inter Tight for headings and display text
- Maintain consistent line heights across similar content
- Scale text responsively with breakpoints
- Use appropriate font weights for hierarchy
- Maintain adequate contrast ratios (minimum 4.5:1)
- Use tabular numbers for numerical data
- Limit line length to 75-85 characters

### DON'T ❌

- Don't use font weights below 400 for body text
- Don't mix multiple font families within components
- Don't use text smaller than 0.75rem (12px) for essential content
- Don't use text-justify for body text
- Don't create custom font sizes outside the scale
- Don't use uppercase for body text
- Don't stretch or condense fonts
- Don't mix different type scales inconsistently

## Implementation Notes

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        tight: ['Inter Tight', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }],
        sm: ['0.875rem', { lineHeight: '1.5715' }],
        base: ['1rem', { 
          lineHeight: '1.5', 
          letterSpacing: '-0.017em' 
        }],
        lg: ['1.125rem', { 
          lineHeight: '1.5', 
          letterSpacing: '-0.017em' 
        }],
        xl: ['1.25rem', { 
          lineHeight: '1.5', 
          letterSpacing: '-0.017em' 
        }],
        '2xl': ['1.5rem', { 
          lineHeight: '1.415', 
          letterSpacing: '-0.017em' 
        }],
        '3xl': ['2rem', { 
          lineHeight: '1.3125', 
          letterSpacing: '-0.017em' 
        }],
        '4xl': ['2.5rem', { 
          lineHeight: '1.25', 
          letterSpacing: '-0.017em' 
        }],
        '5xl': ['3.25rem', { 
          lineHeight: '1.2', 
          letterSpacing: '-0.017em' 
        }],
        '6xl': ['3.75rem', { 
          lineHeight: '1.1666', 
          letterSpacing: '-0.017em' 
        }],
        '7xl': ['4.5rem', { 
          lineHeight: '1.1666', 
          letterSpacing: '-0.017em' 
        }],
      },
    },
  },
};
```

### CSS Variables

```css
:root {
  --font-sans: Inter, sans-serif;
  --font-tight: Inter Tight, sans-serif;
  
  /* Font sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  --text-4xl: 2.5rem;
  --text-5xl: 3.25rem;
  --text-6xl: 3.75rem;
  --text-7xl: 4.5rem;
}
```

### Google Fonts Import

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Inter+Tight:ital,wght@0,500;0,600;0,700;1,700&display=fallback" rel="stylesheet">
```

---

**Note**: Always reference this typography documentation when generating components. Use the exact font families, sizes, weights, and spacing specified. Never create custom font values or deviate from the defined type scale.