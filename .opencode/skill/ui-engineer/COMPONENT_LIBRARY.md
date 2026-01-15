# Component Library

Complete catalog of reusable UI components for gray-html design system.

## Table of Contents

- [Layout Components](#layout-components)
  - [Header](#header)
  - [Footer](#footer)
- [Core Components](#core-components)
  - [Card](#card)
  - [Button](#button)
  - [Alert](#alert)
  - [Badge](#badge)
- [Form Components](#form-components)
  - [Input](#input)
  - [Select](#select)
  - [Textarea](#textarea)
  - [Checkbox](#checkbox)
- [Display Components](#display-components)
  - [UserAvatar](#useravatar)
  - [Spinner](#spinner)
- [Overlay Components](#overlay-components)
  - [Modal](#modal)
  - [Drawer](#drawer)
  - [Tabs](#tabs)

---

## Layout Components

### Header

Navigation header component with logo, links, and action buttons.

**Props:**
```typescript
interface Props {
  logo?: Snippet;
  navigation?: Snippet;
  actions?: Snippet;
  class?: string;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface Props {
    logo?: Snippet;
    navigation?: Snippet;
    actions?: Snippet;
    class?: string;
  }
  let { logo, navigation, actions, class: className = "" }: Props = $props();
</script>

<header class="border-b border-zinc-200 bg-white {className}">
  <nav class="container mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      {#if logo}
        <div class="flex items-center gap-2">
          {@render logo()}
        </div>
      {:else}
        <a href="/" class="flex items-center gap-2 group">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 text-zinc-900 group-hover:text-zinc-700 transition-colors"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.048 4.025a3 3 0 01-4.172-4.172 3 3 0 014.172 4.172zm0 0a15.971 15.971 0 004.138 1.561 4.5 4.5 0 008.312-2.245 4.5 4.5 0 00-8.312-2.245 15.97 15.97 0 00-4.138 1.561zm0 0a3 3 0 104.172-4.172 3 3 0 00-4.172 4.172z"
            />
          </svg>
          <span class="text-lg font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors">
            Brand
          </span>
        </a>
      {/if}

      <!-- Navigation -->
      {#if navigation}
        <div class="hidden md:flex items-center gap-6">
          {@render navigation()}
        </div>
      {/if}

      <!-- Actions -->
      {#if actions}
        <div class="flex items-center gap-3">
          {@render actions()}
        </div>
      {:else}
        <div class="flex items-center gap-3">
          <a href="/signin" class="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
            Sign In
          </a>
          <a
            href="/signup"
            class="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
          >
            Get Started
          </a>
        </div>
      {/if}
    </div>
  </nav>
</header>
```

**Usage Examples:**
```svelte
<script>
  import { Header, Button } from '$lib/components';
  import { ShoppingCart, User } from 'lucide-svelte';
</script>

<!-- Custom Logo -->
<Header
  logo={
    <a href="/" class="flex items-center gap-2">
      <Logo class="w-8 h-8" />
      <span class="font-bold">MyApp</span>
    </a>
  }
  navigation={
    <>
      <a href="/" class="text-sm text-zinc-600 hover:text-zinc-900">Home</a>
      <a href="/products" class="text-sm text-zinc-600 hover:text-zinc-900">Products</a>
      <a href="/about" class="text-sm text-zinc-600 hover:text-zinc-900">About</a>
    </>
  }
  actions={
    <>
      <Button variant="ghost" size="sm">
        <ShoppingCart class="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <User class="w-4 h-4" />
      </Button>
    </>
  }
/>

<!-- Simple Default Header -->
<Header />
```

---

### Footer

Footer component with copyright information and navigation links.

**Props:**
```typescript
interface Props {
  showNavigation?: boolean;
  copyright?: string;
  class?: string;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface Props {
    showNavigation?: boolean;
    copyright?: string;
    class?: string;
  }
  let {
    showNavigation = true,
    copyright,
    class: className = ""
  }: Props = $props();
</script>

<footer class="border-t border-zinc-200 bg-white {className}">
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col md:flex-row items-center justify-between gap-4">
      <!-- Logo and Copyright -->
      <div class="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 text-zinc-600"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.048 4.025a3 3 0 01-4.172-4.172 3 3 0 014.172 4.172zm0 0a15.971 15.971 0 004.138 1.561 4.5 4.5 0 008.312-2.245 4.5 4.5 0 00-8.312-2.245 15.97 15.97 0 00-4.138 1.561zm0 0a3 3 0 104.172-4.172 3 3 0 00-4.172 4.172z"
          />
        </svg>
        <span class="text-sm text-zinc-600">
          {copyright || `© ${new Date().getFullYear()} Brand. All rights reserved.`}
        </span>
      </div>

      <!-- Navigation Links -->
      {#if showNavigation}
        <div class="flex items-center gap-6">
          <a href="/" class="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
            Home
          </a>
          <a href="/about" class="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
            About
          </a>
          <a href="/privacy" class="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
            Privacy
          </a>
          <a href="/terms" class="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
            Terms
          </a>
        </div>
      {/if}
    </div>
  </div>
</footer>
```

**Usage Examples:**
```svelte
<script>
  import { Footer } from '$lib/components';
</script>

<!-- Default Footer -->
<Footer />

<!-- Custom Copyright -->
<Footer copyright="© 2025 My Company. MIT License." />

<!-- Minimal Footer -->
<Footer showNavigation={false} copyright="Built with ❤️" />
```

---

## Core Components

### Card

Container component for grouped content with optional header and footer.

**Props:**
```typescript
interface Props {
  showHeader?: boolean;
  showFooter?: boolean;
  hover?: boolean;
  onclick?: () => void;
  class?: string;
  children?: Snippet;
  header?: Snippet;
  footer?: Snippet;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface Props {
    showHeader?: boolean;
    showFooter?: boolean;
    hover?: boolean;
    onclick?: () => void;
    class?: string;
    children?: Snippet;
    header?: Snippet;
    footer?: Snippet;
  }

  let {
    showHeader = false,
    showFooter = false,
    hover = false,
    onclick,
    class: className = "",
    children,
    header,
    footer
  }: Props = $props();

  function handleClick() {
    if (onclick) {
      onclick();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && onclick) {
      event.preventDefault();
      onclick();
    }
  }
</script>

<div
  class="bg-white border border-zinc-200 rounded-lg shadow-sm {hover
    ? 'group cursor-pointer hover:shadow-md hover:border-zinc-300 transition-all duration-200'
    : ''} {className}"
  onclick={handleClick}
  onkeydown={onclick ? handleKeydown : undefined}
  role={onclick ? "button" : undefined}
  tabindex={onclick ? 0 : undefined}
>
  {#if showHeader && header}
    <div class="p-5 pb-3">
      {@render header()}
    </div>
  {/if}

  {#if children}
    <div class="p-5">
      {@render children()}
    </div>
  {/if}

  {#if showFooter && footer}
    <div class="px-5 py-3 bg-zinc-50 border-t border-zinc-200 rounded-b-lg">
      {@render footer()}
    </div>
  {/if}
</div>
```

**Usage Examples:**
```svelte
<script>
  import { Card, Button } from '$lib/components';
  import { User, ArrowRight } from 'lucide-svelte';
</script>

<!-- Simple Card -->
<Card>
  {#snippet children()}
    <h3 class="text-lg font-semibold text-zinc-900">Title</h3>
    <p class="text-sm text-zinc-600 mt-2">Content here</p>
  {/snippet}
</Card>

<!-- Card with Header and Footer -->
<Card showHeader={true} showFooter={true}>
  {#snippet header()}
    <div class="flex items-start justify-between">
      <h3 class="text-lg font-semibold text-zinc-900">Card Title</h3>
      <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Active
      </span>
    </div>
  {/snippet}
  
  {#snippet children()}
    <p class="text-sm text-zinc-600">Card content goes here.</p>
  {/snippet}
  
  {#snippet footer()}
    <Button size="sm">View Details</Button>
  {/snippet}
</Card>

<!-- Clickable Card -->
<Card hover={true} onclick={() => goto('/details')}>
  {#snippet children()}
    <h3 class="text-lg font-semibold text-zinc-900 mb-2">Click Me</h3>
    <p class="text-sm text-zinc-500 group-hover:text-zinc-600 transition-colors">
      Click to navigate
    </p>
  {/snippet}
</Card>

<!-- Stats Card -->
<Card showHeader={true}>
  {#snippet header()}
    <h3 class="text-lg font-semibold text-zinc-900">Statistics</h3>
  {/snippet}
  
  {#snippet children()}
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <span class="text-sm text-zinc-600 min-w-[120px]">Total Users:</span>
        <span class="text-2xl font-bold text-zinc-900">1,234</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-zinc-600 min-w-[120px]">Active Now:</span>
        <span class="text-2xl font-bold text-zinc-900">56</span>
      </div>
    </div>
  {/snippet}
</Card>
```

---

### Button

Primary action component with multiple variants and sizes.

**Props:**
```typescript
interface Props {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  class?: string;
  children?: Snippet;
  onclick?: () => void;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface Props {
    variant?: "default" | "secondary" | "outline" | "ghost";
    size?: "sm" | "default" | "lg";
    fullWidth?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    class?: string;
    children?: Snippet;
    onclick?: () => void;
  }

  let {
    variant = "default",
    size = "default",
    fullWidth = false,
    disabled = false,
    type = "button",
    class: className = "",
    children,
    onclick,
  }: Props = $props();

  const variantStyles: Record<string, string> = {
    default: "bg-zinc-900 text-white hover:bg-zinc-800 focus:ring-zinc-500",
    secondary: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 focus:ring-zinc-300",
    outline:
      "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 focus:ring-zinc-300",
    ghost: "text-zinc-700 hover:bg-zinc-100 focus:ring-zinc-300",
  };

  const sizeStyles: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";
</script>

<button
  {type}
  {disabled}
  class="{baseStyles} {variantStyles[variant]} {sizeStyles[size]} {fullWidth
    ? 'w-full'
    : ''} {className}"
  {onclick}
>
  {#if children}
    {@render children()}
  {/if}
</button>
```

**Usage Examples:**
```svelte
<script>
  import { Button } from '$lib/components';
  import { Save, X, Eye, Edit } from 'lucide-svelte';
</script>

<!-- Primary Button -->
<Button onclick={handleSave}>Save Changes</Button>

<!-- Secondary Button -->
<Button variant="secondary" onclick={handleCancel}>Cancel</Button>

<!-- Outline Button -->
<Button variant="outline" onclick={handlePreview}>Preview</Button>

<!-- Ghost Button -->
<Button variant="ghost" onclick={handleEdit}>Edit</Button>

<!-- With Icon -->
<Button onclick={handleSave}>
  <Save class="w-4 h-4 mr-2" />
  Save
</Button>

<!-- Small Button -->
<Button size="sm" onclick={handleAction}>Action</Button>

<!-- Large Button -->
<Button size="lg" onclick={handleAction}>
  Large Button
</Button>

<!-- Submit Button in Form -->
<form onsubmit={handleSubmit}>
  <Button type="submit">Submit Form</Button>
</form>

<!-- Disabled Button -->
<Button disabled={loading} onclick={handleSave}>
  {#if loading}Saving...{:else}Save{/if}
</Button>

<!-- Full Width Button -->
<Button fullWidth onclick={handleAction}>
  Full Width Action
</Button>

<!-- Button Group -->
<div class="flex items-center gap-3">
  <Button variant="secondary" onclick={handleCancel}>Cancel</Button>
  <Button onclick={handleConfirm}>Confirm</Button>
</div>
```

---

### Alert

Inline notification component for displaying messages with dismissible option.

**Props:**
```typescript
interface Props {
  variant?: 'error' | 'success' | 'warning' | 'info';
  dismissible?: boolean;
  ondismiss?: () => void;
  children?: Snippet;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface Props {
    variant?: "error" | "success" | "warning" | "info";
    dismissible?: boolean;
    ondismiss?: () => void;
    children?: Snippet;
  }

  let {
    variant = "info",
    dismissible = false,
    ondismiss = () => {},
    children,
  }: Props = $props();

  let dismissed = $state(false);

  const variantStyles: Record<
    string,
    { bg: string; border: string; icon: string; title: string }
  > = {
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-500",
      title: "text-red-900",
    },
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "text-green-500",
      title: "text-green-900",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "text-amber-500",
      title: "text-amber-900",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-500",
      title: "text-blue-900",
    },
  };

  const styles = $derived(variantStyles[variant]);

  function handleDismiss() {
    dismissed = true;
    ondismiss();
  }

  const icons = {
    error: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>`,
    success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>`,
  };
</script>

{#if !dismissed}
  <div
    class="{styles.bg} border {styles.border} rounded-lg p-4"
    role="alert"
    aria-live="polite"
  >
    <div class="flex items-start gap-3">
      <div class="{styles.icon} flex-shrink-0">
        {@html icons[variant]}
      </div>

      <div class="flex-1 min-w-0">
        {#if children}
          {@render children()}
        {/if}
      </div>

      {#if dismissible}
        <button
          type="button"
          onclick={handleDismiss}
          class="text-zinc-400 hover:text-zinc-600 transition-colors flex-shrink-0 p-0.5 rounded hover:bg-zinc-200/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-300"
          aria-label="Dismiss alert"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      {/if}
    </div>
  </div>
{/if}
```

**Usage Examples:**
```svelte
<script>
  import { Alert, Button } from '$lib/components';
  let error = $state('Something went wrong');
  let success = $state(false);
</script>

<!-- Error Alert -->
<Alert variant="error" dismissible ondismiss={() => error = null}>
  {#snippet children()}
    <h4 class="text-sm font-semibold text-red-900 mb-1">Error</h4>
    <p class="text-sm text-red-700">{error}</p>
  {/snippet}
</Alert>

<!-- Success Alert -->
<Alert variant="success">
  {#snippet children()}
    <h4 class="text-sm font-semibold text-green-900 mb-1">Success</h4>
    <p class="text-sm text-green-700">Operation completed successfully!</p>
  {/snippet}
</Alert>

<!-- Warning Alert -->
<Alert variant="warning">
  {#snippet children()}
    <h4 class="text-sm font-semibold text-amber-900 mb-1">Warning</h4>
    <p class="text-sm text-amber-700">Please review before proceeding.</p>
  {/snippet}
</Alert>

<!-- Info Alert -->
<Alert variant="info">
  {#snippet children()}
    <h4 class="text-sm font-semibold text-blue-900 mb-1">Information</h4>
    <p class="text-sm text-blue-700">Here's something you should know.</p>
  {/snippet}
</Alert>

<!-- Alert with Action -->
<Alert variant="error" dismissible>
  {#snippet children()}
    <div>
      <h4 class="text-sm font-semibold text-red-900 mb-1">Session Expired</h4>
      <p class="text-sm text-red-700 mb-2">Your session has expired. Please log in again.</p>
      <Button size="sm" onclick={handleLogin}>Log In</Button>
    </div>
  {/snippet}
</Alert>
```

---

### Badge

Small status indicator component with multiple color variants.

**Props:**
```typescript
interface Props {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'default';
  children?: Snippet;
  class?: string;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface Props {
    variant?: "default" | "success" | "error" | "warning" | "info" | "neutral";
    size?: "sm" | "default";
    children?: Snippet;
    class?: string;
  }

  let {
    variant = "default",
    size = "default",
    children,
    class: className = ""
  }: Props = $props();

  const variantStyles: Record<string, string> = {
    default: "bg-blue-100 text-blue-800",
    success: "bg-emerald-100 text-emerald-800",
    error: "bg-red-100 text-red-800",
    warning: "bg-amber-100 text-amber-800",
    info: "bg-blue-100 text-blue-800",
    neutral: "bg-zinc-100 text-zinc-700"
  };

  const sizeStyles: Record<string, string> = {
    sm: "px-2 py-0.5 text-xs",
    default: "px-2.5 py-1 text-xs"
  };

  const baseStyles = "inline-flex items-center rounded-full font-medium whitespace-nowrap";
</script>

<span class="{baseStyles} {variantStyles[variant]} {sizeStyles[size]} {className}">
  {#if children}
    {@render children()}
  {/if}
</span>
```

**Usage Examples:**
```svelte
<script>
  import { Badge } from '$lib/components';
</script>

<!-- Default Badge -->
<Badge>New</Badge>

<!-- Success Badge -->
<Badge variant="success">Active</Badge>

<!-- Error Badge -->
<Badge variant="error">Failed</Badge>

<!-- Warning Badge -->
<Badge variant="warning">Pending</Badge>

<!-- Info Badge -->
<Badge variant="info">Information</Badge>

<!-- Neutral Badge -->
<Badge variant="neutral">Default</Badge>

<!-- Small Badge -->
<Badge variant="success" size="sm">Small</Badge>

<!-- Badge with Icon -->
<Badge variant="success">
  <svg class="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
  </svg>
  Verified
</Badge>

<!-- Status Indicators -->
<div class="flex items-center gap-2">
  <Badge variant="success">Connected</Badge>
  <Badge variant="warning">In Progress</Badge>
  <Badge variant="error">Offline</Badge>
</div>
```

---

## Form Components

### Input

Reusable text input component with label, error states, and validation helpers.

**Props:**
```typescript
interface Props {
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'url' | 'password' | 'number' | 'search' | 'tel';
  label?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  class?: string;
  oninput?: (event: Event) => void;
  onchange?: (event: Event) => void;
  onblur?: (event: Event) => void;
  onfocus?: (event: Event) => void;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface Props {
    id?: string;
    name?: string;
    type?: "text" | "email" | "url" | "password" | "number" | "search" | "tel";
    label?: string;
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    helperText?: string;
    class?: string;
    oninput?: (event: Event) => void;
    onchange?: (event: Event) => void;
    onblur?: (event: Event) => void;
    onfocus?: (event: Event) => void;
  }

  let {
    id,
    name,
    type = "text",
    label,
    placeholder,
    value,
    disabled = false,
    required = false,
    error,
    helperText,
    class: className = "",
    oninput,
    onchange,
    onblur,
    onfocus,
  }: Props = $props();
</script>

<div class="space-y-1.5 {className}">
  {#if label}
    <label
      {for}
      class="block text-sm font-medium text-zinc-700"
    >
      {label}
      {#if required}
        <span class="text-red-500 ml-0.5">*</span>
      {/if}
    </label>
  {/if}

  <div class="relative">
    <input
      {id}
      {name}
      {type}
      {placeholder}
      {disabled}
      {required}
      value={value ?? ""}
      class="w-full px-4 py-2.5 rounded-lg border text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:bg-zinc-100 disabled:cursor-not-allowed transition-all {error
        ? 'border-red-300 focus:ring-red-500'
        : 'border-zinc-300'}"
      {oninput}
      {onchange}
      {onblur}
      {onfocus}
    />

    {#if error}
      <div
        class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 text-red-500"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
    {/if}
  </div>

  {#if error}
    <p class="text-sm text-red-600 flex items-center gap-1">{error}</p>
  {:else if helperText}
    <p class="text-sm text-zinc-500">{helperText}</p>
  {/if}
</div>
```

**Usage Examples:**
```svelte
<script>
  import { Input } from '$lib/components';
  let email = $state('');
  let password = $state('');
  let error = $state('');
</script>

<!-- Basic Input -->
<Input
  id="name"
  label="Full Name"
  placeholder="Enter your name"
  bind:value={name}
  required
/>

<!-- Email Input -->
<Input
  id="email"
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  bind:value={email}
  error={error}
  required
/>

<!-- Password Input -->
<Input
  id="password"
  label="Password"
  type="password"
  placeholder="•••••••••"
  bind:value={password}
  required
/>

<!-- URL Input -->
<Input
  id="website"
  label="Website"
  type="url"
  placeholder="https://example.com"
  bind:value={website}
/>

<!-- Input with Helper Text -->
<Input
  id="username"
  label="Username"
  placeholder="Choose a username"
  bind:value={username}
  helperText="Must be at least 3 characters"
/>

<!-- Disabled Input -->
<Input
  id="disabled"
  label="Disabled Field"
  value="Cannot edit this"
  disabled
/>

<!-- With Error Handling -->
<script>
  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function handleBlur() {
    if (email && !validateEmail(email)) {
      error = 'Please enter a valid email address';
    } else {
      error = '';
    }
  }
</script>

<Input
  id="email"
  label="Email"
  type="email"
  placeholder="you@example.com"
  bind:value={email}
  error={error}
  onblur={handleBlur}
  required
/>

<!-- Form with Multiple Inputs -->
<form onsubmit={handleSubmit}>
  <div class="space-y-4">
    <Input
      id="name"
      label="Name"
      placeholder="John Doe"
      bind:value={formData.name}
      required
    />
    <Input
      id="email"
      label="Email"
      type="email"
      placeholder="john@example.com"
      bind:value={formData.email}
      required
    />
    <Input
      id="phone"
      label="Phone"
      type="tel"
      placeholder="+1 (555) 000-0000"
      bind:value={formData.phone}
    />
  </div>
</form>
```

---

### Select

Dropdown select component with label and validation support.

**Props:**
```typescript
interface Props {
  id?: string;
  name?: string;
  label?: string;
  value?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  class?: string;
  onchange?: (event: Event) => void;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface Props {
    id?: string;
    name?: string;
    label?: string;
    value?: string;
    options: Array<{ value: string; label: string; disabled?: boolean }>;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    helperText?: string;
    class?: string;
    onchange?: (event: Event) => void;
  }

  let {
    id,
    name,
    label,
    value,
    options,
    placeholder,
    disabled = false,
    required = false,
    error,
    helperText,
    class: className = "",
    onchange,
  }: Props = $props();
</script>

<div class="space-y-1.5 {className}">
  {#if label}
    <label {for} class="block text-sm font-medium text-zinc-700">
      {label}
      {#if required}
        <span class="text-red-500 ml-0.5">*</span>
      {/if}
    </label>
  {/if}

  <select
    {id}
    {name}
    {disabled}
    {required}
    class="w-full px-4 py-2.5 rounded-lg border text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:bg-zinc-100 disabled:cursor-not-allowed transition-all {error
      ? 'border-red-300 focus:ring-red-500'
      : 'border-zinc-300'}"
    {onchange}
  >
    {#if placeholder}
      <option value="" disabled>{placeholder}</option>
    {/if}
    {#each options as option}
      <option value={option.value} disabled={option.disabled}>
        {option.label}
      </option>
    {/each}
  </select>

  {#if error}
    <p class="text-sm text-red-600">{error}</p>
  {:else if helperText}
    <p class="text-sm text-zinc-500">{helperText}</p>
  {/if}
</div>
```

**Usage Examples:**
```svelte
<script>
  import { Select } from '$lib/components';
  let role = $state('');
  let country = $state('');
  
  const roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' }
  ];
  
  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' }
  ];
</script>

<!-- Basic Select -->
<Select
  id="role"
  label="Role"
  options={roles}
  placeholder="Select a role"
  bind:value={role}
  required
/>

<!-- With Error -->
<Select
  id="country"
  label="Country"
  options={countries}
  placeholder="Select your country"
  bind:value={country}
  error="Please select a country"
  required
/>

<!-- Disabled Option -->
<Select
  id="status"
  label="Status"
  options={[
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'archived', label: 'Archived', disabled: true }
  ]}
  bind:value={status}
/>

<!-- With Helper Text -->
<Select
  id="priority"
  label="Priority"
  options={[
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' }
  ]}
  placeholder="Select priority"
  bind:value={priority}
  helperText="Higher priority tasks will be completed first"
/>
```

---

### Textarea

Multi-line text input component with auto-resize support.

**Props:**
```typescript
interface Props {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  rows?: number;
  class?: string;
  oninput?: (event: Event) => void;
  onchange?: (event: Event) => void;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface Props {
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    helperText?: string;
    rows?: number;
    class?: string;
    oninput?: (event: Event) => void;
    onchange?: (event: Event) => void;
  }

  let {
    id,
    name,
    label,
    placeholder,
    value,
    disabled = false,
    required = false,
    error,
    helperText,
    rows = 4,
    class: className = "",
    oninput,
    onchange,
  }: Props = $props();
</script>

<div class="space-y-1.5 {className}">
  {#if label}
    <label {for} class="block text-sm font-medium text-zinc-700">
      {label}
      {#if required}
        <span class="text-red-500 ml-0.5">*</span>
      {/if}
    </label>
  {/if}

  <textarea
    {id}
    {name}
    {placeholder}
    {rows}
    {disabled}
    {required}
    class="w-full px-4 py-2.5 rounded-lg border text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:bg-zinc-100 disabled:cursor-not-allowed transition-all resize-y {error
      ? 'border-red-300 focus:ring-red-500'
      : 'border-zinc-300'}"
    {oninput}
    {onchange}
  >
    {value ?? ""}
  </textarea>

  {#if error}
    <p class="text-sm text-red-600">{error}</p>
  {:else if helperText}
    <p class="text-sm text-zinc-500">{helperText}</p>
  {/if}
</div>
```

**Usage Examples:**
```svelte
<script>
  import { Textarea } from '$lib/components';
  let description = $state('');
  let feedback = $state('');
</script>

<!-- Basic Textarea -->
<Textarea
  id="description"
  label="Description"
  placeholder="Enter a description..."
  rows={4}
  bind:value={description}
/>

<!-- With Character Count -->
<script>
  const maxChars = 500;
  const remainingChars = $derived(maxChars - feedback.length);
</script>

<Textarea
  id="feedback"
  label="Feedback"
  placeholder="Share your thoughts..."
  rows={6}
  bind:value={feedback}
  helperText={`${remainingChars} characters remaining`}
  maxlength={maxChars}
/>

<!-- Required with Validation -->
<Textarea
  id="message"
  label="Message"
  placeholder="Type your message..."
  rows={5}
  bind:value={message}
  required
/>

<!-- Disabled -->
<Textarea
  id="readonly"
  label="Read Only"
  value="This content is read-only"
  disabled
/>
```

---

### Checkbox

Checkbox input component with label and validation support.

**Props:**
```typescript
interface Props {
  id?: string;
  name?: string;
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  class?: string;
  onchange?: (event: Event) => void;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface Props {
    id?: string;
    name?: string;
    label?: string;
    checked?: boolean;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    helperText?: string;
    class?: string;
    onchange?: (event: Event) => void;
  }

  let {
    id,
    name,
    label,
    checked,
    disabled = false,
    required = false,
    error,
    helperText,
    class: className = "",
    onchange,
  }: Props = $props();
</script>

<div class="space-y-1.5 {className}">
  <div class="flex items-start gap-3">
    <input
      {id}
      {name}
      type="checkbox"
      {checked}
      {disabled}
      {required}
      class="mt-0.5 w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 focus:ring-offset-0"
      {onchange}
    />

    {#if label}
      <label {for} class="text-sm text-zinc-700 flex-1">
        {label}
        {#if required}
          <span class="text-red-500 ml-0.5">*</span>
        {/if}
      </label>
    {/if}
  </div>

  {#if error}
    <p class="text-sm text-red-600">{error}</p>
  {:else if helperText}
    <p class="text-sm text-zinc-500">{helperText}</p>
  {/if}
</div>
```

**Usage Examples:**
```svelte
<script>
  import { Checkbox } from '$lib/components';
  let agree = $state(false);
  let newsletter = $state(false);
</script>

<!-- Basic Checkbox -->
<Checkbox
  id="agree"
  label="I agree to the terms and conditions"
  bind:checked={agree}
  required
/>

<!-- With Helper Text -->
<Checkbox
  id="newsletter"
  label="Subscribe to newsletter"
  bind:checked={newsletter}
  helperText="We'll send you occasional updates"
/>

<!-- Disabled -->
<Checkbox
  id="disabled"
  label="Disabled option"
  checked={true}
  disabled
/>

<!-- Multiple Checkboxes -->
<div class="space-y-3">
  <Checkbox
    id="option1"
    label="Option 1"
    bind:checked={options.option1}
  />
  <Checkbox
    id="option2"
    label="Option 2"
    bind:checked={options.option2}
  />
  <Checkbox
    id="option3"
    label="Option 3"
    bind:checked={options.option3}
  />
</div>

<!-- With Validation -->
<script>
  let errors = $state({});
  
  function validateTerms() {
    if (!agree) {
      errors.agree = 'You must agree to continue';
    } else {
      errors.agree = '';
    }
  }
</script>

<Checkbox
  id="agree"
  label="I agree to the terms and conditions"
  bind:checked={agree}
  error={errors.agree}
  onchange={validateTerms}
  required
/>
```

---

## Display Components

### UserAvatar

User avatar component with image fallback and size variations.

**Props:**
```typescript
interface Props {
  user?: { name?: string; avatarUrl?: string; email?: string };
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  class?: string;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface Props {
    user?: {
      name?: string;
      avatarUrl?: string;
      email?: string;
    };
    size?: "sm" | "md" | "lg";
    showName?: boolean;
    class?: string;
  }

  let {
    user,
    size = "md",
    showName = false,
    class: className = "",
  }: Props = $props();

  const sizes: Record<string, string> = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const initials = $derived(
    user?.name
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : user?.email
        ? user.email[0].toUpperCase()
        : "?"
  );
</script>

<div class="flex items-center gap-2 {className}">
  {#if user?.avatarUrl}
    <img
      src={user.avatarUrl}
      alt={user.name || user.email}
      class="{sizes[size]} rounded-full object-cover"
    />
  {:else}
    <div
      class="{sizes[size]} rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0"
    >
      <span class="font-medium text-zinc-600">{initials}</span>
    </div>
  {/if}

  {#if showName && user?.name}
    <span class="text-sm text-zinc-700">{user.name}</span>
  {/if}
</div>
```

**Usage Examples:**
```svelte
<script>
  import { UserAvatar } from '$lib/components';
  
  const user1 = {
    name: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg'
  };
  
  const user2 = {
    name: 'Jane Smith',
    email: 'jane@example.com'
  };
  
  const user3 = {
    email: 'unknown@example.com'
  };
</script>

<!-- With Avatar Image -->
<UserAvatar user={user1} />

<!-- With Initials Fallback -->
<UserAvatar user={user2} />

<!-- With Email Only -->
<UserAvatar user={user3} />

<!-- Small Size -->
<UserAvatar user={user1} size="sm" />

<!-- Large Size -->
<UserAvatar user={user2} size="lg" />

<!-- Show Name -->
<UserAvatar user={user1} showName={true} />

<!-- In Card Footer -->
<Card showFooter={true}>
  {#snippet footer()}
    <div class="flex items-center gap-2">
      <UserAvatar user={author} size="sm" showName={true} />
    </div>
  {/snippet}
</Card>

<!-- In List -->
<div class="space-y-3">
  {#each team as member}
    <UserAvatar user={member} showName={true} />
  {/each}
</div>
```

---

### Spinner

Loading spinner component with multiple sizes.

**Props:**
```typescript
interface Props {
  size?: 'sm' | 'md' | 'lg';
  color?: 'zinc' | 'white';
  class?: string;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface Props {
    size?: "sm" | "md" | "lg";
    color?: "zinc" | "white";
    class?: string;
  }

  let {
    size = "md",
    color = "zinc",
    class: className = "",
  }: Props = $props();

  const sizes: Record<string, string> = {
    sm: "w-4 h-4 border-2",
    md: "w-5 h-5 border-2",
    lg: "w-6 h-6 border-3",
  };

  const borderColors: Record<string, string> = {
    zinc: "border-zinc-200 border-t-zinc-900",
    white: "border-white/30 border-t-white",
  };
</script>

<div
  class="animate-spin rounded-full {sizes[size]} {borderColors[color]} {className}"
  role="status"
  aria-label="Loading"
>
  <span class="sr-only">Loading...</span>
</div>
```

**Usage Examples:**
```svelte
<script>
  import { Spinner, Button } from '$lib/components';
  let loading = $state(false);
</script>

<!-- Small Spinner -->
<Spinner size="sm" />

<!-- Default Size -->
<Spinner />

<!-- Large Spinner -->
<Spinner size="lg" />

<!-- White Spinner (on dark background) -->
<div class="bg-zinc-900 p-4 rounded-lg">
  <Spinner color="white" />
</div>

<!-- In Button -->
<Button disabled={loading} onclick={handleSave}>
  {#if loading}
    <Spinner size="sm" />
    <span class="ml-2">Saving...</span>
  {:else}
    Save
  {/if}
</Button>

<!-- Loading State Card -->
<Card>
  {#snippet children()}
    <div class="flex flex-col items-center justify-center py-8">
      <Spinner />
      <p class="text-sm text-zinc-600 mt-3">Loading data...</p>
    </div>
  {/snippet}
</Card>

<!-- Inline Loading -->
<div class="flex items-center gap-2">
  <Spinner size="sm" />
  <span class="text-sm text-zinc-600">Processing...</span>
</div>
```

---

## Overlay Components

### Modal

Dialog overlay component for modals and confirmations.

**Props:**
```typescript
interface Props {
  open: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onclose?: () => void;
  children?: Snippet;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface Props {
    open: boolean;
    title?: string;
    size?: "sm" | "md" | "lg" | "xl";
    onclose?: () => void;
    children?: Snippet;
  }

  let {
    open,
    title,
    size = "md",
    onclose,
    children
  }: Props = $props();

  const sizeClasses: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onclose?.();
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onclose?.();
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    on:click={handleBackdropClick}
    on:keydown={handleEscape}
    role="dialog"
    aria-modal="true"
  >
    <div class="bg-white rounded-lg shadow-xl w-full {sizeClasses[size]} max-h-[90vh] overflow-y-auto">
      {#if title}
        <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 class="text-lg font-semibold text-zinc-900">{title}</h2>
          <button
            onclick={onclose}
            class="text-zinc-400 hover:text-zinc-600 transition-colors p-1 hover:bg-zinc-100 rounded"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      {/if}

      <div class="p-6">
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  </div>
{/if}
```

**Usage Examples:**
```svelte
<script>
  import { Modal, Button } from '$lib/components';
  let isOpen = $state(false);
</script>

<!-- Basic Modal -->
<Button onclick={() => isOpen = true}>Open Modal</Button>

<Modal
  bind:open={isOpen}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
  <div class="flex justify-end gap-2 mt-6">
    <Button variant="secondary" onclick={() => isOpen = false}>Cancel</Button>
    <Button onclick={handleConfirm}>Confirm</Button>
  </div>
</Modal>

<!-- Large Modal -->
<Modal bind:open={isOpen} title="Details" size="lg">
  <p>More content here...</p>
</Modal>

<!-- Without Title -->
<Modal bind:open={isOpen} size="md">
  <p>No title, just content</p>
  <Button onclick={() => isOpen = false}>Close</Button>
</Modal>

<!-- Form in Modal -->
<Modal bind:open={isOpen} title="Edit User" size="md">
  <form onsubmit={handleSubmit}>
    <div class="space-y-4">
      <Input label="Name" bind:value={formData.name} />
      <Input label="Email" type="email" bind:value={formData.email} />
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <Button variant="secondary" onclick={() => isOpen = false}>Cancel</Button>
      <Button type="submit">Save</Button>
    </div>
  </form>
</Modal>
```

---

### Drawer

Slide-out panel component for secondary content.

**Props:**
```typescript
interface Props {
  open: boolean;
  position?: 'left' | 'right';
  onclose?: () => void;
  children?: Snippet;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface Props {
    open: boolean;
    position?: "left" | "right";
    onclose?: () => void;
    children?: Snippet;
  }

  let {
    open,
    position = "right",
    onclose,
    children
  }: Props = $props();

  const positionClasses: Record<string, string> = {
    left: "left-0 -translate-x-full",
    right: "right-0 translate-x-full",
  };

  const openClasses: Record<string, string> = {
    left: "translate-x-0",
    right: "translate-x-0",
  };

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onclose?.();
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onclose?.();
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex"
    on:click={handleBackdropClick}
    on:keydown={handleEscape}
  >
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />

    <!-- Drawer -->
    <div
      class="fixed inset-y-0 bg-white shadow-xl w-full max-w-sm transition-transform duration-300 ease-in-out {positionClasses[position]} {open
        ? openClasses[position]
        : ''}"
    >
      <div class="h-full flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 class="text-lg font-semibold text-zinc-900">Drawer</h2>
          <button
            onclick={onclose}
            class="text-zinc-400 hover:text-zinc-600 transition-colors p-1 hover:bg-zinc-100 rounded"
            aria-label="Close drawer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          {#if children}
            {@render children()}
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
```

**Usage Examples:**
```svelte
<script>
  import { Drawer, Button } from '$lib/components';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  const drawerParam = $derived($page.url.searchParams.get('drawer'));
  const isOpen = $derived(drawerParam === 'details');
  
  function openDrawer() {
    const url = new URL($page.url);
    url.searchParams.set('drawer', 'details');
    goto(url.pathname + url.search, { noScroll: true });
  }
  
  function handleClose() {
    const url = new URL($page.url);
    url.searchParams.delete('drawer');
    goto(url.pathname + url.search, { noScroll: true });
  }
</script>

<!-- Basic Drawer -->
<Button onclick={openDrawer}>Open Drawer</Button>

<Drawer bind:open={isOpen} position="right" onclose={handleClose}>
  <h2 class="text-lg font-semibold mb-4">Details</h2>
  <p>Drawer content goes here</p>
</Drawer>

<!-- Left Position -->
<Drawer bind:open={isOpen} position="left" onclose={handleClose}>
  <nav class="space-y-2">
    <a href="/" class="block px-3 py-2 rounded hover:bg-zinc-100">Home</a>
    <a href="/about" class="block px-3 py-2 rounded hover:bg-zinc-100">About</a>
  </nav>
</Drawer>

<!-- Form in Drawer -->
<Drawer bind:open={isOpen} onclose={handleClose}>
  <h2 class="text-lg font-semibold mb-4">Filter Results</h2>
  <form onsubmit={handleSubmit}>
    <div class="space-y-4">
      <Input label="Search" bind:value={search} />
      <Select label="Category" options={categories} bind:value={category} />
    </div>
    <Button type="submit" class="mt-4">Apply Filters</Button>
  </form>
</Drawer>
```

---

### Tabs

Tab navigation component for organizing content.

**Props:**
```typescript
interface Props {
  tabs: Array<{ id: string; label: string; disabled?: boolean }>;
  activeTab?: string;
  ontabchange?: (tabId: string) => void;
  children?: Snippet;
}
```

**Implementation:**
```svelte
<script lang="ts">
  interface TabItem {
    id: string;
    label: string;
    disabled?: boolean;
  }

  interface Props {
    tabs: TabItem[];
    activeTab?: string;
    ontabchange?: (tabId: string) => void;
    children?: Snippet;
  }

  let {
    tabs,
    activeTab,
    ontabchange,
    children
  }: Props = $props();
</script>

<div class="w-full">
  <!-- Tab Navigation -->
  <div class="border-b border-zinc-200" role="tablist">
    <div class="flex gap-4">
      {#each tabs as tab (tab.id)}
        <button
          onclick={() => !tab.disabled && ontabchange?.(tab.id)}
          class="px-4 py-3 text-sm font-medium border-b-2 transition-colors {activeTab === tab.id
            ? 'border-zinc-900 text-zinc-900'
            : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'} {tab.disabled
            ? 'cursor-not-allowed opacity-50'
            : ''}"
          role="tab"
          aria-selected={activeTab === tab.id}
          disabled={tab.disabled}
        >
          {tab.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Tab Content -->
  {#if children}
    <div class="py-4" role="tabpanel">
      {@render children({ activeTab })}
    </div>
  {/if}
</div>
```

**Usage Examples:**
```svelte
<script>
  import { Tabs } from '$lib/components';
  let activeTab = $state('details');
  
  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'messages', label: 'Messages' },
    { id: 'files', label: 'Files' }
  ];
</script>

<!-- Basic Tabs -->
<Tabs {tabs} bind:activeTab={activeTab}>
  {#snippet children({ activeTab })}
    {#if activeTab === 'details'}
      <div>Details content here...</div>
    {:else if activeTab === 'messages'}
      <div>Messages content here...</div>
    {:else if activeTab === 'files'}
      <div>Files content here...</div>
    {/if}
  {/snippet}
</Tabs>

<!-- With Disabled Tab -->
<Tabs
  tabs={[
    { id: 'overview', label: 'Overview' },
    { id: 'settings', label: 'Settings' },
    { id: 'deleted', label: 'Deleted', disabled: true }
  ]}
  bind:activeTab={activeTab}
>
  <!-- Content -->
</Tabs>

<!-- URL-Driven Tabs -->
<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  const tabParam = $derived($page.url.searchParams.get('tab') || 'details');
  
  async function setTab(tabId: string) {
    const url = new URL($page.url);
    if (tabId === 'details') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tabId);
    }
    await goto(url.pathname + url.search, { noScroll: true });
  }
</script>

<Tabs {tabs} activeTab={tabParam} ontabchange={setTab}>
  <!-- Content -->
</Tabs>
```

---

## Component Organization

### Barrel File

Create `src/lib/components/index.ts` for clean imports:

```typescript
// Layout Components
export { default as Header } from './Header.svelte';
export { default as Footer } from './Footer.svelte';

// Core Components
export { default as Card } from './Card.svelte';
export { default as Button } from './Button.svelte';
export { default as Alert } from './Alert.svelte';
export { default as Badge } from './Badge.svelte';

// Form Components
export { default as Input } from './Input.svelte';
export { default as Select } from './Select.svelte';
export { default as Textarea } from './Textarea.svelte';
export { default as Checkbox } from './Checkbox.svelte';

// Display Components
export { default as UserAvatar } from './UserAvatar.svelte';
export { default as Spinner } from './Spinner.svelte';

// Overlay Components
export { default as Modal } from './Modal.svelte';
export { default as Drawer } from './Drawer.svelte';
export { default as Tabs } from './Tabs.svelte';

// Types
export type { TabItem } from './Tabs.svelte';
```

### Usage with Barrel

```svelte
<script>
  import { Card, Button, Input, Modal } from '$lib/components';
</script>
```

---

## Best Practices

### Component Design

1. **Always use Svelte 5 runes** (`$state`, `$derived`, `$effect`)
2. **Use TypeScript interfaces** for all props
3. **Provide sensible defaults** for optional props
4. **Use snippets** for slots (`{#snippet}`)
5. **Support `class` prop** for customization

### Accessibility

1. **Add ARIA attributes** for interactive elements
2. **Include keyboard navigation** support
3. **Provide focus indicators** with `ring-2`
4. **Use semantic HTML** elements
5. **Add `aria-label`** for icon-only buttons

### Performance

1. **Avoid unnecessary reactivity** - use `$derived` for computed values
2. **Memoize expensive calculations** - use `$derived.by()`
3. **Use event delegation** for large lists
4. **Lazy load overlays** - only render when `open={true}`

### Styling

1. **Follow zinc color palette** for all neutral colors
2. **Use Tailwind spacing scale** (1, 2, 3, 4, 6, 8)
3. **Apply consistent border radius** (lg, md, sm)
4. **Add hover/active states** for interactive elements
5. **Include focus-visible styles** for keyboard navigation