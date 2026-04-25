# View Transitions Utility - Usage Guide

A reusable pattern for random page transitions using the Chrome View Transitions API. This utility integrates seamlessly with SvelteKit navigation and loading states.

## Features

- **Random Transition Selection**: Automatically selects from a pool of available transition types
- **SvelteKit Integration**: Works with SvelteKit's `onNavigate` hook
- **Loading State Support**: Can be used during loading operations, not just navigation
- **Browser Support Detection**: Gracefully falls back for browsers without View Transitions API support
- **Configurable**: Customize available transitions, exclude routes, or force specific types
- **Accessibility**: Respects `prefers-reduced-motion` for users who need it

## Available Transition Types

- `fade` - Simple fade in/out (300ms)
- `slide-left` - Slide from right to left (400ms)
- `slide-right` - Slide from left to right (400ms)
- `slide-up` - Slide from bottom to top (400ms)
- `slide-down` - Slide from top to bottom (400ms)
- `scale-up` - Scale up from smaller (350ms)
- `scale-down` - Scale down from larger (350ms)
- `blur` - Blur effect with fade (400ms)
- `flip-x` - Flip horizontally (500ms)
- `flip-y` - Flip vertically (500ms)
- `rotate` - Rotate with scale (600ms)

## Basic Setup

The view transitions are automatically enabled in `src/routes/+layout.svelte`. No additional setup is required for basic usage.

## Usage Examples

### 1. Using with Navigation (Automatic)

View transitions are automatically applied to all navigation by default:

```typescript
// Navigation automatically uses random transitions
import { goto } from '$app/navigation';

await goto('/cases/123'); // Random transition applied automatically
```

### 2. Custom Configuration

To customize the transitions, update the configuration in `+layout.svelte`:

```typescript
import { setupViewTransitions } from '$lib/utils/viewTransitionsKit';

onMount(() => {
  if (browser) {
    setupViewTransitions({
      // Only use these transition types
      availableTransitions: ['fade', 'slide-left', 'slide-right'],
      
      // Exclude certain routes
      excludedRoutes: ['/login', '/admin'],
      
      // Use context-based selection (route-aware)
      useContext: false,
      
      // Enable/disable transitions
      enabled: true
    });
  }
});
```

### 3. Using with Loading States

You can also use transitions during loading operations:

```typescript
import { createNavigationTransition } from '$lib/utils/viewTransitionsKit';

async function loadData() {
  await createNavigationTransition(async () => {
    // Your loading logic here
    await fetchData();
    updateUI();
  });
  
  // Or with a specific transition type:
  await createNavigationTransition(async () => {
    await fetchData();
  }, 'fade');
}
```

### 4. Force a Specific Transition

To force a specific transition for a navigation:

```typescript
import { createViewTransition, applyTransitionStyles } from '$lib/utils/viewTransitions';
import { goto } from '$app/navigation';

async function navigateWithTransition(path: string, transitionType: 'fade' | 'slide-left' = 'fade') {
  await createViewTransition(async () => {
    await goto(path);
  }, {
    type: transitionType,
    duration: 400,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  });
}
```

### 5. Manual Transition Control

For advanced use cases, you can manually control transitions:

```typescript
import {
  getRandomTransition,
  applyTransitionStyles,
  createViewTransition,
  clearTransitionStyles
} from '$lib/utils/viewTransitions';

// Get a random transition
const transition = getRandomTransition(['fade', 'slide-left', 'slide-right']);

// Apply it manually
applyTransitionStyles({
  type: transition,
  duration: 400
});

// Use it in a view transition
await createViewTransition(async () => {
  // Update DOM
  updateContent();
}, {
  type: transition
});

// Clean up
clearTransitionStyles();
```

## Configuration Options

### `setupViewTransitions(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `availableTransitions` | `TransitionType[]` | `['fade', 'slide-left', 'slide-right', 'slide-up', 'scale-up', 'blur']` | Transitions to randomly select from |
| `useContext` | `boolean` | `false` | Use context-based selection (route-aware) instead of random |
| `forcedType` | `string` | `undefined` | Force a specific transition type (disables random selection) |
| `enabled` | `boolean` | `true` | Enable/disable view transitions globally |
| `excludedRoutes` | `string[]` | `[]` | Route patterns to exclude from transitions |

## Browser Support

- **Chrome/Edge**: Full support (111+)
- **Safari**: Full support (18+)
- **Firefox**: Full support (126+)
- **Other browsers**: Gracefully falls back to no transition

The utility automatically detects browser support and only applies transitions when available.

## Accessibility

The CSS automatically respects `prefers-reduced-motion` by reducing animation duration to near-instant. Users who prefer reduced motion will see minimal or no transitions.

## Best Practices

1. **Keep transitions fast**: Default durations are optimized for perceived performance (300-600ms)

2. **Don't overuse**: Transitions work best on navigation, not on every DOM update

3. **Test with reduced motion**: Always test with `prefers-reduced-motion: reduce` enabled

4. **Exclude public pages**: Consider excluding login/register pages for faster perceived load times

5. **Use context wisely**: Context-based selection can make navigation feel more natural (e.g., slide right when going to detail pages)

## Troubleshooting

### Transitions not working?

1. Check browser support: `supportsViewTransitions()` returns `true`?
2. Check if transitions are enabled: `enabled: true` in config?
3. Check route exclusions: Is your route in `excludedRoutes`?
4. Check console for errors

### Transitions feel too fast/slow?

Adjust the duration in the transition configuration:

```typescript
// Custom duration
const config = {
  type: 'fade',
  duration: 500, // milliseconds
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
};
```

### Want to disable transitions?

```typescript
setupViewTransitions({
  enabled: false
});
```

Or remove the call to `setupViewTransitions()` entirely.

## Integration with Existing Loading System

The view transitions work seamlessly with the existing loading system in `navigationStore.svelte.ts`. The loading overlay will show during navigation, and the transition will play when the page content updates.

## Related Files

- `src/lib/utils/viewTransitions.ts` - Core transition utilities
- `src/lib/utils/viewTransitionsKit.ts` - SvelteKit integration
- `src/lib/styles/view-transitions.css` - CSS animations
- `src/routes/+layout.svelte` - Integration point

