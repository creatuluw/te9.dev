# DataTable Component

A feature-rich data table component with sorting, pagination, row selection, and inline actions.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `Column[]` | Required | Array of column definitions |
| `data` | `any[]` | Required | Array of data rows |
| `selectable` | `boolean` | `false` | Enable row selection with checkboxes |
| `actions` | `Action[]` | `[]` | Array of row actions |
| `onrowclick` | `(row: any) => void` | `undefined` | Handler for row clicks |
| `onsort` | `(key: string, direction: 'asc' \| 'desc') => void` | `undefined` | Sort handler |
| `paginated` | `boolean` | `false` | Enable pagination |
| `itemsPerPage` | `number` | `10` | Items per page (if paginated) |
| `currentPage` | `number` | `1` | Current page number |
| `onpagechange` | `(page: number) => void` | `undefined` | Page change handler |
| `emptyMessage` | `string` | `'Geen data beschikbaar'` | Message shown when no data |
| `class` | `string` | `''` | Additional CSS classes |

## Column Interface

```typescript
interface Column {
  key: string;              // Key to access data in row object
  label: string;            // Column header label
  sortable?: boolean;       // Enable sorting for this column
  width?: string;           // Column width (e.g., '150px', '20%')
  align?: 'left' | 'center' | 'right';  // Text alignment
  render?: (value: any, row: any) => string;  // Custom render function
}
```

## Action Interface

```typescript
interface Action {
  label: string;                    // Action label
  icon?: any;                       // Lucide icon component
  variant?: 'default' | 'danger' | 'ghost';  // Button variant
  onclick: (row: any) => void;      // Action handler
  show?: (row: any) => boolean;     // Conditional display function
}
```

## Features

- **Sortable Columns**: Click column headers to sort (asc/desc toggle)
- **Row Selection**: Checkbox selection with select all
- **Pagination**: Built-in pagination with page info
- **Inline Actions**: Action buttons per row with conditional rendering
- **Custom Rendering**: Custom cell render functions
- **Responsive**: Horizontal scrolling for many columns
- **Empty State**: Customizable empty state message
- **Row Click**: Optional row click handler

## Usage

### Basic Table

```svelte
<script>
  import { DataTable } from '$lib/components';
  
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role' }
  ];
  
  const data = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' }
  ];
</script>

<DataTable {columns} {data} />
```

### With Actions and Pagination

```svelte
<script>
  import { DataTable } from '$lib/components';
  import { Edit, Trash } from 'lucide-svelte';
  
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Status', align: 'center' }
  ];
  
  const actions = [
    {
      label: 'Edit',
      icon: Edit,
      variant: 'ghost',
      onclick: (row) => console.log('Edit', row)
    },
    {
      label: 'Delete',
      icon: Trash,
      variant: 'danger',
      onclick: (row) => console.log('Delete', row),
      show: (row) => !row.is_system  // Only show if not system record
    }
  ];
  
  let currentPage = $state(1);
</script>

<DataTable 
  {columns} 
  {data} 
  {actions}
  paginated
  itemsPerPage={20}
  {currentPage}
  onpagechange={(page) => currentPage = page}
/>
```

### With Custom Rendering

```svelte
<script>
  import { DataTable } from '$lib/components';
  import Label from '$lib/components/Label.svelte';
  
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => {
        const variant = value === 'active' ? 'success' : 'default';
        return `<span class="badge badge-${variant}">${value}</span>`;
      }
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value) => new Date(value).toLocaleDateString('nl-NL')
    }
  ];
</script>

<DataTable {columns} {data} />
```

### With Row Selection

```svelte
<script>
  import { DataTable } from '$lib/components';
  
  let selectedRows = $state<Set<any>>(new Set());
  
  function handleRowClick(row) {
    console.log('Clicked row:', row);
  }
</script>

<DataTable 
  {columns} 
  {data}
  selectable
  onrowclick={handleRowClick}
/>
```

### With Sorting

```svelte
<script>
  import { DataTable } from '$lib/components';
  
  let sortedData = $state([...data]);
  
  function handleSort(key: string, direction: 'asc' | 'desc') {
    sortedData = [...sortedData].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }
</script>

<DataTable 
  {columns} 
  data={sortedData}
  onsort={handleSort}
/>
```

## Styling

The component uses:
- Zinc color palette for borders and backgrounds
- Aspekta font for headers
- Inter font for body text
- Hover effects on rows
- Shadow-xs for container

All styling follows the gray-html design system.

## Accessibility

- Semantic HTML table structure
- Keyboard navigation support
- ARIA labels on interactive elements
- Proper heading hierarchy

