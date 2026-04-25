/**
 * Task Query Cache - Cross-request TTL cache for backlog and planning data
 *
 * Provides 30-second TTL caches for the unified query functions:
 * - getUnifiedBacklogItems() → backlogCache
 * - getUnifiedPlanningItems() → planningCache
 *
 * These caches persist across multiple HTTP requests (unlike requestCache
 * which is per-request). Cache entries expire lazily (checked on read).
 *
 * Invalidated by any task mutation (create, update, delete, close, move, reorder).
 */

import { createCache, type ServerCache } from "$lib/utils/serverCache";
import { type Result } from "$lib/types/result";
import { type AppError } from "$lib/types/errors";

// Re-import the interfaces from taskService for typing the cache values
// We use 'any' here to avoid circular imports — the actual type safety
// comes from the cache setter sites in taskService.ts
type BacklogResult = Result<any[], AppError>;
type PlanningResult = Result<any[], AppError>;

/** 30-second TTL cache for getUnifiedBacklogItems() results */
export const backlogCache: ServerCache<BacklogResult> = createCache<BacklogResult>(30_000);

/** 30-second TTL cache for getUnifiedPlanningItems() results */
export const planningCache: ServerCache<PlanningResult> = createCache<PlanningResult>(30_000);

/**
 * Invalidate all task query caches.
 *
 * Must be called by every mutation function that modifies _bpm_tasks or
 * _bpm_task_assignees: createWorkItem, updateWorkItem, deleteWorkItem,
 * closeWorkItem, moveWorkItemToPlanning, updateWorkItemKanbanStatus,
 * reorderWorkItems, etc.
 */
export function invalidateTaskCaches(): void {
  backlogCache.invalidate("backlog:");
  planningCache.invalidate("planning:");
}
