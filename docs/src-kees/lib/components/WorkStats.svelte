<script lang="ts">
	import { onMount } from 'svelte';
	import { getCurrentUserId } from '$lib/utils/userUtils';
	import { getISOWeek, getISOWeekYear } from '$lib/utils/dateUtils';
	import * as taskService from '$lib/services/taskService';
	import type { UnifiedPlanningItem, UnifiedBacklogItem } from '$lib/services/taskService';
	import Label from './Label.svelte';
	import { goto } from '$app/navigation';

	/**
	 * Weekly statistics interface
	 */
	interface WeeklyStats {
		thisWeek: {
			open: number;
			completed: number;
			openHours: number;
			completedHours: number;
			backlog: number;
			backlogHours: number;
		};
		nextWeek: {
			open: number;
			completed: number;
			openHours: number;
			completedHours: number;
			backlog: number;
			backlogHours: number;
		};
	}

	/**
	 * WorkStats component props
	 * 
	 * Displays work statistics for current and next week.
	 */
	interface Props {
		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	const currentUserId = getCurrentUserId();
	let stats = $state<WeeklyStats>({
		thisWeek: {
			open: 0,
			completed: 0,
			openHours: 0,
			completedHours: 0,
			backlog: 0,
			backlogHours: 0
		},
		nextWeek: {
			open: 0,
			completed: 0,
			openHours: 0,
			completedHours: 0,
			backlog: 0,
			backlogHours: 0
		}
	});
	let loading = $state(false);

	/**
	 * Calculate weekly statistics from planning items
	 */
	function calculateWeeklyStats(items: (UnifiedPlanningItem | UnifiedBacklogItem)[]): WeeklyStats {
		const now = new Date();
		const currentWeek = getISOWeek(now);
		const currentYear = getISOWeekYear(now);
		
		// Calculate next week (handle year transition)
		let nextWeek = currentWeek + 1;
		let nextYear = currentYear;
		
		// ISO week numbering: weeks are 1-52/53
		const maxWeeksInYear = getISOWeek(new Date(currentYear, 11, 28)); // Dec 28 is always in last week of year
		if (nextWeek > maxWeeksInYear) {
			nextWeek = 1;
			nextYear = currentYear + 1;
		}

		const thisWeekOpen: (UnifiedPlanningItem | UnifiedBacklogItem)[] = [];
		const thisWeekCompleted: (UnifiedPlanningItem | UnifiedBacklogItem)[] = [];
		const thisWeekBacklog: (UnifiedPlanningItem | UnifiedBacklogItem)[] = [];
		const nextWeekOpen: (UnifiedPlanningItem | UnifiedBacklogItem)[] = [];
		const nextWeekCompleted: (UnifiedPlanningItem | UnifiedBacklogItem)[] = [];
		const nextWeekBacklog: (UnifiedPlanningItem | UnifiedBacklogItem)[] = [];

	// Categorize items by week and status
	for (const item of items) {
		// Get deadline from either deadline or due_date field
		const deadlineStr = item.deadline || item.due_date;
		
		// Skip items without deadline
		if (!deadlineStr) continue;

		const itemDate = new Date(deadlineStr);
		const itemWeek = getISOWeek(itemDate);
		const itemYear = getISOWeekYear(itemDate);

		const isCompleted = item.kanban_status === 'afgerond';
		const isBacklog = item.kanban_status === 'backlog';
		// Open items are those that are not in backlog and not completed
		// (gepland, mee_bezig, in_review)
		const isOpen = !isBacklog && !isCompleted;

		// Check if item belongs to this week
		if (itemWeek === currentWeek && itemYear === currentYear) {
			if (isCompleted) {
				thisWeekCompleted.push(item);
			} else if (isBacklog) {
				thisWeekBacklog.push(item);
			} else if (isOpen) {
				thisWeekOpen.push(item);
			}
		}

		// Check if item belongs to next week
		if (itemWeek === nextWeek && itemYear === nextYear) {
			if (isCompleted) {
				nextWeekCompleted.push(item);
			} else if (isBacklog) {
				nextWeekBacklog.push(item);
			} else if (isOpen) {
				nextWeekOpen.push(item);
			}
		}
	}

		// Calculate total hours for each category
		const thisWeekOpenHours = thisWeekOpen.reduce((sum, item) => sum + (item.uren || 0), 0);
		const thisWeekCompletedHours = thisWeekCompleted.reduce((sum, item) => sum + (item.uren || 0), 0);
		const thisWeekBacklogHours = thisWeekBacklog.reduce((sum, item) => sum + (item.uren || 0), 0);
		const nextWeekOpenHours = nextWeekOpen.reduce((sum, item) => sum + (item.uren || 0), 0);
		const nextWeekCompletedHours = nextWeekCompleted.reduce((sum, item) => sum + (item.uren || 0), 0);
		const nextWeekBacklogHours = nextWeekBacklog.reduce((sum, item) => sum + (item.uren || 0), 0);

		return {
			thisWeek: {
				open: thisWeekOpen.length,
				completed: thisWeekCompleted.length,
				openHours: thisWeekOpenHours,
				completedHours: thisWeekCompletedHours,
				backlog: thisWeekBacklog.length,
				backlogHours: thisWeekBacklogHours
			},
			nextWeek: {
				open: nextWeekOpen.length,
				completed: nextWeekCompleted.length,
				openHours: nextWeekOpenHours,
				completedHours: nextWeekCompletedHours,
				backlog: nextWeekBacklog.length,
				backlogHours: nextWeekBacklogHours
			}
		};
	}

	/**
	 * Load work statistics
	 */
	async function loadStats() {
		if (!currentUserId) return;

		loading = true;
		try {
			// Fetch both planning items and backlog items
			const [planningResult, backlogResult] = await Promise.all([
				taskService.getUnifiedPlanningItems(currentUserId),
				taskService.getUnifiedBacklogItems(currentUserId)
			]);
			
			if (planningResult.success && backlogResult.success) {
				// Combine planning and backlog items for stats calculation
				const allItems = [...planningResult.value, ...backlogResult.value];
				stats = calculateWeeklyStats(allItems);
			}
		} catch (error) {
			console.error('Error loading work stats:', error);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadStats();

		// Refresh stats when page becomes visible (e.g., user returns from another tab)
		if (typeof document !== 'undefined') {
			const handleVisibilityChange = () => {
				if (!document.hidden) {
					loadStats();
				}
			};
			document.addEventListener('visibilitychange', handleVisibilityChange);
			
			return () => {
				document.removeEventListener('visibilitychange', handleVisibilityChange);
			};
		}
	});

	function openBacklogDrawer(event: MouseEvent) {
		event.preventDefault();
		
		// Calculate current week ID (format: "week-year")
		const now = new Date();
		const currentWeek = getISOWeek(now);
		const currentYear = getISOWeekYear(now);
		const weekId = `${currentWeek}-${currentYear}`;
		
		// Navigate with drawer and week parameter
		goto(`/?drawer=mybacklog&weeks=${weekId}`);
	}
</script>

<div class="flex items-center gap-2 {className}">
	<Label variant="default">
		Deze week - Open: {stats.thisWeek.open} ({stats.thisWeek.openHours}u) • Afgerond: {stats.thisWeek.completed} ({stats.thisWeek.completedHours}u){#if stats.thisWeek.backlog > 0}  
		<strong style="color: #F54900;">&nbsp;•• <button 
			type="button"
			onclick={openBacklogDrawer}
			class="underline hover:no-underline cursor-pointer"
			style="color: #F54900; background: none; border: none; padding: 0; font: inherit;"
		>Backlog: {stats.thisWeek.backlog} ({stats.thisWeek.backlogHours}u)</button></strong>{/if}
	</Label>
</div>

