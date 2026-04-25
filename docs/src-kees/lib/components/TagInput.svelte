<script lang="ts">
	import { onMount } from 'svelte';
	import * as tagService from '$lib/services/tagService';
	import { X } from 'lucide-svelte';

	/**
	 * TagInput component props
	 * 
	 * Multi-tag input with autocomplete suggestions from existing tags.
	 * Inspired by svelte-tags-input component.
	 */
	interface Props {
		/**
		 * Array of selected tags (bindable)
		 * @default []
		 */
		tags?: string[];

		/**
		 * Placeholder text
		 * @default 'Voeg tags toe...'
		 */
		placeholder?: string;

		/**
		 * Disable the input
		 * @default false
		 */
		disabled?: boolean;

		/**
		 * Readonly mode
		 * @default false
		 */
		readonly?: boolean;

		/**
		 * Maximum number of tags allowed
		 * @default undefined (no limit)
		 */
		maxTags?: number;

		/**
		 * Only allow unique tags (prevent duplicates)
		 * @default true
		 */
		onlyUnique?: boolean;

		/**
		 * Allow pasting tags
		 * @default true
		 */
		allowPaste?: boolean;

		/**
		 * Character(s) to split pasted text into multiple tags
		 * @default ','
		 */
		splitWith?: string;

		/**
		 * Minimum characters before showing autocomplete
		 * @default 0
		 */
		minChars?: number;

		/**
		 * Only allow tags from autocomplete list
		 * @default false
		 */
		onlyAutocomplete?: boolean;

		/**
		 * Keys that add a tag (key codes)
		 * @default [13] (Enter)
		 */
		addKeys?: number[];

		/**
		 * Keys that remove a tag (key codes)
		 * @default [8] (Backspace)
		 */
		removeKeys?: number[];

		/**
		 * Allow blur behavior
		 * @default true
		 */
		allowBlur?: boolean;

		/**
		 * Label text to display above input
		 */
		labelText?: string;

		/**
		 * Show label
		 * @default false
		 */
		labelShow?: boolean;

		/**
		 * Additional CSS classes
		 */
		class?: string;

		/**
		 * Input name attribute
		 */
		name?: string;

		/**
		 * Input id attribute
		 */
		id?: string;

		/**
		 * Change event handler
		 * @param tags - Current tags array
		 */
		onchange?: (tags: string[]) => void;

		/**
		 * Tag click handler
		 * @param tag - Clicked tag string
		 */
		onTagClick?: (tag: string) => void;
	}

	let {
		tags = $bindable<string[]>([]),
		placeholder = 'Voeg tags toe...',
		disabled = false,
		readonly = false,
		maxTags,
		onlyUnique = true,
		allowPaste = true,
		splitWith = ',',
		minChars = 0,
		onlyAutocomplete = false,
		addKeys = [13], // Enter
		removeKeys = [8], // Backspace
		allowBlur = true,
		labelText,
		labelShow = false,
		class: className = '',
		name,
		id,
		onchange,
		onTagClick
	}: Props = $props();

	let inputValue = $state('');
	let showSuggestions = $state(false);
	let suggestions = $state<string[]>([]);
	let focusedIndex = $state(-1);
	let inputElement = $state<HTMLInputElement | undefined>(undefined);
	let suggestionsElement = $state<HTMLDivElement | undefined>(undefined);
	let loading = $state(false);
	let isFocused = $state(false);

	const filteredSuggestions = $derived.by(() => {
		if (!showSuggestions) {
			return [];
		}

		// Don't show suggestions if input is shorter than minChars
		if (inputValue.trim().length < minChars) {
			return [];
		}

		if (!inputValue.trim()) {
			return suggestions.slice(0, 5);
		}

		const query = inputValue.toLowerCase().trim();
		const filtered = suggestions.filter(
			(tag) =>
				tag.toLowerCase().includes(query) &&
				(!onlyUnique || !tags.includes(tag)) // Don't suggest already selected tags if onlyUnique
		);

		return filtered.slice(0, 5);
	});

	async function loadSuggestions() {
		if (loading) return;
		loading = true;
		const result = await tagService.getAllTags();
		if (result.success) {
			suggestions = result.value;
		}
		loading = false;
	}

	onMount(() => {
		loadSuggestions();
	});

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		inputValue = target.value;
		
		if (inputValue.trim().length >= minChars) {
			showSuggestions = true;
			// Auto-search suggestions as user types
			searchSuggestions(inputValue);
		} else {
			showSuggestions = false;
		}
		focusedIndex = -1;
	}

	async function searchSuggestions(query: string) {
		if (!query.trim() || query.trim().length < minChars) {
			return;
		}
		loading = true;
		const result = await tagService.searchTags(query);
		if (result.success) {
			suggestions = result.value;
		}
		loading = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		const keyCode = event.keyCode || event.which;

		// Check if key is an add key
		if (addKeys.includes(keyCode)) {
			event.preventDefault();
			if (showSuggestions && filteredSuggestions.length > 0 && focusedIndex >= 0) {
				addTag(filteredSuggestions[focusedIndex]);
			} else if (inputValue.trim()) {
				addTag(inputValue.trim());
			}
			return;
		}

		// Check if key is a remove key
		if (removeKeys.includes(keyCode) && !inputValue && tags.length > 0) {
			event.preventDefault();
			removeTag(tags.length - 1);
			return;
		}

		// Handle arrow keys for navigation
		if (showSuggestions && filteredSuggestions.length > 0) {
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
				case 'Escape':
					event.preventDefault();
					showSuggestions = false;
					focusedIndex = -1;
					inputElement?.blur();
					break;
			}
		}
	}

	function handlePaste(event: ClipboardEvent) {
		if (!allowPaste || disabled || readonly) {
			return;
		}

		event.preventDefault();
		const pastedText = event.clipboardData?.getData('text') || '';
		
		if (!pastedText.trim()) {
			return;
		}

		// Split by splitWith character(s)
		const pastedTags = pastedText
			.split(splitWith)
			.map(tag => tag.trim())
			.filter(tag => tag.length > 0);

		// Add all valid tags
		for (const tag of pastedTags) {
			if (canAddTag(tag)) {
				addTagInternal(tag);
			}
		}

		inputValue = '';
		showSuggestions = false;
	}

	function handleFocus() {
		isFocused = true;
		if (inputValue.trim().length >= minChars && filteredSuggestions.length > 0) {
			showSuggestions = true;
		}
	}

	function handleBlur() {
		isFocused = false;
		if (!allowBlur) {
			return;
		}

		// Delay to allow click on suggestion
		setTimeout(() => {
			showSuggestions = false;
			focusedIndex = -1;
		}, 200);
	}

	function scrollToFocused() {
		if (focusedIndex >= 0 && suggestionsElement !== undefined && suggestionsElement) {
			const item = suggestionsElement.children[focusedIndex] as HTMLElement;
			if (item) {
				item.scrollIntoView({ block: 'nearest' });
			}
		}
	}

	function canAddTag(tag: string): boolean {
		const trimmed = tag.trim();
		
		if (!trimmed) {
			return false;
		}

		// Check max tags limit
		if (maxTags !== undefined && tags.length >= maxTags) {
			return false;
		}

		// Check uniqueness
		if (onlyUnique && tags.includes(trimmed)) {
			return false;
		}

		// Check if only autocomplete is allowed
		if (onlyAutocomplete && !suggestions.includes(trimmed)) {
			return false;
		}

		return true;
	}

	function addTagInternal(tag: string) {
		const trimmed = tag.trim();
		if (!canAddTag(trimmed)) {
			return;
		}

		tags = [...tags, trimmed];
		inputValue = '';
		showSuggestions = false;
		focusedIndex = -1;

		if (onchange) {
			onchange(tags);
		}
	}

	function addTag(tag: string) {
		addTagInternal(tag);
	}

	function removeTag(index: number) {
		if (disabled || readonly) {
			return;
		}
		tags = tags.filter((_, i) => i !== index);
		if (onchange) {
			onchange(tags);
		}
	}

	function selectSuggestion(tag: string) {
		addTag(tag);
		inputElement?.focus();
	}

	function handleTagClick(tag: string) {
		if (onTagClick && !disabled && !readonly) {
			onTagClick(tag);
		}
	}
