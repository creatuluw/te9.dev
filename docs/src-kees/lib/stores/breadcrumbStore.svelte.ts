/**
 * Breadcrumb entity name store
 * 
 * **Svelte 5 Runes Pattern:**
 * Uses $state runes for reactive shared state, following Svelte 5 best practices.
 * Components can directly access state properties reactively without subscribe().
 * 
 * Stores entity names for breadcrumb navigation.
 * Pages can set entity names for their routes, and the Header component
 * will use these names instead of generic labels like "Project 1".
 */

/**
 * Reactive breadcrumb state using Svelte 5 $state runes
 * Components can directly access these properties reactively
 */
export const breadcrumbState = $state({
	entityNames: new Map<string, string>()
});

/**
 * Set entity name for a specific path pattern
 * 
 * @param pathPattern - Path pattern like "/projects/1" or "/cases/123"
 * @param name - Entity name to display in breadcrumb
 * 
 * @example
 * ```typescript
 * setEntityName('/projects/1', 'My Project');
 * ```
 */
export function setEntityName(pathPattern: string, name: string): void {
	const newMap = new Map(breadcrumbState.entityNames);
	newMap.set(pathPattern, name);
	breadcrumbState.entityNames = newMap;
}

/**
 * Get entity name for a specific path pattern
 * 
 * @param pathPattern - Path pattern to look up
 * @returns Entity name or undefined if not found
 * 
 * @example
 * ```typescript
 * const name = getEntityName('/projects/1');
 * ```
 */
export function getEntityName(pathPattern: string): string | undefined {
	return breadcrumbState.entityNames.get(pathPattern);
}

/**
 * Clear entity name for a specific path pattern
 * 
 * @param pathPattern - Path pattern to clear
 * 
 * @example
 * ```typescript
 * clearEntityName('/projects/1');
 * ```
 */
export function clearEntityName(pathPattern: string): void {
	const newMap = new Map(breadcrumbState.entityNames);
	newMap.delete(pathPattern);
	breadcrumbState.entityNames = newMap;
}

/**
 * Clear all entity names
 * 
 * @example
 * ```typescript
 * clearAllEntityNames();
 * ```
 */
export function clearAllEntityNames(): void {
	breadcrumbState.entityNames = new Map();
}

