<button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
  Primary Action
</button>
```

**Classes:**
- Base: `btn`
- Text: `text-zinc-100`
- Background: `bg-zinc-900`
- Hover: `hover:bg-zinc-800`
- Shadow: `shadow-sm`

### Secondary Button

A secondary button for less prominent or alternative actions.

```html
<button class="btn text-zinc-600 bg-white hover:text-zinc-900 shadow-sm">
  Secondary Action
</button>
```

**Classes:**
- Base: `btn`
- Text: `text-zinc-600`
- Background: `bg-white`
- Hover: `hover:text-zinc-900`
- Shadow: `shadow-sm`

### Tertiary Button (Link Style)

A text-only button that looks like a link but behaves like a button.

```html
<a class="text-sm font-medium text-zinc-500 hover:text-zinc-900 px-3 lg:px-5 py-2 flex items-center transition">
  Learn More
</a>
```

**Classes:**
- Text: `text-sm font-medium text-zinc-500`
- Hover: `hover:text-zinc-900`
- Padding: `px-3 lg:px-5 py-2`
- Flex: `flex items-center`
- Transition: `transition`

## Sizes

### Regular Size (Default)

Standard button size for most use cases.

```html
<button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
  Regular Button
</button>
```

**Dimensions:**
- Padding: `px-4 py-2` (1rem horizontal, 0.5rem vertical)
- Font size: `text-sm` (0.875rem)

### Small Size

Compact button for dense interfaces or secondary actions.

```html
<button class="btn-sm text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
  Small Button
</button>
```

**Dimensions:**
- Padding: `px-2 py-1` (0.5rem horizontal, 0.25rem vertical)
- Font size: `text-sm` (0.875rem)

## States

### Default State

```html
<button class="btn text-zinc-100 bg-zinc-900 shadow-sm">
  Default
</button>
```

### Hover State

Buttons darken on hover to indicate interactivity.

```html
<!-- Primary Button Hover -->
<button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
  Hover me
</button>

<!-- Secondary Button Hover -->
<button class="btn text-zinc-600 bg-white hover:text-zinc-900 shadow-sm">
  Hover me
</button>
```

### Focus State

Focus states provide visual feedback for keyboard navigation.

```html
<button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2">
  Focus me
</button>
```

### Disabled State

Buttons should be visually distinct when disabled.

```html
<button class="btn text-zinc-400 bg-zinc-100 shadow-sm cursor-not-allowed" disabled>
  Disabled
</button>
```

**Classes:**
- Text: `text-zinc-400`
- Background: `bg-zinc-100`
- Cursor: `cursor-not-allowed`
- Attribute: `disabled`

## Full Width

Buttons can span the full width of their container.

```html
<button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm">
  Full Width Button
</button>
```

**Additional Class:** `w-full`

## With Icons

Buttons can include icons for enhanced meaning.

```html
<button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
  <svg class="w-4 h-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
  Send
</button>
```

**Icon Classes:**
- Size: `w-4 h-4`
- Margin: `mr-2` (space between icon and text)

## Social Login Button

Special variant for social authentication.

```html
<button class="btn text-zinc-600 bg-white hover:text-zinc-900 w-full shadow-sm group relative flex after:flex-1">
  <div class="flex-1 flex items-center">
    <svg class="w-4 h-4 fill-zinc-400 group-hover:fill-rose-500 shrink-0 transition" viewBox="0 0 16 16">
      <path d="M15.679 6.545H8.043v3.273h4.328c-.692 2.182-2.401 2.91-4.363 2.91a4.727 4.727 0 1 1 3.035-8.347l2.378-2.265A8 8 0 1 0 8.008 16c4.41 0 8.4-2.909 7.67-9.455Z" />
    </svg>
  </div>
  <span class="flex-auto pl-3">Continue With Google</span>
