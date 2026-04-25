/**
 * Task store - Manages task data with polling and optimistic updates
 *
 * Provides reactive work item data with automatic polling for multi-user synchronization.
 * Supports filtering by assignee and status (planning vs backlog).
 * Follows standardized store patterns with middleware support.
 * Uses cache-first loading with optimistic updates.
 *
 * **Immediate UI Updates:**
 * - All mutations (create, update, delete) update the store immediately
 * - Store updates automatically trigger reactive updates in subscribed components
 * - Kanban board subscribes to planningItems and updates immediately
 * - Backlog page subscribes to backlogItems and updates immediately
 * - Items automatically move between planningItems and backlogItems when status changes
 * - Both lists are updated atomically to prevent UI flickering
 */
import { createStore, createLoggingMiddleware } from "./storeFactory";
import * as taskService from "$lib/services/taskService";
import { persistentCache } from "$lib/utils/persistentCache";
import { backgroundSyncService } from "$lib/services/backgroundSyncService";
import { getCurrentUserId } from "$lib/utils/userUtils";
import type {
  UnifiedPlanningItem,
  UnifiedBacklogItem,
} from "$lib/services/taskService";
import type {
  CreateManualTaskInput,
  CreateHelpTaskInput,
} from "$lib/schemas/task";
import type { UpdateTaskInput } from "$lib/schemas/task";

interface WorkItemStoreData {
  planningItems: UnifiedPlanningItem[];
  backlogItems: UnifiedBacklogItem[];
  lastFetch: number | null;
  loading: boolean;
  syncing: boolean; // Background sync in progress
}

interface WorkItemStore {
  subscribe: (callback: (data: WorkItemStoreData) => void) => () => void;
  getPlanningItems: (
    assigneeId?: string | null,
    showLoading?: boolean,
  ) => Promise<UnifiedPlanningItem[]>;
  getBacklogItems: (
    assigneeId?: string | null,
    showLoading?: boolean,
  ) => Promise<UnifiedBacklogItem[]>;
  createWorkItem: (
    data: CreateManualTaskInput | CreateHelpTaskInput,
  ) => Promise<any>; // Optimistic create
  updateWorkItem: (id: number, data: UpdateTaskInput) => Promise<void>; // Optimistic update
  deleteWorkItem: (id: number) => Promise<void>; // Optimistic delete
  startPolling: (interval?: number, assigneeId?: string | null) => void;
  stopPolling: () => void;
  reset: () => void;
  getValue: () => WorkItemStoreData;
  initialize: (
    planningItems: UnifiedPlanningItem[],
    backlogItems: UnifiedBacklogItem[],
  ) => void; // Initialize with SSR data
}

/**
 * Create work item store
 *
 * @returns Work item store instance
 */
