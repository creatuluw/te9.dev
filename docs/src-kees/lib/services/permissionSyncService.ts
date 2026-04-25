/**
 * Permission Sync Service
 * 
 * Keeps permissions in the database synchronized with routes.ts
 * Provides utilities to add/remove route permissions from roles
 */

import { queryTableResult, insertRowResult, updateRowsResult, deleteRowsResult, filter } from '$lib/utils/postgrest';
import type { AppError } from '$lib/types/errors';
import { NetworkError, NotFoundError } from '$lib/types/errors';
import { ok, err, type Result } from '$lib/types/result';
import type { Permission } from '$lib/schemas/auth';
import { ROUTES, getAllAvailableRoutes, type RouteDefinition, type RouteAction } from '$lib/config/routes';
import { mapRouteActionsToPermissionActions, mapRouteActionToPermissionAction } from '$lib/utils/authUtils';

/**
 * Sync all permissions from routes.ts to database
 * 
 * Creates missing permissions and updates existing ones if actions changed
 * 
 * @returns Result containing sync statistics
 */
export async function syncPermissionsToDatabase(): Promise<Result<{
	created: number;
	updated: number;
	total: number;
}, AppError>> {
	try {
		const routes = await getAllAvailableRoutes();
		let created = 0;
		let updated = 0;

		// Get all existing permissions
		const existingPermsResult = await queryTableResult<Permission>('_auth_permissions', {});
		if (!existingPermsResult.success) {
			return err(existingPermsResult.error);
		}

		const existingPerms = existingPermsResult.value.data;
		const existingPermsByRoute = new Map<string, Permission>();
		existingPerms.forEach(perm => {
			existingPermsByRoute.set(perm.route, perm);
		});

		// Process each route
		for (const route of routes) {
			// Skip public routes - they don't need permissions
			if (route.isPublic) {
				continue;
			}

			const existingPerm = existingPermsByRoute.get(route.path);

			// Map 'update' to 'write' since Permission schema uses 'write' not 'update'
			const mappedActions = mapRouteActionsToPermissionActions(route.actions);

			// Convert actions array to JSONB format
			const actionsJson = JSON.stringify(mappedActions);

			if (existingPerm) {
				// Check if actions changed
				const existingActions = JSON.stringify(existingPerm.actions);
				if (existingActions !== actionsJson || existingPerm.description !== route.description) {
					// Update permission
					const updateResult = await updateRowsResult(
						'_auth_permissions',
						filter().eq('id', existingPerm.id).build(),
						{
							actions: actionsJson,
							description: route.description || null,
							updated_at: new Date().toISOString()
						}
					);

					if (updateResult.success) {
						updated++;
					}
				}
			} else {
				// Create new permission
				const insertResult = await insertRowResult('_auth_permissions', {
					route: route.path,
					actions: actionsJson,
					description: route.description || null,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				});

				if (insertResult.success) {
					created++;
				}
			}
		}

		return ok({
			created,
			updated,
			total: routes.length
		});
	} catch (error) {
		console.error('Sync permissions error:', error);
		return err(NetworkError.from(error));
	}
}

/**
 * Get permission for a route and action
 * Creates permission if it doesn't exist
 * 
 * @param route - Route path
 * @param action - Action to check
 * @returns Result containing permission or error
 */
