<script lang="ts">
	import { Ellipsis } from 'lucide-svelte';
	import IconButton from './IconButton.svelte';
	import Drawer from './Drawer.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';

	/**
	 * ActionsDrawer component props
	 * 
	 * A drawer component that can be opened with an ellipsis icon button.
	 * Accepts actions/content via children slot.
	 * Can be controlled via URL parameter when urlParam is provided.
	 */
	interface Props {
		/**
		 * Title for the drawer header
		 */
		title?: string;

		/**
		 * Description/subtitle for the drawer header
		 */
		description?: string;

		/**
		 * Position of the drawer (left, right, top, bottom)
		 * @default 'right'
		 */
		position?: 'left' | 'right' | 'top' | 'bottom';

		/**
		 * Drawer width class (for left/right drawers)
		 * @default 'w-1/2 md:w-[66vw]'
		 */
		drawerClass?: string;

		/**
		 * Position for the trigger button
		 * @default 'top-right'
		 */
		buttonPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

		/**
		 * Additional CSS classes for the trigger button container
		 */
		class?: string;

		/**
		 * Children snippet (content to display in drawer)
		 */
		children?: Snippet;

		/**
		 * Tooltip text for the trigger button
		 * @default 'Open actions menu'
		 */
		tooltip?: string;

		/**
		 * Tooltip position for the trigger button
		 * @default 'top'
		 */
		tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';

		/**
		 * URL parameter name to control drawer state (e.g., 'drawer').
		 * When provided, drawer state is controlled by URL parameter.
		 * The drawer opens when URL param equals urlParamValue (default: 'actions').
		 */
		urlParam?: string;

		/**
		 * Value for the URL parameter that opens the drawer
		 * @default 'actions'
		 */
		urlParamValue?: string;
	}

	let {
		title,
		description,
		position = 'right',
		drawerClass = 'w-1/2 md:w-[66vw]',
		buttonPosition = 'top-right',
		class: className = '',
		children,
		tooltip = 'Open actions menu',
		tooltipPosition = 'top',
		urlParam,
		urlParamValue = 'actions'
	}: Props = $props();

	// Internal state for non-URL-controlled mode
	let internalIsOpen = $state(false);

	// Derive isOpen from URL if urlParam is provided, otherwise use internal state
	const isOpen = $derived.by(() => {
		if (urlParam) {
			const url = $page.url;
			return url.searchParams.get(urlParam) === urlParamValue;
		}
		return internalIsOpen;
	});

	async function handleOpen() {
		if (urlParam) {
			// Update URL to open drawer
			const url = new URL($page.url);
			url.searchParams.set(urlParam, urlParamValue);
			await goto(url.pathname + url.search, { noScroll: true });
		} else {
			// Use internal state
			internalIsOpen = true;
		}
	}

	async function handleClose() {
		if (urlParam) {
			// Remove URL parameter to close drawer
			const url = new URL($page.url);
			url.searchParams.delete(urlParam);
			await goto(url.pathname + url.search, { noScroll: true });
		} else {
			// Use internal state
			internalIsOpen = false;
		}
	}

	function getButtonPositionClasses(): string {
		switch (buttonPosition) {
			case 'top-left':
				return 'top-0 left-0';
			case 'top-right':
				return 'top-0 right-0';
			case 'bottom-left':
				return 'bottom-0 left-0';
			case 'bottom-right':
				return 'bottom-0 right-0';
			default:
				return 'top-0 right-0';
		}
	}

	// Check if className includes positioning (fixed, absolute, relative, sticky)
	const hasPositioning = $derived(
		className.includes('fixed') ||
		className.includes('absolute') ||
		className.includes('relative') ||
		className.includes('sticky')
	);

	// Only add relative if no positioning is provided in className
	const containerClasses = $derived(
		hasPositioning ? className : `relative ${className}`
	);
</script>

<div class="{containerClasses}">
	<!-- Trigger Button -->
	<div class="{hasPositioning ? 'absolute ' : ''}{getButtonPositionClasses()}">
		<IconButton
			icon={Ellipsis}
			variant="ghost"
			tooltip={tooltip}
			tooltipPosition={tooltipPosition}
			onclick={handleOpen}
		/>
	</div>
</div>

<!-- Drawer -->
<Drawer open={isOpen} position={position} class={drawerClass} onclose={handleClose}>
	<div class="flex flex-col h-full">
		{#if title || description}
			<!-- Header -->
			<div class="mb-6">
				{#if title}
					<h2 class="text-2xl font-semibold text-zinc-900 font-aspekta">
						{title}
					</h2>
				{/if}
				{#if description}
					<p class="text-sm text-zinc-600 mt-1">
						{description}
					</p>
				{/if}
			</div>
		{/if}

		<!-- Content -->
		{#if children}
			<div class="flex-1 overflow-y-auto">
				{@render children()}
			</div>
		{/if}
	</div>
</Drawer>

