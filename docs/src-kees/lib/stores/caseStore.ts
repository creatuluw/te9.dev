/**
 * Case store - Manages case data with polling and optimistic updates
 *
 * Provides reactive case data with automatic polling for multi-user synchronization.
 * Supports filtering by status, process_id, and owner_id.
 * Follows standardized store patterns with middleware support.
 * Uses cache-first loading with optimistic updates.
 */
import { createStore, createLoggingMiddleware } from "./storeFactory";
import * as caseService from "$lib/services/caseService";
import { persistentCache } from "$lib/utils/persistentCache";
import { backgroundSyncService } from "$lib/services/backgroundSyncService";
import type { Case } from "$lib/schemas/case";
import type { CreateCaseInput } from "$lib/schemas/case";
import type { UpdateCaseInput } from "$lib/schemas/case";

interface CaseStoreData {
  cases: Case[];
  lastFetch: number | null;
  loading: boolean;
  syncing: boolean; // Background sync in progress
}

interface CaseStore {
  subscribe: (callback: (data: CaseStoreData) => void) => () => void;
  refresh: (
    filters?: { status?: string; process_id?: number; owner_id?: string },
    showLoading?: boolean,
  ) => Promise<void>;
  createCase: (data: CreateCaseInput & { process_id: number }) => Promise<Case>; // Optimistic create
  updateCase: (id: number, data: UpdateCaseInput) => Promise<void>; // Optimistic update
  deleteCase: (id: number) => Promise<void>; // Optimistic delete
  removeCase: (caseId: number) => void;
  startPolling: (
    interval?: number,
    filters?: { status?: string; process_id?: number; owner_id?: string },
  ) => void;
  stopPolling: () => void;
  reset: () => void;
  getValue: () => CaseStoreData;
  initialize: (cases: Case[]) => void; // Initialize with SSR data
}

/**
 * Create case store
 *
 * @returns Case store instance
 */
