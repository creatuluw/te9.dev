/**
 * Background Sync Service - Handles optimistic updates and server sync
 *
 * Syncs pending mutations with server and merges server changes with cache
 */

import { persistentCache } from "$lib/utils/persistentCache";
import * as caseService from "$lib/services/caseService";
import * as taskService from "$lib/services/taskService";
import * as projectService from "$lib/services/projectService";
import * as processService from "$lib/services/processService";
import type { Case } from "$lib/schemas/case";
import type { Task } from "$lib/schemas/task";
import type { Project } from "$lib/schemas/project";
import type { Process } from "$lib/services/processService";
import { err, type Result } from "$lib/types/result";
import type { AppError } from "$lib/types/errors";

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
}

class BackgroundSyncService {
  private isSyncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Start background sync (polling + mutation sync)
   */
  start(interval: number = 30000): void {
    if (this.syncInterval) return;

    // Sync immediately
    this.sync();

    // Then sync periodically
    this.syncInterval = setInterval(() => {
      this.sync();
    }, interval);
  }

  /**
   * Stop background sync
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform full sync: process mutations + poll server
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, synced: 0, failed: 0, conflicts: 0 };
    }

    this.isSyncing = true;

    try {
      // 1. Process pending mutations
      const mutationResult = await this.syncMutations();

      // 2. Poll server for updates
      const pollResult = await this.pollServer();

      return {
        success: true,
        synced: mutationResult.synced + pollResult.synced,
        failed: mutationResult.failed + pollResult.failed,
        conflicts: mutationResult.conflicts + pollResult.conflicts,
      };
    } catch (error) {
      console.error("[BackgroundSync] Sync failed:", error);
      return { success: false, synced: 0, failed: 0, conflicts: 0 };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync pending mutations with server
   */
  private async syncMutations(): Promise<{
    synced: number;
    failed: number;
    conflicts: number;
  }> {
    const queue = persistentCache.getMutationQueue();
    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    for (const mutation of queue) {
      // Skip if max retries exceeded
      if (mutation.retries >= 3) {
        failed++;
        persistentCache.removeMutation(mutation.id);
        continue;
      }

      try {
        let result: Result<any, AppError> | undefined;

        switch (mutation.type) {
          case "create":
            result = await this.createEntity(mutation);
            break;
          case "update":
            result = await this.updateEntity(mutation);
            break;
          case "delete":
            result = await this.deleteEntity(mutation);
            break;
        }

        if (result?.success) {
          // Mark cache entry as confirmed
          const cacheKey = this.getCacheKey(
            mutation.entityType,
            mutation.entityId,
          );
          persistentCache.confirm(cacheKey);

          // Also confirm list cache
          const listCacheKey = this.getListCacheKey(mutation.entityType);
          persistentCache.confirm(listCacheKey);

          // Remove from queue
          persistentCache.removeMutation(mutation.id);
          synced++;
        } else {
          // Increment retry count
          persistentCache.incrementRetry(mutation.id);
          failed++;
        }
      } catch (error) {
        console.error(
          `[BackgroundSync] Mutation ${mutation.id} failed:`,
          error,
        );
        persistentCache.incrementRetry(mutation.id);
        failed++;
      }
    }

    return { synced, failed, conflicts };
  }

  /**
   * Poll server for updates and merge with cache
   */
  private async pollServer(): Promise<{
    synced: number;
    failed: number;
    conflicts: number;
  }> {
    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      // Poll all entity types in parallel
      const [casesResult, tasksResult, projectsResult, processesResult] =
        await Promise.all([
          caseService.getAllCases(),
          taskService.getAllWorkItems(),
          projectService.getAllProjects(),
          processService.getAllProcesses(),
        ]);

      // Merge cases
      if (casesResult.success) {
        const merged = this.mergeEntities(
          "cases:all",
          casesResult.value,
          "case",
        );
        synced += merged.synced;
        conflicts += merged.conflicts;
      } else {
        failed++;
      }

      // Merge tasks/work items
      if (tasksResult.success) {
        const merged = this.mergeEntities(
          "tasks:all",
          tasksResult.value,
          "task",
        );
        synced += merged.synced;
        conflicts += merged.conflicts;
      } else {
        failed++;
      }

      // Merge projects
      if (projectsResult.success) {
        const merged = this.mergeEntities(
          "projects:all",
          projectsResult.value,
          "project",
        );
        synced += merged.synced;
        conflicts += merged.conflicts;
      } else {
        failed++;
      }

      // Merge processes
      if (processesResult.success) {
        const merged = this.mergeEntities(
          "processes:all",
          processesResult.value,
          "process",
        );
        synced += merged.synced;
        conflicts += merged.conflicts;
      } else {
        failed++;
      }
    } catch (error) {
      console.error("[BackgroundSync] Poll failed:", error);
      failed++;
    }

