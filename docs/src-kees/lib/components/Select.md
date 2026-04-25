# Select Component

A dropdown select component with customizable options, styled according to the gray-html design system.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `SelectOption[]` | **Required** | Array of select options |
| `value` | `string` | `''` | Selected value (bindable) |
| `placeholder` | `string` | `'Select an option...'` | Placeholder text |
| `disabled` | `boolean` | `false` | Whether the select is disabled |
| `size` | `'default' \| 'sm'` | `'default'` | Select size |
| `class` | `string` | `''` | Additional CSS classes |
| `onchange` | `(event: Event) => void` | `undefined` | Change event handler |
| `oninput` | `(event: Event) => void` | `undefined` | Input event handler |

## SelectOption Interface

```typescript
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

## Examples

### Basic Usage
```svelte
<script>
  import { Select } from '$lib/components';
  
  let selected = $state('');
  
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' }
  ];
</script>

<Select bind:value={selected} {options} />
```

### With Placeholder
```svelte
<Select 
  bind:value={selected} 
  {options} 
  placeholder="Choose an option..."
/>
```

### Disabled Select
```svelte
<Select 
  bind:value={selected} 
  {options} 
  disabled={true}
/>
```

### Small Size
```svelte
<Select 
  bind:value={selected} 
  {options} 
  size="sm"
/>
```

### With Disabled Options
```svelte
<script>
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2 (Disabled)', disabled: true },
    { value: '3', label: 'Option 3' }
  ];
</script>

<Select bind:value={selected} {options} />
```

### With Change Handler
```svelte
<script>
  function handleChange(event) {
    console.log('Selected:', event.target.value);
  }
</script>

<Select 
  bind:value={selected} 
  {options} 
  onchange={handleChange}
/>
```

