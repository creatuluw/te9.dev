# FileList Component

A table-based component for displaying a list of files with name, type, and action buttons.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `files` | `string[] \| FileItem[]` | **required** | Array of file URLs (strings) or file objects with extended information |
| `title` | `string` | `undefined` | Optional title/label to display above the file list |
| `showDelete` | `boolean` | `false` | Whether to show delete action button |
| `onopen` | `(url: string, file?: FileItem) => void` | `undefined` | Callback when a file is opened/clicked |
| `ondelete` | `(url: string, file?: FileItem) => void` | `undefined` | Callback when a file is deleted (only called if showDelete is true) |
| `deleteDisabled` | `boolean` | `false` | Whether delete action is disabled |
| `class` | `string` | `''` | Additional CSS classes |

## FileItem Interface

When using file objects instead of strings, you can provide:

```typescript
interface FileItem {
  url: string;        // Required: File URL
  name?: string;      // Optional: Display name (defaults to extracted filename)
  size?: number;      // Optional: File size in bytes
  type?: string;      // Optional: File type/extension (defaults to extracted extension)
}
```

## Variants

### Basic Usage (URLs only)
Display a simple list of file URLs:

```svelte
<script>
  import { FileList } from '$lib/components';
  
  const files = [
    'https://example.com/file1.pdf',
    'https://example.com/file2.docx'
  ];
</script>

<FileList {files} />
```

### With Title
Add a title above the file list:

```svelte
<FileList files={files} title="Bijlagen:" />
```

### With Delete Action
Show delete buttons for each file:

```svelte
<script>
  function handleDelete(url: string) {
    console.log('Delete:', url);
    // Remove file from list
  }
</script>

<FileList 
  files={files} 
  showDelete={true}
  ondelete={handleDelete}
/>
```

### With File Objects
Use file objects for more control:

```svelte
<script>
  import { FileList, type FileItem } from '$lib/components';
  
  const files: FileItem[] = [
    { 
      url: 'https://example.com/document.pdf',
      name: 'My Document',
      size: 1024000,
      type: 'PDF'
    },
    {
      url: 'https://example.com/image.jpg',
      name: 'Photo',
      size: 512000,
      type: 'JPG'
    }
  ];
  
  function handleOpen(url: string, file?: FileItem) {
    console.log('Opening:', file?.name || url);
    window.open(url, '_blank');
  }
</script>

<FileList 
  files={files} 
  title="Attachments"
  onopen={handleOpen}
/>
```

### Custom Open Handler
Override the default open behavior:

```svelte
<script>
  function handleOpen(url: string) {
    // Custom logic, e.g., download instead of open
    window.location.href = url;
  }
</script>

<FileList files={files} onopen={handleOpen} />
```

## Examples

### Read-only File List
Display files without delete option:

```svelte
<FileList 
  files={attachments} 
  title="Bijlagen:"
/>
```

### Editable File List
Allow users to delete files:

```svelte
<script>
  let attachments = $state(['url1', 'url2']);
  
  function handleDelete(url: string) {
    attachments = attachments.filter(f => f !== url);
  }
</script>

<FileList 
  files={attachments}
  showDelete={true}
  ondelete={handleDelete}
/>
```

### With Custom Styling
Add custom classes:

```svelte
<FileList 
  files={files}
  class="mt-4"
/>
```

## Features

- **Automatic filename extraction**: Extracts filename from URL if name not provided
- **File type detection**: Automatically detects file extension from filename
- **Clickable filenames**: Filenames are clickable buttons that open files
- **External link icon**: Each file has an external link icon button
- **Delete action**: Optional delete button with icon
- **Hover effects**: Table rows have hover effects for better UX
- **Responsive**: Table layout adapts to content

## Styling

The component uses:
- Zinc color palette (`zinc-900`, `zinc-600`, `zinc-200`)
- Aspekta font for headings
- Inter font for body text
- Tailwind utility classes
- Consistent spacing and borders

## Accessibility

- Table structure with proper headers
- Button elements with descriptive titles
- Keyboard navigation support
- Screen reader friendly labels




























