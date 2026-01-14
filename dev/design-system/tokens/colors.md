# Color Tokens

The color system uses OKLCH color space for consistent and accessible color relationships. All colors follow a strict naming convention and usage guidelines to ensure visual consistency.

## Color System Overview

- **Color Space**: OKLCH (perceptually uniform)
- **Primary Palette**: Zinc grayscale
- **Supporting Palettes**: Full spectrum (red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose)
- **Accessibility**: WCAG AA compliant (contrast ratio ≥ 4.5:1)

## Zinc Palette (Primary)

The zinc palette is the primary color system for the Gray design system, used for typography, backgrounds, borders, and UI elements.

### Neutral/Background Colors

| Token | OKLCH Value | CSS/Tailwind | Usage |
|-------|-------------|--------------|-------|
| zinc-50 | oklch(0.984 0.003 247.858) | bg-zinc-50 | Lightest backgrounds, page backgrounds |
| zinc-100 | oklch(0.968 0.007 247.896) | bg-zinc-100 | Secondary backgrounds, cards |
| zinc-200 | oklch(0.929 0.013 255.508) | bg-zinc-200 | Hover backgrounds, borders |
| zinc-300 | oklch(0.867 0.022 253.371) | bg-zinc-300 | Tertiary backgrounds, subtle dividers |
| zinc-400 | oklch(0.775 0.027 255.571) | bg-zinc-400 | Disabled states, subtle borders |

### Text Colors

| Token | OKLCH Value | CSS/Tailwind | Usage |
|-------|-------------|--------------|-------|
| zinc-500 | oklch(0.682 0.032 252.875) | text-zinc-500 | Secondary text, descriptions, subtitles |
| zinc-600 | oklch(0.606 0.032 252.875) | text-zinc-600 | Form input text, tertiary content |
| zinc-700 | oklch(0.543 0.029 255.091) | text-zinc-700 | Emphasis text, labels |
| zinc-800 | oklch(0.477 0.024 253.371) | text-zinc-800 | Strong emphasis, important labels |
| zinc-900 | oklch(0.402 0.015 253.371) | text-zinc-900 | Primary headings, main content text |

### Dark/Accent Colors

| Token | OKLCH Value | CSS/Tailwind | Usage |
|-------|-------------|--------------|-------|
| zinc-950 | oklch(0.255 0.006 253.371) | text-zinc-950, bg-zinc-950 | Darkest backgrounds, text on light backgrounds |

## Color Usage Guidelines

### Primary Text Hierarchy

```html
<!-- Primary Heading -->
<h1 class="text-zinc-900">Main Heading</h1>

<!-- Secondary Heading -->
<h2 class="text-zinc-800">Subheading</h2>

<!-- Body Text -->
<p class="text-zinc-500">Body content text</p>

<!-- Muted Text -->
<span class="text-zinc-400">Muted/placeholder text</span>
```

### Background Hierarchy

```html
<!-- Page Background -->
<body class="bg-white">

<!-- Section Background -->
<section class="bg-zinc-50">

<!-- Card Background -->
<div class="bg-zinc-100">

<!-- Accent Background -->
<div class="bg-zinc-200">
```

### Gradients

The design system uses specific zinc gradients:

```html
<!-- Header Border Gradient -->
class="border border-transparent [background:linear-gradient(var(--color-white),var(--color-white))_padding-box,linear-gradient(120deg,var(--color-zinc-300),var(--color-zinc-100),var(--color-zinc-300))_border-box]"

<!-- Text Gradient -->
class="bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900"

<!-- Background Gradient -->
class="bg-linear-to-b from-zinc-100 to-zinc-50/.7"
```

## Shadow System

Shadows use zinc colors with opacity values:

| Token | CSS/Tailwind | Usage |
|-------|--------------|-------|
| shadow-xs | shadow-xs shadow-zinc-950/20 | Small elements, logos |
| shadow-sm | shadow-sm shadow-zinc-950/20 | Buttons, inputs |
| shadow-2xl | shadow-2xl | Cards, hero images |

```css
/* Implementation */
box-shadow: 0 1px 2px 0 rgb(9 9 11 / 0.05); /* shadow-sm */
box-shadow: 0 0 1px 0 rgb(9 9 11 / 0.05); /* shadow-xs */
```

## Border Colors

| Token | CSS/Tailwind | Usage |
|-------|--------------|-------|
| border-zinc-100 | border-zinc-100 | Subtle borders |
| border-zinc-200 | border-zinc-200 | Form inputs, cards |
| border-zinc-300 | border-zinc-300 | Section dividers |
| border-zinc-400 | border-zinc-400 | Focus states |

```html
<!-- Input Border -->
<input class="border border-zinc-200 focus:border-zinc-400" />

<!-- Card Border -->
<div class="border border-zinc-100" />

<!-- Divider -->
<hr class="border-t border-zinc-300" />
```

## Supporting Color Palettes

While zinc is the primary palette, the following colors are available for specific use cases:

### Blue Scale

| Token | OKLCH Value | CSS/Tailwind | Usage |
|-------|-------------|--------------|-------|
| blue-500 | oklch(0.623 0.214 259.815) | bg-blue-500, text-blue-500 | Primary actions, links |
| blue-600 | oklch(0.546 0.245 262.881) | bg-blue-600, text-blue-600 | Primary hover states |

