# Skeleton Component

A flexible loading skeleton component that can adapt to any content type. Use skeleton placeholders to show loading states that mimic the structure of the content being loaded.

## Overview

The Skeleton component provides three types of loading placeholders:
- **Text**: Rounded lines for text content
- **Box**: Rectangular shapes for images, cards, or other rectangular content
- **Circle**: Circular shapes for avatars or icons

Multiple skeleton elements can be composed together to create complex loading states that match your content layout.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'text' \| 'box' \| 'circle'` | `'text'` | Type of skeleton element |
| `width` | `string` | `'w-full'` | Width (Tailwind class or custom) |
| `height` | `string` | Type-dependent | Height (Tailwind class or custom) |
| `animated` | `boolean` | `true` | Enable pulse animation |
| `class` | `string` | `''` | Additional CSS classes |

### Default Dimensions by Type

- **Text**: `h-2.5` (10px) height, `w-full` width
- **Box**: `h-48` (192px) height, `w-full` width
- **Circle**: `w-12 h-12` (48px × 48px)

## Examples

### Basic Text Skeleton

Simple text line placeholder:

```svelte
<Skeleton />
```

### Multiple Text Lines

Compose multiple skeletons to create paragraph-like loading states:

```svelte
<div class="space-y-2">
  <Skeleton width="w-48" />
  <Skeleton />
  <Skeleton />
  <Skeleton width="w-5/6" />
</div>
```

### Image Placeholder

Box skeleton for image loading:

```svelte
<Skeleton type="box" width="w-full" height="h-64" />
```

### Avatar Skeleton

Circle skeleton for user avatars:

```svelte
<Skeleton type="circle" width="w-16" />
```

### Card Skeleton

Complex loading state for a card component:

```svelte
<div class="border border-zinc-200 rounded-lg p-6 space-y-4">
  <!-- Title -->
  <Skeleton width="w-3/4" height="h-4" />
  
  <!-- Image -->
  <Skeleton type="box" width="w-full" height="h-48" />
  
  <!-- Content lines -->
  <div class="space-y-2">
    <Skeleton />
    <Skeleton />
    <Skeleton width="w-5/6" />
  </div>
  
  <!-- Footer with avatar and button -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <Skeleton type="circle" width="w-10" />
      <Skeleton width="w-24" />
    </div>
    <Skeleton width="w-20" height="h-8" />
  </div>
</div>
```

### List Item Skeleton

Loading state for a list of items:

```svelte
<div class="space-y-4">
  {#each Array(5) as _}
    <div class="flex items-center gap-4">
      <Skeleton type="circle" width="w-12" />
      <div class="flex-1 space-y-2">
        <Skeleton width="w-32" />
        <Skeleton width="w-24" height="h-2" />
      </div>
      <Skeleton width="w-16" height="h-4" />
    </div>
  {/each}
</div>
```

### Image with Text Layout

Side-by-side image and text skeleton:

```svelte
<div class="flex gap-8 items-start">
  <Skeleton type="box" width="w-48" height="h-48" />
  <div class="flex-1 space-y-4">
    <Skeleton width="w-3/4" height="h-6" />
    <div class="space-y-2">
      <Skeleton />
      <Skeleton />
      <Skeleton width="w-5/6" />
    </div>
  </div>
</div>
```

### Without Animation

Static skeleton (useful for screenshots or when animation is distracting):

```svelte
<Skeleton animated={false} />
```

### Custom Sizes

Use custom Tailwind classes for precise sizing:

```svelte
<!-- Small text -->
<Skeleton width="w-24" height="h-2" />

<!-- Large box -->
<Skeleton type="box" width="w-96" height="h-72" />

<!-- Large avatar -->
<Skeleton type="circle" width="w-20" />
```

## Common Patterns

### Article/Post Skeleton

```svelte
<article class="space-y-4">
  <Skeleton width="w-3/4" height="h-8" />
  <Skeleton type="box" width="w-full" height="h-64" />
  <div class="space-y-2">
    <Skeleton />
    <Skeleton />
    <Skeleton />
    <Skeleton width="w-4/5" />
  </div>
</article>
```

### Dashboard Card Skeleton

```svelte
<div class="border border-zinc-200 rounded-lg p-6 space-y-4">
  <div class="flex items-center justify-between">
    <Skeleton width="w-32" height="h-4" />
    <Skeleton type="circle" width="w-8" />
  </div>
  <Skeleton width="w-24" height="h-8" />
  <Skeleton width="w-40" height="h-3" />
</div>
```

### Table Row Skeleton

```svelte
<div class="space-y-3">
  {#each Array(3) as _}
    <div class="flex gap-4">
      <Skeleton width="w-12" height="h-4" />
      <Skeleton width="w-32" height="h-4" />
      <Skeleton width="w-24" height="h-4" />
      <Skeleton width="w-20" height="h-4" class="ml-auto" />
    </div>
  {/each}
</div>
```

## Styling

The skeleton uses:
- **Background**: `bg-zinc-200` (light) / `bg-zinc-700` (dark)
- **Animation**: Tailwind's `animate-pulse` utility
- **Border radius**: `rounded-full` for text/circle, `rounded-sm` for box

You can customize colors using the `class` prop:

```svelte
<Skeleton class="bg-blue-200 dark:bg-blue-700" />
```

## Accessibility

The skeleton includes:
- `role="status"` for screen readers
- `aria-label="Loading"` to announce loading state
- `.sr-only` text "Loading..." for screen reader users

## Best Practices

1. **Match Content Structure**: Design skeleton layouts that mirror your actual content
2. **Vary Widths**: Use different widths for text lines to create a more natural look
3. **Combine Types**: Mix text, box, and circle types to match complex layouts
4. **Use Appropriate Sizes**: Match skeleton sizes to the content being loaded
5. **Consider Spacing**: Use consistent spacing between skeleton elements

## Animation

By default, skeletons use Tailwind's `animate-pulse` which creates a smooth pulsing effect. This can be disabled by setting `animated={false}` if needed for performance or visual reasons.


























