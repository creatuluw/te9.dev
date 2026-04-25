# DateRangePicker Component

A date range picker component with from/to date inputs. Uses two DatePicker components side by side with validation to ensure the 'to' date is not before the 'from' date.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fromDate` | `string \| null` | `null` | Start date in YYYY-MM-DD format (bindable) |
| `toDate` | `string \| null` | `null` | End date in YYYY-MM-DD format (bindable) |
| `fromPlaceholder` | `string` | `'Van datum'` | Placeholder text for from date |
| `toPlaceholder` | `string` | `'Tot datum'` | Placeholder text for to date |
| `class` | `string` | `''` | Additional CSS classes |
| `onchange` | `(fromDate: string \| null, toDate: string \| null) => void` | `undefined` | Called when either date value changes |
| `isActive` | `boolean` | `false` | Whether the filter is currently active (shows clear button) |

## Features

- **Two DatePickers**: Side-by-side date inputs for from and to dates
- **Date Validation**: Automatically ensures 'to' date is not before 'from' date
- **Clear Button**: Shows an X button when either date is selected to clear both dates
- **Database Compatible**: Uses YYYY-MM-DD format (ISO 8601 date format)
- **URL Parameter Friendly**: Perfect for storing filter state in URL params

## Date Format

Both dates use **YYYY-MM-DD** format (e.g., "2025-01-15"), which is:
- The ISO 8601 standard date format
- Compatible with PostgreSQL DATE columns
- Compatible with most database systems
- The native format for HTML5 date inputs

## Validation Behavior

The component automatically handles date range validation:

1. If user selects a 'from' date **after** the current 'to' date, the 'to' date is cleared
2. If user selects a 'to' date **before** the current 'from' date, the 'from' date is cleared
3. DatePicker `min`/`max` props prevent invalid selections in the calendar

## Examples

### Basic Usage

```svelte
<script>
  import { DateRangePicker } from '$lib/components';
  
  let fromDate = $state(null);
  let toDate = $state(null);
</script>

<DateRangePicker 
  bind:fromDate={fromDate} 
  bind:toDate={toDate} 
/>
```

### With Change Handler

```svelte
<script>
  import { DateRangePicker } from '$lib/components';
  
  let fromDate = $state(null);
  let toDate = $state(null);
  
  function handleDateRangeChange(from: string | null, to: string | null) {
    console.log('Date range:', from, 'to', to);
    // Update URL params, trigger filter, etc.
  }
</script>

<DateRangePicker 
  bind:fromDate={fromDate} 
  bind:toDate={toDate}
  onchange={handleDateRangeChange}
/>
```

### With Default Values

```svelte
<script>
  import { DateRangePicker } from '$lib/components';
  
  // Last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  let fromDate = $state(thirtyDaysAgo.toISOString().split('T')[0]);
  let toDate = $state(today.toISOString().split('T')[0]);
</script>

<DateRangePicker 
  bind:fromDate={fromDate} 
  bind:toDate={toDate}
/>
```

### In Filter UI (URL Params)

```svelte
<script>
  import { DateRangePicker } from '$lib/components';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let filterDateFrom = $state<string | null>(null);
  let filterDateTo = $state<string | null>(null);
  
  onMount(() => {
    // Load from URL params
    const urlParams = $page.url.searchParams;
    filterDateFrom = urlParams.get('dateFrom');
    filterDateTo = urlParams.get('dateTo');
  });
  
  function handleDateRangeChange(from: string | null, to: string | null) {
    filterDateFrom = from;
    filterDateTo = to;
    
    // Update URL params
    const params = new URLSearchParams($page.url.searchParams);
    if (from) {
      params.set('dateFrom', from);
    } else {
      params.delete('dateFrom');
    }
    if (to) {
      params.set('dateTo', to);
    } else {
      params.delete('dateTo');
    }
    
    goto(`${$page.url.pathname}?${params.toString()}`, { 
      replaceState: true, 
      noScroll: true 
    });
  }
</script>

<div>
  <label class="block text-sm font-medium text-zinc-700 mb-1">
    Datum bereik
  </label>
  <DateRangePicker 
    bind:fromDate={filterDateFrom}
    bind:toDate={filterDateTo}
    fromPlaceholder="Van datum"
    toPlaceholder="Tot datum"
    onchange={handleDateRangeChange}
    isActive={filterDateFrom !== null || filterDateTo !== null}
  />
</div>
```

### With Custom Placeholders

```svelte
<script>
  import { DateRangePicker } from '$lib/components';
  
  let startDate = $state(null);
  let endDate = $state(null);
</script>

<DateRangePicker 
  bind:fromDate={startDate}
  bind:toDate={endDate}
  fromPlaceholder="Start date"
  toPlaceholder="End date"
/>
```

## Styling

The component uses a flexible layout with two date pickers side by side:

```svelte
<DateRangePicker 
  bind:fromDate={fromDate}
  bind:toDate={toDate}
  class="w-full"
/>
```

## Use Cases

Perfect for:
- **Filtering data by date range** - Filter work items, tasks, or events within a time period
- **Report date selection** - Select start and end dates for reports
- **Search filters** - Add temporal filtering to search interfaces
- **Analytics dashboards** - Select time ranges for data visualization
- **Booking systems** - Select check-in and check-out dates

## Accessibility

- Keyboard navigation support (inherited from DatePicker)
- Clear button with proper ARIA label
- Screen reader friendly

## Related Components

- **DatePicker** - Single date selection
- **Select** - Dropdown selection (used for other filters)
- **SearchInput** - Text search (often used alongside date range filters)

