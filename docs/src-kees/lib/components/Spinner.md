# Spinner Component

A clean, animated circular spinner component for loading states. Uses SVG animation for smooth performance across all devices.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Size of the spinner |
| `variant` | `'default' \| 'primary' \| 'muted'` | `'default'` | Color variant of the spinner |
| `class` | `string` | `''` | Additional CSS classes |

## Sizes

The spinner comes in 5 sizes:
- **xs**: 16px (w-4 h-4)
- **sm**: 24px (w-6 h-6)
- **md**: 32px (w-8 h-8)
- **lg**: 40px (w-10 h-10)
- **xl**: 48px (w-12 h-12)

## Variants

### Default
Gray spinner with dark accent - suitable for most use cases:
```svelte
<Spinner variant="default" />
```

### Primary
Blue spinner with darker blue accent - for primary actions:
```svelte
<Spinner variant="primary" />
```

### Muted
Light gray spinner with medium gray accent - for subtle loading states:
```svelte
<Spinner variant="muted" />
```

## Examples

### Basic Usage
```svelte
<Spinner />
```

### Different Sizes
```svelte
<div class="flex items-center gap-4">
  <Spinner size="xs" />
  <Spinner size="sm" />
  <Spinner size="md" />
  <Spinner size="lg" />
  <Spinner size="xl" />
</div>
```

### In Buttons
```svelte
<Button disabled>
  <Spinner size="sm" />
</Button>
```

### Centered in Container
```svelte
<div class="flex items-center justify-center py-8">
  <Spinner size="lg" />
</div>
```

### With Custom Classes
```svelte
<Spinner class="mx-auto" size="lg" variant="primary" />
```

## Accessibility

The spinner includes:
- `role="status"` for screen readers
- `aria-label="Loading"` to indicate loading state

## Use Cases

- **Button loading states**: Use `size="sm"` inside disabled buttons
- **Page loading**: Use `size="lg"` or `size="xl"` centered on the page
- **Inline loading**: Use `size="xs"` or `size="sm"` inline with content
- **Card/section loading**: Use `size="md"` centered in the container

## Performance

The spinner uses CSS `animate-spin` utility from Tailwind, which uses CSS transforms for optimal performance. No JavaScript animation is involved.

