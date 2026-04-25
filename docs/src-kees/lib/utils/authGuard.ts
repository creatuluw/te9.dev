/**
 * Auth Guard Utilities - Client-side authentication and authorization protection
 *
 * These utilities provide client-side protection for routes and components.
 * Used in combination with server-side protection for defense in depth.
 */

import { goto } from "$app/navigation";
import { authState } from "$lib/stores/authStore.svelte";
import type { Permission } from "$lib/schemas/auth";

/**
 * Check if user is authenticated
 *
 * @returns True if user is authenticated
 */
export function isAuthenticated(): boolean {
  const auth = authState.value;
  return auth !== null && auth.user !== undefined;
}

/**
 * Require authentication - redirect to login if not authenticated
 *
 * @param redirectTo - URL to redirect back to after login
 * @throws Redirects to login page
 */
export function requireAuth(redirectTo?: string): void {
  if (!isAuthenticated()) {
    const currentPath =
      redirectTo ||
      (typeof window !== "undefined" ? window.location.pathname : "/");
    goto(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }
}

/**
 * Helper function to normalize actions (handle both JSON arrays and comma-separated strings)
 */
function normalizeActions(actions: any): string[] {
  if (Array.isArray(actions)) {
    return actions;
  }
  if (typeof actions === "string") {
    try {
      const parsed = JSON.parse(actions);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If not valid JSON, treat as comma-separated string
      return actions
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a.length > 0);
    }
  }
  return [];
}

/**
 * Get effective permissions for current user
 *
 * @returns Array of user permissions with normalized actions
 */
export function getEffectivePermissions(): Permission[] {
  const auth = authState.value;
  const permissions = auth?.permissions || [];
  // Normalize actions for all permissions
  return permissions.map((p) => ({
    ...p,
    actions: normalizeActions(p.actions) as Permission["actions"],
  }));
}

/**
 * Check if user is sysadmin
 *
 * @returns True if user is sysadmin
 */
export function isSysadmin(): boolean {
  const auth = authState.value;
  return auth?.user?.is_sysadmin === true;
}

/**
 * Check if user has a specific permission
 *
 * @param route - Route to check permission for
 * @param action - Action to check (read, write, delete, execute)
 * @returns True if user has the permission
 */
export function hasPermission(route: string, action: string): boolean {
  // Sysadmins have all permissions
  if (isSysadmin()) {
    return true;
  }

  const permissions = getEffectivePermissions();

  return permissions.some(
    (p) => p.route === route && p.actions.includes(action as any),
  );
}

/**
 * Check if user has any of the specified permissions
 *
 * @param checks - Array of {route, action} pairs to check
 * @returns True if user has any of the permissions
 */
export function hasAnyPermission(
  checks: Array<{ route: string; action: string }>,
): boolean {
  // Sysadmins have all permissions
  if (isSysadmin()) {
    return true;
  }
  return checks.some((check) => hasPermission(check.route, check.action));
}

/**
 * Check if user has all of the specified permissions
 *
 * @param checks - Array of {route, action} pairs to check
 * @returns True if user has all of the permissions
 */
export function hasAllPermissions(
  checks: Array<{ route: string; action: string }>,
): boolean {
  // Sysadmins have all permissions
  if (isSysadmin()) {
    return true;
  }
  return checks.every((check) => hasPermission(check.route, check.action));
}

/**
 * Require specific permission - redirect if not authorized
 *
 * @param route - Route to check permission for
 * @param action - Action to check (read, write, delete, execute)
 * @param redirectTo - URL to redirect to if unauthorized (default: home)
 * @throws Redirects if permission check fails
 */
export function requirePermission(
  route: string,
  action: string,
  redirectTo: string = "/",
): void {
  // First check authentication
  if (!isAuthenticated()) {
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "/";
    goto(`/login?redirect=${encodeURIComponent(currentPath)}`);
    return;
  }

  // Then check permission
  if (!hasPermission(route, action)) {
    goto(redirectTo);
  }
}

/**
 * Check if user has a specific role
 *
 * @param roleName - Name of the role to check
 * @returns True if user has the role
 */
export function hasRole(roleName: string): boolean {
  const auth = authState.value;
  if (!auth?.roles) return false;

  return auth.roles.some(
    (role) => role.name.toLowerCase() === roleName.toLowerCase(),
  );
}

/**
 * Check if user has any of the specified roles
 *
 * @param roleNames - Array of role names to check
 * @returns True if user has any of the roles
 */
export function hasAnyRole(roleNames: string[]): boolean {
  return roleNames.some((role) => hasRole(role));
}

/**
 * Check if user has all of the specified roles
 *
 * @param roleNames - Array of role names to check
 * @returns True if user has all of the roles
 */
export function hasAllRoles(roleNames: string[]): boolean {
  return roleNames.every((role) => hasRole(role));
}

/**
 * Require specific role - redirect if not authorized
 *
 * @param roleName - Name of the role required
 * @param redirectTo - URL to redirect to if unauthorized (default: home)
 * @throws Redirects if role check fails
 */
export function requireRole(roleName: string, redirectTo: string = "/"): void {
  // First check authentication
  if (!isAuthenticated()) {
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "/";
    goto(`/login?redirect=${encodeURIComponent(currentPath)}`);
    return;
  }

  // Then check role
  if (!hasRole(roleName)) {
    goto(redirectTo);
  }
}

/**
 * Check if user is admin
 *
 * @returns True if user has admin role
 */
export function isAdmin(): boolean {
  return hasRole("Admin");
}

/**
 * Require admin role - redirect if not admin
 *
 * @param redirectTo - URL to redirect to if not admin (default: home)
 * @throws Redirects if user is not admin
 */
export function requireAdmin(redirectTo: string = "/"): void {
  requireRole("Admin", redirectTo);
}

/**
 * Get current user ID
 *
 * @returns User ID or null if not authenticated
 */
export function getUserId(): string | null {
  const auth = authState.value;
  return auth?.user?.id || null;
}

/**
 * Get current user's roles
 *
 * @returns Array of role names
 */
export function getUserRoles(): string[] {
  const auth = authState.value;
  return auth?.roles?.map((role) => role.name) || [];
}

/**
 * Check permissions for a list of routes (useful for menu rendering)
 *
 * @param routes - Array of {route, action} pairs
 * @returns Object mapping route to boolean indicating if user has permission
 */
export function checkPermissions(
  routes: Array<{ route: string; action: string }>,
): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  for (const { route, action } of routes) {
    result[`${route}:${action}`] = hasPermission(route, action);
  }

  return result;
}

/**
 * Higher-order function to protect a function with permission check
 *
 * @param route - Route to check permission for
 * @param action - Action to check
 * @param fn - Function to protect
 * @returns Protected function that only executes if user has permission
 */
export function withPermission<T extends (...args: any[]) => any>(
  route: string,
  action: string,
  fn: T,
): T {
  return ((...args: Parameters<T>) => {
    if (!hasPermission(route, action)) {
      console.warn(`Permission denied: ${route} ${action}`);
      return;
    }
    return fn(...args);
  }) as T;
}

/**
 * Higher-order function to protect a function with role check
 *
 * @param roleName - Role name required
 * @param fn - Function to protect
 * @returns Protected function that only executes if user has role
 */
export function withRole<T extends (...args: any[]) => any>(
  roleName: string,
  fn: T,
): T {
  return ((...args: Parameters<T>) => {
    if (!hasRole(roleName)) {
      console.warn(`Role required: ${roleName}`);
      return;
    }
    return fn(...args);
  }) as T;
}
