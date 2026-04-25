<script lang="ts">
	import type { Snippet } from 'svelte';
	
	/**
	 * Label variant styles
	 * - default: Gray background (zinc)
	 * - success: Green background
	 * - warning: Amber/yellow background
	 * - danger: Red background
	 */
	type LabelVariant = 'default' | 'success' | 'warning' | 'danger';

	/**
	 * Label component props
	 * 
	 * Badge/label component for status indicators or tags.
	 */
	interface Props {
		/**
		 * Visual variant for the label
		 * @default 'default'
		 * @example
		 * ```typescript
		 * <Label variant="success">Active</Label>
		 * ```
		 */
		variant?: LabelVariant;
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
		
		/**
		 * Children snippet
		 */
		children?: Snippet;
	}

	let { variant = 'default', class: className = '', children, ...restProps }: Props = $props();
</script>

<span
	class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border {className}"
	class:bg-zinc-100={variant === 'default'}
	class:text-zinc-800={variant === 'default'}
	class:border-zinc-200={variant === 'default'}
	class:bg-green-100={variant === 'success'}
	class:text-green-800={variant === 'success'}
	class:border-green-200={variant === 'success'}
	class:bg-amber-100={variant === 'warning'}
	class:text-amber-800={variant === 'warning'}
	class:border-amber-200={variant === 'warning'}
	class:bg-red-100={variant === 'danger'}
	class:text-red-800={variant === 'danger'}
	class:border-red-200={variant === 'danger'}
	{...restProps}
>
	{@render children?.()}
</span>

