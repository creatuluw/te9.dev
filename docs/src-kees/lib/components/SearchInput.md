# SearchInput Component

A search input component with autosuggest functionality and optional search scope filtering, styled according to the gray-html design system. Features real-time filtering, keyboard navigation, clear button, and scope-based search.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | Current search value (bindable) |
| `placeholder` | `string` | `'Zoeken...'` | Placeholder text |
| `disabled` | `boolean` | `false` | Whether the input is disabled |
| `suggestions` | `SearchSuggestion[]` | `[]` | Array of suggestions for autosuggest |
| `showSuggestions` | `boolean` | `true` | Whether to show suggestion dropdown |
| `maxSuggestions` | `number` | `5` | Maximum number of suggestions to display |
| `showSearchScope` | `boolean` | `false` | Whether to show search scope buttons when typing |
| `searchScopeOptions` | `SearchScopeOption[]` | `[{ value: 'alle', label: 'Alle' }]` | Search scope options |
| `searchScope` | `string` | `'alle'` | Currently selected search scope (bindable) |
| `class` | `string` | `''` | Additional CSS classes |
| `onchange` | `(value: string) => void` | `undefined` | Called when input value changes |
| `onsearch` | `(value: string) => void` | `undefined` | Called when Enter is pressed or suggestion selected |
| `onscopechange` | `(value: string) => void` | `undefined` | Called when search scope changes |

## SearchSuggestion Interface

```typescript
interface SearchSuggestion {
  value: string;      // The actual value to use when selected
  label: string;      // Display text
  metadata?: string;  // Optional metadata shown on the right
}
```

## SearchScopeOption Interface

```typescript
interface SearchScopeOption {
  value: string;  // Unique identifier for the scope
  label: string;  // Display label
}
```

## Features

- **Autosuggest**: Real-time filtering of suggestions as user types
- **Search Scope**: Optional button group to filter search by category (alle, cases, projecten, taken, processen, personen)
- **Keyboard Navigation**: 
  - Arrow Up/Down to navigate suggestions
  - Enter to select focused suggestion or trigger search
  - Escape to close dropdown and blur input
- **Clear Button**: Quick clear icon appears when input has value
- **Accessibility**: Keyboard-friendly with proper focus management
- **Smart Filtering**: Searches in value, label, and metadata fields

## Examples

### Basic Usage (Without Scope)

```svelte
<script>
  import { SearchInput } from '$lib/components';
  
  let searchValue = $state('');
  
  function handleSearch(value) {
    console.log('Searching for:', value);
  }
</script>

<SearchInput 
  bind:value={searchValue} 
  onsearch={handleSearch} 
/>
```

### With Search Scope

```svelte
<script>
  import { SearchInput } from '$lib/components';
  
  let searchValue = $state('');
  let searchScope = $state('alle');
  
  const scopeOptions = [
    { value: 'alle', label: 'Alle' },
    { value: 'cases', label: 'Cases' },
    { value: 'projecten', label: 'Projecten' },
    { value: 'taken', label: 'Taken' },
    { value: 'processen', label: 'Processen' },
    { value: 'personen', label: 'Personen' }
  ];
  
  function handleSearch(value) {
    console.log('Searching for:', value, 'in scope:', searchScope);
  }
  
  function handleScopeChange(scope) {
    console.log('Scope changed to:', scope);
  }
</script>

<SearchInput 
  bind:value={searchValue}
  bind:searchScope={searchScope}
  showSearchScope={true}
  searchScopeOptions={scopeOptions}
  onsearch={handleSearch}
  onscopechange={handleScopeChange}
/>
```

### With Suggestions

```svelte
<script>
  import { SearchInput, type SearchSuggestion } from '$lib/components';
  
  let searchValue = $state('');
  
  const suggestions: SearchSuggestion[] = [
    { value: 'Case 1', label: 'Case 1', metadata: 'Active' },
    { value: 'Case 2', label: 'Case 2', metadata: 'Pending' }
  ];
</script>

<SearchInput 
  bind:value={searchValue}
  suggestions={suggestions}
/>
```

### Complete Example (Backlog Page)

```svelte
<script>
  import { SearchInput } from '$lib/components';
  
  let searchQuery = $state('');
  let searchScope = $state('alle');
  
  // Filter items based on search and scope
  const filteredItems = $derived.by(() => {
    if (!searchQuery.trim()) return allItems;
    
    return allItems.filter(item => {
      const query = searchQuery.toLowerCase();
      
      switch (searchScope) {
        case 'alle':
          return matchesAnyField(item, query);
        case 'cases':
          return item.type === 'case' && item.name.toLowerCase().includes(query);
        case 'taken':
          return item.type === 'task' && item.subject.toLowerCase().includes(query);
        // ... other scopes
      }
    });
  });
</script>

<SearchInput
  bind:value={searchQuery}
  bind:searchScope={searchScope}
  placeholder="Zoek in onderwerp, tags, case naam..."
  showSuggestions={false}
  showSearchScope={true}
  searchScopeOptions={[
    { value: 'alle', label: 'Alle' },
    { value: 'cases', label: 'Cases' },
    { value: 'projecten', label: 'Projecten' },
    { value: 'taken', label: 'Taken' },
    { value: 'processen', label: 'Processen' },
    { value: 'personen', label: 'Personen' }
  ]}
  onchange={(value) => console.log('Search changed:', value)}
  onscopechange={(scope) => console.log('Scope changed:', scope)}
/>
```

