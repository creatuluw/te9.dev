# CheckboxGroup Component

A form component for displaying a group of checkbox options within a fieldset with legend and optional description. Supports multiple selections. Follows the gray-html design system styling.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | **required** | The name attribute for the checkbox group (all checkboxes share this name) |
| `legend` | `string` | `undefined` | The legend text displayed above the checkbox options |
| `description` | `string` | `undefined` | Optional description text below the legend |
| `options` | `CheckboxOption[]` | `[]` | Array of checkbox options (see CheckboxOption interface below) |
| `value` | `string[]` | `[]` | Array of selected values (controlled) |
| `layout` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction of checkbox options |
| `disabled` | `boolean` | `false` | Disables the entire checkbox group |
| `class` | `string` | `''` | Additional CSS classes |
| `children` | `Snippet` | `undefined` | Children snippet (used when options array is empty) |
| `onchange` | `(event: Event) => void` | `undefined` | Change event handler |

## CheckboxOption Interface

```typescript
interface CheckboxOption {
	id: string;        // Unique ID for the checkbox input (used for label association)
	label: string;     // Display label text
	value: string;     // The value submitted with the form
	disabled?: boolean; // Whether this specific option is disabled
}
```

## Usage

The CheckboxGroup component wraps checkbox inputs in a semantic `<fieldset>` with an optional `<legend>` and description. You can either provide options as a prop array or use the children snippet for custom checkbox inputs. Unlike RadioGroup, CheckboxGroup supports multiple selections.

## Examples

### Basic Usage with Options Array

```svelte
<script>
  import { CheckboxGroup } from '$lib/components';
  
  let selectedMethods = $state(['email']);
  
  const notificationMethods = [
    { id: 'email', label: 'Email', value: 'email' },
    { id: 'sms', label: 'Phone (SMS)', value: 'sms' },
    { id: 'push', label: 'Push notification', value: 'push' }
  ];
</script>

<CheckboxGroup
  name="notification-method"
  legend="Notifications"
  description="How do you prefer to receive notifications? (Select all that apply)"
  options={notificationMethods}
  value={selectedMethods}
  onchange={(e) => {
    const checked = e.currentTarget.checked;
    const value = e.currentTarget.value;
    if (checked) {
      selectedMethods = [...selectedMethods, value];
    } else {
      selectedMethods = selectedMethods.filter(v => v !== value);
    }
  }}
/>
```

### Horizontal Layout

```svelte
<CheckboxGroup
  name="preferences"
  legend="Preferences"
  options={[
    { id: 'option1', label: 'Option 1', value: 'opt1' },
    { id: 'option2', label: 'Option 2', value: 'opt2' },
    { id: 'option3', label: 'Option 3', value: 'opt3' }
  ]}
  layout="horizontal"
/>
```

### Vertical Layout

```svelte
<CheckboxGroup
  name="preferences"
  legend="Preferences"
  options={[
    { id: 'option1', label: 'Option 1', value: 'opt1' },
    { id: 'option2', label: 'Option 2', value: 'opt2' },
    { id: 'option3', label: 'Option 3', value: 'opt3' }
  ]}
  layout="vertical"
/>
```

### Custom Checkbox Options with Children Snippet

```svelte
<CheckboxGroup name="custom-options" legend="Custom Options">
  <div class="flex items-center">
    <input
      id="custom1"
      type="checkbox"
      name="custom-options"
      value="custom1"
      class="relative size-4 appearance-none rounded border border-zinc-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 checked:before:absolute checked:before:inset-0 checked:before:flex checked:before:items-center checked:before:justify-center checked:before:text-white checked:before:text-xs checked:before:font-bold checked:before:content-['✓'] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    />
    <label for="custom1" class="ml-3 block text-sm/6 font-medium text-zinc-900">
      Custom Option 1
    </label>
  </div>
  <!-- More custom options... -->
</CheckboxGroup>
```

### With Disabled Options

```svelte
<CheckboxGroup
  name="status"
  legend="Status"
  options={[
    { id: 'active', label: 'Active', value: 'active' },
    { id: 'pending', label: 'Pending', value: 'pending', disabled: true },
    { id: 'inactive', label: 'Inactive', value: 'inactive' }
  ]}
/>
```

### Disabled Checkbox Group

```svelte
<CheckboxGroup
  name="status"
  legend="Status"
  options={options}
  disabled={true}
/>
```

### Controlled Component

```svelte
<script>
  let selectedValues = $state(['option1']);
  
  const options = [
    { id: 'opt1', label: 'Option 1', value: 'option1' },
    { id: 'opt2', label: 'Option 2', value: 'option2' },
    { id: 'opt3', label: 'Option 3', value: 'option3' }
  ];
</script>

<CheckboxGroup
  name="controlled"
  legend="Controlled Checkbox Group"
  options={options}
  value={selectedValues}
  onchange={(e) => {
    const checked = e.currentTarget.checked;
    const value = e.currentTarget.value;
    if (checked) {
      selectedValues = [...selectedValues, value];
    } else {
      selectedValues = selectedValues.filter(v => v !== value);
    }
  }}
/>
```

## Styling Notes

- Uses zinc color palette for borders (`zinc-300`) and text (`zinc-900`, `zinc-600`)
- Checkboxes use indigo for checked state (`indigo-600`) to match interactive element patterns
- Legend uses Aspekta font (`font-aspekta`)
- Labels use Inter font (`font-inter`)
- Responsive: Horizontal layout stacks vertically on mobile, becomes horizontal on `sm` breakpoint and above
- Checkboxes are 16px (`size-4`) with proper focus states
- Checked state displays a checkmark (✓) using CSS `content` property

## Accessibility

- Uses semantic `<fieldset>` and `<legend>` elements for proper form grouping
- Checkbox inputs are properly associated with labels via `id` and `for` attributes
- Focus states are visible with indigo outline
- Disabled states are properly indicated
- The entire fieldset can be disabled
- Supports multiple selections (unlike RadioGroup)

