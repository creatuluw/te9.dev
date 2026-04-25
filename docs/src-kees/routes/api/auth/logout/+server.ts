/**
 * POST /api/auth/logout - User logout endpoint
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as authService from '$lib/services/authService';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
import { getUserMessage } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return json(
        { success: false, error: 'No authorization token provided' },
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

    const payload = tokenResult.value;

    // Logout (invalidate session)
    const result = await authService.logout(payload.sessionId);

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 400 }
      );
    }

    // Clear auth_token cookie
    cookies.delete('auth_token', { path: '/' });

    return json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout endpoint error:', error);
    return json(
      { success: false, error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
};