export async function getRoutePermission(
	route: string,
	action: RouteAction
): Promise<Result<Permission, AppError>> {
	try {
		// First check if permission exists
		const permResult = await queryTableResult<Permission>(
			'_auth_permissions',
			{ filter: filter().eq('route', route).build() }
		);

		if (!permResult.success) {
			return err(permResult.error);
		}

		if (permResult.value.data.length > 0) {
			const perm = permResult.value.data[0];
			// Map 'update' to 'write' for permission check
			const mappedAction = mapRouteActionToPermissionAction(action);
			// Check if action is in permission's actions
			if (perm.actions.includes(mappedAction as any)) {
				return ok(perm);
			}
			// Action not in permission - this shouldn't happen if routes are synced
			return err(NotFoundError.resource('Permission action', `${route}:${action}`));
		}

		// Permission doesn't exist - try to create from routes.ts
		const allRoutes = await getAllAvailableRoutes();
		const routeDef = allRoutes.find(r => r.path === route);
		if (!routeDef) {
			return err(NotFoundError.resource('Route', route));
		}

		// Map 'update' to 'write' since Permission schema uses 'write' not 'update'
		const mappedActions = mapRouteActionsToPermissionActions(routeDef.actions);

		// Create permission
		const createResult = await insertRowResult('_auth_permissions', {
			route: routeDef.path,
			actions: JSON.stringify(mappedActions),
			description: routeDef.description || null,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		});

		if (!createResult.success) {
			return err(createResult.error);
		}

		// Fetch the created permission
		const newPermResult = await queryTableResult<Permission>(
			'_auth_permissions',
			{ filter: filter().eq('route', route).build() }
		);

		if (!newPermResult.success || newPermResult.value.data.length === 0) {
			return err(new NetworkError('Failed to fetch created permission'));
		}

		const perm = newPermResult.value.data[0];
		// Map 'update' to 'write' for permission check
		const mappedAction = mapRouteActionToPermissionAction(action);
		if (!perm.actions.includes(mappedAction as any)) {
			return err(NotFoundError.resource('Permission action', `${route}:${action}`));
		}

		return ok(perm);
	} catch (error) {
		console.error('Get route permission error:', error);
		return err(NetworkError.from(error));
	}
}

/**
 * Add route permissions to a role
 * 
 * @param roleId - Role ID
 * @param route - Route path
 * @param actions - Actions to add (if empty, adds all actions from route definition)
 * @returns Result containing success status
 */
export async function addRoutePermissionsToRole(
	roleId: number,
	route: string,
	actions: RouteAction[] = []
): Promise<Result<void, AppError>> {
	try {
		// Get route definition
		const allRoutes = await getAllAvailableRoutes();
		const routeDef = allRoutes.find(r => r.path === route);
		if (!routeDef) {
			return err(NotFoundError.resource('Route', route));
		}

		// Map 'update' to 'write' for permission check
		const firstAction = mapRouteActionToPermissionAction(routeDef.actions[0]);

		// Get permission for this route
		const permResult = await getRoutePermission(route, firstAction as RouteAction);
		if (!permResult.success) {
			return err(permResult.error);
		}

		const permission = permResult.value;

		// Map 'update' to 'write' and determine which actions to add
		const mappedActions = mapRouteActionsToPermissionActions(routeDef.actions);

		const mappedRequestActions = mapRouteActionsToPermissionActions(actions);

		const actionsToAdd = mappedRequestActions.length > 0 ? mappedRequestActions : mappedActions;

		// Check if role-permission link already exists
		const existingLinkResult = await queryTableResult<{ id: number }>(
			'_auth_role_permissions',
			{
				filter: filter()
					.eq('role_id', roleId)
					.eq('permission_id', permission.id)
					.build()
			}
		);

		if (!existingLinkResult.success) {
			return err(existingLinkResult.error);
		}

		// If link doesn't exist, create it
		if (existingLinkResult.value.data.length === 0) {
			const insertResult = await insertRowResult('_auth_role_permissions', {
				role_id: roleId,
				permission_id: permission.id,
				created_at: new Date().toISOString()
			});

			if (!insertResult.success) {
				return err(insertResult.error);
			}
		}

		return ok(undefined);
	} catch (error) {
		console.error('Add route permissions to role error:', error);
		return err(NetworkError.from(error));
	}
}

/**
 * Remove route permissions from a role
 * 
 * @param roleId - Role ID
 * @param route - Route path
 * @returns Result containing success status
 */
