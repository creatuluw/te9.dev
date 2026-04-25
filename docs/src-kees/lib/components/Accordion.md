# Accordion Component

A collapsible accordion component for organizing content into expandable sections, with keyboard navigation support.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `AccordionItem[]` | **Required** | Array of accordion items |
| `allowMultiple` | `boolean` | `true` | Whether multiple items can be open simultaneously |
| `defaultOpen` | `string[]` | `[]` | Array of item IDs to open by default |
| `class` | `string` | `''` | Additional CSS classes |

## AccordionItem Interface

```typescript
interface AccordionItem {
  id: string;
  title: string;
  content: string;
}
```

## Examples

### Basic Usage
```svelte
<script>
  import { Accordion } from '$lib/components';
  
  const items = [
    { id: '1', title: 'Section 1', content: 'Content for section 1' },
    { id: '2', title: 'Section 2', content: 'Content for section 2' },
    { id: '3', title: 'Section 3', content: 'Content for section 3' }
  ];
</script>

<Accordion {items} />
```

### Allow Multiple Open Items (Default Behavior)
```svelte
<Accordion {items} />
```
By default, multiple items can be open simultaneously. Items stay open until explicitly closed by the user.

### With Default Open Items
```svelte
<Accordion {items} defaultOpen={['1', '2']} />
```

### Single Open Only
```svelte
<Accordion {items} allowMultiple={false} />
```
When `allowMultiple={false}`, opening a new item will automatically close the previously open item.

### With Custom Classes
```svelte
<Accordion {items} class="my-custom-class" />
```

## Keyboard Navigation

- **Enter** or **Space** - Toggle the focused accordion item
- **Tab** - Navigate between accordion items

## Accessibility

- Uses proper ARIA attributes (`aria-expanded`, `aria-controls`)
- Keyboard accessible
- Focus indicators for keyboard navigation