</button>
```

**Classes:**
- Base: `btn text-zinc-600 bg-white hover:text-zinc-900 w-full shadow-sm`
- Group: `group relative flex after:flex-1`
- Icon container: `flex-1 flex items-center`
- Icon: `w-4 h-4 fill-zinc-400 group-hover:fill-rose-500 shrink-0 transition`
- Text: `flex-auto pl-3`

## Base Classes

### `.btn` (Regular Size)

```css
.btn {
  @apply text-sm font-medium inline-flex items-center justify-center border border-transparent rounded-md tracking-normal transition px-4 py-2;
}
```

**Breakdown:**
- `text-sm`: 0.875rem font size
- `font-medium`: 500 weight
- `inline-flex`: Inline-level flex container
- `items-center`: Vertically centered
- `justify-center`: Horizontally centered
- `border border-transparent`: Transparent border
- `rounded-md`: 0.375rem border radius
- `tracking-normal`: Normal letter spacing
- `transition`: Smooth transitions
- `px-4`: 1rem horizontal padding
- `py-2`: 0.5rem vertical padding

### `.btn-sm` (Small Size)

```css
.btn-sm {
  @apply text-sm font-medium inline-flex items-center justify-center border border-transparent rounded-md tracking-normal transition px-2 py-1;
}
```

**Breakdown:**
- Same as `.btn` except:
- `px-2`: 0.5rem horizontal padding
- `py-1`: 0.25rem vertical padding

## Props Table

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'primary' \| 'secondary' \| 'tertiary'` | `'primary'` | Button visual style |
| size | `'regular' \| 'small'` | `'regular'` | Button size |
| disabled | `boolean` | `false` | Disable button interaction |
| fullWidth | `boolean` | `false` | Span full container width |
| type | `'button' \| 'submit' \| 'reset'` | `'button'` | Button type attribute |
| href | `string` | `undefined` | Link URL (renders as anchor) |

## Usage Guidelines

### DO ✅

- Use primary buttons for the main action on a page
- Use secondary buttons for alternative or less important actions
- Provide clear, descriptive button text
- Use consistent button ordering (primary first)
- Include adequate spacing between button groups
- Use full-width buttons on mobile for easier tapping
- Include icons to reinforce button meaning when appropriate
- Ensure touch targets are at least 44×44px

### DON'T ❌

- Don't use multiple primary buttons in the same context
- Don't use vague button text like "Click Here" or "Submit"
- Don't make buttons look like links or vice versa
- Don't disable buttons without explanation
- Don't use buttons for navigation (use links instead)
- Don't nest buttons inside other buttons
- Don't create custom button sizes outside the defined variants
- Don't use buttons for decorative purposes

## Button Groups

### Horizontal Button Group

```html
<div class="space-x-4">
  <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
    Primary
  </button>
  <button class="btn text-zinc-600 bg-white hover:text-zinc-900 shadow-sm">
    Secondary
  </button>
</div>
```

**Container Classes:** `space-x-4`

### Responsive Button Group

```html
<div class="space-y-4 sm:space-y-0 sm:space-x-4">
  <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full sm:w-auto shadow-sm">
    Primary
  </button>
  <button class="btn text-zinc-600 bg-white hover:text-zinc-900 w-full sm:w-auto shadow-sm">
    Secondary
  </button>
</div>
```

**Classes:**
- Mobile: `space-y-4 w-full`
- Desktop: `sm:space-y-0 sm:space-x-4 sm:w-auto`

## Examples

### Form Submit Button

```html
<form>
  <div class="space-y-4">
    <!-- Form fields -->
  </div>
  <div class="mt-5">
    <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm">
      Sign Up
    </button>
  </div>
</form>
```

### Header Navigation Buttons

```html
<header>
  <div class="px-4 sm:px-6">
    <div class="flex items-center justify-between">
      <!-- Logo -->
      <a class="bg-white w-8 h-8 rounded-sm shadow-xs shadow-zinc-950/20">
        <img src="logo.png" alt="Logo" />
      </a>
      
      <!-- Nav Buttons -->
      <nav>
        <ul class="flex items-center space-x-4">
          <li>
            <a class="text-sm font-medium text-zinc-500 hover:text-zinc-900 px-3 lg:px-5 py-2 flex items-center transition">
              Log in
            </a>
          </li>
          <li>
            <a class="btn-sm text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
              Request Demo
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</header>
```

