<script lang="ts">
	import IconButton from './IconButton.svelte';
	import { Search, X } from 'lucide-svelte';

	/**
	 * SearchFilterPanel component props
	 */
	interface Props {
		/**
		 * Whether the panel is open
		 * @default false
		 */
		open?: boolean;

		/**
		 * Render mode: 'button' renders only the button, 'panel' renders only the panel, 'both' renders both
		 * @default 'both'
		 */
		mode?: 'button' | 'panel' | 'both';

		/**
		 * Additional CSS classes for the button container
		 */
		class?: string;

		/**
		 * Additional CSS classes for the toggle button
		 */
		buttonClass?: string;

		/**
		 * Additional CSS classes for the panel container
		 */
		panelClass?: string;

		/**
		 * Tooltip text for the search button
		 * @default 'Zoeken'
		 */
		searchTooltip?: string;

		/**
		 * Tooltip text for the close button
		 * @default 'Sluiten'
		 */
		closeTooltip?: string;

		/**
		 * Children content
		 */
		children?: import('svelte').Snippet;
	}

	let {
		open = $bindable(false),
		mode = 'both',
		class: className = '',
		buttonClass = '',
		panelClass = '',
		searchTooltip = 'Zoeken',
		closeTooltip = 'Sluiten',
		children,
		...restProps
	}: Props = $props();

	function togglePanel() {
		open = !open;
	}
</script>

<!-- Toggle Button -->
{#if mode === 'button' || mode === 'both'}
	<div class="{className}" {...restProps}>
		<IconButton
			icon={open ? X : Search}
			onclick={togglePanel}
			tooltip={open ? closeTooltip : searchTooltip}
			class={buttonClass}
		/>
	</div>
{/if}

<!-- Filter Panel - Rendered as sibling to break out of flex container -->
{#if (mode === 'panel' || mode === 'both') && open}
	<div class="w-full mb-6 bg-zinc-100 rounded-lg shadow-xs border border-zinc-200 p-4 {panelClass}">
		{#if children}
			{@render children()}
		{/if}
	</div>
{/if}