</script>

<div class="space-y-2 {className}">
	<!-- Label -->
	{#if labelShow && labelText}
		<label for={id} class="block text-sm font-medium text-zinc-900 mb-1">
			{labelText}
		</label>
	{/if}

	<!-- Input container with inline tags -->
	<div
		class="flex flex-wrap items-center gap-1.5 w-full appearance-none rounded-sm bg-white py-2 px-3 text-sm text-zinc-900 outline-1 -outline-offset-1 outline-zinc-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-zinc-500 focus-within:ring-0 border border-zinc-300 disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed font-inter {isFocused
			? 'focus'
			: ''}"
	>
		<!-- Selected tags display (inline) -->
		{#each tags as tag, index (tag)}
			<div
				onclick={() => handleTagClick(tag)}
				class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors text-[0.8rem] {disabled || readonly
					? 'cursor-default'
					: 'cursor-pointer'}"
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleTagClick(tag);
					}
				}}
			>
				<span>{tag}</span>
				{#if !disabled && !readonly}
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							removeTag(index);
						}}
						class="hover:bg-orange-600 rounded-full p-0.5 transition-colors -mr-1"
						aria-label="Tag verwijderen"
					>
						<X size={12} class="text-white" />
					</button>
				{/if}
			</div>
		{/each}

		<!-- Input field -->
		<input
			bind:this={inputElement}
			type="text"
			value={inputValue}
			oninput={handleInput}
			onkeydown={handleKeydown}
			onpaste={handlePaste}
			onfocus={handleFocus}
			onblur={handleBlur}
			{placeholder}
			{disabled}
			{readonly}
			{name}
			{id}
			class="svelte-tags-input-field flex-1 min-w-[120px] bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 p-0 text-sm text-zinc-900 placeholder:text-zinc-400 disabled:cursor-not-allowed"
		/>
	</div>

	<!-- Suggestions dropdown -->
	{#if showSuggestions && filteredSuggestions.length > 0}
		<div
			bind:this={suggestionsElement}
			class="relative z-50 w-full mt-1 bg-white border border-zinc-300 rounded-sm shadow-sm max-h-60 overflow-auto"
		>
			{#each filteredSuggestions as suggestion, index (suggestion)}
				<button
					type="button"
					onclick={() => selectSuggestion(suggestion)}
					class="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 transition-colors {index ===
					focusedIndex
						? 'bg-zinc-100'
						: ''}"
				>
					<span class="text-zinc-900">{suggestion}</span>
				</button>
			{/each}
		</div>
	{/if}

	{#if loading}
		<div class="text-xs text-zinc-500">Tags laden...</div>
	{/if}
</div>

<style>
	/* Prevent browser default focus styles on the input */
	:global(input.svelte-tags-input-field) {
		outline: none !important;
		box-shadow: none !important;
	}
	
	:global(input.svelte-tags-input-field:focus) {
		outline: none !important;
		box-shadow: none !important;
	}
	
	:global(input.svelte-tags-input-field:focus-visible) {
		outline: none !important;
		box-shadow: none !important;
	}
</style>
