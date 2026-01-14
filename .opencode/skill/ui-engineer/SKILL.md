---
name: ui-engineer
description: Generate consistent UI components and patterns based on gray-html design system with Svelte 5, Tailwind CSS, and zinc color palette
license: MIT
compatibility: opencode
metadata:
  audience: ui-engineers
  framework: svelte
  styling: tailwind-css
  design-system: gray-html
---

# UI Engineer Skill - gray-html Design System

You are a UI engineering specialist for the Kees application. Your job is to produce consistent, well-designed UI code that follows the gray-html design system patterns.

## Design System Fundamentals

### Color Palette - Zinc Primary

Always use the zinc color scale for neutral UI elements:

```css
/* Primary Text */
text-zinc-900 (for headings, primary text)
text-zinc-700 (for body text)
text-zinc-600 (for secondary text)
text-zinc-500 (for labels, descriptions)
text-zinc-400 (for disabled, muted)

/* Backgrounds */
bg-white (for cards, panels, surfaces)
bg-zinc-50 (for alternating rows, sections)
bg-zinc-100 (for badges, tags, subtle backgrounds)

/* Borders */
border-zinc-200 (for default borders)
border-zinc-300 (for active/hover states)

/* Semantic Colors */
bg-red-500 / text-red-600 (error, danger)
bg-green-500 / text-green-600 (success)
bg-amber-500 / text-amber-600 (warning)
bg-blue-500 / text-blue-600 (info, primary actions)
```

### Typography

```css
font-heading: Aspekta, sans-serif
font-body: Inter, sans-serif
font-mono: PT Mono, monospace

/* Heading Sizes */
h1: text-3xl font-bold tracking-tight
h2: text-2xl font-semibold tracking-tight
h3: text-xl font-semibold tracking-tight
h4: text-lg font-semibold

/* Body Text */
text-sm (most common for UI)
text-xs (for labels, metadata)
```

### Spacing System

Use consistent spacing increments based on Tailwind's scale:

- `p-4` or `space-y-4` (16px) - Default component padding
- `p-6` (24px) - Larger card padding
- `gap-2` (8px) - Between related elements
- `gap-4` (16px) - Between sections
- `mb-1` (4px) - Spacing between label and input
- `mb-2` (8px) - Spacing between form groups

### Border Radius & Shadows

```css
border-radius:
rounded-lg (for cards, panels, buttons)
rounded-md (for inputs, smaller components)
rounded-full (for badges, avatars)
rounded-sm (for compact elements)

shadows:
shadow-xs (default card state)
shadow-sm (hover state, lifted elements)
```

### Focus States

Always provide clear focus indicators:

```css
*:focus-visible {
  outline: 2px solid var(--theme-focus, #FE773C);
  outline-offset: 2px;
  border-radius: 4px;
}
```

## Component Patterns

### Card Component

Always use the Card component for container-based UI:

```svelte
<script>
  import Card from '$lib/components/Card.svelte';
  import { Clock } from 'lucide-svelte';
</script>

<!-- Dashboard Stat Card -->
<Card 
  icon={Clock}
  iconVariant="default"
  onclick={() => goto('/cases?status=pending')}
  hover={true}
>
  {#snippet children()}
    <div class="mb-3">
      <div class="text-sm text-zinc-600 mb-1">In afwachting</div>
      <div class="text-2xl font-bold text-zinc-900">12</div>
    </div>
    <p class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors">
      Cases die wachten om te starten
    </p>
  {/snippet}
</Card>

<!-- Card with Header and Footer -->
<Card showHeader={true} showFooter={true} onclick={() => goto(`/cases/${caseItem.id}`)} hover={true}>
  {#snippet header()}
    <div class="flex items-start justify-between gap-3 mb-3">
      <h3 class="text-lg font-semibold text-zinc-900 tracking-tight leading-tight">
        {caseItem.name}
      </h3>
      <span class="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-blue-100 text-blue-800">
        Actief
      </span>
    </div>
    <div class="text-sm text-zinc-600">{process.name}</div>
  {/snippet}
  
  {#snippet children()}
    <div class="space-y-3">
      <div class="flex items-center gap-2 text-sm">
        <span class="text-zinc-500 min-w-[70px]">Gestart</span>
        <span class="text-zinc-900 font-medium">{formatDate(caseItem.start_date)}</span>
      </div>
    </div>
  {/snippet}
  
  {#snippet footer()}
    <div class="flex items-center gap-2">
      <UserAvatar user={owner} size="sm" showName={true} />
    </div>
  {/snippet}
</Card>
```

### Button Component

Use Button component for all actions:

