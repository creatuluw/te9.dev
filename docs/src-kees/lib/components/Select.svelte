<script lang="ts">
	import { onMount } from 'svelte';
	import { Check } from 'lucide-svelte';

	/**
	 * Select option interface
	 * 
	 * @example
	 * ```typescript
	 * const option: SelectOption = {
	 *   value: 'option1',
	 *   label: 'Option 1',
	 *   disabled: false
	 * };
	 * ```
	 */
	export interface SelectOption {
		/**
		 * Option value (empty string represents null/cleared selection)
		 */
		value: string;
		
		/**
		 * Display label for the option
		 */
		label: string;
		
		/**
		 * Whether the option is disabled
		 * @default false
		 */
		disabled?: boolean;
	}

	/**
	 * Select component props
	 */
	interface Props {
		/**
		 * Array of select options
		 * @example
		 * ```typescript
		 * <Select options={[
		 *   { value: '1', label: 'Option 1' },
		 *   { value: '2', label: 'Option 2' }
		 * ]} />
		 * ```
		 */
		options: SelectOption[];

		/**
		 * Selected value (null or empty string for no selection)
		 * Used in single-select mode
		 * @default null
		 */
		value?: string | null;

		/**
		 * Selected values array (for multi-select mode)
		 * Used when multiple={true}
		 * @default []
		 */
		selectedValues?: string[];

		/**
		 * Enable multi-select mode
		 * @default false
		 */
		multiple?: boolean;

		/**
		 * Placeholder text when no option is selected
		 * @default 'Selecteer een optie...'
		 */
		placeholder?: string;

		/**
		 * Disable the select
		 * @default false
		 */
		disabled?: boolean;

		/**
		 * Show loading state
		 * @default false
		 */
		loading?: boolean;

		/**
		 * Whether the select is actively filtering (shows orange border)
		 * @default false
		 */
		isActive?: boolean;

		/**
		 * Enable search/filter functionality by typing
		 * @default false
		 */
		searchable?: boolean;

		/**
		 * Additional CSS classes
		 */
		class?: string;

		/**
		 * Whether the dropdown is open (bindable, for parent container z-index management)
		 */
		open?: boolean;

		/**
		 * Force dropdown to open above the button instead of below
		 * @default false
		 */
		openAbove?: boolean;

		/**
		 * Change event handler
		 * @param value - Selected value (null if cleared) for single-select, or array of values for multi-select
		 * @example
		 * ```typescript
		 * <Select 
		 *   options={options}
		 *   onchange={(value) => console.log('Selected:', value)}
		 * />
		 * ```
		 */
		onchange?: (value: string | null | string[]) => void;
	}

	let {
		options,
		value: selectedValue = $bindable(),
		selectedValues: selectedValuesProp = $bindable([]),
		multiple = false,
		placeholder = 'Selecteer een optie...',
		disabled = false,
		loading = false,
		isActive = false,
		searchable = false,
		class: className = '',
		open: isOpenProp = $bindable(false),
		openAbove = false,
		onchange
	}: Props = $props();

	let isOpen = $state(false);
	
	// Sync internal state with prop
	$effect(() => {
		isOpen = isOpenProp;
	});
	
	// Update prop when internal state changes
	$effect(() => {
		isOpenProp = isOpen;
	});
	let buttonElement: HTMLButtonElement;
	let dropdownElement = $state<HTMLDivElement | undefined>(undefined);
	let focusedIndex = $state(-1);
	let searchQuery = $state('');
	let dropdownPosition = $state<'bottom' | 'top'>('bottom');

	const selectedOption = $derived.by(() => {
		if (multiple) return null;
		if (!selectedValue || !Array.isArray(options)) return null;
		return options.find((opt) => opt.value === selectedValue) || null;
	});

	// Filter options based on search query
	const filteredOptions = $derived.by(() => {
		if (!Array.isArray(options)) return [];
		if (!searchable || !searchQuery.trim()) return options;
		const query = searchQuery.toLowerCase().trim();
		return options.filter((opt) => 
			opt.label.toLowerCase().includes(query) ||
			opt.value.toLowerCase().includes(query)
		);
	});

	const displayText = $derived.by(() => {
		if (loading) return 'Loading...';
		// When searchable and open, show search query if typing
		if (searchable && isOpen && searchQuery) {
			return searchQuery;
		}
		if (multiple) {
			if (selectedValuesProp.length === 0) return placeholder;
			if (selectedValuesProp.length === 1) {
				const opt = options.find((o) => o.value === selectedValuesProp[0]);
				return opt?.label || placeholder;
			}
			return `${selectedValuesProp.length} geselecteerd`;
		}
		if (selectedOption) return selectedOption.label;
		return placeholder;
	});

	const isSelected = (optionValue: string): boolean => {
		if (multiple) {
			return selectedValuesProp.includes(optionValue);
		}
		return selectedValue === optionValue || (selectedValue === null && optionValue === '');
	};

	function calculateDropdownPosition() {
		if (typeof window === 'undefined' || !buttonElement) return;

		// Force top position if openAbove prop is set
		if (openAbove) {
			dropdownPosition = 'top';
			return;
		}

		const rect = buttonElement.getBoundingClientRect();
		const spaceBelow = window.innerHeight - rect.bottom;
		const spaceAbove = rect.top;
		const estimatedDropdownHeight = 240; // max-h-60 = 240px

		// Find the parent container with relative positioning
		const parentContainer = buttonElement.closest('.relative');
		if (!parentContainer) {
			dropdownPosition = 'bottom';
			return;
		}

		// Get all sibling elements in the same parent (for grid layouts)
		const parent = parentContainer.parentElement;
		if (parent) {
			const siblings = Array.from(parent.children);
			const currentIndex = siblings.indexOf(parentContainer);

			// Check next sibling elements (could be in same row or next row in grid)
			for (let i = currentIndex + 1; i < siblings.length; i++) {
				const sibling = siblings[i] as HTMLElement;
				if (!sibling) continue;

				const siblingRect = sibling.getBoundingClientRect();
				// Check if sibling is below the current button
				if (siblingRect.top > rect.bottom) {
					const distance = siblingRect.top - rect.bottom;
					// Check if sibling is in a similar horizontal position (within 300px to account for grid columns)
					const horizontalOverlap = Math.abs((siblingRect.left + siblingRect.width / 2) - (rect.left + rect.width / 2));

					// If sibling is close below and would be overlapped, position above
					if (horizontalOverlap < 300 && distance < estimatedDropdownHeight) {
						// Only position above if there's more space above than below
						if (spaceAbove > spaceBelow) {
							dropdownPosition = 'top';
							return;
						}
					}
					// If we found a sibling below, stop checking (grid layout means we only need to check immediate next)
					break;
				}
			}
		}

		// If not enough space below but enough space above, position above
		if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
			dropdownPosition = 'top';
		} else {
			dropdownPosition = 'bottom';
		}
	}

	function handleButtonClick() {
		if (disabled || loading) return;
		isOpen = !isOpen;
		if (isOpen) {
			// Calculate position before opening
			calculateDropdownPosition();
			
			// Reset search query when opening
			searchQuery = '';
			// Keep focus on button for typing when searchable
			if (searchable) {
				setTimeout(() => buttonElement?.focus(), 0);
			}
			// Set focus to the currently selected option
			if (!Array.isArray(options)) {
				isOpen = false;
				return;
			}
			if (multiple) {
				// For multi-select, focus on first option or first selected
				if (selectedValuesProp.length > 0) {
					const firstSelectedIdx = filteredOptions.findIndex((opt) => selectedValuesProp.includes(opt.value));
					focusedIndex = firstSelectedIdx >= 0 ? firstSelectedIdx : 0;
				} else {
					focusedIndex = 0;
				}
			} else {
				const selectedIdx = selectedValue
					? filteredOptions.findIndex((opt) => opt.value === selectedValue)
					: -1;
				focusedIndex = selectedIdx >= 0 ? selectedIdx : 0;
			}
		} else {
			searchQuery = '';
		}
	}

	function handleOptionClick(option: SelectOption) {
		if (option.disabled) return;
		
		if (multiple) {
			// Toggle selection in multi-select mode
			const optionValue = option.value;
			if (optionValue === '') {
				// Clear all selections
				selectedValuesProp = [];
			} else {
				// Toggle this option
				if (selectedValuesProp.includes(optionValue)) {
					selectedValuesProp = selectedValuesProp.filter(v => v !== optionValue);
				} else {
					selectedValuesProp = [...selectedValuesProp, optionValue];
				}
			}
			// Keep dropdown open for multi-select
			// isOpen = false;
			if (onchange) {
				onchange([...selectedValuesProp]);
			}
		} else {
			// Single select mode
			const newValue = option.value === '' ? null : option.value;
			selectedValue = newValue;
			isOpen = false;
			focusedIndex = -1;
			searchQuery = '';
			if (onchange) {
				onchange(newValue);
			}
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (disabled || loading) return;

		// If searchable and dropdown is open, handle typing for search
		if (isOpen && searchable) {
			// Handle printable characters for search
			if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
				// Add character to search query
				searchQuery += event.key;
				// Reset focus to first option when search changes
				if (filteredOptions.length > 0) {
					focusedIndex = 0;
				} else {
					focusedIndex = -1;
				}
				scrollToFocused();
				return;
			}
			
			// Handle Backspace
			if (event.key === 'Backspace') {
				searchQuery = searchQuery.slice(0, -1);
				// Reset focus to first option when search changes
				if (filteredOptions.length > 0) {
					focusedIndex = 0;
				} else {
					focusedIndex = -1;
				}
				scrollToFocused();
				return;
			}
		}

		switch (event.key) {
			case 'Enter':
			case ' ':
				if (!isOpen) {
					event.preventDefault();
					handleButtonClick();
				} else {
					event.preventDefault();
					if (filteredOptions.length > 0 && focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
						handleOptionClick(filteredOptions[focusedIndex]);
					}
				}
				break;
			case 'ArrowDown':
				event.preventDefault();
				if (!isOpen) {
					handleButtonClick();
				} else if (filteredOptions.length > 0) {
					focusedIndex = Math.min(focusedIndex + 1, filteredOptions.length - 1);
					scrollToFocused();
				}
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (isOpen && filteredOptions.length > 0) {
					focusedIndex = Math.max(focusedIndex - 1, 0);
					scrollToFocused();
				}
				break;
			case 'Escape':
				if (isOpen) {
					event.preventDefault();
					isOpen = false;
					focusedIndex = -1;
					searchQuery = '';
					buttonElement?.focus();
				}
				break;
			case 'Home':
				if (isOpen && filteredOptions.length > 0) {
					event.preventDefault();
					focusedIndex = 0;
					scrollToFocused();
				}
				break;
			case 'End':
				if (isOpen && filteredOptions.length > 0) {
					event.preventDefault();
					focusedIndex = filteredOptions.length - 1;
					scrollToFocused();
				}
				break;
		}
	}

	function scrollToFocused() {
		if (focusedIndex >= 0 && dropdownElement !== undefined && dropdownElement) {
			const item = dropdownElement.children[focusedIndex] as HTMLElement;
			if (item) {
				item.scrollIntoView({ block: 'nearest' });
			}
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (
			isOpen &&
			buttonElement &&
			dropdownElement !== undefined &&
			dropdownElement &&
			!buttonElement.contains(event.target as Node) &&
			!dropdownElement.contains(event.target as Node)
		) {
			isOpen = false;
			focusedIndex = -1;
			searchQuery = '';
		}
	}

	// Close dropdown when clicking outside or on escape (for multi-select)
	function closeDropdown() {
		if (isOpen) {
			isOpen = false;
			focusedIndex = -1;
			buttonElement?.focus();
		}
	}

	// Recalculate position when window resizes or scrolls
	function handleResizeOrScroll() {
		if (isOpen) {
			calculateDropdownPosition();
		}
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			document.addEventListener('mousedown', handleClickOutside);
			window.addEventListener('resize', handleResizeOrScroll);
			window.addEventListener('scroll', handleResizeOrScroll, true);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
				window.removeEventListener('resize', handleResizeOrScroll);
				window.removeEventListener('scroll', handleResizeOrScroll, true);
			};
		}
	});
