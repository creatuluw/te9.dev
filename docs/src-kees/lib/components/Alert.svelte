<script lang="ts">
	type AlertVariant = 'info' | 'danger' | 'success' | 'warning' | 'dark';

	interface Props {
		/**
		 * Alert variant type
		 * - info: Blue accent for informational messages
		 * - danger: Red accent for error/critical messages
		 * - success: Green accent for success messages
		 * - warning: Yellow accent for warning messages
		 * - dark: Dark blue-grey for neutral messages
		 */
		variant?: AlertVariant;
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
		
		/**
		 * Children content (default slot)
		 */
		children?: import('svelte').Snippet;
	}

	let {
		variant = 'info',
		class: className = '',
		children
	}: Props = $props();

	// Determine background and text colors based on variant
	const variantClasses = $derived(() => {
		switch (variant) {
			case 'info':
				return 'bg-blue-50 text-blue-700';
			case 'danger':
				return 'bg-red-50 text-red-700';
			case 'success':
				return 'bg-green-50 text-green-700';
			case 'warning':
				return 'bg-yellow-50 text-yellow-700';
			case 'dark':
				return 'bg-zinc-100 text-zinc-900';
			default:
				return 'bg-blue-50 text-blue-700';
		}
	});
</script>

<div
	class="rounded-lg p-4 {variantClasses()} {className}"
	role="alert"
>
	{@render children?.()}
</div>

