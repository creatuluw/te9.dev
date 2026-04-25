<style>
	/* Custom checkbox styling using CSS pseudo-elements - scoped to component */
	:global(.checkbox-group-wrapper [type="checkbox"]) {
		position: absolute;
		opacity: 0;
		left: 0;
		cursor: pointer;
		width: 1.125rem;
		height: 1.125rem;
		margin: 0;
	}

	:global(.checkbox-group-wrapper label) {
		position: relative;
		cursor: pointer;
		padding-left: 1.875rem; /* Make room for the checkbox */
		display: flex;
		align-items: center;
		min-height: 1.5rem; /* Better touch target */
		transition: color 0.15s ease;
	}

	/* Checkbox box */
	:global(.checkbox-group-wrapper label::before) {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 1.125rem;
		height: 1.125rem;
		border: 1.5px solid rgb(212 212 216); /* zinc-300 */
		background: white;
		border-radius: 0.25rem; /* rounded-sm */
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
	}

	/* Checkmark using SVG path for better rendering */
	:global(.checkbox-group-wrapper label::after) {
		content: '';
		position: absolute;
		left: 0.1875rem; /* 3px */
		top: 50%;
		transform: translateY(-50%) scale(0);
		width: 0.75rem;
		height: 0.75rem;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z' fill='white'/%3E%3C/svg%3E");
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
		opacity: 0;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Hover state */
	:global(.checkbox-group-wrapper label:hover:not(:has([type="checkbox"]:disabled))::before) {
		border-color: rgb(161 161 170); /* zinc-400 */
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	/* Checked state */
	:global(.checkbox-group-wrapper label:has([type="checkbox"]:checked)::before) {
		border-color: #FF6900;
		background-color: #FF6900;
		box-shadow: 0 1px 3px 0 rgb(255 105 0 / 0.3);
	}

	:global(.checkbox-group-wrapper label:has([type="checkbox"]:checked)::after) {
		opacity: 1;
		transform: translateY(-50%) scale(1);
	}

	/* Focus state - improved accessibility */
	:global(.checkbox-group-wrapper label:has([type="checkbox"]:focus-visible)::before) {
		outline: 2px solid #FF6900;
		outline-offset: 2px;
		box-shadow: 0 0 0 4px rgb(255 105 0 / 0.1);
	}

	/* Active/pressed state */
	:global(.checkbox-group-wrapper label:has([type="checkbox"]:active:not(:disabled))::before) {
		transform: translateY(-50%) scale(0.95);
	}

	/* Disabled state */
	:global(.checkbox-group-wrapper label:has([type="checkbox"]:disabled)) {
		cursor: not-allowed;
		opacity: 0.6;
	}

	:global(.checkbox-group-wrapper label:has([type="checkbox"]:disabled) .checkbox-label-text) {
		color: rgb(113 113 122); /* zinc-500 */
	}

	:global(.checkbox-group-wrapper label:has([type="checkbox"]:disabled)::before) {
		border-color: rgb(212 212 216); /* zinc-300 */
		background-color: rgb(244 244 245); /* zinc-100 */
		box-shadow: none;
		cursor: not-allowed;
	}

	:global(.checkbox-group-wrapper label:has([type="checkbox"]:disabled:checked)::after) {
		opacity: 0.5;
	}
</style>

<script lang="ts">
	import type { Snippet } from 'svelte';
	
	/**
	 * Checkbox option interface
	 * 
	 * @example
	 * ```typescript
	 * const option: CheckboxOption = {
	 *   id: 'opt1',
	 *   label: 'Option 1',
	 *   value: 'value1',
	 *   disabled: false
	 * };
	 * ```
	 */
	export interface CheckboxOption {
		/**
		 * Unique identifier for the checkbox option
		 */
		id: string;
		
		/**
		 * Display label for the option
		 */
		label: string;
		
		/**
		 * Option value (used when selected)
		 */
		value: string;
		
		/**
		 * Whether the option is disabled
		 * @default false
		 */
		disabled?: boolean;
	}

	/**
	 * CheckboxGroup component props
	 * 
	 * Checkbox group component with fieldset structure and accessibility support.
	 * Supports multiple selections.
	 */
	interface Props {
		/**
		 * Checkbox group name attribute (required for form submission)
		 */
		name: string;
		
		/**
		 * Fieldset legend text
		 */
		legend?: string;
		
		/**
		 * Description text displayed below legend
		 */
		description?: string;
		
		/**
		 * Array of checkbox options to display
		 * @default []
		 * @example
		 * ```typescript
		 * <CheckboxGroup 
		 *   name="notifications"
		 *   options={[
		 *     { id: 'in-app', label: 'In-app', value: 'in-app' },
		 *     { id: 'email', label: 'Email', value: 'email' }
		 *   ]}
		 * />
		 * ```
		 */
		options?: CheckboxOption[];
		
		/**
		 * Selected values (array of selected option values)
		 */
		value?: string[];
		
		/**
		 * Layout direction
		 * @default 'horizontal'
		 */
		layout?: 'horizontal' | 'vertical';
		
		/**
		 * Disable all checkbox options
		 * @default false
		 */
		disabled?: boolean;
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
		
		/**
		 * Children snippet (used when options array is empty)
		 */
		children?: Snippet;
		
		/**
		 * Change event handler
		 * @param event - Input change event
		 * @example
		 * ```typescript
		 * <CheckboxGroup 
		 *   name="methods"
		 *   onchange={(e) => {
		 *     const checked = e.currentTarget.checked;
		 *     const value = e.currentTarget.value;
		 *     // Update selected values array
		 *   }}
		 * />
		 * ```
		 */
		onchange?: (event: Event & { currentTarget: HTMLInputElement }) => void;
	}

	let {
		name,
		legend,
		description,
		options = [],
		value: valueProp = [],
		layout = 'horizontal',
		disabled = false,
		class: className = '',
		children,
		onchange,
		...restProps
	}: Props = $props();

	// Internal state that syncs with prop
	let value = $state<string[]>(valueProp || []);

	// Sync prop changes to internal state
	$effect(() => {
		// Always sync when valueProp changes
		if (valueProp !== undefined && Array.isArray(valueProp)) {
			value = [...valueProp];
		} else {
			value = [];
		}
	});

	function handleChange(event: Event & { currentTarget: HTMLInputElement }) {
		const checked = event.currentTarget.checked;
		const optionValue = event.currentTarget.value;
		
		if (checked) {
			value = [...value, optionValue];
		} else {
			value = value.filter(v => v !== optionValue);
		}
		
		onchange?.(event);
	}
</script>

<fieldset class="space-y-1 {className}" {disabled} {...restProps}>
	{#if legend}
		<legend class="text-sm/6 font-semibold text-zinc-900 font-aspekta tracking-tight">
			{legend}
		</legend>
	{/if}

	{#if description}
		<p id="{name}-description" class="mt-1.5 text-sm/6 text-zinc-600 font-inter">
			{description}
		</p>
	{/if}

	<div
		class="checkbox-group-wrapper mt-4"
		class:flex={layout === 'horizontal'}
		class:flex-col={layout === 'vertical'}
		class:items-start={layout === 'vertical'}
		class:items-center={layout === 'horizontal'}
		class:gap-4={layout === 'horizontal'}
		class:gap-3={layout === 'vertical'}
		class:flex-wrap={layout === 'horizontal'}
	>
		{#if options.length > 0}
			{#each options as option}
				{@const isChecked = value.includes(option.value)}
				<label
					class="group flex items-center"
					for={option.id}
				>
					<input
						id={option.id}
						type="checkbox"
						name={name}
						value={option.value}
						checked={isChecked}
						disabled={disabled || option.disabled}
						onchange={handleChange}
						aria-describedby={description ? `${name}-description` : undefined}
					/>
					<span class="checkbox-label-text text-sm font-medium text-zinc-900 font-inter leading-5 select-none">
						{option.label}
					</span>
				</label>
			{/each}
		{:else}
			{@render children?.()}
		{/if}
	</div>
</fieldset>