### Hero Section Buttons

```html
<section>
  <div class="text-center pb-12 md:pb-16">
    <h1 class="font-inter-tight text-4xl md:text-5xl font-bold text-zinc-900 mb-8">
      Welcome to Our Platform
    </h1>
    <div class="max-w-xs mx-auto sm:max-w-none sm:inline-flex sm:justify-center space-y-4 sm:space-y-0 sm:space-x-4">
      <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
        Get Started
      </button>
      <button class="btn text-zinc-600 bg-white hover:text-zinc-900 shadow-sm">
        Learn More
      </button>
    </div>
  </div>
</section>
```

## Accessibility

### Keyboard Navigation

Buttons should be keyboard accessible:

```html
<button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2">
  Accessible Button
</button>
```

**Focus Ring Classes:**
- `focus:outline-none`: Remove default outline
- `focus:ring-2`: Add ring with 2px width
- `focus:ring-zinc-400`: Ring color
- `focus:ring-offset-2`: 2px offset from button

### ARIA Attributes

Use appropriate ARIA attributes when needed:

```html
<!-- Loading state -->
<button 
  class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm" 
  aria-busy="true"
  aria-live="polite"
>
  <span aria-hidden="true">Loading...</span>
  <span class="sr-only">Please wait</span>
</button>

<!-- Button with icon -->
<button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm" aria-label="Send message">
  <svg aria-hidden="true" class="w-4 h-4">
    <path d="..." />
  </svg>
  Send
</button>
```

### Touch Targets

Ensure buttons meet minimum touch target size:

```html
<!-- Minimum 44×44px touch target -->
<button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm min-h-[44px] min-w-[44px]">
  Button
</button>
```

## Implementation Notes

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      extendTheme: {
        boxShadow: {
          'xs': '0 0 1px 0 rgb(9 9 11 / 0.05)',
          'sm': '0 1px 2px 0 rgb(9 9 11 / 0.05)',
        },
      },
    },
  },
};
```

### CSS Utility Classes

```css
/* Button base styles */
.btn,
.btn-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  letter-spacing: normal;
  transition: all 0.2s ease;
}

.btn {
  padding-inline: 1rem;
  padding-block: 0.5rem;
}

.btn-sm {
  padding-inline: 0.5rem;
  padding-block: 0.25rem;
}
```

## Variants Reference

| Variant | Classes | Use Case |
|---------|---------|----------|
| Primary | `text-zinc-100 bg-zinc-900 hover:bg-zinc-800` | Main action, primary CTA |
| Secondary | `text-zinc-600 bg-white hover:text-zinc-900` | Alternative action, secondary CTA |
| Tertiary | `text-zinc-500 hover:text-zinc-900` | Minor actions, navigation links |

| Size | Classes | Dimensions |
|------|---------|------------|
| Regular | `px-4 py-2` | 1rem × 0.5rem padding |
| Small | `px-2 py-1` | 0.5rem × 0.25rem padding |

## Migration Guide

### From Custom Buttons

When migrating custom buttons to this system:

1. Replace custom padding with `px-4 py-2` or `px-2 py-1`
2. Use `btn` or `btn-sm` base class
3. Apply color variants: `text-zinc-100 bg-zinc-900`
4. Add hover state: `hover:bg-zinc-800`
5. Add shadow: `shadow-sm`

### Example

```html
<!-- Before -->
<button style="padding: 12px 16px; background: #333; color: white; border-radius: 6px;">
  Click Me
</button>

<!-- After -->
<button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
  Click Me
</button>
```

---

**Note**: Always use the exact button classes specified in this documentation. Never create custom button styles or deviate from the defined variants and sizes.