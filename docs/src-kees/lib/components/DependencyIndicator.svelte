<script lang="ts">
	import { AlertTriangle } from 'lucide-svelte';

	/**
	 * DependencyIndicator component props
	 *
	 * Shows visual indicator when a task has dependency-related changes
	 */
	interface Props {
		/**
		 * Number of dependency changes affecting this task
		 */
		changeCount?: number;

		/**
		 * Whether to show as a badge or icon
		 */
		variant?: 'badge' | 'icon';

		/**
		 * Size of the indicator
		 */
		size?: 'sm' | 'md' | 'lg';

		/**
		 * Tooltip text
		 */
		tooltip?: string;

		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let {
		changeCount = 1,
		variant = 'icon',
		size = 'sm',
		tooltip = 'Deze taak is beïnvloed door afhankelijkheid wijzigingen',
		class: className = ''
	}: Props = $props();

	// Size classes
	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-5 h-5',
		lg: 'w-6 h-6'
	};

	const iconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;
</script>

{#if variant === 'badge'}
	<!-- Badge variant -->
	<span
		class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 {className}"
		title={tooltip}
	>
		<AlertTriangle size={iconSize} class="mr-1" />
		{changeCount > 1 ? changeCount : ''}
		Afhankelijkheid
	</span>
{:else}
	<!-- Icon variant -->
	<div
		class="inline-flex items-center justify-center rounded-full bg-orange-100 text-orange-700 border border-orange-200 {sizeClasses[size]} {className}"
		title={tooltip}
		role="status"
		aria-label={tooltip}
	>
		<AlertTriangle size={iconSize} />
		{#if changeCount > 1}
			<span class="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center text-[10px]">
				{changeCount}
			</span>
		{/if}
	</div>
{/if}
