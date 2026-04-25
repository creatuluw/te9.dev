<script lang="ts">
	import { onMount } from 'svelte';
	import SearchScope, { type SearchScopeOption } from './SearchScope.svelte';

	/**
	 * Search suggestion interface
	 * 
	 * @example
	 * ```typescript
	 * const suggestion: SearchSuggestion = {
	 *   value: 'case-123',
	 *   label: 'Case #123',
	 *   metadata: 'Active'
	 * };
	 * ```
	 */
	export interface SearchSuggestion {
		/**
		 * Suggestion value (set when selected)
		 */
		value: string;
		
		/**
		 * Display label for the suggestion
		 */
		label: string;
		
		/**
		 * Optional metadata text displayed next to label
		 */
		metadata?: string;
	}

	/**
	 * SearchInput component props
	 * 
	 * Search input with autocomplete suggestions dropdown.
	 */
	interface Props {
		/**
		 * Search input value (bindable)
		 * @default ''
		 */
		value?: string;
		
		/**
		 * Placeholder text
		 * @default 'Zoeken...'
		 */
		placeholder?: string;
		
		/**
		 * Disable the input
		 * @default false
		 */
		disabled?: boolean;
		
		/**
		 * Array of search suggestions to display
		 * @default []
		 * @example
		 * ```typescript
		 * <SearchInput 
		 *   suggestions={[
		 *     { value: '1', label: 'Case 1', metadata: 'Active' },
		 *     { value: '2', label: 'Case 2', metadata: 'Pending' }
		 *   ]}
		 * />
		 * ```
		 */
		suggestions?: SearchSuggestion[];
		
		/**
		 * Whether the input is actively filtering (shows orange border)
		 * @default false
		 */
		isActive?: boolean;
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
		
		/**
		 * Change event handler (fires on input)
		 * @param value - Current input value
		 * @example
		 * ```typescript
		 * <SearchInput onchange={(value) => console.log('Searching:', value)} />
		 * ```
		 */
		onchange?: (value: string) => void;
		
		/**
		 * Search event handler (fires on Enter key)
		 * @param value - Search value
		 * @example
		 * ```typescript
		 * <SearchInput onsearch={(value) => performSearch(value)} />
		 * ```
		 */
		onsearch?: (value: string) => void;
		
		/**
		 * Whether to show suggestions dropdown
		 * @default true
		 */
		showSuggestions?: boolean;
		
		/**
		 * Maximum number of suggestions to display
		 * @default 5
		 */
		maxSuggestions?: number;
		
		/**
		 * Whether to show search scope buttons when typing
		 * @default false
		 */
		showSearchScope?: boolean;
		
		/**
		 * Search scope options
		 * @default [{ value: 'alle', label: 'Alles' }]
		 */
		searchScopeOptions?: SearchScopeOption[];
		
		/**
		 * Currently selected search scope (bindable)
		 * @default 'alle'
		 */
		searchScope?: string;
		
		/**
		 * Search scope change event handler
		 * @param value - Selected scope value
		 */
		onscopechange?: (value: string) => void;
		
		/**
		 * Optional snippet for metadata shown next to scope buttons
		 */
		scopeMeta?: import('svelte').Snippet;
	}

	let {
		value: searchValue = $bindable(''),
		placeholder = 'Zoeken...',
		disabled = false,
		suggestions = [],
		isActive = false,
		class: className = '',
		onchange,
		onsearch,
		showSuggestions = true,
		maxSuggestions = 5,
		showSearchScope = false,
		searchScopeOptions = [{ value: 'alle', label: 'Alles' }],
		searchScope = $bindable('alle'),
		onscopechange,
		scopeMeta
	}: Props = $props();

	let inputElement: HTMLInputElement;
	let showDropdown = $state(false);
	let focusedIndex = $state(-1);
	let dropdownElement = $state<HTMLDivElement | undefined>(undefined);

	// Show scope buttons when user starts typing
	const showScopeButtons = $derived(showSearchScope && searchValue.trim().length > 0);

	// Filter suggestions based on search value
	const filteredSuggestions = $derived.by(() => {
		if (!searchValue || !showSuggestions) return [];
		
		const query = searchValue.toLowerCase();
		return suggestions
			.filter(
				(suggestion) =>
					suggestion.label.toLowerCase().includes(query) ||
					suggestion.value.toLowerCase().includes(query) ||
					suggestion.metadata?.toLowerCase().includes(query)
			)
			.slice(0, maxSuggestions);
	});

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchValue = target.value;
		showDropdown = true;
		focusedIndex = -1;
		if (onchange) {
			onchange(searchValue);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!showDropdown || filteredSuggestions.length === 0) {
			if (event.key === 'Enter' && onsearch) {
				onsearch(searchValue);
			}
			return;
		}

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				focusedIndex = Math.min(focusedIndex + 1, filteredSuggestions.length - 1);
				scrollToFocused();
				break;
			case 'ArrowUp':
				event.preventDefault();
				focusedIndex = Math.max(focusedIndex - 1, -1);
				scrollToFocused();
				break;
			case 'Enter':
				event.preventDefault();
				if (focusedIndex >= 0) {
					selectSuggestion(filteredSuggestions[focusedIndex]);
				} else if (onsearch) {
					onsearch(searchValue);
				}
				break;
			case 'Escape':
				showDropdown = false;
				focusedIndex = -1;
				inputElement?.blur();
				break;
		}
	}

	function selectSuggestion(suggestion: SearchSuggestion) {
		searchValue = suggestion.label;
		showDropdown = false;
		focusedIndex = -1;
		if (onchange) {
			onchange(searchValue);
		}
		if (onsearch) {
			onsearch(searchValue);
		}
	}

	function handleFocus() {
		if (searchValue && filteredSuggestions.length > 0) {
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
		searchValue = '';
		showDropdown = false;
		focusedIndex = -1;
		inputElement?.focus();
		if (onchange) {
			onchange('');
		}
		if (onsearch) {
			onsearch('');
		}
	}
	
	function handleScopeChange(value: string) {
		searchScope = value;
		if (onscopechange) {
			onscopechange(value);
		}
	}

	onMount(() => {
		return () => {
			showDropdown = false;
		};
	});
</script>

<div class="relative {className}">
	<div class="relative">
		<input
			bind:this={inputElement}
			type="text"
			value={searchValue}
			oninput={handleInput}
			onkeydown={handleKeydown}
			onfocus={handleFocus}
			onblur={handleBlur}
			{placeholder}
			{disabled}
			class="w-full appearance-none rounded-md bg-white h-9 pr-20 pl-10 text-left text-gray-900 outline-1 -outline-offset-1 {isActive ? 'outline-orange-500' : 'outline-gray-300'} focus-visible:outline-2 focus-visible:-outline-offset-2 {isActive ? 'focus-visible:outline-orange-600' : 'focus-visible:outline-indigo-600'} sm:text-sm/6 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
		/>
		<!-- Search icon -->
		<svg
			class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
		<!-- Clear button -->
		{#if searchValue}
			<button
				type="button"
				onclick={handleClear}
				class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
				title="Wissen"
			>
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
	
	<!-- Search Scope Buttons - shown when typing -->
	{#if showScopeButtons}
		<div class="mt-2 w-full">
			<SearchScope
				bind:value={searchScope}
				options={searchScopeOptions}
				onchange={handleScopeChange}
				class="w-full"
			/>
		</div>
	{/if}

	<!-- Suggestions dropdown -->
	{#if showDropdown && filteredSuggestions.length > 0}
		<div
			bind:this={dropdownElement}
			class="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto overflow-x-hidden rounded-md bg-white py-1 px-1 text-base shadow-lg outline-1 outline-black/5 sm:text-sm"
		>
			{#each filteredSuggestions as suggestion, index (suggestion.value)}
				<button
					type="button"
					onclick={() => selectSuggestion(suggestion)}
					class="group/option relative block w-full cursor-default py-2 pr-9 pl-3 text-left text-gray-900 select-none rounded-md focus:bg-gray-100 focus:outline-hidden {index ===
					focusedIndex
						? 'bg-gray-100'
						: ''}"
				>
					<div class="flex items-center justify-between gap-2">
						<span class="block truncate font-normal">{suggestion.label}</span>
						{#if suggestion.metadata}
							<span class="text-xs text-gray-500 whitespace-nowrap">{suggestion.metadata}</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

