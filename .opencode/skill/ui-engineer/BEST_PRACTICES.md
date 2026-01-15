# Best Practices and Guidelines

Complete guide for design decisions, code quality, and best practices when working with gray-html design system.

## Table of Contents

- [Component Design Decisions](#component-design-decisions)
  - [When to Create Reusable Components](#when-to-create-reusable-components)
  - [Component API Design](#component-api-design)
  - [Props vs Slots](#props-vs-slots)
- [Accessibility Guidelines](#accessibility-guidelines)
  - [WCAG AA Compliance](#wcag-aa-compliance)
  - [ARIA Attributes](#aria-attributes)
  - [Keyboard Navigation](#keyboard-navigation)
  - [Focus Management](#focus-management)
- [Performance Optimization](#performance-optimization)
  - [Reactivity Best Practices](#reactivity-best-practices)
  - [Component Rendering](#component-rendering)
  - [Bundle Optimization](#bundle-optimization)
- [Code Quality Standards](#code-quality-standards)
  - [TypeScript Guidelines](#typescript-guidelines)
  - [Svelte 5 Patterns](#svelte-5-patterns)
  - [Naming Conventions](#naming-conventions)
- [Testing Strategies](#testing-strategies)
  - [Component Testing](#component-testing)
  - [Integration Testing](#integration-testing)
  - [Accessibility Testing](#accessibility-testing)
- [Design System Integration](#design-system-integration)
  - [Theme Consistency](#theme-consistency)
  - [Color Usage](#color-usage)
  - [Typography Hierarchy](#typography-hierarchy)
  - [Spacing System](#spacing-system)

---

## Component Design Decisions

### When to Create Reusable Components

**DO create reusable components when:**

1. **Used 3+ times** across the application
   - Example: Input components used in multiple forms
   - Example: Badge components used for status indicators

2. **Has complex logic** that shouldn't be repeated
   - Example: Form validation logic
   - Example: Data fetching with loading states

3. **Requires consistent styling** across contexts
   - Example: Button with variants (default, secondary, outline)
   - Example: Alert with error/success/warning variants

4. **Needs accessibility features** (ARIA, keyboard nav)
   - Example: Modal with focus trap and escape handling
   - Example: Custom dropdown with keyboard navigation

5. **Has multiple variants** or states
   - Example: Spinner with sizes (sm, md, lg)
   - Example: UserAvatar with initials fallback

**DO NOT create reusable components when:**

1. **Used only once** in the application
   - Example: Hero section on home page
   - Example: One-off promotional banner

2. **Simple markup** without logic
   - Example: Single `<span class="text-zinc-600">Label</span>`
   - Example: Single `<div class="p-4">Wrapper</div>`

3. **Page-specific structure**
   - Example: Article layout
   - Example: About page content

### Component API Design

**Props API Guidelines:**

```typescript
// ✅ GOOD: Clear, typed, well-documented
interface Props {
  // Required props first
  id: string;
  name: string;
  
  // Optional props with sensible defaults
  variant?: 'default' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  
  // Callback props with clear names
  onclick?: () => void;
  onchange?: (value: string) => void;
  
  // Slot/snippet props at the end
  children?: Snippet;
  header?: Snippet;
  
  // Customization props
  class?: string;
}

// ❌ AVOID: Vague, untyped props
interface Props {
  data: any;  // Avoid 'any'
  config: object;  // Use specific interface
  handler: Function;  // Be specific about signature
}
```

**Default Values Strategy:**

```typescript
// Provide sensible defaults that work in 80% of cases
interface Props {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
}

// Destructure with defaults
let {
  variant = 'default',  // Most common variant
  size = 'default',    // Most common size
  disabled = false,     // Usually not disabled
  fullWidth = false,   // Usually need full width
}: Props = $props();
```

**Props vs Slots**

```typescript
// ✅ Use Props for: Configuration, behavior, data
interface Props {
  variant: 'success' | 'error' | 'warning';
  dismissible: boolean;
  title?: string;
}

// ✅ Use Slots/Snippets for: Content, UI elements
interface Props {
  header?: Snippet;  // Title area content
  children?: Snippet;  // Main content
  footer?: Snippet;  // Action area content
}

// ❌ AVOID: Passing complex data through slots
// Don't pass large objects through slots
// Keep slots for UI/layout, not for data
```

---

## Accessibility Guidelines

### WCAG AA Compliance

**Color Contrast:**

```svelte
<!-- ✅ GOOD: Ensure text contrast ratio ≥ 4.5:1 -->
<button class="bg-zinc-900 text-white">
  High contrast button
</button>

<!-- ❌ AVOID: Low contrast combinations -->
<button class="bg-zinc-300 text-zinc-400">
  Low contrast - fails WCAG AA
</button>

<!-- ✅ Use semantic colors with built-in contrast -->
<Badge variant="success">  <!-- green-100 + green-800 -->
<Badge variant="error">     <!-- red-100 + red-800 -->
```

**Touch Targets:**

```svelte
<!-- ✅ GOOD: Minimum 44x44px for touch -->
<Button class="px-4 py-3">  <!-- 16px + 16px padding + text = ~44px height -->
  Clickable Button
</Button>

<a href="/details" class="inline-block p-4">
  Link with touch target
</a>

<!-- ❌ AVOID: Small touch targets -->
<button class="px-2 py-1">
  Too small for mobile touch
</button>
```

**Text Resizing:**

```svelte
<!-- ✅ GOOD: Support 200% zoom without breaking -->
<div class="container mx-auto px-4 py-8">
  <!-- Fluid widths, not fixed -->
  <div class="w-full max-w-4xl">
    Content that scales
  </div>
</div>

<!-- ❌ AVOID: Fixed widths that break on zoom -->
<div class="w-[800px]">
  Fixed width - breaks at 200% zoom
</div>
```

### ARIA Attributes

**Required ARIA:**

```svelte
<!-- ✅ Icon-only buttons need aria-label -->
<button aria-label="Close menu">
  <X class="w-5 h-5" />
</button>

<!-- ✅ Status indicators need role and aria-live -->
<Alert role="alert" aria-live="polite">
  Message
</Alert>

<!-- ✅ Tabs need proper roles -->
<div role="tablist">
  <button role="tab" aria-selected={isActive}>Tab 1</button>
  <button role="tab" aria-selected={!isActive}>Tab 2</button>
</div>
<div role="tabpanel">
  Content
</div>

<!-- ✅ Loading states need role -->
<div role="status" aria-label="Loading">
  <Spinner />
</div>
```

**Semantic HTML:**

```svelte
<!-- ✅ Use semantic elements -->
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Article Title</h1>
  </article>
</main>

<footer>
  <p>© 2025 Company</p>
</footer>

<!-- ❌ AVOID: Div soup -->
<div>
  <div>
    <div>Title</div>
  </div>
</div>
```

### Keyboard Navigation

**Tab Order and Focus:**

```svelte
<!-- ✅ GOOD: Logical tab order -->
<form>
  <Input id="name" label="Name" />
  <Input id="email" label="Email" />
  <Input id="password" label="Password" />
  <Button type="submit">Submit</Button>
</form>

<!-- ✅ Focus-visible styles in app.css -->
<style>
  *:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
</style>

<!-- ✅ Manage focus in modals -->
<Modal bind:open={isOpen} onopen={focusFirstElement}>
  <!-- Content -->
</Modal>
```

**Keyboard Shortcuts:**

```svelte
<!-- ✅ Provide keyboard alternatives -->
<button onclick={toggleMenu} aria-expanded={menuOpen}>
  Menu (M)
</button>

<script>
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'm') {
      toggleMenu();
    }
    if (event.key === 'Escape') {
      closeMenu();
    }
  }
</script>
```

### Focus Management

**Focus Trap in Modals:**

```svelte
<script>
  let isOpen = $state(false);
  let previousActiveElement: HTMLElement | null = null;
  
  function openModal() {
    // Save current focus
    previousActiveElement = document.activeElement as HTMLElement;
    isOpen = true;
    
    // Focus first element after render
    setTimeout(() => {
      const focusable = dialogRef?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (focusable as HTMLElement)?.focus();
    }, 0);
  }
  
  function closeModal() {
    isOpen = false;
    
    // Restore focus
    previousActiveElement?.focus();
  }
</script>
```

**Focus Indicators:**

```svelte
<!-- ✅ Clear focus rings for all interactive elements -->
<button class="ring-offset-2 focus:ring-2 focus:ring-zinc-900">
  Button with focus ring
</button>

<input class="focus:ring-2 focus:ring-zinc-900" />

<!-- ✅ Remove default browser focus for custom styling -->
<style>
  *:focus-visible {
    outline: none;  /* Remove default */
  }
  
  button:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
</style>
```

---

## Performance Optimization

### Reactivity Best Practices

**Use $state for Component State:**

```svelte
<script>
  // ✅ GOOD: All local reactive state uses $state
  let count = $state(0);
  let isOpen = $state(false);
  let formData = $state({
    name: '',
    email: ''
  });
  
  // ❌ AVOID: Let declarations without $state
  let count = 0;  // Not reactive in Svelte 5
</script>
```

**Use $derived for Computed Values:**

```svelte
<script>
  let items = $state([
    { name: 'Item 1', price: 10 },
    { name: 'Item 2', price: 20 }
  ]);
  let filter = $state('');
  
  // ✅ GOOD: Use $derived for computed values
  const filteredItems = $derived(
    filter 
      ? items.filter(item => item.name.includes(filter))
      : items
  );
  
  const totalPrice = $derived(
    items.reduce((sum, item) => sum + item.price, 0)
  );
  
  // ✅ Use $derived.by for expensive computations
  const expensiveResult = $derived.by(() => {
    // Complex calculation here
    return heavyComputation(items, filter);
  });
  
  // ❌ AVOID: Re-computing in render
  {#each filteredItems as item}  <!-- filteredItems recalculated every render -->
    <div>{item.name}</div>
  {/each}
</script>
```

**Avoid Unnecessary Reactivity:**

```svelte
<script>
  // ✅ GOOD: Static values outside component
  const CONSTANTS = {
    API_URL: 'https://api.example.com',
    MAX_ITEMS: 100
  };
  
  // ❌ AVOID: Recreating objects/functions
  <Button onclick={() => {
    // This function is recreated on every render
    console.log('clicked');
  }}>
    Click
  </Button>
  
  // ✅ BETTER: Define function once
  function handleClick() {
    console.log('clicked');
  }
  
  <Button onclick={handleClick}>
    Click
  </Button>
</script>
```

### Component Rendering

**Lazy Loading:**

```svelte
<!-- ✅ GOOD: Conditionally render heavy components -->
{#if isVisible}
  <Modal bind:open={isOpen}>
    <!-- Heavy modal content -->
  </Modal>
{/if}

<!-- ❌ AVOID: Always render hidden components -->
<div style="display: {isOpen ? 'block' : 'none'}">
  <Modal>  <!-- Modal always rendered but hidden -->
    <!-- Content -->
  </Modal>
</div>
```

**Each Key Optimization:**

```svelte
<script>
  // ✅ GOOD: Provide stable keys
  {#each items as item (item.id)}  <!-- Stable identifier -->
    <div>{item.name}</div>
  {/each}
  
  // ❌ AVOID: Unstable keys cause re-renders
  {#each items as item (item.name)}  <!-- Name might change -->
    <div>{item.name}</div>
  {/each}
  
  // ❌ AVOID: Using index as key
  {#each items as item, index (index)}  <!-- Index is unstable -->
    <div>{item.name}</div>
  {/each}
</script>
```

### Bundle Optimization

**Tree Shaking:**

```typescript
// ✅ GOOD: Named exports enable tree shaking
export { default as Card } from './Card.svelte';
export { default as Button } from './Button.svelte';

// Usage - only imports what's needed
import { Card, Button } from '$lib/components';

// ❌ AVOID: Barrel file imports everything
import * as Components from '$lib/components';  // Includes all components
```

**Component Splitting:**

```svelte
<!-- ✅ GOOD: Load tabs dynamically -->
<script>
  import { page } from '$app/stores';
  
  const components = {
    overview: () => import('$lib/components/OverviewTab.svelte'),
    details: () => import('$lib/components/DetailsTab.svelte'),
    settings: () => import('$lib/components/SettingsTab.svelte')
  };
  
  $effect(async () => {
    const component = await components[$page.params.tab]();
    // Dynamically load component
  });
</script>
```

---

## Code Quality Standards

### TypeScript Guidelines

**Type Safety:**

```typescript
// ✅ GOOD: Strong typing
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;  // Optional with ?
}

interface Props {
  user: User;  // Strong type, not any
  size?: 'sm' | 'md' | 'lg';  // Union of literals
  onclick?: (user: User) => void;  // Specific function signature
}

// ❌ AVOID: Weak types
interface Props {
  user: any;  // No type safety
  size: string;  // Too broad
  handler: Function;  // Vague
}
```

**Type Inference:**

```typescript
// ✅ GOOD: Let TypeScript infer when possible
const handleClick = (event: MouseEvent) => {  // Event type inferred
  console.log(event.target);
};

// ✅ Explicit types for complex scenarios
const handleSubmit = (event: Event) => {
  if (event.target instanceof HTMLFormElement) {
    // Type guard
    event.target.submit();
  }
};
```

**Type Guards:**

```typescript
// ✅ GOOD: Use type guards for narrowing
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}

// Usage
if (isUser(data)) {
  // TypeScript knows 'data' is User
  console.log(data.name);
}
```

### Svelte 5 Patterns

**Runes Usage:**

```svelte
<script>
  // ✅ GOOD: All state uses $state
  let count = $state(0);
  let items = $state([]);
  
  // ✅ GOOD: Computed values use $derived
  const doubled = $derived(count * 2);
  const isEmpty = $derived(items.length === 0);
  
  // ✅ GOOD: Side effects use $effect
  $effect(() => {
    console.log('Items changed:', items);
  });
  
  // ✅ GOOD: Async effects
  $effect(async () => {
    await fetchData();
  });
  
  // ❌ AVOID: Mixing Svelte 4 and 5 syntax
  let count = 0;  // Svelte 4
  let count = $state(0);  // Svelte 5
  // Don't mix them
</script>
```

**Reactive Dependencies:**

```svelte
<script>
  let firstName = $state('');
  let lastName = $state('');
  
  // ✅ GOOD: Dependencies explicit in $derived
  const fullName = $derived(
    `${firstName} ${lastName}`
  );
  
  // ✅ GOOD: Multiple dependencies tracked
  const isValid = $derived(
    firstName.length > 0 && lastName.length > 0
  );
  
  // ❌ AVOID: Implicit dependencies unclear
  const result = $derived(() => {
    // Not clear what's tracked
    return someComputation();
  });
</script>
```

### Naming Conventions

**Files and Directories:**

```bash
# ✅ GOOD: Consistent, descriptive
src/
├── lib/
│   ├── components/
│   │   ├── Card.svelte
│   │   ├── Button.svelte
│   │   └── UserAvatar.svelte
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   └── types/
│       └── index.ts
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte
│   └── api/
│       └── items/

# ❌ AVOID: Inconsistent naming
src/
├── components/  # Should be lib/components
├── utils/       # Should be lib/utils
├── helper.ts     # Should be formatters.ts
└── buttonComp.svelte  # Should be Button.svelte
```

**Component Naming:**

```typescript
// ✅ GOOD: PascalCase, descriptive
Card.svelte
Button.svelte
UserAvatar.svelte
RecipeCard.svelte  // Compound names for specific use cases

// ❌ AVOID: Inconsistent, unclear
card.svelte
btn.svelte
avatar.svelte
comp1.svelte
```

**Props Naming:**

```typescript
// ✅ GOOD: camelCase, descriptive
interface Props {
  showHeader?: boolean;
  disabled?: boolean;
  onclick?: () => void;
  onchange?: (value: string) => void;
}

// ❌ AVOID: Inconsistent, abbreviated
interface Props {
  header?: boolean;  // Ambiguous - showHeader?
  dis?: boolean;      // Abbreviated - disabled?
  click?: Function;    // Vague - onclick?
}
```

**Function Naming:**

```typescript
// ✅ GOOD: Verb-first, descriptive
function handleSubmit() {}
function fetchData() {}
function validateEmail() {}
function calculateTotal() {}

// ❌ AVOID: Noun-first, vague
function submission() {}      // handleSubmit()
function data() {}           // fetchData()
function check() {}           // validateEmail()
function total() {}          // calculateTotal()
```

---

## Testing Strategies

### Component Testing

**Unit Test Structure:**

```typescript
// Card.test.ts
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Card from './Card.svelte';

describe('Card', () => {
  it('renders children when showHeader is false', () => {
    render(Card, {
      children: () => 'Test content'
    });
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
  
  it('renders header when showHeader is true', () => {
    render(Card, {
      showHeader: true,
      header: () => 'Test Header'
    });
    
    expect(screen.getByText('Test Header')).toBeInTheDocument();
  });
  
  it('calls onclick when clicked', async () => {
    const handleClick = vi.fn();
    render(Card, {
      onclick: handleClick
    });
    
    const card = screen.getByRole('button');
    await userEvent.click(card);
    
    expect(handleClick).toHaveBeenCalled();
  });
});
```

**Accessibility Testing:**

```typescript
import { axe } from 'jest-axe';

describe('Card Accessibility', () => {
  it('has no accessibility violations', async () => {
    render(Card);
    const results = await axe(document.body);
    
    expect(results).toHaveNoViolations();
  });
});
```

### Integration Testing

**Page Testing:**

```typescript
// +page.test.ts
import { render, screen } from '@testing-library/svelte';
import { page } from '$app/stores';
import Page from './+page.svelte';

describe('Page', () => {
  it('loads data from API', async () => {
    render(Page);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });
  });
  
  it('handles errors gracefully', async () => {
    // Mock error response
    global.fetch = vi.fn(() => 
      Promise.reject(new Error('Failed'))
    );
    
    render(Page);
    
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

**Visual Regression Testing:**

```typescript
// screenshot.test.ts
import { render } from '@testing-library/svelte';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import Button from './Button.svelte';

describe('Button Visual', () => {
  it('matches default snapshot', () => {
    render(Button, { children: () => 'Click Me' });
    const container = document.body;
    
    expect(container).toMatchImageSnapshot();
  });
});
```

---

## Design System Integration

### Theme Consistency

**Zinc Palette Usage:**

```svelte
<!-- ✅ GOOD: Always use zinc for neutral UI -->
<div class="bg-zinc-50 border-zinc-200">
  <h2 class="text-zinc-900">Heading</h2>
  <p class="text-zinc-600">Body text</p>
  <p class="text-zinc-500">Secondary text</p>
</div>

<!-- ❌ AVOID: Mixing neutral colors -->
<div class="bg-gray-100 border-gray-200">  <!-- Use zinc, not gray -->
  <h2 class="text-slate-900">  <!-- Use zinc, not slate -->
    Heading
  </h2>
</div>
```

**Semantic Colors:**

```svelte
<!-- ✅ GOOD: Consistent semantic colors -->
<Badge variant="success">Completed</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="info">Information</Badge>

<!-- Custom color mapping -->
const statusColors = {
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-zinc-100 text-zinc-700',
  blocked: 'bg-red-100 text-red-800'
};
```

### Color Usage

**Color System Application:**

```svelte
<!-- Backgrounds -->
bg-white         (primary surfaces, cards)
bg-zinc-50       (alternating rows, sections)
bg-zinc-900       (dark sections, footers)

<!-- Text -->
text-zinc-900     (headings, primary text)
text-zinc-700     (body text)
text-zinc-600     (secondary text, labels)
text-zinc-500     (descriptions, metadata)
text-zinc-400     (disabled, muted)

<!-- Borders -->
border-zinc-200   (default borders)
border-zinc-300   (active/hover states)

<!-- Semantic Colors -->
text-emerald-600   (success messages)
bg-emerald-50      (success backgrounds)
text-red-600       (error messages)
bg-red-50          (error backgrounds)
text-amber-600     (warning messages)
bg-amber-50        (warning backgrounds)
text-blue-600       (info messages)
bg-blue-50         (info backgrounds)
```

**Contrast Compliance:**

```svelte
<!-- ✅ Always ensure WCAG AA contrast ratios -->
<!-- Text on background -->
text-zinc-900 on bg-zinc-50     (ratio: 19.4:1) ✅
text-zinc-600 on bg-white           (ratio: 10.9:1) ✅
text-zinc-900 on bg-zinc-100       (ratio: 16.4:1) ✅

<!-- Semantic color combinations -->
text-emerald-800 on bg-emerald-100     (ratio: 12.6:1) ✅
text-red-900 on bg-red-50              (ratio: 15.1:1) ✅
text-blue-800 on bg-blue-50             (ratio: 11.3:1) ✅

<!-- ❌ AVOID: Low contrast -->
text-zinc-400 on bg-zinc-100          (ratio: 2.9:1)  ❌
text-zinc-500 on bg-zinc-200           (ratio: 4.6:1)  ❌
```

### Typography Hierarchy

**Font Sizes and Weights:**

```svelte
<!-- ✅ GOOD: Consistent hierarchy -->
<h1 class="text-3xl font-bold">  <!-- Page title -->
  Main Page Title
</h1>

<h2 class="text-2xl font-semibold">  <!-- Section title -->
  Section Title
</h2>

<h3 class="text-xl font-semibold">  <!-- Subsection -->
  Subsection Title
</h3>

<h4 class="text-lg font-semibold">  <!-- Card title -->
  Card Title
</h4>

<p class="text-sm">  <!-- Body text -->
  Regular paragraph text
</p>

<span class="text-xs">  <!-- Metadata, labels -->
  Small details, timestamps
</span>
```

**Tracking and Line Height:**

```svelte
<!-- ✅ GOOD: Readable text settings -->
<h1 class="text-3xl font-bold tracking-tight leading-none">
  Title
</h1>

<p class="text-base leading-relaxed">
  Body paragraph with good line height
</p>

<span class="text-sm leading-tight">
  Compact labels
</span>
```

### Spacing System

**Tailwind Scale:**

```svelte
<!-- Use consistent spacing scale -->
1   (0.25rem / 4px)   - Tight spacing
2   (0.5rem / 8px)    - Label/input spacing
3   (0.75rem / 12px)  - Compact spacing
4   (1rem / 16px)      - Default spacing
6   (1.5rem / 24px)   - Section spacing
8   (2rem / 32px)     - Large spacing
```

**Component Spacing:**

```svelte
<!-- ✅ GOOD: Consistent internal spacing -->
<Card>
  {#snippet children()}
    <!-- Card header -->
    <div class="mb-4">  <!-- Standard spacing before content -->
      <h2>Title</h2>
    </div>
    
    <!-- Form fields -->
    <div class="space-y-4">  <!-- Consistent spacing between fields -->
      <Input label="Field 1" />
      <Input label="Field 2" />
      <Input label="Field 3" />
    </div>
    
    <!-- Actions -->
    <div class="pt-4">  <!-- Extra spacing before actions -->
      <Button>Submit</Button>
    </div>
  {/snippet}
</Card>

<!-- ✅ GOOD: Consistent external spacing -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
  <!-- Cards with consistent gap -->
  <Card>Card 1</Card>
  <Card>Card 2</Card>
</div>
```

**Responsive Spacing:**

```svelte
<!-- ✅ GOOD: Mobile-first spacing -->
<div class="px-4 py-8 md:px-8 md:py-12">
  <!-- Mobile: 4px padding, 32px vertical -->
  <!-- Desktop: 8px padding, 48px vertical -->
</div>

<!-- ✅ GOOD: Responsive gaps -->
<div class="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
  <!-- Mobile: 1 column, 16px gap -->
  <!-- Desktop: 3 columns, 24px gap -->
</div>
```

---

## Code Quality Checklist

Before finalizing any component or page, verify:

**Design System**
- [ ] Uses zinc color palette consistently (no gray, slate, etc.)
- [ ] Follows typography hierarchy (proper heading sizes)
- [ ] Implements proper spacing (Tailwind scale)
- [ ] Uses rounded corners (lg, md, sm) appropriately
- [ ] Includes focus states (ring-2 ring-offset-2)

**Svelte 5**
- [ ] Uses `$state` for component state
- [ ] Uses `$derived` for computed values
- [ ] Uses `$effect` for side effects
- [ ] TypeScript interfaces for all props
- [ ] Snippets for slots (`{#snippet}`)
- [ ] Proper event handlers (`onclick` not `on:click`)

**Accessibility**
- [ ] ARIA attributes present (aria-label, aria-expanded, etc.)
- [ ] Semantic HTML elements (header, main, nav, etc.)
- [ ] Keyboard navigation works (tab order, shortcuts)
- [ ] Focus management correct (focus trap, focus restore)
- [ ] Touch targets ≥ 44x44px

**Performance**
- [ ] Uses `$derived` instead of computed in render
- [ ] Avoids unnecessary re-renders
- [ ] Stable keys in `{#each}` blocks
- [ ] Lazy loads heavy components

**Code Quality**
- [ ] Descriptive variable/function names
- [ ] Consistent naming conventions (camelCase, PascalCase)
- [ ] No `any` types in TypeScript
- [ ] Proper error handling
- [ ] No console.log in production code

**Responsiveness**
- [ ] Mobile-first design
- [ ] Breakpoints (sm, md, lg) applied
- [ ] Touch-friendly targets
- [ ] No horizontal scroll on mobile

**Patterns**
- [ ] Reuses existing components
- [ ] Follows URL parameter pattern for shareable state
- [ ] Handles loading/error/empty states
- [ ] Uses barrel file imports or explicit paths

---

## Common Anti-Patterns

### ❌ AVOID These Patterns

**1. Passing Functions as Props Without Stability**

```svelte
<!-- ❌ AVOID: Function recreated every render -->
<Button onclick={() => handleClick()}>
  Click
</Button>

<!-- ✅ BETTER: Define function once -->
<script>
  function handleClick() {
    // Handle click
  }
</script>
<Button onclick={handleClick}>
  Click
</Button>
```

**2. Using Index as Each Key**

```svelte
<!-- ❌ AVOID: Index is unstable key -->
{#each items as item, index (index)}
  <div>{item.name}</div>
{/each}

<!-- ✅ BETTER: Use stable identifier -->
{#each items as item (item.id)}
  <div>{item.name}</div>
{/each}
```

**3. Conditional Rendering with Style Hiding**

```svelte
<!-- ❌ AVOID: Always renders but hides -->
<div style="display: {isOpen ? 'block' : 'none'}">
  <HeavyComponent />
</div>

<!-- ✅ BETTER: Conditionally render -->
{#if isOpen}
  <HeavyComponent />
{/if}
```

**4. Inline Complex Logic**

```svelte
<!-- ❌ AVOID: Complex inline logic -->
<div class={someCondition ? 'class-a' : someOtherCondition ? 'class-b' : 'class-c'}>
  Content
</div>

<!-- ✅ BETTER: Extract to computed -->
<script>
  const containerClass = $derived(
    someCondition ? 'class-a' : someOtherCondition ? 'class-b' : 'class-c'
  );
</script>
<div class={containerClass}>
  Content
</div>
```

**5. Props Drilling**

```svelte
<!-- ❌ AVOID: Passing through many layers -->
<GrandParent data={data}>
  <Parent data={data}>
    <Child data={data}>
      <GrandChild data={data} />
    </Child>
  </Parent>
</GrandParent>

<!-- ✅ BETTER: Use stores or context -->
<script>
  import { writable } from 'svelte/store';
  export const dataStore = writable(data);
</script>

<script>
  import { dataStore } from '$lib/stores';
  const data = $derived($dataStore);
</script>
```

---

## Decision Framework

### When to Extract a Component

**Questions to Ask:**

1. Is this used 3+ times?
   - YES → Extract to component
   - NO → Keep inline

2. Does it have complex state/logic?
   - YES → Extract to component
   - NO → Consider inline

3. Does it need accessibility features?
   - YES → Extract with proper ARIA
   - NO → Keep simple

4. Will it change often?
   - YES → Component is better for consistency
   - NO → Consider inline if one-off

### When to Use URL State vs Component State

**URL State for:**
- Navigation (tabs, pages)
- Filters (search, category, status)
- Pagination (page number, per page)
- Shareable/ bookmarkable views

**Component State for:**
- Form input values
- Modal open/close
- Temporary UI states
- Animation states
- Non-shareable preferences

### Component API Design Checklist

**Before finalizing component API:**

- [ ] Required props clearly identified
- [ ] Optional props have sensible defaults
- [ ] Props use TypeScript interfaces
- [ ] Callback props have clear names
- [ ] Slots provided for customization
- [ ] `class` prop for styling extension
- [ ] Component is self-contained
- [ ] No external dependencies assumed

---

## Next Steps

1. **Review Design System**: Study zinc palette, typography, spacing
2. **Browse Components**: Check [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)
3. **Learn Patterns**: Study [PATTERNS.md](./PATTERNS.md)
4. **Apply Guidelines**: Follow this file's best practices
5. **Test Accessibility**: Run axe or manual keyboard testing
6. **Review Checklist**: Use code quality checklist before committing

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Svelte 5 Documentation](https://svelte.dev/docs/runes-api)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Testing Library](https://testing-library.com/docs/svelte-testing-library/intro)
- [Axe Accessibility Testing](https://www.deque.com/axe/)
- [Component Library](./COMPONENT_LIBRARY.md)
- [Implementation Patterns](./PATTERNS.md)