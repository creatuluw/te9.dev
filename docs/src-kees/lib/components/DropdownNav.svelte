<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { ComponentType } from 'svelte';
	import Tooltip from './Tooltip.svelte';

	/**
	 * Dropdown navigation item interface
	 * 
	 * @example
	 * ```typescript
	 * const item: DropdownNavItem = {
	 *   label: 'Settings',
	 *   href: '/settings',
	 *   disabled: false
	 * };
	 * ```
	 */
	export interface DropdownNavItem {
		/**
		 * Display label for the item
		 */
		label: string;
		
		/**
		 * URL path for navigation
		 */
		href: string;
		
		/**
		 * Whether the item is disabled
		 * @default false
		 */
		disabled?: boolean;
	}

	/**
	 * Dropdown position relative to trigger button
	 * - left: Left-aligned
	 * - right: Right-aligned
	 * - center: Center-aligned
	 */
	type DropdownPosition = 'left' | 'right' | 'center';

	/**
	 * DropdownNav component props
	 *
	 * Dropdown navigation menu component with fly transition animation.
	 */
	interface Props {
		/**
		 * Button label text (optional if icon is provided)
		 */
		label?: string;

		/**
		 * Optional icon component to display instead of label
		 */
		icon?: ComponentType;

		/**
		 * Array of navigation items to display in dropdown
		 * @example
		 * ```typescript
		 * <DropdownNav
		 *   label="Menu"
		 *   items={[
		 *     { label: 'Home', href: '/' },
		 *     { label: 'Settings', href: '/settings' }
		 *   ]}
		 * />
		 * ```
		 */
		items: DropdownNavItem[];

		/**
		 * Dropdown position alignment
		 * @default 'left'
		 */
		position?: DropdownPosition;

		/**
		 * Whether dropdown is open (bindable)
		 * @default false
		 */
		open?: boolean;

		/**
		 * Whether to show border when using icon (only applies when icon is provided)
		 * @default true
		 */
		showBorder?: boolean;

		/**
		 * Additional CSS classes
		 */
		class?: string;

		/**
		 * Tooltip text (enables tooltip wrapper)
		 */
		tooltip?: string;

		/**
		 * Tooltip position
		 * @default 'top'
		 */
		tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';

		/**
		 * Callback fired when dropdown closes
		 */
		onclose?: () => void;

		/**
		 * Callback fired when an item is clicked
		 * @param item - The clicked item
		 * @example
		 * ```typescript
		 * <DropdownNav
		 *   onitemclick={(item) => {
		 *     console.log('Clicked:', item.href);
		 *   }}
		 * />
		 * ```
		 */
		onitemclick?: (item: DropdownNavItem) => void;

		/**
		 * Callback fired when main button is clicked (not dropdown items)
		 */
		onmainclick?: () => void;

		/**
		 * Whether dropdown opens on hover instead of click
		 * @default false
		 */
		hoverTrigger?: boolean;

		/**
		 * Whether to hide dropdown arrow
		 * @default false
		 */
		hideArrow?: boolean;

		/**
		 * Whether the button is in active state
		 * @default false
		 */
		isActive?: boolean;
	}

	let {
		label,
		icon: Icon,
		items,
		position = 'left',
		open: isOpen = $bindable(false),
		showBorder = true,
		class: className = '',
		tooltip,
		tooltipPosition = 'top',
		onclose,
		onitemclick,
		onmainclick,
		hoverTrigger = false,
		hideArrow = false,
		isActive = false
	}: Props = $props();

	let buttonElement = $state<HTMLButtonElement | undefined>(undefined);
	let dropdownElement = $state<HTMLDivElement | undefined>(undefined);
	let closeTimeout = $state<number | undefined>(undefined);

	function toggle(event: MouseEvent) {
		event.stopPropagation();
		if (hoverTrigger) {
			onmainclick?.();
		} else {
			isOpen = !isOpen;
			if (!isOpen) {
				onclose?.();
			}
		}
	}

	function handleMouseEnter() {
		if (hoverTrigger) {
			if (closeTimeout !== undefined) {
				clearTimeout(closeTimeout);
				closeTimeout = undefined;
			}
			isOpen = true;
		}
	}

	function handleMouseLeave() {
		if (hoverTrigger) {
			closeTimeout = window.setTimeout(() => {
				isOpen = false;
				onclose?.();
				closeTimeout = undefined;
			}, 100);
		}
	}

	function handleDropdownMouseEnter() {
		if (hoverTrigger && closeTimeout !== undefined) {
			clearTimeout(closeTimeout);
			closeTimeout = undefined;
		}
	}

	function handleDropdownMouseLeave() {
		if (hoverTrigger) {
			closeTimeout = window.setTimeout(() => {
				isOpen = false;
				onclose?.();
				closeTimeout = undefined;
			}, 100);
		}
	}

	onDestroy(() => {
		if (closeTimeout !== undefined) {
			clearTimeout(closeTimeout);
		}
	});

	const buttonClasses = $derived.by(() => {
		if (Icon) {
			return `inline-flex items-center justify-center rounded transition-colors p-2 ${showBorder ? 'border border-zinc-200 shadow-xs' : ''} ${isOpen ? 'text-zinc-500' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'} cursor-pointer`;
		}

		const baseClasses = 'inline-flex items-center transition';

		return `${baseClasses} gap-x-1 text-sm font-medium px-3 lg:px-5 py-2 rounded-md ${isActive ? 'text-zinc-900 bg-zinc-100' : 'text-zinc-500 hover:text-zinc-900'}`;
	});

	function handleItemClick(item: DropdownNavItem) {
		if (item.disabled) return;
		isOpen = false;
		onitemclick?.(item);
		onclose?.();
	}

	function handleClickOutside(event: MouseEvent) {
		if (
			isOpen &&
			buttonElement &&
			dropdownElement !== undefined &&
			dropdownElement &&
			event.target !== buttonElement &&
			!buttonElement.contains(event.target as Node) &&
			!dropdownElement.contains(event.target as Node)
		) {
			isOpen = false;
			onclose?.();
		}
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			isOpen = false;
			onclose?.();
		}
	}

	function getPositionClasses(position: DropdownPosition): string {
		const classes: Record<DropdownPosition, string> = {
			left: 'left-0',
			right: 'right-0',
			center: 'left-1/2 -translate-x-1/2'
		};
		return classes[position];
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleEscape);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		}
	});
