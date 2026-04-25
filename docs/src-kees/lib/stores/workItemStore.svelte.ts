/**
 * Work item store - Manages work item data with polling and optimistic updates
 *
 * **Svelte 5 Runes Pattern:**
 * Uses $state runes for reactive shared state, following Svelte 5 best practices.
 * Components can directly access state properties reactively without subscribe().
 *
 * **Immediate UI Updates:**
 * - All mutations (create, update, delete) update the store immediately
 * - Store updates automatically trigger reactive updates in components
 * - Items automatically move between planningItems and backlogItems when status changes
 * - Both lists are updated atomically to prevent UI flickering
 */
import * as taskService from "$lib/services/taskService";
import { persistentCache } from "$lib/utils/persistentCache";
import { backgroundSyncService } from "$lib/services/backgroundSyncService";
import type {
  UnifiedPlanningItem,
  UnifiedBacklogItem,
} from "$lib/services/taskService";
import type { CreateWorkItemInput } from "$lib/schemas/workItem";
import type { UpdateWorkItemInput } from "$lib/schemas/workItem";

/**
 * Reactive work item state using Svelte 5 $state runes
 * Components can directly access these properties reactively
 */
export const workItemState = $state({
  planningItems: [] as UnifiedPlanningItem[],
  backlogItems: [] as UnifiedBacklogItem[],
  lastFetch: null as number | null,
  loading: false,
  syncing: false,
});

// Internal state for polling
let pollInterval: ReturnType<typeof setInterval> | null = null;
let currentAssigneeId: string | null | undefined = undefined;
let isPolling = false;

// Load from persistent cache on initialization
const planningCacheKey = "planningItems:all";
const backlogCacheKey = "backlogItems:all";
const cachedPlanning =
  persistentCache.get<UnifiedPlanningItem[]>(planningCacheKey);
const cachedBacklog =
  persistentCache.get<UnifiedBacklogItem[]>(backlogCacheKey);

if (
  (cachedPlanning && cachedPlanning.length > 0) ||
  (cachedBacklog && cachedBacklog.length > 0)
) {
  workItemState.planningItems = cachedPlanning || [];
  workItemState.backlogItems = cachedBacklog || [];
  workItemState.lastFetch = Date.now();
  workItemState.loading = false;
  workItemState.syncing = false;
}

/**
 * Get planning items (for kanban board) - cache-first loading
 *
 * @param assigneeId - Optional assignee filter
 * @param showLoading - Whether to show loading state
 * @returns Array of planning items
 */
export async function getPlanningItems(
  assigneeId?: string | null,
  showLoading = false,
): Promise<UnifiedPlanningItem[]> {
  // Always show loading indicator when fetching (even from cache)
  workItemState.loading = true;
  workItemState.syncing = true;

  // Don't show cached data immediately - wait for full fetch to complete
  const cacheKey = assigneeId
    ? `planningItems:${assigneeId}`
    : "planningItems:all";
  const cached = persistentCache.get<UnifiedPlanningItem[]>(cacheKey);

  try {
    const result = await taskService.getUnifiedPlanningItems(assigneeId);

    if (!result) {
      console.error("Error loading planning items: result is undefined");
      workItemState.loading = false;
      workItemState.syncing = false;
      return cached || [];
    }

    if (result.success) {
      // Update cache with complete data
      persistentCache.set(cacheKey, result.value, false);

      // Always update store with complete data
      workItemState.planningItems = result.value;
      workItemState.lastFetch = Date.now();
      workItemState.loading = false;
      workItemState.syncing = false;

      return result.value;
    } else {
      console.error("Error loading planning items:", result.error);
      workItemState.loading = false;
      workItemState.syncing = false;
      return cached || [];
    }
  } catch (error) {
    console.error("Error loading planning items:", error);
    workItemState.loading = false;
    workItemState.syncing = false;
    return cached || [];
  }
}

/**
 * Get backlog items - cache-first loading
 *
 * @param assigneeId - Optional assignee filter
 * @param showLoading - Whether to show loading state
 * @returns Array of backlog items
 */
