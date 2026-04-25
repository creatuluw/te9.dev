<script lang="ts">
	import type { Snippet } from 'svelte';
	
	/**
	 * ButtonGroup component props
	 * 
	 * Container component for grouping buttons together with connected borders.
	 * Child buttons should have the `button-group-item` class.
	 */
	interface Props {
		/**
		 * Additional CSS classes
		 * @example
		 * ```typescript
		 * <ButtonGroup>
		 *   <Button class="button-group-item">First</Button>
		 *   <Button class="button-group-item">Second</Button>
		 * </ButtonGroup>
		 * ```
		 */
		class?: string;
		
		/**
		 * Size variant for buttons in the group
		 * - default: Standard button size
		 * - sm: Smaller button size with reduced font
		 */
		size?: 'default' | 'sm';
		
		/**
		 * Children content
		 */
		children?: Snippet;
	}

	let {
		class: className = '',
		size = 'default',
		children,
		...restProps
	}: Props = $props();
</script>

<div
	class="inline-flex rounded-lg border border-zinc-200 bg-white shadow-xs {className}"
	class:button-group-sm={size === 'sm'}
	role="group"
	{...restProps}
>
	{@render children?.()}
</div>

<style>
	:global(.button-group-item) {
		margin-left: calc(-1 * 1px);
		flex: 1 1 0%;
		border-top: none !important;
		border-bottom: none !important;
		border-left: none !important;
		border-right: none !important;
	}
	
	:global(.button-group-sm .button-group-item) {
		font-size: 0.75rem;
		line-height: 1.5;
		padding: 0.375rem 0.75rem;
	}

	:global(.button-group-item:first-child) {
		margin-left: 0;
		border-top-left-radius: 0.5rem;
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0.5rem;
	}

	:global(.button-group-item:last-child) {
		border-top-left-radius: 0;
		border-top-right-radius: 0.5rem;
		border-bottom-right-radius: 0.5rem;
		border-bottom-left-radius: 0;
	}

	:global(.button-group-item:not(:first-child):not(:last-child)) {
		border-radius: 0;
	}

	:global(.button-group-item:not(:last-child)) {
		border-right: 1px solid rgb(228 228 231);
	}

	/* Maintain hover states */
	:global(.button-group-item:hover) {
		position: relative;
		z-index: 10;
	}
</style>