### Red Scale (Error States)

| Token | OKLCH Value | CSS/Tailwind | Usage |
|-------|-------------|--------------|-------|
| red-500 | oklch(0.637 0.237 25.331) | bg-red-500, text-red-500 | Error messages, destructive actions |
| red-600 | oklch(0.577 0.245 27.325) | bg-red-600, text-red-600 | Error hover states |

### Green Scale (Success States)

| Token | OKLCH Value | CSS/Tailwind | Usage |
|-------|-------------|--------------|-------|
| green-500 | oklch(0.723 0.219 149.579) | bg-green-500, text-green-500 | Success messages, positive feedback |
| green-600 | oklch(0.627 0.194 149.214) | bg-green-600, text-green-600 | Success hover states |

## Color Mapping for Components

### Buttons

```html
<!-- Primary Button -->
<button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
  Submit
</button>

<!-- Secondary Button -->
<button class="btn text-zinc-600 bg-white hover:text-zinc-900 shadow-sm">
  Cancel
</button>

<!-- Link Style Button -->
<a class="text-sm font-medium text-zinc-500 hover:text-zinc-900">
  Learn More
</a>
```

### Forms

```html
<!-- Input Field -->
<input class="form-input text-zinc-600 bg-white border-zinc-200 
  focus:border-zinc-400 placeholder-zinc-400" />

<!-- Label -->
<label class="text-sm text-zinc-800 font-medium">
  Email Address
</label>

<!-- Helper Text -->
<p class="text-sm text-zinc-500">
  We'll never share your email
</p>
```

### Cards

```html
<!-- Card Container -->
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm">
  <h3 class="text-zinc-900 font-semibold">Card Title</h3>
  <p class="text-zinc-500">Card description text</p>
</div>
```

## Accessibility Guidelines

### Contrast Ratios

- **Primary text (zinc-900 on white)**: 21:1 (AAA)
- **Secondary text (zinc-500 on white)**: 7.5:1 (AAA)
- **Buttons (zinc-100 on zinc-900)**: 15.5:1 (AAA)
- **Links (zinc-500 hover:zinc-900)**: 21:1 (AAA)

### Dark Mode Considerations

While this system is primarily light-mode focused, ensure adequate contrast when implementing dark mode:
- Use zinc-950 for dark backgrounds
- Use zinc-50 for light text on dark backgrounds
- Maintain 4.5:1 contrast ratio minimum

## Color Combinations to Avoid

- ❌ Zinc-400 text on zinc-100 backgrounds (low contrast)
- ❌ Zinc-600 text on zinc-300 backgrounds (insufficient contrast)
- ❌ Multiple zinc gradients in same component (visual noise)
- ❌ Zinc-900 borders on zinc-800 backgrounds (invisible)
- ❌ Mixing zinc with saturated colors (creates visual hierarchy confusion)

## Best Practices

### DO ✅

- Use zinc-500 for secondary text and descriptions
- Use zinc-900 for primary headings and emphasis
- Use zinc-50 for section backgrounds
- Use zinc-100 for card backgrounds
- Use zinc-200 for hover states
- Use opacity for shadows (zinc-950/20, zinc-950/10)
- Maintain consistent color relationships

### DON'T ❌

- Don't use zinc-400 or lighter for primary text
- Don't mix multiple color scales unnecessarily
- Don't use saturated colors as primary UI elements
- Don't create custom hex values outside the system
- Don't use zinc-900 backgrounds with zinc-800 text
- Don't use zinc colors without checking contrast ratios

## Implementation Notes

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        zinc: {
          50: 'oklch(0.984 0.003 247.858)',
          100: 'oklch(0.968 0.007 247.896)',
          200: 'oklch(0.929 0.013 255.508)',
          300: 'oklch(0.867 0.022 253.371)',
          400: 'oklch(0.775 0.027 255.571)',
          500: 'oklch(0.682 0.032 252.875)',
          600: 'oklch(0.606 0.032 252.875)',
          700: 'oklch(0.543 0.029 255.091)',
          800: 'oklch(0.477 0.024 253.371)',
          900: 'oklch(0.402 0.015 253.371)',
          950: 'oklch(0.255 0.006 253.371)',
        },
      },
    },
  },
};
```

### CSS Variables

```css
:root {
  --color-zinc-50: oklch(0.984 0.003 247.858);
  --color-zinc-100: oklch(0.968 0.007 247.896);
  --color-zinc-200: oklch(0.929 0.013 255.508);
  --color-zinc-300: oklch(0.867 0.022 253.371);
  --color-zinc-400: oklch(0.775 0.027 255.571);
  --color-zinc-500: oklch(0.682 0.032 252.875);
  --color-zinc-600: oklch(0.606 0.032 252.875);
  --color-zinc-700: oklch(0.543 0.029 255.091);
  --color-zinc-800: oklch(0.477 0.024 253.371);
  --color-zinc-900: oklch(0.402 0.015 253.371);
  --color-zinc-950: oklch(0.255 0.006 253.371);
}
```

---

**Note**: Always reference this color documentation when generating components. Use the exact hex/OKLCH values and class names specified. Never create custom color values or deviate from the defined palette.