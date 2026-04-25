<script lang="ts">
	import { getISOWeek, getISOWeekYear } from '$lib/utils/dateUtils';
	import type { UnifiedBacklogItem } from '$lib/services/taskService';

	/**
	 * Weekly statistics for backlog items
	 */
	interface WeekStats {
		week: number;
		year: number;
		count: number;
		hours: number;
		weekLabel: string;
		dateRange: string;
	}

	/**
	 * BacklogWeeklyStats component props
	 * 
	 * Displays backlog item statistics for current and next 4 weeks (5 weeks total).
	 */
	interface Props {
		/**
		 * Backlog items to calculate statistics from
		 */
		items: UnifiedBacklogItem[];
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
		
		/**
		 * Array of selected week identifiers (format: "week-year")
		 */
		selectedWeeks?: string[];
		
		/**
		 * Callback when a week is clicked
		 */
		onweekselect?: (weekId: string) => void;
	}

	let { items, class: className = '', selectedWeeks = [], onweekselect }: Props = $props();

	/**
	 * Handle week selection
	 */
	function handleWeekClick(week: number, year: number) {
		if (onweekselect) {
			const weekId = `${week}-${year}`;
			onweekselect(weekId);
		}
	}

	/**
	 * Check if a week is selected
	 */
	function isWeekSelected(week: number, year: number): boolean {
		const weekId = `${week}-${year}`;
		return selectedWeeks.includes(weekId);
	}

	/**
	 * Get the date range for a given ISO week
	 */
	function getWeekDateRange(week: number, year: number): string {
		// Find a date that belongs to this week
		// Start from January 1st of the year and iterate until we find the week
		let date = new Date(year, 0, 1);
		
		// Find the first day of the target week
		while (getISOWeek(date) !== week || getISOWeekYear(date) !== year) {
			date.setDate(date.getDate() + 1);
			// Safety check: don't loop forever
			if (date.getFullYear() > year + 1) break;
		}
		
		// Get Monday of this week
		const day = date.getDay();
		const diff = date.getDate() - day + (day === 0 ? -6 : 1);
		const monday = new Date(date);
		monday.setDate(diff);
		
		// Get Sunday (6 days after Monday)
		const sunday = new Date(monday);
		sunday.setDate(monday.getDate() + 6);
		
		// Format dates
		const formatDate = (d: Date) => {
			const day = d.getDate();
			const month = d.toLocaleDateString('nl-NL', { month: 'short' });
			return `${day} ${month}`;
		};
		
		return `${formatDate(monday)} - ${formatDate(sunday)}`;
	}

	/**
	 * Calculate weekly statistics from backlog items
	 */
	const weeklyStats = $derived.by((): WeekStats[] => {
		const now = new Date();
		const currentWeek = getISOWeek(now);
		const currentYear = getISOWeekYear(now);
		
		// Initialize 5 weeks (current + next 4)
		const weeks: WeekStats[] = [];
		let week = currentWeek;
		let year = currentYear;
		
		for (let i = 0; i < 5; i++) {
			// Determine label (Deze week for first, Week X for others)
			const weekLabel = i === 0 ? 'Deze week' : `Week ${week}`;
			const dateRange = getWeekDateRange(week, year);
			
			weeks.push({
				week,
				year,
				count: 0,
				hours: 0,
				weekLabel,
				dateRange
			});
			
			// Calculate next week (handle year transition)
			week++;
			// ISO week numbering: weeks are 1-52/53
			const maxWeeksInYear = getISOWeek(new Date(year, 11, 28)); // Dec 28 is always in last week of year
			if (week > maxWeeksInYear) {
				week = 1;
				year++;
			}
		}
		
		// Count items and hours for each week (only items with kanban_status 'backlog')
		for (const item of items) {
			// Debug: log kanban_status values
			if (import.meta.env.DEV) {
				console.log('Item:', item.subject, 'kanban_status:', item.kanban_status, 'status:', item.status);
			}
			
			// Only count items with kanban_status explicitly set to 'backlog'
			if (item.kanban_status !== 'backlog') continue;
			
			// Get deadline from either deadline or due_date field
			const deadlineStr = item.deadline || item.due_date;
			
			// Skip items without deadline
			if (!deadlineStr) continue;
			
			const itemDate = new Date(deadlineStr);
			const itemWeek = getISOWeek(itemDate);
			const itemYear = getISOWeekYear(itemDate);
			
			// Find matching week
			const weekStat = weeks.find(w => w.week === itemWeek && w.year === itemYear);
			if (weekStat) {
				weekStat.count++;
				weekStat.hours += item.uren || 0;
			}
		}
		
		return weeks;
	});
</script>

{#if items.length > 0}
	<div class="flex items-center gap-4 w-full {className}">
		{#each weeklyStats as stat, index (stat.week + '-' + stat.year)}
			{@const selected = isWeekSelected(stat.week, stat.year)}
			<button
				type="button"
				class="flex-1 relative group"
				onclick={() => handleWeekClick(stat.week, stat.year)}
			>
				<div class="w-full rounded-lg border px-4 py-2 transition-all {
					selected 
						? 'bg-zinc-800 border-zinc-800 hover:bg-zinc-700 hover:border-zinc-700' 
						: 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/50'
				}">
					<div class="flex items-baseline gap-2 justify-center">
						<span class="text-xs font-semibold font-aspekta {
							selected ? 'text-zinc-100' : 'text-zinc-700'
						}">{stat.weekLabel}:</span>
						<span class="text-sm font-inter tabular-nums {
							selected ? 'text-zinc-50' : 'text-zinc-900'
						}">{stat.count} ({stat.hours}u)</span>
					</div>
				</div>
				<!-- Custom tooltip -->
				<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-zinc-100 bg-zinc-900 rounded shadow-sm pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[9999]">
					{stat.dateRange}
					<div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-t-zinc-900 border-x-transparent border-b-transparent"></div>
				</div>
			</button>
		{/each}
	</div>
{/if}

