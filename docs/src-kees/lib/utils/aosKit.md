# AOS (Animate On Scroll) Integration - Usage Guide

Element-level scroll-triggered animations similar to the tidy-html template. This uses the AOS library to animate elements as they scroll into view.

## Features

- **Scroll-triggered animations**: Elements animate when they come into view
- **Multiple animation types**: fade, zoom, slide, flip animations
- **Configurable delays**: Stagger animations for visual effects
- **Performance optimized**: Disabled on mobile by default
- **SvelteKit integration**: Works seamlessly with SvelteKit navigation

## Setup

AOS is automatically initialized in `src/routes/+layout.svelte`. No additional setup required for basic usage.

## Usage Examples

### 1. Using the AnimateOnScroll Component

The easiest way to use AOS animations:

```svelte
<script>
  import AnimateOnScroll from '$lib/components/AnimateOnScroll.svelte';
</script>

<AnimateOnScroll animation="fade-up">
  <div>This content will fade up when scrolled into view</div>
</AnimateOnScroll>

<AnimateOnScroll animation="fade-left" delay={100}>
  <div>This will fade from the left with a 100ms delay</div>
</AnimateOnScroll>
```

### 2. Using data-aos Attributes (HTML-like)

You can also use AOS directly with `data-aos` attributes:

```svelte
<div data-aos="fade-up">
  <h2>Animated heading</h2>
</div>

<div data-aos="fade-left" data-aos-delay="100">
  <p>Paragraph with delay</p>
</div>

<div data-aos="zoom-in" data-aos-duration="600">
  <img src="image.jpg" alt="Zooming image" />
</div>
```

### 3. Synchronized Animations (Anchor-based)

Group animations together with an anchor:

```svelte
<!-- Container with anchor -->
<div data-aos-id="features">
  <!-- All children animate relative to this container -->
</div>

<!-- Feature items -->
<div data-aos="fade-up" data-aos-anchor="[data-aos-id-features]">
  Feature 1
</div>

<div 
  data-aos="fade-up" 
  data-aos-anchor="[data-aos-id-features]"
  data-aos-delay="100"
>
  Feature 2
</div>
```

### 4. Using in Lists

Animate list items with staggered delays:

```svelte
{#each items as item, index}
  <div 
    data-aos="fade-up"
    data-aos-delay={index * 100}
  >
    {item.name}
  </div>
{/each}
```

## Available Animation Types

### Fade Animations
- `fade` - Simple fade in
- `fade-up` - Fade in from bottom
- `fade-down` - Fade in from top
- `fade-left` - Fade in from right
- `fade-right` - Fade in from left
- `fade-up-right` - Fade in from bottom-right
- `fade-up-left` - Fade in from bottom-left
- `fade-down-right` - Fade in from top-right
- `fade-down-left` - Fade in from top-left

### Zoom Animations
- `zoom-in` - Zoom in from center
- `zoom-in-up` - Zoom in from bottom
- `zoom-in-down` - Zoom in from top
- `zoom-in-left` - Zoom in from right
- `zoom-in-right` - Zoom in from left
- `zoom-out` - Zoom out
- `zoom-out-up` - Zoom out to top
- `zoom-out-down` - Zoom out to bottom
- `zoom-out-right` - Zoom out to right
- `zoom-out-left` - Zoom out to left

### Slide Animations
- `slide-up` - Slide up into view
- `slide-down` - Slide down into view
- `slide-left` - Slide from right
- `slide-right` - Slide from left

### Flip Animations
- `flip-left` - Flip horizontally from left
- `flip-right` - Flip horizontally from right
- `flip-up` - Flip vertically from bottom
- `flip-down` - Flip vertically from top

## Configuration

Current configuration in `+layout.svelte`:

```typescript
await initAOS({
  once: true,              // Animate only once (don't re-animate on scroll up)
  disable: 'phone',        // Disable on mobile for better performance
  duration: 500,           // Default animation duration (ms)
  easing: 'ease-out-cubic', // Easing function
  offset: 120              // Offset from trigger point (px)
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `once` | `boolean` | `true` | Whether animation happens only once |
| `disable` | `string \| false` | `'phone'` | Disable on specific devices (`'phone'`, `'tablet'`, `'mobile'`, or `false`) |
| `duration` | `number` | `500` | Default animation duration in milliseconds |
| `easing` | `string` | `'ease-out-cubic'` | CSS easing function |
| `offset` | `number` | `120` | Offset from original trigger point (px) |
| `delay` | `number` | `0` | Default delay in milliseconds |

## Best Practices

1. **Use sparingly**: Don't animate every element - focus on key content
2. **Stagger delays**: Use delays to create cascading effects in lists/grids
3. **Performance**: Animations are disabled on mobile by default
4. **Once only**: Set `once: true` to prevent re-animations on scroll
5. **Test scroll position**: Adjust `offset` if animations trigger too early/late

## Advanced Usage

### Refresh After Dynamic Content

If you add content dynamically (e.g., after data loads), refresh AOS:

```svelte
<script>
  import { refreshAOS } from '$lib/utils/aosKit';
  
  async function loadData() {
    // Load your data
    await fetchData();
    
    // Refresh AOS to detect new elements
    await refreshAOS();
  }
</script>
```

### Manual Control

```typescript
import { initAOS, refreshAOS, refreshHardAOS } from '$lib/utils/aosKit';

// Initialize with custom config
await initAOS({
  once: false, // Allow re-animation
  duration: 800,
  easing: 'ease-in-out'
});

// Refresh after DOM changes
await refreshAOS();

// Hard refresh for major DOM changes
await refreshHardAOS();
```

## Integration with Navigation

AOS automatically refreshes after navigation to detect new elements on the page. This happens automatically in `+layout.svelte`.

## Browser Support

AOS works in all modern browsers. Animations gracefully degrade if JavaScript is disabled.

## Accessibility

- Animations respect `prefers-reduced-motion` when configured
- Consider disabling animations for users who prefer reduced motion
- Animations don't block content - they enhance visibility

## Related Files

- `src/lib/utils/aosKit.ts` - AOS initialization utilities
- `src/lib/components/AnimateOnScroll.svelte` - Reusable component wrapper
- `src/routes/+layout.svelte` - Integration point

---

**References:**
- [AOS Documentation](https://michalsnik.github.io/aos/)
- [tidy-html Template](https://cruip.com/)

