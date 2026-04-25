/**
 * GET/POST /api/auth/permissions - List permissions and create new permission
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as roleService from '$lib/services/roleService';
import * as permissionSyncService from '$lib/services/permissionSyncService';
import * as autoSyncPermissions from '$lib/services/autoSyncPermissions';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
import { hasPermission } from '$lib/services/authService';
import { getUserMessage } from '$lib/types/errors';
import { getAllAvailableRoutes } from '$lib/config/routes';
import { queryTableResult } from '$lib/utils/postgrest';
import type { Permission } from '$lib/schemas/auth';

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return json({ success: false, error: getUserMessage(tokenResult.error) }, { status: 401 });
    }

    const canRead = await hasPermission(tokenResult.value.userId, '/admin/permissions', 'read');
    if (!canRead) {
      return json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Check if sync status is requested
    const checkSync = url.searchParams.get('checkSync') === 'true';
    
    if (checkSync) {
      // Check for new routes without syncing
      const routes = (await getAllAvailableRoutes()).filter(r => !r.isPublic);
      const existingPermsResult = await queryTableResult<Permission>('_auth_permissions', {});
      
      if (!existingPermsResult.success) {
        return json({ success: false, error: getUserMessage(existingPermsResult.error) }, { status: 400 });
      }

      const existingRoutes = new Set(existingPermsResult.value.data.map(p => p.route));
      const routePaths = new Set(routes.map(r => r.path));
      
      const newRoutes = routes
        .filter(r => !existingRoutes.has(r.path))
        .map(r => r.path);

      return json({ 
        success: true, 
        data: {
          needsSync: newRoutes.length > 0,
          newRoutes,
          totalRoutes: routes.length,
          existingPermissions: existingPermsResult.value.data.length
        }
      });
    }

    // Regular GET - return all permissions
    const result = await roleService.getAllPermissions();

    if (!result.success) {
      return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
    }

    return json({ success: true, data: result.value });

  } catch (error) {
    console.error('Get permissions endpoint error:', error);
    return json({ success: false, error: 'An error occurred' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return json({ success: false, error: getUserMessage(tokenResult.error) }, { status: 401 });
    }

    const canWrite = await hasPermission(tokenResult.value.userId, '/admin/permissions', 'write');
    if (!canWrite) {
      return json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = await roleService.createPermission(body, tokenResult.value.userId);

    if (!result.success) {
      return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
    }

    return json({ success: true, data: result.value }, { status: 201 });

  } catch (error) {
    console.error('Create permission endpoint error:', error);
    return json({ success: false, error: 'An error occurred' }, { status: 500 });
  }
};

// PUT - Sync permissions from routes.ts to database
// Supports query param ?auto=true to use auto-sync (only syncs if new routes detected)
export const PUT: RequestHandler = async ({ request, url }) => {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return json({ success: false, error: getUserMessage(tokenResult.error) }, { status: 401 });
    }

    // Only admins can sync permissions
    const isAdmin = tokenResult.value.is_sysadmin || tokenResult.value.roles.includes('Admin');
    if (!isAdmin) {
      return json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Check if auto-sync is requested
    const useAutoSync = url.searchParams.get('auto') === 'true';
    
    if (useAutoSync) {
      // Use auto-sync (only syncs if new routes detected)
      const result = await autoSyncPermissions.autoSyncPermissions(true);

      if (!result.success) {
        return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
      }

      if (!result.value) {
        return json({ 
          success: true, 
          data: { created: 0, updated: 0, total: 0 },
          message: 'No new routes detected - permissions are up to date'
        });
      }

      return json({ 
        success: true, 
        data: result.value,
        message: `Auto-synced permissions: ${result.value.created} created, ${result.value.updated} updated. New routes: ${result.value.newRoutes.length}, Updated routes: ${result.value.updatedRoutes.length}`
      });
    } else {
      // Full sync (always syncs all routes)
      const result = await permissionSyncService.syncPermissionsToDatabase();

      if (!result.success) {
        return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
      }

      return json({ 
        success: true, 
        data: result.value,
        message: `Synced permissions: ${result.value.created} created, ${result.value.updated} updated, ${result.value.total} total routes`
      });
    }

  } catch (error) {
    console.error('Sync permissions endpoint error:', error);
    return json({ success: false, error: 'An error occurred' }, { status: 500 });
  }
};

