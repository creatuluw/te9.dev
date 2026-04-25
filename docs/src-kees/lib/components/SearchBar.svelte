<script lang="ts">
	import { onMount } from "svelte";
	import {
		createSearchState,
		createDebouncedSearchCallback,
		getMessageTypeOptions,
		validateSearchInput,
		type SearchParams,
		type MessageTypeOption,
	} from "$lib/utils/searchHelpers";

	/**
	 * SearchBar component props
	 */
	interface Props {
		/**
		 * Callback invoked with search params when the user types and debounce fires
		 */
		onSearch: (params: SearchParams) => void;

		/**
		 * Initial query string (e.g. from URL params)
		 */
		initialQuery?: string;

		/**
		 * Custom message type options for the filter dropdown.
		 * Defaults to getMessageTypeOptions() if not provided.
		 */
		messageTypes?: Array<{ value: string; label: string }>;

		/**
		 * Debounce delay in milliseconds (default: 300)
		 */
		debounceMs?: number;

		/**
		 * Whether to show the date range inputs (default: false)
		 */
		showDateRange?: boolean;

		/**
		 * Additional CSS classes for the container
		 */
		class?: string;
	}

	let {
		onSearch,
		initialQuery = "",
		messageTypes,
		debounceMs = 300,
		showDateRange = false,
		class: className = "",
	}: Props = $props();

	// Search state managed by closure
	const searchState = createSearchState();

	// UI state
	let queryInput = $state(initialQuery);
	let validationError = $state<string | undefined>(undefined);
	let showFilters = $state(false);

	// Use provided message types or defaults
	const typeOptions: MessageTypeOption[] = messageTypes || getMessageTypeOptions();

	// Debounced search callback
	const debouncedSearch = createDebouncedSearchCallback(
		(params: SearchParams) => {
			onSearch(params);
		},
		debounceMs,
	);

	// Initialize search state from initialQuery
	$effect(() => {
		if (initialQuery) {
			searchState.setQuery(initialQuery);
			queryInput = initialQuery;
		}
	});

	/**
	 * Handle query input change with validation and debounce
	 */
	function handleQueryInput(event: Event): void {
		const target = event.target as HTMLInputElement;
		const value = target.value;
		queryInput = value;

		const validation = validateSearchInput(value);
		validationError = validation.valid ? undefined : validation.error;

		if (validation.valid) {
			searchState.setQuery(value);
			debouncedSearch.search(searchState.toSearchParams());
		} else {
			searchState.setQuery("");
			validationError = validation.error;
		}
	}

	/**
	 * Handle message type filter change
	 */
	function handleTypeChange(event: Event): void {
		const target = event.target as HTMLSelectElement;
		searchState.setType(target.value);

		// If there's an active query, trigger search with updated params
		if (searchState.isActive()) {
			debouncedSearch.search(searchState.toSearchParams());
		}
	}

	/**
	 * Handle date range from change
	 */
	function handleDateFromChange(event: Event): void {
		const target = event.target as HTMLInputElement;
		const currentRange = searchState.getDateRange();
		searchState.setDateRange({ ...currentRange, from: target.value || undefined });

		if (searchState.isActive()) {
			debouncedSearch.search(searchState.toSearchParams());
		}
	}

	/**
	 * Handle date range to change
	 */
	function handleDateToChange(event: Event): void {
		const target = event.target as HTMLInputElement;
		const currentRange = searchState.getDateRange();
		searchState.setDateRange({ ...currentRange, to: target.value || undefined });

		if (searchState.isActive()) {
			debouncedSearch.search(searchState.toSearchParams());
		}
	}

	/**
	 * Handle form submit (prevent default, trigger immediate search)
	 */
	function handleSubmit(event: Event): void {
		event.preventDefault();

		const validation = validateSearchInput(queryInput);
		validationError = validation.valid ? undefined : validation.error;

		if (validation.valid) {
			searchState.setQuery(queryInput);
			debouncedSearch.cancel();
			onSearch(searchState.toSearchParams());
		}
	}

	/**
	 * Reset all search state and input
	 */
	function handleReset(): void {
		searchState.reset();
		queryInput = "";
		validationError = undefined;
		debouncedSearch.cancel();
		onSearch({});
	}

	/**
	 * Toggle filter panel visibility
	 */
	function toggleFilters(): void {
		showFilters = !showFilters;
	}

	// Cleanup debounce on unmount
	onMount(() => {
		return () => {
			debouncedSearch.cancel();
		};
	});
</script>

<div class="search-bar {className}">
	<!-- Search input form -->
	<form class="relative" onsubmit={handleSubmit}>
		<label for="message-search" class="sr-only">Berichten zoeken</label>
		<div class="relative">
			<!-- Search icon -->
			<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<svg
					class="h-4 w-4 text-gray-400 dark:text-gray-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>

			<input
				id="message-search"
				type="search"
				class="form-input w-full pl-10 pr-20 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 text-sm"
				placeholder="Zoek berichten…"
				bind:value={queryInput}
				oninput={handleQueryInput}
				aria-label="Zoek berichten"
				aria-invalid={validationError ? "true" : undefined}
				aria-describedby={validationError ? "search-error" : undefined}
			/>

			<!-- Action buttons in input -->
			<div class="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
				{#if searchState.isActive()}
					<button
						type="button"
						class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
						onclick={handleReset}
						aria-label="Zoekopdracht wissen"
						title="Wis zoekopdracht"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}

				<button
					type="button"
					class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
					onclick={toggleFilters}
					aria-label="Filters tonen/verbergen"
					aria-expanded={showFilters}
					title="Filters"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Validation error message -->
		{#if validationError}
			<p id="search-error" class="mt-1 text-xs text-red-500 dark:text-red-400" role="alert">
				{validationError}
			</p>
		{/if}
	</form>

	<!-- Filter panel (collapsible) -->
	{#if showFilters}
		<div class="mt-3 space-y-3 border-t border-gray-200 dark:border-gray-700/60 pt-3">
			<!-- Message type filter -->
			<div>
				<label for="message-type-filter" class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
					Berichttype
				</label>
				<select
					id="message-type-filter"
					class="form-input w-full text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60"
				 onchange={handleTypeChange}
				>
					{#each typeOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>

			{#if showDateRange}
				<!-- Date range filter -->
				<div class="grid grid-cols-2 gap-2">
					<div>
						<label for="date-from" class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
							Van
						</label>
						<input
							id="date-from"
							type="date"
							class="form-input w-full text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60"
							onchange={handleDateFromChange}
						/>
					</div>
					<div>
						<label for="date-to" class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
							Tot
						</label>
						<input
							id="date-to"
							type="date"
							class="form-input w-full text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60"
							onchange={handleDateToChange}
						/>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
