# ButtonGroup Component

A container component for grouping buttons together with shared borders and rounded corners. Matches the gray-html design system styling.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | `''` | Additional CSS classes |

## Usage

The ButtonGroup component wraps individual Button components and automatically styles them as a cohesive group with:
- Rounded corners only on the outer edges (leftmost and rightmost buttons)
- Vertical dividers between buttons
- Shared border around the entire group

## Examples

### Basic Button Group

```svelte
<script>
  import { ButtonGroup, Button } from '$lib/components';
</script>

<ButtonGroup>
  <Button variant="secondary" class="button-group-item">Profile</Button>
  <Button variant="secondary" class="button-group-item">Settings</Button>
  <Button variant="secondary" class="button-group-item">Messages</Button>
</ButtonGroup>
```

### With Different Variants

```svelte
<ButtonGroup>
  <Button variant="outline" class="button-group-item">Edit</Button>
  <Button variant="outline" class="button-group-item">Share</Button>
  <Button variant="outline" class="button-group-item">Delete</Button>
</ButtonGroup>
```

### Small Size Button Group

```svelte
<ButtonGroup>
  <Button size="sm" variant="secondary" class="button-group-item">Today</Button>
  <Button size="sm" variant="secondary" class="button-group-item">Week</Button>
  <Button size="sm" variant="secondary" class="button-group-item">Month</Button>
</ButtonGroup>
```

### With Icons

```svelte
<ButtonGroup>
  <Button variant="secondary" class="button-group-item">
    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
    Add
  </Button>
  <Button variant="secondary" class="button-group-item">
    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
    View
  </Button>
</ButtonGroup>
```

### Filter/Status Toggle Group

```svelte
<script>
  let activeFilter = $state('all');
  
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' }
  ];
</script>

<ButtonGroup variant="secondary">
  {#each filters as filter}
    <Button
      variant={activeFilter === filter.id ? 'default' : 'secondary'}
      class="button-group-item"
      onclick={() => activeFilter = filter.id}
    >
      {filter.label}
    </Button>
  {/each}
</ButtonGroup>
```

## Styling Notes

- The ButtonGroup container has a white background, zinc-200 border, and subtle shadow
- Individual buttons must include the `button-group-item` class to receive proper styling
- The first button gets rounded left corners, the last button gets rounded right corners
- Middle buttons have no rounded corners
- Vertical dividers (zinc-200) separate each button
- Buttons automatically flex to fill available space

## Accessibility

The ButtonGroup uses `role="group"` to indicate it's a grouped set of related buttons. Individual buttons should maintain their own accessibility attributes.