export async function getBacklogItems(
  assigneeId?: string | null,
  showLoading = false,
): Promise<UnifiedBacklogItem[]> {
  // Always show loading indicator when fetching (even from cache)
  workItemState.loading = true;
  workItemState.syncing = true;

  // Don't show cached data immediately - wait for full fetch to complete
  // This ensures all tasks (case tasks + manual tasks) appear together
  const cacheKey = assigneeId
    ? `backlogItems:${assigneeId}`
    : "backlogItems:all";
  const cached = persistentCache.get<UnifiedBacklogItem[]>(cacheKey);

  try {
    const result = await taskService.getUnifiedBacklogItems(assigneeId);

    if (!result) {
      console.error("Error loading backlog items: result is undefined");
      workItemState.loading = false;
      workItemState.syncing = false;
      return cached || [];
    }

    if (result.success) {
      // Update cache with complete data (all tasks together)
      persistentCache.set(cacheKey, result.value, false);

      // Always update store with complete data to ensure all tasks appear together
      workItemState.backlogItems = result.value;
      workItemState.lastFetch = Date.now();
      workItemState.loading = false;
      workItemState.syncing = false;

      return result.value;
    } else {
      console.error("Error loading backlog items:", result.error);
      workItemState.loading = false;
      workItemState.syncing = false;
      return cached || [];
    }
  } catch (error) {
    console.error("Error loading backlog items:", error);
    workItemState.loading = false;
    workItemState.syncing = false;
    return cached || [];
  }
}

/**
 * Create work item optimistically
 *
 * @param data - Work item creation data
 * @returns Optimistic work item (with temporary ID)
 */
export async function createWorkItem(data: CreateWorkItemInput): Promise<any> {
  // Generate temporary ID
  const tempId = Date.now();
  // Handle assignee_id as array (take first assignee for cache key)
  // Destructure to exclude assignee_id from spread (input has string[] but unified types need string)
  const { assignee_id: _inputAssigneeIds, ...restData } = data;
  const assigneeId =
    Array.isArray(_inputAssigneeIds) && _inputAssigneeIds.length > 0
      ? _inputAssigneeIds[0]
      : null;

  const optimisticItem: any = {
    ...restData,
    id: tempId,
    type: "work_item",
    status: data.status || "backlog",
    kanban_status:
      data.kanban_status || (data.status === "backlog" ? "backlog" : "gepland"),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignee_id: assigneeId,
    due_date: data.due_date || null,
    deadline: data.due_date || null,
  };

  // 1. Update cache optimistically
  // Add to backlog if status is backlog, otherwise to planning
  if (data.status === "backlog" || !data.status) {
    const backlogCacheKey = assigneeId
      ? `backlogItems:${assigneeId}`
      : "backlogItems:all";
    const cachedBacklog =
      persistentCache.get<UnifiedBacklogItem[]>(backlogCacheKey) || [];
    persistentCache.set(
      backlogCacheKey,
      [...cachedBacklog, optimisticItem as UnifiedBacklogItem],
      true,
    );

    // Update store immediately
    workItemState.backlogItems = [
      ...workItemState.backlogItems,
      optimisticItem as UnifiedBacklogItem,
    ];
  } else {
    const planningCacheKey = assigneeId
      ? `planningItems:${assigneeId}`
      : "planningItems:all";
    const cachedPlanning =
      persistentCache.get<UnifiedPlanningItem[]>(planningCacheKey) || [];
    persistentCache.set(
      planningCacheKey,
      [...cachedPlanning, optimisticItem as UnifiedPlanningItem],
      true,
    );

    // Update store immediately
    workItemState.planningItems = [
      ...workItemState.planningItems,
      optimisticItem as UnifiedPlanningItem,
    ];
  }

  // 2. Queue mutation for background sync
  persistentCache.queueMutation({
    type: "create",
    entityType: "workitem",
    data,
  });

  // 3. Start background sync
  backgroundSyncService.sync();

  return optimisticItem;
}

/**
 * Update work item optimistically
 *
 * @param id - Work item ID to update
 * @param data - Partial work item data to update
 */
