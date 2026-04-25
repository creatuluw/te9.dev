/**
 * Users API endpoint - Get all users with filtering
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as userManagementService from '$lib/services/userManagementService';
import { getUserMessage } from '$lib/types/errors';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
import { hasPermission } from '$lib/services/authService';

/**
 * GET /api/users - Get all users
 * Query params: search, is_active, page, limit
 */
export const GET: RequestHandler = async ({ request, url }) => {
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

    // Check permission (allow either /admin/users or /admin/gebruikers)
    const canReadUsers = await hasPermission(tokenResult.value.userId, '/admin/users', 'read');
    const canReadGebruikers = await hasPermission(tokenResult.value.userId, '/admin/gebruikers', 'read');
    if (!canReadUsers && !canReadGebruikers) {
      return json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Extract query parameters
    const search = url.searchParams.get('search') || undefined;
    const isActiveParam = url.searchParams.get('is_active');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Parse is_active parameter
    let is_active: boolean | undefined = undefined;
    if (isActiveParam === 'true') {
      is_active = true;
    } else if (isActiveParam === 'false') {
      is_active = false;
    }

    // Call service (service expects isActive and offset, not is_active and page)
    const result = await userManagementService.getAllUsers({
      search,
      isActive: is_active,
      limit,
      offset: page > 1 ? (page - 1) * limit : undefined
    });

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
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Get users endpoint error:', error);
    return json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
};

