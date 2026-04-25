# SearchScope Component

A compact button group component for selecting search scope (alles, cases, projecten, taken, processen, personen). Styled according to the gray-html design system with small, condensed buttons that stretch to full width.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `SearchScopeOption[]` | `[{ value: 'alle', label: 'Alles' }]` | Available scope options |
| `value` | `string` | `'alle'` | Currently selected scope (bindable) |
| `onchange` | `(value: string) => void` | `undefined` | Called when scope changes |
| `class` | `string` | `''` | Additional CSS classes |

## SearchScopeOption Interface

```typescript
interface SearchScopeOption {
  value: string;  // Unique identifier for the scope
  label: string;  // Display label
}
```

## Features

- **Compact Design**: Small text (text-xs) and tight padding (px-2 py-1) for space efficiency
- **Full Width**: Uses `flex` with `flex-1` buttons to stretch across container width
- **Visual Selection**: Active button has distinct styling (dark background)
- **Seamless Button Group**: Buttons are visually connected with shared borders
- **Keyboard Accessible**: Can be navigated and activated via keyboard
- **Customizable Options**: Pass any scope options you need

## Examples

### Basic Usage (All Scopes)

```svelte
<script>
  import { SearchScope } from '$lib/components';
  
  const scopeOptions = [
    { value: 'alle', label: 'Alles' },
    { value: 'cases', label: 'Cases' },
    { value: 'projecten', label: 'Projecten' },
    { value: 'taken', label: 'Taken' },
    { value: 'processen', label: 'Processen' },
    { value: 'personen', label: 'Personen' }
  ];
  
  let selectedScope = $state('alle');
  
  function handleScopeChange(value) {
    console.log('Search scope:', value);
  }
</script>

<SearchScope 
  bind:value={selectedScope}
  options={scopeOptions}
  onchange={handleScopeChange}
  class="w-full"
/>
```

### Subset of Scopes

```svelte
<script>
  import { SearchScope } from '$lib/components';
  
  const scopeOptions = [
    { value: 'alle', label: 'Alles' },
    { value: 'cases', label: 'Cases' },
    { value: 'taken', label: 'Taken' }
  ];
  
  let selectedScope = $state('alle');
</script>

<SearchScope 
  bind:value={selectedScope}
  options={scopeOptions}
  class="w-full"
/>
```

## Styling

The component uses:
- **Font**: Inter (font-inter) with extra small size (text-xs)
- **Spacing**: Compact padding (px-2 py-1) for condensed appearance
- **Layout**: Flex container with flex-1 buttons for equal width distribution
- **Colors**: Zinc palette for text and borders
- **Active State**: Black (zinc-900) background with white text
- **Hover State**: Subtle zinc-50 background
- **Border**: Zinc-200/300 for separation

## Integration with SearchInput

This component is designed to work with `SearchInput` for comprehensive search functionality. Display it below the search input when user starts typing.

```svelte
<script>
  import { SearchInput, SearchScope } from '$lib/components';
  
  let searchQuery = $state('');
  let searchScope = $state('alle');
</script>

<div>
  <SearchInput bind:value={searchQuery} />
  {#if searchQuery}
    <SearchScope bind:value={searchScope} class="mt-2 w-full" />
  {/if}
</div>
```

