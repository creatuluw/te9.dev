/**
 * User detail API endpoint
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as userManagementService from '$lib/services/userManagementService';
import { getUserMessage } from '$lib/types/errors';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
import { hasPermission } from '$lib/services/authService';

/**
 * GET /api/users/[id] - Get user by ID with roles
 */
export const GET: RequestHandler = async ({ params, request }) => {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return json(
        { success: false, error: getUserMessage(tokenResult.error) },
        { status: 401 }
      );
    }

    // Check permission
    const canRead = await hasPermission(tokenResult.value.userId, '/admin/users', 'read');
    if (!canRead) {
      return json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;
    const result = await userManagementService.getUserById(id);

    if (result.success) {
      return json({
        success: true,
        data: result.value
      });
    } else {
      return json(
        {
          success: false,
          error: getUserMessage(result.error)
        },
        { status: result.error.name === 'NotFoundError' ? 404 : 400 }
      );
    }
  } catch (error) {
    console.error('Get user endpoint error:', error);
    return json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
};

/**
 * POST /api/users/[id] - Activate/deactivate user
 */
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return json(
        { success: false, error: getUserMessage(tokenResult.error) },
        { status: 401 }
      );
    }

    // Check permission
    const canWrite = await hasPermission(tokenResult.value.userId, '/admin/users', 'write');
    if (!canWrite) {
      return json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'activate') {
      const result = await userManagementService.activateUser(id);
      
      if (result.success) {
        return json({ success: true });
      } else {
        return json(
          {
            success: false,
            error: getUserMessage(result.error)
          },
          { status: 400 }
        );
      }
    } else if (action === 'deactivate') {
      const result = await userManagementService.deactivateUser(id);
      
      if (result.success) {
        return json({ success: true });
      } else {
        return json(
          {
            success: false,
            error: getUserMessage(result.error)
          },
          { status: 400 }
        );
      }
    }

    return json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('User action endpoint error:', error);
    return json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
};

/**
 * DELETE /api/users/[id] - Permanently delete user (move to _auth_users_deleted)
 */
export const DELETE: RequestHandler = async ({ params, request }) => {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return json(
        { success: false, error: getUserMessage(tokenResult.error) },
        { status: 401 }
      );
    }

    // Check permission - require delete permission
    const canDelete = await hasPermission(tokenResult.value.userId, '/admin/users', 'delete');
    if (!canDelete) {
      return json(
        { success: false, error: 'Forbidden - Insufficient permissions to delete users' },
        { status: 403 }
      );
    }

    const { id } = params;
    
    // Prevent users from deleting themselves
    if (id === tokenResult.value.userId) {
      return json(
        { success: false, error: 'Je kunt jezelf niet verwijderen' },
        { status: 400 }
      );
    }

    // Parse request body for optional deletion reason
    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch {
      // No body or invalid JSON - that's okay, reason is optional
    }

    // Permanently delete user (move to deleted table)
    const result = await userManagementService.deleteUserPermanently(
      id,
      tokenResult.value.userId,
      reason
    );

    if (result.success) {
      return json({ success: true });
    } else {
      return json(
        {
          success: false,
          error: getUserMessage(result.error)
        },
        { status: result.error.name === 'NotFoundError' ? 404 : 400 }
      );
    }
  } catch (error) {
    console.error('Delete user endpoint error:', error);
    return json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
};

