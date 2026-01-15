# Usage Patterns and Implementation Guide

Complete guide for implementing common UI patterns with gray-html design system components.

## Table of Contents

- [Layout Patterns](#layout-patterns)
  - [Flexbox Layouts](#flexbox-layouts)
  - [Grid Layouts](#grid-layouts)
  - [Container Patterns](#container-patterns)
- [Form Patterns](#form-patterns)
  - [Form Validation](#form-validation)
  - [Form Submission](#form-submission)
  - [Form Groups](#form-groups)
- [State Management](#state-management)
  - [URL Parameter Pattern](#url-parameter-pattern)
  - [Svelte 5 Runes](#svelte-5-runes)
- [Common States](#common-states)
  - [Loading States](#loading-states)
  - [Empty States](#empty-states)
  - [Error States](#error-states)
- [Data Patterns](#data-patterns)
  - [List Views](#list-views)
  - [Detail Views](#detail-views)
  - [Dashboard Views](#dashboard-views)

---

## Layout Patterns

### Flexbox Layouts

#### Horizontal Row with Gap

Use for aligning items horizontally with consistent spacing.

```svelte
<script>
  import { UserAvatar } from '$lib/components';
</script>

<!-- Items side by side -->
<div class="flex items-center gap-2">
  <UserAvatar user={user} size="sm" />
  <span class="text-sm text-zinc-700">{user.name}</span>
</div>

<!-- Multiple items -->
<div class="flex items-center gap-4">
  <span>Item 1</span>
  <span>Item 2</span>
  <span>Item 3</span>
</div>
```

#### Flex Between (Spaced Items)

Use for distributing space between elements.

```svelte
<script>
  import { Button } from '$lib/components';
</script>

<!-- Title and action button -->
<div class="flex items-center justify-between">
  <h2 class="text-lg font-semibold text-zinc-900">Page Title</h2>
  <Button size="sm" onclick={handleAction}>Action</Button>
</div>

<!-- Left and right sections -->
<div class="flex items-center justify-between">
  <div>
    <h3 class="text-base font-semibold text-zinc-900">Left Content</h3>
    <p class="text-sm text-zinc-600">Description here</p>
  </div>
  <Button variant="secondary">Edit</Button>
</div>
```

#### Vertical Flex Stack

Use for stacking elements with consistent spacing.

```svelte
<script>
  import { Card } from '$lib/components';
</script>

<!-- Vertical card stack -->
<div class="flex flex-col gap-4">
  <Card>
    {#snippet children()}
      <h3 class="text-lg font-semibold text-zinc-900">Card 1</h3>
      <p class="text-sm text-zinc-600">Content</p>
    {/snippet}
  </Card>
  <Card>
    {#snippet children()}
      <h3 class="text-lg font-semibold text-zinc-900">Card 2</h3>
      <p class="text-sm text-zinc-600">Content</p>
    {/snippet}
  </Card>
</div>

<!-- Form stack -->
<div class="flex flex-col gap-4">
  <Input label="Name" bind:value={formData.name} />
  <Input label="Email" type="email" bind:value={formData.email} />
  <Button type="submit" onclick={handleSubmit}>Submit</Button>
</div>
```

---

### Grid Layouts

#### Two-Column Grid

Use for side-by-side content on larger screens.

```svelte
<!-- Responsive 2-column -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div class="p-4 bg-zinc-50 rounded-lg">
    <h3 class="text-lg font-semibold text-zinc-900">Column 1</h3>
    <p class="text-sm text-zinc-600">Content for first column</p>
  </div>
  <div class="p-4 bg-zinc-50 rounded-lg">
    <h3 class="text-lg font-semibold text-zinc-900">Column 2</h3>
    <p class="text-sm text-zinc-600">Content for second column</p>
  </div>
</div>

<!-- Form columns -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Input label="First Name" bind:value={firstName} />
  <Input label="Last Name" bind:value={lastName} />
</div>
```

#### Three-Column Grid

Use for dashboard stats or feature highlights.

```svelte
<script>
  import { Card } from '$lib/components';
</script>

<!-- Stats grid -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card showHeader={true}>
    {#snippet header()}
      <h3 class="text-sm text-zinc-600">Total Users</h3>
    {/snippet}
    {#snippet children()}
      <p class="text-3xl font-bold text-zinc-900">1,234</p>
    {/snippet}
  </Card>
  <Card showHeader={true}>
    {#snippet header()}
      <h3 class="text-sm text-zinc-600">Active Now</h3>
    {/snippet}
    {#snippet children()}
      <p class="text-3xl font-bold text-zinc-900">56</p>
    {/snippet}
  </Card>
  <Card showHeader={true}>
    {#snippet header()}
      <h3 class="text-sm text-zinc-600">New Today</h3>
    {/snippet}
    {#snippet children()}
      <p class="text-3xl font-bold text-zinc-900">23</p>
    {/snippet}
  </Card>
</div>
```

#### Responsive Card Grid

Use for card-based layouts.

```svelte
<script>
  import { Card } from '$lib/components';
</script>

<!-- Card grid with responsive columns -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {#each items as item}
    <Card hover={true} onclick={() => goto(`/items/${item.id}`)}>
      {#snippet children()}
        <h3 class="text-lg font-semibold text-zinc-900 mb-2">{item.title}</h3>
        <p class="text-sm text-zinc-600 line-clamp-2">{item.description}</p>
      {/snippet}
    </Card>
  {/each}
</div>
```

---

### Container Patterns

#### Centered Content Container

Use for page-level content with consistent padding.

```svelte
<script>
  import { Header, Footer } from '$lib/components';
</script>

<Header />

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-zinc-900 mb-6">Page Title</h1>
  
  <div class="max-w-3xl mx-auto">
    <p class="text-zinc-600 mb-4">Page content goes here.</p>
    <!-- More content -->
  </div>
</div>

<Footer />
```

#### Constrained Width Container

Use for narrow content areas.

```svelte
<!-- Narrow content (blog post, article) -->
<div class="max-w-2xl mx-auto px-4 py-8">
  <article>
    <h1 class="text-4xl font-bold text-zinc-900 mb-4">Article Title</h1>
    <p class="text-lg text-zinc-700 mb-6">Article content...</p>
  </article>
</div>

<!-- Extra narrow (settings forms) -->
<div class="max-w-xl mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold text-zinc-900 mb-6">Settings</h1>
  <form class="space-y-4">
    <Input label="Name" bind:value={settings.name} />
    <Input label="Email" type="email" bind:value={settings.email} />
    <Button type="submit" onclick={saveSettings}>Save</Button>
  </form>
</div>
```

---

## Form Patterns

### Form Validation

#### Real-time Validation

Validate fields as user types with derived state.

```svelte
<script>
  import { Input, Button, Alert } from '$lib/components';
  
  let formData = $state({
    email: '',
    password: ''
  });
  
  let errors = $state({});
  let touched = $state({});
  
  const emailError = $derived(
    touched.email && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      ? 'Please enter a valid email address'
      : ''
  );
  
  const passwordError = $derived(
    touched.password && formData.password.length < 8
      ? 'Password must be at least 8 characters'
      : ''
  );
  
  const isValid = $derived(
    !emailError && !passwordError && formData.email && formData.password
  );
  
  function handleBlur(field: string) {
    touched[field] = true;
  }
  
  async function handleSubmit() {
    if (!isValid) return;
    
    // Submit to API
    const response = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      errors.submit = 'Authentication failed';
    }
  }
</script>

<form onsubmit={handleSubmit} class="space-y-4 max-w-md">
  <Input
    id="email"
    label="Email Address"
    type="email"
    bind:value={formData.email}
    error={emailError}
    onblur={() => handleBlur('email')}
    required
  />
  
  <Input
    id="password"
    label="Password"
    type="password"
    bind:value={formData.password}
    error={passwordError}
    onblur={() => handleBlur('password')}
    required
  />
  
  {#if errors.submit}
    <Alert variant="error">
      {#snippet children()}
        <h4 class="text-sm font-semibold text-red-900">Error</h4>
        <p class="text-sm text-red-700">{errors.submit}</p>
      {/snippet}
    </Alert>
  {/if}
  
  <Button type="submit" disabled={!isValid}>Sign In</Button>
</form>
```

#### Multi-step Form

Break complex forms into logical steps.

```svelte
<script>
  import { Button, Card } from '$lib/components';
  
  let currentStep = $state(1);
  const totalSteps = 3;
  
  let formData = $state({
    step1: {},
    step2: {},
    step3: {}
  });
  
  function nextStep() {
    // Validate current step
    if (validateStep(currentStep)) {
      currentStep++;
    }
  }
  
  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
    }
  }
  
  function validateStep(step: number) {
    // Return true if valid
    return true;
  }
</script>

<Card>
  {#snippet children()}
    <div class="space-y-6">
      <!-- Progress indicator -->
      <div class="flex items-center justify-between mb-6">
        {#each [1, 2, 3] as step}
          <div
            class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium {
              step === currentStep ? 'bg-zinc-900 text-white' :
              step < currentStep ? 'bg-emerald-500 text-white' :
              'bg-zinc-200 text-zinc-600'
            }"
          >
            {step}
          </div>
        {/each}
      </div>
      
      <!-- Step content -->
      {#if currentStep === 1}
        <div>
          <h2 class="text-xl font-semibold text-zinc-900 mb-4">Step 1</h2>
          <Input label="Name" bind:value={formData.step1.name} />
          <Input label="Email" type="email" bind:value={formData.step1.email} />
        </div>
      {:else if currentStep === 2}
        <div>
          <h2 class="text-xl font-semibold text-zinc-900 mb-4">Step 2</h2>
          <Input label="Address" bind:value={formData.step2.address} />
          <Input label="City" bind:value={formData.step2.city} />
        </div>
      {:else if currentStep === 3}
        <div>
          <h2 class="text-xl font-semibold text-zinc-900 mb-4">Step 3</h2>
          <Textarea label="Notes" rows={4} bind:value={formData.step3.notes} />
        </div>
      {/if}
      
      <!-- Navigation buttons -->
      <div class="flex justify-between mt-6">
        <Button
          variant="secondary"
          onclick={prevStep}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        <Button onclick={nextStep}>
          {currentStep === totalSteps ? 'Complete' : 'Next'}
        </Button>
      </div>
    </div>
  {/snippet}
</Card>
```

### Form Groups

#### Field Group with Label

Group related form fields together.

```svelte
<script>
  import { Input } from '$lib/components';
</script>

<div class="space-y-4 p-4 bg-zinc-50 rounded-lg">
  <h3 class="text-base font-semibold text-zinc-900 mb-2">Personal Information</h3>
  <Input label="First Name" bind:value={personal.firstName} />
  <Input label="Last Name" bind:value={personal.lastName} />
  <Input label="Email" type="email" bind:value={personal.email} />
</div>

<div class="space-y-4 p-4 bg-zinc-50 rounded-lg">
  <h3 class="text-base font-semibold text-zinc-900 mb-2">Address</h3>
  <Input label="Street" bind:value={address.street} />
  <Input label="City" bind:value={address.city} />
  <Select label="Country" options={countries} bind:value={address.country} />
</div>
```

---

## State Management

### URL Parameter Pattern

Use URL parameters for shareable, bookmarkable state.

#### Tab Navigation

```svelte
<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  // Derive active tab from URL
  const tabParam = $derived($page.url.searchParams.get('tab'));
  const activeTab = $derived(tabParam || 'overview'); // Default tab
  
  // Update URL when tab changes
  async function setTab(tabId: string) {
    const url = new URL($page.url);
    
    if (tabId === 'overview') {
      // Remove param for default tab
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tabId);
    }
    
    // Navigate without scrolling
    await goto(url.pathname + url.search, { noScroll: true });
  }
</script>

<div class="space-y-6">
  <!-- Tab navigation -->
  <div class="flex gap-4 border-b border-zinc-200">
    <button
      onclick={() => setTab('overview')}
      class="px-4 py-2 text-sm font-medium border-b-2 {
        activeTab === 'overview' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-600 hover:text-zinc-900'
      }"
    >
      Overview
    </button>
    <button
      onclick={() => setTab('details')}
      class="px-4 py-2 text-sm font-medium border-b-2 {
        activeTab === 'details' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-600 hover:text-zinc-900'
      }"
    >
      Details
    </button>
    <button
      onclick={() => setTab('settings')}
      class="px-4 py-2 text-sm font-medium border-b-2 {
        activeTab === 'settings' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-600 hover:text-zinc-900'
      }"
    >
      Settings
    </button>
  </div>
  
  <!-- Tab content -->
  {#if activeTab === 'overview'}
    <div>Overview content</div>
  {:else if activeTab === 'details'}
    <div>Details content</div>
  {:else if activeTab === 'settings'}
    <div>Settings content</div>
  {/if}
</div>
```

#### Filter State

Store filters in URL for shareable filtered views.

```svelte
<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  // Derive filters from URL
  const filterParam = $derived($page.url.searchParams.get('filter'));
  const sortParam = $derived($page.url.searchParams.get('sort'));
  
  const activeFilter = $derived(filterParam || 'all');
  const activeSort = $derived(sortParam || 'newest');
  
  // Update URL when filter changes
  async function setFilter(filterId: string) {
    const url = new URL($page.url);
    
    if (filterId === 'all') {
      url.searchParams.delete('filter');
    } else {
      url.searchParams.set('filter', filterId);
    }
    
    await goto(url.pathname + url.search, { noScroll: true });
  }
  
  async function setSort(sortId: string) {
    const url = new URL($page.url);
    url.searchParams.set('sort', sortId);
    await goto(url.pathname + url.search, { noScroll: true });
  }
</script>

<div class="space-y-6">
  <!-- Filters -->
  <div class="flex items-center gap-2">
    <span class="text-sm text-zinc-600">Filter:</span>
    {#each ['all', 'active', 'completed'] as filter}
      <button
        onclick={() => setFilter(filter)}
        class="px-3 py-1.5 rounded-full text-xs font-medium {
          activeFilter === filter ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
        }"
      >
        {filter}
      </button>
    {/each}
  </div>
  
  <!-- Sort -->
  <div class="flex items-center gap-2">
    <span class="text-sm text-zinc-600">Sort by:</span>
    <button
      onclick={() => setSort('newest')}
      class="text-sm text-zinc-600 hover:text-zinc-900"
    >
      {activeSort === 'newest' ? '✓ ' : ''}Newest
    </button>
    <button
      onclick={() => setSort('oldest')}
      class="text-sm text-zinc-600 hover:text-zinc-900"
    >
      {activeSort === 'oldest' ? '✓ ' : ''}Oldest
    </button>
  </div>
  
  <!-- Results -->
  <div class="space-y-3">
    <!-- Filtered items go here -->
  </div>
</div>
```

---

### Svelte 5 Runes

#### Using $state for Component State

```svelte
<script>
  // Reactive component state
  let count = $state(0);
  let isOpen = $state(false);
  let formData = $state({
    name: '',
    email: '',
    message: ''
  });
  
  function increment() {
    count++;
  }
  
  function toggleModal() {
    isOpen = !isOpen;
  }
</script>

<div class="space-y-4">
  <p>Count: {count}</p>
  <Button onclick={increment}>Increment</Button>
  
  <Button onclick={toggleModal}>
    {isOpen ? 'Close Modal' : 'Open Modal'}
  </Button>
</div>
```

#### Using $derived for Computed Values

```svelte
<script>
  let items = $state([
    { id: 1, name: 'Item 1', price: 10, quantity: 2 },
    { id: 2, name: 'Item 2', price: 20, quantity: 1 },
    { id: 3, name: 'Item 3', price: 15, quantity: 3 }
  ]);
  
  let filter = $state('');
  
  // Simple derived value
  const totalItems = $derived(items.length);
  const totalPrice = $derived(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  
  // Derived with dependencies
  const filteredItems = $derived(
    filter
      ? items.filter(item => item.name.toLowerCase().includes(filter.toLowerCase()))
      : items
  );
  
  // Complex derived with .by()
  const availableItems = $derived.by(() => {
    return items.filter(item => item.quantity > 0);
  });
</script>

<div class="space-y-6">
  <!-- Stats -->
  <div class="flex gap-6">
    <div>
      <p class="text-sm text-zinc-600">Total Items</p>
      <p class="text-2xl font-bold text-zinc-900">{totalItems}</p>
    </div>
    <div>
      <p class="text-sm text-zinc-600">Total Price</p>
      <p class="text-2xl font-bold text-zinc-900">${totalPrice}</p>
    </div>
  </div>
  
  <!-- Filter -->
  <Input
    label="Search items"
    placeholder="Filter by name..."
    bind:value={filter}
  />
  
  <!-- Filtered list -->
  <div class="space-y-2">
    {#each filteredItems as item}
      <div class="p-3 bg-zinc-50 rounded-lg">
        <p class="text-base font-semibold text-zinc-900">{item.name}</p>
        <p class="text-sm text-zinc-600">${item.price} x {item.quantity}</p>
      </div>
    {/each}
  </div>
</div>
```

#### Using $effect for Side Effects

```svelte
<script>
  import { page } from '$app/stores';
  
  let data = $state(null);
  let loading = $state(false);
  let error = $state(null);
  
  // Effect that runs when dependencies change
  $effect(() => {
    // Automatically fetch when page changes
    const pageId = $page.params.id;
    if (pageId) {
      fetchData(pageId);
    }
  });
  
  async function fetchData(id: string) {
    loading = true;
    error = null;
    
    try {
      const response = await fetch(`/api/items/${id}`);
      data = await response.json();
    } catch (e) {
      error = 'Failed to load data';
    } finally {
      loading = false;
    }
  }
</script>

{#if loading}
  <div class="p-4 text-center">
    <Spinner />
    <p class="text-sm text-zinc-600 mt-2">Loading...</p>
  </div>
{:else if error}
  <Alert variant="error">
    {#snippet children()}
      <p class="text-sm text-red-700">{error}</p>
    {/snippet}
  </Alert>
{:else if data}
  <div>
    <!-- Render data -->
  </div>
{/if}
```

---

## Common States

### Loading States

#### Button Loading

```svelte
<script>
  import { Button } from '$lib/components';
  import { Spinner } from '$lib/components';
  
  let saving = $state(false);
  
  async function handleSave() {
    saving = true;
    try {
      await performSave();
    } finally {
      saving = false;
    }
  }
</script>

<Button disabled={saving} onclick={handleSave}>
  {#if saving}
    <Spinner size="sm" />
    <span class="ml-2">Saving...</span>
  {:else}
    Save Changes
  {/if}
</Button>
```

#### Card Loading

```svelte
<script>
  import { Card, Spinner } from '$lib/components';
  
  let loading = $state(true);
  
  // Simulate data fetch
  $effect(() => {
    setTimeout(() => {
      loading = false;
    }, 2000);
  });
</script>

<Card>
  {#snippet children()}
    {#if loading}
      <div class="flex flex-col items-center justify-center py-12">
        <Spinner />
        <p class="text-sm text-zinc-600 mt-3">Loading data...</p>
      </div>
    {:else}
      <div>
        <h3 class="text-lg font-semibold text-zinc-900 mb-2">Content Loaded</h3>
        <p class="text-sm text-zinc-600">Your content is ready.</p>
      </div>
    {/if}
  {/snippet}
</Card>
```

---

### Empty States

#### Empty List

```svelte
<script>
  import { Button } from '$lib/components';
  import { Inbox } from 'lucide-svelte';
  
  let items = $state([]);
</script>

{#if items.length === 0}
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div class="mb-4 text-zinc-300">
      <Inbox class="w-16 h-16" />
    </div>
    <h3 class="text-lg font-semibold text-zinc-900 mb-2">
      No items found
    </h3>
    <p class="text-sm text-zinc-600 max-w-sm">
      You haven't created any items yet. Get started by creating your first item.
    </p>
    <Button onclick={handleCreate} class="mt-4">
      Create First Item
    </Button>
  </div>
{:else}
  <div class="space-y-3">
    {#each items as item}
      <div class="p-4 bg-white border border-zinc-200 rounded-lg">
        <p class="text-base text-zinc-900">{item.name}</p>
      </div>
    {/each}
  </div>
{/if}
```

#### Empty Search Results

```svelte
<script>
  import { Input } from '$lib/components';
  import { Search } from 'lucide-svelte';
  
  let searchQuery = $state('');
  let results = $state([]);
  
  const hasResults = $derived(searchQuery && results.length > 0);
  const hasNoResults = $derived(searchQuery && results.length === 0);
</script>

<div class="space-y-6">
  <Input
    label="Search"
    placeholder="Search for items..."
    bind:value={searchQuery}
  />
  
  {#if hasNoResults}
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="mb-4 text-zinc-300">
        <Search class="w-16 h-16" />
      </div>
      <h3 class="text-lg font-semibold text-zinc-900 mb-2">
        No results found
      </h3>
      <p class="text-sm text-zinc-600 max-w-sm">
        We couldn't find any items matching "{searchQuery}". Try a different search term.
      </p>
    </div>
  {:else if hasResults}
    <div class="space-y-3">
      {#each results as result}
        <div class="p-4 bg-white border border-zinc-200 rounded-lg">
          <p class="text-base text-zinc-900">{result.name}</p>
        </div>
      {/each}
    </div>
  {:else if !searchQuery}
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="mb-4 text-zinc-300">
        <Search class="w-16 h-16" />
      </div>
      <p class="text-sm text-zinc-600 max-w-sm">
        Enter a search term to find items.
      </p>
    </div>
  {/if}
</div>
```

---

### Error States

#### Inline Error Message

```svelte
<script>
  import { Input, Alert, Button } from '$lib/components';
  
  let formData = $state({ email: '' });
  let error = $state(null);
  
  async function handleSubmit() {
    error = null;
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        error = 'Failed to subscribe. Please try again.';
      }
    } catch (e) {
      error = 'Network error. Please check your connection.';
    }
  }
</script>

<form onsubmit={handleSubmit} class="space-y-4 max-w-md">
  {#if error}
    <Alert variant="error" dismissible ondismiss={() => error = null}>
      {#snippet children()}
        <h4 class="text-sm font-semibold text-red-900 mb-1">Error</h4>
        <p class="text-sm text-red-700">{error}</p>
      {/snippet}
    </Alert>
  {/if}
  
  <Input
    id="email"
    label="Email Address"
    type="email"
    placeholder="you@example.com"
    bind:value={formData.email}
    required
  />
  
  <Button type="submit">Subscribe</Button>
</form>
```

#### Full Page Error

```svelte
<script>
  import { Button } from '$lib/components';
  import { AlertCircle } from 'lucide-svelte';
</script>

<div class="container mx-auto px-4 py-16 max-w-2xl text-center">
  <div class="mb-6 text-zinc-300">
    <AlertCircle class="w-20 h-20 mx-auto" />
  </div>
  
  <h1 class="text-3xl font-bold text-zinc-900 mb-4">
    Something went wrong
  </h1>
  
  <p class="text-lg text-zinc-600 mb-6 max-w-lg mx-auto">
    We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.
  </p>
  
  <div class="flex justify-center gap-3">
    <Button variant="secondary" onclick={() => goto('/')}>
      Go Home
    </Button>
    <Button onclick={() => window.location.reload()}>
      Try Again
    </Button>
  </div>
</div>
```

---

## Data Patterns

### List Views

#### Simple List

```svelte
<script>
  import { Card, Badge } from '$lib/components';
  
  let items = $state([
    { id: 1, name: 'Task 1', status: 'completed' },
    { id: 2, name: 'Task 2', status: 'in-progress' },
    { id: 3, name: 'Task 3', status: 'pending' }
  ]);
</script>

<Card showHeader={true}>
  {#snippet header()}
    <h2 class="text-lg font-semibold text-zinc-900">Tasks</h2>
  {/snippet}
  
  {#snippet children()}
    <div class="space-y-3">
      {#each items as item}
        <div class="flex items-center justify-between p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors">
          <div class="flex items-center gap-3">
            <span class="text-base text-zinc-900">{item.name}</span>
            <Badge
              variant={item.status === 'completed' ? 'success' : item.status === 'in-progress' ? 'warning' : 'neutral'}
            >
              {item.status}
            </Badge>
          </div>
          <Button variant="ghost" size="sm">View</Button>
        </div>
      {/each}
    </div>
  {/snippet}
</Card>
```

#### Card List

```svelte
<script>
  import { Card, Button } from '$lib/components';
  
  let projects = $state([
    { id: 1, name: 'Project Alpha', description: 'First project', status: 'active' },
    { id: 2, name: 'Project Beta', description: 'Second project', status: 'active' },
    { id: 3, name: 'Project Gamma', description: 'Third project', status: 'completed' }
  ]);
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {#each projects as project}
    <Card hover={true} showFooter={true}>
      {#snippet header()}
        <div class="flex items-start justify-between">
          <h3 class="text-lg font-semibold text-zinc-900">{project.name}</h3>
          <Badge variant={project.status === 'active' ? 'success' : 'neutral'}>
            {project.status}
          </Badge>
        </div>
      {/snippet}
      
      {#snippet children()}
        <p class="text-sm text-zinc-600">{project.description}</p>
      {/snippet}
      
      {#snippet footer()}
        <Button variant="outline" size="sm" onclick={() => goto(`/projects/${project.id}`)}>
          View Details
        </Button>
      {/snippet}
    </Card>
  {/each}
</div>
```

---

### Detail Views

#### Single Item Detail

```svelte
<script>
  import { page } from '$app/stores';
  import { Card, Badge, Button } from '$lib/components';
  import { ArrowLeft, Edit, Trash2 } from 'lucide-svelte';
  
  let item = $state(null);
  let loading = $state(true);
  let error = $state(null);
  
  $effect(() => {
    const itemId = $page.params.id;
    if (itemId) {
      fetchItem(itemId);
    }
  });
  
  async function fetchItem(id: string) {
    loading = true;
    error = null;
    
    try {
      const response = await fetch(`/api/items/${id}`);
      item = await response.json();
    } catch (e) {
      error = 'Failed to load item';
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-3xl">
  <Button variant="ghost" onclick={() => goto('/items')} class="mb-4">
    <ArrowLeft class="w-4 h-4 mr-2" />
    Back to Items
  </Button>
  
  {#if loading}
    <Card>
      {#snippet children()}
        <div class="flex flex-col items-center justify-center py-12">
          <Spinner />
          <p class="text-sm text-zinc-600 mt-2">Loading...</p>
        </div>
      {/snippet}
    </Card>
  {:else if error}
    <Alert variant="error">
      {#snippet children()}
        <p class="text-sm text-red-700">{error}</p>
      {/snippet}
    </Alert>
  {:else if item}
    <div class="space-y-6">
      <!-- Title and actions -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-3xl font-bold text-zinc-900">{item.name}</h1>
          <p class="text-sm text-zinc-600 mt-1">Created {item.createdAt}</p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" onclick={() => goto(`/items/${item.id}/edit`)}>
            <Edit class="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onclick={handleDelete}>
            <Trash2 class="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <!-- Status and metadata -->
      <Card showHeader={true}>
        {#snippet header()}
          <h2 class="text-lg font-semibold text-zinc-900">Details</h2>
        {/snippet}
        {#snippet children()}
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-600">Status</span>
              <Badge variant={item.status === 'active' ? 'success' : 'neutral'}>
                {item.status}
              </Badge>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-600">Priority</span>
              <Badge variant="neutral">{item.priority}</Badge>
            </div>
          </div>
        {/snippet}
      </Card>
      
      <!-- Description -->
      <Card showHeader={true}>
        {#snippet header()}
          <h2 class="text-lg font-semibold text-zinc-900">Description</h2>
        {/snippet}
        {#snippet children()}
          <p class="text-sm text-zinc-700 leading-relaxed">{item.description}</p>
        {/snippet}
      </Card>
    </div>
  {/if}
</div>
```

---

### Dashboard Views

#### Stats Dashboard

```svelte
<script>
  import { Card } from '$lib/components';
  
  let stats = $state({
    totalUsers: 1234,
    activeUsers: 56,
    newSignups: 23,
    revenue: 45678
  });
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-zinc-900 mb-6">Dashboard</h1>
  
  <!-- Stats Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <Card showHeader={true}>
      {#snippet header()}
        <h3 class="text-sm text-zinc-600">Total Users</h3>
      {/snippet}
      {#snippet children()}
        <p class="text-3xl font-bold text-zinc-900">{stats.totalUsers}</p>
      {/snippet}
    </Card>
    
    <Card showHeader={true}>
      {#snippet header()}
        <h3 class="text-sm text-zinc-600">Active Now</h3>
      {/snippet}
      {#snippet children()}
        <p class="text-3xl font-bold text-zinc-900">{stats.activeUsers}</p>
      {/snippet}
    </Card>
    
    <Card showHeader={true}>
      {#snippet header()}
        <h3 class="text-sm text-zinc-600">New Signups</h3>
      {/snippet}
      {#snippet children()}
        <p class="text-3xl font-bold text-zinc-900">{stats.newSignups}</p>
      {/snippet}
    </Card>
    
    <Card showHeader={true}>
      {#snippet header()}
        <h3 class="text-sm text-zinc-600">Revenue</h3>
      {/snippet}
      {#snippet children()}
        <p class="text-3xl font-bold text-zinc-900">${stats.revenue}</p>
      {/snippet}
    </Card>
  </div>
</div>
```

#### Activity Dashboard

```svelte
<script>
  import { Card } from '$lib/components';
  
  let activities = $state([
    { id: 1, user: 'John Doe', action: 'created project', time: '2 minutes ago' },
    { id: 2, user: 'Jane Smith', action: 'completed task', time: '5 minutes ago' },
    { id: 3, user: 'Bob Wilson', action: 'commented on issue', time: '10 minutes ago' },
    { id: 4, user: 'Alice Brown', action: 'updated settings', time: '15 minutes ago' }
  ]);
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-zinc-900 mb-6">Recent Activity</h1>
  
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Activity Feed -->
    <div class="lg:col-span-2">
      <Card>
        {#snippet children()}
          <div class="space-y-4">
            {#each activities as activity}
              <div class="flex items-start gap-3 p-3 hover:bg-zinc-50 rounded-lg transition-colors">
                <div class="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0">
                  <span class="text-xs font-medium text-zinc-600">
                    {activity.user.charAt(0)}
                  </span>
                </div>
                <div class="flex-1">
                  <p class="text-sm text-zinc-900">
                    <span class="font-semibold">{activity.user}</span>
                    <span class="text-zinc-600"> {activity.action}</span>
                  </p>
                  <p class="text-xs text-zinc-500">{activity.time}</p>
                </div>
              </div>
            {/each}
          </div>
        {/snippet}
      </Card>
    </div>
    
    <!-- Quick Actions -->
    <div>
      <Card showHeader={true}>
        {#snippet header()}
          <h2 class="text-lg font-semibold text-zinc-900">Quick Actions</h2>
        {/snippet}
        {#snippet children()}
          <div class="space-y-2">
            <Button variant="secondary" class="w-full">Create New Project</Button>
            <Button variant="secondary" class="w-full">Add Team Member</Button>
            <Button variant="secondary" class="w-full">View Reports</Button>
          </div>
        {/snippet}
      </Card>
    </div>
  </div>
</div>
```

---

## Best Practices

### Pattern Selection

**Use these patterns when:**

- **Flexbox Layouts** - Simple row/column layouts, distributing space
- **Grid Layouts** - Card-based layouts, dashboard stats, responsive columns
- **Form Validation** - User input forms with validation requirements
- **URL Parameter Pattern** - Shareable state (tabs, filters, pagination)
- **Svelte 5 Runes** - All component state and derived values
- **Loading States** - Async operations, data fetching
- **Empty States** - Lists, search results, data tables
- **Error States** - Form submissions, API failures

### Accessibility

- Always provide loading indicators for async operations
- Use semantic HTML (`<form>`, `<button>`, `<label>`)
- Include ARIA attributes for interactive elements
- Ensure keyboard navigation works for all interactive elements
- Provide clear error messages with solutions

### Performance

- Use `$derived` instead of computed values in render
- Use `$derived.by()` for complex derived state
- Avoid unnecessary re-renders with proper reactive dependencies
- Lazy load overlay components (only render when `open={true}`)

### Consistency

- Always use zinc color palette for neutral UI
- Follow typography hierarchy (heading sizes, text colors)
- Use consistent spacing (gap-2, gap-4, space-y-4)
- Apply consistent border radius (rounded-lg, rounded-md)
- Include hover/active states for interactive elements

---

## Next Steps

1. **Browse Components**: Review [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) for available components
2. **Best Practices**: Study [BEST_PRACTICES.md](./BEST_PRACTICES.md) for guidelines
3. **Project Setup**: Check [PROJECT_SETUP.md](./PROJECT_SETUP.md) for initialization
4. **Main Hub**: Return to [SKILL.md](./SKILL.md) for quick reference

---

## Common Questions

### When should I use URL state vs component state?

**Use URL state for:**
- Navigation (tabs, pages)
- Filters (search, category, status)
- Pagination (page number, page size)
- Shareable/ bookmarkable views

**Use component state for:**
- Form input values
- Modal open/close
- Temporary UI state
- Animation states

### How do I handle form validation?

1. Use `$state` for form data and errors
2. Use `$derived` for validation errors based on touched state
3. Show errors inline with `error` prop on Input components
4. Disable submit button while invalid
5. Clear errors on successful submission

### How do I make responsive layouts?

1. Start with mobile-first (single column)
2. Add breakpoints: `md:` for tablets, `lg:` for desktops
3. Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for responsive grids
4. Use `hidden md:flex` for responsive visibility
5. Test at different screen sizes