</script>

<span class="relative inline-flex items-center {className}">
	{#if tooltip}
		<Tooltip text={tooltip} position={tooltipPosition}>
			<button
				bind:this={buttonElement}
				type="button"
				onclick={(e) => toggle(e)}
				onmouseenter={handleMouseEnter}
				onmouseleave={handleMouseLeave}
				class={buttonClasses + ' ' + className}
				aria-expanded={isOpen}
				aria-haspopup="true"
			>
				{#if Icon}
				<Icon size={18} />
			{:else if label}
					<span>{label}</span>
					{#if !hideArrow}
						<svg
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-hidden="true"
							class="w-5 h-5 transition-transform"
							class:rotate-180={isOpen}
						>
							<path
								d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
								clip-rule="evenodd"
								fill-rule="evenodd"
							/>
						</svg>
					{/if}
				{/if}
			</button>
		</Tooltip>
	{:else}
		<button
			bind:this={buttonElement}
			type="button"
			onclick={(e) => toggle(e)}
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
			class={buttonClasses + ' ' + className}
			aria-expanded={isOpen}
			aria-haspopup="true"
		>
			{#if Icon}
				<Icon size={18} />
			{:else if label}
				<span>{label}</span>
				{#if !hideArrow}
					<svg
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
						class="w-5 h-5 transition-transform"
						class:rotate-180={isOpen}
					>
						<path
							d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
							clip-rule="evenodd"
							fill-rule="evenodd"
						/>
					</svg>
				{/if}
			{/if}
		</button>
	{/if}

	{#if isOpen && items.length > 0}
		<div
			bind:this={dropdownElement}
			onmouseenter={handleDropdownMouseEnter}
			onmouseleave={handleDropdownMouseLeave}
			transition:fly={{ y: 8, duration: 200 }}
			class="absolute top-full {getPositionClasses(position)} mt-2 w-48 bg-white rounded-md shadow-lg border border-zinc-200 py-1 z-50"
			role="menu"
			aria-orientation="vertical"
		>
			{#each items as item, index (item.href + '-' + index)}
				{#if item.disabled}
					<span
						class="block px-4 py-2 text-xs text-zinc-400 cursor-not-allowed"
						role="menuitem"
						aria-disabled="true"
					>
						{item.label}
					</span>
				{:else}
					<a
						href={item.href}
						onclick={(e) => {
							e.preventDefault();
							handleItemClick(item);
						}}
						class="block w-full text-left px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-100 transition"
						role="menuitem"
					>
						{item.label}
					</a>
				{/if}
			{/each}
		</div>
	{/if}
</span>

