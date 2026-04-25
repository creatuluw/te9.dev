/**
 * Server-side load function for closed tasks page
 * Enforces permission check on every page load (including client-side navigation)
 * Loads data server-side for faster initial page render
 */

import { requirePermission } from "$lib/server/requirePermission";
import type { PageServerLoad } from "./$types";
import * as taskService from "$lib/services/taskService";
import * as userManagementService from "$lib/services/userManagementService";
import * as projectService from "$lib/services/projectService";
import * as processService from "$lib/services/processService";
import * as caseService from "$lib/services/caseService";

export const load: PageServerLoad = async ({ locals, url, depends }) => {
  // Check permission: /closed with read action
  requirePermission(locals, "/closed", "read");

  // Register dependencies for cache invalidation
  depends(
    "workitems",
    "closedItems",
    "users",
    "projects",
    "processes",
    "cases",
  );

  // Parse filters from URL
  const searchParams = url.searchParams;
  const assigneeId = searchParams.get("assignee") || null;

  // Load closed items data server-side
  // This runs BEFORE HTML is sent to client
  const userId = locals.user?.id;
  const [
    closedResult,
    usersResult,
    projectsResult,
    processesResult,
    casesResult,
  ] = await Promise.all([
    taskService
      .getClosedUnifiedItems(assigneeId, userId)
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
      .catch((err) => ({ success: false, error: err }) as any), // For komt_van filtering
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

  // Get all closed items, but we'll only show the last 50 initially
  const allClosedItems = closedResult.success ? closedResult.value : [];

  // Return data for immediate SSR render
  return {
    // Critical data (rendered immediately) - only last 50 items
    closedItems: allClosedItems.slice(0, 50),
    totalCount: allClosedItems.length, // Total count for pagination
    users: users,
    projects: projectsResult.success ? projectsResult.value : [],
    processes: processesResult.success ? processesResult.value : [],
    cases: casesResult.success ? casesResult.value : [],

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
    },

    // Errors for graceful handling (serialized)
    errors: {
      closed: serializeError(closedResult.success ? null : closedResult.error),
      users: serializeError(usersResult.success ? null : usersResult.error),
      projects: serializeError(
        projectsResult.success ? null : projectsResult.error,
      ),
      processes: serializeError(
        processesResult.success ? null : processesResult.error,
      ),
      cases: serializeError(casesResult.success ? null : casesResult.error),
    },

    // Metadata
    timestamp: Date.now(),
  };
};
