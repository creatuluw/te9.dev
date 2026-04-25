/**
 * Server-side permission checking utilities
 * Used in +page.server.ts files to enforce permissions on every page load
 */

import { error } from "@sveltejs/kit";
import type { RouteAction } from "$lib/types/routes";

interface PermissionCheck {
  route: string;
  action: RouteAction;
}

/**
 * Require permission for a route
 * Throws 401 if not authenticated, 403 if unauthorized
 *
 * @param locals - SvelteKit locals object
 * @param route - Route path to check (e.g., '/cases', '/admin/users')
 * @param action - Action to check (e.g., 'read', 'write', 'delete')
 */
export function requirePermission(
  locals: App.Locals,
  route: string,
  action: RouteAction = "read",
): void {
  // Check if user is authenticated
  if (!locals.user) {
    throw error(401, "Unauthorized - Please login");
  }

  // Sysadmins bypass all permission checks
  if (locals.user.is_sysadmin) {
    return;
  }

  // Check if user has the required permission
  // Map 'update' to 'write' since permissions use 'write' for both create and update
  const effectiveAction = action === "update" ? "write" : action;
  const hasPermission = locals.permissions?.some((p) => {
    return (
      p.route === route &&
      p.actions.includes(
        effectiveAction as "read" | "write" | "delete" | "execute",
      )
    );
  });

  if (!hasPermission) {
    throw error(
      403,
      `Forbidden - You don't have permission to access this page (${route}:${action})`,
    );
  }
}

/**
 * Require any of multiple permissions (OR logic)
 * Useful for pages that can be accessed with different permissions
 *
 * @param locals - SvelteKit locals object
 * @param checks - Array of permission checks
 */
export function requireAnyPermission(
  locals: App.Locals,
  checks: PermissionCheck[],
): void {
  // Check if user is authenticated
  if (!locals.user) {
    throw error(401, "Unauthorized - Please login");
  }

  // Sysadmins bypass all permission checks
  if (locals.user.is_sysadmin) {
    return;
  }

  // Check if user has any of the required permissions
  const hasAnyPermission = checks.some((check) => {
    // Map 'update' to 'write' since permissions use 'write' for both create and update
    const effectiveAction = check.action === "update" ? "write" : check.action;
    return locals.permissions?.some((p) => {
      return (
        p.route === check.route &&
        p.actions.includes(
          effectiveAction as "read" | "write" | "delete" | "execute",
        )
      );
    });
  });

  if (!hasAnyPermission) {
    const routeList = checks.map((c) => `${c.route}:${c.action}`).join(", ");
    throw error(
      403,
      `Forbidden - You need one of these permissions: ${routeList}`,
    );
  }
}

/**
 * Require all of multiple permissions (AND logic)
 * Useful for pages that require multiple permissions
 *
 * @param locals - SvelteKit locals object
 * @param checks - Array of permission checks
 */
export function requireAllPermissions(
  locals: App.Locals,
  checks: PermissionCheck[],
): void {
  // Check if user is authenticated
  if (!locals.user) {
    throw error(401, "Unauthorized - Please login");
  }

  // Sysadmins bypass all permission checks
  if (locals.user.is_sysadmin) {
    return;
  }

  // Check each permission individually
  for (const check of checks) {
    requirePermission(locals, check.route, check.action);
  }
}