export async function removeRoutePermissionsFromRole(
	roleId: number,
	route: string
): Promise<Result<void, AppError>> {
	try {
		// Get permission for this route
		const permResult = await queryTableResult<Permission>(
			'_auth_permissions',
			{ filter: filter().eq('route', route).build() }
		);

		if (!permResult.success) {
			return err(permResult.error);
		}

		if (permResult.value.data.length === 0) {
			// Permission doesn't exist - nothing to remove
			return ok(undefined);
		}

		const permission = permResult.value.data[0];

		// Remove role-permission link
		const deleteResult = await deleteRowsResult(
			'_auth_role_permissions',
			filter()
				.eq('role_id', roleId)
				.eq('permission_id', permission.id)
				.build()
		);

		if (!deleteResult.success) {
			return err(deleteResult.error);
		}

		return ok(undefined);
	} catch (error) {
		console.error('Remove route permissions from role error:', error);
		return err(NetworkError.from(error));
	}
}

/**
 * Sync role to have specific routes
 * Adds missing route permissions and removes route permissions not in the list
 * 
 * @param roleId - Role ID
 * @param routes - Array of route paths to sync
 * @returns Result containing sync statistics
 */
export async function syncRoleToRoutes(
	roleId: number,
	routes: string[]
): Promise<Result<{
	added: number;
	removed: number;
}, AppError>> {
	try {
		// Get all current role permissions
		const rolePermsResult = await queryTableResult<{ permission_id: number }>(
			'_auth_role_permissions',
			{ filter: filter().eq('role_id', roleId).build() }
		);

		if (!rolePermsResult.success) {
			return err(rolePermsResult.error);
		}

		const currentPermissionIds = new Set(
			rolePermsResult.value.data.map(rp => rp.permission_id)
		);

		// Get all permissions
		const allPermsResult = await queryTableResult<Permission>('_auth_permissions', {});
		if (!allPermsResult.success) {
			return err(allPermsResult.error);
		}

		const permsByRoute = new Map<string, Permission>();
		allPermsResult.value.data.forEach(perm => {
			permsByRoute.set(perm.route, perm);
		});

		// Determine which permissions to add and remove
		const routesToAdd = new Set(routes);
		const permissionIdsToAdd = new Set<number>();
		const permissionIdsToRemove = new Set<number>();

		// Find permissions to add
		for (const route of routesToAdd) {
			const perm = permsByRoute.get(route);
			if (perm && !currentPermissionIds.has(perm.id)) {
				permissionIdsToAdd.add(perm.id);
			}
		}

		// Find permissions to remove (current permissions not in routes list)
		for (const perm of allPermsResult.value.data) {
			if (currentPermissionIds.has(perm.id) && !routesToAdd.has(perm.route)) {
				permissionIdsToRemove.add(perm.id);
			}
		}

		// Add missing permissions
		let added = 0;
		for (const permId of permissionIdsToAdd) {
			const insertResult = await insertRowResult('_auth_role_permissions', {
				role_id: roleId,
				permission_id: permId,
				created_at: new Date().toISOString()
			});

			if (insertResult.success) {
				added++;
			}
		}

		// Remove permissions not in list
		let removed = 0;
		for (const permId of permissionIdsToRemove) {
			const deleteResult = await deleteRowsResult(
				'_auth_role_permissions',
				filter()
					.eq('role_id', roleId)
					.eq('permission_id', permId)
					.build()
			);

			if (deleteResult.success) {
				removed++;
			}
		}

		return ok({ added, removed });
	} catch (error) {
		console.error('Sync role to routes error:', error);
		return err(NetworkError.from(error));
	}
}

/**
 * Get all permissions available from routes.ts
 * Used in permissions management UI
 * 
 * @returns Result containing all available permissions
 */
export async function getAllAvailablePermissions(): Promise<Result<Permission[], AppError>> {
	try {
		// First sync permissions to ensure DB is up to date
		await syncPermissionsToDatabase();

		// Get all permissions from database
		const permsResult = await queryTableResult<Permission>('_auth_permissions', {});
		if (!permsResult.success) {
			return err(permsResult.error);
		}

		return ok(permsResult.value.data);
	} catch (error) {
		console.error('Get all available permissions error:', error);
		return err(NetworkError.from(error));
	}
}

