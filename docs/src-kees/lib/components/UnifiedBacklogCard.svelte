<script lang="ts">
	import type { UnifiedBacklogItem } from '$lib/services/taskService';
	import Label from './Label.svelte';
	import UserAvatar from './UserAvatar.svelte';
	import IconButton from './IconButton.svelte';
	import WorkItemDetailsDrawer from './WorkItemDetailsDrawer.svelte';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import ButtonGroup from './ButtonGroup.svelte';
	import Rating from './Rating.svelte';
	import { getUserForAttribution } from '$lib/utils/userUtils';
	import type { PocketBaseUser } from '$lib/services/pocketbaseService';
	import { Calendar, Clock, Eye, ChevronDown, Trash2, SquarePen, Lock } from 'lucide-svelte';
	import Tooltip from './Tooltip.svelte';
	import DependencyIndicator from './DependencyIndicator.svelte';
	import { deleteWorkItem } from '$lib/services/taskService';
	import { toastStore } from '$lib/stores/toastStore';
	import { getUserMessage } from '$lib/types/errors';
	import { goto } from '$app/navigation';

	/**
	 * UnifiedBacklogCard component props
	 * 
	 * Card component for displaying both work items and case tasks in the backlog.
	 */
	interface Props {
		/**
		 * Unified backlog item data to display
		 */
		item: UnifiedBacklogItem;

		/**
		 * Whether the card is draggable
		 * @default false
		 */
		draggable?: boolean;

		/**
		 * Click handler for the card
		 */
		onclick?: (item: UnifiedBacklogItem) => void;

		/**
		 * Callback fired when item is deleted
		 * Use this to refresh the parent's item list
		 */
		ondelete?: () => void;

		/**
		 * Whether to show status buttons (Gepland/Ad-hoc)
		 * @default true
		 */
		showStatusButtons?: boolean;

		/**
		 * Callback fired when status button is clicked
		 */
		onstatuschange?: (status: 'gepland' | 'ad-hoc') => void;

		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let {
		item,
		draggable = false,
		onclick,
		ondelete,
		showStatusButtons = true,
		onstatuschange,
		class: className = ''
	}: Props = $props();

	let users = $state<PocketBaseUser[]>([]);
	let loadingUsers = $state(false);
	let detailsDrawerOpen = $state(false);
	let isExpanded = $state(false);
	let deleteModalOpen = $state(false);
	let deleting = $state(false);

	// Get user IDs (assignee_id array for work items, owner_id/assignee_id for case tasks)
	const userIds = $derived.by(() => {
		if (item.type === 'work_item') {
			return Array.isArray(item.assignee_id) ? item.assignee_id : (item.assignee_id ? [item.assignee_id] : []);
		} else {
			// Case tasks: use owner_id or assignee_id (backward compatibility)
			const ownerId = item.owner_id;
			const assigneeId = (item as any).assignee_id;
			if (Array.isArray(assigneeId)) {
				return assigneeId;
			} else if (assigneeId) {
				return [assigneeId];
			} else if (ownerId) {
				return [ownerId];
			}
			return [];
		}
	});

	// Check if user can interact with this item (based on project access)
	const canInteract = $derived(item.canInteract !== false);

	// Load users on mount
	$effect(() => {
		if (userIds.length > 0) {
			loadingUsers = true;
			Promise.all(userIds.map(id => getUserForAttribution(id)))
				.then((loadedUsers) => {
					users = loadedUsers.filter(u => u !== null) as PocketBaseUser[];
					loadingUsers = false;
				})
				.catch((error) => {
					console.error('[UnifiedBacklogCard] Error loading users:', error);
					users = [];
					loadingUsers = false;
				});
		} else {
			users = [];
			loadingUsers = false;
		}
	});

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'Geen datum';
		const date = new Date(dateString);
		return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
	}

	function handleClick() {
		if (onclick) {
			onclick(item);
		} else if (item.type === 'case_task' && item.case_id) {
			// Navigate to case detail for case tasks
			goto(`/cases/${item.case_id}`);
		}
	}

	async function handleEditClick(event: MouseEvent) {
		event.stopPropagation();
		// Open edit drawer based on item type
		const urlParams = new URLSearchParams(window.location.search);
		if (item.type === 'work_item') {
			urlParams.set('drawer', 'workitem');
			urlParams.set('workItemId', String(item.id));
			await goto(`?${urlParams.toString()}`, { noScroll: true });
		} else if (item.type === 'case_task' && item.case_id) {
			urlParams.set('drawer', 'casetask');
			urlParams.set('caseTaskId', String(item.id));
			await goto(`?${urlParams.toString()}`, { noScroll: true });
		}
	}

	function handleViewDetails(event: MouseEvent) {
		event.stopPropagation();
		if (item.type === 'work_item') {
			detailsDrawerOpen = true;
		} else if (item.case_id) {
			goto(`/cases/${item.case_id}`);
		}
	}

	function handleToggleExpand(event: MouseEvent) {
		event.stopPropagation();
		isExpanded = !isExpanded;
	}


	function handleDeleteClick(event: MouseEvent) {
		event.stopPropagation();
		if (item.type === 'work_item') {
			deleteModalOpen = true;
		}
	}

	function handleCancelDelete() {
		deleteModalOpen = false;
	}

	async function handleConfirmDelete() {
		if (item.type !== 'work_item') return;
		
		deleting = true;
		const result = await deleteWorkItem(item.id);
		
		if (result.success) {
			toastStore.add('Work item verwijderd', 'success');
			deleteModalOpen = false;
			if (ondelete) {
				ondelete();
			}
		} else {
			toastStore.add(getUserMessage(result.error), 'error');
		}
		
		deleting = false;
	}

	// Get date to display (due_date for work items, deadline for case tasks)
	const displayDate = $derived(item.type === 'work_item' ? item.due_date : item.deadline);

	// Check if deadline is today (same day, not completed)
	const isToday = $derived.by(() => {
		if (!displayDate || item.kanban_status === 'afgerond') return false;
		const deadline = new Date(displayDate);
		const now = new Date();
		
		// Compare year, month, and day only (ignore time)
		const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
		const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		
		return deadlineDate.getTime() === todayDate.getTime();
	});

	// Check if item is overdue (deadline date is BEFORE today AND kanban_status !== 'afgerond')
	// Note: Items due today are NOT overdue - they show in orange instead
	const isOverdue = $derived.by(() => {
		if (!displayDate || isToday || item.kanban_status === 'afgerond') return false;
		const deadline = new Date(displayDate);
		const now = new Date();
		
		// Compare year, month, and day only (ignore time)
		const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
		const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		
		// Item is overdue if deadline date is before today (not including today)
		return deadlineDate.getTime() < todayDate.getTime();
	});

	// Check if item is "planbaar" (has assignee_id/owner_id, deadline/due_date, and uren)
	const isPlanbaar = $derived.by(() => {
		const hasAssignee = userIds.length > 0;
		const hasDeadline = !!(item.deadline || item.due_date);
		const hasUren = !!item.uren;
		return hasAssignee && hasDeadline && hasUren;
	});