</script>

<div class="relative {className} {isOpen ? 'z-[200]' : ''}">
	<button
		bind:this={buttonElement}
		type="button"
		onclick={handleButtonClick}
		onkeydown={handleKeydown}
		disabled={disabled || loading}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		aria-disabled={disabled || loading}
		class="grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 outline-1 -outline-offset-1 {isActive ? 'outline-orange-500' : 'outline-gray-300'} focus-visible:outline-2 focus-visible:-outline-offset-2 {isActive ? 'focus-visible:outline-orange-600' : 'focus-visible:outline-indigo-600'} sm:text-sm/6 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
	>
		<span class="col-start-1 row-start-1 flex items-center gap-3 pr-6">
			<span class="block truncate">{displayText}</span>
		</span>
		<svg
			viewBox="0 0 16 16"
			fill="currentColor"
			aria-hidden="true"
			class="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4"
		>
			<path
				d="M5.22 10.22a.75.75 0 0 1 1.06 0L8 11.94l1.72-1.72a.75.75 0 1 1 1.06 1.06l-2.25 2.25a.75.75 0 0 1-1.06 0l-2.25-2.25a.75.75 0 0 1 0-1.06ZM10.78 5.78a.75.75 0 0 1-1.06 0L8 4.06 6.28 5.78a.75.75 0 0 1-1.06-1.06l2.25-2.25a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06Z"
				clip-rule="evenodd"
				fill-rule="evenodd"
			/>
		</svg>
	</button>

	{#if isOpen && !disabled && !loading}
		<div
			bind:this={dropdownElement}
			role="listbox"
			class="absolute z-[9999] w-full max-h-60 overflow-y-auto overflow-x-hidden rounded-md bg-white py-1 px-1 text-base shadow-lg outline-1 outline-black/5 sm:text-sm {dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}"
		>
			{#if filteredOptions.length === 0}
				<div class="px-3 py-2 text-sm text-gray-500 text-center">
					Geen resultaten gevonden
				</div>
			{:else}
				{#each filteredOptions as option, index (option.value)}
					<button
						type="button"
						role="option"
						aria-selected={isSelected(option.value)}
						disabled={option.disabled}
						onclick={() => handleOptionClick(option)}
						onmouseenter={() => (focusedIndex = index)}
						class="group/option relative block w-full cursor-default py-2 pr-9 pl-3 text-left text-gray-900 select-none rounded-md focus:bg-gray-100 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed {index ===
						focusedIndex
							? 'bg-gray-100'
							: ''} {isSelected(option.value)
							? 'font-semibold'
							: 'font-normal'}"
					>
						<span class="block truncate">{option.label}</span>
						{#if isSelected(option.value)}
							<span
								class="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600"
							>
								<Check class="size-5" aria-hidden="true" />
							</span>
						{/if}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>
