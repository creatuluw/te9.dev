# RadioGroup Component

A form component for displaying a group of radio button options within a fieldset with legend and optional description. Follows the gray-html design system styling.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | **required** | The name attribute for the radio group (all radios share this name) |
| `legend` | `string` | `undefined` | The legend text displayed above the radio options |
| `description` | `string` | `undefined` | Optional description text below the legend |
| `options` | `RadioOption[]` | `[]` | Array of radio options (see RadioOption interface below) |
| `value` | `string` | `undefined` | The currently selected value (controlled) |
| `layout` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction of radio options |
| `disabled` | `boolean` | `false` | Disables the entire radio group |
| `class` | `string` | `''` | Additional CSS classes |
| `onchange` | `(event: Event) => void` | `undefined` | Change event handler |

## RadioOption Interface

```typescript
interface RadioOption {
	id: string;        // Unique ID for the radio input (used for label association)
	label: string;     // Display label text
	value: string;     // The value submitted with the form
	disabled?: boolean; // Whether this specific option is disabled
}
```

## Usage

The RadioGroup component wraps radio inputs in a semantic `<fieldset>` with an optional `<legend>` and description. You can either provide options as a prop array or use the default slot for custom radio inputs.

## Examples

### Basic Usage with Options Array

```svelte
<script>
  import { RadioGroup } from '$lib/components';
  
  let selectedMethod = $state('email');
  
  const notificationMethods = [
    { id: 'email', label: 'Email', value: 'email' },
    { id: 'sms', label: 'Phone (SMS)', value: 'sms' },
    { id: 'push', label: 'Push notification', value: 'push' }
  ];
</script>

<RadioGroup
  name="notification-method"
  legend="Notifications"
  description="How do you prefer to receive notifications?"
  options={notificationMethods}
  value={selectedMethod}
  onchange={(e) => selectedMethod = e.currentTarget.value}
/>
```

### Horizontal Layout

```svelte
<RadioGroup
  name="preference"
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
<RadioGroup
  name="preference"
  legend="Preferences"
  options={[
    { id: 'option1', label: 'Option 1', value: 'opt1' },
    { id: 'option2', label: 'Option 2', value: 'opt2' },
    { id: 'option3', label: 'Option 3', value: 'opt3' }
  ]}
  layout="vertical"
/>
```

### Custom Radio Options with Slot

```svelte
<RadioGroup name="custom-options" legend="Custom Options">
  <div class="flex items-center">
    <input
      id="custom1"
      type="radio"
      name="custom-options"
      value="custom1"
      class="relative size-4 appearance-none rounded-full border border-zinc-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    />
    <label for="custom1" class="ml-3 block text-sm/6 font-medium text-zinc-900">
      Custom Option 1
    </label>
  </div>
  <!-- More custom options... -->
</RadioGroup>
```

### With Disabled Options

```svelte
<RadioGroup
  name="status"
  legend="Status"
  options={[
    { id: 'active', label: 'Active', value: 'active' },
    { id: 'pending', label: 'Pending', value: 'pending', disabled: true },
    { id: 'inactive', label: 'Inactive', value: 'inactive' }
  ]}
/>
```

### Disabled Radio Group

```svelte
<RadioGroup
  name="status"
  legend="Status"
  options={options}
  disabled={true}
/>
```

### Controlled Component

```svelte
<script>
  let selectedValue = $state('option1');
  
  const options = [
    { id: 'opt1', label: 'Option 1', value: 'option1' },
    { id: 'opt2', label: 'Option 2', value: 'option2' }
  ];
</script>

<RadioGroup
  name="controlled"
  legend="Controlled Radio Group"
  options={options}
  value={selectedValue}
  onchange={(e) => selectedValue = e.currentTarget.value}
/>
```

## Styling Notes

- Uses zinc color palette for borders (`zinc-300`) and text (`zinc-900`, `zinc-600`)
- Radio buttons use indigo for checked state (`indigo-600`) to match interactive element patterns
- Legend uses Aspekta font (`font-aspekta`)
- Labels use Inter font (`font-inter`)
- Responsive: Horizontal layout stacks vertically on mobile, becomes horizontal on `sm` breakpoint and above
- Radio buttons are 16px (`size-4`) with proper focus states

## Accessibility

- Uses semantic `<fieldset>` and `<legend>` elements for proper form grouping
- Radio inputs are properly associated with labels via `id` and `for` attributes
- Focus states are visible with indigo outline
- Disabled states are properly indicated
- The entire fieldset can be disabled

