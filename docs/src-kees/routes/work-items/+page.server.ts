/**
 * Server-side load function for /work-items
 * Enforces permission check on every page load (including client-side navigation)
 * Loads data server-side for faster initial page render
 * Shows ALL work items (no status filter) unlike /work/backlog which only shows backlog items
 */

import { requirePermission } from "$lib/server/requirePermission";
import type { PageServerLoad } from "./$types";
import * as taskService from "$lib/services/taskService";
import * as userManagementService from "$lib/services/userManagementService";
import * as projectService from "$lib/services/projectService";
import * as processService from "$lib/services/processService";
import * as caseService from "$lib/services/caseService";
import { queryTableResult } from "$lib/utils/postgrest";

export const load: PageServerLoad = async ({ locals, url, depends }) => {
  // Check permission: /work-items with read action
  requirePermission(locals, "/work-items", "read");

  // Register dependencies for cache invalidation
  depends("workitems", "users", "projects", "processes", "cases");

  // Parse filters from URL
  const searchParams = url.searchParams;
  const statusFilter = searchParams.get("status") || undefined;

  // IMPORTANT: When status filter includes 'afgerond', we need to pass it to the API
  // so that closed tasks are included (the API removes the closed filter for 'afgerond')
  // For other statuses, we can load all and filter client-side, but 'afgerond' requires
  // database-level filtering to include closed tasks
  const serverStartTime = Date.now();
  const serverStartISO = new Date().toISOString();
  console.log(
    `[Work Items Server] Starting data load at ${serverStartISO} for user: ${locals.user?.id || "anonymous"}`,
  );

  // Pass status filter to API if it includes 'afgerond' (to include closed tasks)
  // Otherwise load all items and filter client-side
  const statusFilterForAPI =
    statusFilter && statusFilter.includes("afgerond")
      ? statusFilter
      : undefined;

  // Load work items - pass status filter if it includes 'afgerond' to include closed tasks
  const userId = locals.user?.id;
  const [
    workItemsResult,
    usersResult,
    projectsResult,
    processesResult,
    casesResult,
    processTasksResult,
  ] = await Promise.all([
    taskService
      .getAllUnifiedWorkItems(undefined, statusFilterForAPI, userId)
      .catch((err) => ({ success: false, error: err }) as any),
    userManagementService
      .getAllUsers({ isActive: true, limit: 1000 })
      .catch((err) => ({ success: false, error: err }) as any),
    projectService
      .getAllProjects()
      .catch((err) => ({ success: false, error: err }) as any),
    processService
      .getAllProcesses()
      .catch((err) => ({ success: false, error: err }) as any),
    caseService
      .getAllCases()
      .catch((err) => ({ success: false, error: err }) as any),
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

  if (workItemsResult.success) {
    console.log(
      `[Work Items Server] Data load completed at ${serverEndISO} (took ${serverDuration}s):`,
      {
        timestamp: serverEndISO,
        source: "server-ssr",
        recordCount: workItemsResult.value.length,
        userId: locals.user?.id || "anonymous",
        records: workItemsResult.value.map((item: any) => ({
          id: item.id,
          type: item.type,
          subject: item.subject,
          status: item.status,
          kanban_status: item.kanban_status,
          project_id: item.project_id,
        })),
      },
    );
  } else {
    console.error(
      `[Work Items Server] Data load failed at ${serverEndISO}:`,
      workItemsResult.error,
    );
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
    workItems: workItemsResult.success ? workItemsResult.value : [],
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
      status: searchParams.get("status")?.split(",") || [],
    },

    // Errors for graceful handling (serialized)
    errors: {
      workItems: serializeError(
        workItemsResult.success ? null : workItemsResult.error,
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
