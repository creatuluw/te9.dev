/**
 * App Route Store - Route access management utilities
 * 
 * **Svelte 5 Pattern:**
 * This is a utility module (not reactive) for route access helpers.
 * No $state needed as this doesn't manage reactive state.
 * 
 * Provides utilities for enriching and managing route access permissions.
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
 * const enriched = await enrichRouteAccess(['/cases', '/processes']);
 * // Returns: [{ id: '/cases', path: '/cases', label: '/cases' }, ...]
 * ```
 */
export async function enrichRouteAccess(routeAccess: string[]): Promise<RouteAccessItem[]> {
	// For now, return the route access array as-is
	// You can add enrichment logic here if needed (e.g., fetch route metadata from API)
	return routeAccess.map(route => ({
		id: route,
		path: route,
		label: route,
	}));
}

