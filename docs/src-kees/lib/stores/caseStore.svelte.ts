/**
 * Case store - Manages case data with polling and optimistic updates
 *
 * **Svelte 5 Runes Pattern:**
 * Uses $state runes for reactive shared state, following Svelte 5 best practices.
 * Components can directly access state properties reactively without subscribe().
 *
 * Provides reactive case data with automatic polling for multi-user synchronization.
 * Supports filtering by status, process_id, and owner_id.
 * Uses cache-first loading with optimistic updates.
 */

import * as caseService from "$lib/services/caseService";
import { persistentCache } from "$lib/utils/persistentCache";
import { backgroundSyncService } from "$lib/services/backgroundSyncService";
import { createPollManager } from "./migration-utils";
import type { Case } from "$lib/schemas/case";
import type { CreateCaseInput } from "$lib/schemas/case";
import type { UpdateCaseInput } from "$lib/schemas/case";

/**
 * Reactive case state using Svelte 5 $state runes
 * Components can directly access these properties reactively
 */
export const caseState = $state({
  cases: [] as Case[],
  lastFetch: null as number | null,
  loading: false,
  syncing: false,
});

// Internal state for polling
const pollManager = createPollManager();
let currentFilters:
  | { status?: string; process_id?: number; owner_id?: string }
  | undefined = undefined;

// Load from persistent cache on initialization
const cacheKey = "cases:all";
const cachedCases = persistentCache.get<Case[]>(cacheKey);
if (cachedCases && cachedCases.length > 0) {
  caseState.cases = cachedCases;
  caseState.lastFetch = Date.now();
  caseState.loading = false;
  caseState.syncing = false;
}

/**
 * Refresh case data (loads from cache first, then server)
 *
 * @param filters - Optional filters for status, process_id, or owner_id
 * @param showLoading - Whether to show loading state (default: false for silent refresh)
 * @param forceFresh - Force fetch from server, bypassing cache (default: false)
 *
 * @example
 * ```typescript
 * await refreshCases({ status: 'mee_bezig' }, true); // Show loading
 * await refreshCases(); // Silent refresh with no filters
 * await refreshCases(undefined, false, true); // Force fresh from server
 * ```
 */
export async function refreshCases(
  filters?: { status?: string; process_id?: number; owner_id?: string },
  showLoading = false,
  forceFresh = false,
): Promise<void> {
  if (pollManager.isPolling) return; // Prevent concurrent polls

  // 1. Load from cache immediately (if available and not forcing fresh)
  const filterCacheKey = filters
    ? `cases:filtered:${JSON.stringify(filters)}`
    : "cases:all";
  const cached = persistentCache.get<Case[]>(filterCacheKey);

  if (!forceFresh && cached && cached.length > 0 && !showLoading) {
    // Use cached data immediately (optimistic)
    caseState.cases = cached;
    caseState.lastFetch = Date.now();
    caseState.loading = false;
    caseState.syncing = true; // Background sync in progress
  } else if (showLoading || forceFresh) {
    caseState.loading = true;
  }

  // 2. Fetch from server in background
  const result = await caseService.getAllCases(filters);

  if (result.success) {
    // Update cache
    persistentCache.set(filterCacheKey, result.value, false);

    // Update store only if data changed
    const currentJson = JSON.stringify(caseState.cases);
    const newJson = JSON.stringify(result.value);

    if (currentJson !== newJson) {
      caseState.cases = result.value;
      caseState.lastFetch = Date.now();
      caseState.loading = false;
      caseState.syncing = false;
    } else if (showLoading) {
      caseState.loading = false;
      caseState.syncing = false;
    } else {
      caseState.syncing = false;
    }
  } else {
    console.error("Error loading cases:", result.error);
    if (showLoading) {
      caseState.loading = false;
      caseState.syncing = false;
    } else {
      caseState.syncing = false;
    }
  }
}

/**
 * Create case optimistically
 *
 * @param data - Case creation data
 * @returns Optimistic case (with temporary ID)
 *
 * @example
 * ```typescript
 * const newCase = await createCase({
 *   name: 'New Case',
 *   process_id: 1,
 *   start_date: '2025-01-26'
 * });
 * // UI updates immediately!
 * ```
 */
