/**
 * Public Users API endpoint - Get all users (read-only, for authenticated users)
 * This endpoint allows all authenticated users to fetch a list of users for selection purposes.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as userManagementService from '$lib/services/userManagementService';
import { getUserMessage } from '$lib/types/errors';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';

/**
 * GET /api/users/public - Get all users (authenticated users only, no admin required)
 * Query params: search, limit
 */
export const GET: RequestHandler = async ({ request, url }) => {
  try {
    // Verify authentication (no permission check - just need to be logged in)
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

    // No permission check - all authenticated users can fetch users for selection

    // Extract query parameters (limited to search and limit only)
    const search = url.searchParams.get('search') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '1000'); // Default high limit to get all users

    // Skip search if query is too short (less than 2 characters) to avoid filter issues
    const searchTerm = search && search.trim().length >= 2 ? search.trim() : undefined;

    // Call service - only fetch active users for public endpoint
    const result = await userManagementService.getAllUsers({
      search: searchTerm,
      isActive: true, // Only show active users in public endpoint
      limit,
      offset: undefined
    });

    if (result.success) {
      return json({
        success: true,
        data: result.value
      });
    } else {
      console.error('[api/users/public] Error fetching users:', result.error);
      return json(
        {
          success: false,
          error: getUserMessage(result.error)
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Get public users endpoint error:', error);
    return json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
};

