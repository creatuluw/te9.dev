# ProgressBar Component

A progress indicator component that displays a visual progress bar with optional status text and step labels. Supports multiple variants and sizes, following the gray-html design system.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | `0` | Current progress value (0-100) |
| `statusText` | `string` | `undefined` | Status message/description displayed above the progress bar |
| `steps` | `Step[]` | `[]` | Array of step objects with label and optional status |
| `showSteps` | `boolean` | `false` | Whether to show step labels below the progress bar |
| `variant` | `'default' \| 'indigo' \| 'blue' \| 'green'` | `'indigo'` | Color variant of the progress bar |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Height of the progress bar |
| `class` | `string` | `''` | Additional CSS classes |

### Step Interface

```typescript
interface Step {
  label: string;
  status?: 'active' | 'completed' | 'pending';
}
```

## Variants

### Default
Uses zinc color palette for the progress bar:

```svelte
<ProgressBar value={50} statusText="Processing..." variant="default" />
```

### Indigo (Default)
Uses indigo color for the progress bar:

```svelte
<ProgressBar value={37.5} statusText="Migrating MySQL database..." variant="indigo" />
```

### Blue
Uses blue color for the progress bar:

```svelte
<ProgressBar value={75} statusText="Uploading files..." variant="blue" />
```

### Green
Uses green color for the progress bar:

```svelte
<ProgressBar value={100} statusText="Complete!" variant="green" />
```

## Sizes

### Small (sm)
```svelte
<ProgressBar value={60} size="sm" />
```

### Medium (md) - Default
```svelte
<ProgressBar value={60} size="md" />
```

### Large (lg)
```svelte
<ProgressBar value={60} size="lg" />
```

## Examples

### Basic Usage

```svelte
<script>
  import { ProgressBar } from '$lib/components';
</script>

<ProgressBar value={50} />
```

### With Status Text

```svelte
<ProgressBar 
  value={37.5} 
  statusText="Migrating MySQL database..." 
/>
```

### With Steps

```svelte
<script>
  import { ProgressBar } from '$lib/components';
  
  const steps = [
    { label: 'Copying files', status: 'completed' },
    { label: 'Migrating database', status: 'active' },
    { label: 'Compiling assets', status: 'pending' },
    { label: 'Deployed', status: 'pending' }
  ];
</script>

<ProgressBar 
  value={37.5} 
  statusText="Migrating MySQL database..." 
  steps={steps}
  showSteps={true}
/>
```

### Auto-Calculated Step Status

If you don't provide status for steps, they will be automatically calculated based on the progress value:

```svelte
<script>
  const steps = [
    { label: 'Copying files' },
    { label: 'Migrating database' },
    { label: 'Compiling assets' },
    { label: 'Deployed' }
  ];
</script>

<ProgressBar 
  value={37.5} 
  steps={steps}
  showSteps={true}
/>
```

### Different Variants

```svelte
<div class="space-y-4">
  <ProgressBar value={25} variant="default" statusText="Default variant" />
  <ProgressBar value={50} variant="indigo" statusText="Indigo variant" />
  <ProgressBar value={75} variant="blue" statusText="Blue variant" />
  <ProgressBar value={100} variant="green" statusText="Green variant" />
</div>
```

### Dynamic Progress

```svelte
<script>
  import { ProgressBar } from '$lib/components';
  import { onMount } from 'svelte';
  
  let progress = $state(0);
  
  onMount(() => {
    const interval = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
    }, 500);
    
    return () => clearInterval(interval);
  });
</script>

<ProgressBar 
  value={progress} 
  statusText="Processing your request..." 
/>
```

### With Custom Classes

```svelte
<ProgressBar 
  value={60} 
  statusText="Uploading..." 
  class="max-w-md"
/>
```

## Accessibility

- The status text is wrapped in a `<h4>` with `sr-only` class for screen readers
- The progress bar has `aria-hidden="true"` on the decorative container
- Step labels are visible on larger screens (`sm:grid`) and hidden on mobile
- Progress value is automatically clamped between 0 and 100

## Styling Notes

- Progress bar uses zinc color palette for background (`bg-zinc-200`)
- Progress fill uses variant-specific colors (indigo, blue, green, or zinc)
- Step labels use variant color for active/completed steps, zinc-600 for pending
- Responsive: step labels hidden on mobile, visible on small screens and up
- Smooth transitions when progress value changes
- Rounded corners (`rounded-full`) for modern appearance

## Common Use Cases

- File uploads/downloads
- Form submission progress
- Database migration status
- Multi-step process indicators
- Installation/setup progress
- Data processing status