export async function updateWorkItem(
  id: number,
  data: UpdateWorkItemInput,
): Promise<void> {
  // Find item in current data
  const planningItem = workItemState.planningItems.find(
    (item) => item.id === id,
  );
  const backlogItem = workItemState.backlogItems.find((item) => item.id === id);

  // Determine if status is changing and which list it should be in
  const newStatus = data.status;
  const oldStatus = planningItem?.status || backlogItem?.status;

  // Helper to determine if status belongs in planning (gepland or ad-hoc)
  const isPlanningStatus = (status: string | undefined): boolean => {
    return status === "gepland" || status === "ad-hoc";
  };

  // Helper to determine if status belongs in backlog
  const isBacklogStatus = (status: string | undefined): boolean => {
    return status === "backlog";
  };

  const wasInPlanning = !!planningItem;
  const wasInBacklog = !!backlogItem;
  const shouldBeInPlanning = newStatus
    ? isPlanningStatus(newStatus)
    : wasInPlanning || (oldStatus && isPlanningStatus(oldStatus));
  const shouldBeInBacklog = newStatus
    ? isBacklogStatus(newStatus)
    : wasInBacklog || (oldStatus && isBacklogStatus(oldStatus));

  // Determine if item is moving between lists
  const movingToPlanning = !wasInPlanning && shouldBeInPlanning;
  const movingToBacklog = !wasInBacklog && shouldBeInBacklog;
  const stayingInPlanning = wasInPlanning && shouldBeInPlanning;
  const stayingInBacklog = wasInBacklog && shouldBeInBacklog;

  // Get the item to update (from whichever list it's currently in)
  const sourceItem = planningItem || backlogItem;
  if (!sourceItem) {
    // Item not found in store - just queue mutation and sync
    persistentCache.set(`task:${id}`, { id, ...data }, true);
    persistentCache.queueMutation({
      type: "update",
      entityType: "workitem",
      entityId: id,
      data,
    });
    backgroundSyncService.sync();
    return;
  }

  // Create updated item - convert assignee_id from array to string
  const { assignee_id: newAssigneeIds, ...restUpdateData } = data;
  const resolvedAssigneeId =
    Array.isArray(newAssigneeIds) && newAssigneeIds.length > 0
      ? newAssigneeIds[0]
      : (sourceItem?.assignee_id ?? null);
  const updated = {
    ...sourceItem,
    ...restUpdateData,
    assignee_id: resolvedAssigneeId,
    updated_at: new Date().toISOString(),
  };
  const assigneeId = updated.assignee_id;

  // Update all relevant caches (for different assignee filters)
  const allPlanningCacheKeys = [
    "planningItems:all",
    ...(assigneeId ? [`planningItems:${assigneeId}`] : []),
  ];
  const allBacklogCacheKeys = [
    "backlogItems:all",
    ...(assigneeId ? [`backlogItems:${assigneeId}`] : []),
  ];

  // Update store lists atomically
  if (movingToPlanning) {
    // Remove from backlog, add to planning
    workItemState.backlogItems = workItemState.backlogItems.filter(
      (item) => item.id !== id,
    );
    workItemState.planningItems = [
      ...workItemState.planningItems,
      updated as UnifiedPlanningItem,
    ];

    // Update caches
    for (const cacheKey of allBacklogCacheKeys) {
      const cached = persistentCache.get<UnifiedBacklogItem[]>(cacheKey) || [];
      persistentCache.set(
        cacheKey,
        cached.filter((item) => item.id !== id),
        true,
      );
    }
    for (const cacheKey of allPlanningCacheKeys) {
      const cached = persistentCache.get<UnifiedPlanningItem[]>(cacheKey) || [];
      const exists = cached.some((item) => item.id === id);
      if (exists) {
        persistentCache.set(
          cacheKey,
          cached.map((item) =>
            item.id === id ? (updated as UnifiedPlanningItem) : item,
          ),
          true,
        );
      } else {
        persistentCache.set(
          cacheKey,
          [...cached, updated as UnifiedPlanningItem],
          true,
        );
      }
    }
  } else if (movingToBacklog) {
    // Remove from planning, add to backlog
    workItemState.planningItems = workItemState.planningItems.filter(
      (item) => item.id !== id,
    );
    workItemState.backlogItems = [
      ...workItemState.backlogItems,
      updated as UnifiedBacklogItem,
    ];

    // Update caches
    for (const cacheKey of allPlanningCacheKeys) {
      const cached = persistentCache.get<UnifiedPlanningItem[]>(cacheKey) || [];
      persistentCache.set(
        cacheKey,
        cached.filter((item) => item.id !== id),
        true,
      );
    }
    for (const cacheKey of allBacklogCacheKeys) {
      const cached = persistentCache.get<UnifiedBacklogItem[]>(cacheKey) || [];
      const exists = cached.some((item) => item.id === id);
      if (exists) {
        persistentCache.set(
          cacheKey,
          cached.map((item) =>
            item.id === id ? (updated as UnifiedBacklogItem) : item,
          ),
          true,
        );
      } else {
        persistentCache.set(
          cacheKey,
          [...cached, updated as UnifiedBacklogItem],
          true,
        );
      }
    }
  } else if (stayingInPlanning) {
    // Update in place in planning
    workItemState.planningItems = workItemState.planningItems.map((item) =>
      item.id === id ? (updated as UnifiedPlanningItem) : item,
    );

    // Update caches
    for (const cacheKey of allPlanningCacheKeys) {
      const cached = persistentCache.get<UnifiedPlanningItem[]>(cacheKey) || [];
      persistentCache.set(
        cacheKey,
        cached.map((item) =>
          item.id === id ? (updated as UnifiedPlanningItem) : item,
        ),
        true,
      );
    }
  } else if (stayingInBacklog) {
    // Update in place in backlog
    workItemState.backlogItems = workItemState.backlogItems.map((item) =>
      item.id === id ? (updated as UnifiedBacklogItem) : item,
    );

    // Update caches
    for (const cacheKey of allBacklogCacheKeys) {
      const cached = persistentCache.get<UnifiedBacklogItem[]>(cacheKey) || [];
      persistentCache.set(
        cacheKey,
        cached.map((item) =>
          item.id === id ? (updated as UnifiedBacklogItem) : item,
        ),
        true,
      );
    }
  }

  // Mark individual item as optimistic
  persistentCache.set(`task:${id}`, { id, ...data }, true);

  // Queue mutation
  persistentCache.queueMutation({
    type: "update",
    entityType: "workitem",
    entityId: id,
    data,
  });

  // Sync in background
  backgroundSyncService.sync();
}

