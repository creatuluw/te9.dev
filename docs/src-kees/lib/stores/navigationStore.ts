import { writable } from 'svelte/store';

/**
 * Navigation loading store
 * 
 * Manages the global navigation loading state.
 * Shows a loader during page transitions and page-specific loading operations.
 */
function createNavigationStore() {
	const { subscribe, set, update } = writable({
		isLoading: false,
		pageLoadingCount: 0
	});

	return {
		subscribe,
		startLoading: () => update(state => ({ ...state, isLoading: true })),
		stopLoading: () => update(state => ({ ...state, isLoading: false, pageLoadingCount: 0 })),
		/**
		 * Register a page-level loading operation
		 * Use this when a page component is loading critical data
		 */
		startPageLoading: () => update(state => ({ 
			...state, 
			isLoading: true,
			pageLoadingCount: state.pageLoadingCount + 1 
		})),
		/**
		 * Unregister a page-level loading operation
		 * Loading indicator hides when all page operations complete
		 */
		stopPageLoading: () => update(state => {
			const newCount = Math.max(0, state.pageLoadingCount - 1);
			return {
				...state,
				pageLoadingCount: newCount,
				isLoading: newCount > 0
			};
		})
	};
}

// Legacy store for backward compatibility
// New code should use navigationStore.svelte.ts with $state runes
const legacyStore = createNavigationStore();

// Import functions from new store for use in legacy store
import { startLoading, stopLoading, startPageLoading, stopPageLoading } from './navigationStore.svelte';

// Re-export from new store for migration
export { navigationState, startLoading, stopLoading, startPageLoading, stopPageLoading } from './navigationStore.svelte';

// Legacy store instance (deprecated - use navigationStore.svelte.ts instead)
export const navigationStore = {
	subscribe: legacyStore.subscribe,
	startLoading,
	stopLoading,
	startPageLoading,
	stopPageLoading
};

