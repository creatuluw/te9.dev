<script lang="ts">
	import { onMount, onDestroy, tick, untrack } from 'svelte';
	import type { UnifiedPlanningItem } from '$lib/services/taskService';
	import WorkItemCard from './WorkItemCard.svelte';
	import * as taskService from '$lib/services/taskService';
	import { taskStore } from '$lib/stores/taskStore';
	import { caseStore } from '$lib/stores/caseStore';
	import { getCurrentUserId } from '$lib/utils/userUtils';
	import { toastStore } from '$lib/stores/toastStore';
	import { getUserMessage } from '$lib/types/errors';
	import { navigationStore } from '$lib/stores/navigationStore';
	import Label from './Label.svelte';
	import { goto } from '$app/navigation';
	import { Clock } from 'lucide-svelte';
	import { refreshAOS } from '$lib/utils/aosKit';
	import { browser } from '$app/environment';

	type KanbanStatus = 'backlog' | 'gepland' | 'mee_bezig' | 'in_review' | 'afgerond' | 'overdue';

	/**
	 * KanbanBoard component props
	 * 
	 * Kanban board with drag-and-drop functionality for work items using MDN drag-and-drop pattern.
	 */
	interface Props {
		/**
		 * Filter by assignee ID (null shows all items)
		 * @default current user ID
		 */
		assigneeFilter?: string | null;

		/**
		 * Show only overdue items (deadline < now and status !== 'completed')
		 * @default false
		 */
		showOverdueOnly?: boolean;

		/**
		 * Additional CSS classes
		 */
		class?: string;

		/**
		 * Callback when work item is clicked
		 */
		onitemclick?: (workItem: UnifiedPlanningItem) => void;

		/**
		 * Search query for filtering items
		 */
		searchQuery?: string;

		/**
		 * Search scope for filtering
		 */
		searchScope?: string;

		/**
		 * Array of assignee IDs to filter by
		 */
		filterAssignee?: string[];

	/**
	 * Status filter
	 */
	filterStatus?: string | null;

	/**
	 * Project ID filter
	 */
	filterProject?: number | null;

	/**
	 * Process IDs filter (array)
	 */
	filterProcesses?: number[];

	/**
	 * Case IDs filter (array)
	 */
	filterCases?: number[];

	/**
	 * Date range from filter (YYYY-MM-DD)
	 */
	filterDateFrom?: string | null;

	/**
	 * Date range to filter (YYYY-MM-DD)
	 */
	filterDateTo?: string | null;
}

let {
	assigneeFilter = undefined,
	showOverdueOnly = false,
	class: className = '',
	onitemclick,
	searchQuery = '',
	searchScope = 'alle',
	filterAssignee = [],
	filterStatus = null,
	filterProject = null,
	filterProcesses = [],
	filterCases = [],
	filterDateFrom = null,
	filterDateTo = null
}: Props = $props();

	// Initialize with cached data if available for instant render
	const initialStoreData = taskStore.getValue();
let workItems = $state<UnifiedPlanningItem[]>(initialStoreData.planningItems || []);
// Force reactivity trigger - increment this to force $derived recalculation
let workItemsVersion = $state(0);
// Only show spinner if we truly have nothing to render yet
let loading = $state(initialStoreData.planningItems.length === 0);
	let closedTotalHours = $state(0);
	
	// Load cases for process/case filtering
	let casesMap = $state<Map<number, { process_id: number }>>(new Map());
	
	// Track current assignee filter for polling
	let currentAssigneeFilter = $state<string | null | undefined>(undefined);
	
	// Flag to prevent store subscription from overwriting optimistic updates during drag
	let isOptimisticUpdate = $state(false);
	// Track the optimistic update details to verify incoming data
	let optimisticItemId = $state<number | null>(null);
	let optimisticExpectedStatus = $state<KanbanStatus | null>(null);
