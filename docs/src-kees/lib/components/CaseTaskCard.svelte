<script lang="ts">
	import Label from './Label.svelte';
	import UserAvatar from './UserAvatar.svelte';
	import IconButton from './IconButton.svelte';
	import { getUserForAttribution } from '$lib/utils/userUtils';
	import type { PocketBaseUser } from '$lib/services/pocketbaseService';
	import { Calendar, Clock, Eye, ChevronDown, NotepadText } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { translateStatus } from '$lib/utils/statusTranslations';

	interface CaseTask {
		id: number;
		case_step_id: number;
		task_id: number;
		status: string;
		kanban_status?: string;
		started_at?: string | null;
		completed_at?: string | null;
		deadline?: string | null;
		owner_id?: string | null;
		uren?: number | null;
		created_at: string;
		updated_at: string;
	}

	/**
	 * CaseTaskCard component props
	 * 
	 * Card component for displaying case tasks.
	 */
	interface Props {
		/**
		 * Case task data to display
		 */
		caseTask: CaseTask;

		/**
		 * Case name (from enriched data)
		 */
		caseName?: string | null;

		/**
		 * Task name (from process task)
		 */
		taskName?: string;

		/**
		 * Whether the card is draggable
		 * @default false
		 */
		draggable?: boolean;

		/**
		 * Click handler for the card
		 */
		onclick?: (caseTask: CaseTask) => void;

		/**
		 * Callback fired when case task is deleted
		 */
		ondelete?: () => void;

		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let {
		caseTask,
		caseName,
		taskName,
		draggable = false,
		onclick,
		ondelete,
		class: className = ''
	}: Props = $props();

	let owners = $state<PocketBaseUser[]>([]);
	let loadingOwners = $state(false);
	let isExpanded = $state(false);

	// Get owner IDs (from assignee_id array or owner_id for backward compatibility)
	const ownerIds = $derived.by(() => {
		const assigneeId = (caseTask as any).assignee_id;
		if (Array.isArray(assigneeId)) {
			return assigneeId;
		} else if (assigneeId) {
			return [assigneeId];
		} else if (caseTask.owner_id) {
			return [caseTask.owner_id];
		}
		return [];
	});

	// Load owners on mount
	$effect(() => {
		if (ownerIds.length > 0) {
			loadingOwners = true;
			Promise.all(ownerIds.map(id => getUserForAttribution(id)))
				.then((users) => {
					owners = users.filter(u => u !== null) as PocketBaseUser[];
					loadingOwners = false;
				})
				.catch((error) => {
					console.error('[CaseTaskCard] Error loading owners:', error);
					owners = [];
					loadingOwners = false;
				});
		} else {
			owners = [];
			loadingOwners = false;
		}
	});

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'Geen datum';
		const date = new Date(dateString);
		return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
	}

	// Check if deadline is today (same day, not completed)
	const isToday = $derived.by(() => {
		if (!caseTask.deadline || caseTask.kanban_status === 'afgerond') return false;
		const deadline = new Date(caseTask.deadline);
		const now = new Date();
		
		// Compare year, month, and day only (ignore time)
		const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
		const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		
		return deadlineDate.getTime() === todayDate.getTime();
	});

	// Check if item is overdue (deadline date is BEFORE today AND kanban_status !== 'afgerond')
	// Note: Items due today are NOT overdue - they show in orange instead
	const isOverdue = $derived.by(() => {
		if (!caseTask.deadline || isToday || caseTask.kanban_status === 'afgerond') return false;
		const deadline = new Date(caseTask.deadline);
		const now = new Date();
		
		// Compare year, month, and day only (ignore time)
		const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
		const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		
		// Item is overdue if deadline date is before today (not including today)
		return deadlineDate.getTime() < todayDate.getTime();
	});

	function handleClick() {
		if (onclick) {
			onclick(caseTask);
		}
	}

	function handleToggleExpand(event: MouseEvent) {
		event.stopPropagation();
		isExpanded = !isExpanded;
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'completed':
				return 'bg-green-100 text-green-800';
			case 'active':
				return 'bg-blue-100 text-blue-800';
			case 'overdue':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-zinc-100 text-zinc-800';
		}
	}
</script>

<div
	class="bg-white rounded-lg shadow-xs border transition-all relative group overflow-hidden {className}"
	class:border-zinc-200={caseTask.status !== 'ad-hoc'}
	class:border-red-200={caseTask.status === 'ad-hoc'}
	class:hover:shadow-sm={true}
	class:hover:border-zinc-300={caseTask.status !== 'ad-hoc'}
	class:hover:border-red-300={caseTask.status === 'ad-hoc'}
	class:cursor-pointer={!draggable}
	class:grab={draggable}
