<script lang="ts">
	/**
	 * Toggle component props
	 * 
	 * Switch/toggle component with animated transition.
	 */
	interface Props {
		/**
		 * Whether toggle is checked
		 * @default false
		 */
		checked?: boolean;
		
		/**
		 * HTML input name attribute
		 */
		name?: string;
		
		/**
		 * Disable the toggle
		 * @default false
		 */
		disabled?: boolean;
		
		/**
		 * Accessibility label for screen readers
		 */
		ariaLabel?: string;
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
		
		/**
		 * Change event handler
		 * @param event - Input change event
		 * @example
		 * ```typescript
		 * <Toggle 
		 *   checked={isEnabled}
		 *   onchange={(e) => setIsEnabled(e.currentTarget.checked)}
		 * />
		 * ```
		 */
		onchange?: (event: Event & { currentTarget: HTMLInputElement }) => void;
	}

	let {
		checked: checkedProp = false,
		name,
		disabled = false,
		ariaLabel,
		class: className = '',
		onchange,
		...restProps
	}: Props = $props();

	let checked = $state(checkedProp);
	let inputElement: HTMLInputElement;

	$effect(() => {
		checked = checkedProp;
	});

	function handleClick() {
		if (disabled) return;
		checked = !checked;
		// Update the actual input element
		if (inputElement) {
			inputElement.checked = checked;
		}
		// Trigger the change event callback
		if (onchange && inputElement) {
			const event = new Event('change', { bubbles: true });
			Object.defineProperty(event, 'currentTarget', {
				get: () => inputElement
			});
			onchange(event as Event & { currentTarget: HTMLInputElement });
		}
	}
</script>

<div
	role="switch"
	aria-checked={checked}
	aria-label={ariaLabel}
	aria-disabled={disabled}
	onclick={handleClick}
	class="group relative inline-flex w-11 shrink-0 rounded-full p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-orange-600 transition-colors duration-200 ease-in-out has-focus-visible:outline-2 dark:inset-ring-white/10 dark:outline-orange-500 {className}"
	class:bg-gray-200={!checked}
	class:bg-orange-400={checked}
	class:opacity-50={disabled}
	class:cursor-not-allowed={disabled}
	class:cursor-pointer={!disabled}
	style={checked ? 'background-color: rgb(251 146 60) !important;' : (!checked ? 'background-color: rgb(229 231 235) !important;' : '')}
	{...restProps}
>
	<span class="relative size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out pointer-events-none" class:translate-x-5={checked}>
		<span aria-hidden="true" class="absolute inset-0 flex size-full items-center justify-center transition-opacity duration-200 ease-in" class:opacity-100={!checked} class:opacity-0={checked} class:duration-100={checked} class:ease-out={checked}>
			<svg viewBox="0 0 12 12" fill="none" class="size-3 text-gray-400 dark:text-gray-600">
				<path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</span>
		<span aria-hidden="true" class="absolute inset-0 flex size-full items-center justify-center transition-opacity duration-100 ease-out" class:opacity-0={!checked} class:opacity-100={checked} class:duration-200={checked} class:ease-in={checked}>
			<svg viewBox="0 0 12 12" fill="currentColor" class="size-3 text-orange-600 dark:text-orange-500">
				<path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
			</svg>
		</span>
	</span>
	<input
		type="checkbox"
		bind:this={inputElement}
		{name}
		aria-label={ariaLabel}
		{disabled}
		checked={checked}
		class="sr-only"
		tabindex="-1"
	/>
</div>

