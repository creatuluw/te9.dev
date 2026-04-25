<script lang="ts">
	import DatePicker from './DatePicker.svelte';
	import { X } from 'lucide-svelte';

	/**
	 * DateRangePicker component props
	 * 
	 * Date range picker with from/to dates. Validates that 'to' date is after 'from' date.
	 */
	interface Props {
		/**
		 * Start date in YYYY-MM-DD format
		 * @default null
		 */
		fromDate?: string | null;
		
		/**
		 * End date in YYYY-MM-DD format
		 * @default null
		 */
		toDate?: string | null;
		
		/**
		 * Placeholder text for from date
		 * @default 'Van datum'
		 */
		fromPlaceholder?: string;
		
		/**
		 * Placeholder text for to date
		 * @default 'Tot datum'
		 */
		toPlaceholder?: string;
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
		
		/**
		 * Change event handler - called when either date changes
		 * @param fromDate - Start date in YYYY-MM-DD format (null if cleared)
		 * @param toDate - End date in YYYY-MM-DD format (null if cleared)
		 */
		onchange?: (fromDate: string | null, toDate: string | null) => void;

		/**
		 * Whether the filter is currently active
		 * @default false
		 */
		isActive?: boolean;
		
		/**
		 * Whether any date picker is open (bindable, for parent container z-index management)
		 */
		open?: boolean;
	}

	let {
		fromDate = $bindable<string | null>(null),
		toDate = $bindable<string | null>(null),
		fromPlaceholder = 'Van datum',
		toPlaceholder = 'Tot datum',
		class: className = '',
		onchange,
		isActive = false,
		open: isOpenProp = $bindable(false)
	}: Props = $props();
	
	let fromDatePickerOpen = $state(false);
	let toDatePickerOpen = $state(false);
	
	// Update prop when either date picker opens/closes
	$effect(() => {
		isOpenProp = fromDatePickerOpen || toDatePickerOpen;
	});

	function handleFromDateChange(value: string | null) {
		fromDate = value;
		
		// If 'to' date is set and is before 'from' date, clear it
		if (fromDate && toDate && new Date(toDate) < new Date(fromDate)) {
			toDate = null;
		}
		
		if (onchange) {
			onchange(fromDate, toDate);
		}
	}

	function handleToDateChange(value: string | null) {
		toDate = value;
		
		// If 'from' date is set and is after 'to' date, clear it
		if (toDate && fromDate && new Date(fromDate) > new Date(toDate)) {
			fromDate = null;
		}
		
		if (onchange) {
			onchange(fromDate, toDate);
		}
	}

	function handleClear() {
		fromDate = null;
		toDate = null;
		if (onchange) {
			onchange(null, null);
		}
	}

	const hasDateRange = $derived(fromDate !== null || toDate !== null);
</script>

<div class="relative flex items-center gap-2 {className}">
	<div class="flex-1">
		<DatePicker
			bind:value={fromDate}
			placeholder={fromPlaceholder}
			max={toDate ?? undefined}
			onchange={handleFromDateChange}
			bind:open={fromDatePickerOpen}
		/>
	</div>
	
	<span class="text-zinc-400 text-sm">-</span>
	
	<div class="flex-1">
		<DatePicker
			bind:value={toDate}
			placeholder={toPlaceholder}
			min={fromDate ?? undefined}
			onchange={handleToDateChange}
			bind:open={toDatePickerOpen}
		/>
	</div>

	{#if hasDateRange}
		<button
			type="button"
			onclick={handleClear}
			class="absolute -right-2 -top-2 p-1 rounded-full bg-zinc-900 text-white hover:bg-zinc-700 transition-colors z-10"
			aria-label="Clear date range"
			title="Clear date range"
		>
			<X size={14} />
		</button>
	{/if}
</div>

