# IconButton Component

A button component specifically designed for icon-only interactions, styled according to the gray-html design system with consistent padding, hover states, and shadow effects.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `ComponentType` | **required** | Lucide icon component to render |
| `iconSize` | `number` | auto | Size of the icon in pixels (auto-calculated based on button size if not provided) |
| `variant` | `'default' \| 'ghost' \| 'danger'` | `'default'` | Visual variant style |
| `size` | `'default' \| 'sm' \| 'lg'` | `'default'` | Button size |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `class` | `string` | `''` | Additional CSS classes |
| `onclick` | `(event: MouseEvent) => void` | `undefined` | Click event handler |

## Variants

### Default
Standard icon button with zinc-600 text and hover effects:
```svelte
<IconButton icon={Pencil} />
```

### Ghost
Transparent background with subtle hover effect:
```svelte
<IconButton icon={Trash} variant="ghost" />
```

### Danger
Red-tinted button for destructive actions:
```svelte
<IconButton icon={Archive} variant="danger" />
```

## Sizes

### Small
Compact size (auto icon size: 16px, padding: 6px):
```svelte
<IconButton icon={Edit} size="sm" />
```

### Default
Standard size (auto icon size: 18px, padding: 8px):
```svelte
<IconButton icon={Edit} />
```

### Large
Larger size (auto icon size: 22px, padding: 12px):
```svelte
<IconButton icon={Edit} size="lg" />
```

## Icon Size Customization

You can override the automatic icon sizing:
```svelte
<IconButton icon={Star} iconSize={24} />
```

## Examples

### Basic Usage
```svelte
<script>
  import IconButton from '$lib/components/IconButton.svelte';
  import { Pencil } from 'lucide-svelte';
</script>

<IconButton icon={Pencil} onclick={() => console.log('edit clicked')} />
```

### With Tooltip
Icon buttons work great with tooltips:
```svelte
<script>
  import IconButton from '$lib/components/IconButton.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import { FilePlus } from 'lucide-svelte';
</script>

<Tooltip text="Create new file">
  <IconButton icon={FilePlus} onclick={handleCreate} />
</Tooltip>
```

### Action Group
Multiple icon buttons in a row:
```svelte
<script>
  import IconButton from '$lib/components/IconButton.svelte';
  import { FilePlus, ListOrdered, Pencil, Archive } from 'lucide-svelte';
</script>

<div class="flex gap-2">
  <IconButton icon={FilePlus} onclick={handleCreate} />
  <IconButton icon={ListOrdered} onclick={handleList} />
  <IconButton icon={Pencil} onclick={handleEdit} />
  <IconButton icon={Archive} variant="danger" onclick={handleArchive} />
</div>
```

### Disabled State
```svelte
<IconButton icon={Save} disabled />
```

### Custom Icon Size
```svelte
<IconButton icon={Star} iconSize={20} size="sm" />
```

### With Custom Classes
```svelte
<IconButton 
  icon={Settings} 
  class="shadow-md hover:shadow-lg" 
/>
```

## Design Notes

- Uses consistent border (`border-zinc-200`) and shadow (`shadow-xs`) for depth
- Maintains zinc color palette for consistency with the design system
- Automatic icon sizing based on button size ensures visual harmony
- Transition effects provide smooth interactions
- Disabled state shows 50% opacity and cursor-not-allowed

## Common Use Cases

1. **Action buttons in cards** - Edit, delete, archive actions
2. **Toolbar buttons** - Quick actions in toolbars or headers
3. **List item actions** - Row-level actions in tables or lists
4. **Form controls** - Icon-based form interactions

