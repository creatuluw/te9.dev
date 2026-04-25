/**
 * Server-side load function for /
 * Enforces permission check on every page load (including client-side navigation)
 * Loads data server-side for faster initial page render
 */

import { requirePermission } from "$lib/server/requirePermission";
import type { PageServerLoad } from "./$types";
import * as taskService from "$lib/services/taskService";
import { getCurrentUserId } from "$lib/utils/userUtils";
import { startTimer, logPerformance } from "$lib/utils/perfLogger";

export const load: PageServerLoad = async ({ locals, url, depends }) => {
  // Start performance timer
  const timer = startTimer();

  // Check permission: / with read action
  requirePermission(locals, "/", "read");

  // Register dependencies for cache invalidation
  depends("workitems", "planningItems", "backlogItems");

  // Parse assignee filter from URL
  // NOTE: Always filter by current user - strict filtering for security and privacy
  // The alleenMijnWerk parameter is ignored to enforce this requirement
  const searchParams = url.searchParams;
  const assigneeId = locals.user?.id || null;

  // Load work items (planning + backlog) server-side
  // This runs BEFORE HTML is sent to client
  const userId = locals.user?.id;
  const [planningResult, backlogResult] = await Promise.all([
    taskService.getUnifiedPlanningItems(assigneeId, userId),
    taskService.getUnifiedBacklogItems(assigneeId, userId),
  ]);

  // Helper function to serialize errors for SSR
  const serializeError = (error: any) => {
    if (!error) return null;
    if (error.toJSON && typeof error.toJSON === "function") {
      return error.toJSON();
    }
    // Fallback for non-AppError errors
    return {
      name: error.name || "Error",
      message: error.message || String(error),
      code: error.code || "UNKNOWN_ERROR",
      details: error.details || {},
    };
  };

  // Log page load performance
  const loadMs = timer();
  logPerformance({
    path: "/",
    method: "GET",
    userId: locals.user?.id || null,
    authMs: 0,
    totalMs: loadMs,
  });

  // Return data for immediate SSR render
  return {
    // Critical data (rendered immediately)
    planningItems: planningResult.success ? planningResult.value : [],
    backlogItems: backlogResult.success ? backlogResult.value : [],

    // Filter state from URL
    filters: {
      assigneeId: assigneeId,
      alleenMijnWerk: true, // Always true - strict filtering enforced
    },

    // User data from server (for consistent SSR/client hydration)
    userId: locals.user?.id || null,

    // Errors for graceful handling (serialized)
    errors: {
      planning: serializeError(
        planningResult.success ? null : planningResult.error,
      ),
      backlog: serializeError(
        backlogResult.success ? null : backlogResult.error,
      ),
    },

    // Metadata
    timestamp: Date.now(),
  };
};
