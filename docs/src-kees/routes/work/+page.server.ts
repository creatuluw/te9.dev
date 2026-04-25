/**
 * Server-side load function for /work
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
  // Check permission: /work with read action
  requirePermission(locals, "/work", "read");

  // Register dependencies for cache invalidation
  depends(
    "workitems",
    "planningItems",
    "users",
    "projects",
    "processes",
    "cases",
  );

  // Parse filters from URL
  const searchParams = url.searchParams;
  // Always load ALL items server-side - client-side filtering handles assignee filter
  // This allows multiple assignees to be filtered client-side
  const assigneeId = null; // /work shows all work, filtering happens client-side

  // Helper function to parse comma-separated URL param values
  const parseUrlParam = (param: string | null): number[] => {
    if (!param) return [];
    return param
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((id) => !isNaN(id));
  };

  // Load planning items, users, projects, processes, and cases server-side
  // This runs BEFORE HTML is sent to client
  const userId = locals.user?.id;
  const [
    planningResult,
    usersResult,
    projectsResult,
    processesResult,
    casesResult,
  ] = await Promise.all([
    taskService.getUnifiedPlanningItems(assigneeId, userId).catch((err) => {
      console.error("[work/+page.server] Error loading planning items:", err);
      return { success: false, error: err } as any;
    }),
    userManagementService
      .getAllUsers({ isActive: true, limit: 1000 })
      .catch((err) => {
        console.error("[work/+page.server] Error loading users:", err);
        return { success: false, error: err } as any;
      }),
    projectService.getAllProjects().catch((err) => {
      console.error("[work/+page.server] Error loading projects:", err);
      return { success: false, error: err } as any;
    }),
    processService.getAllProcesses().catch((err) => {
      console.error("[work/+page.server] Error loading processes:", err);
      return { success: false, error: err } as any;
    }),
    caseService.getAllCases().catch((err) => {
      console.error("[work/+page.server] Error loading cases:", err);
      return { success: false, error: err } as any;
    }),
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

  // Return data for immediate SSR render
  return {
    // Critical data (rendered immediately)
    planningItems: planningResult.success ? planningResult.value : [],
    users: users,
    projects: projectsResult.success ? projectsResult.value : [],
    processes: processesResult.success ? processesResult.value : [],
    cases: casesResult.success ? casesResult.value : [],

    // Filter state from URL
    filters: {
      search: searchParams.get("search") || "",
      scope: searchParams.get("scope") || "alle",
      assignee: searchParams.get("assignee")?.split(",") || [],
      project: searchParams.get("project")
        ? parseInt(searchParams.get("project")!)
        : null,
      processes: parseUrlParam(searchParams.get("processes")),
      cases: parseUrlParam(searchParams.get("cases")),
      dateFrom: searchParams.get("dateFrom") || null,
      dateTo: searchParams.get("dateTo") || null,
    },

    // Errors for graceful handling (serialized)
    errors: {
      planning: serializeError(
        planningResult.success ? null : planningResult.error,
      ),
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
