/**
 * POST /api/auth/sync-cookie - Sync auth token cookie for existing authenticated sessions
 * This endpoint sets the auth_token cookie if the user is already authenticated
 * (useful for users who logged in before the cookie was being set)
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
import { getUserMessage } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // Extract and verify token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return json(
        { success: false, error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    // Verify token is valid
    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return json(
        { success: false, error: getUserMessage(tokenResult.error) },
        { status: 401 }
      );
    }

    // Token is valid - set the cookie
    cookies.set('auth_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days (matches token expiration)
    });

    return json({
      success: true,
      message: 'Cookie synced successfully'
    });

  } catch (error) {
    console.error('Sync cookie endpoint error:', error);
    return json(
      { success: false, error: 'An error occurred while syncing cookie' },
      { status: 500 }
    );
  }
};

