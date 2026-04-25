# Pagination Component

A pagination component that displays page navigation controls with smart page number rendering, responsive mobile/desktop views, and item count information.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | **required** | The currently active page (1-indexed) |
| `totalItems` | `number` | **required** | Total number of items to paginate |
| `itemsPerPage` | `number` | `10` | Number of items displayed per page |
| `class` | `string` | `''` | Additional CSS classes |
| `onPageChange` | `(page: number) => void` | `undefined` | Callback function called when page changes |

## Features

- **Responsive Design**: Mobile-friendly navigation with Previous/Next buttons on small screens, full pagination controls on larger screens
- **Smart Page Numbers**: Automatically shows ellipsis for large page counts, always displays first and last pages
- **Item Range Display**: Shows "Showing X to Y of Z results" on desktop
- **Keyboard Accessible**: Proper ARIA labels and focus states
- **Disabled States**: Previous/Next buttons disabled at boundaries

## Usage

### Basic Usage

```svelte
<script>
  import { Pagination } from '$lib/components';
  
  let currentPage = $state(1);
  const totalItems = 97;
  
  function handlePageChange(page: number) {
    currentPage = page;
    // Fetch data for new page, etc.
  }
</script>

<Pagination 
  {currentPage} 
  {totalItems} 
  itemsPerPage={10}
  onPageChange={handlePageChange}
/>
```

### With Custom Items Per Page

```svelte
<Pagination 
  currentPage={1}
  totalItems={250}
  itemsPerPage={25}
  onPageChange={(page) => console.log('Page:', page)}
/>
```

### Controlled Component

```svelte
<script>
  let page = $state(1);
  const items = Array.from({ length: 156 }, (_, i) => ({ id: i }));
  const itemsPerPage = 10;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  $effect(() => {
    // React to page changes
    console.log(`Navigated to page ${page}`);
  });
</script>

<Pagination 
  currentPage={page}
  totalItems={items.length}
  {itemsPerPage}
  onPageChange={(newPage) => page = newPage}
/>
```

### With Custom Styling

```svelte
<Pagination 
  currentPage={1}
  totalItems={100}
  class="my-8"
/>
```

## Responsive Behavior

### Mobile (< 640px)
- Shows Previous/Next buttons only
- Compact layout for smaller screens

### Desktop (≥ 640px)
- Shows full pagination controls with page numbers
- Displays item range information ("Showing X to Y of Z results")
- Shows up to 7 page numbers with ellipsis for large page counts

## Page Number Logic

The component intelligently displays page numbers:
- **Small page counts (≤7)**: Shows all page numbers
- **Large page counts (>7)**: 
  - Always shows first and last page
  - Shows current page and adjacent pages (±1)
  - Uses ellipsis (...) to indicate skipped pages
  - Shows middle pages (3-8) only on medium+ screens

Example for 10 pages with current page 5:
```
[1] ... [4] [5] [6] ... [10]
```

Example for 10 pages with current page 1:
```
[1] [2] [3] ... [10]
```

## Accessibility

- Uses `aria-label` for navigation
- Uses `aria-current="page"` for current page indicator
- Screen reader text for Previous/Next buttons
- Keyboard navigation support
- Proper focus states with `focus-visible` outlines

## Styling Notes

- Uses zinc color palette (`zinc-900` for active, `zinc-400` for disabled icons)
- Active page uses `bg-zinc-900` with white text
- Hover states use `hover:bg-zinc-50`
- Borders use `border-zinc-200` and `border-zinc-300`
- Typography: `font-aspekta` for page numbers, `font-inter` for text
- Subtle shadow: `shadow-xs` on navigation container

