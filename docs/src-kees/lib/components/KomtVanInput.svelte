<script lang="ts">
	import { onMount } from 'svelte';
	import * as komtVanService from '$lib/services/komtVanService';

	/**
	 * KomtVanInput component props
	 * 
	 * Autocomplete input for komt_van field with suggestions from existing values.
	 * Allows typing new values as well as selecting from existing ones.
	 */
	interface Props {
		/**
		 * Input value (bindable)
		 * @default ''
		 */
		value?: string;

		/**
		 * Placeholder text
		 * @default 'email@example.com'
		 */
		placeholder?: string;

		/**
		 * Disable the input
		 * @default false
		 */
		disabled?: boolean;

		/**
		 * Additional CSS classes
		 */
		class?: string;

		/**
		 * Change event handler (fires on input)
		 * @param value - Current input value
		 */
		onchange?: (value: string) => void;

		/**
		 * Maximum number of suggestions to display
		 * @default 10
		 */
		maxSuggestions?: number;

		/**
		 * Input ID for form association
		 */
		id?: string;
	}

	let {
		value: inputValue = $bindable(''),
		placeholder = 'email@example.com',
		disabled = false,
		class: className = '',
		onchange,
		maxSuggestions = 10,
		id
	}: Props = $props();

	let inputElement: HTMLInputElement;
	let showDropdown = $state(false);
	let focusedIndex = $state(-1);
	let dropdownElement = $state<HTMLDivElement | undefined>(undefined);
	let suggestions = $state<string[]>([]);
	let loadingSuggestions = $state(false);

	// Load suggestions when component mounts
	onMount(async () => {
		await loadSuggestions();
	});

	// Get suggestions to display (only when user has typed at least 1 character)
	const displaySuggestions = $derived.by(() => {
		if (inputValue && inputValue.trim().length > 0) {
			const query = inputValue.toLowerCase().trim();
			const filtered = suggestions.filter((suggestion) => 
				suggestion.toLowerCase().includes(query)
			);
			console.log('[KomtVanInput] Filtering suggestions for query "' + query + '":', filtered.length, 'matches out of', suggestions.length, 'total');
			return filtered.slice(0, maxSuggestions);
		}
		// Return empty array if no input (don't show all suggestions)
		return [];
	});

	async function loadSuggestions() {
		loadingSuggestions = true;
		try {
			const result = await komtVanService.getAllKomtVanValues();
			if (result.success) {
				suggestions = result.value;
				console.log('[KomtVanInput] Loaded', suggestions.length, 'suggestions:', suggestions);
			} else {
				console.error('[KomtVanInput] Failed to load suggestions:', result.error);
			}
		} catch (error) {
			console.error('[KomtVanInput] Error loading suggestions:', error);
		} finally {
			loadingSuggestions = false;
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		inputValue = target.value;
		// Always show dropdown when typing (if we have suggestions or are loading)
		if (suggestions.length > 0 || loadingSuggestions) {
			showDropdown = true;
		}
		focusedIndex = -1;
		if (onchange) {
			onchange(inputValue);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!showDropdown || displaySuggestions.length === 0) {
			return;
		}

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				focusedIndex = Math.min(focusedIndex + 1, displaySuggestions.length - 1);
				scrollToFocused();
				break;
			case 'ArrowUp':
				event.preventDefault();
				focusedIndex = Math.max(focusedIndex - 1, -1);
				scrollToFocused();
				break;
			case 'Enter':
				event.preventDefault();
				if (focusedIndex >= 0 && focusedIndex < displaySuggestions.length) {
					selectSuggestion(displaySuggestions[focusedIndex]);
				}
				break;
			case 'Escape':
				showDropdown = false;
				focusedIndex = -1;
				inputElement?.blur();
				break;
		}
	}

	function selectSuggestion(suggestion: string) {
		inputValue = suggestion;
		showDropdown = false;
		focusedIndex = -1;
		if (onchange) {
			onchange(inputValue);
		}
	}

	function handleFocus() {
		// Only show dropdown if user has typed at least 1 character
		if (inputValue && inputValue.trim().length > 0 && suggestions.length > 0) {
			showDropdown = true;
		}
	}

	function handleBlur() {
		// Delay to allow click on suggestion
		setTimeout(() => {
			showDropdown = false;
			focusedIndex = -1;
		}, 200);
	}

	function scrollToFocused() {
		if (focusedIndex >= 0 && dropdownElement !== undefined && dropdownElement) {
			const item = dropdownElement.children[focusedIndex] as HTMLElement;
			if (item) {
				item.scrollIntoView({ block: 'nearest' });
			}
		}
	}

	function handleClear() {
		inputValue = '';
		showDropdown = false;
		focusedIndex = -1;
		inputElement?.focus();
		if (onchange) {
			onchange('');
		}
	}
</script>

<div class="relative {className}">
	<div class="relative">
		<input
			bind:this={inputElement}
			{id}
			type="email"
			value={inputValue}
			oninput={handleInput}
			onkeydown={handleKeydown}
			onfocus={handleFocus}
			onblur={handleBlur}
			{placeholder}
			{disabled}
			class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm"
		/>
		<!-- Clear button -->
		{#if inputValue && !disabled}
			<button
				type="button"
				onclick={handleClear}
				class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 hover:text-zinc-600 transition-colors"
				title="Wissen"
			>
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-4 h-4">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		{/if}
	</div>

	<!-- Suggestions dropdown -->
	{#if showDropdown && (displaySuggestions.length > 0 || loadingSuggestions)}
		<div
			bind:this={dropdownElement}
			class="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto overflow-x-hidden rounded-md bg-white py-1 px-1 text-base shadow-lg border border-zinc-200 sm:text-sm"
		>
			{#if loadingSuggestions}
				<div class="py-2 px-3 text-sm text-zinc-500">Laden...</div>
			{:else if displaySuggestions.length === 0 && inputValue}
				<div class="py-2 px-3 text-sm text-zinc-500">Geen suggesties gevonden</div>
			{:else}
				{#each displaySuggestions as suggestion, index (suggestion)}
					<button
						type="button"
						onclick={() => selectSuggestion(suggestion)}
						class="group/option relative block w-full cursor-default py-2 pr-9 pl-3 text-left text-zinc-900 select-none rounded-md hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-hidden {index ===
						focusedIndex
							? 'bg-zinc-100'
							: ''}"
					>
						<span class="block truncate font-normal text-sm">{suggestion}</span>
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>

