<style>
	/* Custom radio button styling using CSS pseudo-elements - scoped to component */
	:global(.radio-group-wrapper [type="radio"]) {
		position: absolute;
		opacity: 0;
		left: 0;
		cursor: pointer;
		width: 1.125rem;
		height: 1.125rem;
		margin: 0;
	}

	:global(.radio-group-wrapper label) {
		position: relative;
		cursor: pointer;
		padding-left: 1.875rem; /* Make room for the radio button */
		display: flex;
		align-items: center;
		min-height: 1.5rem; /* Better touch target */
		transition: color 0.15s ease;
	}

	/* Radio button circle */
	:global(.radio-group-wrapper label::before) {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 1.125rem;
		height: 1.125rem;
		border: 1.5px solid rgb(212 212 216); /* zinc-300 */
		background: white;
		border-radius: 50%;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
	}

	/* Radio button dot */
	:global(.radio-group-wrapper label::after) {
		content: '';
		position: absolute;
		left: 0.375rem; /* 6px - center of 18px circle */
		top: 50%;
		transform: translateY(-50%) scale(0);
		width: 0.375rem; /* 6px */
		height: 0.375rem; /* 6px */
		border-radius: 50%;
		background: white;
		opacity: 0;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Hover state */
	:global(.radio-group-wrapper label:hover:not(:has([type="radio"]:disabled))::before) {
		border-color: rgb(161 161 170); /* zinc-400 */
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	/* Checked state */
	:global(.radio-group-wrapper label:has([type="radio"]:checked)::before) {
		border-color: #FF6900;
		background-color: #FF6900;
		box-shadow: 0 1px 3px 0 rgb(255 105 0 / 0.3);
	}

	:global(.radio-group-wrapper label:has([type="radio"]:checked)::after) {
		opacity: 1;
		transform: translateY(-50%) scale(1);
	}

	/* Focus state - improved accessibility */
	:global(.radio-group-wrapper label:has([type="radio"]:focus-visible)::before) {
		outline: 2px solid #FF6900;
		outline-offset: 2px;
		box-shadow: 0 0 0 4px rgb(255 105 0 / 0.1);
	}

	/* Active/pressed state */
	:global(.radio-group-wrapper label:has([type="radio"]:active:not(:disabled))::before) {
		transform: translateY(-50%) scale(0.95);
	}

	/* Disabled state */
	:global(.radio-group-wrapper label:has([type="radio"]:disabled)) {
		cursor: not-allowed;
		opacity: 0.6;
	}

	:global(.radio-group-wrapper label:has([type="radio"]:disabled) .radio-label-text) {
		color: rgb(113 113 122); /* zinc-500 */
	}

	:global(.radio-group-wrapper label:has([type="radio"]:disabled)::before) {
		border-color: rgb(212 212 216); /* zinc-300 */
		background-color: rgb(244 244 245); /* zinc-100 */
		box-shadow: none;
		cursor: not-allowed;
	}

	:global(.radio-group-wrapper label:has([type="radio"]:disabled:checked)::after) {
		background-color: rgb(161 161 170); /* zinc-400 */
		opacity: 0.5;
	}
</style>

<script lang="ts">
	import type { Snippet } from 'svelte';
	
	/**
	 * Radio option interface
	 * 
	 * @example
	 * ```typescript
	 * const option: RadioOption = {
	 *   id: 'opt1',
	 *   label: 'Option 1',
	 *   value: 'value1',
	 *   disabled: false
	 * };
	 * ```
	 */
	export interface RadioOption {
		/**
		 * Unique identifier for the radio option
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
	 * RadioGroup component props
	 * 
	 * Radio button group component with fieldset structure and accessibility support.
	 */
	interface Props {
		/**
		 * Radio group name attribute (required for form submission)
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
		 * Array of radio options to display
		 * @default []
		 * @example
		 * ```typescript
		 * <RadioGroup 
		 *   name="priority"
		 *   options={[
		 *     { id: 'low', label: 'Low', value: 'low' },
		 *     { id: 'high', label: 'High', value: 'high' }
		 *   ]}
		 * />
		 * ```
		 */
		options?: RadioOption[];
		
		/**
		 * Selected value
		 */
		value?: string;
		
		/**
		 * Layout direction
		 * @default 'horizontal'
		 */
		layout?: 'horizontal' | 'vertical';
		
		/**
		 * Disable all radio options
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
		 * <RadioGroup 
		 *   name="type"
		 *   onchange={(e) => setValue(e.currentTarget.value)}
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
		value: valueProp,
		layout = 'horizontal',
		disabled = false,
		class: className = '',
		children,
		onchange,
		...restProps
	}: Props = $props();

	let value = $state(valueProp || '');

	$effect(() => {
		if (valueProp !== undefined) {
			value = valueProp;
		}
	});

	function handleChange(event: Event & { currentTarget: HTMLInputElement }) {
		value = event.currentTarget.value;
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
		class="radio-group-wrapper mt-4"
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
				{@const isChecked = value === option.value}
				<label
					class="group flex items-center"
					for={option.id}
				>
					<input
						id={option.id}
						type="radio"
						name={name}
						value={option.value}
						checked={isChecked}
						disabled={disabled || option.disabled}
						onchange={handleChange}
						aria-describedby={description ? `${name}-description` : undefined}
					/>
					<span class="radio-label-text text-sm font-medium text-zinc-900 font-inter leading-5 select-none">
						{option.label}
					</span>
				</label>
			{/each}
		{:else}
			{@render children?.()}
		{/if}
	</div>
</fieldset>