/**
 * Delete work item optimistically
 *
 * @param id - Work item ID to delete
 */
export async function deleteWorkItem(id: number): Promise<void> {
  // Find item in current data to get assignee_id for cache keys
  const planningItem = workItemState.planningItems.find(
    (item) => item.id === id,
  );
  const backlogItem = workItemState.backlogItems.find((item) => item.id === id);
  const sourceItem = planningItem || backlogItem;

  // Update all relevant caches (for different assignee filters)
  const assigneeId = sourceItem?.assignee_id ?? undefined;
  const allPlanningCacheKeys = [
    "planningItems:all",
    ...(assigneeId ? [`planningItems:${assigneeId}`] : []),
  ];
  const allBacklogCacheKeys = [
    "backlogItems:all",
    ...(assigneeId ? [`backlogItems:${assigneeId}`] : []),
  ];

  // Remove from all caches
  for (const cacheKey of allPlanningCacheKeys) {
    const cached = persistentCache.get<UnifiedPlanningItem[]>(cacheKey);
    if (cached && cached.length > 0) {
      persistentCache.set(
        cacheKey,
        cached.filter((item) => item.id !== id),
        true,
      );
    }
  }
  for (const cacheKey of allBacklogCacheKeys) {
    const cached = persistentCache.get<UnifiedBacklogItem[]>(cacheKey);
    if (cached && cached.length > 0) {
      persistentCache.set(
        cacheKey,
        cached.filter((item) => item.id !== id),
        true,
      );
    }
  }

  // Update store immediately (atomically update both lists)
  workItemState.planningItems = workItemState.planningItems.filter(
    (item) => item.id !== id,
  );
  workItemState.backlogItems = workItemState.backlogItems.filter(
    (item) => item.id !== id,
  );
  workItemState.lastFetch = Date.now();

  // Queue mutation
  persistentCache.queueMutation({
    type: "delete",
    entityType: "workitem",
    entityId: id,
    data: {},
  });

  // Sync in background
  backgroundSyncService.sync();
}

/**
 * Start polling for work item updates
 *
 * @param interval - Polling interval in milliseconds (default: 30000 = 30 seconds)
 * @param assigneeId - Optional assignee filter for polling
 */
export function startPolling(
  interval: number = 30000,
  assigneeId?: string | null,
): void {
  currentAssigneeId = assigneeId;

  // Load from server (these will handle cache internally)
  getPlanningItems(assigneeId);
  getBacklogItems(assigneeId);

  // Start background sync service
  backgroundSyncService.start(interval);

  // Clear existing interval if any
  if (pollInterval) {
    clearInterval(pollInterval);
  }

  // Set up new polling interval
  pollInterval = setInterval(async () => {
    if (!isPolling) {
      isPolling = true;
      try {
        await getPlanningItems(currentAssigneeId);
        await getBacklogItems(currentAssigneeId);
      } finally {
        isPolling = false;
      }
    }
  }, interval);
}

/**
 * Stop polling for work item updates
 */
export function stopPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  backgroundSyncService.stop();
}

/**
 * Reset the store to initial state
 */
export function reset(): void {
  workItemState.planningItems = [];
  workItemState.backlogItems = [];
  workItemState.lastFetch = null;
  workItemState.loading = false;
  workItemState.syncing = false;
  persistentCache.invalidate("planningItems");
  persistentCache.invalidate("backlogItems");
  persistentCache.invalidate("tasks");
  stopPolling();
}

/**
 * Initialize store with SSR data
 *
 * @param planningItems - Planning items from server-side render
 * @param backlogItems - Backlog items from server-side render
 */
export function initialize(
  planningItems: UnifiedPlanningItem[],
  backlogItems: UnifiedBacklogItem[],
): void {
  if (planningItems.length > 0 || backlogItems.length > 0) {
    if (planningItems.length > 0) {
      persistentCache.set("planningItems:all", planningItems, false);
    }
    if (backlogItems.length > 0) {
      persistentCache.set("backlogItems:all", backlogItems, false);
    }
    workItemState.planningItems = planningItems;
    workItemState.backlogItems = backlogItems;
    workItemState.lastFetch = Date.now();
    workItemState.loading = false;
    workItemState.syncing = false;
  }
}
