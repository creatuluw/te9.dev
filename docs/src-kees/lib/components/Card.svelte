<script lang="ts">
	import type { ComponentType, Snippet } from 'svelte';

	interface Props {
		/**
		 * Optional card title
		 */
		title?: string;
		
		/**
		 * Optional card description/subtitle
		 */
		description?: string;
		
		/**
		 * Visual variant for different card types
		 * - default: Standard white card with zinc borders
		 * - stat: Optimized for dashboard statistics
		 * - info: Blue accent for information/unread states
		 * - success: Green accent for success states
		 * - warning: Yellow accent for warning states
		 * - danger: Red accent for danger/error states
		 */
		variant?: 'default' | 'stat' | 'info' | 'success' | 'warning' | 'danger';
		
		/**
		 * Optional icon component to display
		 */
		icon?: ComponentType;
		
		/**
		 * Icon color variant (only used when icon is provided)
		 */
		iconVariant?: 'default' | 'info' | 'success' | 'warning' | 'danger';
		
		/**
		 * Make the entire card clickable
		 */
		onclick?: (event: MouseEvent) => void;
		
		/**
		 * Enable hover effects
		 * @default false
		 */
		hover?: boolean;
		
		/**
		 * Show header section with border
		 * @default false
		 */
		showHeader?: boolean;
		
		/**
		 * Show footer section with border
		 * @default false
		 */
		showFooter?: boolean;
		
		/**
		 * Footer background style
		 * - default: zinc-50 background
		 * - transparent: no background
		 */
		footerStyle?: 'default' | 'transparent';
		
		/**
		 * Padding size
		 * - sm: p-4
		 * - md: p-6 (default)
		 * - lg: p-8
		 */
		padding?: 'sm' | 'md' | 'lg';
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
		
		/**
		 * Children content (default slot)
		 */
		children?: Snippet;
		
		/**
		 * Header slot content
		 */
		header?: Snippet;
		
		/**
		 * Footer slot content
		 */
		footer?: Snippet;
		
		/**
		 * Icon slot content (overrides icon prop)
		 */
		iconSlot?: Snippet;
		
		/**
		 * Actions slot (positioned in top-right)
		 */
		actions?: Snippet;
	}

	let {
		title,
		description,
		variant = 'default',
		icon,
		iconVariant = 'default',
		onclick,
		hover = false,
		showHeader = false,
		showFooter = false,
		footerStyle = 'default',
		padding = 'md',
		class: className = '',
		children,
		header,
		footer,
		iconSlot,
		actions
	}: Props = $props();

	// Determine card border and background based on variant
	const variantClasses = $derived(() => {
		switch (variant) {
			case 'stat':
				return 'bg-white border border-zinc-200';
			case 'info':
				return 'bg-blue-50 border border-blue-300';
			case 'success':
				return 'bg-green-50 border border-green-300';
			case 'warning':
				return 'bg-yellow-50 border border-yellow-300';
			case 'danger':
				return 'bg-red-50 border border-red-300';
			default:
				return 'bg-white border border-zinc-200';
		}
	});

	// Icon background colors
	const iconBgClasses = $derived(() => {
		switch (iconVariant) {
			case 'info':
				return 'bg-blue-100 group-hover:bg-blue-200';
			case 'success':
				return 'bg-green-100 group-hover:bg-green-200';
			case 'warning':
				return 'bg-yellow-100 group-hover:bg-yellow-200';
			case 'danger':
				return 'bg-red-100 group-hover:bg-red-200';
			default:
				return 'bg-zinc-100 group-hover:bg-zinc-200';
		}
	});

	// Icon text colors
	const iconTextClasses = $derived(() => {
		switch (iconVariant) {
			case 'info':
				return 'text-blue-600';
			case 'success':
				return 'text-green-600';
			case 'warning':
				return 'text-yellow-600';
			case 'danger':
				return 'text-red-600';
			default:
				return 'text-zinc-600';
		}
	});

	// Hover effects
	const hoverClasses = $derived(() => {
		if (!hover && !onclick) return '';
		return 'hover:shadow-sm hover:border-zinc-300 transition-all';
	});

	// Padding classes
	const paddingClasses = $derived(() => {
		switch (padding) {
			case 'sm':
				return 'p-4';
			case 'lg':
				return 'p-8';
			default:
				return 'p-6';
		}
	});

	// Footer background classes
	const footerBgClasses = $derived(() => {
		return footerStyle === 'default' ? 'bg-zinc-50' : '';
	});

	// Base element type
	const element = $derived(onclick ? 'button' : 'div');
	const interactiveAttrs = $derived(() => {
		if (onclick) {
			return {
				role: 'button',
				tabindex: 0
			};
		}
		return {};
	});
</script>

<svelte:element
	this={element}
	class="rounded-lg shadow-xs {variantClasses()} {hoverClasses()} {className} {onclick ? 'cursor-pointer text-left group' : ''} flex flex-col"
	{onclick}
	{...interactiveAttrs()}
>
	<!-- Icon in top-right corner (absolute positioned) -->
	{#if icon || iconSlot}
		<div class="absolute top-6 right-6">
			{#if iconSlot}
				{@render iconSlot()}
			{:else if icon}
				{@const IconComponent = icon}
				<div class="p-2 {iconBgClasses()} rounded-lg transition-colors">
					<IconComponent class="w-5 h-5 {iconTextClasses()}" />
				</div>
			{/if}
		</div>
	{/if}

	<!-- Actions in top-right corner (relative positioned) -->
	{#if actions && !icon && !iconSlot}
		<div class="absolute top-4 right-4">
			{@render actions()}
		</div>
	{/if}

	<!-- Header Section -->
	{#if showHeader && header}
		<div class="{paddingClasses()} border-b border-zinc-100">
			{@render header()}
		</div>
	{:else if showHeader && (title || description)}
		<div class="{paddingClasses()} border-b border-zinc-100">
			{#if title}
				<h3 class="text-lg font-semibold text-zinc-900 tracking-tight leading-tight mb-2">
					{title}
				</h3>
			{/if}
			{#if description}
				<p class="text-sm text-zinc-600">{description}</p>
			{/if}
		</div>
	{/if}

	<!-- Main Content -->
	<div class="{paddingClasses()} flex-1 {showHeader || showFooter ? '' : 'relative'}">
		{#if title && !showHeader}
			<div class="mb-3 {icon || iconSlot || actions ? 'pr-12' : ''}">
				<h3 class="text-lg font-semibold text-zinc-900">{title}</h3>
				{#if description}
					<p class="text-sm text-zinc-600 mt-1">{description}</p>
				{/if}
			</div>
		{/if}
		
		{#if children}
			{@render children()}
		{/if}
	</div>

	<!-- Footer Section -->
	{#if showFooter && footer}
		<div class="border-t border-zinc-200 {paddingClasses()} {footerBgClasses()} rounded-b-lg">
			{@render footer()}
		</div>
	{/if}
</svelte:element>

