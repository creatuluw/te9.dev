# Store Patterns and Standards

This document describes the standardized store patterns used in this application.

## Svelte 5 Migration Status

**⚠️ MIGRATION IN PROGRESS**: We are migrating from Svelte 4 store patterns to Svelte 5 `$state` runes.

### New Pattern (Svelte 5 - Recommended)

**Use `$state` runes in `.svelte.ts` files** - This is the modern, idiomatic Svelte 5 approach.

### Old Pattern (Svelte 4 - Deprecated)

**Use `createStore` factory** - This pattern is being phased out. New code should use the Svelte 5 pattern.

---

## Svelte 5 Pattern (Recommended)

### Overview

Svelte 5 introduces `$state` runes for reactive shared state. This replaces the need for stores in most cases. Shared state is defined in `.svelte.ts` files and components access it directly.

### Benefits

- ✅ More idiomatic Svelte 5 code
- ✅ Better performance (no subscription overhead)
- ✅ Direct reactive access (no `.subscribe()` needed)
- ✅ Automatic dependency tracking
- ✅ Simpler code

### Basic Pattern

```typescript
// toastStore.svelte.ts
export const toastState = $state({
  toasts: [] as Toast[]
});

export function addToast(message: string, variant: ToastVariant) {
  toastState.toasts = [...toastState.toasts, { 
    id: generateId(), 
    message, 
    variant 
  }];
}
```

### Component Usage

```svelte
<script>
  import { toastState, addToast } from '$lib/stores/toastStore.svelte';
  
  // Direct reactive access - no subscribe needed!
  const hasToasts = $derived(toastState.toasts.length > 0);
</script>

{#each toastState.toasts as toast}
  <div>{toast.message}</div>
{/each}
```

### State with Persistence

```typescript
// authStore.svelte.ts
import { loadFromStorage, saveToStorage } from './migration-utils';

const stored = loadFromStorage('auth_data', null);
export const authState = $state(stored);

// Sync to localStorage (call in component $effect or use $effect.pre)
$effect(() => {
  saveToStorage('auth_data', authState);
});
```

### Data Store with Polling

```typescript
// caseStore.svelte.ts
import { createPollManager } from './migration-utils';
import { persistentCache } from '$lib/utils/persistentCache';

export const caseState = $state({
  cases: [] as Case[],
  loading: false,
  syncing: false,
  lastFetch: null as number | null
});

const pollManager = createPollManager();

export async function refreshCases() {
  caseState.loading = true;
  // ... fetch logic
  caseState.loading = false;
}

export function startPolling(interval = 30000) {
  pollManager.start(() => refreshCases(), interval);
}

export function stopPolling() {
  pollManager.stop();
}
```

### Migration Utilities

See `migration-utils.ts` for helper functions:
- `loadFromStorage()` - Load initial state from localStorage
- `saveToStorage()` - Save state to localStorage
- `createPollManager()` - Manage polling intervals
- `createStoreWrapper()` - Backward compatibility during migration

### Best Practices

1. **Use `$state` for reactive state** - Not stores for shared state
2. **Use `$derived` for computed values** - Not `$effect` for state synchronization
3. **Use `$effect` only for side effects** - DOM manipulation, logging, localStorage sync
4. **Use `.svelte.ts` files for shared state** - Follows Svelte 5 convention
5. **Direct property access** - No `.getValue()` or `.subscribe()` needed

---

## Old Pattern (Deprecated - Svelte 4)

### Store Factory

All stores should use the `createStore` factory from `storeFactory.ts` for consistency. This provides:

- Middleware support for logging, validation, and side effects
- Optional persistence to localStorage
- Consistent API across all stores
- Type safety

**⚠️ Note**: This pattern is deprecated. New code should use the Svelte 5 pattern above.

## Standard Store Pattern

```typescript
import { createStore, createLoggingMiddleware } from './storeFactory';

interface StoreData {
  // Your store data shape
}

function createMyStore() {
  const store = createStore<StoreData>({
    initialValue: { /* initial state */ },
    name: 'myStore', // For logging/DevTools
    middleware: [
      createLoggingMiddleware('myStore'),
      // Add more middleware as needed
    ],
    persist: { // Optional
      key: 'my_store_data',
    },
  });

  return {
    ...store,
    // Add custom methods here
    customMethod: () => {
      // Custom logic
    },
  };
}

export const myStore = createMyStore();
```

## Middleware

### Logging Middleware

Automatically logs store changes in development:

```typescript
middleware: [
  createLoggingMiddleware('storeName'),
]
```

### Validation Middleware

Validates store values:

```typescript
import { createValidationMiddleware } from './storeFactory';

middleware: [
  createValidationMiddleware(
    (value) => value.count >= 0,
    'Count cannot be negative'
  ),
]
```

### Custom Middleware

```typescript
middleware: [
  (value, action) => {
    // Transform value or perform side effects
    if (action === 'set') {
      // Special handling for set
    }
  },
]
```

## Persistence

Stores can persist to localStorage automatically:

```typescript
persist: {
  key: 'store_data',
  storage: localStorage, // Optional, defaults to localStorage
  serialize: (value) => JSON.stringify(value),
  deserialize: (str) => JSON.parse(str),
}
```

## Store Methods

All stores created with `createStore` have these methods:

- `subscribe(callback)` - Subscribe to store changes
- `set(value)` - Set store value
- `update(fn)` - Update store value with function
- `reset()` - Reset to initial value
- `getValue()` - Get current value synchronously

## Best Practices

1. **Use store factory** - Always use `createStore` for consistency
2. **Add logging middleware** - Helps with debugging in development
3. **Validate inputs** - Use validation middleware for critical data
4. **Handle Result types** - When calling services, handle Result pattern:

```typescript
const result = await myService.getData();
if (result.success) {
  store.set(result.value);
} else {
  toastStore.add(getUserMessage(result.error), 'error');
}
```

5. **Clean up resources** - Stop polling, clear timeouts in reset methods
6. **Document methods** - Add JSDoc to all public methods

## Migration Guide

### Step 1: Create New Store File

Create a `.svelte.ts` file (e.g., `myStore.svelte.ts`):

```typescript
// myStore.svelte.ts
export const myState = $state({
  data: [] as MyType[],
  loading: false
});

export async function loadData() {
  myState.loading = true;
  // ... fetch logic
  myState.loading = false;
}
```

### Step 2: Update Components

**Old pattern:**
```svelte
<script>
  import { myStore } from '$lib/stores/myStore';
  
  let data = $state([]);
  myStore.subscribe((storeData) => {
    data = storeData.data;
  });
</script>
```

**New pattern:**
```svelte
<script>
  import { myState, loadData } from '$lib/stores/myStore.svelte';
  
  // Direct reactive access!
  const isLoading = $derived(myState.loading);
</script>
```

### Step 3: Add Backward Compatibility

In the old store file, re-export from new store:

```typescript
// myStore.ts (old file)
export { myState, loadData } from './myStore.svelte';
// Keep old exports for backward compatibility during migration
```

### Step 4: Remove Old Store

Once all components are migrated, remove the old store file.

## Examples

### New Pattern (Svelte 5)
- `taskStore.svelte.ts` - Tasks with polling and caching

### Old Pattern (Svelte 4 - Being Migrated)
- `authStore.ts` - Authentication with persistence
- `toastStore.ts` - Toast notifications
- `messageStore.ts` - Message count with polling
- `caseStore.ts` - Case data with polling
- `processStore.ts` - Process data with polling
- `projectStore.ts` - Project data with polling