```svelte
<script>
  import Button from '$lib/components/Button.svelte';
</script>

<!-- Primary Button -->
<Button onclick={handleSave}>Opslaan</Button>

<!-- Secondary Button -->
<Button variant="secondary" onclick={handleCancel}>Annuleren</Button>

<!-- Outline Button -->
<Button variant="outline" onclick={handlePreview}>Preview</Button>

<!-- Ghost Button (subtle) -->
<Button variant="ghost" onclick={handleEdit}>Bewerken</Button>

<!-- Small Button -->
<Button size="sm" onclick={handleAction}>Action</Button>

<!-- Submit Button in Form -->
<Button type="submit" variant="default">Verzenden</Button>

<!-- Full Width Button -->
<Button fullWidth variant="default">Volledige Breedte</Button>

<!-- Disabled Button -->
<Button disabled variant="default">Uitgeschakeld</Button>

<!-- With Custom Classes -->
<Button class="my-custom-class" variant="secondary">
  Custom Styled
</Button>
```

### Drawer Component

Use Drawer for slide-out panels:

```svelte
<script>
  import { Drawer } from '$lib/components';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  const drawerParam = $derived($page.url.searchParams.get('drawer'));
  const isOpen = $derived(drawerParam === 'mydrawer');
  
  function openDrawer() {
    const url = new URL($page.url);
    url.searchParams.set('drawer', 'mydrawer');
    goto(url.pathname + url.search, { noScroll: true });
  }
  
  function handleClose() {
    const url = new URL($page.url);
    url.searchParams.delete('drawer');
    goto(url.pathname + url.search, { noScroll: true });
  }
</script>

<button onclick={openDrawer}>Open Drawer</button>

<Drawer bind:open={isOpen} position="right" onclose={handleClose}>
  <h2 class="text-lg font-semibold mb-4">Drawer Title</h2>
  <p>Drawer content goes here</p>
</Drawer>
```

### Modal Component

Use Modal for dialogs and confirmations:

```svelte
<script>
  import { Modal } from '$lib/components';
  let isOpen = $state(false);
</script>

<Modal bind:open={isOpen} title="Confirm Action" size="md">
  <p>Are you sure you want to proceed?</p>
  <div class="flex justify-end gap-2 mt-4">
    <Button onclick={() => isOpen = false}>Annuleren</Button>
    <Button onclick={handleConfirm}>Bevestigen</Button>
  </div>
</Modal>
```

### Tabs Component

Use Tabs for organizing content:

```svelte
<script>
  import { Tabs, type TabItem } from '$lib/components';
  
  const tabs: TabItem[] = [
    { id: 'details', label: 'Details' },
    { id: 'messages', label: 'Berichten' },
    { id: 'files', label: 'Bestanden' }
  ];
</script>

<Tabs {tabs} let:activeTab>
  {#if activeTab === 'details'}
    <div>Details content</div>
  {:else if activeTab === 'messages'}
    <div>Messages content</div>
  {:else if activeTab === 'files'}
    <div>Files content</div>
  {/if}
</Tabs>
```

### Toast Notifications

Use toastStore for notifications:

```svelte
<script>
  import { toastStore } from '$lib/stores/toastStore';
</script>

<script>
  function handleSuccess() {
    toastStore.add('Operation completed successfully!', 'success');
  }
  
  function handleError() {
    toastStore.add('Failed to save changes', 'error', 5000); // 5 seconds
  }
</script>
```

### Form Elements

Always use form classes for inputs:

```svelte
<form onsubmit={handleSubmit}>
  <div class="space-y-4">
    <!-- Text Input -->
    <div>
      <label for="subject" class="block text-sm font-medium text-zinc-700 mb-1">
        Onderwerp
      </label>
      <input
        id="subject"
        type="text"
        class="form-input w-full"
        bind:value={formData.subject}
        required
      />
    </div>
    
    <!-- Select Dropdown -->
    <div>
      <label for="priority" class="block text-sm font-medium text-zinc-700 mb-1">
        Prioriteit
      </label>
      <select
        id="priority"
        class="form-select w-full"
        bind:value={formData.priority}
      >
        <option value="low">Laag</option>
        <option value="normal">Normaal</option>
        <option value="high">Hoog</option>
      </select>
    </div>
    
    <!-- Textarea -->
    <div>
      <label for="description" class="block text-sm font-medium text-zinc-700 mb-1">
        Beschrijving
      </label>
      <textarea
        id="description"
        class="form-textarea w-full"
        rows="4"
        bind:value={formData.description}
      />
    </div>
    
    <!-- Checkbox -->
    <div class="flex items-center gap-2">
      <input
        id="notify"
        type="checkbox"
        class="form-checkbox"
        bind:checked={formData.notify}
      />
      <label for="notify" class="text-sm text-zinc-700">
        Notificatie sturen
      </label>
    </div>
    
    <!-- Submit Button -->
    <div class="flex justify-end gap-2 pt-2">
      <Button variant="secondary" onclick={() => resetForm()}>
        Annuleren
      </Button>
      <Button type="submit" onclick={handleSubmit}>
        Opslaan
      </Button>
    </div>
  </div>
</form>
```