    return { synced, failed, conflicts };
  }

  /**
   * Merge server data with cache (conflict resolution)
   */
  private mergeEntities<T extends { id: number; updated_at?: string }>(
    cacheKey: string,
    serverData: T[],
    entityType: "case" | "task" | "project" | "process" | "workitem",
  ): { synced: number; conflicts: number } {
    const cached = persistentCache.get<T[]>(cacheKey) || [];
    const cachedMap = new Map(cached.map((item) => [item.id, item]));
    const serverMap = new Map(serverData.map((item) => [item.id, item]));

    let synced = 0;
    let conflicts = 0;

    // Merge strategy: server wins for conflicts, but preserve optimistic updates
    const merged: T[] = [];

    // Add/update from server
    for (const serverItem of serverData) {
      const cachedItem = cachedMap.get(serverItem.id);

      if (!cachedItem) {
        // New item from server
        merged.push(serverItem);
        synced++;
      } else {
        // Check if cached item is optimistic
        const itemCacheKey = this.getCacheKey(entityType, serverItem.id);
        const isOptimistic = persistentCache.isOptimistic(itemCacheKey);

        if (isOptimistic) {
          // Keep optimistic version (user's changes take priority)
          merged.push(cachedItem);
          conflicts++;
        } else {
          // Server wins (use server version)
          merged.push(serverItem);
          synced++;
        }
      }
    }

    // Keep optimistic creates that aren't on server yet
    for (const cachedItem of cached) {
      if (!serverMap.has(cachedItem.id)) {
        const itemCacheKey = this.getCacheKey(entityType, cachedItem.id);
        if (persistentCache.isOptimistic(itemCacheKey)) {
          merged.push(cachedItem);
        }
      }
    }

    // Update cache
    persistentCache.set(cacheKey, merged, false);

    return { synced, conflicts };
  }

  /**
   * Create entity (for mutation sync)
   */
  private async createEntity(mutation: any): Promise<Result<any, AppError>> {
    switch (mutation.entityType) {
      case "case":
        return err(
          new Error(
            "Case creation from background sync is not supported",
          ) as AppError,
        );
      case "task":
      case "workitem":
        return await taskService.createWorkItem(mutation.data);
      case "project":
        return await projectService.createProject(mutation.data);
      case "process":
        return await processService.createProcess(mutation.data);
      default:
        return err(new Error("Unknown entity type") as AppError);
    }
  }

  /**
   * Update entity (for mutation sync)
   */
  private async updateEntity(mutation: any): Promise<Result<any, AppError>> {
    if (!mutation.entityId) {
      return err(new Error("Entity ID required for update") as AppError);
    }

    switch (mutation.entityType) {
      case "case":
        return await caseService.updateCase(mutation.entityId, mutation.data);
      case "task":
      case "workitem":
        return await taskService.updateWorkItem(
          mutation.entityId,
          mutation.data,
        );
      case "project":
        return await projectService.updateProject(
          mutation.entityId,
          mutation.data,
        );
      case "process":
        return await processService.updateProcess(
          mutation.entityId,
          mutation.data,
        );
      default:
        return err(new Error("Unknown entity type") as AppError);
    }
  }

  /**
   * Delete entity (for mutation sync)
   */
  private async deleteEntity(mutation: any): Promise<Result<any, AppError>> {
    if (!mutation.entityId) {
      return err(new Error("Entity ID required for delete") as AppError);
    }

    switch (mutation.entityType) {
      case "case":
        return await caseService.deleteCase(mutation.entityId);
      case "task":
      case "workitem":
        return await taskService.deleteWorkItem(mutation.entityId);
      case "project":
        return await projectService.deleteProject(mutation.entityId);
      case "process":
        return await processService.deleteProcess(mutation.entityId);
      default:
        return err(new Error("Unknown entity type") as AppError);
    }
  }

  /**
   * Get cache key for entity
   */
  private getCacheKey(entityType: string, entityId?: number): string {
    if (entityId) {
      return `${entityType}:${entityId}`;
    }
    return `${entityType}s:all`;
  }

  /**
   * Get list cache key for entity type
   */
  private getListCacheKey(entityType: string): string {
    const pluralMap: Record<string, string> = {
      case: "cases:all",
      task: "tasks:all",
      workitem: "tasks:all",
      project: "projects:all",
      process: "processes:all",
    };
    return pluralMap[entityType] || `${entityType}s:all`;
  }
}

export const backgroundSyncService = new BackgroundSyncService();
