# FileUpload Component

A flexible file upload component that supports both simple button-style uploads and drag-and-drop functionality with file validation.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'simple' \| 'drag-drop'` | `'drag-drop'` | The visual style of the upload component |
| `size` | `'default' \| 'sm' \| 'lg'` | `'default'` | Size variant (currently affects spacing) |
| `accept` | `string` | `undefined` | HTML accept attribute for file input (e.g., "image/*", ".pdf,.doc") |
| `multiple` | `boolean` | `false` | Allow multiple file selection |
| `disabled` | `boolean` | `false` | Disable the file upload component |
| `maxSize` | `number` | `undefined` | Maximum file size in bytes |
| `acceptedFileTypes` | `string[]` | `undefined` | Array of accepted file types (e.g., ["image/png", ".jpg", ".pdf"]) |
| `label` | `string` | `undefined` | Label text displayed above the component |
| `description` | `string` | `undefined` | Description text below the upload area |
| `placeholder` | `string` | `'Upload a file'` | Placeholder text in the upload button/link |
| `class` | `string` | `''` | Additional CSS classes |
| `onchange` | `(files: FileList \| null) => void` | `undefined` | Callback fired when files are selected |
| `onerror` | `(error: string) => void` | `undefined` | Callback fired when validation fails |

## Variants

### Simple

A button-style file upload that opens the file picker when clicked:

```svelte
<FileUpload variant="simple" placeholder="Choose File" />
```

### Drag-Drop

A drag-and-drop area with visual feedback when dragging files:

```svelte
<FileUpload variant="drag-drop" />
```

## Examples

### Basic Usage

```svelte
<FileUpload 
  label="Upload Document"
  description="PNG, JPG, GIF up to 10MB"
  onchange={(files) => {
    console.log('Files selected:', files);
  }}
/>
```

### Simple Button Style

```svelte
<FileUpload 
  variant="simple"
  placeholder="Choose File"
  label="Profile Photo"
/>
```

### With File Type Restrictions

```svelte
<FileUpload 
  accept="image/*"
  acceptedFileTypes={['image/png', 'image/jpeg', '.jpg', '.png']}
  description="PNG or JPG images only"
  onchange={(files) => {
    if (files) {
      // Handle files
    }
  }}
/>
```

### With File Size Limit

```svelte
<FileUpload 
  maxSize={10 * 1024 * 1024} // 10MB
  description="Files up to 10MB"
  onerror={(error) => {
    console.error('Upload error:', error);
  }}
/>
```

### Multiple Files

```svelte
<FileUpload 
  multiple
  label="Upload Multiple Files"
  placeholder="Choose Files"
  onchange={(files) => {
    if (files) {
      console.log(`${files.length} files selected`);
    }
  }}
/>
```

### With Validation

```svelte
<FileUpload 
  accept=".pdf,.doc,.docx"
  acceptedFileTypes={['.pdf', '.doc', '.docx', 'application/pdf']}
  maxSize={5 * 1024 * 1024} // 5MB
  label="Upload Document"
  description="PDF or Word documents, max 5MB"
  onchange={(files) => {
    console.log('Valid files:', files);
  }}
  onerror={(error) => {
    alert(error);
  }}
/>
```

### Disabled State

```svelte
<FileUpload 
  disabled
  label="Upload (Disabled)"
  description="Upload is currently disabled"
/>
```

## Features

- **Drag and Drop Support**: Visual feedback when dragging files over the upload area
- **File Validation**: Validate file types and sizes before accepting
- **Multiple Files**: Support for selecting multiple files
- **File List Display**: Shows selected files with size information (drag-drop variant)
- **Error Handling**: Displays validation errors and provides error callbacks
- **Keyboard Accessible**: Supports keyboard navigation and activation
- **Customizable**: Accept, multiple, disabled, and styling options

## Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Focus indicators

## Styling

The component uses the zinc color palette and follows the design system:
- Primary text: `text-zinc-900`
- Secondary text: `text-zinc-600`
- Borders: `border-zinc-300` / `border-zinc-200`
- Backgrounds: `bg-white`, `bg-zinc-50`

## Notes

- File size is displayed in human-readable format (Bytes, KB, MB, GB)
- The `acceptedFileTypes` array can include MIME types (e.g., "image/png") or file extensions (e.g., ".png")
- When both `accept` and `acceptedFileTypes` are provided, `acceptedFileTypes` takes precedence for validation
- Selected files are displayed in the drag-drop variant, showing name and size
- Files can be removed individually when multiple files are selected