### Date Picker

Use DatePicker for date inputs:

```svelte
<script>
  import { DatePicker } from '$lib/components';
  
  let selectedDate = $state(null);
</script>

<label for="date" class="block text-sm font-medium text-zinc-700 mb-1">
  Datum
</label>
<DatePicker
  id="date"
  name="date"
  bind:value={selectedDate}
  placeholder="Selecteer datum"
/>
```

## Layout Patterns

### Flexbox Layouts

```svelte
<!-- Horizontal Layout with Gap -->
<div class="flex items-center gap-2">
  <UserAvatar user={user} />
  <span class="text-sm text-zinc-700">{user.name}</span>
</div>

<!-- Flex Between (spaced items) -->
<div class="flex items-center justify-between">
  <h3 class="text-lg font-semibold text-zinc-900">Title</h3>
  <Button size="sm">Action</Button>
</div>

<!-- Vertical Flex with Gap -->
<div class="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Grid Layouts

```svelte
<!-- 2-Column Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
</div>

<!-- 3-Column Grid -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>

<!-- Dashboard Stats Grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>Stat 1</Card>
  <Card>Stat 2</Card>
  <Card>Stat 3</Card>
  <Card>Stat 4</Card>
</div>
```

### Container Patterns

```svelte
<!-- Centered Content Container -->
<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6">Page Title</h1>
  <!-- Page content -->
</div>

<!-- Max Width Container -->
<div class="max-w-2xl mx-auto">
  <p>Constrained width content</p>
</div>
```

## State Management Patterns

### URL Parameter Pattern

Use URL parameters for shareable state:

```svelte
<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  // Derive state from URL params
  const tabParam = $derived($page.url.searchParams.get('tab'));
  const activeTab = $derived(tabParam || 'details'); // Default value
  
  // Update URL on change
  async function setTab(tabId: string) {
    const url = new URL($page.url);
    if (tabId === 'details') {
      url.searchParams.delete('tab'); // Clean URL for default
    } else {
      url.searchParams.set('tab', tabId);
    }
    await goto(url.pathname + url.search, { noScroll: true });
  }
</script>

<Tabs tabs={tabs} activeTab={activeTab} ontabchange={setTab} />
```

### Svelte 5 Runes Pattern

Always use Svelte 5 runes for reactive state:

```svelte
<script>
  // Use $state for component-local reactive state
  let count = $state(0);
  let isOpen = $state(false);
  let formData = $state({
    name: '',
    email: ''
  });
  
  // Use $derived for computed values
  const doubleCount = $derived(count * 2);
  const isValid = $derived(formData.name.length > 0 && formData.email.includes('@'));
  
  // Use $derived.by for complex derived state
  const filteredItems = $derived.by(() => {
    return items.filter(item => item.visible);
  });
</script>

<button onclick={() => count++}>
  Count: {count}
</button>
```

## Theme System

The application supports 6 themes. Never hardcode theme colors - always use CSS custom properties:

```svelte
<!-- Use theme variables instead of hardcoded colors -->
<div style="color: var(--theme-text-primary);">
  Primary Text
</div>

<button style="background-color: var(--theme-primary);">
  Primary Button
</button>

<!-- Theme-aware styling -->
<style>
  .my-element {
    border-color: var(--theme-border);
    background: var(--theme-background);
  }
</style>
```

## Accessibility Best Practices

### Semantic HTML

```svelte
<!-- Use semantic elements -->
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
  <p>© 2025 Kees Application</p>
</footer>
```

### ARIA Attributes

```svelte
<!-- Buttons with icons -->
<button
  onclick={handleClose}
  aria-label="Sluiten"
>
  <X class="w-5 h-5" />
</button>

<!-- Status indicators -->
<div
  role="status"
  aria-live="polite"
  aria-label="Loading"
>
  <Spinner />
</div>
```

### Focus Management

```svelte
<!-- Skip to content link -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only"
>
  Skip to main content
</a>

<!-- Keyboard navigation -->
<div
  role="listbox"
  tabindex="0"
  onkeydown={handleKeyDown}
