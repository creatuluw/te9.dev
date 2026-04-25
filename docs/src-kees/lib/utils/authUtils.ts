/**
 * Authentication Utilities
 * 
 * Helper functions for authentication, permissions, and roles.
 */

import type { RouteAction } from '$lib/config/routes';

/**
 * Maps a route action to a permission action.
 * Specifically handles the mapping of 'update' to 'write'.
 * 
 * @param action - The route action to map
 * @returns The corresponding permission action
 */
export function mapRouteActionToPermissionAction(action: RouteAction): 'read' | 'write' | 'delete' | 'execute' {
    if (action === 'update') {
        return 'write';
    }
    return action;
}

/**
 * Maps an array of route actions to permission actions, removing duplicates.
 * 
 * @param actions - Array of route actions
 * @returns Array of unique permission actions
 */
export function mapRouteActionsToPermissionActions(actions: RouteAction[]): ('read' | 'write' | 'delete' | 'execute')[] {
    const mapped = actions.map(mapRouteActionToPermissionAction);
    return [...new Set(mapped)];
}