function createCaseStore(): CaseStore {
  const store = createStore<CaseStoreData>({
    initialValue: {
      cases: [],
      lastFetch: null,
      loading: false,
      syncing: false,
    },
    name: "case",
    middleware: [createLoggingMiddleware("case")],
  });

  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let currentFilters:
    | { status?: string; process_id?: number; owner_id?: string }
    | undefined = undefined;
  let isPolling = false;

  // Load from persistent cache on initialization
  const cacheKey = "cases:all";
  const cachedCases = persistentCache.get<Case[]>(cacheKey);
  if (cachedCases && cachedCases.length > 0) {
    store.set({
      cases: cachedCases,
      lastFetch: Date.now(),
      loading: false,
      syncing: false,
    });
  }

  return {
    subscribe: store.subscribe,

    /**
     * Refresh case data (loads from cache first, then server)
     *
     * @param filters - Optional filters for status, process_id, or owner_id
     * @param showLoading - Whether to show loading state (default: false for silent refresh)
     *
     * @example
     * ```typescript
     * await caseStore.refresh({ status: 'mee_bezig' }, true); // Show loading
     * await caseStore.refresh(); // Silent refresh with no filters
     * ```
     */
    async refresh(
      filters?: { status?: string; process_id?: number; owner_id?: string },
      showLoading = false,
    ): Promise<void> {
      if (isPolling) return; // Prevent concurrent polls
      isPolling = true;

      // 1. Load from cache immediately (if available)
      const cacheKey = filters
        ? `cases:filtered:${JSON.stringify(filters)}`
        : "cases:all";
      const cached = persistentCache.get<Case[]>(cacheKey);

      if (cached && cached.length > 0 && !showLoading) {
        // Use cached data immediately (optimistic)
        store.set({
          cases: cached,
          lastFetch: Date.now(),
          loading: false,
          syncing: true, // Background sync in progress
        });
      } else if (showLoading) {
        store.update((s) => ({ ...s, loading: true }));
      }

      // 2. Fetch from server in background
      const result = await caseService.getAllCases(filters);

      if (result.success) {
        // Update cache
        persistentCache.set(cacheKey, result.value, false);

        // Update store
        const current = store.getValue().cases;
        const currentJson = JSON.stringify(current);
        const newJson = JSON.stringify(result.value);

        if (currentJson !== newJson) {
          store.set({
            cases: result.value,
            lastFetch: Date.now(),
            loading: false,
            syncing: false,
          });
        } else if (showLoading) {
          store.update((s) => ({ ...s, loading: false, syncing: false }));
        } else {
          store.update((s) => ({ ...s, syncing: false }));
        }
      } else {
        console.error("Error loading cases:", result.error);
        if (showLoading) {
          store.update((s) => ({ ...s, loading: false, syncing: false }));
        } else {
          store.update((s) => ({ ...s, syncing: false }));
        }
      }

      isPolling = false;
    },

    /**
     * Create case optimistically
     *
     * @param data - Case creation data
     * @returns Optimistic case (with temporary ID)
     *
     * @example
     * ```typescript
     * const newCase = await caseStore.createCase({
     *   name: 'New Case',
     *   process_id: 1,
     *   start_date: '2025-01-26'
     * });
     * // UI updates immediately!
     * ```
     */
    async createCase(
      data: CreateCaseInput & { process_id: number },
    ): Promise<Case> {
      // Generate temporary ID
      const tempId = Date.now();
      const optimisticCase: Case = {
        ...data,
        id: tempId,
        status: "gepland",
        start_date: data.start_date,
        completion_deadline: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_id: data.owner_id || undefined,
        bijlagen: (data as any).bijlagen || [],
      } as Case;

      // 1. Update cache optimistically
      const cacheKey = "cases:all";
      const cached = persistentCache.get<Case[]>(cacheKey) || [];
      persistentCache.set(cacheKey, [...cached, optimisticCase], true); // Mark as optimistic

      // 2. Update store immediately
      const current = store.getValue();
      store.set({
        ...current,
        cases: [...current.cases, optimisticCase],
      });

      // 3. Queue mutation for background sync
      persistentCache.queueMutation({
        type: "create",
        entityType: "case",
        data,
      });

      // 4. Start background sync
      backgroundSyncService.sync();

      return optimisticCase;
    },

    /**
     * Update case optimistically
     *
     * @param id - Case ID to update
     * @param data - Partial case data to update
     *
     * @example
     * ```typescript
     * await caseStore.updateCase(123, { status: 'mee_bezig' });
     * // UI updates immediately!
     * ```
     */
    async updateCase(id: number, data: UpdateCaseInput): Promise<void> {
      // 1. Update cache optimistically
      const cacheKey = "cases:all";
      const cached = persistentCache.get<Case[]>(cacheKey) || [];
      const updated = cached.map((c) =>
        c.id === id
          ? { ...c, ...data, updated_at: new Date().toISOString() }
          : c,
      );
      persistentCache.set(cacheKey, updated, true);

      // Mark individual item as optimistic
      persistentCache.set(
        `case:${id}`,
        updated.find((c) => c.id === id),
        true,
      );

      // 2. Update store immediately
      // Normalize owner_id: UpdateCaseInput allows null, but Case expects string | undefined
      const normalizedData = { ...data, owner_id: data.owner_id ?? undefined };
      const current = store.getValue();
      store.set({
        ...current,
        cases: current.cases.map((c) =>
          c.id === id ? { ...c, ...normalizedData } : c,
        ),
      });

      // 3. Queue mutation
      persistentCache.queueMutation({
        type: "update",
        entityType: "case",
        entityId: id,
        data,
      });

      // 4. Sync in background
      backgroundSyncService.sync();
    },

    /**
     * Delete case optimistically
     *
     * @param id - Case ID to delete
     *
     * @example
     * ```typescript
     * await caseStore.deleteCase(123);
     * // UI updates immediately!
     * ```
     */
    async deleteCase(id: number): Promise<void> {
      // 1. Update cache optimistically
      const cacheKey = "cases:all";
      const cached = persistentCache.get<Case[]>(cacheKey) || [];
      persistentCache.set(
        cacheKey,
        cached.filter((c) => c.id !== id),
        true,
      );

      // 2. Update store immediately
      const current = store.getValue();
      store.set({
        ...current,
        cases: current.cases.filter((c) => c.id !== id),
      });

      // 3. Queue mutation
      persistentCache.queueMutation({
        type: "delete",
        entityType: "case",
        entityId: id,
        data: {},
      });

      // 4. Sync in background
      backgroundSyncService.sync();
    },

    /**
     * Remove a case from the store by ID (optimistic update)
     *
     * @param caseId - Case ID to remove
     *
     * @example
     * ```typescript
     * caseStore.removeCase(123); // Immediately remove case 123 from store
     * ```
     */
    removeCase(caseId: number): void {
      const current = store.getValue();
      const updatedCases = current.cases.filter((c) => c.id !== caseId);
      if (updatedCases.length !== current.cases.length) {
        store.set({
          ...current,
          cases: updatedCases,
        });
      }
    },

    /**
     * Start polling for case updates
     *
     * @param interval - Polling interval in milliseconds (default: 30000 = 30 seconds)
     * @param filters - Optional filters for polling
     *
     * @example
     * ```typescript
     * caseStore.startPolling(30000, { status: 'mee_bezig' }); // Poll every 30 seconds
     * ```
     */
    startPolling(
      interval: number = 30000,
      filters?: { status?: string; process_id?: number; owner_id?: string },
    ): void {
      currentFilters = filters;

      // Load from cache immediately
      const cacheKey = filters
        ? `cases:filtered:${JSON.stringify(filters)}`
        : "cases:all";
      const cached = persistentCache.get<Case[]>(cacheKey);
      if (cached && cached.length > 0) {
        store.set({
          cases: cached,
          lastFetch: Date.now(),
          loading: false,
          syncing: true,
        });
      }

      // Refresh from server
      this.refresh(filters);

      // Start background sync service
      backgroundSyncService.start(interval);

      // Clear existing interval if any
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      // Set up polling interval
      pollInterval = setInterval(() => {
        this.refresh(currentFilters); // Silent background refresh
      }, interval);
    },

    /**
     * Stop polling for case updates
     *
     * @example
     * ```typescript
     * caseStore.stopPolling();
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
     * caseStore.reset();
     * ```
     */
    reset(): void {
      store.reset();
      persistentCache.invalidate("cases");
      this.stopPolling();
    },

    /**
     * Initialize store with SSR data
     *
     * @param cases - Cases from server-side render
     *
     * @example
     * ```typescript
     * caseStore.initialize(ssrCases);
     * ```
     */
    initialize(cases: Case[]): void {
      if (cases.length > 0) {
        persistentCache.set("cases:all", cases, false);
        store.set({
          cases,
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
// New code should use caseStore.svelte.ts with $state runes
const legacyStore = createCaseStore();

// Import functions and state from new store for use in legacy store
import {
  caseState,
  refreshCases,
  createCase,
  updateCase,
  deleteCase,
  removeCase,
  startPolling,
  stopPolling,
  resetCases,
  initializeCases,
} from "./caseStore.svelte";

// Re-export from new store for migration
export {
  caseState,
  refreshCases,
  createCase,
  updateCase,
  deleteCase,
  removeCase,
  startPolling,
  stopPolling,
  resetCases,
  initializeCases,
} from "./caseStore.svelte";

// Legacy store instance (deprecated - use caseStore.svelte.ts instead)
export const caseStore = {
  subscribe: legacyStore.subscribe,
  refresh: refreshCases,
  createCase,
  updateCase,
  deleteCase,
  removeCase,
  startPolling,
  stopPolling,
  reset: resetCases,
  initialize: initializeCases,
  getValue: () => ({
    cases: caseState.cases,
    lastFetch: caseState.lastFetch,
    loading: caseState.loading,
    syncing: caseState.syncing,
  }),
};
