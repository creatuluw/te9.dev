# DropdownNav Component

A dropdown navigation menu component that displays a list of menu items when triggered. Perfect for navigation menus with sub-items or action menus.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | **Required** | The label text displayed on the trigger button |
| `items` | `DropdownNavItem[]` | **Required** | Array of menu items to display in the dropdown |
| `position` | `'left' \| 'right' \| 'center'` | `'left'` | Position of the dropdown relative to the trigger button |
| `open` | `boolean` | `false` | Bindable prop to control dropdown open state |
| `class` | `string` | `''` | Additional CSS classes for the root container |
| `onclose` | `() => void` | `undefined` | Callback fired when dropdown closes |
| `onitemclick` | `(item: DropdownNavItem) => void` | `undefined` | Callback fired when a menu item is clicked |

## DropdownNavItem Interface

```typescript
interface DropdownNavItem {
  label: string;      // Display text for the menu item
  href: string;       // Link URL for the menu item
  disabled?: boolean; // Whether the item is disabled
}
```

## Features

- Click outside to close
- Escape key to close
- Smooth transitions
- Keyboard accessible (ARIA attributes)
- Disabled item support
- Customizable positioning
- Bindable open state

## Examples

### Basic Usage

```svelte
<script>
  import { DropdownNav } from '$lib/components';

  const menuItems = [
    { label: 'Analytics', href: '/analytics' },
    { label: 'Engagement', href: '/engagement' },
    { label: 'Security', href: '/security' },
    { label: 'Integrations', href: '/integrations' }
  ];
</script>

<DropdownNav label="Solutions" items={menuItems} />
```

### With Position Control

```svelte
<DropdownNav label="Menu" items={menuItems} position="right" />
<DropdownNav label="Menu" items={menuItems} position="center" />
```

### With Controlled State

```svelte
<script>
  let menuOpen = $state(false);
  
  function handleClose() {
    console.log('Menu closed');
  }
</script>

<DropdownNav 
  label="Solutions" 
  items={menuItems} 
  bind:open={menuOpen}
  onclose={handleClose}
/>
```

### With Disabled Items

```svelte
<script>
  const menuItems = [
    { label: 'Active Item', href: '/active' },
    { label: 'Disabled Item', href: '/disabled', disabled: true },
    { label: 'Another Active', href: '/another' }
  ];
</script>

<DropdownNav label="Menu" items={menuItems} />
```

### With Item Click Handler

```svelte
<script>
  function handleItemClick(item) {
    console.log('Clicked:', item.label);
    // Custom navigation logic
  }
</script>

<DropdownNav 
  label="Actions" 
  items={menuItems} 
  onitemclick={handleItemClick}
/>
```

## Styling

The component follows the gray-html design system:
- Uses zinc color palette
- Rounded corners (rounded-xl)
- Shadow-lg for depth
- Smooth transitions
- Hover states for interactive feedback

You can customize the appearance by passing additional classes via the `class` prop.

