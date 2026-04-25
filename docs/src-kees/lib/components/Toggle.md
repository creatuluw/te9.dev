# Toggle Component

A toggle switch component styled with smooth transitions and accessible checkbox input, perfect for boolean settings and feature toggles.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | Whether the toggle is checked |
| `name` | `string` | `undefined` | HTML name attribute for the checkbox input |
| `disabled` | `boolean` | `false` | Whether the toggle is disabled |
| `ariaLabel` | `string` | `undefined` | Accessibility label for screen readers |
| `class` | `string` | `''` | Additional CSS classes |
| `onchange` | `(event: Event & { currentTarget: HTMLInputElement }) => void` | `undefined` | Change event handler |

## Examples

### Basic Usage
```svelte
<Toggle />
```

### Controlled Toggle
```svelte
<script>
  let enabled = $state(false);
</script>

<Toggle checked={enabled} onchange={(e) => enabled = e.currentTarget.checked} />
<div>Status: {enabled ? 'Enabled' : 'Disabled'}</div>
```

### With Label and Name
```svelte
<Toggle name="notifications" ariaLabel="Enable notifications" />
```

### Disabled State
```svelte
<div class="space-y-3">
  <Toggle disabled />
  <Toggle checked disabled />
</div>
```

### With Custom Classes
```svelte
<Toggle class="my-custom-class" />
```

## Accessibility

The toggle component includes:
- Proper ARIA labels via `ariaLabel` prop
- Keyboard navigation support
- Focus states with outline indication
- Screen reader compatibility through native checkbox input

## Styling

The toggle uses:
- **Background**: Gray-200 when unchecked, Indigo-600 when checked
- **Toggle knob**: White with shadow and ring
- **Transitions**: Smooth 200ms transitions for color and transform
- **Dark mode**: Supports dark mode with appropriate color variants
- **Size**: Fixed width of 44px (w-11) with 20px (size-5) knob


























