/**
 * Authentication store - Manages user authentication state
 * 
 * **Svelte 5 Runes Pattern:**
 * Uses $state runes for reactive shared state, following Svelte 5 best practices.
 * Components can directly access state properties reactively without subscribe().
 * 
 * Provides reactive authentication state with localStorage persistence.
 */

import { loadFromStorage, saveToStorage } from './migration-utils';
import type { AuthData } from '$lib/schemas/user';
import type { Permission } from '$lib/schemas/auth';

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

/**
 * Deserialize auth data from localStorage with permission normalization
 */
function deserializeAuthData(str: string): AuthData | null {
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
}

/**
 * Reactive authentication state using Svelte 5 $state runes
 * Wrapped in an object to allow reassignment (Svelte 5 requirement)
 * Components can directly access authState.value reactively
 */
const stored = typeof window !== 'undefined' 
	? loadFromStorage('auth_data', null as AuthData | null, deserializeAuthData)
	: null;

export const authState = $state({
	value: stored as AuthData | null
});

// Helper function to sync to localStorage (called manually from functions that modify state)
function syncToStorage(): void {
	if (typeof window !== 'undefined') {
		if (authState.value) {
			saveToStorage('auth_data', authState.value);
		} else {
			localStorage.removeItem('auth_data');
		}
	}
}

/**
 * Set authentication data
 * 
 * @param authData - Authentication data to set
 * 
 * @example
 * ```typescript
 * setAuth({ token: '...', record: {...} });
 * ```
 */
export function setAuth(authData: AuthData): void {
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
	authState.value = authData;
	// Sync to localStorage
	syncToStorage();
	// Also persist to localStorage for API client access (for compatibility)
	if (typeof window !== 'undefined') {
		localStorage.setItem('auth_data', JSON.stringify(authData));
	}
}

/**
 * Clear authentication data
 * 
 * @example
 * ```typescript
 * clearAuth();
 * ```
 */
export function clearAuth(): void {
	authState.value = null;
	syncToStorage();
}

/**
 * Initialize store from localStorage (called on app startup)
 * 
 * @example
 * ```typescript
 * initAuth();
 * ```
 */
export function initAuth(): void {
	if (typeof window !== 'undefined') {
		const authDataStr = localStorage.getItem('auth_data');
		if (authDataStr) {
			const authData = deserializeAuthData(authDataStr);
			if (authData) {
				authState.value = authData;
				// No need to sync - we just loaded from storage
			}
		}
	}
}

/**
 * Get current authentication data (synchronous)
 * 
 * @returns Current auth data or null
 * 
 * @example
 * ```typescript
 * const auth = getAuth();
 * if (auth?.token) {
 *   // User is authenticated
 * }
 * ```
 */
export function getAuth(): AuthData | null {
	return authState.value;
}

// Internal derived values (not exported directly - Svelte 5 restriction)
const _userPermissions = $derived.by(() => {
	const permissions = authState.value?.permissions || [];
	// Normalize actions for all permissions
	return permissions.map(p => ({
		...p,
		actions: normalizeActions(p.actions)
	}));
});

const _userRoles = $derived.by(() => {
	return authState.value?.roles?.map(role => role.name) || [];
});

/**
 * Get user permissions (normalized)
 * 
 * @example
 * ```typescript
 * const perms = getUserPermissions();
 * ```
 */
export function getUserPermissions() {
	return _userPermissions;
}

/**
 * Get user roles
 * 
 * @example
 * ```typescript
 * const roles = getUserRoles();
 * ```
 */
export function getUserRoles() {
	return _userRoles;
}

/**
 * Check if user has specific permission
 * 
 * @param route - Route path
 * @param action - Action name
 * @returns True if user has permission
 * 
 * @example
 * ```typescript
 * if (hasPermission('/admin', 'read')) {
 *   // User can access admin
 * }
 * ```
 */
export function hasPermission(route: string, action: string): boolean {
	return _userPermissions.some(
		p => p.route === route && p.actions.includes(action as any)
	);
}

/**
 * Check if user has specific role
 * 
 * @param roleName - Role name to check
 * @returns True if user has role
 * 
 * @example
 * ```typescript
 * if (hasRole('Admin')) {
 *   // User is admin
 * }
 * ```
 */
export function hasRole(roleName: string): boolean {
	return _userRoles.some(role => role.toLowerCase() === roleName.toLowerCase());
}

// Internal derived values (not exported directly - Svelte 5 restriction)
const _isAuthenticated = $derived.by(() => {
	return authState.value !== null && authState.value.user !== undefined;
});

const _isAdmin = $derived.by(() => {
	return _userRoles.some(role => role.toLowerCase() === 'admin');
});

const _isSysadmin = $derived.by(() => {
	return authState.value?.user?.is_sysadmin === true;
});

/**
 * Check if user is authenticated
 * 
 * @example
 * ```typescript
 * if (isAuthenticated()) {
 *   // User is logged in
 * }
 * ```
 */
export function isAuthenticated(): boolean {
	return _isAuthenticated;
}

/**
 * Check if user is admin
 * 
 * @example
 * ```typescript
 * if (isAdmin()) {
 *   // User is admin
 * }
 * ```
 */
export function isAdmin(): boolean {
	return _isAdmin;
}

/**
 * Check if user is sysadmin (function form)
 * 
 * @example
 * ```typescript
 * if (isSysadmin()) {
 *   // User is sysadmin
 * }
 * ```
 */
export function isSysadmin(): boolean {
	return _isSysadmin;
}


