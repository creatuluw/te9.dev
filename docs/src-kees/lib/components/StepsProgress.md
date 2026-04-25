# StepsProgress Component

A progress indicator component that displays a series of steps, showing completed, current, and upcoming steps. Uses checkmark icons for completed steps and a filled dot for the current step. Follows the gray-html design system with zinc color palette.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | `Step[]` | **required** | Array of step objects (see Step interface below) |
| `currentStep` | `number` | `0` | Current step index (0-based) |
| `class` | `string` | `''` | Additional CSS classes |

## Step Interface

| Property | Type | Description |
|----------|------|-------------|
| `label` | `string` | Step label (used for screen reader accessibility) |
| `href` | `string?` | Optional href for navigation (makes step clickable) |
| `onclick` | `(event: MouseEvent, index: number) => void?` | Optional click handler for custom behavior |

## Step States

- **Completed**: Steps before the current step show a checkmark icon with filled zinc-600 background
- **Current**: The active step shows a dot with zinc-600 border
- **Upcoming**: Steps after the current step show an empty circle with zinc-300 border

## Examples

### Basic Usage

```svelte
<script>
  import { StepsProgress } from '$lib/components';
  
  const steps = [
    { label: 'Step 1' },
    { label: 'Step 2' },
    { label: 'Step 3' },
    { label: 'Step 4' },
    { label: 'Step 5' }
  ];
  
  let currentStep = $state(2); // Step 3 is current (0-based index)
</script>

<StepsProgress {steps} {currentStep} />
```

### With Navigation Links

```svelte
<script>
  import { StepsProgress } from '$lib/components';
  
  const steps = [
    { label: 'Personal Info', href: '/steps/1' },
    { label: 'Account Setup', href: '/steps/2' },
    { label: 'Preferences', href: '/steps/3' },
    { label: 'Review', href: '/steps/4' }
  ];
  
  let currentStep = $state(1);
</script>

<StepsProgress {steps} {currentStep} />
```

### With Click Handlers

```svelte
<script>
  import { StepsProgress } from '$lib/components';
  
  const steps = [
    { label: 'Step 1', onclick: (e, i) => console.log('Clicked step', i + 1) },
    { label: 'Step 2', onclick: (e, i) => console.log('Clicked step', i + 1) },
    { label: 'Step 3', onclick: (e, i) => console.log('Clicked step', i + 1) }
  ];
  
  let currentStep = $state(0);
  
  function handleStepClick(event: MouseEvent, index: number) {
    event.preventDefault();
    // Custom logic here
    console.log('Navigating to step', index + 1);
  }
</script>

<StepsProgress {steps} {currentStep} />
```

### Multi-Step Form Progress

```svelte
<script>
  import { StepsProgress } from '$lib/components';
  
  const formSteps = [
    { label: 'Personal Information' },
    { label: 'Contact Details' },
    { label: 'Account Security' },
    { label: 'Review & Submit' }
  ];
  
  let currentFormStep = $state(0);
  
  function goToStep(index: number) {
    currentFormStep = index;
  }
</script>

<StepsProgress
  steps={formSteps.map((step, i) => ({
    ...step,
    onclick: (e) => {
      e.preventDefault();
      goToStep(i);
    }
  }))}
  currentStep={currentFormStep}
/>
```

### Dynamic Step Management

```svelte
<script>
  import { StepsProgress } from '$lib/components';
  
  let steps = $state([
    { label: 'Sign Up' },
    { label: 'Verify Email' },
    { label: 'Complete Profile' },
    { label: 'Get Started' }
  ]);
  
  let currentStep = $state(0);
  
  function nextStep() {
    if (currentStep < steps.length - 1) {
      currentStep++;
    }
  }
  
  function previousStep() {
    if (currentStep > 0) {
      currentStep--;
    }
  }
</script>

<StepsProgress {steps} {currentStep} />
<button onclick={previousStep} disabled={currentStep === 0}>Previous</button>
<button onclick={nextStep} disabled={currentStep === steps.length - 1}>Next</button>
```

## Visual States

### Completed Steps
- Solid zinc-600 background
- White checkmark icon
- Hover: darker zinc-900 background
- Clickable if href or onclick provided

### Current Step
- White background
- Zinc-600 border (2px)
- Zinc-600 filled dot in center
- `aria-current="step"` attribute for accessibility

### Upcoming Steps
- White background
- Zinc-300 border (2px)
- Empty circle (transparent fill)
- Hover: zinc-400 border and subtle zinc-300 dot fill
- Clickable if href or onclick provided

## Connecting Lines

- Lines connect each step horizontally
- Completed sections: zinc-600 color
- Upcoming sections: zinc-200 color
- Responsive spacing: `pr-8` on mobile, `pr-20` on larger screens

## Accessibility

- Uses semantic `<nav>` element with `aria-label="Progress"`
- Uses `<ol role="list">` for ordered list structure
- Each step has `sr-only` label for screen readers
- Current step has `aria-current="step"` attribute
- Keyboard navigation supported via clickable links
- Connecting lines marked with `aria-hidden="true"`

## Styling Notes

- Follows zinc color palette from design system
- Responsive spacing adapts to screen size
- Steps are 32px (size-8) circles
- Connecting lines are 2px (h-0.5) height
- Hover states provide visual feedback
- Smooth transitions on interactive elements

## Use Cases

- Multi-step forms
- Onboarding flows
- Progress tracking
- Wizard interfaces
- Process workflows
- Account setup flows


