export async function createCase(
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

  // 2. Update state immediately
  caseState.cases = [...caseState.cases, optimisticCase];

  // 3. Queue mutation for background sync
  persistentCache.queueMutation({
    type: "create",
    entityType: "case",
    data,
  });

  // 4. Start background sync
  backgroundSyncService.sync();

  return optimisticCase;
}

/**
 * Update case optimistically
 *
 * @param id - Case ID to update
 * @param data - Partial case data to update
 *
 * @example
 * ```typescript
 * await updateCase(123, { status: 'mee_bezig' });
 * // UI updates immediately!
 * ```
 */
export async function updateCase(
  id: number,
  data: UpdateCaseInput,
): Promise<void> {
  // 1. Update cache optimistically
  const cacheKey = "cases:all";
  const cached = persistentCache.get<Case[]>(cacheKey) || [];
  const updated = cached.map((c) =>
    c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c,
  );
  persistentCache.set(cacheKey, updated, true);

  // Mark individual item as optimistic
  persistentCache.set(
    `case:${id}`,
    updated.find((c) => c.id === id),
    true,
  );

  // 2. Update state immediately
  // Normalize owner_id: UpdateCaseInput allows null, but Case expects string | undefined
  const normalizedData = { ...data, owner_id: data.owner_id ?? undefined };
  caseState.cases = caseState.cases.map((c) =>
    c.id === id ? { ...c, ...normalizedData } : c,
  );

  // 3. Queue mutation
  persistentCache.queueMutation({
    type: "update",
    entityType: "case",
    entityId: id,
    data,
  });

  // 4. Sync in background
  backgroundSyncService.sync();
}

/**
 * Delete case optimistically
 *
 * @param id - Case ID to delete
 *
 * @example
 * ```typescript
 * await deleteCase(123);
 * // UI updates immediately!
 * ```
 */
export async function deleteCase(id: number): Promise<void> {
  // 1. Update cache optimistically
  const cacheKey = "cases:all";
  const cached = persistentCache.get<Case[]>(cacheKey) || [];
  persistentCache.set(
    cacheKey,
    cached.filter((c) => c.id !== id),
    true,
  );

  // 2. Update state immediately
  caseState.cases = caseState.cases.filter((c) => c.id !== id);

  // 3. Queue mutation
  persistentCache.queueMutation({
    type: "delete",
    entityType: "case",
    entityId: id,
    data: {},
  });

  // 4. Sync in background
  backgroundSyncService.sync();
}

/**
 * Remove case from state (without syncing)
 *
 * @param caseId - Case ID to remove
 */
export function removeCase(caseId: number): void {
  caseState.cases = caseState.cases.filter((c) => c.id !== caseId);
}

/**
 * Start polling for case updates
 *
 * @param interval - Polling interval in milliseconds (default: 30000)
 * @param filters - Optional filters for status, process_id, or owner_id
 *
 * @example
 * ```typescript
 * startPolling(30000, { status: 'mee_bezig' });
 * ```
 */
export function startPolling(
  interval: number = 30000,
  filters?: { status?: string; process_id?: number; owner_id?: string },
): void {
  currentFilters = filters;
  pollManager.start(() => refreshCases(filters, false), interval);
  backgroundSyncService.start(interval);
}

/**
 * Stop polling for case updates
 *
 * @example
 * ```typescript
 * stopPolling();
 * ```
 */
export function stopPolling(): void {
  pollManager.stop();
  backgroundSyncService.stop();
}

/**
 * Reset case store to initial state
 *
 * @example
 * ```typescript
 * resetCases();
 * ```
 */
export function resetCases(): void {
  caseState.cases = [];
  caseState.lastFetch = null;
  caseState.loading = false;
  caseState.syncing = false;
  persistentCache.invalidate("cases");
  stopPolling();
}

/**
 * Initialize case store with SSR data
 *
 * @param cases - Cases from server-side rendering
 *
 * @example
 * ```typescript
 * initializeCases(ssrCases);
 * ```
 */
export function initializeCases(cases: Case[]): void {
  if (cases.length > 0) {
    persistentCache.set("cases:all", cases, false);
    caseState.cases = cases;
    caseState.lastFetch = Date.now();
    caseState.loading = false;
    caseState.syncing = false;
  }
}
