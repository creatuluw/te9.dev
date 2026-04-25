# Modal Component

A modal dialog component with backdrop overlay, keyboard navigation, and customizable sizes.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the modal is open (bindable) |
| `title` | `string` | `undefined` | Optional modal title |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Modal size |
| `closeOnBackdropClick` | `boolean` | `true` | Whether clicking backdrop closes modal |
| `class` | `string` | `''` | Additional CSS classes for modal content |
| `onclose` | `() => void` | `undefined` | Callback when modal closes |
| `loading` | `boolean` | `false` | Shows loading spinner overlay after 2 seconds |

## Examples

### Basic Usage
```svelte
<script>
  import { Modal } from '$lib/components';
  
  let isOpen = $state(false);
</script>

<button onclick={() => isOpen = true}>Open Modal</button>

<Modal bind:open={isOpen} title="Modal Title">
  <p>Modal content goes here</p>
</Modal>
```

### Without Title
```svelte
<Modal bind:open={isOpen}>
  <p>Modal content without title</p>
</Modal>
```

### Different Sizes
```svelte
<!-- Small modal -->
<Modal bind:open={isOpen} size="sm" title="Small Modal">
  Content
</Modal>

<!-- Medium modal (default) -->
<Modal bind:open={isOpen} size="md" title="Medium Modal">
  Content
</Modal>

<!-- Large modal -->
<Modal bind:open={isOpen} size="lg" title="Large Modal">
  Content
</Modal>
```

### Prevent Backdrop Close
```svelte
<Modal 
  bind:open={isOpen} 
  title="Important" 
  closeOnBackdropClick={false}
>
  <p>This modal cannot be closed by clicking outside</p>
  <button onclick={() => isOpen = false}>Close Manually</button>
</Modal>
```

### With Close Handler
```svelte
<script>
  function handleClose() {
    console.log('Modal closed');
  }
</script>

<Modal bind:open={isOpen} title="Title" onclose={handleClose}>
  Content
</Modal>
```

### With Actions
```svelte
<Modal bind:open={isOpen} title="Confirm Action">
  <p>Are you sure you want to proceed?</p>
  <div class="flex justify-end gap-2 mt-4">
    <button onclick={() => isOpen = false} class="btn btn-sm">Cancel</button>
    <button onclick={() => isOpen = false} class="btn btn-sm bg-zinc-900 text-zinc-100">
      Confirm
    </button>
  </div>
</Modal>
```

### With Loading State
```svelte
<script>
  let isDeleting = $state(false);
  
  async function handleDelete() {
    isDeleting = true;
    await deleteItem();
    isDeleting = false;
    isOpen = false;
  }
</script>

<Modal bind:open={isOpen} title="Delete Item" loading={isDeleting}>
  <p>Are you sure you want to delete this item?</p>
  <div class="flex justify-end gap-2 mt-4">
    <button onclick={() => isOpen = false} disabled={isDeleting}>Cancel</button>
    <button onclick={handleDelete} disabled={isDeleting}>
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  </div>
</Modal>
```

> **Note:** The loading spinner overlay appears automatically after 2 seconds when `loading={true}` to provide visual feedback for long-running operations.

## Features

- **Backdrop overlay** - Click outside to close (configurable)
- **Keyboard support** - ESC key closes the modal
- **Body scroll lock** - Prevents background scrolling when open
- **Accessibility** - ARIA attributes and focus management
- **Smooth animations** - CSS transitions for open/close
- **Loading state** - Automatic spinner overlay for operations taking >2 seconds

## Sizes

- `sm` - `max-w-sm` (384px)
- `md` - `max-w-md` (448px) - Default
- `lg` - `max-w-lg` (512px)

## Styling

- Backdrop: `bg-zinc-900/50` with opacity transition
- Modal: White background with rounded corners and shadow
- Header: Border bottom with title and close button
- Content: Padding for body content

