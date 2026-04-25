# Tooltip Component

A tooltip component that displays helpful text when hovering over an element.

## Import

```typescript
import { Tooltip } from '$lib/components';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | (required) | The text to display in the tooltip |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Position of the tooltip relative to the trigger element |
| `delay` | `number` | `200` | Delay in milliseconds before showing the tooltip |
| `class` | `string` | `''` | Additional CSS classes to apply to the wrapper |

## Usage

### Basic Tooltip

```svelte
<script>
  import { Tooltip, Button } from '$lib/components';
</script>

<Tooltip text="Click to save">
  <Button>Save</Button>
</Tooltip>
```

### Different Positions

```svelte
<Tooltip text="Top tooltip" position="top">
  <button>Hover me</button>
</Tooltip>

<Tooltip text="Bottom tooltip" position="bottom">
  <button>Hover me</button>
</Tooltip>

<Tooltip text="Left tooltip" position="left">
  <button>Hover me</button>
</Tooltip>

<Tooltip text="Right tooltip" position="right">
  <button>Hover me</button>
</Tooltip>
```

### Icon-Only Buttons with Tooltips

```svelte
<Tooltip text="Edit">
  <button class="btn-sm">
    <svg><!-- edit icon --></svg>
  </button>
</Tooltip>

<Tooltip text="Delete">
  <button class="btn-sm">
    <svg><!-- delete icon --></svg>
  </button>
</Tooltip>
```

### Custom Delay

```svelte
<Tooltip text="This appears instantly" delay={0}>
  <button>Instant tooltip</button>
</Tooltip>

<Tooltip text="This appears after 1 second" delay={1000}>
  <button>Delayed tooltip</button>
</Tooltip>
```

## Styling

The tooltip uses:
- Background: `bg-zinc-900`
- Text: `text-zinc-100`
- Font size: `text-xs`
- Shadow: `shadow-sm`
- Padding: `px-2 py-1`

The tooltip automatically includes a small arrow pointing to the trigger element, which adjusts based on the position prop.

## Accessibility

- The tooltip appears on both `mouseenter` and `focus` events
- The tooltip hides on both `mouseleave` and `blur` events
- The tooltip includes `role="tooltip"` for screen readers
- The tooltip is not interactive (uses `pointer-events-none`)

## Notes

- The tooltip wrapper uses `relative` positioning, so it works within any layout
- The tooltip content uses `whitespace-nowrap` to prevent text wrapping
- The tooltip has a z-index of 50 to ensure it appears above most content
- The delay prevents tooltips from appearing on accidental hovers