// Track whether we've already done the initial load (to avoid repeat spinners)
let hasLoadedInitialData = $state(initialStoreData.planningItems.length > 0);
	
	// Load cases for filtering
	$effect(() => {
		async function loadCases() {
			await caseStore.refresh(undefined, false);
			const storeData = caseStore.getValue();
			const map = new Map<number, { process_id: number }>();
			storeData.cases.forEach((caseItem) => {
				map.set(caseItem.id, { process_id: caseItem.process_id });
			});
			casesMap = map;
		}
		loadCases();
		
		// Subscribe to case store updates
		const unsubscribe = caseStore.subscribe((storeData) => {
			const map = new Map<number, { process_id: number }>();
			storeData.cases.forEach((caseItem) => {
				map.set(caseItem.id, { process_id: caseItem.process_id });
			});
			casesMap = map;
		});
		
		return unsubscribe;
	});

	// Subscribe to store updates for reactive data (only for planning items, not overdue)
	$effect(() => {
		if (!showOverdueOnly && assigneeFilter !== undefined) {
			const unsubscribe = taskStore.subscribe((storeData) => {
				// Only update if we're showing planning items
				// Skip update if we're in the middle of an optimistic update (during drag)
				if (!showOverdueOnly && storeData.planningItems.length > 0 && !isOptimisticUpdate) {
					// If we're waiting for an optimistic update to be reflected in the DB,
					// verify the incoming data contains our expected change before accepting it
					if (optimisticItemId !== null && optimisticExpectedStatus !== null) {
						const updatedItem = storeData.planningItems.find(
							item => item.id === optimisticItemId
						);
						
						if (updatedItem && updatedItem.kanban_status === optimisticExpectedStatus) {
							console.log('[Kanban] ✅ Store update confirms DB change - accepting and clearing optimistic flag');
							workItems = storeData.planningItems;
							loading = false;
							// Clear optimistic tracking - now allow normal store updates
							optimisticItemId = null;
							optimisticExpectedStatus = null;
							isOptimisticUpdate = false; // Clear flag now that DB is confirmed
							console.log('[Kanban] Optimistic update complete - card status now synced with DB');
						} else {
							console.log('[Kanban] Store update has stale data - ignoring until fresh data arrives');
							console.log(`[Kanban] Expected item ${optimisticItemId} with status ${optimisticExpectedStatus}, got:`, updatedItem?.kanban_status);
							console.log('[Kanban] Card stays in new lane (optimistic) until store confirms DB update');
						}
					} else {
						// Only update if data actually changed
						// Use untrack to read current workItems without creating reactive dependency
						const currentWorkItems = untrack(() => workItems);
						const currentJson = JSON.stringify(currentWorkItems);
						const newJson = JSON.stringify(storeData.planningItems);
						
						if (currentJson !== newJson) {
							if (import.meta.env.DEV) {
								console.log('[Kanban] Store subscription updating workItems from store');
							}
							workItems = storeData.planningItems;
						}
						loading = false;
					}
				} else if (isOptimisticUpdate) {
					console.log('[Kanban] Store subscription BLOCKED - isOptimisticUpdate =', isOptimisticUpdate);
				}
			});
			
			return unsubscribe;
		}
	});

	const columns: Array<{ id: KanbanStatus; label: string }> = [
		{ id: 'gepland', label: 'Gepland' },
		{ id: 'mee_bezig', label: 'Mee bezig' },
		{ id: 'in_review', label: 'In review' },
		{ id: 'afgerond', label: 'Afgerond' }
	];

	// AOS animation directions for subtle slide-in effects
	const aosAnimations = ['fade-left', 'fade-right', 'fade-up', 'fade-down'];
	
	/**
	 * Get random AOS animation direction for a column based on its index
	 * This ensures consistent animation per column while being random
	 */
	function getColumnAOSAnimation(index: number): string {
		// Use column index to seed random selection for consistency
		// This ensures each column always gets the same animation
		const seed = index * 7 + 13; // Simple seed based on index
		return aosAnimations[seed % aosAnimations.length];
	}

	// Initialize assignee filter to current user
	$effect(() => {
		if (assigneeFilter === undefined) {
			assigneeFilter = getCurrentUserId();
		}
	});

	// Load work items when filter changes
$effect(() => {
	if (assigneeFilter !== undefined) {
		currentAssigneeFilter = assigneeFilter;
		loadWorkItems(!hasLoadedInitialData);
		hasLoadedInitialData = true;
	}
});

	// Reload when showOverdueOnly changes
$effect(() => {
	if (assigneeFilter !== undefined && showOverdueOnly !== undefined) {
		loadWorkItems(false);
	}
});

