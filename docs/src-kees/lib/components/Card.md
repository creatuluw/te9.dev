# Card Component

A versatile, flexible card component that serves as the foundation for all card-based UI elements across the application.

## Features

- **Multiple Variants**: Support for different visual styles (default, stat, info, success, warning, danger)
- **Flexible Layout**: Optional header, footer, and content sections
- **Icon Support**: Display icons in top-right corner with color variants
- **Interactive**: Optional click handlers with hover effects
- **Customizable**: Extensive props for padding, styling, and behavior
- **Slot-based**: Flexible content areas using Svelte 5 snippets

## Basic Usage

### Simple Card

```svelte
<script>
	import Card from '$lib/components/Card.svelte';
</script>

<Card>
	{#snippet children()}
		<p>Your content here</p>
	{/snippet}
</Card>
```

### Card with Title and Description

```svelte
<Card title="My Card" description="A simple card with content">
	{#snippet children()}
		<p>Additional content</p>
	{/snippet}
</Card>
```

## Use Cases

### 1. Dashboard Stat Card

Perfect for displaying statistics and metrics on dashboards:

```svelte
<script>
	import Card from '$lib/components/Card.svelte';
	import { Clock } from 'lucide-svelte';
</script>

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
```

### 2. Case Card

Cards with header, content, and footer sections:

