/**
 * Authentication store - Manages user authentication state
 * 
 * Provides reactive authentication state with localStorage persistence.
 * Follows standardized store patterns with middleware support.
 */
import { createStore, createLoggingMiddleware } from './storeFactory';
import { derived } from 'svelte/store';
import type { AuthData } from '$lib/schemas/user';
import type { Permission } from '$lib/schemas/auth';

/**
 * Create authentication store with persistence
 * 
 * @returns Authentication store instance
 */
function createAuthStore() {
  const store = createStore<AuthData | null>({
    initialValue: null,
    name: 'auth',
    persist: {
      key: 'auth_data',
      serialize: (value) => JSON.stringify(value),
      deserialize: (str) => {
        try {
          const authData = JSON.parse(str);
          // Normalize permissions actions when loading from localStorage
          if (authData?.permissions && Array.isArray(authData.permissions)) {
            authData.permissions = authData.permissions.map((p: any) => {
              let actions = p.actions;
              if (typeof actions === 'string') {
                try {
                  actions = JSON.parse(actions);
                } catch {
                  // If not valid JSON, treat as comma-separated string
                  actions = actions.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0);
                }
              }
              return {
                ...p,
                actions: Array.isArray(actions) ? actions : []
              };
            });
          }
          return authData;
        } catch (e) {
          console.error('Error parsing auth data:', e);
          return null;
        }
      },
    },
    middleware: [
      createLoggingMiddleware('auth'),
    ],
  });

  return {
    ...store,
    /**
     * Set authentication data
     * 
     * @param authData - Authentication data to set
     * 
     * @example
     * ```typescript
     * authStore.setAuth({ token: '...', record: {...} });
     * ```
     */
    setAuth: (authData: AuthData) => {
      // Normalize permissions before storing
      if (authData?.permissions && Array.isArray(authData.permissions)) {
        authData.permissions = authData.permissions.map((p: any) => {
          let actions = p.actions;
          if (typeof actions === 'string') {
            try {
              actions = JSON.parse(actions);
            } catch {
              // If not valid JSON, treat as comma-separated string
              actions = actions.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0);
            }
          }
          return {
            ...p,
            actions: Array.isArray(actions) ? actions : []
          };
        });
      }
      store.set(authData);
      // Also persist to localStorage for API client access
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_data', JSON.stringify(authData));
      }
    },
    /**
     * Clear authentication data
     * 
     * @example
     * ```typescript
     * authStore.clearAuth();
     * ```
     */
    clearAuth: () => {
      store.reset();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_data');
      }
    },
    /**
     * Initialize store from localStorage (called on app startup)
     * 
     * @example
     * ```typescript
     * authStore.init();
     * ```
     */
    init: () => {
      if (typeof window !== 'undefined') {
        const authDataStr = localStorage.getItem('auth_data');
        if (authDataStr) {
          try {
            const authData = JSON.parse(authDataStr);
            // Normalize permissions actions when loading from localStorage
            if (authData?.permissions && Array.isArray(authData.permissions)) {
              authData.permissions = authData.permissions.map((p: any) => {
                let actions = p.actions;
                if (typeof actions === 'string') {
                  try {
                    actions = JSON.parse(actions);
                  } catch {
                    // If not valid JSON, treat as comma-separated string
                    actions = actions.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0);
                  }
                }
                return {
                  ...p,
                  actions: Array.isArray(actions) ? actions : []
                };
              });
            }
            store.set(authData);
          } catch (e) {
            console.error('Error parsing auth data:', e);
            store.reset();
          }
        }
      }
    },
    /**
     * Get current authentication data (synchronous)
     * 
     * @returns Current auth data or null
     * 
     * @example
     * ```typescript
     * const auth = authStore.getAuth();
     * if (auth?.token) {
     *   // User is authenticated
     * }
     * ```
     */
    getAuth: (): AuthData | null => {
      return store.getValue();
    },
  };
}

// Legacy store for backward compatibility
// New code should use authStore.svelte.ts with $state runes
const legacyStore = createAuthStore();

// Import functions from new store for use in legacy store
import { 
	setAuth, 
	clearAuth, 
	initAuth, 
	getAuth
} from './authStore.svelte';

// Re-export from new store for migration
export { 
	authState, 
	setAuth, 
	clearAuth, 
	initAuth, 
	getAuth,
	getUserPermissions,
	getUserRoles,
	hasPermission,
	hasRole,
	isAuthenticated,
	isAdmin,
	isSysadmin
} from './authStore.svelte';

// Legacy store instance (deprecated - use authStore.svelte.ts instead)
// Must be created before derived stores that reference it
export const authStore = {
	subscribe: legacyStore.subscribe,
	setAuth,
	clearAuth,
	init: initAuth,
	getAuth
};

// For backward compatibility, create derived stores that react to authStore changes
// These must be created AFTER authStore is defined
import { getUserPermissions as _getUserPermissions, getUserRoles as _getUserRoles } from './authStore.svelte';

// Create derived stores for backward compatibility
// These react to authStore changes and call the new functions
export const userPermissions = derived(
	authStore,
	() => _getUserPermissions()
);

export const userRoles = derived(
	authStore,
	() => _getUserRoles()
);

// Import isSysadmin function for derived store
import { isSysadmin as _isSysadmin } from './authStore.svelte';

// Create derived store for sysadmin status
export const isSysadminStore = derived(
	authStore,
	() => _isSysadmin()
);

/**
 * Helper function to normalize actions (handle both JSON arrays and comma-separated strings)
 */
function normalizeActions(actions: any): string[] {
  if (Array.isArray(actions)) {
    return actions;
  }
  if (typeof actions === 'string') {
    try {
      const parsed = JSON.parse(actions);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If not valid JSON, treat as comma-separated string
      return actions.split(',').map(a => a.trim()).filter(a => a.length > 0);
    }
  }
  return [];
}

// Derived stores are now exported from authStore.svelte.ts
// These old derived stores are removed to avoid duplicate exports
// Use the new exports: userPermissions, userRoles, hasPermission, hasRole, isAuthenticated, isAdmin, isSysadmin


