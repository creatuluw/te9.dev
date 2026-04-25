# SpeedDial Component

A floating action button component that displays a list of action buttons when triggered by hover or click. Useful for providing quick access to common actions.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `SpeedDialItem[]` | **required** | Array of menu items to display |
| `position` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-right'` | Position of the speed dial on the screen |
| `alignment` | `'vertical' \| 'horizontal'` | `'vertical'` | Alignment of menu items (vertical stack or horizontal row) |
| `trigger` | `'hover' \| 'click'` | `'click'` | How to trigger the menu (hover or click) |
| `triggerIcon` | `ComponentType` | `undefined` | Custom icon component for the trigger button (defaults to plus icon) |
| `size` | `'default' \| 'sm' \| 'lg'` | `'default'` | Size of the trigger button |
| `triggerVariant` | `'default' \| 'primary' \| 'success' \| 'danger'` | `'primary'` | Color variant of the trigger button |
| `class` | `string` | `''` | Additional CSS classes |

## SpeedDialItem Interface

Each item in the `items` array should follow this interface:

| Property | Type | Description |
|----------|------|-------------|
| `icon` | `ComponentType` | Icon component to display (e.g., from `lucide-svelte`) |
| `label` | `string` | Tooltip text shown on hover |
| `onclick` | `(event: MouseEvent) => void` | Optional click handler |
| `variant` | `'default' \| 'primary' \| 'success' \| 'danger'` | Optional color variant for the item button |

## Variants

### Default
Basic speed dial with default styling:

```svelte
<SpeedDial items={items} />
```

### Primary (default trigger variant)
Blue primary color:

```svelte
<SpeedDial items={items} triggerVariant="primary" />
```

### Success
Green success color:

```svelte
<SpeedDial items={items} triggerVariant="success" />
```

### Danger
Red danger color:

```svelte
<SpeedDial items={items} triggerVariant="danger" />
```

## Examples

### Basic Usage

```svelte
<script>
	import { SpeedDial } from '$lib/components';
	import { Share, Print, Download, Copy } from 'lucide-svelte';

	const items = [
		{ icon: Share, label: 'Share', onclick: () => console.log('Share clicked') },
		{ icon: Print, label: 'Print', onclick: () => console.log('Print clicked') },
		{ icon: Download, label: 'Download', onclick: () => console.log('Download clicked') },
		{ icon: Copy, label: 'Copy', onclick: () => console.log('Copy clicked') }
	];
</script>

<SpeedDial items={items} />
```

### Hover Trigger

```svelte
<SpeedDial items={items} trigger="hover" />
```

### Different Positions

```svelte
<!-- Top right -->
<SpeedDial items={items} position="top-right" />

<!-- Bottom left -->
<SpeedDial items={items} position="bottom-left" />

<!-- Top left -->
<SpeedDial items={items} position="top-left" />
```

### Horizontal Alignment

```svelte
<SpeedDial items={items} alignment="horizontal" />
```

### Custom Trigger Icon

```svelte
<script>
	import { Plus, Menu } from 'lucide-svelte';
</script>

<SpeedDial items={items} triggerIcon={Menu} />
```

### Different Sizes

```svelte
<!-- Small -->
<SpeedDial items={items} size="sm" />

<!-- Large -->
<SpeedDial items={items} size="lg" />
```

### Item Variants

```svelte
<script>
	const items = [
		{ icon: Share, label: 'Share', variant: 'primary' },
		{ icon: Delete, label: 'Delete', variant: 'danger' },
		{ icon: Save, label: 'Save', variant: 'success' },
		{ icon: Copy, label: 'Copy', variant: 'default' }
	];
</script>

<SpeedDial items={items} />
```

## Positioning

The speed dial can be positioned in any corner of the screen:
- `top-left`: Top left corner
- `top-right`: Top right corner
- `bottom-left`: Bottom left corner
- `bottom-right`: Bottom right corner (default)

## Trigger Types

- `click`: Menu opens/closes on click (default)
- `hover`: Menu opens on hover and closes when mouse leaves

## Accessibility

- The trigger button includes `aria-expanded` and `aria-controls` attributes
- Each menu item button includes `sr-only` text for screen readers
- Keyboard navigation is supported for click-triggered dials

## Notes

- Menu items automatically show tooltips on hover
- Tooltip placement is automatically adjusted based on position
- The trigger button icon rotates when open (for default plus icon)
- Menu items fade in/out with smooth transitions


