```svelte
<Card
	showHeader={true}
	showFooter={true}
	onclick={() => goto(`/cases/${caseItem.id}`)}
	hover={true}
>
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
			<div class="flex items-center gap-2 text-sm">
				<span class="text-zinc-500 min-w-[70px]">Deadline</span>
				<span class="text-zinc-900 font-medium">{formatDate(caseItem.completion_deadline)}</span>
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

### 3. Process Card

Cards with actions in the footer:

```svelte
<Card showFooter={true}>
	{#snippet children()}
		<div class="flex justify-between items-start mb-4">
			<h3 class="text-xl font-semibold text-zinc-900">{process.name}</h3>
			<div class="text-sm text-zinc-500 flex flex-col items-end gap-0.5">
				<span>5 active</span>
				<span class="text-zinc-400">10 voltooide</span>
			</div>
		</div>
		<p class="text-zinc-600 text-sm mb-4 line-clamp-2">{process.description}</p>
		<div class="text-sm text-zinc-500 space-y-1">
			<div>Voltooiing: {process.completion_days} dagen</div>
			<div class="flex gap-4">
				<span>3 stappen</span>
				<span>8 taken</span>
			</div>
		</div>
	{/snippet}
	
	{#snippet footer()}
		<div class="flex gap-2 justify-end items-center">
			<IconButton icon={FilePlus} onclick={handleCreate} />
			<IconButton icon={Pencil} onclick={handleEdit} />
			<IconButton icon={Archive} onclick={handleArchive} />
		</div>
	{/snippet}
</Card>
```

### 4. Notification Card

Cards with conditional styling for states:

```svelte
<Card variant={notification.in_app_read ? 'default' : 'info'}>
	{#snippet children()}
		<div class="flex justify-between items-start">
			<div class="flex-1">
				<div class="flex items-center gap-2 mb-2">
					<span class="text-xs font-medium text-zinc-500 uppercase">
						{notification.type}
					</span>
					{#if !notification.in_app_read}
						<span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
							Nieuw
						</span>
					{/if}
				</div>
				<h3 class="text-lg font-semibold text-zinc-900 mb-1">{notification.subject}</h3>
				<p class="text-zinc-600 mb-2">{notification.body}</p>
				<div class="text-xs text-zinc-500">
					{formatDateTime(notification.created_at)}
				</div>
			</div>
			{#if !notification.in_app_read}
				<Button size="sm" variant="secondary" onclick={() => markAsRead(notification.id)}>
					Als Gelezen Markeren
				</Button>
			{/if}
		</div>
	{/snippet}
</Card>
```

### 5. Card with Actions

Cards with action buttons in the top-right:

```svelte
<Card title="My Title">
	{#snippet actions()}
		<div class="flex gap-2">
			<IconButton icon={Link2} size="sm" onclick={handleClick} />
		</div>
	{/snippet}
	
	{#snippet children()}
		<div class="text-2xl font-bold text-zinc-900">42</div>
	{/snippet}
</Card>
```

## Props

### Content Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `undefined` | Optional card title |
| `description` | `string` | `undefined` | Optional card description/subtitle |

### Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'stat' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'default'` | Visual variant for different card types |
| `padding` | `'sm' \| 'md' \| 'lg'` | `'md'` | Padding size (sm: p-4, md: p-6, lg: p-8) |
| `class` | `string` | `''` | Additional CSS classes |

### Icon Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `ComponentType` | `undefined` | Optional icon component to display in top-right |
| `iconVariant` | `'default' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'default'` | Icon color variant |

### Interaction Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onclick` | `(event: MouseEvent) => void` | `undefined` | Make the entire card clickable |
| `hover` | `boolean` | `false` | Enable hover effects |

### Layout Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showHeader` | `boolean` | `false` | Show header section with border |
| `showFooter` | `boolean` | `false` | Show footer section with border |
| `footerStyle` | `'default' \| 'transparent'` | `'default'` | Footer background style (default: zinc-50, transparent: no background) |

## Snippets (Slots)

| Snippet | Description |
|---------|-------------|
| `children` | Main content area (default slot) |
| `header` | Header section (only rendered if `showHeader` is true) |
| `footer` | Footer section (only rendered if `showFooter` is true) |
| `iconSlot` | Icon slot (overrides `icon` prop) |
| `actions` | Actions positioned in top-right corner |

## Design Principles

The Card component follows the gray-html design system:

- **Fonts**: Uses inherited font families (Aspekta for headings, Inter for body text)
- **Colors**: Zinc palette for neutral elements, semantic colors for variants
- **Spacing**: Consistent padding options (sm/md/lg)
- **Borders**: `rounded-lg` for cards, `border-zinc-200` for default borders
- **Shadows**: `shadow-xs` base, `shadow-sm` on hover
- **Transitions**: Smooth transitions for interactive elements

## Accessibility

- Automatically uses `<button>` element when `onclick` is provided
- Includes proper `role="button"` and `tabindex="0"` for keyboard navigation
- Semantic HTML structure with proper heading hierarchy
- Hover states for better visual feedback

## Examples from Codebase

The Card component is designed to replace various card patterns found in:

1. **Dashboard Stats** (`src/routes/+page.svelte` lines 47-122)
2. **Case Cards** (`src/routes/cases/+page.svelte` lines 175-229)
3. **Process Cards** (`src/routes/processes/+page.svelte` lines 192-243)
4. **Notification Cards** (`src/routes/notifications/+page.svelte` lines 88-117)
5. **NavCard** (`src/lib/components/NavCard.svelte`)

## Migration Guide

### Before (Custom Card Markup)

```svelte
<button
	onclick={() => goto('/cases?status=pending')}
	class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6 hover:shadow-sm hover:border-zinc-300 transition-all text-left group relative"
>
	<div class="absolute top-6 right-6">
		<div class="p-2 bg-zinc-100 rounded-lg group-hover:bg-zinc-200 transition-colors">
			<Clock class="w-5 h-5 text-zinc-600" />
		</div>
	</div>
	<div class="mb-3">
		<div class="text-sm text-zinc-600 mb-1">In afwachting</div>
		<div class="text-2xl font-bold text-zinc-900">12</div>
	</div>
	<p class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors">
		Cases die wachten om te starten
	</p>
</button>
```

### After (Using Card Component)

```svelte
<Card icon={Clock} onclick={() => goto('/cases?status=pending')} hover={true}>
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
```

## Notes

- The component uses Svelte 5 snippets (not slots) for maximum flexibility
- Icon positioning is absolute when used, so content should account for the top-right space
- The `group` class is automatically applied when `onclick` is provided, enabling group-hover variants
- Footer automatically gets zinc-50 background by default, but can be made transparent