function createWorkItemStore(): WorkItemStore {
  const store = createStore<WorkItemStoreData>({
    initialValue: {
      planningItems: [],
      backlogItems: [],
      lastFetch: null,
      loading: false,
      syncing: false,
    },
    name: "task",
    middleware: [createLoggingMiddleware("task")],
  });

  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let currentAssigneeId: string | null | undefined = undefined;
  let isPolling = false;
  let isFetchingPlanning = false;
  let isFetchingBacklog = false;

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
    store.set({
      planningItems: cachedPlanning || [],
      backlogItems: cachedBacklog || [],
      lastFetch: Date.now(),
      loading: false,
      syncing: false,
    });
  }

  return {
    subscribe: store.subscribe,

    /**
     * Get planning items (for kanban board) - cache-first loading
     *
     * @param assigneeId - Optional assignee filter
     * @param showLoading - Whether to show loading state
     * @returns Array of planning items
     *
     * @example
     * ```typescript
     * const items = await taskStore.getPlanningItems('user123', true);
     * ```
     */
    async getPlanningItems(
      assigneeId?: string | null,
      showLoading = false,
    ): Promise<UnifiedPlanningItem[]> {
      // Prevent multiple simultaneous calls
      if (isFetchingPlanning) {
        return store.getValue().planningItems;
      }

      isFetchingPlanning = true;

      // Only update loading state if not already loading
      // Use untrack to read current state without creating reactive dependency
      const currentState = store.getValue();
      if (!currentState.loading) {
        store.update((s) => ({ ...s, loading: true, syncing: true }));
      }

      // 1. Load from cache immediately (if available)
      const cacheKey = assigneeId
        ? `planningItems:${assigneeId}`
        : "planningItems:all";
      const cached = persistentCache.get<UnifiedPlanningItem[]>(cacheKey);

      if (cached && cached.length > 0) {
        // Use cached data immediately but keep loading state until fetch completes
        store.set({
          ...store.getValue(),
          planningItems: cached,
          lastFetch: Date.now(),
          loading: true, // Keep loading true until fetch completes
          syncing: true,
        });
      }

      try {
        const userId = getCurrentUserId() ?? undefined;
        const result = await taskService.getUnifiedPlanningItems(
          assigneeId,
          userId,
        );

        if (!result) {
          console.error("Error loading planning items: result is undefined");
          store.update((s) => ({ ...s, loading: false, syncing: false }));
          isFetchingPlanning = false;
          return cached || [];
        }

        if (result.success) {
          // Update cache
          persistentCache.set(cacheKey, result.value, false);

          // Compare data before updating store to prevent unnecessary re-renders
          const current = store.getValue().planningItems;
          const currentJson = JSON.stringify(current);
          const newJson = JSON.stringify(result.value);

          if (currentJson !== newJson) {
            // Data changed - update store
            store.set({
              ...store.getValue(),
              planningItems: result.value,
              lastFetch: Date.now(),
              loading: false,
              syncing: false,
            });
          } else {
            // Data unchanged, just clear loading state (minimal update)
            store.update((s) => ({ ...s, loading: false, syncing: false }));
          }

          return result.value;
        } else {
          console.error("Error loading planning items:", result.error);
          store.update((s) => ({ ...s, loading: false, syncing: false }));
          isFetchingPlanning = false;
          return cached || [];
        }
      } catch (error) {
        console.error("Error loading planning items:", error);
        store.update((s) => ({ ...s, loading: false, syncing: false }));
        isFetchingPlanning = false;
        return cached || [];
      } finally {
        isFetchingPlanning = false;
      }
    },

    /**
     * Get backlog items - cache-first loading
     *
     * @param assigneeId - Optional assignee filter
     * @param showLoading - Whether to show loading state
     * @returns Array of backlog items
     *
     * @example
     * ```typescript
     * const items = await taskStore.getBacklogItems('user123', true);
     * ```
     */
    async getBacklogItems(
      assigneeId?: string | null,
      showLoading = false,
    ): Promise<UnifiedBacklogItem[]> {
      // Prevent multiple simultaneous calls
      if (isFetchingBacklog) {
        return store.getValue().backlogItems;
      }

      isFetchingBacklog = true;

      // Only update loading state if not already loading
      const currentState = store.getValue();
      if (!currentState.loading) {
        store.update((s) => ({ ...s, loading: true, syncing: true }));
      }

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
          store.update((s) => ({ ...s, loading: false, syncing: false }));
          return cached || [];
        }

        if (result.success) {
          // Update cache with complete data (all tasks together)
          persistentCache.set(cacheKey, result.value, false);

          // Only update store if data actually changed
          const current = store.getValue().backlogItems;
          const currentJson = JSON.stringify(current);
          const newJson = JSON.stringify(result.value);

          if (currentJson !== newJson) {
            store.set({
              ...store.getValue(),
              backlogItems: result.value,
              lastFetch: Date.now(),
              loading: false,
              syncing: false,
            });
          } else {
            // Data unchanged, just clear loading state
            store.update((s) => ({ ...s, loading: false, syncing: false }));
          }

          return result.value;
        } else {
          console.error("Error loading backlog items:", result.error);
          store.update((s) => ({ ...s, loading: false, syncing: false }));
          isFetchingBacklog = false;
          return cached || [];
        }
      } catch (error) {
        console.error("Error loading backlog items:", error);
        store.update((s) => ({ ...s, loading: false, syncing: false }));
        isFetchingBacklog = false;
        return cached || [];
      } finally {
        isFetchingBacklog = false;
      }
    },

    /**
     * Create work item optimistically
     *
     * @param data - Work item creation data
     * @returns Optimistic work item (with temporary ID)
     *
     * @example
     * ```typescript
     * const newItem = await taskStore.createWorkItem({
     *   subject: 'New Task',
     *   status: 'backlog'
     * });
     * // UI updates immediately!
     * ```
     */
    async createWorkItem(
      data: CreateManualTaskInput | CreateHelpTaskInput,
    ): Promise<any> {
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
          data.kanban_status ||
          (data.status === "backlog" ? "backlog" : "gepland"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignee_id: assigneeId,
        due_date: data.deadline || null,
        deadline: data.deadline || null,
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
        const current = store.getValue();
        store.set({
          ...current,
          backlogItems: [
            ...current.backlogItems,
            optimisticItem as UnifiedBacklogItem,
          ],
        });
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
        const current = store.getValue();
        store.set({
          ...current,
          planningItems: [
            ...current.planningItems,
            optimisticItem as UnifiedPlanningItem,
          ],
        });
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
    },

    /**
     * Update work item optimistically
     *
     * @param id - Work item ID to update
     * @param data - Partial work item data to update
     *
     * @example
     * ```typescript
     * await taskStore.updateWorkItem(123, { status: 'gepland' });
     * // UI updates immediately!
     * ```
     */
    async updateWorkItem(id: number, data: UpdateTaskInput): Promise<void> {
      // 1. Update cache optimistically
      const current = store.getValue();

      // Find item in current data
      const planningItem = current.planningItems.find((item) => item.id === id);
      const backlogItem = current.backlogItems.find((item) => item.id === id);

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
      let newPlanningItems = [...current.planningItems];
      let newBacklogItems = [...current.backlogItems];

      if (movingToPlanning) {
        // Remove from backlog, add to planning
        newBacklogItems = newBacklogItems.filter((item) => item.id !== id);
        newPlanningItems = [
          ...newPlanningItems,
          updated as UnifiedPlanningItem,
        ];

        // Update backlog caches
        for (const cacheKey of allBacklogCacheKeys) {
          const cached =
            persistentCache.get<UnifiedBacklogItem[]>(cacheKey) || [];
          persistentCache.set(
            cacheKey,
            cached.filter((item) => item.id !== id),
            true,
          );
        }

        // Update planning caches
        for (const cacheKey of allPlanningCacheKeys) {
          const cached =
            persistentCache.get<UnifiedPlanningItem[]>(cacheKey) || [];
          // Check if item already exists (shouldn't, but be safe)
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
        newPlanningItems = newPlanningItems.filter((item) => item.id !== id);
        newBacklogItems = [...newBacklogItems, updated as UnifiedBacklogItem];

        // Update planning caches
        for (const cacheKey of allPlanningCacheKeys) {
          const cached =
            persistentCache.get<UnifiedPlanningItem[]>(cacheKey) || [];
          persistentCache.set(
            cacheKey,
            cached.filter((item) => item.id !== id),
            true,
          );
        }

        // Update backlog caches
        for (const cacheKey of allBacklogCacheKeys) {
          const cached =
            persistentCache.get<UnifiedBacklogItem[]>(cacheKey) || [];
          // Check if item already exists (shouldn't, but be safe)
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
        newPlanningItems = newPlanningItems.map((item) =>
          item.id === id ? (updated as UnifiedPlanningItem) : item,
        );

        // Update planning caches
        for (const cacheKey of allPlanningCacheKeys) {
          const cached =
            persistentCache.get<UnifiedPlanningItem[]>(cacheKey) || [];
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
        newBacklogItems = newBacklogItems.map((item) =>
          item.id === id ? (updated as UnifiedBacklogItem) : item,
        );

        // Update backlog caches
        for (const cacheKey of allBacklogCacheKeys) {
          const cached =
            persistentCache.get<UnifiedBacklogItem[]>(cacheKey) || [];
          persistentCache.set(
            cacheKey,
            cached.map((item) =>
              item.id === id ? (updated as UnifiedBacklogItem) : item,
            ),
            true,
          );
        }
      }

      // Update store atomically with both lists
      store.set({
        ...current,
        planningItems: newPlanningItems,
        backlogItems: newBacklogItems,
        lastFetch: Date.now(),
      });

      // Mark individual item as optimistic
      persistentCache.set(`task:${id}`, { id, ...data }, true);

      // 2. Queue mutation
      persistentCache.queueMutation({
        type: "update",
        entityType: "workitem",
        entityId: id,
        data,
      });

      // 3. Sync in background
      backgroundSyncService.sync();
    },

    /**
     * Delete work item optimistically
     *
     * @param id - Work item ID to delete
     *
     * @example
     * ```typescript
     * await taskStore.deleteWorkItem(123);
     * // UI updates immediately!
     * ```
     */
    async deleteWorkItem(id: number): Promise<void> {
      // 1. Update cache optimistically
      const current = store.getValue();

      // Find item in current data to get assignee_id for cache keys
      const planningItem = current.planningItems.find((item) => item.id === id);
      const backlogItem = current.backlogItems.find((item) => item.id === id);
      const sourceItem = planningItem || backlogItem;

      // Update all relevant caches (for different assignee filters)
      // Items might exist in both 'all' and assignee-specific caches
      const assigneeId = sourceItem?.assignee_id;
      const allPlanningCacheKeys = [
        "planningItems:all",
        ...(assigneeId ? [`planningItems:${assigneeId}`] : []),
      ];
      const allBacklogCacheKeys = [
        "backlogItems:all",
        ...(assigneeId ? [`backlogItems:${assigneeId}`] : []),
      ];

      // Remove from all planning caches
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

      // Remove from all backlog caches
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

      // 2. Update store immediately (atomically update both lists)
      store.set({
        ...current,
        planningItems: current.planningItems.filter((item) => item.id !== id),
        backlogItems: current.backlogItems.filter((item) => item.id !== id),
        lastFetch: Date.now(),
      });

      // 3. Queue mutation
      persistentCache.queueMutation({
        type: "delete",
        entityType: "workitem",
        entityId: id,
        data: {},
      });

      // 4. Sync in background
      backgroundSyncService.sync();
    },

    /**
     * Start polling for work item updates
     *
     * @param interval - Polling interval in milliseconds (default: 30000 = 30 seconds)
     * @param assigneeId - Optional assignee filter for polling
     *
     * @example
     * ```typescript
     * taskStore.startPolling(30000, 'user123'); // Poll every 30 seconds for user123
     * ```
     */
    startPolling(interval: number = 30000, assigneeId?: string | null): void {
      currentAssigneeId = assigneeId;

      // Don't load from cache immediately - let getBacklogItems/getPlanningItems handle it
      // This ensures all tasks appear together, not sequentially

      // Load from server (these will handle cache internally)
      this.getPlanningItems(assigneeId);
      this.getBacklogItems(assigneeId);

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
            await this.getPlanningItems(currentAssigneeId);
            await this.getBacklogItems(currentAssigneeId);
          } finally {
            isPolling = false;
          }
        }
      }, interval);
    },

    /**
     * Stop polling for work item updates
     *
     * @example
     * ```typescript
     * taskStore.stopPolling();
     * ```
     */
    stopPolling(): void {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      backgroundSyncService.stop();
    },

    /**
     * Reset the store to initial state
     *
     * @example
     * ```typescript
     * taskStore.reset();
     * ```
     */
    reset(): void {
      store.reset();
      persistentCache.invalidate("planningItems");
      persistentCache.invalidate("backlogItems");
      persistentCache.invalidate("tasks");
      this.stopPolling();
    },

    /**
     * Initialize store with SSR data
     *
     * @param planningItems - Planning items from server-side render
     * @param backlogItems - Backlog items from server-side render
     *
     * @example
     * ```typescript
     * taskStore.initialize(ssrPlanningItems, ssrBacklogItems);
     * ```
     */
    initialize(
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
        store.set({
          planningItems,
          backlogItems,
          lastFetch: Date.now(),
          loading: false,
          syncing: false,
        });
      }
    },

    getValue: store.getValue,
  };
}

// Legacy store for backward compatibility
// New code should use taskStore.svelte.ts with $state runes
const legacyStore = createWorkItemStore();

// Re-export from new store for migration
export {
  taskState,
  getBacklogItems,
  getPlanningItems,
  createWorkItem,
  updateWorkItem,
  deleteWorkItem,
  startPolling,
  stopPolling,
  reset,
  initialize,
} from "./taskStore.svelte";

// Legacy store instance (deprecated - use taskStore.svelte.ts instead)
export const taskStore = legacyStore;
