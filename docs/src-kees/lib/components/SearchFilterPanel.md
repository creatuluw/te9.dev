# SearchFilterPanel Component

A reusable search and filter panel component that provides a toggle button (Search/X icon) to show/hide a filter panel. The panel is hidden by default and can span full width when visible. Perfect for implementing collapsible search and filter interfaces.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the panel is open (bindable) |
| `mode` | `'button' \| 'panel' \| 'both'` | `'both'` | Render mode: 'button' renders only the button, 'panel' renders only the panel, 'both' renders both |
| `class` | `string` | `''` | Additional CSS classes for the button container |
| `buttonClass` | `string` | `''` | Additional CSS classes for the toggle button |
| `panelClass` | `string` | `''` | Additional CSS classes for the panel container |
| `searchTooltip` | `string` | `'Zoeken'` | Tooltip text for the search button |
| `closeTooltip` | `string` | `'Sluiten'` | Tooltip text for the close button |

## Features

- **Toggle Button**: Shows Search icon when closed, X icon when open
- **Flexible Rendering**: Use `mode` prop to render button and panel separately (useful for full-width panels)
- **Slot-based Content**: Define filter content per use case via the default slot
- **Bindable State**: Use `bind:open` to control panel state from parent

## Usage Modes

### Both (Default)
Renders both button and panel together:

```svelte
<SearchFilterPanel bind:open={isOpen}>
  <div>Filter content here</div>
</SearchFilterPanel>
```

### Button Only
Render only the toggle button (useful when button is in a flex container):

```svelte
<SearchFilterPanel bind:open={isOpen} mode="button" />
```

### Panel Only
Render only the panel (useful when panel needs to span full width outside flex container):

```svelte
<SearchFilterPanel bind:open={isOpen} mode="panel">
  <div>Filter content here</div>
</SearchFilterPanel>
```

## Examples

### Basic Usage

```svelte
<script>
  import SearchFilterPanel from '$lib/components/SearchFilterPanel.svelte';
  
  let panelOpen = $state(false);
</script>

<SearchFilterPanel bind:open={panelOpen}>
  <div class="space-y-4">
    <input type="text" placeholder="Search..." />
    <select>
      <option>Filter option 1</option>
      <option>Filter option 2</option>
    </select>
  </div>
</SearchFilterPanel>
```

### Full-Width Panel (Separate Button and Panel)

This pattern is useful when you want the button in a flex container but the panel to span full width:

```svelte
<script>
  import SearchFilterPanel from '$lib/components/SearchFilterPanel.svelte';
  
  let panelOpen = $state(false);
</script>

<div class="flex justify-between">
  <SearchFilterPanel bind:open={panelOpen} mode="button" />
  <!-- Other buttons -->
</div>

<!-- Panel rendered outside flex container to span full width -->
<SearchFilterPanel bind:open={panelOpen} mode="panel">
  <div class="grid grid-cols-3 gap-4">
    <input type="text" placeholder="Search..." />
    <select>...</select>
    <select>...</select>
  </div>
</SearchFilterPanel>
```

### With Custom Tooltips

```svelte
<SearchFilterPanel 
  bind:open={panelOpen}
  searchTooltip="Open filters"
  closeTooltip="Close filters"
>
  <div>Filter content</div>
</SearchFilterPanel>
```

## Styling

The component uses the design system's zinc color palette:
- Panel background: `bg-white`
- Panel border: `border-zinc-200`
- Panel shadow: `shadow-xs`
- Panel padding: `p-4`

You can customize styling using the `class`, `buttonClass`, and `panelClass` props.

## Accessibility

- The toggle button includes proper ARIA labels via tooltips
- Button is keyboard accessible
- Panel visibility is controlled by the `open` state

