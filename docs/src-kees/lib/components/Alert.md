# Alert Component

A versatile alert component for displaying informational messages, styled according to the gray-html design system.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'info' \| 'danger' \| 'success' \| 'warning' \| 'dark'` | `'info'` | Alert variant type |
| `class` | `string` | `''` | Additional CSS classes |
| `children` | `Snippet` | `undefined` | Alert content (default slot) |

## Variants

### Info
Blue alert for informational messages:
```svelte
<Alert variant="info">
  Info alert! Change a few things up and try submitting again.
</Alert>
```

### Danger
Red alert for error or critical messages:
```svelte
<Alert variant="danger">
  Danger alert! Change a few things up and try submitting again.
</Alert>
```

### Success
Green alert for success messages:
```svelte
<Alert variant="success">
  Success alert! Change a few things up and try submitting again.
</Alert>
```

### Warning
Yellow alert for warning messages:
```svelte
<Alert variant="warning">
  Warning alert! Change a few things up and try submitting again.
</Alert>
```

### Dark
Dark blue-grey alert for neutral messages:
```svelte
<Alert variant="dark">
  Dark alert! Change a few things up and try submitting again.
</Alert>
```

## Examples

### Basic Usage
```svelte
<Alert variant="info">
  This is an informational message.
</Alert>
```

### Error Message
```svelte
<Alert variant="danger">
  An error occurred while processing your request.
</Alert>
```

### Success Message
```svelte
<Alert variant="success">
  Your changes have been saved successfully!
</Alert>
```

### Warning Message
```svelte
<Alert variant="warning">
  Please review your input before submitting.
</Alert>
```

### With Custom Classes
```svelte
<Alert variant="info" class="mb-4">
  Custom styled alert with margin bottom.
</Alert>
```

### All Variants
```svelte
<div class="space-y-4">
  <Alert variant="info">
    Info alert! Change a few things up and try submitting again.
  </Alert>
  <Alert variant="danger">
    Danger alert! Change a few things up and try submitting again.
  </Alert>
  <Alert variant="success">
    Success alert! Change a few things up and try submitting again.
  </Alert>
  <Alert variant="warning">
    Warning alert! Change a few things up and try submitting again.
  </Alert>
  <Alert variant="dark">
    Dark alert! Change a few things up and try submitting again.
  </Alert>
</div>
```

## Accessibility

The component includes `role="alert"` for screen readers, making it accessible for assistive technologies.

