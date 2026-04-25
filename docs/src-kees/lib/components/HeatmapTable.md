# HeatmapTable Component

A reusable heatmap table component that displays data in a color-coded grid format, similar to GitHub's contribution graph. Perfect for visualizing time-series data like hours per week, activity levels, or any numeric data across time periods.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `Map<string, number>` | Required | Heatmap data with keys in format "YYYY-MM-WW" (year-month-week) and values as numbers |
| `rowLabels` | `string[]` | Required | Array of row labels (e.g., ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"]) |
| `columnLabels` | `string[]` | Required | Array of column labels (e.g., ["Jan 2025", "Feb 2025", ...]) |
| `valueFormatter` | `(value: number) => string` | `(v) => v.toString()` | Optional formatter function for displaying cell values |
| `availabilityData` | `Map<string, number>` | `undefined` | Optional availability data (e.g., available hours per week) |
| `plannedHoursData` | `Map<string, number>` | `undefined` | Optional planned hours data (e.g., planned hours per week) |
| `droppable` | `boolean` | `false` | Whether cells accept drag-and-drop operations |
| `ondrop` | `(rowIndex, columnLabel, fridayDate) => void` | `undefined` | Callback when an item is dropped on a cell |
| `onclick` | `(rowIndex, columnLabel, weekStartDate, weekEndDate) => void` | `undefined` | Callback when a cell is clicked |
| `class` | `string` | `''` | Additional CSS classes to apply to the container |

## Features

- **Color-coded cells**: Orange gradient from light (low values) to dark (high values) based on percentage
- **Hover tooltips**: Shows detailed information when hovering over cells including planned/available hours and date ranges
- **Clickable cells**: Click on a week cell to filter and view items for that specific week
- **Drag-and-drop support**: Optional drag-and-drop to assign items to specific weeks
- **Week filtering**: Automatically filters out past weeks and shows only future weeks
- **Responsive layout**: Horizontal scrolling for many columns
- **Sticky headers**: Row and column headers remain visible when scrolling
- **Accessibility**: ARIA labels and semantic HTML

## Usage

### Basic Example

```svelte
<script>
  import { HeatmapTable } from '$lib/components';
  
  const data = new Map([
    ['2025-01-1', 8],
    ['2025-01-2', 12],
    ['2025-01-3', 5],
    ['2025-02-1', 15],
    ['2025-02-2', 20],
  ]);
  
  const rowLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
  const columnLabels = ['Jan 2025', 'Feb 2025', 'Mrt 2025'];
</script>

<HeatmapTable 
  {data} 
  {rowLabels} 
  {columnLabels}
/>
```

### With Custom Value Formatter

```svelte
<script>
  import { HeatmapTable } from '$lib/components';
  
  const data = new Map([
    ['2025-01-1', 8.5],
    ['2025-01-2', 12.25],
  ]);
  
  const rowLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
  const columnLabels = ['Jan 2025'];
  
  function formatHours(value: number): string {
    return `${value.toFixed(1)}h`;
  }
</script>

<HeatmapTable 
  {data} 
  {rowLabels} 
  {columnLabels}
  valueFormatter={formatHours}
/>
```

### With Custom Classes

```svelte
<HeatmapTable 
  {data} 
  {rowLabels} 
  {columnLabels}
  class="my-custom-class"
/>
```

### With Click Handler

```svelte
<script>
  import { HeatmapTable } from '$lib/components';
  
  const data = new Map([
    ['2025-01-1', 8],
    ['2025-01-2', 12],
  ]);
  
  const rowLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
  const columnLabels = ['Jan 2025'];
  
  function handleCellClick(rowIndex: number, columnLabel: string, weekStartDate: string, weekEndDate: string) {
    console.log('Clicked week:', weekStartDate, 'to', weekEndDate);
    // Filter items by this week
    // weekStartDate and weekEndDate are in YYYY-MM-DD format
  }
</script>

<HeatmapTable 
  {data} 
  {rowLabels} 
  {columnLabels}
  onclick={handleCellClick}
/>
```

## Data Format

The `data` Map uses keys in the format `"YYYY-MM-WW"` where:
- `YYYY` is the 4-digit year
- `MM` is the 2-digit month (01-12)
- `WW` is the week number within the month (1-5)

Example keys:
- `"2025-01-1"` - January 2025, Week 1
- `"2025-02-3"` - February 2025, Week 3
- `"2025-12-5"` - December 2025, Week 5

## Color Scale

The component automatically scales colors based on the min/max values in the data:
- **Zero values**: Light gray background (`bg-zinc-50`)
- **Low values**: Light blue (`bg-blue-50` to `bg-blue-200`)
- **Medium values**: Medium blue (`bg-blue-300` to `bg-blue-400`)
- **High values**: Dark blue (`bg-blue-500`)

Text color automatically adjusts for readability:
- Light backgrounds: Dark text (`text-zinc-900`)
- Dark backgrounds: White text (`text-white`)

## Styling

The component follows the design system:
- Uses `font-aspekta` for headers
- Uses `font-inter` for cell text
- Uses zinc color palette for borders and backgrounds
- Responsive with horizontal scrolling for wide tables

## Accessibility

- Semantic HTML table structure
- ARIA labels on cells
- Keyboard navigation support
- Screen reader friendly

## Notes

- Empty cells (value = 0) display no text but show a light gray background
- The component automatically calculates color intensity based on the data range
- Hover tooltips show formatted values with context (month, week, value)