async function loadWorkItems(showLoading = false) {
		// CRITICAL: Don't overwrite optimistic updates!
		if (isOptimisticUpdate) {
			console.log('[Kanban] loadWorkItems BLOCKED - optimistic update in progress');
			return;
		}
		
	if (showLoading) {
			navigationStore.startPageLoading();
		}
		
		if (showOverdueOnly) {
			// Overdue items - use service directly (less common, still benefits from cache)
			const result = await taskService.getUnifiedOverdueItems(assigneeFilter ?? null);
			if (result.success) {
				workItems = result.value;
			} else {
				toastStore.add(getUserMessage(result.error), 'error');
				workItems = [];
			}
		} else {
			// Planning items - use store
			const items = await taskStore.getPlanningItems(assigneeFilter ?? null, showLoading);
			workItems = items;
		}
		
	if (showLoading) {
			navigationStore.stopPageLoading();
		}
	}

	/**
	 * Silent background sync - updates data without showing loading state
	 */
	async function syncWorkItemsSilently() {
		try {
			// Set flag to prevent store subscription from updating loading state
			const wasOptimistic = isOptimisticUpdate;
			isOptimisticUpdate = true;
			
			if (showOverdueOnly) {
				const result = await taskService.getUnifiedOverdueItems(assigneeFilter ?? null);
				if (result.success) {
					workItems = result.value;
				}
			} else {
				const items = await taskStore.getPlanningItems(assigneeFilter ?? null, false);
				workItems = items;
			}
			
			// Restore flag state
			isOptimisticUpdate = wasOptimistic;
		} catch (error) {
			// Silently fail - don't show errors for background sync
			if (import.meta.env.DEV) {
				console.warn('[Kanban] Background sync failed:', error);
			}
			// Make sure flag is cleared on error
			isOptimisticUpdate = false;
		}
	}

	onMount(() => {
		// Start polling when component mounts (only for planning items, not overdue)
		if (!showOverdueOnly && typeof document !== 'undefined') {
			taskStore.startPolling(30000, currentAssigneeFilter ?? null);

			// Pause polling when tab is hidden, resume when visible
			const handleVisibilityChange = () => {
				if (document.hidden) {
					taskStore.stopPolling();
				} else {
					taskStore.startPolling(30000, currentAssigneeFilter ?? null);
					// Refresh data when tab becomes visible
					syncWorkItemsSilently();
				}
			};

			document.addEventListener('visibilitychange', handleVisibilityChange);

			return () => {
				document.removeEventListener('visibilitychange', handleVisibilityChange);
			};
		}
	});

	// Refresh AOS when loading completes and columns are visible (following navcards pattern)
	$effect(() => {
		if (!loading && browser) {
			// Wait for DOM to be ready and AOS to be initialized (same delay as homepage navcards)
			setTimeout(async () => {
				await refreshAOS();
			}, 500);
		}
	});

	onDestroy(() => {
		if (!showOverdueOnly) {
			taskStore.stopPolling();
		}
	});

	const itemsByStatus = $derived.by(() => {
		const derivedStart = performance.now();
		// Commented out: verbose Kanban derived logs
		// console.log('[Kanban] itemsByStatus $derived.by starting, workItems.length:', $state.snapshot(workItems).length, 'version:', $state.snapshot(workItemsVersion));
		
		// First apply filters to workItems
		let filteredItems = workItems;

		// IMPORTANT: Date range filter is applied FIRST to reduce the dataset
		// This ensures other filters only show values available within the date range
		if (filterDateFrom || filterDateTo) {
			filteredItems = filteredItems.filter((item) => {
				const deadline = item.deadline || item.due_date;
				if (!deadline) return false;
				
				const itemDate = new Date(deadline);
				const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
				const toDate = filterDateTo ? new Date(filterDateTo) : null;
				
				if (fromDate && itemDate < fromDate) return false;
				if (toDate && itemDate > toDate) return false;
				
				return true;
			});
		}

		// Filter by project (if filterProject is provided)
		if (filterProject !== null) {
			filteredItems = filteredItems.filter((item) => {
				return item.project_id === filterProject;
			});
		}

		// Filter by assignee (if filterAssignee is provided and has values)
		if (filterAssignee && filterAssignee.length > 0) {
			filteredItems = filteredItems.filter((item) => {
				return filterAssignee.some(assigneeId => {
					// Handle assignee_id as array (work items) or string/null (legacy)
					if (Array.isArray(item.assignee_id)) {
						return item.assignee_id.includes(assigneeId);
					} else if (item.assignee_id === assigneeId) {
						return true;
					}
					// Check owner_id for case tasks
					return item.owner_id === assigneeId;
				});
			});
		}

		// Filter by processes (if filterProcesses is provided and has values)
		// This filters case tasks by their case's process_id
		if (filterProcesses && filterProcesses.length > 0) {
			filteredItems = filteredItems.filter((item) => {
				// For case tasks, check if the case's process_id matches
				if (item.type === 'case_task' && item.case_id) {
					const caseData = casesMap.get(item.case_id);
					if (caseData) {
						return filterProcesses.includes(caseData.process_id);
					}
					return false;
				}
				// For work items, they don't have process_id, so exclude them
				return false;
			});
		}

		// Filter by cases (if filterCases is provided and has values)
		if (filterCases && filterCases.length > 0) {
			filteredItems = filteredItems.filter((item) => {
				// Only filter case tasks by case_id
				if (item.type === 'case_task' && item.case_id) {
					return filterCases.includes(item.case_id);
				}
				// For work items, exclude them when filtering by cases
				return false;
			});
		}

		// Filter by status (if filterStatus is provided)
		if (filterStatus) {
			if (filterStatus === 'overdue') {
				const now = new Date();
				filteredItems = filteredItems.filter((item) => {
					const deadline = item.deadline || item.due_date;
					if (!deadline || item.status === 'completed') return false;
					return new Date(deadline) < now;
				});
			} else {
				filteredItems = filteredItems.filter((item) => {
					return item.kanban_status === filterStatus;
				});
			}
		}

		// Filter by search query
		if (searchQuery && searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filteredItems = filteredItems.filter((item) => {
				const matchesInScope = (scope: string): boolean => {
					switch (scope) {
						case 'alle':
							// Search in all text fields
							const allFields = [
								item.subject,
								item.case_name,
								item.name,
								item.wat_ga_je_doen,
								item.waarom_doe_je_het,
								item.voor_wie_is_het,
								item.komt_van,
								...((item.tags || []) as string[])
							];
							return allFields.some(field => field?.toLowerCase().includes(query));
						
						case 'taken':
							// Search task names and descriptions
							const taskFields = [
								item.subject,
								item.name,
								item.wat_ga_je_doen,
								item.waarom_doe_je_het
							];
							return taskFields.some(field => field?.toLowerCase().includes(query));
						
						case 'personen':
							// Search people
							const personFields = [
								item.voor_wie_is_het,
								item.komt_van
							];
							return personFields.some(field => field?.toLowerCase().includes(query));
						
						default:
							return false;
					}
				};
				
				return matchesInScope(searchScope);
			});
		}

		// Group filtered items by status
		const grouped: Record<KanbanStatus, UnifiedPlanningItem[]> = {
			backlog: [],
			gepland: [],
			mee_bezig: [],
			in_review: [],
			afgerond: [],
			overdue: []
		};

		for (const item of filteredItems) {
			const status = item.kanban_status as KanbanStatus;
			if (status in grouped) {
				grouped[status].push(item);
			}
		}

		// Sort each group by kanban_order
		for (const status in grouped) {
			grouped[status as KanbanStatus].sort((a, b) => {
				const orderA = a.kanban_order ?? 0;
				const orderB = b.kanban_order ?? 0;
				if (orderA !== orderB) {
					return orderA - orderB;
				}
				return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
			});
		}

		const derivedEnd = performance.now();
		// Commented out: verbose Kanban derived logs
		// console.log('[Kanban] itemsByStatus $derived.by completed in', (derivedEnd - derivedStart).toFixed(2) + 'ms');
		// console.log('[Kanban] Grouped items:', Object.entries(grouped).map(([status, items]) => `${status}: ${items.length}`).join(', '));

		return grouped;
	});

	// Calculate total hours for afgerond tasks (visible in kanban)
	const afgerondTotalHours = $derived.by(() => {
		return itemsByStatus.afgerond.reduce((sum, item) => {
			return sum + (item.uren || 0);
		}, 0);
	});

	// Fetch total hours from all closed tasks
	async function loadClosedHours() {
		const userId = assigneeFilter || getCurrentUserId();
		const result = await taskService.getClosedUnifiedItems(userId);
		
		if (result.success) {
			closedTotalHours = result.value.reduce((sum, item) => sum + (item.uren || 0), 0);
		}
	}

	// Load closed hours when assignee filter changes
	$effect(() => {
		if (assigneeFilter !== undefined) {
			loadClosedHours();
		}
	});

	function navigateToArchive() {
		goto('/closed');
	}

	/**
	 * Create a placeholder element for drop indication (MDN pattern)
	 * The placeholder height matches the dragged task to prevent layout shifts
	 */
	function makePlaceholder(draggedTask: HTMLElement): HTMLElement {
		const placeholder = document.createElement('div');
		placeholder.classList.add('placeholder');
		placeholder.style.height = `${draggedTask.offsetHeight}px`;
		// Ensure placeholder is visible with explicit inline styles
		placeholder.style.display = 'block';
		placeholder.style.width = '100%';
		// Force border visibility with inline styles
		placeholder.style.border = '4px solid rgb(234, 88, 12)';
		placeholder.style.backgroundColor = 'rgb(255, 237, 213)';
		placeholder.style.borderRadius = '0.5rem';
		placeholder.style.minHeight = '80px';
		return placeholder;
	}

	/**
	 * Move placeholder to show drop position (MDN pattern)
	 * Matches MDN tutorial: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#inserting_at_a_particular_location
	 */
	function movePlaceholder(event: DragEvent) {
		const column = event.currentTarget as HTMLElement;
		const draggedTask = document.getElementById('dragged-task');
		if (!draggedTask) return;

		const tasksContainer = column.querySelector('[data-tasks]') as HTMLElement;
		if (!tasksContainer) return;

		const existingPlaceholder = column.querySelector('.placeholder') as HTMLElement | null;

		// If placeholder exists and cursor is still inside it, don't change anything
		// This prevents flickering when cursor is within placeholder bounds
		if (existingPlaceholder) {
			const placeholderRect = existingPlaceholder.getBoundingClientRect();
			if (
				placeholderRect.top <= event.clientY &&
				placeholderRect.bottom >= event.clientY
			) {
				return;
			}
		}

		// Find the first task that is not fully above the cursor
		for (const task of Array.from(tasksContainer.children)) {
			const taskElement = task as HTMLElement;
			if (taskElement.getBoundingClientRect().bottom >= event.clientY) {
				// Don't change if insertion point is already the placeholder
				if (taskElement === existingPlaceholder) return;

				// Remove existing placeholder before inserting at new position
				// This prevents layout flicker
				existingPlaceholder?.remove();

				// Don't show placeholder if dropping at original position
				if (taskElement === draggedTask || taskElement.previousElementSibling === draggedTask) {
					return;
				}

				// Insert placeholder at this position
				tasksContainer.insertBefore(
					existingPlaceholder ?? makePlaceholder(draggedTask),
					taskElement
				);
				return;
			}
		}

		// All tasks are above cursor, insert at end
		existingPlaceholder?.remove();
		if (tasksContainer.lastElementChild === draggedTask) return;
		tasksContainer.append(existingPlaceholder ?? makePlaceholder(draggedTask));
	}

	let dragGhost = $state<HTMLElement | null>(null);
	let dragOffset = $state<{ x: number; y: number } | null>(null);
	let isDragging = $state(false);

	function handleDragStart(event: DragEvent, itemId: number) {
		console.log('[Kanban] Drag started for item:', itemId);
		const target = event.currentTarget as HTMLElement;
		
		// Set ID on dragged task (MDN pattern)
		target.id = 'dragged-task';
		isDragging = true;
		
		// Create drag ghost that follows cursor
		const ghost = target.cloneNode(true) as HTMLElement;
		ghost.id = 'drag-ghost';
		ghost.className = 'drag-ghost';
		ghost.style.position = 'fixed';
		ghost.style.pointerEvents = 'none';
		ghost.style.zIndex = '10000';
		ghost.style.opacity = '0.9';
		ghost.style.transform = 'scale(1.1)';
		ghost.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.15)';
		ghost.style.width = `${target.offsetWidth}px`;
		ghost.style.transition = 'none';
		
		// Calculate offset from mouse to card top-left
		const rect = target.getBoundingClientRect();
		const offsetX = event.clientX - rect.left;
		const offsetY = event.clientY - rect.top;
		
		// Set initial position
		ghost.style.left = `${event.clientX - offsetX}px`;
		ghost.style.top = `${event.clientY - offsetY}px`;
		
		document.body.appendChild(ghost);
		dragGhost = ghost;
		dragOffset = { x: offsetX, y: offsetY };
		
		// Track mouse position globally during drag
		let mouseX = event.clientX;
		let mouseY = event.clientY;
		
		// Update ghost position using requestAnimationFrame for smooth updates
		function updateGhostPosition() {
			if (dragGhost && dragOffset && isDragging) {
				dragGhost.style.left = `${mouseX - dragOffset.x}px`;
				dragGhost.style.top = `${mouseY - dragOffset.y}px`;
				requestAnimationFrame(updateGhostPosition);
			}
		}
		
		// Track mouse position during drag
		function trackMousePosition(e: DragEvent | MouseEvent) {
			mouseX = e.clientX;
			mouseY = e.clientY;
		}
		
		// Start animation loop
		requestAnimationFrame(updateGhostPosition);
		
		// Update on dragover (fires continuously during drag)
		document.addEventListener('dragover', trackMousePosition);
		document.addEventListener('drag', trackMousePosition);
		
		// Store cleanup function for dragend
		(target as any).__dragCleanup = () => {
			isDragging = false;
			document.removeEventListener('dragover', trackMousePosition);
			document.removeEventListener('drag', trackMousePosition);
			if (dragGhost && document.body.contains(dragGhost)) {
				document.body.removeChild(dragGhost);
			}
			dragGhost = null;
			dragOffset = null;
		};
		
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			// Custom type to identify a task drag
			event.dataTransfer.setData('task', '');
			
			// Create invisible drag image (we'll use the ghost instead)
			const emptyImg = document.createElement('img');
			emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
			event.dataTransfer.setDragImage(emptyImg, 0, 0);
		}
	}

	function handleDragEnd(event: DragEvent) {
		const target = event.currentTarget as HTMLElement;
		// Remove ID attribute (MDN pattern)
		target.removeAttribute('id');
		
		// Run cleanup if stored
		if ((target as any).__dragCleanup) {
			(target as any).__dragCleanup();
		}
		
		// Remove all placeholders
		document.querySelectorAll('.placeholder').forEach(placeholder => {
			placeholder.remove();
		});
	}

	function handleDragOver(event: DragEvent) {
		// Test for custom type we set in dragstart
		// Only allow dropping if dragging a task (MDN pattern)
		if (event.dataTransfer?.types.includes('task')) {
			event.preventDefault();
			movePlaceholder(event);
		}
	}

	function handleDragLeave(event: DragEvent) {
		const column = event.currentTarget as HTMLElement;
		// If we are moving into a child element, we aren't actually leaving the column
		// This prevents placeholder from flickering when moving between child elements
		const relatedTarget = event.relatedTarget as HTMLElement | null;
		if (column.contains(relatedTarget)) return;

		// Remove placeholder when leaving column entirely
		const placeholder = column.querySelector('.placeholder');
		placeholder?.remove();
	}

	async function handleDrop(event: DragEvent, column: KanbanStatus) {
		event.preventDefault();
		
		const dropStartTime = performance.now();
		console.log('[Kanban] ========== DROP STARTED ==========');
		console.log('[Kanban] Dropping into column:', column);

		const columnElement = event.currentTarget as HTMLElement;
		const draggedTask = document.getElementById('dragged-task') as HTMLElement | null;
		if (!draggedTask) {
			console.log('[Kanban] ERROR: No dragged task found');
			return;
		}

		const placeholder = columnElement.querySelector('.placeholder') as HTMLElement | null;
		if (!placeholder) {
			console.log('[Kanban] ERROR: No placeholder found');
			return;
		}

		const itemId = Number(draggedTask.getAttribute('data-item-id'));
		console.log('[Kanban] Item ID:', itemId);
		
		const item = workItems.find((i) => i.id === itemId);
		if (!item) {
			console.log('[Kanban] ERROR: Item not found in workItems');
			cleanupDrag(draggedTask);
			isOptimisticUpdate = false;
			return;
		}
		
		console.log('[Kanban] Current item status:', item.kanban_status, '-> New status:', column);

		const tasksContainer = columnElement.querySelector('[data-tasks]') as HTMLElement;
		if (!tasksContainer) {
			cleanupDrag(draggedTask);
			isOptimisticUpdate = false;
			return;
		}

		// Get all items in target column (excluding the dragged item)
		const itemsInTargetColumn = itemsByStatus[column].filter(i => i.id !== itemId);
		
		// Check if we're reordering within the same column or moving to a different column
		const isReorder = item.kanban_status === column;

		// Find insertion index from placeholder position
		// Count how many non-dragged items are before the placeholder
		let targetIndex = 0;
		for (const child of Array.from(tasksContainer.children)) {
			if (child === placeholder) {
				break;
			}
			// Count non-dragged items (skip placeholder and dragged task)
			if (child !== draggedTask && !child.classList.contains('placeholder')) {
				targetIndex++;
			}
		}
		
		// If placeholder not found, append at end
		if (!tasksContainer.contains(placeholder)) {
			targetIndex = itemsInTargetColumn.length;
		}

		// CRITICAL: Set optimistic update flag FIRST to block store subscriptions
		// This ensures the card stays in the new lane and isn't overwritten by stale store data
		isOptimisticUpdate = true;
		
		// Hide the dragged task element immediately to prevent visual glitch
		// This prevents it from appearing in its original location during re-render
		draggedTask.style.display = 'none';
		
		// Do optimistic update with forced reactivity
		const stateUpdateStart = performance.now();
		console.log('[Kanban] Starting optimistic update...');
		
		const itemOrders: Array<{ id: number; kanban_order: number }> = [];
		
		console.log('[Kanban] Target index:', targetIndex, 'Reorder:', isReorder);
		
		// Calculate new kanban_order for all affected items
		if (isReorder) {
			const newOrder = [...itemsInTargetColumn];
			newOrder.splice(targetIndex, 0, item);
			newOrder.forEach((item, index) => {
				itemOrders.push({ id: item.id, kanban_order: index });
			});
		} else {
			itemsInTargetColumn.forEach((existingItem, index) => {
				if (index >= targetIndex) {
					itemOrders.push({ id: existingItem.id, kanban_order: index + 1 });
				} else {
					itemOrders.push({ id: existingItem.id, kanban_order: index });
				}
			});
			itemOrders.push({ id: itemId, kanban_order: targetIndex });
		}
		
		// Update workItems optimistically with FORCED new array reference
		// Create completely new array to force Svelte reactivity
		// IMMEDIATELY update status to new column - card must stay in new lane
		const updatedItems: UnifiedPlanningItem[] = [];
		for (const i of workItems) {
			const orderUpdate = itemOrders.find(o => o.id === i.id);
			if (i.id === itemId) {
				// Update dragged item - IMMEDIATELY change status to new column
				updatedItems.push({ ...i, kanban_status: column, kanban_order: targetIndex });
			} else if (orderUpdate && i.kanban_status === column) {
				// Update items in target column
				updatedItems.push({ ...i, kanban_order: orderUpdate.kanban_order });
			} else {
				updatedItems.push(i);
			}
		}
		
		// Assign completely new array - this MUST trigger reactivity
		// The card will now appear in the new lane immediately
		workItems = updatedItems;
		workItemsVersion++;  // Force $derived recalculation
		
		const stateUpdateEnd = performance.now();
		console.log(`[Kanban] ✅ Optimistic update completed in ${(stateUpdateEnd - stateUpdateStart).toFixed(2)}ms`);
		console.log(`[Kanban] Updated item ${itemId} status:`, updatedItems.find(i => i.id === itemId)?.kanban_status);
		console.log(`[Kanban] All items:`, updatedItems.map(i => `${i.id}:${i.kanban_status}`).join(', '));
		
		// Wait for Svelte to process the state update and re-render
		// This ensures the element appears in the new location before we clean up
		await tick();
		
		// Cleanup DOM immediately
		console.log('[Kanban] Starting DOM cleanup...');
		const cleanupStart = performance.now();
		
		// Cleanup drag ghost
		if ((draggedTask as any).__dragCleanup) {
			(draggedTask as any).__dragCleanup();
		}
		
		// Remove placeholder and all other placeholders
		placeholder.remove();
		document.querySelectorAll('.placeholder').forEach(p => p.remove());
		
		// Remove ID so styling resets
		// Find the element in its new location (Svelte may have moved it)
		const newLocationTask = document.querySelector(`[data-item-id="${itemId}"]`) as HTMLElement | null;
		if (newLocationTask) {
			// Element is in new location - remove ID and restore display
			// Card is now visible in the new lane
			newLocationTask.removeAttribute('id');
			newLocationTask.style.display = '';
		} else if (document.body.contains(draggedTask)) {
			// Fallback: element still in old location (shouldn't happen, but handle gracefully)
			draggedTask.removeAttribute('id');
			draggedTask.style.display = '';
		}
		
		const cleanupEnd = performance.now();
		console.log(`[Kanban] ✅ DOM cleanup completed in ${(cleanupEnd - cleanupStart).toFixed(2)}ms`);
		
		const totalTime = performance.now() - dropStartTime;
		console.log(`[Kanban] ========== DROP COMPLETED in ${totalTime.toFixed(2)}ms ==========`);
		console.log('[Kanban] Card is now in new lane, starting DB sync...');

		// Call API and update UI after success
		let result;
		try {
			if (item.type === 'work_item') {
				if (isReorder) {
					result = await taskService.reorderWorkItems(itemOrders, column);
				} else {
					const statusResult = await taskService.updateWorkItemKanbanStatus(itemId, column);
					if (statusResult.success && itemOrders.length > 0) {
						result = await taskService.reorderWorkItems(itemOrders, column);
					} else {
						result = statusResult;
					}
				}
			} else if (item.type === 'case_task') {
				const { updateCaseTaskKanbanStatus, reorderCaseTasks } = await import('$lib/services/caseService');
				if (isReorder) {
					result = await reorderCaseTasks(itemOrders, column);
				} else {
					const statusResult = await updateCaseTaskKanbanStatus(itemId, column);
					if (statusResult.success && itemOrders.length > 0) {
						result = await reorderCaseTasks(itemOrders, column);
					} else {
						result = statusResult;
					}
				}
			} else {
				toastStore.add('Onbekend item type', 'error');
				isOptimisticUpdate = false;
				return;
			}

			if (result.success) {
				console.log('[Kanban] ✅ DB sync succeeded - card status persisted');
				toastStore.add(isReorder ? 'Volgorde bijgewerkt' : 'Taak verplaatst', 'success');
				
				// Keep isOptimisticUpdate = true until store confirms the DB change
				// Set tracking variables so store subscription knows what to expect
				optimisticItemId = itemId;
				optimisticExpectedStatus = column;
				console.log(`[Kanban] Waiting for store to confirm DB update: item ${itemId} status=${column}`);
				console.log(`[Kanban] Card remains in new lane, isOptimisticUpdate=${isOptimisticUpdate} (will clear when store confirms)`);
				
				// Note: isOptimisticUpdate stays true until store subscription confirms the change
				// This ensures the card stays in the new lane and isn't overwritten by stale data
			} else {
				console.log('[Kanban] ❌ DB sync failed, reverting optimistic update');
				toastStore.add(getUserMessage(result.error), 'error');
				// Revert: clear optimistic flag and reload correct state from DB
				isOptimisticUpdate = false;
				optimisticItemId = null;
				optimisticExpectedStatus = null;
				// Reload to get correct state - card will move back to original lane
				await loadWorkItems(false);
			}
		} catch (error) {
			console.error('[Kanban] ❌ Error during DB sync:', error);
			toastStore.add('Fout bij verplaatsen van taak', 'error');
			// Revert: clear optimistic flag and reload correct state
			isOptimisticUpdate = false;
			optimisticItemId = null;
			optimisticExpectedStatus = null;
			await loadWorkItems(false);
		}
	}

	function cleanupDrag(draggedTask: HTMLElement | null) {
		if (!draggedTask) return;
		
		// Run cleanup if stored (handles drag ghost)
		if ((draggedTask as any).__dragCleanup) {
			(draggedTask as any).__dragCleanup();
		}
		// Remove ID attribute if element still exists
		if (document.body.contains(draggedTask)) {
			draggedTask.removeAttribute('id');
		}
		// Remove all placeholders
		document.querySelectorAll('.placeholder').forEach(placeholder => {
			placeholder.remove();
		});
	}