>
	<div
		role="button"
		tabindex="0"
		onclick={handleClick}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				handleClick();
			}
		}}
		draggable={draggable}
		ondragstart={(e) => {
			if (draggable) {
				e.dataTransfer?.setData('text/plain', String(caseTask.id));
				e.dataTransfer!.effectAllowed = 'move';
			}
		}}
		class="p-3"
	>
		<!-- Title (task name) -->
		<h4 class="text-sm font-semibold text-zinc-900 mb-2 line-clamp-2 pr-8">
			{taskName || `Taak #${caseTask.task_id}`}
		</h4>

		<!-- Case Name -->
		{#if caseName}
			<div class="text-xs text-zinc-600 mb-2">
				{caseName}
			</div>
		{/if}

		<!-- Owner -->
		{#if owners.length > 0}
			<div class="mb-2 flex items-center">
				{#if owners.length > 1}
					<!-- Show "1+" when multiple assignees -->
					<div class="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-xs text-zinc-600 font-medium border-2 border-white">
						1+
					</div>
				{:else}
					<!-- Show single avatar when only one assignee -->
					<div class="relative">
						<UserAvatar user={owners[0]} size="sm" showName={true} class="text-xs" />
					</div>
				{/if}
			</div>
		{:else if loadingOwners}
			<div class="text-xs text-zinc-400 mb-2">Laden...</div>
		{:else if ownerIds.length === 0}
			<div class="text-xs text-zinc-400 mb-2">Niet toegewezen</div>
		{/if}

		<!-- Dates and labels -->
		<div class="flex items-center gap-2 flex-wrap mb-2">
			<!-- Deadline and hours -->
			<div class="flex items-center gap-2 text-xs text-zinc-600">
			{#if caseTask.deadline}
				<div class="flex items-center gap-1">
					<Calendar size={12} />
					<span 
						class:font-bold={isOverdue || isToday}
						class:text-red-600={isOverdue}
						style={isToday ? 'color: #FFA100;' : ''}
					>
						{formatDate(caseTask.deadline)}
					</span>
				</div>
			{/if}
				{#if caseTask.uren}
					<div class="flex items-center gap-1">
						<Clock size={12} />
						<span>{caseTask.uren}u</span>
					</div>
				{/if}
			</div>

			<!-- Status badge (only show if not gepland/ad-hoc/case-log, otherwise handled by buttons) -->
			{#if !['gepland', 'ad-hoc', 'case-log'].includes(caseTask.status)}
				<span class="px-2 py-0.5 rounded-full text-xs font-medium {getStatusColor(caseTask.status)}">
					{translateStatus(caseTask.status)}
				</span>
			{/if}

				<!-- Tags area for status/kanban - simplified to match WorkItemCard pattern -->
		</div>

		<!-- Expandable details section -->
		<div
			class="overflow-hidden transition-all duration-300 ease-in-out"
			style="max-height: {isExpanded ? '500px' : '0px'}; opacity: {isExpanded ? '1' : '0'};"
		>
			<div class="pt-3 mt-3 border-t border-zinc-200 space-y-2">
				{#if caseTask.started_at}
					<div>
						<div class="text-xs font-medium text-zinc-700 mb-1">Gestart:</div>
						<div class="text-xs text-zinc-600">{formatDate(caseTask.started_at)}</div>
					</div>
				{/if}

				{#if caseTask.completed_at}
					<div>
						<div class="text-xs font-medium text-zinc-700 mb-1">Voltooid:</div>
						<div class="text-xs text-green-600">{formatDate(caseTask.completed_at)}</div>
					</div>
				{/if}

				{#if caseTask.deadline}
					<div>
						<div class="text-xs font-medium text-zinc-700 mb-1">Deadline:</div>
						<div class="text-xs text-zinc-600">{formatDate(caseTask.deadline)}</div>
					</div>
				{/if}

				<div>
					<div class="text-xs font-medium text-zinc-700 mb-1">Taak ID:</div>
					<div class="text-xs text-zinc-600">#{caseTask.id}</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Action buttons -->
	<div class="absolute bottom-2 right-2 flex gap-1">
		<IconButton
			icon={NotepadText}
			size="sm"
			variant="ghost"
			tooltip="Naar pagina"
			tooltipPosition="top"
			onclick={(e) => {
				e.stopPropagation();
				goto(`/page/task/${caseTask.id}`);
			}}
			class="opacity-0 group-hover:opacity-100 transition-opacity"
		/>
		<IconButton
			icon={ChevronDown}
			size="sm"
			variant="ghost"
			tooltip={isExpanded ? 'Inklappen' : 'Uitklappen'}
			tooltipPosition="top"
			onclick={handleToggleExpand}
			class="opacity-0 group-hover:opacity-100 transition-opacity {isExpanded ? 'rotate-180' : 'rotate-0'}"
		/>
	</div>
</div>

