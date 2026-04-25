# Drawer Component

A slide-out drawer component that can appear from any side of the screen, with backdrop overlay and keyboard navigation.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the drawer is open (bindable) |
| `position` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | Position of the drawer |
| `class` | `string` | `''` | Additional CSS classes for the drawer content |
| `onclose` | `() => void` | `undefined` | Callback when drawer closes |

## Examples

### Basic Usage
```svelte
<script>
  import { Drawer } from '$lib/components';
  
  let isOpen = $state(false);
</script>

<button onclick={() => isOpen = true}>Open Drawer</button>

<Drawer bind:open={isOpen} position="right">
  <h2 class="text-lg font-semibold mb-4">Drawer Title</h2>
  <p>Drawer content goes here</p>
</Drawer>
```

### Different Positions
```svelte
<!-- Right drawer (default) -->
<Drawer bind:open={isOpen} position="right">
  Content
</Drawer>

<!-- Left drawer -->
<Drawer bind:open={isOpen} position="left">
  Content
</Drawer>

<!-- Top drawer -->
<Drawer bind:open={isOpen} position="top">
  Content
</Drawer>

<!-- Bottom drawer -->
<Drawer bind:open={isOpen} position="bottom">
  Content
</Drawer>
```

### With Close Handler
```svelte
<script>
  function handleClose() {
    console.log('Drawer closed');
  }
</script>

<Drawer bind:open={isOpen} onclose={handleClose}>
  Content
</Drawer>
```

### Controlled Drawer
```svelte
<script>
  let drawerOpen = $state(false);
</script>

<button onclick={() => drawerOpen = true}>Open</button>
<button onclick={() => drawerOpen = false}>Close</button>

<Drawer bind:open={drawerOpen}>
  <button onclick={() => drawerOpen = false}>Close Drawer</button>
</Drawer>
```

## URL Parameter Pattern

Many drawers in this codebase use URL parameters to manage their state. This pattern provides:

- **Shareable URLs** - Users can bookmark or share URLs with drawers open
- **Browser history** - Back/forward buttons work naturally
- **Deep linking** - Direct navigation to specific drawer states

### Implementation Pattern

```svelte
<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Drawer } from '$lib/components';
  
  // Derive state from URL params
  const drawerParam = $derived($page.url.searchParams.get('drawer'));
  const itemIdParam = $derived($page.url.searchParams.get('itemId'));
  
  const isOpen = $derived(drawerParam === 'mydrawer');
  const itemId = $derived(itemIdParam ? Number(itemIdParam) : null);
  
  // Open drawer by updating URL
  function openDrawer(id: number) {
    const url = new URL($page.url);
    url.searchParams.set('drawer', 'mydrawer');
    url.searchParams.set('itemId', id.toString());
    goto(url.pathname + url.search, { noScroll: true });
  }
  
  // Close drawer by removing URL params
  function handleClose() {
    const url = new URL($page.url);
    url.searchParams.delete('drawer');
    url.searchParams.delete('itemId');
    goto(url.pathname + url.search, { noScroll: true });
  }
</script>

<button onclick={() => openDrawer(123)}>Open Drawer</button>

<Drawer bind:open={isOpen} onclose={handleClose}>
  {#if itemId}
    <p>Viewing item {itemId}</p>
  {/if}
</Drawer>
```

### Example: WorkItemDetailsDrawer

The `WorkItemDetailsDrawer` component uses this pattern:

- **URL param:** `drawer=workitem`
- **ID param:** `workItemId=<number>`
- **Example URL:** `/help?tab=bekijken&token=...&drawer=workitem&workItemId=123`

### Benefits

1. **State persistence** - Refresh page maintains drawer state
2. **Navigation** - Browser back button closes drawer naturally
3. **Sharing** - Users can share URLs with specific drawers open
4. **SEO-friendly** - Drawer state is in URL (if needed)

### Hybrid Approach

Components can support both URL params and prop-based state:

```svelte
// Use URL params if available, otherwise use props
const isOpen = $derived.by(() => {
  const url = $page.url;
  const param = url.searchParams.get('drawer');
  return param === 'mydrawer' || propIsOpen;
});

function handleClose() {
  if (drawerParam === 'mydrawer') {
    // Remove URL params
    const url = new URL($page.url);
    url.searchParams.delete('drawer');
    goto(url.pathname + url.search, { noScroll: true });
  } else {
    // Use prop-based state
    propIsOpen = false;
  }
}
```

## Features

- **Backdrop overlay** - Click outside to close
- **Keyboard support** - ESC key closes the drawer
- **Smooth animations** - CSS transitions for slide-in/out
- **Responsive** - Adjusts width/height based on position
- **Scrollable content** - Overflow handling for long content
- **URL state management** - Optional URL parameter pattern for state persistence

## Styling

- Backdrop: `bg-zinc-900/50` with opacity transition
- Drawer: White background with shadow
- Width: `w-80` for left/right, `w-full` for top/bottom
- Height: `h-full` for left/right, `h-80` for top/bottom

