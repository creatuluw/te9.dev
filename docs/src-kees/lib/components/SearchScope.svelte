<script lang="ts">
	/**
	 * Search scope option
	 */
	export interface SearchScopeOption {
		/**
		 * Unique identifier for the scope
		 */
		value: string;
		
		/**
		 * Display label
		 */
		label: string;
	}

	/**
	 * SearchScope component props
	 * 
	 * Button group for filtering search scope (alle, cases, projecten, etc.)
	 */
	interface Props {
		/**
		 * Available scope options
		 * @default [{ value: 'alle', label: 'Alle' }]
		 */
		options?: SearchScopeOption[];
		
		/**
		 * Currently selected scope
		 * @default 'alle'
		 */
		value?: string;
		
		/**
		 * Change event handler
		 * @param value - Selected scope value
		 */
		onchange?: (value: string) => void;
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let {
		options = [{ value: 'alle', label: 'Alles' }],
		value = $bindable('alle'),
		onchange,
		class: className = ''
	}: Props = $props();

	function handleScopeChange(newValue: string) {
		value = newValue;
		if (onchange) {
			onchange(newValue);
		}
	}
</script>

<div class="flex rounded-md shadow-xs {className}" role="group">
	{#each options as option, index}
		<button
			type="button"
			onclick={() => handleScopeChange(option.value)}
			class="flex-1 px-2 py-1 text-xs font-inter font-medium transition-colors
				{value === option.value 
					? 'bg-zinc-900 text-white' 
					: 'bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'}
				{index === 0 ? 'rounded-l-md' : ''}
				{index === options.length - 1 ? 'rounded-r-md' : ''}
				{index > 0 ? 'border-l border-zinc-200' : ''}
				outline-1 -outline-offset-1 outline-zinc-300"
		>
			{option.label}
		</button>
	{/each}
</div>

