import { writable } from 'svelte/store';

/**
 * Breadcrumb entity name store
 * 
 * Stores entity names for breadcrumb navigation.
 * Pages can set entity names for their routes, and the Header component
 * will use these names instead of generic labels like "Project 1".
 */
function createBreadcrumbStore() {
	const { subscribe, set, update } = writable<Map<string, string>>(new Map());

	return {
		subscribe,
		/**
		 * Set entity name for a specific path pattern
		 * @param pathPattern - Path pattern like "/projects/1" or "/cases/123"
		 * @param name - Entity name to display in breadcrumb
		 */
		setEntityName: (pathPattern: string, name: string) => {
			update(map => {
				const newMap = new Map(map);
				newMap.set(pathPattern, name);
				return newMap;
			});
		},
		/**
		 * Get entity name for a specific path pattern
		 * @param pathPattern - Path pattern to look up
		 * @returns Entity name or undefined if not found
		 */
		getEntityName: (pathPattern: string): string | undefined => {
			let value: string | undefined;
			update(map => {
				value = map.get(pathPattern);
				return map;
			});
			return value;
		},
		/**
		 * Clear entity name for a specific path pattern
		 * @param pathPattern - Path pattern to clear
		 */
		clearEntityName: (pathPattern: string) => {
			update(map => {
				const newMap = new Map(map);
				newMap.delete(pathPattern);
				return newMap;
			});
		},
		/**
		 * Clear all entity names
		 */
		clearAll: () => {
			set(new Map());
		}
	};
}

// Legacy store for backward compatibility
// New code should use breadcrumbStore.svelte.ts with $state runes
const legacyStore = createBreadcrumbStore();

// Import functions from new store for use in legacy store
import { setEntityName, getEntityName, clearEntityName, clearAllEntityNames } from './breadcrumbStore.svelte';

// Re-export from new store for migration
export { breadcrumbState, setEntityName, getEntityName, clearEntityName, clearAllEntityNames } from './breadcrumbStore.svelte';

// Legacy store instance (deprecated - use breadcrumbStore.svelte.ts instead)
export const breadcrumbStore = {
	subscribe: legacyStore.subscribe,
	setEntityName,
	getEntityName,
	clearEntityName,
	clearAll: clearAllEntityNames
};