>
  {#each items as item}
    <div
      role="option"
      aria-selected={selectedItem === item.id}
      onclick={() => selectItem(item.id)}
    >
      {item.label}
    </div>
  {/each}
</div>
```

## Common Patterns

### Loading States

```svelte
<script>
  let loading = $state(false);
  
  async function handleAction() {
    loading = true;
    try {
      await performAction();
    } finally {
      loading = false;
    }
  }
</script>

<Button disabled={loading} onclick={handleAction}>
  {#if loading}
    <Spinner class="w-4 h-4" />
  {:else}
    Submit
  {/if}
</Button>
```

### Empty States

```svelte
<div class="flex flex-col items-center justify-center py-12 text-center">
  <div class="mb-4 text-zinc-300">
    <Inbox class="w-16 h-16" />
  </div>
  <h3 class="text-lg font-semibold text-zinc-900 mb-2">
    Geen items gevonden
  </h3>
  <p class="text-sm text-zinc-600 max-w-sm">
    Er zijn nog geen items om weer te geven. Maak uw eerste item aan.
  </p>
  <Button onclick={handleCreate} class="mt-4">
    Nieuw Item Maken
  </Button>
</div>
```

### Error States

```svelte
{#if error}
  <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    <div class="flex items-start gap-3">
      <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div class="flex-1">
        <h4 class="text-sm font-semibold text-red-900 mb-1">
          Er is een fout opgetreden
        </h4>
        <p class="text-sm text-red-700">{error.message}</p>
      </div>
      <Button variant="ghost" size="sm" onclick={() => error = null}>
        <X class="w-4 h-4" />
      </Button>
    </div>
  </div>
{/if}
```

### Badge/Tag Components

```svelte
<!-- Status Badge -->
<span class="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-blue-100 text-blue-800">
  Actief
</span>

<!-- Priority Badge -->
<span class="px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700">
  Normaal
</span>

<!-- Category Tag -->
<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700">
  <Tag class="w-3 h-3" />
  Development
</span>
```

## File Organization

### Component Structure

```
src/lib/components/
├── ComponentName.svelte       # Component implementation
├── ComponentName.md           # Documentation with examples
├── ComponentName/
│   ├── index.ts              # Sub-exports
│   └── SubComponent.svelte   # Sub-components
└── index.ts                 # Main exports
```

### Naming Conventions

- **Components**: PascalCase (e.g., `WorkItemCard.svelte`)
- **Files**: kebab-case (e.g., `work-item-card.svelte`)
- **Props**: camelCase (e.g., `showHeader`, `onClose`)
- **CSS Classes**: kebab-case (e.g., `form-input`, `btn-sm`)
- **Functions**: camelCase (e.g., `handleSubmit`, `fetchData`)

## When to Use This Skill

Use this UI engineer skill when you need to:

1. Create new UI components or pages
2. Add features to existing components
3. Implement forms and inputs
4. Design layouts and grids
5. Handle state management
6. Ensure accessibility compliance
7. Apply consistent styling
8. Work with theme system
9. Implement responsive designs

## Code Quality Checklist

Before finalizing code, ensure:

- [ ] Uses zinc color palette consistently
- [ ] Follows typography hierarchy (Aspekta/Inter fonts)
- [ ] Implements proper spacing with Tailwind scale
- [ ] Uses rounded corners appropriately (lg/md/sm)
- [ ] Includes focus states for interactive elements
- [ ] Uses Svelte 5 runes ($state, $derived)
- [ ] Implements URL parameter pattern for shareable state
- [ ] Includes proper ARIA attributes
- [ ] Uses semantic HTML elements
- [ ] Handles loading and error states
- [ ] Follows component naming conventions
- [ ] Uses theme variables instead of hardcoded colors
- [ ] Implements responsive breakpoints (sm, md, lg)
- [ ] Provides hover/active states for interactive elements

## Examples from Codebase

Refer to these files for implementation patterns:

- **Dashboard Layout**: `src/routes/+page.svelte`
- **Card Patterns**: `src/lib/components/Card.md`
- **Form Patterns**: Various components in `src/lib/components/`
- **State Management**: `src/lib/stores/*.svelte.ts`
- **Theme System**: `src/app.css`
- **Component Docs**: `src/lib/components/*.md`

## Key Principles

1. **Consistency**: Always use existing components and patterns
2. **Accessibility**: Follow WCAG AA guidelines for color contrast and keyboard navigation
3. **Responsiveness**: Design mobile-first, enhance for larger screens
4. **Performance**: Use Svelte 5 runes for efficient reactivity
5. **Maintainability**: Write clear, documented code
6. **UX First**: Prioritize user experience and feedback
7. **Theme Aware**: Support all 6 themes (default, catalyst, pglite, planet, trevor, cursor)