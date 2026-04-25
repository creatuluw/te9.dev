# DatePicker Component

A date picker input component with calendar icon, styled according to the gray-html design system. Uses native HTML5 date input for optimal browser support and database compatibility.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string \| null` | `null` | Selected date value in YYYY-MM-DD format (bindable) |
| `placeholder` | `string` | `'Select date'` | Placeholder text |
| `disabled` | `boolean` | `false` | Whether the input is disabled |
| `min` | `string` | `undefined` | Minimum selectable date (YYYY-MM-DD format) |
| `max` | `string` | `undefined` | Maximum selectable date (YYYY-MM-DD format) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Calendar size - controls compactness of calendar dropdown (input field stays the same) |
| `class` | `string` | `''` | Additional CSS classes |
| `id` | `string` | `undefined` | Input element ID |
| `name` | `string` | `undefined` | Input element name (for forms) |
| `required` | `boolean` | `false` | Whether the input is required |
| `onchange` | `(value: string \| null) => void` | `undefined` | Called when date value changes |
| `oninput` | `(event: Event) => void` | `undefined` | Called on input events |

## Features

- **Custom Calendar UI**: Beautiful calendar dropdown with month navigation
- **Database Compatible**: Always outputs dates in YYYY-MM-DD format (ISO 8601 date format)
- **Calendar Icon**: Includes a calendar icon on the left side
- **Multiple Sizes**: Three size variants (`sm`, `md`, `lg`) for different compactness levels
- **Accessible**: Keyboard navigation and screen reader support
- **Validation**: Supports min/max date constraints
- **Form Integration**: Works seamlessly with HTML forms
- **Today Highlighting**: Current date is highlighted
- **Month Navigation**: Easy navigation between months

## Date Format

The component expects and outputs dates in **YYYY-MM-DD** format (e.g., "2025-10-30"), which is:
- The ISO 8601 standard date format
- Compatible with PostgreSQL DATE columns
- Compatible with most database systems
- The native format for HTML5 date inputs

## Examples

### Basic Usage

```svelte
<script>
  import { DatePicker } from '$lib/components';
  
  let selectedDate = $state(null);
</script>

<DatePicker bind:value={selectedDate} />
```

### With Default Value

```svelte
<script>
  import { DatePicker } from '$lib/components';
  
  let selectedDate = $state('2025-10-30');
</script>

<DatePicker bind:value={selectedDate} />
```

### With Min/Max Dates

```svelte
<script>
  import { DatePicker } from '$lib/components';
  
  let selectedDate = $state(null);
  
  // Today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // 30 days from today
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];
</script>

<DatePicker 
  bind:value={selectedDate} 
  min={today}
  max={maxDateStr}
/>
```

### In a Form

```svelte
<script>
  import { DatePicker } from '$lib/components';
  
  let formData = $state({
    startDate: null,
    endDate: null
  });
  
  function handleSubmit() {
    // formData.startDate and formData.endDate are in YYYY-MM-DD format
    console.log('Form data:', formData);
  }
</script>

<form onsubmit={handleSubmit}>
  <div class="space-y-4">
    <div>
      <label for="start-date" class="block text-sm font-medium text-zinc-700 mb-1">
        Start Date
      </label>
      <DatePicker 
        id="start-date"
        name="start_date"
        bind:value={formData.startDate}
        required
      />
    </div>
    
    <div>
      <label for="end-date" class="block text-sm font-medium text-zinc-700 mb-1">
        End Date
      </label>
      <DatePicker 
        id="end-date"
        name="end_date"
        bind:value={formData.endDate}
        min={formData.startDate || undefined}
      />
    </div>
    
    <button type="submit">Submit</button>
  </div>
</form>
```

### With Change Handler

```svelte
<script>
  import { DatePicker } from '$lib/components';
  
  let selectedDate = $state(null);
  
  function handleDateChange(date: string | null) {
    console.log('Date changed to:', date);
    // Perform validation or other logic
    if (date) {
      const selected = new Date(date);
      const today = new Date();
      if (selected < today) {
        console.warn('Selected date is in the past');
      }
    }
  }
</script>

<DatePicker 
  bind:value={selectedDate}
  onchange={handleDateChange}
/>
```

### Disabled State

```svelte
<DatePicker 
  bind:value={selectedDate}
  disabled={true}
/>
```

### With Custom Classes

```svelte
<DatePicker 
  bind:value={selectedDate}
  class="max-w-sm"
/>
```

### Size Variants

The calendar dropdown supports three size variants. The input field stays the same size, only the calendar compactness changes:

```svelte
<script>
  import { DatePicker } from '$lib/components';
  
  let date1 = $state(null);
  let date2 = $state(null);
  let date3 = $state(null);
</script>

<!-- Small (default) - most compact -->
<DatePicker bind:value={date1} size="sm" />

<!-- Medium -->
<DatePicker bind:value={date2} size="md" />

<!-- Large - most spacious -->
<DatePicker bind:value={date3} size="lg" />
```

## Database Integration

When working with databases (e.g., PostgreSQL DATE columns), the component automatically handles the YYYY-MM-DD format:

```svelte
<script>
  import { DatePicker } from '$lib/components';
  import { insertRow } from '$lib/services/api';
  
  let caseData = $state({
    name: '',
    start_date: null
  });
  
  async function createCase() {
    // start_date is already in YYYY-MM-DD format, ready for database
    await insertRow('_bpm_cases', {
      name: caseData.name,
      start_date: caseData.start_date, // e.g., "2025-10-30"
      // ... other fields
    });
  }
</script>

<DatePicker bind:value={caseData.start_date} />
```

## Browser Compatibility

The component works in all modern browsers:
- Chrome/Edge (full support)
- Firefox (full support)
- Safari (full support)
- Mobile browsers (touch-friendly interface)

The custom calendar UI provides a consistent experience across all browsers.

## Styling

The component follows the gray-html design system:
- Zinc color palette for borders and text
- Rounded corners (`rounded-sm`)
- Calendar icon positioned on the left
- Consistent padding and spacing
- Focus states with zinc-500 outline
- Disabled states with zinc-50 background

## Accessibility

- Keyboard navigation (arrow keys, Enter, Escape)
- Screen reader support with proper ARIA labels
- Focus management when calendar opens/closes
- Supports `required` attribute for form validation
- Supports `min` and `max` for date range validation
- Click outside to close calendar
