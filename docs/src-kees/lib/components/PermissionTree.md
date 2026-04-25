# PermissionTree Component

A hierarchical tree component for managing permission assignments with route pattern grouping.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `permissions` | `Permission[]` | Required | All available permissions |
| `selectedPermissions` | `number[]` | `[]` | Currently selected permission IDs |
| `onchange` | `(selectedIds: number[]) => void` | `undefined` | Change handler |
| `readonly` | `boolean` | `false` | Readonly mode - no interaction |
| `showActions` | `boolean` | `true` | Show action-level badges |
| `class` | `string` | `''` | Additional CSS classes |

## Features

- **Hierarchical Structure**: Automatically groups permissions by route patterns
- **Expand/Collapse**: Interactive tree navigation with expand all/collapse all
- **Search**: Filter permissions by route or description
- **Bulk Selection**: Select/deselect all permissions in a node
- **Action Badges**: Visual indication of permission actions (read, write, delete, execute)
- **Selection Counter**: Shows how many permissions are selected
- **Readonly Mode**: Display-only mode for viewing assigned permissions

## Permission Interface

```typescript
interface Permission {
  id: number;
  route: string;
  actions: string[];  // ['read', 'write', 'delete', 'execute']
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}
```

## Usage

### Basic Usage

```svelte
<script>
  import { PermissionTree } from '$lib/components';
  import type { Permission } from '$lib/schemas/auth';
  
  let permissions: Permission[] = [
    { id: 1, route: '/admin/users', actions: ['read', 'write'], description: 'Manage users' },
    { id: 2, route: '/admin/roles', actions: ['read', 'write', 'delete'], description: 'Manage roles' },
    { id: 3, route: '/cases', actions: ['read'], description: 'View cases' }
  ];
  
  let selectedIds = $state<number[]>([1]);
  
  function handleChange(ids: number[]) {
    selectedIds = ids;
    console.log('Selected permissions:', ids);
  }
</script>

<PermissionTree 
  {permissions}
  selectedPermissions={selectedIds}
  onchange={handleChange}
/>
```

### Readonly Mode

```svelte
<script>
  import { PermissionTree } from '$lib/components';
  
  // Display assigned permissions without editing
</script>

<PermissionTree 
  {permissions}
  selectedPermissions={assignedPermissionIds}
  readonly
/>
```

### Without Action Badges

```svelte
<PermissionTree 
  {permissions}
  selectedPermissions={selectedIds}
  onchange={handleChange}
  showActions={false}
/>
```

### In a Form

```svelte
<script>
  import { PermissionTree } from '$lib/components';
  import Button from '$lib/components/Button.svelte';
  
  let selectedPermissions = $state<number[]>([]);
  
  async function handleSave() {
    // Save selected permissions
    await roleService.assignPermissions(roleId, selectedPermissions);
  }
</script>

<form onsubmit={handleSave}>
  <div class="mb-4">
    <label class="block text-sm font-medium text-zinc-900 mb-2">
      Permissions
    </label>
    <PermissionTree 
      {permissions}
      selectedPermissions={selectedPermissions}
      onchange={(ids) => selectedPermissions = ids}
    />
  </div>
  
  <Button type="submit">Save Role</Button>
</form>
```

## Tree Structure

The component automatically organizes permissions into a hierarchical tree based on route patterns:

```
/
├── admin/
│   ├── users (read, write, delete)
│   ├── roles (read, write, delete)
│   └── permissions (read, write, delete)
├── cases/
│   ├── / (read, write, execute)
│   └── [id] (read, write, delete)
└── processes/
    └── / (read, write)
```

## Action Badge Colors

- **read**: Blue (`bg-blue-100 text-blue-800`)
- **write**: Green (`bg-green-100 text-green-800`)
- **delete**: Red (`bg-red-100 text-red-800`)
- **execute**: Purple (`bg-purple-100 text-purple-800`)

## Styling

The component uses:
- Zinc color palette for borders and backgrounds
- Aspekta font for route names
- Inter font for descriptions
- Lucide icons for expand/collapse
- Smooth transitions and hover effects

## Keyboard Navigation

- Click expand/collapse icons to navigate tree
- Use search to quickly find permissions
- Checkboxes are keyboard accessible

## Best Practices

1. **Load permissions once**: Fetch all permissions at component initialization
2. **Track selection separately**: Store selected IDs in parent component state
3. **Handle changes**: Use the `onchange` callback to update your data
4. **Group logically**: Ensure route patterns are consistent for proper grouping
5. **Provide descriptions**: Add meaningful descriptions to help users understand permissions

## Example with Role Management

```svelte
<script>
  import { PermissionTree } from '$lib/components';
  import * as roleService from '$lib/services/roleService';
  import * as permissionService from '$lib/services/permissionService';
  
  let allPermissions = $state<Permission[]>([]);
  let selectedPermissions = $state<number[]>([]);
  
  // Load all permissions
  onMount(async () => {
    const result = await permissionService.getAllPermissions();
    if (result.success) {
      allPermissions = result.value;
    }
  });
  
  // Load role's current permissions
  async function loadRolePermissions(roleId: number) {
    const result = await roleService.getRolePermissions(roleId);
    if (result.success) {
      selectedPermissions = result.value.map(p => p.id);
    }
  }
  
  // Save permission changes
  async function savePermissions(roleId: number, permissionIds: number[]) {
    await roleService.assignPermissions(roleId, permissionIds);
  }
</script>

<PermissionTree 
  permissions={allPermissions}
  selectedPermissions={selectedPermissions}
  onchange={(ids) => selectedPermissions = ids}
/>
```

