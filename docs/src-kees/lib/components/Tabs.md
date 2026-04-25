# Tabs Component

A tab navigation component for organizing content into separate panes, styled according to the gray-html design system.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `TabItem[]` | **Required** | Array of tab items |
| `defaultTab` | `string` | First tab ID | ID of the initially active tab |
| `class` | `string` | `''` | Additional CSS classes |
| `ontabchange` | `(tabId: string) => void` | `undefined` | Callback when tab changes |

## TabItem Interface

```typescript
interface TabItem {
  id: string;
  label: string;
}
```

## Examples

### Basic Usage
```svelte
<script>
  import { Tabs } from '$lib/components';
  
  const tabs = [
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' },
    { id: 'tab3', label: 'Tab 3' }
  ];
</script>

<Tabs {tabs} let:activeTab>
  {#if activeTab === 'tab1'}
    <div>Content for Tab 1</div>
  {:else if activeTab === 'tab2'}
    <div>Content for Tab 2</div>
  {:else if activeTab === 'tab3'}
    <div>Content for Tab 3</div>
  {/if}
</Tabs>
```

### With Default Tab
```svelte
<Tabs {tabs} defaultTab="tab2" let:activeTab>
  <!-- Content based on activeTab -->
</Tabs>
```

### With Tab Change Handler
```svelte
<script>
  function handleTabChange(tabId) {
    console.log('Switched to tab:', tabId);
  }
</script>

<Tabs {tabs} ontabchange={handleTabChange} let:activeTab>
  <!-- Content -->
</Tabs>
```

### Dynamic Content with Each Block
```svelte
<script>
  const tabContents = {
    tab1: 'Content 1',
    tab2: 'Content 2',
    tab3: 'Content 3'
  };
</script>

<Tabs {tabs} let:activeTab>
  {tabContents[activeTab]}
</Tabs>
```

### With Custom Styling
```svelte
<Tabs {tabs} class="my-custom-class" let:activeTab>
  <!-- Content -->
</Tabs>
```

## URL Parameter Pattern

Many tabs in this codebase use URL parameters to manage their state. This pattern provides:

- **Shareable URLs** - Users can bookmark or share URLs with specific tabs open
- **Browser history** - Back/forward buttons work naturally
- **Deep linking** - Direct navigation to specific tab states
- **State persistence** - Refresh page maintains tab state

### Implementation Pattern

```svelte
<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Tabs, type TabItem } from '$lib/components';
  
  const tabs: TabItem[] = [
    { id: 'details', label: 'Details' },
    { id: 'messages', label: 'Messages' },
    { id: 'files', label: 'Files' }
  ];
  
  // Derive active tab from URL params
  const tabParam = $derived($page.url.searchParams.get('tab'));
  const activeTab = $derived(tabParam || 'details'); // Default to 'details'
  
  // Handle tab change - update URL
  async function handleTabChange(tabId: string) {
    const url = new URL($page.url);
    if (tabId === 'details') {
      // Remove param for default tab (cleaner URLs)
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tabId);
    }
    await goto(url.pathname + url.search, { noScroll: true });
  }
</script>

<Tabs {tabs} activeTab={activeTab} ontabchange={handleTabChange}>
  {#snippet children({ activeTab }: { activeTab: string })}
    {#if activeTab === 'details'}
      <div>Details content</div>
    {:else if activeTab === 'messages'}
      <div>Messages content</div>
    {:else if activeTab === 'files'}
      <div>Files content</div>
    {/if}
  {/snippet}
</Tabs>
```

### Example: WorkItemDetailsDrawer

The `WorkItemDetailsDrawer` component uses this pattern:

- **URL param:** `drawerTab=<tabId>` (uses `drawerTab` instead of `tab` to avoid conflicts with page-level tabs)
- **Default tab:** `details` (no param needed)
- **Example URLs:**
  - `/help?drawer=workitem&workItemId=123` - Shows Details tab (default)
  - `/help?drawer=workitem&workItemId=123&drawerTab=berichten` - Shows Berichten tab
  - `/help?drawer=workitem&workItemId=123&drawerTab=bestanden` - Shows Bestanden tab

**Note:** The drawer uses `drawerTab` instead of `tab` to avoid conflicts with the help page's own `tab` parameter (for "indienen" and "bekijken" tabs).

### Benefits

1. **State persistence** - Refresh page maintains active tab
2. **Navigation** - Browser back button changes tabs naturally
3. **Sharing** - Users can share URLs with specific tabs open
4. **Deep linking** - Direct navigation to specific tab content

### Alternative: Keep Default Tab in URL

If you prefer to always show the tab in the URL (even for the default):

```svelte
async function handleTabChange(tabId: string) {
  const url = new URL($page.url);
  url.searchParams.set('tab', tabId);
  await goto(url.pathname + url.search, { noScroll: true });
}
```

### Hybrid Approach

Components can support both URL params and prop-based state:

```svelte
// Use URL params if available, otherwise use props
const activeTab = $derived.by(() => {
  const url = $page.url;
  const param = url.searchParams.get('tab');
  return param || propActiveTab || 'default';
});
```

## Slot Props

The component provides `activeTab` as a slot prop:
- `activeTab` - The ID of the currently active tab (string)

## Styling

- Active tab has zinc-900 border and text
- Inactive tabs have zinc-500 text with hover effects
- Smooth transitions between states
- Matches gray-html design patterns

