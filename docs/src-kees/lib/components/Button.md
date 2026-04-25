# Button Component

A versatile button component with multiple variants and sizes, styled according to the gray-html design system.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'secondary' \| 'ghost' \| 'outline'` | `'default'` | Optional variant style |
| `size` | `'default' \| 'sm'` | `'default'` | Button size |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `fullWidth` | `boolean` | `false` | Whether button should take full width |
| `class` | `string` | `''` | Additional CSS classes |
| `onclick` | `(event: MouseEvent) => void` | `undefined` | Click event handler |

## Variants

### Default
Primary button with zinc-900 background:
```svelte
<Button>Click me</Button>
```

### Secondary
White background button:
```svelte
<Button variant="secondary">Secondary</Button>
```

### Ghost
Transparent background with hover effect:
```svelte
<Button variant="ghost">Ghost</Button>
```

### Outline
Button with border:
```svelte
<Button variant="outline">Outline</Button>
```

## Sizes

### Default
Standard button size (uses `.btn` class):
```svelte
<Button>Default Size</Button>
```

### Small
Small button size (uses `.btn-sm` class):
```svelte
<Button size="sm">Small</Button>
```

## Examples

### Basic Usage
```svelte
<Button onclick={() => console.log('clicked')}>
  Click me
</Button>
```

### Submit Button
```svelte
<Button type="submit" variant="default">
  Submit Form
</Button>
```

### Full Width Button
```svelte
<Button fullWidth variant="default">
  Full Width Button
</Button>
```

### Disabled Button
```svelte
<Button disabled variant="default">
  Disabled
</Button>
```

### With Custom Classes
```svelte
<Button class="my-custom-class" variant="secondary">
  Custom Styled
</Button>
```