</script>

<style>
	/* Grab cursor - inspired by the drag-me example */
	:global(.draggable-task),
	:global([draggable="true"].task) {
		cursor: url('https://www.google.com/intl/en_ALL/mapfiles/openhand.cur'), all-scroll !important;
		cursor: -webkit-grab !important;
		cursor: -moz-grab !important;
		cursor: -o-grab !important;
		cursor: -ms-grab !important;
		cursor: grab !important;
		transition: box-shadow 0.2s ease,
		            border-radius 0.2s ease;
	}

	/* Grabbing cursor when actively dragging */
	:global(.draggable-task:active),
	:global([draggable="true"].task:active),
	:global(#dragged-task) {
		cursor: url('https://www.google.com/intl/en_ALL/mapfiles/closedhand.cur'), all-scroll !important;
		cursor: -webkit-grabbing !important;
		cursor: -moz-grabbing !important;
		cursor: -o-grabbing !important;
		cursor: -ms-grabbing !important;
		cursor: grabbing !important;
	}

	/* Hover effect - subtle shadow enhancement only */
	:global(.draggable-task:hover:not(#dragged-task)),
	:global([draggable="true"].task:hover:not(#dragged-task)) {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08),
		            0 1px 2px rgba(0, 0, 0, 0.06) !important;
	}

	/* Grayed out dragged task (MDN pattern) */
	/* This provides visual feedback that the task is being moved */
	:global(#dragged-task) {
		opacity: 0.5 !important;
		transform: scale(0.95) !important;
		transition: opacity 0.2s ease,
		            transform 0.2s ease;
	}

	/* Prevent interactions while dragging */
	:global(#dragged-task *) {
		pointer-events: none !important;
	}

	/* Drag ghost that follows cursor */
	:global(.drag-ghost) {
		transition: none !important;
		will-change: transform, top, left;
	}

	/* Placeholder styling (MDN pattern) - BOLD and clearly visible drop indicator */
	:global(.placeholder) {
		border: 4px solid rgb(234 88 12) !important; /* orange-600 - BOLD solid border */
		border-radius: 0.5rem; /* rounded-lg */
		background-color: rgb(255 237 213) !important; /* orange-100 - visible background */
		margin-bottom: 0.5rem !important; /* space-y-2 */
		pointer-events: none !important; /* Prevent placeholder from interfering with drag events */
		min-height: 80px !important; /* Ensure minimum visible height */
		width: 100% !important; /* Full width like cards */
		box-sizing: border-box !important; /* Include border in width calculation */
		opacity: 1 !important; /* Fully opaque */
		position: relative !important;
		display: block !important;
		box-shadow: 0 0 0 2px rgb(234 88 12), inset 0 0 0 1px rgb(249 115 22) !important; /* Double border effect for visibility */
		animation: placeholder-pulse 1.5s ease-in-out infinite;
	}

	/* Pulse animation to draw attention to drop zone */
	@keyframes placeholder-pulse {
		0%, 100% {
			border-color: rgb(234 88 12); /* orange-600 */
			background-color: rgb(255 237 213); /* orange-100 */
			box-shadow: 0 0 0 2px rgb(234 88 12), inset 0 0 0 1px rgb(249 115 22);
		}
		50% {
			border-color: rgb(194 65 12); /* orange-700 - darker on pulse */
			background-color: rgb(254 215 170); /* orange-200 - darker */
			box-shadow: 0 0 0 3px rgb(194 65 12), inset 0 0 0 1px rgb(234 88 12);
		}
	}

	/* Task container - grab cursor on hover (MDN pattern) */
	/* Apply to all elements inside task, overriding any Tailwind cursor classes */
	:global(.task),
	:global(.task *),
	:global(.task > div),
	:global(.task > div *),
	:global(.task.cursor-pointer),
	:global(.task * .cursor-pointer),
	:global(.task > div.cursor-pointer) {
		cursor: grab !important;
		user-select: none;
		-webkit-user-select: none;
	}

	/* Show grabbing cursor when actively dragging (MDN pattern) */
	:global(.task:active),
	:global(.task:active *) {
		cursor: grabbing !important;
	}

	/* Only actual buttons and links inside task should show pointer cursor */
	:global(.task button),
	:global(.task [type="button"]),
	:global(.task a),
	:global(.task input),
	:global(.task select),
	:global(.task textarea),
	:global(.task [data-button]),
	:global(.task [data-clickable="true"]),
	:global(.task button *),
	:global(.task a *) {
		cursor: pointer !important;
	}

	/* Ensure nested interactive elements show pointer */
	:global(.task :global(button)),
	:global(.task :global(a)) {
		cursor: pointer !important;
	}

	/* Smooth transitions for card movements (optimistic UI) */
	/* Disabled during drag for instant updates - transitions only apply when not dragging */
	:global(.task:not(#dragged-task)) {
		transition: transform 0.2s ease-out, opacity 0.2s ease-out;
	}

	/* No transition during drag - instant update like toast */
	:global(.task#dragged-task),
	:global(.task.dragging) {
		transition: none !important;
	}

	/* Container for smooth list transitions */
	.task-column [data-tasks] {
		/* No transitions - instant updates for better drag performance */
		transition: none;
	}

	/* Make AOS animations more subtle for kanban columns */
	[data-aos-id-kanban-columns] [data-aos] {
		/* Reduce animation distance for more subtle effect */
		transition-duration: 400ms !important;
		transition-timing-function: ease-out !important;
	}

	/* Override AOS default transforms to make them more subtle */
	[data-aos-id-kanban-columns] [data-aos="fade-left"]:not(.aos-animate) {
		transform: translateX(20px) !important;
		opacity: 0;
	}

	[data-aos-id-kanban-columns] [data-aos="fade-right"]:not(.aos-animate) {
		transform: translateX(-20px) !important;
		opacity: 0;
	}

	[data-aos-id-kanban-columns] [data-aos="fade-up"]:not(.aos-animate) {
		transform: translateY(20px) !important;
		opacity: 0;
	}

	[data-aos-id-kanban-columns] [data-aos="fade-down"]:not(.aos-animate) {
		transform: translateY(-20px) !important;
		opacity: 0;
	}
</style>


<div class="space-y-4 {className}">
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-16rem)]" data-aos-id-kanban-columns>
			{#each columns as column, index (column.id)}
				<div
					role="region"
					aria-label="Dropzone voor {column.label}"
					class="task-column bg-white rounded-lg border-2 border-dotted border-zinc-300 p-3 h-full flex flex-col transition-all duration-200"
					data-aos={getColumnAOSAnimation(index)}
					data-aos-anchor="[data-aos-id-kanban-columns]"
					data-aos-delay={index * 50}
					data-aos-duration="400"
					data-aos-easing="ease-out-cubic"
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={(e) => handleDrop(e, column.id)}
				>
					<!-- Column header -->
					<div class="flex items-center justify-between mb-3">
						<h3 class="text-sm font-semibold text-zinc-900">{column.label}</h3>
						<div class="flex items-center gap-2">
							<Label variant="default" class="text-xs">
								{itemsByStatus[column.id].length}
							</Label>
							{#if column.id === 'afgerond'}
								<button
									type="button"
									onclick={navigateToArchive}
									class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
									title="Bekijk archief van afgesloten taken ({closedTotalHours} uur afgesloten)"
								>
									<Clock size={12} />
									<span>{closedTotalHours}u</span>
								</button>
							{/if}
						</div>
					</div>

					<!-- Work items in this column -->
					<div 
						class="space-y-2 flex-1 overflow-y-auto" 
						data-tasks
						data-column={column.id}
					>
						{#each itemsByStatus[column.id] as item (item.id)}
							<div
								role="button"
								tabindex="0"
								draggable="true"
								data-item-id={item.id}
								class="task draggable-task"
								ondragstart={(e) => handleDragStart(e, item.id)}
								ondragend={handleDragEnd}
							>
							<WorkItemCard
								workItem={item}
								draggable={false}
								onclick={(workItem) => {
									if (onitemclick) {
										onitemclick(workItem);
									}
								}}
								ondelete={(workItem) => {
									// Optimistically remove the closed item from the local state
									workItems = workItems.filter(item => item.id !== workItem.id);
									// Then sync with server in background
									loadWorkItems();
									loadClosedHours();
								}}
							/>
							</div>
						{/each}

						<!-- Empty state -->
						{#if itemsByStatus[column.id].length === 0}
							<div class="text-center py-8 text-sm text-zinc-400">
								Geen taken
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
</div>
