<script lang="ts">
	interface Props {
		/**
		 * Type of skeleton element
		 * - text: Text line placeholder (rounded-full)
		 * - box: Rectangular placeholder (rounded-sm)
		 * - circle: Circular placeholder (for avatars)
		 */
		type?: 'text' | 'box' | 'circle';
		
		/**
		 * Width of the skeleton element
		 * Can be a Tailwind width class (w-48, w-full, etc.) or custom value
		 * @default 'w-full'
		 */
		width?: string;
		
		/**
		 * Height of the skeleton element
		 * Can be a Tailwind height class (h-4, h-12, etc.) or custom value
		 * For text type: defaults to h-2 or h-2.5
		 * For box/circle: defaults to h-48
		 */
		height?: string;
		
		/**
		 * Whether to show animation (pulse effect)
		 * @default true
		 */
		animated?: boolean;
		
		/**
		 * Background color variant
		 * - light: bg-zinc-200 (lighter, for text)
		 * - medium: bg-zinc-300 (medium, for boxes/images)
		 * @default 'light' for text, 'medium' for box/circle
		 */
		variant?: 'light' | 'medium';
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let {
		type = 'text',
		width,
		height,
		animated = true,
		variant,
		class: className = '',
		...restProps
	}: Props = $props();

	// Default dimensions and variant based on type
	const defaultDimensions = $derived(() => {
		switch (type) {
			case 'text':
				return {
					width: width || 'w-full',
					height: height || 'h-2.5',
					rounded: 'rounded-full',
					variant: variant || 'light'
				};
			case 'circle':
				return {
					width: width || 'w-12',
					height: height || width || 'w-12', // Circle should be square
					rounded: 'rounded-full',
					variant: variant || 'medium'
				};
			case 'box':
				return {
					width: width || 'w-full',
					height: height || 'h-48',
					rounded: 'rounded-sm',
					variant: variant || 'medium'
				};
		}
	});

	const skeletonClasses = $derived(() => {
		const dims = defaultDimensions();
		const bgColor = dims.variant === 'medium' 
			? 'bg-zinc-300 dark:bg-zinc-700' 
			: 'bg-zinc-200 dark:bg-zinc-700';
		
		return [
			dims.rounded,
			dims.width,
			dims.height,
			bgColor,
			animated ? 'animate-pulse' : '',
			className
		].filter(Boolean).join(' ');
	});
</script>

<div
	class={skeletonClasses}
	role="status"
	aria-label="Loading"
	{...restProps}
>
	<span class="sr-only">Loading...</span>
</div>

