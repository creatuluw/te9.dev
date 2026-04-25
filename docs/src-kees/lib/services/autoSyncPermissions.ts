/**
 * Auto Sync Permissions Service
 * 
 * Automatically syncs permissions from routes.ts to database when new routes are detected.
 * Runs on server startup and can be triggered manually.
 */

import * as permissionSyncService from './permissionSyncService';
import { getAllAvailableRoutes } from '$lib/config/routes';
import { mapRouteActionsToPermissionActions } from '$lib/utils/authUtils';
import { queryTableResult } from '$lib/utils/postgrest';
import type { Permission } from '$lib/schemas/auth';
import { ok, err, type Result } from '$lib/types/result';
import { type AppError, NetworkError } from '$lib/types/errors';

let syncChecked = false;
let syncInProgress = false;

/**
 * Check if there are new routes that need to be synced
 * 
 * @returns Result indicating if sync is needed and what routes are new
 */
async function checkForNewRoutes(): Promise<Result<{
	needsSync: boolean;
	newRoutes: string[];
	updatedRoutes: string[];
}, AppError>> {
	try {
		// Get all routes from routes.ts
		const routes = (await getAllAvailableRoutes()).filter(r => !r.isPublic);
		const routePaths = new Set(routes.map(r => r.path));

		// Get all existing permissions from database
		const existingPermsResult = await queryTableResult<Permission>('_auth_permissions', {});
		if (!existingPermsResult.success) {
			return err(existingPermsResult.error);
		}

		const existingPerms = existingPermsResult.value.data;
		const existingRoutes = new Set(existingPerms.map(p => p.route));

		// Find new routes (in routes.ts but not in database)
		const newRoutes = routes
			.filter(r => !existingRoutes.has(r.path))
			.map(r => r.path);

		// Find routes that might need updating (check if actions changed)
		const updatedRoutes: string[] = [];
		for (const route of routes) {
			const existingPerm = existingPerms.find(p => p.route === route.path);
			if (existingPerm) {
				// Map 'update' to 'write' for comparison
				const mappedActions = mapRouteActionsToPermissionActions(route.actions).sort();

				const existingActions = [...existingPerm.actions].sort();

				// Check if actions or description changed
				const actionsChanged = JSON.stringify(mappedActions) !== JSON.stringify(existingActions);
				const descriptionChanged = (route.description || null) !== (existingPerm.description || null);

				if (actionsChanged || descriptionChanged) {
					updatedRoutes.push(route.path);
				}
			}
		}

		const needsSync = newRoutes.length > 0 || updatedRoutes.length > 0;

		return ok({
			needsSync,
			newRoutes,
			updatedRoutes
		});
	} catch (error) {
		console.error('Check for new routes error:', error);
		return err(new NetworkError('Failed to check for new routes', 500));
	}
}

/**
 * Auto-sync permissions if new routes are detected
 * Only runs once per server instance (on first check)
 * 
 * @param force - Force sync even if already checked
 * @returns Result with sync statistics or null if no sync needed
 */
export async function autoSyncPermissions(force: boolean = false): Promise<Result<{
	created: number;
	updated: number;
	total: number;
	newRoutes: string[];
	updatedRoutes: string[];
} | null, AppError>> {
	// Prevent concurrent syncs
	if (syncInProgress) {
		return ok(null);
	}

	// Only check once per server instance unless forced
	if (syncChecked && !force) {
		return ok(null);
	}

	syncInProgress = true;
	syncChecked = true;

	try {
		// Check for new routes
		const checkResult = await checkForNewRoutes();
		if (!checkResult.success) {
			syncInProgress = false;
			return err(checkResult.error);
		}

		const { needsSync, newRoutes, updatedRoutes } = checkResult.value;

		if (!needsSync) {
			syncInProgress = false;
			return ok(null);
		}

		console.log(`🔄 Auto-syncing permissions: ${newRoutes.length} new routes, ${updatedRoutes.length} updated routes`);

		// Perform sync
		const syncResult = await permissionSyncService.syncPermissionsToDatabase();

		syncInProgress = false;

		if (!syncResult.success) {
			return err(syncResult.error);
		}

		console.log(`✅ Permissions synced: ${syncResult.value.created} created, ${syncResult.value.updated} updated`);

		return ok({
			...syncResult.value,
			newRoutes,
			updatedRoutes
		});
	} catch (error) {
		syncInProgress = false;
		console.error('Auto-sync permissions error:', error);
		return err(new NetworkError('Failed to auto-sync permissions', 500));
	}
}

/**
 * Reset the sync check flag (useful for testing or manual triggers)
 */
export function resetSyncCheck(): void {
	syncChecked = false;
}