</script>

<div
	class="bg-white rounded-lg shadow-xs border transition-all relative group overflow-hidden flex flex-col h-full {className}"
	class:border-zinc-200={!isPlanbaar && canInteract && item.status !== 'ad-hoc'}
	class:border-zinc-300={!canInteract}
	class:border-green-200={isPlanbaar && canInteract && item.status !== 'ad-hoc'}
	class:border-red-200={canInteract && item.status === 'ad-hoc'}
	class:hover:shadow-sm={canInteract}
	class:hover:border-zinc-300={!isPlanbaar && canInteract && item.status !== 'ad-hoc'}
	class:hover:border-green-300={isPlanbaar && canInteract && item.status !== 'ad-hoc'}
	class:hover:border-red-300={canInteract && item.status === 'ad-hoc'}
	class:opacity-60={!canInteract}
	class:cursor-not-allowed={!canInteract}
	class:cursor-pointer={!draggable && canInteract}
	class:grab={draggable && canInteract}
>
	{#if !canInteract}
		<!-- Lock icon for disabled items (private project) -->
		<div class="absolute top-3 right-3 z-10">
			<Tooltip text="Private project - no access" position="left">
				<Lock size={16} class="text-zinc-400" />
			</Tooltip>
		</div>
	{/if}

	<div
		role={canInteract ? "button" : undefined}
		tabindex={canInteract ? 0 : undefined}
		onclick={canInteract ? handleClick : undefined}
		onkeydown={(e) => {
			if ((e.key === 'Enter' || e.key === ' ') && canInteract) {
				e.preventDefault();
				handleClick();
			}
		}}
		draggable={draggable && canInteract}
		ondragstart={(e) => {
			if (draggable && canInteract) {
				e.dataTransfer?.setData('text/plain', JSON.stringify({ type: item.type, id: item.id }));
				e.dataTransfer!.effectAllowed = 'move';
			}
		}}
		class="p-3 flex flex-col flex-grow"
	>

	<!-- Title (subject as main title) -->
	<div class="flex items-start gap-2 mb-2">
		<h4 class="text-sm font-semibold text-zinc-900 line-clamp-2 flex-1 pr-8">
			{item.subject || 'Geen titel'}
		</h4>
		<!-- Dependency indicator (shown when task has dependency changes) -->
		{#if false} <!-- TODO: Replace with actual dependency check -->
			<DependencyIndicator variant="icon" size="sm" tooltip="Deze taak heeft afhankelijkheid wijzigingen" />
		{/if}
	</div>

	<!-- Case label (for case tasks) -->
	{#if item.type === 'case_task' && item.case_name}
		<div class="mb-2">
			<Label variant="default" class="text-xs bg-blue-100 text-blue-800">
				<span class="font-medium">Case:</span> {item.case_name}
			</Label>
		</div>
	{/if}

	<!-- Assignee/Owner and Status Buttons -->
	<div class="mb-2 flex items-center justify-between gap-2 -mr-[4px]">
		<div class="flex-1">
			{#if users.length > 0}
				<div class="flex items-center">
					{#if users.length > 1}
						<!-- Show "1+" when multiple assignees -->
						<div class="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-xs text-zinc-600 font-medium border-2 border-white">
							1+
						</div>
					{:else}
						<!-- Show single avatar when only one assignee -->
						<div class="relative">
							<UserAvatar user={users[0]} size="sm" showName={true} class="text-xs" isAdHoc={item.status === 'ad-hoc'} />
						</div>
					{/if}
				</div>
			{:else if loadingUsers}
				<div class="text-xs text-zinc-400">Laden...</div>
			{:else}
				<div class="text-xs text-zinc-500">Geen eigenaar</div>
			{/if}
		</div>
		{#if canInteract && showStatusButtons && onstatuschange}
			<div onclick={(e) => e.stopPropagation()}>
				<ButtonGroup>
					<Button
						type="button"
						variant={item.status === 'gepland' ? 'default' : 'secondary'}
						size="sm"
						class="button-group-item text-xs"
						onclick={() => onstatuschange('gepland')}
					>
						Gepland
					</Button>
					<Button
						type="button"
						variant={item.status === 'ad-hoc' ? 'default' : 'secondary'}
						size="sm"
						class="button-group-item text-xs"
						onclick={() => onstatuschange('ad-hoc')}
					>
						Ad-hoc
					</Button>
				</ButtonGroup>
			</div>
		{/if}
	</div>

	<!-- Dates and labels in one row -->
	<div class="flex items-center gap-2 flex-wrap mb-2">
		<!-- Due date/deadline and hours -->
		<div class="flex items-center gap-2 text-xs text-zinc-600">
			{#if displayDate}
				<div class="flex items-center gap-1">
					<Calendar size={12} />
					<span 
						class:font-bold={isOverdue || isToday}
						class:text-red-600={isOverdue}
						style={isToday ? 'color: #FFA100;' : ''}
					>
						{formatDate(displayDate)}
					</span>
				</div>
			{/if}
			{#if item.uren}
				<div class="flex items-center gap-1">
					<Clock size={12} />
					<span>{item.uren}u</span>
				</div>
			{/if}
			{#if isPlanbaar}
				<Label variant="success" class="rounded-full text-[8px] px-0.5 py-[1px]">OK</Label>
			{/if}
		</div>

		<!-- Tags (only for work items) -->
		{#if item.type === 'work_item' && item.tags && item.tags.length > 0}
			<div class="flex flex-wrap gap-1">
				{#each item.tags.slice(0, 3) as tag}
					<Label variant="default" class="text-xs">{tag}</Label>
				{/each}
				{#if item.tags.length > 3}
					<Label variant="default" class="text-xs">+{item.tags.length - 3}</Label>
				{/if}
			</div>
		{/if}
	</div>

		<!-- Expandable details section (only for work items) -->
		{#if item.type === 'work_item'}
			<div
				class="overflow-hidden transition-all duration-300 ease-in-out"
				style="max-height: {isExpanded ? '500px' : '0px'}; opacity: {isExpanded ? '1' : '0'};"
			>
				<div class="pt-3 mt-3 border-t border-zinc-200 space-y-2">
					{#if item.relevantie !== null}
						<div>
							<div class="text-xs font-medium text-zinc-700 mb-1">Relevantie:</div>
							<Rating 
								rating={item.relevantie} 
								max={5} 
								size="sm" 
								readonly 
							/>
						</div>
					{/if}
					{#if item.voor_wie_is_het}
						<div>
							<div class="text-xs font-medium text-zinc-700 mb-1">Voor wie is het:</div>
							<div class="text-xs text-zinc-600">{item.voor_wie_is_het}</div>
						</div>
					{/if}

					{#if item.wat_ga_je_doen && item.subject}
						<div>
							<div class="text-xs font-medium text-zinc-700 mb-1">Wat ga je doen:</div>
							<div class="text-xs text-zinc-600">{item.wat_ga_je_doen}</div>
						</div>
					{/if}

					{#if item.waarom_doe_je_het}
						<div>
							<div class="text-xs font-medium text-zinc-700 mb-1">Waarom doe je het:</div>
							<div class="text-xs text-zinc-600">{item.waarom_doe_je_het}</div>
						</div>
					{/if}

					{#if item.komt_van}
						<div>
							<div class="text-xs font-medium text-zinc-700 mb-1">Komt van:</div>
							<div class="text-xs text-zinc-600">{item.komt_van}</div>
						</div>
					{/if}

					{#if item.bijlagen && item.bijlagen.length > 0}
						<div>
							<div class="text-xs font-medium text-zinc-700 mb-1">Bijlagen:</div>
							<div class="text-xs text-zinc-500">{item.bijlagen.length} bijlage{item.bijlagen.length !== 1 ? 'n' : ''}</div>
						</div>
					{/if}

					{#if item.tags && item.tags.length > 3}
						<div>
							<div class="text-xs font-medium text-zinc-700 mb-1">Alle tags:</div>
							<div class="flex flex-wrap gap-1">
								{#each item.tags as tag}
									<Label variant="default" class="text-xs">{tag}</Label>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Action buttons: View details, Edit and Delete -->
					<div class="pt-2 border-t border-zinc-200 flex justify-end gap-2">
						<IconButton
							icon={Eye}
							size="sm"
							variant="ghost"
							tooltip="Details bekijken"
							tooltipPosition="top"
							onclick={handleViewDetails}
						/>
						<IconButton
							icon={SquarePen}
							size="sm"
							variant="ghost"
							tooltip="Bewerken"
							tooltipPosition="top"
							onclick={handleClick}
						/>
						<IconButton
							icon={Trash2}
							variant="danger"
							size="sm"
							tooltip="Work item verwijderen"
							onclick={handleDeleteClick}
							disabled={deleting}
						/>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Expand/collapse caret button (only for work items) -->
	{#if item.type === 'work_item'}
		<button
			type="button"
			onclick={handleToggleExpand}
			class="w-full flex items-center justify-center py-1.5 text-zinc-400 hover:text-zinc-600 transition-colors border-t border-zinc-200 bg-zinc-50/50"
			aria-label={isExpanded ? 'Inklappen' : 'Uitklappen'}
		>
		<ChevronDown
			size={16}
			class="transition-transform duration-300 {isExpanded ? 'rotate-180' : ''}"
		/>
		</button>
	{:else}
		<!-- Spacer for case tasks to maintain consistent card height -->
		<div class="mt-auto"></div>
	{/if}

	<!-- Action buttons - Above expand option (only shown when not expanded and is work item) -->
	{#if canInteract && item.type === 'work_item' && !isExpanded}
		<div class="absolute bottom-10 right-2 z-10 flex items-center gap-1">
			<IconButton
				icon={Eye}
				size="sm"
				variant="ghost"
				tooltip="Details bekijken"
				tooltipPosition="left"
				onclick={handleViewDetails}
				class="opacity-0 group-hover:opacity-100 transition-opacity"
			/>
			<IconButton
				icon={SquarePen}
				size="sm"
				variant="ghost"
				tooltip="Bewerken"
				tooltipPosition="left"
				onclick={handleEditClick}
				class="opacity-0 group-hover:opacity-100 transition-opacity"
			/>
		</div>
	{:else if canInteract && item.type === 'case_task'}
		<!-- Action buttons for case tasks (always visible on hover) -->
		<div class="absolute top-2 right-2 z-10 flex items-center gap-1">
			<IconButton
				icon={Eye}
				size="sm"
				variant="ghost"
				tooltip="Case bekijken"
				tooltipPosition="left"
				onclick={handleViewDetails}
				class="opacity-0 group-hover:opacity-100 transition-opacity"
			/>
			<IconButton
				icon={SquarePen}
				size="sm"
				variant="ghost"
				tooltip="Bewerken"
				tooltipPosition="left"
				onclick={handleEditClick}
				class="opacity-0 group-hover:opacity-100 transition-opacity"
			/>
		</div>
	{/if}
</div>

<!-- Details Drawer (only for work items) -->
{#if item.type === 'work_item'}
	<WorkItemDetailsDrawer
		workItemId={item.id}
		bind:open={detailsDrawerOpen}
	/>
{/if}

<!-- Delete Confirmation Modal (only for work items) -->
{#if item.type === 'work_item'}
	<Modal bind:open={deleteModalOpen} title="Work item verwijderen" size="md" closeOnBackdropClick={false} loading={deleting}>
		<div class="space-y-4">
			<p class="text-zinc-600">
				Weet u zeker dat u dit work item wilt verwijderen?
			</p>
			<p class="text-sm text-zinc-500">
				Deze actie kan niet ongedaan worden gemaakt.
			</p>
			<div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
				<Button variant="secondary" onclick={handleCancelDelete} disabled={deleting}>
					Annuleren
				</Button>
				<button
					onclick={handleConfirmDelete}
					disabled={deleting}
					class="px-4 py-2 bg-red-600 text-white rounded-sm shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{deleting ? 'Verwijderen...' : 'Verwijderen'}
				</button>
			</div>
		</div>
	</Modal>
{/if}