## Behavior

- **Scope Buttons Display**: Only shown when `showSearchScope={true}` AND user has typed at least one character
- **Default Scope**: Always starts with 'alle' (all) unless explicitly set
- **Scope Persistence**: Scope selection persists while typing and can be synced with URL parameters
- **Combined Filtering**: Use both search value and scope in your filter logic for targeted searches

## Styling

The component uses:
- **Font**: Inter (font-inter)
- **Colors**: Zinc palette for text and borders, Indigo for focus states
- **Scope Buttons**: Integrated SearchScope component with seamless button group design
- **Shadow**: Subtle shadow-xs/sm for depth
- **Responsive**: Fully responsive design that works on all screen sizes

## Integration Tips

1. **URL Synchronization**: Sync both `value` and `searchScope` with URL parameters for shareable filtered views
2. **Scope-Based Filtering**: Implement scope-aware filtering logic in your derived/computed values
3. **Multiple Pages**: Use the same scope options across pages for consistent user experience
4. **Reset Functionality**: When resetting filters, remember to reset both `value` and `searchScope`
```

### With Suggestions

```svelte
<script>
  import { SearchInput, type SearchSuggestion } from '$lib/components';
  
  let searchValue = $state('');
  
  const suggestions: SearchSuggestion[] = [
    { value: 'Case 001', label: 'Case 001', metadata: 'Actief' },
    { value: 'Case 002', label: 'Case 002', metadata: 'Voltooid' },
    { value: 'Case 003', label: 'Case 003', metadata: 'In afwachting' }
  ];
  
  function handleSearch(value) {
    console.log('Searching for:', value);
  }
</script>

<SearchInput 
  bind:value={searchValue} 
  {suggestions}
  onsearch={handleSearch}
  placeholder="Zoek cases..."
/>
```

### Dynamic Suggestions from API

```svelte
<script>
  import { SearchInput, type SearchSuggestion } from '$lib/components';
  import * as caseService from '$lib/services/caseService';
  
  let searchValue = $state('');
  let suggestions = $state<SearchSuggestion[]>([]);
  
  async function handleChange(value: string) {
    if (value.length >= 2) {
      // Load suggestions from API
      const cases = await caseService.getAllCases();
      suggestions = cases
        .filter(c => c.name.toLowerCase().includes(value.toLowerCase()))
        .map(c => ({
          value: c.name,
          label: c.name,
          metadata: c.status
        }));
    } else {
      suggestions = [];
    }
  }
  
  function handleSearch(value: string) {
    // Perform search
    console.log('Searching for:', value);
  }
</script>

<SearchInput 
  bind:value={searchValue} 
  {suggestions}
  onchange={handleChange}
  onsearch={handleSearch}
  placeholder="Zoek cases..."
/>
```

### Limited Suggestions

```svelte
<SearchInput 
  bind:value={searchValue} 
  {suggestions}
  maxSuggestions={3}
  onsearch={handleSearch}
/>
```

### Without Suggestions Dropdown

```svelte
<SearchInput 
  bind:value={searchValue} 
  showSuggestions={false}
  onsearch={handleSearch}
/>
```

### Disabled State

```svelte
<SearchInput 
  bind:value={searchValue} 
  disabled={true}
/>
```

### Custom Placeholder

```svelte
<SearchInput 
  bind:value={searchValue} 
  placeholder="Type to search..."
  onsearch={handleSearch}
/>
```

## Behavior

1. **Typing**: As user types, suggestions are filtered in real-time based on matching the query against `value`, `label`, and `metadata` fields
2. **Suggestion Selection**: 
   - Click on a suggestion to select it
   - Use keyboard navigation (arrows + Enter)
   - Selected value is set and `onchange` + `onsearch` callbacks are triggered
3. **Clear**: Click the clear button (X icon) to reset the search value and trigger callbacks with empty string
4. **Search Trigger**: Press Enter to trigger `onsearch` callback with current value (even without selecting a suggestion)

## Styling

The component follows the gray-html design system:
- Uses Zinc color palette for text and borders
- Rounded-sm borders for consistency
- Focus states with outline-zinc-500
- Hover effects on suggestions
- Shadow-sm on dropdown for depth

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↓` | Move focus to next suggestion |
| `↑` | Move focus to previous suggestion |
| `Enter` | Select focused suggestion or trigger search |
| `Escape` | Close dropdown and blur input |

## Accessibility

- Fully keyboard navigable
- Clear focus indicators
- ARIA-compliant structure
- Disabled state properly communicated

