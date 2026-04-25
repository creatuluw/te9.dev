/**
 * App Route Store - Route access management utilities
 *
 * Provides utilities for enriching and managing route access permissions.
 * This is a utility store (not reactive) for route access helpers.
 */

export interface RouteAccessItem {
  id: string;
  path: string;
  label: string;
}

/**
 * Enrich route access array with additional metadata
 *
 * @param routeAccess - Array of route access strings
 * @returns Enriched route access items with id, path, and label
 *
 * @example
 * ```typescript
 * const enriched = await appRouteStore.enrichRouteAccess(['/cases', '/processes']);
 * // Returns: [{ id: '/cases', path: '/cases', label: '/cases' }, ...]
 * ```
 */
async function enrichRouteAccess(
  routeAccess: string[],
): Promise<RouteAccessItem[]> {
  // For now, return the route access array as-is
  // You can add enrichment logic here if needed (e.g., fetch route metadata from API)
  return routeAccess.map((route) => ({
    id: route,
    path: route,
    label: route,
  }));
}

// Legacy store for backward compatibility
// New code should use appRouteStore.svelte.ts
export { enrichRouteAccess } from "./appRouteStore.svelte";

const appRouteStore = {
  enrichRouteAccess,
};

export default appRouteStore;
