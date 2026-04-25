/**
 * POST /api/auth/refresh - Refresh access token
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as authService from '$lib/services/authService';
import { getUserMessage } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return json(
        { success: false, error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Refresh token
    const result = await authService.refreshAccessToken(refreshToken);

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 401 }
      );
    }

    return json({
      success: true,
      data: result.value
    });

  } catch (error) {
    console.error('Refresh token endpoint error:', error);
    return json(
      { success: false, error: 'An error occurred during token refresh' },
      { status: 500 }
    );
  }
};

