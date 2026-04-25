/**
 * Server-side load function for work backlog page
 * Enforces permission check on every page load (including client-side navigation)
 * Loads data server-side for faster initial page render
 */

import { redirect } from "@sveltejs/kit";
import { requirePermission } from "$lib/server/requirePermission";
import type { PageServerLoad } from "./$types";
import * as taskService from "$lib/services/taskService";
import * as userManagementService from "$lib/services/userManagementService";
import * as projectService from "$lib/services/projectService";
import * as processService from "$lib/services/processService";
import * as caseService from "$lib/services/caseService";
import { queryTableResult } from "$lib/utils/postgrest";

export const load: PageServerLoad = async ({ locals, url, depends }) => {
  // Check permission: /work/backlog with read action
  requirePermission(locals, "/work/backlog", "read");

  // Register dependencies for cache invalidation
  depends(
    "workitems",
    "backlogItems",
    "users",
    "projects",
    "processes",
    "cases",
  );

  // Get current user info for authorization
  const userId = locals.user?.id;
  const isAdmin = locals.user?.is_sysadmin === true;

  // Parse filters from URL (for filter state only, not for data loading)
  const searchParams = url.searchParams;

  // IMPORTANT: Always load ALL unfiltered data initially using Promise.all
  // This ensures all data arrives at the same time (no staggered loading)
  // Filters are applied client-side after the initial load
  // This ensures complete data is available on first render
  const serverStartTime = Date.now();
  const serverStartISO = new Date().toISOString();
  console.log(
    `[PERF] Backlog data load starting at ${serverStartISO} for user: ${locals.user?.id || "anonymous"}`,
  );

  const [
    backlogResult,
    usersResult,
    projectsResult,
    processesResult,
    casesResult,
    processTasksResult,
  ] = await Promise.all([
    taskService
      .getUnifiedBacklogItems(undefined, locals.user?.id)
      .catch((err) => ({ success: false, error: err }) as any),
    userManagementService
      .getAllUsers({ isActive: true, limit: 1000 })
      .catch((err) => ({ success: false, error: err }) as any),
    projectService
      .getProjectsForUser(userId || "", isAdmin)
      .catch((err) => ({ success: false, error: err }) as any),
    processService
      .getAllProcesses()
      .catch((err) => ({ success: false, error: err }) as any),
    caseService
      .getAllCases()
      .catch((err) => ({ success: false, error: err }) as any), // For komt_van filtering
    queryTableResult<{ id: number; name: string; description: string | null }>(
      "_bpm_process_tasks",
      {
        order: "id.asc",
      },
    ).catch((err) => ({ success: false, error: err }) as any),
  ]);

  const serverEndTime = Date.now();
  const serverEndISO = new Date().toISOString();
  const serverDuration = ((serverEndTime - serverStartTime) / 1000).toFixed(2);

  if (backlogResult.success) {
    console.log(
      `[PERF] Backlog data load completed at ${serverEndISO} (took ${serverDuration}s):`,
      {
        recordCount: backlogResult.value.length,
        userId: locals.user?.id || "anonymous",
      },
    );
  } else {
    // console.error(
    //   `[Backlog Server] Data load failed at ${serverEndISO}:`,
    //   backlogResult.error,
    // );
  }

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

  // Transform users to PocketBase format for component compatibility
  const users = usersResult.success
    ? usersResult.value.map((user: any) => ({
        id: user.id,
        email: user.email,
        username: user.username || "",
        name: user.name || "",
        avatar: user.avatar || "",
        verified: user.email_verified || false,
        emailVisibility: true,
        created: user.created_at,
        updated: user.updated_at,
      }))
    : [];

  // Transform process tasks to array format for serialization
  // Component will convert to Map for efficient lookups
  const processTasks =
    processTasksResult.success && processTasksResult.value.data
      ? processTasksResult.value.data.map((task: any) => ({
          id: task.id,
          name: task.name,
          description: task.description,
        }))
      : [];

  // Return data for immediate SSR render
  return {
    // Critical data (rendered immediately) - all loaded together via Promise.all
    backlogItems: backlogResult.success ? backlogResult.value : [],
    users: users,
    projects: projectsResult.success ? projectsResult.value : [],
    processes: processesResult.success ? processesResult.value : [],
    cases: casesResult.success ? casesResult.value : [],
    processTasks: processTasks,

    // Filter state from URL
    filters: {
      search: searchParams.get("search") || "",
      scope: searchParams.get("scope") || "alle",
      assignee: searchParams.get("assignee")?.split(",") || [],
      taskType: searchParams.get("taskType")?.split(",") || [],
      komtVan:
        searchParams
          .get("komtVan")
          ?.split(",")
          .map((v) => decodeURIComponent(v)) || [],
      deadline: searchParams.get("deadline") || null,
      dateFrom: searchParams.get("dateFrom") || null,
      dateTo: searchParams.get("dateTo") || null,
      case: searchParams.get("case")
        ? parseInt(searchParams.get("case")!, 10)
        : null,
    },

    // Errors for graceful handling (serialized)
    errors: {
      backlog: serializeError(
        backlogResult.success ? null : backlogResult.error,
      ),
      users: serializeError(usersResult.success ? null : usersResult.error),
      projects: serializeError(
        projectsResult.success ? null : projectsResult.error,
      ),
      processes: serializeError(
        processesResult.success ? null : processesResult.error,
      ),
      cases: serializeError(casesResult.success ? null : casesResult.error),
      processTasks: serializeError(
        processTasksResult.success ? null : processTasksResult.error,
      ),
    },

    // Metadata
    timestamp: Date.now(),
  };
};
