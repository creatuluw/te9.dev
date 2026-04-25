<script lang="ts">
	/**
	 * Rating component props
	 * 
	 * Star rating component with interactive or read-only modes.
	 */
	interface Props {
		/**
		 * Current rating value (0 to max)
		 * @default 0
		 * @example
		 * ```typescript
		 * <Rating rating={4} max={5} />
		 * ```
		 */
		rating?: number;
		
		/**
		 * Maximum rating value
		 * @default 5
		 */
		max?: number;
		
		/**
		 * Make rating read-only (non-interactive)
		 * @default false
		 */
		readonly?: boolean;
		
		/**
		 * Star size variant
		 * @default 'default'
		 */
		size?: 'sm' | 'default' | 'lg';
		
		/**
		 * Show rating value as text (e.g., "4.0 / 5")
		 * @default false
		 */
		showValue?: boolean;
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
		
		/**
		 * Change event handler
		 * @param rating - New rating value (1 to max)
		 * @example
		 * ```typescript
		 * <Rating 
		 *   rating={currentRating}
		 *   onchange={(r) => setRating(r)}
		 * />
		 * ```
		 */
		onchange?: (rating: number) => void;
	}

	let {
		rating = 0,
		max = 5,
		readonly = false,
		size = 'default',
		showValue = false,
		class: className = '',
		onchange
	}: Props = $props();

	let hoveredRating = $state<number | null>(null);

	// Determine if a star should be filled
	function isFilled(index: number): boolean {
		const valueToCheck = hoveredRating !== null ? hoveredRating : rating;
		return index < valueToCheck;
	}

	// Get star size classes
	const sizeClasses = {
		sm: 'w-3 h-3',
		default: 'w-4 h-4',
		lg: 'w-5 h-5'
	};

	// Get spacing classes
	const spacingClasses = {
		sm: 'ms-0.5',
		default: 'ms-1',
		lg: 'ms-1.5'
	};

	function handleClick(index: number) {
		if (readonly || !onchange) return;
		const newRating = index + 1;
		onchange(newRating);
	}

	function handleMouseEnter(index: number) {
		if (readonly) return;
		hoveredRating = index + 1;
	}

	function handleMouseLeave() {
		if (readonly) return;
		hoveredRating = null;
	}
</script>

<div class="flex items-center {className}">
	{#each Array(max) as _, index}
		<button
			type="button"
			disabled={readonly}
			onclick={() => handleClick(index)}
			onmouseenter={() => handleMouseEnter(index)}
			onmouseleave={handleMouseLeave}
			class="{sizeClasses[size]} {spacingClasses[size]} transition-colors"
			class:cursor-pointer={!readonly}
			class:cursor-default={readonly}
			aria-label="Rate {index + 1} out of {max}"
		>
			<svg
				class="{sizeClasses[size]} transition-colors"
				class:text-amber-400={isFilled(index)}
				class:text-zinc-300={!isFilled(index)}
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				fill="currentColor"
				viewBox="0 0 22 20"
			>
				<path
					d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
				/>
			</svg>
		</button>
	{/each}
	{#if showValue}
		<span class="ml-2 text-sm text-zinc-600 font-inter">
			{rating > 0 ? rating.toFixed(1) : '0.0'} / {max}
		</span>
	{/if}
</div>
