# Label Component

A badge/tag component for indicating important notes and highlighting content, styled similar to UIkit's label component.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'success' \| 'warning' \| 'danger'` | `'default'` | Label variant style |
| `class` | `string` | `''` | Additional CSS classes |

## Variants

### Default
Standard label with zinc colors:
```svelte
<Label>Default</Label>
```

### Success
Green label indicating success:
```svelte
<Label variant="success">Success</Label>
```

### Warning
Amber label indicating warning:
```svelte
<Label variant="warning">Warning</Label>
```

### Danger
Red label indicating error or important message:
```svelte
<Label variant="danger">Danger</Label>
```

## Examples

### Basic Usage
```svelte
<Label>New</Label>
<Label variant="success">Active</Label>
<Label variant="warning">Pending</Label>
<Label variant="danger">Expired</Label>
```

### With Content
```svelte
<span>Status: <Label variant="success">Active</Label></span>
```

### Custom Styling
```svelte
<Label class="mr-2" variant="default">Custom</Label>
```

