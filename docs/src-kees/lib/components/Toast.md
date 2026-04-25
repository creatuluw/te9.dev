# Toast Component

A toast notification system for displaying temporary messages to users. Uses a global store for managing toasts across the application.

## Components

- `ToastContainer` - Container component that should be added to your layout
- `toastStore` - Store for managing toast notifications

## Toast Store Usage

### Import the store
```typescript
import { toastStore } from '$lib/stores/toastStore';
```

### Adding Toasts

```typescript
// Basic usage
toastStore.add('This is a success message', 'success');

// With custom duration (in milliseconds, 0 = no auto-dismiss)
toastStore.add('This message will stay forever', 'info', 0);

// Different variants
toastStore.add('Success!', 'success');
toastStore.add('Error occurred', 'error');
toastStore.add('Warning message', 'warning');
toastStore.add('Information', 'info');
```

### Removing Toasts

```typescript
// Remove a specific toast by ID
toastStore.remove(toastId);

// Clear all toasts
toastStore.clear();
```

## ToastContainer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left' \| 'top-center' \| 'bottom-center'` | `'top-right'` | Position of toast container |

## Variants

- `success` - Green toast for success messages
- `error` - Red toast for error messages
- `warning` - Amber toast for warning messages
- `info` - Default white toast for informational messages

## Setup

### 1. Add ToastContainer to your layout

Add the `ToastContainer` component to your root layout (`src/routes/+layout.svelte`):

```svelte
<script>
  import { ToastContainer } from '$lib/components';
</script>

<ToastContainer position="top-right" />
```

### 2. Use toastStore in your components

```svelte
<script>
  import { toastStore } from '$lib/stores/toastStore';
  
  function handleSuccess() {
    toastStore.add('Operation completed successfully!', 'success');
  }
</script>
```

## Examples

### Success Toast
```typescript
toastStore.add('File uploaded successfully!', 'success');
```

### Error Toast with Custom Duration
```typescript
toastStore.add('Failed to save changes', 'error', 10000); // 10 seconds
```

### Persistent Info Toast
```typescript
toastStore.add('Processing...', 'info', 0); // No auto-dismiss
```

### Different Positions
```svelte
<ToastContainer position="bottom-right" />
<ToastContainer position="top-center" />
```

## Toast Interface

```typescript
interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // milliseconds, 0 = no auto-dismiss
}
```

